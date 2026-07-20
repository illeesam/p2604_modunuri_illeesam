package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimItemStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemStatusHistRepositoryImpl implements QOdhClaimItemStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemStatusHistRepositoryImpl";
    private static final QOdhClaimItemStatusHist odhClaimItemStatusHist = QOdhClaimItemStatusHist.odhClaimItemStatusHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgUserId", odhClaimItemStatusHist.chgUserId),
        Map.entry("claimId", odhClaimItemStatusHist.claimId),
        Map.entry("claimItemId", odhClaimItemStatusHist.claimItemId),
        Map.entry("claimItemStatusCd", odhClaimItemStatusHist.claimItemStatusCd),
        Map.entry("claimItemStatusCdBefore", odhClaimItemStatusHist.claimItemStatusCdBefore),
        Map.entry("claimItemStatusHistId", odhClaimItemStatusHist.claimItemStatusHistId),
        Map.entry("memo", odhClaimItemStatusHist.memo),
        Map.entry("orderItemId", odhClaimItemStatusHist.orderItemId),
        Map.entry("siteId", odhClaimItemStatusHist.siteId),
        Map.entry("statusReason", odhClaimItemStatusHist.statusReason)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CLAIM_ITEM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
     */
    private JPAQuery<OdhClaimItemStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemStatusHistDto.Item.class,
                        odhClaimItemStatusHist.claimItemStatusHistId,   // 클레임상품상태이력ID (YYMMDDhhmmss+rand4)
                        odhClaimItemStatusHist.siteId,                  // 사이트ID
                        odhClaimItemStatusHist.claimItemId,             // 클레임상품ID (od_claim_item.claim_item_id)
                        odhClaimItemStatusHist.claimId,                 // 클레임ID (od_claim.claim_id)
                        odhClaimItemStatusHist.orderItemId,             // 주문상품ID (od_order_item.order_item_id)
                        odhClaimItemStatusHist.claimItemStatusCdBefore, // 변경 전 클레임상품상태 — CLAIM_ITEM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
                        odhClaimItemStatusHist.claimItemStatusCd,       // 변경 후 클레임상품상태 — CLAIM_ITEM_STATUS (동일 코드그룹)
                        odhClaimItemStatusHist.statusReason,            // 상태 변경 사유
                        odhClaimItemStatusHist.chgUserId,               // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhClaimItemStatusHist.chgDate,                 // 변경 일시
                        odhClaimItemStatusHist.memo,                    // 메모
                        odhClaimItemStatusHist.regBy, odhClaimItemStatusHist.regDate, odhClaimItemStatusHist.updBy, odhClaimItemStatusHist.updDate))
                .from(odhClaimItemStatusHist);
    }

    /* 클레임 아이템 상태 이력 키조회 */
    @Override
    public Optional<OdhClaimItemStatusHistDto.Item> selectById(String id) {
        OdhClaimItemStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimItemStatusHist.claimItemStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 상태 이력 목록조회 */
    @Override
    public List<OdhClaimItemStatusHistDto.Item> selectList(OdhClaimItemStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhClaimItemStatusHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhClaimItemStatusHist.claimItemStatusHistId, search.getClaimItemStatusHistId()),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 클레임 아이템 상태 이력 페이지조회 */
    @Override
    public OdhClaimItemStatusHistDto.PageResponse selectPageData(OdhClaimItemStatusHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhClaimItemStatusHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhClaimItemStatusHist.claimItemStatusHistId, search.getClaimItemStatusHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhClaimItemStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhClaimItemStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimItemStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhClaimItemStatusHistDto.PageResponse res = new OdhClaimItemStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhClaimItemStatusHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhClaimItemStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhClaimItemStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemStatusHist.claimItemStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemStatusHist.claimItemStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhClaimItemStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemStatusHist.claimItemStatusHistId));
        }
        return orders;
    }

    /* 클레임 아이템 상태 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemStatusHist entity) {
        if (entity.getClaimItemStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimItemStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(odhClaimItemStatusHist.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimItemId()             != null) { update.set(odhClaimItemStatusHist.claimItemId,             entity.getClaimItemId());             hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(odhClaimItemStatusHist.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odhClaimItemStatusHist.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(odhClaimItemStatusHist.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(odhClaimItemStatusHist.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getStatusReason()            != null) { update.set(odhClaimItemStatusHist.statusReason,            entity.getStatusReason());            hasAny = true; }
        if (entity.getChgUserId()               != null) { update.set(odhClaimItemStatusHist.chgUserId,               entity.getChgUserId());               hasAny = true; }
        if (entity.getChgDate()                 != null) { update.set(odhClaimItemStatusHist.chgDate,                 entity.getChgDate());                 hasAny = true; }
        if (entity.getMemo()                    != null) { update.set(odhClaimItemStatusHist.memo,                    entity.getMemo());                    hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odhClaimItemStatusHist.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhClaimItemStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimItemStatusHist.claimItemStatusHistId.eq(entity.getClaimItemStatusHistId())).execute();
        return (int) affected;
    }
}

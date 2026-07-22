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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhDlivStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivStatusHistRepositoryImpl implements QOdhDlivStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivStatusHistRepositoryImpl";
    private static final QOdhDlivStatusHist odhDlivStatusHist = QOdhDlivStatusHist.odhDlivStatusHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgUserId", odhDlivStatusHist.chgUserId),
        Map.entry("dlivId", odhDlivStatusHist.dlivId),
        Map.entry("dlivStatusCd", odhDlivStatusHist.dlivStatusCd),
        Map.entry("dlivStatusCdBefore", odhDlivStatusHist.dlivStatusCdBefore),
        Map.entry("dlivStatusHistId", odhDlivStatusHist.dlivStatusHistId),
        Map.entry("memo", odhDlivStatusHist.memo),
        Map.entry("orderId", odhDlivStatusHist.orderId),
        Map.entry("siteId", odhDlivStatusHist.siteId),
        Map.entry("statusReason", odhDlivStatusHist.statusReason)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DLIV_STATUS  {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
     */
    private JPAQuery<OdhDlivStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivStatusHistDto.Item.class,
                        odhDlivStatusHist.dlivStatusHistId,   // 배송상태이력ID (YYMMDDhhmmss+rand4)
                        odhDlivStatusHist.siteId,              // 사이트ID
                        odhDlivStatusHist.dlivId,              // 배송ID (od_dliv.dliv_id)
                        odhDlivStatusHist.orderId,             // 주문ID (od_order.order_id)
                        odhDlivStatusHist.dlivStatusCdBefore,  // 변경 전 배송상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odhDlivStatusHist.dlivStatusCd,        // 변경 후 배송상태 — DLIV_STATUS (동일 코드그룹)
                        odhDlivStatusHist.statusReason,        // 상태 변경 사유
                        odhDlivStatusHist.chgUserId,           // 변경 담당자 (sy_user.user_id, mb_member.member_id)
                        odhDlivStatusHist.chgDate,             // 변경 일시
                        odhDlivStatusHist.memo,                // 메모
                        odhDlivStatusHist.regBy, odhDlivStatusHist.regDate, odhDlivStatusHist.updBy, odhDlivStatusHist.updDate))
                .from(odhDlivStatusHist);
    }

    /* 배송 상태 이력 키조회 */
    @Override
    public Optional<OdhDlivStatusHistDto.Item> selectById(String id) {
        OdhDlivStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivStatusHist.dlivStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 상태 이력 목록조회 */
    @Override
    public List<OdhDlivStatusHistDto.Item> selectList(OdhDlivStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhDlivStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhDlivStatusHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhDlivStatusHist.dlivStatusHistId, search.getDlivStatusHistId()),
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

    /* 배송 상태 이력 페이지조회 */
    @Override
    public OdhDlivStatusHistDto.PageResponse selectPageData(OdhDlivStatusHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhDlivStatusHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhDlivStatusHist.dlivStatusHistId, search.getDlivStatusHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhDlivStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhDlivStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhDlivStatusHistDto.PageResponse res = new OdhDlivStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdhDlivStatusHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhDlivStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhDlivStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivStatusHist.dlivStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivStatusHist.dlivStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhDlivStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhDlivStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhDlivStatusHist.dlivStatusHistId));
        }
        return orders;
    }

    /* 배송 상태 이력 수정 */
    @Override
    public int updateSelective(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(odhDlivStatusHist.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getDlivId()             != null) { update.set(odhDlivStatusHist.dlivId,             entity.getDlivId());             hasAny = true; }
        if (entity.getOrderId()            != null) { update.set(odhDlivStatusHist.orderId,            entity.getOrderId());            hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(odhDlivStatusHist.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getDlivStatusCd()       != null) { update.set(odhDlivStatusHist.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getStatusReason()       != null) { update.set(odhDlivStatusHist.statusReason,       entity.getStatusReason());       hasAny = true; }
        if (entity.getChgUserId()          != null) { update.set(odhDlivStatusHist.chgUserId,          entity.getChgUserId());          hasAny = true; }
        if (entity.getChgDate()            != null) { update.set(odhDlivStatusHist.chgDate,            entity.getChgDate());            hasAny = true; }
        if (entity.getMemo()               != null) { update.set(odhDlivStatusHist.memo,               entity.getMemo());               hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(odhDlivStatusHist.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhDlivStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivStatusHist.dlivStatusHistId.eq(entity.getDlivStatusHistId())).execute();
        return (int) affected;
    }
}

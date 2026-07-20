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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhClaimItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhClaimItemChgHistRepositoryImpl implements QOdhClaimItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhClaimItemChgHistRepositoryImpl";
    private static final QOdhClaimItemChgHist odhClaimItemChgHist = QOdhClaimItemChgHist.odhClaimItemChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", odhClaimItemChgHist.afterVal),
        Map.entry("beforeVal", odhClaimItemChgHist.beforeVal),
        Map.entry("chgField", odhClaimItemChgHist.chgField),
        Map.entry("chgReason", odhClaimItemChgHist.chgReason),
        Map.entry("chgTypeCd", odhClaimItemChgHist.chgTypeCd),
        Map.entry("chgUserId", odhClaimItemChgHist.chgUserId),
        Map.entry("claimId", odhClaimItemChgHist.claimId),
        Map.entry("claimItemChgHistId", odhClaimItemChgHist.claimItemChgHistId),
        Map.entry("claimItemId", odhClaimItemChgHist.claimItemId),
        Map.entry("siteId", odhClaimItemChgHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_claim_item 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   QTY:수량변경, AMOUNT:금액변경, REASON:사유변경, STATUS:상태변경, REFUND_AMT:환불금액변경
     */
    private JPAQuery<OdhClaimItemChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhClaimItemChgHistDto.Item.class,
                        odhClaimItemChgHist.claimItemChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhClaimItemChgHist.siteId,             // 사이트ID
                        odhClaimItemChgHist.claimId,            // 클레임ID (od_claim.)
                        odhClaimItemChgHist.claimItemId,        // 클레임품목ID (od_claim_item.)
                        odhClaimItemChgHist.chgTypeCd,          // 변경유형코드 — CHG_TYPE {QTY:수량변경, AMOUNT:금액변경, REASON:사유변경, STATUS:상태변경, REFUND_AMT:환불금액변경}
                        odhClaimItemChgHist.chgField,           // 변경 필드명
                        odhClaimItemChgHist.beforeVal,          // 변경전값
                        odhClaimItemChgHist.afterVal,           // 변경후값
                        odhClaimItemChgHist.chgReason,          // 변경사유
                        odhClaimItemChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        odhClaimItemChgHist.chgDate,            // 처리일시
                        odhClaimItemChgHist.regBy, odhClaimItemChgHist.regDate, odhClaimItemChgHist.updBy, odhClaimItemChgHist.updDate))
                .from(odhClaimItemChgHist);
    }

    /* 클레임 아이템 변경 이력 키조회 */
    @Override
    public Optional<OdhClaimItemChgHistDto.Item> selectById(String id) {
        OdhClaimItemChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhClaimItemChgHist.claimItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 변경 이력 목록조회 */
    @Override
    public List<OdhClaimItemChgHistDto.Item> selectList(OdhClaimItemChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhClaimItemChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhClaimItemChgHist.claimItemChgHistId, search.getClaimItemChgHistId()),
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

    /* 클레임 아이템 변경 이력 페이지조회 */
    @Override
    public OdhClaimItemChgHistDto.PageResponse selectPageData(OdhClaimItemChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhClaimItemChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhClaimItemChgHist.claimItemChgHistId, search.getClaimItemChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhClaimItemChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhClaimItemChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhClaimItemChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhClaimItemChgHistDto.PageResponse res = new OdhClaimItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhClaimItemChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhClaimItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhClaimItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemChgHist.claimItemChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemChgHist.claimItemChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhClaimItemChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhClaimItemChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhClaimItemChgHist.claimItemChgHistId));
        }
        return orders;
    }

    /* 클레임 아이템 변경 이력 수정 */
    @Override
    public int updateSelective(OdhClaimItemChgHist entity) {
        if (entity.getClaimItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhClaimItemChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(odhClaimItemChgHist.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getClaimId()     != null) { update.set(odhClaimItemChgHist.claimId,     entity.getClaimId());     hasAny = true; }
        if (entity.getClaimItemId() != null) { update.set(odhClaimItemChgHist.claimItemId, entity.getClaimItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(odhClaimItemChgHist.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(odhClaimItemChgHist.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(odhClaimItemChgHist.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(odhClaimItemChgHist.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(odhClaimItemChgHist.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(odhClaimItemChgHist.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(odhClaimItemChgHist.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odhClaimItemChgHist.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhClaimItemChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhClaimItemChgHist.claimItemChgHistId.eq(entity.getClaimItemChgHistId())).execute();
        return (int) affected;
    }
}

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderChgHistRepositoryImpl implements QOdhOrderChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderChgHistRepositoryImpl";
    private static final QOdhOrderChgHist odhOrderChgHist = QOdhOrderChgHist.odhOrderChgHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("afterVal", odhOrderChgHist.afterVal),
        Map.entry("beforeVal", odhOrderChgHist.beforeVal),
        Map.entry("chgField", odhOrderChgHist.chgField),
        Map.entry("chgReason", odhOrderChgHist.chgReason),
        Map.entry("chgTypeCd", odhOrderChgHist.chgTypeCd),
        Map.entry("chgUserId", odhOrderChgHist.chgUserId),
        Map.entry("orderChgHistId", odhOrderChgHist.orderChgHistId),
        Map.entry("orderId", odhOrderChgHist.orderId),
        Map.entry("siteId", odhOrderChgHist.siteId)
    );

    /* 주문 변경 이력 baseSelColumnQuery */
    private JPAQuery<OdhOrderChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderChgHistDto.Item.class,
                        odhOrderChgHist.orderChgHistId, odhOrderChgHist.siteId, odhOrderChgHist.orderId,
                        odhOrderChgHist.chgTypeCd, odhOrderChgHist.chgField, odhOrderChgHist.beforeVal, odhOrderChgHist.afterVal,
                        odhOrderChgHist.chgReason, odhOrderChgHist.chgUserId, odhOrderChgHist.chgDate,
                        odhOrderChgHist.regBy, odhOrderChgHist.regDate, odhOrderChgHist.updBy, odhOrderChgHist.updDate))
                .from(odhOrderChgHist);
    }

    /* 주문 변경 이력 키조회 */
    @Override
    public Optional<OdhOrderChgHistDto.Item> selectById(String id) {
        OdhOrderChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderChgHist.orderChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 변경 이력 목록조회 */
    @Override
    public List<OdhOrderChgHistDto.Item> selectList(OdhOrderChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhOrderChgHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhOrderChgHist.orderChgHistId, search.getOrderChgHistId()),
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

    /* 주문 변경 이력 페이지조회 */
    @Override
    public OdhOrderChgHistDto.PageResponse selectPageData(OdhOrderChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhOrderChgHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhOrderChgHist.orderChgHistId, search.getOrderChgHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhOrderChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhOrderChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderChgHist.count())
                .where(wheres)
                .fetchOne();

        OdhOrderChgHistDto.PageResponse res = new OdhOrderChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhOrderChgHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhOrderChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderChgHist.orderChgHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderChgHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderChgHist.orderChgHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderChgHist.orderChgHistId));
        }
        return orders;
    }

    /* 주문 변경 이력 수정 */
    @Override
    public int updateSelective(OdhOrderChgHist entity) {
        if (entity.getOrderChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderChgHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(odhOrderChgHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getOrderId()    != null) { update.set(odhOrderChgHist.orderId,    entity.getOrderId());    hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhOrderChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhOrderChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhOrderChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhOrderChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhOrderChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhOrderChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhOrderChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhOrderChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderChgHist.orderChgHistId.eq(entity.getOrderChgHistId())).execute();
        return (int) affected;
    }
}

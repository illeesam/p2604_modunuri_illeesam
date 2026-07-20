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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdhOrderItemStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemStatusHistRepositoryImpl implements QOdhOrderItemStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhOrderItemStatusHistRepositoryImpl";
    private static final QOdhOrderItemStatusHist odhOrderItemStatusHist = QOdhOrderItemStatusHist.odhOrderItemStatusHist;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chgUserId", odhOrderItemStatusHist.chgUserId),
        Map.entry("memo", odhOrderItemStatusHist.memo),
        Map.entry("orderId", odhOrderItemStatusHist.orderId),
        Map.entry("orderItemId", odhOrderItemStatusHist.orderItemId),
        Map.entry("orderItemStatusCd", odhOrderItemStatusHist.orderItemStatusCd),
        Map.entry("orderItemStatusCdBefore", odhOrderItemStatusHist.orderItemStatusCdBefore),
        Map.entry("orderItemStatusHistId", odhOrderItemStatusHist.orderItemStatusHistId),
        Map.entry("siteId", odhOrderItemStatusHist.siteId),
        Map.entry("statusReason", odhOrderItemStatusHist.statusReason)
    );

    /* 주문 아이템 상태 이력 baseSelColumnQuery */
    private JPAQuery<OdhOrderItemStatusHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemStatusHistDto.Item.class,
                        odhOrderItemStatusHist.orderItemStatusHistId, odhOrderItemStatusHist.siteId, odhOrderItemStatusHist.orderItemId, odhOrderItemStatusHist.orderId,
                        odhOrderItemStatusHist.orderItemStatusCdBefore, odhOrderItemStatusHist.orderItemStatusCd, odhOrderItemStatusHist.statusReason,
                        odhOrderItemStatusHist.chgUserId, odhOrderItemStatusHist.chgDate, odhOrderItemStatusHist.memo,
                        odhOrderItemStatusHist.regBy, odhOrderItemStatusHist.regDate, odhOrderItemStatusHist.updBy, odhOrderItemStatusHist.updDate))
                .from(odhOrderItemStatusHist);
    }

    /* 주문 아이템 상태 이력 키조회 */
    @Override
    public Optional<OdhOrderItemStatusHistDto.Item> selectById(String id) {
        OdhOrderItemStatusHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhOrderItemStatusHist.orderItemStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 주문 아이템 상태 이력 목록조회 */
    @Override
    public List<OdhOrderItemStatusHistDto.Item> selectList(OdhOrderItemStatusHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemStatusHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odhOrderItemStatusHist.siteId, search.getSiteId()),
                    QdslUtil.strEq(odhOrderItemStatusHist.orderItemStatusHistId, search.getOrderItemStatusHistId()),
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

    /* 주문 아이템 상태 이력 페이지조회 */
    @Override
    public OdhOrderItemStatusHistDto.PageResponse selectPageData(OdhOrderItemStatusHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odhOrderItemStatusHist.siteId, search.getSiteId()),
                QdslUtil.strEq(odhOrderItemStatusHist.orderItemStatusHistId, search.getOrderItemStatusHistId()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdhOrderItemStatusHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdhOrderItemStatusHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhOrderItemStatusHist.count())
                .where(wheres)
                .fetchOne();

        OdhOrderItemStatusHistDto.PageResponse res = new OdhOrderItemStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdhOrderItemStatusHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhOrderItemStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odhOrderItemStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemStatusHist.orderItemStatusHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderItemStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemStatusHist.orderItemStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odhOrderItemStatusHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odhOrderItemStatusHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odhOrderItemStatusHist.orderItemStatusHistId));
        }
        return orders;
    }

    /* 주문 아이템 상태 이력 수정 */
    @Override
    public int updateSelective(OdhOrderItemStatusHist entity) {
        if (entity.getOrderItemStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhOrderItemStatusHist);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(odhOrderItemStatusHist.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odhOrderItemStatusHist.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getOrderId()                 != null) { update.set(odhOrderItemStatusHist.orderId,                 entity.getOrderId());                 hasAny = true; }
        if (entity.getOrderItemStatusCdBefore() != null) { update.set(odhOrderItemStatusHist.orderItemStatusCdBefore, entity.getOrderItemStatusCdBefore()); hasAny = true; }
        if (entity.getOrderItemStatusCd()       != null) { update.set(odhOrderItemStatusHist.orderItemStatusCd,       entity.getOrderItemStatusCd());       hasAny = true; }
        if (entity.getStatusReason()            != null) { update.set(odhOrderItemStatusHist.statusReason,            entity.getStatusReason());            hasAny = true; }
        if (entity.getChgUserId()               != null) { update.set(odhOrderItemStatusHist.chgUserId,               entity.getChgUserId());               hasAny = true; }
        if (entity.getChgDate()                 != null) { update.set(odhOrderItemStatusHist.chgDate,                 entity.getChgDate());                 hasAny = true; }
        if (entity.getMemo()                    != null) { update.set(odhOrderItemStatusHist.memo,                    entity.getMemo());                    hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odhOrderItemStatusHist.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odhOrderItemStatusHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhOrderItemStatusHist.orderItemStatusHistId.eq(entity.getOrderItemStatusHistId())).execute();
        return (int) affected;
    }
}

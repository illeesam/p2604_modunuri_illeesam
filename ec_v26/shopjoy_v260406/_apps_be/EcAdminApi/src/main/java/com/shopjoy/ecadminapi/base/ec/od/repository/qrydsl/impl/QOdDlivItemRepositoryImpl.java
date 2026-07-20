package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdDlivItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivItemRepositoryImpl implements QOdDlivItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdDlivItemRepositoryImpl";
    private static final QOdDlivItem odDlivItem = QOdDlivItem.odDlivItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", odDlivItem.regDate,
        "upd_date", odDlivItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("dlivId", odDlivItem.dlivId),
        Map.entry("dlivItemId", odDlivItem.dlivItemId),
        Map.entry("dlivItemStatusCd", odDlivItem.dlivItemStatusCd),
        Map.entry("dlivItemStatusCdBefore", odDlivItem.dlivItemStatusCdBefore),
        Map.entry("dlivTypeCd", odDlivItem.dlivTypeCd),
        Map.entry("prodOptId1", odDlivItem.prodOptId1),
        Map.entry("prodOptId2", odDlivItem.prodOptId2),
        Map.entry("orderItemId", odDlivItem.orderItemId),
        Map.entry("prodId", odDlivItem.prodId),
        Map.entry("siteId", odDlivItem.siteId)
    );

    /* 배송 아이템 baseSelColumnQuery */
    private JPAQuery<OdDlivItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivItemDto.Item.class,
                        odDlivItem.dlivItemId, odDlivItem.siteId, odDlivItem.dlivId, odDlivItem.orderItemId,
                        odDlivItem.prodId, odDlivItem.prodOptId1, odDlivItem.prodOptId2,
                        odDlivItem.dlivTypeCd, odDlivItem.unitPrice, odDlivItem.dlivQty,
                        odDlivItem.dlivItemStatusCd, odDlivItem.dlivItemStatusCdBefore,
                        odDlivItem.regBy, odDlivItem.regDate, odDlivItem.updBy, odDlivItem.updDate
                ))
                .from(odDlivItem);
    }

    /* 배송 아이템 키조회 */
    @Override
    public Optional<OdDlivItemDto.Item> selectById(String dlivItemId) {
        OdDlivItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odDlivItem.dlivItemId.eq(dlivItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 목록조회 */
    @Override
    public List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(odDlivItem.dlivId, search.getDlivIds()),
                    QdslUtil.strEq(odDlivItem.dlivId, search.getDlivId()),
                    QdslUtil.strEq(odDlivItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(odDlivItem.dlivItemId, search.getDlivItemId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 배송 아이템 페이지조회 */
    @Override
    public OdDlivItemDto.PageResponse selectPageData(OdDlivItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(odDlivItem.dlivId, search.getDlivIds()),
                QdslUtil.strEq(odDlivItem.dlivId, search.getDlivId()),
                QdslUtil.strEq(odDlivItem.siteId, search.getSiteId()),
                QdslUtil.strEq(odDlivItem.dlivItemId, search.getDlivItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdDlivItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odDlivItem.count())
                .where(wheres)
                .fetchOne();

        OdDlivItemDto.PageResponse res = new OdDlivItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 배송 아이템 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdDlivItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdDlivItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odDlivItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odDlivItem.dlivItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDlivItem.dlivItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odDlivItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odDlivItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odDlivItem.dlivItemId));
        }
        return orders;
    }

    /* 배송 아이템 수정 */

    @Override
    public int updateSelective(OdDlivItem entity) {
        if (entity.getDlivItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odDlivItem);
        boolean hasAny = false;

        if (entity.getSiteId()                 != null) { update.set(odDlivItem.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getDlivId()                 != null) { update.set(odDlivItem.dlivId,                 entity.getDlivId());                 hasAny = true; }
        if (entity.getOrderItemId()            != null) { update.set(odDlivItem.orderItemId,            entity.getOrderItemId());            hasAny = true; }
        if (entity.getProdId()                 != null) { update.set(odDlivItem.prodId,                 entity.getProdId());                 hasAny = true; }
        if (entity.getProdOptId1()             != null) { update.set(odDlivItem.prodOptId1,             entity.getProdOptId1());             hasAny = true; }
        if (entity.getProdOptId2()             != null) { update.set(odDlivItem.prodOptId2,             entity.getProdOptId2());             hasAny = true; }
        if (entity.getDlivTypeCd()             != null) { update.set(odDlivItem.dlivTypeCd,             entity.getDlivTypeCd());             hasAny = true; }
        if (entity.getUnitPrice()              != null) { update.set(odDlivItem.unitPrice,              entity.getUnitPrice());              hasAny = true; }
        if (entity.getDlivQty()                != null) { update.set(odDlivItem.dlivQty,                entity.getDlivQty());                hasAny = true; }
        if (entity.getDlivItemStatusCd()       != null) { update.set(odDlivItem.dlivItemStatusCd,       entity.getDlivItemStatusCd());       hasAny = true; }
        if (entity.getDlivItemStatusCdBefore() != null) { update.set(odDlivItem.dlivItemStatusCdBefore, entity.getDlivItemStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(odDlivItem.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odDlivItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odDlivItem.dlivItemId.eq(entity.getDlivItemId())).execute();
        return (int) affected;
    }
}

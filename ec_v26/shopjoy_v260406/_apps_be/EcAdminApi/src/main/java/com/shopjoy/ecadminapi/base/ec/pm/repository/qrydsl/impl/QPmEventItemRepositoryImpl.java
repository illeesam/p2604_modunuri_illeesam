package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmEventItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventItemRepositoryImpl implements QPmEventItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventItemRepositoryImpl";
    private static final QPmEventItem pmEventItem = QPmEventItem.pmEventItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmEventItem.regDate,
        "upd_date", pmEventItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("eventId", pmEventItem.eventId),
        Map.entry("eventItemId", pmEventItem.eventItemId),
        Map.entry("siteId", pmEventItem.siteId),
        Map.entry("targetId", pmEventItem.targetId),
        Map.entry("targetTypeCd", pmEventItem.targetTypeCd)
    );

    /* 이벤트 대상 상품 baseSelColumnQuery */
    private JPAQuery<PmEventItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventItemDto.Item.class,
                        pmEventItem.eventItemId, pmEventItem.eventId, pmEventItem.siteId,
                        pmEventItem.targetTypeCd, pmEventItem.targetId, pmEventItem.sortNo,
                        pmEventItem.regBy, pmEventItem.regDate
                ))
                .from(pmEventItem);
    }

    /* 이벤트 대상 상품 키조회 */
    @Override
    public Optional<PmEventItemDto.Item> selectById(String eventItemId) {
        PmEventItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventItem.eventItemId.eq(eventItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 대상 상품 목록조회 */
    @Override
    public List<PmEventItemDto.Item> selectList(PmEventItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmEventItem.eventId, search.getEventIds()),
                    QdslUtil.strEq(pmEventItem.eventId, search.getEventId()),
                    QdslUtil.strEq(pmEventItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmEventItem.eventItemId, search.getEventItemId()),
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

    /* 이벤트 대상 상품 페이지조회 */
    @Override
    public PmEventItemDto.PageResponse selectPageData(PmEventItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmEventItem.eventId, search.getEventIds()),
                QdslUtil.strEq(pmEventItem.eventId, search.getEventId()),
                QdslUtil.strEq(pmEventItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pmEventItem.eventItemId, search.getEventItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmEventItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmEventItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEventItem.count())
                .where(wheres)
                .fetchOne();

        PmEventItemDto.PageResponse res = new PmEventItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmEventItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmEventItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmEventItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventItem.eventItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("eventItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventItem.eventItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmEventItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventItem.eventItemId));
        }
        return orders;
    }

    /* 이벤트 대상 상품 수정 */

    @Override
    public int updateSelective(PmEventItem entity) {
        if (entity.getEventItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEventItem);
        boolean hasAny = false;

        if (entity.getEventId()     != null) { update.set(pmEventItem.eventId,     entity.getEventId());     hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(pmEventItem.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmEventItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmEventItem.targetId,    entity.getTargetId());    hasAny = true; }
        if (entity.getSortNo()      != null) { update.set(pmEventItem.sortNo,      entity.getSortNo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmEventItem.eventItemId.eq(entity.getEventItemId())).execute();
        return (int) affected;
    }
}

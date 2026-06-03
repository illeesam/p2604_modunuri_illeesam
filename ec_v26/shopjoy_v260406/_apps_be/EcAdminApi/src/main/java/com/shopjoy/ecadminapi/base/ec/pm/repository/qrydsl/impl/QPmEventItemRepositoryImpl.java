package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmEventItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventItemRepositoryImpl implements QPmEventItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventItemRepositoryImpl";
    private static final QPmEventItem pmEventItem = QPmEventItem.pmEventItem;

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
                    baseAndEventIds(search),
                    baseAndEventId(search),
                    baseAndSiteId(search),
                    baseAndEventItemId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 이벤트 대상 상품 페이지조회 */
    @Override
    public PmEventItemDto.PageResponse selectPageData(PmEventItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndEventIds(search),
                baseAndEventId(search),
                baseAndSiteId(search),
                baseAndEventItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmEventItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmEventItem.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(pmEventItem)
                .where(wheres)
                .fetchOne();

        PmEventItemDto.PageResponse res = new PmEventItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 이벤트 대상 상품 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* eventId IN */
    private BooleanExpression baseAndEventIds(PmEventItemDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getEventIds())
                ? pmEventItem.eventId.in(search.getEventIds()) : null;
    }

    /* eventId 정확 일치 */
    private BooleanExpression baseAndEventId(PmEventItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getEventId())
                ? pmEventItem.eventId.eq(search.getEventId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmEventItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmEventItem.siteId.eq(search.getSiteId()) : null;
    }

    /* eventItemId 정확 일치 */
    private BooleanExpression baseAndEventItemId(PmEventItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getEventItemId())
                ? pmEventItem.eventItemId.eq(search.getEventItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmEventItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmEventItem.regDate.goe(start).and(pmEventItem.regDate.lt(endExcl));
            case "upd_date": return pmEventItem.updDate.goe(start).and(pmEventItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmEventItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",eventId,", pmEventItem.eventId, pattern);
        or = orLike(or, all, types, ",eventItemId,", pmEventItem.eventItemId, pattern);
        or = orLike(or, all, types, ",siteId,", pmEventItem.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", pmEventItem.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", pmEventItem.targetTypeCd, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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

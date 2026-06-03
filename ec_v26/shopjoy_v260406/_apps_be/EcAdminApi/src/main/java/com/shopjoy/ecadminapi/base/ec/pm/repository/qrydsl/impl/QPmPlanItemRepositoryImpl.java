package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmPlanItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmPlanItemRepositoryImpl implements QPmPlanItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmPlanItemRepositoryImpl";
    private static final QPmPlanItem pmPlanItem   = QPmPlanItem.pmPlanItem;
    private static final QPmPlan     pmPlan = QPmPlan.pmPlan;
    private static final QPdProd     pdProd = QPdProd.pdProd;
    private static final QSySite     sySite = QSySite.sySite;

    /* 프로모션 플랜 아이템 baseSelColumnQuery */
    private JPAQuery<PmPlanItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanItemDto.Item.class,
                        pmPlanItem.planItemId, pmPlanItem.planId, pmPlanItem.siteId, pmPlanItem.prodId, pmPlanItem.sortOrd,
                        pmPlanItem.planItemMemo, pmPlanItem.regBy, pmPlanItem.regDate, pmPlanItem.updBy, pmPlanItem.updDate
                ))
                .from(pmPlanItem)
                .leftJoin(pmPlan).on(pmPlan.planId.eq(pmPlanItem.planId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmPlanItem.prodId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmPlanItem.siteId));
    }

    /* 프로모션 플랜 아이템 키조회 */
    @Override
    public Optional<PmPlanItemDto.Item> selectById(String planItemId) {
        PmPlanItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmPlanItem.planItemId.eq(planItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 프로모션 플랜 아이템 목록조회 */
    @Override
    public List<PmPlanItemDto.Item> selectList(PmPlanItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndPlanItemId(search),
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

    /* 프로모션 플랜 아이템 페이지조회 */
    @Override
    public PmPlanItemDto.PageResponse selectPageData(PmPlanItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndPlanItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmPlanItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmPlanItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmPlanItem.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(pmPlanItem)
                .where(wheres)
                .fetchOne();

        PmPlanItemDto.PageResponse res = new PmPlanItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 프로모션 플랜 아이템 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmPlanItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmPlanItem.siteId.eq(search.getSiteId()) : null;
    }

    /* planItemId 정확 일치 */
    private BooleanExpression baseAndPlanItemId(PmPlanItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getPlanItemId())
                ? pmPlanItem.planItemId.eq(search.getPlanItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmPlanItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmPlanItem.regDate.goe(start).and(pmPlanItem.regDate.lt(endExcl));
            case "upd_date": return pmPlanItem.updDate.goe(start).and(pmPlanItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmPlanItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",planId,", pmPlanItem.planId, pattern);
        or = orLike(or, all, types, ",planItemId,", pmPlanItem.planItemId, pattern);
        or = orLike(or, all, types, ",planItemMemo,", pmPlanItem.planItemMemo, pattern);
        or = orLike(or, all, types, ",prodId,", pmPlanItem.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pmPlanItem.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmPlanItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.planItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("planItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmPlanItem.planItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmPlanItem.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pmPlanItem.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlanItem.planItemId));
        }
        return orders;
    }

    /* 프로모션 플랜 아이템 수정 */
    @Override
    public int updateSelective(PmPlanItem entity) {
        if (entity.getPlanItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmPlanItem);
        boolean hasAny = false;

        if (entity.getPlanId()       != null) { update.set(pmPlanItem.planId,       entity.getPlanId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(pmPlanItem.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(pmPlanItem.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(pmPlanItem.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getPlanItemMemo() != null) { update.set(pmPlanItem.planItemMemo, entity.getPlanItemMemo()); hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(pmPlanItem.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmPlanItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmPlanItem.planItemId.eq(entity.getPlanItemId())).execute();
        return (int) affected;
    }
}

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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmPlanItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmPlanItemRepositoryImpl implements QPmPlanItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmPlanItemRepositoryImpl";
    private static final QPmPlanItem pmPlanItem   = QPmPlanItem.pmPlanItem;
    private static final QPmPlan     pmPlan = QPmPlan.pmPlan;
    private static final QPdProd     pdProd = QPdProd.pdProd;
    private static final QSySite     sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmPlanItem.regDate,
        "upd_date", pmPlanItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("planId", pmPlanItem.planId),
        Map.entry("planItemId", pmPlanItem.planItemId),
        Map.entry("planItemMemo", pmPlanItem.planItemMemo),
        Map.entry("prodId", pmPlanItem.prodId),
        Map.entry("siteId", pmPlanItem.siteId)
    );

    /* 프로모션 플랜 아이템 baseSelColumnQuery — 코드성 필드 없음 (상품 매핑·진열순서·메모만 보유) */
    private JPAQuery<PmPlanItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanItemDto.Item.class,
                        pmPlanItem.planItemId,     // 기획전상품ID (PK)
                        pmPlanItem.planId,         // 기획전ID (pm_plan.plan_id)
                        pmPlanItem.siteId,         // 사이트ID
                        pmPlanItem.prodId,         // 상품ID (pd_prod.prod_id)
                        pmPlanItem.sortOrd,        // 정렬순서
                        pmPlanItem.planItemMemo,   // 항목 메모 (특가/한정수량 등)
                        pmPlanItem.regBy, pmPlanItem.regDate, pmPlanItem.updBy, pmPlanItem.updDate
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
                    QdslUtil.strEq(pmPlanItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmPlanItem.planItemId, search.getPlanItemId()),
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

    /* 프로모션 플랜 아이템 페이지조회 */
    @Override
    public PmPlanItemDto.PageResponse selectPageData(PmPlanItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmPlanItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pmPlanItem.planItemId, search.getPlanItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmPlanItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmPlanItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmPlanItem.count())
                .where(wheres)
                .fetchOne();

        PmPlanItemDto.PageResponse res = new PmPlanItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmPlanItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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

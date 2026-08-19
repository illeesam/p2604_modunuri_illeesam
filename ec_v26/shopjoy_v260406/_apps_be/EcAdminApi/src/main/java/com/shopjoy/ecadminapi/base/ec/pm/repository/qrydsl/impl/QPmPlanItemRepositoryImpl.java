package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
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
    private static final QSySite     sySite = QSySite.sySite;    /* 프로모션 플랜 아이템 baseSelColumnQuery — 코드성 필드 없음 (상품 매핑·진열순서·메모만 보유) */
    private JPAQuery<PmPlanItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanItemDto.Item.class,
                        pmPlanItem.planItemId,     // 기획전상품ID (PK)
                        pmPlanItem.planId,         // 기획전ID (pm_plan.plan_id)
                        pmPlanItem.prodId,         // 상품ID (pd_prod.prod_id)
                        pmPlanItem.sortOrd,        // 정렬순서
                        pmPlanItem.planItemMemo,   // 항목 메모 (특가/한정수량 등)
                        pmPlanItem.regBy, pmPlanItem.regDate, pmPlanItem.updBy, pmPlanItem.updDate
                ))
                .from(pmPlanItem)
                .leftJoin(pmPlan).on(pmPlan.planId.eq(pmPlanItem.planId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmPlanItem.prodId));
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
        DateTimePath<LocalDateTime> dateRangeField = pmPlanItem.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmPlanItem.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmPlanItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmPlanItem.planItemId, search.getPlanItemId()),
                    QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<PmPlanItemDto.Item> selectPageData(PmPlanItemDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmPlanItem.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmPlanItem.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmPlanItem.planItemId, search.getPlanItemId()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<PmPlanItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("planId", pmPlanItem.planId),
            QdslUtil.FieldDef.like("planItemId", pmPlanItem.planItemId),
            QdslUtil.FieldDef.like("planItemMemo", pmPlanItem.planItemMemo),
            QdslUtil.FieldDef.like("prodId", pmPlanItem.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("planItemId", pmPlanItem.planItemId,
                   "regDate", pmPlanItem.regDate,
                   "sortOrd", pmPlanItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmPlanItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmPlanItem.regDate),
        new OrderSpecifier<>(Order.ASC, pmPlanItem.planItemId));
    }

    /* 프로모션 플랜 아이템 수정 */
    @Override
    public int updateSelective(PmPlanItem entity) {
        if (entity.getPlanItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmPlanItem);
        boolean hasAny = false;

        if (entity.getPlanId()       != null) { update.set(pmPlanItem.planId,       entity.getPlanId());       hasAny = true; }
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

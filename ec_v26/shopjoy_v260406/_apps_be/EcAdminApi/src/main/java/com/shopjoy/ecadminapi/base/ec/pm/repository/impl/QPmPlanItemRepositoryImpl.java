package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmPlanItemRepository;
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
    private static final QPmPlanItem i   = QPmPlanItem.pmPlanItem;
    private static final QPmPlan     pla = QPmPlan.pmPlan;
    private static final QPdProd     prd = QPdProd.pdProd;
    private static final QSySite     ste = QSySite.sySite;

    private JPAQuery<PmPlanItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanItemDto.Item.class,
                        i.planItemId, i.planId, i.siteId, i.prodId, i.sortOrd,
                        i.planItemMemo, i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(pla).on(pla.planId.eq(i.planId))
                .leftJoin(prd).on(prd.prodId.eq(i.prodId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId));
    }

    @Override
    public Optional<PmPlanItemDto.Item> selectById(String planItemId) {
        PmPlanItemDto.Item dto = baseQuery()
                .where(i.planItemId.eq(planItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmPlanItemDto.Item> selectList(PmPlanItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanItemDto.Item> query = baseQuery().where(where);
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

    @Override
    public PmPlanItemDto.PageResponse selectPageList(PmPlanItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmPlanItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmPlanItemDto.PageResponse res = new PmPlanItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmPlanItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPlanItemId())) w.and(i.planItemId.eq(s.getPlanItemId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmPlanItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.planItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.planItemId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));    break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));    break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmPlanItem entity) {
        if (entity.getPlanItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getPlanId()       != null) { update.set(i.planId,       entity.getPlanId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(i.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getProdId()       != null) { update.set(i.prodId,       entity.getProdId());       hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(i.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getPlanItemMemo() != null) { update.set(i.planItemMemo, entity.getPlanItemMemo()); hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(i.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(i.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.planItemId.eq(entity.getPlanItemId())).execute();
        return (int) affected;
    }
}

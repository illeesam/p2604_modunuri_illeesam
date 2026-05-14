package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmPlanRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmPlan QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmPlanRepositoryImpl implements QPmPlanRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmPlan p    = QPmPlan.pmPlan;
    private static final QSySite ste  = QSySite.sySite;
    private static final QSyCode cdPt = new QSyCode("cd_pt");
    private static final QSyCode cdPs = new QSyCode("cd_ps");

    private JPAQuery<PmPlanDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanDto.Item.class,
                        p.planId, p.siteId, p.planNm, p.planTitle, p.planTypeCd,
                        p.planDesc, p.thumbnailUrl, p.bannerUrl, p.startDate, p.endDate,
                        p.planStatusCd, p.planStatusCdBefore, p.sortOrd, p.useYn,
                        p.regBy, p.regDate, p.updBy, p.updDate
                ))
                .from(p)
                .leftJoin(ste).on(ste.siteId.eq(p.siteId))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PLAN_TYPE").and(cdPt.codeValue.eq(p.planTypeCd)))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PLAN_STATUS").and(cdPs.codeValue.eq(p.planStatusCd)));
    }

    @Override
    public Optional<PmPlanDto.Item> selectById(String planId) {
        PmPlanDto.Item dto = baseQuery()
                .where(p.planId.eq(planId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmPlanDto.Item> selectList(PmPlanDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanDto.Item> query = baseQuery().where(where);
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
    public PmPlanDto.PageResponse selectPageList(PmPlanDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmPlanDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(p.count())
                .from(p)
                .where(where)
                .fetchOne();

        PmPlanDto.PageResponse res = new PmPlanDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmPlanDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPlanId())) w.and(p.planId.eq(s.getPlanId()));
        if (StringUtils.hasText(s.getUseYn()))  w.and(p.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_plan_nm"))    or.or(p.planNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_plan_title")) or.or(p.planTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmPlanDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.planId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, p.planId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.planNm));  break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, p.planNm));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  p.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, p.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, p.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmPlan entity) {
        if (entity.getPlanId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(p.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getPlanNm()             != null) { update.set(p.planNm,             entity.getPlanNm());             hasAny = true; }
        if (entity.getPlanTitle()          != null) { update.set(p.planTitle,          entity.getPlanTitle());          hasAny = true; }
        if (entity.getPlanTypeCd()         != null) { update.set(p.planTypeCd,         entity.getPlanTypeCd());         hasAny = true; }
        if (entity.getPlanDesc()           != null) { update.set(p.planDesc,           entity.getPlanDesc());           hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(p.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getBannerUrl()          != null) { update.set(p.bannerUrl,          entity.getBannerUrl());          hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(p.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(p.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getPlanStatusCd()       != null) { update.set(p.planStatusCd,       entity.getPlanStatusCd());       hasAny = true; }
        if (entity.getPlanStatusCdBefore() != null) { update.set(p.planStatusCdBefore, entity.getPlanStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(p.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(p.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(p.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(p.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.planId.eq(entity.getPlanId())).execute();
        return (int) affected;
    }
}

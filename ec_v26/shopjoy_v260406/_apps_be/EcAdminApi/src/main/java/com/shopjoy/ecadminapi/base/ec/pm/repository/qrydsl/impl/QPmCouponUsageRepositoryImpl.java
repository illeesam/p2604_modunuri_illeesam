package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmCouponUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponUsageRepositoryImpl implements QPmCouponUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmCouponUsage u = QPmCouponUsage.pmCouponUsage;

    @Override
    public Optional<PmCouponUsageDto.Item> selectById(String usageId) {
        PmCouponUsageDto.Item dto = baseQuery()
                .where(u.usageId.eq(usageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmCouponUsageDto.Item> selectList(PmCouponUsageDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponUsageDto.Item> query = baseQuery().where(where);
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
    public PmCouponUsageDto.PageResponse selectPageList(PmCouponUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponUsageDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponUsageDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(u.count())
                .from(u)
                .where(where)
                .fetchOne();

        PmCouponUsageDto.PageResponse res = new PmCouponUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmCouponUsageDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponUsageDto.Item.class,
                        u.usageId, u.siteId, u.couponId, u.couponCode, u.couponNm,
                        u.memberId, u.orderId, u.orderItemId, u.prodId,
                        u.discountTypeCd, u.discountValue, u.discountAmt, u.usedDate,
                        u.regBy, u.regDate, u.updBy, u.updDate
                ))
                .from(u);
    }

    private BooleanBuilder buildCondition(PmCouponUsageDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))  w.and(u.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getUsageId())) w.and(u.usageId.eq(s.getUsageId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_coupon_nm")) or.or(u.couponNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(u.regDate.goe(start)).and(u.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(u.updDate.goe(start)).and(u.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCouponUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  u.usageId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, u.usageId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  u.couponNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, u.couponNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  u.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, u.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, u.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmCouponUsage entity) {
        if (entity.getUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(u.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getCouponId()       != null) { update.set(u.couponId,       entity.getCouponId());       hasAny = true; }
        if (entity.getCouponCode()     != null) { update.set(u.couponCode,     entity.getCouponCode());     hasAny = true; }
        if (entity.getCouponNm()       != null) { update.set(u.couponNm,       entity.getCouponNm());       hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(u.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getOrderId()        != null) { update.set(u.orderId,        entity.getOrderId());        hasAny = true; }
        if (entity.getOrderItemId()    != null) { update.set(u.orderItemId,    entity.getOrderItemId());    hasAny = true; }
        if (entity.getProdId()         != null) { update.set(u.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getDiscountTypeCd() != null) { update.set(u.discountTypeCd, entity.getDiscountTypeCd()); hasAny = true; }
        if (entity.getDiscountValue()  != null) { update.set(u.discountValue,  entity.getDiscountValue());  hasAny = true; }
        if (entity.getDiscountAmt()    != null) { update.set(u.discountAmt,    entity.getDiscountAmt());    hasAny = true; }
        if (entity.getUsedDate()       != null) { update.set(u.usedDate,       entity.getUsedDate());       hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(u.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(u.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.usageId.eq(entity.getUsageId())).execute();
        return (int) affected;
    }
}

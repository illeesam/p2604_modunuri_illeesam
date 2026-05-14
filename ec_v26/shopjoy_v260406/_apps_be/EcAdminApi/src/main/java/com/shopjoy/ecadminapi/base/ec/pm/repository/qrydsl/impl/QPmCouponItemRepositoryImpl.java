package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmCouponItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponItemRepositoryImpl implements QPmCouponItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmCouponItem i = QPmCouponItem.pmCouponItem;

    @Override
    public Optional<PmCouponItemDto.Item> selectById(String couponItemId) {
        PmCouponItemDto.Item dto = baseQuery()
                .where(i.couponItemId.eq(couponItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmCouponItemDto.Item> selectList(PmCouponItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponItemDto.Item> query = baseQuery().where(where);
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
    public PmCouponItemDto.PageResponse selectPageList(PmCouponItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmCouponItemDto.PageResponse res = new PmCouponItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmCouponItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponItemDto.Item.class,
                        i.couponItemId, i.couponId, i.siteId,
                        i.targetTypeCd, i.targetId,
                        i.regBy, i.regDate
                ))
                .from(i);
    }

    private BooleanBuilder buildCondition(PmCouponItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCouponItemId())) w.and(i.couponItemId.eq(s.getCouponItemId()));

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
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCouponItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  i.couponItemId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, i.couponItemId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  i.regDate));      break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
            default:         orders.add(new OrderSpecifier(Order.DESC, i.regDate));      break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmCouponItem entity) {
        if (entity.getCouponItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getCouponId()    != null) { update.set(i.couponId,    entity.getCouponId());    hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(i.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(i.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(i.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.couponItemId.eq(entity.getCouponItemId())).execute();
        return (int) affected;
    }
}

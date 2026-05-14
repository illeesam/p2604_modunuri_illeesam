package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhOrderStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderStatusHistRepositoryImpl implements QOdhOrderStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhOrderStatusHist h = QOdhOrderStatusHist.odhOrderStatusHist;

    private JPAQuery<OdhOrderStatusHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderStatusHistDto.Item.class,
                        h.orderStatusHistId, h.siteId, h.orderId,
                        h.orderStatusCdBefore, h.orderStatusCd, h.statusReason,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    @Override
    public Optional<OdhOrderStatusHistDto.Item> selectById(String id) {
        OdhOrderStatusHistDto.Item dto = baseQuery()
                .where(h.orderStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdhOrderStatusHistDto.Item> selectList(OdhOrderStatusHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderStatusHistDto.Item> query = baseQuery().where(where);
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
    public OdhOrderStatusHistDto.PageResponse selectPageList(OdhOrderStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderStatusHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhOrderStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhOrderStatusHistDto.PageResponse res = new OdhOrderStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(OdhOrderStatusHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))            w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderStatusHistId())) w.and(h.orderStatusHistId.eq(s.getOrderStatusHistId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            if ("reg_date".equals(s.getDateType())) {
                w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdhOrderStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  h.orderStatusHistId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, h.orderStatusHistId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  h.regDate));           break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, h.regDate));           break;
            default:         orders.add(new OrderSpecifier(Order.DESC, h.regDate));           break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdhOrderStatusHist entity) {
        if (entity.getOrderStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(h.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getOrderId()             != null) { update.set(h.orderId,             entity.getOrderId());             hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(h.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getOrderStatusCd()       != null) { update.set(h.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getStatusReason()        != null) { update.set(h.statusReason,        entity.getStatusReason());        hasAny = true; }
        if (entity.getChgUserId()           != null) { update.set(h.chgUserId,           entity.getChgUserId());           hasAny = true; }
        if (entity.getChgDate()             != null) { update.set(h.chgDate,             entity.getChgDate());             hasAny = true; }
        if (entity.getMemo()                != null) { update.set(h.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(h.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(h.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.orderStatusHistId.eq(entity.getOrderStatusHistId())).execute();
        return (int) affected;
    }
}

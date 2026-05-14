package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemStatusHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhOrderItemStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemStatusHistRepositoryImpl implements QOdhOrderItemStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhOrderItemStatusHist h = QOdhOrderItemStatusHist.odhOrderItemStatusHist;

    private JPAQuery<OdhOrderItemStatusHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemStatusHistDto.Item.class,
                        h.orderItemStatusHistId, h.siteId, h.orderItemId, h.orderId,
                        h.orderItemStatusCdBefore, h.orderItemStatusCd, h.statusReason,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    @Override
    public Optional<OdhOrderItemStatusHistDto.Item> selectById(String id) {
        OdhOrderItemStatusHistDto.Item dto = baseQuery()
                .where(h.orderItemStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdhOrderItemStatusHistDto.Item> selectList(OdhOrderItemStatusHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemStatusHistDto.Item> query = baseQuery().where(where);
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
    public OdhOrderItemStatusHistDto.PageResponse selectPageList(OdhOrderItemStatusHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemStatusHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhOrderItemStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhOrderItemStatusHistDto.PageResponse res = new OdhOrderItemStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(OdhOrderItemStatusHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))                w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderItemStatusHistId())) w.and(h.orderItemStatusHistId.eq(s.getOrderItemStatusHistId()));

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
    private List<OrderSpecifier<?>> buildOrder(OdhOrderItemStatusHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  h.orderItemStatusHistId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, h.orderItemStatusHistId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  h.regDate));               break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, h.regDate));               break;
            default:         orders.add(new OrderSpecifier(Order.DESC, h.regDate));               break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdhOrderItemStatusHist entity) {
        if (entity.getOrderItemStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(h.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(h.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getOrderId()                 != null) { update.set(h.orderId,                 entity.getOrderId());                 hasAny = true; }
        if (entity.getOrderItemStatusCdBefore() != null) { update.set(h.orderItemStatusCdBefore, entity.getOrderItemStatusCdBefore()); hasAny = true; }
        if (entity.getOrderItemStatusCd()       != null) { update.set(h.orderItemStatusCd,       entity.getOrderItemStatusCd());       hasAny = true; }
        if (entity.getStatusReason()            != null) { update.set(h.statusReason,            entity.getStatusReason());            hasAny = true; }
        if (entity.getChgUserId()               != null) { update.set(h.chgUserId,               entity.getChgUserId());               hasAny = true; }
        if (entity.getChgDate()                 != null) { update.set(h.chgDate,                 entity.getChgDate());                 hasAny = true; }
        if (entity.getMemo()                    != null) { update.set(h.memo,                    entity.getMemo());                    hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(h.updBy,                   entity.getUpdBy());                   hasAny = true; }
        if (entity.getUpdDate()                 != null) { update.set(h.updDate,                 entity.getUpdDate());                 hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.orderItemStatusHistId.eq(entity.getOrderItemStatusHistId())).execute();
        return (int) affected;
    }
}

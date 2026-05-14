package com.shopjoy.ecadminapi.base.ec.od.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.QOdhOrderItemChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhOrderItemChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhOrderItemChgHistRepositoryImpl implements QOdhOrderItemChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhOrderItemChgHist h = QOdhOrderItemChgHist.odhOrderItemChgHist;

    private JPAQuery<OdhOrderItemChgHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhOrderItemChgHistDto.Item.class,
                        h.orderItemChgHistId, h.siteId, h.orderId, h.orderItemId,
                        h.chgTypeCd, h.chgField, h.beforeVal, h.afterVal,
                        h.chgReason, h.chgUserId, h.chgDate,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    @Override
    public Optional<OdhOrderItemChgHistDto.Item> selectById(String id) {
        OdhOrderItemChgHistDto.Item dto = baseQuery()
                .where(h.orderItemChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdhOrderItemChgHistDto.Item> selectList(OdhOrderItemChgHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseQuery().where(where);
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
    public OdhOrderItemChgHistDto.PageResponse selectPageList(OdhOrderItemChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhOrderItemChgHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhOrderItemChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhOrderItemChgHistDto.PageResponse res = new OdhOrderItemChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(OdhOrderItemChgHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))             w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderItemChgHistId())) w.and(h.orderItemChgHistId.eq(s.getOrderItemChgHistId()));

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
    private List<OrderSpecifier<?>> buildOrder(OdhOrderItemChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  h.orderItemChgHistId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, h.orderItemChgHistId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  h.regDate));            break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, h.regDate));            break;
            default:         orders.add(new OrderSpecifier(Order.DESC, h.regDate));            break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(h.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(h.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(h.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getChgTypeCd()   != null) { update.set(h.chgTypeCd,   entity.getChgTypeCd());   hasAny = true; }
        if (entity.getChgField()    != null) { update.set(h.chgField,    entity.getChgField());    hasAny = true; }
        if (entity.getBeforeVal()   != null) { update.set(h.beforeVal,   entity.getBeforeVal());   hasAny = true; }
        if (entity.getAfterVal()    != null) { update.set(h.afterVal,    entity.getAfterVal());    hasAny = true; }
        if (entity.getChgReason()   != null) { update.set(h.chgReason,   entity.getChgReason());   hasAny = true; }
        if (entity.getChgUserId()   != null) { update.set(h.chgUserId,   entity.getChgUserId());   hasAny = true; }
        if (entity.getChgDate()     != null) { update.set(h.chgDate,     entity.getChgDate());     hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(h.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(h.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.orderItemChgHistId.eq(entity.getOrderItemChgHistId())).execute();
        return (int) affected;
    }
}

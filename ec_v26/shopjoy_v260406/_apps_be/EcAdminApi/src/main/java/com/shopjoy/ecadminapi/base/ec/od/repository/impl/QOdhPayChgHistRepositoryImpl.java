package com.shopjoy.ecadminapi.base.ec.od.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.QOdhPayChgHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdhPayChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhPayChgHistRepositoryImpl implements QOdhPayChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdhPayChgHist h = QOdhPayChgHist.odhPayChgHist;

    private JPAQuery<OdhPayChgHistDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdhPayChgHistDto.Item.class,
                        h.payChgHistId, h.siteId, h.payId, h.orderId,
                        h.payStatusCdBefore, h.payStatusCdAfter,
                        h.chgTypeCd, h.chgReason, h.pgResponse,
                        h.refundAmt, h.refundPgTid,
                        h.chgUserId, h.chgDate, h.memo,
                        h.regBy, h.regDate, h.updBy, h.updDate))
                .from(h);
    }

    @Override
    public Optional<OdhPayChgHistDto.Item> selectById(String id) {
        OdhPayChgHistDto.Item dto = baseQuery()
                .where(h.payChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdhPayChgHistDto.Item> selectList(OdhPayChgHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhPayChgHistDto.Item> query = baseQuery().where(where);
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
    public OdhPayChgHistDto.PageResponse selectPageList(OdhPayChgHistDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdhPayChgHistDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdhPayChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(h.count()).from(h).where(where).fetchOne();

        OdhPayChgHistDto.PageResponse res = new OdhPayChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(OdhPayChgHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPayChgHistId())) w.and(h.payChgHistId.eq(s.getPayChgHistId()));

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
    private List<OrderSpecifier<?>> buildOrder(OdhPayChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  h.payChgHistId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, h.payChgHistId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  h.regDate));      break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, h.regDate));      break;
            default:         orders.add(new OrderSpecifier(Order.DESC, h.regDate));      break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdhPayChgHist entity) {
        if (entity.getPayChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(h.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getPayId()             != null) { update.set(h.payId,             entity.getPayId());             hasAny = true; }
        if (entity.getOrderId()           != null) { update.set(h.orderId,           entity.getOrderId());           hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(h.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayStatusCdAfter()  != null) { update.set(h.payStatusCdAfter,  entity.getPayStatusCdAfter());  hasAny = true; }
        if (entity.getChgTypeCd()         != null) { update.set(h.chgTypeCd,         entity.getChgTypeCd());         hasAny = true; }
        if (entity.getChgReason()         != null) { update.set(h.chgReason,         entity.getChgReason());         hasAny = true; }
        if (entity.getPgResponse()        != null) { update.set(h.pgResponse,        entity.getPgResponse());        hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(h.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundPgTid()       != null) { update.set(h.refundPgTid,       entity.getRefundPgTid());       hasAny = true; }
        if (entity.getChgUserId()         != null) { update.set(h.chgUserId,         entity.getChgUserId());         hasAny = true; }
        if (entity.getChgDate()           != null) { update.set(h.chgDate,           entity.getChgDate());           hasAny = true; }
        if (entity.getMemo()              != null) { update.set(h.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(h.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(h.updDate,           entity.getUpdDate());           hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.payChgHistId.eq(entity.getPayChgHistId())).execute();
        return (int) affected;
    }
}

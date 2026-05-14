package com.shopjoy.ecadminapi.base.ec.od.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.QOdRefundMethodRepository;
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

/** OdRefundMethod QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdRefundMethodRepositoryImpl implements QOdRefundMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdRefundMethod m   = QOdRefundMethod.odRefundMethod;
    private static final QSySite         ste = new QSySite("ste");
    private static final QOdOrder        ord = new QOdOrder("ord");
    private static final QOdPay          pay = new QOdPay("pay");
    private static final QSyCode         cdPm = new QSyCode("cd_pm");
    private static final QSyCode         cdRs = new QSyCode("cd_rs");

    @Override
    public Optional<OdRefundMethodDto.Item> selectById(String refundMethodId) {
        OdRefundMethodDto.Item dto = baseListQuery()
                .where(m.refundMethodId.eq(refundMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdRefundMethodDto.Item> selectList(OdRefundMethodDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public OdRefundMethodDto.PageResponse selectPageList(OdRefundMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdRefundMethodDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdRefundMethodDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(m.count())
                .from(m)
                .where(where)
                .fetchOne();

        OdRefundMethodDto.PageResponse res = new OdRefundMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query */
    private JPAQuery<OdRefundMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdRefundMethodDto.Item.class,
                        m.refundMethodId, m.siteId, m.refundId, m.orderId,
                        m.payMethodCd, m.refundPriority, m.refundAmt, m.refundAvailAmt,
                        m.refundStatusCd, m.refundStatusCdBefore, m.refundDate,
                        m.payId, m.pgRefundId, m.pgResponse,
                        m.regBy, m.regDate, m.updBy, m.updDate
                ))
                .from(m)
                .leftJoin(ste).on(ste.siteId.eq(m.siteId))
                .leftJoin(ord).on(ord.orderId.eq(m.orderId))
                .leftJoin(pay).on(pay.payId.eq(m.payId))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(m.payMethodCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(m.refundStatusCd)));
    }

    private BooleanBuilder buildCondition(OdRefundMethodDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(m.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getRefundMethodId())) w.and(m.refundMethodId.eq(s.getRefundMethodId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdRefundMethodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  m.refundMethodId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, m.refundMethodId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  m.regDate));        break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, m.regDate));        break;
            default:         orders.add(new OrderSpecifier(Order.DESC, m.regDate));        break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdRefundMethod entity) {
        if (entity.getRefundMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(m.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getRefundId()             != null) { update.set(m.refundId,             entity.getRefundId());             hasAny = true; }
        if (entity.getOrderId()              != null) { update.set(m.orderId,              entity.getOrderId());              hasAny = true; }
        if (entity.getPayMethodCd()          != null) { update.set(m.payMethodCd,          entity.getPayMethodCd());          hasAny = true; }
        if (entity.getRefundPriority()       != null) { update.set(m.refundPriority,       entity.getRefundPriority());       hasAny = true; }
        if (entity.getRefundAmt()            != null) { update.set(m.refundAmt,            entity.getRefundAmt());            hasAny = true; }
        if (entity.getRefundAvailAmt()       != null) { update.set(m.refundAvailAmt,       entity.getRefundAvailAmt());       hasAny = true; }
        if (entity.getRefundStatusCd()       != null) { update.set(m.refundStatusCd,       entity.getRefundStatusCd());       hasAny = true; }
        if (entity.getRefundStatusCdBefore() != null) { update.set(m.refundStatusCdBefore, entity.getRefundStatusCdBefore()); hasAny = true; }
        if (entity.getRefundDate()           != null) { update.set(m.refundDate,           entity.getRefundDate());           hasAny = true; }
        if (entity.getPayId()                != null) { update.set(m.payId,                entity.getPayId());                hasAny = true; }
        if (entity.getPgRefundId()           != null) { update.set(m.pgRefundId,           entity.getPgRefundId());           hasAny = true; }
        if (entity.getPgResponse()           != null) { update.set(m.pgResponse,           entity.getPgResponse());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(m.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(m.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.refundMethodId.eq(entity.getRefundMethodId())).execute();
        return (int) affected;
    }
}

package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdDliv QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivRepositoryImpl implements QOdDlivRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdDliv   d    = QOdDliv.odDliv;
    private static final QOdOrder  o    = QOdOrder.odOrder;
    private static final QSyVendor v    = QSyVendor.syVendor;
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdDt = new QSyCode("cd_dt");
    private static final QSyCode   cdDd = new QSyCode("cd_dd");
    private static final QSyCode   cdOc = new QSyCode("cd_oc");
    private static final QSyCode   cdIc = new QSyCode("cd_ic");

    @Override
    public Optional<OdDlivDto.Item> selectById(String dlivId) {
        OdDlivDto.Item dto = baseQuery()
                .where(d.dlivId.eq(dlivId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdDlivDto.Item> selectList(OdDlivDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseQuery().where(where);
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
    public OdDlivDto.PageResponse selectPageList(OdDlivDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdDlivDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdDlivDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(d.count())
                .from(d)
                .leftJoin(o).on(o.orderId.eq(d.orderId))
                .where(where)
                .fetchOne();

        OdDlivDto.PageResponse res = new OdDlivDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<OdDlivDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivDto.Item.class,
                        d.dlivId, d.siteId, d.orderId, d.vendorId,
                        d.dlivTypeCd, d.dlivDivCd, d.dlivStatusCd, d.dlivStatusCdBefore,
                        d.outboundCourierCd, d.outboundTrackingNo,
                        d.dlivShipDate, d.dlivDate,
                        d.shippingFee,
                        d.inboundCourierCd, d.inboundTrackingNo,
                        d.recvNm, d.recvPhone, d.recvZip, d.recvAddr, d.recvAddrDetail,
                        d.dlivMemo,
                        d.regBy, d.regDate, d.updBy, d.updDate,
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        v.vendorNm.as("vendorNm"),
                        v.vendorPhone.as("vendorTel"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdDt.codeLabel.as("dlivTypeCdNm"),
                        cdDd.codeLabel.as("dlivDivCdNm"),
                        cdOc.codeLabel.as("outboundCourierCdNm"),
                        cdIc.codeLabel.as("inboundCourierCdNm")
                ))
                .from(d)
                .leftJoin(o).on(o.orderId.eq(d.orderId))
                .leftJoin(v).on(v.vendorId.eq(d.vendorId))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(d.dlivStatusCd)))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DLIV_TYPE").and(cdDt.codeValue.eq(d.dlivTypeCd)))
                .leftJoin(cdDd).on(cdDd.codeGrp.eq("DLIV_DIV").and(cdDd.codeValue.eq(d.dlivDivCd)))
                .leftJoin(cdOc).on(cdOc.codeGrp.eq("COURIER").and(cdOc.codeValue.eq(d.outboundCourierCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(d.inboundCourierCd)));
    }

    private BooleanBuilder buildCondition(OdDlivDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(d.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDlivId())) w.and(d.dlivId.eq(s.getDlivId()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_dliv_id"))    or.or(d.dlivId.likeIgnoreCase(pattern));
            if (all || types.contains("def_order_id"))   or.or(d.orderId.likeIgnoreCase(pattern));
            if (all || types.contains("def_tracking"))   or.or(d.outboundTrackingNo.likeIgnoreCase(pattern));
            if (all || types.contains("def_recv_nm"))    or.or(d.recvNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_recv_phone")) or.or(d.recvPhone.likeIgnoreCase(pattern));
            if (all || types.contains("def_member_nm"))  or.or(o.memberNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "dliv_ship_date":
                    w.and(d.dlivShipDate.goe(start)).and(d.dlivShipDate.lt(endExcl)); break;
                case "dliv_date":
                    w.and(d.dlivDate.goe(start)).and(d.dlivDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(d.regDate.goe(start)).and(d.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(d.updDate.goe(start)).and(d.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdDlivDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  d.dlivId));    break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, d.dlivId));    break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  d.memberNm));  break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, d.memberNm));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  d.regDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, d.regDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, d.regDate));   break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getDlivStatusCd()       != null) { update.set(d.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(d.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getOutboundCourierCd()  != null) { update.set(d.outboundCourierCd,  entity.getOutboundCourierCd());  hasAny = true; }
        if (entity.getOutboundTrackingNo() != null) { update.set(d.outboundTrackingNo, entity.getOutboundTrackingNo()); hasAny = true; }
        if (entity.getDlivShipDate()       != null) { update.set(d.dlivShipDate,       entity.getDlivShipDate());       hasAny = true; }
        if (entity.getDlivDate()           != null) { update.set(d.dlivDate,           entity.getDlivDate());           hasAny = true; }
        if (entity.getDlivMemo()           != null) { update.set(d.dlivMemo,           entity.getDlivMemo());           hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(d.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(d.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(d.dlivId.eq(entity.getDlivId())).execute();
        return (int) affected;
    }
}

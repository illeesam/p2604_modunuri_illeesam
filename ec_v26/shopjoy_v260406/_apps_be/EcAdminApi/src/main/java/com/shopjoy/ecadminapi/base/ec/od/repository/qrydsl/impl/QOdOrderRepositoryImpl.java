package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
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

/** OdOrder QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdOrderRepositoryImpl implements QOdOrderRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdOrder  o   = QOdOrder.odOrder;
    private static final QMbMember m   = QMbMember.mbMember;
    private static final QSySite   s   = QSySite.sySite;
    private static final QPmCoupon cou = QPmCoupon.pmCoupon;
    private static final QSyCode   cdOs = new QSyCode("cd_os");
    private static final QSyCode   cdPm = new QSyCode("cd_pm");
    private static final QSyCode   cdDs = new QSyCode("cd_ds");
    private static final QSyCode   cdRb = new QSyCode("cd_rb");
    private static final QSyCode   cdAp = new QSyCode("cd_ap");
    private static final QSyCode   cdAt = new QSyCode("cd_at");
    private static final QSyCode   cdAc = new QSyCode("cd_ac");

    @Override
    public Optional<OdOrderDto.Item> selectById(String orderId) {
        OdOrderDto.Item dto = queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        // o.* equivalent (DTO Item 에 존재하는 필드만)
                        o.orderId, o.siteId, o.memberId, o.memberNm, o.ordererEmail,
                        o.totalAmt, o.payAmt,
                        o.orderStatusCd, o.orderStatusCdBefore,
                        o.payMethodCd, o.dlivStatusCd, o.couponId,
                        o.recvNm, o.recvPhone, o.recvZip, o.recvAddr, o.recvAddrDetail, o.recvMemo,
                        o.refundBankCd, o.refundAccountNo, o.refundAccountNm,
                        o.accessChannelCd,
                        o.apprStatusCd, o.apprStatusCdBefore, o.apprAmt,
                        o.apprTargetCd, o.apprTargetNm, o.apprReason,
                        o.apprReqUserId, o.apprReqDate, o.apprAprvUserId, o.apprAprvDate,
                        o.memo, o.orderDate,
                        o.regBy, o.regDate, o.updBy, o.updDate,
                        // joined
                        m.loginId.as("memberEmail"),
                        m.memberPhone.as("memberPhoneOrigin"),
                        m.gradeCd.as("gradeCd"),
                        m.totalPurchaseAmt.as("totalPurchaseAmt"),
                        s.siteNm.as("siteNm"),
                        cou.couponNm.as("couponNm"),
                        cou.couponTypeCd.as("couponTypeCd"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdRb.codeLabel.as("refundBankCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm"),
                        cdAt.codeLabel.as("apprTargetCdNm")
                ))
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(s).on(s.siteId.eq(o.siteId))
                .leftJoin(cou).on(cou.couponId.eq(o.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(o.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(o.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(o.dlivStatusCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(o.refundBankCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(o.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(o.apprTargetCd)))
                .where(o.orderId.eq(orderId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdOrderDto.Item> selectList(OdOrderDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(where);
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
    public OdOrderDto.PageResponse selectPageList(OdOrderDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdOrderDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdOrderDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(o.count())
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .where(where)
                .fetchOne();

        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdOrderDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdOrderDto.Item.class,
                        o.orderId, o.siteId, o.memberId, o.memberNm, o.ordererEmail,
                        o.totalAmt, o.payAmt,
                        o.orderStatusCd, o.orderStatusCdBefore,
                        o.payMethodCd, o.dlivStatusCd, o.couponId,
                        o.recvNm, o.recvPhone, o.recvZip, o.recvAddr, o.recvAddrDetail, o.recvMemo,
                        o.refundBankCd, o.refundAccountNo, o.refundAccountNm,
                        o.accessChannelCd,
                        o.apprStatusCd, o.apprStatusCdBefore, o.apprAmt,
                        o.apprTargetCd, o.apprTargetNm, o.apprReason,
                        o.apprReqUserId, o.apprReqDate, o.apprAprvUserId, o.apprAprvDate,
                        o.memo, o.orderDate,
                        o.regBy, o.regDate, o.updBy, o.updDate,
                        m.loginId.as("memberEmail"),
                        s.siteNm.as("siteNm"),
                        cou.couponNm.as("couponNm"),
                        cdOs.codeLabel.as("orderStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdDs.codeLabel.as("dlivStatusCdNm"),
                        cdAc.codeLabel.as("accessChannelCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm")
                ))
                .from(o)
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(s).on(s.siteId.eq(o.siteId))
                .leftJoin(cou).on(cou.couponId.eq(o.couponId))
                .leftJoin(cdOs).on(cdOs.codeGrp.eq("ORDER_STATUS").and(cdOs.codeValue.eq(o.orderStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(o.payMethodCd)))
                .leftJoin(cdDs).on(cdDs.codeGrp.eq("DLIV_STATUS").and(cdDs.codeValue.eq(o.dlivStatusCd)))
                .leftJoin(cdAc).on(cdAc.codeGrp.eq("ACCESS_CHANNEL").and(cdAc.codeValue.eq(o.accessChannelCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(o.apprStatusCd)));
    }

    private BooleanBuilder buildCondition(OdOrderDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(o.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getOrderId()))        w.and(o.orderId.eq(s.getOrderId()));
        if (StringUtils.hasText(s.getMemberId()))       w.and(o.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getOrderStatusCd())) w.and(o.orderStatusCd.eq(s.getOrderStatusCd()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_order_id"))    or.or(o.orderId.likeIgnoreCase(pattern));
            if (all || types.contains("def_member_nm"))   or.or(o.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_login_id"))    or.or(m.loginId.likeIgnoreCase(pattern));
            if (all || types.contains("def_recv_nm"))     or.or(o.recvNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_recv_phone"))  or.or(o.recvPhone.likeIgnoreCase(pattern));
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
                case "order_date":
                    w.and(o.orderDate.goe(start)).and(o.orderDate.lt(endExcl));    break;
                case "reg_date":
                    w.and(o.regDate.goe(start)).and(o.regDate.lt(endExcl));        break;
                case "upd_date":
                    w.and(o.updDate.goe(start)).and(o.updDate.lt(endExcl));        break;
                case "pay_date":
                    w.and(o.payDate.goe(start)).and(o.payDate.lt(endExcl));        break;
                case "dliv_ship_date":
                    w.and(o.dlivShipDate.goe(start)).and(o.dlivShipDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdOrderDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, o.orderDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("orderId".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.orderId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.memberNm));
                } else if ("orderDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, o.orderDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(o);
        boolean hasAny = false;

        if (entity.getOrderStatusCd()       != null) { update.set(o.orderStatusCd,       entity.getOrderStatusCd());       hasAny = true; }
        if (entity.getOrderStatusCdBefore() != null) { update.set(o.orderStatusCdBefore, entity.getOrderStatusCdBefore()); hasAny = true; }
        if (entity.getPayAmt()              != null) { update.set(o.payAmt,              entity.getPayAmt());              hasAny = true; }
        if (entity.getDlivStatusCd()        != null) { update.set(o.dlivStatusCd,        entity.getDlivStatusCd());        hasAny = true; }
        if (entity.getMemo()                != null) { update.set(o.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(o.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(o.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(o.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(o.orderId.eq(entity.getOrderId())).execute();
        return (int) affected;
    }
}

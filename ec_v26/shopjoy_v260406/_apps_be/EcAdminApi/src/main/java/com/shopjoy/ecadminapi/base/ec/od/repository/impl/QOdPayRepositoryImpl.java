package com.shopjoy.ecadminapi.base.ec.od.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPay;
import com.shopjoy.ecadminapi.base.ec.od.repository.QOdPayRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdPay QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayRepositoryImpl implements QOdPayRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdPay    p   = QOdPay.odPay;
    private static final QOdOrder  o   = QOdOrder.odOrder;
    private static final QMbMember m   = QMbMember.mbMember;
    private static final QSyCode   cdPs = new QSyCode("cd_ps");
    private static final QSyCode   cdPm = new QSyCode("cd_pm");
    private static final QSyCode   cdPd = new QSyCode("cd_pd");
    private static final QSyCode   cdPc = new QSyCode("cd_pc");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdVb = new QSyCode("cd_vb");
    private static final QSyCode   cdCt = new QSyCode("cd_ct");

    @Override
    public Optional<OdPayDto.Item> selectById(String payId) {
        OdPayDto.Item dto = queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        p.payId, p.siteId, p.orderId,
                        p.payStatusCd, p.payStatusCdBefore,
                        p.payMethodCd, p.payDirCd, p.payChannelCd,
                        p.payAmt, p.refundAmt, p.refundStatusCd, p.refundDate,
                        p.pgTransactionId, p.payDate,
                        p.cardNo, p.cardTypeCd,
                        p.installmentMonth.as("cardInstallMonth"),
                        p.vbankBankCode,
                        p.vbankAccount.as("vbankAccountNo"),
                        p.vbankHolderNm.as("vbankAccountNm"),
                        p.vbankDepositDate.as("vbankExpireDate"),
                        p.memo, p.regBy, p.regDate, p.updBy, p.updDate,
                        // joined
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        m.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdPc.codeLabel.as("payChannelCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm"),
                        cdVb.codeLabel.as("vbankBankCodeNm"),
                        cdCt.codeLabel.as("cardTypeCdNm")
                ))
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(p.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(p.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(p.payDirCd)))
                .leftJoin(cdPc).on(cdPc.codeGrp.eq("PAY_CHANNEL").and(cdPc.codeValue.eq(p.payChannelCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(p.refundStatusCd)))
                .leftJoin(cdVb).on(cdVb.codeGrp.eq("BANK_CODE").and(cdVb.codeValue.eq(p.vbankBankCode)))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CARD_TYPE").and(cdCt.codeValue.eq(p.cardTypeCd)))
                .where(p.payId.eq(payId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdPayDto.Item> selectList(OdPayDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(where);
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
    public OdPayDto.PageResponse selectPageList(OdPayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdPayDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(p.count())
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .where(where)
                .fetchOne();

        OdPayDto.PageResponse res = new OdPayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdPayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayDto.Item.class,
                        p.payId, p.siteId, p.orderId,
                        p.payStatusCd, p.payStatusCdBefore,
                        p.payMethodCd, p.payDirCd, p.payChannelCd,
                        p.payAmt, p.refundAmt, p.refundStatusCd, p.refundDate,
                        p.pgTransactionId, p.payDate,
                        p.cardNo, p.cardTypeCd,
                        p.installmentMonth.as("cardInstallMonth"),
                        p.vbankBankCode,
                        p.vbankAccount.as("vbankAccountNo"),
                        p.vbankHolderNm.as("vbankAccountNm"),
                        p.vbankDepositDate.as("vbankExpireDate"),
                        p.memo, p.regBy, p.regDate, p.updBy, p.updDate,
                        o.memberNm.as("memberNm"),
                        o.orderDate.as("orderDate"),
                        m.loginId.as("memberEmail"),
                        cdPs.codeLabel.as("payStatusCdNm"),
                        cdPm.codeLabel.as("payMethodCdNm"),
                        cdPd.codeLabel.as("payDirCdNm"),
                        cdRs.codeLabel.as("refundStatusCdNm")
                ))
                .from(p)
                .leftJoin(o).on(o.orderId.eq(p.orderId))
                .leftJoin(m).on(m.memberId.eq(o.memberId))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PAY_STATUS").and(cdPs.codeValue.eq(p.payStatusCd)))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(p.payMethodCd)))
                .leftJoin(cdPd).on(cdPd.codeGrp.eq("PAY_DIR").and(cdPd.codeValue.eq(p.payDirCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("REFUND_STATUS").and(cdRs.codeValue.eq(p.refundStatusCd)));
    }

    private BooleanBuilder buildCondition(OdPayDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPayId()))  w.and(p.payId.eq(s.getPayId()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_order_id"))   or.or(p.orderId.likeIgnoreCase(pattern));
            if (all || types.contains("def_login_id"))   or.or(m.loginId.likeIgnoreCase(pattern));
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
                case "pay_date":
                    w.and(p.payDate.goe(start)).and(p.payDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(p.regDate.goe(start)).and(p.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(p.updDate.goe(start)).and(p.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdPayDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.payId));       break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, p.payId));       break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  p.vbankBankNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, p.vbankBankNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  p.regDate));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, p.regDate));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, p.regDate));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(OdPay entity) {
        if (entity.getPayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getPayStatusCd()       != null) { update.set(p.payStatusCd,       entity.getPayStatusCd());       hasAny = true; }
        if (entity.getPayStatusCdBefore() != null) { update.set(p.payStatusCdBefore, entity.getPayStatusCdBefore()); hasAny = true; }
        if (entity.getPayDate()           != null) { update.set(p.payDate,           entity.getPayDate());           hasAny = true; }
        if (entity.getRefundAmt()         != null) { update.set(p.refundAmt,         entity.getRefundAmt());         hasAny = true; }
        if (entity.getRefundStatusCd()    != null) { update.set(p.refundStatusCd,    entity.getRefundStatusCd());    hasAny = true; }
        if (entity.getRefundDate()        != null) { update.set(p.refundDate,        entity.getRefundDate());        hasAny = true; }
        if (entity.getMemo()              != null) { update.set(p.memo,              entity.getMemo());              hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(p.updBy,             entity.getUpdBy());             hasAny = true; }
        if (entity.getUpdDate()           != null) { update.set(p.updDate,           entity.getUpdDate());           hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.payId.eq(entity.getPayId())).execute();
        return (int) affected;
    }
}

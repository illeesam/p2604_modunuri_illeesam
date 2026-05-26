package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
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

    /* 결제 키조회 */
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

    /* 결제 목록조회 */
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

    /* 결제 페이지조회 */
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

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanBuilder buildCondition(OdPayDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (!CollectionUtils.isEmpty(s.getOrderIds())) w.and(p.orderId.in(s.getOrderIds()));
        if (StringUtils.hasText(s.getOrderId())) w.and(p.orderId.eq(s.getOrderId()));
        if (StringUtils.hasText(s.getSiteId())) w.and(p.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getPayId()))  w.and(p.payId.eq(s.getPayId()));

        // searchValue + searchType
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",orderId,"))   or.or(p.orderId.likeIgnoreCase(pattern));
            if (all || types.contains(",loginId,"))   or.or(m.loginId.likeIgnoreCase(pattern));
            if (all || types.contains(",memberNm,"))  or.or(o.memberNm.likeIgnoreCase(pattern));
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
        /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
        if (s != null && StringUtils.hasText(s.getSearchValue())) {
            String pattern = "%" + s.getSearchValue() + "%";
            String __typeRaw = s.getSearchType();
            boolean __all = !StringUtils.hasText(__typeRaw);
            String __types = __all ? "" : ("," + __typeRaw.trim() + ",");
            BooleanBuilder or = new BooleanBuilder();
            if (__all || __types.contains(",cardIssuerCd,")) or.or(p.cardIssuerCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",cardIssuerNm,")) or.or(p.cardIssuerNm.likeIgnoreCase(pattern));
            if (__all || __types.contains(",cardNo,")) or.or(p.cardNo.likeIgnoreCase(pattern));
            if (__all || __types.contains(",cardTypeCd,")) or.or(p.cardTypeCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",claimId,")) or.or(p.claimId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",failureCode,")) or.or(p.failureCode.likeIgnoreCase(pattern));
            if (__all || __types.contains(",failureReason,")) or.or(p.failureReason.likeIgnoreCase(pattern));
            if (__all || __types.contains(",memo,")) or.or(p.memo.likeIgnoreCase(pattern));
            if (__all || __types.contains(",orderId,")) or.or(p.orderId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payChannelCd,")) or.or(p.payChannelCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payDirCd,")) or.or(p.payDirCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payDivCd,")) or.or(p.payDivCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payId,")) or.or(p.payId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payMethodCd,")) or.or(p.payMethodCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payOccurTypeCd,")) or.or(p.payOccurTypeCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payStatusCd,")) or.or(p.payStatusCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",payStatusCdBefore,")) or.or(p.payStatusCdBefore.likeIgnoreCase(pattern));
            if (__all || __types.contains(",pgApprovalNo,")) or.or(p.pgApprovalNo.likeIgnoreCase(pattern));
            if (__all || __types.contains(",pgCompanyCd,")) or.or(p.pgCompanyCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",pgResponse,")) or.or(p.pgResponse.likeIgnoreCase(pattern));
            if (__all || __types.contains(",pgTransactionId,")) or.or(p.pgTransactionId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",refundReason,")) or.or(p.refundReason.likeIgnoreCase(pattern));
            if (__all || __types.contains(",refundStatusCd,")) or.or(p.refundStatusCd.likeIgnoreCase(pattern));
            if (__all || __types.contains(",refundStatusCdBefore,")) or.or(p.refundStatusCdBefore.likeIgnoreCase(pattern));
            if (__all || __types.contains(",siteId,")) or.or(p.siteId.likeIgnoreCase(pattern));
            if (__all || __types.contains(",vbankAccount,")) or.or(p.vbankAccount.likeIgnoreCase(pattern));
            if (__all || __types.contains(",vbankBankCode,")) or.or(p.vbankBankCode.likeIgnoreCase(pattern));
            if (__all || __types.contains(",vbankBankNm,")) or.or(p.vbankBankNm.likeIgnoreCase(pattern));
            if (__all || __types.contains(",vbankDepositNm,")) or.or(p.vbankDepositNm.likeIgnoreCase(pattern));
            if (__all || __types.contains(",vbankHolderNm,")) or.or(p.vbankHolderNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdPayDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.payId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payId".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.payId));
                } else if ("vbankBankNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.vbankBankNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, p.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, p.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, p.payId));
        }
        return orders;
    }

    /* 결제 수정 */
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

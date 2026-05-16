package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdClaim QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdClaimRepositoryImpl implements QOdClaimRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdClaim  c   = QOdClaim.odClaim;
    private static final QOdOrder  o   = QOdOrder.odOrder;
    private static final QMbMember m   = QMbMember.mbMember;
    private static final QSyCode   cdCt = new QSyCode("cd_ct");
    private static final QSyCode   cdCs = new QSyCode("cd_cs");
    private static final QSyCode   cdRm = new QSyCode("cd_rm");
    private static final QSyCode   cdRb = new QSyCode("cd_rb");
    private static final QSyCode   cdRc = new QSyCode("cd_rc");
    private static final QSyCode   cdRs = new QSyCode("cd_rs");
    private static final QSyCode   cdIc = new QSyCode("cd_ic");
    private static final QSyCode   cdEc = new QSyCode("cd_ec");
    private static final QSyCode   cdAp = new QSyCode("cd_ap");
    private static final QSyCode   cdAt = new QSyCode("cd_at");

    /* 클레임(취소/반품/교환) 키조회 */
    @Override
    public Optional<OdClaimDto.Item> selectById(String claimId) {
        OdClaimDto.Item dto = queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        // c.* equivalent (DTO Item 에 존재하는 모든 c. 필드)
                        c.claimId, c.siteId, c.orderId, c.memberId, c.memberNm,
                        c.claimTypeCd, c.claimStatusCd, c.claimStatusCdBefore,
                        c.reasonCd, c.reasonDetail, c.prodNm,
                        c.customerFaultYn,
                        c.claimCancelYn, c.claimCancelDate, c.claimCancelReasonCd, c.claimCancelReasonDetail,
                        c.refundMethodCd, c.refundAmt, c.refundProdAmt, c.refundShippingAmt, c.refundSaveAmt,
                        c.refundBankCd, c.refundAccountNo, c.refundAccountNm,
                        c.requestDate, c.procDate, c.procUserId, c.memo,
                        c.addShippingFee, c.addShippingFeeChargeCd, c.addShippingFeeReason,
                        c.collectNm, c.collectPhone, c.collectZip, c.collectAddr, c.collectAddrDetail, c.collectReqMemo,
                        c.collectSchdDate, c.returnShippingFee, c.returnCourierCd, c.returnTrackingNo,
                        c.returnStatusCd, c.returnStatusCdBefore,
                        c.inboundShippingFee, c.inboundCourierCd, c.inboundTrackingNo, c.inboundDlivId,
                        c.exchRecvNm, c.exchRecvPhone, c.exchRecvZip, c.exchRecvAddr, c.exchRecvAddrDetail, c.exchRecvReqMemo,
                        c.exchangeShippingFee, c.exchangeCourierCd, c.exchangeTrackingNo, c.outboundDlivId,
                        c.totalShippingFee, c.shippingFeePaidYn, c.shippingFeePaidDate, c.shippingFeeMemo,
                        c.apprStatusCd, c.apprStatusCdBefore, c.apprAmt,
                        c.apprTargetCd, c.apprTargetNm, c.apprReason,
                        c.apprReqUserId, c.apprReqDate, c.apprAprvUserId, c.apprAprvDate,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        // joined
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        o.payMethodCd.as("payMethodCd"),
                        o.recvNm.as("recvNm"),
                        o.recvPhone.as("recvPhone"),
                        o.recvAddr.as("recvAddr"),
                        m.loginId.as("memberEmail"),
                        m.memberPhone.as("memberPhoneOrigin"),
                        cdCt.codeLabel.as("claimTypeCdNm"),
                        cdCs.codeLabel.as("claimStatusCdNm"),
                        cdRm.codeLabel.as("refundMethodCdNm"),
                        cdRb.codeLabel.as("refundBankCdNm"),
                        cdRc.codeLabel.as("returnCourierCdNm"),
                        cdRs.codeLabel.as("returnStatusCdNm"),
                        cdIc.codeLabel.as("inboundCourierCdNm"),
                        cdEc.codeLabel.as("exchangeCourierCdNm"),
                        cdAp.codeLabel.as("apprStatusCdNm"),
                        cdAt.codeLabel.as("apprTargetCdNm")
                ))
                .from(c)
                .leftJoin(o).on(o.orderId.eq(c.orderId))
                .leftJoin(m).on(m.memberId.eq(c.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(c.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(c.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(c.refundMethodCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(c.refundBankCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(c.returnCourierCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("DLIV_STATUS").and(cdRs.codeValue.eq(c.returnStatusCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(c.inboundCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(c.exchangeCourierCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(c.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(c.apprTargetCd)))
                .where(c.claimId.eq(claimId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임(취소/반품/교환) 목록조회 */
    @Override
    public List<OdClaimDto.Item> selectList(OdClaimDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(where);
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

    /* 클레임(취소/반품/교환) 페이지조회 */
    @Override
    public OdClaimDto.PageResponse selectPageList(OdClaimDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .leftJoin(m).on(m.memberId.eq(c.memberId))
                .where(where)
                .fetchOne();

        OdClaimDto.PageResponse res = new OdClaimDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdClaimDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        c.claimId, c.siteId, c.orderId, c.memberId, c.memberNm,
                        c.claimTypeCd, c.claimStatusCd, c.claimStatusCdBefore,
                        c.reasonCd, c.reasonDetail, c.prodNm,
                        c.customerFaultYn,
                        c.claimCancelYn, c.claimCancelDate, c.claimCancelReasonCd, c.claimCancelReasonDetail,
                        c.refundMethodCd, c.refundAmt, c.refundProdAmt, c.refundShippingAmt, c.refundSaveAmt,
                        c.refundBankCd, c.refundAccountNo, c.refundAccountNm,
                        c.requestDate, c.procDate, c.procUserId, c.memo,
                        c.addShippingFee, c.addShippingFeeChargeCd, c.addShippingFeeReason,
                        c.collectNm, c.collectPhone, c.collectZip, c.collectAddr, c.collectAddrDetail, c.collectReqMemo,
                        c.collectSchdDate, c.returnShippingFee, c.returnCourierCd, c.returnTrackingNo,
                        c.returnStatusCd, c.returnStatusCdBefore,
                        c.inboundShippingFee, c.inboundCourierCd, c.inboundTrackingNo, c.inboundDlivId,
                        c.exchRecvNm, c.exchRecvPhone, c.exchRecvZip, c.exchRecvAddr, c.exchRecvAddrDetail, c.exchRecvReqMemo,
                        c.exchangeShippingFee, c.exchangeCourierCd, c.exchangeTrackingNo, c.outboundDlivId,
                        c.totalShippingFee, c.shippingFeePaidYn, c.shippingFeePaidDate, c.shippingFeeMemo,
                        c.apprStatusCd, c.apprStatusCdBefore, c.apprAmt,
                        c.apprTargetCd, c.apprTargetNm, c.apprReason,
                        c.apprReqUserId, c.apprReqDate, c.apprAprvUserId, c.apprAprvDate,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        m.loginId.as("memberEmail"),
                        cdCt.codeLabel.as("claimTypeCdNm"),
                        cdCs.codeLabel.as("claimStatusCdNm"),
                        cdRm.codeLabel.as("refundMethodCdNm"),
                        cdRc.codeLabel.as("returnCourierCdNm"),
                        cdEc.codeLabel.as("exchangeCourierCdNm")
                ))
                .from(c)
                .leftJoin(o).on(o.orderId.eq(c.orderId))
                .leftJoin(m).on(m.memberId.eq(c.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(c.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(c.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(c.refundMethodCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(c.returnCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(c.exchangeCourierCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanBuilder buildCondition(OdClaimDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getClaimId()))       w.and(c.claimId.eq(s.getClaimId()));
        if (StringUtils.hasText(s.getMemberId()))      w.and(c.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getClaimStatusCd())) w.and(c.claimStatusCd.eq(s.getClaimStatusCd()));
        if (StringUtils.hasText(s.getClaimTypeCd()))   w.and(c.claimTypeCd.eq(s.getClaimTypeCd()));

        // searchValue + searchType
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",claimId,"))   or.or(c.claimId.likeIgnoreCase(pattern));
            if (all || types.contains(",orderId,"))   or.or(c.orderId.likeIgnoreCase(pattern));
            if (all || types.contains(",memberNm,"))  or.or(c.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains(",prodNm,"))    or.or(c.prodNm.likeIgnoreCase(pattern));
            if (all || types.contains(",loginId,"))   or.or(m.loginId.likeIgnoreCase(pattern));
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
                case "request_date":
                    w.and(c.requestDate.goe(start)).and(c.requestDate.lt(endExcl));         break;
                case "proc_date":
                    w.and(c.procDate.goe(start)).and(c.procDate.lt(endExcl));               break;
                case "claim_cancel_date":
                    w.and(c.claimCancelDate.goe(start)).and(c.claimCancelDate.lt(endExcl)); break;
                case "collect_schd_date":
                    w.and(c.collectSchdDate.goe(start)).and(c.collectSchdDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));                 break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));                 break;
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
    private List<OrderSpecifier<?>> buildOrder(OdClaimDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.requestDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.claimId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    /* 클레임(취소/반품/교환) 수정 */
    @Override
    public int updateSelective(OdClaim entity) {
        if (entity.getClaimId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getClaimStatusCd()       != null) { update.set(c.claimStatusCd,       entity.getClaimStatusCd());       hasAny = true; }
        if (entity.getClaimStatusCdBefore() != null) { update.set(c.claimStatusCdBefore, entity.getClaimStatusCdBefore()); hasAny = true; }
        if (entity.getRefundMethodCd()      != null) { update.set(c.refundMethodCd,      entity.getRefundMethodCd());      hasAny = true; }
        if (entity.getRefundAmt()           != null) { update.set(c.refundAmt,           entity.getRefundAmt());           hasAny = true; }
        if (entity.getRefundProdAmt()       != null) { update.set(c.refundProdAmt,       entity.getRefundProdAmt());       hasAny = true; }
        if (entity.getRefundShippingAmt()   != null) { update.set(c.refundShippingAmt,   entity.getRefundShippingAmt());   hasAny = true; }
        if (entity.getProcDate()            != null) { update.set(c.procDate,            entity.getProcDate());            hasAny = true; }
        if (entity.getProcUserId()          != null) { update.set(c.procUserId,          entity.getProcUserId());          hasAny = true; }
        if (entity.getReturnCourierCd()     != null) { update.set(c.returnCourierCd,     entity.getReturnCourierCd());     hasAny = true; }
        if (entity.getReturnTrackingNo()    != null) { update.set(c.returnTrackingNo,    entity.getReturnTrackingNo());    hasAny = true; }
        if (entity.getReturnStatusCd()      != null) { update.set(c.returnStatusCd,      entity.getReturnStatusCd());      hasAny = true; }
        if (entity.getExchangeCourierCd()   != null) { update.set(c.exchangeCourierCd,   entity.getExchangeCourierCd());   hasAny = true; }
        if (entity.getExchangeTrackingNo()  != null) { update.set(c.exchangeTrackingNo,  entity.getExchangeTrackingNo());  hasAny = true; }
        if (entity.getMemo()                != null) { update.set(c.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(c.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(c.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(c.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.claimId.eq(entity.getClaimId())).execute();
        return (int) affected;
    }
}

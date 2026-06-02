package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
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
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdClaimRepositoryImpl";
    private static final QOdClaim  odClaim   = QOdClaim.odClaim;
    private static final QOdOrder  odOrder   = QOdOrder.odOrder;
    private static final QMbMember mbMember   = QMbMember.mbMember;
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
                        // a.* equivalent (DTO Item 에 존재하는 모든 a. 필드)
                        odClaim.claimId, odClaim.siteId, odClaim.orderId, odClaim.memberId, odClaim.memberNm,
                        odClaim.claimTypeCd, odClaim.claimStatusCd, odClaim.claimStatusCdBefore,
                        odClaim.reasonCd, odClaim.reasonDetail, odClaim.prodNm,
                        odClaim.customerFaultYn,
                        odClaim.claimCancelYn, odClaim.claimCancelDate, odClaim.claimCancelReasonCd, odClaim.claimCancelReasonDetail,
                        odClaim.refundMethodCd, odClaim.refundAmt, odClaim.refundProdAmt, odClaim.refundShippingAmt, odClaim.refundSaveAmt,
                        odClaim.refundBankCd, odClaim.refundAccountNo, odClaim.refundAccountNm,
                        odClaim.requestDate, odClaim.procDate, odClaim.procUserId, odClaim.memo,
                        odClaim.addShippingFee, odClaim.addShippingFeeChargeCd, odClaim.addShippingFeeReason,
                        odClaim.collectNm, odClaim.collectPhone, odClaim.collectZip, odClaim.collectAddr, odClaim.collectAddrDetail, odClaim.collectReqMemo,
                        odClaim.collectSchdDate, odClaim.returnShippingFee, odClaim.returnCourierCd, odClaim.returnTrackingNo,
                        odClaim.returnStatusCd, odClaim.returnStatusCdBefore,
                        odClaim.inboundShippingFee, odClaim.inboundCourierCd, odClaim.inboundTrackingNo, odClaim.inboundDlivId,
                        odClaim.exchRecvNm, odClaim.exchRecvPhone, odClaim.exchRecvZip, odClaim.exchRecvAddr, odClaim.exchRecvAddrDetail, odClaim.exchRecvReqMemo,
                        odClaim.exchangeShippingFee, odClaim.exchangeCourierCd, odClaim.exchangeTrackingNo, odClaim.outboundDlivId,
                        odClaim.totalShippingFee, odClaim.shippingFeePaidYn, odClaim.shippingFeePaidDate, odClaim.shippingFeeMemo,
                        odClaim.apprStatusCd, odClaim.apprStatusCdBefore, odClaim.apprAmt,
                        odClaim.apprTargetCd, odClaim.apprTargetNm, odClaim.apprReason,
                        odClaim.apprReqUserId, odClaim.apprReqDate, odClaim.apprAprvUserId, odClaim.apprAprvDate,
                        odClaim.regBy, odClaim.regDate, odClaim.updBy, odClaim.updDate,
                        // joined
                        odOrder.orderDate.as("orderDate"),
                        odOrder.orderStatusCd.as("orderStatusCd"),
                        odOrder.payMethodCd.as("payMethodCd"),
                        odOrder.recvNm.as("recvNm"),
                        odOrder.recvPhone.as("recvPhone"),
                        odOrder.recvAddr.as("recvAddr"),
                        mbMember.loginId.as("memberEmail"),
                        mbMember.memberPhone.as("memberPhoneOrigin"),
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
                .from(odClaim)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odClaim.orderId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(odClaim.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(odClaim.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(odClaim.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(odClaim.refundMethodCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(odClaim.refundBankCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(odClaim.returnCourierCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("DLIV_STATUS").and(cdRs.codeValue.eq(odClaim.returnStatusCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(odClaim.inboundCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(odClaim.exchangeCourierCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(odClaim.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(odClaim.apprTargetCd)))
                .where(odClaim.claimId.eq(claimId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임(취소/반품/교환) 목록조회 */
    @Override
    public List<OdClaimDto.Item> selectList(OdClaimDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(
                baseAndSiteId(search),
                baseAndClaimId(search),
                baseAndMemberId(search),
                baseAndClaimStatusCd(search),
                baseAndClaimTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
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
    public OdClaimDto.PageResponse selectPageData(OdClaimDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndClaimId(search),
                baseAndMemberId(search),
                baseAndClaimStatusCd(search),
                baseAndClaimTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(odClaim.count())
                .from(odClaim)
                .leftJoin(mbMember).on(mbMember.memberId.eq(odClaim.memberId))
                .where(wheres)
                .fetchOne();

        OdClaimDto.PageResponse res = new OdClaimDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdClaimDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        odClaim.claimId, odClaim.siteId, odClaim.orderId, odClaim.memberId, odClaim.memberNm,
                        odClaim.claimTypeCd, odClaim.claimStatusCd, odClaim.claimStatusCdBefore,
                        odClaim.reasonCd, odClaim.reasonDetail, odClaim.prodNm,
                        odClaim.customerFaultYn,
                        odClaim.claimCancelYn, odClaim.claimCancelDate, odClaim.claimCancelReasonCd, odClaim.claimCancelReasonDetail,
                        odClaim.refundMethodCd, odClaim.refundAmt, odClaim.refundProdAmt, odClaim.refundShippingAmt, odClaim.refundSaveAmt,
                        odClaim.refundBankCd, odClaim.refundAccountNo, odClaim.refundAccountNm,
                        odClaim.requestDate, odClaim.procDate, odClaim.procUserId, odClaim.memo,
                        odClaim.addShippingFee, odClaim.addShippingFeeChargeCd, odClaim.addShippingFeeReason,
                        odClaim.collectNm, odClaim.collectPhone, odClaim.collectZip, odClaim.collectAddr, odClaim.collectAddrDetail, odClaim.collectReqMemo,
                        odClaim.collectSchdDate, odClaim.returnShippingFee, odClaim.returnCourierCd, odClaim.returnTrackingNo,
                        odClaim.returnStatusCd, odClaim.returnStatusCdBefore,
                        odClaim.inboundShippingFee, odClaim.inboundCourierCd, odClaim.inboundTrackingNo, odClaim.inboundDlivId,
                        odClaim.exchRecvNm, odClaim.exchRecvPhone, odClaim.exchRecvZip, odClaim.exchRecvAddr, odClaim.exchRecvAddrDetail, odClaim.exchRecvReqMemo,
                        odClaim.exchangeShippingFee, odClaim.exchangeCourierCd, odClaim.exchangeTrackingNo, odClaim.outboundDlivId,
                        odClaim.totalShippingFee, odClaim.shippingFeePaidYn, odClaim.shippingFeePaidDate, odClaim.shippingFeeMemo,
                        odClaim.apprStatusCd, odClaim.apprStatusCdBefore, odClaim.apprAmt,
                        odClaim.apprTargetCd, odClaim.apprTargetNm, odClaim.apprReason,
                        odClaim.apprReqUserId, odClaim.apprReqDate, odClaim.apprAprvUserId, odClaim.apprAprvDate,
                        odClaim.regBy, odClaim.regDate, odClaim.updBy, odClaim.updDate,
                        odOrder.orderDate.as("orderDate"),
                        odOrder.orderStatusCd.as("orderStatusCd"),
                        mbMember.loginId.as("memberEmail"),
                        cdCt.codeLabel.as("claimTypeCdNm"),
                        cdCs.codeLabel.as("claimStatusCdNm"),
                        cdRm.codeLabel.as("refundMethodCdNm"),
                        cdRc.codeLabel.as("returnCourierCdNm"),
                        cdEc.codeLabel.as("exchangeCourierCdNm")
                ))
                .from(odClaim)
                .leftJoin(odOrder).on(odOrder.orderId.eq(odClaim.orderId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(odClaim.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(odClaim.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(odClaim.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(odClaim.refundMethodCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(odClaim.returnCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(odClaim.exchangeCourierCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? odClaim.siteId.eq(search.getSiteId()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression baseAndClaimId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? odClaim.claimId.eq(search.getClaimId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? odClaim.memberId.eq(search.getMemberId()) : null;
    }

    /* claimStatusCd 정확 일치 */
    private BooleanExpression baseAndClaimStatusCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimStatusCd())
                ? odClaim.claimStatusCd.eq(search.getClaimStatusCd()) : null;
    }

    /* claimTypeCd 정확 일치 */
    private BooleanExpression baseAndClaimTypeCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimTypeCd())
                ? odClaim.claimTypeCd.eq(search.getClaimTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdClaimDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "request_date": return odClaim.requestDate.goe(start).and(odClaim.requestDate.lt(endExcl));
            case "proc_date": return odClaim.procDate.goe(start).and(odClaim.procDate.lt(endExcl));
            case "claim_cancel_date": return odClaim.claimCancelDate.goe(start).and(odClaim.claimCancelDate.lt(endExcl));
            case "collect_schd_date": return odClaim.collectSchdDate.goe(start).and(odClaim.collectSchdDate.lt(endExcl));
            case "reg_date": return odClaim.regDate.goe(start).and(odClaim.regDate.lt(endExcl));
            case "upd_date": return odClaim.updDate.goe(start).and(odClaim.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(OdClaimDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",addShippingFeeChargeCd,", odClaim.addShippingFeeChargeCd, pattern);
        or = orLike(or, all, types, ",addShippingFeeReason,", odClaim.addShippingFeeReason, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", odClaim.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", odClaim.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", odClaim.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", odClaim.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", odClaim.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", odClaim.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", odClaim.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimCancelReasonCd,", odClaim.claimCancelReasonCd, pattern);
        or = orLike(or, all, types, ",claimCancelReasonDetail,", odClaim.claimCancelReasonDetail, pattern);
        or = orLike(or, all, types, ",claimCancelYn,", odClaim.claimCancelYn, pattern);
        or = orLike(or, all, types, ",claimId,", odClaim.claimId, pattern);
        or = orLike(or, all, types, ",claimStatusCd,", odClaim.claimStatusCd, pattern);
        or = orLike(or, all, types, ",claimStatusCdBefore,", odClaim.claimStatusCdBefore, pattern);
        or = orLike(or, all, types, ",claimTypeCd,", odClaim.claimTypeCd, pattern);
        or = orLike(or, all, types, ",collectAddr,", odClaim.collectAddr, pattern);
        or = orLike(or, all, types, ",collectAddrDetail,", odClaim.collectAddrDetail, pattern);
        or = orLike(or, all, types, ",collectNm,", odClaim.collectNm, pattern);
        or = orLike(or, all, types, ",collectPhone,", odClaim.collectPhone, pattern);
        or = orLike(or, all, types, ",collectReqMemo,", odClaim.collectReqMemo, pattern);
        or = orLike(or, all, types, ",collectZip,", odClaim.collectZip, pattern);
        or = orLike(or, all, types, ",customerFaultYn,", odClaim.customerFaultYn, pattern);
        or = orLike(or, all, types, ",exchRecvAddr,", odClaim.exchRecvAddr, pattern);
        or = orLike(or, all, types, ",exchRecvAddrDetail,", odClaim.exchRecvAddrDetail, pattern);
        or = orLike(or, all, types, ",exchRecvNm,", odClaim.exchRecvNm, pattern);
        or = orLike(or, all, types, ",exchRecvPhone,", odClaim.exchRecvPhone, pattern);
        or = orLike(or, all, types, ",exchRecvReqMemo,", odClaim.exchRecvReqMemo, pattern);
        or = orLike(or, all, types, ",exchRecvZip,", odClaim.exchRecvZip, pattern);
        or = orLike(or, all, types, ",exchangeCourierCd,", odClaim.exchangeCourierCd, pattern);
        or = orLike(or, all, types, ",exchangeTrackingNo,", odClaim.exchangeTrackingNo, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", odClaim.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundDlivId,", odClaim.inboundDlivId, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", odClaim.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", odClaim.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", odClaim.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", odClaim.memo, pattern);
        or = orLike(or, all, types, ",orderId,", odClaim.orderId, pattern);
        or = orLike(or, all, types, ",outboundDlivId,", odClaim.outboundDlivId, pattern);
        or = orLike(or, all, types, ",procUserId,", odClaim.procUserId, pattern);
        or = orLike(or, all, types, ",prodNm,", odClaim.prodNm, pattern);
        or = orLike(or, all, types, ",reasonCd,", odClaim.reasonCd, pattern);
        or = orLike(or, all, types, ",reasonDetail,", odClaim.reasonDetail, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", odClaim.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", odClaim.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", odClaim.refundBankCd, pattern);
        or = orLike(or, all, types, ",refundMethodCd,", odClaim.refundMethodCd, pattern);
        or = orLike(or, all, types, ",returnCourierCd,", odClaim.returnCourierCd, pattern);
        or = orLike(or, all, types, ",returnStatusCd,", odClaim.returnStatusCd, pattern);
        or = orLike(or, all, types, ",returnStatusCdBefore,", odClaim.returnStatusCdBefore, pattern);
        or = orLike(or, all, types, ",returnTrackingNo,", odClaim.returnTrackingNo, pattern);
        or = orLike(or, all, types, ",shippingFeeMemo,", odClaim.shippingFeeMemo, pattern);
        or = orLike(or, all, types, ",shippingFeePaidYn,", odClaim.shippingFeePaidYn, pattern);
        or = orLike(or, all, types, ",siteId,", odClaim.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier(Order.DESC, odClaim.requestDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaim.claimId));
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
                    orders.add(new OrderSpecifier(order, odClaim.claimId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaim.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaim.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odClaim.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaim.claimId));
        }
        return orders;
    }

    /* 클레임(취소/반품/교환) 수정 */
    @Override
    public int updateSelective(OdClaim entity) {
        if (entity.getClaimId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odClaim);
        boolean hasAny = false;

        if (entity.getClaimStatusCd()       != null) { update.set(odClaim.claimStatusCd,       entity.getClaimStatusCd());       hasAny = true; }
        if (entity.getClaimStatusCdBefore() != null) { update.set(odClaim.claimStatusCdBefore, entity.getClaimStatusCdBefore()); hasAny = true; }
        if (entity.getRefundMethodCd()      != null) { update.set(odClaim.refundMethodCd,      entity.getRefundMethodCd());      hasAny = true; }
        if (entity.getRefundAmt()           != null) { update.set(odClaim.refundAmt,           entity.getRefundAmt());           hasAny = true; }
        if (entity.getRefundProdAmt()       != null) { update.set(odClaim.refundProdAmt,       entity.getRefundProdAmt());       hasAny = true; }
        if (entity.getRefundShippingAmt()   != null) { update.set(odClaim.refundShippingAmt,   entity.getRefundShippingAmt());   hasAny = true; }
        if (entity.getProcDate()            != null) { update.set(odClaim.procDate,            entity.getProcDate());            hasAny = true; }
        if (entity.getProcUserId()          != null) { update.set(odClaim.procUserId,          entity.getProcUserId());          hasAny = true; }
        if (entity.getReturnCourierCd()     != null) { update.set(odClaim.returnCourierCd,     entity.getReturnCourierCd());     hasAny = true; }
        if (entity.getReturnTrackingNo()    != null) { update.set(odClaim.returnTrackingNo,    entity.getReturnTrackingNo());    hasAny = true; }
        if (entity.getReturnStatusCd()      != null) { update.set(odClaim.returnStatusCd,      entity.getReturnStatusCd());      hasAny = true; }
        if (entity.getExchangeCourierCd()   != null) { update.set(odClaim.exchangeCourierCd,   entity.getExchangeCourierCd());   hasAny = true; }
        if (entity.getExchangeTrackingNo()  != null) { update.set(odClaim.exchangeTrackingNo,  entity.getExchangeTrackingNo());  hasAny = true; }
        if (entity.getMemo()                != null) { update.set(odClaim.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(odClaim.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(odClaim.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odClaim.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odClaim.claimId.eq(entity.getClaimId())).execute();
        return (int) affected;
    }
}

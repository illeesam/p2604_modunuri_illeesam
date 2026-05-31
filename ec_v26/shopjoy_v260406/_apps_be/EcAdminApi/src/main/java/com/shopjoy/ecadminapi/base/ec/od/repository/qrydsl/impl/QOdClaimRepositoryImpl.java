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
    private static final QOdClaim  a   = QOdClaim.odClaim;
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
                        // a.* equivalent (DTO Item 에 존재하는 모든 a. 필드)
                        a.claimId, a.siteId, a.orderId, a.memberId, a.memberNm,
                        a.claimTypeCd, a.claimStatusCd, a.claimStatusCdBefore,
                        a.reasonCd, a.reasonDetail, a.prodNm,
                        a.customerFaultYn,
                        a.claimCancelYn, a.claimCancelDate, a.claimCancelReasonCd, a.claimCancelReasonDetail,
                        a.refundMethodCd, a.refundAmt, a.refundProdAmt, a.refundShippingAmt, a.refundSaveAmt,
                        a.refundBankCd, a.refundAccountNo, a.refundAccountNm,
                        a.requestDate, a.procDate, a.procUserId, a.memo,
                        a.addShippingFee, a.addShippingFeeChargeCd, a.addShippingFeeReason,
                        a.collectNm, a.collectPhone, a.collectZip, a.collectAddr, a.collectAddrDetail, a.collectReqMemo,
                        a.collectSchdDate, a.returnShippingFee, a.returnCourierCd, a.returnTrackingNo,
                        a.returnStatusCd, a.returnStatusCdBefore,
                        a.inboundShippingFee, a.inboundCourierCd, a.inboundTrackingNo, a.inboundDlivId,
                        a.exchRecvNm, a.exchRecvPhone, a.exchRecvZip, a.exchRecvAddr, a.exchRecvAddrDetail, a.exchRecvReqMemo,
                        a.exchangeShippingFee, a.exchangeCourierCd, a.exchangeTrackingNo, a.outboundDlivId,
                        a.totalShippingFee, a.shippingFeePaidYn, a.shippingFeePaidDate, a.shippingFeeMemo,
                        a.apprStatusCd, a.apprStatusCdBefore, a.apprAmt,
                        a.apprTargetCd, a.apprTargetNm, a.apprReason,
                        a.apprReqUserId, a.apprReqDate, a.apprAprvUserId, a.apprAprvDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
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
                .from(a)
                .leftJoin(o).on(o.orderId.eq(a.orderId))
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(a.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(a.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(a.refundMethodCd)))
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(a.refundBankCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(a.returnCourierCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("DLIV_STATUS").and(cdRs.codeValue.eq(a.returnStatusCd)))
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(a.inboundCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(a.exchangeCourierCd)))
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPROVAL_STATUS").and(cdAp.codeValue.eq(a.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPROVAL_TARGET").and(cdAt.codeValue.eq(a.apprTargetCd)))
                .where(a.claimId.eq(claimId))
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
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .where(
                baseAndSiteId(search),
                baseAndClaimId(search),
                baseAndMemberId(search),
                baseAndClaimStatusCd(search),
                baseAndClaimTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdClaimDto.PageResponse res = new OdClaimDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지 공용 base query */
    private JPAQuery<OdClaimDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        a.claimId, a.siteId, a.orderId, a.memberId, a.memberNm,
                        a.claimTypeCd, a.claimStatusCd, a.claimStatusCdBefore,
                        a.reasonCd, a.reasonDetail, a.prodNm,
                        a.customerFaultYn,
                        a.claimCancelYn, a.claimCancelDate, a.claimCancelReasonCd, a.claimCancelReasonDetail,
                        a.refundMethodCd, a.refundAmt, a.refundProdAmt, a.refundShippingAmt, a.refundSaveAmt,
                        a.refundBankCd, a.refundAccountNo, a.refundAccountNm,
                        a.requestDate, a.procDate, a.procUserId, a.memo,
                        a.addShippingFee, a.addShippingFeeChargeCd, a.addShippingFeeReason,
                        a.collectNm, a.collectPhone, a.collectZip, a.collectAddr, a.collectAddrDetail, a.collectReqMemo,
                        a.collectSchdDate, a.returnShippingFee, a.returnCourierCd, a.returnTrackingNo,
                        a.returnStatusCd, a.returnStatusCdBefore,
                        a.inboundShippingFee, a.inboundCourierCd, a.inboundTrackingNo, a.inboundDlivId,
                        a.exchRecvNm, a.exchRecvPhone, a.exchRecvZip, a.exchRecvAddr, a.exchRecvAddrDetail, a.exchRecvReqMemo,
                        a.exchangeShippingFee, a.exchangeCourierCd, a.exchangeTrackingNo, a.outboundDlivId,
                        a.totalShippingFee, a.shippingFeePaidYn, a.shippingFeePaidDate, a.shippingFeeMemo,
                        a.apprStatusCd, a.apprStatusCdBefore, a.apprAmt,
                        a.apprTargetCd, a.apprTargetNm, a.apprReason,
                        a.apprReqUserId, a.apprReqDate, a.apprAprvUserId, a.apprAprvDate,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        o.orderDate.as("orderDate"),
                        o.orderStatusCd.as("orderStatusCd"),
                        m.loginId.as("memberEmail"),
                        cdCt.codeLabel.as("claimTypeCdNm"),
                        cdCs.codeLabel.as("claimStatusCdNm"),
                        cdRm.codeLabel.as("refundMethodCdNm"),
                        cdRc.codeLabel.as("returnCourierCdNm"),
                        cdEc.codeLabel.as("exchangeCourierCdNm")
                ))
                .from(a)
                .leftJoin(o).on(o.orderId.eq(a.orderId))
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE").and(cdCt.codeValue.eq(a.claimTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS").and(cdCs.codeValue.eq(a.claimStatusCd)))
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD").and(cdRm.codeValue.eq(a.refundMethodCd)))
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(a.returnCourierCd)))
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(a.exchangeCourierCd)));
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
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression baseAndClaimId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? a.claimId.eq(search.getClaimId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? a.memberId.eq(search.getMemberId()) : null;
    }

    /* claimStatusCd 정확 일치 */
    private BooleanExpression baseAndClaimStatusCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimStatusCd())
                ? a.claimStatusCd.eq(search.getClaimStatusCd()) : null;
    }

    /* claimTypeCd 정확 일치 */
    private BooleanExpression baseAndClaimTypeCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimTypeCd())
                ? a.claimTypeCd.eq(search.getClaimTypeCd()) : null;
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
            case "request_date": return a.requestDate.goe(start).and(a.requestDate.lt(endExcl));
            case "proc_date": return a.procDate.goe(start).and(a.procDate.lt(endExcl));
            case "claim_cancel_date": return a.claimCancelDate.goe(start).and(a.claimCancelDate.lt(endExcl));
            case "collect_schd_date": return a.collectSchdDate.goe(start).and(a.collectSchdDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",addShippingFeeChargeCd,", a.addShippingFeeChargeCd, pattern);
        or = orLike(or, all, types, ",addShippingFeeReason,", a.addShippingFeeReason, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", a.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", a.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", a.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", a.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", a.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", a.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", a.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimCancelReasonCd,", a.claimCancelReasonCd, pattern);
        or = orLike(or, all, types, ",claimCancelReasonDetail,", a.claimCancelReasonDetail, pattern);
        or = orLike(or, all, types, ",claimCancelYn,", a.claimCancelYn, pattern);
        or = orLike(or, all, types, ",claimId,", a.claimId, pattern);
        or = orLike(or, all, types, ",claimStatusCd,", a.claimStatusCd, pattern);
        or = orLike(or, all, types, ",claimStatusCdBefore,", a.claimStatusCdBefore, pattern);
        or = orLike(or, all, types, ",claimTypeCd,", a.claimTypeCd, pattern);
        or = orLike(or, all, types, ",collectAddr,", a.collectAddr, pattern);
        or = orLike(or, all, types, ",collectAddrDetail,", a.collectAddrDetail, pattern);
        or = orLike(or, all, types, ",collectNm,", a.collectNm, pattern);
        or = orLike(or, all, types, ",collectPhone,", a.collectPhone, pattern);
        or = orLike(or, all, types, ",collectReqMemo,", a.collectReqMemo, pattern);
        or = orLike(or, all, types, ",collectZip,", a.collectZip, pattern);
        or = orLike(or, all, types, ",customerFaultYn,", a.customerFaultYn, pattern);
        or = orLike(or, all, types, ",exchRecvAddr,", a.exchRecvAddr, pattern);
        or = orLike(or, all, types, ",exchRecvAddrDetail,", a.exchRecvAddrDetail, pattern);
        or = orLike(or, all, types, ",exchRecvNm,", a.exchRecvNm, pattern);
        or = orLike(or, all, types, ",exchRecvPhone,", a.exchRecvPhone, pattern);
        or = orLike(or, all, types, ",exchRecvReqMemo,", a.exchRecvReqMemo, pattern);
        or = orLike(or, all, types, ",exchRecvZip,", a.exchRecvZip, pattern);
        or = orLike(or, all, types, ",exchangeCourierCd,", a.exchangeCourierCd, pattern);
        or = orLike(or, all, types, ",exchangeTrackingNo,", a.exchangeTrackingNo, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", a.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundDlivId,", a.inboundDlivId, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", a.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", a.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", a.memo, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",outboundDlivId,", a.outboundDlivId, pattern);
        or = orLike(or, all, types, ",procUserId,", a.procUserId, pattern);
        or = orLike(or, all, types, ",prodNm,", a.prodNm, pattern);
        or = orLike(or, all, types, ",reasonCd,", a.reasonCd, pattern);
        or = orLike(or, all, types, ",reasonDetail,", a.reasonDetail, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", a.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", a.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", a.refundBankCd, pattern);
        or = orLike(or, all, types, ",refundMethodCd,", a.refundMethodCd, pattern);
        or = orLike(or, all, types, ",returnCourierCd,", a.returnCourierCd, pattern);
        or = orLike(or, all, types, ",returnStatusCd,", a.returnStatusCd, pattern);
        or = orLike(or, all, types, ",returnStatusCdBefore,", a.returnStatusCdBefore, pattern);
        or = orLike(or, all, types, ",returnTrackingNo,", a.returnTrackingNo, pattern);
        or = orLike(or, all, types, ",shippingFeeMemo,", a.shippingFeeMemo, pattern);
        or = orLike(or, all, types, ",shippingFeePaidYn,", a.shippingFeePaidYn, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, a.requestDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.claimId));
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
                    orders.add(new OrderSpecifier(order, a.claimId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.claimId));
        }
        return orders;
    }

    /* 클레임(취소/반품/교환) 수정 */
    @Override
    public int updateSelective(OdClaim entity) {
        if (entity.getClaimId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getClaimStatusCd()       != null) { update.set(a.claimStatusCd,       entity.getClaimStatusCd());       hasAny = true; }
        if (entity.getClaimStatusCdBefore() != null) { update.set(a.claimStatusCdBefore, entity.getClaimStatusCdBefore()); hasAny = true; }
        if (entity.getRefundMethodCd()      != null) { update.set(a.refundMethodCd,      entity.getRefundMethodCd());      hasAny = true; }
        if (entity.getRefundAmt()           != null) { update.set(a.refundAmt,           entity.getRefundAmt());           hasAny = true; }
        if (entity.getRefundProdAmt()       != null) { update.set(a.refundProdAmt,       entity.getRefundProdAmt());       hasAny = true; }
        if (entity.getRefundShippingAmt()   != null) { update.set(a.refundShippingAmt,   entity.getRefundShippingAmt());   hasAny = true; }
        if (entity.getProcDate()            != null) { update.set(a.procDate,            entity.getProcDate());            hasAny = true; }
        if (entity.getProcUserId()          != null) { update.set(a.procUserId,          entity.getProcUserId());          hasAny = true; }
        if (entity.getReturnCourierCd()     != null) { update.set(a.returnCourierCd,     entity.getReturnCourierCd());     hasAny = true; }
        if (entity.getReturnTrackingNo()    != null) { update.set(a.returnTrackingNo,    entity.getReturnTrackingNo());    hasAny = true; }
        if (entity.getReturnStatusCd()      != null) { update.set(a.returnStatusCd,      entity.getReturnStatusCd());      hasAny = true; }
        if (entity.getExchangeCourierCd()   != null) { update.set(a.exchangeCourierCd,   entity.getExchangeCourierCd());   hasAny = true; }
        if (entity.getExchangeTrackingNo()  != null) { update.set(a.exchangeTrackingNo,  entity.getExchangeTrackingNo());  hasAny = true; }
        if (entity.getMemo()                != null) { update.set(a.memo,                entity.getMemo());                hasAny = true; }
        if (entity.getApprStatusCd()        != null) { update.set(a.apprStatusCd,        entity.getApprStatusCd());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(a.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.claimId.eq(entity.getClaimId())).execute();
        return (int) affected;
    }
}

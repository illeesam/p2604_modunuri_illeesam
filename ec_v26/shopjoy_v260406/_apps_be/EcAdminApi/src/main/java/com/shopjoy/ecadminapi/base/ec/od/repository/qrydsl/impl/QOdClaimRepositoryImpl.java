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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andClaimId(search),
                andMemberId(search),
                andClaimStatusCd(search),
                andClaimTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
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
    public OdClaimDto.PageResponse selectPageList(OdClaimDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andClaimId(search),
                andMemberId(search),
                andClaimStatusCd(search),
                andClaimTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdClaimDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .leftJoin(m).on(m.memberId.eq(c.memberId))
                .where(
                andSiteId(search),
                andClaimId(search),
                andMemberId(search),
                andClaimStatusCd(search),
                andClaimTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        )
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
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* claimId 정확 일치 */
    private BooleanExpression andClaimId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimId())
                ? c.claimId.eq(search.getClaimId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberId(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? c.memberId.eq(search.getMemberId()) : null;
    }

    /* claimStatusCd 정확 일치 */
    private BooleanExpression andClaimStatusCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimStatusCd())
                ? c.claimStatusCd.eq(search.getClaimStatusCd()) : null;
    }

    /* claimTypeCd 정확 일치 */
    private BooleanExpression andClaimTypeCd(OdClaimDto.Request search) {
        return search != null && StringUtils.hasText(search.getClaimTypeCd())
                ? c.claimTypeCd.eq(search.getClaimTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(OdClaimDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "request_date": return c.requestDate.goe(start).and(c.requestDate.lt(endExcl));
            case "proc_date": return c.procDate.goe(start).and(c.procDate.lt(endExcl));
            case "claim_cancel_date": return c.claimCancelDate.goe(start).and(c.claimCancelDate.lt(endExcl));
            case "collect_schd_date": return c.collectSchdDate.goe(start).and(c.collectSchdDate.lt(endExcl));
            case "reg_date": return c.regDate.goe(start).and(c.regDate.lt(endExcl));
            case "upd_date": return c.updDate.goe(start).and(c.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(OdClaimDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",addShippingFeeChargeCd,", c.addShippingFeeChargeCd, pattern);
        or = orLike(or, all, types, ",addShippingFeeReason,", c.addShippingFeeReason, pattern);
        or = orLike(or, all, types, ",apprAprvUserId,", c.apprAprvUserId, pattern);
        or = orLike(or, all, types, ",apprReason,", c.apprReason, pattern);
        or = orLike(or, all, types, ",apprReqUserId,", c.apprReqUserId, pattern);
        or = orLike(or, all, types, ",apprStatusCd,", c.apprStatusCd, pattern);
        or = orLike(or, all, types, ",apprStatusCdBefore,", c.apprStatusCdBefore, pattern);
        or = orLike(or, all, types, ",apprTargetCd,", c.apprTargetCd, pattern);
        or = orLike(or, all, types, ",apprTargetNm,", c.apprTargetNm, pattern);
        or = orLike(or, all, types, ",claimCancelReasonCd,", c.claimCancelReasonCd, pattern);
        or = orLike(or, all, types, ",claimCancelReasonDetail,", c.claimCancelReasonDetail, pattern);
        or = orLike(or, all, types, ",claimCancelYn,", c.claimCancelYn, pattern);
        or = orLike(or, all, types, ",claimId,", c.claimId, pattern);
        or = orLike(or, all, types, ",claimStatusCd,", c.claimStatusCd, pattern);
        or = orLike(or, all, types, ",claimStatusCdBefore,", c.claimStatusCdBefore, pattern);
        or = orLike(or, all, types, ",claimTypeCd,", c.claimTypeCd, pattern);
        or = orLike(or, all, types, ",collectAddr,", c.collectAddr, pattern);
        or = orLike(or, all, types, ",collectAddrDetail,", c.collectAddrDetail, pattern);
        or = orLike(or, all, types, ",collectNm,", c.collectNm, pattern);
        or = orLike(or, all, types, ",collectPhone,", c.collectPhone, pattern);
        or = orLike(or, all, types, ",collectReqMemo,", c.collectReqMemo, pattern);
        or = orLike(or, all, types, ",collectZip,", c.collectZip, pattern);
        or = orLike(or, all, types, ",customerFaultYn,", c.customerFaultYn, pattern);
        or = orLike(or, all, types, ",exchRecvAddr,", c.exchRecvAddr, pattern);
        or = orLike(or, all, types, ",exchRecvAddrDetail,", c.exchRecvAddrDetail, pattern);
        or = orLike(or, all, types, ",exchRecvNm,", c.exchRecvNm, pattern);
        or = orLike(or, all, types, ",exchRecvPhone,", c.exchRecvPhone, pattern);
        or = orLike(or, all, types, ",exchRecvReqMemo,", c.exchRecvReqMemo, pattern);
        or = orLike(or, all, types, ",exchRecvZip,", c.exchRecvZip, pattern);
        or = orLike(or, all, types, ",exchangeCourierCd,", c.exchangeCourierCd, pattern);
        or = orLike(or, all, types, ",exchangeTrackingNo,", c.exchangeTrackingNo, pattern);
        or = orLike(or, all, types, ",inboundCourierCd,", c.inboundCourierCd, pattern);
        or = orLike(or, all, types, ",inboundDlivId,", c.inboundDlivId, pattern);
        or = orLike(or, all, types, ",inboundTrackingNo,", c.inboundTrackingNo, pattern);
        or = orLike(or, all, types, ",memberId,", c.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", c.memberNm, pattern);
        or = orLike(or, all, types, ",memo,", c.memo, pattern);
        or = orLike(or, all, types, ",orderId,", c.orderId, pattern);
        or = orLike(or, all, types, ",outboundDlivId,", c.outboundDlivId, pattern);
        or = orLike(or, all, types, ",procUserId,", c.procUserId, pattern);
        or = orLike(or, all, types, ",prodNm,", c.prodNm, pattern);
        or = orLike(or, all, types, ",reasonCd,", c.reasonCd, pattern);
        or = orLike(or, all, types, ",reasonDetail,", c.reasonDetail, pattern);
        or = orLike(or, all, types, ",refundAccountNm,", c.refundAccountNm, pattern);
        or = orLike(or, all, types, ",refundAccountNo,", c.refundAccountNo, pattern);
        or = orLike(or, all, types, ",refundBankCd,", c.refundBankCd, pattern);
        or = orLike(or, all, types, ",refundMethodCd,", c.refundMethodCd, pattern);
        or = orLike(or, all, types, ",returnCourierCd,", c.returnCourierCd, pattern);
        or = orLike(or, all, types, ",returnStatusCd,", c.returnStatusCd, pattern);
        or = orLike(or, all, types, ",returnStatusCdBefore,", c.returnStatusCdBefore, pattern);
        or = orLike(or, all, types, ",returnTrackingNo,", c.returnTrackingNo, pattern);
        or = orLike(or, all, types, ",shippingFeeMemo,", c.shippingFeeMemo, pattern);
        or = orLike(or, all, types, ",shippingFeePaidYn,", c.shippingFeePaidYn, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, c.requestDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.claimId));
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
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.claimId));
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(c.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(c.claimId.eq(entity.getClaimId())).execute();
        return (int) affected;
    }
}

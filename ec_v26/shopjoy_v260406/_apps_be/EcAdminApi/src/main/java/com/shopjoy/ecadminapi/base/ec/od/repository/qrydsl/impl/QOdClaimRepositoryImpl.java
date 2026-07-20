package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "request_date", odClaim.requestDate,
        "proc_date", odClaim.procDate,
        "claim_cancel_date", odClaim.claimCancelDate,
        "collect_schd_date", odClaim.collectSchdDate,
        "reg_date", odClaim.regDate,
        "upd_date", odClaim.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("addShippingFeeChargeCd", odClaim.addShippingFeeChargeCd),
        Map.entry("addShippingFeeReason", odClaim.addShippingFeeReason),
        Map.entry("apprAprvUserId", odClaim.apprAprvUserId),
        Map.entry("apprReason", odClaim.apprReason),
        Map.entry("apprReqUserId", odClaim.apprReqUserId),
        Map.entry("apprStatusCd", odClaim.apprStatusCd),
        Map.entry("apprStatusCdBefore", odClaim.apprStatusCdBefore),
        Map.entry("apprTargetCd", odClaim.apprTargetCd),
        Map.entry("apprTargetNm", odClaim.apprTargetNm),
        Map.entry("claimCancelReasonCd", odClaim.claimCancelReasonCd),
        Map.entry("claimCancelReasonDetail", odClaim.claimCancelReasonDetail),
        Map.entry("claimCancelYn", odClaim.claimCancelYn),
        Map.entry("claimId", odClaim.claimId),
        Map.entry("claimStatusCd", odClaim.claimStatusCd),
        Map.entry("claimStatusCdBefore", odClaim.claimStatusCdBefore),
        Map.entry("claimTypeCd", odClaim.claimTypeCd),
        Map.entry("collectAddr", odClaim.collectAddr),
        Map.entry("collectAddrDetail", odClaim.collectAddrDetail),
        Map.entry("collectNm", odClaim.collectNm),
        Map.entry("collectPhone", odClaim.collectPhone),
        Map.entry("collectReqMemo", odClaim.collectReqMemo),
        Map.entry("collectZip", odClaim.collectZip),
        Map.entry("customerFaultYn", odClaim.customerFaultYn),
        Map.entry("exchRecvAddr", odClaim.exchRecvAddr),
        Map.entry("exchRecvAddrDetail", odClaim.exchRecvAddrDetail),
        Map.entry("exchRecvNm", odClaim.exchRecvNm),
        Map.entry("exchRecvPhone", odClaim.exchRecvPhone),
        Map.entry("exchRecvReqMemo", odClaim.exchRecvReqMemo),
        Map.entry("exchRecvZip", odClaim.exchRecvZip),
        Map.entry("exchangeCourierCd", odClaim.exchangeCourierCd),
        Map.entry("exchangeTrackingNo", odClaim.exchangeTrackingNo),
        Map.entry("inboundCourierCd", odClaim.inboundCourierCd),
        Map.entry("inboundDlivId", odClaim.inboundDlivId),
        Map.entry("inboundTrackingNo", odClaim.inboundTrackingNo),
        Map.entry("memberId", odClaim.memberId),
        Map.entry("memberNm", odClaim.memberNm),
        Map.entry("memo", odClaim.memo),
        Map.entry("orderId", odClaim.orderId),
        Map.entry("outboundDlivId", odClaim.outboundDlivId),
        Map.entry("procUserId", odClaim.procUserId),
        Map.entry("prodNm", odClaim.prodNm),
        Map.entry("reasonCd", odClaim.reasonCd),
        Map.entry("reasonDetail", odClaim.reasonDetail),
        Map.entry("refundAccountNm", odClaim.refundAccountNm),
        Map.entry("refundAccountNo", odClaim.refundAccountNo),
        Map.entry("refundBankCd", odClaim.refundBankCd),
        Map.entry("refundMethodCd", odClaim.refundMethodCd),
        Map.entry("returnCourierCd", odClaim.returnCourierCd),
        Map.entry("returnStatusCd", odClaim.returnStatusCd),
        Map.entry("returnStatusCdBefore", odClaim.returnStatusCdBefore),
        Map.entry("returnTrackingNo", odClaim.returnTrackingNo),
        Map.entry("shippingFeeMemo", odClaim.shippingFeeMemo),
        Map.entry("shippingFeePaidYn", odClaim.shippingFeePaidYn),
        Map.entry("siteId", odClaim.siteId)
    );

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
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
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

        JPAQuery<OdClaimDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(odClaim.siteId, search.getSiteId()),
                    QdslUtil.strEq(odClaim.claimId, search.getClaimId()),
                    QdslUtil.strEq(odClaim.orderId, search.getOrderId()),
                    QdslUtil.strEq(odClaim.memberId, search.getMemberId()),
                    QdslUtil.strEq(odClaim.claimStatusCd, search.getClaimStatusCd()),
                    QdslUtil.strEq(odClaim.claimTypeCd, search.getClaimTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 클레임(취소/반품/교환) 페이지조회 */
    @Override
    public OdClaimDto.PageResponse selectPageData(OdClaimDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(odClaim.siteId, search.getSiteId()),
                QdslUtil.strEq(odClaim.claimId, search.getClaimId()),
                QdslUtil.strEq(odClaim.orderId, search.getOrderId()),
                QdslUtil.strEq(odClaim.memberId, search.getMemberId()),
                QdslUtil.strEq(odClaim.claimStatusCd, search.getClaimStatusCd()),
                QdslUtil.strEq(odClaim.claimTypeCd, search.getClaimTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdClaimDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdClaimDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odClaim.count())
                .where(wheres)
                .fetchOne();

        OdClaimDto.PageResponse res = new OdClaimDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(OdClaimDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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

package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
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
    private static final QOdClaimItem odClaimItemCnt = new QOdClaimItem("oci_cnt");   // 클레임항목 수 집계 전용
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
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

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * CLAIM_TYPE    {CANCEL:취소, RETURN:반품, EXCHANGE:교환}
     * CLAIM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회}
     * REFUND_METHOD {CARD:카드 취소, BANK:계좌이체, CACHE:캐시(충전금) 환급}
     * COURIER       {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
     */
    private JPAQuery<OdClaimDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        odClaim.claimId,                    // 클레임ID (YYMMDDhhmmss+rand4)
                        odClaim.siteId,                      // 사이트ID (sy_site.site_id)
                        odClaim.orderId,                     // 주문ID
                        odClaim.memberId,                    // 회원ID
                        odClaim.memberNm,                    // 회원명
                        odClaim.claimTypeCd,                 // 클레임유형 — CLAIM_TYPE {CANCEL:취소, RETURN:반품, EXCHANGE:교환}
                        odClaim.claimStatusCd,               // 클레임상태 — CLAIM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회}
                        odClaim.claimStatusCdBefore,         // 변경 전 클레임상태 — CLAIM_STATUS (동일 코드그룹)
                        odClaim.reasonCd,                    // 사유코드 — CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON (claim_type_cd 별 분기)
                        odClaim.reasonDetail,                // 사유 상세
                        odClaim.prodNm,                      // 대표 상품명
                        odClaim.customerFaultYn,             // 고객귀책여부 (Y=고객귀책, N=판매자귀책)
                        odClaim.claimCancelYn,               // 클레임 철회여부 Y/N (신청 자체를 취소한 경우)
                        odClaim.claimCancelDate,             // 클레임 철회일시
                        odClaim.claimCancelReasonCd,         // 클레임 철회사유코드
                        odClaim.claimCancelReasonDetail,     // 클레임 철회사유상세
                        odClaim.refundMethodCd,              // 환불수단 — REFUND_METHOD {CARD:카드 취소, BANK:계좌이체, CACHE:캐시(충전금) 환급}
                        odClaim.refundAmt,                   // 환불 합계금액 (상품금액+배송비-추가배송비-적립금복원)
                        odClaim.refundProdAmt,               // 환불 상품금액
                        odClaim.refundShippingAmt,           // 환불 배송비
                        odClaim.refundSaveAmt,               // 환불 적립금 합계 (사용 적립금 복원액)
                        odClaim.refundBankCd,                // 환불 은행코드 — BANK_CODE (계좌이체 환불 시)
                        odClaim.refundAccountNo,             // 환불 계좌번호
                        odClaim.refundAccountNm,             // 환불 예금주명
                        odClaim.requestDate,                 // 클레임 요청일시
                        odClaim.procDate,                    // 처리일시
                        odClaim.procUserId,                  // 처리자 (sy_user.user_id)
                        odClaim.memo,                        // 관리메모
                        odClaim.addShippingFee,              // 추가배송비 (교환=출고배송비, 반품/취소=무료배송 조건 파괴 시 추가)
                        odClaim.addShippingFeeChargeCd,      // 추가배송비 청구방법코드
                        odClaim.addShippingFeeReason,        // 추가배송비 면제사유
                        odClaim.collectNm,                   // 수거지 성명 (반품·교환 수거 주소)
                        odClaim.collectPhone,                // 수거지 연락처
                        odClaim.collectZip,                  // 수거지 우편번호
                        odClaim.collectAddr,                 // 수거지 기본주소
                        odClaim.collectAddrDetail,           // 수거지 상세주소
                        odClaim.collectReqMemo,              // 수거 요청사항
                        odClaim.collectSchdDate,             // 수거 예정일시
                        odClaim.returnShippingFee,           // 수거배송료
                        odClaim.returnCourierCd,             // 수거 택배사 — COURIER {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
                        odClaim.returnTrackingNo,            // 수거 송장번호
                        odClaim.returnStatusCd,              // 수거 상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odClaim.returnStatusCdBefore,        // 변경 전 수거상태 — DLIV_STATUS (동일 코드그룹)
                        odClaim.inboundShippingFee,          // 반입배송료
                        odClaim.inboundCourierCd,            // 반입 택배사 — COURIER (동일 코드그룹)
                        odClaim.inboundTrackingNo,           // 반입 송장번호
                        odClaim.inboundDlivId,               // 반입 배송ID (od_dliv.)
                        odClaim.exchRecvNm,                  // 교환 수령자명 (원 주문 배송지와 다를 경우)
                        odClaim.exchRecvPhone,               // 교환 수령자 연락처
                        odClaim.exchRecvZip,                 // 교환 수령지 우편번호
                        odClaim.exchRecvAddr,                // 교환 수령지 기본주소
                        odClaim.exchRecvAddrDetail,          // 교환 수령지 상세주소
                        odClaim.exchRecvReqMemo,             // 교환 배송 요청사항
                        odClaim.exchangeShippingFee,         // 교환상품 발송배송료
                        odClaim.exchangeCourierCd,           // 교환상품 발송 택배사 — COURIER (동일 코드그룹)
                        odClaim.exchangeTrackingNo,          // 교환상품 발송 송장번호
                        odClaim.outboundDlivId,              // 교환상품 발송 배송ID (od_dliv.)
                        odClaim.totalShippingFee,            // 총 배송료 (수거+반입+발송)
                        odClaim.shippingFeePaidYn,           // 배송료 정산 완료 여부 Y/N
                        odClaim.shippingFeePaidDate,         // 배송료 정산일시
                        odClaim.shippingFeeMemo,             // 배송료 비고
                        odClaim.apprStatusCd,                // 결재상태 — APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odClaim.apprStatusCdBefore,          // 변경 전 결재상태 — APPR_STATUS (동일 코드그룹)
                        odClaim.apprAmt,                     // 결재 요청금액
                        odClaim.apprTargetCd,                // 결재대상 구분 — APPR_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odClaim.apprTargetNm,                // 결재 대상명
                        odClaim.apprReason,                  // 사유/메모
                        odClaim.apprReqUserId,               // 결재 요청자 (sy_user.user_id)
                        odClaim.apprReqDate,                 // 결재 요청일시
                        odClaim.apprAprvUserId,              // 결재자 (sy_user.user_id)
                        odClaim.apprAprvDate,                // 결재일시
                        odClaim.regBy, odClaim.regDate, odClaim.updBy, odClaim.updDate,
                        // joined — 원 주문(od_order) / 회원(mb_member) / 코드라벨(sy_code)
                        odOrder.orderDate.as("orderDate"),                   // 원 주문 주문일시
                        odOrder.orderStatusCd.as("orderStatusCd"),           // 원 주문 상태 — ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:주문취소, AUTO_CANCELLED:자동취소}
                        mbMember.loginId.as("memberEmail"),                  // 회원 로그인ID(이메일)
                        cdCt.codeLabel.as("claimTypeCdNm"),                  // 클레임유형 라벨 — CLAIM_TYPE
                        cdCs.codeLabel.as("claimStatusCdNm"),                // 클레임상태 라벨 — CLAIM_STATUS
                        cdRm.codeLabel.as("refundMethodCdNm"),               // 환불수단 라벨 — REFUND_METHOD
                        cdRc.codeLabel.as("returnCourierCdNm"),              // 수거 택배사 라벨 — COURIER
                        cdEc.codeLabel.as("exchangeCourierCdNm"),            // 교환상품 발송 택배사 라벨 — COURIER
                        /* 클레임항목 수 — 목록은 claimItems 를 채우지 않으므로(N+1 방지) 건수만 상관 서브쿼리로 집계.
                           항목이 없으면 null 대신 0 이 내려가도록 COALESCE 로 감싼다. */
                        ExpressionUtils.as(
                            Expressions.numberTemplate(Long.class, "COALESCE({0}, 0)",
                                JPAExpressions.select(odClaimItemCnt.count())
                                    .from(odClaimItemCnt)
                                    .where(odClaimItemCnt.claimId.eq(odClaim.claimId))),
                            "claimItemCnt")
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

    /*
     * selectById — 코드성 필드는 baseListQuery 와 동일 코드그룹 (CLAIM_TYPE/CLAIM_STATUS/REFUND_METHOD/COURIER/DLIV_STATUS/APPR_STATUS/APPR_TARGET)
     * 상세조회 전용 추가 조인: refundBankCd→BANK_CODE, returnStatusCd/inboundCourierCd→DLIV_STATUS·COURIER, apprTargetCd→APPR_TARGET
     */
    /* 클레임(취소/반품/교환) 키조회 */
    @Override
    public Optional<OdClaimDto.Item> selectById(String claimId) {
        OdClaimDto.Item dto = queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 모든 a. 필드)
                        odClaim.claimId,                      // 클레임ID (YYMMDDhhmmss+rand4)
                        odClaim.siteId,                        // 사이트ID (sy_site.site_id)
                        odClaim.orderId,                       // 주문ID
                        odClaim.memberId,                      // 회원ID
                        odClaim.memberNm,                      // 회원명
                        odClaim.claimTypeCd,                   // 클레임유형 — CLAIM_TYPE {CANCEL:취소, RETURN:반품, EXCHANGE:교환}
                        odClaim.claimStatusCd,                 // 클레임상태 — CLAIM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, REFUND_WAIT:환불대기, COMPLT:완료, REJECTED:거부, CANCELLED:철회}
                        odClaim.claimStatusCdBefore,           // 변경 전 클레임상태 — CLAIM_STATUS (동일 코드그룹)
                        odClaim.reasonCd,                      // 사유코드 — CANCEL_REASON/RETURN_REASON/EXCHANGE_REASON (claim_type_cd 별 분기)
                        odClaim.reasonDetail,                  // 사유 상세
                        odClaim.prodNm,                        // 대표 상품명
                        odClaim.customerFaultYn,               // 고객귀책여부 (Y=고객귀책, N=판매자귀책)
                        odClaim.claimCancelYn,                  // 클레임 철회여부 Y/N
                        odClaim.claimCancelDate,               // 클레임 철회일시
                        odClaim.claimCancelReasonCd,           // 클레임 철회사유코드
                        odClaim.claimCancelReasonDetail,       // 클레임 철회사유상세
                        odClaim.refundMethodCd,                // 환불수단 — REFUND_METHOD {CARD:카드 취소, BANK:계좌이체, CACHE:캐시(충전금) 환급}
                        odClaim.refundAmt,                     // 환불 합계금액
                        odClaim.refundProdAmt,                 // 환불 상품금액
                        odClaim.refundShippingAmt,             // 환불 배송비
                        odClaim.refundSaveAmt,                 // 환불 적립금 합계
                        odClaim.refundBankCd,                  // 환불 은행코드 — BANK_CODE (계좌이체 환불 시)
                        odClaim.refundAccountNo,               // 환불 계좌번호
                        odClaim.refundAccountNm,               // 환불 예금주명
                        odClaim.requestDate,                   // 클레임 요청일시
                        odClaim.procDate,                      // 처리일시
                        odClaim.procUserId,                    // 처리자 (sy_user.user_id)
                        odClaim.memo,                          // 관리메모
                        odClaim.addShippingFee,                // 추가배송비
                        odClaim.addShippingFeeChargeCd,        // 추가배송비 청구방법코드
                        odClaim.addShippingFeeReason,          // 추가배송비 면제사유
                        odClaim.collectNm,                     // 수거지 성명
                        odClaim.collectPhone,                  // 수거지 연락처
                        odClaim.collectZip,                    // 수거지 우편번호
                        odClaim.collectAddr,                   // 수거지 기본주소
                        odClaim.collectAddrDetail,             // 수거지 상세주소
                        odClaim.collectReqMemo,                // 수거 요청사항
                        odClaim.collectSchdDate,               // 수거 예정일시
                        odClaim.returnShippingFee,             // 수거배송료
                        odClaim.returnCourierCd,               // 수거 택배사 — COURIER {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
                        odClaim.returnTrackingNo,              // 수거 송장번호
                        odClaim.returnStatusCd,                // 수거 상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odClaim.returnStatusCdBefore,          // 변경 전 수거상태 — DLIV_STATUS (동일 코드그룹)
                        odClaim.inboundShippingFee,            // 반입배송료
                        odClaim.inboundCourierCd,              // 반입 택배사 — COURIER (동일 코드그룹)
                        odClaim.inboundTrackingNo,             // 반입 송장번호
                        odClaim.inboundDlivId,                 // 반입 배송ID (od_dliv.)
                        odClaim.exchRecvNm,                    // 교환 수령자명
                        odClaim.exchRecvPhone,                 // 교환 수령자 연락처
                        odClaim.exchRecvZip,                   // 교환 수령지 우편번호
                        odClaim.exchRecvAddr,                  // 교환 수령지 기본주소
                        odClaim.exchRecvAddrDetail,            // 교환 수령지 상세주소
                        odClaim.exchRecvReqMemo,               // 교환 배송 요청사항
                        odClaim.exchangeShippingFee,           // 교환상품 발송배송료
                        odClaim.exchangeCourierCd,             // 교환상품 발송 택배사 — COURIER (동일 코드그룹)
                        odClaim.exchangeTrackingNo,            // 교환상품 발송 송장번호
                        odClaim.outboundDlivId,                // 교환상품 발송 배송ID (od_dliv.)
                        odClaim.totalShippingFee,              // 총 배송료 (수거+반입+발송)
                        odClaim.shippingFeePaidYn,             // 배송료 정산 완료 여부 Y/N
                        odClaim.shippingFeePaidDate,           // 배송료 정산일시
                        odClaim.shippingFeeMemo,               // 배송료 비고
                        odClaim.apprStatusCd,                  // 결재상태 — APPR_STATUS {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:처리완료}
                        odClaim.apprStatusCdBefore,            // 변경 전 결재상태 — APPR_STATUS (동일 코드그룹)
                        odClaim.apprAmt,                       // 결재 요청금액
                        odClaim.apprTargetCd,                  // 결재대상 구분 — APPR_TARGET {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
                        odClaim.apprTargetNm,                  // 결재 대상명
                        odClaim.apprReason,                    // 사유/메모
                        odClaim.apprReqUserId,                 // 결재 요청자 (sy_user.user_id)
                        odClaim.apprReqDate,                   // 결재 요청일시
                        odClaim.apprAprvUserId,                // 결재자 (sy_user.user_id)
                        odClaim.apprAprvDate,                  // 결재일시
                        odClaim.regBy, odClaim.regDate, odClaim.updBy, odClaim.updDate,
                        // joined — 원 주문(od_order) / 회원(mb_member) / 코드라벨(sy_code)
                        odOrder.orderDate.as("orderDate"),                     // 원 주문 주문일시
                        odOrder.orderStatusCd.as("orderStatusCd"),             // 원 주문 상태 — ORDER_STATUS {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비, SHIPPED:배송중, DELIVERED:배송완료, COMPLT:구매확정, CANCELLED:주문취소, AUTO_CANCELLED:자동취소}
                        odOrder.payMethodCd.as("payMethodCd"),                 // 원 주문 결제수단 — PAY_METHOD (환불수단 결정에 참조)
                        odOrder.recvNm.as("recvNm"),                           // 원 주문 수령자명 (수거지 기본값)
                        odOrder.recvPhone.as("recvPhone"),                     // 원 주문 수령자 연락처
                        odOrder.recvAddr.as("recvAddr"),                       // 원 주문 배송지 주소
                        mbMember.loginId.as("memberEmail"),                    // 회원 로그인ID(이메일) — 알림 발송용
                        mbMember.memberPhone.as("memberPhoneOrigin"),          // 회원 원본 연락처 (클레임 접수 당시 값과 대조용)
                        cdCt.codeLabel.as("claimTypeCdNm"),                    // 클레임유형 라벨 — CLAIM_TYPE
                        cdCs.codeLabel.as("claimStatusCdNm"),                  // 클레임상태 라벨 — CLAIM_STATUS
                        cdRm.codeLabel.as("refundMethodCdNm"),                 // 환불수단 라벨 — REFUND_METHOD
                        cdRb.codeLabel.as("refundBankCdNm"),                   // 환불 은행 라벨 — BANK_CODE (계좌이체 환불 시)
                        cdRc.codeLabel.as("returnCourierCdNm"),                // 수거 택배사 라벨 — COURIER
                        cdRs.codeLabel.as("returnStatusCdNm"),                 // 수거 상태 라벨 — DLIV_STATUS
                        cdIc.codeLabel.as("inboundCourierCdNm"),               // 반입 택배사 라벨 — COURIER
                        cdEc.codeLabel.as("exchangeCourierCdNm"),              // 교환상품 발송 택배사 라벨 — COURIER
                        cdAp.codeLabel.as("apprStatusCdNm"),                   // 결재상태 라벨 — APPR_STATUS
                        cdAt.codeLabel.as("apprTargetCdNm")                    // 결재대상 라벨 — APPR_TARGET
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
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPR_STATUS").and(cdAp.codeValue.eq(odClaim.apprStatusCd)))
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPR_TARGET").and(cdAt.codeValue.eq(odClaim.apprTargetCd)))
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
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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
    public BasePage<OdClaimDto.Item> selectPageData(OdClaimDto.Request search) {
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
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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

        BasePage<OdClaimDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */

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

package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

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
    private static final QVwSyCode   cdCt = new QVwSyCode("cd_ct");
    private static final QVwSyCode   cdCs = new QVwSyCode("cd_cs");
    private static final QVwSyCode   cdRm = new QVwSyCode("cd_rm");
    private static final QVwSyCode   cdRb = new QVwSyCode("cd_rb");
    private static final QVwSyCode   cdRc = new QVwSyCode("cd_rc");
    private static final QVwSyCode   cdRs = new QVwSyCode("cd_rs");
    private static final QVwSyCode   cdIc = new QVwSyCode("cd_ic");
    private static final QVwSyCode   cdEc = new QVwSyCode("cd_ec");
    private static final QVwSyCode   cdAp = new QVwSyCode("cd_ap");
    private static final QVwSyCode   cdAt = new QVwSyCode("cd_at");    /*
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
                .leftJoin(odOrder).on(odOrder.orderId.eq(odClaim.orderId)) // 주문
                .leftJoin(mbMember).on(mbMember.memberId.eq(odClaim.memberId)) // 회원
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE_CD").and(cdCt.codeValue.eq(odClaim.claimTypeCd))) // 클레임유형
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS_CD").and(cdCs.codeValue.eq(odClaim.claimStatusCd))) // 클레임상태
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD_CD").and(cdRm.codeValue.eq(odClaim.refundMethodCd))) // 환불수단
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(odClaim.returnCourierCd))) // 택배사
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(odClaim.exchangeCourierCd))) // 택배사
                ;
    }

    /*
     * selectById — 코드성 필드는 baseListQuery 와 동일 코드그룹 (CLAIM_TYPE/CLAIM_STATUS/REFUND_METHOD/COURIER/DLIV_STATUS/APPR_STATUS/APPR_TARGET)
     * 상세조회 전용 추가 조인: refundBankCd→BANK_CODE, returnStatusCd/inboundCourierCd→DLIV_STATUS·COURIER, apprTargetCd→APPR_TARGET
     */
    /* 클레임(취소/반품/교환) 키조회 */
    @Override
    public Optional<OdClaimDto.Item> selectById(String claimId) {
        OdClaimDto.Item dtl = queryFactory
                .select(Projections.bean(OdClaimDto.Item.class,
                        // a.* equivalent (DTO Item 에 존재하는 모든 a. 필드)
                        odClaim.claimId,                      // 클레임ID (YYMMDDhhmmss+rand4)
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
                .leftJoin(odOrder).on(odOrder.orderId.eq(odClaim.orderId)) // 주문
                .leftJoin(mbMember).on(mbMember.memberId.eq(odClaim.memberId)) // 회원
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CLAIM_TYPE_CD").and(cdCt.codeValue.eq(odClaim.claimTypeCd))) // 클레임유형
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("CLAIM_STATUS_CD").and(cdCs.codeValue.eq(odClaim.claimStatusCd))) // 클레임상태
                .leftJoin(cdRm).on(cdRm.codeGrp.eq("REFUND_METHOD_CD").and(cdRm.codeValue.eq(odClaim.refundMethodCd))) // 환불수단
                .leftJoin(cdRb).on(cdRb.codeGrp.eq("BANK_CODE").and(cdRb.codeValue.eq(odClaim.refundBankCd))) // 은행
                .leftJoin(cdRc).on(cdRc.codeGrp.eq("COURIER").and(cdRc.codeValue.eq(odClaim.returnCourierCd))) // 택배사
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("DLIV_STATUS").and(cdRs.codeValue.eq(odClaim.returnStatusCd))) // 배송상태
                .leftJoin(cdIc).on(cdIc.codeGrp.eq("COURIER").and(cdIc.codeValue.eq(odClaim.inboundCourierCd))) // 택배사
                .leftJoin(cdEc).on(cdEc.codeGrp.eq("COURIER").and(cdEc.codeValue.eq(odClaim.exchangeCourierCd))) // 택배사
                .leftJoin(cdAp).on(cdAp.codeGrp.eq("APPR_STATUS_CD").and(cdAp.codeValue.eq(odClaim.apprStatusCd))) // 결재상태
                .leftJoin(cdAt).on(cdAt.codeGrp.eq("APPR_TARGET_CD").and(cdAt.codeValue.eq(odClaim.apprTargetCd))) // 결재대상
                .where(odClaim.claimId.eq(claimId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 클레임(취소/반품/교환) 목록조회 */
    @Override
    public List<OdClaimDto.Item> selectList(OdClaimDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odClaim.claimId, search.getClaimId()));
        whereList.add(QdslUtil.strEq(odClaim.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(odClaim.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(odClaim.claimStatusCd, search.getClaimStatusCd()));
        whereList.add(QdslUtil.strIn(odClaim.claimStatusCd, search.getClaimStatusCds()));
        whereList.add(QdslUtil.strEq(odClaim.claimTypeCd, search.getClaimTypeCd()));
        whereList.add("proc_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.procDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("claim_cancel_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.claimCancelDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("collect_schd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.collectSchdDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("request_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.requestDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdClaimDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<OdClaimDto.Item> list = query.fetch();
        return list;
    }

    /* 클레임(취소/반품/교환) 페이지조회 */
    @Override
    public BasePage<OdClaimDto.Item> selectPageData(OdClaimDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odClaim.claimId, search.getClaimId()));
        whereList.add(QdslUtil.strEq(odClaim.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(odClaim.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(odClaim.claimStatusCd, search.getClaimStatusCd()));
        whereList.add(QdslUtil.strIn(odClaim.claimStatusCd, search.getClaimStatusCds()));
        whereList.add(QdslUtil.strEq(odClaim.claimTypeCd, search.getClaimTypeCd()));
        whereList.add("proc_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.procDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("claim_cancel_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.claimCancelDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("collect_schd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.collectSchdDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("request_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odClaim.requestDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdClaimDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdClaimDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odClaim.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdClaimDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("addShippingFeeChargeCd", odClaim.addShippingFeeChargeCd),
            QdslUtil.FieldDef.like("addShippingFeeReason", odClaim.addShippingFeeReason),
            QdslUtil.FieldDef.like("apprAprvUserId", odClaim.apprAprvUserId),
            QdslUtil.FieldDef.like("apprReason", odClaim.apprReason),
            QdslUtil.FieldDef.like("apprReqUserId", odClaim.apprReqUserId),
            QdslUtil.FieldDef.like("apprStatusCd", odClaim.apprStatusCd),
            QdslUtil.FieldDef.like("apprStatusCdBefore", odClaim.apprStatusCdBefore),
            QdslUtil.FieldDef.like("apprTargetCd", odClaim.apprTargetCd),
            QdslUtil.FieldDef.like("apprTargetNm", odClaim.apprTargetNm),
            QdslUtil.FieldDef.like("claimCancelReasonCd", odClaim.claimCancelReasonCd),
            QdslUtil.FieldDef.like("claimCancelReasonDetail", odClaim.claimCancelReasonDetail),
            QdslUtil.FieldDef.like("claimCancelYn", odClaim.claimCancelYn),
            QdslUtil.FieldDef.like("claimId", odClaim.claimId),
            QdslUtil.FieldDef.like("claimStatusCd", odClaim.claimStatusCd),
            QdslUtil.FieldDef.like("claimStatusCdBefore", odClaim.claimStatusCdBefore),
            QdslUtil.FieldDef.like("claimTypeCd", odClaim.claimTypeCd),
            QdslUtil.FieldDef.like("collectAddr", odClaim.collectAddr),
            QdslUtil.FieldDef.like("collectAddrDetail", odClaim.collectAddrDetail),
            QdslUtil.FieldDef.like("collectNm", odClaim.collectNm),
            QdslUtil.FieldDef.like("collectPhone", odClaim.collectPhone),
            QdslUtil.FieldDef.like("collectReqMemo", odClaim.collectReqMemo),
            QdslUtil.FieldDef.like("collectZip", odClaim.collectZip),
            QdslUtil.FieldDef.like("customerFaultYn", odClaim.customerFaultYn),
            QdslUtil.FieldDef.like("exchRecvAddr", odClaim.exchRecvAddr),
            QdslUtil.FieldDef.like("exchRecvAddrDetail", odClaim.exchRecvAddrDetail),
            QdslUtil.FieldDef.like("exchRecvNm", odClaim.exchRecvNm),
            QdslUtil.FieldDef.like("exchRecvPhone", odClaim.exchRecvPhone),
            QdslUtil.FieldDef.like("exchRecvReqMemo", odClaim.exchRecvReqMemo),
            QdslUtil.FieldDef.like("exchRecvZip", odClaim.exchRecvZip),
            QdslUtil.FieldDef.like("exchangeCourierCd", odClaim.exchangeCourierCd),
            QdslUtil.FieldDef.like("exchangeTrackingNo", odClaim.exchangeTrackingNo),
            QdslUtil.FieldDef.like("inboundCourierCd", odClaim.inboundCourierCd),
            QdslUtil.FieldDef.like("inboundDlivId", odClaim.inboundDlivId),
            QdslUtil.FieldDef.like("inboundTrackingNo", odClaim.inboundTrackingNo),
            QdslUtil.FieldDef.like("memberId", odClaim.memberId),
            QdslUtil.FieldDef.like("memberNm", odClaim.memberNm),
            QdslUtil.FieldDef.like("memo", odClaim.memo),
            QdslUtil.FieldDef.like("orderId", odClaim.orderId),
            QdslUtil.FieldDef.like("outboundDlivId", odClaim.outboundDlivId),
            QdslUtil.FieldDef.like("procUserId", odClaim.procUserId),
            QdslUtil.FieldDef.like("prodNm", odClaim.prodNm),
            QdslUtil.FieldDef.like("reasonCd", odClaim.reasonCd),
            QdslUtil.FieldDef.like("reasonDetail", odClaim.reasonDetail),
            QdslUtil.FieldDef.like("refundAccountNm", odClaim.refundAccountNm),
            QdslUtil.FieldDef.like("refundAccountNo", odClaim.refundAccountNo),
            QdslUtil.FieldDef.like("refundBankCd", odClaim.refundBankCd),
            QdslUtil.FieldDef.like("refundMethodCd", odClaim.refundMethodCd),
            QdslUtil.FieldDef.like("returnCourierCd", odClaim.returnCourierCd),
            QdslUtil.FieldDef.like("returnStatusCd", odClaim.returnStatusCd),
            QdslUtil.FieldDef.like("returnStatusCdBefore", odClaim.returnStatusCdBefore),
            QdslUtil.FieldDef.like("returnTrackingNo", odClaim.returnTrackingNo),
            QdslUtil.FieldDef.like("shippingFeeMemo", odClaim.shippingFeeMemo),
            QdslUtil.FieldDef.like("shippingFeePaidYn", odClaim.shippingFeePaidYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimId", odClaim.claimId,
                   "memberNm", odClaim.memberNm,
                   "regDate", odClaim.regDate),
        new OrderSpecifier<>(Order.DESC, odClaim.regDate),
        new OrderSpecifier<>(Order.ASC, odClaim.claimId));
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
        update.set(odClaim.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odClaim.claimId.eq(entity.getClaimId())).execute();
        return (int) affected;
    }
}

package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdClaimDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String claimId;  // 클레임ID 필터
        @Size(max = 21) private String orderId;  // 주문ID 필터
        @Size(max = 21) private String memberId;  // 회원ID 필터
        @Size(max = 50) private String claimStatusCd;    // 클레임상태 단건 필터 (strEq)
        private List<String> claimStatusCds;              // 클레임상태 다중 필터 (strIn, BO multiCheck)
        @Size(max = 50) private String claimTypeCd;  // 클레임유형 필터 — CLAIM_TYPE_CD {CANCEL:취소, RETURN:반품, EXCHANGE:교환}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String claimId;  // 클레임ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID
        private String memberId;  // 회원ID
        private String memberNm;  // 회원명
        private String claimTypeCd;  // 클레임유형 — CLAIM_TYPE_CD {CANCEL:취소, RETURN:반품, EXCHANGE:교환}
        private String claimStatusCd;  // 클레임상태 — CLAIM_STATUS_CD {REQUESTED:요청, ACCEPTED:승인, APPROVED:승인, IN_PICKUP:수거중, REJECTED:반려, COMPLT:처리완료, PROCESSING:처리중, REFUND_WAIT:환불대기 외 1개}
        private String claimStatusCdBefore;  // 변경 전 클레임상태 — CLAIM_STATUS_CD
        private String reasonCd;  // 사유코드 — REASON_CD {MIND_CHANGE:단순변심, WRONG_OPTION:옵션선택오류, CHEAPER_ELSEWHERE:타사더저렴, DELAY:배송지연 외}
        private String reasonDetail;  // 사유 상세
        private String prodNm;  // 대표 상품명
        private String customerFaultYn;  // 고객귀책여부 (Y=고객귀책, N=판매자귀책)
        private String claimCancelYn;  // 클레임 철회여부 Y/N (신청 자체를 취소한 경우)
        private LocalDateTime claimCancelDate;  // 클레임 철회일시
        private String claimCancelReasonCd;  // 클레임 철회사유코드
        private String claimCancelReasonDetail;  // 클레임 철회사유상세
        private String refundMethodCd;  // 환불수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스, KAKAO:카카오페이, NAVER:네이버페이 외}
        private Long refundAmt;  // 환불 합계금액 (상품금액+배송비-추가배송비-적립금복원)
        private Long refundProdAmt;  // 환불 상품금액
        private Long refundShippingAmt;  // 환불 배송비
        private Long refundSaveAmt;  // 환불 적립금 합계 (사용 적립금 복원액)
        private String refundBankCd;  // 환불 은행코드 — BANK_CODE (계좌이체 환불 시)
        private String refundAccountNo;  // 환불 계좌번호
        private String refundAccountNm;  // 환불 예금주명
        private LocalDateTime requestDate;  // 클레임 요청일시
        private LocalDateTime procDate;  // 처리일시
        private String procUserId;  // 처리자 (sy_user.user_id)
        private String memo;  // 관리메모
        private Long addShippingFee;  // 추가배송비 (교환=출고배송비, 반품/취소=무료배송 조건 파괴 시 추가)
        private String addShippingFeeChargeCd;  // 추가배송비 청구방법코드
        private String addShippingFeeReason;  // 추가배송비 면제사유
        private String collectNm;  // 수거지 성명 (반품·교환 수거 주소)
        private String collectPhone;  // 수거지 연락처
        private String collectZip;  // 수거지 우편번호
        private String collectAddr;  // 수거지 기본주소
        private String collectAddrDetail;  // 수거지 상세주소
        private String collectReqMemo;  // 수거 요청사항
        private LocalDateTime collectSchdDate;  // 수거 예정일시
        private Long returnShippingFee;  // 수거배송료
        private String returnCourierCd;  // 수거 택배사 — COURIER {CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배 외}
        private String returnTrackingNo;  // 수거 송장번호
        private String returnStatusCd;  // 수거 상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
        private String returnStatusCdBefore;  // 변경 전 수거상태 — DLIV_STATUS
        private Long inboundShippingFee;  // 반입배송료
        private String inboundCourierCd;  // 반입 택배사 — COURIER
        private String inboundTrackingNo;  // 반입 송장번호
        private String inboundDlivId;  // 반입 배송ID (od_dliv.)
        private String exchRecvNm;  // 교환 수령자명 (원 주문 배송지와 다를 경우)
        private String exchRecvPhone;  // 교환 수령자 연락처
        private String exchRecvZip;  // 교환 수령지 우편번호
        private String exchRecvAddr;  // 교환 수령지 기본주소
        private String exchRecvAddrDetail;  // 교환 수령지 상세주소
        private String exchRecvReqMemo;  // 교환 배송 요청사항
        private Long exchangeShippingFee;  // 교환상품 발송배송료
        private String exchangeCourierCd;  // 교환상품 발송 택배사 — COURIER
        private String exchangeTrackingNo;  // 교환상품 발송 송장번호
        private String outboundDlivId;  // 교환상품 발송 배송ID (od_dliv.)
        private Long totalShippingFee;  // 총 배송료 (수거+반입+발송)
        private String shippingFeePaidYn;  // 배송료 정산 완료 여부 Y/N
        private LocalDateTime shippingFeePaidDate;  // 배송료 정산일시
        private String shippingFeeMemo;  // 배송료 비고
        private String apprStatusCd;  // 결재상태 — APPR_STATUS_CD {REQ:결재요청, APPROVED:승인, REJECTED:반려, DONE:완료}
        private String apprStatusCdBefore;  // 변경 전 결재상태 — APPR_STATUS_CD
        private Long apprAmt;  // 결재 요청금액
        private String apprTargetCd;  // 결재대상 구분 — APPR_TARGET_CD {ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결제}
        private String apprTargetNm;  // 결재 대상명
        private String apprReason;  // 사유/메모
        private String apprReqUserId;  // 결재 요청자 (sy_user.user_id)
        private LocalDateTime apprReqDate;  // 결재 요청일시
        private String apprAprvUserId;  // 결재자 (sy_user.user_id)
        private LocalDateTime apprAprvDate;  // 결재일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private LocalDateTime orderDate;  // 주문일시 (od_order 조인)
        private String orderStatusCd;  // 주문상태 (od_order 조인) — ORDER_STATUS_CD {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비 외}
        private String payMethodCd;  // 결제수단 (od_order 조인) — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스 외}
        private String recvNm;  // 수령자명 (od_order 조인)
        private String recvPhone;  // 수령자연락처 (od_order 조인)
        private String recvAddr;  // 수령자주소 (od_order 조인)
        private String memberEmail;  // 회원 이메일 (mb_member 조인)
        private String memberPhoneOrigin;  // 회원 연락처 (mb_member 조인)
        private String claimTypeCdNm;  // 클레임유형 코드 라벨
        private String claimStatusCdNm;  // 클레임상태 코드 라벨
        private String refundMethodCdNm;  // 환불수단 코드 라벨
        private String refundBankCdNm;  // 환불은행 코드 라벨
        private String returnCourierCdNm;  // 수거택배사 코드 라벨
        private String returnStatusCdNm;  // 수거상태 코드 라벨
        private String inboundCourierCdNm;  // 반입택배사 코드 라벨
        private String exchangeCourierCdNm;  // 교환발송택배사 코드 라벨
        private String apprStatusCdNm;  // 결재상태 코드 라벨
        private String apprTargetCdNm;  // 결재대상 코드 라벨
        /* 클레임항목 수 — 목록에서 od_claim_item 을 상관 서브쿼리로 집계.
           목록은 claimItems 를 채우지 않으므로(N+1 방지) 건수만 따로 내려준다. */
        private Long claimItemCnt;  // 클레임항목 수 (상관 서브쿼리 집계)
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<OdClaimItemDto.Item> claimItems;   // 클레임상품 목록
    }

}

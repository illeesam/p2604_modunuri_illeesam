package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import com.shopjoy.ecBeBo.common.util.Sensitive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdOrderDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String orderId;  // 주문ID 필터
        @Size(max = 21) private String memberId;  // 회원ID 필터
        @Size(max = 50) private String orderStatusCd;    // 주문상태 단건 필터 (strEq)
        private List<String> orderStatusCds;              // 주문상태 다중 필터 (strIn, BO multiCheck)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderId;  // 주문ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID
        private String memberNm;  // 주문자명
        @Sensitive("email") private String ordererEmail;  // 주문자 이메일 (주문 시점 스냅샷)
        private Long totalAmt;  // 상품합계금액 (현재값)
        private Long payAmt;  // 실결제금액 (현재값)
        private Long discntAmt;  // 총 할인금액 (쿠폰+프로모션 합계, 표시용)
        private Long couponDiscntAmt;  // 쿠폰할인금액
        private Long saveUseAmt;  // 적립금사용금액
        private Long shippingFee;  // 출고배송료 (현재값)
        private String orderStatusCd;  // 주문상태 — ORDER_STATUS_CD {PENDING:입금대기, PAID:결제완료, PREPARING:상품준비, SHIPPED:배송중, COMPLT:구매확정, DELIVERED:배송완료, CANCELLED:주문취소 외}
        private String orderStatusCdBefore;  // 변경 전 주문상태 — ORDER_STATUS_CD
        private String payMethodCd;  // 결제수단 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스, KAKAO:카카오페이, NAVER:네이버페이 외}
        private String dlivStatusCd;  // 배송상태 최신 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
        private String couponId;  // 사용쿠폰ID
        private String recvNm;  // 수령자명
        @Sensitive("phone")   private String recvPhone;  // 수령자연락처
        private String recvZip;  // 수령자우편번호
        @Sensitive("address") private String recvAddr;  // 수령자주소
        @Sensitive("address") private String recvAddrDetail;  // 수령자상세주소
        private String recvMemo;  // 배송메모
        private String refundBankCd;  // 환불 은행코드 — BANK_CODE (무통장/가상계좌 환불 시)
        @Sensitive("account") private String refundAccountNo;  // 환불 계좌번호
        @Sensitive("name")    private String refundAccountNm;  // 환불 예금주명
        private String accessChannelCd;  // 주문유입경로 — ACCESS_CHANNEL_CD {WEB_PC:PC웹, WEB_MOBILE:모바일웹, APP_IOS:iOS앱, APP_ANDROID:안드로이드앱}
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
        private String memo;  // 관리메모
        private LocalDateTime orderDate;  // 주문일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String siteId;  // 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        @Sensitive("email") private String memberEmail;  // 회원 이메일 (mb_member 조인)
        @Sensitive("phone") private String memberPhoneOrigin;  // 회원 연락처 (mb_member 조인)
        private String gradeCd;  // 회원등급 (표시용) — MEMBER_GRADE {BASIC:일반, GOLD:우수, NORMAL:일반, VIP:VIP, BRONZE:브론즈, SILVER:실버}
        private Long totalPurchaseAmt;  // 회원 누적 구매금액 (조인/집계 표시용)
        private String siteNm;  // 사이트명 (조인 표시용)
        private String couponNm;  // 사용쿠폰명 (pm_coupon 조인)
        private String couponTypeCd;  // 사용쿠폰 유형 (pm_coupon 조인) — COUPON_TYPE_CD {RATE:정률 할인, FIXED:정액 할인, PROD_DISCNT:상품할인쿠폰 외}
        private String orderStatusCdNm;  // 주문상태 코드 라벨
        private String payMethodCdNm;  // 결제수단 코드 라벨
        private String dlivStatusCdNm;  // 배송상태 코드 라벨
        private String accessChannelCdNm;  // 유입경로 코드 라벨
        private String apprStatusCdNm;  // 결재상태 코드 라벨
        private String refundBankCdNm;  // 환불은행 코드 라벨
        private String apprTargetCdNm;  // 결재대상 코드 라벨
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<OdOrderItemDto.Item>   orderItems;   // 주문상품 목록
        private List<OdPayDto.Item>         orderPays;    // 결제 목록
        private List<OdDlivDto.Item>        orderDlivs;   // 배송 목록
        /* 주문항목 수 — od_order_item 상관 서브쿼리 집계.
           목록은 orderItems 를 채우지 않으므로(N+1 방지) 건수만 따로 내려준다.
           이전에는 화면이 상품명의 "외 N" 을 파싱해 추정했는데, 항목이 0건인 주문도
           1개로 표시돼 칸반(실제 항목 기준)과 어긋났다. */
        private Long orderItemCnt;
        private List<OdOrderDiscntDto.Item> orderDiscnts; // 주문할인 목록
    }


    /**
     * ProxyOrderRequest — MD 대리주문 저장 요청 (주문 + 주문항목 동시 저장).
     * 주의: 필드 기본값 금지(VoUtil selective-copy 전제). 모두 null 시작.
     */
    @Getter @Setter @NoArgsConstructor
    public static class ProxyOrderRequest {
        private String orderId;        // 신규 시 null (서버 생성)
        private String memberId;  // 주문 대상 회원ID
        private String memberNm;  // 주문자명
        private String ordererEmail;  // 주문자 이메일
        private String orderStatusCd;  // 주문상태 — ORDER_STATUS_CD
        private String payMethodCd;  // 결제수단 — PAY_METHOD
        private Long    totalAmt;       // 상품 합계
        private Long    dlivFee;        // 배송비 → outbound_shipping_fee
        private Long    payAmt;         // 최종 결제금액 (상품합계 + 배송비)
        private String  memo;
        private List<OdOrderItemDto.SaveItem> orderItems;  // 주문항목
    }

    /** Kanban — 칸반 보드 통합 응답 (주문 + 클레임 목록(claimItems 포함) + 정산원장) */
    @Getter @Setter @NoArgsConstructor
    public static class Kanban {
        private Item                      order;       // 주문 상세 (orderItems/orderPays/orderDlivs 포함)
        private List<OdClaimDto.Item>     claims;      // 클레임 목록 (각 클aimItems 포함)
    }

    /** ExtraPayRequest — 추가결제 요청 (배송비 등 추가 비용을 고객에게 요청) */
    @Getter @Setter @NoArgsConstructor
    public static class ExtraPayRequest {
        private String orderId;  // 대상 주문ID
        private String memberId;  // 대상 회원ID
        private Long   amount;  // 추가결제 요청금액
        private String reason;  // 추가결제 요청사유
    }
}

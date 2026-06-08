package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdOrderDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderId;
        @Size(max = 21) private String memberId;
        @Size(max = 50) private String orderStatusCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderId;
        private String siteId;
        private String memberId;
        private String memberNm;
        private String ordererEmail;
        private Long totalAmt;
        private Long payAmt;
        private Long discntAmt;
        private Long couponDiscntAmt;
        private Long saveUseAmt;
        private Long shippingFee;
        private String orderStatusCd;
        private String orderStatusCdBefore;
        private String payMethodCd;
        private String dlivStatusCd;
        private String couponId;
        private String recvNm;
        private String recvPhone;
        private String recvZip;
        private String recvAddr;
        private String recvAddrDetail;
        private String recvMemo;
        private String refundBankCd;
        private String refundAccountNo;
        private String refundAccountNm;
        private String accessChannelCd;
        private String apprStatusCd;
        private String apprStatusCdBefore;
        private Long apprAmt;
        private String apprTargetCd;
        private String apprTargetNm;
        private String apprReason;
        private String apprReqUserId;
        private LocalDateTime apprReqDate;
        private String apprAprvUserId;
        private LocalDateTime apprAprvDate;
        private String memo;
        private LocalDateTime orderDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String memberEmail;
        private String memberPhoneOrigin;
        private String gradeCd;
        private Long totalPurchaseAmt;
        private String siteNm;
        private String couponNm;
        private String couponTypeCd;
        private String orderStatusCdNm;
        private String payMethodCdNm;
        private String dlivStatusCdNm;
        private String accessChannelCdNm;
        private String apprStatusCdNm;
        private String refundBankCdNm;
        private String apprTargetCdNm;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<OdOrderItemDto.Item>   orderItems;   // 주문상품 목록
        private List<OdPayDto.Item>         orderPays;    // 결제 목록
        private List<OdDlivDto.Item>        orderDlivs;   // 배송 목록
        private List<OdOrderDiscntDto.Item> orderDiscnts; // 주문할인 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}

    /**
     * ProxyOrderRequest — MD 대리주문 저장 요청 (주문 + 주문항목 동시 저장).
     * 주의: 필드 기본값 금지(VoUtil selective-copy 전제). 모두 null 시작.
     */
    @Getter @Setter @NoArgsConstructor
    public static class ProxyOrderRequest {
        private String orderId;        // 신규 시 null (서버 생성)
        private String siteId;
        private String memberId;
        private String memberNm;
        private String ordererEmail;
        private String orderStatusCd;
        private String payMethodCd;
        private Long    totalAmt;       // 상품 합계
        private Long    dlivFee;        // 배송비 → outbound_shipping_fee
        private Long    payAmt;         // 최종 결제금액 (상품합계 + 배송비)
        private String  memo;
        private List<OdOrderItemDto.SaveItem> orderItems;  // 주문항목
    }

    /** ExtraPayRequest — 추가결제 요청 (배송비 등 추가 비용을 고객에게 요청) */
    @Getter @Setter @NoArgsConstructor
    public static class ExtraPayRequest {
        private String orderId;
        private String memberId;
        private Long   amount;
        private String reason;
    }
}

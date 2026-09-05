package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdRefundMethodDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String refundMethodId;  // 환불수단ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String refundMethodId;  // 환불수단ID (YYMMDDhhmmss+rand4)
        private String refundId;  // 환불ID (od_refund.refund_id)
        private String orderId;  // 주문ID (od_order.order_id)
        private String payMethodCd;  // 결제수단코드 (코드: PAY_METHOD — BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
        private String payMethodCdNm;  // 코드 라벨
        private Integer refundPriority;  // 환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)
        private Long refundAmt;  // 해당 수단으로 환불할 금액
        private Long refundAvailAmt;  // 해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)
        private String refundStatusCd;  // 수단별 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED)
        private String refundStatusCdNm;  // 코드 라벨
        private String refundStatusCdBefore;  // 변경 전 환불상태 (코드: REFUND_STATUS)
        private LocalDateTime refundDate;  // 해당 수단 환불 완료일시
        private String payId;  // 원 결제 레코드ID (od_pay.pay_id)
        private String pgRefundId;  // PG 환불 거래ID
        private String pgResponse;  // PG 환불 응답 JSON
        private String regBy;  // 등록자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime regDate;  // 등록일시
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime updDate;  // 수정일시
    }

}

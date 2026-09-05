package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdRefundDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String refundId;  // 환불ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String refundId;  // 환불ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.order_id)
        private String claimId;  // 클레임ID (od_claim.claim_id)
        private String refundTypeCd;  // 환불유형코드 (코드: REFUND_TYPE — CANCEL/RETURN/PARTIAL/EXTRA)
        private String refundTypeCdNm;  // 코드 라벨
        private Long refundProdAmt;  // 환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)
        private Long refundCouponAmt;  // 주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)
        private Long refundShipAmt;  // 환불 배송비 (음수이면 추가청구)
        private Long refundSaveAmt;  // 적립금 복원금액 (od_order_discnt.SAVE_USE 기준)
        private Long refundCacheAmt;  // 캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)
        private Long totalRefundAmt;  // 총 환불금액 (실결제 수단으로 돌려주는 합계)
        private String refundStatusCd;  // 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED/PARTIAL)
        private String refundStatusCdNm;  // 코드 라벨
        private String refundStatusCdBefore;  // 변경 전 환불상태 (코드: REFUND_STATUS)
        private LocalDateTime refundReqDate;  // 환불 요청일시
        private LocalDateTime refundCompltDate;  // 환불 완료일시
        private String faultTypeCd;  // 귀책유형코드 (코드: FAULT_TYPE — CUST/VENDOR/PLATFORM)
        private String faultTypeCdNm;  // 코드 라벨
        private String refundReason;  // 환불 사유
        private String memo;  // 관리 메모
        private String regBy;  // 등록자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime regDate;  // 등록일시
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime updDate;  // 수정일시
    }

}

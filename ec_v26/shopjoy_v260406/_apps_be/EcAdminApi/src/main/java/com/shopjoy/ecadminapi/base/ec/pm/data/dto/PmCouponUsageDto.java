package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmCouponUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;        // 사이트ID
        @Size(max = 21) private String couponUsageId; // 사용이력ID 필터
        @Size(max = 21) private String orderId;       // 주문ID 필터 (od_order.order_id)
        @Size(max = 21) private String orderItemId;   // 주문상품ID 필터 (od_order_item.order_item_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String couponUsageId;      // 사용이력ID (YYMMDDhhmmss+rand4)
        private String couponId;           // 쿠폰ID (pm_coupon.coupon_id)
        private String couponCode;         // 쿠폰코드 스냅샷
        private String couponNm;           // 쿠폰명 스냅샷
        private String memberId;           // 회원ID (mb_member.member_id)
        private String orderId;            // 주문ID (od_order.order_id)
        private String orderItemId;        // 주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)
        private String prodId;             // 상품ID (pd_prod.prod_id, 쿠폰 적용 상품)
        private String discountTypeCd;     // 할인유형 (RATE=정률 / FIXED=정액)
        private Integer discountValue;     // 할인값 (정률: % / 정액: 원)
        private Long discountAmt;          // 실할인금액
        private LocalDateTime usedDate;    // 사용일시
        private String regBy;              // 등록자
        private LocalDateTime regDate;     // 등록일
        private String regSiteId;          // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;              // 수정자
        private LocalDateTime updDate;     // 수정일
    }

}

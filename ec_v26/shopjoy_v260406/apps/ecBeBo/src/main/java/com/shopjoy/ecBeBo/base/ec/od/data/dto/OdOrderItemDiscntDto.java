package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OdOrderItemDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String orderItemDiscntId;  // 주문상품할인ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderItemDiscntId;  // 주문상품할인ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.order_id)
        private String orderItemId;  // 주문상품ID (od_order_item.order_item_id)
        private String discntTypeCd;  // 할인유형코드 — ORDER_ITEM_DISCNT_TYPE {ITEM_COUPON:상품쿠폰, ITEM_DISCNT:상품할인}
        private String discntTypeCdNm;  // 코드 라벨
        private String couponId;  // 쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)
        private String couponIssueId;  // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)
        private BigDecimal discntRate;  // 할인율 (% — 비율할인인 경우)
        private Long unitDiscntAmt;  // 1개당 할인금액
        private Long totalDiscntAmt;  // 전체 할인금액 (unit_discnt_amt × order_qty)
        private Integer orderQty;  // 주문수량 스냅샷
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}

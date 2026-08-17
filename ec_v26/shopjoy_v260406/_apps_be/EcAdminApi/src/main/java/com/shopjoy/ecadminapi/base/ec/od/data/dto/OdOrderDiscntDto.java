package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OdOrderDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String orderDiscntId;  // 주문할인ID 필터
        @Size(max = 21) private String orderId;        // 상위 FK 필터
        private List<String> orderIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderDiscntId;  // 주문할인ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.order_id)
        private String discntTypeCd;  // 할인유형코드 — ORDER_DISCNT_TYPE {SALE_PRICE:판매가할인, PAY_DISCNT:결제할인, COUPON:쿠폰할인, PROMOTION:프로모션할인, SHIP_DISCNT:배송비할인 외}
        private String couponId;  // 쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)
        private String couponIssueId;  // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)
        private BigDecimal discntRate;  // 할인율 (% — 비율할인인 경우)
        private Long discntAmt;  // 할인·차감 금액
        private Long baseItemAmt;  // 안분 기준 상품금액 (주문쿠폰 안분 계산용)
        private String restoreYn;  // 복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)
        private Long restoreAmt;  // 복원된 금액 (부분반품 시 부분복원 지원)
        private LocalDateTime restoreDate;  // 복원 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
    }

}

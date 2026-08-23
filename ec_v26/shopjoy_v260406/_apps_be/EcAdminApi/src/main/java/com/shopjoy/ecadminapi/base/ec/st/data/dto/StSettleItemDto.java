package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StSettleItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 21) private String settleItemId;       // 정산항목ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleItemId;               // 정산항목ID
        private String settleId;                     // 정산ID (st_settle.settle_id)
        private String orderId;                        // 주문ID (od_order.order_id)
        private String orderItemId;                      // 주문항목ID (od_order_item.order_item_id)
        private String vendorId;                           // 업체ID
        private String prodId;                               // 상품ID
        private String settleItemTypeCd;                      // 항목유형 — SETTLE_ITEM_TYPE_CD (SALE/CANCEL/RETURN)
        private String settleItemTypeCdNm;  // 코드 라벨
        private LocalDateTime orderDate;                        // 주문일시
        private Integer orderQty;                                // 주문수량
        private Long unitPrice;                                   // 단가
        private Long itemPrice;                                    // 소계 (unit_price × order_qty)
        private Long discntAmt;                                     // 할인금액
        private BigDecimal commissionRate;                           // 수수료율 (%)
        private Long commissionAmt;                                   // 수수료금액
        private Long settleItemAmt;                                    // 항목 정산금액
        private String regBy;                                            // 등록자
        private LocalDateTime regDate;                                    // 등록일시
        private String regSiteId;                                          // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}

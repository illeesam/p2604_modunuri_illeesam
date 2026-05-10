package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
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
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String settleItemId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleItemId;
        private String settleId;
        private String siteId;
        private String orderId;
        private String orderItemId;
        private String vendorId;
        private String prodId;
        private String settleItemTypeCd;
        private LocalDateTime orderDate;
        private Integer orderQty;
        private Long unitPrice;
        private Long itemPrice;
        private Long discntAmt;
        private BigDecimal commissionRate;
        private Long commissionAmt;
        private Long settleItemAmt;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

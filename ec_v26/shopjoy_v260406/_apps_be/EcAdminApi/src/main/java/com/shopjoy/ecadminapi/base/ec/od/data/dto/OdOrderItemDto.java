package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OdOrderItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderItemId;
        @Size(max = 21) private String orderId;        // 상위 FK 필터
        private List<String> orderIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderItemId;
        private String siteId;
        private String orderId;
        private String prodId;
        private String skuId;
        private String optItemId1;
        private String optItemId2;
        private String prodNm;
        private String brandNm;
        private String dlivTmpltId;
        private Long normalPrice;
        private Long unitPrice;
        private Integer orderQty;
        private Long itemOrderAmt;
        private Integer cancelQty;
        private Long itemCancelAmt;
        private Integer completQty;
        private Long itemCompletedAmt;
        private Long orgUnitPrice;
        private Long orgItemOrderAmt;
        private Long orgDiscountAmt;
        private Long orgShippingFee;
        private BigDecimal saveRate;
        private Long saveUseAmt;
        private Long saveSchdAmt;
        private String orderItemStatusCd;
        private String orderItemStatusCdBefore;
        private String claimYn;
        private String buyConfirmYn;
        private LocalDate buyConfirmSchdDate;
        private LocalDateTime buyConfirmDate;
        private String settleYn;
        private LocalDateTime settleDate;
        private String reserveSaleYn;
        private LocalDateTime reserveDlivSchdDate;
        private String bundleGroupId;
        private BigDecimal bundlePriceRate;
        private String giftId;
        private Long outboundShippingFee;
        private String dlivCourierCd;
        private String dlivTrackingNo;
        private LocalDateTime dlivShipDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String thumbnailUrl;
        private Long salePriceCurrent;
        private String prodNmCurrent;
        private String skuCode;
        private String optItemNm1;
        private String optItemNm2;
        private String orderItemStatusCdNm;
        private String dlivCourierCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

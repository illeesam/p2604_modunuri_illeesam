package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String histId;
        @Size(max = 21) private String prodId;
        @Size(max = 21) private String siteId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String histId;
        private String prodId;
        private LocalDateTime histDate;
        private String regBy;
        private String regByNm;
        private String stockTypeCd;
        private String stockTypeCdNm;
        private Integer stockQty;
        private Integer stockBalance;
        private String stockMemo;
        private String priceField;
        private String priceBefore;
        private String priceAfter;
        private String statusCdBefore;
        private String statusCdBeforeNm;
        private String statusCdAfter;
        private String statusCdAfterNm;
        private String changeField;
        private String changeBefore;
        private String changeAfter;
        private String orderId;
        private String memberId;
        private String memberNm;
        private LocalDateTime orderDate;
        private Long totalAmt;
        private String orderStatusCd;
        private String orderStatusCdNm;
        private Integer orderQty;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

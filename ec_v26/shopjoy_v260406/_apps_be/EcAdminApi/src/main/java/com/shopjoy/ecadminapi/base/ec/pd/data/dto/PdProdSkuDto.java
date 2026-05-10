package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdSkuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String skuId;
        @Size(max = 21) private String prodId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String skuId;
        private String prodId;
        private String optItemId1;
        private String optItemId2;
        private String skuCode;
        private Long addPrice;
        private Integer stock;
        private String useYn;
        private Integer sortNo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String optItemNm1;
        private String optItemNm2;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

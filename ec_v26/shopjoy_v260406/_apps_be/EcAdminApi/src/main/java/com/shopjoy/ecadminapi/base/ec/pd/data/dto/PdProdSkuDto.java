package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdSkuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String prodSkuId;
        @Size(max = 21) private String prodId;
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodSkuId;
        private String prodId;
        private String prodOptId1;
        private String prodOptId2;
        private String prodSkuCode;
        private Long addPrice;
        private Integer stock;
        private String useYn;
        private Integer sortNo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String prodOptNm1;
        private String prodOptNm2;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdQnaDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String prodQnaId;
        @Size(max = 21) private String prodId;
        @Size(max = 1) private String answYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodQnaId;
        private String siteId;
        private String prodId;
        private String prodSkuId;
        private String memberId;
        private String orderId;
        private String prodQnaTypeCd;
        private String prodQnaTitle;
        private String prodQnaContent;
        private String scrtYn;
        private String answYn;
        private String answContent;
        private LocalDateTime answDate;
        private String answUserId;
        private String dispYn;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

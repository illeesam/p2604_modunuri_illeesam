package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdImgDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String prodImgId;
        @Size(max = 21) private String prodId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodImgId;
        private String siteId;
        private String prodId;
        private String optItemId1;
        private String optItemId2;
        private String attachId;
        private String cdnHost;
        private String cdnImgUrl;
        private String cdnThumbUrl;
        private String imgAltText;
        private Integer sortOrd;
        private String isThumb;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

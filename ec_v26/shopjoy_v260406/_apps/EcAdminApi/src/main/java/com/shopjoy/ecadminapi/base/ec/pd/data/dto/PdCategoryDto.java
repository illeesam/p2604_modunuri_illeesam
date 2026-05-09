package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdCategoryDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String categoryId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String categoryId;
        private String siteId;
        private String parentCategoryId;
        private String categoryNm;
        private Integer categoryDepth;
        private Integer sortOrd;
        private String categoryStatusCd;
        private String categoryStatusCdBefore;
        private String imgUrl;
        private String categoryDesc;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String parentCategoryNm;
        private String grandParentCategoryNm;
        private String categoryStatusCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

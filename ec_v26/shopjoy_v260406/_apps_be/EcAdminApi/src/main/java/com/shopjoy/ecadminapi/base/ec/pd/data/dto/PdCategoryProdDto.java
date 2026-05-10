package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PdCategoryProdDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String categoryProdId;
        @Size(max = 21) private String categoryId;
        @Size(max = 21) private String prodId;
        @Size(max = 30) private String typeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String categoryProdId;
        private String siteId;
        private String categoryId;
        private String prodId;
        private String categoryProdTypeCd;
        private Integer sortOrd;
        private String emphasisCd;
        private String dispYn;
        private LocalDate dispStartDate;
        private LocalDate dispEndDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String categoryNm;
        private String prodNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

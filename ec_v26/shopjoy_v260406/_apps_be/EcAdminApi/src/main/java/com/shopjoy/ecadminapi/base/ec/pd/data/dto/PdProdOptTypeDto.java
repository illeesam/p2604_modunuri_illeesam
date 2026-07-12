package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdOptTypeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String prodOptTypeId;
        @Size(max = 21) private String prodId;
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodOptTypeId;
        private String siteId;
        private String prodId;
        private String prodOptTypeNm;
        private Integer prodOptTypeLevel;
        private String prodOptInputTypeCd;
        private Integer sortOrd;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String optInputTypeCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

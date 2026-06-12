package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmPlanDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String planId;
        @Size(max = 20) private String planStatusCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String planId;
        private String siteId;
        private String planNm;
        private String planTitle;
        private String planTypeCd;
        private String planDesc;
        private String thumbnailUrl;
        private String bannerUrl;
        private LocalDate startDate;
        private LocalDate endDate;
        private String planStatusCd;
        private String planStatusCdBefore;
        private Integer sortOrd;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

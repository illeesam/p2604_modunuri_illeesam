package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

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
        @Size(max = 21)  private String prodId;    // 대상상품 ID 필터 (EXISTS eq via pm_plan_item)
        @Size(max = 200) private String prodNm;    // 대상상품명 필터 (EXISTS LIKE via pm_plan_item→pd_prod)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (EXISTS eq via pm_plan_item→pd_prod)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (EXISTS LIKE via pm_plan_item→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (EXISTS eq via pm_plan_item→pd_prod)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (EXISTS LIKE via pm_plan_item→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String planId;
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
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
    }

}

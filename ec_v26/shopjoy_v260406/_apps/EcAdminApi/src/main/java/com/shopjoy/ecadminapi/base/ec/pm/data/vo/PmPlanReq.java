package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmPlanReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String planId;
    private String siteId;
    private String planNm;
    private String planTitle;
    private String planTypeCd;
    private String planDesc;
    private String thumbnailUrl;
    private String bannerUrl;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String planStatusCd;
    private String planStatusCdBefore;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmPlan toEntity() {
        return PmPlan.builder()
                .planId(planId)
                .siteId(siteId)
                .planNm(planNm)
                .planTitle(planTitle)
                .planTypeCd(planTypeCd)
                .planDesc(planDesc)
                .thumbnailUrl(thumbnailUrl)
                .bannerUrl(bannerUrl)
                .startDate(startDate)
                .endDate(endDate)
                .planStatusCd(planStatusCd)
                .planStatusCdBefore(planStatusCdBefore)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

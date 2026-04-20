package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmPlanDto {

    // ── pm_plan ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

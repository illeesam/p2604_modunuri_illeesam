package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventBenefitDto {

    // ── pm_event_benefit ──────────────────────────────────────────
    private String benefitId;
    private String siteId;
    private String eventId;
    private String benefitNm;
    private String benefitTypeCd;
    private String conditionDesc;
    private String benefitValue;
    private String couponId;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

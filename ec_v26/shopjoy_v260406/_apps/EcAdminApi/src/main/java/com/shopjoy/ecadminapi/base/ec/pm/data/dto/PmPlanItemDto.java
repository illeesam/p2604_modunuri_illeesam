package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmPlanItemDto {

    // ── pm_plan_item ──────────────────────────────────────────
    private String planItemId;
    private String planId;
    private String siteId;
    private String prodId;
    private Integer sortOrd;
    private String planItemMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

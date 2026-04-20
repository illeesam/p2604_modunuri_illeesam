package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpUiAreaDto {

    // ── dp_ui_area ──────────────────────────────────────────
    private String uiAreaId;
    private String uiId;
    private String areaId;
    private Integer areaSortOrd;
    private String visibilityTargets;
    private String dispEnv;
    private String dispYn;
    private LocalDate dispStartDate;
    private LocalDate dispEndDate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

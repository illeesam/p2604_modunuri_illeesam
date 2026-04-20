package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpAreaPanelDto {

    // ── dp_area_panel ──────────────────────────────────────────
    private String areaPanelId;
    private String areaId;
    private String panelId;
    private Integer panelSortOrd;
    private String visibilityTargets;
    private String dispYn;
    private LocalDate dispStartDate;
    private LocalDate dispEndDate;
    private String dispEnv;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

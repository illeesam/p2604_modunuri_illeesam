package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpPanelDto {

    // ── dp_panel ──────────────────────────────────────────
    private String panelId;
    private String siteId;
    private String panelNm;
    private String panelTypeCd;
    private String dispPath;
    private String visibilityTargets;
    private String useYn;
    private LocalDate useStartDate;
    private LocalDate useEndDate;
    private String dispPanelStatusCd;
    private String dispPanelStatusCdBefore;
    private String contentJson;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

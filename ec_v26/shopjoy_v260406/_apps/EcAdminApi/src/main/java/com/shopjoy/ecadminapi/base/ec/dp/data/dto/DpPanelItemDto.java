package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpPanelItemDto {

    // ── dp_panel_item ──────────────────────────────────────────
    private String panelItemId;
    private String panelId;
    private String widgetLibId;
    private String widgetTypeCd;
    private String widgetTitle;
    private String widgetContent;
    private String titleShowYn;
    private String widgetLibRefYn;
    private String contentTypeCd;
    private Integer itemSortOrd;
    private String widgetConfigJson;
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

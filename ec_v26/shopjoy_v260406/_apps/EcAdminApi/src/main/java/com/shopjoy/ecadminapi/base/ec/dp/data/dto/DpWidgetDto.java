package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpWidgetDto {

    // ── dp_widget ──────────────────────────────────────────
    private String widgetId;
    private String widgetLibId;
    private String siteId;
    private String widgetNm;
    private String widgetTypeCd;
    private String widgetDesc;
    private String widgetTitle;
    private String widgetContent;
    private String titleShowYn;
    private String widgetLibRefYn;
    private String widgetConfigJson;
    private String previewImgUrl;
    private Integer sortOrd;
    private String useYn;
    private String dispEnv;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

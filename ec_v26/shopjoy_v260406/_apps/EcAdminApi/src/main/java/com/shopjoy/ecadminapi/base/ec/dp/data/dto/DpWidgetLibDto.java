package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpWidgetLibDto {

    // ── dp_widget_lib ──────────────────────────────────────────
    private String widgetLibId;
    private String siteId;
    private String widgetCode;
    private String widgetNm;
    private String widgetTypeCd;
    private String widgetLibDesc;
    private String pathId;
    private String thumbnailUrl;
    private String templateHtml;
    private String configSchema;
    private String isSystem;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

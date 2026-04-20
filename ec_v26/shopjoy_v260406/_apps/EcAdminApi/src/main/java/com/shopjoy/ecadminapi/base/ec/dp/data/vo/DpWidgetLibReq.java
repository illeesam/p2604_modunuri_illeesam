package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpWidgetLibReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String widgetLibId;
    private String siteId;
    private String widgetCode;
    private String widgetNm;
    private String widgetTypeCd;
    private String widgetLibDesc;
    private String dispPath;
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

    public DpWidgetLib toEntity() {
        return DpWidgetLib.builder()
                .widgetLibId(widgetLibId)
                .siteId(siteId)
                .widgetCode(widgetCode)
                .widgetNm(widgetNm)
                .widgetTypeCd(widgetTypeCd)
                .widgetLibDesc(widgetLibDesc)
                .dispPath(dispPath)
                .thumbnailUrl(thumbnailUrl)
                .templateHtml(templateHtml)
                .configSchema(configSchema)
                .isSystem(isSystem)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

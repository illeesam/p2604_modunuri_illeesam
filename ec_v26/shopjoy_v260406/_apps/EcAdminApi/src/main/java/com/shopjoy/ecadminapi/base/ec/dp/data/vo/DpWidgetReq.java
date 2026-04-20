package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpWidgetReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public DpWidget toEntity() {
        return DpWidget.builder()
                .widgetId(widgetId)
                .widgetLibId(widgetLibId)
                .siteId(siteId)
                .widgetNm(widgetNm)
                .widgetTypeCd(widgetTypeCd)
                .widgetDesc(widgetDesc)
                .widgetTitle(widgetTitle)
                .widgetContent(widgetContent)
                .titleShowYn(titleShowYn)
                .widgetLibRefYn(widgetLibRefYn)
                .widgetConfigJson(widgetConfigJson)
                .previewImgUrl(previewImgUrl)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .dispEnv(dispEnv)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

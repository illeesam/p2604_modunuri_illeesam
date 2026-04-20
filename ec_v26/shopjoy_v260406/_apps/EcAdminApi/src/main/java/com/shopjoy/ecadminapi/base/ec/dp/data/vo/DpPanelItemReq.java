package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpPanelItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public DpPanelItem toEntity() {
        return DpPanelItem.builder()
                .panelItemId(panelItemId)
                .panelId(panelId)
                .widgetLibId(widgetLibId)
                .widgetTypeCd(widgetTypeCd)
                .widgetTitle(widgetTitle)
                .widgetContent(widgetContent)
                .titleShowYn(titleShowYn)
                .widgetLibRefYn(widgetLibRefYn)
                .contentTypeCd(contentTypeCd)
                .itemSortOrd(itemSortOrd)
                .widgetConfigJson(widgetConfigJson)
                .visibilityTargets(visibilityTargets)
                .dispYn(dispYn)
                .dispStartDate(dispStartDate)
                .dispEndDate(dispEndDate)
                .dispEnv(dispEnv)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

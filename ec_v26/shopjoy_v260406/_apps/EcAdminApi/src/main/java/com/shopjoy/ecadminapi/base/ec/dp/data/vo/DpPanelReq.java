package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpPanelReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public DpPanel toEntity() {
        return DpPanel.builder()
                .panelId(panelId)
                .siteId(siteId)
                .panelNm(panelNm)
                .panelTypeCd(panelTypeCd)
                .dispPath(dispPath)
                .visibilityTargets(visibilityTargets)
                .useYn(useYn)
                .useStartDate(useStartDate)
                .useEndDate(useEndDate)
                .dispPanelStatusCd(dispPanelStatusCd)
                .dispPanelStatusCdBefore(dispPanelStatusCdBefore)
                .contentJson(contentJson)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpAreaPanelReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public DpAreaPanel toEntity() {
        return DpAreaPanel.builder()
                .areaPanelId(areaPanelId)
                .areaId(areaId)
                .panelId(panelId)
                .panelSortOrd(panelSortOrd)
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

package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpUiAreaReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String uiAreaId;
    private String uiId;
    private String areaId;
    private Integer areaSortOrd;
    private String visibilityTargets;
    private String dispEnv;
    private String dispYn;
    private LocalDate dispStartDate;
    private LocalDate dispEndDate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public DpUiArea toEntity() {
        return DpUiArea.builder()
                .uiAreaId(uiAreaId)
                .uiId(uiId)
                .areaId(areaId)
                .areaSortOrd(areaSortOrd)
                .visibilityTargets(visibilityTargets)
                .dispEnv(dispEnv)
                .dispYn(dispYn)
                .dispStartDate(dispStartDate)
                .dispEndDate(dispEndDate)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

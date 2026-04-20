package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpAreaReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String areaId;
    private String uiId;
    private String siteId;
    private String areaCd;
    private String areaNm;
    private String areaTypeCd;
    private String areaDesc;
    private String dispPath;
    private String useYn;
    private LocalDate useStartDate;
    private LocalDate useEndDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public DpArea toEntity() {
        return DpArea.builder()
                .areaId(areaId)
                .uiId(uiId)
                .siteId(siteId)
                .areaCd(areaCd)
                .areaNm(areaNm)
                .areaTypeCd(areaTypeCd)
                .areaDesc(areaDesc)
                .dispPath(dispPath)
                .useYn(useYn)
                .useStartDate(useStartDate)
                .useEndDate(useEndDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

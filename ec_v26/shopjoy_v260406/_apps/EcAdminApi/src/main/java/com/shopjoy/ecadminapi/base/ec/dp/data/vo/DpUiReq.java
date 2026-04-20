package com.shopjoy.ecadminapi.base.ec.dp.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpUiReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String uiId;
    private String siteId;
    private String uiCd;
    private String uiNm;
    private String uiDesc;
    private String deviceTypeCd;
    private String uiPath;
    private Integer sortOrd;
    private String useYn;
    private LocalDate useStartDate;
    private LocalDate useEndDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public DpUi toEntity() {
        return DpUi.builder()
                .uiId(uiId)
                .siteId(siteId)
                .uiCd(uiCd)
                .uiNm(uiNm)
                .uiDesc(uiDesc)
                .deviceTypeCd(deviceTypeCd)
                .uiPath(uiPath)
                .sortOrd(sortOrd)
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

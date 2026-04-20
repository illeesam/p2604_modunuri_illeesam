package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdDlivTmpltReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String dlivTmpltId;
    private String siteId;
    private String vendorId;
    private String dlivTmpltNm;
    private String dlivMethodCd;
    private String dlivPayTypeCd;
    private String dlivCourierCd;
    private Long dlivCost;
    private Long freeDlivMinAmt;
    private Long islandExtraCost;
    private Long returnCost;
    private Long exchangeCost;
    private String returnCourierCd;
    private String returnAddrZip;
    private String returnAddr;
    private String returnAddrDetail;
    private String returnTelNo;
    private String baseDlivYn;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdDlivTmplt toEntity() {
        return PdDlivTmplt.builder()
                .dlivTmpltId(dlivTmpltId)
                .siteId(siteId)
                .vendorId(vendorId)
                .dlivTmpltNm(dlivTmpltNm)
                .dlivMethodCd(dlivMethodCd)
                .dlivPayTypeCd(dlivPayTypeCd)
                .dlivCourierCd(dlivCourierCd)
                .dlivCost(dlivCost)
                .freeDlivMinAmt(freeDlivMinAmt)
                .islandExtraCost(islandExtraCost)
                .returnCost(returnCost)
                .exchangeCost(exchangeCost)
                .returnCourierCd(returnCourierCd)
                .returnAddrZip(returnAddrZip)
                .returnAddr(returnAddr)
                .returnAddrDetail(returnAddrDetail)
                .returnTelNo(returnTelNo)
                .baseDlivYn(baseDlivYn)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

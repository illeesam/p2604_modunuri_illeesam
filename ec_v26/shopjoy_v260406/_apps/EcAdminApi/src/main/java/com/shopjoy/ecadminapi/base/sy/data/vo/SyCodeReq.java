package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyCodeReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String codeId;
    private String siteId;
    private String codeGrp;
    private String codeValue;
    private String codeLabel;
    private Integer sortOrd;
    private String useYn;
    private String parentCodeValue;
    private String childCodeValues;
    private String codeRemark;
    private Integer codeLevel;
    private String codeOpt1;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    /** toEntity — 변환 */
    public SyCode toEntity() {
        return SyCode.builder()
                .codeId(codeId)
                .siteId(siteId)
                .codeGrp(codeGrp)
                .codeValue(codeValue)
                .codeLabel(codeLabel)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .parentCodeValue(parentCodeValue)
                .childCodeValues(childCodeValues)
                .codeRemark(codeRemark)
                .codeLevel(codeLevel)
                .codeOpt1(codeOpt1)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

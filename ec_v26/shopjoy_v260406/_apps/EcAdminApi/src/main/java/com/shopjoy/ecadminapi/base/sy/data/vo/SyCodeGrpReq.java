package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyCodeGrpReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String codeGrpId;
    private String siteId;
    private String codeGrp;
    private String grpNm;
    private String dispPath;
    private String codeGrpDesc;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyCodeGrp toEntity() {
        return SyCodeGrp.builder()
                .codeGrpId(codeGrpId)
                .siteId(siteId)
                .codeGrp(codeGrp)
                .grpNm(grpNm)
                .dispPath(dispPath)
                .codeGrpDesc(codeGrpDesc)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

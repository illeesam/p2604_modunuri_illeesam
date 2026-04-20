package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmPathReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String bizCd;
    private Long parentPathId;
    private String pathLabel;
    private Integer sortOrd;
    private String useYn;
    private String pathRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmPath toEntity() {
        return CmPath.builder()
                .bizCd(bizCd)
                .parentPathId(parentPathId)
                .pathLabel(pathLabel)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .pathRemark(pathRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

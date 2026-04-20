package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAttachGrpReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String attachGrpId;
    private String attachGrpCode;
    private String attachGrpNm;
    private String fileExtAllow;
    private Long maxFileSize;
    private Integer maxFileCount;
    private String storagePath;
    private String useYn;
    private Integer sortOrd;
    private String attachGrpRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyAttachGrp toEntity() {
        return SyAttachGrp.builder()
                .attachGrpId(attachGrpId)
                .attachGrpCode(attachGrpCode)
                .attachGrpNm(attachGrpNm)
                .fileExtAllow(fileExtAllow)
                .maxFileSize(maxFileSize)
                .maxFileCount(maxFileCount)
                .storagePath(storagePath)
                .useYn(useYn)
                .sortOrd(sortOrd)
                .attachGrpRemark(attachGrpRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVocReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String vocId;
    private String siteId;
    private String vocMasterCd;
    private String vocDetailCd;
    private String vocNm;
    private String vocContent;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyVoc toEntity() {
        return SyVoc.builder()
                .vocId(vocId)
                .siteId(siteId)
                .vocMasterCd(vocMasterCd)
                .vocDetailCd(vocDetailCd)
                .vocNm(vocNm)
                .vocContent(vocContent)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

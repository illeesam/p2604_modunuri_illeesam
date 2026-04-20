package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyTemplateReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String templateId;
    private String siteId;
    private String templateTypeCd;
    private String templateCode;
    private String templateNm;
    private String templateSubject;
    private String templateContent;
    private String sampleParams;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SyTemplate toEntity() {
        return SyTemplate.builder()
                .templateId(templateId)
                .siteId(siteId)
                .templateTypeCd(templateTypeCd)
                .templateCode(templateCode)
                .templateNm(templateNm)
                .templateSubject(templateSubject)
                .templateContent(templateContent)
                .sampleParams(sampleParams)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}

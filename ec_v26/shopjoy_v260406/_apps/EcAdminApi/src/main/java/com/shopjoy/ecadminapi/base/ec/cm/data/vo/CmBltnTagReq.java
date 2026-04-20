package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnTag;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnTagReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String blogTagId;
    private String siteId;
    private String blogId;
    private String tagNm;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltnTag toEntity() {
        return CmBltnTag.builder()
                .blogTagId(blogTagId)
                .siteId(siteId)
                .blogId(blogId)
                .tagNm(tagNm)
                .sortOrd(sortOrd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

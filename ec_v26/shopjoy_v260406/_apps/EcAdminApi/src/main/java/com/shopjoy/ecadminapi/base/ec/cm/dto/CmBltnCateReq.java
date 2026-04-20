package com.shopjoy.ecadminapi.base.ec.cm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.entity.CmBltnCate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnCateReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String blogCateId;
    private String siteId;
    private String blogCateNm;
    private String parentBlogCateId;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltnCate toEntity() {
        return CmBltnCate.builder()
                .blogCateId(blogCateId)
                .siteId(siteId)
                .blogCateNm(blogCateNm)
                .parentBlogCateId(parentBlogCateId)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

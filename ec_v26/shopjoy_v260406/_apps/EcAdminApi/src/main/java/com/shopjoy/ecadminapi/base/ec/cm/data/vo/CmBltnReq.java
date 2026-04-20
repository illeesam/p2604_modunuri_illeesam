package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltn;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String blogId;
    private String siteId;
    private String blogCateId;
    private String blogTitle;
    private String blogSummary;
    private String blogContent;
    private String blogAuthor;
    private String prodId;
    private Integer viewCount;
    private String useYn;
    private String isNotice;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltn toEntity() {
        return CmBltn.builder()
                .blogId(blogId)
                .siteId(siteId)
                .blogCateId(blogCateId)
                .blogTitle(blogTitle)
                .blogSummary(blogSummary)
                .blogContent(blogContent)
                .blogAuthor(blogAuthor)
                .prodId(prodId)
                .viewCount(viewCount)
                .useYn(useYn)
                .isNotice(isNotice)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

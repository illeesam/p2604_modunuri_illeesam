package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBbsReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String bbsId;
    private String siteId;
    private String bbmId;
    private String parentBbsId;
    private String memberId;
    private String authorNm;
    private String bbsTitle;
    private String contentHtml;
    private String attachGrpId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private String isFixed;
    private String bbsStatusCd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SyBbs toEntity() {
        return SyBbs.builder()
                .bbsId(bbsId)
                .siteId(siteId)
                .bbmId(bbmId)
                .parentBbsId(parentBbsId)
                .memberId(memberId)
                .authorNm(authorNm)
                .bbsTitle(bbsTitle)
                .contentHtml(contentHtml)
                .attachGrpId(attachGrpId)
                .viewCount(viewCount)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .isFixed(isFixed)
                .bbsStatusCd(bbsStatusCd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}

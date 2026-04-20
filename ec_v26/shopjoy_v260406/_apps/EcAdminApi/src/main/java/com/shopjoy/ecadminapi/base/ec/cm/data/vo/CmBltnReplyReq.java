package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnReply;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnReplyReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String commentId;
    private String siteId;
    private String blogId;
    private String parentCommentId;
    private String writerId;
    private String writerNm;
    private String blogCommentContent;
    private String commentStatusCd;
    private String commentStatusCdBefore;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltnReply toEntity() {
        return CmBltnReply.builder()
                .commentId(commentId)
                .siteId(siteId)
                .blogId(blogId)
                .parentCommentId(parentCommentId)
                .writerId(writerId)
                .writerNm(writerNm)
                .blogCommentContent(blogCommentContent)
                .commentStatusCd(commentStatusCd)
                .commentStatusCdBefore(commentStatusCdBefore)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

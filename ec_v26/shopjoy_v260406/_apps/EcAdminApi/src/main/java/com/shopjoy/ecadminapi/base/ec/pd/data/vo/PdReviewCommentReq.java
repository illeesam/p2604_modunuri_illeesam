package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdReviewCommentReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String reviewCommentId;
    private String siteId;
    private String reviewId;
    private String parentReplyId;
    private String writerTypeCd;
    private String writerId;
    private String writerNm;
    private String reviewReplyContent;
    private String replyStatusCd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdReviewComment toEntity() {
        return PdReviewComment.builder()
                .reviewCommentId(reviewCommentId)
                .siteId(siteId)
                .reviewId(reviewId)
                .parentReplyId(parentReplyId)
                .writerTypeCd(writerTypeCd)
                .writerId(writerId)
                .writerNm(writerNm)
                .reviewReplyContent(reviewReplyContent)
                .replyStatusCd(replyStatusCd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

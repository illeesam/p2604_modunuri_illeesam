package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdReviewCommentDto {

    // ── pd_review_comment ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

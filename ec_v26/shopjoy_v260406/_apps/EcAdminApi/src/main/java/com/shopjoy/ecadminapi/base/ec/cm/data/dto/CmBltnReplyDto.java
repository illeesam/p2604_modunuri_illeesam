package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnReplyDto {

    // ── cm_bltn_reply ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

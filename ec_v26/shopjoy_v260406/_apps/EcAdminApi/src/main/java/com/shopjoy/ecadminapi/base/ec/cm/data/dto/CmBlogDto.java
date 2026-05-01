package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBlogDto {

    // ── cm_blog ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

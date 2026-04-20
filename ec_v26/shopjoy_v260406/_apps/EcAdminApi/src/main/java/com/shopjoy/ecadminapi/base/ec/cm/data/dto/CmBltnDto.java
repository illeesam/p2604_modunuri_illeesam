package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnDto {

    // ── cm_bltn ──────────────────────────────────────────
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

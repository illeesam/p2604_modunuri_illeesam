package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdReviewAttachDto {

    // ── pd_review_attach ──────────────────────────────────────────
    private String reviewAttachId;
    private String siteId;
    private String reviewId;
    private String attachId;
    private String mediaTypeCd;
    private String thumbUrl;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

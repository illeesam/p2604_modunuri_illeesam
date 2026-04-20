package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PdReviewDto {

    // ── pd_review ──────────────────────────────────────────
    private String reviewId;
    private String siteId;
    private String prodId;
    private String memberId;
    private String reviewTitle;
    private String reviewContent;
    private BigDecimal rating;
    private Integer helpfulCnt;
    private Integer unhelpfulCnt;
    private String reviewStatusCd;
    private String reviewStatusCdBefore;
    private LocalDateTime reviewDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}

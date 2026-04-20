package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PdReviewReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PdReview toEntity() {
        return PdReview.builder()
                .reviewId(reviewId)
                .siteId(siteId)
                .prodId(prodId)
                .memberId(memberId)
                .reviewTitle(reviewTitle)
                .reviewContent(reviewContent)
                .rating(rating)
                .helpfulCnt(helpfulCnt)
                .unhelpfulCnt(unhelpfulCnt)
                .reviewStatusCd(reviewStatusCd)
                .reviewStatusCdBefore(reviewStatusCdBefore)
                .reviewDate(reviewDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

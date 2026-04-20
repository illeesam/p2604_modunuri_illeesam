package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdReviewAttachReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PdReviewAttach toEntity() {
        return PdReviewAttach.builder()
                .reviewAttachId(reviewAttachId)
                .siteId(siteId)
                .reviewId(reviewId)
                .attachId(attachId)
                .mediaTypeCd(mediaTypeCd)
                .thumbUrl(thumbUrl)
                .sortOrd(sortOrd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}

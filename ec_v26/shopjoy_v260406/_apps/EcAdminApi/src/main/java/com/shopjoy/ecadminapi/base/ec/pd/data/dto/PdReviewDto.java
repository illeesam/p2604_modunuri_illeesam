package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PdReviewDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String reviewId;
        @Size(max = 21) private String prodId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
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
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

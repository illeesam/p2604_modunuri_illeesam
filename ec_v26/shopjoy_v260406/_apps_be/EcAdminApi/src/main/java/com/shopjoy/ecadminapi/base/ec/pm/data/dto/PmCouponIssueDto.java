package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PmCouponIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String issueId;
        @Size(max = 21) private String memberId;
        private List<String> couponIds;          // 쿠폰 ID IN — prodId 기반 사전 필터용
        @Size(max = 21) private String prodId;   // 상품 기준 필터 — pm_coupon_prod 조회 후 couponIds 주입
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String issueId;
        private String siteId;
        private String couponId;
        private String memberId;
        private LocalDateTime issueDate;
        private String useYn;
        private LocalDateTime useDate;
        private String orderId;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String couponNm;
        private String couponCd;
        private String couponTypeCd;
        private BigDecimal discountRate;
        private Long discountAmt;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String memberNm;
        private String memberEmail;
        private String memberPhone;
        private String couponTypeCdNm;
        // ── 연관정보 (목록 시 채움) ──
        private PmCouponDto.Item coupon;   // 쿠폰 마스터 단건
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}

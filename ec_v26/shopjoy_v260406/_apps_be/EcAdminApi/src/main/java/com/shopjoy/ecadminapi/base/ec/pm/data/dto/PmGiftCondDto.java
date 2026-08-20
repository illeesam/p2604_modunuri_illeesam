package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmGiftCondDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID
        @Size(max = 21) private String giftCondId;   // 사은품조건ID 필터
        @Size(max = 21) private String giftId;       // 사은품ID 필터 (pm_gift.gift_id)
        @Size(max = 20) private String targetTypeCd; // 대상유형 필터 (PRODUCT/CATEGORY/MEMBER_GRADE)
        @Size(max = 21) private String targetId;     // 대상ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String giftCondId;      // 사은품조건ID
        private String giftId;          // 사은품ID (pm_gift.gift_id)
        private String condTypeCd;      // 조건유형 — COND_TYPE_CD {ORDER_AMT:주문금액, PRODUCT:특정상품, MEMBER_GRADE:회원등급, CATEGORY_INCLUDED:카테고리 포함, MIN_AMT:최소구매금액, PROD_INCLUDED:상품 포함}
        private Long minOrderAmt;       // 최소주문금액 (ORDER_AMT 조건)
        private String targetTypeCd;    // 대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)
        private String targetId;        // 대상ID
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}

package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmDiscntItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID
        @Size(max = 21) private String discntItemId; // 할인항목ID 필터
        @Size(max = 21) private String discntId;     // 할인ID 필터 (pm_discnt.discnt_id)
        @Size(max = 21) private String targetId;     // 대상ID 필터 (category_id/prod_id/grade_cd)
        @Size(max = 20) private String targetTypeCd; // 대상유형 필터 — PROMO_TARGET_TYPE {ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String discntItemId;    // 할인항목ID
        private String discntId;        // 할인ID (pm_discnt.discnt_id)
        private String targetTypeCd;    // 대상유형 — PROMO_TARGET_TYPE {ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급}
        private String targetId;        // 대상ID (category_id/prod_id/grade_cd)
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}

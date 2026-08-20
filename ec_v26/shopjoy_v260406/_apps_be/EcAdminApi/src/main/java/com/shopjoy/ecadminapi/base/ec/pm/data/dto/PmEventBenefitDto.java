package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PmEventBenefitDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;         // 사이트ID
        @Size(max = 21) private String eventBenefitId; // 혜택ID 필터
        @Size(max = 21) private String eventId;         // 상위 FK 필터
        private List<String> eventIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String eventBenefitId;  // 혜택ID
        private String eventId;         // 이벤트ID
        private String benefitNm;       // 혜택명
        private String benefitTypeCd;   // 혜택유형 — BENEFIT_TYPE_CD {COUPON:쿠폰, SAVE:적립금, CACHE:캐시, GIFT:사은품, DISCOUNT:즉시할인, AMOUNT:정액할인, BUNDLE:묶음혜택, CASHBACK:캐시백 외 2개}
        private String conditionDesc;   // 조건 설명
        private String benefitValue;    // 혜택 값
        private String couponId;        // 연결 쿠폰ID
        private Integer sortOrd;        // 정렬순서
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;           // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}

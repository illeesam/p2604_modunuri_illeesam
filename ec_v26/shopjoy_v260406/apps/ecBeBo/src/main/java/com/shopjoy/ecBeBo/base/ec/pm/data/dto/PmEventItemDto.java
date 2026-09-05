package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PmEventItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID
        @Size(max = 21) private String eventItemId;  // 이벤트항목ID 필터
        @Size(max = 21) private String eventId;         // 상위 FK 필터
        private List<String> eventIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String eventItemId;     // 이벤트항목ID (YYMMDDhhmmss+rand4)
        private String eventId;         // 이벤트ID (pm_event.event_id)
        private String targetTypeCd;    // 대상유형 — PROMO_TARGET_TYPE {ALL:전체, PRODUCT:상품, CATEGORY:카테고리, VENDOR:업체, BRAND:브랜드, MEMBER_GRADE:회원등급}
        private String targetId;        // 대상ID (prod_id/category_id/vendor_id/brand_id)
        private Integer sortNo;         // 이벤트 내 노출 순서
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}

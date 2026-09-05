package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmPlanItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;      // 사이트ID
        @Size(max = 21) private String planItemId;  // 기획전상품ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String planItemId;      // 기획전상품ID
        private String planId;          // 기획전ID (pm_plan.plan_id)
        private String prodId;          // 상품ID (pd_prod.prod_id)
        private Integer sortOrd;        // 정렬순서
        private String planItemMemo;    // 항목 메모 (특가/한정수량 등)
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

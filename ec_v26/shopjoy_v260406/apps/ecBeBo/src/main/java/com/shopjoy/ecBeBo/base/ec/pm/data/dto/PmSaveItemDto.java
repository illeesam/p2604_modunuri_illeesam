package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmSaveItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String saveItemId;  // PK: SAI+yyMMddHHmmss+rand4
        @Size(max = 21) private String saveId;  // 적립금정책ID (pm_save_policy.save_policy_id)
        @Size(max = 21) private String targetId;  // 대상 ID (상품·카테고리·브랜드 등)
        @Size(max = 20) private String targetTypeCd;  // 대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveItemId;  // PK: SAI+yyMMddHHmmss+rand4
        private String saveId;  // 적립금정책ID (pm_save_policy.save_policy_id)
        private String targetTypeCd;  // 대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)
        private String targetId;  // 대상 ID (상품·카테고리·브랜드 등)
        private String regBy;  // 등록자 ID
        private LocalDateTime regDate;  // 등록일시
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String targetTypeCdNm;  // 대상유형명 (조인)
    }

}

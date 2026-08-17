package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdCategoryDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 21) private String categoryId;          // 카테고리ID 필터
        @Size(max = 21) private String parentCategoryId;    // 상위 카테고리ID 필터
        @Size(max = 30) private String status;              // 카테고리상태 필터 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        private Integer depth;                              // 카테고리 깊이 필터 (1:대/2:중/3:소)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String categoryId;              // 카테고리ID (YYMMDDhhmmss+rand4)
        private String parentCategoryId;        // 상위 카테고리ID
        private String categoryNm;              // 카테고리명
        private Integer categoryDepth;          // 깊이 (1:대/2:중/3:소)
        private Integer sortOrd;                // 정렬순서
        private String categoryStatusCd;        // 상태 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        private String categoryStatusCdBefore;  // 변경 전 카테고리상태 — CATEGORY_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        private String imgUrl;                  // 이미지URL
        private String categoryDesc;            // 설명
        private String regBy;                   // 등록자
        private LocalDateTime regDate;          // 등록일
        private String regSiteId;               // 등록 사이트ID
        private String updBy;                   // 수정자
        private LocalDateTime updDate;          // 수정일
        private String parentCategoryNm;        // 상위 카테고리명 (조인 표시용)
        private String grandParentCategoryNm;   // 최상위(조부모) 카테고리명 (조인 표시용)
        private String categoryStatusCdNm;      // 카테고리상태 코드라벨 (조인 표시용)
    }

}

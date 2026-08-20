package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PdCategoryProdDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;              // 사이트ID 필터
        @Size(max = 21) private String categoryProdId;       // 상품카테고리연결ID 필터
        @Size(max = 21) private String categoryId;           // 카테고리ID 필터
        @Size(max = 21) private String prodId;                // 상품ID 필터
        @Size(max = 200) private String prodNm;              // 상품명 LIKE 필터
        @Size(max = 30) private String typeCd;                // 진열유형 필터 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)
        /** 선택 카테고리 + 자식 카테고리 ID 콤마 구분 목록 (지정 시 categoryId 단일 대신 IN 조건으로 조회). 예: "C001,C002,C003" */
        @Size(max = 2000) private String categoryIdsCsv;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String categoryProdId;      // 상품카테고리연결ID (YYMMDDhhmmss+rand4)
        private String categoryId;          // 카테고리ID (pd_category.category_id)
        private String prodId;              // 상품ID (pd_prod.prod_id)
        private String categoryProdTypeCd;  // 진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)
        private Integer sortOrd;            // 표시 순서 (동일 타입 내, 낮을수록 우선 노출)
        private String emphasisCd;          // 강조표시 코드 (자유 문자열)
        private String dispYn;              // 전시여부 (Y=전시, N=비전시)
        private LocalDate dispStartDate;    // 전시시작일 (NULL=즉시)
        private LocalDate dispEndDate;      // 전시종료일 (NULL=무기한, 기본 3년 후 12월31일)
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
        private String siteNm;              // 사이트명 (조인 표시용)
        private String categoryNm;          // 카테고리명 (조인 표시용)
        private String prodNm;              // 상품명 (조인 표시용)
    }

}

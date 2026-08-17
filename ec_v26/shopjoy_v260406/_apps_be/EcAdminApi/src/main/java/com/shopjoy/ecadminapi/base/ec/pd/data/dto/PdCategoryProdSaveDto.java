package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 카테고리-상품 매핑 일괄 저장 Request DTO.
 * 사용: PUT /api/bo/ec/pd/category-prod
 */
public class PdCategoryProdSaveDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 저장 대상 행 목록 */
        private List<Row> categoryProds;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Row {
        /** "I" (insert) / "U" (update) / "D" (delete) — 기본 "U" */
        private String rowStatus;
        private String categoryProdId;      // 상품카테고리연결ID (신규 시 null)
        private String categoryId;          // 카테고리ID
        private String prodId;              // 상품ID
        /** typeCd 또는 categoryProdTypeCd 둘 중 하나 사용 */
        private String typeCd;              // 진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)
        private String categoryProdTypeCd;  // 진열유형 (typeCd 미지정 시 사용)
        private String dispYn;              // 전시여부 Y/N
        private String emphasisCd;          // 강조표시 코드 (자유 문자열)
        private Integer sortOrd;            // 표시 순서
    }
}

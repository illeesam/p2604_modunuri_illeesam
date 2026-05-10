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
        private String categoryProdId;
        private String categoryId;
        private String prodId;
        /** typeCd 또는 categoryProdTypeCd 둘 중 하나 사용 */
        private String typeCd;
        private String categoryProdTypeCd;
        private String dispYn;
        private String emphasisCd;
        private Integer sortOrd;
    }
}

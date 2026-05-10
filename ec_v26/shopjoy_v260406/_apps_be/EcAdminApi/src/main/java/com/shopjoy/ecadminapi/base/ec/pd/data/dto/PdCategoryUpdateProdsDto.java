package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 카테고리에 속한 상품 일괄 갱신 Request DTO.
 * 사용: PUT /api/bo/ec/pd/category/{categoryId}/{activeTypeCd}/prods
 */
public class PdCategoryUpdateProdsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 갱신 대상 상품 행 목록 */
        private List<Row> prods;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Row {
        private String categoryProdId;
        private String prodId;
        private Integer sortOrd;
        private String dispYn;
    }
}

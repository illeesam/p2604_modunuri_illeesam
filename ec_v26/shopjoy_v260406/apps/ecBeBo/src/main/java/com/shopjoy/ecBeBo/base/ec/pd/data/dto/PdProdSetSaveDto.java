package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 세트상품 등록/구성품 수정 Request DTO.
 * 사용:
 *   POST /api/bo/ec/pd/prod-set
 *   PUT  /api/bo/ec/pd/prod-set/{id}/items
 */
public class PdProdSetSaveDto {

    @Getter @Setter @NoArgsConstructor
    public static class CreateRequest {
        private String prodNm;  // 세트상품명
        private List<Item> items;  // 세트 구성품 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class UpdateItemsRequest {
        private List<Item> items;  // 세트 구성품 목록 (전체 교체)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodId;  // 구성품 상품ID (pd_prod.prod_id)
        private Integer qty;  // 구성 수량
        private Integer sortOrd;  // 노출 정렬 순서
    }
}

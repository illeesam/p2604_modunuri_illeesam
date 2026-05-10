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
        private String prodNm;
        private String siteId;
        private List<Item> items;
    }

    @Getter @Setter @NoArgsConstructor
    public static class UpdateItemsRequest {
        private List<Item> items;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodId;
        private Integer qty;
        private Integer sortOrd;
    }
}

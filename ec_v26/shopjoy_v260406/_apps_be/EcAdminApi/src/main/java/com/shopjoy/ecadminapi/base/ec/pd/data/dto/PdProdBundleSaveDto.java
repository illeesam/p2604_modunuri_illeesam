package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 묶음상품 등록/구성품 수정 Request DTO.
 * 사용:
 *   POST /api/bo/ec/pd/prod-bundle
 *   PUT  /api/bo/ec/pd/prod-bundle/{id}/items
 */
public class PdProdBundleSaveDto {

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

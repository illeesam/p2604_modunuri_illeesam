package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 상품 옵션 그룹/아이템 일괄 갱신 Request DTO.
 * 사용: PUT /api/bo/ec/pd/prod/{prodId}/opts
 *
 * 클라이언트 _id (그룹/아이템 임시키) 는 부모 매핑 변환에 사용.
 */
public class PdProdOptUpdateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private List<Group> optGroups;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Group {
        private Object _id;
        private String grpNm;
        private String typeCd;
        private String inputTypeCd;
        private Integer level;
        private List<Item> items;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private Object _id;
        private String nm;
        private String val;
        private String valCodeId;
        /** 부모 _id 또는 부모 optItemId */
        private Object parentOptItemId;
        private Integer sortOrd;
        private String useYn;
    }
}

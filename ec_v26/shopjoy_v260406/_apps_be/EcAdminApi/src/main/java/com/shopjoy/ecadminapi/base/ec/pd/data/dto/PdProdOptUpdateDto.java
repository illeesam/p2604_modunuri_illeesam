package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 상품 옵션 유형/값 일괄 갱신 Request DTO.
 * 사용: PUT /api/bo/ec/pd/prod/{prodId}/opts
 *
 * 클라이언트 _id (유형/값 임시키) 는 부모 매핑 변환에 사용.
 */
public class PdProdOptUpdateDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private List<OptType> optTypes;
    }

    @Getter @Setter @NoArgsConstructor
    public static class OptType {
        private Object _id;
        private String optTypeNm;
        private String optInputTypeCd;
        private Integer optTypeLevel;
        private List<OptVal> optVals;
    }

    @Getter @Setter @NoArgsConstructor
    public static class OptVal {
        private Object _id;
        private String nm;
        private String val;
        private String valCodeId;
        /** 부모 _id 또는 부모 optId */
        private Object parentOptId;
        private Integer sortOrd;
        private String useYn;
    }
}

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
        private String optTypeCd;    // 옵션유형 분류코드 (예: COLOR, SIZE) — pd_prod.prod_opt_type1_cd/2_cd 로 저장
        private String level1Cd;     // 하위호환용 (optTypeCd 없을 때 폴백)
        private String level2Cd;
        private Integer optTypeLevel;
        private List<OptVal> optVals;
    }

    @Getter @Setter @NoArgsConstructor
    public static class OptVal {
        private Object _id;
        private String nm;
        private String val;
        private String stdCd;       // OPT_VAL 공통코드 참조값 (BLACK/SIZE_M 등), 직접입력 시 null
        private String prodOptStyle;
        /** 부모 _id 또는 부모 optId */
        private Object parentOptId;
        private Integer sortOrd;
        private String useYn;
    }
}

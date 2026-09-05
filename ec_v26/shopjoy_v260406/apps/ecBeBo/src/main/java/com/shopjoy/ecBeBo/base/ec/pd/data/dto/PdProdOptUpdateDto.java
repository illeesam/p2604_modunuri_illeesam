package com.shopjoy.ecBeBo.base.ec.pd.data.dto;

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
        private List<OptType> optTypes;    // 갱신할 옵션 유형 목록 (전체 교체)
    }

    @Getter @Setter @NoArgsConstructor
    public static class OptType {
        private Object _id;          // 클라이언트 임시키 (신규 유형 식별용)
        private String optTypeNm;    // 옵션유형명 (예: 색상, 사이즈)
        private String optTypeCd;    // 옵션유형 분류코드 (예: COLOR, SIZE) — pd_prod.prod_opt1_type_cd/2_cd 로 저장
        private String level1Cd;     // 하위호환용 (optTypeCd 없을 때 폴백)
        private String level2Cd;     // 하위호환용 2단 코드 (optTypeCd 없을 때 폴백)
        private Integer optTypeLevel;    // 옵션유형레벨 (1 또는 2)
        private List<OptVal> optVals;    // 해당 유형에 속한 옵션값 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class OptVal {
        private Object _id;         // 클라이언트 임시키 (신규 값 식별용)
        private String nm;          // 옵션명 (예: 빨강, M)
        private String val;         // 실제 저장값 (자유 문자열)
        private String stdCd;       // OPT_VAL 공통코드 참조값 (BLACK/SIZE_M 등), 직접입력 시 null
        private String prodOptStyle;    // 옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열)
        /** 부모 _id 또는 부모 optId */
        private Object parentOptId;
        private Integer sortOrd;    // 정렬순서
        private String useYn;       // 사용여부 Y/N
    }
}

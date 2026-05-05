package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 공통 코드 데이터 VO
 * - sy_code 테이블 기반
 * - 그리드 형식으로 모든 코드를 배열로 저장 (codeGrp | codeId | codeNm | codeVal | ...)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreCode {

    // 그리드 형식: 모든 코드를 하나의 배열로 저장 (codeGrp별 구분 없이 선형 배열)
    // 예: [{ codeGrp: "ORDER_STATUS", codeId: "...", codeNm: "...", ... }, ...]
    private List<CodeInfo> codes;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeInfo {
        private String  codeGrp;          // 코드 그룹
        private String  codeId;           // 코드 ID
        private String  codeNm;           // 코드명
        private String  codeVal;          // 코드값
        private String  codeSortOrd;      // 정렬 순서
        private String  codeRemark;       // 비고
        private String  useYn;            // 사용여부
        private String  parentCodeValue;  // 부모 코드값 (트리)
        private Integer codeLevel;        // 트리 레벨 (1=루트)
        private String  codeOpt1;         // 부가 옵션1 (스타일 색상/아이콘 등)
    }
}

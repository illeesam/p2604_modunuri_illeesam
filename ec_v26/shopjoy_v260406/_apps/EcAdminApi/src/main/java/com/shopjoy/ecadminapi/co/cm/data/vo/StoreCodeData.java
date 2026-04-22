package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 공통 코드 데이터 VO
 * - sy_code_grp, sy_code 테이블 기반
 * - 코드 그룹별로 코드 목록을 저장
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreCodeData {

    // 코드 그룹별로 코드 목록 저장
    // 예: { "ORDER_STATUS": [{ codeId, codeNm, codeVal, ... }], ... }
    private Map<String, List<CodeInfo>> codesByGroup;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeInfo {
        private String codeGrp;       // 코드 그룹
        private String codeId;        // 코드 ID
        private String codeNm;        // 코드명
        private String codeVal;       // 코드값
        private String codeSortOrd;   // 정렬 순서
        private String codeRemark;    // 비고
    }
}

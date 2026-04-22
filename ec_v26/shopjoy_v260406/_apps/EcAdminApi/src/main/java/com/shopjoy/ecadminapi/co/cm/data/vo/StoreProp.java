package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 시스템 속성 데이터 VO
 * - sy_prop 테이블 기반
 * - 속성 키-값 형태로 저장
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreProp {

    private Map<String, PropInfo> propsByKey;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropInfo {
        private String propKey;       // 속성 키
        private String propVal;       // 속성값
        private String propNm;        // 속성명
        private String propRemark;    // 비고
    }
}

package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 역할(권한) 정보 VO
 * - sy_role 테이블 기반
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreRole {
    private String roleId;            // 역할 ID
    private String roleNm;            // 역할명
    private String roleCd;            // 역할 코드
    private String roleSortOrd;       // 정렬 순서
    private String roleRemark;        // 비고
    private String regDate;           // 등록 일시
    private String modDate;           // 수정 일시
}

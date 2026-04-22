package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 전시 정보 (구조 + 데이터) VO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreDispInfo {
    private StoreDispStructure dispStruc;
    private StoreDispData dispData;
}

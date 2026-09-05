package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 전시 데이터 VO
 * - 각 영역별 실제 전시 데이터
 * - 상품, 배너, 이미지 등 동적 콘텐츠
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreDispData {

    // 전시 데이터: 각 영역별 실제 데이터
    private Map<String, Object> dataByArea;
}

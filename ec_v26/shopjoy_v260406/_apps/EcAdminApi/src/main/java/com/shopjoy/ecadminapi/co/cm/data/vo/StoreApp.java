package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 앱 정보 VO
 * - BO/FO 통합 (사이트 번호는 bo/foSiteNo 중 사용 가능)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreApp {
    private String boSiteNo;          // BO 사이트 번호
    private String foSiteNo;          // FO 사이트 번호
    private String appVersion;        // 앱 버전
    private String lastUpdateDate;    // 마지막 업데이트 날짜
}

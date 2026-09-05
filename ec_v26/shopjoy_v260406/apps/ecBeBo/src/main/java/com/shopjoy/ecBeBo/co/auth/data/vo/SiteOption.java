package com.shopjoy.ecBeBo.co.auth.data.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** FO 로그인 화면 사이트 선택란 옵션 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteOption {
    private String siteId;
    private String siteNm;
}

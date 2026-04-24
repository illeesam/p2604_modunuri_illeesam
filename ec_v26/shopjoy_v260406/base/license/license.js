/**
 * ShopJoy 라이선스 로더
 *
 * 백엔드 LicenseGenerateMain 으로 생성된 JS 파일을 로드하면
 * window.SHOPJOY_LICENSE_BO / window.SHOPJOY_LICENSE_FO 가 자동 설정된다.
 *
 * boApiAxios.js → X-License-Code, X-Site-Id 헤더 자동 주입 (SHOPJOY_LICENSE_BO 참조)
 * foApiAxios.js → X-License-Code, X-Site-Id 헤더 자동 주입 (SHOPJOY_LICENSE_FO 참조)
 *
 * 사용법:
 *   bo.html    → <script src="base/license/licenseBo-{날짜}-{buyerId}.js"></script>
 *   index.html → <script src="base/license/licenseFo-{날짜}-{buyerId}.js"></script>
 *
 * 생성:
 *   백엔드 LicenseGenerateMain.java 실행 → ./license-output/ 에 JS 파일 생성
 *   → base/license/ 에 복사
 */
(function (global) {
  'use strict';

  /** 라이선스 로드 여부 확인 유틸 */
  global.LicenseManager = {
    isBoLoaded: function () { return !!(global.SHOPJOY_LICENSE_BO && global.SHOPJOY_LICENSE_BO.licenseCode); },
    isFoLoaded: function () { return !!(global.SHOPJOY_LICENSE_FO && global.SHOPJOY_LICENSE_FO.licenseCode); },
    getBoInfo:  function () { return global.SHOPJOY_LICENSE_BO || null; },
    getFoInfo:  function () { return global.SHOPJOY_LICENSE_FO || null; },
  };

})(typeof window !== 'undefined' ? window : this);

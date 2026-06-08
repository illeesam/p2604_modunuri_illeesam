/**
 * BO 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보 관리
 * - 외부 SDK / 서비스 연동 키 (소셜 / 결제 / 지도 / AWS / 알림 / 본인인증 / 분석 / 채팅) 보관
 *   ※ 키 추가/제거 시 FO 의 foAppStore.js 와 동일하게 유지
 */
const _BO_EXT_KEYS = [
  // 소셜 로그인
  'googleClientId', 'kakaoJsKey', 'naverClientId', 'naverCallbackUrl', 'facebookAppId', 'appleClientId',
  // 결제
  'tossClientKey', 'kakaoPayCid', 'naverPayClientId', 'inicisMid', 'kcpSiteCd',
  // 지도
  'naverMapClientId', 'kakaoMapJsKey', 'googleMapApiKey',
  // AWS
  'awsRegion', 'awsS3Bucket', 'awsS3PublicUrl', 'awsCognitoIdentityPoolId',
  // 알림/메시징
  'kakaoAlimtalkSenderKey', 'nhnCloudSmsAppKey', 'ncloudSensServiceId',
  // 본인인증
  'niceClientId', 'passClientId',
  // 보안/분석
  'recaptchaSiteKey', 'gaTrackingId', 'naverAnalyticsId', 'facebookPixelId',
  // 채팅/CS
  'channelTalkPluginKey',
  // 기타
  'daumPostcodeUrl',
];

const _boSvKey = (k) => 'sv' + k.charAt(0).toUpperCase() + k.slice(1);
const _boEmptyExt = () => _BO_EXT_KEYS.reduce((acc, k) => { acc[_boSvKey(k)] = ''; return acc; }, {});

window.useBoAppStore = Pinia.defineStore('boApp', {
  state: () => ({
    svBoSiteNo: '01',
    svBoSiteId: '2604010000000001',
    svBoSiteNm: 'ShopJoy 메인몰',
    svAppVersion: '2.6.0',
    svLastUpdateDate: '',
    svActive: '-',
    ..._boEmptyExt(),
  }),

  getters: {
    sgGetAppVersion: (s) => s.svAppVersion,            // 앱 버전
    sgGetBoSiteNo:   (s) => s.svBoSiteNo,              // BO 사이트 번호
    sgGetBoSiteId:   (s) => s.svBoSiteId,              // BO 사이트 ID
    sgGetBoSiteNm:   (s) => s.svBoSiteNm,              // BO 사이트 이름
    sgGetLastUpdateDate: (s) => s.svLastUpdateDate,    // 마지막 업데이트 날짜
    sgGetActive:     (s) => s.svActive,                // 활성 환경 (local/dev/prod)
    sgGetExtKey:     (s) => (key) => s[_boSvKey(key)] || '',
  },

  actions: {
    saSetApp(appData) {
      if (!appData) return;
      this.svBoSiteNo       = appData.boSiteNo       || '01';
      this.svBoSiteId       = appData.boSiteId       || '2604010000000001';
      this.svBoSiteNm       = appData.boSiteNm       || 'ShopJoy 메인몰';
      this.svAppVersion     = appData.appVersion     || '2.6.0';
      this.svLastUpdateDate = appData.lastUpdateDate || '';
      this.svActive         = appData.active         || '-';
      _BO_EXT_KEYS.forEach((k) => { this[_boSvKey(k)] = appData[k] || ''; });
    },

    saSetAppVersion(version) { if (version) this.svAppVersion = version; },
    saSetBoSiteNo(siteNo)    { if (siteNo) this.svBoSiteNo = siteNo; },
    saSetBoSiteId(siteId)    { if (siteId) this.svBoSiteId = siteId; },
    saSetBoSiteNm(siteNm)    { if (siteNm) this.svBoSiteNm = siteNm; },
    saSetLastUpdateDate(d)   { if (d) this.svLastUpdateDate = d; },

    saClear() {
      this.svBoSiteNo = '01';
      this.svBoSiteId = '2604010000000001';
      this.svBoSiteNm = 'ShopJoy 메인몰';
      this.svAppVersion = '2.6.0';
      this.svLastUpdateDate = '';
      this.svActive = '-';
      _BO_EXT_KEYS.forEach((k) => { this[_boSvKey(k)] = ''; });
    },
  },
});

// 함수형 유틸리티 제공
window.sfGetBoAppStore = () => {
  try {
    const s = window.useBoAppStore?.();
    if (s) return s;
  } catch (e) {
    console.error('[sfGetBoAppStore] error:', e);
  }
  return {
    svBoSiteNo: '01',
    svBoSiteId: '2604010000000001',
    svBoSiteNm: 'ShopJoy 메인몰',
    svAppVersion: '2.6.0',
    svLastUpdateDate: '',
    svActive: '-',
    ..._boEmptyExt(),
  };
};

/**
 * FO (Front Office) 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 번호, 업데이트 정보, 환경 관리
 * - 외부 SDK / 서비스 연동 키 (소셜 / 결제 / 지도 / AWS / 알림 / 본인인증 / 분석 / 채팅) 보관
 *   ※ 키 추가/제거 시 BO 의 boAppStore.js 와 동일하게 유지
 */
const _EXT_KEYS = [
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

// state 의 'sv' + Camel(첫 글자 대문자) 키 생성
const _svKey = (k) => 'sv' + k.charAt(0).toUpperCase() + k.slice(1);

// 모든 ext 키를 빈 문자열로 초기화한 객체
const _emptyExt = () => _EXT_KEYS.reduce((acc, k) => { acc[_svKey(k)] = ''; return acc; }, {});

window.useFoAppStore = Pinia.defineStore('foApp', {
  state: () => ({
    svFoSiteNo: '01',
    svAppVersion: '2.6.0',
    svLastUpdateDate: '',
    svActive: '-',
    ..._emptyExt(),
  }),

  getters: {
    sgGetAppVersion: (s) => s.svAppVersion,
    sgGetFoSiteNo: (s) => s.svFoSiteNo,
    sgGetLastUpdateDate: (s) => s.svLastUpdateDate,
    sgGetActive: (s) => s.svActive,
    // SDK 키 통합 getter — 키 이름을 그대로 받아 svXxx 반환
    sgGetExtKey: (s) => (key) => s[_svKey(key)] || '',
  },

  actions: {
    /**
     * 앱 정보 설정
     */
    saSetApp(appData) {
      if (!appData) return;
      this.svFoSiteNo       = appData.foSiteNo       || '01';
      this.svAppVersion     = appData.appVersion     || '2.6.0';
      this.svLastUpdateDate = appData.lastUpdateDate || '';
      this.svActive         = appData.active         || '-';
      // 외부 키 일괄 매핑
      _EXT_KEYS.forEach((k) => { this[_svKey(k)] = appData[k] || ''; });
    },

    saSetAppVersion(version) { if (version) this.svAppVersion = version; },
    saSetFoSiteNo(siteNo)    { if (siteNo) this.svFoSiteNo = siteNo; },
    saSetLastUpdateDate(d)   { if (d) this.svLastUpdateDate = d; },

    /**
     * 초기화 (로그아웃 시)
     */
    saClear() {
      this.svFoSiteNo = '01';
      this.svAppVersion = '2.6.0';
      this.svLastUpdateDate = '';
      this.svActive = '-';
      _EXT_KEYS.forEach((k) => { this[_svKey(k)] = ''; });
    },
  },
});

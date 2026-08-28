/**
 * BO 앱 정보 Pinia 스토어
 * - 앱 버전, 사이트 정보, 업데이트 정보 관리
 * - 외부 SDK / 서비스 연동 키 보관 (키 목록은 coConsts.EXT_KEYS — FO 와 공유)
 *
 * 값 주입 경로: 로그인 → coApiSvc.cmBoAppStore.getInitData() → data.syApp → saSetApp()
 * 읽기: coExtSdk._key('svXxx') 가 store[name] 으로 직접 읽는다 (getter 경유 안 함).
 */

/* 기본값 — state / saClear / sfGetBoAppStore 폴백 세 곳이 같은 값을 써야 한다.
   예전엔 세 곳에 리터럴을 복제해 두어 하나만 고치면 조용히 어긋났다. */
const _boAppDefaults = () => ({
  svBoSiteId: '2604010000000001',
  svBoSiteNm: 'ShopJoy 메인몰',
  svAppVersion: '2.6.0',
  svLastUpdateDate: '',
  svActive: '-',
  ...coUtil.cofExtKeyState(),
});

window.useBoAppStore = Pinia.defineStore('boApp', {
  state: _boAppDefaults,

  actions: {
    saSetApp(appData) {
      if (!appData) return;
      this.svBoSiteId       = appData.boSiteId       || '2604010000000001';
      this.svBoSiteNm       = appData.boSiteNm       || 'ShopJoy 메인몰';
      this.svAppVersion     = appData.appVersion     || '2.6.0';
      this.svLastUpdateDate = appData.lastUpdateDate || '';
      this.svActive         = appData.active         || '-';
      /* 외부 키 — 서버 실값 우선, 서버가 빈 값/데모 더미면 기존 값(파일 시드) 유지.
         소스 구매자가 state 에 직접 시드한 실키가 데모 더미로 덮이지 않게 한다. */
      const ext = coUtil.cofExtKeyState(appData);
      Object.keys(ext).forEach((k) => { this[k] = ext[k] || this[k] || ''; });
    },

    saSetBoSiteId(siteId) { if (siteId) this.svBoSiteId = siteId; },
    saSetBoSiteNm(siteNm) { if (siteNm) this.svBoSiteNm = siteNm; },

    saClear() { Object.assign(this, _boAppDefaults()); },
  },
});

/* sfGetBoAppStore — Pinia 미초기화 구간에서도 안전하게 값을 읽기 위한 접근자 */
window.sfGetBoAppStore = () => {
  try {
    const s = window.useBoAppStore?.();
    if (s) return s;
  } catch (e) {
    console.error('[sfGetBoAppStore] error:', e);
  }
  return _boAppDefaults();
};

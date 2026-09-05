/**
 * FO (Front Office) 앱 정보 Pinia 스토어
 * - 앱 버전, 업데이트 정보, 환경 관리
 * - 외부 SDK / 서비스 연동 키 보관 (키 목록은 coConsts.EXT_KEYS — BO 와 공유)
 *
 * 값 주입 경로: 로그인 → coApiSvc.cmFoAppStore.getInitData() → data.syApp → saSetApp()
 * 읽기: coExtSdk._key('svXxx') 가 store[name] 으로 직접 읽는다 (getter 경유 안 함).
 *
 * ※ 사이트 번호는 여기 두지 않는다. window.FO_SITE_NO + localStorage(modu-fo-sy-siteNo) 가
 *   단일 기준이다 (index.html head 인라인 스크립트).
 */

/* 기본값 — state / saClear 두 곳이 같은 값을 써야 한다. */
const _foAppDefaults = () => ({
  svAppVersion: '2.6.0',
  svLastUpdateDate: '',
  svActive: '-',
  ...coUtil.cofExtKeyState(),
});

window.useFoAppStore = Pinia.defineStore('foApp', {
  state: _foAppDefaults,

  actions: {
    saSetApp(appData) {
      if (!appData) return;
      this.svAppVersion     = appData.appVersion     || '2.6.0';
      this.svLastUpdateDate = appData.lastUpdateDate || '';
      this.svActive         = appData.active         || '-';
      /* 외부 키 — 서버 실값 우선, 서버가 빈 값/데모 더미면 기존 값(파일 시드) 유지. */
      const ext = coUtil.cofExtKeyState(appData);
      Object.keys(ext).forEach((k) => { this[k] = ext[k] || this[k] || ''; });
    },

    saClear() { Object.assign(this, _foAppDefaults()); },
  },
});

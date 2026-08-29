/* manifest.js — "홈 > 대시보드 관리 / 사용자 대시보드 관리" 마이크로 도메인의
 * 유일한 진입점. document.currentScript.src 기반 자기 경로 해석 방식, 지연로드
 * 방식(loadModule+_domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/cm/ 를 그대로 복사해왔다(2026-08-29,
 * 원본은 전혀 수정하지 않음). 원본 소스는 cm(고객센터) 패키지 안에 있지만, 실제
 * 좌측 메뉴 구조(lib/app/boAppMenuData.js 의 LEFT_MENUS_TAIL.home)에서는 '홈'
 * 대메뉴(bo-home) 아래 '대시보드 관리'/'사용자 대시보드 관리' 두 그룹으로 등록되는
 * 화면들이라, cm 소스 출신이지만 menuKey 는 bo-home 을 쓴다(같은 대메뉴에 이미
 * bo-ap-home 이 EC 대시보드 예시 2개로 기여 중 — group: null(평평) vs 이 폴더의
 * 명명된 그룹 2개가 같은 메뉴 안에 공존해도 무방하다).
 *
 * 공유 라이브러리 ESM import — CmDashboardWidgetUtil.js(대시보드 항목 공용 렌더 유틸,
 * export default)를 CmDashboardMng/CmDashboardItemMng/CmDashboardDataMng/
 * CmDashboardLayoutMng/CmDashboardMyMng 5개 화면이 `import ... from
 * './CmDashboardWidgetUtil.js'` 로 직접 참조한다(예전 window.cmDashWidgetUtil 전역
 * 방식에서 전환). 브라우저가 각 화면의 동적 import() 시 자동으로 같이 로드하므로
 * 여기서 별도 loadModule() 불필요(bo-zd/simul의 ZdSimulBase.js 와 동일 패턴). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/cm/dashboard/';

  const scripts = [
    R.loadModule(P + 'CmDashboardMng.js'),
    R.loadModule(P + 'CmDashboardItemMng.js'),
    R.loadModule(P + 'CmDashboardDataMng.js'),
    R.loadModule(P + 'CmDashboardLayoutMng.js'),
    R.loadModule(P + 'CmDashboardSysMenuMng.js'),
    R.loadModule(P + 'CmDashboardMyMng.js'),
    R.loadModule(P + 'CmDashboardMenuMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'cm-dashboard-cmDashboardMng', label: '대시보드 관리', group: '대시보드 관리', comp: results[0].default },
      { id: 'cm-dashboard-cmDashboardItemMng', label: '대시보드 항목관리', group: '대시보드 관리', comp: results[1].default },
      { id: 'cm-dashboard-cmDashboardDataMng', label: '대시보드 데이타관리', group: '대시보드 관리', comp: results[2].default },
      { id: 'cm-dashboard-cmDashboardLayoutMng', label: '대시보드 항목배치', group: '대시보드 관리', comp: results[3].default },
      { id: 'cm-dashboard-cmDashboardSysMenuMng', label: '대시보드 메뉴관리', group: '대시보드 관리', comp: results[4].default },
      { id: 'cm-dashboard-cmDashboardMyMng', label: '사용자 대시보드 관리', group: '사용자 대시보드 관리', comp: results[5].default },
      { id: 'cm-dashboard-cmDashboardMenuMng', label: '사용자 대시보드 메뉴관리', group: '사용자 대시보드 관리', comp: results[6].default },
    ];
    R.register('bo-home', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-cm manifest] 로드 실패:', err);
  });
})();

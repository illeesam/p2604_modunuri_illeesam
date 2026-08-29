/* manifest.js — "시스템 > 공통기능" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-sy) 에 bo-sy/ba
 * (기준정보)/bo-sy/org(조직)/bo-sy/vendor(업체)/bo-sy/sys(시스템)/bo-sy/menu(메뉴)/
 * bo-sy/hist(이력조회)도 별도 레포로 기여한다.
 *
 * CmPopupMng — 원본 소스는 pages/bo/ec/cm/(cm 패키지)에 있지만, 실제 좌측 메뉴
 * 구조(LEFT_MENUS.system)에서는 이 대메뉴(system)의 '공통기능' 그룹 소속인 단일
 * 화면이라 SyPostman(→bo-zd/devtools)과 같은 방식으로 여기 흡수했다.
 * shopjoy_v260406(실제 프로덕션)에서 그대로 복사(2026-08-29, 원본은 전혀 수정하지
 * 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/sy/common/CmPopupMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'sy-common-cmPopupMng', label: '공통팝업관리', group: '공통기능', comp: results[0].default },
    ];
    R.register('bo-sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy/common manifest] 로드 실패:', err);
  });
})();

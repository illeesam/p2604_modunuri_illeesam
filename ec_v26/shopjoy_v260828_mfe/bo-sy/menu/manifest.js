/* manifest.js — "시스템 > 메뉴" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-sy) 에 bo-sy/ba
 * (기준정보)/bo-sy/org(조직)/bo-sy/common(공통기능)/bo-sy/vendor(업체)/bo-sy/sys(시스템)/
 * bo-sy/hist(이력조회)도 별도 레포로 기여한다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/sy/ 를 그대로 복사해왔다(2026-08-29,
 * 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조(LEFT_MENUS.system)의 '메뉴'
 * 그룹(메뉴관리/역할관리)만 이 폴더가 담당한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/sy/menu/';

  const scripts = [
    R.loadModule(P + 'SyMenuMng.js'),
    R.loadModule(P + 'SyRoleMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'sy-menu-syMenuMng', label: '메뉴관리', group: '메뉴', comp: results[0].default },
      { id: 'sy-menu-syRoleMng', label: '역할관리', group: '메뉴', comp: results[1].default },
    ];
    R.register('bo-sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy/menu manifest] 로드 실패:', err);
  });
})();

/* manifest.js — "시스템 > 조직" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. bo-sy-ba(기준정보) 와 같은 대메뉴(sy)
 * 아래 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28). SyUserDtl 은
 * SyUserMng 템플릿 안에서 <sy-user-dtl> 로 쓰이는 내부 컴포넌트라 메뉴에는 안 올리고
 * registerComponents 로만 등록한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/bo/sy/org/SyUserDtl.js'),
    R.loadScript(base + 'pages/bo/sy/org/SyUserMng.js'),
    R.loadScript(base + 'pages/bo/sy/org/SyDeptMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'bo-sy-org-syUserMng', label: '사용자관리', group: '조직', comp: window.BoSyOrgSyUserMng },
      { id: 'bo-sy-org-syDeptMng', label: '부서관리', group: '조직', comp: window.BoSyOrgSyDeptMng },
    ];
    const innerComps = [
      { tag: 'SyUserDtl', comp: window.BoSyOrgSyUserDtl },
    ];
    R.register('bo-sy', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy-org manifest] 로드 실패:', err);
  });
})();

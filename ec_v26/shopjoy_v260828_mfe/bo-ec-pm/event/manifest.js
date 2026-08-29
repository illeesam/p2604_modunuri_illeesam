/* manifest.js — "프로모션 > 이벤트" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pm/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/pm/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/pm/event/';

  const scripts = [
    R.loadModule(P + 'PmEventMng.js'),
    R.loadModule(P + 'PmPlanMng.js'),
    R.loadModule(P + 'PmEventDtl.js'),
    R.loadModule(P + 'PmPlanDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pm-event-pmEventMng', label: '이벤트관리', group: '이벤트', comp: results[0].default },
      { id: 'pm-event-pmPlanMng', label: '기획전관리', group: '이벤트', comp: results[1].default },
    ];
    const innerComps = [
      { tag: 'PmEventDtl', comp: results[2].default },
      { tag: 'PmPlanDtl', comp: results[3].default },
    ];
    R.register('bo-ec-pm', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pm/event manifest] 로드 실패:', err);
  });
})();

/* manifest.js — "고객센터 > 고객" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. 같은 대메뉴(cu)에 bo-cu-co(공통업무)
 * 도 별도 레포로 기여한다(2026-08-28). CmNoticeDtl/CmFaqDtl 은 각각 CmNoticeMng/
 * CmFaqMng 템플릿 안에서 <cm-notice-dtl>/<cm-faq-dtl> 로 쓰이는 내부 컴포넌트라
 * 메뉴에는 안 올리고 registerComponents 로만 등록한다.
 *
 * ES 모듈 전면 전환(2026-08-29) — bo-ab-home/manifest.js 주석 참조. window.ComponentName
 * 대신 export default + R.loadModule(). registerComponents 의 tag(`'CmNoticeDtl'`,
 * `'CmFaqDtl'`)는 그대로다 — <cm-notice-dtl> 템플릿 태그는 comp.name 이 아니라 이
 * 명시적 tag 로 찾으므로 영향 없음. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/cu/ba/CmNoticeDtl.js'),
    R.loadModule(base + 'pages/bo/cu/ba/CmNoticeMng.js'),
    R.loadModule(base + 'pages/bo/cu/ba/CmFaqDtl.js'),
    R.loadModule(base + 'pages/bo/cu/ba/CmFaqMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'bo-cu-ba-cmNoticeMng', label: '공지사항관리', group: '고객', comp: results[1].default },
      { id: 'bo-cu-ba-cmFaqMng', label: 'FAQ관리', group: '고객', comp: results[3].default },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: results[0].default },
      { tag: 'CmFaqDtl', comp: results[2].default },
    ];
    R.register('bo-cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-cu-ba manifest] 로드 실패:', err);
  });
})();

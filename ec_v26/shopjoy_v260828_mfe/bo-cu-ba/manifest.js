/* manifest.js — "고객센터 > 고객" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-aa-home/manifest.js 주석 참조. 같은 대메뉴(cu)에 bo-cu-co(공통업무)
 * 도 별도 레포로 기여한다(2026-08-28). CmNoticeDtl/CmFaqDtl 은 각각 CmNoticeMng/
 * CmFaqMng 템플릿 안에서 <cm-notice-dtl>/<cm-faq-dtl> 로 쓰이는 내부 컴포넌트라
 * 메뉴에는 안 올리고 registerComponents 로만 등록한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/CmNoticeDtl.js'),
    R.loadScript(base + 'pages/CmNoticeMng.js'),
    R.loadScript(base + 'pages/CmFaqDtl.js'),
    R.loadScript(base + 'pages/CmFaqMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'cmNoticeMng', label: '공지사항관리', group: '고객', comp: window.CmNoticeMng },
      { id: 'cmFaqMng', label: 'FAQ관리', group: '고객', comp: window.CmFaqMng },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: window.CmNoticeDtl },
      { tag: 'CmFaqDtl', comp: window.CmFaqDtl },
    ];
    R.register('cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-cu-ba manifest] 로드 실패:', err);
  });
})();

/* manifest.js — "상품관리 > 상품" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-aa-home/manifest.js 주석 참조. 같은 대메뉴(pd)에 bo-pd-cate(카테고리)
 * 도 별도 레포로 기여한다(2026-08-28). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/PdTagMng.js'),
    R.loadScript(base + 'pages/PdRestockNotiMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'pdTagMng', label: '상품태그관리', group: '상품', comp: window.PdTagMng },
      { id: 'pdRestockNotiMng', label: '재입고알림관리', group: '상품', comp: window.PdRestockNotiMng },
    ];
    R.register('pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-pd-pd manifest] 로드 실패:', err);
  });
})();

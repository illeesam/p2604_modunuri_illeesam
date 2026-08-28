/* manifest.js — "상품관리 > 상품" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. 같은 대메뉴(pd)에 bo-pd-cate(카테고리)
 * 도 별도 레포로 기여한다(2026-08-28).
 *
 * ES 모듈 전면 전환(2026-08-29) — bo-ab-home/manifest.js 주석 참조. window.ComponentName
 * 대신 export default + R.loadModule(). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/pd/pd/PdTagMng.js'),
    R.loadModule(base + 'pages/bo/pd/pd/PdRestockNotiMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'bo-pd-pd-pdTagMng', label: '상품태그관리', group: '상품', comp: results[0].default },
      { id: 'bo-pd-pd-pdRestockNotiMng', label: '재입고알림관리', group: '상품', comp: results[1].default },
    ];
    R.register('bo-pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-pd-pd manifest] 로드 실패:', err);
  });
})();

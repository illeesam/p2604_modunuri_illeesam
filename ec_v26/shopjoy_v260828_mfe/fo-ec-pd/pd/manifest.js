/* manifest.js — "상품(목록/상세)" 마이크로 도메인의 유일한 진입점(FO).
 * document.currentScript.src 기반 자기 경로 해석 방식은 fo-ap-home/home/manifest.js,
 * bo-ap-global/lib/mfe/mfeRegistry.js 주석 참조.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/Prod01List.js + Prod01View.js 를 그대로
 * 복사해왔다(원본은 전혀 수정하지 않음). FO_SITE_NO 사이트 하나(01)로 범위 고정 —
 * fo-ap-home/home/manifest.js 주석 참고. 화면 파일은 export default(ES 모듈, 2026-08-29
 * BO와 동일하게 통일 — fo-ap-home/home/manifest.js 주석 참고). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/pd/';

  Promise.all([
    R.loadModule(P + 'Prod01List.js'),
    R.loadModule(P + 'Prod01View.js'),
  ]).then(function (m) {
    R.register([
      { id: 'prodList', comp: m[0].default },
      { id: 'prodView', comp: m[1].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-ec-pd/pd manifest] 로드 실패:', err);
  });
})();

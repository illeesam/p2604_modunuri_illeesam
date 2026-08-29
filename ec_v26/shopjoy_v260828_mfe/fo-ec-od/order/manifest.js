/* manifest.js — "장바구니/주문" 마이크로 도메인의 유일한 진입점(FO).
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/Cart.js + pages/fo/Order.js 를 그대로
 * 복사해왔다(원본은 전혀 수정하지 않음). BO 쪽 bo-ec-od/order/ 와 같은 취지로
 * "주문" 소그룹 폴더명을 order 로 맞췄다. 화면 파일은 export default(ES 모듈,
 * 2026-08-29 BO와 동일하게 통일). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/order/';

  Promise.all([
    R.loadModule(P + 'Cart.js'),
    R.loadModule(P + 'Order.js'),
  ]).then(function (m) {
    R.register([
      { id: 'cart', comp: m[0].default },
      { id: 'order', comp: m[1].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-ec-od/order manifest] 로드 실패:', err);
  });
})();

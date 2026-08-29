/* manifest.js — "마이페이지" 마이크로 도메인의 유일한 진입점(FO).
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/my/*.js 6개를 그대로 복사해왔다(원본은
 * 전혀 수정하지 않음). 로그인 필요 페이지 6개(주문/클레임/쿠폰/캐쉬/문의/채팅)를
 * 전부 이 폴더 하나가 담당한다 — 실제로도 my/ 서브패키지 하나로 묶여있어 소그룹을
 * 더 쪼갤 이유가 없다(BO 의 "2레벨 도메인"과 비슷한 판단). 각 화면은 공용
 * <fo-my-layout>(fo-ap-global/components/layout/foMyLayout.js, 셸이 항상 로드)으로
 * 감싸져 있고 window.foApp.* (foMfeShell.js 가 노출)에 의존한다. 화면 파일은
 * export default(ES 모듈, 2026-08-29 BO와 동일하게 통일). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/my/';

  Promise.all([
    R.loadModule(P + 'MyOrder.js'),
    R.loadModule(P + 'MyClaim.js'),
    R.loadModule(P + 'MyCoupon.js'),
    R.loadModule(P + 'MyCache.js'),
    R.loadModule(P + 'MyContact.js'),
    R.loadModule(P + 'MyChatt.js'),
  ]).then(function (m) {
    R.register([
      { id: 'myOrder', comp: m[0].default },
      { id: 'myClaim', comp: m[1].default },
      { id: 'myCoupon', comp: m[2].default },
      { id: 'myCache', comp: m[3].default },
      { id: 'myContact', comp: m[4].default },
      { id: 'myChatt', comp: m[5].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-ec-my/my manifest] 로드 실패:', err);
  });
})();

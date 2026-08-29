/* manifest.js — "전시 UI 샘플(dispUi01~06)" 마이크로 도메인의 유일한 진입점(FO).
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/xd/DispUi01~06.js 6개를 그대로 복사해왔다
 * (원본은 전혀 수정하지 않음. DispUiPage.js는 index.html에서도 안 불리는 죽은 코드라
 * 이 데모에도 복제하지 않았다 — 2026-08-29 확인). BO의 bo-zd(개발도구/시뮬레이션)와
 * 같은 취지로, 개발자·QA용 샘플 페이지 도메인(xd+xs)을 fo-zd 레포 하나로 묶고 소그룹
 * 폴더만 xd/xs 로 나눴다. 화면 파일은 export default(ES 모듈, 2026-08-29 BO와 동일하게
 * 통일). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/xd/';

  Promise.all([
    R.loadModule(P + 'DispUi01.js'),
    R.loadModule(P + 'DispUi02.js'),
    R.loadModule(P + 'DispUi03.js'),
    R.loadModule(P + 'DispUi04.js'),
    R.loadModule(P + 'DispUi05.js'),
    R.loadModule(P + 'DispUi06.js'),
  ]).then(function (m) {
    R.register([
      { id: 'dispUi01', comp: m[0].default },
      { id: 'dispUi02', comp: m[1].default },
      { id: 'dispUi03', comp: m[2].default },
      { id: 'dispUi04', comp: m[3].default },
      { id: 'dispUi05', comp: m[4].default },
      { id: 'dispUi06', comp: m[5].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-zd/xd manifest] 로드 실패:', err);
  });
})();

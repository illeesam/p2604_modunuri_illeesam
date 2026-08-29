/* manifest.js — "샘플/개발도구(sample01~23, XsStore, XsLocalStorage)" 마이크로 도메인의
 * 유일한 진입점(FO). shopjoy_v260406(실제 프로덕션)의 pages/fo/xs/*.js 를 그대로
 * 복사해왔다(원본은 전혀 수정하지 않음). 08/09/10 은 index.html 에서도 주석 처리돼
 * 있어(미완성/폐기) 이 데모에도 복제하지 않았다. 화면 파일은 export default(ES 모듈,
 * 2026-08-29 BO와 동일하게 통일). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/xs/';

  Promise.all([
    R.loadModule(P + 'Sample01.js'),
    R.loadModule(P + 'Sample02.js'),
    R.loadModule(P + 'Sample03.js'),
    R.loadModule(P + 'Sample04.js'),
    R.loadModule(P + 'Sample05.js'),
    R.loadModule(P + 'Sample06.js'),
    R.loadModule(P + 'Sample07.js'),
    R.loadModule(P + 'Sample11.js'),
    R.loadModule(P + 'Sample12.js'),
    R.loadModule(P + 'Sample13.js'),
    R.loadModule(P + 'Sample14.js'),
    R.loadModule(P + 'Sample21.js'),
    R.loadModule(P + 'Sample22.js'),
    R.loadModule(P + 'Sample23.js'),
    R.loadModule(P + 'XsStore.js'),
    R.loadModule(P + 'XsLocalStorage.js'),
  ]).then(function (m) {
    R.register([
      { id: 'sample01', comp: m[0].default },
      { id: 'sample02', comp: m[1].default },
      { id: 'sample03', comp: m[2].default },
      { id: 'sample04', comp: m[3].default },
      { id: 'sample05', comp: m[4].default },
      { id: 'sample06', comp: m[5].default },
      { id: 'sample07', comp: m[6].default },
      { id: 'sample11', comp: m[7].default },
      { id: 'sample12', comp: m[8].default },
      { id: 'sample13', comp: m[9].default },
      { id: 'sample14', comp: m[10].default },
      { id: 'sample21', comp: m[11].default },
      { id: 'sample22', comp: m[12].default },
      { id: 'sample23', comp: m[13].default },
      { id: 'xsStore', comp: m[14].default },
      { id: 'xsLocalStorage', comp: m[15].default },
    ]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-zd/xs manifest] 로드 실패:', err);
  });
})();

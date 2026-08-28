/* manifest.js — "상품관리 > 카테고리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. bo-pd-pd(상품) 와 같은 대메뉴(pd) 아래
 * 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28). PdCategoryMng/
 * PdCategoryProdMng 은 둘 다 자체 완결형(별도 Dtl 컴포넌트 불필요)이라
 * registerComponents 는 필요 없다.
 *
 * ES 모듈 전면 전환(2026-08-29) — bo-ab-home/manifest.js 주석 참조. window.ComponentName
 * 대신 export default + R.loadModule(). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/pd/cate/PdCategoryMng.js'),
    R.loadModule(base + 'pages/bo/pd/cate/PdCategoryProdMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'bo-pd-cate-pdCategoryMng', label: '카테고리관리', group: '카테고리', comp: results[0].default },
      { id: 'bo-pd-cate-pdCategoryProdMng', label: '카테고리상품관리', group: '카테고리', comp: results[1].default },
    ];
    R.register('bo-pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-pd-cate manifest] 로드 실패:', err);
  });
})();

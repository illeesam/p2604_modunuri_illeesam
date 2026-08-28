/* manifest.js — "상품관리 > 카테고리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. bo-pd-pd(상품) 와 같은 대메뉴(pd) 아래
 * 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28). PdCategoryMng/
 * PdCategoryProdMng 은 둘 다 자체 완결형(별도 Dtl 컴포넌트 불필요)이라
 * registerComponents 는 필요 없다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/bo/pd/cate/PdCategoryMng.js'),
    R.loadScript(base + 'pages/bo/pd/cate/PdCategoryProdMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'bo-pd-cate-pdCategoryMng', label: '카테고리관리', group: '카테고리', comp: window.BoPdCatePdCategoryMng },
      { id: 'bo-pd-cate-pdCategoryProdMng', label: '카테고리상품관리', group: '카테고리', comp: window.BoPdCatePdCategoryProdMng },
    ];
    R.register('bo-pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-pd-cate manifest] 로드 실패:', err);
  });
})();

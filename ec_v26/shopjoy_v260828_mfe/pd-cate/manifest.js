/* manifest.js — "상품관리 > 카테고리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * pd-pd(상품) 와 같은 대메뉴(pd) 아래 다른 소그룹(group)으로 기여하는 별도 레포다
 * (2026-08-28). PdCategoryMng/PdCategoryProdMng 은 둘 다 자체 완결형(별도 Dtl 컴포넌트
 * 불필요)이라 registerComponents 는 필요 없다. */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/PdCategoryMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/PdCategoryProdMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("pd", [' +
      '{ id: "pdCategoryMng", label: "카테고리관리", group: "카테고리", comp: window.PdCategoryMng },' +
      '{ id: "pdCategoryProdMng", label: "카테고리상품관리", group: "카테고리", comp: window.PdCategoryProdMng }' +
      ']);' +
      '<\/script>'
  );
})();

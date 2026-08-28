/* manifest.js — "상품관리 > 상품" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * 같은 대메뉴(pd)에 pd-cate(카테고리) 도 별도 레포로 기여한다(2026-08-28). */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/PdTagMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/PdRestockNotiMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("pd", [' +
      '{ id: "pdTagMng", label: "상품태그관리", group: "상품", comp: window.PdTagMng },' +
      '{ id: "pdRestockNotiMng", label: "재입고알림관리", group: "상품", comp: window.PdRestockNotiMng }' +
      ']);' +
      '<\/script>'
  );
})();

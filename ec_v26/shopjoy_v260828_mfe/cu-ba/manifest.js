/* manifest.js — "고객센터 > 고객" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * 같은 대메뉴(cu)에 cu-co(공통업무) 도 별도 레포로 기여한다(2026-08-28).
 * CmNoticeDtl/CmFaqDtl 은 각각 CmNoticeMng/CmFaqMng 템플릿 안에서 <cm-notice-dtl>/<cm-faq-dtl>
 * 로 쓰이는 내부 컴포넌트라 메뉴에는 안 올리고 registerComponents 로만 등록한다. */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/CmNoticeDtl.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmNoticeMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmFaqDtl.js"><\/script>');
  document.write('<script src="' + base + 'pages/CmFaqMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("cu", [' +
      '{ id: "cmNoticeMng", label: "공지사항관리", group: "고객", comp: window.CmNoticeMng },' +
      '{ id: "cmFaqMng", label: "FAQ관리", group: "고객", comp: window.CmFaqMng }' +
      ']);' +
      'window.MFE_REGISTRY.registerComponents([' +
      '{ tag: "CmNoticeDtl", comp: window.CmNoticeDtl },' +
      '{ tag: "CmFaqDtl", comp: window.CmFaqDtl }' +
      ']);' +
      '<\/script>'
  );
})();

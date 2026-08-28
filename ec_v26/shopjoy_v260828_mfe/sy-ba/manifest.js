/* manifest.js — "시스템 > 기준정보" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * 같은 대메뉴(sy)에 sy-org(조직) 도 별도 레포로 기여한다 — 대메뉴 하나를 여러 마이크로
 * 레포가 소그룹(group)으로 나눠 채우는 예시(2026-08-28). */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/SyBrandMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/SyCodeMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("sy", [' +
      '{ id: "syBrandMng", label: "브랜드관리", group: "기준정보", comp: window.SyBrandMng },' +
      '{ id: "syCodeMng", label: "공통코드관리", group: "기준정보", comp: window.SyCodeMng }' +
      ']);' +
      '<\/script>'
  );
})();

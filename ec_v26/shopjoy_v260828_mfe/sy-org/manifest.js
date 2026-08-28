/* manifest.js — "시스템 > 조직" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식은 ab-home/manifest.js 주석 참조.
 * sy-ba(기준정보) 와 같은 대메뉴(sy) 아래 다른 소그룹(group)으로 기여하는 별도 레포다
 * (2026-08-28). SyUserDtl 은 SyUserMng 템플릿 안에서 <sy-user-dtl> 로 쓰이는 내부
 * 컴포넌트라 메뉴에는 안 올리고 registerComponents 로만 등록한다. */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/SyUserDtl.js"><\/script>');
  document.write('<script src="' + base + 'pages/SyUserMng.js"><\/script>');
  document.write('<script src="' + base + 'pages/SyDeptMng.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("sy", [' +
      '{ id: "syUserMng", label: "사용자관리", group: "조직", comp: window.SyUserMng },' +
      '{ id: "syDeptMng", label: "부서관리", group: "조직", comp: window.SyDeptMng }' +
      ']);' +
      'window.MFE_REGISTRY.registerComponents([' +
      '{ tag: "SyUserDtl", comp: window.SyUserDtl }' +
      ']);' +
      '<\/script>'
  );
})();

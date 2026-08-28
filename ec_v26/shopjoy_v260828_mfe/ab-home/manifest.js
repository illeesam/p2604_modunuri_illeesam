/* manifest.js — "홈" 마이크로 도메인의 유일한 진입점.
 *
 * 이 파일 하나가 도메인의 전부다: 셸(mfe.html)은 이 파일 경로만 알면 되고,
 * 그 안에 화면이 몇 개 있는지, 파일명이 뭔지는 전혀 몰라도 된다. 이 폴더 자체가
 * 별도 git 레포(shopjoy-mfe-domain-home)다 — 셸 폴더 밖의 형제(sibling) 폴더로 존재한다.
 *
 * document.currentScript.src 로 "나 자신이 어디서 로드됐는지"를 알아내 그 기준으로
 * 자기 화면 스크립트 경로를 만든다 — 그래서 셸이 이 폴더를 형제 폴더로 참조하든,
 * 완전히 다른 CDN 오리진에서 절대 URL로 참조하든 항상 정확히 자기 pages/를 찾는다
 * (셸의 물리적 위치를 이 파일이 전혀 몰라도 되는 게 핵심).
 *
 * 동작: 자기 화면 스크립트를 document.write 로 동기 로드한 뒤(파싱 순서 보장 —
 * shopjoy_v260406 의 FO_SITE_NO 동적 스크립트 로딩과 동일한 기법), 로드가 끝난
 * 시점에 window.MFE_REGISTRY 에 "이 메뉴에 이 화면들이 있다"고 스스로 등록한다.
 */
(function () {
  var base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  document.write('<script src="' + base + 'pages/DashboardBoEc01.js"><\/script>');
  document.write('<script src="' + base + 'pages/DashboardBoEc02.js"><\/script>');
  document.write(
    '<script>' +
      'window.MFE_REGISTRY.register("home", [' +
      '{ id: "dashboardBoEc01", label: "EC 대시보드 1", comp: window.DashboardBoEc01 },' +
      '{ id: "dashboardBoEc02", label: "EC 대시보드 2", comp: window.DashboardBoEc02 }' +
      ']);' +
      '<\/script>'
  );
})();

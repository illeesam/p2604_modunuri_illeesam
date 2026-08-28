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
 * 지연로드(2026-08-28) — 예전엔 document.write 로 동기 로드했는데, 그건 "초기 페이지
 * 파싱 중"에만 되는 방식이라 사용자가 나중에 클릭할 때 동적으로 불러오는 지연로드와는
 * 안 맞는다(파싱이 끝난 뒤 document.write 를 부르면 페이지 전체가 지워짐). 그래서
 * window.MFE_REGISTRY.loadScript() 로 <script> 태그를 동적 생성해 병렬로 불러오고,
 * 다 끝나면 register() 후 _domainReady() 로 "이 폴더 로드 완료"를 알린다 — 이 신호를
 * 셸의 ensureFolderLoaded()/ensureMenuLoaded() 가 기다린다. 이 패턴 덕분에 이 파일은
 * 정적 <script src="manifest.js"> 로 즉시 불러도(dev.html), 나중에 클릭 시점에
 * 동적으로 불러도(mfe.html 지연로드) 똑같이 동작한다 — 도메인 코드는 자기가 어느
 * 모드로 불렸는지 전혀 몰라도 된다.
 */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/DashboardBoEc01.js'),
    R.loadScript(base + 'pages/DashboardBoEc02.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'dashboardBoEc01', label: 'EC 대시보드 1', comp: window.DashboardBoEc01 },
      { id: 'dashboardBoEc02', label: 'EC 대시보드 2', comp: window.DashboardBoEc02 },
    ];
    R.register('home', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-aa-home manifest] 로드 실패:', err);
  });
})();

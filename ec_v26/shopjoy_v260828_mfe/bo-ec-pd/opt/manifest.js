/* manifest.js — "상품관리 > 상품옵션관리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pd/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 *
 * ⚠ 이 도메인만 특수 구조 — pdOptCodeMng 메뉴 화면(PdOptCodeMngPage.js, ES 모듈)이
 * 실제 옵션코드 트리 UI를 그리지 않고 <iframe src="bo-pd-opt-code-mng.html">로 완전히
 * 독립된 별도 HTML(원본 shopjoy_v260406/bo-pd-opt-code-mng.html 그대로 복제, 지금은
 * 이 폴더 안에 위치)을 불러온다. 그 안의 PdOptCodeMng.js 는 원본과 동일하게 classic
 * <script>+window 전역 그대로 두었다(mfeRegistry/manifest.js 를 아예 안 거치는
 * 완전 독립 팝업이라 ESM 전환 대상이 아님).
 * iframe의 상대경로(bo-pd-opt-code-mng.html)는 "이 컴포넌트를 표시 중인 문서"
 * 기준으로 풀리므로, bo-ap-global/mfe.html 지연로드 경로로 열었을 때는 정확히
 * 안 맞을 수 있다는 원본 프로젝트 이전부터의 알려진 한계를 그대로 승계한다 —
 * 이 폴더 자체의 dev.html(단독 실행, 같은 디렉터리 기준)에서는 정상 동작한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/pd/opt/PdOptCodeMngPage.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pd-opt-pdOptCodeMng', label: '상품옵션관리', group: '상품옵션관리', comp: results[0].default },
    ];
    R.register('bo-ec-pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pd/opt manifest] 로드 실패:', err);
  });
})();

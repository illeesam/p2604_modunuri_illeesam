/* manifest.js — "정산 > 수집원장" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-ec-st) 에 bo-ec-st/base
 * (기준정보)/bo-ec-st/adj(정산작업)/bo-ec-st/status(정산현황)/bo-ec-st/recon(대사관리)/
 * bo-ec-st/erp(ERP 연동)도 별도 지연로드 단위로 기여한다(형상관리 단위인 git 레포는 bo-ec-st/ 전체 하나 —
 * bo-ec-mb/member/manifest.js 주석 참고).
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/st/ 를 그대로 복사해왔다(2026-08-29,
 * 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조(LEFT_MENUS.settle)의 '수집원장'
 * 그룹(화면 1개, stRawMng)만 이 폴더가 담당한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/st/raw/StRawMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'st-raw-stRawMng', label: '정산수집원장', group: '수집원장', comp: results[0].default },
    ];
    R.register('bo-ec-st', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-st/raw manifest] 로드 실패:', err);
  });
})();

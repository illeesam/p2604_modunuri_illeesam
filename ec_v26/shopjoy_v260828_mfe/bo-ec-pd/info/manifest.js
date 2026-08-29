/* manifest.js — "상품관리 > 상품정보관리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pd/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/pd/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/pd/info/';

  const scripts = [
    R.loadModule(P + 'PdReviewMng.js'),
    R.loadModule(P + 'PdQnaMng.js'),
    R.loadModule(P + 'PdRestockNotiMng.js'),
    R.loadModule(P + 'PdTagMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pd-info-pdReviewMng', label: '상품리뷰관리', group: '상품정보관리', comp: results[0].default },
      { id: 'pd-info-pdQnaMng', label: '상품Q&A관리', group: '상품정보관리', comp: results[1].default },
      { id: 'pd-info-pdRestockNotiMng', label: '재입고알림', group: '상품정보관리', comp: results[2].default },
      { id: 'pd-info-pdTagMng', label: '태그관리', group: '상품정보관리', comp: results[3].default },
    ];
    R.register('bo-ec-pd', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pd/info manifest] 로드 실패:', err);
  });
})();

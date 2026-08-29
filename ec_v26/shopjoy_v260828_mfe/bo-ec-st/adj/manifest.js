/* manifest.js — "정산 > 정산작업" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-ec-st) 에 bo-ec-st/base
 * (기준정보)/bo-ec-st/raw(수집원장)/bo-ec-st/status(정산현황)/bo-ec-st/recon(대사관리)/
 * bo-ec-st/erp(ERP 연동)도 별도 지연로드 단위로 기여한다(형상관리 단위인 git 레포는 bo-ec-st/ 전체 하나 —
 * bo-ec-mb/member/manifest.js 주석 참고).
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/st/ 를 그대로 복사해왔다(2026-08-29,
 * 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조(LEFT_MENUS.settle)의 '정산작업'
 * 그룹(정산조정/정산기타조정/정산마감/정산지급관리)만 이 폴더가 담당한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/st/adj/';

  const scripts = [
    R.loadModule(P + 'StSettleAdjMng.js'),
    R.loadModule(P + 'StSettleEtcAdjMng.js'),
    R.loadModule(P + 'StSettleCloseMng.js'),
    R.loadModule(P + 'StSettlePayMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'st-adj-stSettleAdjMng', label: '정산조정', group: '정산작업', comp: results[0].default },
      { id: 'st-adj-stSettleEtcAdjMng', label: '정산기타조정', group: '정산작업', comp: results[1].default },
      { id: 'st-adj-stSettleCloseMng', label: '정산마감', group: '정산작업', comp: results[2].default },
      { id: 'st-adj-stSettlePayMng', label: '정산지급관리', group: '정산작업', comp: results[3].default },
    ];
    R.register('bo-ec-st', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-st/adj manifest] 로드 실패:', err);
  });
})();

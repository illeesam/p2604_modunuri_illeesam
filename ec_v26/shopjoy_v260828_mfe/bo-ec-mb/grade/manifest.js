/* manifest.js — "회원관리 > 등급·그룹" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-mb/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나(=이 하위 폴더)다 — bo-ec-mb/member/
 * manifest.js 주석 참고. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/mb/grade/';

  const scripts = [
    R.loadModule(P + 'MbMemGradeMng.js'),
    R.loadModule(P + 'MbMemGroupMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'mb-grade-mbMemGradeMng', label: '회원등급관리', group: '등급·그룹', comp: results[0].default },
      { id: 'mb-grade-mbMemGroupMng', label: '회원그룹관리', group: '등급·그룹', comp: results[1].default },
    ];
    R.register('bo-ec-mb', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-mb/grade manifest] 로드 실패:', err);
  });
})();

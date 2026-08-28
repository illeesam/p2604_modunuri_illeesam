/* manifest.js — "시스템 > 기준정보" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 ab-home/manifest.js 주석 참조. 같은 대메뉴(sy)에 sy-org(조직) 도
 * 별도 레포로 기여한다 — 대메뉴 하나를 여러 마이크로 레포가 소그룹(group)으로
 * 나눠 채우는 예시(2026-08-28). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/SyBrandMng.js'),
    R.loadScript(base + 'pages/SyCodeMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'syBrandMng', label: '브랜드관리', group: '기준정보', comp: window.SyBrandMng },
      { id: 'syCodeMng', label: '공통코드관리', group: '기준정보', comp: window.SyCodeMng },
    ];
    R.register('sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[sy-ba manifest] 로드 실패:', err);
  });
})();

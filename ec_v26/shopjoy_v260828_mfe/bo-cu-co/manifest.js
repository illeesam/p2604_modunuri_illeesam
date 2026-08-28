/* manifest.js — "고객센터 > 공통업무" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-aa-home/manifest.js 주석 참조. bo-cu-ba(고객) 와 같은 대메뉴(cu) 아래
 * 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28) — 요청대로 bo-cu-ba 와 같은
 * 화면(공지사항관리/FAQ관리)을 이 레포도 독립적으로 갖고 있다(각자 다른 물리 파일로
 * 복사돼 있음 — 같은 소스, 다른 레포). id 는 bo-cu-ba 쪽과 겹치지 않게 접미어(_co)를
 * 붙였다 — 두 레포가 같은 화면을 각자 등록해도 사이드바/탭에서 :key 충돌이 안 나게
 * 하려는 것뿐, 내용은 완전히 동일하다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/CmNoticeDtl.js'),
    R.loadScript(base + 'pages/CmNoticeMng.js'),
    R.loadScript(base + 'pages/CmFaqDtl.js'),
    R.loadScript(base + 'pages/CmFaqMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'cmNoticeMng_co', label: '공지사항관리', group: '공통업무', comp: window.CmNoticeMng },
      { id: 'cmFaqMng_co', label: 'FAQ관리', group: '공통업무', comp: window.CmFaqMng },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: window.CmNoticeDtl },
      { tag: 'CmFaqDtl', comp: window.CmFaqDtl },
    ];
    R.register('cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-cu-co manifest] 로드 실패:', err);
  });
})();

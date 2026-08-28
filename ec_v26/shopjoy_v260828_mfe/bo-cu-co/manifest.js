/* manifest.js — "고객센터 > 공통업무" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. bo-cu-ba(고객) 와 같은 대메뉴(cu) 아래
 * 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28) — 요청대로 bo-cu-ba 와 같은
 * 화면(공지사항관리/FAQ관리)을 이 레포도 독립적으로 갖고 있다(각자 다른 물리 파일로
 * 복사돼 있음 — 같은 소스, 다른 레포). id 는 bo-cu-ba 쪽과 겹치지 않게 접미어(_co)를
 * 붙였다 — 두 레포가 같은 화면을 각자 등록해도 사이드바/탭에서 :key 충돌이 안 나게
 * 하려는 것뿐, 내용은 완전히 동일하다.
 *
 * ES 모듈 전면 전환(2026-08-29) — bo-ab-home/manifest.js 주석 참조. window.ComponentName
 * 대신 export default + R.loadModule() — bo-cu-ba 와 물리적으로 중복 존재하는 이
 * 화면들이 이제 window 전역을 전혀 안 거치므로, 로드 순서가 어떻게 겹쳐도 서로
 * 충돌할 수 없다. registerComponents 의 tag(`'CmNoticeDtl'`, `'CmFaqDtl'`)는 그대로라
 * CmNoticeMng.js 템플릿의 `<cm-notice-dtl>` 은 수정 불필요. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/cu/co/CmNoticeDtl.js'),
    R.loadModule(base + 'pages/bo/cu/co/CmNoticeMng.js'),
    R.loadModule(base + 'pages/bo/cu/co/CmFaqDtl.js'),
    R.loadModule(base + 'pages/bo/cu/co/CmFaqMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'bo-cu-co-cmNoticeMng', label: '공지사항관리', group: '공통업무', comp: results[1].default },
      { id: 'bo-cu-co-cmFaqMng', label: 'FAQ관리', group: '공통업무', comp: results[3].default },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: results[0].default },
      { tag: 'CmFaqDtl', comp: results[2].default },
    ];
    R.register('bo-cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-cu-co manifest] 로드 실패:', err);
  });
})();

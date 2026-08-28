/* manifest.js — "고객센터 > 공통업무" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. bo-cu-ba(고객) 와 같은 대메뉴(cu) 아래
 * 다른 소그룹(group)으로 기여하는 별도 레포다(2026-08-28) — 요청대로 bo-cu-ba 와 같은
 * 화면(공지사항관리/FAQ관리)을 이 레포도 독립적으로 갖고 있다(각자 다른 물리 파일로
 * 복사돼 있음 — 같은 소스, 다른 레포). id 는 bo-cu-ba 쪽과 겹치지 않게 접미어(_co)를
 * 붙였다 — 두 레포가 같은 화면을 각자 등록해도 사이드바/탭에서 :key 충돌이 안 나게
 * 하려는 것뿐, 내용은 완전히 동일하다.
 *
 * pages/bo/cu/co/CmNoticeDtl.js — bo-cu-ba/pages/bo/cu/ba/CmNoticeDtl.js 를 처음엔 그대로
 * 복사(동일 window 전역명)해서 도메인 간 이름 충돌을 재현했었는데(2026-08-28), 실제로
 * bo-sy-ba 의 동일 실험 파일과 app.component() 이름이 부딪히는 걸 확인한 뒤(2026-08-29)
 * `window.BoCuCoCmNoticeDtl`로 전역명을 분리하고 `pages/bo/cu/co/` 밑으로 옮겼다(장차
 * 통합 시스템으로 합칠 때를 대비해 도메인 경로를 파일 경로에 미리 새겨둠). registerComponents
 * 의 tag 는 여전히 'CmNoticeDtl' 그대로라 CmNoticeMng.js 템플릿의 `<cm-notice-dtl>`은
 * 수정 불필요. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/bo/cu/co/CmNoticeDtl.js'),
    R.loadScript(base + 'pages/bo/cu/co/CmNoticeMng.js'),
    R.loadScript(base + 'pages/bo/cu/co/CmFaqDtl.js'),
    R.loadScript(base + 'pages/bo/cu/co/CmFaqMng.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'bo-cu-co-cmNoticeMng', label: '공지사항관리', group: '공통업무', comp: window.BoCuCoCmNoticeMng },
      { id: 'bo-cu-co-cmFaqMng', label: 'FAQ관리', group: '공통업무', comp: window.BoCuCoCmFaqMng },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: window.BoCuCoCmNoticeDtl },
      { tag: 'CmFaqDtl', comp: window.BoCuCoCmFaqDtl },
    ];
    R.register('bo-cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-cu-co manifest] 로드 실패:', err);
  });
})();

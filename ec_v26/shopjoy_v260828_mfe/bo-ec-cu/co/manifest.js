/* manifest.js — "고객센터 > 공통업무" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-ec-cu) 에 bo-ec-cu/ba
 * (고객+고객센터)도 별도 지연로드 단위로 기여한다.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-cu/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 *
 * 크로스도메인 흡수(SyPostman→bo-zd/devtools 와 동일 방식):
 *   - SyBbmMng/SyBbmDtl(게시판관리), SyBbsMng/SyBbsDtl(게시글관리),
 *     SyExceldownMng/SyExceldownDtl(엑셀다운로드) — 원본 소스 pages/bo/sy/(sy 패키지)
 * CmNoticeMng/CmFaqMng/CmBlogMng 은 원본 소스 pages/bo/ec/cm/(cm 패키지) 그대로.
 * 전부 shopjoy_v260406(실제 프로덕션)에서 그대로 복사(원본은 전혀 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/cu/co/';

  const scripts = [
    R.loadModule(P + 'CmNoticeMng.js'),
    R.loadModule(P + 'CmFaqMng.js'),
    R.loadModule(P + 'CmBlogMng.js'),
    R.loadModule(P + 'SyBbmMng.js'),
    R.loadModule(P + 'SyBbsMng.js'),
    R.loadModule(P + 'SyExceldownMng.js'),
    R.loadModule(P + 'CmNoticeDtl.js'),
    R.loadModule(P + 'CmFaqDtl.js'),
    R.loadModule(P + 'SyBbmDtl.js'),
    R.loadModule(P + 'SyBbsDtl.js'),
    R.loadModule(P + 'SyExceldownDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'cu-co-cmNoticeMng', label: '공지사항관리', group: '공통업무', comp: results[0].default },
      { id: 'cu-co-cmFaqMng', label: 'FAQ관리', group: '공통업무', comp: results[1].default },
      { id: 'cu-co-cmBlogMng', label: '뉴스&블로그 관리', group: '공통업무', comp: results[2].default },
      { id: 'cu-co-syBbmMng', label: '게시판관리', group: '공통업무', comp: results[3].default },
      { id: 'cu-co-syBbsMng', label: '게시글관리', group: '공통업무', comp: results[4].default },
      { id: 'cu-co-syExceldownMng', label: '엑셀다운로드', group: '공통업무', comp: results[5].default },
    ];
    const innerComps = [
      { tag: 'CmNoticeDtl', comp: results[6].default },
      { tag: 'CmFaqDtl', comp: results[7].default },
      { tag: 'SyBbmDtl', comp: results[8].default },
      { tag: 'SyBbsDtl', comp: results[9].default },
      { tag: 'SyExceldownDtl', comp: results[10].default },
    ];
    R.register('bo-ec-cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-cu/co manifest] 로드 실패:', err);
  });
})();

/* manifest.js — "시스템 > 시스템" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-sy) 에 bo-sy/ba
 * (기준정보)/bo-sy/org(조직)/bo-sy/common(공통기능)/bo-sy/vendor(업체)/bo-sy/menu(메뉴)/
 * bo-sy/hist(이력조회)도 별도 레포로 기여한다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/sy/ 를 그대로 복사해왔다(2026-08-29,
 * 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조(LEFT_MENUS.system)의 '시스템'
 * 그룹(첨부파일통합조회/템플릿관리/배치스케줄관리/알림관리/프로퍼티관리/표시경로/
 * 다국어관리 7개)만 이 폴더가 담당한다. SyAttachDtl/SyTemplateDtl/SyBatchDtl/
 * SyBatchHist/SyAlarmDtl 은 각각 대응 Mng 템플릿 안에서 embed되는 내부 컴포넌트라
 * registerComponents 로만 등록한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/sy/sys/';

  const scripts = [
    R.loadModule(P + 'SyAttachMng.js'),
    R.loadModule(P + 'SyTemplateMng.js'),
    R.loadModule(P + 'SyBatchMng.js'),
    R.loadModule(P + 'SyAlarmMng.js'),
    R.loadModule(P + 'SyPropMng.js'),
    R.loadModule(P + 'SyPathMng.js'),
    R.loadModule(P + 'SyI18nMng.js'),
    R.loadModule(P + 'SyAttachDtl.js'),
    R.loadModule(P + 'SyTemplateDtl.js'),
    R.loadModule(P + 'SyBatchDtl.js'),
    R.loadModule(P + 'SyBatchHist.js'),
    R.loadModule(P + 'SyAlarmDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'sy-sys-syAttachMng', label: '첨부파일 통합조회', group: '시스템', comp: results[0].default },
      { id: 'sy-sys-syTemplateMng', label: '템플릿관리', group: '시스템', comp: results[1].default },
      { id: 'sy-sys-syBatchMng', label: '배치스케즐관리', group: '시스템', comp: results[2].default },
      { id: 'sy-sys-syAlarmMng', label: '알림관리', group: '시스템', comp: results[3].default },
      { id: 'sy-sys-syPropMng', label: '프로퍼티관리', group: '시스템', comp: results[4].default },
      { id: 'sy-sys-syPathMng', label: '표시경로', group: '시스템', comp: results[5].default },
      { id: 'sy-sys-syI18nMng', label: '다국어관리', group: '시스템', comp: results[6].default },
    ];
    const innerComps = [
      { tag: 'SyAttachDtl', comp: results[7].default },
      { tag: 'SyTemplateDtl', comp: results[8].default },
      { tag: 'SyBatchDtl', comp: results[9].default },
      { tag: 'SyBatchHist', comp: results[10].default },
      { tag: 'SyAlarmDtl', comp: results[11].default },
    ];
    R.register('bo-sy', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy/sys manifest] 로드 실패:', err);
  });
})();

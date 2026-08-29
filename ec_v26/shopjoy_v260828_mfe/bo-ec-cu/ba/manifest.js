/* manifest.js — "고객센터 > 고객+고객센터" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-ec-cu) 에 bo-ec-cu/co
 * (공통업무)도 별도 지연로드 단위로 기여한다.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-cu/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 * (이전엔 "여러 레포가 같은 화면을 각자 등록해도 안 깨지는지" 확인용 의도적 중복
 * 데모였다가, 실제 좌측 메뉴의 '고객'/'고객센터' 그룹 내용으로 교체된 이력이 있다.)
 *
 * 크로스도메인 흡수(단일/소수 화면짜리는 관련 대메뉴 폴더 하나에 접어 넣는 게 이
 * 프로젝트의 일관된 처리 방식 — SyPostman→bo-zd/devtools 와 동일):
 *   - MbCustInfoMng(고객종합정보) — 원본 소스 pages/bo/ec/mb/(mb 패키지)
 *   - SyContactMng/SyContactDtl(문의관리) — 원본 소스 pages/bo/sy/(sy 패키지)
 * CmChattMng/CmChattKanban/CmChattDtl 은 원본 소스 pages/bo/ec/cm/(cm 패키지) 그대로.
 * 셋 다 shopjoy_v260406(실제 프로덕션)에서 그대로 복사(원본은 전혀 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/cu/ba/';

  const scripts = [
    R.loadModule(P + 'MbCustInfoMng.js'),
    R.loadModule(P + 'SyContactMng.js'),
    R.loadModule(P + 'CmChattMng.js'),
    R.loadModule(P + 'CmChattKanban.js'),
    R.loadModule(P + 'SyContactDtl.js'),
    R.loadModule(P + 'CmChattDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'cu-ba-mbCustInfoMng', label: '고객종합정보', group: '고객', comp: results[0].default },
      { id: 'cu-ba-syContactMng', label: '문의관리', group: '고객센터', comp: results[1].default },
      { id: 'cu-ba-cmChattMng', label: '채팅관리', group: '고객센터', comp: results[2].default },
      { id: 'cu-ba-cmChattKanban', label: '채팅칸반보드', group: '고객센터', comp: results[3].default },
    ];
    const innerComps = [
      { tag: 'SyContactDtl', comp: results[4].default },
      { tag: 'CmChattDtl', comp: results[5].default },
    ];
    R.register('bo-ec-cu', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-cu/ba manifest] 로드 실패:', err);
  });
})();

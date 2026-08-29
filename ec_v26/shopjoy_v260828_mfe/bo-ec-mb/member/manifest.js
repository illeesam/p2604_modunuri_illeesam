/* manifest.js — "회원관리 > 회원" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-mb/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나(=이 하위 폴더)다. registerCatalog()의
 * folder 인자는 레포 루트가 아니라 그냥 URL 경로 문자열이라, 레포 안의 하위
 * 디렉터리를 가리켜도 동일하게 동작한다 — 이 파일도 document.currentScript.src
 * 로 자기 위치(.../bo-ec-mb/member/)를 그대로 알아낸다. 회원관리 대메뉴 안의
 * '등급·그룹' 소그룹은 형제 폴더 bo-ec-mb/grade/manifest.js 가 별도로 담당하며,
 * 그쪽을 클릭하기 전까지는 이 폴더의 화면만(=이 소그룹만) 로드된다 — git 레포
 * 하나로 합쳐도 소그룹 단위 지연로드 입자성은 그대로 유지된다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/mb/ 일부를 그대로 복사(원본은
 * 전혀 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/mb/member/';

  const scripts = [
    R.loadModule(P + 'MbMemberMng.js'),
    R.loadModule(P + 'MbMemberDtl.js'),
    R.loadModule(P + 'MbMemberHist.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'mb-member-mbMemberMng', label: '회원관리', group: '회원', comp: results[0].default },
    ];
    const innerComps = [
      { tag: 'MbMemberDtl', comp: results[1].default },
      { tag: 'MbMemberHist', comp: results[2].default },
    ];
    R.register('bo-ec-mb', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-mb/member manifest] 로드 실패:', err);
  });
})();

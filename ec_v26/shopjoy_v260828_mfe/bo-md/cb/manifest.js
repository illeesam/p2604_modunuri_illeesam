/* manifest.js — "모듈 > 코바늘" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-module) 의
 * 다른 소그룹 "소스젠"은 이 파일의 형제인 `bo-md/sg/manifest.js`가 담당한다
 * (지연로드 단위는 분리 유지, 형상관리 단위는 `bo-md/` 하나로 통합 — 아래 참고).
 *
 * 2026-08-29 분리: 원래 이 대메뉴는 소그룹이 작고 계속 늘어나는 성격이라 폴더
 * 하나(bo-md-module)가 코바늘/소스젠을 한꺼번에 담당했었다. 이후 회원관리 등
 * 다른 도메인과 일관성을 맞추려고 소그룹 하나 = 폴더 하나인 표준 3레벨 정책으로
 * 다시 분리했다(각각 별도 레포 `bo-md-cb`/`bo-md-sg`) — 코바늘 3화면만으로도
 * 독립 레포 단위가 되기에 충분히 작다고 판단.
 *
 * 2026-08-29(같은 날 후속 재구조화): "형상관리 단위(git 레포)"와 "지연로드
 * 단위"를 분리하는 다른 도메인들(bo-ec-mb 등)과 일관되게, `bo-md-cb`/`bo-md-sg`
 * 두 레포를 다시 `bo-md/` 레포 하나로 합쳤다 — 이 manifest.js는 물리적으로
 * `bo-md/cb/manifest.js`로 한 단계 더 들어왔을 뿐, 지연로드 단위(소그룹별
 * 별도 manifest.js)는 그대로 유지된다(사용자 지시).
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/md/cb/ 를 그대로 복사해왔다(원본은
 * 전혀 수정하지 않음). 실제 좌측 메뉴 구조(LEFT_MENUS.module)의 '코바늘' 그룹만
 * 이 폴더가 담당한다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/md/cb/';

  const scripts = [
    R.loadModule(P + 'MdCbPatternMng.js'),
    R.loadModule(P + 'MdCbSymbolMng.js'),
    R.loadModule(P + 'MdCbYarnMng.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'md-cb-mdCbPatternMng', label: '도안관리', group: '코바늘', comp: results[0].default },
      { id: 'md-cb-mdCbSymbolMng', label: '기호관리', group: '코바늘', comp: results[1].default },
      { id: 'md-cb-mdCbYarnMng', label: '실관리', group: '코바늘', comp: results[2].default },
    ];
    R.register('bo-module', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-md/cb manifest] 로드 실패:', err);
  });
})();

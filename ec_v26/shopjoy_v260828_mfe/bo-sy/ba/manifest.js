/* manifest.js — "시스템 > 기준정보" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조. 같은 대메뉴(bo-sy) 에 bo-sy/org
 * (조직)/bo-sy/common(공통기능)/bo-sy/vendor(업체)/bo-sy/sys(시스템)/bo-sy/menu(메뉴)/
 * bo-sy/hist(이력조회)도 별도 레포로 기여한다.
 *
 * 2026-08-29 전면 갱신: 이 폴더는 원래 SyBrandMng/SyCodeMng 2개 + "파일명 중복
 * 시나리오 점검용"으로 일부러 복사해둔 CmNoticeDtl.js(bo-ec-cu-ba 와 동일 파일명/
 * 전역명 충돌 테스트)로 구성돼 있었다. 그 검증 목적은 이후 여러 실제 도메인
 * (bo-ec-mb-member/grade, bo-ec-pm-promo/event 등)이 정상적으로 각자 등록/로드되며
 * 이미 충분히 증명됐다고 보고, CmNoticeDtl.js 는 제거하고 실제 좌측 메뉴의
 * '기준정보' 그룹 나머지 화면(사이트관리 SySiteMng+Dtl, 공통코드관리의 SyCodeDtl)을
 * 채워 넣었다. shopjoy_v260406(실제 프로덕션)의 pages/bo/sy/ 를 그대로 복사(원본은
 * 전혀 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/sy/ba/';

  const scripts = [
    R.loadModule(P + 'SySiteMng.js'),
    R.loadModule(P + 'SyCodeMng.js'),
    R.loadModule(P + 'SyBrandMng.js'),
    R.loadModule(P + 'SySiteDtl.js'),
    R.loadModule(P + 'SyCodeDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'sy-ba-sySiteMng', label: '사이트관리', group: '기준정보', comp: results[0].default },
      { id: 'sy-ba-syCodeMng', label: '공통코드관리', group: '기준정보', comp: results[1].default },
      { id: 'sy-ba-syBrandMng', label: '브랜드관리', group: '기준정보', comp: results[2].default },
    ];
    const innerComps = [
      { tag: 'SySiteDtl', comp: results[3].default },
      { tag: 'SyCodeDtl', comp: results[4].default },
    ];
    R.register('bo-sy', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy/ba manifest] 로드 실패:', err);
  });
})();

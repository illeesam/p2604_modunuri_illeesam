/* manifest.js — "시스템 > 기준정보" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-ab-home/manifest.js 주석 참조. 같은 대메뉴(sy)에 bo-sy-org(조직) 도
 * 별도 레포로 기여한다 — 대메뉴 하나를 여러 마이크로 레포가 소그룹(group)으로
 * 나눠 채우는 예시(2026-08-28).
 *
 * pages/bo/sy/ba/CmNoticeDtl.js — bo-cu-ba/pages/bo/cu/ba/CmNoticeDtl.js 를 **일부러 그대로
 * 복사**해온 파일이었다(2026-08-28, 동일 파일명/동일 전역명 충돌 시나리오 점검용).
 * 실제로 bo-cu-co 의 registerComponents(태그 'CmNoticeDtl')와 이 화면의 register()
 * (comp.name 폴백)가 서로 다른 경로로 같은 app.component() 이름을 두고 부딪히는 걸
 * 확인했다(2026-08-29) — `_registerOne()`의 console.warn 으로 잡혀 나오는 그 케이스가
 * 바로 이것. 지금은 `window.BoSyBaCmNoticeDtl`로 전역명을 분리하고 `pages/bo/sy/ba/`
 * 밑으로 옮겨서(장차 통합 시스템으로 합칠 때를 대비해 도메인 경로를 파일 경로에 미리
 * 새겨둠) 어느 순서로 로드돼도 더 이상 충돌하지 않는다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/bo/sy/ba/SyBrandMng.js'),
    R.loadScript(base + 'pages/bo/sy/ba/SyCodeMng.js'),
    R.loadScript(base + 'pages/bo/sy/ba/CmNoticeDtl.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'bo-sy-ba-syBrandMng', label: '브랜드관리', group: '기준정보', comp: window.BoSyBaSyBrandMng },
      { id: 'bo-sy-ba-syCodeMng', label: '공통코드관리', group: '기준정보', comp: window.BoSyBaSyCodeMng },
      // id는 bo-cu-ba 쪽(bo-cu-ba-cmNoticeMng)과 겹치지 않게 붙였다. comp 자체도 이제
      // window.BoSyBaCmNoticeDtl 로 분리돼 있어 app.component() 이름 충돌도 없다.
      { id: 'bo-sy-ba-cmNoticeDtl', label: '공지사항상세(파일명중복테스트)', group: '기준정보', comp: window.BoSyBaCmNoticeDtl },
    ];
    R.register('bo-sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy-ba manifest] 로드 실패:', err);
  });
})();

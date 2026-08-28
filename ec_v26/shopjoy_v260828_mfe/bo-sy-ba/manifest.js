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
 * 확인했다(2026-08-29).
 *
 * ES 모듈 전면 전환(2026-08-29) — bo-ab-home/manifest.js 주석 참조. window.ComponentName
 * 대신 export default + R.loadModule() — 이제 이 화면들은 어떤 전역도 안 쓰므로
 * bo-cu-ba/bo-cu-co 와 로드 순서가 어떻게 겹쳐도 서로 충돌할 수 없다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/sy/ba/SyBrandMng.js'),
    R.loadModule(base + 'pages/bo/sy/ba/SyCodeMng.js'),
    R.loadModule(base + 'pages/bo/sy/ba/CmNoticeDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'bo-sy-ba-syBrandMng', label: '브랜드관리', group: '기준정보', comp: results[0].default },
      { id: 'bo-sy-ba-syCodeMng', label: '공통코드관리', group: '기준정보', comp: results[1].default },
      // id는 bo-cu-ba 쪽(bo-cu-ba-cmNoticeMng)과 겹치지 않게 붙였다. comp 자체도
      // ES 모듈이라 window 전역 레이스와 무관하다.
      { id: 'bo-sy-ba-cmNoticeDtl', label: '공지사항상세(파일명중복테스트)', group: '기준정보', comp: results[2].default },
    ];
    R.register('bo-sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy-ba manifest] 로드 실패:', err);
  });
})();

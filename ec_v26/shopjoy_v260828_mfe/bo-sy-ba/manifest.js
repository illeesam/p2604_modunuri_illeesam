/* manifest.js — "시스템 > 기준정보" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadScript+
 * _domainReady)은 bo-aa-home/manifest.js 주석 참조. 같은 대메뉴(sy)에 bo-sy-org(조직) 도
 * 별도 레포로 기여한다 — 대메뉴 하나를 여러 마이크로 레포가 소그룹(group)으로
 * 나눠 채우는 예시(2026-08-28).
 *
 * pages/CmNoticeDtl.js — bo-cu-ba/pages/CmNoticeDtl.js 를 **일부러 그대로 복사**해온
 * 파일이다(2026-08-28, 동일 파일명/동일 전역명 충돌 시나리오 점검용). bo-cu-ba 도
 * `window.CmNoticeDtl = {...}` 를 선언하므로, 두 도메인의 스크립트가 동시에(사용자가
 * 고객센터→시스템처럼 서로 다른 대메뉴를 로딩이 안 끝난 사이 연달아 클릭) 로드되면
 * 이 전역을 서로 덮어쓰는 레이스가 이론상 가능하다 — 다만 각 도메인은 자기 Promise.all()
 * 이 끝난 "직후"(그 사이에 다른 도메인의 onload 가 끼어들 여지가 있는 매크로태스크
 * 경계)에만 `window.CmNoticeDtl` 값을 읽으므로, 정상적인 순차 탐색(한 대메뉴 로딩이
 * 끝난 뒤 다음 대메뉴 클릭)에서는 문제 없다 — 재현하려면 두 대메뉴를 로딩 중에 거의
 * 동시에 클릭해야 한다. 실제로 렌더되는 컴포넌트 자체는 `<component :is="...">` 로
 * 객체를 직접 바인딩해 쓰므로(문자열 태그 조회 아님) app.component() 전역 등록
 * 충돌(`_registeredCompNames`)과는 무관하게 이 화면 자체는 정상 렌더된다 — 전역
 * 이름 충돌의 영향 범위가 정확히 어디까지인지 확인하는 게 이 테스트의 목적이다. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadScript(base + 'pages/SyBrandMng.js'),
    R.loadScript(base + 'pages/SyCodeMng.js'),
    R.loadScript(base + 'pages/CmNoticeDtl.js'),
  ];

  Promise.all(scripts).then(function () {
    const screens = [
      { id: 'syBrandMng', label: '브랜드관리', group: '기준정보', comp: window.SyBrandMng },
      { id: 'syCodeMng', label: '공통코드관리', group: '기준정보', comp: window.SyCodeMng },
      // id는 bo-cu-ba 쪽(cmNoticeMng)과 겹치지 않게 붙였다 — comp 자체(window.CmNoticeDtl)의
      // "이름"이 겹치는 것과 메뉴 id가 겹치는 것은 별개 문제라 둘 다 따로 확인 가능하게.
      { id: 'syCmNoticeDtlDup', label: '공지사항상세(파일명중복테스트)', group: '기준정보', comp: window.CmNoticeDtl },
    ];
    R.register('sy', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-sy-ba manifest] 로드 실패:', err);
  });
})();

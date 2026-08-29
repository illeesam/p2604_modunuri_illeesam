/* manifest.js — "홈" 마이크로 도메인의 유일한 진입점(FO).
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식은
 * bo-ap-global/lib/mfe/mfeRegistry.js 주석 참조(FO는 foMfeRegistry.js가 같은 역할).
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/fo/Home01.js 를 그대로 복사해왔다(원본은
 * 전혀 수정하지 않음). 실제로는 FO_SITE_NO(01/02/03)에 따라 Home01/02/03 중 하나가
 * 로드되지만(index.html의 document.write 참고), 이 데모는 BO 쪽과 동일하게 사이트
 * 하나(01)로 범위를 고정했다 — 02/03 은 나중에 이 폴더에 형제 파일로 추가하면 된다.
 *
 * FO 페이지 파일은 export default(ES 모듈) 방식이다(2026-08-29, BO와 동일하게
 * 전환 — 처음엔 "FO는 도메인 간 이름이 안 겹쳐서 classic script 로도 무방하다"고
 * 판단했었지만, 프로젝트 전체 일관성을 위해 BO와 같은 방식으로 통일했다). */
(function () {
  const R = window.FO_MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/fo/home/';

  R.loadModule(P + 'Home01.js').then(function (m) {
    R.register([{ id: 'home', comp: m.default }]);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[fo-ap-home manifest] 로드 실패:', err);
  });
})();

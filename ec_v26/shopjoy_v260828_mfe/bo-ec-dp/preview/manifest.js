/* manifest.js — "전시관리 > 미리보기" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-dp/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 * 각 파일 안에 로컬 서브컴포넌트 `WidgetPreview`(5개 파일이 전부 같은 이름으로
 * 각자 선언)가 있는데, `components: { WidgetPreview: ... }`로 부모 컴포넌트
 * 안에서만 지역 등록되는 방식이라 전역 이름 충돌과 무관하다 — 그대로 둔다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/dp/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/dp/preview/';

  const scripts = [
    R.loadModule(P + 'DpDispUiPreview.js'),
    R.loadModule(P + 'DpDispAreaPreview.js'),
    R.loadModule(P + 'DpDispPanelPreview.js'),
    R.loadModule(P + 'DpDispWidgetPreview.js'),
    R.loadModule(P + 'DpDispWidgetLibPreview.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'dp-preview-dpDispUiPreview', label: '전시UI미리보기', group: '미리보기', comp: results[0].default },
      { id: 'dp-preview-dpDispAreaPreview', label: '전시영역미리보기', group: '미리보기', comp: results[1].default },
      { id: 'dp-preview-dpDispPanelPreview', label: '전시패널미리보기', group: '미리보기', comp: results[2].default },
      { id: 'dp-preview-dpDispWidgetPreview', label: '전시위젯미리보기', group: '미리보기', comp: results[3].default },
      { id: 'dp-preview-dpDispWidgetLibPreview', label: '전시위젯Lib미리보기', group: '미리보기', comp: results[4].default },
    ];
    R.register('bo-ec-dp', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-dp/preview manifest] 로드 실패:', err);
  });
})();

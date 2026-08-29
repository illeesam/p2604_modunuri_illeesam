/* manifest.js — "상품관리 > 카테고리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pd/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 * PdCategoryDtl 은 boAppCompPage.js 에 등록돼 있지만 PdCategoryMng 템플릿 안에서
 * 태그로 직접 embed되지 않는 원본 구조라(별도 라우팅 대상) 원본과 동일하게
 * registerComponents 로만 등록해 태그 사용 가능성을 열어둔다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/pd/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/pd/cate/';

  const scripts = [
    R.loadModule(P + 'PdCategoryMng.js'),
    R.loadModule(P + 'PdCategoryProdMng.js'),
    R.loadModule(P + 'PdCategoryDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pd-cate-pdCategoryMng', label: '카테고리관리', group: '카테고리', comp: results[0].default },
      { id: 'pd-cate-pdCategoryProdMng', label: '카테고리상품관리', group: '카테고리', comp: results[1].default },
    ];
    const innerComps = [
      { tag: 'PdCategoryDtl', comp: results[2].default },
    ];
    R.register('bo-ec-pd', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pd/cate manifest] 로드 실패:', err);
  });
})();

/* manifest.js — "상품관리 > 상품" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pd/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나(=이 하위 폴더) — bo-ec-mb/member/manifest.js
 * 주석과 동일한 이유. 같은 대메뉴(bo-ec-pd) 에 bo-ec-pd/cate, /opt, /tmplt, /info 도
 * 각자의 manifest.js 로 별도 지연로드된다.
 *
 * PdSingleProdMng/PdOptionProdMng/PdGroupProdMng/PdSetProdMng/PdGiftProdMng 은 전부
 * PdProdMng 을 <pd-prod-mng fixed-prod-type-cd="..."> 태그로 감싸는 얇은 래퍼다(원본
 * 그대로) — 그래서 PdProdMng 은 다른 화면들과 달리 `name:` 을 접두어 없이 원본
 * 그대로 'PdProdMng' 유지한다(전역 컴포넌트 태그가 이 이름으로 매칭돼야 5개 래퍼가
 * 동작). 메뉴/카탈로그 식별자(id)는 별개로 'pd-pd-pdProdMng' 를 쓴다. PdProdDtl/
 * PdProdHist 도 PdProdMng 템플릿 안에서 embed되는 내부 컴포넌트라 원본 이름 그대로
 * 유지하고 registerComponents 로만 등록한다.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/pd/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/pd/pd/';

  const scripts = [
    R.loadModule(P + 'PdProdMng.js'),
    R.loadModule(P + 'PdSingleProdMng.js'),
    R.loadModule(P + 'PdOptionProdMng.js'),
    R.loadModule(P + 'PdGroupProdMng.js'),
    R.loadModule(P + 'PdSetProdMng.js'),
    R.loadModule(P + 'PdGiftProdMng.js'),
    R.loadModule(P + 'PdProdDtl.js'),
    R.loadModule(P + 'PdProdHist.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pd-pd-pdProdMng', label: '상품관리', group: '상품', comp: results[0].default },
      { id: 'pd-pd-pdSingleProdMng', label: '단품상품등록', group: '상품', comp: results[1].default },
      { id: 'pd-pd-pdOptionProdMng', label: '옵션상품등록', group: '상품', comp: results[2].default },
      { id: 'pd-pd-pdGroupProdMng', label: '묶음상품등록', group: '상품', comp: results[3].default },
      { id: 'pd-pd-pdSetProdMng', label: '세트상품등록', group: '상품', comp: results[4].default },
      { id: 'pd-pd-pdGiftProdMng', label: '사은상품등록', group: '상품', comp: results[5].default },
    ];
    const innerComps = [
      { tag: 'PdProdDtl', comp: results[6].default },
      { tag: 'PdProdHist', comp: results[7].default },
    ];
    R.register('bo-ec-pd', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pd/pd manifest] 로드 실패:', err);
  });
})();

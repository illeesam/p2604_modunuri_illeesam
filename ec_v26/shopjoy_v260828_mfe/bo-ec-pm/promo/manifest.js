/* manifest.js — "프로모션 > 판촉" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * 2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-pm/ 전체 하나이지만,
 * "지연로드 단위"는 이 manifest.js 하나 — bo-ec-mb/member/manifest.js 주석 참고.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/pm/ 일부를 그대로 복사(원본은 전혀
 * 수정하지 않음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/pm/promo/';

  const scripts = [
    R.loadModule(P + 'PmCouponMng.js'),
    R.loadModule(P + 'PmCacheMng.js'),
    R.loadModule(P + 'PmDiscntMng.js'),
    R.loadModule(P + 'PmSaveMng.js'),
    R.loadModule(P + 'PmGiftMng.js'),
    R.loadModule(P + 'PmVoucherMng.js'),
    R.loadModule(P + 'PmCouponDtl.js'),
    R.loadModule(P + 'PmCacheDtl.js'),
    R.loadModule(P + 'PmDiscntDtl.js'),
    R.loadModule(P + 'PmSaveDtl.js'),
    R.loadModule(P + 'PmGiftDtl.js'),
    R.loadModule(P + 'PmVoucherDtl.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'pm-promo-pmCouponMng', label: '쿠폰관리', group: '판촉', comp: results[0].default },
      { id: 'pm-promo-pmCacheMng', label: '캐쉬관리', group: '판촉', comp: results[1].default },
      { id: 'pm-promo-pmDiscntMng', label: '할인관리', group: '판촉', comp: results[2].default },
      { id: 'pm-promo-pmSaveMng', label: '적립금관리', group: '판촉', comp: results[3].default },
      { id: 'pm-promo-pmGiftMng', label: '사은품관리', group: '판촉', comp: results[4].default },
      { id: 'pm-promo-pmVoucherMng', label: '상품권관리', group: '판촉', comp: results[5].default },
    ];
    const innerComps = [
      { tag: 'PmCouponDtl', comp: results[6].default },
      { tag: 'PmCacheDtl', comp: results[7].default },
      { tag: 'PmDiscntDtl', comp: results[8].default },
      { tag: 'PmSaveDtl', comp: results[9].default },
      { tag: 'PmGiftDtl', comp: results[10].default },
      { tag: 'PmVoucherDtl', comp: results[11].default },
    ];
    R.register('bo-ec-pm', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-pm/promo manifest] 로드 실패:', err);
  });
})();

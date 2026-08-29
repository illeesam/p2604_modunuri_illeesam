/* manifest.js — "주문관리" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/ec/od/ + pages/co/ec/od/OdOrderKanban.js 를
 * 그대로 복사해왔다(2026-08-29, 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조
 * (LEFT_MENUS.order)는 소그룹(group) 구분이 없는 평평한 목록(홈과 동일 패턴)이라
 * 이 도메인 전체를 소그룹 폴더 하나("order")가 담당한다(3레벨 네이밍 포맷은
 * 유지하되 폴더 분할은 1개 — bo-ap-home 과 같은 케이스).
 *
 * 2026-08-29(같은 날 후속 재구조화): 이 파일은 원래 형상관리 단위인 `bo-ec-od/`
 * 바로 밑에 있었는데, 다른 도메인들과 마찬가지로 "형상관리 단위(레포 루트)"와
 * "지연로드 단위(소그룹 폴더)"를 분리하는 김에 `bo-ec-od/order/` 로 한 단계 더
 * 내려왔다(사용자 지시). `bo-ec-od/`는 레포 루트로 그대로 남고, `dev.html`/
 * `_git_shopjoy-mfe-domain-ec-od.txt`도 루트에 남는다 — manifest.js와 pages/만
 * `order/` 안으로 이동했다. 소그룹이 지금은 1개뿐이라 당장 체감 효과는 없지만,
 * 나중에 반품/교환처럼 소그룹이 늘어도 레포를 새로 만들 필요 없이 형제 폴더
 * (`bo-ec-od/return/` 등)만 추가하면 되는 구조를 미리 잡아둔 것이다.
 *
 * 내부 컴포넌트(Dtl/Hist/Modal)는 각 Mng/Dtl 템플릿 안에서 태그로 embed 되므로 원본
 * 이름 그대로 유지하고 registerComponents 로만 등록한다: OdOrderDtl/OdOrderHist
 * (OdOrderMng 안), OdOrderItemDtl(OdOrderItemMng 안), OdClaimDtl/OdClaimHist/
 * OdClaimCalcModal(OdClaimMng·OdClaimDtl 안), OdDlivDtl/OdDlivHist(OdDlivMng 안).
 *
 * ⚠ 팝업 2개(window.open 전용, 원본과 동일 구조) — bo-od-order-kanban-pop.html /
 * bo-od-order-promo-pop.html 은 이 폴더가 아니라 **컨테이너 루트**
 * (shopjoy_v260828_mfe/)에 있다. boUtil.bofOpenKanbanPopup() 등이 쓰는
 * window.pageUrl() 이 "URL 경로에서 'shopjoy...' 세그먼트를 찾아 그 바로 아래를
 * 기준"으로 절대경로를 만들기 때문에(boApiAxios.js appBase() 참고), mfe.html에서
 * 열든 이 도메인의 dev.html에서 열든 항상 컨테이너 루트가 기준이 된다 — 그래서
 * 팝업 HTML 2개만 예외적으로 도메인 폴더 밖에 둔다. 두 팝업 다 이 폴더의 ESM
 * 파일(OdOrderKanban.js/OdOrderPromoPop.js)을 <script type="module"> import 로
 * 재사용한다(파일 중복 없음). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/od/order/';

  const scripts = [
    R.loadModule(P + 'OdOrderMng.js'),
    R.loadModule(P + 'OdOrderItemMng.js'),
    R.loadModule(P + 'OdClaimMng.js'),
    R.loadModule(P + 'OdDlivMng.js'),
    R.loadModule(P + 'OdOrderKanban.js'),
    R.loadModule(P + 'OdCartMng.js'),
    R.loadModule(P + 'OdOrderDtl.js'),
    R.loadModule(P + 'OdOrderHist.js'),
    R.loadModule(P + 'OdOrderItemDtl.js'),
    R.loadModule(P + 'OdClaimDtl.js'),
    R.loadModule(P + 'OdClaimHist.js'),
    R.loadModule(P + 'OdClaimCalcModal.js'),
    R.loadModule(P + 'OdDlivDtl.js'),
    R.loadModule(P + 'OdDlivHist.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'od-order-odOrderItemMng', label: '주문항목관리', comp: results[1].default },
      { id: 'od-order-odOrderMng', label: '주문관리', comp: results[0].default },
      { id: 'od-order-odClaimMng', label: '클레임관리', comp: results[2].default },
      { id: 'od-order-odDlivMng', label: '배송관리', comp: results[3].default },
      { id: 'od-order-odOrderKanban', label: '주문 칸반보드', comp: results[4].default },
      { id: 'od-order-odCartMng', label: '장바구니관리', comp: results[5].default },
    ];
    const innerComps = [
      { tag: 'OdOrderDtl', comp: results[6].default },
      { tag: 'OdOrderHist', comp: results[7].default },
      { tag: 'OdOrderItemDtl', comp: results[8].default },
      { tag: 'OdClaimDtl', comp: results[9].default },
      { tag: 'OdClaimHist', comp: results[10].default },
      { tag: 'OdClaimCalcModal', comp: results[11].default },
      { tag: 'OdDlivDtl', comp: results[12].default },
      { tag: 'OdDlivHist', comp: results[13].default },
    ];
    R.register('bo-ec-od', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-ec-od manifest] 로드 실패:', err);
  });
})();

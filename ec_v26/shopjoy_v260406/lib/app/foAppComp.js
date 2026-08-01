/* ShopJoy FO - Vue 컴포넌트 등록 (foAppBase.js 에서 분리) */
window.foRegisterComponents = function (app) {
  app
    /* ── layout/ ── */
    .component('FoAppHeader',   window.foAppHeader)
    .component('FoAppSidebar',  window.foAppSidebar)
    .component('FoAppFooter',   window.foAppFooter)
    /* ── pages/base/ ── */
    .component('FoError404',    window.foError404)
    .component('FoError401',    window.foError401)
    .component('FoError500',    window.foError500)
    /* ── pages/ (사용자 페이스 - FO_SITE_NO 기준 동적) ── */
    .component('Home'+window.FO_SITE_NO,        window['Home'+window.FO_SITE_NO])
    .component('Prod'+window.FO_SITE_NO+'List', window['Prod'+window.FO_SITE_NO+'List'])
    .component('Prod'+window.FO_SITE_NO+'View', window['Prod'+window.FO_SITE_NO+'View'])
    .component('Cart',         window.Cart)
    .component('Order',        window.Order)
    .component('Contact',      window.Contact)
    .component('Faq',          window.Faq)
    .component('Login',        window.Login)
    .component('EventPage',    window.EventPage)
    .component('EventView',    window.EventView)
    .component('BlogPage',     window.Blog)
    .component('BlogView',     window.BlogView)
    .component('BlogEdit',     window.BlogEdit)
    .component('LikePage',     window.Like)
    .component('LocationPage', window.Location)
    .component('AboutPage',    window.About)
    /* ── pages/fo/my/ (마이페이지) ── */
    .component('MyDateFilter', window.MyDateFilter)
    .component('MyOrder',      window.MyOrder)
    .component('MyClaim',      window.MyClaim)
    .component('MyCoupon',     window.MyCoupon)
    .component('MyCache',      window.MyCache)
    .component('MyContact',    window.MyContact)
    .component('MyChatt',      window.MyChatt)
    /* ── pages/co/ec/ (FO/BO 공용) ── */
    .component('OdOrderKanban', window.OdOrderKanban)
    /* ── components/disp/ (전시 컴포넌트) ── */
    .component('DispX04Widget', window.DispX04Widget)
    /* ── components/comp/ (공통 컴포넌트) ── */
    .component('CoBarcodeWidget',  window.CoBarcodeWidget  || { template: '<div/>' })
    .component('CoCountdownWidget', window.CoCountdownWidget || { template: '<div/>' })
    .component('BaseAttachGrp', window.BaseAttachGrp)
    .component('BaseHtmlEditor', window.BaseHtmlEditor)
    .component('BaseTossPayWidget', window.BaseTossPayWidget)
    /* ── components/comp/FoAreaComp.js — 공통 영역(페이지/컨테이너/검색/그리드/폼/모달) ── */
    .component('FoPage',       window.FoPage)
    .component('FoContainer',  window.FoContainer)
    .component('FoSearchArea', window.FoSearchArea)
    .component('FoFormArea',   window.FoFormArea)
    .component('FoGrid',       window.FoGrid)
    .component('FoGridCrud',   window.FoGridCrud)
    .component('FoModal',      window.FoModal)
    .component('FoCmPopupModal', window.FoCmPopupModal)
    .component('FoRowCancelDelete', window.FoRowCancelDelete)
    /* ── components/comp/FoComp.js — FO 공통 단위 컴포넌트 ── */
    .component('FoPager',      window.FoPager)
    .component('FoTabBar',     window.FoTabBar)
    /* ── components/modals/FoModals.js — FO 전용 모달 ── */
    .component('CustomerModal',        window.CustomerModal)
    .component('OrderDetailModal',     window.OrderDetailModal)
    .component('ProductModal',         window.ProductModal)
    .component('FoAddrSearchModal',    window.FoAddrSearchModal)
    /* ── components/modals/CoExtHelpModal.js — 외부 연동 설정 도움말 (FO/BO 공용) ── */
    .component('CoExtHelpModal',       window.CoExtHelpModal || { template: '<div/>' });

  /* ■■■ disp 공통 컴포넌트 등록 ■■■ */
  ['DispX01Ui','DispX02Area','DispX03Panel','DispX04Widget'].forEach(name => {
    if (window[name]) app.component(name, window[name]);
  });
  /* ■■■ xd/DispUi* — 스크립트 태그 주석처리해도 에러 없이 동작 ■■■ */
  ['DispUi01','DispUi02','DispUi03','DispUi04','DispUi05','DispUi06',
  ].forEach(name => { if (window[name]) app.component('Xd'+name, window[name]); });
  /* ■■■ xs/Sample* — 스크립트 태그 주석처리해도 에러 없이 동작 ■■■ */
  ['XsSample01','XsSample02','XsSample03','XsSample04','XsSample05','XsSample06','XsSample07',
   'XsSample08','XsSample09','XsSample10','XsSample11','XsSample12','XsSample13','XsSample14',
   'XsSample21','XsSample22','XsSample23',
  ].forEach(name => { if (window[name]) app.component(name, window[name]); });
  /* ■■■ xs/ 개발도구 ■■■ */
  if (window.XsStore) app.component('XsStore', window.XsStore);
  if (window.XsLocalStorage) app.component('XsLocalStorage', window.XsLocalStorage);
};

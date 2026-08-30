/* ShopJoy BO - Vue 컴포넌트 등록 (boAppBase.js 에서 분리) */
window.boRegisterComponents = function (app) {
  return app
    /* ── pages/base/ ── */
    .component('BoError404', window.boError404)
    .component('BoError401', window.boError401)
    .component('BoError500', window.boError500)
    /* ── components/disp/ (전시 핵심 컴포넌트) ── */
    .component('DispX01Ui', window.DispX01Ui)
    .component('DispX02Area', window.DispX02Area)
    .component('DispX03Panel', window.DispX03Panel || { template: '<div/>' })
    .component('DispX04Widget', window.DispX04Widget || { template: '<div/>' })
    .component('CoBarcodeWidget', window.CoBarcodeWidget || { template: '<div/>' })
    .component('CoCountdownWidget', window.CoCountdownWidget || { template: '<div/>' })
    /* ── components/comp/ (공통 컴포넌트) ── */
    .component('CoEchartComp', window.CoEchartComp)
    .component('CoEchart', window.CoEchartComp)
    .component('CoNotiBell', window.CoNotiBell)
    .component('BaseAttachGrp', window.BaseAttachGrp)
    .component('BaseAttachOne', window.BaseAttachOne)
    .component('BaseHtmlEditor', window.BaseHtmlEditor)
    .component('BaseTossPayWidget', window.BaseTossPayWidget)
    /* ── pages/bo/ (공통) ── */
    .component('BoRefModal', window.BoRefModal)
    .component('BoExcelUploadModal', window.BoExcelUploadModal)
    /* ── pages/bo/ec/ — 회원 ── */
    /* ── pages/bo/ec/ — 상품 ── */
    /* ── pages/bo/md/cb/ — 코바늘(모듈 관리) ── */
    /* ── pages/co/ec/ — 주문 칸반 ── */
    /* ── pages/bo/ec/ — 주문 ── */
    /* ── pages/bo/ec/ — 클레임 ── */
    /* ── pages/bo/ec/ — 배송 ── */
    /* ── pages/bo/ec/ — 쿠폰/캐쉬 ── */
    /* ── pages/bo/ec/ — 전시관리 ── */
    /* ── pages/bo/ec/ — 카테고리 ── */
    /* ── pages/bo/ec/ — 이벤트/공지 ── */
    /* ── pages/bo/ec/st/ — 정산관리 ── */
    /* ── pages/bo/ec/ — 채팅/고객 ── */
    /* ── pages/bo/sy/ — 대시보드 ── */
    .component('SyDashboardMng', window.SyDashboardMng)
    .component('DashboardBoEc01', window.DashboardBoEc01)
    .component('DashboardBoEc02', window.DashboardBoEc02)
    .component('DashboardBoEc03', window.DashboardBoEc03)
    /* ── pages/bo/sy/ — 사용자/권한/조직 ── */
    /* ── pages/bo/sy/ — 사이트/코드/브랜드 ── */
    /* ── pages/bo/sy/ — 템플릿/업체/첨부 ── */
    /* ── pages/bo/sy/ — 배치 ── */
    /* ── pages/bo/sy/ — 알림/게시판/문의 ── */
    .component('BoPager', window.BoPager)
    .component('BoTabBar', window.BoTabBar)
    .component('BoPathTree', window.BoPathTree)
    .component('BoPathPickField', window.BoPathPickField)
    .component('BoPathTreeNode', window.BoPathTreeNode)
    .component('BoCategoryTree', window.BoCategoryTree)
    .component('BoMultiCheckSelect', window.BoMultiCheckSelect)
    .component('BoComboMatrixSelect', window.BoComboMatrixSelect)
    .component('BoDateTimePicker', window.BoDateTimePicker)
    .component('BoPage', window.BoPage)
    .component('BoContainer', window.BoContainer)
    .component('BoSearchArea', window.BoSearchArea)
    .component('BoFormArea', window.BoFormArea)
    .component('BoFormActions', window.BoFormActions)
    .component('BoGrid', window.BoGrid)
    .component('BoMatrix', window.BoMatrix)
    .component('BoGridCrud', window.BoGridCrud)
    .component('BoGroupTable', window.BoGroupTable)
    .component('BoStatRow', window.BoStatRow)
    .component('BoPathTreeCard', window.BoPathTreeCard)
    .component('BoMenuTree', window.BoMenuTree)
    .component('BoMenuTreeCard', window.BoMenuTreeCard)
    .component('BoLocalTreeCard', window.BoLocalTreeCard)
    .component('BoModal', window.BoModal)
    .component('BoExcelDownModal', window.BoExcelDownModal)
    .component('BoCmPopupModal', window.BoCmPopupModal)
    .component('BoAddrSearchModal', window.BoAddrSearchModal)
    .component('BoCronModal', window.BoCronModal)
    .component('BoTreeSelectorModal', window.BoTreeSelectorModal)
    .component('BoRowCancelDelete', window.BoRowCancelDelete)
    .component('BoRoleSelectModal', window.BoRoleSelectModal)
    .component('BoPathParentSelector', window.BoPathParentSelector)
    .component('PdReviewStatusModal', window.PdReviewStatusModal)
    .component('BoPropTreeNode', window.BoPropTreeNode)
    /* ── components/modals/ — 인증 모달 ── */
    .component('AuthLoginModal', window.AuthLoginModal)
    .component('CoExtHelpModal', window.CoExtHelpModal || { template: '<div/>' })
    .component('AuthPwChangeModal', window.AuthPwChangeModal)
    .component('AuthUserPickModal', window.AuthUserPickModal)
    .component('AuthProfileModal', window.AuthProfileModal)
    /* ── components/modals/ — 도움말 모달 ── */
    .component('HelpBoModal', window.HelpBoModal)
    /* ── components/modals/ — 트리 모달 ── */
    .component('BoDeptTreeNode', window.BoDeptTreeNode)
    /* ── components/modals/ — 미리보기/전송 모달 ── */
    .component('DispPreviewModal', window.DispPreviewModal || { template: '<div/>' })
    .component('RowPickModal', window.RowPickModal || { template: '<div/>' })
    .component('TemplatePreviewModal', window.TemplatePreviewModal)
    .component('TemplateSendModal', window.TemplateSendModal)
    /* ── comp — 개발도구 공통 그리드 ── */
    .component('BoZdYmlGrid',     window.BoZdYmlGrid)
    .component('BoZdSyPropGrid',  window.BoZdSyPropGrid);
    /* ── pages/bo/zd/ — 개발도구 ── */
    /* ── pages/bo/zd/ — 시뮬레이션 공통 + 도메인 ──
       2026-08-30 2차: ZdSimulComps.js(ZdSimulControlPanel/LogPanel/PreviewModal/ZdPreviewTable)
       가 lazy 로 옮겨져(zdSimul*Mng pageId 들의 동반 파일) 여기서 정적 등록 제거 — 로드 시점에
       fnEnsurePageLoaded 가 동적으로 app.component() 등록한다. */
};

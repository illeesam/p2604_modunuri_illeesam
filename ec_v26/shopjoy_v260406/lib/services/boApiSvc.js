/**
 * boApiSvc.js — Back Office 전용 공통 API 서비스
 *
 * 모든 API 엔드포인트(GET/POST/PUT/DELETE)를 이 파일에 등록하여 중앙 관리한다.
 *
 * 선행 로드: utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await boApiSvc.mbMember.getPage({ searchValue: '홍길동' }, '회원관리', '목록조회');
 *   const res = await boApiSvc.mbMember.create(body, '회원관리', '등록');
 *   const res = await boApiSvc.mbMember.update(_id, body, '회원관리', '저장');
 *   const res = await boApiSvc.mbMember.remove(_id, '회원관리', '삭제');
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    /* uiNm/cmdNm 미전달 시 'BO' / '조회' 기본값으로 헤더 보장 */
    return coUtil.cofApiHdr(uiNm || 'BO', cmdNm || '조회');
  }

  /* _id / saveList rows 검증은 coUtil.cofChkId / coUtil.cofChkRowIds 위임 */
  const chkId     = (...a) => coUtil.cofChkId(...a);

  /* chkRowIds */
  const chkRowIds = (...a) => coUtil.cofChkRowIds(...a);

  const boApiSvc = {};

  /* ── cm: 블로그 ─────────────────────────────────────────────── */
  boApiSvc.cmBlog = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/cm/blog/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/blog/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/cm/blog', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/blog/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/blog/${_id}`, hdr(uiNm, cmdNm)); },
    setUse(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/blog/${_id}/use`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 블로그 첨부 이미지 (cm_blog_file) ───────────────────── */
  boApiSvc.cmBlogFile = {
    getList(params, uiNm, cmdNm)     { return global.boApi.get('/bo/ec/cm/blog-file', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(cmd, rows, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/blog-file/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 대시보드 ────────────────────────────────────────────── */
  boApiSvc.cmDashboard = {
    getData(items, uiNm, cmdNm)       { return global.boApi.post('/bo/ec/cm/dashboard/data', items, hdr(uiNm, cmdNm)); },
    getDailyStats(targetDate, uiNm, cmdNm) {
      const params = targetDate ? { targetDate } : {};
      return global.boApi.get('/bo/ec/cm/dashboard/daily-stats', { params, ...hdr(uiNm, cmdNm) });
    },
    getList(params, uiNm, cmdNm)      { return global.boApi.get('/bo/ec/cm/dashboard/list', { params, ...hdr(uiNm, cmdNm) }); },
    getById(id, uiNm, cmdNm)          { return global.boApi.get('/bo/ec/cm/dashboard/' + id, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)         { return global.boApi.post('/bo/ec/cm/dashboard', body, hdr(uiNm, cmdNm)); },
    update(id, body, uiNm, cmdNm)     { return global.boApi.put('/bo/ec/cm/dashboard/' + id, body, hdr(uiNm, cmdNm)); },
    /* 좌측메뉴 트리 (사용자별 폴더+아이템). 저장은 통째 교체 */
    getMenuTree(params, uiNm, cmdNm)  { return global.boApi.get('/bo/ec/cm/dashboard/menu/tree', { params, ...hdr(uiNm, cmdNm) }); },
    saveMenuTree(nodes, params, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/dashboard/menu/save', nodes, { params, ...hdr(uiNm, cmdNm) }); },
    remove(id, uiNm, cmdNm)           { return global.boApi.delete('/bo/ec/cm/dashboard/' + id, hdr(uiNm, cmdNm)); },
    getItemList(params, uiNm, cmdNm)  { return global.boApi.get('/bo/ec/cm/dashboard/item/list', { params, ...hdr(uiNm, cmdNm) }); },
    itemSave(cmd, body, uiNm, cmdNm)     { return global.boApi.post('/bo/ec/cm/dashboard/item/save/' + cmd, body, hdr(uiNm, cmdNm)); },
    itemSaveList(cmd, rows, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/dashboard/item/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
    /* 항목 목록 3레벨 트리 — 차트(1)/시리즈(2)/항목(3) 평면 배열 */
    getItemTree(params, uiNm, cmdNm)  { return global.boApi.get('/bo/ec/cm/dashboard/item/tree', { params, ...hdr(uiNm, cmdNm) }); },
    getItemDataList(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/dashboard/item-data/list', { params, ...hdr(uiNm, cmdNm) }); },
    itemDataUpsert(body, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/dashboard/item-data/upsert', body, hdr(uiNm, cmdNm)); },
    /* 데이터관리 3레벨 그리드 — 1레벨 차트 / 2레벨 시리즈(행) / 3레벨 항목(열).
       params: { dashboardId, siteId, yyyymmdd, periodTypeCd, prodId?, vendorId? } */
    getDataGrid(params, uiNm, cmdNm)      { return global.boApi.get('/bo/ec/cm/dashboard/data-grid', { params, ...hdr(uiNm, cmdNm) }); },
    saveDataGrid(charts, params, uiNm, cmdNm) { return global.boApi.post('/bo/ec/cm/dashboard/data-grid/save', charts, { params, ...hdr(uiNm, cmdNm) }); },
    simulateDataGrid(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/dashboard/data-grid/simulate', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── cm: 채팅 ───────────────────────────────────────────────── */
  boApiSvc.cmChatt = {
    getPage(params, uiNm, cmdNm, opt)     { return global.boApi.get(   '/bo/ec/cm/chatt/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/chatt/${_id}`, hdr(uiNm, cmdNm)); },
    getMessages(_id, params, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/cm/chatt/${_id}/messages`, { params, ...hdr(uiNm, cmdNm) }); },
    sendMsg(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.post(`/bo/ec/cm/chatt/${_id}/msg`, body, hdr(uiNm, cmdNm)); },
    updateStatus(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.patch(`/bo/ec/cm/chatt/${_id}/status`, body, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)        { return global.boApi.post(  '/bo/ec/cm/chatt', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/chatt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: FAQ ────────────────────────────────────────────────── */
  boApiSvc.cmFaq = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/cm/faq/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/cm/faq/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/faq/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/cm/faq', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/faq/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/faq/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 공지사항 ───────────────────────────────────────────── */
  boApiSvc.cmNotice = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/cm/notice/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/notice/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/cm/notice', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/notice/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/notice/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 공통 선택(Pick) 팝업 ─────────────────────────────────
   * cm_popup / cm_popup_item 메타 기반. 타입별 API 없이 popupCode 하나로 조회.
   *   getConfig : 조회항목·목록컬럼·패턴 (프론트가 이 값으로 화면 자동 구성)
   *   getPage   : 목록(검색·페이징) / getTree : 트리(패턴 2·3) */
  boApiSvc.cmPopupPick = {
    getConfig(popupCode, params, uiNm, cmdNm) { return global.boApi.get(`/bo/cm/cmPopupPick/${popupCode}/config`, { params, ...hdr(uiNm, cmdNm) }); },
    getPage(popupCode, params, uiNm, cmdNm)   { return global.boApi.get(`/bo/cm/cmPopupPick/${popupCode}/page`,   { params, ...hdr(uiNm, cmdNm) }); },
    getTree(popupCode, params, uiNm, cmdNm)   { return global.boApi.get(`/bo/cm/cmPopupPick/${popupCode}/tree`,   { params, ...hdr(uiNm, cmdNm) }); },
    /* 팝업 정의 관리 */
    getPopupList(params, uiNm, cmdNm)   { return global.boApi.get('/bo/cm/cmPopupPick/popup/list', { params, ...hdr(uiNm, cmdNm) }); },
    getPopupPage(params, uiNm, cmdNm)   { return global.boApi.get('/bo/cm/cmPopupPick/popup/page', { params, ...hdr(uiNm, cmdNm) }); },
    getPopupItems(popupId, uiNm, cmdNm) { return global.boApi.get(`/bo/cm/cmPopupPick/popup/${popupId}/items`, hdr(uiNm, cmdNm)); },
    popupCreate(body, uiNm, cmdNm)      { return global.boApi.post('/bo/cm/cmPopupPick/popup', body, hdr(uiNm, cmdNm)); },
    popupUpdate(popupId, body, uiNm, cmdNm) { return global.boApi.put(`/bo/cm/cmPopupPick/popup/${popupId}`, body, hdr(uiNm, cmdNm)); },
    popupRemove(popupId, uiNm, cmdNm)   { return global.boApi.delete(`/bo/cm/cmPopupPick/popup/${popupId}`, hdr(uiNm, cmdNm)); },
    itemSave(body, uiNm, cmdNm)         { return global.boApi.post('/bo/cm/cmPopupPick/popup/item', body, hdr(uiNm, cmdNm)); },
    itemRemove(itemId, uiNm, cmdNm)     { return global.boApi.delete(`/bo/cm/cmPopupPick/popup/item/${itemId}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시영역 ───────────────────────────────────────────── */
  boApiSvc.dpArea = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/area/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)     { return global.boApi.get(   '/bo/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/area/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)        { return global.boApi.post(  '/bo/ec/dp/area', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/area/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/area/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시패널 ───────────────────────────────────────────── */
  boApiSvc.dpPanel = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/panel/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)     { return global.boApi.get(   '/bo/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/panel/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)        { return global.boApi.post(  '/bo/ec/dp/panel', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/panel/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/panel/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시위젯 ───────────────────────────────────────────── */
  boApiSvc.dpWidget = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/widget/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/dp/widget/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/widget/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/dp/widget', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/widget/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/widget/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* dpResource 제거(2026-08-10) — /bo/ec/resource/page 는 백엔드 컨트롤러가 없고(404),
     프론트 어디에서도 호출하지 않는 死코드였다. 필요해지면 백엔드 신설과 함께 다시 추가할 것. */

  /* ── dp: 전시UI ─────────────────────────────────────────────── */
  boApiSvc.dpUi = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/ui/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/dp/ui/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/ui/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/dp/ui', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/ui/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/ui/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 위젯라이브러리 ─────────────────────────────────────── */
  boApiSvc.dpWidgetLib = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/dp/widget-lib/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/dp/widget-lib/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/widget-lib/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/dp/widget-lib', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/widget-lib/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/widget-lib/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 고객종합정보 ───────────────────────────────────────── */
  boApiSvc.mbCustInfo = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/mb/cust-info/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── mb: 회원등급 ───────────────────────────────────────────── */
  boApiSvc.mbMemGrade = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/mb/member-grade/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member-grade', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member-grade/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member-grade/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return chkRowIds(rows, 'memberGradeId', uiNm, cmdNm) || global.boApi.post('/bo/ec/mb/member-grade/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원그룹 ───────────────────────────────────────────── */
  boApiSvc.mbMemGroup = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/mb/member-group/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member-group', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member-group/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member-group/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return chkRowIds(rows, 'memberGroupId', uiNm, cmdNm) || global.boApi.post('/bo/ec/mb/member-group/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 ───────────────────────────────────────────────── */
  boApiSvc.mbMember = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/mb/member/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/mb/member', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/mb/member/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 로그인이력 ────────────────────────────────────── */
  boApiSvc.mbMemberLoginLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/ec/mb/member-login-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/mb/member-login-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 토큰이력 ──────────────────────────────────────── */
  boApiSvc.mbMemberTokenLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/ec/mb/member-token-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/mb/member-token-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 장바구니 ──────────────────────────────────────────── */
  boApiSvc.odCart = {
    getPage(params, uiNm, cmdNm, opt)  { return global.boApi.get(   '/bo/ec/od/cart/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/cart/${_id}`, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/cart/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 클레임 ─────────────────────────────────────────────── */
  boApiSvc.odClaim = {
    getPage(params, uiNm, cmdNm, opt)       { return global.boApi.get(   '/bo/ec/od/claim/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/claim/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)          { return global.boApi.post(  '/bo/ec/od/claim', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/claim/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/claim/${_id}`, hdr(uiNm, cmdNm)); },
    /* 단건저장 — cmd: status 등. entity 단건 */
    saveOne(cmd, entity, uiNm, cmdNm)  { return global.boApi.post('/bo/ec/od/claim/save/' + cmd, entity, hdr(uiNm, cmdNm)); },
    /* 일괄저장 — cmd: status/type/approval/approvalReq. rows = List<OdClaim> */
    saveList(cmd, rows, uiNm, cmdNm)   { return global.boApi.post('/bo/ec/od/claim/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
    /* 상태이력 조회 */
    getStatusHist(claimId, uiNm, cmdNm) { return global.boApi.get(`/bo/ec/od/claim/${claimId}/status-hist`, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 배송 ───────────────────────────────────────────────── */
  boApiSvc.odDliv = {
    getPage(params, uiNm, cmdNm, opt)       { return global.boApi.get(   '/bo/ec/od/dliv/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/dliv/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)          { return global.boApi.post(  '/bo/ec/od/dliv', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/dliv/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/dliv/${_id}`, hdr(uiNm, cmdNm)); },
    /* 단건저장 — cmd: status 등. entity 단건 */
    saveOne(cmd, entity, uiNm, cmdNm)  { return global.boApi.post('/bo/ec/od/dliv/save/' + cmd, entity, hdr(uiNm, cmdNm)); },
    /* 일괄저장 — cmd: status/courier/approval/approvalReq. rows = List<OdDliv> */
    saveList(cmd, rows, uiNm, cmdNm)   { return global.boApi.post('/bo/ec/od/dliv/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 주문 ───────────────────────────────────────────────── */
  boApiSvc.odOrder = {
    getPage(params, uiNm, cmdNm, opt)        { return global.boApi.get(   '/bo/ec/od/order/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/order/${_id}`, hdr(uiNm, cmdNm)); },
    getKanban(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/order/${_id}/kanban`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/od/order', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/order/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/order/${_id}`, hdr(uiNm, cmdNm)); },
    /* 단건저장 — cmd: status 등. entity 단건 */
    saveOne(cmd, entity, uiNm, cmdNm)   { return global.boApi.post('/bo/ec/od/order/save/' + cmd, entity, hdr(uiNm, cmdNm)); },
    /* 일괄저장 — cmd: status/payMethod/approval/approvalReq. rows = List<OdOrder> */
    saveList(cmd, rows, uiNm, cmdNm)    { return global.boApi.post('/bo/ec/od/order/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
    /* MD 대리주문 저장 — 주문 + 주문항목 동시 (body: ProxyOrderRequest) */
    saveProxy(body, uiNm, cmdNm)        { return global.boApi.post('/bo/ec/od/order/save-proxy', body, hdr(uiNm, cmdNm)); },
    /* 추가결제 요청 (body: { orderId, memberId, amount, reason }) */
    requestExtraPay(body, uiNm, cmdNm)  { return global.boApi.post('/bo/ec/od/order/extra-pay', body, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 주문항목 ──────────────────────────────────────────── */
  boApiSvc.odOrderItem = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/ec/od/order-item/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)      { return global.boApi.get('/bo/ec/od/order-item',      { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/od/order-item/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 묶음상품 ───────────────────────────────────────────── */
  boApiSvc.pdBundle = {
    getPage(params, uiNm, cmdNm, opt)        { return global.boApi.get(   '/bo/ec/pd/bundle/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getItems(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod-bundle/${_id}/items`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/pd/prod-bundle', body, hdr(uiNm, cmdNm)); },
    updateItems(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod-bundle/${_id}/items`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod-bundle/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 카테고리 ───────────────────────────────────────────── */
  boApiSvc.pdCategory = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pd/category/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pd/category', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/category/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/category', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/category/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/category/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return chkRowIds(rows, 'categoryId', uiNm, cmdNm) || global.boApi.post('/bo/ec/pd/category/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
    getProds(params, uiNm, cmdNm)  { return global.boApi.get(   '/bo/ec/pd/category-prod/page', { params, ...hdr(uiNm, cmdNm) }); },
    updateProds(body, uiNm, cmdNm) { return global.boApi.put(   '/bo/ec/pd/category-prod', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 배송템플릿 ─────────────────────────────────────────── */
  boApiSvc.pdDlivTmplt = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/pd/dliv-tmplt/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    save(_id, body, uiNm, cmdNm) {
      return _id
        ? global.boApi.put(  `/bo/ec/pd/dliv-tmplt/${_id}`, body, hdr(uiNm, cmdNm))
        : global.boApi.post( '/bo/ec/pd/dliv-tmplt', body, hdr(uiNm, cmdNm));
    },
    remove(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/dliv-tmplt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  boApiSvc.pdProd = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}`, hdr(uiNm, cmdNm)); },
    getImages(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/images`,   hdr(uiNm, cmdNm)); },
    getOpts(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/opts`,     hdr(uiNm, cmdNm)); },
    getSkus(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/skus`,     hdr(uiNm, cmdNm)); },
    getContents(_id, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/contents`, hdr(uiNm, cmdNm)); },
    saveContents(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/prod/${_id}/contents`, body, hdr(uiNm, cmdNm)); },
    updateSortOrds(_id, list, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.patch(`/bo/ec/pd/prod/${_id}/contents/sort`, { list }, hdr(uiNm, cmdNm)); },
    saveOpts(_id, body, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/prod/${_id}/opts`,     body, hdr(uiNm, cmdNm)); },
    saveImages(_id, body, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/prod/${_id}/images`,   body, hdr(uiNm, cmdNm)); },
    getRels(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/rels`,     hdr(uiNm, cmdNm)); },
    getPlans(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/plans`,    hdr(uiNm, cmdNm)); },
    savePlans(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/prod/${_id}/plans`,    body, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/prod', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: Q&A ────────────────────────────────────────────────── */
  boApiSvc.pdQna = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pd/qna/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/qna/${_id}`, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/qna/${_id}`, body, hdr(uiNm, cmdNm)); },
    answer(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/qna/${_id}/answer`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/qna/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 재입고알림 ─────────────────────────────────────────── */
  boApiSvc.pdRestockNoti = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/pd/restock-noti/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    send(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/restock-noti/send', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 리뷰 ───────────────────────────────────────────────── */
  boApiSvc.pdReview = {
    getPage(params, uiNm, cmdNm, opt)         { return global.boApi.get('/bo/ec/pd/review/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    updateStatus(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/review/${_id}/status`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 세트상품 ───────────────────────────────────────────── */
  boApiSvc.pdSet = {
    getPage(params, uiNm, cmdNm, opt)         { return global.boApi.get(   '/bo/ec/pd/prod-set/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getItems(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod-set/${_id}/items`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/pd/prod-set', body, hdr(uiNm, cmdNm)); },
    updateItems(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod-set/${_id}/items`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod-set/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 태그 ───────────────────────────────────────────────── */
  boApiSvc.pdTag = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pd/tag/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/tag', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/tag/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/tag/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return chkRowIds(rows, 'tagId', uiNm, cmdNm) || global.boApi.post('/bo/ec/pd/tag/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 캐시 ───────────────────────────────────────────────── */
  boApiSvc.pmCache = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/cache/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/cache/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/cache', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/cache/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/cache/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰 ───────────────────────────────────────────────── */
  boApiSvc.pmCoupon = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/coupon/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/coupon/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/coupon', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/coupon/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/coupon/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰 대상상품 ─────────────────────────────────────── */
  boApiSvc.pmCouponItem = {
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/coupon/items', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/coupon/items', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/coupon/items/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰사용내역 ───────────────────────────────────────── */
  boApiSvc.pmCouponUsage = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/pm/coupon-usage/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── pm: 할인 ───────────────────────────────────────────────── */
  boApiSvc.pmDiscnt = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/discnt/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/discnt/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/discnt', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/discnt/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/discnt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 할인 대상상품 ─────────────────────────────────────── */
  boApiSvc.pmDiscntItem = {
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/discnt/items', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/discnt/items', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/discnt/items/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 할인사용내역 ───────────────────────────────────────── */
  boApiSvc.pmDiscntUsage = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/pm/discnt-usage/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  boApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/event/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/event', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/event/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/event/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 사은품 ─────────────────────────────────────────────── */
  boApiSvc.pmGift = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/gift/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/gift/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/gift', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/gift/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/gift/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 사은품 조건 (상품연결) ──────────────────────────────── */
  boApiSvc.pmGiftCond = {
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/gift/gift-cond', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/gift/gift-cond', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/gift/gift-cond/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 기획전 ─────────────────────────────────────────────── */
  boApiSvc.pmPlan = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/plan/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/plan/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/plan', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/plan/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/plan/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 적립금 ─────────────────────────────────────────────── */
  boApiSvc.pmSave = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/pm/save/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/save/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/save', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/save/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/save/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 적립금 대상상품 ───────────────────────────────────── */
  boApiSvc.pmSaveItem = {
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/save/items', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/save/items', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/save/items/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 적립금사용내역 ─────────────────────────────────────── */
  boApiSvc.pmSaveUsage = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/pm/save-usage/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── pm: 바우처 ─────────────────────────────────────────────── */
  boApiSvc.pmVoucher = {
    getPage(params, uiNm, cmdNm, opt)    { return global.boApi.get(   '/bo/ec/pm/voucher/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/voucher/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)       { return global.boApi.post(  '/bo/ec/pm/voucher', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/voucher/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/voucher/${_id}`, hdr(uiNm, cmdNm)); },
    sendSns(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/ec/pm/voucher/${_id}/send-sns`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 배송수수료정책 ─────────────────────────────────────── */
  boApiSvc.stDlivFeePolicy = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/st/dliv-fee-policy/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    saveList(cmd, rows, uiNm, cmdNm)  { return global.boApi.post(  `/bo/ec/st/dliv-fee-policy/save-list/${cmd}`, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산설정 ───────────────────────────────────────────── */
  boApiSvc.stSettleConfig = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/st/config/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/config', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/config/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/config/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산마스터 ─────────────────────────────────────────── */
  boApiSvc.stSettle = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/st/settle/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/st/settle/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산원장 ───────────────────────────────────────────── */
  boApiSvc.stSettleRaw = {
    getPage(params, uiNm, cmdNm, opt)        { return global.boApi.get(   '/bo/ec/st/raw/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/ec/st/raw/${_id}`, hdr(uiNm, cmdNm)); },
    /* orderId 기준 정산원장 목록 조회 (칸반 등 주문 기반 화면용) */
    getByOrderId(orderId, uiNm, cmdNm)  { return global.boApi.get(   '/bo/ec/st/raw/page', { params: { orderId, pageSize: 100 }, ...hdr(uiNm, cmdNm) }); },
    collect(body, uiNm, cmdNm)          { return global.boApi.post(  '/bo/ec/st/raw/collect', body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산조정 ───────────────────────────────────────────── */
  boApiSvc.stSettleAdj = {
    getPage(params, uiNm, cmdNm, opt)    { return global.boApi.get(   '/bo/ec/st/adj/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)       { return global.boApi.post(  '/bo/ec/st/adj', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/adj/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/adj/${_id}`, hdr(uiNm, cmdNm)); },
    approve(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/adj/${_id}/approve`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산기타조정 ───────────────────────────────────────── */
  boApiSvc.stSettleEtcAdj = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/st/etc-adj/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/etc-adj', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/etc-adj/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/etc-adj/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산지급 ───────────────────────────────────────────── */
  boApiSvc.stSettlePay = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/st/pay/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    pay(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/pay/${_id}/pay`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산마감 ───────────────────────────────────────────── */
  boApiSvc.stSettleClose = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/ec/st/close/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/close', body, hdr(uiNm, cmdNm)); },
    reopen(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/close/${_id}/reopen`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산대사 ───────────────────────────────────────────── */
  boApiSvc.stRecon = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/ec/st/recon/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── st: ERP 정산 ───────────────────────────────────────────── */
  boApiSvc.stErp = {
    getGenPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/st/erp/gen/page', { params, ...hdr(uiNm, cmdNm) }); },
    getReconPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/st/erp/recon/page', { params, ...hdr(uiNm, cmdNm) }); },
    gen(body, uiNm, cmdNm)            { return global.boApi.post(  '/bo/ec/st/erp/gen', body, hdr(uiNm, cmdNm)); },
    resend(_id, body, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/ec/st/erp/resend/${_id}`, body, hdr(uiNm, cmdNm)); },
    fixRecon(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/erp/recon/${_id}/fix`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 알람 ───────────────────────────────────────────────── */
  boApiSvc.syAlarm = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/alarm/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/alarm/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/alarm/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/alarm', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/alarm/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/alarm/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 첨부파일 ───────────────────────────────────────────── */
  boApiSvc.syAttach = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/attach/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/attach/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 배치 ───────────────────────────────────────────────── */
  boApiSvc.syBatch = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/batch/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/batch/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return global.boApi.get(   `/bo/sy/batch/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/batch', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return global.boApi.put(   `/bo/sy/batch/${_id}`, body, hdr(uiNm, cmdNm)); },
    run(body, uiNm, cmdNm)         { return global.boApi.post(  '/bo/sy/batch/run', body, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return global.boApi.post('/bo/sy/batch/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 배치이력 ───────────────────────────────────────────── */
  boApiSvc.syBatchLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/batch-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/batch-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 게시판 ─────────────────────────────────────────────── */
  boApiSvc.syBbs = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/bbs/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/bbs/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/bbs', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/bbs/${_id}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 게시판모드(BBM) ────────────────────────────────────── */
  boApiSvc.syBbm = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/bbm/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/bbm/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/bbm/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/bbm', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/bbm/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/bbm/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 브랜드 ─────────────────────────────────────────────── */
  boApiSvc.syBrand = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/brand/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/brand/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    saveList(cmd, rows, uiNm, cmdNm)  { return chkRowIds(rows, 'brandId', uiNm, cmdNm) || global.boApi.post('/bo/sy/brand/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드그룹 ──────────────────────────────────────── */
  boApiSvc.syCodeGrp = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/code-grp/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getAll(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/code-grp', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(cmd, rows, uiNm, cmdNm) { return chkRowIds(rows, 'codeGrp', uiNm, cmdNm) || global.boApi.post('/bo/sy/code-grp/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드 ───────────────────────────────────────────── */
  boApiSvc.syCode = {
    getAll(params, uiNm, cmdNm)    { return global.boApi.get(   '/bo/sy/code', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/code/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/code/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/code', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/code/${_id}`, body, hdr(uiNm, cmdNm)); },
    /* 일괄저장 — cmd='base' 기본, 'order' 등 변형. URL: /save-list[/${cmd}] */
    saveList(cmd, rows, uiNm, cmdNm) { return chkRowIds(rows, 'codeId', uiNm, cmdNm) || global.boApi.post('/bo/sy/code/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 문의(Contact) ──────────────────────────────────────── */
  boApiSvc.syContact = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/contact/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/contact/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/contact', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/contact/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/contact/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 부서 ───────────────────────────────────────────────── */
  /* ── sy: 엑셀다운로드 ────────────────────────────────────────
     domain 은 백엔드 ExcelDomainConfig 에 등록된 key (예: memberLoginLog).
     즉시(sync)는 coUtil.cofDownloadExcel 이 blob 스트리밍 + 3분 타임아웃으로 처리한다. */
  boApiSvc.syExceldown = {
    /* [엑셀] 클릭 시 — 진행중 건/대기열/대상건수/임계값을 한 번에 받아 버튼 상태를 결정 */
    getStatus(domain, params, uiNm, cmdNm) { return global.boApi.get(`/bo/exceldown/status/${domain}`, { params, ...hdr(uiNm, cmdNm) }); },
    /* 즉시 다운로드 — 파일 응답이라 axios 래퍼 대신 전용 헬퍼 사용 */
    downloadSync(domain, params, areaNm, uiNm, cmdNm) {
      return global.coUtil.cofDownloadExcel(`/bo/exceldown/sync/${domain}`, params, areaNm, uiNm, cmdNm || '엑셀다운로드');
    },
    /* 예약 접수 — WAITING 등록 후 즉시 반환 (실제 생성은 스케줄러가 수행) */
    requestAsync(domain, params, uiNm, cmdNm) { return global.boApi.post(`/bo/exceldown/async/${domain}`, null, { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)  { return global.boApi.get('/bo/exceldown/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/exceldown/${_id}`, hdr(uiNm, cmdNm)); },
    cancel(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.post(`/bo/exceldown/${_id}/cancel`, null, hdr(uiNm, cmdNm)); },
    markDownloaded(_id, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.post(`/bo/exceldown/${_id}/downloaded`, null, hdr(uiNm, cmdNm)); },
  };

  boApiSvc.syDept = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/dept/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/dept', { params, ...hdr(uiNm, cmdNm) }); },
    getTree(uiNm, cmdNm)         { return global.boApi.get(   '/bo/sy/dept/tree', hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)  { return chkRowIds(rows, 'deptId', uiNm, cmdNm) || global.boApi.post('/bo/sy/dept/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: i18n 다국어 ────────────────────────────────────────── */
  boApiSvc.syI18n = {
    getPage(params, uiNm, cmdNm, opt)       { return global.boApi.get(   '/bo/sy/i18n/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    updateMsgs(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/i18n/${_id}/msgs`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 알림함 (상단 종) ────────────────────────────────────
   * 수신자 조건(recvTypeCd='USER' + 로그인 사용자ID)은 서버에서 강제 주입한다.
   * 오류 알림은 DB 에 저장하지 않고 브라우저에만 쌓인다 (coNotiStore 참조). */
  boApiSvc.syNoti = {
    getMyList(params, uiNm, cmdNm)   { return global.boApi.get('/bo/sy/noti/my', { params, ...hdr(uiNm, cmdNm) }); },
    getMyPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/sy/noti/my/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getMyUnreadCount(uiNm, cmdNm)    { return global.boApi.get('/bo/sy/noti/my/unread-count', hdr(uiNm, cmdNm)); },
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/sy/noti/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/noti/${_id}`, hdr(uiNm, cmdNm)); },
    send(body, uiNm, cmdNm)          { return global.boApi.post('/bo/sy/noti/send', body, hdr(uiNm, cmdNm)); },
    markRead(_id, readYn, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.patch(`/bo/sy/noti/${_id}/read`, { readYn }, hdr(uiNm, cmdNm)); },
    markAllRead(uiNm, cmdNm)         { return global.boApi.post('/bo/sy/noti/my/read-all', {}, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/noti/${_id}`, hdr(uiNm, cmdNm)); },
    removeMyAll(uiNm, cmdNm)         { return global.boApi.delete('/bo/sy/noti/my/all', hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 메뉴 ───────────────────────────────────────────────── */
  boApiSvc.syMenu = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/menu/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/menu/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/menu', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(cmd, rows, uiNm, cmdNm)  { return chkRowIds(rows, 'menuId', uiNm, cmdNm) || global.boApi.post('/bo/sy/menu/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 표시경로 ───────────────────────────────────────────── */
  boApiSvc.syPath = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/path/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/path', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/path/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/path/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)    { return chkRowIds(rows, 'pathId', uiNm, cmdNm) || global.boApi.post('/bo/sy/path/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 시스템속성 ─────────────────────────────────────────── */
  boApiSvc.syProp = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/prop/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/prop', { params, ...hdr(uiNm, cmdNm) }); },
    /* opt: axios config 추가 옵션. 예) { isProgress: false } — 진행 오버레이 미표시(무한 스크롤 추가 조회) */
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/prop/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    saveList(cmd, rows, uiNm, cmdNm)  { return chkRowIds(rows, 'propId', uiNm, cmdNm) || global.boApi.post('/bo/sy/prop/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할 ───────────────────────────────────────────────── */
  boApiSvc.syRole = {
    getPage(params, uiNm, cmdNm, opt)      { return global.boApi.get(   '/bo/sy/role/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)      { return global.boApi.get(   '/bo/sy/role', { params, ...hdr(uiNm, cmdNm) }); },
    getMenus(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/role/${_id}/menus`, hdr(uiNm, cmdNm)); },
    getUsers(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/role/${_id}/users`, hdr(uiNm, cmdNm)); },
    saveMenus(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/sy/role/${_id}/menus`, body, hdr(uiNm, cmdNm)); },
    saveUsers(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/sy/role/${_id}/users`, body, hdr(uiNm, cmdNm)); },
    saveList(cmd, rows, uiNm, cmdNm)       { return chkRowIds(rows, 'roleId', uiNm, cmdNm) || global.boApi.post('/bo/sy/role/save-list/' + cmd, rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할메뉴 ───────────────────────────────────────────── */
  boApiSvc.syRoleMenu = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/role-menu/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
  };

  /* ── sy: 사이트 ─────────────────────────────────────────────── */
  boApiSvc.sySite = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/site/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/site/${_id}`, hdr(uiNm, cmdNm)); },
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/site/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/site', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/site/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/site/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 템플릿 ─────────────────────────────────────────────── */
  boApiSvc.syTemplate = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/template/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/template/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/template/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/template', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/template/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/template/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 (관리자 계정) ───────────────────────────────── */
  boApiSvc.syUser = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/user/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/user', { params, ...hdr(uiNm, cmdNm) }); },
    getDeptTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user/dept-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/user/${_id}`, hdr(uiNm, cmdNm)); },
    getRoles(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/user/${_id}/roles`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/user', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/user/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/user/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 로그인이력 ─────────────────────────────────── */
  boApiSvc.syUserLoginLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/sy/user-login-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/user-login-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 토큰이력 ────────────────────────────────────── */
  boApiSvc.syUserTokenLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get('/bo/sy/user-token-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/user-token-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: API요청로그 ────────────────────────────────────────── */
  boApiSvc.syAccessLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/access-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/access-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: API오류로그 ────────────────────────────────────────── */
  boApiSvc.syAccessErrorLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/access-error-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/access-error-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 알림 발송이력 (syh_alarm_send_hist) ─────────────────── */
  boApiSvc.syAlarmSendHist = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/alarm-send-hist/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/alarm-send-hist/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 메일 발송이력 (syh_send_email_log) ──────────────────── */
  boApiSvc.sySendEmailLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/send-email-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/send-email-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 메시지 발송이력 (syh_send_msg_log, SMS·카카오) ──────── */
  boApiSvc.sySendMsgLog = {
    getPage(params, uiNm, cmdNm, opt) { return global.boApi.get(   '/bo/sy/send-msg-log/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(`/bo/sy/send-msg-log/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 업체(Vendor) ───────────────────────────────────────── */
  boApiSvc.syVendor = {
    getPathTreeNodeCounts(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/vendor/path-counts', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/vendor/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/vendor/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/vendor', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/vendor/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/vendor/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 업체사용자 ─────────────────────────────────────────── */
  boApiSvc.syVendorUser = {
    getPage(params, uiNm, cmdNm, opt)   { return global.boApi.get(   '/bo/sy/vendor-user/page', { params, ...hdr(uiNm, cmdNm), ...(opt || {}) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/vendor-user', { params, ...hdr(uiNm, cmdNm) }); },
    getRoles(params, uiNm, cmdNm)  { return global.boApi.get(   '/bo/sy/vendor-user-role', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/vendor-user', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/vendor-user/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/vendor-user/${_id}`, hdr(uiNm, cmdNm)); },
    addRole(body, uiNm, cmdNm)     { return global.boApi.post(  '/bo/sy/vendor-user-role', body, hdr(uiNm, cmdNm)); },
    removeRole(_id, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/vendor-user-role/${_id}`, hdr(uiNm, cmdNm)); },
  };

  boApiSvc.zdSimulLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/zd/simul/log/page', { params, ...hdr(uiNm || '시뮬레이터', cmdNm || '로그조회') }); },
    save(body, uiNm, cmdNm)      { return global.boApi.post('/bo/zd/simul/log/save', body, hdr(uiNm || '시뮬레이터', cmdNm || '로그저장')); },
  };

  global.boApiSvc = boApiSvc;
})(window);

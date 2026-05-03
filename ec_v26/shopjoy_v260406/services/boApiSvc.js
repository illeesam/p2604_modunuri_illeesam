/**
 * boApiSvc.js — Back Office 전용 공통 API 서비스
 *
 * 모든 API 엔드포인트(GET/POST/PUT/DELETE)를 이 파일에 등록하여 중앙 관리한다.
 *
 * 선행 로드: utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await boApiSvc.mbMember.getPage({ kw: '홍길동' }, '회원관리', '목록조회');
 *   const res = await boApiSvc.mbMember.create(body, '회원관리', '등록');
 *   const res = await boApiSvc.mbMember.update(_id, body, '회원관리', '저장');
 *   const res = await boApiSvc.mbMember.remove(_id, '회원관리', '삭제');
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  /* _id / saveList rows 검증은 coUtil.chkId / coUtil.chkRowIds 위임 */
  const chkId     = (...a) => coUtil.chkId(...a);
  const chkRowIds = (...a) => coUtil.chkRowIds(...a);

  const boApiSvc = {};

  /* ── cm: 블로그 ─────────────────────────────────────────────── */
  boApiSvc.cmBlog = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/cm/blog/page', { params, ...hdr(uiNm, cmdNm) }); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/blog/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/blog/${_id}`, hdr(uiNm, cmdNm)); },
    setUse(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/blog/${_id}/use`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 채팅 ───────────────────────────────────────────────── */
  boApiSvc.cmChatt = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/cm/chatt/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/chatt/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)    { return global.boApi.post(  '/bo/ec/cm/chatt', body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/chatt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 공지사항 ───────────────────────────────────────────── */
  boApiSvc.cmNotice = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/cm/notice/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/cm/notice/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/cm/notice', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/cm/notice/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/cm/notice/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시영역 ───────────────────────────────────────────── */
  boApiSvc.dpArea = {
    getPage(params, uiNm, cmdNm)     { return global.boApi.get(   '/bo/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/dp/area/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)        { return global.boApi.post(  '/bo/ec/dp/area', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/area/${_id}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시패널 ───────────────────────────────────────────── */
  boApiSvc.dpPanel = {
    getPage(params, uiNm, cmdNm)     { return global.boApi.get(   '/bo/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) }); },
    getBasePage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/dp/panel/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/panel/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)        { return global.boApi.post(  '/bo/ec/dp/panel', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/panel/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)         { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/panel/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시위젯 ───────────────────────────────────────────── */
  boApiSvc.dpWidget = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/dp/widget/page', { params, ...hdr(uiNm, cmdNm) }); },
    remove(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/widget/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 전시연관자원 ───────────────────────────────────────── */
  boApiSvc.dpResource = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/resource/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── dp: 전시UI ─────────────────────────────────────────────── */
  boApiSvc.dpUi = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/dp/ui/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/dp/ui', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/ui/${_id}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── dp: 위젯라이브러리 ─────────────────────────────────────── */
  boApiSvc.dpWidgetLib = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/dp/widget-lib/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/dp/widget-lib/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/dp/widget-lib', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/dp/widget-lib/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/dp/widget-lib/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 고객종합정보 ───────────────────────────────────────── */
  boApiSvc.mbCustInfo = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/mb/cust-info/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── mb: 회원등급 ───────────────────────────────────────────── */
  boApiSvc.mbMemGrade = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/mb/member-grade/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member-grade', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member-grade/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member-grade/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)    { return chkRowIds(rows, 'gradeId', uiNm, cmdNm) || global.boApi.post(  '/bo/ec/mb/member-grade/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원그룹 ───────────────────────────────────────────── */
  boApiSvc.mbMemGroup = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/mb/member-group/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member-group', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member-group/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member-group/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)    { return chkRowIds(rows, 'groupId', uiNm, cmdNm) || global.boApi.post(  '/bo/ec/mb/member-group/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 ───────────────────────────────────────────────── */
  boApiSvc.mbMember = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/mb/member/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/mb/member', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/mb/member/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/mb/member', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/mb/member/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/mb/member/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── mb: 회원 로그인이력 ────────────────────────────────────── */
  boApiSvc.mbMemberLoginLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member-login-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── mb: 회원 토큰이력 ──────────────────────────────────────── */
  boApiSvc.mbMemberTokenLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/ec/mb/member-token-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── od: 장바구니 ──────────────────────────────────────────── */
  boApiSvc.odCart = {
    getPage(params, uiNm, cmdNm)  { return global.boApi.get(   '/bo/ec/od/cart/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/cart/${_id}`, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/cart/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 클레임 ─────────────────────────────────────────────── */
  boApiSvc.odClaim = {
    getPage(params, uiNm, cmdNm)       { return global.boApi.get(   '/bo/ec/od/claim/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/claim/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)          { return global.boApi.post(  '/bo/ec/od/claim', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/claim/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/claim/${_id}`, hdr(uiNm, cmdNm)); },
    bulkStatus(body, uiNm, cmdNm)      { return global.boApi.put(   '/bo/ec/od/claim/bulk-status', body, hdr(uiNm, cmdNm)); },
    bulkType(body, uiNm, cmdNm)        { return global.boApi.put(   '/bo/ec/od/claim/bulk-type', body, hdr(uiNm, cmdNm)); },
    bulkApproval(body, uiNm, cmdNm)    { return global.boApi.put(   '/bo/ec/od/claim/bulk-approval', body, hdr(uiNm, cmdNm)); },
    bulkApprovalReq(body, uiNm, cmdNm) { return global.boApi.put(   '/bo/ec/od/claim/bulk-approvalReq', body, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 배송 ───────────────────────────────────────────────── */
  boApiSvc.odDliv = {
    getPage(params, uiNm, cmdNm)       { return global.boApi.get(   '/bo/ec/od/dliv/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/dliv/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)          { return global.boApi.post(  '/bo/ec/od/dliv', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/dliv/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/dliv/${_id}`, hdr(uiNm, cmdNm)); },
    bulkStatus(body, uiNm, cmdNm)      { return global.boApi.put(   '/bo/ec/od/dliv/bulk-status', body, hdr(uiNm, cmdNm)); },
    bulkCourier(body, uiNm, cmdNm)     { return global.boApi.put(   '/bo/ec/od/dliv/bulk-courier', body, hdr(uiNm, cmdNm)); },
    bulkApproval(body, uiNm, cmdNm)    { return global.boApi.put(   '/bo/ec/od/dliv/bulk-approval', body, hdr(uiNm, cmdNm)); },
    bulkApprovalReq(body, uiNm, cmdNm) { return global.boApi.put(   '/bo/ec/od/dliv/bulk-approvalReq', body, hdr(uiNm, cmdNm)); },
  };

  /* ── od: 주문 ───────────────────────────────────────────────── */
  boApiSvc.odOrder = {
    getPage(params, uiNm, cmdNm)        { return global.boApi.get(   '/bo/ec/od/order/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)           { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/od/order/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/od/order', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/od/order/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/od/order/${_id}`, hdr(uiNm, cmdNm)); },
    bulkAction(path, body, uiNm, cmdNm) { return global.boApi.put(   path, body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 묶음상품 ───────────────────────────────────────────── */
  boApiSvc.pdBundle = {
    getPage(params, uiNm, cmdNm)        { return global.boApi.get(   '/bo/ec/pd/bundle/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/pd/prod-bundle', body, hdr(uiNm, cmdNm)); },
    updateItems(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod-bundle/${_id}/items`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod-bundle/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 카테고리 ───────────────────────────────────────────── */
  boApiSvc.pdCategory = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pd/category/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pd/category', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/category/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/category', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/category/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/category/${_id}`, hdr(uiNm, cmdNm)); },
    getProds(params, uiNm, cmdNm)  { return global.boApi.get(   '/bo/ec/pd/category-prod/page', { params, ...hdr(uiNm, cmdNm) }); },
    updateProds(body, uiNm, cmdNm) { return global.boApi.put(   '/bo/ec/pd/category-prod', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 배송템플릿 ─────────────────────────────────────────── */
  boApiSvc.pdDlivTmplt = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/pd/dliv-tmplt/page', { params, ...hdr(uiNm, cmdNm) }); },
    save(_id, body, uiNm, cmdNm) {
      return _id
        ? global.boApi.put(  `/bo/ec/pd/dliv-tmplt/${_id}`, body, hdr(uiNm, cmdNm))
        : global.boApi.post( '/bo/ec/pd/dliv-tmplt', body, hdr(uiNm, cmdNm));
    },
    remove(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/dliv-tmplt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  boApiSvc.pdProd = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}`, hdr(uiNm, cmdNm)); },
    getImages(_id, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/images`,   hdr(uiNm, cmdNm)); },
    getOpts(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/opts`,     hdr(uiNm, cmdNm)); },
    getSkus(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/skus`,     hdr(uiNm, cmdNm)); },
    getContents(_id, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/contents`, hdr(uiNm, cmdNm)); },
    getRels(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pd/prod/${_id}/rels`,     hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/prod', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: Q&A ────────────────────────────────────────────────── */
  boApiSvc.pdQna = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/pd/qna/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── pd: 재입고알림 ─────────────────────────────────────────── */
  boApiSvc.pdRestockNoti = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/pd/restock-noti/page', { params, ...hdr(uiNm, cmdNm) }); },
    send(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/restock-noti/send', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 리뷰 ───────────────────────────────────────────────── */
  boApiSvc.pdReview = {
    getPage(params, uiNm, cmdNm)         { return global.boApi.get('/bo/ec/pd/review/page', { params, ...hdr(uiNm, cmdNm) }); },
    updateStatus(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(`/bo/ec/pd/review/${_id}/status`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 세트상품 ───────────────────────────────────────────── */
  boApiSvc.pdSet = {
    create(body, uiNm, cmdNm)           { return global.boApi.post(  '/bo/ec/pd/prod-set', body, hdr(uiNm, cmdNm)); },
    updateItems(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/prod-set/${_id}/items`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)            { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/prod-set/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 태그 ───────────────────────────────────────────────── */
  boApiSvc.pdTag = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pd/tag/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pd/tag', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pd/tag/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pd/tag/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)    { return chkRowIds(rows, 'tagId', uiNm, cmdNm) || global.boApi.post(  '/bo/ec/pd/tag/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 캐시 ───────────────────────────────────────────────── */
  boApiSvc.pmCache = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/cache/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/cache/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/cache', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/cache/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/cache/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰 ───────────────────────────────────────────────── */
  boApiSvc.pmCoupon = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/coupon/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/coupon/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/coupon', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/coupon/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/coupon/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 쿠폰사용내역 ───────────────────────────────────────── */
  boApiSvc.pmCouponUsage = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/ec/pm/coupon-usage/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── pm: 할인 ───────────────────────────────────────────────── */
  boApiSvc.pmDiscnt = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/discnt/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/discnt/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/discnt', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/discnt/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/discnt/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  boApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/event/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/event', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/event/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/event/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 사은품 ─────────────────────────────────────────────── */
  boApiSvc.pmGift = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/gift/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/gift/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/gift', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/gift/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/gift/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 기획전 ─────────────────────────────────────────────── */
  boApiSvc.pmPlan = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/plan/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/plan/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/plan', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/plan/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/plan/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 적립금 ─────────────────────────────────────────────── */
  boApiSvc.pmSave = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/ec/pm/save/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/save/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/pm/save', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/save/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/save/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── pm: 바우처 ─────────────────────────────────────────────── */
  boApiSvc.pmVoucher = {
    getPage(params, uiNm, cmdNm)    { return global.boApi.get(   '/bo/ec/pm/voucher/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/ec/pm/voucher/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)       { return global.boApi.post(  '/bo/ec/pm/voucher', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/pm/voucher/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/pm/voucher/${_id}`, hdr(uiNm, cmdNm)); },
    sendSns(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/ec/pm/voucher/${_id}/send-sns`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산설정 ───────────────────────────────────────────── */
  boApiSvc.stSettleConfig = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/base/ec/st/settle-config/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/config', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/config/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/config/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산원장 ───────────────────────────────────────────── */
  boApiSvc.stSettleRaw = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/st/settle-raw/page', { params, ...hdr(uiNm, cmdNm) }); },
    collect(body, uiNm, cmdNm)   { return global.boApi.post(  '/bo/ec/st/raw/collect', body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산조정 ───────────────────────────────────────────── */
  boApiSvc.stSettleAdj = {
    getPage(params, uiNm, cmdNm)    { return global.boApi.get(   '/base/ec/st/settle-adj/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)       { return global.boApi.post(  '/bo/ec/st/adj', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/adj/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/adj/${_id}`, hdr(uiNm, cmdNm)); },
    approve(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/adj/${_id}/approve`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산기타조정 ───────────────────────────────────────── */
  boApiSvc.stSettleEtcAdj = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/base/ec/st/settle-etc-adj/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/etc-adj', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/etc-adj/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/ec/st/etc-adj/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산지급 ───────────────────────────────────────────── */
  boApiSvc.stSettlePay = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/st/settle-pay/page', { params, ...hdr(uiNm, cmdNm) }); },
    pay(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/pay/${_id}/pay`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산마감 ───────────────────────────────────────────── */
  boApiSvc.stSettleClose = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/base/ec/st/settle-close/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/ec/st/close', body, hdr(uiNm, cmdNm)); },
    reopen(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/close/${_id}/reopen`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── st: 정산대사 ───────────────────────────────────────────── */
  boApiSvc.stRecon = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/st/recon/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── st: ERP 정산 ───────────────────────────────────────────── */
  boApiSvc.stErp = {
    getGenPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/base/ec/st/erp-gen/page', { params, ...hdr(uiNm, cmdNm) }); },
    getReconPage(params, uiNm, cmdNm) { return global.boApi.get(   '/base/ec/st/erp-recon/page', { params, ...hdr(uiNm, cmdNm) }); },
    gen(body, uiNm, cmdNm)            { return global.boApi.post(  '/bo/ec/st/erp/gen', body, hdr(uiNm, cmdNm)); },
    resend(_id, body, uiNm, cmdNm)    { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/ec/st/erp/resend/${_id}`, body, hdr(uiNm, cmdNm)); },
    fixRecon(_id, body, uiNm, cmdNm)  { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/ec/st/erp/recon/${_id}/fix`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 알람 ───────────────────────────────────────────────── */
  boApiSvc.syAlarm = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/alarm/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/alarm/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/alarm', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/alarm/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/alarm/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 첨부파일 ───────────────────────────────────────────── */
  boApiSvc.syAttach = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/attach/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 첨부파일그룹 ───────────────────────────────────────── */
  boApiSvc.syAttachGrp = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/attach-grp/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 배치 ───────────────────────────────────────────────── */
  boApiSvc.syBatch = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/batch/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return global.boApi.get(   `/bo/sy/batch/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/batch', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return global.boApi.put(   `/bo/sy/batch/${_id}`, body, hdr(uiNm, cmdNm)); },
    run(body, uiNm, cmdNm)         { return global.boApi.post(  '/bo/sy/batch/run', body, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)    { return global.boApi.post(  '/bo/sy/batch/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 배치이력 ───────────────────────────────────────────── */
  boApiSvc.syBatchLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/batch-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 게시판 ─────────────────────────────────────────────── */
  boApiSvc.syBbs = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/bbs/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/bbs/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/bbs', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/bbs/${_id}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 게시판모드(BBM) ────────────────────────────────────── */
  boApiSvc.syBbm = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/bbm/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/bbm/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/bbm', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/bbm/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/bbm/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 브랜드 ─────────────────────────────────────────────── */
  boApiSvc.syBrand = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/brand/page', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm)  { return chkRowIds(rows, 'brandId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/brand/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드그룹 ──────────────────────────────────────── */
  boApiSvc.syCodeGrp = {
    getAll(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/code-grp', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm) { return chkRowIds(rows, 'codeGrp', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/code-grp/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드 ───────────────────────────────────────────── */
  boApiSvc.syCode = {
    getAll(params, uiNm, cmdNm)    { return global.boApi.get(   '/bo/sy/code', { params, ...hdr(uiNm, cmdNm) }); },
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/code/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/code/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/code', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/code/${_id}`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 문의(Contact) ──────────────────────────────────────── */
  boApiSvc.syContact = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/contact/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/contact/${_id}`, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/contact/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/contact/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 부서 ───────────────────────────────────────────────── */
  boApiSvc.syDept = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/dept/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/dept', { params, ...hdr(uiNm, cmdNm) }); },
    getTree(uiNm, cmdNm)         { return global.boApi.get(   '/bo/sy/dept/tree', hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)  { return chkRowIds(rows, 'deptId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/dept/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: i18n 다국어 ────────────────────────────────────────── */
  boApiSvc.syI18n = {
    getPage(params, uiNm, cmdNm)       { return global.boApi.get(   '/bo/sy/i18n/page', { params, ...hdr(uiNm, cmdNm) }); },
    getMsgs(_id, uiNm, cmdNm)          { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/i18n/${_id}/msgs`, hdr(uiNm, cmdNm)); },
    updateMsgs(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/i18n/${_id}/msgs`, body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 메뉴 ───────────────────────────────────────────────── */
  boApiSvc.syMenu = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/menu/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/menu', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm)  { return chkRowIds(rows, 'menuId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/menu/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 표시경로 ───────────────────────────────────────────── */
  boApiSvc.syPath = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/path/page', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/path', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/path/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/path/${_id}`, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)    { return chkRowIds(rows, 'pathId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/path/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 시스템속성 ─────────────────────────────────────────── */
  boApiSvc.syProp = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/prop/page', { params, ...hdr(uiNm, cmdNm) }); },
    saveList(rows, uiNm, cmdNm)  { return chkRowIds(rows, 'propId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/prop/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할 ───────────────────────────────────────────────── */
  boApiSvc.syRole = {
    getPage(params, uiNm, cmdNm)      { return global.boApi.get(   '/bo/sy/role/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm)      { return global.boApi.get(   '/bo/sy/role', { params, ...hdr(uiNm, cmdNm) }); },
    getMenus(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/role/${_id}/menus`, hdr(uiNm, cmdNm)); },
    getUsers(_id, uiNm, cmdNm)        { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/role/${_id}/users`, hdr(uiNm, cmdNm)); },
    saveMenus(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/sy/role/${_id}/menus`, body, hdr(uiNm, cmdNm)); },
    saveUsers(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.post(  `/bo/sy/role/${_id}/users`, body, hdr(uiNm, cmdNm)); },
    saveList(rows, uiNm, cmdNm)       { return chkRowIds(rows, 'roleId', uiNm, cmdNm) || global.boApi.post(  '/bo/sy/role/save-list', rows, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 역할메뉴 ───────────────────────────────────────────── */
  boApiSvc.syRoleMenu = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/role-menu/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 사이트 ─────────────────────────────────────────────── */
  boApiSvc.sySite = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/site/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/site/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/site', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/site/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/site/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 템플릿 ─────────────────────────────────────────────── */
  boApiSvc.syTemplate = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/template/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/template/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/template', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/template/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/template/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 (관리자 계정) ───────────────────────────────── */
  boApiSvc.syUser = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/user/page', { params, ...hdr(uiNm, cmdNm) }); },
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/user', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/user/${_id}`, hdr(uiNm, cmdNm)); },
    getRoles(_id, uiNm, cmdNm)     { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/user/${_id}/roles`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/user', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/user/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/user/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 사용자 로그인이력 ─────────────────────────────────── */
  boApiSvc.syUserLoginLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user-login-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 사용자 토큰이력 ────────────────────────────────────── */
  boApiSvc.syUserTokenLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get('/bo/sy/user-token-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: API요청로그 ────────────────────────────────────────── */
  boApiSvc.syAccessLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/access-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: API오류로그 ────────────────────────────────────────── */
  boApiSvc.syAccessErrorLog = {
    getPage(params, uiNm, cmdNm) { return global.boApi.get(   '/bo/sy/access-error-log/page', { params, ...hdr(uiNm, cmdNm) }); },
  };

  /* ── sy: 업체(Vendor) ───────────────────────────────────────── */
  boApiSvc.syVendor = {
    getPage(params, uiNm, cmdNm)   { return global.boApi.get(   '/bo/sy/vendor/page', { params, ...hdr(uiNm, cmdNm) }); },
    getById(_id, uiNm, cmdNm)      { return chkId(_id, uiNm, cmdNm) || global.boApi.get(   `/bo/sy/vendor/${_id}`, hdr(uiNm, cmdNm)); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/bo/sy/vendor', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/bo/sy/vendor/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/bo/sy/vendor/${_id}`, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 업체사용자 ─────────────────────────────────────────── */
  boApiSvc.syVendorUser = {
    getList(params, uiNm, cmdNm)   { return global.boApi.get(   '/base/sy/vendor-user', { params, ...hdr(uiNm, cmdNm) }); },
    getRoles(params, uiNm, cmdNm)  { return global.boApi.get(   '/base/sy/vendor-user-role', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)      { return global.boApi.post(  '/base/sy/vendor-user', body, hdr(uiNm, cmdNm)); },
    update(_id, body, uiNm, cmdNm) { return chkId(_id, uiNm, cmdNm) || global.boApi.put(   `/base/sy/vendor-user/${_id}`, body, hdr(uiNm, cmdNm)); },
    remove(_id, uiNm, cmdNm)       { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/base/sy/vendor-user/${_id}`, hdr(uiNm, cmdNm)); },
    addRole(body, uiNm, cmdNm)     { return global.boApi.post(  '/base/sy/vendor-user-role', body, hdr(uiNm, cmdNm)); },
    removeRole(_id, uiNm, cmdNm)   { return chkId(_id, uiNm, cmdNm) || global.boApi.delete(`/base/sy/vendor-user-role/${_id}`, hdr(uiNm, cmdNm)); },
  };

  global.boApiSvc = boApiSvc;
})(window);

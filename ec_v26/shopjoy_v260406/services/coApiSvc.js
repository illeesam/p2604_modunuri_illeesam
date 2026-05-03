/**
 * coApiSvc.js — FO / BO 공통 API 서비스
 *
 * 사용 조건: 2개 이상의 화면(FO·BO 혼용 포함)에서 동일 엔드포인트를 호출하는 경우에만 등록.
 * 단일 화면 전용 호출은 해당 페이지 파일 안에 직접 선언.
 *
 * 컨트롤러 규칙: FO·BO 공통 엔드포인트는 /co/ 프리픽스 컨트롤러에 구현.
 *   /co/cm/bo-app-store/... — BO 앱 초기화 데이터 (CmBoAppStoreDataController)
 *   /co/cm/fo-app-store/... — FO 앱 초기화 데이터 (CmFoAppStoreDataController)
 *   /co/sy/code/...         — 공통코드 (CoSyCodeController)
 *   /co/sy/site/...         — 사이트   (CoSySiteController)
 *   /co/sy/path/...         — 표시경로 (CoSyPathController)
 *
 * 선행 로드:
 *   FO → utils/foApiAxios.js (foApi) + utils/coUtil.js
 *   BO → utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await coApiSvc.boAuth.login(body);
 *   const res = await coApiSvc.cmBoAppStore.getInitData('ALL');
 *   const res = await coApiSvc.cmFoAppStore.getInitData('syAuth^syCodes');
 *   const res = await coApiSvc.cmUpload.uploadMulti(formData);
 *   const res = await coApiSvc.foAuth.login(body);
 *   const res = await coApiSvc.syCode.getGrpCodes('ORDER_STATUS');
 *   const res = await coApiSvc.syCode.getGrpCodes('ORDER_STATUS', '주문관리', '상태조회');
 *   const res = await coApiSvc.syPath.getPage({ bizCd: 'sy_brand' });
 *   const res = await coApiSvc.sySite.getSiteList();
 */
(function (global) {
  'use strict';

  /* ── API 클라이언트 자동 선택 (FO / BO 환경 모두 지원) ─── */
  function client() {
    return global.boApi || global.foApi || null;
  }

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  const coApiSvc = {};

  /* ── bo-auth: BO 인증 (/co/bo-auth) ─────────────────────────
   * boAuthStore.js 에서 사용. 로그인/토큰갱신/로그아웃.
   * ─────────────────────────────────────────────────────────── */
  coApiSvc.boAuth = {
    login(body, uiNm, cmdNm)          { return global.boApi.post(  '/co/bo-auth/login',           body, hdr(uiNm, cmdNm)); },
    tokenRefresh(body, uiNm, cmdNm)   { return global.boApi.post(  '/co/bo-auth/token-refresh',   body, hdr(uiNm, cmdNm)); },
    logout(body, uiNm, cmdNm)         { return global.boApi.post(  '/co/bo-auth/logout',          body, hdr(uiNm, cmdNm)); },
    join(body, uiNm, cmdNm)           { return global.boApi.post(  '/co/bo-auth/join',            body, hdr(uiNm, cmdNm)); },
    changePassword(body, uiNm, cmdNm) { return global.boApi.post(  '/co/bo-auth/change-password', body, hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 앱 정보 (/co/cm/app-info) ──────────────────────── */
  coApiSvc.cmAppInfo = {
    getInfo(uiNm, cmdNm) {
      return client().get('/co/cm/app-info/info', hdr(uiNm, cmdNm));
    },
  };

  /* ── cm: BO 앱 초기화 데이터 (/co/cm/bo-app-store) ──────────
   * boAppInitStore.js 에서 사용. names="ALL" 또는 "^" 구분 조합.
   * 개별 키: syAuth / syRoles / syMenus / syCodes / syProps / syApp
   * ─────────────────────────────────────────────────────────── */
  coApiSvc.cmBoAppStore = {
    getInitData(names, uiNm, cmdNm) {
      return global.boApi.get(   '/co/cm/bo-app-store/getInitData', { params: { names }, ...hdr(uiNm, cmdNm) });
    },
    getAuth(uiNm, cmdNm)  { return global.boApi.get(   '/co/cm/bo-app-store/getAuth',  hdr(uiNm, cmdNm)); },
    getUser(uiNm, cmdNm)  { return global.boApi.get(   '/co/cm/bo-app-store/getUser',  hdr(uiNm, cmdNm)); },
    getRoles(uiNm, cmdNm) { return global.boApi.get(   '/co/cm/bo-app-store/getRoles', hdr(uiNm, cmdNm)); },
    getMenus(uiNm, cmdNm) { return global.boApi.get(   '/co/cm/bo-app-store/getMenus', hdr(uiNm, cmdNm)); },
    getCodes(uiNm, cmdNm) { return global.boApi.get(   '/co/cm/bo-app-store/getCodes', hdr(uiNm, cmdNm)); },
    getProps(uiNm, cmdNm) { return global.boApi.get(   '/co/cm/bo-app-store/getProps', hdr(uiNm, cmdNm)); },
    getApp(uiNm, cmdNm)   { return global.boApi.get(   '/co/cm/bo-app-store/getApp',   hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 파일 다운로드 (/co/cm/download) ─────────────────── */
  coApiSvc.cmDownload = {
    getUrl(filePath) { return `/co/cm/download/${filePath}`; },
    getSecureUrl(fileId) { return `/co/cm/download/secure/${fileId}`; },
  };

  /* ── cm: FO 앱 초기화 데이터 (/co/cm/fo-app-store) ──────────
   * foAppInitStore.js 에서 사용. names="ALL" 또는 "^" 구분 조합.
   * 개별 키: syAuth / syRoles / syMenus / syCodes / syProps / dpDisp / syApp
   * ─────────────────────────────────────────────────────────── */
  coApiSvc.cmFoAppStore = {
    getInitData(names, uiNm, cmdNm) {
      return global.foApi.get('/co/cm/fo-app-store/getInitData', { params: { names }, ...hdr(uiNm, cmdNm) });
    },
    getAuth(uiNm, cmdNm)     { return global.foApi.get('/co/cm/fo-app-store/getAuth',  hdr(uiNm, cmdNm)); },
    getUser(uiNm, cmdNm)     { return global.foApi.get('/co/cm/fo-app-store/getUser',  hdr(uiNm, cmdNm)); },
    getUserPost(uiNm, cmdNm) { return global.foApi.post('/co/cm/fo-app-store/getUser', '', hdr(uiNm, cmdNm)); },
    getRoles(uiNm, cmdNm)    { return global.foApi.get('/co/cm/fo-app-store/getRoles', hdr(uiNm, cmdNm)); },
    getMenus(uiNm, cmdNm)    { return global.foApi.get('/co/cm/fo-app-store/getMenus', hdr(uiNm, cmdNm)); },
    getCodes(uiNm, cmdNm)    { return global.foApi.get('/co/cm/fo-app-store/getCodes', hdr(uiNm, cmdNm)); },
    getProps(uiNm, cmdNm)    { return global.foApi.get('/co/cm/fo-app-store/getProps', hdr(uiNm, cmdNm)); },
    getApp(uiNm, cmdNm)      { return global.foApi.get('/co/cm/fo-app-store/getApp',   hdr(uiNm, cmdNm)); },
  };

  /* ── cm: 이미지 뷰 (/co/cm/image) ───────────────────────── */
  coApiSvc.cmImage = {
    getViewUrl(imageUrl) { return `/co/cm/image/view/${imageUrl}`; },
    getThumbUrl(thumbUrl) { return `/co/cm/image/thumb/${thumbUrl}`; },
  };

  /* ── cm: 첨부파일 그룹 조회 (/co/cm/upload) ─────────────── */
  coApiSvc.cmAttach = {
    getFiles(attachGrpId, uiNm = '첨부파일', cmdNm = '목록조회') {
      return client().get(`/co/cm/upload/attach-grp/${attachGrpId}/files`, hdr(uiNm, cmdNm));
    },
  };

  /* ── cm: 파일 업로드 (/co/cm/upload) ────────────────────── */
  coApiSvc.cmUpload = {
    uploadOne(formData, uiNm, cmdNm) {
      return client().post('/co/cm/upload/one', formData, hdr(uiNm, cmdNm));
    },
    uploadMulti(formData, uiNm, cmdNm) {
      return client().post('/co/cm/upload/multi', formData, hdr(uiNm, cmdNm));
    },
  };

  /* ── cm: 동영상 스트리밍 (/co/cm/video) ─────────────────── */
  coApiSvc.cmVideo = {
    getPlayUrl(videoPath) { return `/co/cm/video/play/${videoPath}`; },
    getInfo(videoPath, uiNm, cmdNm) {
      return client().get(`/co/cm/video/info/${videoPath}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── fo-auth: FO 인증 (/co/fo-auth) ─────────────────────────
   * foAuth.js 에서 사용. 로그인/회원가입/비밀번호변경.
   * ─────────────────────────────────────────────────────────── */
  coApiSvc.foAuth = {
    login(body, uiNm, cmdNm)          { return global.foApi.post('/co/fo-auth/login',   body, hdr(uiNm, cmdNm)); },
    tokenRefresh(body, uiNm, cmdNm)   { return global.foApi.post('/co/fo-auth/token-refresh', body, hdr(uiNm, cmdNm)); },
    logout(body, uiNm, cmdNm)         { return global.foApi.post('/co/fo-auth/logout',  body, hdr(uiNm, cmdNm)); },
    join(body, uiNm, cmdNm)           { return global.foApi.post('/co/fo-auth/join',    body, hdr(uiNm, cmdNm)); },
    changePassword(body, uiNm, cmdNm) { return global.foApi.post('/co/fo-auth/change-password', body, hdr(uiNm, cmdNm)); },
  };

  /* ── sy: 공통코드 (FO·BO 모두 코드 조회 시 사용) ────────── */
  coApiSvc.syCode = {
    getList(params, uiNm, cmdNm) {
      return client().get('/co/sy/code/list', { params, ...hdr(uiNm, cmdNm) });
    },
    getGrpCodes(codeGrp, uiNm, cmdNm) {
      return client().get('/co/sy/code/list', { params: { codeGrp }, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── sy: 표시경로 (PathTree, PathPickModal, FO 카테고리 등) ── */
  coApiSvc.syPath = {
    getPage(params, uiNm, cmdNm) {
      return client().get('/co/sy/path/page', {
        params: { pageNo: 1, pageSize: 10000, ...params },
        ...hdr(uiNm, cmdNm),
      });
    },
  };

  /* ── sy: 사이트 (FO 헤더, BO 사이트관리 등 공유) ─────────── */
  coApiSvc.sySite = {
    getSiteList(params, uiNm, cmdNm) {
      return client().get('/co/sy/site/list', { params, ...hdr(uiNm, cmdNm) });
    },
    getSiteById(_id, uiNm, cmdNm) {
      return client().get(`/co/sy/site/${_id}`, hdr(uiNm, cmdNm));
    },
  };

  global.coApiSvc = coApiSvc;
})(window);

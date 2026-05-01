/**
 * coApiSvc.js — FO / BO 공통 API 서비스
 *
 * 사용 조건: 2개 이상의 화면(FO·BO 혼용 포함)에서 동일 엔드포인트를 호출하는 경우에만 등록.
 * 단일 화면 전용 호출은 해당 페이지 파일 안에 직접 선언.
 *
 * 선행 로드:
 *   FO → utils/foApiAxios.js (foApi) + utils/coUtil.js
 *   BO → utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await coApiSvc.code.getGrpCodes('ORDER_STATUS');                        // apiHdr 생략
 *   const res = await coApiSvc.code.getGrpCodes('ORDER_STATUS', '주문관리', '상태조회'); // apiHdr 포함
 *   const res = await coApiSvc.site.getSiteList();
 *   const res = await coApiSvc.path.getPage({ bizCd: 'sy_brand' });
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

  /* ── 공통코드 ─────────────────────────────────────────────
   * FO·BO 모두 코드 조회 시 사용
   * ─────────────────────────────────────────────────────── */
  coApiSvc.code = {
    getList(params, uiNm, cmdNm) {
      return client().get('/sy/code/list', { params, ...hdr(uiNm, cmdNm) });
    },
    getGrpCodes(codeGrp, uiNm, cmdNm) {
      return client().get('/sy/code/list', { params: { codeGrp }, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── 사이트 ───────────────────────────────────────────────
   * 복수 도메인(FO 헤더, BO 사이트관리 등)에서 공유
   * ─────────────────────────────────────────────────────── */
  coApiSvc.site = {
    getSiteList(params, uiNm, cmdNm) {
      return client().get('/sy/site/list', { params, ...hdr(uiNm, cmdNm) });
    },
    getSiteById(siteId, uiNm, cmdNm) {
      return client().get(`/sy/site/${siteId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── 표시경로(sy_path) ────────────────────────────────────
   * PathTree(BoComp), PathPickModal, FO 카테고리 등 다중 사용
   * ─────────────────────────────────────────────────────── */
  coApiSvc.path = {
    getPage(params, uiNm, cmdNm) {
      return client().get('/sy/path/page', {
        params: { pageNo: 1, pageSize: 10000, ...params },
        ...hdr(uiNm, cmdNm),
      });
    },
  };

  global.coApiSvc = coApiSvc;
})(window);

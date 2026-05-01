/**
 * foApiSvc.js — Front Office 전용 공통 API 서비스
 *
 * 사용 조건: GET 엔드포인트는 단독 사용이라도 모두 등록.
 * POST/PUT/DELETE 등 변경성 단건 호출은 각 페이지 파일에 직접 선언 가능.
 *
 * 선행 로드: utils/foApiAxios.js (foApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await foApiSvc.pdProd.getPage({ kw: '신발', pageNo: 1 });
 *   const res = await foApiSvc.pdProd.getPage({ kw: '신발' }, '상품목록', '조회');
 *   const res = await foApiSvc.myCoupon.getList();
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  const foApiSvc = {};

  /* ── cm: 블로그/게시물 ──────────────────────────────────────── */
  foApiSvc.cmBltn = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/cm/bltn/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(bltnId, uiNm, cmdNm) {
      return global.foApi.get(`/fo/ec/cm/bltn/${bltnId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── my: 캐시 ───────────────────────────────────────────────── */
  foApiSvc.myCash = {
    getInfo(uiNm, cmdNm) {
      return global.foApi.get('/fo/my/cash/info', hdr(uiNm, cmdNm));
    },
  };

  /* ── my: 채팅 ───────────────────────────────────────────────── */
  foApiSvc.myChat = {
    getList(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/my/chat/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── my: 클레임 ─────────────────────────────────────────────── */
  foApiSvc.myClaim = {
    getList(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/my/claim/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── my: 쿠폰 ───────────────────────────────────────────────── */
  foApiSvc.myCoupon = {
    getList(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/my/coupon/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── my: 문의 ───────────────────────────────────────────────── */
  foApiSvc.myInquiry = {
    getList(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/my/inquiry/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── my: 주문 ───────────────────────────────────────────────── */
  foApiSvc.myOrder = {
    getList(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/my/order/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  foApiSvc.pdProd = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(prodId, uiNm, cmdNm) {
      return global.foApi.get(`/fo/ec/pd/prod/${prodId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  foApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(eventId, uiNm, cmdNm) {
      return global.foApi.get(`/fo/ec/pm/event/${eventId}`, hdr(uiNm, cmdNm));
    },
  };

  global.foApiSvc = foApiSvc;
})(window);

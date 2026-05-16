/**
 * foApiSvc.js — Front Office 전용 공통 API 서비스
 *
 * 모든 API 엔드포인트(GET/POST/PUT/DELETE)를 이 파일에 등록하여 중앙 관리한다.
 *
 * 선행 로드: utils/foApiAxios.js (foApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await foApiSvc.pdProd.getPage({ searchValue: '신발' }, '상품목록', '조회');
 *   const res = await foApiSvc.myInquiry.create(body, '문의', '등록');
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  /* _id / saveList rows 검증은 coUtil.chkId / coUtil.chkRowIds 위임 */
  const chkId     = (...a) => coUtil.chkId(...a);

  /* chkRowIds */
  const chkRowIds = (...a) => coUtil.chkRowIds(...a);

  const foApiSvc = {};

  /* ── cm: 블로그/게시물 ──────────────────────────────────────── */
  foApiSvc.cmBltn = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/cm/bltn/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/cm/bltn/${_id}`, hdr(uiNm, cmdNm));
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
    getList(params, uiNm, cmdNm) { return global.foApi.get('/fo/my/inquiry/list', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)    { return global.foApi.post('/fo/inquiry/create', body, hdr(uiNm, cmdNm)); },
  };

  /* ── my: 주문 ───────────────────────────────────────────────── */
  foApiSvc.myOrder = {
    getList(params, uiNm, cmdNm) { return global.foApi.get('/fo/my/order/list', { params, ...hdr(uiNm, cmdNm) }); },
    create(body, uiNm, cmdNm)    { return global.foApi.post('/fo/order/create', body, hdr(uiNm, cmdNm)); },
  };

  /* ── pd: 상품 ───────────────────────────────────────────────── */
  /* 상품상세는 3계층으로 분리 호출 (정책서: pd.10 §4):
   *   Tier 1 — getById()       : 첫 화면 (prod + images + opts + skus)
   *   Tier 2 — getContents()   : 스크롤 시 lazy load (상품설명)
   *           getRels()        : 스크롤 시 lazy load (연관상품)
   *           getReviews()     : 탭 클릭 시 (있을 때)
   *           getQna()         : 탭 클릭 시 (있을 때)
   *   Tier 3 — getPromotions() : 사용자별 동적 (쿠폰/할인/사은품/이벤트 통합)
   */
  foApiSvc.pdProd = {
    /* 목록 ─────────────────────────────────────────────────── */
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/pd/prod/page', { params, ...hdr(uiNm, cmdNm) });
    },
    /* Tier 1 — 첫 화면 (단일 통합) */
    getById(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}`, hdr(uiNm, cmdNm));
    },
    /* Tier 2 — 스크롤/탭 lazy load */
    getContents(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/contents`, hdr(uiNm, cmdNm));
    },
    getRels(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/rels`, hdr(uiNm, cmdNm));
    },
    getReviews(_id, params, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/reviews`, { params, ...hdr(uiNm, cmdNm) });
    },
    getReviewImages(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/review-images`, hdr(uiNm, cmdNm));
    },
    getQna(_id, params, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/qna`, { params, ...hdr(uiNm, cmdNm) });
    },
    /* Tier 3 — 사용자별 프로모션 (통합) */
    getPromotions(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pd/prod/${_id}/promotions`, hdr(uiNm, cmdNm));
    },
  };

  /* ── pm: 이벤트 ─────────────────────────────────────────────── */
  foApiSvc.pmEvent = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/ec/pm/event/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(_id, uiNm, cmdNm) {
      return chkId(_id, uiNm, cmdNm) || global.foApi.get(`/fo/ec/pm/event/${_id}`, hdr(uiNm, cmdNm));
    },
  };

  global.foApiSvc = foApiSvc;
})(window);

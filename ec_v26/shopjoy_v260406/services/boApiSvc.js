/**
 * boApiSvc.js — Back Office 전용 공통 API 서비스
 *
 * 사용 조건: BO 화면 2개 이상에서 동일 엔드포인트를 호출하는 경우에만 등록.
 * 단일 화면 전용 호출은 해당 페이지 파일 안에 직접 선언.
 *
 * 선행 로드: utils/boApiAxios.js (boApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await boApiSvc.member.getPage({ kw: '홍길동', pageNo: 1 });              // apiHdr 생략
 *   const res = await boApiSvc.member.getPage({ kw: '홍길동' }, '회원관리', '목록조회'); // apiHdr 포함
 *   const res = await boApiSvc.vendor.getList();
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  const boApiSvc = {};

  /* ── 회원 (주문/클레임/고객종합 등 다중 참조) ────────────── */
  boApiSvc.member = {
    getPage(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/member/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(memberId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/ec/member/${memberId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── 사용자(관리자 계정, 다중 화면 참조) ─────────────────── */
  boApiSvc.user = {
    getList(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/user/list', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(userId, uiNm, cmdNm) {
      return global.boApi.get(`/bo/sy/user/${userId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── 브랜드 (상품등록, 브랜드관리 등) ───────────────────── */
  boApiSvc.brand = {
    getList(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/brand/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── 업체(Vendor) (상품·정산·발주 등) ───────────────────── */
  boApiSvc.vendor = {
    getList(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/sy/vendor/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  /* ── 카테고리 (상품등록, 전시관리 등) ───────────────────── */
  boApiSvc.category = {
    getList(params, uiNm, cmdNm) {
      return global.boApi.get('/bo/ec/category/list', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  global.boApiSvc = boApiSvc;
})(window);

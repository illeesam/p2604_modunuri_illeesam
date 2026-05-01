/**
 * foApiSvc.js — Front Office 전용 공통 API 서비스
 *
 * 사용 조건: FO 화면 2개 이상에서 동일 엔드포인트를 호출하는 경우에만 등록.
 * 단일 화면 전용 호출은 해당 페이지 파일 안에 직접 선언.
 *
 * 선행 로드: utils/foApiAxios.js (foApi) + utils/coUtil.js
 *
 * 사용법:
 *   const res = await foApiSvc.member.getMyInfo();                          // apiHdr 생략
 *   const res = await foApiSvc.member.getMyInfo('마이페이지', '내정보조회'); // apiHdr 포함
 *   const res = await foApiSvc.product.getPage({ kw: '신발', pageNo: 1 });
 */
(function (global) {
  'use strict';

  /* uiNm/cmdNm 둘 다 있을 때만 apiHdr 생성, 없으면 빈 객체 */
  function hdr(uiNm, cmdNm) {
    return uiNm && cmdNm ? coUtil.apiHdr(uiNm, cmdNm) : {};
  }

  const foApiSvc = {};

  /* ── 회원 (마이페이지, 헤더 프로필 등) ───────────────────── */
  foApiSvc.member = {
    getMyInfo(uiNm, cmdNm) {
      return global.foApi.get('/fo/my/info', hdr(uiNm, cmdNm));
    },
  };

  /* ── 상품 (상품목록, 상품상세, 찜 등) ────────────────────── */
  foApiSvc.product = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/product/page', { params, ...hdr(uiNm, cmdNm) });
    },
    getById(prodId, uiNm, cmdNm) {
      return global.foApi.get(`/fo/product/${prodId}`, hdr(uiNm, cmdNm));
    },
  };

  /* ── 공지/FAQ (헤더 알림, 고객센터 등) ───────────────────── */
  foApiSvc.notice = {
    getPage(params, uiNm, cmdNm) {
      return global.foApi.get('/fo/notice/page', { params, ...hdr(uiNm, cmdNm) });
    },
  };

  global.foApiSvc = foApiSvc;
})(window);

/**
 * coConsts.js — FO·BO 공통 상수 (window.coConsts)
 *
 * FO(index.html)·BO(bo.html) 양쪽에서 값이 동일하게 쓰이는 상수만 모은다.
 * (FO 전용 → foConsts.js, BO 전용 → boConsts.js)
 *
 * ⚠️ 이 프로젝트는 빌드 없이 <script src> 로 직접 로드 → ES `export` 사용 불가.
 *    기존 coUtil/services 와 동일하게 window 전역 객체로 노출한다.
 *
 * 선행 로드: 없음 (순수 데이터). stores/pages 보다 먼저 로드.
 */
(function (global) {
  'use strict';

  var coConsts = {};

  /* ── 클레임 유형 (취소/반품/교환) — FO·BO 공통 ──
   * { codeValue, codeLabel } 형식 (sy_code code_grp='CLAIM_TYPE' 과 동일: CANCEL/RETURN/EXCHANGE).
   *   향후 sy_code 이관 시 codes 로 대체, 이 상수는 fallback. 라벨만 필요하면 .map(c=>c.codeLabel). */
  coConsts.CLAIM_TYPES = [
    { codeValue: 'CANCEL',   codeLabel: '취소' },
    { codeValue: 'RETURN',   codeLabel: '반품' },
    { codeValue: 'EXCHANGE', codeLabel: '교환' },
  ];

  /* 클레임 유형 → 대표 hex 색상. FO(foMyStore.CLAIM_TYPE_COLOR) + BO(OdOrderMng/OdClaimMng fnClaimTypeColor) 동일값 */
  coConsts.CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#FFBB00', '교환': '#3b82f6' };

  /* claimTypeColor — 유형 → hex (미정의 시 회색). 함수형 사용처 호환 */
  coConsts.claimTypeColor = function (t) { return coConsts.CLAIM_TYPE_COLOR[t] || '#9ca3af'; };

  /* ── 택배사 ── */
  /* 택배사명 → 송장조회 URL 생성 함수. FO MyOrder/MyClaim 의 COURIER_URLS 중복 통합 */
  coConsts.COURIER_URLS = {
    'CJ대한통운': function (no) { return 'https://trace.cjlogistics.com/next/tracking.html?wblNo=' + no; },
    '롯데택배':   function (no) { return 'https://www.lotteglogis.com/open/tracking?invno=' + no; },
    '한진택배':   function (no) { return 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=' + no; },
  };

  /* courierTrackUrl — (택배사, 송장번호) → 조회 URL. 미지원 택배사면 '' */
  coConsts.courierTrackUrl = function (courier, trackingNo) {
    var fn = coConsts.COURIER_URLS[courier];
    return fn ? fn(trackingNo) : '';
  };

  /* 택배사 선택 옵션 (드롭다운용) — BO 배송관리 등.
   * { codeValue, codeLabel } 형식 (sy_code code_grp='COURIER' 과 동일: CJ/LOTTE/HANJIN/POST/LOGEN).
   *   codeLabel(한글명)이 COURIER_URLS 키 + 송장조회와 호환. 라벨만 필요하면 .map(c=>c.codeLabel). */
  coConsts.COURIER_NAMES = [
    { codeValue: 'CJ',     codeLabel: 'CJ대한통운' },
    { codeValue: 'LOTTE',  codeLabel: '롯데택배' },
    { codeValue: 'HANJIN', codeLabel: '한진택배' },
    { codeValue: 'POST',   codeLabel: '우체국택배' },
    { codeValue: 'LOGEN',  codeLabel: '로젠택배' },
  ];

  global.coConsts = global.coConsts || coConsts;
})(window);

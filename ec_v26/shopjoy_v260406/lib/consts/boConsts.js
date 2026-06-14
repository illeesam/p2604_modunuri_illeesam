/**
 * boConsts.js — Back Office 전용 상수 (window.boConsts)
 *
 * BO 화면에서 반복되는 페이지크기·배지색맵·템플릿·대시보드 목록 등 고정 상수를 모은다.
 * (FO·BO 공통값 → coConsts.js / FO 전용 → foConsts.js)
 *
 * ⚠️ 빌드 없이 <script src> 직접 로드 → ES `export` 불가. window 전역으로 노출.
 * 선행 로드: 없음(순수 데이터). stores/pages 보다 먼저 로드.
 *
 * 색상 표기: BO 는 badge-class(badge-green 등). 배지맵은 coUtil.cofCodeBadge 의 fallback 으로 사용.
 *   사용: coUtil.cofCodeBadge('ORDER_STATUS', s, boConsts.ORDER_STATUS_BADGE[s] || 'badge-gray')
 */
(function (global) {
  'use strict';

  var boConsts = {};

  /* ── 공통 페이지 크기 옵션 (전 BO 그리드 pager) ── */
  boConsts.PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

  /* ── 추가결재 요청 템플릿 (OdOrder/OdClaim/OdDliv 공통, {target}{targetNm}{amount}{reason} 치환) ── */
  boConsts.APPROVAL_TMPL =
    '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';

  /* ── 택배사 선택 옵션 (배송관리 fallback) ──
   * { codeValue, codeLabel } 형식 (sy_code code_grp='COURIER': CJ/LOTTE/HANJIN/POST/LOGEN).
   *   coConsts.COURIER_NAMES 와 동일값(coConsts 가 먼저 로드되면 그대로 재사용, 아니면 인라인 정의). */
  boConsts.COURIER_OPTIONS = (global.coConsts && global.coConsts.COURIER_NAMES) || [
    { codeValue: 'CJ',     codeLabel: 'CJ대한통운' },
    { codeValue: 'LOTTE',  codeLabel: '롯데택배' },
    { codeValue: 'HANJIN', codeLabel: '한진택배' },
    { codeValue: 'POST',   codeLabel: '우체국택배' },
    { codeValue: 'LOGEN',  codeLabel: '로젠택배' },
  ];

  /* ════════ 상태/유형 → badge-class 색상맵 (cofCodeBadge fallback) ════════
   *   ⚠️ 키는 런타임 데이터가 넘기는 값(현재 한글 라벨, 예: orderStatusCd='입금대기')과 일치해야 함.
   *      → 키를 영문코드로 바꾸면 fallback 매칭이 깨짐. sy_code.code_opt1 채워지면 이 맵은 제거 가능.
   *   값은 전부 badge-* 클래스, 미정의 시 호출부에서 'badge-gray' 로 폴백. */

  /* 주문상태 */
  boConsts.ORDER_STATUS_BADGE = {
    '입금대기': 'badge-orange', '결제완료': 'badge-blue',  '상품준비중': 'badge-orange',
    '배송중':   'badge-blue',   '배송완료': 'badge-green', '구매확정':   'badge-gray',
    '취소':     'badge-red',    '자동취소': 'badge-red',
  };
  /* 결제상태 */
  boConsts.PAY_STATUS_BADGE = {
    '미결제':   'badge-gray',   '부분결제': 'badge-orange', '결제완료': 'badge-green',
    '결제실패': 'badge-red',    '환불중':   'badge-orange', '부분환불': 'badge-orange',
    '환불완료': 'badge-purple',
  };
  /* 배송상태 */
  boConsts.DLIV_STATUS_BADGE = {
    '준비중':   'badge-orange', '출고완료': 'badge-blue',  '배송중': 'badge-blue',
    '배송완료': 'badge-green',  '배송실패': 'badge-red',
  };
  /* 쿠폰상태 */
  boConsts.COUPON_STATUS_BADGE = { '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' };
  /* 이벤트상태 */
  boConsts.EVENT_STATUS_BADGE = { '진행중': 'badge-green', '예정': 'badge-blue', '종료': 'badge-gray' };
  /* 공지상태 */
  boConsts.NOTICE_STATUS_BADGE = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' };
  /* 공지유형 */
  boConsts.NOTICE_TYPE_BADGE = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' };
  /* 회원등급 */
  boConsts.MEMBER_GRADE_BADGE = { 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' };
  /* 회원상태 */
  boConsts.MEMBER_STATUS_BADGE = { '활성': 'badge-green', '정지': 'badge-red' };
  /* 채팅상태 */
  boConsts.CHATT_STATUS_BADGE = { '진행중': 'badge-green', '종료': 'badge-gray' };

  /* ── 결제수단 표시색 (관리자 입금/결제 내역) — badge-class 가 아닌 인라인 {bg,fg} hex ── */
  boConsts.PAY_METHOD_COLORS = {
    '계좌이체': { bg: '#e3f2fd', fg: '#1565c0' },
    '카드결제': { bg: '#f3e5f5', fg: '#6a1b9a' },
    '캐쉬':     { bg: '#fff3e0', fg: '#e65100' },
  };

  /* ════════ 대시보드 ════════
   * 표준 코드 형식 { codeValue(영문코드), codeLabel(표시명) }.
   *   향후 sy_code 테이블(code_grp/code_value/code_label)로 이관 가능하도록 미리 객체화.
   *   codeValue 는 sy_code 컨벤션(영문 대문자 + '_') 을 따른다. (GENDER 는 실제 sy_code 값 M/F 와 일치)
   *   sy_code 전환 시: codes 로딩으로 대체하고 이 상수는 fallback 으로만 유지. */
  boConsts.DASHBOARD_CHANNELS = [
    { codeValue: 'OWN_MALL',   codeLabel: '자사몰' },
    { codeValue: 'NAVER',      codeLabel: '네이버 스마트스토어' },
    { codeValue: 'COUPANG',    codeLabel: '쿠팡' },
    { codeValue: 'ST11',       codeLabel: '11번가' },
    { codeValue: 'GMARKET',    codeLabel: 'G마켓' },
    { codeValue: 'AUCTION',    codeLabel: 'Auction' },
    { codeValue: 'GSSHOP',     codeLabel: 'GS샵' },
    { codeValue: 'TMON',       codeLabel: 'TMON' },
    { codeValue: 'WEMAKEPRICE',codeLabel: '위메프' },
    { codeValue: 'LOTTEON',    codeLabel: '롯데온' },
    { codeValue: 'HNS',        codeLabel: '홈앤쇼핑' },
    { codeValue: 'HYUNDAI',    codeLabel: '현대H몰' },
  ];
  boConsts.DASHBOARD_AGES = [
    { codeValue: 'AGE_10', codeLabel: '10대' },
    { codeValue: 'AGE_20', codeLabel: '20대' },
    { codeValue: 'AGE_30', codeLabel: '30대' },
    { codeValue: 'AGE_40', codeLabel: '40대' },
    { codeValue: 'AGE_50', codeLabel: '50대' },
    { codeValue: 'AGE_60', codeLabel: '60대+' },
  ];
  boConsts.DASHBOARD_GENDERS = [
    { codeValue: 'M', codeLabel: '남' },
    { codeValue: 'F', codeLabel: '여' },
  ];
  boConsts.DASHBOARD_MEMBER_TYPES = [
    { codeValue: 'NORMAL',   codeLabel: '일반' },
    { codeValue: 'VIP',      codeLabel: 'VIP' },
    { codeValue: 'VVIP',     codeLabel: 'VVIP' },
    { codeValue: 'DORMANT',  codeLabel: '휴면' },
    { codeValue: 'WITHDRAWN',codeLabel: '탈퇴' },
  ];
  boConsts.DASHBOARD_CATEGORIES = [
    { codeValue: 'FASHION_CLOTHES', codeLabel: '패션의류' },
    { codeValue: 'FASHION_GOODS',   codeLabel: '패션잡화' },
    { codeValue: 'BEAUTY',          codeLabel: '뷰티' },
    { codeValue: 'APPLIANCE',       codeLabel: '가전' },
    { codeValue: 'FOOD',            codeLabel: '식품' },
    { codeValue: 'FURNITURE',       codeLabel: '가구' },
    { codeValue: 'LIVING',          codeLabel: '리빙' },
    { codeValue: 'SPORTS',          codeLabel: '스포츠' },
    { codeValue: 'BOOK',            codeLabel: '도서' },
    { codeValue: 'ETC',             codeLabel: '기타' },
  ];

  global.boConsts = global.boConsts || boConsts;
})(window);

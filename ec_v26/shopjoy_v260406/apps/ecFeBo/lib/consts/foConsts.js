/**
 * foConsts.js — Front Office 전용 상수 (window.foConsts)
 *
 * FO 화면/스토어에서 반복되는 상태흐름·색상맵·코드라벨맵·고정 비즈니스 상수를 모은다.
 * (FO·BO 공통값 → coConsts.js)
 *
 * ⚠️ 빌드 없이 <script src> 직접 로드 → ES `export` 불가. window 전역으로 노출.
 * 선행 로드: 없음(순수 데이터). foMyStore/pages 보다 먼저 로드.
 *
 * 색상 표기: FO 는 hex(#rrggbb). (BO 는 badge-class 라 별개 — boConsts.js)
 */
(function (global) {
  'use strict';

  var foConsts = {};

  /* _byCode — [{codeValue, codeLabel}] 배열 → { codeValue: codeLabel } 룩업 맵 파생.
   *   코드→한글 라벨 맵은 배열을 단일 소스로 두고 이 헬퍼로 파생한다(중복 정의 방지).
   *   배열은 드롭다운 옵션, 파생 맵은 MAP[code] 룩업 — 두 형태를 한 정의에서 제공. */
  function _byCode(arr) {
    return arr.reduce(function (m, c) { m[c.codeValue] = c.codeLabel; return m; }, {});
  }

  /* ════════ 주문 ════════ */
  /* 주문 상태 흐름 (진행바 순서) */
  foConsts.ORDER_FLOW = [
    { status: '주문완료',   icon: '📋' },
    { status: '결제완료',   icon: '💳' },
    { status: '배송준비중', icon: '📦' },
    { status: '배송중',     icon: '🚚' },
    { status: '배송완료',   icon: '✅' },
    { status: '완료',       label: '구매확정', icon: '🏁' },
  ];
  foConsts.CANCELABLE   = ['주문완료', '결제완료'];                    // 취소 가능 상태
  foConsts.SHOW_COURIER = ['배송준비중', '배송중', '배송완료', '완료']; // 송장 노출 상태

  /* 백엔드 주문상태코드 → 화면 한글 라벨.
   *   배열(ORDER_STATUS_OPTIONS)을 단일 소스로, 룩업 맵(ORDER_STATUS_KOR)은 _byCode 로 파생.
   *   여러 백엔드 코드가 같은 라벨로 매핑됨(SHIPPED/DELIVERED→배송완료 등). */
  foConsts.ORDER_STATUS_OPTIONS = [
    { codeValue: 'ORDER',     codeLabel: '주문완료' },
    { codeValue: 'PAID',      codeLabel: '결제완료' },
    { codeValue: 'PREPARING', codeLabel: '배송준비중' },
    { codeValue: 'SHIPPING',  codeLabel: '배송중' },
    { codeValue: 'SHIPPED',   codeLabel: '배송완료' },
    { codeValue: 'DELIVERED', codeLabel: '배송완료' },
    { codeValue: 'COMPLT',    codeLabel: '완료' },
    { codeValue: 'COMPLETED', codeLabel: '완료' },
    { codeValue: 'DONE',      codeLabel: '완료' },
    { codeValue: 'CANCEL',    codeLabel: '취소됨' },
    { codeValue: 'CANCELED',  codeLabel: '취소됨' },
    { codeValue: 'CANCELLED', codeLabel: '취소됨' },
    { codeValue: 'EXCHANGE',  codeLabel: '교환요청' },
    { codeValue: 'RETURN',    codeLabel: '반품요청' },
  ];
  foConsts.ORDER_STATUS_KOR = _byCode(foConsts.ORDER_STATUS_OPTIONS);

  /* 주문상태 → hex 색상 */
  foConsts.ORDER_STATUS_COLOR = {
    '주문완료': '#3b82f6', '결제완료': '#8b5cf6', '배송준비중': '#f59e0b', '배송중': '#f97316',
    '배송완료': '#22c55e', '완료': '#6b7280', '교환요청': '#f59e0b', '반품요청': '#f97316', '취소됨': '#9ca3af',
  };

  /* ════════ 클레임 ════════ */
  /* 클레임 유형별 상태 흐름 */
  foConsts.CLAIM_FLOWS = {
    '취소': ['취소요청', '취소처리중', '취소완료'],                                            // REQUESTED → APPROVED → COMPLT
    '반품': ['반품요청', '수거예정', '수거중', '검수중', '환불대기', '환불완료'],              // REQUESTED → APPROVED → IN_PICKUP → PROCESSING → REFUND_WAIT → COMPLT
    '교환': ['교환요청', '수거예정', '수거중', '교환완료'],                                    // REQUESTED → APPROVED → IN_PICKUP → COMPLT
  };
  foConsts.CLAIM_DONE = ['취소완료', '환불완료', '교환완료'];   // 종료(완료) 상태

  /* 백엔드 클레임유형코드 → 화면 한글.
   *   배열(coConsts.CLAIM_TYPES 와 동일 코드: CANCEL/RETURN/EXCHANGE)을 단일 소스로, 맵은 파생. */
  foConsts.CLAIM_TYPE_OPTIONS = [
    { codeValue: 'CANCEL',   codeLabel: '취소' },
    { codeValue: 'RETURN',   codeLabel: '반품' },
    { codeValue: 'EXCHANGE', codeLabel: '교환' },
  ];
  foConsts.CLAIM_TYPE_KOR = _byCode(foConsts.CLAIM_TYPE_OPTIONS);

  /* 클레임 상태 → hex 색상 */
  foConsts.CLAIM_STATUS_COLOR_MAP = {
    '취소요청': '#ef4444', '취소처리중': '#f97316', '취소완료': '#9ca3af',
    '반품요청': '#ef4444', '수거예정': '#f59e0b', '수거중': '#fb923c',
    '검수중': '#8b5cf6', '환불대기': '#f97316', '환불완료': '#9ca3af',
    '교환요청': '#3b82f6', '교환완료': '#9ca3af',
  };

  /* ════════ 문의 ════════ */
  /* 백엔드 문의상태코드 → 화면 한글.
   *   배열을 단일 소스로, 룩업 맵은 _byCode 로 파생(코드는 toUpperCase 후 조회). */
  foConsts.CONTACT_STATUS_OPTIONS = [
    { codeValue: 'REQUEST',    codeLabel: '요청' },
    { codeValue: 'REQ',        codeLabel: '요청' },
    { codeValue: 'PROC',       codeLabel: '처리중' },
    { codeValue: 'PROCESSING', codeLabel: '처리중' },
    { codeValue: 'DONE',       codeLabel: '답변완료' },
    { codeValue: 'ANSWERED',   codeLabel: '답변완료' },
    { codeValue: 'COMPLETE',   codeLabel: '답변완료' },
    { codeValue: 'CANCEL',     codeLabel: '취소됨' },
  ];
  foConsts.CONTACT_STATUS_KOR = _byCode(foConsts.CONTACT_STATUS_OPTIONS);
  /* 문의상태 → hex 색상 */
  foConsts.CONTACT_STATUS_COLOR = { '요청': '#3b82f6', '처리중': '#f97316', '답변완료': '#22c55e', '취소됨': '#9ca3af' };

  /* ════════ 클레임 신청 모달 (MyOrder) ════════ */
  foConsts.CLAIM_SHIPPING_FEE = 5000;                                    // 클레임 기본 배송비
  foConsts.CLAIM_FREE_REASONS = ['상품불량', '오배송'];                   // 배송비 면제 사유
  foConsts.EXCHANGE_REASONS   = ['사이즈 불일치', '색상 변경', '상품불량', '오배송', '단순변심'];
  foConsts.RETURN_REASONS     = ['단순변심', '사이즈 불일치', '색상 상이', '상품불량', '오배송'];

  /* ════════ 이벤트 ════════ */
  /* 백엔드 이벤트상태코드 → 화면 한글.
   *   배열을 단일 소스로, 룩업 맵은 _byCode 로 파생. */
  foConsts.EVENT_STATUS_OPTIONS = [
    { codeValue: 'PENDING', codeLabel: '진행예정' },
    { codeValue: 'ACTIVE',  codeLabel: '진행중' },
    { codeValue: 'ENDED',   codeLabel: '종료' },
  ];
  foConsts.EVENT_STATUS_KOR = _byCode(foConsts.EVENT_STATUS_OPTIONS);
  /* 이벤트 카드 배너 그라데이션 (eventId 해시로 안정 배정) */
  foConsts.EVENT_BANNER_BGS = [
    'linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)', 'linear-gradient(135deg,#30cfd0,#330867)',
  ];

  /* ════════ 블로그 ════════ */
  /* 블로그 카테고리 (좌측 메뉴) — { codeValue, codeLabel } 형식.
   *   ⚠️ 현재 codeValue 는 화면 전용(all/fashion/...)이며 DB(cm_blog_cate=BC...) 와는 별개.
   *   향후 cm_blog_cate 기반으로 교체 시 codeValue 를 실제 카테고리ID 로 대체. */
  foConsts.BLOG_CATEGORIES = [
    { codeValue: 'all',       codeLabel: '전체' },
    { codeValue: 'fashion',   codeLabel: '패션' },
    { codeValue: 'lifestyle', codeLabel: '라이프스타일' },
    { codeValue: 'trend',     codeLabel: '트렌드' },
    { codeValue: 'howto',     codeLabel: '스타일링 팁' },
  ];

  /* ════════ 마이페이지 레이아웃 ════════ */
  /* My 탭 정의 */
  foConsts.MY_TABS = [
    { pageId: 'myOrder',   label: '주문',          icon: '📦' },
    { pageId: 'myClaim',   label: '취소/반품/교환', icon: '↩️' },
    { pageId: 'myCoupon',  label: '쿠폰',           icon: '🎟️' },
    { pageId: 'myCache',   label: '캐쉬',           icon: '💰' },
    { pageId: 'myContact', label: '문의',           icon: '📩' },
    { pageId: 'myChatt',   label: '채팅',           icon: '💬' },
  ];
  /* 기간 필터 프리셋 (개월) */
  foConsts.DATE_FILTER_PERIODS = [
    { label: '1달', value: 1 }, { label: '2달', value: 2 }, { label: '3달', value: 3 },
    { label: '6달', value: 6 }, { label: '1년', value: 12 }, { label: '1년6개월', value: 18 },
    { label: '2년', value: 24 }, { label: '3년', value: 36 },
  ];

  global.foConsts = global.foConsts || foConsts;
})(window);

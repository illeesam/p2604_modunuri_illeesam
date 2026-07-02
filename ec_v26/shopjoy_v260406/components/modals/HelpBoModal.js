/* ShopJoy BO - 통합 도움말 모달
   Props: show (Boolean), topic (String)
   Emits: close
*/
window.HelpBoModal = {
  name: 'HelpBoModal',
  inheritAttrs: false,
  props: {
    show:  { type: Boolean,   default: false },                           // 모달 표시 여부
    topic: { type: String,    default: '' },                              // 도움말 토픽,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, watch } = Vue;

    const TABS = [
      { id: 'overview',  label: '📋 개요' },
      { id: 'member',    label: '👤 회원관리' },
      { id: 'product',   label: '📦 상품관리' },
      { id: 'prodOpt',   label: '⚙ 옵션설정' },
      { id: 'order',     label: '🛒 주문관리' },
      { id: 'claim',     label: '🔄 클레임' },
      { id: 'promotion', label: '🎫 프로모션' },
      { id: 'display',   label: '🖼 전시관리' },
      { id: 'settle',    label: '💰 정산관리' },
      { id: 'system',    label: '🔧 시스템' },
    ];

    const OPT_SUB_TABS = [
      { id: 'basic',     label: '개요' },
      { id: 'clothing',  label: '의류 예시' },
      { id: 'shoes',     label: '신발 예시' },
      { id: 'elec',      label: '전자기기 예시' },
      { id: 'single',    label: '단독 옵션' },
      { id: 'inputtype', label: '입력 방식' },
    ];

    const OPT_OVERVIEW_ROWS = [
      { cat: '의류',       d1: '색상',   d2: '사이즈', ex: '블랙xS, 블랙xM, 화이트xS ...' },
      { cat: '신발',       d1: '사이즈', d2: '색상',   ex: '260x블랙, 265x블랙 ...' },
      { cat: '가방',       d1: '색상',   d2: '소재',   ex: '블랙x가죽, 블랙x캔버스 ...' },
      { cat: '색상+커스텀', d1: '색상',  d2: '커스텀', ex: '블랙x256GB, 블랙x512GB ...' },
      { cat: '단독',       d1: '해당유형', d2: '-',    ex: '블랙, 화이트, 레드' },
    ];

    const OPT_CLOTHING_ROWS = [
      { d1: '블랙', d2: 'S', sku: '블랙-S' },
      { d1: '블랙', d2: 'M', sku: '블랙-M' },
      { d1: '블랙', d2: 'L', sku: '블랙-L' },
      { d1: '화이트', d2: 'S', sku: '화이트-S' },
      { d1: '화이트', d2: 'M', sku: '화이트-M' },
    ];

    const OPT_SHOES_ROWS = [
      { d1: '250', d2: '블랙', sku: '250-블랙' },
      { d1: '255', d2: '블랙', sku: '255-블랙' },
      { d1: '260', d2: '블랙', sku: '260-블랙' },
      { d1: '260', d2: '화이트', sku: '260-화이트' },
      { d1: '265', d2: '화이트', sku: '265-화이트' },
    ];

    const OPT_ELEC_ROWS = [
      { d1: '블랙', d2: '128GB', sku: '블랙-128GB' },
      { d1: '블랙', d2: '256GB', sku: '블랙-256GB' },
      { d1: '블랙', d2: '512GB', sku: '블랙-512GB' },
      { d1: '실버', d2: '128GB', sku: '실버-128GB' },
      { d1: '실버', d2: '256GB', sku: '실버-256GB' },
    ];

    const OPT_SINGLE_ROWS = [
      { cat: '색상 단독 (COLOR)',     type: '1단: 색상',   ex: '블랙, 화이트, 레드, 블루' },
      { cat: '사이즈 단독 (SIZE)',    type: '1단: 사이즈', ex: 'S, M, L, XL, XXL' },
      { cat: '소재 단독 (MATERIAL)',  type: '1단: 소재',   ex: '면, 폴리에스터, 울, 린넨' },
      { cat: '직접입력 단독 (CUSTOM)', type: '1단: 커스텀', ex: '128GB, 256GB, 레드 에디션' },
    ];

    const INPUT_TYPES = [
      {
        type: 'SELECT', color: '#1677ff', bg: '#e6f4ff', border: '#bae0ff',
        title: '선택형 (SELECT)',
        desc: '드롭다운에서 항목 1개만 선택. 가장 일반적인 방식.',
        when: '색상, 사이즈 등 명확하게 정해진 옵션',
        ex: '블랙 / 화이트 / 레드 중 1개 선택',
      },
      {
        type: 'SELECT_INPUT', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591',
        title: '선택+입력형 (SELECT_INPUT)',
        desc: '드롭다운 목록에서 선택하거나, 직접 텍스트를 타이핑할 수도 있음.',
        when: '기본 목록 외 추가 입력이 필요한 경우',
        ex: 'S / M / L 선택 또는 2XL 직접 입력',
      },
      {
        type: 'MULTI_SELECT', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f',
        title: '복수선택형 (MULTI_SELECT)',
        desc: '체크박스 형태로 여러 항목을 동시에 선택 가능.',
        when: '부가 옵션, 토핑, 추가 구성 선택 등',
        ex: '초코 + 바닐라 + 딸기 동시 선택',
      },
    ];

    const OVERVIEW_CARDS = [
      { icon: '👤', title: '회원관리', desc: '회원 조회, 등록, 등급, 그룹 관리', tab: 'member' },
      { icon: '📦', title: '상품관리', desc: '상품, 카테고리, 옵션, SKU 관리',  tab: 'product' },
      { icon: '🛒', title: '주문관리', desc: '주문, 배송, 클레임 처리',          tab: 'order' },
      { icon: '🎫', title: '프로모션', desc: '쿠폰, 캐쉬, 이벤트, 기획전',      tab: 'promotion' },
      { icon: '🖼', title: '전시관리', desc: 'UI, 영역, 패널, 위젯 구성',       tab: 'display' },
      { icon: '🔧', title: '시스템',   desc: '코드, 사용자, 메뉴, 역할 관리',   tab: 'system' },
    ];

    const PRODUCT_STEPS = ['카테고리 선택', '기본정보 입력', '상세설정 (가격/배송)', '이미지 등록', '옵션 설정', '상품설명 작성', '저장'];

    const PRODUCT_TABS = [
      { tab: '기본정보',       desc: '상품명, 카테고리, 브랜드, 태그, 판매상태, 노출설정' },
      { tab: '상세설정',       desc: '가격, 할인, 배송비, 부가세, 원산지, 재고(단일), 판매기간' },
      { tab: '이미지',         desc: '메인/서브 이미지 등록 (드래그 정렬)' },
      { tab: '상품설명',       desc: 'HTML 에디터 블록 + 미리보기 분할' },
      { tab: '옵션설정',       desc: '옵션 카테고리, 차원, 값 설정' },
      { tab: '옵션(가격/재고)', desc: 'SKU별 추가금액, 재고 일괄 설정' },
      { tab: '연관상품',       desc: '함께구매, 코드연결 상품 지정' },
    ];

    const MEMBER_TABS_LIST = ['기본정보', '주문내역', '클레임내역', '배송내역', '쿠폰', '캐쉬', '문의', '채팅', '로그인이력'];

    const ORDER_STEPS = ['주문접수', '결제완료', '배송준비', '배송중', '배송완료', '구매확정'];

    const ORDER_STEP_DETAILS = [
      { step: '주문접수',  color: '#9ca3af', desc: '고객이 주문 완료. 결제 대기 상태. 재고 선점 처리.', action: '자동 처리 (시스템)' },
      { step: '결제완료',  color: '#3b82f6', desc: '결제 승인 완료. 판매자에게 주문 알림 발송.', action: '판매자 주문 확인 시작' },
      { step: '배송준비',  color: '#f59e0b', desc: '상품 피킹/패킹 중. 이 단계부터 취소 불가.', action: '출고 준비 작업 진행' },
      { step: '배송중',    color: '#8b5cf6', desc: '택배사 인수 완료. 송장번호 등록 필수. 고객에게 배송 시작 알림.', action: '송장번호 입력 후 상태 변경' },
      { step: '배송완료',  color: '#10b981', desc: '고객 수령 완료. 구매확정 대기. 반품/교환 신청 가능 시작.', action: '자동 전환 or 수동 처리' },
      { step: '구매확정',  color: '#6366f1', desc: '최종 거래 확정. 적립금 지급. 리뷰 작성 가능. 클레임 종료.', action: '고객 확정 or 14일 후 자동 확정' },
    ];

    const ORDER_PARTIAL_SCENARIO = [
      {
        item: '상품 A', status: '구매확정', claimStatus: '취소완료',
        color: '#9ca3af', claimColor: '#ef4444',
        desc: '배송 전 취소. cancel_qty = order_qty → CANCELLED 처리. 환불 완료.',
      },
      {
        item: '상품 B', status: '배송완료', claimStatus: '반품진행중',
        color: '#10b981', claimColor: '#f97316',
        desc: '배송완료 후 반품 신청. 수거 중 상태. 검수 후 환불 예정.',
      },
      {
        item: '상품 C', status: '구매확정', claimStatus: '없음',
        color: '#6366f1', claimColor: '#e0e0e0',
        desc: '정상 완료. 적립금 지급. 리뷰 작성 가능.',
      },
    ];

    const REFUND_ORDER_ROWS = [
      { rank: '1', method: '적립금 사용분',  color: '#f59e0b', bg: '#fffbe6', desc: '사용한 적립금 원 형태로 복원 (현금 환불 아님). 즉시 처리.' },
      { rank: '2', method: '캐쉬(충전금)',   color: '#10b981', bg: '#f0fdf4', desc: '사용한 캐쉬 잔액 복원 (현금 환불 아님). 즉시 처리.' },
      { rank: '3', method: '무통장/가상계좌', color: '#3b82f6', bg: '#eff6ff', desc: '고객 등록 계좌로 직접 이체. 1~3 영업일.' },
      { rank: '4', method: '간편결제(토스/카카오/네이버)', color: '#8b5cf6', bg: '#f5f3ff', desc: 'PG사 자동 환불 처리. 1~3 영업일.' },
      { rank: '5', method: '핸드폰결제',    color: '#f97316', bg: '#fff7ed', desc: '통신사 환불. 3~5 영업일.' },
      { rank: '6', method: '신용/체크카드', color: '#ef4444', bg: '#fef2f2', desc: '카드사 취소 처리. 3~7 영업일.' },
    ];

    const RETURN_FEE_ROWS = [
      { reason: '상품 불량/하자',    buyer: '-',     seller: '100%', note: '판매자 귀책 → 왕복 배송료 판매자 전액 부담' },
      { reason: '오배송/배송손상',   buyer: '-',     seller: '100%', note: '판매자 귀책 → 왕복 배송료 판매자 전액 부담' },
      { reason: '사이즈/색상 오류',  buyer: '-',     seller: '100%', note: '판매자 귀책 → 왕복 배송료 판매자 전액 부담' },
      { reason: '단순변심',          buyer: '50%',   seller: '50%',  note: '수거비 고객/판매자 반반 부담' },
    ];

    const COUPON_REFUND_ROWS = [
      { type: '주문쿠폰',  rule: '안분 차감 후 재발급 없음', detail: '반품 상품 금액 비율로 할인액 안분. 차감된 금액만큼 환불에서 제외.' },
      { type: '상품쿠폰',  rule: '해당 상품 할인액 전액 차감', detail: '반품 대상 상품에 적용된 상품쿠폰 할인액 환불 금액에서 제외.' },
      { type: '즉시할인',  rule: '안분 차감', detail: '프로모션 즉시할인도 비율로 안분하여 환불 금액 차감.' },
    ];

    /* DB CLAIM_STATUS 코드 기준 (OdOrderKanban CLAIM_FLOWS 정합) */
    const CLAIM_TYPES = [
      {
        title: '취소', emoji: '🔴', color: '#dc2626', bg: '#fff1f1',
        steps: [
          { key: 'REQUESTED',  label: '취소요청',   icon: '📋', desc: '고객이 취소 신청. 사유 입력 필수. 신청 직후 철회 가능.' },
          { key: 'PROCESSING', label: '취소처리중', icon: '⏳', desc: '관리자 승인 완료. 결제사에 환불 요청 진행 중.' },
          { key: 'COMPLT',     label: '취소완료',   icon: '✅', desc: '환불 완료. 원 결제수단으로 3~5 영업일 내 입금.' },
        ],
        cancelStep: { key: 'CANCELLED', label: '철회', icon: '↩️', desc: 'REQUESTED 상태에서만 가능. 철회 시 주문 복원.' },
        period: '결제완료 후 ~ 배송준비 착수 전',
        refund: '원 결제수단으로 3~5 영업일 내 환불',
        notes: ['배송준비(PREPARING) 이후에는 취소 불가', '배송 출발 후 취소 시 반품으로 전환 처리'],
      },
      {
        title: '반품', emoji: '🩷', color: '#db2777', bg: '#fff0f8',
        steps: [
          { key: 'REQUESTED',   label: '반품요청', icon: '📋', desc: '고객이 반품 신청. 사유·사진 첨부 필수. 신청 직후 철회 가능.' },
          { key: 'APPROVED',    label: '수거예정', icon: '🗓️', desc: '관리자 승인 완료. 택배사 지정 및 수거 일정 확정.' },
          { key: 'IN_PICKUP',   label: '수거중',   icon: '🚚', desc: '택배사가 상품 픽업. 창고 이동 중.' },
          { key: 'PROCESSING',  label: '검품중',   icon: '🔍', desc: '창고 입고 완료. 정상/손상/불량 여부 검수 진행.' },
          { key: 'REFUND_WAIT', label: '환불대기', icon: '💳', desc: '검수 완료. 환불 금액 확정 후 결제사 환불 요청.' },
          { key: 'COMPLT',      label: '환불완료', icon: '✅', desc: '환불 처리 완료. 배송료·손상 공제 후 입금.' },
        ],
        cancelStep: { key: 'CANCELLED', label: '철회', icon: '↩️', desc: 'REQUESTED 상태에서만 가능.' },
        period: '배송완료 후 30일 이내 (상품하자 180일, 배송손상 7일)',
        refund: '검품 완료 후 5~7 영업일 내 환불',
        notes: ['단순변심: 배송료 고객/판매자 50% 부담', '상품하자·오배송: 판매자 100% 부담', 'PROCESSING(검품) 단계에서 불량 판정 시 환불 금액 조정 가능'],
      },
      {
        title: '교환', emoji: '🔵', color: '#2563eb', bg: '#f0f5ff',
        steps: [
          { key: 'REQUESTED',   label: '교환요청', icon: '📋', desc: '고객이 교환 신청. 교환 옵션(사이즈·색상) 선택. 차액 발생 시 추가 결제.' },
          { key: 'APPROVED',    label: '수거예정', icon: '🗓️', desc: '관리자 승인 완료. 기존 상품 수거 택배사 지정 및 일정 확정.' },
          { key: 'IN_PICKUP',   label: '수거중',   icon: '🚚', desc: '기존 상품 픽업 완료. 창고 이동 중.' },
          { key: 'PROCESSING',  label: '재고확인', icon: '📦', desc: '기존 상품 입고 및 검수. 교환 상품 재고 확인 및 피킹·패킹.' },
          { key: 'REFUND_WAIT', label: '발송대기', icon: '🚀', desc: '교환 상품 발송 준비 완료. 출고 대기 중.' },
          { key: 'COMPLT',      label: '교환완료', icon: '🏁', desc: '교환 상품 발송 완료 확인. 추가 반품·취소는 새 클레임으로 신청.' },
        ],
        cancelStep: { key: 'CANCELLED', label: '철회', icon: '↩️', desc: 'REQUESTED 상태에서만 가능.' },
        period: '배송완료 후 30일 이내 (상품하자 180일, 배송손상 7일)',
        refund: '총 7~10일 소요 (수거 3~5일 + 발송 3~5일)',
        notes: ['단순변심: 수거료 50%/50%, 발송비 고객 100%', '상품하자·사이즈오류: 왕복 배송료 판매자 100%', 'PROCESSING(재고확인)에서 교환 불가 판정 시 반품 전환'],
      },
    ];

    const PROMO_ITEMS = [
      { icon: '🎟', title: '쿠폰',      desc: '발행, 배포, 사용 관리. 정률/정액 할인. 최소주문금액, 사용기한 설정.' },
      { icon: '💰', title: '캐쉬(충전금)', desc: '충전, 사용, 환불 처리. 유효기간 설정. 자동소멸 정책.' },
      { icon: '🏷', title: '이벤트',    desc: '기간, 대상, 혜택 설정. 노출 영역 연결.' },
      { icon: '📅', title: '기획전',    desc: '상품 묶음 전시. 기간 한정 기획 페이지 구성.' },
    ];

    const DISP_LEVELS = [
      { l: 'UI',     d: '사이트 전체 레이아웃' },
      { l: 'Area',   d: '화면 구역 (헤더/본문/푸터)' },
      { l: 'Panel',  d: '콘텐츠 패널 단위' },
      { l: 'Widget', d: '개별 위젯 (배너/상품/차트 등)' },
    ];

    const DISP_WIDGETS = ['image_banner', 'product_slider', 'product', 'chart_bar', 'chart_line', 'chart_pie', 'text_banner', 'info_card', 'popup', 'coupon', 'html_editor', 'event_banner', 'countdown', 'barcode'];

    const SYS_ITEMS = [
      { title: '공통코드관리',   desc: '코드그룹, 코드값 관리. OPT_TYPE, ORDER_STATUS 등 시스템 전역 코드.' },
      { title: '사용자/역할',    desc: '관리자 계정 등록, 역할(RBAC) 설정, 메뉴 권한 부여.' },
      { title: '메뉴관리',       desc: '좌측 메뉴 구조 편집. 순서, 노출 여부, 권한 연결.' },
      { title: '템플릿관리',     desc: '이메일, SMS 발송 템플릿. 변수 치환 지원.' },
      { title: '배치스케줄',     desc: '자동화 작업 등록, 실행, 이력 조회.' },
      { title: '표시경로(Path)', desc: 'biz_cd 기준 카테고리, 메뉴 트리 경로 관리.' },
    ];

    const SETTLE_STATUS_STEPS = [
      { code: 'DRAFT',     label: '작성중',   color: '#9ca3af', desc: '정산 집계 작성 중. 수정 가능.',                              table: 'st_settle', col: 'settle_status_cd' },
      { code: 'CONFIRMED', label: '확정',     color: '#3b82f6', desc: '정산액 확정 완료. 이후 수정 불가. 이의신청 기간 시작.',        table: 'st_settle', col: 'settle_status_cd' },
      { code: 'CLOSED',    label: '마감',     color: '#8b5cf6', desc: '정산 마감 처리 완료. 지급 대기 레코드(PENDING) 생성.',          table: 'st_settle', col: 'settle_status_cd' },
      { code: 'PAID',      label: '지급완료', color: '#10b981', desc: '업체 계좌 송금 완료. ERP 전표 생성 및 확인.',                  table: 'st_settle', col: 'settle_status_cd' },
    ];

    const SETTLE_CALC_ROWS = [
      { item: '총주문금액',    field: 'total_order_amt',  sign: '+', desc: '구매확정(CONFIRMED) 기준 매출 귀속분 합계' },
      { item: '총환불금액',    field: 'total_return_amt', sign: '-', desc: '환불 확정 시점 귀속 월에 반영 (발생주의)' },
      { item: '총할인금액',    field: 'total_discnt_amt', sign: '-', desc: '쿠폰/프로모션 할인 합계' },
      { item: '수수료',        field: 'commission_amt',   sign: '-', desc: '정산기준 수수료율 × 정산대상금액' },
      { item: '조정금액',      field: 'adj_amt',          sign: '±', desc: '배송료 조정, 이의신청 보정 등' },
      { item: '기타조정금액',  field: 'etc_adj_amt',      sign: '±', desc: '수동 조정, 분쟁 처리, 환수 등' },
      { item: '최종정산금액',  field: 'final_settle_amt', sign: '=', desc: '업체 계좌로 실제 지급되는 금액' },
    ];

    const SETTLE_RAW_TYPES = [
      { code: 'ORDER',    label: '주문',   color: '#10b981', desc: 'od_order_item CONFIRMED 기준 매출 수집' },
      { code: 'CANCEL',   label: '취소',   color: '#ef4444', desc: 'od_claim_item COMPLT(CANCEL) 기준 차감' },
      { code: 'RETURN',   label: '반품',   color: '#f97316', desc: 'od_claim_item COMPLT(RETURN) 기준 차감' },
      { code: 'EXCHANGE', label: '교환',   color: '#8b5cf6', desc: 'od_claim_item COMPLT(EXCHANGE) 기준 조정' },
      { code: 'SHIP',     label: '배송비', color: '#0891b2', desc: 'od_dliv DELIVERED 기준 배송비 수익·차감' },
    ];

    const SETTLE_POLICY_ROWS = [
      { title: '정산 주기',    desc: '월 1회 / 매월 마지막 영업일 마감',                                              table: 'st_settle',      col: 'settle_ym' },
      { title: '타월 환불',    desc: '환불 확정 시점의 귀속 월에 반영 (발생주의). 1월 주문 → 3월 반품 완료 → 3월 정산 차감', table: 'st_settle_raw',  col: 'raw_type_cd / settle_ym' },
      { title: '마이너스 정산', desc: 'final_settle_amt < 0 시 다음 달 이월(adj_amt) 또는 수동 조정',                    table: 'st_settle',      col: 'final_settle_amt / adj_amt' },
      { title: '이의신청',     desc: 'CONFIRMED 후 30일 이내. 인정 시 보정 정산(etc_adj_amt 반영)',                     table: 'st_settle',      col: 'etc_adj_amt' },
      { title: '지급 보류',    desc: '거래 분쟁 / 계좌 오류 / 정산계좌 미확인 / 서류 미제출 시 다음 정산까지 보류',          table: 'st_settle_pay',  col: 'pay_status_cd' },
      { title: '지급 기한',    desc: 'CLOSED 후 5 영업일 이내 자동 송금. 실패 시 3회 재시도 후 담당자 연락',               table: 'st_settle_pay',  col: 'pay_date / pay_status_cd' },
    ];

    const activeTab    = ref(props.topic || 'overview');
    const optSubTab    = ref('basic');
    const orderSubTab  = ref('flow');
    const settleSubTab = ref('overview');
    const showExtHelp  = ref(false);

    watch(() => props.topic, (v) => { if (v) activeTab.value = v; });
    watch(() => props.show,  (v) => { if (v && props.topic) activeTab.value = props.topic; });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ HelpBoModal.js : handleBtnAction -> ', cmd, param);
      // 도움말 모달 닫기
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 탭/서브탭 선택 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ HelpBoModal.js : handleSelectAction -> ', cmd, param);
      // 좌측 메인 탭 전환
      if (cmd === 'tab-select') {
        activeTab.value = param;
        return;
      // 옵션설정 서브탭 전환
      } else if (cmd === 'optSubTab-select') {
        optSubTab.value = param;
        return;
      // 주문 서브탭 전환
      } else if (cmd === 'orderSubTab-select') {
        orderSubTab.value = param;
        return;
      // 정산 서브탭 전환
      } else if (cmd === 'settleSubTab-select') {
        settleSubTab.value = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      handleBtnAction, handleSelectAction,                                  // dispatch
      activeTab, optSubTab, orderSubTab, settleSubTab, showExtHelp,        // 탭 상태
      TABS, OPT_SUB_TABS,                                                   // 탭 정의
      OPT_OVERVIEW_ROWS, OPT_CLOTHING_ROWS, OPT_SHOES_ROWS, OPT_ELEC_ROWS, OPT_SINGLE_ROWS, INPUT_TYPES,  // 옵션 데이터
      OVERVIEW_CARDS, PRODUCT_STEPS, PRODUCT_TABS, MEMBER_TABS_LIST,        // 개요/회원/상품
      ORDER_STEPS, ORDER_STEP_DETAILS, ORDER_PARTIAL_SCENARIO,              // 주문
      REFUND_ORDER_ROWS, RETURN_FEE_ROWS, COUPON_REFUND_ROWS,               // 환불/반품/쿠폰
      CLAIM_TYPES, PROMO_ITEMS, DISP_LEVELS, DISP_WIDGETS,                    // 클레임/프로모/전시
      SETTLE_STATUS_STEPS, SETTLE_CALC_ROWS, SETTLE_RAW_TYPES, SETTLE_POLICY_ROWS,  // 정산
      SYS_ITEMS,                                                             // 시스템
    };
  },
  template: `
<!-- ===== ■. 모달 ====================================================== -->
<bo-modal :show="show" width="960px" max-width="98vw" height="92vh" max-height="92vh"
  box-pad="0" body-pad="0" :z-index="3000" @close="handleBtnAction('modal-close')">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="background:#fff;border-radius:14px;height:100%;display:flex;flex-direction:column;overflow:hidden;">
    <!-- ===== ■.■. 헤더 ==================================================== -->
    <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid #ffc9d6;">
      <div style="font-size:15px;font-weight:800;color:#9f2946;">
        <span style="color:#e8587a;font-size:9px;margin-right:6px;">
          ●
        </span>
        도움말 가이드
      </div>
      <button @click="handleBtnAction('modal-close')" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,0.6);color:#9f2946;font-size:14px;cursor:pointer;">
        ✕
      </button>
    </div>
    <!-- ===== □.□. 헤더 ==================================================== -->
    <!-- ===== ■.■. 바디 ==================================================== -->
    <div style="flex:1;display:flex;overflow:hidden;">
      <!-- ===== ■.■.■. 좌측 탭 ================================================ -->
      <div style="width:176px;flex-shrink:0;background:#f7f8fa;border-right:1px solid #efe0e5;display:flex;flex-direction:column;padding:12px 0;overflow-y:auto;">
        <button v-for="t in TABS" :key="t.id" @click="handleSelectAction('tab-select', t.id)"
          :style="activeTab===t.id
          ? 'display:block;width:100%;text-align:left;padding:9px 16px;font-size:12px;font-weight:700;color:#e8587a;background:#fff;border:none;border-right:3px solid #e8587a;cursor:pointer;line-height:1.4;'
          : 'display:block;width:100%;text-align:left;padding:9px 16px;font-size:12px;font-weight:400;color:#666;background:transparent;border:none;border-right:3px solid transparent;cursor:pointer;line-height:1.4;'">
          {{ t.label }}
        </button>
      </div>
      <!-- ===== ■.■.■. 우측 콘텐츠 ============================================== -->
      <div style="flex:1;overflow-y:auto;padding:24px;">
        <!-- ===== ■.■.■.■. 개요 ================================================ -->
        <template v-if="activeTab==='overview'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 12px;">
            ShopJoy 관리자 시스템 개요
          </h3>
          <p style="color:#555;font-size:13px;line-height:1.8;margin-bottom:16px;">
            ShopJoy BO는 전자상거래 통합 관리 시스템입니다. 좌측 메뉴에서 도메인을 선택하고, 상단 탭에서 열린 화면들을 전환합니다.
          </p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
            <div v-for="item in OVERVIEW_CARDS" :key="item.tab"
              @click="handleSelectAction('tab-select', item.tab)"
              style="border:1px solid #e8f0ff;border-radius:10px;padding:14px;background:#f8fbff;cursor:pointer;">
              <div style="font-size:22px;margin-bottom:6px;">
                {{ item.icon }}
              </div>
              <div style="font-weight:700;color:#1677ff;font-size:13px;margin-bottom:4px;">
                {{ item.title }}
              </div>
              <div style="font-size:11px;color:#666;line-height:1.5;">
                {{ item.desc }}
              </div>
            </div>
          </div>
          <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:12px 16px;font-size:12px;color:#7c5500;">
            각 탭을 클릭하면 해당 도메인의 상세 도움말을 확인할 수 있습니다.
          </div>
          <div style="margin-top:12px;border:1px solid #c8e6ff;border-radius:8px;padding:12px 16px;background:#e8f4ff;display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div>
              <div style="font-size:13px;font-weight:700;color:#0958d9;margin-bottom:3px;">
                🔗 외부연동 설정 도움말
              </div>
              <div style="font-size:11px;color:#4a6fa5;line-height:1.5;">
                소셜로그인(Google · Kakao · Naver), 결제(Toss), 지도(Kakao) API 키 발급 및 설정 안내
              </div>
            </div>
            <button class="btn" @click="showExtHelp=true"
              style="white-space:nowrap;font-size:12px;background:#1677ff;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;flex-shrink:0;">
              설정 안내 보기 →
            </button>
          </div>
          <!-- 외부연동 설정 도움말 모달 (인라인 임베드) -->
          <co-ext-help-modal v-if="showExtHelp" :show="showExtHelp" @close="showExtHelp=false" />
        </template>
        <!-- ===== ■.■.■.■. 회원관리 ============================================== -->
        <!-- ===== ■.■.■.■. 영역 ================================================ -->
        <template v-else-if="activeTab==='member'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">
            👤 회원관리
          </h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                회원관리 기능
              </div>
              <div style="font-size:12px;color:#555;line-height:1.8;">
                <div>
                  • 전체 회원 목록 조회 (이름, 이메일, 전화번호, 상태 검색)
                </div>
                <div>
                  • 회원 상태:
                  <span style="background:#d1fae5;color:#065f46;border-radius:3px;padding:1px 6px;">
                    활성
                  </span>
                  <span style="background:#fee2e2;color:#991b1b;border-radius:3px;padding:1px 6px;margin-left:4px;">
                    정지
                  </span>
                  <span style="background:#f3f4f6;color:#374151;border-radius:3px;padding:1px 6px;margin-left:4px;">
                    탈퇴
                  </span>
                </div>
                <div>
                  • 행 클릭 - 상세(Dtl) 인라인 임베드
                </div>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                회원 상세 탭 구성
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">
                <span v-for="t in MEMBER_TABS_LIST" :key="t"
                  style="background:#e6f4ff;border:1px solid #bae0ff;border-radius:4px;padding:3px 8px;color:#0958d9;">
                  {{ t }}
                </span>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                등급/그룹
              </div>
              <div style="font-size:12px;color:#555;line-height:1.8;">
                <div>
                  •
                  <b>
                    회원등급
                  </b>
                  : 구매금액, 횟수 기준 자동 승급 조건 설정
                </div>
                <div>
                  •
                  <b>
                    회원그룹
                  </b>
                  : 수동 분류 (예: VIP고객, 임직원, 블랙리스트)
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 상품관리 ============================================== -->
        <!-- ===== ■.■.■.■. 영역 ================================================ -->
        <template v-else-if="activeTab==='product'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">
            📦 상품관리
          </h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                상품 등록 흐름
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:12px;flex-wrap:wrap;">
                <template v-for="(step,i) in PRODUCT_STEPS" :key="step">
                  <span style="background:#1677ff;color:#fff;border-radius:4px;padding:3px 8px;">
                    {{ step }}
                  </span>
                  <span v-if="i < PRODUCT_STEPS.length-1" style="color:#ccc;font-size:11px;">
                    -&gt;
                  </span>
                </template>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                상품 상세 탭
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 테이블 ========================================= -->
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <tr v-for="row in PRODUCT_TABS" :key="row.tab" style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:5px 8px;font-weight:600;color:#333;white-space:nowrap;width:110px;">
                    {{ row.tab }}
                  </td>
                  <td style="padding:5px 8px;color:#555;">
                    {{ row.desc }}
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 옵션설정 ============================================== -->
        <template v-else-if="activeTab==='prodOpt'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">
            ⚙ 옵션설정 상세 가이드
          </h3>
          <p style="font-size:12px;color:#888;margin:0 0 16px;">
            상품 상세 &gt; 옵션설정 탭
          </p>
          <!-- ===== ■.■.■.■.■. 서브탭 버튼 ========================================== -->
          <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="st in OPT_SUB_TABS" :key="st.id" @click="handleSelectAction('optSubTab-select', st.id)"
              :style="optSubTab===st.id
              ? 'padding:5px 12px;font-size:11px;border:1px solid #1677ff;border-radius:6px;cursor:pointer;background:#e6f4ff;color:#1677ff;font-weight:700;'
              : 'padding:5px 12px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;background:#f5f5f5;color:#555;'">
              {{ st.label }}
            </button>
          </div>
          <!-- ===== ■.■.■.■.■. 서브탭: 개요 ========================================= -->
          <template v-if="optSubTab==='basic'">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                  카테고리별 옵션 차원 구성
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">
                        카테고리
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        1단
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        2단
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">
                        SKU 예시
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_OVERVIEW_ROWS" :key="r.cat" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;">
                        {{ r.cat }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d1 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d2 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;color:#888;font-size:11px;">
                        {{ r.ex }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #b7eb8f;border-radius:8px;padding:14px;background:#f6ffed;">
                <div style="font-weight:700;color:#389e0d;margin-bottom:8px;font-size:13px;">
                  입력 방식 요약
                </div>
                <div style="font-size:12px;line-height:2;">
                  <b style="color:#1677ff;">
                    SELECT
                  </b>
                  — 드롭다운 1개 선택 (가장 일반적)
                </div>
                <div style="font-size:12px;line-height:2;">
                  <b style="color:#fa8c16;">
                    SELECT_INPUT
                  </b>
                  — 드롭다운 또는 직접 타이핑
                </div>
                <div style="font-size:12px;line-height:2;">
                  <b style="color:#52c41a;">
                    MULTI_SELECT
                  </b>
                  — 여러 항목 동시 선택
                </div>
              </div>
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;">
                상세 예시는 위 탭(의류, 신발, 전자기기 등)을 클릭하세요.
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브탭: 의류 ========================================= -->
          <template v-else-if="optSubTab==='clothing'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">
                  👗 의류 — 색상(1단) x 사이즈(2단)
                </div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">
                  카테고리: CLOTHING
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        색상 (1단)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        사이즈 (2단)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        생성되는 SKU
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_CLOTHING_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d1 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d2 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">
                        {{ r.sku }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">
                  설정 방법
                </div>
                <div>
                  1. 카테고리: 의류 (색상+사이즈) 선택
                </div>
                <div>
                  2. 1단 값 추가: 블랙, 화이트, 레드 등 색상 입력
                </div>
                <div>
                  3. 2단 값 추가: S, M, L, XL 등 사이즈 입력
                </div>
                <div>
                  4. 저장 시 색상x사이즈 조합으로 SKU 자동 생성
                </div>
                <div>
                  5. 각 SKU별 추가금액, 재고 설정 가능
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브탭: 신발 ========================================= -->
          <template v-else-if="optSubTab==='shoes'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">
                  👟 신발 — 사이즈(1단) x 색상(2단)
                </div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">
                  카테고리: SHOES
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        사이즈 (1단)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        색상 (2단)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        생성되는 SKU
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_SHOES_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d1 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d2 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">
                        {{ r.sku }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">
                  설정 방법
                </div>
                <div>
                  1. 카테고리: 신발 (사이즈+색상) 선택
                </div>
                <div>
                  2. 1단 값 추가: 250, 255, 260, 265, 270 등 사이즈 입력
                </div>
                <div>
                  3. 2단 값 추가: 블랙, 화이트, 네이비 등 색상 입력
                </div>
                <div>
                  4. 의류와 달리 사이즈가 기준 차원(1단)이 됨
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브탭: 전자기기 ======================================= -->
          <template v-else-if="optSubTab==='elec'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">
                  💻 전자기기 — 색상(1단) x 저장용량(2단)
                </div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">
                  카테고리: 색상+커스텀 (CUSTOM_GRP)
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        색상 (1단)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        용량 (2단/커스텀)
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">
                        생성되는 SKU
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_ELEC_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d1 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">
                        {{ r.d2 }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">
                        {{ r.sku }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">
                  설정 방법
                </div>
                <div>
                  1. 카테고리: 색상+커스텀 선택
                </div>
                <div>
                  2. 1단(색상) 값: 블랙, 실버, 골드 등 색상 입력
                </div>
                <div>
                  3. 2단(커스텀) 값: 128GB, 256GB, 512GB 직접 입력
                </div>
                <div>
                  4. 커스텀은 사전 정의 없이 자유 텍스트 입력 가능
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브탭: 단독 옵션 ====================================== -->
          <template v-else-if="optSubTab==='single'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                  단독 옵션 — 1차원만 사용
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">
                        카테고리
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">
                        사용 유형
                      </th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">
                        예시 값
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_SINGLE_ROWS" :key="r.cat" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-size:11px;">
                        {{ r.cat }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;">
                        {{ r.type }}
                      </td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;color:#888;">
                        {{ r.ex }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;line-height:1.8;">
                단독 옵션은 2단 차원 없이 1차원 SKU만 생성됩니다.
                <br>
                예) 색상 단독에서 블랙, 화이트, 레드 입력 시 SKU 3개 생성
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브탭: 입력 방식 ====================================== -->
          <template v-else-if="optSubTab==='inputtype'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div v-for="item in INPUT_TYPES" :key="item.type"
                :style="'border:1px solid '+item.border+';border-radius:8px;padding:14px;background:'+item.bg+';'">
                <!-- ===== ■.■.■.■.■.■.■.■. 헤더 영역 ===================================== -->
                <div :style="'font-weight:700;color:'+item.color+';margin-bottom:6px;font-size:13px;'">
                  {{ item.title }}
                </div>
                <div style="font-size:12px;line-height:1.8;">
                  <div style="margin-bottom:4px;">
                    {{ item.desc }}
                  </div>
                  <div>
                    <b>
                      사용 시점:
                    </b>
                    {{ item.when }}
                  </div>
                  <div>
                    <b>
                      예시:
                    </b>
                    {{ item.ex }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
        <!-- ===== ■.■.■.■. 주문관리 ============================================== -->
        <template v-else-if="activeTab==='order'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">
            🛒 주문관리
          </h3>
          <p style="font-size:12px;color:#888;margin:0 0 12px;">
            주문접수부터 구매확정까지. 상품(order_item) 단위 부분처리 지원.
          </p>
          <!-- ===== ■.■.■.■.■. 서브탭 ============================================= -->
          <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="st in [{id:'lifecycle',label:'라이프사이클 원칙'},{id:'flow',label:'상태 흐름'},{id:'partial',label:'부분처리/구매확정'},{id:'refund',label:'환불 순서'},{id:'bulk',label:'일괄 작업'}]"
              :key="st.id" @click="handleSelectAction('orderSubTab-select', st.id)"
              :style="orderSubTab===st.id
              ? 'padding:5px 12px;font-size:11px;border:1px solid #1677ff;border-radius:6px;cursor:pointer;background:#e6f4ff;color:#1677ff;font-weight:700;'
              : 'padding:5px 12px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;background:#f5f5f5;color:#555;'">
              {{ st.label }}
            </button>
          </div>
          <!-- ===== ■.■.■.■.■. 서브: 라이프사이클 원칙 ================================== -->
          <template v-if="orderSubTab==='lifecycle'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <!-- 이중 레벨 구조 개요 -->
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:16px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">
                  주문 라이프사이클 — 이중 레벨 구조
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:#333;">
                  <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #d9eaff;border-radius:6px;">
                    <div style="flex-shrink:0;width:120px;font-weight:700;color:#1d4ed8;">
                      od_order_item
                    </div>
                    <div style="flex:1;line-height:1.7;">
                      <b>실제 라이프사이클 기준 (Source of Truth)</b><br>
                      order_item_status_cd 가 상품별 실제 처리 상태를 추적.<br>
                      부분배송·부분취소·부분반품 등 item 단위 독립 처리가 가능.
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #d9eaff;border-radius:6px;">
                    <div style="flex-shrink:0;width:120px;font-weight:700;color:#6b7280;">
                      od_order
                    </div>
                    <div style="flex:1;line-height:1.7;">
                      <b>집계 요약 상태 (빠른 조회·필터용)</b><br>
                      order_status_cd 는 활성 order_item 상태들을 집계한 요약값.<br>
                      목록 검색·통계·알림에서 전체 주문 상태를 한 번에 파악하는 용도.
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #d9eaff;border-radius:6px;">
                    <div style="flex-shrink:0;width:120px;font-weight:700;color:#b45309;">
                      od_claim_item
                    </div>
                    <div style="flex:1;line-height:1.7;">
                      <b>클레임 상태 — order_item과 독립 공존</b><br>
                      클레임 진행 중이어도 order_item_status_cd 는 그대로 유지됨.<br>
                      claim_item_status_cd 가 취소/반품/교환 흐름을 독립 추적.
                    </div>
                  </div>
                </div>
              </div>
              <!-- 상태 집계 규칙 -->
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;background:#fafafa;">
                <div style="font-weight:700;color:#333;margin-bottom:10px;font-size:13px;">
                  order_status_cd 집계 규칙
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div v-for="rule in [
                    {cond:'모든 item이 CONFIRMED', result:'COMPLT', color:'#10b981'},
                    {cond:'1개 이상 item이 SHIPPING (나머지 DELIVERED/CONFIRMED)', result:'SHIPPED', color:'#8b5cf6'},
                    {cond:'1개 이상 item이 PREPARING', result:'PREPARING', color:'#f59e0b'},
                    {cond:'모든 item이 CANCELLED', result:'CANCELLED', color:'#9ca3af'},
                    {cond:'모든 item이 cancel_qty=order_qty (취소+반품 완료)', result:'RETURNED/CANCELLED', color:'#6b7280'},
                  ]" :key="rule.result"
                  style="display:flex;gap:10px;align-items:center;padding:8px 12px;background:#fff;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;">
                    <span style="flex:1;color:#444;">
                      {{ rule.cond }}
                    </span>
                    <span style="flex-shrink:0;font-size:10px;">→</span>
                    <span :style="'flex-shrink:0;background:'+rule.color+';color:#fff;border-radius:3px;padding:2px 8px;font-size:10px;font-weight:700;'">
                      {{ rule.result }}
                    </span>
                  </div>
                </div>
                <div style="margin-top:8px;font-size:11px;color:#888;line-height:1.7;padding:8px 10px;background:#f0f0f0;border-radius:6px;">
                  * 부분취소/부분반품 진행 중: 취소되지 않은 활성 item 중 가장 앞선 상태를 order_status_cd에 반영<br>
                  예) 3개 중 1개 반품 중 → 나머지 2개가 SHIPPED → order_status_cd = SHIPPED
                </div>
              </div>
              <!-- item 상태와 claim 상태 공존 다이어그램 -->
              <div style="border:1px solid #d1fae5;border-radius:8px;padding:16px;background:#f0fdf4;">
                <div style="font-weight:700;color:#059669;margin-bottom:10px;font-size:13px;">
                  order_item + claim_item 상태 공존 예시
                </div>
                <div style="font-size:11px;color:#555;margin-bottom:10px;line-height:1.6;">
                  주문 수량 3개 중 1개 반품 신청 시 — 두 상태가 동시에 독립 존재:
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
                  <div style="padding:10px 12px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;line-height:1.8;">
                    <div style="font-weight:700;color:#059669;margin-bottom:4px;">od_order_item</div>
                    <div>order_item_status_cd = <b style="color:#10b981">DELIVERED</b> <span style="color:#888;font-size:10px;">(주문 흐름 — 그대로 유지)</span></div>
                    <div>order_qty = 3, cancel_qty = 0</div>
                    <div style="font-size:10px;color:#888;">→ 반품 완료 후: cancel_qty = 1, item_cancel_amt += 반품금액</div>
                  </div>
                  <div style="text-align:center;color:#aaa;font-size:11px;">
                    ↕ order_item_id (FK) 연결
                  </div>
                  <div style="padding:10px 12px;background:#fff;border:1px solid #fed7aa;border-radius:6px;line-height:1.8;">
                    <div style="font-weight:700;color:#f97316;margin-bottom:4px;">od_claim_item</div>
                    <div>claim_item_status_cd = <b style="color:#f97316">IN_PICKUP</b> <span style="color:#888;font-size:10px;">(클레임 흐름 — 독립 진행)</span></div>
                    <div>claim_qty = 1, claim_type_cd = RETURN</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 상태 흐름 ======================================= -->
          <template v-else-if="orderSubTab==='flow'">
            <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;margin-bottom:12px;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">
                주문 상태 흐름
              </div>
              <div style="display:flex;align-items:center;gap:4px;font-size:11px;flex-wrap:wrap;margin-bottom:6px;">
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <template v-for="(s,i) in ORDER_STEPS" :key="s">
                  <span style="background:#1677ff;color:#fff;border-radius:4px;padding:3px 8px;">
                    {{ s }}
                  </span>
                  <span v-if="i < ORDER_STEPS.length-1" style="color:#bbb;">
                    -&gt;
                  </span>
                </template>
              </div>
              <div style="font-size:11px;color:#888;">
                * 주문 전체 상태는 활성 상품(미취소) 중 가장 앞선 상태로 집계
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="sd in ORDER_STEP_DETAILS" :key="sd.step"
                style="border:1px solid #e8e8e8;border-radius:8px;padding:10px 14px;background:#fff;display:flex;gap:12px;align-items:flex-start;">
                <div style="flex-shrink:0;min-width:68px;">
                  <span :style="'display:inline-block;background:'+sd.color+';color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-align:center;width:100%;'">
                    {{ sd.step }}
                  </span>
                </div>
                <div style="flex:1;">
                  <div style="font-size:12px;color:#333;line-height:1.7;">
                    {{ sd.desc }}
                  </div>
                  <div style="font-size:11px;color:#1677ff;margin-top:2px;">
                    ▶ {{ sd.action }}
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 부분처리/구매확정 =================================== -->
          <template v-else-if="orderSubTab==='partial'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <!-- ===== ■.■.■.■.■.■.■. 핵심 원칙 ======================================= -->
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
                  핵심 원칙
                </div>
                <div style="font-size:12px;color:#333;line-height:2;">
                  <div>
                    • 클레임은
                    <b>
                      상품(order_item) 단위
                    </b>
                    로 독립 처리 — 같은 주문의 다른 상품은 영향 없음
                  </div>
                  <div>
                    • 취소/반품/교환은
                    <b>
                      수량 단위
                    </b>
                    로도 부분 신청 가능 (예: 3개 중 1개만 반품)
                  </div>
                  <div>
                    •
                    <b>
                      구매확정
                    </b>
                    은 상품 단위로 개별 처리 (배송완료 후 7일 경과 시 자동 확정)
                  </div>
                  <div>
                    • 클레임 진행 중인 상품은 자동 확정 타이머
                    <b>
                      보류
                    </b>
                    → 클레임 종결 후 재산정
                  </div>
                  <div>
                    • 주문 전체 상태는
                    <b>
                      취소되지 않은 활성 상품
                    </b>
                    들의 상태 중 가장 앞선 값으로 집계
                  </div>
                </div>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 시나리오 ======================================== -->
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
                <div style="font-weight:700;color:#333;margin-bottom:4px;font-size:13px;">
                  시나리오: 상품 3개 주문 — 1개 취소, 1개 반품진행중, 1개 정상완료
                </div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">
                  주문 전체 상태 = 활성 상품(B,C) 중 가장 앞선 상태 = 배송완료
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div v-for="sc in ORDER_PARTIAL_SCENARIO" :key="sc.item"
                    style="border:1px solid #e8e8e8;border-radius:6px;padding:10px 12px;background:#fff;display:flex;gap:10px;align-items:flex-start;">
                    <div style="flex-shrink:0;width:60px;font-weight:700;font-size:12px;color:#333;">
                      {{ sc.item }}
                    </div>
                    <div style="flex:1;">
                      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
                        <span :style="'background:'+sc.color+';color:#fff;border-radius:3px;padding:1px 7px;font-size:10px;font-weight:700;'">
                          주문: {{ sc.status }}
                        </span>
                        <span :style="'background:'+sc.claimColor+';color:#fff;border-radius:3px;padding:1px 7px;font-size:10px;font-weight:700;'">
                          클레임: {{ sc.claimStatus }}
                        </span>
                      </div>
                      <div style="font-size:11px;color:#555;line-height:1.6;">
                        {{ sc.desc }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 구매확정 상세 ===================================== -->
              <div style="border:1px solid #d9f0e7;border-radius:8px;padding:14px;background:#f0fdf4;">
                <div style="font-weight:700;color:#059669;margin-bottom:8px;font-size:13px;">
                  구매확정 처리 방식
                </div>
                <div style="font-size:12px;color:#333;line-height:2;">
                  <div>
                    •
                    <b>
                      수동 확정
                    </b>
                    : 고객이 마이페이지에서 상품별 "구매확정" 버튼 클릭
                  </div>
                  <div>
                    •
                    <b>
                      자동 확정
                    </b>
                    : 배송완료 후
                    <b>
                      7일 경과
                    </b>
                    시 시스템이 자동 CONFIRMED 전환
                  </div>
                  <div>
                    • 클레임(반품/교환) 진행 중 → 자동 확정
                    <b>
                      타이머 정지
                    </b>
                  </div>
                  <div>
                    • 클레임 종결(완료/거부/철회) → 남은 기간부터 타이머
                    <b>
                      재산정
                    </b>
                  </div>
                  <div>
                    • 구매확정 시: 적립금 지급, 리뷰 작성 가능, 추가 클레임 불가
                  </div>
                </div>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 부분취소/반품/교환 제약 =============================== -->
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:4px;">
                  부분처리 제약사항
                </div>
                <div>
                  •
                  <b>
                    취소
                  </b>
                  : 배송준비 착수 전(PREPARING 이전)만 가능. 이후는 반품으로 처리
                </div>
                <div>
                  •
                  <b>
                    반품/교환
                  </b>
                  : 배송완료 후 30일 이내 (상품하자 180일, 배송손상 7일)
                </div>
                <div>
                  • 동일 상품에 진행 중인 클레임 있으면 중복 신청 불가
                </div>
                <div>
                  • 위생상품, 개봉식품, 디지털상품, 주문제작품 반품/교환 불가
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 환불 순서 ======================================= -->
          <template v-else-if="orderSubTab==='refund'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <!-- ===== ■.■.■.■.■.■.■. 환불 우선순위 ===================================== -->
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
                <!-- ===== ■.■.■.■.■.■.■.■. 헤더 영역 ===================================== -->
                <div style="font-weight:700;color:#333;margin-bottom:10px;font-size:13px;">
                  환불 처리 우선순위
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div v-for="row in REFUND_ORDER_ROWS" :key="row.rank"
                    :style="'border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;background:'+row.bg+';display:flex;gap:10px;align-items:flex-start;'">
                    <div :style="'flex-shrink:0;width:22px;height:22px;border-radius:50%;background:'+row.color+';color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;'">
                      {{ row.rank }}
                    </div>
                    <div style="flex:1;">
                      <div :style="'font-weight:700;font-size:12px;color:'+row.color+';margin-bottom:2px;'">
                        {{ row.method }}
                      </div>
                      <div style="font-size:11px;color:#555;line-height:1.6;">
                        {{ row.desc }}
                      </div>
                    </div>
                  </div>
                </div>
                <div style="margin-top:8px;font-size:11px;color:#888;line-height:1.7;">
                  * 복수 결제수단 혼용 시 적립금/캐쉬 먼저 복원 후 나머지를 결제수단 역순으로 환불
                </div>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 반품 배송비 ====================================== -->
              <div style="border:1px solid #fee2e2;border-radius:8px;padding:14px;background:#fff5f5;">
                <div style="font-weight:700;color:#ef4444;margin-bottom:10px;font-size:13px;">
                  반품 배송비 부담 기준
                </div>
                <!-- ===== ■.■.■.■.■.■.■.■. 테이블 ======================================= -->
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#fee2e2;">
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:left;">
                        반품 사유
                      </th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:center;">
                        고객
                      </th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:center;">
                        판매자
                      </th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:left;">
                        비고
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in RETURN_FEE_ROWS" :key="row.reason" style="border-bottom:1px solid #fecaca;">
                      <td style="padding:5px 8px;border:1px solid #fecaca;font-weight:600;">
                        {{ row.reason }}
                      </td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;text-align:center;" :style="row.buyer!=='-'?'color:#ef4444;font-weight:700;':''">
                        {{ row.buyer }}
                      </td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;text-align:center;" :style="row.seller==='100%'?'color:#3b82f6;font-weight:700;':''">
                        {{ row.seller }}
                      </td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;font-size:11px;color:#666;">
                        {{ row.note }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- ===== ■.■.■.■.■.■.■. 쿠폰/할인 환불 처리 ================================= -->
              <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;background:#f0fdf4;">
                <div style="font-weight:700;color:#059669;margin-bottom:10px;font-size:13px;">
                  쿠폰/할인 환불 처리 방식
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div v-for="row in COUPON_REFUND_ROWS" :key="row.type"
                    style="border:1px solid #a7f3d0;border-radius:6px;padding:10px 12px;background:#fff;">
                    <!-- ===== ■.■.■.■.■.■.■.■.■.■. 헤더 영역 ================================= -->
                    <div style="font-weight:700;font-size:12px;color:#065f46;margin-bottom:4px;">
                      {{ row.type }}
                    </div>
                    <div style="font-size:11px;color:#333;margin-bottom:2px;">
                      <b>
                        규칙:
                      </b>
                      {{ row.rule }}
                    </div>
                    <div style="font-size:11px;color:#555;">
                      {{ row.detail }}
                    </div>
                  </div>
                </div>
                <div style="margin-top:10px;font-size:11px;color:#065f46;background:#d1fae5;border-radius:6px;padding:8px 10px;line-height:1.7;">
                  <b>
                    환불액 계산 공식
                  </b>
                  <br>
                  환불액 = 반품상품금액 - 쿠폰/할인 안분액 - 반품배송비(고객부담) - 상품손상 감액
                  <br>
                  + 사용적립금 복원 (현금 아닌 적립금으로 복원)
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 일괄 작업 ======================================= -->
          <template v-else-if="orderSubTab==='bulk'">
            <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">
                일괄 작업 방법
              </div>
              <div style="font-size:12px;color:#555;line-height:1.9;">
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <div>
                  • 목록 좌측 체크박스로 복수 선택 후
                  <b>
                    [변경작업 선택]
                  </b>
                  버튼 클릭
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
              <div v-for="item in [
                {title:'상태변경', color:'#3b82f6', desc:'선택한 주문들의 주문 상태를 일괄 전환. 배송준비 → 배송중 등.'},
                {title:'결제수단', color:'#8b5cf6', desc:'결제 방식 수정. 주로 무통장 입금 확인 후 결제완료 처리에 사용.'},
                {title:'택배정보', color:'#10b981', desc:'택배사 선택 및 송장번호 일괄 입력. 배송중 상태로 자동 전환.'},
                {title:'결재처리', color:'#f59e0b', desc:'내부 결재 승인 처리. 특정 금액 이상 주문의 내부 승인 워크플로우.'},
                {title:'추가결재요청', color:'#ef4444', desc:'고객에게 추가 금액 결제 요청. 담당자/상품/금액/사유 입력 후 알림 발송.'},
                ]" :key="item.title"
                style="border:1px solid #e8e8e8;border-radius:8px;padding:10px 14px;background:#fff;display:flex;gap:12px;align-items:flex-start;">
                <span :style="'flex-shrink:0;display:inline-block;background:'+item.color+';color:#fff;border-radius:4px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap;'">
                  {{ item.title }}
                </span>
                <span style="font-size:12px;color:#444;line-height:1.7;">
                  {{ item.desc }}
                </span>
              </div>
            </div>
          </template>
        </template>
        <!-- ===== ■.■.■.■. 클레임 =============================================== -->
        <template v-else-if="activeTab==='claim'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">
            🔄 클레임 처리
          </h3>
          <p style="font-size:12px;color:#888;margin:0 0 16px;">
            취소 / 반품 / 교환 — DB 코드: <code style="background:#f3f4f6;border-radius:3px;padding:1px 5px;font-size:11px;">CLAIM_STATUS</code>
          </p>
          <!-- ===== ■.■.■.■.■. 클레임 유형별 카드 ===================================== -->
          <div style="display:flex;flex-direction:column;gap:18px;">
            <div v-for="ct in CLAIM_TYPES" :key="ct.title"
              :style="'border:1px solid '+ct.color+'40;border-radius:10px;overflow:hidden;background:'+ct.bg+';'">
              <!-- ===== 유형 헤더 ==================================================== -->
              <div :style="'background:'+ct.color+';padding:9px 14px;display:flex;align-items:center;gap:8px;'">
                <span style="font-size:15px;">
                  {{ ct.emoji }}
                </span>
                <span style="font-weight:800;color:#fff;font-size:13px;">
                  {{ ct.title }}
                </span>
                <span style="font-size:11px;color:rgba(255,255,255,.75);margin-left:4px;">
                  {{ ct.period }}
                </span>
              </div>
              <!-- ===== 상태 흐름 시각화 ============================================== -->
              <div style="padding:12px 14px 10px;">
                <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                  <!-- ===== ■.■.■.■.■.■.■.■. 상태 배지 행 ============================= -->
                  <template v-for="(s,i) in ct.steps" :key="s.key">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                      <span :style="'background:'+ct.color+';color:#fff;border-radius:5px;padding:3px 9px;font-size:10px;font-weight:700;white-space:nowrap;'">
                        {{ s.icon }} {{ s.label }}
                      </span>
                      <span style="font-size:9px;color:#999;font-family:monospace;">
                        {{ s.key }}
                      </span>
                    </div>
                    <span v-if="i < ct.steps.length-1" style="color:#bbb;font-size:12px;flex-shrink:0;padding-bottom:12px;">
                      →
                    </span>
                  </template>
                  <!-- ===== 철회 경로 ================================================= -->
                  <span v-if="ct.cancelStep" style="color:#d1d5db;font-size:11px;padding-bottom:12px;margin-left:4px;">
                    |
                  </span>
                  <div v-if="ct.cancelStep" style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                    <span style="background:#9ca3af;color:#fff;border-radius:5px;padding:3px 9px;font-size:10px;font-weight:700;white-space:nowrap;">
                      {{ ct.cancelStep.icon }} {{ ct.cancelStep.label }}
                    </span>
                    <span style="font-size:9px;color:#999;font-family:monospace;">
                      {{ ct.cancelStep.key }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- ===== 단계별 설명 ================================================== -->
              <div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:5px;">
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <div v-for="s in ct.steps" :key="s.key+'_d'"
                  style="display:flex;gap:10px;align-items:flex-start;font-size:12px;">
                  <span :style="'flex-shrink:0;min-width:60px;border-radius:3px;padding:1px 6px;font-size:10px;font-weight:700;color:#fff;background:'+ct.color+';text-align:center;'">
                    {{ s.label }}
                  </span>
                  <span style="color:#444;line-height:1.65;padding-top:1px;">
                    {{ s.desc }}
                  </span>
                </div>
                <div v-if="ct.cancelStep" style="display:flex;gap:10px;align-items:flex-start;font-size:12px;">
                  <span style="flex-shrink:0;min-width:60px;border-radius:3px;padding:1px 6px;font-size:10px;font-weight:700;color:#fff;background:#9ca3af;text-align:center;">
                    {{ ct.cancelStep.label }}
                  </span>
                  <span style="color:#444;line-height:1.65;padding-top:1px;">
                    {{ ct.cancelStep.desc }}
                  </span>
                </div>
              </div>
              <!-- ===== 정책 요약 ==================================================== -->
              <div :style="'border-top:1px dashed '+ct.color+'40;padding:8px 14px 10px;font-size:11px;color:#555;line-height:1.9;'">
                <span style="font-weight:700;">
                  환불/완료:
                </span>
                {{ ct.refund }}
                <span v-for="note in ct.notes" :key="note" style="display:block;">
                  • {{ note }}
                </span>
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 공통 제약사항 ========================================= -->
          <div style="margin-top:16px;border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;">
            <div style="font-weight:700;margin-bottom:6px;">
              ⚠ 공통 제약사항
            </div>
            <div style="line-height:1.9;">
              <div>
                • 동일 상품당 취소/반품/교환 중 1가지만 동시 진행 불가
              </div>
              <div>
                • 진행 중인 클레임이 있으면 동일 상품 추가 신청 불가
              </div>
              <div>
                • 위생상품, 개봉식품, 디지털상품, 주문제작품은 반품/교환 불가
              </div>
              <div>
                • REQUESTED 상태에서만 철회(CANCELLED) 가능
              </div>
            </div>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 프로모션 ============================================== -->
        <template v-else-if="activeTab==='promotion'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">
            🎫 프로모션
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div v-for="item in PROMO_ITEMS" :key="item.title"
              style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-size:20px;margin-bottom:6px;">
                {{ item.icon }}
              </div>
              <div style="font-weight:700;color:#1677ff;font-size:13px;margin-bottom:4px;">
                {{ item.title }}
              </div>
              <div style="font-size:11px;color:#555;line-height:1.6;">
                {{ item.desc }}
              </div>
            </div>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 전시관리 ============================================== -->
        <template v-else-if="activeTab==='display'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">
            🖼 전시관리
          </h3>
          <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;margin-bottom:14px;">
            <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">
              계층 구조
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;flex-wrap:wrap;">
              <template v-for="(lv,i) in DISP_LEVELS" :key="lv.l">
                <!-- ===== ■.■.■.■.■.■.■.■. 영역 ======================================== -->
                <div style="text-align:center;">
                  <div style="background:#1677ff;color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;">
                    {{ lv.l }}
                  </div>
                  <div style="font-size:10px;color:#666;margin-top:2px;white-space:nowrap;">
                    {{ lv.d }}
                  </div>
                </div>
                <span v-if="i < DISP_LEVELS.length-1" style="color:#bbb;font-size:16px;">
                  &gt;
                </span>
              </template>
            </div>
          </div>
          <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
            <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">
              위젯 타입
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">
              <span v-for="w in DISP_WIDGETS" :key="w"
                style="background:#f0f7ff;border:1px solid #bae0ff;border-radius:4px;padding:3px 8px;color:#0958d9;">
                {{ w }}
              </span>
            </div>
          </div>
        </template>
        <!-- ===== ■.■.■.■. 정산관리 ============================================== -->
        <template v-else-if="activeTab==='settle'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">
            💰 정산관리
          </h3>
          <p style="font-size:12px;color:#888;margin:0 0 10px;">
            판매자 월별 정산. 구매확정 기준 수집 → 수수료 차감 → 마감 → 지급.
          </p>
          <!-- 서브탭 버튼 -->
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px;">
            <button v-for="st in [{id:'overview',label:'개요'},{id:'raw',label:'매출수집예'},{id:'deduct',label:'차감예'},{id:'readjust',label:'재정산 예'},{id:'adjust',label:'정산조정예'},{id:'close',label:'마감기준설명'},{id:'erp',label:'전표처리예'},{id:'pay',label:'지급'}]"
              :key="st.id" @click="handleSelectAction('settleSubTab-select', st.id)"
              :style="settleSubTab===st.id
              ? 'padding:5px 12px;font-size:11px;border:1px solid #059669;border-radius:6px;cursor:pointer;background:#ecfdf5;color:#059669;font-weight:700;'
              : 'padding:5px 12px;font-size:11px;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;background:#fff;color:#555;'">
              {{ st.label }}
            </button>
          </div>
          <!-- ===== ■.■.■.■.■. 서브: 개요 ========================================= -->
          <template v-if="settleSubTab==='overview'">
            <!-- 정산 상태 흐름 -->
            <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;background:#f0fdf4;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-weight:700;color:#059669;font-size:13px;">정산 상태 흐름</div>
                <span style="font-size:10px;font-family:monospace;color:#059669;background:#fff;border:1px solid #a7f3d0;border-radius:4px;padding:2px 7px;">st_settle.settle_status_cd</span>
              </div>
              <div style="display:flex;align-items:stretch;gap:0;margin-bottom:10px;border:1px solid #a7f3d0;border-radius:6px;overflow:hidden;">
                <div v-for="(s,i) in SETTLE_STATUS_STEPS" :key="s.code"
                  :style="'flex:1;padding:10px 8px;background:'+s.color+'18;border-right:'+(i<SETTLE_STATUS_STEPS.length-1?'1px solid #a7f3d0':'none')+';'">
                  <div :style="'font-size:10px;font-weight:700;color:'+s.color+';margin-bottom:4px;'">
                    <span :style="'display:inline-block;background:'+s.color+';color:#fff;border-radius:3px;padding:1px 6px;margin-right:4px;'">{{ s.code }}</span>
                    {{ s.label }}
                  </div>
                  <div style="font-size:10px;color:#555;line-height:1.5;">{{ s.desc }}</div>
                </div>
              </div>
              <div style="font-size:11px;color:#065f46;line-height:1.7;">
                • CONFIRMED 이후 수정 불가 &nbsp;·&nbsp; CLOSED 시 지급 대기(PENDING) 레코드 자동 생성 (<code style="background:#fff;border:1px solid #a7f3d0;border-radius:3px;padding:0 4px;">st_settle_pay</code>)
              </div>
            </div>
            <!-- 정산액 계산식 -->
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-weight:700;color:#333;font-size:13px;">정산액 계산식</div>
                <span style="font-size:10px;font-family:monospace;color:#555;background:#fff;border:1px solid #ddd;border-radius:4px;padding:2px 7px;">테이블: st_settle</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div v-for="(row,i) in SETTLE_CALC_ROWS" :key="row.field"
                  :style="'display:flex;gap:8px;align-items:flex-start;padding:7px 10px;border-radius:5px;font-size:12px;'+(i===SETTLE_CALC_ROWS.length-1?'background:#e5f9ee;border:1px solid #a7f3d0;font-weight:700;':'background:#fff;border:1px solid #e8e8e8;')">
                  <span :style="'flex-shrink:0;width:22px;text-align:center;font-weight:700;font-size:13px;color:'+(row.sign==='+'?'#10b981':row.sign==='-'?'#ef4444':row.sign==='='?'#1d4ed8':'#f59e0b')+';'">{{ row.sign }}</span>
                  <span style="flex-shrink:0;width:88px;color:#555;">{{ row.item }}</span>
                  <span style="flex-shrink:0;width:130px;color:#888;font-size:10px;font-family:monospace;">{{ row.field }}</span>
                  <span style="flex:1;color:#666;font-size:11px;line-height:1.5;">{{ row.desc }}</span>
                </div>
              </div>
            </div>
            <!-- 핵심 정책 -->
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#333;margin-bottom:8px;font-size:13px;">핵심 정책</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <div v-for="p in SETTLE_POLICY_ROWS" :key="p.title"
                  style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;background:#fff;border:1px solid #e8e8e8;border-radius:5px;font-size:12px;">
                  <span style="flex-shrink:0;font-weight:700;color:#1d4ed8;min-width:80px;line-height:1.5;">{{ p.title }}</span>
                  <span style="flex:1;color:#444;line-height:1.6;">{{ p.desc }}</span>
                  <span style="flex-shrink:0;font-size:10px;font-family:monospace;color:#888;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:2px 6px;white-space:nowrap;">{{ p.table }}.{{ p.col }}</span>
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 매출수집예 ===================================== -->
          <template v-else-if="settleSubTab==='raw'">
            <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;background:#f0fdf4;margin-bottom:12px;">
              <div style="font-weight:700;color:#059669;margin-bottom:8px;font-size:13px;">수집원장 유형 (st_settle_raw.raw_type_cd)</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <div v-for="r in SETTLE_RAW_TYPES" :key="r.code"
                  style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;background:#fff;border:1px solid #e8e8e8;border-radius:5px;font-size:12px;">
                  <span :style="'flex-shrink:0;background:'+r.color+';color:#fff;border-radius:3px;padding:1px 8px;font-size:10px;font-weight:700;min-width:56px;text-align:center;'">{{ r.label }}</span>
                  <span style="flex-shrink:0;font-size:10px;font-family:monospace;color:#999;min-width:64px;">{{ r.code }}</span>
                  <span style="flex:1;color:#555;line-height:1.5;">{{ r.desc }}</span>
                </div>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#333;margin-bottom:10px;font-size:13px;">매출수집 예시 (3월 구매확정 기준)</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#f0fdf4;">
                  <th style="padding:7px 10px;border:1px solid #d1fae5;text-align:left;">od_order_item.order_item_id</th>
                  <th style="padding:7px 10px;border:1px solid #d1fae5;text-align:left;">order_item_status_cd</th>
                  <th style="padding:7px 10px;border:1px solid #d1fae5;text-align:right;">order_item_amt</th>
                  <th style="padding:7px 10px;border:1px solid #d1fae5;text-align:left;">raw_type_cd</th>
                  <th style="padding:7px 10px;border:1px solid #d1fae5;text-align:right;">수집금액</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">ITEM-001</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 6px;font-size:10px;">CONFIRMED</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">50,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">ORDER</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#10b981;font-weight:700;">+50,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">ITEM-002</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 6px;font-size:10px;">CONFIRMED</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">30,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">ORDER</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#10b981;font-weight:700;">+30,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">ITEM-003</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#9ca3af;color:#fff;border-radius:3px;padding:1px 6px;font-size:10px;">SHIPPED</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">20,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;color:#9ca3af;">미수집</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">-</td></tr>
                  <tr style="background:#f0fdf4;font-weight:700;"><td colspan="4" style="padding:7px 10px;border:1px solid #a7f3d0;text-align:right;">3월 ORDER 수집합계</td><td style="padding:7px 10px;border:1px solid #a7f3d0;text-align:right;color:#059669;">+80,000</td></tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#065f46;margin-top:8px;line-height:1.6;">
                • 수집 기준: <code style="background:#d1fae5;padding:1px 4px;border-radius:3px;">order_item_status_cd = 'CONFIRMED'</code> 확정 시점의 귀속 월<br>
                • 배송비(SHIP)는 od_dliv.dliv_status_cd = 'DELIVERED' 확정 시 별도 수집
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 차감예 ======================================= -->
          <template v-else-if="settleSubTab==='deduct'">
            <div style="border:1px solid #fee2e2;border-radius:8px;padding:14px;background:#fff5f5;margin-bottom:12px;">
              <div style="font-weight:700;color:#dc2626;margin-bottom:8px;font-size:13px;">취소·반품 차감 예시</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#fee2e2;">
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:left;">od_claim_item.claim_item_id</th>
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:left;">claim_type_cd</th>
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:left;">claim_item_status_cd</th>
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:right;">refund_amt</th>
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:left;">raw_type_cd</th>
                  <th style="padding:7px 10px;border:1px solid #fecaca;text-align:right;">차감금액</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">CLM-001-1</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#ef4444;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">CANCEL</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#6b7280;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">COMPLT</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">25,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#ef4444;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">CANCEL</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#ef4444;font-weight:700;">-25,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">CLM-002-1</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#f97316;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">RETURN</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#6b7280;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">COMPLT</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">15,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#f97316;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">RETURN</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#f97316;font-weight:700;">-15,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">CLM-003-1</td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#8b5cf6;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">EXCHANGE</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#9ca3af;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">PROC</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">10,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;color:#9ca3af;">미수집</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">-</td></tr>
                  <tr style="background:#fff5f5;font-weight:700;"><td colspan="5" style="padding:7px 10px;border:1px solid #fecaca;text-align:right;">3월 차감합계</td><td style="padding:7px 10px;border:1px solid #fecaca;text-align:right;color:#dc2626;">-40,000</td></tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#991b1b;margin-top:8px;line-height:1.6;">
                • 차감 기준: <code style="background:#fee2e2;padding:1px 4px;border-radius:3px;">claim_item_status_cd = 'COMPLT'</code> 완료 시점의 귀속 월<br>
                • 교환(EXCHANGE)은 COMPLT 이후 교환배송 DELIVERED 확정 시 EXCHANGE 원장 수집<br>
                • 쿠폰/할인 차감은 total_discnt_amt 컬럼에 별도 집계
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 재정산 예 ===================================== -->
          <template v-else-if="settleSubTab==='readjust'">
            <div style="border:1px solid #ede9fe;border-radius:8px;padding:14px;background:#f5f3ff;margin-bottom:12px;">
              <div style="font-weight:700;color:#7c3aed;margin-bottom:8px;font-size:13px;">타월(他月) 환불 발생 시 재정산 흐름</div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #ddd6fe;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#7c3aed;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">1</span>
                  <div><strong>1월</strong> — ITEM-001 구매확정(CONFIRMED) → 1월 ORDER 수집 +50,000</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #ddd6fe;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#7c3aed;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">2</span>
                  <div><strong>1월 말</strong> — 1월 정산 CONFIRMED(확정). final_settle_amt = 50,000 - 수수료. 수정 불가.</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #ddd6fe;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#7c3aed;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">3</span>
                  <div><strong>3월</strong> — 고객 반품 신청 → 반품 수거 → COMPLT → <code style="background:#ede9fe;padding:1px 4px;border-radius:3px;">3월 RETURN 원장</code> 수집 -50,000</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#7c3aed;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">4</span>
                  <div><strong>3월 말 정산</strong> — total_return_amt += 50,000 반영 → 3월 final_settle_amt 차감 적용<br><span style="color:#7c3aed;font-size:11px;">→ 1월 정산은 건드리지 않음. 3월 정산에 발생주의로 반영.</span></div>
                </div>
              </div>
              <div style="font-size:11px;color:#5b21b6;margin-top:10px;padding:8px 10px;background:#ede9fe;border-radius:5px;line-height:1.7;">
                ⭐ <strong>발생주의 원칙</strong>: 반품·취소 사건이 발생한 월의 정산에 차감. 최초 매출 귀속 월(1월)은 수정하지 않는다.<br>
                ⭐ <strong>마이너스 정산</strong>: final_settle_amt &lt; 0 이면 다음 달 adj_amt로 이월 처리.
              </div>
            </div>
            <!-- 주문 1건 추적표 -->
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fff;margin-bottom:12px;">
              <div style="font-weight:700;color:#333;margin-bottom:4px;font-size:13px;">📦 같은 주문 1건(ITEM-001)을 끝까지 따라가 보기</div>
              <div style="font-size:11px;color:#777;margin-bottom:10px;">"하나의 주문이 어느 시점에 어느 테이블·정산 월로 반영되는가"를 시간순으로 펼친 표입니다.</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#f3f4f6;">
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">시점</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:left;">실제 일어난 일</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:left;">데이터 변화</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">정산 귀속 월</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;white-space:nowrap;">1/15</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;">고객이 50,000원 상품 주문 → 결제 완료(PAID)</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">od_order_item.status = PAID</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;color:#9ca3af;">아직 없음</td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;white-space:nowrap;">1/18</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;">배송 완료 + 구매확정(자동/수동) → <strong>CONFIRMED</strong></td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">status = CONFIRMED</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;color:#9ca3af;">아직 없음</td>
                  </tr>
                  <tr style="background:#ecfdf5;">
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;text-align:center;white-space:nowrap;font-weight:700;">1/31</td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;">월말 정산 배치 → CONFIRMED 건 매출로 수집</td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;font-family:monospace;font-size:11px;">st_settle_raw(raw_type=ORDER, +50,000)</td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;text-align:center;font-weight:700;color:#059669;">1월</td>
                  </tr>
                  <tr style="background:#ecfdf5;">
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;text-align:center;white-space:nowrap;font-weight:700;">2/3</td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;">1월 정산 확정·지급 → <strong>PAID(봉인)</strong></td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;font-family:monospace;font-size:11px;">st_settle.status = PAID 🔒</td>
                    <td style="padding:6px 10px;border:1px solid #a7f3d0;text-align:center;font-weight:700;color:#059669;">1월</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;white-space:nowrap;">3/5</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;">고객이 <strong>뒤늦게 반품 신청</strong> (구매확정 후에도 반품 가능 기간 내)</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">od_claim 생성 (RETURN)</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;color:#9ca3af;">아직 미반영</td>
                  </tr>
                  <tr style="background:#f5f3ff;">
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;white-space:nowrap;font-weight:700;">3/12</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;">반품 상품 수거 입고 확인 → <strong>COMPLT(반품 완료)</strong></td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;font-family:monospace;font-size:11px;">od_claim_item.status = COMPLT</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;color:#9ca3af;">사건 발생 시점</td>
                  </tr>
                  <tr style="background:#f5f3ff;">
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;white-space:nowrap;font-weight:700;">3/31</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;">월말 정산 배치 → <strong>3월 원장에 반품 차감 수집</strong></td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;font-family:monospace;font-size:11px;">st_settle_raw(raw_type=RETURN, -50,000)</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;font-weight:700;color:#7c3aed;">3월 ⭐</td>
                  </tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#374151;margin-top:8px;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;line-height:1.7;">
                같은 주문 1건이지만 <strong>매출(+50,000)은 1월 정산</strong>에, <strong>반품(-50,000)은 3월 정산</strong>에 따로 기록됩니다.
                "반품이 일어난 사건의 날짜"가 기준이지, "원래 주문했던 날짜"가 기준이 아니기 때문입니다. 1월 정산은 이미 지급까지 끝났으므로(🔒) 건드릴 수 없고,
                건드릴 필요도 없습니다 — 손실은 "지금(3월)" 발생했으니 "지금(3월)" 정산에서 처리하는 것이 발생주의 회계의 핵심입니다.
              </div>
            </div>
            <!-- 같은 달에 여러 건이 겹치는 경우 -->
            <div style="border:1px solid #fbcfe8;border-radius:8px;padding:14px;background:#fdf2f8;margin-bottom:12px;">
              <div style="font-weight:700;color:#be185d;margin-bottom:8px;font-size:13px;">💡 한 달 안에 매출·반품이 동시에 섞이면?</div>
              <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:10px;">
                실제로는 한 업체가 한 달에 수십~수백 건을 동시에 처리합니다. 3월 한 달 동안 다음과 같이 섞여 있다고 가정하면:
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#fce7f3;">
                  <th style="padding:7px 10px;border:1px solid #fbcfe8;text-align:left;">3월에 일어난 일</th>
                  <th style="padding:7px 10px;border:1px solid #fbcfe8;text-align:center;">건수</th>
                  <th style="padding:7px 10px;border:1px solid #fbcfe8;text-align:right;">금액 합계</th>
                  <th style="padding:7px 10px;border:1px solid #fbcfe8;text-align:left;">3월 원장 반영</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #f3d4e4;">3월에 새로 주문·구매확정된 건</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:center;">12건</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:right;color:#10b981;">+30,000</td><td style="padding:6px 10px;border:1px solid #f3d4e4;font-family:monospace;font-size:11px;">ORDER +30,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #f3d4e4;"><strong>1월에 팔았지만 3월에 반품 완료된 건</strong> (ITEM-001 포함)</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:center;">3건</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:right;color:#ef4444;">-50,000</td><td style="padding:6px 10px;border:1px solid #f3d4e4;font-family:monospace;font-size:11px;">RETURN -50,000</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #f3d4e4;">2월에 팔았지만 3월에 취소 완료된 건</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:center;">1건</td><td style="padding:6px 10px;border:1px solid #f3d4e4;text-align:right;color:#ef4444;">-15,000</td><td style="padding:6px 10px;border:1px solid #f3d4e4;font-family:monospace;font-size:11px;">CANCEL -15,000</td></tr>
                  <tr style="background:#fce7f3;"><td style="padding:6px 10px;border:1px solid #f3d4e4;font-weight:700;" colspan="3">→ 3월 정산 final_settle_amt (수수료 별도)</td><td style="padding:6px 10px;border:1px solid #f3d4e4;font-weight:700;color:#dc2626;">30,000 - 50,000 - 15,000 = -35,000</td></tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#9d174d;margin-top:8px;line-height:1.7;">
                핵심은 <strong>"3월에 일어난 사건"만 모아서 3월 원장 1개에 합산</strong>한다는 점입니다. 그 사건이 원래 언제 팔린 상품인지(1월/2월/3월)는
                3월 정산 계산에 전혀 영향을 주지 않습니다 — 오직 <code style="background:#fce7f3;padding:1px 4px;border-radius:3px;">CONFIRMED</code>(매출 확정)·
                <code style="background:#fce7f3;padding:1px 4px;border-radius:3px;">COMPLT</code>(클레임 완료)가 <strong>3월에 찍혔는지</strong>만 봅니다.
              </div>
            </div>
            <!-- 두 가지 방법 비교 -->
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;margin-bottom:12px;">
              <div style="font-weight:700;color:#333;margin-bottom:10px;font-size:13px;">왜 1월 정산을 건드리지 않는가?</div>
              <div style="display:flex;gap:10px;margin-bottom:0;">
                <div style="flex:1;padding:10px 12px;background:#fff0f0;border:1px solid #fecaca;border-radius:6px;font-size:12px;">
                  <div style="font-weight:700;color:#dc2626;margin-bottom:6px;">❌ 소급 수정 방식 (안 하는 방식)</div>
                  <div style="color:#555;line-height:1.7;">
                    3월에 반품 완료 → <strong>1월 정산으로 돌아가서</strong> -50,000 수정<br>
                    • 이미 PAID(지급완료)된 정산 재오픈 필요<br>
                    • ERP 전표 이미 발행됨 → 회계 역분개 필요<br>
                    • 업체가 이미 받은 돈 환수 → 분쟁 위험
                  </div>
                </div>
                <div style="flex:1;padding:10px 12px;background:#f0fdf4;border:1px solid #a7f3d0;border-radius:6px;font-size:12px;">
                  <div style="font-weight:700;color:#059669;margin-bottom:6px;">✅ 발생주의 방식 (우리 방식)</div>
                  <div style="color:#555;line-height:1.7;">
                    3월에 반품 완료 → <strong>3월 정산에 -50,000 차감</strong><br>
                    • 1월 정산은 그대로 유지 (PAID 봉인)<br>
                    • 회계 수정 없음, ERP 전표 신규 발행만<br>
                    • 업체와의 정산은 3월분에서 자동 상계
                  </div>
                </div>
              </div>
            </div>
            <!-- 숫자 예시 테이블 -->
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-weight:700;color:#333;font-size:13px;">숫자로 보는 정산 흐름 (수수료 10% 가정)</div>
                <span style="font-size:10px;font-family:monospace;color:#555;background:#fff;border:1px solid #ddd;border-radius:4px;padding:2px 7px;">테이블: st_settle_raw → st_settle</span>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#f3f4f6;">
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">월</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;">매출수집<br><span style="font-weight:400;font-size:9px;color:#9ca3af;">raw.ORDER</span></th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;">반품차감<br><span style="font-weight:400;font-size:9px;color:#9ca3af;">raw.RETURN</span></th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;">수수료<br><span style="font-weight:400;font-size:9px;color:#9ca3af;">commission_amt</span></th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;">adj_amt</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:right;">final_settle_amt</th>
                  <th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;">상태<br><span style="font-weight:400;font-size:9px;color:#9ca3af;">settle_status_cd</span></th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;font-weight:700;">1월</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#10b981;">+50,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#ef4444;">-5,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;font-weight:700;color:#1d4ed8;">+45,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">PAID</span> 🔒</td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;font-weight:700;">2월</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#10b981;">+80,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#ef4444;">-8,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;font-weight:700;color:#1d4ed8;">+72,000</td>
                    <td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:center;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">PAID</span></td>
                  </tr>
                  <tr style="background:#f5f3ff;">
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;font-weight:700;">3월</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:right;color:#10b981;">+30,000</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:right;color:#ef4444;font-weight:700;">-50,000</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:right;color:#ef4444;">-3,000</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:right;font-weight:700;color:#dc2626;">-23,000 ⚠️</td>
                    <td style="padding:6px 10px;border:1px solid #c4b5fd;text-align:center;"><span style="background:#8b5cf6;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">CLOSED</span><br><span style="font-size:10px;color:#7c3aed;">지급 없음 → 이월</span></td>
                  </tr>
                  <tr style="background:#fef3c7;">
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center;font-weight:700;">4월</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;color:#10b981;">+60,000</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;color:#9ca3af;">0</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;color:#ef4444;">-6,000</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;color:#ef4444;font-weight:700;">-23,000</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:right;font-weight:700;color:#059669;">+31,000</td>
                    <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">PAID</span><br><span style="font-size:10px;color:#92400e;">3월 적자 상계</span></td>
                  </tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#374151;margin-top:8px;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;line-height:1.8;">
                🔒 <strong>1월 PAID 봉인</strong>: 3월에 반품이 발생해도 1월 정산(+45,000)은 절대 수정하지 않음.<br>
                ⚠️ <strong>3월 마이너스(-23,000)</strong>: 3월 매출(30,000)보다 반품(50,000)이 많아 적자. 3월은 업체에 지급 없음.<br>
                🔄 <strong>4월 adj_amt 이월</strong>: 3월 적자 -23,000을 4월 adj_amt에 자동 반영 → 4월 실지급 = 60,000 - 6,000 - 23,000 = <strong>+31,000</strong>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 정산조정예 ===================================== -->
          <template v-else-if="settleSubTab==='adjust'">
            <div style="border:1px solid #fef3c7;border-radius:8px;padding:14px;background:#fffbeb;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="font-weight:700;color:#d97706;font-size:13px;">정산 조정 항목 (adj_amt / etc_adj_amt)</div>
                <span style="font-size:10px;font-family:monospace;color:#92400e;background:#fff;border:1px solid #fde68a;border-radius:4px;padding:2px 7px;">테이블: st_settle</span>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#fef3c7;">
                  <th style="padding:7px 10px;border:1px solid #fde68a;text-align:left;">조정 컬럼</th>
                  <th style="padding:7px 10px;border:1px solid #fde68a;text-align:left;">발생 원인</th>
                  <th style="padding:7px 10px;border:1px solid #fde68a;text-align:right;">금액 예시</th>
                  <th style="padding:7px 10px;border:1px solid #fde68a;text-align:left;">처리 방식</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">adj_amt</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">배송료 조정 (착불→선불 전환)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">+3,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">배송 담당자 승인 후 자동 반영</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">adj_amt</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">이의신청 인정 (과다 수수료 보정)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">+5,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">정산팀 인정 처리 후 adj_amt 추가</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">adj_amt</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">마이너스 정산 이월 (전월 적자 회수)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">-12,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">전월 final_settle_amt &lt; 0 이월</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">etc_adj_amt</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">분쟁 보정 (배상 합의)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">+8,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">법무팀 확인 후 수동 입력</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;font-family:monospace;font-size:11px;">etc_adj_amt</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">환수 (페널티 부과)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">-20,000</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">운영팀 승인 후 수동 차감</td></tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#92400e;margin-top:10px;padding:8px 10px;background:#fef3c7;border-radius:5px;line-height:1.7;">
                • <strong>adj_amt</strong>: 시스템 연동 조정 (배송료·이월·이의신청). 정산 집계 배치가 자동 계산.<br>
                • <strong>etc_adj_amt</strong>: 수동 조정 (분쟁·환수·기타). 담당자가 직접 st_settle에 입력. 이력 필수.
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 마감기준설명 ==================================== -->
          <template v-else-if="settleSubTab==='close'">
            <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-weight:700;color:#1677ff;font-size:13px;">정산 마감 기준 및 절차</div>
                <span style="font-size:10px;font-family:monospace;color:#0958d9;background:#fff;border:1px solid #91caff;border-radius:4px;padding:2px 7px;">테이블: st_settle_raw / st_settle</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="padding:10px 12px;background:#fff;border:1px solid #91caff;border-radius:6px;font-size:12px;">
                  <div style="font-weight:700;color:#0958d9;margin-bottom:4px;">📅 마감 일정</div>
                  <div style="color:#555;line-height:1.7;">
                    매월 <strong>마지막 영업일</strong> 자정(00:00) 기준으로 해당 월 귀속 원장(st_settle_raw) 집계 배치 실행.<br>
                    집계 완료 후 상태: <code style="background:#e6f4ff;padding:1px 4px;border-radius:3px;">DRAFT</code> 자동 생성 → 정산팀 검토 후 <code style="background:#e6f4ff;padding:1px 4px;border-radius:3px;">CONFIRMED</code> 전환.
                  </div>
                </div>
                <div style="padding:10px 12px;background:#fff;border:1px solid #91caff;border-radius:6px;font-size:12px;">
                  <div style="font-weight:700;color:#0958d9;margin-bottom:4px;">📋 귀속 월 결정 기준</div>
                  <table style="width:100%;border-collapse:collapse;margin-top:4px;">
                    <thead><tr style="background:#e6f4ff;"><th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">원장 유형</th><th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">귀속 기준 컬럼</th><th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">설명</th></tr></thead>
                    <tbody>
                      <tr><td style="padding:5px 8px;border:1px solid #e8e8e8;">ORDER</td><td style="padding:5px 8px;border:1px solid #e8e8e8;font-family:monospace;font-size:10px;">od_order_item.confirmed_date</td><td style="padding:5px 8px;border:1px solid #e8e8e8;">구매확정 완료 시각</td></tr>
                      <tr><td style="padding:5px 8px;border:1px solid #e8e8e8;">CANCEL / RETURN</td><td style="padding:5px 8px;border:1px solid #e8e8e8;font-family:monospace;font-size:10px;">od_claim_item.complt_date</td><td style="padding:5px 8px;border:1px solid #e8e8e8;">클레임 처리 완료 시각</td></tr>
                      <tr><td style="padding:5px 8px;border:1px solid #e8e8e8;">EXCHANGE</td><td style="padding:5px 8px;border:1px solid #e8e8e8;font-family:monospace;font-size:10px;">od_dliv.delivered_date (교환배송)</td><td style="padding:5px 8px;border:1px solid #e8e8e8;">교환 배송 완료 시각</td></tr>
                      <tr><td style="padding:5px 8px;border:1px solid #e8e8e8;">SHIP</td><td style="padding:5px 8px;border:1px solid #e8e8e8;font-family:monospace;font-size:10px;">od_dliv.delivered_date</td><td style="padding:5px 8px;border:1px solid #e8e8e8;">배송 완료 시각</td></tr>
                    </tbody>
                  </table>
                </div>
                <div style="padding:10px 12px;background:#fff;border:1px solid #91caff;border-radius:6px;font-size:12px;">
                  <div style="font-weight:700;color:#0958d9;margin-bottom:4px;">⚠️ 마감 후 조정 규칙</div>
                  <div style="color:#555;line-height:1.7;">
                    • CONFIRMED 이후: 원장 추가·삭제 불가. adj_amt / etc_adj_amt 로만 보정.<br>
                    • CLOSED 이후: 정산 레코드 전체 잠금. 보정 필요 시 다음 달 정산에 이월 처리.<br>
                    • PAID 이후: 지급 취소 불가. ERP 전표 생성 완료. 환수는 etc_adj_amt 별도 등록.
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 전표처리예 ===================================== -->
          <template v-else-if="settleSubTab==='erp'">
            <div style="border:1px solid #e0e7ff;border-radius:8px;padding:14px;background:#eef2ff;margin-bottom:12px;">
              <div style="font-weight:700;color:#4338ca;margin-bottom:10px;font-size:13px;">ERP 전표 처리 예시 (st_erp_voucher)</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#e0e7ff;">
                  <th style="padding:7px 10px;border:1px solid #c7d2fe;text-align:left;">voucher_type_cd</th>
                  <th style="padding:7px 10px;border:1px solid #c7d2fe;text-align:left;">발생 시점</th>
                  <th style="padding:7px 10px;border:1px solid #c7d2fe;text-align:left;">차변(DR)</th>
                  <th style="padding:7px 10px;border:1px solid #c7d2fe;text-align:left;">대변(CR)</th>
                  <th style="padding:7px 10px;border:1px solid #c7d2fe;text-align:right;">금액</th>
                </tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#10b981;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">SETTLE_CLOSE</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;">정산 CLOSED 시</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">미지급금(부채)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">매입채무 정산</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">final_settle_amt</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#3b82f6;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">SETTLE_PAY</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;">지급 PAID 시</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">미지급금 감소</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">보통예금(자산)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">pay_amt</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#f59e0b;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">COMMISSION</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;">정산 CONFIRMED 시</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">수수료수익(수익)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">미지급금 감소</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">commission_amt</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;"><span style="background:#ef4444;color:#fff;border-radius:3px;padding:1px 5px;font-size:10px;">REFUND_ADJ</span></td><td style="padding:6px 10px;border:1px solid #e8e8e8;">환불 반영 시</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">반품손실(비용)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">미지급금 증가</td><td style="padding:6px 10px;border:1px solid #e8e8e8;text-align:right;">total_return_amt</td></tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:#3730a3;margin-top:10px;padding:8px 10px;background:#e0e7ff;border-radius:5px;line-height:1.7;">
                • ERP 전송 상태: <code style="background:#c7d2fe;padding:1px 4px;border-radius:3px;">erp_status_cd</code> — PENDING → SENT → CONFIRMED → ERROR<br>
                • 전송 실패 시 3회 재시도 후 ERROR 상태 전환. 담당자 수동 확인 필요.<br>
                • ERP 시스템: SAP / 더존 / 세금계산서 자동 발행 연동
              </div>
            </div>
          </template>
          <!-- ===== ■.■.■.■.■. 서브: 지급 ========================================= -->
          <template v-else-if="settleSubTab==='pay'">
            <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;background:#f0fdf4;margin-bottom:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-weight:700;color:#059669;font-size:13px;">지급 절차 및 상태 흐름</div>
                <span style="font-size:10px;font-family:monospace;color:#059669;background:#fff;border:1px solid #a7f3d0;border-radius:4px;padding:2px 7px;">테이블: st_settle_pay</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#6b7280;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">1</span>
                  <div><strong>CLOSED</strong> → st_settle_pay 레코드 <code style="background:#f0fdf4;padding:1px 4px;border-radius:3px;">pay_status_cd=PENDING</code> 자동 생성</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#3b82f6;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">2</span>
                  <div><strong>계좌 검증</strong> → 업체 정산계좌(sy_vendor.bank_acct_no) 확인. 오류 시 HOLD 처리</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#f59e0b;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">3</span>
                  <div><strong>자동 송금</strong> → CLOSED 후 5 영업일 이내 펌뱅킹 API 호출. 성공 시 PAID 전환</div>
                </div>
                <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:#fff;border:1px solid #a7f3d0;border-radius:6px;font-size:12px;">
                  <span style="flex-shrink:0;background:#10b981;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">4</span>
                  <div><strong>PAID</strong> → ERP SETTLE_PAY 전표 자동 생성. 업체에 지급 완료 알림 발송</div>
                </div>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="font-weight:700;color:#333;font-size:13px;">지급 보류(HOLD) 사유 및 처리</div>
                <span style="font-size:10px;font-family:monospace;color:#555;background:#fff;border:1px solid #ddd;border-radius:4px;padding:2px 7px;">st_settle_pay.pay_status_cd</span>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead><tr style="background:#f3f4f6;"><th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:left;">보류 사유</th><th style="padding:7px 10px;border:1px solid #e5e7eb;text-align:left;">해제 조건</th></tr></thead>
                <tbody>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">정산계좌 미확인 / 오류</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">업체가 계좌 재등록 → 다음 정산 지급</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">거래 분쟁 진행 중</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">분쟁 종결 후 법무팀 해제 승인</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">서류 미제출 (사업자등록증 등)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">서류 제출 확인 후 즉시 해제 가능</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">펌뱅킹 오류 (3회 재시도 실패)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">담당자 수동 송금 처리 후 PAID 전환</td></tr>
                  <tr><td style="padding:6px 10px;border:1px solid #e8e8e8;">마이너스 정산 (환수 대기)</td><td style="padding:6px 10px;border:1px solid #e8e8e8;">다음 달 adj_amt 이월로 자동 상계</td></tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>
        <!-- ===== ■.■.■.■. 시스템 =============================================== -->
        <template v-else-if="activeTab==='system'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">
            🔧 시스템 관리
          </h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div v-for="item in SYS_ITEMS" :key="item.title"
              style="border:1px solid #e0e0e0;border-radius:8px;padding:12px 14px;background:#fafafa;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:12px;font-weight:700;color:#1677ff;white-space:nowrap;min-width:100px;">
                {{ item.title }}
              </span>
              <span style="font-size:12px;color:#555;line-height:1.6;">
                {{ item.desc }}
              </span>
            </div>
          </div>
        </template>
      </div>
      <!-- ===== ■.■.■. /우측 콘텐츠 ============================================= -->
    </div>
    <!-- ===== □.□. 바디 ==================================================== -->
    <!-- ===== ■.■. /바디 =================================================== -->
  </div>
</bo-modal>
<!-- ===== □.□. /바디 =================================================== -->
<!-- ===== □. 본문 영역 =================================================== -->
`,
};

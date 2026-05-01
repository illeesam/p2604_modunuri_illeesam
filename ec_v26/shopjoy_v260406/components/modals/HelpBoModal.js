/* ShopJoy BO - 통합 도움말 모달
   Props: show (Boolean), topic (String)
   Emits: close
*/
window.HelpBoModal = {
  name: 'HelpBoModal',
  props: ['show', 'topic'],
  emits: ['close'],
  setup(props, { emit }) {
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
      { tab: '상품설명',       desc: 'Quill 에디터 블록 + 미리보기 분할' },
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

    const CLAIM_TYPES = [
      { title: '취소', color: '#ef4444', steps: ['취소요청', '취소처리중', '취소완료'],        doubleArrowAfter: [] },
      { title: '반품', color: '#f97316', steps: ['반품요청', '수거예정', '수거중', '수거완료', '환불처리중', '환불완료'], doubleArrowAfter: [3] },
      { title: '교환', color: '#3b82f6', steps: ['교환요청', '수거예정', '수거중', '수거완료', '상품준비중', '발송중', '발송완료', '교환완료'], doubleArrowAfter: [3] },
    ];

    const CLAIM_DETAILS = [
      {
        title: '취소', color: '#ef4444', bg: '#fff5f5',
        period: '결제완료 후 7일 이내, 배송준비 착수 전',
        refund: '원 결제수단으로 3~5 영업일 내 환불',
        notes: ['배송 후 취소 시 왕복 배송료 공제', '배송준비 이후 상태에서는 취소 불가'],
        stepDetails: [
          { step: '취소요청',  desc: '고객이 취소 신청. 사유 입력 필수. 신청 후 관리자 승인 전까지 취소 철회 가능.' },
          { step: '취소처리중', desc: '관리자 승인 완료. 결제사에 환불 요청 진행 중.' },
          { step: '취소완료',  desc: '환불 처리 완료. 원 결제수단으로 3~5 영업일 내 입금.' },
        ],
      },
      {
        title: '반품', color: '#f97316', bg: '#fff8f0',
        period: '배송완료 후 30일 이내 (상품하자: 180일, 배송손상: 7일)',
        refund: '수거 확인 후 5~7 영업일 내 환불',
        notes: ['단순변심: 배송료 고객/판매자 50% 부담', '상품하자/오배송: 판매자 100% 부담'],
        stepDetails: [
          { step: '반품요청',   desc: '고객이 반품 신청. 사유 및 사진 첨부. 신청 후 취소 가능.' },
          { step: '수거예정',   desc: '관리자 승인 완료. 택배사 지정 및 수거 일정 협의 중.' },
          { step: '수거중',     desc: '택배사가 상품 픽업 완료. 창고로 이동 중.' },
          { step: '수거완료',   desc: '상품 창고 입고 완료. 검수 진행 (정상/손상/불량 판정).' },
          { step: '환불처리중', desc: '검수 완료 후 환불 금액 확정. 결제사에 환불 요청 중.' },
          { step: '환불완료',   desc: '환불 처리 완료. 배송료/손상 비용 공제 후 입금.' },
        ],
      },
      {
        title: '교환', color: '#3b82f6', bg: '#f0f7ff',
        period: '배송완료 후 30일 이내 (상품하자: 180일, 배송손상: 7일)',
        refund: '총 7~10일 소요 (수거 3~5일 + 발송 3~5일)',
        notes: ['단순변심: 수거료 50%/50%, 발송비 고객 100%', '상품하자/사이즈오류: 왕복 배송료 판매자 100%'],
        stepDetails: [
          { step: '교환요청',   desc: '고객이 교환 신청. 교환 상품(사이즈/색상) 선택. 차액 발생 시 추가 결제.' },
          { step: '수거예정',   desc: '관리자 승인 완료. 기존 상품 수거 택배사 지정 및 일정 협의.' },
          { step: '수거중',     desc: '기존 상품 픽업 완료. 창고로 이동 중.' },
          { step: '수거완료',   desc: '기존 상품 입고 및 검수 완료. 교환 상품 준비 시작.' },
          { step: '상품준비중', desc: '교환 상품 피킹/패킹 중. 발송 준비 완료 대기.' },
          { step: '발송중',     desc: '교환 상품 출고 완료. 송장번호 등록. 고객에게 발송 알림.' },
          { step: '발송완료',   desc: '교환 상품 고객 수령 완료.' },
          { step: '교환완료',   desc: '교환 처리 최종 완료. 추가 반품/취소는 새 클레임으로 신청.' },
        ],
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

    const activeTab   = ref(props.topic || 'overview');
    const optSubTab   = ref('basic');
    const orderSubTab = ref('flow');

    watch(() => props.topic, (v) => { if (v) activeTab.value = v; });
    watch(() => props.show,  (v) => { if (v && props.topic) activeTab.value = props.topic; });

    const close = () => emit('close');

    return {
      TABS, OPT_SUB_TABS,
      OPT_OVERVIEW_ROWS, OPT_CLOTHING_ROWS, OPT_SHOES_ROWS, OPT_ELEC_ROWS, OPT_SINGLE_ROWS, INPUT_TYPES,
      OVERVIEW_CARDS, PRODUCT_STEPS, PRODUCT_TABS, MEMBER_TABS_LIST,
      ORDER_STEPS, ORDER_STEP_DETAILS, ORDER_PARTIAL_SCENARIO,
      REFUND_ORDER_ROWS, RETURN_FEE_ROWS, COUPON_REFUND_ROWS,
      CLAIM_TYPES, CLAIM_DETAILS, PROMO_ITEMS, DISP_LEVELS, DISP_WIDGETS, SYS_ITEMS,
      activeTab, optSubTab, orderSubTab, close,
    };
  },
  template: `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(18,24,40,0.6);z-index:3000;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="close">
  <div style="background:#fff;border-radius:14px;width:100%;max-width:860px;height:92vh;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);overflow:hidden;"
    @click.stop>

    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid #ffc9d6;">
      <div style="font-size:15px;font-weight:800;color:#9f2946;">
        <span style="color:#e8587a;font-size:9px;margin-right:6px;">●</span>도움말 가이드
      </div>
      <button @click="close" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,0.6);color:#9f2946;font-size:14px;cursor:pointer;">✕</button>
    </div>

    <!-- 바디 -->
    <div style="flex:1;display:flex;overflow:hidden;">

      <!-- 좌측 탭 -->
      <div style="width:148px;flex-shrink:0;background:#f7f8fa;border-right:1px solid #efe0e5;display:flex;flex-direction:column;padding:12px 0;overflow-y:auto;">
        <button v-for="t in TABS" :key="t.id" @click="activeTab=t.id"
          :style="activeTab===t.id
            ? 'display:block;width:100%;text-align:left;padding:9px 16px;font-size:12px;font-weight:700;color:#e8587a;background:#fff;border:none;border-right:3px solid #e8587a;cursor:pointer;line-height:1.4;'
            : 'display:block;width:100%;text-align:left;padding:9px 16px;font-size:12px;font-weight:400;color:#666;background:transparent;border:none;border-right:3px solid transparent;cursor:pointer;line-height:1.4;'">
          {{ t.label }}
        </button>
      </div>

      <!-- 우측 콘텐츠 -->
      <div style="flex:1;overflow-y:auto;padding:24px;">

        <!-- 개요 -->
        <template v-if="activeTab==='overview'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 12px;">ShopJoy 관리자 시스템 개요</h3>
          <p style="color:#555;font-size:13px;line-height:1.8;margin-bottom:16px;">ShopJoy BO는 전자상거래 통합 관리 시스템입니다. 좌측 메뉴에서 도메인을 선택하고, 상단 탭에서 열린 화면들을 전환합니다.</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
            <div v-for="item in OVERVIEW_CARDS" :key="item.tab"
              @click="activeTab=item.tab"
              style="border:1px solid #e8f0ff;border-radius:10px;padding:14px;background:#f8fbff;cursor:pointer;">
              <div style="font-size:22px;margin-bottom:6px;">{{ item.icon }}</div>
              <div style="font-weight:700;color:#1677ff;font-size:13px;margin-bottom:4px;">{{ item.title }}</div>
              <div style="font-size:11px;color:#666;line-height:1.5;">{{ item.desc }}</div>
            </div>
          </div>
          <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:12px 16px;font-size:12px;color:#7c5500;">
            각 탭을 클릭하면 해당 도메인의 상세 도움말을 확인할 수 있습니다.
          </div>
        </template>

        <!-- 회원관리 -->
        <template v-else-if="activeTab==='member'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">👤 회원관리</h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">회원관리 기능</div>
              <div style="font-size:12px;color:#555;line-height:1.8;">
                <div>• 전체 회원 목록 조회 (이름, 이메일, 전화번호, 상태 검색)</div>
                <div>• 회원 상태:
                  <span style="background:#d1fae5;color:#065f46;border-radius:3px;padding:1px 6px;">활성</span>
                  <span style="background:#fee2e2;color:#991b1b;border-radius:3px;padding:1px 6px;margin-left:4px;">정지</span>
                  <span style="background:#f3f4f6;color:#374151;border-radius:3px;padding:1px 6px;margin-left:4px;">탈퇴</span>
                </div>
                <div>• 행 클릭 - 상세(Dtl) 인라인 임베드</div>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">회원 상세 탭 구성</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">
                <span v-for="t in MEMBER_TABS_LIST" :key="t"
                  style="background:#e6f4ff;border:1px solid #bae0ff;border-radius:4px;padding:3px 8px;color:#0958d9;">{{ t }}</span>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">등급/그룹</div>
              <div style="font-size:12px;color:#555;line-height:1.8;">
                <div>• <b>회원등급</b>: 구매금액, 횟수 기준 자동 승급 조건 설정</div>
                <div>• <b>회원그룹</b>: 수동 분류 (예: VIP고객, 임직원, 블랙리스트)</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 상품관리 -->
        <template v-else-if="activeTab==='product'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">📦 상품관리</h3>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">상품 등록 흐름</div>
              <div style="display:flex;align-items:center;gap:6px;font-size:12px;flex-wrap:wrap;">
                <template v-for="(step,i) in PRODUCT_STEPS" :key="step">
                  <span style="background:#1677ff;color:#fff;border-radius:4px;padding:3px 8px;">{{ step }}</span>
                  <span v-if="i < PRODUCT_STEPS.length-1" style="color:#ccc;font-size:11px;">-&gt;</span>
                </template>
              </div>
            </div>
            <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">상품 상세 탭</div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <tr v-for="row in PRODUCT_TABS" :key="row.tab" style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:5px 8px;font-weight:600;color:#333;white-space:nowrap;width:110px;">{{ row.tab }}</td>
                  <td style="padding:5px 8px;color:#555;">{{ row.desc }}</td>
                </tr>
              </table>
            </div>
          </div>
        </template>

        <!-- 옵션설정 -->
        <template v-else-if="activeTab==='prodOpt'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">⚙ 옵션설정 상세 가이드</h3>
          <p style="font-size:12px;color:#888;margin:0 0 16px;">상품 상세 &gt; 옵션설정 탭</p>

          <!-- 서브탭 버튼 -->
          <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="st in OPT_SUB_TABS" :key="st.id" @click="optSubTab=st.id"
              :style="optSubTab===st.id
                ? 'padding:5px 12px;font-size:11px;border:1px solid #1677ff;border-radius:6px;cursor:pointer;background:#e6f4ff;color:#1677ff;font-weight:700;'
                : 'padding:5px 12px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;background:#f5f5f5;color:#555;'">{{ st.label }}</button>
          </div>

          <!-- 서브탭: 개요 -->
          <template v-if="optSubTab==='basic'">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">카테고리별 옵션 차원 구성</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">카테고리</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">1단</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">2단</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">SKU 예시</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_OVERVIEW_ROWS" :key="r.cat" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;">{{ r.cat }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d1 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d2 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;color:#888;font-size:11px;">{{ r.ex }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #b7eb8f;border-radius:8px;padding:14px;background:#f6ffed;">
                <div style="font-weight:700;color:#389e0d;margin-bottom:8px;font-size:13px;">입력 방식 요약</div>
                <div style="font-size:12px;line-height:2;"><b style="color:#1677ff;">SELECT</b> — 드롭다운 1개 선택 (가장 일반적)</div>
                <div style="font-size:12px;line-height:2;"><b style="color:#fa8c16;">SELECT_INPUT</b> — 드롭다운 또는 직접 타이핑</div>
                <div style="font-size:12px;line-height:2;"><b style="color:#52c41a;">MULTI_SELECT</b> — 여러 항목 동시 선택</div>
              </div>
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;">
                상세 예시는 위 탭(의류, 신발, 전자기기 등)을 클릭하세요.
              </div>
            </div>
          </template>

          <!-- 서브탭: 의류 -->
          <template v-else-if="optSubTab==='clothing'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">👗 의류 — 색상(1단) x 사이즈(2단)</div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">카테고리: CLOTHING</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">색상 (1단)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">사이즈 (2단)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">생성되는 SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_CLOTHING_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d1 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d2 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">{{ r.sku }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">설정 방법</div>
                <div>1. 카테고리: 의류 (색상+사이즈) 선택</div>
                <div>2. 1단 값 추가: 블랙, 화이트, 레드 등 색상 입력</div>
                <div>3. 2단 값 추가: S, M, L, XL 등 사이즈 입력</div>
                <div>4. 저장 시 색상x사이즈 조합으로 SKU 자동 생성</div>
                <div>5. 각 SKU별 추가금액, 재고 설정 가능</div>
              </div>
            </div>
          </template>

          <!-- 서브탭: 신발 -->
          <template v-else-if="optSubTab==='shoes'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">👟 신발 — 사이즈(1단) x 색상(2단)</div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">카테고리: SHOES</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">사이즈 (1단)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">색상 (2단)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">생성되는 SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_SHOES_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d1 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d2 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">{{ r.sku }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">설정 방법</div>
                <div>1. 카테고리: 신발 (사이즈+색상) 선택</div>
                <div>2. 1단 값 추가: 250, 255, 260, 265, 270 등 사이즈 입력</div>
                <div>3. 2단 값 추가: 블랙, 화이트, 네이비 등 색상 입력</div>
                <div>4. 의류와 달리 사이즈가 기준 차원(1단)이 됨</div>
              </div>
            </div>
          </template>

          <!-- 서브탭: 전자기기 -->
          <template v-else-if="optSubTab==='elec'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:4px;font-size:13px;">💻 전자기기 — 색상(1단) x 저장용량(2단)</div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">카테고리: 색상+커스텀 (CUSTOM_GRP)</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">색상 (1단)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">용량 (2단/커스텀)</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;">생성되는 SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_ELEC_ROWS" :key="r.sku" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d1 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;text-align:center;">{{ r.d2 }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-weight:600;">{{ r.sku }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;font-size:12px;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:6px;">설정 방법</div>
                <div>1. 카테고리: 색상+커스텀 선택</div>
                <div>2. 1단(색상) 값: 블랙, 실버, 골드 등 색상 입력</div>
                <div>3. 2단(커스텀) 값: 128GB, 256GB, 512GB 직접 입력</div>
                <div>4. 커스텀은 사전 정의 없이 자유 텍스트 입력 가능</div>
              </div>
            </div>
          </template>

          <!-- 서브탭: 단독 옵션 -->
          <template v-else-if="optSubTab==='single'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">단독 옵션 — 1차원만 사용</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#e6f4ff;">
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">카테고리</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">사용 유형</th>
                      <th style="padding:5px 8px;border:1px solid #bae0ff;text-align:left;">예시 값</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in OPT_SINGLE_ROWS" :key="r.cat" style="border-bottom:1px solid #e8f0ff;">
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;font-size:11px;">{{ r.cat }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;">{{ r.type }}</td>
                      <td style="padding:4px 8px;border:1px solid #e8f0ff;color:#888;">{{ r.ex }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;line-height:1.8;">
                단독 옵션은 2단 차원 없이 1차원 SKU만 생성됩니다.<br>
                예) 색상 단독에서 블랙, 화이트, 레드 입력 시 SKU 3개 생성
              </div>
            </div>
          </template>

          <!-- 서브탭: 입력 방식 -->
          <template v-else-if="optSubTab==='inputtype'">
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div v-for="item in INPUT_TYPES" :key="item.type"
                :style="'border:1px solid '+item.border+';border-radius:8px;padding:14px;background:'+item.bg+';'">
                <div :style="'font-weight:700;color:'+item.color+';margin-bottom:6px;font-size:13px;'">{{ item.title }}</div>
                <div style="font-size:12px;line-height:1.8;">
                  <div style="margin-bottom:4px;">{{ item.desc }}</div>
                  <div><b>사용 시점:</b> {{ item.when }}</div>
                  <div><b>예시:</b> {{ item.ex }}</div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- 주문관리 -->
        <template v-else-if="activeTab==='order'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">🛒 주문관리</h3>
          <p style="font-size:12px;color:#888;margin:0 0 12px;">주문접수부터 구매확정까지. 상품(order_item) 단위 부분처리 지원.</p>

          <!-- 서브탭 -->
          <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="st in [{id:'flow',label:'상태 흐름'},{id:'partial',label:'부분처리/구매확정'},{id:'refund',label:'환불 순서'},{id:'bulk',label:'일괄 작업'}]"
              :key="st.id" @click="orderSubTab=st.id"
              :style="orderSubTab===st.id
                ? 'padding:5px 12px;font-size:11px;border:1px solid #1677ff;border-radius:6px;cursor:pointer;background:#e6f4ff;color:#1677ff;font-weight:700;'
                : 'padding:5px 12px;font-size:11px;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;background:#f5f5f5;color:#555;'">{{ st.label }}</button>
          </div>

          <!-- 서브: 상태 흐름 -->
          <template v-if="orderSubTab==='flow'">
            <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;margin-bottom:12px;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">주문 상태 흐름</div>
              <div style="display:flex;align-items:center;gap:4px;font-size:11px;flex-wrap:wrap;margin-bottom:6px;">
                <template v-for="(s,i) in ORDER_STEPS" :key="s">
                  <span style="background:#1677ff;color:#fff;border-radius:4px;padding:3px 8px;">{{ s }}</span>
                  <span v-if="i < ORDER_STEPS.length-1" style="color:#bbb;">-&gt;</span>
                </template>
              </div>
              <div style="font-size:11px;color:#888;">* 주문 전체 상태는 활성 상품(미취소) 중 가장 앞선 상태로 집계</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="sd in ORDER_STEP_DETAILS" :key="sd.step"
                style="border:1px solid #e8e8e8;border-radius:8px;padding:10px 14px;background:#fff;display:flex;gap:12px;align-items:flex-start;">
                <div style="flex-shrink:0;min-width:68px;">
                  <span :style="'display:inline-block;background:'+sd.color+';color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-align:center;width:100%;'">{{ sd.step }}</span>
                </div>
                <div style="flex:1;">
                  <div style="font-size:12px;color:#333;line-height:1.7;">{{ sd.desc }}</div>
                  <div style="font-size:11px;color:#1677ff;margin-top:2px;">▶ {{ sd.action }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- 서브: 부분처리/구매확정 -->
          <template v-else-if="orderSubTab==='partial'">
            <div style="display:flex;flex-direction:column;gap:12px;">

              <!-- 핵심 원칙 -->
              <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
                <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">핵심 원칙</div>
                <div style="font-size:12px;color:#333;line-height:2;">
                  <div>• 클레임은 <b>상품(order_item) 단위</b>로 독립 처리 — 같은 주문의 다른 상품은 영향 없음</div>
                  <div>• 취소/반품/교환은 <b>수량 단위</b>로도 부분 신청 가능 (예: 3개 중 1개만 반품)</div>
                  <div>• <b>구매확정</b>은 상품 단위로 개별 처리 (배송완료 후 7일 경과 시 자동 확정)</div>
                  <div>• 클레임 진행 중인 상품은 자동 확정 타이머 <b>보류</b> → 클레임 종결 후 재산정</div>
                  <div>• 주문 전체 상태는 <b>취소되지 않은 활성 상품</b>들의 상태 중 가장 앞선 값으로 집계</div>
                </div>
              </div>

              <!-- 시나리오 -->
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
                <div style="font-weight:700;color:#333;margin-bottom:4px;font-size:13px;">시나리오: 상품 3개 주문 — 1개 취소, 1개 반품진행중, 1개 정상완료</div>
                <div style="font-size:11px;color:#888;margin-bottom:10px;">주문 전체 상태 = 활성 상품(B,C) 중 가장 앞선 상태 = 배송완료</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div v-for="sc in ORDER_PARTIAL_SCENARIO" :key="sc.item"
                    style="border:1px solid #e8e8e8;border-radius:6px;padding:10px 12px;background:#fff;display:flex;gap:10px;align-items:flex-start;">
                    <div style="flex-shrink:0;width:60px;font-weight:700;font-size:12px;color:#333;">{{ sc.item }}</div>
                    <div style="flex:1;">
                      <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
                        <span :style="'background:'+sc.color+';color:#fff;border-radius:3px;padding:1px 7px;font-size:10px;font-weight:700;'">주문: {{ sc.status }}</span>
                        <span :style="'background:'+sc.claimColor+';color:#fff;border-radius:3px;padding:1px 7px;font-size:10px;font-weight:700;'">클레임: {{ sc.claimStatus }}</span>
                      </div>
                      <div style="font-size:11px;color:#555;line-height:1.6;">{{ sc.desc }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 구매확정 상세 -->
              <div style="border:1px solid #d9f0e7;border-radius:8px;padding:14px;background:#f0fdf4;">
                <div style="font-weight:700;color:#059669;margin-bottom:8px;font-size:13px;">구매확정 처리 방식</div>
                <div style="font-size:12px;color:#333;line-height:2;">
                  <div>• <b>수동 확정</b>: 고객이 마이페이지에서 상품별 "구매확정" 버튼 클릭</div>
                  <div>• <b>자동 확정</b>: 배송완료 후 <b>7일 경과</b> 시 시스템이 자동 CONFIRMED 전환</div>
                  <div>• 클레임(반품/교환) 진행 중 → 자동 확정 <b>타이머 정지</b></div>
                  <div>• 클레임 종결(완료/거부/철회) → 남은 기간부터 타이머 <b>재산정</b></div>
                  <div>• 구매확정 시: 적립금 지급, 리뷰 작성 가능, 추가 클레임 불가</div>
                </div>
              </div>

              <!-- 부분취소/반품/교환 제약 -->
              <div style="border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;line-height:1.9;">
                <div style="font-weight:700;margin-bottom:4px;">부분처리 제약사항</div>
                <div>• <b>취소</b>: 배송준비 착수 전(PREPARING 이전)만 가능. 이후는 반품으로 처리</div>
                <div>• <b>반품/교환</b>: 배송완료 후 30일 이내 (상품하자 180일, 배송손상 7일)</div>
                <div>• 동일 상품에 진행 중인 클레임 있으면 중복 신청 불가</div>
                <div>• 위생상품, 개봉식품, 디지털상품, 주문제작품 반품/교환 불가</div>
              </div>
            </div>
          </template>

          <!-- 서브: 환불 순서 -->
          <template v-else-if="orderSubTab==='refund'">
            <div style="display:flex;flex-direction:column;gap:12px;">

              <!-- 환불 우선순위 -->
              <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
                <div style="font-weight:700;color:#333;margin-bottom:10px;font-size:13px;">환불 처리 우선순위</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div v-for="row in REFUND_ORDER_ROWS" :key="row.rank"
                    :style="'border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;background:'+row.bg+';display:flex;gap:10px;align-items:flex-start;'">
                    <div :style="'flex-shrink:0;width:22px;height:22px;border-radius:50%;background:'+row.color+';color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;'">{{ row.rank }}</div>
                    <div style="flex:1;">
                      <div :style="'font-weight:700;font-size:12px;color:'+row.color+';margin-bottom:2px;'">{{ row.method }}</div>
                      <div style="font-size:11px;color:#555;line-height:1.6;">{{ row.desc }}</div>
                    </div>
                  </div>
                </div>
                <div style="margin-top:8px;font-size:11px;color:#888;line-height:1.7;">
                  * 복수 결제수단 혼용 시 적립금/캐쉬 먼저 복원 후 나머지를 결제수단 역순으로 환불
                </div>
              </div>

              <!-- 반품 배송비 -->
              <div style="border:1px solid #fee2e2;border-radius:8px;padding:14px;background:#fff5f5;">
                <div style="font-weight:700;color:#ef4444;margin-bottom:10px;font-size:13px;">반품 배송비 부담 기준</div>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                  <thead>
                    <tr style="background:#fee2e2;">
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:left;">반품 사유</th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:center;">고객</th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:center;">판매자</th>
                      <th style="padding:6px 8px;border:1px solid #fca5a5;text-align:left;">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in RETURN_FEE_ROWS" :key="row.reason" style="border-bottom:1px solid #fecaca;">
                      <td style="padding:5px 8px;border:1px solid #fecaca;font-weight:600;">{{ row.reason }}</td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;text-align:center;" :style="row.buyer!=='-'?'color:#ef4444;font-weight:700;':''">{{ row.buyer }}</td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;text-align:center;" :style="row.seller==='100%'?'color:#3b82f6;font-weight:700;':''">{{ row.seller }}</td>
                      <td style="padding:5px 8px;border:1px solid #fecaca;font-size:11px;color:#666;">{{ row.note }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 쿠폰/할인 환불 처리 -->
              <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;background:#f0fdf4;">
                <div style="font-weight:700;color:#059669;margin-bottom:10px;font-size:13px;">쿠폰/할인 환불 처리 방식</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div v-for="row in COUPON_REFUND_ROWS" :key="row.type"
                    style="border:1px solid #a7f3d0;border-radius:6px;padding:10px 12px;background:#fff;">
                    <div style="font-weight:700;font-size:12px;color:#065f46;margin-bottom:4px;">{{ row.type }}</div>
                    <div style="font-size:11px;color:#333;margin-bottom:2px;"><b>규칙:</b> {{ row.rule }}</div>
                    <div style="font-size:11px;color:#555;">{{ row.detail }}</div>
                  </div>
                </div>
                <div style="margin-top:10px;font-size:11px;color:#065f46;background:#d1fae5;border-radius:6px;padding:8px 10px;line-height:1.7;">
                  <b>환불액 계산 공식</b><br>
                  환불액 = 반품상품금액 - 쿠폰/할인 안분액 - 반품배송비(고객부담) - 상품손상 감액<br>
                  + 사용적립금 복원 (현금 아닌 적립금으로 복원)
                </div>
              </div>
            </div>
          </template>

          <!-- 서브: 일괄 작업 -->
          <template v-else-if="orderSubTab==='bulk'">
            <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;">
              <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">일괄 작업 방법</div>
              <div style="font-size:12px;color:#555;line-height:1.9;">
                <div>• 목록 좌측 체크박스로 복수 선택 후 <b>[변경작업 선택]</b> 버튼 클릭</div>
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
                <span :style="'flex-shrink:0;display:inline-block;background:'+item.color+';color:#fff;border-radius:4px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap;'">{{ item.title }}</span>
                <span style="font-size:12px;color:#444;line-height:1.7;">{{ item.desc }}</span>
              </div>
            </div>
          </template>
        </template>

        <!-- 클레임 -->
        <template v-else-if="activeTab==='claim'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 4px;">🔄 클레임 처리</h3>
          <p style="font-size:12px;color:#888;margin:0 0 14px;">취소 / 반품 / 교환 3가지 유형으로 구분</p>

          <!-- 상태 흐름 요약 -->
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
            <div v-for="ct in CLAIM_TYPES" :key="ct.title"
              style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;background:#fafafa;">
              <div :style="'font-weight:700;color:'+ct.color+';margin-bottom:8px;font-size:13px;'">{{ ct.title }} 상태 흐름</div>
              <div style="display:flex;align-items:center;gap:4px;font-size:11px;flex-wrap:wrap;">
                <template v-for="(s,i) in ct.steps" :key="s">
                  <span :style="'background:'+ct.color+';color:#fff;border-radius:4px;padding:3px 8px;white-space:nowrap;'">{{ s }}</span>
                  <template v-if="i < ct.steps.length-1">
                    <span v-if="ct.doubleArrowAfter.includes(i)" style="color:#bbb;display:inline-flex;gap:2px;">
                      <span>-&gt;</span><span>-&gt;</span>
                    </span>
                    <span v-else style="color:#bbb;">-&gt;</span>
                  </template>
                </template>
              </div>
            </div>
          </div>

          <!-- 상세 정책 -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div v-for="cd in CLAIM_DETAILS" :key="cd.title"
              :style="'border:1px solid #ddd;border-radius:8px;padding:14px;background:'+cd.bg+';'">
              <div :style="'font-weight:700;color:'+cd.color+';margin-bottom:10px;font-size:13px;'">{{ cd.title }} 상세</div>

              <!-- 단계별 설명 -->
              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">
                <div v-for="sd in cd.stepDetails" :key="sd.step"
                  style="display:flex;gap:10px;align-items:flex-start;font-size:12px;">
                  <span :style="'flex-shrink:0;min-width:68px;display:inline-block;border-radius:3px;padding:1px 7px;font-size:10px;font-weight:700;color:#fff;background:'+cd.color+';text-align:center;'">{{ sd.step }}</span>
                  <span style="color:#444;line-height:1.7;">{{ sd.desc }}</span>
                </div>
              </div>

              <!-- 정책 요약 -->
              <div style="border-top:1px dashed #ddd;padding-top:8px;font-size:11px;color:#666;line-height:1.9;">
                <div><b>신청기간:</b> {{ cd.period }}</div>
                <div><b>환불/완료:</b> {{ cd.refund }}</div>
                <div v-for="note in cd.notes" :key="note">• {{ note }}</div>
              </div>
            </div>
          </div>

          <!-- 공통 제약사항 -->
          <div style="margin-top:14px;border:1px solid #ffe58f;border-radius:8px;padding:12px;background:#fffbe6;font-size:12px;color:#7c5500;">
            <div style="font-weight:700;margin-bottom:6px;">공통 제약사항</div>
            <div style="line-height:1.9;">
              <div>• 동일 상품당 취소/반품/교환 중 1가지만 신청 가능</div>
              <div>• 진행 중인 클레임이 있으면 동일 상품 추가 신청 불가</div>
              <div>• 위생상품, 개봉식품, 디지털상품, 주문제작품은 반품/교환 불가</div>
              <div>• 첫 단계(요청) 상태에서만 신청 취소 가능</div>
            </div>
          </div>
        </template>

        <!-- 프로모션 -->
        <template v-else-if="activeTab==='promotion'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">🎫 프로모션</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div v-for="item in PROMO_ITEMS" :key="item.title"
              style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
              <div style="font-size:20px;margin-bottom:6px;">{{ item.icon }}</div>
              <div style="font-weight:700;color:#1677ff;font-size:13px;margin-bottom:4px;">{{ item.title }}</div>
              <div style="font-size:11px;color:#555;line-height:1.6;">{{ item.desc }}</div>
            </div>
          </div>
        </template>

        <!-- 전시관리 -->
        <template v-else-if="activeTab==='display'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">🖼 전시관리</h3>
          <div style="border:1px solid #bae0ff;border-radius:8px;padding:14px;background:#f0f7ff;margin-bottom:14px;">
            <div style="font-weight:700;color:#1677ff;margin-bottom:10px;font-size:13px;">계층 구조</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;flex-wrap:wrap;">
              <template v-for="(lv,i) in DISP_LEVELS" :key="lv.l">
                <div style="text-align:center;">
                  <div style="background:#1677ff;color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;">{{ lv.l }}</div>
                  <div style="font-size:10px;color:#666;margin-top:2px;white-space:nowrap;">{{ lv.d }}</div>
                </div>
                <span v-if="i < DISP_LEVELS.length-1" style="color:#bbb;font-size:16px;">&gt;</span>
              </template>
            </div>
          </div>
          <div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fafafa;">
            <div style="font-weight:700;color:#1677ff;margin-bottom:8px;font-size:13px;">위젯 타입</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;">
              <span v-for="w in DISP_WIDGETS" :key="w"
                style="background:#f0f7ff;border:1px solid #bae0ff;border-radius:4px;padding:3px 8px;color:#0958d9;">{{ w }}</span>
            </div>
          </div>
        </template>

        <!-- 시스템 -->
        <template v-else-if="activeTab==='system'">
          <h3 style="font-size:15px;font-weight:800;color:#333;margin:0 0 16px;">🔧 시스템 관리</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div v-for="item in SYS_ITEMS" :key="item.title"
              style="border:1px solid #e0e0e0;border-radius:8px;padding:12px 14px;background:#fafafa;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:12px;font-weight:700;color:#1677ff;white-space:nowrap;min-width:100px;">{{ item.title }}</span>
              <span style="font-size:12px;color:#555;line-height:1.6;">{{ item.desc }}</span>
            </div>
          </div>
        </template>

      </div><!-- /우측 콘텐츠 -->
    </div><!-- /바디 -->
  </div>
</div>
`,
};

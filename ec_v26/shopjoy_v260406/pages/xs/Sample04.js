/* ShopJoy - Sample04: 모달 / 팝업 전시관 */
window.XsSample04 = {
  name: 'XsSample04',
  setup() {
    const { ref, reactive, onMounted } = Vue;

    /* ── 회원 데이터 ── */
    const members = reactive([]);

    /* ── 메인 모달 상태 ── */
    const modal = reactive({ type: null, variant: 'info', data: null, nested2: false });

    /* ── Confirm 콜백 저장 ── */
    let _confirmCb = null;

    /* ── 폼 모달 ── */
    const form = reactive({ name: '', email: '', phone: '', grade: '일반' });
    const formErrors = reactive({});

    const openModal = (type, opts = {}) => {
      modal.type     = type;
      modal.variant  = opts.variant || 'info';
      modal.data     = opts.data    || null;
      modal.nested2  = false;
      _confirmCb     = opts.onConfirm || null;
    };
    const closeModal = () => { modal.type = null; modal.nested2 = false; _confirmCb = null; };

    const doConfirm = () => {
      const cb = _confirmCb;
      closeModal();
      if (cb) setTimeout(cb, 80);
    };

    const loadingDemo = async () => {
      openModal('loading');
      await new Promise(r => setTimeout(r, 2500));
      if (modal.type === 'loading') closeModal();
    };

    const submitForm = () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      if (!form.name.trim()) formErrors.name = '이름을 입력해주세요.';
      if (!form.email.trim()) formErrors.email = '이메일을 입력해주세요.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) formErrors.email = '이메일 형식이 올바르지 않습니다.';
      if (Object.keys(formErrors).length) return;
      const nm = form.name;
      Object.assign(form, { name: '', email: '', phone: '', grade: '일반' });
      closeModal();
      setTimeout(() => openModal('alert', { variant: 'success', data: { msg: `${nm}님이 등록되었습니다.` } }), 80);
    };

    /* 상세 모달의 수정 Confirm — 멤버 이름을 클로저로 캡처 */
    const openEditConfirm = (member) => {
      const nm = member.name;
      openModal('confirm', {
        onConfirm: () => openModal('alert', { variant: 'success', data: { msg: `${nm}님 정보가 수정되었습니다.` } }),
      });
    };

    /* ── 카탈로그 정의 ── */
    const CATALOG = [
      { id: 'alert',      icon: '🔔', name: '알림 모달',          desc: '정보 · 성공 · 경고 · 오류 4가지 타입', color: '#1a73e8' },
      { id: 'confirm',    icon: '❓', name: 'Confirm 다이얼로그',  desc: '확인/취소 선택, 콜백 연결',            color: '#e8587a' },
      { id: 'form',       icon: '📝', name: '폼 입력 모달',        desc: '유효성 검사 포함 입력 폼',             color: '#34a853' },
      { id: 'detail',     icon: '🔍', name: '상세보기 모달',       desc: '회원 정보 상세 — 그리드 행 클릭',      color: '#7c3aed' },
      { id: 'image',      icon: '🖼', name: '이미지 팝업',         desc: '이미지 확대 뷰어 (어두운 배경)',        color: '#b45309' },
      { id: 'drawer',     icon: '◧',  name: '우측 Drawer',        desc: '화면 오른쪽에서 슬라이드인',            color: '#0f766e' },
      { id: 'bottom',     icon: '⬆',  name: '바텀시트',            desc: '화면 하단에서 슬라이드업',              color: '#9333ea' },
      { id: 'fullscreen', icon: '⛶',  name: '전체화면 모달',       desc: '화면 전체를 덮는 모달',                color: '#9f1239' },
      { id: 'nested',     icon: '⧉',  name: '중첩 모달',           desc: '모달 위에 또 다른 모달 오픈',           color: '#1e40af' },
      { id: 'loading',    icon: '⏳', name: '로딩 모달',            desc: '2.5초 후 자동으로 닫힘',               color: '#374151' },
    ];

    const GRADE_BADGE = g => ({
      'VVIP': 'background:#fce7f3;color:#9d174d;border:1px solid #fbcfe8;',
      'VIP':  'background:#fef9c3;color:#854d0e;border:1px solid #fde68a;',
      '우수': 'background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;',
      '일반': 'background:#f0f0f0;color:#666;border:1px solid #e0e0e0;',
    }[g] || 'background:#f0f0f0;color:#666;');

    const STATUS_BADGE = s => ({
      '활성': 'background:#d1fae5;color:#065f46;',
      '휴면': 'background:#fef3c7;color:#92400e;',
      '탈퇴': 'background:#fee2e2;color:#991b1b;',
    }[s] || '');

    const ALERT_META = v => ({
      info:    { icon: 'ℹ️',  label: '안내',  bg: '#3b82f6', bar: '#3b82f6' },
      success: { icon: '✅', label: '성공',  bg: '#22c55e', bar: '#22c55e' },
      warning: { icon: '⚠️', label: '경고',  bg: '#f59e0b', bar: '#f59e0b' },
      error:   { icon: '❌', label: '오류',  bg: '#ef4444', bar: '#ef4444' },
    }[v] || { icon: 'ℹ️', label: '안내', bg: '#3b82f6', bar: '#3b82f6' });

    onMounted(async () => {
      try {
        const r = await window.frontApi.get('xs/sample04.json');
        (r.data || []).forEach(d => members.push(d));
      } catch {}
    });

    /* ── adminUtil mock (index.html 미포함 → 가드) ── */
    if (!window.adminUtil) {
      window.adminUtil = {
        getSiteNm: () => 'ShopJoy', DATE_RANGE_OPTIONS: [],
        getDateRange: () => ({ from: '', to: '' }),
        isInRange: () => true, exportCsv: () => {},
      };
    }

    /* ── BaseModal 데모 상태 ── */
    const adminData   = window.adminData || { sites: [], vendors: [], members: [], orders: [], bbms: [], adminUsers: [], depts: [], roles: [], menus: [], categories: [] };
    const bModal      = reactive({ type: null });
    const openBModal  = (type) => { bModal.type = type; };
    const closeBModal = () => { bModal.type = null; };

    const bShowToast    = (msg, variant = 'info') => openModal('alert', { variant, data: { msg } });
    const bShowConfirm  = (title, msg) => Promise.resolve(window.confirm(`${title}\n\n${msg}`));

    /* ── 데모 데이터 ── */
    const demoOrder = {
      orderId: 'ORD-2026-00123', orderDate: '2026-04-10', status: '배송중',
      items: [
        { emoji: '👕', prodNm: '프리미엄 코튼 티셔츠', color: '화이트', size: 'M',   qty: 2, price: 58000,
          productCoupon: { name: '상품10%할인', discount: 5800 } },
        { emoji: '👟', prodNm: '에어맥스 스니커즈',    color: '블랙',   size: '270', qty: 1, price: 129000 },
      ],
      shippingFee: 3000, shippingCoupon: { discount: 3000 },
      cashPaid: 0, transferPaid: 0, totalPrice: 184200,
      courier: 'CJ대한통운', trackingNo: '1234567890',
      paymentDetails: [{ type: '카드', amount: 184200, account: '' }],
    };
    const demoProduct = {
      productId: 'PRD-1001', prodNm: '프리미엄 코튼 티셔츠', emoji: '👕',
      price: '58,000원', badge: '베스트셀러',
      desc: '고급 코튼 소재로 제작된 프리미엄 티셔츠. 통기성이 우수하고 세탁 후에도 형태가 유지됩니다.',
      opt1s: [{ name: '화이트', hex: '#f8f9fa' }, { name: '블랙', hex: '#212529' }, { name: '네이비', hex: '#1e3a5f' }],
      opt2s: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['베스트셀러', '신상품', '코튼100%'],
    };
    const demoUser   = { name: '홍길동', phone: '010-1234-5678', email: 'hong@shopjoy.kr' };
    const demoTmpl   = {
      templateId: 1, templateType: '메일템플릿', templateNm: '회원가입 환영 메일',
      subject: '[ShopJoy] {{name}}님, 회원가입을 축하합니다!',
      content: '<p>안녕하세요, <b>{{name}}</b>님!</p><p>ShopJoy 회원이 되신 것을 환영합니다. 지금 바로 쇼핑을 시작해보세요.</p><p>🎁 신규 회원 혜택: <span style="color:#e8587a;font-weight:700;">5,000원 쿠폰</span>이 발급되었습니다.</p>',
    };
    const demoSampleParams = JSON.stringify({ name: '홍길동', coupon: '5000' });
    const catSelIds  = reactive([]);

    /* ── BaseModal 카탈로그 — 3그룹 분류 ── */

    /* ① Front + Admin 공통 (3종)
         show prop 방식, adminData 의존성 없음 → 양쪽 모두 사용 */
    const CATALOG2_COMMON = [
      { id: 'orderDetail',   icon: '📦', name: '주문상세 모달',    desc: 'OrderDetailModal — 상품/결제/배송',   color: '#2563eb' },
      { id: 'productModal',  icon: '🛍',  name: '상품상세 모달',    desc: 'ProductModal — 색상/사이즈/태그',      color: '#7c3aed' },
      { id: 'customerModal', icon: '👤', name: '주문자 정보 모달',  desc: 'CustomerModal — 주문자/결제 정보',     color: '#0891b2' },
    ];

    /* ② Front 전용 (1종)
         window.adminData.categories 직접 참조, 사용자 카테고리 필터용 */
    const CATALOG2_FRONT = [
      { id: 'catSelect', icon: '🏷', name: '카테고리 멀티선택', desc: 'CategorySelectModal — 트리+멀티체크', color: '#7e22ce' },
    ];

    /* ③ Admin 전용 (13종)
         adminData prop 필수, 관리 기능 전용 */
    const CATALOG2_ADMIN = [
      { id: 'siteSelect',      icon: '🌐', name: '사이트 선택',       desc: 'SiteSelectModal — 검색+선택',          color: '#0f766e' },
      { id: 'vendorSelect',    icon: '🏢', name: '판매업체 선택',     desc: 'VendorSelectModal — 검색+선택',        color: '#b45309' },
      { id: 'adminUserSelect', icon: '👥', name: '사용자 선택',       desc: 'AdminUserSelectModal — 부서트리+멀티', color: '#1e40af' },
      { id: 'memberSelect',    icon: '🙋', name: '회원 선택',         desc: 'MemberSelectModal — 회원 검색선택',   color: '#9333ea' },
      { id: 'orderSelect',     icon: '🧾', name: '주문 선택',         desc: 'OrderSelectModal — 주문 검색선택',    color: '#be185d' },
      { id: 'bbmSelect',       icon: '📬', name: '게시판 선택',       desc: 'BbmSelectModal — 페이지네이션',        color: '#065f46' },
      { id: 'tmplPreview',     icon: '📄', name: '템플릿 미리보기',   desc: 'TemplatePreviewModal — {{파라미터}} 치환', color: '#374151' },
      { id: 'tmplSend',        icon: '📨', name: '템플릿 발송',       desc: 'TemplateSendModal — 회원/관리자 탭',   color: '#92400e' },
      { id: 'roleTree',        icon: '🔐', name: '권한 트리',         desc: 'RoleTreeModal — 권한 계층 선택',       color: '#dc2626' },
      { id: 'menuTree',        icon: '🗂',  name: '메뉴 트리',         desc: 'MenuTreeModal — 상위메뉴 선택',        color: '#0369a1' },
      { id: 'deptTree',        icon: '🏗',  name: '부서 트리',         desc: 'DeptTreeModal — 부서 계층 선택',       color: '#4338ca' },
      { id: 'categoryTree',    icon: '📁', name: '카테고리 트리',     desc: 'CategoryTreeModal — 계층 선택',        color: '#15803d' },
      { id: 'dispPreview',     icon: '👁',  name: '전시 미리보기',     desc: 'DispPreviewModal — 위젯 미리보기',     color: '#b91c1c' },
    ];

    return {
      members, modal, form, formErrors, CATALOG,
      openModal, closeModal, doConfirm, loadingDemo, submitForm, openEditConfirm,
      GRADE_BADGE, STATUS_BADGE, ALERT_META,
      /* BaseModal */
      adminData, bModal, openBModal, closeBModal, bShowToast, bShowConfirm,
      demoOrder, demoProduct, demoUser, demoTmpl, demoSampleParams, catSelIds,
      CATALOG2_COMMON, CATALOG2_FRONT, CATALOG2_ADMIN,
    };
  },

  template: /* html */`
<div style="padding:16px;">

  <!-- 제목 -->
  <div style="font-size:16px;font-weight:700;margin-bottom:16px;">
    04. 모달 / 팝업
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">Modal &amp; Popup 전시관 — 커스텀 10종 + BaseModal 17종</span>
  </div>

  <!-- ━━━ 카탈로그 카드 그리드 ━━━ -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:22px;">
    <div v-for="item in CATALOG" :key="item.id"
      style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:24px;width:30px;text-align:center;flex-shrink:0;line-height:1;">{{ item.icon }}</span>
        <div>
          <div style="font-size:12px;font-weight:800;color:#222;">{{ item.name }}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;line-height:1.4;">{{ item.desc }}</div>
        </div>
      </div>
      <!-- Alert: 4 variant 버튼 -->
      <div v-if="item.id==='alert'" style="display:flex;gap:4px;flex-wrap:wrap;">
        <button @click="openModal('alert',{variant:'info',    data:{msg:'시스템 점검이 2026-04-15 02:00 예정되어 있습니다.'}})"
          style="font-size:10px;padding:3px 8px;border:none;border-radius:4px;background:#dbeafe;color:#1e40af;cursor:pointer;font-weight:700;">ℹ info</button>
        <button @click="openModal('alert',{variant:'success', data:{msg:'저장이 완료되었습니다.'}})"
          style="font-size:10px;padding:3px 8px;border:none;border-radius:4px;background:#d1fae5;color:#065f46;cursor:pointer;font-weight:700;">✔ success</button>
        <button @click="openModal('alert',{variant:'warning', data:{msg:'재고가 5개 미만입니다. 확인해주세요.'}})"
          style="font-size:10px;padding:3px 8px;border:none;border-radius:4px;background:#fef3c7;color:#92400e;cursor:pointer;font-weight:700;">⚠ warning</button>
        <button @click="openModal('alert',{variant:'error',   data:{msg:'서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}})"
          style="font-size:10px;padding:3px 8px;border:none;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;font-weight:700;">✕ error</button>
      </div>
      <!-- Loading: async -->
      <button v-else-if="item.id==='loading'" @click="loadingDemo()"
        style="align-self:flex-start;font-size:11px;padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-weight:600;color:#fff;"
        :style="'background:'+item.color">열기 →</button>
      <!-- Confirm: 확인 시 success alert 표시 -->
      <button v-else-if="item.id==='confirm'"
        @click="openModal('confirm',{onConfirm:()=>openModal('alert',{variant:'success',data:{msg:'확인 처리되었습니다.'}})})"
        style="align-self:flex-start;font-size:11px;padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-weight:600;color:#fff;"
        :style="'background:'+item.color">열기 →</button>
      <!-- Detail: 첫 번째 회원 데이터로 오픈 -->
      <button v-else-if="item.id==='detail' && members.length"
        @click="openModal('detail',{data:members[0]})"
        style="align-self:flex-start;font-size:11px;padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-weight:600;color:#fff;"
        :style="'background:'+item.color">열기 →</button>
      <!-- 그 외 -->
      <button v-else-if="item.id!=='detail'" @click="openModal(item.id)"
        style="align-self:flex-start;font-size:11px;padding:5px 14px;border:none;border-radius:5px;cursor:pointer;font-weight:600;color:#fff;"
        :style="'background:'+item.color">열기 →</button>
    </div>
  </div>

  <!-- ━━━ BaseModal.js 공통 모달 (17종) ━━━ -->
  <div style="margin-top:22px;display:flex;flex-direction:column;gap:14px;">

    <!-- 섹션 헤더 -->
    <div>
      <div style="font-size:13px;font-weight:700;color:#333;">
        BaseModal.js 공통 모달
        <span style="font-size:11px;font-weight:400;color:#888;margin-left:6px;">components/modals/BaseModal.js — 17가지 패턴</span>
      </div>
    </div>

    <!-- ① Front + Admin 공통 (3종) -->
    <div style="border:1px solid #dbeafe;border-radius:10px;padding:14px 16px;background:#f0f7ff;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:800;background:#2563eb;color:#fff;padding:2px 10px;border-radius:20px;">Front + Admin 공통</span>
        <span style="font-size:11px;color:#2563eb;font-weight:600;">3종</span>
        <span style="font-size:11px;color:#93c5fd;">— show prop 방식, adminData 의존성 없음</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
        <div v-for="item in CATALOG2_COMMON" :key="item.id"
          style="background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;flex-shrink:0;line-height:1;">{{ item.icon }}</span>
            <div>
              <div style="font-size:12px;font-weight:800;color:#1e3a8a;">{{ item.name }}</div>
              <div style="font-size:10px;color:#93c5fd;margin-top:1px;line-height:1.4;">{{ item.desc }}</div>
            </div>
          </div>
          <button @click="openBModal(item.id)"
            style="align-self:flex-start;font-size:11px;padding:4px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:600;color:#fff;"
            :style="'background:'+item.color">열기 →</button>
        </div>
      </div>
    </div>

    <!-- ② Front 전용 (1종) -->
    <div style="border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;background:#f0fdf4;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:800;background:#16a34a;color:#fff;padding:2px 10px;border-radius:20px;">Front 전용</span>
        <span style="font-size:11px;color:#16a34a;font-weight:600;">1종</span>
        <span style="font-size:11px;color:#86efac;">— window.adminData.categories 직접 참조, 사용자 카테고리 필터</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
        <div v-for="item in CATALOG2_FRONT" :key="item.id"
          style="background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;flex-shrink:0;line-height:1;">{{ item.icon }}</span>
            <div>
              <div style="font-size:12px;font-weight:800;color:#14532d;">{{ item.name }}</div>
              <div style="font-size:10px;color:#86efac;margin-top:1px;line-height:1.4;">{{ item.desc }}</div>
            </div>
          </div>
          <button @click="openBModal(item.id)"
            style="align-self:flex-start;font-size:11px;padding:4px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:600;color:#fff;"
            :style="'background:'+item.color">열기 →</button>
        </div>
      </div>
    </div>

    <!-- ③ Admin 전용 (13종) -->
    <div style="border:1px solid #fecaca;border-radius:10px;padding:14px 16px;background:#fff7f7;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:11px;font-weight:800;background:#dc2626;color:#fff;padding:2px 10px;border-radius:20px;">Admin 전용</span>
        <span style="font-size:11px;color:#dc2626;font-weight:600;">13종</span>
        <span style="font-size:11px;color:#fca5a5;">— adminData prop 필수, 관리 기능 전용</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
        <div v-for="item in CATALOG2_ADMIN" :key="item.id"
          style="background:#fff;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;flex-shrink:0;line-height:1;">{{ item.icon }}</span>
            <div>
              <div style="font-size:12px;font-weight:800;color:#7f1d1d;">{{ item.name }}</div>
              <div style="font-size:10px;color:#fca5a5;margin-top:1px;line-height:1.4;">{{ item.desc }}</div>
            </div>
          </div>
          <button @click="openBModal(item.id)"
            style="align-self:flex-start;font-size:11px;padding:4px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:600;color:#fff;"
            :style="'background:'+item.color">열기 →</button>
        </div>
      </div>
    </div>

  </div>

  <!-- ━━━ 회원 그리드 (상세보기 클릭) ━━━ -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:22px;">
    <div style="padding:8px 14px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:6px;">
      <span style="font-size:12px;font-weight:800;color:#333;">회원 목록</span>
      <span style="font-size:12px;font-weight:700;color:#e8587a;">{{ members.length }}명 중 3행</span>
      <span style="font-size:11px;color:#aaa;margin-left:4px;">— 행 클릭 → 상세보기 모달</span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:680px;">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
            <th style="padding:7px 8px;text-align:center;font-weight:600;color:#888;font-size:10px;width:42px;">ID</th>
            <th style="padding:7px 8px;text-align:left;font-weight:600;color:#555;width:76px;">이름</th>
            <th style="padding:7px 8px;text-align:left;font-weight:600;color:#555;">이메일</th>
            <th style="padding:7px 8px;text-align:center;font-weight:600;color:#555;width:110px;">연락처</th>
            <th style="padding:7px 8px;text-align:center;font-weight:600;color:#555;width:56px;">등급</th>
            <th style="padding:7px 8px;text-align:center;font-weight:600;color:#555;width:50px;">상태</th>
            <th style="padding:7px 8px;text-align:right;font-weight:600;color:#555;width:56px;">주문</th>
            <th style="padding:7px 8px;text-align:right;font-weight:600;color:#555;width:110px;">총구매액</th>
            <th style="padding:7px 8px;text-align:center;font-weight:600;color:#555;width:86px;">가입일</th>
            <th style="padding:7px 8px;width:48px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!members.length">
            <td colspan="10" style="text-align:center;padding:30px;color:#ccc;">데이터 로딩 중…</td>
          </tr>
          <tr v-for="m in members.slice(0,3)" :key="m.memberId"
            @click="openModal('detail',{data:m})"
            style="cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
            @mouseenter="e=>e.currentTarget.style.background='#f5f7ff'"
            @mouseleave="e=>e.currentTarget.style.background=''">
            <td style="text-align:center;padding:6px 8px;color:#ccc;font-size:10px;">{{ m.memberId }}</td>
            <td style="padding:6px 8px;font-weight:700;color:#222;">{{ m.name }}</td>
            <td style="padding:6px 8px;color:#555;font-family:monospace;font-size:11px;">{{ m.email }}</td>
            <td style="text-align:center;padding:6px 8px;color:#666;font-size:11px;">{{ m.phone }}</td>
            <td style="text-align:center;padding:6px 4px;">
              <span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;" :style="GRADE_BADGE(m.grade)">{{ m.grade }}</span>
            </td>
            <td style="text-align:center;padding:6px 4px;">
              <span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;" :style="STATUS_BADGE(m.status)">{{ m.status }}</span>
            </td>
            <td style="text-align:right;padding:6px 8px;color:#555;">{{ m.orders }}</td>
            <td style="text-align:right;padding:6px 8px;color:#333;font-weight:700;">{{ m.totalAmt.toLocaleString() }}원</td>
            <td style="text-align:center;padding:6px 8px;color:#aaa;font-size:11px;">{{ m.joinDate }}</td>
            <td style="text-align:center;padding:6px 4px;">
              <button @click.stop="openModal('detail',{data:m})"
                style="font-size:10px;padding:2px 8px;border:1px solid #ddd;border-radius:4px;background:#f8f9fa;cursor:pointer;color:#555;">상세</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ━━━━━━ MODALS ━━━━━━ -->

  <!-- ① Alert 모달 -->
  <template v-if="modal.type==='alert'">
    <div @click="closeModal"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;">
      <div @click.stop
        style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.22);width:340px;max-width:90vw;overflow:hidden;">
        <div style="height:4px;" :style="'background:'+ALERT_META(modal.variant).bar"></div>
        <div style="padding:22px 20px 18px;">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:18px;">
            <span style="font-size:30px;line-height:1;flex-shrink:0;">{{ ALERT_META(modal.variant).icon }}</span>
            <div>
              <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:5px;">{{ ALERT_META(modal.variant).label }}</div>
              <div style="font-size:12px;color:#555;line-height:1.65;">{{ modal.data?.msg }}</div>
            </div>
          </div>
          <button @click="closeModal"
            style="width:100%;padding:9px;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:700;color:#fff;"
            :style="'background:'+ALERT_META(modal.variant).bg">확인</button>
        </div>
      </div>
    </div>
  </template>

  <!-- ② Confirm 다이얼로그 -->
  <template v-if="modal.type==='confirm'">
    <div @click="closeModal"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;">
      <div @click.stop
        style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.22);width:340px;max-width:90vw;padding:24px 22px 20px;">
        <div style="font-size:26px;margin-bottom:10px;">🤔</div>
        <div style="font-size:14px;font-weight:800;color:#111;margin-bottom:8px;">확인이 필요합니다</div>
        <div style="font-size:12px;color:#666;line-height:1.7;margin-bottom:22px;">이 작업을 진행하시겠습니까?<br>작업 후에는 되돌릴 수 없습니다.</div>
        <div style="display:flex;gap:8px;">
          <button @click="closeModal"
            style="flex:1;padding:9px;border:1px solid #ddd;border-radius:7px;background:#fff;cursor:pointer;font-size:13px;color:#666;">취소</button>
          <button @click="doConfirm"
            style="flex:1;padding:9px;border:none;border-radius:7px;background:#ef4444;color:#fff;cursor:pointer;font-size:13px;font-weight:700;">확인</button>
        </div>
      </div>
    </div>
  </template>

  <!-- ③ 폼 입력 모달 -->
  <template v-if="modal.type==='form'">
    <div @click="closeModal"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;">
      <div @click.stop
        style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.22);width:420px;max-width:92vw;">
        <div style="padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;background:#f8f9fa;">
          <span style="font-size:13px;font-weight:800;color:#333;">📝 신규 회원 등록</span>
          <button @click="closeModal" style="border:none;background:none;cursor:pointer;font-size:18px;color:#bbb;line-height:1;">✕</button>
        </div>
        <div style="padding:18px 20px;">
          <div style="margin-bottom:13px;">
            <label style="display:block;font-size:11px;font-weight:700;color:#555;margin-bottom:4px;">이름 <span style="color:#ef4444;">*</span></label>
            <input v-model="form.name" placeholder="홍길동"
              style="width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px;border-radius:6px;outline:none;"
              :style="formErrors.name?'border:1.5px solid #ef4444;':'border:1px solid #ddd;'" />
            <div v-if="formErrors.name" style="font-size:11px;color:#ef4444;margin-top:3px;">{{ formErrors.name }}</div>
          </div>
          <div style="margin-bottom:13px;">
            <label style="display:block;font-size:11px;font-weight:700;color:#555;margin-bottom:4px;">이메일 <span style="color:#ef4444;">*</span></label>
            <input v-model="form.email" placeholder="example@shopjoy.kr" type="email"
              style="width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px;border-radius:6px;outline:none;"
              :style="formErrors.email?'border:1.5px solid #ef4444;':'border:1px solid #ddd;'" />
            <div v-if="formErrors.email" style="font-size:11px;color:#ef4444;margin-top:3px;">{{ formErrors.email }}</div>
          </div>
          <div style="margin-bottom:13px;">
            <label style="display:block;font-size:11px;font-weight:700;color:#555;margin-bottom:4px;">연락처</label>
            <input v-model="form.phone" placeholder="010-0000-0000"
              style="width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;outline:none;" />
          </div>
          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:#555;margin-bottom:4px;">등급</label>
            <select v-model="form.grade"
              style="width:100%;font-size:12px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;outline:none;">
              <option>일반</option><option>우수</option><option>VIP</option><option>VVIP</option>
            </select>
          </div>
        </div>
        <div style="padding:10px 20px 16px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #f0f0f0;">
          <button @click="closeModal" style="padding:8px 18px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#666;">취소</button>
          <button @click="submitForm" style="padding:8px 18px;border:none;border-radius:6px;background:#34a853;color:#fff;cursor:pointer;font-size:12px;font-weight:700;">등록</button>
        </div>
      </div>
    </div>
  </template>

  <!-- ④ 상세보기 모달 -->
  <template v-if="modal.type==='detail' && modal.data">
    <div @click="closeModal"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;">
      <div @click.stop
        style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.22);width:500px;max-width:92vw;">
        <div style="padding:13px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;background:#f8f9fa;">
          <span style="font-size:18px;">👤</span>
          <span style="font-size:13px;font-weight:800;color:#222;">회원 상세 정보</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700;" :style="GRADE_BADGE(modal.data.grade)">{{ modal.data.grade }}</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700;margin-left:2px;" :style="STATUS_BADGE(modal.data.status)">{{ modal.data.status }}</span>
          <span style="flex:1;"></span>
          <button @click="closeModal" style="border:none;background:none;cursor:pointer;font-size:18px;color:#bbb;line-height:1;">✕</button>
        </div>
        <div style="padding:16px 20px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:14px;">
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">이름</div>
              <div style="font-size:16px;font-weight:800;color:#111;">{{ modal.data.name }}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">회원번호</div>
              <div style="font-size:14px;font-weight:700;color:#555;">#{{ modal.data.memberId }}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">이메일</div>
              <div style="font-size:11px;color:#333;font-family:monospace;">{{ modal.data.email }}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">연락처</div>
              <div style="font-size:12px;color:#333;">{{ modal.data.phone }}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">가입일</div>
              <div style="font-size:12px;color:#333;">{{ modal.data.joinDate }}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">주소</div>
              <div style="font-size:11px;color:#333;">{{ modal.data.address }}</div>
            </div>
          </div>
          <!-- 구매 통계 -->
          <div style="background:#f8f9fa;border-radius:8px;padding:12px 16px;display:flex;gap:0;margin-bottom:10px;">
            <div style="flex:1;text-align:center;border-right:1px solid #e5e7eb;">
              <div style="font-size:10px;color:#aaa;margin-bottom:4px;">총 주문</div>
              <div style="font-size:20px;font-weight:800;color:#333;">{{ modal.data.orders }}</div>
              <div style="font-size:10px;color:#aaa;">건</div>
            </div>
            <div style="flex:1;text-align:center;padding:0 12px;">
              <div style="font-size:10px;color:#aaa;margin-bottom:4px;">총 구매액</div>
              <div style="font-size:18px;font-weight:800;color:#e8587a;">{{ modal.data.totalAmt.toLocaleString() }}</div>
              <div style="font-size:10px;color:#aaa;">원</div>
            </div>
          </div>
          <div v-if="modal.data.memo"
            style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;font-size:11px;color:#92400e;">
            📌 {{ modal.data.memo }}
          </div>
        </div>
        <div style="padding:10px 20px 14px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #f0f0f0;">
          <button @click="openEditConfirm(modal.data)"
            style="padding:7px 16px;border:none;border-radius:6px;background:#7c3aed;color:#fff;cursor:pointer;font-size:12px;font-weight:700;">✏ 수정</button>
          <button @click="closeModal"
            style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#666;">닫기</button>
        </div>
      </div>
    </div>
  </template>

  <!-- ⑤ 이미지 팝업 -->
  <template v-if="modal.type==='image'">
    <div @click="closeModal"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;">
      <button @click="closeModal"
        style="position:absolute;top:18px;right:22px;border:none;background:rgba(255,255,255,.15);cursor:pointer;font-size:16px;color:#fff;padding:6px 10px;border-radius:6px;line-height:1;">✕ 닫기</button>
      <div @click.stop
        style="width:480px;max-width:88vw;height:320px;border-radius:12px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,.6);background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f64f59 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
        <span style="font-size:56px;">🛍️</span>
        <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.08em;">ShopJoy</div>
        <div style="color:rgba(255,255,255,.65);font-size:12px;">이미지 뷰어 데모 — 480 × 320</div>
      </div>
      <div style="color:rgba(255,255,255,.45);font-size:11px;">배경 또는 ✕ 클릭 시 닫기</div>
    </div>
  </template>

  <!-- ⑥ 우측 Drawer -->
  <template v-if="modal.type==='drawer'">
    <div @click="closeModal" style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.4);"></div>
    <div @click.stop
      style="position:fixed;top:0;right:0;bottom:0;z-index:9001;width:360px;max-width:88vw;background:#fff;box-shadow:-4px 0 28px rgba(0,0,0,.18);display:flex;flex-direction:column;animation:s04_slideRight .22s ease;">
      <div style="padding:13px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;background:#0f766e;color:#fff;">
        <span style="font-size:13px;font-weight:800;">◧ 우측 Drawer</span>
        <button @click="closeModal" style="border:none;background:none;cursor:pointer;font-size:18px;color:rgba(255,255,255,.8);line-height:1;">✕</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:18px;">
        <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:16px;">
          화면 우측에서 슬라이드인하는 Drawer 패턴입니다.<br>
          필터, 설정, 보조 정보 표시 등에 활용합니다.
        </div>
        <div v-for="i in 8" :key="i"
          style="padding:10px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:background .1s;"
          @mouseenter="e=>e.currentTarget.style.background='#f0fdfa'"
          @mouseleave="e=>e.currentTarget.style.background=''">
          <div style="font-size:12px;font-weight:700;color:#0f766e;">항목 {{ i }}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">Drawer 내 스크롤 가능한 콘텐츠</div>
        </div>
      </div>
      <div style="padding:12px 18px 18px;border-top:1px solid #f0f0f0;">
        <button @click="closeModal" style="width:100%;padding:10px;border:none;border-radius:8px;background:#0f766e;color:#fff;cursor:pointer;font-size:13px;font-weight:700;">닫기</button>
      </div>
    </div>
  </template>

  <!-- ⑦ 바텀시트 -->
  <template v-if="modal.type==='bottom'">
    <div @click="closeModal" style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.4);"></div>
    <div @click.stop
      style="position:fixed;left:0;right:0;bottom:0;z-index:9001;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -4px 28px rgba(0,0,0,.2);max-height:68vh;display:flex;flex-direction:column;animation:s04_slideBottom .22s ease;">
      <div style="padding:10px 0 4px;text-align:center;flex-shrink:0;">
        <div style="width:38px;height:4px;border-radius:2px;background:#e0e0e0;margin:0 auto;cursor:grab;" @click="closeModal"></div>
      </div>
      <div style="padding:4px 20px 12px;font-size:14px;font-weight:800;color:#111;flex-shrink:0;">⬆ 바텀시트</div>
      <div style="flex:1;overflow-y:auto;padding:0 20px;">
        <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:14px;">
          화면 하단에서 슬라이드업하는 바텀시트 패턴입니다.<br>
          모바일 UX에서 자주 활용합니다.
        </div>
        <div v-for="(label,i) in ['배송지 변경','쿠폰 적용','포인트 사용','결제 수단 변경','주문 메모 추가','취소/반품 신청']" :key="i"
          style="display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;"
          @mouseenter="e=>e.currentTarget.style.color='#9333ea'"
          @mouseleave="e=>e.currentTarget.style.color=''">
          <span style="font-size:13px;font-weight:600;color:inherit;">{{ label }}</span>
          <span style="color:#d1d5db;font-size:14px;">›</span>
        </div>
      </div>
      <div style="padding:14px 20px 22px;flex-shrink:0;">
        <button @click="closeModal" style="width:100%;padding:12px;border:none;border-radius:10px;background:#9333ea;color:#fff;cursor:pointer;font-size:14px;font-weight:700;">닫기</button>
      </div>
    </div>
  </template>

  <!-- ⑧ 전체화면 모달 -->
  <template v-if="modal.type==='fullscreen'">
    <div style="position:fixed;inset:0;z-index:9000;background:#fff;display:flex;flex-direction:column;animation:s04_fadeIn .18s ease;">
      <div style="padding:12px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;background:#9f1239;color:#fff;flex-shrink:0;">
        <span style="font-size:13px;font-weight:800;">⛶ 전체화면 모달</span>
        <button @click="closeModal" style="border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);cursor:pointer;font-size:12px;color:#fff;padding:5px 14px;border-radius:6px;">✕ 닫기</button>
      </div>
      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#fafafa;">
        <span style="font-size:64px;">🚀</span>
        <div style="font-size:20px;font-weight:800;color:#222;">전체화면 모달</div>
        <div style="font-size:13px;color:#888;text-align:center;max-width:400px;line-height:1.8;">
          화면 전체를 덮는 모달 패턴입니다.<br>
          에디터, 전체 편집 화면, 임시 대시보드 등에 활용됩니다.
        </div>
        <button @click="closeModal" style="margin-top:8px;padding:11px 36px;border:none;border-radius:8px;background:#9f1239;color:#fff;cursor:pointer;font-size:14px;font-weight:700;">닫기</button>
      </div>
    </div>
  </template>

  <!-- ⑨ 중첩 모달 -->
  <template v-if="modal.type==='nested'">
    <div @click="modal.nested2 ? modal.nested2=false : closeModal()"
      style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;">
      <div @click.stop
        style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.22);width:420px;max-width:92vw;">
        <div style="padding:13px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;background:#f8f9fa;">
          <span style="font-size:13px;font-weight:800;color:#333;">⧉ 중첩 모달 (1단계)</span>
          <button @click="closeModal" style="border:none;background:none;cursor:pointer;font-size:18px;color:#bbb;line-height:1;">✕</button>
        </div>
        <div style="padding:20px 20px 16px;">
          <div style="font-size:12px;color:#555;line-height:1.75;margin-bottom:16px;">
            이 모달 위에 2단계 모달을 추가로 오픈할 수 있습니다.<br>
            배경 클릭 시 가장 상단 모달부터 닫힙니다.
          </div>
          <button @click="modal.nested2=true"
            style="font-size:12px;padding:7px 18px;border:none;border-radius:6px;background:#1e40af;color:#fff;cursor:pointer;font-weight:700;">+ 2단계 모달 열기</button>
        </div>
        <div style="padding:10px 18px 14px;border-top:1px solid #f0f0f0;text-align:right;">
          <button @click="closeModal" style="padding:7px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:12px;color:#666;">닫기</button>
        </div>
      </div>
    </div>
    <!-- 2단계 inner 모달 -->
    <template v-if="modal.nested2">
      <div @click="modal.nested2=false"
        style="position:fixed;inset:0;z-index:9010;background:rgba(0,0,0,.32);display:flex;align-items:center;justify-content:center;">
        <div @click.stop
          style="background:#fff;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.35);width:300px;max-width:86vw;padding:22px 20px 18px;">
          <div style="font-size:22px;margin-bottom:10px;">✅</div>
          <div style="font-size:13px;font-weight:800;color:#111;margin-bottom:8px;">2단계 모달</div>
          <div style="font-size:12px;color:#666;line-height:1.7;margin-bottom:18px;">모달 위에 표시되는 중첩 모달입니다.<br>z-index를 높여 최상단에 렌더링됩니다.</div>
          <button @click="modal.nested2=false"
            style="width:100%;padding:9px;border:none;border-radius:7px;background:#1e40af;color:#fff;cursor:pointer;font-size:13px;font-weight:700;">닫기</button>
        </div>
      </div>
    </template>
  </template>

  <!-- ⑩ 로딩 모달 -->
  <template v-if="modal.type==='loading'">
    <div style="position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;">
      <div style="width:56px;height:56px;border:5px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:s04_spin .75s linear infinite;"></div>
      <div style="color:#fff;font-size:14px;font-weight:700;">처리 중입니다…</div>
      <div style="color:rgba(255,255,255,.45);font-size:11px;">2.5초 후 자동으로 닫힙니다</div>
    </div>
  </template>

  <!-- ━━━━━━ BaseModal 17종 ━━━━━━ -->

  <!-- ① 주문상세 / ② 상품상세 / ③ 주문자 — show prop 방식 -->
  <order-detail-modal
    :show="bModal.type==='orderDetail'"
    :order="demoOrder"
    @close="closeBModal" />
  <product-modal
    :show="bModal.type==='productModal'"
    :product="demoProduct"
    @close="closeBModal" />
  <customer-modal
    :show="bModal.type==='customerModal'"
    :user="demoUser"
    :order="demoOrder"
    @close="closeBModal" />

  <!-- ④~⑨ 선택 모달 — 조건부 마운트 방식 -->
  <template v-if="bModal.type==='siteSelect'">
    <site-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.siteNm,'success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='vendorSelect'">
    <vendor-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.vendorNm,'success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='adminUserSelect'">
    <admin-user-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.length+'명','success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='memberSelect'">
    <member-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.memberNm,'success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='orderSelect'">
    <order-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.orderId,'success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='bbmSelect'">
    <bbm-select-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.bbmNm,'success'); closeBModal()" @close="closeBModal" />
  </template>

  <!-- ⑩~⑪ 템플릿 모달 -->
  <template v-if="bModal.type==='tmplPreview'">
    <template-preview-modal :tmpl="demoTmpl" :sample-params="demoSampleParams" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='tmplSend'">
    <template-send-modal :tmpl="demoTmpl" :admin-data="adminData" :show-toast="bShowToast" :show-confirm="bShowConfirm" @close="closeBModal" />
  </template>

  <!-- ⑫~⑮ 트리 모달 -->
  <template v-if="bModal.type==='roleTree'">
    <role-tree-modal :admin-data="adminData" @select="bShowToast('선택: '+$event.roleNm,'success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='menuTree'">
    <menu-tree-modal :admin-data="adminData" @select="bShowToast($event.menuId?'선택: '+$event.menuNm:'상위없음 선택','success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='deptTree'">
    <dept-tree-modal :admin-data="adminData" @select="bShowToast($event.deptId?'선택: '+$event.deptNm:'최상위 선택','success'); closeBModal()" @close="closeBModal" />
  </template>
  <template v-if="bModal.type==='categoryTree'">
    <category-tree-modal :admin-data="adminData" @select="bShowToast($event.categoryId?'선택: '+$event.categoryNm:'최상위 선택','success'); closeBModal()" @close="closeBModal" />
  </template>

  <!-- ⑯ 전시 미리보기 -->
  <disp-preview-modal
    :show="bModal.type==='dispPreview'"
    mode="all"
    tab-label="전시 미리보기 데모"
    area="MAIN_TOP"
    :widgets="[]"
    :widget="{}"
    @close="closeBModal" />

  <!-- ⑰ 카테고리 멀티선택 -->
  <category-select-modal
    :show="bModal.type==='catSelect'"
    :selected-ids="catSelIds"
    @close="closeBModal"
    @apply="ids => { catSelIds.splice(0, catSelIds.length, ...ids); bShowToast(ids.length+'개 카테고리 선택됨','success'); closeBModal(); }" />

  <style>
    @keyframes s04_slideRight  { from { transform:translateX(100%); } to { transform:translateX(0); } }
    @keyframes s04_slideBottom { from { transform:translateY(100%); } to { transform:translateY(0); } }
    @keyframes s04_spin        { to   { transform:rotate(360deg); } }
    @keyframes s04_fadeIn      { from { opacity:0; } to { opacity:1; } }

    /* ── 관리자 공통 모달 CSS (adminGlobalStyle.css 미포함 환경용) ── */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px; }
    .modal-box     { background:#fff;border-radius:12px;padding:24px;width:100%;max-width:580px;max-height:85vh;overflow-y:auto; }
    .modal-box.wide { max-width:820px; }
    .modal-header  { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px; }
    .modal-title   { font-size:16px;font-weight:700; }
    .modal-close   { cursor:pointer;font-size:22px;color:#aaa;line-height:1; }
    .modal-close:hover { color:#555; }
    .form-control  { width:100%;padding:8px 11px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;background:#fff;box-sizing:border-box; }
    .form-control:focus { outline:none;border-color:#e8587a;box-shadow:0 0 0 2px rgba(232,88,122,.1); }
    .sel-modal-list      { max-height:360px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px; }
    .sel-modal-item      { display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #f5f5f5; }
    .sel-modal-item:last-child { border-bottom:none; }
    .sel-modal-item:hover      { background:#fff8f9; }
    .sel-modal-item-name { flex:1;font-size:13px;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .sel-modal-item-id   { font-size:11px;color:#888;background:#f0f4ff;padding:1px 6px;border-radius:3px;flex-shrink:0; }
    .sel-modal-item-btn  { font-size:12px;background:#e8587a;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;flex-shrink:0; }
    .sel-modal-item-btn:hover { opacity:.85; }
    .pager-btn { min-width:28px;height:28px;padding:0 6px;border:1px solid #e0e0e0;border-radius:4px;background:#fff;font-size:12px;cursor:pointer;color:#555;transition:all .12s; }
    .pager-btn:hover:not(:disabled) { border-color:#e8587a;color:#e8587a; }
    .pager-btn.active  { background:#e8587a;color:#fff;border-color:#e8587a;font-weight:700; }
    .pager-btn:disabled { opacity:.35;cursor:default; }
    .btn           { display:inline-flex;align-items:center;gap:4px;padding:7px 14px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s; }
    .btn:hover     { opacity:.85; }
    .btn-primary   { background:#e8587a;color:#fff; }
    .btn-secondary { background:#fff;color:#444;border:1px solid #d9d9d9 !important; }
    .btn-blue      { background:#1677ff;color:#fff; }
    .btn-green     { background:#52c41a;color:#fff; }
    .btn-danger    { background:#ff4d4f;color:#fff; }
    .btn-sm        { padding:4px 10px;font-size:12px; }
    .btn-xs        { padding:2px 7px !important;font-size:11px !important; }
    .badge         { display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;white-space:nowrap; }
    .badge-blue    { background:#e6f4ff;color:#1677ff; }
    .badge-green   { background:#f6ffed;color:#389e0d; }
    .badge-red     { background:#fff1f0;color:#cf1322; }
    .badge-gray    { background:#f5f5f5;color:#8c8c8c; }
    .badge-orange  { background:#fff7e6;color:#d46b08; }
    .badge-purple  { background:#f9f0ff;color:#722ed1; }
    .badge-pink    { background:#fff0f6;color:#c41d7f; }
    .badge-teal    { background:#e6fffb;color:#08979c; }
    .badge-xs      { padding:1px 5px !important;font-size:10px !important;border-radius:4px !important;font-weight:700 !important; }
  </style>
</div>
  `,
};

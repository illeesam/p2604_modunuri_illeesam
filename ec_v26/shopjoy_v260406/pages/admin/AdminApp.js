/* ShopJoy Admin - 메인 앱 (라우팅 + 공통 상태) */
(function () {
  const { createApp, ref, reactive, computed, watch, onBeforeUnmount } = Vue;

  const PAGES = [
    { id: 'memberMng',  label: '회원관리' },
    { id: 'prodMng',    label: '상품관리' },
    { id: 'orderMng',   label: '주문관리' },
    { id: 'claimMng',   label: '클레임관리' },
    { id: 'dlivMng',    label: '배송관리' },
    { id: 'couponMng',  label: '쿠폰관리' },
    { id: 'cacheMng',   label: '캐쉬관리' },
    { id: 'dispMng',    label: '전시관리' },
    { id: 'eventMng',   label: '이벤트관리' },
    { id: 'contactMng', label: '문의관리' },
    { id: 'chattMng',   label: '채팅관리' },
  ];
  const ALL_PAGES = [
    ...PAGES.map(p => p.id),
    'memberDtl', 'prodDtl', 'orderDtl', 'claimDtl', 'dlivDtl',
    'couponDtl', 'cacheDtl', 'dispDtl', 'eventDtl', 'contactDtl', 'chattDtl',
  ];

  createApp({
    setup() {
      const page   = ref('memberMng');
      const editId = ref(null);

      /* ── Hash routing ── */
      const readHash = () => {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const p   = new URLSearchParams(raw);
        const pg  = p.get('page');
        if (pg && ALL_PAGES.includes(pg)) page.value = pg;
        const id  = p.get('id');
        editId.value = id !== null ? (isNaN(id) ? id : Number(id)) : null;
      };
      readHash();

      const navigate = (pg, opts = {}) => {
        page.value   = pg;
        editId.value = opts.id ?? null;
        const p = new URLSearchParams();
        p.set('page', pg);
        if (opts.id != null) p.set('id', opts.id);
        window.location.hash = p.toString();
        window.scrollTo(0, 0);
      };

      window.addEventListener('hashchange', readHash);
      onBeforeUnmount(() => window.removeEventListener('hashchange', readHash));

      /* ── Toast ── */
      const toast = reactive({ show: false, msg: '', type: 'success' });
      let toastTimer = null;
      const showToast = (msg, type = 'success') => {
        if (toastTimer) clearTimeout(toastTimer);
        Object.assign(toast, { show: true, msg, type });
        toastTimer = setTimeout(() => { toast.show = false; }, 3000);
      };

      /* ── Confirm ── */
      const confirmState = reactive({ show: false, title: '', msg: '', resolve: null });
      const showConfirm  = (title, msg) =>
        new Promise(r => Object.assign(confirmState, { show: true, title, msg, resolve: r }));
      const closeConfirm = v => { confirmState.show = false; confirmState.resolve?.(v); };

      /* ── 참조 모달 ── */
      const refModal = reactive({ show: false, type: '', id: null });
      const showRefModal = (type, id) => { refModal.type = type; refModal.id = id; refModal.show = true; };
      const closeRefModal = () => { refModal.show = false; };

      const navLabel = computed(() => {
        const found = PAGES.find(p => p.id === page.value);
        if (found) return found.label;
        const dtl = page.value.replace('Dtl', 'Mng');
        return (PAGES.find(p => p.id === dtl)?.label || '') + ' 상세';
      });

      return {
        page, editId, navigate, PAGES, navLabel,
        toast, showToast,
        confirmState, showConfirm, closeConfirm,
        refModal, showRefModal, closeRefModal,
        adminData: window.adminData,
      };
    },

    template: /* html */`
<div>
  <!-- NAV -->
  <nav class="admin-nav">
    <span class="brand" @click="navigate('memberMng')">ShopJoy Admin</span>
    <div class="nav-links">
      <span v-for="p in PAGES" :key="p.id"
        class="nav-link" :class="{active: page===p.id || page===p.id.replace('Mng','Dtl')}"
        @click="navigate(p.id)">{{ p.label }}</span>
    </div>
  </nav>

  <!-- PAGE -->
  <div class="admin-wrap">
    <member-mng  v-if="page==='memberMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <member-dtl  v-else-if="page==='memberDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <prod-mng    v-else-if="page==='prodMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <prod-dtl    v-else-if="page==='prodDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <order-mng   v-else-if="page==='orderMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <order-dtl   v-else-if="page==='orderDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <claim-mng   v-else-if="page==='claimMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <claim-dtl   v-else-if="page==='claimDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <dliv-mng    v-else-if="page==='dlivMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <dliv-dtl    v-else-if="page==='dlivDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <coupon-mng  v-else-if="page==='couponMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <coupon-dtl  v-else-if="page==='couponDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <cache-mng   v-else-if="page==='cacheMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <cache-dtl   v-else-if="page==='cacheDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <disp-mng    v-else-if="page==='dispMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <disp-dtl    v-else-if="page==='dispDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <event-mng   v-else-if="page==='eventMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <event-dtl   v-else-if="page==='eventDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <contact-mng v-else-if="page==='contactMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <contact-dtl v-else-if="page==='contactDtl'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
    <chatt-mng   v-else-if="page==='chattMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
    <chatt-dtl   v-else-if="page==='chattDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
  </div>

  <!-- 참조 모달 -->
  <admin-ref-modal v-if="refModal.show" :state="refModal" :admin-data="adminData" @close="closeRefModal" />

  <!-- Confirm -->
  <div v-if="confirmState.show" class="modal-overlay" @click.self="closeConfirm(false)">
    <div class="confirm-box">
      <div class="confirm-icon">⚠️</div>
      <div class="confirm-title">{{ confirmState.title }}</div>
      <div class="confirm-msg">{{ confirmState.msg }}</div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" @click="closeConfirm(false)">취소</button>
        <button class="btn btn-danger" @click="closeConfirm(true)">확인</button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="toast.show" class="toast-wrap">{{ toast.msg }}</div>
</div>
`,
  })
  .component('AdminRefModal', window.AdminRefModal)
  .component('MemberMng',  window.MemberMng)
  .component('MemberDtl',  window.MemberDtl)
  .component('ProdMng',    window.ProdMng)
  .component('ProdDtl',    window.ProdDtl)
  .component('OrderMng',   window.OrderMng)
  .component('OrderDtl',   window.OrderDtl)
  .component('ClaimMng',   window.ClaimMng)
  .component('ClaimDtl',   window.ClaimDtl)
  .component('DlivMng',    window.DlivMng)
  .component('DlivDtl',    window.DlivDtl)
  .component('CouponMng',  window.CouponMng)
  .component('CouponDtl',  window.CouponDtl)
  .component('CacheMng',   window.CacheMng)
  .component('CacheDtl',   window.CacheDtl)
  .component('DispMng',    window.DispMng)
  .component('DispDtl',    window.DispDtl)
  .component('EventMng',   window.EventMng)
  .component('EventDtl',   window.EventDtl)
  .component('ContactMng', window.ContactMng)
  .component('ContactDtl', window.ContactDtl)
  .component('ChattMng',   window.ChattMng)
  .component('ChattDtl',   window.ChattDtl)
  .component('DispWidget',  window.DispWidget  || { template: '<div/>' })
  .component('DispPanel',   window.DispPanel   || { template: '<div/>' })
  .mount('#app');
})();

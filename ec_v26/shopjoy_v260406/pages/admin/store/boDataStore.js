/**
 * BO Admin 데이터 스토어 (Pinia)
 * - 목업 데이터 제거
 * - 로그인 후 /bo/* API에서 로드
 */
(function () {
  const { defineStore } = Pinia;

  window.useBoDataStore = defineStore('boData', {
    state: () => ({
      // EC 도메인
      members: [],
      products: [],
      orders: [],
      claims: [],
      deliveries: [],
      coupons: [],
      caches: [],
      discounts: [],
      displays: [],
      events: [],
      notices: [],
      chatts: [],
      blogs: [],

      // SY 도메인
      codes: [],
      alarms: [],
      batches: [],
      sites: [],
      brands: [],
      users: [],
      depts: [],
      roles: [],
      menus: [],
      contacts: [],

      // 로딩 상태
      loading: false,
      error: null,
    }),

    getters: {
      isLoading: (state) => state.loading,
      hasError: (state) => state.error !== null,
    },

    actions: {
      /* ────── 데이터 로드 ────── */

      // 회원 목록
      async loadMembers(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/ec/mb/member/page', { params });
          this.members = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadMembers error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 상품 목록
      async loadProducts(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/ec/pd/prod/page', { params });
          this.products = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadProducts error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 주문 목록
      async loadOrders(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/ec/od/order/page', { params });
          this.orders = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadOrders error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 클레임 목록
      async loadClaims(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/ec/od/claim/page', { params });
          this.claims = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadClaims error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 배송 목록
      async loadDeliveries(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/ec/od/dliv/page', { params });
          this.deliveries = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadDeliveries error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 공통 코드 목록
      async loadCodes(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/sy/code', { params });
          this.codes = res.data?.data || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadCodes error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 알람 목록
      async loadAlarms(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/sy/alarm/page', { params });
          this.alarms = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadAlarms error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 사용자 목록
      async loadUsers(params = {}) {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/sy/user/page', { params });
          this.users = res.data?.data?.list || [];
          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoDataStore] loadUsers error:', err);
        } finally {
          this.loading = false;
        }
      },

      /* ────── 데이터 수정 반영 ────── */

      // 항목 업데이트 (로컬 상태 동기화)
      updateItem(domain, id, item) {
        const array = this[domain];
        if (!array) return;
        const idx = array.findIndex(x => x.id === id || x.userId === id || x.productId === id);
        if (idx !== -1) array.splice(idx, 1, item);
      },

      // 항목 추가
      addItem(domain, item) {
        const array = this[domain];
        if (array && Array.isArray(array)) {
          array.unshift(item);
        }
      },

      // 항목 삭제
      removeItem(domain, id) {
        const array = this[domain];
        if (!array) return;
        const idx = array.findIndex(x => x.id === id || x.userId === id || x.productId === id);
        if (idx !== -1) array.splice(idx, 1);
      },

      // 전체 리셋 (로그아웃)
      reset() {
        this.members = [];
        this.products = [];
        this.orders = [];
        this.claims = [];
        this.deliveries = [];
        this.coupons = [];
        this.caches = [];
        this.discounts = [];
        this.displays = [];
        this.events = [];
        this.notices = [];
        this.chatts = [];
        this.blogs = [];
        this.codes = [];
        this.alarms = [];
        this.batches = [];
        this.sites = [];
        this.brands = [];
        this.users = [];
        this.depts = [];
        this.roles = [];
        this.menus = [];
        this.contacts = [];
        this.loading = false;
        this.error = null;
      },
    },
  });
})();

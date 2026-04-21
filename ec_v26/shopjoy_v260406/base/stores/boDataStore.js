/**
 * BO Admin 데이터 스토어 (Pinia)
 * - 실제 사용 state만 유지
 * - 로그인 후 /bo/* API에서 로드
 */
(function () {
  const { defineStore } = Pinia;

  window.useBoDataStore = defineStore('boData', {
    state: () => ({
      // 실제 사용되는 state만 유지
      members: [],
      codes: [],
      batches: [],
      brands: [],
      depts: [],
      roles: [],
      menus: [],

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
        this.codes = [];
        this.batches = [];
        this.brands = [];
        this.depts = [];
        this.roles = [];
        this.menus = [];
        this.loading = false;
        this.error = null;
      },
    },
  });
})();

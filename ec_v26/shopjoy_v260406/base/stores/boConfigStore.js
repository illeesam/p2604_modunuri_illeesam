/**
 * BO Admin 글로벌 설정 Pinia 스토어
 * - 시스템 코드
 * - 사용자 메뉴
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boConfigStore] Pinia not loaded');
    return;
  }

  const { defineStore } = Pinia;

  window.useConfigStore = defineStore('config', {
    state: () => ({
      // 공통 코드 (CODE_GRP: CODE_LIST)
      codes: {},

      // 사용자 메뉴
      menus: [],

      // 로딩 상태
      loading: false,
      error: null,
    }),

    getters: {
      // 특정 코드 그룹 조회
      getCodesByGroup: (state) => (codeGrp) => state.codes[codeGrp] || [],

      // 특정 코드값 조회
      getCodeLabel:
        (state) =>
        (codeGrp, codeVal) => {
          const group = state.codes[codeGrp];
          if (!group) return '';
          const item = group.find((c) => c.codeVal === codeVal);
          return item?.codeLbl || '';
        },

      // 특정 메뉴 확인
      canAccessMenu: (state) => (menuId) =>
        state.menus.some((m) => m.menuId === menuId),
    },

    actions: {
      // 공통 코드 로드
      async loadCodes() {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/bo/sy/code');
          const codeList = res.data?.data || [];

          // 코드 그룹별로 정렬
          this.codes = {};
          codeList.forEach((code) => {
            if (!this.codes[code.codeGrp]) {
              this.codes[code.codeGrp] = [];
            }
            this.codes[code.codeGrp].push(code);
          });

          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[ConfigStore] loadCodes error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 사용자 메뉴 로드
      async loadMenus() {
        this.loading = true;
        try {
          const res = await window.adminApi.get('/auth/bo/auth/me');
          const user = res.data?.data || {};

          this.menus = user.menus || [];

          this.error = null;
        } catch (err) {
          this.error = err.message;
          console.error('[BoConfigStore] loadMenus error:', err);
        } finally {
          this.loading = false;
        }
      },

      // 초기화
      reset() {
        this.codes = {};
        this.menus = [];
        this.loading = false;
        this.error = null;
      },
    },
  });
})();

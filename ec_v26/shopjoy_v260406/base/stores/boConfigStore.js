/**
 * BO Admin 글로벌 설정 Pinia 스토어 + 함수형 유틸리티
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

      // 사용자 정보
      userInfo: null,

      // 로딩 상태
      loading: false,
      error: null,
    }),

    getters: {
      // 특정 코드 그룹 조회
      getCodesByGroup: (state) => (codeGrp) => (state.codes?.[codeGrp] || []),

      // 특정 코드값 조회
      getCodeLabel:
        (state) =>
        (codeGrp, codeVal) => {
          const group = state.codes?.[codeGrp];
          if (!group || !Array.isArray(group)) return '';
          const item = group.find((c) => c?.codeVal === codeVal);
          return item?.codeLbl || '';
        },

      // 특정 메뉴 확인
      canAccessMenu: (state) => (menuId) => {
        const menus = state.menus || [];
        return Array.isArray(menus) && menus.some((m) => m?.menuId === menuId);
      },
    },

    actions: {
      // 공통 코드 로드
      async loadCodes() {
        this.loading = true;
        try {
          const res = await window.boApi.get('/bo/sy/code');
          const codeList = res?.data?.data || [];

          // 코드 그룹별로 정렬
          this.codes = {};
          if (Array.isArray(codeList)) {
            codeList.forEach((code) => {
              if (code && code.codeGrp) {
                if (!this.codes[code.codeGrp]) {
                  this.codes[code.codeGrp] = [];
                }
                this.codes[code.codeGrp].push(code);
              }
            });
          }

          this.error = null;
        } catch (err) {
          this.error = err?.message || '코드 로드 실패';
          console.error('[ConfigStore] loadCodes error:', err);
          this.codes = {};
        } finally {
          this.loading = false;
        }
      },

      // 사용자 정보 로드
      async loadUserInfo() {
        this.loading = true;
        try {
          const res = await window.boApi.get('/auth/bo/auth/me');
          const user = res?.data?.data || {};

          this.userInfo = user || { boUserId: 0, name: '', email: '' };
          this.menus = (user?.menus || []);

          this.error = null;
        } catch (err) {
          this.error = err?.message || '사용자 정보 로드 실패';
          console.error('[BoConfigStore] loadUserInfo error:', err);
          this.userInfo = { boUserId: 0, name: '', email: '' };
          this.menus = [];
        } finally {
          this.loading = false;
        }
      },

      // 초기화
      reset() {
        this.codes = {};
        this.menus = [];
        this.userInfo = null;
        this.loading = false;
        this.error = null;
      },
    },
  });

  // 함수형 유틸리티 제공
  window.getConfigStore = () => {
    try {
      const store = window.useConfigStore?.();
      return store || {
        codes: {},
        menus: [],
        userInfo: null,
        loading: false,
        error: null,
      };
    } catch (e) {
      console.error('getConfigStore error:', e);
      return {
        codes: {},
        menus: [],
        userInfo: null,
        loading: false,
        error: null,
      };
    }
  };

  window.getCodeLabel = (codeGrp, codeVal) => {
    try {
      const store = window.useConfigStore?.();
      if (!store || !store.codes) return '';
      const group = store.codes[codeGrp];
      if (!group || !Array.isArray(group)) return '';
      const item = group.find((c) => c?.codeVal === codeVal);
      return item?.codeLbl || '';
    } catch (e) {
      console.error('getCodeLabel error:', e);
      return '';
    }
  };

  window.getCodesByGroup = (codeGrp) => {
    try {
      const store = window.useConfigStore?.();
      if (!store || !store.codes) return [];
      return store.codes[codeGrp] || [];
    } catch (e) {
      console.error('getCodesByGroup error:', e);
      return [];
    }
  };

  window.canAccessMenu = (menuId) => {
    try {
      const store = window.useConfigStore?.();
      if (!store || !store.menus) return false;
      const menus = store.menus || [];
      return Array.isArray(menus) && menus.some((m) => m?.menuId === menuId);
    } catch (e) {
      console.error('canAccessMenu error:', e);
      return false;
    }
  };

  window.getMenus = () => {
    try {
      const store = window.useConfigStore?.();
      return (store?.menus || []);
    } catch (e) {
      console.error('getMenus error:', e);
      return [];
    }
  };

  window.getUserInfo = () => {
    try {
      const store = window.useConfigStore?.();
      return store?.userInfo || { boUserId: 0, name: '', email: '' };
    } catch (e) {
      console.error('getUserInfo error:', e);
      return { boUserId: 0, name: '', email: '' };
    }
  };
})();

/**
 * BO 글로벌 설정 Pinia 스토어 + 함수형 유틸리티
 * - 시스템 코드
 * - 사용자 메뉴
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boConfigStore] Pinia not loaded');
    return;
  }

  const { defineStore } = Pinia;

  window.useBoConfigStore = defineStore('boConfig', {
    state: () => ({
      // 공통 코드 (CODE_GRP: CODE_LIST)
      svCodes: {},

      // 사용자 메뉴
      svMenus: [],

      // 사용자 정보
      svUserInfo: null,

      // 로딩 상태
      svLoading: false,
      svError: null,
    }),

    getters: {
      // 특정 코드 그룹 조회
      svGetCodesByGroup: (state) => (codeGrp) => (state.svCodes?.[codeGrp] || []),

      // 특정 코드값 조회
      svGetCodeLabel:
        (state) =>
        (codeGrp, codeVal) => {
          const group = state.svCodes?.[codeGrp];
          if (!group || !Array.isArray(group)) return '';
          const item = group.find((c) => c?.codeVal === codeVal);
          return item?.codeLbl || '';
        },

      // 특정 메뉴 확인
      svCanAccessMenu: (state) => (menuId) => {
        const menus = state.svMenus || [];
        return Array.isArray(menus) && menus.some((m) => m?.menuId === menuId);
      },
    },

    actions: {
      // 공통 코드 로드
      async sfLoadCodes() {
        this.svLoading = true;
        try {
          const res = await window.boApi.get('/bo/sy/code');
          const codeList = res?.data?.data || [];

          // 코드 그룹별로 정렬
          this.svCodes = {};
          if (Array.isArray(codeList)) {
            codeList.forEach((code) => {
              if (code && code.codeGrp) {
                if (!this.svCodes[code.codeGrp]) {
                  this.svCodes[code.codeGrp] = [];
                }
                this.svCodes[code.codeGrp].push(code);
              }
            });
          }

          this.svError = null;
        } catch (err) {
          this.svError = err?.message || '코드 로드 실패';
          console.error('[BoConfigStore] sfLoadCodes error:', err);
          this.svCodes = {};
        } finally {
          this.svLoading = false;
        }
      },


      // 초기화
      sfReset() {
        this.svCodes = {};
        this.svMenus = [];
        this.svUserInfo = null;
        this.svLoading = false;
        this.svError = null;
      },
    },
  });

  // 함수형 유틸리티 제공
  window.getBoConfigStore = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store || { svCodes: {}, svMenus: [], svUserInfo: null, svLoading: false, svError: null };
    } catch (e) {
      console.error('getBoConfigStore error:', e);
      return { svCodes: {}, svMenus: [], svUserInfo: null, svLoading: false, svError: null };
    }
  };

  window.getBoCodeLabel = (codeGrp, codeVal) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svCodes) return '';
      const group = store.svCodes[codeGrp];
      if (!group || !Array.isArray(group)) return '';
      const item = group.find((c) => c?.codeVal === codeVal);
      return item?.codeLbl || '';
    } catch (e) {
      console.error('getBoCodeLabel error:', e);
      return '';
    }
  };

  window.getBoCodesByGroup = (codeGrp) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svCodes) return [];
      return store.svCodes[codeGrp] || [];
    } catch (e) {
      console.error('getBoCodesByGroup error:', e);
      return [];
    }
  };

  window.getBoMenus = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store?.svMenus || [];
    } catch (e) {
      console.error('getBoMenus error:', e);
      return [];
    }
  };

  window.getBoUserInfo = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store?.svUserInfo || { boUserId: 0, name: '', email: '' };
    } catch (e) {
      console.error('getBoUserInfo error:', e);
      return { boUserId: 0, name: '', email: '' };
    }
  };

  window.canBoAccessMenu = (menuId) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svMenus) return false;
      return Array.isArray(store.svMenus) && store.svMenus.some((m) => m?.menuId === menuId);
    } catch (e) {
      console.error('canBoAccessMenu error:', e);
      return false;
    }
  };
})();

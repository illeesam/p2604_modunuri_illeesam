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

  /* site_no → site_id 매핑 (coUtil.siteNoToSiteId 와 동일 규칙) */
  const _toSiteId = (no) => 'SITE' + String(no || '01').padStart(6, '0');

  /* BO 사이트 정보 결정 + localStorage 영속화 + 구 키 마이그레이션.
     우선순위: URL ?SITE_NO= → localStorage(siteNo) → '01'.
     로그인/앱초기화(=store 생성) 시점에 호출되어 modu-bo-siteNo / modu-bo-siteId 를 항상 남긴다. */
  const _resolveBoSite = () => {
    let no = '01', id;
    try {
      // 구 키(언더스코어) → 신 키(카멜) 마이그레이션
      const oldNo = localStorage.getItem('modu-bo-site_no');
      if (oldNo && !localStorage.getItem('modu-bo-siteNo')) {
        localStorage.setItem('modu-bo-siteNo', oldNo);
      }
      if (localStorage.getItem('modu-bo-site_no')) localStorage.removeItem('modu-bo-site_no');
      const oldId = localStorage.getItem('modu-bo-site_id');
      if (oldId && !localStorage.getItem('modu-bo-siteId')) {
        localStorage.setItem('modu-bo-siteId', oldId);
      }
      if (localStorage.getItem('modu-bo-site_id')) localStorage.removeItem('modu-bo-site_id');

      const u = new URLSearchParams(location.search).get('SITE_NO');
      no = u || localStorage.getItem('modu-bo-siteNo') || '01';
      id = (!u && localStorage.getItem('modu-bo-siteId')) || _toSiteId(no);

      // 항상 localStorage 에 영속화 (로그인만 해도 키 생성)
      localStorage.setItem('modu-bo-siteNo', no);
      localStorage.setItem('modu-bo-siteId', id);
    } catch (_) {
      no = no || '01';
      id = id || 'SITE000001';
    }
    return { no, id };
  };

  window.useBoConfigStore = defineStore('boConfig', {
    state: () => {
      // store 생성(=로그인/앱초기화) 시점에 site 결정 + localStorage 영속화
      const _site = _resolveBoSite();
      return {
      // 사이트 번호(01/02/03/9999)
      svSiteNo: _site.no,

      // 사이트 ID(SITE000001 ...) — modu-bo-siteId 우선, 없으면 site_no 매핑
      svSiteId: _site.id,

      // 공통 코드 (CODE_GRP: CODE_LIST)
      svCodes: {},

      // 사용자 메뉴
      svMenus: [],

      // 사용자 정보
      svUserInfo: null,

      // 로딩 상태
      svLoading: false,
      svError: null,
      };
    },

    getters: {
      // 특정 코드 그룹 조회
      sgGetCodesByGroup: (state) => (codeGrp) => (state.svCodes?.[codeGrp] || []),

      // 특정 코드값 조회
      sgGetCodeLabel:
        (state) =>
        (codeGrp, codeVal) => {
          const group = state.svCodes?.[codeGrp];
          if (!group || !Array.isArray(group)) return '';
          const item = group.find((c) => c?.codeVal === codeVal);
          return item?.codeLbl || '';
        },

      // 특정 메뉴 확인
      sgCanAccessMenu: (state) => (menuId) => {
        const menus = state.svMenus || [];
        return Array.isArray(menus) && menus.some((m) => m?.menuId === menuId);
      },
    },

    actions: {
      // 공통 코드 로드
      async saLoadCodes() {
        this.svLoading = true;
        try {
          const res = await boApiSvc.syCode.getAll({}, '코드관리', '목록조회');
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
          console.error('[BoConfigStore] saLoadCodes error:', err);
          this.svCodes = {};
        } finally {
          this.svLoading = false;
        }
      },


      // 초기화
      saReset() {
        this.svCodes = {};
        this.svMenus = [];
        this.svUserInfo = null;
        this.svLoading = false;
        this.svError = null;
      },
    },
  });

  // 함수형 유틸리티 제공
  window.sfGetBoConfigStore = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store || { svCodes: {}, svMenus: [], svUserInfo: null, svLoading: false, svError: null };
    } catch (e) {
      console.error('sfGetBoConfigStore error:', e);
      return { svCodes: {}, svMenus: [], svUserInfo: null, svLoading: false, svError: null };
    }
  };

  window.sfGetBoCodeLabel = (codeGrp, codeVal) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svCodes) return '';
      const group = store.svCodes[codeGrp];
      if (!group || !Array.isArray(group)) return '';
      const item = group.find((c) => c?.codeVal === codeVal);
      return item?.codeLbl || '';
    } catch (e) {
      console.error('sfGetBoCodeLabel error:', e);
      return '';
    }
  };

  window.sfGetBoCodesByGroup = (codeGrp) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svCodes) return [];
      return store.svCodes[codeGrp] || [];
    } catch (e) {
      console.error('sfGetBoCodesByGroup error:', e);
      return [];
    }
  };

  window.sfGetBoMenus = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store?.svMenus || [];
    } catch (e) {
      console.error('sfGetBoMenus error:', e);
      return [];
    }
  };

  window.sfGetBoUserInfo = () => {
    try {
      const store = window.useBoConfigStore?.();
      return store?.svUserInfo || { boUserId: 0, name: '', email: '' };
    } catch (e) {
      console.error('sfGetBoUserInfo error:', e);
      return { boUserId: 0, name: '', email: '' };
    }
  };

  window.sfCanBoAccessMenu = (menuId) => {
    try {
      const store = window.useBoConfigStore?.();
      if (!store?.svMenus) return false;
      return Array.isArray(store.svMenus) && store.svMenus.some((m) => m?.menuId === menuId);
    } catch (e) {
      console.error('sfCanBoAccessMenu error:', e);
      return false;
    }
  };
})();

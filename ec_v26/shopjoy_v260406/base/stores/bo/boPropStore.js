/**
 * BO 시스템 속성 Pinia 스토어
 * - 시스템 프로퍼티 관리 (키-값)
 */
window.useBoPropStore = Pinia.defineStore('boProp', {
  state: () => {
    return {
      svProps: {},
      svIsLoading: false,
    };
  },

  getters: {
    sgIsEmpty: (s) => Object.keys(s.svProps).length === 0,
    sgGetProp: (s) => (key) => s.svProps[key], // 속성값 조회
    sgGetAllKeys: (s) => Object.keys(s.svProps), // 모든 속성키 목록
  },

  actions: {
    /**
     * 시스템 속성 설정 (전체 교체)
     */
    saSetProps(propsData) {
      this.svProps = propsData || {};
    },

    /**
     * 속성 추가/업데이트
     */
    saSetProp(key, value) {
      if (key !== undefined) {
        this.svProps[key] = value;
      }
    },

    /**
     * 여러 속성 일괄 추가/업데이트
     */
    saSetMultiProps(propsObj) {
      if (propsObj && typeof propsObj === 'object') {
        Object.assign(this.svProps, propsObj);
      }
    },

    /**
     * 속성 삭제
     */
    saRemoveProp(key) {
      if (key && this.svProps[key] !== undefined) {
        delete this.svProps[key];
      }
    },

    /**
     * 속성 존재 여부 확인
     */
    saHasProp(key) {
      return key !== undefined && this.svProps[key] !== undefined;
    },

    /**
     * 초기화 (로그아웃 시)
     */
    saClear() {
      this.svProps = {};
      this.svIsLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.sfGetBoPropStore = () => {
  try {
    return window.useBoPropStore?.() || {
      svProps: {},
      sgIsEmpty: true,
      svIsLoading: false,
    };
  } catch (e) {
    console.error('[sfGetBoPropStore] error:', e);
    return {
      svProps: {},
      sgIsEmpty: true,
      svIsLoading: false,
    };
  }
};

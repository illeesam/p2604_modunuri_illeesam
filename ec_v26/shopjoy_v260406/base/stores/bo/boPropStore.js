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
    svIsEmpty: (s) => Object.keys(s.svProps).length === 0,
    svGetProp: (s) => (key) => s.svProps[key], // 속성값 조회
    svGetAllKeys: (s) => Object.keys(s.svProps), // 모든 속성키 목록
  },

  actions: {
    /**
     * 시스템 속성 설정 (전체 교체)
     */
    sfSetProps(propsData) {
      this.svProps = propsData || {};
    },

    /**
     * 속성 추가/업데이트
     */
    sfSetProp(key, value) {
      if (key !== undefined) {
        this.svProps[key] = value;
      }
    },

    /**
     * 여러 속성 일괄 추가/업데이트
     */
    sfSetMultiProps(propsObj) {
      if (propsObj && typeof propsObj === 'object') {
        Object.assign(this.svProps, propsObj);
      }
    },

    /**
     * 속성 삭제
     */
    sfRemoveProp(key) {
      if (key && this.svProps[key] !== undefined) {
        delete this.svProps[key];
      }
    },

    /**
     * 속성 존재 여부 확인
     */
    sfHasProp(key) {
      return key !== undefined && this.svProps[key] !== undefined;
    },

    /**
     * 초기화 (로그아웃 시)
     */
    sfClear() {
      this.svProps = {};
      this.svIsLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoPropStore = () => {
  try {
    return window.useBoPropStore?.() || {
      svProps: {},
      svIsEmpty: true,
      svIsLoading: false,
    };
  } catch (e) {
    console.error('[getBoPropStore] error:', e);
    return {
      svProps: {},
      svIsEmpty: true,
      svIsLoading: false,
    };
  }
};

/**
 * BO 시스템 속성 Pinia 스토어
 * - 시스템 프로퍼티 관리 (키-값)
 */
window.useBoPropStore = Pinia.defineStore('boProp', {
  state: () => {
    return {
      props: {},
      isLoading: false,
    };
  },

  getters: {
    isEmpty: (s) => Object.keys(s.props).length === 0,
    getProp: (s) => (key) => s.props[key], // 속성값 조회
    getAllKeys: (s) => Object.keys(s.props), // 모든 속성키 목록
  },

  actions: {
    /**
     * 시스템 속성 설정 (전체 교체)
     */
    setProps(propsData) {
      this.props = propsData || {};
    },

    /**
     * 속성 추가/업데이트
     */
    setProp(key, value) {
      if (key !== undefined) {
        this.props[key] = value;
      }
    },

    /**
     * 여러 속성 일괄 추가/업데이트
     */
    setMultiProps(propsObj) {
      if (propsObj && typeof propsObj === 'object') {
        Object.assign(this.props, propsObj);
      }
    },

    /**
     * 속성 삭제
     */
    removeProp(key) {
      if (key && this.props[key] !== undefined) {
        delete this.props[key];
      }
    },

    /**
     * 속성 존재 여부 확인
     */
    hasProp(key) {
      return key !== undefined && this.props[key] !== undefined;
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.props = {};
      this.isLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoPropStore = () => {
  try {
    return window.useBoPropStore?.() || {
      props: {},
      isEmpty: true,
      isLoading: false,
    };
  } catch (e) {
    console.error('[getBoPropStore] error:', e);
    return {
      props: {},
      isEmpty: true,
      isLoading: false,
    };
  }
};

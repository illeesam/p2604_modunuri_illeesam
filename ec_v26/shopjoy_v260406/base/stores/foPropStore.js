/**
 * FO (Front Office) 시스템 속성 Pinia 스토어
 */
window.useFoPropStore = Pinia.defineStore('foProp', {
  state: () => {
    return {
      props: {},
    };
  },

  actions: {
    setProps(propsData) {
      if (propsData) {
        this.props = propsData;
      }
    },

    setProp(key, value) {
      if (key) {
        this.props[key] = value;
      }
    },

    setMultiProps(propsData) {
      if (propsData) {
        Object.assign(this.props, propsData);
      }
    },

    removeProp(key) {
      if (key) {
        delete this.props[key];
      }
    },

    hasProp(key) {
      return key in this.props;
    },

    clear() {
      this.props = {};
    },
  },
});

/**
 * FO (Front Office) 시스템 속성 Pinia 스토어
 */
window.useFoPropStore = Pinia.defineStore('foProp', {
  state: () => {
    return {
      svProps: {},
    };
  },

  actions: {
    saSetProps(propsData) {
      if (propsData) {
        this.svProps = propsData;
      }
    },

    saSetProp(key, value) {
      if (key) {
        this.svProps[key] = value;
      }
    },

    saSetMultiProps(propsData) {
      if (propsData) {
        Object.assign(this.svProps, propsData);
      }
    },

    saRemoveProp(key) {
      if (key) {
        delete this.svProps[key];
      }
    },

    saHasProp(key) {
      return key in this.svProps;
    },

    saClear() {
      this.svProps = {};
    },
  },
});

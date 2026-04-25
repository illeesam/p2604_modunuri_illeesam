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
    sfSetProps(propsData) {
      if (propsData) {
        this.svProps = propsData;
      }
    },

    sfSetProp(key, value) {
      if (key) {
        this.svProps[key] = value;
      }
    },

    sfSetMultiProps(propsData) {
      if (propsData) {
        Object.assign(this.svProps, propsData);
      }
    },

    sfRemoveProp(key) {
      if (key) {
        delete this.svProps[key];
      }
    },

    sfHasProp(key) {
      return key in this.svProps;
    },

    sfClear() {
      this.svProps = {};
    },
  },
});

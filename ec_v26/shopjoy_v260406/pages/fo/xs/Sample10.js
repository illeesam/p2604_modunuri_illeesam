/* ShopJoy - Zample10 */
window.XsSample10 = {
  name: 'XsSample10',
  setup(props) {
    const { ref, reactive, computed, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const isAppReady = computed(() => {
      const codeStore = window.useFoCodeStore?.();
      return codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    return { uiState, codes };
  },
  template: `<div style="padding:40px;">pages/fo/xs/Sample10.js</div>`,
};

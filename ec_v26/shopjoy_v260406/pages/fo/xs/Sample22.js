/* ShopJoy - Zample22 */
window.XsSample22 = {
  name: 'XsSample22',
  setup(props) {
    const { ref, reactive, computed, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const isAppReady = computed(() => {
      const initStore = window.useFoAppInitStore?.();
      const codeStore = window.useFoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
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

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
    return { uiState, codes };
  },
  template: `<div style="padding:40px;">pages/fo/xs/Sample22.js</div>`,
};

/* ShopJoy - Zample22 */
window.XsSample22 = {
  name: 'XsSample22',
  setup(props) {
    const { ref, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = foUtil.useAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // -- return ---------------------------------------------------------------

    return { uiState, codes };
  },
  template: `<div style="padding:40px;">pages/fo/xs/Sample22.js</div>`,
};

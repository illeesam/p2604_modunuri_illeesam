/* ShopJoy - Zample03 */
window.XsSample03 = {
  name: 'XsSample03',
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes };
  },
  template: `
<div style="padding:40px;">pages/fo/xs/Sample03.js</div>
`,
};

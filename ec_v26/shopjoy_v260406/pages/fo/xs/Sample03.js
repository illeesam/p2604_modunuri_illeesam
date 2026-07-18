/* ShopJoy - Zample03 */
window.XsSample03 = {
  name: 'XsSample03',
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, watch, onMounted } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ XsSample03.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props && props.navigate && props.navigate('home');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ XsSample03.js : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, () => { uiState.isPageCodeLoad = true; });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) { uiState.isPageCodeLoad = true; } });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return { uiState, codes, handleBtnAction, handleSelectAction };
  },
  template: `
<fo-page bare>
  <div style="padding:40px;">
    pages/fo/xs/Sample03.js
  </div>
</fo-page>
`,
};

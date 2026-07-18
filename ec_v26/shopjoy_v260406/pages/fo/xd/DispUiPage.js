/* ShopJoy - DispUi 팝업 페이지 (window.open으로 열림)
 * 로직: components/disp/DispX01Ui.js 참조
 */
window.DispUiPage = {
  name: 'DispUiPage',
  components: {  DispX01Ui: window.DispX01Ui },
  setup() {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DispUiPage.js : handleBtnAction -> ', cmd, param);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DispUiPage.js : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, () => { uiState.isPageCodeLoad = true; });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) { uiState.isPageCodeLoad = true; } });

    /* -- URL 파라미터 파싱 -- */
    const qs = new URLSearchParams(location.search);
    const params = {
      areas:        (qs.get('areas') || '').split(',').filter(Boolean),
      date:         qs.get('date')         || '',
      time:         qs.get('time')         || '',
      status:       qs.get('status')       || '',
      condition:    qs.get('condition')    || '',
      authRequired: qs.get('authRequired') || '',
      authGrade:    qs.get('authGrade')    || '',
      siteId:       qs.get('siteId')       || '',
      memberId:     qs.get('memberId')     || '',
      viewOpts:     qs.get('viewOpts')     || '',
      isLoggedIn:   qs.get('isLoggedIn') === 'true' || (window.foAuth?.isLoggedIn ?? false),
      userGrade:    qs.get('userGrade')    || (window.foAuth?.userGrade ?? ''),
    };

    const dispDataset = window.dispDataset || { displays: [], codes: [] };

    /* -- UI 렌더링 옵션 -- */
    const dispOpt = {
      layout:     'auto',      // 'auto' | 'simple' | 'detailed'
      showHeader: true,        // 섹션 헤더 표시 여부
      showBadges: true,        // 정보 배지 표시 여부
    };

    const cfTotalPanels = computed(() => {
      const displays = dispDataset.displays || [];
      return params.areas.reduce((s, a) => s + displays.filter(p => p.area === a).length, 0);
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return { params, dispDataset, dispOpt, cfTotalPanels , uiState, codes, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<fo-page bare>
  <!-- ===== ■. 페이지 헤더 ================================================== -->
  <div style="background:linear-gradient(135deg,#6a1b9a,#4a148c);color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.2);">
    <div>
      <span style="font-size:16px;font-weight:700;">
        🖥 DispUi미리보기
      </span>
      <span style="font-size:11px;opacity:.7;margin-left:12px;">
        전달 파라미터 기준 렌더링
      </span>
    </div>
    <span style="font-size:13px;opacity:.8;">
      패널 {{ cfTotalPanels }}개
    </span>
  </div>
  <!-- ===== □. 페이지 헤더 ================================================== -->
  <!-- ===== ■. 본문: DispUi 컴포넌트 ========================================= -->
  <disp-x01-ui :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" />
</fo-page>
<!-- ===== □. 본문: DispUi 컴포넌트 ========================================= -->
`,
};

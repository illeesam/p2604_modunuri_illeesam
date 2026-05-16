/* ShopJoy - DispUi 03 (PRODUCT 영역)
 * 전시영역: PRODUCT_TOP, PRODUCT_BTM
 */
window.DispUi03 = {
  name: 'DispUi03',
  components: { DispX01Ui: window.DispX01Ui },
  setup() {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* fnLoadCodes */
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

    const dispDataset = window.dispDataset || { displays: [], codes: [] };
    const qs = new URLSearchParams(location.search);
    const params = {
      areas: ['PRODUCT_TOP', 'PRODUCT_BTM'],
      date:         qs.get('date')         || '',
      time:         qs.get('time')         || '',
      status:       qs.get('status')       || '',
      condition:    qs.get('condition')    || '',
      authRequired: qs.get('authRequired') || '',
      authGrade:    qs.get('authGrade')    || '',
      siteId:       qs.get('siteId')       || '',
      memberId:     qs.get('memberId')     || '',
      viewOpts:     qs.get('viewOpts')     || 'content,struct,source',
      isLoggedIn:   qs.get('isLoggedIn') === 'true' || (window.foAuth?.isLoggedIn ?? false),
      userGrade:    qs.get('userGrade')    || (window.foAuth?.userGrade ?? ''),
    };

    const dispOpt = {
      layout:     'auto',
      showHeader: true,
      showBadges: true,
    };

    const cfTotalPanels = computed(() => {
      const displays = dispDataset.displays || [];
      return params.areas.reduce((s, a) => s + displays.filter(p => p.area === a).length, 0);
    });

    // -- return ---------------------------------------------------------------

    return { params, dispDataset, dispOpt, cfTotalPanels , uiState, codes };
  },
  template: /* html */`
<div>
  <!-- -- 페이지 헤더 --------------------------------------------------------- -->
  <div style="background:linear-gradient(135deg,#7b1fa2,#6a1b9a);color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.2);">
    <div>
      <span style="font-size:16px;font-weight:700;">🛍️ DispUi03 - PRODUCT 영역</span>
      <span style="font-size:11px;opacity:.7;margin-left:12px;">PRODUCT_TOP, PRODUCT_BTM</span>
    </div>
    <span style="font-size:13px;opacity:.8;">패널 {{ cfTotalPanels }}개</span>
  </div>

  <!-- -- 본문: DispUi 컴포넌트 ------------------------------------------------ -->
  <disp-x01-ui :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" />
</div>
`,
};

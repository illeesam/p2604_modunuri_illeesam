/* ShopJoy - DispUi 팝업 페이지 (window.open으로 열림)
 * 로직: components/disp/DispX01Ui.js 참조
 */
window.DispUiPage = {
  name: 'DispUiPage',
  components: {  DispX01Ui: window.DispX01Ui },
  setup() {
    const { computed } = Vue;

    /* ── URL 파라미터 파싱 ── */
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
      isLoggedIn:   qs.get('isLoggedIn') === 'true' || (window.frontAuth?.isLoggedIn ?? false),
      userGrade:    qs.get('userGrade')    || (window.frontAuth?.userGrade ?? ''),
    };

    const dispDataset = window.adminData || window.dispDataset || { displays: [], codes: [] };

    /* ── UI 렌더링 옵션 ── */
    const dispOpt = {
      layout:     'auto',      // 'auto' | 'simple' | 'detailed'
      showHeader: true,        // 섹션 헤더 표시 여부
      showBadges: true,        // 정보 배지 표시 여부
    };

    const totalPanels = computed(() => {
      const displays = dispDataset.displays || [];
      return params.areas.reduce((s, a) => s + displays.filter(p => p.area === a).length, 0);
    });

    return { params, dispDataset, dispOpt, totalPanels };
  },
  template: /* html */`
<div>
  <!-- 페이지 헤더 -->
  <div style="background:linear-gradient(135deg,#6a1b9a,#4a148c);color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.2);">
    <div>
      <span style="font-size:16px;font-weight:700;">🖥 DispUi미리보기</span>
      <span style="font-size:11px;opacity:.7;margin-left:12px;">전달 파라미터 기준 렌더링</span>
    </div>
    <span style="font-size:13px;opacity:.8;">패널 {{ totalPanels }}개</span>
  </div>

  <!-- 본문: DispUi 컴포넌트 -->
  <disp-x01-ui :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" />
</div>
`,
};

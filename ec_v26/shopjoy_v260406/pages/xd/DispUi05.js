/* ShopJoy - DispUi 04 (MY_PAGE, FOOTER 영역)
 * 전시영역: MY_PAGE, FOOTER
 */
window.DispUi05 = {
  name: 'DispUi05',
  components: { DispX01Ui: window.DispX01Ui },
  setup() {
    const { computed } = Vue;

    const dispDataset = window.adminData || window.dispDataset || { displays: [], codes: [] };
    const qs = new URLSearchParams(location.search);
    const params = {
      areas: ['TEMP_AREA_01', 'TEMP_AREA_02'],
      date:         qs.get('date')         || '',
      time:         qs.get('time')         || '',
      status:       qs.get('status')       || '',
      condition:    qs.get('condition')    || '',
      authRequired: qs.get('authRequired') || '',
      authGrade:    qs.get('authGrade')    || '',
      siteId:       qs.get('siteId')       || '',
      memberId:     qs.get('memberId')     || '',
      viewOpts:     qs.get('viewOpts')     || 'content,struct,source',
      isLoggedIn:   qs.get('isLoggedIn') === 'true' || (window.frontAuth?.isLoggedIn ?? false),
      userGrade:    qs.get('userGrade')    || (window.frontAuth?.userGrade ?? ''),
    };

    const dispOpt = {
      layout:     'auto',
      showHeader: true,
      showBadges: true,
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
  <div style="background:linear-gradient(135deg,#0097a7,#00838f);color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,0.2);">
    <div>
      <span style="font-size:16px;font-weight:700;">👤 DispUi04 - MY_PAGE / FOOTER</span>
      <span style="font-size:11px;opacity:.7;margin-left:12px;">MY_PAGE, FOOTER</span>
    </div>
    <span style="font-size:13px;opacity:.8;">패널 {{ totalPanels }}개</span>
  </div>

  <!-- 본문: DispUi 컴포넌트 -->
  <disp-x01-ui :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" />
</div>
`,
};

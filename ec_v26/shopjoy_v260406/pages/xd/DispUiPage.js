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
    };

    const adminData = window.adminData || { displays: [], codes: [] };

    const totalPanels = computed(() => {
      const displays = adminData.displays || [];
      return params.areas.reduce((s, a) => s + displays.filter(p => p.area === a).length, 0);
    });

    return { params, adminData, totalPanels };
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

  <!-- 파라미터 요약 바 -->
  <div style="background:#fff;border-bottom:1px solid #e8e0f8;padding:10px 24px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
    <span style="font-size:11px;color:#888;margin-right:4px;">전달 파라미터:</span>
    <span v-if="params.areas.length" style="font-size:11px;background:#ede7f6;color:#4a148c;border-radius:8px;padding:2px 10px;">영역: {{ params.areas.join(', ') }}</span>
    <span v-if="params.date" style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:8px;padding:2px 10px;">📅 {{ params.date }} {{ params.time }}</span>
    <span v-if="params.status" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 10px;">상태: {{ params.status }}</span>
    <span v-if="params.condition" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 10px;">{{ params.condition }}</span>
    <span v-if="params.authRequired" style="font-size:11px;background:#fff3e0;color:#e65100;border-radius:8px;padding:2px 10px;">인증: {{ params.authRequired==='Y'?'필요':'불필요' }}</span>
    <span v-if="params.authGrade" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 10px;">등급: {{ params.authGrade }}↑</span>
    <span v-if="params.siteId" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 10px;">siteId: {{ params.siteId }}</span>
    <span v-if="params.memberId" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 10px;">memberId: {{ params.memberId }}</span>
    <span v-if="params.viewOpts" style="font-size:11px;background:#f0f4ff;color:#4f46e5;border-radius:8px;padding:2px 10px;">보기: {{ params.viewOpts }}</span>
  </div>

  <!-- 본문: DispUi 컴포넌트 -->
  <disp-x01-ui :params="params" :admin-data="adminData" />
</div>
`,
};

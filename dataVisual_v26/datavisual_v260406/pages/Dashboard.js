/* DataVisual — Dashboard Page */
window.DvPages = window.DvPages || {};
window.DvPages.Dashboard = {
  name: 'Dashboard',
  props: ['navigate'],
  template: /* html */ `
<div class="page-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 class="section-title">📊 대시보드</h1>
      <p class="section-subtitle">실시간 비즈니스 지표 한눈에 보기</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <select class="form-input" v-model="period" style="width:120px;">
        <option value="7d">최근 7일</option>
        <option value="30d">최근 30일</option>
        <option value="90d">최근 90일</option>
        <option value="1y">올해</option>
      </select>
      <button class="btn-outline btn-sm" @click="navigate('layout')">🖱️ 레이아웃 편집</button>
      <button class="btn-outline btn-sm" @click="navigate('manager')">🧩 위젯 관리</button>
    </div>
  </div>
  <dashboard-panel :navigate="navigate" />
</div>
  `,
  setup() {
    const { ref } = Vue;
    const period = ref('30d');
    return { period };
  }
};

/* DataVisual — Gallery Page (차트 갤러리) */
window.DvPages = window.DvPages || {};
window.DvPages.Gallery = {
  name: 'Gallery',
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:24px;">
    <h1 class="section-title">📈 차트 갤러리</h1>
    <p class="section-subtitle">지원하는 모든 차트 유형 한눈에 보기</p>
  </div>

  <!-- Filter -->
  <div class="tab-bar">
    <button v-for="cat in cats" :key="cat" class="tab-btn" :class="{active:activeCat===cat}" @click="activeCat=cat">{{ cat }}</button>
  </div>

  <!-- KPI -->
  <div v-if="activeCat==='전체'||activeCat==='통계'" class="panel-section">
    <div class="panel-title">📊 통계 카드</div>
    <div class="grid-4">
      <kpi-widget title="총 방문자"   value="128,450" trend="+12.4%" dir="up"   icon="👥" color="blue"   />
      <kpi-widget title="전환율"      value="4.8%"    trend="+0.6%"  dir="up"   icon="🎯" color="green"  />
      <kpi-widget title="매출"        value="₩84.2M"  trend="-2.1%"  dir="down" icon="💰" color="orange" />
      <kpi-widget title="활성 사용자" value="3,241"   trend="+8.7%"  dir="up"   icon="🔥" color="purple" />
    </div>
  </div>

  <!-- 기본 차트 -->
  <div v-if="activeCat==='전체'||activeCat==='차트'" class="panel-section">
    <div class="panel-title">📈 기본 차트</div>
    <div class="grid-3">
      <line-chart-widget    title="라인 차트"     :height="200" />
      <bar-chart-widget     title="바 차트"       :height="200" />
      <area-chart-widget    title="에어리어 차트" :height="200" />
    </div>
  </div>

  <!-- 원형/분포 차트 -->
  <div v-if="activeCat==='전체'||activeCat==='차트'" class="panel-section">
    <div class="panel-title">🥧 원형 / 분포 차트</div>
    <div class="grid-3">
      <pie-chart-widget   title="파이 차트"  :height="220" :donut="false" />
      <pie-chart-widget   title="도넛 차트"  :height="220" :donut="true"  />
      <radar-chart-widget title="레이더 차트":height="220" />
    </div>
  </div>

  <!-- 고급 차트 -->
  <div v-if="activeCat==='전체'||activeCat==='차트'" class="panel-section">
    <div class="panel-title">✨ 고급 차트</div>
    <div class="grid-3">
      <scatter-chart-widget title="산점도 차트"    :height="220" />
      <bubble-chart-widget  title="버블 차트"      :height="220" />
      <stacked-bar-widget   title="스택 바 차트"   :height="220" />
    </div>
    <div class="grid-3" style="margin-top:16px;">
      <stacked-bar-widget   title="수평 바 차트"   :height="220" :horizontal="true" />
      <heatmap-widget       title="히트맵 (주간)"  :rows="7" :cols="12" />
      <div style="display:flex;flex-direction:column;gap:12px;">
        <gauge-widget title="게이지 A" label="%" :height="180" />
      </div>
    </div>
  </div>

  <!-- 데이터 -->
  <div v-if="activeCat==='전체'||activeCat==='데이터'" class="panel-section">
    <div class="panel-title">📋 데이터 보기</div>
    <data-table-widget title="데이터 테이블" :rows="12" />
  </div>

  <!-- 실시간 -->
  <div v-if="activeCat==='전체'||activeCat==='실시간'" class="panel-section">
    <div class="panel-title">⚡ 실시간 시계열</div>
    <realtime-scatter-widget title="실시간 시계열 산점도 (1초 간격)" :height="280" :max-pts="90" />
  </div>
</div>
  `,
  setup() {
    const { ref } = Vue;
    const cats = ['전체', '통계', '차트', '데이터', '실시간'];
    const activeCat = ref('전체');
    return { cats, activeCat };
  }
};

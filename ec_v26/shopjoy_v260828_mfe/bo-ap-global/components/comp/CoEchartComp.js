/* CoEchartComp.js — ECharts 범용 래퍼 컴포넌트
 * 의존: assets/cdn/pkg/echarts/5.6.0/echarts.min.js (window.echarts)
 * 사용: <co-echart :option="optionObj" height="300px" theme="dark" />
 */
window.CoEchartComp = {
  name: 'CoEchartComp',
  props: {
    option:   { type: Object,  default: () => ({}) },         // ECharts option 객체
    height:   { type: String,  default: '280px' },            // 컨테이너 높이
    width:    { type: String,  default: '100%' },             // 컨테이너 폭
    theme:    { type: String,  default: null },               // 'dark' | null
    loading:  { type: Boolean, default: false },              // 로딩 오버레이
    autoResize: { type: Boolean, default: true },             // ResizeObserver 자동 리사이즈
    notMerge: { type: Boolean, default: false },              // setOption notMerge 옵션
    group:    { type: String,  default: null },               // 차트 그룹 연동 (tooltip sync)
  },
  emits: ['click', 'brush-selected', 'datazoom', 'ready'],

  template: `
<div :style="{ width: width, height: height, position: 'relative' }" ref="elRef">
  <div v-if="loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.7);z-index:10;border-radius:6px;">
    <span style="font-size:12px;color:#999;">로딩 중...</span>
  </div>
</div>`,

  setup(props, { emit }) {
    const { ref, watch, onMounted, onUnmounted } = Vue;

    const elRef   = ref(null);
    let chart     = null;
    let resizeObs = null;

    /* 차트 초기화 */
    const initChart = () => {
      if (!window.echarts) { console.error('[CoEchartComp] echarts not loaded'); return; }
      if (!elRef.value)    return;
      if (chart) { chart.dispose(); chart = null; }

      chart = window.echarts.init(elRef.value, props.theme || null, { renderer: 'canvas' });

      if (props.group) chart.group = props.group;

      /* 이벤트 바인딩 */
      chart.on('click',          (p) => emit('click', p));
      chart.on('brushSelected',  (p) => emit('brush-selected', p));
      chart.on('dataZoom',       (p) => emit('datazoom', p));

      /* 초기 option 적용 */
      if (props.option && Object.keys(props.option).length) {
        chart.setOption(props.option, { notMerge: props.notMerge });
      }

      emit('ready', chart);
    };

    /* ResizeObserver 등록 */
    const attachResize = () => {
      if (!props.autoResize || !elRef.value || !window.ResizeObserver) return;
      resizeObs = new ResizeObserver(() => { chart?.resize(); });
      resizeObs.observe(elRef.value);
    };

    /* option prop 변경 시 setOption */
    watch(() => props.option, (val) => {
      if (!chart || !val) return;
      chart.setOption(val, { notMerge: props.notMerge });
    }, { deep: true });

    /* loading prop 변경 시 showLoading / hideLoading */
    watch(() => props.loading, (v) => {
      if (!chart) return;
      v ? chart.showLoading({ text: '로딩 중...', fontSize: 12, color: '#e8587a', textColor: '#666' })
        : chart.hideLoading();
    });

    onMounted(() => {
      initChart();
      attachResize();
    });

    onUnmounted(() => {
      resizeObs?.disconnect();
      chart?.dispose();
      chart = null;
    });

    /* 외부에서 chart 인스턴스 직접 접근용 */
    const getInstance = () => chart;

    return { elRef, getInstance };
  },
};

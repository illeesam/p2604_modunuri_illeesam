/* ShopJoy - 전시 위젯 렌더러 컴포넌트 */
window.DispWidget = {
  name: 'DispWidget',
  props: {
    widget: { type: Object, required: true },
    isLoggedIn: { type: Boolean, default: false },
    userGrade: { type: String, default: '' },
  },
  emits: ['click-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* 노출 여부 판단 */
    const visible = computed(() => {
      const w = props.widget;
      if (!w || w.status !== '활성') return false;
      const cond = w.condition;
      if (cond === '항상 표시') return true;
      if (cond === '로그인 필요') return props.isLoggedIn;
      if (cond === '비로그인') return !props.isLoggedIn;
      if (cond === '로그인+VIP') return props.isLoggedIn && props.userGrade === 'VIP';
      if (cond === '로그인+우수') return props.isLoggedIn && (props.userGrade === '우수' || props.userGrade === 'VIP');
      return true;
    });

    const handleClick = () => {
      const w = props.widget;
      if (!w.clickAction || w.clickAction === 'none') return;
      emit('click-action', { action: w.clickAction, target: w.clickTarget, widget: w });
    };

    /* 차트 색상 팔레트 */
    const chartColors = ['#e8587a', '#ff8c69', '#9c5fa3', '#1677ff', '#52c41a', '#fa8c16', '#36cfc9'];

    const chartBars = computed(() => {
      const w = props.widget;
      if (!w.chartValues) return [];
      const values = w.chartValues.split(',').map(v => Number(v.trim()) || 0);
      const labels = w.chartLabels ? w.chartLabels.split(',').map(l => l.trim()) : values.map((_, i) => i + 1);
      const max = Math.max(...values, 1);
      return values.map((v, i) => ({ value: v, label: labels[i] || '', pct: Math.round((v / max) * 100), color: chartColors[i % chartColors.length] }));
    });

    return { visible, handleClick, chartBars, chartColors };
  },
  template: /* html */`
<div v-if="visible" class="disp-widget" :style="{ cursor: widget.clickAction !== 'none' ? 'pointer' : 'default' }" @click="handleClick">

  <!-- 이미지 배너 -->
  <template v-if="widget.widgetType==='image_banner'">
    <div style="border-radius:8px;overflow:hidden;background:#f0f0f0;">
      <img v-if="widget.imageUrl" :src="widget.imageUrl" :alt="widget.altText||'배너'" style="width:100%;display:block;max-height:200px;object-fit:cover;" />
      <div v-else style="height:120px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:14px;">이미지 배너 ({{ widget.name }})</div>
    </div>
  </template>

  <!-- 상품 슬라이더 -->
  <template v-else-if="widget.widgetType==='product_slider'">
    <div style="background:#fff;border-radius:8px;padding:14px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;margin-bottom:10px;">{{ widget.name }}</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;">
        <div v-for="n in 4" :key="n" style="flex-shrink:0;width:100px;text-align:center;">
          <div style="height:80px;background:#f5f5f5;border-radius:6px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-size:20px;">👗</div>
          <div style="font-size:11px;color:#555;">상품 {{ n }}</div>
        </div>
      </div>
    </div>
  </template>

  <!-- 차트 (Bar / Line / Pie 간략 렌더) -->
  <template v-else-if="widget.widgetType.startsWith('chart_')">
    <div style="background:#fff;border-radius:8px;padding:14px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">{{ widget.chartTitle || widget.name }}</div>
      <div v-if="chartBars.length" style="display:flex;align-items:flex-end;gap:6px;height:80px;">
        <div v-for="(bar, i) in chartBars" :key="i" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <div :style="{ height: bar.pct+'%', background: bar.color, borderRadius:'4px 4px 0 0', width:'100%', minHeight:'4px', transition:'height .3s' }"></div>
          <div style="font-size:10px;color:#888;">{{ bar.label }}</div>
        </div>
      </div>
      <div v-else style="height:60px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">차트 데이터 없음</div>
    </div>
  </template>

  <!-- 텍스트 배너 -->
  <template v-else-if="widget.widgetType==='text_banner'">
    <div :style="{ background: widget.bgColor||'#f5f5f5', color: widget.textColor||'#222', borderRadius:'8px', padding:'16px', fontSize:'14px' }">
      <span v-if="widget.textContent" v-html="widget.textContent"></span>
      <span v-else>텍스트 배너: {{ widget.name }}</span>
    </div>
  </template>

  <!-- 정보 카드 -->
  <template v-else-if="widget.widgetType==='info_card'">
    <div style="background:#fff;border-radius:8px;padding:16px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">{{ widget.infoTitle || widget.name }}</div>
      <div style="font-size:13px;color:#555;white-space:pre-line;">{{ widget.infoBody || '내용 없음' }}</div>
    </div>
  </template>

  <!-- 팝업 (축소 표시) -->
  <template v-else-if="widget.widgetType==='popup'">
    <div style="background:#fff;border-radius:8px;padding:14px;border:2px dashed #e8587a;text-align:center;">
      <div style="font-size:12px;color:#e8587a;font-weight:600;margin-bottom:6px;">팝업 위젯</div>
      <div style="font-size:13px;color:#555;">{{ widget.name }}</div>
    </div>
  </template>

  <!-- 기타 -->
  <template v-else>
    <div style="background:#f5f5f5;border-radius:8px;padding:12px;color:#888;font-size:13px;text-align:center;">{{ widget.name }} ({{ widget.widgetType }})</div>
  </template>
</div>
`
};

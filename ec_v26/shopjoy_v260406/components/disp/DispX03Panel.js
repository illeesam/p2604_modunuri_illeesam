/* ShopJoy - 전시 패널 컴포넌트 (특정 영역의 모든 위젯을 렌더링) */
window.DispX03Panel = {
  name: 'DispX03Panel',
  props: {
    area: { type: String, required: true },
    widgets: { type: Array, default: () => [] },
    isLoggedIn: { type: Boolean, default: false },
    userGrade: { type: String, default: '' },
    layout: { type: String, default: 'vertical' }, /* vertical | horizontal | grid */
    titleYn: { type: String, default: 'N' },   /* 패널 타이틀 표시 여부 */
    title:   { type: String, default: '' },    /* 패널 타이틀 텍스트 */
  },
  emits: ['widget-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    const areaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    const onWidgetAction = (payload) => {
      emit('widget-action', payload);
    };

    const layoutStyle = computed(() => {
      if (props.layout === 'horizontal') return 'display:flex;gap:12px;overflow-x:auto;';
      if (props.layout === 'grid') return 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;';
      return 'display:flex;flex-direction:column;gap:12px;';
    });

    return { areaWidgets, onWidgetAction, layoutStyle };
  },
  template: /* html */`
<div class="disp-panel" :data-area="area">
  <!-- 패널 타이틀 -->
  <div v-if="titleYn==='Y' && title"
    style="padding:10px 16px 6px;font-size:15px;font-weight:700;color:#222;border-bottom:2px solid #222;margin-bottom:12px;">
    {{ title }}
  </div>
  <div :style="layoutStyle">
  <disp-x04-widget
    v-for="w in areaWidgets"
    :key="w.dispId"
    :widget="w"
    :is-logged-in="isLoggedIn"
    :user-grade="userGrade"
    @click-action="onWidgetAction"
  />
  <div v-if="areaWidgets.length===0" style="color:#ccc;font-size:12px;padding:8px;text-align:center;">
    [{{ area }}] 활성 위젯 없음
  </div>
  </div>
</div>
`
};

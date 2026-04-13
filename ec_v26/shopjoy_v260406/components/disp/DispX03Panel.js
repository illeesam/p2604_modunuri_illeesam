/* ShopJoy - 전시 패널 컴포넌트
 * 단일 패널 데이터를 받아 rows(위젯 목록)를 DispX04Widget으로 렌더링
 */
window.DispX03Panel = {
  name: 'DispX03Panel',
  props: {
    panel:      { type: Object,  required: true },   // 패널 객체 (rows[] 포함)
    isLoggedIn: { type: Boolean, default: false },
    userGrade:  { type: String,  default: '' },
    layout:     { type: String,  default: 'vertical' }, // vertical | horizontal | grid
    showHeader: { type: Boolean, default: false },       // 패널 헤더 표시 여부
  },
  emits: ['widget-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* panel.rows의 각 위젯에 패널 레벨 속성 병합 */
    const mergedWidget = (w) => ({
      ...w,
      status:       props.panel.status,
      condition:    w.condition || props.panel.condition || '항상 표시',
      authRequired: props.panel.authRequired || false,
      authGrade:    props.panel.authGrade    || '',
    });

    const layoutStyle = computed(() => {
      if (props.layout === 'horizontal') return 'display:flex;gap:12px;overflow-x:auto;';
      if (props.layout === 'grid')       return 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;';
      return 'display:flex;flex-direction:column;gap:12px;';
    });

    const onWidgetAction = (payload) => emit('widget-action', payload);

    return { mergedWidget, layoutStyle, onWidgetAction };
  },
  template: /* html */`
<div class="disp-panel" :data-area="panel.area">

  <!-- 패널 헤더 (showHeader=true 일 때) -->
  <div v-if="showHeader"
    style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:#f8f8f8;border-bottom:1px solid #efefef;">
    <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;border-radius:3px;padding:0 5px;line-height:16px;flex-shrink:0;">
      DispX03Panel #{{ String(panel.dispId).padStart(4,'0') }}
    </span>
    <span style="font-size:13px;font-weight:700;color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ panel.name }}</span>
    <span style="font-size:10px;padding:1px 7px;border-radius:5px;flex-shrink:0;"
      :style="panel.status==='활성'?'background:#e8f5e9;color:#2e7d32;':'background:#f5f5f5;color:#999;'">{{ panel.status }}</span>
    <span v-if="panel.condition && panel.condition!=='항상 표시'"
      style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:5px;padding:1px 6px;flex-shrink:0;">{{ panel.condition }}</span>
  </div>

  <!-- 패널 타이틀 -->
  <div v-if="panel.titleYn==='Y' && panel.title"
    style="padding:10px 16px 6px;font-size:15px;font-weight:700;color:#222;border-bottom:2px solid #222;margin-bottom:12px;">
    {{ panel.title }}
  </div>

  <!-- 위젯 목록 -->
  <div :style="layoutStyle">
    <disp-x04-widget
      v-for="(w, wi) in (panel.rows || [])"
      :key="wi"
      :widget="mergedWidget(w)"
      :is-logged-in="isLoggedIn"
      :user-grade="userGrade"
      @click-action="onWidgetAction"
    />
    <div v-if="!(panel.rows && panel.rows.length)"
      style="color:#ccc;font-size:12px;padding:8px;text-align:center;">
      [{{ panel.area }}] 위젯 없음
    </div>
  </div>

</div>
`,
};

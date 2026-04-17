/* ShopJoy - 전시 패널 컴포넌트
 * 단일 패널 데이터를 받아 rows(위젯 목록)를 DispX04Widget으로 렌더링
 */
window.DispX03Panel = {
  name: 'DispX03Panel',
  props: {
    params:      { type: Object, required: true },
    dispDataset: { type: Object, default: () => ({ displays: [], codes: [] }) },
    dispOpt:     { type: Object, default: () => ({ layout: 'vertical', showBadges: true }) },
    panelItem:   { type: Object, required: true },     // 패널 객체 (rows[] 포함)
    showHeader:  { type: Boolean, default: false },    // 패널 헤더 표시 여부
  },
  emits: ['widget-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* panelItem.rows의 각 위젯에 패널 레벨 속성 병합 */
    const mergedWidget = (w) => ({
      ...w,
      status:       props.panelItem.status,
      condition:    w.condition || props.panelItem.condition || '항상 표시',
      authRequired: props.panelItem.authRequired || false,
      authGrade:    props.panelItem.authGrade    || '',
      // ✓ 필터링 관련 정보 병합 (패널-아이템 레벨)
      dispYn:       w.dispYn !== undefined ? w.dispYn : 'Y',  // widget item의 dispYn 우선
      useYn:        w.useYn !== undefined ? w.useYn : 'Y',    // widget 마스터의 useYn 우선
      dispStartDate: w.dispStartDate || '',
      dispStartTime: w.dispStartTime || '',
      dispEndDate:   w.dispEndDate || '',
      dispEndTime:   w.dispEndTime || '',
      useStartDate:  w.useStartDate || '',
      useEndDate:    w.useEndDate || '',
      dispEnv:       w.dispEnv || '^PROD^',
    });

    const layoutStyle = computed(() => {
      const layout = props.dispOpt?.layout || 'vertical';
      if (layout === 'horizontal') return 'display:flex;gap:12px;overflow-x:auto;';
      if (layout === 'grid')       return 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;';
      return 'display:flex;flex-direction:column;gap:12px;';
    });

    const onWidgetAction = (payload) => emit('widget-action', payload);

    return { mergedWidget, layoutStyle, onWidgetAction };
  },
  template: /* html */`
<div class="disp-panel" :data-area="panelItem.area">

  <!-- 패널 헤더 (showHeader=true 일 때) -->
  <div v-if="showHeader"
    style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:#f8f8f8;border-bottom:1px solid #efefef;">
    <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;border-radius:3px;padding:0 5px;line-height:16px;flex-shrink:0;">
      DispX03Panel #{{ String(panelItem.dispId).padStart(4,'0') }}
    </span>
    <span style="font-size:13px;font-weight:700;color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ panelItem.name }}</span>
    <span style="font-size:10px;padding:1px 7px;border-radius:5px;flex-shrink:0;"
      :style="panelItem.status==='활성'?'background:#e8f5e9;color:#2e7d32;':'background:#f5f5f5;color:#999;'">{{ panelItem.status }}</span>
    <span v-if="panelItem.condition && panelItem.condition!=='항상 표시'"
      style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:5px;padding:1px 6px;flex-shrink:0;">{{ panelItem.condition }}</span>
  </div>

  <!-- 패널 타이틀 -->
  <div v-if="panelItem.titleYn==='Y' && panelItem.title"
    style="padding:10px 16px 6px;font-size:15px;font-weight:700;color:#222;border-bottom:2px solid #222;margin-bottom:12px;">
    {{ panelItem.title }}
  </div>

  <!-- 위젯 목록 -->
  <div :style="layoutStyle">
    <disp-x04-widget
      v-for="(w, wi) in (panelItem.rows || [])"
      :key="wi"
      :params="params"
      :disp-dataset="dispDataset"
      :disp-opt="dispOpt"
      :widget-item="mergedWidget(w)"
      @click-action="onWidgetAction"
    />
    <div v-if="!(panelItem.rows && panelItem.rows.length)"
      style="color:#ccc;font-size:12px;padding:8px;text-align:center;">
      위젯 없음
    </div>
  </div>

</div>
`,
};

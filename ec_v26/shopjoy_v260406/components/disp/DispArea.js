/* ShopJoy - 전시 화면영역 컴포넌트
   mode="card"   : 패널 카드 목록 (패널 메타 정보)
   mode="expand" : 모든 패널 펼침 → 위젯 렌더링 (DispWidget 사용)
*/
window.DispArea = {
  name: 'DispArea',
  props: {
    area:       { type: String, required: true },
    areaLabel:  { type: String, default: '' },
    panels:     { type: Array,  default: () => [] },   // 이미 area 필터된 패널 목록
    mode:       { type: String, default: 'card' },     // 'card' | 'expand'
    showDesc:   { type: Boolean, default: true },      // areaLabel 표시 여부
    isLoggedIn: { type: Boolean, default: false },
    userGrade:  { type: String,  default: '' },
  },
  setup(props) {
    const { computed } = Vue;

    /* 위젯 유형 레이블 */
    const WIDGET_TYPE_LABELS = {
      'image_banner':'이미지 배너', 'product_slider':'상품 슬라이더', 'product':'상품',
      'cond_product':'조건상품',   'chart_bar':'차트(Bar)',          'chart_line':'차트(Line)',
      'chart_pie':'차트(Pie)',     'text_banner':'텍스트 배너',      'info_card':'정보카드',
      'popup':'팝업',              'file':'파일',                    'file_list':'파일목록',
      'coupon':'쿠폰',             'html_editor':'HTML 에디터',      'event_banner':'이벤트',
      'cache_banner':'캐쉬',       'widget_embed':'위젯',
    };

    /* 위젯 유형 아이콘 */
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',
    };

    const wLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';
    const wIcon  = (t) => WIDGET_ICONS[t] || '▪';

    /* expand 모드: panel + row 병합 → DispWidget에 전달할 위젯 객체 생성 */
    const mergeWidget = (panel, row) => ({
      ...row,
      dispId:      panel.dispId,
      name:        panel.name,
      area:        panel.area,
      status:      panel.status,
      condition:   panel.condition  || '항상 표시',
      authRequired:panel.authRequired || false,
      authGrade:   panel.authGrade   || '',
    });

    /* 패널별 병합 위젯 목록 (rows가 없으면 panel 자체를 단일 위젯으로) */
    const panelWidgets = computed(() =>
      props.panels.map(p => ({
        panel: p,
        widgets: p.rows && p.rows.length
          ? p.rows.map(r => mergeWidget(p, r))
          : [mergeWidget(p, p)],
      }))
    );

    /* 패널의 위젯 타입 목록 (카드 아이콘용) */
    const panelWidgetTypes = (p) => {
      if (p.rows && p.rows.length) return p.rows.map(r => r.widgetType);
      return p.widgetType ? [p.widgetType] : [];
    };

    /* 카드 모드: 기간 텍스트 */
    const periodText = (p) => {
      if (!p.dispStartDate && !p.dispEndDate) return '기간 없음';
      return `${p.dispStartDate || '∞'} ~ ${p.dispEndDate || '∞'}`;
    };

    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';
    const padId = (id) => String(id || 0).padStart(4, '0');

    return { wLabel, wIcon, padId, panelWidgets, panelWidgetTypes, periodText, statusCls };
  },
  template: /* html */`
<div class="disp-area" style="margin-bottom:28px;">

  <!-- 영역 헤더 -->
  <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;border-radius:8px 8px 0 0;">
    <span v-if="showDesc" style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 5px;letter-spacing:.3px;flex-shrink:0;">DispArea</span>
    <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:4px;letter-spacing:.5px;">{{ area }}</code>
    <span v-if="showDesc" style="font-size:14px;font-weight:700;">{{ areaLabel || area }}</span>
    <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ panels.length }}개</span>
  </div>

  <!-- ── 카드 모드 ── -->
  <div v-if="mode==='card'"
    style="display:flex;flex-wrap:wrap;gap:12px;padding:18px 14px 14px;background:#f8f8f8;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;min-height:80px;">
    <div v-if="panels.length===0" style="color:#ccc;font-size:13px;padding:16px;width:100%;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>
    <div v-for="p in panels" :key="p.dispId"
      style="position:relative;background:#fff;border:1px solid #e4e4e4;border-radius:10px;padding:14px 16px;width:230px;min-width:190px;box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:6px;margin-top:6px;">

      <!-- 절대 배지: 좌=DispPanel / 우=DispWidget (카드 상단 경계선 위) -->
      <span v-if="showDesc" style="position:absolute;top:-9px;left:8px;font-size:7px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;line-height:16px;white-space:nowrap;">DispPanel #{{ padId(p.dispId) }}</span>
      <span v-if="showDesc" style="position:absolute;top:-9px;right:8px;font-size:7px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 4px;line-height:16px;white-space:nowrap;">DispWidget #{{ padId(p.dispId) }}</span>

      <!-- 패널ID + 이름 (좌) / 위젯 아이콘 (우) -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
            <span style="font-size:10px;background:#eeeeee;color:#666;border-radius:4px;padding:1px 5px;flex-shrink:0;">#{{ p.dispId }}</span>
            <span class="badge" :class="statusCls(p.status)" style="font-size:10px;flex-shrink:0;">{{ p.status }}</span>
          </div>
          <span style="font-size:13px;font-weight:700;color:#222;line-height:1.35;display:block;word-break:break-all;">{{ p.name }}</span>
        </div>
        <!-- 위젯 유형 아이콘 (우측) -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
          <span v-for="(wt, wi) in panelWidgetTypes(p)" :key="wi"
            :title="wLabel(wt)"
            style="font-size:13px;background:#f5f5f5;border:1px solid #ebebeb;border-radius:6px;padding:2px 5px;cursor:default;display:flex;align-items:center;gap:3px;white-space:nowrap;">
            <span>{{ wIcon(wt) }}</span>
            <span style="font-size:9px;color:#888;">{{ wLabel(wt) }}</span>
          </span>
          <span v-if="panelWidgetTypes(p).length===0" style="font-size:11px;color:#ccc;">-</span>
        </div>
      </div>

      <!-- 노출조건 / 인증 배지 -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;">
        <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">{{ p.condition || '항상 표시' }}</span>
        <span v-if="p.authRequired" style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">인증</span>
        <span v-if="p.authRequired && p.authGrade" style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;">{{ p.authGrade }}↑</span>
      </div>

      <!-- 전시 기간 -->
      <div style="font-size:10px;color:#aaa;">📅 {{ periodText(p) }}</div>
    </div>
  </div>

  <!-- ── 펼침 모드 ── -->
  <div v-else-if="mode==='expand'"
    style="padding:18px 14px 14px;background:#f8f8f8;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;display:flex;flex-direction:column;gap:18px;">
    <div v-if="panelWidgets.length===0" style="color:#ccc;font-size:13px;padding:16px;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>
    <div v-for="pw in panelWidgets" :key="pw.panel.dispId"
      style="position:relative;background:#fff;border:1px solid #e4e4e4;border-radius:8px;margin-top:6px;">
      <!-- 절대 배지: DispPanel (패널 박스 상단 경계선 위 좌측) -->
      <span v-if="showDesc" style="position:absolute;top:-9px;left:8px;font-size:7px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;line-height:16px;white-space:nowrap;">DispPanel #{{ padId(pw.panel.dispId) }}</span>

      <!-- 패널 헤더: #id + 이름 / 상태·조건 배지 -->
      <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:#f0f0f0;border-bottom:1px solid #e4e4e4;border-radius:8px 8px 0 0;">
        <span style="font-size:10px;background:#e0e0e0;color:#555;border-radius:4px;padding:1px 6px;flex-shrink:0;">#{{ pw.panel.dispId }}</span>
        <span style="font-size:12px;font-weight:700;color:#333;flex:1;">{{ pw.panel.name }}</span>
        <span class="badge" :class="statusCls(pw.panel.status)" style="font-size:10px;">{{ pw.panel.status }}</span>
        <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">{{ pw.panel.condition || '항상 표시' }}</span>
        <span v-if="pw.panel.authRequired" style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">인증</span>
      </div>
      <!-- 위젯 렌더링 -->
      <div style="padding:12px;display:flex;flex-direction:column;gap:16px;">
        <div v-for="(w, wi) in pw.widgets" :key="wi" style="position:relative;margin-top:8px;">
          <!-- 절대 배지: DispWidget (위젯 영역 상단 경계선 위 우측) + 위젯 유형 아이콘 -->
          <span v-if="showDesc" style="position:absolute;top:-9px;right:100px;font-size:7px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 4px;line-height:16px;white-space:nowrap;">DispWidget #{{ padId(w.dispId) }} {{ wLabel(w.widgetType) }}</span>
          <span style="position:absolute;top:-9px;right:0;font-size:10px;background:#f5f5f5;border:1px solid #e8e8e8;border-radius:8px;padding:0 7px;line-height:16px;color:#666;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;">
            {{ wIcon(w.widgetType) }}<span style="font-size:9px;">{{ wLabel(w.widgetType) }}</span>
          </span>
          <disp-widget
            :widget="w"
            :is-logged-in="isLoggedIn"
            :user-grade="userGrade"
          />
        </div>
      </div>
    </div>
  </div>

</div>
`
};

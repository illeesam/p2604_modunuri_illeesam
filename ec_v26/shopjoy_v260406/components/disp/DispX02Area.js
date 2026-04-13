/* ShopJoy - 전시 화면영역 컴포넌트
   mode="card"        : 패널 카드 목록 (패널 메타 정보)
   mode="expand"      : 모든 패널 펼침 → DispX03Panel 위임
   mode="area_detail" : 영역별 패널 목록 → DispX03Panel 위임
*/
window.DispX02Area = {
  name: 'DispX02Area',
  props: {
    params:      { type: Object, required: true },
    dispDataset: { type: Object, default: () => ({ displays: [], codes: [] }) },
    dispOpt:     { type: Object, default: () => ({ layout: 'auto', showHeader: true, showBadges: true, mode: 'card', showDesc: true }) },
    areaItem:    { type: Object, required: true },     // { code, label, info, panels }
  },
  setup(props) {
    const mode = props.dispOpt?.mode || 'card';
    const showDesc = props.dispOpt?.showDesc !== false;

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

    /* 패널기본정보 title 텍스트 */
    const panelTitle = (p) => [
      `#${p.dispId} ${p.name}`,
      `상태: ${p.status}`,
      `노출조건: ${p.condition || '항상 표시'}`,
      p.authRequired ? `인증: 필요${p.authGrade ? ' / 등급: '+p.authGrade+'↑' : ''}` : '인증: 불필요',
      `기간: ${periodText(p)}`,
      p.htmlDesc ? `설명: ${p.htmlDesc}` : '',
    ].filter(Boolean).join('\n');

    return { mode, showDesc, wLabel, wIcon, padId, panelWidgetTypes, periodText, statusCls, panelTitle };
  },
  template: /* html */`
<div class="disp-area" style="margin-bottom:28px;">

  <!-- 영역 헤더 -->
  <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;border-radius:8px 8px 0 0;">
    <span v-if="showDesc" style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 5px;letter-spacing:.3px;flex-shrink:0;">DispX02Area</span>
    <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:4px;letter-spacing:.5px;">{{ areaItem.code }}</code>
    <span v-if="showDesc" style="font-size:14px;font-weight:700;">{{ areaItem.label || areaItem.code }}</span>
    <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ areaItem.panels.length }}개</span>
  </div>

  <!-- 영역 타이틀 -->
  <div v-if="areaItem.info && areaItem.info.titleYn==='Y' && areaItem.info.title"
    style="padding:12px 16px 8px;font-size:16px;font-weight:700;color:#222;border-bottom:2px solid #222;margin-bottom:16px;">
    {{ areaItem.info.title }}
  </div>

  <!-- ── 리스트 모드 ── -->
  <div v-if="mode==='list'"
    style="background:#fff;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
    <div v-if="areaItem.panels.length===0" style="color:#ccc;font-size:13px;padding:16px;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>
    <table v-else style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
          <th style="padding:6px 10px;text-align:center;width:50px;font-weight:600;color:#666;">#ID</th>
          <th style="padding:6px 10px;font-weight:600;color:#666;">패널명</th>
          <th style="padding:6px 10px;text-align:center;width:60px;font-weight:600;color:#666;">상태</th>
          <th style="padding:6px 10px;text-align:center;width:110px;font-weight:600;color:#666;">노출조건</th>
          <th style="padding:6px 10px;text-align:center;width:50px;font-weight:600;color:#666;">인증</th>
          <th style="padding:6px 10px;text-align:center;width:70px;font-weight:600;color:#666;">등급</th>
          <th style="padding:6px 10px;font-weight:600;color:#666;width:200px;">전시기간</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in areaItem.panels" :key="p.dispId" style="border-bottom:1px solid #f0f0f0;cursor:default;" :title="panelTitle(p)">
          <td style="padding:6px 10px;text-align:center;color:#aaa;">#{{ padId(p.dispId) }}</td>
          <td style="padding:6px 10px;font-weight:600;color:#222;">{{ p.name }}</td>
          <td style="padding:6px 10px;text-align:center;"><span class="badge" :class="statusCls(p.status)" style="font-size:10px;">{{ p.status }}</span></td>
          <td style="padding:6px 10px;text-align:center;">
            <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;white-space:nowrap;">{{ p.condition || '항상 표시' }}</span>
          </td>
          <td style="padding:6px 10px;text-align:center;">
            <span v-if="p.authRequired" style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">필요</span>
            <span v-else style="color:#ccc;font-size:11px;">-</span>
          </td>
          <td style="padding:6px 10px;text-align:center;">
            <span v-if="p.authGrade" style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;">{{ p.authGrade }}↑</span>
            <span v-else style="color:#ccc;font-size:11px;">-</span>
          </td>
          <td style="padding:6px 10px;color:#888;font-size:11px;">
            <template v-if="p.dispStartDate || p.dispEndDate">
              {{ p.dispStartDate || '∞' }} ~ {{ p.dispEndDate || '∞' }}
            </template>
            <span v-else style="color:#ccc;">기간 없음</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── 카드 모드 ── -->
  <div v-else-if="mode==='card'"
    style="display:flex;flex-wrap:wrap;gap:12px;padding:18px 14px 14px;background:#f8f8f8;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;min-height:80px;">
    <div v-if="areaItem.panels.length===0" style="color:#ccc;font-size:13px;padding:16px;width:100%;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>
    <div v-for="p in areaItem.panels" :key="p.dispId"
      :title="panelTitle(p)"
      style="position:relative;background:#fff;border:1px solid #e4e4e4;border-radius:10px;padding:14px 16px;width:230px;min-width:190px;box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:6px;margin-top:6px;cursor:default;">

      <!-- 절대 배지: DispX03Panel -->
      <span v-if="showDesc" style="position:absolute;top:-9px;left:8px;font-size:7px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;line-height:16px;white-space:nowrap;">DispX03Panel #{{ padId(p.dispId) }}</span>

      <!-- 패널ID + 상태 + 이름 -->
      <div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
          <span style="font-size:10px;background:#eeeeee;color:#666;border-radius:4px;padding:1px 5px;flex-shrink:0;">#{{ p.dispId }}</span>
          <span class="badge" :class="statusCls(p.status)" style="font-size:10px;flex-shrink:0;">{{ p.status }}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:#222;line-height:1.35;display:block;word-break:break-all;">{{ p.name }}</span>
      </div>

      <!-- 노출조건 / 인증 배지 -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;">
        <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">{{ p.condition || '항상 표시' }}</span>
        <span v-if="p.authRequired" style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">인증</span>
        <span v-if="p.authRequired && p.authGrade" style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;">{{ p.authGrade }}↑</span>
      </div>

      <!-- 전시 기간 -->
      <div style="font-size:10px;color:#aaa;">📅 {{ periodText(p) }}</div>

      <!-- 설명 -->
      <div v-if="p.htmlDesc" style="font-size:10px;color:#999;border-top:1px solid #f0f0f0;padding-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.htmlDesc }}</div>
    </div>
  </div>

  <!-- ── 상세정보 모드 (모든 패널 펼침) ── -->
  <div v-else-if="mode==='expand'"
    style="padding:14px;background:#f0f0f0;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;display:flex;flex-direction:column;gap:10px;">
    <div v-if="areaItem.panels.length===0" style="color:#ccc;font-size:13px;padding:16px;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>

    <!-- ════ 설명보기 ON : 3열 그리드 ════ -->
    <template v-if="showDesc">
      <div v-for="p in areaItem.panels" :key="p.dispId"
        style="display:grid;grid-template-columns:190px 1fr 220px;border:1px solid #d8d8d8;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">

        <!-- 1열: 패널 제목 -->
        <div style="background:#e8f0fe;padding:14px 12px;border-right:1px solid #d0d8f0;display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:9px;background:#c5d5f8;color:#1a3a8a;border-radius:3px;padding:1px 6px;width:fit-content;letter-spacing:.3px;">DispX03Panel</div>
          <div style="font-size:10px;color:#666;background:#fff;border-radius:4px;padding:1px 6px;width:fit-content;">#{{ padId(p.dispId) }}</div>
          <div style="font-size:13px;font-weight:700;color:#1a237e;line-height:1.4;word-break:break-all;">{{ p.name }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">
            <span class="badge" :class="statusCls(p.status)" style="font-size:10px;">{{ p.status }}</span>
            <span style="font-size:10px;background:#dce8ff;color:#1565c0;border-radius:8px;padding:1px 7px;white-space:nowrap;">{{ p.condition || '항상 표시' }}</span>
            <span v-if="p.authRequired" style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">인증</span>
            <span v-if="p.authGrade" style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;">{{ p.authGrade }}↑</span>
          </div>
          <div style="font-size:10px;color:#7986cb;">📅 {{ periodText(p) }}</div>
          <div v-if="p.htmlDesc" style="font-size:10px;color:#5c6bc0;border-top:1px solid #c5d5f8;padding-top:5px;margin-top:2px;">{{ p.htmlDesc }}</div>
        </div>

        <!-- 2열: 위젯 컨텐츠 (DispX03Panel에 위임) -->
        <div style="background:#fff;display:flex;flex-direction:column;min-width:0;">
          <div style="font-size:10px;font-weight:600;color:#888;padding:6px 12px;background:#fafafa;border-bottom:1px solid #f0f0f0;letter-spacing:.3px;">위젯 컨텐츠</div>
          <div style="padding:10px 12px;">
            <disp-x03-panel :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" :panel-item="p" />
          </div>
        </div>

        <!-- 3열: 소스구조 -->
        <div style="background:#1e1e2e;padding:12px 14px;border-left:1px solid #111;font-family:'Consolas','Courier New',monospace;font-size:11px;line-height:1.7;overflow:auto;">
          <div style="font-size:9px;color:#6272a4;margin-bottom:6px;letter-spacing:.3px;">소스 구조</div>
          <div style="color:#6272a4;">&lt;!-- #{{ padId(p.dispId) }} {{ p.name }} --&gt;</div>
          <div style="color:#68d391;">&lt;DispX03Panel</div>
          <div style="color:#f8f8f2;padding-left:12px;">area=<span style="color:#f1fa8c;">"{{ p.area }}"</span></div>
          <div style="color:#f8f8f2;padding-left:12px;">status=<span style="color:#f1fa8c;">"{{ p.status }}"</span></div>
          <div style="color:#f8f8f2;padding-left:12px;">condition=<span style="color:#f1fa8c;">"{{ p.condition||'항상 표시' }}"</span><span style="color:#68d391;">&gt;</span></div>
          <div v-for="(r, ri) in (p.rows && p.rows.length ? p.rows : [p])" :key="ri" style="padding-left:10px;margin-top:2px;">
            <span style="color:#6272a4;">&#47;&#47; 위젯{{ ri+1 }}</span><br>
            <span style="color:#f6ad55;">&lt;DispX04Widget</span>
            <span style="color:#f8f8f2;"> widgetType=</span><span style="color:#f1fa8c;">"{{ r.widgetType }}"</span>
            <span v-if="r.clickAction && r.clickAction!=='none'"> clickAction=<span style="color:#f1fa8c;">"{{ r.clickAction }}"</span></span>
            <span style="color:#f6ad55;"> /&gt;</span>
          </div>
          <div style="color:#68d391;">&lt;/DispX03Panel&gt;</div>
        </div>

      </div>
    </template>

    <!-- ════ 설명보기 OFF : 패널 컨텐츠만 나열 ════ -->
    <template v-else>
      <disp-x03-panel
        v-for="p in areaItem.panels" :key="p.dispId"
        :params="params"
        :disp-dataset="dispDataset"
        :disp-opt="dispOpt"
        :panel-item="p"
      />
    </template>

  </div>

  <!-- ── 영역-위젯 상세보기 모드 (area_detail) ── -->
  <div v-else-if="mode==='area_detail'"
    style="background:#fff;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
    <div v-if="areaItem.panels.length===0" style="color:#ccc;font-size:13px;padding:16px;text-align:center;">
      이 영역에 등록된 패널이 없습니다.
    </div>
    <template v-else>
      <!-- 설명보기 ON: 패널 출처 배지 + 위젯 컨텐츠 -->
      <template v-if="showDesc">
        <div v-for="p in areaItem.panels" :key="p.dispId"
          style="display:grid;grid-template-columns:160px 1fr;border-bottom:1px solid #f0f0f0;">
          <!-- 좌: 패널 출처 -->
          <div style="background:#f8f9ff;padding:10px 12px;border-right:1px solid #eaecf5;display:flex;flex-direction:column;gap:4px;justify-content:center;">
            <div style="font-size:9px;background:#c5d5f8;color:#1a3a8a;border-radius:3px;padding:1px 5px;width:fit-content;">DispX03Panel #{{ padId(p.dispId) }}</div>
            <div style="font-size:11px;font-weight:600;color:#3949ab;line-height:1.3;">{{ p.name }}</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;">
              <span class="badge" :class="statusCls(p.status)" style="font-size:9px;">{{ p.status }}</span>
              <span style="font-size:9px;background:#dce8ff;color:#1565c0;border-radius:6px;padding:0 5px;">{{ p.condition || '항상 표시' }}</span>
            </div>
          </div>
          <!-- 우: 패널 컨텐츠 (DispX03Panel에 위임) -->
          <div style="padding:12px 16px;">
            <disp-x03-panel :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" :panel-item="p" />
          </div>
        </div>
      </template>
      <!-- 설명보기 OFF: 패널 컨텐츠만 쭉 -->
      <template v-else>
        <div v-for="p in areaItem.panels" :key="p.dispId"
          style="padding:12px 16px;border-bottom:1px solid #f5f5f5;">
          <disp-x03-panel :params="params" :disp-dataset="dispDataset" :disp-opt="dispOpt" :panel-item="p" />
        </div>
      </template>
    </template>
  </div>

</div>
`
};

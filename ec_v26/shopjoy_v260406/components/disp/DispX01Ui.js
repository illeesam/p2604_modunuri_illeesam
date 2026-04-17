/* ShopJoy - DispUi 공통 컴포넌트
 * 용도: DispAreaPreview 모달 + DispUiPage 팝업 공용
 * Props:
 *   params      - { areas[], date, time, status, visibilityTargets, siteId, memberId, viewOpts }
 *   dispDataset   - dispDataset 객체 (없으면 window.dispDataset fallback)
 *   layout      - 'auto' | 'simple' | 'detailed' (기본: 'auto')
 *   showHeader  - 섹션 헤더 표시 (기본: true)
 *   showBadges  - 정보 배지 표시 (기본: true)
 */
window.DispX01Ui = {
  name: 'DispX01Ui',
  props: {
    params:      { type: Object, required: true },
    dispDataset: { type: Object, default: () => window.dispDataset || { displays: [], codes: [] } },
    dispOpt:     { type: Object, default: () => ({ layout: 'auto', showHeader: true, showBadges: true }) },
  },
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* ── 유효 탭 목록 (viewOpts 기준) ── */
    const ALL_TABS = [
      { key: 'content', label: '🖼 내용보기' },
      { key: 'struct',  label: '🌲 구조보기' },
      { key: 'source',  label: '</> 소스보기' },
    ];
    const activeTabs = computed(() => {
      const opts = (props.params.viewOpts || '').split(',').filter(Boolean);
      return opts.length ? ALL_TABS.filter(t => opts.includes(t.key)) : [];
    });
    const activeTab = ref('');

    Vue.watchEffect(() => {
      const first = activeTabs.value[0]?.key || 'content';
      if (!activeTabs.value.find(t => t.key === activeTab.value)) {
        activeTab.value = first;
      }
    });

    /* ── 공통 상수 ── */
    const WIDGET_TYPE_LABELS = {
      'image_banner':'이미지 배너', 'product_slider':'상품 슬라이더', 'product':'상품',
      'cond_product':'조건상품',   'chart_bar':'차트(Bar)',          'chart_line':'차트(Line)',
      'chart_pie':'차트(Pie)',     'text_banner':'텍스트 배너',      'info_card':'정보카드',
      'popup':'팝업',              'file':'파일',                    'file_list':'파일목록',
      'coupon':'쿠폰',             'html_editor':'HTML 에디터',      'event_banner':'이벤트',
      'cache_banner':'캐시',       'widget_embed':'위젯',
    };
    const wLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';

    /* ── 패널 필터 ── */
    const panelFilter = (p) => {
      const pm = props.params;
      // ✓ 전시여부 체크 (UI-Area 매핑)
      if (p.dispYn !== 'Y') return false;
      // ✓ 사용여부 체크 (UI 마스터)
      if (p.useYn !== 'Y') return false;
      if (pm.status && p.status !== pm.status) return false;
      // ✓ 사용기간 체크 (UI 마스터)
      if (pm.date) {
        const t  = pm.time || '00:00';
        const dt = `${pm.date} ${t}`;
        if (p.useStartDate && dt < `${p.useStartDate} 00:00`) return false;
        if (p.useEndDate   && dt > `${p.useEndDate}   23:59`) return false;
      }
      // ✓ 전시기간 체크 (UI-Area 매핑)
      if (pm.date) {
        const t  = pm.time || '00:00';
        const dt = `${pm.date} ${t}`;
        if (p.dispStartDate && dt < `${p.dispStartDate} ${p.dispStartTime || '00:00'}`) return false;
        if (p.dispEndDate   && dt > `${p.dispEndDate}   ${p.dispEndTime   || '23:59'}`) return false;
      }
      // ✓ 전시환경 체크 (UI-Area 매핑)
      if (p.dispEnv && pm.dispEnv && !p.dispEnv.includes('^' + pm.dispEnv + '^')) return false;
      if (pm.visibilityTargets) {
        const code = pm.visibilityTargets.replace(/\^/g, '').trim();
        if (code && !window.visibilityUtil.has(p.visibilityTargets, code)) return false;
      }
      return true;
    };

    const panelsForArea = (areaCode) =>
      (props.dispDataset.displays || [])
        .filter(p => p.area === areaCode && panelFilter(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const areaInfo = (code) =>
      (props.dispDataset.codes || []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === code);

    const areaLabel = (code) => areaInfo(code)?.codeLabel || code;

    const totalPanels = computed(() =>
      (props.params.areas || []).reduce((s, a) => s + panelsForArea(a).length, 0)
    );

    /* ─────────────────────────────────────────
       구조보기 — 트리 접기/펼치기
    ───────────────────────────────────────── */
    const structAreaOpen  = reactive(new Set());
    const structPanelOpen = reactive(new Set());

    /* 처음 렌더링 시 모두 펼치기 */
    Vue.watchEffect(() => {
      (props.params.areas || []).forEach(code => structAreaOpen.add(code));
      (props.params.areas || []).forEach(code =>
        panelsForArea(code).forEach(p => structPanelOpen.add(p.dispId))
      );
    });

    const allAreas1Open = computed(() =>
      (props.params.areas || []).length > 0 &&
      (props.params.areas || []).every(c => structAreaOpen.has(c))
    );
    const allPanels2Open = computed(() =>
      (props.params.areas || []).every(code =>
        panelsForArea(code).every(p => structPanelOpen.has(p.dispId))
      )
    );

    const expandAll   = () => {
      (props.params.areas || []).forEach(c => structAreaOpen.add(c));
      (props.params.areas || []).forEach(c => panelsForArea(c).forEach(p => structPanelOpen.add(p.dispId)));
    };
    const collapseAll = () => { structAreaOpen.clear(); structPanelOpen.clear(); };
    const toggleAll1  = () => {
      if (allAreas1Open.value) { structAreaOpen.clear(); structPanelOpen.clear(); }
      else (props.params.areas || []).forEach(c => structAreaOpen.add(c));
    };
    const toggleAll2  = () => {
      if (allPanels2Open.value) structPanelOpen.clear();
      else (props.params.areas || []).forEach(c => panelsForArea(c).forEach(p => structPanelOpen.add(p.dispId)));
    };
    const toggleArea  = (code) => {
      if (structAreaOpen.has(code)) structAreaOpen.delete(code);
      else structAreaOpen.add(code);
    };
    const togglePanel = (id) => {
      if (structPanelOpen.has(id)) structPanelOpen.delete(id);
      else structPanelOpen.add(id);
    };

    /* ─────────────────────────────────────────
       소스보기 — 구조화된 라인 목록
    ───────────────────────────────────────── */
    const sourceLines = computed(() => {
      const lines = [];
      const pm = props.params;
      const allAreas = pm.areas || [];

      /* 헤더 3줄 */
      lines.push({ type:'header', sub:'entities',
        text:`<!-- 전시개체 : 전시영역s: ${allAreas.join(', ')||'-'}, 전시패널s: -, 전시위젯s: -, 위젯Libs: - -->` });
      lines.push({ type:'header', sub:'disp',
        text:`<!-- disp조건 : 전시일시: ${pm.date||'-'} ${pm.time||''}  |  상태: ${pm.status||'전체'}  |  공개대상: ${pm.visibilityTargets||'전체'} -->` });
      lines.push({ type:'header', sub:'cond',
        text:`<!-- cond조건 : 조회기간: -,  카테고리: -,  주문: - -->` });
      lines.push({ type:'blank' });
      lines.push({ type:'ui-open',  text:`<DispX01Ui>` });

      allAreas.forEach((areaCode, ai) => {
        const info   = areaInfo(areaCode);
        const panels = panelsForArea(areaCode);
        if (ai > 0) lines.push({ type:'blank' });

        const _aLayout = info?.layoutType === 'dashboard' ? 'dashboard' : `${info?.layoutType||'grid'}:${info?.gridCols||1}`;
        const _aTitleYn = info?.titleYn === 'Y' ? (info?.title || '(제목없음)') : '미표시';
        lines.push({ type:'area-meta',
          text:`  <!-- 표시형식:${_aLayout}, 정렬:${info?.sortOrd??'-'}, 타이틀:${_aTitleYn}, area="${areaCode}" -->` });
        lines.push({ type:'area-open',
          text:`  <DispX02Area area="${areaCode}" areaLabel="${info?.codeLabel||areaCode}" layoutType="${info?.layoutType||'grid'}" gridCols="${info?.gridCols||1}">` });

        if (!panels.length) {
          lines.push({ type:'comment', text:`    <!-- 해당 날짜 활성 패널 없음 -->` });
        } else {
          panels.forEach(p => {
            lines.push({ type:'blank' });
            const _period = (p.dispStartDate || p.dispEndDate)
              ? `${p.dispStartDate||'∞'}${p.dispStartTime?' '+p.dispStartTime:''} ~ ${p.dispEndDate||'∞'}${p.dispEndTime?' '+p.dispEndTime:''}`
              : '기간없음';
            const _pLayout = p.layoutType === 'dashboard' ? 'dashboard' : `${p.layoutType||'grid'}:${p.gridCols||1}`;
            const _pTitleYn = p.titleYn === 'Y' ? (p.title || '(제목없음)') : '미표시';
            const _pVis = p.visibilityTargets ? p.visibilityTargets.replace(/\^/g,'').trim() : '전체';
            lines.push({ type:'panel-meta',
              text:`    <!-- 표시형식:${_pLayout}, 정렬:${p.sortOrder??'-'}, 타이틀:${_pTitleYn}, 기간: ${_period}  |  상태: ${p.status||'-'}  |  공개대상: ${_pVis} -->` });
            lines.push({ type:'panel-open',
              text:`    <DispX03Panel id="#${String(p.dispId).padStart(4,'0')}" name="${p.name}" status="${p.status}" layoutType="${p.layoutType||'grid'}" gridCols="${p.gridCols||1}">` });

            if (!(p.rows?.length)) {
              lines.push({ type:'comment', text:`      <!-- (위젯 없음) -->` });
            } else {
              (p.rows||[]).forEach(w => {
                lines.push({ type:'widget',
                  text:`      <DispX04Widget widgetType="${w.widgetType}" widgetNm="${w.widgetNm||''}" />` });
              });
            }
            lines.push({ type:'panel-close', text:`    </DispX03Panel>` });
          });
          lines.push({ type:'blank' });
        }
        lines.push({ type:'area-close', text:`  </DispX02Area>` });
      });

      lines.push({ type:'ui-close', text:`</DispX01Ui>` });
      return lines;
    });

    /* 라인 타입별 색상 */
    const lineColor = (line) => {
      switch (line.type) {
        case 'header':
          if (line.sub === 'entities') return '#ffd700';
          if (line.sub === 'disp')     return '#ffab40';
          if (line.sub === 'cond')     return '#ff8a65';
          return '#ffd700';
        case 'ui-open':
        case 'ui-close':    return '#b794f4';
        case 'area-meta':   return '#808080';
        case 'area-open':   return '#63b3ed';
        case 'area-close':  return '#63b3ed';
        case 'panel-meta':  return '#6e7f9e';
        case 'panel-open':  return '#68d391';
        case 'panel-close': return '#68d391';
        case 'widget':      return '#f6ad55';
        case 'comment':     return '#546e7a';
        case 'blank':       return 'transparent';
        default:            return '#cdd9e5';
      }
    };

    /* 내용보기 구조 표시 토글 (기본 OFF = 순수 위젯만) */
    const showContentStruct = ref(false);

    return {
      activeTabs, activeTab,
      showContentStruct,
      wLabel, areaLabel, areaInfo, panelsForArea, totalPanels,
      /* 구조보기 트리 */
      structAreaOpen, structPanelOpen,
      allAreas1Open, allPanels2Open,
      expandAll, collapseAll, toggleAll1, toggleAll2,
      toggleArea, togglePanel,
      /* 소스보기 */
      sourceLines, lineColor,
      /* 렌더링 옵션 */
      layout: props.dispOpt?.layout || 'auto',
      showHeader: props.dispOpt?.showHeader !== false,
      showBadges: props.dispOpt?.showBadges !== false,
    };
  },
  template: /* html */`
<div>
  <!-- 파라미터 요약 바 (보기옵션이 있을 때만) -->
  <div v-if="params.viewOpts" style="background:#fff;border-bottom:1px solid #e8e0f8;padding:10px 24px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
    <span style="font-size:11px;color:#888;margin-right:4px;">전달 파라미터:</span>
    <span v-if="params.areas.length" style="font-size:11px;background:#ede7f6;color:#4a148c;border-radius:8px;padding:2px 10px;">영역: {{ params.areas.join(', ') }}</span>
    <span v-if="params.date" style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:8px;padding:2px 10px;">📅 {{ params.date }} {{ params.time }}</span>
    <span v-if="params.status" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 10px;">상태: {{ params.status }}</span>
    <span v-if="params.visibilityTargets" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 10px;">공개대상: {{ params.visibilityTargets.replace(/\^/g,'') }}</span>
    <span v-if="params.siteId" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 10px;">siteId: {{ params.siteId }}</span>
    <span v-if="params.memberId" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 10px;">memberId: {{ params.memberId }}</span>
    <span v-if="params.viewOpts" style="font-size:11px;background:#f0f4ff;color:#4f46e5;border-radius:8px;padding:2px 10px;">보기: {{ params.viewOpts }}</span>
  </div>
  <style>
    @keyframes skelShimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .skel-pulse {
      background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%) !important;
      background-size: 800px 100% !important;
      animation: skelShimmer 1.4s infinite linear;
    }
  </style>
  <!-- 탭 바 -->
  <div style="display:flex;align-items:stretch;border-bottom:2px solid #e8e0f8;background:#faf8ff;">
    <template v-if="activeTabs.length > 1">
      <template v-for="tab in activeTabs" :key="tab.key">
        <!-- 내용보기 탭: 구조보기 토글 내장 -->
        <div v-if="tab.key==='content'"
          style="display:flex;align-items:center;border-bottom:3px solid transparent;margin-bottom:-2px;"
          :style="activeTab==='content' ? 'border-bottom-color:#6a1b9a;background:#fff;' : ''">
          <button @click="activeTab='content'"
            style="padding:9px 12px 9px 20px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:transparent;transition:color .15s;"
            :style="activeTab==='content' ? 'color:#6a1b9a;' : 'color:#aaa;'">
            {{ tab.label }}
          </button>
          <span @click.stop="showContentStruct=!showContentStruct"
            style="font-size:11px;padding:1px 7px;border-radius:8px;cursor:pointer;transition:all .15s;white-space:nowrap;margin-right:8px;border:1px solid;"
            :style="showContentStruct
              ? 'background:#ede7f6;color:#6a1b9a;border-color:#b39ddb;font-weight:600;'
              : 'background:#f5f5f5;color:#bbb;border-color:#e0e0e0;'"
            :title="showContentStruct?'구조 숨기기':'구조 보기'">
            상세
          </span>
        </div>
        <!-- 나머지 탭 -->
        <button v-else @click="activeTab=tab.key"
          style="padding:9px 20px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;border-bottom:3px solid transparent;margin-bottom:-2px;"
          :style="activeTab===tab.key
            ? 'background:#fff;color:#6a1b9a;border-bottom-color:#6a1b9a;'
            : 'background:transparent;color:#aaa;'">
          {{ tab.label }}
        </button>
      </template>
    </template>
    <!-- 탭이 1개이거나 없을 때 (내용보기만): 구조 토글만 표시 -->
    <div v-else style="display:flex;align-items:center;padding:6px 14px;gap:8px;">
      <span style="font-size:13px;font-weight:600;color:#6a1b9a;">🖼 내용보기</span>
      <span @click="showContentStruct=!showContentStruct"
        style="font-size:11px;padding:1px 7px;border-radius:8px;cursor:pointer;transition:all .15s;white-space:nowrap;border:1px solid;"
        :style="showContentStruct
          ? 'background:#ede7f6;color:#6a1b9a;border-color:#b39ddb;font-weight:600;'
          : 'background:#f5f5f5;color:#bbb;border-color:#e0e0e0;'">
        상세
      </span>
    </div>
  </div>

  <!-- 영역 없음 -->
  <div v-if="!(params.areas&&params.areas.length)"
    style="text-align:center;padding:60px;color:#bbb;font-size:14px;">
    전시영역 파라미터가 없습니다. 관리자 화면에서 영역을 선택 후 다시 열어주세요.
  </div>

  <template v-else>

    <!-- ══════════════════════════════════════
         내용보기 — 위젯 시각적 렌더링
    ══════════════════════════════════════ -->
    <div v-if="activeTab==='' || activeTab==='content' || activeTabs.length===0">

      <!-- ── 구조보기 OFF: 순수 위젯만 ── -->
      <div v-if="!showContentStruct" style="display:flex;flex-direction:column;gap:0;">
        <template v-for="areaCode in params.areas" :key="areaCode">
          <disp-x02-area v-if="panelsForArea(areaCode).length"
            :params="params"
            :disp-dataset="dispDataset"
            :disp-opt="{ ...dispOpt, mode: 'area_detail', showDesc: false }"
            :area-item="{ code: areaCode, label: areaLabel(areaCode), info: areaInfo(areaCode), panels: panelsForArea(areaCode) }"
          />
          <!-- 스켈레톤 (패널 없을 때) -->
          <div v-else style="padding:12px 0 4px 0;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div v-for="sk in 2" :key="sk"
                style="border-radius:10px;overflow:hidden;background:#f5f5f7;padding:14px 16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                  <div class="skel-pulse" style="width:52px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                  <div class="skel-pulse" style="width:110px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                  <div class="skel-pulse" style="margin-left:auto;width:36px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                </div>
                <div class="skel-pulse" style="width:100%;height:80px;border-radius:8px;background:#e0e0e0;"></div>
              </div>
              <div style="border-radius:10px;overflow:hidden;background:#f5f5f7;padding:14px 16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                  <div class="skel-pulse" style="width:52px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                  <div class="skel-pulse" style="width:80px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                  <div class="skel-pulse" style="margin-left:auto;width:36px;height:14px;border-radius:4px;background:#e0e0e0;"></div>
                </div>
                <div style="display:flex;gap:8px;overflow:hidden;">
                  <div v-for="ci in 4" :key="ci" style="flex-shrink:0;width:90px;">
                    <div class="skel-pulse" style="width:90px;height:90px;border-radius:8px;background:#e0e0e0;margin-bottom:6px;"></div>
                    <div class="skel-pulse" style="width:70px;height:10px;border-radius:4px;background:#e0e0e0;margin-bottom:4px;"></div>
                    <div class="skel-pulse" style="width:50px;height:10px;border-radius:4px;background:#e8e0e0;"></div>
                  </div>
                </div>
              </div>
            </div>
            <div style="margin-top:6px;text-align:center;font-size:10px;color:#ccc;letter-spacing:.3px;">
              조건에 맞는 패널이 없습니다 · {{ areaCode }}
            </div>
          </div>
        </template>
      </div>

      <!-- ── 구조보기 ON: DispX02Area에 위임 ── -->
      <div v-else style="padding:16px;background:#f0f0f0;display:flex;flex-direction:column;gap:4px;">
        <template v-for="areaCode in params.areas" :key="areaCode">
          <disp-x02-area
            :params="params"
            :disp-dataset="dispDataset"
            :disp-opt="{ ...dispOpt, mode: 'expand', showDesc: true }"
            :area-item="{ code: areaCode, label: areaLabel(areaCode), info: areaInfo(areaCode), panels: panelsForArea(areaCode) }"
          />
          <!-- 스켈레톤 (패널 없을 때) -->
          <div v-if="!panelsForArea(areaCode).length"
            style="background:#fff;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none;padding:14px 16px;">
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="sk in 3" :key="sk"
                style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f9f9f9;border-radius:6px;border:1px solid #f0f0f0;">
                <div class="skel-pulse" style="width:56px;height:13px;border-radius:3px;background:#e8e8e8;"></div>
                <div class="skel-pulse" :style="'width:'+(60+sk*20)+'px;height:13px;border-radius:3px;background:#e8e8e8;'"></div>
                <div class="skel-pulse" style="margin-left:auto;width:44px;height:13px;border-radius:3px;background:#e8e8e8;"></div>
              </div>
            </div>
            <div style="margin-top:8px;text-align:center;font-size:10px;color:#ccc;">조건에 맞는 패널이 없습니다</div>
          </div>
        </template>
      </div>

    </div>

    <!-- ══════════════════════════════════════
         구조보기 — 윈도우 트리
    ══════════════════════════════════════ -->
    <div v-else-if="activeTab==='struct'" style="padding:0;">

      <!-- 트리 컨트롤 바 -->
      <div style="display:flex;align-items:center;gap:6px;padding:8px 16px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;flex-wrap:wrap;">
        <button @click="expandAll"
          style="font-size:11px;padding:3px 10px;border:1px solid #1565c0;border-radius:7px;background:#e3f2fd;color:#1565c0;cursor:pointer;font-weight:600;">
          ▼ 전체펼치기
        </button>
        <button @click="collapseAll"
          style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:7px;background:#fff;color:#888;cursor:pointer;">
          ▶ 전체접기
        </button>
        <div style="width:1px;height:18px;background:#ddd;margin:0 2px;"></div>
        <button @click="toggleAll1"
          style="font-size:11px;padding:3px 10px;border:1px solid #6a1b9a;border-radius:7px;cursor:pointer;font-weight:600;"
          :style="allAreas1Open?'background:#f3e5f5;color:#4a148c;':'background:#fff;color:#9c27b0;'">
          {{ allAreas1Open ? '▼' : '▶' }} 1레벨 (영역)
        </button>
        <button @click="toggleAll2"
          style="font-size:11px;padding:3px 10px;border:1px solid #2e7d32;border-radius:7px;cursor:pointer;font-weight:600;"
          :style="allPanels2Open?'background:#e8f5e9;color:#1b5e20;':'background:#fff;color:#388e3c;'">
          {{ allPanels2Open ? '▼' : '▶' }} 2레벨 (패널)
        </button>
        <span style="font-size:11px;color:#aaa;margin-left:auto;">영역 {{ params.areas.length }}개 · 패널 {{ totalPanels }}개</span>
      </div>

      <!-- 트리 본문 -->
      <div style="padding:10px 16px;background:#fff;font-family:monospace;">
        <div v-for="(areaCode, ai) in params.areas" :key="areaCode" style="margin-bottom:2px;">

          <!-- 1레벨: Area 행 -->
          <div @click="toggleArea(areaCode)"
            style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:7px;cursor:pointer;user-select:none;border:1px solid #d1c4e9;background:linear-gradient(90deg,#ede7f6,#f8f5ff);"
            onmouseover="this.style.background='linear-gradient(90deg,#e1d5f0,#ede7f6)'"
            onmouseout="this.style.background='linear-gradient(90deg,#ede7f6,#f8f5ff)'">
            <span style="font-size:12px;color:#6a1b9a;width:14px;text-align:center;flex-shrink:0;">
              {{ structAreaOpen.has(areaCode) ? '▼' : '▶' }}
            </span>
            <span style="font-size:10px;font-weight:700;background:#6a1b9a;color:#fff;border-radius:4px;padding:1px 7px;flex-shrink:0;">Area</span>
            <code style="font-size:11px;color:#4a148c;font-weight:700;background:#e8d5f8;padding:1px 6px;border-radius:4px;">{{ areaCode }}</code>
            <span style="font-size:12px;color:#4a148c;font-weight:600;">{{ areaLabel(areaCode) }}</span>
            <!-- Area 옵션 정보 -->
            <span style="margin-left:auto;font-size:10px;color:#9c6fb5;font-family:monospace;white-space:nowrap;flex-shrink:0;">
              표시형식:{{ areaInfo(areaCode)?.layoutType||'grid' }}:{{ areaInfo(areaCode)?.gridCols||1 }},
              정렬:{{ areaInfo(areaCode)?.sortOrd??'-' }},
              타이틀:{{ areaInfo(areaCode)?.titleYn==='Y' ? (areaInfo(areaCode)?.title||'(제목없음)') : '미표시' }},
              area="{{ areaCode }}"
            </span>
            <span style="font-size:10px;color:#bbb;flex-shrink:0;margin-left:10px;">패널 {{ panelsForArea(areaCode).length }}개</span>
          </div>

          <!-- 2레벨: Panel 목록 (영역 펼쳐져 있을 때) -->
          <div v-if="structAreaOpen.has(areaCode)" style="margin-left:20px;border-left:2px solid #d1c4e9;padding-left:8px;margin-top:2px;">
            <div v-if="!panelsForArea(areaCode).length"
              style="padding:6px 10px;font-size:11px;color:#bbb;font-style:italic;">
              ── 해당 조건 패널 없음
            </div>

            <div v-for="(p, pi) in panelsForArea(areaCode)" :key="p.dispId" style="margin-bottom:2px;">
              <!-- Panel 행 -->
              <div @click="togglePanel(p.dispId)"
                style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;cursor:pointer;user-select:none;border:1px solid #c8e6c9;background:linear-gradient(90deg,#e8f5e9,#f9fdf9);flex-wrap:wrap;"
                onmouseover="this.style.background='linear-gradient(90deg,#dcedc8,#e8f5e9)'"
                onmouseout="this.style.background='linear-gradient(90deg,#e8f5e9,#f9fdf9)'">
                <!-- 좌측: 트리 + 이름 -->
                <span style="font-size:11px;color:#a5d6a7;margin-left:-2px;width:12px;flex-shrink:0;">
                  {{ pi === panelsForArea(areaCode).length - 1 ? '└' : '├' }}
                </span>
                <span style="font-size:11px;color:#2e7d32;width:14px;text-align:center;flex-shrink:0;">
                  {{ structPanelOpen.has(p.dispId) ? '▼' : '▶' }}
                </span>
                <span style="font-size:9px;font-weight:700;background:#2e7d32;color:#fff;border-radius:3px;padding:1px 6px;flex-shrink:0;">Panel</span>
                <code style="font-size:10px;color:#888;flex-shrink:0;">#{{ String(p.dispId).padStart(4,'0') }}</code>
                <span style="font-size:12px;font-weight:600;color:#1b5e20;">{{ p.name }}</span>
                <!-- Panel 옵션 정보 (우측) -->
                <span style="margin-left:auto;font-size:10px;color:#5a8a6a;font-family:monospace;white-space:nowrap;flex-shrink:0;">
                  표시형식:{{ p.layoutType||'grid' }}:{{ p.gridCols||1 }},
                  정렬:{{ p.sortOrder??'-' }},
                  타이틀:{{ p.titleYn==='Y' ? (p.title||'(제목없음)') : '미표시' }},
                  기간: {{ (p.dispStartDate||p.dispEndDate) ? (p.dispStartDate||'∞')+' ~ '+(p.dispEndDate||'∞') : '기간없음' }}
                  &nbsp;|&nbsp;상태: {{ p.status||'-' }}
                </span>
                <span style="font-size:10px;color:#bbb;flex-shrink:0;margin-left:8px;">위젯 {{ (p.rows||[]).length }}개</span>
              </div>

              <!-- 3레벨: Widget 목록 (패널 펼쳐져 있을 때) -->
              <div v-if="structPanelOpen.has(p.dispId)"
                style="margin-left:28px;border-left:2px solid #c8e6c9;padding-left:8px;margin-top:2px;margin-bottom:2px;">
                <div v-if="!(p.rows&&p.rows.length)"
                  style="padding:4px 10px;font-size:11px;color:#ccc;font-style:italic;">── 위젯 없음</div>
                <div v-for="(w, wi) in (p.rows||[])" :key="wi"
                  style="display:flex;align-items:center;gap:6px;padding:4px 10px;margin-bottom:1px;border-radius:5px;background:#f0f7ff;border:1px solid #dce7fb;">
                  <span style="font-size:11px;color:#82b1ff;margin-left:-2px;width:12px;flex-shrink:0;">
                    {{ wi === (p.rows||[]).length - 1 ? '└' : '├' }}
                  </span>
                  <span style="font-size:9px;font-weight:700;background:#1a73e8;color:#fff;border-radius:3px;padding:1px 5px;flex-shrink:0;">Widget</span>
                  <span style="font-size:10px;color:#90caf9;flex-shrink:0;">{{ wi+1 }}.</span>
                  <span style="font-size:11px;background:#e8f0fe;color:#1a73e8;border-radius:5px;padding:1px 7px;flex-shrink:0;">{{ wLabel(w.widgetType) }}</span>
                  <span v-if="w.widgetNm" style="font-size:11px;color:#555;">{{ w.widgetNm }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         소스보기 — 컬럼 + 하이라이팅
    ══════════════════════════════════════ -->
    <div v-else-if="activeTab==='source'" style="padding:0;">
      <div style="background:#1e1e2e;min-height:300px;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-family:'Consolas','D2Coding',monospace;font-size:12px;line-height:1.9;">
          <tbody>
            <tr v-for="(line, idx) in sourceLines" :key="idx"
              style="vertical-align:top;"
              onmouseover="this.style.background='rgba(255,255,255,0.04)'"
              onmouseout="this.style.background=''">
              <!-- 라인 번호 -->
              <td style="width:40px;padding:0 10px 0 12px;text-align:right;color:#4b5263;font-size:11px;user-select:none;border-right:1px solid #2d2d40;white-space:nowrap;vertical-align:top;">
                <span v-if="line.type!=='blank'">{{ idx+1 }}</span>
              </td>
              <!-- 소스 내용 -->
              <td style="padding:0 16px 0 14px;white-space:pre;vertical-align:top;">
                <span v-if="line.type==='blank'">&nbsp;</span>
                <span v-else :style="'color:'+lineColor(line)">{{ line.text }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </template>
</div>
`,
};

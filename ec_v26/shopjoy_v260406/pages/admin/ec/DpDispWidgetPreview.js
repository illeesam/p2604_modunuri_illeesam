/* ShopJoy Admin - 전시위젯미리보기 (#page=ecDispWidgetLibPreview) */

/* ── 위젯미리보기 서브컴포넌트 (grid · dashboard 공용) ── */
const _WP_DispWidgetPreview = {
  name: 'WidgetPreview',
  props: { lib: Object, compact: { type: Boolean, default: false } },
  setup(props) {
    const chartColors = ['#e8587a','#ff8c69','#9c5fa3','#1677ff','#52c41a','#fa8c16','#36cfc9'];
    const chartBars = Vue.computed(() => {
      const w = props.lib;
      if (!w || !w.chartValues) return [];
      const values = w.chartValues.split(',').map(v => Number(v.trim()) || 0);
      const labels = w.chartLabels ? w.chartLabels.split(',').map(l => l.trim()) : values.map((_,i)=>String(i+1));
      const max = Math.max(...values, 1);
      return values.map((v,i) => ({ v, label:labels[i]||'', pct:Math.round((v/max)*100), color:chartColors[i%chartColors.length] }));
    });
    return { chartBars };
  },
  template: /* html */`
<div style="padding:10px;">
  <!-- 이미지 배너 -->
  <template v-if="lib.widgetType==='image_banner'">
    <div style="border-radius:6px;overflow:hidden;background:#f0f0f0;">
      <img v-if="lib.imageUrl" :src="lib.imageUrl" style="width:100%;display:block;max-height:130px;object-fit:cover;" />
      <div v-else style="height:80px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;">🖼 이미지 배너</div>
    </div>
    <div v-if="lib.linkUrl" style="font-size:10px;color:#aaa;margin-top:4px;">🔗 {{ lib.linkUrl }}</div>
  </template>

  <!-- 상품 슬라이더 / 상품 -->
  <template v-else-if="lib.widgetType==='product_slider'||lib.widgetType==='product'">
    <div style="font-size:12px;font-weight:700;color:#222;margin-bottom:7px;">{{ lib.name }}</div>
    <div style="display:flex;gap:6px;overflow-x:auto;">
      <div v-for="i in 4" :key="i" style="flex-shrink:0;width:64px;text-align:center;">
        <div style="height:56px;background:#f5f5f5;border-radius:5px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;font-size:16px;">👗</div>
        <div style="font-size:10px;color:#888;">상품{{ i }}</div>
      </div>
    </div>
  </template>

  <!-- 차트 -->
  <template v-else-if="lib.widgetType&&lib.widgetType.startsWith('chart_')">
    <div style="font-size:12px;font-weight:700;color:#222;margin-bottom:8px;">{{ lib.chartTitle||lib.name }}</div>
    <div v-if="chartBars.length" style="display:flex;align-items:flex-end;gap:4px;height:60px;">
      <div v-for="(bar,i) in chartBars" :key="i" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div :style="{height:bar.pct+'%',background:bar.color,borderRadius:'3px 3px 0 0',width:'100%',minHeight:'3px'}"></div>
        <div style="font-size:9px;color:#aaa;">{{ bar.label }}</div>
      </div>
    </div>
    <div v-else style="height:50px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:11px;">데이터 없음</div>
  </template>

  <!-- 텍스트 배너 -->
  <template v-else-if="lib.widgetType==='text_banner'">
    <div :style="{background:lib.bgColor||'#fff',color:lib.textColor||'#222',padding:'10px',borderRadius:'5px',border:'1px solid #eee',fontSize:'12px'}">
      <span v-if="lib.textContent" v-html="lib.textContent"></span>
      <span v-else style="color:#ccc;">텍스트 배너</span>
    </div>
  </template>

  <!-- 정보 카드 -->
  <template v-else-if="lib.widgetType==='info_card'">
    <div style="background:#f8f9fa;border-radius:5px;padding:10px;border:1px solid #eee;">
      <div style="font-size:12px;font-weight:700;margin-bottom:4px;">{{ lib.infoTitle||'카드 제목' }}</div>
      <div style="font-size:11px;color:#666;white-space:pre-line;">{{ (lib.infoBody||'카드 내용').slice(0,100) }}</div>
    </div>
  </template>

  <!-- 쿠폰 -->
  <template v-else-if="lib.widgetType==='coupon'">
    <div style="background:linear-gradient(135deg,#e8587a,#f97316);border-radius:6px;padding:12px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div>
        <div style="font-size:10px;opacity:.8;">쿠폰</div>
        <div style="font-size:14px;font-weight:700;">{{ lib.couponCode||'CODE' }}</div>
        <div v-if="lib.couponDesc" style="font-size:10px;opacity:.8;">{{ lib.couponDesc }}</div>
      </div>
      <span style="font-size:22px;">🎟</span>
      <div style="border:2px dashed rgba(255,255,255,.5);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">쿠폰 발기</div>
    </div>
  </template>

  <!-- 캐시 배너 -->
  <template v-else-if="lib.widgetType==='cache_banner'">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:6px;padding:12px;color:#fff;display:flex;align-items:center;gap:10px;">
      <span style="font-size:22px;">💰</span>
      <div>
        <div style="font-size:10px;opacity:.8;">적립 캐시</div>
        <div style="font-size:16px;font-weight:800;">{{ lib.cacheAmount ? lib.cacheAmount.toLocaleString()+'원' : '-' }}</div>
        <div v-if="lib.cacheDesc" style="font-size:10px;opacity:.8;">{{ lib.cacheDesc }}</div>
      </div>
    </div>
  </template>

  <!-- HTML 에디터 -->
  <template v-else-if="lib.widgetType==='html_editor'">
    <div v-if="lib.htmlContent" v-html="lib.htmlContent" style="font-size:12px;overflow:hidden;max-height:120px;"></div>
    <div v-else style="color:#ccc;font-size:11px;padding:8px 0;">HTML 미리보기</div>
  </template>

  <!-- 위젯 임베드 -->
  <template v-else-if="lib.widgetType==='widget_embed'">
    <div v-if="lib.embedCode" v-html="lib.embedCode" style="overflow:hidden;max-height:140px;"></div>
    <div v-else style="color:#ccc;font-size:11px;padding:8px 0;">임베드 미리보기</div>
  </template>

  <!-- 팝업 -->
  <template v-else-if="lib.widgetType==='popup'">
    <div style="border:2px solid #e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="background:#444;color:#fff;padding:5px 10px;font-size:11px;display:flex;justify-content:space-between;"><span>팝업</span><span>✕</span></div>
      <div style="height:60px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:11px;">{{ lib.popupWidth||600 }}×{{ lib.popupHeight||400 }}</div>
    </div>
  </template>

  <!-- 파일 -->
  <template v-else-if="lib.widgetType==='file'">
    <div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;">
      <span style="font-size:20px;">📎</span>
      <div>
        <div style="font-size:12px;font-weight:600;color:#222;">{{ lib.fileLabel||'파일 다운로드' }}</div>
        <div v-if="lib.fileUrl" style="font-size:10px;color:#aaa;">{{ lib.fileUrl.split('/').pop() }}</div>
      </div>
    </div>
  </template>

  <!-- 기타 -->
  <template v-else>
    <div style="background:#f5f5f5;border-radius:6px;padding:16px;text-align:center;color:#bbb;">
      <div style="font-size:24px;margin-bottom:4px;">▪</div>
      <div style="font-size:11px;">{{ lib.name }}</div>
    </div>
  </template>
</div>
  `,
};

/* ── 메인 컴포넌트 ── */
window.DpDispWidgetPreview = {
  name: 'DpDispWidgetPreview',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const today   = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);

    const WIDGET_TYPES = [
      { value:'',               label:'전체 유형' },
      { value:'image_banner',   label:'이미지 배너' },
      { value:'product_slider', label:'상품 슬라이더' },
      { value:'product',        label:'상품' },
      { value:'cond_product',   label:'조건상품' },
      { value:'chart_bar',      label:'차트 (Bar)' },
      { value:'chart_line',     label:'차트 (Line)' },
      { value:'chart_pie',      label:'차트 (Pie)' },
      { value:'text_banner',    label:'텍스트 배너' },
      { value:'info_card',      label:'정보 카드' },
      { value:'popup',          label:'팝업' },
      { value:'file',           label:'파일' },
      { value:'file_list',      label:'파일목록' },
      { value:'coupon',         label:'쿠폰' },
      { value:'html_editor',    label:'HTML 에디터' },
      { value:'event_banner',   label:'이벤트' },
      { value:'cache_banner',   label:'캐쉬' },
      { value:'widget_embed',   label:'위젯' },
    ];
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ️',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',    'textarea':'📋',
      'markdown':'📑',     'barcode':'🔖',          'qrcode':'📱',
      'barcode_qrcode':'🔖','video_player':'▶️',   'countdown':'⏱',
      'payment_widget':'💳','approval_widget':'✅', 'map_widget':'🗺',
    };
    const VISIBILITY_OPTS = [
      { value: '', label: '전체' },
      { value: 'PUBLIC',    label: '전체공개' },
      { value: 'MEMBER',    label: '회원공개' },
      { value: 'VERIFIED',  label: '인증회원' },
      { value: 'PREMIUM',   label: '우수회원↑' },
      { value: 'VIP',       label: 'VIP전용' },
      { value: 'INVITED',   label: '초대회원' },
      { value: 'STAFF',     label: '직원' },
      { value: 'EXECUTIVE', label: '임직원' },
    ];
    const wIcon      = (v) => WIDGET_ICONS[v] || '▪';
    const wTypeLabel = (v) => WIDGET_TYPES.find(t => t.value === v)?.label || v;

    /* ── 조회 조건 ── */
    const previewDate     = ref(today);
    const previewTime     = ref(nowTime);
    const filterType      = ref('');
    const filterStatus    = ref('활성');
    const filterVisibility = ref('');
    const filterDispEnv   = ref('PROD');
    const searchKw        = ref('');

    const applied = reactive({ type: '', status: '활성', dispEnv: 'PROD', kw: '', visibility: '' });

    const doSearch = () => {
      Object.assign(applied, {
        type:       filterType.value,
        status:     filterStatus.value,
        dispEnv:    filterDispEnv.value,
        kw:         searchKw.value.trim().toLowerCase(),
        visibility: filterVisibility.value,
      });
    };

    const resetFilter = () => {
      previewDate.value = today; previewTime.value = nowTime;
      filterType.value = ''; filterStatus.value = '활성'; filterDispEnv.value = 'PROD';
      filterVisibility.value = ''; searchKw.value = '';
      Object.assign(applied, { type: '', status: '활성', dispEnv: 'PROD', kw: '', visibility: '' });
    };

    const filteredLibs = computed(() => {
      const kw = applied.kw;
      return (props.dispDataset.widgetLibs || []).filter(lib => {
        if (applied.type   && lib.widgetType !== applied.type) return false;
        if (applied.status && lib.status     !== applied.status) return false;
        if (applied.dispEnv && lib.dispEnv && !lib.dispEnv.includes('^' + applied.dispEnv + '^')) return false;
        if (kw && !lib.name.toLowerCase().includes(kw) &&
            !(lib.tags||'').toLowerCase().includes(kw) &&
            !(lib.desc||'').toLowerCase().includes(kw)) return false;
        return true;
      });
    });

    /* ── 트리 선택 ── */
    const selectedLibId = ref(null);
    const onTreeSelect  = (lib) => { selectedLibId.value = lib.libId; };

    /* ── 트리 상태 ── */
    const tree = computed(() => {
      const map = {};
      const addToPath = (lib, pathStr) => {
        const parts = pathStr.split('>').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0];
        const rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      filteredLibs.value.forEach(lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) {
          addToPath(lib, '(미등록) > (미등록)');
        } else {
          lib.usedPaths.forEach(p => addToPath(lib, p));
        }
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          libs: map[top][sub],
        })),
      }));
    });
    const openNodes = ref(new Set());
    const toggleNode = (key) => {
      if (openNodes.value.has(key)) openNodes.value.delete(key);
      else openNodes.value.add(key);
    };
    const isOpen = (key) => openNodes.value.has(key);
    const allChildrenOpen = (node) =>
      node.children.every(sub => openNodes.value.has(node.label + '_' + sub.label));
    const toggleAllChildren = (e, node) => {
      e.stopPropagation();
      const open = !allChildrenOpen(node);
      node.children.forEach(sub => {
        const key = node.label + '_' + sub.label;
        if (open) openNodes.value.add(key);
        else openNodes.value.delete(key);
      });
      if (open) openNodes.value.add(node.label);
    };
    Vue.watchEffect(() => {
      if (!openNodes.value.has('__root__')) openNodes.value.add('__root__');
      if (tree.value.length && openNodes.value.size === 1) {
        openNodes.value.add(tree.value[0].label);
      }
    });
    const expandAll = () => { tree.value.forEach(n => openNodes.value.add(n.label)); openNodes.value.add('__root__'); };
    const collapseAll = () => { openNodes.value.clear(); openNodes.value.add('__root__'); };
    const onItemDragStart = (e, lib) => {
      window._dragWidgetLib  = lib;
      window._dragWidgetLibs = null;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', lib.libId);
    };
    const onItemDragEnd = () => { window._dragWidgetLib = null; };
    const dedupeLibs = (arr) => {
      const seen = new Set();
      return arr.filter(lib => { if (seen.has(lib.libId)) return false; seen.add(lib.libId); return true; });
    };
    const onNodeDragStart = (e, allLibs) => {
      const libs = dedupeLibs(allLibs);
      window._dragWidgetLib  = null;
      window._dragWidgetLibs = libs;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', 'node:' + libs.length);
    };
    const onNodeDragEnd = () => { window._dragWidgetLibs = null; };

    /* ── 그리드 탭 ── */
    const previewGrid = ref('grid1');
    const GRID_TABS   = [
      { id:'grid1',     label:'grid1',     cols:1 },
      { id:'grid2',     label:'grid2',     cols:2 },
      { id:'grid3',     label:'grid3',     cols:3 },
      { id:'grid4',     label:'grid4',     cols:4 },
      { id:'dashboard', label:'dashboard', cols:null },
    ];
    const GRID_COLS = { grid1:1, grid2:2, grid3:3, grid4:4 };

    /* ── 반응형 뷰포트 (grid1~4 전용) ── */
    const viewportMode = ref('desktop');
    const VIEWPORT = {
      desktop: { label:'🖥 PC',     width: null  },
      tablet:  { label:'📟 태블릿', width:'768px' },
      mobile:  { label:'📱 모바일', width:'375px' },
    };
    /* auto-fill 반응형: 뷰포트 width 제약 + 브라우저 창 리사이즈 모두 반응 */
    const autoGridCols = computed(() => {
      const map = {
        grid1: 'repeat(1,1fr)',
        grid2: 'repeat(auto-fill,minmax(max(calc(50% - 5px),260px),1fr))',
        grid3: 'repeat(auto-fill,minmax(max(calc(33.333% - 6px),190px),1fr))',
        grid4: 'repeat(auto-fill,minmax(max(calc(25% - 6px),220px),1fr))',
      };
      return map[previewGrid.value] || 'repeat(1,1fr)';
    });

    /* 실제컨텐츠 토글 */
    const showRealContent = ref(false);

    /* ── 그리드 슬롯 (탭별 동적 배열) ── */
    const makeInit = (cols) => Array(cols * 2).fill(null);
    const tabSlots = reactive({
      grid1: makeInit(1),
      grid2: makeInit(2),
      grid3: makeInit(3),
      grid4: makeInit(4),
    });
    const currentSlots = computed(() => tabSlots[previewGrid.value] || []);

    /* 마지막 행에 아이템 있으면 자동으로 행 추가 */
    const autoExpand = (tabId) => {
      const cols = GRID_COLS[tabId];
      if (!cols) return;
      const arr = tabSlots[tabId];
      const lastRowStart = arr.length - cols;
      if (arr.slice(lastRowStart).some(Boolean)) {
        for (let i = 0; i < cols; i++) arr.push(null);
      }
    };

    /* ── 드래그·드롭 (그리드) ── */
    const dragOverIdx = ref(-1);
    const onDragOver  = (e, idx) => { e.preventDefault(); dragOverIdx.value = idx; };
    const onDragLeave = () => { dragOverIdx.value = -1; };
    const onDrop = (e, idx) => {
      e.preventDefault(); dragOverIdx.value = -1;

      /* ── 노드 일괄 배치 ── */
      const nodeLibs = window._dragWidgetLibs;
      if (nodeLibs) {
        window._dragWidgetLibs = null;
        if (nodeLibs.length > 40) {
          props.showToast(`노드 하위 위젯이 ${nodeLibs.length}개로 40개를 초과합니다. 배치할 수 없습니다.`, 'error');
          return;
        }
        const tabId = previewGrid.value;
        const arr   = tabSlots[tabId];
        const cols  = GRID_COLS[tabId] || 1;
        let placed = 0, i = idx;
        while (placed < nodeLibs.length) {
          if (i >= arr.length) {
            for (let c = 0; c < cols; c++) arr.push(null);
          }
          if (!arr[i]) { arr.splice(i, 1, { ...nodeLibs[placed], colSpan: 1, rowSpan: 1 }); placed++; }
          i++;
        }
        autoExpand(tabId);
        return;
      }

      /* ── 단일 위젯 배치 ── */
      const lib = window._dragWidgetLib;
      if (!lib) return;
      const tabId = previewGrid.value;
      tabSlots[tabId].splice(idx, 1, { ...lib, colSpan: 1, rowSpan: 1 });
      autoExpand(tabId);
    };
    const removeSlot = (idx) => { tabSlots[previewGrid.value].splice(idx, 1, null); };

    /* ── colspan / rowspan 조절 ── */
    const setSpan = (idx, axis, delta) => {
      const slot = tabSlots[previewGrid.value][idx];
      if (!slot) return;
      const maxCol = GRID_COLS[previewGrid.value] || 1;
      if (axis === 'col') slot.colSpan = Math.max(1, Math.min(maxCol, (slot.colSpan || 1) + delta));
      if (axis === 'row') slot.rowSpan = Math.max(1, Math.min(4,      (slot.rowSpan || 1) + delta));
    };

    /* ── span 팝업 ── */
    const spanPopupIdx = ref(-1);
    const toggleSpanPopup = (e, idx) => {
      e.stopPropagation();
      spanPopupIdx.value = spanPopupIdx.value === idx ? -1 : idx;
    };
    const closeSpanPopup = () => { spanPopupIdx.value = -1; };

    /* ── 대시보드: 자유 배치 + 크기 조절 ── */
    const dashItems  = reactive([]); // { id, lib, x, y, w, h }
    const dashCanvas = ref(null);
    const dashDragOver = ref(false);

    const onDashDragOver = (e) => { e.preventDefault(); dashDragOver.value = true; };
    const onDashDragLeave = () => { dashDragOver.value = false; };
    const onDashDrop = (e) => {
      e.preventDefault(); dashDragOver.value = false;
      if (!dashCanvas.value) return;
      const rect = dashCanvas.value.getBoundingClientRect();

      /* ── 노드 일괄 배치 ── */
      const nodeLibs = window._dragWidgetLibs;
      if (nodeLibs) {
        window._dragWidgetLibs = null;
        if (nodeLibs.length > 40) {
          props.showToast(`노드 하위 위젯이 ${nodeLibs.length}개로 40개를 초과합니다. 배치할 수 없습니다.`, 'error');
          return;
        }
        const startX = Math.max(0, e.clientX - rect.left - 120);
        const startY = Math.max(0, e.clientY - rect.top  - 20);
        const COLS = 3, W = 260, H = 200, GAP = 10;
        nodeLibs.forEach((lib, i) => {
          const col = i % COLS, row = Math.floor(i / COLS);
          dashItems.push({ id: Date.now() + i, lib: { ...lib },
            x: startX + col * (W + GAP), y: startY + row * (H + GAP), w: W, h: H });
        });
        return;
      }

      /* ── 단일 위젯 배치 ── */
      const lib = window._dragWidgetLib;
      if (!lib) return;
      const x = Math.max(0, e.clientX - rect.left - 110);
      const y = Math.max(0, e.clientY - rect.top  - 20);
      dashItems.push({ id: Date.now(), lib: { ...lib }, x, y, w: 240, h: 180 });
    };
    const removeDashItem = (id) => {
      const i = dashItems.findIndex(d => d.id === id);
      if (i >= 0) dashItems.splice(i, 1);
    };

    /* 대시보드 아이템 이동 */
    const startItemMove = (e, item) => {
      e.preventDefault();
      const ox = e.clientX - item.x;
      const oy = e.clientY - item.y;
      const onMove = (me) => {
        item.x = Math.max(0, me.clientX - ox);
        item.y = Math.max(0, me.clientY - oy);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    /* 대시보드 아이템 크기 조절 */
    const startItemResize = (e, item) => {
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sy = e.clientY;
      const sw = item.w,    sh = item.h;
      const onMove = (me) => {
        item.w = Math.max(160, sw + (me.clientX - sx));
        item.h = Math.max(120, sh + (me.clientY - sy));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    /* ── 배치 수 / 초기화 ── */
    const placedCount = computed(() =>
      previewGrid.value === 'dashboard'
        ? dashItems.length
        : currentSlots.value.filter(Boolean).length
    );
    const resetCurrent = () => {
      if (previewGrid.value === 'dashboard') {
        dashItems.splice(0);
      } else {
        const cols = GRID_COLS[previewGrid.value];
        const arr  = tabSlots[previewGrid.value];
        arr.splice(0, arr.length, ...makeInit(cols));
      }
    };

    return {
      siteNm, today,
      WIDGET_TYPES, VISIBILITY_OPTS, VIEWPORT,
      wIcon, wTypeLabel,
      previewDate, previewTime,
      filterType, filterStatus, filterVisibility, filterDispEnv, searchKw,
      applied, doSearch,
      resetFilter, filteredLibs,
      selectedLibId, onTreeSelect,
      tree, openNodes, toggleNode, isOpen, allChildrenOpen, toggleAllChildren, expandAll, collapseAll,
      onItemDragStart, onItemDragEnd, onNodeDragStart, onNodeDragEnd,
      previewGrid, GRID_TABS,
      viewportMode, autoGridCols, showRealContent,
      tabSlots, currentSlots,
      dragOverIdx, onDragOver, onDragLeave, onDrop, removeSlot, setSpan, GRID_COLS,
      spanPopupIdx, toggleSpanPopup, closeSpanPopup,
      dashItems, dashCanvas, dashDragOver,
      onDashDragOver, onDashDragLeave, onDashDrop,
      removeDashItem, startItemMove, startItemResize,
      placedCount, resetCurrent,
    };
  },
  template: /* html */`
<div>
  <!-- 페이지 타이틀 -->
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      전시위젯미리보기
      <span style="font-size:13px;font-weight:400;color:#888;">위젯 트리 & 드래그하여 배치</span>
    </div>
    <span style="font-size:12px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:10px;padding:3px 12px;font-weight:600;">
      🌐 {{ siteNm }}
    </span>
  </div>

  <!-- 조회 조건 -->
  <div class="card" style="padding:14px 18px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">📅 전시일시</span>
        <input type="date" v-model="previewDate" class="form-control" style="width:136px;margin:0;font-size:12px;" />
        <input type="time" v-model="previewTime" class="form-control" style="width:90px;margin:0;font-size:12px;" />
        <button @click="previewDate=today;previewTime=new Date().toTimeString().slice(0,5)"
          style="font-size:11px;padding:3px 8px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;">🕐 현재</button>
      </div>
      <div style="width:1px;height:24px;background:#e0e0e0;"></div>
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">상태</span>
        <select v-model="filterStatus" class="form-control" style="width:76px;margin:0;font-size:12px;">
          <option value="">전체</option><option value="활성">활성</option><option value="비활성">비활성</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">환경</span>
        <select v-model="filterDispEnv" class="form-control" style="width:76px;margin:0;font-size:12px;">
          <option value="">전체</option><option value="PLAN">준비/계획</option><option value="DEV">DEV</option><option value="TEST">TEST</option><option value="PROD">PROD</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">공개대상</span>
        <select v-model="filterVisibility" class="form-control" style="width:100px;margin:0;font-size:12px;">
          <option v-for="o in VISIBILITY_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div style="width:1px;height:24px;background:#e0e0e0;"></div>
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">위젯유형</span>
        <select v-model="filterType" class="form-control" style="width:114px;margin:0;font-size:12px;">
          <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <input v-model="searchKw" class="form-control" placeholder="이름·태그 검색" style="margin:0;width:130px;font-size:12px;" />
      <span style="font-size:12px;color:#888;">총 <b>{{ filteredLibs.length }}</b>건</span>
      <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
        <button @click="doSearch" class="btn btn-primary btn-sm" style="height:30px;padding:0 14px;">검색</button>
        <button @click="resetFilter" class="btn btn-secondary btn-sm" style="height:30px;padding:0 12px;">초기화</button>
      </div>
    </div>
  </div>

  <!-- 2단 레이아웃 -->
  <div style="display:flex;gap:12px;height:calc(100vh - 240px);min-height:500px;align-items:stretch;">

    <!-- 왼쪽: 트리 (카드) -->
    <div class="card" style="width:340px;flex-shrink:0;display:flex;flex-direction:column;padding:0;overflow:hidden;">
      <div style="padding:7px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;font-weight:700;color:#555;background:#fafafa;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
        <span>표시경로</span>
        <span style="font-size:10px;color:#aaa;font-weight:400;">⠿ 드래그하여 배치</span>
      </div>
      <!-- 전체펼치기 / 전체닫기 -->
      <div style="padding:6px 12px;display:flex;gap:4px;border-bottom:1px solid #f0f0f0;background:#fff;flex-shrink:0;">
        <button @click="expandAll"
          style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">
          ▼ 전체펼치기
        </button>
        <button @click="collapseAll"
          style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">
          ▶ 전체닫기
        </button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:4px 0;">
        <!-- 루트 노드 -->
        <div @click="toggleNode('__root__')"
          style="display:flex;align-items:center;gap:6px;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:700;color:#222;user-select:none;background:#f8f9fb;border-radius:4px;margin:1px 4px;"
          :style="isOpen('__root__') ? 'background:#f0f4ff;' : ''">
          <span style="font-size:10px;color:#9ca3af;transition:transform .2s;"
            :style="isOpen('__root__') ? 'transform:rotate(90deg);' : ''">▶</span>
          <span>📂 전체</span>
          <span style="margin-left:auto;font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:8px;padding:0 6px;">
            {{ tree.reduce((acc,n)=>acc+n.children.reduce((a,c)=>a+c.libs.length,0),0) }}
          </span>
        </div>
        <div v-if="isOpen('__root__')" style="padding-left:8px;">
        <div v-for="node in tree" :key="node.label">
          <div @click="toggleNode(node.label)"
            draggable="true"
            @dragstart="onNodeDragStart($event, node.children.flatMap(c => c.libs))"
            @dragend="onNodeDragEnd"
            style="display:flex;align-items:center;gap:6px;padding:6px 12px;cursor:grab;font-size:12px;font-weight:700;color:#374151;user-select:none;border-radius:4px;margin:1px 4px;"
            :style="isOpen(node.label) ? 'background:#f0f4ff;' : ''">
            <span style="font-size:10px;color:#9ca3af;transition:transform .2s;"
              :style="isOpen(node.label) ? 'transform:rotate(90deg);' : ''">▶</span>
            <span>{{ node.label }}</span>
            <span style="margin-left:auto;font-size:10px;background:#e5e7eb;color:#6b7280;border-radius:8px;padding:0 6px;">
              {{ node.children.reduce((acc,c)=>acc+c.libs.length,0) }}
            </span>
          </div>
          <template v-if="isOpen(node.label)">
            <div v-for="sub in node.children" :key="node.label+'_'+sub.label">
              <div @click="toggleNode(node.label+'_'+sub.label)"
                draggable="true"
                @dragstart="onNodeDragStart($event, sub.libs)"
                @dragend="onNodeDragEnd"
                style="display:flex;align-items:center;gap:6px;padding:5px 12px 5px 26px;cursor:grab;font-size:11px;font-weight:600;color:#4b5563;border-radius:4px;margin:1px 4px;"
                :style="isOpen(node.label+'_'+sub.label) ? 'background:#f9fafb;' : ''">
                <span style="font-size:9px;color:#9ca3af;transition:transform .2s;"
                  :style="isOpen(node.label+'_'+sub.label) ? 'transform:rotate(90deg);' : ''">▶</span>
                <span>{{ sub.label }}</span>
                <span style="margin-left:auto;font-size:10px;background:#e5e7eb;color:#6b7280;border-radius:8px;padding:0 5px;">{{ sub.libs.length }}</span>
              </div>
              <template v-if="isOpen(node.label+'_'+sub.label)">
                <div v-for="lib in sub.libs" :key="lib.libId"
                  draggable="true"
                  @dragstart="onItemDragStart($event, lib)"
                  @dragend="onItemDragEnd"
                  @click="onTreeSelect(lib)"
                  style="display:flex;align-items:center;gap:7px;padding:5px 10px 5px 42px;cursor:grab;font-size:11px;border-radius:4px;margin:1px 4px;transition:background .15s;"
                  :style="selectedLibId===lib.libId ? 'background:#dbeafe;color:#1d4ed8;font-weight:700;' : 'color:#374151;'">
                  <span style="font-size:9px;color:#c4c4c4;flex-shrink:0;">⠿</span>
                  <span style="font-size:13px;flex-shrink:0;">{{ wIcon(lib.widgetType) }}</span>
                  <span style="font-size:9px;background:#f0f4ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:3px;padding:0 4px;white-space:nowrap;flex-shrink:0;">{{ lib.widgetType ? lib.widgetType.replace('_',' ') : '-' }}</span>
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ lib.name }}</span>
                  <span style="font-size:9px;color:#9ca3af;flex-shrink:0;">#{{ String(lib.libId).padStart(4,'0') }}</span>
                </div>
              </template>
            </div>
          </template>
        </div>
        </div><!-- /root children -->
        <div v-if="!tree.length" style="padding:24px;text-align:center;color:#ccc;font-size:12px;">위젯이 없습니다.</div>
      </div>
    </div>

    <!-- 오른쪽 (카드) -->
    <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:#f0f2f5;min-width:0;padding:0;">

      <!-- 탭바 + 뷰포트 토글 + 배치수 -->
      <div style="display:flex;align-items:stretch;background:#f8f9fa;border-bottom:1px solid #e8e8e8;flex-shrink:0;padding:0 12px;">
        <div style="display:flex;gap:2px;align-items:flex-end;padding-top:8px;flex:1;">
          <button v-for="tab in GRID_TABS" :key="tab.id" @click="previewGrid=tab.id"
            style="padding:5px 14px;border:1px solid transparent;border-bottom:none;border-radius:6px 6px 0 0;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;margin-bottom:-1px;"
            :style="previewGrid===tab.id
              ? 'background:#fff;border-color:#e8e8e8;border-bottom-color:#fff;color:#1d4ed8;z-index:1;'
              : 'background:transparent;color:#9ca3af;'">
            {{ tab.label }}
          </button>
        </div>
        <!-- 실제컨텐츠 + 뷰포트 토글 (dashboard 제외) -->
        <div v-if="previewGrid!=='dashboard'" style="display:flex;align-items:center;gap:4px;padding:6px 0 6px 12px;border-left:1px solid #e5e7eb;margin-left:8px;">
          <button @click="showRealContent=!showRealContent"
            style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;margin-right:4px;"
            :style="showRealContent?'background:#059669;color:#fff;border-color:#059669;':'background:#fff;color:#6b7280;'">
            {{ showRealContent ? '✅ 실제컨텐츠' : '👁 실제컨텐츠' }}
          </button>
          <div style="width:1px;height:18px;background:#e5e7eb;margin-right:2px;"></div>
          <button v-for="(vp, key) in VIEWPORT" :key="key" @click="viewportMode=key"
            style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
            :style="viewportMode===key
              ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;'
              : 'background:#fff;color:#6b7280;'">
            {{ vp.label }}
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:0 0 0 12px;">
          <span style="font-size:12px;color:#555;font-weight:600;">{{ placedCount }}개</span>
          <button @click="resetCurrent"
            style="font-size:11px;padding:3px 10px;border:1px solid #d0d0d0;border-radius:6px;background:#fff;cursor:pointer;color:#666;white-space:nowrap;">초기화</button>
        </div>
      </div>

      <!-- ── 그리드 캔버스 (grid1~4) ── -->
      <div v-if="previewGrid!=='dashboard'" @click="closeSpanPopup" style="flex:1;overflow-y:auto;overflow-x:auto;padding:16px;">
        <!-- 뷰포트 래퍼 -->
        <div :style="{
          width: VIEWPORT[viewportMode].width || '100%',
          maxWidth: VIEWPORT[viewportMode].width || '100%',
          margin: '0 auto',
          transition: 'width .3s',
        }">
          <!-- 디바이스 프레임 표시 -->
          <div v-if="viewportMode!=='desktop'"
            style="text-align:center;margin-bottom:8px;font-size:11px;color:#9ca3af;font-weight:600;">
            {{ viewportMode==='mobile' ? '📱 375px' : '📟 768px' }}
          </div>
          <div :style="{
            border: viewportMode!=='desktop' ? '2px solid #d1d5db' : 'none',
            borderRadius: viewportMode!=='desktop' ? '12px' : '0',
            padding: viewportMode!=='desktop' ? '12px' : '0',
            background: '#fff',
            boxShadow: viewportMode!=='desktop' ? '0 4px 20px rgba(0,0,0,.12)' : 'none',
          }">
            <div :style="{
              display: 'grid',
              gridTemplateColumns: autoGridCols,
              gap: '10px',
            }">
              <template v-for="(slot, idx) in currentSlots" :key="idx">
              <div v-if="!showRealContent || slot"
                @dragover="onDragOver($event, idx)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, idx)"
                style="border-radius:8px;transition:all .15s;position:relative;"
                :style="[
                  dragOverIdx===idx
                    ? 'border:2px dashed #1d4ed8;background:#eff6ff;min-height:110px;'
                    : slot
                      ? (showRealContent ? 'border:none;background:transparent;min-height:0;' : 'border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.07);min-height:110px;')
                      : 'border:2px dashed #d1d5db;background:#f9fafb;min-height:60px;',
                  slot && (slot.colSpan||1) > 1 ? { gridColumn: 'span ' + slot.colSpan } : {},
                  slot && (slot.rowSpan||1) > 1 ? { gridRow:    'span ' + slot.rowSpan } : {},
                ]">

                <!-- 비어있음 -->
                <div v-if="!slot && dragOverIdx!==idx"
                  style="height:100%;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#d1d5db;padding:10px;">
                  <span style="font-size:20px;">+</span>
                  <span style="font-size:11px;">드래그하여 추가</span>
                </div>

                <!-- 드롭 오버 -->
                <div v-else-if="!slot && dragOverIdx===idx"
                  style="min-height:60px;display:flex;align-items:center;justify-content:center;color:#1d4ed8;font-size:12px;font-weight:700;padding:10px;">
                  ▼ 여기에 추가
                </div>

                <!-- 배치됨 -->
                <template v-else-if="slot">
                  <!-- 슬롯 헤더 (실제컨텐츠 OFF) -->
                  <div v-if="!showRealContent" style="display:flex;align-items:center;gap:5px;padding:6px 10px 5px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
                    <span style="font-size:12px;">{{ wIcon(slot.widgetType) }}</span>
                    <span style="font-size:10px;background:#f0f4ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:4px;padding:0 5px;white-space:nowrap;">{{ wTypeLabel(slot.widgetType) }}</span>
                    <span style="font-size:11px;font-weight:600;color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ slot.name }}</span>
                    <!-- span 설정 아이콘 -->
                    <button @click="toggleSpanPopup($event, idx)"
                      :title="'열 ' + (slot.colSpan||1) + ' × 행 ' + (slot.rowSpan||1)"
                      style="flex-shrink:0;width:22px;height:22px;border-radius:4px;border:1px solid #e5e7eb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
                      :style="spanPopupIdx===idx ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;' : 'background:#f9fafb;color:#6b7280;'">⚙</button>
                    <button @click="removeSlot(idx)"
                      style="flex-shrink:0;width:17px;height:17px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
                  </div>

                  <!-- span 설정 레이어 팝업 -->
                  <div v-if="spanPopupIdx===idx" @click.stop
                    style="position:absolute;top:36px;right:6px;z-index:20;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:12px 14px;min-width:170px;">
                    <!-- 닫기 -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                      <span style="font-size:11px;font-weight:700;color:#374151;">그리드 스팬 설정</span>
                      <button @click="closeSpanPopup" style="border:none;background:none;cursor:pointer;font-size:13px;color:#9ca3af;padding:0;line-height:1;">✕</button>
                    </div>
                    <!-- 열(colspan) -->
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                      <span style="font-size:11px;color:#6b7280;width:36px;">열 span</span>
                      <button @click="setSpan(idx,'col',-1)" :disabled="(slot.colSpan||1)<=1"
                        style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                        :style="(slot.colSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                      <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;">{{ slot.colSpan||1 }}</span>
                      <button @click="setSpan(idx,'col',+1)" :disabled="(slot.colSpan||1)>=(GRID_COLS[previewGrid]||1)"
                        style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                        :style="(slot.colSpan||1)>=(GRID_COLS[previewGrid]||1)?'opacity:.3;cursor:default;':''">+</button>
                      <span style="font-size:10px;color:#9ca3af;">/ {{ GRID_COLS[previewGrid]||1 }}</span>
                    </div>
                    <!-- 행(rowspan) -->
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:11px;color:#6b7280;width:36px;">행 span</span>
                      <button @click="setSpan(idx,'row',-1)" :disabled="(slot.rowSpan||1)<=1"
                        style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                        :style="(slot.rowSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                      <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;">{{ slot.rowSpan||1 }}</span>
                      <button @click="setSpan(idx,'row',+1)" :disabled="(slot.rowSpan||1)>=4"
                        style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                        :style="(slot.rowSpan||1)>=4?'opacity:.3;cursor:default;':''">+</button>
                      <span style="font-size:10px;color:#9ca3af;">/ 4</span>
                    </div>
                  </div>
                  <!-- 실제컨텐츠 ON: ×버튼만 -->
                  <div v-else style="position:relative;">
                    <button @click="removeSlot(idx)"
                      style="position:absolute;top:4px;right:4px;z-index:5;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,.3);color:#fff;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
                  </div>
                  <!-- 위젯미리보기 -->
                  <widget-preview :lib="slot" />
                </template>

              </div><!-- /slot -->
              </template>
            </div><!-- /grid -->
          </div><!-- /device frame -->
        </div><!-- /viewport wrapper -->
      </div><!-- /grid canvas -->

      <!-- ── 대시보드 캔버스 (자유 배치) ── -->
      <div v-else style="flex:1;overflow:auto;padding:16px;">
        <div
          ref="dashCanvas"
          @dragover="onDashDragOver"
          @dragleave="onDashDragLeave"
          @drop="onDashDrop"
          style="position:relative;min-height:560px;min-width:600px;background:#fff;border-radius:8px;border:2px dashed #e5e7eb;transition:border-color .15s;"
          :style="dashDragOver ? 'border-color:#1d4ed8;background:#eff6ff;' : ''">

          <!-- 빈 상태 -->
          <div v-if="!dashItems.length && !dashDragOver"
            style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#d1d5db;pointer-events:none;">
            <span style="font-size:48px;">🧩</span>
            <span style="font-size:13px;">왼쪽 트리에서 위젯을 드래그하여 배치하세요</span>
          </div>
          <div v-if="dashDragOver && !dashItems.length"
            style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#1d4ed8;font-size:14px;font-weight:700;pointer-events:none;">
            ▼ 여기에 배치
          </div>

          <!-- 배치된 아이템 -->
          <div v-for="item in dashItems" :key="item.id"
            :style="{
              position:'absolute',
              left: item.x+'px',
              top:  item.y+'px',
              width: item.w+'px',
              minHeight: item.h+'px',
              border:'1px solid #e5e7eb',
              borderRadius:'8px',
              background:'#fff',
              boxShadow:'0 2px 10px rgba(0,0,0,.1)',
              userSelect:'none',
              zIndex: 1,
            }">

            <!-- 이동 핸들 헤더 -->
            <div
              @mousedown="startItemMove($event, item)"
              style="display:flex;align-items:center;gap:5px;padding:6px 10px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;cursor:move;">
              <span style="font-size:10px;color:#c4c4c4;letter-spacing:1px;">⠿⠿</span>
              <span style="font-size:12px;">{{ wIcon(item.lib.widgetType) }}</span>
              <span style="font-size:11px;background:#f0f4ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:4px;padding:0 5px;white-space:nowrap;flex-shrink:0;">{{ wTypeLabel(item.lib.widgetType) }}</span>
              <span style="font-size:11px;font-weight:600;color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">{{ item.lib.name }}</span>
              <button @mousedown.stop @click="removeDashItem(item.id)"
                style="flex-shrink:0;width:18px;height:18px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
            </div>

            <!-- 위젯미리보기 -->
            <div style="overflow:hidden;" :style="{maxHeight:(item.h-40)+'px'}">
              <widget-preview :lib="item.lib" />
            </div>

            <!-- 크기 조절 핸들 -->
            <div
              @mousedown="startItemResize($event, item)"
              style="position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:se-resize;border-radius:0 0 8px 0;overflow:hidden;">
              <div style="width:0;height:0;border-style:solid;border-width:0 0 18px 18px;border-color:transparent transparent #d1d5db transparent;position:absolute;right:0;bottom:0;"></div>
            </div>

            <!-- 크기 표시 -->
            <div style="position:absolute;right:22px;bottom:3px;font-size:9px;color:#c4c4c4;pointer-events:none;user-select:none;">
              {{ Math.round(item.w) }}×{{ Math.round(item.h) }}
            </div>
          </div>

        </div><!-- /dashCanvas -->
      </div><!-- /dashboard -->

    </div><!-- /오른쪽 -->
  </div><!-- /2단 -->
</div>
  `,
  components: {
    WidgetPreview: _WP_DispWidgetPreview,
  },
};

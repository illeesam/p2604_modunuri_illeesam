/* ShopJoy - Sample14: 전시영역 구조 트리 보기 (Tab2) */
window.XsSample14 = {
  name: 'XsSample14',
  components: { 'category-select-modal': window.CategorySelectModal },
  setup() {
    const { ref, reactive, computed } = Vue;

    const today = new Date().toISOString().slice(0, 10);
    const previewDate = ref(today);
    const previewTime = ref(new Date().toTimeString().slice(0, 5));
    const showAreaDrop  = ref(false);
    const selectedAreas = reactive(new Set());
    const expandedAreas = reactive(new Set());
    const checkedPanels  = reactive(new Set());
    const checkedWidgets = reactive(new Set()); // key: dispId_wi

    /* 카테고리 선택 */
    const showCatModal   = ref(false);
    const selectedCatIds = reactive(new Set());
    const allCats = computed(() => ((window.adminData || {}).categories || []).filter(c => c.status === '활성'));
    const selectedCatNames = computed(() => [...selectedCatIds].map(id => { const c = allCats.value.find(c => c.categoryId === id); return c ? c.categoryNm : ''; }).filter(Boolean));
    const catBtnLabel = computed(() => {
      if (selectedCatIds.size === 0) return '카테고리';
      return selectedCatIds.size <= 2 ? selectedCatNames.value.join(', ') : `${selectedCatIds.size}개`;
    });
    const onCatApply = (ids) => { selectedCatIds.clear(); ids.forEach(id => selectedCatIds.add(id)); };

    /* 현재 사용자 인증 상태 */
    const auth       = window.useFrontAuthStore ? window.useFrontAuthStore() : null;
    const isLoggedIn = auth ? auth.isLoggedIn : false;
    const userGrade  = (auth && auth.user) ? (auth.user.grade  || '일반') : '';
    const userName   = (auth && auth.user) ? (auth.user.userName || auth.user.email || '') : '';

    /* 검색 필터 */
    const searchStatus       = ref('활성');
    const searchCondition    = ref('');
    const searchAuthRequired = ref('');
    const searchAuthGrade    = ref('');
    const CONDITION_OPTS  = ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'];
    const AUTH_GRADE_OPTS = ['일반', '우수', 'VIP'];

    const accessibleConds = computed(() => {
      const c = ['항상 표시'];
      if (!isLoggedIn) { c.push('비로그인 전용'); return c; }
      c.push('로그인 필요');
      if (userGrade === '우수' || userGrade === 'VIP') c.push('로그인+우수');
      if (userGrade === 'VIP') c.push('로그인+VIP');
      return c;
    });

    const WIDGET_LABELS = {
      image_banner:'이미지 배너', product_slider:'상품 슬라이더', product:'상품',
      cond_product:'조건상품',   chart_bar:'차트(Bar)',          chart_line:'차트(Line)',
      chart_pie:'차트(Pie)',     text_banner:'텍스트 배너',      info_card:'정보카드',
      popup:'팝업',              file:'파일',                    file_list:'파일목록',
      coupon:'쿠폰',             html_editor:'HTML 에디터',      event_banner:'이벤트',
      cache_banner:'캐시',       widget_embed:'위젯',
    };
    const WIDGET_ICONS = {
      image_banner:'🖼', product_slider:'🛒', product:'📦',
      cond_product:'🔍', chart_bar:'📊',      chart_line:'📈',
      chart_pie:'🥧',   text_banner:'📝',     info_card:'ℹ',
      popup:'💬',        file:'📎',            file_list:'📁',
      coupon:'🎟',       html_editor:'📄',     event_banner:'🎉',
      cache_banner:'💰', widget_embed:'🧩',
    };
    const wLabel = (t) => WIDGET_LABELS[t] || t || '-';
    const wIcon  = (t) => WIDGET_ICONS[t] || '▪';

    const allAreas = computed(() =>
      ((window.adminData || {}).codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    const isInRange = (panel) => {
      const d = previewDate.value;
      if (!d) return true;
      const dt = `${d} ${previewTime.value || '00:00'}`;
      if (panel.dispStartDate && dt < `${panel.dispStartDate} ${panel.dispStartTime || '00:00'}`) return false;
      if (panel.dispEndDate   && dt > `${panel.dispEndDate}   ${panel.dispEndTime   || '23:59'}`) return false;
      return true;
    };

    const panelFilter = (p) => {
      if (searchStatus.value       && p.status !== searchStatus.value) return false;
      if (!isInRange(p)) return false;
      if (searchCondition.value    && (p.condition || '항상 표시') !== searchCondition.value) return false;
      if (searchAuthRequired.value === 'Y' && !p.authRequired) return false;
      if (searchAuthRequired.value === 'N' &&  p.authRequired) return false;
      if (searchAuthGrade.value    && p.authGrade !== searchAuthGrade.value) return false;
      if (selectedCatIds.size > 0) {
        const names = selectedCatNames.value;
        const hit = names.some(nm => p.name.includes(nm)) ||
                    (p.rows || []).some(w => names.some(nm => (w.widgetNm || '').includes(nm)));
        if (!hit) return false;
      }
      return true;
    };

    /* 영역별 패널 목록 */
    const structAreaList = computed(() => {
      return allAreas.value
        .filter(a => selectedAreas.size === 0 || selectedAreas.has(a.codeValue))
        .map(area => {
          const panels = ((window.adminData || {}).displays || [])
            .filter(p => p.area === area.codeValue && panelFilter(p))
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          return { ...area, panels };
        });
    });

    /* 초기 펼침 */
    const initExpand = () => allAreas.value.forEach(a => expandedAreas.add(a.codeValue));

    /* 영역 토글 */
    const toggleAreaExpand = (code) => {
      if (expandedAreas.has(code)) expandedAreas.delete(code);
      else expandedAreas.add(code);
    };

    /* 패널 체크 */
    const togglePanel = (p) => {
      const id = p.dispId;
      const rows = p.rows || [];
      if (checkedPanels.has(id)) {
        checkedPanels.delete(id);
        rows.forEach((_, wi) => checkedWidgets.delete(`${id}_${wi}`));
      } else {
        checkedPanels.add(id);
        rows.forEach((_, wi) => checkedWidgets.add(`${id}_${wi}`));
      }
    };

    /* 위젯 체크 */
    const toggleWidget = (dispId, wi, e) => {
      if (e) e.stopPropagation();
      const key = `${dispId}_${wi}`;
      if (checkedWidgets.has(key)) checkedWidgets.delete(key);
      else checkedWidgets.add(key);
    };

    /* 전체 선택/해제 */
    const checkAll  = () => { structAreaList.value.forEach(a => a.panels.forEach(p => { checkedPanels.add(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.add(`${p.dispId}_${wi}`)); })); };
    const clearAll  = () => { checkedPanels.clear(); checkedWidgets.clear(); };

    /* 영역 전체 체크 */
    const isAreaAllChecked = (area) =>
      area.panels.length > 0 &&
      area.panels.every(p => checkedPanels.has(p.dispId)) &&
      area.panels.every(p => (p.rows||[]).every((_,wi) => checkedWidgets.has(`${p.dispId}_${wi}`)));

    const checkAreaAll = (area) => {
      if (isAreaAllChecked(area)) {
        area.panels.forEach(p => { checkedPanels.delete(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.delete(`${p.dispId}_${wi}`)); });
      } else {
        area.panels.forEach(p => { checkedPanels.add(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.add(`${p.dispId}_${wi}`)); });
      }
    };

    const isPanelAllChecked = (p) =>
      checkedPanels.has(p.dispId) &&
      ((p.rows||[]).length === 0 || (p.rows||[]).every((_,wi) => checkedWidgets.has(`${p.dispId}_${wi}`)));

    /* 선택 위젯 목록 */
    const checkedWidgetList = computed(() => {
      const result = [];
      structAreaList.value.forEach(a =>
        a.panels.forEach(p =>
          (p.rows||[]).forEach((w, wi) => {
            if (checkedWidgets.has(`${p.dispId}_${wi}`))
              result.push({ ...w, _dispId: p.dispId, _panelNm: p.name, _area: a.codeLabel, _wi: wi });
          })
        )
      );
      return result;
    });

    /* 화면영역 드롭다운 */
    const areaBtnLabel = computed(() => selectedAreas.size === 0 ? '전체 영역' : `${selectedAreas.size}개 선택`);
    const toggleArea = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };
    const selectAllAreas = () => { allAreas.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas  = () => { selectedAreas.clear(); };

    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

    /* 드래그&드롭 — 탭별 미리보기 */
    const TABS      = ['grid1', 'grid2', 'grid3', 'grid4', 'dashboard'];
    const activeTab = ref('grid1');
    const GRID_COLS = { grid1: 1, grid2: 2, grid3: 3, grid4: 4 };

    // grid1~4 — N열 셀 배열 (초기 2행)
    const mkCells = (n) => Array.from({ length: n * 2 }, () => ({ widget: null }));
    const gridCells = reactive({ grid1: mkCells(1), grid2: mkCells(2), grid3: mkCells(3), grid4: mkCells(4) });

    // dashboard — 자유 배치
    const dashItems  = reactive([]);
    const DASH_SNAP  = 20;
    const dashDrag   = reactive({ on: false, idx: -1, sx: 0, sy: 0, ox: 0, oy: 0 });
    const dashResize = reactive({ on: false, idx: -1, sx: 0, sy: 0, ow: 0, oh: 0 });

    // 위젯 색상
    const WIDGET_COLORS = {
      image_banner:'#667eea', product_slider:'#e8587a', product:'#e8587a',
      cond_product:'#1565c0', chart_bar:'#667eea',      chart_line:'#667eea',
      chart_pie:'#667eea',   text_banner:'#546e7a',     info_card:'#1565c0',
      popup:'#546e7a',       file:'#607d8b',            file_list:'#607d8b',
      coupon:'#e8587a',      html_editor:'#263238',     event_banner:'#f5576c',
      cache_banner:'#ef6c00',widget_embed:'#718096',
    };
    const wColor = (t) => WIDGET_COLORS[t] || '#888';

    // 헤더 카운트용
    const previewWidgets = computed(() => {
      if (activeTab.value === 'dashboard') return dashItems;
      return (gridCells[activeTab.value] || []).filter(c => c.widget);
    });

    const dragSrc      = ref(null);
    const dragSrcList  = ref(null);
    const dropZoneIdx  = ref(-1);

    const onWidgetDragStart = (w, p, area, evt) => {
      dragSrc.value     = { ...w, _dispId: p.dispId, _panelNm: p.name, _area: area.codeLabel };
      dragSrcList.value = null;
      evt.dataTransfer.effectAllowed = 'copy';
    };
    const onAreaNodeDragStart = (area, evt) => {
      const widgets = (area.panels || []).flatMap(p =>
        (p.rows || []).map(w => ({ ...w, _dispId: p.dispId, _panelNm: p.name, _area: area.codeLabel }))
      );
      dragSrcList.value = widgets;
      dragSrc.value     = null;
      evt.dataTransfer.effectAllowed = 'copy';
      evt.dataTransfer.setData('text/plain', 'area:' + widgets.length);
    };
    const onPanelNodeDragStart = (p, area, evt) => {
      const widgets = (p.rows || []).map(w => ({ ...w, _dispId: p.dispId, _panelNm: p.name, _area: area.codeLabel }));
      dragSrcList.value = widgets;
      dragSrc.value     = null;
      evt.dataTransfer.effectAllowed = 'copy';
      evt.dataTransfer.setData('text/plain', 'panel:' + widgets.length);
    };
    const onDragEnd = () => { dragSrc.value = null; dragSrcList.value = null; dropZoneIdx.value = -1; };

    /* ── span 팝업 ── */
    const spanPopupIdx = ref(-1); // 'tab_ci' 형태 키
    const toggleSpanPopup = (e, tab, ci) => {
      e.stopPropagation();
      const key = tab + '_' + ci;
      spanPopupIdx.value = spanPopupIdx.value === key ? null : key;
    };
    const closeSpanPopup = () => { spanPopupIdx.value = null; };
    const setSpan = (tab, ci, axis, delta) => {
      const cell = gridCells[tab][ci];
      if (!cell || !cell.widget) return;
      const maxCol = GRID_COLS[tab] || 1;
      if (axis === 'col') cell.colSpan = Math.max(1, Math.min(maxCol, (cell.colSpan || 1) + delta));
      if (axis === 'row') cell.rowSpan = Math.max(1, Math.min(4,      (cell.rowSpan || 1) + delta));
    };

    /* 빈 행 2개 유지 헬퍼 */
    const ensureTrailingRows = (cells, cols) => {
      let emptyRows = 0;
      const totalRows = Math.ceil(cells.length / cols);
      for (let r = totalRows - 1; r >= 0; r--) {
        if (cells.slice(r * cols, (r + 1) * cols).every(c => !c.widget)) emptyRows++;
        else break;
      }
      while (emptyRows < 2) {
        for (let c = 0; c < cols; c++) cells.push({ widget: null });
        emptyRows++;
      }
    };

    /* grid2/3/4 */
    const onCellDrop = (tab, ci, evt) => {
      evt.preventDefault();
      const cols = GRID_COLS[tab];
      const cells = gridCells[tab];

      if (dragSrcList.value) {
        const list = dragSrcList.value;
        if (list.length > 40) {
          window.alert(`위젯이 ${list.length}개입니다. 한 번에 최대 40개까지만 배치할 수 있습니다.`);
          dragSrcList.value = null; dropZoneIdx.value = -1; return;
        }
        /* ci부터 순서대로 빈 슬롯에 배치 */
        let placed = 0;
        for (let i = ci; i < cells.length && placed < list.length; i++) {
          if (!cells[i].widget) { cells[i] = { widget: { ...list[placed++] }, colSpan: 1, rowSpan: 1 }; }
        }
        /* 아직 남은 경우 뒤에 행 추가하며 배치 */
        while (placed < list.length) {
          const startIdx = cells.length;
          for (let c = 0; c < cols; c++) cells.push({ widget: null });
          for (let c = 0; c < cols && placed < list.length; c++) {
            cells[startIdx + c] = { widget: { ...list[placed++] }, colSpan: 1, rowSpan: 1 };
          }
        }
        ensureTrailingRows(cells, cols);
        dragSrcList.value = null; dropZoneIdx.value = -1; return;
      }

      if (!dragSrc.value) return;
      cells[ci] = { widget: { ...dragSrc.value }, colSpan: 1, rowSpan: 1 };
      ensureTrailingRows(cells, cols);
      dragSrc.value = null;
      dropZoneIdx.value = -1;
    };
    const removeCellWidget = (tab, ci) => { gridCells[tab][ci] = { widget: null }; };

    /* dashboard */
    const onDashDrop = (evt) => {
      evt.preventDefault();
      const rect = evt.currentTarget.getBoundingClientRect();
      const snap = DASH_SNAP;

      if (dragSrcList.value) {
        const list = dragSrcList.value;
        if (list.length > 40) {
          window.alert(`위젯이 ${list.length}개입니다. 한 번에 최대 40개까지만 배치할 수 있습니다.`);
          dragSrcList.value = null; dropZoneIdx.value = -1; return;
        }
        let baseX = Math.max(0, Math.round((evt.clientX - rect.left - 80) / snap) * snap);
        let baseY = Math.max(0, Math.round((evt.clientY - rect.top  - 14) / snap) * snap);
        list.forEach((w, i) => {
          dashItems.push({ widget: { ...w }, x: baseX + (i % 4) * 220, y: baseY + Math.floor(i / 4) * 180, w: 200, h: 160 });
        });
        dragSrcList.value = null; dropZoneIdx.value = -1; return;
      }

      if (!dragSrc.value) return;
      const x = Math.max(0, Math.round((evt.clientX - rect.left - 80) / snap) * snap);
      const y = Math.max(0, Math.round((evt.clientY - rect.top  - 14) / snap) * snap);
      dashItems.push({ widget: { ...dragSrc.value }, x, y, w: 200, h: 160 });
      dragSrc.value = null;
      dropZoneIdx.value = -1;
    };
    const onDashItemMd = (idx, evt) => {
      dashDrag.on = true; dashDrag.idx = idx;
      dashDrag.sx = evt.clientX; dashDrag.sy = evt.clientY;
      dashDrag.ox = dashItems[idx].x; dashDrag.oy = dashItems[idx].y;
      evt.preventDefault();
    };
    const onDashResizeMd = (idx, evt) => {
      dashResize.on = true; dashResize.idx = idx;
      dashResize.sx = evt.clientX; dashResize.sy = evt.clientY;
      dashResize.ow = dashItems[idx].w; dashResize.oh = dashItems[idx].h;
      evt.preventDefault(); evt.stopPropagation();
    };
    const onDashMm = (evt) => {
      if (dashDrag.on && dashDrag.idx >= 0) {
        const snap = DASH_SNAP, dx = evt.clientX - dashDrag.sx, dy = evt.clientY - dashDrag.sy;
        dashItems[dashDrag.idx].x = Math.max(0, Math.round((dashDrag.ox + dx) / snap) * snap);
        dashItems[dashDrag.idx].y = Math.max(0, Math.round((dashDrag.oy + dy) / snap) * snap);
      }
      if (dashResize.on && dashResize.idx >= 0) {
        const snap = DASH_SNAP, dx = evt.clientX - dashResize.sx, dy = evt.clientY - dashResize.sy;
        dashItems[dashResize.idx].w = Math.max(120, Math.round((dashResize.ow + dx) / snap) * snap);
        dashItems[dashResize.idx].h = Math.max(80,  Math.round((dashResize.oh + dy) / snap) * snap);
      }
    };
    const onDashMu = () => {
      dashDrag.on = false; dashDrag.idx = -1;
      dashResize.on = false; dashResize.idx = -1;
    };
    const removeDashItem = (idx) => { dashItems.splice(idx, 1); };

    /* 탭별 초기화 */
    const clearPreview = () => {
      const tab = activeTab.value;
      if (GRID_COLS[tab]) {
        const cells = gridCells[tab], cols = GRID_COLS[tab];
        cells.splice(0, cells.length);
        for (let i = 0; i < cols * 2; i++) cells.push({ widget: null });
      } else if (tab === 'dashboard') {
        dashItems.splice(0, dashItems.length);
      }
    };

    /* 위젯 정보 팝오버 */
    const popoverKey    = ref(null);
    const popoverWidget = ref(null);
    const popoverArea   = ref(null);
    const popoverPanel  = ref(null);
    const popoverPos    = reactive({ top: 0, left: 0 });
    const showWidgetInfo = (w, p, area, key, evt) => {
      evt.stopPropagation();
      if (popoverKey.value === key) { popoverKey.value = null; return; }
      const rect = evt.currentTarget.getBoundingClientRect();
      popoverPos.top  = rect.bottom + 6;
      popoverPos.left = Math.min(rect.left, window.innerWidth - 316);
      popoverWidget.value = w;
      popoverArea.value   = area;
      popoverPanel.value  = p;
      popoverKey.value    = key;
    };
    const closePopover = () => { popoverKey.value = null; };

    /* ── 반응형 뷰포트 ── */
    const viewportMode = ref('desktop');
    /* auto-fill 기반 반응형: 뷰포트 너비 제약이 걸리면 자동으로 컬럼 축소 */
    const autoGridCols = computed(() => {
      const map = {
        grid1: 'repeat(1,1fr)',
        grid2: 'repeat(auto-fill,minmax(max(calc(50% - 5px),260px),1fr))',
        grid3: 'repeat(auto-fill,minmax(max(calc(33.333% - 6px),190px),1fr))',
        grid4: 'repeat(auto-fill,minmax(max(calc(25% - 6px),220px),1fr))',
      };
      return map[activeTab.value] || 'repeat(1,1fr)';
    });
    const viewportWidth = computed(() => {
      if (viewportMode.value === 'mobile') return '375px';
      if (viewportMode.value === 'tablet') return '768px';
      return null;
    });

    /* 실제 컨텐츠 보기 토글 */
    const showRealContent = ref(false);

    /* 초기화 */
    initExpand();

    return {
      previewDate, previewTime, showAreaDrop,
      selectedAreas, allAreas, areaBtnLabel,
      toggleArea, selectAllAreas, clearAllAreas, resetDate,
      searchStatus, searchCondition, searchAuthRequired, searchAuthGrade,
      CONDITION_OPTS, AUTH_GRADE_OPTS,
      isLoggedIn, userGrade, userName, accessibleConds,
      showCatModal, selectedCatIds, catBtnLabel, onCatApply, selectedCatNames,
      structAreaList, expandedAreas, toggleAreaExpand, initExpand,
      checkedPanels, checkedWidgets,
      togglePanel, toggleWidget,
      checkAll, clearAll,
      isAreaAllChecked, checkAreaAll,
      isPanelAllChecked,
      checkedWidgetList,
      TABS, activeTab, GRID_COLS, gridCells, wColor,
      previewWidgets, dragSrc, dropZoneIdx,
      onWidgetDragStart, onAreaNodeDragStart, onPanelNodeDragStart, onDragEnd,
      spanPopupIdx, toggleSpanPopup, closeSpanPopup, setSpan,
      onCellDrop, removeCellWidget,
      dashItems, dashDrag, dashResize,
      onDashDrop, onDashItemMd, onDashResizeMd, onDashMm, onDashMu, removeDashItem,
      clearPreview,
      wLabel, wIcon,
      popoverKey, popoverWidget, popoverArea, popoverPanel, popoverPos,
      showWidgetInfo, closePopover,
      viewportMode, autoGridCols, viewportWidth,
      showRealContent,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">

  <!-- 제목 -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    14. 전시영역 구조 트리 보기
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">영역 &gt; 패널 &gt; 위젯 구조 선택</span>
  </div>

  <!-- 필터 바 -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">📅 전시일시</span>
        <input type="date" v-model="previewDate" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <input type="time" v-model="previewTime" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <button @click="resetDate" style="font-size:11px;padding:3px 8px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;color:#555;">현재</button>
      </div>
      <div style="width:1px;height:24px;background:#e0e0e0;"></div>

      <!-- 상태 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">상태</span>
        <select v-model="searchStatus" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:76px;">
          <option value="">전체</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
        </select>
      </div>
      <!-- 노출조건 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">노출조건</span>
        <select v-model="searchCondition" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:112px;">
          <option value="">전체</option>
          <option v-for="c in CONDITION_OPTS" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <!-- 인증필요 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">인증필요</span>
        <select v-model="searchAuthRequired" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">전체</option>
          <option value="Y">필요</option>
          <option value="N">불필요</option>
        </select>
      </div>
      <!-- 등급제한 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">등급제한</span>
        <select v-model="searchAuthGrade" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">전체</option>
          <option v-for="g in AUTH_GRADE_OPTS" :key="g" :value="g">{{ g }}↑</option>
        </select>
      </div>

      <!-- 카테고리 -->
      <button @click="showCatModal=true"
        style="font-size:12px;padding:3px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;"
        :style="selectedCatIds.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
        📂 {{ catBtnLabel }}
      </button>

      <!-- 화면영역 멀티선택 -->
      <div style="margin-left:auto;position:relative;">
        <button @click="showAreaDrop=!showAreaDrop"
          style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;"
          :style="selectedAreas.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
          <span>🗂 {{ areaBtnLabel }}</span>
          <span style="font-size:10px;">{{ showAreaDrop ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showAreaDrop" @click="showAreaDrop=false" style="position:fixed;inset:0;z-index:99;"></div>
        <div v-if="showAreaDrop" style="position:absolute;right:0;top:calc(100% + 4px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:220px;max-height:300px;overflow-y:auto;padding:8px 0;">
          <div style="display:flex;gap:6px;padding:6px 12px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="selectAllAreas" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
            <button @click.stop="clearAllAreas" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
          </div>
          <div v-for="a in allAreas" :key="a.codeValue" @click.stop="toggleArea(a.codeValue)"
            style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;"
            :style="selectedAreas.has(a.codeValue)?'background:#fff8f8;':''">
            <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="selectedAreas.has(a.codeValue)?'border-color:#e8587a;background:#e8587a;':'border-color:#ccc;background:#fff;'">
              <span v-if="selectedAreas.has(a.codeValue)" style="color:#fff;font-size:9px;">✓</span>
            </div>
            <code style="font-size:10px;background:#f5f5f5;padding:1px 4px;border-radius:3px;">{{ a.codeValue }}</code>
            <span style="font-size:12px;">{{ a.codeLabel }}</span>
          </div>
          <div style="border-top:1px solid #f0f0f0;padding:6px 12px;">
            <button @click.stop="showAreaDrop=false" style="font-size:11px;width:100%;padding:4px;border:1px solid #e0e0e0;border-radius:5px;background:#f8f8f8;color:#666;cursor:pointer;">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 현재 사용자 정보 -->
    <div style="margin-top:8px;padding:7px 12px;background:#f8f9fa;border-radius:6px;border-left:3px solid #aaa;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:11px;color:#888;font-weight:600;">현재 사용자</span>
      <span v-if="isLoggedIn" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:1px 7px;font-weight:600;">로그인</span>
      <span v-else style="font-size:11px;background:#f5f5f5;color:#999;border-radius:6px;padding:1px 7px;">비로그인</span>
      <span v-if="userName" style="font-size:11px;color:#555;">{{ userName }}</span>
      <span v-if="isLoggedIn && userGrade" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:1px 7px;">등급: {{ userGrade }}</span>
      <span style="font-size:11px;color:#aaa;">접근 가능 조건:</span>
      <span v-for="c in accessibleConds" :key="c" style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:6px;padding:1px 7px;">{{ c }}</span>
    </div>
  </div>

  <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">

    <!-- 좌: 구조 트리 -->
    <div style="flex:3;min-width:280px;">
      <!-- 조작 바 -->
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;font-weight:600;color:#555;">패널</span>
        <button @click="checkAll" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
        <button @click="clearAll" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
        <span style="font-size:11px;color:#aaa;">{{ checkedPanels.size }}개 선택됨</span>
        <span style="width:1px;height:18px;background:#e0e0e0;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:600;color:#555;">위젯</span>
        <span style="font-size:11px;color:#aaa;">{{ checkedWidgets.size }}개 선택됨</span>
        <button @click="initExpand" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#666;cursor:pointer;margin-left:auto;">전체 펼치기</button>
      </div>

      <!-- 트리 -->
      <div v-if="structAreaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">등록된 영역이 없습니다.</div>

      <div v-for="area in structAreaList" :key="area.codeValue" style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:8px;overflow:hidden;">
        <!-- 영역 헤더 -->
        <div style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;cursor:grab;user-select:none;"
          draggable="true"
          @dragstart="onAreaNodeDragStart(area, $event)"
          @dragend="onDragEnd"
          @click="toggleAreaExpand(area.codeValue)">
          <div @click.stop="checkAreaAll(area)" style="width:15px;height:15px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;"
            :style="isAreaAllChecked(area)?'border-color:#f6ad55;background:#f6ad55;':'border-color:rgba(255,255,255,.4);background:transparent;'">
            <span v-if="isAreaAllChecked(area)" style="color:#333;font-size:9px;">✓</span>
          </div>
          <span style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:3px;padding:1px 5px;">영역</span>
          <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 7px;border-radius:4px;">{{ area.codeValue }}</code>
          <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
          <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ area.panels.length }}개</span>
          <span style="font-size:11px;opacity:.5;">{{ expandedAreas.has(area.codeValue) ? '▲' : '▼' }}</span>
        </div>

        <!-- 패널 목록 -->
        <div v-show="expandedAreas.has(area.codeValue)">
          <div v-if="area.panels.length===0" style="padding:12px 18px;font-size:12px;color:#bbb;">해당 날짜 활성 패널 없음</div>

          <div v-for="(p, pi) in area.panels" :key="p.dispId" @click="togglePanel(p)"
            draggable="true"
            @dragstart.stop="onPanelNodeDragStart(p, area, $event)"
            @dragend="onDragEnd"
            style="display:flex;align-items:flex-start;gap:8px;padding:8px 14px;cursor:grab;user-select:none;border-top:1px solid #f0f0f0;transition:background .1s;"
            :style="checkedPanels.has(p.dispId)?'background:#fff8e1;':''">
            <!-- 패널 체크박스 -->
            <div style="margin-top:2px;width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="isPanelAllChecked(p)?'border-color:#f59e0b;background:#f59e0b;':checkedPanels.has(p.dispId)?'border-color:#f59e0b;background:#fde68a;':'border-color:#ccc;background:#fff;'">
              <span v-if="isPanelAllChecked(p)" style="color:#fff;font-size:9px;">✓</span>
              <span v-else-if="checkedPanels.has(p.dispId)" style="color:#f59e0b;font-size:9px;font-weight:900;">−</span>
            </div>

            <div style="flex:1;min-width:0;">
              <!-- 패널 정보 -->
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;flex-wrap:wrap;">
                <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;">패널</span>
                <code style="font-size:9px;background:#f5f5f5;padding:1px 4px;border-radius:3px;color:#666;">#{{ String(p.dispId).padStart(4,'0') }}</code>
                <span style="font-size:12px;font-weight:700;color:#222;">{{ p.name }}</span>
                <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 6px;">{{ p.condition || '항상 표시' }}</span>
              </div>
              <!-- 위젯 목록 -->
              <div style="display:flex;flex-direction:column;gap:2px;padding-left:2px;">
                <span v-if="!p.rows || p.rows.length===0" style="font-size:11px;color:#ccc;">(위젯 없음)</span>
                <div v-for="(w, wi) in (p.rows||[])" :key="wi" @click.stop="toggleWidget(p.dispId, wi, $event)"
                  draggable="true"
                  @dragstart="onWidgetDragStart(w, p, area, $event)"
                  @dragend="onDragEnd"
                  style="display:flex;align-items:center;gap:5px;padding:2px 5px;border-radius:4px;cursor:grab;transition:background .1s;"
                  :style="checkedWidgets.has(p.dispId + '_' + wi)?'background:#fff3e0;':'background:transparent;'">
                  <div style="width:12px;height:12px;border-radius:3px;border:1.5px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                    :style="checkedWidgets.has(p.dispId + '_' + wi)?'border-color:#f59e0b;background:#f59e0b;':'border-color:#ccc;background:#fff;'">
                    <span v-if="checkedWidgets.has(p.dispId + '_' + wi)" style="color:#fff;font-size:8px;">✓</span>
                  </div>
                  <span style="font-size:9px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 3px;flex-shrink:0;">위젯</span>
                  <span style="font-size:10px;">{{ wIcon(w.widgetType) }}</span>
                  <span style="font-size:11px;color:#e65100;">{{ wLabel(w.widgetType) }}</span>
                  <span v-if="w.widgetNm" style="font-size:10px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
                  <button @click.stop="showWidgetInfo(w, p, area, p.dispId+'_'+wi, $event)"
                    style="border:none;background:none;cursor:pointer;font-size:13px;padding:0 2px;line-height:1;margin-left:auto;flex-shrink:0;transition:color .1s;"
                    :style="popoverKey===p.dispId+'_'+wi?'color:#1a73e8;opacity:1;':'color:#aaa;opacity:.6;'"
                    title="위젯 정보 보기">ⓘ</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 우: 위젯 컨텐츠 미리보기 (드래그&드롭) -->
    <div style="flex:6;min-width:280px;max-height:80vh;overflow-y:auto;">
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:8px;position:sticky;top:0;z-index:10;overflow:hidden;">
        <!-- 타이틀 + 초기화 -->
        <div style="display:flex;align-items:center;padding:10px 14px 6px;">
          <span style="font-size:13px;font-weight:700;color:#333;">🧩 위젯 컨텐츠 미리보기</span>
          <div style="margin-left:auto;display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:#aaa;">{{ previewWidgets.length }}개</span>
            <button @click="clearPreview"
              style="font-size:11px;padding:2px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">초기화</button>
          </div>
        </div>
        <!-- 탭 + 뷰포트 토글 -->
        <div style="display:flex;align-items:center;border-top:1px solid #f0f0f0;padding:0 10px;">
          <div style="display:flex;flex:1;">
            <button v-for="tab in TABS" :key="tab" @click="activeTab=tab"
              style="font-size:12px;padding:7px 14px;border:none;border-bottom:2px solid transparent;background:none;cursor:pointer;margin-bottom:-1px;transition:color .15s,border-color .15s;white-space:nowrap;"
              :style="activeTab===tab?'color:#1a73e8;border-bottom-color:#1a73e8;font-weight:700;':'color:#999;'">
              {{ tab }}
            </button>
          </div>
          <!-- 실제컨텐츠 토글 + 뷰포트 토글 (dashboard 제외) -->
          <div v-if="activeTab!=='dashboard'" style="display:flex;gap:3px;padding:4px 0 4px 10px;border-left:1px solid #f0f0f0;margin-left:4px;flex-shrink:0;align-items:center;">
            <button @click="showRealContent=!showRealContent"
              style="font-size:11px;padding:2px 8px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;margin-right:6px;"
              :style="showRealContent?'background:#059669;color:#fff;border-color:#059669;':'background:#fff;color:#6b7280;'">
              {{ showRealContent ? '✅ 실제컨텐츠' : '👁 실제컨텐츠' }}
            </button>
            <div style="width:1px;height:18px;background:#e5e7eb;margin-right:3px;"></div>
            <button @click="viewportMode='desktop'"
              style="font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
              :style="viewportMode==='desktop'?'background:#1a73e8;color:#fff;border-color:#1a73e8;':'background:#fff;color:#6b7280;'">🖥 PC</button>
            <button @click="viewportMode='tablet'"
              style="font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
              :style="viewportMode==='tablet'?'background:#1a73e8;color:#fff;border-color:#1a73e8;':'background:#fff;color:#6b7280;'">📟 태블릿</button>
            <button @click="viewportMode='mobile'"
              style="font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
              :style="viewportMode==='mobile'?'background:#1a73e8;color:#fff;border-color:#1a73e8;':'background:#fff;color:#6b7280;'">📱 모바일</button>
          </div>
        </div>
      </div>

      <!-- 뷰포트 래퍼 (dashboard 제외) -->
      <template v-if="activeTab!=='dashboard'">
      <div :style="{
        width: viewportWidth || '100%',
        maxWidth: viewportWidth || '100%',
        margin: '0 auto',
        transition: 'width .3s, max-width .3s',
      }">
      <div v-if="viewportWidth" style="text-align:center;margin-bottom:6px;font-size:11px;color:#9ca3af;font-weight:600;padding-top:8px;">
        {{ viewportMode==='mobile' ? '📱 375px' : '📟 768px' }}
      </div>
      <div :style="{
        border: viewportWidth ? '2px solid #d1d5db' : 'none',
        borderRadius: viewportWidth ? '10px' : '0',
        padding: viewportWidth ? '10px' : '0',
        background: '#fff',
        boxShadow: viewportWidth ? '0 4px 16px rgba(0,0,0,.1)' : 'none',
      }">


      <!-- ===== grid1 / grid2 / grid3 / grid4 =====  -->
      <template v-if="GRID_COLS[activeTab]">
        <div @click="closeSpanPopup" :style="{ display:'grid', gridTemplateColumns: autoGridCols, gap: '8px' }">
          <template v-for="(cell, ci) in gridCells[activeTab]" :key="ci">
          <div v-if="!showRealContent || cell.widget"
            @dragover.prevent="dropZoneIdx=ci"
            @dragleave="dropZoneIdx=-1"
            @drop="onCellDrop(activeTab, ci, $event)"
            :style="[
              cell.widget
                ? (showRealContent ? 'border:none;background:transparent;min-height:0;' : 'border:1px solid #e0e0e0;background:#fff;min-height:130px;')
                : dropZoneIdx===ci ? 'border:2px dashed #1a73e8;background:#e8f0fe;min-height:60px;'
                                   : 'border:2px dashed #e0e0e0;background:#fafafa;min-height:60px;',
              cell.widget && (cell.colSpan||1) > 1 ? { gridColumn: 'span ' + (cell.colSpan||1) } : {},
              cell.widget && (cell.rowSpan||1) > 1 ? { gridRow:    'span ' + (cell.rowSpan||1) } : {},
            ]"
            style="border-radius:8px;overflow:hidden;transition:border .15s,background .15s;position:relative;">
            <!-- 위젯 있음 -->
            <template v-if="cell.widget">
              <!-- 관리자 헤더 (실제컨텐츠 OFF 시) -->
              <template v-if="!showRealContent">
                <div :style="'height:4px;background:'+wColor(cell.widget.widgetType)+';'"></div>
                <div style="display:flex;align-items:center;gap:4px;padding:5px 8px 0;margin-bottom:4px;">
                  <span style="font-size:9px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:1px 4px;white-space:nowrap;flex-shrink:0;">{{ wIcon(cell.widget.widgetType) }} {{ wLabel(cell.widget.widgetType) }}</span>
                  <span style="font-size:10px;font-weight:600;color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cell.widget.widgetNm }}</span>
                  <button @click="toggleSpanPopup($event, activeTab, ci)"
                    :title="'열 ' + (cell.colSpan||1) + ' × 행 ' + (cell.rowSpan||1)"
                    style="flex-shrink:0;width:20px;height:20px;border-radius:4px;border:1px solid #e0e0e0;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
                    :style="spanPopupIdx===activeTab+'_'+ci ? 'background:#1a73e8;color:#fff;border-color:#1a73e8;' : 'background:#f9fafb;color:#888;'">⚙</button>
                  <button @click="removeCellWidget(activeTab, ci)" style="border:none;background:none;color:#ccc;cursor:pointer;font-size:15px;padding:0;line-height:1;flex-shrink:0;">×</button>
                </div>
                <div style="font-size:9px;color:#bbb;margin-bottom:4px;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cell.widget._area }} · {{ cell.widget._panelNm }}</div>
                <!-- span 설정 팝업 -->
                <div v-if="spanPopupIdx===activeTab+'_'+ci" @click.stop
                  style="position:absolute;top:34px;right:6px;z-index:20;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:12px 14px;min-width:170px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <span style="font-size:11px;font-weight:700;color:#374151;">그리드 스팬 설정</span>
                    <button @click="closeSpanPopup" style="border:none;background:none;cursor:pointer;font-size:13px;color:#9ca3af;padding:0;line-height:1;">✕</button>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                    <span style="font-size:11px;color:#6b7280;width:36px;">열 span</span>
                    <button @click="setSpan(activeTab,ci,'col',-1)" :disabled="(cell.colSpan||1)<=1"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(cell.colSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                    <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1a73e8;">{{ cell.colSpan||1 }}</span>
                    <button @click="setSpan(activeTab,ci,'col',+1)" :disabled="(cell.colSpan||1)>=(GRID_COLS[activeTab]||1)"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(cell.colSpan||1)>=(GRID_COLS[activeTab]||1)?'opacity:.3;cursor:default;':''">+</button>
                    <span style="font-size:10px;color:#9ca3af;">/ {{ GRID_COLS[activeTab]||1 }}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;color:#6b7280;width:36px;">행 span</span>
                    <button @click="setSpan(activeTab,ci,'row',-1)" :disabled="(cell.rowSpan||1)<=1"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(cell.rowSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                    <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1a73e8;">{{ cell.rowSpan||1 }}</span>
                    <button @click="setSpan(activeTab,ci,'row',+1)" :disabled="(cell.rowSpan||1)>=4"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(cell.rowSpan||1)>=4?'opacity:.3;cursor:default;':''">+</button>
                    <span style="font-size:10px;color:#9ca3af;">/ 4</span>
                  </div>
                </div>
              </template>
              <!-- 실제컨텐츠 ON 시 ×버튼만 -->
              <template v-else>
                <div style="position:relative;">
                  <button @click="removeCellWidget(activeTab, ci)"
                    style="position:absolute;top:4px;right:4px;z-index:5;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,.3);color:#fff;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;">×</button>
                </div>
              </template>
              <div :style="showRealContent?'padding:0':'padding:0 8px 8px'" style="overflow:hidden;">
                <!-- 컨텐츠 -->
                <div v-if="cell.widget.widgetType==='image_banner'" style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:6px;padding:14px 10px;text-align:center;color:#fff;">
                  <div style="font-size:20px;">🖼</div><div style="font-size:10px;font-weight:700;margin-top:4px;">{{ cell.widget.widgetNm }}</div>
                </div>
                <div v-else-if="cell.widget.widgetType==='product_slider'">
                  <div style="display:flex;gap:4px;overflow:hidden;">
                    <div v-for="n in 3" :key="n" style="flex:0 0 58px;border:1px solid #ececec;border-radius:5px;overflow:hidden;">
                      <div style="height:40px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);display:flex;align-items:center;justify-content:center;font-size:14px;">📦</div>
                      <div style="padding:3px 4px;"><div style="font-size:8px;color:#555;">상품</div><div style="font-size:9px;font-weight:700;color:#e8587a;">₩00,000</div></div>
                    </div>
                  </div>
                </div>
                <div v-else-if="cell.widget.widgetType==='product'" style="display:flex;gap:7px;align-items:flex-start;">
                  <div style="width:46px;height:46px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>
                  <div><div style="font-size:8px;color:#aaa;">단품</div><div style="font-size:10px;font-weight:700;">상품명</div><div style="font-size:11px;font-weight:800;color:#e8587a;">₩00,000</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='cond_product'">
                  <div v-for="n in 2" :key="n" style="display:flex;align-items:center;gap:5px;padding:3px 0;border-bottom:1px solid #f5f5f5;">
                    <div style="width:26px;height:26px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">📦</div>
                    <div><div style="font-size:9px;color:#444;">상품명 {{ n }}</div><div style="font-size:10px;font-weight:700;color:#e8587a;">₩00,000</div></div>
                  </div>
                </div>
                <div v-else-if="cell.widget.widgetType==='chart_bar'">
                  <div style="display:flex;align-items:flex-end;gap:2px;height:50px;border-bottom:1px solid #eee;">
                    <div v-for="(h,ci2) in [55,78,42,88,65,92,70]" :key="ci2" style="flex:1;border-radius:2px 2px 0 0;" :style="'height:'+h+'%;background:linear-gradient(180deg,#667eea,#764ba2);'"></div>
                  </div>
                  <div style="display:flex;justify-content:space-around;margin-top:2px;">
                    <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" style="font-size:7px;color:#aaa;">{{ d }}</span>
                  </div>
                </div>
                <div v-else-if="cell.widget.widgetType==='chart_line'">
                  <svg viewBox="0 0 240 55" style="width:100%;height:50px;">
                    <polyline points="0,44 34,30 68,38 102,12 136,22 170,6 204,14 240,10" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linejoin="round"/>
                    <polyline points="0,44 34,30 68,38 102,12 136,22 170,6 204,14 240,10 240,55 0,55" fill="#667eea" opacity=".1"/>
                  </svg>
                </div>
                <div v-else-if="cell.widget.widgetType==='chart_pie'" style="display:flex;align-items:center;gap:6px;">
                  <svg viewBox="0 0 100 100" style="width:50px;height:50px;flex-shrink:0;">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#667eea" stroke-width="24" stroke-dasharray="72 28" stroke-dashoffset="25"/>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f6ad55" stroke-width="24" stroke-dasharray="17 83" stroke-dashoffset="-47"/>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#68d391" stroke-width="24" stroke-dasharray="11 89" stroke-dashoffset="-64"/>
                  </svg>
                  <div style="font-size:8px;">
                    <div v-for="(g,gi) in [['A','#667eea','72%'],['B','#f6ad55','17%'],['기타','#68d391','11%']]" :key="gi" style="display:flex;align-items:center;gap:3px;margin-bottom:3px;">
                      <div style="width:6px;height:6px;border-radius:50%;" :style="'background:'+g[1]+';'"></div><span style="color:#555;">{{ g[0] }}</span><span style="font-weight:700;margin-left:2px;">{{ g[2] }}</span>
                    </div>
                  </div>
                </div>
                <div v-else-if="cell.widget.widgetType==='text_banner'" style="background:#f8f9fa;border-left:3px solid #667eea;border-radius:0 5px 5px 0;padding:7px 8px;">
                  <div style="font-size:10px;font-weight:700;color:#222;margin-bottom:2px;">{{ cell.widget.widgetNm }}</div>
                  <div style="font-size:9px;color:#666;">텍스트 배너 컨텐츠</div>
                </div>
                <div v-else-if="cell.widget.widgetType==='info_card'" style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:5px;padding:8px;display:flex;align-items:center;gap:6px;">
                  <div style="font-size:20px;">ℹ</div><div><div style="font-size:9px;font-weight:700;color:#1565c0;">{{ cell.widget.widgetNm }}</div><div style="font-size:8px;color:#1976d2;">정보 카드</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='popup'" style="border:1px solid #e0e0e0;border-radius:5px;overflow:hidden;">
                  <div style="background:#f5f5f5;padding:3px 7px;display:flex;justify-content:space-between;border-bottom:1px solid #e0e0e0;"><span style="font-size:8px;font-weight:700;color:#555;">팝업</span><span style="color:#aaa;font-size:11px;">×</span></div>
                  <div style="padding:8px;text-align:center;"><div style="font-size:16px;">💬</div><div style="font-size:9px;font-weight:700;margin-top:2px;">{{ cell.widget.widgetNm }}</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='file'" style="display:flex;align-items:center;gap:7px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:5px;padding:6px 8px;">
                  <span style="font-size:18px;">📎</span><div><div style="font-size:9px;font-weight:700;">{{ cell.widget.widgetNm }}</div><div style="font-size:8px;color:#999;">다운로드</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='file_list'">
                  <div v-for="n in 2" :key="n" style="display:flex;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:12px;">📁</span><span style="font-size:9px;flex:1;">파일_{{ n }}.pdf</span><span style="font-size:8px;color:#aaa;">1.{{ n }}MB</span>
                  </div>
                </div>
                <div v-else-if="cell.widget.widgetType==='coupon'" style="border:2px dashed #e8587a;border-radius:5px;padding:7px 8px;display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
                  <div style="font-size:20px;">🎟</div><div style="flex:1;"><div style="font-size:10px;font-weight:800;color:#c2185b;">{{ cell.widget.widgetNm }}</div><div style="font-size:8px;color:#e8587a;">쿠폰 발급</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='html_editor'" style="background:#1e1e2e;border-radius:5px;padding:7px;font-family:monospace;font-size:8px;color:#a9b7c6;line-height:1.5;">
                  <span style="color:#cc7832;">&lt;div&gt;</span> HTML {{ cell.widget.widgetNm }} <span style="color:#cc7832;">&lt;/div&gt;</span>
                </div>
                <div v-else-if="cell.widget.widgetType==='event_banner'" style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:5px;padding:12px;text-align:center;color:#fff;">
                  <div style="font-size:16px;margin-bottom:3px;">🎉</div><div style="font-size:10px;font-weight:800;">{{ cell.widget.widgetNm }}</div>
                </div>
                <div v-else-if="cell.widget.widgetType==='cache_banner'" style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:5px;padding:8px;display:flex;align-items:center;gap:7px;color:#fff;">
                  <div style="font-size:20px;">💰</div><div><div style="font-size:8px;opacity:.85;">적립금</div><div style="font-size:13px;font-weight:800;">+0,000P</div></div>
                </div>
                <div v-else-if="cell.widget.widgetType==='widget_embed'" style="border:2px dashed #a0aec0;border-radius:5px;padding:10px;text-align:center;background:#f7fafc;">
                  <div style="font-size:16px;margin-bottom:2px;">🧩</div><div style="font-size:9px;font-weight:700;color:#4a5568;">{{ cell.widget.widgetNm }}</div>
                </div>
                <div v-else style="background:#f5f5f5;border-radius:5px;padding:8px;text-align:center;color:#888;">
                  <div style="font-size:16px;margin-bottom:2px;">{{ wIcon(cell.widget.widgetType) }}</div><div style="font-size:9px;">{{ wLabel(cell.widget.widgetType) }}</div>
                </div>
              </div>
            </template>
            <!-- 빈 셀 -->
            <div v-else style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:60px;">
              <div style="font-size:22px;margin-bottom:5px;opacity:.25;">{{ dropZoneIdx===ci ? '📥' : '+' }}</div>
              <div style="font-size:10px;color:#ccc;">{{ dropZoneIdx===ci ? '여기에 놓기' : '드래그하여 추가' }}</div>
            </div>
          </div>
          </template><!-- /cell -->
        </div>
      </template><!-- /grid1~4 -->

      </div><!-- /device frame -->
      </div><!-- /viewport wrapper -->
      </template><!-- /뷰포트 래퍼 -->

      <!-- ===== dashboard ===== -->
      <template v-else-if="activeTab==='dashboard'">
        <div style="position:relative;width:100%;height:640px;border:2px dashed #ddd;border-radius:8px;overflow:hidden;background-color:#f8f9fa;background-image:radial-gradient(circle,#d0d0d0 1px,transparent 1px);background-size:20px 20px;"
          @mousemove="onDashMm" @mouseup="onDashMu" @mouseleave="onDashMu"
          @dragover.prevent @drop="onDashDrop">
          <!-- 빈 상태 힌트 -->
          <div v-if="dashItems.length===0"
            style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;color:#bbb;">
            <div style="font-size:36px;margin-bottom:12px;">📐</div>
            <div style="font-size:13px;">좌측 위젯을 드래그하여 배치하세요</div>
            <div style="font-size:11px;margin-top:5px;opacity:.7;">이동 · 크기 조절 가능</div>
          </div>
          <!-- 위젯 아이템 -->
          <div v-for="(item, idx) in dashItems" :key="idx"
            style="position:absolute;background:#fff;border-radius:8px;overflow:hidden;user-select:none;box-shadow:0 2px 10px rgba(0,0,0,.1);"
            :style="{ left:item.x+'px', top:item.y+'px', width:item.w+'px', height:item.h+'px',
                      border:(dashDrag.on&&dashDrag.idx===idx)||(dashResize.on&&dashResize.idx===idx)?'2px solid #1a73e8':'1px solid #e0e0e0',
                      zIndex:(dashDrag.on&&dashDrag.idx===idx)||(dashResize.on&&dashResize.idx===idx)?10:1,
                      cursor:dashDrag.on&&dashDrag.idx===idx?'grabbing':'grab' }"
            @mousedown="onDashItemMd(idx, $event)">
            <!-- 타이틀 바 -->
            <div :style="'height:28px;background:'+wColor(item.widget.widgetType)+';display:flex;align-items:center;padding:0 8px;gap:6px;cursor:grab;'">
              <span style="font-size:12px;">{{ wIcon(item.widget.widgetType) }}</span>
              <span style="font-size:11px;font-weight:600;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ item.widget.widgetNm }}</span>
              <button @mousedown.stop @click.stop="removeDashItem(idx)"
                style="background:rgba(255,255,255,.25);border:none;color:#fff;cursor:pointer;border-radius:3px;width:16px;height:16px;padding:0;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;">×</button>
            </div>
            <!-- 내용 -->
            <div style="padding:8px 10px;overflow-y:auto;height:calc(100% - 28px);">
              <div v-if="item.widget.widgetType==='image_banner'" style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;padding:18px 12px;text-align:center;color:#fff;">
                <div style="font-size:26px;">🖼</div><div style="font-size:12px;font-weight:700;margin-top:5px;">{{ item.widget.widgetNm }}</div>
                <div v-if="item.widget.clickTarget" style="font-size:10px;opacity:.8;margin-top:3px;">→ {{ item.widget.clickTarget }}</div>
              </div>
              <div v-else-if="item.widget.widgetType==='product_slider'">
                <div style="display:flex;gap:5px;overflow:hidden;">
                  <div v-for="n in 3" :key="n" style="flex:0 0 72px;border:1px solid #ececec;border-radius:6px;overflow:hidden;">
                    <div style="height:52px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>
                    <div style="padding:4px 5px;"><div style="font-size:9px;color:#555;">상품명</div><div style="font-size:10px;font-weight:700;color:#e8587a;">₩00,000</div></div>
                  </div>
                </div>
              </div>
              <div v-else-if="item.widget.widgetType==='product'" style="display:flex;gap:9px;align-items:flex-start;">
                <div style="width:60px;height:60px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📦</div>
                <div><div style="font-size:10px;color:#aaa;">단품 상품</div><div style="font-size:11px;font-weight:700;color:#222;">상품명</div><div style="font-size:13px;font-weight:800;color:#e8587a;">₩00,000</div></div>
              </div>
              <div v-else-if="item.widget.widgetType==='cond_product'">
                <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid #f5f5f5;">
                  <div style="width:34px;height:34px;background:#f0f0f0;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">📦</div>
                  <div><div style="font-size:10px;color:#444;">상품명 {{ n }}</div><div style="font-size:11px;font-weight:700;color:#e8587a;">₩00,000</div></div>
                </div>
              </div>
              <div v-else-if="item.widget.widgetType==='chart_bar'">
                <div style="display:flex;align-items:flex-end;gap:3px;height:66px;border-bottom:1px solid #eee;">
                  <div v-for="(h,ci) in [55,78,42,88,65,92,70]" :key="ci" style="flex:1;border-radius:3px 3px 0 0;" :style="'height:'+h+'%;background:linear-gradient(180deg,#667eea,#764ba2);'"></div>
                </div>
                <div style="display:flex;justify-content:space-around;margin-top:3px;">
                  <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" style="font-size:8px;color:#aaa;">{{ d }}</span>
                </div>
              </div>
              <div v-else-if="item.widget.widgetType==='chart_line'">
                <svg viewBox="0 0 240 70" style="width:100%;height:66px;">
                  <polyline points="0,54 34,38 68,46 102,16 136,28 170,10 204,20 240,14" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                  <polyline points="0,54 34,38 68,46 102,16 136,28 170,10 204,20 240,14 240,70 0,70" fill="#667eea" opacity=".1"/>
                </svg>
              </div>
              <div v-else-if="item.widget.widgetType==='chart_pie'" style="display:flex;align-items:center;gap:10px;">
                <svg viewBox="0 0 100 100" style="width:72px;height:72px;flex-shrink:0;">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#667eea" stroke-width="24" stroke-dasharray="72 28" stroke-dashoffset="25"/>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f6ad55" stroke-width="24" stroke-dasharray="17 83" stroke-dashoffset="-47"/>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#68d391" stroke-width="24" stroke-dasharray="11 89" stroke-dashoffset="-64"/>
                </svg>
                <div style="font-size:9px;">
                  <div v-for="(leg,li) in [['카테고리A','#667eea','72%'],['카테고리B','#f6ad55','17%'],['기타','#68d391','11%']]" :key="li" style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                    <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;" :style="'background:'+leg[1]+';'"></div>
                    <span style="color:#555;">{{ leg[0] }}</span><span style="font-weight:700;margin-left:auto;">{{ leg[2] }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="item.widget.widgetType==='text_banner'" style="background:#f8f9fa;border-left:4px solid #667eea;border-radius:0 6px 6px 0;padding:10px 12px;">
                <div style="font-size:11px;font-weight:700;color:#222;margin-bottom:3px;">{{ item.widget.widgetNm }}</div>
                <div style="font-size:10px;color:#666;line-height:1.5;">텍스트 배너 컨텐츠</div>
              </div>
              <div v-else-if="item.widget.widgetType==='info_card'" style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:6px;padding:12px;display:flex;align-items:center;gap:10px;">
                <div style="font-size:26px;">ℹ</div><div><div style="font-size:11px;font-weight:700;color:#1565c0;margin-bottom:3px;">{{ item.widget.widgetNm }}</div><div style="font-size:10px;color:#1976d2;">정보 카드</div></div>
              </div>
              <div v-else-if="item.widget.widgetType==='popup'" style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
                <div style="background:#f5f5f5;padding:6px 10px;display:flex;justify-content:space-between;border-bottom:1px solid #e0e0e0;"><span style="font-size:10px;font-weight:700;color:#555;">팝업</span><span style="color:#aaa;">×</span></div>
                <div style="padding:14px;text-align:center;"><div style="font-size:22px;margin-bottom:4px;">💬</div><div style="font-size:11px;font-weight:700;">{{ item.widget.widgetNm }}</div></div>
              </div>
              <div v-else-if="item.widget.widgetType==='file'" style="display:flex;align-items:center;gap:10px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;">
                <span style="font-size:24px;">📎</span><div><div style="font-size:11px;font-weight:700;">{{ item.widget.widgetNm }}</div><div style="font-size:9px;color:#999;margin-top:2px;">파일 다운로드</div></div>
              </div>
              <div v-else-if="item.widget.widgetType==='file_list'">
                <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="font-size:14px;">📁</span><span style="font-size:10px;flex:1;">파일명_{{ n }}.pdf</span><span style="font-size:9px;color:#aaa;">1.{{ n }}MB</span>
                </div>
              </div>
              <div v-else-if="item.widget.widgetType==='coupon'" style="border:2px dashed #e8587a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
                <div style="font-size:26px;">🎟</div>
                <div style="flex:1;"><div style="font-size:12px;font-weight:800;color:#c2185b;margin-bottom:2px;">{{ item.widget.widgetNm }}</div><div style="font-size:9px;color:#e8587a;">쿠폰 발급</div></div>
                <div style="background:#e8587a;color:#fff;border-radius:5px;padding:5px 9px;font-size:10px;font-weight:700;white-space:nowrap;">받기</div>
              </div>
              <div v-else-if="item.widget.widgetType==='html_editor'" style="background:#1e1e2e;border-radius:6px;padding:10px;font-family:monospace;font-size:10px;color:#a9b7c6;line-height:1.6;">
                <span style="color:#cc7832;">&lt;div&gt;</span><br>&nbsp;&nbsp;HTML ({{ item.widget.widgetNm }})<br><span style="color:#cc7832;">&lt;/div&gt;</span>
              </div>
              <div v-else-if="item.widget.widgetType==='event_banner'" style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:6px;padding:16px;text-align:center;color:#fff;">
                <div style="font-size:22px;margin-bottom:5px;">🎉</div><div style="font-size:12px;font-weight:800;">{{ item.widget.widgetNm }}</div>
              </div>
              <div v-else-if="item.widget.widgetType==='cache_banner'" style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:6px;padding:12px;display:flex;align-items:center;gap:10px;color:#fff;">
                <div style="font-size:26px;">💰</div><div><div style="font-size:10px;opacity:.85;">적립금</div><div style="font-size:15px;font-weight:800;">+0,000P</div></div>
              </div>
              <div v-else-if="item.widget.widgetType==='widget_embed'" style="border:2px dashed #a0aec0;border-radius:6px;padding:16px;text-align:center;background:#f7fafc;">
                <div style="font-size:20px;margin-bottom:4px;">🧩</div><div style="font-size:11px;font-weight:700;color:#4a5568;">{{ item.widget.widgetNm }}</div>
                <div style="font-size:9px;color:#a0aec0;">외부 위젯 임베드</div>
              </div>
              <div v-else style="background:#f5f5f5;border-radius:6px;padding:14px;text-align:center;color:#888;">
                <div style="font-size:20px;margin-bottom:3px;">{{ wIcon(item.widget.widgetType) }}</div><div style="font-size:10px;">{{ wLabel(item.widget.widgetType) }}</div>
              </div>
            </div>
            <!-- 리사이즈 핸들 -->
            <div @mousedown.stop="onDashResizeMd(idx, $event)"
              style="position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:se-resize;display:flex;align-items:center;justify-content:center;opacity:.4;">
              <svg width="10" height="10" viewBox="0 0 10 10" style="pointer-events:none;">
                <line x1="2" y1="9" x2="9" y2="2" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="5" y1="9" x2="9" y2="5" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="8" y1="9" x2="9" y2="8" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </template><!-- /dashboard -->
    </div>
  </div>

  <!-- 위젯 정보 팝오버 backdrop -->
  <div v-if="popoverKey" @click="closePopover" style="position:fixed;inset:0;z-index:199;"></div>

  <!-- 위젯 정보 팝오버 -->
  <div v-if="popoverKey && popoverWidget"
    style="position:fixed;z-index:200;background:#fff;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.16);width:300px;max-height:460px;overflow-y:auto;"
    :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }">
    <!-- 팝오버 헤더 -->
    <div :style="'padding:10px 14px;background:'+wColor(popoverWidget.widgetType)+';border-radius:10px 10px 0 0;display:flex;align-items:center;gap:8px;'">
      <span style="font-size:18px;">{{ wIcon(popoverWidget.widgetType) }}</span>
      <div style="flex:1;overflow:hidden;">
        <div style="font-size:12px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ wLabel(popoverWidget.widgetType) }}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ popoverWidget.widgetNm }}</div>
      </div>
      <button @click="closePopover" style="background:rgba(255,255,255,.2);border:none;color:#fff;cursor:pointer;border-radius:4px;width:20px;height:20px;padding:0;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;">×</button>
    </div>
    <!-- 메타 정보 -->
    <div style="padding:7px 14px;border-bottom:1px solid #f0f0f0;display:flex;flex-direction:column;gap:2px;">
      <div style="font-size:10px;color:#888;">영역: <span style="color:#333;font-weight:600;">{{ popoverArea ? popoverArea.codeLabel : '' }}</span></div>
      <div style="font-size:10px;color:#888;">패널: <span style="color:#333;font-weight:600;">{{ popoverPanel ? popoverPanel.name : '' }}</span></div>
    </div>
    <!-- 컨텐츠 미리보기 -->
    <div style="padding:12px 14px;">
      <div v-if="popoverWidget.widgetType==='image_banner'" style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;padding:24px 16px;text-align:center;color:#fff;">
        <div style="font-size:28px;">🖼</div>
        <div style="font-size:13px;font-weight:700;margin-top:6px;">{{ popoverWidget.widgetNm }}</div>
        <div v-if="popoverWidget.clickTarget" style="font-size:10px;opacity:.8;margin-top:4px;background:rgba(255,255,255,.2);border-radius:10px;padding:2px 10px;display:inline-block;">→ {{ popoverWidget.clickTarget }}</div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='product_slider'">
        <div style="display:flex;gap:6px;overflow:hidden;">
          <div v-for="n in 3" :key="n" style="flex:0 0 80px;border:1px solid #ececec;border-radius:6px;overflow:hidden;">
            <div style="height:60px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);display:flex;align-items:center;justify-content:center;font-size:20px;">📦</div>
            <div style="padding:5px 6px;"><div style="font-size:9px;color:#555;">상품명</div><div style="font-size:10px;font-weight:700;color:#e8587a;">₩00,000</div></div>
          </div>
        </div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='product'" style="display:flex;gap:10px;align-items:flex-start;">
        <div style="width:72px;height:72px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">📦</div>
        <div><div style="font-size:10px;color:#aaa;margin-bottom:2px;">단품 상품</div><div style="font-size:12px;font-weight:700;color:#222;margin-bottom:3px;">상품명</div><div style="font-size:14px;font-weight:800;color:#e8587a;">₩00,000</div></div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='cond_product'">
        <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;">
          <div style="width:36px;height:36px;background:#f0f0f0;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">📦</div>
          <div><div style="font-size:10px;color:#444;">상품명 {{ n }}</div><div style="font-size:11px;font-weight:700;color:#e8587a;">₩00,000</div></div>
        </div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='chart_bar'">
        <div style="display:flex;align-items:flex-end;gap:4px;height:80px;border-bottom:1px solid #eee;">
          <div v-for="(h,ci) in [55,78,42,88,65,92,70]" :key="ci" style="flex:1;border-radius:3px 3px 0 0;" :style="'height:'+h+'%;background:linear-gradient(180deg,#667eea,#764ba2);'"></div>
        </div>
        <div style="display:flex;justify-content:space-around;margin-top:4px;">
          <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" style="font-size:9px;color:#aaa;">{{ d }}</span>
        </div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='chart_line'">
        <svg viewBox="0 0 240 80" style="width:100%;height:80px;">
          <polyline points="0,64 34,46 68,56 102,18 136,32 170,10 204,22 240,16" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <polyline points="0,64 34,46 68,56 102,18 136,32 170,10 204,22 240,16 240,80 0,80" fill="#667eea" opacity=".1"/>
        </svg>
      </div>
      <div v-else-if="popoverWidget.widgetType==='chart_pie'" style="display:flex;align-items:center;gap:14px;">
        <svg viewBox="0 0 100 100" style="width:80px;height:80px;flex-shrink:0;">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#667eea" stroke-width="24" stroke-dasharray="72 28" stroke-dashoffset="25"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f6ad55" stroke-width="24" stroke-dasharray="17 83" stroke-dashoffset="-47"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#68d391" stroke-width="24" stroke-dasharray="11 89" stroke-dashoffset="-64"/>
        </svg>
        <div>
          <div v-for="(item,idx) in [['카테고리A','#667eea','72%'],['카테고리B','#f6ad55','17%'],['기타','#68d391','11%']]" :key="idx" style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;" :style="'background:'+item[1]+';'"></div>
            <span style="font-size:10px;color:#555;">{{ item[0] }}</span><span style="font-size:10px;font-weight:700;margin-left:4px;">{{ item[2] }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='text_banner'" style="background:#f8f9fa;border-left:4px solid #667eea;border-radius:0 7px 7px 0;padding:12px 14px;">
        <div style="font-size:12px;font-weight:700;color:#222;margin-bottom:4px;">{{ popoverWidget.widgetNm }}</div>
        <div style="font-size:11px;color:#666;line-height:1.6;">텍스트 배너 컨텐츠가 이 영역에 표시됩니다.</div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='info_card'" style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:7px;padding:16px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:30px;">ℹ</div>
        <div><div style="font-size:11px;font-weight:700;color:#1565c0;margin-bottom:3px;">{{ popoverWidget.widgetNm }}</div><div style="font-size:10px;color:#1976d2;line-height:1.5;">정보 카드 컨텐츠 영역입니다.</div></div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='popup'" style="border:1px solid #e0e0e0;border-radius:7px;overflow:hidden;">
        <div style="background:#f5f5f5;padding:7px 12px;display:flex;justify-content:space-between;border-bottom:1px solid #e0e0e0;"><span style="font-size:10px;font-weight:700;color:#555;">팝업</span><span style="color:#aaa;">×</span></div>
        <div style="padding:18px;text-align:center;"><div style="font-size:24px;margin-bottom:6px;">💬</div><div style="font-size:12px;font-weight:700;color:#333;">{{ popoverWidget.widgetNm }}</div></div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='file'" style="display:flex;align-items:center;gap:10px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:7px;padding:12px 14px;">
        <span style="font-size:26px;">📎</span>
        <div><div style="font-size:11px;font-weight:700;color:#333;">{{ popoverWidget.widgetNm }}</div><div style="font-size:10px;color:#999;margin-top:2px;">파일 다운로드</div></div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='file_list'">
        <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:16px;">📁</span><span style="font-size:10px;color:#555;flex:1;">파일명_{{ n }}.pdf</span><span style="font-size:9px;color:#aaa;">1.{{ n }}MB</span>
        </div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='coupon'" style="border:2px dashed #e8587a;border-radius:7px;padding:14px;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
        <div style="font-size:30px;">🎟</div>
        <div style="flex:1;"><div style="font-size:12px;font-weight:800;color:#c2185b;margin-bottom:2px;">{{ popoverWidget.widgetNm }}</div><div style="font-size:10px;color:#e8587a;">쿠폰 발급 이벤트</div></div>
        <div style="background:#e8587a;color:#fff;border-radius:6px;padding:7px 11px;font-size:11px;font-weight:700;white-space:nowrap;">쿠폰 받기</div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='html_editor'" style="background:#1e1e2e;border-radius:7px;padding:12px;font-family:monospace;font-size:10px;color:#a9b7c6;line-height:1.7;">
        <span style="color:#cc7832;">&lt;div&gt;</span><br>&nbsp;&nbsp;HTML 컨텐츠 ({{ popoverWidget.widgetNm }})<br><span style="color:#cc7832;">&lt;/div&gt;</span>
      </div>
      <div v-else-if="popoverWidget.widgetType==='event_banner'" style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:7px;padding:20px;text-align:center;color:#fff;">
        <div style="font-size:22px;margin-bottom:6px;">🎉</div>
        <div style="font-size:13px;font-weight:800;letter-spacing:.5px;">{{ popoverWidget.widgetNm }}</div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='cache_banner'" style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:7px;padding:16px;display:flex;align-items:center;gap:12px;color:#fff;">
        <div style="font-size:30px;">💰</div>
        <div><div style="font-size:11px;opacity:.85;margin-bottom:2px;">적립금 / 캐시</div><div style="font-size:18px;font-weight:800;">+0,000P</div></div>
      </div>
      <div v-else-if="popoverWidget.widgetType==='widget_embed'" style="border:2px dashed #a0aec0;border-radius:7px;padding:20px;text-align:center;background:#f7fafc;">
        <div style="font-size:24px;margin-bottom:6px;">🧩</div>
        <div style="font-size:12px;font-weight:700;color:#4a5568;margin-bottom:2px;">{{ popoverWidget.widgetNm }}</div>
        <div style="font-size:10px;color:#a0aec0;">외부 위젯 임베드 영역</div>
      </div>
      <div v-else style="background:#f5f5f5;border-radius:7px;padding:16px;text-align:center;color:#888;">
        <div style="font-size:22px;margin-bottom:4px;">{{ wIcon(popoverWidget.widgetType) }}</div>
        <div style="font-size:11px;">{{ wLabel(popoverWidget.widgetType) }}</div>
      </div>
    </div>
  </div>

  <!-- 카테고리 선택 모달 -->
  <category-select-modal :show="showCatModal" :selected-ids="[...selectedCatIds]" @close="showCatModal=false" @apply="onCatApply" />

</div>
  `,
};

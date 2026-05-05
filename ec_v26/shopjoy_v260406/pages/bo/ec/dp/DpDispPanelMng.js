/* ShopJoy Admin - 전시관리 목록 + 하단 DispDtl 임베드 */
window.DpDispPanelMng = {
  name: 'DpDispPanelMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const panels = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, cardPreviewItem: null, panelDragSrc: null, panelDragOverIdx: -1, widgetDragPanel: null, widgetDragSrcWi: null, widgetDragOverWi: null, selectedTreeKey: '', selectedPath: null, sortKey: '', sortDir: 'asc' });
    const displays = reactive([]);
    const codes = reactive({
      layout_types: [],
      disp_area: [],
      active_statuses: [],
      visibility_opts: [
        { value: '', label: '전체' },
        { value: 'PUBLIC',    label: '전체공개' },
        { value: 'MEMBER',    label: '회원공개' },
        { value: 'VERIFIED',  label: '인증회원' },
        { value: 'PREMIUM',   label: '우수회원↑' },
        { value: 'VIP',       label: 'VIP전용' },
        { value: 'INVITED',   label: '초대회원' },
        { value: 'STAFF',     label: '직원' },
        { value: 'EXECUTIVE', label: '임직원' },
      ],
      date_range_opts: [],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.layout_types = codeStore.sgGetGrpCodes('LAYOUT_TYPE');
      codes.disp_area = codeStore.sgGetGrpCodes('DISP_AREA');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData(buildSearchParams?.() || {});
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    const handleSearchData = async (uiParams = {}) => {
      uiState.loading = true;
      try {
        const params = { pageNo: 1, pageSize: 10000, ...getSortParam(), ...uiParams };
        const [panelsRes, displaysRes] = await Promise.all([
          boApiSvc.dpPanel.getPage({ pageNo: 1, pageSize: 10000 }, '전시패널관리', '조회'),
          boApiSvc.dpUi.getPage(params, '전시패널관리', '조회'),
        ]);
        panels.splice(0, panels.length, ...(panelsRes.data?.data?.pageList || panelsRes.data?.data?.list || []));
        displays.splice(0, displays.length, ...(displaysRes.data?.data?.pageList || displaysRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });
    const fnPathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispPanelMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 패널미리보기 */
    const previewDisp = (d) => {
      const areaPageMap = {
        'HOME_BANNER': '', 'HOME_PRODUCT': '', 'HOME_CHART': '', 'HOME_EVENT': '',
        'PRODUCT_TOP': '#page=prod01list', 'PRODUCT_BTM': '#page=prod01list',
        'MY_PAGE': '#page=mypage', 'FOOTER': '',
      };
      const hash = areaPageMap[d.area] || '';
      window.open(`${window.pageUrl('index.html')}${hash}`, '_blank', 'width=1280,height=900,scrollbars=yes');
    };

    /* 표현설정 요약 */
    const fnDispSummary = (d) => {
      if (d.widgetType === 'image_banner') return d.imageUrl ? '🖼 ' + d.imageUrl.split('/').pop().slice(0, 20) : '-';
      if (d.widgetType === 'product_slider' || d.widgetType === 'product') return d.productIds ? '상품: ' + d.productIds.slice(0, 20) : '-';
      if (d.widgetType === 'coupon') return d.couponCode ? '쿠폰: ' + d.couponCode : '-';
      if (d.widgetType === 'file') return d.fileUrl ? '파일: ' + d.fileLabel || d.fileUrl.split('/').pop() : '-';
      if (d.widgetType === 'event_banner') return d.eventId ? '이벤트#' + d.eventId : '-';
      if (d.widgetType === 'cache_banner') return d.cacheDesc || '-';
      if (d.widgetType === 'html_editor') return d.htmlContent ? d.htmlContent.replace(/<[^>]+>/g, '').slice(0, 20) + '…' : '-';
      if (d.widgetType === 'textarea') return d.textareaContent ? d.textareaContent.slice(0, 20) + (d.textareaContent.length > 20 ? '…' : '') : '-';
      if (d.widgetType === 'markdown') return d.markdownContent ? d.markdownContent.slice(0, 20) + (d.markdownContent.length > 20 ? '…' : '') : '-';
      if (['barcode','qrcode','barcode_qrcode'].includes(d.widgetType)) return d.codeValue ? '코드: ' + d.codeValue.slice(0, 20) : '-';
      if (d.widgetType === 'video_player')    return d.videoUrl ? d.videoUrl.slice(0, 30) + '…' : '-';
      if (d.widgetType === 'countdown')       return d.countdownTarget || '-';
      if (d.widgetType === 'payment_widget')  return d.payAmount ? Number(d.payAmount).toLocaleString() + '원' : '-';
      if (d.widgetType === 'approval_widget') return d.approvalDocType || '-';
      if (d.widgetType === 'map_widget')      return d.mapAddress || (d.mapLat ? `${d.mapLat},${d.mapLng}` : '-');
      if (d.widgetType === 'widget_embed') return d.embedCode ? d.embedCode.slice(0, 20) + '…' : '-';
      if (d.widgetType.startsWith('chart_')) return d.chartTitle || '-';
      if (d.widgetType === 'text_banner') return d.textContent ? d.textContent.slice(0, 20) + (d.textContent.length > 20 ? '…' : '') : '-';
      if (d.widgetType === 'info_card') return d.infoTitle || '-';
      if (d.widgetType === 'popup') return d.popupWidth && d.popupHeight ? `${d.popupWidth}×${d.popupHeight}` : '-';
      return '-';
    };

    const cfFiltered = computed(() => {
      if (!uiState.selectedTreeKey) return displays;
      const k = uiState.selectedTreeKey;
      return window.safeArrayUtils.safeFilter(displays, d => {
        if (k.startsWith('panel_')) return d.dispId === k.slice(6);
        const areaNm = (code) => {
          const c = window.safeArrayUtils.safeFind(codes.disp_area, x => x.codeValue === code);
          return c ? c.codeLabel : code;
        };
        const area = d.area || '';
        if (k.includes('_')) {
          const [topPrefix, ...labelParts] = k.split('_');
          const targetLabel = labelParts.join('_');
          if (!area.startsWith(topPrefix + '_')) return false;
          return areaNm(area) === targetLabel;
        } else {
          return area === k || area.startsWith(k + '_');
        }
      });
    });
    const cfAreas = computed(() =>
      (codes.disp_area || [])
        .filter(c => c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = cfFiltered.value.length;
      pager.pageTotalPage  = Math.max(1, Math.ceil(cfFiltered.value.length / pager.pageSize));
      const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
      pager.pageList = cfFiltered.value.slice((pager.pageNo-1)*pager.pageSize, pager.pageNo*pager.pageSize);
    };
    watch(cfFiltered, () => { fnBuildPagerNums(); });
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const fnTypeBadge = t => ({
      'image_banner':'badge-blue', 'product_slider':'badge-purple', 'product':'badge-purple',
      'chart_bar':'badge-orange', 'chart_line':'badge-orange', 'chart_pie':'badge-orange',
      'text_banner':'badge-gray', 'info_card':'badge-blue', 'popup':'badge-red',
      'file':'badge-gray', 'coupon':'badge-green', 'html_editor':'badge-orange',
      'textarea':'badge-gray', 'markdown':'badge-blue',
      'barcode':'badge-purple',  'qrcode':'badge-purple',      'barcode_qrcode':'badge-purple',
      'video_player':'badge-red', 'countdown':'badge-orange',   'payment_widget':'badge-green',
      'approval_widget':'badge-blue', 'map_widget':'badge-blue',
      'event_banner':'badge-blue', 'cache_banner':'badge-green', 'widget_embed':'badge-purple',
    }[t] || 'badge-gray');
    const fnTypeLabel = t => ({
      'image_banner':'이미지배너', 'product_slider':'상품슬라이더', 'product':'상품',
      'chart_bar':'차트(Bar)', 'chart_line':'차트(Line)', 'chart_pie':'차트(Pie)',
      'text_banner':'텍스트배너', 'info_card':'정보카드', 'popup':'팝업',
      'file':'파일', 'coupon':'쿠폰', 'html_editor':'HTML에디터',
      'textarea':'텍스트영역', 'markdown':'Markdown',
      'barcode':'바코드',      'qrcode':'QR코드',        'barcode_qrcode':'바코드+QR',
      'video_player':'동영상', 'countdown':'카운트다운', 'payment_widget':'결제위젯',
      'approval_widget':'전자결재', 'map_widget':'지도맵',
      'event_banner':'이벤트', 'cache_banner':'캐쉬', 'widget_embed':'위젯',
    }[t] || t);

    const setDispNow = () => {
      const now = new Date();
      searchParam.dispDate = now.toISOString().slice(0, 10);
      searchParam.dispTime = now.toTimeString().slice(0, 5);
    };

    const buildSearchParams = () => ({
      ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
      ...Object.fromEntries(Object.entries(searchParam).filter(([k, v]) => k !== 'dateRange' && v !== '' && v !== null && v !== undefined)),
    });

    const onSearch = async () => { pager.pageNo = 1; await handleSearchData(buildSearchParams()); };

    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      handleSearchData({});
    };
  
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; fnBuildPagerNums(); } };
    const onSizeChange = () => { pager.pageNo = 1; fnBuildPagerNums(); };

    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = displays.findIndex(x => x.dispId === d.dispId);
      if (idx !== -1) displays.splice(idx, 1);
      if (uiStateDetail.selectedId === d.dispId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.dpPanel.remove(d.dispId, '전시패널관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'dispId'},{label:'영역',key:'dispArea'},{label:'제목',key:'title'},{label:'유형',key:'dispType'},{label:'상태',key:'status'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}], '전시목록.csv');

    /* 영역 레이블 조회 */
    const fnAreaLabel = (code) => {
      const found = (codes.disp_area || []).find(c => c.codeValue === code);
      return found ? found.codeLabel : code;
    };

    /* 펼치기/접기 */
    const expandedIds = reactive(new Set());
    const toggleExpand = (id) => {
      if (expandedIds.has(id)) expandedIds.delete(id);
      else expandedIds.add(id);
    };
    const isExpanded = (id) => expandedIds.has(id);

    /* 위젯 유형 레이블 (목록용) */
    const WIDGET_TYPE_LABELS = {
      'image_banner':'이미지 배너', 'product_slider':'상품 슬라이더', 'product':'상품',
      'cond_product':'조건상품', 'chart_bar':'차트(Bar)', 'chart_line':'차트(Line)', 'chart_pie':'차트(Pie)',
      'text_banner':'텍스트 배너', 'info_card':'정보카드', 'popup':'팝업',
      'file':'파일', 'file_list':'파일목록', 'coupon':'쿠폰', 'html_editor':'HTML 에디터',
      'textarea':'텍스트 영역', 'markdown':'Markdown',
      'barcode':'바코드',      'qrcode':'QR코드',        'barcode_qrcode':'바코드+QR',
      'video_player':'동영상', 'countdown':'카운트다운', 'payment_widget':'결제위젯',
      'approval_widget':'전자결재', 'map_widget':'지도맵',
      'event_banner':'이벤트', 'cache_banner':'캐쉬', 'widget_embed':'위젯',
    };
    const fnWLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';

    /* 패널미리보기 (카드) */
        const openCardPreview = (d) => { uiState.cardPreviewItem = d; };
    const closeCardPreview = () => { uiState.cardPreviewItem = null; };

    /* -- 패널 드래그 정렬 -- */
        const onPanelDragStart = (e, pageIdx) => {
      uiState.panelDragSrc = pageIdx;
      e.dataTransfer.effectAllowed = 'move';
    };
    const onPanelDragOver = (e, pageIdx) => {
      e.preventDefault();
      if (uiState.panelDragSrc === null || uiState.panelDragSrc === pageIdx) return;
      uiState.panelDragOverIdx = pageIdx;
    };
    const onPanelDragLeave = () => { uiState.panelDragOverIdx = -1; };
    const onPanelDrop = (e, pageIdx) => {
      e.preventDefault(); uiState.panelDragOverIdx = -1;
      const src = uiState.panelDragSrc;
      if (src === null || src === pageIdx) { uiState.panelDragSrc = null; return; }
      const srcId = pager.pageList?.[src]?.dispId;
      const tgtId = pager.pageList?.[pageIdx]?.dispId;
      if (!srcId || !tgtId) { uiState.panelDragSrc = null; return; }
      const arr = displays;
      const si = arr.findIndex(x => x.dispId === srcId);
      const ti = arr.findIndex(x => x.dispId === tgtId);
      if (si === -1 || ti === -1) { uiState.panelDragSrc = null; return; }
      const moved = arr.splice(si, 1)[0];
      arr.splice(ti, 0, moved);
      window.safeArrayUtils.safeForEach(arr, (x, i) => { x.sortOrder = i + 1; });
      showToast('패널 순서가 변경되었습니다.', 'info');
      uiState.panelDragSrc = null;
    };
    const onPanelDragEnd = () => { uiState.panelDragSrc = null; uiState.panelDragOverIdx = -1; };

    /* -- 위젯 드래그 정렬 -- */
        const onWidgetDragStart = (e, dispId, wi) => {
      e.stopPropagation();
      uiState.widgetDragPanel = dispId; uiState.widgetDragSrcWi = wi;
      e.dataTransfer.effectAllowed = 'move';
    };
    const onWidgetDragOver = (e, dispId, wi) => {
      e.preventDefault(); e.stopPropagation();
      if (uiState.widgetDragPanel !== dispId) return;
      uiState.widgetDragOverWi = wi;
    };
    const onWidgetDragLeave = (e) => { e.stopPropagation(); uiState.widgetDragOverWi = null; };
    const onWidgetDrop = (e, dispId, wi) => {
      e.preventDefault(); e.stopPropagation();
      uiState.widgetDragOverWi = null;
      if (uiState.widgetDragPanel !== dispId) return;
      const src = uiState.widgetDragSrcWi;
      if (src === null || src === wi) { uiState.widgetDragPanel = null; uiState.widgetDragSrcWi = null; return; }
      const panel = window.safeArrayUtils.safeFind(displays, x => x.dispId === dispId);
      if (!panel?.rows) return;
      const moved = panel.rows.splice(src, 1)[0];
      panel.rows.splice(wi, 0, moved);
      window.safeArrayUtils.safeForEach(panel.rows, (r, i) => { r.sortOrder = i + 1; });
      uiState.widgetDragPanel = null; uiState.widgetDragSrcWi = null;
    };
    const onWidgetDragEnd = () => { uiState.widgetDragPanel = null; uiState.widgetDragSrcWi = null; uiState.widgetDragOverWi = null; };

    /* -- 표시경로 트리 (sy_path 기반) -- */
    const selectPathNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchData(buildSearchParams()); };

    /* -- 표시경로 (영역별 그룹) -- */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { kw: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, area: '', status: '', dispDate: '', dispTime: '', visibility: '', layoutType: '' };
    };
      const searchParam = reactive(_initSearchParam());
  /* '' = 전체, '<areaCode>' = 특정 영역 */
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = (k) => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = (k) => treeOpen.has(k);
    const selectTree = (k) => { uiState.selectedTreeKey = uiState.selectedTreeKey === k ? '' : k; pager.pageNo = 1; };
    const expandAll  = () => {
      treeOpen.add('__root__');
      window.safeArrayUtils.safeForEach(cfPanelTree.value, n => {
        treeOpen.add('grp_'+n.label);
        window.safeArrayUtils.safeForEach(n.children, c => treeOpen.add(n.label+'_'+c.label));
      });
    };
    const collapseAll= () => { treeOpen.clear(); treeOpen.add('__root__'); };

    /* 패널 목록 (영역별 그룹) */
    const cfPanelTree = computed(() => {
      const areaNm = (code) => {
        const c = window.safeArrayUtils.safeFind(codes.disp_area, x => x.codeValue === code);
        return c ? c.codeLabel : code;
      };
      const map = {};
      (displays || []).forEach(p => {
        const area = p.area || '(미등록)';
        const top = area.split('_')[0] || '(기타)';
        const subKey = areaNm(area);
        if (!map[top]) map[top] = {};
        if (!map[top][subKey]) map[top][subKey] = [];
        map[top][subKey].push(p);
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          count: map[top][sub].length,
          panels: map[top][sub].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(p => ({
            label: p.name,
            panelId: p.dispId,
            area: p.area,
            dispId: p.dispId,
          })),
        })),
      }));
    });

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), panels, uiState, fnPathLabel, displays, codes,
      cfPanelTree, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll,
      selectPathNode,
      onDateRangeChange: handleDateRangeChange, cfSiteNm, searchParam, pager, cfFiltered, cfAreas, fnStatusBadge, fnTypeBadge, fnTypeLabel, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewDisp, fnDispSummary, exportExcel, fnAreaLabel, expandedIds, toggleExpand, isExpanded, fnWLabel, openCardPreview, closeCardPreview, onPanelDragStart, onPanelDragOver, onPanelDragLeave, onPanelDrop, onPanelDragEnd, onWidgetDragStart, onWidgetDragOver, onWidgetDragLeave, onWidgetDrop, onWidgetDragEnd, setDispNow, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">전시패널관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 영역별 전시패널 관리</span></div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="패널명 / 영역코드 검색" @keyup.enter="onSearch" />
      <span class="search-label">화면영역</span>
      <select v-model="searchParam.area" style="min-width:160px;">
        <option value="">전체 영역</option>
        <option v-for="a in cfAreas" :key="a?.codeValue" :value="a.codeValue">{{ a.codeValue }} {{ a.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <!-- -- 2행: 전시일·노출조건·인증 ---------------------------------------------- -->
    <div class="search-bar" style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;">
      <span class="search-label">전시일시</span>
      <input type="date" v-model="searchParam.dispDate" class="date-range-input" style="width:145px;" />
      <input type="time" v-model="searchParam.dispTime" class="date-range-input" style="width:145px;" />
      <button @click="setDispNow" style="font-size:11px;padding:3px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;">🕐 현재</button>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">공개대상</span>
      <select v-model="searchParam.visibility" style="min-width:100px;">
        <option v-for="o in codes.visibility_opts" :key="o?.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">표시방식</span>
      <select v-model="searchParam.layoutType" style="min-width:100px;">
        <option value="">전체</option>
        <option v-for="o in codes.layout_types" :key="o?.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
    </div>
  </div>
  <!-- -- 본문: 좌측 트리 + 우측 목록 ---------------------------------------------- -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
  <!-- -- 좌측 표시경로 -------------------------------------------------------- -->
  <div class="card" style="width:240px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div class="toolbar" style="margin-bottom:6px;">
      <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_panel</span></span>
      <span v-if="uiState.selectedPath != null" @click="selectPathNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
    </div>
    <div style="max-height:55vh;overflow:auto;">
      <path-tree biz-cd="ec_disp_panel" :selected="uiState.selectedPath" @select="selectPathNode" />
    </div>
  </div>

  <!-- -- 우측 목록 ---------------------------------------------------------- -->
  <div style="flex:1;min-width:0;">
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시패널 목록 <span class="list-count">{{ cfFiltered.length }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:24px;"></th>
          <th style="width:28px;"></th>
          <th style="width:44px;">ID</th>
          <th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">패널 정보 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th>
          <th style="width:240px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!pager.pageList?.length"><td colspan="6" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <template v-else v-for="(d, pageIdx) in pager.pageList" :key="d?.dispId">
          <tr draggable="true"
            @dragstart="onPanelDragStart($event, pageIdx)"
            @dragover="onPanelDragOver($event, pageIdx)"
            @dragleave="onPanelDragLeave"
            @drop="onPanelDrop($event, pageIdx)"
            @dragend="onPanelDragEnd"
            :style="(uiStateDetail.selectedId===d.dispId?'background:#fff8f9;':'') + (uiState.panelDragOverIdx===pageIdx?'outline:2px solid #1d4ed8;background:#e3f2fd;':'')">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + pageIdx + 1 }}</td>
            <td style="text-align:center;padding:0;cursor:grab;color:#bbb;font-size:16px;user-select:none;">⠿</td>
            <td style="text-align:center;padding:0;">
              <button @click="toggleExpand(d.dispId)"
                style="background:none;border:none;cursor:pointer;font-size:11px;color:#999;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
                {{ isExpanded(d.dispId) ? '▼' : '▶' }}
              </button>
            </td>
            <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">{{ d.dispId }}</td>
            <td style="padding:10px 12px;">
              <!-- -- 패널명 ------------------------------------------------ -->
              <div style="margin-bottom:6px;">
                <span class="title-link" @click="handleLoadDetail(d.dispId)"
                  :style="'font-size:14px;font-weight:700;'+(uiStateDetail.selectedId===d.dispId?'color:#e8587a;':'color:#222;')">
                  {{ d.name }}
                  <span v-if="uiStateDetail.selectedId===d.dispId" style="font-size:10px;margin-left:3px;">▼</span>
                </span>
                <span class="badge" :class="fnStatusBadge(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
              </div>
              <!-- -- label:value 라인 ------------------------------------- -->
              <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
                <span><b style="color:#888;">표시경로:</b>
                  <template v-if="fnPathLabel(d.pathId) || d.displayPath">
                    <span style="background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ fnPathLabel(d.pathId) || d.displayPath }}</span>
                  </template>
                  <template v-else>
                    <span style="font-size:9px;background:#fff3e0;color:#e65100;border-radius:6px;padding:1px 6px;margin-left:3px;font-weight:600;white-space:nowrap;">(패널)</span>
                    <span style="background:#e8f0fe;color:#0277bd;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ (d.area||'').split('_')[0] }}</span>
                    <span style="color:#ccc;margin:0 3px;">·</span>
                    <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">{{ fnAreaLabel(d.area) }}</span>
                  </template>
                </span>
                <span><b style="color:#888;">화면영역:</b>
                  <code style="font-size:10px;background:#f0f2f5;padding:1px 5px;border-radius:3px;margin:0 3px;">{{ d.area }}</code>
                  {{ fnAreaLabel(d.area) }}
                </span>
                <span><b style="color:#888;">표시:</b>
                  {{ (d.layoutType||'grid')==='dashboard' ? '🧩 대시보드' : '🔲 그리드 ' + (d.gridCols||1) + '열' }}
                </span>
                <span><b style="color:#888;">순서:</b> {{ d.sortOrder != null ? d.sortOrder : '-' }}</span>
                <span><b style="color:#888;">타이틀:</b>
                  {{ d.titleYn==='Y' ? (d.title || '표시') : '미표시' }}
                </span>
                <span><b style="color:#888;">노출조건:</b>
                  <span style="background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ d.condition || '항상 표시' }}</span>
                </span>
                <span v-if="d.authRequired"><b style="color:#888;">인증:</b>
                  <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;margin-left:3px;">필요</span>
                  <span v-if="d.authGrade" style="background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ d.authGrade }}↑</span>
                </span>
                <span><b style="color:#888;">전시기간:</b>
                  <template v-if="d.dispStartDate || d.dispEndDate">
                    {{ d.dispStartDate || '∞' }} {{ d.dispStartTime || '' }} ~ {{ d.dispEndDate || '∞' }} {{ d.dispEndTime || '' }}
                  </template>
                  <span v-else style="color:#ccc;">없음</span>
                </span>
                <span><b style="color:#888;">등록일:</b> {{ d.regDate || '-' }}</span>
                <span><b style="color:#888;">사이트:</b>
                  <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
                </span>
              </div>
            </td>
            <td style="vertical-align:top;padding-top:10px;">
              <div class="actions" style="justify-content:flex-end;">
                <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.dispId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(d)">삭제</button>
              </div>
            </td>
          </tr>
          <!-- -- 위젯 펼치기 서브 행 -------------------------------------------- -->
          <tr v-if="isExpanded(d.dispId)" :key="'exp_'+d.dispId">
            <td colspan="5" style="padding:0;background:#f8f9fb;border-top:none;">
              <div style="padding:10px 16px 12px 44px;">
                <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;letter-spacing:.3px;">📌 연결된 항목 ({{ (d.rows||[]).length }}개)</div>
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                  <thead>
                    <tr style="background:#eef0f3;color:#666;">
                      <th style="padding:4px 4px;text-align:center;width:24px;font-weight:600;"></th>
                      <th style="padding:4px 8px;text-align:center;width:48px;font-weight:600;">순서</th>
                      <th style="padding:4px 8px;font-weight:600;">전시항목명</th>
                      <th style="padding:4px 8px;text-align:center;width:120px;font-weight:600;">유형</th>
                      <th style="padding:4px 8px;text-align:center;width:100px;font-weight:600;">클릭동작</th>
                      <th style="padding:4px 8px;text-align:center;width:60px;font-weight:600;">사용여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="d.rows && d.rows.length">
                      <tr v-for="(w, wi) in d.rows" :key="wi"
                        draggable="true"
                        @dragstart="onWidgetDragStart($event, d.dispId, wi)"
                        @dragover="onWidgetDragOver($event, d.dispId, wi)"
                        @dragleave="onWidgetDragLeave"
                        @drop="onWidgetDrop($event, d.dispId, wi)"
                        @dragend="onWidgetDragEnd"
                        :style="'border-bottom:1px solid #e8eaed;' + (wi % 2 === 1 ? 'background:#fff;' : '') + (uiState.widgetDragOverWi===wi && uiState.widgetDragPanel===d.dispId ? 'outline:2px solid #1d4ed8;background:#e3f2fd;' : '')">
                        <td style="padding:4px 4px;text-align:center;cursor:grab;color:#bbb;font-size:14px;user-select:none;">⠿</td>
                        <td style="padding:4px 8px;text-align:center;color:#aaa;">{{ w.sortOrder || (wi+1) }}</td>
                        <td style="padding:4px 8px;color:#444;">
                          <span style="font-size:10px;background:#e8f4f8;color:#0277bd;border-radius:8px;padding:2px 8px;font-weight:600;margin-right:6px;white-space:nowrap;">아이템</span>
                          {{ w.widgetNm || ('전시항목 ' + (wi+1)) }}
                        </td>
                        <td style="padding:4px 8px;text-align:center;">
                          <span style="background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:1px 7px;font-size:10px;">{{ fnWLabel(w.widgetType) }}</span>
                        </td>
                        <td style="padding:4px 8px;text-align:center;color:#888;">{{ w.clickAction || '-' }}</td>
                        <td style="padding:4px 8px;text-align:center;">
                          <span v-if="w.useYn === 'Y'" class="badge badge-green" style="font-size:11px;">사용</span>
                          <span v-else class="badge badge-gray" style="font-size:11px;">미사용</span>
                        </td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td colspan="6" style="padding:8px;text-align:center;color:#bbb;">등록된 전시항목이 없습니다. (수정 후 저장하면 전시항목 정보가 표시됩니다)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  </div><!-- -- /우측 목록 ----------------------------------------------------------- -->
  </div><!-- -- /본문 flex --------------------------------------------------------- -->

  <!-- -- 하단 상세: DispDtl 임베드 --------------------------------------------- -->
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-panel-dtl
      :key="uiStateDetail.selectedId"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    :on-list-reload="handleSearchData"
  />
  </div>

  <!-- -- 패널미리보기 오버레이 ---------------------------------------------------- -->
  <div v-if="uiState.cardPreviewItem"
    @click.self="closeCardPreview"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:14px;width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
      <!-- -- 헤더 --------------------------------------------------------- -->
      <div style="background:linear-gradient(135deg,#e8587a,#c0395e);color:#fff;padding:15px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;">🖼 패널미리보기</span>
        <button @click="closeCardPreview" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.85;line-height:1;padding:0;">×</button>
      </div>
      <!-- -- 카드 본문 ------------------------------------------------------ -->
      <div style="padding:24px;">
        <!-- -- 영역 + 상태 배지 ----------------------------------------------- -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
          <code style="font-size:11px;background:#f0f2f5;color:#555;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">{{ uiState.cardPreviewItem.area }}</code>
          <span style="font-size:12px;background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 10px;">{{ fnAreaLabel(uiState.cardPreviewItem.area) }}</span>
          <span class="badge" :class="uiState.cardPreviewItem.status==='활성'?'badge-green':'badge-gray'" style="font-size:12px;">{{ uiState.cardPreviewItem.status }}</span>
        </div>
        <!-- -- 패널명 ------------------------------------------------------ -->
        <div style="font-size:22px;font-weight:800;color:#222;margin-bottom:16px;line-height:1.3;">{{ uiState.cardPreviewItem.name }}</div>
        <!-- -- 노출조건 / 인증 배지 --------------------------------------------- -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:12px;padding:4px 12px;">{{ uiState.cardPreviewItem.condition || '항상 표시' }}</span>
          <span v-if="uiState.cardPreviewItem.authRequired" style="font-size:12px;background:#fff3e0;color:#e65100;border-radius:12px;padding:4px 12px;">인증 필요</span>
          <span v-if="uiState.cardPreviewItem.authRequired && uiState.cardPreviewItem.authGrade" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:12px;padding:4px 12px;">{{ uiState.cardPreviewItem.authGrade }} 이상</span>
        </div>
        <!-- -- 전시 기간 ---------------------------------------------------- -->
        <div v-if="uiState.cardPreviewItem.dispStartDate || uiState.cardPreviewItem.dispEndDate"
          style="font-size:12px;color:#555;background:#f8faff;border:1px solid #e0e8f8;border-radius:8px;padding:10px 14px;margin-bottom:16px;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:600;">📅 전시 기간</div>
          <span>{{ uiState.cardPreviewItem.dispStartDate || '∞' }} {{ uiState.cardPreviewItem.dispStartTime || '' }}</span>
          <span style="color:#aaa;margin:0 8px;">~</span>
          <span>{{ uiState.cardPreviewItem.dispEndDate || '∞' }} {{ uiState.cardPreviewItem.dispEndTime || '' }}</span>
        </div>
        <div v-else style="font-size:12px;color:#bbb;margin-bottom:16px;">전시 기간 미설정</div>
        <!-- -- 위젯 구성 ---------------------------------------------------- -->
        <div style="border-top:1px solid #f0f0f0;padding-top:14px;">
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">📐 전시항목 구성</div>
          <template v-if="uiState.cardPreviewItem.rows && uiState.cardPreviewItem.rows.length">
            <div v-for="(r, i) in uiState.cardPreviewItem.rows" :key="Math.random()"
              style="display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:6px;background:#fafafa;">
              <span style="font-size:11px;color:#bbb;font-weight:700;min-width:16px;text-align:center;">{{ r.sortOrder || i+1 }}</span>
              <span style="font-size:13px;font-weight:600;color:#333;flex:1;">{{ fnWLabel(r.widgetType) }}</span>
              <span v-if="r.clickAction && r.clickAction !== 'none'"
                style="font-size:10px;color:#888;background:#f0f0f0;border-radius:8px;padding:2px 8px;">{{ r.clickAction }}</span>
            </div>
          </template>
          <div v-else style="font-size:12px;color:#bbb;padding:12px;text-align:center;background:#f9f9f9;border-radius:8px;">
            전시항목 정보가 없습니다. 수정 후 저장하면 표시됩니다.
          </div>
        </div>
      </div>
      <!-- -- 푸터 --------------------------------------------------------- -->
      <div style="padding:12px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:#aaa;">ID: {{ uiState.cardPreviewItem.dispId }} · 등록일: {{ uiState.cardPreviewItem.regDate }}</span>
        <div style="display:flex;gap:8px;">
          <button @click="previewDisp(uiState.cardPreviewItem); closeCardPreview();" class="btn btn-sm" style="background:#e8f0fe;border:1px solid #b0c4de;color:#1a73e8;font-size:11px;">👁 내용미리보기</button>
          <button @click="closeCardPreview" class="btn btn-secondary btn-sm">닫기</button>
        </div>
      </div>
    </div>
  </div>
</div>
`
};

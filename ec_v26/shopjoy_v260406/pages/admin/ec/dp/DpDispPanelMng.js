/* ShopJoy Admin - 전시관리 목록 + 하단 DispDtl 임베드 */
window.DpDispPanelMng = {
  name: 'DpDispPanelMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchArea = ref('');
    const searchStatus = ref('');
    const searchDispDate = ref('');
    const searchDispTime = ref('');
    const searchVisibility = ref('');
    const searchLayoutType = ref('');
    const VISIBILITY_OPTS  = [
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
    const LAYOUT_TYPE_OPTS = [{ value:'grid', label:'그리드' }, { value:'dashboard', label:'대시보드' }];
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispPanelMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

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
    const dispSummary = (d) => {
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

    const applied = Vue.reactive({ kw: '', area: '', status: '', dateStart: '', dateEnd: '', dispDate: '', dispTime: '', visibility: '', layoutType: '' });

    const filtered = computed(() => props.dispDataset.displays.filter(d => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !d.name.toLowerCase().includes(kw) && !d.area.toLowerCase().includes(kw)) return false;
      if (applied.area && d.area !== applied.area) return false;
      if (applied.status && d.status !== applied.status) return false;
      const _d = String(d.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      /* 전시일시: 특정 일시가 패널 전시기간 내에 포함되는지 */
      if (applied.dispDate) {
        const dt = `${applied.dispDate} ${applied.dispTime || '00:00'}`;
        const ps = `${d.dispStartDate || '0000-01-01'} ${d.dispStartTime || '00:00'}`;
        const pe = `${d.dispEndDate   || '9999-12-31'} ${d.dispEndTime   || '23:59'}`;
        if (dt < ps || dt > pe) return false;
      }
      if (applied.visibility && !window.visibilityUtil.has(d.visibilityTargets, applied.visibility)) return false;
      if (applied.layoutType && (d.layoutType || 'grid') !== applied.layoutType) return false;
      /* 트리 선택 필터 */
      if (selectedTreeKey.value) {
        const k = selectedTreeKey.value;
        if (k.startsWith('panel_')) {
          if (d.dispId !== k.slice(6)) return false;
        } else {
          // top-level prefix or sub-group
          const codes = props.dispDataset.codes || [];
          const areaNm = (code) => {
            const c = codes.find(x => x.codeGrp === 'DISP_AREA' && x.codeValue === code);
            return c ? c.codeLabel : code;
          };

          if (k.includes('_')) {
            // sub-group: "HOME_홈 배너" → find matching area
            const [topPrefix, ...labelParts] = k.split('_');
            const targetLabel = labelParts.join('_');
            const area = d.area || '';
            if (!area.startsWith(topPrefix + '_')) return false;
            if (areaNm(area) !== targetLabel) return false;
          } else {
            // top-level: just prefix like "HOME" or "FOOTER"
            const area = d.area || '';
            if (area === k) {
              // Exact match for simple prefixes like "FOOTER"
              return true;
            } else if (area.startsWith(k + '_')) {
              // Prefix match for "HOME_*" when selecting "HOME"
              return true;
            } else {
              return false;
            }
          }
        }
      }
      return true;
    }));
    const areas = computed(() =>
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const typeBadge = t => ({
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
    const typeLabel = t => ({
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
      searchDispDate.value = now.toISOString().slice(0, 10);
      searchDispTime.value = now.toTimeString().slice(0, 5);
    };

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        area: searchArea.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
        dispDate: searchDispDate.value,
        dispTime: searchDispTime.value,
        visibility: searchVisibility.value,
        layoutType: searchLayoutType.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchArea.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      searchDispDate.value = ''; searchDispTime.value = '';
      searchVisibility.value = '';
      searchLayoutType.value = '';
      Object.assign(applied, { kw: '', area: '', status: '', dateStart: '', dateEnd: '', dispDate: '', dispTime: '', visibility: '', layoutType: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      const ok = await props.showConfirm('삭제', `[${d.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.dispDataset.displays.findIndex(x => x.dispId === d.dispId);
      if (idx !== -1) props.dispDataset.displays.splice(idx, 1);
      if (selectedId.value === d.dispId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`disps/${d.dispId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'dispId'},{label:'영역',key:'dispArea'},{label:'제목',key:'title'},{label:'유형',key:'dispType'},{label:'상태',key:'status'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}], '전시목록.csv');

    /* 영역 레이블 조회 */
    const areaLabel = (code) => {
      const found = (props.dispDataset.codes || []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === code);
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
    const wLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';

    /* 패널미리보기 (카드) */
    const cardPreviewItem = ref(null);
    const openCardPreview = (d) => { cardPreviewItem.value = d; };
    const closeCardPreview = () => { cardPreviewItem.value = null; };

    /* ── 패널 드래그 정렬 ── */
    const panelDragSrc    = ref(null);
    const panelDragOverIdx = ref(-1);
    const onPanelDragStart = (e, pageIdx) => {
      panelDragSrc.value = pageIdx;
      e.dataTransfer.effectAllowed = 'move';
    };
    const onPanelDragOver = (e, pageIdx) => {
      e.preventDefault();
      if (panelDragSrc.value === null || panelDragSrc.value === pageIdx) return;
      panelDragOverIdx.value = pageIdx;
    };
    const onPanelDragLeave = () => { panelDragOverIdx.value = -1; };
    const onPanelDrop = (e, pageIdx) => {
      e.preventDefault(); panelDragOverIdx.value = -1;
      const src = panelDragSrc.value;
      if (src === null || src === pageIdx) { panelDragSrc.value = null; return; }
      const srcId = pageList.value[src]?.dispId;
      const tgtId = pageList.value[pageIdx]?.dispId;
      if (!srcId || !tgtId) { panelDragSrc.value = null; return; }
      const arr = props.dispDataset.displays;
      const si = arr.findIndex(x => x.dispId === srcId);
      const ti = arr.findIndex(x => x.dispId === tgtId);
      if (si === -1 || ti === -1) { panelDragSrc.value = null; return; }
      const moved = arr.splice(si, 1)[0];
      arr.splice(ti, 0, moved);
      arr.forEach((x, i) => { x.sortOrder = i + 1; });
      props.showToast('패널 순서가 변경되었습니다.', 'info');
      panelDragSrc.value = null;
    };
    const onPanelDragEnd = () => { panelDragSrc.value = null; panelDragOverIdx.value = -1; };

    /* ── 위젯 드래그 정렬 ── */
    const widgetDragPanel  = ref(null);
    const widgetDragSrcWi  = ref(null);
    const widgetDragOverWi = ref(null);
    const onWidgetDragStart = (e, dispId, wi) => {
      e.stopPropagation();
      widgetDragPanel.value = dispId; widgetDragSrcWi.value = wi;
      e.dataTransfer.effectAllowed = 'move';
    };
    const onWidgetDragOver = (e, dispId, wi) => {
      e.preventDefault(); e.stopPropagation();
      if (widgetDragPanel.value !== dispId) return;
      widgetDragOverWi.value = wi;
    };
    const onWidgetDragLeave = (e) => { e.stopPropagation(); widgetDragOverWi.value = null; };
    const onWidgetDrop = (e, dispId, wi) => {
      e.preventDefault(); e.stopPropagation();
      widgetDragOverWi.value = null;
      if (widgetDragPanel.value !== dispId) return;
      const src = widgetDragSrcWi.value;
      if (src === null || src === wi) { widgetDragPanel.value = null; widgetDragSrcWi.value = null; return; }
      const panel = props.dispDataset.displays.find(x => x.dispId === dispId);
      if (!panel?.rows) return;
      const moved = panel.rows.splice(src, 1)[0];
      panel.rows.splice(wi, 0, moved);
      panel.rows.forEach((r, i) => { r.sortOrder = i + 1; });
      widgetDragPanel.value = null; widgetDragSrcWi.value = null;
    };
    const onWidgetDragEnd = () => { widgetDragPanel.value = null; widgetDragSrcWi.value = null; widgetDragOverWi.value = null; };

    /* ── 표시경로 (영역별 그룹) ── */
    const selectedTreeKey = ref('');   /* '' = 전체, '<areaCode>' = 특정 영역 */
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = (k) => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = (k) => treeOpen.value.has(k);
    const selectTree = (k) => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const expandAll  = () => {
      treeOpen.value.add('__root__');
      panelTree.value.forEach(n => {
        treeOpen.value.add('grp_'+n.label);
        n.children.forEach(c => treeOpen.value.add(n.label+'_'+c.label));
      });
    };
    const collapseAll= () => { treeOpen.value.clear(); treeOpen.value.add('__root__'); };

    /* 패널 목록 (영역별 그룹) */
    const panelTree = computed(() => {
      const codes = props.dispDataset.codes || [];
      const areaNm = (code) => {
        const c = codes.find(x => x.codeGrp === 'DISP_AREA' && x.codeValue === code);
        return c ? c.codeLabel : code;
      };
      const map = {};
      (props.dispDataset.displays || []).forEach(p => {
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

    return {
      pathLabel,
      panelTree, selectedTreeKey, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll, searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchArea, searchStatus, searchDispDate, searchDispTime, setDispNow, searchVisibility, searchLayoutType, VISIBILITY_OPTS, LAYOUT_TYPE_OPTS, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, areas, statusBadge, typeBadge, typeLabel, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, previewDisp, dispSummary, exportExcel, areaLabel, expandedIds, toggleExpand, isExpanded, wLabel, cardPreviewItem, openCardPreview, closeCardPreview, panelDragSrc, panelDragOverIdx, onPanelDragStart, onPanelDragOver, onPanelDragLeave, onPanelDrop, onPanelDragEnd, widgetDragPanel, widgetDragSrcWi, widgetDragOverWi, onWidgetDragStart, onWidgetDragOver, onWidgetDragLeave, onWidgetDrop, onWidgetDragEnd };
  },
  template: /* html */`
<div>
  <div class="page-title">전시패널관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 영역별 전시패널 관리</span></div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="패널명 / 영역코드 검색" />
      <span class="search-label">화면영역</span>
      <select v-model="searchArea" style="min-width:160px;">
        <option value="">전체 영역</option>
        <option v-for="a in areas" :key="a.codeValue" :value="a.codeValue">{{ a.codeValue }} {{ a.codeLabel }}</option>
      </select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>비활성</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <!-- 2행: 전시일·노출조건·인증 -->
    <div class="search-bar" style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;">
      <span class="search-label">전시일시</span>
      <input type="date" v-model="searchDispDate" class="date-range-input" style="width:145px;" />
      <input type="time" v-model="searchDispTime" class="date-range-input" style="width:145px;" />
      <button @click="setDispNow" style="font-size:11px;padding:3px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;">🕐 현재</button>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">공개대상</span>
      <select v-model="searchVisibility" style="min-width:100px;">
        <option v-for="o in VISIBILITY_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div style="width:1px;height:24px;background:#e8e8e8;margin:0 4px;"></div>
      <span class="search-label">표시방식</span>
      <select v-model="searchLayoutType" style="min-width:100px;">
        <option value="">전체</option>
        <option v-for="o in LAYOUT_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>
  </div>
  <!-- 본문: 좌측 트리 + 우측 목록 -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
  <!-- 좌측 표시경로 -->
  <div class="card" style="width:240px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
      <span style="font-size:12px;font-weight:700;color:#555;">표시경로</span>
      <span style="font-size:10px;color:#aaa;">{{ panelTree.length }}그룹</span>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      <button @click="expandAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▼ 전체펼치기</button>
      <button @click="collapseAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▶ 전체닫기</button>
    </div>
    <!-- 루트 -->
    <div @click="selectTree('')"
      :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'7px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',
        background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',
        color: selectedTreeKey==='' ? '#1565c0' : '#222',
        fontWeight:700, border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec'),
      }">
      <span @click.stop="toggleTree('__root__')" style="cursor:pointer;">{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
      <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
    </div>
    <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
      <template v-for="node in panelTree" :key="node.label">
        <div @click="selectTree(node.label)"
          :style="{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',
            background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',
            color: selectedTreeKey===node.label ? '#1565c0' : '#333',
            fontWeight: selectedTreeKey===node.label ? 700 : 500,
          }">
          <span @click.stop="toggleTree('grp_'+node.label)" style="cursor:pointer;font-size:9px;transition:transform .2s;display:inline-block;width:12px;flex-shrink:0;"
            :style="isTreeOpen('grp_'+node.label) ? 'transform:rotate(90deg);' : ''">▶</span>
          <span @click.stop="selectTree(node.label)" style="cursor:pointer;flex:1;min-width:0;">{{ node.label }}</span>
          <span @click.stop="selectTree(node.label)" style="cursor:pointer;font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.children.reduce((acc,c)=>acc+c.count,0) }}</span>
        </div>
        <!-- 서브그룹 -->
        <div v-if="isTreeOpen('grp_'+node.label)" style="padding-left:12px;border-left:1px solid #e0e0e0;margin-left:6px;margin-bottom:4px;">
          <template v-for="sub in node.children" :key="node.label+'_'+sub.label">
            <div @click="selectTree(node.label+'_'+sub.label)"
              :style="{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'5px 8px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',marginBottom:'1px',
                background: selectedTreeKey===(node.label+'_'+sub.label) ? '#f9fafb' : 'transparent',
                color: selectedTreeKey===(node.label+'_'+sub.label) ? '#1565c0' : '#555',
                fontWeight: selectedTreeKey===(node.label+'_'+sub.label) ? 600 : 400,
              }">
              <span @click.stop="toggleTree(node.label+'_'+sub.label)" style="cursor:pointer;font-size:9px;transition:transform .2s;display:inline-block;width:12px;flex-shrink:0;"
                :style="isTreeOpen(node.label+'_'+sub.label) ? 'transform:rotate(90deg);' : ''">▶</span>
              <span @click.stop="selectTree(node.label+'_'+sub.label)" style="cursor:pointer;flex:1;min-width:0;">{{ sub.label }}</span>
              <span @click.stop="selectTree(node.label+'_'+sub.label)" style="cursor:pointer;font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ sub.count }}</span>
            </div>
            <!-- 패널 아이템들 -->
            <div v-if="isTreeOpen(node.label+'_'+sub.label)" style="padding-left:12px;border-left:1px solid #e0e0e0;margin-left:6px;margin-bottom:4px;">
              <div v-for="panel in sub.panels" :key="panel.panelId"
                @click.stop="selectTree('panel_'+panel.panelId)"
                :style="{
                  display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'5px 8px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',marginBottom:'1px',
                  background: selectedTreeKey===('panel_'+panel.panelId) ? '#fff3e0' : 'transparent',
                  color: selectedTreeKey===('panel_'+panel.panelId) ? '#e65100' : '#555',
                  fontWeight: selectedTreeKey===('panel_'+panel.panelId) ? 600 : 400,
                }">
                <span style="display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow:hidden;">
                  <span style="font-size:9px;background:#fff3e0;color:#e65100;border-radius:6px;padding:1px 6px;font-weight:600;white-space:nowrap;flex-shrink:0;">(패널)</span>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ panel.label }}</span>
                </span>
                <span style="font-size:9px;background:#e8f0fe;color:#0277bd;border-radius:4px;padding:1px 6px;font-weight:600;flex-shrink:0;margin-left:4px;white-space:nowrap;">
                  {{ (dispDataset.displays||[]).find(d => d.dispId===panel.panelId)?.rows?.length||0 }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>

  <!-- 우측 목록 -->
  <div style="flex:1;min-width:0;">
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시패널 목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:24px;"></th>
          <th style="width:28px;"></th>
          <th style="width:44px;">ID</th>
          <th>패널 정보</th>
          <th style="width:240px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="5" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <template v-for="(d, pageIdx) in pageList" :key="d.dispId">
          <tr draggable="true"
            @dragstart="onPanelDragStart($event, pageIdx)"
            @dragover="onPanelDragOver($event, pageIdx)"
            @dragleave="onPanelDragLeave"
            @drop="onPanelDrop($event, pageIdx)"
            @dragend="onPanelDragEnd"
            :style="(selectedId===d.dispId?'background:#fff8f9;':'') + (panelDragOverIdx===pageIdx?'outline:2px solid #1d4ed8;background:#e3f2fd;':'')">
            <td style="text-align:center;padding:0;cursor:grab;color:#bbb;font-size:16px;user-select:none;">⠿</td>
            <td style="text-align:center;padding:0;">
              <button @click="toggleExpand(d.dispId)"
                style="background:none;border:none;cursor:pointer;font-size:11px;color:#999;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
                {{ isExpanded(d.dispId) ? '▼' : '▶' }}
              </button>
            </td>
            <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">{{ d.dispId }}</td>
            <td style="padding:10px 12px;">
              <!-- 패널명 -->
              <div style="margin-bottom:6px;">
                <span class="title-link" @click="loadDetail(d.dispId)"
                  :style="'font-size:14px;font-weight:700;'+(selectedId===d.dispId?'color:#e8587a;':'color:#222;')">
                  {{ d.name }}
                  <span v-if="selectedId===d.dispId" style="font-size:10px;margin-left:3px;">▼</span>
                </span>
                <span class="badge" :class="statusBadge(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
              </div>
              <!-- label:value 라인 -->
              <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
                <span><b style="color:#888;">표시경로:</b>
                  <template v-if="pathLabel(d.pathId) || d.displayPath">
                    <span style="background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ pathLabel(d.pathId) || d.displayPath }}</span>
                  </template>
                  <template v-else>
                    <span style="font-size:9px;background:#fff3e0;color:#e65100;border-radius:6px;padding:1px 6px;margin-left:3px;font-weight:600;white-space:nowrap;">(패널)</span>
                    <span style="background:#e8f0fe;color:#0277bd;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ (d.area||'').split('_')[0] }}</span>
                    <span style="color:#ccc;margin:0 3px;">·</span>
                    <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;">{{ areaLabel(d.area) }}</span>
                  </template>
                </span>
                <span><b style="color:#888;">화면영역:</b>
                  <code style="font-size:10px;background:#f0f2f5;padding:1px 5px;border-radius:3px;margin:0 3px;">{{ d.area }}</code>
                  {{ areaLabel(d.area) }}
                </span>
                <span><b style="color:#888;">표시:</b>
                  {{ (d.layoutType||'grid')==='dashboard' ? '🧩 대시보드' : '🔲 그리드 ' + (d.gridCols||1) + '열' }}
                </span>
                <span><b style="color:#888;">순서:</b> {{ d.sortOrder ?? '-' }}</span>
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
                  <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ siteNm }}</span>
                </span>
              </div>
            </td>
            <td style="vertical-align:top;padding-top:10px;">
              <div class="actions" style="justify-content:flex-end;">
                <button class="btn btn-blue btn-sm" @click="loadDetail(d.dispId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
              </div>
            </td>
          </tr>
          <!-- 위젯 펼치기 서브 행 -->
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
                        :style="'border-bottom:1px solid #e8eaed;' + (wi % 2 === 1 ? 'background:#fff;' : '') + (widgetDragOverWi===wi && widgetDragPanel===d.dispId ? 'outline:2px solid #1d4ed8;background:#e3f2fd;' : '')">
                        <td style="padding:4px 4px;text-align:center;cursor:grab;color:#bbb;font-size:14px;user-select:none;">⠿</td>
                        <td style="padding:4px 8px;text-align:center;color:#aaa;">{{ w.sortOrder || (wi+1) }}</td>
                        <td style="padding:4px 8px;color:#444;">
                          <span style="font-size:10px;background:#e8f4f8;color:#0277bd;border-radius:8px;padding:2px 8px;font-weight:600;margin-right:6px;white-space:nowrap;">아이템</span>
                          {{ w.widgetNm || ('전시항목 ' + (wi+1)) }}
                        </td>
                        <td style="padding:4px 8px;text-align:center;">
                          <span style="background:#e8f0fe;color:#1a73e8;border-radius:8px;padding:1px 7px;font-size:10px;">{{ wLabel(w.widgetType) }}</span>
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
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  </div><!-- /우측 목록 -->
  </div><!-- /본문 flex -->

  <!-- 하단 상세: DispDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-panel-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :disp-dataset="dispDataset" :disp-opt="dispOpt"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>

  <!-- 패널미리보기 오버레이 -->
  <div v-if="cardPreviewItem"
    @click.self="closeCardPreview"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:14px;width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
      <!-- 헤더 -->
      <div style="background:linear-gradient(135deg,#e8587a,#c0395e);color:#fff;padding:15px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;">🖼 패널미리보기</span>
        <button @click="closeCardPreview" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.85;line-height:1;padding:0;">×</button>
      </div>
      <!-- 카드 본문 -->
      <div style="padding:24px;">
        <!-- 영역 + 상태 배지 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
          <code style="font-size:11px;background:#f0f2f5;color:#555;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">{{ cardPreviewItem.area }}</code>
          <span style="font-size:12px;background:#e8f4fd;color:#1565c0;border-radius:10px;padding:2px 10px;">{{ areaLabel(cardPreviewItem.area) }}</span>
          <span class="badge" :class="cardPreviewItem.status==='활성'?'badge-green':'badge-gray'" style="font-size:12px;">{{ cardPreviewItem.status }}</span>
        </div>
        <!-- 패널명 -->
        <div style="font-size:22px;font-weight:800;color:#222;margin-bottom:16px;line-height:1.3;">{{ cardPreviewItem.name }}</div>
        <!-- 노출조건 / 인증 배지 -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:12px;padding:4px 12px;">{{ cardPreviewItem.condition || '항상 표시' }}</span>
          <span v-if="cardPreviewItem.authRequired" style="font-size:12px;background:#fff3e0;color:#e65100;border-radius:12px;padding:4px 12px;">인증 필요</span>
          <span v-if="cardPreviewItem.authRequired && cardPreviewItem.authGrade" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:12px;padding:4px 12px;">{{ cardPreviewItem.authGrade }} 이상</span>
        </div>
        <!-- 전시 기간 -->
        <div v-if="cardPreviewItem.dispStartDate || cardPreviewItem.dispEndDate"
          style="font-size:12px;color:#555;background:#f8faff;border:1px solid #e0e8f8;border-radius:8px;padding:10px 14px;margin-bottom:16px;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;font-weight:600;">📅 전시 기간</div>
          <span>{{ cardPreviewItem.dispStartDate || '∞' }} {{ cardPreviewItem.dispStartTime || '' }}</span>
          <span style="color:#aaa;margin:0 8px;">~</span>
          <span>{{ cardPreviewItem.dispEndDate || '∞' }} {{ cardPreviewItem.dispEndTime || '' }}</span>
        </div>
        <div v-else style="font-size:12px;color:#bbb;margin-bottom:16px;">전시 기간 미설정</div>
        <!-- 위젯 구성 -->
        <div style="border-top:1px solid #f0f0f0;padding-top:14px;">
          <div style="font-size:12px;font-weight:700;color:#888;letter-spacing:.5px;margin-bottom:10px;">📐 전시항목 구성</div>
          <template v-if="cardPreviewItem.rows && cardPreviewItem.rows.length">
            <div v-for="(r, i) in cardPreviewItem.rows" :key="i"
              style="display:flex;align-items:center;gap:10px;padding:9px 14px;border:1px solid #f0f0f0;border-radius:8px;margin-bottom:6px;background:#fafafa;">
              <span style="font-size:11px;color:#bbb;font-weight:700;min-width:16px;text-align:center;">{{ r.sortOrder || i+1 }}</span>
              <span style="font-size:13px;font-weight:600;color:#333;flex:1;">{{ wLabel(r.widgetType) }}</span>
              <span v-if="r.clickAction && r.clickAction !== 'none'"
                style="font-size:10px;color:#888;background:#f0f0f0;border-radius:8px;padding:2px 8px;">{{ r.clickAction }}</span>
            </div>
          </template>
          <div v-else style="font-size:12px;color:#bbb;padding:12px;text-align:center;background:#f9f9f9;border-radius:8px;">
            전시항목 정보가 없습니다. 수정 후 저장하면 표시됩니다.
          </div>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:12px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:11px;color:#aaa;">ID: {{ cardPreviewItem.dispId }} · 등록일: {{ cardPreviewItem.regDate }}</span>
        <div style="display:flex;gap:8px;">
          <button @click="previewDisp(cardPreviewItem); closeCardPreview();" class="btn btn-sm" style="background:#e8f0fe;border:1px solid #b0c4de;color:#1a73e8;font-size:11px;">👁 내용미리보기</button>
          <button @click="closeCardPreview" class="btn btn-secondary btn-sm">닫기</button>
        </div>
      </div>
    </div>
  </div>
</div>
`
};

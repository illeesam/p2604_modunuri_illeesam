/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const codes = Vue.computed(() => window.getBoCodeStore().svCodes);
    const areas = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const fetchData = async () => {
      loading.value = true;
      try {
        const res = await window.boApi.get('/bo/ec/dp/area/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        areas.splice(0, areas.length, ...(res.data?.data?.list || []));
        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('DpDispArea 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { fetchData(); });
    const fnPathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    const AREA_TYPE_OPTS = [
      { value: 'FULL',    label: '전체폭' },
      { value: 'SIDEBAR', label: '사이드바' },
      { value: 'POPUP',   label: '팝업' },
      { value: 'GRID',    label: '그리드' },
      { value: 'BANNER',  label: '배너' },
    ];
    const LAYOUT_TYPE_OPTS = [
      { value: 'grid',      label: '그리드' },
      { value: 'dashboard', label: '대시보드' },
    ];

    /* ── 검색 ── */
    const searchKw        = ref('');
    const searchAreaType  = ref('');
    const searchUseYn     = ref('');
    const searchDateStart = ref('');
    const searchDateEnd   = ref('');
    const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.boCmUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : '';
        searchDateEnd.value   = r ? r.to   : '';
      }
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());

    const applied = reactive({ kw: '', areaType: '', useYn: '', dateStart: '', dateEnd: '' });
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        areaType: searchAreaType.value,
        useYn: searchUseYn.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = ''; searchAreaType.value = ''; searchUseYn.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', areaType: '', useYn: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };

    /* ── 표시경로 (영역코드 prefix 그룹) ── */
    const selectedTreeKey = ref('');   /* '' = 전체, '<prefix>' */
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = (k) => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = (k) => treeOpen.has(k);
    const selectTree = (k) => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const cfAreaTree = computed(() => {
      const group = {};
      (codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA')
        .forEach(a => {
          const top = (a.codeValue || '').split('_')[0] || '(기타)';
          if (!group[top]) group[top] = [];
          group[top].push(a);
        });
      return Object.keys(group).sort().map(top => ({
        label: top,
        count: group[top].length,
        children: group[top].sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).map(a => ({
          codeId: a.codeId,
          codeValue: a.codeValue,
          codeLabel: a.codeLabel,
          count: 1,
        })),
      }));
    });
    const expandAll   = () => { window.safeArrayUtils.safeForEach(cfAreaTree, n => treeOpen.add('grp_'+n.label)); treeOpen.add('__root__'); };
    const collapseAll = () => { treeOpen.clear(); treeOpen.add('__root__'); };

    /* ── 영역 목록 (codes에서 DISP_AREA 필터) ── */
    const cfAllAreas = computed(() =>
      (codes || []).filter(c => c.codeGrp === 'DISP_AREA')
    );
    const cfFiltered = computed(() => {
      const kw = applied.kw.trim().toLowerCase();
      return window.safeArrayUtils.safeFilter(cfAllAreas, a => {
        if (kw &&
            !(a.codeValue || '').toLowerCase().includes(kw) &&
            !(a.codeLabel || '').toLowerCase().includes(kw) &&
            !(a.remark || '').toLowerCase().includes(kw)) return false;
        if (applied.areaType && a.areaType !== applied.areaType) return false;
        if (applied.useYn && a.useYn !== applied.useYn) return false;
        const _d = String(a.regDate || '').slice(0, 10);
        if (applied.dateStart && _d < applied.dateStart) return false;
        if (applied.dateEnd   && _d > applied.dateEnd)   return false;
        if (selectedTreeKey.value) {
          const top = (a.codeValue || '').split('_')[0];
          if (top !== selectedTreeKey.value) return false;
        }
        return true;
      }).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
    });

    /* ── 페이저 ── */
    const pager      = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList   = computed(() =>
      cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size)
    );
    const cfPageNums   = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    /* ── 하단 상세 임베드 ── */
    const selectedId = ref(null);
    const openMode   = ref('edit');
    const loadDetail = (id) => {
      if (selectedId.value === id) { selectedId.value = null; return; }
      selectedId.value = id; openMode.value = 'edit';
    };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispAreaMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() =>
      selectedId.value === '__new__' ? null : selectedId.value
    );

    /* ── 삭제 ── */
    const handleDelete = async (a) => {
      const ok = await props.showConfirm('삭제', `[${a.codeLabel}] 영역을 삭제하시겠습니까?`);
      if (!ok) return;
      const codesData = codes;
      const idx = codes.findIndex(x => x.codeId === a.codeId);
      if (idx !== -1) codes.splice(idx, 1);
      if (selectedId.value === a.codeId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/dp/area/${a.codeId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    /* ── 엑셀 ── */
    const exportExcel = () => {
      const dataWithPath = cfFiltered.value.map(a => ({
        ...a,
        pathLabel: a.pathId ? (window.boCmUtil.getPathLabel(a.pathId) || '') : '',
      }));
      window.boCmUtil.exportCsv(
        dataWithPath,
        [
          { label: 'ID', key: 'codeId' },
          { label: '영역코드', key: 'codeValue' },
          { label: '영역명', key: 'codeLabel' },
          { label: '경로정보', key: 'pathLabel' },
          { label: '유형', key: 'areaType' },
          { label: '표시방식', key: 'layoutType' },
          { label: '열수', key: 'gridCols' },
          { label: '순서', key: 'sortOrd' },
          { label: '사용', key: 'useYn' },
          { label: '설명', key: 'remark' },
        ],
        '전시영역목록.csv'
      );
    };

    /* ── 드래그 정렬 ── */
    const dragSrc     = ref(null);
    const dragOverIdx = ref(-1);
    const onDragStart = (e, pageIdx) => { dragSrc.value = pageIdx; e.dataTransfer.effectAllowed = 'move'; };
    const onDragOver  = (e, pageIdx) => { e.preventDefault(); if (dragSrc.value === null || dragSrc.value === pageIdx) return; dragOverIdx.value = pageIdx; };
    const onDragLeave = () => { dragOverIdx.value = -1; };
    const onDrop      = (e, pageIdx) => {
      e.preventDefault(); dragOverIdx.value = -1;
      const src = dragSrc.value;
      if (src === null || src === pageIdx) { dragSrc.value = null; return; }
      const srcId = cfPageList.value[src]?.codeId;
      const tgtId = cfPageList.value[pageIdx]?.codeId;
      if (!srcId || !tgtId) { dragSrc.value = null; return; }
      const codesData = codes;
      const si = codes.findIndex(x => x.codeId === srcId);
      const ti = codes.findIndex(x => x.codeId === tgtId);
      if (si === -1 || ti === -1) { dragSrc.value = null; return; }
      const moved = codes.splice(si, 1)[0];
      codes.splice(ti, 0, moved);
      /* DISP_AREA만 순서 재부여 */
      window.safeArrayUtils.safeFilter(codes, c => c.codeGrp === 'DISP_AREA').forEach((c, i) => { c.sortOrd = i + 1; });
      props.showToast('영역 순서가 변경되었습니다.', 'info');
      dragSrc.value = null;
    };
    const onDragEnd = () => { dragSrc.value = null; dragOverIdx.value = -1; };

    const fnAreaTypeLabel = (v) => (window.safeArrayUtils.safeFind(AREA_TYPE_OPTS, o => o.value === v) || {}).label || '-';
    const fnStatusBadge = s => s === 'Y' ? 'badge-green' : 'badge-gray';

    /* 영역 하위 패널 목록 */
    const panelsOfArea = (areaCode) =>
      (displays || [])
        .filter(p => p.area === areaCode)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    /* 펼치기 기능 */
    const expandedAreas = reactive(new Set());
    const toggleExpandArea = (areaId) => {
      if (expandedAreas.has(areaId)) expandedAreas.delete(areaId);
      else expandedAreas.add(areaId);
    };
    const isAreaExpanded = (areaId) => expandedAreas.has(areaId);

    return { codes, areas, loading, error, fnPathLabel,
      searchKw, searchAreaType, searchUseYn, searchDateStart, searchDateEnd, searchDateRange,
      DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm,
      AREA_TYPE_OPTS, LAYOUT_TYPE_OPTS,
      pager, PAGE_SIZES, cfTotal, cfTotalPages, cfPageList, cfPageNums, setPage, onSizeChange,
      onSearch, onReset, handleDelete, exportExcel,
      selectedId, openMode, loadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId,
      dragSrc, dragOverIdx, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
      fnAreaTypeLabel, fnStatusBadge, panelsOfArea,
      expandedAreas, toggleExpandArea, isAreaExpanded,
      cfAreaTree, cfAllAreas, cfFiltered, selectedTreeKey, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">전시영역관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 표시 영역 코드 등록 · 수정 · 삭제</span></div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="영역코드 / 영역명 / 설명 검색" style="min-width:260px;" />
      <select v-model="searchAreaType">
        <option value="">영역유형 전체</option>
        <option v-for="o in AREA_TYPE_OPTS" :key="o?.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchDateEnd" class="date-range-input" />
      <select v-model="searchDateRange" @change="onDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 본문: 좌측 트리 + 우측 목록 -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
  <!-- 좌측 표시경로 -->
  <div class="card" style="width:220px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
      <span style="font-size:12px;font-weight:700;color:#555;">표시경로</span>
      <span style="font-size:10px;color:#aaa;">{{ cfAreaTree.length }}그룹</span>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      <button @click="expandAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▼ 전체펼치기</button>
      <button @click="collapseAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▶ 전체닫기</button>
    </div>
    <div @click="selectTree('')"
      :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'7px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',
        background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',
        color: selectedTreeKey==='' ? '#1565c0' : '#222',
        fontWeight:700, border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec'),
      }">
      <span @click.stop="toggleTree('__root__')" style="cursor:pointer;">{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
      <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ cfTotal }}</span>
    </div>
    <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
      <div v-for="node in cfAreaTree" :key="node?.label">
        <div @click="selectTree(node.label)"
          :style="{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',
            background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',
            color: selectedTreeKey===node.label ? '#1565c0' : '#333',
            fontWeight: selectedTreeKey===node.label ? 700 : 500,
          }">
          <span @click.stop="toggleTree('grp_'+node.label)" style="cursor:pointer;font-size:11px;display:inline-block;width:14px;flex-shrink:0;">{{ isTreeOpen('grp_'+node.label) ? '▼' : '▶' }}</span>
          <span @click.stop="selectTree(node.label)" style="cursor:pointer;flex:1;min-width:0;">{{ node.label }}</span>
          <span @click.stop="selectTree(node.label)" style="cursor:pointer;font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
        </div>
        <div v-if="isTreeOpen('grp_'+node.label)" style="padding-left:16px;">
          <div v-for="child in node.children" :key="child?.codeId"
            @click.stop="selectTree(child.codeValue)"
            :style="{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'4px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',marginBottom:'2px',
              background: selectedTreeKey===child.codeValue ? '#e8f0fe' : 'transparent',
              color: selectedTreeKey===child.codeValue ? '#1565c0' : '#666',
              fontWeight: selectedTreeKey===child.codeValue ? 700 : 500,
            }">
            <span style="display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow:hidden;">
              <span style="font-size:9px;background:#e8f0fe;color:#1565c0;border-radius:6px;padding:1px 6px;font-weight:600;white-space:nowrap;flex-shrink:0;">(영역)</span>
              <span style="font-size:9px;background:#fff3e0;color:#e65100;border-radius:6px;padding:1px 6px;font-weight:600;white-space:nowrap;flex-shrink:0;">{{ child.codeValue }}</span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ child.codeLabel }}</span>
            </span>
            <span style="font-size:10px;background:#f0f2f5;color:#888;border-radius:10px;padding:1px 7px;">{{ child.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 우측 목록 -->
  <div style="flex:1;min-width:0;">
  <!-- 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시 영역목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:24px;"></th>
          <th style="width:44px;">ID</th>
          <th>영역 정보</th>
          <th style="width:160px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cfPageList.length===0">
          <td colspan="4" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <template v-for="(a, pageIdx) in cfPageList" :key="a?.codeId">
          <tr draggable="true"
            @dragstart="onDragStart($event, pageIdx)"
            @dragover="onDragOver($event, pageIdx)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, pageIdx)"
            @dragend="onDragEnd"
            :style="(selectedId===a.codeId?'background:#fff8f9;':'') + (dragOverIdx===pageIdx?'outline:2px solid #1d4ed8;background:#e3f2fd;':'')">
            <td style="text-align:center;padding:0;cursor:grab;color:#bbb;font-size:16px;user-select:none;">⠿</td>
            <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">
              <button @click="toggleExpandArea(a.codeId)" style="background:none;border:none;cursor:pointer;font-size:13px;padding:2px 4px;margin-right:4px;"
                :title="isAreaExpanded(a.codeId)?'축소':'펼치기'">{{ isAreaExpanded(a.codeId) ? '▼' : '▶' }}</button>
              {{ a.codeId }}
            </td>
            <td style="padding:10px 12px;">
              <!-- 영역명 + 상태 -->
              <div style="margin-bottom:6px;">
                <code style="font-size:12px;background:#f0f2f5;color:#555;padding:2px 8px;border-radius:4px;letter-spacing:.3px;">{{ a.codeValue }}</code>
                <span class="title-link" @click="loadDetail(a.codeId)"
                  :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===a.codeId?'color:#e8587a;':'color:#222;')">
                  {{ a.codeLabel }}
                  <span v-if="selectedId===a.codeId" style="font-size:10px;margin-left:3px;">▼</span>
                </span>
                <span class="badge" :class="fnStatusBadge(a.useYn)" style="font-size:11px;margin-left:8px;">{{ a.useYn==='Y'?'사용':'미사용' }}</span>
              </div>
              <!-- label:value 라인 -->
              <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
                <span><b style="color:#888;">표시경로:</b>
                  <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;margin-left:3px;">
                    {{ fnPathLabel(a.pathId) || a.displayPath || ((a.codeValue||'').split('_')[0] + '.' + (a.codeLabel || a.codeValue)) }}
                  </span>
                </span>
                <span><b style="color:#888;">유형:</b> {{ fnAreaTypeLabel(a.areaType) }}</span>
                <span><b style="color:#888;">표시:</b>
                  {{ a.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 ' + (a.gridCols||1) + '열' }}
                </span>
                <span><b style="color:#888;">타이틀:</b>
                  {{ a.titleYn==='Y' ? (a.title || '표시') : '미표시' }}
                </span>
                <span><b style="color:#888;">순서:</b> {{ a.sortOrd ?? '-' }}</span>
                <span><b style="color:#888;">등록일:</b> {{ a.regDate || '-' }}</span>
                <span><b style="color:#888;">사이트:</b>
                  <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ cfSiteNm }}</span>
                </span>
                <span v-if="a.remark" style="flex:1 1 100%;"><b style="color:#888;">설명:</b> {{ a.remark }}</span>
              </div>
            </td>
            <td style="vertical-align:top;padding-top:10px;">
              <div class="actions" style="justify-content:flex-end;">
                <button class="btn btn-blue btn-sm" @click="loadDetail(a.codeId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(a)">삭제</button>
              </div>
            </td>
          </tr>
          <!-- 펼쳤을 때 패널 목록 표시 -->
          <tr v-if="isAreaExpanded(a.codeId)" :key="'expand_'+a.codeId">
            <td colspan="4" style="background:#fafafa;padding:12px 16px;">
              <div style="font-size:12px;font-weight:700;color:#666;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e0e0;">
                📌 연결된 패널 ({{ panelsOfArea(a.codeValue).length }}개)
              </div>
              <div v-if="panelsOfArea(a.codeValue).length===0" style="color:#bbb;font-size:11px;padding:8px 0;">패널이 없습니다.</div>
              <div v-else style="display:grid;gap:8px;">
                <div v-for="p in panelsOfArea(a.codeValue)" :key="p?.dispId"
                  style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;background:#fff;">
                  <span style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:8px;padding:2px 8px;font-weight:600;white-space:nowrap;">패널</span>
                  <span style="font-size:12px;color:#333;font-weight:600;flex:1;">{{ p.name }}</span>
                  <span v-if="p.visibilityTargets" style="font-size:10px;background:#e8f0fe;color:#1565c0;border-radius:8px;padding:2px 8px;">
                    {{ (p.visibilityTargets || '^PUBLIC^').split('^').filter(Boolean).join(', ') }}
                  </span>
                  <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 8px;font-weight:600;">
                    {{ (p.rows||[]).length }}개 항목
                  </span>
                  <span :style="'font-size:10px;border-radius:8px;padding:2px 8px;font-weight:600;'+(p.useYn==='Y'?'background:#c8e6c9;color:#2e7d32;':'background:#f1f1f1;color:#666;')">
                    {{ p.useYn==='Y' ? '사용' : '미사용' }}
                  </span>
                </div>
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
        <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  </div><!-- /우측 목록 -->
  </div><!-- /본문 flex -->

  <!-- 하단 상세 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dp-disp-area-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
    />
  </div>
</div>
  `,
};

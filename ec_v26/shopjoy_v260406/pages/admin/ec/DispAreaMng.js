/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.EcDispAreaMng = {
  name: 'EcDispAreaMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

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
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.adminUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : '';
        searchDateEnd.value   = r ? r.to   : '';
      }
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());

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

    /* ── 사용위치 트리 (영역코드 prefix 그룹) ── */
    const selectedTreeKey = ref('');   /* '' = 전체, '<prefix>' */
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = (k) => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = (k) => treeOpen.value.has(k);
    const selectTree = (k) => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const areaTree = computed(() => {
      const group = {};
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA')
        .forEach(a => {
          const top = (a.codeValue || '').split('_')[0] || '(기타)';
          if (!group[top]) group[top] = 0;
          group[top]++;
        });
      return Object.keys(group).sort().map(top => ({ label: top, count: group[top] }));
    });
    const expandAll   = () => { areaTree.value.forEach(n => treeOpen.value.add('grp_'+n.label)); treeOpen.value.add('__root__'); };
    const collapseAll = () => { treeOpen.value.clear(); treeOpen.value.add('__root__'); };

    /* ── 영역 목록 (codes에서 DISP_AREA 필터) ── */
    const allAreas = computed(() =>
      (props.dispDataset.codes || []).filter(c => c.codeGrp === 'DISP_AREA')
    );
    const filtered = computed(() => {
      const kw = applied.kw.trim().toLowerCase();
      return allAreas.value.filter(a => {
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
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100, 200, 300];
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() =>
      filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size)
    );
    const pageNums   = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
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
      if (pg === 'ecDispAreaMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() =>
      selectedId.value === '__new__' ? null : selectedId.value
    );

    /* ── 삭제 ── */
    const doDelete = async (a) => {
      await window.adminApiCall({
        method: 'delete',
        path: `disp-areas/${a.codeId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${a.codeLabel}] 영역을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const codes = props.dispDataset.codes;
          const idx = codes.findIndex(x => x.codeId === a.codeId);
          if (idx !== -1) codes.splice(idx, 1);
          if (selectedId.value === a.codeId) selectedId.value = null;
        },
      });
    };

    /* ── 엑셀 ── */
    const exportExcel = () => window.adminUtil.exportCsv(
      filtered.value,
      [
        { label: 'ID', key: 'codeId' },
        { label: '영역코드', key: 'codeValue' },
        { label: '영역명', key: 'codeLabel' },
        { label: '유형', key: 'areaType' },
        { label: '표시방식', key: 'layoutType' },
        { label: '열수', key: 'gridCols' },
        { label: '순서', key: 'sortOrd' },
        { label: '사용', key: 'useYn' },
        { label: '설명', key: 'remark' },
      ],
      '전시영역목록.csv'
    );

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
      const srcId = pageList.value[src]?.codeId;
      const tgtId = pageList.value[pageIdx]?.codeId;
      if (!srcId || !tgtId) { dragSrc.value = null; return; }
      const codes = props.dispDataset.codes;
      const si = codes.findIndex(x => x.codeId === srcId);
      const ti = codes.findIndex(x => x.codeId === tgtId);
      if (si === -1 || ti === -1) { dragSrc.value = null; return; }
      const moved = codes.splice(si, 1)[0];
      codes.splice(ti, 0, moved);
      /* DISP_AREA만 순서 재부여 */
      codes.filter(c => c.codeGrp === 'DISP_AREA').forEach((c, i) => { c.sortOrd = i + 1; });
      props.showToast('영역 순서가 변경되었습니다.', 'info');
      dragSrc.value = null;
    };
    const onDragEnd = () => { dragSrc.value = null; dragOverIdx.value = -1; };

    const areaTypeLabel = (v) => (AREA_TYPE_OPTS.find(o => o.value === v) || {}).label || '-';
    const statusBadge = s => s === 'Y' ? 'badge-green' : 'badge-gray';

    return {
      searchKw, searchAreaType, searchUseYn, searchDateStart, searchDateEnd, searchDateRange,
      DATE_RANGE_OPTIONS, onDateRangeChange, siteNm,
      AREA_TYPE_OPTS, LAYOUT_TYPE_OPTS,
      pager, PAGE_SIZES, total, totalPages, pageList, pageNums, setPage, onSizeChange,
      onSearch, onReset, doDelete, exportExcel,
      selectedId, openMode, loadDetail, openNew, closeDetail, inlineNavigate, detailEditId,
      dragSrc, dragOverIdx, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
      areaTypeLabel, statusBadge,
      areaTree, selectedTreeKey, toggleTree, isTreeOpen, selectTree, expandAll, collapseAll,
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
        <option v-for="o in AREA_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
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
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 본문: 좌측 트리 + 우측 목록 -->
  <div style="display:flex;gap:12px;align-items:flex-start;">
  <!-- 좌측 사용위치 트리 -->
  <div class="card" style="width:220px;flex-shrink:0;padding:12px;max-height:calc(100vh - 260px);overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #f0f0f0;margin-bottom:8px;">
      <span style="font-size:12px;font-weight:700;color:#555;">사용위치 트리</span>
      <span style="font-size:10px;color:#aaa;">{{ areaTree.length }}그룹</span>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:8px;">
      <button @click="expandAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▼ 전체펼치기</button>
      <button @click="collapseAll" style="flex:1;padding:4px 6px;font-size:10px;border:1px solid #d0d7de;border-radius:4px;background:#fff;cursor:pointer;color:#555;">▶ 전체닫기</button>
    </div>
    <div @click="toggleTree('__root__'); selectTree('')"
      :style="{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'7px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',
        background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',
        color: selectedTreeKey==='' ? '#1565c0' : '#222',
        fontWeight:700, border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec'),
      }">
      <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
      <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
    </div>
    <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
      <div v-for="node in areaTree" :key="node.label"
        @click="selectTree(node.label)"
        :style="{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',
          background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',
          color: selectedTreeKey===node.label ? '#1565c0' : '#333',
          fontWeight: selectedTreeKey===node.label ? 700 : 500,
        }">
        <span>▸ {{ node.label }}</span>
        <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
      </div>
    </div>
  </div>

  <!-- 우측 목록 -->
  <div style="flex:1;min-width:0;">
  <!-- 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">전시 영역목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:24px;"></th>
          <th style="width:44px;">ID</th>
          <th>영역 정보</th>
          <th style="width:160px;text-align:right;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pageList.length===0">
          <td colspan="4" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(a, pageIdx) in pageList" :key="a.codeId"
          draggable="true"
          @dragstart="onDragStart($event, pageIdx)"
          @dragover="onDragOver($event, pageIdx)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, pageIdx)"
          @dragend="onDragEnd"
          :style="(selectedId===a.codeId?'background:#fff8f9;':'') + (dragOverIdx===pageIdx?'outline:2px solid #1d4ed8;background:#e3f2fd;':'')">
          <td style="text-align:center;padding:0;cursor:grab;color:#bbb;font-size:16px;user-select:none;">⠿</td>
          <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">{{ a.codeId }}</td>
          <td style="padding:10px 12px;">
            <!-- 영역명 + 상태 -->
            <div style="margin-bottom:6px;">
              <code style="font-size:12px;background:#f0f2f5;color:#555;padding:2px 8px;border-radius:4px;letter-spacing:.3px;">{{ a.codeValue }}</code>
              <span class="title-link" @click="loadDetail(a.codeId)"
                :style="'font-size:14px;font-weight:700;margin-left:8px;'+(selectedId===a.codeId?'color:#e8587a;':'color:#222;')">
                {{ a.codeLabel }}
                <span v-if="selectedId===a.codeId" style="font-size:10px;margin-left:3px;">▼</span>
              </span>
              <span class="badge" :class="statusBadge(a.useYn)" style="font-size:11px;margin-left:8px;">{{ a.useYn==='Y'?'사용':'미사용' }}</span>
            </div>
            <!-- label:value 라인 -->
            <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:#555;line-height:1.6;">
              <span><b style="color:#888;">사용위치경로:</b>
                <span style="background:#fff3e0;color:#e65100;border-radius:8px;padding:1px 7px;margin-left:3px;">
                  {{ (a.codeValue||'').split('_')[0] || '-' }} &gt; {{ a.codeLabel || a.codeValue }}
                </span>
              </span>
              <span><b style="color:#888;">유형:</b> {{ areaTypeLabel(a.areaType) }}</span>
              <span><b style="color:#888;">표시:</b>
                {{ a.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 ' + (a.gridCols||1) + '열' }}
              </span>
              <span><b style="color:#888;">타이틀:</b>
                {{ a.titleYn==='Y' ? (a.title || '표시') : '미표시' }}
              </span>
              <span><b style="color:#888;">순서:</b> {{ a.sortOrd ?? '-' }}</span>
              <span><b style="color:#888;">등록일:</b> {{ a.regDate || '-' }}</span>
              <span><b style="color:#888;">사이트:</b>
                <span style="background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:8px;padding:0 6px;margin-left:3px;">{{ siteNm }}</span>
              </span>
              <span v-if="a.remark" style="flex:1 1 100%;"><b style="color:#888;">설명:</b> {{ a.remark }}</span>
            </div>
          </td>
          <td style="vertical-align:top;padding-top:10px;">
            <div class="actions" style="justify-content:flex-end;">
              <button class="btn btn-blue btn-sm" @click="loadDetail(a.codeId)">수정</button>
              <button class="btn btn-danger btn-sm" @click="doDelete(a)">삭제</button>
            </div>
          </td>
        </tr>
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

  <!-- 하단 상세 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <ec-disp-area-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :disp-dataset="dispDataset"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
  `,
};

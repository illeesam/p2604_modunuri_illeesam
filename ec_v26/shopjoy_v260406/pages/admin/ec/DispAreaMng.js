/* ShopJoy Admin - 전시영역관리 (CRUD 그리드) */
window.EcDispAreaMng = {
  name: 'EcDispAreaMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm'],
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
    const applied = reactive({ kw: '', areaType: '', useYn: '', dateStart: '', dateEnd: '' });

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [10, 20, 50, 100];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['codeValue', 'codeLabel', 'areaType', 'layoutType', 'gridCols', 'remark', 'sortOrd', 'useYn', 'titleYn', 'title'];

    const makeRow = (c) => ({
      ...c,
      areaType:   c.areaType   || '',
      layoutType: c.layoutType || 'grid',
      gridCols:   c.gridCols   || 1,
      titleYn:    c.titleYn    || 'N',
      title:      c.title      || '',
      _row_status: 'N',
      _row_check:  false,
      _orig: {
        codeValue: c.codeValue, codeLabel: c.codeLabel,
        areaType:  c.areaType || '', remark: c.remark || '',
        layoutType: c.layoutType || 'grid', gridCols: c.gridCols || 1,
        titleYn:   c.titleYn || 'N', title: c.title || '',
        sortOrd:   c.sortOrd,  useYn: c.useYn,
      },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      props.adminData.codes
        .filter(c => {
          if (c.codeGrp !== 'DISP_AREA') return false;
          const kw = applied.kw.trim().toLowerCase();
          if (kw && !c.codeValue.toLowerCase().includes(kw)
                 && !(c.codeLabel||'').toLowerCase().includes(kw)
                 && !(c.remark  ||'').toLowerCase().includes(kw)) return false;
          if (applied.areaType && (c.areaType||'') !== applied.areaType) return false;
          if (applied.useYn    && c.useYn           !== applied.useYn)    return false;
          const _d = String(c.regDate || '').slice(0, 10);
          if (applied.dateStart && _d < applied.dateStart) return false;
          if (applied.dateEnd   && _d > applied.dateEnd)   return false;
          return true;
        })
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .forEach(c => gridRows.push(makeRow(c)));
    };
    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, areaType: searchAreaType.value,
        useYn: searchUseYn.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value=''; searchAreaType.value=''; searchUseYn.value='';
      searchDateStart.value=''; searchDateEnd.value=''; searchDateRange.value='';
      Object.assign(applied, { kw:'', areaType:'', useYn:'', dateStart:'', dateEnd:'' });
      loadGrid();
    };

    /* ── 포커스 ── */
    const setFocused = (idx) => { focusedIdx.value = idx; };

    /* ── 셀 변경 → 행 상태 갱신 ── */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* ── 행 추가 ── */
    const addRow = () => {
      const focused = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        codeId: _tempId--, codeGrp: 'DISP_AREA',
        codeValue: '', codeLabel: '', areaType: '', layoutType: 'grid', gridCols: 1, titleYn: 'N', title: '', remark: '',
        sortOrd: focused ? (focused.sortOrd || 0) + 1 : (gridRows.length + 1),
        useYn: 'Y', regDate: new Date().toISOString().slice(0, 10),
        _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    /* ── 행 단건 삭제 ── */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null)
          focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    /* ── 행 취소 ── */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null)
          focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    /* ── 툴바 취소 (체크 행) ── */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!ids.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.codeId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
      }
    };

    /* ── 체크 행 일괄 삭제 ── */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* ── 저장 ── */
    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        props.showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.codeValue.trim()) { props.showToast('영역코드는 필수 항목입니다.', 'error'); return; }
        if (!r.codeLabel.trim()) { props.showToast('영역명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?',
        { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;

      dRows.forEach(r => {
        const idx = props.adminData.codes.findIndex(c => c.codeId === r.codeId);
        if (idx !== -1) props.adminData.codes.splice(idx, 1);
      });
      uRows.forEach(r => {
        const idx = props.adminData.codes.findIndex(c => c.codeId === r.codeId);
        if (idx !== -1) Object.assign(props.adminData.codes[idx],
          { codeValue: r.codeValue, codeLabel: r.codeLabel, areaType: r.areaType,
            layoutType: r.layoutType, gridCols: r.gridCols,
            titleYn: r.titleYn, title: r.title,
            remark: r.remark, sortOrd: r.sortOrd, useYn: r.useYn });
      });
      let nextId = Math.max(...props.adminData.codes.map(c => c.codeId), 0);
      iRows.forEach(r => {
        props.adminData.codes.push({
          codeId: ++nextId, codeGrp: 'DISP_AREA',
          codeValue: r.codeValue, codeLabel: r.codeLabel,
          areaType: r.areaType, layoutType: r.layoutType, gridCols: r.gridCols,
          titleYn: r.titleYn, title: r.title,
          remark: r.remark, sortOrd: r.sortOrd, useYn: r.useYn,
          regDate: r.regDate,
        });
      });
      const parts = [];
      if (iRows.length) parts.push(`등록 ${iRows.length}건`);
      if (uRows.length) parts.push(`수정 ${uRows.length}건`);
      if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${parts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    /* ── 드래그 정렬 ── */
    const dragSrc   = ref(null);
    const dragMoved = ref(false);
    const onDragStart = (idx) => { dragSrc.value = idx; dragMoved.value = false; };
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (dragSrc.value === null || dragSrc.value === idx) return;
      const moved = gridRows.splice(dragSrc.value, 1)[0];
      gridRows.splice(idx, 0, moved);
      dragSrc.value = idx;
      dragMoved.value = true;
    };
    const onDragEnd = () => {
      if (dragMoved.value) props.showToast('순서가 변경되었습니다.');
      dragSrc.value = null; dragMoved.value = false;
    };

    /* ── 전체 체크 ── */
    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const siteNm      = computed(() => window.adminUtil.getSiteNm());
    const statusClass = s => ({ N:'badge-gray', I:'badge-blue', U:'badge-orange', D:'badge-red' }[s] || 'badge-gray');
    const areaTypeLabel = v => AREA_TYPE_OPTS.find(o => o.value === v)?.label || v || '-';

    const pagedRows  = computed(() => { const s = (pager.page-1)*pager.size; return gridRows.slice(s, s+pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c=pager.page, l=totalPages.value; const s=Math.max(1,c-2), e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage    = n => { if (n>=1 && n<=totalPages.value) pager.page=n; };
    const onSizeChange = () => { pager.page=1; };

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [
        {label:'ID',      key:'codeId'},
        {label:'영역코드', key:'codeValue'},
        {label:'영역명',   key:'codeLabel'},
        {label:'영역유형',   key:'areaType'},
        {label:'표시방식',   key:'layoutType'},
        {label:'열수',       key:'gridCols'},
        {label:'설명',       key:'remark'},
        {label:'순서',     key:'sortOrd'},
        {label:'사용여부', key:'useYn'},
      ],
      '전시영역목록.csv'
    );

    return {
      siteNm, AREA_TYPE_OPTS, areaTypeLabel, LAYOUT_TYPE_OPTS,
      searchKw, searchAreaType, searchUseYn,
      searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange,
      applied, onSearch, onReset,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusClass,
      exportExcel,
    };
  },

  template: /* html */`
<div>
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <div>전시영역관리 <span style="font-size:13px;font-weight:400;color:#888;">화면 표시 영역 코드 등록 · 수정 · 삭제</span></div>
    <span style="font-size:12px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:10px;padding:3px 12px;font-weight:600;">🌐 {{ siteNm }}</span>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="영역코드 / 영역명 / 설명 검색" />
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

  <!-- CRUD 그리드 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        영역목록 <span class="list-count">{{ total }}건</span>
      </span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
      </div>
    </div>

    <table class="admin-table crud-grid">
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th style="width:140px;">영역코드</th>
          <th style="width:130px;">영역명</th>
          <th style="width:100px;">영역유형</th>
          <th style="width:90px;">표시방식</th>
          <th style="width:60px;">열수</th>
          <th style="width:70px;">타이틀표시</th>
          <th style="width:120px;">타이틀</th>
          <th>설명</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th style="width:80px;">사이트</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="17" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.codeId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          draggable="true"
          @click="setFocused(getRealIdx(idx))"
          @dragstart="onDragStart(getRealIdx(idx))"
          @dragover="onDragOver($event, getRealIdx(idx))"
          @dragend="onDragEnd">

          <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
          <td class="col-id-val">{{ row.codeId > 0 ? row.codeId : 'NEW' }}</td>
          <td class="col-status-val">
            <span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span>
          </td>
          <td class="col-check-val">
            <input type="checkbox" v-model="row._row_check" />
          </td>
          <td>
            <input class="grid-input grid-mono" v-model="row.codeValue"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="HOME_BANNER" style="text-transform:uppercase;" />
          </td>
          <td>
            <input class="grid-input" v-model="row.codeLabel"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="영역명" />
          </td>
          <td>
            <select class="grid-select" v-model="row.areaType"
              :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="">-</option>
              <option v-for="o in AREA_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </td>
          <td>
            <select class="grid-select" v-model="row.layoutType"
              :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="o in LAYOUT_TYPE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </td>
          <td>
            <input v-if="row.layoutType==='grid'" class="grid-input grid-num" type="number"
              v-model.number="row.gridCols" min="1" max="32"
              :disabled="row._row_status==='D'" @input="onCellChange(row)" style="width:48px;" />
            <span v-else style="font-size:11px;color:#9ca3af;padding:0 6px;">-</span>
          </td>
          <td>
            <select class="grid-select" v-model="row.titleYn"
              :disabled="row._row_status==='D'" @change="onCellChange(row)" style="width:64px;">
              <option value="Y">표시</option>
              <option value="N">미표시</option>
            </select>
          </td>
          <td>
            <input v-if="row.titleYn==='Y'" class="grid-input" v-model="row.title"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="타이틀 텍스트" />
            <span v-else style="font-size:11px;color:#9ca3af;padding:0 6px;">-</span>
          </td>
          <td>
            <input class="grid-input" v-model="row.remark"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="영역 설명" />
          </td>
          <td>
            <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
              :disabled="row._row_status==='D'" @input="onCellChange(row)" />
          </td>
          <td>
            <select class="grid-select" v-model="row.useYn"
              :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="['N','U'].includes(row._row_status)"
              class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
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
</div>
`,
};

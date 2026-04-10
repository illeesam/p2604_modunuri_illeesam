/* ShopJoy Admin - 공통코드관리 (CRUD 그리드) */
window.CodeMng = {
  name: 'CodeMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* ── 검색 ── */
    const searchKw        = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.adminUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : '';
      }
    };
    const searchGrp   = ref('');
    const searchUseYn = ref('');
    const grpOptions  = computed(() => [...new Set(props.adminData.codes.map(c => c.codeGrp))].sort());
    const applied     = Vue.reactive({ kw: '', grp: '', useYn: '', dateStart: '', dateEnd: '' });

    /* ── CRUD 그리드 데이터 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [10, 20, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['codeGrp', 'codeLabel', 'codeValue', 'sortOrd', 'useYn', 'remark'];

    const makeRow = (c) => ({
      ...c,
      _row_status: 'N',
      _row_check:  false,
      _orig: { codeGrp: c.codeGrp, codeLabel: c.codeLabel, codeValue: c.codeValue,
               sortOrd: c.sortOrd, useYn: c.useYn, remark: c.remark },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      props.adminData.codes
        .filter(c => {
          const kw = applied.kw.trim().toLowerCase();
          if (kw && !c.codeGrp.toLowerCase().includes(kw)
                 && !c.codeLabel.toLowerCase().includes(kw)
                 && !c.codeValue.toLowerCase().includes(kw)) return false;
          if (applied.grp   && c.codeGrp !== applied.grp)   return false;
          if (applied.useYn && c.useYn   !== applied.useYn) return false;
          const _d = String(c.regDate || '').slice(0, 10);
          if (applied.dateStart && _d < applied.dateStart) return false;
          if (applied.dateEnd   && _d > applied.dateEnd)   return false;
          return true;
        })
        .forEach(c => gridRows.push(makeRow(c)));
    };

    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, grp: searchGrp.value, useYn: searchUseYn.value,
                                dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchGrp.value = ''; searchUseYn.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', grp: '', useYn: '', dateStart: '', dateEnd: '' });
      loadGrid();
    };

    /* ── 포커스 행 설정 ── */
    const setFocused = (idx) => { focusedIdx.value = idx; };

    /* ── 셀 변경 → 행상태 갱신 ── */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* ── 행추가: 포커스 행 아래 삽입, 없으면 끝에 추가 ── */
    const addRow = () => {
      const ref = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        codeId: _tempId--, codeGrp: ref ? ref.codeGrp : '', codeLabel: '', codeValue: '',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', remark: '',
        _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    /* ── 행 단건 삭제 버튼: N/U 에 표시 (I는 표시 안함) ── */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    /* ── 취소 버튼: U/I/D 에 표시 ── */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        // U / D: 원래값 복원 → N
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    /* ── 툴바 [취소]: 체크된 행만 취소, 없으면 변경된 전체 취소 ── */
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!checkedIds.size) {
        props.showToast('취소할 행을 선택해주세요.', 'info');
        return;
      }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.codeId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') {
          gridRows.splice(i, 1);
        } else if (row._row_status === 'U' || row._row_status === 'D') {
          if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
          row._row_status = 'N';
        }
      }
    };

    /* ── 체크된 행 일괄 삭제 ── */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') {
          gridRows.splice(i, 1);
        } else {
          gridRows[i]._row_status = 'D';
        }
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
        if (!r.codeGrp || !r.codeLabel || !r.codeValue) {
          props.showToast('코드그룹, 코드라벨, 코드값은 필수 항목입니다.', 'error'); return;
        }
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
          { codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue,
            sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark });
      });
      let nextId = Math.max(...props.adminData.codes.map(c => c.codeId), 0);
      iRows.forEach(r => {
        props.adminData.codes.push({
          codeId: ++nextId, codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue,
          sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark,
          regDate: new Date().toISOString().slice(0, 10),
        });
      });
      const toastParts = [];
      if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
      if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
      if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    /* ── 드래그 이동 ── */
    const dragSrc  = ref(null);
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
      if (dragMoved.value) props.showToast('정렬정보가 저장되었습니다.');
      dragSrc.value = null;
      dragMoved.value = false;
    };

    /* ── 전체 체크 (D 행 포함) ── */
    const checkAll = ref(false);
    const toggleCheckAll = () => {
      gridRows.forEach(r => { r._row_check = checkAll.value; });
    };

    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const statusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'codeId'},{label:'코드그룹',key:'codeGrp'},{label:'코드레이블',key:'codeLabel'},{label:'코드값',key:'codeValue'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'remark'}],
      '공통코드목록.csv'
    );

    return {
      siteName,
      searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange,
      searchKw, searchGrp, searchUseYn, grpOptions, applied,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="코드그룹 / 라벨 / 코드값 검색" />
      <select v-model="searchGrp">
        <option value="">그룹 전체</option>
        <option v-for="g in grpOptions" :key="g">{{ g }}</option>
      </select>
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>코드목록 <span class="list-count">{{ total }}건</span></span>
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
          <th>코드그룹</th>
          <th>코드라벨</th>
          <th>코드값</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th>비고</th>
          <th style="width:80px;">사이트명</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
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
          <td><input class="grid-input" v-model="row.codeGrp"   :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input" v-model="row.codeLabel"  :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input grid-mono" v-model="row.codeValue" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="Y">사용</option><option value="N">미사용</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteName }}</td>
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

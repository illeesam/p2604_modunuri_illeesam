/* ShopJoy - Sample06: 쿠폰 관리 CRUD Grid  (API: GET|POST|PUT|DELETE /api/base/sy/zz-sample1, cdGrp='S06_COUPON')
 * ZzSample1 필드 매핑:
 *   sample1Id → couponId  |  cdNm → couponNm  |  col01 → discountType
 *   col02 → discountVal  |  col03 → minAmount  |  col04 → expDate  |  useYn → useYn  |  regDt → regDate
 */
window.XsSample06 = {
  name: 'XsSample06',
  setup() {
    const { ref, reactive, onMounted, watch } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dragSrc: null, focusedIdx: null, dragMoved: false, checkAll: false });
    const codes = reactive({
      discnt_type_opts: [{ value: '정액', label: '정액' }, { value: '정률', label: '정률' }],
      use_yn_opts:      [{ value: 'Y', label: 'Y 사용' }, { value: 'N', label: 'N 미사용' }],
    });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    const api = window.axiosApi || window.adminApi;
    const API = 'api/base/sy/zz-sample1';
    const CD_GRP = 'S06_COUPON';
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;

    /* showToast */
    const showToast = (msg, type = 'success') => { toast.msg = msg; toast.type = type; toast.show = true; clearTimeout(_tId); _tId = setTimeout(() => { toast.show = false; }, 2500); };
    const searchParam = reactive({ searchValue: '', discountType: '', useYn: '' });
    const searchParamOrg = reactive({ searchValue: '', category: '', status: '' });
    const allData    = reactive([]);
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const EDIT_FIELDS = ['couponNm', 'discountType', 'discountVal', 'minAmount', 'useYn', 'expDate'];

    /* toRow */
    const toRow = d => ({ couponId: d.sample1Id, couponNm: d.cdNm || '', discountType: d.col01 || '정액', discountVal: Number(d.col02) || 0, minAmount: Number(d.col03) || 0, expDate: d.col04 || '', useYn: d.useYn || 'Y', regDate: d.regDt || '' });

    /* toPayload */
    const toPayload = r => ({ cdGrp: CD_GRP, cdNm: r.couponNm, col01: r.discountType, col02: String(r.discountVal), col03: String(r.minAmount), col04: r.expDate, useYn: r.useYn });

    /* makeRow */
    const makeRow = d => ({ ...d, _row_status: 'N', _row_check: false, _row_org: { couponNm: d.couponNm, discountType: d.discountType, discountVal: d.discountVal, minAmount: d.minAmount, useYn: d.useYn, expDate: d.expDate } });
    const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { pager.pageTotalCount=gridRows.filter(r=>r._row_status!=='D').length; pager.pageTotalPage=Math.max(1,Math.ceil(gridRows.length/pager.pageSize)); const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); pager.pageList=gridRows.slice((pager.pageNo-1)*pager.pageSize,pager.pageNo*pager.pageSize); };

    /* setPage */
    const setPage    = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; fnBuildPagerNums(); } };

    /* getRealIdx */
    const getRealIdx = i => (pager.pageNo - 1) * pager.pageSize + i;

    /* 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await api.get(API, { cdGrp: CD_GRP });
        const list = res?.data?.data ?? res?.data ?? [];
        allData.splice(0, allData.length, ...list.map(toRow));
      } catch (e) { showToast('데이터 로드 실패: ' + (e.message || e), 'error'); }
      gridRows.splice(0); uiState.focusedIdx = null; pager.pageNo = 1;
      allData.filter(d => {
        const searchVal = searchParam.searchValue.toLowerCase();
        if (searchVal && !String(d.couponNm || '').toLowerCase().includes(searchVal)) return false;
        if (searchParam.discountType && d.discountType !== searchParam.discountType) return false;
        if (searchParam.useYn        && d.useYn        !== searchParam.useYn)        return false;
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
      fnBuildPagerNums();
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* 목록조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset */
    const onReset  = async () => { Object.assign(searchParam, { searchValue: '', discountType: '', useYn: '' }); pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* setFocused */
    const setFocused   = idx => { uiState.focusedIdx = idx; };

    /* onCellChange */
    const onCellChange = row => { if (row._row_status === 'I' || row._row_status === 'D') return; row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N'; };

    /* addRow */
    const addRow = () => {
      const at = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(at, 0, { couponId: _tempId--, couponNm: '', discountType: '정액', discountVal: 0, minAmount: 0, useYn: 'Y', expDate: '', _row_status: 'I', _row_check: false, _row_org: null });
      uiState.focusedIdx = at; pager.pageNo = Math.ceil((at + 1) / pager.pageSize);
    };

    /* deleteRow */
    const deleteRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); } else row._row_status = 'D'; };

    /* cancelRow */
    const cancelRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); } else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; } };

    /* deleteRows */
    const deleteRows    = () => { for (let i = gridRows.length - 1; i >= 0; i--) { if (!gridRows[i]._row_check) continue; if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1); else gridRows[i]._row_status = 'D'; } };

    /* cancelChecked */
    const cancelChecked = () => { const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.couponId)); if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; } for (let i = gridRows.length - 1; i >= 0; i--) { const row = gridRows[i]; if (!ids.has(row.couponId)) continue; if (row._row_status === 'N') continue; if (row._row_status === 'I') gridRows.splice(i, 1); else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; } } };

    /* 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I'), uRows = gridRows.filter(r => r._row_status === 'U'), dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) { if (!r.couponNm) { showToast('쿠폰명은 필수 항목입니다.', 'error'); return; } }
      const parts = []; if (iRows.length) parts.push(`등록 ${iRows.length}건`); if (uRows.length) parts.push(`수정 ${uRows.length}건`); if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) return;
      try {
        for (const r of dRows) await api.delete(`${API}/${r.couponId}`);
        for (const r of uRows) await api.put(`${API}/${r.couponId}`, toPayload(r));
        for (const r of iRows) await api.post(API, toPayload(r));
        showToast(`${parts.join(', ')} 저장되었습니다.`);
        const res = await api.get(API, { cdGrp: CD_GRP });
        const list = res?.data?.data ?? res?.data ?? [];
        allData.splice(0, allData.length, ...list.map(toRow));
        gridRows.splice(0); uiState.focusedIdx = null; pager.pageNo = 1;
        allData.filter(d => {
          const searchVal = searchParam.searchValue.toLowerCase();
          if (searchVal && !String(d.couponNm || '').toLowerCase().includes(searchVal)) return false;
          if (searchParam.discountType && d.discountType !== searchParam.discountType) return false;
          if (searchParam.useYn        && d.useYn        !== searchParam.useYn)        return false;
          return true;
        }).forEach(d => gridRows.push(makeRow(d)));
        fnBuildPagerNums();
      } catch (e) { showToast('저장 실패: ' + (e.response?.data?.message || e.message || e), 'error'); }
    };

    /* onDragStart */
    const onDragStart = idx => { uiState.dragSrc = idx; uiState.dragMoved = false; };

    /* onDragOver */
    const onDragOver  = (e, idx) => { e.preventDefault(); if (uiState.dragSrc === null || uiState.dragSrc === idx) return; const m = gridRows.splice(uiState.dragSrc, 1)[0]; gridRows.splice(idx, 0, m); uiState.dragSrc = idx; uiState.dragMoved = true; };

    /* onDragEnd */
    const onDragEnd   = () => { if (uiState.dragMoved) showToast('정렬이 변경되었습니다.'); uiState.dragSrc = null; uiState.dragMoved = false; };

    /* toggleCheckAll */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* fnStatusBadge */
    const fnStatusBadge = s => ({ N: 'background:#f0f0f0;color:#666;', I: 'background:#dbeafe;color:#1e40af;', U: 'background:#fef3c7;color:#92400e;', D: 'background:#fee2e2;color:#991b1b;' }[s] || '');

    /* rowBg */
    const rowBg       = s => ({ I: 'background:#f0fdf4;', U: 'background:#fffbeb;', D: 'background:#fff1f2;opacity:.45;' }[s] || '');

    // -- return ---------------------------------------------------------------

    /* fo-grid-crud 컬럼 */
    const gridCols = [
      { key: 'couponNm',     label: '쿠폰명', edit: 'text' },
      { key: 'discountType', label: '할인유형', edit: 'select', width: '80px', align: 'center',
        options: codes.discnt_type_opts },
      { key: 'discountVal',  label: '할인값', edit: 'number', width: '90px', align: 'right' },
      { key: 'minAmount',    label: '최소금액', edit: 'number', width: '100px', align: 'right' },
      { key: 'useYn',        label: '사용',   edit: 'select', width: '80px', align: 'center',
        options: codes.use_yn_opts },
      { key: 'expDate',      label: '만료일', edit: 'date', width: '130px', align: 'center' },
    ];
    const onReorder = () => showToast('정렬이 변경되었습니다.');
    const onRowCancel = (row) => cancelRow(gridRows.indexOf(row));
    const onRowDelete = (row) => deleteRow(gridRows.indexOf(row));

    return {
      toast, searchParam, onSearch, onReset,
      gridRows, gridCols, pager, setPage, getRealIdx,
      setFocused, onCellChange, onReorder, onRowCancel, onRowDelete,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, handleSave,
      onDragStart, onDragOver, onDragEnd,
      uiState, toggleCheckAll, fnStatusBadge, rowBg,
      codes };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">{{ toast.msg }}</div>
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">06. 쿠폰 관리 <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">CRUD Grid 예제</span></div>
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <input v-model="searchParam.searchValue" placeholder="쿠폰명 검색" @keyup.enter="onSearch" style="font-size:12px;padding:5px 10px;border:1px solid #ddd;border-radius:6px;width:180px;outline:none;" />
      <select v-model="searchParam.discounttype" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">할인유형 전체</option>
        <option v-for="o in codes.discnt_type_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchParam.useyn" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">사용여부 전체</option>
        <option v-for="o in codes.use_yn_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <button @click="onSearch" style="font-size:12px;padding:5px 14px;border:none;border-radius:6px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">검색</button>
      <button @click="onReset"  style="font-size:12px;padding:5px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">초기화</button>
    </div>
  </div>
  <fo-grid-crud
    list-title="쿠폰 목록" row-key="couponId"
    :columns="gridCols" :rows="gridRows"
    v-model:checkAll="uiState.checkAll"
    v-model:focusedIdx="uiState.focusedIdx"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @reorder="onReorder" @cell-change="onCellChange">
    <template #row-cancel="{ row }">
      <button v-if="['U','I','D'].includes(row._row_status)" @click.stop="onRowCancel(row)"
        style="font-size:10px;padding:2px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">취소</button>
    </template>
    <template #row-delete="{ row }">
      <button v-if="['N','U'].includes(row._row_status)" @click.stop="onRowDelete(row)"
        style="font-size:10px;padding:2px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;">삭제</button>
    </template>
  </fo-grid-crud>
</div>
  `,
};

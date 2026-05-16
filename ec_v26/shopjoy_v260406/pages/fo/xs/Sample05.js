/* ShopJoy - Sample05: 게시판 관리 CRUD Grid  (API: GET|POST|PUT|DELETE /api/base/sy/zz-sample1, cdGrp='S05_BOARD')
 * ZzSample1 필드 매핑:
 *   sample1Id → boardId  |  cdNm → title  |  col01 → author  |  col02 → category
 *   col03 → viewCnt  |  useYn → status(Y=공개/N=비공개)  |  regDt → regDate
 */
window.XsSample05 = {
  name: 'XsSample05',
  setup() {
    const { ref, reactive, onMounted, watch } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dragSrc: null, focusedIdx: null, dragMoved: false, checkAll: false });
    const codes = reactive({
      category_opts: [{ value: '공지', label: '공지' }, { value: '이벤트', label: '이벤트' }, { value: 'QA', label: 'QA' }, { value: '자유', label: '자유' }],
      open_opts:     [{ value: '공개', label: '공개' }, { value: '비공개', label: '비공개' }],
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
    const CD_GRP = 'S05_BOARD';
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;

    /* showToast */
    const showToast = (msg, type = 'success') => { toast.msg = msg; toast.type = type; toast.show = true; clearTimeout(_tId); _tId = setTimeout(() => { toast.show = false; }, 2500); };
    const searchParam = reactive({ searchType: '', searchValue: '', category: '', status: '' });
    const searchParamOrg = reactive({ searchType: '', searchValue: '', category: '', status: '' });
    const allData    = reactive([]);
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const EDIT_FIELDS = ['title', 'author', 'category', 'status'];

    /* toRow */
    const toRow = d => ({ boardId: d.sample1Id, title: d.cdNm || '', author: d.col01 || '', category: d.col02 || '공지', viewCnt: Number(d.col03) || 0, status: d.useYn === 'Y' ? '공개' : '비공개', regDate: d.regDt || '' });

    /* toPayload */
    const toPayload = r => ({ cdGrp: CD_GRP, cdNm: r.title, col01: r.author, col02: r.category, col03: String(r.viewCnt || 0), useYn: r.status === '공개' ? 'Y' : 'N' });

    /* makeRow */
    const makeRow = d => ({ ...d, _row_status: 'N', _row_check: false, _row_org: { title: d.title, author: d.author, category: d.category, status: d.status } });
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
        if (searchVal) {
          const types = searchParam.searchType || 'title,author';
          const hits = [];
          if (types.includes('title'))  hits.push(String(d.title  || '').toLowerCase().includes(searchVal));
          if (types.includes('author')) hits.push(String(d.author || '').toLowerCase().includes(searchVal));
          if (!hits.some(Boolean)) return false;
        }
        if (searchParam.category && d.category !== searchParam.category) return false;
        if (searchParam.status   && d.status   !== searchParam.status)   return false;
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
    const onReset  = async () => { Object.assign(searchParam, searchParamOrg); pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* setFocused */
    const setFocused   = idx => { uiState.focusedIdx = idx; };

    /* onCellChange */
    const onCellChange = row => { if (row._row_status === 'I' || row._row_status === 'D') return; row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N'; };

    /* addRow */
    const addRow = () => {
      const at = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(at, 0, { boardId: _tempId--, title: '', author: '', category: '공지', viewCnt: 0, status: '공개', regDate: '', _row_status: 'I', _row_check: false, _row_org: null });
      uiState.focusedIdx = at; pager.pageNo = Math.ceil((at + 1) / pager.pageSize);
    };

    /* deleteRow */
    const deleteRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); } else row._row_status = 'D'; };

    /* cancelRow */
    const cancelRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); } else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; } };

    /* deleteRows */
    const deleteRows    = () => { for (let i = gridRows.length - 1; i >= 0; i--) { if (!gridRows[i]._row_check) continue; if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1); else gridRows[i]._row_status = 'D'; } };

    /* cancelChecked */
    const cancelChecked = () => { const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.boardId)); if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; } for (let i = gridRows.length - 1; i >= 0; i--) { const row = gridRows[i]; if (!ids.has(row.boardId)) continue; if (row._row_status === 'N') continue; if (row._row_status === 'I') gridRows.splice(i, 1); else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; } } };

    /* 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I'), uRows = gridRows.filter(r => r._row_status === 'U'), dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) { if (!r.title || !r.author) { showToast('제목, 작성자는 필수 항목입니다.', 'error'); return; } }
      const parts = []; if (iRows.length) parts.push(`등록 ${iRows.length}건`); if (uRows.length) parts.push(`수정 ${uRows.length}건`); if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) return;
      try {
        for (const r of dRows) await api.delete(`${API}/${r.boardId}`);
        for (const r of uRows) await api.put(`${API}/${r.boardId}`, toPayload(r));
        for (const r of iRows) await api.post(API, toPayload(r));
        showToast(`${parts.join(', ')} 저장되었습니다.`);
        const res = await api.get(API, { cdGrp: CD_GRP });
        const list = res?.data?.data ?? res?.data ?? [];
        allData.splice(0, allData.length, ...list.map(toRow));
        gridRows.splice(0); uiState.focusedIdx = null; pager.pageNo = 1;
        allData.filter(d => {
          const searchVal = searchParam.searchValue.toLowerCase();
          if (searchVal) {
          const types = searchParam.searchType || 'title,author';
          const hits = [];
          if (types.includes('title'))  hits.push(String(d.title  || '').toLowerCase().includes(searchVal));
          if (types.includes('author')) hits.push(String(d.author || '').toLowerCase().includes(searchVal));
          if (!hits.some(Boolean)) return false;
        }
          if (searchParam.category && d.category !== searchParam.category) return false;
          if (searchParam.status   && d.status   !== searchParam.status)   return false;
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

    return {
      toast, searchParam, onSearch, onReset,
      gridRows, pager, setPage, getRealIdx,
      setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, handleSave,
      onDragStart, onDragOver, onDragEnd,
      uiState, toggleCheckAll, fnStatusBadge, rowBg,
      codes };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">{{ toast.msg }}</div>
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">05. 게시판 관리 <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">CRUD Grid 예제</span></div>
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'title',  label: '제목' },
          { value: 'author', label: '작성자' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="140px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" style="font-size:12px;padding:5px 10px;border:1px solid #ddd;border-radius:6px;width:200px;outline:none;" />
      <select v-model="searchCategory" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">카테고리 전체</option>
        <option v-for="o in codes.category_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchStatus" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">상태 전체</option>
        <option v-for="o in codes.open_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <button @click="onSearch" style="font-size:12px;padding:5px 14px;border:none;border-radius:6px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">검색</button>
      <button @click="onReset"  style="font-size:12px;padding:5px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">초기화</button>
    </div>
  </div>
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:12px;font-weight:700;">게시판 목록 <span style="color:#e8587a;margin-left:4px;">{{ gridRows.filter(r => r._row_status !== 'D').length }}건</span></span>
      <div style="display:flex;gap:5px;">
        <button @click="addRow"        style="font-size:11px;padding:4px 10px;border:1px solid #34a853;border-radius:5px;background:#e6f4ea;color:#1e7e34;cursor:pointer;font-weight:600;">+ 행추가</button>
        <button @click="deleteRows"    style="font-size:11px;padding:4px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fee2e2;color:#991b1b;cursor:pointer;">행삭제</button>
        <button @click="cancelChecked" style="font-size:11px;padding:4px 10px;border:1px solid #ddd;border-radius:5px;background:#fff;color:#555;cursor:pointer;">취소</button>
        <button @click="handleSave"        style="font-size:11px;padding:4px 10px;border:none;border-radius:5px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">저장</button>
      </div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:760px;">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
            <th style="width:28px;padding:7px 4px;text-align:center;color:#ccc;font-weight:400;">⠿</th>
            <th style="width:50px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">ID</th>
            <th style="width:36px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">상태</th>
            <th style="width:28px;padding:7px;text-align:center;"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
            <th style="padding:7px;text-align:left;font-weight:600;color:#555;">제목</th>
            <th style="width:100px;padding:7px;text-align:left;font-weight:600;color:#555;">작성자</th>
            <th style="width:80px;padding:7px;text-align:center;font-weight:600;color:#555;">카테고리</th>
            <th style="width:60px;padding:7px;text-align:right;font-weight:600;color:#555;">조회수</th>
            <th style="width:72px;padding:7px;text-align:center;font-weight:600;color:#555;">공개여부</th>
            <th style="width:96px;padding:7px;text-align:center;font-weight:600;color:#555;">등록일</th>
            <th style="width:48px;"></th><th style="width:48px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="gridRows.length===0"><td colspan="12" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">데이터가 없습니다.</td></tr>
          <tr v-for="(row,idx) in pager.pageList" :key="row.boardId"
            draggable="true" @click="setFocused(getRealIdx(idx))"
            @dragstart="onDragStart(getRealIdx(idx))" @dragover="onDragOver($event,getRealIdx(idx))" @dragend="onDragEnd"
            style="cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
            :style="rowBg(row._row_status)+(focusedIdx===getRealIdx(idx)?'outline:2px solid #93c5fd inset;':'')">
            <td style="text-align:center;color:#ccc;cursor:grab;font-size:14px;">⠿</td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.boardId > 0 ? row.boardId : 'NEW' }}</td>
            <td style="text-align:center;"><span style="font-size:9px;padding:2px 5px;border-radius:8px;font-weight:700;" :style="fnStatusBadge(row._row_status)">{{ row._row_status }}</span></td>
            <td style="text-align:center;"><input type="checkbox" v-model="row._row_check" @click.stop /></td>
            <td><input v-model="row.title" :disabled="row._row_status==='D'" @input="onCellChange(row)"
              style="width:100%;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;border-radius:3px;outline:none;"
              @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" /></td>
            <td><input v-model="row.author" :disabled="row._row_status==='D'" @input="onCellChange(row)"
              style="width:100%;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;border-radius:3px;outline:none;"
              @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" /></td>
            <td style="text-align:center;">
              <select v-model="row.category" :disabled="row._row_status==='D'" @change="onCellChange(row)" style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:4px;background:#fff;">
                <option v-for="o in codes.category_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </td>
            <td style="text-align:right;padding:3px 8px;color:#666;font-size:11px;">{{ row.viewCnt }}</td>
            <td style="text-align:center;">
              <select v-model="row.status" :disabled="row._row_status==='D'" @change="onCellChange(row)" style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:4px;background:#fff;">
                <option v-for="o in codes.open_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.regDate }}</td>
            <td style="text-align:center;"><button v-if="['U','I','D'].includes(row._row_status)" @click.stop="cancelRow(getRealIdx(idx))" style="font-size:10px;padding:2px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">취소</button></td>
            <td style="text-align:center;"><button v-if="['N','U'].includes(row._row_status)" @click.stop="deleteRow(getRealIdx(idx))" style="font-size:10px;padding:2px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;">삭제</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #f0f0f0;">
      <div style="font-size:11px;color:#aaa;">총 {{ gridRows.filter(r => r._row_status !== 'D').length }}건</div>
      <div style="display:flex;gap:3px;">
        <button :disabled="pager.pageNo===1" @click="setPage(1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">‹</button>
        <button v-for="n in pager.pageNums" :key="n" @click="setPage(n)" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:4px;cursor:pointer;" :style="pager.pageNo===n?'background:#e8587a;color:#fff;border-color:#e8587a;':'background:#fff;'">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">»</button>
      </div>
      <select v-model.number="pager.pageSize" @change="()=>{pager.pageNo=1;fnBuildPagerNums();}" style="font-size:11px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;">
        <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
      </select>
    </div>
  </div>
</div>
  `,
};

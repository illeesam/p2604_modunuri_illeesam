/* ShopJoy - Sample02: 상품 관리 CRUD Grid (Infinity Scroll)  (API: GET|POST|PUT|DELETE /api/base/sy/zz-sample1, cdGrp='S02_PRODUCT')
 * ZzSample1 필드 매핑:
 *   sample1Id → productId  |  cdNm → productNm  |  col01 → category
 *   col02 → price  |  col03 → stock  |  useYn → status(Y=판매중/N=판매중지)  |  regDt → regDate
 */
window.XsSample02 = {
  name: 'XsSample02',
  setup() {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dragSrc: null, focusedIdx: null, visibleCount: 10, dragMoved: false, checkAll: false });
    const codes = reactive({
      prod_status_opts: [{ value: '판매중', label: '판매중' }, { value: '품절', label: '품절' }, { value: '판매중지', label: '판매중지' }],
      category_opts: ['상의', '하의', '아우터', '원피스', '신발', '가방'],
    });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
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
    const CD_GRP = 'S02_PRODUCT';

    /* -- Toast -- */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;

    /* showToast — 표시 */
    const showToast = (msg, type = 'success') => {
      toast.msg = msg; toast.type = type; toast.show = true;
      clearTimeout(_tId); _tId = setTimeout(() => { toast.show = false; }, 2500);
    };

    /* -- 검색 -- */
    const searchParam = reactive({ searchValue: '', category: '', status: '', visibleCount: 10});;
    const searchParamOrg = reactive({ searchValue: '', category: '', status: '' });

    /* -- CRUD Grid -- */

    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageType: 'INFINITE_SCROLL', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const allData    = reactive([]);
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const EDIT_FIELDS = ['productNm', 'category', 'price', 'stock', 'status'];

    /* toRow — → 행 */
    const toRow = d => ({
      productId: d.sample1Id,
      productNm: d.cdNm  || '',
      category:  d.col01 || '상의',
      price:     Number(d.col02) || 0,
      stock:     Number(d.col03) || 0,
      status:    d.useYn === 'Y' ? '판매중' : '판매중지',
      regDate:   d.regDt || '',
    });

    /* toPayload — → 페이로드 */
    const toPayload = r => ({ cdGrp: CD_GRP, cdNm: r.productNm, col01: r.category, col02: String(r.price), col03: String(r.stock), useYn: r.status === '판매중지' ? 'N' : 'Y' });

    /* makeRow — 행 생성 */
    const makeRow = d => ({
      ...d,
      _row_status: 'N', _row_check: false,
      _row_org: { productNm: d.productNm, category: d.category, price: d.price, stock: d.stock, status: d.status },
    });

    /* -- 무한스크롤 (IntersectionObserver) -- */
    const visibleCount  = ref(10);
    const sentinelEl    = ref(null);   // 템플릿 ref: "더 불러오기" 요소
    const cfVisibleRows   = computed(() => gridRows.slice(0, uiState.visibleCount));
    const cfHasMore       = computed(() => uiState.visibleCount < gridRows.length);

    /* handleLoadMore — 처리 */
    const handleLoadMore      = () => { uiState.visibleCount = Math.min(uiState.visibleCount + 10, gridRows.length); };

    let _observer = null;

    /* setupObserver — 설정 옵저버 */
    const setupObserver = () => {
      if (_observer) _observer.disconnect();
      _observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && cfHasMore.value) handleLoadMore();
      }, { threshold: 0.1 });
      if (sentinelEl.value) _observer.observe(sentinelEl.value);
    };

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await api.get(API, { cdGrp: CD_GRP });
        const list = res?.data?.data ?? res?.data ?? [];
        allData.splice(0, allData.length, ...list.map(toRow));
      } catch (e) { showToast('데이터 로드 실패: ' + (e.message || e), 'error'); }
      gridRows.splice(0); uiState.focusedIdx = null; uiState.visibleCount = 10;
      allData.filter(d => {
        const searchVal = searchParam.searchValue.toLowerCase();
        if (searchVal && !String(d.productNm || '').toLowerCase().includes(searchVal)) return false;
        if (searchParam.category && d.category !== searchParam.category) return false;
        if (searchParam.status   && d.status   !== searchParam.status)   return false;
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
      Vue.nextTick(setupObserver);
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    onUnmounted(() => {
      if (_observer) _observer.disconnect();
    });

    /* onSearch — 조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset  = async () => { Object.assign(searchParam, searchParamOrg); pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* setFocused — 포커스 설정 */
    const setFocused   = idx => { uiState.focusedIdx = idx; };

    /* onCellChange — 셀 변경 */
    const onCellChange = row => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const at = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : Math.min(uiState.visibleCount, gridRows.length);
      gridRows.splice(at, 0, { productId: _tempId--, productNm: '', category: '상의', price: 0, stock: 0, status: '판매중', regDate: '', _row_status: 'I', _row_check: false, _row_org: null });
      uiState.focusedIdx = at;
      // 새 행이 보이도록 visibleCount 확장
      if (at >= uiState.visibleCount) uiState.visibleCount = at + 1;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
        if (idx < uiState.visibleCount) uiState.visibleCount = Math.max(10, uiState.visibleCount - 1);
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
        if (idx < uiState.visibleCount) uiState.visibleCount = Math.max(10, uiState.visibleCount - 1);
      } else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.productId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i]; if (!ids.has(row.productId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') gridRows.splice(i, 1);
        else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I'), uRows = gridRows.filter(r => r._row_status === 'U'), dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) { if (!r.productNm) { showToast('상품명은 필수 항목입니다.', 'error'); return; } }
      const parts = []; if (iRows.length) parts.push(`등록 ${iRows.length}건`); if (uRows.length) parts.push(`수정 ${uRows.length}건`); if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) return;
      try {
        for (const r of dRows) await api.delete(`${API}/${r.productId}`);
        for (const r of uRows) await api.put(`${API}/${r.productId}`, toPayload(r));
        for (const r of iRows) await api.post(API, toPayload(r));
        showToast(`${parts.join(', ')} 저장되었습니다.`);
        const res = await api.get(API, { cdGrp: CD_GRP });
        const list = res?.data?.data ?? res?.data ?? [];
        allData.splice(0, allData.length, ...list.map(toRow));
        gridRows.splice(0); uiState.focusedIdx = null; uiState.visibleCount = 10;
        allData.filter(d => {
          const searchVal = searchParam.searchValue.toLowerCase();
          if (searchVal && !String(d.productNm || '').toLowerCase().includes(searchVal)) return false;
          if (searchParam.category && d.category !== searchParam.category) return false;
          if (searchParam.status   && d.status   !== searchParam.status)   return false;
          return true;
        }).forEach(d => gridRows.push(makeRow(d)));
        Vue.nextTick(setupObserver);
      } catch (e) { showToast('저장 실패: ' + (e.response?.data?.message || e.message || e), 'error'); }
    };

    /* onDragStart — 드래그 시작 */
    const onDragStart = idx => { uiState.dragSrc = idx; uiState.dragMoved = false; };

    /* onDragOver — 드래그 오버 */
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (uiState.dragSrc === null || uiState.dragSrc === idx) return;
      const m = gridRows.splice(uiState.dragSrc, 1)[0]; gridRows.splice(idx, 0, m);
      uiState.dragSrc = idx; uiState.dragMoved = true;
    };

    /* onDragEnd — 드래그 종료 */
    const onDragEnd = () => { if (uiState.dragMoved) showToast('정렬이 변경되었습니다.'); uiState.dragSrc = null; uiState.dragMoved = false; };

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { cfVisibleRows.value.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ N: 'background:#f0f0f0;color:#666;', I: 'background:#dbeafe;color:#1e40af;', U: 'background:#fef3c7;color:#92400e;', D: 'background:#fee2e2;color:#991b1b;' }[s] || '');

    /* rowBg — 행 배경 */
    const rowBg       = s => ({ I: 'background:#f0fdf4;', U: 'background:#fffbeb;', D: 'background:#fff1f2;opacity:.45;' }[s] || '');

    /* fo-grid-crud 컬럼 — category_opts 는 문자열 배열 → {value,label} 매핑 */
    /* category_opts 가 문자열 배열 → {value,label} 으로 변환 (FoSearchArea select / fo-grid-crud 공유) */
    const cfCategoryOpts = Vue.computed(() => codes.category_opts.map(c => ({ value: c, label: c })));

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    /* FoSearchArea :columns 자동 렌더 정의 */
    // --- [컬럼 정의] ---
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text',   label: '상품명', placeholder: '상품명 검색', width: '180px' },
      { key: 'category',    type: 'select', label: '카테고리', options: () => cfCategoryOpts.value,   nullLabel: '카테고리 전체' },
      { key: 'status',      type: 'select', label: '상태', options: () => codes.prod_status_opts, nullLabel: '상태 전체' },
    ];

    const baseGridColumns = [
      { key: 'productNm', label: '상품명', edit: 'text' },
      { key: 'category',  label: '카테고리', edit: 'select', width: '100px', align: 'center',
        options: cfCategoryOpts.value },
      { key: 'price',     label: '가격',   edit: 'number', width: '100px', align: 'right' },
      { key: 'stock',     label: '재고',   edit: 'number', width: '80px', align: 'right' },
      { key: 'status',    label: '판매상태', edit: 'select', width: '90px', align: 'center',
        options: codes.prod_status_opts },
      { key: 'regDate',   label: '등록일', width: '100px', align: 'center' },
    ];
    /* onReorder — 이벤트 */
    const onReorder = () => showToast('정렬이 변경되었습니다.');
    /* onRowCancel — 이벤트 */
    const onRowCancel = (row) => cancelRow(gridRows.indexOf(row));
    /* onRowDelete — 이벤트 */
    const onRowDelete = (row) => deleteRow(gridRows.indexOf(row));

    // ===== return (템플릿 노출) ===============================================


    return {
      toast, searchParam, baseSearchColumns, onSearch, onReset,
      gridRows, baseGridColumns, cfVisibleRows, visibleCount, cfHasMore, loadMore: handleLoadMore, sentinelEl,
      setFocused, onCellChange, onReorder, onRowCancel, onRowDelete,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, handleSave,
      onDragStart, onDragOver, onDragEnd,
      uiState, toggleCheckAll, fnStatusBadge, rowBg,
      codes };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">
  <!-- -- Toast ---------------------------------------------------------- -->
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">
    {{ toast.msg }}
  </div>
  <!-- -- 제목 ------------------------------------------------------------- -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    02. 상품 관리
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">Infinity Scroll CRUD Grid</span>
  </div>
  <!-- -- 검색 ------------------------------------------------------------- -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <fo-search-area :columns="baseSearchColumns" :param="searchParam"
      @search="onSearch" @reset="onReset" />
  </div>
  <!-- -- CRUD Grid (fo-grid-crud — 전체로드 스크롤 모델) ------------------- -->
  <fo-grid-crud
    list-title="상품 목록" row-key="productId"
    :columns="baseGridColumns" :rows="gridRows" max-height="60vh"
    v-model:checkAll="uiState.checkAll"
    v-model:focusedIdx="uiState.focusedIdx"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @reorder="onReorder" @cell-change="onCellChange">
    <template #row-actions="{ row }">
      <fo-row-cancel-delete :row="row" @cancel="onRowCancel(row)" @delete="onRowDelete(row)" />
    </template>
  </fo-grid-crud>
  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</div>
`,
};

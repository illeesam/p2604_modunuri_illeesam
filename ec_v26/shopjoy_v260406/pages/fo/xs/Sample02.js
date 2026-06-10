/* ShopJoy - Sample02: 상품 관리 CRUD Grid (Infinity Scroll)  (API: GET|POST|PUT|DELETE /api/base/sy/zz-sample1, cdGrp='S02_PRODUCT')
 * ZzSample1 필드 매핑:
 *   sample1Id → productId  |  cdNm → productNm  |  col01 → category
 *   col02 → price  |  col03 → stock  |  useYn → status(Y=판매중/N=판매중지)  |  regDt → regDate
 */
window.XsSample02 = {
  name: 'XsSample02',
  setup() {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      dragSrc: null, focusedIdx: null, visibleCount: 10, dragMoved: false, checkAll: false,
    });
    const codes = reactive({                       // 정적 옵션
      prod_status_opts: [{ value: '판매중', label: '판매중' }, { value: '품절', label: '품절' }, { value: '판매중지', label: '판매중지' }],
      category_opts: ['상의', '하의', '아우터', '원피스', '신발', '가방'],
    });
    const CD_GRP = 'S02_PRODUCT';                  // 상품 코드 그룹
    const EDIT_FIELDS = ['productNm', 'category', 'price', 'stock', 'status'];

    /* ===== 검색조건 ===== */
    const searchParam = reactive({ searchValue: '', category: '', status: '', visibleCount: 10 });
    const searchParamOrg = reactive({ searchValue: '', category: '', status: '' });

    /* ===== 그리드 데이터 ===== */
    const allDatas    = reactive([]);               // 원본 (서버 응답)
    const gridRows   = reactive([]);               // 화면 표시용 (필터 + 편집)
    let   _tempId    = -1;                         // 신규 행 임시 ID

    /* ===== 페이지네이션 (Infinite Scroll) ===== */
    const pager = reactive({
      pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageType: 'INFINITE_SCROLL', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {},
    });

    /* ===== 무한스크롤 ===== */
    const visibleCount  = ref(10);
    const sentinelEl    = ref(null);               // 템플릿 ref: "더 불러오기" 요소

    const cfHasMore     = computed(() => uiState.visibleCount < gridRows.length);
    let _observer = null;

    /* ===== 토스트 ===== */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;

    /* showToast — 토스트 표시 */
    const showToast = (msg, type = 'success') => {
      toast.msg = msg; toast.type = type; toast.show = true;
      clearTimeout(_tId);
      _tId = setTimeout(() => { toast.show = false; }, 2500);
    };

    /* ===== 데이터 변환 헬퍼 ===== */
    /* toRow — ZzSample1 → 화면 행 */
    const toRow = d => ({
      productId: d.sample1Id, productNm: d.cdNm || '', category: d.col01 || '상의',
      price: Number(d.col02) || 0, stock: Number(d.col03) || 0,
      status: d.useYn === 'Y' ? '판매중' : '판매중지', regDate: d.regDt || '',
    });

    /* toPayload — 화면 행 → ZzSample1 페이로드 */
    const toPayload = r => ({
      cdGrp: CD_GRP, cdNm: r.productNm, col01: r.category,
      col02: String(r.price), col03: String(r.stock),
      useYn: r.status === '판매중지' ? 'N' : 'Y',
    });

    /* makeRow — 편집 상태 포함 행 생성 */
    const makeRow = d => ({
      ...d, _row_status: 'N', _row_check: false,
      _row_org: { productNm: d.productNm, category: d.category, price: d.price, stock: d.stock, status: d.status },
    });

    /* handleLoadMore — 더 보기 처리 */
    const handleLoadMore = () => { uiState.visibleCount = Math.min(uiState.visibleCount + 10, gridRows.length); };

    /* setupObserver — IntersectionObserver 설정 */
    const setupObserver = () => {
      if (_observer) { _observer.disconnect(); }
      _observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && cfHasMore.value) { handleLoadMore(); }
      }, { threshold: 0.1 });
      if (sentinelEl.value) { _observer.observe(sentinelEl.value); }
    };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Sample02.js : handleBtnAction -> ', cmd, param);
      // 조회 (검색)
      if (cmd === 'search-search') {
        return onSearch();
      // 검색 초기화
      } else if (cmd === 'search-reset') {
        return onReset();
      // 행 추가
      } else if (cmd === 'products-add') {
        return addRow();
      // 일괄 저장
      } else if (cmd === 'products-save') {
        return handleSave();
      // 선택 행 삭제
      } else if (cmd === 'products-deleteChecked') {
        return deleteRows();
      // 선택 행 취소
      } else if (cmd === 'products-cancelChecked') {
        return cancelChecked();
      // 정렬 변경 알림
      } else if (cmd === 'products-reorder') {
        return onReorder();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Sample02.js : handleSelectAction -> ', cmd, param);
      // 행 셀 변경
      if (cmd === 'products-rowCellChange') {
        return onCellChange(param);
      // 행 취소
      } else if (cmd === 'products-rowCancel') {
        return onRowCancel(param);
      // 행 삭제
      } else if (cmd === 'products-rowDelete') {
        return onRowDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    onUnmounted(() => {
      if (_observer) { _observer.disconnect(); }
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await foApi.get('api/base/sy/zz-sample1', { params: { cdGrp: CD_GRP } });
        const list = res?.data?.data ?? res?.data ?? [];
        allDatas.splice(0, allDatas.length, ...list.map(toRow));
      } catch (e) { showToast('데이터 로드 실패: ' + (e.message || e), 'error'); }
      gridRows.splice(0); uiState.focusedIdx = null; uiState.visibleCount = 10;
      allDatas.filter(d => {
        const searchVal = searchParam.searchValue.toLowerCase();
        if (searchVal && !String(d.productNm || '').toLowerCase().includes(searchVal)) { return false; }
        if (searchParam.category && d.category !== searchParam.category) { return false; }
        if (searchParam.status   && d.status   !== searchParam.status) { return false; }
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
      Vue.nextTick(setupObserver);
    };

    /* onSearch — 조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset  = async () => { Object.assign(searchParam, searchParamOrg); pager.pageNo = 1; await handleSearchList('DEFAULT'); };



    /* onCellChange — 셀 변경 */
    const onCellChange = row => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const at = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : Math.min(uiState.visibleCount, gridRows.length);
      gridRows.splice(at, 0, { productId: _tempId--, productNm: '', category: '상의', price: 0, stock: 0, status: '판매중', regDate: '', _row_status: 'I', _row_check: false, _row_org: null });
      uiState.focusedIdx = at;
      // 새 행이 보이도록 visibleCount 확장
      if (at >= uiState.visibleCount) { uiState.visibleCount = at + 1; }
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
        if (idx < uiState.visibleCount) { uiState.visibleCount = Math.max(10, uiState.visibleCount - 1); }
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
        if (idx < uiState.visibleCount) { uiState.visibleCount = Math.max(10, uiState.visibleCount - 1); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) { continue; }
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.productId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.productId) || row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else {
          if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
          row._row_status = 'N';
        }
      }
    };

    /* handleSave — 일괄 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.productNm) { showToast('상품명은 필수 항목입니다.', 'error'); return; }
      }
      const parts = [];
      if (iRows.length) { parts.push(`등록 ${iRows.length}건`); }
      if (uRows.length) { parts.push(`수정 ${uRows.length}건`); }
      if (dRows.length) { parts.push(`삭제 ${dRows.length}건`); }
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) { return; }
      try {
        for (const r of dRows) { await foApi.delete(`api/base/sy/zz-sample1/${r.productId}`); }
        for (const r of uRows) { await foApi.put(`api/base/sy/zz-sample1/${r.productId}`, toPayload(r)); }
        for (const r of iRows) { await foApi.post('api/base/sy/zz-sample1', toPayload(r)); }
        showToast(`${parts.join(', ')} 저장되었습니다.`);
        await handleSearchList();
      } catch (e) {
        showToast('저장 실패: ' + (e.response?.data?.message || e.message || e), 'error');
      }
    };









    /* onReorder — 정렬 변경 알림 */
    const onReorder = () => showToast('정렬이 변경되었습니다.');

    /* onRowCancel — 행 취소 이벤트 */
    const onRowCancel = (row) => cancelRow(gridRows.indexOf(row));

    /* onRowDelete — 행 삭제 이벤트 */
    const onRowDelete = (row) => deleteRow(gridRows.indexOf(row));

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */





    /* category_opts 가 문자열 배열 → {value,label} 으로 변환 (FoSearchArea select / fo-grid-crud 공유) */
    const cfCategoryOpts = computed(() => codes.category_opts.map(c => ({ value: c, label: c })));

    /* FoSearchArea :columns 자동 렌더 정의 */
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text',   label: '상품명', placeholder: '상품명 검색', width: '180px' },
      { key: 'category',    type: 'select', label: '카테고리', options: () => cfCategoryOpts.value,   nullLabel: '카테고리 전체' },
      { key: 'status',      type: 'select', label: '상태', options: () => codes.prod_status_opts, nullLabel: '상태 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'productNm', label: '상품명', edit: 'text' },
      { key: 'category',  label: '카테고리', edit: 'select', width: '100px', align: 'center',
        options: cfCategoryOpts.value },
      { key: 'price',     label: '가격',   edit: 'number', width: '100px', align: 'right' },
      { key: 'stock',     label: '재고',   edit: 'number', width: '80px', align: 'right' },
      { key: 'status',    label: '판매상태', edit: 'select', width: '90px', align: 'center',
        options: codes.prod_status_opts },
      { key: 'regDate',   label: '등록일', width: '100px', align: 'center' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, toast, searchParam, gridRows,              // 상태 / 데이터
      handleBtnAction, handleSelectAction, // dispatch
    };
  },
  template: /* html */`
<fo-page bare style="padding:clamp(12px,3vw,24px);">
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">
    {{ toast.msg }}
  </div>
  <!-- ===== □. 조건부 영역 ================================================== -->
  <!-- ===== ■. 헤더 영역 =================================================== -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    02. 상품 관리
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">
      Infinity Scroll CRUD Grid
    </span>
  </div>
  <!-- ===== □. 헤더 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <fo-search-area :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('search-search')" @reset="handleBtnAction('search-reset')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <fo-grid-crud
    list-title="상품 목록" row-key="productId"
    :columns="columns.baseGrid" :rows="gridRows" max-height="60vh"
    v-model:checkAll="uiState.checkAll"
    v-model:focusedIdx="uiState.focusedIdx"
    @add="handleBtnAction('products-add')" @save="handleBtnAction('products-save')"
    @delete-checked="handleBtnAction('products-deleteChecked')" @cancel-checked="handleBtnAction('products-cancelChecked')"
    @reorder="handleBtnAction('products-reorder')" @cell-change="handleSelectAction('products-rowCellChange', $event)">
    <template #row-actions="{ row }">
      <fo-row-cancel-delete :row="row" @cancel="handleSelectAction('products-rowCancel', row)" @delete="handleSelectAction('products-rowDelete', row)" />
    </template>
  </fo-grid-crud>
  <!-- ===== □. 목록 영역 =================================================== -->
  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</fo-page>
`,
};

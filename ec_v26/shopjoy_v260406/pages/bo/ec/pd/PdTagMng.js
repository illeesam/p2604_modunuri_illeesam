/* ShopJoy Admin - 태그관리 */
window.PdTagMng = {
  name: 'PdTagMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const tags = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ use_yn: [] });

    /* 태그 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdTag.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '태그관리', '목록조회');
        const data = res.data?.data;
        tags.splice(0, tags.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ use: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const gridRows   = reactive([]);
    let   _tempId    = -1;

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    // --- [컬럼 정의] ---

    const baseSearchColumns = [
      { key: 'searchValue', label: '태그명', type: 'text', placeholder: '태그명 검색' },
      { key: 'use', label: '사용여부', type: 'select', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    const baseGridColumns = [
      { key: 'tagNm',    label: '태그명', edit: 'text', placeholder: '태그명' },
      { key: 'tagDesc',  label: '설명',   edit: 'text', placeholder: '설명',
        cellStyle: 'color:#888;font-size:12px;' },
      { key: 'useCount', label: '사용수', style: 'width:80px;text-align:right;', align: 'right', fmt: (v) => (v || 0) },
      { key: 'sortOrd',  label: '정렬',   style: 'width:80px;text-align:right;', edit: 'number', align: 'right' },
      { key: 'useYn',    label: '사용',   style: 'width:70px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    watch(tags, (list) => { gridRows.splice(0, gridRows.length, ...list.map(t => ({ ...t, _row_status: 'N' }))); }, { immediate: true });

    /* addRow — 행 추가 */
    const addRow       = () => { gridRows.unshift({ tagId: 'T' + (_tempId--), siteId: 1, tagNm: '', tagDesc: '', useCount: 0, sortOrd: 0, useYn: 'Y', _row_status: 'N' }); };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => { if (row._row_status !== 'N') row._row_status = 'U'; };

    /* deleteRow — 행 삭제 */
    const deleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await showConfirm('삭제', `[${row.tagNm}] 태그를 삭제하시겠습니까?`);
      if (!ok) return;
      const si = tags.findIndex(t => t.tagId === row.tagId); if (si !== -1) tags.splice(si, 1); gridRows.splice(idx, 1);
      try {
        const res = await boApiSvc.pdTag.remove(row.tagId, '태그관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* saveAll — 저장 */
    const saveAll = async () => {
      const changed = window.safeArrayUtils.safeFilter(gridRows, r => ['N','I','U','D'].includes(r._row_status));
      if (!changed.length) { showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed.filter(r => r._row_status !== 'D')) {
        if (!row.tagNm) { showToast('태그명은 필수입니다.', 'error'); return; }
      }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status === 'N' ? 'I' : r._row_status }));
      try {
        await boApiSvc.pdTag.saveList(saveRows, '태그관리', '저장');
        if (showToast) showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* fnYnBadge — 유틸 */
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ===== return (템플릿 노출) ===============================================


    return { tags, uiState, codes, searchParam, pager, setPage, onSearch, onReset,
             gridRows, baseGridColumns, baseSearchColumns, addRow, onCellChange, deleteRow, saveAll, fnYnBadge, onSizeChange };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">태그관리</div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="onSearch" @reset="onReset" />
  </div>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid
    :columns="baseGridColumns" :rows="gridRows" :pager="pager" row-key="tagId" row-actions
    list-title="태그 목록" :row-class="(row) => row._row_status==='N' ? 'table-row-new' : (row._row_status==='U' ? 'table-row-mod' : '')"
    @set-page="setPage" @size-change="onSizeChange" @cell-change="onCellChange">
    <template #toolbar-actions>
      <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
      <button class="btn btn-blue btn-sm" @click="saveAll">저장</button>
    </template>
    <template #row-actions="{ idx }">
      <button class="btn btn-danger btn-xs" @click="deleteRow(idx)">삭제</button>
    </template>
  </bo-grid>
</div>
`
};

/* ShopJoy Admin - 카테고리관리 */
window.PdCategoryMng = {
  name: 'PdCategoryMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const categories = reactive([]);
    const sites = computed(() => window._boCmSites || []);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedCatId: null, focusedIdx: null });
    const codes = reactive({
      category_depths: [],
      product_statuses: [],
      category_statuses: [],
    });

    /* 상품 카테고리 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdCategoryMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 그리드 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 카테고리 그리드 행 추가 (상단)
      } else if (cmd === 'categories-add') {
        return addRow();
      // 카테고리 그리드 저장
      } else if (cmd === 'categories-save') {
        return handleSave();
      // 체크된 행 일괄 삭제
      } else if (cmd === 'categories-deleteChecked') {
        return deleteRows();
      // 체크된 행 일괄 취소
      } else if (cmd === 'categories-cancelChecked') {
        return cancelChecked();
      // 좌측 트리 전체 보기 (선택 해제)
      } else if (cmd === 'categoryTree-clear') {
        uiState.selectedCatId = null;
        return;
      // 상위카테고리 모달 닫기
      } else if (cmd === 'parentModal-close') {
        catPickerModal.show = false;
        return;
      // 페이지 번호 클릭
      } else if (cmd === 'categories-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdCategoryMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경 (select)
      if (cmd === 'categories-pager-sizeChange') {
        return onSizeChange();
      // 좌측 트리 노드 선택
      } else if (cmd === 'categoryTree-select') {
        return selectNode(param);
      // 그리드 행 포커스
      } else if (cmd === 'categories-rowFocus') {
        return setFocused(param);
      // 그리드 행 셀 변경
      } else if (cmd === 'categories-rowCellChange') {
        return onCellChange(param);
      // 하위 행 추가
      } else if (cmd === 'categories-rowAddChild') {
        return addChildRow(param.row, param.idx);
      // 행 취소
      } else if (cmd === 'categories-rowCancel') {
        return cancelRow(param);
      // 행 삭제
      } else if (cmd === 'categories-rowDelete') {
        return deleteRow(param);
      // 행 체크 토글 (전체 체크)
      } else if (cmd === 'categories-rowCheckAll') {
        return toggleCheckAll();
      // 그리드 행 드래그 시작
      } else if (cmd === 'categories-rowDragStart') {
        return onRowDragStart(param);
      // 그리드 행 드래그 오버
      } else if (cmd === 'categories-rowDragOver') {
        return onRowDragOver(param);
      // 그리드 행 드롭
      } else if (cmd === 'categories-rowDrop') {
        return onRowDrop();
      // 상위카테고리 모달 열기
      } else if (cmd === 'parentModal-open') {
        return openParentModal(param);
      // 상위카테고리 모달에서 선택
      } else if (cmd === 'parentModal-select') {
        return onParentSelect(param);
      // 사이트 변경
      } else if (cmd === 'searchParam-siteChange') {
        return onSiteChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.category_depths = codeStore.sgGetGrpCodes('CATEGORY_DEPTH');
        codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
        codes.category_statuses = codeStore.sgGetGrpCodes('CATEGORY_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({
      siteId: (window.boCommonFilter && window.boCommonFilter.siteId)
              || window.sfGetBoAppStore?.()?.svBoSiteId
              || (window._boCmSites?.[0]?.siteId)
              || '2604010000000001', categoryDepth: '', categoryStatusCd: ''
    });
    const searchParam = reactive(_initSearchParam());

    /* 좌측 트리용 전체 카테고리 조회 (그리드/트리 캐시 갱신) */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.pdCategory.getPage({ siteId: searchParam.siteId, pageNo: 1, pageSize: 10000 }, '카테고리관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        categories.splice(0, categories.length, ...list);
        // CategoryTree 컴포넌트 캐시 무효화 → 저장 후 트리 갱신
        if (window._categoryTreeCache) {
          window._categoryTreeCache.list = null;
          window._categoryTreeCache.bySite = {};
        }
      } catch (e) {
        console.error('[handleSearchList]', e);
      }
    };

    /* handleGridSearch — 처리 */
    const handleGridSearch = async () => {
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...coUtil.cofOmitEmpty(searchParam),
          ...(uiState.selectedCatId ? { parentCategoryId: uiState.selectedCatId } : {}),
        };
        const res = await boApiSvc.pdCategory.getPage(params, '카테고리관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0);
        buildTreeRows(list).forEach(c => gridRows.push(makeRow(c)));
        categoriesGridPager.pageNo          = 1;
        categoriesGridPager.pageTotalCount  = gridRows.length;
        categoriesGridPager.pageTotalPage   = Math.max(1, Math.ceil(gridRows.length / categoriesGridPager.pageSize));
        fnBuildPagerNums();
      } catch (e) {
        console.error('[handleGridSearch]', e);
      }
    };

    /* onSiteChange — 이벤트 */
    const onSiteChange = async () => {
      uiState.selectedCatId = null;
      // boCommonFilter 동기화 (다른 화면 이동 시 일관성 유지)
      if (window.boCommonFilter) { window.boCommonFilter.siteId = searchParam.siteId; }
      await handleSearchList();
      await handleGridSearch();
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchList();
      await handleGridSearch();
    });

    /* selectNode — 노드 선택 */
    const selectNode = id => {
      if (id === null) { uiState.selectedCatId = null; return; }
      uiState.selectedCatId = (uiState.selectedCatId === id) ? null : id;
    };

    watch(() => uiState.selectedCatId, () => handleGridSearch());

    /* -- 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const categoriesGridPager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* buildTreeRows — 빌드 */
    const buildTreeRows = (items) => {
      const map = {};
      window.safeArrayUtils.safeForEach(items, c => { map[c.categoryId] = { ...c, _children: [] }; });
      const roots = [];
      window.safeArrayUtils.safeForEach(items, c => {
        if (c.parentCategoryId && map[c.parentCategoryId]) { map[c.parentCategoryId]._children.push(map[c.categoryId]); }
        else { roots.push(map[c.categoryId]); }
      });
      const result = [];

      /* traverse — traverse */
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    /* makeRow — 행 생성 */
    const makeRow = c => ({
      ...c, _depth: c._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { categoryNm: c.categoryNm, parentCategoryId: c.parentCategoryId, sortOrd: c.sortOrd, categoryDesc: c.categoryDesc, categoryStatusCd: c.categoryStatusCd },
    });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=categoriesGridPager.pageNo,l=categoriesGridPager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); categoriesGridPager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); categoriesGridPager.pageList=gridRows.slice((c-1)*categoriesGridPager.pageSize,c*categoriesGridPager.pageSize); };

    /* setPage — 설정 */
    const setPage       = n => { if (n >= 1 && n <= categoriesGridPager.pageTotalPage) { categoriesGridPager.pageNo = n; fnBuildPagerNums(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange  = () => { categoriesGridPager.pageNo = 1; categoriesGridPager.pageTotalCount = gridRows.length; categoriesGridPager.pageTotalPage = Math.max(1, Math.ceil(gridRows.length / categoriesGridPager.pageSize)); fnBuildPagerNums(); };

    /* getRealIdx — 조회 */
    const getRealIdx    = localIdx => (categoriesGridPager.pageNo - 1) * categoriesGridPager.pageSize + localIdx;

    /* onSearch — 조회 */
    const onSearch = async () => {
      categoriesGridPager.pageNo = 1;
      await handleGridSearch();
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.selectedCatId = null;
      await handleSearchList();
      await handleGridSearch();
    };
    /* fnCategoryDescCount — 트리 노드에 표시할 자손(자식 + 손자 …) 카운트.
       categories(reactive) 기반으로 재계산 — 카테고리 변경 시 자동 반영 */
    const fnCategoryDescCount = (categoryId) => {
      if (!categoryId) { return 0; }
      let count = 0;
      const stack = [categoryId];
      while (stack.length) {
        const id = stack.pop();
        const children = (categories || []).filter(c => c.parentCategoryId === id);
        count += children.length;
        children.forEach(c => stack.push(c.categoryId));
      }
      return count;
    };

    const catPickerModal = reactive({ show: false, search: '', forCategoryId: null, forRowIdx: null });
    const cfCatPickerList = computed(() => {
      const searchVal = (catPickerModal.search || '').toLowerCase();
      return (categories || []).filter(c => !searchVal || (c.categoryNm || '').toLowerCase().includes(searchVal));
    });

    /* onParentSelect — 이벤트 */
    const onParentSelect = (c) => {
      const idx = catPickerModal.forRowIdx;
      if (idx != null && gridRows[idx]) {
        gridRows[idx].parentCategoryId = c ? c.categoryId : null;
        if (gridRows[idx]._row_status !== 'N') { gridRows[idx]._row_status = 'U'; }
      }
      catPickerModal.show = false;
    };

    /* openParentModal — 열기 */
    const openParentModal = async (row) => {
      catPickerModal.forRowIdx = gridRows.indexOf(row);
      catPickerModal.search = '';
      catPickerModal.show = true;
      await handleSearchList(); // 팝업 오픈 시 최신 카테고리 목록 재조회
    };

    /* fnDepthColor — 유틸 */
    const fnDepthColor = (d) => ({0:'#e8587a',1:'#1677ff',2:'#3ba87a'}[d] || '#999');

    /* fnDepthBullet — 유틸 */
    const fnDepthBullet = (d) => ['●','○','▪'][d] || '·';

    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* parentNm — 상위 Nm */
    const parentNm = (id) => (categories || []).find(c => c.categoryId === id)?.categoryNm || id;

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => { if (row._row_status !== 'N') row._row_status = 'U'; };

    const checkAll = ref(false);

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const dragRowIdx = ref(null);
    const dragoverRowIdx = ref(null);

    /* onRowDragStart — 이벤트 */
    const onRowDragStart = (idx) => { dragRowIdx.value = idx; };

    /* onRowDragOver — 이벤트 */
    const onRowDragOver = (idx) => { dragoverRowIdx.value = idx; };

    /* onRowDrop — 이벤트 (드롭 즉시 sortOrd 저장 — 기존 행 'U'만 전송) */
    const onRowDrop = async () => {
      const from = dragRowIdx.value, to = dragoverRowIdx.value;
      dragRowIdx.value = null; dragoverRowIdx.value = null;
      if (from == null || to == null || from === to) { return; }
      const [moved] = gridRows.splice(from, 1);
      gridRows.splice(to, 0, moved);
      // 같은 부모 그룹 내 sortOrd 재계산
      const parentId = moved.parentCategoryId || null;
      const sortChangedRows = [];
      let ord = 1;
      gridRows.forEach(r => {
        if ((r.parentCategoryId || null) === parentId) {
          if (r.sortOrd !== ord) {
            r.sortOrd = ord;
            // 신규('C')는 아직 DB에 없으므로 즉시 저장 대상 제외 — [저장] 버튼에서 일괄 처리
            if (r._row_status !== 'C' && r.categoryId != null) {
              sortChangedRows.push({ categoryId: r.categoryId, sortOrd: ord, rowStatus: 'U' });
              if (r._row_status == null) { r._row_status = 'U'; }
            }
          }
          ord++;
        }
      });
      // 즉시 저장 (기존 행만) — 성공 후 목록 재조회로 깨끗한 상태 복귀
      if (sortChangedRows.length > 0) {
        try {
          await boApiSvc.pdCategory.saveList('order', sortChangedRows, '카테고리관리', '순서변경');
          showToast?.('순서가 저장되었습니다.', 'success');
          await handleSearchList();
        } catch (err) {
          console.error('[PdCategoryMng] sort save failed', err);
          showToast?.(err.response?.data?.message || '순서 저장 실패', 'error', 0);
        }
      }
    };

    /* -- 행 편집 -- */
    const focusedIdx = ref(-1);

    /* setFocused — 포커스 설정 */
    const setFocused = (idx) => { focusedIdx.value = idx; };

    /* addRow — 행 추가 */
    const addRow = () => {
      const parentCategoryId = uiState.selectedCatId || null;
      const parent = parentCategoryId ? (categories || []).find(c => c.categoryId === parentCategoryId) : null;
      const categoryDepth = parent ? ((parent.categoryDepth || 0) + 1) : 1;
      gridRows.unshift({
        categoryId: _tempId--,
        siteId: searchParam.siteId,
        categoryNm: '',
        parentCategoryId,
        sortOrd: 0,
        categoryDesc: '',
        categoryStatusCd: 'ACTIVE',
        categoryDepth,
        _depth: categoryDepth - 1,
        _row_status: 'N',
        _row_check: false,
      });
      categoriesGridPager.pageNo = 1;
    };

    /* addChildRow — 추가 */
    const addChildRow = (row, idx) => {
      const categoryDepth = (row.categoryDepth || 1) + 1;
      gridRows.splice(idx + 1, 0, {
        categoryId: _tempId--,
        siteId: row.siteId || searchParam.siteId,
        categoryNm: '',
        parentCategoryId: row.categoryId,
        sortOrd: 0,
        categoryDesc: '',
        categoryStatusCd: 'ACTIVE',
        categoryDepth,
        _depth: categoryDepth - 1,
        _row_status: 'N',
        _row_check: false,
      });
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (!row) { return; }
      if (row._row_status === 'N') {
        gridRows.splice(idx, 1);
      } else if (row._row_org) {
        Object.assign(row, row._row_org);
        row._row_status = null;
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (gridRows[i]._row_check) { cancelRow(i); }
      }
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = async (idx) => {
      const row = gridRows[idx];
      if (!row) { return; }
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await showConfirm?.('삭제', `[${row.categoryNm}] 카테고리를 삭제하시겠습니까?`);
      if (!ok) { return; }
      row._row_status = 'D';
      try {
        const res = await boApiSvc.pdCategory.remove(row.categoryId, '카테고리관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
        gridRows.splice(idx, 1);
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = async () => {
      const idxs = [];
      gridRows.forEach((r, i) => { if (r._row_check) idxs.push(i); });
      if (!idxs.length) { showToast?.('삭제할 행을 선택하세요.', 'info'); return; }
      const ok = await showConfirm?.('삭제', `선택한 ${idxs.length}건을 삭제하시겠습니까?`);
      if (!ok) { return; }
      for (let i = idxs.length - 1; i >= 0; i--) {
        const idx = idxs[i];
        const row = gridRows[idx];
        if (row._row_status === 'N') { gridRows.splice(idx, 1); continue; }
        try {
          await boApiSvc.pdCategory.remove(row.categoryId, '카테고리관리', '삭제');
          gridRows.splice(idx, 1);
        } catch (err) { console.error('[deleteRows]', err); }
      }
      showToast?.('삭제되었습니다.', 'success');
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const changed = gridRows.filter(r => r._row_status === 'N' || r._row_status === 'U');
      if (!changed.length) { showToast?.('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.categoryNm) { showToast?.('카테고리명은 필수입니다.', 'error'); return; }
      }
      const ok = await showConfirm?.('저장', `${changed.length}건을 저장하시겠습니까?`);
      if (!ok) { return; }
      for (const row of changed) {
        const isNew = row._row_status === 'N';
        const payload = { ...row };
        delete payload._depth; delete payload._row_status; delete payload._row_check; delete payload._row_org; delete payload._children;
        if (isNew) { delete payload.categoryId; }
        try {
          const res = isNew
            ? await boApiSvc.pdCategory.create(payload, '카테고리관리', '저장')
            : await boApiSvc.pdCategory.update(row.categoryId, payload, '카테고리관리', '저장');
          row._row_status = null;
        } catch (err) {
          console.error('[handleSave]', err);
          const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
          return;
        }
      }
      showToast?.('저장되었습니다.', 'success');
      await handleSearchList();   // 트리 갱신
      await handleGridSearch();   // 그리드 갱신
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---

    const columns = {};
    columns.baseSearch = [
      { key: 'siteId', label: '사이트 *', type: 'select', nullable: false,
        options: () => sites.map(s => ({ value: s.siteId, label: s.siteId + ' ' + s.siteNm })),
        onChange: () => handleSelectAction('searchParam-siteChange') },
      { key: 'searchValue', label: '카테고리명', type: 'text', placeholder: '카테고리명 검색' },
      { key: 'categoryDepth', label: '단계', type: 'select', options: () => codes.category_depths, nullLabel: '전체' },
      { key: 'categoryStatusCd', label: '상태', type: 'select', options: () => codes.category_statuses, nullLabel: '전체' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      codes, uiState, sites, searchParam, gridRows, categoriesGridPager, catPickerModal,           // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfCatPickerList,                                                               // computed
      fnDepthColor, fnDepthBullet, parentNm, fnStatusClass, getRealIdx, fnCategoryDescCount,  // 헬퍼
      focusedIdx, checkAll, dragoverRowIdx,                                          // ref
    };
  },

  template: `
<bo-page title="카테고리관리"
    desc-summary="카테고리관리는 상품 분류를 위한 3단계 계층(대/중/소) 카테고리를 관리합니다."
    desc-detail="✔ 대·중·소 3단계로 카테고리 트리를 구성합니다.&#10;✔ 정렬순서·표시여부를 설정하고 상품과 연결합니다.&#10;✔ 카테고리 삭제 시 하위 카테고리와 연결 상품을 함께 확인합니다.&#10;예) 의류 > 상의 > 티셔츠, 전자기기 > 스마트폰">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div class="bo-2col">
    <!-- ===== ■.■. 좌측: 카테고리 트리 =========================================== -->
    <bo-container title="📁 카테고리">
      <template #toolbar-actions>
        <div v-if="uiState.selectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="handleBtnAction('categoryTree-clear')">
          전체보기
        </div>
      </template>
      <bo-category-tree mode="tree" :site-id="searchParam.siteId" :selected="uiState.selectedCatId" :show-count="fnCategoryDescCount" @select="id => handleSelectAction('categoryTree-select', id)" />
    </bo-container>
    <!-- ===== □.□. 좌측: 카테고리 트리 =========================================== -->
    <!-- ===== ■.■. 우측: 카테고리 그리드 ========================================== -->
    <bo-container>
      <template #title>
        카테고리 목록
        <span v-if="uiState.selectedCatId" style="font-size:12px;color:#1677ff;margin-left:6px">
          — {{ parentNm(uiState.selectedCatId) }} 하위
        </span>
        <span class="list-count">
          {{ gridRows.filter(r => r._row_status !== 'D').length }}건
        </span>
      </template>
      <template #toolbar-actions>
        <button class="btn btn_new" @click="handleBtnAction('categories-add')">
          + 행추가
        </button>
        <button class="btn btn-danger btn-sm" @click="handleBtnAction('categories-deleteChecked')">
          행삭제
        </button>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('categories-cancelChecked')">
          취소
        </button>
        <button class="btn btn_save" @click="handleBtnAction('categories-save')">
          저장
        </button>
      </template>
      <!-- ===== ■.■.■. 테이블 ================================================= -->
      <table class="bo-table crud-grid" style="table-layout:fixed">
        <colgroup>
          <col style="width:36px">
          <!-- ===== ■.■.■.■.■. 번호 ============================================== -->
          <col style="width:28px">
          <!-- ===== ■.■.■.■.■. 드래그 핸들 ========================================== -->
          <col style="width:36px">
          <!-- ===== ■.■.■.■.■. 상태 ============================================== -->
          <col style="width:32px">
          <!-- ===== ■.■.■.■.■. 체크 ============================================== -->
          <col style="min-width:140px">
          <!-- ===== ■.■.■.■.■. 카테고리명 =========================================== -->
          <col style="min-width:120px">
          <!-- ===== ■.■.■.■.■. 상위 ============================================== -->
          <col style="width:64px">
          <!-- ===== ■.■.■.■.■. 순서 ============================================== -->
          <col>
          <!-- ===== ■.■.■.■.■. 설명 ============================================== -->
          <col style="width:70px">
          <!-- ===== ■.■.■.■.■. 상태 ============================================== -->
          <col style="width:32px">
          <!-- ===== ■.■.■.■.■. 하위추가 ============================================ -->
          <col style="width:44px">
          <!-- ===== ■.■.■.■.■. 취소 ============================================== -->
          <col style="width:44px">
          <!-- ===== ■.■.■.■.■. 삭제 ============================================== -->
        </colgroup>
        <thead>
          <tr>
            <th style="width:36px;text-align:center;">
              번호
            </th>
            <th>
            </th>
            <th>
              상태
            </th>
            <th>
              <input type="checkbox" v-model="checkAll" @change="handleSelectAction('categories-rowCheckAll')">
            </th>
            <th>
              카테고리명
            </th>
            <th>
              상위카테고리
            </th>
            <th style="text-align:center">
              순서
            </th>
            <th>
              설명
            </th>
            <th style="text-align:center">
              활성
            </th>
            <th>
            </th>
            <th>
            </th>
            <th>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!gridRows.length">
            <td colspan="12" style="text-align:center;color:#aaa;padding:30px">
              {{ uiState.selectedCatId ? '하위 카테고리가 없습니다. [+ 행추가]로 추가하세요.' : '데이터가 없습니다.' }}
            </td>
          </tr>
          <tr v-else v-for="(row, idx) in categoriesGridPager.pageList" :key="(row && row.categoryId)" :class="[uiState.focusedIdx===getRealIdx(idx) ? 'focused' : '', 'status-'+row._row_status]" draggable="true" @dragstart="handleSelectAction('categories-rowDragStart', getRealIdx(idx))" @dragover.prevent="handleSelectAction('categories-rowDragOver', getRealIdx(idx))" @drop="handleSelectAction('categories-rowDrop')" :style="dragoverRowIdx===getRealIdx(idx) ? 'background:#e6f4ff' : ''" @click="handleSelectAction('categories-rowFocus', getRealIdx(idx))">
          <!-- ===== ■.■.■.■.■.■. 번호 ============================================ -->
          <td style="text-align:center;font-size:11px;color:#999;">
            {{ getRealIdx(idx) + 1 }}
          </td>
          <!-- ===== ■.■.■.■.■.■. 드래그 핸들 ======================================== -->
          <td style="text-align:center;cursor:grab;color:#ccc;font-size:16px;user-select:none">
            ≡
          </td>
          <!-- ===== ■.■.■.■.■.■. 행 상태 뱃지 ======================================= -->
          <td style="text-align:center">
            <span class="badge badge-xs" :class="fnStatusClass(row._row_status)">
              {{ row._row_status }}
            </span>
          </td>
          <!-- ===== ■.■.■.■.■.■. 체크박스 ========================================== -->
          <td style="text-align:center">
            <input type="checkbox" v-model="row._row_check" @click.stop>
          </td>
          <!-- ===== ■.■.■.■.■.■. 카테고리명 (들여쓰기 트리 표현) ============================ -->
          <td style="padding:3px 6px">
            <div style="display:flex;align-items:center">
              <span :style="{ marginLeft:(row._depth*12)+'px', marginRight:'5px', fontWeight:700,
                  fontSize: row._depth===0?'8px':'11px', flexShrink:0, color:fnDepthColor(row._depth) }">
                {{ fnDepthBullet(row._depth) }}
              </span>
              <input class="grid-input" v-model="row.categoryNm" :disabled="row._row_status==='D'"
                  @input="handleSelectAction('categories-rowCellChange', row)" style="flex:1" placeholder="카테고리명">
            </div>
          </td>
          <!-- ===== ■.■.■.■.■.■. 상위카테고리 ======================================== -->
          <td style="padding:3px 8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                  :style="row.parentCategoryId ? 'color:#444' : 'color:#bbb;font-style:italic'">
                {{ row.parentCategoryId ? parentNm(row.parentCategoryId) : '최상위' }}
              </span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                  style="flex-shrink:0;padding:1px 6px;font-size:11px;color:#e8587a"
                  @click.stop="handleSelectAction('parentModal-open', row)" title="상위 선택">
                🔍
              </button>
            </div>
          </td>
          <!-- ===== ■.■.■.■.■.■. 순서 ============================================ -->
          <td style="padding:3px 4px">
            <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
                :disabled="row._row_status==='D'" @input="handleSelectAction('categories-rowCellChange', row)" style="text-align:center">
          </td>
          <!-- ===== ■.■.■.■.■.■. 설명 ============================================ -->
          <td style="padding:3px 6px">
            <input class="grid-input" v-model="row.categoryDesc"
                :disabled="row._row_status==='D'" @input="handleSelectAction('categories-rowCellChange', row)" placeholder="설명">
          </td>
          <!-- ===== ■.■.■.■.■.■. 활성 ============================================ -->
          <td style="padding:3px 4px;text-align:center">
            <select class="grid-select" v-model="row.categoryStatusCd"
                :disabled="row._row_status==='D'" @change="handleSelectAction('categories-rowCellChange', row)" style="width:58px">
              <option v-for="c in codes.category_statuses" :key="c.codeValue" :value="c.codeValue">
                {{ c.codeLabel }}
              </option>
            </select>
          </td>
          <!-- ===== ■.■.■.■.■.■. 하위 추가 ========================================= -->
          <td style="text-align:center;padding:2px">
            <button v-if="row._row_status!=='D' && row.categoryId>0" class="btn btn_new" style="padding:1px 5px;font-size:11px;background:#f0f7ff;color:#1677ff;border:1px solid #91caff" title="하위 카테고리 추가" @click.stop="handleSelectAction('categories-rowAddChild', { row, idx: getRealIdx(idx) })">
            +하위
          </button>
        </td>
        <!-- ===== ■.■.■.■.■.■. 취소 ============================================ -->
        <td style="text-align:center;padding:2px">
          <button v-if="['U','I','D'].includes(row._row_status)"
                class="btn btn_cancel" @click.stop="handleSelectAction('categories-rowCancel', getRealIdx(idx))">
            취소
          </button>
        </td>
        <!-- ===== ■.■.■.■.■.■. 삭제 ============================================ -->
        <td style="text-align:center;padding:2px">
          <button v-if="row._row_status !== 'D'"
                class="btn btn_row_delete" @click.stop="handleSelectAction('categories-rowDelete', getRealIdx(idx))">
            삭제
          </button>
        </td>
      </tr>
    </tbody>
  </table>
      <!-- ===== ■.■.■. 페이지네이션 ============================================== -->
      <bo-pager :pager="categoriesGridPager" :on-set-page="n => handleBtnAction('categories-pager-setPage', n)" :on-size-change="() => handleSelectAction('categories-pager-sizeChange')" />
    </bo-container>
  </div>
<!-- ===== □.□. 우측: 카테고리 그리드 ========================================== -->
<!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
<!-- ===== ■. 상위카테고리 선택 모달 ============================================ -->
<bo-modal :show="catPickerModal.show" title="상위 카테고리 선택" width="460px" max-height="70vh"
    @close="handleBtnAction('parentModal-close')">
  <input class="form-control" v-model="catPickerModal.search" placeholder="카테고리명 검색" style="margin-bottom:10px">
  <div style="overflow-y:auto;border:1px solid #eee;border-radius:8px;max-height:48vh">
    <div style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;color:#1677ff"
        @click="handleSelectAction('parentModal-select', null)">
      최상위 (상위없음)
    </div>
    <div v-for="c in cfCatPickerList" :key="(c && c.categoryId)" style="padding:7px 12px;font-size:13px;border-bottom:1px solid #f9f9f9;display:flex;align-items:center;gap:6px" :style="{ paddingLeft: (c.categoryDepth * 14 + 12) + 'px' }" @mouseenter="$event.target.style.background='#f5f5f5'" @mouseleave="$event.target.style.background=''" @click="handleSelectAction('parentModal-select', c)">
      <span :style="{ fontSize:'11px', fontWeight:700, color:fnDepthColor((c.categoryDepth||1)-1) }">
        {{ fnDepthBullet((c.categoryDepth||1)-1) }}
      </span>
      <span>
        {{ c.categoryNm }}
      </span>
      <span style="font-size:11px;color:#aaa;margin-left:auto">
        depth {{ c.categoryDepth }}
      </span>
    </div>
    <div v-if="!cfCatPickerList.length" style="text-align:center;padding:20px;color:#aaa">
      검색 결과 없음
    </div>
  </div>
</bo-modal>
</bo-page>
<!-- ===== □. 상위카테고리 선택 모달 ============================================ -->
`
};

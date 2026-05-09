/* ShopJoy Admin - 카테고리관리 */
window.PdCategoryMng = {
  name: 'PdCategoryMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const categories = reactive([]);
    const sites = computed(() => window._boCmSites || []);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedCatId: null, focusedIdx: null, descOpen: false});
    const codes = reactive({
      category_depths: [],
      product_statuses: [],
      category_statuses: [],
    });

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
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    /* -- 검색 파라미터 -- (siteId는 필수, 기본값 우선순위: boCommonFilter > boAppStore.svBoSiteId > _boCmSites[0] > '2604010000000001') */
    const _initSearchParam = () => ({
      siteId: (window.boCommonFilter && window.boCommonFilter.siteId)
              || window.sfGetBoAppStore?.()?.svBoSiteId
              || (window._boCmSites?.[0]?.siteId)
              || '2604010000000001', categoryDepth: '', categoryStatusCd: ''
    });
    const searchParam = reactive(_initSearchParam());

    /* 좌측 트리용 전체 카테고리 조회 (그리드/트리 캐시 갱신) */
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

    /* 우측 그리드 조회 — 선택 카테고리의 직계 자식을 API로 조회 */
    const handleGridSearch = async () => {
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(uiState.selectedCatId ? { parentCategoryId: uiState.selectedCatId } : {}),
        };
        const res = await boApiSvc.pdCategory.getPage(params, '카테고리관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0);
        buildTreeRows(list).forEach(c => gridRows.push(makeRow(c)));
        pager.pageNo          = 1;
        pager.pageTotalCount  = gridRows.length;
        pager.pageTotalPage   = Math.max(1, Math.ceil(gridRows.length / pager.pageSize));
        fnBuildPagerNums();
      } catch (e) {
        console.error('[handleGridSearch]', e);
      }
    };

    /* 사이트 변경 시: 선택된 카테고리 해제 + 트리/그리드 재조회 */
    const onSiteChange = async () => {
      uiState.selectedCatId = null;
      // boCommonFilter 동기화 (다른 화면 이동 시 일관성 유지)
      if (window.boCommonFilter) window.boCommonFilter.siteId = searchParam.siteId;
      await handleSearchList();
      await handleGridSearch();
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchList();
      await handleGridSearch();
    });

    /* -- 선택된 카테고리 (좌측 트리 클릭) -- */
    const selectNode = id => {
      if (id === null) { uiState.selectedCatId = null; return; }
      uiState.selectedCatId = (uiState.selectedCatId === id) ? null : id;
    };

    watch(() => uiState.selectedCatId, () => handleGridSearch());


    /* -- 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const EDIT_FIELDS = ['categoryNm', 'parentCategoryId', 'sortOrd', 'categoryDesc', 'categoryStatusCd'];

    /* 그리드 트리 평탄화 */
    const buildTreeRows = (items) => {
      const map = {};
      window.safeArrayUtils.safeForEach(items, c => { map[c.categoryId] = { ...c, _children: [] }; });
      const roots = [];
      window.safeArrayUtils.safeForEach(items, c => {
        if (c.parentCategoryId && map[c.parentCategoryId]) map[c.parentCategoryId]._children.push(map[c.categoryId]);
        else roots.push(map[c.categoryId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = c => ({
      ...c, _depth: c._depth || 0, _row_status: null, _row_check: false,
      _row_org: { categoryNm: c.categoryNm, parentCategoryId: c.parentCategoryId, sortOrd: c.sortOrd, categoryDesc: c.categoryDesc, categoryStatusCd: c.categoryStatusCd },
    });


    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); pager.pageList=gridRows.slice((c-1)*pager.pageSize,c*pager.pageSize); };
    const setPage       = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; fnBuildPagerNums(); } };
    const onSizeChange  = () => { pager.pageNo = 1; pager.pageTotalCount = gridRows.length; pager.pageTotalPage = Math.max(1, Math.ceil(gridRows.length / pager.pageSize)); fnBuildPagerNums(); };
    const getRealIdx    = localIdx => (pager.pageNo - 1) * pager.pageSize + localIdx;

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleGridSearch();
    };

    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.selectedCatId = null;
      await handleSearchList();
      await handleGridSearch();
    };
    const catPickerModal = reactive({ show: false, search: '', forCategoryId: null, forRowIdx: null });
    const cfCatPickerList = computed(() => {
      const kw = (catPickerModal.search || '').toLowerCase();
      return (categories || []).filter(c => !kw || (c.categoryNm || '').toLowerCase().includes(kw));
    });
    const onParentSelect = (c) => {
      const idx = catPickerModal.forRowIdx;
      if (idx != null && gridRows[idx]) {
        gridRows[idx].parentCategoryId = c ? c.categoryId : null;
        if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U';
      }
      catPickerModal.show = false;
    };
    const openParentModal = async (row) => {
      catPickerModal.forRowIdx = gridRows.indexOf(row);
      catPickerModal.search = '';
      catPickerModal.show = true;
      await handleSearchList(); // 팝업 오픈 시 최신 카테고리 목록 재조회
    };
    const fnDepthColor = (d) => ({0:'#e8587a',1:'#1677ff',2:'#3ba87a'}[d] || '#999');
    const fnDepthBullet = (d) => ['●','○','▪'][d] || '·';
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const parentNm = (id) => (categories || []).find(c => c.categoryId === id)?.categoryNm || id;

    const onCellChange = (row) => { if (row._row_status !== 'N') row._row_status = 'U'; };

    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const dragRowIdx = ref(null);
    const dragoverRowIdx = ref(null);
    const onRowDragStart = (idx) => { dragRowIdx.value = idx; };
    const onRowDragOver = (idx) => { dragoverRowIdx.value = idx; };
    const onRowDrop = () => {
      const from = dragRowIdx.value, to = dragoverRowIdx.value;
      dragRowIdx.value = null; dragoverRowIdx.value = null;
      if (from == null || to == null || from === to) return;
      const [moved] = gridRows.splice(from, 1);
      gridRows.splice(to, 0, moved);
      // 같은 부모 그룹 내 sortOrd 재계산
      const parentId = moved.parentCategoryId || null;
      let ord = 1;
      gridRows.forEach(r => {
        if ((r.parentCategoryId || null) === parentId) {
          r.sortOrd = ord++;
          if (r._row_status == null) r._row_status = 'U';
        }
      });
    };

    /* -- 행 편집 -- */
    const focusedIdx = ref(-1);
    const setFocused = (idx) => { focusedIdx.value = idx; };
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
      pager.pageNo = 1;
    };
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
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (!row) return;
      if (row._row_status === 'N') {
        gridRows.splice(idx, 1);
      } else if (row._row_org) {
        Object.assign(row, row._row_org);
        row._row_status = null;
      }
    };
    const cancelChecked = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (gridRows[i]._row_check) cancelRow(i);
      }
    };
    const deleteRow = async (idx) => {
      const row = gridRows[idx];
      if (!row) return;
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await showConfirm?.('삭제', `[${row.categoryNm}] 카테고리를 삭제하시겠습니까?`);
      if (!ok) return;
      row._row_status = 'D';
      try {
        const res = await boApiSvc.pdCategory.remove(row.categoryId, '카테고리관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
        gridRows.splice(idx, 1);
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };
    const deleteRows = async () => {
      const idxs = [];
      gridRows.forEach((r, i) => { if (r._row_check) idxs.push(i); });
      if (!idxs.length) { showToast?.('삭제할 행을 선택하세요.', 'info'); return; }
      const ok = await showConfirm?.('삭제', `선택한 ${idxs.length}건을 삭제하시겠습니까?`);
      if (!ok) return;
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
    const handleSave = async () => {
      const changed = gridRows.filter(r => r._row_status === 'N' || r._row_status === 'U');
      if (!changed.length) { showToast?.('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.categoryNm) { showToast?.('카테고리명은 필수입니다.', 'error'); return; }
      }
      const ok = await showConfirm?.('저장', `${changed.length}건을 저장하시겠습니까?`);
      if (!ok) return;
      for (const row of changed) {
        const isNew = row._row_status === 'N';
        const payload = { ...row };
        delete payload._depth; delete payload._row_status; delete payload._row_check; delete payload._row_org; delete payload._children;
        if (isNew) delete payload.categoryId;
        try {
          const res = isNew
            ? await boApiSvc.pdCategory.create(payload, '카테고리관리', '저장')
            : await boApiSvc.pdCategory.update(row.categoryId, payload, '카테고리관리', '저장');
          if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
          row._row_status = null;
        } catch (err) {
          console.error('[handleSave]', err);
          const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
          if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (showToast) showToast(errMsg, 'error', 0);
          return;
        }
      }
      showToast?.('저장되었습니다.', 'success');
      await handleSearchList();   // 트리 갱신
      await handleGridSearch();   // 그리드 갱신
    };

    // -- return ---------------------------------------------------------------

    return {
      codes, uiState, sites, onSiteChange,
      selectNode, handleGridSearch,
      searchParam,
      gridRows, pager, setPage, onSizeChange, getRealIdx,
      onSearch, onReset,
      catPickerModal, cfCatPickerList, onParentSelect, openParentModal, fnDepthColor, fnDepthBullet, parentNm,
      focusedIdx, setFocused, addRow, addChildRow, cancelRow, cancelChecked, deleteRow, deleteRows, handleSave,
      fnStatusClass, onCellChange,
      checkAll, toggleCheckAll,
      dragoverRowIdx, onRowDragStart, onRowDragOver, onRowDrop,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">카테고리관리</strong>는 상품 분류를 위한 3단계 계층(대/중/소) 카테고리를 관리합니다.</span>
    <button @click="uiState.descOpen=!uiState.descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 대·중·소 3단계로 카테고리 트리를 구성합니다.<br>
      ✔ 정렬순서·표시여부를 설정하고 상품과 연결합니다.<br>
      ✔ 카테고리 삭제 시 하위 카테고리와 연결 상품을 함께 확인합니다.<br>
      <span style="color:#888;font-size:12px">예) 의류 &gt; 상의 &gt; 티셔츠, 전자기기 &gt; 스마트폰</span>
    </div>
  </div>

  <!-- -- 검색 ------------------------------------------------------------- -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">사이트 <span style="color:#e8587a">*</span></label>
      <select class="form-control" v-model="searchParam.siteId" @change="onSiteChange" style="width:160px">
        <option v-for="s in sites" :key="s.siteId" :value="s.siteId">{{ s.siteId }} {{ s.siteNm }}</option>
      </select>
      <label class="search-label">카테고리명</label>
      <input class="form-control" v-model="searchParam.searchValue" placeholder="카테고리명 검색" style="max-width:240px" @keyup.enter="() => onSearch?.()">
      <label class="search-label">단계</label>
      <select class="form-control" v-model="searchParam.categoryDepth" style="width:120px">
        <option value="">전체</option>
        <option v-for="c in codes.category_depths" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <label class="search-label">상태</label>
      <select class="form-control" v-model="searchParam.categoryStatusCd" style="width:100px">
        <option value="">전체</option>
        <option v-for="c in codes.category_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- -- 좌 트리 + 우 그리드 --------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- -- 좌측: 카테고리 트리 -------------------------------------------------- -->
    <div class="card" style="padding:12px;position:sticky;top:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="uiState.selectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="selectNode(null)">전체보기</div>
      </div>
      <category-tree mode="tree" :site-id="searchParam.siteId" :selected="uiState.selectedCatId" @select="selectNode" />
    </div>

    <!-- -- 우측: 카테고리 그리드 ------------------------------------------------- -->
    <div class="card">
      <div class="toolbar">
        <span class="list-title">
          카테고리 목록
          <span v-if="uiState.selectedCatId" style="font-size:12px;color:#1677ff;margin-left:6px">
            — {{ [].find(c=>c.categoryId===uiState.selectedCatId)&&[].find(c=>c.categoryId===uiState.selectedCatId).categoryNm }} 하위
          </span>
          <span class="list-count">{{ gridRows.filter(r => r._row_status !== 'D').length }}건</span>
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
          <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
          <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
        </div>
      </div>

      <table class="bo-table" style="table-layout:fixed">
        <colgroup>
          <col style="width:36px"><!-- -- 번호 -->
          <col style="width:28px"><!-- -- 드래그 핸들 ----------------------------------------------------------- -->
          <col style="width:36px"><!-- -- 상태 --------------------------------------------------------------- -->
          <col style="width:32px"><!-- -- 체크 --------------------------------------------------------------- -->
          <col style="min-width:140px"><!-- -- 카테고리명 ------------------------------------------------------------ -->
          <col style="min-width:120px"><!-- -- 상위 --------------------------------------------------------------- -->
          <col style="width:64px"><!-- -- 순서 --------------------------------------------------------------- -->
          <col><!-- -- 설명 --------------------------------------------------------------- -->
          <col style="width:70px"><!-- -- 상태 --------------------------------------------------------------- -->
          <col style="width:32px"><!-- -- 하위추가 ------------------------------------------------------------- -->
          <col style="width:44px"><!-- -- 취소 --------------------------------------------------------------- -->
          <col style="width:44px"><!-- -- 삭제 --------------------------------------------------------------- -->
        </colgroup>
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th></th>
          <th>상태</th>
          <th><input type="checkbox" v-model="checkAll" @change="toggleCheckAll"></th>
          <th>카테고리명</th>
          <th>상위카테고리</th>
          <th style="text-align:center">순서</th>
          <th>설명</th>
          <th style="text-align:center">활성</th>
          <th></th>
          <th></th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr v-if="!gridRows.length">
            <td colspan="12" style="text-align:center;color:#aaa;padding:30px">
              {{ uiState.selectedCatId ? '하위 카테고리가 없습니다. [+ 행추가]로 추가하세요.' : '데이터가 없습니다.' }}
            </td>
          </tr>
          <tr v-else v-for="(row, idx) in pager.pageList" :key="(row && row.categoryId)"
              :class="[uiState.focusedIdx===getRealIdx(idx) ? 'focused' : '', 'status-'+row._row_status]"
              draggable="true"
              @dragstart="onRowDragStart(getRealIdx(idx))"
              @dragover.prevent="onRowDragOver(getRealIdx(idx))"
              @drop="onRowDrop()"
              :style="dragoverRowIdx===getRealIdx(idx) ? 'background:#e6f4ff' : ''"
              @click="setFocused(getRealIdx(idx))">

            <!-- -- 번호 ----------------------------------------------------- -->
            <td style="text-align:center;font-size:11px;color:#999;">{{ getRealIdx(idx) + 1 }}</td>

            <!-- -- 드래그 핸들 ----------------------------------------------- -->
            <td style="text-align:center;cursor:grab;color:#ccc;font-size:16px;user-select:none">≡</td>

            <!-- -- 행 상태 뱃지 ---------------------------------------------- -->
            <td style="text-align:center">
              <span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span>
            </td>

            <!-- -- 체크박스 ------------------------------------------------- -->
            <td style="text-align:center"><input type="checkbox" v-model="row._row_check" @click.stop></td>

            <!-- -- 카테고리명 (들여쓰기 트리 표현) ----------------------------------- -->
            <td style="padding:3px 6px">
              <div style="display:flex;align-items:center">
                <span :style="{ marginLeft:(row._depth*12)+'px', marginRight:'5px', fontWeight:700,
                                fontSize: row._depth===0?'8px':'11px', flexShrink:0, color:fnDepthColor(row._depth) }">
                  {{ fnDepthBullet(row._depth) }}
                </span>
                <input class="grid-input" v-model="row.categoryNm" :disabled="row._row_status==='D'"
                       @input="onCellChange(row)" style="flex:1" placeholder="카테고리명">
              </div>
            </td>

            <!-- -- 상위카테고리 ----------------------------------------------- -->
            <td style="padding:3px 8px">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      :style="row.parentCategoryId ? 'color:#444' : 'color:#bbb;font-style:italic'">
                  {{ row.parentCategoryId ? parentNm(row.parentCategoryId) : '최상위' }}
                </span>
                <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                        style="flex-shrink:0;padding:1px 6px;font-size:11px;color:#e8587a"
                        @click.stop="openParentModal(row)" title="상위 선택">🔍</button>
              </div>
            </td>

            <!-- -- 순서 --------------------------------------------------- -->
            <td style="padding:3px 4px">
              <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" style="text-align:center">
            </td>

            <!-- -- 설명 --------------------------------------------------- -->
            <td style="padding:3px 6px">
              <input class="grid-input" v-model="row.categoryDesc"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="설명">
            </td>

            <!-- -- 활성 --------------------------------------------------- -->
            <td style="padding:3px 4px;text-align:center">
              <select class="grid-select" v-model="row.categoryStatusCd"
                      :disabled="row._row_status==='D'" @change="onCellChange(row)" style="width:58px">
                <option v-for="c in codes.category_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
            </td>

            <!-- -- 하위 추가 ------------------------------------------------ -->
            <td style="text-align:center;padding:2px">
              <button v-if="row._row_status!=='D' && row.categoryId>0"
                      class="btn btn-xs" style="padding:1px 5px;font-size:11px;background:#f0f7ff;color:#1677ff;border:1px solid #91caff"
                      title="하위 카테고리 추가" @click.stop="addChildRow(row, getRealIdx(idx))">+하위</button>
            </td>

            <!-- -- 취소 --------------------------------------------------- -->
            <td style="text-align:center;padding:2px">
              <button v-if="['U','I','D'].includes(row._row_status)"
                      class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
            </td>

            <!-- -- 삭제 --------------------------------------------------- -->
            <td style="text-align:center;padding:2px">
              <button v-if="row._row_status !== 'D'"
                      class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- -- 페이지네이션 ----------------------------------------------------- -->
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
    </div>
  </div>

  <!-- -- 상위카테고리 선택 모달 --------------------------------------------------- -->
  <teleport to="body" v-if="catPickerModal.show">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="catPickerModal.show=false">
      <div style="background:#fff;border-radius:14px;padding:22px;width:460px;max-height:70vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">상위 카테고리 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="catPickerModal.show=false">닫기</button>
        </div>
        <input class="form-control" v-model="catPickerModal.search" placeholder="카테고리명 검색" style="margin-bottom:10px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <div style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff"
               @click="onParentSelect(null)">최상위 (상위없음)</div>
          <div v-for="c in cfCatPickerList" :key="(c && c.categoryId)"
               style="padding:7px 12px;font-size:13px;border-bottom:1px solid #f9f9f9;cursor:pointer;display:flex;align-items:center;gap:6px"
               :style="{ paddingLeft: (c.categoryDepth * 14 + 12) + 'px' }"
               @mouseenter="$event.target.style.background='#f5f5f5'" @mouseleave="$event.target.style.background=''"
               @click="onParentSelect(c)">
            <span :style="{ fontSize:'11px', fontWeight:700, color:fnDepthColor((c.categoryDepth||1)-1) }">{{ fnDepthBullet((c.categoryDepth||1)-1) }}</span>
            <span>{{ c.categoryNm }}</span>
            <span style="font-size:11px;color:#aaa;margin-left:auto">depth {{ c.categoryDepth }}</span>
          </div>
          <div v-if="!cfCatPickerList.length" style="text-align:center;padding:20px;color:#aaa">검색 결과 없음</div>
        </div>
      </div>
    </div>
  </teleport>
</div>`
};

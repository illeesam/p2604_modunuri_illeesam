/* ShopJoy Admin - 템플릿관리 목록 */
window.SyTemplateMng = {
  name: 'SyTemplateMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const templates = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ template_type: [], use_yn: [], template_types: ['메일템플릿','문자템플릿','MMS템플릿','kakao톡템플릿','kakao알림톡템플릿','시스템알림','회원알림'], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'templateNm asc', desc: 'templateNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 템플릿 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 템플릿 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 템플릿 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'templateNm,templateSubject';
        }
        const res = await boApiSvc.syTemplate.getPage(params, '템플릿관리', '목록조회');
        const data = res.data?.data;
        templates.splice(0, templates.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || templates.length;
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
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null });

    /* 템플릿 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 템플릿 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 템플릿 onPathPicked */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };

    /* 템플릿 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };


    /* 템플릿 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.template_type = codeStore.sgGetGrpCodes('TEMPLATE_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

  /* 템플릿 _initSearchParam */
  const _initSearchParam = () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    return { searchType: '', searchValue: '', type: '', useYn: 'Y', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
  };
  const searchParam = reactive(_initSearchParam());

    /* 템플릿 onDateRangeChange */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 템플릿 loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 템플릿 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 템플릿 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 템플릿 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 템플릿 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syTemplateMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 미리보기 모달 */
    const previewModal = reactive({ show: false, template: null });

    /* 템플릿 showPreview */
    const showPreview = (t) => { previewModal.template = t; previewModal.show = true; };

    /* 템플릿 closePreview */
    const closePreview = () => { previewModal.show = false; };

    /* 발송하기 모달 */
    const sendModal = reactive({ show: false, template: null });

    /* 템플릿 openSend */
    const openSend  = (t) => { sendModal.template = t; sendModal.show = true; };

    /* 템플릿 closeSend */
    const closeSend = () => { sendModal.show = false; };


    /* 템플릿 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 템플릿 fnTypeBadge */
    const fnTypeBadge = t => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[t] || 'badge-gray');

    /* 템플릿 fnUseYnBadge */
    const fnUseYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* 템플릿 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 템플릿 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 템플릿 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 템플릿 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 템플릿 삭제 */
    const handleDelete = async (t) => {
      const ok = await showConfirm('삭제', `[${t.templateNm}] 템플릿을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = templates.findIndex(x => x.templateId === t.templateId);
      if (idx !== -1) templates.splice(idx, 1);
      if (uiStateDetail.selectedId === t.templateId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.syTemplate.remove(t.templateId, '템플릿관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 템플릿 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(templates, [{label:'ID',key:'templateId'},{label:'템플릿명',key:'templateNm'},{label:'유형',key:'templateTypeCd'},{label:'사용여부',key:'useYn'},{label:'등록일',key:'regDate'}], '템플릿목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */




    const gridColumns = [
      { key: 'pathId',         label: '표시경로',
        pathLabelOpen: { label: pathLabel, open: openPathPick, placeholder: '경로 선택...' } },
      { key: 'templateId',     label: 'ID' },
      { key: 'templateTypeCd', label: '템플릿유형', badge: (row) => fnTypeBadge(row.templateTypeCd) },
      { key: 'templateCode',   label: '템플릿코드',
        cellInnerStyle: 'background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:11px;color:#555;font-family:monospace;' },
      { key: 'templateNm',     label: '템플릿명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'templateSubject', label: '제목(Subject)', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: 'useYn',          label: '사용여부', badge: (row) => fnUseYnBadge(row.useYn), fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',        label: '등록일', sortKey: 'reg' },
      { key: 'siteNm',         label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];
    const fnRowStyle = (t) => uiStateDetail.selectedId === t.templateId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), templates, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode, searchParam, onDateRangeChange, cfSiteNm, pager, onSearch, onReset, setPage, onSizeChange, fnTypeBadge, fnUseYnBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewModal, showPreview, closePreview, sendModal, openSend, closeSend, exportExcel, onSort, sortIcon,
      gridColumns, fnRowStyle };
  },
  template: /* html */`
<div>
  <div class="page-title">템플릿관리</div>  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'templateNm',      label: '템플릿명' },
          { value: 'templateSubject', label: '제목' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in codes.template_types" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option><option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
    </bo-search-area>
  </div>




  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_template" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <div>
      <bo-grid-readonly
        :columns="gridColumns" :rows="templates" :pager="pager" row-key="templateId"
        list-title="템플릿목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="row => handleLoadDetail(row.templateId)">

        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </template>
        <template #head-actions><th style="text-align:right">관리</th></template>

        <template #row-actions="{ row }">
          <td><div class="actions">
            <button class="btn btn-secondary btn-sm" @click="showPreview(row)">미리보기</button>
            <button class="btn btn-sm" style="background:#52c41a;color:#fff;border-color:#52c41a;" @click="openSend(row)">발송</button>
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.templateId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
          </div></td>
        </template>
      </bo-grid-readonly>

  <!-- -- 미리보기/발송 모달 (position:fixed) ---------------------------------- -->
  <template-preview-modal v-if="previewModal && previewModal.show"
    :tmpl="previewModal.template"
    :sample-params="previewModal.template?.sampleParams || '{}'"
    @close="closePreview" />
  <template-send-modal v-if="sendModal && sendModal.show"
    :tmpl="sendModal.template" :show-toast="showToast" :show-confirm="showConfirm"
    @close="closeSend" />
</div>

  <!-- -- 수정 패널 (grid 직접 자식 → 전체 폭) --------------------------------- -->
  <div v-if="selectedId" style="grid-column:1/-1;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-template-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'" 
      
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
    />
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_template"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

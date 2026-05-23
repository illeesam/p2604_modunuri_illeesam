/* ShopJoy Admin - 사이트관리 목록 */
window.SySiteMng = {
  name: 'SySiteMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const sites = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ site_oper_statuses: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'siteNm asc', desc: 'siteNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 사이트 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 사이트 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 사이트 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'siteCode,siteNm,siteDomain';
        }
        const res = await boApiSvc.sySite.getPage(params, '사이트관리', '목록조회');
        const data = res.data?.data;
        sites.splice(0, sites.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || sites.length;
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

    /* 사이트 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 사이트 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 사이트 onPathPicked */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };

    /* 사이트 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };

    /* 사이트 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

  /* 사이트 _initSearchParam */
  const _initSearchParam = () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
  };
  const searchParam = reactive(_initSearchParam());

    /* 사이트 onDateRangeChange */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view', // 'view' | 'edit'
      reloadTrigger: 0 // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* 사이트 loadView */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 사이트 상세조회 */
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 사이트 openNew */
    const openNew    = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; };

    /* 사이트 closeDetail */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* 사이트 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'sySiteMng') {
        detailModal.show = false;
        detailModal.dtlId = null;
        if (opts.reload) handleSearchList('RELOAD');
        return;
      }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const cfTypeOptions = computed(() => [...new Set(sites.map(s => s.siteTypeCd))].sort());

    /* 사이트 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 사이트 fnStatusBadge */
    const fnStatusBadge = s => ({ '운영중': 'badge-green', '점검중': 'badge-orange', '비활성': 'badge-gray' }[s] || 'badge-gray');

    /* 사이트 fnTypeBadge */
    const fnTypeBadge   = t => ({
      '이커머스': 'badge-red', '숙박공유': 'badge-blue', '전문가연결': 'badge-purple',
      'IT매칭': 'badge-blue', '부동산': 'badge-orange', '교육': 'badge-green',
      '중고거래': 'badge-orange', '영화예매': 'badge-red', '음식배달': 'badge-orange',
      '가격비교': 'badge-blue', '시각화': 'badge-purple', '홈페이지': 'badge-gray',
    }[t] || 'badge-gray');

    /* 사이트 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('SEARCH'); };

    /* 사이트 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 사이트 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 사이트 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 사이트 삭제 */
    const handleDelete = async (s) => {
      const ok = await showConfirm('삭제', `[${s.siteCode}] ${s.siteNm} 사이트를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = sites.findIndex(x => x.siteId === s.siteId);
      if (idx !== -1) sites.splice(idx, 1);
      if (detailModal.dtlId === s.siteId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.sySite.remove(s.siteId, '사이트관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 사이트 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(sites, [{label:'ID',key:'siteId'},{label:'사이트코드',key:'siteCode'},{label:'사이트명',key:'siteNm'},{label:'도메인',key:'domain'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '사이트목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'siteCode',   label: '사이트코드' },
          { value: 'siteNm',     label: '사이트명' },
          { value: 'siteDomain', label: '도메인' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => cfTypeOptions.value, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.site_oper_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];

    const baseGridColumns = [
      { key: 'pathId',        label: '표시경로',
        pathLabelOpen: { label: pathLabel, open: openPathPick, placeholder: '미설정' } },
      { key: 'siteCode',      label: '사이트코드',
        cellInnerStyle: 'background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;font-size:11px;font-family:monospace;' },
      { key: 'siteTypeCd',    label: '유형', badge: (row) => fnTypeBadge(row.siteTypeCd) },
      { key: 'siteNm',        label: '사이트명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'siteDomain',    label: '도메인', cellStyle: 'color:#2563eb' },
      { key: 'siteEmail',     label: '대표이메일' },
      { key: 'sitePhone',     label: '대표전화' },
      { key: 'siteCeo',       label: '대표자' },
      { key: 'regDate',       label: '등록일', sortKey: 'reg' },
      { key: 'siteStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.siteStatusCd) },
    ];
    const fnRowStyle = (s) => detailModal.dtlId === s.siteId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    return { sites, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode,
      searchParam, onDateRangeChange,
      cfTypeOptions,
      pager,
      onSearch, onReset, setPage, onSizeChange,
      fnStatusBadge, fnTypeBadge, handleDelete,
      cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey,
      detailModal, exportExcel, onSort, sortIcon,
      baseSearchColumns, baseGridColumns, fnRowStyle,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">사이트관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_site" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <div>
      <bo-grid
        :columns="baseGridColumns" :rows="sites" :pager="pager" row-key="siteId"
        list-title="사이트목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="row => handleLoadDetail(row.siteId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </template>
        <template #head-actions>
          <th style="text-align:right">관리</th>
        </template>
        <template #row-actions="{ row }">
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.siteId)">수정</button>
              <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
            </div>
          </td>
        </template>
      </bo-grid>
    </div>
    <!-- -- 수정 패널 (grid 직접 자식 → 전체 폭) --------------------------------- -->
    <div v-if="detailModal.show" style="grid-column:1/-1;margin-top:4px;">
      <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
        <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
      </div>
      <sy-site-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
        :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
        
        :reload-trigger="detailModal.reloadTrigger"
        :on-list-reload="handleSearchList"
        />
    </div>
    <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_site"
      :value="pathPickModal.row ? pathPickModal.row.pathId : null"
      @select="onPathPicked" @close="closePathPick" />
  </div>
</div>
`
};

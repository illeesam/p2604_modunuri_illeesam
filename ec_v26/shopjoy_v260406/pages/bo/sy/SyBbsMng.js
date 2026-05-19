/* ShopJoy Admin - 게시글관리 */
window.SyBbsMng = {
  name: 'SyBbsMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const bbss = reactive([]);
    const bbms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ bbs_status: [], bbs_post_statuses: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'authorNm asc', desc: 'authorNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 게시판 게시물 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 게시판 게시물 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchBbs();
    };

    /* 게시판 게시물 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // 게시글 목록 조회
    const handleSearchBbs = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'bbsTitle,authorNm';
        }
        const res = await boApiSvc.syBbs.getPage(params, '게시판관리', '목록조회');
        const data = res.data?.data;
        bbss.splice(0, bbss.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || bbss.length;
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

    // 게시판 목록 조회 (초기 로드 시에만)
    const handleLoadBbmList = async () => {
      try {
        const res = await boApiSvc.syBbm.getPage({ pageNo: 1, pageSize: 10000 }, '게시판관리', '목록조회');
        bbms.splice(0, bbms.length, ...(res.data?.data?.list || []));
      } catch (err) {
        console.error('[handleLoadBbmList]', err);
      }
    };
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null });

    /* 게시판 게시물 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 게시판 게시물 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 게시판 게시물 onPathPicked */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };

    /* 게시판 게시물 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
        const expanded = reactive(new Set(['']));

    /* 게시판 게시물 toggleNode */
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };

    /* 게시판 게시물 selectNode */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchBbs(); };
    const cfTree = computed(() => boUtil.bofBuildPathTree('sy_bbs'));

    /* 게시판 게시물 expandAll */
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };

    /* 게시판 게시물 collapseAll */
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */


    /* 게시판 게시물 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.bbs_status = codeStore.sgGetGrpCodes('BBS_STATUS');
      codes.bbs_post_statuses = codeStore.sgGetGrpCodes('BBS_POST_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleLoadBbmList();
      await handleSearchBbs('DEFAULT');
      const initSet = coUtil.cofCollectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* 게시판 게시물 _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', bbmId: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* 게시판 게시물 handleDateRangeChange */
    const handleDateRangeChange = () => {
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

    /* 게시판 게시물 loadView */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 게시물 상세조회 */
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 게시물 openNew */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 게시판 게시물 closeDetail */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* 게시판 게시물 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbsMng') { detailModal.show = false; detailModal.dtlId = null; if (opts.reload) handleSearchBbs('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const cfBbmOptions = computed(() => bbms.map(b => ({ value: b.bbmId, label: b.bbmNm })));

    /* 게시판 게시물 bbmNm */
    const bbmNm = (bbmId) => { const b = bbms.find(x => x.bbmId === bbmId); return b ? b.bbmNm : bbmId; };

    /* 게시판 게시물 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 게시판 게시물 fnStatusBadge */
    const _BBS_POST_STATUS_FB = { '게시': 'badge-green', '임시': 'badge-gray', '삭제': 'badge-red', '비공개': 'badge-orange' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('BBS_POST_STATUS', s, _BBS_POST_STATUS_FB[s] || 'badge-gray');

    /* 게시판 게시물 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchBbs('DEFAULT'); };

    /* 게시판 게시물 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 게시판 게시물 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchBbs('PAGE_CLICK'); } };

    /* 게시판 게시물 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchBbs('DEFAULT'); };

    /* 게시판 게시물 삭제 */
    const handleDelete = async (b) => {
      const ok = await showConfirm('삭제', `[${b.bbsTitle}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = bbss.findIndex(x => x.bbsId === b.bbsId);
      if (idx !== -1) bbss.splice(idx, 1);
      if (detailModal.dtlId === b.bbsId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.syBbs.remove(b.bbsId, '게시판관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 게시판 게시물 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(bbss, [{label:'ID',key:'bbsId'},{label:'제목',key:'bbsTitle'},{label:'작성자',key:'authorNm'},{label:'조회수',key:'viewCount'},{label:'상태',key:'bbsStatusCd'},{label:'등록일',key:'regDate'}], '게시글목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */

    /* BoGridReadonly 컬럼 정의 (특수셀은 #cell-* 슬롯으로 override) */
    const gridColumns = [
      { key: 'bbmId',        label: '게시판', badge: () => 'badge-gray', fmt: (v) => bbmNm(v) },
      { key: 'bbsTitle',     label: '제목', sortKey: 'nm' },
      { key: 'authorNm',     label: '작성자' },
      { key: 'viewCount',    label: '조회수', align: 'center' },
      { key: 'commentCount', label: '댓글', align: 'center' },
      { key: 'attachGrpId',  label: '첨부그룹', cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'bbsStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.bbsStatusCd) },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',      label: '등록일', sortKey: 'reg', fmt: (v) => String(v || '').slice(0, 10) },
    ];
    const fnRowStyle = (b) => detailModal.dtlId === b.bbsId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    return { bbss, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, codes, cfSiteNm, searchParam, handleDateRangeChange, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, cfBbmOptions, bbmNm, exportExcel, onSort, sortIcon, gridColumns, fnRowStyle };
  },
  template: /* html */`
<div>
  <div class="page-title">게시글관리</div>  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'bbsTitle', label: '제목' },
          { value: 'authorNm', label: '작성자' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.bbmId">
        <option value="">게시판 전체</option>
        <option v-for="o in cfBbmOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.bbs_post_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
    </bo-search-area>
  </div>
  



  <bo-grid-readonly
    :columns="gridColumns" :rows="bbss" :pager="pager" row-key="bbsId"
    list-title="게시글목록" :count-text="pager.pageTotalCount + '건' + (uiState.selectedPath != null ? '  #' + uiState.selectedPath : '')"
    :sort-state="uiState" :row-style="fnRowStyle"
    @sort="onSort" @set-page="setPage" @size-change="onSizeChange">

    <template #toolbar-actions>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </template>
    <template #head-actions><th style="text-align:right">관리</th></template>

    <template #cell-bbsTitle="{ row }">
      <td><span class="title-link" @click="handleLoadDetail(row.bbsId)" :style="detailModal.dtlId===row.bbsId?'color:#e8587a;font-weight:700;':''">{{ row.bbsTitle }}<span v-if="detailModal.dtlId===row.bbsId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
    </template>
    <template #row-actions="{ row }">
      <td><div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.bbsId)">수정</button>
        <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
      </div></td>
    </template>
  </bo-grid-readonly>
  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-bbs-dtl :key="detailModal.dtlId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      
      :reload-trigger="detailModal.reloadTrigger"
      :on-list-reload="handleSearchBbs" />
  </div>
</div>
`
};

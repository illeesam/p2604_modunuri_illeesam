/* ShopJoy Admin - 전시UI관리 (목록 + 하단 상세 임베드)
 * 구조: UI > 영역 > 패널 > 위젯
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const displays = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      disp_ui_types: [],
      use_yn: [],
      date_range_opts: [],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_ui_types = codeStore.sgGetGrpCodes('DISP_UI_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { kw: '', type: '', useYn: 'Y', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, dateRange: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const { type, kw, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(kw       ? { kw: kw.trim() } : {}),
          ...(type     ? { uiType: type }  : {}),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        };
        const res = await boApiSvc.dpUi.getPage(params, '전시UI관리', '조회');
        const d = res.data?.data;
        displays.splice(0, displays.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    /* -- 표시경로 트리 -- */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };
    const onReset  = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    // -- return ---------------------------------------------------------------

    return { displays, uiState, codes, pager, searchParam,
      onSearch, onReset, setPage, onSizeChange, handleDateRangeChange,
      selectNode, pathLabel,
      uiStateDetail, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId,
      onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">전시 UI 관리</div>
  <div class="card">
    <div class="search-bar">
      <label class="search-label">키워드</label>
      <input class="form-control" v-model="searchParam.kw" placeholder="UI명 검색" @keyup.enter="onSearch" style="width:200px;" />
      <label class="search-label">사용여부</label>
      <select class="form-control" v-model="searchParam.useYn" style="width:100px;">
        <option value="">전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">🔍 조회</button>
        <button class="btn btn-secondary" @click="onReset">↺ 초기화</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_ui</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="ec_disp_ui" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span>
        <button class="btn btn-primary btn-sm" @click="openNew">✚ 신규등록</button>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">UI명 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>유형</th><th>사용여부</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>액션</th>
        </tr></thead>
        <tbody>
          <tr v-if="uiState.loading"><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">로딩 중...</td></tr>
          <tr v-else-if="!displays.length"><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">조회된 데이터가 없습니다.</td></tr>
          <tr v-for="(d, idx) in displays" :key="d?.dispId">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td class="title-link" @click="loadView(d.dispId)">{{ d.name }}</td>
            <td>{{ d.uiType }}</td>
            <td><span :class="'badge '+(d.useYn==='Y'?'badge-green':'badge-gray')">{{ d.useYn==='Y'?'사용':'미사용' }}</span></td>
            <td>{{ (d.regDate||'').slice(0,10) }}</td>
            <td class="actions">
              <button class="btn btn-sm btn-secondary" @click="loadView(d.dispId)">상세</button>
              <button class="btn btn-sm btn-primary" @click="handleLoadDetail(d.dispId)">수정</button>
            </td>
          </tr>
        </tbody>
      </table>
      <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
    </div>
  </div>
  <div v-if="uiStateDetail.selectedId" class="card" style="margin-top:10px;">
    <dp-disp-ui-dtl
      :navigate="inlineNavigate"
      :show-toast="$showToast"
      :show-confirm="$showConfirm"
      :set-api-res="$setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :tab-mode="uiStateDetail.openMode" />
  </div>
</div>`
};

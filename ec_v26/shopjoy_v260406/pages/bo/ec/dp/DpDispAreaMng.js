/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const areas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ layout_types: [], use_yn: [], date_range_opts: [] });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.layout_types = codeStore.sgGetGrpCodes('LAYOUT_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    const SORT_MAP = { nm: { asc: 'areaNm asc', desc: 'areaNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData();
    };

    /* sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'areaCd,areaNm';
        }
        const res = await boApiSvc.dpArea.getPage(params, '전시영역관리', '목록조회');
        const d = res.data?.data;
        areas.splice(0, areas.length, ...(d?.pageList || d?.list || []));
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
      handleSearchData('DEFAULT');
    });

    /* fnPathLabel */
    const fnPathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* -- 표시경로 트리 -- */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchData(); };

    /* -- 검색 -- */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', areaType: '', useYn: 'Y', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, dateRange: '' };
    };
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const searchParam = reactive(_initSearchParam());

    /* handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };

    /* 목록조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchData(); };

    /* onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      handleSearchData();
    };
  
    /* setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData(); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData(); };

    /* -- 하단 상세 임베드 --
     * 정책: 행상세/행수정 클릭 시 항상 상세 API 재조회. 같은 id 재클릭이어도 닫지 않고 reloadTrigger 만 ++ */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* loadView */
    const loadView         = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew */
    const openNew     = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispAreaMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchData('RELOAD'); return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm'/'reg' 와 sortKey 일치) */
    const listColumns = [
      { key: 'areaCd',     label: '영역코드' },
      { key: 'areaNm',     label: '영역명',   sortKey: 'nm' },
      { key: 'areaTypeCd', label: '유형' },
      { key: 'useYn',      label: '사용여부',
        badge: row => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt:   v   => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',    label: '등록일',   sortKey: 'reg',
        fmt: v => (v||'').slice(0,10) },
      { key: '_act',       label: '액션' },
    ];

    // -- return ---------------------------------------------------------------

    return { areas, uiState, codes, pager, searchParam,
      onSearch, onReset, setPage, onSizeChange, handleDateRangeChange,
      selectNode, fnPathLabel,
      uiStateDetail, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId,
      onSort, sortIcon, listColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">전시 영역 관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="onSearch" @reset="onReset">
      <label class="search-label">키워드</label>
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'areaCd', label: '영역코드' },
          { value: 'areaNm', label: '영역명' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input class="form-control" v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" style="width:200px;" />
      <label class="search-label">사용여부</label>
      <select class="form-control" v-model="searchParam.useYn" style="width:100px;">
        <option value="">전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
    </bo-search-area>
  </div>
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_area</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_area" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <bo-grid :columns="listColumns" :rows="areas" :pager="pager" row-key="areaId"
      :sort-state="uiState" list-title="전시 영역 목록"
      :count-text="'총 ' + pager.pageTotalCount + '건'"
      empty-text="조회된 데이터가 없습니다." row-clickable
      @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="(r) => loadView(r.areaId)">
      <template #toolbar-actions>
        <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">#{{ uiState.selectedPath }}</span>
        <button class="btn btn-primary btn-sm" @click="openNew">✚ 신규등록</button>
      </template>
      <template #cell-areaCd="{ row }">
        <td><code style="font-size:11px;">{{ row.areaCd }}</code></td>
      </template>
      <template #cell-areaNm="{ row }">
        <td class="title-link" @click="loadView(row.areaId)">{{ row.areaNm }}</td>
      </template>
      <template #cell-_act="{ row }">
        <td class="actions" @click.stop>
          <button class="btn btn-sm btn-secondary" @click="loadView(row.areaId)">상세</button>
          <button class="btn btn-sm btn-primary" @click="handleLoadDetail(row.areaId)">수정</button>
        </td>
      </template>
    </bo-grid>
  </div>
  <div v-if="uiStateDetail.selectedId" class="card" style="margin-top:10px;">
    <dp-disp-area-dtl
      :navigate="inlineNavigate"
      :admin-data="null"
      :show-toast="$showToast"
      :show-confirm="$showConfirm"
      :set-api-res="$setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :tab-mode="uiStateDetail.openMode"
      :reload-trigger="uiStateDetail.reloadTrigger"
      @close="closeDetail"
      :on-list-reload="handleSearchData"
    />
  </div>
</div>`
};

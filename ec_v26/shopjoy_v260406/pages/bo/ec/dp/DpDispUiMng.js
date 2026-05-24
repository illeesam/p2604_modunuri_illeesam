/* ShopJoy Admin - 전시UI관리 (목록 + 하단 상세 임베드)
 * 구조: UI > 영역 > 패널 > 위젯
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const displays = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      disp_ui_types: [],
      use_yn: [],
      date_range_opts: [],
    });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_ui_types = codeStore.sgGetGrpCodes('DISP_UI_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 코드 주입

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { type: '', useYn: 'Y', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, dateRange: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const SORT_MAP = { nm: { asc: 'uiNm asc', desc: 'uiNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const { type, searchValue, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(type     ? { deviceTypeCd: type }  : {}),
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
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* selectNode — 노드 선택 */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 정책: 행상세/행수정 클릭 시 항상 상세 API 재조회. 같은 id 재클릭이어도 닫지 않고 reloadTrigger 만 ++ */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* loadView — 뷰 로드 */
    const loadView         = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew     = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm'/'reg' 와 sortKey 일치) */
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'searchValue', type: 'text', label: '키워드', placeholder: 'UI명 검색', width: '200px' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    const listGridColumns = [
      { key: 'uiNm',         label: 'UI명',     sortKey: 'nm', link: true },
      { key: 'deviceTypeCd', label: '유형' },
      { key: 'useYn',        label: '사용여부',
        badge: row => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt:   v   => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',      label: '등록일',   sortKey: 'reg',
        fmt: v => (v||'').slice(0,10) },
    ];

    /* onSearch — 조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset  = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* setPage — 설정 */
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    // ===== return (템플릿 노출) ===============================================


    return { displays, uiState, codes, pager, searchParam,
      onSearch, onReset, setPage, onSizeChange, handleDateRangeChange,
      selectNode, pathLabel,
      uiStateDetail, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId,
      onSort, sortIcon, baseSearchColumns, listGridColumns };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">전시 UI 관리</div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">
          📂 표시경로
          <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#ec_disp_ui</span>
        </span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_ui" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid :columns="listGridColumns" :rows="displays" :pager="pager" row-key="uiId"
      :sort-state="uiState" list-title="전시 UI 목록"
      :count-text="'총 ' + pager.pageTotalCount + '건'"
      empty-text="조회된 데이터가 없습니다." row-clickable
      @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="(r) => loadView(r.uiId)" row-actions>
      <template #toolbar-actions>
        <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
          #{{ uiState.selectedPath }}
        </span>
        <button class="btn btn-primary btn-sm" @click="openNew">✚ 신규등록</button>
      </template>
      <template #row-actions="{ row }">
        <button class="btn btn-sm btn-secondary" @click="loadView(row.uiId)">상세</button>
        <button class="btn btn-sm btn-primary" @click="handleLoadDetail(row.uiId)">수정</button>
      </template>
    </bo-grid>
  </div>
    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div v-if="uiStateDetail.selectedId" class="card" style="margin-top:10px;">
    <dp-disp-ui-dtl
      :navigate="inlineNavigate"
      :show-toast="$showToast"
      :show-confirm="$showConfirm"
      :set-api-res="$setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :tab-mode="uiStateDetail.openMode"
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
  </div>
</div>

  <!-- ===== □. 상세 패널 =================================================== -->`
};

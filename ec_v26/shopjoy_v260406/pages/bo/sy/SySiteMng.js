/* ShopJoy Admin - 사이트관리 목록 */
window.SySiteMng = {
  name: 'SySiteMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const sites = reactive([]);                    // 사이트 목록 (메인 그리드 데이터)
    const siteCounts = reactive({});               // { pathId: 사이트수 } — 좌 트리 우측 뱃지 표시용
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ site_oper_statuses: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'siteNm asc', desc: 'siteNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SySiteMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회 (표시경로 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 사이트 신규 등록 (인라인 패널)
      } else if (cmd === 'sites-add') {
        return openNew();
      // 사이트 목록 엑셀 내보내기
      } else if (cmd === 'sites-excel') {
        return exportExcel();
      // 사이트 목록 재조회
      } else if (cmd === 'sites-reload') {
        return handleSearchList('RELOAD');
      // 좌측 경로 트리 노드 선택 → 우측 목록/상세 초기화 후 경로 기준 재조회
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        baseGridPager.pageNo = 1;
        resetDetailToNew();                  // 사이트 상세 패널 초기화(빈 신규 폼 + 선택 해제)
        return handleSearchList();           // 사이트목록을 선택 경로 기준으로 재조회
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'sites-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'sites-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SySiteMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'sites-pager-sizeChange') {
        return onSizeChange();
      // 표시경로 picker 열기 (행 단위)
      } else if (cmd === 'pathModal-open') {
        return openPathPick(param);
      // 표시경로 선택 → 행 pathId 갱신
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch. cmd='{영역}-cellClick', e={row,col,colKey,colIndex,rowIndex}.
       e.colKey(클릭 컬럼명) 기준으로 셀별 동작 분기, e.row 행 객체 활용 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SySiteMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'sites-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.siteId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.siteId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SySiteMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) { return closePathPick(); }
        return onPathPicked(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 표시경로 선택 모달 (sy_path) ===== */
    const pathPickModal = reactive({ show: false, row: null }); // 표시경로 선택 모달 상태

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({   // 인라인 Dtl 패널 상태 (modal_reload_trigger 표준)
      show: true,                    // 상세영역 항상 표시 (진입 시 빈 신규 폼)
      dtlId: '__new__',              // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      dtlMode: 'edit',               // 'view' | 'edit'
      reloadTrigger: 0,
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleLoadSiteTreeNodeCounts — 좌 트리 노드별 사이트수 집계 (검색조건 동기)
     *   백엔드 GET /bo/sy/site/path-counts — PostgreSQL 재귀 CTE 로 자손 누적 + 검색조건 적용.
     *   handleSearchList 와 동일한 searchParam(searchValue/status/typeCd/dateStart/dateEnd)
     *   을 그대로 전달해 트리 뱃지 카운트가 페이지 그리드와 항상 일치하게 유지.
     *   응답: [{pathId, cnt}, ...] — '__total__'/'__orphan__' 특수 path 행 포함 */
    const handleLoadSiteTreeNodeCounts = async () => {
      try {
        /* pathId 는 트리 필터 자체이므로 제외 — 검색조건만 그대로 전달 */
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.sySite.getPathTreeNodeCounts(params, '사이트관리', '경로별카운트');
        const rows = res.data?.data || [];
        // siteCounts in-place 갱신 (반응성 유지) — 배열 → { pathId: cnt } 매핑
        Object.keys(siteCounts).forEach(k => { delete siteCounts[k]; });
        for (const r of rows) {
          if (r && r.pathId != null) siteCounts[r.pathId] = r.cnt;
        }
      } catch (e) {
        console.error('[handleLoadSiteTreeNodeCounts]', e);
      }
    };

    /* handleSearchList — 목록 조회 (좌 트리 카운트도 같은 검색조건으로 동기 갱신) */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'siteCode,siteNm,siteDomain';
        }
        const res = await boApiSvc.sySite.getPage(params, '사이트관리', '목록조회');
        const data = res.data?.data;
        sites.splice(0, sites.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || sites.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
        /* 좌 트리 카운트 동기 갱신 — 검색조건이 바뀔 때마다 함께 호출 */
        handleLoadSiteTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* openPathPick — 표시경로 선택 모달 열기 */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* closePathPick — 표시경로 선택 모달 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* onPathPicked — 표시경로 선택 결과 적용 + 즉시 저장
     *   사이트목록은 별도 [저장] 버튼이 없어 행의 pathId 가 바뀌면 바로 서버에 반영.
     *   selective update — body 에 pathId 만 담아 다른 컬럼 보존. */
    const onPathPicked = async (pathId) => {
      const row = pathPickModal.row;
      if (!row || !row.siteId) { return; }
      const prevPathId = row.pathId;
      row.pathId = pathId;
      try {
        await boApiSvc.sySite.update(row.siteId, { pathId }, '사이트관리', '표시경로변경');
        showToast?.('표시경로가 저장되었습니다.', 'success');
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadSiteTreeNodeCounts();
      } catch (err) {
        console.error('[onPathPicked] save failed', err);
        row.pathId = prevPathId;   // 실패 시 롤백
        showToast?.(err.response?.data?.message || '표시경로 저장 실패', 'error', 0);
      }
    };

    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 (토글) */
    const loadView = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'view') {
        detailModal.show = false; detailModal.dtlId = null; return;
      }
      detailModal.dtlId = id;
      detailModal.dtlMode = 'view';
      detailModal.show = true;
      detailModal.reloadTrigger++;
    };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = false;    // 버튼 숨김
      detailModal.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 그리드 행 클릭 시 해당 ID 상세 로드 (재클릭 시 신규 폼으로 초기화) */
    const handleLoadDetail = (id) => {
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.active = true;     // 행 선택 → 저장/취소 노출
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailModal.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'sySiteMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }   // handleSearchList 내부에서 트리 카운트도 갱신
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (s) => {
      const ok = await showConfirm('삭제', `[${s.siteCode}] ${s.siteNm} 사이트를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = sites.findIndex(x => x.siteId === s.siteId);
      if (idx !== -1) { sites.splice(idx, 1); }
      if (detailModal.dtlId === s.siteId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.sySite.remove(s.siteId, '사이트관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(sites, [
      { label: 'ID', key: 'siteId' }, { label: '사이트코드', key: 'siteCode' },
      { label: '사이트명', key: 'siteNm' }, { label: '도메인', key: 'domain' },
      { label: '상태', key: 'statusCd' }, { label: '등록일', key: 'regDate' },
    ], '사이트목록.csv');


    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '운영중': 'badge-green', '점검중': 'badge-orange', '비활성': 'badge-gray' }[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({
      '이커머스': 'badge-red', '숙박공유': 'badge-blue', '전문가연결': 'badge-purple',
      'IT매칭': 'badge-blue', '부동산': 'badge-orange', '교육': 'badge-green',
      '중고거래': 'badge-orange', '영화예매': 'badge-red', '음식배달': 'badge-orange',
      '가격비교': 'badge-blue', '시각화': 'badge-purple', '홈페이지': 'badge-gray',
    }[t] || 'badge-gray');

    /* fnRowStyle — 행 스타일 (선택 강조는 selected-key 의 파란 테두리로 처리) */
    const fnRowStyle = (s) => '';

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — handleSearchList 가 내부에서 handleLoadSiteTreeNodeCounts 도 함께 호출
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfTypeOptions = computed(() => [...new Set(sites.map(s => s.siteTypeCd).filter(v => v != null && v !== ''))].sort());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
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
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',        label: '표시경로', style: 'width:170px;max-width:170px;',
        pathLabelOpen: { label: pathLabel, open: (row) => handleSelectAction('pathModal-open', row),
          clear: (row) => { pathPickModal.row = row; onPathPicked(null); }, placeholder: '미설정' } },
      { key: 'siteCode',      label: '사이트코드',
        cellInnerStyle: 'background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;font-size:11px;font-family:monospace;' },
      { key: 'siteTypeCd',    label: '유형', badge: (row) => fnTypeBadge(row.siteTypeCd) },
      { key: 'siteNm',        label: '사이트명', sortKey: 'nm', link: true, style: 'width:140px;max-width:140px;',
        cellInnerStyle: (v, row) => detailModal.dtlId === row.siteId ? 'color:#1d4ed8;font-weight:700;' : '' },
      { key: 'siteDomain',    label: '도메인', cellStyle: 'color:#2563eb' },
      { key: 'siteEmail',     label: '대표이메일' },
      { key: 'sitePhone',     label: '대표전화' },
      { key: 'siteCeo',       label: '대표자' },
      { key: 'regDate',       label: '등록일', sortKey: 'reg', style: 'width:110px;',
        fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'siteStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.siteStatusCd) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      sites, siteCounts, uiState, codes, searchParam, baseGridPager, detailModal, pathPickModal,  // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfTypeOptions, cfDetailEditId, cfIsViewMode, cfDetailKey,                      // computed
      sortIcon, fnRowStyle, fnStatusBadge, fnTypeBadge,                              // 헬퍼
      inlineNavigate,                                                                // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="사이트관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div class="bo-2col">
    <!-- ===== ■.■. 경로 트리 (bo-container bare → 자체 카드 유지) ==================== -->
    <bo-container bare>
      <bo-path-tree-card biz-cd="sy_site" title="표시경로" :show-biz-cd="false"
        :counts="siteCounts"
        :selected="uiState.selectedPath" @select="path => handleBtnAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■. 목록 영역 (bo-container 카드+제목, bo-grid bare, baseGridPager 바깥) ======== -->
    <bo-container title="사이트목록" :count-text="baseGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('sites-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('sites-add')">
          + 신규
        </button>
      </template>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid bare
        :columns="columns.baseGrid" :rows="sites" row-key="siteId" :selected-key="detailModal.dtlId"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleBtnAction('sites-sort', key)"
        grid-id="sites-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row, gridId }">
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn-blue btn-xs" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_edit', row)">
                수정
              </button>
              <button class="btn btn-danger btn-xs" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
      <!-- 페이저: 그리드 바깥, 영역(bo-container) 안 하단 -->
      <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('sites-pager-setPage', n)" :on-size-change="() => handleSelectAction('sites-pager-sizeChange')" />
    </bo-container>
    <!-- ===== □.□. 경로 트리 ================================================= -->
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 (트리 | 목록 2열) ============================== -->
  <!-- ===== ■. 상세 영역 (bo-2col 바깥 → 자연스러운 전체 폭. Dtl 이 bo-container 자체 보유) ================= -->
  <sy-site-dtl :key="cfDetailKey" :navigate="inlineNavigate" :dtl-id="cfDetailEditId"
    :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailModal.active"
    :reload-trigger="detailModal.reloadTrigger" />
  <!-- ===== ■. 표시경로 선택 모달 ============================================ -->
  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_site" :value="pathPickModal.row ? pathPickModal.row.pathId : null" modal-name="path-pick" :on-callback="fnCallbackModal" />
</bo-page>
`,
};

/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const users = reactive([]);                    // 사용자 목록 (메인 그리드 데이터)
    const depts = reactive([]);                    // 부서 트리 (좌측 트리)
    const deptCounts = reactive({});               // 좌 부서 트리 노드별 사용자수 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      boUsers: [], selectedDeptId: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ user_status: [], user_roles: [], user_date_types: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'userNm asc', desc: 'userNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회 (부서 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedDeptId = null;        // 부서 트리 전체로 복귀
        baseGridPager.pageNo = 1;
        resetDetailToNew();                   // 하단 상세 패널도 빈 신규 폼으로 초기화
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 사용자 신규 등록 (인라인 패널)
      } else if (cmd === 'users-add') {
        return openNew();
      // 사용자 목록 엑셀 내보내기
      } else if (cmd === 'users-excel') {
        return exportExcel();
      // 사용자 엑셀 업로드 모달 열기
      } else if (cmd === 'users-excel-upload') {
        excelUploadModal.reloadTrigger++;
        excelUploadModal.show = true;
        return;
      // 부서 트리 전체 펼치기
      } else if (cmd === 'deptTree-expandAll') {
        return expandAll();
      // 부서 트리 전체 접기
      } else if (cmd === 'deptTree-collapseAll') {
        return collapseAll();
      // 부서 트리 노드 펼치기/접기 토글
      } else if (cmd === 'deptTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'users-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'users-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'users-pager-sizeChange') {
        return onSizeChange();
      // 부서 트리 노드 선택 → 우측 그리드 필터링 + 상세 패널 빈 신규 폼으로 초기화
      } else if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyUserMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'users-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.userId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.userId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyUserMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'excel-upload') {
        if (result == null) { excelUploadModal.show = false; return; }
        /* saved: 목록 재조회 */
        return handleSearchList();
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', role: '', status: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 좌측 부서 트리 ===== */
    const expanded = reactive(new Set([null]));

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({   // 인라인 Dtl 패널 상태 (항상 표시, 진입 시 빈 신규 폼)
      selectedId: '__new__',         // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',              // 'view' | 'edit'
      reloadTrigger: 0,
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ===== 엑셀 업로드 모달 (컬럼은 다운로드 파일의 3행 헤더에서 자동 추출) ===== */
    const excelUploadModal = reactive({ show: false, reloadTrigger: 0 });

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
      handleSearchList('DEFAULT');
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleLoadDeptTreeNodeCounts — 좌 부서 트리 노드별 사용자수 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadDeptTreeNodeCounts = async () => {
      try {
        /* deptId 는 트리 필터 자체이므로 제외 — 검색조건만 그대로 전달 */
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'deptId'));
        const res = await boApiSvc.syUser.getDeptTreeNodeCounts(params, '사용자관리', '부서별카운트');
        const rows = res.data?.data || [];

        Object.keys(deptCounts).forEach(k => { delete deptCounts[k]; });

        /* 백엔드가 dept_id 도 pathId 키로 통일 반환 (List<Map> 패턴) */
        for (const r of rows) { if (r && r.deptId != null) deptCounts[r.deptId] = r.cnt; }
      } catch (e) { console.error('[handleLoadDeptTreeNodeCounts]', e); }
    };

    /* handleSearchList — 목록 조회 (좌 부서 트리 카운트도 같은 검색조건으로 동기 갱신) */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...getSortParam(),
          ...coUtil.cofOmitEmpty(searchParam),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'userId,loginId,userNm,userEmail';
        }
        if (uiState.selectedDeptId != null) { params.deptId = uiState.selectedDeptId; }
        const res = await boApiSvc.syUser.getPage(params, '사용자관리', '목록조회');
        const data = res.data?.data;
        users.splice(0, users.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || users.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
        /* 좌 부서 트리 카운트 동기 갱신 */
        handleLoadDeptTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchTree — 부서 트리 조회 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syDept.getTree('사용자관리', '트리조회');
        depts.splice(0, depts.length, ...(res.data?.data || []));
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };

    /* buildTree — 부서 트리 빌드 */
    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) { map[d.parentDeptId].children.push(map[d.deptId]); }
        else { roots.push(map[d.deptId]); }
      });
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));

    /* expandAll — 트리 전체 펼치기 */
    const expandAll = () => { const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); }; cfTree.value.children.forEach(walk); expanded.add(null); };

    /* collapseAll — 트리 전체 접기 */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (u) => {
      const ok = await showConfirm('삭제', `[${u.userNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = users.findIndex(x => x.userId === u.userId);
      if (idx !== -1) { users.splice(idx, 1); }
      if (detailPanel.selectedId === u.userId) { resetDetailToNew(); }
      try {
        await boApiSvc.syUser.remove(u.userId, '사용자관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀(xlsx) 내보내기. 백엔드 SXSSF 스트리밍 — 대용량 메모리 안전. */
    const exportExcel = () => {
      const params = {
        ...getSortParam(),
        ...coUtil.cofOmitEmpty(searchParam),
      };
      if (uiState.selectedDeptId != null) { params.deptId = uiState.selectedDeptId; }
      return coUtil.cofDownloadExcel('/bo/sy/user/excel', params, '사용자목록', '사용자관리', '엑셀다운로드');
    };


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.user_status = codeStore.sgGetGrpCodes('USER_STATUS');
      codes.user_roles = codeStore.sgGetGrpCodes('USER_ROLE');
      codes.user_date_types = codeStore.sgGetGrpCodes('USER_DATE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 트리 + 목록 조회
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleSearchTree();
      expanded.add(null);
      await handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    /* fnRoleBadge — 권한 배지 */
    const _USER_ROLE_FB = { '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' };
    const fnRoleBadge = r => coUtil.cofCodeBadge('USER_ROLE', r, _USER_ROLE_FB[r] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const _USER_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('USER_STATUS', s, _USER_STATUS_FB[s] || 'badge-gray');

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (u) => detailPanel.selectedId === u.userId ? 'background:#fff8f9;' : '';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'userId',    label: '사용자ID' },
          { value: 'loginId',   label: '로그인ID' },
          { value: 'userNm',    label: '이름' },
          { value: 'userEmail', label: '이메일' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'role',   type: 'select', label: '권한', options: () => codes.user_roles,  nullLabel: '권한 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.user_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.user_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'loginId',      label: '로그인ID',
        cellInnerStyle: 'background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:12px;font-family:monospace;' },
      { key: 'userNm',       label: '이름', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'userEmail',    label: '이메일' },
      { key: 'userPhone',    label: '연락처' },
      { key: 'roleNm',       label: '권한', badge: (row) => fnRoleBadge(row.roleNm) },
      { key: 'deptNm',       label: '부서', cellStyle: 'color:#666' },
      { key: 'userStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.userStatusCd) },
      { key: 'lastLoginDate',label: '최근로그인', sortKey: 'reg', cellStyle: 'color:#888',
        fmt: (v) => v ? v.substring(0, 10) : '-' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      users, uiState, codes, searchParam, baseGridPager, detailPanel, expanded, deptCounts,  // 상태 / 데이터
      excelUploadModal,                                                  // 엑셀 업로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                // dispatch + 모달 통합 콜백
      cfTree, cfDetailEditId, cfIsViewMode, cfDetailKey,                 // computed
      fnRowStyle,                                                        // 헬퍼
      inlineNavigate, showToast, showConfirm,                            // Dtl 콜백 (closure 필요)
      handleSearchList,                                                  // Dtl 의 onListReload 콜백
    };
  },
  template: /* html */`
<bo-page title="사용자관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 본문 영역 (트리 + 목록) ===================================== -->
  <div class="bo-2col">
    <!-- ===== ■.■. 부서 트리 ================================================= -->
    <bo-container title="📂 부서">
      <template #toolbar-actions>
        <div style="display:flex;gap:4px;">
          <button class="btn btn_expand_all" @click="handleBtnAction('deptTree-expandAll')" style="font-size:11px;">
            ▼ 전체펼치기
          </button>
          <button class="btn btn_collapse_all" @click="handleBtnAction('deptTree-collapseAll')" style="font-size:11px;">
            ▶ 전체닫기
          </button>
        </div>
      </template>
      <div style="max-height:65vh;overflow:auto;">
        <bo-dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedDeptId"
          :on-toggle="id => handleBtnAction('deptTree-toggle', id)"
          :on-select="id => handleSelectAction('deptTree-select', id)"
          :depth="0" :counts="deptCounts" />
      </div>
    </bo-container>
    <!-- ===== ■.■. 목록 그리드 ============================================== -->
    <bo-container bare title="사용자목록" :count-text="baseGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <div style="display:flex;gap:6px;">
          <button class="btn btn_excel" @click="handleBtnAction('users-excel')">
            📥 엑셀
          </button>
          <button class="btn btn_excel_upload" @click="handleBtnAction('users-excel-upload')">
            📤 엑셀업로드
          </button>
          <button class="btn btn_new" @click="handleBtnAction('users-add')">
            + 신규
          </button>
        </div>
      </template>
      <bo-grid bare
        :columns="columns.baseGrid" :rows="users" row-key="userId" :selected-key="detailPanel.selectedId"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleBtnAction('users-sort', key)"
        grid-id="users-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row, gridId }">
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_edit', row)">
                수정
              </button>
              <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
      <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('users-pager-setPage', n)" :on-size-change="() => handleSelectAction('users-pager-sizeChange')" />
    </bo-container>
  </div>
  <!-- ===== ■. 상세 패널 (인라인 임베드, 항상 표시, 전체 폭) ================ -->
  <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />

  <!-- ===== ■. 엑셀 업로드 모달 (도메인은 모달 안의 select 로 전환 가능) ===== -->
  <bo-excel-upload-modal v-if="excelUploadModal.show"
    default-domain="user" modal-name="excel-upload" :on-callback="fnCallbackModal" />
</bo-page>
`,
};

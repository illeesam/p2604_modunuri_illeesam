/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const users = reactive([]);                    // 사용자 목록 (메인 그리드 데이터)
    const depts = reactive([]);                    // 부서 트리 (좌측 트리)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      boUsers: [], selectedDeptId: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ user_status: [], user_roles: [], user_date_types: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'userNm asc', desc: 'userNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', role: '', status: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 좌측 부서 트리 ===== */
    const expanded = reactive(new Set([null]));

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 }); // 인라인 Dtl 패널 상태

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-date-range') {
        return handleDateRangeChange();
      // 사용자 신규 등록 (인라인 패널)
      } else if (cmd === 'users-add') {
        return openNew();
      // 사용자 목록 엑셀 내보내기
      } else if (cmd === 'users-excel') {
        return exportExcel();
      // 부서 트리 전체 펼치기
      } else if (cmd === 'deptTree-expand-all') {
        return expandAll();
      // 부서 트리 전체 접기
      } else if (cmd === 'deptTree-collapse-all') {
        return collapseAll();
      // 부서 트리 노드 펼치기/접기 토글
      } else if (cmd === 'deptTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'users-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'users-set-page') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'users-size-change') {
        return onSizeChange();
      // 그리드 행 클릭 → 편집 패널 열기
      } else if (cmd === 'users-row-edit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'users-row-delete') {
        return handleDelete(param);
      // 부서 트리 노드 선택 → 우측 그리드 필터링
      } else if (cmd === 'deptTree-select') {
        uiState.selectedDeptId = param;
        pager.pageNo = 1;
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

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
      pager.pageNo = 1;
      handleSearchList('DEFAULT');
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'userId,loginId,userNm,userEmail';
        }
        if (uiState.selectedDeptId != null) { params.deptId = uiState.selectedDeptId; }
        const res = await boApiSvc.syUser.getPage(params, '사용자관리', '목록조회');
        const data = res.data?.data;
        users.splice(0, users.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || users.length;
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
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.reloadTrigger++; };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* openNew — 신규 등록 */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailPanel.selectedId = null; };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { detailPanel.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (u) => {
      const ok = await showConfirm('삭제', `[${u.userNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = users.findIndex(x => x.userId === u.userId);
      if (idx !== -1) { users.splice(idx, 1); }
      if (detailPanel.selectedId === u.userId) { detailPanel.selectedId = null; }
      try {
        const res = await boApiSvc.syUser.remove(u.userId, '사용자관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(users, [{label:'ID',key:'userId'},{label:'로그인ID',key:'loginId'},{label:'이름',key:'userNm'},{label:'이메일',key:'userEmail'},{label:'연락처',key:'userPhone'},{label:'권한',key:'roleNm'},{label:'부서',key:'deptNm'},{label:'상태',key:'userStatusCd'},{label:'최종로그인',key:'lastLoginDate'}], '사용자목록.csv');

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

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

    // ===== 사용자 함수 (헬퍼 / 컬럼 정의) ====================================

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    /* fnRoleBadge — 권한 배지 */
    const _USER_ROLE_FB = { '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' };
    const fnRoleBadge = r => coUtil.cofCodeBadge('USER_ROLE', r, _USER_ROLE_FB[r] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const _USER_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('USER_STATUS', s, _USER_STATUS_FB[s] || 'badge-gray');

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (u) => detailPanel.selectedId === u.userId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    const baseSearchColumns = [
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
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    const baseGridColumns = [
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

    // ===== return (템플릿 노출) ===============================================

    return {
      users, uiState, codes, searchParam, pager, detailPanel, expanded,  // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                // 컬럼 정의
      handleBtnAction, handleSelectAction,                               // dispatch (모든 이벤트 / 액션 라우팅)
      cfTree, cfDetailEditId, cfIsViewMode, cfDetailKey,                 // computed
      fnRowStyle,                                                        // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes,                 // Dtl 콜백 (closure 필요)
      handleSearchList,                                                  // Dtl 의 onListReload 콜백
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    사용자관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 부서 트리 ================================================= -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">
          📂 부서
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-expand-all')" style="flex:1;font-size:11px;">
          ▼ 전체펼치기
        </button>
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-collapse-all')" style="flex:1;font-size:11px;">
          ▶ 전체닫기
        </button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedDeptId"
          :on-toggle="id => handleBtnAction('deptTree-toggle', id)"
          :on-select="id => handleSelectAction('deptTree-select', id)"
          :depth="0" />
      </div>
    </div>
    <div>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid
        :columns="baseGridColumns" :rows="users" :pager="pager" row-key="userId"
        list-title="사용자목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleSelectAction('users-sort', key)"
        @set-page="n => handleSelectAction('users-set-page', n)"
        @size-change="handleSelectAction('users-size-change')"
        @row-click="row => handleSelectAction('users-row-edit', row.userId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="handleBtnAction('users-excel')">
              📥 엑셀
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('users-add')">
              + 신규
            </button>
          </div>
        </template>
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row }">
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleSelectAction('users-row-edit', row.userId)">
                수정
              </button>
              <button class="btn btn-danger btn-sm" @click="handleSelectAction('users-row-delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="detailPanel.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger"
      :on-list-reload="handleSearchList" />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

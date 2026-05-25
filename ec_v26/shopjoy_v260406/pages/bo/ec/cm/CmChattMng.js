/* ShopJoy Admin - 채팅관리 목록 + 하단 ChattDtl 임베드 */
window.CmChattMng = {
  name: 'CmChattMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const chatts = reactive([]);                   // 채팅 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ chatt_message_types: [], chatt_statuses: [], date_range_opts: [] });
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmChattMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 채팅 신규 등록 (인라인 패널)
      } else if (cmd === 'chatts-add') {
        return openNew();
      // 채팅 목록 엑셀 내보내기
      } else if (cmd === 'chatts-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmChattMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'chatts-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'chatts-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'chatts-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세 편집 패널 열기
      } else if (cmd === 'chatts-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'chatts-rowDelete') {
        return handleDelete(param);
      // ref-link 클릭 (회원 등)
      } else if (cmd === 'chatts-rowRef') {
        return showRefModal(param.type, param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 }); // 인라인 Dtl 패널 상태
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

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
      handleSearchList();
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
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,subject';
        }
        const res = await boApiSvc.cmChatt.getPage(params, '채팅관리', '목록조회');
        const data = res.data?.data;
        chatts.splice(0, chatts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
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
      if (pg === 'cmChattMng') { detailPanel.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.subject}] 채팅을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = chatts.findIndex(x => x.chattRoomId === c.chattRoomId);
      if (idx !== -1) { chatts.splice(idx, 1); }
      if (detailPanel.selectedId === c.chattRoomId) { detailPanel.selectedId = null; }
      try {
        const res = await boApiSvc.cmChatt.remove(c.chattRoomId, '채팅관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(chatts, [{label:'채팅ID',key:'chattRoomId'},{label:'회원명',key:'memberNm'},{label:'상태',key:'chattStatusCd'},{label:'마지막메시지일시',key:'lastMsgDate'},{label:'등록일',key:'regDate'}], '채팅목록.csv');

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.chatt_message_types = codeStore.sgGetGrpCodes('CHATT_MESSAGE_TYPE');
      codes.chatt_statuses = codeStore.sgGetGrpCodes('CHATT_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    /* fnStatusBadge — 상태 배지 */
    const _CHATT_STATUS_FB = { '진행중': 'badge-green', '종료': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('CHATT_STATUS', s, _CHATT_STATUS_FB[s] || 'badge-gray');

    /* fnGridRowClass — 그리드 행 클래스 */
    const fnGridRowClass = (row) => (detailPanel.selectedId === row.chattRoomId ? 'active' : '');

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'memberNm', label: '회원명' },
          { value: 'subject',  label: '제목' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.chatt_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'memberNm',    label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'subject',     label: '제목', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'lastMsgDate', label: '마지막 메시지',
        cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888',
        fmt: (v) => v || '-' },
      { key: 'msgCnt',      label: '메시지수',  style: 'width:80px;',
        fmt: (v, row) => (row.adminUnreadCnt || 0) + (row.memberUnreadCnt || 0) + '개' },
      { key: 'unread',      label: '미읽음',    style: 'width:80px;',
        badge: (row) => row.memberUnreadCnt > 0 ? 'badge-red' : 'badge-gray',
        fmt: (v, row) => row.memberUnreadCnt > 0 ? row.memberUnreadCnt : 0 },
      { key: 'chattStatusCd', label: '상태',    style: 'width:90px;',
        badge: (row) => fnStatusBadge(row.chattStatusCd) },
      { key: 'regDate',     label: '일시',      style: 'width:140px;', sortKey: 'reg' },
      { key: 'siteNm',      label: '사이트명',  style: 'width:110px;', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      chatts, uiState, codes, searchParam, pager, detailPanel,                         // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                             // computed
      sortIcon, fnStatusBadge, fnGridRowClass,                                         // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes, showRefModal, handleSearchList, // Dtl 콜백 / 모달 함수
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    채팅관리
  </div>
  <!-- ===== ■. 검색 ======================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="baseGridColumns" :rows="chatts" :pager="pager" row-key="chattRoomId"
    :sort-state="uiState" list-title="채팅목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="key => handleSelectAction('chatts-sort', key)"
    @set-page="n => handleSelectAction('chatts-pager-setPage', n)"
    @size-change="handleSelectAction('chatts-pager-sizeChange')"
    @ref-click="ref => handleSelectAction('chatts-rowRef', ref)"
    @row-click="row => handleSelectAction('chatts-rowEdit', row.chattRoomId)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-green btn-sm" @click="handleBtnAction('chatts-excel')">
        📥 엑셀
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('chatts-add')">
        + 신규
      </button>
    </template>
    <template #row-actions="{ row }">
      <div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleSelectAction('chatts-rowEdit', row.chattRoomId)">
          보기
        </button>
        <button class="btn btn-danger btn-sm" @click="handleSelectAction('chatts-rowDelete', row)">
          삭제
        </button>
      </div>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: ChattDtl 임베드 ===================================== -->
  <div v-if="detailPanel.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <cm-chatt-dtl
      :key="detailPanel.selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
  </div>
  <!-- ===== □. 하단 상세: ChattDtl 임베드 ===================================== -->
</div>
`,
};

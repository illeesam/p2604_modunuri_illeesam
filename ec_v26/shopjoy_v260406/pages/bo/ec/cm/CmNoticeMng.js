/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const notices = reactive([]);                  // 공지사항 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] }); // 공통코드
    const SORT_MAP = { nm: { asc: 'noticeTitle asc', desc: 'noticeTitle desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmNoticeMng.js : handleBtnAction -> ', cmd, param);
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
      } else if (cmd === 'searchParam-date-range') {
        return onDateRangeChange();
      // 공지사항 신규 등록 (인라인 패널)
      } else if (cmd === 'notices-add') {
        return openNew();
      // 공지사항 목록 엑셀 내보내기
      } else if (cmd === 'notices-excel') {
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
      console.log(' ■■ CmNoticeMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'notices-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'notices-set-page') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'notices-size-change') {
        return onSizeChange();
      // 그리드 행 클릭 → 편집 패널 열기
      } else if (cmd === 'notices-row-edit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'notices-row-delete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 10,
      pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {}
    });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 }); // 인라인 Dtl 패널 상태
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
      pager.pageNo = 1;
    };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* setPage — 페이지 번호 변경 */
    const setPage = (n) => {
      if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); }
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
        const res = await boApiSvc.cmNotice.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) }, '공지사항관리', '조회');
        notices.splice(0, notices.length, ...(res.data?.data?.pageList || []));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage  = res.data?.data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (n) => {
      const ok = await showConfirm('삭제', `[${n.noticeTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = notices.findIndex(x => x.noticeId === n.noticeId);
      if (idx !== -1) { notices.splice(idx, 1); }
      if (detailPanel.selectedId === n.noticeId) { detailPanel.selectedId = null; }
      try {
        const res = await boApiSvc.cmNotice.remove(n.noticeId, '공지사항관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
        await handleSearchList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
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
      console.log('[inlineNavigate]', pg, opts);
      if (pg === 'cmNoticeMng') { detailPanel.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      notices,
      [{ label: 'ID', key: 'noticeId' }, { label: '제목', key: 'noticeTitle' }, { label: '유형', key: 'noticeTypeCd' },
       { label: '상태', key: 'noticeStatusCd' }, { label: '조회수', key: 'viewCount' }, { label: '등록일', key: 'regDate' }],
      '공지목록.csv'
    );

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.noticeTypes    = codeStore.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses = codeStore.sgGetGrpCodes('NOTICE_STATUS');
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

    const cfSiteNm       = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode   = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    /* fnStatusBadge — 상태 배지 */
    const _NOTICE_STATUS_FB = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('NOTICE_STATUS', s, _NOTICE_STATUS_FB[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const _NOTICE_TYPE_FB = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' };
    const fnTypeBadge   = t => coUtil.cofCodeBadge('NOTICE_TYPE', t, _NOTICE_TYPE_FB[t] || 'badge-gray');

    /* fnGridRowClass — 그리드 행 클래스 */
    const fnGridRowClass = (row) => (detailPanel.selectedId === row.noticeId ? 'active' : '');

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchValue', label: '제목', type: 'text', placeholder: '제목 검색' },
      { key: 'type',        label: '유형', type: 'select', options: () => codes.noticeTypes, nullLabel: '유형 전체' },
      { key: 'status',      label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '상태 전체' },
      { type: 'label', label: '등록일' },
      { key: 'dateRange', type: 'dateRange',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'noticeTypeCd',   label: '유형',     style: 'width:80px;',
        badge: (row) => fnTypeBadge(row.noticeTypeCd) },
      { key: 'noticeTitle',    label: '제목',     sortKey: 'nm', link: true,
        fmt: (v, row) => row.isFixed === 'Y' ? `📌 ${row.noticeTitle || ''}` : (row.noticeTitle || ''),
        cellInnerStyle: (v, row) => detailPanel.selectedId === row.noticeId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'isFixed',        label: '고정',     style: 'width:70px;',
        badge: (row) => row.isFixed === 'Y' ? 'badge-red' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '고정' : '-' },
      { key: 'startDate',      label: '시작일',   style: 'width:120px;',
        fmt: (v) => v || '-' },
      { key: 'endDate',        label: '종료일',   style: 'width:120px;',
        fmt: (v) => v || '-' },
      { key: 'noticeStatusCd', label: '상태',     style: 'width:80px;',
        badge: (row) => fnStatusBadge(row.noticeStatusCd) },
      { key: 'siteNm',         label: '사이트명', style: 'width:110px;', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',        label: '등록일',   style: 'width:140px;', sortKey: 'reg' },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      notices, uiState, codes, searchParam, pager, detailPanel,                        // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                             // computed
      sortIcon, fnStatusBadge, fnTypeBadge, fnGridRowClass,                            // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes, handleSearchList,             // Dtl 콜백
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    공지사항관리
  </div>
  <!-- ===== ■. 검색 영역 =================================================== -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 (BoGrid) ========================================== -->
  <bo-grid :columns="baseGridColumns" :rows="notices" :pager="pager" row-key="noticeId"
    :sort-state="uiState" list-title="공지사항목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="key => handleSelectAction('notices-sort', key)"
    @set-page="n => handleSelectAction('notices-set-page', n)"
    @size-change="handleSelectAction('notices-size-change')"
    @row-click="row => handleSelectAction('notices-row-edit', row.noticeId)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-green btn-sm" @click="handleBtnAction('notices-excel')">
        📥 엑셀
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('notices-add')">
        + 신규
      </button>
    </template>
    <template #row-actions="{ row }">
      <div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleSelectAction('notices-row-edit', row.noticeId)">
          수정
        </button>
        <button class="btn btn-danger btn-sm" @click="handleSelectAction('notices-row-delete', row)">
          삭제
        </button>
      </div>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 (BoGrid) ========================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="detailPanel.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <cm-notice-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger"
      :tab-mode="cfIsViewMode"
      :on-list-reload="handleSearchList"
      />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

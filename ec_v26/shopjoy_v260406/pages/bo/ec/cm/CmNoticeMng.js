/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const notices       = reactive([]);                                              // 공지사항 목록
    const uiState       = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' }); // 로딩·에러·코드로드 상태
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });         // 하단 상세 패널 상태 (선택ID, view|edit)
    const codes         = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] });         // 공통코드 (유형·상태)
    const pager         = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 10,
      pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {}
    });                                                                              // 페이징 상태

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());                              // 현재 검색 조건

    // 날짜범위 옵션은 codes.date_range_opts에서 로드

    const cfSiteNm       = computed(() => boUtil.bofGetSiteNm());             // 현재 사이트명
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId); // 신규 시 null, 수정 시 ID
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__'); // 조회 모드 여부
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`); // 상세 컴포넌트 강제 재마운트 키

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // 앱 준비 완료 시 코드 로드 트리거

    // 공통코드 스토어에서 유형·상태 코드 로드
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

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

    // 조회 버튼 클릭 — 1페이지부터 재조회
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    // 초기화 버튼 클릭 — 검색 조건을 초기값으로 되돌린 후 재조회
    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      onSearch();
    };

    // 날짜범위 옵션 변경 — 선택된 옵션으로 dateStart·dateEnd 자동 세팅
    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
      pager.pageNo = 1;
    };

    // 페이지당 건수 변경 — 1페이지부터 재조회
    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // 페이지 번호 클릭
    /* setPage — 설정 */
    const setPage = (n) => {
      if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); }
    };

    const SORT_MAP = { nm: { asc: 'noticeTitle asc', desc: 'noticeTitle desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
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

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // 공지사항 목록 페이징 조회
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

    // 공지사항 삭제 — 확인 후 낙관적 UI 제거 → API 호출 → 목록 갱신
    /* handleDelete — 삭제 */
    const handleDelete = async (n) => {
      const ok = await showConfirm('삭제', `[${n.noticeTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = notices.findIndex(x => x.noticeId === n.noticeId);
      if (idx !== -1) { notices.splice(idx, 1); }
      if (uiStateDetail.selectedId === n.noticeId) { uiStateDetail.selectedId = null; }
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

    // 조회 모드로 하단 상세 열기 (같은 행 재클릭 시 닫힘)
    /* loadView — 뷰 로드 */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    // 수정 모드로 하단 상세 열기 (같은 행 재클릭 시 닫힘)
    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    // 신규 등록 폼 열기
    /* openNew — 신규 열기 */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    // 하단 상세 패널 닫기
    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    // 상세 컴포넌트 내부 navigate 인터셉터 — 목록 복귀·편집전환은 페이지 이동 없이 처리
    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      console.log('[inlineNavigate]', pg, opts);
      if (pg === 'cmNoticeMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    // 상태 코드 → badge 클래스 변환
    const _NOTICE_STATUS_FB = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('NOTICE_STATUS', s, _NOTICE_STATUS_FB[s] || 'badge-gray');

    // 유형 코드 → badge 클래스 변환
    const _NOTICE_TYPE_FB = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge   = t => coUtil.cofCodeBadge('NOTICE_TYPE', t, _NOTICE_TYPE_FB[t] || 'badge-gray');

    // 현재 목록을 CSV로 내보내기
    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      notices,
      [{ label: 'ID', key: 'noticeId' }, { label: '제목', key: 'noticeTitle' }, { label: '유형', key: 'noticeTypeCd' },
       { label: '상태', key: 'noticeStatusCd' }, { label: '조회수', key: 'viewCount' }, { label: '등록일', key: 'regDate' }],
      '공지목록.csv'
    );

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm'/'reg' 와 sortKey 일치) */
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'searchValue', label: '제목', type: 'text', placeholder: '제목 검색' },
      { key: 'type',        label: '유형', type: 'select', options: () => codes.noticeTypes, nullLabel: '유형 전체' },
      { key: 'status',      label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '상태 전체' },
      { type: 'label', label: '등록일' },
      { key: 'dateRange', type: 'dateRange',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    const listGridColumns = [
      { key: 'noticeTypeCd',   label: '유형',     style: 'width:80px;',
        badge: (row) => fnTypeBadge(row.noticeTypeCd) },
      { key: 'noticeTitle',    label: '제목',     sortKey: 'nm', link: true,
        fmt: (v, row) => row.isFixed === 'Y' ? `📌 ${row.noticeTitle || ''}` : (row.noticeTitle || ''),
        cellInnerStyle: (v, row) => uiStateDetail.selectedId === row.noticeId ? 'color:#e8587a;font-weight:700;' : '' },
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
    /* fnGridRowClass — 유틸 */
    const fnGridRowClass = (row) => (uiStateDetail.selectedId === row.noticeId ? 'active' : '');

    // ===== return (템플릿 노출) ===============================================


    return {
      uiStateDetail, notices, uiState, codes, pager,
      searchParam,
      selectedId: computed(() => uiStateDetail.selectedId),
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,
      onSearch, onReset, onDateRangeChange, onSizeChange, setPage,
      handleSearchList, handleDelete, handleLoadDetail, loadView,
      openNew, closeDetail, inlineNavigate,
      fnStatusBadge, fnTypeBadge, exportExcel, onSort, sortIcon,
      baseSearchColumns, listGridColumns, fnGridRowClass,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">공지사항관리</div>
  <!-- ===== ■. 검색 영역 =================================================== -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 (BoGrid) ========================================== -->
  <bo-grid :columns="listGridColumns" :rows="notices" :pager="pager" row-key="noticeId"
    :sort-state="uiState" list-title="공지사항목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="row => handleLoadDetail(row.noticeId)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </template>
    <template #row-actions="{ row }">
      <div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.noticeId)">수정</button>
        <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
      </div>
    </template>
  </bo-grid>
</div>
  <!-- ===== □. 목록 영역 (BoGrid) ========================================== -->
<!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
<div v-if="selectedId" style="margin-top:4px;">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
    <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <cm-notice-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :show-toast="showToast"
    :show-confirm="showConfirm"
    :set-api-res="setApiRes"
    :dtl-id="cfDetailEditId"
    :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    :reload-trigger="uiStateDetail.reloadTrigger"
    :tab-mode="cfIsViewMode"
    
    :on-list-reload="handleSearchList"
    />
</div>
</div>

  <!-- ===== □. 영역 ====================================================== -->`
};

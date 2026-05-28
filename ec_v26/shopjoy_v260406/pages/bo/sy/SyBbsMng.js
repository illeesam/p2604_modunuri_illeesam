/* ShopJoy Admin - 게시글관리 */
window.SyBbsMng = {
  name: 'SyBbsMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const bbsList = reactive([]);                  // 게시글 목록 (메인 그리드 데이터)
    const bbms = reactive([]);                     // 게시판 마스터 (select 옵션용)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
    });
    const codes = reactive({ bbs_status: [], bbs_post_statuses: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'authorNm asc', desc: 'authorNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    const baseGrid = coUtil.cofGrid(() => handleSearchBbs(), { sortMap: SORT_MAP, pageSize: 5 });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', bbmId: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view',     // 'view' | 'edit'
      reloadTrigger: 0,    // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbsMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchBbs();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.reset();
        return handleSearchBbs();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 게시글 신규 등록 (인라인 패널)
      } else if (cmd === 'bbsList-add') {
        return openNew();
      // 게시글 목록 엑셀 내보내기
      } else if (cmd === 'bbsList-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbsMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'bbsList-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'bbsList-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'bbsList-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 수정 버튼 → 편집 패널 열기
      } else if (cmd === 'bbsList-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'bbsList-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchBbs — 게시글 목록 조회 */
    const handleSearchBbs = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) params.searchType = 'bbsTitle,authorNm';
        const d = (await boApiSvc.syBbs.getPage(params, '게시판관리', '목록조회')).data?.data;
        const list = baseGrid.applyPage(d);
        bbsList.splice(0, bbsList.length, ...list);
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleLoadBbmList — 게시판 마스터 목록 조회 (초기 로드 시에만) */
    const handleLoadBbmList = async () => {
      try {
        const res = await boApiSvc.syBbm.getPage({ pageNo: 1, pageSize: 10000 }, '게시판관리', '목록조회');
        bbms.splice(0, bbms.length, ...(res.data?.data?.list || []));
      } catch (err) {
        console.error('[handleLoadBbmList]', err);
      }
    };

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      baseGrid.pager.pageNo = 1;
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

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 (토글) */
    const handleLoadDetail = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') {
        detailModal.show = false; detailModal.dtlId = null; return;
      }
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbsMng') {
        detailModal.show = false;
        detailModal.dtlId = null;
        if (opts.reload) handleSearchBbs();
        return;
      }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (b) => {
      const ok = await showConfirm('삭제', `[${b.bbsTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = bbsList.findIndex(x => x.bbsId === b.bbsId);
      if (idx !== -1) { bbsList.splice(idx, 1); }
      if (detailModal.dtlId === b.bbsId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.syBbs.remove(b.bbsId, '게시판관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(bbsList, [
      { label: 'ID', key: 'bbsId' }, { label: '제목', key: 'bbsTitle' },
      { label: '작성자', key: 'authorNm' }, { label: '조회수', key: 'viewCount' },
      { label: '상태', key: 'bbsStatusCd' }, { label: '등록일', key: 'regDate' },
    ], '게시글목록.csv');

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
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
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadBbmList();
      await handleSearchBbs('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* 게시판 게시물 fnStatusBadge */
    const _BBS_POST_STATUS_FB = { PUBLISH: 'badge-green', DRAFT: 'badge-gray', DELETED: 'badge-red', PRIVATE: 'badge-orange' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('BBS_POST_STATUS', s, _BBS_POST_STATUS_FB[s] || 'badge-gray');

    /* bbmNm — 게시판명 변환 */
    const bbmNm = (bbmId) => { const b = bbms.find(x => x.bbmId === bbmId); return b ? b.bbmNm : bbmId; };

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (b) => detailModal.dtlId === b.bbsId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfBbmOptions = computed(() => bbms.map(b => ({ value: b.bbmId, label: b.bbmNm })));
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'bbsTitle', label: '제목' },
          { value: 'authorNm', label: '작성자' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'bbmId', type: 'select', label: '게시판', options: () => cfBbmOptions.value, nullLabel: '게시판 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.bbs_post_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'bbmId',        label: '게시판', badge: () => 'badge-gray', fmt: (v) => bbmNm(v) },
      { key: 'bbsTitle',     label: '제목', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'authorNm',     label: '작성자' },
      { key: 'viewCount',    label: '조회수', align: 'center' },
      { key: 'commentCount', label: '댓글', align: 'center' },
      { key: 'attachGrpId',  label: '첨부그룹', cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'bbsStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.bbsStatusCd) },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',      label: '등록일', sortKey: 'reg', fmt: (v) => String(v || '').slice(0, 10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      bbsList, uiState, codes, searchParam, baseGrid, detailModal,                       // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                                // 컬럼 정의
      handleBtnAction, handleSelectAction,                                               // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                               // computed
      fnRowStyle,                                                                        // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes, handleSearchBbs,                // Dtl props (closure 필요)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    게시글관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid
    :columns="baseGridColumns" :rows="bbsList" :pager="baseGrid.pager" row-key="bbsId"
    list-title="게시글목록" :count-text="baseGrid.pager.pageTotalCount + '건'"
    :sort-state="baseGrid" :row-style="fnRowStyle"
    @sort="key => handleSelectAction('bbsList-sort', key)"
    @set-page="n => handleSelectAction('bbsList-pager-setPage', n)"
    @size-change="handleSelectAction('bbsList-pager-sizeChange')"
    @row-click="row => handleSelectAction('bbsList-rowEdit', row.bbsId)">
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="handleBtnAction('bbsList-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('bbsList-add')">
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
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('bbsList-rowEdit', row.bbsId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('bbsList-rowDelete', row)">
            삭제
          </button>
        </div>
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <sy-bbs-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailModal.reloadTrigger"
      :on-list-reload="handleSearchBbs" />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

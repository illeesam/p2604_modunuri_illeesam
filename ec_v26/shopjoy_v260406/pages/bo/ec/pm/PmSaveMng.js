/* ShopJoy Admin - 판촉마일리지 관리 목록 + 하단 PmSaveDtl 임베드 */
window.PmSaveMng = {
  name: 'PmSaveMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* ##### [01] 초기 변수 정의 #################################################### */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 적립금 신규 등록
      } else if (cmd === 'saves-add') {
        return openNew();
      // 적립금 엑셀 내보내기
      } else if (cmd === 'saves-excel') {
        return exportExcel();
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬
      } else if (cmd === 'saves-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'saves-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'saves-pager-sizeChange') {
        return onSizeChange();
      // 행/셀 클릭 → 상세 보기모드
      } else if (cmd === 'saves-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmSaveMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'saves-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.saveId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.saveId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const saves = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, saveList: [], tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      save_statuses: [],
      save_issue_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false });

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    // ===== 공통코드 로딩 ===================================================
    /* 적립금 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.save_statuses = codeStore.sgGetGrpCodes('SAVE_STATUS');
        codes.save_issue_types = codeStore.sgGetGrpCodes('SAVE_ISSUE_TYPE');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ===== 정렬 처리 =======================================================
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 적립금 onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
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

    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'saveNm,saveId';
        }
        const res = await boApiSvc.pmSave.getPage(params, '적립금관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        saves.splice(0, saves.length, ...list);
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        coUtil.cofBuildPagerNums(pager);
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ===== 검색 파라미터 + 라이프사이클 ====================================
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== 날짜 범위 변경 / 사이트명 / 페이저 / 하단 상세 상태 ===============
    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 활성) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmSaveMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode   = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    // ===== 페이저 번호 빌더 ================================================

    // ===== 배지(badge) 헬퍼 ================================================
    /* 적립금 fnTypeBadge — sy_code SAVE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _SAVE_TYPE_FB = { '구매적립': 'badge-green', '회원가입': 'badge-blue', '리뷰적립': 'badge-orange', '출석체크': 'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge   = t => coUtil.cofCodeBadge('SAVE_TYPE_KR', t, _SAVE_TYPE_FB[t] || 'badge-gray');

    /* 적립금 fnStatusBadge */
    const _SAVE_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _SAVE_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* handleDelete — 삭제 */
    const handleDelete = async (s) => {
      const ok = await showConfirm('삭제', `[${s.saveNm}] 마일리지를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = (saves || []).findIndex(x => x.saveId === s.saveId);
      if (idx !== -1) { saves.splice(idx, 1); }
      if (detailPanel.selectedId === s.saveId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmSave.remove(s.saveId, '적립금관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(saves,
      [{label:'ID',key:'saveId'},{label:'마일리지명',key:'saveNm'},{label:'유형',key:'saveType'},{label:'적립값',key:'saveVal'},{label:'단위',key:'saveUnit'},{label:'상태',key:'saveStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '마일리지목록.csv');

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'saveNm', label: '마일리지명' },
          { value: 'saveId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.save_issue_types, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.promo_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'saveNm',     label: '마일리지명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'saveType',   label: '유형', badge: (row) => fnTypeBadge(row.saveType) },
      { key: 'saveVal',    label: '적립값', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'saveUnit',   label: '단위', cellStyle: 'color:#555', fmt: (v) => v || '원' },
      { key: 'expireDay',  label: '유효기간', cellStyle: 'color:#555',
        fmt: (v) => (v || 365) + '일' },
      { key: 'startDate',  label: '시작일', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'endDate',    label: '종료일',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'saveStatus', label: '상태', badge: (row) => fnStatusBadge(row.saveStatus) },
      { key: 'siteNm',     label: '사이트', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      saves, uiState, codes, searchParam, pager, detailPanel,                        // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      tabMode,                                                                       // toRef
      fnTypeBadge, fnStatusBadge, sortIcon,                                          // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,               // 콜백 / 전역
    };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<bo-page title="마일리지관리">
  <!-- ===== ■. 검색영역 ==================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <bo-container title="마일리지목록" :count-text="pager.pageTotalCount + '건'">
    <!-- ===== ■.■. 툴바 액션: 탭모드 토글 + 엑셀/신규 =================================== -->
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('saves-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('saves-add')">
          + 신규
        </button>
      </div>
    </template>
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="saves" row-key="saveId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(s) => detailPanel.selectedId===s.saveId ? 'background:#fff8f9;' : ''" @sort="key => handleBtnAction('saves-sort', key)" grid-id="saves-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: s, gridId }">
        <div class="actions">
          <button class="btn btn-blue btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_edit', s)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_delete', s)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="saves.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(s, idx) in saves" :key="s?.saveId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="detailPanel.selectedId===s.saveId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('saves-rowView', s.saveId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (pager.pageNo-1)*pager.pageSize + idx + 1 }}</span> 마일리지 #{{ s.saveId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('saves-rowView', s.saveId)" :style="detailPanel.selectedId===s.saveId?{color:'#e8587a'}:{}">
            {{ s.saveNm }}
            <span v-if="detailPanel.selectedId===s.saveId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(s.saveType)" style="font-size:11px;">
              {{ s.saveType }}
            </span>
            <span class="badge" :class="fnStatusBadge(s.saveStatus)" style="font-size:11px;">
              {{ s.saveStatus }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ (s.saveVal||0).toLocaleString() }}{{ s.saveUnit || '원' }}
            </div>
            <div>
              📅 {{ s.startDate }} ~ {{ s.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              유효기간 {{ s.expireDay || 365 }}일
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn-blue btn-sm" @click.stop="handleGridCellAction('saves-cellClick', 'btn_edit', s)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click.stop="handleGridCellAction('saves-cellClick', 'btn_delete', s)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ s.saveId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager v-if="pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleBtnAction('saves-pager-setPage', n)" :on-size-change="() => handleSelectAction('saves-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세영역: PmSaveDtl 인라인 임베드 ============================== -->
  <bo-container bare>
    <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-save-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      />
  </bo-container>
</bo-page>
`
};

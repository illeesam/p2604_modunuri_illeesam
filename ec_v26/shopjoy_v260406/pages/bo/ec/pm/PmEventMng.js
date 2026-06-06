/* ShopJoy Admin - 이벤트관리 목록 + 하단 EventDtl 임베드 */
window.PmEventMng = {
  name: 'PmEventMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const events = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      event_statuses: [],
      date_range_opts: [],
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    /* 하단 상세 */
    const detailPanel = reactive({
      selectedId: '__new__',  // 진입 시 빈 신규 폼 (자동 첫 행 오픈 안 함)
      openMode: 'edit',
      reloadTrigger: 0,
      resetSeq: 0,            // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,          // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmEventMng.js : handleBtnAction -> ', cmd, param);
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
      // 이벤트 신규 등록
      } else if (cmd === 'events-add') {
        return openNew();
      // 이벤트 목록 엑셀 내보내기
      } else if (cmd === 'events-excel') {
        return exportExcel();
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬
      } else if (cmd === 'events-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'events-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmEventMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'events-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행/제목 클릭 → 상세 보기모드
      } else if (cmd === 'events-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 기준 분기 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmEventMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'events-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.eventId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.eventId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 이벤트 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.event_statuses = codeStore.sgGetGrpCodes('EVENT_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'eventNm asc', desc: 'eventNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 이벤트 onSort */
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

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmEvent.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) }, '이벤트관리', '목록조회');
        const data = res.data?.data;
        events.splice(0, events.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        coUtil.cofBuildPagerNums(pager);
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    /* loadView — 뷰 로드 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmEventMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);


    /* 이벤트 fnStatusBadge */
    const _EVENT_STATUS_FB = { '진행중': 'badge-green', '예정': 'badge-blue', '종료': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('EVENT_STATUS_KR', s, _EVENT_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (e) => {
      const ok = await showConfirm('삭제', `[${e.eventTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(events)) { return; }
      const idx = events.findIndex(x => x.eventId === e.eventId);
      if (idx !== -1) { events.splice(idx, 1); }
      if (detailPanel.selectedId === e.eventId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmEvent.remove(e.eventId, '이벤트관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(events, [{label:'ID',key:'eventId'},{label:'이벤트명',key:'eventNm'},{label:'제목',key:'eventTitle'},{label:'유형',key:'eventTypeCd'},{label:'상태',key:'eventStatusCd'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'},{label:'등록일',key:'regDate'}], '이벤트목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '이벤트 제목', placeholder: '이벤트 제목 검색' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.event_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'eventTitle',     label: '이벤트 제목', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'targetProducts', label: '대상상품',
        fmt: (v) => (v || []).length + '개 상품' },
      { key: 'authRequired',   label: '인증필요',
        badge: (row) => row.authRequired ? 'badge-orange' : 'badge-gray',
        fmt: (v) => v ? '필요' : '불필요' },
      { key: 'startDate',      label: '시작일',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'endDate',        label: '종료일',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'eventStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.eventStatusCd) },
      { key: 'regDate',        label: '등록일', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'siteNm',         label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      events, uiState, codes, searchParam, pager, detailPanel,                       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      tabMode,                                                                       // toRef
      fnStatusBadge, sortIcon,                                                       // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,               // 콜백 / 전역
    };
  },
  template: /* html */`
<bo-page title="이벤트관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="이벤트목록" :count-text="pager.pageTotalCount + '건'">
    <template #toolbar-actions>
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
      <button class="btn btn-green btn-sm" @click="handleBtnAction('events-excel')">
        📥 엑셀
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('events-add')">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 리스트 뷰 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="events" row-key="eventId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(e) => detailPanel.selectedId===e.eventId ? 'background:#fff8f9;' : ''" @sort="key => handleBtnAction('events-sort', key)" grid-id="events-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: e, gridId }">
        <div class="actions" style="display:flex;gap:6px;align-items:center;justify-content:center;">
          <button class="btn btn-blue btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_edit', e)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_delete', e)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="events.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(e, idx) in events" :key="e?.eventId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="detailPanel.selectedId===e.eventId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('events-rowView', e.eventId)">
        <!-- ===== ■.■.■.■. 배너 이미지 ============================================ -->
        <div v-if="e.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="e.bannerImage">
        </div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (pager.pageNo-1)*pager.pageSize + idx + 1 }}</span> 이벤트 #{{ e.eventId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('events-rowView', e.eventId)" :style="detailPanel.selectedId===e.eventId?{color:'#e8587a'}:{}">
            {{ e.eventTitle }}
            <span v-if="detailPanel.selectedId===e.eventId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(e.eventStatusCd)" style="font-size:11px;">
              {{ e.eventStatusCd }}
            </span>
            <span class="badge" :class="e.authRequired ? 'badge-orange' : 'badge-gray'" style="font-size:11px;">
              {{ e.authRequired ? '인증필요' : '인증불필요' }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ (e.targetProducts||[]).length }}개 상품
            </div>
            <div>
              📅 {{ e.startDate }} ~ {{ e.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              등록 {{ e.regDate }}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn-blue btn-sm" @click.stop="handleGridCellAction(gridId, 'btn_edit', row)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click.stop="handleGridCellAction(gridId, 'btn_delete', row)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ e.eventId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이저 ================================================== -->
    <bo-pager v-if="pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleBtnAction('events-pager-setPage', n)" :on-size-change="() => handleSelectAction('events-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세: EventDtl 임베드 ===================================== -->
  <bo-container bare>
    <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-event-dtl
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

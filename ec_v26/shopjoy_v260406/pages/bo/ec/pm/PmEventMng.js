/* ShopJoy Admin - 이벤트관리 목록 + 하단 EventDtl 임베드 */
window.PmEventMng = {
  name: 'PmEventMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
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
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

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
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-date-range') {
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmEventMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬
      if (cmd === 'events-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'events-set-page') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'events-size-change') {
        return onSizeChange();
      // 행 클릭 → 상세 편집
      } else if (cmd === 'events-row-edit') {
        return handleLoadDetail(param);
      // 행 삭제
      } else if (cmd === 'events-row-delete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 이벤트 fnLoadCodes */
    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) =================================

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
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

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
        const res = await boApiSvc.pmEvent.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '이벤트관리', '목록조회');
        const data = res.data?.data;
        events.splice(0, events.length, ...(data?.pageList || []));
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
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailPanel.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmEventMng') { detailPanel.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

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
      if (detailPanel.selectedId === e.eventId) { detailPanel.selectedId = null; }
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

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    // --- [컬럼 정의] ---
    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', label: '이벤트 제목', placeholder: '이벤트 제목 검색' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.event_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'eventTitle',     label: '이벤트 제목', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'targetProducts', label: '대상상품',
        fmt: (v) => (v || []).length + '개 상품' },
      { key: 'authRequired',   label: '인증필요',
        badge: (row) => row.authRequired ? 'badge-orange' : 'badge-gray',
        fmt: (v) => v ? '필요' : '불필요' },
      { key: 'startDate',      label: '시작일' },
      { key: 'endDate',        label: '종료일' },
      { key: 'eventStatusCd',  label: '상태', badge: (row) => fnStatusBadge(row.eventStatusCd) },
      { key: 'regDate',        label: '등록일', sortKey: 'reg' },
      { key: 'siteNm',         label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      events, uiState, codes, searchParam, pager, detailPanel,                       // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                            // 컬럼 정의
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      tabMode,                                                                       // toRef
      fnStatusBadge, sortIcon,                                                       // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,               // 콜백 / 전역
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    이벤트관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        이벤트목록
        <span class="list-count">
          {{ pager.pageTotalCount }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
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
      </div>
    </div>
    <!-- ===== ■.■. 리스트 뷰 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="events" :pager="pager" row-key="eventId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(e) => detailPanel.selectedId===e.eventId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('events-sort', key)" @row-click="e => handleSelectAction('events-row-edit', e.eventId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: e }">
        <div class="actions" style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('events-row-edit', e.eventId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('events-row-delete', e)">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ e.eventId }}
          </span>
        </div>
      </template>
    </bo-grid>
    <!-- ===== □.□. 리스트 뷰 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="events.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="e in events" :key="e?.eventId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="detailPanel.selectedId===e.eventId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('events-row-edit', e.eventId)">
        <!-- ===== ■.■.■.■. 배너 이미지 ============================================ -->
        <div v-if="e.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="e.bannerImage">
        </div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            이벤트 #{{ e.eventId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('events-row-edit', e.eventId)" :style="detailPanel.selectedId===e.eventId?{color:'#e8587a'}:{}">
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
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('events-row-edit', e.eventId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('events-row-delete', e)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ e.eventId }}
          </span>
        </div>
      </div>
    </div>
    <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('events-set-page', n)" :on-size-change="() => handleSelectAction('events-size-change')" />
  </div>
  <!-- ===== □.□. 카드 뷰 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: EventDtl 임베드 ===================================== -->
  <div v-if="detailPanel.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-event-dtl
      :key="detailPanel.selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"

      :reload-trigger="detailPanel.reloadTrigger"
      :on-list-reload="handleBtnAction"
      />
  </div>
</div>
<!-- ===== □. 하단 상세: EventDtl 임베드 ===================================== -->
`
};

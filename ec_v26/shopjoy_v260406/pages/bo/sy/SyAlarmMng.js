/* ShopJoy Admin - 알림관리 */
window.SyAlarmMng = {
  name: 'SyAlarmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const alarms = reactive([]);                   // 알림 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ alarm_type: [], alarm_status: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'alarmTitle asc', desc: 'alarmTitle desc' }, reg: { asc: 'alarmSendDate asc', desc: 'alarmSendDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 표시경로 선택 모달 (sy_path) ===== */
    const pathPickModal = reactive({ show: false, row: null });

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view',      // 'view' | 'edit'
      reloadTrigger: 0,     // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmMng.js : handleBtnAction -> ', cmd, param);
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
      // 알림 신규 등록 (인라인 패널)
      } else if (cmd === 'alarms-add') {
        return openNew();
      // 알림 목록 엑셀 내보내기
      } else if (cmd === 'alarms-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'alarms-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'alarms-set-page') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'alarms-size-change') {
        return onSizeChange();
      // 그리드 행 수정 버튼 → 편집 패널 열기
      } else if (cmd === 'alarms-row-edit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'alarms-row-delete') {
        return handleDelete(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        pager.pageNo = 1;
        return handleSearchList();
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
      handleSearchList();
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'alarmTitle,alarmMsg';
        }
        const res = await boApiSvc.syAlarm.getPage(params, '알람관리', '목록조회');
        const data = res.data?.data;
        alarms.splice(0, alarms.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || alarms.length;
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

    /* openPathPick — 표시경로 선택 모달 열기 */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* closePathPick — 표시경로 선택 모달 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* onPathPicked — 표시경로 선택 결과 적용 */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') { row._row_status = 'U'; }
      }
    };

    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
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
      if (pg === 'syAlarmMng') {
        detailModal.show = false;
        detailModal.dtlId = null;
        if (opts.reload) { handleSearchList('RELOAD'); }
        return;
      }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (a) => {
      const ok = await showConfirm('삭제', `[${a.alarmTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = alarms.findIndex(x => x.alarmId === a.alarmId);
      if (idx !== -1) { alarms.splice(idx, 1); }
      if (detailModal.dtlId === a.alarmId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.syAlarm.remove(a.alarmId, '알람관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(alarms, [
      { label: 'ID', key: 'alarmId' }, { label: '유형', key: 'alarmTypeCd' },
      { label: '채널', key: 'channelCd' }, { label: '제목', key: 'alarmTitle' },
      { label: '메시지', key: 'alarmMsg' }, { label: '상태', key: 'alarmStatusCd' },
      { label: '발송일', key: 'alarmSendDate' },
    ], '알림목록.csv');

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.alarm_type = codeStore.sgGetGrpCodes('ALARM_TYPE');
      codes.alarm_status = codeStore.sgGetGrpCodes('ALARM_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== 사용자 함수 (헬퍼 / 컬럼 정의) ====================================

    /* 알람 fnStatusBadge */
    const _ALARM_STATUS_FB = { '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('ALARM_STATUS', s, _ALARM_STATUS_FB[s] || 'badge-gray');

    /* 알람 fnTypeBadge */
    const _ALARM_TYPE_FB = { '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('ALARM_TYPE', t, _ALARM_TYPE_FB[t] || 'badge-gray');

    /* 알람 fnTargetBadge */
    const _ALARM_TARGET_TYPE_FB = { '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' };
    /* fnTargetBadge — 대상 배지 */
    const fnTargetBadge = t => coUtil.cofCodeBadge('ALARM_TARGET_TYPE', t, _ALARM_TARGET_TYPE_FB[t] || 'badge-gray');

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (a) => detailModal.dtlId === a.alarmId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'alarmTitle', label: '제목' },
          { value: 'alarmMsg',   label: '메시지' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.alarm_type, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.alarm_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '발송일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    const baseGridColumns = [
      { key: 'pathId',        label: '표시경로',
        pathLabelOpen: { label: pathLabel, open: (row) => handleSelectAction('pathModal-open', row), placeholder: '경로 선택...' } },
      { key: 'alarmTypeCd',   label: '유형', badge: (row) => fnTypeBadge(row.alarmTypeCd) },
      { key: 'alarmTitle',    label: '제목', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'alarmMsg',      label: '메시지', cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' },
      { key: 'targetTypeCd',  label: '대상', badge: (row) => fnTargetBadge(row.targetTypeCd) },
      { key: 'alarmSendDate', label: '발송일', fmt: (v) => v || '-' },
      { key: 'alarmStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.alarmStatusCd) },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',       label: '등록일', sortKey: 'reg' },
    ];

    // ===== return (템플릿 노출) ===============================================

    return {
      alarms, uiState, codes, searchParam, pager, detailModal, pathPickModal,         // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                             // computed
      fnRowStyle,                                                                      // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes,                               // Dtl props (closure 필요)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    알림관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_alarm" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    <div>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid
        :columns="baseGridColumns" :rows="alarms" :pager="pager" row-key="alarmId"
        list-title="알림목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleSelectAction('alarms-sort', key)"
        @set-page="n => handleSelectAction('alarms-set-page', n)"
        @size-change="handleSelectAction('alarms-size-change')"
        @row-click="row => handleSelectAction('alarms-row-edit', row.alarmId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="handleBtnAction('alarms-excel')">
              📥 엑셀
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('alarms-add')">
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
              <button class="btn btn-blue btn-sm" @click="handleSelectAction('alarms-row-edit', row.alarmId)">
                수정
              </button>
              <button class="btn btn-danger btn-sm" @click="handleSelectAction('alarms-row-delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 경로 트리 ================================================= -->
    <!-- ===== ■.■. 상세 인라인 패널 (grid 직접 자식 → 전체 폭) ===================== -->
    <div v-if="detailModal.show" style="grid-column:1/-1;margin-top:4px;">
      <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
          ✕ 닫기
        </button>
      </div>
      <sy-alarm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
        :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
        :reload-trigger="detailModal.reloadTrigger" />
    </div>
    <!-- ===== ■.■. 표시경로 선택 모달 ========================================== -->
    <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_alarm" :value="pathPickModal.row ? pathPickModal.row.pathId : null" @select="pathId => handleSelectAction('pathModal-pick', pathId)" @close="handleBtnAction('pathModal-close')" />
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
</div>
`,
};

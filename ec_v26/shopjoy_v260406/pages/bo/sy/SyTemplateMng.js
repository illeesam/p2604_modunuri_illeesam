/* ShopJoy Admin - 템플릿관리 목록 */
window.SyTemplateMng = {
  name: 'SyTemplateMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const templates = reactive([]);                // 템플릿 목록 (그리드 데이터)
    const templateCounts = reactive({});            // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState   = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes     = reactive({ template_type: [], use_yn: [], template_types: ['메일템플릿','문자템플릿','MMS템플릿','kakao톡템플릿','kakao알림톡템플릿','시스템알림','회원알림'], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'templateNm asc', desc: 'templateNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyTemplateMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = '';
        uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 템플릿 신규 등록 (인라인 패널)
      } else if (cmd === 'templates-add') {
        return openNew();
      // 엑셀 내보내기
      } else if (cmd === 'templates-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      // 미리보기 모달 닫기
      } else if (cmd === 'previewModal-close') {
        previewModal.show = false;
        return;
      // 발송 모달 닫기
      } else if (cmd === 'sendModal-close') {
        sendModal.show = false;
        return;
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'templates-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'templates-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyTemplateMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 경로 트리 노드 선택 → 그리드 필터링 + 상세 패널 닫기
      if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      // 페이지 크기 변경
      } else if (cmd === 'templates-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 그리드 행 클릭 / 수정 버튼 → 편집 패널 열기
      } else if (cmd === 'templates-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'templates-rowDelete') {
        return handleDelete(param);
      // 그리드 행 미리보기
      } else if (cmd === 'templates-rowPreview') {
        return showPreview(param);
      // 그리드 행 발송
      } else if (cmd === 'templates-rowSend') {
        return openSend(param);
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

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 기준 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, e = {}) => {
      console.log(' ■■ SyTemplateMng.js : handleGridCellAction -> ', cmd, e.colKey, e.row);
      if (cmd === 'templates-cellClick') {
        // 컬럼별 분기 필요 시 e.colKey 사용. 일반 셀 → 상세 보기모드로 열기
        return loadView(e.row.templateId);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyTemplateMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) { closePathPick(); return; }
        return onPathPicked(result);
      } else if (cmd === 'template-preview') {
        if (result == null) { previewModal.show = false; return; }
        return;
      } else if (cmd === 'template-send') {
        if (result == null) { sendModal.show = false; return; }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', useYn: 'Y', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null }); // 표시경로 선택 모달 상태

    /* -- 상세 인라인 패널 (진입 시 빈 신규 폼, 항상 표시) -- */
    const detailPanel = reactive({
      selectedId: '__new__',         // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',              // 'view' | 'edit'
      reloadTrigger: 0,
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    }); // 상세 인라인 패널 상태

    /* -- 미리보기 / 발송 모달 -- */
    const previewModal = reactive({ show: false, template: null }); // 미리보기 모달
    const sendModal    = reactive({ show: false, template: null }); // 발송하기 모달

    const cfSiteNm        = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId  = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode    = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey     = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);
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
      pager.pageNo = 1;
      handleSearchList();
    };
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syTemplate.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(templateCounts).forEach(k => { delete templateCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) templateCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };


    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'templateNm,templateSubject';
        }
        const res = await boApiSvc.syTemplate.getPage(params, '템플릿관리', '목록조회');
        const data = res.data?.data;
        templates.splice(0, templates.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || templates.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* onPathPicked — 경로 선택 결과 적용 + 즉시 저장
     *   템플릿 목록은 별도 [저장] 버튼이 없어 행의 pathId 가 바뀌면 바로 서버에 반영.
     *   selective update — body 에 pathId 만 담아 다른 컬럼 보존. */
    const onPathPicked = async (pathId) => {
      const row = pathPickModal.row;
      if (!row || !row.templateId) { return; }
      const prevPathId = row.pathId;
      row.pathId = pathId;
      try {
        await boApiSvc.syTemplate.update(row.templateId, { pathId }, '템플릿관리', '표시경로변경');
        showToast?.('표시경로가 저장되었습니다.', 'success');
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[onPathPicked] save failed', err);
        row.pathId = prevPathId;   // 실패 시 롤백
        showToast?.(err.response?.data?.message || '표시경로 저장 실패', 'error', 0);
      }
    };

    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.template_type = codeStore.sgGetGrpCodes('TEMPLATE_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
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
      if (pg === 'syTemplateMng') {
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

    /* showPreview — 미리보기 모달 열기 */
    const showPreview = (t) => { previewModal.template = t; previewModal.show = true; };

    /* openSend — 발송 모달 열기 */
    const openSend = (t) => { sendModal.template = t; sendModal.show = true; };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (t) => {
      const ok = await showConfirm('삭제', `[${t.templateNm}] 템플릿을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = templates.findIndex(x => x.templateId === t.templateId);
      if (idx !== -1) { templates.splice(idx, 1); }
      if (detailPanel.selectedId === t.templateId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.syTemplate.remove(t.templateId, '템플릿관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(templates, [
      { label: 'ID', key: 'templateId' },
      { label: '템플릿명', key: 'templateNm' },
      { label: '유형', key: 'templateTypeCd' },
      { label: '사용여부', key: 'useYn' },
      { label: '등록일', key: 'regDate' },
    ], '템플릿목록.csv');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[t] || 'badge-gray');

    /* fnUseYnBadge — 사용여부 배지 */
    const fnUseYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (t) => detailPanel.selectedId === t.templateId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'templateNm',      label: '템플릿명' },
          { value: 'templateSubject', label: '제목' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.template_types, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',         label: '표시경로', style: 'width:170px;max-width:170px;',
        pathLabelOpen: { label: pathLabel, open: (row) => handleSelectAction('pathModal-open', row), placeholder: '경로 선택...' } },
      { key: 'templateId',     label: 'ID' },
      { key: 'templateTypeCd', label: '템플릿유형', badge: (row) => fnTypeBadge(row.templateTypeCd) },
      { key: 'templateCode',   label: '템플릿코드',
        cellInnerStyle: 'background:#f5f5f5;padding:1px 5px;border-radius:3px;font-size:11px;color:#555;font-family:monospace;' },
      { key: 'templateNm',     label: '템플릿명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'templateSubject', label: '제목(Subject)', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: 'useYn',          label: '사용여부', badge: (row) => fnUseYnBadge(row.useYn), fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',        label: '등록일', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'siteNm',         label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      templates, uiState, templateCounts, codes, searchParam, pager, detailPanel, pathPickModal, previewModal, sendModal, // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfIsViewMode, cfDetailKey,                                                           // computed
      fnRowStyle,                                                                                          // 헬퍼
      inlineNavigate, handleSearchList,                                                                    // Dtl 콜백 (closure 필요)
      showToast, showConfirm, setApiRes,                                                                   // Dtl/모달 props
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    템플릿관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:0 12px;align-items:flex-start;">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_template" title="표시경로" :show-biz-cd="false" :counts="templateCounts"
      :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    <div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid
        :columns="columns.baseGrid" :rows="templates" row-key="templateId" :selected-key="detailPanel.selectedId"
        list-title="템플릿목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleBtnAction('templates-sort', key)"
        @cell-click="e => handleGridCellAction('templates-cellClick', e)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="handleBtnAction('templates-excel')">
              📥 엑셀
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('templates-add')">
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
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn-secondary btn-xs" @click="handleSelectAction('templates-rowPreview', row)">
                미리보기
              </button>
              <button class="btn btn-xs" style="background:#52c41a;color:#fff;border-color:#52c41a;" @click="handleSelectAction('templates-rowSend', row)">
                발송
              </button>
              <button class="btn btn-blue btn-xs" @click="handleSelectAction('templates-rowEdit', row.templateId)">
                수정
              </button>
              <button class="btn btn-danger btn-xs" @click="handleSelectAction('templates-rowDelete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
        <!-- 페이저를 그리드 카드 내부 하단(#footer)에 배치 → 템플릿목록 영역 안에 보이도록 -->
        <template #footer>
          <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('templates-pager-setPage', n)" :on-size-change="() => handleSelectAction('templates-pager-sizeChange')" />
        </template>
      </bo-grid>
      <!-- ===== ■.■.■. 미리보기/발송 모달 (position:fixed) ========================= -->
      <template-preview-modal v-if="previewModal && previewModal.show" :tmpl="previewModal.template" :sample-params="previewModal.template?.sampleParams || '{}'" modal-name="template-preview" :on-callback="fnCallbackModal" />
      <template-send-modal v-if="sendModal && sendModal.show" :tmpl="sendModal.template" :show-toast="showToast" :show-confirm="showConfirm" modal-name="template-send" :on-callback="fnCallbackModal" />
    </div>
    <!-- ===== □.□. 경로 트리 ================================================= -->
    <!-- ===== ■.■. 수정 패널 (grid 직접 자식 → 전체 폭, 항상 표시) ============================= -->
    <div style="grid-column:1/-1;">
      <sy-template-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
        :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
        :active="detailPanel.active"
        :reload-trigger="detailPanel.reloadTrigger"
        :on-list-reload="handleSearchList" />
    </div>
    <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_template" :value="pathPickModal.row ? pathPickModal.row.pathId : null" modal-name="path-pick" :on-callback="fnCallbackModal" />
  </div>
  <!-- ===== □.□. 수정 패널 (grid 직접 자식 → 전체 폭) ============================= -->
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
</div>
`,
};

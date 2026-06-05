/* ShopJoy Admin - 전시UI관리 (목록 + 하단 상세 임베드)
 * 구조: UI > 영역 > 패널 > 위젯
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uis = reactive([]);                      // UI 목록
    const uiCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ disp_ui_types: [], use_yn: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'uiNm asc', desc: 'uiNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({   // 인라인 Dtl 패널 상태 (항상 표시, 진입 시 빈 신규 폼)
      selectedId: '__new__',         // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',              // 'view' | 'edit'
      reloadTrigger: 0,
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispUiMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회 (표시경로 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // UI 신규 등록 (인라인 패널)
      } else if (cmd === 'uis-add') {
        return openNew();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 좌측 표시경로 트리 전체 보기
      } else if (cmd === 'pathTree-all') {
        uiState.selectedPath = null;
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'uis-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'uis-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispUiMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'uis-pager-sizeChange') {
        return onSizeChange();
      // 좌측 표시경로 트리 노드 선택
      } else if (cmd === 'pathTree-select') {
        return selectNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 기준 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ DpDispUiMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'uis-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [상세]/[수정] 등
        if (colKey === 'btn_view') { return loadView(row.uiId); }
        if (colKey === 'btn_edit') { return handleLoadDetail(row.uiId); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.uiId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { type: '', useYn: 'Y', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, dateRange: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.disp_ui_types = codeStore.sgGetGrpCodes('DISP_UI_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.dpUi.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(uiCounts).forEach(k => { delete uiCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) uiCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };


    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const { type, searchValue, ...restParam } = searchParam;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(searchValue ? { searchValue: searchValue.trim() } : {}),
          ...(type     ? { deviceTypeCd: type }  : {}),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        };
        const res = await boApiSvc.dpUi.getPage(params, '전시UI관리', '조회');
        const d = res.data?.data;
        uis.splice(0, uis.length, ...(d?.pageList || d?.list || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage  = d?.pageTotalPage  || 1;
        fnBuildPagerNums();
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

    /* pathNodes — 표시경로(ec_disp_ui) 노드 목록 (select 드롭다운용) */
    const pathNodes = reactive([]);
    const pathPickModal = reactive({ show: false });

    /* fnLoadPathNodes — 표시경로 노드 로드 (select 옵션) */
    const fnLoadPathNodes = async () => {
      try {
        const res = await coApiSvc.syPath.getPage({ bizCd: 'ec_disp_ui' }, '전시UI관리', '경로조회');
        const rows = res.data?.data?.pageList || res.data?.data?.list || [];
        pathNodes.splice(0, pathNodes.length, ...rows);
      } catch (e) { console.error('[fnLoadPathNodes]', e); }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
      fnLoadPathNodes();
    });

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* selectNode — 노드 선택 */
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; resetDetailToNew(); handleSearchList('DEFAULT'); };

    /* onPathSelectChange — select 드롭다운에서 경로 선택 (빈 값=전체) */
    const onPathSelectChange = (val) => { selectNode(val === '' || val == null ? null : val); };

    /* openPathManage — [항목관리] 모달 열기 */
    const openPathManage = () => { pathPickModal.show = true; };
    const onPathManaged = (id) => { pathPickModal.show = false; if (id != null) selectNode(id); fnLoadPathNodes(); };

    /* fnCallbackModal — 모달 통합 콜백 */
    const fnCallbackModal = (cmd, param, result) => {
      if (cmd === 'path-pick') {
        if (result == null) { pathPickModal.show = false; return; }
        return onPathManaged(result);
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };

    /* loadView — 뷰 로드 */
    const loadView         = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew     = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* setPage — 페이지 번호 변경 */
    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '키워드', placeholder: 'UI명 검색', width: '200px' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'uiNm',         label: 'UI명',     sortKey: 'nm', link: true },
      { key: 'deviceTypeCd', label: '유형' },
      { key: 'useYn',        label: '사용여부',
        badge: row => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt:   v   => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',      label: '등록일',   sortKey: 'reg',
        fmt: v => (v||'').slice(0,10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uis, uiState, uiCounts, codes, searchParam, pager, detailPanel,                           // 상태 / 데이터
      pathNodes, pathPickModal,                                                       // 표시경로 select / 모달
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,     // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                                                    // computed
      pathLabel, sortIcon, onPathSelectChange, openPathManage,                       // 헬퍼
      inlineNavigate,                                                                 // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="전시 UI 관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div class="bo-2col">
    <!-- ===== ■.■. 표시경로 트리 영역 ========================================== -->
    <bo-container title="📂 표시경로">
      <template #toolbar-actions>
        <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
          #ec_disp_ui
        </span>
        <span v-if="uiState.selectedPath != null" @click="handleBtnAction('pathTree-all')" style="font-size:11px;color:#1677ff;">
          전체보기
        </span>
      </template>
      <!-- ===== 표시경로 select + [항목관리] ===== -->
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:8px;">
        <select class="form-control" style="flex:1;min-width:0;font-size:12px;padding:4px 6px;"
          :value="uiState.selectedPath == null ? '' : uiState.selectedPath"
          @change="onPathSelectChange($event.target.value)">
          <option value="">전체</option>
          <option v-for="n in pathNodes" :key="n.pathId" :value="n.pathId">
            {{ n.pathLabel || n.pathNm || ('#' + n.pathId) }}
          </option>
        </select>
        <button class="btn btn-secondary btn-sm" style="flex-shrink:0;white-space:nowrap;" @click="openPathManage">
          항목관리
        </button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_ui" :counts="uiCounts" :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
      </div>
    </bo-container>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-container bare title="전시 UI 목록" :count-text="'총 ' + pager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
          #{{ uiState.selectedPath }}
        </span>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('uis-add')">
          ✚ 신규등록
        </button>
      </template>
      <bo-grid bare :columns="columns.baseGrid" :rows="uis" row-key="uiId" :selected-key="detailPanel.selectedId" :pager="pager"
        :sort-state="uiState"
        empty-text="조회된 데이터가 없습니다."
        @sort="key => handleBtnAction('uis-sort', key)"
        grid-id="uis-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <button class="btn btn-xs btn-secondary" @click.stop="handleGridCellAction(gridId, 'btn_view', row)">
            상세
          </button>
          <button class="btn btn-xs btn-primary" @click.stop="handleGridCellAction(gridId, 'btn_edit', row)">
            수정
          </button>
        </template>
      </bo-grid>
      <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('uis-pager-setPage', n)" :on-size-change="() => handleSelectAction('uis-pager-sizeChange')" />
    </bo-container>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (항상 표시, 진입 시 빈 신규 폼) =========================== -->
  <bo-container bare>
    <dp-disp-ui-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :tab-mode="detailPanel.openMode"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      />
  </bo-container>
  <!-- ===== □. 상세 패널 =================================================== -->
  <!-- ===== ■. 표시경로 항목관리 모달 ========================================== -->
  <path-pick-modal v-if="pathPickModal.show" biz-cd="ec_disp_ui" :value="uiState.selectedPath"
    title="표시경로 항목관리" modal-name="path-pick" :on-callback="fnCallbackModal" />
  <!-- ===== □. 표시경로 항목관리 모달 ========================================== -->
</bo-page>
`,
};

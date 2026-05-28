/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const areas = reactive([]);                    // 영역 목록
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null });
    const codes = reactive({ layout_types: [], use_yn: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'areaNm asc', desc: 'areaNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* baseGrid — pager + 정렬 + 페이지 액션 */
    const baseGrid = coUtil.cofGrid(() => handleSearchData(), { sortMap: SORT_MAP, pageSize: 5 });

    /* 상세 인라인 패널 */
    const baseDetail = coUtil.cofDetail();

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispAreaMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchData('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.reset();
        return handleSearchData('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 영역 신규 등록 (인라인 패널)
      } else if (cmd === 'areas-add') {
        return openNew();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      // 좌측 표시경로 트리 전체 보기
      } else if (cmd === 'pathTree-all') {
        uiState.selectedPath = null;
        baseGrid.pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ DpDispAreaMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'areas-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'areas-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'areas-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 클릭 → 상세 보기
      } else if (cmd === 'areas-rowView') {
        return loadView(param);
      // 그리드 행 수정 버튼 → 편집 패널 열기
      } else if (cmd === 'areas-rowEdit') {
        return handleLoadDetail(param);
      // 좌측 표시경로 트리 노드 선택
      } else if (cmd === 'pathTree-select') {
        return selectNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', areaType: '', useYn: 'Y', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, dateRange: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.layout_types = codeStore.sgGetGrpCodes('LAYOUT_TYPE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchData — 목록 조회 */
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize,
          ...baseGrid.sortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        };
        if (params.searchValue && !params.searchType) params.searchType = 'areaCd,areaNm';
        const d = (await boApiSvc.dpArea.getPage(params, '전시영역관리', '목록조회')).data?.data;
        const list = baseGrid.applyPage(d);
        areas.splice(0, areas.length, ...list);
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnPathLabel — 경로 라벨 */
    const fnPathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* selectNode — 노드 선택 (상세 패널 닫기) */
    const selectNode = (id) => { uiState.selectedPath = id; baseGrid.pager.pageNo = 1; baseDetail.close(); handleSearchData(); };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };

    /* loadView — 뷰 로드 */
    const loadView         = (id) => baseDetail.openView(id);

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => baseDetail.openEdit(id);

    /* openNew — 신규 열기 */
    const openNew     = () => baseDetail.openNew();

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => baseDetail.close();

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispAreaMng') { baseDetail.close(); if (opts.reload) handleSearchData(); return; }
      props.navigate(pg, opts);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfDetailEditId = computed(() => baseDetail.selectedId === '__new__' ? null : baseDetail.selectedId);

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'areaCd', label: '영역코드' },
          { value: 'areaNm', label: '영역명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 목록 그리드
    const listGridColumns = [
      { key: 'areaCd',     label: '영역코드', cellInnerStyle: 'font-size:11px;font-family:monospace;' },
      { key: 'areaNm',     label: '영역명',   sortKey: 'nm', link: true },
      { key: 'areaTypeCd', label: '유형' },
      { key: 'useYn',      label: '사용여부',
        badge: row => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt:   v   => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',    label: '등록일',   sortKey: 'reg',
        fmt: v => (v||'').slice(0,10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      areas, uiState, codes, searchParam, baseGrid, baseDetail,
      baseSearchColumns, listGridColumns,
      handleBtnAction, handleSelectAction,
      cfDetailEditId,
      fnPathLabel,
      inlineNavigate, handleSearchData,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    전시 영역 관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">
          📂 표시경로
          <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
            #ec_disp_area
          </span>
        </span>
        <span v-if="uiState.selectedPath != null" @click="handleBtnAction('pathTree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
          전체보기
        </span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-path-tree biz-cd="ec_disp_area" :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid :columns="listGridColumns" :rows="areas" :pager="baseGrid.pager" row-key="areaId"
      :sort-state="baseGrid" list-title="전시 영역 목록"
      :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'"
      empty-text="조회된 데이터가 없습니다." row-clickable
      @sort="key => handleSelectAction('areas-sort', key)"
      @set-page="n => handleSelectAction('areas-pager-setPage', n)"
      @size-change="handleSelectAction('areas-pager-sizeChange')"
      @row-click="(r) => handleSelectAction('areas-rowView', r.areaId)" row-actions>
      <template #toolbar-actions>
        <span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;font-size:12px;align-self:center;">
          #{{ uiState.selectedPath }}
        </span>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('areas-add')">
          ✚ 신규등록
        </button>
      </template>
      <template #row-actions="{ row }">
        <button class="btn btn-sm btn-secondary" @click="handleSelectAction('areas-rowView', row.areaId)">
          상세
        </button>
        <button class="btn btn-sm btn-primary" @click="handleSelectAction('areas-rowEdit', row.areaId)">
          수정
        </button>
      </template>
    </bo-grid>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div v-if="baseDetail.selectedId" class="card" style="margin-top:10px;">
    <dp-disp-area-dtl
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :tab-mode="baseDetail.openMode"
      :reload-trigger="baseDetail.reloadTrigger"
      :on-list-reload="handleSearchData"
      @close="handleBtnAction('baseDetail-close')"
      />
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
</div>
`,
};

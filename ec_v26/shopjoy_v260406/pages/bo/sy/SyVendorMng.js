/* ShopJoy Admin - 업체정보 목록 */
window.SyVendorMng = {
  name: 'SyVendorMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const vendors = reactive([]);                  // 업체 목록 (메인 그리드 데이터)
    const vendorCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ vendor_status: [], vendor_type_kr: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'vendorNm asc', desc: 'vendorNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회 (표시경로 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 업체 신규 등록 (인라인 패널)
      } else if (cmd === 'vendors-add') {
        return openNew();
      // 업체 목록 엑셀 내보내기
      } else if (cmd === 'vendors-excel') {
        return exportExcel();
      // 업체 목록 재조회
      } else if (cmd === 'vendors-reload') {
        return handleSearchList('RELOAD');
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'vendors-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'vendors-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'vendors-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 [수정] 버튼 → 편집 패널 열기(수정모드)
      } else if (cmd === 'vendors-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'vendors-rowDelete') {
        return handleDelete(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링 + 상세 패널 초기화
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch. cmd='{영역}-cellClick', e={row,col,colKey,colIndex,rowIndex}.
       e.colKey(클릭 컬럼명) 기준으로 셀별 동작 분기, e.row 행 객체 활용 */
    const handleGridCellAction = (cmd, e = {}) => {
      console.log(' ■■ SyVendorMng.js : handleGridCellAction -> ', cmd, e.colKey, e.row);
      if (cmd === 'vendors-cellClick') {
        // 일반 셀 클릭 → 상세 보기모드. (컬럼별 분기가 필요하면 e.colKey 로 추가)
        // if (e.colKey === 'someCol') { return ...; }
        return loadView(e.row.vendorId);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({   // 인라인 Dtl 패널 상태
      selectedId: '__new__',         // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'edit',              // 'view' | 'edit'
      reloadTrigger: 0,
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });
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

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syVendor.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(vendorCounts).forEach(k => { delete vendorCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) vendorCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };


    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'vendorNm,corpNo,vendorId';
        }
        const res = await boApiSvc.syVendor.getPage(params, '판매자관리', '목록조회');
        const data = res.data?.data;
        vendors.splice(0, vendors.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || vendors.length;
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

    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
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
      if (pg === 'syVendorMng') {
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

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (v) => {
      const ok = await showConfirm('삭제', `[${v.vendorNm}] 업체를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = vendors.findIndex(x => x.vendorId === v.vendorId);
      if (idx !== -1) { vendors.splice(idx, 1); }
      if (detailPanel.selectedId === v.vendorId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.syVendor.remove(v.vendorId, '판매자관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(vendors, [{label:'ID',key:'vendorId'},{label:'유형',key:'vendorType'},{label:'업체명',key:'vendorNm'},{label:'대표자',key:'ceoNm'},{label:'사업자번호',key:'vendorNo'},{label:'전화',key:'vendorPhone'},{label:'상태',key:'vendorStatusCd'},{label:'계약일',key:'contractDate'}], '업체목록.csv');

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.vendor_status = codeStore.sgGetGrpCodes('VENDOR_STATUS');
      codes.vendor_type_kr = codeStore.sgGetGrpCodes('VENDOR_TYPE_KR');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '판매업체': 'badge-blue', '배송업체': 'badge-orange' }[t] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (v) => detailPanel.selectedId === v.vendorId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'vendorNm', label: '업체명' },
          { value: 'corpNo',   label: '사업자번호' },
          { value: 'vendorId', label: '업체ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.vendor_type_kr, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.vendor_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',        label: '표시경로', style: 'width:170px;max-width:170px;', pathPick: 'sy_vendor' },
      { key: 'vendorId',      label: 'ID' },
      { key: 'vendorType',    label: '업체유형', badge: (row) => fnTypeBadge(row.vendorType) },
      { key: 'vendorNm',      label: '업체명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'ceoNm',         label: '대표자' },
      { key: 'vendorNo',      label: '사업자번호' },
      { key: 'vendorPhone',   label: '전화번호' },
      { key: 'vendorEmail',   label: '이메일' },
      { key: 'contractDate',  label: '계약일', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'vendorStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.vendorStatusCd) },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      vendors, uiState, vendorCounts, codes, searchParam, pager, detailPanel,                       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                      // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfIsViewMode, cfDetailKey,                                      // computed
      fnRowStyle,                                                                     // 헬퍼
      inlineNavigate, showToast, showConfirm, setApiRes,                              // Dtl 콜백 (closure 필요)
      handleSearchList,                                                               // Dtl 의 onListReload 콜백
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    업체정보
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
    <bo-path-tree-card biz-cd="sy_vendor" title="표시경로" :show-biz-cd="false" :counts="vendorCounts"
      :selected="uiState.selectedPath"
      @select="path => handleSelectAction('pathTree-select', path)" />
    <div>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid
        :columns="columns.baseGrid" :rows="vendors" row-key="vendorId" :selected-key="detailPanel.selectedId"
        list-title="거래처목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleBtnAction('vendors-sort', key)"
        @cell-click="e => handleGridCellAction('vendors-cellClick', e)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="handleBtnAction('vendors-excel')">
              📥 엑셀
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('vendors-add')">
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
              <button class="btn btn-blue btn-xs" @click="handleSelectAction('vendors-rowEdit', row.vendorId)">
                수정
              </button>
              <button class="btn btn-danger btn-xs" @click="handleSelectAction('vendors-rowDelete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
        <!-- 페이저를 그리드 카드 내부 하단(#footer)에 배치 → 거래처목록 영역 안에 보이도록 -->
        <template #footer>
          <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('vendors-pager-setPage', n)" :on-size-change="() => handleSelectAction('vendors-pager-sizeChange')" />
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 상세 패널 (전체 폭, grid 직접 자식, 항상 표시) ===================== -->
    <!-- margin-top 제거: 위 목록 카드의 margin-bottom만으로 영역 간격을 12px 로 통일 -->
    <div style="grid-column:1/-1;">
      <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
        <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
          ✕ 닫기
        </button>
      </div>
      <sy-vendor-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
        :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
        :active="detailPanel.active"
        :reload-trigger="detailPanel.reloadTrigger"
        :on-list-reload="handleSearchList" />
    </div>
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
</div>
`,
};

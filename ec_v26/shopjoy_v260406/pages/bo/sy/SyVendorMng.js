/* ShopJoy Admin - 업체정보 목록 */
window.SyVendorMng = {
  name: 'SyVendorMng',
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
    const vendors = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ vendor_status: [], vendor_type_kr: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'vendorNm asc', desc: 'vendorNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};

      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 업체(판매자) onSort */

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
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
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* onPathChange — 경로 변경 */
    const onPathChange = (row) => { if (row && row._row_status === 'N') row._row_status = 'U'; };

    /* selectNode — 노드 선택 */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };

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
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

  /* 업체(판매자) _initSearchParam */
  const _initSearchParam = () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
  };
  const searchParam = reactive(_initSearchParam());

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* loadView — 뷰 로드 */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syVendorMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '판매업체': 'badge-blue', '배송업체': 'badge-orange' }[t] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (v) => {
      const ok = await showConfirm('삭제', `[${v.vendorNm}] 업체를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = vendors.findIndex(x => x.vendorId === v.vendorId);
      if (idx !== -1) vendors.splice(idx, 1);
      if (uiStateDetail.selectedId === v.vendorId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.syVendor.remove(v.vendorId, '판매자관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(vendors, [{label:'ID',key:'vendorId'},{label:'유형',key:'vendorType'},{label:'업체명',key:'vendorNm'},{label:'대표자',key:'ceoNm'},{label:'사업자번호',key:'vendorNo'},{label:'전화',key:'vendorPhone'},{label:'상태',key:'vendorStatusCd'},{label:'계약일',key:'contractDate'}], '업체목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */


        // --- [컬럼 정의] ---


        const baseSearchColumns = [
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
        onRangeChange: () => onDateRangeChange() },
    ];

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseGridColumns = [
      { key: 'pathId',        label: '표시경로', pathPick: 'sy_vendor' },
      { key: 'vendorId',      label: 'ID' },
      { key: 'vendorType',    label: '업체유형', badge: (row) => fnTypeBadge(row.vendorType) },
      { key: 'vendorNm',      label: '업체명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'ceoNm',         label: '대표자' },
      { key: 'vendorNo',      label: '사업자번호' },
      { key: 'vendorPhone',   label: '전화번호' },
      { key: 'vendorEmail',   label: '이메일' },
      { key: 'contractDate',  label: '계약일', sortKey: 'reg' },
      { key: 'vendorStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.vendorStatusCd) },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];
    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (v) => uiStateDetail.selectedId === v.vendorId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // ===== return (템플릿 노출) ===============================================

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), vendors, uiState, codes, onPathChange,
      selectNode, codes, searchParam, onDateRangeChange, cfSiteNm, pager, onSearch, onReset, setPage, onSizeChange, fnTypeBadge, fnStatusBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      baseSearchColumns, baseGridColumns, fnRowStyle };
  },
  template: /* html */`
<div>
  <div class="page-title">업체정보</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_vendor" title="표시경로" :show-biz-cd="true"
      :selected="selectedPath" @select="selectNode" />
    <div>
      <bo-grid
        :columns="baseGridColumns" :rows="vendors" :pager="pager" row-key="vendorId"
        list-title="거래처목록" :count-text="pager.pageTotalCount + '건'"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="row => handleLoadDetail(row.vendorId)">
        <template #toolbar-actions>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </template>
        <template #head-actions>
          <th style="text-align:right">관리</th>
        </template>
        <template #row-actions="{ row }">
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.vendorId)">수정</button>
              <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
            </div>
          </td>
        </template>
      </bo-grid>
      <div v-if="selectedId" style="margin-top:4px;">
        <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
          <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
        </div>
        <sy-vendor-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
          :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
          
          :reload-trigger="uiStateDetail.reloadTrigger"
          :on-list-reload="handleSearchList"
          />
      </div>
    </div>
  </div>
</div>
`
};

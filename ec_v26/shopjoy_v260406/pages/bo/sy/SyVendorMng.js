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
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null,
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
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
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
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'vendors-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'vendors-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'vendors-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 클릭 → 편집 패널 열기
      } else if (cmd === 'vendors-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'vendors-rowDelete') {
        return handleDelete(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링 + 상세 패널 닫기
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        baseGrid.pager.pageNo = 1;
        baseDetail.selectedId = null;
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — pager + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* ===== 상세 인라인 패널 ===== */
    const baseDetail = coUtil.cofDetail(); // 인라인 Dtl 패널 상태
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

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

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'vendorNm,corpNo,vendorId';
        }
        const res = await boApiSvc.syVendor.getPage(params, '판매자관리', '목록조회');
        const data = res.data?.data;
        vendors.splice(0, vendors.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || vendors.length;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
        uiState.error = null;
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
      baseGrid.pager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'view'; baseDetail.reloadTrigger++; };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 */
    const handleLoadDetail = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* openNew — 신규 등록 */
    const openNew = () => { baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { baseDetail.selectedId = null; };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syVendorMng') { baseDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { baseDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(vendors, [{label:'ID',key:'vendorId'},{label:'유형',key:'vendorType'},{label:'업체명',key:'vendorNm'},{label:'대표자',key:'ceoNm'},{label:'사업자번호',key:'vendorNo'},{label:'전화',key:'vendorPhone'},{label:'상태',key:'vendorStatusCd'},{label:'계약일',key:'contractDate'}], '업체목록.csv');
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
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_vendor" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath"
      @select="path => handleSelectAction('pathTree-select', path)" />
    <div>
      <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
      <bo-grid
        :columns="baseGridColumns" :rows="vendors" :pager="baseGrid.pager" row-key="vendorId"
        list-title="거래처목록" :count-text="baseGrid.pager.pageTotalCount + '건'"
        :sort-state="baseGrid" :row-style="fnRowStyle"
        @sort="key => handleSelectAction('vendors-sort', key)"
        @set-page="n => handleSelectAction('vendors-pager-setPage', n)"
        @size-change="handleSelectAction('vendors-pager-sizeChange')"
        @row-click="row => handleSelectAction('vendors-rowEdit', row.vendorId)">
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
          <td>
            <div class="actions">
              <button class="btn btn-blue btn-sm" @click="handleSelectAction('vendors-rowEdit', row.vendorId)">
                수정
              </button>
              <button class="btn btn-danger btn-sm" @click="handleSelectAction('vendors-rowDelete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 상세 패널 (전체 폭, grid 직접 자식) ============================ -->
    <div v-if="baseDetail.selectedId" style="grid-column:1/-1;margin-top:4px;">
      <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
          ✕ 닫기
        </button>
      </div>
      <sy-vendor-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
        :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
        :reload-trigger="baseDetail.reloadTrigger"
        :on-list-reload="handleSearchList" />
    </div>
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
</div>
`,
};

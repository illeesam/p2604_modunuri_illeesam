/* ShopJoy Admin - 업체정보 (업체 선택 → 브랜드/가격정책/배송템플릿/부가서비스 탭) */
window.SyVendorInfoMng = {
  name: 'SyVendorInfoMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const vendors = reactive([]);                  // 업체 목록 (2단 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedVendorId: null,                      // 선택된 업체 (탭 영역 데이터 기준)
      tab: 'brand',                                // 3단 탭: brand | price | dliv | extra
    });
    const codes = reactive({ vendor_status: [], vendor_type_kr: [] });

    /* ===== 검색조건 ===== */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 (2단 업체목록) ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 3단 탭 영역 데이터 + 탭별 서버 페이저 ===== */
    const brands    = reactive([]);   // 브랜드
    const discnts   = reactive([]);   // 가격정책 (할인)
    const dlivTmplts = reactive([]);  // 배송템플릿
    const extras    = reactive([]);   // 부가서비스
    const tabLoading = reactive({ brand: false, price: false, dliv: false, extra: false });
    const _mkPager = () => reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [5, 10, 20, 30, 50, 100], pageCond: {} });
    const brandPager = _mkPager();   // 브랜드 페이저
    const pricePager = _mkPager();   // 가격정책 페이저
    const dlivPager  = _mkPager();   // 배송템플릿 페이저

    /* 탭별 메타 (api / 데이터배열 / 페이저 / 로딩키) */
    const TAB_META = {
      brand: { api: () => boApiSvc.syBrand,     rows: brands,     pager: brandPager, loadKey: 'brand', cmdNm: '브랜드조회' },
      price: { api: () => boApiSvc.pmDiscnt,    rows: discnts,    pager: pricePager, loadKey: 'price', cmdNm: '가격정책조회' },
      dliv:  { api: () => boApiSvc.pdDlivTmplt, rows: dlivTmplts, pager: dlivPager,  loadKey: 'dliv',  cmdNm: '배송템플릿조회' },
    };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼/페이지번호 액션 dispatch (select 아닌 액션). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorInfoMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 업체목록 페이지 번호 클릭
      } else if (cmd === 'vendors-pager-setPage') {
        return setPage(param);
      // 탭 그리드 페이지 번호 클릭 (param: { tab, n })
      } else if (cmd === 'tabGrid-pager-setPage') {
        return setTabPage(param.tab, param.n);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/탭/select 선택 액션 dispatch. 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorInfoMng.js : handleSelectAction -> ', cmd, param);
      // 업체 그리드 행 선택 → 탭 영역 데이터 로드
      if (cmd === 'vendors-rowSelect') {
        return pickVendorRow(param);
      // 업체목록 페이지 크기 변경 (<select>)
      } else if (cmd === 'vendors-pager-sizeChange') {
        return onSizeChange();
      // 3단 탭 전환
      } else if (cmd === 'tab-select') {
        return onTabSelect(param);
      // 탭 그리드 페이지 크기 변경 (<select>) — param: { tab }
      } else if (cmd === 'tabGrid-pager-sizeChange') {
        return onTabSizeChange(param.tab);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 업체 목록 조회 (2단) */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'vendorNm,corpNo,vendorId';
        }
        const res = await boApiSvc.syVendor.getPage(params, '업체정보', '목록조회');
        const data = res.data?.data;
        vendors.splice(0, vendors.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || vendors.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums(pager);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList(); };

    /* onReset — 초기화 + 재조회 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      pager.pageNo = 1;
      handleSearchList();
    };

    /* setPage — 업체목록 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 업체목록 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 (공용) */
    const fnBuildPagerNums = (pg) => { const c=pg.pageNo,l=pg.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pg.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* pickVendorRow — 업체 행 선택 → 선택 업체 변경 + 모든 탭 페이저 1페이지로 + 현재 탭 데이터 로드 */
    const pickVendorRow = (v) => {
      uiState.selectedVendorId = v.vendorId;
      brandPager.pageNo = 1; pricePager.pageNo = 1; dlivPager.pageNo = 1;
      loadTabData(uiState.tab);
    };

    /* onTabSelect — 3단 탭 전환 → 해당 탭 데이터 로드 */
    const onTabSelect = (tabId) => {
      uiState.tab = tabId;
      if (uiState.selectedVendorId != null) { loadTabData(tabId); }
    };

    /* setTabPage — 탭 그리드 페이지 번호 변경 */
    const setTabPage = (tabId, n) => {
      const m = TAB_META[tabId]; if (!m) { return; }
      if (n >= 1 && n <= m.pager.pageTotalPage) { m.pager.pageNo = n; loadTabData(tabId); }
    };

    /* onTabSizeChange — 탭 그리드 페이지 크기 변경 (<select>) */
    const onTabSizeChange = (tabId) => {
      const m = TAB_META[tabId]; if (!m) { return; }
      m.pager.pageNo = 1; loadTabData(tabId);
    };

    /* loadTabData — 선택 업체 기준 탭별 서버 페이징 데이터 조회 */
    const loadTabData = async (tabId) => {
      const vendorId = uiState.selectedVendorId;
      if (vendorId == null) { return; }
      // 부가서비스는 별도 API 연동 전까지 빈 목록
      if (tabId === 'extra') { extras.splice(0, extras.length); return; }
      const m = TAB_META[tabId];
      if (!m) { return; }
      tabLoading[m.loadKey] = true;
      try {
        const res = await m.api().getPage({ vendorId, pageNo: m.pager.pageNo, pageSize: m.pager.pageSize }, '업체정보', m.cmdNm);
        const data = res.data?.data;
        m.rows.splice(0, m.rows.length, ...(data?.pageList || []));
        m.pager.pageTotalCount = data?.pageTotalCount || m.rows.length;
        m.pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(m.pager.pageTotalCount / m.pager.pageSize) || 1;
        fnBuildPagerNums(m.pager);
      } catch (err) {
        console.error('[loadTabData]', tabId, err);
      } finally {
        tabLoading[m.loadKey] = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.vendor_status = codeStore.sgGetGrpCodes('VENDOR_STATUS');
      codes.vendor_type_kr = codeStore.sgGetGrpCodes('VENDOR_TYPE_KR');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '판매업체': 'badge-blue', '배송업체': 'badge-orange' }[t] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    /* fnRowStyle — 행 스타일 (선택 강조는 selected-key 의 파란 테두리로 처리) */
    const fnRowStyle = (v) => 'cursor:pointer;';

    /* fnSelectedVendorNm — 선택 업체명 */
    const fnSelectedVendorNm = () => {
      const v = vendors.find(x => x.vendorId === uiState.selectedVendorId);
      return v ? v.vendorNm : '';
    };

    /* 3단 탭 정의 (computed 금지 → reactive + getter 카운트: 서버 총건수 기준) */
    const tabs = reactive([
      { id: 'brand', label: '브랜드',     icon: '🏷', get count() { return brandPager.pageTotalCount; } },
      { id: 'price', label: '가격정책',   icon: '💰', get count() { return pricePager.pageTotalCount; } },
      { id: 'dliv',  label: '배송템플릿', icon: '🚚', get count() { return dlivPager.pageTotalCount; } },
      { id: 'extra', label: '부가서비스', icon: '✨', get count() { return extras.length; } },
    ]);

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
    ];

    // 2단 업체 그리드
    columns.baseGrid = [
      { key: 'vendorType',    label: '업체유형', align: 'center', badge: (row) => fnTypeBadge(row.vendorType) },
      { key: 'vendorNm',      label: '업체명', cellStyle: 'font-weight:600' },
      { key: 'ceoNm',         label: '대표자' },
      { key: 'vendorNo',      label: '사업자번호',
        cellInnerStyle: 'font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-family:monospace;' },
      { key: 'vendorPhone',   label: '전화번호', cellStyle: 'font-size:11.5px' },
      { key: 'vendorStatusCd', label: '상태', align: 'center', badge: (row) => fnStatusBadge(row.vendorStatusCd) },
    ];

    // 3단 탭: 브랜드 그리드
    columns.brandGrid = [
      { key: 'brandNm',     label: '브랜드명', cellStyle: 'font-weight:600' },
      { key: 'brandCode',   label: '브랜드코드' },
      { key: 'brandRemark', label: '비고', cellStyle: 'color:#666' },
    ];
    // 3단 탭: 가격정책(할인) 그리드
    columns.priceGrid = [
      { key: 'discntNm',     label: '정책명', cellStyle: 'font-weight:600' },
      { key: 'discntTypeCd', label: '할인유형', align: 'center' },
      { key: 'discntVal',    label: '할인값', align: 'right' },
      { key: 'discntStatusCd', label: '상태', align: 'center' },
    ];
    // 3단 탭: 배송템플릿 그리드
    columns.dlivGrid = [
      { key: 'dlivTmpltNm',  label: '템플릿명', cellStyle: 'font-weight:600' },
      { key: 'dlivTypeCd',   label: '배송유형', align: 'center' },
      { key: 'dlivFee',      label: '기본배송비', align: 'right', fmt: (v) => v != null ? Number(v).toLocaleString() + '원' : '-' },
      { key: 'freeCondAmt',  label: '무료조건', align: 'right', fmt: (v) => v != null ? Number(v).toLocaleString() + '원' : '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns, tabs,
      vendors, uiState, codes, searchParam, pager,                                    // 상태 / 데이터
      brands, discnts, dlivTmplts, extras, tabLoading,                                // 탭 영역 데이터
      brandPager, pricePager, dlivPager,                                              // 탭별 페이저
      handleBtnAction, handleSelectAction,                                            // dispatch (모든 이벤트 / 액션 라우팅)
      fnRowStyle, fnSelectedVendorNm,                                                 // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    업체정보
  </div>
  <!-- ===== ■. 1단: 조회 영역 =============================================== -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </div>
  <!-- ===== □. 1단: 조회 영역 =============================================== -->
  <!-- ===== ■. 2단: 업체목록 =============================================== -->
  <bo-grid
    :columns="columns.baseGrid" :rows="vendors" row-key="vendorId"
    list-title="업체목록" :count-text="pager.pageTotalCount + '건'"
    :loading="uiState.loading" :row-style="fnRowStyle" :selected-key="uiState.selectedVendorId" row-clickable row-actions
    @row-click="row => handleSelectAction('vendors-rowSelect', row)">
    <template #row-actions="{ row }">
      <button class="btn btn-primary btn-xs" @click.stop="handleSelectAction('vendors-rowSelect', row)">
        {{ uiState.selectedVendorId===row.vendorId ? '선택됨' : '선택' }}
      </button>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('vendors-pager-setPage', n)" :on-size-change="() => handleSelectAction('vendors-pager-sizeChange')" />
  <!-- ===== □. 2단: 업체목록 =============================================== -->
  <!-- ===== ■. 3단: 탭 영역 (브랜드 | 가격정책 | 배송템플릿 | 부가서비스) ============ -->
  <div class="card" style="margin-top:16px;">
    <!-- ===== ■.■. 탭 헤더 + 선택 업체 표시 ===================================== -->
    <div class="toolbar" style="margin-bottom:10px;">
      <span class="list-title">
        업체정보 상세
        <span v-if="uiState.selectedVendorId != null" style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:600;">
          {{ fnSelectedVendorNm() }}
        </span>
      </span>
    </div>
    <bo-tab-bar :tabs="tabs" :tab="uiState.tab" :show-modes="false"
      @tab-select="id => handleSelectAction('tab-select', id)" />
    <!-- ===== ■.■. 업체 미선택 안내 ============================================ -->
    <div v-if="uiState.selectedVendorId == null" style="text-align:center;color:#aaa;padding:32px 16px;font-size:13px;">
      위 업체목록에서 업체를 선택하면 브랜드 / 가격정책 / 배송템플릿 / 부가서비스 정보가 표시됩니다.
    </div>
    <!-- ===== ■.■. 탭 컨텐츠 ================================================= -->
    <div v-else>
      <!-- ===== ■.■.■. 브랜드 탭 ============================================= -->
      <template v-if="uiState.tab==='brand'">
        <bo-grid bare :columns="columns.brandGrid" :rows="brands" row-key="brandId"
          :pager="brandPager" :loading="tabLoading.brand" empty-text="등록된 브랜드가 없습니다." />
        <bo-pager :pager="brandPager" :on-set-page="n => handleBtnAction('tabGrid-pager-setPage', { tab: 'brand', n })" :on-size-change="() => handleSelectAction('tabGrid-pager-sizeChange', { tab: 'brand' })" />
      </template>
      <!-- ===== ■.■.■. 가격정책 탭 =========================================== -->
      <template v-else-if="uiState.tab==='price'">
        <bo-grid bare :columns="columns.priceGrid" :rows="discnts" row-key="discntId"
          :pager="pricePager" :loading="tabLoading.price" empty-text="등록된 가격정책이 없습니다." />
        <bo-pager :pager="pricePager" :on-set-page="n => handleBtnAction('tabGrid-pager-setPage', { tab: 'price', n })" :on-size-change="() => handleSelectAction('tabGrid-pager-sizeChange', { tab: 'price' })" />
      </template>
      <!-- ===== ■.■.■. 배송템플릿 탭 ========================================= -->
      <template v-else-if="uiState.tab==='dliv'">
        <bo-grid bare :columns="columns.dlivGrid" :rows="dlivTmplts" row-key="dlivTmpltId"
          :pager="dlivPager" :loading="tabLoading.dliv" empty-text="등록된 배송템플릿이 없습니다." />
        <bo-pager :pager="dlivPager" :on-set-page="n => handleBtnAction('tabGrid-pager-setPage', { tab: 'dliv', n })" :on-size-change="() => handleSelectAction('tabGrid-pager-sizeChange', { tab: 'dliv' })" />
      </template>
      <!-- ===== ■.■.■. 부가서비스 탭 ========================================= -->
      <div v-else-if="uiState.tab==='extra'" style="text-align:center;color:#aaa;padding:32px 16px;font-size:13px;">
        부가서비스 정보는 준비 중입니다.
      </div>
    </div>
    <!-- ===== □.□. 탭 컨텐츠 ================================================= -->
  </div>
  <!-- ===== □. 3단: 탭 영역 =============================================== -->
</div>
`,
};

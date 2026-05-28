/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, loading: false });
    const codes = reactive({ raw_types: [], raw_collect_statuses: [], raw_vendor_divs: [], pay_methods: [], order_statuses_kr: [],
      confirm_yn_opts: [], close_yn_opts: [], send_yn_opts: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else if (cmd === 'searchParam-moreToggle') {
        searchParam.searchMoreOpen = !searchParam.searchMoreOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'rawData-pager-setPage') {
        if (param >= 1 && param <= baseGrid.pager.pageTotalPage) { baseGrid.pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else if (cmd === 'rawData-pager-sizeChange') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.raw_types = codeStore.sgGetGrpCodes('RAW_TYPE_KR');
        codes.raw_collect_statuses = codeStore.sgGetGrpCodes('RAW_COLLECT_STATUS');
        codes.raw_vendor_divs = codeStore.sgGetGrpCodes('RAW_VENDOR_DIV');
        codes.pay_methods = codeStore.sgGetGrpCodes('PAY_METHOD_KR');
        codes.order_statuses_kr = codeStore.sgGetGrpCodes('ORDER_STATUS_KR');
        codes.confirm_yn_opts = codeStore.sgGetGrpCodes('CONFIRM_YN');
        codes.close_yn_opts = codeStore.sgGetGrpCodes('CLOSE_YN');
        codes.send_yn_opts = codeStore.sgGetGrpCodes('SEND_YN');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);
            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };

    // 검색 필드
  const _initSearchParam = () => ({ dateRange: '이번달', dateStart: '', dateEnd: '', searchMoreOpen: false, searchType: '', searchValue: '', type: '', status: '', vendorType: '', payMethod: '', buyConfirm: '', closeYn: '', erpSend: '', period: '', orderStatus: '', amtFrom: '', amtTo: '' });
  const searchParam = reactive(_initSearchParam());
  (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { searchParam.dateStart = r.from; searchParam.dateEnd = r.to; } })();

    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { pageSize: 10 });
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    정산수집원장
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다. • 수집 단위: od_order_item / od_claim_item (상품 행 단위) • [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다. • 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 검색 카드 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-moreToggle')" style="min-width:70px">
          {{ searchParam.searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </template>
    </bo-search-area>
    <!-- ===== ■.■. 검색 영역 (펼침) ============================================ -->
    <bo-search-area v-if="searchParam.searchMoreOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="moreSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 카드 =================================================== -->
  <!-- ===== ■. 집계 카드 =================================================== -->
  <div class="card" style="margin-bottom:12px;">
    <bo-form-area :columns="summaryFormColumns" :form="{}" :cols="7" readonly label-left :show-actions="false" label-width="100px" />
  </div>
  <!-- ===== □. 집계 카드 =================================================== -->
  <!-- ===== ■. 목록 카드 =================================================== -->
  <bo-grid
    :columns="rawGridColumns"
    :rows="raws"
    :pager="baseGrid.pager"
    row-key="settleRawId"
    list-title="정산수집원장"
    :is-expanded="(r) => isExpanded(r.settleRawId)"
    empty-text="데이터가 없습니다." row-clickable
    @set-page="n => handleSelectAction('rawData-pager-setPage', n)"
    @size-change="handleSelectAction('rawData-pager-sizeChange')"
    @row-click="(r) => toggleRow(r.settleRawId)">
    <template #toolbar-actions>
      <button class="btn btn-secondary btn-sm" @click="() => { raws.forEach(r => { if(!isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▼ 전체펼치기
      </button>
      <button class="btn btn-secondary btn-sm" @click="() => { raws.forEach(r => { if(isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▲ 전체접기
      </button>
      <button class="btn btn-blue btn-sm" @click="doCollect">
        🔄 재수집
      </button>
    </template>
    <template #row-expand="{ row: r, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:12px 20px;border-top:none">
        <bo-form-area :columns="rawExpandColumns" :form="r" :cols="4" readonly label-left :show-actions="false" />
      </td>
    </template>
  </bo-grid>
</div>
<!-- ===== □. 목록 카드 =================================================== -->
`,
};

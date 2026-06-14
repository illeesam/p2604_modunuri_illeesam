/* ShopJoy Admin - 쿠폰관리 목록 + 하단 CouponDtl 임베드 */
window.PmCouponMng = {
  name: 'PmCouponMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const coupons = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      coupon_types: [],
      coupon_statuses: [],
      date_range_opts: [],
    });

    /* 쿠폰 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmCouponMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 쿠폰 신규 등록 (인라인 패널)
      } else if (cmd === 'coupons-add') {
        return openNew();
      // 쿠폰 목록 엑셀 내보내기
      } else if (cmd === 'coupons-excel') {
        return exportExcel();
      // 탭 모드 변경 (list/card)
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'coupons-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'coupons-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmCouponMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'coupons-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 상세 보기
      } else if (cmd === 'coupons-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmCouponMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'coupons-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { return handleLoadDetail(row.couponId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.couponId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.coupon_types = codeStore.sgGetGrpCodes('COUPON_TYPE');
        codes.coupon_statuses = codeStore.sgGetGrpCodes('COUPON_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false }); // 진입 시 빈 신규 폼(비활성). 행 선택/신규 시 active=true

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateType: 'reg_date', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, couponStatusCd: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 쿠폰 handleDateRangeChange */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'couponNm asc', desc: 'couponNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
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
      baseGridPager.pageNo = 1;
      handleSearchList();
    };



    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'couponNm,couponCd';
        }
        const res = await boApiSvc.pmCoupon.getPage(params, '쿠폰관리', '목록조회');
        const data = res.data?.data;
        coupons.splice(0, coupons.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
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
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    /* loadView — 뷰 로드 */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.active = true; uiStateDetail.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      uiStateDetail.selectedId = '__new__';
      uiStateDetail.openMode = 'edit';
      uiStateDetail.active = false;    // 버튼 숨김
      uiStateDetail.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → active=true) */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.active = true; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.active = true; uiStateDetail.resetSeq++; uiStateDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCouponMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);

    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}_${uiStateDetail.resetSeq}`);


    /* discountLabel — 할인 라벨 */
    const discountLabel = c => c.discountRate ? (c.discountRate||0) + '%' : (c.discountAmt||0).toLocaleString() + '원';

    /* 쿠폰 fnStatusBadge */
    const _COUPON_STATUS_FB = { '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _COUPON_STATUS_FB[s] || 'badge-gray');





    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.couponNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(coupons)) { return; }
      const idx = coupons.findIndex(x => x.couponId === c.couponId);
      if (idx !== -1) { coupons.splice(idx, 1); }
      if (uiStateDetail.selectedId === c.couponId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmCoupon.remove(c.couponId, '쿠폰관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(coupons, [{label:'ID',key:'couponId'},{label:'쿠폰명',key:'couponNm'},{label:'코드',key:'couponCd'},{label:'유형',key:'couponTypeCdNm'},{label:'할인율',key:'discountRate'},{label:'할인액',key:'discountAmt'},{label:'최소금액',key:'minOrderAmt'},{label:'상태',key:'couponStatusCdNm'},{label:'유효기간(시작)',key:'validFrom'},{label:'유효기간(종료)',key:'validTo'}], '쿠폰목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'couponNm',   label: '쿠폰명' },
          { value: 'couponCd', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'couponStatusCd', type: 'select', label: '상태', options: () => codes.coupon_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
    ];

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 그리드
    columns.baseGrid = [
      { key: 'couponNm',       label: '쿠폰명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'couponCd',       label: '코드',
        cellInnerStyle: 'background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace;' },
      { key: 'discount',       label: '할인', fmt: (v, row) => discountLabel(row) },
      { key: 'minOrderAmt',    label: '최소주문',
        fmt: (v) => v ? v.toLocaleString() + '원↑' : '-' },
      { key: 'targetTypeCdNm', label: '발급대상', fmt: (v) => v || '-' },
      { key: 'issue',          label: '발급/사용',
        fmt: (v, row) => (row.issueCnt || 0) + ' / ' + (row.issueLimit || 0) },
      { key: 'validTo',        label: '만료일', sortKey: 'reg' },
      { key: 'couponStatusCd', label: '상태',
        badge: (row) => fnStatusBadge(row.couponStatusCdNm || row.couponStatusCd),
        fmt: (v, row) => row.couponStatusCdNm || row.couponStatusCd },
      { key: 'siteNm',         label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      coupons, uiState, searchParam, baseGridPager, uiStateDetail,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                   // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                        // computed
      discountLabel, fnStatusBadge,          // 헬퍼
      inlineNavigate,                                      // 콜백 / 전역
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; },
      get selectedId() { return uiStateDetail.selectedId; }
    };
  },
  template: /* html */`
<bo-page title="쿠폰관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="쿠폰목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;transition:all .15s;"
          :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
          ☰ 리스트
        </button>
        <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;transition:all .15s;"
          :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
          ⊞ 카드
        </button>
      </div>
      <button class="btn btn_excel" @click="handleBtnAction('coupons-excel')">
        📥 엑셀
      </button>
      <button class="btn btn_new" @click="handleBtnAction('coupons-add')">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="coupons" row-key="couponId" :selected-key="selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(c) => selectedId===c.couponId ? 'background:#fff8f9;' : ''"
      @sort="key => handleBtnAction('coupons-sort', key)"
      grid-id="coupons-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: c, gridId }">
        <div class="actions">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', c)">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', c)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="n => handleBtnAction('coupons-pager-setPage', n)" :on-size-change="() => handleSelectAction('coupons-pager-sizeChange')" />
    <!-- ===== □.□. 목록 영역 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="coupons.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(c, idx) in coupons" :key="c?.couponId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="selectedId===c.couponId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('coupons-rowView', c.couponId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (baseGridPager.pageNo-1)*baseGridPager.pageSize + idx + 1 }}</span>
            쿠폰 #{{ c.couponId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('coupons-rowView', c.couponId)" :style="selectedId===c.couponId?{color:'#e8587a'}:{}">
            {{ c.couponNm }}
            <span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(c.couponStatusCdNm || c.couponStatusCd)" style="font-size:11px;">
              {{ c.couponStatusCdNm || c.couponStatusCd }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              💰 {{ discountLabel(c) }}
            </div>
            <div>
              📅 {{ c.validFrom }} ~ {{ c.validTo }}
            </div>
            <div style="color:#999;margin-top:4px;">
              만료 {{ c.validTo }}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction('coupons-cellClick', 'btn_row_edit', c)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction('coupons-cellClick', 'btn_row_delete', c)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
        </div>
      </div>
    </div>
    <bo-pager v-if="tabMode!=='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="n => handleBtnAction('coupons-pager-setPage', n)" :on-size-change="() => handleSelectAction('coupons-pager-sizeChange')" />
    <!-- ===== □.□. 카드 뷰 ================================================== -->
  </bo-container>
  <!-- ===== ■. 하단 상세: CouponDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ============= -->
  <pm-coupon-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="uiStateDetail.active"
    :reload-trigger="uiStateDetail.reloadTrigger"
    />
  <!-- ===== □. 하단 상세: CouponDtl 임베드 ==================================== -->
</bo-page>
`
};

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
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
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
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmCouponMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'coupons-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'coupons-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'coupons-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 상세 편집
      } else if (cmd === 'coupons-rowEdit') {
        return handleLoadDetail(param);
      // 행 삭제
      } else if (cmd === 'coupons-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
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
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 쿠폰 handleDateRangeChange */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
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
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'couponNm,couponCd';
        }
        const res = await boApiSvc.pmCoupon.getPage(params, '쿠폰관리', '목록조회');
        const data = res.data?.data;
        coupons.splice(0, coupons.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

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
      if (pg === 'pmCouponMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* discountLabel — 할인 라벨 */
    const discountLabel = c => c.discountRate ? (c.discountRate||0) + '%' : (c.discountAmt||0).toLocaleString() + '원';

    /* 쿠폰 fnStatusBadge */
    const _COUPON_STATUS_FB = { '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _COUPON_STATUS_FB[s] || 'badge-gray');

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.couponNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(coupons)) { return; }
      const idx = coupons.findIndex(x => x.couponId === c.couponId);
      if (idx !== -1) { coupons.splice(idx, 1); }
      if (uiStateDetail.selectedId === c.couponId) { uiStateDetail.selectedId = null; }
      try {
        const res = await boApiSvc.pmCoupon.remove(c.couponId, '쿠폰관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(coupons, [{label:'ID',key:'couponId'},{label:'쿠폰명',key:'couponNm'},{label:'코드',key:'couponCd'},{label:'유형',key:'couponTypeCdNm'},{label:'할인율',key:'discountRate'},{label:'할인액',key:'discountAmt'},{label:'최소금액',key:'minOrderAmt'},{label:'상태',key:'couponStatusCdNm'},{label:'유효기간(시작)',key:'validFrom'},{label:'유효기간(종료)',key:'validTo'}], '쿠폰목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'couponNm',   label: '쿠폰명' },
          { value: 'couponCd', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.coupon_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 그리드
    const baseGridColumns = [
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
      coupons, uiState, codes, searchParam, pager, uiStateDetail,                  // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                          // 컬럼 정의
      handleBtnAction, handleSelectAction,                                         // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                         // computed
      discountLabel, fnStatusBadge, sortIcon,                                      // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,             // 콜백 / 전역
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; },
      get selectedId() { return uiStateDetail.selectedId; }
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    쿠폰관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        쿠폰목록
        <span class="list-count">
          {{ pager.pageTotalCount }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('coupons-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('coupons-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="coupons" row-key="couponId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(c) => selectedId===c.couponId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('coupons-sort', key)" @row-click="c => handleSelectAction('coupons-rowEdit', c.couponId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: c }">
        <div class="actions">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('coupons-rowEdit', c.couponId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('coupons-rowDelete', c)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' && pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleSelectAction('coupons-pager-setPage', n)" :on-size-change="() => handleSelectAction('coupons-pager-sizeChange')" />
    <!-- ===== □.□. 목록 영역 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="coupons.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="c in coupons" :key="c?.couponId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===c.couponId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('coupons-rowEdit', c.couponId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            쿠폰 #{{ c.couponId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('coupons-rowEdit', c.couponId)" :style="selectedId===c.couponId?{color:'#e8587a'}:{}">
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
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('coupons-rowEdit', c.couponId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('coupons-rowDelete', c)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ c.couponId }}
          </span>
        </div>
      </div>
    </div>
    <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('coupons-pager-setPage', n)" :on-size-change="() => handleSelectAction('coupons-pager-sizeChange')" />
  </div>
  <!-- ===== □.□. 카드 뷰 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: CouponDtl 임베드 ==================================== -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-coupon-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
  </div>
</div>
<!-- ===== □. 하단 상세: CouponDtl 임베드 ==================================== -->
`
};

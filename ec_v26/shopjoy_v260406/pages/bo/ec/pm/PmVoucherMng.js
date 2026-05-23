/* ShopJoy Admin - 상품권관리 목록 + 하단 VoucherDtl 임베드 */
window.PmVoucherMng = {
  name: 'PmVoucherMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const vouchers = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      voucher_statuses: [],
      promo_statuses: [],
      date_range_opts: [],
    });

    /* 바우처(상품권) fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.voucher_statuses = codeStore.sgGetGrpCodes('VOUCHER_STATUS');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'voucherNm asc', desc: 'voucherNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 바우처(상품권) getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 바우처(상품권) onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 바우처(상품권) sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 바우처(상품권) 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'voucherNm,voucherId';
        }
        const res = await boApiSvc.pmVoucher.getPage(params, '바우처관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        vouchers.splice(0, vouchers.length, ...list);
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    /* 바우처(상품권) handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
  const searchParam = reactive(_initSearchParam());

    /* 바우처(상품권) loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 바우처(상품권) 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 바우처(상품권) openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 바우처(상품권) closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 바우처(상품권) inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmVoucherMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 바우처(상품권) fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 바우처(상품권) fnStatusBadge */
    const _VOUCHER_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _VOUCHER_STATUS_FB[s] || 'badge-gray');

    /* 바우처(상품권) 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 바우처(상품권) onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      onSearch();
    };

    /* 바우처(상품권) setPage */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 바우처(상품권) onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 바우처(상품권) 삭제 */
    const handleDelete = async (v) => {
      const ok = await showConfirm('삭제', `[${v.voucherNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (voucherList || []).findIndex(x => x.voucherId === v.voucherId);
      if (idx !== -1) voucherList.splice(idx, 1);
      if (uiStateDetail.selectedId === v.voucherId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmVoucher.remove(v.voucherId, '바우처관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 바우처(상품권) exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(vouchers, [{label:'ID',key:'voucherId'},{label:'상품권명',key:'voucherNm'},{label:'액면가',key:'voucherValue'},{label:'유형',key:'voucherTypeCd'},{label:'최소주문금액',key:'minOrderAmt'},{label:'최대할인금액',key:'maxDiscntAmt'},{label:'유효개월',key:'expireMonth'},{label:'상태',key:'voucherStatusCd'}], '상품권목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

    // -- return ---------------------------------------------------------------

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'voucherNm', label: '상품권명' },
          { value: 'voucherId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.promo_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '판매기간',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];

    const baseGridColumns = [
      { key: 'voucherNm',       label: '상품권명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'voucherValue',    label: '액면가', align: 'right',
        fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'salePrice',       label: '판매가', align: 'right',
        fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'issueQty',        label: '발행매수', align: 'center',
        fmt: (v) => (v || 0).toLocaleString() + '개' },
      { key: 'soldQty',         label: '판매매수', align: 'center',
        fmt: (v) => (v || 0).toLocaleString() + '개' },
      { key: 'remain',          label: '잔여', align: 'center',
        fmt: (v, row) => ((row.issueQty || 0) - (row.soldQty || 0)).toLocaleString() + '개' },
      { key: 'startDate',       label: '시작일', sortKey: 'reg' },
      { key: 'endDate',         label: '종료일' },
      { key: 'voucherStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.voucherStatusCd) },
      { key: 'siteNm',          label: '사이트', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), vouchers, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  template: /* html */`
<div>
  <div class="page-title">상품권관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        상품권목록
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="tabMode='list'" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="tabMode='card'" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="vouchers" :pager="pager" row-key="voucherId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(v) => selectedId===v.voucherId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @row-click="v => handleLoadDetail(v.voucherId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: v }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(v.voucherId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(v)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <!-- -- 카드 뷰 --------------------------------------------------------- -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="vouchers.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="v in vouchers" :key="v?.voucherId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===v.voucherId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(v.voucherId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">상품권 #{{ v.voucherId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(v.voucherId)" :style="selectedId===v.voucherId?{color:'#e8587a'}:{}">
            {{ v.voucherNm }}
            <span v-if="selectedId===v.voucherId" style="font-size:10px;margin-left:4px;">▼</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(v.voucherStatusCd)" style="font-size:11px;">{{ v.voucherStatusCd }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>💰 액면 {{ (v.voucherValue||0).toLocaleString() }}원 / 판매 {{ (v.salePrice||0).toLocaleString() }}원</div>
            <div>📅 {{ v.startDate }} ~ {{ v.endDate }}</div>
            <div style="color:#999;margin-top:4px;">
              발행 {{ (v.issueQty||0).toLocaleString() }}개 / 판매 {{ (v.soldQty||0).toLocaleString() }}개
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(v.voucherId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(v)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ v.voucherId }}</span>
        </div>
      </div>
    </div>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
  <!-- -- 하단 상세: VoucherDtl 임베드 ------------------------------------------ -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-voucher-dtl
      :key="cfDetailKey"
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
`
};

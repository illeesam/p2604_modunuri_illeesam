/* ShopJoy Admin - 쿠폰관리 목록 + 하단 CouponDtl 임베드 */
window.PmCouponMng = {
  name: 'PmCouponMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const coupons = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      coupon_types: [],
      coupon_statuses: [],
      date_range_opts: [],
    });


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
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);



    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { kw: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmCoupon.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '쿠폰관리', '목록조회');
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
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCouponMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const discountLabel = c => c.discountTypeCd === 'rate' ? (c.discountValue||0) + '%' : c.discountTypeCd === 'shipping' ? '무료배송' : (c.discountValue||0).toLocaleString() + '원';
    const fnStatusBadge = s => ({ '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(coupons)) return;
      const idx = coupons.findIndex(x => x.couponId === c.couponId);
      if (idx !== -1) coupons.splice(idx, 1);
      if (uiStateDetail.selectedId === c.couponId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmCoupon.remove(c.couponId, '쿠폰관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(coupons, [{label:'ID',key:'couponId'},{label:'쿠폰명',key:'couponNm'},{label:'유형',key:'discountTypeCd'},{label:'할인값',key:'discountValue'},{label:'최소금액',key:'minOrderAmount'},{label:'상태',key:'statusCd'},{label:'유효기간(시작)',key:'validFrom'},{label:'유효기간(종료)',key:'validTo'}], '쿠폰목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), coupons, uiState, codes, searchParam, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, discountLabel, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; },
      get selectedId() { return uiStateDetail.selectedId; } };
  },
  template: /* html */`
<div>
  <div class="page-title">쿠폰관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="쿠폰명 / 코드 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.coupon_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>쿠폰목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="tabMode='list'" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">☰ 리스트</button>
          <button @click="tabMode='card'" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">⊞ 카드</button>
        </div>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table" v-if="tabMode==='list'">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">쿠폰명 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>코드</th><th>할인</th><th>최소주문</th><th>발급대상</th><th>발급/사용</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">만료일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="coupons.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(c, idx) in coupons" :key="c?.couponId" :style="selectedId===c.couponId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="handleLoadDetail(c.couponId)" :style="selectedId===c.couponId?'color:#e8587a;font-weight:700;':''">{{ c.name }}<span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;">{{ c.code }}</code></td>
          <td>{{ discountLabel(c) }}</td>
          <td>{{ c.minOrder ? c.minOrder.toLocaleString()+'원↑' : '-' }}</td>
          <td>{{ c.issueTo }}</td>
          <td>{{ c.issueCount }} / {{ c.useCount }}</td>
          <td>{{ c.expiry }}</td>
          <td><span class="badge" :class="fnStatusBadge(c.statusCd)">{{ c.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.couponId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(c)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- -- 카드 뷰 --------------------------------------------------------- -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="coupons.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="c in coupons" :key="c?.couponId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===c.couponId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(c.couponId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">쿠폰 #{{ c.couponId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(c.couponId)" :style="selectedId===c.couponId?{color:'#e8587a'}:{}">{{ c.name }}<span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(c.statusCd)" style="font-size:11px;">{{ c.statusCd }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>💰 {{ discountLabel(c) }}</div>
            <div>📅 {{ c.validFrom }} ~ {{ c.validTo }}</div>
            <div style="color:#999;margin-top:4px;">만료 {{ c.expiry }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.couponId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(c)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ c.couponId }}</span>
        </div>
      </div>
    </div>

    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 하단 상세: CouponDtl 임베드 ------------------------------------------- -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-coupon-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    :on-list-reload="handleSearchList"
  />
  </div>
</div>
`
};

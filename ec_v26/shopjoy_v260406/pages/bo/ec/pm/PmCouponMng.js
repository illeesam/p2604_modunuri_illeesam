/* ShopJoy Admin - 쿠폰관리 목록 + 하단 CouponDtl 임베드 */
window.PmCouponMng = {
  name: 'PmCouponMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
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

    /* 쿠폰 _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 쿠폰 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'couponNm asc', desc: 'couponNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 쿠폰 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 쿠폰 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 쿠폰 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 쿠폰 목록조회 */
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

    /* 쿠폰 loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 쿠폰 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 쿠폰 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 쿠폰 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 쿠폰 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCouponMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 쿠폰 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 쿠폰 discountLabel */
    const discountLabel = c => c.discountRate ? (c.discountRate||0) + '%' : (c.discountAmt||0).toLocaleString() + '원';

    /* 쿠폰 fnStatusBadge */
    const _COUPON_STATUS_FB = { '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _COUPON_STATUS_FB[s] || 'badge-gray');

    /* 쿠폰 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 쿠폰 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* 쿠폰 setPage */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 쿠폰 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 쿠폰 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.couponNm}]을 삭제하시겠습니까?`);
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

    /* 쿠폰 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(coupons, [{label:'ID',key:'couponId'},{label:'쿠폰명',key:'couponNm'},{label:'코드',key:'couponCd'},{label:'유형',key:'couponTypeCdNm'},{label:'할인율',key:'discountRate'},{label:'할인액',key:'discountAmt'},{label:'최소금액',key:'minOrderAmt'},{label:'상태',key:'couponStatusCdNm'},{label:'유효기간(시작)',key:'validFrom'},{label:'유효기간(종료)',key:'validTo'}], '쿠폰목록.csv');

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
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'couponNm',   label: '쿠폰명' },
          { value: 'couponCd', label: '코드' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
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
          <td><span class="title-link" @click="handleLoadDetail(c.couponId)" :style="selectedId===c.couponId?'color:#e8587a;font-weight:700;':''">{{ c.couponNm }}<span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;">{{ c.couponCd }}</code></td>
          <td>{{ discountLabel(c) }}</td>
          <td>{{ c.minOrderAmt ? c.minOrderAmt.toLocaleString()+'원↑' : '-' }}</td>
          <td>{{ c.targetTypeCdNm || '-' }}</td>
          <td>{{ c.issueCnt || 0 }} / {{ c.issueLimit || 0 }}</td>
          <td>{{ c.validTo }}</td>
          <td><span class="badge" :class="fnStatusBadge(c.couponStatusCdNm || c.couponStatusCd)">{{ c.couponStatusCdNm || c.couponStatusCd }}</span></td>
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
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(c.couponId)" :style="selectedId===c.couponId?{color:'#e8587a'}:{}">{{ c.couponNm }}<span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(c.couponStatusCdNm || c.couponStatusCd)" style="font-size:11px;">{{ c.couponStatusCdNm || c.couponStatusCd }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>💰 {{ discountLabel(c) }}</div>
            <div>📅 {{ c.validFrom }} ~ {{ c.validTo }}</div>
            <div style="color:#999;margin-top:4px;">만료 {{ c.validTo }}</div>
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
    
    
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
  />
  </div>
</div>
`
};

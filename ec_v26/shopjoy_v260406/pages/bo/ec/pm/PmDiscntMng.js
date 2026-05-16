/* ShopJoy Admin - 판촉할인 관리 목록 + 하단 PmDiscntDtl 임베드 */
window.PmDiscntMng = {
  name: 'PmDiscntMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const discounts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      discount_types: [],
      discount_statuses: [],
      discnt_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });

    /* 할인 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.discount_types = codeStore.sgGetGrpCodes('DISCOUNT_TYPE');
        codes.discount_statuses = codeStore.sgGetGrpCodes('DISCOUNT_STATUS');
        codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE_KR');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'discntNm asc', desc: 'discntNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 할인 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 할인 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 할인 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 할인 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'def_nm,def_id';
        }
        const res = await boApiSvc.pmDiscnt.getPage(params, '할인관리', '목록조회');
        const data = res.data?.data;
        discounts.splice(0, discounts.length, ...(data?.pageList || []));
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
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    /* 할인 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
  const searchParam = reactive(_initSearchParam());

    /* 할인 loadView */
    const loadView   = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 할인 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 할인 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 할인 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 할인 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmDiscntMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 할인 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 할인 fnTypeBadge */
    const fnTypeBadge   = t => ({ '정률': 'badge-blue', '정액': 'badge-green', '장바구니': 'badge-orange' }[t] || 'badge-gray');

    /* 할인 fnStatusBadge */
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' }[s] || 'badge-gray');

    /* 할인 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 할인 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* 할인 setPage */
    const setPage      = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 할인 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 할인 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.discntNm}] 할인을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (discounts || []).findIndex(x => x.discntId === d.discntId);
      if (idx !== -1) discounts.splice(idx, 1);
      if (uiStateDetail.selectedId === d.discntId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmDiscnt.remove(d.discntId, '할인관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 할인 exportExcel */
    const exportExcel = () => coUtil.exportCsv(discounts,
      [{label:'ID',key:'discntId'},{label:'할인명',key:'discntNm'},{label:'유형',key:'discntType'},{label:'할인값',key:'discntVal'},{label:'상태',key:'discntStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '할인목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), discounts, uiState, codes, searchParam, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  template: /* html */`
<div>
  <div class="page-title">할인관리</div>
  <div class="card">
    <div class="search-bar">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'def_nm', label: '할인명' },
          { value: 'def_id', label: 'ID' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option v-for="c in codes.discnt_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.promo_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">시작일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>할인목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
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
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">할인명 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>유형</th><th>할인값</th><th>적용대상</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">시작일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>종료일</th><th>상태</th><th>사이트</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="discounts.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(d, idx) in discounts" :key="d?.discntId" :style="selectedId===d.discntId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="handleLoadDetail(d.discntId)" :style="selectedId===d.discntId?'color:#e8587a;font-weight:700;':''">{{ d.discntNm }}<span v-if="selectedId===d.discntId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="fnTypeBadge(d.discntType)">{{ d.discntType }}</span></td>
          <td>{{ d.discntType === '정률' ? (d.discntVal + '%') : (d.discntVal||0).toLocaleString() + '원' }}</td>
          <td style="font-size:12px;color:#555;">{{ d.applyTarget || '전체상품' }}</td>
          <td>{{ d.startDate }}</td>
          <td>{{ d.endDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(d.discntStatus)">{{ d.discntStatus }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.discntId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(d)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- -- 카드 뷰 --------------------------------------------------------- -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="discounts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="d in discounts" :key="d?.discntId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===d.discntId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(d.discntId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">할인 #{{ d.discntId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(d.discntId)" :style="selectedId===d.discntId?{color:'#e8587a'}:{}">{{ d.discntNm }}<span v-if="selectedId===d.discntId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(d.discntType)" style="font-size:11px;">{{ d.discntType }}</span>
            <span class="badge" :class="fnStatusBadge(d.discntStatus)" style="font-size:11px;">{{ d.discntStatus }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ d.discntType === '정률' ? (d.discntVal + '%') : (d.discntVal||0).toLocaleString() + '원' }}</div>
            <div>📅 {{ d.startDate }} ~ {{ d.endDate }}</div>
            <div style="color:#999;margin-top:4px;">{{ d.applyTarget || '전체상품' }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.discntId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(d)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ d.discntId }}</span>
        </div>
      </div>
    </div>

    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 하단 상세: PmDiscntDtl 임베드 ----------------------------------------- -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-discnt-dtl
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

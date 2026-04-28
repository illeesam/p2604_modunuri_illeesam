/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const areas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ layout_types: [] });

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading
          && codeStore?.svCodes?.length > 0
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      codes.layout_types = codeStore.snGetGrpCodes('LAYOUT_TYPE') || [];
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/ec/dp/area/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('전시영역관리', '목록조회')
        });
        areas.splice(0, areas.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('DpDispArea 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });
    const fnPathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    /* ── 검색 ── */
    const DATE_RANGE_OPTIONS = boUtil.DATE_RANGE_OPTIONS;
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const searchParam = reactive({
    kw: '',
    areaType: '',
    useYn: '',
    dateStart: '',
    dateEnd: '',
    dateRange: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    areaType: '',
    useYn: '',
    dateStart: '',
    dateEnd: '',
    dateRange: ''
  });

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const onSearch = async () => {
    try {
      pager.pageNo = 1;
      await handleSearchData();
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };

    /* ── 하단 상세 임베드 ── */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispAreaMng') { uiStateDetail.selectedId = null; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);

    const cfFiltered = computed(() => {
      const kw = searchParam.kw.toLowerCase();
      return (areas || []).filter(a => {
        if (kw && !(a.codeLabel||'').toLowerCase().includes(kw) && !(a.codeValue||'').toLowerCase().includes(kw)) return false;
        if (searchParam.areaType && a.areaType !== searchParam.areaType) return false;
        if (searchParam.useYn && a.useYn !== searchParam.useYn) return false;
        const d = String(a.regDate||'').slice(0,10);
        if (searchParam.dateStart && d < searchParam.dateStart) return false;
        if (searchParam.dateEnd && d > searchParam.dateEnd) return false;
        return true;
      });
    });
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.pageSize)));
    const cfPageList   = computed(() => cfFiltered.value.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize));
    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    // ── return ───────────────────────────────────────────────────────────────

    return { areas, uiState, codes, pager, searchParam, DATE_RANGE_OPTIONS,
      cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums,
      onSearch, onReset, setPage, onSizeChange, handleDateRangeChange, cfSiteNm,
      uiStateDetail, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfDetailEditId };
  },
  template: /* html */`
<div>
  <div class="page-title">전시 영역 관리</div>
  <div class="card">
    <div class="search-bar">
      <label class="search-label">키워드</label>
      <input class="form-control" v-model="searchParam.kw" placeholder="영역코드/명 검색" @keyup.enter="onSearch" style="width:200px;" />
      <label class="search-label">사용여부</label>
      <select class="form-control" v-model="searchParam.useYn" style="width:100px;">
        <option value="">전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">🔍 조회</button>
        <button class="btn btn-secondary" @click="onReset">↺ 초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-count">총 {{ cfTotal }}건</span>
      <button class="btn btn-primary btn-sm" @click="openNew">✚ 신규등록</button>
      <select class="form-control" v-model.number="pager.pageSize" @change="onSizeChange" style="width:80px;">
        <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}건</option>
      </select>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>영역코드</th><th>영역명</th><th>유형</th><th>사용여부</th><th>등록일</th><th>액션</th>
      </tr></thead>
      <tbody>
        <tr v-if="uiState.loading"><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">로딩 중...</td></tr>
        <tr v-else-if="!cfPageList.length"><td colspan="6" style="text-align:center;padding:30px;color:#aaa;">조회된 데이터가 없습니다.</td></tr>
        <tr v-for="a in cfPageList" :key="a?.codeId">
          <td><code style="font-size:11px;">{{ a.codeValue }}</code></td>
          <td class="title-link" @click="loadView(a.codeId)">{{ a.codeLabel }}</td>
          <td>{{ a.areaType }}</td>
          <td><span :class="'badge '+(a.useYn==='Y'?'badge-green':'badge-gray')">{{ a.useYn==='Y'?'사용':'미사용' }}</span></td>
          <td>{{ (a.regDate||'').slice(0,10) }}</td>
          <td class="actions">
            <button class="btn btn-sm btn-secondary" @click="loadView(a.codeId)">상세</button>
            <button class="btn btn-sm btn-primary" @click="handleLoadDetail(a.codeId)">수정</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button class="pager" @click="setPage(pager.pageNo-1)" :disabled="pager.pageNo===1">◀</button>
      <button v-for="n in cfPageNums" :key="n" class="pager" :class="{active:n===pager.pageNo}" @click="setPage(n)">{{ n }}</button>
      <button class="pager" @click="setPage(pager.pageNo+1)" :disabled="pager.pageNo===cfTotalPages">▶</button>
    </div>
  </div>
  <div v-if="uiStateDetail.selectedId" class="card" style="margin-top:10px;">
    <dp-disp-area-dtl
      :navigate="inlineNavigate"
      :admin-data="null"
      :show-toast="$props.showToast"
      :show-confirm="$props.showConfirm"
      :set-api-res="$props.setApiRes"
      :edit-id="cfDetailEditId"
      :view-mode="uiStateDetail.openMode"
      @close="closeDetail" />
  </div>
</div>`
};

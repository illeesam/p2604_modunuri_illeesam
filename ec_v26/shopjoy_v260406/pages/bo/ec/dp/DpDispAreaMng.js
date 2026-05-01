/* ShopJoy Admin - 전시영역관리 (목록 + 하단 상세 임베드) */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const areas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null });
    const codes = reactive({ layout_types: [], use_yn: [], date_range_opts: [] });

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading
          && codeStore?.svCodes?.length > 0
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.layout_types = codeStore.snGetGrpCodes('LAYOUT_TYPE') || [];
      codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
      codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
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
        const res = await boApiSvc.dpArea.getPage({ pageNo: 1, pageSize: 10000 }, '전시영역관리', '목록조회');
        areas.splice(0, areas.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
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
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });
    const fnPathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    /* ── 표시경로 트리 ── */
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; };
    const cfTree = computed(() => boUtil.buildPathTree('ec_disp_area'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      const initSet = boUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    /* ── 검색 ── */
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
      Object.assign(applied, searchParam);
      pager.pageNo = 1;
      await handleSearchData();
    } catch (err) {
      console.error('[catch-info]', err);
    }
  };

    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    Object.assign(applied, searchParamOrg);
    pager.pageNo = 1;
    handleSearchData();
  };
  
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.pageNo = n; };
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

    const applied = reactive({ kw: '', areaType: '', useYn: '', dateStart: '', dateEnd: '', dateRange: '' });

    const cfFiltered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (areas || []).filter(a => {
        if (kw && !(a.codeLabel||'').toLowerCase().includes(kw) && !(a.codeValue||'').toLowerCase().includes(kw)) return false;
        if (applied.areaType && a.areaType !== applied.areaType) return false;
        if (applied.useYn && a.useYn !== applied.useYn) return false;
        const d = String(a.regDate||'').slice(0,10);
        if (applied.dateStart && d < applied.dateStart) return false;
        if (applied.dateEnd && d > applied.dateEnd) return false;
        return true;
      });
    });
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.pageSize)));
    const cfPageList   = computed(() => cfFiltered.value.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize));
    const cfPageNums   = computed(() => { const c=pager.pageNo,l=cfTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    // ── return ───────────────────────────────────────────────────────────────

    return { areas, uiState, codes, pager, searchParam, applied,
      cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums,
      onSearch, onReset, setPage, onSizeChange, handleDateRangeChange, cfSiteNm,
      expanded, toggleNode, selectNode, cfTree, expandAll, collapseAll, fnPathLabel,
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
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">🔍 조회</button>
        <button class="btn btn-secondary" @click="onReset">↺ 초기화</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:minmax(180px,22fr) 78fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;min-width:180px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-count">총 {{ cfTotal }}건</span>
        <button class="btn btn-primary btn-sm" @click="openNew">✚ 신규등록</button>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th>영역코드</th><th>영역명</th><th>유형</th><th>사용여부</th><th>등록일</th><th>액션</th>
        </tr></thead>
        <tbody>
          <tr v-if="uiState.loading"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">로딩 중...</td></tr>
          <tr v-else-if="!cfPageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">조회된 데이터가 없습니다.</td></tr>
          <tr v-for="(a, idx) in cfPageList" :key="a?.codeId">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
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
        <div class="pager">
          <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
          <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
          <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
          <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(pager.pageNo+1)">›</button>
          <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
            <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}건</option>
          </select>
        </div>
      </div>
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

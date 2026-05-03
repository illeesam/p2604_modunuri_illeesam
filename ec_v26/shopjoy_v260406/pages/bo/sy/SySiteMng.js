/* ShopJoy Admin - 사이트관리 목록 */
window.SySiteMng = {
  name: 'SySiteMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const sites = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ site_oper_statuses: [], date_range_opts: [] });

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

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.sySite.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) }, '사이트관리', '목록조회');
        const data = res.data?.data;
        sites.splice(0, sites.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || sites.length;
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
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.site_oper_statuses = codeStore.sgGetGrpCodes('SITE_OPER_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

  const _initSearchParam = () => {
    const today = new Date();
    const thisYear = today.getFullYear();
    return { kw: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
  };
  const searchParam = reactive(_initSearchParam());

    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view' // 'view' | 'edit'
    });

    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; };
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; };
    const openNew    = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; };
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'sySiteMng') {
        detailModal.show = false;
        detailModal.dtlId = null;
        if (opts.reload) handleSearchList('RELOAD');
        return;
      }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const cfTypeOptions = computed(() => [...new Set(sites.map(s => s.siteTypeCd))].sort());
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const fnStatusBadge = s => ({ '운영중': 'badge-green', '점검중': 'badge-orange', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const fnTypeBadge   = t => ({
      '이커머스': 'badge-red', '숙박공유': 'badge-blue', '전문가연결': 'badge-purple',
      'IT매칭': 'badge-blue', '부동산': 'badge-orange', '교육': 'badge-green',
      '중고거래': 'badge-orange', '영화예매': 'badge-red', '음식배달': 'badge-orange',
      '가격비교': 'badge-blue', '시각화': 'badge-purple', '홈페이지': 'badge-gray',
    }[t] || 'badge-gray');

    const onSearch = () => { pager.pageNo = 1; handleSearchList('SEARCH'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (s) => {
      const ok = await showConfirm('삭제', `[${s.siteCode}] ${s.siteNm} 사이트를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = sites.findIndex(x => x.siteId === s.siteId);
      if (idx !== -1) sites.splice(idx, 1);
      if (detailModal.dtlId === s.siteId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.sySite.remove(s.siteId, '사이트관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(sites, [{label:'ID',key:'siteId'},{label:'사이트코드',key:'siteCode'},{label:'사이트명',key:'siteNm'},{label:'도메인',key:'domain'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '사이트목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */



    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    // -- return ---------------------------------------------------------------

    return { sites, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode,
      searchParam, onDateRangeChange,
      cfTypeOptions,
      pager,
      onSearch, onReset, setPage, onSizeChange,
      fnStatusBadge, fnTypeBadge, handleDelete,
      cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey,
      detailModal, exportExcel, onSort, sortIcon,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">사이트관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="사이트코드 / 사이트명 / 도메인 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in cfTypeOptions" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.site_oper_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_site</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="sy_site" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사이트목록 <span class="list-count">{{ pager.pageTotalCount }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th style="min-width:140px;">표시경로</th>
        <th>사이트코드</th><th>유형</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">사이트명 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>도메인</th><th>대표이메일</th><th>대표전화</th><th>대표자</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="sites.length===0"><td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(s, idx) in sites" :key="s.siteId" :style="detailModal.dtlId===s.siteId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td style="font-size:12px;"><div style="display:flex;align-items:center;gap:6px;"><span style="flex:1;padding:4px 6px;background:#f3f4f6;border-radius:4px;color:#666;font-weight:500;">{{ pathLabel(s.pathId) || '미설정' }}</span><button type="button" @click="openPathPick(s)" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#6b7280;flex-shrink:0;padding:0;hover:background:#eef2ff;">🔍</button></div></td>
          <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ s.siteCode }}</code></td>
          <td><span class="badge" :class="fnTypeBadge(s.siteTypeCd)" style="font-size:10px;">{{ s.siteTypeCd }}</span></td>
          <td>
            <span class="title-link" @click="handleLoadDetail(s.siteId)" :style="detailModal.dtlId===s.siteId?'color:#e8587a;font-weight:700;':''">
              {{ s.siteNm }}<span v-if="detailModal.dtlId===s.siteId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
            <div style="font-size:11px;color:#888;margin-top:2px;">{{ s.description }}</div>
          </td>
          <td style="font-size:12px;color:#2563eb;">{{ s.siteDomain }}</td>
          <td style="font-size:12px;">{{ s.siteEmail }}</td>
          <td style="font-size:12px;">{{ s.sitePhone }}</td>
          <td style="font-size:12px;">{{ s.siteCeo }}</td>
          <td style="font-size:12px;">{{ s.regDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(s.siteStatusCd)">{{ s.siteStatusCd }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.siteId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(s)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-site-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'" />
  </div>
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_site"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

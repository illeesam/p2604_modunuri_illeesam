/* ShopJoy Admin - 사이트관리 목록 */
window.SySiteMng = {
  name: 'SySiteMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const sites = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({});

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/site/page', {
          params: {
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          },
          headers: { 'X-UI-Nm': '사이트관리', 'X-Cmd-Nm': '조회' }
        });
        const data = res.data?.data;
        sites.splice(0, sites.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || sites.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SySite 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* ── 표시경로 선택 모달 (sy_path) ── */
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
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* ── 좌측 표시경로 트리 ── */
        const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { uiState.selectedPath = path; };
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_site'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      Object.assign(searchParamOrg, searchParam);
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
  const searchParam = reactive({
    kw: '',
    type: '',
    status: '',
    dateRange: '',
    dateStart: '',
    dateEnd: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    type: '',
    status: '',
    dateRange: '',
    dateStart: '',
    dateEnd: ''
  });

    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = window.boCmUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const detailModal = reactive({
      show: false,
      editId: null,
      viewMode: 'view' // 'view' | 'edit'
    });

    const loadView = (id) => { if (detailModal.editId === id && detailModal.viewMode === 'view') { detailModal.show = false; detailModal.editId = null; return; } detailModal.editId = id; detailModal.viewMode = 'view'; detailModal.show = true; };
    const handleLoadDetail = (id) => { if (detailModal.editId === id && detailModal.viewMode === 'edit') { detailModal.show = false; detailModal.editId = null; return; } detailModal.editId = id; detailModal.viewMode = 'edit'; detailModal.show = true; };
    const openNew    = () => { detailModal.editId = '__new__'; detailModal.viewMode = 'edit'; detailModal.show = true; };
    const closeDetail = () => { detailModal.show = false; detailModal.editId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'sySiteMng') { detailModal.show = false; detailModal.editId = null; return; }
      if (pg === '__switchToEdit__') { detailModal.viewMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.editId === '__new__' ? null : detailModal.editId);
    const cfIsViewMode = computed(() => detailModal.viewMode === 'view' && detailModal.editId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.editId}_${detailModal.viewMode}`);

    const cfTypeOptions = computed(() => [...new Set(sites.map(s => s.siteType))].sort());
    const cfPageNums = computed(() => {
      const cur = pager.pageNo, last = pager.pageTotalPage;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnStatusBadge = s => ({ '운영중': 'badge-green', '점검중': 'badge-orange', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const fnTypeBadge   = t => ({
      '이커머스': 'badge-red', '숙박공유': 'badge-blue', '전문가연결': 'badge-purple',
      'IT매칭': 'badge-blue', '부동산': 'badge-orange', '교육': 'badge-green',
      '중고거래': 'badge-orange', '영화예매': 'badge-red', '음식배달': 'badge-orange',
      '가격비교': 'badge-blue', '시각화': 'badge-purple', '홈페이지': 'badge-gray',
    }[t] || 'badge-gray');

    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (s) => {
      const ok = await props.showConfirm('삭제', `[${s.siteCode}] ${s.siteNm} 사이트를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = sites.findIndex(x => x.siteId === s.siteId);
      if (idx !== -1) sites.splice(idx, 1);
      if (detailModal.editId === s.siteId) { detailModal.show = false; detailModal.editId = null; }
      try {
        const res = await window.boApi.delete(`/bo/sy/site/${s.siteId}`, { headers: { 'X-UI-Nm': '사이트관리', 'X-Cmd-Nm': '삭제' } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(sites, [{label:'ID',key:'siteId'},{label:'사이트코드',key:'siteCode'},{label:'사이트명',key:'siteNm'},{label:'도메인',key:'domain'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '사이트목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */

    watch(() => uiState.selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    // ── return ───────────────────────────────────────────────────────────────

    return { sites, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      searchParam, DATE_RANGE_OPTIONS, onDateRangeChange,
      cfTypeOptions,
      pager, cfPageNums,
      onSearch, onReset, setPage, onSizeChange,
      fnStatusBadge, fnTypeBadge, handleDelete,
      cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey,
      detailModal, exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">사이트관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="사이트코드 / 사이트명 / 도메인 검색" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in cfTypeOptions" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option><option>운영중</option><option>점검중</option><option>비활성</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <!-- ── 좌 트리 + 우 영역 ──────────────────────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사이트목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="min-width:140px;">표시경로</th>
        <th>사이트코드</th><th>유형</th><th>사이트명</th><th>도메인</th><th>대표이메일</th><th>대표전화</th><th>대표자</th><th>등록일</th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="sites.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="s in sites" :key="s.siteId" :style="detailModal.editId===s.siteId?'background:#fff8f9;':''">
          <td style="font-size:12px;"><div style="display:flex;align-items:center;gap:6px;"><span style="flex:1;padding:4px 6px;background:#f3f4f6;border-radius:4px;color:#666;font-weight:500;">{{ pathLabel(s.pathId) || '미설정' }}</span><button type="button" @click="openPathPick(s)" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#6b7280;flex-shrink:0;padding:0;hover:background:#eef2ff;">🔍</button></div></td>
          <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ s.siteCode }}</code></td>
          <td><span class="badge" :class="fnTypeBadge(s.siteType)" style="font-size:10px;">{{ s.siteType }}</span></td>
          <td>
            <span class="title-link" @click="handleLoadDetail(s.siteId)" :style="detailModal.editId===s.siteId?'color:#e8587a;font-weight:700;':''">
              {{ s.siteNm }}<span v-if="detailModal.editId===s.siteId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
            <div style="font-size:11px;color:#888;margin-top:2px;">{{ s.description }}</div>
          </td>
          <td style="font-size:12px;color:#2563eb;">{{ s.domain }}</td>
          <td style="font-size:12px;">{{ s.email }}</td>
          <td style="font-size:12px;">{{ s.phone }}</td>
          <td style="font-size:12px;">{{ s.ceo }}</td>
          <td style="font-size:12px;">{{ s.regDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(s.statusCd)">{{ s.statusCd }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.siteId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(s)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="sz in pager.pageSizes" :key="sz" :value="sz">{{ sz }}개</option>
        </select>
      </div>
    </div>
  </div>

  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-site-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_site"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

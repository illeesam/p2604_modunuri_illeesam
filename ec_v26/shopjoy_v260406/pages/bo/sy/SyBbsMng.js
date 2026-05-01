/* ShopJoy Admin - 게시글관리 */
window.SyBbsMng = {
  name: 'SyBbsMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const bbss = reactive([]);
    const bbms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({ bbs_status: [], bbs_post_statuses: [], date_range_opts: [] });

    // 게시글 목록 조회
    const handleSearchBbs = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBbs.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) }, '게시판관리', '목록조회');
        const data = res.data?.data;
        bbss.splice(0, bbss.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || bbss.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // 게시판 목록 조회 (초기 로드 시에만)
    const handleLoadBbmList = async () => {
      try {
        const res = await boApiSvc.syBbm.getPage({ pageNo: 1, pageSize: 10000 }, '게시판관리', '목록조회');
        bbms.splice(0, bbms.length, ...(res.data?.data?.list || []));
      } catch (err) {
        console.error('[handleLoadBbmList]', err);
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
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* ── 좌측 표시경로 트리 ── */
        const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { uiState.selectedPath = path; };
    const cfTree = computed(() => boUtil.buildPathTree('sy_bbs'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleLoadBbmList();
      await handleSearchBbs('DEFAULT');
      const initSet = boUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      Object.assign(searchParamOrg, searchParam);
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.bbs_status = await codeStore.snGetGrpCodes('BBS_STATUS') || [];
        codes.bbs_post_statuses = await codeStore.snGetGrpCodes('BBS_POST_STATUS') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
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

    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const searchParam = reactive({
      kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '', dateRange: ''
    });
    const searchParamOrg = reactive({
      kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '', dateRange: ''
    });
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
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
    const openNew = () => { detailModal.editId = '__new__'; detailModal.viewMode = 'edit'; detailModal.show = true; };
    const closeDetail = () => { detailModal.show = false; detailModal.editId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbsMng') { detailModal.show = false; detailModal.editId = null; return; }
      if (pg === '__switchToEdit__') { detailModal.viewMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.editId === '__new__' ? null : detailModal.editId);
    const cfIsViewMode = computed(() => detailModal.viewMode === 'view' && detailModal.editId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.editId}_${detailModal.viewMode}`);

    const cfBbmOptions = computed(() => bbms.map(b => ({ value: b.bbmId, label: b.bbmNm })));
    const bbmNm = (bbmId) => { const b = bbms.find(x => x.bbmId === bbmId); return b ? b.bbmNm : bbmId; };
    const cfPageNums = computed(() => {
      const cur = pager.pageNo, last = pager.pageTotalPage;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const fnStatusBadge = s => ({ '게시': 'badge-green', '임시': 'badge-gray', '삭제': 'badge-red', '비공개': 'badge-orange' }[s] || 'badge-gray');
    const onSearch = () => { pager.pageNo = 1; handleSearchBbs('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchBbs('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchBbs('DEFAULT'); };
    const handleDelete = async (b) => {
      const ok = await props.showConfirm('삭제', `[${b.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = bbss.findIndex(x => x.bbsId === b.bbsId);
      if (idx !== -1) bbss.splice(idx, 1);
      if (detailModal.editId === b.bbsId) { detailModal.show = false; detailModal.editId = null; }
      try {
        const res = await boApiSvc.syBbs.remove(b.bbsId, '게시판관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => boUtil.exportCsv(bbss, [{label:'ID',key:'bbsId'},{label:'제목',key:'title'},{label:'작성자',key:'authorNm'},{label:'조회수',key:'viewCount'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '게시글목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */

    watch(() => uiState.selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    // ── return ───────────────────────────────────────────────────────────────

    return { bbss, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, codes, cfSiteNm, searchParam, handleDateRangeChange, pager, cfPageNums, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, cfBbmOptions, bbmNm, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">게시글관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="제목 / 작성자 검색" />
      <select v-model="searchParam.bbmId">
        <option value="">게시판 전체</option>
        <option v-for="o in cfBbmOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.bbs_post_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>게시글목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th>게시판</th><th>제목</th><th>작성자</th><th>조회수</th><th>댓글</th><th>첨부그룹</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="bbss.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="(b, idx) in bbss" :key="b.bbsId" :style="detailModal.editId===b.bbsId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="badge badge-gray">{{ bbmNm(b.bbmId) }}</span></td>
          <td><span class="title-link" @click="handleLoadDetail(b.bbsId)" :style="detailModal.editId===b.bbsId?'color:#e8587a;font-weight:700;':''">{{ b.title }}<span v-if="detailModal.editId===b.bbsId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ b.authorNm }}</td>
          <td style="text-align:center;">{{ b.viewCount }}</td>
          <td style="text-align:center;">{{ b.commentCount }}</td>
          <td style="font-size:11px;color:#888;">{{ b.attachGrpId || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(b.statusCd)">{{ b.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td>{{ String(b.regDate||'').slice(0,10) }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(b.bbsId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(b)">삭제</button>
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
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-bbs-dtl :key="detailModal.editId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div>
`
};

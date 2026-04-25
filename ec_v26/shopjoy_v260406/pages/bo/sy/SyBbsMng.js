/* ShopJoy Admin - 게시글관리 */
window.SyBbsMng = {
  name: 'SyBbsMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const bbss = reactive([]);
    const bbms = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      loading.value = true;
      try {
        const resBbs = await window.boApi.get('/bo/sy/bbs/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        bbss.splice(0, bbss.length, ...(resBbs.data?.data?.list || []));

        const resBbm = await window.boApi.get('/bo/sy/bbm/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        bbms.splice(0, bbms.length, ...(resBbm.data?.data?.list || []));

        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('SyBbs 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { handleFetchData(); });
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
    const selectedPath = ref(null);
    const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { selectedPath.value = path; };
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_bbs'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */
    onMounted(() => {
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const searchKw = ref(''); const searchBbmId = ref(''); const searchStatus = ref('');
    const searchDateStart = ref(''); const searchDateEnd = ref(''); const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const handleLoadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbsMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const cfBbmOptions = computed(() => bbms.map(b => ({ value: b.bbmId, label: b.bbmNm })));
    const bbmNm = (bbmId) => { const b = bbms.find(x => x.bbmId === bbmId); return b ? b.bbmNm : bbmId; };

    const applied = reactive({ kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '' });
    const cfFiltered = computed(() => bbss.filter(b => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !b.title.toLowerCase().includes(kw) && !String(b.authorNm || '').toLowerCase().includes(kw)) return false;
      if (applied.bbmId && b.bbmId !== Number(applied.bbmId)) return false;
      if (applied.status && b.statusCd !== applied.status) return false;
      const d = String(b.regDate || '').slice(0, 10);
      if (applied.dateStart && d < applied.dateStart) return false;
      if (applied.dateEnd && d > applied.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const fnStatusBadge = s => ({ '게시': 'badge-green', '임시': 'badge-gray', '삭제': 'badge-red', '비공개': 'badge-orange' }[s] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, bbmId: searchBbmId.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchBbmId.value = ''; searchStatus.value = ''; searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = ''; Object.assign(applied, { kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const handleDelete = async (b) => {
      const ok = await props.showConfirm('삭제', `[${b.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = bbss.findIndex(x => x.bbsId === b.bbsId);
      if (idx !== -1) bbss.splice(idx, 1);
      if (selectedId.value === b.bbsId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/sy/bbs/${b.bbsId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'bbsId'},{label:'제목',key:'title'},{label:'작성자',key:'authorNm'},{label:'조회수',key:'viewCount'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '게시글목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */
    watch(selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    return { bbss, loading, error, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectedPath, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, cfSiteNm, searchKw, searchBbmId, searchStatus, searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, selectedId, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, cfBbmOptions, bbmNm, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">게시글관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="제목 / 작성자 검색" />
      <select v-model="searchBbmId">
        <option value="">게시판 전체</option>
        <option v-for="o in cfBbmOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>게시</option><option>임시</option><option>비공개</option><option>삭제</option></select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" />
      <select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>게시글목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th>ID</th><th>게시판</th><th>제목</th><th>작성자</th><th>조회수</th><th>댓글</th><th>첨부그룹</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="b in cfPageList" :key="b.bbsId" :style="selectedId===b.bbsId?'background:#fff8f9;':''">
          <td>{{ b.bbsId }}</td>
          <td><span class="badge badge-gray">{{ bbmNm(b.bbmId) }}</span></td>
          <td><span class="title-link" @click="handleLoadDetail(b.bbsId)" :style="selectedId===b.bbsId?'color:#e8587a;font-weight:700;':''">{{ b.title }}<span v-if="selectedId===b.bbsId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ b.authorNm }}</td>
          <td style="text-align:center;">{{ b.viewCount }}</td>
          <td style="text-align:center;">{{ b.commentCount }}</td>
          <td style="font-size:11px;color:#888;">{{ b.attachGrpId || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(b.statusCd)">{{ b.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td>{{ b.regDate }}</td>
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
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-bbs-dtl :key="selectedId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div>
`
};

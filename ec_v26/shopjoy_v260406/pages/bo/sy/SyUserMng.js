/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const users = reactive([]);
    const depts = reactive([]);
        const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, boUsers: [], selectedDeptId: null});
    const codes = reactive({ user_status: [] });

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        if (uiState.selectedDeptId != null) params.deptId = uiState.selectedDeptId;
        const [resUsers] = await Promise.all([
          window.boApi.get('bo/sy/user/page', { params, headers: { 'X-UI-Nm': '사용자관리', 'X-Cmd-Nm': '조회' } }),
        ]);
        const data = resUsers.data?.data;
        users.splice(0, users.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || users.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyUser 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* 좌측 부서 트리 */
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedDeptId = id; handleSearchData(); };

    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId].children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));
    const expandAll = () => { const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); }; cfTree.value.children.forEach(walk); expanded.add(null); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    const handleSearchTree = async () => {
      try {
        const res = await window.boApi.get('bo/sy/dept/tree', apiHdr('사용자관리', '트리조회'));
        depts.splice(0, depts.length, ...(res.data?.data || []));
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };
    /* 검색 파라미터 */
    const searchParam = reactive({
      kw: '', role: '', status: '', dateRange: '', dateStart: '', dateEnd: ''
    });
    const searchParamOrg = reactive({
      kw: '', role: '', status: '', dateRange: '', dateStart: '', dateEnd: ''
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      Object.assign(searchParamOrg, searchParam);
      await handleSearchTree();
      expanded.add(null);
      await handleSearchData('DEFAULT');
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.user_status = await codeStore.snGetGrpCodes('USER_STATUS') || [];
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
    /* 선택 부서 + 자손의 dept 이름 Set */
    const cfAllowedDeptNms = computed(() => {
      if (uiState.selectedDeptId == null) return null;
      const desc = window.boCmUtil.collectDescendantIds(depts, 'deptId', 'parentDeptId', uiState.selectedDeptId);
      if (!desc) return null;
      return new Set((depts || []).filter(d => desc.has(d.deptId)).map(d => d.deptNm));
    });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = window.boCmUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfPageNums = computed(() => {
      const cur = pager.pageNo, last = pager.pageTotalPage;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnRoleBadge = r => ({ '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' }[r] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    const handleDelete = async (u) => {
      const ok = await props.showConfirm('삭제', `[${u.userNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = users.findIndex(x => x.userId === u.userId);
      if (idx !== -1) users.splice(idx, 1);
      if (uiStateDetail.selectedId === u.userId) uiStateDetail.selectedId = null;
      try {
        const res = await window.boApi.delete(`bo/sy/user/${u.userId}`, { headers: { 'X-UI-Nm': '사용자관리', 'X-Cmd-Nm': '삭제' } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(users, [{label:'ID',key:'userId'},{label:'로그인ID',key:'loginId'},{label:'이름',key:'userNm'},{label:'이메일',key:'userEmail'},{label:'연락처',key:'userPhone'},{label:'권한',key:'roleNm'},{label:'부서',key:'deptNm'},{label:'상태',key:'userStatusCd'},{label:'최종로그인',key:'lastLoginDate'}], '사용자목록.csv');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), users, uiState, codes, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, handleDateRangeChange, cfSiteNm, pager, cfPageNums, onSearch, onReset, setPage, onSizeChange, fnRoleBadge, fnStatusBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">사용자관리</div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="이름 / 로그인ID / 이메일 검색" />
      <select v-model="searchParam.role">
        <option value="">권한 전체</option><option>슈퍼관리자</option><option>관리자</option><option>운영자</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 부서</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedDeptId" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th>ID</th><th>로그인ID</th><th>이름</th><th>이메일</th><th>연락처</th><th>권한</th><th>부서</th><th>상태</th><th>최근로그인</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="users.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="u in users" :key="u.userId" :style="uiStateDetail.selectedId===u.userId?'background:#fff8f9;':''">
          <td style="font-size:11px;color:#999;">{{ u.userId }}</td>
          <td><code style="font-size:12px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ u.loginId }}</code></td>
          <td><span class="title-link" @click="handleLoadDetail(u.userId)" :style="uiStateDetail.selectedId===u.userId?'color:#e8587a;font-weight:700;':''">{{ u.userNm }}<span v-if="uiStateDetail.selectedId===u.userId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="font-size:12px;">{{ u.userEmail }}</td>
          <td>{{ u.userPhone }}</td>
          <td><span class="badge" :class="fnRoleBadge(u.roleNm)">{{ u.roleNm }}</span></td>
          <td style="font-size:12px;color:#666;">{{ u.deptNm }}</td>
          <td><span class="badge" :class="fnStatusBadge(u.userStatusCd)">{{ u.userStatusCd }}</span></td>
          <td style="font-size:12px;color:#888;">{{ u.lastLoginDate ? u.lastLoginDate.substring(0,10) : '-' }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(u.userId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(u)">삭제</button>
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
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div>
</div>
`
};

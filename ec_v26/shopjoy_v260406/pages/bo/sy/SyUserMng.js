/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const users = reactive([]);
    const depts = reactive([]);
        const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, boUsers: [], selectedDeptId: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ user_status: [], user_roles: [], user_date_types: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'userNm asc', desc: 'userNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 사용자(관리자) getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 사용자(관리자) onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData('DEFAULT');
    };

    /* 사용자(관리자) sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색 (UI 멀티체크 "전체" = 모든 토큰)
        if (params.searchValue && !params.searchType) {
          params.searchType = 'userId,loginId,userNm,userEmail';
        }
        if (uiState.selectedDeptId != null) params.deptId = uiState.selectedDeptId;
        const [resUsers] = await Promise.all([
          boApiSvc.syUser.getPage(params, '사용자관리', '목록조회'),
        ]);
        const data = resUsers.data?.data;
        users.splice(0, users.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || users.length;
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
    /* 좌측 부서 트리 */
    const expanded = reactive(new Set([null]));

    /* 사용자(관리자) toggleNode */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* 사용자(관리자) selectNode */
    const selectNode = (id) => { uiState.selectedDeptId = id; handleSearchData(); };

    /* 사용자(관리자) buildTree */
    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId].children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });

      /* 사용자(관리자) sort */
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

      /* 사용자(관리자) sortAll */
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));

    /* 사용자(관리자) expandAll */
    const expandAll = () => { const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); }; cfTree.value.children.forEach(walk); expanded.add(null); };

    /* 사용자(관리자) collapseAll */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* 사용자(관리자) handleSearchTree */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syDept.getTree('사용자관리', '트리조회');
        depts.splice(0, depts.length, ...(res.data?.data || []));
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };

    /* 검색 파라미터 */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', role: '', status: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());


    /* 사용자(관리자) fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.user_status = codeStore.sgGetGrpCodes('USER_STATUS');
      codes.user_roles = codeStore.sgGetGrpCodes('USER_ROLE');
      codes.user_date_types = codeStore.sgGetGrpCodes('USER_DATE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      await handleSearchTree();
      expanded.add(null);
      await handleSearchData('DEFAULT');
    });

    /* 선택 부서 + 자손의 dept 이름 Set */
    const cfAllowedDeptNms = computed(() => {
      if (uiState.selectedDeptId == null) return null;
      const desc = coUtil.cofCollectDescendantIds(depts, 'deptId', 'parentDeptId', uiState.selectedDeptId);
      if (!desc) return null;
      return new Set((depts || []).filter(d => desc.has(d.deptId)).map(d => d.deptNm));
    });

    /* 사용자(관리자) handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 사용자(관리자) loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 사용자(관리자) 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 사용자(관리자) openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 사용자(관리자) closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 사용자(관리자) inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchData('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 사용자(관리자) fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 사용자(관리자) fnRoleBadge */
    const _USER_ROLE_FB = { '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' };
    const fnRoleBadge = r => coUtil.cofCodeBadge('USER_ROLE', r, _USER_ROLE_FB[r] || 'badge-gray');

    /* 사용자(관리자) fnStatusBadge */
    const _USER_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('USER_STATUS', s, _USER_STATUS_FB[s] || 'badge-gray');

    /* 사용자(관리자) 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 사용자(관리자) onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 사용자(관리자) setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };

    /* 사용자(관리자) onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 사용자(관리자) 삭제 */
    const handleDelete = async (u) => {
      const ok = await showConfirm('삭제', `[${u.userNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = users.findIndex(x => x.userId === u.userId);
      if (idx !== -1) users.splice(idx, 1);
      if (uiStateDetail.selectedId === u.userId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.syUser.remove(u.userId, '사용자관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 사용자(관리자) exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(users, [{label:'ID',key:'userId'},{label:'로그인ID',key:'loginId'},{label:'이름',key:'userNm'},{label:'이메일',key:'userEmail'},{label:'연락처',key:'userPhone'},{label:'권한',key:'roleNm'},{label:'부서',key:'deptNm'},{label:'상태',key:'userStatusCd'},{label:'최종로그인',key:'lastLoginDate'}], '사용자목록.csv');

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), users, uiState, codes, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, searchParam, handleDateRangeChange, cfSiteNm, pager, onSearch, onReset, setPage, onSizeChange, fnRoleBadge, fnStatusBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">사용자관리</div>

  <div class="card">
    <div class="search-bar">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'userId',    label: '사용자ID' },
          { value: 'loginId',   label: '로그인ID' },
          { value: 'userNm',    label: '이름' },
          { value: 'userEmail', label: '이메일' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.role">
        <option value="">권한 전체</option>
        <option v-for="c in codes.user_roles" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.user_status" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.dateType">
        <option v-for="c in codes.user_date_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
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
        <th style="width:36px;text-align:center;">번호</th><th>로그인ID</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">이름 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>이메일</th><th>연락처</th><th>권한</th><th>부서</th><th>상태</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">최근로그인 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="users.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(u, idx) in users" :key="u.userId" :style="uiStateDetail.selectedId===u.userId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
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
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'" 
      
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchData"
    />
  </div>
</div>
</div>
`
};

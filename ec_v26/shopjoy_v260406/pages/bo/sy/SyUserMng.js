/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.SyUserMng = {
  name: 'SyUserMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const users = reactive([]);
    const depts = reactive([]);
    const boUsers = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      loading.value = true;
      try {
        const [resUsers, resDepts] = await Promise.all([
          window.boApi.get('/bo/sy/user/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/sy/dept/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        boUsers.value = resUsers.data?.data?.list || [];
        depts.splice(0, depts.length, ...(resDepts.data?.data?.list || []));
        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('SyUser 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    /* 좌측 부서 트리 */
    const selectedDeptId = ref(null);
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedDeptId.value = id; };
    const cfTree = computed(() => window.boCmUtil.buildDeptTree());
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      handleFetchData();
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });
    /* 선택 부서 + 자손의 dept 이름 Set */
    const cfAllowedDeptNms = computed(() => {
      if (selectedDeptId.value == null) return null;
      const desc = window.boCmUtil.collectDescendantIds(depts, 'deptId', 'parentId', selectedDeptId.value);
      if (!desc) return null;
      return new Set((depts || []).filter(d => desc.has(d.deptId)).map(d => d.deptNm));
    });

    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const searchRole = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const handleLoadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = reactive({ kw: '', role: '', status: '', dateStart: '', dateEnd: '' });

    const cfFiltered = computed(() => boUsers.value.filter(u => {
      if (cfAllowedDeptNms.value && !cfAllowedDeptNms.value.has(u.dept)) return false;
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !u.name.toLowerCase().includes(kw) && !u.loginId.toLowerCase().includes(kw) && !u.email.toLowerCase().includes(kw)) return false;
      if (applied.role && u.role !== applied.role) return false;
      if (applied.status && u.statusCd !== applied.status) return false;
      const _d = String(u.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnRoleBadge = r => ({ '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' }[r] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        role: searchRole.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchRole.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', role: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const handleDelete = async (u) => {
      if (u.role === '슈퍼관리자') { props.showToast('슈퍼관리자는 삭제할 수 없습니다.', 'error'); return; }
      const ok = await props.showConfirm('삭제', `[${u.name}] 사용자를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = boUsers.value.findIndex(x => x.boUserId === u.boUserId);
      if (idx !== -1) boUsers.value.splice(idx, 1);
      if (selectedId.value === u.boUserId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/sy/user/${u.boUserId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'boUserId'},{label:'로그인ID',key:'loginId'},{label:'이름',key:'name'},{label:'이메일',key:'email'},{label:'연락처',key:'phone'},{label:'권한',key:'role'},{label:'부서',key:'dept'},{label:'상태',key:'statusCd'},{label:'최종로그인',key:'lastLogin'}], '사용자목록.csv');

    return { users, loading, error, selectedDeptId, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm, searchKw, searchRole, searchStatus, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, onSearch, onReset, setPage, onSizeChange, fnRoleBadge, fnStatusBadge, handleDelete, selectedId, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">사용자관리</div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="이름 / 로그인ID / 이메일 검색" />
      <select v-model="searchRole">
        <option value="">권한 전체</option><option>슈퍼관리자</option><option>관리자</option><option>운영자</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
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
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="selectedDeptId" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ cfTotal }}건</span></span>
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
        <tr v-if="cfPageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="u in cfPageList" :key="u.boUserId" :style="selectedId===u.boUserId?'background:#fff8f9;':''">
          <td>{{ u.boUserId }}</td>
          <td><code style="font-size:12px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ u.loginId }}</code></td>
          <td><span class="title-link" @click="handleLoadDetail(u.boUserId)" :style="selectedId===u.boUserId?'color:#e8587a;font-weight:700;':''">{{ u.name }}<span v-if="selectedId===u.boUserId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="font-size:12px;">{{ u.email }}</td>
          <td>{{ u.phone }}</td>
          <td><span class="badge" :class="fnRoleBadge(u.role)">{{ u.role }}</span></td>
          <td style="font-size:12px;color:#666;">{{ u.dept }}</td>
          <td><span class="badge" :class="fnStatusBadge(u.statusCd)">{{ u.statusCd }}</span></td>
          <td style="font-size:12px;color:#888;">{{ u.lastLogin }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(u.boUserId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(u)">삭제</button>
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
    <sy-user-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div>
</div>
`
};

/* ShopJoy Admin - 회원관리 목록 + 하단 MemberDtl 임베드 */
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const members = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/mb/member/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        members.splice(0, members.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        props.showToast('회원 목록 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const handleLoadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'mbMemberMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = reactive({ kw: '', grade: '', status: '', dateStart: '', dateEnd: '' });

    const cfFiltered = computed(() => {
      if (!Array.isArray(members) || members.length === 0) return [];
      return window.safeArrayUtils.safeFilter(members, m => {
        if (!m) return false;
        const kw = applied.kw.trim().toLowerCase();
        if (kw && !String(m.memberNm || '').toLowerCase().includes(kw) && !String(m.email || '').toLowerCase().includes(kw) && !String(m.userId || '').includes(kw)) return false;
        if (applied.grade && m.gradeCd !== applied.grade) return false;
        if (applied.status && m.statusCd !== applied.status) return false;
        const _d = String(m.joinDate || '').slice(0, 10);
        if (applied.dateStart && _d < applied.dateStart) return false;
        if (applied.dateEnd && _d > applied.dateEnd) return false;
        return true;
      });
      error: null,
      error: null,
    });
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnGradeBadge = g => ({ 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' }[g] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '정지': 'badge-red' }[s] || 'badge-gray');
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.page = 1;
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const handleDelete = async (m) => {
      const ok = await props.showConfirm('삭제', `[${m.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        const res = await window.boApi.delete(`/bo/ec/mb/member/${m.userId}`);
        const idx = members.value.findIndex(x => x.userId === m.userId);
        if (idx !== -1) members.value.splice(idx, 1);
        if (selectedId.value === m.userId) selectedId.value = null;
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'userId'},{label:'이름',key:'memberNm'},{label:'이메일',key:'email'},{label:'연락처',key:'phone'},{label:'등급',key:'gradeCd'},{label:'상태',key:'statusCd'},{label:'가입일',key:'joinDate'},{label:'주문수',key:'orderCount'},{label:'총구매액',key:'totalPurchase'}], '회원목록.csv');

  const searchParam = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    grade: '',
    status: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    grade: '',
    status: ''
  });
    return { members, uiState; uiState, searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm, searchKw, searchGrade, searchStatus, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, onSearch, onReset, setPage, onSizeChange, fnGradeBadge, fnStatusBadge, handleDelete, selectedId, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">회원관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="이름 / 이메일 / ID 검색" />
      <select v-model="searchParam.grade"><option value="">등급 전체</option><option>VIP</option><option>우수</option><option>일반</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>활성</option><option>정지</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>회원목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th>ID</th><th>이름</th><th>이메일</th><th>연락처</th><th>등급</th><th>상태</th><th>가입일</th><th>주문수</th><th>총구매액</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="m in cfPageList" :key="m?.userId" :style="selectedId===m.userId?'background:#fff8f9;':''">
          <td>{{ m.userId }}</td>
          <td><span class="title-link" @click="loadView(m.userId)" :style="selectedId===m.userId?'color:#e8587a;font-weight:700;':''">{{ m.memberNm }}<span v-if="selectedId===m.userId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ m.email }}</td>
          <td>{{ m.phone }}</td>
          <td><span class="badge" :class="fnGradeBadge(m.gradeCd)">{{ m.gradeCd }}</span></td>
          <td><span class="badge" :class="fnStatusBadge(m.statusCd)">{{ m.statusCd }}</span></td>
          <td>{{ m.joinDate }}</td>
          <td>{{ m.orderCount }}건</td>
          <td>{{ m.totalPurchase.toLocaleString() }}원</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(m.userId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(m)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 하단 상세: MemberDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <mb-member-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
      :view-mode="cfIsViewMode"
    />
  </div>
</div>
`
};

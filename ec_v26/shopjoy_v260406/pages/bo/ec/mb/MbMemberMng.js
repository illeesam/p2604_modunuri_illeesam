/* ShopJoy Admin - 회원관리 목록 + 하단 MemberDtl 임베드 */
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const members = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ member_statuses: [], member_grades: [] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        const res = await window.boApi.get('/bo/ec/mb/member/page', { params, headers: { 'X-UI-Nm': '회원관리', 'X-Cmd-Nm': '조회' } });
        members.splice(0, members.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        props.showToast('회원 목록 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'mbMemberMng') { uiStateDetail.selectedId = null; return; }
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

    const fnGradeBadge = g => ({ 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' }[g] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '정지': 'badge-red' }[s] || 'badge-gray');
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    const handleDelete = async (m) => {
      const ok = await props.showConfirm('삭제', `[${m.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        const res = await window.boApi.delete(`/bo/ec/mb/member/${m.userId}`, { headers: { 'X-UI-Nm': '회원관리', 'X-Cmd-Nm': '삭제' } });
        const idx = members.findIndex(x => x.userId === m.userId);
        if (idx !== -1) members.splice(idx, 1);
        if (uiStateDetail.selectedId === m.userId) uiStateDetail.selectedId = null;
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(members, [{label:'ID',key:'userId'},{label:'이름',key:'memberNm'},{label:'이메일',key:'email'},{label:'연락처',key:'phone'},{label:'등급',key:'gradeCd'},{label:'상태',key:'statusCd'},{label:'가입일',key:'joinDate'},{label:'주문수',key:'orderCount'},{label:'총구매액',key:'totalPurchase'}], '회원목록.csv');

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
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.member_statuses = await codeStore.snGetGrpCodes('MEMBER_STATUS') || [];
        codes.member_grades = await codeStore.snGetGrpCodes('MEMBER_GRADE') || [];
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

    // ── return ───────────────────────────────────────────────────────────────

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), members, uiState, codes, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, handleDateRangeChange, cfSiteNm, pager, cfPageNums, onSearch, onReset, setPage, onSizeChange, fnGradeBadge, fnStatusBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>회원목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
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
        <tr v-if="members.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="m in members" :key="m?.userId" :style="selectedId===m.userId?'background:#fff8f9;':''">
          <td>{{ m.userId }}</td>
          <td><span class="title-link" @click="loadView(m.userId)" :style="selectedId===m.userId?'color:#e8587a;font-weight:700;':''">{{ m.memberNm }}<span v-if="selectedId===m.userId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ m.email }}</td>
          <td>{{ m.phone }}</td>
          <td><span class="badge" :class="fnGradeBadge(m.gradeCd)">{{ m.gradeCd }}</span></td>
          <td><span class="badge" :class="fnStatusBadge(m.statusCd)">{{ m.statusCd }}</span></td>
          <td>{{ m.joinDate }}</td>
          <td>{{ m.orderCount }}건</td>
          <td>{{ (m.totalPurchase||0).toLocaleString() }}원</td>
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
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── 하단 상세: MemberDtl 임베드 ─────────────────────────────────────────── -->
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

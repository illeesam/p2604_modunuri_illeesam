/* ShopJoy Admin - 기획전관리 목록 + 하단 PlanDtl 임베드 */
window.PmPlanMng = {
  name: 'PmPlanMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const plans = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, viewMode: 'list'});
    const codes = reactive({
      subscription_periods: [],
      plan_statuses: [],
      date_range_opts: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.subscription_periods = codeStore.snGetGrpCodes('SUBSCRIPTION_PERIOD') || [];
        codes.plan_statuses = codeStore.snGetGrpCodes('PLAN_STATUS_KR') || [];
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

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmPlan.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...(searchType === 'PAGE_CLICK' ? pager.pageCond : searchParam) }, '요금제관리', '목록조회');
        const data = res.data?.data;
        plans.splice(0, plans.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { kw: '', category: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    });
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const CATEGORIES = [
      { value: '', label: '전체' },
      { value: '패션', label: '패션' },
      { value: '스포츠', label: '스포츠' },
      { value: '스타일링', label: '스타일링' },
      { value: '직원전용', label: '직원전용' },
      { value: '명품', label: '명품' },
    ];

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
  const searchParam = reactive(_initSearchParam());
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmPlanMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const fnStatusBadge = s => ({ '활성': 'badge-green', '예정': 'badge-blue', '비활성': 'badge-gray', '종료': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = async () => {
      pager.pageNo = 1;
      Object.assign(pager.pageCond, searchParam);
      await handleSearchList('DEFAULT');
    };

    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      onSearch();
    };

    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (p) => {
      const ok = await props.showConfirm('삭제', `[${p.planNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = plans.findIndex(x => x.planId === p.planId);
      if (idx !== -1) plans.splice(idx, 1);
      if (uiStateDetail.selectedId === p.planId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmPlan.remove(p.planId, '기획전관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(plans, [{label:'ID',key:'planId'},{label:'기획전명',key:'planNm'},{label:'카테고리',key:'category'},{label:'테마',key:'theme'},{label:'상품수',key:'productCount'},{label:'상태',key:'status'},{label:'조회수',key:'viewCount'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'},{label:'등록일',key:'regDate'}], '기획전목록.csv');

    const viewMode = Vue.toRef(uiState, 'viewMode');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), plans, uiState, codes, searchParam, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, CATEGORIES, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel,
      get viewMode() { return uiState.viewMode; }, set viewMode(v) { uiState.viewMode = v; } };
  },
  template: /* html */`
<div>
  <div class="page-title">기획전관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="기획전명 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.category"><option value="">카테고리 전체</option><option v-for="c in CATEGORIES.slice(1)" :key="c?.value" :value="c.value">{{ c.label }}</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.plan_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>기획전목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="viewMode='list'" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="viewMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">☰ 리스트</button>
          <button @click="viewMode='card'" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="viewMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">⊞ 카드</button>
        </div>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <!-- ── 리스트 뷰 ──────────────────────────────────────────────────────── -->
    <table class="bo-table" v-if="viewMode==='list'">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>기획전명</th><th>카테고리</th><th>테마</th><th>상품수</th><th>상태</th><th>조회수</th><th>기간</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="plans.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(p, idx) in plans" :key="p?.planId" :style="selectedId===p.planId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="handleLoadDetail(p.planId)" :style="selectedId===p.planId?'color:#e8587a;font-weight:700;':''">{{ p.planNm }}<span v-if="selectedId===p.planId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span style="font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:2px 8px;">{{ p.category }}</span></td>
          <td>{{ p.theme }}</td>
          <td>{{ (p.productIds||[]).length }}개</td>
          <td><span class="badge" :class="fnStatusBadge(p.status)">{{ p.status }}</span></td>
          <td>{{ (p.viewCount||0).toLocaleString() }}</td>
          <td style="font-size:11px;color:#666;">{{ p.startDate }} ~ {{ p.endDate }}</td>
          <td>{{ p.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions" style="display:flex;gap:6px;align-items:center;">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.planId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(p)">삭제</button>
            <span style="font-size:11px;color:#999;margin-left:auto;">#{{ p.planId }}</span>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- ── 카드 뷰 ───────────────────────────────────────────────────────── -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="plans.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="p in plans" :key="p?.planId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===p.planId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(p.planId)">
        <!-- ── 배너 이미지 ─────────────────────────────────────────────────── -->
        <div v-if="p.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="p.bannerImage"></div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">기획전 #{{ p.planId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(p.planId)" :style="selectedId===p.planId?{color:'#e8587a'}:{}">{{ p.planNm }}<span v-if="selectedId===p.planId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(p.status)" style="font-size:11px;">{{ p.status }}</span>
            <span class="badge badge-blue" style="font-size:11px;">{{ p.category }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ p.theme }} {{ (p.productIds||[]).length }}개 상품</div>
            <div>📅 {{ p.startDate }} ~ {{ p.endDate }}</div>
            <div style="color:#999;margin-top:4px;">👁 {{ (p.viewCount||0).toLocaleString() }} 조회</div>
            <div style="color:#999;">📅 등록 {{ p.regDate }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.planId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(p)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ p.planId }}</span>
        </div>
      </div>
    </div>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in pager.pageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
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

  <!-- ── 하단 상세: PlanDtl 임베드 ───────────────────────────────────────────── -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-plan-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="cfDetailEditId"
    />
  </div>
</div>
`
};

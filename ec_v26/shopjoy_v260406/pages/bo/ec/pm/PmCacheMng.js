/* ShopJoy Admin - 캐쉬관리 목록 + 하단 CacheDtl 임베드 */
window.PmCacheMng = {
  name: 'PmCacheMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const caches = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      cache_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.cache_statuses = codeStore.snGetGrpCodes('CACHE_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/pm/cache/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        caches.splice(0, caches.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PmCache 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = window.boCmUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const viewMode = ref('list'); // 'list' | 'card'
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view');
  const searchParam = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    type: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    type: ''
  }); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const handleLoadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCacheMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const cfFiltered = computed(() => window.safeArrayUtils.safeFilter((caches || []), c => {
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !c.userNm.toLowerCase().includes(kw) && !c.desc.toLowerCase().includes(kw) && !String(c.userId).includes(kw)) return false;
      if (searchParam.type && c.type !== searchParam.type) return false;
      const _d = String(c.date || '').slice(0, 10);
      if (searchParam.dateStart && _d < searchParam.dateStart) return false;
      if (searchParam.dateEnd && _d > searchParam.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      error: null,
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      error: null,
    });

    const fnTypeBadge = t => ({ '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' }[t] || 'badge-gray');
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

    const handleDelete = async (c) => {
      const ok = await props.showConfirm('삭제', `[${c.desc}] 내역을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = cacheList.value.findIndex(x => x.cacheId === c.cacheId);
      if (idx !== -1) cacheList.value.splice(idx, 1);
      if (selectedId.value === c.cacheId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/pm/cache/${c.cacheId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'cacheId'},{label:'회원명',key:'userNm'},{label:'유형',key:'cacheType'},{label:'금액',key:'amount'},{label:'설명',key:'description'},{label:'등록일',key:'regDate'}], '캐시목록.csv');

    return { caches, uiState, uiState, searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm, searchKw, searchType, viewMode, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnTypeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, selectedId, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">캐쉬관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="회원명 / 회원ID / 내용 검색" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option>충전</option><option>사용</option><option>환불</option><option>소멸</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>캐시목록 <span class="list-count">{{ cfTotal }}건</span></span>
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
    <table class="bo-table" v-if="viewMode==='list'">
      <thead><tr><th>ID</th><th>회원</th><th>일시</th><th>유형</th><th>금액</th><th>잔액</th><th>내용</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in cfPageList" :key="c?.cacheId" :style="selectedId===c.cacheId?'background:#fff8f9;':''">
          <td>{{ c.cacheId }}</td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userNm }}</span></td>
          <td>{{ c.date }}</td>
          <td><span class="badge" :class="fnTypeBadge(c.type)">{{ c.type }}</span></td>
          <td :style="c.amount > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600'">{{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원</td>
          <td>{{ c.balance.toLocaleString() }}원</td>
          <td><span class="title-link" @click="handleLoadDetail(c.cacheId)" :style="selectedId===c.cacheId?'color:#e8587a;font-weight:700;':''">{{ c.desc }}<span v-if="selectedId===c.cacheId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.cacheId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(c)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- 카드 뷰 -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="cfPageList.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="c in cfPageList" :key="c?.cacheId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===c.cacheId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(c.cacheId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">캐시 #{{ c.cacheId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(c.cacheId)" :style="selectedId===c.cacheId?{color:'#e8587a'}:{}">{{ c.desc }}<span v-if="selectedId===c.cacheId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(c.type)" style="font-size:11px;">{{ c.type }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>💰 {{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원</div>
            <div>📅 {{ c.date }}</div>
            <div style="color:#999;margin-top:4px;">잔액 {{ c.balance.toLocaleString() }}원</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.cacheId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="doDelete(c)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ c.cacheId }}</span>
        </div>
      </div>
    </div>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 하단 상세: CacheDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-cache-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};

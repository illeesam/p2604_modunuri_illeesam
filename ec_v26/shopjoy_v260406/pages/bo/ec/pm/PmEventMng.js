/* ShopJoy Admin - 이벤트관리 목록 + 하단 EventDtl 임베드 */
window.PmEventMng = {
  name: 'PmEventMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const events = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, viewMode: 'list'});
    const codes = reactive({
      event_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.event_statuses = codeStore.snGetGrpCodes('EVENT_STATUS') || [];
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
        const res = await window.boApi.get('/bo/ec/pm/event/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        events.splice(0, events.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PmEvent 로드 실패', 'error');
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
     // 'list' | 'card'
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
  const searchParam = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    status: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    status: ''
  }); // 'view' | 'edit'
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmEventMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfFiltered = computed(() => window.safeArrayUtils.safeFilter(events, e => {
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !e.title.toLowerCase().includes(kw)) return false;
      if (searchParam.status && e.status !== searchParam.status) return false;
      const _d = String(e.regDate || '').slice(0, 10);
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
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const fnStatusBadge = s => ({ '진행중': 'badge-green', '예정': 'badge-blue', '종료': 'badge-gray' }[s] || 'badge-gray');
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

    const handleDelete = async (e) => {
      const ok = await props.showConfirm('삭제', `[${e.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(events)) return;
      const idx = events.findIndex(x => x.eventId === e.eventId);
      if (idx !== -1) events.splice(idx, 1);
      if (uiStateDetail.selectedId === e.eventId) uiStateDetail.selectedId = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/pm/event/${e.eventId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'eventId'},{label:'이벤트명',key:'eventNm'},{label:'유형',key:'eventType'},{label:'상태',key:'status'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'},{label:'등록일',key:'regDate'}], '이벤트목록.csv');

    const viewMode = ref('list');
    return { uiStateDetail, events, uiState, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, PAGE_SIZES, viewMode, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">이벤트관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="이벤트 제목 검색" />
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>진행중</option><option>예정</option><option>종료</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이벤트목록 <span class="list-count">{{ cfTotal }}건</span></span>
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
    <!-- 리스트 뷰 -->
    <table class="bo-table" v-if="viewMode==='list'">
      <thead><tr><th>ID</th><th>이벤트 제목</th><th>대상상품</th><th>인증필요</th><th>시작일</th><th>종료일</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="e in cfPageList" :key="e?.eventId" :style="uiStateDetail.selectedId===e.eventId?'background:#fff8f9;':''">
          <td>{{ e.eventId }}</td>
          <td><span class="title-link" @click="handleLoadDetail(e.eventId)" :style="uiStateDetail.selectedId===e.eventId?'color:#e8587a;font-weight:700;':''">{{ e.title }}<span v-if="uiStateDetail.selectedId===e.eventId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ e.targetProducts.length }}개 상품</td>
          <td><span class="badge" :class="e.authRequired ? 'badge-orange' : 'badge-gray'">{{ e.authRequired ? '필요' : '불필요' }}</span></td>
          <td>{{ e.startDate }}</td><td>{{ e.endDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(e.status)">{{ e.status }}</span></td>
          <td>{{ e.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions" style="display:flex;gap:6px;align-items:center;">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(e.eventId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(e)">삭제</button>
            <span style="font-size:11px;color:#999;margin-left:auto;">#{{ e.eventId }}</span>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- 카드 뷰 -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="cfPageList.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="e in cfPageList" :key="e?.eventId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="uiStateDetail.selectedId===e.eventId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(e.eventId)">
        <!-- 배너 이미지 -->
        <div v-if="e.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="e.bannerImage"></div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">이벤트 #{{ e.eventId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(e.eventId)" :style="uiStateDetail.selectedId===e.eventId?{color:'#e8587a'}:{}">{{ e.title }}<span v-if="uiStateDetail.selectedId===e.eventId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(e.status)" style="font-size:11px;">{{ e.status }}</span>
            <span class="badge" :class="e.authRequired ? 'badge-orange' : 'badge-gray'" style="font-size:11px;">{{ e.authRequired ? '인증필요' : '인증불필요' }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ e.targetProducts.length }}개 상품</div>
            <div>📅 {{ e.startDate }} ~ {{ e.endDate }}</div>
            <div style="color:#999;margin-top:4px;">등록 {{ e.regDate }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(e.eventId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(e)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ e.eventId }}</span>
        </div>
      </div>
    </div>
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

  <!-- 하단 상세: EventDtl 임베드 -->
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-event-dtl
      :key="uiStateDetail.selectedId"
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

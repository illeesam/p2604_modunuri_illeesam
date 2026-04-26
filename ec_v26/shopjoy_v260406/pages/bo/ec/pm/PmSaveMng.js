/* ShopJoy Admin - 판촉마일리지 관리 목록 + 하단 PmSaveDtl 임베드 */
window.PmSaveMng = {
  name: 'PmSaveMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const saves = reactive([]);
        const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, saveList: [], viewMode: 'list'});
    const codes = reactive({
      save_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.save_statuses = codeStore.snGetGrpCodes('SAVE_STATUS') || [];
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
        const res = await window.boApi.get('/bo/ec/pm/save/page', { params: { pageNo: pager.page, pageSize: pager.size, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) } });
        const list = res.data?.data?.list || [];
        saves.splice(0, saves.length, ...list);
        pager.total = res.data?.data?.total || 0;
        pager.totalPages = res.data?.data?.totalPages || Math.ceil(pager.total / pager.size) || 1;
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PmSave 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
     // 'list' | 'card'
    const pager = reactive({ page: 1, size: 5, total: 0, totalPages: 1 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
  const searchParam = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    type: '',
    status: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    dateRange: '',
    dateStart: '',
    dateEnd: '',
    type: '',
    status: ''
  });
    const loadView   = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew    = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmSaveMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfPageNums = computed(() => {
      const cur = pager.page, last = pager.totalPages;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnTypeBadge   = t => ({ '구매적립': 'badge-green', '회원가입': 'badge-blue', '리뷰적립': 'badge-orange', '출석체크': 'badge-purple' }[t] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' }[s] || 'badge-gray');

    const onSearch = async () => {
      pager.page = 1;
      await handleFetchData();
    };

    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };

    const setPage = async n => { if (n >= 1 && n <= pager.totalPages) { pager.page = n; await handleFetchData(); } };
    const onSizeChange = () => { pager.page = 1; handleFetchData(); };

    const handleDelete = async (s) => {
      const ok = await props.showConfirm('삭제', `[${s.saveNm}] 마일리지를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (saveList).findIndex(x => x.saveId === s.saveId);
      if (idx !== -1) saveList.value.splice(idx, 1);
      if (uiStateDetail.selectedId === s.saveId) uiStateDetail.selectedId = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/pm/save/${s.saveId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(saves,
      [{label:'ID',key:'saveId'},{label:'마일리지명',key:'saveNm'},{label:'유형',key:'saveType'},{label:'적립값',key:'saveVal'},{label:'단위',key:'saveUnit'},{label:'상태',key:'saveStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '마일리지목록.csv');

    const viewMode = Vue.toRef(uiState, 'viewMode');
    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), saves, uiState, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, PAGE_SIZES, cfPageNums, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">마일리지관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="마일리지명 / ID 검색" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option>구매적립</option><option>회원가입</option><option>리뷰적립</option><option>출석체크</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>활성</option><option>비활성</option><option>종료</option></select>
      <span class="search-label">시작일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>마일리지목록 <span class="list-count">{{ pager.total }}건</span></span>
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
      <thead><tr><th>ID</th><th>마일리지명</th><th>유형</th><th>적립값</th><th>단위</th><th>유효기간</th><th>시작일</th><th>종료일</th><th>상태</th><th>사이트</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="saves.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="s in saves" :key="s?.saveId" :style="selectedId===s.saveId?'background:#fff8f9;':''">
          <td>{{ s.saveId }}</td>
          <td><span class="title-link" @click="handleLoadDetail(s.saveId)" :style="selectedId===s.saveId?'color:#e8587a;font-weight:700;':''">{{ s.saveNm }}<span v-if="selectedId===s.saveId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="fnTypeBadge(s.saveType)">{{ s.saveType }}</span></td>
          <td>{{ (s.saveVal||0).toLocaleString() }}</td>
          <td style="font-size:12px;color:#555;">{{ s.saveUnit || '원' }}</td>
          <td style="font-size:12px;color:#555;">{{ s.expireDay || 365 }}일</td>
          <td>{{ s.startDate }}</td>
          <td>{{ s.endDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(s.saveStatus)">{{ s.saveStatus }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.saveId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(s)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- 카드 뷰 -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="saves.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="s in saves" :key="s?.saveId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===s.saveId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(s.saveId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">마일리지 #{{ s.saveId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(s.saveId)" :style="selectedId===s.saveId?{color:'#e8587a'}:{}">{{ s.saveNm }}<span v-if="selectedId===s.saveId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(s.saveType)" style="font-size:11px;">{{ s.saveType }}</span>
            <span class="badge" :class="fnStatusBadge(s.saveStatus)" style="font-size:11px;">{{ s.saveStatus }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ (s.saveVal||0).toLocaleString() }}{{ s.saveUnit || '원' }}</div>
            <div>📅 {{ s.startDate }} ~ {{ s.endDate }}</div>
            <div style="color:#999;margin-top:4px;">유효기간 {{ s.expireDay || 365 }}일</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.saveId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(s)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ s.saveId }}</span>
        </div>
      </div>
    </div>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===pager.totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===pager.totalPages" @click="setPage(pager.totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 하단 상세: PmSaveDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-save-dtl
      :key="cfDetailKey"
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

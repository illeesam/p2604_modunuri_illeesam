/* ShopJoy Admin - 판촉사은품 관리 목록 + 하단 PmGiftDtl 임베드 */
window.PmGiftMng = {
  name: 'PmGiftMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const gifts = reactive([]);
        const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, giftList: [], viewMode: 'list'});
    const codes = reactive({
      gift_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.gift_statuses = codeStore.snGetGrpCodes('GIFT_STATUS') || [];
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
        const res = await boApi.get('/bo/ec/pm/gift/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) },
          ...coUtil.apiHdr('선물관리', '목록조회')
        });
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gifts.splice(0, gifts.length, ...list);
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PmGift 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
    const DATE_RANGE_OPTIONS = boUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchDateRange.value) { const r = boUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
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
      if (pg === 'pmGiftMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const cfPageNums = computed(() => {
      const cur = pager.pageNo, last = pager.pageTotalPage;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnTypeBadge   = t => ({ '구매조건': 'badge-blue', '금액조건': 'badge-green', '수량조건': 'badge-orange', '무조건': 'badge-purple' }[t] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red', '품절': 'badge-orange' }[s] || 'badge-gray');

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };

    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const handleDelete = async (g) => {
      const ok = await props.showConfirm('삭제', `[${g.giftNm}] 사은품을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (gifts || []).findIndex(x => x.giftId === g.giftId);
      if (idx !== -1) gifts.splice(idx, 1);
      if (uiStateDetail.selectedId === g.giftId) uiStateDetail.selectedId = null;
      try {
        const res = await boApi.delete(`/bo/ec/pm/gift/${g.giftId}`, { headers: { 'X-UI-Nm': '사은품관리', 'X-Cmd-Nm': '삭제' } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => boUtil.exportCsv(gifts,
      [{label:'ID',key:'giftId'},{label:'사은품명',key:'giftNm'},{label:'유형',key:'giftType'},{label:'조건값',key:'condVal'},{label:'재고',key:'stock'},{label:'상태',key:'giftStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '사은품목록.csv');

    const viewMode = Vue.toRef(uiState, 'viewMode');

    // ── return ───────────────────────────────────────────────────────────────

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), gifts, uiState, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, cfPageNums, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel,
      get viewMode() { return uiState.viewMode; }, set viewMode(v) { uiState.viewMode = v; } };
  },
  template: /* html */`
<div>
  <div class="page-title">사은품관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="사은품명 / ID 검색" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option>구매조건</option><option>금액조건</option><option>수량조건</option><option>무조건</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>활성</option><option>비활성</option><option>종료</option><option>품절</option></select>
      <span class="search-label">시작일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사은품목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
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
      <thead><tr><th>ID</th><th>사은품명</th><th>조건유형</th><th>조건값</th><th>재고</th><th>시작일</th><th>종료일</th><th>상태</th><th>사이트</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="gifts.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="g in gifts" :key="g?.giftId" :style="selectedId===g.giftId?'background:#fff8f9;':''">
          <td>{{ g.giftId }}</td>
          <td><span class="title-link" @click="handleLoadDetail(g.giftId)" :style="selectedId===g.giftId?'color:#e8587a;font-weight:700;':''">{{ g.giftNm }}<span v-if="selectedId===g.giftId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="fnTypeBadge(g.giftType)">{{ g.giftType }}</span></td>
          <td>{{ g.giftType === '금액조건' ? (g.condVal||0).toLocaleString() + '원↑' : g.giftType === '수량조건' ? (g.condVal||0) + '개↑' : '-' }}</td>
          <td>{{ (g.stock||0).toLocaleString() }}개</td>
          <td>{{ g.startDate }}</td>
          <td>{{ g.endDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(g.giftStatus)">{{ g.giftStatus }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(g.giftId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(g)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>

    <!-- ── 카드 뷰 ───────────────────────────────────────────────────────── -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="gifts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="g in gifts" :key="g?.giftId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===g.giftId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(g.giftId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">사은품 #{{ g.giftId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(g.giftId)" :style="selectedId===g.giftId?{color:'#e8587a'}:{}">{{ g.giftNm }}<span v-if="selectedId===g.giftId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(g.giftType)" style="font-size:11px;">{{ g.giftType }}</span>
            <span class="badge" :class="fnStatusBadge(g.giftStatus)" style="font-size:11px;">{{ g.giftStatus }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ g.giftType === '금액조건' ? (g.condVal||0).toLocaleString() + '원↑' : g.giftType === '수량조건' ? (g.condVal||0) + '개↑' : '-' }}</div>
            <div>📅 {{ g.startDate }} ~ {{ g.endDate }}</div>
            <div style="color:#999;margin-top:4px;">재고 {{ (g.stock||0).toLocaleString() }}개</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(g.giftId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(g)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ g.giftId }}</span>
        </div>
      </div>
    </div>

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

  <!-- ── 하단 상세: PmGiftDtl 임베드 ─────────────────────────────────────────── -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-gift-dtl
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

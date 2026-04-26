/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);
    const members = reactive([]);
    const qnas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      qna_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.qna_statuses = codeStore.snGetGrpCodes('QNA_STATUS') || [];
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
        const [qnasRes, prodsRes, membersRes] = await Promise.all([
          window.boApi.get('/bo/ec/pd/qna/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/pd/prod/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/mb/member/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        qnas.splice(0, qnas.length, ...(qnasRes.data?.data?.list || []));
        products.splice(0, products.length, ...(prodsRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdQna 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    const searchParam = reactive({ kw: '', status: '', prod: '' });
    const searchParamOrg = reactive({ kw: '', status: '', prod: '' });
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const pager      = reactive({ page: 1, size: 20 });

    const cfFiltered = computed(() => {
      const kw = searchParam.kw.toLowerCase();
      return (qnas || []).filter(q => {
        if (kw && !(q.qnaTitle||'').toLowerCase().includes(kw)) return false;
        if (searchParam.status && q.qnaStatusCd !== searchParam.status) return false;
        return true;
      });
    });
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList   = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums   = computed(() => { const c=pager.page,l=cfTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const onSearch = async () => { pager.page = 1; await handleFetchData(); };
    const onReset  = () => { Object.assign(searchParam, searchParamOrg); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const getProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };
    const getMemNm  = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };
    const fnStatusBadge = s => ({ WAIT:'badge-orange', ANSWER:'badge-green', CLOSE:'badge-gray' }[s] || 'badge-gray');
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());

    return { qnas, products, members, uiState, codes, pager, PAGE_SIZES, searchParam,
      cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums,
      onSearch, onReset, setPage, onSizeChange, getProdNm, getMemNm, fnStatusBadge, cfSiteNm };
  },
  template: /* html */`
<div>
  <div class="page-title">상품 Q&A 관리</div>
  <div class="card">
    <div class="search-bar">
      <label class="search-label">키워드</label>
      <input class="form-control" v-model="searchParam.kw" placeholder="제목 검색" @keyup.enter="onSearch" style="width:200px;" />
      <label class="search-label">상태</label>
      <select class="form-control" v-model="searchParam.status" style="width:120px;">
        <option value="">전체</option>
        <option v-for="c in codes.qna_statuses" :key="c?.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">🔍 조회</button>
        <button class="btn btn-secondary" @click="onReset">↺ 초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-count">총 {{ cfTotal }}건</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <select class="form-control" v-model.number="pager.size" @change="onSizeChange" style="width:80px;">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}건</option>
        </select>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>번호</th><th>사이트</th><th>상품명</th><th>제목</th><th>작성자</th><th>상태</th><th>등록일</th>
      </tr></thead>
      <tbody>
        <tr v-if="uiState.loading"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">로딩 중...</td></tr>
        <tr v-else-if="!cfPageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">조회된 데이터가 없습니다.</td></tr>
        <tr v-for="q in cfPageList" :key="q?.qnaId">
          <td>{{ q.qnaId }}</td>
          <td>{{ cfSiteNm }}</td>
          <td>{{ getProdNm(q.prodId) }}</td>
          <td class="title-link" @click="">{{ q.qnaTitle }}</td>
          <td>{{ getMemNm(q.memberId) }}</td>
          <td><span :class="'badge '+fnStatusBadge(q.qnaStatusCd)">{{ q.qnaStatusCd }}</span></td>
          <td>{{ (q.regDate||'').slice(0,10) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button class="pager" @click="setPage(pager.page-1)" :disabled="pager.page===1">◀</button>
      <button v-for="n in cfPageNums" :key="n" class="pager" :class="{active:n===pager.page}" @click="setPage(n)">{{ n }}</button>
      <button class="pager" @click="setPage(pager.page+1)" :disabled="pager.page===cfTotalPages">▶</button>
    </div>
  </div>
</div>`
};

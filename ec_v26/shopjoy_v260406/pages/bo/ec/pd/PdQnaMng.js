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
        const res = await window.boApi.get('/bo/ec/pd/qna/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) },
          ...coUtil.apiHdr('상품Q&A관리', '목록조회')
        });
        const data = res.data?.data;
        qnas.splice(0, qnas.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };
    const onReset  = async () => { Object.assign(searchParam, searchParamOrg); pager.pageNo = 1; await handleSearchList(); };
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const getProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };
    const getMemNm  = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };
    const fnStatusBadge = s => ({ WAIT:'badge-orange', ANSWER:'badge-green', CLOSE:'badge-gray' }[s] || 'badge-gray');
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    // ── return ───────────────────────────────────────────────────────────────

    return { qnas, uiState, codes, pager, searchParam,
      cfPageNums,
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
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <select class="form-control" v-model.number="pager.pageSize" @change="onSizeChange" style="width:80px;">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}건</option>
        </select>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>번호</th><th>사이트</th><th>상품명</th><th>제목</th><th>작성자</th><th>상태</th><th>등록일</th>
      </tr></thead>
      <tbody>
        <tr v-if="uiState.loading"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">로딩 중...</td></tr>
        <tr v-else-if="!qnas.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa;">조회된 데이터가 없습니다.</td></tr>
        <tr v-for="q in qnas" :key="q?.qnaId">
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
      <button class="pager" @click="setPage(pager.pageNo-1)" :disabled="pager.pageNo===1">◀</button>
      <button v-for="n in cfPageNums" :key="n" class="pager" :class="{active:n===pager.pageNo}" @click="setPage(n)">{{ n }}</button>
      <button class="pager" @click="setPage(pager.pageNo+1)" :disabled="pager.pageNo===pager.pageTotalPage">▶</button>
    </div>
  </div>
</div>`
};

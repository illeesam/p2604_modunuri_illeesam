/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const products = reactive([]);
    const members = reactive([]);
    const qnas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      qna_statuses: [],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.qna_statuses = codeStore.sgGetGrpCodes('QNA_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdQna.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '상품Q&A관리', '목록조회');
        const data = res.data?.data;
        qnas.splice(0, qnas.length, ...(data?.pageList || []));
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
    const _initSearchParam = () => ({ kw: '', status: '', prod: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    });
const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };
    const onReset  = async () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; pager.pageNo = 1; await handleSearchList(); };
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const getProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };
    const getMemNm  = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };
    const fnStatusBadge = s => ({ WAIT:'badge-orange', ANSWER:'badge-green', CLOSE:'badge-gray' }[s] || 'badge-gray');
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    // -- return ---------------------------------------------------------------

    return { qnas, uiState, codes, pager, searchParam,
      onSearch, onReset, setPage, onSizeChange, getProdNm, getMemNm, fnStatusBadge, cfSiteNm, onSort, sortIcon };
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
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        Q&A 목록
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th>번호</th><th>사이트</th><th>상품명</th><th>제목</th><th>작성자</th><th>상태</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
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
          <td><span :class="['badge',fnStatusBadge(q.qnaStatusCd)]">{{ q.qnaStatusCd }}</span></td>
          <td>{{ (q.regDate||'').slice(0,10) }}</td>
        </tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>`
};

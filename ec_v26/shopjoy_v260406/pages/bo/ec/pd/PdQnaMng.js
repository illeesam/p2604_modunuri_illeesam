/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const members = reactive([]);
    const qnas = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      qna_statuses: [],
    });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.qna_statuses = codeStore.sgGetGrpCodes('QNA_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 목록조회 */
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

    /* _initSearchParam */
    const _initSearchParam = () => ({ status: '', prod: '' });
    const searchParam = reactive(_initSearchParam());

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });
const pager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 목록조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset */
    const onReset  = async () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; pager.pageNo = 1; await handleSearchList(); };

    /* setPage */
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* getProdNm */
    const getProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };

    /* getMemNm */
    const getMemNm  = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };

    /* fnStatusBadge — pd_prod_qna 는 별도 상태코드 없이 answ_yn(Y/N) 으로 답변여부 표현 */
    const fnStatusBadge = answYn => answYn === 'Y' ? 'badge-green' : 'badge-orange';

    /* fnAnswLabel */
    const fnAnswLabel = answYn => answYn === 'Y' ? '답변완료' : '미답변';
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    // -- return ---------------------------------------------------------------

    const baseGridColumns = [
      { key: 'siteNm',   label: '사이트', fmt: () => cfSiteNm.value },
      { key: 'prodId',   label: '상품명', fmt: (v) => getProdNm(v) },
      { key: 'qnaTitle', label: '제목', cellClass: 'title-link' },
      { key: 'memberId', label: '작성자', fmt: (v) => getMemNm(v) },
      { key: 'answYn',   label: '상태', badge: (q) => fnStatusBadge(q.answYn), fmt: (v) => fnAnswLabel(v) },
      { key: 'regDate',  label: '등록일', sortKey: 'reg', fmt: (v) => (v || '').slice(0, 10) },
    ];

    return { qnas, uiState, codes, pager, searchParam, baseGridColumns,
      onSearch, onReset, setPage, onSizeChange, getProdNm, getMemNm, fnStatusBadge, fnAnswLabel, cfSiteNm, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">상품 Q&A 관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="onSearch" @reset="onReset">
      <label class="search-label">키워드</label>
      <input class="form-control" v-model="searchParam.searchValue" placeholder="제목 검색" @keyup.enter="onSearch" style="width:200px;" />
      <label class="search-label">상태</label>
      <select class="form-control" v-model="searchParam.status" style="width:120px;">
        <option value="">전체</option>
        <option v-for="c in codes.qna_statuses" :key="c?.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </bo-search-area>
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
    <bo-grid
      :columns="baseGridColumns" :rows="qnas" :pager="pager" row-key="qnaId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      :loading="uiState.loading"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      empty-text="조회된 데이터가 없습니다."
      @sort="onSort" @set-page="setPage" @size-change="onSizeChange">
    </bo-grid>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>`
};

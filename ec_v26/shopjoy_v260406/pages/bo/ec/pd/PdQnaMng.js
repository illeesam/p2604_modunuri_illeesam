/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);                // 상품 목록 (이름 변환용)
    const members = reactive([]);                 // 회원 목록 (이름 변환용)
    const qnas = reactive([]);                    // Q&A 목록 (메인 그리드 데이터)
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ qna_statuses: [] });
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdQnaMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchList();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/정렬/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdQnaMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'qnas-sort') {
        return onSort(param);
      // 페이지 번호 변경
      } else if (cmd === 'qnas-set-page') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'qnas-size-change') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ status: '', prod: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
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

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* getProdNm — 상품명 조회 */
    const getProdNm = id => { const p = (products||[]).find(p => p.prodId === id); return p ? p.prodNm : (id||''); };

    /* getMemNm — 회원명 조회 */
    const getMemNm = id => { const m = (members||[]).find(m => m.memberId === id); return m ? m.memberNm : (id||''); };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = answYn => answYn === 'Y' ? 'badge-green' : 'badge-orange';

    /* fnAnswLabel — 답변 라벨 */
    const fnAnswLabel = answYn => answYn === 'Y' ? '답변완료' : '미답변';

    /* fnLoadCodes — 공통코드 로드 */
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

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchValue', label: '키워드', type: 'text', placeholder: '제목 검색' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.qna_statuses, nullLabel: '전체' },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'siteNm',   label: '사이트', fmt: () => cfSiteNm.value },
      { key: 'prodId',   label: '상품명', fmt: (v) => getProdNm(v) },
      { key: 'qnaTitle', label: '제목', cellClass: 'title-link' },
      { key: 'memberId', label: '작성자', fmt: (v) => getMemNm(v) },
      { key: 'answYn',   label: '상태', badge: (q) => fnStatusBadge(q.answYn), fmt: (v) => fnAnswLabel(v) },
      { key: 'regDate',  label: '등록일', sortKey: 'reg', fmt: (v) => (v || '').slice(0, 10) },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      qnas, uiState, codes, pager, searchParam,                                       // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch
      cfSiteNm,                                                                        // computed
      sortIcon, fnStatusBadge, fnAnswLabel,                                            // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    상품 Q&A 관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" search-label="🔍 조회" reset-label="↺ 초기화" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        Q&A 목록
        <span class="list-count">
          {{ pager.pageTotalCount }}건
        </span>
      </span>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="handleSelectAction('qnas-size-change')">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">
            {{ s }}개
          </option>
        </select>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="qnas" :pager="pager" row-key="qnaId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      :loading="uiState.loading"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      empty-text="조회된 데이터가 없습니다."
      @sort="key => handleSelectAction('qnas-sort', key)" @set-page="n => handleSelectAction('qnas-set-page', n)" @size-change="handleSelectAction('qnas-size-change')">
    </bo-grid>
    <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('qnas-set-page', n)" :on-size-change="() => handleSelectAction('qnas-size-change')" />
  </div>
  <!-- ===== □. 목록 그리드 =================================================== -->
</div>
`
};

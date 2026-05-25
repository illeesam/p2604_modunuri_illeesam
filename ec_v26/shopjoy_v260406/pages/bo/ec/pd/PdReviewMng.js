/* ShopJoy Admin - 상품리뷰관리 */
window.PdReviewMng = {
  name: 'PdReviewMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const members = reactive([]);
    const reviews = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      review_statuses: [],
      review_rating_opts: [{value:'5',label:'5점'},{value:'4',label:'4점대'},{value:'3',label:'3점대'},{value:'2',label:'2점대'},{value:'1',label:'1점대'}],
      review_status_list: [{value:'ACTIVE',label:'공개'},{value:'HIDDEN',label:'숨김'},{value:'DELETED',label:'삭제'}],
    });

    /* 상품 리뷰 fnLoadCodes */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdReviewMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 페이지 크기 변경
      } else if (cmd === 'reviews-size-change') {
        return onSizeChange();
      // 상세 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        selectedId.value = null;
        return;
      // 상품별 리뷰 목록 닫기 (선택 해제)
      } else if (cmd === 'prodReviews-close') {
        return onProdIdClick(selectedProdId.value);
      // 상품별 리뷰 페이지 크기 변경
      } else if (cmd === 'prodReviews-size-change') {
        return onProdReviewSizeChange();
      // 상태변경 모달 닫기 (취소)
      } else if (cmd === 'statusModal-close') {
        return closeStatusModal();
      // 상태변경 모달 저장
      } else if (cmd === 'statusModal-confirm') {
        return confirmStatusChange();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdReviewMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'reviews-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'reviews-set-page') {
        return setPage(param);
      // 그리드 행 클릭 (상세 토글)
      } else if (cmd === 'reviews-row-edit') {
        return openDetail(param);
      // 그리드 행 미리보기 (새창)
      } else if (cmd === 'reviews-row-preview') {
        return previewProduct(param);
      // 상태변경 select intercept
      } else if (cmd === 'reviews-row-status-change') {
        return onStatusSelectChange(param.row, param.evt);
      // 상품ID 클릭 → 하단 상품별 리뷰 목록 토글
      } else if (cmd === 'reviews-row-prod-click') {
        return onProdIdClick(param);
      // 상품별 리뷰 페이지 번호 클릭
      } else if (cmd === 'prodReviews-set-page') {
        return setProdReviewPage(param);
      // 상품별 리뷰 행 클릭 (상세 토글)
      } else if (cmd === 'prodReviews-row-edit') {
        return openDetail(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.review_statuses = codeStore.sgGetGrpCodes('REVIEW_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 상품 리뷰 onSort */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdReview.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '상품리뷰관리', '목록조회');
        const data = res.data?.data;
        reviews.splice(0, reviews.length, ...(data?.pageList || []));
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

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });
    const pager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId   = ref(null);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ status: '', rating: '' });
    const searchParam = reactive(_initSearchParam());

    const STATUS_LABEL = { ACTIVE:'공개', HIDDEN:'숨김', DELETED:'삭제' };

    /* 상품 리뷰 fnStatusBadge — sy_code REVIEW_STATUS code_opt1 우선, 없으면 FB */
    const _REVIEW_STATUS_FB = { ACTIVE:'badge-green', HIDDEN:'badge-orange', DELETED:'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge  = s => coUtil.cofCodeBadge('REVIEW_STATUS', s, _REVIEW_STATUS_FB[s] || 'badge-gray');

    /* getProdNm — 조회 */
    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id || p.prodId === id); return p ? (p.prodNm || p.productName) : ''; };

    /* getMemNm — 조회 */
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id || m.memberId === id); return m ? (m.memberNm || m.name) : id; };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 상단/하단 리뷰 목록 모두에서 선택된 리뷰를 찾는다 */
    const cfSelectedRow = computed(() =>
      reviews.find(r => r.reviewId === selectedId.value) ||
      prodReviews.find(r => r.reviewId === selectedId.value) ||
      null
    );

    /* openDetail — 열기 */
    const openDetail = (row) => { selectedId.value = selectedId.value === row.reviewId ? null : row.reviewId; };

    /* previewProduct — 미리보기 상품 */
    const previewProduct = (prodId) => {
      if (!prodId) { return; }
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    /* ── 상품ID 클릭 → 하단에 해당 상품의 리뷰 페이징 목록 ─── */
    const prodReviews = reactive([]);
    const prodReviewPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 50], pageCond: {}, pageNums: [1] });
    const selectedProdId = ref(null);

    /* fnBuildProdReviewPagerNums — 유틸 */
    const fnBuildProdReviewPagerNums = () => { const c=prodReviewPager.pageNo,l=prodReviewPager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); prodReviewPager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* handleSearchProdReviews — 처리 */
    const handleSearchProdReviews = async () => {
      if (!selectedProdId.value) { prodReviews.splice(0); return; }
      try {
        const res = await boApiSvc.pdReview.getPage({ pageNo: prodReviewPager.pageNo, pageSize: prodReviewPager.pageSize, prodId: selectedProdId.value }, '상품리뷰관리', '상품별리뷰조회');
        const data = res.data?.data;
        prodReviews.splice(0, prodReviews.length, ...(data?.pageList || []));
        prodReviewPager.pageTotalCount = data?.pageTotalCount || 0;
        prodReviewPager.pageTotalPage = data?.pageTotalPage || 1;
        fnBuildProdReviewPagerNums();
      } catch (err) {
        console.error('[handleSearchProdReviews]', err);
      }
    };

    /* onProdIdClick — 이벤트 */
    const onProdIdClick = async (prodId) => {
      if (!prodId) { return; }
      if (selectedProdId.value === prodId) {
        selectedProdId.value = null;
        prodReviews.splice(0);
        return;
      }
      selectedProdId.value = prodId;
      prodReviewPager.pageNo = 1;
      await handleSearchProdReviews();
    };

    /* setProdReviewPage — 설정 */
    const setProdReviewPage = async (n) => {
      if (n >= 1 && n <= prodReviewPager.pageTotalPage) {
        prodReviewPager.pageNo = n;
        await handleSearchProdReviews();
      }
    };

    /* onProdReviewSizeChange — 이벤트 */
    const onProdReviewSizeChange = () => { prodReviewPager.pageNo = 1; handleSearchProdReviews(); };

    /* ── 상태변경 사유 입력 모달 ───────────────────────── */
    const statusModal = reactive({
      show: false,
      row: null,
      newStatus: '',
      reason: '',
    });

    /* openStatusModal — 열기 */
    const openStatusModal = (row, newStatus) => {
      if (!newStatus || newStatus === row.reviewStatusCd) { return; }
      statusModal.row = row;
      statusModal.newStatus = newStatus;
      statusModal.reason = '';
      statusModal.show = true;
    };

    /* onStatusSelectChange — 이벤트 */
    const onStatusSelectChange = (row, evt) => {
      const newStatus = evt && evt.target ? evt.target.value : '';
      openStatusModal(row, newStatus);
      if (evt && evt.target && row) { evt.target.value = row.reviewStatusCd; }
    };

    /* 모달 표시용 — row 의 안전 접근 (template 의 ?. 표현식 회피) */
    const cfStatusModalRowTitle  = computed(() => (statusModal.row && statusModal.row.reviewTitle) || '');
    const cfStatusModalCurrentCd = computed(() => (statusModal.row && statusModal.row.reviewStatusCd) || '');

    /* closeStatusModal — 닫기 */
    const closeStatusModal = () => {
      statusModal.show = false;
      /* select 가 미리 새 값으로 바뀌었을 수 있으므로 원복용 트리거 */
      // row.reviewStatusCd 는 그대로 — UI 의 select 가 다음 렌더에서 동기화됨
      statusModal.row = null;
      statusModal.newStatus = '';
      statusModal.reason = '';
    };

    /* confirmStatusChange — 확인 상태 변경 */
    const confirmStatusChange = async () => {
      const row = statusModal.row;
      const newStatus = statusModal.newStatus;
      const reason = (statusModal.reason || '').trim();
      if (!row) { return; }
      if (!reason) { showToast('변경 사유를 입력해주세요.', 'error'); return; }
      try {
        const res = await boApiSvc.pdReview.updateStatus(
          row.reviewId,
          { reviewStatusCd: newStatus, statusChgReason: reason },
          '리뷰관리', '상태변경'
        );
        row.reviewStatusCd = newStatus;

        /* 상단/하단 두 목록 모두에서 같은 reviewId 찾아 상태 동기화 */
        const sync = (arr) => { const t = arr.find(r => r.reviewId === row.reviewId); if (t) t.reviewStatusCd = newStatus; };
        sync(reviews);
        sync(prodReviews);
        if (cfSelectedRow.value && cfSelectedRow.value.reviewId === row.reviewId) {
          cfSelectedRow.value.reviewStatusCd = newStatus;
        }
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(`상태가 [${STATUS_LABEL[newStatus]}] 로 변경되었습니다.`, 'success'); }
        statusModal.show = false;
      } catch (err) {
        console.error('[confirmStatusChange]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* starStr — 별점 문자열 */
    const starStr  = r => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'reg' 와 sortKey 일치) */
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'searchValue', label: '리뷰제목', type: 'text', placeholder: '리뷰 제목 검색' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.review_status_list, nullLabel: '전체' },
      { key: 'rating', label: '평점', type: 'select', options: () => codes.review_rating_opts, nullLabel: '전체' },
    ];
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const listGridColumns = [
      { key: 'reviewTitle',     label: '리뷰 제목', cellInnerClass: 'title-link' },
      { key: 'prodId',          label: '상품ID',   style: 'width:110px', cellStyle: 'font-size:12px;',
        linkToggle: {
          active: (row) => selectedProdId.value === row.prodId,
          activeStyle: 'color:#e8587a;font-weight:700;cursor:pointer;',
          baseStyle: 'color:#1e88e5;font-weight:500;cursor:pointer;',
          title: '해당 상품의 리뷰만 하단에 표시',
          onClick: (row) => handleSelectAction('reviews-row-prod-click', row.prodId),
        } },
      { key: 'prodNm',          label: '상품명',   cellStyle: 'color:#444;',
        fmt: (v, row) => (getProdNm(row.prodId) || row.prodNm || '') },
      { key: 'memberId',        label: '작성자',   style: 'width:80px', fmt: (v, row) => getMemNm(row.memberId) },
      { key: 'rating',          label: '평점',     style: 'width:90px;text-align:center', align: 'center',
        cellStyle: 'color:#f59e0b;font-size:13px', fmt: (v, row) => (Number(row.rating || 0).toFixed(1) + ' ★') },
      { key: 'helpfulCnt',      label: '도움',     style: 'width:60px;text-align:right', align: 'right' },
      { key: 'reviewStatusCd',  label: '상태',     style: 'width:80px;text-align:center', align: 'center',
        badge: (row) => fnStatusBadge(row.reviewStatusCd),
        fmt: (v, row) => (STATUS_LABEL[row.reviewStatusCd] || row.reviewStatusCd) },
      { key: 'reviewDate',      label: '작성일',   style: 'width:140px', sortKey: 'reg' },
      { key: '_statusChg',      label: '상태변경', style: 'width:90px;text-align:center', align: 'center',
        selectIntercept: { valueKey: 'reviewStatusCd', options: () => codes.review_status_list,
          onChange: (row, newVal, $event) => handleSelectAction('reviews-row-status-change', { row, evt: $event }) } },
    ];
    /* fnGridRowClass — 유틸 */
    const fnGridRowClass = (row) => (selectedId.value === row.reviewId ? 'active' : '');

    /* 상품별 리뷰 목록 BoGrid 컬럼 */
    const prodReviewGridColumns = [
      { key: 'reviewTitle',    label: '리뷰 제목', cellInnerClass: 'title-link' },
      { key: 'memberId',       label: '작성자',   style: 'width:80px', fmt: (v, row) => getMemNm(row.memberId) },
      { key: 'rating',         label: '평점',     style: 'width:90px;text-align:center', align: 'center',
        cellStyle: 'color:#f59e0b;font-size:13px', fmt: (v, row) => (Number(row.rating || 0).toFixed(1) + ' ★') },
      { key: 'helpfulCnt',     label: '도움',     style: 'width:60px;text-align:right', align: 'right' },
      { key: 'reviewStatusCd', label: '상태',     style: 'width:80px;text-align:center', align: 'center',
        badge: (row) => fnStatusBadge(row.reviewStatusCd),
        fmt: (v, row) => (STATUS_LABEL[row.reviewStatusCd] || row.reviewStatusCd) },
      { key: 'reviewDate',     label: '작성일',   style: 'width:140px' },
      { key: '_statusChg',     label: '상태변경', style: 'width:90px;text-align:center', align: 'center',
        selectIntercept: { valueKey: 'reviewStatusCd', options: () => codes.review_status_list,
          onChange: (row, newVal, $event) => handleSelectAction('reviews-row-status-change', { row, evt: $event }) } },
    ];
    /* fnProdReviewRowClass — 유틸 */
    const fnProdReviewRowClass = (row) => (selectedId.value === row.reviewId ? 'active' : '');

    // ===== return (템플릿 노출) ===============================================

    return {
      reviews, uiState, searchParam, pager, codes,                                            // 상태 / 데이터
      prodReviews, prodReviewPager, statusModal,                                              // 상태 / 데이터
      baseSearchColumns, listGridColumns, prodReviewGridColumns,                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                    // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedRow, cfStatusModalRowTitle, cfStatusModalCurrentCd,                           // computed
      fnStatusBadge, STATUS_LABEL, getProdNm, getMemNm, starStr, sortIcon,                    // 헬퍼
      fnGridRowClass, fnProdReviewRowClass,                                                   // 그리드 row 헬퍼
      selectedId, selectedProdId,                                                             // ref
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    상품리뷰관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="listGridColumns" :rows="reviews" :pager="pager" row-key="reviewId"
    :sort-state="uiState" list-title="상품리뷰 목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다." row-clickable row-actions
    @sort="key => handleSelectAction('reviews-sort', key)" @set-page="n => handleSelectAction('reviews-set-page', n)" @size-change="handleBtnAction('reviews-size-change')" @row-click="r => handleSelectAction('reviews-row-edit', r)">
    <template #row-actions="{ row }">
      <button class="btn btn-xs" style="background:#fff;border:1px solid #d9d9d9;color:#555;font-size:12px;padding:2px 6px;" title="상품 미리보기" @click.stop="handleSelectAction('reviews-row-preview', row.prodId)">
        👁
      </button>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상품ID 클릭 시: 해당 상품의 리뷰 페이징 목록 ============================= -->
  <div class="card" v-if="selectedProdId">
    <div class="toolbar">
      <span class="list-title">
        📦 [{{ selectedProdId }}] 상품의 리뷰 목록
      </span>
      <span class="list-count">
        총 {{ prodReviewPager.pageTotalCount }}건
      </span>
      <button class="btn btn-xs" style="margin-left:auto;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:2px 8px;" @click="handleBtnAction('prodReviews-close')">
        ✕ 닫기
      </button>
    </div>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="prodReviewGridColumns" :rows="prodReviews" :pager="prodReviewPager"
        row-key="reviewId" :row-class="fnProdReviewRowClass"
        empty-text="해당 상품의 리뷰가 없습니다." row-clickable
        @set-page="n => handleSelectAction('prodReviews-set-page', n)" @size-change="handleBtnAction('prodReviews-size-change')" @row-click="r => handleSelectAction('prodReviews-row-edit', r)">
      </bo-grid>
    </div>
    <!-- ===== □.□. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <!-- ===== ■.■. /그리드 스크롤 컨테이너 ========================================= -->
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="prodReviewPager" :on-set-page="n => handleSelectAction('prodReviews-set-page', n)" :on-size-change="() => handleBtnAction('prodReviews-size-change')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </div>
  <!-- ===== □.□. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
  <!-- ===== □. 상품ID 클릭 시: 해당 상품의 리뷰 페이징 목록 ============================= -->
  <!-- ===== ■. 상세 패널 =================================================== -->
  <div class="card" v-if="cfSelectedRow">
    <div class="toolbar">
      <span class="list-title">
        리뷰 내용
      </span>
      <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#888;">
          현재 상태:
        </span>
        <span :class="['badge', fnStatusBadge(cfSelectedRow.reviewStatusCd)]">
          {{ STATUS_LABEL[cfSelectedRow.reviewStatusCd] || cfSelectedRow.reviewStatusCd }}
        </span>
        <span style="font-size:12px;color:#888;margin-left:8px;">
          변경:
        </span>
        <select class="form-control" style="font-size:12px;padding:3px 6px;width:auto;height:28px;"
          :value="cfSelectedRow.reviewStatusCd"
          @change="handleSelectAction('reviews-row-status-change', { row: cfSelectedRow, evt: $event })">
          <option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
        <button class="btn btn-xs" style="margin-left:6px;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:3px 10px;" @click="handleBtnAction('detailPanel-close')">
          ✕ 닫기
        </button>
      </span>
    </div>
    <div style="padding:16px">
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;margin-bottom:10px;">
        <span>
          <b style="color:#888;">
            상품:
          </b>
          [{{ cfSelectedRow.prodId }}] {{ getProdNm(cfSelectedRow.prodId) || cfSelectedRow.prodNm || '' }}
        </span>
        <span>
          <b style="color:#888;">
            작성자:
          </b>
          {{ getMemNm(cfSelectedRow.memberId) }}
        </span>
        <span>
          <b style="color:#888;">
            작성일:
          </b>
          {{ cfSelectedRow.reviewDate }}
        </span>
      </div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px">
        {{ cfSelectedRow.reviewTitle }}
      </div>
      <div style="color:#f59e0b;margin-bottom:8px">
        평점: {{ Number(cfSelectedRow.rating || 0).toFixed(1) }} / 5.0
      </div>
      <div style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:14px">
        {{ cfSelectedRow.reviewContent }}
      </div>
      <div style="margin-top:8px;font-size:12px;color:#888">
        도움이 됐어요 {{ cfSelectedRow.helpfulCnt }} | 도움이 안됐어요 {{ cfSelectedRow.unhelpfulCnt }}
      </div>
    </div>
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
  <!-- ===== ■. 상태변경 사유 입력 모달 =========================================== -->
  <div v-if="statusModal.show"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);z-index:1500;display:flex;align-items:center;justify-content:center;"
    @click.self="handleBtnAction('statusModal-close')">
    <div class="modal-box" style="background:#fff;border-radius:16px;width:480px;max-width:92vw;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
      <div class="tree-modal-header" style="padding:14px 20px;border-bottom:1px solid #f0e0e7;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);">
        <div style="font-size:14px;font-weight:700;color:#222;">
          리뷰 상태 변경
        </div>
        <button @click="handleBtnAction('statusModal-close')" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;">
          ✕
        </button>
      </div>
      <div style="padding:18px 20px;">
        <div style="margin-bottom:14px;font-size:13px;color:#444;line-height:1.7;">
          <div>
            <b>
              리뷰
            </b>
            : {{ cfStatusModalRowTitle }}
          </div>
          <div style="margin-top:4px;">
            <b>
              상태 변경
            </b>
            :
            <span :class="['badge', fnStatusBadge(cfStatusModalCurrentCd)]" style="margin-left:6px;">
              {{ STATUS_LABEL[cfStatusModalCurrentCd] }}
            </span>
            <span style="margin:0 6px;color:#888;">
              →
            </span>
            <span :class="['badge', fnStatusBadge(statusModal.newStatus)]">
              {{ STATUS_LABEL[statusModal.newStatus] }}
            </span>
          </div>
        </div>
        <label class="form-label" style="font-size:12px;font-weight:600;color:#555;display:block;">
          변경 사유
          <span style="color:#e57373;">
            *
          </span>
        </label>
        <textarea class="form-control" v-model="statusModal.reason" rows="4"
          placeholder="상태 변경 사유를 입력해주세요. (필수)"
          style="margin:6px 0 0;width:100%;font-size:13px;box-sizing:border-box;"></textarea>
        </div>
        <div style="padding:12px 20px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-secondary btn-sm" @click="handleBtnAction('statusModal-close')">
            취소
          </button>
          <button class="btn btn-primary btn-sm" @click="handleBtnAction('statusModal-confirm')">
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 상태변경 사유 입력 모달 =========================================== -->
`
};

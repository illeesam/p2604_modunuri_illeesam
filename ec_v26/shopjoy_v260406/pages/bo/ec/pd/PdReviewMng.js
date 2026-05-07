/* ShopJoy Admin - 상품리뷰관리 */
window.PdReviewMng = {
  name: 'PdReviewMng',
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
    const reviews = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      review_statuses: [],
      review_rating_opts: [{value:'5',label:'5점'},{value:'4',label:'4점대'},{value:'3',label:'3점대'},{value:'2',label:'2점대'},{value:'1',label:'1점대'}],
      review_status_list: [{value:'ACTIVE',label:'공개'},{value:'HIDDEN',label:'숨김'},{value:'DELETED',label:'삭제'}],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.review_statuses = codeStore.sgGetGrpCodes('REVIEW_STATUS');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


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
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });
    const pager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId   = ref(null);
    const _initSearchParam = () => ({ kw: '', status: '', rating: '' });
    const searchParam = reactive(_initSearchParam());

    const STATUS_LABEL = { ACTIVE:'공개', HIDDEN:'숨김', DELETED:'삭제' };
    const fnStatusBadge  = s => ({ ACTIVE:'badge-green', HIDDEN:'badge-orange', DELETED:'badge-red' }[s] || 'badge-gray');

    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id || p.prodId === id); return p ? (p.prodNm || p.productName) : ''; };
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id || m.memberId === id); return m ? (m.memberNm || m.name) : id; };

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 상단/하단 리뷰 목록 모두에서 선택된 리뷰를 찾는다 */
    const cfSelectedRow = computed(() =>
      reviews.find(r => r.reviewId === selectedId.value) ||
      prodReviews.find(r => r.reviewId === selectedId.value) ||
      null
    );

    const openDetail = (row) => { selectedId.value = selectedId.value === row.reviewId ? null : row.reviewId; };

    /* ── 상품 미리보기 (FO 새 창) ─────────────────────── */
    const previewProduct = (prodId) => {
      if (!prodId) return;
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    /* ── 상품ID 클릭 → 하단에 해당 상품의 리뷰 페이징 목록 ─── */
    const prodReviews = reactive([]);
    const prodReviewPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 50], pageCond: {}, pageNums: [1] });
    const selectedProdId = ref(null);
    const fnBuildProdReviewPagerNums = () => { const c=prodReviewPager.pageNo,l=prodReviewPager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); prodReviewPager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

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

    const onProdIdClick = async (prodId) => {
      if (!prodId) return;
      if (selectedProdId.value === prodId) {
        selectedProdId.value = null;
        prodReviews.splice(0);
        return;
      }
      selectedProdId.value = prodId;
      prodReviewPager.pageNo = 1;
      await handleSearchProdReviews();
    };

    const setProdReviewPage = async (n) => {
      if (n >= 1 && n <= prodReviewPager.pageTotalPage) {
        prodReviewPager.pageNo = n;
        await handleSearchProdReviews();
      }
    };
    const onProdReviewSizeChange = () => { prodReviewPager.pageNo = 1; handleSearchProdReviews(); };

    /* ── 상태변경 사유 입력 모달 ───────────────────────── */
    const statusModal = reactive({
      show: false,
      row: null,
      newStatus: '',
      reason: '',
    });

    const openStatusModal = (row, newStatus) => {
      if (!newStatus || newStatus === row.reviewStatusCd) return;
      statusModal.row = row;
      statusModal.newStatus = newStatus;
      statusModal.reason = '';
      statusModal.show = true;
    };

    /* select @change 핸들러 — 모달 열기 + select 값 즉시 원복 (저장 전이므로) */
    const onStatusSelectChange = (row, evt) => {
      const newStatus = evt && evt.target ? evt.target.value : '';
      openStatusModal(row, newStatus);
      if (evt && evt.target && row) evt.target.value = row.reviewStatusCd;
    };

    /* 모달 표시용 — row 의 안전 접근 (template 의 ?. 표현식 회피) */
    const cfStatusModalRowTitle  = computed(() => (statusModal.row && statusModal.row.reviewTitle) || '');
    const cfStatusModalCurrentCd = computed(() => (statusModal.row && statusModal.row.reviewStatusCd) || '');

    const closeStatusModal = () => {
      statusModal.show = false;
      /* select 가 미리 새 값으로 바뀌었을 수 있으므로 원복용 트리거 */
      // row.reviewStatusCd 는 그대로 — UI 의 select 가 다음 렌더에서 동기화됨
      statusModal.row = null;
      statusModal.newStatus = '';
      statusModal.reason = '';
    };

    const confirmStatusChange = async () => {
      const row = statusModal.row;
      const newStatus = statusModal.newStatus;
      const reason = (statusModal.reason || '').trim();
      if (!row) return;
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
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(`상태가 [${STATUS_LABEL[newStatus]}] 로 변경되었습니다.`, 'success');
        statusModal.show = false;
      } catch (err) {
        console.error('[confirmStatusChange]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const starStr  = r => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));

    // -- return ---------------------------------------------------------------

    return { reviews, uiState, searchParam, pager, setPage, onSearch, onReset,
              selectedId, cfSelectedRow, openDetail, fnStatusBadge, STATUS_LABEL, getProdNm, getMemNm, starStr, onSizeChange, codes, onSort, sortIcon,
              previewProduct,
              prodReviews, prodReviewPager, selectedProdId, onProdIdClick, setProdReviewPage, onProdReviewSizeChange,
              statusModal, openStatusModal, onStatusSelectChange, closeStatusModal, confirmStatusChange,
              cfStatusModalRowTitle, cfStatusModalCurrentCd,
            };
  },
  template: `
<div>
  <div class="page-title">상품리뷰관리</div>
    <div class="card">
      <div class="search-bar" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:flex-end">
        <div style="display:flex;flex-direction:column;gap:8px">
          <label class="search-label">리뷰제목</label>
          <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="리뷰 제목 검색">
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label class="search-label">상태</label>
          <select class="form-control" v-model="searchParam.status">
            <option value="">전체</option><option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label class="search-label">평점</label>
          <select class="form-control" v-model="searchParam.rating">
            <option value="">전체</option>
            <option v-for="o in codes.review_rating_opts" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="search-actions" style="gap:6px">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">상품리뷰 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>리뷰 제목</th>
          <th style="width:110px">상품ID</th>
          <th>상품명</th>
          <th style="width:48px;text-align:center;">미리</th>
          <th style="width:80px">작성자</th>
          <th style="width:90px;text-align:center">평점</th>
          <th style="width:60px;text-align:right">도움</th>
          <th style="width:80px;text-align:center">상태</th>
          <th @click="onSort('reg')" style="width:140px;cursor:pointer;user-select:none;white-space:nowrap;">작성일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
          <th style="width:90px;text-align:center">상태변경</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, idx) in reviews" :key="row && row.reviewId" :class="{active:selectedId===row.reviewId}" @click="openDetail(row)" style="cursor:pointer">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td><span class="title-link">{{ row.reviewTitle }}</span></td>
            <td style="font-size:12px;" @click.stop>
              <span class="title-link"
                :style="{color: selectedProdId===row.prodId ? '#e8587a' : '#1e88e5', fontWeight: selectedProdId===row.prodId ? 700 : 500, cursor:'pointer'}"
                title="해당 상품의 리뷰만 하단에 표시"
                @click="onProdIdClick(row.prodId)">{{ row.prodId }}</span>
            </td>
            <td style="font-size:12px;color:#444;">{{ getProdNm(row.prodId) || row.prodNm || '' }}</td>
            <td style="text-align:center" @click.stop>
              <button class="btn btn-xs" style="background:#fff;border:1px solid #d9d9d9;color:#555;font-size:12px;padding:2px 6px;" title="상품 미리보기" @click="previewProduct(row.prodId)">👁</button>
            </td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center;color:#f59e0b;font-size:13px">{{ Number(row.rating || 0).toFixed(1) }} ★</td>
            <td style="text-align:right;font-size:12px">{{ row.helpfulCnt }}</td>
            <td style="text-align:center"><span :class="['badge',fnStatusBadge(row.reviewStatusCd)]">{{ STATUS_LABEL[row.reviewStatusCd]||row.reviewStatusCd }}</span></td>
            <td style="font-size:12px">{{ row.reviewDate }}</td>
            <td style="text-align:center" @click.stop>
              <select class="form-control" style="font-size:11px;padding:2px 4px" :value="row.reviewStatusCd" @change="onStatusSelectChange(row, $event)">
                <option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="!reviews.length"><td colspan="11" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
    </div>

    <!-- ── 상품ID 클릭 시: 해당 상품의 리뷰 페이징 목록 ─────────────────── -->
    <div class="card" v-if="selectedProdId">
      <div class="toolbar">
        <span class="list-title">📦 [{{ selectedProdId }}] 상품의 리뷰 목록</span>
        <span class="list-count">총 {{ prodReviewPager.pageTotalCount }}건</span>
        <button class="btn btn-xs" style="margin-left:auto;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:2px 8px;" @click="onProdIdClick(selectedProdId)">✕ 닫기</button>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>리뷰 제목</th>
          <th style="width:80px">작성자</th>
          <th style="width:90px;text-align:center">평점</th>
          <th style="width:60px;text-align:right">도움</th>
          <th style="width:80px;text-align:center">상태</th>
          <th style="width:140px">작성일</th>
          <th style="width:90px;text-align:center">상태변경</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, idx) in prodReviews" :key="row && row.reviewId" :class="{active:selectedId===row.reviewId}" @click="openDetail(row)" style="cursor:pointer">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (prodReviewPager.pageNo - 1) * prodReviewPager.pageSize + idx + 1 }}</td>
            <td><span class="title-link">{{ row.reviewTitle }}</span></td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center;color:#f59e0b;font-size:13px">{{ Number(row.rating || 0).toFixed(1) }} ★</td>
            <td style="text-align:right;font-size:12px">{{ row.helpfulCnt }}</td>
            <td style="text-align:center"><span :class="['badge',fnStatusBadge(row.reviewStatusCd)]">{{ STATUS_LABEL[row.reviewStatusCd]||row.reviewStatusCd }}</span></td>
            <td style="font-size:12px">{{ row.reviewDate }}</td>
            <td style="text-align:center" @click.stop>
              <select class="form-control" style="font-size:11px;padding:2px 4px"
                :value="row.reviewStatusCd"
                @change="onStatusSelectChange(row, $event)">
                <option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="!prodReviews.length"><td colspan="8" style="text-align:center;padding:24px;color:#aaa">해당 상품의 리뷰가 없습니다.</td></tr>
        </tbody>
      </table>
      <bo-pager :pager="prodReviewPager" :on-set-page="setProdReviewPage" :on-size-change="onProdReviewSizeChange" />
    </div>

    <div class="card" v-if="cfSelectedRow">
      <div class="toolbar">
        <span class="list-title">리뷰 내용</span>
        <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;color:#888;">현재 상태:</span>
          <span :class="['badge', fnStatusBadge(cfSelectedRow.reviewStatusCd)]">{{ STATUS_LABEL[cfSelectedRow.reviewStatusCd] || cfSelectedRow.reviewStatusCd }}</span>
          <span style="font-size:12px;color:#888;margin-left:8px;">변경:</span>
          <select class="form-control" style="font-size:12px;padding:3px 6px;width:auto;height:28px;"
            :value="cfSelectedRow.reviewStatusCd"
            @change="onStatusSelectChange(cfSelectedRow, $event)">
            <option v-for="s in codes.review_status_list" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <button class="btn btn-xs" style="margin-left:6px;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:11px;padding:3px 10px;" @click="selectedId = null">✕ 닫기</button>
        </span>
      </div>
      <div style="padding:16px">
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#555;margin-bottom:10px;">
          <span><b style="color:#888;">상품:</b> [{{ cfSelectedRow.prodId }}] {{ getProdNm(cfSelectedRow.prodId) || cfSelectedRow.prodNm || '' }}</span>
          <span><b style="color:#888;">작성자:</b> {{ getMemNm(cfSelectedRow.memberId) }}</span>
          <span><b style="color:#888;">작성일:</b> {{ cfSelectedRow.reviewDate }}</span>
        </div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">{{ cfSelectedRow.reviewTitle }}</div>
        <div style="color:#f59e0b;margin-bottom:8px">평점: {{ Number(cfSelectedRow.rating || 0).toFixed(1) }} / 5.0</div>
        <div style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:14px">{{ cfSelectedRow.reviewContent }}</div>
        <div style="margin-top:8px;font-size:12px;color:#888">도움이 됐어요 {{ cfSelectedRow.helpfulCnt }} | 도움이 안됐어요 {{ cfSelectedRow.unhelpfulCnt }}</div>
      </div>
    </div>

    <!-- ── 상태변경 사유 입력 모달 ─────────────────────────── -->
    <div v-if="statusModal.show"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);z-index:1500;display:flex;align-items:center;justify-content:center;"
      @click.self="closeStatusModal">
      <div class="modal-box" style="background:#fff;border-radius:16px;width:480px;max-width:92vw;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;">
        <div class="tree-modal-header" style="padding:14px 20px;border-bottom:1px solid #f0e0e7;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);">
          <div style="font-size:14px;font-weight:700;color:#222;">리뷰 상태 변경</div>
          <button @click="closeStatusModal" style="border:none;background:transparent;color:#888;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <div style="padding:18px 20px;">
          <div style="margin-bottom:14px;font-size:13px;color:#444;line-height:1.7;">
            <div><b>리뷰</b>: {{ cfStatusModalRowTitle }}</div>
            <div style="margin-top:4px;">
              <b>상태 변경</b>:
              <span :class="['badge', fnStatusBadge(cfStatusModalCurrentCd)]" style="margin-left:6px;">{{ STATUS_LABEL[cfStatusModalCurrentCd] }}</span>
              <span style="margin:0 6px;color:#888;">→</span>
              <span :class="['badge', fnStatusBadge(statusModal.newStatus)]">{{ STATUS_LABEL[statusModal.newStatus] }}</span>
            </div>
          </div>
          <label class="form-label" style="font-size:12px;font-weight:600;color:#555;display:block;">변경 사유 <span style="color:#e57373;">*</span></label>
          <textarea class="form-control" v-model="statusModal.reason" rows="4"
            placeholder="상태 변경 사유를 입력해주세요. (필수)"
            style="margin:6px 0 0;width:100%;font-size:13px;box-sizing:border-box;"></textarea>
        </div>
        <div style="padding:12px 20px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-secondary btn-sm" @click="closeStatusModal">취소</button>
          <button class="btn btn-primary btn-sm" @click="confirmStatusChange">저장</button>
        </div>
      </div>
    </div>
</div>`
};

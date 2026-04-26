/* ShopJoy Admin - 상품리뷰관리 */
window.PdReviewMng = {
  name: 'PdReviewMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);
    const members = reactive([]);
    const reviews = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null});
    const codes = reactive({
      review_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.review_statuses = codeStore.snGetGrpCodes('REVIEW_STATUS') || [];
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
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/pd/review/page', {
          params: { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }
        });
        const data = res.data?.data;
        reviews.splice(0, reviews.length, ...(data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdReview 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
const pager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId   = ref(null);
  const searchParam = reactive({
    kw: '',
    status: '',
    rating: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    status: '',
    rating: ''
  });

    const STATUS_LIST = ['ACTIVE','HIDDEN','DELETED'];
    const STATUS_LABEL = { ACTIVE:'공개', HIDDEN:'숨김', DELETED:'삭제' };
    const fnStatusBadge  = s => ({ ACTIVE:'badge-green', HIDDEN:'badge-orange', DELETED:'badge-red' }[s] || 'badge-gray');

    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : id; };
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : id; };

    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const cfSelectedRow = computed(() => reviews.find(r => r.reviewId === selectedId.value) || null);

    const openDetail = (row) => { selectedId.value = selectedId.value === row.reviewId ? null : row.reviewId; };
    const changeStatus = async (row, newStatus) => {
      const ok = await props.showConfirm('상태변경', `[${row.reviewTitle}] 상태를 [${STATUS_LABEL[newStatus]}]로 변경하시겠습니까?`);
      if (!ok) return;
      row.reviewStatusCd = newStatus; if (cfSelectedRow.value) cfSelectedRow.value.reviewStatusCd = newStatus;
      try {
        const res = await window.boApi.put(`/bo/ec/pd/review/${row.reviewId}/status`, { reviewStatusCd: newStatus });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = async () => {
      Object.assign(searchParam, searchParamOrg);
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const starStr  = r => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));

    return { reviews, uiState, searchParam, searchParamOrg, pager, cfPageNums, setPage, onSearch, onReset,
              selectedId, cfSelectedRow, openDetail, changeStatus, fnStatusBadge, STATUS_LIST, STATUS_LABEL, getProdNm, getMemNm, starStr  , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">상품리뷰관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">리뷰제목</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="리뷰 제목 검색">
        <label class="search-label">상태</label>
        <select class="form-control" v-model="searchParam.status">
          <option value="">전체</option><option v-for="s in STATUS_LIST" :key="Math.random()" :value="s">{{ STATUS_LABEL[s] }}</option>
        </select>
        <label class="search-label">평점</label>
        <select class="form-control" v-model="searchParam.rating">
          <option value="">전체</option><option value="5">5점</option><option value="4">4점대</option>
          <option value="3">3점대</option><option value="2">2점대</option><option value="1">1점대</option>
        </select>
        <div class="search-actions">
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
          <th>리뷰 제목</th><th style="width:120px">상품</th><th style="width:80px">작성자</th>
          <th style="width:90px;text-align:center">평점</th>
          <th style="width:60px;text-align:right">도움</th>
          <th style="width:80px;text-align:center">상태</th>
          <th style="width:140px">작성일</th>
          <th style="width:80px;text-align:center">상태변경</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in reviews" :key="row?.reviewId" :class="{active:selectedId===row.reviewId}" @click="openDetail(row)" style="cursor:pointer">
            <td><span class="title-link">{{ row.reviewTitle }}</span></td>
            <td style="font-size:12px;color:#666">{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center;color:#f59e0b;font-size:13px">{{ row.rating.toFixed(1) }} ★</td>
            <td style="text-align:right;font-size:12px">{{ row.helpfulCnt }}</td>
            <td style="text-align:center"><span :class="['badge',fnStatusBadge(row.reviewStatusCd)]">{{ STATUS_LABEL[row.reviewStatusCd]||row.reviewStatusCd }}</span></td>
            <td style="font-size:12px">{{ row.reviewDate }}</td>
            <td style="text-align:center" @click.stop>
              <select class="form-control" style="font-size:11px;padding:2px 4px" :value="row.reviewStatusCd" @change="changeStatus(row,$event.target.value)">
                <option v-for="s in STATUS_LIST" :key="Math.random()" :value="s">{{ STATUS_LABEL[s] }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="!reviews.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
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
    <div class="card" v-if="cfSelectedRow">
      <div class="toolbar"><span class="list-title">리뷰 내용</span></div>
      <div style="padding:16px">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">{{ cfSelectedRow.reviewTitle }}</div>
        <div style="color:#f59e0b;margin-bottom:8px">평점: {{ cfSelectedRow.rating.toFixed(1) }} / 5.0</div>
        <div style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:14px">{{ cfSelectedRow.reviewContent }}</div>
        <div style="margin-top:8px;font-size:12px;color:#888">도움이 됐어요 {{ cfSelectedRow.helpfulCnt }} | 도움이 안됐어요 {{ cfSelectedRow.unhelpfulCnt }}</div>
      </div>
    </div>
</div>`
};

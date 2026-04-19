/* ShopJoy Admin - 상품리뷰관리 */
window.PdReviewMng = {
  name: 'PdReviewMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw     = ref('');
    const searchStatus = ref('');
    const searchRating = ref('');
    const applied      = reactive({ kw: '', status: '', rating: '' });
    const pager        = reactive({ page: 1, size: 20 });
    const selectedId   = ref(null);

    const STATUS_LIST = ['ACTIVE','HIDDEN','DELETED'];
    const STATUS_LABEL = { ACTIVE:'공개', HIDDEN:'숨김', DELETED:'삭제' };
    const statusBadge  = s => ({ ACTIVE:'badge-green', HIDDEN:'badge-orange', DELETED:'badge-red' }[s] || 'badge-gray');

    const getProdNm = id => { const p = (props.adminData.products||[]).find(p => p.productId === id); return p ? p.productName : id; };
    const getMemNm  = id => { const m = (props.adminData.members||[]).find(m => m.userId === id); return m ? m.name : id; };

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.reviews || []).filter(r => {
        if (kw && !r.reviewTitle.toLowerCase().includes(kw)) return false;
        if (applied.status && r.reviewStatusCd !== applied.status) return false;
        if (applied.rating) { const min = parseFloat(applied.rating); if (r.rating < min || r.rating >= min + 1) return false; }
        return true;
      }).sort((a, b) => b.reviewDate > a.reviewDate ? 1 : -1);
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedRow = computed(() => (props.adminData.reviews||[]).find(r => r.reviewId === selectedId.value) || null);

    const openDetail = (row) => { selectedId.value = selectedId.value === row.reviewId ? null : row.reviewId; };
    const changeStatus = async (row, newStatus) => {
      const ok = await props.showConfirm('상태변경', `[${row.reviewTitle}] 상태를 [${STATUS_LABEL[newStatus]}]로 변경하시겠습니까?`);
      if (!ok) return;
      row.reviewStatusCd = newStatus; if (selectedRow.value) selectedRow.value.reviewStatusCd = newStatus;
      try {
        const res = await window.adminApi.put(`pd/reviews/${row.reviewId}/status`, { reviewStatusCd: newStatus });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, status: searchStatus.value, rating: searchRating.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchStatus.value = ''; searchRating.value = ''; Object.assign(applied, { kw: '', status: '', rating: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const starStr  = r => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));

    return { searchKw, searchStatus, searchRating, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             selectedId, selectedRow, openDetail, changeStatus, statusBadge, STATUS_LIST, STATUS_LABEL, getProdNm, getMemNm, starStr , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">상품리뷰관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">리뷰제목</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="리뷰 제목 검색">
        <label class="search-label">상태</label>
        <select class="form-control" v-model="searchStatus">
          <option value="">전체</option><option v-for="s in STATUS_LIST" :key="s" :value="s">{{ STATUS_LABEL[s] }}</option>
        </select>
        <label class="search-label">평점</label>
        <select class="form-control" v-model="searchRating">
          <option value="">전체</option><option value="5">5점</option><option value="4">4점대</option>
          <option value="3">3점대</option><option value="2">2점대</option><option value="1">1점대</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">상품리뷰 목록</span>
        <span class="list-count">총 {{ total }}건</span>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>리뷰 제목</th><th style="width:120px">상품</th><th style="width:80px">작성자</th>
          <th style="width:90px;text-align:center">평점</th>
          <th style="width:60px;text-align:right">도움</th>
          <th style="width:80px;text-align:center">상태</th>
          <th style="width:140px">작성일</th>
          <th style="width:80px;text-align:center">상태변경</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.reviewId" :class="{active:selectedId===row.reviewId}" @click="openDetail(row)" style="cursor:pointer">
            <td><span class="title-link">{{ row.reviewTitle }}</span></td>
            <td style="font-size:12px;color:#666">{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center;color:#f59e0b;font-size:13px">{{ row.rating.toFixed(1) }} ★</td>
            <td style="text-align:right;font-size:12px">{{ row.helpfulCnt }}</td>
            <td style="text-align:center"><span :class="['badge',statusBadge(row.reviewStatusCd)]">{{ STATUS_LABEL[row.reviewStatusCd]||row.reviewStatusCd }}</span></td>
            <td style="font-size:12px">{{ row.reviewDate }}</td>
            <td style="text-align:center" @click.stop>
              <select class="form-control" style="font-size:11px;padding:2px 4px" :value="row.reviewStatusCd" @change="changeStatus(row,$event.target.value)">
                <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ STATUS_LABEL[s] }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
    <div class="card" v-if="selectedRow">
      <div class="toolbar"><span class="list-title">리뷰 내용</span></div>
      <div style="padding:16px">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">{{ selectedRow.reviewTitle }}</div>
        <div style="color:#f59e0b;margin-bottom:8px">평점: {{ selectedRow.rating.toFixed(1) }} / 5.0</div>
        <div style="background:#f9f9f9;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:14px">{{ selectedRow.reviewContent }}</div>
        <div style="margin-top:8px;font-size:12px;color:#888">도움이 됐어요 {{ selectedRow.helpfulCnt }} | 도움이 안됐어요 {{ selectedRow.unhelpfulCnt }}</div>
      </div>
    </div>
</div>`
};

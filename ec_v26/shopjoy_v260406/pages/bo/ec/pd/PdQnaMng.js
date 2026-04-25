/* ShopJoy Admin - 상품Q&A관리 */
window.PdQnaMng = {
  name: 'PdQnaMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const products = reactive([]);
    const members = reactive([]);
    const qnas = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const fetchData = async () => {
      loading.value = true;
      try {
        const [qnasRes, prodsRes, membersRes] = await Promise.all([
          window.boApi.get('/bo/ec/pd/qna/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/pd/prod/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/mb/member/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        qnas.splice(0, qnas.length, ...(qnasRes.data?.data?.list || []));
        products.splice(0, products.length, ...(prodsRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.list || []));
        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('PdQna 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { fetchData(); });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw   = ref('');
    const searchAnsw = ref('');
    const applied    = reactive({ kw: '', answ: '' });
    const pager      = reactive({ page: 1, size: 20 });
    const selectedId = ref(null);
    const answForm   = reactive({ content: '' });

    const TYPE_LABELS = { SIZE:'사이즈', QUALITY:'소재/품질', DLIV:'배송', ETC:'기타' };
    const fnTypeBadge = t => ({ SIZE:'badge-blue', QUALITY:'badge-green', DLIV:'badge-orange', ETC:'badge-gray' }[t] || 'badge-gray');

    const getProdNm = id => { const p = (products||[]).find(p => p.productId === id); return p ? p.productName : id; };
    const getMemNm  = id => { const m = (members||[]).find(m => m.userId === id); return m ? m.name : id; };

    const cfFiltered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (prodQnas).filter(q => {
        if (kw && !q.qnaTitle.toLowerCase().includes(kw)) return false;
        if (applied.answ && q.answYn !== applied.answ) return false;
        return true;
      }).sort((a, b) => b.regDate > a.regDate ? 1 : -1);
    });
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList   = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums   = computed(() => { const c=pager.page,l=cfTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedRow = computed(() => (prodQnas||[]).find(q => q.qnaId === selectedId.value) || null);

    const openDetail = (row) => {
      if (selectedId.value === row.qnaId) { selectedId.value = null; return; }
      answForm.content = row.answContent || '';
      selectedId.value = row.qnaId;
    };
    const handleAnswer = async () => {
      if (!selectedRow.value) return;
      if (!answForm.content.trim()) { props.showToast('답변 내용을 입력하세요.', 'error'); return; }
      const ok = await props.showConfirm('답변저장', '답변을 저장하시겠습니까?');
      if (!ok) return;
      selectedRow.value.answContent = answForm.content;
      selectedRow.value.answYn = 'Y';
      selectedRow.value.answDate = new Date().toLocaleString('sv').replace('T', ' ');
      try {
        const res = await window.boApi.put(`/bo/ec/pd/qna/${selectedRow.value.qnaId}/answer`, { answContent: answForm.content });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, answ: searchAnsw.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchAnsw.value = ''; Object.assign(applied, { kw: '', answ: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-red';

    return { qnas, loading, error, searchKw, searchAnsw, pager, cfPageNums, cfTotalPages, setPage, cfTotal, cfPageList, onSearch, onReset,
             selectedId, selectedRow, answForm, openDetail, handleAnswer, fnTypeBadge, fnYnBadge, TYPE_LABELS, getProdNm, getMemNm , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">상품Q&A관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">문의제목</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="() => onSearch?.()" placeholder="문의 제목 검색">
        <label class="search-label">답변여부</label>
        <select class="form-control" v-model="searchAnsw">
          <option value="">전체</option><option value="Y">답변완료</option><option value="N">미답변</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">상품 Q&amp;A 목록</span>
        <span class="list-count">총 {{ cfTotal }}건</span>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th>문의 제목</th><th style="width:120px">상품</th><th style="width:80px">작성자</th>
          <th style="width:80px;text-align:center">유형</th>
          <th style="width:70px;text-align:center">비밀글</th>
          <th style="width:70px;text-align:center">답변</th>
          <th style="width:140px">등록일</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in cfPageList" :key="row?.qnaId" :class="{active:selectedId===row.qnaId}" @click="openDetail(row)" style="cursor:pointer">
            <td><span class="title-link">{{ row.scrtYn==='Y' ? '🔒 비밀글' : row.qnaTitle }}</span></td>
            <td style="font-size:12px;color:#666">{{ getProdNm(row.prodId) }}</td>
            <td style="font-size:12px">{{ getMemNm(row.memberId) }}</td>
            <td style="text-align:center"><span :class="['badge',fnTypeBadge(row.qnaTypeCd)]">{{ TYPE_LABELS[row.qnaTypeCd]||row.qnaTypeCd }}</span></td>
            <td style="text-align:center"><span :class="['badge',row.scrtYn==='Y'?'badge-orange':'badge-gray']">{{ row.scrtYn }}</span></td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.answYn)]">{{ row.answYn==='Y'?'답변완료':'미답변' }}</span></td>
            <td style="font-size:12px">{{ row.regDate }}</td>
          </tr>
          <tr v-if="!cfPageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
    <div class="card" v-if="selectedRow">
      <div class="toolbar"><span class="list-title">문의 상세 / 답변</span></div>
      <div style="padding:16px">
        <div style="font-weight:600;margin-bottom:6px">{{ selectedRow.qnaTitle }}</div>
        <div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:12px;white-space:pre-wrap;font-size:13px">{{ selectedRow.qnaContent }}</div>
        <div style="font-weight:600;margin-bottom:6px;color:#e8587a">답변 작성</div>
        <textarea class="form-control" rows="4" v-model="answForm.content" placeholder="답변 내용을 입력하세요."></textarea>
        <div v-if="selectedRow.answDate" style="font-size:12px;color:#888;margin-top:4px">최근 답변: {{ selectedRow.answDate }}</div>
        <div style="margin-top:8px"><button class="btn btn-primary btn-sm" @click="handleAnswer">답변 저장</button></div>
      </div>
    </div>
</div>`
};

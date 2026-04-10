/* ShopJoy Admin - 클레임관리 목록 + 하단 ClaimDtl 임베드 */
window.ClaimMng = {
  name: 'ClaimMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchType = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'claimMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.claims.filter(c => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !c.claimId.toLowerCase().includes(kw) && !c.userName.toLowerCase().includes(kw) && !c.productName.toLowerCase().includes(kw)) return false;
      if (applied.type && c.type !== applied.type) return false;
      if (applied.status && c.status !== applied.status) return false;
      const _d = String(c.requestDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const typeBadge = t => ({ '취소': 'badge-gray', '반품': 'badge-orange', '교환': 'badge-blue' }[t] || 'badge-gray');
    const statusBadge = s => ({
      '취소요청': 'badge-orange', '취소처리중': 'badge-orange', '취소완료': 'badge-gray',
      '반품요청': 'badge-orange', '수거예정': 'badge-blue', '수거완료': 'badge-blue',
      '환불처리중': 'badge-orange', '환불완료': 'badge-green',
      '교환요청': 'badge-orange', '발송완료': 'badge-blue', '교환완료': 'badge-green',
    }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        type: searchType.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchType.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('클레임 삭제', `[${c.claimId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.claims.findIndex(x => x.claimId === c.claimId);
      if (idx !== -1) props.adminData.claims.splice(idx, 1);
      if (selectedId.value === c.claimId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchType, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, typeBadge, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">클레임관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="클레임ID / 회원명 / 상품명 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>취소</option><option>반품</option><option>교환</option></select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option>
        <option>취소요청</option><option>취소처리중</option><option>취소완료</option>
        <option>반품요청</option><option>수거예정</option><option>수거완료</option><option>환불처리중</option><option>환불완료</option>
        <option>교환요청</option><option>발송완료</option><option>교환완료</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">클레임목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>클레임ID</th><th>회원</th><th>주문ID</th><th>상품</th><th>유형</th><th>사유</th><th>상태</th><th>신청일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.claimId" :style="selectedId===c.claimId?'background:#fff8f9;':''">
          <td><span class="title-link" @click="loadDetail(c.claimId)" :style="selectedId===c.claimId?'color:#e8587a;font-weight:700;':''">{{ c.claimId }}<span v-if="selectedId===c.claimId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userName }}</span></td>
          <td><span class="ref-link" @click="showRefModal('order', c.orderId)">{{ c.orderId }}</span></td>
          <td>{{ c.productName }}</td>
          <td><span class="badge" :class="typeBadge(c.type)">{{ c.type }}</span></td>
          <td>{{ c.reason }}</td>
          <td><span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span></td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.claimId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
          </div></td>
        </tr>
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

  <!-- 하단 상세: ClaimDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <claim-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};

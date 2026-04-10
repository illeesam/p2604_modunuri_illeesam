/* ShopJoy Admin - 문의관리 목록 + 하단 ContactDtl 임베드 */
window.ContactMng = {
  name: 'ContactMng',
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
    const searchCategory = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'syContactMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', category: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.contacts.filter(c => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !c.title.toLowerCase().includes(kw) && !c.userName.toLowerCase().includes(kw)) return false;
      if (applied.category && c.category !== applied.category) return false;
      if (applied.status && c.status !== applied.status) return false;
      const _d = String(c.date || '').slice(0, 10);
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
    const statusBadge = s => ({ '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        category: searchCategory.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchCategory.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', category: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('문의 삭제', `[${c.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.contacts.findIndex(x => x.inquiryId === c.inquiryId);
      if (idx !== -1) props.adminData.contacts.splice(idx, 1);
      if (selectedId.value === c.inquiryId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchCategory, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">문의관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="제목 / 회원명 검색" />
      <select v-model="searchCategory">
        <option value="">카테고리 전체</option>
        <option>배송 문의</option><option>상품 문의</option><option>교환·반품 문의</option>
        <option>주문·결제 문의</option><option>기타 문의</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>요청</option><option>처리중</option><option>답변완료</option><option>취소됨</option>
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
      <span class="list-title">문의목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>회원</th><th>카테고리</th><th>제목</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="7" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.inquiryId" :style="selectedId===c.inquiryId?'background:#fff8f9;':''">
          <td>{{ c.inquiryId }}</td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userName }}</span></td>
          <td><span class="tag">{{ c.category }}</span></td>
          <td><span class="title-link" @click="loadDetail(c.inquiryId)" :style="selectedId===c.inquiryId?'color:#e8587a;font-weight:700;':''">{{ c.title }}<span v-if="selectedId===c.inquiryId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span></td>
          <td>{{ c.date.slice(0,10) }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.inquiryId)">수정</button>
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

  <!-- 하단 상세: ContactDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <contact-dtl
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

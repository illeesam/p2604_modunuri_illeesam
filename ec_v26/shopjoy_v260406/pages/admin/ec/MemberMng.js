/* ShopJoy Admin - 회원관리 목록 + 하단 MemberDtl 임베드 */
window.MemberMng = {
  name: 'MemberMng',
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
    const searchGrade = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'ecMemberMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', grade: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.members.filter(m => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !m.name.toLowerCase().includes(kw) && !m.email.toLowerCase().includes(kw) && !String(m.userId).includes(kw)) return false;
      if (applied.grade && m.grade !== applied.grade) return false;
      if (applied.status && m.status !== applied.status) return false;
      const _d = String(m.joinDate || '').slice(0, 10);
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

    const gradeBadge = g => ({ 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' }[g] || 'badge-gray');
    const statusBadge = s => ({ '활성': 'badge-green', '정지': 'badge-red' }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        grade: searchGrade.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchGrade.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', grade: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (m) => {
      const ok = await props.showConfirm('회원 삭제', `[${m.name}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.members.findIndex(x => x.userId === m.userId);
      if (idx !== -1) props.adminData.members.splice(idx, 1);
      if (selectedId.value === m.userId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchGrade, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, onSearch, onReset, setPage, onSizeChange, gradeBadge, statusBadge, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">회원관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="이름 / 이메일 / ID 검색" />
      <select v-model="searchGrade"><option value="">등급 전체</option><option>VIP</option><option>우수</option><option>일반</option></select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>정지</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>회원목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>이름</th><th>이메일</th><th>연락처</th><th>등급</th><th>상태</th><th>가입일</th><th>주문수</th><th>총구매액</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="m in pageList" :key="m.userId" :style="selectedId===m.userId?'background:#fff8f9;':''">
          <td>{{ m.userId }}</td>
          <td><span class="title-link" @click="loadDetail(m.userId)" :style="selectedId===m.userId?'color:#e8587a;font-weight:700;':''">{{ m.name }}<span v-if="selectedId===m.userId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ m.email }}</td>
          <td>{{ m.phone }}</td>
          <td><span class="badge" :class="gradeBadge(m.grade)">{{ m.grade }}</span></td>
          <td><span class="badge" :class="statusBadge(m.status)">{{ m.status }}</span></td>
          <td>{{ m.joinDate }}</td>
          <td>{{ m.orderCount }}건</td>
          <td>{{ m.totalPurchase.toLocaleString() }}원</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(m.userId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(m)">삭제</button>
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

  <!-- 하단 상세: MemberDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <member-dtl
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

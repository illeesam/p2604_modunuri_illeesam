/* ShopJoy Admin - 사용자관리(관리자) 목록 */
window.UserMng = {
  name: 'UserMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
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
    const searchRole = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syUserMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', role: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.adminUsers.filter(u => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !u.name.toLowerCase().includes(kw) && !u.loginId.toLowerCase().includes(kw) && !u.email.toLowerCase().includes(kw)) return false;
      if (applied.role && u.role !== applied.role) return false;
      if (applied.status && u.status !== applied.status) return false;
      const _d = String(u.regDate || '').slice(0, 10);
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

    const roleBadge = r => ({ '슈퍼관리자': 'badge-red', '관리자': 'badge-purple', '운영자': 'badge-blue' }[r] || 'badge-gray');
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        role: searchRole.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchRole.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', role: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (u) => {
      if (u.role === '슈퍼관리자') { props.showToast('슈퍼관리자는 삭제할 수 없습니다.', 'error'); return; }
      await window.adminApiCall({
        method: 'delete',
        path: `admin-users/${u.adminUserId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${u.name}] 사용자를 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.adminUsers.findIndex(x => x.adminUserId === u.adminUserId);
          if (idx !== -1) props.adminData.adminUsers.splice(idx, 1);
          if (selectedId.value === u.adminUserId) selectedId.value = null;
        },
      });
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'adminUserId'},{label:'로그인ID',key:'loginId'},{label:'이름',key:'name'},{label:'이메일',key:'email'},{label:'연락처',key:'phone'},{label:'권한',key:'role'},{label:'부서',key:'dept'},{label:'상태',key:'status'},{label:'최종로그인',key:'lastLogin'}], '사용자목록.csv');

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchRole, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, onSearch, onReset, setPage, onSizeChange, roleBadge, statusBadge, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">사용자관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="이름 / 로그인ID / 이메일 검색" />
      <select v-model="searchRole">
        <option value="">권한 전체</option><option>슈퍼관리자</option><option>관리자</option><option>운영자</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>로그인ID</th><th>이름</th><th>이메일</th><th>연락처</th><th>권한</th><th>부서</th><th>상태</th><th>최근로그인</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="u in pageList" :key="u.adminUserId" :style="selectedId===u.adminUserId?'background:#fff8f9;':''">
          <td>{{ u.adminUserId }}</td>
          <td><code style="font-size:12px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ u.loginId }}</code></td>
          <td><span class="title-link" @click="loadDetail(u.adminUserId)" :style="selectedId===u.adminUserId?'color:#e8587a;font-weight:700;':''">{{ u.name }}<span v-if="selectedId===u.adminUserId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="font-size:12px;">{{ u.email }}</td>
          <td>{{ u.phone }}</td>
          <td><span class="badge" :class="roleBadge(u.role)">{{ u.role }}</span></td>
          <td style="font-size:12px;color:#666;">{{ u.dept }}</td>
          <td><span class="badge" :class="statusBadge(u.status)">{{ u.status }}</span></td>
          <td style="font-size:12px;color:#888;">{{ u.lastLogin }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(u.adminUserId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(u)">삭제</button>
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
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <user-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="detailEditId" />
  </div>
</div>
`
};

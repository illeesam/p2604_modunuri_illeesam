/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchKw = ref(''); const searchType = ref(''); const searchStatus = ref('');
    const searchDateStart = ref(''); const searchDateEnd = ref(''); const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'cmNoticeMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
    const filtered = computed(() => props.adminData.notices.filter(n => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !n.title.toLowerCase().includes(kw)) return false;
      if (applied.type && n.noticeType !== applied.type) return false;
      if (applied.status && n.statusCd !== applied.status) return false;
      const d = String(n.regDate || '').slice(0, 10);
      if (applied.dateStart && d < applied.dateStart) return false;
      if (applied.dateEnd && d > applied.dateEnd) return false;
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const statusBadge = s => ({ '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' }[s] || 'badge-gray');
    const typeBadge = t => ({ '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' }[t] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, type: searchType.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = ''; Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const doDelete = async (n) => {
      const ok = await props.showConfirm('삭제', `[${n.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.notices.findIndex(x => x.noticeId === n.noticeId);
      if (idx !== -1) props.adminData.notices.splice(idx, 1);
      if (selectedId.value === n.noticeId) selectedId.value = null;
      try {
        const res = await window.adminApi.delete(`notices/${n.noticeId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'noticeId'},{label:'제목',key:'title'},{label:'유형',key:'noticeType'},{label:'상태',key:'statusCd'},{label:'조회수',key:'viewCount'},{label:'등록일',key:'regDate'}], '공지목록.csv');

    return { siteNm, searchKw, searchType, searchStatus, searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, typeBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">공지사항관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="제목 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>일반</option><option>긴급</option><option>이벤트</option><option>시스템</option></select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>게시</option><option>예약</option><option>종료</option><option>임시</option></select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" />
      <select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>공지사항목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>유형</th><th>제목</th><th>고정</th><th>시작일</th><th>종료일</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="n in pageList" :key="n.noticeId" :style="selectedId===n.noticeId?'background:#fff8f9;':''">
          <td>{{ n.noticeId }}</td>
          <td><span class="badge" :class="typeBadge(n.noticeType)">{{ n.noticeType }}</span></td>
          <td><span class="title-link" @click="loadDetail(n.noticeId)" :style="selectedId===n.noticeId?'color:#e8587a;font-weight:700;':''">{{ n.title }}<span v-if="n.isFixed" style="margin-left:4px;font-size:10px;color:#e8587a;">📌</span><span v-if="selectedId===n.noticeId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="n.isFixed?'badge-red':'badge-gray'">{{ n.isFixed ? '고정' : '-' }}</span></td>
          <td>{{ n.startDate || '-' }}</td>
          <td>{{ n.endDate || '-' }}</td>
          <td><span class="badge" :class="statusBadge(n.statusCd)">{{ n.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td>{{ n.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(n.noticeId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(n)">삭제</button>
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
    <cm-notice-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="detailEditId" />
  </div>
</div>
`
};

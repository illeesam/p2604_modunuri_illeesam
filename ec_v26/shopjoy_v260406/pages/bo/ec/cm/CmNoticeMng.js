/* ShopJoy Admin - 공지사항관리 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const notices = reactive([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    const fetchData = async () => {
      loading.value = true;
      try {
        const res = await window.boApi.get('/bo/ec/cm/notice/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        notices.splice(0, notices.length, ...(res.data?.data?.list || []));
        error.value = null;
      } catch (err) {
        error.value = err.message;
        if (props.showToast) props.showToast('CmNotice 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };
    onMounted(() => { fetchData(); });
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const searchKw = ref(''); const searchType = ref(''); const searchStatus = ref('');
    const searchDateStart = ref(''); const searchDateEnd = ref(''); const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.boCmUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
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
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
    const cfFiltered = computed(() => window.safeArrayUtils.safeFilter(notices, n => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !n.title.toLowerCase().includes(kw)) return false;
      if (applied.type && n.noticeType !== applied.type) return false;
      if (applied.status && n.statusCd !== applied.status) return false;
      const d = String(n.regDate || '').slice(0, 10);
      if (applied.dateStart && d < applied.dateStart) return false;
      if (applied.dateEnd && d > applied.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const fnStatusBadge = s => ({ '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' }[s] || 'badge-gray');
    const fnTypeBadge = t => ({ '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' }[t] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, type: searchType.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = ''; Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const handleDelete = async (n) => {
      const ok = await props.showConfirm('삭제', `[${n.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = notices.value.findIndex(x => x.noticeId === n.noticeId);
      if (idx !== -1) notices.value.splice(idx, 1);
      if (selectedId.value === n.noticeId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/cm/notice/${n.noticeId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'noticeId'},{label:'제목',key:'title'},{label:'유형',key:'noticeType'},{label:'상태',key:'statusCd'},{label:'조회수',key:'viewCount'},{label:'등록일',key:'regDate'}], '공지목록.csv');

    return { notices, loading, error, cfSiteNm, searchKw, searchType, searchStatus, searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnStatusBadge, fnTypeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, selectedId, cfDetailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
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
      <select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>공지사항목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr><th>ID</th><th>유형</th><th>제목</th><th>고정</th><th>시작일</th><th>종료일</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="n in cfPageList" :key="n?.noticeId" :style="selectedId===n.noticeId?'background:#fff8f9;':''">
          <td>{{ n.noticeId }}</td>
          <td><span class="badge" :class="fnTypeBadge(n.noticeType)">{{ n.noticeType }}</span></td>
          <td><span class="title-link" @click="loadDetail(n.noticeId)" :style="selectedId===n.noticeId?'color:#e8587a;font-weight:700;':''">{{ n.title }}<span v-if="n.isFixed" style="margin-left:4px;font-size:10px;color:#e8587a;">📌</span><span v-if="selectedId===n.noticeId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="n.isFixed?'badge-red':'badge-gray'">{{ n.isFixed ? '고정' : '-' }}</span></td>
          <td>{{ n.startDate || '-' }}</td>
          <td>{{ n.endDate || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(n.statusCd)">{{ n.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td>{{ n.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(n.noticeId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(n)">삭제</button>
          </div></td>
        </tr>
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
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <cm-notice-dtl :key="selectedId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div>
`
};

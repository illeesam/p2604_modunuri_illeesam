/* ShopJoy Admin - 게시글관리 */
window.BbsMng = {
  name: 'BbsMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref(''); const searchBbmId = ref(''); const searchStatus = ref('');
    const searchDateStart = ref(''); const searchDateEnd = ref(''); const searchDateRange = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];
    const selectedId = ref(null);
    const loadDetail = (id) => { selectedId.value = selectedId.value === id ? null : id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg) => { if (pg === 'syBbsMng') { selectedId.value = null; return; } props.navigate(pg); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const bbmOptions = computed(() => props.adminData.bbms.map(b => ({ value: b.bbmId, label: b.bbmName })));
    const bbmName = (bbmId) => { const b = props.adminData.bbms.find(x => x.bbmId === bbmId); return b ? b.bbmName : bbmId; };

    const applied = reactive({ kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '' });
    const filtered = computed(() => props.adminData.bbss.filter(b => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !b.title.toLowerCase().includes(kw) && !String(b.author || '').toLowerCase().includes(kw)) return false;
      if (applied.bbmId && b.bbmId !== Number(applied.bbmId)) return false;
      if (applied.status && b.status !== applied.status) return false;
      const d = String(b.regDate || '').slice(0, 10);
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
    const statusBadge = s => ({ '게시': 'badge-green', '임시': 'badge-gray', '삭제': 'badge-red', '비공개': 'badge-orange' }[s] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, bbmId: searchBbmId.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchBbmId.value = ''; searchStatus.value = ''; searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = ''; Object.assign(applied, { kw: '', bbmId: '', status: '', dateStart: '', dateEnd: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const doDelete = async (b) => {
      const ok = await props.showConfirm('게시글 삭제', `[${b.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.bbss.findIndex(x => x.bbsId === b.bbsId);
      if (idx !== -1) props.adminData.bbss.splice(idx, 1);
      if (selectedId.value === b.bbsId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };
    return { searchKw, searchBbmId, searchStatus, searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate, bbmOptions, bbmName };
  },
  template: /* html */`
<div>
  <div class="page-title">게시글관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="제목 / 작성자 검색" />
      <select v-model="searchBbmId">
        <option value="">게시판 전체</option>
        <option v-for="o in bbmOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>게시</option><option>임시</option><option>비공개</option><option>삭제</option></select>
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
      <span class="list-title">게시글목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>게시판</th><th>제목</th><th>작성자</th><th>조회수</th><th>댓글</th><th>첨부그룹</th><th>상태</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="b in pageList" :key="b.bbsId" :style="selectedId===b.bbsId?'background:#fff8f9;':''">
          <td>{{ b.bbsId }}</td>
          <td><span class="badge badge-gray">{{ bbmName(b.bbmId) }}</span></td>
          <td><span class="title-link" @click="loadDetail(b.bbsId)" :style="selectedId===b.bbsId?'color:#e8587a;font-weight:700;':''">{{ b.title }}<span v-if="selectedId===b.bbsId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ b.author }}</td>
          <td style="text-align:center;">{{ b.viewCount }}</td>
          <td style="text-align:center;">{{ b.commentCount }}</td>
          <td style="font-size:11px;color:#888;">{{ b.attachGrpId || '-' }}</td>
          <td><span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span></td>
          <td>{{ b.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(b.bbsId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(b)">삭제</button>
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
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <bbs-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :edit-id="detailEditId" />
  </div>
</div>
`
};

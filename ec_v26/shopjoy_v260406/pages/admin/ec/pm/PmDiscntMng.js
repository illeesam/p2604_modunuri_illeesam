/* ShopJoy Admin - 판촉할인 관리 목록 + 하단 PmDiscntDtl 임베드 */
window.PmDiscntMng = {
  name: 'PmDiscntMng',
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
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchType = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    const selectedId = ref(null);
    const openMode = ref('view');
    const loadView   = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew    = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmDiscntMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode   = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey    = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });

    const list = computed(() => props.adminData.discntList || []);
    const filtered = computed(() => list.value.filter(d => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !String(d.discntNm || '').toLowerCase().includes(kw) && !String(d.discntId || '').includes(kw)) return false;
      if (applied.type   && d.discntType   !== applied.type)   return false;
      if (applied.status && d.discntStatus !== applied.status) return false;
      const _d = String(d.startDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd   && _d > applied.dateEnd)   return false;
      return true;
    }));
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const typeBadge   = t => ({ '정률': 'badge-blue', '정액': 'badge-green', '장바구니': 'badge-orange' }[t] || 'badge-gray');
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' }[s] || 'badge-gray');

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, type: searchType.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = ''; searchType.value = ''; searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage      = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      await window.adminApiCall({
        method: 'delete', path: `discnt/${d.discntId}`,
        confirmTitle: '삭제', confirmMsg: `[${d.discntNm}] 할인을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = (props.adminData.discntList || []).findIndex(x => x.discntId === d.discntId);
          if (idx !== -1) props.adminData.discntList.splice(idx, 1);
          if (selectedId.value === d.discntId) selectedId.value = null;
        },
      });
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value,
      [{label:'ID',key:'discntId'},{label:'할인명',key:'discntNm'},{label:'유형',key:'discntType'},{label:'할인값',key:'discntVal'},{label:'상태',key:'discntStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '판촉할인목록.csv');

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchType, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, typeBadge, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">판촉할인관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="할인명 / ID 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>정률</option><option>정액</option><option>장바구니</option></select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>비활성</option><option>종료</option></select>
      <span class="search-label">시작일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>할인목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>할인명</th><th>유형</th><th>할인값</th><th>적용대상</th><th>시작일</th><th>종료일</th><th>상태</th><th>사이트</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="d in pageList" :key="d.discntId" :style="selectedId===d.discntId?'background:#fff8f9;':''">
          <td>{{ d.discntId }}</td>
          <td><span class="title-link" @click="loadDetail(d.discntId)" :style="selectedId===d.discntId?'color:#e8587a;font-weight:700;':''">{{ d.discntNm }}<span v-if="selectedId===d.discntId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="typeBadge(d.discntType)">{{ d.discntType }}</span></td>
          <td>{{ d.discntType === '정률' ? (d.discntVal + '%') : (d.discntVal||0).toLocaleString() + '원' }}</td>
          <td style="font-size:12px;color:#555;">{{ d.applyTarget || '전체상품' }}</td>
          <td>{{ d.startDate }}</td>
          <td>{{ d.endDate }}</td>
          <td><span class="badge" :class="statusBadge(d.discntStatus)">{{ d.discntStatus }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(d.discntId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
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

  <!-- 하단 상세: PmDiscntDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-discnt-dtl
      :key="detailKey"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};

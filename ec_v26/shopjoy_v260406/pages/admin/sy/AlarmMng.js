/* ShopJoy Admin - 알림관리 */
window.AlarmMng = {
  name: 'AlarmMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchKw = ref(''); const searchType = ref(''); const searchStatus = ref('');
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
    const inlineNavigate = (pg) => { if (pg === 'syAlarmMng') { selectedId.value = null; return; } props.navigate(pg); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });
    const filtered = computed(() => props.adminData.alarms.filter(a => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !a.title.toLowerCase().includes(kw) && !a.message.toLowerCase().includes(kw)) return false;
      if (applied.type && a.alarmType !== applied.type) return false;
      if (applied.status && a.status !== applied.status) return false;
      const d = String(a.sendDate || a.regDate || '').slice(0, 10);
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
    const statusBadge = s => ({ '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' }[s] || 'badge-gray');
    const typeBadge = t => ({ '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' }[t] || 'badge-gray');
    const targetBadge = t => ({ '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' }[t] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, type: searchType.value, status: searchStatus.value, dateStart: searchDateStart.value, dateEnd: searchDateEnd.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = ''; Object.assign(applied, { kw: '', type: '', status: '', dateStart: '', dateEnd: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const doDelete = async (a) => {
      await window.adminApiCall({
        method: 'delete',
        path: `alarms/${a.alarmId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${a.title}]을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.alarms.findIndex(x => x.alarmId === a.alarmId);
          if (idx !== -1) props.adminData.alarms.splice(idx, 1);
          if (selectedId.value === a.alarmId) selectedId.value = null;
        },
      });
    };
    return { siteName, searchKw, searchType, searchStatus, searchDateStart, searchDateEnd, searchDateRange, DATE_RANGE_OPTIONS, onDateRangeChange, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, typeBadge, targetBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">알림관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="제목 / 메시지 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>푸시</option><option>이메일</option><option>SMS</option><option>인앱</option></select>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>발송완료</option><option>예약</option><option>실패</option><option>임시</option></select>
      <span class="search-label">발송일</span>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>알림목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>유형</th><th>제목</th><th>메시지</th><th>대상</th><th>발송일</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="a in pageList" :key="a.alarmId" :style="selectedId===a.alarmId?'background:#fff8f9;':''">
          <td>{{ a.alarmId }}</td>
          <td><span class="badge" :class="typeBadge(a.alarmType)">{{ a.alarmType }}</span></td>
          <td><span class="title-link" @click="loadDetail(a.alarmId)" :style="selectedId===a.alarmId?'color:#e8587a;font-weight:700;':''">{{ a.title }}<span v-if="selectedId===a.alarmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ a.message }}</td>
          <td><span class="badge" :class="targetBadge(a.targetType)">{{ a.targetType }}</span></td>
          <td>{{ a.sendDate || '-' }}</td>
          <td><span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td>{{ a.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(a.alarmId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(a)">삭제</button>
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
    <alarm-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="detailEditId" />
  </div>
</div>
`
};

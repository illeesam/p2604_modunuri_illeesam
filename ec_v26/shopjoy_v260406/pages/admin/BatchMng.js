/* ShopJoy Admin - 배치스케즐관리 목록 */
window.BatchMng = {
  name: 'BatchMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref('3months');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchStatus = ref('');
    const searchRunStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50];

    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg) => { if (pg === 'batchMng') { selectedId.value = null; } };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.batches.filter(b => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !b.batchName.toLowerCase().includes(kw) && !b.batchCode.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && b.status !== searchStatus.value) return false;
      if (searchRunStatus.value && b.runStatus !== searchRunStatus.value) return false;
      if (!window.adminUtil.isInRange(b.regDate, searchDateRange.value)) return false;
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

    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const runStatusBadge = s => ({
      '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray',
    }[s] || 'badge-gray');

    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const runNow = async (b) => {
      const ok = await props.showConfirm('즉시 실행', `[${b.batchName}] 배치를 즉시 실행하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.batches.findIndex(x => x.batchId === b.batchId);
      if (idx !== -1) {
        props.adminData.batches[idx].runStatus = '실행중';
        setTimeout(() => {
          props.adminData.batches[idx].runStatus = '성공';
          props.adminData.batches[idx].lastRun = new Date().toLocaleString('ko-KR').replace(/\./g, '-').replace(/ /g, ' ').slice(0, 16);
          props.adminData.batches[idx].runCount++;
        }, 1500);
      }
      props.showToast('배치 실행을 시작했습니다.');
    };

    const doDelete = async (b) => {
      const ok = await props.showConfirm('배치 삭제', `[${b.batchName}] 배치를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.batches.findIndex(x => x.batchId === b.batchId);
      if (idx !== -1) props.adminData.batches.splice(idx, 1);
      if (selectedId.value === b.batchId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, DATE_RANGE_OPTIONS, siteName, searchKw, searchStatus, searchRunStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, onSearch, setPage, onSizeChange, statusBadge, runStatusBadge, runNow, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">배치스케즐관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="배치명 / 배치코드 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch">
        <option value="">활성여부 전체</option><option>활성</option><option>비활성</option>
      </select>
      <select v-model="searchRunStatus" @change="onSearch">
        <option value="">실행상태 전체</option><option>성공</option><option>실패</option><option>실행중</option><option>대기</option>
      </select>
      <select v-model="searchDateRange" @change="onSearch"><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <button class="btn btn-primary" @click="onSearch">검색</button>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span style="font-size:13px;color:#555;">검색결과 <b>{{ total }}</b>건</span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>배치명</th><th>배치코드</th><th>Cron 표현식</th><th>최근실행</th><th>다음실행</th><th>실행횟수</th><th>활성</th><th>실행상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="b in pageList" :key="b.batchId" :style="selectedId===b.batchId?'background:#fff8f9;':''">
          <td>{{ b.batchId }}</td>
          <td><span class="title-link" @click="loadDetail(b.batchId)" :style="selectedId===b.batchId?'color:#e8587a;font-weight:700;':''">{{ b.batchName }}<span v-if="selectedId===b.batchId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><code style="font-size:11px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ b.batchCode }}</code></td>
          <td><code style="font-size:12px;background:#f0f8ff;padding:2px 6px;border-radius:3px;color:#2563eb;">{{ b.cron }}</code></td>
          <td style="font-size:12px;color:#555;">{{ b.lastRun }}</td>
          <td style="font-size:12px;color:#555;">{{ b.nextRun }}</td>
          <td style="text-align:center;">{{ b.runCount.toLocaleString() }}회</td>
          <td><span class="badge" :class="statusBadge(b.status)">{{ b.status }}</span></td>
          <td><span class="badge" :class="runStatusBadge(b.runStatus)">{{ b.runStatus }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-secondary btn-sm" @click="runNow(b)" title="즉시실행">▶</button>
            <button class="btn btn-blue btn-sm" @click="loadDetail(b.batchId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(b)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="total-label">총 {{ total }}건</span>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
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
    <batch-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :edit-id="detailEditId" />
  </div>
</div>
`
};

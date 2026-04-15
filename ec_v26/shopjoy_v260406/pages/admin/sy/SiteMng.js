/* ShopJoy Admin - 사이트관리 목록 */
window.SySiteMng = {
  name: 'SySiteMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {

    /* ── 좌측 표시경로 트리 ── */
    const selectedPath = Vue.ref('');
    const expanded = Vue.reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { selectedPath.value = path; };
    const tree = Vue.computed(() => {
      const root = { name: '전체', path: '', count: 0, children: {} };
      const src = (props.adminData.sites || []);
      src.forEach(r => {
        const p = r.dispPath || '기타';
        const segs = p.split('.');
        let node = root; node.count++;
        let acc = '';
        segs.forEach(seg => {
          acc = acc ? acc + '.' + seg : seg;
          if (!node.children[seg]) node.children[seg] = { name: seg, path: acc, count: 0, children: {} };
          node = node.children[seg]; node.count++;
        });
      });
      const toArr = (n) => ({ ...n, children: Object.values(n.children).sort((a,b)=>a.name.localeCompare(b.name)).map(toArr) });
      return toArr(root);
    });
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(tree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };

    const { ref, reactive, computed } = Vue;
    const searchKw     = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew    = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'sySiteMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const typeOptions = computed(() => [...new Set(props.adminData.sites.map(s => s.siteType))].sort());

    const applied = Vue.reactive({ kw: '', type: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.sites.filter(s => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !s.siteNm.toLowerCase().includes(kw) && !s.domain.toLowerCase().includes(kw) && !s.siteCode.toLowerCase().includes(kw)) return false;
      if (applied.type   && s.siteType  !== applied.type)   return false;
      if (applied.status && s.statusCd    !== applied.status)  return false;
      const _d = String(s.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
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

    const statusBadge = s => ({ '운영중': 'badge-green', '점검중': 'badge-orange', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const typeBadge   = t => ({
      '이커머스': 'badge-red', '숙박공유': 'badge-blue', '전문가연결': 'badge-purple',
      'IT매칭': 'badge-blue', '부동산': 'badge-orange', '교육': 'badge-green',
      '중고거래': 'badge-orange', '영화예매': 'badge-red', '음식배달': 'badge-orange',
      '가격비교': 'badge-blue', '시각화': 'badge-purple', '홈페이지': 'badge-gray',
    }[t] || 'badge-gray');

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
    const setPage     = n  => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (s) => {
      await window.adminApiCall({
        method: 'delete',
        path: `sites/${s.siteId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${s.siteCode}] ${s.siteNm} 사이트를 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.sites.findIndex(x => x.siteId === s.siteId);
          if (idx !== -1) props.adminData.sites.splice(idx, 1);
          if (selectedId.value === s.siteId) selectedId.value = null;
        },
      });
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'siteId'},{label:'사이트코드',key:'siteCode'},{label:'사이트명',key:'siteNm'},{label:'도메인',key:'domain'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '사이트목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */
    Vue.watch(selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    return {
      selectedPath, expanded, toggleNode, selectNode, expandAll, collapseAll, tree,
      searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange,
      searchKw, searchType, searchStatus, typeOptions,
      pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums,
      onSearch, onReset, setPage, onSizeChange,
      statusBadge, typeBadge, doDelete,
      selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">사이트관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="사이트코드 / 사이트명 / 도메인 검색" />
      <select v-model="searchType">
        <option value="">유형 전체</option>
        <option v-for="t in typeOptions" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>운영중</option><option>점검중</option><option>비활성</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <!-- 좌 트리 + 우 영역 -->
  <div style="display:grid;grid-template-columns:25% 75%;gap:12px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사이트목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
          <th style="min-width:140px;">표시경로</th>
        <th>사이트코드</th><th>유형</th><th>사이트명</th><th>도메인</th><th>대표이메일</th><th>대표전화</th><th>대표자</th><th>등록일</th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="s in pageList" :key="s.siteId" :style="selectedId===s.siteId?'background:#fff8f9;':''">
          <td><span style="font-family:monospace;font-size:11px;color:#e8587a;">{{ s.dispPath || '-' }}</span></td>
          <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ s.siteCode }}</code></td>
          <td><span class="badge" :class="typeBadge(s.siteType)" style="font-size:10px;">{{ s.siteType }}</span></td>
          <td>
            <span class="title-link" @click="loadDetail(s.siteId)" :style="selectedId===s.siteId?'color:#e8587a;font-weight:700;':''">
              {{ s.siteNm }}<span v-if="selectedId===s.siteId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
            <div style="font-size:11px;color:#888;margin-top:2px;">{{ s.description }}</div>
          </td>
          <td style="font-size:12px;color:#2563eb;">{{ s.domain }}</td>
          <td style="font-size:12px;">{{ s.email }}</td>
          <td style="font-size:12px;">{{ s.phone }}</td>
          <td style="font-size:12px;">{{ s.ceo }}</td>
          <td style="font-size:12px;">{{ s.regDate }}</td>
          <td><span class="badge" :class="statusBadge(s.statusCd)">{{ s.statusCd }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(s.siteId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(s)">삭제</button>
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
          <option v-for="sz in PAGE_SIZES" :key="sz" :value="sz">{{ sz }}개</option>
        </select>
      </div>
    </div>
  </div>

  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-site-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="detailEditId" />
  </div>
</div></div>
</div>
`
};

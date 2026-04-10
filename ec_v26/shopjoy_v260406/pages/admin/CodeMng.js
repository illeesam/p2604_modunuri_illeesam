/* ShopJoy Admin - 공통코드관리 목록 */
window.CodeMng = {
  name: 'CodeMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref('3months');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchGrp = ref('');
    const searchUseYn = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg) => { if (pg === 'codeMng') { selectedId.value = null; } };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const grpOptions = computed(() => {
      const grps = [...new Set(props.adminData.codes.map(c => c.codeGrp))];
      return grps.sort();
    });

    const filtered = computed(() => props.adminData.codes.filter(c => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !c.codeGrp.toLowerCase().includes(kw) && !c.codeLabel.toLowerCase().includes(kw) && !c.codeValue.toLowerCase().includes(kw)) return false;
      if (searchGrp.value && c.codeGrp !== searchGrp.value) return false;
      if (searchUseYn.value && c.useYn !== searchUseYn.value) return false;
      if (!window.adminUtil.isInRange(c.regDate, searchDateRange.value)) return false;
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

    const useYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('코드 삭제', `[${c.codeGrp} / ${c.codeLabel}] 코드를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.codes.findIndex(x => x.codeId === c.codeId);
      if (idx !== -1) props.adminData.codes.splice(idx, 1);
      if (selectedId.value === c.codeId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, DATE_RANGE_OPTIONS, siteName, searchKw, searchGrp, searchUseYn, grpOptions, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, onSearch, setPage, onSizeChange, useYnBadge, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="코드그룹 / 라벨 / 코드값 검색" @keyup.enter="onSearch" />
      <select v-model="searchGrp" @change="onSearch">
        <option value="">그룹 전체</option>
        <option v-for="g in grpOptions" :key="g">{{ g }}</option>
      </select>
      <select v-model="searchUseYn" @change="onSearch">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
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
        <th>ID</th><th>코드그룹 (code_grp)</th><th>코드라벨 (code_label)</th><th>코드값 (code_value)</th><th>정렬순서</th><th>사용여부</th><th>비고</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.codeId" :style="selectedId===c.codeId?'background:#fff8f9;':''">
          <td>{{ c.codeId }}</td>
          <td><span class="title-link" @click="loadDetail(c.codeId)" :style="selectedId===c.codeId?'color:#e8587a;font-weight:700;':''">{{ c.codeGrp }}<span v-if="selectedId===c.codeId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ c.codeLabel }}</td>
          <td><code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:12px;">{{ c.codeValue }}</code></td>
          <td>{{ c.sortOrd }}</td>
          <td><span class="badge" :class="useYnBadge(c.useYn)">{{ c.useYn === 'Y' ? '사용' : '미사용' }}</span></td>
          <td style="color:#666;font-size:12px;">{{ c.remark }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.codeId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
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
    <code-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :edit-id="detailEditId" />
  </div>
</div>
`
};

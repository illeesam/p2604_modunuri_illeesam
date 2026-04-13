/* ShopJoy Admin - 게시판관리 */
window.SyBbmMng = {
  name: 'SyBbmMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchKw = ref(''); const searchType = ref(''); const searchUseYn = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbmMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = reactive({ kw: '', type: '', useYn: '' });
    const filtered = computed(() => props.adminData.bbms.filter(b => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !b.bbmNm.toLowerCase().includes(kw) && !b.bbmCode.toLowerCase().includes(kw)) return false;
      if (applied.type && b.bbmType !== applied.type) return false;
      if (applied.useYn && b.useYn !== applied.useYn) return false;
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
    const typeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const ynBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';
    const commentBadge = v => ({ '불가': 'badge-gray', '댓글허용': 'badge-blue', '대댓글허용': 'badge-green' }[v] || 'badge-gray');
    const attachBadge  = v => ({ '불가': 'badge-gray', '1개': 'badge-orange', '2개': 'badge-orange', '3개': 'badge-orange', '목록': 'badge-blue' }[v] || 'badge-gray');
    const contentBadge = v => ({ '불가': 'badge-gray', 'textarea': 'badge-blue', 'htmleditor': 'badge-green' }[v] || 'badge-gray');
    const scopeBadge   = v => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[v] || 'badge-gray');
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, type: searchType.value, useYn: searchUseYn.value }); pager.page = 1; };
    const onReset = () => { searchKw.value = ''; searchType.value = ''; searchUseYn.value = ''; Object.assign(applied, { kw: '', type: '', useYn: '' }); pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const doDelete = async (b) => {
      await window.adminApiCall({
        method: 'delete',
        path: `bbm/${b.bbmId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${b.bbmNm}]을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.bbms.findIndex(x => x.bbmId === b.bbmId);
          if (idx !== -1) props.adminData.bbms.splice(idx, 1);
          if (selectedId.value === b.bbmId) selectedId.value = null;
        },
      });
    };
    const bbsCount = (bbmId) => props.adminData.bbss.filter(b => b.bbmId === bbmId).length;
    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'bbmId'},{label:'게시판명',key:'bbmNm'},{label:'유형',key:'bbmType'},{label:'사용여부',key:'useYn'},{label:'등록일',key:'regDate'}], '게시판목록.csv');

    return { siteNm, searchKw, searchType, searchUseYn, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, typeBadge, ynBadge, commentBadge, attachBadge, contentBadge, scopeBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, bbsCount, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">게시판관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="게시판명 / 코드 검색" />
      <select v-model="searchType"><option value="">유형 전체</option><option>일반</option><option>공지</option><option>갤러리</option><option>FAQ</option><option>QnA</option></select>
      <select v-model="searchUseYn"><option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>게시판목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>게시판코드</th><th>게시판명</th><th>유형</th><th>댓글허용</th><th>첨부허용</th><th>내용입력</th><th>공개범위</th><th>좋아요</th><th>게시글수</th><th>정렬순서</th><th>사용여부</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="15" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="b in pageList" :key="b.bbmId" :style="selectedId===b.bbmId?'background:#fff8f9;':''">
          <td>{{ b.bbmId }}</td>
          <td><code style="font-size:11px;color:#555;">{{ b.bbmCode }}</code></td>
          <td><span class="title-link" @click="loadDetail(b.bbmId)" :style="selectedId===b.bbmId?'color:#e8587a;font-weight:700;':''">{{ b.bbmNm }}<span v-if="selectedId===b.bbmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="badge" :class="typeBadge(b.bbmType)">{{ b.bbmType }}</span></td>
          <td><span class="badge" :class="commentBadge(b.allowComment)">{{ b.allowComment || '불가' }}</span></td>
          <td><span class="badge" :class="attachBadge(b.allowAttach)">{{ b.allowAttach || '불가' }}</span></td>
          <td><span class="badge" :class="contentBadge(b.contentType)">{{ b.contentType || '-' }}</span></td>
          <td><span class="badge" :class="scopeBadge(b.scopeType)">{{ b.scopeType || '-' }}</span></td>
          <td><span class="badge" :class="ynBadge(b.allowLike)">{{ b.allowLike==='Y'?'허용':'불가' }}</span></td>
          <td style="text-align:center;">{{ bbsCount(b.bbmId) }}</td>
          <td style="text-align:center;">{{ b.sortOrd }}</td>
          <td><span class="badge" :class="ynBadge(b.useYn)">{{ b.useYn==='Y'?'사용':'미사용' }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td>{{ b.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(b.bbmId)">수정</button>
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
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <bbm-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="detailEditId" />
  </div>
</div>
`
};

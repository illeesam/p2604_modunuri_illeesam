/* ShopJoy Admin - 게시판관리 */
window.SyBbmMng = {
  name: 'SyBbmMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const bbms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({ bbm_type: [], bbm_status: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/bbm/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        bbms.splice(0, bbms.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyBbm 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* 표시경로 트리/픽커 (sy_path biz_cd=sy_bbm) */
        const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPath = id; };
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_bbm'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    /* _expand3: 기본 3레벨 펼침 */
    onMounted(() => {
      handleFetchData();
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      Object.assign(searchParamOrg, searchParam);
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.bbm_type = await codeStore.snGetGrpCodes('BBM_TYPE') || [];
        codes.bbm_status = await codeStore.snGetGrpCodes('BBM_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => { if (pathPickModal.row) pathPickModal.row.pathId = pathId; };
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const searchParam = reactive({
      kw: '', type: '', useYn: ''
    });
    const searchParamOrg = reactive({
      kw: '', type: '', useYn: ''
    });
    const pager = reactive({ page: 1, size: 10, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] });

    const detailModal = reactive({
      show: false,
      editId: null,
      viewMode: 'view' // 'view' | 'edit'
    });

    const loadView = (id) => { if (detailModal.editId === id && detailModal.viewMode === 'view') { detailModal.show = false; detailModal.editId = null; return; } detailModal.editId = id; detailModal.viewMode = 'view'; detailModal.show = true; };
    const handleLoadDetail = (id) => { if (detailModal.editId === id && detailModal.viewMode === 'edit') { detailModal.show = false; detailModal.editId = null; return; } detailModal.editId = id; detailModal.viewMode = 'edit'; detailModal.show = true; };
    const openNew = () => { detailModal.editId = '__new__'; detailModal.viewMode = 'edit'; detailModal.show = true; };
    const closeDetail = () => { detailModal.show = false; detailModal.editId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbmMng') { detailModal.show = false; detailModal.editId = null; return; }
      if (pg === '__switchToEdit__') { detailModal.viewMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.editId === '__new__' ? null : detailModal.editId);
    const cfIsViewMode = computed(() => detailModal.viewMode === 'view' && detailModal.editId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.editId}_${detailModal.viewMode}`);

    const cfFiltered = computed(() => bbms.filter(b => {
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !b.bbmNm.toLowerCase().includes(kw) && !b.bbmCode.toLowerCase().includes(kw)) return false;
      if (searchParam.type && b.bbmType !== searchParam.type) return false;
      if (searchParam.useYn && b.useYn !== searchParam.useYn) return false;
      if (uiState.selectedPath != null) {
        const _desc = window.boCmUtil.getPathDescendants('sy_bbm', uiState.selectedPath);
        if (_desc && !_desc.has(b.pathId)) return false;
      }
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
    const fnTypeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';
    const fnCommentBadge = v => ({ '불가': 'badge-gray', '댓글허용': 'badge-blue', '대댓글허용': 'badge-green' }[v] || 'badge-gray');
    const fnAttachBadge  = v => ({ '불가': 'badge-gray', '1개': 'badge-orange', '2개': 'badge-orange', '3개': 'badge-orange', '목록': 'badge-blue' }[v] || 'badge-gray');
    const fnContentBadge = v => ({ '불가': 'badge-gray', 'textarea': 'badge-blue', 'htmleditor': 'badge-green' }[v] || 'badge-gray');
    const fnScopeBadge   = v => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[v] || 'badge-gray');
    const onSearch = () => {
      pager.page = 1;
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const handleDelete = async (b) => {
      const ok = await props.showConfirm('삭제', `[${b.bbmNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = bbms.findIndex(x => x.bbmId === b.bbmId);
      if (idx !== -1) bbms.splice(idx, 1);
      if (detailModal.editId === b.bbmId) { detailModal.show = false; detailModal.editId = null; }
      try {
        const res = await window.boApi.delete(`/bo/sy/bbm/${b.bbmId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const bbsCount = (bbmId) => bbss.value.filter(b => b.bbmId === bbmId).length;
    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'bbmId'},{label:'게시판명',key:'bbmNm'},{label:'유형',key:'bbmType'},{label:'사용여부',key:'useYn'},{label:'등록일',key:'regDate'}], '게시판목록.csv');

    return { bbms, uiState, codes, cfSiteNm, searchParam, pager, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnTypeBadge, fnYnBadge, fnCommentBadge, fnAttachBadge, fnContentBadge, fnScopeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, bbsCount, exportExcel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel };
  },
  template: /* html */`
<div>
  <div class="page-title">게시판관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="게시판명 / 코드 검색" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option>일반</option><option>공지</option><option>갤러리</option><option>FAQ</option><option>QnA</option></select>
      <select v-model="searchParam.useYn"><option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <!-- 좌: 표시경로 트리 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <!-- 우: 목록 + 상세 -->
    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>게시판목록 <span class="list-count">{{ cfTotal }}건</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
            <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
          </div>
        </div>
        <table class="bo-table">
          <thead><tr>
            <th style="min-width:130px;">표시경로</th><th>ID</th><th>게시판코드</th><th>게시판명</th><th>유형</th><th>댓글허용</th><th>첨부허용</th><th>내용입력</th><th>공개범위</th><th>좋아요</th><th>게시글수</th><th>정렬순서</th><th>사용여부</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="cfPageList.length===0"><td colspan="16" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="b in cfPageList" :key="b.bbmId" :style="detailModal.editId===b.bbmId?'background:#fff8f9;':''">
              <td>
                <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:b.pathId!=null?'#374151':'#9ca3af',fontWeight:b.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}">
                  <span style="flex:1;">{{ pathLabel(b.pathId) || '경로 선택...' }}</span>
                  <button type="button" @click.stop="openPathPick(b)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
                </div>
              </td>
              <td>{{ b.bbmId }}</td>
              <td><code style="font-size:11px;color:#555;">{{ b.bbmCode }}</code></td>
              <td><span class="title-link" @click="handleLoadDetail(b.bbmId)" :style="detailModal.editId===b.bbmId?'color:#e8587a;font-weight:700;':''">{{ b.bbmNm }}<span v-if="detailModal.editId===b.bbmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
              <td><span class="badge" :class="fnTypeBadge(b.bbmType)">{{ b.bbmType }}</span></td>
              <td><span class="badge" :class="fnCommentBadge(b.allowComment)">{{ b.allowComment || '불가' }}</span></td>
              <td><span class="badge" :class="fnAttachBadge(b.allowAttach)">{{ b.allowAttach || '불가' }}</span></td>
              <td><span class="badge" :class="fnContentBadge(b.contentType)">{{ b.contentType || '-' }}</span></td>
              <td><span class="badge" :class="fnScopeBadge(b.scopeType)">{{ b.scopeType || '-' }}</span></td>
              <td><span class="badge" :class="fnYnBadge(b.allowLike)">{{ b.allowLike==='Y'?'허용':'불가' }}</span></td>
              <td style="text-align:center;">{{ bbsCount(b.bbmId) }}</td>
              <td style="text-align:center;">{{ b.sortOrd }}</td>
              <td><span class="badge" :class="fnYnBadge(b.useYn)">{{ b.useYn==='Y'?'사용':'미사용' }}</span></td>
              <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
              <td>{{ b.regDate }}</td>
              <td><div class="actions">
                <button class="btn btn-blue btn-sm" @click="handleLoadDetail(b.bbmId)">수정</button>
                <button class="btn btn-danger btn-sm" @click="handleDelete(b)">삭제</button>
              </div></td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <div></div>
          <div class="pager">
            <button :disabled="pager.page===1" @click="setPage(1)">«</button>
            <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
            <button v-for="n in cfPageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
            <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
            <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
              <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="detailModal.show" style="margin-top:4px;">
        <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
          <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
        </div>
        <sy-bbm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" :view-mode="cfIsViewMode" />
      </div>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal.show" biz-cd="sy_bbm"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    title="게시판 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

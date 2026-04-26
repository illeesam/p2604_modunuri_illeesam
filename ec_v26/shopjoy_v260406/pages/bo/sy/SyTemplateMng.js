/* ShopJoy Admin - 템플릿관리 목록 */
window.SyTemplateMng = {
  name: 'SyTemplateMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const templates = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({ template_type: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/template/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        templates = res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyTemplate 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* ── 좌측 표시경로 트리 ── */
        const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { uiState.selectedPath = path; };
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_template'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
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
        codes.template_type = await codeStore.snGetGrpCodes('TEMPLATE_TYPE') || [];
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

    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
  const searchParam = reactive({
    kw: '',
    type: '',
    useYn: '',
    dateRange: '',
    dateStart: '',
    dateEnd: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    type: '',
    useYn: '',
    dateRange: '',
    dateStart: '',
    dateEnd: ''
  });

    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = window.boCmUtil.getDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const uiStateDetail = reactive({ selectedId: null, openMode: 'view' });
    const loadView = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'view') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; };
    const handleLoadDetail = (id) => { if (uiStateDetail.selectedId === id && uiStateDetail.openMode === 'edit') { uiStateDetail.selectedId = null; return; } uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syTemplateMng') { uiStateDetail.selectedId = null; return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 미리보기 모달 */
    const previewModal = reactive({ show: false, template: null });
    const showPreview = (t) => { previewModal.template = t; previewModal.show = true; };
    const closePreview = () => { previewModal.show = false; };

    /* 발송하기 모달 */
    const sendModal = reactive({ show: false, template: null });
    const openSend  = (t) => { sendModal.template = t; sendModal.show = true; };
    const closeSend = () => { sendModal.show = false; };

    const TEMPLATE_TYPES = ['메일템플릿', '문자템플릿', 'MMS템플릿', 'kakao톡템플릿', 'kakao알림톡템플릿', '시스템알림', '회원알림'];

    const applied = reactive({ kw: '', type: '', useYn: '', dateStart: '', dateEnd: '' });

    const cfFiltered = computed(() => templates.filter(t => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !t.templateNm.toLowerCase().includes(kw) && !t.subject.toLowerCase().includes(kw)) return false;
      if (applied.type && t.templateTypeCd !== applied.type) return false;
      if (applied.useYn && t.useYn !== applied.useYn) return false;
      const _d = String(t.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const fnTypeBadge = t => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[t] || 'badge-gray');
    const fnUseYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    const onSearch = async () => {
      Object.assign(applied, {
        kw: searchParam.kw,
        type: searchParam.type,
        useYn: searchParam.useYn,
        dateStart: searchParam.dateStart,
        dateEnd: searchParam.dateEnd,
      });
      pager.page = 1;
      await handleFetchData();
    };
    const onReset = () => {
      Object.assign(searchParam, { kw: '', type: '', useYn: '', dateRange: '', dateStart: '', dateEnd: '' });
      Object.assign(applied, { kw: '', type: '', useYn: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const handleDelete = async (t) => {
      const ok = await props.showConfirm('삭제', `[${t.templateNm}] 템플릿을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = templates.findIndex(x => x.templateId === t.templateId);
      if (idx !== -1) templates.splice(idx, 1);
      if (uiStateDetail.selectedId === t.templateId) uiStateDetail.selectedId = null;
      try {
        const res = await window.boApi.delete(`/bo/sy/template/${t.templateId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'templateId'},{label:'템플릿명',key:'templateNm'},{label:'유형',key:'templateTypeCd'},{label:'사용여부',key:'useYn'},{label:'등록일',key:'regDate'}], '템플릿목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */
    watch(() => uiState.selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), templates, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, searchParam, DATE_RANGE_OPTIONS, onDateRangeChange, cfSiteNm, TEMPLATE_TYPES, pager, PAGE_SIZES, applied, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, onSearch, onReset, setPage, onSizeChange, fnTypeBadge, fnUseYnBadge, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewModal, showPreview, closePreview, sendModal, openSend, closeSend, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">템플릿관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="템플릿명 / 제목 검색" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in TEMPLATE_TYPES" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <!-- 좌 트리 + 우 영역 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title">템플릿목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="min-width:140px;">표시경로</th>
        <th>ID</th><th>템플릿유형</th><th>템플릿코드</th><th>템플릿명</th><th>제목(Subject)</th><th>사용여부</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="t in cfPageList" :key="t.templateId" :style="selectedId===t.templateId?'background:#fff8f9;':''">
          <td><div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:t.pathId!=null?'#374151':'#9ca3af',fontWeight:t.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}"><span style="flex:1;">{{ pathLabel(t.pathId) || '경로 선택...' }}</span><button type="button" @click="openPathPick(t)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button></div></td>
          <td>{{ t.templateId }}</td>
          <td><span class="badge" :class="fnTypeBadge(t.templateTypeCd)">{{ t.templateTypeCd }}</span></td>
          <td><code style="font-size:11px;color:#555;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ t.templateCode || '-' }}</code></td>
          <td><span class="title-link" @click="handleLoadDetail(t.templateId)" :style="selectedId===t.templateId?'color:#e8587a;font-weight:700;':''">{{ t.templateNm }}<span v-if="selectedId===t.templateId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="font-size:12px;color:#555;">{{ t.subject || '-' }}</td>
          <td><span class="badge" :class="fnUseYnBadge(t.useYn)">{{ t.useYn === 'Y' ? '사용' : '미사용' }}</span></td>
          <td>{{ t.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-secondary btn-sm" @click="showPreview(t)">미리보기</button>
            <button class="btn btn-sm" style="background:#52c41a;color:#fff;border-color:#52c41a;" @click="openSend(t)">발송</button>
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(t.templateId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(t)">삭제</button>
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
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-template-dtl :key="cfDetailKey" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>

  <!-- 미리보기 모달 -->
  <template-preview-modal v-if="previewModal && previewModal.show"
    :tmpl="previewModal.template"
    :sample-params="previewModal.template?.sampleParams || '{}'"
    @close="closePreview" />

  <!-- 발송하기 모달 -->
  <template-send-modal v-if="sendModal && sendModal.show"
    :tmpl="sendModal.template" :show-toast="showToast" :show-confirm="showConfirm"
    @close="closeSend" />
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_template"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

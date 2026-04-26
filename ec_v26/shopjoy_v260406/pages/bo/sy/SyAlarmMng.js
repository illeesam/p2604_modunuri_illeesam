/* ShopJoy Admin - 알림관리 */
window.SyAlarmMng = {
  name: 'SyAlarmMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const alarms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null});
    const codes = reactive({ alarm_type: [], alarm_status: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/alarm/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        alarms.splice(0, alarms.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyAlarm 로드 실패', 'error');
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
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_alarm'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
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
        codes.alarm_type = await codeStore.snGetGrpCodes('ALARM_TYPE') || [];
        codes.alarm_status = await codeStore.snGetGrpCodes('ALARM_STATUS') || [];
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

    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const searchParam = reactive({
      kw: '', type: '', status: '', dateRange: '', dateStart: '', dateEnd: ''
    });
    const searchParamOrg = reactive({
      kw: '', type: '', status: '', dateRange: '', dateStart: '', dateEnd: ''
    });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = window.boCmUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.page = 1;
    };
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
      if (pg === 'syAlarmMng') { detailModal.show = false; detailModal.editId = null; return; }
      if (pg === '__switchToEdit__') { detailModal.viewMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.editId === '__new__' ? null : detailModal.editId);
    const cfIsViewMode = computed(() => detailModal.viewMode === 'view' && detailModal.editId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.editId}_${detailModal.viewMode}`);

    const cfFiltered = computed(() => {
      const items = alarms || [];
      if (!Array.isArray(items)) return [];
      return items.filter(a => {
        const kw = searchParam.kw.trim().toLowerCase();
        if (kw && !a.title.toLowerCase().includes(kw) && !a.message.toLowerCase().includes(kw)) return false;
        if (searchParam.type && a.alarmTypeCd !== searchParam.type) return false;
        if (searchParam.status && a.statusCd !== searchParam.status) return false;
        const d = String(a.sendDate || a.regDate || '').slice(0, 10);
        if (searchParam.dateStart && d < searchParam.dateStart) return false;
        if (searchParam.dateEnd && d > searchParam.dateEnd) return false;
        return true;
      });
    });
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const fnStatusBadge = s => ({ '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' }[s] || 'badge-gray');
    const fnTypeBadge = t => ({ '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' }[t] || 'badge-gray');
    const fnTargetBadge = t => ({ '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' }[t] || 'badge-gray');
    const onSearch = async () => {
      pager.page = 1;
      await handleFetchData();
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const handleDelete = async (a) => {
      const ok = await props.showConfirm('삭제', `[${a.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = alarms.findIndex(x => x.alarmId === a.alarmId);
      if (idx !== -1) alarms.splice(idx, 1);
      if (detailModal.editId === a.alarmId) { detailModal.show = false; detailModal.editId = null; }
      try {
        const res = await window.boApi.delete(`/bo/sy/alarm/${a.alarmId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'alarmId'},{label:'유형',key:'alarmTypeCd'},{label:'채널',key:'channelCd'},{label:'내용',key:'content'},{label:'상태',key:'statusCd'},{label:'발송일',key:'sendDate'}], '알림목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */
    watch(() => uiState.selectedPath, () => { if (typeof loadGrid === 'function') loadGrid(); });


    return { alarms, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree, cfSiteNm, searchParam, DATE_RANGE_OPTIONS, handleDateRangeChange, pager, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, fnStatusBadge, fnTypeBadge, fnTargetBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">알림관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="제목 / 메시지 검색" />
      <select v-model="searchParam.type"><option value="">유형 전체</option><option>푸시</option><option>이메일</option><option>SMS</option><option>인앱</option></select>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>발송완료</option><option>예약</option><option>실패</option><option>임시</option></select>
      <span class="search-label">발송일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
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
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>알림목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="min-width:140px;">표시경로</th><th>ID</th><th>유형</th><th>제목</th><th>메시지</th><th>대상</th><th>발송일</th><th>상태</th><th>사이트명</th><th>등록일</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="a in cfPageList" :key="a.alarmId" :style="detailModal.editId===a.alarmId?'background:#fff8f9;':''">
          <td><div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:a.pathId!=null?'#374151':'#9ca3af',fontWeight:a.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}"><span style="flex:1;">{{ pathLabel(a.pathId) || '경로 선택...' }}</span><button type="button" @click="openPathPick(a)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button></div></td>
          <td>{{ a.alarmId }}</td>
          <td><span class="badge" :class="fnTypeBadge(a.alarmTypeCd)">{{ a.alarmTypeCd }}</span></td>
          <td><span class="title-link" @click="handleLoadDetail(a.alarmId)" :style="detailModal.editId===a.alarmId?'color:#e8587a;font-weight:700;':''">{{ a.title }}<span v-if="detailModal.editId===a.alarmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ a.message }}</td>
          <td><span class="badge" :class="fnTargetBadge(a.targetTypeCd)">{{ a.targetTypeCd }}</span></td>
          <td>{{ a.sendDate || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(a.statusCd)">{{ a.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td>{{ a.regDate }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(a.alarmId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(a)">삭제</button>
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
    <sy-alarm-dtl :key="detailModal.editId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="cfDetailEditId" />
  </div>
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_alarm"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

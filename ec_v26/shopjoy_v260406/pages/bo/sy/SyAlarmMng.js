/* ShopJoy Admin - 알림관리 */
window.SyAlarmMng = {
  name: 'SyAlarmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const alarms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ alarm_type: [], alarm_status: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAlarm.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...getSortParam(),
            ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '알람관리', '목록조회');
        const data = res.data?.data;
        alarms.splice(0, alarms.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || alarms.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* -- 표시경로 선택 모달 (sy_path) -- */
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
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };


    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.alarm_type = codeStore.sgGetGrpCodes('ALARM_TYPE');
      codes.alarm_status = codeStore.sgGetGrpCodes('ALARM_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { kw: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view' // 'view' | 'edit'
    });

    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; };
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; };
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; };
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syAlarmMng') { detailModal.show = false; detailModal.dtlId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const fnStatusBadge = s => ({ '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' }[s] || 'badge-gray');
    const fnTypeBadge = t => ({ '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' }[t] || 'badge-gray');
    const fnTargetBadge = t => ({ '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' }[t] || 'badge-gray');
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const handleDelete = async (a) => {
      const ok = await showConfirm('삭제', `[${a.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = alarms.findIndex(x => x.alarmId === a.alarmId);
      if (idx !== -1) alarms.splice(idx, 1);
      if (detailModal.dtlId === a.alarmId) { detailModal.show = false; detailModal.dtlId = null; }
      try {
        const res = await boApiSvc.syAlarm.remove(a.alarmId, '알람관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };
    const exportExcel = () => boUtil.exportCsv(alarms, [{label:'ID',key:'alarmId'},{label:'유형',key:'alarmTypeCd'},{label:'채널',key:'channelCd'},{label:'내용',key:'content'},{label:'상태',key:'statusCd'},{label:'발송일',key:'sendDate'}], '알림목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */



    // -- return ---------------------------------------------------------------

    return { alarms, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode, codes, cfSiteNm, searchParam, handleDateRangeChange, pager, fnStatusBadge, fnTypeBadge, fnTargetBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">알림관리</div>  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="제목 / 메시지 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="c in codes.alarm_type" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.alarm_status" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">발송일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  



  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_alarm</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="sy_alarm" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>알림목록 <span class="list-count">{{ pager.pageTotalCount }}건</span><span v-if="uiState.selectedPath != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedPath }}</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th style="min-width:140px;">표시경로</th><th>유형</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">제목 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>메시지</th><th>대상</th><th>발송일</th><th>상태</th><th>사이트명</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="alarms.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(a, idx) in alarms" :key="a.alarmId" :style="detailModal.dtlId===a.alarmId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:a.pathId!=null?'#374151':'#9ca3af',fontWeight:a.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}"><span style="flex:1;">{{ pathLabel(a.pathId) || '경로 선택...' }}</span><button type="button" @click="openPathPick(a)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button></div></td>
          <td><span class="badge" :class="fnTypeBadge(a.alarmTypeCd)">{{ a.alarmTypeCd }}</span></td>
          <td><span class="title-link" @click="handleLoadDetail(a.alarmId)" :style="detailModal.dtlId===a.alarmId?'color:#e8587a;font-weight:700;':''">{{ a.title }}<span v-if="detailModal.dtlId===a.alarmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
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
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>

  <!-- -- 수정 패널 (grid 직접 자식 → 전체 폭) --------------------------------- -->
  <div v-if="detailModal.show" style="grid-column:1/-1;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-alarm-dtl :key="detailModal.dtlId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'" 
      :on-list-reload="handleSearchList"
    />
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_alarm"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

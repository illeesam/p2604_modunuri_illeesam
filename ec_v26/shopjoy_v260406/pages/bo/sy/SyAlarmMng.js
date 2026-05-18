/* ShopJoy Admin - 알림관리 */
window.SyAlarmMng = {
  name: 'SyAlarmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const alarms = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ alarm_type: [], alarm_status: [], date_range_opts: [] });

    const SORT_MAP = { nm: { asc: 'alarmTitle asc', desc: 'alarmTitle desc' }, reg: { asc: 'alarmSendDate asc', desc: 'alarmSendDate desc' } };

    /* 알람 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 알람 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 알람 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'alarmTitle,alarmMsg';
        }
        const res = await boApiSvc.syAlarm.getPage(params, '알람관리', '목록조회');
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

    /* 알람 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 알람 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 알람 onPathPicked */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };

    /* 알람 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; pager.pageNo = 1; handleSearchList(); };


    /* 알람 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.alarm_type = codeStore.sgGetGrpCodes('ALARM_TYPE');
      codes.alarm_status = codeStore.sgGetGrpCodes('ALARM_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* 알람 _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', type: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* 알람 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view', // 'view' | 'edit'
      reloadTrigger: 0 // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* 알람 loadView */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 알람 상세조회 */
    const handleLoadDetail = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; } detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 알람 openNew */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* 알람 closeDetail */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* 알람 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syAlarmMng') { detailModal.show = false; detailModal.dtlId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    /* 알람 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 알람 fnStatusBadge */
    const _ALARM_STATUS_FB = { '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('ALARM_STATUS', s, _ALARM_STATUS_FB[s] || 'badge-gray');

    /* 알람 fnTypeBadge */
    const _ALARM_TYPE_FB = { '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('ALARM_TYPE', t, _ALARM_TYPE_FB[t] || 'badge-gray');

    /* 알람 fnTargetBadge */
    const _ALARM_TARGET_TYPE_FB = { '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' };
    const fnTargetBadge = t => coUtil.cofCodeBadge('ALARM_TARGET_TYPE', t, _ALARM_TARGET_TYPE_FB[t] || 'badge-gray');

    /* 알람 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 알람 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 알람 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 알람 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 알람 삭제 */
    const handleDelete = async (a) => {
      const ok = await showConfirm('삭제', `[${a.alarmTitle}]을 삭제하시겠습니까?`);
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

    /* 알람 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(alarms, [{label:'ID',key:'alarmId'},{label:'유형',key:'alarmTypeCd'},{label:'채널',key:'channelCd'},{label:'제목',key:'alarmTitle'},{label:'메시지',key:'alarmMsg'},{label:'상태',key:'alarmStatusCd'},{label:'발송일',key:'alarmSendDate'}], '알림목록.csv');
    /* 트리 path 변경 시 자동 reload (loadGrid 있으면 호출) */

    /* BoGridReadonly 컬럼 정의 (특수셀은 #cell-* 슬롯으로 override) */
    const gridColumns = [
      { key: 'pathId',        label: '표시경로' },
      { key: 'alarmTypeCd',   label: '유형' },
      { key: 'alarmTitle',    label: '제목', sortKey: 'nm' },
      { key: 'alarmMsg',      label: '메시지' },
      { key: 'targetTypeCd',  label: '대상' },
      { key: 'alarmSendDate', label: '발송일' },
      { key: 'alarmStatusCd', label: '상태' },
      { key: 'siteNm',        label: '사이트명' },
      { key: 'regDate',       label: '등록일', sortKey: 'reg' },
    ];
    const fnRowStyle = (a) => detailModal.dtlId === a.alarmId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    // -- return ---------------------------------------------------------------

    return { alarms, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode, codes, cfSiteNm, searchParam, handleDateRangeChange, pager, fnStatusBadge, fnTypeBadge, fnTargetBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, detailModal, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon, gridColumns, fnRowStyle };
  },
  template: /* html */`
<div>
  <div class="page-title">알림관리</div>  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'alarmTitle', label: '제목' },
          { value: 'alarmMsg',   label: '메시지' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
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
    </bo-search-area>
  </div>
  



  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_alarm" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <div>
  <bo-grid-readonly
    :columns="gridColumns" :rows="alarms" :pager="pager" row-key="alarmId"
    list-title="알림목록" :count-text="pager.pageTotalCount + '건'"
    :sort-state="uiState" :row-style="fnRowStyle"
    @sort="onSort" @set-page="setPage" @size-change="onSizeChange">

    <template #toolbar-actions>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </template>
    <template #head-actions><th style="text-align:right">관리</th></template>

    <template #cell-pathId="{ row }">
      <td><div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:row.pathId!=null?'#374151':'#9ca3af',fontWeight:row.pathId!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}"><span style="flex:1;">{{ pathLabel(row.pathId) || '경로 선택...' }}</span><button type="button" @click="openPathPick(row)" title="표시경로 선택" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}" @mouseover="$event.currentTarget.style.background='#eef2ff'" @mouseout="$event.currentTarget.style.background='#fff'">🔍</button></div></td>
    </template>
    <template #cell-alarmTypeCd="{ row }">
      <td><span class="badge" :class="fnTypeBadge(row.alarmTypeCd)">{{ row.alarmTypeCd }}</span></td>
    </template>
    <template #cell-alarmTitle="{ row }">
      <td><span class="title-link" @click="handleLoadDetail(row.alarmId)" :style="detailModal.dtlId===row.alarmId?'color:#e8587a;font-weight:700;':''">{{ row.alarmTitle }}<span v-if="detailModal.dtlId===row.alarmId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
    </template>
    <template #cell-alarmMsg="{ row }">
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ row.alarmMsg }}</td>
    </template>
    <template #cell-targetTypeCd="{ row }">
      <td><span class="badge" :class="fnTargetBadge(row.targetTypeCd)">{{ row.targetTypeCd }}</span></td>
    </template>
    <template #cell-alarmSendDate="{ row }">
      <td>{{ row.alarmSendDate || '-' }}</td>
    </template>
    <template #cell-alarmStatusCd="{ row }">
      <td><span class="badge" :class="fnStatusBadge(row.alarmStatusCd)">{{ row.alarmStatusCd }}</span></td>
    </template>
    <template #cell-siteNm>
      <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
    </template>
    <template #cell-regDate="{ row }">
      <td>{{ row.regDate }}</td>
    </template>
    <template #row-actions="{ row }">
      <td><div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.alarmId)">수정</button>
        <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
      </div></td>
    </template>
  </bo-grid-readonly>
</div>

  <!-- -- 수정 패널 (grid 직접 자식 → 전체 폭) --------------------------------- -->
  <div v-if="detailModal.show" style="grid-column:1/-1;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-alarm-dtl :key="detailModal.dtlId" :navigate="inlineNavigate" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'" 
      
      :reload-trigger="detailModal.reloadTrigger"
      :on-list-reload="handleSearchList"
    />
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_alarm"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`
};

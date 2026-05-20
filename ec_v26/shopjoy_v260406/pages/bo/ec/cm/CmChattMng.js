/* ShopJoy Admin - 채팅관리 목록 + 하단 ChattDtl 임베드 */
window.CmChattMng = {
  name: 'CmChattMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const chatts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ chatt_message_types: [], chatt_statuses: [], date_range_opts: [] });

    /* handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.chatt_message_types = codeStore.sgGetGrpCodes('CHATT_MESSAGE_TYPE');
      codes.chatt_statuses = codeStore.sgGetGrpCodes('CHATT_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,subject';
        }
        const res = await boApiSvc.cmChatt.getPage(params, '채팅관리', '목록조회');
        const data = res.data?.data;
        chatts.splice(0, chatts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'cmChattMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnStatusBadge */
    const _CHATT_STATUS_FB = { '진행중': 'badge-green', '종료': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('CHATT_STATUS', s, _CHATT_STATUS_FB[s] || 'badge-gray');

    /* 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.subject}] 채팅을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = chatts.findIndex(x => x.chattRoomId === c.chattRoomId);
      if (idx !== -1) chatts.splice(idx, 1);
      if (uiStateDetail.selectedId === c.chattRoomId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.cmChatt.remove(c.chattRoomId, '채팅관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(chatts, [{label:'채팅ID',key:'chattRoomId'},{label:'회원명',key:'memberNm'},{label:'상태',key:'chattStatusCd'},{label:'마지막메시지일시',key:'lastMsgDate'},{label:'등록일',key:'regDate'}], '채팅목록.csv');

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'reg' 와 sortKey 일치) */
    const listColumns = [
      { key: 'memberNm',    label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'subject',     label: '제목', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'lastMsgDate', label: '마지막 메시지',
        cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888',
        fmt: (v) => v || '-' },
      { key: 'msgCnt',      label: '메시지수',  style: 'width:80px;',
        fmt: (v, row) => (row.adminUnreadCnt || 0) + (row.memberUnreadCnt || 0) + '개' },
      { key: 'unread',      label: '미읽음',    style: 'width:80px;',
        badge: (row) => row.memberUnreadCnt > 0 ? 'badge-red' : 'badge-gray',
        fmt: (v, row) => row.memberUnreadCnt > 0 ? row.memberUnreadCnt : 0 },
      { key: 'chattStatusCd', label: '상태',    style: 'width:90px;',
        badge: (row) => fnStatusBadge(row.chattStatusCd) },
      { key: 'regDate',     label: '일시',      style: 'width:140px;', sortKey: 'reg' },
      { key: 'siteNm',      label: '사이트명',  style: 'width:110px;', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];
    const fnGridRowClass = (row) => (uiStateDetail.selectedId === row.chattRoomId ? 'active' : '');

    // -- return ---------------------------------------------------------------

    return {
      chatts, uiState, codes, searchParam,
      handleDateRangeChange, cfSiteNm,
      pager, fnStatusBadge,
      onSearch, onReset, setPage, onSizeChange, handleDelete,
      uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId),
      cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail,
      inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      showRefModal, listColumns, fnGridRowClass,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">채팅관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'memberNm', label: '회원명' },
          { value: 'subject',  label: '제목' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.chatt_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
    </bo-search-area>
  </div>
  <bo-grid :columns="listColumns" :rows="chatts" :pager="pager" row-key="chattRoomId"
    :sort-state="uiState" list-title="채팅목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="onSort" @set-page="setPage" @size-change="onSizeChange"
    @ref-click="({type,id}) => showRefModal(type, id)" @row-click="row => handleLoadDetail(row.chattRoomId)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </template>
      <template #row-actions="{ row }">
        <div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.chattRoomId)">보기</button>
        <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
      </div>
      </template>
  </bo-grid>

  <!-- -- 하단 상세: ChattDtl 임베드 -------------------------------------------- -->
  <div v-if="uiStateDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <cm-chatt-dtl
      :key="uiStateDetail.selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
  />
  </div>
</div>
`
};

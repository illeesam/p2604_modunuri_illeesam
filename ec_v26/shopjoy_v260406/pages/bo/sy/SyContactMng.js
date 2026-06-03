/* ShopJoy Admin - 문의관리 목록 + 하단 ContactDtl 임베드 */
window.SyContactMng = {
  name: 'SyContactMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const contacts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ contact_status: [], contact_categories: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyContactMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 문의 신규 등록 (인라인 패널)
      } else if (cmd === 'contacts-add') {
        return openNew();
      // 문의 목록 엑셀 내보내기
      } else if (cmd === 'contacts-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'contacts-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'contacts-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyContactMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'contacts-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세 보기/편집 토글
      } else if (cmd === 'contacts-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'contacts-rowDelete') {
        return handleDelete(param);
      // 참조 모달 열기 (회원 등)
      } else if (cmd === 'contacts-rowRef') {
        return showRefModal(param.type, param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', category: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({   // 인라인 Dtl 패널 상태 (modal_reload_trigger 표준)
      show: true,                    // 상세영역 항상 표시 (진입 시 빈 신규 폼)
      dtlId: '__new__',              // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      dtlMode: 'edit',               // 'view' | 'edit'
      reloadTrigger: 0,              // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }

      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'contactTitle,memberNm';
        }
        const res = await boApiSvc.syContact.getPage(params, '문의관리', '목록조회');
        const data = res.data?.data;
        contacts.splice(0, contacts.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || contacts.length;
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

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.contact_status = codeStore.sgGetGrpCodes('CONTACT_STATUS');
      codes.contact_categories = codeStore.sgGetGrpCodes('CONTACT_CATEGORY_KR');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    /* loadView — 뷰 로드 */
    const loadView = (id) => { if (detailModal.dtlId === id && detailModal.dtlMode === 'view' && detailModal.active) { resetDetailToNew(); return; } detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.active = true; detailModal.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = false;    // 버튼 숨김
      detailModal.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (재클릭 시 신규 폼으로 초기화) */
    const handleLoadDetail = (id) => {
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.active = true;     // 행 선택 → 저장/취소 노출
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailModal.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syContactMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 문의 fnStatusBadge */
    const _CONTACT_STATUS_KR_FB = { '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('CONTACT_STATUS_KR', s, _CONTACT_STATUS_KR_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.contactTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = contacts.findIndex(x => x.contactId === c.contactId);
      if (idx !== -1) { contacts.splice(idx, 1); }
      if (detailModal.dtlId === c.contactId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.syContact.remove(c.contactId, '문의관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(contacts, [{label:'ID',key:'contactId'},{label:'회원명',key:'memberNm'},{label:'분류',key:'categoryCd'},{label:'제목',key:'contactTitle'},{label:'상태',key:'contactStatusCd'},{label:'등록일',key:'contactDate'}], '문의목록.csv');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'contactTitle', label: '제목' },
          { value: 'memberNm',     label: '회원명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'category', type: 'select', label: '카테고리', options: () => codes.contact_categories, nullLabel: '카테고리 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.contact_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'memberNm',        label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'categoryCd',      label: '카테고리', cellInnerClass: 'tag' },
      { key: 'contactTitle',    label: '제목', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'contactStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.contactStatusCd) },
      { key: 'regDate',         label: '등록일', sortKey: 'reg', fmt: (v, row) => String(row.regDate || row.contactDate || '').slice(0, 10) },
      { key: 'siteNm',          label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];
    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (c) => detailModal.dtlId === c.contactId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      contacts, uiState, codes, searchParam, pager, detailModal,         // 상태 / 데이터
      handleBtnAction, handleSelectAction,                               // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,               // computed
      fnStatusBadge, fnRowStyle, sortIcon, showToast, showConfirm, setApiRes, showRefModal, inlineNavigate, handleSearchList, // 헬퍼 / closure
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    문의관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid
    :columns="columns.baseGrid" :rows="contacts" row-key="contactId" :selected-key="detailModal.dtlId"
    list-title="문의목록" :count-text="pager.pageTotalCount + '건'"
    :sort-state="uiState" :row-style="fnRowStyle"
    @sort="key => handleBtnAction('contacts-sort', key)"
    @ref-click="({type,id}) => handleSelectAction('contacts-rowRef', {type, id})"
    @cell-click="e => handleSelectAction('contacts-rowEdit', e.row.contactId)">
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="handleBtnAction('contacts-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('contacts-add')">
          + 신규
        </button>
      </div>
    </template>
    <template #head-actions>
      <th style="text-align:right">
        관리
      </th>
    </template>
    <template #row-actions="{ row }">
      <td style="white-space:nowrap;">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('contacts-rowEdit', row.contactId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('contacts-rowDelete', row)">
            삭제
          </button>
        </div>
      </td>
    </template>
    <!-- 페이저를 그리드 카드 내부 하단(#footer)에 배치 → 목록 영역 안에 보이도록 -->
    <template #footer>
      <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('contacts-pager-setPage', n)" :on-size-change="() => handleSelectAction('contacts-pager-sizeChange')" />
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: ContactDtl 임베드 (항상 표시) =========================== -->
  <div>
    <div v-if="detailModal.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <sy-contact-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailModal.active"
      :reload-trigger="detailModal.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
  </div>
</div>
<!-- ===== □. 하단 상세: ContactDtl 임베드 =================================== -->
`
};

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
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ contact_status: [], contact_categories: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', category: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — pager + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* 상세 인라인 패널 — detailModal 명명 유지 (자식 dtl 의 prop 구조와 일치) */
    const detailModal = reactive({
      show: false,
      dtlId: null,
      dtlMode: 'view', // 'view' | 'edit'
      reloadTrigger: 0 // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'searchParam-list')  { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); return handleSearchList(); }
      if (cmd === 'searchParam-dateRange') return handleDateRangeChange();
      if (cmd === 'contacts-add')      return openNew();
      if (cmd === 'contacts-excel')    return exportExcel();
      if (cmd === 'baseDetail-close')  return closeDetail();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'contacts-sort')             return baseGrid.onSort(param);
      if (cmd === 'contacts-pager-setPage')    return baseGrid.setPage(param);
      if (cmd === 'contacts-pager-sizeChange') return baseGrid.onSizeChange();
      if (cmd === 'contacts-rowEdit')          return handleLoadDetail(param);
      if (cmd === 'contacts-rowDelete')        return handleDelete(param);
      if (cmd === 'contacts-rowRef')           return showRefModal(param.type, param.id);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.contact_status = codeStore.sgGetGrpCodes('CONTACT_STATUS');
      codes.contact_categories = codeStore.sgGetGrpCodes('CONTACT_CATEGORY_KR');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) params.searchType = 'contactTitle,memberNm';
        const d = (await boApiSvc.syContact.getPage(params, '문의관리', '목록조회')).data?.data;
        const list = baseGrid.applyPage(d);
        contacts.splice(0, contacts.length, ...list);
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
      baseGrid.pager.pageNo = 1;
    };

    /* loadView — 뷰 모드 열기 */
    const loadView = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'view') { detailModal.show = false; detailModal.dtlId = null; return; }
      detailModal.dtlId = id; detailModal.dtlMode = 'view'; detailModal.show = true; detailModal.reloadTrigger++;
    };

    /* handleLoadDetail — 편집 모드 열기 */
    const handleLoadDetail = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'edit') { detailModal.show = false; detailModal.dtlId = null; return; }
      detailModal.dtlId = id; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 */
    const openNew = () => { detailModal.dtlId = '__new__'; detailModal.dtlMode = 'edit'; detailModal.show = true; detailModal.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syContactMng')     { detailModal.show = false; detailModal.dtlId = null; if (opts.reload) handleSearchList(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      if (!(await showConfirm('삭제', `[${c.contactTitle}]을 삭제하시겠습니까?`))) return;
      try {
        const res = await boApiSvc.syContact.remove(c.contactId, '문의관리', '삭제');
        setApiRes({ ok: true, status: res.status, data: res.data });
        showToast('삭제되었습니다.', 'success');
        if (detailModal.dtlId === c.contactId) { detailModal.show = false; detailModal.dtlId = null; }
        await handleSearchList();
      } catch (err) {
        setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(contacts,
      [{label:'ID',key:'contactId'},{label:'회원명',key:'memberNm'},{label:'분류',key:'categoryCd'},
       {label:'제목',key:'contactTitle'},{label:'상태',key:'contactStatusCd'},{label:'등록일',key:'contactDate'}],
      '문의목록.csv');

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const cfSiteNm       = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode   = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey    = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}`);

    const _CONTACT_STATUS_KR_FB = { '요청': 'badge-orange', '처리중': 'badge-blue', '답변완료': 'badge-green', '취소됨': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('CONTACT_STATUS_KR', s, _CONTACT_STATUS_KR_FB[s] || 'badge-gray');

    /* fnRowStyle — 행 스타일 */
    const fnRowStyle = (c) => detailModal.dtlId === c.contactId ? 'background:#fff8f9;cursor:pointer;' : 'cursor:pointer;';

    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'contactTitle', label: '제목' },
          { value: 'memberNm',     label: '회원명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'category', type: 'select', label: '카테고리', options: () => codes.contact_categories, nullLabel: '카테고리 전체' },
      { key: 'status',   type: 'select', label: '상태', options: () => codes.contact_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    const baseGridColumns = [
      { key: 'memberNm',        label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'categoryCd',      label: '카테고리', cellInnerClass: 'tag' },
      { key: 'contactTitle',    label: '제목', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'contactStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.contactStatusCd) },
      { key: 'regDate',         label: '등록일', sortKey: 'reg', fmt: (v, row) => String(row.regDate || row.contactDate || '').slice(0, 10) },
      { key: 'siteNm',          label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      contacts, uiState, codes, searchParam, baseGrid, detailModal,
      baseSearchColumns, baseGridColumns,
      handleBtnAction, handleSelectAction,
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,
      fnStatusBadge, fnRowStyle,
      showToast, showConfirm, setApiRes, showRefModal, inlineNavigate, handleSearchList,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    문의관리
  </div>
  <!-- ===== ■. 검색 영역 =================================================== -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="baseGridColumns" :rows="contacts" :pager="baseGrid.pager" row-key="contactId"
    list-title="문의목록" :count-text="baseGrid.pager.pageTotalCount + '건'"
    :sort-state="baseGrid" :row-style="fnRowStyle"
    @sort="key => handleSelectAction('contacts-sort', key)"
    @set-page="n => handleSelectAction('contacts-pager-setPage', n)"
    @size-change="handleSelectAction('contacts-pager-sizeChange')"
    @ref-click="({type,id}) => handleSelectAction('contacts-rowRef', {type, id})"
    @row-click="row => handleSelectAction('contacts-rowEdit', row.contactId)">
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="handleBtnAction('contacts-excel')">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('contacts-add')">+ 신규</button>
      </div>
    </template>
    <template #head-actions>
      <th style="text-align:right">관리</th>
    </template>
    <template #row-actions="{ row }">
      <td>
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('contacts-rowEdit', row.contactId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('contacts-rowDelete', row)">삭제</button>
        </div>
      </td>
    </template>
  </bo-grid>
  <!-- ===== ■. 하단 상세: ContactDtl 임베드 =================================== -->
  <div v-if="detailModal.show" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">✕ 닫기</button>
    </div>
    <sy-contact-dtl :key="detailModal.dtlId" :navigate="inlineNavigate"
      :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailModal.reloadTrigger"
      :on-list-reload="handleSearchList" />
  </div>
</div>
`
};

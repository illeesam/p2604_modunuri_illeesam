/* ShopJoy Admin - FAQ관리 */
window.CmFaqMng = {
  name: 'CmFaqMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const faqs = reactive([]);                     // FAQ 목록 (메인 그리드 데이터)
    const faqCounts = reactive({});                 // 좌 트리 노드별 카운트
    const uiState = reactive({
      loading: false, error: null, isPageCodeLoad: false, selectedPath: null,
    });
    const codes = reactive({ use_yn: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명') */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmFaqMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.selectedPath = null;
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      } else if (cmd === 'faqs-add') {
        return openNew();
      } else if (cmd === 'faqs-excel') {
        return exportExcel();
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      } else if (cmd === 'faqs-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmFaqMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'faqs-pager-sizeChange') {
        return onSizeChange();
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ CmFaqMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'faqs-cellClick') {
        if (colKey === 'btn_row_edit')   { return handleLoadDetail(row.faqId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.faqId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', useYn: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({
      show: true, dtlId: '__new__', dtlMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false,
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'faqQuestion,faqAnswer';
        }
        const res = await boApiSvc.cmFaq.getPage(params, 'FAQ관리', '목록조회');
        const data = res.data?.data;
        faqs.splice(0, faqs.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || faqs.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
      handleLoadPathCounts();
    };

    /* handleLoadPathCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE / 자손 누적) */
    const handleLoadPathCounts = async () => {
      try {
        /* 카운트는 선택 노드와 무관하게 전체 트리용 — pathId 제외, 검색조건(useYn/검색어)만 반영 */
        const params = { ...coUtil.cofOmitEmpty(searchParam) };
        delete params.pathId;
        const res = await boApiSvc.cmFaq.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];
        Object.keys(faqCounts).forEach(k => { delete faqCounts[k]; });
        for (const r of rows) { if (r && r.pathId != null) faqCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathCounts]', e); }
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 (토글) */
    const loadView = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'view') {
        resetDetailToNew(); return;
      }
      detailModal.dtlId = id;
      detailModal.dtlMode = 'view';
      detailModal.show = true;
      detailModal.active = true;
      detailModal.reloadTrigger++;
    };

    /* resetDetailToNew — 상세영역 빈 신규 폼(비활성)으로 초기화 */
    const resetDetailToNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = false;
      detailModal.resetSeq++;
    };

    /* handleLoadDetail — 그리드 행 수정 */
    const handleLoadDetail = (id) => {
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.active = true;
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 */
    const openNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = true;
      detailModal.resetSeq++;
    };

    /* closeDetail */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'cmFaqMng') {
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete */
    const handleDelete = async (f) => {
      const ok = await showConfirm('삭제', `[${f.faqQuestion}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApiSvc.cmFaq.remove(f.faqId, 'FAQ관리', '삭제');
        const idx = faqs.findIndex(x => x.faqId === f.faqId);
        if (idx !== -1) { faqs.splice(idx, 1); }
        if (detailModal.dtlId === f.faqId) { resetDetailToNew(); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(faqs, [
      { label: 'ID', key: 'faqId' }, { label: '분류', key: 'pathLabel' },
      { label: '질문', key: 'faqQuestion' }, { label: '노출여부', key: 'useYn' },
      { label: '등록일', key: 'regDate' },
    ], 'FAQ목록.csv');

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnYnBadge */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnRowStyle */
    const fnRowStyle = (f) => detailModal.dtlId === f.faqId ? 'background:#fff8f9;' : '';

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'faqQuestion', label: '질문' },
          { value: 'faqAnswer',   label: '답변' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', label: '노출여부', options: () => codes.use_yn, nullLabel: '노출여부 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',      label: '분류(표시경로)', style: 'width:180px;max-width:180px;', pathPick: 'cm_faq' },
      { key: 'faqQuestion', label: '질문', link: true,
        cellInnerStyle: (v, row) => detailModal.dtlId === row.faqId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'faqAnswer',   label: '답변', cellStyle: 'color:#666;font-size:12px;',
        fmt: (v) => v ? (v.length > 40 ? v.slice(0, 40) + '…' : v) : '-' },
      { key: 'sortOrd',     label: '정렬순서', align: 'center' },
      { key: 'viewCount',   label: '조회수', align: 'center', fmt: (v) => v || 0 },
      { key: 'useYn',       label: '노출여부', badge: (row) => fnYnBadge(row.useYn), fmt: (v) => v === 'Y' ? '노출' : '숨김' },
      { key: 'siteNm',      label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',     label: '등록일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      faqs, uiState, faqCounts, searchParam, baseGridPager, detailModal,
      handleBtnAction, handleSelectAction, handleGridCellAction,
      cfDetailEditId, cfIsViewMode, cfDetailKey,
      fnRowStyle,
      inlineNavigate, showToast, showConfirm, handleSearchList,
    };
  },
  template: /* html */`
<bo-page title="FAQ관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 본문 영역 (트리 + 목록) ===================================== -->
  <div class="bo-2col">
    <!-- ===== ■.■. 좌: 표시경로 트리 ============================================ -->
    <bo-container bare>
      <bo-path-tree-card biz-cd="cm_faq" title="FAQ 분류" :show-biz-cd="false" :counts="faqCounts"
        :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■. 우: 목록 ================================================== -->
    <bo-container title="FAQ목록" :count-text="baseGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <button class="btn btn_excel" @click="handleBtnAction('faqs-excel')">
          📥 엑셀
        </button>
        <button class="btn btn_new" @click="handleBtnAction('faqs-add')">
          + 신규
        </button>
      </template>
      <bo-grid bare
        :columns="columns.baseGrid" :rows="faqs" row-key="faqId" :selected-key="detailModal.dtlId"
        :row-style="fnRowStyle"
        grid-id="faqs-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row, gridId }">
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">
                수정
              </button>
              <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
      <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('faqs-pager-setPage', n)" :on-size-change="() => handleSelectAction('faqs-pager-sizeChange')" />
    </bo-container>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 인라인 패널 (전체 폭, 항상 표시) ============================ -->
  <cm-faq-dtl :key="cfDetailKey" :navigate="inlineNavigate" :dtl-id="cfDetailEditId" :tab-mode="cfIsViewMode"
    :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailModal.active"
    :reload-trigger="detailModal.reloadTrigger"
  />
  <!-- ===== □. 상세 인라인 패널 ============================================= -->
</bo-page>
`,
};

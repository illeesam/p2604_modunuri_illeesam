/* ShopJoy Admin - 전시UI관리 (dp_ui)
 * 계층: dp_ui ─< dp_area(ui_id) ─< dp_panel(area_id) — 2026-06-11 구조개선 재작성
 * 표준: CmNoticeMng 참조 모델 (bo-search-area / bo-grid / 인라인 Dtl 직접렌더)
 */
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const uis = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ device_types: [], use_yn: [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] });

    const _initSearchParam = () => ({ searchValue: '', deviceTypeCd: '', useYn: '' });
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — pager + 정렬 캡슐 (수동) */
    const _sortMap = { nm: { asc: 'uiNm asc', desc: 'uiNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    const baseGrid = reactive({
      pager: { pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
               pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageNums: [], pageCond: {} },
      sortKey: '', sortDir: 'asc',
      sortIcon: (k) => baseGrid.sortKey !== k ? '⇅' : baseGrid.sortDir === 'asc' ? '↑' : '↓',
      sortParam: () => { const m = _sortMap[baseGrid.sortKey]; return m ? { sort: m[baseGrid.sortDir] } : {}; },
      onSort: (k) => {
        if (baseGrid.sortKey === k) {
          if (baseGrid.sortDir === 'asc') baseGrid.sortDir = 'desc';
          else { baseGrid.sortKey = ''; baseGrid.sortDir = 'asc'; }
        } else { baseGrid.sortKey = k; baseGrid.sortDir = 'asc'; }
        baseGrid.pager.pageNo = 1;
        handleSearchList();
      },
      setPage: (n) => { if (n >= 1 && n <= baseGrid.pager.pageTotalPage) { baseGrid.pager.pageNo = n; handleSearchList(); } },
      onSizeChange: () => { baseGrid.pager.pageNo = 1; handleSearchList(); },
      reset: () => { baseGrid.sortKey = ''; baseGrid.sortDir = 'asc'; baseGrid.pager.pageNo = 1; },
      applyPage: (d) => {
        d = d || {};
        baseGrid.pager.pageTotalCount = d.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage  = d.pageTotalPage  || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGrid.pager);
        return d.pageList || [];
      },
    });

    /* baseDetail — 인라인 Dtl 패널 (coUtil.cofDetail, 항상 표시) */
    const baseDetail = coUtil.cofDetail();
    baseDetail.active = false;
    baseDetail.resetSeq = 0;
    const resetDetailToNew = () => {
      baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit';
      baseDetail.active = false; baseDetail.resetSeq++;
    };
    resetDetailToNew();
    const openDetailEdit = (id) => { baseDetail.openEdit(id); baseDetail.active = true; };
    const openDetailView = (id) => { baseDetail.openView(id); baseDetail.active = true; };
    const openDetailNew  = () => { baseDetail.openNew(); baseDetail.active = true; baseDetail.resetSeq++; };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); resetDetailToNew(); return handleSearchList(); }
      if (cmd === 'uis-add')            return openDetailNew();
      if (cmd === 'baseDetail-close')   return resetDetailToNew();
      if (cmd === 'uis-sort')           return baseGrid.onSort(param);
      if (cmd === 'uis-pager-setPage')  return baseGrid.setPage(param);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd) => {
      if (cmd === 'uis-pager-sizeChange') return baseGrid.onSizeChange();
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'uis-cellClick') {
        if (colKey === 'btn_row_edit')    return openDetailEdit(row.uiId);
        if (colKey === 'btn_row_delete')  return handleDelete(row);
        if (colKey === 'btn_row_preview') return handleOpenPreview('ui', row.uiId);
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) return openDetailView(row.uiId);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.device_types = s.sgGetGrpCodes('DEVICE_TYPE');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ###################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...coUtil.cofOmitEmpty(searchParam) };
        const d = (await boApiSvc.dpUi.getPage(params, '전시UI관리', '조회')).data?.data;
        uis.splice(0, uis.length, ...baseGrid.applyPage(d));
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 삭제 (하위 영역이 있으면 백엔드 FK 가 차단) */
    const handleDelete = async (u) => {
      if (!(await showConfirm('삭제', `[${u.uiNm}] UI를 삭제하시겠습니까?\n하위 영역이 있으면 먼저 영역을 삭제해야 합니다.`))) return;
      try {
        await boApiSvc.dpUi.remove(u.uiId, '전시UI관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === u.uiId) resetDetailToNew();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleOpenPreview — 미리보기 팝업 */
    const handleOpenPreview = (mode, id) => {
      window.open(window.pageUrl('bo-disp-ui.html') + '?mode=' + mode + '&id=' + id,
        '_blank', 'width=1440,height=900,scrollbars=yes,resizable=yes');
    };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispUiMng')    { if (opts.reload) handleSearchList(); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') return baseDetail.switchToEdit();
      props.navigate(pg, opts);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));
    const _DEV_FB = { PC: 'badge-blue', MOBILE: 'badge-green', TABLET: 'badge-purple', ALL: 'badge-gray' };

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue',  label: 'UI명',     type: 'text',   placeholder: 'UI명/코드 검색' },
      { key: 'deviceTypeCd', label: '디바이스', type: 'select', options: () => codes.device_types, nullLabel: '디바이스 전체' },
      { key: 'useYn',        label: '사용여부', type: 'select', options: () => codes.use_yn,       nullLabel: '사용여부 전체' },
    ];

    columns.baseGrid = [
      { key: 'uiCd',         label: 'UI코드',   style: 'width:120px;', mono: true },
      { key: 'uiNm',         label: 'UI명',     sortKey: 'nm', link: true,
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.uiId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'deviceTypeCd', label: '디바이스', style: 'width:90px;', badge: (row) => _DEV_FB[row.deviceTypeCd] || 'badge-gray' },
      { key: 'pathId',       label: '표시경로', style: 'width:160px;', fmt: (v) => pathLabel(v) || '-' },
      { key: 'sortOrd',      label: '정렬',     style: 'width:60px;', align: 'center' },
      { key: 'useStartDate', label: '사용기간', style: 'width:170px;',
        fmt: (v, row) => (coUtil.cofYmd(v) || '') + ' ~ ' + (coUtil.cofYmd(row.useEndDate) || '') },
      { key: 'useYn',        label: '사용',     style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',      label: '등록일',   style: 'width:110px;', sortKey: 'reg', fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uis, uiState, codes, searchParam, baseGrid, baseDetail,
      columns,
      handleBtnAction, handleSelectAction, handleGridCellAction,
      handleOpenPreview, inlineNavigate,
    };
  },
  template: /* html */`
<bo-page title="전시UI관리" desc="전시 화면(UI) 정의 — 계층: UI > 영역 > 패널 > 위젯">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="전시UI목록" :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('uis-add')">+ 신규</button>
    </template>
    <bo-grid bare :columns="columns.baseGrid" :rows="uis" :pager="baseGrid.pager" row-key="uiId" :selected-key="baseDetail.selectedId"
      :sort-state="baseGrid"
      :row-class="row => baseDetail.selectedId === row.uiId ? 'active' : ''" empty-text="데이터가 없습니다."
      @sort="key => handleBtnAction('uis-sort', key)"
      grid-id="uis-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_preview btn-icon" title="미리보기" @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁</button>
          <button class="btn btn_row_edit" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          <button class="btn btn_row_delete" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleBtnAction('uis-pager-setPage', n)" :on-size-change="() => handleSelectAction('uis-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 상세 패널 (인라인 임베드 — 항상 표시) ============================ -->
  <dp-disp-ui-dtl :key="baseDetail.panelKey + '_' + baseDetail.resetSeq" :navigate="inlineNavigate"
    :dtl-id="baseDetail.editId" :dtl-mode="baseDetail.dtlMode"
    :active="baseDetail.active"
    :reload-trigger="baseDetail.reloadTrigger" />
</bo-page>
`,
};

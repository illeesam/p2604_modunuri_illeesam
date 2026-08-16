/* ShopJoy Admin - 전시영역관리 (dp_area)
 * 계층: dp_ui ─< dp_area(ui_id) ─< dp_panel(area_id) — 2026-06-11 구조개선 재작성
 * 표준: CmNoticeMng 참조 모델
 */
window.DpDispAreaMng = {
  name: 'DpDispAreaMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const areas = reactive([]);
    const uis = reactive([]);                     // 상위 UI 목록 (검색 select + 그리드 라벨)
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ area_types: [], use_yn: [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] });

    const searchParam = reactive({ searchValue: '', uiId: '', areaTypeCd: '', useYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* baseGrid — pager + 정렬 캡슐 (수동) */
    const _sortMap = { nm: { asc: 'areaNm asc', desc: 'areaNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
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
        baseGrid.pager.pageTotalPage  = d.pageTotalPage  || coUtil.cofTotalPage(baseGrid.pager);
        coUtil.cofBuildPagerNums(baseGrid.pager);
        return d.pageList || [];
      },
    });

    /* baseDetail — 인라인 Dtl 패널 (coUtil.cofDetail, 항상 표시) */
    const baseDetail = coUtil.cofDetail();
    baseDetail.active = false;
    baseDetail.resetSeq = 0;
    const resetDetailToNew = () => {
      baseDetail.selectedId = '__new__'; baseDetail.openMode = 'view';
      baseDetail.active = false; baseDetail.resetSeq++;
    };
    resetDetailToNew();
    const openDetailEdit = (id) => { baseDetail.openEdit(id); baseDetail.active = true; };
    const openDetailView = (id) => { baseDetail.openView(id); baseDetail.active = true; };
    const openDetailNew  = () => { baseDetail.openNew(); baseDetail.active = true; baseDetail.resetSeq++; };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')   { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset')  { Object.assign(searchParam, searchParamInit); baseGrid.reset(); resetDetailToNew(); return handleSearchList(); }
      if (cmd === 'areas-add')           return openDetailNew();
      if (cmd === 'baseDetail-close')    return resetDetailToNew();
      if (cmd === 'areas-sort')          return baseGrid.onSort(param);
      if (cmd === 'areas-pager-setPage') return baseGrid.setPage(param);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd) => {
      if (cmd === 'areas-pager-sizeChange') return baseGrid.onSizeChange();
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'areas-cellClick') {
        if (colKey === 'btn_row_edit')    return openDetailEdit(row.areaId);
        if (colKey === 'btn_row_delete')  return handleDelete(row);
        if (colKey === 'btn_row_preview') return handleOpenPreview('area', row.areaId);
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) return openDetailView(row.areaId);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const s = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await s.saLoadCodes(['AREA_TYPE_CD'], {compNm: 'DpDispAreaMng'});
      codes.area_types = s.sgGetGrpCodes('AREA_TYPE_CD');
    };

    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleLoadUis();
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ###################### */

    /* handleLoadUis — 상위 UI 전체 로드 (select 옵션 + 그리드 라벨) */
    const handleLoadUis = async () => {
      try {
        const d = (await boApiSvc.dpUi.getPage({ pageNo: 1, pageSize: 1000 }, '전시영역관리', 'UI조회')).data?.data;
        uis.splice(0, uis.length, ...(d?.pageList || []));
      } catch (err) {
        console.error('[handleLoadUis]', err);
      }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...coUtil.cofOmitEmpty(searchParam) };
        const d = (await boApiSvc.dpArea.getPage(params, '전시영역관리', '조회')).data?.data;
        areas.splice(0, areas.length, ...baseGrid.applyPage(d));
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 삭제 (하위 패널이 있으면 백엔드 FK 가 차단) */
    const handleDelete = async (a) => {
      if (!(await showConfirm('삭제', `[${a.areaNm}] 영역을 삭제하시겠습니까?\n하위 패널이 있으면 먼저 패널을 삭제해야 합니다.`))) return;
      try {
        await boApiSvc.dpArea.remove(a.areaId, '전시영역관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === a.areaId) resetDetailToNew();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleOpenPreview — 미리보기 팝업 */
    const handleOpenPreview = (mode, id) => {
      window.open(window.pageUrl('bo-disp-ui-pop.html') + '?mode=' + mode + '&id=' + id,
        '_blank', 'width=1440,height=900,scrollbars=yes,resizable=yes');
    };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dpDispAreaMng')  { if (opts.reload) handleSearchList(); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') return baseDetail.switchToEdit();
      props.navigate(pg, opts);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));
    const fnUiNm = (uiId) => { const u = uis.find(x => x.uiId === uiId); return u ? u.uiNm : (uiId || '-'); };
    const _TYPE_FB = { FULL: 'badge-blue', SIDEBAR: 'badge-purple', POPUP: 'badge-orange', INLINE: 'badge-green' };

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '영역명',   type: 'text',   placeholder: '영역명/코드 검색' },
      { key: 'uiId',        label: '소속 UI',  type: 'select',
        options: () => uis.map(u => ({ value: u.uiId, label: u.uiNm })), nullLabel: 'UI 전체' },
      { key: 'areaTypeCd',  label: '영역유형', type: 'select', options: () => codes.area_types, nullLabel: '유형 전체' },
      { key: 'useYn',       label: '사용여부', type: 'select', options: () => codes.use_yn,     nullLabel: '사용여부 전체' },
    ];

    columns.baseGrid = [
      { key: 'areaCd',     label: '영역코드', style: 'width:140px;', mono: true },
      { key: 'areaNm',     label: '영역명',   sortKey: 'nm', link: true,
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.areaId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'uiId',       label: '소속 UI',  style: 'width:130px;', cellStyle: 'color:#2563eb;', fmt: (v) => fnUiNm(v) },
      { key: 'areaTypeCd', label: '유형',     style: 'width:90px;', badge: (row) => _TYPE_FB[row.areaTypeCd] || 'badge-gray' },
      { key: 'pathId',     label: '표시경로', style: 'width:160px;', fmt: (v) => pathLabel(v) || '-' },
      { key: 'useYn',      label: '사용',     style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',    label: '등록일',   style: 'width:110px;', sortKey: 'reg', fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      areas, uis, uiState, codes, searchParam, baseGrid, baseDetail,
      columns,
      handleBtnAction, handleSelectAction, handleGridCellAction,
      handleOpenPreview, inlineNavigate,
    };
  },
  template: /* html */`
<bo-page title="전시영역관리" desc="UI 안의 전시 영역 — 계층: UI > 영역 > 패널 > 위젯">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="전시영역목록" :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('areas-add')">+ 신규</button>
    </template>
    <bo-grid bare :columns="columns.baseGrid" :rows="areas" :pager="baseGrid.pager" row-key="areaId" :selected-key="baseDetail.selectedId"
      :sort-state="baseGrid"
      :row-class="row => baseDetail.selectedId === row.areaId ? 'active' : ''" empty-text="데이터가 없습니다."
      @sort="key => handleBtnAction('areas-sort', key)"
      grid-id="areas-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions
            table-max-height="540px">
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_preview btn-icon" title="미리보기" @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁</button>
          <button class="btn btn_row_edit" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          <button class="btn btn_row_delete" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleBtnAction('areas-pager-setPage', n)" :on-size-change="() => handleSelectAction('areas-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 상세 패널 (인라인 임베드 — 항상 표시) ============================ -->
  <dp-disp-area-dtl :key="baseDetail.panelKey + '_' + baseDetail.resetSeq" :navigate="inlineNavigate"
    :dtl-id="baseDetail.editId" :dtl-mode="baseDetail.dtlMode"
    :active="baseDetail.active"
    :reload-trigger="baseDetail.reloadTrigger" />
</bo-page>
`,
};

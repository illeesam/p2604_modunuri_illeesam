/* ShopJoy Admin - 전시패널관리 (dp_panel)
 * 계층: dp_ui ─< dp_area(ui_id) ─< dp_panel(area_id) ─ content_json{rows} — 2026-06-11 구조개선 재작성
 * 표준: CmNoticeMng 참조 모델 (위젯 편집은 인라인 DpDispPanelDtl 담당)
 */
window.DpDispPanelMng = {
  name: 'DpDispPanelMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
    openNewWindow: { type: Function, default: () => {} }, // 실제 새 브라우저 창으로 열기 (Ctrl+클릭)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const panels = reactive([]);
    const areas = reactive([]);                   // 상위 영역 목록 (검색 select + 그리드 라벨)
    const uis = reactive([]);                     // UI 목록 (영역 라벨 prefix)
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ panel_types: [], disp_statuses: [], use_yn: [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)

    const searchParam = reactive({ searchValue: '', areaId: '', panelTypeCd: '', dispPanelStatusCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* baseGrid — pager + 정렬 캡슐 (수동) */
    const _sortMap = { nm: { asc: 'panelNm asc', desc: 'panelNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };
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
      if (cmd === 'searchParam-list')    { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset')   { Object.assign(searchParam, searchParamInit); baseGrid.reset(); resetDetailToNew(); return handleSearchList(); }
      if (cmd === 'panels-add') {
        if (param && (param.ctrlKey || param.metaKey || param.button === 1)) { return props.openNewWindow('dpDispPanelDtl', null, 'new'); }
        return openDetailNew();
      }
      if (cmd === 'baseDetail-close')     return resetDetailToNew();
      if (cmd === 'panels-sort')          return baseGrid.onSort(param);
      if (cmd === 'panels-pager-setPage') return baseGrid.setPage(param);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd) => {
      if (cmd === 'panels-pager-sizeChange') return baseGrid.onSizeChange();
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'panels-cellClick') {
        if (colKey === 'btn_row_edit') {
          if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { return props.openNewWindow('dpDispPanelDtl', row.panelId, 'edit'); }
          return openDetailEdit(row.panelId);
        }
        if (colKey === 'btn_row_delete')  return handleDelete(row);
        if (colKey === 'btn_row_preview') return handleOpenPreview('panel', row.panelId);
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          if (e.ctrlKey || e.metaKey || e.button === 1) { return props.openNewWindow('dpDispPanelDtl', row.panelId); }
          return openDetailView(row.panelId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const s = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await s.saLoadCodes(['PANEL_TYPE_CD', 'DISP_PANEL_STATUS_CD'], {compNm: 'DpDispPanelMng'});
      codes.panel_types   = s.sgGetGrpCodes('PANEL_TYPE_CD');
      codes.disp_statuses = s.sgGetGrpCodes('DISP_PANEL_STATUS_CD');
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleLoadAreas();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 (2026-08-23) */
      const _qs = new URLSearchParams(window.location.search);
      Object.keys(searchParam).forEach((k) => { if (_qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ###################### */

    /* handleLoadAreas — 상위 영역/UI 전체 로드 (select 옵션 + 그리드 라벨) */
    const handleLoadAreas = async () => {
      try {
        const [areaRes, uiRes] = await Promise.all([
          boApiSvc.dpArea.getPage({ pageNo: 1, pageSize: 1000 }, '전시패널관리', '영역조회'),
          boApiSvc.dpUi.getPage({ pageNo: 1, pageSize: 1000 }, '전시패널관리', 'UI조회'),
        ]);
        areas.splice(0, areas.length, ...(areaRes.data?.data?.pageList || []));
        uis.splice(0, uis.length, ...(uiRes.data?.data?.pageList || []));
      } catch (err) {
        console.error('[handleLoadAreas]', err);
      }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...coUtil.cofOmitEmpty(searchParam) };
        const d = (await boApiSvc.dpPanel.getPage(params, '전시패널관리', '조회')).data?.data;
        panels.splice(0, panels.length, ...baseGrid.applyPage(d));
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 삭제 (dp_panel_item 은 FK CASCADE 로 함께 삭제) */
    const handleDelete = async (p) => {
      if (!(await showConfirm('삭제', `[${p.panelNm}] 패널을 삭제하시겠습니까?`))) return;
      try {
        await boApiSvc.dpPanel.remove(p.panelId, '전시패널관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === p.panelId) resetDetailToNew();
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
      if (pg === 'dpDispPanelMng') { if (opts.reload) handleSearchList(); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') {
        if (baseDetail.selectedId && baseDetail.selectedId !== '__new__') { baseDetail.openMode = 'view'; return; }
        resetDetailToNew(); return;
      }
      if (pg === '__closeDtl__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') return baseDetail.switchToEdit();
      props.navigate(pg, opts);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const fnAreaNm = (areaId) => {
      const a = areas.find(x => x.areaId === areaId);
      if (!a) return areaId || '-';
      const u = uis.find(x => x.uiId === a.uiId);
      return (u ? u.uiNm + ' > ' : '') + a.areaNm;
    };
    const fnWidgetCnt = (row) => coUtil.cofPanelRowCount(row.contentJson);

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue',       label: '패널명', type: 'text',   placeholder: '패널명 검색' },
      { key: 'areaId',            label: '소속 영역', type: 'select',
        options: () => areas.map(a => ({ value: a.areaId, label: fnAreaNm(a.areaId) })), nullLabel: '영역 전체' },
      { key: 'panelTypeCd',       label: '표시유형', type: 'select', options: () => codes.panel_types,   nullLabel: '유형 전체' },
      { key: 'dispPanelStatusCd', label: '상태',     type: 'select', options: () => codes.disp_statuses, nullLabel: '상태 전체' },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    columns.baseGrid = [
      { key: 'panelNm',           label: '패널명', sortKey: 'nm', link: true,
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.panelId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'areaId',            label: '소속 영역', style: 'width:200px;', cellStyle: 'color:#2563eb;', fmt: (v) => fnAreaNm(v) },
      { key: 'panelTypeCd',       label: '표시유형', style: 'width:110px;', badge: () => 'badge-blue' },
      { key: '_widgetCnt',        label: '위젯',     style: 'width:60px;', align: 'center', fmt: (v, row) => fnWidgetCnt(row) + '개' },
      { key: 'dispPanelStatusCd', label: '상태',     style: 'width:80px;',
        badge: (row) => row.dispPanelStatusCd === 'SHOW' ? 'badge-green' : 'badge-gray' },
      { key: 'useYn',             label: '사용',     style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray', fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'regDate',           label: '등록일',   style: 'width:110px;', sortKey: 'reg', fmt: (v) => coUtil.cofYmd(v) || '-' },
          { key: 'siteNm', label: '사이트' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => ({ ...baseGrid.sortParam(), ...coUtil.cofOmitEmpty(searchParam) });

    return {
      panels, areas, uis, uiState, codes, searchParam, baseGrid, baseDetail,
      columns,
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction,
      handleOpenPreview, inlineNavigate,
    };
  },
  template: /* html */`
<bo-page title="전시패널관리" desc="영역 안의 위젯 묶음(패널) — 계층: UI > 영역 > 패널 > 위젯" :share-query="searchParam">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="전시패널목록" :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <button class="btn btn_new" title="Ctrl+클릭/휠클릭: 새창"
        @click="handleBtnAction('panels-add', $event)"
        @auxclick="handleBtnAction('panels-add', $event)">
        + 신규
      </button>
    </template>
    <bo-grid bare :columns="columns.baseGrid" :rows="panels" :pager="baseGrid.pager" row-key="panelId" :selected-key="baseDetail.selectedId"
      :sort-state="baseGrid"
      :row-class="row => baseDetail.selectedId === row.panelId ? 'active' : ''" empty-text="데이터가 없습니다."
      @sort="key => handleBtnAction('panels-sort', key)"
      grid-id="panels-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions
            table-max-height="540px">
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_preview btn-icon" title="미리보기" @click.stop="handleGridCellAction(gridId, 'btn_row_preview', row)">👁</button>
          <button class="btn btn_row_edit" style="white-space:nowrap;"
            @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row, $event)"
            @auxclick.stop="handleGridCellAction(gridId, 'btn_row_edit', row, $event)">
            수정
          </button>
          <button class="btn btn_row_delete" style="white-space:nowrap;" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleBtnAction('panels-pager-setPage', n)" :on-size-change="() => handleSelectAction('panels-pager-sizeChange')" />
    <bo-excel-down-modal :show="excelModal.show" domain="dpPanel" area-nm="전시패널"
      :columns="columns.baseGrid" ui-nm="전시패널관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>
  <!-- ===== ■. 상세 패널 (인라인 임베드 — 항상 표시, 위젯 편집 포함) ============== -->
  <dp-disp-panel-dtl :key="baseDetail.panelKey + '_' + baseDetail.resetSeq" :navigate="inlineNavigate"
    :dtl-id="baseDetail.editId" :dtl-mode="baseDetail.dtlMode"
    :active="baseDetail.active"
    :reload-trigger="baseDetail.reloadTrigger" />
</bo-page>
`,
};

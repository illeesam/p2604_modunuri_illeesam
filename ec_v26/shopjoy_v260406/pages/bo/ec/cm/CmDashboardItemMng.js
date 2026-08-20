/* ShopJoy Admin - 대시보드 항목관리
 *  좌: 대시보드 목록(선택) / 우: 선택 대시보드의 항목 목록 + 인라인 폼.
 *
 *  대시보드 정의 자체(이름·UI컴포넌트·열수 등)는 '대시보드 기준관리' 에서 다룬다.
 *  여기서는 그 대시보드에 어떤 항목이 있는지만 관리한다. 배치·크기는 '대시보드 항목배치'.
 */
window.CmDashboardItemMng = {
  name: 'CmDashboardItemMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = window.cmDashWidgetUtil;

    const dashboards = reactive([]);   /* cm_dashboard 전체 (사이트 기준) */
    const panels     = reactive([]);   /* 선택 대시보드의 cm_dashboard_item */
    const panelCnt   = reactive({});   /* dashboardId → 항목 수 */
    const uiState = reactive({ loading: false, panelLoading: false, viewMode: 'tree' }); /* viewMode: 'tree'|'grid' */
    const codes = reactive({});

    /* ── 3레벨 트리 (1:차트 / 2:시리즈 / 3:항목) ──────────────────────────
       서버가 평면 배열(lvl + itemCode)로 준다. 접기/펼치기는 화면에서만 관리한다. */
    const treeRows = reactive([]);
    const treeState = reactive({
      collapsed: {},   /* itemCode → true (접힘). 기본은 전부 펼침 */
    });

    const searchParam = reactive({ searchValue: '', useYn: '' });

    /* dashState — 좌측에서 고른 대시보드 */
    const dashState = reactive({ selectedId: null });

    /* panelDetail — 항목 인라인 폼 상태 */
    const panelDetail = reactive({ selectedId: null, isNew: false, show: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => panelDetail.dtlMode === 'view');
    const _initPanelForm = () => ({
      dashboardItemId: null, itemKey: '', itemNm: '', itemTypeCd: 'CHART', chartTypeCd: 'bar', sortOrd: 10,
      panelWidth: 1, panelHeight: 1, realtimeYn: 'N', useYn: 'Y', seriesJson: '', optionJson: '',
      colsJson: '', lvl1CodeGrp: '', lvl2CodeGrp: '',
    });
    const panelForm = reactive(_initPanelForm());
    const panelErrors = reactive({});

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    /* 개인화 대시보드 여부 — ownerUserId(운영 표준) 우선, 구 규약(uiCompNm 'MY:' 접두어) fallback */
    const fnIsMyDash = (row) => !!row.ownerUserId || (row.uiCompNm || '').indexOf('MY:') === 0;
    const cfCurDash = computed(() => dashboards.find(d => d.dashboardId === dashState.selectedId) || null);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  return handleSearchList();
      if (cmd === 'searchParam-reset') { searchParam.searchValue = ''; searchParam.useYn = ''; return handleSearchList(); }
      if (cmd === 'panels-add')        return openPanelNew();
      if (cmd === 'panelForm-save')    return handleSavePanel();
      if (cmd === 'panelForm-close')   return resetDetailToNew();
      if (cmd === 'panelForm-edit')    return switchToEdit();
      if (cmd === 'panelForm-cancel')  return handleCancelEdit();
      if (cmd === 'dash-layout')       return props.navigate('cmDashboardLayoutMng', { dtlId: dashState.selectedId });
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'dashboards-cellClick') {
        if ((e.col ? e.col.link : false) || colKey === '__no__') return selectDash(row);
        return;
      }
      if (cmd === 'panels-cellClick') {
        if (colKey === 'btn_row_edit')   return openPanelEdit(row);
        if (colKey === 'btn_row_delete') return handleDeletePanel(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return loadView(row);
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */


    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      await handleSearchList();
    };
    onMounted(initPage);

    /* handleSearchList — 대시보드 목록 (전체 로드) + 항목 수 집계 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getList(
          { siteId: cfSiteId.value }, '대시보드항목관리', '대시보드조회');
        let list = res.data?.data || [];
        const kw = (searchParam.searchValue || '').trim().toLowerCase();
        if (kw) list = list.filter(d => (d.dashboardNm || '').toLowerCase().includes(kw)
                                     || (d.uiCompNm || '').toLowerCase().includes(kw));
        if (searchParam.useYn) list = list.filter(d => (d.useYn || 'Y') === searchParam.useYn);
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        dashboards.splice(0, dashboards.length, ...list);
        await fnLoadPanelCounts();
        /* 선택이 사라졌으면 정리 */
        if (dashState.selectedId && !list.some(d => d.dashboardId === dashState.selectedId)) {
          dashState.selectedId = null;
          panels.splice(0, panels.length);
          resetDetailToNew();
        }
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadPanelCounts — 대시보드별 항목 수 (목록 표시용) */
    const fnLoadPanelCounts = async () => {
      try {
        const res = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '대시보드항목관리', '항목수조회');
        const cnt = {};
        (res.data?.data || []).forEach(i => { cnt[i.dashboardId] = (cnt[i.dashboardId] || 0) + 1; });
        Object.keys(panelCnt).forEach(k => delete panelCnt[k]);
        Object.assign(panelCnt, cnt);
      } catch (e) { console.warn('[항목 수 조회 오류]', e); }
    };

    /* handleSearchPanels — 선택 대시보드의 항목 목록 조회 (평면 목록 + 3레벨 트리) */
    const handleSearchPanels = async () => {
      if (!dashState.selectedId) {
        panels.splice(0, panels.length);
        treeRows.splice(0, treeRows.length);
        return;
      }
      uiState.panelLoading = true;
      try {
        const res = await boApiSvc.cmDashboard.getItemList(
          { siteId: cfSiteId.value, dashboardId: dashState.selectedId }, '대시보드항목관리', '항목조회');
        const list = (res.data?.data || []).filter(i => i.dashboardId === dashState.selectedId);
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        panels.splice(0, panels.length, ...list);
        await fnLoadTree();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 조회 오류', 'error', 0);
      } finally {
        uiState.panelLoading = false;
      }
    };

    /* fnLoadTree — 3레벨 트리 조회. 트리가 비어도 평면 목록은 이미 떠 있으므로 화면을 막지 않는다 */
    const fnLoadTree = async () => {
      try {
        const res = await boApiSvc.cmDashboard.getItemTree(
          { dashboardId: dashState.selectedId }, '대시보드항목관리', '항목트리조회');
        treeRows.splice(0, treeRows.length, ...(res.data?.data || []));
      } catch (err) {
        treeRows.splice(0, treeRows.length);
        console.warn('[항목 트리 조회 오류]', err);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* selectDash — 좌측 대시보드 선택 (자식 폼은 초기화) */
    const selectDash = (row) => {
      dashState.selectedId = row.dashboardId;
      resetDetailToNew();
      handleSearchPanels();
    };

    /* resetDetailToNew — 항목 인라인 폼 닫기(=미선택 상태로 복귀) */
    const resetDetailToNew = () => {
      panelDetail.show = false; panelDetail.selectedId = null; panelDetail.isNew = false; panelDetail.dtlMode = 'view';
    };

    const openPanelNew = () => {
      if (!dashState.selectedId) return showToast('대시보드를 먼저 선택하세요.', 'error');
      panelDetail.selectedId = null;
      panelDetail.isNew = true;
      panelDetail.show = true;
      panelDetail.dtlMode = 'edit';
      const maxOrd = panels.reduce((m, p) => Math.max(m, p.sortOrd || 0), 0);
      Object.assign(panelForm, _initPanelForm(), { sortOrd: maxOrd + 10 });
    };

    /* _loadDetailForm — 항목 인라인 폼에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (row, mode) => {
      panelDetail.selectedId = row.dashboardItemId;
      panelDetail.isNew = false;
      panelDetail.show = true;
      panelDetail.dtlMode = mode;
      Object.assign(panelForm, {
        dashboardItemId: row.dashboardItemId, itemKey: row.itemKey, itemNm: row.itemNm,
        itemTypeCd: util.itemTypeOf(row), chartTypeCd: row.chartTypeCd || 'bar', sortOrd: row.sortOrd || 10,
        panelWidth: row.panelWidth || 1, panelHeight: row.panelHeight || 1,
        realtimeYn: row.realtimeYn || 'N', useYn: row.useYn || 'Y',
        seriesJson: row.seriesJson || '', optionJson: row.optionJson || '',
        colsJson: row.colsJson || '', lvl1CodeGrp: row.lvl1CodeGrp || '', lvl2CodeGrp: row.lvl2CodeGrp || '',
      });
    };

    /* loadView — 보기모드로 항목 인라인 폼 열기 (행 클릭) */
    const loadView = (row) => _loadDetailForm(row, 'view');

    /* openPanelEdit — 수정모드로 항목 인라인 폼 열기 ([수정] 버튼) */
    const openPanelEdit = (row) => _loadDetailForm(row, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 하단 [수정] 버튼) */
    const switchToEdit = () => { panelDetail.dtlMode = 'edit'; };

    /* handleCancelEdit — 수정 취소: 신규 등록 중이면 패널 닫기, 기존 항목 수정 중이면 원본 재적재 후 보기모드 복귀 */
    const handleCancelEdit = () => {
      if (panelDetail.isNew) { return resetDetailToNew(); }
      const row = panels.find(p => p.dashboardItemId === panelDetail.selectedId);
      return row ? loadView(row) : resetDetailToNew();
    };

    /* handleSavePanel — 항목 저장 (itemSave base, rowStatus I/U) */
    const handleSavePanel = async () => {
      Object.keys(panelErrors).forEach(k => delete panelErrors[k]);
      if (!panelForm.itemKey) { panelErrors.itemKey = '항목 키를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!panelForm.itemNm)  { panelErrors.itemNm = '항목명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!(await showConfirm('저장', '항목을 저장하시겠습니까?'))) return;
      try {
        const body = {
          dashboardItemId: panelDetail.isNew ? null : panelForm.dashboardItemId,
          rowStatus: panelDetail.isNew ? 'I' : 'U',
          siteId: cfSiteId.value, dashboardId: dashState.selectedId,
          itemKey: panelForm.itemKey, itemNm: panelForm.itemNm,
          itemTypeCd: panelForm.itemTypeCd,
          /* 차트가 아닌 유형은 차트종류를 비워 둔다 — 남겨두면 'kpi 차트' 같은 오해가 생긴다 */
          chartTypeCd: panelForm.itemTypeCd === 'CHART' ? panelForm.chartTypeCd : null,
          sortOrd: Number(panelForm.sortOrd) || 10,
          panelWidth: Number(panelForm.panelWidth) || 1, panelHeight: Number(panelForm.panelHeight) || 1,
          realtimeYn: panelForm.realtimeYn, useYn: panelForm.useYn,
          seriesJson: panelForm.seriesJson || null, optionJson: panelForm.optionJson || null,
          colsJson: panelForm.colsJson || null,
          lvl1CodeGrp: panelForm.lvl1CodeGrp || null, lvl2CodeGrp: panelForm.lvl2CodeGrp || null,
        };
        await boApiSvc.cmDashboard.itemSave('base', body, '대시보드항목관리', '항목저장');
        showToast('저장되었습니다.', 'success');
        resetDetailToNew();
        await handleSearchPanels();
        await fnLoadPanelCounts();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    /* handleDeletePanel — 항목 삭제 (itemSave base, rowStatus D) */
    const handleDeletePanel = async (row) => {
      if (!(await showConfirm('삭제', '[' + row.itemNm + '] 항목을 삭제하시겠습니까?'))) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: row.dashboardItemId, rowStatus: 'D' }, '대시보드항목관리', '항목삭제');
        showToast('삭제되었습니다.', 'success');
        if (panelDetail.selectedId === row.dashboardItemId) resetDetailToNew();
        await handleSearchPanels();
        await fnLoadPanelCounts();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    /* ── 3레벨 트리 헬퍼 ────────────────────────────────────────────────────
       서버가 준 평면 배열에서 "접힌 조상"이 있는 노드만 걸러 화면에 그린다.
       lvl2 는 자기 차트(lvl1)가 접히면 숨고, lvl3 는 차트 또는 시리즈가 접히면 숨는다. */

    /* fnParentCode — 노드의 부모 itemCode ('A-B-C' → 'A-B') */
    const fnParentCode = (code) => {
      const i = String(code || '').lastIndexOf('-');
      return i < 0 ? '' : String(code).slice(0, i);
    };

    /* cfTreeVisible — 접힘 상태를 반영한 표시 대상 노드 */
    const cfTreeVisible = computed(() => treeRows.filter((n) => {
      if (n.lvl === 1) return true;
      /* 조상 코드를 하나씩 거슬러 올라가며 접힌 게 있으면 숨김 */
      let p = fnParentCode(n.itemCode);
      while (p) {
        if (treeState.collapsed[p]) return false;
        p = fnParentCode(p);
      }
      return true;
    }));

    /* fnHasChild — 자식이 있는 노드만 ▼/▶ 아이콘을 보여준다 */
    const fnHasChild = (node) => treeRows.some(n => fnParentCode(n.itemCode) === node.itemCode);

    /* fnToggleNode — 접기/펼치기 */
    const fnToggleNode = (node) => {
      if (!fnHasChild(node)) return;
      if (treeState.collapsed[node.itemCode]) delete treeState.collapsed[node.itemCode];
      else treeState.collapsed[node.itemCode] = true;
    };

    const fnTreeExpandAll   = () => { Object.keys(treeState.collapsed).forEach(k => delete treeState.collapsed[k]); };
    const fnTreeCollapseAll = () => { treeRows.forEach(n => { if (fnHasChild(n)) treeState.collapsed[n.itemCode] = true; }); };

    /* fnLvlBullet / fnLvlColor — 레벨 구분 표시 (카테고리관리와 같은 방식) */
    const fnLvlBullet = (lvl) => (lvl === 1 ? '●' : lvl === 2 ? '▪' : '·');
    const fnLvlColor  = (lvl) => (lvl === 1 ? '#e8587a' : lvl === 2 ? '#2563eb' : '#94a3b8');
    const fnLvlLabel  = (lvl) => (lvl === 1 ? '차트' : lvl === 2 ? '시리즈' : '항목');

    const columns = {};

    columns.baseSearch = [
      { key: 'searchValue', type: 'text', placeholder: '대시보드명/컴포넌트명 검색', label: '대시보드명' },
      { key: 'useYn', type: 'select', label: '사용여부', nullLabel: '사용여부 전체',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
    ];

    /* 좌측은 선택용 목록이라 .bo-2col 의 좁은 폭(17fr)에 들어가는 만큼만 둔다.
       UI컴포넌트는 선택하면 우측 상단 띠에 나오고, 사용여부는 검색조건으로 거르므로
       컬럼으로 두면 가로 스크롤만 생기고 정작 대시보드명이 잘린다. */
    columns.dashboards = [
      { key: 'dashboardNm', label: '대시보드명', link: true,
        fmt: (v, row) => (fnIsMyDash(row) ? '👤 ' : '') + (v || '') + (row.useYn === 'N' ? ' (미사용)' : ''),
        cellInnerStyle: (v, row) => dashState.selectedId === row.dashboardId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: '_panelCnt', label: '항목', style: 'width:52px;', align: 'center',
        fmt: (v, row) => (panelCnt[row.dashboardId] || 0) + '개' },
    ];

    columns.panels = [
      { key: 'itemKey',   label: '항목키', style: 'width:110px;', cellStyle: 'font-family:monospace;font-size:11px;', link: true },
      { key: 'itemNm',    label: '항목명',
        cellInnerStyle: (v, row) => panelDetail.selectedId === row.dashboardItemId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'itemTypeCd', label: '유형', style: 'width:88px;',
        fmt: (v, row) => util.itemTypeIcon(util.itemTypeOf(row)) + ' ' + util.itemTypeLabel(util.itemTypeOf(row)) },
      { key: 'chartTypeCd', label: '차트종류', style: 'width:96px;',
        fmt: (v, row) => util.itemTypeOf(row) === 'CHART' ? util.chartTypeIcon(v) + ' ' + util.chartTypeLabel(v) : '-' },
      { key: 'panelWidth',  label: '폭', style: 'width:50px;', align: 'center', fmt: (v) => (v || 1) },
      { key: 'panelHeight', label: '높이', style: 'width:50px;', align: 'center', fmt: (v) => (v || 1) },
      { key: 'sortOrd',   label: '정렬', style: 'width:60px;', align: 'center' },
      { key: 'realtimeYn', label: '실시간', style: 'width:70px;',
        badge: (row) => row.realtimeYn === 'Y' ? 'badge-red' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '실시간' : '-' },
      { key: 'useYn',     label: '사용', style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '사용' : '미사용' },
    ];

    columns.panelForm = [
      { type: 'group', label: '기본 · 배치설정' },
      { key: 'itemKey', label: '항목 키', type: 'text', required: true, mono: true, placeholder: 'COMP0101' },
      { key: 'itemNm', label: '항목명', type: 'text', required: true, colSpan: 2 },
      { key: 'itemTypeCd', label: '항목유형', type: 'select',
        options: () => util.ITEM_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      /* 차트종류는 차트일 때만 물어본다 — KPI·목록에는 의미가 없다 */
      { key: 'chartTypeCd', label: '차트종류', type: 'select',
        visible: (form) => form.itemTypeCd === 'CHART',
        options: () => util.CHART_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      { key: 'panelWidth', label: '항목 폭(열 span)', type: 'select',
        options: () => [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: n })) },
      { key: 'panelHeight', label: '항목 높이(행 span)', type: 'select',
        options: () => [1, 2, 3].map(n => ({ value: n, label: n })) },
      { key: 'sortOrd', label: '정렬순서', type: 'number' },
      { key: 'realtimeYn', label: '실시간 여부', type: 'select',
        options: () => [{ value: 'N', label: '일반' }, { value: 'Y', label: '실시간' }] },
      { key: 'useYn', label: '사용여부', type: 'select',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
      /* ── 3레벨 구조 정의 ────────────────────────────────────────────────
         2레벨(시리즈)·3레벨(항목) 이름을 공통코드에서 고르게 하려면 코드그룹을 지정한다.
         비워두면 직접입력. 각 원소의 cd 가 고유 item_code(`항목키-시리즈cd-항목cd`) 조각이 된다. */
      { type: 'group', label: '3레벨 구조 정의 (시리즈 · 항목)' },
      { key: 'lvl1CodeGrp', label: '2레벨(시리즈) 코드그룹', type: 'text', mono: true,
        placeholder: '예: SALE_CHANNEL (비우면 직접입력)',
        hint: '시리즈명을 이 공통코드그룹에서 고른다' },
      { key: 'lvl2CodeGrp', label: '3레벨(항목) 코드그룹', type: 'text', mono: true,
        placeholder: '예: MONTH (비우면 직접입력)',
        hint: '항목명을 이 공통코드그룹에서 고른다' },
      { key: '_itemCodeSample', label: '고유 item_code 형식', type: 'readonly',
        fmt: () => (panelForm.itemKey || '항목키') + '-시리즈cd-항목cd' },
      { key: 'seriesJson', label: '2레벨 시리즈 정의 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '[{"cd":"CH_COUPANG","name":"쿠팡","color":"#6366f1"}]',
        hint: 'cd 를 비우면 name 이 코드로 쓰인다' },
      { key: 'colsJson', label: '3레벨 항목 정의 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '[{"cd":"M01","name":"1월"},{"cd":"M02","name":"2월"}]',
        hint: '데이터관리 그리드의 열 제목. 비우면 데이터관리에서 직접 입력' },
      { key: 'optionJson', label: 'ECharts 옵션 오버라이드 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '{"legend":{"show":false}}' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, panels, panelCnt, uiState, codes, searchParam,
      dashState, panelDetail, panelForm, panelErrors, columns, util,
      cfCurDash, cfDtlMode,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */ `
<bo-page title="대시보드 항목관리"
  desc-summary="대시보드에 속한 항목을 등록·수정합니다. 대시보드 정의는 대시보드 기준관리, 배치·크기는 대시보드 항목배치 화면을 이용하세요.">
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>

  <div class="bo-2col">
    <!-- ===== ■. 대시보드 목록 (선택) ======================================= -->
    <bo-container title="대시보드 목록" :count-text="'총 ' + dashboards.length + '건'">
      <bo-grid bare narrow :columns="columns.dashboards" :rows="dashboards" row-key="dashboardId"
        :loading="uiState.loading" :selected-key="dashState.selectedId"
        :row-class="row => dashState.selectedId === row.dashboardId ? 'active' : ''"
        empty-text="대시보드가 없습니다."
        grid-id="dashboards-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    </bo-container>

    <!-- ===== ■. 항목 목록 + 인라인 폼 (항상 표시 — 미선택 시 빈 그리드 + 안내) ===== -->
    <bo-container title="항목 목록"
      :count-text="dashState.selectedId ? '총 ' + panels.length + '개' : ''">
      <template #toolbar-actions>
        <!-- 영역을 숨기지 않고 버튼만 잠근다 (미선택 상태에서도 무엇을 할 수 있는지 보여야 한다) -->
        <button class="btn" :disabled="!dashState.selectedId" @click="handleBtnAction('dash-layout')"
          style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;font-weight:700;">🧩 항목배치 열기</button>
        <button class="btn btn_new" :disabled="!dashState.selectedId" @click="handleBtnAction('panels-add')">+ 항목 추가</button>
      </template>
      <div style="padding:8px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #f0f0f0;">
        <template v-if="dashState.selectedId">
          <b>{{ cfCurDash ? cfCurDash.dashboardNm : '' }}</b>
          <span style="color:#aaa;margin-left:6px;font-family:monospace;font-size:11px;">{{ cfCurDash ? cfCurDash.uiCompNm : '' }}</span>
        </template>
        <span v-else style="color:#aaa;">대시보드 미선택</span>
      </div>
      <bo-grid bare :columns="columns.panels" :rows="panels" row-key="dashboardItemId"
        :loading="uiState.panelLoading" :selected-key="panelDetail.selectedId"
        :row-class="row => panelDetail.selectedId === row.dashboardItemId ? 'active' : ''"
        :empty-text="dashState.selectedId ? '항목이 없습니다. [+ 항목 추가]로 등록하세요.' : '좌측에서 대시보드를 선택하면 항목 목록이 표시됩니다.'"
        grid-id="panels-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
            <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
          </div>
        </template>
      </bo-grid>
    </bo-container>
  </div>

  <!-- ===== ■. 항목 상세 폼 (전체 폭 · 항상 표시 — 미선택 시 안내) ============ -->
  <bo-container :title="!panelDetail.show ? '대시보드위젯 상세' : (panelDetail.isNew ? '대시보드위젯 신규' : (cfDtlMode ? '대시보드위젯 상세' : '대시보드위젯 수정'))"
    :title-id="panelDetail.selectedId ? panelForm.dashboardItemId : ''">
    <div v-if="panelDetail.show" style="padding:12px;">
      <bo-form-area :columns="columns.panelForm" :form="panelForm" :errors="panelErrors"
        :cols="3" :show-actions="false" :readonly="cfDtlMode" plain-readonly />
      <div class="form-actions">
        <template v-if="cfDtlMode">
          <button class="btn btn_edit" @click="handleBtnAction('panelForm-edit')">수정</button>
          <button class="btn btn_close" @click="handleBtnAction('panelForm-close')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn_save" @click="handleBtnAction('panelForm-save')">저장</button>
          <button class="btn btn_cancel" @click="handleBtnAction('panelForm-cancel')">취소</button>
        </template>
      </div>
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      항목 목록에서 항목을 선택하거나 [+ 항목 추가]를 클릭하세요.</div>
  </bo-container>
</bo-page>
`,
};

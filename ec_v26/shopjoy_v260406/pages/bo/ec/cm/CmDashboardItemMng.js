/* ShopJoy Admin - 대시보드 항목관리
 *  좌: 대시보드 목록(선택) / 우: 선택 대시보드의 항목 목록 + 인라인 폼.
 *
 *  대시보드 정의 자체(이름·UI컴포넌트·열수 등)는 '대시보드 관리' 에서 다룬다.
 *  여기서는 그 대시보드에 어떤 항목이 있는지만 관리한다. 배치·크기는 '대시보드 항목배치'.
 */
window.CmDashboardItemMng = {
  name: 'CmDashboardItemMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = window.cmDashWidgetUtil;

    const dashboards = reactive([]);   /* cm_dashboard 전체 (사이트 기준) */
    const panels     = reactive([]);   /* 선택 대시보드의 cm_dashboard_item */
    const panelCnt   = reactive({});   /* dashboardId → 항목 수 */
    const uiState = reactive({ loading: false, panelLoading: false, viewMode: 'tree' }); /* viewMode: 'tree'|'grid' */
    const codes = reactive({});

    /* ── 3레벨 트리 (1:차트 / 2:시리즈 / 3:항목) ──────────────────────────
       서버가 평면 배열(lvl + itemKey)로 준다. 접기/펼치기는 화면에서만 관리한다. */
    const treeRows = reactive([]);
    const treeState = reactive({
      collapsed: {},   /* itemKey → true (접힘). 기본은 전부 펼침 */
    });

    /* ── 2·3레벨 편집 그리드 ────────────────────────────────────────────────
       DB 에는 series_json / cols_json (JSON 배열)로 저장되지만, 사람이 JSON 을 직접 치는 건
       오타가 나기 쉬워 화면에서는 행 단위 그리드로 편집한다.
       불러올 때 JSON → 행배열, 저장할 때 행배열 → JSON 으로 변환한다.
       코드그룹(lvl1/lvl2CodeGrp)이 지정돼 있으면 코드 칸이 공통코드 select 로 바뀐다. */
    const seriesRows = reactive([]);   /* [{cd, name, color}] — 2레벨 */
    const colRows    = reactive([]);   /* [{cd, name}]        — 3레벨 */
    /* 코드그룹에서 읽어온 선택지 (키: 코드그룹명) */
    const grpCodes = reactive({});

    const searchParam = reactive({ searchValue: '', useYn: '' });

    /* dashState — 좌측에서 고른 대시보드 */
    const dashState = reactive({ selectedId: null });

    /* panelDetail — 항목 인라인 폼 상태 */
    const panelDetail = reactive({ selectedId: null, isNew: false, show: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => panelDetail.dtlMode === 'view');
    const _initPanelForm = () => ({
      dashboardItemId: null, itemKey: '', itemNm: '',
      widgetTypeCd: 'CHART', axisTypeCd: 'CATEGORY', seriesOrientCd: 'ROW', chartTypeCd: 'bar', sortOrd: 10,
      autoCollectYn: 'N', editableYn: 'Y', inputOpts: '',
      panelWidth: 1, panelHeight: 1, realtimeYn: 'N', useYn: 'Y', optionJson: '',
      lvl1CodeGrp: '', lvl2CodeGrp: '', simJson: '',
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
        fnAttachChildCounts();
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

    /* fnAttachChildCounts — treeRows(전체 레벨)로 각 차트(panels 행)에 시리즈개수·데이타열개수를 매긴다.
       데이타열개수는 시리즈끼리 항목 1벌을 공유하므로 첫 시리즈의 3레벨 자식 수를 쓴다
       (데이터관리 그리드의 열 개수와 같은 규칙). 별도 API 호출 없이 이미 받은 트리로 계산한다. */
    const fnAttachChildCounts = () => {
      const byParent = {};
      treeRows.forEach(n => { if (n.parentDashboardItemId) (byParent[n.parentDashboardItemId] = byParent[n.parentDashboardItemId] || []).push(n); });
      panels.forEach(p => {
        const sers = byParent[p.dashboardItemId] || [];
        p._seriesCnt = sers.length;
        p._colCnt = sers.length ? (byParent[sers[0].dashboardItemId] || []).length : 0;
      });
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
      fnSyncFormToRows();   /* 편집 그리드 적재 (신규는 빈 행) */
    };

    /* _loadDetailForm — 항목 인라인 폼에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (row, mode) => {
      panelDetail.selectedId = row.dashboardItemId;
      panelDetail.isNew = false;
      panelDetail.show = true;
      panelDetail.dtlMode = mode;
      Object.assign(panelForm, {
        dashboardItemId: row.dashboardItemId, itemKey: row.itemKey || '', itemNm: row.itemNm,
        widgetTypeCd: row.widgetTypeCd || util.itemTypeOf(row),
        axisTypeCd: row.axisTypeCd || 'CATEGORY',
        seriesOrientCd: row.seriesOrientCd || 'ROW',
        autoCollectYn: row.autoCollectYn || 'N', editableYn: row.editableYn || 'Y',
        inputOpts: row.inputOpts || '',
        chartTypeCd: row.chartTypeCd || 'bar', sortOrd: row.sortOrd || 10,
        panelWidth: row.panelWidth || 1, panelHeight: row.panelHeight || 1,
        realtimeYn: row.realtimeYn || 'N', useYn: row.useYn || 'Y',
        optionJson: row.optionJson || '',
        lvl1CodeGrp: row.lvl1CodeGrp || '', lvl2CodeGrp: row.lvl2CodeGrp || '',
        simJson: row.simJson || '',
      });
      fnSyncFormToRows();   /* 정의 행 → 편집 그리드 */
      onGrpChange();        /* 코드그룹이 지정돼 있으면 선택지 미리 로드 */
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
      fnSyncSimToForm();    /* 시뮬레이션 값·스타일 → simJson */
      try {
        const body = {
          dashboardItemId: panelDetail.isNew ? null : panelForm.dashboardItemId,
          rowStatus: panelDetail.isNew ? 'I' : 'U',
          siteId: cfSiteId.value, dashboardId: dashState.selectedId,
          /* 이 화면은 1레벨(차트)만 다룬다 — 레벨은 chart 고정, 위젯유형은 widgetTypeCd 로 분리됐다.
             itemKey 는 신규면 비워 보내고 서버가 chart### 로 채번한다(전역 UNIQUE). */
          itemKey: panelForm.itemKey || null,
          itemNm: panelForm.itemNm,
          itemTypeCd: 'chart',
          widgetTypeCd: panelForm.widgetTypeCd,
          axisTypeCd: panelForm.axisTypeCd || 'CATEGORY',
          seriesOrientCd: panelForm.seriesOrientCd || 'ROW',
          autoCollectYn: panelForm.autoCollectYn || 'N',
          editableYn: panelForm.editableYn || 'Y',
          inputOpts: panelForm.inputOpts || null,
          /* 차트가 아닌 유형은 차트종류를 비워 둔다 — 남겨두면 'kpi 차트' 같은 오해가 생긴다 */
          chartTypeCd: panelForm.widgetTypeCd === 'CHART' ? panelForm.chartTypeCd : null,
          sortOrd: Number(panelForm.sortOrd) || 10,
          panelWidth: Number(panelForm.panelWidth) || 1, panelHeight: Number(panelForm.panelHeight) || 1,
          realtimeYn: panelForm.realtimeYn, useYn: panelForm.useYn,
          optionJson: panelForm.optionJson || null,
          simJson: panelForm.simJson || null,
          lvl1CodeGrp: panelForm.lvl1CodeGrp || null, lvl2CodeGrp: panelForm.lvl2CodeGrp || null,
        };
        const res = await boApiSvc.cmDashboard.itemSave('base', body, '대시보드항목관리', '항목저장');
        /* 편집 그리드의 시리즈·항목을 실제 정의행으로 반영 — 트리·데이터관리가 이 행을 본다 */
        const savedId = res.data?.data?.dashboardItemId || panelForm.dashboardItemId;
        let syncMsg = '';
        if (savedId) {
          const sres = await boApiSvc.cmDashboard.syncItemChildren(savedId, {
            series: seriesRows.map(r => ({ dashboardItemId: r.dashboardItemId, cd: r.cd, name: r.name, color: r.color })),
            cols:   colRows.map(r => ({ dashboardItemId: r.dashboardItemId, cd: r.cd, name: r.name })),
          }, '대시보드항목관리', '하위행동기화');
          const d = sres.data?.data || {};
          if (d.deletedRows) { syncMsg = ` (삭제 ${d.deletedRows}행, 값 ${d.deletedData || 0}건 정리)`; }
        }
        showToast('저장되었습니다.' + syncMsg, 'success');
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

    /* ── 2·3레벨 편집 그리드 헬퍼 ────────────────────────────────────────── */





    /* fnPanelOf — 항목ID로 실제 항목 행을 찾는다.
       트리 노드에는 표시용 정보만 있어서 그대로 폼에 넘기면 빈 값으로 열린다 */
    const fnPanelOf = (id) => panels.find(p => p.dashboardItemId === id) || { dashboardItemId: id };

    /* fnSeriesFromTree — 차트의 시리즈 행(2레벨)을 편집 그리드 형태로.
       트리 노드는 각자 자기 dashboardItemId 를 가지므로 부모로 걸러야 한다
       (차트 id 로 거르면 아무것도 안 걸린다 — 구조가 행 기반으로 바뀌면서 달라진 부분). */
    const fnSeriesFromTree = (chartId) => treeRows
      .filter(n => n.lvl === 2 && n.parentDashboardItemId === chartId)
      /* dashboardItemId 를 들고 다녀야 cd(키명)를 바꿔도 서버가 같은 행으로 알아본다
         — 없으면 "사라진 행" 으로 보여 붙어있던 데이터까지 지워진다 */
      .map(n => ({ dashboardItemId: n.dashboardItemId, cd: n.itemCd || '', name: n.itemNm || '', color: n.itemColor || '' }));

    /* fnColsFromTree — 항목 행(3레벨). 열 정의는 시리즈마다 같으므로 첫 시리즈 것을 쓴다 */
    const fnColsFromTree = (chartId) => {
      const first = treeRows.find(n => n.lvl === 2 && n.parentDashboardItemId === chartId);
      if (!first) return [];
      return treeRows
        .filter(n => n.lvl === 3 && n.parentDashboardItemId === first.dashboardItemId)
        .map(n => ({ dashboardItemId: n.dashboardItemId, cd: n.itemCd || '', name: n.itemNm || '', color: '' }));
    };

    /* fnSyncFormToRows — 정의 행(없으면 JSON) → 편집 그리드. 항목을 새로 열 때마다 호출 */
    const fnSyncFormToRows = () => {
      /* 정의 "행" 이 기준이다 — 트리·데이터관리가 보는 것과 같은 것을 편집해야 어긋나지 않는다.
         아직 행이 없는 차트(신규/구형)만 series_json·cols_json 으로 폴백한다. */
      const id = panelForm.dashboardItemId;
      let sRows = id ? fnSeriesFromTree(id) : [];
      let cRows = id ? fnColsFromTree(id) : [];
      /* 정의 행이 유일한 기준이다 (series_json/cols_json 은 2026-08-21 폐기) */
      seriesRows.splice(0, seriesRows.length, ...sRows);
      colRows.splice(0, colRows.length, ...cRows);
      srcState.scriptManual = false;   /* 다른 항목을 열었으니 수동 편집 상태는 초기화 */
      fnSyncFormToSim();  /* 저장해 둔 시뮬레이션 값·스타일 복원 (fnSimFit 포함) */
      fnSrcRegen();       /* 소스보기 탭 내용 재생성 */
    };



    /* fnLoadGrpCodes — 지정된 코드그룹의 선택지를 가져온다(이미 받은 그룹은 캐시가 막아준다) */
    const fnLoadGrpCodes = async (grp) => {
      const g = String(grp || '').trim();
      if (!g || grpCodes[g]) return;
      try {
        const codeStore = window.sfGetBoCodeStore();
        await codeStore.saLoadCodes([g], { compNm: 'CmDashboardItemMng' });
        grpCodes[g] = codeStore.sgGetGrpCodes(g);
      } catch (e) {
        console.warn('[코드그룹 조회 실패]', g, e);
        grpCodes[g] = [];
      }
    };

    /* fnGrpOptions — 코드그룹의 선택지. 미지정/미조회면 빈 배열(=직접입력 모드) */
    const fnGrpOptions = (grp) => grpCodes[String(grp || '').trim()] || [];

    /* onGrpChange — 코드그룹을 바꾸면 즉시 선택지를 받아둔다(칸이 select 로 바뀜) */
    const onGrpChange = async () => {
      await Promise.all([fnLoadGrpCodes(panelForm.lvl1CodeGrp), fnLoadGrpCodes(panelForm.lvl2CodeGrp)]);
    };

    /* onPickCode — 코드 select 에서 고르면 이름도 같이 채운다(직접 고친 이름은 덮지 않는다) */
    const onPickCode = (row, grp) => {
      const opt = fnGrpOptions(grp).find(o => o.codeValue === row.cd);
      if (opt && !String(row.name || '').trim()) row.name = opt.codeLabel;
    };

    const fnAddSeriesRow = () => seriesRows.push({ cd: '', name: '', color: '' });
    const fnAddColRow    = () => colRows.push({ cd: '', name: '', color: '' });
    const fnDelSeriesRow = (i) => seriesRows.splice(i, 1);
    const fnDelColRow    = (i) => colRows.splice(i, 1);

    /* ── 시리즈·항목 정의 그리드 드래그 정렬 ────────────────────────────────
       좌측 ☰ 손잡이를 잡고 끌면 순서가 바뀐다(순서 = 표시 순서·저장 시 sortOrd). rows 자체가
       어느 그리드(seriesRows/colRows)인지로 드래그 소스를 식별한다 — 두 그리드를 오가며
       끌리지 않도록 dragSrc.rows !== rows 면 무시한다. */
    const dragSrc = ref(null);   // { rows, idx }
    const onRowDragStart = (rows, idx) => { dragSrc.value = { rows, idx }; };
    const onRowDragOver = (rows, idx) => {
      if (!dragSrc.value || dragSrc.value.rows !== rows || dragSrc.value.idx === idx) return;
      const moved = rows.splice(dragSrc.value.idx, 1)[0];
      rows.splice(idx, 0, moved);
      dragSrc.value.idx = idx;
    };
    const onRowDragEnd = () => { dragSrc.value = null; };

    /* fnPreviewCode — 편집 중인 행의 고유 item_key 미리보기 */
    const fnPreviewCode = (seriesCd, colCd) => {
      const parts = [panelForm.itemKey || '항목키'];
      if (String(seriesCd || '').trim()) parts.push(String(seriesCd).trim());
      if (String(colCd || '').trim()) parts.push(String(colCd).trim());
      return parts.join('-');
    };

    /* ── 시뮬레이션 값 입력 + 미리보기 ──────────────────────────────────────
       구조(시리즈 × 항목)를 짜는 중에 "이 차트가 실제로 어떻게 보이는지"를 바로 확인하기 위한 영역.
       여기 값은 화면 미리보기 전용이며 DB 에 저장하지 않는다 — 실제 값 입력은 데이터관리 화면.
       simVals[시리즈index][항목index] 로 들고 있고, 행/열이 늘거나 줄면 그때그때 맞춰준다. */
    const simVals = reactive([]);

    /* fnSimFit — simVals 를 현재 시리즈/항목 수에 맞춰 늘리거나 줄인다 */
    const fnSimFit = () => {
      const sn = Math.max(seriesRows.length, 1);
      const cn = colRows.length;
      while (simVals.length > sn) simVals.pop();
      while (simVals.length < sn) simVals.push([]);
      simVals.forEach((row) => {
        while (row.length > cn) row.pop();
        while (row.length < cn) row.push(null);
      });
    };

    /* fnSimRandom — 시뮬레이션 값 자동 생성. 시리즈마다 기준값을 달리해 차이가 보이게 한다 */
    const fnSimRandom = () => {
      fnSimFit();
      simVals.forEach((row) => {
        const base = Math.floor(Math.random() * 450) + 50;
        for (let i = 0; i < row.length; i++) {
          row[i] = Math.round(base * (0.6 + Math.random() * 0.8));
        }
      });
      fnSrcRegen();   /* 소스보기 [데이타] 탭도 새 값으로 갱신 */
    };

    const fnSimClear = () => { fnSimFit(); simVals.forEach(r => r.fill(null)); fnSrcRegen(); };

    /* fnSyncSimToForm — 시뮬레이션 값 + 미리보기 스타일을 simJson 으로 직렬화 (저장 직전).
       값이 하나도 없고 스타일도 비면 null 로 둬서 빈 JSON 이 쌓이지 않게 한다 */
    const fnSyncSimToForm = () => {
      const hasVal = simVals.some(r => r.some(v => v !== null && v !== '' && v !== undefined));
      const style = String(srcState.styleSrc || '').trim();
      if (!hasVal && !style) { panelForm.simJson = ''; return; }
      panelForm.simJson = JSON.stringify({
        values: simVals.map(r => r.map(v => (v === '' || v === undefined ? null : v))),
        style: style || undefined,
      });
    };

    /* fnSyncFormToSim — simJson → 시뮬레이션 값 + 스타일 복원 (항목을 열 때).
       구조(시리즈/항목 수)가 그새 바뀌었을 수 있으므로 fnSimFit 범위 안에서만 채운다 */
    const fnSyncFormToSim = () => {
      fnSimFit();
      srcState.styleSrc = '';
      const raw = panelForm.simJson;
      if (!raw || !String(raw).trim()) { fnStyleInject(''); return; }
      try {
        const o = JSON.parse(raw);
        if (Array.isArray(o.values)) {
          o.values.forEach((row, si) => {
            if (!simVals[si] || !Array.isArray(row)) return;
            row.forEach((v, ci) => { if (ci < simVals[si].length) simVals[si][ci] = v; });
          });
        }
        if (o.style) srcState.styleSrc = String(o.style);
      } catch (e) {
        console.warn('[시뮬레이션 값 복원 실패]', e);
      }
      fnStyleInject(srcState.styleSrc);   /* 저장해 둔 스타일을 바로 다시 적용 */
    };

    /* cfSimSeriesNms — 미리보기·입력 그리드의 행 제목 (시리즈 없으면 단일 행) */
    const cfSimSeriesNms = computed(() => (seriesRows.length
      ? seriesRows.map((s, i) => s.name || s.cd || ('시리즈' + (i + 1)))
      : ['(단일)']));

    /* cfSimColNms — 열 제목 */
    const cfSimColNms = computed(() => colRows.map((c, i) => c.name || c.cd || ('항목' + (i + 1))));

    /* cfAutoOption — 입력값으로 자동 생성한 ECharts 옵션.
       pie 는 시리즈 개념이 없어 첫 행만 쓰고, 그 외(bar/line/area 등)는 시리즈별 계열로 그린다. */
    const cfAutoOption = computed(() => {
      const cats = cfSimColNms.value;
      const names = cfSimSeriesNms.value;
      const type = panelForm.chartTypeCd || 'bar';
      const colorOf = (i) => (seriesRows[i] && seriesRows[i].color) || util.PALETTE[i % util.PALETTE.length];
      const at = (si, ci) => {
        const v = simVals[si] ? simVals[si][ci] : null;
        return v === null || v === '' || v === undefined ? 0 : Number(v) || 0;
      };
      if (!cats.length) return {};

      if (type === 'pie' || type === 'doughnut') {
        return {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0, type: 'scroll' },
          series: [{
            type: 'pie',
            radius: type === 'doughnut' ? ['40%', '65%'] : '60%',
            center: ['50%', '45%'],
            data: cats.map((c, ci) => ({ name: c, value: at(0, ci) })),
          }],
        };
      }
      const isArea = type === 'area';
      const base = (isArea || type === 'line') ? 'line' : (type === 'radar' ? 'line' : type);
      return {
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, type: 'scroll' },
        grid: { left: 48, right: 16, top: 20, bottom: 48 },
        xAxis: { type: 'category', data: cats },
        yAxis: { type: 'value' },
        series: names.map((nm, si) => ({
          name: nm,
          type: base === 'scatter' ? 'scatter' : base,
          itemStyle: { color: colorOf(si) },
          areaStyle: isArea ? {} : undefined,
          smooth: base === 'line',
          data: cats.map((c, ci) => at(si, ci)),
        })),
      };
    });

    /* ── 소스보기 (컴포넌트 · 스크립트 · 데이타 · 스타일) ─────────────────────
       구조/값을 그리드로 만지는 것과 별개로, 실제로 어떤 코드·옵션으로 그려지는지 보고
       직접 고쳐서 바로 확인할 수 있게 하는 영역.
       [적용]을 누르면 그 탭의 내용이 미리보기에 반영된다(라이브).
       스크립트/데이타를 직접 고치면 '수동' 상태가 되어 그리드 변경이 덮어쓰지 않는다 —
       사용자가 애써 고친 내용을 그리드 조작이 날려버리지 않게 하려는 것. [되돌리기]로 자동생성 복귀. */
    const SRC_STYLE_ID = 'cm-dash-src-style';       /* 주입 <style> 엘리먼트 id */
    const SRC_PREVIEW_ID = 'cm-dash-src-preview';   /* 스타일 적용 범위 컨테이너 id */

    const srcState = reactive({
      tab: 'component',        /* component | script | data | style */
      componentSrc: '',
      scriptSrc: '',
      dataSrc: '',
      styleSrc: '',
      scriptManual: false,     /* 사용자가 스크립트를 직접 고쳐 적용했는지 */
      scriptErr: '',
      dataErr: '',
      componentErr: '',
      appliedMsg: '',
      previewHeight: '260px',  /* 컴포넌트 탭에서 바꾸는 미리보기 높이 */
      autoApply: true,         /* 실시간 적용 — 입력이 멈추고 1초 뒤 자동 반영 */
      autoPending: false,      /* 자동 반영 대기중 표시 */
    });

    /* 자동 반영 타이머 — 타이핑 중 매 글자마다 반영하면 화면이 튀므로 입력이 멎은 뒤 한 번만 적용 */
    const SRC_AUTO_MS = 1000;
    let _srcTimer = null;

    /* fnSrcTouch — 편집창 입력 시 호출. 실시간 적용이 꺼져 있으면 아무것도 하지 않는다 */
    const fnSrcTouch = () => {
      if (!srcState.autoApply) { srcState.autoPending = false; return; }
      srcState.autoPending = true;
      clearTimeout(_srcTimer);
      _srcTimer = setTimeout(() => {
        srcState.autoPending = false;
        fnSrcApply(true);   /* silent — '적용' 문구를 자동 반영용으로 바꿔 표시 */
      }, SRC_AUTO_MS);
    };

    /* onAutoApplyToggle — 토글을 켜면 지금 내용으로 한 번 맞춰준다(켜자마자 반영되길 기대하므로) */
    const onAutoApplyToggle = () => {
      clearTimeout(_srcTimer);
      srcState.autoPending = false;
      if (srcState.autoApply) fnSrcApply(true);
    };

    /* ── 스크립트 문법 하이라이팅 ────────────────────────────────────────────
       textarea 자체는 색을 못 넣으므로, 같은 위치에 색칠한 <pre> 를 깔고
       그 위에 글자를 투명하게 만든 textarea 를 겹친다(캐럿·선택은 textarea 가 담당).
       스크롤은 두 겹을 같이 움직여야 어긋나지 않는다 → onCodeScroll */
    const hlRef = ref(null);

    /* fnHl — JSON 토큰 색칠. HTML 이스케이프를 먼저 하고 토큰을 감싼다(주입 방지) */
    const fnHl = (code) => {
      const esc = String(code == null ? '' : code)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return esc.replace(
        /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\b\d+\.?\d*(?:[eE][+-]?\d+)?\b)/g,
        (m, str, colon, kw, num) => {
          if (str) {
            return colon
              ? '<span class="cmd-tk-key">' + str + '</span><span class="cmd-tk-p">' + colon + '</span>'
              : '<span class="cmd-tk-str">' + str + '</span>';
          }
          if (kw)  return '<span class="cmd-tk-kw">' + kw + '</span>';
          if (num) return '<span class="cmd-tk-num">' + num + '</span>';
          return m;
        },
      );
    };

    /* cfHlCode - 현재 탭의 하이라이팅 HTML. 끝 개행은 두 겹의 스크롤 정렬용 */
    /* fnHlCss - 스타일 탭용 CSS 하이라이팅. 선택자 / 속성명 / 값을 구분해 칠한다 */
    const fnHlCss = (code) => {
      /* 토큰을 원문에서 나누고 이스케이프는 각 조각에만 한다.
         먼저 이스케이프하면 &lt; 가 만들어낸 ';' 를 CSS 선언 구분자로 오인해 표시가 깨진다. */
      const esc = (t) => String(t == null ? '' : t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const raw = String(code == null ? '' : code);
      const paintDecl = (body) => body.replace(
        /([\w-]+)(\s*:\s*)([^;]*)(;?)/g,
        (mm, prop, colon, val, semi) =>
          '<span class="cmd-tk-key">' + esc(prop) + '</span>'
          + '<span class="cmd-tk-p">' + esc(colon) + '</span>'
          + '<span class="cmd-tk-str">' + esc(val) + '</span>'
          + '<span class="cmd-tk-p">' + esc(semi) + '</span>');
      let out = '', last = 0, m;
      const re = /([^{]*)\{([^}]*)\}/g;
      while ((m = re.exec(raw)) !== null) {
        out += esc(raw.slice(last, m.index))
             + '<span class="cmd-tk-sel">' + esc(m[1]) + '</span>'
             + '<span class="cmd-tk-p">{</span>'
             + paintDecl(m[2])
             + '<span class="cmd-tk-p">}</span>';
        last = m.index + m[0].length;
      }
      return out + esc(raw.slice(last));
    };

    /* 탭 -> 편집 대상 필드. 한 번에 한 탭만 보이므로 편집기 한 벌을 돌려 쓴다 */
    const SRC_FIELD = { component: 'componentSrc', script: 'scriptSrc', data: 'dataSrc', style: 'styleSrc' };
    const cfSrcField = computed(() => SRC_FIELD[srcState.tab] || 'componentSrc');

    /* cfSrcCode - 현재 탭의 소스 (v-model 용 get/set) */
    const cfSrcCode = computed({
      get: () => srcState[cfSrcField.value],
      set: (v) => { srcState[cfSrcField.value] = v; },
    });

    /* cfHlCode - 현재 탭의 하이라이팅 HTML. 끝에 개행을 더해 두 겹의 스크롤이 어긋나지 않게 한다 */
    const cfHlCode = computed(() => (srcState.tab === 'style'
      ? fnHlCss(cfSrcCode.value)
      : fnHl(cfSrcCode.value)) + String.fromCharCode(10));

    /* onCodeScroll — textarea 스크롤을 하이라이팅 레이어에 그대로 옮긴다 */
    const onCodeScroll = (e) => {
      if (!hlRef.value) return;
      hlRef.value.scrollTop = e.target.scrollTop;
      hlRef.value.scrollLeft = e.target.scrollLeft;
    };

    /* 코드 편집기 테마 — 클래스 이름을 cmd- 로 한정해 다른 화면과 충돌하지 않게 한다 */
    const CODE_STYLE_ID = 'cm-dash-code-style';
    const CODE_CSS = [
      '.cmd-code-wrap{position:relative;border-radius:6px;overflow:hidden;background:#0f172a;border:1px solid #1e293b;}',
      '.cmd-code-hl,.cmd-code-ta{margin:0;padding:10px 12px;font-family:Consolas,Monaco,"Courier New",monospace;',
      '  font-size:12px;line-height:1.55;white-space:pre;tab-size:2;border:0;}',
      '.cmd-code-hl{position:absolute;inset:0;overflow:auto;color:#e2e8f0;pointer-events:none;}',
      '.cmd-code-ta{position:relative;width:100%;display:block;background:transparent;color:transparent;',
      '  caret-color:#f8fafc;resize:vertical;overflow:auto;outline:none;}',
      '.cmd-code-ta::selection{background:rgba(96,165,250,.35);}',
      '.cmd-tk-key{color:#7dd3fc;}',   /* 키 */
      '.cmd-tk-str{color:#86efac;}',   /* 문자열 */
      '.cmd-tk-num{color:#fca5a5;}',   /* 숫자 */
      '.cmd-tk-kw{color:#c4b5fd;}',    /* true/false/null */
      '.cmd-tk-p{color:#94a3b8;}',     /* 구두점 */
      '.cmd-tk-sel{color:#fbbf24;}',   /* CSS 선택자 */
    ].join('\n');

    onMounted(() => {
      if (!document.getElementById(CODE_STYLE_ID)) {
        const el = document.createElement('style');
        el.id = CODE_STYLE_ID;
        el.textContent = CODE_CSS;
        document.head.appendChild(el);
      }
    });

    const SRC_TABS = [
      { id: 'component', label: '컴포넌트' },
      { id: 'script',    label: '스크립트' },
      { id: 'data',      label: '데이타' },
      { id: 'style',     label: '스타일' },
    ];

    /* fnSrcRegen — 현재 상태에서 각 탭 소스를 다시 만든다.
       스크립트는 사용자가 직접 고친 경우(scriptManual) 건드리지 않는다. */
    const fnSrcRegen = () => {
      srcState.componentSrc = JSON.stringify({
        itemKey: panelForm.itemKey || '',
        widgetTypeCd: panelForm.widgetTypeCd,
        chartTypeCd: panelForm.chartTypeCd,
        panelWidth: Number(panelForm.panelWidth) || 1,
        panelHeight: Number(panelForm.panelHeight) || 1,
        height: srcState.previewHeight || '260px',
      }, null, 2);

      if (!srcState.scriptManual) {
        srcState.scriptSrc = JSON.stringify(cfAutoOption.value, null, 2);
      }
      srcState.dataSrc = JSON.stringify({
        series: seriesRows.map(r => ({ cd: r.cd, name: r.name, color: r.color })),
        cols:   colRows.map(r => ({ cd: r.cd, name: r.name })),
        values: simVals.map(r => r.slice()),
      }, null, 2);
    };

    /* fnSrcApply — 현재 탭 내용을 실제 상태에 반영.
       @param auto true 면 자동(실시간) 반영 — 안내 문구만 다르게 표시한다 */
    const fnSrcApply = (auto) => {
      const okMsg = (s) => (auto ? '실시간 반영됨 · ' : '') + s;
      srcState.appliedMsg = '';
      if (srcState.tab === 'component') {
        srcState.componentErr = '';
        try {
          const o = JSON.parse(srcState.componentSrc || '{}');
          if (o.itemKey !== undefined)     panelForm.itemKey = String(o.itemKey);
          if (o.widgetTypeCd)              panelForm.widgetTypeCd = o.widgetTypeCd;
          if (o.chartTypeCd)               panelForm.chartTypeCd = o.chartTypeCd;
          if (o.panelWidth !== undefined)  panelForm.panelWidth = Number(o.panelWidth) || 1;
          if (o.panelHeight !== undefined) panelForm.panelHeight = Number(o.panelHeight) || 1;
          if (o.height) srcState.previewHeight = String(o.height);
          srcState.appliedMsg = okMsg('컴포넌트 설정을 반영했습니다.');
          if (!srcState.scriptManual) fnSrcRegen();
        } catch (e) { srcState.componentErr = 'JSON 오류: ' + e.message; }
        return;
      }
      if (srcState.tab === 'script') {
        srcState.scriptErr = '';
        try {
          JSON.parse(srcState.scriptSrc || '{}');   /* 파싱만 검증하고 실제 사용은 computed 에서 */
          srcState.scriptManual = true;             /* 이후 그리드 변경이 덮어쓰지 않게 고정 */
          srcState.appliedMsg = okMsg('스크립트를 미리보기에 반영했습니다. (수동 모드)');
        } catch (e) { srcState.scriptErr = 'JSON 오류: ' + e.message; }
        return;
      }
      if (srcState.tab === 'data') {
        srcState.dataErr = '';
        try {
          const o = JSON.parse(srcState.dataSrc || '{}');
          if (Array.isArray(o.series)) {
            seriesRows.splice(0, seriesRows.length, ...o.series.map(x => ({
              cd: x && x.cd ? String(x.cd) : '', name: x && x.name ? String(x.name) : '',
              color: x && x.color ? String(x.color) : '' })));
          }
          if (Array.isArray(o.cols)) {
            colRows.splice(0, colRows.length, ...o.cols.map(x => ({
              cd: x && x.cd ? String(x.cd) : '', name: x && x.name ? String(x.name) : '', color: '' })));
          }
          fnSimFit();
          if (Array.isArray(o.values)) {
            o.values.forEach((row, si) => {
              if (!simVals[si] || !Array.isArray(row)) return;
              row.forEach((v, ci) => { if (ci < simVals[si].length) simVals[si][ci] = v; });
            });
          }
          srcState.appliedMsg = okMsg('데이타를 그리드·미리보기에 반영했습니다.');
          if (!srcState.scriptManual) fnSrcRegen();
        } catch (e) { srcState.dataErr = 'JSON 오류: ' + e.message; }
        return;
      }
      /* style — 미리보기 영역에만 적용되도록 선택자에 컨테이너 id 를 붙여 주입 */
      fnStyleInject(srcState.styleSrc);
      srcState.appliedMsg = okMsg('스타일을 미리보기에 적용했습니다.');
    };

    /* fnSrcReset — 자동생성 상태로 되돌린다 (수동 모드 해제) */
    const fnSrcReset = () => {
      srcState.scriptManual = false;
      srcState.scriptErr = ''; srcState.dataErr = ''; srcState.componentErr = '';
      srcState.appliedMsg = '자동생성 내용으로 되돌렸습니다.';
      fnSrcRegen();
    };

    /* fnStyleScope — 사용자가 쓴 CSS 선택자 앞에 미리보기 컨테이너 id 를 붙여 범위를 가둔다.
       (그대로 주입하면 관리자 화면 전체 스타일이 망가진다)
       @media/@keyframes 같은 at-rule 블록은 건드리지 않고 그대로 둔다. */
    const fnStyleScope = (css) => {
      const src = String(css || '');
      if (!src.trim()) return '';
      return src.replace(/(^|\})\s*([^{}@]+)\{/g, (m, close, sel) => {
        const scoped = sel.split(',')
          .map(s => s.trim()).filter(Boolean)
          .map(s => '#' + SRC_PREVIEW_ID + ' ' + s)
          .join(', ');
        return (close || '') + '\n' + scoped + ' {';
      });
    };

    /* fnStyleInject — <style> 엘리먼트 하나를 만들어 두고 내용만 갈아끼운다 */
    const fnStyleInject = (css) => {
      let el = document.getElementById(SRC_STYLE_ID);
      if (!el) {
        el = document.createElement('style');
        el.id = SRC_STYLE_ID;
        document.head.appendChild(el);
      }
      el.textContent = fnStyleScope(css);
    };

    /* 화면을 떠날 때 주입한 스타일을 반드시 제거 — 남으면 다른 화면까지 영향을 준다 */
    onUnmounted(() => {
      clearTimeout(_srcTimer);
      [SRC_STYLE_ID, CODE_STYLE_ID].forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    });

    /* cfPreviewOption — 미리보기에 실제로 쓰는 옵션.
       스크립트를 직접 고쳐 적용했으면 그것을, 아니면 자동생성 옵션을 쓴다. */
    const cfPreviewOption = computed(() => {
      if (srcState.scriptManual) {
        try { return JSON.parse(srcState.scriptSrc || '{}'); } catch (e) { /* 깨진 동안은 자동으로 */ }
      }
      return cfAutoOption.value;
    });

    /* ── 3레벨 트리 헬퍼 ────────────────────────────────────────────────────
       서버가 준 평면 배열에서 "접힌 조상"이 있는 노드만 걸러 화면에 그린다.
       lvl2 는 자기 차트(lvl1)가 접히면 숨고, lvl3 는 차트 또는 시리즈가 접히면 숨는다. */

    /* fnParentCode — 노드의 부모 itemCode ('A-B-C' → 'A-B') */
    const fnParentCode = (code) => {
      const i = String(code || '').lastIndexOf('-');
      return i < 0 ? '' : String(code).slice(0, i);
    };

    /* cfFirstSeriesKeys — 차트별 "첫 번째 시리즈" itemKey 집합.
       시리즈끼리 항목(3레벨) 정의를 공유하므로(syncChildren 이 열 정의 1벌을 모든 시리즈에 동일
       적용), 트리에 항목을 매 시리즈마다 반복해 보여줄 필요가 없다 — 첫 시리즈에서만 펼쳐 보이고
       2번째 시리즈부터는 항목 자체를 목록에서 뺀다(값은 각 시리즈마다 실제로 별도 행이라
       데이터관리·저장에는 영향 없음, 여기 트리 "표시"만 줄이는 것). */
    const cfFirstSeriesKeys = computed(() => {
      const seenChart = new Set(); const out = new Set();
      treeRows.forEach(n => {
        if (n.lvl !== 2) return;
        const chartKey = fnParentCode(n.itemKey);
        if (seenChart.has(chartKey)) return;
        seenChart.add(chartKey);
        out.add(n.itemKey);
      });
      return out;
    });
    const fnIsFirstSeries = (node) => cfFirstSeriesKeys.value.has(node.itemKey);

    /* cfTreeVisible — 접힘 상태 + "2번째 시리즈부터는 항목 생략" 규칙을 반영한 표시 대상 노드 */
    const cfTreeVisible = computed(() => treeRows.filter((n) => {
      if (n.lvl === 1) return true;
      if (n.lvl === 3 && !cfFirstSeriesKeys.value.has(fnParentCode(n.itemKey))) return false;
      /* 조상 코드를 하나씩 거슬러 올라가며 접힌 게 있으면 숨김 */
      let p = fnParentCode(n.itemKey);
      while (p) {
        if (treeState.collapsed[p]) return false;
        p = fnParentCode(p);
      }
      return true;
    }));

    /* fnHasChild — 자식이 있는 노드만 ▼/▶ 아이콘을 보여준다.
       2번째 시리즈부터는 항목을 안 보여주므로(cfTreeVisible 규칙) 펼쳐도 나올 게 없다 —
       화살표 자체를 숨겨 "눌러도 안 열리는" 혼란을 막는다. */
    const fnHasChild = (node) => {
      if (node.lvl === 2 && !fnIsFirstSeries(node)) return false;
      return treeRows.some(n => fnParentCode(n.itemKey) === node.itemKey);
    };

    /* fnToggleNode — 접기/펼치기 */
    const fnToggleNode = (node) => {
      if (!fnHasChild(node)) return;
      if (treeState.collapsed[node.itemKey]) delete treeState.collapsed[node.itemKey];
      else treeState.collapsed[node.itemKey] = true;
    };

    const fnTreeExpandAll   = () => { Object.keys(treeState.collapsed).forEach(k => delete treeState.collapsed[k]); };
    const fnTreeCollapseAll = () => { treeRows.forEach(n => { if (fnHasChild(n)) treeState.collapsed[n.itemKey] = true; }); };

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
      { key: 'widgetTypeCd', label: '유형', style: 'width:88px;',
        fmt: (v, row) => util.itemTypeIcon(util.itemTypeOf(row)) + ' ' + util.itemTypeLabel(util.itemTypeOf(row)) },
      { key: 'chartTypeCd', label: '차트종류', style: 'width:96px;',
        fmt: (v, row) => util.itemTypeOf(row) === 'CHART' ? util.chartTypeIcon(v) + ' ' + util.chartTypeLabel(v) : '-' },
      { key: '_seriesCnt', label: '시리즈개수', style: 'width:84px;', align: 'center', fmt: (v, row) => (row._seriesCnt || 0) + '개' },
      { key: '_colCnt', label: '데이타열개수', style: 'width:90px;', align: 'center', fmt: (v, row) => (row._colCnt || 0) + '개' },
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
      { key: 'widgetTypeCd', label: '항목유형', type: 'select',
        options: () => util.ITEM_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      /* 차트종류는 차트일 때만 물어본다 — KPI·목록에는 의미가 없다 */
      { key: 'chartTypeCd', label: '차트종류', type: 'select',
        visible: (form) => form.widgetTypeCd === 'CHART',
        options: () => util.CHART_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      { key: 'seriesOrientCd', label: '시리즈 배치 방향', type: 'select',
        options: () => [
          { value: 'ROW', label: '행 (시리즈=행 · 항목=열, 기본)' },
          { value: 'COL', label: '열 (항목=행 · 시리즈=열)' },
        ],
        hint: '데이터관리 그리드에서 시리즈를 행에 둘지 열에 둘지 — 항목이 많고 시리즈가 적으면 열로 바꾸면 편함' },
      { key: 'autoCollectYn', label: '자동수집여부', type: 'select',
        options: () => [{ value: 'N', label: '아니오 (직접입력, 기본)' }, { value: 'Y', label: '예 (배치가 채움)' }],
        onChange: (v) => { if (v === 'Y') panelForm.editableYn = 'N'; },
        hint: '예로 두면 SyStatsDashboardJob 배치가 매일 실 EC 데이터를 집계해 채운다' },
      { key: 'editableYn', label: '데이터관리 편집여부', type: 'select',
        options: () => [{ value: 'Y', label: '가능 (기본)' }, { value: 'N', label: '불가 (자동수집 값 보호)' }],
        hint: '아니오면 데이터관리 그리드에서 이 차트의 값 입력칸이 비활성화된다' },
      { key: 'inputOpts', label: '입력 기준조건 키', type: 'text', mono: true, colSpan: 2,
        placeholder: '예: period_type_cd:M,site_id,yyyymmdd (비우면 이 기본값 적용)',
        hint: 'cm_dashboard_data.data_opts 와 같은 key:value 콤마결합 형식 — 이 차트 값이 어느 차원 조합으로 찾아지는지' },
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
        hint: '지정하면 아래 시리즈의 코드 칸이 공통코드 선택으로 바뀐다',
        onChange: () => onGrpChange() },
      { key: 'lvl2CodeGrp', label: '3레벨(항목) 코드그룹', type: 'text', mono: true,
        placeholder: '예: MONTH (비우면 직접입력)',
        hint: '지정하면 아래 항목의 코드 칸이 공통코드 선택으로 바뀐다',
        onChange: () => onGrpChange() },
      { key: '_itemCodeSample', label: '고유 item_key 형식', type: 'readonly',
        fmt: () => (panelForm.itemKey || '항목키') + '-시리즈cd-항목cd' },
      /* JSON 직접 입력 대신 행 그리드로 편집한다 (저장 시 JSON 으로 직렬화) */
      { key: '_seriesGrid', label: '2레벨 · 시리즈 정의', type: 'slot', name: 'seriesGrid', colSpan: 3 },
      { key: '_colsGrid',   label: '3레벨 · 항목 정의',   type: 'slot', name: 'colsGrid',   colSpan: 3 },
      /* 구조를 짜는 중에 실제 모양을 바로 확인하는 영역 (저장 대상 아님) */
      { type: 'group', label: '시뮬레이션 값 입력 · 미리보기' },
      { key: '_simGrid',    label: '시뮬레이션 값 (미저장)', type: 'slot', name: 'simGrid',   colSpan: 3 },
      { key: '_simPreview', label: '미리보기',              type: 'slot', name: 'simPreview', colSpan: 3 },
      { key: '_srcView',    label: '소스보기',              type: 'slot', name: 'srcView',    colSpan: 3 },
      { key: 'optionJson', label: 'ECharts 옵션 오버라이드 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '{"legend":{"show":false}}' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, panels, panelCnt, uiState, codes, searchParam,
      dashState, panelDetail, panelForm, panelErrors, columns, util,
      cfCurDash, cfDtlMode,
      /* 3레벨 트리 */
      treeRows, treeState, cfTreeVisible,
      fnHasChild, fnToggleNode, fnTreeExpandAll, fnTreeCollapseAll, fnIsFirstSeries,
      fnLvlBullet, fnLvlColor, fnLvlLabel,
      /* 2·3레벨 편집 그리드 */
      seriesRows, colRows, grpCodes,
      fnGrpOptions, onGrpChange, onPickCode, fnPreviewCode,
      fnAddSeriesRow, fnAddColRow, fnDelSeriesRow, fnDelColRow,
      onRowDragStart, onRowDragOver, onRowDragEnd,
      /* 시뮬레이션 값 · 미리보기 */
      simVals, fnSimFit, fnSimRandom, fnSimClear, fnPanelOf,
      cfSimSeriesNms, cfSimColNms, cfPreviewOption,
      /* 소스보기 */
      srcState, SRC_TABS, fnSrcApply, fnSrcReset,
      fnSrcTouch, onAutoApplyToggle, cfHlCode, cfSrcCode, onCodeScroll, hlRef,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */ `
<bo-page title="대시보드 항목관리"
  desc-summary="대시보드에 속한 항목을 등록·수정합니다. 대시보드 정의는 대시보드 관리, 배치·크기는 대시보드 항목배치 화면을 이용하세요.">
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
    <bo-container title="대시보드 항목 목록"
      :count-text="dashState.selectedId ? '총 ' + panels.length + '개' : ''">
      <template #toolbar-actions>
        <!-- 영역을 숨기지 않고 버튼만 잠근다 (미선택 상태에서도 무엇을 할 수 있는지 보여야 한다) -->
        <button class="btn" :class="uiState.viewMode === 'tree' ? 'btn-primary' : ''"
          @click="uiState.viewMode = 'tree'">🌳 트리</button>
        <button class="btn" :class="uiState.viewMode === 'grid' ? 'btn-primary' : ''"
          @click="uiState.viewMode = 'grid'">▤ 목록</button>
        <button class="btn" :disabled="!dashState.selectedId" @click="handleBtnAction('dash-layout')"
          style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;font-weight:700;">🧩 항목배치 열기</button>
        <button class="btn btn_new" :disabled="!dashState.selectedId" @click="handleBtnAction('panels-add')">+ 항목 추가</button>
      </template>
      <div style="padding:8px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;">
        <template v-if="dashState.selectedId">
          <b>{{ cfCurDash ? cfCurDash.dashboardNm : '' }}</b>
          <span style="color:#aaa;font-family:monospace;font-size:11px;">{{ cfCurDash ? cfCurDash.uiCompNm : '' }}</span>
        </template>
        <span v-else style="color:#aaa;">대시보드 미선택</span>
        <template v-if="uiState.viewMode === 'tree' ? !!dashState.selectedId : false">
          <span style="margin-left:auto;display:flex;gap:4px;">
            <button class="btn btn_expand_all" @click="fnTreeExpandAll()">전체펼치기</button>
            <button class="btn btn_collapse_all" @click="fnTreeCollapseAll()">전체닫기</button>
          </span>
        </template>
      </div>

      <!-- ===== ■. 3레벨 트리 (1:차트 / 2:시리즈 / 3:항목) ===================== -->
      <div v-if="uiState.viewMode === 'tree'">
        <div v-if="cfTreeVisible.length" style="max-height:520px;overflow:auto;">
          <table class="bo-table bo-table-narrow">
            <thead>
              <tr>
                <th style="width:56px;">레벨</th>
                <th>항목명 (차트 · 시리즈 · 항목)</th>
                <th style="width:120px;">코드</th>
                <th style="width:210px;">고유 item_key</th>
                <th style="width:96px;">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in cfTreeVisible" :key="node.itemKey"
                :class="node.lvl === 1 ? (panelDetail.selectedId === node.dashboardItemId ? 'bo-row-selected' : '') : ''">
                <td style="text-align:center;">
                  <span class="badge" :class="node.lvl === 1 ? 'badge-red' : (node.lvl === 2 ? 'badge-blue' : 'badge-gray')">
                    {{ fnLvlLabel(node.lvl) }}</span>
                </td>
                <td>
                  <span :style="{ display:'inline-flex', alignItems:'center', gap:'4px',
                                  marginLeft:((node.lvl - 1) * 18) + 'px' }">
                    <span @click.stop="fnToggleNode(node)"
                      :style="{ cursor: fnHasChild(node) ? 'pointer' : 'default', width:'12px',
                                color:'#94a3b8', fontSize:'10px', userSelect:'none' }">
                      {{ fnHasChild(node) ? (treeState.collapsed[node.itemKey] ? '▶' : '▼') : '' }}
                    </span>
                    <span :style="{ color: fnLvlColor(node.lvl), fontSize: node.lvl === 1 ? '9px' : '11px' }">
                      {{ fnLvlBullet(node.lvl) }}</span>
                    <span :style="{ fontWeight: node.lvl === 1 ? 700 : (node.lvl === 2 ? 600 : 400),
                                    color: node.lvl === 3 ? '#475569' : '' }">{{ node.itemNm }}</span>
                    <span v-if="node.lvl === 1" class="badge badge-gray" style="margin-left:4px;">
                      {{ node.widgetTypeCd === 'CHART' ? (node.chartTypeCd || 'chart') : node.widgetTypeCd }}</span>
                    <span v-if="node.lvl === 2 ? !fnIsFirstSeries(node) : false"
                      style="font-size:10px;color:#c2410c;margin-left:2px;">(항목은 1번째 시리즈 참고)</span>
                  </span>
                </td>
                <td style="font-family:monospace;font-size:11px;color:#2563eb;">{{ node.itemCd }}</td>
                <td style="font-family:monospace;font-size:11px;color:#64748b;">{{ node.itemKey }}</td>
                <td style="text-align:center;">
                  <!-- 시리즈·항목은 차트 정의(JSON)의 일부라 개별 삭제가 아니라 차트 수정에서 다룬다 -->
                  <!-- 실제 항목 행을 넘겨야 한다 — id 만 넘기면 폼이 빈 값으로 열린다 -->
                  <button v-if="node.lvl === 1" class="btn btn_row_edit"
                    @click.stop="handleGridCellAction('panels-cellClick', 'btn_row_edit', fnPanelOf(node.dashboardItemId))">수정</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else style="padding:32px;text-align:center;color:#aaa;">
          {{ dashState.selectedId ? '항목이 없습니다. [+ 항목 추가]로 등록하세요.' : '좌측에서 대시보드를 선택하면 항목 트리가 표시됩니다.' }}
        </div>
        <div v-if="cfTreeVisible.length" style="padding:6px 12px;font-size:11px;color:#94a3b8;border-top:1px solid #f0f0f0;">
          2·3레벨은 차트의 <b>시리즈 정의 JSON</b> / <b>항목 정의 JSON</b> 에서 옵니다 — 차트 행의 [수정]에서 편집하세요.
        </div>
      </div>

      <!-- ===== ■. 평면 목록 (기존 그리드) =================================== -->
      <bo-grid v-if="uiState.viewMode === 'grid'"
        bare :columns="columns.panels" :rows="panels" row-key="dashboardItemId"
        :loading="uiState.panelLoading" :selected-key="panelDetail.selectedId"
        :row-class="row => panelDetail.selectedId === row.dashboardItemId ? 'active' : ''"
        :empty-text="dashState.selectedId ? '항목이 없습니다. [+ 항목 추가]로 등록하세요.' : '좌측에서 대시보드를 선택하면 대시보드 항목 목록이 표시됩니다.'"
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
  <bo-container :title="!panelDetail.show ? '대시보드 위젯항목 상세' : (panelDetail.isNew ? '대시보드 위젯항목 신규' : (cfDtlMode ? '대시보드 위젯항목 상세' : '대시보드 위젯항목 수정'))"
    :title-id="panelDetail.selectedId ? panelForm.dashboardItemId : ''">
    <div v-if="panelDetail.show" style="padding:12px;">
      <!-- compact: 상품수정(PdProdDtl) 과 같은 폼 높이·간격 기준 -->
      <bo-form-area :columns="columns.panelForm" :form="panelForm" :errors="panelErrors"
        :cols="3" :show-actions="false" :readonly="cfDtlMode" compact plain-readonly>

        <!-- ===== ■. 2레벨 시리즈 정의 (행 그리드) ========================= -->
        <template #seriesGrid>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="padding:6px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
              <button class="btn btn_new" :disabled="cfDtlMode" @click="fnAddSeriesRow()">+ 시리즈 추가</button>
            </div>
            <table class="bo-table bo-table-narrow">
              <thead>
                <tr>
                  <th style="width:28px;"></th>
                  <th style="width:44px;">순서</th>
                  <th style="width:190px;">코드 (cd)</th>
                  <th>시리즈명 (name)</th>
                  <th style="width:150px;">색상 (color)</th>
                  <th style="width:230px;">고유 item_key 미리보기</th>
                  <th style="width:60px;">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in seriesRows" :key="'s'+i"
                  :draggable="!cfDtlMode" @dragstart="onRowDragStart(seriesRows, i)"
                  @dragover.prevent="onRowDragOver(seriesRows, i)" @dragend="onRowDragEnd">
                  <td style="text-align:center;cursor:grab;color:#bbb;font-size:16px;user-select:none;">☰</td>
                  <td style="text-align:center;color:#94a3b8;">{{ i + 1 }}</td>
                  <td>
                    <!-- 코드그룹이 지정되면 선택, 아니면 직접입력 -->
                    <select v-if="fnGrpOptions(panelForm.lvl1CodeGrp).length" class="form-control"
                      v-model="r.cd" :disabled="cfDtlMode" @change="onPickCode(r, panelForm.lvl1CodeGrp)">
                      <option value="">-- 선택 --</option>
                      <option v-for="o in fnGrpOptions(panelForm.lvl1CodeGrp)" :key="o.codeValue" :value="o.codeValue">
                        {{ o.codeLabel }} ({{ o.codeValue }})</option>
                    </select>
                    <input v-else type="text" class="form-control" v-model="r.cd" :disabled="cfDtlMode"
                      placeholder="예: CH_COUPANG (비우면 이름이 코드)" style="font-family:monospace;font-size:11px;" />
                  </td>
                  <td><input type="text" class="form-control" v-model="r.name" :disabled="cfDtlMode" placeholder="예: 쿠팡" /></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:4px;">
                      <input type="color" v-model="r.color" :disabled="cfDtlMode"
                        style="width:32px;height:26px;padding:0;border:1px solid #d1d5db;border-radius:4px;" />
                      <input type="text" class="form-control" v-model="r.color" :disabled="cfDtlMode"
                        placeholder="#6366f1" style="font-family:monospace;font-size:11px;" />
                    </div>
                  </td>
                  <td style="font-family:monospace;font-size:11px;color:#64748b;">{{ fnPreviewCode(r.cd || r.name, '') }}</td>
                  <td style="text-align:center;white-space:nowrap;">
                    <button class="btn btn_row_delete" :disabled="cfDtlMode" @click="fnDelSeriesRow(i)">삭제</button>
                  </td>
                </tr>
                <tr v-if="!seriesRows.length">
                  <td colspan="7" style="text-align:center;color:#aaa;padding:14px;">
                    시리즈가 없습니다. [+ 시리즈 추가]로 등록하세요. (없으면 단일 시리즈로 동작)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- ===== ■. 3레벨 항목 정의 (행 그리드) ========================== -->
        <template #colsGrid>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="padding:6px;background:#fafafa;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;">
              <button class="btn btn_new" :disabled="cfDtlMode" @click="fnAddColRow()">+ 항목 추가</button>
              <span style="font-size:11px;color:#94a3b8;">
                시리즈 {{ seriesRows.length || 1 }}개 × 항목 {{ colRows.length }}개 =
                <b>{{ (seriesRows.length || 1) * colRows.length }}</b>개 행이 트리 3레벨에 생성됩니다.</span>
            </div>
            <table class="bo-table bo-table-narrow">
              <thead>
                <tr>
                  <th style="width:28px;"></th>
                  <th style="width:44px;">순서</th>
                  <th style="width:190px;">코드 (cd)</th>
                  <th>항목명 (name)</th>
                  <th style="width:230px;">고유 item_key 미리보기</th>
                  <th style="width:60px;">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in colRows" :key="'c'+i"
                  :draggable="!cfDtlMode" @dragstart="onRowDragStart(colRows, i)"
                  @dragover.prevent="onRowDragOver(colRows, i)" @dragend="onRowDragEnd">
                  <td style="text-align:center;cursor:grab;color:#bbb;font-size:16px;user-select:none;">☰</td>
                  <td style="text-align:center;color:#94a3b8;">{{ i + 1 }}</td>
                  <td>
                    <select v-if="fnGrpOptions(panelForm.lvl2CodeGrp).length" class="form-control"
                      v-model="r.cd" :disabled="cfDtlMode" @change="onPickCode(r, panelForm.lvl2CodeGrp)">
                      <option value="">-- 선택 --</option>
                      <option v-for="o in fnGrpOptions(panelForm.lvl2CodeGrp)" :key="o.codeValue" :value="o.codeValue">
                        {{ o.codeLabel }} ({{ o.codeValue }})</option>
                    </select>
                    <input v-else type="text" class="form-control" v-model="r.cd" :disabled="cfDtlMode"
                      placeholder="예: M01 (비우면 이름이 코드)" style="font-family:monospace;font-size:11px;" />
                  </td>
                  <td><input type="text" class="form-control" v-model="r.name" :disabled="cfDtlMode" placeholder="예: 1월" /></td>
                  <td style="font-family:monospace;font-size:11px;color:#64748b;">
                    {{ fnPreviewCode(seriesRows.length ? (seriesRows[0].cd || seriesRows[0].name) : '', r.cd || r.name) }}</td>
                  <td style="text-align:center;white-space:nowrap;">
                    <button class="btn btn_row_delete" :disabled="cfDtlMode" @click="fnDelColRow(i)">삭제</button>
                  </td>
                </tr>
                <tr v-if="!colRows.length">
                  <td colspan="6" style="text-align:center;color:#aaa;padding:14px;">
                    항목이 없습니다. 비워두면 데이터관리 화면에서 열 제목을 직접 입력합니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- ===== ■. 시뮬레이션 값 입력 (미저장 · 미리보기 전용) ============ -->
        <template #simGrid>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="padding:6px 8px;background:#fff7ed;border-bottom:1px solid #fed7aa;display:flex;align-items:center;gap:8px;">
              <span style="font-size:11.5px;color:#c2410c;">
                여기 값은 <b>미리보기 전용</b>입니다 — 저장되지 않습니다. 실제 값 입력은 [대시보드 데이타관리].</span>
              <span style="margin-left:auto;display:flex;gap:4px;">
                <button class="btn" @click="fnSimRandom()"
                  style="background:#fff;color:#c2410c;border:1px solid #fed7aa;font-weight:700;">🎲 데이타자동생성</button>
                <button class="btn btn_reset" @click="fnSimClear()">비우기</button>
              </span>
            </div>
            <div v-if="colRows.length" style="overflow-x:auto;">
              <table class="bo-table bo-table-narrow">
                <thead>
                  <tr>
                    <th style="width:150px;">시리즈 \\ 항목</th>
                    <th v-for="(c, ci) in cfSimColNms" :key="'sc'+ci" style="min-width:96px;">{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(nm, si) in cfSimSeriesNms" :key="'sr'+si">
                    <td style="font-weight:600;background:#f8fafc;">{{ nm }}</td>
                    <td v-for="(c, ci) in cfSimColNms" :key="'sv'+si+'_'+ci" style="padding:2px 4px;">
                      <input type="number" class="form-control" style="text-align:right;"
                        :value="simVals[si] ? simVals[si][ci] : null"
                        @input="e => { fnSimFit(); simVals[si][ci] = e.target.value; }" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else style="padding:18px;text-align:center;color:#aaa;font-size:12px;">
              먼저 위에서 <b>3레벨 항목</b>을 추가하면 값 입력칸이 생깁니다.</div>
          </div>
        </template>

        <!-- ===== ■. 미리보기 (입력값 기준 실제 차트) ====================== -->
        <template #simPreview>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
              <span style="font-weight:700;font-size:12.5px;color:#1f4a73;">{{ panelForm.itemNm || '(항목명 미입력)' }}</span>
              <span class="badge badge-blue">{{ panelForm.chartTypeCd || '-' }}</span>
              <span style="margin-left:auto;font-size:11px;color:#94a3b8;">
                차트종류를 바꾸면 미리보기가 즉시 반영됩니다</span>
            </div>
            <!-- id 는 스타일 탭의 CSS 적용 범위를 가두는 기준점 -->
            <div v-if="colRows.length" id="cm-dash-src-preview" style="padding:8px;">
              <co-echart :option="cfPreviewOption" :height="srcState.previewHeight || '260px'" not-merge />
            </div>
            <div v-else style="padding:28px;text-align:center;color:#aaa;font-size:12px;">
              항목(3레벨)과 시뮬레이션 값을 입력하면 차트가 표시됩니다.</div>
          </div>
        </template>

        <!-- ===== ■. 소스보기 (컴포넌트 / 스크립트 / 데이타 / 스타일) ======== -->
        <template #srcView>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <!-- 탭 -->
            <div style="display:flex;align-items:center;gap:4px;padding:6px 8px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
              <button v-for="t in SRC_TABS" :key="t.id" class="btn"
                :class="srcState.tab === t.id ? 'btn-primary' : ''"
                @click="srcState.tab = t.id">{{ t.label }}</button>
              <span v-if="srcState.scriptManual" class="badge badge-orange" style="margin-left:4px;">스크립트 수동</span>
              <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <!-- 실시간 적용 토글 — 켜면 입력이 멎고 1초 뒤 자동 반영 -->
                <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11.5px;color:#475569;white-space:nowrap;">
                  <input type="checkbox" v-model="srcState.autoApply" @change="onAutoApplyToggle()" />
                  실시간 적용
                  <span v-if="srcState.autoPending" style="color:#c2410c;">…1초 후 반영</span>
                </label>
                <button class="btn btn_apply" @click="fnSrcApply(false)">적용</button>
                <button class="btn btn_reset" @click="fnSrcReset()">되돌리기</button>
              </span>
            </div>

            <!-- 안내 + 오류 -->
            <div style="padding:5px 10px;font-size:11px;border-bottom:1px solid #f0f0f0;"
              :style="{ background: (srcState.scriptErr || srcState.dataErr || srcState.componentErr) ? '#fef2f2' : '#fff' }">
              <template v-if="srcState.tab === 'component'">
                <span style="color:#64748b;">위젯 설정(JSON). 고치고 [적용]하면 폼과 미리보기에 반영됩니다.</span>
                <span v-if="srcState.componentErr" style="color:#dc2626;margin-left:8px;">{{ srcState.componentErr }}</span>
              </template>
              <template v-else-if="srcState.tab === 'script'">
                <span style="color:#64748b;">ECharts 옵션(JSON). [적용]하면 <b>수동 모드</b>가 되어 그리드 변경이 이 내용을 덮지 않습니다.</span>
                <span v-if="srcState.scriptErr" style="color:#dc2626;margin-left:8px;">{{ srcState.scriptErr }}</span>
              </template>
              <template v-else-if="srcState.tab === 'data'">
                <span style="color:#64748b;">시리즈·항목·값(JSON). [적용]하면 위 편집 그리드와 미리보기에 반영됩니다.</span>
                <span v-if="srcState.dataErr" style="color:#dc2626;margin-left:8px;">{{ srcState.dataErr }}</span>
              </template>
              <template v-else>
                <span style="color:#64748b;">CSS. 선택자에 미리보기 컨테이너가 자동으로 붙어 <b>미리보기 영역에만</b> 적용됩니다.</span>
              </template>
              <span v-if="srcState.appliedMsg" style="color:#059669;margin-left:8px;">✓ {{ srcState.appliedMsg }}</span>
            </div>

            <!-- 편집 영역 — 네 탭 모두 같은 코드 편집기(다크+하이라이팅)를 돌려 쓴다 -->
            <div style="padding:8px;">
              <!-- 컴포넌트 탭: 실제 렌더 마크업과 데이터가 어디서 오는지 먼저 보여준다 -->
              <div v-if="srcState.tab === 'component'" class="cmd-code-wrap"
                style="margin-bottom:8px;padding:10px 12px;">
                <div style="font-family:Consolas,Monaco,monospace;font-size:12px;line-height:1.7;color:#e2e8f0;">
                  <span style="color:#94a3b8;">&lt;</span><span style="color:#7dd3fc;">co-echart</span>
                  <span style="color:#fbbf24;">:option</span><span style="color:#94a3b8;">=</span><span style="color:#86efac;">"cfPreviewOption"</span>
                  <span style="color:#fbbf24;">height</span><span style="color:#94a3b8;">=</span><span style="color:#86efac;">"{{ srcState.previewHeight || '260px' }}"</span>
                  <span style="color:#fbbf24;">not-merge</span>
                  <span style="color:#94a3b8;">/&gt;</span>
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #1e293b;
                            font-family:Consolas,Monaco,monospace;font-size:11px;line-height:1.8;color:#94a3b8;">
                  <div><span style="color:#c4b5fd;">cfPreviewOption</span> ← <b style="color:#e2e8f0;">스크립트</b> 탭 (ECharts 옵션)</div>
                  <div>├ <span style="color:#7dd3fc;">xAxis.data</span> ← <b style="color:#e2e8f0;">데이타</b>.cols[].name
                    <span style="color:#64748b;">(3레벨 항목 {{ colRows.length }}개)</span></div>
                  <div>├ <span style="color:#7dd3fc;">series[].name</span> ← <b style="color:#e2e8f0;">데이타</b>.series[].name
                    <span style="color:#64748b;">(2레벨 시리즈 {{ seriesRows.length || 1 }}개)</span></div>
                  <div>└ <span style="color:#7dd3fc;">series[].data</span> ← <b style="color:#e2e8f0;">데이타</b>.values[시리즈][항목]
                    <span style="color:#64748b;">(시뮬레이션 값)</span></div>
                </div>
              </div>

              <!-- 색칠한 <pre> 위에 글자 투명 textarea 를 겹쳐 편집 (캐럿·선택은 textarea 담당) -->
              <div class="cmd-code-wrap">
                <pre ref="hlRef" class="cmd-code-hl" v-html="cfHlCode"></pre>
                <textarea class="cmd-code-ta" v-model="cfSrcCode" spellcheck="false"
                  :rows="srcState.tab === 'component' ? 9 : (srcState.tab === 'style' ? 10 : 16)"
                  :placeholder="srcState.tab === 'style' ? '.echart-box { border: 1px solid #ddd; border-radius: 8px; }' : ''"
                  @input="fnSrcTouch()" @scroll="onCodeScroll"></textarea>
              </div>
            </div>
          </div>
        </template>
      </bo-form-area>
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
      대시보드 항목 목록에서 항목을 선택하거나 [+ 항목 추가]를 클릭하세요.</div>
  </bo-container>
</bo-page>
`,
};

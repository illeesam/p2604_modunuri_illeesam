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
    /* panelsPager — 대시보드 위젯항목 목록(트리·목록 공통)은 차트(1레벨) 단위로 페이징한다.
       API 가 페이징 없이 전체를 내려주므로 클라이언트에서 30건씩 자른다(CRUD 전체 로드
       그리드의 표준 페이징 예외). 트리 모드도 이 pager 가 정한 "이번 페이지 차트 집합"에
       속한 노드만 보여줘 부모(차트)와 자식(시리즈·항목)이 페이지 경계로 갈라지지 않는다 */
    const panelsPager = reactive({ pageNo: 1, pageSize: 30, pageTotalPage: 1, pageTotalCount: 0,
      pageSizes: [10, 20, 30, 50, 100] });
    const uiState = reactive({ loading: false, panelLoading: false, viewMode: 'tree', pdfExporting: false }); /* viewMode: 'tree'|'grid' */
    const itemPdfAreaRef = ref(null);   /* "대시보드 위젯항목 수정" 폼 전체(정의 그리드+미리보기 포함) — PDF 캡처 대상 */

    /* handleExportItemPdf — 화면에 보이는 그대로(정의 그리드+시뮬레이션 미리보기 포함) PDF 로 저장 */
    const handleExportItemPdf = async () => {
      uiState.pdfExporting = true;
      try {
        const nm = panelForm.itemNm || panelForm.itemKey || '대시보드위젯항목';
        /* 파일명 타임스탬프는 프로젝트 표준 헬퍼로 통일 — 영역명_YYYYMMDD_hhmmss.확장자 */
        const filename = coUtil.cofBuildExportFilename(`${nm}.pdf`);
        await window.boUtil.bofExportPdf(itemPdfAreaRef.value, filename, showToast);
      } finally {
        uiState.pdfExporting = false;
      }
    };
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

    const searchParam = reactive({ searchValue: '', useYn: '', itemNm: '' });

    /* dashState — 좌측에서 고른 대시보드 */
    const dashState = reactive({ selectedId: null });

    /* panelDetail — 항목 인라인 폼 상태 */
    const panelDetail = reactive({ selectedId: null, isNew: false, show: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => panelDetail.dtlMode === 'view');
    const _initPanelForm = () => ({
      dashboardItemId: null, dashboardId: '', itemKey: '', itemNm: '',
      widgetTypeCd: 'CHART', axisTypeCd: 'CATEGORY', seriesOrientCd: 'ROW', chartTypeCd: 'bar', sortOrd: 10,
      autoCollectYn: 'N', editableYn: 'Y', inputOpts: '',
      panelWidth: 1, panelHeight: 1, realtimeYn: 'N', useYn: 'Y', optionJson: '',
      lvl1CodeGrp: '', lvl2CodeGrp: '', simJson: '',
      lvl2PaletteCd: 'DASH_WIDGET_COLORS_01', lvl3PaletteCd: 'DASH_WIDGET_COLORS_02',
      widgetGenTypeCd: 'MANUAL', genQuery: '', refItemKey: '',
    });
    const panelForm = reactive(_initPanelForm());
    /* genRefYmd — 쿼리방식(QUERY) [쿼리 실행] 시 :yyyymmdd/:yyyymm 자리표시자에 넘길 기준일자
       (YYYYMMDD, 8자리). 저장 대상 아님 — 실행할 때만 쓰는 값이라 panelForm 밖에 별도로 둔다.
       기본값은 오늘 날짜(2026-08-21) */
    const _todayYmd = () => {
      const d = new Date();
      const p2 = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
    };
    const genRefYmd = ref(_todayYmd());
    const panelErrors = reactive({});

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    /* 개인화 대시보드 여부 — ownerUserId(운영 표준) 우선, 구 규약(uiCompNm 'MY:' 접두어) fallback */
    const fnIsMyDash = (row) => !!row.ownerUserId || (row.uiCompNm || '').indexOf('MY:') === 0;
    const cfCurDash = computed(() => dashboards.find(d => d.dashboardId === dashState.selectedId) || null);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  return handleSearchList();
      if (cmd === 'searchParam-reset') {
        searchParam.searchValue = ''; searchParam.useYn = ''; searchParam.itemNm = '';
        /* 검색 초기화는 좌측 대시보드 선택도 함께 해제한다 — 그래야 우측이 전체 대시보드
           기준으로 다시 조회된다(2026-08-21) */
        dashState.selectedId = null;
        resetDetailToNew();
        return handleSearchList();
      }
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
        /* 좌측에서 대시보드를 고르지 않고 [조회]만 눌러도 우측 위젯항목목록은 항상 채운다 —
           선택된 게 있으면 그 대시보드만, 없으면 방금 조회된 전체 대시보드 기준(2026-08-21) */
        await handleSearchPanels();
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

    /* handleSearchPanels — 항목 목록 조회 (평면 목록 + 3레벨 트리).
       좌측에서 대시보드를 선택 안 하고 [조회]만 누르면 전체 대시보드를 대상으로 조회한다
       (2026-08-21) — getItemList 는 dashboardId 없이 siteId 만으로도 전체 항목을 돌려준다 */
    const handleSearchPanels = async () => {
      uiState.panelLoading = true;
      try {
        const params = { siteId: cfSiteId.value };
        if (dashState.selectedId) params.dashboardId = dashState.selectedId;
        const res = await boApiSvc.cmDashboard.getItemList(params, '대시보드항목관리', '항목조회');
        let list = res.data?.data || [];
        if (dashState.selectedId) list = list.filter(i => i.dashboardId === dashState.selectedId);
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        panels.splice(0, panels.length, ...list);
        await fnLoadTree();
        fnAttachChildCounts();
        /* 위젯항목명 검색 — 차트·시리즈·항목 어느 레벨의 이름이든 걸리면 그 차트를 남긴다.
           fnLoadTree() 가 이미 전체 레벨(treeRows)을 채워둔 뒤라 여기서 바로 매칭한다.
           item_key 는 항상 chartCd-seriesCd-itemCd 형식(codeOf 가 '-' 를 '_' 로 치환해
           세그먼트가 안전)이라 첫 조각만 잘라내면 소속 차트를 바로 알 수 있다 */
        const kw = (searchParam.itemNm || '').trim().toLowerCase();
        if (kw) {
          const matchedChartKeys = new Set(
            treeRows.filter(n => (n.itemNm || '').toLowerCase().includes(kw))
                    .map(n => (n.itemKey || '').split('-')[0]));
          panels.splice(0, panels.length, ...panels.filter(p => matchedChartKeys.has(p.itemKey)));
          treeRows.splice(0, treeRows.length,
            ...treeRows.filter(n => matchedChartKeys.has((n.itemKey || '').split('-')[0])));
        }
        panelsPager.pageNo = 1;
        panelsPager.pageTotalCount = panels.length;
        panelsPager.pageTotalPage = Math.max(1, Math.ceil(panels.length / panelsPager.pageSize));
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '항목 조회 오류', 'error', 0);
      } finally {
        uiState.panelLoading = false;
      }
    };

    /* fnLoadTree — 3레벨 트리 조회. 특정 대시보드가 선택돼 있으면 그것만, 아니면 좌측에 로드된
       모든 대시보드를 각각 조회해 하나로 합친다(getItemTree 는 dashboardId 필수라 대시보드별로
       나눠 부를 수밖에 없다) — 노드마다 _dashboardNm 을 붙여 그리드에서 구분해 보여준다(2026-08-21) */
    const fnLoadTree = async () => {
      try {
        if (dashState.selectedId) {
          const dashNm = cfCurDash.value?.dashboardNm || '';
          const res = await boApiSvc.cmDashboard.getItemTree(
            { dashboardId: dashState.selectedId }, '대시보드항목관리', '항목트리조회');
          const rows = (res.data?.data || []).map(n => ({ ...n, _dashboardNm: dashNm }));
          treeRows.splice(0, treeRows.length, ...rows);
        } else {
          const results = await Promise.all(dashboards.map(d =>
            boApiSvc.cmDashboard.getItemTree({ dashboardId: d.dashboardId }, '대시보드항목관리', '항목트리조회')
              .then(res => (res.data?.data || []).map(n => ({ ...n, _dashboardNm: d.dashboardNm })))
              .catch(() => [])));
          treeRows.splice(0, treeRows.length, ...results.flat());
        }
        fnTreeCollapseAll();   /* 기본적으로 접힌 상태로 시작(2026-08-21) — 필요하면 [전체펼치기] */
      } catch (err) {
        treeRows.splice(0, treeRows.length);
        console.warn('[항목 트리 조회 오류]', err);
      }
    };

    /* fnAttachChildCounts — treeRows(전체 레벨)로 각 차트(panels 행 + 트리의 1레벨 노드)에
       시리즈개수(행개수)·데이타열개수(열개수)를 매긴다.
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
      /* 트리 목록의 1레벨(차트) 노드도 같은 규칙으로 표시 — 트리 화면(레벨/항목명/코드/...)에서도
         목록 화면처럼 행개수·열개수·조회조건을 바로 볼 수 있게(2026-08-21) */
      treeRows.forEach(n => {
        if (n.lvl !== 1) return;
        const sers = byParent[n.dashboardItemId] || [];
        n._seriesCnt = sers.length;
        n._colCnt = sers.length ? (byParent[sers[0].dashboardItemId] || []).length : 0;
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
      Object.assign(panelForm, _initPanelForm(), { sortOrd: maxOrd + 10, dashboardId: dashState.selectedId });
      fnSyncFormToRows();   /* 편집 그리드 적재 (신규는 빈 행) */
    };

    /* _loadDetailForm — 항목 인라인 폼에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (row, mode) => {
      panelDetail.selectedId = row.dashboardItemId;
      panelDetail.isNew = false;
      panelDetail.show = true;
      panelDetail.dtlMode = mode;
      Object.assign(panelForm, {
        dashboardItemId: row.dashboardItemId, dashboardId: row.dashboardId || dashState.selectedId || '',
        itemKey: row.itemKey || '', itemNm: row.itemNm,
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
        lvl2PaletteCd: row.lvl2PaletteCd || 'DASH_WIDGET_COLORS_01',
        lvl3PaletteCd: row.lvl3PaletteCd || 'DASH_WIDGET_COLORS_02',
        widgetGenTypeCd: row.widgetGenTypeCd || 'MANUAL', genQuery: row.genQuery || '', refItemKey: row.refItemKey || '',
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
      if (!panelForm.dashboardId) { panelErrors.dashboardId = '대시보드를 선택하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!panelForm.itemKey) { panelErrors.itemKey = '항목 키를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!panelForm.itemNm)  { panelErrors.itemNm = '항목명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!(await showConfirm('저장', '항목을 저장하시겠습니까?'))) return;
      fnSyncSimToForm();    /* 시뮬레이션 값·스타일 → simJson */
      try {
        const body = {
          dashboardItemId: panelDetail.isNew ? null : panelForm.dashboardItemId,
          rowStatus: panelDetail.isNew ? 'I' : 'U',
          /* 대시보드는 이제 폼에서 직접 고른다 — 수정 중 다른 대시보드로 바꾸면 그 값 그대로
             저장되고, 뒤이은 syncItemChildren() 이 방금 저장된(새 dashboardId 반영된) 차트를
             다시 읽어 하위 시리즈·항목까지 같은 대시보드로 연쇄 이동시킨다(2026-08-21) */
          siteId: cfSiteId.value, dashboardId: panelForm.dashboardId || dashState.selectedId,
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
          lvl2PaletteCd: panelForm.lvl2PaletteCd || null, lvl3PaletteCd: panelForm.lvl3PaletteCd || null,
          widgetGenTypeCd: panelForm.widgetGenTypeCd || 'MANUAL',
          genQuery: panelForm.widgetGenTypeCd === 'QUERY' ? (panelForm.genQuery || null) : null,
          refItemKey: panelForm.widgetGenTypeCd === 'QUERY' ? (panelForm.refItemKey || null) : null,
        };
        const res = await boApiSvc.cmDashboard.itemSave('base', body, '대시보드항목관리', '항목저장');
        /* 편집 그리드의 시리즈·항목을 실제 정의행으로 반영 — 트리·데이터관리가 이 행을 본다.
           쿼리방식(QUERY) 차트는 구조(시리즈·항목)를 여기서 다루지 않는다 — [🔗 쿼리 실행 →
           자동생성]이 유일한 구조 관리자다. 여기서도 syncItemChildren 을 호출하면, 이 폼의
           seriesRows/colRows 가 그 시점에 비어있을 때(예: 방금 대시보드만 바꿔 저장한 경우)
           "화면에 없는 행" 으로 오판해 SQL 로 만든 시리즈·항목을 통째로 지워버린다(2026-08-21
           발견 — 대시보드 이동 저장 한 번으로 쿼리방식 차트 구조가 전부 삭제됐다). */
        const savedId = res.data?.data?.dashboardItemId || panelForm.dashboardItemId;
        let syncMsg = '';
        if (savedId && panelForm.widgetGenTypeCd !== 'QUERY') {
          const sres = await boApiSvc.cmDashboard.syncItemChildren(savedId, {
            series: seriesRows.map(r => ({ dashboardItemId: r.dashboardItemId, cd: r.cd, name: r.name, color: r.color,
              autoCollectYn: r.autoCollectYn || 'N', editableYn: r.editableYn || 'Y' })),
            cols:   colRows.map(r => ({ dashboardItemId: r.dashboardItemId, cd: r.cd, name: r.name, color: r.color,
              autoCollectYn: r.autoCollectYn || 'N', editableYn: r.editableYn || 'Y' })),
            /* 셀(시리즈×항목) 단위로 따로 지정된 자동수집/수정가능여부 — key=조립 item_key.
               cellFlags 는 열 때(fnLoadCellFlags)·토글할 때 이미 이 모양으로 유지된다(2026-08-21) */
            cellOverrides: { ...cellFlags },
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

    /* handleGenerateFromQuery — [쿼리 실행 → 자동생성]. 화면의 genQuery 를 실제 저장된 값 그대로
       실행해야 하므로, 먼저 [저장]으로 gen_query 를 반영한 뒤 실행한다(저장 안 된 SQL을 그냥
       실행하면 DB 에 남은 쿼리와 화면이 어긋난다) */
    const handleGenerateFromQuery = async () => {
      if (!panelForm.genQuery || !panelForm.genQuery.trim()) {
        showToast('생성 쿼리(SQL)를 입력하세요.', 'error'); return;
      }
      if (panelDetail.isNew || !panelForm.dashboardItemId) {
        showToast('먼저 [저장]으로 위젯을 등록한 뒤 쿼리를 실행하세요.', 'error'); return;
      }
      if (!/^\d{8}$/.test(genRefYmd.value || '')) {
        showToast('기준일자는 8자리 숫자(YYYYMMDD)로 입력하세요.', 'error'); return;
      }
      const ok = await showConfirm('쿼리 실행',
        '저장된 생성 쿼리를 실행해 시리즈·항목·값을 자동으로 채웁니다.\n(먼저 [저장]을 눌러 지금 화면의 SQL이 반영돼 있어야 합니다)\n진행하시겠습니까?');
      if (!ok) return;
      try {
        const res = await boApiSvc.cmDashboard.generateFromQuery(panelForm.dashboardItemId,
          { siteId: cfSiteId.value, yyyymmdd: genRefYmd.value }, '대시보드항목관리', '쿼리실행생성');
        const d = res.data?.data || {};
        const delMsg = d.deletedRows ? `, 옛 항목 ${d.deletedRows}개 정리` : '';
        showToast(`쿼리 실행 완료 — 시리즈 ${d.series || 0}개, 항목 ${d.items || 0}개, 값 ${d.values || 0}건 반영${delMsg}`, 'success');
        await fnLoadTree();       /* 쿼리로 새로 생긴 시리즈·항목 행을 반영 */
        /* 현재 항목 그대로 다시 열어 새 정의를 편집 그리드에 반영 — loadView() 를 쓰면 무조건
           보기모드로 강제 전환돼(cfDtlMode=true) [🔗 쿼리 실행] 버튼 자체가 disabled 로 잠겨버려
           기준일자를 바꿔가며 다시 실행해보는 흐름이 끊긴다(2026-08-21 발견). 지금 모드(편집중
           이었다면 편집 그대로)를 유지한 채 데이터만 새로고침한다. */
        _loadDetailForm(panelForm, panelDetail.dtlMode);
        await fnLoadPanelCounts();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '쿼리 실행 오류', 'error', 0);
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
      .map(n => ({ dashboardItemId: n.dashboardItemId, cd: n.itemCd || '', name: n.itemNm || '', color: n.lvl2Color || '',
        autoCollectYn: n.autoCollectYn || 'N', editableYn: n.editableYn || 'Y' }));

    /* fnColsFromTree — 항목 행(3레벨). 열 정의는 시리즈마다 같으므로 첫 시리즈 것을 쓴다 */
    const fnColsFromTree = (chartId) => {
      const first = treeRows.find(n => n.lvl === 2 && n.parentDashboardItemId === chartId);
      if (!first) return [];
      return treeRows
        .filter(n => n.lvl === 3 && n.parentDashboardItemId === first.dashboardItemId)
        .map(n => ({ dashboardItemId: n.dashboardItemId, cd: n.itemCd || '', name: n.itemNm || '', color: n.lvl3Color || '',
          autoCollectYn: n.autoCollectYn || 'N', editableYn: n.editableYn || 'Y' }));
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
      fnLoadCellFlags();  /* 셀(시리즈×항목) 단위 자동수집/수정가능 실값 복원 */
      srcState.scriptManual = false;   /* 다른 항목을 열었으니 수동 편집 상태는 초기화 */
      fnSyncFormToSim();  /* 저장해 둔 시뮬레이션 값·스타일 복원 (fnSimFit 포함) */
      /* 복원 후에도 값이 전부 비어 있으면(신규 항목·시뮬값 저장 이력 없는 항목) 미리보기가
         빈 화면으로 뜨지 않도록 바로 자동생성 한 번 돌려준다(2026-08-21) */
      const hasSimVal = simVals.some(r => r.some(v => v !== null && v !== '' && v !== undefined));
      if (!hasSimVal && colRows.length) fnSimRandom();
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

    const fnAddSeriesRow = () => seriesRows.push({ cd: '', name: '', color: '', autoCollectYn: 'N', editableYn: 'Y' });
    const fnAddColRow    = () => colRows.push({ cd: '', name: '', color: '', autoCollectYn: 'N', editableYn: 'Y' });
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

    /* simOrient — 시뮬레이션 그리드 표시방향(미리보기 전용, 저장 안 함). simVals 는 항상
       [시리즈idx][항목idx] 로 저장하고, ROW/COL 은 화면에 어느 축을 행/열로 그릴지만 바꾼다
       (실제 구조는 안 건드리므로 물리적 전치 없이 v-for 순서만 바꿔서 렌더) */
    const simOrient = ref('ROW');   /* ROW: 시리즈=행·항목=열(기본) / COL: 항목=행·시리즈=열 */

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

    /* fnSimRowTotal/fnSimColTotal/fnSimGrandTotal — simVals[시리즈idx][항목idx] 합계.
       simOrient 는 화면 배치만 바꿀 뿐 저장 배열은 항상 [시리즈][항목] 이므로 합계 계산은
       방향과 무관하게 동일 인덱스로 한다 */
    const fnSimRowTotal = (si) => {
      let sum = 0;
      (simVals[si] || []).forEach(v => { const n = Number(v); if (!Number.isNaN(n)) sum += n; });
      return coUtil.cofFmt(sum);
    };
    const fnSimColTotal = (ci) => {
      let sum = 0;
      simVals.forEach(row => { const n = Number(row[ci]); if (!Number.isNaN(n)) sum += n; });
      return coUtil.cofFmt(sum);
    };
    const fnSimGrandTotal = () => {
      let sum = 0;
      simVals.forEach(row => row.forEach(v => { const n = Number(v); if (!Number.isNaN(n)) sum += n; }));
      return coUtil.cofFmt(sum);
    };

    /* cellFlags — 시리즈×항목 "셀" 하나만 자동수집/수정가능여부를 항목(열) 공통값과 다르게
       지정한 경우만 담는다. key = 조립 item_key(fnCellItemKey 와 동일 규칙). 항목을 열 때
       fnLoadCellFlags 로 실제 DB 값(레벨3 각 행의 값)을 채우고, [저장] 시 syncItemChildren 의
       cellOverrides 로 그대로 실려 나간다(2026-08-21, "열 전체가 같이 반응하는" 문제 해결) */
    const cellFlags = reactive({});
    /* fnCellItemKey — 백엔드가 계산하는 조립코드(chartCd-seriesCd-itemCd)와 똑같은 규칙.
       "고유 item_key 미리보기" 컬럼이 쓰는 fnPreviewCode 를 그대로 재사용해 어긋나지 않게 한다 */
    const fnCellItemKey = (si, ci) => {
      const s = seriesRows[si]; const c = colRows[ci];
      if (!s || !c) return null;
      return fnPreviewCode(s.cd || s.name, c.cd || c.name);
    };
    /* fnColAuto/fnColLocked — 템플릿 속성값 안에서 && 를 직접 쓰면 Vue 컴파일러가 크래시하는
       프로젝트 규칙(CLAUDE.md) 때문에 함수로 분리. 셀 오버라이드가 있으면 그것을, 없으면
       항목(열) 공통값(colRows)을 기본값으로 보여준다 */
    const fnColAuto = (si, ci) => {
      const key = fnCellItemKey(si, ci);
      const ov = key ? cellFlags[key] : null;
      if (ov && ov.autoCollectYn != null) return ov.autoCollectYn === 'Y';
      return !!(colRows[ci] && colRows[ci].autoCollectYn === 'Y');
    };
    const fnColLocked = (si, ci) => {
      const key = fnCellItemKey(si, ci);
      const ov = key ? cellFlags[key] : null;
      if (ov && ov.editableYn != null) return ov.editableYn === 'N';
      return !!(colRows[ci] && colRows[ci].editableYn === 'N');
    };
    /* fnToggleColAuto/fnToggleColEditable — 시뮬레이션 그리드의 셀 하나를 클릭해 그 셀만
       자동수집/수정가능 여부를 전환한다(2026-08-21, 예전엔 열 전체가 같이 바뀌었음) */
    const fnToggleColAuto = (si, ci) => {
      const key = fnCellItemKey(si, ci); if (!key) return;
      const cur = fnColAuto(si, ci);
      cellFlags[key] = { ...(cellFlags[key] || {}), autoCollectYn: cur ? 'N' : 'Y' };
    };
    const fnToggleColEditable = (si, ci) => {
      const key = fnCellItemKey(si, ci); if (!key) return;
      const cur = fnColLocked(si, ci);
      cellFlags[key] = { ...(cellFlags[key] || {}), editableYn: cur ? 'Y' : 'N' };
    };
    /* fnToggleAllAuto/fnToggleAllEditable — "시리즈 \ 항목" 모서리 아이콘. 지금 보이는 시리즈×항목
       조합 전부를 한 번에 켜거나 끈다(전부 켜져 있으면 끄고, 아니면 켠다) */
    const fnToggleAllAuto = () => {
      const allOn = seriesRows.every((s, si) => colRows.every((c, ci) => fnColAuto(si, ci)));
      seriesRows.forEach((s, si) => colRows.forEach((c, ci) => {
        const key = fnCellItemKey(si, ci); if (!key) return;
        cellFlags[key] = { ...(cellFlags[key] || {}), autoCollectYn: allOn ? 'N' : 'Y' };
      }));
    };
    const fnToggleAllEditable = () => {
      const allLocked = seriesRows.every((s, si) => colRows.every((c, ci) => fnColLocked(si, ci)));
      seriesRows.forEach((s, si) => colRows.forEach((c, ci) => {
        const key = fnCellItemKey(si, ci); if (!key) return;
        cellFlags[key] = { ...(cellFlags[key] || {}), editableYn: allLocked ? 'Y' : 'N' };
      }));
    };
    /* fnLoadCellFlags — 항목을 열 때 실제 DB 값(레벨3 각 행)으로 cellFlags 를 채운다.
       item_key 가 "이 차트 item_key-" 로 시작하는 레벨3 행이 곧 이 차트의 셀들이다 */
    const fnLoadCellFlags = () => {
      Object.keys(cellFlags).forEach(k => delete cellFlags[k]);
      const prefix = (panelForm.itemKey || '') + '-';
      treeRows.filter(n => n.lvl === 3 && n.itemKey && n.itemKey.indexOf(prefix) === 0).forEach(n => {
        cellFlags[n.itemKey] = { autoCollectYn: n.autoCollectYn || 'N', editableYn: n.editableYn || 'Y' };
      });
    };

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
    /* cfColorPaletteCd — 색상 팔레트 선택값. cm_dashboard_item.lvl2_palette_cd 실컬럼에 저장한다
       (2026-08-21, optionJson 에 JSON 으로 끼워 넣던 방식에서 전환 — panelForm 의 다른 필드처럼
       그냥 저장 body 에 실려 보내지므로 별도 파싱/재직렬화가 필요 없다) */
    const cfColorPaletteCd = computed({
      get() { return panelForm.lvl2PaletteCd || 'DASH_WIDGET_COLORS_01'; },
      set(v) {
        panelForm.lvl2PaletteCd = v;
        /* colorOf() 는 시리즈에 이미 박힌 개별 color 를 팔레트보다 우선한다 — 그래서 팔레트만
           바꾸면 차트가 그대로였다(2026-08-21). 팔레트 선택 = 그 팔레트로 전 시리즈 색 일괄 적용 */
        const pal = util.DASH_WIDGET_COLOR_SETS[v] || util.PALETTE;
        seriesRows.forEach((r, i) => { r.color = pal[i % pal.length]; });
      },
    });
    /* cfActivePalette — 선택된 팔레트 배열(없으면 기존 기본 PALETTE 로 폴백) */
    const cfActivePalette = computed(() => util.DASH_WIDGET_COLOR_SETS[cfColorPaletteCd.value] || util.PALETTE);

    /* cfColorPaletteCd2 — 색상 팔레트 2(항목·3레벨 색상 순서). 팔레트1(cfColorPaletteCd)은
       시리즈(2레벨) 색을 결정하는데, 파이/도넛은 시리즈가 아니라 항목(3레벨) 단위로 색이
       필요해 둘을 따로 둔다 — cm_dashboard_item.lvl3_palette_cd 실컬럼에 저장 */
    const cfColorPaletteCd2 = computed({
      get() { return panelForm.lvl3PaletteCd || 'DASH_WIDGET_COLORS_02'; },
      set(v) {
        panelForm.lvl3PaletteCd = v;
        const pal = util.DASH_WIDGET_COLOR_SETS[v] || util.PALETTE;
        colRows.forEach((r, i) => { r.color = pal[i % pal.length]; });
      },
    });
    /* cfActivePalette2 — 팔레트2 배열(항목 단위 색상 — 파이/도넛에서 사용) */
    const cfActivePalette2 = computed(() => util.DASH_WIDGET_COLOR_SETS[cfColorPaletteCd2.value] || util.PALETTE);

    /* fnBuildOptionForType — 시뮬 값·색상은 그대로 두고 차트유형만 바꿔 옵션을 만든다.
       왼쪽(실제 저장될 chartTypeCd) 미리보기와 오른쪽(비교용, 저장과 무관) 미리보기가
       이 함수 하나를 공유한다 — 로직 중복 없이 type 파라미터만 다르게 넘긴다. */
    const fnBuildOptionForType = (type) => {
      const cats = cfSimColNms.value;
      const names = cfSimSeriesNms.value;
      const colorOf = (i) => (seriesRows[i] && seriesRows[i].color) || cfActivePalette.value[i % cfActivePalette.value.length];
      /* colorOf2 — 항목(3레벨) 단위 색. colRows[i].color 가 있으면 그것을(수동 지정 우선),
         없으면 팔레트2를 순번대로 돌려 쓴다(colorOf 와 같은 우선순위 규칙, 축만 다르다) */
      const colorOf2 = (i) => (colRows[i] && colRows[i].color) || cfActivePalette2.value[i % cfActivePalette2.value.length];
      const at = (si, ci) => {
        const v = simVals[si] ? simVals[si][ci] : null;
        return v === null || v === '' || v === undefined ? 0 : Number(v) || 0;
      };
      if (!cats.length) return {};

      if (type === 'pie' || type === 'doughnut' || type === 'rose') {
        /* 파이는 조각(=항목,3레벨)마다 색이 필요한데 팔레트1/시리즈색은 시리즈(2레벨) 기준이라
           그대로 못 쓴다(2026-08-21) — 팔레트2(항목 색상 순서)를 쓴다. colRows[i].color 가
           직접 지정돼 있으면 그것을 우선한다(colorOf 와 동일한 규칙).
           로즈차트는 파이와 데이터가 완전히 같고 roseType 만 켜면 되는 변형이라 같이 묶는다 */
        return {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0, type: 'plain' },
          color: cats.map((c, ci) => colorOf2(ci)),
          series: [{
            type: 'pie',
            radius: type === 'doughnut' ? ['20%', '65%'] : (type === 'rose' ? ['10%', '65%'] : '60%'),
            center: ['50%', '45%'],
            roseType: type === 'rose' ? 'radius' : undefined,
            label: { show: true, formatter: (p) => p.name + '\n' + coUtil.cofFmt(p.value) },
            data: cats.map((c, ci) => ({ name: c, value: at(0, ci), itemStyle: { color: colorOf2(ci) } })),
          }],
        };
      }
      if (type === 'funnel') {
        /* 깔때기 — 항목(3레벨)별 값을 큰 순서로 정렬해 단계적 감소를 보여준다.
           파이와 마찬가지로 항목 단위라 팔레트2(colorOf2)를 쓴다 */
        return {
          tooltip: { trigger: 'item' },
          legend: { bottom: 0, type: 'plain' },
          series: [{
            type: 'funnel', left: '10%', width: '80%', top: 16, bottom: 36, sort: 'descending',
            label: { show: true, formatter: (p) => p.name + '\n' + coUtil.cofFmt(p.value) },
            data: cats.map((c, ci) => ({ name: c, value: at(0, ci), itemStyle: { color: colorOf2(ci) } })),
          }],
        };
      }
      if (type === 'treemap') {
        /* 트리맵 — 시리즈(2레벨)=상위 블록, 항목(3레벨)=하위 블록. 마침 지금 데이터가 2단
           계층(시리즈>항목)이라 별도 가공 없이 그대로 트리 구조로 옮겨 쓸 수 있다(2026-08-21).
           블록 색은 팔레트1(상위=시리즈)·팔레트2(하위=항목) 둘 다 활용 */
        return {
          tooltip: { trigger: 'item', formatter: (p) => p.name + ': ' + coUtil.cofFmt(p.value) },
          series: [{
            type: 'treemap', roam: false, breadcrumb: { show: false },
            label: { show: true, formatter: (p) => p.name + '\n' + coUtil.cofFmt(p.value) },
            data: names.map((nm, si) => ({
              name: nm, itemStyle: { color: colorOf(si) },
              children: cats.map((c, ci) => ({ name: c, value: at(si, ci), itemStyle: { color: colorOf2(ci) } })),
            })),
          }],
        };
      }
      if (type === 'sunburst') {
        /* 선버스트 — 트리맵과 데이터가 완전히 같은 2단 계층(시리즈>항목), 방사형으로 표시만 다르다 */
        return {
          tooltip: { trigger: 'item', formatter: (p) => p.name + ': ' + coUtil.cofFmt(p.value) },
          series: [{
            type: 'sunburst', radius: [0, '90%'],
            label: { rotate: 'radial' },
            data: names.map((nm, si) => ({
              name: nm, itemStyle: { color: colorOf(si) },
              children: cats.map((c, ci) => ({ name: c, value: at(si, ci), itemStyle: { color: colorOf2(ci) } })),
            })),
          }],
        };
      }
      if (type === 'gauge') {
        /* 게이지 — 여러 시리즈·항목 값을 다 더한 총합 하나를 바늘로 보여준다(단일 KPI 성격) */
        let total = 0;
        names.forEach((nm, si) => cats.forEach((c, ci) => { total += at(si, ci); }));
        const max = Math.max(10, Math.ceil((total * 1.25 || 10) / 10) * 10);
        return {
          series: [{
            type: 'gauge', min: 0, max,
            progress: { show: true, itemStyle: { color: colorOf(0) } },
            itemStyle: { color: colorOf(0) },
            detail: { valueAnimation: true, formatter: (v) => coUtil.cofFmt(v), fontSize: 20, offsetCenter: [0, '70%'] },
            data: [{ value: total, name: '합계' }],
          }],
        };
      }
      if (type === 'heatmap') {
        /* 히트맵 — 시리즈×항목 격자 그대로가 정확히 히트맵의 자연스러운 모양이다(x=항목,y=시리즈,
           색=값). 예전엔 CHART_TYPES 목록에만 있고 실제 분기가 없어 일반 막대로 잘못 그려졌다 —
           이번에 제대로 구현(2026-08-21) */
        const data = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => data.push([ci, si, at(si, ci)])));
        const vals = data.map(d => d[2]);
        return {
          tooltip: { trigger: 'item', formatter: (p) => cats[p.data[0]] + ' / ' + names[p.data[1]] + ': ' + coUtil.cofFmt(p.data[2]) },
          grid: { left: 90, right: 16, top: 20, bottom: 60 },
          xAxis: { type: 'category', data: cats, splitArea: { show: true } },
          yAxis: { type: 'category', data: names, splitArea: { show: true } },
          visualMap: { min: Math.min(0, ...vals), max: Math.max(1, ...vals), calculable: true,
            orient: 'horizontal', bottom: 0, inRange: { color: ['#eef2ff', colorOf(0)] } },
          series: [{ type: 'heatmap', data, label: { show: true, fontSize: 10, formatter: (p) => coUtil.cofFmt(p.data[2]) } }],
        };
      }
      if (type === 'polarBar') {
        /* 극좌표막대 — 데이터·색상은 일반 막대와 완전히 같고, 좌표계만 원형(polar)으로 바꾼다 */
        return {
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, type: 'plain' },
          polar: { radius: '65%' },
          angleAxis: { type: 'category', data: cats },
          radiusAxis: { type: 'value' },
          series: names.map((nm, si) => ({
            name: nm, type: 'bar', coordinateSystem: 'polar',
            itemStyle: { color: colorOf(si) },
            data: cats.map((c, ci) => at(si, ci)),
          })),
        };
      }
      if (type === 'bar3D') {
        /* 입체막대(진짜 3D) — echarts-gl(WebGL, bo.html 에서 echarts 코어 직후 로드) 필요.
           히트맵과 데이터 모양이 완전히 같다(x=항목,y=시리즈,z=값) — 평면 색칠 대신 기둥을
           세워 입체로 보여준다(2026-08-21) */
        const data = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => data.push([ci, si, at(si, ci)])));
        const vals = data.map(d => d[2]);
        return {
          tooltip: {},
          visualMap: { min: 0, max: Math.max(1, ...vals), calculable: true, dimension: 2,
            inRange: { color: ['#313695', '#4575b4', '#74add1', '#e0f3f8', '#fee090', '#f46d43', '#a50026'] } },
          xAxis3D: { type: 'category', data: cats },
          yAxis3D: { type: 'category', data: names },
          zAxis3D: { type: 'value' },
          grid3D: { boxWidth: 100, boxDepth: 55, viewControl: { autoRotate: false, alpha: 22 }, light: { main: { intensity: 1.2 } } },
          series: [{ type: 'bar3D', data, shading: 'lambert', bevelSize: 0.2 }],
        };
      }
      if (type === 'scatter3D') {
        /* 입체산점도 — bar3D 와 같은 x/y/z 격자, 기둥 대신 점으로. 값이 클수록 점도 커지고
           색도 진해지도록 visualMap 한 채널에 색·크기 둘 다 물린다(2026-08-21) */
        const data = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => data.push([ci, si, at(si, ci)])));
        const vals = data.map(d => d[2]);
        return {
          tooltip: {},
          visualMap: { min: 0, max: Math.max(1, ...vals), calculable: true, dimension: 2,
            inRange: { color: ['#313695', '#4575b4', '#74add1', '#e0f3f8', '#fee090', '#f46d43', '#a50026'], symbolSize: [8, 28] } },
          xAxis3D: { type: 'category', data: cats },
          yAxis3D: { type: 'category', data: names },
          zAxis3D: { type: 'value' },
          grid3D: { boxWidth: 100, boxDepth: 55, viewControl: { autoRotate: false, alpha: 22 } },
          series: [{ type: 'scatter3D', data, symbolSize: 12 }],
        };
      }
      if (type === 'surface') {
        /* 입체표면 — bar3D 와 같은 격자값을 기둥이 아니라 매끈한 곡면으로 이어 붙인다.
           마침 시리즈×항목이 빈칸 없는 완전한 격자라 곡면 보간에 딱 맞는다(2026-08-21) */
        const data = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => data.push([ci, si, at(si, ci)])));
        const vals = data.map(d => d[2]);
        return {
          tooltip: {},
          visualMap: { min: 0, max: Math.max(1, ...vals), calculable: true,
            inRange: { color: ['#313695', '#4575b4', '#74add1', '#e0f3f8', '#fee090', '#f46d43', '#a50026'] } },
          xAxis3D: { type: 'category', data: cats },
          yAxis3D: { type: 'category', data: names },
          zAxis3D: { type: 'value' },
          grid3D: { boxWidth: 100, boxDepth: 55, viewControl: { autoRotate: false, alpha: 22 } },
          series: [{ type: 'surface', data, shading: 'color', wireframe: { show: true } }],
        };
      }
      if (type === 'line3D') {
        /* 입체능선 — 시리즈마다 항목 축을 따라 이어지는 능선을 하나씩 그린다(조이플롯의 3D 버전).
           색은 팔레트1(시리즈색) — 여기선 항목이 아니라 시리즈가 선 하나의 단위이기 때문 */
        return {
          tooltip: {},
          xAxis3D: { type: 'category', data: cats },
          yAxis3D: { type: 'category', data: names },
          zAxis3D: { type: 'value' },
          grid3D: { boxWidth: 100, boxDepth: 55, viewControl: { autoRotate: false, alpha: 22 } },
          series: names.map((nm, si) => ({
            type: 'line3D', lineStyle: { color: colorOf(si), width: 4 },
            data: cats.map((c, ci) => [ci, si, at(si, ci)]),
          })),
        };
      }
      if (type === 'polarLine') {
        /* 극좌표꺾은선 — 극좌표막대와 데이터·좌표계가 완전히 같고, 막대 대신 선으로 잇는다 */
        return {
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, type: 'plain' },
          polar: { radius: '65%' },
          angleAxis: { type: 'category', data: cats },
          radiusAxis: { type: 'value' },
          series: names.map((nm, si) => ({
            name: nm, type: 'line', coordinateSystem: 'polar', smooth: true,
            itemStyle: { color: colorOf(si) },
            data: cats.map((c, ci) => at(si, ci)),
          })),
        };
      }
      if (type === 'themeRiver') {
        /* 테마리버 — 시리즈마다 폭이 값에 비례하는 띠가 항목 축(가로)을 따라 흐른다.
           데이터는 [항목, 값, 시리즈명] 삼중값 나열 — 지금 그리드를 그대로 풀어 쓰면 된다 */
        const data = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => data.push([c, at(si, ci), nm])));
        return {
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, type: 'plain', data: names },
          singleAxis: { type: 'category', data: cats, top: 20, bottom: 50 },
          color: names.map((nm, si) => colorOf(si)),
          series: [{ type: 'themeRiver', data, label: { show: false } }],
        };
      }
      if (type === 'parallel') {
        /* 평행좌표 — 축 하나=시리즈 하나, 선 하나=항목 하나. 항목이 여러 시리즈 값을 동시에
           어떻게 가로지르는지 한눈에 비교하기 좋다. 선(=항목) 색은 팔레트2 */
        return {
          tooltip: {},
          parallelAxis: names.map((nm, i) => ({ dim: i, name: nm })),
          parallel: { left: 70, right: 70, top: 30, bottom: 40 },
          series: [{
            type: 'parallel', lineStyle: { width: 2 },
            data: cats.map((c, ci) => ({
              name: c, value: names.map((nm, si) => at(si, ci)),
              lineStyle: { color: colorOf2(ci) },
            })),
          }],
        };
      }
      if (type === 'boxplot') {
        /* 박스플롯 — 항목마다 "그 항목에서 시리즈들이 갖는 값의 분포"를 5수치(최소/Q1/중앙값/
           Q3/최대)로 요약한다. 시리즈 수가 곧 표본 수라 시리즈가 1개뿐이면 상자가 납작해진다 */
        const data = cats.map((c, ci) => {
          const vals = names.map((nm, si) => at(si, ci)).sort((a, b) => a - b);
          const n = vals.length;
          const q = (p) => {
            if (n === 1) return vals[0];
            const idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
            return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
          };
          return { value: [vals[0], q(0.25), q(0.5), q(0.75), vals[n - 1]],
            itemStyle: { color: colorOf2(ci), borderColor: colorOf2(ci) } };
        });
        return {
          tooltip: { trigger: 'item' },
          xAxis: { type: 'category', data: cats, boundaryGap: true },
          yAxis: { type: 'value' },
          series: [{ type: 'boxplot', data }],
        };
      }
      if (type === 'sankey') {
        /* 생키다이어그램 — 시리즈(왼쪽 노드)에서 항목(오른쪽 노드)으로 값이 흐르는 굵기로 보여준다.
           노드는 이름으로 식별되는데 지금 데이터엔 시리즈명과 항목명이 우연히 겹칠 수 있어서
           (예: 시리즈 "자사물" · 항목 "자사물") 시리즈쪽 이름 끝에 안 보이는 문자를 붙여 구분한다 */
        const SUF = '​';
        const nodes = [
          ...names.map((nm, si) => ({ name: nm + SUF, itemStyle: { color: colorOf(si) } })),
          ...cats.map((c, ci) => ({ name: c, itemStyle: { color: colorOf2(ci) } })),
        ];
        const links = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => {
          const v = at(si, ci);
          if (v > 0) links.push({ source: nm + SUF, target: c, value: v });
        }));
        const stripSuf = (s) => String(s || '').replace(/​$/, '');
        return {
          tooltip: { trigger: 'item', formatter: (p) => p.dataType === 'edge'
            ? (stripSuf(p.data.source) + ' → ' + p.data.target + ': ' + coUtil.cofFmt(p.data.value))
            : stripSuf(p.name) },
          series: [{ type: 'sankey', emphasis: { focus: 'adjacency' }, data: nodes, links,
            label: { fontSize: 10, formatter: (p) => stripSuf(p.name) },
            lineStyle: { color: 'gradient', curveness: 0.5 } }],
        };
      }
      if (type === 'graph' || type === 'graphCircular') {
        /* 관계도 — 시리즈·항목을 노드로 두고 값이 있는 조합만 선으로 잇는다. 노드는 id 로
           식별되므로(생키와 달리) 이름이 겹쳐도 문제없다. 선 굵기는 값에 비례.
           원형관계도는 데이터가 완전히 같고 layout 만 force→circular 로 바꾼 변형(2026-08-21) */
        const isCircular = type === 'graphCircular';
        const allVals = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => allVals.push(at(si, ci))));
        const maxV = Math.max(1, ...allVals);
        const nodes = [
          ...names.map((nm, si) => ({ id: 's' + si, name: nm, symbolSize: 22, itemStyle: { color: colorOf(si) }, category: 0 })),
          ...cats.map((c, ci) => ({ id: 'i' + ci, name: c, symbolSize: 14, itemStyle: { color: colorOf2(ci) }, category: 1 })),
        ];
        const links = [];
        names.forEach((nm, si) => cats.forEach((c, ci) => {
          const v = at(si, ci);
          if (v > 0) links.push({ source: 's' + si, target: 'i' + ci, value: v, lineStyle: { width: 1 + 5 * (v / maxV) } });
        }));
        return {
          tooltip: {},
          legend: [{ data: ['시리즈', '항목'], bottom: 0, textStyle: { fontSize: 10 } }],
          series: [{
            type: 'graph', layout: isCircular ? 'circular' : 'force', roam: true, draggable: !isCircular,
            circular: isCircular ? { rotateLabel: true } : undefined,
            categories: [{ name: '시리즈' }, { name: '항목' }],
            force: isCircular ? undefined : { repulsion: 150, edgeLength: 90 },
            label: { show: true, fontSize: 9 },
            lineStyle: { color: 'source', curveness: isCircular ? 0.3 : 0.1, opacity: 0.6 },
            data: nodes, links,
          }],
        };
      }
      if (type === 'tree') {
        /* 트리(조직도) — 트리맵과 데이터가 완전히 같은 2단 계층(시리즈>항목)인데, tree 시리즈는
           뿌리가 하나여야 해서 맨 위에 가상의 루트 노드를 하나 씌운다(2026-08-21) */
        return {
          tooltip: { trigger: 'item', triggerOn: 'mousemove' },
          series: [{
            type: 'tree', orient: 'LR', top: '4%', left: '9%', bottom: '4%', right: '18%',
            symbolSize: 9, expandAndCollapse: false, initialTreeDepth: -1,
            label: { fontSize: 10, position: 'left', verticalAlign: 'middle', align: 'right' },
            leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } },
            data: [{
              name: panelForm.itemNm || '전체', itemStyle: { color: '#94a3b8' },
              children: names.map((nm, si) => ({
                name: nm, itemStyle: { color: colorOf(si) },
                children: cats.map((c, ci) => ({
                  name: c + ' (' + coUtil.cofFmt(at(si, ci)) + ')', value: at(si, ci),
                  itemStyle: { color: colorOf2(ci) },
                })),
              })),
            }],
          }],
        };
      }
      if (type === 'pictorialBar') {
        /* 픽토그램막대 — 데이터·색상은 일반 막대와 완전히 같고, 막대 대신 작은 도형을 반복해 쌓는다 */
        return {
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0, type: 'plain' },
          grid: { left: 48, right: 16, top: 20, bottom: 48 },
          xAxis: { type: 'category', data: cats },
          yAxis: { type: 'value' },
          series: names.map((nm, si) => ({
            name: nm, type: 'pictorialBar',
            symbol: 'roundRect', symbolRepeat: true, symbolSize: ['60%', '12%'], symbolMargin: '20%',
            itemStyle: { color: colorOf(si) },
            data: cats.map((c, ci) => at(si, ci)),
          })),
        };
      }
      const isArea = type === 'area' || type === 'stackedArea';
      /* 누적(stack) 은 막대뿐 아니라 꺾은선·영역도 지원한다 — base 는 셋 다 렌더 방식이 다르므로
         (막대=bar, 나머지=line) type 별로 갈라 정한다(2026-08-21) */
      const isStacked = type === 'stackedBar' || type === 'stackedLine' || type === 'stackedArea';
      const base = type === 'stackedBar' ? 'bar'
        : (isArea || type === 'line' || type === 'stackedLine') ? 'line'
        : (type === 'radar' ? 'line' : type);
      /* 기본 차트 스타일이 딱딱해 보인다는 피드백(2026-08-21) — 막대는 위 모서리를 둥글리고
         살짝 그림자를 줘 입체감을, 축·그리드선은 옅게 낮춰 부드러운 인상을 준다.
         누적막대는 구간마다 둥글리면 이어붙은 자리가 들쭉날쭉해 보여 굴림·그림자를 뺀다 */
      const softBar = base === 'bar' && !isStacked;
      const series = names.map((nm, si) => ({
        name: nm,
        type: base === 'scatter' ? 'scatter' : base,
        stack: isStacked ? 'total' : undefined,
        itemStyle: softBar
          ? { color: colorOf(si), borderRadius: [6, 6, 0, 0], shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.10)', shadowOffsetY: 3 }
          : { color: colorOf(si) },
        areaStyle: isArea ? { opacity: 0.75 } : undefined,
        smooth: base === 'line',
        symbol: base === 'line' ? 'circle' : undefined,
        symbolSize: base === 'line' ? 6 : undefined,
        lineStyle: base === 'line' ? { width: 3 } : undefined,
        label: isStacked && base === 'bar'
          ? { show: true, position: 'inside', fontSize: 10, color: '#fff', fontWeight: 700,
              formatter: (p) => nm + '\n' + coUtil.cofFmt(p.value) }
          : { show: true, position: 'top', fontSize: 10, color: '#334155', formatter: (p) => coUtil.cofFmt(p.value) },
        data: cats.map((c, ci) => at(si, ci)),
      }));
      if (isStacked) {
        /* 누적 계열 위 합계 마커 — 팔레트1(시리즈색)은 이미 각 구간에 쓰이므로, 팔레트2(항목색)를
           "전체(=항목) 합계" 마커에 얹어 항목별 구분을 추가로 보여준다(2026-08-21) */
        const totalAt = (ci) => names.reduce((sum, nm, si) => sum + at(si, ci), 0);
        series.push({
          name: '합계', type: 'scatter', z: 10, symbolSize: 9, tooltip: { show: false },
          label: { show: true, position: 'top', fontWeight: 700, color: '#334155',
            formatter: (p) => coUtil.cofFmt(p.value) },
          data: cats.map((c, ci) => ({ value: totalAt(ci), itemStyle: { color: colorOf2(ci) } })),
        });
      }
      return {
        tooltip: { trigger: 'axis' },
        /* 합계 마커는 범례에서 뺀다(names 만 나열) — 팔레트2 다색이라 범례 스와치 1개로 표현이
           안 되고, 이미 마커 라벨로 값이 보이므로 범례 항목으로는 불필요하다 */
        legend: { bottom: 0, type: 'plain', data: isStacked ? names : undefined,
          icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#64748b', fontSize: 11 } },
        grid: { left: 48, right: 16, top: 40, bottom: 64 },  /* 범례가 scroll→plain(2줄 가능)로 바뀌어 여유를 더 둔다 */
        xAxis: { type: 'category', data: cats, axisLine: { lineStyle: { color: '#dde3ea' } },
          axisTick: { show: false }, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#eef1f5', type: 'dashed' } } },
        series,
      };
    };
    const cfAutoOption = computed(() => fnBuildOptionForType(panelForm.chartTypeCd || 'bar'));

    /* compareState — 우측 "다른 차트유형으로 보기" 전용. panelForm.chartTypeCd(실제 저장값)
       와 완전히 독립적이라 여기서 바꿔봐도 저장에는 전혀 영향이 없다 */
    const compareState = reactive({ chartTypeCd: 'line' });
    const cfCompareOption = computed(() => fnBuildOptionForType(compareState.chartTypeCd));

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
    const SRC_AUTO_MS = 400;
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

    /* cfPagedPanels / cfPagedChartKeys — panelsPager 기준 이번 페이지의 차트(1레벨) 집합.
       목록(그리드) 모드는 이 슬라이스를 그대로 rows 로 쓰고, 트리 모드는 이 집합에 속한
       차트의 노드만 cfTreeVisible 에 남겨 부모(차트)·자식(시리즈·항목)이 페이지 경계로
       갈라지지 않게 한다 */
    const cfPagedPanels = computed(() => {
      const start = (panelsPager.pageNo - 1) * panelsPager.pageSize;
      return panels.slice(start, start + panelsPager.pageSize);
    });
    const cfPagedChartKeys = computed(() => new Set(cfPagedPanels.value.map(p => p.itemKey)));

    /* cfTreeVisible — 접힘 상태 + "2번째 시리즈부터는 항목 생략" 규칙 + 이번 페이지 차트만 반영 */
    const cfTreeVisible = computed(() => treeRows.filter((n) => {
      if (!cfPagedChartKeys.value.has(String(n.itemKey || '').split('-')[0])) return false;
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

    /* cfTreeNoMap — 계층형 번호(1 / 1.1 / 1.1.1 / 1.2 / 2 ...). cfTreeVisible 은 이미 부모→자식
       순서로 정렬된 평면 배열이므로, 레벨별 카운터를 두고 훑으면서 번호를 매긴다.
       1레벨(차트) 카운터는 현재 페이지 시작 오프셋부터 이어서 매겨 페이지가 바뀌어도
       번호가 끊기지 않게 한다(다른 Mng 목록의 "번호 = (pageNo-1)*pageSize + idx + 1" 규칙과 동일). */
    const cfTreeNoMap = computed(() => {
      const map = new Map();
      const counters = [0, (panelsPager.pageNo - 1) * panelsPager.pageSize, 0, 0];
      cfTreeVisible.value.forEach((n) => {
        counters[n.lvl] = (counters[n.lvl] || 0) + 1;
        for (let l = n.lvl + 1; l < counters.length; l++) counters[l] = 0;
        map.set(n.itemKey, Array.from({ length: n.lvl }, (_, i) => counters[i + 1]).join('.'));
      });
      return map;
    });
    const fnTreeNo = (node) => cfTreeNoMap.value.get(node.itemKey) || '';

    /* onPanelsSetPage / onPanelsSizeChange — <bo-pager> 콜백. API 재호출 없이 이미 로드된
       panels/treeRows 를 다시 슬라이스만 한다(트리·목록 두 모드가 이 pager 하나를 공유) */
    const onPanelsSetPage = (n) => { panelsPager.pageNo = n; };
    const onPanelsSizeChange = () => {
      panelsPager.pageNo = 1;
      panelsPager.pageTotalPage = Math.max(1, Math.ceil(panels.length / panelsPager.pageSize));
    };

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

    /* fnRefItemNm — 쿼리방식(QUERY) 위젯의 참조항목(refItemKey, 예:'chart036')을 이름으로
       바꿔 보여준다. 대시보드가 다르면 트리에 없을 수 있어 이름을 못 찾으면 코드 그대로 표시 */
    const fnRefItemNm = (refItemKey) => {
      if (!refItemKey) return '-';
      const found = treeRows.find(n => n.lvl === 1 && n.itemKey === refItemKey)
        || panels.find(p => p.itemKey === refItemKey);
      return (found && found.itemNm) ? found.itemNm : refItemKey;
    };

    const columns = {};

    columns.baseSearch = [
      { key: 'searchValue', type: 'text', placeholder: '대시보드명/컴포넌트명 검색', label: '대시보드명' },
      { key: 'itemNm', type: 'text', placeholder: '위젯항목명 검색(차트·시리즈·항목)', label: '위젯항목명' },
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
      { key: 'dashboardId', label: '대시보드', type: 'select', required: true, colSpan: 2,
        options: () => dashboards.map(d => ({ value: d.dashboardId, label: d.dashboardNm })),
        hint: '다른 대시보드로 바꾸면 저장 시 이 항목과 하위 시리즈·항목이 통째로 그 대시보드로 옮겨간다' },
      { key: 'itemKey', label: '항목 키', type: 'text', required: true, mono: true, placeholder: 'COMP0101' },
      { key: 'itemNm', label: '항목명', type: 'text', required: true, colSpan: 2 },
      { key: 'widgetTypeCd', label: '항목유형', type: 'select',
        options: () => util.ITEM_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      /* 차트종류는 차트일 때만 물어본다 — KPI·목록에는 의미가 없다.
         기본/응용/입체(3D) 구분이 <optgroup> 으로 필요해 slot 으로 뺀다(2026-08-21, 다른 select
         타입 컬럼과 달리 BoFormArea 의 옵션 배열은 그룹을 표현할 수 없어서 — 화면 전용 처리) */
      { key: '_chartTypeCd', label: '차트종류', type: 'slot', name: 'chartTypeCd',
        visible: (form) => form.widgetTypeCd === 'CHART' },
      /* 색상 팔레트는 optionJson 안에 얹어서 저장하는 파생값이라(폼 필드 직접 바인딩 불가)
         slot 으로 뺀다 — cfColorPaletteCd/cfColorPaletteCd2 computed(get/set) 가 실제 저장을 담당.
         한 슬롯 안에 팔레트1(시리즈용)·팔레트2(항목용, 파이/도넛)를 나란히 둔다 — cols=3 표 준을
         지키면서 "팔레트 우측에 팔레트2" 요청을 한 칸 안에서 충족한다(2026-08-21) */
      { key: '_colorPaletteCd', label: '색상 팔레트 (1시리즈/2항목)', type: 'slot', name: 'colorPaletteCd',
        visible: (form) => form.widgetTypeCd === 'CHART',
        hint: '1=막대·꺾은선 등 시리즈 색상 순서(기본값 01. 기본), 2=파이·도넛 등 항목 색상 순서(기본값 02. 비비드)' },
      /* 위젯생성타입 — MANUAL(기존, 화면에서 시리즈·항목 직접 정의) / QUERY(SQL 실행 결과로 자동
         생성). QUERY 선택 시에만 참조항목·생성쿼리·실행 버튼이 아래에 나타난다(2026-08-21) */
      { key: 'widgetGenTypeCd', label: '위젯생성타입', type: 'select',
        options: () => [
          { value: 'MANUAL', label: '매뉴얼 방식 (화면에서 시리즈·항목 직접 정의)' },
          { value: 'QUERY',  label: '쿼리 방식 (SQL 실행 결과로 자동 생성)' },
        ] },
      { key: 'refItemKey', label: '참조항목(item_key)', type: 'text', mono: true,
        placeholder: '예: chart036 (정보 표시용 — 실제 데이터 조회와는 무관)',
        visible: (form) => form.widgetGenTypeCd === 'QUERY' },
      { key: '_genQuery', label: '생성 쿼리(SQL)', type: 'slot', name: 'genQuery', colSpan: 3,
        visible: (form) => form.widgetGenTypeCd === 'QUERY',
        hint: 'SELECT 단문만 허용. 결과 컬럼 5개를 이 순서로: series_cd, series_nm, item_cd, item_nm, val_num. :siteId 자리표시자 지원' },
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
        placeholder: '예: site_id,yyyymm (비우면 이 기본값 적용)',
        hint: '콤마로 나눈 조회조건 토큰 목록 — 날짜 토큰명이 기간구분을 겸함: yyyymmdd(일별) / yyyymm(월별) / yyyy(연도별). 필요시 prod_id·vendor_id 추가' },
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
      itemPdfAreaRef, handleExportItemPdf,
      dashState, panelDetail, panelForm, panelErrors, columns, util,
      cfCurDash, cfDtlMode,
      /* 3레벨 트리 */
      treeRows, treeState, cfTreeVisible, cfTreeNoMap, fnTreeNo,
      panelsPager, cfPagedPanels, onPanelsSetPage, onPanelsSizeChange,
      fnHasChild, fnToggleNode, fnTreeExpandAll, fnTreeCollapseAll, fnIsFirstSeries,
      fnLvlBullet, fnLvlColor, fnLvlLabel, fnRefItemNm,
      /* 2·3레벨 편집 그리드 */
      seriesRows, colRows, grpCodes,
      fnGrpOptions, onGrpChange, onPickCode, fnPreviewCode,
      fnAddSeriesRow, fnAddColRow, fnDelSeriesRow, fnDelColRow,
      onRowDragStart, onRowDragOver, onRowDragEnd,
      /* 시뮬레이션 값 · 미리보기 */
      simVals, simOrient, fnSimFit, fnSimRandom, fnSimClear, fnSimRowTotal, fnSimColTotal, fnSimGrandTotal,
      fnToggleColAuto, fnToggleColEditable, fnColAuto, fnColLocked, fnPanelOf,
      fnToggleAllAuto, fnToggleAllEditable,
      cfSimSeriesNms, cfSimColNms, cfPreviewOption, cfColorPaletteCd, cfActivePalette,
      cfColorPaletteCd2, cfActivePalette2,
      compareState, cfCompareOption,
      /* 소스보기 */
      srcState, SRC_TABS, fnSrcApply, fnSrcReset,
      fnSrcTouch, onAutoApplyToggle, cfHlCode, cfSrcCode, onCodeScroll, hlRef,
      handleBtnAction, handleGridCellAction, handleGenerateFromQuery, genRefYmd,
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
    <bo-container title="대시보드 위젯항목 목록"
      :count-text="'총 ' + panels.length + '개'">
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
        <div v-if="cfTreeVisible.length" style="height:540px;overflow:auto;">
          <table class="bo-table bo-table-narrow">
            <thead>
              <tr>
                <th style="width:64px;text-align:left;">번호</th>
                <th style="width:120px;">대시보드명</th>
                <th style="width:56px;">레벨</th>
                <th style="min-width:220px;">항목명 (차트 · 시리즈 · 항목)</th>
                <th style="width:150px;">생성방식</th>
                <th style="width:120px;">코드</th>
                <th style="width:210px;">고유 item_key</th>
                <th style="width:64px;">행개수</th>
                <th style="width:64px;">열개수</th>
                <th style="width:150px;">조회조건(input_opts)</th>
                <th style="width:96px;">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="node in cfTreeVisible" :key="node.itemKey"
                :class="node.lvl === 1 ? (panelDetail.selectedId === node.dashboardItemId ? 'bo-row-selected' : '') : ''">
                <td style="text-align:left;font-size:11px;color:#94a3b8;white-space:nowrap;">{{ fnTreeNo(node) }}</td>
                <td style="font-size:11px;color:#64748b;white-space:nowrap;">
                  {{ node.lvl === 1 ? (node._dashboardNm || '-') : '' }}</td>
                <td style="text-align:center;">
                  <span class="badge" :class="node.lvl === 1 ? 'badge-red' : (node.lvl === 2 ? 'badge-blue' : 'badge-gray')">
                    {{ fnLvlLabel(node.lvl) }}</span>
                </td>
                <td style="white-space:nowrap;">
                  <span style="display:inline-flex;align-items:center;gap:4px;"
                    :style="{ marginLeft:((node.lvl - 1) * 18) + 'px' }">
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
                <!-- 위젯생성타입 — 기존(MANUAL) / 쿼리(QUERY, SQL 실행 결과로 자동 생성) + 참조항목명(2026-08-21) -->
                <td style="white-space:nowrap;">
                  <template v-if="node.lvl === 1">
                    <span class="badge" :class="node.widgetGenTypeCd === 'QUERY' ? 'badge-purple' : 'badge-gray'">
                      {{ node.widgetGenTypeCd === 'QUERY' ? '🔗 쿼리' : '매뉴얼' }}</span>
                    <div v-if="node.widgetGenTypeCd === 'QUERY'" style="font-size:10px;color:#7c3aed;margin-top:2px;"
                      title="SQL 실행 결과로 자동 생성됨">참조: {{ fnRefItemNm(node.refItemKey) }}</div>
                  </template>
                </td>
                <td style="font-family:monospace;font-size:11px;color:#2563eb;">{{ node.itemCd }}</td>
                <td style="font-family:monospace;font-size:11px;color:#64748b;">{{ node.itemKey }}</td>
                <td style="text-align:center;">{{ node.lvl === 1 ? ((node._seriesCnt || 0) + '개') : '' }}</td>
                <td style="text-align:center;">{{ node.lvl === 1 ? ((node._colCnt || 0) + '개') : '' }}</td>
                <td style="font-family:monospace;font-size:10.5px;color:#94a3b8;">
                  {{ node.lvl === 1 ? (node.inputOpts || 'site_id,yyyymm') : '' }}</td>
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
          {{ dashState.selectedId ? '항목이 없습니다. [+ 항목 추가]로 등록하세요.' : '항목이 없습니다. 상단 [조회]를 눌러보거나 좌측에서 특정 대시보드를 선택하세요.' }}
        </div>
        <div v-if="cfTreeVisible.length" style="padding:6px 12px;font-size:11px;color:#94a3b8;border-top:1px solid #f0f0f0;">
          2·3레벨은 차트의 <b>시리즈 정의 JSON</b> / <b>항목 정의 JSON</b> 에서 옵니다 — 차트 행의 [수정]에서 편집하세요.
        </div>
      </div>

      <!-- ===== ■. 평면 목록 (기존 그리드) =================================== -->
      <bo-grid v-if="uiState.viewMode === 'grid'"
        bare :columns="columns.panels" :rows="cfPagedPanels" row-key="dashboardItemId"
        :loading="uiState.panelLoading" :selected-key="panelDetail.selectedId" table-max-height="540px" fixed-height
        :row-class="row => panelDetail.selectedId === row.dashboardItemId ? 'active' : ''"
        :empty-text="dashState.selectedId ? '항목이 없습니다. [+ 항목 추가]로 등록하세요.' : '항목이 없습니다. 상단 [조회]를 눌러보거나 좌측에서 특정 대시보드를 선택하세요.'"
        grid-id="panels-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
            <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
          </div>
        </template>
      </bo-grid>
      <bo-pager :pager="panelsPager" :on-set-page="onPanelsSetPage" :on-size-change="onPanelsSizeChange" />
    </bo-container>
  </div>

  <!-- ===== ■. 항목 상세 폼 (전체 폭 · 항상 표시 — 미선택 시 안내) ============ -->
  <bo-container :title="!panelDetail.show ? '대시보드 위젯항목 상세' : (panelDetail.isNew ? '대시보드 위젯항목 신규' : (cfDtlMode ? '대시보드 위젯항목 상세' : '대시보드 위젯항목 수정'))"
    :title-id="panelDetail.selectedId ? panelForm.dashboardItemId : ''">
    <template v-if="panelDetail.show" #toolbar-actions>
      <button class="btn btn_excel"
        :disabled="uiState.pdfExporting" @click="handleExportItemPdf">
        {{ uiState.pdfExporting ? 'PDF 생성 중...' : '📄 PDF 다운로드' }}</button>
      <!-- 저장/취소(수정/닫기)를 PDF 다운로드 우측으로 이동(2026-08-21, 예전엔 폼 하단 form-actions) -->
      <template v-if="cfDtlMode">
        <button class="btn btn_edit" @click="handleBtnAction('panelForm-edit')">수정</button>
        <button class="btn btn_close" @click="handleBtnAction('panelForm-close')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn_save" @click="handleBtnAction('panelForm-save')">저장</button>
        <button class="btn btn_cancel" @click="handleBtnAction('panelForm-cancel')">취소</button>
      </template>
    </template>
    <div v-if="panelDetail.show" ref="itemPdfAreaRef" style="padding:12px;">
      <!-- compact: 상품수정(PdProdDtl) 과 같은 폼 높이·간격 기준 -->
      <bo-form-area :columns="columns.panelForm" :form="panelForm" :errors="panelErrors"
        :cols="3" :show-actions="false" :readonly="cfDtlMode" compact plain-readonly>

        <!-- ===== ■. 차트종류 — 기본/응용/입체(3D) 구분을 <optgroup> 으로 보여준다 =========== -->
        <template #chartTypeCd>
          <select class="form-control" v-model="panelForm.chartTypeCd" :disabled="cfDtlMode">
            <optgroup v-for="g in util.CHART_TYPE_GROUPS" :key="g.key" :label="g.label">
              <option v-for="c in g.items" :key="c.value" :value="c.value">{{ c.icon }} {{ c.label }}</option>
            </optgroup>
          </select>
        </template>

        <!-- ===== ■. 색상 팔레트 1(시리즈) + 2(항목) — optionJson.colorPaletteCd/colorPaletteCd2 -->
        <template #colorPaletteCd>
          <div style="display:flex;align-items:center;gap:6px;">
            <select class="form-control" v-model="cfColorPaletteCd" :disabled="cfDtlMode" style="flex:1;min-width:0;">
              <option v-for="o in util.DASH_WIDGET_COLOR_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">2</span>
            <select class="form-control" v-model="cfColorPaletteCd2" :disabled="cfDtlMode" style="flex:1;min-width:0;">
              <option v-for="o in util.DASH_WIDGET_COLOR_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </template>

        <!-- ===== ■. 생성 쿼리(SQL, 위젯생성타입=QUERY 일 때만) ============= -->
        <template #genQuery>
          <div>
            <textarea class="form-control" v-model="panelForm.genQuery" :disabled="cfDtlMode" rows="5"
              style="font-family:monospace;font-size:12px;"
              placeholder="SELECT series_cd, series_nm, item_cd, item_nm, val_num FROM ... WHERE site_id = :siteId AND ... = :yyyymmdd ..."></textarea>
            <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;">
                기준일자
                <input type="text" class="form-control" v-model="genRefYmd" :disabled="cfDtlMode"
                  placeholder="YYYYMMDD" maxlength="8" style="width:100px;font-family:monospace;" />
              </span>
              <button class="btn" style="background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;font-weight:700;"
                :disabled="cfDtlMode" @click="handleGenerateFromQuery">🔗 쿼리 실행 → 자동생성</button>
              <span style="font-size:11px;color:#94a3b8;">저장 후 실행하세요 — :siteId/:yyyymmdd/:yyyymm 자리표시자에 기준일자(8자리)가 실려 나갑니다. 실행 결과로 시리즈·항목·값이 자동수집(수정불가)으로 채워집니다.</span>
            </div>
          </div>
        </template>

        <!-- ===== ■. 2레벨 시리즈 정의 (행 그리드) ========================= -->
        <template #seriesGrid>
          <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <div style="padding:6px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
              <button class="btn btn_new" :disabled="cfDtlMode" @click="fnAddSeriesRow()">+ 시리즈 추가</button>
            </div>
            <table class="bo-table bo-table-narrow">
              <thead>
                <tr>
                  <th style="width:28px;background:#ffe8cf;"></th>
                  <th style="width:44px;background:#ffe8cf;">순서</th>
                  <th style="width:190px;background:#ffe8cf;">코드 (cd)</th>
                  <th style="background:#ffe8cf;">시리즈명 (name)</th>
                  <th style="width:150px;background:#ffe8cf;">색상 (color)</th>
                  <th style="width:230px;background:#ffe8cf;">고유 item_key 미리보기</th>
                  <th style="width:60px;background:#ffe8cf;">관리</th>
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
                  <th style="width:28px;background:#eaf2ff;"></th>
                  <th style="width:44px;background:#eaf2ff;">순서</th>
                  <th style="width:190px;background:#eaf2ff;">코드 (cd)</th>
                  <th style="background:#eaf2ff;">항목명 (name)</th>
                  <th style="width:150px;background:#eaf2ff;">색상 (color, 파이용)</th>
                  <th style="width:230px;background:#eaf2ff;">고유 item_key 미리보기</th>
                  <th style="width:60px;background:#eaf2ff;">관리</th>
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
                  <td>
                    <div style="display:flex;align-items:center;gap:4px;">
                      <input type="color" v-model="r.color" :disabled="cfDtlMode"
                        style="width:32px;height:26px;padding:0;border:1px solid #d1d5db;border-radius:4px;" />
                      <input type="text" class="form-control" v-model="r.color" :disabled="cfDtlMode"
                        placeholder="#6366f1" style="font-family:monospace;font-size:11px;" />
                    </div>
                  </td>
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
            <div style="padding:6px 8px;background:#fff7ed;border-bottom:1px solid #fed7aa;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11.5px;color:#c2410c;">
                여기 값은 <b>미리보기 전용</b>입니다 — 저장되지 않습니다. 실제 값 입력은 [대시보드 데이타관리].</span>
              <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#92400e;">
                  시리즈표시방법
                  <select class="form-control" v-model="simOrient"
                    style="width:auto;padding:2px 6px;font-size:11px;min-height:24px;">
                    <option value="ROW">행 (시리즈=행 · 항목=열)</option>
                    <option value="COL">열 (항목=행 · 시리즈=열)</option>
                  </select>
                </span>
                <button class="btn" @click="fnSimRandom()"
                  style="background:#fff;color:#c2410c;border:1px solid #fed7aa;font-weight:700;">🎲 데이타자동생성</button>
                <button class="btn btn_reset" @click="fnSimClear()">비우기</button>
              </span>
            </div>
            <div v-if="colRows.length" style="overflow-x:auto;">
              <!-- ROW: 시리즈=행 · 항목=열 (기본) -->
              <table v-if="simOrient !== 'COL'" class="bo-table bo-table-narrow">
                <thead>
                  <tr>
                    <th style="width:150px;background:#eef1f5;color:#475569;padding:4px 6px;font-size:11px;">
                      시리즈 \\ 항목
                      <span style="display:inline-flex;gap:4px;margin-left:4px;">
                        <span @click="fnToggleAllAuto()" title="전체 자동수집 켜기/끄기" style="cursor:pointer;font-size:10px;">🤖</span>
                        <span @click="fnToggleAllEditable()" title="전체 수정불가 켜기/끄기" style="cursor:pointer;font-size:10px;">🔒</span>
                      </span>
                    </th>
                    <th v-for="(c, ci) in cfSimColNms" :key="'sc'+ci" style="min-width:96px;background:#eaf2ff;padding:4px 6px;font-size:11px;">
                      {{ c }}
                    </th>
                    <th style="width:80px;padding:4px 6px;font-size:11px;">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(nm, si) in cfSimSeriesNms" :key="'sr'+si">
                    <td style="font-weight:600;background:#ffe8cf;">{{ nm }}</td>
                    <td v-for="(c, ci) in cfSimColNms" :key="'sv'+si+'_'+ci"
                      :style="'padding:2px 4px;position:relative;' + (fnColLocked(si, ci) ? 'background:#f1f5f9;' : '')">
                      <!-- 자동수집 표시(왼쪽 위 녹색 삼각형, 데이터관리 그리드와 동일한 표시) +
                           자동수집/수정가능 토글(오른쪽 위 작은 아이콘, 클릭으로 전환)(2026-08-21) -->
                      <span v-if="fnColAuto(si, ci)"
                        style="position:absolute;top:0;left:0;width:0;height:0;border-top:9px solid #16a34a;border-right:9px solid transparent;z-index:1;"
                        title="자동수집 항목"></span>
                      <span style="position:absolute;top:1px;right:2px;display:flex;gap:2px;z-index:2;line-height:1;">
                        <span @click="fnToggleColAuto(si, ci)" title="자동수집여부(클릭으로 전환)"
                          :style="'cursor:pointer;font-size:8px;' + (fnColAuto(si, ci) ? 'opacity:1;' : 'opacity:.2;')">🤖</span>
                        <span @click="fnToggleColEditable(si, ci)" title="수정가능여부(클릭으로 전환 · 켜면 잠금)"
                          :style="'cursor:pointer;font-size:8px;' + (fnColLocked(si, ci) ? 'opacity:1;' : 'opacity:.2;')">🔒</span>
                      </span>
                      <input type="number" class="form-control"
                        :disabled="fnColLocked(si, ci)"
                        :style="'text-align:right;padding-right:26px;' + (fnColLocked(si, ci) ? 'background:#e2e8f0;color:#64748b;' : '')"
                        :value="simVals[si] ? simVals[si][ci] : null"
                        @input="e => { fnSimFit(); simVals[si][ci] = e.target.value; }" />
                    </td>
                    <td style="text-align:right;font-weight:700;color:#475569;background:#eef1f5;">{{ fnSimRowTotal(si) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style="font-weight:700;background:#eef1f5;color:#475569;">합계</td>
                    <td v-for="(c, ci) in cfSimColNms" :key="'ct'+ci"
                      style="text-align:right;font-weight:700;background:#eef1f5;color:#475569;">{{ fnSimColTotal(ci) }}</td>
                    <td style="text-align:right;font-weight:700;background:#e9edf3;color:#1f4a73;">{{ fnSimGrandTotal() }}</td>
                  </tr>
                </tfoot>
              </table>
              <!-- COL: 항목=행 · 시리즈=열 (전치 보기, simVals 물리적 변경 없이 렌더 순서만 교체) -->
              <table v-else class="bo-table bo-table-narrow">
                <thead>
                  <tr>
                    <th style="width:150px;background:#eef1f5;color:#475569;padding:4px 6px;font-size:11px;">
                      항목 \\ 시리즈
                      <span style="display:inline-flex;gap:4px;margin-left:4px;">
                        <span @click="fnToggleAllAuto()" title="전체 자동수집 켜기/끄기" style="cursor:pointer;font-size:10px;">🤖</span>
                        <span @click="fnToggleAllEditable()" title="전체 수정불가 켜기/끄기" style="cursor:pointer;font-size:10px;">🔒</span>
                      </span>
                    </th>
                    <th v-for="(nm, si) in cfSimSeriesNms" :key="'cs'+si" style="min-width:96px;background:#ffe8cf;padding:4px 6px;font-size:11px;">{{ nm }}</th>
                    <th style="width:80px;padding:4px 6px;font-size:11px;">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(c, ci) in cfSimColNms" :key="'cr'+ci">
                    <td style="font-weight:600;background:#eaf2ff;">{{ c }}</td>
                    <td v-for="(nm, si) in cfSimSeriesNms" :key="'cv'+ci+'_'+si"
                      :style="'padding:2px 4px;position:relative;' + (fnColLocked(si, ci) ? 'background:#f1f5f9;' : '')">
                      <!-- 자동수집 표시(왼쪽 위 녹색 삼각형, 데이터관리 그리드와 동일한 표시) +
                           자동수집/수정가능 토글(오른쪽 위 작은 아이콘, 클릭으로 전환)(2026-08-21) -->
                      <span v-if="fnColAuto(si, ci)"
                        style="position:absolute;top:0;left:0;width:0;height:0;border-top:9px solid #16a34a;border-right:9px solid transparent;z-index:1;"
                        title="자동수집 항목"></span>
                      <span style="position:absolute;top:1px;right:2px;display:flex;gap:2px;z-index:2;line-height:1;">
                        <span @click="fnToggleColAuto(si, ci)" title="자동수집여부(클릭으로 전환)"
                          :style="'cursor:pointer;font-size:8px;' + (fnColAuto(si, ci) ? 'opacity:1;' : 'opacity:.2;')">🤖</span>
                        <span @click="fnToggleColEditable(si, ci)" title="수정가능여부(클릭으로 전환 · 켜면 잠금)"
                          :style="'cursor:pointer;font-size:8px;' + (fnColLocked(si, ci) ? 'opacity:1;' : 'opacity:.2;')">🔒</span>
                      </span>
                      <input type="number" class="form-control"
                        :disabled="fnColLocked(si, ci)"
                        :style="'text-align:right;padding-right:26px;' + (fnColLocked(si, ci) ? 'background:#e2e8f0;color:#64748b;' : '')"
                        :value="simVals[si] ? simVals[si][ci] : null"
                        @input="e => { fnSimFit(); simVals[si][ci] = e.target.value; }" />
                    </td>
                    <td style="text-align:right;font-weight:700;color:#475569;background:#eef1f5;">{{ fnSimColTotal(ci) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style="font-weight:700;background:#eef1f5;color:#475569;">합계</td>
                    <td v-for="(nm, si) in cfSimSeriesNms" :key="'st'+si"
                      style="text-align:right;font-weight:700;background:#eef1f5;color:#475569;">{{ fnSimRowTotal(si) }}</td>
                    <td style="text-align:right;font-weight:700;background:#e9edf3;color:#1f4a73;">{{ fnSimGrandTotal() }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else style="padding:18px;text-align:center;color:#aaa;font-size:12px;">
              먼저 위에서 <b>3레벨 항목</b>을 추가하면 값 입력칸이 생깁니다.</div>
          </div>
        </template>

        <!-- ===== ■. 미리보기 (좌: 저장될 차트유형 / 우: 다른 유형으로 비교) === -->
        <template #simPreview>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <!-- 좌측 — 실제 저장되는 chartTypeCd 그대로 -->
            <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;font-size:12.5px;color:#1f4a73;">{{ panelForm.itemNm || '(항목명 미입력)' }}</span>
                <span class="badge badge-blue">{{ panelForm.chartTypeCd || '-' }}</span>
                <span style="margin-left:auto;font-size:11px;color:#94a3b8;">저장될 유형</span>
              </div>
              <!-- id 는 스타일 탭의 CSS 적용 범위를 가두는 기준점 -->
              <div v-if="colRows.length" id="cm-dash-src-preview" style="padding:8px;">
                <co-echart :option="cfPreviewOption" :height="srcState.previewHeight || '260px'" not-merge />
              </div>
              <div v-else style="padding:28px;text-align:center;color:#aaa;font-size:12px;">
                항목(3레벨)과 시뮬레이션 값을 입력하면 차트가 표시됩니다.</div>
            </div>
            <!-- 우측 — 다른 차트유형이라면? 저장값과 무관한 비교 전용 -->
            <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;color:#64748b;">비교</span>
                <select v-model="compareState.chartTypeCd" class="form-control" style="width:auto;padding:2px 6px;font-size:12px;">
                  <optgroup v-for="g in util.CHART_TYPE_GROUPS" :key="g.key" :label="g.label">
                    <option v-for="c in g.items" :key="c.value" :value="c.value">{{ c.icon }} {{ c.label }}</option>
                  </optgroup>
                </select>
                <span style="margin-left:auto;font-size:11px;color:#94a3b8;">저장에 영향 없음</span>
              </div>
              <div v-if="colRows.length" style="padding:8px;">
                <co-echart :option="cfCompareOption" :height="srcState.previewHeight || '260px'" not-merge />
              </div>
              <div v-else style="padding:28px;text-align:center;color:#aaa;font-size:12px;">
                항목(3레벨)과 시뮬레이션 값을 입력하면 차트가 표시됩니다.</div>
            </div>
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
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      대시보드 위젯항목 목록에서 항목을 선택하거나 [+ 항목 추가]를 클릭하세요.</div>
  </bo-container>
</bo-page>
`,
};

/* ShopJoy Admin - 대시보드 기준관리
 * cm_dashboard(대시보드 정의) + cm_dashboard_item(패널 정의) 기준정보 CRUD.
 * 상단: 대시보드 목록(전체 로드) + 인라인 상세폼
 * 하단: 선택 대시보드의 패널 목록 + 패널 인라인 폼 (배치설정 화면 바로가기 제공)
 */
window.CmDashboardMng = {
  name: 'CmDashboardMng',
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
    const panelCnt   = reactive({});   /* dashboardId → 패널 수 */
    const uiState = reactive({ loading: false, panelLoading: false, isPageCodeLoad: false });
    const codes = reactive({});

    const searchParam = reactive({ searchValue: '', useYn: '' });

    /* baseDetail — 대시보드 인라인 상세 폼 상태 */
    const baseDetail = reactive({ selectedId: null, isNew: false });
    const _initBaseForm = () => ({
      dashboardId: null, dashboardNm: '', uiCompNm: '', layoutCols: 4, sortOrd: 10, useYn: 'Y', ownerUserId: '', remark: '',
    });
    const baseForm = reactive(_initBaseForm());
    const baseErrors = reactive({});

    /* panelDetail — 패널 인라인 폼 상태 */
    const panelDetail = reactive({ selectedId: null, isNew: false, show: false });
    const _initPanelForm = () => ({
      dashboardItemId: null, itemKey: '', itemNm: '', chartType: 'bar', sortOrd: 10,
      panelWidth: 1, panelHeight: 1, realtimeYn: 'N', useYn: 'Y', seriesJson: '', optionJson: '',
    });
    const panelForm = reactive(_initPanelForm());
    const panelErrors = reactive({});

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    /* 개인화 대시보드 여부 — ownerUserId(운영 표준) 우선, 구 규약(uiCompNm 'MY:' 접두어) fallback */
    const fnIsMyDash = (row) => !!row.ownerUserId || (row.uiCompNm || '').indexOf('MY:') === 0;

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  return handleSearchList();
      if (cmd === 'searchParam-reset') { searchParam.searchValue = ''; searchParam.useYn = ''; return handleSearchList(); }
      if (cmd === 'dashboards-add')    return openDashNew();
      if (cmd === 'baseForm-save')     return handleSaveDash();
      if (cmd === 'baseForm-close')    return resetDashDetail();
      if (cmd === 'dashboards-layout') { return props.navigate('cmDashboardLayoutMng', { dtlId: baseDetail.selectedId }); }
      if (cmd === 'panels-add')        return openPanelNew();
      if (cmd === 'panelForm-save')    return handleSavePanel();
      if (cmd === 'panelForm-close')   { panelDetail.show = false; panelDetail.selectedId = null; return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'dashboards-cellClick') {
        if (colKey === 'btn_row_edit')   return openDashEdit(row);
        if (colKey === 'btn_row_delete') return handleDeleteDash(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return openDashEdit(row);
        return;
      }
      if (cmd === 'panels-cellClick') {
        if (colKey === 'btn_row_edit')   return openPanelEdit(row);
        if (colKey === 'btn_row_delete') return handleDeletePanel(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return openPanelEdit(row);
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */

    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleSearchList — 대시보드 전체 로드(+패널 수 집계) 후 검색어/사용여부 필터 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { siteId: cfSiteId.value };
        if (searchParam.useYn) params.useYn = searchParam.useYn;
        const res = await boApiSvc.cmDashboard.getList(params, '대시보드기준관리', '조회');
        let list = res.data?.data || [];
        if (searchParam.searchValue) {
          const kw = searchParam.searchValue.toLowerCase();
          list = list.filter(d => (d.dashboardNm || '').toLowerCase().includes(kw)
            || (d.uiCompNm || '').toLowerCase().includes(kw));
        }
        dashboards.splice(0, dashboards.length, ...list);
        /* 패널 수 집계 */
        const ires = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '대시보드기준관리', '패널수조회');
        const items = ires.data?.data || [];
        Object.keys(panelCnt).forEach(k => delete panelCnt[k]);
        items.forEach(i => { panelCnt[i.dashboardId] = (panelCnt[i.dashboardId] || 0) + 1; });
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchPanels — 선택 대시보드의 패널 목록 조회 */
    const handleSearchPanels = async () => {
      if (!baseDetail.selectedId) { panels.splice(0, panels.length); return; }
      uiState.panelLoading = true;
      try {
        const res = await boApiSvc.cmDashboard.getItemList(
          { siteId: cfSiteId.value, dashboardId: baseDetail.selectedId }, '대시보드기준관리', '패널조회');
        const list = (res.data?.data || []).filter(i => i.dashboardId === baseDetail.selectedId);
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        panels.splice(0, panels.length, ...list);
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '패널 조회 오류', 'error', 0);
      } finally {
        uiState.panelLoading = false;
      }
    };

    const openDashNew = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = true;
      Object.assign(baseForm, _initBaseForm());
      panels.splice(0, panels.length);
      panelDetail.show = false;
    };

    const openDashEdit = (row) => {
      baseDetail.selectedId = row.dashboardId;
      baseDetail.isNew = false;
      Object.assign(baseForm, {
        dashboardId: row.dashboardId, dashboardNm: row.dashboardNm, uiCompNm: row.uiCompNm,
        layoutCols: row.layoutCols || 4, sortOrd: row.sortOrd || 10, useYn: row.useYn || 'Y',
        ownerUserId: row.ownerUserId || '', remark: row.remark || '',
      });
      panelDetail.show = false;
      panelDetail.selectedId = null;
      handleSearchPanels();
    };

    const resetDashDetail = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = false;
      Object.assign(baseForm, _initBaseForm());
      panels.splice(0, panels.length);
      panelDetail.show = false;
    };

    /* handleSaveDash — 대시보드 저장 (신규/수정) */
    const handleSaveDash = async () => {
      Object.keys(baseErrors).forEach(k => delete baseErrors[k]);
      if (!baseForm.dashboardNm) { baseErrors.dashboardNm = '대시보드명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!baseForm.uiCompNm)    { baseErrors.uiCompNm = 'UI컴포넌트명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!(await showConfirm('저장', '대시보드를 저장하시겠습니까?'))) return;
      try {
        const body = {
          siteId: cfSiteId.value, dashboardNm: baseForm.dashboardNm, uiCompNm: baseForm.uiCompNm,
          layoutCols: Number(baseForm.layoutCols) || 4, sortOrd: Number(baseForm.sortOrd) || 10,
          useYn: baseForm.useYn, ownerUserId: baseForm.ownerUserId || '', remark: baseForm.remark,
        };
        if (baseDetail.isNew) {
          const res = await boApiSvc.cmDashboard.create(body, '대시보드기준관리', '등록');
          const created = res.data?.data || {};
          baseDetail.selectedId = created.dashboardId || null;
          baseDetail.isNew = false;
          baseForm.dashboardId = created.dashboardId || null;
        } else {
          await boApiSvc.cmDashboard.update(baseForm.dashboardId, body, '대시보드기준관리', '수정');
        }
        showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    /* handleDeleteDash — 대시보드 삭제 */
    const handleDeleteDash = async (row) => {
      const cnt = panelCnt[row.dashboardId] || 0;
      const msg = cnt > 0
        ? `[${row.dashboardNm}] 대시보드에 패널 ${cnt}개가 있습니다. 대시보드만 삭제됩니다. 삭제하시겠습니까?`
        : `[${row.dashboardNm}] 대시보드를 삭제하시겠습니까?`;
      if (!(await showConfirm('삭제', msg))) return;
      try {
        await boApiSvc.cmDashboard.remove(row.dashboardId, '대시보드기준관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === row.dashboardId) resetDashDetail();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    const openPanelNew = () => {
      if (!baseDetail.selectedId) return showToast('대시보드를 먼저 선택하세요.', 'error');
      panelDetail.selectedId = null;
      panelDetail.isNew = true;
      panelDetail.show = true;
      const maxOrd = panels.reduce((m, p) => Math.max(m, p.sortOrd || 0), 0);
      Object.assign(panelForm, _initPanelForm(), { sortOrd: maxOrd + 10 });
    };

    const openPanelEdit = (row) => {
      panelDetail.selectedId = row.dashboardItemId;
      panelDetail.isNew = false;
      panelDetail.show = true;
      Object.assign(panelForm, {
        dashboardItemId: row.dashboardItemId, itemKey: row.itemKey, itemNm: row.itemNm,
        chartType: row.chartType || 'bar', sortOrd: row.sortOrd || 10,
        panelWidth: row.panelWidth || 1, panelHeight: row.panelHeight || 1,
        realtimeYn: row.realtimeYn || 'N', useYn: row.useYn || 'Y',
        seriesJson: row.seriesJson || '', optionJson: row.optionJson || '',
      });
    };

    /* handleSavePanel — 패널 저장 (itemSave base, rowStatus I/U) */
    const handleSavePanel = async () => {
      Object.keys(panelErrors).forEach(k => delete panelErrors[k]);
      if (!panelForm.itemKey) { panelErrors.itemKey = '패널 키를 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!panelForm.itemNm)  { panelErrors.itemNm = '패널명을 입력하세요.'; return showToast('입력 내용을 확인해주세요.', 'error'); }
      if (!(await showConfirm('저장', '패널을 저장하시겠습니까?'))) return;
      try {
        const body = {
          dashboardItemId: panelDetail.isNew ? null : panelForm.dashboardItemId,
          rowStatus: panelDetail.isNew ? 'I' : 'U',
          siteId: cfSiteId.value, dashboardId: baseDetail.selectedId,
          itemKey: panelForm.itemKey, itemNm: panelForm.itemNm, chartType: panelForm.chartType,
          sortOrd: Number(panelForm.sortOrd) || 10,
          panelWidth: Number(panelForm.panelWidth) || 1, panelHeight: Number(panelForm.panelHeight) || 1,
          realtimeYn: panelForm.realtimeYn, useYn: panelForm.useYn,
          seriesJson: panelForm.seriesJson || null, optionJson: panelForm.optionJson || null,
        };
        await boApiSvc.cmDashboard.itemSave('base', body, '대시보드기준관리', '패널저장');
        showToast('저장되었습니다.', 'success');
        panelDetail.show = false;
        await handleSearchPanels();
        await handleSearchList(); /* 패널 수 갱신 */
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 오류', 'error', 0);
      }
    };

    /* handleDeletePanel — 패널 삭제 (itemSave base, rowStatus D) */
    const handleDeletePanel = async (row) => {
      if (!(await showConfirm('삭제', `[${row.itemNm}] 패널을 삭제하시겠습니까?`))) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: row.dashboardItemId, rowStatus: 'D' }, '대시보드기준관리', '패널삭제');
        showToast('삭제되었습니다.', 'success');
        if (panelDetail.selectedId === row.dashboardItemId) panelDetail.show = false;
        await handleSearchPanels();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    /* 공개여부 라벨 (사용자대시보드 화면과 동일 규약, 레거시 코드 호환) */
    const SHARE_SCOPE_LABELS = {
      PUBLIC: '🌐 전체공개', PRIVATE: '🔒 비공개',
      ALL: '🌐 전체공개', DEPT: '🔒 비공개', USER: '🔒 비공개', ME: '🔒 비공개',
    };

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '대시보드명', type: 'text', placeholder: '대시보드명/컴포넌트명 검색' },
      { key: 'useYn', label: '사용여부', type: 'select', nullLabel: '사용여부 전체',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
    ];

    columns.dashboards = [
      { key: 'dashboardNm', label: '대시보드명', link: true,
        fmt: (v, row) => (fnIsMyDash(row) ? '👤 ' : '') + (v || ''),
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.dashboardId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'uiCompNm',  label: 'UI컴포넌트', style: 'width:200px;', cellStyle: 'font-family:monospace;font-size:11px;' },
      { key: '_type',     label: '유형', style: 'width:90px;',
        badge: (row) => fnIsMyDash(row) ? 'badge-purple' : 'badge-blue',
        fmt: (v, row) => fnIsMyDash(row) ? '개인화' : '공용' },
      { key: 'shareScopeCd', label: '공개여부', style: 'width:100px;',
        fmt: (v, row) => fnIsMyDash(row) ? (SHARE_SCOPE_LABELS[v || 'PRIVATE'] || v || '-') : '-' },
      { key: '_panelCnt', label: '패널수', style: 'width:70px;', align: 'right',
        fmt: (v, row) => (panelCnt[row.dashboardId] || 0) + '개' },
      { key: 'layoutCols', label: '열수', style: 'width:60px;', align: 'center', fmt: (v) => (v || 4) + '열' },
      { key: 'sortOrd',   label: '정렬', style: 'width:60px;', align: 'center' },
      { key: 'useYn',     label: '사용', style: 'width:70px;',
        badge: (row) => row.useYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '사용' : '미사용' },
    ];

    columns.panels = [
      { key: 'itemKey',   label: '패널키', style: 'width:110px;', cellStyle: 'font-family:monospace;font-size:11px;', link: true },
      { key: 'itemNm',    label: '패널명',
        cellInnerStyle: (v, row) => panelDetail.selectedId === row.dashboardItemId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'chartType', label: '차트유형', style: 'width:110px;',
        fmt: (v) => util.chartTypeIcon(v) + ' ' + util.chartTypeLabel(v) },
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

    columns.baseForm = [
      { key: 'dashboardNm', label: '대시보드명', type: 'text', required: true, colSpan: 2 },
      { key: 'uiCompNm', label: 'UI컴포넌트명', type: 'text', required: true, mono: true,
        placeholder: 'DashboardBoEc01 · MY:userId(개인화)' },
      { key: 'layoutCols', label: '레이아웃 열수', type: 'select',
        options: () => [2, 3, 4, 5, 6].map(n => ({ value: n, label: n + '열' })) },
      { key: 'sortOrd', label: '정렬순서', type: 'number' },
      { key: 'useYn', label: '사용여부', type: 'select',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
      { key: 'ownerUserId', label: '소유자ID (개인화)', type: 'text', mono: true,
        placeholder: '비우면 공용 · 지정 시 본인만 수정/삭제 가능', colSpan: 2 },
      { key: 'remark', label: '비고', type: 'textarea', colSpan: 3 },
    ];

    columns.panelForm = [
      { key: 'itemKey', label: '패널 키', type: 'text', required: true, mono: true, placeholder: 'COMP0101' },
      { key: 'itemNm', label: '패널명', type: 'text', required: true, colSpan: 2 },
      { key: 'chartType', label: '차트유형', type: 'select',
        options: () => util.CHART_TYPES.map(c => ({ value: c.value, label: c.icon + ' ' + c.label })) },
      { key: 'panelWidth', label: '패널 폭(열 span)', type: 'select',
        options: () => [1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: n })) },
      { key: 'panelHeight', label: '패널 높이(행 span)', type: 'select',
        options: () => [1, 2, 3].map(n => ({ value: n, label: n })) },
      { key: 'sortOrd', label: '정렬순서', type: 'number' },
      { key: 'realtimeYn', label: '실시간 여부', type: 'select',
        options: () => [{ value: 'N', label: '일반' }, { value: 'Y', label: '실시간' }] },
      { key: 'useYn', label: '사용여부', type: 'select',
        options: () => [{ value: 'Y', label: '사용' }, { value: 'N', label: '미사용' }] },
      { key: 'seriesJson', label: '시리즈 설정 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '[{"name":"매출","color":"#6366f1","type":"bar"}]' },
      { key: 'optionJson', label: 'ECharts 옵션 오버라이드 JSON', type: 'textarea', colSpan: 3, mono: true,
        placeholder: '{"legend":{"show":false}}' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, panels, panelCnt, uiState, codes, searchParam,
      baseDetail, baseForm, baseErrors, panelDetail, panelForm, panelErrors,
      columns, fnIsMyDash,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="대시보드 기준관리"
  desc-summary="대시보드 정의와 패널(위젯) 기준정보를 관리합니다. 배치·크기 조정은 대시보드 배치설정 화면을 이용하세요.">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 대시보드 목록 =============================================== -->
  <bo-container title="대시보드 목록" :count-text="'총 ' + dashboards.length + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('dashboards-add')">+ 신규</button>
    </template>
    <bo-grid bare :columns="columns.dashboards" :rows="dashboards" row-key="dashboardId"
      :selected-key="baseDetail.selectedId"
      :row-class="row => baseDetail.selectedId === row.dashboardId ? 'active' : ''"
      empty-text="대시보드가 없습니다."
      grid-id="dashboards-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
  </bo-container>
  <!-- ===== ■. 대시보드 상세 폼 (항상 표시 — 미선택 시 안내) ================= -->
  <bo-container :title="baseDetail.isNew ? '대시보드 신규 등록' : '대시보드 상세'"
    :count-text="baseDetail.selectedId ? '#' + baseDetail.selectedId : ''">
    <template #toolbar-actions>
      <button v-if="baseDetail.selectedId" class="btn btn_preview"
        @click="handleBtnAction('dashboards-layout')">🧩 배치설정 열기</button>
    </template>
    <div v-if="baseDetail.selectedId || baseDetail.isNew" style="padding:12px;">
      <bo-form-area :columns="columns.baseForm" :form="baseForm" :errors="baseErrors"
        :cols="3" :show-actions="false" />
      <div class="form-actions">
        <button class="btn btn_save" @click="handleBtnAction('baseForm-save')">저장</button>
        <button class="btn btn_close" @click="handleBtnAction('baseForm-close')">닫기</button>
      </div>
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">목록에서 대시보드를 선택하거나 [+ 신규]를 클릭하세요.</div>
  </bo-container>
  <!-- ===== ■. 패널 목록 + 패널 폼 (대시보드 선택 시) ======================= -->
  <bo-container title="패널(위젯) 목록"
    :count-text="baseDetail.selectedId ? '총 ' + panels.length + '개' : ''">
    <template #toolbar-actions>
      <button v-if="baseDetail.selectedId" class="btn btn_new" @click="handleBtnAction('panels-add')">+ 패널 추가</button>
    </template>
    <template v-if="baseDetail.selectedId">
      <bo-grid bare :columns="columns.panels" :rows="panels" row-key="dashboardItemId"
        :selected-key="panelDetail.selectedId"
        :row-class="row => panelDetail.selectedId === row.dashboardItemId ? 'active' : ''"
        empty-text="패널이 없습니다. [+ 패널 추가]로 등록하세요."
        grid-id="panels-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
        <template #row-actions="{ row, gridId }">
          <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
            <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
          </div>
        </template>
      </bo-grid>
      <div v-if="panelDetail.show" style="padding:12px;border-top:1px solid #eee;">
        <div class="list-title" style="margin-bottom:10px;">
          {{ panelDetail.isNew ? '패널 신규 등록' : '패널 상세 / 수정' }}
          <span v-if="!panelDetail.isNew" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">#{{ panelForm.dashboardItemId }}</span>
        </div>
        <bo-form-area :columns="columns.panelForm" :form="panelForm" :errors="panelErrors"
          :cols="3" :show-actions="false" />
        <div class="form-actions">
          <button class="btn btn_save" @click="handleBtnAction('panelForm-save')">저장</button>
          <button class="btn btn_close" @click="handleBtnAction('panelForm-close')">닫기</button>
        </div>
      </div>
    </template>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">대시보드를 선택하면 패널 목록이 표시됩니다.</div>
  </bo-container>
</bo-page>
`,
};

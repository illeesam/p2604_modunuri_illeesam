/* ShopJoy Admin - 대시보드 관리
 * cm_dashboard(대시보드 정의) CRUD — 이름·UI컴포넌트·열수·소유자 등.
 * 목록(전체 로드) + 인라인 상세폼. 항목수는 참고 표시만 한다.
 *
 * 항목 등록·수정은 '대시보드 항목관리'(CmDashboardItemMng),
 * 배치·크기 조정은 '대시보드 항목배치'(CmDashboardLayoutMng) 로 분리돼 있다.
 * 의존: CmDashboardWidgetUtil.js (ESM import, 2026-08-29 전환 — 예전엔 window.cmDashWidgetUtil 전역이었음)
 */
import CmDashboardWidgetUtil from './CmDashboardWidgetUtil.js';

export default {
  name: 'cm-dashboard-cmDashboardMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const util = CmDashboardWidgetUtil;

    const dashboards = reactive([]);   /* cm_dashboard 전체 (사이트 기준) */
    const panelCnt   = reactive({});   /* dashboardId → 항목 수 */
    const uiState = reactive({ loading: false });
    const codes = reactive({});

    const searchParam = reactive({ searchValue: '', useYn: '' });

    /* baseDetail — 대시보드 인라인 상세 폼 상태 */
    const baseDetail = reactive({ selectedId: null, isNew: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => baseDetail.dtlMode === 'view');
    const _initBaseForm = () => ({
      dashboardId: null, dashboardNm: '', uiCompNm: '', layoutCols: 4, sortOrd: 10, useYn: 'Y', ownerUserId: '', remark: '',
    });
    const baseForm = reactive(_initBaseForm());
    const baseErrors = reactive({});


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
      if (cmd === 'baseForm-edit')     return switchToEdit();
      if (cmd === 'baseForm-cancel')   return handleCancelEdit();
      if (cmd === 'dashboards-layout') { return props.navigate('cmDashboardLayoutMng', { dtlId: baseDetail.selectedId }); }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'dashboards-cellClick') {
        if (colKey === 'btn_row_edit')   return openDashEdit(row);
        if (colKey === 'btn_row_delete') return handleDeleteDash(row);
        if ((e.col ? e.col.link : false) || colKey === '__no__') return loadView(row);
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드) #################################### */


    /* initPage — 화면 로드 시퀀스. 마운트 시 실행한다. */
    const initPage = async () => {
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      handleSearchList();
    };
    onMounted(initPage);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러) #################################### */

    /* handleSearchList — 대시보드 전체 로드(+항목 수 집계) 후 검색어/사용여부 필터 */
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
        /* 항목 수 집계 */
        const ires = await boApiSvc.cmDashboard.getItemList({ siteId: cfSiteId.value }, '대시보드기준관리', '항목수조회');
        const items = ires.data?.data || [];
        Object.keys(panelCnt).forEach(k => delete panelCnt[k]);
        items.forEach(i => { panelCnt[i.dashboardId] = (panelCnt[i.dashboardId] || 0) + 1; });
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '조회 오류'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };


    const openDashNew = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = true;
      baseDetail.dtlMode = 'edit';
      Object.assign(baseForm, _initBaseForm());
    };

    /* _loadDetailForm — 대시보드 인라인 상세 폼에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (row, mode) => {
      baseDetail.selectedId = row.dashboardId;
      baseDetail.isNew = false;
      baseDetail.dtlMode = mode;
      Object.assign(baseForm, {
        dashboardId: row.dashboardId, dashboardNm: row.dashboardNm, uiCompNm: row.uiCompNm,
        layoutCols: row.layoutCols || 4, sortOrd: row.sortOrd || 10, useYn: row.useYn || 'Y',
        ownerUserId: row.ownerUserId || '', remark: row.remark || '',
      });
    };

    /* loadView — 보기모드로 대시보드 인라인 상세 폼 열기 (행 클릭) */
    const loadView = (row) => _loadDetailForm(row, 'view');

    /* openDashEdit — 수정모드로 대시보드 인라인 상세 폼 열기 ([수정] 버튼) */
    const openDashEdit = (row) => _loadDetailForm(row, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 하단 [수정] 버튼) */
    const switchToEdit = () => { baseDetail.dtlMode = 'edit'; };

    const resetDashDetail = () => {
      baseDetail.selectedId = null;
      baseDetail.isNew = false;
      baseDetail.dtlMode = 'view';
      Object.assign(baseForm, _initBaseForm());
    };

    /* handleCancelEdit — 수정 취소: 신규 등록 중이면 패널 닫기, 기존 대시보드 수정 중이면 원본 재적재 후 보기모드 복귀 */
    const handleCancelEdit = () => {
      if (baseDetail.isNew) { return resetDashDetail(); }
      const row = dashboards.find(d => d.dashboardId === baseDetail.selectedId);
      return row ? loadView(row) : resetDashDetail();
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
        baseDetail.dtlMode = 'view';
        showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '저장 오류'), 'error', 0);
      }
    };

    /* handleDeleteDash — 대시보드 삭제 */
    const handleDeleteDash = async (row) => {
      const cnt = panelCnt[row.dashboardId] || 0;
      const msg = cnt > 0
        ? `[${row.dashboardNm}] 대시보드에 항목 ${cnt}개가 있습니다. 대시보드만 삭제됩니다. 삭제하시겠습니까?`
        : `[${row.dashboardNm}] 대시보드를 삭제하시겠습니까?`;
      if (!(await showConfirm('삭제', msg))) return;
      try {
        await boApiSvc.cmDashboard.remove(row.dashboardId, '대시보드기준관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === row.dashboardId) resetDashDetail();
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '삭제 오류'), 'error', 0);
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
      { key: '_panelCnt', label: '항목수', style: 'width:70px;', align: 'right',
        fmt: (v, row) => (panelCnt[row.dashboardId] || 0) + '개' },
      { key: 'layoutCols', label: '열수', style: 'width:60px;', align: 'center', fmt: (v) => (v || 4) + '열' },
      { key: 'sortOrd',   label: '정렬', style: 'width:60px;', align: 'center' },
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


    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, panelCnt, uiState, codes, searchParam,
      baseDetail, baseForm, baseErrors, cfDtlMode,
      columns, fnIsMyDash,
      handleBtnAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="대시보드 관리" :share-query="searchParam"
  desc-summary="대시보드 정의(이름·UI컴포넌트·열수 등)를 관리합니다. 항목 등록은 대시보드 항목관리, 배치·크기는 대시보드 항목배치 화면을 이용하세요.">
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
      grid-id="dashboards-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions
            table-max-height="540px">
      <template #row-actions="{ row, gridId }">
        <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
        </div>
      </template>
    </bo-grid>
  </bo-container>
  <!-- ===== ■. 대시보드 상세 폼 (항상 표시 — 미선택 시 안내) ================= -->
  <bo-container :title="baseDetail.isNew ? '대시보드 신규' : (cfDtlMode ? '대시보드 상세' : '대시보드 수정')"
    :title-id="baseDetail.selectedId ? baseDetail.selectedId : ''">
    <template #toolbar-actions>
      <button v-if="baseDetail.selectedId" class="btn btn_preview"
        @click="handleBtnAction('dashboards-layout')">🧩 항목배치 열기</button>
    </template>
    <div v-if="baseDetail.selectedId || baseDetail.isNew" style="padding:12px;">
      <bo-form-area :columns="columns.baseForm" :form="baseForm" :errors="baseErrors"
        :cols="3" :show-actions="false" :readonly="cfDtlMode" plain-readonly />
      <bo-form-actions :readonly="cfDtlMode" :show-delete="false" :edit-click="() => handleBtnAction('baseForm-edit')"
 :save-click="() => handleBtnAction('baseForm-save')"
 :cancel-click="() => handleBtnAction('baseForm-cancel')"
 :close-click="() => handleBtnAction('baseForm-close')" />
    </div>
    <div v-else style="padding:32px;text-align:center;color:#aaa;">목록에서 대시보드를 선택하거나 [+ 신규]를 클릭하세요.</div>
  </bo-container>
</bo-page>
`,
};

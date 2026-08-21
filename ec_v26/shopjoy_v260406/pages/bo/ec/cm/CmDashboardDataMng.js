/* ShopJoy Admin - 대시보드 데이타관리 (3레벨)
 *
 *  좌: 대시보드 목록(선택) / 우: 선택 대시보드의 위젯항목목록(1레벨=차트만, 펼치기 없음).
 *  아래: 기준조건(사이트·기간 필수/상품·업체 선택) + 차트별 시리즈(행)×항목(열) 값 입력 그리드.
 *
 *  1레벨 차트명   cm_dashboard_item (key_level=1)  → 그리드 1개 + 위젯항목목록의 행 1개
 *  2레벨 시리즈명 cm_dashboard_item (key_level=2)  → 그리드의 "행 제목"
 *  3레벨 항목명   cm_dashboard_item (key_level=3)  → 그리드의 "열 제목"
 *
 *  사람이 직접 입력하는 화면이며, [시뮬레이션]은 값만 자동으로 채워준다(저장은 별도).
 *  구조(시리즈·항목)는 '대시보드 항목관리' 에서 정의한 "행" 에서 온다.
 *  값은 (정의행 + data_opts) 좌표 하나에 하나씩 저장된다.
 */
window.CmDashboardDataMng = {
  name: 'CmDashboardDataMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;

    const MAX_COLS = 9;   /* 백엔드 col1~col9 와 맞춘다 (CmDashboardDataGridService.MAX_COLS) */

    const dashboards  = reactive([]);   /* 대시보드 선택 목록 (좌측) */
    const dashItems   = reactive([]);   /* 선택 대시보드의 위젯항목(1레벨=차트) 목록 (우측) */
    const dashItemCnt = reactive({});   /* dashboardId → 위젯항목 수 (좌측 목록 표시용) */
    const charts      = reactive([]);   /* 조회 결과 — 차트별 그리드 [{itemNm, colNms[], rows[]}] */
    const siteOptions = reactive([]);   /* 사이트 select */
    const vendors     = reactive([]);   /* 판매업체 select */
    const uiState = reactive({ loading: false, itemLoading: false, saving: false, searched: false, selectedItemIds: [] });
    const codes = reactive({});

    /* 기준조건 — 사이트/기간은 필수, 상품·업체는 선택. 대시보드는 좌측 목록 클릭으로 고른다 */
    const _today = coUtil.cofToYmd(new Date());
    const searchParam = reactive({
      dashboardId: '',
      siteId: '',
      periodTypeCd: 'D',        /* D:일자 / M:월 */
      ymd: _today,              /* type=date */
      ym: String(_today).slice(0, 7),  /* type=month (YYYY-MM) */
      prodId: '',
      prodNm: '',               /* 표시용 (API 전송 X) */
      vendorId: '',
    });
    const searchParamInit = { ...searchParam };

    const modals = reactive({ isProdPick: false });

    /* fnIsMyDash — 개인화 대시보드 여부(좌측 목록 아이콘용) */
    const fnIsMyDash = (row) => !!row.ownerUserId || (row.uiCompNm || '').indexOf('MY:') === 0;

    /* 위젯항목목록 체크박스 — 기본 전체선택. 지금은 선택 상태만 두고(향후 "선택 시뮬레이션" 등에
       재사용할 자리), 목록이 새로 불려올 때마다 전부 다시 선택한다. */
    const isDashItemChecked = (id) => uiState.selectedItemIds.includes(id);
    const cfAllDashItemsChecked = computed(() =>
      dashItems.length > 0 && uiState.selectedItemIds.length === dashItems.length);
    const onToggleDashItemCheck = (id) => {
      const idx = uiState.selectedItemIds.indexOf(id);
      if (idx >= 0) uiState.selectedItemIds.splice(idx, 1);
      else uiState.selectedItemIds.push(id);
    };
    const onToggleDashItemCheckAll = () => {
      uiState.selectedItemIds = cfAllDashItemsChecked.value ? [] : dashItems.map(i => i.dashboardItemId);
    };

    /* cfCurDash — 좌측에서 선택된 대시보드 행 */
    const cfCurDash = computed(() => dashboards.find(d => d.dashboardId === searchParam.dashboardId) || null);

    /* cfPeriodKey — 서버 전송용 기간 키. D=YYYYMMDD / M=YYYYMM00 (월도 8자리로 맞춰 정렬 유지) */
    const cfPeriodKey = computed(() => searchParam.periodTypeCd === 'M'
      ? String(searchParam.ym || '').replace('-', '') + '00'
      : String(searchParam.ymd || '').replace(/-/g, ''));

    /* cfHasData — 조회 결과에 편집 가능한 차트가 있는지 */
    const cfHasData = computed(() => charts.length > 0);

    /* cfVisibleCharts — 위젯항목목록에서 체크된 항목만 "대시보드 위젯데이타" 에 표시한다 */
    const cfVisibleCharts = computed(() =>
      charts.filter(c => uiState.selectedItemIds.includes(c.dashboardItemId)));

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')     return handleSearchList();
      if (cmd === 'searchParam-reset')    return handleReset();
      if (cmd === 'searchParam-simulateAll') return handleSimulateAll();
      if (cmd === 'searchParam-save')     return handleSave();
      if (cmd === 'prodModal-open')       { modals.isProdPick = true; return; }
      if (cmd === 'searchParam-prodClear') { searchParam.prodId = ''; searchParam.prodNm = ''; return; }
      if (cmd === 'goItemMng')            return props.navigate('cmDashboardItemMng');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleGridCellAction — 좌측 대시보드 목록 클릭 라우팅.
       우측 위젯항목목록은 선택(체크박스)만 있고 행별 동작은 없다 —
       [시뮬레이션]은 아래 "항목 데이터" 각 차트 카드의 제목 우측 버튼으로 옮겨졌다. */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'dashboards-cellClick') {
        if ((e.col ? e.col.link : false) || colKey === '__no__') return selectDash(row);
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* fnCallbackModal — 모달 통합 dispatch */
    const fnCallbackModal = (popCmd, param, result) => {
      if (popCmd === 'cmPopup-prod-pick') {
        if (result == null) { modals.isProdPick = false; return; }
        searchParam.prodId = result.selId || '';
        searchParam.prodNm = result.selName || '';
        modals.isProdPick = false;
        return;
      }
      console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
    };

    /* ##### [03] API 호출 ########################################################## */

    /* fnValidCond — 필수 기준조건 검증. 통과하면 서버 전송 파라미터를 만들어 돌려준다 */
    const fnValidCond = () => {
      if (!searchParam.dashboardId) { showToast('좌측에서 대시보드를 선택해주세요.', 'error'); return null; }
      if (!searchParam.siteId)      { showToast('사이트는 필수 조건입니다.', 'error'); return null; }
      if (!cfPeriodKey.value || cfPeriodKey.value.length !== 8) {
        showToast(searchParam.periodTypeCd === 'M' ? '월은 필수 조건입니다.' : '일자는 필수 조건입니다.', 'error');
        return null;
      }
      return {
        dashboardId:  searchParam.dashboardId,
        siteId:       searchParam.siteId,
        yyyymmdd:     cfPeriodKey.value,
        periodTypeCd: searchParam.periodTypeCd,
        ...coUtil.cofOmitEmpty({ prodId: searchParam.prodId, vendorId: searchParam.vendorId }),
      };
    };

    /* fnNormalizeChart — colNms/vals 를 항상 MAX_COLS 길이로 맞춘다
       (길이가 들쭉날쭉하면 v-model 바인딩이 빈 칸에서 끊긴다). 벌크 적용·단일 적용 공용 */
    const fnNormalizeChart = (c) => {
      const norm = (arr) => Array.from({ length: MAX_COLS }, (_, i) => (arr && arr[i] != null ? arr[i] : ''));
      return { ...c, colNms: norm(c.colNms), rows: (c.rows || []).map(r => ({ ...r, vals: norm(r.vals) })) };
    };

    /* fnApplyCharts — 서버 응답(전체 차트) 을 화면 상태로 통째 교체 */
    const fnApplyCharts = (list) => {
      charts.splice(0, charts.length, ...(list || []).map(fnNormalizeChart));
    };

    /* handleSearchList — 조회 (좌측에서 대시보드를 고르면 기본조건으로 자동 호출된다) */
    const handleSearchList = async () => {
      const params = fnValidCond();
      if (!params) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getDataGrid(params, '대시보드데이타관리', '조회');
        fnApplyCharts(res.data?.data?.charts);
        uiState.searched = true;
        if (!charts.length) showToast('선택한 대시보드에 차트 항목이 없습니다.', 'error');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleReset — 검색조건 초기화 + 결과 비우기 (대시보드 선택은 유지) */
    const handleReset = () => {
      Object.assign(searchParam, searchParamInit, { dashboardId: searchParam.dashboardId });
      charts.splice(0, charts.length);
      uiState.searched = false;
    };

    /* handleSimulateAll — 대시보드의 모든 차트 값을 자동 채우기(우측 목록 [전체시뮬레이션]) */
    const handleSimulateAll = async () => {
      const params = fnValidCond();
      if (!params) return;
      const ok = await showConfirm('전체 시뮬레이션', '이 대시보드의 모든 항목 값을 자동 생성한 값으로 채웁니다.\n화면의 기존 입력값은 덮어써집니다. 진행하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '전체시뮬레이션');
        fnApplyCharts(res.data?.data?.charts);
        uiState.searched = true;
        showToast('전체 항목 값을 자동 생성했습니다. 확인 후 [저장]을 눌러주세요.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSimulateOne — 차트 카드 제목 우측 [시뮬레이션]. 서버는 대시보드 전체를 계산해 주므로
       그중 이 차트(row) 하나만 골라 화면 상태에 반영한다 — 다른 차트의 미저장 입력은 건드리지 않는다. */
    const handleSimulateOne = async (row) => {
      const params = fnValidCond();
      if (!params) return;
      const ok = await showConfirm('시뮬레이션', '[' + row.itemNm + '] 값을 자동 생성한 값으로 채웁니다.\n진행하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '시뮬레이션');
        const list = res.data?.data?.charts || [];
        const found = list.find(c => c.dashboardItemId === row.dashboardItemId || c.itemKey === row.itemKey);
        if (!found) { showToast('해당 항목의 그리드를 찾을 수 없습니다.', 'error'); return; }
        const applied = fnNormalizeChart(found);
        const idx = charts.findIndex(c => c.dashboardItemId === applied.dashboardItemId);
        if (idx >= 0) charts.splice(idx, 1, applied); else charts.push(applied);
        uiState.searched = true;
        showToast('[' + row.itemNm + '] 값을 자동 생성했습니다. 확인 후 [저장]을 눌러주세요.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSaveOrient — 차트 카드의 시리즈표시방법(행/열)만 저장. 부분 필드만 보내면 서버가
       (VoUtil.voCopyExclude) 그 필드만 갱신한다 — 다른 정의(이름·유형 등)는 안 건드린다.
       방향이 바뀌면 그리드의 행/열 구성 자체가 달라지므로, 저장 후 전체를 다시 조회한다
       (다른 카드의 미저장 입력값은 사라질 수 있어 미리 안내한다). */
    const handleSaveOrient = async (chart) => {
      const ok = await showConfirm('시리즈표시방법 저장',
        '[' + chart.itemNm + '] 의 시리즈표시방법을 저장합니다.\n방향이 바뀌면 화면을 다시 조회하며, 다른 항목의 저장하지 않은 입력값은 사라집니다.\n진행하시겠습니까?');
      if (!ok) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: chart.dashboardItemId, seriesOrientCd: chart.seriesOrientCd },
          '대시보드데이타관리', '시리즈표시방법저장');
        showToast('시리즈표시방법을 저장했습니다.', 'success');
        await handleSearchDashItems();
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleSave — 그리드 전체 저장 (차트 × 시리즈 조합마다 1행 upsert) */
    const handleSave = async () => {
      const params = fnValidCond();
      if (!params) return;
      if (!charts.length) { showToast('저장할 데이터가 없습니다. 먼저 조회해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '입력한 데이터를 저장하시겠습니까?');
      if (!ok) return;
      uiState.saving = true;
      try {
        const body = charts.map(c => ({
          dashboardItemId: c.dashboardItemId,
          colNms: c.colNms,
          /* dashboardItemId=시리즈 정의행, cellItemIds=셀별 항목 정의행.
             값이 어느 정의행에 붙는지는 서버가 이 두 가지로 판단한다 (2026-08-21 행 기반) */
          rows: (c.rows || []).map(r => ({
            dashboardItemId: r.dashboardItemId,
            cellItemIds: r.cellItemIds,
            vals: r.vals,
          })),
        }));
        const res = await boApiSvc.cmDashboard.saveDataGrid(body, params, '대시보드데이타관리', '저장');
        showToast(res.data?.message || '저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.saving = false;
      }
    };

    /* fnLoadCodes — 이 화면이 쓰는 코드그룹만 지연 로딩 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['USE_YN'], { compNm: 'CmDashboardDataMng' });
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    /* fnLoadRefs — 좌측 대시보드 목록 + 사이트 / 판매업체 select 소스 */
    const fnLoadRefs = async () => {
      try {
        const opts = await window.boUtil.bofLoadSiteOptions();
        siteOptions.splice(0, siteOptions.length, ...opts);
        /* 기본 사이트: 공통필터의 현재 사이트 → 없으면 첫 번째 */
        searchParam.siteId = window.boCommonFilter?.siteId || (opts[0] ? opts[0].value : '');
        searchParamInit.siteId = searchParam.siteId;
      } catch (err) { console.error('[catch-info]', err); }

      try {
        const res = await boApiSvc.cmDashboard.getList({ useYn: 'Y' }, '대시보드데이타관리', '대시보드목록');
        const list = res.data?.data || [];
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        dashboards.splice(0, dashboards.length, ...list);
        await fnLoadItemCounts();
      } catch (err) { console.error('[catch-info]', err); }

      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 500 }, '대시보드데이타관리', '업체목록');
        vendors.splice(0, vendors.length, ...(res.data?.data?.pageList || []));
      } catch (err) { console.error('[catch-info]', err); }
    };

    /* fnLoadItemCounts — 대시보드별 위젯항목(1레벨) 수 (좌측 목록 표시용) */
    const fnLoadItemCounts = async () => {
      try {
        const res = await boApiSvc.cmDashboard.getItemList({ siteId: searchParam.siteId }, '대시보드데이타관리', '위젯항목수조회');
        const cnt = {};
        (res.data?.data || []).forEach(i => { cnt[i.dashboardId] = (cnt[i.dashboardId] || 0) + 1; });
        Object.keys(dashItemCnt).forEach(k => delete dashItemCnt[k]);
        Object.assign(dashItemCnt, cnt);
      } catch (e) { console.warn('[위젯항목 수 조회 오류]', e); }
    };

    /* handleSearchDashItems — 선택 대시보드의 위젯항목(1레벨=차트) 목록 조회.
       목록에는 1레벨 행만 보이지만(2·3레벨 구조 편집은 '대시보드 항목관리' 화면 몫), 시리즈개수·
       데이타열개수 표시를 위해 keyLevel=0(전체 레벨)으로 한 번에 받아 부모기준으로 세어둔다. */
    const handleSearchDashItems = async () => {
      if (!searchParam.dashboardId) { dashItems.splice(0, dashItems.length); return; }
      uiState.itemLoading = true;
      try {
        const res = await boApiSvc.cmDashboard.getItemList(
          { siteId: searchParam.siteId, dashboardId: searchParam.dashboardId, keyLevel: 0 },
          '대시보드데이타관리', '위젯항목조회');
        const all = (res.data?.data || []).filter(i => i.dashboardId === searchParam.dashboardId);

        /* 부모ID → 자식 목록. 시리즈개수=차트의 2레벨 자식 수 / 데이타열개수=그 중 첫 시리즈의 3레벨 자식 수
           (시리즈끼리는 항목 1벌을 공유하므로 첫 시리즈 것이 곧 열 개수 — 데이터관리 그리드와 동일 규칙) */
        const byParent = {};
        all.forEach(i => { if (i.parentDashboardItemId) (byParent[i.parentDashboardItemId] = byParent[i.parentDashboardItemId] || []).push(i); });

        const list = all.filter(i => i.keyLevel === 1);
        list.forEach(chart => {
          const sers = byParent[chart.dashboardItemId] || [];
          chart._seriesCnt = sers.length;
          chart._colCnt = sers.length ? (byParent[sers[0].dashboardItemId] || []).length : 0;
        });
        list.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
        dashItems.splice(0, dashItems.length, ...list);
        uiState.selectedItemIds = list.map(i => i.dashboardItemId);   /* 기본값: 전체선택 */
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '위젯항목 조회 오류', 'error', 0);
      } finally {
        uiState.itemLoading = false;
      }
    };

    /* selectDash — 좌측 대시보드 선택 → 위젯항목목록 갱신 + 기본조건으로 값 그리드도 바로 조회 */
    const selectDash = (row) => {
      searchParam.dashboardId = row.dashboardId;
      charts.splice(0, charts.length);
      uiState.searched = false;
      handleSearchDashItems();
      handleSearchList();   /* 사이트·기간 기본값이 이미 채워져 있어 바로 조회된다 */
    };

    /* initPage — 화면 로드 시퀀스. 코드·기준조건 소스를 받은 뒤 좌측 선택을 기다린다 */
    const initPage = async () => {
      await fnLoadCodes();
      await fnLoadRefs();
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 렌더) ######################################## */

    /* fnColCount — 이 차트에서 실제로 쓰는 열(3레벨) 수. 마지막 입력열 +1 을 항상 열어둔다
       (열을 추가하려고 별도 버튼을 누르지 않아도 되게) */
    const fnColCount = (chart) => {
      let last = -1;
      chart.colNms.forEach((nm, i) => { if (nm != null && String(nm).trim() !== '') last = i; });
      return Math.min(last + 2, MAX_COLS);
    };

    /* fnColCountRaw — colNms 중 실제 값이 있는 순수 개수(여백 +1 없음). 전치(transpose) 계산용 */
    const fnColCountRaw = (chart) => {
      let last = -1;
      chart.colNms.forEach((nm, i) => { if (nm != null && String(nm).trim() !== '') last = i; });
      return last + 1;
    };

    /* fnAxisBg — 시리즈 라벨과 항목 라벨의 배경을 서로 다르게(방향이 바뀌어도 축 종류로 고정) —
       ROW 든 COL 이든 "시리즈"가 놓인 자리는 항상 같은 색, "항목"이 놓인 자리는 항상 다른 색.
       (어두운 계열은 가독성이 나빠 되돌림 — 둘 다 밝은 파스텔로만 구분한다)
       side: 'row'=행 라벨 칸, 'col'=열 헤더 칸 */
    const AXIS_BG = { series: '#fff7ed', item: '#eaf2ff' };   /* series = [시뮬레이션] 버튼과 같은 계열 */
    const fnAxisBg = (chart, side) => {
      const rowIsSeries = chart.seriesOrientCd !== 'COL';
      const isSeries = side === 'row' ? rowIsSeries : !rowIsSeries;
      return isSeries ? AXIS_BG.series : AXIS_BG.item;
    };

    /* fnAxisCodeColor — 라벨 아래 작은 코드(monospace) 글자색. 둘 다 밝은 배경이라 통일된 회색 */
    const fnAxisCodeColor = () => '#94a3b8';

    /* onOrientChange — 시리즈표시방법을 바꾸면 즉시 그리드를 뒤집어 미리 보여준다.
       leaf 좌표(cellItemIds)는 그대로 옮겨 담을 뿐이라 저장 전에도 정확히 미리보기된다 —
       실제 저장(item_key당 값)은 방향과 무관하게 항상 leaf 단위라 여기서 셀 값이 깨질 일은 없다.
       [저장]을 눌러야 이 방향이 차트 정의(cm_dashboard_item)에 영구 반영된다. */
    const onOrientChange = (chart, newOrient) => {
      if (newOrient === chart.seriesOrientCd) return;
      const colCount = fnColCountRaw(chart);
      const norm = (arr) => Array.from({ length: MAX_COLS }, (_, i) => (arr[i] != null ? arr[i] : ''));
      const newColNms = norm(chart.rows.map(r => r.seriesNm || ''));
      const newColCds = norm(chart.rows.map(r => r.seriesCd || ''));
      const newRows = [];
      for (let j = 0; j < colCount; j++) {
        newRows.push({
          seriesNm: chart.colNms[j] || '',
          seriesCd: chart.colCds ? (chart.colCds[j] || '') : '',
          cellItemIds: chart.rows.map(r => r.cellItemIds[j]),
          vals: chart.rows.map(r => r.vals[j]),
        });
      }
      chart.colNms = newColNms;
      chart.colCds = newColCds;
      chart.rows = newRows;
      chart.seriesOrientCd = newOrient;
    };

    /* fnRowSum — 시리즈(행) 합계(천단위 콤마) — 입력 검증용 참고값.
       템플릿에서 coUtil 을 직접 부르지 않도록 포맷까지 여기서 끝낸다 */
    const fnRowSum = (chart, row) => {
      let sum = 0;
      for (let i = 0; i < fnColCount(chart); i++) {
        const v = Number(row.vals[i]);
        if (!Number.isNaN(v)) sum += v;
      }
      return coUtil.cofFmt(sum);
    };

    /* fnVendorNm — 선택된 판매업체명 (안내 문구용) */
    const fnVendorNm = () => {
      if (!searchParam.vendorId) return '전체';
      const v = vendors.find(x => x.vendorId === searchParam.vendorId);
      return v ? v.vendorNm : searchParam.vendorId;
    };

    /* fnPeriodLabel — 화면 안내용 기간 표기 */
    const fnPeriodLabel = () => searchParam.periodTypeCd === 'M'
      ? (searchParam.ym || '-') + ' (월)'
      : (searchParam.ymd || '-') + ' (일자)';

    const columns = {};

    /* 좌측 — 대시보드 목록. 선택용이라 .bo-2col 의 좁은 폭에 들어가는 만큼만 둔다 */
    columns.dashboards = [
      { key: 'dashboardNm', label: '대시보드명', link: true,
        fmt: (v, row) => (fnIsMyDash(row) ? '👤 ' : '') + (v || '') + (row.useYn === 'N' ? ' (미사용)' : ''),
        cellInnerStyle: (v, row) => searchParam.dashboardId === row.dashboardId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: '_itemCnt', label: '위젯항목', style: 'width:64px;', align: 'center',
        fmt: (v, row) => (dashItemCnt[row.dashboardId] || 0) + '개' },
    ];

    /* 우측 — 대시보드 위젯항목목록. 1레벨(차트)만 — 2·3레벨은 '대시보드 항목관리' 에서 편집한다 */
    columns.dashItems = [
      { key: '_lvl', label: '레벨', style: 'width:56px;', align: 'center',
        badge: () => 'badge-red', fmt: () => '● 차트' },
      { key: 'itemNm', label: '항목명 (차트)' },
      { key: '_seriesCnt', label: '시리즈개수', style: 'width:84px;', align: 'center', fmt: (v, row) => (row._seriesCnt || 0) + '개' },
      { key: 'seriesOrientCd', label: '시리즈표시방법', style: 'width:96px;', align: 'center',
        badge: (row) => row.seriesOrientCd === 'COL' ? 'badge-purple' : 'badge-blue',
        fmt: (v) => v === 'COL' ? '열 (항목=행)' : '행 (시리즈=행)' },
      { key: '_colCnt', label: '데이타열개수', style: 'width:90px;', align: 'center', fmt: (v, row) => (row._colCnt || 0) + '개' },
      { key: 'keyNm', label: '코드', style: 'width:110px;', cellStyle: 'font-family:monospace;font-size:11px;color:#2563eb;' },
      { key: 'itemKey', label: '고유 item_key', style: 'width:150px;', cellStyle: 'font-family:monospace;font-size:11px;color:#64748b;' },
    ];

    /* 기준조건 — 사이트·기간구분·기간은 필수, 상품·업체는 선택 (대시보드는 좌측 목록에서 고른다) */
    columns.baseSearch = [
      { key: 'siteId', label: '사이트', type: 'select', required: true,
        options: () => siteOptions, nullLabel: '사이트 선택' },
      { key: 'periodTypeCd', label: '기간구분', type: 'select',
        options: () => [{ value: 'D', label: '일자' }, { value: 'M', label: '월' }] },
      { key: 'ymd', label: '일자', type: 'date',
        visible: (form) => form.periodTypeCd !== 'M' },
      { key: 'ym', label: '월', type: 'slot', name: 'ym',
        visible: (form) => form.periodTypeCd === 'M' },
      { key: 'prodId', label: '상품', type: 'pick',
        display: (p) => p.prodNm, placeholder: '상품 선택(선택)', width: '150px',
        openLabel: '선택', onOpen: () => handleBtnAction('prodModal-open'),
        onClear: () => handleBtnAction('searchParam-prodClear') },
      { key: 'vendorId', label: '판매업체', type: 'select',
        options: () => vendors.map(v => ({ value: v.vendorId, label: v.vendorNm })),
        nullLabel: '업체 전체(선택)' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, dashItems, dashItemCnt, charts, siteOptions, vendors, uiState, codes,
      searchParam, modals, columns, MAX_COLS, cfCurDash,
      cfPeriodKey, cfHasData, cfVisibleCharts,
      isDashItemChecked, cfAllDashItemsChecked, onToggleDashItemCheck, onToggleDashItemCheckAll,
      fnColCount, fnRowSum, fnPeriodLabel, fnVendorNm, onOrientChange, fnAxisBg, fnAxisCodeColor,
      handleBtnAction, handleGridCellAction, handleSimulateOne, handleSaveOrient, fnCallbackModal,
    };
  },
  template: /* html */ `
<bo-page title="대시보드 데이타관리"
  desc-summary="좌측 대시보드를 선택하면 우측에 위젯항목목록이 표시됩니다. 체크한 항목만 아래 대시보드 위젯데이타에 나타나며, 시리즈(행) × 항목(열) 매트릭스에 값을 직접 입력합니다. 사이트·기간은 필수, 상품·판매업체는 선택 조건입니다.">

  <div class="bo-2col">
    <!-- ===== ■. 대시보드 목록 (선택) ======================================= -->
    <bo-container title="대시보드 목록" :count-text="'총 ' + dashboards.length + '건'">
      <bo-grid bare narrow :columns="columns.dashboards" :rows="dashboards" row-key="dashboardId"
        :loading="uiState.loading" :selected-key="searchParam.dashboardId"
        :row-class="row => searchParam.dashboardId === row.dashboardId ? 'active' : ''"
        empty-text="대시보드가 없습니다."
        grid-id="dashboards-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    </bo-container>

    <!-- ===== ■. 대시보드 위젯항목목록 (1레벨=차트만, 펼치기 없음) =============== -->
    <bo-container title="대시보드 위젯항목목록"
      :count-text="searchParam.dashboardId ? '총 ' + dashItems.length + '개' : ''">
      <template #toolbar-actions>
        <button class="btn btn_search" :disabled="!searchParam.dashboardId || uiState.loading"
          @click="handleBtnAction('searchParam-simulateAll')">🎲 전체시뮬레이션</button>
      </template>
      <div style="padding:8px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #f0f0f0;">
        <template v-if="searchParam.dashboardId">
          <b>{{ cfCurDash ? cfCurDash.dashboardNm : '' }}</b>
          <span style="color:#aaa;font-family:monospace;font-size:11px;margin-left:6px;">{{ cfCurDash ? cfCurDash.uiCompNm : '' }}</span>
        </template>
        <span v-else style="color:#aaa;">좌측에서 대시보드를 선택하세요.</span>
      </div>
      <bo-grid bare selectable :columns="columns.dashItems" :rows="dashItems" row-key="dashboardItemId"
        :loading="uiState.itemLoading"
        :is-checked="isDashItemChecked" :all-checked="cfAllDashItemsChecked"
        @toggle-check="onToggleDashItemCheck" @toggle-check-all="onToggleDashItemCheckAll"
        :empty-text="searchParam.dashboardId ? '위젯항목이 없습니다.' : '좌측에서 대시보드를 선택하면 위젯항목목록이 표시됩니다.'" />
    </bo-container>
  </div>

  <!-- ===== ■. 기준조건 ==================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #ym>
        <input type="month" class="form-control" v-model="searchParam.ym" style="width:140px;" />
      </template>
    </bo-search-area>
  </bo-container>

  <!-- ===== ■. 차트별 데이터 그리드 (위젯항목목록에서 체크한 차트만 표시) ======= -->
  <bo-container title="대시보드 위젯데이타"
    :count-text="cfHasData ? ('체크 ' + cfVisibleCharts.length + ' / 전체 ' + charts.length + '개') : ''">
    <template #toolbar-actions>
      <button class="btn btn_save" :disabled="!cfHasData || uiState.saving"
        @click="handleBtnAction('searchParam-save')">저장</button>
    </template>

    <div style="padding:8px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #f0f0f0;">
      <template v-if="uiState.searched">
        기준: <b>{{ fnPeriodLabel() }}</b>
        <span style="color:#aaa;margin-left:8px;">
          상품 {{ searchParam.prodNm || '전체' }} · 업체 {{ fnVendorNm() }}
        </span>
      </template>
      <span v-else style="color:#aaa;">기준조건을 선택하고 [조회]를 눌러주세요. (사이트 · 일자/월 필수)</span>
    </div>

    <!-- 차트마다 그리드 1개: 행=시리즈(2레벨) / 열=항목명(3레벨). 위젯항목목록에서 체크한 것만 -->
    <div v-if="cfVisibleCharts.length" style="padding:12px;display:flex;flex-direction:column;gap:16px;">
      <div v-for="chart in cfVisibleCharts" :key="chart.dashboardItemId"
        style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;font-size:12.5px;color:#1f4a73;white-space:nowrap;">
            {{ chart.itemNm }}
            <span style="font-family:monospace;font-size:11px;color:#94a3b8;font-weight:400;">{{ chart.itemKey }}</span>
          </span>
          <!-- 시뮬레이션부터 우측 정렬 -->
          <span style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            <button class="btn btn-sm" :disabled="chart.autoCollectYn === 'Y' || uiState.loading"
              :title="chart.autoCollectYn === 'Y' ? '자동수집 항목은 시뮬레이션할 수 없습니다.' : ''"
              style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-weight:700;"
              @click="handleSimulateOne(chart)">🎲 시뮬레이션</button>
            <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;">
              시리즈표시방법
              <select class="form-control" :value="chart.seriesOrientCd"
                @change="onOrientChange(chart, $event.target.value)"
                style="width:auto;padding:2px 6px;font-size:11px;min-height:24px;">
                <option value="ROW">행 (시리즈=행 · 항목=열)</option>
                <option value="COL">열 (항목=행 · 시리즈=열)</option>
              </select>
              <button class="btn btn-sm btn_save" @click="handleSaveOrient(chart)">저장</button>
            </span>
            <span v-if="chart.autoCollectYn === 'Y'" class="badge badge-green"
              title="배치가 실 데이터를 집계해 채운다 — 이 화면에서 수정 불가">🤖 자동수집</span>
            <span class="badge badge-blue">{{ chart.chartTypeCd || '-' }}</span>
          </span>
        </div>
        <div style="overflow-x:auto;">
          <table class="bo-table bo-table-narrow">
            <thead>
              <tr>
                <!-- 축 라벨 헤더 — 데이터열 헤더와 배경을 구분(회색) -->
                <th style="width:140px;background:#eef1f5;color:#475569;">
                  {{ chart.seriesOrientCd === 'COL' ? '항목 \\\\ 시리즈' : '시리즈 \\\\ 항목' }}</th>
                <th v-for="i in fnColCount(chart)" :key="i" :style="'min-width:96px;background:' + fnAxisBg(chart, 'col') + ';'">
                  <!-- 항목관리에 3레벨 정의(cols_json)가 있으면 그것이 기준 — 여기서 고치지 않는다 -->
                  <template v-if="chart.colsFixed">
                    {{ chart.colNms[i-1] }}
                    <span :style="'font-family:monospace;font-size:10px;font-weight:400;color:' + fnAxisCodeColor(chart, 'col') + ';'">
                      {{ chart.colCds ? chart.colCds[i-1] : '' }}</span>
                  </template>
                  <input v-else type="text" class="form-control" v-model="chart.colNms[i-1]"
                    :placeholder="'항목' + i" style="text-align:center;font-weight:700;" />
                </th>
                <th style="width:80px;background:#eef1f5;color:#475569;">합계</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in chart.rows" :key="ri">
                <!-- 축 라벨(시리즈/항목) 배경 — 시리즈·항목·데이터열이 서로 다른 색으로 구분 -->
                <td :style="'font-weight:600;background:' + fnAxisBg(chart, 'row') + ';'">
                  {{ row.seriesNm || '(단일)' }}
                  <span v-if="row.seriesCd" :style="'font-family:monospace;font-size:10px;font-weight:400;color:' + fnAxisCodeColor(chart, 'row') + ';'">
                    {{ row.seriesCd }}</span>
                </td>
                <td v-for="i in fnColCount(chart)" :key="i" style="background:#fff;">
                  <input type="number" class="form-control" v-model="row.vals[i-1]"
                    :disabled="chart.editableYn === 'N'"
                    style="text-align:right;padding:4px 6px;font-size:12px;min-height:26px;" />
                </td>
                <td style="text-align:right;font-weight:700;color:#475569;background:#f8fafc;">
                  {{ fnRowSum(chart, row) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      <template v-if="uiState.searched && cfHasData">
        위젯항목목록에서 표시할 항목을 체크해주세요.
      </template>
      <template v-else-if="uiState.searched">
        선택한 대시보드에 차트 항목이 없습니다.
        <button class="btn btn-sm" @click="handleBtnAction('goItemMng')" style="margin-left:8px;">항목관리로 이동</button>
      </template>
      <template v-else>좌측에서 대시보드를 선택하면 값 입력 그리드가 표시됩니다.</template>
    </div>
  </bo-container>

  <!-- ===== ■. 상품 선택 팝업 (공통팝업 prod) ================================= -->
  <bo-cm-popup-modal v-if="modals.isProdPick"
    popup-cmd="cmPopup-prod-pick" popup-code="prod" clearable
    :on-callback="fnCallbackModal" @close="modals.isProdPick = false" />
</bo-page>
`,
};

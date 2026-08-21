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
    const uiState = reactive({ loading: false, itemLoading: false, saving: false, selectedItemIds: [] });
    const codes = reactive({});

    /* 사이트/대시보드는 화면 전체 공통조건. 기간·상품·업체는 차트(위젯)마다 cm_dashboard_item.
       input_opts 가 달라(예: 일별 vs 월별, 상품/업체 축 필요 여부) 그룹별로 따로 받는다(아래 groupParams) */
    const _today = coUtil.cofToYmd(new Date());
    const searchParam = reactive({ dashboardId: '', siteId: '' });

    /* DEFAULT_INPUT_OPTS — cm_dashboard_item.input_opts 미지정 시 백엔드 기본값과 동일 */
    const DEFAULT_INPUT_OPTS = 'period_type_cd:M,site_id,yyyymmdd';

    /* fnParseInputOpts — "period_type_cd:M,site_id,yyyymmdd,prod_id" 같은 문자열을 화면이
       쓰기 좋은 형태로 해석. 어떤 조회조건 입력칸을 보여줄지 이 결과로 가른다 */
    const fnParseInputOpts = (str) => {
      const dims = { periodTypeCd: 'M', hasProdId: false, hasVendorId: false };
      String(str || DEFAULT_INPUT_OPTS).split(',').map(s => s.trim()).filter(Boolean).forEach(tok => {
        const [k, v] = tok.split(':').map(s => (s || '').trim());
        if (k === 'period_type_cd') dims.periodTypeCd = v === 'D' ? 'D' : 'M';
        else if (k === 'prod_id')   dims.hasProdId = true;
        else if (k === 'vendor_id') dims.hasVendorId = true;
      });
      return dims;
    };

    /* groupParams/groupState — input_opts 원문(key) 별 조회조건·진행상태. 그룹이 처음
       나타날 때(fnEnsureGroup) input_opts 가 정한 기본 기간구분으로 채운다 */
    const groupParams = reactive({});
    const groupState  = reactive({});
    const fnEnsureGroup = (key, dims) => {
      if (!groupParams[key]) {
        groupParams[key] = {
          periodTypeCd: dims.periodTypeCd,
          ymd: _today, ym: String(_today).slice(0, 7),
          prodId: '', prodNm: '', vendorId: '',
        };
      }
      if (!groupState[key]) groupState[key] = { searched: false, loading: false, saving: false };
    };
    /* fnEnsureGroupsFor — 위젯항목목록(dashItems) 이 새로 들어올 때마다 그 안에 있는 모든
       input_opts 그룹의 기본값을 한 번에 채워둔다(cfGroups computed 는 순수 파생만 하도록) */
    const fnEnsureGroupsFor = (items) => {
      items.forEach(i => {
        const key = i.inputOpts || DEFAULT_INPUT_OPTS;
        fnEnsureGroup(key, fnParseInputOpts(key));
      });
    };
    /* fnGroupPeriodKey — 그룹의 서버 전송용 기간 키. D=YYYYMMDD / M=YYYYMM00 */
    const fnGroupPeriodKey = (key) => {
      const gp = groupParams[key];
      if (!gp) return '';
      return gp.periodTypeCd === 'M'
        ? String(gp.ym || '').replace('-', '') + '00'
        : String(gp.ymd || '').replace(/-/g, '');
    };

    const modals = reactive({ isProdPick: false, prodPickGroupKey: null });

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

    /* cfHasData — 조회 결과에 편집 가능한 차트가 있는지 */
    const cfHasData = computed(() => charts.length > 0);

    /* cfVisibleCharts — 위젯항목목록에서 체크된 항목만 "대시보드 위젯데이타" 에 표시한다 */
    const cfVisibleCharts = computed(() =>
      charts.filter(c => uiState.selectedItemIds.includes(c.dashboardItemId)));

    /* cfGroups — 체크된 위젯을 input_opts 별로 묶는다. dashItems 기준이라 조회 전에도
       그룹·조회조건 UI 는 바로 뜨고, 이미 조회된 값(charts[])이 있으면 그걸 함께 실어준다
       (input_opts 가 제각각이라 기간·상품·업체 조건을 그룹마다 따로 받아야 하기 때문 — 2026-08-21).
       순수 파생만 한다(부수효과 없음) — groupParams/groupState 기본값은 handleSearchDashItems()
       가 위젯항목목록을 받아온 직후(fnEnsureGroupsFor)에 미리 채워둔다. */
    const cfGroups = computed(() => {
      const map = {};
      dashItems.forEach(i => {
        if (!uiState.selectedItemIds.includes(i.dashboardItemId)) return;
        const key = i.inputOpts || DEFAULT_INPUT_OPTS;
        if (!map[key]) map[key] = { key, dims: fnParseInputOpts(key), charts: [] };
        const loaded = charts.find(c => c.dashboardItemId === i.dashboardItemId);
        map[key].charts.push(loaded || { dashboardItemId: i.dashboardItemId, itemNm: i.itemNm, itemKey: i.itemKey, _notLoaded: true });
      });
      return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
    });

    /* cfAnyGroupLoading/Saving — 그룹 중 하나라도 진행 중이면 상단 전체버튼들을 잠근다 */
    const cfAnyGroupLoading = computed(() => Object.values(groupState).some(s => s.loading));
    const cfAnyGroupSaving  = computed(() => Object.values(groupState).some(s => s.saving));

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'group-search')         return handleSearchGroup(param);
      if (cmd === 'group-save')           return handleSaveGroup(param);
      if (cmd === 'group-simulateAll')    return handleSimulateGroup(param);
      if (cmd === 'groups-searchAll')     return handleSearchAllGroups();
      if (cmd === 'groups-simulateAll')   return handleSimulateAllGroups();
      if (cmd === 'groups-saveAll')       return handleSaveAllGroups();
      if (cmd === 'groups-reset')         return handleReset();
      if (cmd === 'prodModal-open')       { modals.prodPickGroupKey = param; modals.isProdPick = true; return; }
      if (cmd === 'group-prodClear')      { const gp = groupParams[param]; if (gp) { gp.prodId = ''; gp.prodNm = ''; } return; }
      if (cmd === 'siteChange')           return handleSiteChange();
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
        const gp = groupParams[modals.prodPickGroupKey];
        if (result == null || !gp) { modals.isProdPick = false; modals.prodPickGroupKey = null; return; }
        gp.prodId = result.selId || '';
        gp.prodNm = result.selName || '';
        modals.isProdPick = false;
        modals.prodPickGroupKey = null;
        return;
      }
      console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
    };

    /* ##### [03] API 호출 (그룹별 — input_opts 가 같은 차트끼리 조회조건을 공유) ########## */

    /* fnGroupCond — 그룹(key) 의 조회조건 검증. 통과하면 서버 전송 파라미터를 만들어 돌려준다 */
    const fnGroupCond = (key) => {
      if (!searchParam.dashboardId) { showToast('좌측에서 대시보드를 선택해주세요.', 'error'); return null; }
      if (!searchParam.siteId)      { showToast('사이트는 필수 조건입니다.', 'error'); return null; }
      const gp = groupParams[key];
      const periodKey = fnGroupPeriodKey(key);
      if (!gp || !periodKey || periodKey.length !== 8) {
        showToast(gp && gp.periodTypeCd === 'D' ? '일자는 필수 조건입니다.' : '월은 필수 조건입니다.', 'error');
        return null;
      }
      return {
        dashboardId:  searchParam.dashboardId,
        siteId:       searchParam.siteId,
        yyyymmdd:     periodKey,
        periodTypeCd: gp.periodTypeCd,
        ...coUtil.cofOmitEmpty({ prodId: gp.prodId, vendorId: gp.vendorId }),
      };
    };

    /* fnNormalizeChart — colNms/vals 를 항상 MAX_COLS 길이로 맞춘다
       (길이가 들쭉날쭉하면 v-model 바인딩이 빈 칸에서 끊긴다). 벌크 적용·단일 적용 공용 */
    const fnNormalizeChart = (c) => {
      const norm = (arr) => Array.from({ length: MAX_COLS }, (_, i) => (arr && arr[i] != null ? arr[i] : ''));
      return { ...c, colNms: norm(c.colNms), rows: (c.rows || []).map(r => ({ ...r, vals: norm(r.vals) })) };
    };

    /* fnMergeCharts — 서버 응답 중 이 그룹(input_opts=key) 소속 차트만 골라 charts[] 에 반영.
       다른 그룹은 각자 자기 조건으로 이미 조회해 둔 값이니 건드리지 않는다 */
    const fnMergeCharts = (key, list) => {
      (list || [])
        .filter(c => (c.inputOpts || DEFAULT_INPUT_OPTS) === key)
        .map(fnNormalizeChart)
        .forEach(applied => {
          const idx = charts.findIndex(c => c.dashboardItemId === applied.dashboardItemId);
          if (idx >= 0) charts.splice(idx, 1, applied); else charts.push(applied);
        });
    };

    /* handleSearchGroup — 그룹 하나 조회 (그룹 미니바 [조회]) */
    const handleSearchGroup = async (key) => {
      const params = fnGroupCond(key);
      if (!params) return;
      groupState[key].loading = true;
      try {
        const res = await boApiSvc.cmDashboard.getDataGrid(params, '대시보드데이타관리', '조회');
        fnMergeCharts(key, res.data?.data?.charts);
        groupState[key].searched = true;
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        groupState[key].loading = false;
      }
    };

    /* handleSearchAllGroups — 모든 그룹을 각자 조건으로 순회 조회 (대시보드 선택 시 자동 호출) */
    const handleSearchAllGroups = async () => {
      for (const g of cfGroups.value) await handleSearchGroup(g.key);
    };

    /* handleReset — 모든 그룹의 조회조건 초기화 + 결과 비우기 (대시보드 선택은 유지) */
    const handleReset = () => {
      Object.keys(groupParams).forEach(k => delete groupParams[k]);
      Object.keys(groupState).forEach(k => delete groupState[k]);
      charts.splice(0, charts.length);
      fnEnsureGroupsFor(dashItems);   /* 템플릿이 바로 참조하므로 초기화 직후 다시 채워둔다 */
    };

    /* handleSimulateGroup — 그룹 하나 전체 자동 채우기 (그룹 미니바 [그룹 시뮬레이션]) */
    const handleSimulateGroup = async (key) => {
      const params = fnGroupCond(key);
      if (!params) return;
      const ok = await showConfirm('그룹 시뮬레이션', '이 조건의 위젯 값을 자동 생성한 값으로 채웁니다.\n화면의 기존 입력값은 덮어써집니다. 진행하시겠습니까?');
      if (!ok) return;
      groupState[key].loading = true;
      try {
        const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '그룹시뮬레이션');
        fnMergeCharts(key, res.data?.data?.charts);
        groupState[key].searched = true;
        showToast('값을 자동 생성했습니다. 확인 후 [저장]을 눌러주세요.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        groupState[key].loading = false;
      }
    };

    /* handleSimulateAllGroups — 체크된 모든 위젯을 그룹별 조건으로 순회 자동채움 (위젯항목목록 [전체시뮬레이션]) */
    const handleSimulateAllGroups = async () => {
      if (!cfGroups.value.length) { showToast('체크된 위젯이 없습니다.', 'error'); return; }
      const ok = await showConfirm('전체 시뮬레이션', '체크된 모든 위젯 값을 그룹별 조건으로 자동 생성합니다.\n화면의 기존 입력값은 덮어써집니다. 진행하시겠습니까?');
      if (!ok) return;
      for (const g of cfGroups.value) {
        const params = fnGroupCond(g.key);
        if (!params) continue;
        groupState[g.key].loading = true;
        try {
          const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '전체시뮬레이션');
          fnMergeCharts(g.key, res.data?.data?.charts);
          groupState[g.key].searched = true;
        } catch (err) {
          showToast((err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.') + ' (' + g.key + ')', 'error', 0);
        } finally {
          groupState[g.key].loading = false;
        }
      }
      showToast('전체 항목 값을 자동 생성했습니다. 확인 후 그룹별 [저장]을 눌러주세요.', 'success');
    };

    /* handleSimulateOne — 차트 카드 제목 우측 [시뮬레이션]. row.inputOpts 로 소속 그룹의
       조회조건을 써서 서버가 계산해 준 값 중 이 차트(row) 하나만 골라 반영한다 —
       다른 차트의 미저장 입력은 건드리지 않는다. */
    const handleSimulateOne = async (row) => {
      const key = row.inputOpts || DEFAULT_INPUT_OPTS;
      const params = fnGroupCond(key);
      if (!params) return;
      const ok = await showConfirm('시뮬레이션', '[' + row.itemNm + '] 값을 자동 생성한 값으로 채웁니다.\n진행하시겠습니까?');
      if (!ok) return;
      groupState[key].loading = true;
      try {
        const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '시뮬레이션');
        const list = res.data?.data?.charts || [];
        const found = list.find(c => c.dashboardItemId === row.dashboardItemId || c.itemKey === row.itemKey);
        if (!found) { showToast('해당 항목의 그리드를 찾을 수 없습니다.', 'error'); return; }
        const applied = fnNormalizeChart(found);
        const idx = charts.findIndex(c => c.dashboardItemId === applied.dashboardItemId);
        if (idx >= 0) charts.splice(idx, 1, applied); else charts.push(applied);
        groupState[key].searched = true;
        showToast('[' + row.itemNm + '] 값을 자동 생성했습니다. 확인 후 [저장]을 눌러주세요.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        groupState[key].loading = false;
      }
    };

    /* handleSaveOrient — 차트 카드의 시리즈표시방법(행/열)만 저장. 부분 필드만 보내면 서버가
       (updateSelective) 그 필드만 갱신한다 — 다른 정의(이름·유형 등)는 안 건드린다.
       방향이 바뀌면 그리드의 행/열 구성 자체가 달라지므로, 저장 후 이 차트가 속한 그룹만
       다시 조회한다(다른 그룹의 미저장 입력값은 그대로 유지된다). */
    const handleSaveOrient = async (chart) => {
      const ok = await showConfirm('시리즈표시방법 저장',
        '[' + chart.itemNm + '] 의 시리즈표시방법을 저장합니다.\n방향이 바뀌면 화면을 다시 조회하며, 이 항목이 속한 그룹의 저장하지 않은 입력값은 사라집니다.\n진행하시겠습니까?');
      if (!ok) return;
      try {
        await boApiSvc.cmDashboard.itemSave('base',
          { dashboardItemId: chart.dashboardItemId, seriesOrientCd: chart.seriesOrientCd },
          '대시보드데이타관리', '시리즈표시방법저장');
        showToast('시리즈표시방법을 저장했습니다.', 'success');
        await handleSearchDashItems();
        await handleSearchGroup(chart.inputOpts || DEFAULT_INPUT_OPTS);
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleSaveGroup — 그룹 하나 저장 (차트 × 시리즈 조합마다 1행 upsert, 그 그룹의 조건으로) */
    const handleSaveGroup = async (key) => {
      const params = fnGroupCond(key);
      if (!params) return;
      const group = cfGroups.value.find(g => g.key === key);
      const loaded = group ? group.charts.filter(c => !c._notLoaded) : [];
      if (!loaded.length) { showToast('저장할 데이터가 없습니다. 먼저 조회해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '입력한 데이터를 저장하시겠습니까?');
      if (!ok) return;
      groupState[key].saving = true;
      try {
        const body = loaded.map(c => ({
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
        await handleSearchGroup(key);
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        groupState[key].saving = false;
      }
    };

    /* handleSaveAllGroups — 모든 그룹을 각자 조건으로 순회 저장 (상단 [전체 저장]) */
    const handleSaveAllGroups = async () => {
      const targets = cfGroups.value.filter(g => g.charts.some(c => !c._notLoaded));
      if (!targets.length) { showToast('저장할 데이터가 없습니다. 먼저 조회해주세요.', 'error'); return; }
      const ok = await showConfirm('전체 저장', '체크된 모든 위젯의 입력값을 그룹별 조건으로 저장하시겠습니까?');
      if (!ok) return;
      for (const g of targets) {
        const params = fnGroupCond(g.key);
        if (!params) continue;
        const loaded = g.charts.filter(c => !c._notLoaded);
        if (!loaded.length) continue;
        groupState[g.key].saving = true;
        try {
          const body = loaded.map(c => ({
            dashboardItemId: c.dashboardItemId,
            colNms: c.colNms,
            rows: (c.rows || []).map(r => ({ dashboardItemId: r.dashboardItemId, cellItemIds: r.cellItemIds, vals: r.vals })),
          }));
          await boApiSvc.cmDashboard.saveDataGrid(body, params, '대시보드데이타관리', '전체저장');
          await handleSearchGroup(g.key);
        } catch (err) {
          showToast((err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.') + ' (' + g.key + ')', 'error', 0);
        } finally {
          groupState[g.key].saving = false;
        }
      }
      showToast('전체 저장을 완료했습니다.', 'success');
    };

    /* handleSiteChange — 사이트 변경 시 위젯항목 수·목록만 새로 받는다(그룹별 값은 각자 [조회]로) */
    const handleSiteChange = () => {
      fnLoadItemCounts();
      if (searchParam.dashboardId) handleSearchDashItems();
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
        fnEnsureGroupsFor(list);   /* input_opts 그룹별 조회조건 기본값 미리 채우기 */
        uiState.selectedItemIds = list.map(i => i.dashboardItemId);   /* 기본값: 전체선택 */
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '위젯항목 조회 오류', 'error', 0);
      } finally {
        uiState.itemLoading = false;
      }
    };

    /* selectDash — 좌측 대시보드 선택 → 위젯항목목록 갱신 → 그룹이 정해지면 그룹별 기본조건으로
       값 그리드도 바로 순회 조회한다(위젯항목목록이 있어야 input_opts 별 그룹을 알 수 있어 순서대로 await) */
    const selectDash = async (row) => {
      searchParam.dashboardId = row.dashboardId;
      charts.splice(0, charts.length);
      await handleSearchDashItems();
      await handleSearchAllGroups();
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

    /* fnGroupVendorNm — 그룹(key)에서 선택된 판매업체명 (안내 문구용) */
    const fnGroupVendorNm = (key) => {
      const gp = groupParams[key];
      if (!gp || !gp.vendorId) return '전체';
      const v = vendors.find(x => x.vendorId === gp.vendorId);
      return v ? v.vendorNm : gp.vendorId;
    };

    /* fnGroupPeriodLabel — 그룹(key) 안내용 기간 표기 */
    const fnGroupPeriodLabel = (key) => {
      const gp = groupParams[key];
      if (!gp) return '-';
      return gp.periodTypeCd === 'M' ? (gp.ym || '-') + ' (월)' : (gp.ymd || '-') + ' (일자)';
    };

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
      { key: 'inputOpts', label: '조회조건(input_opts)', style: 'width:170px;',
        cellStyle: 'font-family:monospace;font-size:10.5px;color:#94a3b8;',
        fmt: (v) => v || DEFAULT_INPUT_OPTS },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      dashboards, dashItems, dashItemCnt, charts, siteOptions, vendors, uiState, codes,
      searchParam, groupParams, groupState, modals, columns, MAX_COLS, cfCurDash,
      cfHasData, cfVisibleCharts, cfGroups, cfAnyGroupLoading, cfAnyGroupSaving,
      isDashItemChecked, cfAllDashItemsChecked, onToggleDashItemCheck, onToggleDashItemCheckAll,
      fnColCount, fnRowSum, fnGroupPeriodLabel, fnGroupVendorNm, onOrientChange, fnAxisBg, fnAxisCodeColor,
      handleBtnAction, handleGridCellAction, handleSimulateOne, handleSaveOrient, fnCallbackModal,
    };
  },
  template: /* html */ `
<bo-page title="대시보드 데이타관리"
  desc-summary="좌측 대시보드를 선택하면 우측에 위젯항목목록이 표시됩니다. 체크한 항목만 아래 대시보드 위젯데이타에 input_opts(조회조건 구성) 별로 묶여 나타나며, 그룹마다 기간·상품·업체 조건을 따로 조회·저장합니다. 시리즈(행) × 항목(열) 매트릭스에 값을 직접 입력합니다.">

  <div class="bo-2col">
    <!-- ===== ■. 대시보드 목록 (선택) ======================================= -->
    <bo-container title="대시보드 목록" :count-text="'총 ' + dashboards.length + '건'">
      <bo-grid bare narrow :columns="columns.dashboards" :rows="dashboards" row-key="dashboardId"
        :loading="uiState.itemLoading" :selected-key="searchParam.dashboardId"
        :row-class="row => searchParam.dashboardId === row.dashboardId ? 'active' : ''"
        empty-text="대시보드가 없습니다."
        grid-id="dashboards-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    </bo-container>

    <!-- ===== ■. 대시보드 위젯항목목록 (1레벨=차트만, 펼치기 없음) =============== -->
    <bo-container title="대시보드 위젯항목목록"
      :count-text="searchParam.dashboardId ? '총 ' + dashItems.length + '개' : ''">
      <template #toolbar-actions>
        <button class="btn btn_search" :disabled="!searchParam.dashboardId || cfAnyGroupLoading"
          @click="handleBtnAction('groups-simulateAll')">🎲 전체시뮬레이션</button>
      </template>
      <div style="padding:8px 12px;font-size:11.5px;color:#666;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <template v-if="searchParam.dashboardId">
          <b>{{ cfCurDash ? cfCurDash.dashboardNm : '' }}</b>
          <span style="color:#aaa;font-family:monospace;font-size:11px;">{{ cfCurDash ? cfCurDash.uiCompNm : '' }}</span>
        </template>
        <span v-else style="color:#aaa;">좌측에서 대시보드를 선택하세요.</span>
        <span style="margin-left:auto;display:flex;align-items:center;gap:6px;">
          사이트
          <select class="form-control" v-model="searchParam.siteId"
            @change="handleBtnAction('siteChange')" style="width:150px;">
            <option v-for="o in siteOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </span>
      </div>
      <bo-grid bare selectable :columns="columns.dashItems" :rows="dashItems" row-key="dashboardItemId"
        :loading="uiState.itemLoading"
        :is-checked="isDashItemChecked" :all-checked="cfAllDashItemsChecked"
        @toggle-check="onToggleDashItemCheck" @toggle-check-all="onToggleDashItemCheckAll"
        :empty-text="searchParam.dashboardId ? '위젯항목이 없습니다.' : '좌측에서 대시보드를 선택하면 위젯항목목록이 표시됩니다.'" />
    </bo-container>
  </div>

  <!-- ===== ■. 차트별 데이터 그리드 — input_opts 별로 묶어 그룹마다 조회조건을 따로 받는다 ===== -->
  <bo-container title="대시보드 위젯데이타"
    :count-text="cfHasData ? ('체크 ' + cfVisibleCharts.length + ' / 전체 ' + charts.length + '개') : ''">
    <template #toolbar-actions>
      <button class="btn btn_reset" :disabled="cfAnyGroupLoading"
        @click="handleBtnAction('groups-reset')">초기화</button>
      <button class="btn btn_save" :disabled="!cfHasData || cfAnyGroupSaving"
        @click="handleBtnAction('groups-saveAll')">전체 저장</button>
    </template>

    <div style="padding:8px 12px;font-size:11.5px;color:#aaa;border-bottom:1px solid #f0f0f0;">
      위젯마다 조회조건(기간구분·상품·업체)이 다를 수 있어(cm_dashboard_item.input_opts) 아래 그룹별로 따로 조회·저장합니다.
    </div>

    <div v-if="cfGroups.length" style="padding:12px;display:flex;flex-direction:column;gap:20px;">
      <!-- 그룹 하나 = 같은 input_opts 를 쓰는 위젯 묶음 -->
      <div v-for="group in cfGroups" :key="group.key" style="border:1px solid #dbeafe;border-radius:10px;overflow:hidden;">
        <!-- 그룹 미니 조회조건 바 -->
        <div style="padding:8px 10px;background:#f0f6ff;border-bottom:1px solid #dbeafe;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="badge badge-blue" style="font-family:monospace;font-size:10px;">{{ group.key }}</span>
          <span style="font-size:11px;color:#64748b;">{{ group.dims.periodTypeCd === 'M' ? '월별' : '일별' }}</span>
          <input v-if="group.dims.periodTypeCd !== 'M'" type="date" class="form-control"
            v-model="groupParams[group.key].ymd" style="width:140px;" />
          <input v-else type="month" class="form-control"
            v-model="groupParams[group.key].ym" style="width:130px;" />
          <span v-if="group.dims.hasProdId" style="display:flex;align-items:center;gap:4px;">
            <input type="text" class="form-control" readonly :value="groupParams[group.key].prodNm"
              placeholder="상품 선택(선택)" style="width:130px;cursor:pointer;"
              @click="handleBtnAction('prodModal-open', group.key)" />
            <button v-if="groupParams[group.key].prodId" class="btn btn-sm"
              @click="handleBtnAction('group-prodClear', group.key)">✕</button>
          </span>
          <select v-if="group.dims.hasVendorId" class="form-control" v-model="groupParams[group.key].vendorId" style="width:140px;">
            <option value="">업체 전체(선택)</option>
            <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">{{ v.vendorNm }}</option>
          </select>
          <button class="btn btn_search btn-sm" :disabled="groupState[group.key].loading"
            @click="handleBtnAction('group-search', group.key)">조회</button>
          <span style="margin-left:auto;display:flex;align-items:center;gap:8px;">
            <button class="btn btn-sm" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-weight:700;"
              :disabled="groupState[group.key].loading"
              @click="handleBtnAction('group-simulateAll', group.key)">🎲 그룹 시뮬레이션</button>
            <button class="btn btn_save btn-sm" :disabled="groupState[group.key].saving"
              @click="handleBtnAction('group-save', group.key)">저장</button>
          </span>
        </div>
        <div v-if="groupState[group.key].searched" style="padding:4px 10px;font-size:11px;color:#94a3b8;background:#fafbfc;">
          기준: {{ fnGroupPeriodLabel(group.key) }}
          <span v-if="group.dims.hasProdId || group.dims.hasVendorId" style="margin-left:6px;">
            상품 {{ groupParams[group.key].prodNm || '전체' }} · 업체 {{ fnGroupVendorNm(group.key) }}
          </span>
        </div>

        <!-- 그룹에 속한 차트마다 그리드 1개: 행=시리즈(2레벨) / 열=항목명(3레벨) -->
        <div style="padding:12px;display:flex;flex-direction:column;gap:16px;">
          <div v-for="chart in group.charts.filter(c => !c._notLoaded)" :key="chart.dashboardItemId"
            style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
              <span style="font-weight:700;font-size:12.5px;color:#1f4a73;white-space:nowrap;">
                {{ chart.itemNm }}
                <span style="font-family:monospace;font-size:11px;color:#94a3b8;font-weight:400;">{{ chart.itemKey }}</span>
              </span>
              <!-- 시뮬레이션부터 우측 정렬 -->
              <span style="margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                <button class="btn btn-sm" :disabled="chart.autoCollectYn === 'Y' || groupState[group.key].loading"
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
          <div v-if="!group.charts.some(c => !c._notLoaded)" style="padding:16px;text-align:center;color:#aaa;font-size:12px;">
            [조회]를 눌러 이 그룹의 값을 불러오세요.
          </div>
        </div>
      </div>
    </div>

    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      <template v-if="dashItems.length && !uiState.selectedItemIds.length">
        위젯항목목록에서 표시할 항목을 체크해주세요.
      </template>
      <template v-else-if="searchParam.dashboardId && !dashItems.length && !uiState.itemLoading">
        선택한 대시보드에 차트 항목이 없습니다.
        <button class="btn btn-sm" @click="handleBtnAction('goItemMng')" style="margin-left:8px;">항목관리로 이동</button>
      </template>
      <template v-else>좌측에서 대시보드를 선택하면 값 입력 그리드가 표시됩니다.</template>
    </div>
  </bo-container>

  <!-- ===== ■. 상품 선택 팝업 (공통팝업 prod) ================================= -->
  <bo-cm-popup-modal v-if="modals.isProdPick"
    popup-cmd="cmPopup-prod-pick" popup-code="prod" clearable
    :on-callback="fnCallbackModal" @close="modals.isProdPick = false; modals.prodPickGroupKey = null" />
</bo-page>
`,
};

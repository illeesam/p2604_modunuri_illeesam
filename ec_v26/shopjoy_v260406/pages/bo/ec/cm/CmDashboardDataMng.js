/* ShopJoy Admin - 대시보드 데이타관리 (3레벨)
 *
 *  1레벨 차트명   cm_dashboard_item (key_level=1)  → 차트마다 그리드 1개
 *  2레벨 시리즈명 cm_dashboard_item (key_level=2)  → 그리드의 "행 제목"
 *  3레벨 항목명   cm_dashboard_item (key_level=3)  → 그리드의 "열 제목"
 *
 *  기준조건: 사이트(필수) · 일자/월(필수) · 상품(선택) · 판매업체(선택)
 *  사람이 직접 입력하는 화면이며, [시뮬레이션] 은 값만 자동으로 채워준다(저장은 별도).
 *
 *  ※ 구조(시리즈·항목)는 '대시보드 항목관리' 에서 정의한 "행" 에서 온다.
 *    값은 (정의행 + options) 좌표 하나에 하나씩 저장된다.
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

    const dashboards  = reactive([]);   /* 대시보드 선택 목록 */
    const charts      = reactive([]);   /* 조회 결과 — 차트별 그리드 [{itemNm, colNms[], rows[]}] */
    const siteOptions = reactive([]);   /* 사이트 select */
    const vendors     = reactive([]);   /* 판매업체 select */
    const uiState = reactive({ loading: false, saving: false, searched: false });
    const codes = reactive({});

    /* 기준조건 — 사이트/기간은 필수, 상품·업체는 선택 */
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

    /* cfPeriodKey — 서버 전송용 기간 키. D=YYYYMMDD / M=YYYYMM00 (월도 8자리로 맞춰 정렬 유지) */
    const cfPeriodKey = computed(() => searchParam.periodTypeCd === 'M'
      ? String(searchParam.ym || '').replace('-', '') + '00'
      : String(searchParam.ymd || '').replace(/-/g, ''));

    /* cfHasData — 조회 결과에 편집 가능한 차트가 있는지 */
    const cfHasData = computed(() => charts.length > 0);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')     return handleSearchList();
      if (cmd === 'searchParam-reset')    return handleReset();
      if (cmd === 'searchParam-simulate') return handleSimulate();
      if (cmd === 'searchParam-save')     return handleSave();
      if (cmd === 'prodModal-open')       { modals.isProdPick = true; return; }
      if (cmd === 'searchParam-prodClear') { searchParam.prodId = ''; searchParam.prodNm = ''; return; }
      if (cmd === 'goItemMng')            return props.navigate('cmDashboardItemMng');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
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
      if (!searchParam.dashboardId) { showToast('대시보드를 선택해주세요.', 'error'); return null; }
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

    /* fnApplyCharts — 서버 응답을 화면 상태로. colNms/vals 는 항상 MAX_COLS 길이로 맞춘다
       (길이가 들쭉날쭉하면 v-model 바인딩이 빈 칸에서 끊긴다) */
    const fnApplyCharts = (list) => {
      const norm = (arr) => {
        const out = Array.from({ length: MAX_COLS }, (_, i) => (arr && arr[i] != null ? arr[i] : ''));
        return out;
      };
      charts.splice(0, charts.length, ...(list || []).map(c => ({
        ...c,
        colNms: norm(c.colNms),
        rows: (c.rows || []).map(r => ({ ...r, vals: norm(r.vals) })),
      })));
    };

    /* handleSearchList — 조회 */
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

    /* handleReset — 검색조건 초기화 + 결과 비우기 */
    const handleReset = () => {
      Object.assign(searchParam, searchParamInit);
      charts.splice(0, charts.length);
      uiState.searched = false;
    };

    /* handleSimulate — 값 자동 채우기. 서버가 값만 만들어 주고 저장은 하지 않는다 */
    const handleSimulate = async () => {
      const params = fnValidCond();
      if (!params) return;
      const ok = await showConfirm('시뮬레이션', '입력값을 자동 생성한 값으로 채웁니다.\n화면의 기존 입력값은 덮어써집니다. 진행하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.cmDashboard.simulateDataGrid(params, '대시보드데이타관리', '시뮬레이션');
        fnApplyCharts(res.data?.data?.charts);
        uiState.searched = true;
        showToast('값을 자동 생성했습니다. 확인 후 [저장]을 눌러주세요.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '시뮬레이션 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
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

    /* fnLoadRefs — 기준조건 select 소스 (사이트 / 대시보드 / 판매업체) */
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
        dashboards.splice(0, dashboards.length, ...list);
        if (!searchParam.dashboardId && list.length) {
          searchParam.dashboardId = list[0].dashboardId;
          searchParamInit.dashboardId = searchParam.dashboardId;
        }
      } catch (err) { console.error('[catch-info]', err); }

      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 500 }, '대시보드데이타관리', '업체목록');
        vendors.splice(0, vendors.length, ...(res.data?.data?.pageList || []));
      } catch (err) { console.error('[catch-info]', err); }
    };

    /* initPage — 화면 로드 시퀀스. 코드·기준조건 소스를 받은 뒤 사용자가 [조회] 하도록 둔다
       (사이트·기간이 필수라 자동 조회하지 않는다 — 잘못된 조건으로 첫 조회가 나가는 걸 막는다) */
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

    /* 기준조건 — 사이트·기간구분·기간은 필수, 상품·업체는 선택 */
    columns.baseSearch = [
      { key: 'dashboardId', label: '대시보드', type: 'select', required: true,
        options: () => dashboards.map(d => ({ value: d.dashboardId, label: d.dashboardNm })),
        nullLabel: '대시보드 선택' },
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
      dashboards, charts, siteOptions, vendors, uiState, codes,
      searchParam, modals, columns, MAX_COLS,
      cfPeriodKey, cfHasData,
      fnColCount, fnRowSum, fnPeriodLabel, fnVendorNm,
      handleBtnAction, fnCallbackModal,
    };
  },
  template: /* html */ `
<bo-page title="대시보드 데이타관리"
  desc-summary="차트별로 시리즈(행) × 항목(열) 매트릭스에 값을 직접 입력합니다. 사이트·기간은 필수, 상품·판매업체는 선택 조건입니다. [시뮬레이션]은 값을 자동으로 채워주며 저장은 별도로 눌러야 합니다.">

  <!-- ===== ■. 기준조건 ==================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #ym>
        <input type="month" class="form-control" v-model="searchParam.ym" style="width:140px;" />
      </template>
    </bo-search-area>
  </bo-container>

  <!-- ===== ■. 차트별 데이터 그리드 ========================================= -->
  <bo-container title="항목 데이터"
    :count-text="cfHasData ? ('차트 ' + charts.length + '개') : ''">
    <template #toolbar-actions>
      <button class="btn" :disabled="uiState.loading || uiState.saving"
        @click="handleBtnAction('searchParam-simulate')"
        style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;font-weight:700;">🎲 시뮬레이션</button>
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

    <!-- 차트마다 그리드 1개: 행=시리즈(2레벨) / 열=항목명(3레벨) -->
    <div v-if="cfHasData" style="padding:12px;display:flex;flex-direction:column;gap:16px;">
      <div v-for="chart in charts" :key="chart.dashboardItemId"
        style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="padding:7px 10px;background:#f8fafc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;font-size:12.5px;color:#1f4a73;">{{ chart.itemNm }}</span>
          <span style="font-family:monospace;font-size:11px;color:#94a3b8;">{{ chart.itemKey }}</span>
          <span class="badge badge-blue" style="margin-left:auto;">{{ chart.chartTypeCd || '-' }}</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="bo-table bo-table-narrow">
            <thead>
              <tr>
                <th style="width:150px;">시리즈 \\ 항목</th>
                <th v-for="i in fnColCount(chart)" :key="i" style="min-width:110px;">
                  <!-- 항목관리에 3레벨 정의(cols_json)가 있으면 그것이 기준 — 여기서 고치지 않는다 -->
                  <template v-if="chart.colsFixed">
                    <div>{{ chart.colNms[i-1] }}</div>
                    <div style="font-family:monospace;font-size:10px;color:#94a3b8;font-weight:400;">
                      {{ chart.colCds ? chart.colCds[i-1] : '' }}</div>
                  </template>
                  <input v-else type="text" class="form-control" v-model="chart.colNms[i-1]"
                    :placeholder="'항목' + i" style="text-align:center;font-weight:700;" />
                </th>
                <th style="width:90px;">합계</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in chart.rows" :key="ri">
                <td style="font-weight:600;background:#f8fafc;">
                  {{ row.seriesNm || '(단일)' }}
                  <div v-if="row.itemKey" style="font-family:monospace;font-size:10px;color:#94a3b8;font-weight:400;">
                    {{ row.itemKey }}</div>
                </td>
                <td v-for="i in fnColCount(chart)" :key="i" style="padding:2px 4px;">
                  <input type="number" class="form-control" v-model="row.vals[i-1]"
                    style="text-align:right;" />
                </td>
                <td style="text-align:right;font-weight:700;color:#475569;">
                  {{ fnRowSum(chart, row) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else style="padding:32px;text-align:center;color:#aaa;">
      <template v-if="uiState.searched">
        선택한 대시보드에 차트 항목이 없습니다.
        <button class="btn btn-sm" @click="handleBtnAction('goItemMng')" style="margin-left:8px;">항목관리로 이동</button>
      </template>
      <template v-else>조회된 데이터가 없습니다.</template>
    </div>
  </bo-container>

  <!-- ===== ■. 상품 선택 팝업 (공통팝업 prod) ================================= -->
  <bo-cm-popup-modal v-if="modals.isProdPick"
    popup-cmd="cmPopup-prod-pick" popup-code="prod" clearable
    :on-callback="fnCallbackModal" @close="modals.isProdPick = false" />
</bo-page>
`,
};

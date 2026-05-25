/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: '', searchMoreOpen: false, loading: false });
    const codes = reactive({ raw_types: [], raw_collect_statuses: [], raw_vendor_divs: [], pay_methods: [], order_statuses_kr: [],
      confirm_yn_opts: [], close_yn_opts: [], send_yn_opts: [],
      date_range_opts: [],
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-date-range') {
        return handleDateRangeChange();
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else if (cmd === 'searchParam-more-toggle') {
        uiState.searchMoreOpen = !uiState.searchMoreOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'rawData-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else if (cmd === 'rawData-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.raw_types = codeStore.sgGetGrpCodes('RAW_TYPE_KR');
        codes.raw_collect_statuses = codeStore.sgGetGrpCodes('RAW_COLLECT_STATUS');
        codes.raw_vendor_divs = codeStore.sgGetGrpCodes('RAW_VENDOR_DIV');
        codes.pay_methods = codeStore.sgGetGrpCodes('PAY_METHOD_KR');
        codes.order_statuses_kr = codeStore.sgGetGrpCodes('ORDER_STATUS_KR');
        codes.confirm_yn_opts = codeStore.sgGetGrpCodes('CONFIRM_YN');
        codes.close_yn_opts = codeStore.sgGetGrpCodes('CLOSE_YN');
        codes.send_yn_opts = codeStore.sgGetGrpCodes('SEND_YN');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);
            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    // 검색 필드
  const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '', vendorType: '', payMethod: '', buyConfirm: '', closeYn: '', erpSend: '', period: '', orderStatus: '', amtFrom: '', amtTo: '', moreOpen: '' });
  const searchParam = reactive(_initSearchParam());

    const pager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const rawList = reactive([]);

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.loading = true;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'rawId,srcId,vendorNm,prodNm,brandNm';
        }
        const res = await boApiSvc.stSettleRaw.getPage(params, '정산데이터관리', '목록조회');
        const data = res.data?.data;
        rawList.splice(0, rawList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || rawList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (err) {
        console.error('[handleSearchList]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) {
        fnLoadCodes();
        handleSearchList('DEFAULT');
      }
    });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const cfSummary = computed(() => ({
      totalAmt:   rawList.reduce((s, r) => s + (r.settleTargetAmt || 0), 0),
      collectCnt: rawList.filter(r => r.rawStatusCd === 'COLLECTED').length,
      settleAmt:  rawList.reduce((s, r) => s + (r.settleAmt || 0), 0),
      feeAmt:     rawList.reduce((s, r) => s + (r.settleFeeAmt || 0), 0),
      closeCnt:   rawList.filter(r => r.closeYn === 'Y').length,
      erpCnt:     rawList.filter(r => r.erpSendYn === 'Y').length,
      confirmCnt: rawList.filter(r => r.buyConfirmYn === 'Y').length,
    }));

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    const expandedRows = reactive(new Set());

    /* toggleRow — 토글 */
    const toggleRow = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded — 여부 확인 */
    const isExpanded = id => expandedRows.has(id);

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ 'COLLECTED':'badge-green', 'EXCLUDED':'badge-gray', 'SETTLED':'badge-purple', 'PENDING':'badge-blue' }[s] || 'badge-gray');

    /* rawStatusLabel — 원본 상태 라벨 */
    const rawStatusLabel = s => ({ 'COLLECTED':'수집완료', 'EXCLUDED':'제외', 'SETTLED':'정산완료', 'PENDING':'대기' }[s] || s || '-');

    /* fnRawStatusBadge — 유틸 */
    const fnRawStatusBadge = s => fnStatusBadge(s);

    /* vendorTypeLabel — 업체 유형 라벨 */
    const vendorTypeLabel = s => ({ 'SALE':'판매업체', 'DLIV':'배송업체', 'EXTERNAL':'외부업체' }[s] || s || '-');

    /* orderStatusLabel — 주문 상태 라벨 */
    const orderStatusLabel = s => ({ 'ORDERED':'주문완료', 'PAID':'결제완료', 'PREPARING':'준비중', 'SHIPPING':'배송중', 'DELIVERED':'배송완료', 'CONFIRMED':'구매확정', 'CANCELLED':'취소' }[s] || s || '-');

    /* fmtW — 포맷 W */
    const fmtW = n => (Number(n || 0) >= 0 ? '' : '-') + Math.abs(Number(n || 0)).toLocaleString() + '원';

    /* fmtPct — 포맷 퍼센트 */
    const fmtPct = n => Number(n || 0).toLocaleString() + '%';

    /* rawGridColumns — BoGrid 컬럼 정의 (특수셀은 #cell- 슬롯 override) */
    const rawGridColumns = [
      { key: 'expand',         label: '',         style: 'width:30px',
        align: 'center',
        cellStyle: 'color:#aaa;font-size:11px;user-select:none;',
        fmt: (v, row) => isExpanded(row.settleRawId) ? '▲' : '▼' },
      { key: 'settleRawId',    label: '원장ID',
        cellStyle: 'font-size:12px;color:#555;' },
      { key: 'orderDate',      label: '거래일자' },
      { key: 'rawTypeCd',      label: '유형',
        badge: (row) => row.rawTypeCd === 'ORDER' ? 'badge-blue' : 'badge-orange' },
      { key: 'orderId',        label: '소스ID', cellStyle: 'color:#555' },
      { key: 'vendorNm',       label: '업체',
        fmt: (v, row) => `${row.vendorNm || ''} / ${vendorTypeLabel(row.vendorTypeCd) || ''}` },
      { key: 'prodNm',         label: '상품명',
        cellStyle: 'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        fmt: (v, row) => row.brandNm ? `${row.prodNm || ''} / ${row.brandNm}` : (row.prodNm || ''),
        cellTitle: true },
      { key: 'orderQty',       label: '수량',         style: 'text-align:right',
        align: 'right', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'settleTargetAmt', label: '정산대상금액', style: 'text-align:right',
        align: 'right', fmt: fmtW,
        cellStyle: (v) => 'font-weight:600;' + (v < 0 ? 'color:#e74c3c' : '') },
      { key: 'settleFeeAmt',   label: '수수료',       style: 'text-align:right',
        align: 'right', fmt: fmtW, cellStyle: 'color:#e74c3c' },
      { key: 'settleAmt',      label: '정산금액',     style: 'text-align:right',
        align: 'right', fmt: fmtW,
        cellStyle: (v) => 'font-weight:700;' + (v < 0 ? 'color:#e74c3c' : 'color:#2980b9') },
      { key: 'rawStatusCd',    label: '수집상태',
        badge: (row) => fnRawStatusBadge(row.rawStatusCd), fmt: (v) => rawStatusLabel(v) },
      { key: 'closeYn',        label: '마감',
        badge: (row) => row.closeYn === 'Y' ? 'badge-purple' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '마감' : '미마감' },
      { key: 'erpSendYn',      label: 'ERP',
        badge: (row) => row.erpSendYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '전송' : '미전송' },
    ];

    /* doCollect — 실행 */
    const doCollect = async () => {
      const ok = await showConfirm('재수집', '해당 기간 정산 데이터를 재수집하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await boApiSvc.stSettleRaw.collect({ dateStart: uiState.dateStart, dateEnd: uiState.dateEnd }, '원장관리', '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('재수집이 완료되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0); }
      }
    };

  // ===== [06] return (템플릿 노출) ==============================================

  return {
      uiState, handleDateRangeChange,
      searchParam,
      pager, rawList, cfSummary,
      handleBtnAction, handleSelectAction,
      expandedRows, toggleRow, isExpanded,
      fnStatusBadge, rawStatusLabel, fnRawStatusBadge, vendorTypeLabel, orderStatusLabel,
      fmtW, fmtPct, doCollect, codes, rawGridColumns,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    정산수집원장
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다. • 수집 단위: od_order_item / od_claim_item (상품 행 단위) • [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다. • 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 검색 카드 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :bar-style="'flex-wrap:wrap;gap:8px'" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <!-- ===== ■.■.■. 1행: 기간 + 기본 필터 ====================================== -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;width:100%;margin-bottom:8px">
        <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
          <option value="">
            기간 선택
          </option>
          <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">
            {{ opt.codeLabel }}
          </option>
        </select>
        <input type="date" v-model="uiState.dateStart" style="width:140px" />
        <span style="line-height:32px">
          ~
        </span>
        <input type="date" v-model="uiState.dateEnd" style="width:140px" />
        <select v-model="searchParam.type" style="width:100px">
          <option value="">
            유형 전체
          </option>
          <option v-for="c in codes.raw_types" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <select v-model="searchParam.status" style="width:110px">
          <option value="">
            수집상태 전체
          </option>
          <option v-for="c in codes.raw_collect_statuses" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <bo-multi-check-select
          v-model="searchParam.searchType"
          :options="[
          { value: 'rawId',    label: '원장ID' },
          { value: 'srcId',    label: '소스ID' },
          { value: 'vendorNm', label: '업체명' },
          { value: 'prodNm',   label: '상품명' },
          { value: 'brandNm',  label: '브랜드' },
          ]"
          placeholder="검색대상 전체"
          all-label="전체 선택"
          min-width="160px" />
        <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="width:230px" @keyup.enter="handleBtnAction('searchParam-list')" />
      </div>
      <!-- ===== ■.■.■. 2행: 추가 필터 =========================================== -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;width:100%;margin-bottom:8px">
        <select v-model="searchParam.vendorType" style="width:110px">
          <option value="">
            업체구분 전체
          </option>
          <option v-for="c in codes.raw_vendor_divs" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <select v-model="searchParam.payMethod" style="width:120px">
          <option value="">
            결제수단 전체
          </option>
          <option v-for="c in codes.pay_methods" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <select v-model="searchParam.buyConfirm" style="width:110px">
          <option value="">
            구매확정 전체
          </option>
          <option v-for="o in codes.confirm_yn_opts" :key="o.codeValue" :value="o.codeValue">
            {{ o.codeLabel }}
          </option>
        </select>
        <select v-model="searchParam.closeYn" style="width:110px">
          <option value="">
            마감여부 전체
          </option>
          <option v-for="o in codes.close_yn_opts" :key="o.codeValue" :value="o.codeValue">
            {{ o.codeLabel }}
          </option>
        </select>
        <select v-model="searchParam.erpSend" style="width:110px">
          <option value="">
            ERP전송 전체
          </option>
          <option v-for="o in codes.send_yn_opts" :key="o.codeValue" :value="o.codeValue">
            {{ o.codeLabel }}
          </option>
        </select>
        <input v-model="searchParam.period" placeholder="정산기간(YYYY-MM)" style="width:150px" maxlength="7" />
      </div>
      <!-- ===== ■.■.■. 3행: 상세검색 펼치기 ======================================== -->
      <div v-if="uiState.searchMoreOpen" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;padding-top:8px;border-top:1px solid #f0f0f0">
        <select v-model="searchParam.orderStatus" style="width:120px">
          <option value="">
            주문상태 전체
          </option>
          <option v-for="c in codes.order_statuses_kr" :key="c.codeValue" :value="c.codeValue">
            {{ c.codeLabel }}
          </option>
        </select>
        <span style="line-height:32px;font-size:12px;color:#888">
          수집금액
        </span>
        <input v-model="searchParam.amtFrom" type="number" placeholder="최솟값(원)" style="width:120px" />
        <span style="line-height:32px">
          ~
        </span>
        <input v-model="searchParam.amtTo" type="number" placeholder="최댓값(원)" style="width:120px" />
      </div>
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="uiState.searchMoreOpen=!uiState.searchMoreOpen" style="min-width:70px">
          {{ uiState.searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </template>
    </bo-search-area>
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 카드 =================================================== -->
  <!-- ===== ■. 집계 카드 =================================================== -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr) repeat(3,1fr);gap:8px;margin-bottom:12px">
    <div class="card" style="text-align:center;padding:10px;background:#f0f4ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        수집건수
      </div>
      <div style="font-size:18px;font-weight:700;color:#3498db">
        {{ pager.pageTotalCount.toLocaleString() }}건
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0fff4;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        정산대상
      </div>
      <div style="font-size:18px;font-weight:700;color:#27ae60">
        {{ cfSummary.collectCnt.toLocaleString() }}건
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff8f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        구매확정
      </div>
      <div style="font-size:18px;font-weight:700;color:#e67e22">
        {{ cfSummary.confirmCnt.toLocaleString() }}건
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f5f0ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        마감완료
      </div>
      <div style="font-size:18px;font-weight:700;color:#8e44ad">
        {{ cfSummary.closeCnt.toLocaleString() }}건
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f8f9fa;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        수집금액 합계
      </div>
      <div style="font-size:15px;font-weight:700" :style="cfSummary.totalAmt>=0?'color:#333':'color:#e74c3c'">
        {{ fmtW(cfSummary.totalAmt) }}
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff0f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        수수료 합계
      </div>
      <div style="font-size:15px;font-weight:700;color:#e74c3c">
        {{ fmtW(cfSummary.feeAmt) }}
      </div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0f8ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">
        정산금액 합계
      </div>
      <div style="font-size:15px;font-weight:700;color:#2980b9">
        {{ fmtW(cfSummary.settleAmt) }}
      </div>
    </div>
  </div>
  <!-- ===== □. 집계 카드 =================================================== -->
  <!-- ===== ■. 목록 카드 =================================================== -->
  <bo-grid
    :columns="rawGridColumns"
    :rows="rawList"
    :pager="pager"
    row-key="settleRawId"
    list-title="정산수집원장"
    :is-expanded="(r) => isExpanded(r.settleRawId)"
    empty-text="데이터가 없습니다." row-clickable
    @set-page="n => handleSelectAction('rawData-pager-setPage', n)"
    @size-change="handleSelectAction('rawData-pager-sizeChange')"
    @row-click="(r) => toggleRow(r.settleRawId)">
    <template #toolbar-actions>
      <button class="btn btn-secondary btn-sm" @click="() => { rawList.forEach(r => { if(!isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▼ 전체펼치기
      </button>
      <button class="btn btn-secondary btn-sm" @click="() => { rawList.forEach(r => { if(isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▲ 전체접기
      </button>
      <button class="btn btn-blue btn-sm" @click="doCollect">
        🔄 재수집
      </button>
    </template>
    <template #row-expand="{ row: r, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:12px 20px;border-top:none">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:12px">
          <!-- ===== ■.■.■.■.■. 주문정보 ============================================ -->
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">
              주문 정보
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  주문ID
                </td>
                <td style="padding:2px 0">
                  {{ r.orderId }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  거래일자
                </td>
                <td>
                  {{ r.orderDate }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  주문상태
                </td>
                <td>
                  {{ orderStatusLabel(r.orderItemStatusCd) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  결제수단
                </td>
                <td>
                  {{ r.payMethodCd }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  구매확정
                </td>
                <td>
                  <span class="badge" :class="r.buyConfirmYn==='Y'?'badge-green':'badge-gray'">
                    {{ r.buyConfirmYn==='Y'?'확정':'미확정' }}
                  </span>
                  <span v-if="r.buyConfirmDate" style="color:#888;margin-left:4px">
                    {{ r.buyConfirmDate }}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  정산기간
                </td>
                <td>
                  {{ r.settlePeriod }}
                </td>
              </tr>
            </table>
          </div>
          <!-- ===== ■.■.■.■.■. 상품/가격 정보 ======================================== -->
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">
              상품 · 가격
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  상품명
                </td>
                <td>
                  {{ r.prodNm }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  브랜드
                </td>
                <td>
                  {{ r.brandNm }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  SKU ID
                </td>
                <td style="font-size:11px;color:#888">
                  {{ r.skuId }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  정상가
                </td>
                <td>
                  {{ fmtW(r.normalPrice) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  단가
                </td>
                <td>
                  {{ fmtW(r.unitPrice) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  수량
                </td>
                <td>
                  {{ (r.orderQty||0).toLocaleString() }}개
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  소계
                </td>
                <td style="font-weight:600">
                  {{ fmtW(r.itemPrice) }}
                </td>
              </tr>
            </table>
          </div>
          <!-- ===== ■.■.■.■.■. 할인/혜택 =========================================== -->
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">
              할인 · 혜택
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  직접할인
                </td>
                <td style="color:#e74c3c">
                  {{ r.discntAmt ? '- ' + fmtW(r.discntAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  쿠폰할인
                </td>
                <td style="color:#e74c3c">
                  {{ r.couponDiscntAmt ? '- ' + fmtW(r.couponDiscntAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  프로모션할인
                </td>
                <td style="color:#e74c3c">
                  {{ r.promoDiscntAmt ? '- ' + fmtW(r.promoDiscntAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  캐쉬사용
                </td>
                <td style="color:#e74c3c">
                  {{ r.cacheUseAmt ? '- ' + fmtW(r.cacheUseAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  마일리지
                </td>
                <td style="color:#e74c3c">
                  {{ r.mileageUseAmt ? '- ' + fmtW(r.mileageUseAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  상품권
                </td>
                <td style="color:#e74c3c">
                  {{ r.voucherUseAmt ? '- ' + fmtW(r.voucherUseAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  사은품원가
                </td>
                <td style="color:#e74c3c">
                  {{ r.giftAmt ? '- ' + fmtW(r.giftAmt) : '-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  적립예정
                </td>
                <td style="color:#27ae60">
                  {{ r.saveSchdAmt ? fmtW(r.saveSchdAmt) : '-' }}
                </td>
              </tr>
            </table>
          </div>
          <!-- ===== ■.■.■.■.■. 정산/마감/ERP ======================================= -->
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">
              정산 · 마감 · ERP
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  정산대상금액
                </td>
                <td style="font-weight:600">
                  {{ fmtW(r.settleTargetAmt) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  수수료율
                </td>
                <td>
                  {{ fmtPct(r.settleFeeRate) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  수수료금액
                </td>
                <td style="color:#e74c3c">
                  {{ fmtW(r.settleFeeAmt) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  정산금액
                </td>
                <td style="font-weight:700;color:#2980b9">
                  {{ fmtW(r.settleAmt) }}
                </td>
              </tr>
              <tr style="border-top:1px dashed #ddd">
                <td style="color:#888;padding:4px 4px 2px 0;white-space:nowrap">
                  마감여부
                </td>
                <td style="padding-top:4px">
                  <span class="badge" :class="r.closeYn==='Y'?'badge-purple':'badge-gray'">
                    {{ r.closeYn==='Y'?'마감완료':'미마감' }}
                  </span>
                  <span v-if="r.closeDate" style="color:#888;font-size:11px;margin-left:4px">
                    {{ r.closeDate }}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  ERP전송
                </td>
                <td>
                  <span class="badge" :class="r.erpSendYn==='Y'?'badge-green':'badge-gray'">
                    {{ r.erpSendYn==='Y'?'전송완료':'미전송' }}
                  </span>
                </td>
              </tr>
              <tr v-if="r.remark">
                <td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">
                  비고
                </td>
                <td style="color:#888">
                  {{ r.remark }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </td>
    </template>
  </bo-grid>
</div>
<!-- ===== □. 목록 카드 =================================================== -->
`,
};

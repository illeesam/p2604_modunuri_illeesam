/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: '', searchMoreOpen: false, loading: false });
    const codes = reactive({ raw_types: [], raw_collect_statuses: [], raw_vendor_divs: [], pay_methods: [], order_statuses_kr: [],
      confirm_yn_opts: [{ codeValue: 'Y', codeLabel: '확정' }, { codeValue: 'N', codeLabel: '미확정' }],
      close_yn_opts: [{ codeValue: 'Y', codeLabel: '마감완료' }, { codeValue: 'N', codeLabel: '미마감' }],
      send_yn_opts: [{ codeValue: 'Y', codeLabel: '전송완료' }, { codeValue: 'N', codeLabel: '미전송' }],
      date_range_opts: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.raw_types = codeStore.snGetGrpCodes('RAW_TYPE_KR') || [];
        codes.raw_collect_statuses = codeStore.snGetGrpCodes('RAW_COLLECT_STATUS') || [];
        codes.raw_vendor_divs = codeStore.snGetGrpCodes('RAW_VENDOR_DIV') || [];
        codes.pay_methods = codeStore.snGetGrpCodes('PAY_METHOD_KR') || [];
        codes.order_statuses_kr = codeStore.snGetGrpCodes('ORDER_STATUS_KR') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
        handleSearchList('DEFAULT');
      }
    });

            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    // 검색 필드
  const searchParam = reactive({
    kw: '',
    type: '',
    status: '',
    vendorType: '',
    payMethod: '',
    buyConfirm: '',
    closeYn: '',
    erpSend: '',
    period: '',
    orderStatus: '',
    amtFrom: '',
    amtTo: '',
    moreOpen: '', dateEnd: ''});;
  const searchParamOrg = reactive({
    kw: '',
    type: '',
    status: '',
    vendorType: '',
    payMethod: '',
    buyConfirm: '',
    closeYn: '',
    erpSend: '',
    period: '',
    orderStatus: '',
    amtFrom: '',
    amtTo: '',
    moreOpen: ''
  });

    const pager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const rawList = reactive([]);

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.loading = true;
        const res = await boApiSvc.stSettleRaw.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '정산데이터관리', '목록조회');
        const data = res.data?.data;
        rawList.splice(0, rawList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || rawList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
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
      Object.assign(searchParamOrg, searchParam);
    });


    const cfPageNums = computed(() => { const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c-2), e = Math.min(l, s+4); return Array.from({length: e-s+1}, (_, i) => s+i); });

    const cfSummary = computed(() => ({
      totalAmt:   rawList.reduce((s, r) => s + (r.settleTargetAmt || 0), 0),
      collectCnt: rawList.filter(r => r.rawStatusCd === 'COLLECTED').length,
      settleAmt:  rawList.reduce((s, r) => s + (r.settleAmt || 0), 0),
      feeAmt:     rawList.reduce((s, r) => s + (r.settleFeeAmt || 0), 0),
      closeCnt:   rawList.filter(r => r.closeYn === 'Y').length,
      erpCnt:     rawList.filter(r => r.erpSendYn === 'Y').length,
      confirmCnt: rawList.filter(r => r.buyConfirmYn === 'Y').length,
    }));

    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };

    const expandedRows = reactive(new Set());
    const toggleRow = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };
    const isExpanded = id => expandedRows.has(id);

    const fnStatusBadge = s => ({ 'COLLECTED':'badge-green', 'EXCLUDED':'badge-gray', 'SETTLED':'badge-purple', 'PENDING':'badge-blue' }[s] || 'badge-gray');
    const rawStatusLabel = s => ({ 'COLLECTED':'수집완료', 'EXCLUDED':'제외', 'SETTLED':'정산완료', 'PENDING':'대기' }[s] || s || '-');
    const fnRawStatusBadge = s => fnStatusBadge(s);
    const vendorTypeLabel = s => ({ 'SALE':'판매업체', 'DLIV':'배송업체', 'EXTERNAL':'외부업체' }[s] || s || '-');
    const orderStatusLabel = s => ({ 'ORDERED':'주문완료', 'PAID':'결제완료', 'PREPARING':'준비중', 'SHIPPING':'배송중', 'DELIVERED':'배송완료', 'CONFIRMED':'구매확정', 'CANCELLED':'취소' }[s] || s || '-');
    const fmtW = n => (Number(n || 0) >= 0 ? '' : '-') + Math.abs(Number(n || 0)).toLocaleString() + '원';
    const fmtPct = n => Number(n || 0).toLocaleString() + '%';
    const doCollect = async () => {
      const ok = await props.showConfirm('재수집', '해당 기간 정산 데이터를 재수집하시겠습니까?');
      if (!ok) return;
      try {
        const res = await boApiSvc.stSettleRaw.collect({ dateStart: uiState.dateStart, dateEnd: uiState.dateEnd }, '원장관리', '저장');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('재수집이 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        if (props.showToast) props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    // ── return ───────────────────────────────────────────────────────────────

  return {
      uiState, handleDateRangeChange,
      searchParam,
      pager, rawList, cfPageNums, cfSummary,
      setPage, onSizeChange, onSearch, onReset,
      expandedRows, toggleRow, isExpanded,
      fnStatusBadge, rawStatusLabel, fnRawStatusBadge, vendorTypeLabel, orderStatusLabel,
      fmtW, fmtPct, doCollect, codes,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">정산수집원장</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다.
• 수집 단위: od_order_item / od_claim_item (상품 행 단위)
• [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다.
• 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)</div>
  </div>

  <!-- ── 검색 카드 ── -->
  <div class="card">
    <!-- ── 1행: 기간 + 기본 필터 ─────────────────────────────────────────────── -->
    <div class="search-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.type" style="width:100px">
        <option value="">유형 전체</option><option v-for="c in codes.raw_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status" style="width:110px">
        <option value="">수집상태 전체</option>
        <option v-for="c in codes.raw_collect_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input v-model="searchParam.kw" placeholder="원장ID / 소스ID / 업체명 / 상품명 / 브랜드" style="width:230px" @keyup.enter="() => onSearch?.()" />
    </div>
    <!-- ── 2행: 추가 필터 ──────────────────────────────────────────────────── -->
    <div class="search-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <select v-model="searchParam.vendorType" style="width:110px">
        <option value="">업체구분 전체</option>
        <option v-for="c in codes.raw_vendor_divs" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.payMethod" style="width:120px">
        <option value="">결제수단 전체</option>
        <option v-for="c in codes.pay_methods" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.buyConfirm" style="width:110px">
        <option value="">구매확정 전체</option>
        <option v-for="o in codes.confirm_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <select v-model="searchParam.closeYn" style="width:110px">
        <option value="">마감여부 전체</option>
        <option v-for="o in codes.close_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <select v-model="searchParam.erpSend" style="width:110px">
        <option value="">ERP전송 전체</option>
        <option v-for="o in codes.send_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <input v-model="searchParam.period" placeholder="정산기간(YYYY-MM)" style="width:150px" maxlength="7" />
      <div class="search-actions" style="margin-left:auto">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
        <button class="btn btn-secondary btn-sm" @click="uiState.searchMoreOpen=!uiState.searchMoreOpen" style="min-width:70px">
          {{ uiState.searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </div>
    </div>
    <!-- ── 3행: 상세검색 펼치기 ───────────────────────────────────────────────── -->
    <div v-if="uiState.searchMoreOpen" class="search-bar" style="flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px solid #f0f0f0">
      <select v-model="searchParam.orderStatus" style="width:120px">
        <option value="">주문상태 전체</option>
        <option v-for="c in codes.order_statuses_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span style="line-height:32px;font-size:12px;color:#888">수집금액</span>
      <input v-model="searchParam.amtFrom" type="number" placeholder="최솟값(원)" style="width:120px" />
      <span style="line-height:32px">~</span>
      <input v-model="searchParam.amtTo" type="number" placeholder="최댓값(원)" style="width:120px" />
    </div>
  </div>

  <!-- ── 집계 카드 ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr) repeat(3,1fr);gap:8px;margin-bottom:12px">
    <div class="card" style="text-align:center;padding:10px;background:#f0f4ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">수집건수</div>
      <div style="font-size:18px;font-weight:700;color:#3498db">{{ pager.pageTotalCount.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0fff4;margin-bottom:0">
      <div style="font-size:11px;color:#888">정산대상</div>
      <div style="font-size:18px;font-weight:700;color:#27ae60">{{ cfSummary.collectCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff8f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">구매확정</div>
      <div style="font-size:18px;font-weight:700;color:#e67e22">{{ cfSummary.confirmCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f5f0ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">마감완료</div>
      <div style="font-size:18px;font-weight:700;color:#8e44ad">{{ cfSummary.closeCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f8f9fa;margin-bottom:0">
      <div style="font-size:11px;color:#888">수집금액 합계</div>
      <div style="font-size:15px;font-weight:700" :style="cfSummary.totalAmt>=0?'color:#333':'color:#e74c3c'">{{ fmtW(cfSummary.totalAmt) }}</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff0f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">수수료 합계</div>
      <div style="font-size:15px;font-weight:700;color:#e74c3c">{{ fmtW(cfSummary.feeAmt) }}</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0f8ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">정산금액 합계</div>
      <div style="font-size:15px;font-weight:700;color:#2980b9">{{ fmtW(cfSummary.settleAmt) }}</div>
    </div>
  </div>

  <!-- ── 목록 카드 ── -->
  <div class="card">
    <div class="toolbar">
      <span class="list-count">총 {{ pager.pageTotalCount.toLocaleString() }}건</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" @click="() => { rawList.forEach(r => { if(!isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">▼ 전체펼치기</button>
        <button class="btn btn-secondary btn-sm" @click="() => { rawList.forEach(r => { if(isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">▲ 전체접기</button>
        <button class="btn btn-blue btn-sm" @click="doCollect">🔄 재수집</button>
      </div>
    </div>
    <table class="bo-table">
      <thead>
        <tr>
          <th style="width:30px"></th>
          <th style="width:36px;text-align:center;">번호</th>
          <th>원장ID</th>
          <th>거래일자</th>
          <th>유형</th>
          <th>소스ID</th>
          <th>업체</th>
          <th>상품명</th>
          <th style="text-align:right">수량</th>
          <th style="text-align:right">정산대상금액</th>
          <th style="text-align:right">수수료</th>
          <th style="text-align:right">정산금액</th>
          <th>수집상태</th>
          <th>마감</th>
          <th>ERP</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(r, idx) in rawList" :key="r?.settleRawId">
          <!-- ── 기본 행 ─────────────────────────────────────────────────── -->
          <tr :style="isExpanded(r.settleRawId) ? 'background:#fafbff' : ''" style="cursor:pointer" @click="toggleRow(r.settleRawId)">
            <td style="text-align:center;color:#aaa;font-size:11px;user-select:none">
              {{ isExpanded(r.settleRawId) ? '▲' : '▼' }}
            </td>
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td style="font-size:12px;color:#555">{{ r.settleRawId }}</td>
            <td>{{ r.orderDate }}</td>
            <td><span class="badge" :class="r.rawTypeCd==='ORDER'?'badge-blue':'badge-orange'">{{ r.rawTypeCd }}</span></td>
            <td style="font-size:12px;color:#555">{{ r.orderId }}</td>
            <td>
              <div>{{ r.vendorNm }}</div>
              <div style="font-size:11px;color:#aaa">{{ vendorTypeLabel(r.vendorTypeCd) }}</div>
            </td>
            <td>
              <div style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.prodNm }}</div>
              <div style="font-size:11px;color:#aaa">{{ r.brandNm }}</div>
            </td>
            <td style="text-align:right">{{ (r.orderQty||0).toLocaleString() }}</td>
            <td style="text-align:right;font-weight:600" :style="r.settleTargetAmt<0?'color:#e74c3c':''">{{ fmtW(r.settleTargetAmt) }}</td>
            <td style="text-align:right;color:#e74c3c">{{ fmtW(r.settleFeeAmt) }}</td>
            <td style="text-align:right;font-weight:700" :style="r.settleAmt<0?'color:#e74c3c':'color:#2980b9'">{{ fmtW(r.settleAmt) }}</td>
            <td><span class="badge" :class="fnRawStatusBadge(r.rawStatusCd)">{{ rawStatusLabel(r.rawStatusCd) }}</span></td>
            <td><span class="badge" :class="r.closeYn==='Y'?'badge-purple':'badge-gray'">{{ r.closeYn==='Y'?'마감':'미마감' }}</span></td>
            <td><span class="badge" :class="r.erpSendYn==='Y'?'badge-green':'badge-gray'">{{ r.erpSendYn==='Y'?'전송':'미전송' }}</span></td>
          </tr>
          <!-- ── 펼침 상세 행 ──────────────────────────────────────────────── -->
          <tr v-if="isExpanded(r.settleRawId)">
            <td colspan="14" style="background:#f4f6fb;padding:12px 20px;border-top:none">
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:12px">
                <!-- ── 주문정보 ───────────────────────────────────────────── -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">주문 정보</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">주문ID</td><td style="padding:2px 0">{{ r.orderId }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">거래일자</td><td>{{ r.orderDate }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">주문상태</td><td>{{ orderStatusLabel(r.orderItemStatusCd) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">결제수단</td><td>{{ r.payMethodCd }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">구매확정</td><td>
                      <span class="badge" :class="r.buyConfirmYn==='Y'?'badge-green':'badge-gray'">{{ r.buyConfirmYn==='Y'?'확정':'미확정' }}</span>
                      <span v-if="r.buyConfirmDate" style="color:#888;margin-left:4px">{{ r.buyConfirmDate }}</span>
                    </td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정산기간</td><td>{{ r.settlePeriod }}</td></tr>
                  </table>
                </div>
                <!-- ── 상품/가격 정보 ───────────────────────────────────────── -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">상품 · 가격</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">상품명</td><td>{{ r.prodNm }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">브랜드</td><td>{{ r.brandNm }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">SKU ID</td><td style="font-size:11px;color:#888">{{ r.skuId }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정상가</td><td>{{ fmtW(r.normalPrice) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">단가</td><td>{{ fmtW(r.unitPrice) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">수량</td><td>{{ (r.orderQty||0).toLocaleString() }}개</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">소계</td><td style="font-weight:600">{{ fmtW(r.itemPrice) }}</td></tr>
                  </table>
                </div>
                <!-- ── 할인/혜택 ──────────────────────────────────────────── -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">할인 · 혜택</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">직접할인</td><td style="color:#e74c3c">{{ r.discntAmt ? '- ' + fmtW(r.discntAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">쿠폰할인</td><td style="color:#e74c3c">{{ r.couponDiscntAmt ? '- ' + fmtW(r.couponDiscntAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">프로모션할인</td><td style="color:#e74c3c">{{ r.promoDiscntAmt ? '- ' + fmtW(r.promoDiscntAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">캐쉬사용</td><td style="color:#e74c3c">{{ r.cacheUseAmt ? '- ' + fmtW(r.cacheUseAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">마일리지</td><td style="color:#e74c3c">{{ r.mileageUseAmt ? '- ' + fmtW(r.mileageUseAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">상품권</td><td style="color:#e74c3c">{{ r.voucherUseAmt ? '- ' + fmtW(r.voucherUseAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">사은품원가</td><td style="color:#e74c3c">{{ r.giftAmt ? '- ' + fmtW(r.giftAmt) : '-' }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">적립예정</td><td style="color:#27ae60">{{ r.saveSchdAmt ? fmtW(r.saveSchdAmt) : '-' }}</td></tr>
                  </table>
                </div>
                <!-- ── 정산/마감/ERP ──────────────────────────────────────── -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">정산 · 마감 · ERP</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정산대상금액</td><td style="font-weight:600">{{ fmtW(r.settleTargetAmt) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">수수료율</td><td>{{ fmtPct(r.settleFeeRate) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">수수료금액</td><td style="color:#e74c3c">{{ fmtW(r.settleFeeAmt) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정산금액</td><td style="font-weight:700;color:#2980b9">{{ fmtW(r.settleAmt) }}</td></tr>
                    <tr style="border-top:1px dashed #ddd">
                      <td style="color:#888;padding:4px 4px 2px 0;white-space:nowrap">마감여부</td>
                      <td style="padding-top:4px">
                        <span class="badge" :class="r.closeYn==='Y'?'badge-purple':'badge-gray'">{{ r.closeYn==='Y'?'마감완료':'미마감' }}</span>
                        <span v-if="r.closeDate" style="color:#888;font-size:11px;margin-left:4px">{{ r.closeDate }}</span>
                      </td>
                    </tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">ERP전송</td><td>
                      <span class="badge" :class="r.erpSendYn==='Y'?'badge-green':'badge-gray'">{{ r.erpSendYn==='Y'?'전송완료':'미전송' }}</span>
                    </td></tr>
                    <tr v-if="r.remark"><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">비고</td><td style="color:#888">{{ r.remark }}</td></tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="!rawList.length"><td colspan="15" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
</div>
`,
};

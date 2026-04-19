/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const descOpen = ref(false);

    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) { const r = window.adminUtil.getDateRange(dateRange.value); dateStart.value = r ? r.from : ''; dateEnd.value = r ? r.to : ''; }
    };
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    // 검색 필드
    const searchKw          = ref('');
    const searchType        = ref('');
    const searchStatus      = ref('');
    const searchVendorType  = ref('');
    const searchPayMethod   = ref('');
    const searchBuyConfirm  = ref('');
    const searchCloseYn     = ref('');
    const searchErpSend     = ref('');
    const searchPeriod      = ref('');
    const searchOrderStatus = ref('');
    const searchAmtFrom     = ref('');
    const searchAmtTo       = ref('');
    const searchMoreOpen    = ref(false);

    const pager    = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const orders  = computed(() => props.adminData.orders  || []);
    const claims  = computed(() => props.adminData.claims  || []);
    const vendors = computed(() => props.adminData.vendors || []);

    const PAY_METHODS = ['무통장입금','가상계좌','토스페이','카카오페이','네이버페이','핸드폰결제'];
    const PROD_NMS    = ['스탠다드 코튼 티셔츠','슬림 데님 팬츠','캐주얼 후드집업','오버핏 맨투맨','베이직 니트','린넨 셔츠','데일리 스니커즈','크로스백 미니','울 코트','레더 벨트'];
    const BRAND_NMS   = ['어반클래식','트렌드메이커','에코웨어','럭셔리룩','심플웍스'];
    const ORDER_STATUSES = { '배송중':'SHIPPING', '배송완료':'DELIVERED', '구매확정':'CONFIRMED', '취소됨':'CANCELLED', '결제완료':'PAID', '준비중':'PREPARING' };

    const rawList = computed(() => {
      const rows = [];
      orders.value.forEach((o, idx) => {
        const v = vendors.value.find(x => x.vendorId === o.vendorId);
        const isCancelled = o.status === '취소됨';
        const qty         = (idx % 3) + 1;
        const unitPrice   = Math.round((o.totalPrice || 50000) / qty);
        const discntAmt   = Math.round(unitPrice * qty * 0.05);
        const couponDiscnt = (idx % 4 === 0) ? Math.round(unitPrice * 0.1) : 0;
        const cacheUseAmt = (idx % 5 === 0) ? 5000 : 0;
        const saveSchd    = Math.round(unitPrice * qty * 0.01);
        const settleTarget = isCancelled ? 0 : Math.max(0, unitPrice * qty - discntAmt - couponDiscnt - cacheUseAmt);
        const feeRate     = 10;
        const feeAmt      = Math.round(settleTarget * feeRate / 100);
        const txDate      = o.orderDate ? o.orderDate.slice(0, 10) : '';
        const period      = txDate.slice(0, 7);
        rows.push({
          rawId: 'RAW-O-' + o.orderId.replace('ORD-', ''),
          sourceType: '주문', sourceId: o.orderId,
          txDate, vendorNm: v ? v.vendorNm : '-', vendorId: o.vendorId,
          vendorTypeCd: 'SALE',
          amount: isCancelled ? 0 : o.totalPrice,
          status: isCancelled ? '취소' : '정산대상',
          rawStatusCd: isCancelled ? 'EXCLUDED' : 'COLLECTED',
          collectYn: isCancelled ? 'N' : 'Y',
          remark: isCancelled ? '주문취소' : '',
          prodNm: PROD_NMS[idx % PROD_NMS.length],
          brandNm: BRAND_NMS[idx % BRAND_NMS.length],
          skuId: 'SKU-' + o.orderId.slice(-4) + '-01',
          normalPrice: unitPrice + Math.round(unitPrice * 0.2),
          unitPrice, qty,
          itemPrice: unitPrice * qty,
          discntAmt, couponDiscntAmt: couponDiscnt, promoDiscntAmt: 0,
          settleTargetAmt: settleTarget,
          settleFeeRate: feeRate, settleFeeAmt: feeAmt,
          settleAmt: settleTarget - feeAmt,
          settlePeriod: period,
          payMethodCd: PAY_METHODS[idx % PAY_METHODS.length],
          buyConfirmYn: ['배송완료','구매확정'].includes(o.status) ? 'Y' : 'N',
          buyConfirmDate: o.status === '구매확정' ? txDate : '',
          orderItemStatusCd: ORDER_STATUSES[o.status] || 'PAID',
          closeYn: txDate < '2026-04-01' ? 'Y' : 'N',
          closeDate: txDate < '2026-04-01' ? period + '-10' : '',
          erpSendYn: txDate < '2026-03-01' ? 'Y' : 'N',
          cacheUseAmt, mileageUseAmt: 0, voucherUseAmt: 0,
          saveSchdAmt: saveSchd, giftAmt: 0,
        });
      });
      claims.value.filter(c => ['환불완료','취소완료'].includes(c.status)).forEach((c, idx) => {
        const o = orders.value.find(x => x.orderId === c.orderId);
        const v = o ? vendors.value.find(x => x.vendorId === o.vendorId) : null;
        const refund = -(c.refundAmount || 0);
        const feeAmt = Math.round(Math.abs(refund) * 0.1);
        const txDate = c.requestDate ? c.requestDate.slice(0, 10) : '';
        rows.push({
          rawId: 'RAW-C-' + c.claimId.replace('CLM-', ''),
          sourceType: '클레임', sourceId: c.claimId,
          txDate, vendorNm: v ? v.vendorNm : '-', vendorId: o ? o.vendorId : '',
          vendorTypeCd: 'SALE',
          amount: refund,
          status: '차감',
          rawStatusCd: 'COLLECTED',
          collectYn: 'Y',
          remark: c.type + '/' + c.status,
          prodNm: PROD_NMS[(idx + 3) % PROD_NMS.length],
          brandNm: BRAND_NMS[(idx + 1) % BRAND_NMS.length],
          skuId: o ? 'SKU-' + o.orderId.slice(-4) + '-01' : '',
          normalPrice: 0, unitPrice: 0, qty: 1,
          itemPrice: refund,
          discntAmt: 0, couponDiscntAmt: 0, promoDiscntAmt: 0,
          settleTargetAmt: refund,
          settleFeeRate: 10, settleFeeAmt: -feeAmt,
          settleAmt: refund + feeAmt,
          settlePeriod: txDate.slice(0, 7),
          payMethodCd: o ? PAY_METHODS[(idx) % PAY_METHODS.length] : '-',
          buyConfirmYn: 'N', buyConfirmDate: '',
          orderItemStatusCd: 'CANCELLED',
          closeYn: txDate < '2026-04-01' ? 'Y' : 'N',
          closeDate: txDate < '2026-04-01' ? txDate.slice(0, 7) + '-10' : '',
          erpSendYn: txDate < '2026-03-01' ? 'Y' : 'N',
          cacheUseAmt: 0, mileageUseAmt: 0, voucherUseAmt: 0, saveSchdAmt: 0, giftAmt: 0,
        });
      });
      return rows.sort((a, b) => b.txDate.localeCompare(a.txDate));
    });

    const filtered = computed(() => {
      const kw = searchKw.value.trim().toLowerCase();
      const amtFrom = searchAmtFrom.value !== '' ? Number(searchAmtFrom.value) : null;
      const amtTo   = searchAmtTo.value   !== '' ? Number(searchAmtTo.value)   : null;
      return rawList.value.filter(r => {
        if (dateStart.value        && r.txDate < dateStart.value)               return false;
        if (dateEnd.value          && r.txDate > dateEnd.value)                 return false;
        if (searchType.value       && r.sourceType !== searchType.value)        return false;
        if (searchStatus.value     && r.rawStatusCd !== searchStatus.value)     return false;
        if (searchVendorType.value && r.vendorTypeCd !== searchVendorType.value) return false;
        if (searchPayMethod.value  && r.payMethodCd !== searchPayMethod.value)  return false;
        if (searchBuyConfirm.value && r.buyConfirmYn !== searchBuyConfirm.value) return false;
        if (searchCloseYn.value    && r.closeYn !== searchCloseYn.value)        return false;
        if (searchErpSend.value    && r.erpSendYn !== searchErpSend.value)      return false;
        if (searchPeriod.value     && r.settlePeriod !== searchPeriod.value)    return false;
        if (searchOrderStatus.value && r.orderItemStatusCd !== searchOrderStatus.value) return false;
        if (amtFrom !== null && r.amount < amtFrom)  return false;
        if (amtTo   !== null && r.amount > amtTo)    return false;
        if (kw && !r.rawId.toLowerCase().includes(kw) && !r.sourceId.toLowerCase().includes(kw)
               && !r.vendorNm.toLowerCase().includes(kw) && !r.prodNm.toLowerCase().includes(kw)
               && !r.brandNm.toLowerCase().includes(kw)) return false;
        return true;
      });
    });

    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value, s = Math.max(1, c-2), e = Math.min(l, s+4); return Array.from({length: e-s+1}, (_, i) => s+i); });

    const summary = computed(() => ({
      totalAmt:       filtered.value.reduce((s, r) => s + r.amount, 0),
      collectCnt:     filtered.value.filter(r => r.collectYn === 'Y').length,
      settleAmt:      filtered.value.reduce((s, r) => s + r.settleAmt, 0),
      feeAmt:         filtered.value.reduce((s, r) => s + r.settleFeeAmt, 0),
      closeCnt:       filtered.value.filter(r => r.closeYn === 'Y').length,
      erpCnt:         filtered.value.filter(r => r.erpSendYn === 'Y').length,
      confirmCnt:     filtered.value.filter(r => r.buyConfirmYn === 'Y').length,
    }));

    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => {
      searchKw.value = ''; searchType.value = ''; searchStatus.value = '';
      searchVendorType.value = ''; searchPayMethod.value = ''; searchBuyConfirm.value = '';
      searchCloseYn.value = ''; searchErpSend.value = ''; searchPeriod.value = '';
      searchOrderStatus.value = ''; searchAmtFrom.value = ''; searchAmtTo.value = '';
      dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1;
    };

    const expandedRows = reactive(new Set());
    const toggleRow = id => {
      if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id);
    };
    const isExpanded = id => expandedRows.has(id);

    const statusBadge = s => ({ '정산대상':'badge-blue', '차감':'badge-red', '취소':'badge-gray' }[s] || 'badge-gray');
    const rawStatusLabel = cd => ({ 'COLLECTED':'수집완료', 'EXCLUDED':'제외', 'SETTLED':'정산완료', 'PENDING':'대기' }[cd] || cd);
    const rawStatusBadge = cd => ({ 'COLLECTED':'badge-green', 'EXCLUDED':'badge-gray', 'SETTLED':'badge-blue', 'PENDING':'badge-orange' }[cd] || 'badge-gray');
    const vendorTypeLabel = cd => ({ 'SALE':'판매', 'DLIV':'배송', 'EXTERNAL':'외부' }[cd] || cd);
    const orderStatusLabel = cd => ({ 'SHIPPING':'배송중','DELIVERED':'배송완료','CONFIRMED':'구매확정','CANCELLED':'취소','PAID':'결제완료','PREPARING':'준비중','ORDERED':'주문완료' }[cd] || cd);
    const fmtW = n => Number(n || 0).toLocaleString() + '원';
    const fmtPct = n => (n || 0) + '%';

    const doCollect = () => props.showToast('정산 데이터를 재수집합니다.', 'info');

    return {
      descOpen, searchMoreOpen,
      DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange,
      searchKw, searchType, searchStatus,
      searchVendorType, searchPayMethod, searchBuyConfirm,
      searchCloseYn, searchErpSend, searchPeriod, searchOrderStatus,
      searchAmtFrom, searchAmtTo,
      pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, summary,
      setPage, onSizeChange, onSearch, onReset,
      expandedRows, toggleRow, isExpanded,
      statusBadge, rawStatusLabel, rawStatusBadge, vendorTypeLabel, orderStatusLabel,
      fmtW, fmtPct, doCollect,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">정산수집원장</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다.
• 수집 단위: od_order_item / od_claim_item (상품 행 단위)
• [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다.
• 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)</div>
  </div>

  <!-- ── 검색 카드 ── -->
  <div class="card">
    <!-- 1행: 기간 + 기본 필터 -->
    <div class="search-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchType" style="width:100px">
        <option value="">유형 전체</option><option>주문</option><option>클레임</option>
      </select>
      <select v-model="searchStatus" style="width:110px">
        <option value="">수집상태 전체</option>
        <option value="COLLECTED">수집완료</option>
        <option value="EXCLUDED">제외</option>
        <option value="SETTLED">정산완료</option>
        <option value="PENDING">대기</option>
      </select>
      <input v-model="searchKw" placeholder="원장ID / 소스ID / 업체명 / 상품명 / 브랜드" style="width:230px" @keyup.enter="onSearch" />
    </div>
    <!-- 2행: 추가 필터 -->
    <div class="search-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">
      <select v-model="searchVendorType" style="width:110px">
        <option value="">업체구분 전체</option>
        <option value="SALE">판매업체</option>
        <option value="DLIV">배송업체</option>
        <option value="EXTERNAL">외부업체</option>
      </select>
      <select v-model="searchPayMethod" style="width:120px">
        <option value="">결제수단 전체</option>
        <option value="무통장입금">무통장입금</option>
        <option value="가상계좌">가상계좌</option>
        <option value="토스페이">토스페이</option>
        <option value="카카오페이">카카오페이</option>
        <option value="네이버페이">네이버페이</option>
        <option value="핸드폰결제">핸드폰결제</option>
      </select>
      <select v-model="searchBuyConfirm" style="width:110px">
        <option value="">구매확정 전체</option>
        <option value="Y">확정</option>
        <option value="N">미확정</option>
      </select>
      <select v-model="searchCloseYn" style="width:110px">
        <option value="">마감여부 전체</option>
        <option value="Y">마감완료</option>
        <option value="N">미마감</option>
      </select>
      <select v-model="searchErpSend" style="width:110px">
        <option value="">ERP전송 전체</option>
        <option value="Y">전송완료</option>
        <option value="N">미전송</option>
      </select>
      <input v-model="searchPeriod" placeholder="정산기간(YYYY-MM)" style="width:150px" maxlength="7" />
      <div class="search-actions" style="margin-left:auto">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
        <button class="btn btn-secondary btn-sm" @click="searchMoreOpen=!searchMoreOpen" style="min-width:70px">
          {{ searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </div>
    </div>
    <!-- 3행: 상세검색 펼치기 -->
    <div v-if="searchMoreOpen" class="search-bar" style="flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px solid #f0f0f0">
      <select v-model="searchOrderStatus" style="width:120px">
        <option value="">주문상태 전체</option>
        <option value="ORDERED">주문완료</option>
        <option value="PAID">결제완료</option>
        <option value="PREPARING">준비중</option>
        <option value="SHIPPING">배송중</option>
        <option value="DELIVERED">배송완료</option>
        <option value="CONFIRMED">구매확정</option>
        <option value="CANCELLED">취소</option>
      </select>
      <span style="line-height:32px;font-size:12px;color:#888">수집금액</span>
      <input v-model="searchAmtFrom" type="number" placeholder="최솟값(원)" style="width:120px" />
      <span style="line-height:32px">~</span>
      <input v-model="searchAmtTo" type="number" placeholder="최댓값(원)" style="width:120px" />
    </div>
  </div>

  <!-- ── 집계 카드 ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr) repeat(3,1fr);gap:8px;margin-bottom:12px">
    <div class="card" style="text-align:center;padding:10px;background:#f0f4ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">수집건수</div>
      <div style="font-size:18px;font-weight:700;color:#3498db">{{ total.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0fff4;margin-bottom:0">
      <div style="font-size:11px;color:#888">정산대상</div>
      <div style="font-size:18px;font-weight:700;color:#27ae60">{{ summary.collectCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff8f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">구매확정</div>
      <div style="font-size:18px;font-weight:700;color:#e67e22">{{ summary.confirmCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f5f0ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">마감완료</div>
      <div style="font-size:18px;font-weight:700;color:#8e44ad">{{ summary.closeCnt.toLocaleString() }}건</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f8f9fa;margin-bottom:0">
      <div style="font-size:11px;color:#888">수집금액 합계</div>
      <div style="font-size:15px;font-weight:700" :style="summary.totalAmt>=0?'color:#333':'color:#e74c3c'">{{ fmtW(summary.totalAmt) }}</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#fff0f0;margin-bottom:0">
      <div style="font-size:11px;color:#888">수수료 합계</div>
      <div style="font-size:15px;font-weight:700;color:#e74c3c">{{ fmtW(summary.feeAmt) }}</div>
    </div>
    <div class="card" style="text-align:center;padding:10px;background:#f0f8ff;margin-bottom:0">
      <div style="font-size:11px;color:#888">정산금액 합계</div>
      <div style="font-size:15px;font-weight:700;color:#2980b9">{{ fmtW(summary.settleAmt) }}</div>
    </div>
  </div>

  <!-- ── 목록 카드 ── -->
  <div class="card">
    <div class="toolbar">
      <span class="list-count">총 {{ total.toLocaleString() }}건</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn-secondary btn-sm" @click="() => { pageList.forEach(r => { if(!isExpanded(r.rawId)) toggleRow(r.rawId); }) }">▼ 전체펼치기</button>
        <button class="btn btn-secondary btn-sm" @click="() => { pageList.forEach(r => { if(isExpanded(r.rawId)) toggleRow(r.rawId); }) }">▲ 전체접기</button>
        <button class="btn btn-blue btn-sm" @click="doCollect">🔄 재수집</button>
      </div>
    </div>
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width:30px"></th>
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
        <template v-for="r in pageList" :key="r.rawId">
          <!-- 기본 행 -->
          <tr :style="isExpanded(r.rawId) ? 'background:#fafbff' : ''" style="cursor:pointer" @click="toggleRow(r.rawId)">
            <td style="text-align:center;color:#aaa;font-size:11px;user-select:none">
              {{ isExpanded(r.rawId) ? '▲' : '▼' }}
            </td>
            <td style="font-size:12px;color:#555">{{ r.rawId }}</td>
            <td>{{ r.txDate }}</td>
            <td><span class="badge" :class="r.sourceType==='주문'?'badge-blue':'badge-orange'">{{ r.sourceType }}</span></td>
            <td style="font-size:12px;color:#555">{{ r.sourceId }}</td>
            <td>
              <div>{{ r.vendorNm }}</div>
              <div style="font-size:11px;color:#aaa">{{ vendorTypeLabel(r.vendorTypeCd) }}</div>
            </td>
            <td>
              <div style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.prodNm }}</div>
              <div style="font-size:11px;color:#aaa">{{ r.brandNm }}</div>
            </td>
            <td style="text-align:right">{{ (r.qty||0).toLocaleString() }}</td>
            <td style="text-align:right;font-weight:600" :style="r.settleTargetAmt<0?'color:#e74c3c':''">{{ fmtW(r.settleTargetAmt) }}</td>
            <td style="text-align:right;color:#e74c3c">{{ fmtW(r.settleFeeAmt) }}</td>
            <td style="text-align:right;font-weight:700" :style="r.settleAmt<0?'color:#e74c3c':'color:#2980b9'">{{ fmtW(r.settleAmt) }}</td>
            <td><span class="badge" :class="rawStatusBadge(r.rawStatusCd)">{{ rawStatusLabel(r.rawStatusCd) }}</span></td>
            <td><span class="badge" :class="r.closeYn==='Y'?'badge-purple':'badge-gray'">{{ r.closeYn==='Y'?'마감':'미마감' }}</span></td>
            <td><span class="badge" :class="r.erpSendYn==='Y'?'badge-green':'badge-gray'">{{ r.erpSendYn==='Y'?'전송':'미전송' }}</span></td>
          </tr>
          <!-- 펼침 상세 행 -->
          <tr v-if="isExpanded(r.rawId)">
            <td colspan="14" style="background:#f4f6fb;padding:12px 20px;border-top:none">
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:12px">
                <!-- 주문정보 -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">주문 정보</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">소스ID</td><td style="padding:2px 0">{{ r.sourceId }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">거래일자</td><td>{{ r.txDate }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">주문상태</td><td>{{ orderStatusLabel(r.orderItemStatusCd) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">결제수단</td><td>{{ r.payMethodCd }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">구매확정</td><td>
                      <span class="badge" :class="r.buyConfirmYn==='Y'?'badge-green':'badge-gray'">{{ r.buyConfirmYn==='Y'?'확정':'미확정' }}</span>
                      <span v-if="r.buyConfirmDate" style="color:#888;margin-left:4px">{{ r.buyConfirmDate }}</span>
                    </td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정산기간</td><td>{{ r.settlePeriod }}</td></tr>
                  </table>
                </div>
                <!-- 상품/가격 정보 -->
                <div>
                  <div style="font-weight:700;color:#e91e8c;margin-bottom:6px;border-bottom:1px solid #f0c0d0;padding-bottom:3px">상품 · 가격</div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">상품명</td><td>{{ r.prodNm }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">브랜드</td><td>{{ r.brandNm }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">SKU ID</td><td style="font-size:11px;color:#888">{{ r.skuId }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">정상가</td><td>{{ fmtW(r.normalPrice) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">단가</td><td>{{ fmtW(r.unitPrice) }}</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">수량</td><td>{{ (r.qty||0).toLocaleString() }}개</td></tr>
                    <tr><td style="color:#888;padding:2px 4px 2px 0;white-space:nowrap">소계</td><td style="font-weight:600">{{ fmtW(r.itemPrice) }}</td></tr>
                  </table>
                </div>
                <!-- 할인/혜택 -->
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
                <!-- 정산/마감/ERP -->
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
        <tr v-if="!pageList.length"><td colspan="14" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
</div>
`,
};

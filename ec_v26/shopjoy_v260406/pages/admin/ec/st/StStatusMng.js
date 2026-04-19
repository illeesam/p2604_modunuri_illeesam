/* ShopJoy Admin - 정산현황 (업체별/주문별/클레임별/프로모션별/정산별) */
window.StStatusMng = {
  name: 'StStatusMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const descOpen = ref(false);

    /* ── 탭 ── */
    const activeTab = ref('vendor');
    const TABS = [
      { id: 'vendor',    label: '업체별현황' },
      { id: 'order',     label: '주문별현황' },
      { id: 'claim',     label: '클레임별현황' },
      { id: 'promo',     label: '프로모션별현황' },
      { id: 'settle',    label: '정산별현황' },
    ];

    /* ── 공통 날짜 필터 ── */
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) {
        const r = window.adminUtil.getDateRange(dateRange.value);
        dateStart.value = r ? r.from : '';
        dateEnd.value   = r ? r.to   : '';
      }
    };
    /* 초기 날짜 설정 */
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    /* ── 원본 데이터 ── */
    const orders   = computed(() => props.adminData.orders   || []);
    const claims   = computed(() => props.adminData.claims   || []);
    const vendors  = computed(() => (props.adminData.vendors || []).filter(v => v.vendorType === '판매업체'));
    const coupons  = computed(() => props.adminData.coupons  || []);
    const cacheList= computed(() => props.adminData.cacheList || []);

    const COMM_RATE = 0.10; // 수수료율 10%

    const inRange = (dateStr) => {
      const d = String(dateStr || '').slice(0, 10);
      if (dateStart.value && d < dateStart.value) return false;
      if (dateEnd.value   && d > dateEnd.value)   return false;
      return true;
    };

    /* ════════════════════════════════════════════════
     * 1. 업체별현황
     * ════════════════════════════════════════════════ */
    const vendorSearchKw  = ref('');
    const vendorPager     = reactive({ page: 1, size: 10 });

    const vendorRows = computed(() => {
      const filteredOrders = orders.value.filter(o => inRange(o.orderDate) && o.status !== '취소됨');
      return vendors.value.map(v => {
        const vOrders = filteredOrders.filter(o => o.vendorId === v.vendorId);
        const sales   = vOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const refund  = claims.value
          .filter(c => inRange(c.requestDate) && ['환불완료','취소완료'].includes(c.status))
          .filter(c => { const o = orders.value.find(x => x.orderId === c.orderId); return o && o.vendorId === v.vendorId; })
          .reduce((s, c) => s + (c.refundAmount || 0), 0);
        const netSales = sales - refund;
        const comm     = Math.round(netSales * COMM_RATE);
        return { vendorId: v.vendorId, vendorNm: v.vendorNm, orderCnt: vOrders.length, sales, refund, netSales, comm, settle: netSales - comm };
      }).filter(r => !vendorSearchKw.value || r.vendorNm.includes(vendorSearchKw.value));
    });
    const vendorTotal = computed(() => vendorRows.value.length);
    const vendorPages = computed(() => Math.max(1, Math.ceil(vendorTotal.value / vendorPager.size)));
    const vendorPageList = computed(() => vendorRows.value.slice((vendorPager.page - 1) * vendorPager.size, vendorPager.page * vendorPager.size));
    const vendorSummary  = computed(() => vendorRows.value.reduce((a, r) => ({ sales: a.sales + r.sales, refund: a.refund + r.refund, comm: a.comm + r.comm, settle: a.settle + r.settle }), { sales: 0, refund: 0, comm: 0, settle: 0 }));

    /* ════════════════════════════════════════════════
     * 2. 주문별현황
     * ════════════════════════════════════════════════ */
    const orderSearchKw  = ref('');
    const orderSearchStatus = ref('');
    const orderPager     = reactive({ page: 1, size: 10 });

    const orderRows = computed(() => {
      const kw = orderSearchKw.value.trim().toLowerCase();
      return orders.value.filter(o => {
        if (!inRange(o.orderDate)) return false;
        if (orderSearchStatus.value && o.status !== orderSearchStatus.value) return false;
        if (kw && !o.orderId.toLowerCase().includes(kw) && !o.userNm.toLowerCase().includes(kw) && !o.prodNm.toLowerCase().includes(kw)) return false;
        return true;
      }).map(o => {
        const vendor = vendors.value.find(v => v.vendorId === o.vendorId);
        const isCancelled = o.status === '취소됨';
        const comm   = isCancelled ? 0 : Math.round((o.totalPrice || 0) * COMM_RATE);
        const settle = isCancelled ? 0 : (o.totalPrice || 0) - comm;
        return { ...o, vendorNm: vendor ? vendor.vendorNm : '-', comm, settle, isCancelled };
      });
    });
    const orderTotal = computed(() => orderRows.value.length);
    const orderPages = computed(() => Math.max(1, Math.ceil(orderTotal.value / orderPager.size)));
    const orderPageList = computed(() => orderRows.value.slice((orderPager.page - 1) * orderPager.size, orderPager.page * orderPager.size));
    const orderSummary  = computed(() => {
      const valid = orderRows.value.filter(r => !r.isCancelled);
      return { cnt: valid.length, sales: valid.reduce((s, r) => s + r.totalPrice, 0), comm: valid.reduce((s, r) => s + r.comm, 0), settle: valid.reduce((s, r) => s + r.settle, 0) };
    });

    /* ════════════════════════════════════════════════
     * 3. 클레임별현황
     * ════════════════════════════════════════════════ */
    const claimSearchType   = ref('');
    const claimSearchStatus = ref('');
    const claimPager        = reactive({ page: 1, size: 10 });

    const claimRows = computed(() => {
      return claims.value.filter(c => {
        if (!inRange(c.requestDate)) return false;
        if (claimSearchType.value   && c.type   !== claimSearchType.value)   return false;
        if (claimSearchStatus.value && c.status !== claimSearchStatus.value) return false;
        return true;
      }).map(c => {
        const isCompleted = ['환불완료','취소완료','교환완료'].includes(c.status);
        const settleImpact = ['환불완료','취소완료'].includes(c.status) ? -(c.refundAmount || 0) : 0;
        return { ...c, isCompleted, settleImpact };
      });
    });
    const claimTotal = computed(() => claimRows.value.length);
    const claimPages = computed(() => Math.max(1, Math.ceil(claimTotal.value / claimPager.size)));
    const claimPageList = computed(() => claimRows.value.slice((claimPager.page - 1) * claimPager.size, claimPager.page * claimPager.size));
    const claimSummary  = computed(() => ({
      cnt:     claimRows.value.length,
      refund:  claimRows.value.reduce((s, r) => s + (r.refundAmount || 0), 0),
      impact:  claimRows.value.reduce((s, r) => s + r.settleImpact, 0),
      cancel:  claimRows.value.filter(r => r.type === '취소').length,
      return_: claimRows.value.filter(r => r.type === '반품').length,
      exchange:claimRows.value.filter(r => r.type === '교환').length,
    }));

    /* ════════════════════════════════════════════════
     * 4. 프로모션별현황
     * ════════════════════════════════════════════════ */
    const promoSearchKw   = ref('');
    const promoSearchType = ref('');
    const promoPager      = reactive({ page: 1, size: 10 });

    const promoRows = computed(() => {
      const kw = promoSearchKw.value.trim().toLowerCase();
      const couponRows = coupons.value.map(c => {
        const discountAmt = c.discountType === 'amount' ? c.discountValue * c.useCount
          : c.discountType === 'rate' ? Math.round(50000 * (c.discountValue / 100) * c.useCount) // 평균 주문금액 가정
          : 3000 * c.useCount;
        return {
          promoId: 'CPN-' + c.couponId, promoType: '쿠폰', promoNm: c.name,
          issueCnt: c.issueCount, useCnt: c.useCount,
          discountAmt, status: c.status,
          period: `~${c.expiry}`,
        };
      });
      const cacheRows = [
        { promoId: 'CCH-001', promoType: '캐쉬', promoNm: '캐쉬 사용 합산', issueCnt: cacheList.value.filter(x => x.type==='충전').length, useCnt: cacheList.value.filter(x => x.type==='사용').length, discountAmt: cacheList.value.filter(x => x.type==='사용').reduce((s,x) => s + Math.abs(x.amount), 0), status: '진행중', period: '상시' },
      ];
      const allRows = [...couponRows, ...cacheRows];
      return allRows.filter(r => {
        if (promoSearchType.value && r.promoType !== promoSearchType.value) return false;
        if (kw && !r.promoNm.toLowerCase().includes(kw) && !r.promoType.toLowerCase().includes(kw)) return false;
        return true;
      });
    });
    const promoTotal    = computed(() => promoRows.value.length);
    const promoPages    = computed(() => Math.max(1, Math.ceil(promoTotal.value / promoPager.size)));
    const promoPageList = computed(() => promoRows.value.slice((promoPager.page - 1) * promoPager.size, promoPager.page * promoPager.size));
    const promoSummary  = computed(() => ({
      cnt:      promoRows.value.length,
      totalUse: promoRows.value.reduce((s, r) => s + r.useCnt, 0),
      totalDiscount: promoRows.value.reduce((s, r) => s + r.discountAmt, 0),
    }));

    /* ════════════════════════════════════════════════
     * 5. 정산별현황 (월별 요약)
     * ════════════════════════════════════════════════ */
    const settleSearchMonth = ref('');
    const settlePager       = reactive({ page: 1, size: 10 });

    const settleRows = computed(() => {
      const monthMap = {};
      orders.value.forEach(o => {
        const m = String(o.orderDate || '').slice(0, 7);
        if (!m) return;
        if (!monthMap[m]) monthMap[m] = { month: m, orderCnt: 0, sales: 0, refund: 0, commAmt: 0, promoAmt: 0 };
        if (o.status !== '취소됨') { monthMap[m].orderCnt++; monthMap[m].sales += o.totalPrice || 0; }
      });
      claims.value.forEach(c => {
        const m = String(c.requestDate || '').slice(0, 7);
        if (m && monthMap[m] && ['환불완료','취소완료'].includes(c.status)) monthMap[m].refund += c.refundAmount || 0;
      });
      return Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month)).map(r => {
        const net  = r.sales - r.refund;
        const comm = Math.round(net * COMM_RATE);
        const promo = Math.round(net * 0.03); // 프로모션 비용 가정 3%
        const settle = net - comm - promo;
        return { ...r, net, comm, promo, settle, statusCd: settle > 0 ? '정산예정' : '마감' };
      }).filter(r => !settleSearchMonth.value || r.month.includes(settleSearchMonth.value));
    });
    const settleTotal    = computed(() => settleRows.value.length);
    const settlePages    = computed(() => Math.max(1, Math.ceil(settleTotal.value / settlePager.size)));
    const settlePageList = computed(() => settleRows.value.slice((settlePager.page - 1) * settlePager.size, settlePager.page * settlePager.size));
    const settleSummary  = computed(() => settleRows.value.reduce((a, r) => ({ sales: a.sales + r.sales, refund: a.refund + r.refund, comm: a.comm + r.comm, settle: a.settle + r.settle }), { sales: 0, refund: 0, comm: 0, settle: 0 }));

    /* ── 공통 유틸 ── */
    const fmt  = n => Number(n || 0).toLocaleString();
    const fmtW = n => Number(n || 0).toLocaleString() + '원';
    const statusBadge = s => ({
      '완료':'badge-green', '정산예정':'badge-blue', '마감':'badge-gray',
      '취소완료':'badge-red', '환불완료':'badge-red', '교환완료':'badge-purple',
      '활성':'badge-green', '만료':'badge-gray', '진행중':'badge-blue',
    }[s] || 'badge-gray');
    const typeBadge = t => ({ '취소':'badge-red', '반품':'badge-orange', '교환':'badge-purple' }[t] || 'badge-gray');

    const onSearch = () => { vendorPager.page = 1; orderPager.page = 1; claimPager.page = 1; promoPager.page = 1; settlePager.page = 1; };
    const onReset  = () => {
      vendorSearchKw.value = ''; orderSearchKw.value = ''; orderSearchStatus.value = '';
      claimSearchType.value = ''; claimSearchStatus.value = ''; promoSearchKw.value = ''; promoSearchType.value = ''; settleSearchMonth.value = '';
      onSearch();
    };

    const pageNums = (cur, last) => { const s = Math.max(1, cur-2), e = Math.min(last, s+4); return Array.from({length: e-s+1}, (_,i) => s+i); };

    const setVendorPage = n => { if (n >= 1 && n <= vendorPages.value) vendorPager.page = n; };
    const onVendorSizeChange = () => { vendorPager.page = 1; };
    const setOrderPage = n => { if (n >= 1 && n <= orderPages.value) orderPager.page = n; };
    const onOrderSizeChange = () => { orderPager.page = 1; };
    const setClaimPage = n => { if (n >= 1 && n <= claimPages.value) claimPager.page = n; };
    const onClaimSizeChange = () => { claimPager.page = 1; };
    const setPromoPage = n => { if (n >= 1 && n <= promoPages.value) promoPager.page = n; };
    const onPromoSizeChange = () => { promoPager.page = 1; };
    const setSettlePage = n => { if (n >= 1 && n <= settlePages.value) settlePager.page = n; };
    const onSettleSizeChange = () => { settlePager.page = 1; };

    const exportTab = () => {
      const tab = TABS.find(t => t.id === activeTab.value);
      props.showToast && props.showToast(`${tab.label} 데이터를 Excel로 내보냅니다.`, 'info');
    };

    return {
      activeTab, TABS,
      DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange,
      /* vendor */ vendorSearchKw, vendorPager, vendorRows, vendorTotal, vendorPages, vendorPageList, vendorSummary,
      /* order  */ orderSearchKw, orderSearchStatus, orderPager, orderRows, orderTotal, orderPages, orderPageList, orderSummary,
      /* claim  */ claimSearchType, claimSearchStatus, claimPager, claimRows, claimTotal, claimPages, claimPageList, claimSummary,
      /* promo  */ promoSearchKw, promoSearchType, promoPager, promoRows, promoTotal, promoPages, promoPageList, promoSummary,
      /* settle */ settleSearchMonth, settlePager, settleRows, settleTotal, settlePages, settlePageList, settleSummary,
      descOpen, fmt, fmtW, statusBadge, typeBadge, onSearch, onReset, pageNums, exportTab, COMM_RATE,
      PAGE_SIZES,
      setVendorPage, onVendorSizeChange,
      setOrderPage, onOrderSizeChange,
      setClaimPage, onClaimSizeChange,
      setPromoPage, onPromoSizeChange,
      setSettlePage, onSettleSizeChange,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">정산현황</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">업체별·기간별 정산 진행 현황을 집계 탭으로 조회합니다. 수집~지급 전 단계 금액과 건수를 확인할 수 있습니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 탭 구성: 업체별 / 주문별 / 클레임별 / 프로모션별 / 정산집계
• 업체별 탭: 매출·환불·순매출·수수료·정산예정액 집계
• 정산집계 탭: 마감 기준 월별 최종 정산액 목록
• CSV 내보내기를 지원합니다.</div>
  </div>

  <!-- 공통 날짜 필터 -->
  <div class="card" style="margin-bottom:12px">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="dateEnd"   style="width:140px" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
        <button class="btn btn-secondary" @click="exportTab">📥 Excel</button>
      </div>
    </div>
  </div>

  <!-- 탭 -->
  <div class="tab-bar-row" style="margin-bottom:0">
    <div class="tab-nav">
      <button v-for="t in TABS" :key="t.id" class="tab-btn" :class="{active: activeTab===t.id}" @click="activeTab=t.id">{{ t.label }}</button>
    </div>
  </div>

  <!-- ══ 1. 업체별현황 ══ -->
  <div v-if="activeTab==='vendor'" class="card" style="border-radius:0 8px 8px 8px">
    <!-- 요약 카드 -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 매출</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(vendorSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">환불액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(vendorSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 (10%)</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(vendorSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산예정액</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(vendorSummary.settle) }}</div>
      </div>
    </div>
    <!-- 검색 -->
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="vendorSearchKw" placeholder="업체명 검색" style="width:200px" @keyup.enter="onSearch" />
    </div>
    <!-- 테이블 -->
    <div class="toolbar"><span class="list-count">총 {{ vendorTotal }}개 업체</span></div>
    <table class="admin-table">
      <thead><tr>
        <th>업체명</th><th>주문건수</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료(10%)</th><th>정산예정액</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in vendorPageList" :key="r.vendorId">
          <td><strong>{{ r.vendorNm }}</strong></td>
          <td>{{ r.orderCnt }}건</td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ r.refund > 0 ? '-'+fmtW(r.refund) : '-' }}</td>
          <td><strong>{{ fmtW(r.netSales) }}</strong></td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#27ae60;font-weight:700">{{ fmtW(r.settle) }}</td>
        </tr>
        <tr v-if="!vendorPageList.length"><td colspan="7" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="vendorPager.page===1" @click="setVendorPage(1)">«</button>
           <button :disabled="vendorPager.page===1" @click="setVendorPage(vendorPager.page-1)">‹</button>
           <button v-for="n in pageNums(vendorPager.page,vendorPages)" :key="n" :class="{active:vendorPager.page===n}" @click="setVendorPage(n)">{{ n }}</button>
           <button :disabled="vendorPager.page===vendorPages" @click="setVendorPage(vendorPager.page+1)">›</button>
           <button :disabled="vendorPager.page===vendorPages" @click="setVendorPage(vendorPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="vendorPager.size" @change="onVendorSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- ══ 2. 주문별현황 ══ -->
  <div v-if="activeTab==='order'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">유효 주문수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ orderSummary.cnt }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0f4ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">주문 매출</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ fmtW(orderSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 합계</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(orderSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산 합계</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(orderSummary.settle) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="orderSearchKw" placeholder="주문ID / 고객명 / 상품명" style="width:220px" @keyup.enter="onSearch" />
      <select v-model="orderSearchStatus" style="width:130px">
        <option value="">상태 전체</option>
        <option>주문완료</option><option>결제완료</option><option>배송준비중</option>
        <option>배송중</option><option>배송완료</option><option>완료</option><option>취소됨</option>
      </select>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ orderTotal }}건</span></div>
    <table class="admin-table">
      <thead><tr>
        <th>주문ID</th><th>주문일시</th><th>고객명</th><th>업체</th><th>상품명</th><th>결제금액</th><th>수수료</th><th>정산액</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in orderPageList" :key="r.orderId" :style="r.isCancelled ? 'color:#bbb' : ''">
          <td>{{ r.orderId }}</td>
          <td>{{ r.orderDate }}</td>
          <td>{{ r.userNm }}</td>
          <td>{{ r.vendorNm }}</td>
          <td>{{ r.prodNm }}</td>
          <td>{{ fmtW(r.totalPrice) }}</td>
          <td style="color:#e67e22">{{ r.isCancelled ? '-' : fmtW(r.comm) }}</td>
          <td style="font-weight:700" :style="r.isCancelled ? 'color:#bbb' : 'color:#27ae60'">{{ r.isCancelled ? '-' : fmtW(r.settle) }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!orderPageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="orderPager.page===1" @click="setOrderPage(1)">«</button>
           <button :disabled="orderPager.page===1" @click="setOrderPage(orderPager.page-1)">‹</button>
           <button v-for="n in pageNums(orderPager.page,orderPages)" :key="n" :class="{active:orderPager.page===n}" @click="setOrderPage(n)">{{ n }}</button>
           <button :disabled="orderPager.page===orderPages" @click="setOrderPage(orderPager.page+1)">›</button>
           <button :disabled="orderPager.page===orderPages" @click="setOrderPage(orderPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="orderPager.size" @change="onOrderSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- ══ 3. 클레임별현황 ══ -->
  <div v-if="activeTab==='claim'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">클레임 건수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ claimSummary.cnt }}건</div>
        <div style="font-size:11px;color:#999;margin-top:4px">취소 {{ claimSummary.cancel }} / 반품 {{ claimSummary.return_ }} / 교환 {{ claimSummary.exchange }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">환불요청액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(claimSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff0f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산 차감액</div>
        <div style="font-size:18px;font-weight:700;color:#c0392b">{{ fmtW(Math.abs(claimSummary.impact)) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0f4ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">처리율</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ claimSummary.cnt > 0 ? Math.round(claimRows.filter(r=>r.isCompleted).length / claimSummary.cnt * 100) : 0 }}%</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <select v-model="claimSearchType" style="width:120px">
        <option value="">유형 전체</option><option>취소</option><option>반품</option><option>교환</option>
      </select>
      <select v-model="claimSearchStatus" style="width:140px">
        <option value="">상태 전체</option>
        <option>취소요청</option><option>취소처리중</option><option>취소완료</option>
        <option>반품요청</option><option>수거예정</option><option>수거중</option><option>수거완료</option><option>환불처리중</option><option>환불완료</option>
        <option>교환요청</option><option>발송완료</option><option>교환완료</option>
      </select>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ claimTotal }}건</span></div>
    <table class="admin-table">
      <thead><tr>
        <th>클레임ID</th><th>요청일시</th><th>고객명</th><th>주문ID</th><th>상품명</th><th>유형</th><th>사유</th><th>환불액</th><th>정산차감</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in claimPageList" :key="r.claimId">
          <td>{{ r.claimId }}</td>
          <td>{{ r.requestDate }}</td>
          <td>{{ r.userNm }}</td>
          <td>{{ r.orderId }}</td>
          <td>{{ r.prodNm }}</td>
          <td><span class="badge" :class="typeBadge(r.type)">{{ r.type }}</span></td>
          <td>{{ r.reason }}</td>
          <td>{{ r.refundAmount > 0 ? fmtW(r.refundAmount) : '-' }}</td>
          <td style="color:#e74c3c;font-weight:700">{{ r.settleImpact < 0 ? '-'+fmtW(Math.abs(r.settleImpact)) : '-' }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!claimPageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="claimPager.page===1" @click="setClaimPage(1)">«</button>
           <button :disabled="claimPager.page===1" @click="setClaimPage(claimPager.page-1)">‹</button>
           <button v-for="n in pageNums(claimPager.page,claimPages)" :key="n" :class="{active:claimPager.page===n}" @click="setClaimPage(n)">{{ n }}</button>
           <button :disabled="claimPager.page===claimPages" @click="setClaimPage(claimPager.page+1)">›</button>
           <button :disabled="claimPager.page===claimPages" @click="setClaimPage(claimPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="claimPager.size" @change="onClaimSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- ══ 4. 프로모션별현황 ══ -->
  <div v-if="activeTab==='promo'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">프로모션 수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ promoSummary.cnt }}개</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fdf5ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 사용건수</div>
        <div style="font-size:18px;font-weight:700;color:#9b59b6">{{ promoSummary.totalUse }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 할인/지원액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(promoSummary.totalDiscount) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <select v-model="promoSearchType" style="width:110px">
        <option value="">유형 전체</option>
        <option>쿠폰</option>
        <option>캐쉬</option>
      </select>
      <input v-model="promoSearchKw" placeholder="프로모션명 검색" style="width:180px" @keyup.enter="onSearch" />
    </div>
    <div class="toolbar"><span class="list-count">총 {{ promoTotal }}개</span></div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>유형</th><th>프로모션명</th><th>발급/충전수</th><th>사용건수</th><th>할인/지원액</th><th>기간</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in promoPageList" :key="r.promoId">
          <td>{{ r.promoId }}</td>
          <td><span class="badge badge-blue">{{ r.promoType }}</span></td>
          <td>{{ r.promoNm }}</td>
          <td>{{ fmt(r.issueCnt) }}</td>
          <td>{{ fmt(r.useCnt) }}</td>
          <td style="color:#e74c3c;font-weight:700">{{ fmtW(r.discountAmt) }}</td>
          <td style="font-size:12px;color:#888">{{ r.period }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!promoPageList.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="promoPager.page===1" @click="setPromoPage(1)">«</button>
           <button :disabled="promoPager.page===1" @click="setPromoPage(promoPager.page-1)">‹</button>
           <button v-for="n in pageNums(promoPager.page,promoPages)" :key="n" :class="{active:promoPager.page===n}" @click="setPromoPage(n)">{{ n }}</button>
           <button :disabled="promoPager.page===promoPages" @click="setPromoPage(promoPager.page+1)">›</button>
           <button :disabled="promoPager.page===promoPages" @click="setPromoPage(promoPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="promoPager.size" @change="onPromoSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>

  <!-- ══ 5. 정산별현황 ══ -->
  <div v-if="activeTab==='settle'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 매출</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(settleSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 환불</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(settleSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 합계</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(settleSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">순 정산액</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(settleSummary.settle) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="settleSearchMonth" placeholder="월 검색 (예: 2026-04)" style="width:180px" @keyup.enter="onSearch" />
    </div>
    <div class="toolbar"><span class="list-count">총 {{ settleTotal }}개월</span></div>
    <table class="admin-table">
      <thead><tr>
        <th>정산월</th><th>주문건수</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료(10%)</th><th>프로모션비(3%)</th><th>순정산액</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in settlePageList" :key="r.month">
          <td><strong>{{ r.month }}</strong></td>
          <td>{{ r.orderCnt }}건</td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ r.refund > 0 ? '-'+fmtW(r.refund) : '-' }}</td>
          <td><strong>{{ fmtW(r.net) }}</strong></td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#9b59b6">{{ fmtW(r.promo) }}</td>
          <td style="font-weight:700" :style="r.settle >= 0 ? 'color:#27ae60' : 'color:#e74c3c'">{{ fmtW(r.settle) }}</td>
          <td><span class="badge" :class="statusBadge(r.statusCd)">{{ r.statusCd }}</span></td>
        </tr>
        <tr v-if="!settlePageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="settlePager.page===1" @click="setSettlePage(1)">«</button>
           <button :disabled="settlePager.page===1" @click="setSettlePage(settlePager.page-1)">‹</button>
           <button v-for="n in pageNums(settlePager.page,settlePages)" :key="n" :class="{active:settlePager.page===n}" @click="setSettlePage(n)">{{ n }}</button>
           <button :disabled="settlePager.page===settlePages" @click="setSettlePage(settlePager.page+1)">›</button>
           <button :disabled="settlePager.page===settlePages" @click="setSettlePage(settlePages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="settlePager.size" @change="onSettleSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>
</div>
`,
};

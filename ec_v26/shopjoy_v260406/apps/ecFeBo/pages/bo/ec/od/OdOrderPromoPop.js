/* ShopJoy Admin - 주문 프로모션 상세 팝업 (window.open 전용, bo-od-order-promo-pop.html 에서 마운트)
   주문항목관리(OdOrderItemMng)의 주문ID 그룹헤더 [프로모션상세] 버튼이 연다.
   주문에 속한 전체 항목의 할인/쿠폰/적립금/사은품 적용내역 + 금액계산 정보를 한 화면에서 보여준다. */
window.OdOrderPromoPop = {
  name: 'OdOrderPromoPop',
  props: {
    orderId:     { type: String,   default: null },
    showToast:   { type: Function, default: () => {} },
  },
  setup(props) {
    const { reactive, onMounted } = Vue;

    const uiState = reactive({ loading: false });
    const items = reactive([]);
    const discounts = reactive([]);
    const coupons = reactive([]);
    const saves = reactive([]);

    const cfTotal = () => {
      let orderAmt = 0, discountAmt = 0, cancelAmt = 0, completedAmt = 0, discntUsage = 0, couponUsage = 0, saveSchd = 0;
      for (const it of items) {
        orderAmt     += Number(it.itemOrderAmt)     || 0;
        discountAmt  += Number(it.orgDiscountAmt)   || 0;
        cancelAmt    += Number(it.itemCancelAmt)    || 0;
        completedAmt += Number(it.itemCompletedAmt) || 0;
        discntUsage  += Number(it.discntUsageAmt)   || 0;
        couponUsage  += Number(it.couponUsageAmt)   || 0;
        saveSchd     += Number(it.saveSchdAmt)      || 0;
      }
      return { orderAmt, discountAmt, cancelAmt, completedAmt, discntUsage, couponUsage, saveSchd };
    };

    const fnDate = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';
    const fnWon  = (v) => Number(v || 0).toLocaleString() + '원';

    const initPage = async () => {
      if (!props.orderId) { return; }
      uiState.loading = true;
      try {
        const [itemRes, dRes, cRes, sRes] = await Promise.all([
          boApiSvc.odOrderItem.getList({ orderId: props.orderId }),
          boApiSvc.pmDiscntUsage.getPage({ orderId: props.orderId, pageSize: 200 }),
          boApiSvc.pmCouponUsage.getPage({ orderId: props.orderId, pageSize: 200 }),
          boApiSvc.pmSaveUsage.getPage({ orderId: props.orderId, pageSize: 200 }),
        ]);
        items.splice(0, items.length, ...(itemRes.data?.data || []));
        discounts.splice(0, discounts.length, ...(dRes.data?.data?.pageList || []));
        coupons.splice(0, coupons.length, ...(cRes.data?.data?.pageList || []));
        saves.splice(0, saves.length, ...(sRes.data?.data?.pageList || []));
      } catch (err) {
        props.showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(initPage);

    return { uiState, items, discounts, coupons, saves, cfTotal, fnDate, fnWon };
  },
  template: `
<div style="padding:18px;max-width:1080px;margin:0 auto;">
  <div class="page-title">주문 프로모션 상세 <span style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">#{{ orderId }}</span></div>

  <div v-if="uiState.loading" style="text-align:center;padding:40px;color:#999;">불러오는 중...</div>

  <template v-else>
    <div class="card" style="padding:12px 16px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;color:#555;margin-bottom:8px;">주문 전체 금액계산 ({{ items.length }}개 항목)</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;font-size:12px;">
        <div><div style="color:#999;">주문금액</div><div style="font-weight:700;color:#1565c0;">{{ fnWon(cfTotal().orderAmt) }}</div></div>
        <div><div style="color:#999;">할인 적용액</div><div style="font-weight:700;color:#c2410c;">-{{ fnWon(cfTotal().discntUsage) }}</div></div>
        <div><div style="color:#999;">쿠폰 할인액</div><div style="font-weight:700;color:#c2410c;">-{{ fnWon(cfTotal().couponUsage) }}</div></div>
        <div><div style="color:#999;">확정금액</div><div style="font-weight:700;color:#15803d;">{{ fnWon(cfTotal().completedAmt) }}</div></div>
        <div><div style="color:#999;">적립 예정(완료후)</div><div style="font-weight:700;color:#6a1b9a;">+{{ fnWon(cfTotal().saveSchd) }}</div></div>
      </div>
    </div>

    <div class="card" style="padding:0;margin-bottom:14px;overflow:hidden;">
      <div style="padding:10px 16px;font-size:13px;font-weight:700;color:#555;border-bottom:1px solid #eee;">항목별 내역</div>
      <table class="admin-table" style="font-size:11px;">
        <thead><tr>
          <th>상품명</th><th>주문금액</th><th>할인</th><th>쿠폰</th><th>적립예정</th><th>사은품</th><th>확정금액</th>
        </tr></thead>
        <tbody>
          <tr v-for="it in items" :key="it.orderItemId">
            <td style="text-align:left;">{{ it.prodNm || '-' }}</td>
            <td style="text-align:right;">{{ fnWon(it.itemOrderAmt) }}</td>
            <td style="text-align:right;color:#c2410c;">{{ it.discntUsageAmt ? '-' + fnWon(it.discntUsageAmt) : '-' }}</td>
            <td style="text-align:right;color:#c2410c;">{{ it.couponUsageAmt ? '-' + fnWon(it.couponUsageAmt) : '-' }}</td>
            <td style="text-align:right;color:#6a1b9a;">{{ it.saveSchdAmt ? '+' + fnWon(it.saveSchdAmt) : '-' }}</td>
            <td style="text-align:center;">{{ it.giftNm || (it.giftId ? it.giftId : '-') }}</td>
            <td style="text-align:right;font-weight:700;color:#15803d;">{{ fnWon(it.itemCompletedAmt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" style="padding:12px 16px;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:6px;">할인 ({{ discounts.length }}건)</div>
      <table v-if="discounts.length" class="admin-table" style="font-size:11px;">
        <thead><tr><th>할인명</th><th>대상항목</th><th>유형</th><th>값</th><th>할인금액</th><th>적용일시</th></tr></thead>
        <tbody>
          <tr v-for="d in discounts" :key="d.discntUsageId">
            <td>{{ d.discntNm || d.discntId }}</td>
            <td style="font-family:monospace;font-size:10px;">{{ d.orderItemId ? d.orderItemId.substring(0, 12) + '..' : '주문전체' }}</td>
            <td style="text-align:center;">{{ d.discntTypeCd || '-' }}</td>
            <td style="text-align:right;">{{ d.discntValue != null ? d.discntValue : '-' }}</td>
            <td style="text-align:right;">{{ fnWon(d.discntAmt) }}</td>
            <td style="text-align:center;">{{ fnDate(d.usedDate) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="color:#bbb;font-size:11px;">적용된 할인 없음</div>
    </div>

    <div class="card" style="padding:12px 16px;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:6px;">쿠폰 ({{ coupons.length }}건)</div>
      <table v-if="coupons.length" class="admin-table" style="font-size:11px;">
        <thead><tr><th>쿠폰명</th><th>대상항목</th><th>코드</th><th>할인금액</th><th>사용일시</th></tr></thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.couponUsageId">
            <td>{{ c.couponNm || c.couponId }}</td>
            <td style="font-family:monospace;font-size:10px;">{{ c.orderItemId ? c.orderItemId.substring(0, 12) + '..' : '주문전체' }}</td>
            <td style="font-family:monospace;">{{ c.couponCode || '-' }}</td>
            <td style="text-align:right;">{{ fnWon(c.discountAmt) }}</td>
            <td style="text-align:center;">{{ fnDate(c.usedDate) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="color:#bbb;font-size:11px;">적용된 쿠폰 없음</div>
    </div>

    <div class="card" style="padding:12px 16px;">
      <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:6px;">적립금 사용 ({{ saves.length }}건)</div>
      <table v-if="saves.length" class="admin-table" style="font-size:11px;">
        <thead><tr><th>대상항목</th><th>사용금액</th><th>사용 후 잔액</th><th>사용일시</th></tr></thead>
        <tbody>
          <tr v-for="s in saves" :key="s.saveUsageId">
            <td style="font-family:monospace;font-size:10px;">{{ s.orderItemId ? s.orderItemId.substring(0, 12) + '..' : '주문전체' }}</td>
            <td style="text-align:right;">{{ fnWon(s.useAmt) }}</td>
            <td style="text-align:right;">{{ fnWon(s.balanceAmt) }}</td>
            <td style="text-align:center;">{{ fnDate(s.usedDate) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="color:#bbb;font-size:11px;">적립금 사용 내역 없음</div>
    </div>
  </template>
</div>
`,
};

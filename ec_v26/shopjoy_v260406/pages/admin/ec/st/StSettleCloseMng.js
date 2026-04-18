/* ShopJoy Admin - 정산마감 */
window.StSettleCloseMng = {
  name: 'StSettleCloseMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    const orders  = computed(() => props.adminData.orders  || []);
    const claims  = computed(() => props.adminData.claims  || []);
    const vendors = computed(() => (props.adminData.vendors || []).filter(v => v.vendorType === '판매업체'));

    const closeList = reactive([
      { closeId: 'CLS-2026-03', closeMon: '2026-03', sales: 556600, refund: 174000, net: 382600, comm: 38260, promo: 11478, settle: 332862, status: '마감완료', closeDate: '2026-04-10', regUserNm: '이관리자' },
      { closeId: 'CLS-2026-02', closeMon: '2026-02', sales: 442700, refund: 88000,  net: 354700, comm: 35470, promo: 10641, settle: 308589, status: '마감완료', closeDate: '2026-03-10', regUserNm: '이관리자' },
      { closeId: 'CLS-2026-01', closeMon: '2026-01', sales: 310000, refund: 0,      net: 310000, comm: 31000, promo: 9300,  settle: 269700, status: '마감완료', closeDate: '2026-02-10', regUserNm: '이관리자' },
    ]);

    // 이번달 집계
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthOrders = computed(() => orders.value.filter(o => o.orderDate.startsWith(thisMonth) && o.status !== '취소됨'));
    const thisMonthSales  = computed(() => thisMonthOrders.value.reduce((s, o) => s + o.totalPrice, 0));
    const thisMonthRefund = computed(() => claims.value.filter(c => c.requestDate.startsWith(thisMonth) && ['환불완료','취소완료'].includes(c.status)).reduce((s, c) => s + c.refundAmount, 0));
    const thisMonthNet    = computed(() => thisMonthSales.value - thisMonthRefund.value);
    const thisMonthComm   = computed(() => Math.round(thisMonthNet.value * 0.10));
    const thisMonthPromo  = computed(() => Math.round(thisMonthNet.value * 0.03));
    const thisMonthSettle = computed(() => thisMonthNet.value - thisMonthComm.value - thisMonthPromo.value);

    const alreadyClosed = computed(() => closeList.some(c => c.closeMon === thisMonth));

    const doClose = async () => {
      if (alreadyClosed.value) { props.showToast('이미 마감된 월입니다.', 'error'); return; }
      await window.adminApiCall({
        method: 'post', path: 'st/close',
        data: { closeMon: thisMonth, sales: thisMonthSales.value, refund: thisMonthRefund.value, net: thisMonthNet.value, comm: thisMonthComm.value, promo: thisMonthPromo.value, settle: thisMonthSettle.value },
        confirmTitle: '정산마감', confirmMsg: `${thisMonth} 정산을 마감하시겠습니까?\n마감 후에는 수정이 제한됩니다.`,
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: '정산마감이 완료되었습니다.',
        onLocal: () => {
          closeList.unshift({
            closeId: 'CLS-' + thisMonth, closeMon: thisMonth,
            sales: thisMonthSales.value, refund: thisMonthRefund.value, net: thisMonthNet.value,
            comm: thisMonthComm.value, promo: thisMonthPromo.value, settle: thisMonthSettle.value,
            status: '마감완료', closeDate: new Date().toISOString().slice(0,10), regUserNm: '관리자',
          });
        },
      });
    };

    const doReopen = async (r) => {
      await window.adminApiCall({
        method: 'put', path: `st/close/${r.closeId}/reopen`, data: {},
        confirmTitle: '마감취소', confirmMsg: `${r.closeMon} 정산마감을 취소하시겠습니까?`,
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: '마감이 취소되었습니다.',
        onLocal: () => { r.status = '마감취소'; },
      });
    };

    const statusBadge = s => ({ '마감완료':'badge-green', '마감예정':'badge-blue', '마감취소':'badge-red' }[s] || 'badge-gray');
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

    return { closeList, thisMonth, thisMonthSales, thisMonthRefund, thisMonthNet, thisMonthComm, thisMonthPromo, thisMonthSettle, alreadyClosed, doClose, doReopen, statusBadge, fmtW };
  },
  template: /* html */`
<div>
  <div class="page-title">정산마감</div>

  <!-- 이번달 마감 대상 -->
  <div class="card">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{ thisMonth }} 정산마감 대상</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">매출액</div>
        <div style="font-size:16px;font-weight:700;color:#3498db">{{ fmtW(thisMonthSales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8">
        <div style="font-size:11px;color:#888">환불액</div>
        <div style="font-size:16px;font-weight:700;color:#e74c3c">{{ fmtW(thisMonthRefund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">순매출</div>
        <div style="font-size:16px;font-weight:700;color:#333">{{ fmtW(thisMonthNet) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0">
        <div style="font-size:11px;color:#888">수수료(10%)</div>
        <div style="font-size:16px;font-weight:700;color:#e67e22">{{ fmtW(thisMonthComm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fdf5ff">
        <div style="font-size:11px;color:#888">프로모션(3%)</div>
        <div style="font-size:16px;font-weight:700;color:#9b59b6">{{ fmtW(thisMonthPromo) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4">
        <div style="font-size:11px;color:#888">정산예정액</div>
        <div style="font-size:16px;font-weight:700;color:#27ae60">{{ fmtW(thisMonthSettle) }}</div>
      </div>
    </div>
    <div style="text-align:right">
      <button v-if="!alreadyClosed" class="btn btn-primary" @click="doClose">📋 {{ thisMonth }} 정산마감 실행</button>
      <span v-else class="badge badge-green" style="font-size:13px;padding:8px 16px">✓ 마감완료</span>
    </div>
  </div>

  <!-- 마감 이력 -->
  <div class="card" style="margin-top:12px">
    <div class="toolbar"><span class="list-title">정산마감 이력</span><span class="list-count">총 {{ closeList.length }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>마감ID</th><th>정산월</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료</th><th>프로모션비</th><th>정산액</th><th>마감일</th><th>상태</th><th>담당자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in closeList" :key="r.closeId">
          <td>{{ r.closeId }}</td>
          <td><strong>{{ r.closeMon }}</strong></td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ fmtW(r.refund) }}</td>
          <td>{{ fmtW(r.net) }}</td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#9b59b6">{{ fmtW(r.promo) }}</td>
          <td style="color:#27ae60;font-weight:700">{{ fmtW(r.settle) }}</td>
          <td>{{ r.closeDate }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.status==='마감완료'" class="btn btn-sm btn-secondary" @click="doReopen(r)">마감취소</button>
          </td>
        </tr>
        <tr v-if="!closeList.length"><td colspan="12" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
  </div>
</div>
`,
};

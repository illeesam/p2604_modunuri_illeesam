/* ShopJoy Admin - ERP 전표생성 */
window.StErpGenMng = {
  name: 'StErpGenMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    const targetMon = ref(new Date().toISOString().slice(0, 7));
    const slipType  = ref('정산');

    const orders  = computed(() => props.adminData.orders  || []);
    const vendors = computed(() => (props.adminData.vendors || []).filter(v => v.vendorType === '판매업체'));

    const previewRows = computed(() => {
      return vendors.value.map(v => {
        const vOrders = orders.value.filter(o => o.vendorId === v.vendorId && o.status !== '취소됨' && o.orderDate.startsWith(targetMon.value));
        const sales   = vOrders.reduce((s, o) => s + o.totalPrice, 0);
        const comm    = Math.round(sales * 0.10);
        const settle  = sales - comm;
        return { vendorNm: v.vendorNm, debit: '미지급금', credit: '현금', debitAmt: settle, creditAmt: settle, description: `${targetMon.value} ${v.vendorNm} 정산지급` };
      }).filter(r => r.debitAmt > 0);
    });

    const genHistory = reactive([
      { genId: 'GEN-2026-03', genMon: '2026-03', slipType: '정산', slipCnt: 4, totalAmt: 332862, genDate: '2026-04-11', status: '전송완료', regUserNm: '이관리자' },
      { genId: 'GEN-2026-02', genMon: '2026-02', slipType: '정산', slipCnt: 4, totalAmt: 308589, genDate: '2026-03-11', status: '전송완료', regUserNm: '이관리자' },
    ]);

    const doGenerate = async () => {
      if (!previewRows.value.length) { props.showToast('생성할 전표 데이터가 없습니다.', 'error'); return; }
      await window.adminApiCall({
        method: 'post', path: 'st/erp/gen',
        data: { targetMon: targetMon.value, slipType: slipType.value, rows: previewRows.value },
        confirmTitle: 'ERP 전표생성', confirmMsg: `${targetMon.value} ${slipType.value} 전표를 생성하시겠습니까?`,
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: 'ERP 전표가 생성되었습니다.',
        onLocal: () => {
          genHistory.unshift({
            genId: 'GEN-' + targetMon.value, genMon: targetMon.value, slipType: slipType.value,
            slipCnt: previewRows.value.length,
            totalAmt: previewRows.value.reduce((s, r) => s + r.debitAmt, 0),
            genDate: new Date().toISOString().slice(0,10), status: '생성완료', regUserNm: '관리자',
          });
        },
      });
    };

    const statusBadge = s => ({ '전송완료':'badge-green', '생성완료':'badge-blue', '오류':'badge-red' }[s] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';

    return { targetMon, slipType, previewRows, genHistory, doGenerate, statusBadge, fmtW };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표생성</div>

  <!-- 생성 설정 -->
  <div class="card">
    <div style="font-weight:700;margin-bottom:12px">전표 생성 설정</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">정산월</label>
        <input class="form-control" v-model="targetMon" type="month" style="width:160px" />
      </div>
      <div class="form-group">
        <label class="form-label">전표유형</label>
        <select class="form-control" v-model="slipType" style="width:160px">
          <option>정산</option><option>수수료</option><option>반품조정</option>
        </select>
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end">
        <button class="btn btn-primary" @click="doGenerate">📋 ERP 전표생성</button>
      </div>
    </div>

    <!-- 미리보기 -->
    <div v-if="previewRows.length" style="margin-top:16px">
      <div style="font-weight:600;margin-bottom:8px;color:#555">전표 미리보기 ({{ previewRows.length }}건)</div>
      <table class="admin-table">
        <thead><tr><th>차변계정</th><th>대변계정</th><th>차변금액</th><th>대변금액</th><th>적요</th></tr></thead>
        <tbody>
          <tr v-for="(r, idx) in previewRows" :key="idx">
            <td>{{ r.debit }}</td><td>{{ r.credit }}</td>
            <td style="font-weight:700;color:#3498db">{{ fmtW(r.debitAmt) }}</td>
            <td style="font-weight:700;color:#27ae60">{{ fmtW(r.creditAmt) }}</td>
            <td style="font-size:12px;color:#666">{{ r.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else style="color:#999;margin-top:12px">해당 월의 생성 대상 전표가 없습니다.</div>
  </div>

  <!-- 생성 이력 -->
  <div class="card" style="margin-top:12px">
    <div class="toolbar"><span class="list-title">전표생성 이력</span><span class="list-count">총 {{ genHistory.length }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>생성ID</th><th>정산월</th><th>전표유형</th><th>전표수</th><th>총금액</th><th>생성일</th><th>상태</th><th>담당자</th></tr></thead>
      <tbody>
        <tr v-for="r in genHistory" :key="r.genId">
          <td>{{ r.genId }}</td><td><strong>{{ r.genMon }}</strong></td>
          <td><span class="badge badge-blue">{{ r.slipType }}</span></td>
          <td>{{ r.slipCnt }}건</td>
          <td style="font-weight:700">{{ fmtW(r.totalAmt) }}</td>
          <td>{{ r.genDate }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
          <td>{{ r.regUserNm }}</td>
        </tr>
        <tr v-if="!genHistory.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
  </div>
</div>
`,
};

/* ShopJoy Admin - 주문 이력 (구성상품 / 배송이력 / 연관클레임) */
window._ecOrderHistState = window._ecOrderHistState || { tab: 'products', viewMode: 'tab' };
window.OdOrderHist = {
  name: 'OdOrderHist',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'orderId'],
  setup(props) {
    const { ref, computed, onMounted } = Vue;
    const botTab = ref(window._ecOrderHistState.tab || 'products');
    Vue.watch(botTab, v => { window._ecOrderHistState.tab = v; });
    const viewMode2 = ref('tab');
    
    const showTab = (id) => viewMode2.value !== 'tab' || botTab.value === id;

    const orderItems = reactive([]);
    onMounted(() => {
      const o = props.adminData.orders.find(x => x.orderId === props.orderId);
      if (o) {
        orderItems.splice(0, orderItems.length,
          { no: 1, prodNm: o.prodNm, optionNm: '-', qty: 1, unitPrice: o.totalPrice, totalPrice: o.totalPrice, statusCd: o.statusCd },
        );
      }
    });

    const relatedDliv   = computed(() => props.adminData.deliveries.find(d => d.orderId === props.orderId) || null);
    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === props.orderId));
    const dlivHistory   = computed(() => {
      if (!relatedDliv.value) return [];
      const o = props.adminData.orders.find(x => x.orderId === props.orderId);
      return [
        { date: o && o.orderDate ? o.orderDate.slice(0, 10) : '-', status: '상품준비중', location: '물류센터', memo: '상품 포장 완료' },
        { date: relatedDliv.value.shipDate || '-', status: '배송중', location: relatedDliv.value.courierCd || '-', memo: '출고 완료' },
      ].filter(h => h.date !== '-');
    });

    return { botTab, orderItems, relatedDliv, relatedClaims, dlivHistory, viewMode2, showTab };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='products'}" :disabled="viewMode2!=='tab'" @click="botTab='products'">📦 구성 상품 <span class="tab-count">{{ orderItems.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='dliv'}"     :disabled="viewMode2!=='tab'" @click="botTab='dliv'">🚚 배송 이력 <span class="tab-count">{{ relatedDliv ? 1 : 0 }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='claims'}"   :disabled="viewMode2!=='tab'" @click="botTab='claims'">↩ 연관 클레임 <span class="tab-count">{{ relatedClaims.length }}</span></button>
    </div>
    </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <!-- 구성 상품 -->
  <div class="card" v-show="showTab('products')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📦 구성 상품 <span class="tab-count">{{ orderItems.length }}</span></div>
    <table class="admin-table" v-if="orderItems.length">
      <thead><tr><th>No</th><th>상품명</th><th>옵션</th><th>수량</th><th>단가</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="item in orderItems" :key="item.no">
          <td>{{ item.no }}</td>
          <td>{{ item.prodNm }}</td>
          <td>{{ item.optionNm }}</td>
          <td>{{ item.qty }}</td>
          <td>{{ item.unitPrice.toLocaleString() }}원</td>
          <td style="font-weight:600;">{{ item.totalPrice.toLocaleString() }}원</td>
          <td>{{ item.statusCd }}</td>
          <td><button class="btn btn-secondary btn-sm" @click="showRefModal('order', orderId)">보기</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">구성 상품 정보가 없습니다.</div>
  </div>

  <!-- 배송 이력 -->
  <div class="card" v-show="showTab('dliv')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🚚 배송 이력 <span class="tab-count">{{ relatedDliv ? 1 : 0 }}</span></div>
    <template v-if="relatedDliv">
      <div style="margin-bottom:14px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:13px;">
          <span style="color:#888;">수령인</span> <b>{{ relatedDliv.receiver }}</b>
          &nbsp;·&nbsp;<span style="color:#888;">택배사</span> <b>{{ relatedDliv.courier }}</b>
          &nbsp;·&nbsp;<span style="color:#888;">운송장</span> <b>{{ relatedDliv.trackingNo || '-' }}</b>
        </div>
        <button class="btn btn-blue btn-sm" @click="navigate('odDlivDtl',{id:relatedDliv.dlivId})">배송 수정</button>
      </div>
      <table class="admin-table" v-if="dlivHistory.length">
        <thead><tr><th>일시</th><th>상태</th><th>위치</th><th>메모</th></tr></thead>
        <tbody>
          <tr v-for="(h, i) in dlivHistory" :key="i">
            <td>{{ h.date }}</td>
            <td><span class="badge badge-blue">{{ h.status }}</span></td>
            <td>{{ h.location }}</td>
            <td>{{ h.memo }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:20px;font-size:13px;">배송 이력이 없습니다.</div>
    </template>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">배송 정보가 없습니다.</div>
  </div>

  <!-- 연관 클레임 -->
  <div class="card" v-show="showTab('claims')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ relatedClaims.length }}</span></div>
    <table class="admin-table" v-if="relatedClaims.length">
      <thead><tr><th>클레임ID</th><th>회원</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in relatedClaims" :key="c.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userNm }}</span></td>
          <td>{{ c.type }}</td>
          <td>{{ c.statusCd }}</td>
          <td>{{ c.reasonCd }}</td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:c.claimId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 클레임이 없습니다.</div>
  </div>
  </div>
</div>
`,
};

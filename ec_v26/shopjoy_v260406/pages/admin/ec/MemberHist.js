/* ShopJoy Admin - 회원 이력 (연관주문 / 연관클레임) */
window.MemberHist = {
  name: 'MemberHist',
  props: ['navigate', 'adminData', 'showRefModal', 'memberId'],
  setup(props) {
    const { ref, computed } = Vue;
    const tab = ref('orders');

    const memberOrders = computed(() => props.adminData.orders.filter(o => o.userId === props.memberId));
    const memberClaims = computed(() => props.adminData.claims.filter(c => c.userId === props.memberId));

    return { tab, memberOrders, memberClaims };
  },
  template: /* html */`
<div style="margin-top:28px;">
  <div class="tab-nav">
    <button class="tab-btn" :class="{active:tab==='orders'}" @click="tab='orders'">
      연관 주문 <span class="tab-count">{{ memberOrders.length }}</span>
    </button>
    <button class="tab-btn" :class="{active:tab==='claims'}" @click="tab='claims'">
      연관 클레임 <span class="tab-count">{{ memberClaims.length }}</span>
    </button>
  </div>

  <!-- 연관 주문 -->
  <div v-show="tab==='orders'">
    <table class="admin-table" v-if="memberOrders.length">
      <thead><tr><th>주문ID</th><th>주문일</th><th>상품</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="o in memberOrders" :key="o.orderId">
          <td><span class="ref-link" @click="showRefModal('order', o.orderId)">{{ o.orderId }}</span></td>
          <td>{{ o.orderDate }}</td>
          <td>{{ o.productName }}</td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>{{ o.status }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('ecOrderDtl',{id:o.orderId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">주문 내역이 없습니다.</div>
  </div>

  <!-- 연관 클레임 -->
  <div v-show="tab==='claims'">
    <table class="admin-table" v-if="memberClaims.length">
      <thead><tr><th>클레임ID</th><th>주문ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in memberClaims" :key="c.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('order', c.orderId)">{{ c.orderId }}</span></td>
          <td>{{ c.type }}</td>
          <td>{{ c.status }}</td>
          <td>{{ c.reason }}</td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('ecClaimDtl',{id:c.claimId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">클레임 내역이 없습니다.</div>
  </div>
</div>
`,
};

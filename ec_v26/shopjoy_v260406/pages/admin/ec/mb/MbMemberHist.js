/* ShopJoy Admin - 회원 이력 (연관주문 / 연관클레임) */
window._ecMemberHistState = window._ecMemberHistState || { tab: 'orders', viewMode: 'tab' };
window.MbMemberHist = {
  name: 'MbMemberHist',
  props: ['navigate', 'adminData', 'showRefModal', 'memberId'],
  setup(props) {
    const { ref, computed } = Vue;
    const tab = ref(window._ecMemberHistState.tab || 'orders');
    Vue.watch(tab, v => { window._ecMemberHistState.tab = v; });
    const viewMode2 = ref(window._ecMemberHistState.viewMode || 'tab');
    Vue.watch(viewMode2, v => { window._ecMemberHistState.viewMode = v; });
    const showTab = (id) => viewMode2.value !== 'tab' || tab.value === id;

    const memberOrders = computed(() => props.adminData.orders.filter(o => o.userId === props.memberId));
    const memberClaims = computed(() => props.adminData.claims.filter(c => c.userId === props.memberId));

    return { tab, memberOrders, memberClaims, viewMode2, showTab };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='orders'}" :disabled="viewMode2!=='tab'" @click="tab='orders'">🛒 연관 주문 <span class="tab-count">{{ memberOrders.length }}</span></button>
      <button class="tab-btn" :class="{active:tab==='claims'}" :disabled="viewMode2!=='tab'" @click="tab='claims'">↩ 연관 클레임 <span class="tab-count">{{ memberClaims.length }}</span></button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}" @click="viewMode2='tab'" title="탭으로 보기">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <!-- 연관 주문 -->
  <div class="card" v-show="showTab('orders')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ memberOrders.length }}</span></div>
    <table class="admin-table" v-if="memberOrders.length">
      <thead><tr><th>주문ID</th><th>주문일</th><th>상품</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="o in memberOrders" :key="o.orderId">
          <td><span class="ref-link" @click="showRefModal('order', o.orderId)">{{ o.orderId }}</span></td>
          <td>{{ o.orderDate }}</td>
          <td>{{ o.prodNm }}</td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>{{ o.statusCd }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:o.orderId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">주문 내역이 없습니다.</div>
  </div>

  <!-- 연관 클레임 -->
  <div class="card" v-show="showTab('claims')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ memberClaims.length }}</span></div>
    <table class="admin-table" v-if="memberClaims.length">
      <thead><tr><th>클레임ID</th><th>주문ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in memberClaims" :key="c.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('order', c.orderId)">{{ c.orderId }}</span></td>
          <td>{{ c.type }}</td>
          <td>{{ c.statusCd }}</td>
          <td>{{ c.reasonCd }}</td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:c.claimId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">클레임 내역이 없습니다.</div>
  </div>
  </div>
</div>
`,
};

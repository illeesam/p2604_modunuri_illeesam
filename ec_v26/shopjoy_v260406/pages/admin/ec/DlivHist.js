/* ShopJoy Admin - 배송 이력 (연관주문 / 연관클레임) */
window.DlivHist = {
  name: 'DlivHist',
  props: ['navigate', 'adminData', 'showRefModal', 'orderId'],
  setup(props) {
    const { ref, computed } = Vue;
    const botTab = ref('order');
    const relatedOrder  = computed(() => props.adminData.getOrder(props.orderId));
    const relatedClaims = computed(() => props.adminData.claims.filter(c => c.orderId === props.orderId));
    return { botTab, relatedOrder, relatedClaims };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 8px;border-bottom:2px solid #f0f0f0;margin-bottom:0;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-nav">
    <button class="tab-btn" :class="{active:botTab==='order'}" @click="botTab='order'">
      연관 주문 <span class="tab-count">{{ relatedOrder ? 1 : 0 }}</span>
    </button>
    <button class="tab-btn" :class="{active:botTab==='claims'}" @click="botTab='claims'">
      연관 클레임 <span class="tab-count">{{ relatedClaims.length }}</span>
    </button>
  </div>

  <!-- 연관 주문 -->
  <div v-show="botTab==='order'">
    <template v-if="relatedOrder">
      <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ relatedOrder.orderId }}</span></div>
      <div class="detail-row"><span class="detail-label">회원</span>
        <span class="detail-value"><span class="ref-link" @click="showRefModal('member', relatedOrder.userId)">{{ relatedOrder.userName }}</span></span>
      </div>
      <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ relatedOrder.productName }}</span></div>
      <div class="detail-row"><span class="detail-label">금액</span><span class="detail-value">{{ relatedOrder.totalPrice.toLocaleString() }}원</span></div>
      <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ relatedOrder.status }}</span></div>
      <div style="margin-top:14px;"><button class="btn btn-blue btn-sm" @click="navigate('ecOrderDtl',{id:relatedOrder.orderId})">주문 상세 수정</button></div>
    </template>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문 정보가 없습니다.</div>
  </div>

  <!-- 연관 클레임 -->
  <div v-show="botTab==='claims'">
    <table class="admin-table" v-if="relatedClaims.length">
      <thead><tr><th>클레임ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in relatedClaims" :key="c.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td>{{ c.type }}</td><td>{{ c.status }}</td><td>{{ c.reason }}</td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('ecClaimDtl',{id:c.claimId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 클레임이 없습니다.</div>
  </div>
</div>
`,
};

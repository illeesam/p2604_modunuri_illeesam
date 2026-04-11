/* ShopJoy Admin - 상품 이력 (연관주문 / 재고이력 / 가격변경이력 / 상품상태이력 / 상품정보변경이력) */
window.ProdHist = {
  name: 'ProdHist',
  props: ['navigate', 'adminData', 'showRefModal', 'prodId'],
  setup(props) {
    const { ref, computed, onMounted } = Vue;
    const botTab = ref('orders');

    const stockHistory  = ref([]);
    const statusHistory = ref([]);
    const changeHistory = ref([]);
    const priceHistory  = ref([]);

    onMounted(() => {
      const p = props.adminData.getProduct(props.prodId);
      if (p) {
        stockHistory.value = [
          { date: p.regDate || '2026-01-01', type: '입고', qty: p.stock, balance: p.stock, memo: '초기 입고' },
        ];
        statusHistory.value = [
          { date: p.regDate || '2026-01-01', before: '-', after: p.status, admin: '관리자' },
        ];
        changeHistory.value = [
          { date: p.regDate || '2026-01-01', field: '등록', before: '-', after: p.prodNm, admin: '관리자' },
        ];
        priceHistory.value = [
          { date: p.regDate || '2026-01-01', field: '판매가', before: '-', after: String(p.price), admin: '관리자' },
        ];
      }
    });

    const relatedOrders = computed(() => {
      const p = props.adminData.getProduct(props.prodId);
      if (!p) return [];
      return props.adminData.orders.filter(o => o.prodNm && p.prodNm && o.prodNm.includes(p.prodNm.slice(0, 8)));
    });

    return { botTab, stockHistory, statusHistory, changeHistory, priceHistory, relatedOrders };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 8px;border-bottom:2px solid #f0f0f0;margin-bottom:0;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-nav">
    <button class="tab-btn" :class="{active:botTab==='orders'}"  @click="botTab='orders'">
      연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span>
    </button>
    <button class="tab-btn" :class="{active:botTab==='stock'}"   @click="botTab='stock'">
      재고 이력 <span class="tab-count">{{ stockHistory.length }}</span>
    </button>
    <button class="tab-btn" :class="{active:botTab==='price'}"   @click="botTab='price'">
      가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span>
    </button>
    <button class="tab-btn" :class="{active:botTab==='status'}"  @click="botTab='status'">
      상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span>
    </button>
    <button class="tab-btn" :class="{active:botTab==='changes'}" @click="botTab='changes'">
      상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span>
    </button>
  </div>

  <!-- 연관 주문 -->
  <div v-show="botTab==='orders'">
    <table class="admin-table" v-if="relatedOrders.length">
      <thead><tr><th>주문ID</th><th>회원</th><th>주문일</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="o in relatedOrders" :key="o.orderId">
          <td><span class="ref-link" @click="showRefModal('order', o.orderId)">{{ o.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', o.userId)">{{ o.userNm }}</span></td>
          <td>{{ o.orderDate.slice(0,10) }}</td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>{{ o.status }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('ecOrderDtl',{id:o.orderId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문이 없습니다.</div>
  </div>

  <!-- 재고 이력 -->
  <div v-show="botTab==='stock'">
    <table class="admin-table" v-if="stockHistory.length">
      <thead><tr><th>일시</th><th>유형</th><th>수량</th><th>처리 후 재고</th><th>메모</th></tr></thead>
      <tbody>
        <tr v-for="(h, i) in stockHistory" :key="i">
          <td>{{ h.date }}</td>
          <td><span class="badge" :class="h.type==='입고'?'badge-green':h.type==='출고'?'badge-orange':'badge-gray'">{{ h.type }}</span></td>
          <td :style="h.qty>0?'color:#389e0d;font-weight:600':'color:#cf1322;font-weight:600'">
            {{ h.qty > 0 ? '+' : '' }}{{ h.qty }}
          </td>
          <td>{{ h.balance }}개</td>
          <td>{{ h.memo }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">재고 이력이 없습니다.</div>
  </div>

  <!-- 가격변경이력 -->
  <div v-show="botTab==='price'">
    <table class="admin-table" v-if="priceHistory.length">
      <thead><tr><th>일시</th><th>항목</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="(h, i) in priceHistory" :key="i">
          <td>{{ h.date }}</td>
          <td><span class="tag">{{ h.field }}</span></td>
          <td style="color:#888;">{{ h.before }}</td>
          <td style="font-weight:600;color:#e8587a;">{{ h.after }}</td>
          <td>{{ h.admin }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">가격 변경 이력이 없습니다.</div>
  </div>

  <!-- 상품상태 이력 -->
  <div v-show="botTab==='status'">
    <table class="admin-table" v-if="statusHistory.length">
      <thead><tr><th>일시</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="(h, i) in statusHistory" :key="i">
          <td>{{ h.date }}</td>
          <td><span class="badge badge-gray">{{ h.before }}</span></td>
          <td><span class="badge badge-blue">{{ h.after }}</span></td>
          <td>{{ h.admin }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">상태 변경 이력이 없습니다.</div>
  </div>

  <!-- 상품정보 변경이력 -->
  <div v-show="botTab==='changes'">
    <table class="admin-table" v-if="changeHistory.length">
      <thead><tr><th>일시</th><th>항목</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="(h, i) in changeHistory" :key="i">
          <td>{{ h.date }}</td>
          <td><span class="tag">{{ h.field }}</span></td>
          <td style="color:#888;">{{ h.before }}</td>
          <td style="font-weight:500;">{{ h.after }}</td>
          <td>{{ h.admin }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">변경 이력이 없습니다.</div>
  </div>
</div>
`,
};

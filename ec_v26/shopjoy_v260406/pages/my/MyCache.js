/* ShopJoy - My 캐쉬 페이지 (#page=myCache) */
window.MyCache = {
  name: 'MyCache',
  props: ['navigate', 'cartCount', 'showToast'],
  setup(props) {
    const { reactive, onMounted } = Vue;
    const myStore = window.useMyStore();
    const { cashBalance, cashHistory, chargeAmount } = Pinia.storeToRefs(myStore);

    const cashPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    const addCash = () => {
      const amount = parseInt(String(chargeAmount.value).replace(/,/g, ''), 10);
      if (!amount || amount < 1000) { props.showToast('최소 1,000원 이상 충전 가능합니다.', 'error'); return; }
      cashBalance.value += amount;
      cashHistory.value.unshift({
        cashId: Date.now(), date: new Date().toISOString().slice(0, 10),
        type: '충전', amount, desc: '직접 충전', balance: cashBalance.value
      });
      chargeAmount.value = ''; cashPager.page = 1;
      props.showToast(amount.toLocaleString() + '원이 충전되었습니다!', 'success');
    };

    const openOrderModal = orderId => {
      const ok = myStore.openOrderModal(orderId);
      if (!ok) props.showToast('주문 정보를 찾을 수 없습니다.', 'error');
    };

    onMounted(async () => {
      await myStore.loadCash();
      myStore.loadOrders();
    });

    return {
      myStore, cashBalance, cashHistory, chargeAmount,
      cashPager, paginate, addCash, openOrderModal,
    };
  },
  template: /* html */ `
<MyLayout :navigate="navigate" :cart-count="cartCount" active-page="myCache">

  <!-- 보유 캐쉬 -->
  <div style="background:linear-gradient(135deg,var(--blue),var(--green));border-radius:var(--radius);padding:24px;margin-bottom:20px;color:#fff;">
    <div style="font-size:0.85rem;font-weight:600;opacity:0.85;">보유 캐쉬</div>
    <div style="font-size:2.2rem;font-weight:900;margin-top:4px;">{{ cashBalance.toLocaleString() }}<span style="font-size:1rem;margin-left:4px;">원</span></div>
  </div>

  <!-- 충전 입력 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
    <input v-model="chargeAmount" type="number" placeholder="충전 금액 입력 (최소 1,000원)" @keyup.enter="addCash"
      style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;">
    <button @click="addCash" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">충전하기</button>
  </div>

  <!-- 빠른 금액 버튼 -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
    <button v-for="amt in [5000,10000,30000,50000]" :key="amt" @click="chargeAmount=amt"
      style="padding:8px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
      +{{ amt.toLocaleString() }}원
    </button>
  </div>

  <PagerHeader :total="cashHistory.length" :pager="cashPager" />
  <div v-if="!cashHistory.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">캐쉬 내역이 없습니다.</div>

  <div v-for="h in paginate(cashHistory, cashPager)" :key="h.cashId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
    <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;"
      :style="h.type==='충전'?'background:#dcfce7;':'background:#fee2e2;'">
      {{ h.type==='충전' ? '↑' : '↓' }}
    </div>
    <div style="flex:1;">
      <div style="font-weight:600;font-size:0.88rem;color:var(--text-primary);">
        <template v-if="myStore.extractOrderId(h.desc)">
          <button @click="openOrderModal(myStore.extractOrderId(h.desc))"
            style="background:none;border:none;padding:0;cursor:pointer;font-size:0.88rem;font-weight:700;color:var(--blue);text-decoration:underline;text-underline-offset:2px;">
            {{ myStore.extractOrderId(h.desc) }}
          </button>
          <span style="font-weight:400;color:var(--text-secondary);"> {{ h.desc.replace(myStore.extractOrderId(h.desc), '').trim() }}</span>
        </template>
        <template v-else>{{ h.desc }}</template>
      </div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ h.date }}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:800;font-size:0.95rem;" :style="h.type==='충전'?'color:#22c55e;':'color:#ef4444;'">
        {{ h.type==='충전' ? '+' : '' }}{{ h.amount.toLocaleString() }}원
      </div>
    </div>
  </div>

  <Pagination :total="cashHistory.length" :pager="cashPager" />

  <Teleport to="body">
    <OrderDetailModal :show="myStore.orderDetailModal.show" :order="myStore.orderDetailModal.order" @close="myStore.orderDetailModal.show=false" />
  </Teleport>

</MyLayout>
  `,
  components: {
    MyLayout:         window.MyLayout,
    PagerHeader:      window.PagerHeader,
    Pagination:       window.Pagination,
    OrderDetailModal: window.OrderDetailModal,
  }
};

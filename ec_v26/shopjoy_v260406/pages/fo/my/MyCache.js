/* ShopJoy - My 캐쉬 페이지 (#page=myCache) */
window.MyCache = {
  name: 'MyCache',
  props: {
    navigate:  { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {
    const { reactive, computed, onMounted, watch } = Vue;
    const showToast            = window.foApp.showToast;  // 토스트 알림

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    const myStore = window.useFoMyStore();
    const { cashBalance, cashHistory, chargeAmount } = Pinia.storeToRefs(myStore);

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 50, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const paginate = myStore.paginate;

    const { inRange, onDateSearch } = window.myDateFilterHelper();
    const cfDateFilteredHistory = computed(() => cashHistory.value.filter(h => inRange(h.date)));

    /* addCash */
    const addCash = () => {
      const amount = parseInt(String(chargeAmount.value).replace(/,/g, ''), 10);
      if (!amount || amount < 1000) { showToast('최소 1,000원 이상 충전 가능합니다.', 'error'); return; }
      cashBalance.value += amount;
      cashHistory.value.unshift({
        cashId: Date.now(), date: new Date().toISOString().slice(0, 10),
        type: '충전', amount, desc: '직접 충전', balance: cashBalance.value
      });
      chargeAmount.value = ''; pager.page = 1;
      showToast(amount.toLocaleString() + '원이 충전되었습니다!', 'success');
    };

    /* openOrderModal */
    const openOrderModal = async orderId => {
      await myStore.handleLoadOrders();
      const ok = myStore.openOrderModal(orderId);
      if (!ok) showToast('주문 정보를 찾을 수 없습니다.', 'error');
    };

    /* 목록조회 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      await myStore.handleLoadCash();
      myStore.handleLoadOrders();
    };

    /* 목록조회 */
    const onSearch = async (dateParams) => {
      if (dateParams) onDateSearch(dateParams);
      await handleSearchData('DEFAULT');
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    onMounted(() => {
      handleSearchData();
    });

    // -- return ---------------------------------------------------------------

    return {
      myStore, cashBalance, cashHistory, chargeAmount,
      pager, paginate, addCash, openOrderModal, cfDateFilteredHistory, onDateSearch, onSearch,
      uiState, codes };
  },
  template: /* html */ `
<fo-my-layout :navigate="navigate" :cart-count="cartCount" active-page="myCache">

  <MyDateFilter @search="onSearch" />

  <!-- -- 보유 캐쉬 ---------------------------------------------------------- -->
  <div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:var(--radius);padding:24px;margin-bottom:20px;color:#1a1a1a;">
    <div style="font-size:0.85rem;font-weight:600;opacity:0.7;">보유 캐쉬</div>
    <div style="font-size:2.2rem;font-weight:900;margin-top:4px;">{{ cashBalance.toLocaleString() }}<span style="font-size:1rem;margin-left:4px;">원</span></div>
  </div>

  <!-- -- 충전 입력 ---------------------------------------------------------- -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
    <input v-model="chargeAmount" type="number" placeholder="충전 금액 입력 (최소 1,000원)" @keyup.enter="addCash"
      style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;">
    <button @click="addCash" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">충전하기</button>
  </div>

  <!-- -- 빠른 금액 버튼 ------------------------------------------------------- -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
    <button v-for="amt in [5000,10000,30000,50000]" :key="amt" @click="chargeAmount=amt"
      style="padding:8px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
      +{{ amt.toLocaleString() }}원
    </button>
  </div>

  <PagerHeader :total="cfDateFilteredHistory.length" :pager="pager" />
  <div v-if="!cfDateFilteredHistory.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">캐쉬 내역이 없습니다.</div>

  <div v-for="h in paginate(cfDateFilteredHistory, pager)" :key="h.cashId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
    <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;"
      :style="h.type==='환불'?'background:#ffedd5;':h.type==='충전'?'background:#dcfce7;':'background:#fee2e2;'">
      {{ h.type==='환불' ? '↩' : h.type==='충전' ? '↑' : '↓' }}
    </div>
    <!-- -- 1열: 설명 + 날짜 -------------------------------------------------- -->
    <div style="min-width:160px;flex:0 0 auto;">
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
    <!-- -- 2열: 결제/환불 정보 ------------------------------------------------- -->
    <div style="flex:1;min-width:0;padding:0 8px;">
      <!-- -- 직접 충전 결제정보 ------------------------------------------------- -->
      <div v-if="h.payMethod" style="display:inline-flex;flex-direction:column;gap:3px;padding:5px 10px;background:var(--bg-base);border-radius:6px;border:1px solid var(--border);">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:var(--text-muted);min-width:42px;flex-shrink:0;">충전금액</span>
          <span style="font-size:0.75rem;font-weight:700;color:#22c55e;">+{{ h.amount.toLocaleString() }}원</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:var(--text-muted);min-width:42px;flex-shrink:0;">결제수단</span>
          <span style="font-size:0.75rem;font-weight:600;color:var(--text-primary);">{{ h.payMethod }}</span>
        </div>
        <div v-if="h.cardInfo||h.bankInfo" style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:var(--text-muted);min-width:42px;flex-shrink:0;">카드/계좌</span>
          <span style="font-size:0.72rem;font-weight:600;color:var(--text-primary);">{{ h.cardInfo || h.bankInfo }}</span>
        </div>
        <div v-if="h.approvalNo" style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:var(--text-muted);min-width:42px;flex-shrink:0;">승인번호</span>
          <span style="font-size:0.75rem;font-weight:600;color:var(--text-primary);">{{ h.approvalNo }}</span>
        </div>
      </div>
      <!-- -- 캐쉬 환불 정보 --------------------------------------------------- -->
      <div v-else-if="h.refundBank" style="display:inline-flex;flex-direction:column;gap:3px;padding:5px 10px;background:#fff7ed;border-radius:6px;border:1px solid #fed7aa;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:#92400e;min-width:42px;flex-shrink:0;">환불계좌</span>
          <span style="font-size:0.72rem;font-weight:600;color:#78350f;">{{ h.refundBank }}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:#92400e;min-width:42px;flex-shrink:0;">예금주</span>
          <span style="font-size:0.75rem;font-weight:600;color:#78350f;">{{ h.refundHolder }}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.7rem;color:#92400e;min-width:42px;flex-shrink:0;">환불금</span>
          <span style="font-size:0.75rem;font-weight:700;color:#f97316;">{{ (h.refundNet + h.refundFee).toLocaleString() }}원</span>
          <span style="font-size:0.7rem;color:#92400e;margin-left:4px;">수수료</span>
          <span style="font-size:0.75rem;font-weight:600;color:#ef4444;">-{{ h.refundFee.toLocaleString() }}원</span>
          <span style="font-size:0.7rem;color:#92400e;margin-left:4px;">→ 실지급</span>
          <span style="font-size:0.75rem;font-weight:700;color:#78350f;">{{ h.refundNet.toLocaleString() }}원</span>
        </div>
      </div>
    </div>
    <!-- -- 3열: 거래금액 ----------------------------------------------------- -->
    <div style="font-weight:800;font-size:0.95rem;text-align:right;min-width:80px;flex-shrink:0;"
      :style="h.type==='환불'?'color:#f97316;':h.type==='충전'?'color:#22c55e;':'color:#ef4444;'">
      {{ h.type==='충전' ? '+' : h.type==='환불' ? '-' : '' }}{{ Math.abs(h.amount).toLocaleString() }}원
    </div>
    <!-- -- 4열: 잔액 ------------------------------------------------------- -->
    <div v-if="h.balance != null" style="text-align:right;min-width:90px;flex-shrink:0;border-left:1px solid var(--border);padding-left:14px;">
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;">잔액</div>
      <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ h.balance.toLocaleString() }}원</div>
    </div>
  </div>

  <Pagination :total="cashHistory.length" :pager="pager" />

  <Teleport to="body">
    <OrderDetailModal :show="myStore.orderDetailModal.show" :order="myStore.orderDetailModal.order" @close="myStore.orderDetailModal.show=false" />
  </Teleport>

</fo-my-layout>
  `,
  components: {
    FoMyLayout:         window.foMyLayout,
    PagerHeader:      window.PagerHeader,
    Pagination:       window.Pagination,
    OrderDetailModal: window.OrderDetailModal,
  }
};

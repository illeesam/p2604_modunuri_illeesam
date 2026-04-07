/* ShopJoy - My Page */
window.My = {
  name: 'My',
  props: ['navigate', 'config', 'cart', 'cartCount', 'showToast', 'showConfirm', 'removeFromCart', 'updateCartQty'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;

    /* ── 주문 상태 흐름 ── */
    const ORDER_FLOW = [
      { status: '주문완료',   icon: '📋' },
      { status: '결제완료',   icon: '💳' },
      { status: '배송준비중', icon: '📦' },
      { status: '배송중',     icon: '🚚' },
      { status: '배송완료',   icon: '✅' },
      { status: '완료',       label: '구매확정', icon: '🏁' },
    ];
    const orderStatusLabel = s => (s === '완료' ? '구매확정' : s);
    const flowHelpOpen = ref(false);
    const CANCELABLE   = ['주문완료', '결제완료'];
    const SHOW_COURIER = ['배송준비중', '배송중', '배송완료', '완료'];

    const tab = ref('orders');

    /* ── 공통 페이지네이션 헬퍼 ── */
    const mkPager = () => reactive({ page: 1, size: 10 });
    const paginate = (list, pager) => {
      const start = (pager.page - 1) * pager.size;
      return list.slice(start, start + pager.size);
    };
    const totalPages = (list, pager) => Math.max(1, Math.ceil(list.length / pager.size));
    const pageRange = (total) => { const r=[]; for(let i=1;i<=total;i++) r.push(i); return r; };

    /* ── 주문 ── */
    const orders = ref([]);
    const orderPager = mkPager();
    const loadOrders = async () => {
      if (orders.value.length) return;
      try { const res = await window.axiosApi.get('my/orders.json'); orders.value = res.data; }
      catch (e) { orders.value = []; }
    };
    const statusColor = s => ({
      '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
      '배송준비중': '#f59e0b', '배송중': '#f97316',
      '배송완료': '#22c55e', '완료': '#6b7280', '취소됨': '#9ca3af'
    }[s] || '#9ca3af');

    const flowIndex = s => ORDER_FLOW.findIndex(f => f.status === s);

    const cancelOrder = async orderId => {
      const ok = await props.showConfirm('주문 취소', '이 주문을 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const o = orders.value.find(x => x.orderId === orderId);
      if (o) { o.status = '취소됨'; }
      props.showToast('주문이 취소되었습니다.', 'success');
    };

    const COURIER_URLS = {
      'CJ대한통운': no => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
      '롯데택배':   no => `https://www.lotteglogis.com/open/tracking?invno=${no}`,
      '한진택배':   no => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
    };
    const openTracking = (courier, trackingNo) => {
      const fn = COURIER_URLS[courier];
      if (!fn) { props.showToast('택배사 정보를 찾을 수 없습니다.', 'error'); return; }
      window.open(fn(trackingNo), '_blank', 'width=960,height=700,scrollbars=yes,resizable=yes');
    };

    /* ── 쿠폰 ── */
    const coupons = ref([]);
    const couponPager = mkPager();
    const couponCode = ref('');
    const loadCoupons = async () => {
      if (coupons.value.length) return;
      try { const res = await window.axiosApi.get('my/coupons.json'); coupons.value = res.data; }
      catch (e) { coupons.value = []; }
    };
    const addCoupon = () => {
      const code = couponCode.value.trim().toUpperCase();
      if (!code) { props.showToast('쿠폰 코드를 입력하세요.', 'error'); return; }
      if (coupons.value.find(c => c.code === code)) { props.showToast('이미 등록된 쿠폰입니다.', 'error'); return; }
      coupons.value.unshift({ couponId: Date.now(), code, name: '추가 쿠폰 (' + code + ')', discountType: 'amount', discountValue: 3000, minOrder: 30000, expiry: '2026-12-31', used: false });
      couponCode.value = ''; couponPager.page = 1;
      props.showToast('쿠폰이 등록되었습니다!', 'success');
    };
    const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '% 할인' : c.discountType === 'shipping' ? '무료배송' : c.discountValue.toLocaleString() + '원 할인';

    /* ── 캐쉬 ── */
    const cashBalance = ref(0);
    const cashHistory = ref([]);
    const cashPager = mkPager();
    const chargeAmount = ref('');
    const loadCash = async () => {
      if (cashHistory.value.length) return;
      try { const res = await window.axiosApi.get('my/cash.json'); cashBalance.value = res.data.balance; cashHistory.value = res.data.history; }
      catch (e) {}
    };
    const addCash = () => {
      const amount = parseInt(String(chargeAmount.value).replace(/,/g, ''), 10);
      if (!amount || amount < 1000) { props.showToast('최소 1,000원 이상 충전 가능합니다.', 'error'); return; }
      cashBalance.value += amount;
      cashHistory.value.unshift({ cashId: Date.now(), date: new Date().toISOString().slice(0, 10), type: '충전', amount, desc: '직접 충전', balance: cashBalance.value });
      chargeAmount.value = ''; cashPager.page = 1;
      props.showToast(amount.toLocaleString() + '원이 충전되었습니다!', 'success');
    };

    /* ── 문의 ── */
    const inquiries = ref([]);
    const inquiryPager = mkPager();
    const expandedInquiry = ref(null);
    const loadInquiries = async () => {
      if (inquiries.value.length) return;
      try { const res = await window.axiosApi.get('my/inquiries.json'); inquiries.value = res.data; }
      catch (e) { inquiries.value = []; }
    };
    const cancelInquiry = async id => {
      const ok = await props.showConfirm('문의 취소', '이 문의를 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const item = inquiries.value.find(x => x.inquiryId === id);
      if (item) { item.status = '취소됨'; }
      props.showToast('문의가 취소되었습니다.', 'success');
    };
    const inquiryStatusColor = s => ({ '요청': '#3b82f6', '처리중': '#f97316', '답변완료': '#22c55e', '취소됨': '#9ca3af' }[s] || '#9ca3af');

    /* ── 채팅 ── */
    const chats = ref([]);
    const chatPager = mkPager();
    const expandedChat = ref(null);
    const loadChats = async () => {
      if (chats.value.length) return;
      try { const res = await window.axiosApi.get('my/chats.json'); chats.value = res.data; }
      catch (e) { chats.value = []; }
    };
    const openChat = chat => { chat.unread = 0; expandedChat.value = expandedChat.value === chat.chatId ? null : chat.chatId; };

    /* ── 탭 카운트 ── */
    const tabCounts = computed(() => ({
      orders:    orders.value.length,
      cart:      props.cartCount,
      coupons:   coupons.value.filter(c => !c.used).length,
      cash:      null,
      inquiries: inquiries.value.filter(q => q.status === '요청' || q.status === '처리중').length,
      chats:     chats.value.reduce((s, c) => s + (c.unread || 0), 0),
    }));

    const TABS = [
      { id: 'orders',    label: '주문',    icon: '📦' },
      { id: 'cart',      label: '장바구니', icon: '🛒' },
      { id: 'coupons',   label: '쿠폰',    icon: '🎟️' },
      { id: 'cash',      label: '캐쉬',    icon: '💰' },
      { id: 'inquiries', label: '문의',    icon: '📩' },
      { id: 'chats',     label: '채팅',    icon: '💬' },
    ];

    /* ── 탭 전환 시 데이터 로드 ── */
    watch(tab, async t => {
      if (t === 'orders')    await loadOrders();
      if (t === 'coupons')   await loadCoupons();
      if (t === 'cash')      await loadCash();
      if (t === 'inquiries') await loadInquiries();
      if (t === 'chats')     await loadChats();
    });

    onMounted(async () => {
      /* 주문 로드 + 나머지 카운트용 사전 로드 */
      await loadOrders();
      loadCoupons();
      loadCash();
      loadInquiries();
      loadChats();
    });

    /* ── 장바구니 금액 ── */
    const cartTotal = computed(() => props.cart.reduce((s, i) => {
      const p = parseInt(String(i.product.price).replace(/[^0-9]/g, ''), 10);
      return s + p * i.qty;
    }, 0));

    return {
      TABS, tab, tabCounts,
      ORDER_FLOW, orderStatusLabel, flowHelpOpen,
      CANCELABLE, SHOW_COURIER, flowIndex, statusColor,
      orders, orderPager, cancelOrder, openTracking,
      coupons, couponPager, couponCode, addCoupon, discountLabel,
      cashBalance, cashHistory, cashPager, chargeAmount, addCash,
      inquiries, inquiryPager, expandedInquiry, cancelInquiry, inquiryStatusColor,
      chats, chatPager, expandedChat, openChat,
      cartTotal,
      paginate, totalPages, pageRange,
    };
  },
  template: /* html */ `
<div style="padding:24px 20px;max-width:960px;margin:0 auto;">

  <!-- 헤더 -->
  <div style="margin-bottom:24px;">
    <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">My Account</div>
    <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);margin-top:4px;">마이페이지</h1>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:4px;">주문, 쿠폰, 캐쉬, 문의를 한곳에서 관리하세요</p>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:4px;margin-bottom:24px;overflow-x:auto;scrollbar-width:none;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;">
    <button v-for="t in TABS" :key="t.id" @click="tab=t.id"
      style="padding:8px 14px;border:none;cursor:pointer;font-size:0.85rem;font-weight:600;white-space:nowrap;border-radius:8px;transition:all 0.2s;display:flex;align-items:center;gap:5px;"
      :style="tab===t.id
        ? 'background:var(--blue);color:#fff;box-shadow:0 2px 8px rgba(59,130,246,0.4);'
        : 'background:transparent;color:var(--text-muted);'">
      <span>{{ t.icon }}</span>
      <span>{{ t.label }}</span>
      <span v-if="tabCounts[t.id] > 0"
        style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;font-size:0.7rem;"
        :style="tab===t.id ? 'background:rgba(255,255,255,0.3);color:#fff;' : 'background:var(--blue);color:#fff;'">
        {{ tabCounts[t.id] }}
      </span>
    </button>
  </div>

  <!-- ── 주문 탭 ── -->
  <div v-if="tab==='orders'">

    <!-- 주문 상태 흐름 차트 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;overflow-x:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;">주문 처리 흐름</div>
        <button type="button" @click="flowHelpOpen = true" aria-label="주문 처리 흐름 도움말" title="도움말"
          style="flex-shrink:0;width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg-base);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--blue);transition:background 0.15s,border-color 0.15s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;align-items:center;min-width:540px;">
        <template v-for="(step, si) in ORDER_FLOW" :key="step.status">
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
            <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:6px;transition:all 0.2s;"
              :style="orders.filter(o=>o.status===step.status).length>0
                ? 'background:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,0.25);'
                : 'background:var(--bg-base);border:2px solid var(--border);'">
              {{ step.icon }}
            </div>
            <div style="font-size:0.72rem;font-weight:600;text-align:center;white-space:nowrap;"
              :style="orders.filter(o=>o.status===step.status).length>0 ? 'color:var(--blue);' : 'color:var(--text-muted);'">
              {{ step.label || step.status }}
            </div>
            <div v-if="orders.filter(o=>o.status===step.status).length>0"
              style="font-size:0.68rem;font-weight:700;color:var(--blue);margin-top:2px;">
              {{ orders.filter(o=>o.status===step.status).length }}건
            </div>
          </div>
          <div v-if="si < ORDER_FLOW.length-1"
            style="font-size:1rem;color:var(--border);flex-shrink:0;margin:0 2px;padding-bottom:20px;">›</div>
        </template>
      </div>
    </div>

    <PagerHeader :total="orders.length" :pager="orderPager" />
    <div v-if="!orders.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">주문 내역이 없습니다.</div>
    <div v-for="o in paginate(orders, orderPager)" :key="o.orderId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;">

      <!-- 주문 헤더 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ o.orderId }}</span>
          <span style="margin-left:10px;font-size:0.8rem;color:var(--text-muted);">{{ o.orderDate }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <!-- 주문취소 버튼: 주문완료/결제완료 -->
          <button v-if="CANCELABLE.includes(o.status)" @click="cancelOrder(o.orderId)"
            style="padding:5px 12px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.78rem;font-weight:600;">
            주문취소
          </button>
          <span style="font-size:0.78rem;font-weight:700;padding:5px 12px;border-radius:20px;color:#fff;"
            :style="'background:' + statusColor(o.status)">{{ orderStatusLabel(o.status) }}</span>
        </div>
      </div>

      <!-- 상품 목록 -->
      <div v-for="item in o.items" :key="item.productName" style="display:flex;align-items:center;gap:10px;padding:6px 0;">
        <span style="font-size:1.4rem;">{{ item.emoji }}</span>
        <div style="flex:1;">
          <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
        </div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
      </div>

      <!-- 합계 + 택배 정보 -->
      <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div v-if="SHOW_COURIER.includes(o.status) && o.courier" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.8rem;color:var(--text-muted);">🚚 {{ o.courier }}</span>
            <button @click="openTracking(o.courier, o.trackingNo)"
              style="padding:3px 10px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.15s;"
              onmouseover="this.style.background='var(--blue)';this.style.color='#fff';"
              onmouseout="this.style.background='transparent';this.style.color='var(--blue)';">
              {{ o.trackingNo }}
            </button>
          </div>
          <div v-else style="flex:1;"></div>
          <span style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">
            총 <span style="color:var(--blue);">{{ o.totalPrice.toLocaleString() }}원</span>
          </span>
        </div>
      </div>
    </div>
    <Pagination :total="orders.length" :pager="orderPager" />
  </div>

  <!-- ── 장바구니 탭 ── -->
  <div v-else-if="tab==='cart'">
    <div style="margin-bottom:16px;font-size:0.88rem;color:var(--text-secondary);">총 {{ cart.length }}개 상품 ({{ cartTotal.toLocaleString() }}원)</div>
    <div v-if="!cart.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">장바구니가 비어있습니다.</div>
    <div v-for="(item, idx) in cart" :key="idx"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;">
      <span style="font-size:2rem;">{{ item.product.emoji }}</span>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ item.product.productName }}</div>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <span style="background:var(--blue-dim);color:var(--blue);font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;">{{ item.color.name }}</span>
          <span style="background:var(--blue-dim);color:var(--blue);font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;">{{ item.size }}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button @click="updateCartQty(idx,-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;font-size:0.9rem;color:var(--text-primary);">-</button>
        <span style="min-width:24px;text-align:center;font-weight:600;">{{ item.qty }}</span>
        <button @click="updateCartQty(idx,1)"  style="width:28px;height:28px;border:1px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;font-size:0.9rem;color:var(--text-primary);">+</button>
      </div>
      <div style="min-width:80px;text-align:right;font-weight:700;color:var(--blue);font-size:0.9rem;">
        {{ (parseInt(item.product.price.replace(/[^0-9]/g,''),10) * item.qty).toLocaleString() }}원
      </div>
      <button @click="removeFromCart(idx)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1rem;padding:4px;">✕</button>
    </div>
    <div v-if="cart.length" style="text-align:right;margin-top:8px;">
      <button @click="navigate('cart')" class="btn-blue" style="padding:12px 28px;">장바구니 페이지로</button>
    </div>
  </div>

  <!-- ── 쿠폰 탭 ── -->
  <div v-else-if="tab==='coupons'">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
      <input v-model="couponCode" type="text" placeholder="쿠폰 코드 입력 (예: SPRING5000)" @keyup.enter="addCoupon"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;text-transform:uppercase;">
      <button @click="addCoupon" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">쿠폰 등록</button>
    </div>
    <PagerHeader :total="coupons.length" :pager="couponPager" />
    <div v-if="!coupons.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">보유 쿠폰이 없습니다.</div>
    <div v-for="c in paginate(coupons, couponPager)" :key="c.couponId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;"
      :style="c.used?'opacity:0.5;':''">
      <div style="font-size:2rem;">🎟️</div>
      <div style="flex:1;">
        <div style="font-weight:700;color:var(--text-primary);">{{ c.name }}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">코드: {{ c.code }} · {{ c.minOrder > 0 ? c.minOrder.toLocaleString()+'원 이상 구매 시' : '최소금액 없음' }} · 만료: {{ c.expiry }}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.1rem;font-weight:800;color:var(--blue);">{{ discountLabel(c) }}</div>
        <div style="font-size:0.78rem;font-weight:600;margin-top:4px;" :style="c.used?'color:#9ca3af;':'color:#22c55e;'">{{ c.used ? '사용됨' : '사용 가능' }}</div>
      </div>
    </div>
    <Pagination :total="coupons.length" :pager="couponPager" />
  </div>

  <!-- ── 캐쉬 탭 ── -->
  <div v-else-if="tab==='cash'">
    <div style="background:linear-gradient(135deg,var(--blue),var(--green));border-radius:var(--radius);padding:24px;margin-bottom:20px;color:#fff;">
      <div style="font-size:0.85rem;font-weight:600;opacity:0.85;">보유 캐쉬</div>
      <div style="font-size:2.2rem;font-weight:900;margin-top:4px;">{{ cashBalance.toLocaleString() }}<span style="font-size:1rem;margin-left:4px;">원</span></div>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
      <input v-model="chargeAmount" type="number" placeholder="충전 금액 입력 (최소 1,000원)" @keyup.enter="addCash"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;">
      <button @click="addCash" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">충전하기</button>
    </div>
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
        {{ h.type === '충전' ? '↑' : '↓' }}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.88rem;color:var(--text-primary);">{{ h.desc }}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ h.date }}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:800;font-size:0.95rem;" :style="h.type==='충전'?'color:#22c55e;':'color:#ef4444;'">
          {{ h.type==='충전' ? '+' : '' }}{{ h.amount.toLocaleString() }}원
        </div>
      </div>
    </div>
    <Pagination :total="cashHistory.length" :pager="cashPager" />
  </div>

  <!-- ── 문의 탭 ── -->
  <div v-else-if="tab==='inquiries'">
    <PagerHeader :total="inquiries.length" :pager="inquiryPager" />
    <div v-if="!inquiries.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">문의 내역이 없습니다.</div>
    <div v-for="q in paginate(inquiries, inquiryPager)" :key="q.inquiryId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="flex:1;cursor:pointer;" @click="expandedInquiry = expandedInquiry===q.inquiryId ? null : q.inquiryId">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:0.75rem;font-weight:700;padding:3px 8px;border-radius:20px;color:#fff;"
              :style="'background:'+inquiryStatusColor(q.status)">{{ q.status }}</span>
            <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.category }}</span>
            <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.date }}</span>
          </div>
          <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">{{ q.title }}</div>
        </div>
        <button v-if="q.status==='요청'" @click="cancelInquiry(q.inquiryId)"
          style="padding:6px 14px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.8rem;font-weight:600;white-space:nowrap;">취소</button>
      </div>
      <div v-if="expandedInquiry===q.inquiryId" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
        <div style="background:var(--bg-base);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">{{ q.content }}</div>
        <div v-if="q.answer" style="background:var(--blue-dim);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-primary);">
          <span style="font-size:0.78rem;font-weight:700;color:var(--blue);display:block;margin-bottom:4px;">📩 답변</span>
          {{ q.answer }}
        </div>
      </div>
    </div>
    <Pagination :total="inquiries.length" :pager="inquiryPager" />
  </div>

  <!-- ── 채팅 탭 ── -->
  <div v-else-if="tab==='chats'">
    <PagerHeader :total="chats.length" :pager="chatPager" />
    <div v-if="!chats.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">채팅 내역이 없습니다.</div>
    <div v-for="c in paginate(chats, chatPager)" :key="c.chatId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden;">
      <div style="padding:16px;cursor:pointer;display:flex;align-items:center;gap:12px;" @click="openChat(c)">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">💬</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ c.subject }}</span>
            <span v-if="c.unread>0" style="background:var(--blue);color:#fff;font-size:0.7rem;padding:1px 7px;border-radius:20px;font-weight:700;">{{ c.unread }}</span>
            <span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;"
              :style="c.status==='진행중'?'background:#dcfce7;color:#166534;':'background:var(--blue-dim);color:var(--text-muted);'">{{ c.status }}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ c.lastMsg || '새 채팅' }}</div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ c.date }}</div>
      </div>
      <div v-if="expandedChat===c.chatId" style="padding:0 16px 16px;border-top:1px solid var(--border);">
        <div v-for="(msg, mi) in c.messages" :key="mi"
          style="display:flex;margin-top:10px;"
          :style="msg.from==='user'?'justify-content:flex-end;':''">
          <div style="max-width:75%;padding:10px 14px;border-radius:16px;font-size:0.85rem;line-height:1.5;"
            :style="msg.from==='user'?'background:var(--blue);color:#fff;border-bottom-right-radius:4px;':'background:var(--bg-base);color:var(--text-primary);border-bottom-left-radius:4px;'">
            <div>{{ msg.text }}</div>
            <div style="font-size:0.72rem;margin-top:4px;text-align:right;"
              :style="msg.from==='user'?'color:rgba(255,255,255,0.7);':'color:var(--text-muted);'">{{ msg.time }}</div>
          </div>
        </div>
      </div>
    </div>
    <Pagination :total="chats.length" :pager="chatPager" />
  </div>

  <Teleport to="body">
  <div v-if="flowHelpOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;"
    @click.self="flowHelpOpen=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:460px;max-height:88vh;overflow-y:auto;padding:26px 24px 22px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:1px solid var(--border);" @click.stop role="dialog" aria-modal="true" aria-labelledby="flow-help-title">
      <button type="button" @click="flowHelpOpen=false" aria-label="닫기"
        style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;font-size:1.25rem;line-height:1;color:var(--text-muted);padding:4px;">✕</button>
      <h2 id="flow-help-title" style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0 32px 8px 0;">주문 처리 흐름 안내</h2>
      <p style="font-size:0.82rem;color:var(--text-muted);line-height:1.55;margin:0 0 18px;">아래 순서대로 주문이 진행됩니다. 단계별 상태는 주문 목록에서 확인할 수 있습니다.</p>
      <ul style="margin:0;padding:0 0 0 1.1rem;font-size:0.86rem;color:var(--text-secondary);line-height:1.65;list-style:disc;">
        <li style="margin-bottom:10px;"><strong style="color:var(--text-primary);">주문완료</strong> — 주문이 접수된 단계입니다. 입금 또는 결제가 아직 완료되지 않았을 수 있습니다.</li>
        <li style="margin-bottom:10px;"><strong style="color:var(--text-primary);">결제완료</strong> — 입금 확인 또는 결제가 완료되어 상품 준비로 넘어갑니다.</li>
        <li style="margin-bottom:10px;"><strong style="color:var(--text-primary);">배송준비중</strong> — 주문하신 상품을 포장하고 출고 준비 중입니다.</li>
        <li style="margin-bottom:10px;"><strong style="color:var(--text-primary);">배송중</strong> — 택배사에 인계되어 배송지로 이동 중입니다.</li>
        <li style="margin-bottom:10px;"><strong style="color:var(--text-primary);">배송완료</strong> — 상품이 배송지에 도착한 상태입니다.</li>
        <li style="margin-bottom:4px;"><strong style="color:var(--text-primary);">구매확정</strong> — 상품을 수령하신 뒤 거래가 최종 확정된 단계입니다. 교환·반품 등은 각 상품 정책 및 고객센터 안내를 따릅니다.</li>
      </ul>
      <button type="button" @click="flowHelpOpen=false" class="btn-blue" style="width:100%;margin-top:20px;padding:12px;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:700;">확인</button>
    </div>
  </div>
  </Teleport>

</div>
  `,
  components: {
    PagerHeader: {
      props: ['total', 'pager'],
      template: `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
  <div style="font-size:0.85rem;color:var(--text-secondary);">총 <strong style="color:var(--text-primary);">{{ total }}</strong>건</div>
  <select v-model="pager.size" @change="pager.page=1"
    style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
    <option :value="10">10개씩</option>
    <option :value="20">20개씩</option>
    <option :value="50">50개씩</option>
  </select>
</div>`
    },
    Pagination: {
      props: ['total', 'pager'],
      setup(props) {
        const pages = Vue.computed(() => {
          const t = Math.max(1, Math.ceil(props.total / props.pager.size));
          return Array.from({ length: t }, (_, i) => i + 1);
        });
        return { pages };
      },
      template: `
<div v-if="pages.length>1" style="display:flex;gap:6px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
  <button @click="pager.page=Math.max(1,pager.page-1)" :disabled="pager.page===1"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===1?'opacity:0.4;cursor:not-allowed;':''">‹</button>
  <button v-for="p in pages" :key="p" @click="pager.page=p"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.82rem;min-width:36px;"
    :style="pager.page===p?'background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700;':'background:var(--bg-card);color:var(--text-secondary);'">{{ p }}</button>
  <button @click="pager.page=Math.min(pages.length,pager.page+1)" :disabled="pager.page===pages.length"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===pages.length?'opacity:0.4;cursor:not-allowed;':''">›</button>
</div>`
    }
  }
};

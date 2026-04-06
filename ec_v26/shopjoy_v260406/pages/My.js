/* ShopJoy - My Page */
window.My = {
  name: 'My',
  props: ['navigate', 'config', 'cart', 'cartCount', 'showToast', 'showConfirm', 'removeFromCart', 'updateCartQty'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;

    const TABS = [
      { id: 'orders',    label: '주문',    icon: '📦' },
      { id: 'cart',      label: '장바구니', icon: '🛒' },
      { id: 'coupons',   label: '쿠폰',    icon: '🎟️' },
      { id: 'cash',      label: '캐쉬',    icon: '💰' },
      { id: 'inquiries', label: '문의',    icon: '📩' },
      { id: 'chats',     label: '채팅',    icon: '💬' },
    ];

    const tab = ref('orders');

    /* ── 공통 페이지네이션 헬퍼 ── */
    const mkPager = () => reactive({ page: 1, size: 10 });
    const paginate = (list, pager) => {
      const start = (pager.page - 1) * pager.size;
      return list.slice(start, start + pager.size);
    };
    const totalPages = (list, pager) => Math.max(1, Math.ceil(list.length / pager.size));
    const pageRange = (total) => {
      const r = [];
      for (let i = 1; i <= total; i++) r.push(i);
      return r;
    };

    /* ── 주문 ── */
    const orders = ref([]);
    const orderPager = mkPager();
    const loadOrders = async () => {
      if (orders.value.length) return;
      try {
        const res = await window.axiosApi.get('my/orders.json');
        orders.value = res.data;
      } catch (e) { orders.value = []; }
    };
    const statusColor = s => ({ '주문완료': '#3b82f6', '배송중': '#f97316', '배송완료': '#22c55e', '취소됨': '#9ca3af' }[s] || '#9ca3af');

    /* ── 쿠폰 ── */
    const coupons = ref([]);
    const couponPager = mkPager();
    const couponCode = ref('');
    const loadCoupons = async () => {
      if (coupons.value.length) return;
      try {
        const res = await window.axiosApi.get('my/coupons.json');
        coupons.value = res.data;
      } catch (e) { coupons.value = []; }
    };
    const addCoupon = () => {
      const code = couponCode.value.trim().toUpperCase();
      if (!code) { props.showToast('쿠폰 코드를 입력하세요.', 'error'); return; }
      if (coupons.value.find(c => c.code === code)) { props.showToast('이미 등록된 쿠폰입니다.', 'error'); return; }
      const newCoupon = {
        couponId: Date.now(), code,
        name: '추가 쿠폰 (' + code + ')',
        discountType: 'amount', discountValue: 3000,
        minOrder: 30000, expiry: '2026-12-31', used: false
      };
      coupons.value.unshift(newCoupon);
      couponCode.value = '';
      couponPager.page = 1;
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
      try {
        const res = await window.axiosApi.get('my/cash.json');
        cashBalance.value = res.data.balance;
        cashHistory.value = res.data.history;
      } catch (e) {}
    };
    const addCash = () => {
      const amount = parseInt(String(chargeAmount.value).replace(/,/g, ''), 10);
      if (!amount || amount < 1000) { props.showToast('최소 1,000원 이상 충전 가능합니다.', 'error'); return; }
      cashBalance.value += amount;
      cashHistory.value.unshift({
        cashId: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: '충전', amount, desc: '직접 충전',
        balance: cashBalance.value
      });
      chargeAmount.value = '';
      cashPager.page = 1;
      props.showToast(amount.toLocaleString() + '원이 충전되었습니다!', 'success');
    };

    /* ── 문의 ── */
    const inquiries = ref([]);
    const inquiryPager = mkPager();
    const expandedInquiry = ref(null);
    const loadInquiries = async () => {
      if (inquiries.value.length) return;
      try {
        const res = await window.axiosApi.get('my/inquiries.json');
        inquiries.value = res.data;
      } catch (e) { inquiries.value = []; }
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
      try {
        const res = await window.axiosApi.get('my/chats.json');
        chats.value = res.data;
      } catch (e) { chats.value = []; }
    };
    const openChat = chat => {
      chat.unread = 0;
      expandedChat.value = expandedChat.value === chat.chatId ? null : chat.chatId;
    };

    /* ── 탭 전환 시 데이터 로드 ── */
    watch(tab, async t => {
      if (t === 'orders')    await loadOrders();
      if (t === 'coupons')   await loadCoupons();
      if (t === 'cash')      await loadCash();
      if (t === 'inquiries') await loadInquiries();
      if (t === 'chats')     await loadChats();
    });

    onMounted(() => loadOrders());

    /* ── 장바구니 금액 ── */
    const cartTotal = computed(() => props.cart.reduce((s, i) => {
      const p = parseInt(String(i.product.price).replace(/[^0-9]/g, ''), 10);
      return s + p * i.qty;
    }, 0));

    return {
      TABS, tab,
      orders, orderPager, statusColor,
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
    <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">마이페이지</div>
    <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);margin-top:4px;">내 계정</h1>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:4px;">주문, 쿠폰, 캐쉬, 문의를 한곳에서 관리하세요</p>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:24px;overflow-x:auto;scrollbar-width:none;">
    <button v-for="t in TABS" :key="t.id" @click="tab=t.id"
      style="padding:10px 16px;border:none;background:none;cursor:pointer;font-size:0.88rem;font-weight:600;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.2s;"
      :style="tab===t.id ? 'color:var(--blue);border-bottom-color:var(--blue);' : 'color:var(--text-muted);'">
      {{ t.icon }} {{ t.label }}
      <span v-if="t.id==='cart' && cartCount>0"
        style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:var(--blue);color:#fff;border-radius:50%;font-size:0.7rem;margin-left:4px;">{{ cartCount }}</span>
    </button>
  </div>

  <!-- ── 주문 탭 ── -->
  <div v-if="tab==='orders'">
    <PagerHeader :total="orders.length" :pager="orderPager" />
    <div v-if="!orders.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">주문 내역이 없습니다.</div>
    <div v-for="o in paginate(orders, orderPager)" :key="o.orderId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ o.orderId }}</span>
          <span style="margin-left:10px;font-size:0.8rem;color:var(--text-muted);">{{ o.orderDate }}</span>
        </div>
        <span style="font-size:0.8rem;font-weight:700;padding:4px 10px;border-radius:20px;color:#fff;"
          :style="'background:' + statusColor(o.status)">{{ o.status }}</span>
      </div>
      <div v-for="item in o.items" :key="item.productName" style="display:flex;align-items:center;gap:10px;padding:6px 0;">
        <span style="font-size:1.4rem;">{{ item.emoji }}</span>
        <div style="flex:1;">
          <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
        </div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
      </div>
      <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;display:flex;justify-content:flex-end;">
        <span style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">총 <span style="color:var(--blue);">{{ o.totalPrice.toLocaleString() }}원</span></span>
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
    <!-- 쿠폰 추가 -->
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
    <!-- 잔액 + 충전 -->
    <div style="background:linear-gradient(135deg,var(--blue),var(--green));border-radius:var(--radius);padding:24px;margin-bottom:20px;color:#fff;">
      <div style="font-size:0.85rem;font-weight:600;opacity:0.85;">보유 캐쉬</div>
      <div style="font-size:2.2rem;font-weight:900;margin-top:4px;">{{ cashBalance.toLocaleString() }}<span style="font-size:1rem;margin-left:4px;">원</span></div>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
      <input v-model="chargeAmount" type="number" placeholder="충전 금액 입력 (최소 1,000원)" @keyup.enter="addCash"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;">
      <button @click="addCash" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">충전하기</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
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
      <!-- 상세 -->
      <div v-if="expandedInquiry===q.inquiryId" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
        <div style="background:var(--bg-base);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">
          {{ q.content }}
        </div>
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
      <!-- 메시지 목록 -->
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

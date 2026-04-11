/* ShopJoy - My 쿠폰 페이지 (#page=myCoupon) */
window.MyCoupon = {
  name: 'MyCoupon',
  props: ['navigate', 'cartCount', 'showToast'],
  setup(props) {
    const { reactive, onMounted } = Vue;
    const myStore = window.useMyStore();
    const { coupons, couponCode } = Pinia.storeToRefs(myStore);

    const couponPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    const addCoupon = () => {
      const code = couponCode.value.trim().toUpperCase();
      if (!code) { props.showToast('쿠폰 코드를 입력하세요.', 'error'); return; }
      if (coupons.value.find(c => c.code === code)) { props.showToast('이미 등록된 쿠폰입니다.', 'error'); return; }
      coupons.value.unshift({
        couponId: Date.now(), code, name: '추가 쿠폰 (' + code + ')',
        discountType: 'amount', discountValue: 3000, minOrder: 30000, expiry: '2026-12-31', used: false
      });
      couponCode.value = ''; couponPager.page = 1;
      props.showToast('쿠폰이 등록되었습니다!', 'success');
    };

    onMounted(async () => {
      await myStore.loadCoupons();
      myStore.loadOrders();
    });

    return { myStore, coupons, couponCode, couponPager, paginate, addCoupon };
  },
  template: /* html */ `
<MyLayout :navigate="navigate" :cart-count="cartCount" active-page="myCoupon">

  <!-- 쿠폰 등록 -->
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
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">
        코드: {{ c.code }} · {{ c.minOrder > 0 ? c.minOrder.toLocaleString()+'원 이상 구매 시' : '최소금액 없음' }} · 만료: {{ c.expiry }}
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">
        <span style="font-size:0.72rem;padding:1px 8px;border-radius:10px;font-weight:600;"
          :style="c.discountType==='shipping' ? 'background:#dbeafe;color:#1d4ed8;' : 'background:#dcfce7;color:#15803d;'">
          {{ c.discountType==='shipping' ? '배송비 할인' : '상품 할인' }}
        </span>
        <span v-if="c.applicableTo && c.discountType!=='shipping'"
          style="font-size:0.72rem;padding:1px 8px;border-radius:10px;font-weight:600;background:var(--bg-base);color:var(--text-secondary);border:1px solid var(--border);">
          {{ c.applicableTo }}
        </span>
      </div>
      <template v-if="c.used && c.usedOrderId">
        <div style="font-size:0.73rem;color:var(--text-muted);margin-top:4px;">
          적용 주문: <span style="font-weight:600;color:var(--text-secondary);">{{ c.usedOrderId }}</span>
        </div>
        <div v-if="myStore.getCouponUsedOrderItems(c)" style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;">
          <span v-for="(item, ii) in myStore.getCouponUsedOrderItems(c)" :key="ii"
            style="font-size:0.68rem;padding:1px 6px;border-radius:8px;background:var(--bg-base);color:var(--text-muted);border:1px solid var(--border);">
            {{ item.emoji }} {{ item.prodNm }}
          </span>
        </div>
      </template>
    </div>
    <div style="text-align:right;">
      <div style="font-size:1.1rem;font-weight:800;color:var(--blue);">{{ myStore.discountLabel(c) }}</div>
      <div style="font-size:0.78rem;font-weight:600;margin-top:4px;" :style="c.used?'color:#9ca3af;':'color:#22c55e;'">
        {{ c.used ? '사용됨' : '사용 가능' }}
      </div>
    </div>
  </div>

  <Pagination :total="coupons.length" :pager="couponPager" />

</MyLayout>
  `,
  components: {
    MyLayout:    window.MyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};

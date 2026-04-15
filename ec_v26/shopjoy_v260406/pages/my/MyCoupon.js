/* ShopJoy - My 쿠폰 페이지 (#page=myCoupon) */
window.MyCoupon = {
  name: 'MyCoupon',
  props: ['navigate', 'cartCount', 'showToast'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const myStore = window.useFrontMyStore();
    const { coupons, couponCode } = Pinia.storeToRefs(myStore);

    const couponPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    /* ── 탭: 미사용 | 사용 ── */
    const activeTab = ref('unused'); // 'unused' | 'used'

    /* ── 날짜 필터 ── */
    const { inRange, onDateSearch } = window.myDateFilterHelper();

    /* ── 탭 + 날짜 필터 적용 목록 ── */
    const dateFilteredCoupons = computed(() =>
      coupons.value
        .filter(c => activeTab.value === 'unused' ? !c.used : c.used)
        .filter(c => inRange(c.regDate))
    );

    const unusedCount = computed(() => coupons.value.filter(c => !c.used).length);
    const usedCount   = computed(() => coupons.value.filter(c => c.used).length);

    const addCoupon = () => {
      const code = couponCode.value.trim().toUpperCase();
      if (!code) { props.showToast('쿠폰 코드를 입력하세요.', 'error'); return; }
      if (coupons.value.find(c => c.code === code)) { props.showToast('이미 등록된 쿠폰입니다.', 'error'); return; }
      coupons.value.unshift({
        couponId: Date.now(), code, name: '추가 쿠폰 (' + code + ')',
        discountType: 'amount', discountValue: 3000, minOrder: 30000,
        expiry: '2026-12-31', used: false,
        regDate: new Date().toISOString().slice(0,10), regSource: '쿠폰 코드 입력', regMethod: '수동',
      });
      couponCode.value = ''; couponPager.page = 1;
      props.showToast('쿠폰이 등록되었습니다!', 'success');
    };

    const onTabChange = tab => { activeTab.value = tab; couponPager.page = 1; };

    onMounted(async () => {
      await myStore.loadCoupons();
      myStore.loadOrders();
    });

    return {
      myStore, coupons, couponCode, couponPager, paginate,
      addCoupon, dateFilteredCoupons, onDateSearch,
      activeTab, unusedCount, usedCount, onTabChange,
    };
  },
  template: /* html */ `
<FrontMyLayout :navigate="navigate" :cart-count="cartCount" active-page="myCoupon">

  <MyDateFilter @search="onDateSearch" />

  <!-- 쿠폰 등록 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
    <input v-model="couponCode" type="text" placeholder="쿠폰 코드 입력 (예: SPRING5000)" @keyup.enter="addCoupon"
      style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;text-transform:uppercase;">
    <button @click="addCoupon" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">쿠폰 등록</button>
  </div>

  <!-- 탭 -->
  <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:20px;">
    <button @click="onTabChange('unused')"
      :style="{
        padding:'10px 24px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.88rem', fontWeight: activeTab==='unused' ? '700' : '500',
        color: activeTab==='unused' ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: activeTab==='unused' ? '2px solid var(--text-primary)' : '2px solid transparent',
        marginBottom: '-2px',
      }">미사용 <span style="font-size:0.8rem;margin-left:2px;">({{ unusedCount }})</span></button>
    <button @click="onTabChange('used')"
      :style="{
        padding:'10px 24px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.88rem', fontWeight: activeTab==='used' ? '700' : '500',
        color: activeTab==='used' ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: activeTab==='used' ? '2px solid var(--text-primary)' : '2px solid transparent',
        marginBottom: '-2px',
      }">사용 <span style="font-size:0.8rem;margin-left:2px;">({{ usedCount }})</span></button>
  </div>

  <PagerHeader :total="dateFilteredCoupons.length" :pager="couponPager" />
  <div v-if="!dateFilteredCoupons.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    {{ activeTab==='unused' ? '사용 가능한 쿠폰이 없습니다.' : '사용된 쿠폰이 없습니다.' }}
  </div>

  <div v-for="c in paginate(dateFilteredCoupons, couponPager)" :key="c.couponId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;display:flex;align-items:flex-start;gap:14px;">

    <!-- 쿠폰 아이콘 -->
    <div style="font-size:2rem;flex-shrink:0;margin-top:2px;">🎟️</div>

    <!-- 메인 정보 -->
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">{{ c.name }}</div>

      <!-- 배지 -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-size:0.72rem;padding:2px 8px;border-radius:10px;font-weight:600;"
          :style="c.discountType==='shipping' ? 'background:#dbeafe;color:#1d4ed8;' : 'background:#dcfce7;color:#15803d;'">
          {{ c.discountType==='shipping' ? '배송비 할인' : '상품 할인' }}
        </span>
        <span v-if="c.applicableTo && c.discountType!=='shipping'"
          style="font-size:0.72rem;padding:2px 8px;border-radius:10px;font-weight:600;background:var(--bg-base);color:var(--text-secondary);border:1px solid var(--border);">
          {{ c.applicableTo }}
        </span>
        <span style="font-size:0.72rem;padding:2px 8px;border-radius:10px;font-weight:600;"
          :style="c.regMethod==='자동' ? 'background:#ede9fe;color:#6d28d9;' : 'background:#fef3c7;color:#92400e;'">
          {{ c.regMethod || '수동' }}
        </span>
      </div>

      <!-- 기본 정보 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:3px 16px;margin-bottom:6px;">
        <div style="font-size:0.78rem;color:var(--text-muted);">
          쿠폰코드 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;font-family:monospace;letter-spacing:.5px;">{{ c.code }}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);">
          쿠폰발급번호 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ String(c.couponId).padStart(8, '0') }}</span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);">
          만료 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.expiry }}</span>
        </div>
        <div v-if="c.minOrder>0" style="font-size:0.78rem;color:var(--text-muted);">
          최소주문 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.minOrder.toLocaleString() }}원 이상</span>
        </div>
        <div v-if="c.regDate" style="font-size:0.78rem;color:var(--text-muted);">
          등록일 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.regDate }}</span>
        </div>
        <div v-if="c.regSource" style="font-size:0.78rem;color:var(--text-muted);">
          등록출처 <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.regSource }}</span>
        </div>
      </div>

      <!-- 사용 정보 (사용됨 탭) -->
      <div v-if="c.used" style="margin-top:6px;padding:8px 12px;background:var(--bg-base);border-radius:6px;border:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px 20px;">
        <div v-if="c.usedOrderId" style="font-size:0.78rem;color:var(--text-muted);">
          주문id <span style="font-weight:600;color:var(--blue);margin-left:4px;">{{ c.usedOrderId }}</span>
        </div>
        <div v-if="c.usedOrderItemId" style="font-size:0.78rem;color:var(--text-muted);">
          주문상품id <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.usedOrderItemId }}</span>
        </div>
        <div v-if="c.usedProductId" style="font-size:0.78rem;color:var(--text-muted);">
          상품id <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.usedProductId }}</span>
        </div>
        <div v-if="c.usedClaimId" style="font-size:0.78rem;color:var(--text-muted);">
          클레임id <span style="font-weight:600;color:var(--text-secondary);margin-left:4px;">{{ c.usedClaimId }}</span>
        </div>
        <div v-if="myStore.getCouponUsedOrderItems(c)" style="width:100%;display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">
          <span v-for="(item, ii) in myStore.getCouponUsedOrderItems(c)" :key="ii"
            style="font-size:0.68rem;padding:1px 6px;border-radius:8px;background:var(--bg-card);color:var(--text-muted);border:1px solid var(--border);">
            {{ item.emoji }} {{ item.prodNm }}
          </span>
        </div>
      </div>
    </div>

    <!-- 할인금액 + 상태 -->
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-size:1.1rem;font-weight:800;color:var(--blue);">{{ myStore.discountLabel(c) }}</div>
      <div style="font-size:0.75rem;font-weight:600;margin-top:4px;"
        :style="c.used ? 'color:#9ca3af;' : 'color:#22c55e;'">
        {{ c.used ? '사용됨' : '사용 가능' }}
      </div>
    </div>
  </div>

  <Pagination :total="dateFilteredCoupons.length" :pager="couponPager" />

</FrontMyLayout>
  `,
  components: {
    FrontMyLayout:    window.frontMyLayout,
    PagerHeader: window.PagerHeader,
    Pagination:  window.Pagination,
  }
};

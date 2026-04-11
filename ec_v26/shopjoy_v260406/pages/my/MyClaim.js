/* ShopJoy - My 취소/반품/교환 페이지 (#page=myClaim) */
window.MyClaim = {
  name: 'MyClaim',
  props: ['navigate', 'config', 'cartCount', 'showToast', 'showConfirm'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const myStore = window.useMyStore();
    const { claims, claimFilter, filteredClaims, orders } = Pinia.storeToRefs(myStore);

    const claimPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    const authUser = computed(() => window.shopjoyAuth.state.user);
    const findProduct = name => props.config.products.find(p => p.prodNm === name) || null;
    const openProductModal = name => {
      const p = findProduct(name);
      if (p) { myStore.productModal.product = p; myStore.productModal.show = true; }
    };
    const openCustomerModal = order => {
      myStore.customerModal.user = authUser.value;
      myStore.customerModal.order = order || null;
      myStore.customerModal.show = true;
    };
    const openOrderModal = orderId => {
      const ok = myStore.openOrderModal(orderId);
      if (!ok) props.showToast('주문 정보를 찾을 수 없습니다.', 'error');
    };

    const openTracking2 = (courier, trackingNo) => {
      const URLS = {
        'CJ대한통운': no => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
        '롯데택배':   no => `https://www.lotteglogis.com/open/tracking?invno=${no}`,
        '한진택배':   no => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
      };
      const fn = URLS[courier];
      if (fn) window.open(fn(trackingNo), '_blank', 'width=960,height=700,scrollbars=yes');
    };

    const cancelClaim = async claimId => {
      const ok = await props.showConfirm('신청 취소', '이 신청을 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const item = claims.value.find(c => c.claimId === claimId);
      if (item) {
        item.status = item.type === '취소' ? '취소완료'
          : item.type === '반품' ? '반품취소됨'
          : '교환취소됨';
        myStore.removeClaim(claimId);
      }
      props.showToast('신청이 취소되었습니다.', 'info');
    };

    onMounted(async () => {
      await myStore.loadClaims();
      myStore.loadOrders();
    });

    return {
      myStore, claims, claimFilter, filteredClaims, orders,
      claimPager, paginate,
      authUser, findProduct, openProductModal, openCustomerModal, openOrderModal,
      openTracking2, cancelClaim,
    };
  },
  template: /* html */ `
<MyLayout :navigate="navigate" :cart-count="cartCount" active-page="myClaim">

  <!-- 유형 필터 -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
    <button v-for="f in ['전체','취소','반품','교환']" :key="f"
      @click="claimFilter=f;claimPager.page=1"
      style="padding:6px 16px;border-radius:20px;cursor:pointer;font-size:0.82rem;font-weight:700;transition:all 0.15s;"
      :style="claimFilter===f
        ? 'background:var(--blue);color:#fff;border:2px solid var(--blue);'
        : 'background:var(--bg-card);color:var(--text-secondary);border:2px solid var(--border);'">
      {{ f }}
      <span v-if="f!=='전체'" style="margin-left:4px;font-size:0.75rem;opacity:0.8;">({{ claims.filter(c=>c.type===f).length }})</span>
      <span v-else style="margin-left:4px;font-size:0.75rem;opacity:0.8;">({{ claims.length }})</span>
    </button>
  </div>

  <PagerHeader :total="filteredClaims.length" :pager="claimPager" />
  <div v-if="!filteredClaims.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">해당 내역이 없습니다.</div>

  <div v-for="c in paginate(filteredClaims, claimPager)" :key="c.claimId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:14px;">

    <!-- 카드 헤더 -->
    <div class="my-order-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ c.claimId }}</span>
        <button @click="openOrderModal(c.orderId)"
          style="margin-left:8px;font-size:0.78rem;color:var(--blue);border:none;background:none;cursor:pointer;padding:0;font-weight:600;text-decoration:underline;text-underline-offset:2px;">
          주문: {{ c.orderId }}
        </button>
        <button v-if="authUser" @click="openCustomerModal(orders.find(o=>o.orderId===c.orderId))"
          style="margin-left:8px;font-size:0.78rem;font-weight:600;color:var(--text-secondary);border:none;background:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px;">
          {{ authUser.name }}
        </button>
        <div style="margin-top:4px;font-size:0.78rem;color:var(--text-muted);">
          신청일: {{ c.requestDate }}
          <span v-if="c.completeDate"> · 완료일: {{ c.completeDate }}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
        <button v-if="c.status === myStore.CLAIM_FLOWS[c.type][0]" @click="cancelClaim(c.claimId)"
          style="padding:4px 12px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.76rem;font-weight:700;white-space:nowrap;">
          신청취소
        </button>
        <span style="font-size:0.78rem;font-weight:800;padding:4px 12px;border-radius:20px;color:#fff;"
          :style="'background:' + myStore.CLAIM_TYPE_COLOR[c.type]">{{ c.type }}</span>
        <span style="font-size:0.68rem;font-weight:600;padding:2px 8px;border-radius:10px;color:#fff;opacity:0.85;"
          :style="'background:' + myStore.CLAIM_STATUS_COLOR(c.status)">{{ c.status }}</span>
      </div>
    </div>

    <!-- 진행 흐름 바 -->
    <div style="background:var(--bg-base);border-radius:8px;padding:12px 14px;margin-bottom:12px;overflow-x:auto;">
      <div style="display:flex;align-items:center;min-width:320px;">
        <template v-for="(step, si) in myStore.CLAIM_FLOWS[c.type]" :key="step">
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
            <div style="width:10px;height:10px;border-radius:50%;margin-bottom:4px;"
              :style="myStore.CLAIM_FLOWS[c.type].indexOf(c.status) >= si ? 'background:var(--blue);' : 'background:var(--border);'"></div>
            <div style="font-size:0.65rem;text-align:center;white-space:nowrap;font-weight:600;"
              :style="c.status===step ? 'color:var(--blue);font-weight:800;'
                : myStore.CLAIM_FLOWS[c.type].indexOf(c.status) > si ? 'color:var(--text-secondary);'
                : 'color:var(--text-muted);'">{{ step }}</div>
            <button v-if="c.trackingNo && step==='수거완료' && myStore.CLAIM_FLOWS[c.type].indexOf(c.status) >= myStore.CLAIM_FLOWS[c.type].indexOf('수거완료')"
              @click.stop="openTracking2(c.courier, c.trackingNo)"
              style="margin-top:4px;padding:2px 6px;border-radius:4px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;cursor:pointer;font-size:0.6rem;font-weight:700;white-space:nowrap;">↩ 수거</button>
            <button v-if="c.exchangeTrackingNo && step==='발송완료' && myStore.CLAIM_FLOWS[c.type].indexOf(c.status) >= myStore.CLAIM_FLOWS[c.type].indexOf('발송완료')"
              @click.stop="openTracking2(c.exchangeCourier, c.exchangeTrackingNo)"
              style="margin-top:3px;padding:2px 6px;border-radius:4px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;cursor:pointer;font-size:0.6rem;font-weight:700;white-space:nowrap;">📦 교환</button>
          </div>
          <div v-if="si < myStore.CLAIM_FLOWS[c.type].length-1" style="height:2px;flex:1;margin-bottom:16px;"
            :style="myStore.CLAIM_FLOWS[c.type].indexOf(c.status) > si ? 'background:var(--blue);' : 'background:var(--border);'"></div>
        </template>
      </div>
    </div>

    <!-- 상품 목록 -->
    <div v-for="(item, ii) in c.items" :key="ii"
      style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed var(--border);">
      <span style="font-size:1.4rem;">{{ item.emoji }}</span>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          <span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.prodNm }}</span>
          <button v-if="findProduct(item.prodNm)" @click="openProductModal(item.prodNm)"
            style="font-size:0.65rem;padding:0 5px;border:1px solid var(--border);border-radius:4px;background:var(--bg-base);color:var(--text-muted);cursor:pointer;font-weight:600;line-height:1.7;white-space:nowrap;">
            #{{ findProduct(item.prodNm).productId }}
          </button>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
      </div>
      <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
    </div>

    <!-- 사유 + 교환 정보 -->
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;font-size:0.82rem;">
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">사유</span>
        <span style="color:var(--text-primary);font-weight:600;">{{ c.reason }}</span>
        <span v-if="c.reasonDetail" style="color:var(--text-secondary);">· {{ c.reasonDetail }}</span>
      </div>
      <div v-if="c.exchangeSize || c.exchangeColor" style="display:flex;gap:8px;">
        <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">교환</span>
        <span style="color:var(--text-primary);">
          <span v-if="c.exchangeSize">사이즈: {{ c.exchangeSize }}</span>
          <span v-if="c.exchangeColor"> 색상: {{ c.exchangeColor }}</span>
        </span>
      </div>
      <div v-if="c.courier" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">수거</span>
        <span style="color:var(--text-primary);">{{ c.courier }}</span>
        <button v-if="c.trackingNo" @click="openTracking2(c.courier, c.trackingNo)"
          style="padding:2px 8px;border:1.5px solid var(--blue);border-radius:14px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.75rem;font-weight:700;">{{ c.trackingNo }}</button>
        <span v-if="c.pickupDate" style="color:var(--text-muted);font-size:0.78rem;">수거예정: {{ c.pickupDate }}</span>
      </div>
      <div v-if="c.exchangeCourier" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">발송</span>
        <span style="color:var(--text-primary);">{{ c.exchangeCourier }}</span>
        <button v-if="c.exchangeTrackingNo" @click="openTracking2(c.exchangeCourier, c.exchangeTrackingNo)"
          style="padding:2px 8px;border:1.5px solid #22c55e;border-radius:14px;background:transparent;color:#22c55e;cursor:pointer;font-size:0.75rem;font-weight:700;">{{ c.exchangeTrackingNo }}</button>
      </div>
      <div v-if="c.refundAmount" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:8px;border-top:1px solid var(--border);">
        <span style="color:var(--text-muted);">{{ c.type==='반품' ? '환불 예정금액' : '취소 환불금액' }}</span>
        <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">{{ c.refundAmount.toLocaleString() }}원</span>
      </div>
      <div v-if="c.refundDetails && c.refundDetails.length" style="margin-top:8px;padding:8px 10px;background:var(--bg-base);border-radius:7px;">
        <div style="font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:5px;">💸 환불 내역</div>
        <div v-for="(rd, rdi) in c.refundDetails" :key="rdi"
          style="display:flex;align-items:center;gap:6px;font-size:0.72rem;padding:2px 0;flex-wrap:wrap;">
          <span style="padding:1px 7px;border-radius:4px;font-weight:700;white-space:nowrap;flex-shrink:0;"
            :style="rd.type==='계좌환불' ? 'background:#dcfce7;color:#16a34a;'
              : rd.type==='카드취소' ? 'background:#dbeafe;color:#1d4ed8;'
              : rd.type==='캐쉬환급' ? 'background:#fef3c7;color:#d97706;'
              : rd.type==='환불처리중' ? 'background:#ffedd5;color:#ea580c;'
              : 'background:#f3f4f6;color:#6b7280;'">{{ rd.type }}</span>
          <span style="font-weight:700;color:var(--text-primary);white-space:nowrap;">{{ rd.amount.toLocaleString() }}원</span>
          <span v-if="rd.account" style="color:var(--text-secondary);white-space:nowrap;">{{ rd.account }}</span>
          <span v-if="rd.name && rd.type==='계좌환불'" style="color:var(--text-secondary);white-space:nowrap;">· {{ rd.name }}</span>
          <span style="color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ rd.datetime }}</span>
        </div>
      </div>
    </div>
  </div>
  <Pagination :total="filteredClaims.length" :pager="claimPager" />

  <Teleport to="body">
    <OrderDetailModal :show="myStore.orderDetailModal.show" :order="myStore.orderDetailModal.order" @close="myStore.orderDetailModal.show=false" />
    <ProductModal :show="myStore.productModal.show" :product="myStore.productModal.product" @close="myStore.productModal.show=false" />
    <CustomerModal :show="myStore.customerModal.show" :user="myStore.customerModal.user" :order="myStore.customerModal.order" @close="myStore.customerModal.show=false" />
  </Teleport>

</MyLayout>
  `,
  components: {
    MyLayout:         window.MyLayout,
    PagerHeader:      window.PagerHeader,
    Pagination:       window.Pagination,
    OrderDetailModal: window.OrderDetailModal,
    ProductModal:     window.ProductModal,
    CustomerModal:    window.CustomerModal,
  }
};

/* ShopJoy – components/modals/BaseModal.js
   여러 팝업 컴포넌트를 한 곳에 모아둡니다.
   My.js 의 components 블록에 등록하여 사용합니다.
*/

/* ── 주문 상세 모달 ──────────────────────────────────
   Props: show (Boolean), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.OrderDetailModal = {
  name: 'OrderDetailModal',
  props: ['show', 'order'],
  emits: ['close'],
  methods: {
    statusColor(s) {
      return ({
        '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
        '배송준비중': '#f59e0b', '배송중': '#f97316',
        '배송완료': '#22c55e', '완료': '#6b7280', '취소됨': '#9ca3af',
      })[s] || '#9ca3af';
    },
    statusLabel(s) { return s === '완료' ? '구매확정' : s; },
  },
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    @click.stop role="dialog" aria-modal="true">

    <!-- 헤더 -->
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">📦 주문 상세</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ order && order.orderId }}</div>
      </div>
      <button type="button" @click="$emit('close')" aria-label="닫기"
        style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
    </div>

    <!-- 콘텐츠 -->
    <div v-if="order" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px;">

      <!-- 주문일 / 상태 -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.82rem;color:var(--text-muted);">{{ order.orderDate }}</span>
        <span style="font-size:0.78rem;font-weight:700;padding:4px 12px;border-radius:20px;color:#fff;"
          :style="'background:' + statusColor(order.status)">{{ statusLabel(order.status) }}</span>
      </div>

      <!-- 상품 목록 -->
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">주문 상품</div>
        <div v-for="(item, i) in order.items" :key="i"
          style="display:flex;align-items:center;gap:10px;padding:8px 0;"
          :style="i < order.items.length-1 ? 'border-bottom:1px dashed var(--border);' : ''">
          <span style="font-size:1.4rem;flex-shrink:0;">{{ item.emoji }}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
            <div v-if="item.productCoupon && item.productCoupon.discount"
              style="margin-top:2px;font-size:0.7rem;color:#16a34a;">
              🎟 {{ item.productCoupon.name }} -{{ Number(item.productCoupon.discount).toLocaleString() }}원
            </div>
          </div>
          <div style="font-size:0.88rem;font-weight:700;color:var(--blue);flex-shrink:0;">{{ item.price.toLocaleString() }}원</div>
        </div>
      </div>

      <!-- 결제 정보 -->
      <div style="background:var(--bg-base);border-radius:8px;padding:12px 14px;font-size:0.82rem;display:flex;flex-direction:column;gap:6px;">
        <div v-if="order.shippingFee > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">배송비</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ order.shippingFee.toLocaleString() }}원</span>
        </div>
        <div v-if="order.shippingCoupon && Number(order.shippingCoupon.discount) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">🚚 배송비 쿠폰</span>
          <span style="font-weight:700;color:var(--blue);">-{{ Number(order.shippingCoupon.discount).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(order.cashPaid) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">💰 캐쉬 결제</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ Number(order.cashPaid).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(order.transferPaid) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">🏦 계좌이체</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ Number(order.transferPaid).toLocaleString() }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
          <span style="font-weight:700;color:var(--text-primary);">총 결제금액</span>
          <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">{{ order.totalPrice.toLocaleString() }}원</span>
        </div>
      </div>

      <!-- 택배 정보 -->
      <div v-if="order.courier && order.trackingNo"
        style="display:flex;align-items:center;gap:8px;font-size:0.8rem;padding:10px 14px;background:var(--bg-base);border-radius:8px;">
        <span style="color:var(--text-muted);">🚚 {{ order.courier }}</span>
        <span style="font-weight:600;color:var(--text-primary);">{{ order.trackingNo }}</span>
      </div>

    </div>

    <!-- 푸터 -->
    <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
      <button type="button" @click="$emit('close')" class="btn-blue"
        style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">닫기</button>
    </div>
  </div>
</div>
`,
};

/* ── 상품 상세 모달 ──────────────────────────────────
   Props: show (Boolean), product (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.ProductModal = {
  name: 'ProductModal',
  props: ['show', 'product'],
  emits: ['close'],
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    @click.stop role="dialog" aria-modal="true">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.8rem;">{{ product && product.emoji }}</span>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">{{ product && product.productName }}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">#{{ product && product.productId }}</div>
        </div>
      </div>
      <button type="button" @click="$emit('close')" aria-label="닫기"
        style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;flex-shrink:0;">✕</button>
    </div>
    <div v-if="product" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:1.2rem;font-weight:900;color:var(--blue);">{{ product.price }}</span>
        <span v-if="product.badge" style="font-size:0.72rem;font-weight:800;padding:3px 10px;border-radius:20px;background:var(--blue);color:#fff;">{{ product.badge }}</span>
      </div>
      <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;padding:10px 14px;background:var(--bg-base);border-radius:8px;">{{ product.desc }}</div>
      <div v-if="product.colors && product.colors.length">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;margin-bottom:8px;">색상</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <div v-for="col in product.colors" :key="col.name" style="display:flex;align-items:center;gap:5px;">
            <span style="width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(0,0,0,0.12);" :style="'background:'+col.hex"></span>
            <span style="font-size:0.78rem;color:var(--text-secondary);">{{ col.name }}</span>
          </div>
        </div>
      </div>
      <div v-if="product.sizes && product.sizes.length">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;margin-bottom:8px;">사이즈</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <span v-for="sz in product.sizes" :key="sz" style="padding:3px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:0.78rem;font-weight:600;color:var(--text-secondary);background:var(--bg-base);">{{ sz }}</span>
        </div>
      </div>
      <div v-if="product.tags && product.tags.length" style="display:flex;flex-wrap:wrap;gap:6px;">
        <span v-for="tag in product.tags" :key="tag" style="padding:2px 9px;border-radius:20px;font-size:0.72rem;font-weight:600;background:var(--blue-dim);color:var(--blue);">#{{ tag }}</span>
      </div>
    </div>
    <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
      <button type="button" @click="$emit('close')" class="btn-blue" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">닫기</button>
    </div>
  </div>
</div>
`,
};

/* ── 주문자 정보 모달 ─────────────────────────────────
   Props: show (Boolean), user (Object | null), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.CustomerModal = {
  name: 'CustomerModal',
  props: ['show', 'user', 'order'],
  emits: ['close'],
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:380px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    @click.stop role="dialog" aria-modal="true">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">주문자 정보</div>
          <div v-if="order" style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">{{ order.orderId }}</div>
        </div>
      </div>
      <button type="button" @click="$emit('close')" aria-label="닫기" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
    </div>
    <div v-if="user" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;">
      <div style="background:var(--bg-base);border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">이름</span>
          <span style="font-weight:700;color:var(--text-primary);font-size:0.88rem;">{{ user.name }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">연락처</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.88rem;">{{ user.phone || '-' }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">이메일</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">{{ user.email || '-' }}</span>
        </div>
      </div>
      <div v-if="order && order.paymentDetails && order.paymentDetails.length"
        style="background:var(--bg-base);border-radius:8px;padding:14px 16px;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:8px;">입금 정보</div>
        <div v-for="(pd, i) in order.paymentDetails" :key="i"
          style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"
          :style="i>0?'border-top:1px dashed var(--border);padding-top:6px;margin-top:3px;':''">
          <span style="padding:1px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;"
            :style="pd.type==='계좌이체'||pd.type==='계좌환불'?'background:#dcfce7;color:#16a34a;':pd.type==='캐쉬'?'background:#fef3c7;color:#d97706;':'background:#dbeafe;color:#1d4ed8;'">
            {{ pd.type }}</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">{{ pd.amount.toLocaleString() }}원</span>
          <span v-if="pd.account" style="color:var(--text-muted);font-size:0.78rem;">{{ pd.account }}</span>
        </div>
      </div>
    </div>
    <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
      <button type="button" @click="$emit('close')" class="btn-blue" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">닫기</button>
    </div>
  </div>
</div>
`,
};

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

/* ══════════════════════════════════════════════════════
   어드민 공통필터 팝업 선택 모달 (5종)
   Props: adminData  Emits: select(item), close
   ══════════════════════════════════════════════════════ */

/* ── 사이트 선택 모달 ── */
window.SiteSelectModal = {
  name: 'SiteSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const filtered = computed(() => props.adminData.sites.filter(s => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return s.siteName.toLowerCase().includes(k) || s.siteCode.toLowerCase().includes(k) || s.domain.toLowerCase().includes(k);
    }));
    return { kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">사이트 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="사이트코드 / 사이트명 / 도메인 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="s in filtered" :key="s.siteId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ s.siteName }}</div>
        <span class="sel-modal-item-id">{{ s.siteCode }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', s)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 판매업체 선택 모달 ── */
window.VendorSelectModal = {
  name: 'VendorSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const filtered = computed(() => props.adminData.vendors.filter(v => {
      if (v.vendorType !== '판매업체') return false;
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return v.vendorName.toLowerCase().includes(k) || v.bizNo.includes(k);
    }));
    return { kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">판매업체 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="업체명 / 사업자번호 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="v in filtered" :key="v.vendorId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ v.vendorName }}</div>
        <span class="sel-modal-item-id">{{ v.vendorId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', v)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 판매사용자 선택 모달 ── */
window.AdminUserSelectModal = {
  name: 'AdminUserSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const filtered = computed(() => props.adminData.adminUsers.filter(u => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return u.name.toLowerCase().includes(k) || u.loginId.toLowerCase().includes(k) || u.email.toLowerCase().includes(k);
    }));
    return { kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">판매사용자 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="이름 / 로그인ID / 이메일 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="u in filtered" :key="u.adminUserId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ u.name }} <span style="font-size:11px;color:#888;">({{ u.loginId }})</span></div>
        <span class="sel-modal-item-id">{{ u.adminUserId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', u)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 회원 선택 모달 ── */
window.MemberSelectModal = {
  name: 'MemberSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const filtered = computed(() => props.adminData.members.filter(m => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return m.name.toLowerCase().includes(k) || m.email.toLowerCase().includes(k) || String(m.userId).includes(k);
    }));
    return { kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">회원 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="이름 / 이메일 / ID 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="m in filtered" :key="m.userId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ m.name }} <span style="font-size:11px;color:#888;">{{ m.email }}</span></div>
        <span class="sel-modal-item-id">{{ m.userId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', m)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 주문 선택 모달 ── */
window.OrderSelectModal = {
  name: 'OrderSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const filtered = computed(() => props.adminData.orders.filter(o => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return o.orderId.toLowerCase().includes(k) || o.userName.toLowerCase().includes(k) || o.productName.toLowerCase().includes(k);
    }));
    return { kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">주문 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="주문ID / 회원명 / 상품명 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="o in filtered" :key="o.orderId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ o.orderId }} <span style="font-size:11px;color:#888;">{{ o.userName }}</span></div>
        <span class="sel-modal-item-id" style="background:#f0fff0;color:#389e0d;">{{ o.totalPrice.toLocaleString() }}원</span>
        <button class="sel-modal-item-btn" @click="$emit('select', o)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 게시판 선택 모달 ── */
window.BbmSelectModal = {
  name: 'BbmSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed, watch } = Vue;
    const kw       = ref('');
    const page     = ref(1);
    const pageSize = 6;

    const filtered = computed(() => props.adminData.bbms.filter(b => {
      if (b.useYn === 'N') return false;
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return b.bbmName.toLowerCase().includes(k) || b.bbmCode.toLowerCase().includes(k) || b.bbmType.toLowerCase().includes(k);
    }));

    /* 검색어 변경 시 첫 페이지로 */
    watch(kw, () => { page.value = 1; });

    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
    const pageList   = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
    const pageNums   = computed(() => {
      const s = Math.max(1, page.value - 2), e = Math.min(totalPages.value, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const setPage = n => { if (n >= 1 && n <= totalPages.value) page.value = n; };

    const typeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const scopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');

    return { kw, page, total, totalPages, pageList, pageNums, setPage, typeBadge, scopeBadge };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:560px;">
    <div class="modal-header"><span class="modal-title">게시판 선택</span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="게시판명 / 코드 / 유형 검색" style="margin-bottom:10px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ total }}건</div>
    <div class="sel-modal-list" style="min-height:200px;">
      <div v-if="pageList.length===0" style="text-align:center;color:#999;padding:30px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="b in pageList" :key="b.bbmId" class="sel-modal-item" style="gap:6px;">
        <div class="sel-modal-item-name" style="flex:1;min-width:0;">
          <span>{{ b.bbmName }}</span>
          <span class="badge" :class="typeBadge(b.bbmType)" style="margin-left:5px;font-size:10px;">{{ b.bbmType }}</span>
          <span class="badge" :class="scopeBadge(b.scopeType)" style="margin-left:3px;font-size:10px;">{{ b.scopeType }}</span>
        </div>
        <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:3px;flex-shrink:0;">{{ b.bbmCode }}</code>
        <span class="sel-modal-item-id" style="background:#f0f0f0;color:#888;flex-shrink:0;">ID: {{ b.bbmId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', b)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="page===1" @click="setPage(1)">«</button>
      <button class="pager-btn" :disabled="page===1" @click="setPage(page-1)">‹</button>
      <button v-for="n in pageNums" :key="n" class="pager-btn" :class="{active:page===n}" @click="setPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="page===totalPages" @click="setPage(page+1)">›</button>
      <button class="pager-btn" :disabled="page===totalPages" @click="setPage(totalPages)">»</button>
    </div>
  </div>
</div>`,
};

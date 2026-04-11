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
  computed: {
    siteNm() { return window.adminUtil.getSiteNm(); },
  },
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
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">📦 주문 상세<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
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
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.prodNm }}</div>
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
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">{{ product && product.prodNm }}</div>
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
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.adminData.sites.filter(s => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return s.siteNm.toLowerCase().includes(k) || s.siteCode.toLowerCase().includes(k) || s.domain.toLowerCase().includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">사이트 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="사이트코드 / 사이트명 / 도메인 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="s in filtered" :key="s.siteId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ s.siteNm }}</div>
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
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.adminData.vendors.filter(v => {
      if (v.vendorType !== '판매업체') return false;
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return v.vendorNm.toLowerCase().includes(k) || v.bizNo.includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">판매업체 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="업체명 / 사업자번호 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="v in filtered" :key="v.vendorId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ v.vendorNm }}</div>
        <span class="sel-modal-item-id">{{ v.vendorId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', v)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 사용자 선택 모달 (부서트리 + 멀티) ── */
window.AdminUserSelectModal = {
  name: 'AdminUserSelectModal',
  props: ['adminData'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed, reactive } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    /* ── 부서 트리 (depth 1부터 시작, root는 별도 렌더) ── */
    const selectedDeptId = ref(null);
    const deptKw = ref('');
    const buildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildDeptTree(items, d.deptId, depth + 1) }));
    const flattenDept = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flattenDept(n._kids, result); });
      return result;
    };
    const flatDeptTree = computed(() => {
      const kw = deptKw.value.trim().toLowerCase();
      const list = kw
        ? props.adminData.depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(kw))
        : props.adminData.depts;
      return flattenDept(buildDeptTree(list, null, 1)); /* depth 1부터 = 2레벨 */
    });

    const getDescDeptNames = (deptId) => {
      const names = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        const d = props.adminData.depts.find(x => x.deptId === id);
        if (d) { names.add(d.deptNm); props.adminData.depts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId)); }
      }
      return names;
    };

    /* ── 사용자 ── */
    const userKw = ref('');
    const selectedIds = reactive(new Set());
    const totalUsers = computed(() => props.adminData.adminUsers.length);

    const filtered = computed(() => {
      const k = userKw.value.trim().toLowerCase();
      let list = props.adminData.adminUsers;
      if (selectedDeptId.value !== null) {
        const names = getDescDeptNames(selectedDeptId.value);
        list = list.filter(u => names.has(u.dept));
      }
      if (k) list = list.filter(u =>
        u.name.toLowerCase().includes(k) || u.loginId.toLowerCase().includes(k) || (u.email || '').toLowerCase().includes(k)
      );
      return list;
    });

    const isChecked = (u) => selectedIds.has(u.adminUserId);
    const toggleUser = (u) => {
      if (selectedIds.has(u.adminUserId)) selectedIds.delete(u.adminUserId);
      else selectedIds.add(u.adminUserId);
    };
    const allChecked = computed(() => filtered.value.length > 0 && filtered.value.every(u => selectedIds.has(u.adminUserId)));
    const toggleAll = () => {
      if (allChecked.value) filtered.value.forEach(u => selectedIds.delete(u.adminUserId));
      else filtered.value.forEach(u => selectedIds.add(u.adminUserId));
    };
    const selectedCount = computed(() => selectedIds.size);
    const confirm = () => {
      const selected = props.adminData.adminUsers.filter(u => selectedIds.has(u.adminUserId));
      emit('select', selected);
    };

    return { siteNm, selectedDeptId, deptKw, flatDeptTree, userKw, filtered, totalUsers, isChecked, toggleUser, allChecked, toggleAll, selectedCount, confirm };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:780px;height:82vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">사용자 선택</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;letter-spacing:.02em;">{{ siteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selectedCount" style="font-size:12px;color:#e8587a;font-weight:700;background:#fff0f4;padding:3px 10px;border-radius:20px;">{{ selectedCount }}명 선택됨</span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="$emit('close')">✕</span>
      </div>
    </div>

    <!-- ── 바디 ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">

      <!-- 좌: 부서 트리 -->
      <div style="width:216px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">
        <!-- 부서 검색 -->
        <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">조직 / 부서</div>
          <div style="position:relative;">
            <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">🔍</span>
            <input v-model="deptKw" placeholder="부서 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
          </div>
        </div>
        <!-- 트리 목록 -->
        <div style="flex:1;overflow-y:auto;padding:6px 6px;">
          <!-- 루트: 전체 (1레벨) -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
            :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':'background:transparent;'"
            @click="selectedDeptId=null">
            <span style="font-size:8px;font-weight:900;flex-shrink:0;line-height:1;"
              :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">●</span>
            <span style="font-size:13px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ color: selectedDeptId===null?'#fff':'#374151' }">전체</span>
            <span style="font-size:10px;font-weight:600;flex-shrink:0;"
              :style="{ color: selectedDeptId===null?'rgba(255,255,255,0.75)':'#bbb' }">{{ totalUsers }}</span>
          </div>
          <!-- 2레벨~: 실 데이터 -->
          <div v-for="d in flatDeptTree" :key="d.deptId"
            style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
            :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.2);':'background:transparent;'"
            @click="selectedDeptId=d.deptId">
            <span style="flex-shrink:0;font-weight:800;line-height:1;"
              :style="{
                marginLeft: ((d._depth-1)*13)+'px',
                fontSize: d._depth===1?'10px':'8px',
                color: selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)]
              }">{{ ['●','◦','·'][Math.min(d._depth-1,2)] }}</span>
            <span style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ fontWeight: d._depth===1?'600':'400', color: selectedDeptId===d.deptId?'#fff':'#374151' }">
              {{ d.deptNm }}
            </span>
          </div>
          <div v-if="flatDeptTree.length===0" style="padding:20px 0;text-align:center;font-size:12px;color:#bbb;">없음</div>
        </div>
      </div>

      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <!-- 검색 -->
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">🔍</span>
            <input v-model="userKw" placeholder="이름 / 로그인ID / 이메일 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;color:#374151;" />
          </div>
        </div>
        <!-- 전체선택 바 -->
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="allChecked" @change="toggleAll" style="width:14px;height:14px;" />
            전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            총 <b style="color:#374151;">{{ filtered.length }}</b>명
          </span>
        </div>
        <!-- 카드 목록 -->
        <div style="flex:1;overflow-y:auto;">
          <div v-if="filtered.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>
            검색 결과가 없습니다.
          </div>
          <div v-for="u in filtered" :key="u.adminUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="isChecked(u)?'background:#fff5f7;':'' "
            @click="toggleUser(u)">
            <input type="checkbox" :checked="isChecked(u)" @click.stop="toggleUser(u)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#e8587a;cursor:pointer;" />
            <!-- 아바타 -->
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="isChecked(u)?'background:#e8587a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ u.name.charAt(0) }}
            </div>
            <!-- 텍스트 -->
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ u.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ u.loginId }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">{{ u.dept || '-' }} · {{ u.role }}</div>
            </div>
            <!-- 상태 뱃지 -->
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="u.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;'">
              {{ u.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="selectedCount?'color:#e8587a;font-weight:600;':'color:#bbb;'">
        {{ selectedCount ? selectedCount+'명이 선택되었습니다.' : '목록에서 사용자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="$emit('close')">취소</button>
        <button :disabled="!selectedCount"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selectedCount?'background:#e8587a;color:#fff;box-shadow:0 2px 8px rgba(232,88,122,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="confirm">확인{{ selectedCount?' ('+selectedCount+'명)':'' }}</button>
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
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.adminData.members.filter(m => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return m.memberNm.toLowerCase().includes(k) || m.email.toLowerCase().includes(k) || String(m.userId).includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">회원 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="이름 / 이메일 / ID 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="m in filtered" :key="m.userId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ m.memberNm }} <span style="font-size:11px;color:#888;">{{ m.email }}</span></div>
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
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.adminData.orders.filter(o => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return o.orderId.toLowerCase().includes(k) || o.userNm.toLowerCase().includes(k) || o.prodNm.toLowerCase().includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">주문 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="주문ID / 회원명 / 상품명 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="o in filtered" :key="o.orderId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ o.orderId }} <span style="font-size:11px;color:#888;">{{ o.userNm }}</span></div>
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
      return b.bbmNm.toLowerCase().includes(k) || b.bbmCode.toLowerCase().includes(k) || b.bbmType.toLowerCase().includes(k);
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

    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const typeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const scopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');

    return { siteNm, kw, page, total, totalPages, pageList, pageNums, setPage, typeBadge, scopeBadge };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:560px;">
    <div class="modal-header"><span class="modal-title">게시판 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="게시판명 / 코드 / 유형 검색" style="margin-bottom:10px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ total }}건</div>
    <div class="sel-modal-list" style="min-height:200px;">
      <div v-if="pageList.length===0" style="text-align:center;color:#999;padding:30px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="b in pageList" :key="b.bbmId" class="sel-modal-item" style="gap:6px;">
        <div class="sel-modal-item-name" style="flex:1;min-width:0;">
          <span>{{ b.bbmNm }}</span>
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

/* ── 템플릿 미리보기 모달 ── */
window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  props: ['tmpl', 'sampleParams'],
  emits: ['close'],
  setup(props) {
    const { computed } = Vue;

    const params = computed(() => {
      try { return JSON.parse(props.sampleParams || '{}'); }
      catch { return {}; }
    });

    const isHtml = computed(() =>
      ['메일템플릿', 'MMS템플릿'].includes(props.tmpl?.templateType)
    );

    /* 텍스트에 파라미터 치환 → HTML 반환 (미치환 변수는 빨간색 표시) */
    const applyAndRender = (text) => {
      if (!text) return '';
      let base = text;
      if (!isHtml.value) {
        /* 텍스트 계열: HTML 이스케이프 후 파라미터 치환 */
        base = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return base.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        params.value[k] !== undefined
          ? `<span style="background:#fff3cd;color:#856404;border-radius:3px;padding:0 2px;font-weight:600;">${String(params.value[k])}</span>`
          : `<span style="color:#dc3545;font-weight:600;">{{${k}}}</span>`
      );
    };

    const renderedSubject = computed(() => applyAndRender(props.tmpl?.subject || ''));
    const renderedContent = computed(() => applyAndRender(props.tmpl?.content || ''));

    const typeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const paramList = computed(() => Object.entries(params.value).map(([k, v]) => ({ k, v })));

    /* setup에서 tmpl을 반환해 템플릿에서 직접 접근 가능하게 */
    const fmtKey = k => '{{' + k + '}}';
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, tmpl: computed(() => props.tmpl), renderedSubject, renderedContent, isHtml, typeBadge, paramList, fmtKey };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:700px;">
    <div class="modal-header">
      <span class="modal-title">📄 템플릿 미리보기<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- 템플릿 기본정보 -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#f8f9fa;border-radius:8px;">
      <span class="badge" :class="typeBadge">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:14px;color:#1a1a2e;">{{ tmpl?.templateNm }}</span>
    </div>

    <!-- 파라미터 샘플 뱃지 -->
    <div v-if="paramList.length" style="margin-bottom:12px;">
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">파라미터 샘플값</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        <span v-for="p in paramList" :key="p.k"
          style="display:inline-flex;align-items:center;gap:3px;font-size:11px;background:#f0f4ff;border:1px solid #d0d9ff;border-radius:4px;padding:2px 8px;color:#2563eb;">
          <b>{{ fmtKey(p.k) }}</b>
          <span style="color:#aaa;margin:0 2px;">=</span>
          <span style="color:#856404;background:#fff3cd;border-radius:2px;padding:0 3px;">{{ p.v }}</span>
        </span>
      </div>
    </div>
    <div v-else style="margin-bottom:12px;font-size:12px;color:#aaa;">파라미터 샘플값 없음</div>

    <!-- 제목 -->
    <div v-if="tmpl?.subject" style="margin-bottom:12px;">
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;">제목 (Subject)</div>
      <div style="padding:9px 13px;background:#fff;border:1px solid #e8e8e8;border-radius:7px;font-size:13px;color:#333;"
        v-html="renderedSubject"></div>
    </div>

    <!-- 내용 미리보기 -->
    <div>
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">내용 미리보기</div>
      <!-- HTML 타입 -->
      <div v-if="isHtml"
        style="padding:18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-height:120px;max-height:380px;overflow-y:auto;font-size:13px;line-height:1.8;"
        v-html="renderedContent"></div>
      <!-- 텍스트 타입 -->
      <pre v-else
        style="padding:14px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;min-height:80px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;"
        v-html="renderedContent"></pre>
    </div>

    <div style="margin-top:18px;display:flex;justify-content:flex-end;">
      <button class="btn btn-secondary" @click="$emit('close')">닫기</button>
    </div>
  </div>
</div>`,
};

/* ── 템플릿 발송하기 모달 ── */
window.TemplateSendModal = {
  name: 'TemplateSendModal',
  props: ['tmpl', 'adminData', 'showToast', 'showConfirm'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const targetType = ref('member');
    const kw = ref('');
    const selected = reactive([]);
    const getId = (item) => targetType.value === 'member' ? item.userId : item.adminUserId;

    /* ── 부서 트리 (관리자 탭) ── */
    const selectedDeptId = ref(null);
    const deptKw = ref('');
    const buildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildDeptTree(items, d.deptId, depth + 1) }));
    const flattenDept = (nodes, result = []) => { nodes.forEach(n => { result.push(n); flattenDept(n._kids, result); }); return result; };
    const flatDeptTree = computed(() => {
      const k = deptKw.value.trim().toLowerCase();
      const list = k ? props.adminData.depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(k)) : props.adminData.depts;
      return flattenDept(buildDeptTree(list, null, 1));
    });
    const getDescDeptNames = (deptId) => {
      const names = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        const d = props.adminData.depts.find(x => x.deptId === id);
        if (d) { names.add(d.deptNm); props.adminData.depts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId)); }
      }
      return names;
    };

    /* ── 등급 필터 (회원 탭) ── */
    const selectedGrade = ref(null);
    const MEMBER_GRADES = ['VIP', '우수', '일반'];

    /* ── 목록 ── */
    const memberList = computed(() => {
      const k = kw.value.trim().toLowerCase();
      let list = props.adminData.members || [];
      if (selectedGrade.value) list = list.filter(m => m.grade === selectedGrade.value);
      if (k) list = list.filter(m => m.memberNm?.toLowerCase().includes(k) || m.email?.toLowerCase().includes(k) || String(m.userId).includes(k));
      return list;
    });
    const userList = computed(() => {
      const k = kw.value.trim().toLowerCase();
      let list = props.adminData.adminUsers || [];
      if (selectedDeptId.value !== null) {
        const names = getDescDeptNames(selectedDeptId.value);
        list = list.filter(u => names.has(u.dept));
      }
      if (k) list = list.filter(u => u.name?.toLowerCase().includes(k) || u.email?.toLowerCase().includes(k) || String(u.adminUserId).includes(k));
      return list;
    });
    const list = computed(() => targetType.value === 'member' ? memberList.value : userList.value);

    const isSelected = (item) => selected.includes(getId(item));
    const toggleSelect = (item) => {
      const id = getId(item);
      const idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
    };
    const allChecked = computed(() => list.value.length > 0 && list.value.every(x => selected.includes(getId(x))));
    const toggleAll = () => {
      if (allChecked.value) { selected.splice(0); }
      else { list.value.forEach(x => { const id = getId(x); if (!selected.includes(id)) selected.push(id); }); }
    };

    watch(targetType, () => { selected.splice(0); kw.value = ''; selectedDeptId.value = null; selectedGrade.value = null; });

    const typeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const gradeBadgeColor = g => ({ 'VIP': '#f59e0b', '우수': '#2563eb', '일반': '#6b7280' }[g] || '#6b7280');

    const doSend = async () => {
      if (!selected.length) { props.showToast('발송할 수신자를 선택하세요.', 'info'); return; }
      const typeLabel = targetType.value === 'member' ? '회원' : '관리자';
      const ok = await props.showConfirm('템플릿 발송',
        `[${props.tmpl?.templateNm}] 템플릿을 선택된 ${typeLabel} ${selected.length}명에게 발송하시겠습니까?`,
        { btnOk: '발송', btnCancel: '취소' });
      if (!ok) return;
      props.showToast(`${typeLabel} ${selected.length}명에게 발송 요청이 완료되었습니다.`);
      emit('close');
    };

    return { siteNm, targetType, kw, list, selected, isSelected, toggleSelect, allChecked, toggleAll, typeBadge, gradeBadgeColor, doSend,
             selectedDeptId, deptKw, flatDeptTree, selectedGrade, MEMBER_GRADES };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:800px;height:84vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">📨 발송하기</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;">{{ siteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selected.length" style="font-size:12px;color:#52c41a;font-weight:700;background:#f6ffed;padding:3px 10px;border-radius:20px;">{{ selected.length }}명 선택됨</span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="$emit('close')">✕</span>
      </div>
    </div>

    <!-- ── 템플릿 정보 바 ── -->
    <div style="display:flex;align-items:center;gap:8px;padding:9px 20px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <span class="badge" :class="typeBadge" style="flex-shrink:0;">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:13px;color:#1a1a2e;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ tmpl?.templateNm }}</span>
      <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">{{ tmpl.templateCode }}</code>
    </div>

    <!-- ── 탭 ── -->
    <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <button @click="targetType='member'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="targetType==='member'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👥 회원
      </button>
      <button @click="targetType='user'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="targetType==='user'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👤 관리자
      </button>
    </div>

    <!-- ── 바디: 좌(필터) + 우(목록) ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">

      <!-- 좌: 필터 패널 -->
      <div style="width:200px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">

        <!-- 관리자 탭: 부서 트리 -->
        <template v-if="targetType==='user'">
          <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
            <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">조직 / 부서</div>
            <div style="position:relative;">
              <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">🔍</span>
              <input v-model="deptKw" placeholder="부서 검색"
                style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;" />
            </div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:6px 6px;">
            <!-- 전체 루트 -->
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="selectedDeptId=null">
              <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">●</span>
              <span style="font-size:13px;font-weight:700;flex:1;" :style="{ color: selectedDeptId===null?'#fff':'#374151' }">전체</span>
            </div>
            <!-- 부서 트리 -->
            <div v-for="d in flatDeptTree" :key="d.deptId"
              style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="selectedDeptId=d.deptId">
              <span style="flex-shrink:0;font-weight:800;"
                :style="{ marginLeft:((d._depth-1)*13)+'px', fontSize:d._depth===1?'10px':'8px',
                          color:selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)] }">
                {{ ['●','◦','·'][Math.min(d._depth-1,2)] }}
              </span>
              <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                :style="{ fontWeight:d._depth===1?'600':'400', color:selectedDeptId===d.deptId?'#fff':'#374151' }">
                {{ d.deptNm }}
              </span>
            </div>
          </div>
        </template>

        <!-- 회원 탭: 등급 필터 -->
        <template v-else>
          <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
            <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;">회원 등급</div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:6px 6px;">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedGrade===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="selectedGrade=null">
              <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedGrade===null?'#fff':'#e8587a' }">●</span>
              <span style="font-size:13px;font-weight:700;" :style="{ color: selectedGrade===null?'#fff':'#374151' }">전체</span>
            </div>
            <div v-for="g in MEMBER_GRADES" :key="g"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedGrade===g?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="selectedGrade=g">
              <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;"
                :style="{ background: selectedGrade===g?'#fff':gradeBadgeColor(g) }"></span>
              <span style="font-size:13px;font-weight:600;" :style="{ color: selectedGrade===g?'#fff':'#374151' }">{{ g }}</span>
            </div>
          </div>
        </template>

      </div>

      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">🔍</span>
            <input v-model="kw" :placeholder="targetType==='member'?'이름 / 이메일 / ID 검색':'이름 / 이메일 / ID 검색'"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="allChecked" @change="toggleAll" style="width:14px;height:14px;" /> 전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">총 <b style="color:#374151;">{{ list.length }}</b>명</span>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <div v-if="list.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>검색 결과가 없습니다.
          </div>
          <div v-for="item in list" :key="item.userId||item.adminUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="isSelected(item)?'background:#f0fff4;':''"
            @click="toggleSelect(item)">
            <input type="checkbox" :checked="isSelected(item)" @click.stop="toggleSelect(item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="isSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ (targetType==='member' ? item.memberNm : item.name).charAt(0) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ targetType==='member' ? item.memberNm : item.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ item.loginId || item.email }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                <template v-if="targetType==='user'">{{ item.dept || '-' }} · {{ item.role }}</template>
                <template v-else>{{ item.email }}</template>
              </div>
            </div>
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="targetType==='user'
                ? (item.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;')
                : (item.grade==='VIP'?'background:#fef3c7;color:#d97706;':item.grade==='우수'?'background:#dbeafe;color:#1d4ed8;':'background:#f3f4f6;color:#6b7280;')">
              {{ targetType==='user' ? item.status : item.grade }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="selected.length?'color:#52c41a;font-weight:600;':'color:#bbb;'">
        {{ selected.length ? selected.length+'명이 선택되었습니다.' : '목록에서 수신자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="$emit('close')">취소</button>
        <button :disabled="!selected.length"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selected.length?'background:#52c41a;color:#fff;box-shadow:0 2px 8px rgba(82,196,26,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="doSend">
          📨 발송{{ selected.length?' ('+selected.length+'명)':'' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 부서 트리 선택 모달 ──────────────────────────────────
   Props: adminData, excludeId (선택 불가 부서 ID, 보통 자기 자신)
   Emits: select({ deptId, deptNm }), close
   ─────────────────────────────────────────────────── */
/* ── 메뉴 트리 선택 모달 ──────────────────────────────
   Props: adminData, excludeId
   Emits: select({ menuId, menuNm }), close
   ─────────────────────────────────────────────────── */
/* ── 권한 트리 선택 모달 ──────────────────────────────
   Props: adminData, excludeId
   Emits: select({ roleId, roleNm }), close
   ─────────────────────────────────────────────────── */
window.RoleTreeModal = {
  name: 'RoleTreeModal',
  props: ['adminData', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(r => (r.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, _depth: depth, _kids: buildTree(items, r.roleId, depth + 1) }));
    };
    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };
    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); props.adminData.roles.filter(r => r.parentId === id).forEach(r => mark(r.roleId)); };
        mark(props.excludeId);
      }
      const base = props.adminData.roles.filter(r => !excSet.has(r.roleId) && r.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal ? base.filter(r => r.roleNm.toLowerCase().includes(kwVal) || r.roleCode.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });
    const select = (role) => emit('select', { roleId: role.roleId, roleNm: role.roleNm });
    const selectNone = () => emit('select', { roleId: null, roleNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위권한 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">권한을 클릭하면 상위권한으로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw" placeholder="권한명 또는 권한코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 권한으로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <div v-for="r in flatTree" :key="r.roleId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===r.roleId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=r.roleId" @mouseleave="hoverId=null" @click="select(r)">
        <span :style="{ marginLeft:(r._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: r._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(r._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(r._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ r.roleNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ r.roleCode }}</code>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: hoverId===r.roleId ? 1 : 0 }">›</span>
      </div>
      <div v-if="flatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 권한이 없습니다.' }}
      </div>
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

window.MenuTreeModal = {
  name: 'MenuTreeModal',
  props: ['adminData', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: buildTree(items, m.menuId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          props.adminData.menus.filter(m => m.parentId === id).forEach(m => markExclude(m.menuId));
        };
        markExclude(props.excludeId);
      }
      const base = props.adminData.menus.filter(m => !excSet.has(m.menuId) && m.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(m => m.menuNm.toLowerCase().includes(kwVal) || m.menuCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    const select = (menu) => emit('select', { menuId: menu.menuId, menuNm: menu.menuNm });
    const selectNone = () => emit('select', { menuId: null, menuNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위메뉴 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">메뉴를 클릭하면 상위메뉴로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw"
          placeholder="메뉴명 또는 메뉴코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null"
        @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;">
          <span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 메뉴로 등록</span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;"
          :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 메뉴 트리 항목들 -->
      <div v-for="m in flatTree" :key="m.menuId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===m.menuId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=m.menuId" @mouseleave="hoverId=null"
        @click="select(m)">

        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: m._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
        </span>

        <!-- 메뉴명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ m.menuNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ m.menuCode }}</code>
        </div>

        <!-- hover 화살표 -->
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: hoverId===m.menuId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="flatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 메뉴가 없습니다.' }}
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

window.DeptTreeModal = {
  name: 'DeptTreeModal',
  props: ['adminData', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    /* ── 트리 구성 ── */
    const buildTree = (items, parentId, depth) => {
      return items
        .filter(d => (d.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildTree(items, d.deptId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      /* excludeId 및 그 자손 전체를 제외 (circular 방지) */
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          props.adminData.depts.filter(d => d.parentId === id).forEach(d => markExclude(d.deptId));
        };
        markExclude(props.excludeId);
      }
      const base = props.adminData.depts.filter(d => !excSet.has(d.deptId) && d.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(d => d.deptNm.toLowerCase().includes(kwVal) || d.deptCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    const select = (dept) => emit('select', { deptId: dept.deptId, deptNm: dept.deptNm });
    const selectNone = () => emit('select', { deptId: null, deptNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;line-height:1;">🌳</span>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위부서 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
          <div style="font-size:11px;color:#aaa;margin-top:1px;">부서를 클릭하면 상위부서로 지정됩니다</div>
        </div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw"
          placeholder="부서명 또는 부서코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 (고정 첫 항목) -->
      <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null"
        @click="selectNone">
        <!-- accent bar -->
        <div style="width:4px;align-self:stretch;border-radius:3px;background:#e8587a;flex-shrink:0;opacity:0.7;"></div>
        <span style="font-size:20px;flex-shrink:0;line-height:1;">🏢</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">최상위 부서로 등록</div>
        </div>
        <span style="font-size:16px;color:#e8587a;font-weight:700;transition:opacity .12s;"
          :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 부서 트리 항목들 -->
      <div v-for="d in flatTree" :key="d.deptId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===d.deptId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=d.deptId" @mouseleave="hoverId=null"
        @click="select(d)">

        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(d._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: d._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(d._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(d._depth,3)] }}
        </span>

        <!-- 부서명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ d.deptNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ d.deptCode }}</code>
        </div>

        <!-- hover 화살표 -->
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: hoverId===d.deptId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="flatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 부서가 없습니다.' }}
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

/* ─────────────────────────────────────────────
   CategoryTreeModal  상위카테고리 선택 팝업
───────────────────────────────────────────── */
window.CategoryTreeModal = {
  name: 'CategoryTreeModal',
  props: ['adminData', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(c => (c.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(c => ({ ...c, _depth: depth, _kids: buildTree(items, c.categoryId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); props.adminData.categories.filter(c => c.parentId === id).forEach(c => mark(c.categoryId)); };
        mark(props.excludeId);
      }
      const base   = props.adminData.categories.filter(c => !excSet.has(c.categoryId) && c.status === '활성');
      const kwVal  = kw.value.trim().toLowerCase();
      const list   = kwVal ? base.filter(c => c.categoryNm.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });

    const select     = (cat) => emit('select', { categoryId: cat.categoryId, categoryNm: cat.categoryNm });
    const selectNone = () => emit('select', { categoryId: null, categoryNm: '' });
    const siteNm   = computed(() => window.adminUtil.getSiteNm());
    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위카테고리 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">카테고리를 클릭하면 상위카테고리로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw" placeholder="카테고리명 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 카테고리로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <!-- 카테고리 트리 -->
      <div v-for="c in flatTree" :key="c.categoryId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===c.categoryId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=c.categoryId" @mouseleave="hoverId=null" @click="select(c)">
        <span :style="{ marginLeft:(c._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: c._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(c._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(c._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ c.categoryNm }}</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">{{ c.depth }}단계</span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: hoverId===c.categoryId ? 1 : 0 }">›</span>
      </div>
      <div v-if="flatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 카테고리가 없습니다.' }}
      </div>
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

/* ── 전시 위젯 미리보기 모달 ─────────────────────────────────
   Props:
     show       Boolean   표시 여부
     mode       String    'all' | 'single'
                          all    → area 전체 위젯 (DispPanel)
                          single → 현재 form 단일 위젯 (DispWidget)
     tabLabel   String    탭 이름 (모달 제목용)
     area       String    mode=all 시 사용할 영역코드
     widgets    Array     mode=all 시 adminData.displays 배열
     widget     Object    mode=single 시 미리볼 위젯 데이터 (form 스냅샷)
   Emits: close
   ─────────────────────────────────────────────────────────── */
window.DispPreviewModal = {
  name: 'DispPreviewModal',
  props: {
    show:     { type: Boolean, default: false },
    mode:     { type: String,  default: 'single' },   /* 'all' | 'single' */
    tabLabel: { type: String,  default: '미리보기' },
    area:     { type: String,  default: '' },
    widgets:  { type: Array,   default: () => [] },
    widget:   { type: Object,  default: () => ({}) },
  },
  emits: ['close'],
  setup(props) {
    const { computed } = Vue;

    /* mode=all: 해당 area의 활성 위젯 목록 */
    const areaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* mode=single: form 스냅샷에 status='활성' 강제 적용하여 렌더 */
    const previewWidget = computed(() => ({ ...props.widget, status: '활성' }));

    const WIDGET_LABEL = {
      image_banner: '이미지 배너', product_slider: '상품 슬라이더', product: '상품',
      chart_bar: '차트(Bar)', chart_line: '차트(Line)', chart_pie: '차트(Pie)',
      text_banner: '텍스트 배너', info_card: '정보 카드', popup: '팝업',
      file: '파일', coupon: '쿠폰', html_editor: 'HTML 에디터',
      event_banner: '이벤트', cache_banner: '캐쉬', widget_embed: '위젯 임베드',
    };
    const widgetLabel = computed(() => WIDGET_LABEL[props.widget?.widgetType] || props.widget?.widgetType || '');

    return { areaWidgets, previewWidget, widgetLabel };
  },
  template: /* html */`
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);overflow:hidden;"
    @click.stop>

    <!-- 헤더 -->
    <div style="padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fafafa;">
      <div>
        <span style="font-size:14px;font-weight:700;color:#333;">👁 미리보기</span>
        <span style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:600;">{{ tabLabel }}</span>
        <span v-if="mode==='single' && widgetLabel" style="margin-left:6px;font-size:11px;color:#aaa;">({{ widgetLabel }})</span>
        <span v-if="mode==='all' && area" style="margin-left:6px;font-size:11px;color:#aaa;">영역: {{ area }}</span>
      </div>
      <button @click="$emit('close')"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#aaa;line-height:1;padding:2px 6px;">✕</button>
    </div>

    <!-- 콘텐츠 -->
    <div style="flex:1;overflow-y:auto;padding:20px;">

      <!-- mode=all: 해당 area 전체 위젯 -->
      <template v-if="mode==='all'">
        <div v-if="areaWidgets.length===0"
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">📭</div>
          [{{ area }}] 영역에 활성 위젯이 없습니다.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="w in areaWidgets" :key="w.dispId">
            <div style="font-size:10px;color:#bbb;margin-bottom:4px;font-family:monospace;">
              #{{ w.dispId }} {{ w.name }} · 순서{{ w.sortOrder }}
            </div>
            <disp-widget :widget="w" />
          </div>
        </div>
      </template>

      <!-- mode=single: 현재 form 단일 위젯 -->
      <template v-else>
        <div style="font-size:10px;color:#bbb;margin-bottom:8px;font-family:monospace;">
          현재 입력값 기준 실시간 미리보기
        </div>
        <!-- widgetType 없으면 DispWidget 렌더 금지 (widgetType.startsWith 오류 방지) -->
        <div v-if="previewWidget.widgetType"
          style="border:1px dashed #e0e0e0;border-radius:8px;padding:16px;background:#fafbff;">
          <disp-widget :widget="previewWidget" />
        </div>
        <div v-else
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          <div style="font-size:28px;margin-bottom:8px;">🎨</div>
          행(1~5행)에서 위젯 유형을 선택하면<br>미리보기가 표시됩니다.
        </div>
      </template>

    </div>

    <!-- 푸터 -->
    <div style="padding:10px 18px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">닫기</button>
    </div>
  </div>
</div>`,
};

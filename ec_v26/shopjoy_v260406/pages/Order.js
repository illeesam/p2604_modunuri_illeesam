/* ShopJoy - Order */
window.Order = {
  name: 'Order',
  props: ['navigate', 'config', 'cart', 'showToast', 'showAlert', 'clearCart'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;

    /* ── 유틸 ── */
    const parsePrice = s => parseInt(String(s || '').replace(/[^0-9]/g, ''), 10) || 0;
    const fmt        = n => Number(n).toLocaleString('ko-KR') + '원';

    /* ── 뷰 상태 ── */
    const view       = ref('order');
    const resultData = ref(null);

    /* ── 쿠폰 로드 ── */
    const allCoupons  = ref([]);
    const loadCoupons = async () => {
      try {
        const res = await window.axiosApi.get('my/coupons.json');
        allCoupons.value = (res.data || []).filter(c => !c.used);
      } catch (e) { allCoupons.value = []; }
    };

    /* 상품쿠폰: rate / amount 타입만 */
    const productCoupons = item => {
      const price = parsePrice(item.product.price) * item.qty;
      return allCoupons.value.filter(c =>
        (c.discountType === 'rate' || c.discountType === 'amount') &&
        price >= (c.minOrder || 0)
      );
    };
    /* 배송비쿠폰: shipping 타입만 */
    const shippingCoupons = computed(() =>
      allCoupons.value.filter(c => c.discountType === 'shipping')
    );

    const discountLabel = c => {
      if (!c) return '';
      if (c.discountType === 'rate')     return c.discountValue + '% 할인';
      if (c.discountType === 'shipping') return '무료배송';
      return fmt(c.discountValue) + ' 할인';
    };
    const calcCouponDiscount = (c, item) => {
      if (!c) return 0;
      const base = parsePrice(item.product.price) * item.qty;
      if (c.discountType === 'rate')   return Math.floor(base * c.discountValue / 100);
      if (c.discountType === 'amount') return Math.min(c.discountValue, base);
      return 0;
    };

    /* ── 상품 쿠폰 팝업 ── */
    const couponPopup     = reactive({ show: false, targetIdx: null });
    const selectedCoupons = ref({});

    const openCouponPopup  = idx => { couponPopup.targetIdx = idx; couponPopup.show = true; };
    const closeCouponPopup = () => { couponPopup.show = false; };
    const applyCoupon      = c => {
      selectedCoupons.value = { ...selectedCoupons.value, [couponPopup.targetIdx]: c };
      couponPopup.show = false;
    };
    const removeCoupon     = idx => {
      const copy = { ...selectedCoupons.value };
      delete copy[idx];
      selectedCoupons.value = copy;
    };

    /* ── 배송비 쿠폰 팝업 ── */
    const shipCouponPopup = ref(false);
    const selectedShipCoupon = ref(null);
    const applyShipCoupon = c => { selectedShipCoupon.value = c; shipCouponPopup.value = false; };
    const removeShipCoupon = () => { selectedShipCoupon.value = null; };

    /* ── 캐쉬 ── */
    const cashBalance = ref(0);
    const cashInput   = ref(0);
    const loadCash = async () => {
      try {
        const res = await window.axiosApi.get('my/cash.json');
        cashBalance.value = res.data.balance || 0;
      } catch (e) {}
    };

    /* ── 금액 계산 ── */
    const cartTotal = computed(() =>
      (props.cart || []).reduce((s, i) => s + parsePrice(i.product.price) * i.qty, 0)
    );
    const totalCouponDiscount = computed(() =>
      (props.cart || []).reduce((s, item, idx) =>
        s + calcCouponDiscount(selectedCoupons.value[idx], item), 0)
    );
    /* 배송비: 기본 0원, 배송비 쿠폰은 표시용 */
    const shippingFee = computed(() => 0);
    const appliedCash = computed(() => {
      const v = parseInt(String(cashInput.value).replace(/[^0-9]/g, ''), 10) || 0;
      return Math.min(v, cashBalance.value, Math.max(0, cartTotal.value - totalCouponDiscount.value));
    });
    const finalPrice = computed(() =>
      Math.max(0, cartTotal.value - totalCouponDiscount.value - appliedCash.value)
    );

    /* ── 주문자 폼 + 카카오 주소 ── */
    const form = reactive({
      name: '', tel: '', email: '',
      postcode: '', address: '', addressDetail: '', deliveryReq: ''
    });
    const openKakaoAddr = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) {
        props.showToast('주소 검색 서비스를 불러오는 중입니다.', 'info'); return;
      }
      new daum.Postcode({
        oncomplete(data) {
          form.postcode = data.zonecode;
          form.address  = data.roadAddress || data.jibunAddress;
        }
      }).open();
    };

    onMounted(async () => {
      await Promise.all([loadCoupons(), loadCash()]);
      const u = window.shopjoyAuth?.state?.user;
      if (u) { form.name = u.member_nm || ''; form.tel = u.phone || ''; form.email = u.email || ''; }
    });

    const errors   = reactive({});
    const clearErr = k => { delete errors[k]; };
    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      let ok = true;
      if (!form.name.trim() || form.name.trim().length < 2) { errors.name = '이름을 2자 이상 입력해주세요.'; ok = false; }
      if (!form.tel.trim())    { errors.tel     = '연락처를 입력해주세요.'; ok = false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               { errors.email   = '유효한 이메일을 입력해주세요.'; ok = false; }
      if (!form.address.trim()){ errors.address = '배송 주소를 입력해주세요.'; ok = false; }
      return ok;
    };

    /* ── 주문 제출 ── */
    const submitting = ref(false);
    const submitOrder = async () => {
      if (!validate()) return;
      submitting.value = true;
      try {
        const orderId = 'ORD-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
        const payload = {
          orderId,
          orderDate: new Date().toISOString().slice(0, 10),
          form: { ...form },
          items: (props.cart || []).map((i, idx) => ({
            productId:   i.product.productId,
            productName: i.product.productName,
            emoji:       i.product.emoji,
            color: i.color.name, size: i.size, qty: i.qty,
            price:    parsePrice(i.product.price) * i.qty,
            coupon:   selectedCoupons.value[idx]?.name || null,
            discount: calcCouponDiscount(selectedCoupons.value[idx], i),
          })),
          shippingCoupon:     selectedShipCoupon.value?.name || null,
          cartTotal:          cartTotal.value,
          couponDiscount:     totalCouponDiscount.value,
          cashUsed:           appliedCash.value,
          finalPrice:         finalPrice.value,
        };
        if (window.axiosApi) await window.axiosApi.post('order-intake.json', payload).catch(() => {});
        resultData.value = payload;
        view.value = 'result';
        props.clearCart();
        cashBalance.value = Math.max(0, cashBalance.value - appliedCash.value);
      } finally { submitting.value = false; }
    };

    return {
      view, resultData,
      form, errors, clearErr, submitting, submitOrder, openKakaoAddr,
      parsePrice, fmt,
      cartTotal, totalCouponDiscount, shippingFee, appliedCash, finalPrice,
      allCoupons, productCoupons, shippingCoupons, discountLabel, calcCouponDiscount,
      couponPopup, selectedCoupons, openCouponPopup, closeCouponPopup, applyCoupon, removeCoupon,
      shipCouponPopup, selectedShipCoupon, applyShipCoupon, removeShipCoupon,
      cashBalance, cashInput,
    };
  },

  template: /* html */ `
<div class="page-wrap">

  <!-- ══ 주문 결과 화면 ══ -->
  <template v-if="view==='result' && resultData">
    <div style="max-width:600px;margin:0 auto;padding:40px 20px;text-align:center;">
      <div style="font-size:4rem;margin-bottom:16px;">🎉</div>
      <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);margin-bottom:8px;">주문이 완료됐어요!</h1>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:4px;">주문번호: <strong style="color:var(--blue);">{{ resultData.orderId }}</strong></p>
      <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:32px;">입금 확인 후 1~2 영업일 이내 발송됩니다.</p>

      <div class="card" style="padding:20px;text-align:left;margin-bottom:20px;">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;">📦 주문 상품</div>
        <div v-for="item in resultData.items" :key="item.productId"
          style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:1.5rem;">{{ item.emoji }}</span>
          <div style="flex:1;">
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} × {{ item.qty }}</div>
            <div v-if="item.coupon" style="font-size:0.75rem;color:var(--blue);margin-top:2px;">🎟️ {{ item.coupon }} (-{{ fmt(item.discount) }})</div>
          </div>
          <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ fmt(item.price) }}</div>
        </div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);">
            <span>상품금액</span><span>{{ fmt(resultData.cartTotal) }}</span>
          </div>
          <div v-if="resultData.couponDiscount>0" style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--blue);">
            <span>쿠폰 할인</span><span>-{{ fmt(resultData.couponDiscount) }}</span>
          </div>
          <div v-if="resultData.shippingCoupon" style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--blue);">
            <span>배송비 쿠폰</span><span>🎟️ {{ resultData.shippingCoupon }}</span>
          </div>
          <div v-if="resultData.cashUsed>0" style="display:flex;justify-content:space-between;font-size:0.85rem;color:#f97316;">
            <span>캐쉬 사용</span><span>-{{ fmt(resultData.cashUsed) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);">
            <span>배송비</span><span style="color:#22c55e;">무료</span>
          </div>
          <div style="border-top:1px solid var(--border);padding-top:8px;display:flex;justify-content:space-between;font-size:1rem;font-weight:800;">
            <span style="color:var(--text-primary);">최종 결제금액</span>
            <span style="color:var(--blue);">{{ fmt(resultData.finalPrice) }}</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:18px;text-align:left;margin-bottom:28px;background:var(--blue-dim);">
        <div style="font-size:0.85rem;font-weight:700;color:var(--blue);margin-bottom:10px;">💳 입금 안내</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
          {{ config.bank.name }} {{ config.bank.account }}<br>
          예금주: {{ config.bank.holder }}<br>
          <strong style="color:var(--blue);">입금액: {{ fmt(resultData.finalPrice) }}</strong><br>
          입금자명: {{ resultData.form.name }}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <button @click="navigate('myOrder')" class="btn-blue" style="padding:14px;font-size:1rem;font-weight:700;">📋 마이페이지에서 주문 확인</button>
        <button @click="navigate('home')" class="btn-outline" style="padding:14px;">계속 쇼핑하기</button>
      </div>
    </div>
  </template>

  <!-- ══ 주문 입력 화면 ══ -->
  <template v-else>
    <div style="margin-bottom:28px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">주문하기</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">주문 · 결제</h1>
      <p class="section-subtitle">결제는 <span class="gradient-text" style="font-weight:800;">계좌이체</span>로 진행됩니다.</p>
    </div>

    <div v-if="cart.length===0" style="text-align:center;padding:80px 20px;">
      <div style="font-size:4rem;margin-bottom:20px;">📦</div>
      <p style="color:var(--text-muted);font-size:1rem;margin-bottom:24px;">주문할 상품이 없어요.</p>
      <button class="btn-blue" @click="navigate('products')" style="padding:12px 28px;">상품 보러가기</button>
    </div>

    <template v-else>
      <!-- ── 주문 상품 + 쿠폰 ── -->
      <div class="card" style="padding:20px;margin-bottom:20px;">
        <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🛍️ 주문 상품 ({{ cart.length }})</h2>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div v-for="(item, idx) in cart" :key="idx"
            style="padding-bottom:14px;"
            :style="idx<cart.length-1?'border-bottom:1px solid var(--border);':''">
            <!-- 상품 행 -->
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;">
              <div :style="{
                width:'52px',height:'52px',borderRadius:'10px',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',
                background:'linear-gradient(135deg,'+item.color.hex+'33,'+item.color.hex+'11)'
              }">{{ item.product.emoji }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ item.product.productName }}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px;">
                  <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--blue-dim);color:var(--blue);font-weight:600;">{{ item.color.name }}</span>
                  <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--purple-dim);color:var(--purple);font-weight:600;">{{ item.size }}</span>
                  <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--bg-base);color:var(--text-secondary);font-weight:600;">× {{ item.qty }}</span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-weight:800;color:var(--text-primary);font-size:0.9rem;">{{ fmt(parsePrice(item.product.price)*item.qty) }}</div>
                <div v-if="selectedCoupons[idx]" style="font-size:0.78rem;color:var(--blue);margin-top:2px;">-{{ fmt(calcCouponDiscount(selectedCoupons[idx],item)) }}</div>
              </div>
            </div>
            <!-- 상품 쿠폰 (rate/amount 만) -->
            <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;background:var(--bg-base);">
              <span style="font-size:0.82rem;color:var(--text-muted);flex-shrink:0;">🎟️ 상품쿠폰</span>
              <template v-if="selectedCoupons[idx]">
                <div style="flex:1;min-width:0;">
                  <span style="font-size:0.82rem;font-weight:700;color:var(--blue);">{{ selectedCoupons[idx].name }}</span>
                  <span style="font-size:0.78rem;color:var(--blue);margin-left:6px;">({{ discountLabel(selectedCoupons[idx]) }})</span>
                </div>
                <button @click="removeCoupon(idx)" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-muted);font-size:0.78rem;cursor:pointer;">제거</button>
                <button @click="openCouponPopup(idx)" style="padding:4px 10px;border:1px solid var(--blue);border-radius:6px;background:transparent;color:var(--blue);font-size:0.78rem;cursor:pointer;font-weight:600;">변경</button>
              </template>
              <template v-else>
                <span style="flex:1;font-size:0.82rem;color:var(--text-muted);">
                  {{ productCoupons(item).length ? '적용 가능 ' + productCoupons(item).length + '개' : '적용 가능 쿠폰 없음' }}
                </span>
                <button v-if="productCoupons(item).length" @click="openCouponPopup(idx)"
                  style="padding:4px 12px;border:1.5px solid var(--blue);border-radius:6px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;cursor:pointer;font-weight:700;">선택</button>
              </template>
            </div>
          </div>
        </div>

        <!-- ── 캐쉬 적용 ── -->
        <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">💰 캐쉬 사용</span>
            <span style="font-size:0.82rem;color:var(--text-muted);">잔액 <strong style="color:var(--text-primary);">{{ fmt(cashBalance) }}</strong></span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input v-model="cashInput" type="number" min="0" :max="cashBalance" placeholder="사용할 캐쉬 금액"
              style="flex:1;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.88rem;outline:none;">
            <button @click="cashInput=cashBalance" style="padding:9px 14px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;cursor:pointer;font-weight:700;white-space:nowrap;">전액사용</button>
            <button @click="cashInput=0" style="padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-muted);font-size:0.82rem;cursor:pointer;">초기화</button>
          </div>
          <div v-if="appliedCash>0" style="margin-top:6px;font-size:0.82rem;color:#f97316;">{{ fmt(appliedCash) }} 캐쉬 사용 예정</div>
        </div>

        <!-- ── 최종 금액 ── -->
        <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:14px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);">
            <span>상품금액</span><span>{{ fmt(cartTotal) }}</span>
          </div>
          <div v-if="totalCouponDiscount>0" style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--blue);">
            <span>쿠폰 할인</span><span>-{{ fmt(totalCouponDiscount) }}</span>
          </div>
          <div v-if="appliedCash>0" style="display:flex;justify-content:space-between;font-size:0.85rem;color:#f97316;">
            <span>캐쉬 사용</span><span>-{{ fmt(appliedCash) }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-secondary);">
            <span>배송비</span>
            <span>
              <span v-if="selectedShipCoupon" style="color:var(--blue);font-size:0.8rem;margin-right:6px;">🎟️ {{ selectedShipCoupon.name }}</span>
              <span style="color:#22c55e;">무료</span>
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:1.05rem;font-weight:800;padding-top:8px;border-top:2px solid var(--border);margin-top:2px;">
            <span style="color:var(--text-primary);">최종 결제금액</span>
            <span style="color:var(--blue);">{{ fmt(finalPrice) }}</span>
          </div>
        </div>
      </div>

      <!-- ── 주문자 정보 + 결제 안내 ── -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;" class="order-grid">
        <!-- 주문자 정보 -->
        <div class="card" style="padding:28px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">👤 주문자 정보</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
            <div>
              <label class="form-label">이름<span class="form-required">*</span></label>
              <input v-model="form.name" class="form-input" placeholder="홍길동" @input="clearErr('name')" />
              <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
            </div>
            <div>
              <label class="form-label">연락처<span class="form-required">*</span></label>
              <input v-model="form.tel" class="form-input" placeholder="010-1234-5678" @input="clearErr('tel')" />
              <div v-if="errors.tel" class="form-error">{{ errors.tel }}</div>
            </div>
          </div>
          <div style="margin-bottom:14px;">
            <label class="form-label">이메일<span class="form-required">*</span></label>
            <input v-model="form.email" type="email" class="form-input" placeholder="hello@example.com" @input="clearErr('email')" />
            <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
          </div>

          <!-- 배송 주소 (카카오 우편번호) -->
          <div style="margin-bottom:14px;">
            <label class="form-label">배송 주소<span class="form-required">*</span></label>
            <div style="display:flex;gap:8px;margin-bottom:8px;">
              <input v-model="form.postcode" class="form-input" placeholder="우편번호" readonly
                style="width:110px;flex-shrink:0;background:var(--bg-base);cursor:default;" />
              <button @click="openKakaoAddr" type="button"
                style="padding:0 16px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">
                📮 주소 검색
              </button>
            </div>
            <input v-model="form.address" class="form-input" placeholder="도로명 주소" readonly
              @input="clearErr('address')"
              style="margin-bottom:8px;background:var(--bg-base);cursor:default;" />
            <input v-model="form.addressDetail" class="form-input" placeholder="상세 주소 (동/호수 등)" />
            <div v-if="errors.address" class="form-error">{{ errors.address }}</div>
          </div>

          <div style="margin-bottom:20px;">
            <label class="form-label">배송 요청사항</label>
            <select v-model="form.deliveryReq" class="form-input">
              <option value="">선택 없음</option>
              <option value="문 앞에 놔주세요">문 앞에 놔주세요</option>
              <option value="경비실에 맡겨주세요">경비실에 맡겨주세요</option>
              <option value="택배함에 넣어주세요">택배함에 넣어주세요</option>
              <option value="연락 후 배송해주세요">연락 후 배송해주세요</option>
            </select>
          </div>
          <button class="btn-blue" @click="submitOrder" style="width:100%;padding:13px;" :disabled="submitting">
            {{ submitting ? '처리 중...' : '주문 완료' }}
          </button>
        </div>

        <!-- 결제 안내 -->
        <div class="card" style="padding:28px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">💳 결제 안내 (계좌이체)</h2>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div class="info-row"><span class="info-icon">1️⃣</span>
              <div><div class="info-label">결제 방식</div><div class="info-val">계좌이체 방식으로 진행됩니다.</div></div>
            </div>
            <div class="info-row"><span class="info-icon">2️⃣</span>
              <div><div class="info-label">입금 계좌</div>
                <div class="info-val" style="margin-top:4px;">
                  <span v-if="config.bank && config.bank.account">{{ config.bank.name }} {{ config.bank.account }}<br>예금주: {{ config.bank.holder }}</span>
                </div>
              </div>
            </div>
            <div class="info-row"><span class="info-icon">3️⃣</span>
              <div><div class="info-label">입금 금액</div>
                <div class="info-val" style="color:var(--blue);font-weight:700;margin-top:4px;">{{ fmt(finalPrice) }}</div>
              </div>
            </div>
            <div class="info-row"><span class="info-icon">4️⃣</span>
              <div><div class="info-label">입금자명</div><div class="info-val" style="margin-top:4px;">주문자명과 동일하게 입력해주세요.</div></div>
            </div>

            <!-- 배송비 + 배송비 쿠폰 선택 -->
            <div class="info-row" style="align-items:flex-start;">
              <span class="info-icon">🚚</span>
              <div style="flex:1;">
                <div class="info-label">배송비</div>
                <div style="margin-top:6px;">
                  <template v-if="selectedShipCoupon">
                    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--blue-dim);">
                      <span style="font-size:0.82rem;font-weight:700;color:var(--blue);flex:1;">🎟️ {{ selectedShipCoupon.name }}</span>
                      <button @click="removeShipCoupon" style="padding:3px 8px;border:1px solid var(--blue);border-radius:5px;background:transparent;color:var(--blue);font-size:0.75rem;cursor:pointer;">제거</button>
                      <button @click="shipCouponPopup=true" style="padding:3px 8px;border:1px solid var(--border);border-radius:5px;background:var(--bg-card);color:var(--text-muted);font-size:0.75rem;cursor:pointer;">변경</button>
                    </div>
                    <div style="font-size:0.82rem;color:#22c55e;margin-top:4px;">✓ 배송비 쿠폰 적용됨 → 무료</div>
                  </template>
                  <template v-else>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:0.85rem;color:#22c55e;font-weight:700;">무료</span>
                      <button v-if="shippingCoupons.length" @click="shipCouponPopup=true"
                        style="padding:4px 10px;border:1.5px solid var(--blue);border-radius:6px;background:var(--blue-dim);color:var(--blue);font-size:0.78rem;cursor:pointer;font-weight:600;">
                        🎟️ 배송비 쿠폰 선택
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <div class="info-row"><span class="info-icon">📞</span>
              <div><div class="info-label">문의</div><div class="info-val" style="margin-top:4px;">{{ config.tel }} / {{ config.email }}</div></div>
            </div>
          </div>
          <div style="margin-top:16px;">
            <button class="btn-outline" @click="navigate('contact')" style="width:100%;padding:10px;">문의·상담하기</button>
          </div>
        </div>
      </div>
    </template>
  </template>

  <!-- ══ 상품 쿠폰 팝업 ══ -->
  <div v-if="couponPopup.show" class="modal-overlay" @click.self="closeCouponPopup" style="z-index:200;">
    <div class="modal-box" style="max-width:480px;width:92%;padding:28px;max-height:80vh;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">🎟️ 상품 쿠폰 선택</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">할인(정률/정액) 쿠폰 · 상품 1개당 1개 적용</div>
        </div>
        <button @click="closeCouponPopup" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>
      </div>
      <div style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;">
        <!-- 쿠폰 없음 -->
        <div @click="applyCoupon(null)"
          style="padding:14px;border-radius:8px;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;"
          :style="!selectedCoupons[couponPopup.targetIdx]?'border-color:var(--blue);background:var(--blue-dim);':''">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-base);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🚫</div>
          <div style="flex:1;"><div style="font-size:0.88rem;font-weight:600;color:var(--text-secondary);">쿠폰 사용 안 함</div></div>
        </div>
        <template v-if="couponPopup.targetIdx!==null">
          <div v-for="c in productCoupons(cart[couponPopup.targetIdx])" :key="c.couponId"
            @click="applyCoupon(c)"
            style="padding:14px;border-radius:8px;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;"
            :style="selectedCoupons[couponPopup.targetIdx]?.couponId===c.couponId?'border-color:var(--blue);background:var(--blue-dim);':''">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🎟️</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ c.name }}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
                {{ c.minOrder>0 ? fmt(c.minOrder)+' 이상' : '최소금액 없음' }} · 만료: {{ c.expiry }}
              </div>
            </div>
            <div style="font-size:1rem;font-weight:800;color:var(--blue);flex-shrink:0;">{{ discountLabel(c) }}</div>
          </div>
          <div v-if="!productCoupons(cart[couponPopup.targetIdx]).length"
            style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.88rem;">
            이 상품에 적용 가능한 쿠폰이 없습니다.
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- ══ 배송비 쿠폰 팝업 ══ -->
  <div v-if="shipCouponPopup" class="modal-overlay" @click.self="shipCouponPopup=false" style="z-index:200;">
    <div class="modal-box" style="max-width:440px;width:92%;padding:28px;max-height:70vh;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">🚚 배송비 쿠폰 선택</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">배송비 할인 쿠폰만 표시됩니다</div>
        </div>
        <button @click="shipCouponPopup=false" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>
      </div>
      <div style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;">
        <div @click="applyShipCoupon(null)"
          style="padding:14px;border-radius:8px;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;"
          :style="!selectedShipCoupon?'border-color:var(--blue);background:var(--blue-dim);':''">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--bg-base);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🚫</div>
          <div><div style="font-size:0.88rem;font-weight:600;color:var(--text-secondary);">쿠폰 사용 안 함</div></div>
        </div>
        <div v-for="c in shippingCoupons" :key="c.couponId"
          @click="applyShipCoupon(c)"
          style="padding:14px;border-radius:8px;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;"
          :style="selectedShipCoupon?.couponId===c.couponId?'border-color:var(--blue);background:var(--blue-dim);':''">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🚚</div>
          <div style="flex:1;">
            <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ c.name }}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">만료: {{ c.expiry }}</div>
          </div>
          <div style="font-size:1rem;font-weight:800;color:var(--blue);">무료배송</div>
        </div>
        <div v-if="!shippingCoupons.length" style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.88rem;">
          보유한 배송비 쿠폰이 없습니다.
        </div>
      </div>
    </div>
  </div>

</div>
  `
};

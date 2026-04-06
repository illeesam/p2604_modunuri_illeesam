/* ShopJoy - PageOrder */
window.PageOrder = {
  name: 'PageOrder',
  props: ['navigate', 'config', 'cart', 'showToast', 'showAlert', 'clearCart'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">주문하기</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">주문 · 결제</h1>
    <p class="section-subtitle">결제는 <span class="gradient-text" style="font-weight:800;">계좌이체</span>로 진행됩니다.</p>
  </div>

  <!-- 장바구니가 비어있을 때 -->
  <div v-if="cart.length===0" style="text-align:center;padding:80px 20px;">
    <div style="font-size:4rem;margin-bottom:20px;">📦</div>
    <p style="color:var(--text-muted);font-size:1rem;margin-bottom:24px;">주문할 상품이 없어요. 먼저 장바구니에 상품을 담아주세요.</p>
    <button class="btn-blue" @click="navigate('products')" style="padding:12px 28px;">상품 보러가기</button>
  </div>

  <template v-else>
    <!-- 주문 상품 요약 -->
    <div class="card" style="padding:20px;margin-bottom:20px;">
      <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🛍️ 주문 상품 ({{ cart.length }})</h2>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div v-for="(item, idx) in cart" :key="idx"
          style="display:flex;gap:12px;align-items:center;padding-bottom:12px;"
          :style="{ borderBottom: idx===cart.length-1 ? 'none' : '1px solid var(--border)' }">
          <div :style="{
            width:'56px', height:'56px', borderRadius:'10px', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem',
            background: 'linear-gradient(135deg,' + item.color.hex + '33,' + item.color.hex + '11)'
          }">{{ item.product.emoji }}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);margin-bottom:3px;">{{ item.product.productName }}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--blue-dim);color:var(--blue);font-weight:600;">{{ item.color.name }}</span>
              <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--purple-dim);color:var(--purple);font-weight:600;">{{ item.size }}</span>
              <span style="font-size:0.75rem;padding:1px 8px;border-radius:10px;background:var(--bg-base);color:var(--text-secondary);font-weight:600;">× {{ item.qty }}</span>
            </div>
          </div>
          <div style="font-weight:800;color:var(--blue);font-size:0.9rem;flex-shrink:0;">{{ formatPrice(item.product.price, item.qty) }}</div>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;display:flex;justify-content:space-between;font-size:1rem;font-weight:800;">
        <span style="color:var(--text-primary);">총 결제금액</span>
        <span style="color:var(--blue);">{{ totalPriceStr }}</span>
      </div>
    </div>

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

        <div style="margin-bottom:14px;">
          <label class="form-label">배송 주소<span class="form-required">*</span></label>
          <input v-model="form.address" class="form-input" placeholder="도로명 주소 입력" @input="clearErr('address')" style="margin-bottom:8px;" />
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
          <div class="info-row">
            <span class="info-icon">1️⃣</span>
            <div>
              <div class="info-label">결제 방식</div>
              <div class="info-val">계좌이체 방식으로 진행됩니다.</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">2️⃣</span>
            <div>
              <div class="info-label">입금 계좌</div>
              <div class="info-val" style="margin-top:4px;">
                <span v-if="config.bank && config.bank.account">
                  {{ config.bank.name }} {{ config.bank.account }}<br>예금주: {{ config.bank.holder }}
                </span>
                <span v-else style="color:var(--text-muted);font-size:0.85rem;">
                  주문 접수 후 계좌번호를 안내드립니다.
                </span>
              </div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">3️⃣</span>
            <div>
              <div class="info-label">입금 금액</div>
              <div class="info-val" style="color:var(--blue);font-weight:700;margin-top:4px;">{{ totalPriceStr }}</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">4️⃣</span>
            <div>
              <div class="info-label">입금자명</div>
              <div class="info-val" style="margin-top:4px;">주문자명과 동일하게 입력해주세요.</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🚚</span>
            <div>
              <div class="info-label">발송</div>
              <div class="info-val" style="margin-top:4px;">입금 확인 후 1~2 영업일 이내 출고</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">📞</span>
            <div>
              <div class="info-label">문의</div>
              <div class="info-val" style="margin-top:4px;">{{ config.tel }} / {{ config.email }}</div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <button class="btn-outline" @click="navigate('contact')" style="width:100%;padding:10px;">문의·상담하기</button>
        </div>
      </div>
    </div>
  </template>
</div>
  `,
  setup(props) {
    const { reactive, computed, ref } = Vue;

    const submitting = ref(false);

    function parsePrice(priceStr) {
      if (!priceStr) return 0;
      return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
    }

    function formatPrice(priceStr, qty) {
      const base = parsePrice(priceStr);
      if (!base) return priceStr;
      return (base * (qty || 1)).toLocaleString('ko-KR') + '원';
    }

    const totalPrice = computed(() =>
      (props.cart || []).reduce((s, i) => s + parsePrice(i.product.price) * i.qty, 0)
    );
    const totalPriceStr = computed(() =>
      totalPrice.value ? totalPrice.value.toLocaleString('ko-KR') + '원' : '-'
    );

    const form = reactive({ name: '', tel: '', email: '', address: '', addressDetail: '', deliveryReq: '' });
    const errors = reactive({});

    const clearErr = k => { if (errors[k] !== undefined) delete errors[k]; };

    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      let ok = true;
      if (!form.name.trim() || form.name.trim().length < 2) { errors.name = '이름을 2자 이상 입력해주세요.'; ok = false; }
      if (!form.tel.trim()) { errors.tel = '연락처를 입력해주세요.'; ok = false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = '유효한 이메일을 입력해주세요.'; ok = false; }
      if (!form.address.trim()) { errors.address = '배송 주소를 입력해주세요.'; ok = false; }
      return ok;
    };

    const submitOrder = async () => {
      if (!validate()) return;
      submitting.value = true;
      try {
        if (window.axiosApi) {
          await window.axiosApi.post('order-intake.json', {
            source: 'shopjoy',
            name: form.name,
            tel: form.tel,
            email: form.email,
            address: form.address + (form.addressDetail ? ' ' + form.addressDetail : ''),
            deliveryReq: form.deliveryReq,
            totalPrice: totalPriceStr.value,
            items: (props.cart || []).map(i => ({
              productId: i.product.productId,
              productName: i.product.productName,
              color: i.color.name,
              size: i.size,
              qty: i.qty,
              price: formatPrice(i.product.price, i.qty),
            })),
          }).catch(() => {});
        }
        props.showToast('주문이 접수되었습니다! 입금 후 빠르게 발송하겠습니다.', 'success');
        props.clearCart();
        Object.assign(form, { name: '', tel: '', email: '', address: '', addressDetail: '', deliveryReq: '' });
        props.navigate('home');
      } finally {
        submitting.value = false;
      }
    };

    return { form, errors, clearErr, submitting, submitOrder, formatPrice, totalPriceStr };
  }
};

/* CareMate - PageOrder */
window.PageOrder = {
  name: 'PageOrder',
  props: ['navigate', 'config', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--teal-dim);color:var(--teal);font-size:0.75rem;font-weight:700;margin-bottom:12px;">서비스 신청</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;">서비스 신청하기</h1>
    <p class="section-subtitle">일상생활지원 · 장애인활동지원 · 요양보호사</p>
  </div>

  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:start;" class="order-grid">
    <div style="display:flex;flex-direction:column;gap:16px;">

      <!-- 서비스 선택 -->
      <div class="order-section">
        <div class="order-section-title">서비스 선택 <span class="form-required">*</span></div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="p in nonHospitalProducts" :key="p.productId"
            @click="orderForm.productId=p.productId"
            style="padding:14px 16px;border-radius:12px;cursor:pointer;transition:all 0.2s;"
            :style="orderForm.productId===p.productId?'border:2px solid var(--teal);background:var(--teal-dim);':'border:1.5px solid var(--border);background:var(--bg-card);'">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:1.3rem;">{{ p.emoji }}</span>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">{{ p.productName }}</span>
                  <span class="badge badge-cat" style="font-size:0.62rem;">{{ p.categoryName }}</span>
                  <span v-if="p.badge" class="badge" :class="p.badge==='인기'?'badge-teal':'badge-amber'" style="font-size:0.62rem;">{{ p.badge }}</span>
                </div>
                <div style="font-size:0.75rem;color:var(--blue);margin-top:2px;font-weight:600;">{{ p.price }}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">{{ p.priceNote }}</div>
              </div>
              <div style="width:18px;height:18px;border-radius:50%;border:2px solid var(--teal);display:flex;align-items:center;justify-content:center;">
                <div v-if="orderForm.productId===p.productId" style="width:10px;height:10px;border-radius:50%;background:var(--teal);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 신청자 정보 -->
      <div class="order-section">
        <div class="order-section-title">신청자 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <label class="form-label">이름 <span class="form-required">*</span></label>
            <input v-model="orderForm.name" @input="clearOrderError('name')" type="text" placeholder="홍길동" class="form-input">
            <div v-if="orderErrors.name" class="form-error">{{ orderErrors.name }}</div>
          </div>
          <div>
            <label class="form-label">연락처 <span class="form-required">*</span></label>
            <input v-model="orderForm.tel" @input="clearOrderError('tel')" type="tel" placeholder="010-9998-0857" class="form-input">
            <div v-if="orderErrors.tel" class="form-error">{{ orderErrors.tel }}</div>
          </div>
          <div style="grid-column:span 2;">
            <label class="form-label">이메일</label>
            <input v-model="orderForm.email" type="email" placeholder="example@email.com" class="form-input">
          </div>
        </div>
      </div>

      <!-- 서비스 일정 -->
      <div class="order-section">
        <div class="order-section-title">서비스 일정</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
          <div>
            <label class="form-label">서비스 날짜 <span class="form-required">*</span></label>
            <input v-model="orderForm.serviceDate" @input="clearOrderError('serviceDate')" type="date" class="form-input">
            <div v-if="orderErrors.serviceDate" class="form-error">{{ orderErrors.serviceDate }}</div>
          </div>
          <div>
            <label class="form-label">시작 시간</label>
            <input v-model="orderForm.serviceTime" type="time" class="form-input">
          </div>
        </div>
        <div>
          <label class="form-label">서비스 주소 <span class="form-required">*</span></label>
          <input v-model="orderForm.address" @input="clearOrderError('address')" type="text" placeholder="서비스 받으실 주소를 입력해주세요" class="form-input">
          <div v-if="orderErrors.address" class="form-error">{{ orderErrors.address }}</div>
        </div>
      </div>

      <!-- 요청사항 -->
      <div class="order-section">
        <div class="order-section-title">추가 요청사항</div>
        <textarea v-model="orderForm.note" rows="3" placeholder="특이사항, 주의사항 등을 자유롭게 입력해주세요." class="form-input" style="resize:vertical;"></textarea>
      </div>

      <button @click="submitOrder" class="btn-teal" style="padding:15px;font-size:0.95rem;width:100%;">✅ 서비스 신청하기</button>
    </div>

    <!-- 오른쪽: 요약 -->
    <div style="display:flex;flex-direction:column;gap:16px;position:sticky;top:80px;">
      <div class="booking-highlight" style="background:linear-gradient(135deg,var(--teal-dim),var(--blue-dim));border:1.5px solid rgba(0,137,123,0.2);">
        <div style="font-size:0.75rem;font-weight:700;color:var(--teal);margin-bottom:10px;">📋 신청 서비스</div>
        <div style="font-size:1.05rem;font-weight:800;color:var(--text-primary);">{{ orderSelectedProduct?.productName }}</div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--teal);margin-top:4px;">{{ orderSelectedProduct?.price }}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">{{ orderSelectedProduct?.priceNote }}</div>
      </div>

      <div class="account-box">
        <div style="font-size:0.75rem;font-weight:700;color:var(--blue);margin-bottom:10px;">💳 계좌이체 결제 안내</div>
        <div style="font-size:0.85rem;color:var(--text-primary);line-height:2;">
          <div><strong>은행:</strong> {{ config.bankName }}</div>
          <div><strong>계좌:</strong> {{ config.bankAccount }}</div>
          <div><strong>예금주:</strong> {{ config.bankHolder }}</div>
        </div>
        <div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(0,137,123,0.08);font-size:0.75rem;color:var(--text-secondary);line-height:1.7;">
          📌 신청 확정 후 서비스 전날까지 입금 바랍니다.<br>입금 확인 후 매니저를 배정해 드립니다.
        </div>
      </div>

      <div class="card" style="padding:20px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">📌 바우처/급여 안내</div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.7;">장애인활동지원 바우처 및 장기요양급여 병행 이용이 가능합니다. 자세한 사항은 고객센터로 문의 바랍니다.</p>
        <button @click="navigate('contact')" class="btn-outline btn-sm" style="width:100%;margin-top:10px;">문의하기</button>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { reactive, computed } = Vue;

    const products = window.SITE_CONFIG.products;

    const orderForm = reactive({ name: '', tel: '', email: '', serviceDate: '', serviceTime: '', address: '', productId: products[4]?.productId || 5, note: '' });
    const orderErrors = reactive({});
    const clearOrderError = k => { if (orderErrors[k] !== undefined) delete orderErrors[k]; };

    const orderSelectedProduct = computed(() => products.find(p => p.productId === orderForm.productId) || products[4]);
    const nonHospitalProducts = computed(() => products.filter(p => p.categoryId !== 'hospital'));

    let orderSchemaPromise = null;
    const getOrderSchema = () => {
      if (!orderSchemaPromise) {
        orderSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup =>
          yup.object({
            name:        yup.string().required('이름을 입력해주세요').min(2, '최소 2자 이상'),
            tel:         yup.string().required('연락처를 입력해주세요'),
            serviceDate: yup.string().required('서비스 날짜를 선택해주세요'),
            address:     yup.string().required('서비스 주소를 입력해주세요'),
          })
        );
      }
      return orderSchemaPromise;
    };

    const submitOrder = async () => {
      Object.keys(orderErrors).forEach(k => delete orderErrors[k]);
      try {
        const schema = await getOrderSchema();
        await schema.validate({ name: orderForm.name, tel: orderForm.tel, serviceDate: orderForm.serviceDate, address: orderForm.address }, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi.post('order-intake.json', { source: 'caremate', kind: 'service-order', ...orderForm, productName: orderSelectedProduct.value?.productName }).catch(() => {});
        }
        await props.showAlert(
          '서비스 신청 완료 ✅',
          `서비스 신청이 접수되었습니다.\n\n선택 서비스: ${orderSelectedProduct.value?.productName}\n서비스 금액: ${orderSelectedProduct.value?.price}\n\n📌 계좌이체 안내\n은행: ${window.SITE_CONFIG.bankName}\n계좌: ${window.SITE_CONFIG.bankAccount}\n예금주: ${window.SITE_CONFIG.bankHolder}\n\n입금 확인 후 매니저를 배정해 드립니다.`,
          'info'
        );
        Object.assign(orderForm, { name: '', tel: '', email: '', serviceDate: '', serviceTime: '', address: '', note: '' });
      } catch (e) {
        if (e.inner && e.inner.length) e.inner.forEach(err => { if (err.path) orderErrors[err.path] = err.message; });
        else if (e.path) orderErrors[e.path] = e.message;
      }
    };

    return {
      orderForm, orderErrors, clearOrderError, submitOrder,
      orderSelectedProduct, nonHospitalProducts,
    };
  }
};

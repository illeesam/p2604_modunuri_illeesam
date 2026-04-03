/* MODUNURI - PageOrder */
window.PageOrder = {
  name: 'PageOrder',
  props: ['navigate', 'config', 'product', 'showToast', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">주문하기</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">결제 안내</h1>
    <p class="section-subtitle">결제 방식은 <span class="gradient-text" style="font-weight:800;">계좌이체</span>로 진행됩니다.</p>
  </div>

  <div v-if="product" class="card" style="padding:28px;margin-bottom:20px;text-align:left;">
    <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">
      <div style="font-size:2.6rem;line-height:1;">{{ product.emoji }}</div>
      <div style="flex:1;min-width:220px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
          <div style="font-size:1.25rem;font-weight:900;color:var(--text-primary);">{{ product.productName }}</div>
          <span class="badge badge-cat">{{ categoryLabel(product) }}</span>
        </div>
        <div style="font-size:1.1rem;font-weight:900;color:var(--blue);margin-bottom:10px;">{{ product.price }}</div>
        <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin:0;">{{ product.desc }}</p>
      </div>
    </div>
  </div>

  <div class="grid-2" style="gap:20px;align-items:start;">
    <div class="card" style="padding:28px;text-align:left;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">주문자 정보 입력</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div>
          <label class="form-label">담당자명<span class="form-required">*</span></label>
          <input v-model="orderForm.name" class="form-input" placeholder="홍길동" @input="clearOrderError('name')" />
          <div v-if="orderErrors.name" class="form-error">{{ orderErrors.name }}</div>
        </div>

        <div>
          <label class="form-label">이메일<span class="form-required">*</span></label>
          <input v-model="orderForm.email" class="form-input" type="email" placeholder="hello@company.kr" @input="clearOrderError('email')" />
          <div v-if="orderErrors.email" class="form-error">{{ orderErrors.email }}</div>
        </div>

        <div>
          <label class="form-label">회사명<span class="form-required">*</span></label>
          <input v-model="orderForm.company" class="form-input" placeholder="(주)회사명" @input="clearOrderError('company')" />
          <div v-if="orderErrors.company" class="form-error">{{ orderErrors.company }}</div>
        </div>

        <div>
          <label class="form-label">연락처</label>
          <input v-model="orderForm.tel" class="form-input" placeholder="010-9998-0857" />
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <label class="form-label">주문 요청사항<span class="form-required">*</span></label>
        <textarea
          v-model="orderForm.desc"
          class="form-input"
          rows="5"
          placeholder="구성/수량/도입 일정 등 요청사항을 자유롭게 입력해주세요. (최소 10자)"
          @input="clearOrderError('desc')"
        ></textarea>
        <div v-if="orderErrors.desc" class="form-error">{{ orderErrors.desc }}</div>
      </div>

      <button class="btn-blue" @click="submitOrder" style="width:100%;padding:13px;">주문 완료</button>
    </div>

    <div class="card" style="padding:28px;text-align:left;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">결제 안내(계좌이체)</h2>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="info-row">
          <span class="info-icon">1️⃣</span>
          <div>
            <div class="info-label">계좌이체</div>
            <div class="info-val" style="margin-top:4px;">계좌이체 방식으로 진행됩니다.</div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-icon">2️⃣</span>
          <div>
            <div class="info-label">입금 계좌</div>
            <div class="info-val" style="margin-top:4px;">
              <span v-if="config.bank && config.bank.account" style="display:block;">
                {{ config.bank.name }} {{ config.bank.account }}<br>{{ config.bank.holder }}
              </span>
              <span v-else style="display:block;color:var(--text-muted);font-size:0.85rem;">
                주문 확정 후 계좌번호를 안내드립니다.
              </span>
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-icon">3️⃣</span>
          <div>
            <div class="info-label">입금 확인</div>
            <div class="info-val" style="margin-top:4px;">입금 확인 후 일정에 맞춰 진행됩니다.</div>
          </div>
        </div>

        <div class="info-row">
          <span class="info-icon">🧾</span>
          <div>
            <div class="info-label">입금자/메모</div>
            <div class="info-val" style="margin-top:4px;">문의자명 또는 주문자명 + 메모(주문번호)를 함께 부탁드립니다.</div>
          </div>
        </div>

        <div class="info-row">
          <span class="info-icon">📞</span>
          <div>
            <div class="info-label">문의 연락처</div>
            <div class="info-val" style="margin-top:4px;">{{ config.tel }} / {{ config.email }}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:18px;">
        <button class="btn-outline" @click="navigate('contact')" style="width:100%;padding:12px;">문의·상담하기</button>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { reactive } = Vue;

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    const orderForm = reactive({ name: '', email: '', company: '', tel: '', desc: '' });
    const orderErrors = reactive({});

    const clearOrderError = key => {
      if (orderErrors[key] !== undefined) delete orderErrors[key];
    };

    let orderSchemaPromise = null;
    const getOrderSchema = () => {
      if (!orderSchemaPromise) {
        orderSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup => {
          return yup.object({
            name: yup.string().required('담당자명을 입력해주세요').min(2, '담당자명은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            company: yup.string().required('회사명을 입력해주세요'),
            desc: yup.string().required('주문 요청사항을 입력해주세요').min(10, '주문 요청사항은 최소 10자 이상 입력해주세요'),
          });
        });
      }
      return orderSchemaPromise;
    };

    const submitOrder = async () => {
      Object.keys(orderErrors).forEach(k => delete orderErrors[k]);
      try {
        const schema = await getOrderSchema();
        const payload = {
          name: orderForm.name,
          email: orderForm.email,
          company: orderForm.company,
          desc: orderForm.desc,
        };
        await schema.validate(payload, { abortEarly: false });

        if (window.axiosApi) {
          await window.axiosApi
            .post('contact-intake.json', {
              source: 'modunuri',
              kind: 'order',
              productId: props.product ? props.product.productId : null,
              productName: props.product ? props.product.productName : null,
              name: orderForm.name,
              email: orderForm.email,
              company: orderForm.company,
              tel: orderForm.tel,
              desc: orderForm.desc,
            })
            .catch(function () {});
        }

        props.showToast('주문이 접수되었습니다. 계좌이체로 진행해주세요.', 'success');
        Object.assign(orderForm, { name: '', email: '', company: '', tel: '', desc: '' });
        props.navigate('products');
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => {
            if (err.path) orderErrors[err.path] = err.message;
          });
        } else if (e.path) {
          orderErrors[e.path] = e.message;
        }
      }
    };

    return { orderForm, orderErrors, clearOrderError, submitOrder, categoryLabel };
  }
};

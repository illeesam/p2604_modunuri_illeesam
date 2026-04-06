/* MODUNURI - PageContact */
window.PageContact = {
  name: 'PageContact',
  props: ['navigate', 'config', 'showToast', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">고객센터</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">무엇이든 <span class="gradient-text">물어보세요</span></h1>
    <p class="section-subtitle">1~2 영업일 내 전문 담당자가 답변드립니다.</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start;" class="contact-grid">
    <!-- Form -->
    <div class="card" style="padding:32px;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:22px;color:var(--text-primary);">✉️ 문의 양식</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div>
          <label class="form-label">담당자명<span class="form-required">*</span></label>
          <input v-model="form.name" class="form-input" placeholder="홍길동" @input="clearFormError('name')" />
          <div v-if="formErrors.name" class="form-error">{{ formErrors.name }}</div>
        </div>
        <div>
          <label class="form-label">이메일<span class="form-required">*</span></label>
          <input v-model="form.email" class="form-input" type="email" placeholder="hello@company.kr" @input="clearFormError('email')" />
          <div v-if="formErrors.email" class="form-error">{{ formErrors.email }}</div>
        </div>
        <div>
          <label class="form-label">회사명<span class="form-required">*</span></label>
          <input v-model="form.company" class="form-input" placeholder="(주)회사명" @input="clearFormError('company')" />
          <div v-if="formErrors.company" class="form-error">{{ formErrors.company }}</div>
        </div>
        <div>
          <label class="form-label">연락처</label>
          <input v-model="form.tel" class="form-input" placeholder="010-9998-0857" />
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <label class="form-label">관심 서비스</label>
        <select v-model="form.service" class="form-input">
          <option value="">선택 (선택사항)</option>
          <option v-for="c in contactServiceCodes" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div style="margin-bottom:22px;">
        <label class="form-label">문의 내용<span class="form-required">*</span></label>
        <textarea v-model="form.desc" class="form-input" rows="5" placeholder="문의하실 내용을 자유롭게 입력해주세요. (최소 10자)" @input="clearFormError('desc')"></textarea>
        <div v-if="formErrors.desc" class="form-error">{{ formErrors.desc }}</div>
      </div>
      <button class="btn-blue" @click="submitForm" style="width:100%;padding:13px;">문의 접수하기</button>
    </div>
    <!-- Contact info + mini FAQ -->
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">📋 연락처</h3>
        <div class="info-row"><span class="info-icon">📞</span><div><div class="info-label">전화</div><div class="info-val">{{ config.tel }}</div></div></div>
        <div class="info-row"><span class="info-icon">📧</span><div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div></div>
        <div class="info-row"><span class="info-icon">🕘</span><div><div class="info-label">운영 시간</div><div class="info-val">평일 09:00 – 18:00</div></div></div>
      </div>
      <!-- Mini FAQ on contact page -->
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:4px;color:var(--text-primary);">❓ 자주 묻는 질문</h3>
        <div v-for="(faq, idx) in config.faqs.slice(0,3)" :key="idx" class="faq-item">
          <button class="faq-question" @click="openFaq=(openFaq===('c'+idx)?null:('c'+idx))">
            <span>{{ faq.q }}</span>
            <span class="chevron" :class="{open: openFaq===('c'+idx)}">▼</span>
          </button>
          <div v-show="openFaq===('c'+idx)" class="faq-answer">{{ faq.a }}</div>
        </div>
        <button class="btn-outline btn-sm" @click="navigate('faq')" style="margin-top:12px;width:100%;">전체 FAQ 보기</button>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { reactive, ref, computed } = Vue;

    const contactServiceCodes = computed(function () {
      return window.cmUtil.codesByGroupOrSolutionTitles(props.config || {}, 'modunuri_contact_service');
    });

    const form = reactive({ name: '', email: '', company: '', tel: '', service: '', desc: '' });
    const formErrors = reactive({});
    const openFaq = ref(null);

    const clearFormError = key => {
      if (formErrors[key] !== undefined) delete formErrors[key];
    };

    let contactSchemaPromise = null;
    const getContactSchema = () => {
      if (!contactSchemaPromise) {
        contactSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup => {
          return yup.object({
            name: yup.string().required('담당자명을 입력해주세요').min(2, '담당자명은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            company: yup.string().required('회사명을 입력해주세요'),
            desc: yup.string().required('문의 내용을 입력해주세요').min(10, '문의 내용은 최소 10자 이상 입력해주세요'),
          });
        });
      }
      return contactSchemaPromise;
    };

    const submitForm = async () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      try {
        const schema = await getContactSchema();
        const payload = { name: form.name, email: form.email, company: form.company, desc: form.desc };
        await schema.validate(payload, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi
            .post('contact-intake.json', {
              source: 'modunuri',
              name: form.name,
              email: form.email,
              company: form.company,
              tel: form.tel,
              service: form.service,
              desc: form.desc,
            })
            .catch(function () {});
        }
        props.showToast('문의 접수하기 준비중입니다', 'success');
        Object.assign(form, { name: '', email: '', company: '', tel: '', service: '', desc: '' });
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => {
            if (err.path) formErrors[err.path] = err.message;
          });
        } else if (e.path) {
          formErrors[e.path] = e.message;
        }
      }
    };

    return { form, formErrors, openFaq, clearFormError, submitForm, contactServiceCodes };
  }
};

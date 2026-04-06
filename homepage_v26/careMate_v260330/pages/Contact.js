/* CareMate - PageContact */
window.PageContact = {
  name: 'PageContact',
  props: ['navigate', 'config', 'showToast'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">고객센터</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">무엇이든 <span class="gradient-text">물어보세요</span></h1>
    <p class="section-subtitle">1~2시간 내 담당자가 연락드립니다.</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:start;" class="contact-grid">
    <div class="card" style="padding:32px;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:22px;color:var(--text-primary);">✉️ 문의하기</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div>
          <label class="form-label">이름 <span class="form-required">*</span></label>
          <input v-model="contactForm.name" @input="clearContactError('name')" type="text" placeholder="홍길동" class="form-input">
          <div v-if="contactErrors.name" class="form-error">{{ contactErrors.name }}</div>
        </div>
        <div>
          <label class="form-label">연락처 <span class="form-required">*</span></label>
          <input v-model="contactForm.tel" @input="clearContactError('tel')" type="tel" placeholder="010-9998-0857" class="form-input">
          <div v-if="contactErrors.tel" class="form-error">{{ contactErrors.tel }}</div>
        </div>
        <div>
          <label class="form-label">이메일</label>
          <input v-model="contactForm.email" type="email" placeholder="example@email.com" class="form-input">
        </div>
        <div>
          <label class="form-label">문의 유형</label>
          <select v-model="contactForm.subject" class="form-input">
            <option value="">선택 (선택사항)</option>
            <option v-for="c in subjectCodes" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:22px;">
        <label class="form-label">문의 내용 <span class="form-required">*</span></label>
        <textarea v-model="contactForm.desc" @input="clearContactError('desc')" rows="5" placeholder="문의 내용을 자유롭게 입력해주세요." class="form-input" style="resize:vertical;"></textarea>
        <div v-if="contactErrors.desc" class="form-error">{{ contactErrors.desc }}</div>
      </div>
      <button @click="submitContact" class="btn-blue" style="width:100%;padding:13px;">문의 접수하기</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">📋 연락처</h3>
        <div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">대표 전화</div><div class="info-val">{{ config.tel }}</div></div></div>
        <div class="info-row"><div class="info-icon">📧</div><div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div></div>
        <div class="info-row"><div class="info-icon">💬</div><div><div class="info-label">카카오톡</div><div class="info-val">@{{ config.kakao }}</div></div></div>
        <div class="info-row"><div class="info-icon">🕘</div><div><div class="info-label">운영시간</div><div class="info-val">평일 09:00–18:00<br>긴급 24시간 가능</div></div></div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:12px;color:var(--text-primary);">❓ 자주 묻는 질문</h3>
        <div v-for="(faq,idx) in config.faqs.slice(0,3)" :key="idx" class="faq-item">
          <button class="faq-question" @click="openFaq=openFaq===('c'+idx)?null:('c'+idx)">
            <span>{{ faq.q }}</span><span class="chevron" :class="{open:openFaq===('c'+idx)}">▼</span>
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

    const subjectCodes = computed(function () {
      return window.cmUtil.codesByGroupOrRows(props.config, 'caremate_contact_subject', [
        { codeId: 1, codeValue: '병원동행 문의', codeLabel: '병원동행 문의' },
        { codeId: 2, codeValue: '일상생활지원 문의', codeLabel: '일상생활지원 문의' },
        { codeId: 3, codeValue: '장애인활동지원 문의', codeLabel: '장애인활동지원 문의' },
        { codeId: 4, codeValue: '요양보호사 문의', codeLabel: '요양보호사 문의' },
        { codeId: 5, codeValue: '가격/결제 문의', codeLabel: '가격/결제 문의' },
        { codeId: 6, codeValue: '기타', codeLabel: '기타' },
      ]);
    });

    const openFaq = ref(null);
    const contactForm = reactive({ name: '', tel: '', email: '', subject: '', desc: '' });
    const contactErrors = reactive({});
    const clearContactError = k => { if (contactErrors[k] !== undefined) delete contactErrors[k]; };

    let contactSchemaPromise = null;
    const getContactSchema = () => {
      if (!contactSchemaPromise) {
        contactSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup =>
          yup.object({
            name: yup.string().required('이름을 입력해주세요').min(2, '최소 2자 이상'),
            tel:  yup.string().required('연락처를 입력해주세요'),
            desc: yup.string().required('문의 내용을 입력해주세요').min(10, '최소 10자 이상'),
          })
        );
      }
      return contactSchemaPromise;
    };

    const submitContact = async () => {
      Object.keys(contactErrors).forEach(k => delete contactErrors[k]);
      try {
        const schema = await getContactSchema();
        await schema.validate({ name: contactForm.name, tel: contactForm.tel, desc: contactForm.desc }, { abortEarly: false });
        if (window.axiosApi) await window.axiosApi.post('contact-intake.json', { source: 'caremate', ...contactForm }).catch(() => {});
        props.showToast('문의가 접수되었습니다. 빠르게 연락드리겠습니다.', 'success');
        Object.assign(contactForm, { name: '', tel: '', email: '', subject: '', desc: '' });
      } catch (e) {
        if (e.inner && e.inner.length) e.inner.forEach(err => { if (err.path) contactErrors[err.path] = err.message; });
        else if (e.path) contactErrors[e.path] = e.message;
      }
    };

    return { openFaq, contactForm, contactErrors, clearContactError, submitContact, subjectCodes };
  }
};

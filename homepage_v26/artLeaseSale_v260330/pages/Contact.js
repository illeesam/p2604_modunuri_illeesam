/* ArtGallery - PageContact */
window.PageContact = {
  name: 'PageContact',
  props: ['navigate', 'config', 'showToast', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--burgundy-dim);color:var(--burgundy);font-size:0.75rem;font-weight:700;margin-bottom:14px;border:1px solid rgba(139,50,82,0.25);">구매 & 대여 상담</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;font-family:'Noto Serif KR',serif;">문의하기</h1>
    <p class="section-subtitle">대여 및 구매에 대한 궁금한 점을 남겨주세요</p>
    <div class="art-divider"><span class="art-divider-icon">📞</span></div>
  </div>

  <div class="contact-grid" style="display:grid;grid-template-columns:1fr 1.4fr;gap:32px;">
    <!-- Contact info -->
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-weight:700;font-size:1rem;margin-bottom:16px;color:var(--text-primary);">연락처</h3>
        <div class="info-row">
          <div class="info-icon">📞</div>
          <div><div class="info-label">전화</div><div class="info-val">{{ config.tel }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">📧</div>
          <div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">💬</div>
          <div><div class="info-label">카카오톡</div><div class="info-val">@{{ config.kakao }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">🕐</div>
          <div><div class="info-label">상담 시간</div><div class="info-val">평일 10:00 ~ 18:00<br>주말은 예약 문의</div></div>
        </div>
      </div>
      <div class="card" style="padding:24px;background:linear-gradient(135deg,var(--bg-card),var(--gold-dim));">
        <h3 style="font-weight:700;font-size:0.9rem;margin-bottom:10px;color:var(--text-primary);">📦 구매 시 포함 사항</h3>
        <ul style="font-size:0.82rem;color:var(--text-secondary);line-height:2;list-style:none;padding:0;">
          <li>✅ 작품 보증서 (작가 서명)</li>
          <li>✅ 안전 포장 배송</li>
          <li>✅ 걸이 설치 가이드</li>
          <li>✅ 12개월 A/S 지원</li>
        </ul>
      </div>
    </div>

    <!-- Inquiry form -->
    <div class="card" style="padding:32px;">
      <h3 style="font-weight:700;font-size:1rem;margin-bottom:24px;color:var(--text-primary);">문의 양식</h3>
      <form @submit.prevent="submitForm" style="display:flex;flex-direction:column;gap:18px;">
        <div>
          <label class="form-label">문의 유형</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <label v-for="c in inquiryTypeCodes" :key="c.codeId + '-' + c.codeValue" style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;">
              <input type="radio" v-model="form.type" :value="c.codeValue" style="accent-color:var(--gold);">
              <span>{{ c.codeLabel }}</span>
            </label>
          </div>
        </div>
        <div>
          <label class="form-label">성함 <span class="form-required">*</span></label>
          <input v-model="form.name" @input="clearFormError('name')" type="text" placeholder="홍길동" class="form-input">
          <div v-if="formErrors.name" class="form-error">{{ formErrors.name }}</div>
        </div>
        <div>
          <label class="form-label">이메일 <span class="form-required">*</span></label>
          <input v-model="form.email" @input="clearFormError('email')" type="email" placeholder="example@email.com" class="form-input">
          <div v-if="formErrors.email" class="form-error">{{ formErrors.email }}</div>
        </div>
        <div>
          <label class="form-label">연락처</label>
          <input v-model="form.tel" type="tel" placeholder="010-9998-0857" class="form-input">
        </div>
        <div>
          <label class="form-label">관심 작품</label>
          <input v-model="form.artwork" type="text" placeholder="관심 있는 작품명 (선택)" class="form-input">
        </div>
        <div>
          <label class="form-label">문의 내용 <span class="form-required">*</span></label>
          <textarea v-model="form.desc" @input="clearFormError('desc')" placeholder="대여 기간, 설치 공간, 구매 관련 문의 등 자유롭게 작성해주세요." class="form-input" rows="5" style="resize:vertical;"></textarea>
          <div v-if="formErrors.desc" class="form-error">{{ formErrors.desc }}</div>
        </div>
        <button type="submit" class="btn-gold" style="padding:14px;font-size:0.9rem;width:100%;">문의 보내기 →</button>
      </form>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { reactive, computed } = Vue;

    const inquiryTypeCodes = computed(function () {
      return window.cmUtil.codesByGroupOrRows(props.config || {}, 'artgallery_inquiry_type', [
        { codeId: 1, codeValue: 'lease', codeLabel: '대여 문의' },
        { codeId: 2, codeValue: 'purchase', codeLabel: '구매 상담' },
        { codeId: 3, codeValue: 'other', codeLabel: '기타' },
      ]);
    });

    const form = reactive({ name: '', email: '', tel: '', type: 'lease', artwork: '', desc: '' });
    const formErrors = reactive({});
    const clearFormError = key => { if (formErrors[key] !== undefined) delete formErrors[key]; };

    let formSchemaPromise = null;
    const getFormSchema = () => {
      if (!formSchemaPromise) {
        formSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup => {
          return yup.object({
            name: yup.string().required('성함을 입력해주세요').min(2, '성함은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            desc: yup.string().required('문의 내용을 입력해주세요').min(10, '문의 내용은 최소 10자 이상 입력해주세요'),
          });
        });
      }
      return formSchemaPromise;
    };
    const submitForm = async () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      try {
        const schema = await getFormSchema();
        await schema.validate({ name: form.name, email: form.email, desc: form.desc }, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi.post('contact-intake.json', {
            source: 'artgallery', kind: form.type,
            name: form.name, email: form.email, tel: form.tel,
            artwork: form.artwork, desc: form.desc,
          }).catch(() => {});
        }
        props.showToast('문의가 접수되었습니다. 빠르게 연락드리겠습니다 🎨', 'success');
        Object.assign(form, { name: '', email: '', tel: '', type: 'lease', artwork: '', desc: '' });
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => { if (err.path) formErrors[err.path] = err.message; });
        } else if (e.path) {
          formErrors[e.path] = e.message;
        }
      }
    };

    return { form, formErrors, submitForm, clearFormError, inquiryTypeCodes };
  }
};

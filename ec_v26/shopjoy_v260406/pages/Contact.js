/* ShopJoy - Contact */
window.Contact = {
  name: 'Contact',
  props: ['navigate', 'config', 'showToast', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="고객센터"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Support</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">고객센터</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">고객센터</span>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(14px,2.5vw,28px);align-items:start;" class="contact-grid">
    <!-- 문의 폼 -->
    <div class="card" style="padding:clamp(16px,4vw,32px);">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:22px;color:var(--text-primary);">✉️ 문의 양식</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(8px,1.5vw,14px);margin-bottom:14px;">
        <div>
          <label class="form-label">이름<span class="form-required">*</span></label>
          <input v-model="form.name" class="form-input" placeholder="홍길동" @input="clearErr('name')" />
          <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
        </div>
        <div>
          <label class="form-label">이메일<span class="form-required">*</span></label>
          <input v-model="form.email" type="email" class="form-input" placeholder="hello@example.com" @input="clearErr('email')" />
          <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
        </div>
        <div>
          <label class="form-label">연락처</label>
          <input v-model="form.tel" class="form-input" placeholder="010-1234-5678" />
        </div>
        <div>
          <label class="form-label">주문번호</label>
          <input v-model="form.orderNo" class="form-input" placeholder="있으시면 입력해주세요" />
        </div>
      </div>
      <div style="margin-bottom:14px;">
        <label class="form-label">문의 유형</label>
        <select v-model="form.inquiryType" class="form-input">
          <option value="">선택해주세요 (선택사항)</option>
          <option v-for="c in inquiryCodes" :key="c.codeId" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
      </div>
      <div style="margin-bottom:14px;">
        <label class="form-label">문의 내용<span class="form-required">*</span></label>
        <textarea v-model="form.desc" class="form-input" rows="5" placeholder="문의하실 내용을 자유롭게 입력해주세요. (최소 10자)" @input="clearErr('desc')"></textarea>
        <div v-if="errors.desc" class="form-error">{{ errors.desc }}</div>
      </div>
      <div style="margin-bottom:22px;">
        <label class="form-label">첨부파일</label>
        <base-attach-grp
          :model-value="form.attachGrpId"
          @update:model-value="form.attachGrpId = $event"
          :admin-data="contactData"
          ref-id="CONTACT"
          :show-toast="showToast"
          grp-code="CONTACT_ATTACH"
          grp-nm="문의 첨부파일"
          :max-count="5"
          :max-size-mb="10"
        />
      </div>
      <button class="btn-blue" @click="submitForm" style="width:100%;padding:13px;">문의 접수하기</button>
    </div>

    <!-- 연락처 + 미니 FAQ -->
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">📋 연락처</h3>
        <div class="info-row"><span class="info-icon">📞</span><div><div class="info-label">전화</div><div class="info-val">{{ config.tel }}</div></div></div>
        <div class="info-row"><span class="info-icon">📧</span><div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div></div>
        <div class="info-row"><span class="info-icon">🕘</span><div><div class="info-label">운영 시간</div><div class="info-val">평일 09:00 – 18:00</div></div></div>
        <div class="info-row"><span class="info-icon">🚚</span><div><div class="info-label">배송 안내</div><div class="info-val">결제 확인 후 1~2 영업일 출고</div></div></div>
      </div>
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

    const inquiryCodes = computed(() =>
      window.cmUtil.codesByGroup(props.config || {}, 'shopjoy_contact_inquiry')
    );

    const form = reactive({ name: '', email: '', tel: '', orderNo: '', inquiryType: '', desc: '', attachGrpId: null });
    const errors = reactive({});
    const openFaq = ref(null);

    /* BaseAttachGrp 용 로컬 데이터 저장소 */
    const contactData = reactive({
      attaches:   [],
      attachGrps: [],
      nextId(arr, key) {
        return arr.length ? Math.max(...arr.map(x => x[key])) + 1 : 1;
      },
    });

    const clearErr = k => { if (errors[k] !== undefined) delete errors[k]; };

    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      let ok = true;
      if (!form.name.trim() || form.name.trim().length < 2) { errors.name = '이름을 2자 이상 입력해주세요.'; ok = false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = '유효한 이메일을 입력해주세요.'; ok = false; }
      if (!form.desc.trim() || form.desc.trim().length < 10) { errors.desc = '문의 내용을 최소 10자 이상 입력해주세요.'; ok = false; }
      return ok;
    };

    const submitForm = async () => {
      if (!validate()) return;
      if (window.frontApi) {
        await window.frontApi.post('contact-intake.json', {
          source: 'shopjoy',
          name: form.name,
          email: form.email,
          tel: form.tel,
          orderNo: form.orderNo,
          inquiryType: form.inquiryType,
          desc: form.desc,
        }).catch(() => {});
      }
      props.showToast('문의가 접수되었습니다. 빠르게 답변드리겠습니다!', 'success');
      Object.assign(form, { name: '', email: '', tel: '', orderNo: '', inquiryType: '', desc: '', attachGrpId: null });
      contactData.attaches.splice(0);
      contactData.attachGrps.splice(0);
    };

    return { form, errors, openFaq, clearErr, submitForm, inquiryCodes, contactData };
  }
};

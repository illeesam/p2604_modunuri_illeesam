/* PARTYROOM — contact (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Contact = {
    name: 'Contact',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:900px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">고객센터</h1>
          <p class="section-subtitle">문의사항을 남겨주시면 24시간 이내 답변 드립니다.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 320px;gap:1.5rem;" class="contact-grid">
          <!-- Contact form -->
          <div class="card" style="padding:1.75rem;">
            <h2 style="font-weight:800;font-size:1rem;color:var(--text-primary);margin-bottom:1.25rem;">문의 보내기</h2>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div>
                <label class="form-label">이름<span class="form-required">*</span></label>
                <input class="form-input" v-model="partyroom.contactForm.name" placeholder="홍길동" @input="partyroom.clearContactError('name')" />
                <div class="form-error" v-if="partyroom.contactErrors.name">{{ partyroom.contactErrors.name }}</div>
              </div>
              <div>
                <label class="form-label">연락처</label>
                <input class="form-input" v-model="partyroom.contactForm.tel" placeholder="010-9998-0857" />
              </div>
              <div>
                <label class="form-label">이메일<span class="form-required">*</span></label>
                <input class="form-input" v-model="partyroom.contactForm.email" type="email" placeholder="example@email.com" @input="partyroom.clearContactError('email')" />
                <div class="form-error" v-if="partyroom.contactErrors.email">{{ partyroom.contactErrors.email }}</div>
              </div>
              <div>
                <label class="form-label">문의 내용<span class="form-required">*</span></label>
                <textarea
                  class="form-input"
                  v-model="partyroom.contactForm.msg"
                  rows="5"
                  placeholder="문의 내용을 자유롭게 작성해주세요. (최소 10자)"
                  style="resize:vertical;"
                  @input="partyroom.clearContactError('msg')"
                ></textarea>
                <div class="form-error" v-if="partyroom.contactErrors.msg">{{ partyroom.contactErrors.msg }}</div>
              </div>
              <button class="btn-gold" style="width:100%;justify-content:center;padding:12px;" @click="partyroom.submitContact">
                문의 접수하기
              </button>
            </div>
          </div>

          <!-- Contact info sidebar -->
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div class="card" style="padding:1.25rem;">
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:10px;font-size:0.9rem;">연락처</div>
              <div style="font-size:0.85rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;">
                <div><span style="color:var(--gold);">📞</span> <a :href="'tel:' + partyroom.config.tel" style="color:inherit;">{{ partyroom.config.tel }}</a></div>
                <div><span style="color:var(--gold);">✉️</span> {{ partyroom.config.email }}</div>
                <div><span style="color:var(--gold);">📍</span> {{ partyroom.config.address }}</div>
              </div>
            </div>
            <div class="card" style="padding:1.25rem;">
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:10px;font-size:0.9rem;">운영 시간</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.75;">
                <div>평일 09:00 ~ 18:00</div>
                <div>주말 / 공휴일 휴무</div>
                <div style="margin-top:6px;color:var(--gold);font-weight:600;">24시간 문의 접수 가능</div>
              </div>
            </div>
            <div class="card" style="padding:1.25rem;background:var(--gold-dim);border-color:rgba(201,168,76,0.3);">
              <div style="font-weight:700;color:var(--gold);margin-bottom:6px;font-size:0.9rem;">계좌 안내</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.75;">
                {{ partyroom.config.bank.name }}<br>
                <strong style="color:var(--text-primary);">{{ partyroom.config.bank.account }}</strong><br>
                {{ partyroom.config.bank.holder }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact responsive -->
      <style>
        @media (max-width: 700px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      </style>
    `,
  };
})(window);

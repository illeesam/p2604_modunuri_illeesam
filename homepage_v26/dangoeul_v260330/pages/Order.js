window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Order = {
  name: 'Order',
  props: ['navigate', 'config'],
  template: /* html */ `
  <div class="page-wrap">
    <div style="margin-bottom:28px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">주문하기</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">결제 안내</h1>
      <p class="section-subtitle">
        결제 방식은 <span class="gradient-text" style="font-weight:800;">계좌이체</span>로 안내드립니다.
      </p>
    </div>

    <div class="grid-2" style="gap:20px;align-items:start;">
      <div class="card" style="padding:28px;text-align:left;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">계좌이체 진행 절차</h2>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="info-row">
            <span class="info-icon">1️⃣</span>
            <div>
              <div class="info-label">주문 요청</div>
              <div class="info-val" style="margin-top:4px;">원하시는 상품/수량/옵션을 주문하기 또는 문의로 남겨주세요.</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">2️⃣</span>
            <div>
              <div class="info-label">계좌 안내</div>
              <div class="info-val" style="margin-top:4px;">담당 확인 후 입금 계좌를 개별 안내드립니다.</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">3️⃣</span>
            <div>
              <div class="info-label">입금 확인</div>
              <div class="info-val" style="margin-top:4px;">입금 확인 후 일정에 맞춰 진행됩니다.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="padding:28px;text-align:left;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">입금 시 유의사항</h2>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="info-row">
            <span class="info-icon">🏦</span>
            <div>
              <div class="info-label">결제 방식</div>
              <div class="info-val" style="margin-top:4px;">계좌이체</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🧾</span>
            <div>
              <div class="info-label">입금자/메모</div>
              <div class="info-val" style="margin-top:4px;">문의자명(또는 주문자명) + 메모(주문번호)를 부탁드립니다.</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">📞</span>
            <div>
              <div class="info-label">연락처</div>
              <div class="info-val" style="margin-top:4px;">{{ config.tel }} / {{ config.email }}</div>
            </div>
          </div>
        </div>

        <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-outline" @click="navigate('contact')" style="flex:1;min-width:220px;">문의·주문하기</button>
          <button class="btn-blue" @click="navigate('products')" style="flex:1;min-width:220px;">상품 다시 보기</button>
        </div>
      </div>
    </div>
  </div>
  `,
};


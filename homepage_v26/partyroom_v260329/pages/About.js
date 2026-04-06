/* PARTYROOM — about (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.About = {
    name: 'About',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:960px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">상품안내</h1>
          <p class="section-subtitle">목적에 따라 선택할 수 있는 다양한 공간을 소개합니다.</p>
        </div>

        <!-- Room type overview -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-bottom:2.5rem;">
          <div v-for="item in [
            { icon:'🎉', name:'파티룸', desc:'생일파티, 소모임, 이벤트에 최적화된 분위기 공간입니다.' },
            { icon:'📚', name:'스터디룸', desc:'집중력 높은 개인/그룹 스터디를 위한 조용한 환경입니다.' },
            { icon:'📊', name:'세미나룸', desc:'프레젠테이션, 워크숍, 팀 회의를 위한 장비 완비 공간입니다.' },
            { icon:'🎬', name:'멀티/촬영룸', desc:'유튜브, 강의 촬영, 포캐스트 등 미디어 활동을 위한 공간입니다.' },
          ]" :key="item.name" class="card" style="padding:1.5rem;display:flex;gap:14px;align-items:flex-start;">
            <div class="feature-icon-box">{{ item.icon }}</div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;margin-bottom:6px;color:var(--text-primary);">{{ item.name }}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Pricing structure -->
        <div style="margin-bottom:2.5rem;">
          <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:1rem;">요금 구조</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
            <div class="card" style="padding:1.25rem;text-align:center;">
              <div style="font-size:1.6rem;margin-bottom:8px;">⏰</div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">시간 단위</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">최소 1시간부터 원하는 만큼 이용</div>
            </div>
            <div class="card" style="padding:1.25rem;text-align:center;">
              <div style="font-size:1.6rem;margin-bottom:8px;">📅</div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">일 단위</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">하루 종일 자유롭게 이용</div>
            </div>
            <div class="card" style="padding:1.25rem;text-align:center;">
              <div style="font-size:1.6rem;margin-bottom:8px;">📆</div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">장기 대여</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">3일 이상 최대 30% 할인</div>
            </div>
          </div>
        </div>

        <!-- Discount policy -->
        <div style="margin-bottom:2.5rem;">
          <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:1rem;">장기 대여 할인</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;">
            <div v-for="d in partyroom.config.discounts" :key="d.days" class="card" style="padding:1.25rem;text-align:center;">
              <div class="discount-badge" style="margin-bottom:10px;">{{ d.badge }}</div>
              <div style="font-weight:700;font-size:1rem;color:var(--text-primary);">{{ d.days }}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;">{{ d.rate }}</div>
            </div>
          </div>
        </div>

        <!-- Payment notice -->
        <div class="card" style="padding:1.5rem;background:var(--gold-dim);border-color:rgba(201,168,76,0.3);">
          <div style="font-weight:800;color:var(--gold);margin-bottom:8px;font-size:0.95rem;">💳 결제 안내</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.75;">
            <p>결제는 <strong style="color:var(--text-primary);">계좌이체만 가능</strong>합니다.</p>
            <p style="margin-top:6px;">예약 확정 후 <strong style="color:var(--text-primary);">24시간 이내</strong> 아래 계좌로 입금해주세요.</p>
            <p style="margin-top:8px;font-size:0.95rem;font-weight:700;color:var(--text-primary);">
              {{ partyroom.config.bank.name }} {{ partyroom.config.bank.account }} {{ partyroom.config.bank.holder }}
            </p>
          </div>
        </div>
      </div>
    `,
  };
})(window);

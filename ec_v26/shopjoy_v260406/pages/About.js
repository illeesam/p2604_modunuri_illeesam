/* ShopJoy - About Page (회사소개) */
window.About = {
  name: 'About',
  props: ['navigate', 'config'],
  template: /* html */ `
<div class="page-wrap">

  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="회사소개"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">About</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">회사소개</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">회사소개</span>
      </div>
    </div>
  </div>

  <!-- 브랜드 히어로 -->
  <div style="background:linear-gradient(135deg,#bfdbfe,#c7d2fe);border-radius:16px;padding:20px 32px;margin-bottom:32px;color:#1e3a8a;text-align:center;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.3);"></div>
    <div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.3);"></div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;position:relative;z-index:1;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:2rem;">🛍️</div>
        <div>
          <div style="font-size:1.3rem;font-weight:900;line-height:1.2;">ShopJoy</div>
          <div style="font-size:0.8rem;opacity:0.75;">쇼핑의 즐거움</div>
        </div>
      </div>
      <div style="width:1px;height:36px;background:rgba(30,58,138,0.2);"></div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:1.3rem;font-weight:900;">2024</div>
          <div style="font-size:0.72rem;opacity:0.7;margin-top:1px;">설립년도</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.3rem;font-weight:900;">50+</div>
          <div style="font-size:0.72rem;opacity:0.7;margin-top:1px;">상품 종류</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.3rem;font-weight:900;">5개</div>
          <div style="font-size:0.72rem;opacity:0.7;margin-top:1px;">카테고리</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.3rem;font-weight:900;">100%</div>
          <div style="font-size:0.72rem;opacity:0.7;margin-top:1px;">고객 만족 목표</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 미션 & 비전 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(10px,2vw,16px);margin-bottom:clamp(16px,2vw,24px);">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
      <div style="font-size:1.8rem;margin-bottom:12px;">🎯</div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;">미션</div>
      <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
        합리적인 가격으로 트렌디한 의류를 제공하여, 누구나 자신만의 스타일을 쉽고 즐겁게 표현할 수 있도록 돕습니다.
      </p>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
      <div style="font-size:1.8rem;margin-bottom:12px;">✨</div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;">비전</div>
      <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
        고객이 원하는 상품을 가장 빠르고 편리하게 만나볼 수 있는, 대한민국 최고의 패션 쇼핑 플랫폼이 되겠습니다.
      </p>
    </div>
  </div>

  <!-- 핵심 가치 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(14px,2.5vw,24px);margin-bottom:clamp(16px,2vw,24px);">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;">💎 핵심 가치</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
      <div v-for="v in values" :key="v.icon" style="display:flex;gap:12px;align-items:flex-start;">
        <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;"
          :style="'background:'+v.bg+';'">{{ v.icon }}</div>
        <div>
          <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">{{ v.title }}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">{{ v.desc }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 연혁 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;">📅 연혁</div>
    <div style="position:relative;padding-left:24px;">
      <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--border);"></div>
      <div v-for="(h, i) in history" :key="i" style="position:relative;margin-bottom:20px;padding-left:12px;">
        <div style="position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--blue);"></div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--blue);margin-bottom:2px;">{{ h.date }}</div>
        <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);margin-bottom:2px;">{{ h.title }}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);">{{ h.desc }}</div>
      </div>
    </div>
  </div>

  <!-- 사업자 정보 -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:16px;">📋 사업자 정보</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
      <div v-for="info in bizInfo" :key="info.label" style="display:flex;gap:10px;">
        <span style="font-size:0.8rem;color:var(--text-muted);min-width:80px;flex-shrink:0;">{{ info.label }}</span>
        <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">{{ info.value }}</span>
      </div>
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:var(--bg-base);border-radius:8px;font-size:0.8rem;color:var(--text-muted);line-height:1.7;">
      통신판매업자는 거래에 관한 약관, 청약철회 가능여부, 배송비, 교환·환불·보증 조건 및 품질보증기준에 따라 상거래를 운영합니다.
    </div>
  </div>

</div>
  `,
  setup() {
    const values = [
      { icon:'😊', bg:'#dbeafe', title:'고객 중심', desc:'모든 의사결정의 기준은 고객 만족입니다.' },
      { icon:'💡', bg:'#fef3c7', title:'트렌드 선도', desc:'최신 패션 트렌드를 빠르게 반영합니다.' },
      { icon:'🌱', bg:'#dcfce7', title:'지속 가능성', desc:'환경을 생각하는 지속 가능한 패션을 지향합니다.' },
      { icon:'🤝', bg:'#f3e8ff', title:'신뢰와 투명성', desc:'정직한 정보와 합리적인 가격으로 신뢰를 쌓습니다.' },
    ];
    const history = [
      { date:'2024년 11월', title:'ShopJoy 서비스 론칭', desc:'베타 버전 출시 및 초기 상품 라인업 구축' },
      { date:'2024년 12월', title:'회원 1,000명 달성', desc:'오픈 한 달 만에 1,000명의 회원 유치' },
      { date:'2025년 02월', title:'카테고리 확장', desc:'악세서리 카테고리 신규 추가, 총 5개 카테고리 운영' },
      { date:'2025년 06월', title:'모바일 앱 출시', desc:'iOS/Android 앱 동시 출시 및 앱 전용 할인 이벤트 진행' },
      { date:'2026년 01월', title:'50개 상품 라인업 완성', desc:'다양한 카테고리에 걸쳐 50가지 상품 구비' },
      { date:'2026년 04월', title:'리뉴얼 오픈', desc:'새로운 UI/UX로 전면 리뉴얼. 더 편리한 쇼핑 경험 제공' },
    ];
    const bizInfo = [
      { label:'상호명',    value:'ShopJoy (쇼핑조이)' },
      { label:'대표자',    value:'송성일' },
      { label:'사업자번호', value:'123-45-67890' },
      { label:'통신판매업', value:'제2024-성남중원-0001호' },
      { label:'주소',      value:'경기도 성남시 중원구 성남대로 997번길 49-14 201호' },
      { label:'고객센터',  value:'010-3805-0206' },
      { label:'이메일',    value:'illeesam@gmail.com' },
    ];
    return { values, history, bizInfo };
  }
};

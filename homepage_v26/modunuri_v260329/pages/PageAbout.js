/* MODUNURI - PageAbout */
window.PageAbout = {
  name: 'PageAbout',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">회사소개</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:12px;">모두를 위한 기술,<br><span class="gradient-text">모두누리</span></h1>
    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.8;max-width:600px;">
      2021년 설립 이후, 모두누리는 중소기업부터 대기업까지 다양한 규모의 고객사에 맞춤형 소프트웨어 개발을 제공해왔습니다. AI, ERP, 클라우드, 모바일 앱 등 폭넓은 기술 스택으로 고객의 디지털 혁신을 이끌어 왔습니다.
    </p>
  </div>

  <!-- Founding story -->
  <div class="card" style="padding:28px;margin-bottom:28px;">
    <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🏗️ 창업 스토리</h2>
    <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.8;">
      모두누리는 "모든 사람이 누릴 수 있는 기술"이라는 비전 아래, 기술 격차 해소와 접근 가능한 디지털 전환을 목표로 설립되었습니다. 초기 5명의 개발팀으로 시작해 현재 50여 명의 전문 인력이 함께하고 있으며, 국내외 30여 개 고객사 업무 구축을 기반으로 기술 솔루션 기업으로 성장했습니다.
    </p>
  </div>

  <!-- Team stats -->
  <div class="grid-4" style="margin-bottom:28px;">
    <div class="stat-card">
      <div class="stat-number" style="color:var(--blue);">5+</div>
      <div class="stat-label">설립 연수</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--green);">5+</div>
      <div class="stat-label">전문 인력</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--purple);">10+</div>
      <div class="stat-label">고객사</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--blue);">5+</div>
      <div class="stat-label">제품</div>
    </div>
  </div>

  <!-- Values -->
  <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">핵심 가치</h2>
  <div class="grid-3" style="margin-bottom:36px;">
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">⚙️</div>
      <div style="font-size:1rem;font-weight:700;color:var(--blue);margin-bottom:8px;">기술력</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">최신 기술 트렌드를 선도하며 견고하고 확장 가능한 시스템을 구축합니다.</p>
    </div>
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">🤝</div>
      <div style="font-size:1rem;font-weight:700;color:var(--green);margin-bottom:8px;">신뢰</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">투명한 커뮤니케이션과 약속 이행으로 장기적 파트너 관계를 구축합니다.</p>
    </div>
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">💡</div>
      <div style="font-size:1rem;font-weight:700;color:var(--purple);margin-bottom:8px;">혁신</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">고객 문제를 창의적으로 해결하며 끊임없이 더 나은 방식을 찾습니다.</p>
    </div>
  </div>

  <!-- 구축사이트 타임라인 -->
  <div style="margin-bottom:36px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
      <h2 class="section-title" style="font-size:1.2rem;margin-bottom:0;">구축사이트</h2>
      <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">총 {{ totalProjects }}건</span>
    </div>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:24px;">대표자 개인 경력 포함 주요 프로젝트 이력</p>

    <div v-for="group in projectGroups" :key="group.period" style="margin-bottom:32px;">
      <!-- 기간 헤더 -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div :style="'display:flex;align-items:center;justify-content:center;min-width:110px;height:32px;border-radius:16px;font-size:0.78rem;font-weight:800;color:#fff;background:'+group.color+';'">
          {{ group.period }}
        </div>
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;">{{ group.items.length }}건</span>
      </div>

      <!-- 프로젝트 카드 그리드 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;padding-left:8px;">
        <div v-for="(p, idx) in group.items" :key="group.period+'-'+idx"
          style="border-radius:12px;border:1px solid var(--border);background:var(--bg-card);padding:14px 16px;position:relative;overflow:hidden;transition:box-shadow 0.2s;"
          @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
          @mouseleave="$event.currentTarget.style.boxShadow='none'">
          <!-- 기간 색상 바 -->
          <div :style="'position:absolute;top:0;left:0;width:3px;height:100%;background:'+group.color+';border-radius:3px 0 0 3px;'"></div>
          <div style="padding-left:6px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);line-height:1.4;flex:1;">{{ p.name }}</div>
              <span style="font-size:0.68rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;margin-top:2px;">{{ p.period }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
              <span style="font-size:0.72rem;font-weight:600;color:var(--text-secondary);">{{ p.client }}</span>
              <span v-if="p.role" style="font-size:0.68rem;padding:1px 7px;border-radius:10px;background:var(--blue-dim);color:var(--blue);font-weight:600;">{{ p.role }}</span>
            </div>
            <div style="font-size:0.7rem;color:var(--text-muted);line-height:1.5;display:flex;flex-wrap:wrap;gap:4px;">
              <span v-for="t in p.tech.split('·')" :key="t"
                style="padding:1px 6px;border-radius:6px;background:var(--bg-base);border:1px solid var(--border);">{{ t.trim() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 사업자등록증명 -->
  <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">사업자등록증명</h2>
  <div class="card" style="padding:28px;margin-bottom:28px;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
      <img
        src="assets/images/docs/business-registration.png"
        alt="사업자등록증명"
        style="max-width:680px;width:100%;border-radius:8px;border:1px solid var(--border);box-shadow:0 2px 12px rgba(0,0,0,0.08);"
        @error="$event.target.style.display='none';$event.target.nextElementSibling.style.display='flex'"
      />
      <div style="display:none;flex-direction:column;align-items:center;gap:10px;padding:40px;color:var(--text-muted);font-size:0.875rem;">
        <span style="font-size:2rem;">📄</span>
        <span>사업자등록증명 이미지를 불러올 수 없습니다.</span>
        <span style="font-size:0.75rem;">assets/images/docs/business-registration.png</span>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);text-align:center;margin-top:4px;">
        사업자등록번호: 298-06-01947 · 대표자: 송성일 · 등록일: 2021년 05월 17일
      </p>
    </div>
  </div>

  <!-- 연락처 정보 -->
  <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">연락처 정보</h2>
  <div class="card" style="padding:28px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      <div style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;background:var(--bg-base);border:1px solid var(--border);">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">👤</div>
        <div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;margin-bottom:3px;">대표자</div>
          <div style="font-size:0.95rem;font-weight:700;color:var(--text-primary);">송성일</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;background:var(--bg-base);border:1px solid var(--border);">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--green-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">📞</div>
        <div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;margin-bottom:3px;">전화번호</div>
          <a :href="'tel:'+config.tel" style="font-size:0.95rem;font-weight:700;color:var(--blue);text-decoration:none;">{{ config.tel }}</a>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;background:var(--bg-base);border:1px solid var(--border);">
        <div style="width:40px;height:40px;border-radius:10px;background:var(--purple-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">✉️</div>
        <div style="min-width:0;">
          <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;margin-bottom:3px;">이메일</div>
          <a :href="'mailto:'+config.email" style="font-size:0.88rem;font-weight:700;color:var(--blue);text-decoration:none;word-break:break-all;">{{ config.email }}</a>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  setup() {
    const projectGroups = [
      {
        period: '2024 – 2026',
        color: 'linear-gradient(90deg,#0099cc,#00c4a7)',
        items: [
          { period: '2026.01~2026.03', name: '헥토데이터 그룹사 통합SMS시스템', client: '헥토데이터', role: '개발', tech: 'Java/Spring · Vue.js' },
          { period: '2025.05~2025.12', name: '하이닉스 PDK & DMR', client: 'SK하이닉스', role: '개발', tech: 'Java/Spring · React' },
          { period: '2025.01~2025.03', name: '노루페인트 주문포털(공통)', client: '노루페인트', role: '개발PL', tech: 'Java/Spring · Vue.js' },
        ]
      },
      {
        period: '2021 – 2023',
        color: 'linear-gradient(90deg,#4c6ef5,#7950f2)',
        items: [
          { period: '2023.03~2024.12', name: '마이디룸몰 미커머스 운영개발', client: '마이디룸', role: '운영개발', tech: 'Java/MSA · React · Vue.js(nuxt)' },
          { period: '2022.11~2023.02', name: '한성름 리뉴얼 FO_PC 상품상세', client: '한성', role: '개발', tech: 'Java/MSA · Vue.js(nuxt) · k8s' },
          { period: '2022.02~2022.10', name: '한화기계 PMS(Gantt) 구축', client: '한화기계', role: '개발', tech: 'C#.net Core6 · React' },
          { period: '2021.10~2022.01', name: '삼성SDS 클라우드 서비스 모니터링', client: '삼성SDS', role: '개발', tech: 'Java/Spring · Vue.js(Lego)' },
          { period: '2021.03~2021.09', name: '차세대 MIS구축(계약관리)', client: 'SKCC', role: '개발', tech: 'Java/Spring · Vue.js · k8s' },
        ]
      },
      {
        period: '2017 – 2020',
        color: 'linear-gradient(90deg,#2f9e44,#66a80f)',
        items: [
          { period: '2020.03~2021.02', name: 'ITSM 모바일(메뉴온,KG동부제철,연세의료원,LG U+)', client: '4개사', role: '개발', tech: 'Java/Spring · Vue.js' },
          { period: '2019.10~2020.02', name: '하이닉스 hess(품질규격)', client: 'SK하이닉스', role: '개발', tech: 'Java/Spring · Nexcore' },
          { period: '2017.07~2019.09', name: 'ITSM구축(스마일게이트,한국고용,하이닉스SW,LG U+,인천공항)', client: '6개사', role: '설계/개발PL', tech: 'Java/Spring · JSP · Webix' },
          { period: '2017.01~2017.06', name: 'SKT iMembership 웹 리뉴얼(주문·결제)', client: 'SKT', role: '개발', tech: 'JAVA · Nexcore · JSP · jQuery' },
        ]
      },
      {
        period: '2013 – 2016',
        color: 'linear-gradient(90deg,#e67700,#f59f00)',
        items: [
          { period: '2016.01~2016.12', name: 'NS홈쇼핑 KT IvPay(주문·대금)', client: 'NS홈쇼핑', role: '개발', tech: 'JAVA · eGovFramework' },
          { period: '2015.12~2016.01', name: 'SK하이닉스 GSCM(수요파트 샘플관리)', client: 'SK하이닉스', role: '개발', tech: 'JAVA · Nexacro v14' },
          { period: '2015.05~2015.11', name: '아마존 구매대행(소핑몰 내부업무)', client: '예스커뮤니케이션', role: '개발', tech: 'JAVA · eGovFramework' },
          { period: '2015.04', name: 'MG새마을금고 차세대(이컨버터 컨설턴트)', client: 'MG새마을금고', role: '컨설팅', tech: 'JAVA · XPlatform v9.2 · Devon' },
          { period: '2014.07~2014.12', name: '솔루션개발 비컨버터 개발', client: '예스커뮤니케이션', role: '설계/개발', tech: 'JAVA · Nexacro · Spring' },
          { period: '2013.09~2014.06', name: '기업은행 POST 차세대(고객파트)', client: 'IBK기업은행', role: '개발', tech: 'AnyFramework · 인젠트v4' },
          { period: '2013.07~2013.08', name: '국민연금 차세대 자산운용시스템', client: '국민연금', role: '공통팀장', tech: 'Proframe C · XPlatform v9.2' },
          { period: '2013.01~2013.06', name: 'EX한국도로공사 영업소관리시스템', client: '한국도로공사', role: '설계/개발', tech: 'JAVA · XPlatform v9.2 · eGov' },
        ]
      },
      {
        period: '2005 – 2012',
        color: 'linear-gradient(90deg,#c2255c,#e03131)',
        items: [
          { period: '2012.05~2012.12', name: '비바메디 SCM(약품물류 공급망관리)', client: '비바메디', role: '개발', tech: 'FLEX v4 · JAVA · Eclipse' },
          { period: '2012.01~2012.04', name: 'SKT M2M OpenAPI(단말기관리 TCP/IP서버)', client: 'SKT', role: '개발', tech: 'JAVA · JSP · NETTY' },
          { period: '2011.01~', name: 'LGCNS 금융솔루션 신보험', client: 'LGCNS', role: '개발', tech: 'IBM RSA · Miplatform' },
          { period: '2009.12~2010.12', name: 'LH한국토지주택공사 연말정산&인사전표 고도화', client: '한국토지공사', role: '설계/개발', tech: 'Trustforms · Spring' },
          { period: '2009.07~2009.11', name: '대법원 전자소송 1차 특허', client: '대법원', role: '설계/개발', tech: 'JSP · JAVA · EJB · Ajax · Devon' },
          { period: '2008.07~2009.07', name: '카자흐스탄 우편물류시스템(Miplatform공통)', client: '카자흐스탄', role: '설계/개발', tech: 'Miplatform · Nexcore4 · Mina' },
          { period: '2007.12~2008.03', name: '한국토지공사 MIS(자금·세무·채권)', client: '한국토지공사', role: '개발', tech: 'JAVA · Trustforms · Spring' },
          { period: '2006.06~2007.12', name: '티브로드 통신시스템(고객·접수·작업)', client: '티브로드', role: '개발/운영', tech: 'JAVA · JSP · MVC' },
          { period: '2005.07~2006.06', name: '삼성SDS솔루션 기술지원 시스템', client: '삼성SDS', role: '개발/운영', tech: 'JAVA · JSP · MVC' },
          { period: '2005.03~2005.07', name: '파원룸(고객·접수·작업)', client: '파원룸', role: '개발', tech: 'JAVA · JSP · MVC' },
        ]
      },
      {
        period: '2000 – 2004',
        color: 'linear-gradient(90deg,#495057,#868e96)',
        items: [
          { period: '2004.05~2005.02', name: 'HFMS2004 한국도로공사 시설물관리', client: '고속도로정보통신', role: '설계/개발', tech: 'JAVA · JSP(MVC)' },
          { period: '2003.08~2004.04', name: 'FTMS2003 한국도로공사 교통관리', client: '한국도로공사', role: '개발', tech: 'JAVA · MVC · Javascript' },
          { period: '2002.09~2003.07', name: '홈페이지·쇼핑몰', client: '㈜코리아팀', role: '설계/개발', tech: 'ASP.NET(C#)' },
          { period: '2002.05~2002.09', name: '영업관리 그룹웨어(메일·전자결재·메신저)', client: 'LG생명공학', role: '개발', tech: 'JAVA · Javascript · Lotus Script' },
          { period: '2001.05~2002.04', name: '중앙대학교 종합정보시스템(사무자동화)', client: '중앙대학교', role: '개발', tech: 'JAVA · Javascript · Lotus Notes' },
          { period: '2000.08~2001.05', name: '대학원대학교 학사행정시스템', client: '베뢰아대학원대학교', role: '개발', tech: 'Power Builder 6.5' },
        ]
      },
    ];
    const totalProjects = projectGroups.reduce((s, g) => s + g.items.length, 0);
    return { projectGroups, totalProjects };
  }
};

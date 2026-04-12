/* ShopJoy - EventView (이벤트 상세) */
window.EventView = {
  name: 'EventView',
  props: ['navigate', 'config', 'editId'],
  setup(props) {
    const { ref, computed } = Vue;

    /* ── 이벤트 데이터 ── */
    const events = [
      {
        id: 1,
        title: '봄 베스트 상품 달력이벤트 70% 혜택',
        tag: '할인', tagColor: '#e8587a',
        status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.30',
        heroBg: 'linear-gradient(135deg,#c9d6ff,#e2e2e2)',
        heroTextColor: '#1e293b',
        heroEyebrow: 'ONLY FOR THE PLUS+',
        heroSub: '봄 시즌 베스트 상품을 최대 70% 할인된 가격으로 만나보세요.',
        tabs: ['봄 베스트', '신상품', '특가 세일'],
        productSets: [
          [1,2,3,4,5,6,7,8],
          [9,10,11,12,1,2,3,4],
          [5,6,7,8,9,10,11,12],
        ],
        benefits: [
          { label: '4월 1일부터 | 30만원 이상', value: '15,000원 쿠폰', btn: '다운받기' },
          { label: '4월 1일부터 | 50만원 이상', value: '30,000원 쿠폰', btn: '다운받기' },
          { label: '4월 15일부터 | 신규가입', value: '5,000원 쿠폰', btn: '다운받기' },
        ],
        notice: [
          '본 이벤트는 ShopJoy 온라인 한정 이벤트입니다.',
          '쿠폰은 기간 내 1회 다운로드 가능하며, 사용 기한은 다운로드 후 7일입니다.',
          '일부 브랜드 및 상품은 할인 적용이 제외될 수 있습니다.',
          '본 이벤트는 사전 공지 없이 조기 종료될 수 있습니다.',
          '쿠폰 다운로드 후 취소 및 환불은 불가합니다.',
        ],
      },
      {
        id: 2,
        title: '4월 신한카드 특시할인',
        tag: '카드혜택', tagColor: '#3b82f6',
        status: 'ongoing', startDate: '2026.04.08', endDate: '2026.04.30',
        heroBg: 'linear-gradient(135deg,#ffecd2,#fcb69f)',
        heroTextColor: '#7c2d12',
        heroEyebrow: '신한카드 즉시할인',
        heroSub: '신한카드로 결제 시 즉시 10% 할인 혜택을 드립니다.',
        tabs: ['전체 상품', '인기 상품'],
        productSets: [
          [3,4,5,6,7,8,9,10],
          [1,2,11,12,3,4,5,6],
        ],
        benefits: [
          { label: '10만원 이상 결제 시', value: '즉시 10% 할인', btn: '자세히 보기' },
        ],
        notice: [
          '신한카드 결제 시에만 적용됩니다.',
          '다른 할인 및 쿠폰과 중복 적용 불가합니다.',
          '일부 상품은 적용에서 제외될 수 있습니다.',
        ],
      },
      {
        id: 3,
        title: '4월 더플러스 : 봄 쇼핑 3만원 추가 혜택',
        tag: '적립', tagColor: '#8b5cf6',
        status: 'ongoing', startDate: '2026.04.06', endDate: '2026.04.12',
        heroBg: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
        heroTextColor: '#1e3a5f',
        heroEyebrow: 'THE PLUS+ EXCLUSIVE',
        heroSub: '구매금액 별 최대 3만원 쿠폰으로 장바구니 추가 할인을 받아 보세요.',
        tabs: ['추천 상품', '시즌 특가'],
        productSets: [
          [2,4,6,8,10,12,1,3],
          [7,9,11,5,2,4,6,8],
        ],
        benefits: [
          { label: '4월 6일 ~ 12일 | 20만원 이상', value: '10,000원 쿠폰', btn: '다운받기' },
          { label: '4월 6일 ~ 12일 | 50만원 이상', value: '30,000원 쿠폰', btn: '다운받기' },
        ],
        notice: [
          'THE PLUS+ 회원 전용 이벤트입니다.',
          '쿠폰은 기간 내 1회 다운로드 가능합니다.',
          '행사 기간 이후 다운로드 불가합니다.',
        ],
      },
      {
        id: 4,
        title: '더플러스 서울점 : Sunlit Breeze',
        tag: '매장', tagColor: '#10b981',
        status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.20',
        heroBg: 'linear-gradient(135deg,#d4fc79,#96e6a1)',
        heroTextColor: '#064e3b',
        heroEyebrow: 'STORE EVENT',
        heroSub: '서울점에서 만나는 봄의 특별한 햇살 같은 이벤트.',
        tabs: ['추천 상품'],
        productSets: [[1,3,5,7,9,11,2,4]],
        benefits: [
          { label: '매장 방문 구매 시', value: '추가 10% 할인', btn: '자세히 보기' },
        ],
        notice: ['서울점 한정 이벤트입니다.', '온라인 동시 진행되지 않습니다.'],
      },
      {
        id: 5,
        title: '신상품 출시 기념 구매 혜택',
        tag: '신상품', tagColor: '#f59e0b',
        status: 'ongoing', startDate: '2026.04.10', endDate: '2026.04.25',
        heroBg: 'linear-gradient(135deg,#f7971e,#ffd200)',
        heroTextColor: '#451a03',
        heroEyebrow: 'NEW ARRIVALS',
        heroSub: '신상품 구매 시 추가 할인 및 사은품 증정 혜택을 드립니다.',
        tabs: ['신상품', '추천 상품'],
        productSets: [
          [5,6,7,8,9,10,11,12],
          [1,2,3,4,5,6,7,8],
        ],
        benefits: [
          { label: '신상품 구매 시', value: '사은품 증정', btn: '자세히 보기' },
          { label: '2개 이상 구매 시', value: '추가 5% 할인', btn: '자세히 보기' },
        ],
        notice: ['신상품 카테고리 한정 이벤트입니다.', '사은품은 소진 시 조기 종료됩니다.'],
      },
      {
        id: 6,
        title: '2026 S/S 컬렉션 선공개',
        tag: '패션', tagColor: '#ec4899',
        status: 'ongoing', startDate: '2026.04.15', endDate: '2026.04.30',
        heroBg: 'linear-gradient(135deg,#f9d4e8,#f3a1c7)',
        heroTextColor: '#831843',
        heroEyebrow: '2026 S/S PREVIEW',
        heroSub: '2026 봄여름 시즌 컬렉션을 미리 만나보세요.',
        tabs: ['전체', '여성', '남성'],
        productSets: [
          [1,2,3,4,5,6,7,8],
          [1,3,5,7,9,11,2,4],
          [2,4,6,8,10,12,1,3],
        ],
        benefits: [
          { label: '선공개 기간 구매 시', value: '10% 얼리버드 할인', btn: '구매하기' },
        ],
        notice: ['선공개 기간 한정 혜택입니다.', '정식 출시 후 가격이 변경될 수 있습니다.'],
      },
    ];

    const eventId  = computed(() => Number(props.editId) || 1);
    const event    = computed(() => events.find(e => e.id === eventId.value) || events[0]);
    const activeTab = ref(0);

    /* 탭 변경 시 0으로 리셋 */
    const setTab = (i) => { activeTab.value = i; };

    /* 현재 탭 상품 ID 목록 → 이미지/이름 생성 */
    const tabProducts = computed(() => {
      const set = event.value.productSets[activeTab.value] || [];
      return set.map(id => ({
        id,
        name: `ShopJoy 2026 S/S No.${id}`,
        price: (Math.floor(Math.random() * 12) + 3) * 10000,
        origPrice: null,
        discount: [0,0,10,15,20,30,0,0,10,25,0,15][id % 12],
        img: id <= 12
          ? `assets/cdn/prod/img/shop/product/fashion/fashion-${id}.webp`
          : `assets/cdn/prod/img/shop/product/product_${((id-1)%23)+1}.png`,
      })).map(p => ({
        ...p,
        origPrice: p.discount ? Math.round(p.price / (1 - p.discount/100) / 1000) * 1000 : null,
        priceStr: p.price.toLocaleString() + '원',
        origStr: p.origPrice ? Math.round(p.price / (1 - p.discount/100) / 1000 * 1000).toLocaleString() + '원' : null,
      }));
    });

    /* 더 많은 프로모션 (현재 이벤트 제외) */
    const promoEvents = computed(() => events.filter(e => e.id !== eventId.value));

    return { event, activeTab, setTab, tabProducts, promoEvents };
  },

  template: /* html */ `
<div style="background:var(--bg-base);">

  <!-- ① 히어로 배너 -->
  <div :style="{
    background: event.heroBg,
    minHeight: '400px',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    textAlign:'center', padding:'clamp(40px,8vw,72px) clamp(16px,4vw,24px) clamp(32px,6vw,60px)',
    position:'relative', overflow:'hidden',
  }">
    <!-- 장식 원 -->
    <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
    <div style="position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.12);"></div>

    <div style="position:relative;z-index:1;max-width:700px;">
      <div style="display:inline-block;padding:4px 16px;border-radius:20px;border:1px solid currentColor;font-size:0.72rem;font-weight:700;letter-spacing:2px;margin-bottom:20px;opacity:0.8;"
        :style="{ color: event.heroTextColor }">
        {{ event.heroEyebrow }}
      </div>
      <h1 style="font-size:2.6rem;font-weight:900;line-height:1.25;margin-bottom:18px;letter-spacing:-0.5px;"
        :style="{ color: event.heroTextColor }">
        {{ event.title }}
      </h1>
      <p style="font-size:0.95rem;line-height:1.7;opacity:0.8;margin-bottom:24px;"
        :style="{ color: event.heroTextColor }">
        {{ event.heroSub }}
      </p>
      <div style="font-size:0.82rem;font-weight:600;opacity:0.65;"
        :style="{ color: event.heroTextColor }">
        {{ event.startDate }} ~ {{ event.endDate }}
      </div>
    </div>
  </div>

  <div class="page-wrap" style="max-width:960px;">

    <!-- ② 뒤로 -->
    <button @click="navigate('event')"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.82rem;margin-bottom:32px;padding:0;"
      @mouseenter="$event.currentTarget.style.color='var(--blue)'"
      @mouseleave="$event.currentTarget.style.color='var(--text-muted)'">
      ← 이벤트 목록으로
    </button>

    <!-- ③ 혜택 카드 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:clamp(20px,4vw,36px) clamp(16px,3vw,32px);margin-bottom:36px;text-align:center;">
      <div style="font-size:0.72rem;font-weight:700;color:var(--blue);letter-spacing:2px;margin-bottom:10px;">SHOPJOY BENEFIT</div>
      <h2 style="font-size:1.4rem;font-weight:900;color:var(--text-primary);margin-bottom:6px;">이벤트 혜택</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:28px;">{{ event.heroSub }}</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        <div v-for="(b, bi) in event.benefits" :key="bi"
          style="border:1px solid var(--border);border-radius:12px;padding:24px 16px;">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px;">{{ b.label }}</div>
          <div style="font-size:1.45rem;font-weight:900;color:var(--text-primary);margin-bottom:16px;">{{ b.value }}</div>
          <button class="btn-blue" style="padding:9px 28px;font-size:0.82rem;border-radius:6px;border:none;cursor:pointer;">{{ b.btn }}</button>
        </div>
      </div>
    </div>

    <!-- ④ 이벤트 상품 -->
    <div style="margin-bottom:36px;">
      <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:18px;">이벤트 상품</h2>

      <!-- 탭 -->
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:24px;">
        <button v-for="(tab, ti) in event.tabs" :key="ti"
          @click="setTab(ti)"
          :style="{
            padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:'0.85rem',
            fontWeight: activeTab===ti ? '700' : '500',
            color: activeTab===ti ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab===ti ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
          }">{{ tab }}</button>
      </div>

      <!-- 상품 그리드 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px;">
        <div v-for="p in tabProducts" :key="p.id"
          style="cursor:pointer;background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;transition:transform .15s,box-shadow .15s;"
          @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.09)'"
          @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">
          <div style="aspect-ratio:3/4;overflow:hidden;background:#f8f8f8;">
            <img :src="p.img" :alt="p.name"
              style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
              @mouseenter="$event.target.style.transform='scale(1.04)'"
              @mouseleave="$event.target.style.transform=''"
              @error="$event.target.style.display='none'" />
          </div>
          <div style="padding:12px 12px 14px;">
            <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.4;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.name }}</div>
            <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
              <span v-if="p.discount" style="font-size:0.78rem;font-weight:700;color:#ef4444;">{{ p.discount }}%</span>
              <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ p.priceStr }}</span>
            </div>
            <div v-if="p.origStr" style="font-size:0.72rem;color:var(--text-muted);text-decoration:line-through;margin-top:2px;">{{ p.origStr }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ⑤ 더 많은 프로모션 -->
    <div style="margin-bottom:36px;">
      <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:18px;">더 많은 프로모션 보기</h2>
      <div style="display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;">
        <div v-for="ev in promoEvents" :key="ev.id"
          @click="navigate('eventView', { eventId: ev.id })"
          style="flex:0 0 260px;border-radius:10px;overflow:hidden;cursor:pointer;border:1px solid var(--border);transition:transform .15s,box-shadow .15s;"
          @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)'"
          @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">
          <div :style="{
            height:'120px', background: ev.heroBg,
            display:'flex', flexDirection:'column',
            justifyContent:'flex-end', padding:'14px',
          }">
            <div style="font-size:0.65rem;font-weight:700;letter-spacing:1px;margin-bottom:3px;opacity:0.75;"
              :style="{ color: ev.heroTextColor }">{{ ev.heroEyebrow }}</div>
            <div style="font-size:0.88rem;font-weight:800;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"
              :style="{ color: ev.heroTextColor }">{{ ev.title }}</div>
          </div>
          <div style="padding:10px 14px 12px;background:var(--bg-card);">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span :style="{ padding:'2px 8px', borderRadius:'4px', fontSize:'0.68rem', fontWeight:'700', color:'#fff', background: ev.tagColor }">{{ ev.tag }}</span>
              <span style="font-size:0.72rem;color:var(--text-muted);">~ {{ ev.endDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ⑥ 유의사항 -->
    <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:12px;padding:clamp(16px,3vw,24px) clamp(16px,3vw,28px);margin-bottom:32px;">
      <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">유의사항</h3>
      <ul style="list-style:none;padding:0;margin:0;">
        <li v-for="(line, li) in event.notice" :key="li"
          style="font-size:0.8rem;color:var(--text-muted);line-height:1.9;padding-left:14px;position:relative;">
          <span style="position:absolute;left:0;">·</span>{{ line }}
        </li>
      </ul>
    </div>

    <!-- 목록으로 (하단) -->
    <div style="text-align:center;padding-bottom:8px;">
      <button @click="navigate('event')"
        style="padding:11px 32px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);font-size:0.85rem;cursor:pointer;font-weight:600;"
        @mouseenter="$event.currentTarget.style.borderColor='var(--blue)';$event.currentTarget.style.color='var(--blue)'"
        @mouseleave="$event.currentTarget.style.borderColor='var(--border)';$event.currentTarget.style.color='var(--text-secondary)'">
        ← 이벤트 목록으로
      </button>
    </div>

  </div>
</div>
  `,
};

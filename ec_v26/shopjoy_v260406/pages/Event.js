/* ShopJoy - Event (이벤트 목록) */
window.Event = {
  name: 'Event',
  props: ['navigate', 'config'],
  setup(props) {
    const { ref, computed } = Vue;

    const activeTab = ref('ongoing'); // ongoing | ended
    const sortBy    = ref('latest');  // latest | deadline

    const events = ref([
      {
        id: 1, title: '봄 베스트 상품 달력이벤트 70% 혜택',
        status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.30',
        tag: '할인', tagColor: '#e8587a',
        bannerBg: '#111', bannerText: '#fff',
        bannerLine1: '26° Spring', bannerLine2: 'SALE', bannerStyle: 'sale',
      },
      {
        id: 2, title: '4월 신한카드 특시할인',
        status: 'ongoing', startDate: '2026.04.08', endDate: '2026.04.30',
        tag: '카드혜택', tagColor: '#3b82f6',
        bannerBg: '#FDE047', bannerText: '#1a1a1a',
        bannerLine1: '신한카드', bannerLine2: '즉시할인 10%', bannerStyle: 'card',
      },
      {
        id: 3, title: '4월 더플러스 : 봄 쇼핑 3만원 추가 혜택',
        status: 'ongoing', startDate: '2026.04.06', endDate: '2026.04.12',
        tag: '적립', tagColor: '#8b5cf6',
        bannerBg: '#0f172a', bannerText: '#38bdf8',
        bannerLine1: 'PLUS+', bannerLine2: '봄 쇼핑 혜택', bannerStyle: 'plus',
      },
      {
        id: 4, title: '더플러스 서울점 : Sunlit Breeze',
        status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.20',
        tag: '매장', tagColor: '#10b981',
        bannerBg: '#f0fdf4', bannerText: '#064e3b',
        bannerLine1: 'Sunlit', bannerLine2: 'Breeze', bannerStyle: 'nature',
      },
      {
        id: 5, title: '신상품 출시 기념 구매 혜택',
        status: 'ongoing', startDate: '2026.04.10', endDate: '2026.04.25',
        tag: '신상품', tagColor: '#f59e0b',
        bannerBg: '#1e1b4b', bannerText: '#fff',
        bannerLine1: 'NEW', bannerLine2: 'ARRIVALS', bannerStyle: 'new',
      },
      {
        id: 6, title: '2026 S/S 컬렉션 선공개',
        status: 'ongoing', startDate: '2026.04.15', endDate: '2026.04.30',
        tag: '패션', tagColor: '#ec4899',
        bannerBg: '#fdf2f8', bannerText: '#831843',
        bannerLine1: '2026 S/S', bannerLine2: 'COLLECTION', bannerStyle: 'collection',
      },
      {
        id: 7, title: '더핸드썸 THE 클럽 멤버십 혜택',
        status: 'ended', startDate: '2026.03.01', endDate: '2026.03.31',
        tag: '멤버십', tagColor: '#6b7280',
        bannerBg: '#1f2937', bannerText: '#d1d5db',
        bannerLine1: 'THE CLUB', bannerLine2: 'MEMBERSHIP', bannerStyle: 'club',
      },
      {
        id: 8, title: '겨울 시즌오프 최대 80% SALE',
        status: 'ended', startDate: '2026.02.10', endDate: '2026.03.10',
        tag: '세일', tagColor: '#6b7280',
        bannerBg: '#374151', bannerText: '#f9fafb',
        bannerLine1: 'SEASON OFF', bannerLine2: 'UP TO 80%', bannerStyle: 'off',
      },
    ]);

    const filteredEvents = computed(() => {
      let list = events.value.filter(e =>
        activeTab.value === 'ongoing' ? e.status === 'ongoing' : e.status === 'ended'
      );
      if (sortBy.value === 'deadline') {
        list = [...list].sort((a, b) => a.endDate.localeCompare(b.endDate));
      }
      return list;
    });

    const ongoingCount = computed(() => events.value.filter(e => e.status === 'ongoing').length);
    const endedCount   = computed(() => events.value.filter(e => e.status === 'ended').length);

    return { activeTab, sortBy, filteredEvents, ongoingCount, endedCount };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="이벤트"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Promotion</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">이벤트</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">이벤트</span>
      </div>
    </div>
  </div>

  <!-- 탭 + 정렬 -->
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--border);margin-bottom:28px;">
    <!-- 탭 -->
    <div style="display:flex;gap:0;">
      <button @click="activeTab='ongoing'"
        :style="{
          padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.88rem', fontWeight: activeTab==='ongoing' ? '700' : '500',
          color: activeTab==='ongoing' ? 'var(--text-primary)' : 'var(--text-muted)',
          borderBottom: activeTab==='ongoing' ? '2px solid var(--text-primary)' : '2px solid transparent',
          marginBottom: '-1px',
        }">진행중 ({{ ongoingCount }})</button>
      <button @click="activeTab='ended'"
        :style="{
          padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.88rem', fontWeight: activeTab==='ended' ? '700' : '500',
          color: activeTab==='ended' ? 'var(--text-primary)' : 'var(--text-muted)',
          borderBottom: activeTab==='ended' ? '2px solid var(--text-primary)' : '2px solid transparent',
          marginBottom: '-1px',
        }">당첨자 발표</button>
    </div>
    <!-- 정렬 -->
    <div style="display:flex;gap:0;padding-bottom:2px;">
      <button @click="sortBy='latest'"
        :style="{
          padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.8rem',
          color: sortBy==='latest' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: sortBy==='latest' ? '700' : '400',
          borderRight:'1px solid var(--border)',
        }">최근등록순</button>
      <button @click="sortBy='deadline'"
        :style="{
          padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.8rem',
          color: sortBy==='deadline' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: sortBy==='deadline' ? '700' : '400',
        }">마감임박순</button>
    </div>
  </div>

  <!-- 이벤트 그리드 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">
    <div v-for="ev in filteredEvents" :key="ev.id"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;"
      @click="navigate('eventView', { eventId: ev.id })"
      @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
      @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">

      <!-- 이벤트 배너 썸네일 -->
      <div :style="{ height:'170px', background: ev.bannerBg, position:'relative', overflow:'hidden',
                     display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-end', padding:'16px' }">
        <!-- 배너 텍스트 -->
        <div :style="{ color: ev.bannerText, position:'relative', zIndex:1 }">
          <div style="font-size:0.72rem;opacity:0.7;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">
            {{ ev.startDate }} ~ {{ ev.endDate }}
          </div>
          <div :style="{ fontSize:'1.05rem', fontWeight:'900', lineHeight:'1.25', letterSpacing:'-0.5px' }">
            {{ ev.bannerLine1 }}
          </div>
          <div :style="{ fontSize:'1.45rem', fontWeight:'900', lineHeight:'1.2', letterSpacing:'-0.5px' }">
            {{ ev.bannerLine2 }}
          </div>
        </div>
        <!-- 종료 오버레이 -->
        <div v-if="ev.status==='ended'"
          style="position:absolute;inset:0;background:rgba(0,0,0,0.52);display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:0.85rem;font-weight:700;letter-spacing:3px;border:1px solid rgba(255,255,255,0.6);padding:5px 14px;">CLOSED</span>
        </div>
      </div>

      <!-- 카드 정보 -->
      <div style="padding:14px 14px 16px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
          <span :style="{ padding:'2px 7px', borderRadius:'2px', fontSize:'0.68rem', fontWeight:'700', color:'#fff', background: ev.tagColor }">{{ ev.tag }}</span>
        </div>
        <div style="font-size:0.87rem;font-weight:600;color:var(--text-primary);line-height:1.45;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          {{ ev.title }}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">{{ ev.startDate }} ~ {{ ev.endDate }}</div>
      </div>
    </div>
  </div>

  <!-- 빈 상태 -->
  <div v-if="filteredEvents.length === 0" style="text-align:center;padding:clamp(32px,6vw,60px) 0;color:var(--text-muted);">
    <div style="font-size:2rem;margin-bottom:12px;">📭</div>
    <div style="font-size:0.95rem;">{{ activeTab === 'ongoing' ? '진행 중인 이벤트가 없습니다.' : '종료된 이벤트가 없습니다.' }}</div>
  </div>

</div>
  `
};

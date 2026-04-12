/* ShopJoy - Event (이벤트 목록) */
window.Event = {
  name: 'Event',
  props: ['navigate', 'config'],
  setup(props) {
    const { ref, computed } = Vue;

    const activeTab = ref('ongoing'); // ongoing | ended

    const events = ref([
      { id: 1, title: '봄 베스트 상품 달력이벤트 70% 혜택', thumb: '', status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.30', tag: '할인', tagColor: '#e8587a', desc: '봄 시즌 베스트 상품을 최대 70% 할인된 가격으로 만나보세요.' },
      { id: 2, title: '4월 신한카드 특시할인', thumb: '', status: 'ongoing', startDate: '2026.04.08', endDate: '2026.04.30', tag: '카드혜택', tagColor: '#3b82f6', desc: '신한카드로 결제 시 즉시 10% 할인 혜택을 드립니다.' },
      { id: 3, title: '4월 더플러스 : 봄 쇼핑 3만원 추가 혜택', thumb: '', status: 'ongoing', startDate: '2026.04.06', endDate: '2026.04.12', tag: '적립', tagColor: '#8b5cf6', desc: '장바구니 한번 더 추가 혜택을 드려요.' },
      { id: 4, title: '더플러스 서울점 : Sunlit Breeze', thumb: '', status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.20', tag: '매장', tagColor: '#10b981', desc: '서울점에서 만나는 특별 이벤트.' },
      { id: 5, title: '신상품 출시 기념 구매 혜택', thumb: '', status: 'ongoing', startDate: '2026.04.10', endDate: '2026.04.25', tag: '신상품', tagColor: '#f59e0b', desc: '신상품 구매 시 추가 할인 및 사은품 증정.' },
      { id: 6, title: '2026 S/S 컬렉션 선공개', thumb: '', status: 'ongoing', startDate: '2026.04.15', endDate: '2026.04.30', tag: '패션', tagColor: '#ec4899', desc: '2026 봄여름 시즌 컬렉션을 미리 만나보세요.' },
      { id: 7, title: '더핸드썸 THE 클럽 멤버십 혜택', thumb: '', status: 'ended', startDate: '2026.03.01', endDate: '2026.03.31', tag: '멤버십', tagColor: '#6b7280', desc: 'THE 클럽 가입 시 특별 혜택을 제공합니다.' },
      { id: 8, title: '겨울 시즌오프 최대 80% SALE', thumb: '', status: 'ended', startDate: '2026.02.10', endDate: '2026.03.10', tag: '세일', tagColor: '#6b7280', desc: '겨울 시즌 마감 특별 할인.' },
    ]);

    const filteredEvents = computed(() =>
      events.value.filter(e => activeTab.value === 'ongoing' ? e.status === 'ongoing' : e.status === 'ended')
    );

    const ongoingCount = computed(() => events.value.filter(e => e.status === 'ongoing').length);
    const endedCount   = computed(() => events.value.filter(e => e.status === 'ended').length);

    /* 목업 배경 그라데이션 */
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    ];
    const eventBg = (id) => gradients[(id - 1) % gradients.length];

    return { activeTab, filteredEvents, ongoingCount, endedCount, eventBg };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- 헤더 -->
  <div style="margin-bottom:32px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">EVENT</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">이벤트</h1>
    <p class="section-subtitle">다양한 혜택과 이벤트를 확인해보세요.</p>
  </div>

  <!-- 탭 -->
  <div style="display:flex;gap:0;margin-bottom:28px;border-bottom:2px solid var(--border);">
    <button @click="activeTab='ongoing'"
      :style="{
        padding:'12px 28px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.9rem', fontWeight: activeTab==='ongoing' ? '700' : '500',
        color: activeTab==='ongoing' ? 'var(--blue)' : 'var(--text-muted)',
        borderBottom: activeTab==='ongoing' ? '2px solid var(--blue)' : '2px solid transparent',
        marginBottom: '-2px',
      }">진행중 ({{ ongoingCount }})</button>
    <button @click="activeTab='ended'"
      :style="{
        padding:'12px 28px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.9rem', fontWeight: activeTab==='ended' ? '700' : '500',
        color: activeTab==='ended' ? 'var(--blue)' : 'var(--text-muted)',
        borderBottom: activeTab==='ended' ? '2px solid var(--blue)' : '2px solid transparent',
        marginBottom: '-2px',
      }">종료됨 ({{ endedCount }})</button>
  </div>

  <!-- 이벤트 그리드 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:20px;">
    <div v-for="ev in filteredEvents" :key="ev.id"
      class="card" style="overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;"
      @click="navigate('eventView', { eventId: ev.id })"
      @mouseenter="$event.currentTarget.style.transform='translateY(-4px)';$event.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'"
      @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">

      <!-- 썸네일 -->
      <div :style="{
        height:'180px', background: eventBg(ev.id),
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'2.5rem', color:'rgba(255,255,255,0.9)', fontWeight:'900',
        letterSpacing:'-1px', textShadow:'0 2px 8px rgba(0,0,0,0.15)',
        position:'relative',
      }">
        <span style="opacity:0.85;">{{ ev.title.slice(0, 6) }}</span>
        <span v-if="ev.status==='ended'"
          style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;font-weight:700;letter-spacing:2px;">종료</span>
      </div>

      <!-- 정보 -->
      <div style="padding:16px 18px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span :style="{ padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'700', color:'#fff', background: ev.tagColor }">{{ ev.tag }}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">{{ ev.startDate }} ~ {{ ev.endDate }}</span>
        </div>
        <div style="font-size:0.92rem;font-weight:700;color:var(--text-primary);line-height:1.4;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ ev.title }}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">{{ ev.desc }}</div>
      </div>
    </div>
  </div>

  <!-- 빈 상태 -->
  <div v-if="filteredEvents.length === 0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    <div style="font-size:2rem;margin-bottom:12px;">📭</div>
    <div style="font-size:0.95rem;">{{ activeTab === 'ongoing' ? '진행 중인 이벤트가 없습니다.' : '종료된 이벤트가 없습니다.' }}</div>
  </div>

</div>
  `
};

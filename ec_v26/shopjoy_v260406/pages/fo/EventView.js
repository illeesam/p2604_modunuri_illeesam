/* ShopJoy - EventView (이벤트 상세) */
window.EventView = {
  name: 'EventView',
  props: ['navigate', 'config', 'editId'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: 0});
    const codes = reactive({});

    const isAppReady = computed(() => {
      const initStore = window.useFoAppInitStore?.();
      const codeStore = window.useFoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    /* ── 이벤트 데이터 ── */
    const events = reactive([]);

    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const res = await foApiSvc.pmEvent.getById(props.editId, '이벤트상세', '상세조회');
        events.splice(0, events.length, ...(res.data?.data ? [res.data.data] : []));
      } catch (e) {
        console.error('[handleSearchData]', e);
        events.splice(0, events.length);
      }
    };

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
        handleSearchData();
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    const cfEventId  = computed(() => Number(props.editId) || 1);
    const cfEvent    = computed(() => events.find(e => e.id === cfEventId.value) || events[0] || null);
    
    /* 탭 변경 시 0으로 리셋 */
    const setTab = (i) => { uiState.activeTab = i; };

    /* 현재 탭 상품 ID 목록 → 이미지/이름 생성 */
    const cfTabProducts = computed(() => {
      const set = cfEvent.value.productSets[uiState.activeTab] || [];
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
    const cfPromoEvents = computed(() => events.filter(e => e.id !== cfEventId.value));

    // ── return ───────────────────────────────────────────────────────────────

    return { cfEvent, setTab, cfTabProducts, cfPromoEvents, uiState, codes };
  },

  template: /* html */ `
<div v-if="cfEvent" style="background:var(--bg-base);">

  <!-- ── ① 히어로 배너 ─────────────────────────────────────────────────────── -->
  <div :style="{
    background: cfEvent.heroBg,
    minHeight: '400px',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    textAlign:'center', padding:'clamp(40px,8vw,72px) clamp(16px,4vw,24px) clamp(32px,6vw,60px)',
    position:'relative', overflow:'hidden',
  }">
    <!-- ── 장식 원 ───────────────────────────────────────────────────────── -->
    <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
    <div style="position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.12);"></div>

    <div style="position:relative;z-index:1;max-width:700px;">
      <div style="display:inline-block;padding:4px 16px;border-radius:20px;border:1px solid currentColor;font-size:0.72rem;font-weight:700;letter-spacing:2px;margin-bottom:20px;opacity:0.8;"
        :style="{ color: cfEvent.heroTextColor }">
        {{ cfEvent.heroEyebrow }}
      </div>
      <h1 style="font-size:2.6rem;font-weight:900;line-height:1.25;margin-bottom:18px;letter-spacing:-0.5px;"
        :style="{ color: cfEvent.heroTextColor }">
        {{ cfEvent.title }}
      </h1>
      <p style="font-size:0.95rem;line-height:1.7;opacity:0.8;margin-bottom:24px;"
        :style="{ color: cfEvent.heroTextColor }">
        {{ cfEvent.heroSub }}
      </p>
      <div style="font-size:0.82rem;font-weight:600;opacity:0.65;"
        :style="{ color: cfEvent.heroTextColor }">
        {{ cfEvent.startDate }} ~ {{ cfEvent.endDate }}
      </div>
    </div>
  </div>

  <div class="page-wrap" style="max-width:960px;">

    <!-- ── ② 뒤로 ───────────────────────────────────────────────────────── -->
    <button @click="navigate('event')"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.82rem;margin-bottom:32px;padding:0;"
      @mouseenter="$event.currentTarget.style.color='var(--blue)'"
      @mouseleave="$event.currentTarget.style.color='var(--text-muted)'">
      ← 이벤트 목록으로
    </button>

    <!-- ── ③ 혜택 카드 ────────────────────────────────────────────────────── -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:clamp(20px,4vw,36px) clamp(16px,3vw,32px);margin-bottom:36px;text-align:center;">
      <div style="font-size:0.72rem;font-weight:700;color:var(--blue);letter-spacing:2px;margin-bottom:10px;">SHOPJOY BENEFIT</div>
      <h2 style="font-size:1.4rem;font-weight:900;color:var(--text-primary);margin-bottom:6px;">이벤트 혜택</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:28px;">{{ cfEvent.heroSub }}</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        <div v-for="(b, bi) in cfEvent.benefits" :key="bi"
          style="border:1px solid var(--border);border-radius:12px;padding:24px 16px;">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px;">{{ b.label }}</div>
          <div style="font-size:1.45rem;font-weight:900;color:var(--text-primary);margin-bottom:16px;">{{ b.value }}</div>
          <button class="btn-blue" style="padding:9px 28px;font-size:0.82rem;border-radius:6px;border:none;cursor:pointer;">{{ b.btn }}</button>
        </div>
      </div>
    </div>

    <!-- ── ④ 이벤트 상품 ───────────────────────────────────────────────────── -->
    <div style="margin-bottom:36px;">
      <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:18px;">이벤트 상품</h2>

      <!-- ── 탭 ────────────────────────────────────────────────────────── -->
      <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:24px;">
        <button v-for="(tab, ti) in cfEvent.tabs" :key="ti"
          @click="setTab(ti)"
          :style="{
            padding:'10px 20px', background:'none', border:'none', cursor:'pointer',
            fontSize:'0.85rem',
            fontWeight: uiState.activeTab===ti ? '700' : '500',
            color: uiState.activeTab===ti ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: uiState.activeTab===ti ? '2px solid var(--text-primary)' : '2px solid transparent',
            marginBottom: '-1px',
          }">{{ tab }}</button>
      </div>

      <!-- ── 상품 그리드 ───────────────────────────────────────────────────── -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px;">
        <div v-for="p in cfTabProducts" :key="p.id"
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

    <!-- ── ⑤ 더 많은 프로모션 ────────────────────────────────────────────────── -->
    <div style="margin-bottom:36px;">
      <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:18px;">더 많은 프로모션 보기</h2>
      <div style="display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;">
        <div v-for="ev in cfPromoEvents" :key="ev.id"
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

    <!-- ── ⑥ 유의사항 ─────────────────────────────────────────────────────── -->
    <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:12px;padding:clamp(16px,3vw,24px) clamp(16px,3vw,28px);margin-bottom:32px;">
      <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">유의사항</h3>
      <ul style="list-style:none;padding:0;margin:0;">
        <li v-for="(line, li) in cfEvent.notice" :key="li"
          style="font-size:0.8rem;color:var(--text-muted);line-height:1.9;padding-left:14px;position:relative;">
          <span style="position:absolute;left:0;">·</span>{{ line }}
        </li>
      </ul>
    </div>

    <!-- ── 목록으로 (하단) ──────────────────────────────────────────────────── -->
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

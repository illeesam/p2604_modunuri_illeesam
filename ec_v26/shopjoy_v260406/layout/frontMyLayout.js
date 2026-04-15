/* ShopJoy - My Page 공통 레이아웃 (헤더 + 탭바) */

/* ── 날짜 필터 공통 헬퍼 ── */
window.myDateFilterHelper = () => {
  const { ref, computed, reactive } = Vue;
  const today = new Date();
  const fmt = d => d.toISOString().slice(0, 10);
  const calcStart = months => { const d = new Date(today); d.setMonth(d.getMonth() - months); return fmt(d); };
  const dateRange = reactive({ start: calcStart(6), end: fmt(today) });
  const inRange = dateStr => {
    const d = String(dateStr || '').slice(0, 10).replace(/\./g, '-').replace(/ .*/g, '');
    return (!dateRange.start || d >= dateRange.start) && (!dateRange.end || d <= dateRange.end);
  };
  const onDateSearch = ({ startDate, endDate }) => { dateRange.start = startDate; dateRange.end = endDate; };
  return { dateRange, inRange, onDateSearch };
};

/* ── 날짜 범위 필터 UI 컴포넌트 ── */
window.MyDateFilter = {
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const { ref } = Vue;
    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10);
    const calcStart = months => { const d = new Date(today); d.setMonth(d.getMonth() - months); return fmt(d); };
    const PERIODS = [
      { label: '1달', value: 1 }, { label: '2달', value: 2 }, { label: '3달', value: 3 },
      { label: '6달', value: 6 }, { label: '1년', value: 12 }, { label: '1년6개월', value: 18 },
      { label: '2년', value: 24 }, { label: '3년', value: 36 },
    ];
    const period   = ref(6);
    const startDate = ref(calcStart(6));
    const endDate   = ref(fmt(today));
    const onPeriodChange = () => { startDate.value = calcStart(period.value); endDate.value = fmt(today); };
    const search = () => emit('search', { startDate: startDate.value, endDate: endDate.value });
    const onReset = () => {
      period.value = 6;
      startDate.value = calcStart(6);
      endDate.value = fmt(today);
      emit('search', { startDate: startDate.value, endDate: endDate.value });
      emit('reset');
    };
    return { period, startDate, endDate, PERIODS, onPeriodChange, search, onReset };
  },
  template: `
<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;">
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <span style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);white-space:nowrap;">등록기간</span>
    <input type="date" v-model="startDate"
      style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;" />
    <span style="font-size:0.82rem;color:var(--text-muted);">~</span>
    <input type="date" v-model="endDate"
      style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;" />
    <select v-model="period" @change="onPeriodChange"
      style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
      <option v-for="p in PERIODS" :key="p.value" :value="p.value">{{ p.label }}</option>
    </select>
    <button @click="search"
      style="padding:6px 18px;border-radius:6px;border:none;background:var(--blue);color:#fff;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">검색</button>
    <button @click="onReset"
      style="padding:6px 14px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-base);color:var(--text-secondary);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;">초기화</button>
  </div>
</div>`
};

/* ── 공통 페이저 컴포넌트 (My 탭 전체에서 공유) ── */
window.PagerHeader = {
  props: ['total', 'pager'],
  template: `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
  <div style="font-size:0.85rem;color:var(--text-secondary);">총 <strong style="color:var(--text-primary);">{{ total }}</strong>건</div>
  <select v-model="pager.size" @change="pager.page=1"
    style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
    <option :value="5">5개씩</option>
    <option :value="10">10개씩</option>
    <option :value="20">20개씩</option>
    <option :value="30">30개씩</option>
    <option :value="50">50개씩</option>
    <option :value="100">100개씩</option>
  </select>
</div>`
};

window.Pagination = {
  props: ['total', 'pager'],
  setup(props) {
    const pages = Vue.computed(() => {
      const t = Math.max(1, Math.ceil(props.total / props.pager.size));
      return Array.from({ length: t }, (_, i) => i + 1);
    });
    return { pages };
  },
  template: `
<div v-if="pages.length>1" style="display:flex;gap:6px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
  <button @click="pager.page=Math.max(1,pager.page-1)" :disabled="pager.page===1"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===1?'opacity:0.4;cursor:not-allowed;':''">‹</button>
  <button v-for="p in pages" :key="p" @click="pager.page=p"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.82rem;min-width:36px;"
    :style="pager.page===p?'background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700;':'background:var(--bg-card);color:var(--text-secondary);'">{{ p }}</button>
  <button @click="pager.page=Math.min(pages.length,pager.page+1)" :disabled="pager.page===pages.length"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===pages.length?'opacity:0.4;cursor:not-allowed;':''">›</button>
</div>`
};

window.frontMyLayout = {
  name: 'FrontMyLayout',
  props: ['navigate', 'cartCount', 'activePage'],
  setup(props) {
    const { computed } = Vue;
    const myStore = window.useFrontMyStore();

    const MY_TABS = [
      { pageId: 'myOrder',   label: '주문',          icon: '📦' },
      { pageId: 'myClaim',   label: '취소/반품/교환', icon: '↩️' },
      { pageId: 'myCoupon',  label: '쿠폰',           icon: '🎟️' },
      { pageId: 'myCache',   label: '캐쉬',           icon: '💰' },
      { pageId: 'myContact', label: '문의',           icon: '📩' },
      { pageId: 'myChatt',   label: '채팅',           icon: '💬' },
    ];

    const tabCounts = computed(() => myStore.getTabCounts(props.cartCount));

    const goTab = (pageId) => {
      if (pageId === 'myCart') {
        props.navigate('cart');
      } else {
        props.navigate(pageId);
      }
    };

    return { MY_TABS, tabCounts, goTab };
  },
  template: /* html */ `
<div style="padding:0 20px 24px;max-width:1100px;margin:0 auto;">

  <!-- 페이지 타이틀 배너 -->
  <div style="position:relative;overflow:hidden;height:220px;margin-bottom:28px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="마이페이지"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">My Account</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">마이페이지</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span>
        <span style="color:#333;">마이페이지</span>
      </div>
    </div>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:0;margin-bottom:24px;overflow-x:auto;scrollbar-width:none;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:8px;box-shadow:0 2px 12px rgba(0,0,0,0.05);align-items:stretch;">
    <template v-for="(t, ti) in MY_TABS" :key="t.pageId">
      <button @click="goTab(t.pageId)"
        style="padding:11px 18px;border:none;cursor:pointer;font-size:0.92rem;white-space:nowrap;border-radius:10px;transition:all 0.18s;display:flex;align-items:center;gap:7px;flex:1;justify-content:center;min-width:fit-content;"
        :style="activePage===t.pageId
          ? 'background:linear-gradient(135deg,#1a1a1a,#404040);color:#fff;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.18);transform:translateY(-1px);'
          : 'background:transparent;color:var(--text-secondary);font-weight:600;'"
        @mouseenter="activePage===t.pageId || ($event.currentTarget.style.background='var(--bg-base)')"
        @mouseleave="activePage===t.pageId || ($event.currentTarget.style.background='transparent')">
        <span style="font-size:1.05rem;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="tabCounts[t.pageId] > 0"
          style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:0.72rem;font-weight:800;"
          :style="activePage===t.pageId ? 'background:rgba(255,255,255,0.25);color:#fff;' : 'background:#fee2e2;color:#dc2626;'">
          {{ tabCounts[t.pageId] }}
        </span>
      </button>
      <div v-if="ti < MY_TABS.length-1"
        style="width:1px;background:var(--border);margin:8px 0;flex-shrink:0;"></div>
    </template>
  </div>

  <!-- 탭 컨텐츠 (슬롯) -->
  <slot />

</div>
  `,
};

/* ShopJoy - My Page 공통 레이아웃 (헤더 + 탭바) */

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

window.MyLayout = {
  name: 'MyLayout',
  props: ['navigate', 'cartCount', 'activePage'],
  setup(props) {
    const { computed } = Vue;
    const myStore = window.useMyStore();

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
<div style="padding:24px 20px;max-width:960px;margin:0 auto;">

  <!-- 헤더 -->
  <div style="margin-bottom:24px;">
    <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">My Account</div>
    <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);margin-top:4px;">마이페이지</h1>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:4px;">주문, 쿠폰, 캐쉬, 문의를 한곳에서 관리하세요</p>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:4px;margin-bottom:24px;overflow-x:auto;scrollbar-width:none;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;">
    <button v-for="t in MY_TABS" :key="t.pageId" @click="goTab(t.pageId)"
      style="padding:8px 14px;border:none;cursor:pointer;font-size:0.85rem;font-weight:600;white-space:nowrap;border-radius:8px;transition:all 0.2s;display:flex;align-items:center;gap:5px;"
      :style="activePage===t.pageId
        ? 'background:var(--blue);color:#fff;box-shadow:0 2px 8px rgba(59,130,246,0.4);'
        : 'background:transparent;color:var(--text-muted);'">
      <span>{{ t.icon }}</span>
      <span>{{ t.label }}</span>
      <span v-if="tabCounts[t.pageId] > 0"
        style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;font-size:0.7rem;"
        :style="activePage===t.pageId ? 'background:rgba(255,255,255,0.3);color:#fff;' : 'background:var(--blue);color:#fff;'">
        {{ tabCounts[t.pageId] }}
      </span>
    </button>
  </div>

  <!-- 탭 컨텐츠 (슬롯) -->
  <slot />

</div>
  `,
};

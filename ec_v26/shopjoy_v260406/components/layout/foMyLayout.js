/* ShopJoy - My Page 공통 레이아웃 (헤더 + 탭바) */

/* ── 날짜 필터 공통 헬퍼 ── */
window.myDateFilterHelper = () => {
  const { ref, computed, reactive } = Vue;
  const today = new Date();

  /* fmt */
  const fmt = d => d.toISOString().slice(0, 10);

  /* calcStart */
  const calcStart = months => { const d = new Date(today); d.setMonth(d.getMonth() - months); return fmt(d); };
  const dateRange = reactive({ start: calcStart(6), end: fmt(today) });

  /* inRange */
  const inRange = dateStr => {
    const d = String(dateStr || '').slice(0, 10).replace(/\./g, '-').replace(/ .*/g, '');
    return (!dateRange.start || d >= dateRange.start) && (!dateRange.end || d <= dateRange.end);
  };

  /* onDateSearch */
  const onDateSearch = ({ startDate, endDate }) => { dateRange.start = startDate; dateRange.end = endDate; };
  return { dateRange, inRange, onDateSearch };
};

/* ── 날짜 범위 필터 UI 컴포넌트 ── */
window.MyDateFilter = {
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const { ref } = Vue;

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MyDateFilter : handleBtnAction -> ', cmd, param);
      if (cmd === 'filter-search') {
        return search();
      } else if (cmd === 'filter-reset') {
        return onReset();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MyDateFilter : handleSelectAction -> ', cmd, param);
      if (cmd === 'filter-period-change') {
        return onPeriodChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const today = new Date();

    /* fmt — 포맷 */
    const fmt = d => d.toISOString().slice(0, 10);

    /* calcStart — 계산 시작 */
    const calcStart = months => { const d = new Date(today); d.setMonth(d.getMonth() - months); return fmt(d); };
    const PERIODS = [
      { label: '1달', value: 1 }, { label: '2달', value: 2 }, { label: '3달', value: 3 },
      { label: '6달', value: 6 }, { label: '1년', value: 12 }, { label: '1년6개월', value: 18 },
      { label: '2년', value: 24 }, { label: '3년', value: 36 },
    ];
    const period   = ref(6);
    const startDate = ref(calcStart(6));
    const endDate   = ref(fmt(today));

    /* onPeriodChange — 이벤트 */
    const onPeriodChange = () => { startDate.value = calcStart(period.value); endDate.value = fmt(today); };

    /* search — 검색 */
    const search = () => emit('search', { startDate: startDate.value, endDate: endDate.value });

    /* onReset — 초기화 */
    const onReset = () => {
      period.value = 6;
      startDate.value = calcStart(6);
      endDate.value = fmt(today);
      emit('search', { startDate: startDate.value, endDate: endDate.value });
      emit('reset');
    };
    return {
      period, startDate, endDate, PERIODS,     // 상태
      handleBtnAction, handleSelectAction,     // dispatch
    };
  },
  template: `
<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <span style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);white-space:nowrap;">등록기간</span>
    <input type="date" v-model="startDate"
      style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;" />
    <span style="font-size:0.82rem;color:var(--text-muted);">~</span>
    <input type="date" v-model="endDate"
      style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;" />
    <select v-model="period" @change="handleSelectAction('filter-period-change')"
      style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-base);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
      <option v-for="p in PERIODS" :key="p.value" :value="p.value">{{ p.label }}</option>
    </select>
    <button @click="handleBtnAction('filter-search')"
      style="padding:6px 18px;border-radius:6px;border:none;background:var(--blue);color:#fff;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">조회</button>
    <button @click="handleBtnAction('filter-reset')"
      style="padding:6px 14px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg-base);color:var(--text-secondary);font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;">초기화</button>
  </div>
</div>
  <!-- ===== □. 본문 영역 =================================================== -->`
};

/* ── 공통 페이저 컴포넌트 (My 탭 전체에서 공유) ──
 *  서버사이드 페이징 표준: pageNo/pageSize/pageTotalCount/pageTotalPage 필드 사용.
 *  페이지/페이지크기 변경은 @set-page / @size-change 이벤트로 부모에 위임 → 부모가 API 재조회.
 *  (이벤트 미바인딩 시에도 pager 필드는 직접 갱신되어 하위호환 동작) */
window.PagerHeader = {
  props: ['total', 'pager'],
  emits: ['size-change'],
  setup(props, { emit }) {
    /* onSizeChange — 페이지크기 변경 → 1페이지로 리셋 후 부모에 위임(서버 재조회) */
    const onSizeChange = () => { props.pager.pageNo = 1; emit('size-change'); };
    return { onSizeChange };
  },
  template: `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="font-size:0.85rem;color:var(--text-secondary);">총 <strong style="color:var(--text-primary);">{{ pager.pageTotalCount != null ? pager.pageTotalCount : total }}</strong>건</div>
  <!-- ===== ■. 영역 ====================================================== -->
  <select v-model="pager.pageSize" @change="onSizeChange"
    style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
    <option v-for="s in (pager.pageSizes || [5,10,20,30,50,100])" :key="s" :value="s">{{ s }}개씩</option>
  </select>
</div>
  <!-- ===== □. 영역 ====================================================== -->`
};

window.Pagination = {
  props: ['total', 'pager'],
  emits: ['set-page'],
  setup(props, { emit }) {
    /* pages — 서버 pageTotalPage 기준 번호 배열 (slice 재계산 금지) */
    const pages = Vue.computed(() => {
      const t = Math.max(1, props.pager.pageTotalPage || 1);
      return Array.from({ length: t }, (_, i) => i + 1);
    });

    /* goPage — pageNo 설정 후 부모에 위임(서버 재조회). 범위/동일페이지 가드 */
    const goPage = (n) => {
      const t = pages.value.length;
      if (n < 1 || n > t || n === props.pager.pageNo) { return; }
      props.pager.pageNo = n;
      emit('set-page', n);
    };

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Pagination : handleBtnAction -> ', cmd, param);
      if (cmd === 'pager-prev') {
        return goPage(props.pager.pageNo - 1);
      } else if (cmd === 'pager-next') {
        return goPage(props.pager.pageNo + 1);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Pagination : handleSelectAction -> ', cmd, param);
      if (cmd === 'pager-set-page') {
        return goPage(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      pages,                                   // computed
      handleBtnAction, handleSelectAction,     // dispatch
    };
  },
  template: `
<div v-if="pages.length>1" style="display:flex;gap:6px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
  <!-- ===== ■. 영역 ====================================================== -->
  <button @click="handleBtnAction('pager-prev')" :disabled="pager.pageNo===1"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.pageNo===1?'opacity:0.4;cursor:not-allowed;':''">‹</button>
  <button v-for="p in pages" :key="p" @click="handleSelectAction('pager-set-page', p)"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.82rem;min-width:36px;"
    :style="pager.pageNo===p?'background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700;':'background:var(--bg-card);color:var(--text-secondary);'">{{ p }}</button>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <button @click="handleBtnAction('pager-next')" :disabled="pager.pageNo===pages.length"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.pageNo===pages.length?'opacity:0.4;cursor:not-allowed;':''">›</button>
</div>
  <!-- ===== □. 영역 ====================================================== -->`
};

window.foMyLayout = {
  name: 'FoMyLayout',
  props: ['navigate', 'cartCount', 'activePage'],
  setup(props) {
    const { computed } = Vue;
    const myStore = window.useFoMyStore();

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ foMyLayout : handleBtnAction -> ', cmd, param);
      if (cmd === 'nav-go-home') {
        return props.navigate('home');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ foMyLayout : handleSelectAction -> ', cmd, param);
      if (cmd === 'nav-go-tab') {
        return goTab(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const MY_TABS = [
      { pageId: 'myOrder',   label: '주문',          icon: '📦' },
      { pageId: 'myClaim',   label: '취소/반품/교환', icon: '↩️' },
      { pageId: 'myCoupon',  label: '쿠폰',           icon: '🎟️' },
      { pageId: 'myCache',   label: '캐쉬',           icon: '💰' },
      { pageId: 'myContact', label: '문의',           icon: '📩' },
      { pageId: 'myChatt',   label: '채팅',           icon: '💬' },
    ];

    const cfTabCounts = computed(() => myStore.getTabCounts(props.cartCount));

    /* goTab — 이동 */
    const goTab = (pageId) => {
      if (pageId === 'myCart') {
        props.navigate('cart');
      } else {
        props.navigate(pageId);
      }
    };
    return {
      MY_TABS, cfTabCounts,                    // 상태 / computed
      handleBtnAction, handleSelectAction,     // dispatch
    };
  },
  template: /* html */ `
<div style="padding:0 20px 24px;max-width:1100px;margin:0 auto;">

  <!-- ===== ■. 페이지 타이틀 배너 ============================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="position:relative;overflow:hidden;height:220px;margin-bottom:28px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="마이페이지"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">My Account</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">마이페이지</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="handleBtnAction('nav-go-home')">홈</span>
        <span>/</span>
        <span style="color:#333;">마이페이지</span>
      </div>
    </div>
  </div>

  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 탭 바 ===================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;gap:0;margin-bottom:24px;overflow-x:auto;scrollbar-width:none;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:8px;box-shadow:0 2px 12px rgba(0,0,0,0.05);align-items:stretch;">
    <template v-for="(t, ti) in MY_TABS" :key="t.pageId">
      <button @click="handleSelectAction('nav-go-tab', t.pageId)"
        style="padding:11px 18px;border:none;cursor:pointer;font-size:0.92rem;white-space:nowrap;border-radius:10px;transition:all 0.18s;display:flex;align-items:center;gap:7px;flex:1;justify-content:center;min-width:fit-content;"
        :style="activePage===t.pageId
          ? 'background:linear-gradient(135deg,#1a1a1a,#404040);color:#fff;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,0.18);transform:translateY(-1px);'
          : 'background:transparent;color:var(--text-secondary);font-weight:600;'"
        @mouseenter="activePage===t.pageId || ($event.currentTarget.style.background='var(--bg-base)')"
        @mouseleave="activePage===t.pageId || ($event.currentTarget.style.background='transparent')">
        <span style="font-size:1.05rem;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="cfTabCounts[t.pageId] > 0"
          style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:0.72rem;font-weight:800;"
          :style="activePage===t.pageId ? 'background:rgba(255,255,255,0.25);color:#fff;' : 'background:#fee2e2;color:#dc2626;'">
          {{ cfTabCounts[t.pageId] }}
        </span>
      </button>
      <div v-if="ti < MY_TABS.length-1"
        style="width:1px;background:var(--border);margin:8px 0;flex-shrink:0;"></div>
    </template>
  </div>

  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 탭 컨텐츠 (슬롯) ============================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <slot />

</div>
  
  <!-- ===== □. 영역 ====================================================== -->`,
};

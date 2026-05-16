/* ShopJoy - Event (이벤트 목록) */
window.EventPage = {
  name: 'EventPage',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: 'ongoing', sortBy: 'latest'});;
    const codes = reactive({});

    const events = reactive([]);

    
    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageType: 'PAGE', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* setPage */
    const setPage = n => { if (n>=1 && n<=pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(uiState.activeTab             ? { status: uiState.activeTab } : {}),
          ...(uiState.sortBy === 'deadline' ? { sortBy: 'endDate' }         : {}),
        };
        const res = await foApiSvc.pmEvent.getPage(params, '이벤트', '목록조회');
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || 1;
        events.splice(0, events.length, ...(res.data?.data?.pageList || []));
        fnBuildPagerNums();
      } catch (e) {
        console.error('[handleSearchList]', e);
        events.splice(0, events.length);
      }
    };

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    watch(() => uiState.activeTab, () => { pager.pageNo = 1; handleSearchList('DEFAULT'); });
    watch(() => uiState.sortBy,    () => { pager.pageNo = 1; handleSearchList('DEFAULT'); });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    const cfOngoingCount = computed(() => events.filter(e => e.status === 'ongoing').length);
    const cfEndedCount   = computed(() => events.filter(e => e.status === 'ended').length);

    onMounted(() => {
      handleSearchList();
    });

    // -- return ---------------------------------------------------------------

    return { pager, setPage, onSizeChange, events, cfOngoingCount, cfEndedCount, uiState, codes };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- -- 페이지 타이틀 배너 ----------------------------------------------------- -->
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

  <!-- -- 탭 + 정렬 --------------------------------------------------------- -->
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--border);margin-bottom:28px;">
    <!-- -- 탭 ------------------------------------------------------------ -->
    <div style="display:flex;gap:0;">
      <button @click="uiState.activeTab='ongoing'"
        :style="{
          padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.88rem', fontWeight: uiState.activeTab==='ongoing' ? '700' : '500',
          color: uiState.activeTab==='ongoing' ? 'var(--text-primary)' : 'var(--text-muted)',
          borderBottom: uiState.activeTab==='ongoing' ? '2px solid var(--text-primary)' : '2px solid transparent',
          marginBottom: '-1px',
        }">진행중 ({{ cfOngoingCount }})</button>
      <button @click="uiState.activeTab='ended'"
        :style="{
          padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.88rem', fontWeight: uiState.activeTab==='ended' ? '700' : '500',
          color: uiState.activeTab==='ended' ? 'var(--text-primary)' : 'var(--text-muted)',
          borderBottom: uiState.activeTab==='ended' ? '2px solid var(--text-primary)' : '2px solid transparent',
          marginBottom: '-1px',
        }">당첨자 발표</button>
    </div>
    <!-- -- 정렬 ----------------------------------------------------------- -->
    <div style="display:flex;gap:0;padding-bottom:2px;">
      <button @click="uiState.sortBy='latest'"
        :style="{
          padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.8rem',
          color: uiState.sortBy==='latest' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: uiState.sortBy==='latest' ? '700' : '400',
          borderRight:'1px solid var(--border)',
        }">최근등록순</button>
      <button @click="uiState.sortBy='deadline'"
        :style="{
          padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
          fontSize:'0.8rem',
          color: uiState.sortBy==='deadline' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: uiState.sortBy==='deadline' ? '700' : '400',
        }">마감임박순</button>
    </div>
  </div>

  <!-- -- 이벤트 그리드 -------------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">
    <div v-for="ev in events" :key="ev.id"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;"
      @click="navigate('eventView', { eventId: ev.id })"
      @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
      @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">

      <!-- -- 이벤트 배너 썸네일 ------------------------------------------------- -->
      <div :style="{ height:'170px', background: ev.bannerBg, position:'relative', overflow:'hidden',
                     display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-end', padding:'16px' }">
        <!-- -- 배너 텍스트 --------------------------------------------------- -->
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
        <!-- -- 종료 오버레이 -------------------------------------------------- -->
        <div v-if="ev.status==='ended'"
          style="position:absolute;inset:0;background:rgba(0,0,0,0.52);display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:0.85rem;font-weight:700;letter-spacing:3px;border:1px solid rgba(255,255,255,0.6);padding:5px 14px;">CLOSED</span>
        </div>
      </div>

      <!-- -- 카드 정보 ------------------------------------------------------ -->
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

  <!-- -- 빈 상태 ----------------------------------------------------------- -->
  <div v-if="events.length === 0" style="text-align:center;padding:clamp(32px,6vw,60px) 0;color:var(--text-muted);">
    <div style="font-size:2rem;margin-bottom:12px;">📭</div>
    <div style="font-size:0.95rem;">{{ uiState.activeTab === 'ongoing' ? '진행 중인 이벤트가 없습니다.' : '종료된 이벤트가 없습니다.' }}</div>
  </div>

</div>
  `
};

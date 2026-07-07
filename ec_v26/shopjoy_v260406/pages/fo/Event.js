/* ShopJoy - Event (이벤트 목록) */
window.EventPage = {
  name: 'EventPage',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, activeTab: 'ongoing', sortBy: 'latest', broadened: false });
    const codes = reactive({});

    const searchValue = ref('');

    const events = reactive([]);

    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageType: 'PAGE', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Event.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 탭 변경 (param: 'ongoing' | 'ended')
      } else if (cmd === 'tab-change') {
        uiState.activeTab = param;
        return;
      // 정렬 변경 (param: 'latest' | 'deadline')
      } else if (cmd === 'sort-change') {
        uiState.sortBy = param;
        return;
      // 검색 실행
      } else if (cmd === 'search-submit') {
        pager.pageNo = 1;
        handleSearchList();
        return;
      // 검색 초기화
      } else if (cmd === 'search-reset') {
        searchValue.value = '';
        pager.pageNo = 1;
        handleSearchList();
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Event.js : handleSelectAction -> ', cmd, param);
      // 이벤트 카드 클릭 (param: eventId)
      if (cmd === 'events-rowView') {
        return props.navigate('eventView', { eventId: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */



    /* ── 백엔드 → 화면 어댑터 ──
     *   eventStatusCd(PENDING/ACTIVE/ENDED) → status('ongoing'|'ended'),
     *   eventTitle/startDate 등 → 화면 카드 기대 필드. 배너색/태그는 백엔드에 없어 결정적 생성. */
    const STATUS_KOR = foConsts.EVENT_STATUS_KOR;
    const BANNER_BGS = foConsts.EVENT_BANNER_BGS;

    /* _adaptEvent — PmEventDto.Item → 화면 카드 기대 형태 */
    const _adaptEvent = (e) => {
      const cd = String(e.eventStatusCd || '').toUpperCase();
      const status = cd === 'ENDED' ? 'ended' : 'ongoing';   // PENDING/ACTIVE → 진행중 탭
      const title = e.eventTitle || e.eventNm || '';
      return {
        id:        e.eventId,
        title,
        status,
        startDate: coUtil.cofYmd(e.startDate),
        endDate:   coUtil.cofYmd(e.endDate),
        bannerBg:  BANNER_BGS[coUtil.cofHashIdx(e.eventId, BANNER_BGS.length)],
        bannerText: '#ffffff',
        bannerLine1: '',
        bannerLine2: title,
        tag:       STATUS_KOR[cd] || (e.eventTypeCdNm || '이벤트'),
        tagColor:  status === 'ended' ? '#9ca3af' : '#ef4444',
      };
    };

    /* _fetchEvents — 서버 조회 1회 (eventStatusCd 옵션). { list, total, totalPage } 반환 */
    const _fetchEvents = async (statusCd) => {
      const sv = searchValue.value.trim();
      const params = {
        pageNo: pager.pageNo, pageSize: pager.pageSize,
        ...(statusCd ? { eventStatusCd: statusCd } : {}),
        ...(uiState.sortBy === 'deadline' ? { sort: 'endDate asc' } : {}),
        ...(sv ? { searchValue: sv, searchType: 'eventId,eventTitle' } : {}),
      };
      const res = await foApiSvc.pmEvent.getPage(params, '이벤트', '목록조회');
      const d = res.data?.data || {};
      return { list: d.pageList || [], total: d.pageTotalCount || 0, totalPage: d.pageTotalPage || 1 };
    };

    /* handleSearchList — 목록 조회.
     *   진행중 탭: ACTIVE 조회 → 0건이면 상태필터 해제하고 전체(기간 무제한) 재조회(폴백 안내).
     *   ⚠️ 백엔드 기간검색은 reg_date/upd_date 만 지원하고 이벤트 진행기간(start/end_date) 검색은
     *      미지원 → dateType 미전송이 곧 '기간 무제한'. 폴백은 상태필터 해제로 기간을 최대로 넓힌다. */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.broadened = false;
        // 검색어가 있으면 탭 필터 없이 전체 검색
        if (searchValue.value.trim()) {
          const r = await _fetchEvents(uiState.activeTab === 'ended' ? 'ENDED' : null);
          _applyResult(r);
          return;
        }
        if (uiState.activeTab === 'ended') {
          const r = await _fetchEvents('ENDED');
          _applyResult(r);
          return;
        }
        // 진행중 탭: 먼저 ACTIVE
        let r = await _fetchEvents('ACTIVE');
        if (r.total === 0) {
          // 진행중 0건 → 상태필터 해제, 전체 이벤트(기간 무제한)로 폴백
          r = await _fetchEvents(null);
          uiState.broadened = r.total > 0;
        }
        _applyResult(r);
      } catch (e) {
        console.error('[handleSearchList]', e);
        events.splice(0, events.length);
        pager.pageTotalCount = 0; pager.pageTotalPage = 1;
      }
    };

    /* _applyResult — 조회 결과를 화면 상태에 반영 */
    const _applyResult = (r) => {
      pager.pageTotalCount = r.total;
      pager.pageTotalPage  = r.totalPage;
      events.splice(0, events.length, ...r.list.map(_adaptEvent));
      coUtil.cofBuildPagerNums(pager);
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    watch(() => uiState.activeTab, () => { pager.pageNo = 1; handleSearchList('DEFAULT'); });
    watch(() => uiState.sortBy,    () => { pager.pageNo = 1; handleSearchList('DEFAULT'); });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* cfOngoingCount — 진행중 탭이면 서버 총건수(단, 전체 폴백 시 진행중은 0건),
     *   그 외 탭이면 현재 페이지 내 진행중 수 */
    const cfOngoingCount = computed(() => {
      if (uiState.activeTab !== 'ongoing') { return events.filter(e => e.status === 'ongoing').length; }
      return uiState.broadened ? 0 : pager.pageTotalCount;
    });


    onMounted(() => {
      handleSearchList();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState,       // 상태
      searchValue,
      handleBtnAction, handleSelectAction, // dispatch
      events, // 데이터
      cfOngoingCount,              // computed
    };
  },
  template: /* html */ `
<fo-page title="이벤트" eyebrow="Promotion"
  banner-img="assets/cdn/prod/img/page-title/page-title-1.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'이벤트' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 검색창 ======================================================= -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
    <div style="position:relative;flex:1;max-width:400px;">
      <input
        v-model="searchValue"
        type="text"
        placeholder="ID 또는 이벤트명 검색"
        @keyup.enter="handleBtnAction('search-submit')"
        style="width:100%;padding:9px 40px 9px 14px;border:1px solid var(--border);border-radius:6px;font-size:0.88rem;background:var(--bg-card);color:var(--text-primary);box-sizing:border-box;outline:none;" />
      <button v-if="searchValue"
        @click="handleBtnAction('search-reset')"
        style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1rem;line-height:1;padding:2px 4px;">✕</button>
    </div>
    <button @click="handleBtnAction('search-submit')"
      style="padding:9px 20px;background:var(--text-primary);color:#fff;border:none;border-radius:6px;font-size:0.88rem;font-weight:600;cursor:pointer;white-space:nowrap;">
      검색
    </button>
  </div>
  <!-- ===== □. 검색창 ======================================================= -->
  <!-- ===== ■. 탭 + 정렬 ================================================== -->
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--border);margin-bottom:28px;">
    <!-- ===== ■.■. 탭 ===================================================== -->
    <div style="display:flex;gap:0;">
      <button @click="handleBtnAction('tab-change', 'ongoing')"
        :style="{
        padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.88rem', fontWeight: uiState.activeTab==='ongoing' ? '700' : '500',
        color: uiState.activeTab==='ongoing' ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: uiState.activeTab==='ongoing' ? '2px solid var(--text-primary)' : '2px solid transparent',
        marginBottom: '-1px',
        }">
        진행중 ({{ cfOngoingCount }})
      </button>
      <button @click="handleBtnAction('tab-change', 'ended')"
        :style="{
        padding:'12px 24px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.88rem', fontWeight: uiState.activeTab==='ended' ? '700' : '500',
        color: uiState.activeTab==='ended' ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: uiState.activeTab==='ended' ? '2px solid var(--text-primary)' : '2px solid transparent',
        marginBottom: '-1px',
        }">
        당첨자 발표
      </button>
    </div>
    <!-- ===== □.□. 탭 ===================================================== -->
    <!-- ===== ■.■. 정렬 ==================================================== -->
    <div style="display:flex;gap:0;padding-bottom:2px;">
      <button @click="handleBtnAction('sort-change', 'latest')"
        :style="{
        padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.8rem',
        color: uiState.sortBy==='latest' ? 'var(--text-primary)' : 'var(--text-muted)',
        fontWeight: uiState.sortBy==='latest' ? '700' : '400',
        borderRight:'1px solid var(--border)',
        }">
        최근등록순
      </button>
      <button @click="handleBtnAction('sort-change', 'deadline')"
        :style="{
        padding:'6px 14px', background:'none', border:'none', cursor:'pointer',
        fontSize:'0.8rem',
        color: uiState.sortBy==='deadline' ? 'var(--text-primary)' : 'var(--text-muted)',
        fontWeight: uiState.sortBy==='deadline' ? '700' : '400',
        }">
        마감임박순
      </button>
    </div>
  </div>
  <!-- ===== □.□. 정렬 ==================================================== -->
  <!-- ===== □. 탭 + 정렬 ================================================== -->
  <!-- ===== ■. 폴백 안내 (진행중 0건 → 전체 이벤트로 확장) ========================= -->
  <div v-if="uiState.broadened" style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:18px;font-size:0.82rem;color:var(--text-secondary);display:flex;align-items:center;gap:8px;">
    <span>ℹ️</span>
    <span>진행 중인 이벤트가 없어 전체 이벤트를 보여드립니다.</span>
  </div>
  <!-- ===== ■. 이벤트 그리드 ================================================= -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">
    <div v-for="ev in events" :key="ev.id"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;"
      @click="handleSelectAction('events-rowView', ev.id)"
      @mouseenter="$event.currentTarget.style.transform='translateY(-3px)';$event.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)'"
      @mouseleave="$event.currentTarget.style.transform='';$event.currentTarget.style.boxShadow=''">
      <!-- ===== ■.■.■. 이벤트 배너 썸네일 ========================================== -->
      <div :style="{ height:'170px', background: ev.bannerBg, position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-end', padding:'16px' }">
        <!-- ===== ■.■.■.■. 배너 텍스트 ============================================ -->
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
        <!-- ===== ■.■.■.■. 종료 오버레이 =========================================== -->
        <div v-if="ev.status==='ended'"
          style="position:absolute;inset:0;background:rgba(0,0,0,0.52);display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:0.85rem;font-weight:700;letter-spacing:3px;border:1px solid rgba(255,255,255,0.6);padding:5px 14px;">
            CLOSED
          </span>
        </div>
      </div>
      <!-- ===== ■.■.■. 카드 정보 =============================================== -->
      <div style="padding:14px 14px 16px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
          <span :style="{ padding:'2px 7px', borderRadius:'2px', fontSize:'0.68rem', fontWeight:'700', color:'#fff', background: ev.tagColor }">
            {{ ev.tag }}
          </span>
        </div>
        <div style="font-size:0.87rem;font-weight:600;color:var(--text-primary);line-height:1.45;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          {{ ev.title }}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          {{ ev.startDate }} ~ {{ ev.endDate }}
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 이벤트 그리드 ================================================= -->
  <!-- ===== ■. 빈 상태 ==================================================== -->
  <div v-if="events.length === 0" style="text-align:center;padding:clamp(32px,6vw,60px) 0;color:var(--text-muted);">
    <div style="font-size:2rem;margin-bottom:12px;">
      📭
    </div>
    <div style="font-size:0.95rem;">
      {{ searchValue ? '검색 결과가 없습니다.' : (uiState.activeTab === 'ongoing' ? '진행 중인 이벤트가 없습니다.' : '종료된 이벤트가 없습니다.') }}
    </div>
  </div>
  <!-- ===== □. 빈 상태 ==================================================== -->
</fo-page>
`
};

/* ShopJoy Admin - 대시보드 */
window.SyDashboardMng = {
  name: 'SyDashboardMng',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { computed, reactive, ref, watch, onMounted } = Vue;

    const uiState = reactive({ isPageCodeLoad: false });
    const codes = reactive({});

    // 통계 카드 건수 (서버 pageTotalCount 기반)
    const stats = reactive({
      members: 0, products: 0, orders: 0, claims: 0,
      deliveries: 0, coupons: 0, sites: 0, boUsers: 0,
    });


    const shortcuts = [
      { id: 'ecMemberMng',   label: '회원관리',   icon: '👥', color: '#e8587a' },
      { id: 'ecProdMng',     label: '상품관리',   icon: '📦', color: '#1677ff' },
      { id: 'ecOrderMng',    label: '주문관리',   icon: '🛒', color: '#52c41a' },
      { id: 'ecClaimMng',    label: '클레임관리', icon: '⚠️', color: '#ff4d4f' },
      { id: 'ecDlivMng',     label: '배송관리',   icon: '🚚', color: '#389e0d' },
      { id: 'ecCouponMng',   label: '쿠폰관리',   icon: '🎫', color: '#722ed1' },
      { id: 'ecEventMng',    label: '이벤트관리', icon: '🎉', color: '#d46b08' },
      { id: 'syContactMng',  label: '문의관리',   icon: '💬', color: '#13c2c2' },
      { id: 'sySiteMng',     label: '사이트관리', icon: '🌐', color: '#2563eb' },
      { id: 'syUserMng',     label: '사용자관리', icon: '🔑', color: '#c41d7f' },
    ];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyDashboardMng.js : handleBtnAction -> ', cmd, param);
      // 통계 카드 클릭 → 관련 화면 이동 (현재 disabled — 카드 자체 click 핸들러 없음)
      if (cmd === 'stats-cardClick') {
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyDashboardMng.js : handleSelectAction -> ', cmd, param);
      // 바로가기 메뉴 선택 → 해당 페이지로 이동
      if (cmd === 'shortcuts-select') {
        return props.navigate(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* fnLoadStats — 8개 도메인 건수 조회 (pageTotalCount 기반, 1건만 요청해 카운트만 사용) */
    const fnLoadStats = async () => {
      const PG = { pageNo: 1, pageSize: 1 };
      const cnt = (res) => res?.data?.data?.pageTotalCount || 0;
      const jobs = [
        ['members',    () => boApiSvc.mbMember.getPage(PG, '대시보드', '회원수')],
        ['products',   () => boApiSvc.pdProd.getPage(PG, '대시보드', '상품수')],
        ['orders',     () => boApiSvc.odOrder.getPage(PG, '대시보드', '주문수')],
        ['claims',     () => boApiSvc.odClaim.getPage(PG, '대시보드', '클레임수')],
        ['deliveries', () => boApiSvc.odDliv.getPage(PG, '대시보드', '배송수')],
        ['coupons',    () => boApiSvc.pmCoupon.getPage(PG, '대시보드', '쿠폰수')],
        ['sites',      () => boApiSvc.sySite.getPage(PG, '대시보드', '사이트수')],
        ['boUsers',    () => boApiSvc.syUser.getPage(PG, '대시보드', '관리자수')],
      ];
      await Promise.all(jobs.map(async ([key, fn]) => {
        try { stats[key] = cnt(await fn()); }
        catch (err) { console.error('[fnLoadStats]', key, err); stats[key] = 0; }
      }));
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      fnLoadStats();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const cfStats = computed(() => [
      { label: '전체 회원', value: stats.members,    color: '#e8587a', icon: '👥', sub: '명' },
      { label: '전체 상품', value: stats.products,   color: '#1677ff', icon: '📦', sub: '개' },
      { label: '전체 주문', value: stats.orders,     color: '#52c41a', icon: '🛒', sub: '건' },
      { label: '클레임',    value: stats.claims,     color: '#ff4d4f', icon: '⚠️', sub: '건' },
      { label: '배송',      value: stats.deliveries, color: '#389e0d', icon: '🚚', sub: '건' },
      { label: '쿠폰',      value: stats.coupons,    color: '#722ed1', icon: '🎫', sub: '개' },
      { label: '사이트',    value: stats.sites,      color: '#d46b08', icon: '🌐', sub: '개' },
      { label: '관리자',    value: stats.boUsers,    color: '#13c2c2', icon: '👤', sub: '명' },
    ]);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      shortcuts,                // 상태 / 데이터
      handleBtnAction, handleSelectAction,                // dispatch (모든 이벤트 / 액션 라우팅)
      cfStats, // computed
    };
  },
  template: /* html */`
<bo-page title="대시보드">
  <!-- ===== ■. 통계 카드 =================================================== -->
  <!-- ===== ■. 대시보드 영역 ================================================= -->
  <div class="dash-stats">
    <div v-for="s in cfStats" :key="s.label" class="dash-stat-card" :style="{'--accent': s.color}">
      <div class="dash-stat-icon">
        {{ s.icon }}
      </div>
      <div class="dash-stat-body">
        <div class="dash-stat-value">
          {{ s.value.toLocaleString() }}
        </div>
        <div class="dash-stat-label">
          {{ s.label }}
        </div>
        <div class="dash-stat-sub">
          {{ s.sub }}
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 대시보드 영역 ================================================= -->
  <!-- ===== ■. 바로가기 ==================================================== -->
  <bo-container title="바로가기">
    <div class="dash-shortcuts">
      <div v-for="m in shortcuts" :key="m.id" class="dash-shortcut" @click="handleSelectAction('shortcuts-select', m.id)">
        <span class="dash-sc-icon" :style="{background: m.color}">
          {{ m.icon }}
        </span>
        <span class="dash-sc-label">
          {{ m.label }}
        </span>
        <span class="dash-sc-arrow">
          ›
        </span>
      </div>
    </div>
  </bo-container>
</bo-page>
`,
};

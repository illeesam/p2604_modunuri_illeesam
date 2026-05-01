/* ShopJoy Admin - 대시보드 */
window.SyDashboardMng = {
  name: 'SyDashboardMng',
  props: ['navigate', 'showToast'],
  setup(props) {
    const { computed, reactive, watch, onMounted } = Vue;
    const uiState = reactive({ isPageCodeLoad: false });
    const codes = reactive({});

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
    });

    const cfSiteNm = computed(() => boUtil.getSiteNm());

    const cfStats = computed(() => [
      { label: '전체 회원',   value: members.value?.length || 0,
        color: '#e8587a', icon: '👥',
        sub: '활성 ' + (members.value?.filter(m => m.status === '활성').length || 0) + '명' },
      { label: '전체 상품',   value: products.value?.length || 0,
        color: '#1677ff', icon: '📦',
        sub: '판매중 ' + (products.value?.filter(p => p.status === '판매중').length || 0) + '개' },
      { label: '전체 주문',   value: orders.value?.length || 0,
        color: '#52c41a', icon: '🛒',
        sub: '완료 ' + (orders.value?.filter(o => o.status === '주문완료').length || 0) + '건' },
      { label: '클레임',      value: claims.value?.length || 0,
        color: '#ff4d4f', icon: '⚠️',
        sub: '처리중 ' + (claims.value?.filter(c => c.status === '처리중').length || 0) + '건' },
      { label: '배송중',      value: deliveries.value?.filter(d => d.status === '배송중').length || 0,
        color: '#389e0d', icon: '🚚',
        sub: '전체 ' + (deliveries.value?.length || 0) + '건' },
      { label: '쿠폰',        value: coupons.value?.length || 0,
        color: '#722ed1', icon: '🎫',
        sub: '활성 ' + (coupons.value?.filter(c => c.status === '활성').length || 0) + '개' },
      { label: '사이트',      value: sites.value?.length || 0,
        color: '#d46b08', icon: '🌐',
        sub: '운영중 ' + (sites.value?.filter(s => s.status === '운영중').length || 0) + '개' },
      { label: '관리자',      value: boUsers.value?.length || 0,
        color: '#13c2c2', icon: '👤',
        sub: '활성 ' + (boUsers.value?.filter(u => u.status === '활성').length || 0) + '명' },
    ]);

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

    return { uiState, codes, cfSiteNm, cfStats, shortcuts };
  },
  template: /* html */`
<div>
  <div class="page-title">대시보드</div>

  <!-- 통계 카드 -->
  <div class="dash-stats">
    <div v-for="s in cfStats" :key="s.label" class="dash-stat-card" :style="{'--accent': s.color}">
      <div class="dash-stat-icon">{{ s.icon }}</div>
      <div class="dash-stat-body">
        <div class="dash-stat-value">{{ s.value.toLocaleString() }}</div>
        <div class="dash-stat-label">{{ s.label }}</div>
        <div class="dash-stat-sub">{{ s.sub }}</div>
      </div>
    </div>
  </div>

  <!-- 바로가기 -->
  <div class="card">
    <div class="section-title">바로가기</div>
    <div class="dash-shortcuts">
      <div v-for="m in shortcuts" :key="m.id" class="dash-shortcut" @click="navigate(m.id)">
        <span class="dash-sc-icon" :style="{background: m.color}">{{ m.icon }}</span>
        <span class="dash-sc-label">{{ m.label }}</span>
        <span class="dash-sc-arrow">›</span>
      </div>
    </div>
  </div>
</div>
`,
};

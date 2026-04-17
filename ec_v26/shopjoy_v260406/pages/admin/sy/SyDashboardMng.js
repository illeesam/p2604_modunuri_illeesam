/* ShopJoy Admin - 대시보드 */
window.SyDashboardMng = {
  name: 'SyDashboardMng',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const stats = computed(() => [
      { label: '전체 회원',   value: props.adminData.members?.length || 0,
        color: '#e8587a', icon: '👥',
        sub: '활성 ' + (props.adminData.members?.filter(m => m.status === '활성').length || 0) + '명' },
      { label: '전체 상품',   value: props.adminData.products?.length || 0,
        color: '#1677ff', icon: '📦',
        sub: '판매중 ' + (props.adminData.products?.filter(p => p.status === '판매중').length || 0) + '개' },
      { label: '전체 주문',   value: props.adminData.orders?.length || 0,
        color: '#52c41a', icon: '🛒',
        sub: '완료 ' + (props.adminData.orders?.filter(o => o.status === '주문완료').length || 0) + '건' },
      { label: '클레임',      value: props.adminData.claims?.length || 0,
        color: '#ff4d4f', icon: '⚠️',
        sub: '처리중 ' + (props.adminData.claims?.filter(c => c.status === '처리중').length || 0) + '건' },
      { label: '배송중',      value: props.adminData.deliveries?.filter(d => d.status === '배송중').length || 0,
        color: '#389e0d', icon: '🚚',
        sub: '전체 ' + (props.adminData.deliveries?.length || 0) + '건' },
      { label: '쿠폰',        value: props.adminData.coupons?.length || 0,
        color: '#722ed1', icon: '🎫',
        sub: '활성 ' + (props.adminData.coupons?.filter(c => c.status === '활성').length || 0) + '개' },
      { label: '사이트',      value: props.adminData.sites?.length || 0,
        color: '#d46b08', icon: '🌐',
        sub: '운영중 ' + (props.adminData.sites?.filter(s => s.status === '운영중').length || 0) + '개' },
      { label: '관리자',      value: props.adminData.adminUsers?.length || 0,
        color: '#13c2c2', icon: '👤',
        sub: '활성 ' + (props.adminData.adminUsers?.filter(u => u.status === '활성').length || 0) + '명' },
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

    return { siteNm, stats, shortcuts };
  },
  template: /* html */`
<div>
  <div class="page-title">대시보드</div>

  <!-- 통계 카드 -->
  <div class="dash-stats">
    <div v-for="s in stats" :key="s.label" class="dash-stat-card" :style="{'--accent': s.color}">
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

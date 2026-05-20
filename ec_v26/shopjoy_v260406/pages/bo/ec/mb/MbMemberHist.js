/* ShopJoy Admin - 회원 이력 (연관주문 / 연관클레임) */
window._ecMemberHistState = window._ecMemberHistState || { tab: 'orders', tabMode: 'tab' };
window.MbMemberHist = {
  name: 'MbMemberHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    memberId:     { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    const { computed, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, isPageCodeLoad: false, tab: window._ecMemberHistState.tab || 'orders', tabMode2: window._ecMemberHistState.tabMode || 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    // -- watch ----------------------------------------------------------------

    watch(() => uiState.tab, v => { window._ecMemberHistState.tab = v; });

    watch(() => uiState.tabMode2, v => { window._ecMemberHistState.tabMode = v; });

    /* 회원 fnLoadCodes */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    watch(() => props.memberId, () => {
      // 회원ID 변경시 자동으로 computed 값 갱신 (별도 로드 불필요 - 목업 데이터)
    });

    // ★ onMounted — 진입 시 코드 로드
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* 회원 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.tab === id;

    const cfMemberOrders = computed(() => {
      // 목업: 회원별 주문 이력 샘플 데이터
      const sampleOrders = {
        'MB000001': [{ orderId: 'ORD001', orderDate: '2026-04-20 10:00', prodNm: '상품A', totalPrice: 50000, statusCd: 'PAID' }],
        'MB000002': [{ orderId: 'ORD002', orderDate: '2026-04-19 14:00', prodNm: '상품B', totalPrice: 30000, statusCd: 'SHIPPED' }],
      };
      return sampleOrders[props.memberId] || [];
    });
    const cfMemberClaims = computed(() => {
      // 목업: 회원별 클레임 이력 샘플 데이터
      const sampleClaims = {
        'MB000001': [{ claimId: 'CLAIM001', orderId: 'ORD001', type: '반품', statusCd: 'PENDING', reasonCd: '상품오류', requestDate: '2026-04-20' }],
      };
      return sampleClaims[props.memberId] || [];
    });

    // -- 그리드 컬럼 정의 ------------------------------------------------------
    const orderGridColumns = [
      { key: 'orderId', label: '주문ID', refLink: 'order' },
      { key: 'orderDate', label: '주문일' },
      { key: 'prodNm', label: '상품' },
      { key: 'totalPrice', label: '금액', fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'statusCd', label: '상태' },
    ];
    const claimGridColumns = [
      { key: 'claimId', label: '클레임ID', refLink: 'claim' },
      { key: 'orderId', label: '주문ID', refLink: 'order' },
      { key: 'type', label: '유형' },
      { key: 'statusCd', label: '상태' },
      { key: 'reasonCd', label: '사유' },
      { key: 'requestDate', label: '신청일', fmt: (v) => (v ? v.slice(0, 10) : '') },
    ];

    // -- return ---------------------------------------------------------------

    return {
      uiState,
      cfMemberOrders,
      cfMemberClaims,
      showTab,
      tab,
      tabMode2,
      orderGridColumns,
      claimGridColumns,
      navigate: props.navigate,
      showRefModal: showRefModal
    };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='orders'}" :disabled="tabMode2!=='tab'" @click="tab='orders'">🛒 연관 주문 <span class="tab-count">{{ cfMemberOrders.length }}</span></button>
      <button class="tab-btn" :class="{active:tab==='claims'}" :disabled="tabMode2!=='tab'" @click="tab='claims'">↩ 연관 클레임 <span class="tab-count">{{ cfMemberClaims.length }}</span></button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}" @click="tabMode2='tab'" title="탭으로 보기">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

  <!-- -- 연관 주문 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('orders')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ cfMemberOrders.length }}</span></div>
    <bo-grid bare :columns="orderGridColumns" :rows="cfMemberOrders" row-key="orderId" empty-text="주문 내역이 없습니다." @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:row.orderId})">상세</button>
      </template>
    </bo-grid>
  </div>

  <!-- -- 연관 클레임 --------------------------------------------------------- -->
  <div class="card" v-show="showTab('claims')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ cfMemberClaims.length }}</span></div>
    <bo-grid bare :columns="claimGridColumns" :rows="cfMemberClaims" row-key="claimId" empty-text="클레임 내역이 없습니다." @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:row.claimId})">상세</button>
      </template>
    </bo-grid>
  </div>
  </div>
</div>
`,
};

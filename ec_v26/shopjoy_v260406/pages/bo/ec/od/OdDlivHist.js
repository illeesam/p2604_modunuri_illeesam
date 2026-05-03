/* ShopJoy Admin - 배송 이력 (연관주문 / 연관클레임) */
window._ecDlivHistState = window._ecDlivHistState || { tab: 'order', tabMode: 'tab' };
window.OdDlivHist = {
  name: 'OdDlivHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    orderId:      { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    const { ref, computed, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const deliveries = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, botTab: window._ecDlivHistState.tab || 'order', tabMode2: 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.odDliv.getPage({ pageNo: 1, pageSize: 10000 }, '배송관리', '이력조회');
        deliveries.splice(0, deliveries.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // -- watch ----------------------------------------------------------------

        watch(botTab, v => { window._ecDlivHistState.tab = v; });

    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
};

    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;
    const cfRelatedOrder  = computed(() => getOrder.value(props.orderId));
    const cfRelatedClaims = computed(() => window.safeArrayUtils.safeFilter(claims, c => c.orderId === props.orderId));
    const botTab = Vue.toRef(uiState, 'botTab');


    onMounted(() => {
      handleSearchList();
    });
    // -- return ---------------------------------------------------------------

    return { deliveries, uiState, cfRelatedOrder, cfRelatedClaims, showTab };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='order'}"  :disabled="tabMode2!=='tab'" @click="botTab='order'">🛒 연관 주문 <span class="tab-count">{{ cfRelatedOrder ? 1 : 0 }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='claims'}" :disabled="tabMode2!=='tab'" @click="botTab='claims'">↩ 연관 클레임 <span class="tab-count">{{ cfRelatedClaims.length }}</span></button>
    </div>
    </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

  <!-- -- 연관 주문 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('order')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ cfRelatedOrder ? 1 : 0 }}</span></div>
    <template v-if="cfRelatedOrder">
      <div class="detail-row"><span class="detail-label">주문ID</span><span class="detail-value">{{ cfRelatedOrder.orderId }}</span></div>
      <div class="detail-row"><span class="detail-label">회원</span>
        <span class="detail-value"><span class="ref-link" @click="showRefModal('member', cfRelatedOrder.userId)">{{ cfRelatedOrder.userNm }}</span></span>
      </div>
      <div class="detail-row"><span class="detail-label">상품</span><span class="detail-value">{{ cfRelatedOrder.prodNm }}</span></div>
      <div class="detail-row"><span class="detail-label">금액</span><span class="detail-value">{{ (cfRelatedOrder.totalPrice||0).toLocaleString() }}원</span></div>
      <div class="detail-row"><span class="detail-label">상태</span><span class="detail-value">{{ cfRelatedOrder.statusCd }}</span></div>
      <div style="margin-top:14px;"><button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:cfRelatedOrder.orderId})">주문 상세 수정</button></div>
    </template>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문 정보가 없습니다.</div>
  </div>

  <!-- -- 연관 클레임 --------------------------------------------------------- -->
  <div class="card" v-show="showTab('claims')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ cfRelatedClaims.length }}</span></div>
    <table class="bo-table" v-if="cfRelatedClaims.length">
      <thead><tr><th>클레임ID</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in cfRelatedClaims" :key="c?.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td>{{ c.type }}</td><td>{{ c.statusCd }}</td><td>{{ c.reasonCd }}</td>
          <td>{{ c.requestDate.slice(0,10) }}</td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:c.claimId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 클레임이 없습니다.</div>
  </div>
  </div>
</div>
`,
};

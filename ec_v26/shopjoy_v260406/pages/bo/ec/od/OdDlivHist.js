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
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
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

    /* 배송 fnLoadCodes */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
};

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    /* 배송 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;
    const cfRelatedOrder  = computed(() => getOrder.value(props.orderId));
    const cfRelatedClaims = computed(() => window.safeArrayUtils.safeFilter(claims, c => c.orderId === props.orderId));
    const botTab = Vue.toRef(uiState, 'botTab');


    onMounted(() => {
      handleSearchList();
    });
    /* BoGrid(bare) 컬럼 — 연관 클레임 */
    const claimColumns = [
      { key: 'claimId',     label: '클레임ID', style: 'width:120px;', refLink: 'claim' },
      { key: 'type',        label: '유형',   style: 'width:70px;' },
      { key: 'statusCd',    label: '상태',   style: 'width:90px;' },
      { key: 'reasonCd',    label: '사유' },
      { key: 'requestDate', label: '신청일', style: 'width:100px;', fmt: v => (v||'').slice(0,10) },
      { key: '_act',        label: '관리',   style: 'width:60px;text-align:center;' },
    ];

    // -- return ---------------------------------------------------------------

    return { deliveries, uiState, cfRelatedOrder, cfRelatedClaims, showTab, claimColumns,
             botTab, tabMode2, showRefModal, navigate: props.navigate };
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
    <bo-grid bare :columns="claimColumns" :rows="cfRelatedClaims" row-key="claimId"
             empty-text="연관 클레임이 없습니다." @ref-click="({type,id}) => showRefModal(type, id)">
      <template #cell-_act="{ row }">
        <td style="text-align:center;"><button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:row.claimId})">상세</button></td>
      </template>
    </bo-grid>
  </div>
  </div>
</div>
`,
};

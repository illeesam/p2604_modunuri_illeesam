/* ShopJoy Admin - 주문 이력 (구성상품 / 배송이력 / 연관클레임) */
window._ecOrderHistState = window._ecOrderHistState || { tab: 'products', tabMode: 'tab' };
window.OdOrderHist = {
  name: 'OdOrderHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    orderId:      { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const orders = reactive([]);
    const uiState = reactive({ loading: false, isPageCodeLoad: false, botTab: window._ecOrderHistState.tab || 'products', tabMode2: 'tab'});
    const tab = Vue.toRef(uiState, 'tab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const claims = reactive([]);
    const deliveries = reactive([]);

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const [resO, resC, resD] = await Promise.all([
          boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 10000 }, '주문관리', '이력조회'),
          boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 10000 }, '클레임관리', '이력조회'),
          boApiSvc.odDliv.getPage({ pageNo: 1, pageSize: 10000 }, '배송관리', '이력조회'),
        ]);
        orders.splice(0, orders.length, ...(resO.data?.data?.pageList || resO.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resC.data?.data?.pageList || resC.data?.data?.list || []));
        deliveries.splice(0, deliveries.length, ...(resD.data?.data?.pageList || resD.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // -- watch ----------------------------------------------------------------

        watch(botTab, v => { window._ecOrderHistState.tab = v; });

    /* 주문 fnLoadCodes */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
};

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 주문 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    const orderItems = reactive([]);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      const o = window.safeArrayUtils.safeFind(orders, x => x.orderId === props.orderId);
      if (o) {
        orderItems.splice(0, orderItems.length,
          { no: 1, prodNm: o.prodNm || '-', optionNm: '-', qty: 1, unitPrice: o.payAmt, totalPrice: o.payAmt, statusCd: o.orderStatusCdNm || o.orderStatusCd },
        );
      }
      handleSearchData();
    });

    const cfRelatedDliv   = computed(() => window.safeArrayUtils.safeFind(deliveries || [], d => d.orderId === props.orderId) || null);
    const cfRelatedClaims = computed(() => window.safeArrayUtils.safeFilter(claims || [], c => c.orderId === props.orderId));
    const cfDlivHistory   = computed(() => {
      if (!cfRelatedDliv.value) return [];
      const o = window.safeArrayUtils.safeFind(orders, x => x.orderId === props.orderId);
      return [
        { date: o && o.orderDate ? o.orderDate.slice(0, 10) : '-', status: '상품준비중', location: '물류센터', memo: '상품 포장 완료' },
        { date: cfRelatedDliv.value.dlivShipDate || '-', status: '배송중', location: cfRelatedDliv.value.outboundCourierCd || '-', memo: '출고 완료' },
      ].filter(h => h.date !== '-');
    });

    const botTab = Vue.toRef(uiState, 'botTab');

    /* BoGrid(bare) 컬럼 정의 — 탭별 보조 테이블 */
    const itemGridColumns = [
      { key: 'no',         label: 'No',     style: 'width:40px;text-align:center;' },
      { key: 'prodNm',     label: '상품명' },
      { key: 'optionNm',   label: '옵션' },
      { key: 'qty',        label: '수량',   style: 'width:56px;text-align:center;' },
      { key: 'unitPrice',  label: '단가',   style: 'width:90px;text-align:right;', fmt: v => (v||0).toLocaleString() + '원' },
      { key: 'totalPrice', label: '금액',   style: 'width:100px;text-align:right;',
        align: 'right', cellStyle: 'font-weight:600', fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'statusCd',   label: '상태',   style: 'width:90px;' },
    ];
    const dlivHistGridColumns = [
      { key: 'date',     label: '일시',  style: 'width:120px;' },
      { key: 'status',   label: '상태',  style: 'width:90px;', badge: () => 'badge-blue' },
      { key: 'location', label: '위치' },
      { key: 'memo',     label: '메모' },
    ];
    const claimGridColumns = [
      { key: 'claimId',       label: '클레임ID', style: 'width:120px;', refLink: 'claim' },
      { key: 'memberNm',      label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'claimTypeCd',   label: '유형',   fmt: (v, r) => r.claimTypeCdNm || r.claimTypeCd },
      { key: 'claimStatusCd', label: '상태',   fmt: (v, r) => r.claimStatusCdNm || r.claimStatusCd },
      { key: 'reasonCd',      label: '사유' },
      { key: 'requestDate',   label: '신청일', style: 'width:100px;', fmt: v => (v||'').slice(0,10) },
    ];

    // -- return ---------------------------------------------------------------

    return { orders, uiState, orderItems, cfRelatedDliv, cfRelatedClaims, cfDlivHistory, showTab, claims, deliveries,
             itemGridColumns, dlivHistGridColumns, claimGridColumns, showRefModal, orderId: props.orderId, navigate: props.navigate,
             botTab, tabMode2 };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;">
    <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
    이력정보
  </div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='products'}" :disabled="tabMode2!=='tab'" @click="botTab='products'">
        📦 구성 상품
        <span class="tab-count">{{ orderItems.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='dliv'}"     :disabled="tabMode2!=='tab'" @click="botTab='dliv'">
        🚚 배송 이력
        <span class="tab-count">{{ cfRelatedDliv ? 1 : 0 }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='claims'}"   :disabled="tabMode2!=='tab'" @click="botTab='claims'">
        ↩ 연관 클레임
        <span class="tab-count">{{ cfRelatedClaims.length }}</span>
      </button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- -- 구성 상품 ---------------------------------------------------------- -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 구성 상품 <span class="tab-count">{{ orderItems.length }}</span></div>
      <bo-grid bare :columns="itemGridColumns" :rows="orderItems" row-key="no"
        empty-text="구성 상품 정보가 없습니다." row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-secondary btn-sm" @click="showRefModal('order', orderId)">보기</button>
        </template>
      </bo-grid>
    </div>
    <!-- -- 배송 이력 ---------------------------------------------------------- -->
    <div class="card" v-show="showTab('dliv')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🚚 배송 이력 <span class="tab-count">{{ cfRelatedDliv ? 1 : 0 }}</span></div>
      <template v-if="cfRelatedDliv">
        <div style="margin-bottom:14px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;">
            <span style="color:#888;">수령인</span>
            <b>{{ cfRelatedDliv.recvNm }}</b>
            &nbsp;·&nbsp;
            <span style="color:#888;">택배사</span>
            <b>{{ cfRelatedDliv.outboundCourierCdNm || cfRelatedDliv.outboundCourierCd }}</b>
            &nbsp;·&nbsp;
            <span style="color:#888;">운송장</span>
            <b>{{ cfRelatedDliv.outboundTrackingNo || '-' }}</b>
          </div>
          <button class="btn btn-blue btn-sm" @click="navigate('odDlivDtl',{id:cfRelatedDliv.dlivId})">배송 수정</button>
        </div>
        <bo-grid bare :columns="dlivHistGridColumns" :rows="cfDlivHistory"
          empty-text="배송 이력이 없습니다."></bo-grid>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">배송 정보가 없습니다.</div>
    </div>
    <!-- -- 연관 클레임 --------------------------------------------------------- -->
    <div class="card" v-show="showTab('claims')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ cfRelatedClaims.length }}</span></div>
      <bo-grid bare :columns="claimGridColumns" :rows="cfRelatedClaims" row-key="claimId"
        empty-text="연관 클레임이 없습니다." @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-sm" @click="navigate('odClaimDtl',{id:row.claimId})">상세</button>
        </template>
      </bo-grid>
    </div>
  </div>
</div>
`,
};

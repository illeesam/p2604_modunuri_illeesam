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
        orders.splice(0, orders.length, ...(resO.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resC.data?.data?.list || []));
        deliveries.splice(0, deliveries.length, ...(resD.data?.data?.list || []));
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

    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    /* 주문 showTab */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    const orderItems = reactive([]);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      const o = window.safeArrayUtils.safeFind(orders, x => x.orderId === props.orderId);
      if (o) {
        orderItems.splice(0, orderItems.length,
          { no: 1, prodNm: o.prodNm, optionNm: '-', qty: 1, unitPrice: o.totalPrice, totalPrice: o.totalPrice, statusCd: o.statusCd },
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
        { date: cfRelatedDliv.value.shipDate || '-', status: '배송중', location: cfRelatedDliv.value.courierCd || '-', memo: '출고 완료' },
      ].filter(h => h.date !== '-');
    });

    const botTab = Vue.toRef(uiState, 'botTab');

    // -- return ---------------------------------------------------------------

    return { orders, uiState, orderItems, cfRelatedDliv, cfRelatedClaims, cfDlivHistory, showTab, claims, deliveries };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보</div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='products'}" :disabled="tabMode2!=='tab'" @click="botTab='products'">📦 구성 상품 <span class="tab-count">{{ orderItems.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='dliv'}"     :disabled="tabMode2!=='tab'" @click="botTab='dliv'">🚚 배송 이력 <span class="tab-count">{{ cfRelatedDliv ? 1 : 0 }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='claims'}"   :disabled="tabMode2!=='tab'" @click="botTab='claims'">↩ 연관 클레임 <span class="tab-count">{{ cfRelatedClaims.length }}</span></button>
    </div>
    </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

  <!-- -- 구성 상품 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('products')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 구성 상품 <span class="tab-count">{{ orderItems.length }}</span></div>
    <table class="bo-table" v-if="orderItems.length">
      <thead><tr><th>No</th><th>상품명</th><th>옵션</th><th>수량</th><th>단가</th><th>금액</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="item in orderItems" :key="item?.no">
          <td>{{ item.no }}</td>
          <td>{{ item.prodNm }}</td>
          <td>{{ item.optionNm }}</td>
          <td>{{ item.qty }}</td>
          <td>{{ (item.unitPrice||0).toLocaleString() }}원</td>
          <td style="font-weight:600;">{{ (item.totalPrice||0).toLocaleString() }}원</td>
          <td>{{ item.statusCd }}</td>
          <td><button class="btn btn-secondary btn-sm" @click="showRefModal('order', orderId)">보기</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">구성 상품 정보가 없습니다.</div>
  </div>

  <!-- -- 배송 이력 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('dliv')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🚚 배송 이력 <span class="tab-count">{{ cfRelatedDliv ? 1 : 0 }}</span></div>
    <template v-if="cfRelatedDliv">
      <div style="margin-bottom:14px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:13px;">
          <span style="color:#888;">수령인</span> <b>{{ cfRelatedDliv.receiver }}</b>
          &nbsp;·&nbsp;<span style="color:#888;">택배사</span> <b>{{ cfRelatedDliv.courier }}</b>
          &nbsp;·&nbsp;<span style="color:#888;">운송장</span> <b>{{ cfRelatedDliv.trackingNo || '-' }}</b>
        </div>
        <button class="btn btn-blue btn-sm" @click="navigate('odDlivDtl',{id:cfRelatedDliv.dlivId})">배송 수정</button>
      </div>
      <table class="bo-table" v-if="cfDlivHistory.length">
        <thead><tr><th>일시</th><th>상태</th><th>위치</th><th>메모</th></tr></thead>
        <tbody>
          <tr v-for="(h, i) in cfDlivHistory" :key="Math.random()">
            <td>{{ h.date }}</td>
            <td><span class="badge badge-blue">{{ h.status }}</span></td>
            <td>{{ h.location }}</td>
            <td>{{ h.memo }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:20px;font-size:13px;">배송 이력이 없습니다.</div>
    </template>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">배송 정보가 없습니다.</div>
  </div>

  <!-- -- 연관 클레임 --------------------------------------------------------- -->
  <div class="card" v-show="showTab('claims')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">↩ 연관 클레임 <span class="tab-count">{{ cfRelatedClaims.length }}</span></div>
    <table class="bo-table" v-if="cfRelatedClaims.length">
      <thead><tr><th>클레임ID</th><th>회원</th><th>유형</th><th>상태</th><th>사유</th><th>신청일</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="c in cfRelatedClaims" :key="c?.claimId">
          <td><span class="ref-link" @click="showRefModal('claim', c.claimId)">{{ c.claimId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userNm }}</span></td>
          <td>{{ c.type }}</td>
          <td>{{ c.statusCd }}</td>
          <td>{{ c.reasonCd }}</td>
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

/* ShopJoy Admin - 상품 이력 (연관주문 / 재고이력 / 가격변경이력 / 상품상태이력 / 상품정보변경이력) */
window._ecProdHistState = window._ecProdHistState || { tab: 'orders', viewMode: 'tab' };
window.PdProdHist = {
  name: 'PdProdHist',
  props: ['navigate', 'showRefModal', 'prodId'],
  setup(props) {
    const { computed, onMounted, reactive, watch } = Vue;
    const uiState = reactive({
      loading: false,
      isPageCodeLoad: false,
      botTab: window._ecProdHistState.tab || 'orders',
      viewMode2: window._ecProdHistState.viewMode || 'tab',
      loadedTabs: new Set()
    });
    const botTab   = Vue.toRef(uiState, 'botTab');
    const viewMode2 = Vue.toRef(uiState, 'viewMode2');

    watch(botTab, v => {
      window._ecProdHistState.tab = v;
      handleLoadTab(v);
    });

    watch(() => uiState.viewMode2, v => { window._ecProdHistState.viewMode = v; });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    watch(isAppReady, (v) => { if (v) fnLoadCodes(); });

    const showTab = (id) => uiState.viewMode2 !== 'tab' || uiState.botTab === id;

    const relatedOrders = reactive([]);
    const stockHistory  = reactive([]);
    const priceHistory  = reactive([]);
    const statusHistory = reactive([]);
    const changeHistory = reactive([]);

    const BASE = (tab) => `/bo/ec/pd/prod/${props.prodId}/hist/${tab}`;
    const HDR  = (cmd) => apiHdr('상품관리', cmd);

    const handleLoadTab = async (tab) => {
      if (!props.prodId || uiState.loadedTabs.has(tab)) return;
      uiState.loading = true;
      try {
        if (tab === 'orders') {
          const res = await window.boApi.get(BASE('orders'), HDR('연관주문조회'));
          const list = res.data?.data || [];
          relatedOrders.splice(0, relatedOrders.length, ...list);
        } else if (tab === 'stock') {
          const res = await window.boApi.get(BASE('stock'), HDR('재고이력조회'));
          const list = res.data?.data || [];
          stockHistory.splice(0, stockHistory.length, ...list);
        } else if (tab === 'price') {
          const res = await window.boApi.get(BASE('price'), HDR('가격이력조회'));
          const list = res.data?.data || [];
          priceHistory.splice(0, priceHistory.length, ...list);
        } else if (tab === 'status') {
          const res = await window.boApi.get(BASE('status'), HDR('상태이력조회'));
          const list = res.data?.data || [];
          statusHistory.splice(0, statusHistory.length, ...list);
        } else if (tab === 'changes') {
          const res = await window.boApi.get(BASE('changes'), HDR('변경이력조회'));
          const list = res.data?.data || [];
          changeHistory.splice(0, changeHistory.length, ...list);
        }
        uiState.loadedTabs.add(tab);
      } catch (err) {
        console.error('[PdProdHist]', tab, err);
      } finally {
        uiState.loading = false;
      }
    };

    const fnFmtDate = (v) => v ? String(v).slice(0, 16).replace('T', ' ') : '-';
    const fnStockBadge = (cd) => {
      if (!cd) return 'badge-gray';
      const s = String(cd).toUpperCase();
      if (s.includes('IN') || s.includes('입고') || s.includes('ADD')) return 'badge-green';
      if (s.includes('OUT') || s.includes('출고') || s.includes('SALE')) return 'badge-orange';
      return 'badge-gray';
    };

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleLoadTab(uiState.botTab);
      if (uiState.viewMode2 !== 'tab') {
        ['orders', 'stock', 'price', 'status', 'changes']
          .forEach(t => t !== uiState.botTab && handleLoadTab(t));
      }
    });

    watch(() => props.prodId, () => {
      uiState.loadedTabs = new Set();
      relatedOrders.splice(0);
      stockHistory.splice(0);
      priceHistory.splice(0);
      statusHistory.splice(0);
      changeHistory.splice(0);
      handleLoadTab(uiState.botTab);
      if (uiState.viewMode2 !== 'tab') {
        ['orders', 'stock', 'price', 'status', 'changes']
          .forEach(t => t !== uiState.botTab && handleLoadTab(t));
      }
    });

    watch(() => uiState.viewMode2, (v) => {
      if (v !== 'tab') {
        ['orders', 'stock', 'price', 'status', 'changes'].forEach(t => handleLoadTab(t));
      }
    });

    return {
      uiState, botTab, viewMode2,
      relatedOrders, stockHistory, priceHistory, statusHistory, changeHistory,
      showTab, fnFmtDate, fnStockBadge
    };
  },
  template: /* html */`
<div>
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;">
    <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>이력정보
    <span v-if="uiState.loading" style="margin-left:8px;font-size:11px;color:#aaa;">조회 중...</span>
  </div>
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='orders'}"  :disabled="viewMode2!=='tab'" @click="botTab='orders'">🛒 연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='stock'}"   :disabled="viewMode2!=='tab'" @click="botTab='stock'">📦 재고 이력 <span class="tab-count">{{ stockHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='price'}"   :disabled="viewMode2!=='tab'" @click="botTab='price'">💰 가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='status'}"  :disabled="viewMode2!=='tab'" @click="botTab='status'">🏷 상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='changes'}" :disabled="viewMode2!=='tab'" @click="botTab='changes'">📝 상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span></button>
    </div>
    <div class="tab-view-modes">
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='tab'}"  @click="viewMode2='tab'"  title="탭으로 보기">📑</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='1col'}" @click="viewMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='2col'}" @click="viewMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='3col'}" @click="viewMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-view-mode-btn" :class="{active:viewMode2==='4col'}" @click="viewMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <div :class="viewMode2!=='tab' ? 'dtl-tab-grid cols-'+viewMode2.charAt(0) : ''">

  <!-- ── 연관 주문 ────────────────────────────────────────────────────────── -->
  <div class="card" v-show="showTab('orders')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span></div>
    <table class="bo-table" v-if="relatedOrders.length">
      <thead><tr><th>주문ID</th><th>회원</th><th>주문일</th><th>금액</th><th>수량</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>
        <tr v-for="o in relatedOrders" :key="o.orderId">
          <td><span class="ref-link" @click="showRefModal('order', o.orderId)">{{ o.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', o.memberId)">{{ o.memberNm || o.memberId }}</span></td>
          <td>{{ fnFmtDate(o.orderDate) }}</td>
          <td>{{ (o.totalAmt||0).toLocaleString() }}원</td>
          <td>{{ o.orderQty }}</td>
          <td><span class="badge badge-blue">{{ o.orderStatusCdNm || o.orderStatusCd }}</span></td>
          <td><button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:o.orderId})">상세</button></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">연관 주문이 없습니다.</div>
  </div>

  <!-- ── 재고 이력 ────────────────────────────────────────────────────────── -->
  <div class="card" v-show="showTab('stock')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📦 재고 이력 <span class="tab-count">{{ stockHistory.length }}</span></div>
    <table class="bo-table" v-if="stockHistory.length">
      <thead><tr><th>일시</th><th>유형</th><th>수량</th><th>처리 후 재고</th><th>처리자</th><th>메모</th></tr></thead>
      <tbody>
        <tr v-for="h in stockHistory" :key="h.histId">
          <td>{{ fnFmtDate(h.histDate) }}</td>
          <td><span class="badge" :class="fnStockBadge(h.stockTypeCd)">{{ h.stockTypeCdNm || h.stockTypeCd }}</span></td>
          <td :style="(h.stockQty||0)>0?'color:#389e0d;font-weight:600':'color:#cf1322;font-weight:600'">
            {{ (h.stockQty||0) > 0 ? '+' : '' }}{{ h.stockQty }}
          </td>
          <td>{{ h.stockBalance }}개</td>
          <td>{{ h.regByNm || h.regBy }}</td>
          <td>{{ h.stockMemo }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">재고 이력이 없습니다.</div>
  </div>

  <!-- ── 가격변경이력 ───────────────────────────────────────────────────────── -->
  <div class="card" v-show="showTab('price')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">💰 가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span></div>
    <table class="bo-table" v-if="priceHistory.length">
      <thead><tr><th>일시</th><th>항목(변경사유)</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="h in priceHistory" :key="h.histId">
          <td>{{ fnFmtDate(h.histDate) }}</td>
          <td><span class="tag">{{ h.priceField }}</span></td>
          <td style="color:#888;">{{ h.priceBefore }}</td>
          <td style="font-weight:600;color:#e8587a;">{{ h.priceAfter }}</td>
          <td>{{ h.regByNm || h.regBy }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">가격 변경 이력이 없습니다.</div>
  </div>

  <!-- ── 상품상태 이력 ──────────────────────────────────────────────────────── -->
  <div class="card" v-show="showTab('status')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">🏷 상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span></div>
    <table class="bo-table" v-if="statusHistory.length">
      <thead><tr><th>일시</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="h in statusHistory" :key="h.histId">
          <td>{{ fnFmtDate(h.histDate) }}</td>
          <td><span class="badge badge-gray">{{ h.statusCdBeforeNm || h.statusCdBefore || '-' }}</span></td>
          <td><span class="badge badge-blue">{{ h.statusCdAfterNm || h.statusCdAfter }}</span></td>
          <td>{{ h.regByNm || h.regBy }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">상태 변경 이력이 없습니다.</div>
  </div>

  <!-- ── 상품정보 변경이력 ────────────────────────────────────────────────────── -->
  <div class="card" v-show="showTab('changes')" style="margin:0;">
    <div v-if="viewMode2!=='tab'" class="dtl-tab-card-title">📝 상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span></div>
    <table class="bo-table" v-if="changeHistory.length">
      <thead><tr><th>일시</th><th>항목</th><th>변경 전</th><th>변경 후</th><th>처리자</th></tr></thead>
      <tbody>
        <tr v-for="h in changeHistory" :key="h.histId">
          <td>{{ fnFmtDate(h.histDate) }}</td>
          <td><span class="tag">{{ h.changeField }}</span></td>
          <td style="color:#888;">{{ h.changeBefore }}</td>
          <td style="font-weight:500;">{{ h.changeAfter }}</td>
          <td>{{ h.regByNm || h.regBy }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">변경 이력이 없습니다.</div>
  </div>
  </div>
</div>
`,
};

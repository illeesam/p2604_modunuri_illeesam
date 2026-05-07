/* ShopJoy Admin - 상품 이력 (Q&A / 리뷰 / 연관주문 / 재고이력 / 가격변경이력 / 상품상태이력 / 상품정보변경이력) */
window._ecProdHistState = window._ecProdHistState || { tab: 'qna', tabMode: 'tab' };
window.PdProdHist = {
  name: 'PdProdHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    prodId:       { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    const { computed, onMounted, reactive, watch } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const uiState = reactive({
      loading: false,
      isPageCodeLoad: false,
      botTab: window._ecProdHistState.tab || 'orders',
      tabMode2: window._ecProdHistState.tabMode || 'tab',
      loadedTabs: new Set()
    });
    const botTab   = Vue.toRef(uiState, 'botTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    watch(botTab, v => {
      window._ecProdHistState.tab = v;
      handleLoadTab(v);
    });

    watch(() => uiState.tabMode2, v => { window._ecProdHistState.tabMode = v; });


    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    const qnaList       = reactive([]);
    const reviewList    = reactive([]);
    const relatedOrders = reactive([]);
    const stockHistory  = reactive([]);
    const priceHistory  = reactive([]);
    const statusHistory = reactive([]);
    const changeHistory = reactive([]);

    const BASE = (tab) => `/bo/ec/pd/prod/${props.prodId}/hist/${tab}`;
    const HDR  = (cmd) => coUtil.apiHdr('상품관리', cmd);

    const fnPickPageList = (res) => {
      const d = res?.data?.data;
      return d?.pageList || d?.list || (Array.isArray(d) ? d : []);
    };

    const ALL_TABS = ['qna', 'review', 'orders', 'stock', 'price', 'status', 'changes'];

    const handleLoadTab = async (tab) => {
      if (!props.prodId || uiState.loadedTabs.has(tab)) return;
      uiState.loading = true;
      try {
        if (tab === 'qna') {
          const res = await boApiSvc.pdQna.getPage({ prodId: props.prodId, pageNo: 1, pageSize: 200 }, '상품관리', 'Q&A조회');
          qnaList.splice(0, qnaList.length, ...fnPickPageList(res));
        } else if (tab === 'review') {
          const res = await boApiSvc.pdReview.getPage({ prodId: props.prodId, pageNo: 1, pageSize: 200 }, '상품관리', '리뷰조회');
          reviewList.splice(0, reviewList.length, ...fnPickPageList(res));
        } else if (tab === 'orders') {
          const res = await boApiSvc.odOrder.getPage({ prodId: props.prodId, pageNo: 1, pageSize: 200 }, '상품관리', '연관주문');
          relatedOrders.splice(0, relatedOrders.length, ...(res.data?.data?.pageList || res.data?.data?.list || []));
        } else if (tab === 'stock') {
          const res = await boApi.get(BASE('stock'), HDR('재고이력'));
          stockHistory.splice(0, stockHistory.length, ...(res.data?.data || []));
        } else if (tab === 'price') {
          const res = await boApi.get(BASE('price'), HDR('가격변경이력'));
          priceHistory.splice(0, priceHistory.length, ...(res.data?.data || []));
        } else if (tab === 'status') {
          const res = await boApi.get(BASE('status'), HDR('상태이력'));
          statusHistory.splice(0, statusHistory.length, ...(res.data?.data || []));
        } else if (tab === 'changes') {
          const res = await boApi.get(BASE('changes'), HDR('정보변경이력'));
          changeHistory.splice(0, changeHistory.length, ...(res.data?.data || []));
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
      if (uiState.tabMode2 !== 'tab') {
        ALL_TABS.forEach(t => t !== uiState.botTab && handleLoadTab(t));
      }
    });

    watch(() => props.prodId, () => {
      uiState.loadedTabs = new Set();
      qnaList.splice(0);
      reviewList.splice(0);
      relatedOrders.splice(0);
      stockHistory.splice(0);
      priceHistory.splice(0);
      statusHistory.splice(0);
      changeHistory.splice(0);
      handleLoadTab(uiState.botTab);
      if (uiState.tabMode2 !== 'tab') {
        ALL_TABS.forEach(t => t !== uiState.botTab && handleLoadTab(t));
      }
    });

    watch(() => uiState.tabMode2, (v) => {
      if (v !== 'tab') ALL_TABS.forEach(t => handleLoadTab(t));
    });

    return {
      uiState, botTab, tabMode2,
      qnaList, reviewList,
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
      <button class="tab-btn" :class="{active:botTab==='qna'}"     :disabled="tabMode2!=='tab'" @click="botTab='qna'">💬 상품 Q&amp;A <span class="tab-count">{{ qnaList.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='review'}"  :disabled="tabMode2!=='tab'" @click="botTab='review'">⭐ 리뷰 <span class="tab-count">{{ reviewList.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='orders'}"  :disabled="tabMode2!=='tab'" @click="botTab='orders'">🛒 연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='stock'}"   :disabled="tabMode2!=='tab'" @click="botTab='stock'">📦 재고 이력 <span class="tab-count">{{ stockHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='price'}"   :disabled="tabMode2!=='tab'" @click="botTab='price'">💰 가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='status'}"  :disabled="tabMode2!=='tab'" @click="botTab='status'">🏷 상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span></button>
      <button class="tab-btn" :class="{active:botTab==='changes'}" :disabled="tabMode2!=='tab'" @click="botTab='changes'">📝 상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span></button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}"  @click="tabMode2='tab'"  title="탭으로 보기">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">

  <!-- -- 상품 Q&A ----------------------------------------------------------- -->
  <div class="card" v-show="showTab('qna')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💬 상품 Q&amp;A <span class="tab-count">{{ qnaList.length }}</span></div>
    <table class="bo-table" v-if="qnaList.length">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>질문</th><th>작성자</th><th>작성일</th><th>상태</th><th>답변여부</th>
      </tr></thead>
      <tbody>
        <tr v-for="(q, idx) in qnaList" :key="q.qnaId">
          <td style="text-align:center;">{{ idx + 1 }}</td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ q.qnaTitle || q.qnaContent }}</td>
          <td>{{ q.memberNm || q.memberId }}</td>
          <td>{{ fnFmtDate(q.regDate) }}</td>
          <td><span class="badge" :class="q.qnaStatusCd==='ACTIVE'?'badge-green':'badge-gray'">{{ q.qnaStatusCdNm || q.qnaStatusCd }}</span></td>
          <td><span class="badge" :class="q.answerYn==='Y'?'badge-blue':'badge-orange'">{{ q.answerYn==='Y' ? '답변완료' : '미답변' }}</span></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">Q&amp;A가 없습니다.</div>
  </div>

  <!-- -- 리뷰 --------------------------------------------------------------- -->
  <div class="card" v-show="showTab('review')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">⭐ 리뷰 <span class="tab-count">{{ reviewList.length }}</span></div>
    <table class="bo-table" v-if="reviewList.length">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>평점</th><th>내용</th><th>작성자</th><th>작성일</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="(r, idx) in reviewList" :key="r.reviewId">
          <td style="text-align:center;">{{ idx + 1 }}</td>
          <td style="white-space:nowrap;">
            <span style="color:#faad14;font-weight:700;">{{ r.rating }}</span>
            <span style="color:#faad14;font-size:11px;">★</span>
          </td>
          <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ r.reviewContent || r.reviewTitle }}</td>
          <td>{{ r.memberNm || r.memberId }}</td>
          <td>{{ fnFmtDate(r.reviewDate || r.regDate) }}</td>
          <td><span class="badge" :class="r.reviewStatusCd==='ACTIVE'?'badge-green':'badge-gray'">{{ r.reviewStatusCdNm || r.reviewStatusCd }}</span></td>
        </tr>
      </tbody>
    </table>
    <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">리뷰가 없습니다.</div>
  </div>

  <!-- -- 연관 주문 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('orders')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span></div>
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

  <!-- -- 재고 이력 ---------------------------------------------------------- -->
  <div class="card" v-show="showTab('stock')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 재고 이력 <span class="tab-count">{{ stockHistory.length }}</span></div>
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

  <!-- -- 가격변경이력 --------------------------------------------------------- -->
  <div class="card" v-show="showTab('price')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💰 가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span></div>
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

  <!-- -- 상품상태 이력 -------------------------------------------------------- -->
  <div class="card" v-show="showTab('status')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🏷 상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span></div>
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

  <!-- -- 상품정보 변경이력 ------------------------------------------------------ -->
  <div class="card" v-show="showTab('changes')" style="margin:0;">
    <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span></div>
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

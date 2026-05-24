/* ShopJoy Admin - 상품 이력 (Q&A / 리뷰 / 연관주문 / 재고이력 / 가격변경이력 / 상품상태이력 / 상품정보변경이력) */
window._ecProdHistState = window._ecProdHistState || { tab: 'qna', tabMode: 'tab' };
window.PdProdHist = {
  name: 'PdProdHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    prodId:       { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { computed, onMounted, reactive, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({
      loading: false,
      isPageCodeLoad: false,
      botTab: window._ecProdHistState.tab || 'orders',
      tabMode2: window._ecProdHistState.tabMode || 'tab',
      loadedTabs: new Set()
    });
    const botTab   = Vue.toRef(uiState, 'botTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    watch(botTab, v => {
      window._ecProdHistState.tab = v;
      handleLoadTab(v);
    });

    watch(() => uiState.tabMode2, v => { window._ecProdHistState.tabMode = v; });

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => { uiState.isPageCodeLoad = true; };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 상품 showTab */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    const qnaList       = reactive([]);
    const reviewList    = reactive([]);
    const relatedOrders = reactive([]);
    const stockHistory  = reactive([]);
    const priceHistory  = reactive([]);
    const statusHistory = reactive([]);
    const changeHistory = reactive([]);

    /* BASE — 기본 */
    const BASE = (tab) => `/bo/ec/pd/prod/${props.prodId}/hist/${tab}`;

    /* HDR — 헤더 */
    const HDR  = (cmd) => coUtil.cofApiHdr('상품관리', cmd);

    /* fnPickPageList — 유틸 */
    const fnPickPageList = (res) => {
      const d = res?.data?.data;
      return d?.pageList || d?.list || (Array.isArray(d) ? d : []);
    };

    const ALL_TABS = ['qna', 'review', 'orders', 'stock', 'price', 'status', 'changes'];

    /* handleLoadTab — 처리 */
    const handleLoadTab = async (tab) => {
      if (!props.prodId || uiState.loadedTabs.has(tab)) { return; }
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

    /* fnFmtDate — 유틸 */
    const fnFmtDate = (v) => v ? String(v).slice(0, 16).replace('T', ' ') : '-';

    /* fnStockBadge — 유틸 */
    const fnStockBadge = (cd) => {
      if (!cd) { return 'badge-gray'; }
      const s = String(cd).toUpperCase();
      if (s.includes('IN') || s.includes('입고') || s.includes('ADD')) { return 'badge-green'; }
      if (s.includes('OUT') || s.includes('출고') || s.includes('SALE')) { return 'badge-orange'; }
      return 'badge-gray';
    };

    /* fnNoCursor — 유틸 */
    const fnNoCursor = () => '';

    /* bo-grid 컬럼 정의 (특수 셀은 #cell- 슬롯) */
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const qnaGridColumns = [
      { key: 'qnaTitle',     label: '질문',   style: 'max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        cellStyle: 'max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        fmt: (v, row) => (row.qnaTitle || row.qnaContent) },
      { key: 'memberNm',     label: '작성자', fmt: (v, row) => (row.memberNm || row.memberId) },
      { key: 'regDate',      label: '작성일', fmt: (v, row) => fnFmtDate(row.regDate) },
      { key: 'qnaStatusCd',  label: '상태', badge: (row) => (row.qnaStatusCd === 'ACTIVE' ? 'badge-green' : 'badge-gray'),
        fmt: (v, row) => (row.qnaStatusCdNm || row.qnaStatusCd) },
      { key: 'answerYn',     label: '답변여부', badge: (row) => (row.answerYn === 'Y' ? 'badge-blue' : 'badge-orange'),
        fmt: (v, row) => (row.answerYn === 'Y' ? '답변완료' : '미답변') },
    ];
    const reviewGridColumns = [
      { key: 'rating',           label: '평점',  style: 'white-space:nowrap;',
        cellInnerStyle: 'color:#faad14;font-weight:700;',
        fmt: (v) => `${v} ★` },
      { key: 'reviewContent',    label: '내용',  style: 'max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        cellStyle: 'max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        fmt: (v, row) => (row.reviewContent || row.reviewTitle) },
      { key: 'memberNm',         label: '작성자', fmt: (v, row) => (row.memberNm || row.memberId) },
      { key: 'reviewDate',       label: '작성일', fmt: (v, row) => fnFmtDate(row.reviewDate || row.regDate) },
      { key: 'reviewStatusCd',   label: '상태', badge: (row) => (row.reviewStatusCd === 'ACTIVE' ? 'badge-green' : 'badge-gray'),
        fmt: (v, row) => (row.reviewStatusCdNm || row.reviewStatusCd) },
    ];
    const orderGridColumns = [
      { key: 'orderId',        label: '주문ID', refLink: 'order' },
      { key: 'memberNm',       label: '회원', refLink: 'member', refKey: 'memberId',
        fmt: (v, row) => (row.memberNm || row.memberId) },
      { key: 'orderDate',      label: '주문일', fmt: (v) => fnFmtDate(v) },
      { key: 'totalAmt',       label: '금액',   fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'orderQty',       label: '수량' },
      { key: 'orderStatusCd',  label: '상태', badge: () => 'badge-blue',
        fmt: (v, row) => (row.orderStatusCdNm || row.orderStatusCd) },
    ];
    const stockGridColumns = [
      { key: 'histDate',     label: '일시',        fmt: (v) => fnFmtDate(v) },
      { key: 'stockTypeCd',  label: '유형', badge: (row) => fnStockBadge(row.stockTypeCd),
        fmt: (v, row) => (row.stockTypeCdNm || row.stockTypeCd) },
      { key: 'stockQty',     label: '수량',
        cellStyle: (v) => ((v || 0) > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600'),
        fmt: (v) => (((v || 0) > 0 ? '+' : '') + v) },
      { key: 'stockBalance', label: '처리 후 재고', fmt: (v) => (v == null ? '' : v + '개') },
      { key: 'regByNm',      label: '처리자', fmt: (v, row) => (row.regByNm || row.regBy) },
      { key: 'stockMemo',    label: '메모' },
    ];
    const priceGridColumns = [
      { key: 'histDate',    label: '일시',          fmt: (v) => fnFmtDate(v) },
      { key: 'priceField',  label: '항목(변경사유)', cellInnerClass: 'tag' },
      { key: 'priceBefore', label: '변경 전', style: 'color:#888;' },
      { key: 'priceAfter',  label: '변경 후', style: 'font-weight:600;color:#e8587a;' },
      { key: 'regByNm',     label: '처리자', fmt: (v, row) => (row.regByNm || row.regBy) },
    ];
    const statusGridColumns = [
      { key: 'histDate',      label: '일시',     fmt: (v) => fnFmtDate(v) },
      { key: 'statusCdBefore', label: '변경 전', badge: () => 'badge-gray',
        fmt: (v, row) => (row.statusCdBeforeNm || row.statusCdBefore || '-') },
      { key: 'statusCdAfter',  label: '변경 후', badge: () => 'badge-blue',
        fmt: (v, row) => (row.statusCdAfterNm || row.statusCdAfter) },
      { key: 'regByNm',       label: '처리자', fmt: (v, row) => (row.regByNm || row.regBy) },
    ];
    const changeGridColumns = [
      { key: 'histDate',     label: '일시',     fmt: (v) => fnFmtDate(v) },
      { key: 'changeField',  label: '항목', cellInnerClass: 'tag' },
      { key: 'changeBefore', label: '변경 전', style: 'color:#888;' },
      { key: 'changeAfter',  label: '변경 후', style: 'font-weight:500;' },
      { key: 'regByNm',      label: '처리자', fmt: (v, row) => (row.regByNm || row.regBy) },
    ];

    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
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
      if (v !== 'tab') { ALL_TABS.forEach(t => handleLoadTab(t)); }
    });


    // ===== return (템플릿 노출) ===============================================

    return {
      uiState, botTab, tabMode2,
      qnaList, reviewList,
      relatedOrders, stockHistory, priceHistory, statusHistory, changeHistory,
      showTab, fnFmtDate, fnStockBadge, showRefModal,
      fnNoCursor, qnaGridColumns, reviewGridColumns, orderGridColumns, stockGridColumns, priceGridColumns, statusGridColumns, changeGridColumns
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 이력 화면 =================================================== -->
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;">
    <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
    이력정보
    <span v-if="uiState.loading" style="margin-left:8px;font-size:11px;color:#aaa;">조회 중...</span>
  </div>
  <!-- ===== □. 이력 화면 =================================================== -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:botTab==='qna'}"     :disabled="tabMode2!=='tab'" @click="botTab='qna'">
        💬 상품 Q&amp;A
        <span class="tab-count">{{ qnaList.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='review'}"  :disabled="tabMode2!=='tab'" @click="botTab='review'">
        ⭐ 리뷰
        <span class="tab-count">{{ reviewList.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='orders'}"  :disabled="tabMode2!=='tab'" @click="botTab='orders'">
        🛒 연관 주문
        <span class="tab-count">{{ relatedOrders.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='stock'}"   :disabled="tabMode2!=='tab'" @click="botTab='stock'">
        📦 재고 이력
        <span class="tab-count">{{ stockHistory.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='price'}"   :disabled="tabMode2!=='tab'" @click="botTab='price'">
        💰 가격변경이력
        <span class="tab-count">{{ priceHistory.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='status'}"  :disabled="tabMode2!=='tab'" @click="botTab='status'">
        🏷 상품상태 이력
        <span class="tab-count">{{ statusHistory.length }}</span>
      </button>
      <button class="tab-btn" :class="{active:botTab==='changes'}" :disabled="tabMode2!=='tab'" @click="botTab='changes'">
        📝 상품정보 변경이력
        <span class="tab-count">{{ changeHistory.length }}</span>
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:tabMode2==='tab'}"  @click="tabMode2='tab'"  title="탭으로 보기">📑</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='1col'}" @click="tabMode2='1col'" title="1열로 보기">1▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='2col'}" @click="tabMode2='2col'" title="2열로 보기">2▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='3col'}" @click="tabMode2='3col'" title="3열로 보기">3▭</button>
      <button class="tab-mode-btn" :class="{active:tabMode2==='4col'}" @click="tabMode2='4col'" title="4열로 보기">4▭</button>
    </div>
  </div>
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 상품 Q&A ================================================ -->
    <div class="card" v-show="showTab('qna')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💬 상품 Q&amp;A <span class="tab-count">{{ qnaList.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="qnaGridColumns" :rows="qnaList" row-key="qnaId" :row-style="fnNoCursor" empty-text="Q&amp;A가 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 상품 Q&A ================================================ -->
    <!-- ===== ■.■. 리뷰 ==================================================== -->
    <div class="card" v-show="showTab('review')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">⭐ 리뷰 <span class="tab-count">{{ reviewList.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="reviewGridColumns" :rows="reviewList" row-key="reviewId" :row-style="fnNoCursor" empty-text="리뷰가 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 리뷰 ==================================================== -->
    <!-- ===== ■.■. 연관 주문 ================================================= -->
    <div class="card" v-show="showTab('orders')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🛒 연관 주문 <span class="tab-count">{{ relatedOrders.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="orderGridColumns" :rows="relatedOrders" row-key="orderId" :row-style="fnNoCursor" empty-text="연관 주문이 없습니다." @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-sm" @click="navigate('odOrderDtl',{id:row.orderId})">상세</button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 연관 주문 ================================================= -->
    <!-- ===== ■.■. 재고 이력 ================================================= -->
    <div class="card" v-show="showTab('stock')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📦 재고 이력 <span class="tab-count">{{ stockHistory.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="stockGridColumns" :rows="stockHistory" row-key="histId" :row-style="fnNoCursor" empty-text="재고 이력이 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 재고 이력 ================================================= -->
    <!-- ===== ■.■. 가격변경이력 ================================================ -->
    <div class="card" v-show="showTab('price')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">💰 가격변경이력 <span class="tab-count">{{ priceHistory.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="priceGridColumns" :rows="priceHistory" row-key="histId" :row-style="fnNoCursor" empty-text="가격 변경 이력이 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 가격변경이력 ================================================ -->
    <!-- ===== ■.■. 상품상태 이력 =============================================== -->
    <div class="card" v-show="showTab('status')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">🏷 상품상태 이력 <span class="tab-count">{{ statusHistory.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="statusGridColumns" :rows="statusHistory" row-key="histId" :row-style="fnNoCursor" empty-text="상태 변경 이력이 없습니다."></bo-grid>
    </div>
    <!-- ===== □.□. 상품상태 이력 =============================================== -->
    <!-- ===== ■.■. 상품정보 변경이력 ============================================= -->
    <div class="card" v-show="showTab('changes')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">📝 상품정보 변경이력 <span class="tab-count">{{ changeHistory.length }}</span></div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="changeGridColumns" :rows="changeHistory" row-key="histId" :row-style="fnNoCursor" empty-text="변경 이력이 없습니다."></bo-grid>
    </div>
  </div>
</div>

    <!-- ===== □.□. 상품정보 변경이력 ============================================= -->
  <!-- ===== □. 탭 컨텐츠 =================================================== -->`,
};

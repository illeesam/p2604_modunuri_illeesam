/* ShopJoy Admin - 주문 이력 (구성상품 / 배송이력 / 연관클레임) */
window._ecOrderHistState = window._ecOrderHistState || { tab: 'products', tabMode: 'tab' };
window.OdOrderHist = {
  name: 'OdOrderHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    orderId:      { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const orders = reactive([]);                                                // 주문 목록
    const claims = reactive([]);                                                // 클레임 목록
    const deliveries = reactive([]);                                            // 배송 목록
    const orderItems = reactive([]);                                            // 주문 항목 목록
    const uiState = reactive({ loading: false, isPageCodeLoad: false, botTab: window._ecOrderHistState.tab || 'products', tabMode2: 'tab' });
    const botTab = Vue.toRef(uiState, 'botTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderHist.js : handleBtnAction -> ', cmd, param);
      // 탭 전환
      if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.botTab = param; }
        return;
      // 주문 참조 모달 열기
      } else if (cmd === 'histList-orderRef') {
        return showRefModal('order', props.orderId);
      // 배송 상세로 이동
      } else if (cmd === 'histList-dlivEdit') {
        return props.navigate('odDlivDtl', { id: param });
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderHist.js : handleSelectAction -> ', cmd, param);
      // 클레임 그리드 행 참조 클릭
      if (cmd === 'histList-rowRefClick') {
        return showRefModal(param.type, param.id);
      // 클레임 그리드 행 상세로 이동
      } else if (cmd === 'histList-rowClaimEdit') {
        return props.navigate('odClaimDtl', { id: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchData — 처리 */
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

    watch(botTab, v => { window._ecOrderHistState.tab = v; });

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
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

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive). 카운트는 getter 로 반응형 유지 */
    const tabs = reactive([
      { id: 'products', label: '구성 상품',   icon: '📦', get count() { return orderItems.length; } },
      { id: 'dliv',     label: '배송 이력',   icon: '🚚', get count() { return cfRelatedDliv.value ? 1 : 0; } },
      { id: 'claims',   label: '연관 클레임', icon: '↩',  get count() { return cfRelatedClaims.value.length; } },
    ]);
    const cfDlivHistory   = computed(() => {
      if (!cfRelatedDliv.value) { return []; }
      const o = window.safeArrayUtils.safeFind(orders, x => x.orderId === props.orderId);
      return [
        { date: o && o.orderDate ? o.orderDate.slice(0, 10) : '-', status: '상품준비중', location: '물류센터', memo: '상품 포장 완료' },
        { date: cfRelatedDliv.value.dlivShipDate || '-', status: '배송중', location: cfRelatedDliv.value.outboundCourierCd || '-', memo: '출고 완료' },
      ].filter(h => h.date !== '-');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
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
    // 배송 이력 그리드
    const dlivHistGridColumns = [
      { key: 'date',     label: '일시',  style: 'width:120px;' },
      { key: 'status',   label: '상태',  style: 'width:90px;', badge: () => 'badge-blue' },
      { key: 'location', label: '위치' },
      { key: 'memo',     label: '메모' },
    ];
    // 클레임 그리드
    const claimGridColumns = [
      { key: 'claimId',       label: '클레임ID', style: 'width:120px;', refLink: 'claim' },
      { key: 'memberNm',      label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'claimTypeCd',   label: '유형',   fmt: (v, r) => r.claimTypeCdNm || r.claimTypeCd },
      { key: 'claimStatusCd', label: '상태',   fmt: (v, r) => r.claimStatusCdNm || r.claimStatusCd },
      { key: 'reasonCd',      label: '사유' },
      { key: 'requestDate',   label: '신청일', style: 'width:100px;', fmt: v => (v||'').slice(0,10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, orderItems, botTab, tabMode2,                                                              // 상태 / 데이터
      itemGridColumns, dlivHistGridColumns, claimGridColumns,                                             // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfRelatedDliv, cfRelatedClaims, cfDlivHistory, tabs,                                                // computed / reactive(tabs)
      showTab,                                                                                            // 헬퍼
      orderId: props.orderId,                                                                             // template 직접 참조
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 이력 화면 =================================================== -->
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;">
    <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
      ●
    </span>
    이력정보
  </div>
  <!-- ===== □. 이력 화면 =================================================== -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <bo-tab-bar :tabs="tabs" :tab="botTab" :tab-mode="tabMode2" :show-modes="false"
    @tab-select="id => handleBtnAction('tab-change', id)" />
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="tabMode2!=='tab' ? 'dtl-tab-grid cols-'+tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 구성 상품 ================================================= -->
    <div class="card" v-show="showTab('products')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        📦 구성 상품
        <span class="tab-count">
          {{ orderItems.length }}
        </span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="itemGridColumns" :rows="orderItems" row-key="no"
        empty-text="구성 상품 정보가 없습니다." row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-secondary btn-xs" @click="handleBtnAction('histList-orderRef')">
            보기
          </button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 구성 상품 ================================================= -->
    <!-- ===== ■.■. 배송 이력 ================================================= -->
    <div class="card" v-show="showTab('dliv')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🚚 배송 이력
        <span class="tab-count">
          {{ cfRelatedDliv ? 1 : 0 }}
        </span>
      </div>
      <template v-if="cfRelatedDliv">
        <div style="margin-bottom:14px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;">
            <span style="color:#888;">
              수령인
            </span>
            <b>
              {{ cfRelatedDliv.recvNm }}
            </b>
            &nbsp;·&nbsp;
            <span style="color:#888;">
              택배사
            </span>
            <b>
              {{ cfRelatedDliv.outboundCourierCdNm || cfRelatedDliv.outboundCourierCd }}
            </b>
            &nbsp;·&nbsp;
            <span style="color:#888;">
              운송장
            </span>
            <b>
              {{ cfRelatedDliv.outboundTrackingNo || '-' }}
            </b>
          </div>
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('histList-dlivEdit', cfRelatedDliv.dlivId)">
            배송 수정
          </button>
        </div>
        <!-- ===== ■.■.■.■. 목록 영역 ============================================= -->
        <bo-grid bare :columns="dlivHistGridColumns" :rows="cfDlivHistory"
          empty-text="배송 이력이 없습니다.">
        </bo-grid>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        배송 정보가 없습니다.
      </div>
    </div>
    <!-- ===== □.□. 배송 이력 ================================================= -->
    <!-- ===== ■.■. 연관 클레임 ================================================ -->
    <div class="card" v-show="showTab('claims')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        ↩ 연관 클레임
        <span class="tab-count">
          {{ cfRelatedClaims.length }}
        </span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="claimGridColumns" :rows="cfRelatedClaims" row-key="claimId"
        empty-text="연관 클레임이 없습니다." @ref-click="({type,id}) => handleSelectAction('histList-rowRefClick', {type, id})" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('histList-rowClaimEdit', row.claimId)">
            상세
          </button>
        </template>
      </bo-grid>
    </div>
  </div>
</div>
<!-- ===== □.□. 연관 클레임 ================================================ -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`,
};

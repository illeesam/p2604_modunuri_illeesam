/* ShopJoy Admin - 회원 이력 (연관주문 / 연관클레임) */
window._ecMemberHistState = window._ecMemberHistState || { tab: 'orders', tabMode: 'tab' };
window.MbMemberHist = {
  name: 'MbMemberHist',
  props: {
    navigate:  { type: Function, default: () => {} }, // 페이지 이동
    memberId:  { type: String, default: null },       // 대상 회원 ID
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { computed, reactive, watch, onMounted } = Vue;
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const uiState = reactive({                     // UI 상태 (탭/뷰모드 영속화)
      loading: false, isPageCodeLoad: false,
      tab: window._ecMemberHistState.tab || 'orders',
      tabMode2: window._ecMemberHistState.tabMode || 'tab',
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemberHist.js : handleBtnAction -> ', cmd, param);
      // 본 화면은 단순 탭/뷰모드 전환만 있어 별도 버튼 액션 없음
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/탭/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemberHist.js : handleSelectAction -> ', cmd, param);
      // 탭 전환
      if (cmd === 'tab-select') {
        uiState.tab = param;
        return;
      // 뷰모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode2 = param;
        return;
      // 연관 주문 행 상세 이동
      } else if (cmd === 'orders-row-view') {
        return props.navigate('odOrderDtl', { id: param });
      // 연관 클레임 행 상세 이동
      } else if (cmd === 'claims-row-view') {
        return props.navigate('odClaimDtl', { id: param });
      // ref-link 클릭 (주문/클레임)
      } else if (cmd === 'row-ref') {
        return showRefModal(param.type, param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* watch — memberId 변경 (computed 자동 갱신 - 별도 로드 불필요) */
    watch(() => props.memberId, () => {
      // 회원ID 변경시 자동으로 computed 값 갱신 (별도 로드 불필요 - 목업 데이터)
    });

    /* watch — 탭/뷰모드 변경 시 window 영속화 */
    watch(() => uiState.tab, v => { window._ecMemberHistState.tab = v; });
    watch(() => uiState.tabMode2, v => { window._ecMemberHistState.tabMode = v; });

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    /* showTab — 탭 표시 여부 */
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

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState,                                                                         // 상태 / 데이터
      orderGridColumns, claimGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfMemberOrders, cfMemberClaims,                                                  // computed
      showTab,                                                                         // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 이력 타이틀 ================================================== -->
  <div style="font-size:13px;font-weight:700;color:#555;padding:0 0 12px;">
    <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
      ●
    </span>
    이력정보
  </div>
  <!-- ===== □. 이력 타이틀 ================================================== -->
  <!-- ===== ■. 탭 영역 ==================================================== -->
  <div class="tab-bar-row">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:uiState.tab==='orders'}" :disabled="uiState.tabMode2!=='tab'" @click="handleSelectAction('tab-select', 'orders')">
        🛒 연관 주문
        <span class="tab-count">
          {{ cfMemberOrders.length }}
        </span>
      </button>
      <button class="tab-btn" :class="{active:uiState.tab==='claims'}" :disabled="uiState.tabMode2!=='tab'" @click="handleSelectAction('tab-select', 'claims')">
        ↩ 연관 클레임
        <span class="tab-count">
          {{ cfMemberClaims.length }}
        </span>
      </button>
    </div>
    <div class="tab-modes">
      <button class="tab-mode-btn" :class="{active:uiState.tabMode2==='tab'}" @click="handleSelectAction('tab-mode', 'tab')" title="탭으로 보기">
        📑
      </button>
      <button class="tab-mode-btn" :class="{active:uiState.tabMode2==='1col'}" @click="handleSelectAction('tab-mode', '1col')" title="1열로 보기">
        1▭
      </button>
      <button class="tab-mode-btn" :class="{active:uiState.tabMode2==='2col'}" @click="handleSelectAction('tab-mode', '2col')" title="2열로 보기">
        2▭
      </button>
      <button class="tab-mode-btn" :class="{active:uiState.tabMode2==='3col'}" @click="handleSelectAction('tab-mode', '3col')" title="3열로 보기">
        3▭
      </button>
      <button class="tab-mode-btn" :class="{active:uiState.tabMode2==='4col'}" @click="handleSelectAction('tab-mode', '4col')" title="4열로 보기">
        4▭
      </button>
    </div>
  </div>
  <!-- ===== □. 탭 영역 ==================================================== -->
  <!-- ===== ■. 탭 컨텐츠 =================================================== -->
  <div :class="uiState.tabMode2!=='tab' ? 'dtl-tab-grid cols-'+uiState.tabMode2.charAt(0) : ''">
    <!-- ===== ■.■. 연관 주문 ================================================= -->
    <div class="card" v-show="showTab('orders')" style="margin:0;">
      <div v-if="uiState.tabMode2!=='tab'" class="dtl-tab-card-title">
        🛒 연관 주문
        <span class="tab-count">
          {{ cfMemberOrders.length }}
        </span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="orderGridColumns" :rows="cfMemberOrders" row-key="orderId" empty-text="주문 내역이 없습니다." @ref-click="ref => handleSelectAction('row-ref', ref)" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('orders-row-view', row.orderId)">
            상세
          </button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.■. 연관 주문 ================================================= -->
    <!-- ===== ■.■. 연관 클레임 ================================================ -->
    <div class="card" v-show="showTab('claims')" style="margin:0;">
      <div v-if="uiState.tabMode2!=='tab'" class="dtl-tab-card-title">
        ↩ 연관 클레임
        <span class="tab-count">
          {{ cfMemberClaims.length }}
        </span>
      </div>
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare :columns="claimGridColumns" :rows="cfMemberClaims" row-key="claimId" empty-text="클레임 내역이 없습니다." @ref-click="ref => handleSelectAction('row-ref', ref)" row-actions>
        <template #row-actions="{ row }">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('claims-row-view', row.claimId)">
            상세
          </button>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.■. 연관 클레임 ================================================ -->
  </div>
  <!-- ===== □. 탭 컨텐츠 =================================================== -->
</div>
`,
};

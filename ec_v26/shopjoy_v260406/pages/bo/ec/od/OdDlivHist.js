/* ShopJoy Admin - 배송 이력 (연관주문 / 연관클레임) */
window._ecDlivHistState = window._ecDlivHistState || { tab: 'order', tabMode: 'tab' };
window.OdDlivHist = {
  name: 'OdDlivHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    orderId:      { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, computed, reactive, watch, onMounted } = Vue;
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const deliveries = reactive([]);                                            // 배송 목록
    const claims = reactive([]);                                                // 클레임 목록 (보조 데이터)
    const orders = reactive([]);                                                // 주문 목록 (보조 데이터)
    const uiState = reactive({ loading: false, isPageCodeLoad: false, botTab: window._ecDlivHistState.tab || 'order', tabMode2: 'tab' });
    const botTab = Vue.toRef(uiState, 'botTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivHist.js : handleBtnAction -> ', cmd, param);
      // 탭 전환
      if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.botTab = param; }
        return;
      // 회원 참조 모달 열기
      } else if (cmd === 'histList-memberRef') {
        return showRefModal('member', param);
      // 주문 상세로 이동
      } else if (cmd === 'histList-orderEdit') {
        return props.navigate('odOrderDtl', { id: param });
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivHist.js : handleSelectAction -> ', cmd, param);
      // 그리드 행 참조 클릭
      if (cmd === 'histList-rowRefClick') {
        return showRefModal(param.type, param.id);
      // 클레임 그리드 행 상세로 이동
      } else if (cmd === 'histList-rowClaimEdit') {
        return props.navigate('odClaimDtl', { id: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchList — 목록 조회 */
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

    watch(botTab, v => { window._ecDlivHistState.tab = v; });
    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    const cfRelatedOrder  = computed(() => window.safeArrayUtils.safeFind(orders, o => o.orderId === props.orderId) || null);
    const cfRelatedClaims = computed(() => window.safeArrayUtils.safeFilter(claims, c => c.orderId === props.orderId));

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive). 카운트는 getter 로 반응형 유지 */
    const tabs = reactive([
      { id: 'order',  label: '연관 주문',   icon: '🛒', get count() { return cfRelatedOrder.value ? 1 : 0; } },
      { id: 'claims', label: '연관 클레임', icon: '↩',  get count() { return cfRelatedClaims.value.length; } },
    ]);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* BoGrid(bare) 컬럼 — 연관 클레임 */
    const claimGridColumns = [
      { key: 'claimId',     label: '클레임ID', style: 'width:120px;', refLink: 'claim' },
      { key: 'type',        label: '유형',   style: 'width:70px;' },
      { key: 'statusCd',    label: '상태',   style: 'width:90px;' },
      { key: 'reasonCd',    label: '사유' },
      { key: 'requestDate', label: '신청일', style: 'width:100px;', fmt: v => (v||'').slice(0,10) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, botTab, tabMode2,                                                                                          // 상태 / 데이터
      claimGridColumns,                                                                                                   // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfRelatedOrder, cfRelatedClaims, tabs,                                                                              // computed / reactive(tabs)
      showTab,                                                                                                            // 헬퍼
      showRefModal,                                                                                                       // 모달 (template 직접 참조)
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
    <!-- ===== ■.■. 연관 주문 ================================================= -->
    <div class="card" v-show="showTab('order')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🛒 연관 주문
        <span class="tab-count">
          {{ cfRelatedOrder ? 1 : 0 }}
        </span>
      </div>
      <template v-if="cfRelatedOrder">
        <div class="detail-row">
          <span class="detail-label">
            주문ID
          </span>
          <span class="detail-value">
            {{ cfRelatedOrder.orderId }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">
            회원
          </span>
          <span class="detail-value">
            <span class="ref-link" @click="handleBtnAction('histList-memberRef', cfRelatedOrder.userId)">
              {{ cfRelatedOrder.userNm }}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">
            상품
          </span>
          <span class="detail-value">
            {{ cfRelatedOrder.prodNm }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">
            금액
          </span>
          <span class="detail-value">
            {{ (cfRelatedOrder.totalPrice||0).toLocaleString() }}원
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">
            상태
          </span>
          <span class="detail-value">
            {{ cfRelatedOrder.statusCd }}
          </span>
        </div>
        <div style="margin-top:14px;">
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('histList-orderEdit', cfRelatedOrder.orderId)">
            주문 상세 수정
          </button>
        </div>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        연관 주문 정보가 없습니다.
      </div>
    </div>
    <!-- ===== □.□. 연관 주문 ================================================= -->
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
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('histList-rowClaimEdit', row.claimId)">
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

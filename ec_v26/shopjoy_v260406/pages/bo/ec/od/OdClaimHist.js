/* ShopJoy Admin - 클레임 이력 (클레임항목 / 처리정보 / 연관주문) */
window._odClaimHistState = window._odClaimHistState || { tab: 'items', tabMode: 'tab' };
window.OdClaimHist = {
  name: 'OdClaimHist',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    claimId:      { type: String, default: null }, // 대상 ID
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const uiState = reactive({ isPageCodeLoad: false, botTab: window._odClaimHistState.tab || 'items', tabMode2: 'tab', claimType: '취소', claimStatus: '', relatedOrder: null, relatedDliv: null });
    const botTab = Vue.toRef(uiState, 'botTab');
    const tabMode2 = Vue.toRef(uiState, 'tabMode2');
    const relatedOrder = Vue.toRef(uiState, 'relatedOrder');
    const relatedDliv  = Vue.toRef(uiState, 'relatedDliv');

    const codes = reactive({ refund_methods: [] });

    /* 클레임 항목 */
    const claimItems = reactive([]);                                            // 클레임 항목 목록
    let itemIdSeq = 1;

    /* 처리 정보 로컬 폼 */
    const processForm = reactive({ refundAmount: 0, refundMethodCd: '계좌환불', memo: '' });

    /* tabs — 탭 정의 (BoTabBar 데이터, reactive). 카운트는 getter 로 반응형 유지 */
    const tabs = reactive([
      { id: 'items',   label: '클레임 항목', icon: '↩',  get count() { return claimItems.length; } },
      { id: 'process', label: '처리 정보',   icon: '⚙' },
      { id: 'order',   label: '연관 주문',   icon: '🛒', get count() { return relatedOrder.value ? 1 : 0; } },
    ]);

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimHist.js : handleBtnAction -> ', cmd, param);
      // 탭 전환
      if (cmd === 'tab-change') {
        if (uiState.tabMode2 === 'tab') { uiState.botTab = param; }
        return;
      // 클레임 항목 추가
      } else if (cmd === 'claimItems-add') {
        return addClaimItem();
      // 처리정보 저장
      } else if (cmd === 'processForm-save') {
        return handleSaveProcess();
      // 주문 참조 모달 열기
      } else if (cmd === 'histList-orderRef') {
        return showRefModal('order', param);
      // 회원 참조 모달 열기
      } else if (cmd === 'histList-memberRef') {
        return showRefModal('member', param);
      // 주문 상세로 이동
      } else if (cmd === 'histList-orderEdit') {
        return props.navigate('odOrderDtl', { id: param });
      // 배송 상세로 이동
      } else if (cmd === 'histList-dlivEdit') {
        return props.navigate('odDlivDtl', { id: param });
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimHist.js : handleSelectAction -> ', cmd, param);
      // 클레임 항목 삭제
      if (cmd === 'claimItems-rowRemove') {
        return removeClaimItem(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.refund_methods = codeStore.sgGetGrpCodes('REFUND_METHOD_KR');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    watch(botTab, v => { window._odClaimHistState.tab = v; });
    const cfCodes = computed(() => window.sfGetBoCodeStore()?.svCodes || []);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* showTab — 표시 */
    const showTab = (id) => uiState.tabMode2 !== 'tab' || uiState.botTab === id;

    /* 클레임 유형별 단계 — parentCodeValues 기반 동적 파생 */
    const TYPE_CD = { '취소': 'CANCEL', '반품': 'RETURN', '교환': 'EXCHANGE' };
    const cfClaimSteps = computed(() => cfCodes.value
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd)
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + (TYPE_CD[uiState.claimType] || uiState.claimType) + '^'))
      .map(c => c.codeLabel)
      .filter(l => !['거부','철회'].includes(l)));
    const cfStatusOptions = computed(() => cfClaimSteps.value);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      // NOTE: getClaim/getOrder/deliveries 는 외부 reactive (보조 데이터 소스)가 미연결 상태로 남아있어 그대로 유지
    });

    /* addClaimItem — 추가 */
    const addClaimItem = () => {
      claimItems.push({
        _id: itemIdSeq++,
        bfProdNm: '', bfOptionNm: '', bfQty: 1, bfPrice: 0, bfStatus: '결제완료',
        chgProdNm: '', chgOptionNm: '',
        afStatus: uiState.claimStatus, afMemo: '', afAdmin: '', afDate: '',
      });
    };

    /* removeClaimItem — 제거 */
    const removeClaimItem = (id) => {
      const idx = claimItems.findIndex(r => r._id === id);
      if (idx !== -1) { claimItems.splice(idx, 1); }
    };

    /* handleSaveProcess — 처리 저장 */
    const handleSaveProcess = () => {
      showToast('저장되었습니다.');
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 처리 폼
    const columns = {};
    columns.processForm = [
      { key: 'refundAmount',   label: '환불금액', type: 'number' },
      { key: 'refundMethodCd', label: '환불방법', type: 'select', options: () => codes.refund_methods },
      { type: 'rowBreak' },
      { key: 'memo',           label: '처리 메모', type: 'textarea', rows: 4, colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      claimItems, processForm, codes, botTab, tabMode2, relatedOrder, relatedDliv, tabs,                   // 상태 / 데이터 / reactive(tabs)
      handleBtnAction, handleSelectAction,                                                                 // dispatch (모든 이벤트 / 액션 라우팅)
      cfStatusOptions,                                                                                     // computed
      showTab,                                                                                             // 헬퍼
      showRefModal,                                                                                        // 모달 (template 직접 참조)
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
    <!-- ===== ■.■. 클레임 항목 ================================================ -->
    <div class="card" v-show="showTab('items')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        ↩ 클레임 항목
        <span class="tab-count">
          {{ claimItems.length }}
        </span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button class="btn btn-sm btn-secondary" @click="handleBtnAction('claimItems-add')">
          + 항목 추가
        </button>
      </div>
      <div v-if="claimItems.length" style="overflow-x:auto;">
        <!-- ===== ■.■.■.■. 테이블 =============================================== -->
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:1000px;">
          <thead>
            <tr>
              <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px 10px;background:#f5f5f5;color:#888;text-align:center;vertical-align:middle;width:36px;">
                No
              </th>
              <th colspan="5" style="border:1px solid #e0e0e0;padding:7px 14px;background:#e6f4ff;color:#0958d9;font-weight:700;text-align:center;letter-spacing:0.5px;">
                현재
              </th>
              <th colspan="2" style="border:1px solid #e0e0e0;padding:7px 14px;background:#f6ffed;color:#389e0d;font-weight:700;text-align:center;letter-spacing:0.5px;">
                변경요청
              </th>
              <th colspan="4" style="border:1px solid #e0e0e0;padding:7px 14px;background:#fff0f6;color:#c41d7f;font-weight:700;text-align:center;letter-spacing:0.5px;">
                결과
              </th>
              <th rowspan="2" style="border:1px solid #e0e0e0;padding:7px;background:#f5f5f5;text-align:center;vertical-align:middle;width:50px;">
                삭제
              </th>
            </tr>
            <tr>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">
                상품명
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;">
                옵션
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:60px;">
                수량
              </th>
              <!-- ===== ■.■.■.■.■.■.■. 영역 ========================================== -->
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:90px;">
                금액
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f0f9ff;color:#1677ff;font-weight:600;white-space:nowrap;width:80px;">
                상태
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">
                상품명
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#f6ffed;color:#389e0d;font-weight:600;white-space:nowrap;">
                옵션
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:90px;">
                처리상태
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;">
                메모
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:80px;">
                처리자
              </th>
              <th style="border:1px solid #e0e0e0;padding:6px 10px;background:#fff0f6;color:#9e1068;font-weight:600;white-space:nowrap;width:130px;">
                처리일시
              </th>
            </tr>
          </thead>
          <!-- ===== ■.■.■.■.■. 테이블 본문 ========================================== -->
          <tbody>
            <tr v-for="(item, idx) in claimItems" :key="item?._id">
              <td style="border:1px solid #e0e0e0;padding:6px;text-align:center;color:#aaa;">
                {{ idx + 1 }}
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                <input class="form-control" v-model="item.bfProdNm" style="font-size:12px;background:transparent;border-color:#91caff;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                <input class="form-control" v-model="item.bfOptionNm" style="font-size:12px;background:transparent;border-color:#91caff;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                <input class="form-control" type="number" v-model.number="item.bfQty" style="font-size:12px;text-align:right;background:transparent;border-color:#91caff;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                <input class="form-control" type="number" v-model.number="item.bfPrice" style="font-size:12px;text-align:right;background:transparent;border-color:#91caff;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f8fbff;">
                <input class="form-control" v-model="item.bfStatus" style="font-size:12px;background:transparent;border-color:#91caff;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
                <input class="form-control" v-model="item.chgProdNm" placeholder="변경 후 상품명" style="font-size:12px;background:transparent;border-color:#95de64;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#f6ffed;">
                <input class="form-control" v-model="item.chgOptionNm" placeholder="변경 후 옵션" style="font-size:12px;background:transparent;border-color:#95de64;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
                <select class="form-control" v-model="item.afStatus" style="font-size:12px;background:transparent;border-color:#ffadd2;">
                  <option v-for="s in cfStatusOptions" :key="Math.random()">
                    {{ s }}
                  </option>
                </select>
              </td>
              <!-- ===== ■.■.■.■.■.■.■. 영역 ========================================== -->
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
                <input class="form-control" v-model="item.afMemo" style="font-size:12px;background:transparent;border-color:#ffadd2;" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
                <input class="form-control" v-model="item.afAdmin" style="font-size:12px;background:transparent;border-color:#ffadd2;" placeholder="처리자" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px 6px;background:#fff5fb;">
                <input class="form-control" v-model="item.afDate" style="font-size:12px;background:transparent;border-color:#ffadd2;" placeholder="2026-04-09 10:00" />
              </td>
              <td style="border:1px solid #e0e0e0;padding:4px;text-align:center;">
                <button class="btn btn-danger btn-sm" @click="handleSelectAction('claimItems-rowRemove', item._id)">
                  삭제
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        클레임 항목이 없습니다.
      </div>
    </div>
    <!-- ===== □.□. 클레임 항목 ================================================ -->
    <!-- ===== ■.■. 처리 정보 (BoFormArea 자동 렌더) ============================== -->
    <div class="card" v-show="showTab('process')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        ⚙ 처리 정보
      </div>
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.processForm" :form="processForm" :errors="{}"
        :cols="3" :show-actions="false" />
      <div class="form-actions">
        <button class="btn btn-primary" @click="handleBtnAction('processForm-save')">
          저장
        </button>
      </div>
    </div>
    <!-- ===== □.□. 처리 정보 (BoFormArea 자동 렌더) ============================== -->
    <!-- ===== ■.■. 연관 주문 ================================================= -->
    <div class="card" v-show="showTab('order')" style="margin:0;">
      <div v-if="tabMode2!=='tab'" class="dtl-tab-card-title">
        🛒 연관 주문
        <span class="tab-count">
          {{ relatedOrder ? 1 : 0 }}
        </span>
      </div>
      <template v-if="relatedOrder">
        <div style="margin-bottom:12px;padding:14px;background:#f9f9f9;border-radius:8px;border:1px solid #e8e8e8;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:14px;font-weight:700;margin-bottom:6px;">
                <span class="ref-link" @click="handleBtnAction('histList-orderRef', relatedOrder.orderId)">
                  {{ relatedOrder.orderId }}
                </span>
              </div>
              <div style="font-size:13px;color:#555;line-height:2;">
                <span style="color:#888;">
                  회원
                </span>
                <span class="ref-link" style="margin:0 6px;" @click="handleBtnAction('histList-memberRef', relatedOrder.userId)">
                  {{ relatedOrder.userNm }}
                </span>
                <span style="color:#888;">
                  주문일
                </span>
                <b style="margin-left:4px;">
                  {{ relatedOrder.orderDate }}
                </b>
                <br/>
                <span style="color:#888;">
                  상품
                </span>
                <b style="margin-left:4px;">
                  {{ relatedOrder.prodNm }}
                </b>
                <br/>
                <span style="color:#888;">
                  금액
                </span>
                <b style="margin-left:4px;color:#e8587a;">
                  {{ (relatedOrder.totalPrice||0).toLocaleString() }}원
                </b>
                &nbsp;·&nbsp;
                <span style="color:#888;">
                  결제
                </span>
                <b style="margin-left:4px;">
                  {{ relatedOrder.payMethodCd }}
                </b>
                <br/>
                <span style="color:#888;">
                  상태
                </span>
                <span class="badge badge-blue" style="margin-left:4px;">
                  {{ relatedOrder.statusCd }}
                </span>
              </div>
            </div>
            <button class="btn btn-blue btn-sm" @click="handleBtnAction('histList-orderEdit', relatedOrder.orderId)">
              주문 수정
            </button>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 조건부 영역 ============================================ -->
        <template v-if="relatedDliv">
          <div style="padding:12px 14px;background:#f0f7ff;border-radius:8px;border:1px solid #bae0ff;font-size:13px;">
            <div style="font-weight:600;color:#1677ff;margin-bottom:6px;">
              배송 정보
            </div>
            <div style="line-height:2;color:#444;">
              <span style="color:#888;">
                수령인
              </span>
              <b style="margin-left:4px;">
                {{ relatedDliv.receiver }}
              </b>
              &nbsp;·&nbsp;
              <span style="color:#888;">
                배송지
              </span>
              <b style="margin-left:4px;">
                {{ relatedDliv.address }}
              </b>
              <br/>
              <span style="color:#888;">
                택배사
              </span>
              <b style="margin-left:4px;">
                {{ relatedDliv.courierCd }}
              </b>
              &nbsp;·&nbsp;
              <span style="color:#888;">
                운송장
              </span>
              <b style="margin-left:4px;">
                {{ relatedDliv.trackingNo || '-' }}
              </b>
              &nbsp;·&nbsp;
              <span class="badge badge-green">
                {{ relatedDliv.statusCd }}
              </span>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px;" @click="handleBtnAction('histList-dlivEdit', relatedDliv.dlivId)">
              배송 수정
            </button>
          </div>
        </template>
      </template>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">
        연관 주문 정보가 없습니다.
      </div>
    </div>
  </div>
</div>
<!-- ===== □.□. 연관 주문 ================================================= -->
<!-- ===== □. 탭 컨텐츠 =================================================== -->
`,
};

/* ShopJoy Admin - 주문항목 상세 (OdOrderItemMng 하단 임베드 전용) */
window._odOrderItemDtlState = window._odOrderItemDtlState || { activeTab: 'info', tabMode: 'tab' };
window.OdOrderItemDtl = {
  name: 'OdOrderItemDtl',
  props: {
    navigate:      { type: Function, required: true },                       // 페이지 이동
    showToast:     { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:   { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    dtlId:         { type: String,   default: null },                        // orderItemId
    dtlMode:       { type: String,   default: 'view' },                      // view / edit
    active:        { type: Boolean,  default: true },                        // false=행 미선택 안내
    reloadTrigger: { type: Number,   default: 0 },                           // 부모 재조회 신호
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, watch, onMounted } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm  || props.showConfirm;

    const baseForm = reactive({
      orderItemId: '', orderId: '',
      prodId: '', prodNm: '', prodOptNm1: '', prodOptNm2: '',
      brandNm: '',
      orderQty: null, itemOrderAmt: null,
      orderItemStatusCd: '', orderItemStatusCdNm: '',
      claimYn: '', buyConfirmYn: '', settleYn: '',
      regDate: '',
    });

    const uiState = reactive({
      loading: false,
      dtlMode: props.dtlMode,
      activeTab: window._odOrderItemDtlState.activeTab || 'info',
      tabMode: window._odOrderItemDtlState.tabMode || 'tab',
    });

    const claims  = reactive([]);  // 연관 클레임 목록
    const history = reactive([]);  // 상태변경이력

    const codes = reactive({ order_item_statuses: [] });

    const cfIsNew     = computed(() => !props.dtlId);
    const cfReadonly  = computed(() => uiState.dtlMode === 'view');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'btn-close') {
        props.navigate('__cancelEdit__');
      } else if (cmd === 'btn-navOrder') {
        if (baseForm.orderId) props.navigate('odOrderMng', { initSearchValue: baseForm.orderId });
      } else if (cmd === 'btn-edit') {
        uiState.dtlMode = 'edit';
      } else if (cmd === 'btn-save') {
        handleSave();
      } else if (cmd === 'btn-cancel') {
        uiState.dtlMode = 'view';
        handleLoadDetail();
      } else if (cmd === 'tab-select') {
        uiState.activeTab = param;
        window._odOrderItemDtlState.activeTab = param;
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        window._odOrderItemDtlState.tabMode = param;
      } else {
        console.warn('[OdOrderItemDtl] handleBtnAction unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 #################################################### */

    const fnPrice = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';
    const fnDate  = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';
    const fnYn    = (v) => v === 'Y' ? '예' : (v === 'N' ? '아니오' : '-');

    const handleLoadDetail = async () => {
      if (!props.dtlId) return;
      uiState.loading = true;
      try {
        const res = await boApiSvc.odOrderItem.getById(props.dtlId, '주문항목상세', '조회');
        const d = res.data?.data || {};
        Object.assign(baseForm, {
          orderItemId: '', orderId: '', prodId: '', prodNm: '', prodOptNm1: '', prodOptNm2: '',
          brandNm: '', orderQty: null, itemOrderAmt: null,
          orderItemStatusCd: '', orderItemStatusCdNm: '',
          claimYn: '', buyConfirmYn: '', settleYn: '', regDate: '',
        });
        Object.assign(baseForm, d);
        await Promise.all([fnLoadClaims(), fnLoadHistory()]);
      } catch (err) {
        showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const fnLoadClaims = async () => {
      if (!baseForm.orderId) { claims.splice(0, claims.length); return; }
      try {
        const res = await boApiSvc.odClaim.getPage(
          { orderId: baseForm.orderId, pageNo: 1, pageSize: 50 }, '주문항목상세', '클레임조회');
        claims.splice(0, claims.length, ...(res.data?.data?.pageList || []));
      } catch (_) { claims.splice(0, claims.length); }
    };

    const fnLoadHistory = async () => {
      if (!props.dtlId) { history.splice(0, history.length); return; }
      try {
        const res = await boApiSvc.odOrderItem.getList(
          { orderItemId: props.dtlId, histType: 'status' }, '주문항목상세', '이력조회');
        history.splice(0, history.length, ...(res.data?.data || []));
      } catch (_) { history.splice(0, history.length); }
    };

    const handleSave = async () => {
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      try {
        await boApi.put(
          `/bo/ec/od/order-item/${baseForm.orderItemId}/status`,
          { orderItemStatusCd: baseForm.orderItemStatusCd },
          coUtil.apiHdr('주문항목상세', '저장'));
        showToast('저장되었습니다.', 'success');
        uiState.dtlMode = 'view';
        handleLoadDetail();
      } catch (err) {
        showToast(err.response?.data?.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS'], { compNm: 'OdOrderItemDtl' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS');
      } catch (_) {}
    };

    /* ##### [03] 탭 / 컬럼 정의 ##################################################### */

    const tabs = reactive([
      { id: 'info',    label: '기본정보',   icon: '📋' },
      { id: 'claim',   label: '클레임',     icon: '⚠️', get count() { return claims.length; } },
      { id: 'history', label: '상태이력',   icon: '🕒', get count() { return history.length; } },
    ]);

    const baseFormColumns = [
      { key: 'orderItemId',        label: '주문항목ID',  type: 'readonly', mono: true },
      { key: 'orderId',            label: '주문ID',      type: 'readonly', mono: true },
      { key: 'regDate',            label: '등록일시',    type: 'readonly', fmt: () => fnDate(baseForm.regDate) },
      { key: 'prodNm',             label: '상품명',      type: 'readonly', colSpan: 2,
        fmt: () => {
          const opts = [baseForm.prodOptNm1, baseForm.prodOptNm2].filter(Boolean);
          return opts.length ? baseForm.prodNm + ' [' + opts.join('/') + ']' : (baseForm.prodNm || '-');
        } },
      { key: 'brandNm',            label: '브랜드',      type: 'readonly' },
      { key: 'orderQty',           label: '수량',        type: 'readonly' },
      { key: 'itemOrderAmt',       label: '주문금액',    type: 'readonly', fmt: () => fnPrice(baseForm.itemOrderAmt) },
      { key: 'orderItemStatusCd',  label: '품목상태',
        type: cfReadonly.value ? 'readonly' : 'select',
        options: () => codes.order_item_statuses,
        fmt: () => baseForm.orderItemStatusCdNm || baseForm.orderItemStatusCd || '-' },
      { key: 'claimYn',            label: '클레임여부',  type: 'readonly', fmt: () => fnYn(baseForm.claimYn) },
      { key: 'buyConfirmYn',       label: '구매확정',    type: 'readonly', fmt: () => fnYn(baseForm.buyConfirmYn) },
      { key: 'settleYn',           label: '정산여부',    type: 'readonly', fmt: () => fnYn(baseForm.settleYn) },
    ];

    const claimGridColumns = [
      { key: 'claimId',          label: '클레임ID',  style: 'width:150px;', mono: true, link: true, cellStyle: 'font-size:11px;' },
      { key: 'claimTypeCd',      label: '유형',      style: 'width:70px;',  align: 'center' },
      { key: 'claimStatusCd',    label: '상태',      style: 'width:80px;',  align: 'center' },
      { key: 'claimReason',      label: '사유',      style: 'min-width:180px;', fmt: (v) => v || '-' },
      { key: 'regDate',          label: '등록일시',  style: 'width:130px;', fmt: (v) => fnDate(v), cellStyle: 'font-size:11px;color:#888;' },
    ];

    const historyGridColumns = [
      { key: 'statusCd',         label: '변경상태',  style: 'width:120px;', align: 'center' },
      { key: 'statusCdBefore',   label: '이전상태',  style: 'width:120px;', align: 'center' },
      { key: 'chgReason',        label: '변경사유',  style: 'min-width:180px;', fmt: (v) => v || '-' },
      { key: 'regDate',          label: '변경일시',  style: 'width:130px;', fmt: (v) => fnDate(v), cellStyle: 'font-size:11px;color:#888;' },
    ];

    /* ##### watch / onMounted ################################################## */

    watch(() => props.reloadTrigger, handleLoadDetail);
    watch(() => props.dtlMode, (v) => { uiState.dtlMode = v; });

    onMounted(async () => { await fnLoadCodes(); await handleLoadDetail(); });

    /* ##### [06] return ######################################################## */

    return {
      baseForm, uiState, tabs, cfIsNew, cfReadonly, codes, claims, history,
      baseFormColumns, claimGridColumns, historyGridColumns,
      handleBtnAction,
    };
  },
  template: `
<bo-container v-if="active" title="주문항목 상세"
  :title-id="baseForm.orderItemId || ''">
  <!-- ===== 툴바 ============================================================= -->
  <template #toolbar-actions>
    <button v-if="baseForm.orderId" class="btn btn-blue btn-sm"
      @click="handleBtnAction('btn-navOrder')">📦 주문 보기</button>
    <button v-if="cfReadonly" class="btn btn_edit" @click="handleBtnAction('btn-edit')">수정</button>
    <button v-if="!cfReadonly" class="btn btn_save" @click="handleBtnAction('btn-save')">저장</button>
    <button v-if="!cfReadonly" class="btn btn_cancel" @click="handleBtnAction('btn-cancel')">취소</button>
    <button class="btn btn_close" @click="handleBtnAction('btn-close')">닫기</button>
  </template>
  <!-- ===== 미선택 안내 ======================================================= -->
  <div v-if="!baseForm.orderItemId" style="padding:40px;text-align:center;color:#bbb;">
    <div style="font-size:28px;margin-bottom:8px;">📋</div>
    항목을 선택하면 상세정보가 표시됩니다.
  </div>
  <!-- ===== 탭 + 콘텐츠 ====================================================== -->
  <template v-else>
    <bo-tab-bar :tabs="tabs" :tab="uiState.activeTab" :tab-mode="uiState.tabMode" :show-modes="true"
      @tab-select="id => handleBtnAction('tab-select', id)"
      @mode-select="m => handleBtnAction('tab-mode', m)" />
    <div :class="'dtl-tab-grid cols-' + (uiState.tabMode === 'tab' ? '1' : uiState.tabMode.replace('col',''))">
      <!-- ── 기본정보 탭 ──────────────────────────────────────── -->
      <div v-show="uiState.tabMode !== 'tab' || uiState.activeTab === 'info'" class="card">
        <div v-if="uiState.tabMode !== 'tab'" class="dtl-tab-card-title">📋 기본정보</div>
        <div v-if="uiState.loading" style="padding:32px;text-align:center;color:#bbb;">조회 중...</div>
        <bo-form-area v-else :columns="baseFormColumns" :form="baseForm" :errors="{}"
          :readonly="cfReadonly" :cols="3" :show-actions="false" />
      </div>
      <!-- ── 클레임 탭 ────────────────────────────────────────── -->
      <div v-show="uiState.tabMode !== 'tab' || uiState.activeTab === 'claim'" class="card">
        <div v-if="uiState.tabMode !== 'tab'" class="dtl-tab-card-title">⚠️ 클레임</div>
        <div v-if="!claims.length" style="padding:24px;text-align:center;color:#bbb;font-size:13px;">
          연관 클레임이 없습니다.
        </div>
        <bo-grid v-else bare :columns="claimGridColumns" :rows="claims" row-key="claimId"
          empty-text="클레임 없음" />
      </div>
      <!-- ── 상태이력 탭 ───────────────────────────────────────── -->
      <div v-show="uiState.tabMode !== 'tab' || uiState.activeTab === 'history'" class="card">
        <div v-if="uiState.tabMode !== 'tab'" class="dtl-tab-card-title">🕒 상태이력</div>
        <div v-if="!history.length" style="padding:24px;text-align:center;color:#bbb;font-size:13px;">
          상태 변경 이력이 없습니다.
        </div>
        <bo-grid v-else bare :columns="historyGridColumns" :rows="history" row-key="regDate"
          empty-text="이력 없음" />
      </div>
    </div>
  </template>
</bo-container>
`
};

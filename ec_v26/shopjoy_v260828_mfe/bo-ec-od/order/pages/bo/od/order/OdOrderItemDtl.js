/* ShopJoy Admin - 주문항목 상세 (OdOrderItemMng 하단 임베드 전용) */
window._odOrderItemDtlState = window._odOrderItemDtlState || { activeTab: 'info', tabMode: 'tab' };
export default {
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

    const errors = reactive({}); // 저장 검증 오류 (항목 아래 빨간 라벨)
    const baseForm = reactive({
      orderItemId: '', orderId: '',
      prodId: '', prodNm: '', prodOptNm1: '', prodOptNm2: '',
      brandNm: '', vendorNm: '', mdUserNm: '', categoryNm: '',
      memberNm: '', memberLoginId: '',
      orderQty: null, cancelQty: null,
      itemOrderAmt: null, itemCancelAmt: null, itemCompletedAmt: null,
      salePrice: null, discntAmt: null,
      orderItemStatusCd: '', orderItemStatusCdNm: '',
      claimYn: '', claimTypeCd: '', claimStatusCd: '',
      buyConfirmYn: '', settleYn: '', refundCompltYn: '',
      courierCd: '', courierNm: '', invoiceNo: '',
      regDate: '', updDate: '',
      // 금액계산
      normalPrice: null, unitPrice: null,
      orgUnitPrice: null, orgItemOrderAmt: null, orgDiscountAmt: null, orgShippingFee: null,
      outboundShippingFee: null,
      // 정산정보
      saveRate: null, saveUseAmt: null, saveSchdAmt: null,
      settlePeriod: '', settleTargetAmt: null, settleFeeRate: null, settleFeeAmt: null,
      settleAmt: null, closeYn: '', closeDate: '', settleId: '',
      // 전표정보
      erpVoucherId: '', erpVoucherLineNo: null, erpSendYn: '', erpSendDate: '', rawStatusCdNm: '',
    });

    const uiState = reactive({
      loading: false,
      dtlMode: props.dtlMode,
      activeTab: window._odOrderItemDtlState.activeTab || 'info',
      tabMode: window._odOrderItemDtlState.tabMode || 'tab',
    });

    const claims  = reactive([]);  // 연관 클레임 목록
    const history = reactive([]);  // 상태변경이력

    const codes = reactive({ order_item_statuses: [], dliv_methods: [] });

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
          orderItemId: '', orderId: '',
          prodId: '', prodNm: '', prodOptNm1: '', prodOptNm2: '',
          brandNm: '', vendorNm: '', mdUserNm: '', categoryNm: '',
          memberNm: '', memberLoginId: '',
          orderQty: null, cancelQty: null,
          itemOrderAmt: null, itemCancelAmt: null, itemCompletedAmt: null,
          salePrice: null, discntAmt: null,
          orderItemStatusCd: '', orderItemStatusCdNm: '',
          claimYn: '', claimTypeCd: '', claimStatusCd: '',
          buyConfirmYn: '', settleYn: '', refundCompltYn: '',
          courierCd: '', courierNm: '', invoiceNo: '',
          dlivMethodCd: '',
          regDate: '', updDate: '',
          normalPrice: null, unitPrice: null,
          orgUnitPrice: null, orgItemOrderAmt: null, orgDiscountAmt: null, orgShippingFee: null,
          outboundShippingFee: null,
          saveRate: null, saveUseAmt: null, saveSchdAmt: null,
          settlePeriod: '', settleTargetAmt: null, settleFeeRate: null, settleFeeAmt: null,
          settleAmt: null, closeYn: '', closeDate: '', settleId: '',
          erpVoucherId: '', erpVoucherLineNo: null, erpSendYn: '', erpSendDate: '', rawStatusCdNm: '',
        });
        Object.assign(baseForm, d);
        await Promise.all([fnLoadClaims(), fnLoadHistory(), fnLoadSettleRaw()]);
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

    /* 정산원장(st_settle_raw) 조회 — 정산정보/전표정보 그룹의 데이터 소스(ORDER 유형 원장 1건) */
    const fnLoadSettleRaw = async () => {
      if (!props.dtlId) return;
      try {
        const res = await boApiSvc.stSettleRaw.getPage(
          { orderItemId: props.dtlId, rawTypeCd: 'ORDER', pageNo: 1, pageSize: 1 }, '주문항목상세', '정산조회');
        const row = res.data?.data?.pageList?.[0] || {};
        Object.assign(baseForm, {
          settlePeriod:     row.settlePeriod     || '',
          settleTargetAmt:  row.settleTargetAmt  ?? null,
          settleFeeRate:    row.settleFeeRate    ?? null,
          settleFeeAmt:     row.settleFeeAmt     ?? null,
          settleAmt:        row.settleAmt        ?? null,
          closeYn:          row.closeYn          || '',
          closeDate:        row.closeDate        || '',
          settleId:         row.settleId         || '',
          erpVoucherId:     row.erpVoucherId     || '',
          erpVoucherLineNo: row.erpVoucherLineNo ?? null,
          erpSendYn:        row.erpSendYn        || '',
          erpSendDate:      row.erpSendDate      || '',
          rawStatusCdNm:    row.rawStatusCdNm    || '',
        });
      } catch (_) { /* 정산원장 미수집 상태일 수 있음 — 조용히 무시, 해당 그룹은 '-'로 표시 */ }
    };

    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!baseForm.orderItemStatusCd) { errors.orderItemStatusCd = '품목상태를 선택해주세요.'; }
      if (Object.keys(errors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      try {
        await boApi.patch(
          `/bo/ec/od/order-item/${baseForm.orderItemId}`,
          { orderItemStatusCd: baseForm.orderItemStatusCd, dlivMethodCd: baseForm.dlivMethodCd || null },
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
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS_CD', 'DLIV_METHOD_CD'], { compNm: 'OdOrderItemDtl' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS_CD');
        codes.dliv_methods        = codeStore.sgGetGrpCodes('DLIV_METHOD_CD');
      } catch (_) {}
    };

    /* fnDlivMethodLabel — 배송방법 코드값 → 라벨 (미지정 시 "상품 기본값 사용") */
    const fnDlivMethodLabel = (v) => {
      if (!v) return '상품 기본값 사용';
      return (codes.dliv_methods.find(c => c.codeValue === v) || {}).codeLabel || v;
    };

    /* ##### [03] 탭 / 컬럼 정의 ##################################################### */

    const tabs = reactive([
      { id: 'info',    label: '기본정보',   icon: '📋' },
      { id: 'claim',   label: '클레임',     icon: '⚠️', get count() { return claims.length; } },
      { id: 'history', label: '상태이력',   icon: '🕒', get count() { return history.length; } },
    ]);

    const baseFormColumns = [
      { type: 'group', label: '기본 · 상품정보' },
      { key: 'orderItemId',       label: '주문항목ID',   type: 'readonly', mono: true },
      { key: 'orderId',           label: '주문ID',       type: 'readonly', mono: true },
      { key: 'regDate',           label: '등록일시',     type: 'readonly', fmt: () => fnDate(baseForm.regDate) },
      { key: 'memberNm',          label: '주문회원',     type: 'readonly',
        fmt: () => baseForm.memberNm ? baseForm.memberNm + (baseForm.memberLoginId ? ' (' + baseForm.memberLoginId + ')' : '') : '-' },
      { key: 'categoryNm',        label: '카테고리',     type: 'readonly', fmt: () => baseForm.categoryNm || '-' },
      { key: 'vendorNm',          label: '판매업체',     type: 'readonly', fmt: () => baseForm.vendorNm || '-' },
      { key: 'prodNm',            label: '상품명',       type: 'readonly', colSpan: 2,
        fmt: () => {
          const opts = [baseForm.prodOptNm1, baseForm.prodOptNm2].filter(Boolean);
          return opts.length ? baseForm.prodNm + ' [' + opts.join('/') + ']' : (baseForm.prodNm || '-');
        } },
      { key: 'brandNm',           label: '브랜드',       type: 'readonly', fmt: () => baseForm.brandNm || '-' },
      { key: 'mdUserNm',          label: 'MD',           type: 'readonly', fmt: () => baseForm.mdUserNm || '-' },
      { key: 'orderQty',          label: '주문수량',     type: 'readonly' },
      { key: 'cancelQty',         label: '취소수량',     type: 'readonly', fmt: () => baseForm.cancelQty || '-' },
      { key: 'salePrice',         label: '판매단가',     type: 'readonly', fmt: () => fnPrice(baseForm.salePrice) },
      { key: 'discntAmt',         label: '할인금액',     type: 'readonly', fmt: () => fnPrice(baseForm.discntAmt) },
      { key: 'itemOrderAmt',      label: '주문금액',     type: 'readonly', fmt: () => fnPrice(baseForm.itemOrderAmt) },
      { key: 'itemCancelAmt',     label: '환불금액',     type: 'readonly', fmt: () => fnPrice(baseForm.itemCancelAmt) },
      { key: 'itemCompletedAmt',  label: '확정금액',     type: 'readonly', fmt: () => fnPrice(baseForm.itemCompletedAmt) },
      { type: 'group', label: '금액 · 상태정보' },
      { key: 'orderItemStatusCd', label: '품목상태', required: true,
        type: cfReadonly.value ? 'readonly' : 'select',
        options: () => codes.order_item_statuses,
        fmt: () => baseForm.orderItemStatusCdNm || baseForm.orderItemStatusCd || '-' },
      { key: 'claimYn',           label: '클레임여부',   type: 'readonly', fmt: () => fnYn(baseForm.claimYn) },
      { key: 'claimTypeCd',       label: '클레임유형',   type: 'readonly',
        fmt: () => ({ CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' })[baseForm.claimTypeCd] || (baseForm.claimTypeCd || '-') },
      { key: 'buyConfirmYn',      label: '구매확정',     type: 'readonly', fmt: () => fnYn(baseForm.buyConfirmYn) },
      { key: 'settleYn',          label: '정산여부',     type: 'readonly', fmt: () => fnYn(baseForm.settleYn) },
      { key: 'refundCompltYn',    label: '환불완료',     type: 'readonly', fmt: () => fnYn(baseForm.refundCompltYn) },
      { key: 'courierNm',         label: '택배사',       type: 'readonly', fmt: () => baseForm.courierNm || baseForm.courierCd || '-' },
      { key: 'invoiceNo',         label: '운송장번호',   type: 'readonly', mono: true, fmt: () => baseForm.invoiceNo || '-' },
      { key: 'dlivMethodCd',      label: '배송방법 override',
        type: cfReadonly.value ? 'readonly' : 'select',
        options: () => codes.dliv_methods, nullLabel: '상품 기본값 사용',
        hint: '긴급 발송 등 이 항목만 다른 배송방법으로 바꿀 때만 지정',
        fmt: () => fnDlivMethodLabel(baseForm.dlivMethodCd) },
      { key: 'updDate',           label: '수정일시',     type: 'readonly', fmt: () => fnDate(baseForm.updDate) },
      { type: 'group', label: '금액계산' },
      { key: 'normalPrice',          label: '정상가',       type: 'readonly', fmt: () => fnPrice(baseForm.normalPrice) },
      { key: 'unitPrice',            label: '판매단가',     type: 'readonly', fmt: () => fnPrice(baseForm.unitPrice) },
      { key: 'orgUnitPrice',         label: '확정단가',     type: 'readonly', fmt: () => fnPrice(baseForm.orgUnitPrice) },
      { key: 'orgItemOrderAmt',      label: '확정주문금액', type: 'readonly', fmt: () => fnPrice(baseForm.orgItemOrderAmt) },
      { key: 'orgDiscountAmt',       label: '확정할인금액', type: 'readonly', fmt: () => fnPrice(baseForm.orgDiscountAmt) },
      { key: 'orgShippingFee',       label: '확정배송료',   type: 'readonly', fmt: () => fnPrice(baseForm.orgShippingFee) },
      { key: 'outboundShippingFee',  label: '항목배송비',   type: 'readonly', fmt: () => fnPrice(baseForm.outboundShippingFee) },
      { type: 'group', label: '정산정보' },
      { key: 'settlePeriod',      label: '정산기간',     type: 'readonly', fmt: () => baseForm.settlePeriod || '-' },
      { key: 'settleTargetAmt',   label: '정산대상금액', type: 'readonly', fmt: () => fnPrice(baseForm.settleTargetAmt) },
      { key: 'settleFeeRate',     label: '수수료율',     type: 'readonly', fmt: () => baseForm.settleFeeRate != null ? baseForm.settleFeeRate + '%' : '-' },
      { key: 'settleFeeAmt',      label: '수수료금액',   type: 'readonly', fmt: () => fnPrice(baseForm.settleFeeAmt) },
      { key: 'settleAmt',         label: '정산금액',     type: 'readonly', fmt: () => fnPrice(baseForm.settleAmt) },
      { key: 'closeYn',           label: '정산마감여부', type: 'readonly', fmt: () => fnYn(baseForm.closeYn) },
      { key: 'closeDate',         label: '마감일시',     type: 'readonly', fmt: () => fnDate(baseForm.closeDate) },
      { key: 'settleId',          label: '정산집계ID',   type: 'readonly', mono: true, fmt: () => baseForm.settleId || '-' },
      { key: 'saveRate',          label: '적립율',       type: 'readonly', fmt: () => baseForm.saveRate != null ? baseForm.saveRate + '%' : '-' },
      { key: 'saveUseAmt',        label: '사용적립금',   type: 'readonly', fmt: () => fnPrice(baseForm.saveUseAmt) },
      { key: 'saveSchdAmt',       label: '적립예정금액', type: 'readonly', fmt: () => fnPrice(baseForm.saveSchdAmt) },
      { type: 'group', label: '전표정보' },
      { key: 'erpVoucherId',      label: '전표ID',       type: 'readonly', mono: true, fmt: () => baseForm.erpVoucherId || '-' },
      { key: 'erpVoucherLineNo',  label: '전표라인번호', type: 'readonly', fmt: () => baseForm.erpVoucherLineNo ?? '-' },
      { key: 'erpSendYn',         label: 'ERP전송여부',  type: 'readonly', fmt: () => fnYn(baseForm.erpSendYn) },
      { key: 'erpSendDate',       label: 'ERP전송일시',  type: 'readonly', fmt: () => fnDate(baseForm.erpSendDate) },
      { key: 'rawStatusCdNm',     label: '수집상태',     type: 'readonly', fmt: () => baseForm.rawStatusCdNm || '-' },
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
      baseForm, errors, uiState, tabs, cfIsNew, cfReadonly, codes, claims, history,
      baseFormColumns, claimGridColumns, historyGridColumns,
      handleBtnAction,
    };
  },
  template: `
<bo-container v-if="active" title="주문항목 상세"
  :title-id="baseForm.orderItemId || ''">
  <!-- ===== 툴바 (처리버튼 배치 금지 — 관련 이동 링크만) ============================== -->
  <template #toolbar-actions>
    <button v-if="baseForm.orderId" class="btn btn-blue btn-sm"
      @click="handleBtnAction('btn-navOrder')">📦 주문 보기</button>
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
        <bo-form-area v-else :columns="baseFormColumns" :form="baseForm" :errors="errors"
          :readonly="cfReadonly" :cols="3" compact plain-readonly :show-actions="false" />
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
    <!-- ===== 하단 액션 (Mng 인라인 상세 패널 표준 — 처리버튼은 하단 중앙 정렬) ===================== -->
    <bo-form-actions :readonly="cfReadonly" :show-delete="false" :edit-click="() => handleBtnAction('btn-edit')"
 :save-click="() => handleBtnAction('btn-save')"
 :cancel-click="() => handleBtnAction('btn-cancel')"
 :close-click="() => handleBtnAction('btn-close')" />
  </template>
</bo-container>
`
};

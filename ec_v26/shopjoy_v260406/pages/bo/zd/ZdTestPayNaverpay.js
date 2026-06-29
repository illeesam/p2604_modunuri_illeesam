/**
 * 개발도구 — 네이버페이 결제 테스트
 *
 * 흐름:
 *   1. [결제 예약] POST /api/co/cm/naverpay/reserve → reserveId + reservationUrl
 *   2. [리다이렉트] https://pay.naver.com/payments/new?reservationId={reserveId} 로 이동
 *   3. 결제 완료 후 returnUrl 에 paymentId 파라미터 포함 콜백
 *   4. [결제 승인] POST /api/co/cm/naverpay/approve (reserveId + paymentId) → 최종 완료
 *   5. [결제 취소] POST /api/co/cm/naverpay/cancel (paymentId + cancelAmount)
 *
 * sy_prop: app.pay.naverpay.client-id / app.pay.naverpay.client-secret / app.pay.naverpay.api-url
 * 테스트 API: https://dev.apis.naver.com/naverpay-partner/naverpay (키 발급 필요)
 */
window.ZdTestPayNaverpay = {
  name: 'ZdTestPayNaverpay',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      clientId:     '',
      clientSecret: '',
      apiUrl:       '',
    });

    const form = reactive({
      amount:           1000,
      taxScopeAmount:   1000,  // 과세 금액 (totalPayAmount 와 같거나 작아야 함)
      taxExScopeAmount: 0,     // 면세 금액 (taxScopeAmount + taxExScopeAmount = totalPayAmount)
      payKey:           'NAVER-' + Date.now(), // merchantPayKey
      orderName:        '네이버페이 테스트 상품',
      returnUrl:        window.location.origin + '/?naverpay_return=1',
    });

    const result = reactive({
      reserveResult: null,  // POST /reserve 응답
      approveResult: null,  // POST /approve 응답
      cancelResult:  null,  // POST /cancel 응답
      error:         '',
      phase:         'idle', // idle | reserved | approving | done
    });

    const uiState = reactive({ loading: false });

    // 수동 승인용 입력값
    const manualApprove = reactive({ reserveId: '', paymentId: '' });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.pay.naverpay.client-id,app.pay.naverpay.client-secret,app.pay.naverpay.api-url'
        }, '네이버페이 결제 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.clientId     = pickVal('app.pay.naverpay.client-id');
        cfg.clientSecret = pickVal('app.pay.naverpay.client-secret');
        cfg.apiUrl       = pickVal('app.pay.naverpay.api-url');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const refreshPayKey = () => { form.payKey = 'NAVER-' + Date.now(); };

    const testReserve = async () => {
      if (!cfg.clientId)     { showToast('Client ID 를 입력하세요.', 'error'); return; }
      if (!cfg.clientSecret) { showToast('Client Secret 을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.phase    = 'reserved';
      result.error    = '';
      result.reserveResult = null;
      try {
        const res = await boApi.post('/co/cm/naverpay/reserve', {
          merchantPayKey:   form.payKey,
          productName:      form.orderName,
          totalPayAmount:   Number(form.amount),
          taxScopeAmount:   Number(form.taxScopeAmount),
          taxExScopeAmount: Number(form.taxExScopeAmount),
          returnUrl:        form.returnUrl,
        }, coUtil.cofApiHdr('네이버페이 결제 테스트', '결제예약'));
        result.reserveResult = res.data?.data || res.data;
        if (result.reserveResult?.body?.reserveId) {
          manualApprove.reserveId = result.reserveResult.body.reserveId;
        }
        showToast('결제 예약 완료. 네이버페이 결제창을 열어주세요.', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message;
        result.phase = 'idle';
        showToast('결제 예약 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const openNaverPayWindow = () => {
      const reserveId = result.reserveResult?.body?.reserveId;
      if (!reserveId) { showToast('먼저 결제 예약을 실행하세요.', 'error'); return; }
      const url = 'https://pay.naver.com/payments/new?reservationId=' + reserveId;
      window.open(url, 'naverpay', 'width=480,height=700');
    };

    const testApprove = async () => {
      const reserveId = manualApprove.reserveId;
      const paymentId = manualApprove.paymentId;
      if (!reserveId) { showToast('reserveId 를 입력하세요 (예약 응답의 body.reserveId).', 'error'); return; }
      if (!paymentId) { showToast('paymentId 를 입력하세요 (returnUrl 파라미터의 paymentId).', 'error'); return; }
      uiState.loading = true;
      result.phase    = 'approving';
      result.error    = '';
      try {
        const res = await boApi.post('/co/cm/naverpay/approve', {
          reserveId,
          paymentId,
        }, coUtil.cofApiHdr('네이버페이 결제 테스트', '결제승인'));
        result.approveResult = res.data?.data || res.data;
        result.phase = 'done';
        showToast('결제 승인 완료', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message;
        result.phase = 'reserved';
        showToast('결제 승인 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const testCancel = async () => {
      const paymentId = result.approveResult?.body?.detail?.paymentId || manualApprove.paymentId;
      if (!paymentId) { showToast('먼저 결제 승인이 필요합니다.', 'error'); return; }
      const ok = await (window.boApp?.showConfirm || (() => Promise.resolve(true)))('결제 취소', '결제를 취소하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApi.post('/co/cm/naverpay/cancel', {
          paymentId,
          cancelAmount:     Number(form.amount),
          cancelReason:     '개발자 테스트 취소',
          taxScopeAmount:   Number(form.taxScopeAmount),
          taxExScopeAmount: Number(form.taxExScopeAmount),
        }, coUtil.cofApiHdr('네이버페이 결제 테스트', '결제취소'));
        result.cancelResult = res.data?.data || res.data;
        showToast('결제 취소 완료', 'success');
      } catch (e) {
        showToast('취소 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      uiState.loading = false;
    };

    const saveKeys = async () => {
      try {
        const rows = [];
        if (cfg.clientId)     rows.push({ propKey: 'app.pay.naverpay.client-id',     propValue: cfg.clientId });
        if (cfg.clientSecret) rows.push({ propKey: 'app.pay.naverpay.client-secret', propValue: cfg.clientSecret });
        if (cfg.apiUrl)       rows.push({ propKey: 'app.pay.naverpay.api-url',        propValue: cfg.apiUrl });
        if (!rows.length) { showToast('저장할 키가 없습니다.', 'error'); return; }
        await boApi.put('/bo/sy/prop/bulk', rows, coUtil.cofApiHdr('네이버페이 결제 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'reserve-test')   return testReserve();
      if (cmd === 'open-window')    return openNaverPayWindow();
      if (cmd === 'approve-test')   return testApprove();
      if (cmd === 'cancel-test')    return testCancel();
      if (cmd === 'keys-save')      return saveKeys();
      if (cmd === 'paykey-refresh') return refreshPayKey();
    };

    /* ##### [05] 폼/그리드 컬럼 정의 #################################################### */

    // API 키 설정 폼 (cfg)
    const cfgFormColumns = [
      { key: 'clientId',     label: 'Client ID',     type: 'text', hint: 'client-id',     mono: true, placeholder: '네이버페이 파트너센터 → Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'text', hint: 'client-secret', mono: true, placeholder: 'Client Secret' },
      { key: 'apiUrl',       label: 'API URL',        type: 'text', hint: 'api-url',        mono: true, placeholder: 'https://dev.apis.naver.com/naverpay-partner/naverpay (테스트)', colSpan: 3 },
    ];

    // 결제 파라미터 폼 (form)
    const payFormColumns = [
      { key: 'amount',           label: '결제금액',         type: 'number', hint: 'amount' },
      { key: 'taxScopeAmount',   label: '과세 금액',         type: 'number', hint: 'taxScopeAmount' },
      { key: 'taxExScopeAmount', label: '면세 금액',         type: 'number', hint: 'taxExScopeAmount' },
      { key: '_payKey',          label: 'merchantPayKey',    type: 'slot',   name: 'payKeySlot', hint: 'merchantPayKey', mono: true },
      { key: 'orderName',        label: '상품명',             type: 'text',   hint: 'productName' },
      { key: 'returnUrl',        label: 'returnUrl',          type: 'text',   hint: 'returnUrl', mono: true, colSpan: 3 },
    ];

    // 수동 승인 폼 (manualApprove)
    const approveFormColumns = [
      { key: 'reserveId', label: 'reserveId', type: 'text', hint: 'reserveId', mono: true, placeholder: '예약 응답의 body.reserveId' },
      { key: 'paymentId', label: 'paymentId', type: 'text', hint: 'paymentId', mono: true, placeholder: 'returnUrl 파라미터의 paymentId', colSpan: 2 },
    ];

    // 결제 예약 결과 그리드
    const reserveGridColumns = [
      { key: 'code',      label: 'code',      mono: true, cellStyle: 'font-size:11px' },
      { key: '_reserveId', label: 'reserveId', mono: true, cellStyle: 'font-size:11px', fmt: (v, row) => row.body?.reserveId || '' },
      { key: '_payUrl',   label: '결제 URL',   cellStyle: 'font-size:11px;word-break:break-all', fmt: (v, row) => row.body?.reserveId ? ('https://pay.naver.com/payments/new?reservationId=' + row.body.reserveId) : '' },
    ];

    // 결제 승인 결과 그리드
    const approveGridColumns = [
      { key: 'code',          label: 'code',           mono: true, cellStyle: 'font-size:11px' },
      { key: '_paymentId',    label: 'paymentId',      fmt: (v, row) => row.body?.detail?.paymentId || '' },
      { key: '_totalAmount',  label: 'totalPayAmount', align: 'right', fmt: (v, row) => (row.body?.detail?.totalPayAmount?.toLocaleString() || '') + ' 원' },
      { key: '_payMeans',     label: 'paymentMeans',   badge: () => 'badge-green', fmt: (v, row) => row.body?.detail?.primaryPayMeans || '' },
      { key: '_productName',  label: 'productName',    fmt: (v, row) => row.body?.detail?.productName || '' },
    ];

    return {
      cfg, form, result, uiState, manualApprove, handleBtnAction,
      cfgFormColumns, payFormColumns, approveFormColumns,
      reserveGridColumns, approveGridColumns,
    };
  },

  template: `
<div>
  <div class="page-title">네이버페이 결제 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="display:flex;justify-content:flex-end;margin-top:8px">
        <button class="btn btn_save" @click="handleBtnAction('keys-save')">sy_prop 저장</button>
      </div>
      <div style="font-size:11px;color:#666;background:#e8f5e9;padding:6px 10px;border-radius:4px;margin-top:8px;line-height:1.8;border:1px solid #a5d6a7">
        키 발급: <a href="https://developer.pay.naver.com/app" target="_blank" style="color:#2e7d32">developer.pay.naver.com</a>
        → 파트너 신청 후 테스트 Client ID/Secret 발급.
        테스트 API: <code>https://dev.apis.naver.com/naverpay-partner/naverpay</code>
      </div>
    </div>
  </div>

  <!-- 결제 파라미터 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">결제 파라미터</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="payFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #payKeySlot>
          <div style="display:flex;gap:4px">
            <input class="form-control" v-model="form.payKey" style="flex:1;font-family:monospace;font-size:12px" />
            <button class="btn btn_reset" @click="handleBtnAction('paykey-refresh')" style="white-space:nowrap">새로고침</button>
          </div>
        </template>
      </bo-form-area>
    </div>
  </div>

  <!-- 테스트 액션 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">테스트 실행</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_confirm" :disabled="uiState.loading" @click="handleBtnAction('reserve-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '결제 예약 (reserve)' }}
        </button>
        <button class="btn btn_preview" :disabled="!result.reserveResult" @click="handleBtnAction('open-window')">네이버페이 창 열기</button>
        <button class="btn btn_delete" :disabled="!result.approveResult" @click="handleBtnAction('cancel-test')">결제 취소</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-bottom:8px">{{ result.error }}</div>

      <!-- reserve 결과 -->
      <div v-if="result.reserveResult" style="background:#f1f8e9;border:1px solid #a5d6a7;border-radius:6px;padding:10px;margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:6px;color:#2e7d32">📋 결제 예약 결과</div>
        <bo-grid :columns="reserveGridColumns" :rows="result.reserveResult ? [result.reserveResult] : []" :show-row-num="false" />
      </div>

      <!-- 수동 승인 영역 -->
      <div style="background:#f0f4ff;border:1px solid #93c5fd;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:8px;color:#1d4ed8">🔑 수동 승인 (네이버페이 결제 완료 후)</div>
        <div style="font-size:11px;color:#555;margin-bottom:6px">
          네이버페이 완료 후 returnUrl 에 <code>paymentId</code> 파라미터가 붙습니다. 복사 후 아래 입력:
        </div>
        <bo-form-area :columns="approveFormColumns" :form="manualApprove" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button class="btn btn_apply" :disabled="uiState.loading" @click="handleBtnAction('approve-test')">결제 승인 (approve)</button>
        </div>
      </div>

      <!-- 승인 결과 -->
      <div v-if="result.approveResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 결제 승인 결과</div>
        <bo-grid :columns="approveGridColumns" :rows="result.approveResult ? [result.approveResult] : []" :show-row-num="false" />
      </div>

      <!-- 취소 결과 -->
      <div v-if="result.cancelResult" style="background:#fff7ed;border:1px solid #fdba74;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:6px;color:#c2410c">⊘ 결제 취소 결과</div>
        <pre style="font-size:11px;overflow:auto;max-height:120px">{{ JSON.stringify(result.cancelResult, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- 흐름 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">연동 흐름</span></div>
    <div style="padding:12px;font-size:12px;line-height:2;color:#444">
      <b>1.</b> [결제 예약] <code>POST /api/co/cm/naverpay/reserve</code> → reserveId 반환<br>
      <b>2.</b> [창 열기] <code>https://pay.naver.com/payments/new?reservationId={reserveId}</code> 팝업<br>
      <b>3.</b> [결제 완료] returnUrl 로 리다이렉트 (URL 파라미터: <code>paymentId</code>)<br>
      <b>4.</b> [결제 승인] <code>POST /api/co/cm/naverpay/approve</code> (reserveId + paymentId) → 최종 승인<br>
      <b>5.</b> [결제 취소] <code>POST /api/co/cm/naverpay/cancel</code> (paymentId + cancelAmount)<br>
      <br>
      sy_prop: <code>app.pay.naverpay.client-id</code> / <code>app.pay.naverpay.client-secret</code> / <code>app.pay.naverpay.api-url</code><br>
      키 발급: <b>developer.pay.naver.com</b> → 파트너 신청 후 테스트 계정 발급 (테스트 API = dev.apis.naver.com/...)
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.pay.naverpay." default-prop-key-filter="app.pay.naverpay" />
  <bo-zd-yml-grid endpoint="/bo/sy/app-config/naverpay" default-key-filter="app.pay.naverpay" />
</div>`,
};

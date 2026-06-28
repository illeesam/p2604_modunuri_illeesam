/**
 * 개발도구 — 토스페이먼츠 결제위젯 테스트 (test_gck_ 키)
 */
window.ZdTestPayTossWidget = {
  name: 'ZdTestPayTossWidget',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, ref, onMounted, onUnmounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      clientKey: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm', // 결제위젯 문서용 테스트 키
      secretKey: '',
    });

    const form = reactive({
      amount:           1000,
      orderId:          'TEST-' + Date.now(),
      orderName:        '테스트 상품',
      customerName:     '송성일',
      customerEmail:    'illeesam@gmail.com',
      customerMobilePhone: '',
      successUrl:       window.location.origin + '/api/co/cm/toss/confirm',
      failUrl:          window.location.origin + '/?toss_fail=1',
      taxFreeAmount:    0,
      taxExemptionAmount: 0,
      cultureExpense:   false,
      useEscrow:        false,
      escrowProducts:   '',  // JSON 문자열 (배열)
      addCardBenefits:  false,
      appScheme:        '',
      windowTarget:     '',
      currency:         'KRW',
      country:          'KR',
    });

    const result = reactive({
      sdkStatus:     '',
      sdkUrl:        '',
      initDetail:    '',
      confirmResult: null,
      cancelResult:  null,
      error:         '',
      phase:         'idle',
    });

    const uiState = reactive({ sdkLoaded: false, loading: false, widgetMounted: false });
    const widgetContainerId = 'toss-widget-container-' + Math.random().toString(36).slice(2);
    let widgetsInstance = null;

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'app.pay.toss.widget-client-key,app.pay.toss.secret-key' }, '토스 결제위젯 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        const savedClientKey = pickVal('app.pay.toss.widget-client-key');
        if (savedClientKey) cfg.clientKey = savedClientKey;
        cfg.secretKey = pickVal('app.pay.toss.secret-key');
      } catch (e) {
        // sy_prop 조회 실패는 무시 (기본 문서용 키 사용)
      }
      checkSdk();
    });

    onUnmounted(() => {
      widgetsInstance = null;
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = typeof window.TossPayments === 'function';
      uiState.sdkLoaded = ok;
      result.sdkUrl    = 'https://js.tosspayments.com/v2/standard';
      result.sdkStatus = ok ? '✅ TossPayments SDK 로드됨' : '❌ TossPayments SDK 없음';
      result.initDetail = ok ? ('Widget Client Key: ' + (cfg.clientKey || '(미설정)')) : '';
    };

    const refreshOrderId = () => { form.orderId = 'TEST-' + Date.now(); };

    const mountWidget = async () => {
      if (!cfg.clientKey) { showToast('Widget Client Key 를 입력하세요.', 'error'); return; }
      if (!uiState.sdkLoaded) { showToast('TossPayments SDK 가 로드되지 않았습니다.', 'error', 0); return; }
      result.error = '';
      try {
        // 결제위젯 v2: TossPayments(clientKey) → .widgets({ customerKey }) → .setAmount() → .render()
        const toss = await TossPayments(cfg.clientKey);
        widgetsInstance = toss.widgets({ customerKey: 'ANONYMOUS_' + form.orderId });
        await widgetsInstance.setAmount({ currency: form.currency || 'KRW', value: Number(form.amount) });
        await widgetsInstance.renderPaymentMethods({
          selector: '#' + widgetContainerId,
          variantKey: 'DEFAULT',
        });
        uiState.widgetMounted = true;
        showToast('결제위젯이 렌더링되었습니다.', 'success');
      } catch (e) {
        result.error = e.message || String(e);
        showToast('위젯 렌더링 오류: ' + (e.message || e), 'error', 0);
      }
    };

    const testPay = async () => {
      if (!widgetsInstance) { showToast('먼저 위젯을 렌더링하세요.', 'error'); return; }
      uiState.loading = true;
      result.phase = 'paying';
      result.error = '';
      try {
        const payParams = {
          orderId:       form.orderId,
          orderName:     form.orderName,
          customerName:  form.customerName,
          customerEmail: form.customerEmail,
          successUrl:    form.successUrl,
          failUrl:       form.failUrl,
        };
        if (form.customerMobilePhone) payParams.customerMobilePhone = form.customerMobilePhone;
        if (form.taxFreeAmount)       payParams.taxFreeAmount = Number(form.taxFreeAmount);
        if (form.taxExemptionAmount)  payParams.taxExemptionAmount = Number(form.taxExemptionAmount);
        if (form.cultureExpense)      payParams.cultureExpense = true;
        if (form.useEscrow) {
          payParams.useEscrow = true;
          if (form.escrowProducts) {
            try { payParams.escrowProducts = JSON.parse(form.escrowProducts); } catch (_) {}
          }
        }
        if (form.addCardBenefits)     payParams.addCardBenefits = true;
        if (form.appScheme)           payParams.appScheme = form.appScheme;
        if (form.windowTarget)        payParams.windowTarget = form.windowTarget;
        if (form.country !== 'KR')    payParams.country = form.country;
        if (form.currency !== 'KRW')  payParams.currency = form.currency;
        await widgetsInstance.requestPayment(payParams);
        // 리다이렉트가 발생하므로 이 이후 코드는 실행 안 됨
      } catch (e) {
        result.error  = e.message || String(e);
        result.phase  = 'idle';
        uiState.loading = false;
        showToast('결제 오류: ' + (e.message || e), 'error', 0);
      }
    };

    const testConfirmManual = async () => {
      if (!cfg.secretKey) { showToast('Secret Key 를 입력하세요.', 'error'); return; }
      const paymentKey = prompt('paymentKey 를 입력하세요 (토스 리다이렉트 URL 파라미터):');
      if (!paymentKey) return;
      const amount  = parseInt(prompt('amount:') || form.amount);
      const orderId = prompt('orderId:') || form.orderId;
      uiState.loading = true;
      result.phase = 'confirming';
      try {
        const res = await boApi.post('/co/cm/toss/confirm', { paymentKey, amount, orderId }, coUtil.cofApiHdr('토스 결제위젯 테스트', '승인'));
        result.confirmResult = res.data?.data || res.data;
        result.phase = 'done';
        showToast('결제 승인 성공', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message;
        result.phase = 'idle';
        showToast('결제 승인 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const testCancel = async () => {
      if (!result.confirmResult?.paymentKey) { showToast('먼저 결제 승인이 필요합니다.', 'error'); return; }
      const ok = await (window.boApp?.showConfirm || (() => Promise.resolve(true)))('결제 취소', '결제를 취소하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApi.post('/co/cm/toss/cancel', {
          paymentKey:   result.confirmResult.paymentKey,
          cancelReason: '개발자 테스트 취소',
        }, coUtil.cofApiHdr('토스 결제위젯 테스트', '취소'));
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
        if (cfg.clientKey) rows.push({ propKey: 'app.pay.toss.widget-client-key', propValue: cfg.clientKey });
        if (cfg.secretKey) rows.push({ propKey: 'app.pay.toss.secret-key', propValue: cfg.secretKey });
        if (!rows.length) { showToast('저장할 키가 없습니다.', 'error'); return; }
        await boApi.put('/bo/sy/prop/bulk', rows, coUtil.cofApiHdr('토스 결제위젯 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'widget-mount')   return mountWidget();
      if (cmd === 'pay-test')       return testPay();
      if (cmd === 'confirm-manual') return testConfirmManual();
      if (cmd === 'cancel-test')    return testCancel();
      if (cmd === 'keys-save')      return saveKeys();
      if (cmd === 'orderid-refresh') return refreshOrderId();
    };

    /* ##### [05] 폼 컬럼 정의 #################################################### */

    const cfPayParams = Vue.computed(() => {
      const p = [
        { _label: '주문ID',        _param: 'orderId',              _val: form.orderId,              _mono: true,  _color: '#1e40af' },
        { _label: '상품명',        _param: 'orderName',            _val: form.orderName,            _mono: false, _color: '' },
        { _label: '금액(setAmount)',_param: 'amount',              _val: form.amount.toLocaleString() + ' ' + form.currency, _mono: false, _color: '' },
        { _label: '구매자명',      _param: 'customerName',         _val: form.customerName,         _mono: false, _color: '' },
        { _label: '구매자 이메일', _param: 'customerEmail',        _val: form.customerEmail,        _mono: false, _color: '' },
        { _label: '성공 URL',      _param: 'successUrl',           _val: form.successUrl,           _mono: true,  _color: '#1e40af' },
        { _label: '실패 URL',      _param: 'failUrl',              _val: form.failUrl,              _mono: true,  _color: '#6b7280' },
      ];
      if (form.customerMobilePhone) p.push({ _label: '구매자 휴대폰', _param: 'customerMobilePhone', _val: form.customerMobilePhone, _mono: false, _color: '' });
      if (form.taxFreeAmount)       p.push({ _label: '비과세 금액',   _param: 'taxFreeAmount',        _val: form.taxFreeAmount,       _mono: false, _color: '' });
      if (form.taxExemptionAmount)  p.push({ _label: '면세 금액',     _param: 'taxExemptionAmount',   _val: form.taxExemptionAmount,  _mono: false, _color: '' });
      if (form.cultureExpense)      p.push({ _label: '문화비 소득공제',_param: 'cultureExpense',       _val: 'true',                   _mono: false, _color: '#15803d', _badge: 'badge-green' });
      if (form.useEscrow)           p.push({ _label: '에스크로 사용', _param: 'useEscrow',            _val: 'true',                   _mono: false, _color: '#1d4ed8', _badge: 'badge-blue' });
      if (form.useEscrow && form.escrowProducts) p.push({ _label: '에스크로 상품', _param: 'escrowProducts', _val: form.escrowProducts, _mono: true, _color: '' });
      if (form.addCardBenefits)     p.push({ _label: '카드 즉시할인', _param: 'addCardBenefits',      _val: 'true',                   _mono: false, _color: '#c2410c', _badge: 'badge-orange' });
      if (form.appScheme)           p.push({ _label: '앱 복귀 스킴', _param: 'appScheme',            _val: form.appScheme,           _mono: true,  _color: '' });
      if (form.windowTarget)        p.push({ _label: '팝업 창 타겟', _param: 'windowTarget',         _val: form.windowTarget,        _mono: false, _color: '' });
      if (form.currency !== 'KRW')  p.push({ _label: '통화',         _param: 'currency',             _val: form.currency,            _mono: false, _color: '' });
      if (form.country !== 'KR')    p.push({ _label: '국가코드',     _param: 'country',              _val: form.country,             _mono: false, _color: '' });
      return p;
    });

    const previewGridColumns = [
      { key: '_label', label: '항목명',     cellStyle: 'color:#555;font-size:11px;white-space:nowrap' },
      { key: '_param', label: 'param명',    cellStyle: 'color:#8b5cf6;font-size:10px;font-family:monospace' },
      { key: '_val',   label: '값',         fmt: (v, r) => v, cellStyle: (v, r) => (r._mono ? 'font-family:monospace;font-size:10px;word-break:break-all;' : 'font-size:11px;') + (r._color ? 'color:' + r._color + ';' : '') },
    ];

    const baseFormColumns = [
      { key: 'amount',              label: '금액(원)',        type: 'number', hint: 'amount' },
      { key: 'orderId',             label: '주문ID',          type: 'slot',   name: 'orderIdSlot', hint: 'orderId' },
      { key: 'orderName',           label: '상품명',          type: 'text',   hint: 'orderName' },
      { key: 'customerName',        label: '구매자명',        type: 'text',   hint: 'customerName' },
      { key: 'customerEmail',       label: '구매자 이메일',   type: 'text',   hint: 'customerEmail' },
      { key: 'customerMobilePhone', label: '구매자 휴대폰',   type: 'text',   placeholder: '01012345678 (선택)', hint: 'customerMobilePhone' },
      { key: 'successUrl',          label: '결제 성공 콜백',  type: 'text',   colSpan: 2, mono: true, hint: 'successUrl' },
      { key: 'failUrl',             label: '결제 실패 콜백',  type: 'text',   mono: true, hint: 'failUrl' },
    ];

    const hiddenFormColumns = [
      { key: '_sec1', label: '', type: 'slot', name: 'sec1Header', colSpan: 3 },
      { key: 'taxFreeAmount',      label: '비과세 금액',          type: 'number', hint: 'taxFreeAmount' },
      { key: 'taxExemptionAmount', label: '면세 금액',            type: 'number', hint: 'taxExemptionAmount' },
      { key: 'cultureExpense',     label: '문화비 소득공제',      type: 'slot', name: 'cultureExpenseSlot', hint: 'cultureExpense' },
      { key: '_sec2',              label: '', type: 'slot', name: 'sec2Header', colSpan: 3 },
      { key: 'useEscrow',          label: '에스크로 사용',        type: 'slot', name: 'useEscrowSlot', hint: 'useEscrow' },
      { key: 'escrowProducts',     label: '에스크로 상품 (JSON)', type: 'textarea', colSpan: 2,
        placeholder: '[{"id":"PROD-1","name":"상품","unitPrice":1000,"quantity":1}]',
        hint: 'escrowProducts — 필드: id/name/code/unitPrice/quantity/category' },
      { key: '_sec3',              label: '', type: 'slot', name: 'sec3Header', colSpan: 3 },
      { key: 'appScheme',          label: '앱 복귀 스킴',         type: 'text', placeholder: 'shopjoy:// (선택)', mono: true, hint: 'appScheme' },
      { key: 'windowTarget',       label: '팝업 창 타겟',         type: 'select',
        options: [{ value: '', label: '기본 (_self)' }, { value: '_blank', label: '_blank (새 탭)' }, { value: '_top', label: '_top' }],
        hint: 'windowTarget' },
      { key: 'addCardBenefits',    label: '카드 즉시 할인',       type: 'slot', name: 'addCardBenefitsSlot', hint: 'addCardBenefits' },
      { key: '_sec4',              label: '', type: 'slot', name: 'sec4Header', colSpan: 3 },
      { key: 'currency',           label: '통화',                 type: 'select',
        options: [{ value: 'KRW', label: 'KRW (기본)' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' }],
        hint: 'currency' },
      { key: 'country',            label: '국가코드',             type: 'select',
        options: [{ value: 'KR', label: 'KR (기본)' }, { value: 'US', label: 'US' }, { value: 'JP', label: 'JP' }],
        hint: 'country' },
      { key: '_currencyNote',      label: '', type: 'slot', name: 'currencyNote' },
    ];

    return { cfg, form, result, uiState, widgetContainerId, handleBtnAction, baseFormColumns, hiddenFormColumns, cfPayParams, previewGridColumns };
  },

  template: `
<div>
  <div class="page-title">토스페이먼츠 결제위젯 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span><span style="font-size:11px;color:#888;margin-left:8px">결제위젯 전용 키 (test_gck_ / live_gck_ 접두어)</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Widget Client Key (클라이언트)</label>
          <input class="form-control" v-model="cfg.clientKey" placeholder="test_gck_… or live_gck_…" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Secret Key (서버)</label>
          <input class="form-control" v-model="cfg.secretKey" placeholder="test_gsk_… or live_gsk_…" />
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:1px">
          <button class="btn btn_save" @click="handleBtnAction('keys-save')">sy_prop 저장</button>
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;line-height:2">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px;">{{ result.sdkUrl }}</span></div>
        <div>초기화 상태: <strong>{{ result.initDetail || (uiState.sdkLoaded ? '초기화 완료' : '미초기화') }}</strong></div>
      </div>
    </div>
  </div>

  <!-- 결제 파라미터 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">결제 파라미터</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #orderIdSlot>
          <div style="display:flex;gap:4px">
            <input class="form-control" v-model="form.orderId" style="flex:1;font-family:monospace;font-size:12px" />
            <button class="btn btn_reset" @click="handleBtnAction('orderid-refresh')" style="white-space:nowrap">새로고침</button>
          </div>
        </template>
      </bo-form-area>
    </div>
  </div>

  <!-- 히든 전송 항목 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">히든 전송 항목</span>
      <span style="font-size:11px;color:#888;margin-left:8px">requestPayment() 추가 파라미터 — 값 입력/체크 시 전송됨</span>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="hiddenFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #sec1Header>
          <div style="font-size:11px;font-weight:600;color:#6b7280;padding:6px 0 4px;border-bottom:1px solid #f0f0f0;margin-bottom:2px">💰 금액 세부</div>
        </template>
        <template #cultureExpenseSlot>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-top:6px">
            <input type="checkbox" v-model="form.cultureExpense" /> 활성화 (도서/공연/박물관 등)
          </label>
        </template>
        <template #sec2Header>
          <div style="font-size:11px;font-weight:600;color:#6b7280;padding:6px 0 4px;border-bottom:1px solid #f0f0f0;margin-bottom:2px">🛡 에스크로</div>
        </template>
        <template #useEscrowSlot>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-top:6px">
            <input type="checkbox" v-model="form.useEscrow" /> 에스크로 적용
          </label>
        </template>
        <template #sec3Header>
          <div style="font-size:11px;font-weight:600;color:#6b7280;padding:6px 0 4px;border-bottom:1px solid #f0f0f0;margin-bottom:2px">📱 앱/브라우저</div>
        </template>
        <template #addCardBenefitsSlot>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-top:6px">
            <input type="checkbox" v-model="form.addCardBenefits" /> 즉시 할인 혜택 표시
          </label>
        </template>
        <template #sec4Header>
          <div style="font-size:11px;font-weight:600;color:#6b7280;padding:6px 0 4px;border-bottom:1px solid #f0f0f0;margin-bottom:2px">🌍 국가/통화 (해외결제)</div>
        </template>
        <template #currencyNote>
          <div style="font-size:11px;color:#9ca3af;line-height:1.7;padding-top:4px">
            currency/country 는 KRW/KR 외 값 설정 시에만 전송됩니다.<br>
            setAmount() 의 currency 도 동일하게 적용됩니다.
          </div>
        </template>
      </bo-form-area>

      <!-- 전송 미리보기 -->
      <div style="margin-top:14px;padding:10px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px">📋 requestPayment() 전송 파라미터 미리보기</div>
        <bo-grid :columns="previewGridColumns" :rows="cfPayParams" :show-row-num="false"
          style="font-size:11px" />
      </div>
    </div>
  </div>

  <!-- 위젯 렌더링 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">결제위젯</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_preview" :disabled="uiState.loading" @click="handleBtnAction('widget-mount')">위젯 렌더링</button>
        <button class="btn btn_confirm" :disabled="uiState.loading || !uiState.widgetMounted" @click="handleBtnAction('pay-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '결제하기' }}
        </button>
        <button class="btn btn_apply" :disabled="uiState.loading" @click="handleBtnAction('confirm-manual')">수동 승인 (paymentKey 입력)</button>
        <button class="btn btn_delete" :disabled="!result.confirmResult" @click="handleBtnAction('cancel-test')">결제 취소</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-bottom:8px">{{ result.error }}</div>
      <!-- 위젯 마운트 영역 -->
      <div :id="widgetContainerId" style="min-height:200px;border:1px dashed #ddd;border-radius:6px;padding:8px;margin-bottom:8px">
        <div v-if="!uiState.widgetMounted" style="display:flex;align-items:center;justify-content:center;height:160px;color:#aaa;font-size:13px">
          위젯 렌더링 버튼을 클릭하면 여기에 결제 UI가 표시됩니다
        </div>
      </div>
      <!-- 승인 결과 -->
      <div v-if="result.confirmResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 결제 승인 결과</div>
        <bo-grid :columns="[
          { key: 'paymentKey', label: 'paymentKey', cellStyle: 'font-family:monospace;font-size:10px;word-break:break-all;color:#1e40af' },
          { key: 'orderId',    label: 'orderId',    cellStyle: 'font-family:monospace;font-size:11px' },
          { key: 'orderName',  label: 'orderName' },
          { key: 'totalAmount',label: 'totalAmount', fmt: v => (v || 0).toLocaleString() + ' 원', align: 'right' },
          { key: 'status',     label: 'status',     badge: () => 'badge-green' },
          { key: 'method',     label: 'method' },
        ]" :rows="[result.confirmResult]" :show-row-num="false" />
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
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> 토스페이먼츠 개발자센터 → 결제위젯 앱 생성 → 테스트 키 발급 (test_gck_/test_gsk_)<br>
      <b>2.</b> sy_prop <code>app.pay.toss.widget-client-key</code> / <code>app.pay.toss.secret-key</code> 등록<br>
      <b>3.</b> 위젯 렌더링 → 카드/계좌 선택 → 결제하기 → successUrl 로 리다이렉트<br>
      <b>4.</b> 백엔드 <code>POST /api/co/cm/toss/confirm</code> 으로 승인 요청<br>
      <b>5.</b> 취소: <code>POST /api/co/cm/toss/cancel</code> (cancelAmount 없으면 전체 취소)
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/toss" title="application.yml — 토스페이먼츠 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.pay.toss." default-prop-key-filter="app.pay.toss." />
</div>`,
};

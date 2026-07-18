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

    const { reactive, computed, onMounted, onUnmounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    // ── 환경 자동 감지 ──────────────────────────────────────────────────────────
    // local : Live Server(5500/5501) → 백엔드 :8080 별도 포트
    // dev   : 로컬 네트워크 직접 접속(8080, 192.168.x, 10.x)
    // prod  : 외부 도메인(80/443, HTTPS)
    const fnDetectEnv = () => {
      const port     = window.location.port;
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      if (['5500', '5501', '4000', '3000'].includes(port)) {
        return { name: 'local', backendOrigin: protocol + '//' + hostname + ':8080' };
      }
      if (port === '8080' || /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(hostname)) {
        return { name: 'dev', backendOrigin: window.location.origin };
      }
      return { name: 'prod', backendOrigin: window.location.origin };
    };

    const _env = fnDetectEnv();
    const ENV = {
      name:          _env.name,           // 'local' | 'dev' | 'prod'
      backendOrigin: _env.backendOrigin,
      currentOrigin: window.location.origin,
    };

    // ── successUrl / failUrl ─────────────────────────────────────────────────────
    //
    // [successUrl — bo_callback 방식]
    //   토스 결제창 완료 → 브라우저가 bo.html?callback_pay_toss_succ=1&paymentKey=…&orderId=…&amount=… 로 이동
    //   → onMounted에서 URL 파라미터 감지 → 배너 표시 → [승인 요청] 클릭 → 백엔드 POST confirm
    //
    //   ※ 왜 백엔드 GET /confirm을 successUrl로 쓰지 않는가:
    //     현재 백엔드는 POST /api/co/cm/toss/confirm 만 존재.
    //     토스는 successUrl로 GET 리다이렉트를 하므로 GET 엔드포인트가 필요하고,
    //     처리 후 사용자에게 보여줄 완료 페이지로 다시 redirect해야 해서 구현 비용이 높음.
    //     개발 테스트 도구에서는 bo_callback 방식이 파라미터 확인 + 수동 승인에 적합.
    //     운영 FO 주문 흐름에서 GET confirm + redirect 구현 예정.
    //
    // [failUrl — 프론트 복귀 방식]
    //   결제 실패/취소 → 브라우저가 bo.html?callback_pay_toss_fail=1 로 이동 → 에러 토스트 표시
    //   ※ failUrl은 사용자에게 보여줄 화면이므로 반드시 프론트(currentOrigin) URL.
    //      백엔드로 보내면 JSON 응답이 브라우저에 그대로 노출됨.
    //
    // [뒤로가기 완충]
    //   결제창 → bo.html 복귀 시 히스토리 스택: [..., bo.html, 토스결제창, bo.html(현재)]
    //   복귀 감지 후 replaceState(파라미터 제거) + pushState(동일 URL 한 번 더 쌓기) 적용.
    //   뒤로가기 1회 → 같은 bo.html 에 머묾 / 2회 → 토스 결제창(이미 처리된 상태).
    //
    const TOSS_SUCCESS_URL = ENV.currentOrigin + '/bo.html?callback_pay_toss_succ=1';
    const TOSS_FAIL_URL    = ENV.currentOrigin + '/bo.html?callback_pay_toss_fail=1';

    const cfg = reactive({
      clientKey: 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm', // 결제위젯 문서용 테스트 키
      secretKey: '',
    });

    const form = reactive({
      amount:              1000,
      orderId:             'PAY-' + Date.now(),
      orderName:           '테스트 상품',
      customerName:        '송성일',
      customerEmail:       'illeesam@gmail.com',
      customerMobilePhone: '',
      successUrl:          TOSS_SUCCESS_URL,
      failUrl:             TOSS_FAIL_URL,
      taxFreeAmount:       0,
      taxExemptionAmount:  0,
      cultureExpense:      false,
      useEscrow:           false,
      escrowProducts:      '',
      addCardBenefits:     false,
      appScheme:           '',
      windowTarget:        '',
      currency:            'KRW',
      country:             'KR',
    });

    const result = reactive({
      sdkStatus:      '',
      sdkUrl:         '',
      initDetail:     '',
      preResult:      null, // [결제하기] 클릭 시 백엔드 임시저장 결과 (PENDING)
      confirmResult:  null, // [승인 요청] 후 백엔드 최종저장 결과 (DONE)
      cancelResult:   null,
      error:          '',
      phase:          'idle', // idle → pre_saving → pre_saved → paying → callback_received → confirming → done
      callbackParams: null,   // callback_pay_toss_succ 복귀 시 토스가 붙여준 파라미터
    });

    const uiState = reactive({
      sdkLoaded: false, loading: false, widgetMounted: false, diagramOpen: false, erdOpen: false,
      apiPanel1Open: false, apiPanel2Open: false, apiPanel3Open: false, apiPanel4Open: false, apiPanel5Open: false,
    });
    const widgetContainerId = 'toss-widget-container-' + Math.random().toString(36).slice(2);
    let widgetsInstance = null;

    // bo_callback 복귀 감지: ?callback_pay_toss_succ=1&paymentKey=…&orderId=…&amount=…
    const fnCheckCallbackParams = () => {
      const q = {};
      new URLSearchParams(window.location.search).forEach((v, k) => { q[k] = v; });
      const cleanUrl = ENV.currentOrigin + window.location.pathname + window.location.hash;

      if (q.callback_pay_toss_succ === '1' && q.paymentKey && q.orderId && q.amount) {
        result.callbackParams = { paymentKey: q.paymentKey, orderId: q.orderId, amount: Number(q.amount) };
        result.phase = 'callback_received';
        // 파라미터 제거 후 동일 URL pushState → 뒤로가기 1회 완충
        history.replaceState(null, '', cleanUrl);
        history.pushState(null, '', cleanUrl);
        showToast('토스 결제 성공 콜백 수신 — 아래 배너에서 승인 요청하세요.', 'success');

      } else if (q.callback_pay_toss_fail === '1') {
        result.error = '결제 실패 또는 사용자 취소 (토스 failUrl 콜백)';
        result.phase = 'idle';
        history.replaceState(null, '', cleanUrl);
        history.pushState(null, '', cleanUrl);
        showToast(result.error, 'error', 0);
      }
    };

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      // 1) 토스 리다이렉트 복귀 파라미터 선처리
      fnCheckCallbackParams();

      // 2) sy_prop 에서 저장된 키 로드
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

    onUnmounted(() => { widgetsInstance = null; });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = typeof window.TossPayments === 'function';
      uiState.sdkLoaded = ok;
      result.sdkUrl     = 'https://js.tosspayments.com/v2/standard';
      result.sdkStatus  = ok ? '✅ TossPayments SDK 로드됨' : '❌ TossPayments SDK 없음';
      result.initDetail = ok ? ('Widget Client Key: ' + (cfg.clientKey || '(미설정)')) : '';
    };

    const refreshOrderId = () => { form.orderId = 'PAY-' + Date.now(); };

    const mountWidget = async () => {
      if (!cfg.clientKey) { showToast('Widget Client Key 를 입력하세요.', 'error'); return; }
      if (!uiState.sdkLoaded) { showToast('TossPayments SDK 가 로드되지 않았습니다.', 'error', 0); return; }
      result.error = '';
      try {
        const toss = await TossPayments(cfg.clientKey);
        widgetsInstance = toss.widgets({ customerKey: 'ANONYMOUS_' + form.orderId });
        await widgetsInstance.setAmount({ currency: form.currency || 'KRW', value: Number(form.amount) });
        await widgetsInstance.renderPaymentMethods({ selector: '#' + widgetContainerId, variantKey: 'DEFAULT' });
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
      result.error    = '';
      result.preResult = null;

      // ── STEP 1: 결제 직전 — 주문 임시저장 (status=PENDING, paymentKey=null) ──────
      // 목적: 결제창 이탈 후 콜백 없이 세션 유실되더라도 orderId 기준으로 미완 주문 복구 가능
      // 키:   orderId (우리 시스템 발급) → 콜백 후 paymentKey 와 연결
      result.phase = 'pre_saving';
      try {
        const preBody = {
          orderId:      form.orderId,
          orderName:    form.orderName,
          amount:       Number(form.amount),
          currency:     form.currency || 'KRW',
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          pgProvider:   'toss_widget',
          status:       'PENDING',  // 결제 인증 전 임시 상태
          paymentKey:   null,       // 토스 confirm 후 채워짐
        };
        const preRes = await boApi.post('/bo/zd/pay-test/pre-save', preBody, coUtil.cofApiHdr('토스 결제위젯 테스트', '결제전임시저장'));
        result.preResult = preRes.data?.data || preRes.data;
        result.phase = 'pre_saved';
        showToast('주문 임시저장 완료 (PENDING) — 결제창으로 이동합니다.', 'success');
      } catch (e) {
        // pre-save 실패 시 경고만 표시하고 결제는 계속 진행 (테스트 환경 미구현 허용)
        // 운영에서는 pre-save 실패 시 결제 중단 필요
        const isNotImpl = e.response?.status === 404 || e.response?.status === 405;
        if (isNotImpl) {
          result.preResult = { orderId: form.orderId, status: 'PENDING', note: '백엔드 미구현 (테스트 시뮬)' };
          result.phase = 'pre_saved';
          showToast('pre-save API 미구현 — 시뮬레이션으로 계속 진행합니다.', 'success');
        } else {
          result.error    = '[임시저장 실패] ' + (e.response?.data?.message || e.message);
          result.phase    = 'idle';
          uiState.loading = false;
          showToast(result.error, 'error', 0);
          return;
        }
      }

      // ── STEP 2: 토스 결제창 호출 → 리다이렉트 (이후 JS 실행 중단) ────────────────
      result.phase = 'paying';
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
        if (form.addCardBenefits)    payParams.addCardBenefits = true;
        if (form.appScheme)          payParams.appScheme = form.appScheme;
        if (form.windowTarget)       payParams.windowTarget = form.windowTarget;
        if (form.country !== 'KR')   payParams.country = form.country;
        if (form.currency !== 'KRW') payParams.currency = form.currency;
        await widgetsInstance.requestPayment(payParams);
        // 리다이렉트 발생 → 이후 코드 실행 안 됨
      } catch (e) {
        result.error    = e.message || String(e);
        result.phase    = 'pre_saved'; // pre_save 는 성공했으므로 되돌림
        uiState.loading = false;
        showToast('결제 오류: ' + (e.message || e), 'error', 0);
      }
    };

    // bo_callback 복귀 후 배너에서 [승인 요청] 클릭
    const testConfirmAuto = async () => {
      if (!result.callbackParams) return;
      const { paymentKey, orderId, amount } = result.callbackParams;
      await fnConfirm(paymentKey, orderId, amount);
    };

    // 예외 상황 대응 수동 승인 (paymentKey 직접 입력)
    const testConfirmManual = async () => {
      const paymentKey = prompt('paymentKey 를 입력하세요:');
      if (!paymentKey) return;
      const orderId = prompt('orderId:') || form.orderId;
      const amount  = parseInt(prompt('amount (원):') || String(form.amount));
      await fnConfirm(paymentKey, orderId, amount);
    };

    const fnConfirm = async (paymentKey, orderId, amount) => {
      uiState.loading = true;
      result.error    = '';
      result.phase    = 'confirming';
      // ── STEP 3: 토스 서버 승인 + 백엔드 최종저장 ─────────────────────────────────
      // 백엔드 처리 순서:
      //   1) paymentKey + orderId + amount 로 토스 서버 POST /v1/payments/confirm 호출
      //   2) 토스 응답의 paymentKey 로 od_pay.payment_key 업데이트
      //   3) orderId 로 od_order 조회 → status PAID 로 변경
      //   4) 금액 위변조 검증: 토스 응답 totalAmount === 우리 DB 주문금액 불일치 시 에러
      try {
        const res = await boApi.post('/co/cm/toss/confirm', { paymentKey, orderId, amount }, coUtil.cofApiHdr('토스 결제위젯 테스트', '승인'));
        result.confirmResult  = res.data?.data || res.data;
        result.callbackParams = null;
        result.phase          = 'done';
        showToast('결제 승인 + 최종저장 완료 (DONE)', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message || '승인 실패';
        result.phase = result.callbackParams ? 'callback_received' : 'idle';
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
        if (cfg.secretKey) rows.push({ propKey: 'app.pay.toss.secret-key',        propValue: cfg.secretKey });
        if (!rows.length) { showToast('저장할 키가 없습니다.', 'error'); return; }
        await boApi.put('/bo/sy/prop/bulk', rows, coUtil.cofApiHdr('토스 결제위젯 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'widget-mount')    return mountWidget();
      if (cmd === 'pay-test')        return testPay();
      if (cmd === 'confirm-auto')    return testConfirmAuto();
      if (cmd === 'confirm-manual')  return testConfirmManual();
      if (cmd === 'cancel-test')     return testCancel();
      if (cmd === 'keys-save')       return saveKeys();
      if (cmd === 'orderid-refresh') return refreshOrderId();
      if (cmd === 'panel-toggle')    { uiState[param] = !uiState[param]; return; }
      if (cmd === 'receipt-open') {
        if (param) window.open(param, '_blank');
        return;
      }
    };

    /* ##### [05] 폼 컬럼 정의 #################################################### */

    const cfPayParams = computed(() => {
      const p = [
        { _label: '주문ID',         _param: 'orderId',       _val: form.orderId,                                    _mono: true,  _color: '#1e40af' },
        { _label: '상품명',         _param: 'orderName',     _val: form.orderName,                                  _mono: false, _color: '' },
        { _label: '금액(setAmount)', _param: 'amount',       _val: form.amount.toLocaleString() + ' ' + form.currency, _mono: false, _color: '' },
        { _label: '구매자명',       _param: 'customerName',  _val: form.customerName,                               _mono: false, _color: '' },
        { _label: '구매자 이메일',  _param: 'customerEmail', _val: form.customerEmail,                              _mono: false, _color: '' },
        { _label: '성공 URL',       _param: 'successUrl',    _val: form.successUrl,                                 _mono: true,  _color: '#1e40af' },
        { _label: '실패 URL',       _param: 'failUrl',       _val: form.failUrl,                                    _mono: true,  _color: '#6b7280' },
      ];
      if (form.customerMobilePhone) p.push({ _label: '구매자 휴대폰',  _param: 'customerMobilePhone', _val: form.customerMobilePhone, _mono: false, _color: '' });
      if (form.taxFreeAmount)       p.push({ _label: '비과세 금액',    _param: 'taxFreeAmount',        _val: form.taxFreeAmount,       _mono: false, _color: '' });
      if (form.taxExemptionAmount)  p.push({ _label: '면세 금액',      _param: 'taxExemptionAmount',   _val: form.taxExemptionAmount,  _mono: false, _color: '' });
      if (form.cultureExpense)      p.push({ _label: '문화비 소득공제', _param: 'cultureExpense',       _val: 'true', _mono: false, _color: '#15803d', _badge: 'badge-green' });
      if (form.useEscrow)           p.push({ _label: '에스크로 사용',  _param: 'useEscrow',            _val: 'true', _mono: false, _color: '#1d4ed8', _badge: 'badge-blue' });
      if (form.useEscrow && form.escrowProducts) p.push({ _label: '에스크로 상품', _param: 'escrowProducts', _val: form.escrowProducts, _mono: true, _color: '' });
      if (form.addCardBenefits)     p.push({ _label: '카드 즉시할인',  _param: 'addCardBenefits',      _val: 'true', _mono: false, _color: '#c2410c', _badge: 'badge-orange' });
      if (form.appScheme)           p.push({ _label: '앱 복귀 스킴',   _param: 'appScheme',            _val: form.appScheme,           _mono: true,  _color: '' });
      if (form.windowTarget)        p.push({ _label: '팝업 창 타겟',   _param: 'windowTarget',         _val: form.windowTarget,        _mono: false, _color: '' });
      if (form.currency !== 'KRW')  p.push({ _label: '통화',           _param: 'currency',             _val: form.currency,            _mono: false, _color: '' });
      if (form.country !== 'KR')    p.push({ _label: '국가코드',       _param: 'country',              _val: form.country,             _mono: false, _color: '' });
      return p;
    });

    const previewGridColumns = [
      { key: '_label', label: '항목명',  cellStyle: 'color:#555;font-size:11px;white-space:nowrap' },
      { key: '_param', label: 'param명', cellStyle: 'color:#8b5cf6;font-size:10px;font-family:monospace' },
      { key: '_val',   label: '값',      fmt: (v) => v, cellStyle: (v, r) => (r._mono ? 'font-family:monospace;font-size:10px;word-break:break-all;' : 'font-size:11px;') + (r._color ? 'color:' + r._color + ';' : '') },
    ];

    const cfgFormColumns = [
      { key: 'clientKey', label: 'Widget Client Key (클라이언트)', type: 'text', colSpan: 2, mono: true,
        placeholder: 'test_gck_… or live_gck_…', hint: 'clientKey' },
      { key: 'secretKey', label: 'Secret Key (서버)',              type: 'text', mono: true,
        placeholder: 'test_gsk_… or live_gsk_…', hint: 'secretKey' },
    ];

    const baseFormColumns = [
      { key: 'amount',              label: '금액(원)',       type: 'number', hint: 'amount' },
      { key: 'orderId',             label: '주문ID',         type: 'slot',   name: 'orderIdSlot',    hint: 'orderId' },
      { key: 'orderName',           label: '상품명',         type: 'text',   hint: 'orderName' },
      { key: 'customerName',        label: '구매자명',       type: 'text',   hint: 'customerName' },
      { key: 'customerEmail',       label: '구매자 이메일',  type: 'text',   hint: 'customerEmail' },
      { key: 'customerMobilePhone', label: '구매자 휴대폰',  type: 'text',   placeholder: '01012345678 (선택)', hint: 'customerMobilePhone' },
      { key: 'successUrl', label: '결제 성공 콜백', type: 'slot', name: 'successUrlSlot', colSpan: 3, hint: 'successUrl' },
      { key: 'failUrl',    label: '결제 실패 콜백', type: 'slot', name: 'failUrlSlot',    colSpan: 3, hint: 'failUrl' },
    ];

    const hiddenFormColumns = [
      { key: '_sec1',              label: '', type: 'slot', name: 'sec1Header', colSpan: 3 },
      { key: 'taxFreeAmount',      label: '비과세 금액',          type: 'number',   hint: 'taxFreeAmount' },
      { key: 'taxExemptionAmount', label: '면세 금액',            type: 'number',   hint: 'taxExemptionAmount' },
      { key: 'cultureExpense',     label: '문화비 소득공제',      type: 'slot',     name: 'cultureExpenseSlot', hint: 'cultureExpense' },
      { key: '_sec2',              label: '', type: 'slot', name: 'sec2Header', colSpan: 3 },
      { key: 'useEscrow',          label: '에스크로 사용',        type: 'slot',     name: 'useEscrowSlot', hint: 'useEscrow' },
      { key: 'escrowProducts',     label: '에스크로 상품 (JSON)', type: 'textarea', colSpan: 2,
        placeholder: '[{"id":"PROD-1","name":"상품","unitPrice":1000,"quantity":1}]',
        hint: 'escrowProducts — 필드: id/name/code/unitPrice/quantity/category' },
      { key: '_sec3',              label: '', type: 'slot', name: 'sec3Header', colSpan: 3 },
      { key: 'appScheme',          label: '앱 복귀 스킴',  type: 'text',   placeholder: 'shopjoy:// (선택)', mono: true, hint: 'appScheme' },
      { key: 'windowTarget',       label: '팝업 창 타겟',  type: 'select',
        options: [{ value: '', label: '기본 (_self)' }, { value: '_blank', label: '_blank (새 탭)' }, { value: '_top', label: '_top' }],
        hint: 'windowTarget' },
      { key: 'addCardBenefits',    label: '카드 즉시 할인', type: 'slot',   name: 'addCardBenefitsSlot', hint: 'addCardBenefits' },
      { key: '_sec4',              label: '', type: 'slot', name: 'sec4Header', colSpan: 3 },
      { key: 'currency',           label: '통화',     type: 'select',
        options: [{ value: 'KRW', label: 'KRW (기본)' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' }],
        hint: 'currency' },
      { key: 'country',            label: '국가코드', type: 'select',
        options: [{ value: 'KR', label: 'KR (기본)' }, { value: 'US', label: 'US' }, { value: 'JP', label: 'JP' }],
        hint: 'country' },
      { key: '_currencyNote',      label: '', type: 'slot', name: 'currencyNote' },
    ];

    const confirmGridColumns = [
      { key: 'paymentKey',     label: 'paymentKey',     cellStyle: 'font-family:monospace;font-size:10px;word-break:break-all;color:#1e40af' },
      { key: 'orderId',        label: 'orderId',        cellStyle: 'font-family:monospace;font-size:11px' },
      { key: 'orderName',      label: 'orderName' },
      { key: 'totalAmount',    label: 'totalAmount',    fmt: (v) => (v || 0).toLocaleString() + ' 원', align: 'right' },
      { key: 'status',         label: 'status',         badge: () => 'badge-green' },
      { key: 'method',         label: 'method' },
      { key: 'approvedAt',     label: 'approvedAt',     cellStyle: 'font-family:monospace;font-size:10px;color:#6b7280' },
      { key: 'transactionKey', label: 'transactionKey', cellStyle: 'font-family:monospace;font-size:10px;color:#7c3aed' },
      { key: 'receiptUrl',     label: 'receiptUrl',     fmt: (v) => v ? '🧾 링크' : '-',
        cellStyle: (v) => v ? 'color:#1d4ed8;cursor:pointer;text-decoration:underline' : 'color:#aaa' },
    ];

    // 취소 응답 — 결제 상태 요약 (Payment 객체 최상위)
    const cancelSummaryGridColumns = [
      { key: 'paymentKey',        label: 'paymentKey',        cellStyle: 'font-family:monospace;font-size:10px;word-break:break-all;color:#1e40af' },
      { key: 'status',            label: 'status',
        badge: (row) => row.status === 'CANCELED' ? 'badge-red' : 'badge-orange' },
      { key: 'totalAmount',       label: 'totalAmount',       fmt: (v) => (v || 0).toLocaleString() + ' 원', align: 'right' },
      { key: 'balanceAmount',     label: 'balanceAmount',     fmt: (v) => (v || 0).toLocaleString() + ' 원', align: 'right',
        cellStyle: (v) => v === 0 ? 'color:#dc2626;font-weight:700' : 'color:#d97706;font-weight:700' },
      { key: 'isPartialCancelable', label: 'isPartialCancelable',
        fmt: (v) => v ? '✅ 가능' : '❌ 불가',
        cellStyle: (v) => v ? 'color:#15803d' : 'color:#b91c1c' },
    ];

    // 취소 응답 — cancels[] 이력 테이블
    const cancelHistGridColumns = [
      { key: 'cancelAmount',  label: 'cancelAmount',  fmt: (v) => (v || 0).toLocaleString() + ' 원', align: 'right',
        cellStyle: 'color:#dc2626;font-weight:600' },
      { key: 'canceledAt',    label: 'canceledAt',    cellStyle: 'font-family:monospace;font-size:10px;color:#6b7280' },
      { key: 'cancelReason',  label: 'cancelReason' },
      { key: 'transactionKey', label: 'transactionKey', cellStyle: 'font-family:monospace;font-size:10px;color:#7c3aed' },
      { key: 'refundableAmount', label: 'refundableAmount', fmt: (v) => v != null ? (v).toLocaleString() + ' 원' : '-', align: 'right' },
      { key: 'taxFreeAmount', label: 'taxFreeAmount',  fmt: (v) => v != null ? (v).toLocaleString() + ' 원' : '-', align: 'right' },
    ];

    return {
      cfg, form, result, uiState, widgetContainerId,
      handleBtnAction,
      cfgFormColumns, baseFormColumns, hiddenFormColumns,
      cfPayParams, previewGridColumns, confirmGridColumns,
      cancelSummaryGridColumns, cancelHistGridColumns,
      ENV, TOSS_SUCCESS_URL, TOSS_FAIL_URL,
    };
  },

  template: `
<div>
  <div class="page-title">토스페이먼츠 결제위젯 테스트</div>

  <!-- 프로세스 다이어그램 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar" style="cursor:pointer" @click="handleBtnAction('panel-toggle', 'diagramOpen')">
      <span class="list-title">버튼별 프로세스 다이어그램</span>
      <span style="font-size:11px;color:#888;margin-left:8px">위젯렌더링 · 결제하기 · 수동승인 · 결제취소 — 클릭하여 {{ uiState.diagramOpen ? '접기' : '펼치기' }}</span>
      <span style="margin-left:auto;font-size:16px;color:#aaa">{{ uiState.diagramOpen ? '▲' : '▼' }}</span>
    </div>
    <div v-if="uiState.diagramOpen" style="padding:16px 12px;display:flex;flex-direction:column;gap:20px">

      <!-- 공통 스타일 설명 -->
      <div style="display:flex;gap:12px;font-size:11px;color:#555;flex-wrap:wrap;padding:6px 10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0">
        <span><span style="display:inline-block;width:10px;height:10px;background:#dbeafe;border:1px solid #93c5fd;border-radius:2px;margin-right:4px"></span>Frontend (브라우저)</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:#dcfce7;border:1px solid #86efac;border-radius:2px;margin-right:4px"></span>Backend (Spring Boot :8080)</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:#fef9c3;border:1px solid #fde047;border-radius:2px;margin-right:4px"></span>외부 (토스페이먼츠 서버)</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:#fee2e2;border:1px solid #fca5a5;border-radius:2px;margin-right:4px"></span>오류 / 사용자 취소</span>
      </div>

      <!-- 🗂 ERD — 주문/결제/클레임/배송 테이블 관계도 -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
          @click="handleBtnAction('panel-toggle', 'erdOpen')">
          <span style="background:#374151;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">🗂</span>
          주문 · 결제 · 클레임 · 배송 ERD (접기/펼치기)
          <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.erdOpen ? '▲' : '▼' }}</span>
        </div>
        <div v-if="uiState.erdOpen">

          <!-- 라이프사이클 관리 원칙 -->
          <div style="background:#f0f7ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 14px;margin-bottom:10px;font-size:11px;line-height:1.75">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:12px">📐 라이프사이클 관리 원칙 — 이중 레벨 구조</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              <div style="background:#fff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 10px">
                <div style="font-weight:700;color:#6366f1;margin-bottom:4px">od_order_item <span style="font-weight:400;font-size:10px;color:#888">Source of Truth</span></div>
                <div style="color:#333">order_item_status_cd 가 상품별 실제 처리 상태. 부분배송·부분클레임 모두 item 단위로 독립 처리.</div>
              </div>
              <div style="background:#fff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 10px">
                <div style="font-weight:700;color:#3b82f6;margin-bottom:4px">od_order <span style="font-weight:400;font-size:10px;color:#888">집계 요약</span></div>
                <div style="color:#333">order_status_cd 는 활성 item 상태의 집계값. 목록 조회·필터·통계 전용. item 변동 시 재산정.</div>
              </div>
              <div style="background:#fff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 10px">
                <div style="font-weight:700;color:#f97316;margin-bottom:4px">od_claim_item <span style="font-weight:400;font-size:10px;color:#888">독립 공존</span></div>
                <div style="color:#333">클레임 진행 중에도 order_item_status_cd 는 유지. claim_item_status_cd 가 취소·반품·교환 흐름만 추적.</div>
              </div>
            </div>
          </div>

          <!-- 상태 범례 -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:10px;margin-bottom:10px;padding:7px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
            <b style="color:#374151;margin-right:4px">상태 코드 범례:</b>
            <span style="background:#fef9c3;border:1px solid #fde047;border-radius:3px;padding:1px 6px;color:#92400e">PENDING 대기</span>
            <span style="background:#dbeafe;border:1px solid #93c5fd;border-radius:3px;padding:1px 6px;color:#1d4ed8">PAID 결제완료</span>
            <span style="background:#dcfce7;border:1px solid #86efac;border-radius:3px;padding:1px 6px;color:#166534">DONE 승인완료</span>
            <span style="background:#f3e8ff;border:1px solid #d8b4fe;border-radius:3px;padding:1px 6px;color:#5b21b6">PREPARING 준비중</span>
            <span style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:3px;padding:1px 6px;color:#0369a1">SHIPPED 배송중</span>
            <span style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:3px;padding:1px 6px;color:#065f46">COMPLT 완료</span>
            <span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:3px;padding:1px 6px;color:#b91c1c">CANCELED 취소</span>
            <span style="background:#fff7ed;border:1px solid #fdba74;border-radius:3px;padding:1px 6px;color:#c2410c">PARTIAL_CANCELED 부분취소</span>
            <span style="background:#fdf2f8;border:1px solid #f0abfc;border-radius:3px;padding:1px 6px;color:#86198f">CLAIM 클레임중</span>
          </div>

          <!-- ERD 테이블 그리드 -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:10px;margin-bottom:10px">

            <!-- od_order -->
            <div style="background:#fff;border:2px solid #3b82f6;border-radius:8px;overflow:hidden">
              <div style="background:#3b82f6;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">📦 od_order <span style="font-weight:400;font-size:9px;opacity:.85">주문</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> order_id VARCHAR</div>
                <div style="color:#64748b">order_status_cd <span style="color:#1d4ed8">ORDER_STATUS</span></div>
                <div style="color:#64748b">order_amt NUMERIC — 원 주문금액</div>
                <div style="color:#64748b">add_pay_amt NUMERIC — 추가결제 합계</div>
                <div style="color:#64748b">customer_nm / customer_email</div>
                <div style="color:#64748b">site_id / reg_date / upd_date</div>
              </div>
              <div style="background:#eff6ff;padding:4px 10px;font-size:9px;color:#1d4ed8;line-height:1.8">
                <b>ORDER_STATUS</b><br>
                <span style="color:#92400e">PENDING</span> 결제 전 임시저장<br>
                <span style="color:#1d4ed8">PAID</span> 결제 완료<br>
                <span style="color:#5b21b6">PREPARING</span> 출고 준비중<br>
                <span style="color:#0369a1">SHIPPED</span> 배송중 (송장 등록)<br>
                <span style="color:#065f46">COMPLT</span> 배송완료·구매확정<br>
                <span style="color:#b91c1c">CANCELED</span> 전체 취소<br>
                <span style="color:#86198f">CLAIM</span> 클레임 처리중
              </div>
            </div>

            <!-- od_order_item -->
            <div style="background:#fff;border:2px solid #6366f1;border-radius:8px;overflow:hidden">
              <div style="background:#6366f1;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">📋 od_order_item <span style="font-weight:400;font-size:9px;opacity:.85">주문항목</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> order_item_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_id → od_order</div>
                <div style="color:#64748b">item_status_cd <span style="color:#5b21b6">ORDER_ITEM_STATUS</span></div>
                <div style="color:#64748b">prod_id / prod_sku_id / prod_nm</div>
                <div style="color:#64748b">qty / unit_price / item_amt</div>
                <div style="color:#64748b">dliv_tmplt_id / dliv_fee</div>
              </div>
              <div style="background:#eef2ff;padding:4px 10px;font-size:9px;color:#4338ca;line-height:1.8">
                <b>ORDER_ITEM_STATUS</b><br>
                <span style="color:#92400e">PENDING</span> 결제 전<br>
                <span style="color:#1d4ed8">PAID</span> 결제 완료<br>
                <span style="color:#5b21b6">PREPARING</span> 출고 준비중<br>
                <span style="color:#0369a1">SHIPPED</span> 배송중<br>
                <span style="color:#065f46">COMPLT</span> 구매확정<br>
                <span style="color:#b91c1c">CANCELED</span> 항목 취소<br>
                <span style="color:#86198f">CLAIM</span> 클레임 처리중
              </div>
            </div>

            <!-- od_pay -->
            <div style="background:#fff;border:2px solid #7c3aed;border-radius:8px;overflow:hidden">
              <div style="background:#7c3aed;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">💳 od_pay <span style="font-weight:400;font-size:9px;opacity:.85">결제</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> pay_id VARCHAR <span style="color:#dc2626">= 토스 orderId</span></div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_id → od_order</div>
                <div style="color:#64748b">pay_status_cd <span style="color:#7c3aed">PAY_STATUS</span></div>
                <div style="color:#64748b">pay_div_cd — ORDER / CLAIM</div>
                <div style="color:#64748b">pay_occur_type_cd — ORDER / CLAIM_EXTRA / EXCHANGE_EXTRA</div>
                <div style="color:#64748b">pay_amt / pay_method_cd</div>
                <div style="color:#15803d;font-weight:600">payment_key ← 토스 confirm 후 채움</div>
                <div style="color:#64748b">approved_at / receipt_url</div>
              </div>
              <div style="background:#f5f3ff;padding:4px 10px;font-size:9px;color:#5b21b6;line-height:1.8">
                <b>PAY_STATUS</b><br>
                <span style="color:#92400e">PENDING</span> confirm 전 임시<br>
                <span style="color:#065f46">DONE</span> 토스 승인 완료<br>
                <span style="color:#c2410c">PARTIAL_CANCELED</span> 부분취소·잔여 있음<br>
                <span style="color:#b91c1c">CANCELED</span> 전액취소 완료
              </div>
            </div>

            <!-- od_dliv -->
            <div style="background:#fff;border:2px solid #0891b2;border-radius:8px;overflow:hidden">
              <div style="background:#0891b2;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">🚚 od_dliv <span style="font-weight:400;font-size:9px;opacity:.85">배송</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> dliv_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_id → od_order</div>
                <div style="color:#64748b">dliv_status_cd <span style="color:#0369a1">DLIV_STATUS</span></div>
                <div style="color:#64748b">dliv_div_cd — OUTBOUND / INBOUND</div>
                <div style="color:#64748b">courier_cd / invoice_no — 택배사/송장</div>
                <div style="color:#64748b">rcvr_nm / rcvr_phone / rcvr_addr</div>
                <div style="color:#64748b">dliv_fee / dliv_start_date / dliv_end_date</div>
              </div>
              <div style="background:#ecfeff;padding:4px 10px;font-size:9px;color:#0e7490;line-height:1.8">
                <b>DLIV_STATUS</b><br>
                <span style="color:#5b21b6">READY</span> 출고 준비<br>
                <span style="color:#0369a1">SHIPPING</span> 배송중 (송장 등록)<br>
                <span style="color:#065f46">DELIVERED</span> 배송 완료<br>
                <span style="color:#92400e">RETURN_REQ</span> 반품 수거 요청<br>
                <span style="color:#b91c1c">RETURN_DONE</span> 반품 입고 완료<br>
                <span style="color:#64748b">※ INBOUND: 반품 수거 흐름</span>
              </div>
            </div>

            <!-- od_dliv_item -->
            <div style="background:#fff;border:2px solid #0284c7;border-radius:8px;overflow:hidden">
              <div style="background:#0284c7;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">📬 od_dliv_item <span style="font-weight:400;font-size:9px;opacity:.85">배송항목</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> dliv_item_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> dliv_id → od_dliv</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_item_id → od_order_item</div>
                <div style="color:#64748b">qty / dliv_status_cd</div>
              </div>
              <div style="background:#f0f9ff;padding:4px 10px;font-size:9px;color:#0369a1;line-height:1.7">
                od_order_item ↔ od_dliv 의<br>N:M 매핑 (부분출고 대응)
              </div>
            </div>

            <!-- od_claim -->
            <div style="background:#fff;border:2px solid #dc2626;border-radius:8px;overflow:hidden">
              <div style="background:#dc2626;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">⚠ od_claim <span style="font-weight:400;font-size:9px;opacity:.85">클레임(취소/반품/교환)</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> claim_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_id → od_order</div>
                <div style="color:#64748b">claim_status_cd <span style="color:#b91c1c">CLAIM_STATUS</span></div>
                <div style="color:#64748b">claim_type_cd — CANCEL / RETURN / EXCHANGE</div>
                <div style="color:#64748b">claim_reason_cd / claim_reason_detail</div>
                <div style="color:#64748b">req_date / proc_date</div>
              </div>
              <div style="background:#fff5f5;padding:4px 10px;font-size:9px;color:#b91c1c;line-height:1.8">
                <b>CLAIM_STATUS</b><br>
                <span style="color:#92400e">REQ</span> 고객 접수<br>
                <span style="color:#1d4ed8">APPROVED</span> 관리자 승인<br>
                <span style="color:#5b21b6">IN_PROC</span> 처리중 (수거·환불 진행)<br>
                <span style="color:#065f46">DONE</span> 처리 완료<br>
                <span style="color:#b91c1c">REJECTED</span> 반려 (사유 포함)<br>
                <span style="color:#64748b">※ claim_type별 후속 분기</span>
              </div>
            </div>

            <!-- od_claim_item -->
            <div style="background:#fff;border:2px solid #ef4444;border-radius:8px;overflow:hidden">
              <div style="background:#ef4444;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">📋 od_claim_item <span style="font-weight:400;font-size:9px;opacity:.85">클레임 항목</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> claim_item_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> claim_id → od_claim</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> order_item_id → od_order_item</div>
                <div style="color:#64748b">claim_item_status_cd</div>
                <div style="color:#64748b">qty / reason_cd</div>
              </div>
              <div style="background:#fff5f5;padding:4px 10px;font-size:9px;color:#b91c1c;line-height:1.7">
                클레임 대상 주문항목 연결<br>
                부분 취소/반품 지원 (qty 기준)
              </div>
            </div>

            <!-- od_refund -->
            <div style="background:#fff;border:2px solid #ea580c;border-radius:8px;overflow:hidden">
              <div style="background:#ea580c;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">💸 od_refund <span style="font-weight:400;font-size:9px;opacity:.85">환불</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> refund_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> claim_id → od_claim</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> pay_id → od_pay</div>
                <div style="color:#64748b">refund_status_cd — REQ / DONE</div>
                <div style="color:#64748b">refund_amt / refund_method_cd</div>
                <div style="color:#64748b">toss_cancel_key ← 토스 취소 transactionKey</div>
                <div style="color:#64748b">refund_date</div>
              </div>
              <div style="background:#fff7ed;padding:4px 10px;font-size:9px;color:#c2410c;line-height:1.7">
                취소/반품 확정 시 생성<br>
                토스 cancel API 호출 후<br>
                transactionKey 저장
              </div>
            </div>

            <!-- od_pay_method -->
            <div style="background:#fff;border:2px solid #9333ea;border-radius:8px;overflow:hidden">
              <div style="background:#9333ea;color:#fff;font-weight:700;padding:5px 10px;font-size:11px">🔑 od_pay_method <span style="font-weight:400;font-size:9px;opacity:.85">결제수단 상세</span></div>
              <div style="padding:6px 10px;display:flex;flex-direction:column;gap:2px;font-family:monospace">
                <div><span style="color:#f59e0b;font-weight:700">PK</span> pay_method_id VARCHAR</div>
                <div><span style="color:#3b82f6;font-weight:700">FK</span> pay_id → od_pay</div>
                <div style="color:#64748b">method_type_cd — CARD/TRANSFER/EASY</div>
                <div style="color:#64748b">card_no(masked) / card_company</div>
                <div style="color:#64748b">install_months / approve_no</div>
                <div style="color:#64748b">bank_cd / account_no(masked)</div>
              </div>
              <div style="background:#faf5ff;padding:4px 10px;font-size:9px;color:#6b21a8;line-height:1.7">
                토스 Payment 객체의<br>card/transfer/easyPay 필드를<br>관계형으로 정규화
              </div>
            </div>

          </div>

          <!-- 관계도 ASCII -->
          <div style="background:#1e293b;border-radius:8px;padding:12px 14px;font-family:monospace;font-size:10px;color:#e2e8f0;line-height:1.8;overflow-x:auto">
            <div style="color:#94a3b8;margin-bottom:6px;font-size:9px">── 테이블 관계도 (1:N 방향) ─────────────────────────────────────</div>
            <pre style="margin:0;color:#e2e8f0;white-space:pre">od_order (1)
  ├─── od_order_item (N)   ← 주문항목 (상품/SKU별)
  │      └── od_dliv_item (N) ← 배송항목 매핑
  ├─── od_pay (N)          ← 결제 (pay_id = 토스 orderId)
  │      ├── od_pay_method (1) ← 카드/계좌 상세
  │      └── od_refund (N) ← 환불 (클레임 확정 시)
  ├─── od_dliv (N)         ← 배송 (OUTBOUND/INBOUND)
  │      └── od_dliv_item (N) ← 배송항목 매핑
  └─── od_claim (N)        ← 클레임 (CANCEL/RETURN/EXCHANGE)
         ├── od_claim_item (N) ← 클레임 항목 (부분처리)
         └── od_refund (N) ← 환불 연결</pre>
          </div>

          <!-- 결제 취소 플로우 상세 -->
          <div style="margin-top:10px;background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#b91c1c;margin-bottom:8px;font-size:11px">💳 결제 취소 (cancel) 플로우 상세</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:10px">
              <div>
                <div style="font-weight:600;color:#374151;margin-bottom:4px">① 전액 취소 (cancelAmount 생략)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #fca5a5;border-radius:4px;padding:7px;font-size:10px;line-height:1.6;white-space:pre">POST /api/co/cm/toss/cancel
{
  "paymentKey":   "tgen_...",
  "cancelReason": "고객 요청"
  // cancelAmount 생략 → 전액
}

응답 (성공):
{
  "status":        "CANCELED",
  "balanceAmount": 0,         // 취소 가능액 = 0
  "cancels": [{
    "cancelAmount":   1000,
    "canceledAt":     "2026-06-28T...",
    "cancelReason":   "고객 요청",
    "transactionKey": "..."   // 이 취소의 거래키
  }]
}

응답 (실패):
{
  "code":    "ALREADY_CANCELED_PAYMENT",
  "message": "이미 취소된 결제입니다."
}</pre>
              </div>
              <div>
                <div style="font-weight:600;color:#374151;margin-bottom:4px">② 부분 취소 (cancelAmount 지정)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #fca5a5;border-radius:4px;padding:7px;font-size:10px;line-height:1.6;white-space:pre">POST /api/co/cm/toss/cancel
{
  "paymentKey":   "tgen_...",
  "cancelReason": "배송비 환불",
  "cancelAmount": 500        // 부분 금액
}

응답 (성공):
{
  "status":        "DONE",   // 잔여 있으면 DONE
  "totalAmount":   1000,     // 원 결제금액 (불변)
  "balanceAmount": 500,      // 남은 취소 가능액
  "cancels": [
    { "cancelAmount": 500, "canceledAt": "..." }
  ]
}

// 부분취소 2회 → cancels[] 에 2건 누적
// balanceAmount = 0 → status = CANCELED</pre>
              </div>
            </div>
            <div style="margin-top:8px;font-size:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div style="background:#fff7ed;border-radius:4px;padding:6px 8px;color:#c2410c;line-height:1.7">
                ⚠ <b>od_refund 생성 시점:</b><br>
                토스 cancel 성공 후 → od_refund INSERT<br>
                (toss_cancel_key = transactionKey 저장)<br>
                od_pay.pay_status_cd 업데이트<br>
                od_order.order_status_cd → CANCELED
              </div>
              <div style="background:#f0fdf4;border-radius:4px;padding:6px 8px;color:#166534;line-height:1.7">
                ✅ <b>취소 가능 조건:</b><br>
                pay_status_cd = DONE 이어야 함<br>
                balanceAmount &gt; 0 이어야 함<br>
                클레임(CLAIM_TYPE) 확정 후 자동 호출<br>
                운영: od_claim → od_refund → toss cancel
              </div>
            </div>
          </div>

          <!-- 상태 전이 요약 -->
          <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:10px">
            <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:8px 10px">
              <div style="font-weight:700;color:#1d4ed8;margin-bottom:5px">📦 주문 상태 흐름</div>
              <pre style="margin:0;font-size:9px;color:#374151;white-space:pre;line-height:1.8">PENDING   결제 전 임시저장
  ↓
PAID      결제 완료 (confirm 후)
  ↓
PREPARING 출고 준비중
  ↓
SHIPPED   배송중 (송장 등록)
  ↓
COMPLT    배송 완료 / 구매확정
  ↓
CANCELED  전체 취소
CLAIM     클레임 처리중</pre>
            </div>
            <div style="background:#f5f3ff;border:1px solid #d8b4fe;border-radius:6px;padding:8px 10px">
              <div style="font-weight:700;color:#5b21b6;margin-bottom:5px">💳 결제 상태 흐름</div>
              <pre style="margin:0;font-size:9px;color:#374151;white-space:pre;line-height:1.8">PENDING          임시저장 (confirm 전)
  ↓
DONE             토스 confirm 성공
  ↓
PARTIAL_CANCELED 부분취소 (잔여 있음)
  ↓
CANCELED         전액취소 완료

pay_occur_type_cd:
  ORDER          정상 결제
  CLAIM_EXTRA    클레임 추가결제
  EXCHANGE_EXTRA 교환 추가결제</pre>
            </div>
            <div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:6px;padding:8px 10px">
              <div style="font-weight:700;color:#b91c1c;margin-bottom:5px">⚠ 클레임 상태 흐름</div>
              <pre style="margin:0;font-size:9px;color:#374151;white-space:pre;line-height:1.8">REQ     고객 클레임 접수
  ↓
APPROVED 관리자 승인
  ↓
IN_PROC  처리중
  ↓
DONE    처리 완료
REJECTED 반려 (사유 포함)

claim_type_cd:
  CANCEL   주문 취소
  RETURN   반품
  EXCHANGE 교환</pre>
            </div>
          </div>

        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb" />

      <!-- ① 위젯 렌더링 -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#1e40af;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">①</span> 위젯 렌더링 — [위젯 렌더링] 버튼
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;font-size:12px">
        <div style="flex:1;display:flex;align-items:flex-start;gap:0;overflow-x:auto">
          <!-- FE -->
          <div style="min-width:220px;background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:11px">🖥 Frontend</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;color:#1e40af">TossPayments(clientKey)</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">SDK 초기화 (CDN 로드 확인)</div>
              </div>
              <div style="text-align:center;color:#3b82f6;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;color:#1e40af">toss.widgets({customerKey})</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">widgetsInstance 생성</div>
              </div>
              <div style="text-align:center;color:#3b82f6;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;color:#1e40af">widgets.setAmount({currency, value})</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">결제 금액 설정</div>
              </div>
              <div style="text-align:center;color:#3b82f6;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">widgets.renderPaymentMethods({selector})</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">#toss-widget-container에 결제 UI 삽입</div>
              </div>
            </div>
          </div>
          <!-- ① FE → 토스CDN 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:55px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(1)</div>
            <div style="font-size:14px;color:#fbbf24">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(1.1)</div>
            <div style="font-size:14px;color:#fbbf24">⟵</div>
          </div>
          <!-- 외부 -->
          <div style="min-width:200px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:11px">☁ 토스페이먼츠 CDN</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">js.tosspayments.com</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">결제 UI 에셋(CSS/iframe) 로드</div>
              </div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">결제수단 정보 조회</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">카드/계좌/간편결제 목록 렌더</div>
              </div>
            </div>
          </div>
          <div style="min-width:140px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 12px;margin-left:6px;margin-top:8px;align-self:flex-start">
            <div style="font-weight:700;color:#166534;font-size:11px;margin-bottom:6px">⚙ Backend 호출</div>
            <div style="color:#64748b;font-size:11px;background:#fff;border-radius:4px;padding:6px 8px">
              <span style="color:#dc2626">없음</span><br>위젯 렌더링은 전적으로<br>브라우저 ↔ 토스 CDN<br>사이에서 처리됨
            </div>
          </div>
        </div>
        <!-- ① API 상세 패널 -->
        <div style="width:320px;flex-shrink:0">
          <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;overflow:hidden">
            <div style="padding:6px 10px;background:#dbeafe;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
              @click="handleBtnAction('panel-toggle', 'apiPanel1Open')">
              <span style="font-size:11px;font-weight:700;color:#1e40af">📡 API 상세 (접기/펼치기)</span>
              <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.apiPanel1Open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="uiState.apiPanel1Open" style="padding:10px;font-size:11px;display:flex;flex-direction:column;gap:10px">

              <div>
                <div style="font-weight:700;color:#1e40af;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">CDN 로드 (SDK 내부 자동)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// 요청
GET js.tosspayments.com/v2/esm/
  → 인증 없음 (public CDN)
  → 요청 바디 없음

// 응답
SDK JS + CSS + iframe 에셋
  (clientKey 공개키 — 소스 노출 무해)
  (secretKey 절대 FE 노출 금지)</pre>
              </div>

              <div>
                <div style="font-weight:700;color:#1e40af;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">결제수단 조회 (SDK 내부 자동)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #cbd5e1;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// SDK 내부 호출 — 코드 불필요
GET api.tosspayments.com/v1/...

// 요청 파라미터 (SDK 자동 전달)
clientKey: "test_gck_..."
customerKey: "ANONYMOUS"  // 비회원 고정

// 응답 (성공)
[
  { method: "카드", ... },
  { method: "간편결제", ... },
  { method: "계좌이체", ... }
]

// 응답 (실패 — 토스 에러 객체)
{
  "code":    "INVALID_CLIENT_KEY",  // 에러 코드
  "message": "유효하지 않은 클라이언트 키입니다."
}</pre>
              </div>

              <div>
                <div style="font-weight:700;color:#15803d;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">widgets.renderPaymentMethods() 응답</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #86efac;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// 성공 — 반환값 없음 (void)
// #toss-widget-container DOM 에 결제 UI iframe 삽입 완료

// 실패 — Promise reject (try/catch 로 잡아야 함)
{
  "code":    "WIDGET_RENDER_FAILED",
  "message": "결제창을 불러오지 못했습니다."
}
// → 원인: clientKey 오류 / CDN 차단 / DOM 셀렉터 없음</pre>
              </div>

            </div>
          </div>
        </div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb" />

      <!-- ② 결제하기 -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#7c3aed;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#7c3aed;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">②</span> 결제하기 — [결제하기] 버튼
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;font-size:12px">
        <div style="flex:1;display:flex;align-items:flex-start;gap:0;overflow-x:auto">

          <!-- FE -->
          <div style="min-width:250px;background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:11px">🖥 Frontend</div>
            <div style="display:flex;flex-direction:column;gap:5px">

              <!-- STEP1 라벨 -->
              <div style="font-size:10px;font-weight:700;color:#1d4ed8;background:#dbeafe;border-radius:3px;padding:2px 6px;letter-spacing:0.5px">▶ STEP 1 · 결제 전 임시저장</div>

              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;color:#1e40af">POST /bo/zd/pay-test/pre-save</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#374151;font-weight:600">payId</span> <span style="color:#7c3aed;font-weight:700">PAY-1782…</span> <span style="color:#94a3b8">← 우리 BE가 발급 (od_pay PK)</span><br>
                  <span style="color:#374151;font-weight:600">orderId</span> <span style="color:#64748b">= payId</span> <span style="color:#94a3b8">← 토스에 넘길 키 (payId 재사용)</span><br>
                  <span style="color:#374151;font-weight:600">orderName</span> 테스트 상품<br>
                  <span style="color:#374151;font-weight:600">amount</span> 1,000<br>
                  <span style="color:#374151;font-weight:600">customerName</span> 송성일<br>
                  <span style="color:#374151;font-weight:600">pgProvider</span> toss_widget<br>
                  <span style="color:#374151;font-weight:600">status</span> <span style="color:#f59e0b;font-weight:700">PENDING</span><br>
                  <span style="color:#374151;font-weight:600">paymentKey</span> <span style="color:#94a3b8">null ← 아직 미발급</span>
                </div>
              </div>
              <div style="text-align:center;color:#3b82f6;font-size:14px;line-height:1">↓ 임시저장 완료 후</div>

              <!-- STEP2 라벨 -->
              <div style="font-size:10px;font-weight:700;color:#7c3aed;background:#f3e8ff;border-radius:3px;padding:2px 6px;letter-spacing:0.5px">▶ STEP 2 · 토스 결제창 호출</div>

              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #7c3aed">
                <div style="font-weight:600;color:#7c3aed">widgets.requestPayment(params)</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#374151;font-weight:600">orderId</span> PAY-1782… <span style="color:#94a3b8">(= payId, STEP1과 동일)</span><br>
                  <span style="color:#374151;font-weight:600">orderName</span> 테스트 상품<br>
                  <span style="color:#374151;font-weight:600">amount</span> 1,000 (setAmount와 일치)<br>
                  <span style="color:#374151;font-weight:600">successUrl</span> bo.html?callback_pay_toss_succ=1<br>
                  <span style="color:#374151;font-weight:600">failUrl</span> bo.html?callback_pay_toss_fail=1
                </div>
              </div>
              <div style="text-align:center;color:#7c3aed;font-size:14px;line-height:1">↓</div>

              <div style="background:#faf5ff;border-radius:4px;padding:6px 8px;border:1px dashed #a855f7">
                <div style="font-weight:600;color:#7c3aed">⚠ 페이지 이탈</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">브라우저 → 토스 결제창으로 이동<br>이후 JS 실행 중단</div>
              </div>
              <div style="text-align:center;color:#64748b;font-size:11px;line-height:1.8">↓ 결제 완료 후 GET redirect</div>

              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">✅ 성공 복귀</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#374151;font-weight:600">callback_pay_toss_succ</span> 1<br>
                  <span style="color:#374151;font-weight:600">paymentKey</span> <span style="color:#15803d;font-weight:700">tgen_20260628… ← 토스 발급</span><br>
                  <span style="color:#374151;font-weight:600">orderId</span> PAY-1782… (= payId, STEP1과 동일)<br>
                  <span style="color:#374151;font-weight:600">amount</span> 1000 (위변조 검증용)
                </div>
              </div>
              <div style="text-align:center;color:#64748b;font-size:10px">또는</div>
              <div style="background:#fee2e2;border-radius:4px;padding:6px 8px;border-left:3px solid #ef4444">
                <div style="font-weight:600;color:#b91c1c">❌ 실패 복귀</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">callback_pay_toss_fail=1<br>에러 토스트 표시</div>
              </div>
            </div>
          </div>

          <!-- ② FE → BE 화살표 (STEP1) -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:38px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#3b82f6;white-space:nowrap;background:#fff;border:1px solid #93c5fd;border-radius:3px;padding:1px 5px">(2)</div>
            <div style="font-size:11px;color:#3b82f6;white-space:nowrap">STEP1 →</div>
            <div style="font-size:14px;color:#3b82f6">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#3b82f6;white-space:nowrap;background:#fff;border:1px solid #93c5fd;border-radius:3px;padding:1px 5px">(2.1)</div>
            <div style="font-size:11px;color:#3b82f6;white-space:nowrap">← 응답</div>
            <div style="font-size:14px;color:#3b82f6">⟵</div>
          </div>

          <!-- BE -->
          <div style="min-width:230px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:11px">⚙ Backend (Spring Boot)</div>
            <div style="display:flex;flex-direction:column;gap:5px">

              <div style="font-size:10px;font-weight:700;color:#166534;background:#dcfce7;border-radius:3px;padding:2px 6px;letter-spacing:0.5px">▶ STEP 1 · 임시저장 처리</div>

              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">ZdPayTestController</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">POST /bo/zd/pay-test/pre-save</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #7c3aed">
                <div style="font-weight:600;color:#7c3aed">① od_pay 먼저 생성 → payId 결정</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#7c3aed;font-weight:700">pay_id</span> PAY-1782… <span style="color:#94a3b8">← 이게 토스 orderId</span><br>
                  <span style="color:#374151;font-weight:600">pay_status_cd</span> <span style="color:#f59e0b;font-weight:700">PENDING</span><br>
                  <span style="color:#374151;font-weight:600">pay_amt</span> 1,000<br>
                  <span style="color:#374151;font-weight:600">pay_method_cd</span> toss_widget<br>
                  <span style="color:#374151;font-weight:600">pay_occur_type_cd</span> ORDER<br>
                  <span style="color:#374151;font-weight:600">payment_key</span> <span style="color:#94a3b8">null ← confirm 후 채워짐</span>
                </div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">② od_order 임시 생성</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#374151;font-weight:600">order_id</span> ORD-1782… (별도 PK)<br>
                  <span style="color:#374151;font-weight:600">order_status_cd</span> <span style="color:#f59e0b;font-weight:700">PENDING</span><br>
                  <span style="color:#374151;font-weight:600">order_amt</span> 1,000<br>
                  <span style="color:#374151;font-weight:600">customer_nm</span> 송성일
                </div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">임시저장 완료 응답</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">orderId 반환 → FE 결제창 진행</div>
              </div>

              <div style="margin-top:4px;padding:6px 8px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0;font-size:10px;color:#64748b;line-height:1.7">
                💡 결제창 이탈 후 콜백 미수신 시<br>
                orderId 기준으로 PENDING 주문 조회 가능<br>
                → 배치로 미완 주문 정리 가능
              </div>
            </div>
          </div>

          <!-- ② FE → 토스결제창 화살표 (STEP2: 페이지이탈) -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:180px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#a855f7;white-space:nowrap;background:#fff;border:1px solid #d8b4fe;border-radius:3px;padding:1px 5px">(3)</div>
            <div style="font-size:11px;color:#a855f7;white-space:nowrap">STEP2 →</div>
            <div style="font-size:14px;color:#a855f7">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#a855f7;white-space:nowrap;background:#fff;border:1px solid #d8b4fe;border-radius:3px;padding:1px 5px">(3.1)</div>
            <div style="font-size:11px;color:#a855f7;white-space:nowrap">GET redirect ←</div>
            <div style="font-size:14px;color:#a855f7">⟵</div>
          </div>

          <!-- 토스 -->
          <div style="min-width:210px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:11px">☁ 토스페이먼츠 결제창</div>
            <div style="display:flex;flex-direction:column;gap:5px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">결제수단 선택 UI</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">카드 · 계좌이체 · 간편결제</div>
              </div>
              <div style="text-align:center;color:#fbbf24;font-size:14px">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">결제 인증 처리</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">카드사 / 간편결제 앱 연동</div>
              </div>
              <div style="text-align:center;color:#fbbf24;font-size:14px">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #15803d">
                <div style="font-weight:600;color:#15803d">🔑 paymentKey 발급</div>
                <div style="color:#64748b;font-size:10px;margin-top:4px;line-height:1.7">
                  <span style="color:#15803d;font-weight:700">paymentKey</span> tgen_20260628…<br>
                  <span style="color:#374151;font-weight:600">orderId</span> PAY-1782… (= payId, echo)<br>
                  <span style="color:#374151;font-weight:600">amount</span> 1000
                </div>
              </div>
              <div style="text-align:center;color:#fbbf24;font-size:14px">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">GET redirect → successUrl</div>
                <div style="color:#64748b;font-size:10px;margin-top:2px">쿼리스트링으로 전달<br>→ FE가 수신 후 배너 표시</div>
              </div>
            </div>
          </div>

        </div>
        <!-- ② API 상세 패널 -->
        <div style="width:320px;flex-shrink:0">
          <div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:6px;overflow:hidden">
            <div style="padding:6px 10px;background:#f3e8ff;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
              @click="handleBtnAction('panel-toggle', 'apiPanel2Open')">
              <span style="font-size:11px;font-weight:700;color:#7c3aed">📡 API 상세 (접기/펼치기)</span>
              <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.apiPanel2Open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="uiState.apiPanel2Open" style="padding:10px;font-size:11px;display:flex;flex-direction:column;gap:10px">
              <div>
                <div style="font-weight:700;color:#7c3aed;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">STEP1 · 임시저장 (우리 BE)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #d8b4fe;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// 요청
POST /api/bo/zd/pay-test/pre-save
Authorization: BO 세션 (X-UI-Nm 헤더)

{
  "orderName":     "테스트 상품",
  "amount":        1000,
  "customerName":  "홍길동",
  "customerEmail": "test@example.com",
  "pgProvider":    "toss_widget",
  "status":        "PENDING",
  "paymentKey":    null                   // 아직 미발급
}

// BE 처리: od_pay 먼저 INSERT → pay_id 발급
//          → pay_id 를 토스 orderId 로 사용

// 응답 (성공)
{
  "payId":   "PAY-1782601234567",  // ← 이걸 토스 orderId 로 사용
  "status":  "PENDING"
}

// 응답 (실패 — ApiResponse 에러 구조)
HTTP 400 / 500
{
  "code":    "INVALID_AMOUNT",
  "message": "결제 금액이 올바르지 않습니다."
}
// 또는 인증 실패 시:
HTTP 401
{ "code": "UNAUTHORIZED", "message": "로그인이 필요합니다." }</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#7c3aed;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">STEP2 · 결제창 호출 (SDK — BE 없음)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #d8b4fe;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// SDK 호출 (FE only)
widgets.requestPayment({
  orderId:       "PAY-1782601234567",  // ← BE가 반환한 payId
  orderName:     "테스트 상품",
  successUrl:    window.location.origin + "/bo.html?bo_callback=toss_success",
  failUrl:       window.location.origin + "/bo.html?bo_callback=toss_fail",
  customerName:  "홍길동",
  customerEmail: "test@example.com",
})
// BE 호출 없음 — SDK가 토스 서버 직접 통신
// 사용자 인증 완료 시 successUrl로 GET redirect</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#7c3aed;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">STEP2 · 성공 콜백 파라미터</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #d8b4fe;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// GET redirect → successUrl?
paymentKey=tgen_20260628...  // 토스 발급 결제 식별자
orderId=PAY-1782601234567    // = payId (echo, 검증용)
amount=1000                  // ⚠ 위변조 가능 — 서버에서 od_pay.pay_amt 와 반드시 비교</pre>
              </div>
              <div style="background:#f0f9ff;border-radius:4px;padding:7px 9px;font-size:10px;color:#374151;line-height:1.8;border:1px solid #bae6fd">
                💡 <b>orderId (토스)</b> = <b>payId (우리)</b> — od_pay.pay_id 를 토스 orderId 로 그대로 사용. 추가결제도 새 payId 발급으로 자연스럽게 분리<br>
                💡 <b>paymentKey</b> — 토스가 인증 완료 후 발급 (STEP3 confirm 시 od_pay.payment_key 에 저장)<br>
                💡 <b>뒤로가기 완충:</b> 복귀 후 history.replaceState(파라미터 제거) + history.pushState(동일 URL) → 뒤로가기 1회 bo.html 유지
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb" />

      <!-- ③ 승인 요청 (bo_callback 배너 / 수동 승인) -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#0f766e;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#0f766e;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">③</span> 승인 요청 — [승인 요청] 배너 또는 [수동 승인] 버튼
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;font-size:12px">
        <div style="flex:1;display:flex;align-items:flex-start;gap:0;overflow-x:auto">
          <!-- FE -->
          <div style="min-width:230px;background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:11px">🖥 Frontend</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #0f766e">
                <div style="font-weight:600;color:#0f766e">배너 [승인 요청] 클릭</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">callbackParams에서 paymentKey / orderId / amount 추출</div>
              </div>
              <div style="text-align:center;color:#0f766e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #0f766e">
                <div style="font-weight:600;color:#0f766e">POST /api/co/cm/toss/confirm</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">{ paymentKey, orderId, amount }</div>
              </div>
              <div style="text-align:center;color:#0f766e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">승인 결과 표시</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">confirmResult 그리드 노출<br>(paymentKey · status · method · amount)</div>
              </div>
            </div>
          </div>
          <!-- ③ FE → BE 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:40px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#0f766e;white-space:nowrap;background:#fff;border:1px solid #5eead4;border-radius:3px;padding:1px 5px">(4)</div>
            <div style="font-size:11px;color:#0f766e;white-space:nowrap">POST confirm →</div>
            <div style="font-size:14px;color:#0f766e">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#0f766e;white-space:nowrap;background:#fff;border:1px solid #5eead4;border-radius:3px;padding:1px 5px">(6)</div>
            <div style="font-size:11px;color:#0f766e;white-space:nowrap">← 결과 반환</div>
            <div style="font-size:14px;color:#0f766e">⟵</div>
          </div>
          <!-- BE -->
          <div style="min-width:230px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:11px">⚙ Backend (Spring Boot)</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">CmPayTossController</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">POST /api/co/cm/toss/confirm<br>요청 헤더·바디 검증</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">CmPayTossService.confirm()</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">secretKey → Base64 인코딩<br>Authorization: Basic 헤더 생성</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">POST → 토스 서버</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">api.tosspayments.com<br>/v1/payments/confirm</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">승인 응답 반환</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">payment 객체 → ApiResponse.ok(result)</div>
              </div>
            </div>
          </div>
          <!-- ③ BE → 토스서버 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:70px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(5)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">→ 토스API</div>
            <div style="font-size:14px;color:#fbbf24">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(5.1)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">← 승인결과</div>
            <div style="font-size:14px;color:#fbbf24">⟵</div>
          </div>
          <!-- 토스 -->
          <div style="min-width:180px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:11px">☁ 토스페이먼츠 서버</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">결제 승인 처리</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">카드사 매입 요청<br>결제 상태 DONE 전환</div>
              </div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">승인 결과 응답</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">paymentKey · status · method<br>totalAmount · approvedAt</div>
              </div>
            </div>
          </div>
        </div>
        <!-- ③ API 상세 패널 -->
        <div style="width:320px;flex-shrink:0">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;overflow:hidden">
            <div style="padding:6px 10px;background:#dcfce7;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
              @click="handleBtnAction('panel-toggle', 'apiPanel3Open')">
              <span style="font-size:11px;font-weight:700;color:#0f766e">📡 API 상세 (접기/펼치기)</span>
              <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.apiPanel3Open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="uiState.apiPanel3Open" style="padding:10px;font-size:11px;display:flex;flex-direction:column;gap:10px">
              <div>
                <div style="font-weight:700;color:#0f766e;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">승인 요청 (우리 BE → 토스 서버)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #86efac;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// FE → 우리 BE
POST /api/co/cm/toss/confirm
{
  "paymentKey": "tgen_20260628...",  // 토스 발급
  "orderId":    "PAY-1782601234",    // = payId (검증용)
  "amount":     1000                 // ⚠ 위변조 — BE에서 od_pay.pay_amt 와 비교
}

// 우리 BE → 토스 서버
POST api.tosspayments.com/v1/payments/confirm
Authorization: Basic {Base64(secretKey:)}  // secretKey + 콜론 인코딩
Content-Type: application/json
{
  "paymentKey": "tgen_...",
  "orderId":    "PAY-...",           // payId 그대로 전달
  "amount":     1000
}</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#0f766e;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">토스 응답 — Payment 객체 (성공)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #86efac;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">HTTP 200
{
  "paymentKey":    "tgen_...",         // 토스 결제 식별자 → od_pay.payment_key
  "orderId":       "PAY-...",          // = payId (echo)
  "status":        "DONE",            // 승인 완료
  "method":        "카드",             // 카드/간편결제/계좌이체 등
  "totalAmount":   1000,              // 승인 금액 ⚠ DB 금액과 반드시 일치 검증
  "balanceAmount": 1000,              // 취소 가능 잔여 금액 (최초 = totalAmount)
  "approvedAt":    "2026-06-28T...",  // 카드사 실제 승인 일시 → od_pay.approved_at
  "transactionKey":"...",             // 이 결제 건 거래 식별자
  "receiptUrl":    "https://...",     // 토스 전자영수증 URL → od_pay.receipt_url
  "isPartialCancelable": true,        // 부분취소 가능 여부
  "suppliedAmount": 909,              // 공급가액 (부가세 별도)
  "vat":           91,                // 부가세
  "taxFreeAmount": 0,                 // 면세 금액
  "card": {
    "number":                "****-****-****-1234",  // 마스킹 카드번호
    "installmentPlanMonths": 0,                      // 할부 개월 (0=일시불)
    "approveNo":             "00000000"              // 카드사 승인번호
  }
}</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#dc2626;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">토스 응답 — 실패 (에러 객체)</div>
                <pre style="margin:0;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">HTTP 400 / 403 / 500
{
  "code":    "PAY_PROCESS_ABORTED",        // 결제 중단 (사용자 취소)
  "message": "결제가 취소되었습니다."
}
// 주요 실패 코드:
// ALREADY_PROCESSED_PAYMENT — 이미 처리된 결제
// PROVIDER_ERROR             — 카드사/PG 오류
// INVALID_AUTHORIZE_AUTH     — 인증 불일치 (위변조 의심)
// EXCEED_MAX_DAILY_PAYMENT_COUNT — 일 최대 결제 횟수 초과
// INVALID_STOPPED_CARD       — 이용 정지 카드

// ⚠ BE 에서 amount 위변조 감지 시 즉시 cancel 후 에러:
{
  "code":    "AMOUNT_MISMATCH",
  "message": "결제 금액 불일치. 즉시 취소 처리됨."
}</pre>
              </div>
              <div style="background:#fef3c7;border-radius:4px;padding:6px 8px;color:#92400e;font-size:10px;line-height:1.6">
                💡 amount 위변조 방지: BE에서 DB 저장 금액과 토스 응답 totalAmount 를 반드시 비교. 불일치 시 즉시 취소 후 에러 반환.<br>
                💡 <b>수동 승인:</b> [수동 승인] 버튼 → prompt로 paymentKey · orderId · amount 직접 입력 → 동일 confirm 흐름 (URL 파라미터 유실 대응용).
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb" />

      <!-- ④ 결제 취소 -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#dc2626;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">④</span> 결제 취소 — [결제 취소] 버튼
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;font-size:12px">
        <div style="flex:1;display:flex;align-items:flex-start;gap:0;overflow-x:auto">
          <!-- FE -->
          <div style="min-width:230px;background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:11px">🖥 Frontend</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #dc2626">
                <div style="font-weight:600;color:#dc2626">showConfirm('결제 취소')</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">사용자 최종 확인 모달</div>
              </div>
              <div style="text-align:center;color:#dc2626;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #dc2626">
                <div style="font-weight:600;color:#dc2626">POST /api/co/cm/toss/cancel</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">{ paymentKey, cancelReason }<br>cancelAmount 생략 = 전액</div>
              </div>
              <div style="text-align:center;color:#dc2626;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">취소 결과 표시</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">cancelResult JSON 노출</div>
              </div>
            </div>
          </div>
          <!-- ④ FE → BE 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:40px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#dc2626;white-space:nowrap;background:#fff;border:1px solid #fca5a5;border-radius:3px;padding:1px 5px">(7)</div>
            <div style="font-size:11px;color:#dc2626;white-space:nowrap">POST cancel →</div>
            <div style="font-size:14px;color:#dc2626">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#dc2626;white-space:nowrap;background:#fff;border:1px solid #fca5a5;border-radius:3px;padding:1px 5px">(9)</div>
            <div style="font-size:11px;color:#dc2626;white-space:nowrap">← 결과 반환</div>
            <div style="font-size:14px;color:#dc2626">⟵</div>
          </div>
          <!-- BE -->
          <div style="min-width:230px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:11px">⚙ Backend (Spring Boot)</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #ef4444">
                <div style="font-weight:600;color:#dc2626">CmPayTossController</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">POST /api/co/cm/toss/cancel</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #ef4444">
                <div style="font-weight:600;color:#dc2626">CmPayTossService.cancel()</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">cancelAmount null → 전액 취소<br>cancelAmount 지정 → 부분 취소</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">POST → 토스 서버</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">api.tosspayments.com<br>/v1/payments/{paymentKey}/cancel</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">취소 응답 반환</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">cancels 배열 포함 payment 객체</div>
              </div>
            </div>
          </div>
          <!-- ④ BE → 토스서버 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:70px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(8)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">→ 토스API</div>
            <div style="font-size:14px;color:#fbbf24">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(8.1)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">← 취소결과</div>
            <div style="font-size:14px;color:#fbbf24">⟵</div>
          </div>
          <!-- 토스 -->
          <div style="min-width:180px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:11px">☁ 토스페이먼츠 서버</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">취소 처리</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">카드사 취소 매입<br>전액 / 부분 분기</div>
              </div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">CANCELED 상태 전환</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">cancels[].cancelAmount<br>cancels[].canceledAt 반환</div>
              </div>
            </div>
          </div>
        </div>
        <!-- ④ API 상세 패널 -->
        <div style="width:320px;flex-shrink:0">
          <div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:6px;overflow:hidden">
            <div style="padding:6px 10px;background:#fee2e2;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
              @click="handleBtnAction('panel-toggle', 'apiPanel4Open')">
              <span style="font-size:11px;font-weight:700;color:#dc2626">📡 API 상세 (접기/펼치기)</span>
              <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.apiPanel4Open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="uiState.apiPanel4Open" style="padding:10px;font-size:11px;display:flex;flex-direction:column;gap:10px">
              <div>
                <div style="font-weight:700;color:#dc2626;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">취소 요청 (우리 BE → 토스 서버)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #fca5a5;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// FE → 우리 BE
POST /api/co/cm/toss/cancel
{
  "paymentKey":   "tgen_20260628...",  // 토스 발급 결제 식별자
  "cancelReason": "고객 요청",
  "cancelAmount": 500                  // 부분취소 금액 (생략 시 전액 취소)
}

// 우리 BE → 토스 서버
POST api.tosspayments.com
     /v1/payments/{paymentKey}/cancel
Authorization: Basic {Base64(secretKey:)}
{
  "cancelReason": "고객 요청",
  "cancelAmount": 500                  // null 이면 전액 취소
}</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#dc2626;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">토스 응답 — Payment 객체 (취소 후)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #fca5a5;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">{
  "status":              "DONE",       // 부분취소=DONE / 전액취소=CANCELED
  "totalAmount":         1000,         // 원 결제금액 (취소해도 불변)
  "balanceAmount":       500,          // 남은 취소 가능 금액 (0이면 종료)
  "isPartialCancelable": true,         // 추가 부분취소 가능 여부
  "cancels": [                         // 누적 취소 이력 배열
    {
      "cancelAmount":    500,          // 이번 차감 금액
      "canceledAt":      "2026-06-28T12:34:56+09:00",  // 취소 완료 일시
      "cancelReason":    "고객 요청",
      "transactionKey":  "...",        // 이번 취소의 거래 식별자 (매 취소마다 새로 발급)
      "refundableAmount": 500,         // 실제 환급 가능액 (면세 분리 후)
      "taxFreeAmount":   0             // 면세 취소 금액
    }
    // 부분취소 2회면 cancels[] 2건 누적
  ]
}</pre>
              </div>
              <div style="background:#fef3c7;border-radius:4px;padding:6px 8px;color:#92400e;font-size:10px;line-height:1.6">
                💡 취소 후 별도 조회 없이 응답 그대로 사용 가능.<br>
                balanceAmount = 0 이면 status = CANCELED 로 전환.<br>
                paymentKey 는 불변, transactionKey 는 취소마다 새로 발급.
              </div>
              <div style="background:#fff5f5;border-radius:4px;padding:6px 8px;color:#b91c1c;font-size:10px;line-height:1.6;border:1px solid #fca5a5">
                ⚠ <b>이 화면은 개발 테스트용</b> — od_order / od_pay 도메인 후처리(DB 반영, 재고 복구 등)는 실행되지 않습니다.<br>
                운영 취소는 주문관리 → 클레임 처리 → OdRefund 엔티티 연동으로 별도 구현.
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb" />

      <!-- ⑤ 배송비 추가결제 -->
      <div>
        <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span style="background:#0369a1;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">⑤</span> 배송비 추가결제 — 같은 주문에 별도 결제 건 추가
        </div>

        <!-- 핵심 제약 설명 -->
        <div style="background:#f0f9ff;border:1px solid #7dd3fc;border-radius:6px;padding:9px 12px;margin-bottom:12px;font-size:11px;color:#0c4a6e;line-height:1.8">
          ✅ <b>토스 orderId = od_pay.pay_id 정책 적용:</b> 결제 건마다 새 od_pay 행을 생성하면 새 pay_id 가 발급되고,
          그것이 곧 새 토스 orderId가 됩니다. orderId 충돌 없이 추가결제가 자연스럽게 분리됩니다.<br>
          예) 원 결제 <code style="background:#fff;padding:1px 5px;border-radius:3px">pay_id = PAY-001</code> (pay_occur_type_cd = ORDER)
          → 추가결제 <code style="background:#fff;padding:1px 5px;border-radius:3px">pay_id = PAY-002</code> (pay_occur_type_cd = CLAIM_EXTRA)
          → 둘 다 <code style="background:#fff;padding:1px 5px;border-radius:3px">order_id = ORD-001</code> FK로 같은 주문에 연결
        </div>

        <div style="display:flex;align-items:flex-start;gap:12px;font-size:12px">
        <div style="flex:1;display:flex;align-items:flex-start;gap:0;overflow-x:auto">

          <!-- FE -->
          <div style="min-width:250px;background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:8px;font-size:11px">🖥 Frontend (관리자 화면)</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #0369a1">
                <div style="font-weight:600;color:#0369a1">추가결제 금액 입력</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">배송비 금액 + 사유 입력<br>(관리자가 직접 지정)</div>
              </div>
              <div style="text-align:center;color:#0369a1;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;color:#1e40af">STEP1 · 추가결제 pre-save</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">pay_occur_type_cd = "CLAIM_EXTRA"<br>pay_div_cd = "CLAIM"<br>ref_order_id = "ORD-001"<br>amount = 배송비</div>
              </div>
              <div style="text-align:center;color:#3b82f6;font-size:16px;line-height:1">↓</div>
              <div style="background:#faf5ff;border-radius:4px;padding:6px 8px;border-left:3px solid #7c3aed">
                <div style="font-weight:600;color:#7c3aed">STEP2 · 결제창 호출</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">새 orderId로 widgets.requestPayment()<br>고객이 결제 완료 → GET redirect</div>
              </div>
              <div style="text-align:center;color:#0369a1;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #0f766e">
                <div style="font-weight:600;color:#0f766e">STEP3 · confirm</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px;font-family:monospace">POST /co/cm/toss/confirm<br>{ paymentKey, orderId, amount }</div>
              </div>
              <div style="text-align:center;color:#0f766e;font-size:16px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">추가결제 완료 표시</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">od_pay 2번째 행 생성<br>원 주문과 ref_order_id 연결</div>
              </div>
            </div>
          </div>

          <!-- FE → BE 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:60px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#0369a1;white-space:nowrap;background:#fff;border:1px solid #7dd3fc;border-radius:3px;padding:1px 5px">(A1)</div>
            <div style="font-size:11px;color:#0369a1;white-space:nowrap">pre-save →</div>
            <div style="font-size:14px;color:#0369a1">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#0369a1;white-space:nowrap;background:#fff;border:1px solid #7dd3fc;border-radius:3px;padding:1px 5px">(A3)</div>
            <div style="font-size:11px;color:#0369a1;white-space:nowrap">confirm →</div>
            <div style="font-size:14px;color:#0369a1">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#0369a1;white-space:nowrap;background:#fff;border:1px solid #7dd3fc;border-radius:3px;padding:1px 5px">(A4)</div>
            <div style="font-size:11px;color:#0369a1;white-space:nowrap">← 결과</div>
            <div style="font-size:14px;color:#0369a1">⟵</div>
          </div>

          <!-- BE -->
          <div style="min-width:240px;background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:11px">⚙ Backend (Spring Boot)</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">ZdPayTestController (또는 OdPayController)</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">POST /bo/zd/pay-test/pre-save</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#166534">od_pay 추가 행 생성</div>
                <div style="color:#64748b;font-size:11px;margin-top:4px;line-height:1.7">
                  <span style="color:#7c3aed;font-weight:700">pay_id</span> PAY-002 ← 자동 발급 = 토스 orderId<br>
                  <span style="color:#374151;font-weight:600">order_id</span> ORD-001 (원 주문 FK 유지)<br>
                  <span style="color:#374151;font-weight:600">pay_occur_type_cd</span> <span style="color:#7c3aed;font-weight:700">CLAIM_EXTRA</span><br>
                  <span style="color:#374151;font-weight:600">pay_status_cd</span> PENDING<br>
                  <span style="color:#374151;font-weight:600">pay_amt</span> 배송비 금액
                </div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #0f766e">
                <div style="font-weight:600;color:#166534">CmPayTossService.confirm()</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">토스 confirm 호출<br>od_pay.payment_key 저장<br>pay_status_cd = DONE</div>
              </div>
              <div style="text-align:center;color:#22c55e;font-size:14px;line-height:1">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">od_order.add_pay_amt 갱신</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">원 주문 합계에 배송비 반영<br>(order_amt는 불변 · add_pay_amt 별도 관리)</div>
              </div>
            </div>
          </div>

          <!-- BE → 토스 화살표 -->
          <div style="display:flex;flex-direction:column;align-items:center;padding:0 4px;margin-top:140px;gap:2px">
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(A2)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">STEP2 →</div>
            <div style="font-size:14px;color:#fbbf24">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(A2.1)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">← redirect</div>
            <div style="font-size:14px;color:#fbbf24">⟵</div>
            <div style="margin-top:12px;font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(A3.1)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">confirm →</div>
            <div style="font-size:14px;color:#fbbf24">⟶</div>
            <div style="font-size:10px;font-weight:700;color:#fbbf24;white-space:nowrap;background:#fff;border:1px solid #fde047;border-radius:3px;padding:1px 5px">(A3.2)</div>
            <div style="font-size:11px;color:#fbbf24;white-space:nowrap">← 승인결과</div>
            <div style="font-size:14px;color:#fbbf24">⟵</div>
          </div>

          <!-- 토스 -->
          <div style="min-width:180px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:8px;font-size:11px">☁ 토스페이먼츠 서버</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #a855f7">
                <div style="font-weight:600;color:#7c3aed">결제창 (STEP2)</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">orderId = PAY-002 (새 pay_id)<br>토스가 결제 인증 처리</div>
              </div>
              <div style="text-align:center;color:#fbbf24;font-size:14px">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #fbbf24">
                <div style="font-weight:600;color:#92400e">결제 승인 (STEP3)</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">POST /v1/payments/confirm<br>별도 paymentKey 발급</div>
              </div>
              <div style="text-align:center;color:#fbbf24;font-size:14px">↓</div>
              <div style="background:#fff;border-radius:4px;padding:6px 8px;border-left:3px solid #22c55e">
                <div style="font-weight:600;color:#15803d">Payment 객체 반환</div>
                <div style="color:#64748b;font-size:11px;margin-top:2px">status: DONE<br>새 paymentKey 포함</div>
              </div>
            </div>
          </div>

        </div>
        <!-- ⑤ API 상세 패널 -->
        <div style="width:320px;flex-shrink:0">
          <div style="background:#f0f9ff;border:1px solid #7dd3fc;border-radius:6px;overflow:hidden">
            <div style="padding:6px 10px;background:#e0f2fe;display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none"
              @click="handleBtnAction('panel-toggle', 'apiPanel5Open')">
              <span style="font-size:11px;font-weight:700;color:#0369a1">📡 API 상세 (접기/펼치기)</span>
              <span style="margin-left:auto;font-size:12px;color:#64748b">{{ uiState.apiPanel5Open ? '▲' : '▼' }}</span>
            </div>
            <div v-if="uiState.apiPanel5Open" style="padding:10px;font-size:11px;display:flex;flex-direction:column;gap:10px">
              <div>
                <div style="font-weight:700;color:#0369a1;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">STEP1 · 추가결제 pre-save</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #7dd3fc;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// FE → 우리 BE
POST /api/bo/zd/pay-test/pre-save
{
  "orderName":      "배송비 추가결제",
  "amount":         3000,             // 배송비 금액
  "pgProvider":     "toss_widget",
  "payOccurTypeCd": "CLAIM_EXTRA",   // 추가결제 구분 (실 DB 컬럼)
  "payDivCd":       "CLAIM",
  "refOrderId":     "ORD-001",       // 원 주문 연결
  "status":         "PENDING",
  "paymentKey":     null
}

// BE 처리: 새 od_pay INSERT → 새 pay_id 자동 발급
//          → 이 pay_id 가 토스 orderId (suffix 불필요!)
pay_id           = "PAY-002"         // ← 새로 발급된 PK = 토스 orderId
order_id         = "ORD-001"         // 원 주문 FK
pay_occur_type_cd= "CLAIM_EXTRA"
pay_div_cd       = "CLAIM"
pay_amt          = 3000
pay_status_cd    = "PENDING"</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#0369a1;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">STEP2~3 · 결제창→승인 (②③과 동일 흐름)</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #7dd3fc;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">// STEP2: SDK (FE only)
widgets.requestPayment({
  orderId:    "PAY-002",             // ← BE가 반환한 새 payId
  orderName:  "배송비 추가결제",
  amount:     3000,
  successUrl: ".../bo.html?bo_callback=toss_success",
  failUrl:    ".../bo.html?bo_callback=toss_fail",
})

// STEP3: confirm (②③과 완전 동일)
POST /api/co/cm/toss/confirm
{
  "paymentKey": "tgen_NEW...",       // 새 paymentKey (토스 발급)
  "orderId":    "PAY-002",           // = 새 payId
  "amount":     3000
}

// BE 처리 후 od_pay 갱신
payment_key      = "tgen_NEW..."
pay_status_cd    = "DONE"
pay_occur_type_cd= "CLAIM_EXTRA"

od_order:
  // 필요 시 add_pay_amt += 3000 갱신</pre>
              </div>
              <div>
                <div style="font-weight:700;color:#0369a1;margin-bottom:4px;font-size:10px;letter-spacing:0.5px">DB 결과 — 한 주문에 od_pay 2행</div>
                <pre style="margin:0;background:#f8fafc;border:1px solid #7dd3fc;border-radius:4px;padding:8px;font-size:10px;line-height:1.6;overflow-x:auto;white-space:pre">od_pay 테이블 (같은 order_id 에 2행)
┌──────────────────────────────────────────┐
│ pay_id   : PAY-001  ← 토스 orderId      │
│ order_id : ORD-001  ← 주문 FK           │
│ pay_occur_type_cd: ORDER  (원 결제)      │
│ pay_amt  : 10,000   pay_status_cd: DONE  │
│ payment_key: tgen_ORIGINAL...            │
├──────────────────────────────────────────┤
│ pay_id   : PAY-002  ← 토스 orderId      │ ← 새 PK
│ order_id : ORD-001  ← 같은 주문 FK      │
│ pay_occur_type_cd: CLAIM_EXTRA (배송비)  │
│ pay_amt  : 3,000    pay_status_cd: DONE  │
│ payment_key: tgen_NEW...                 │
└──────────────────────────────────────────┘</pre>
              </div>
              <div style="background:#eff6ff;border-radius:4px;padding:6px 8px;color:#1e40af;font-size:10px;line-height:1.7">
                ✅ <b>payId = 토스 orderId 정책:</b> 새 od_pay 행을 INSERT 하면 새 pay_id 가 자동 발급 → suffix 규칙 불필요.<br>
                추가결제가 여러 번이어도 pay_id 가 자동으로 달라지므로 토스 orderId 중복 없음.<br>
                💡 <b>취소 시:</b> 각 pay_id(= orderId) 의 paymentKey로 독립적으로 cancel 호출.
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 전체 흐름 요약 -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px">
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px">📋 전체 흐름 요약 (번호 = 화살표 흐름 순서)</div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;font-size:11px;line-height:2">
          <span style="background:#dbeafe;border:1px solid #93c5fd;border-radius:4px;padding:3px 8px;color:#1d4ed8">① 위젯 렌더링</span>
          <span style="color:#94a3b8;font-family:monospace">(1)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 CDN</span>
          <span style="color:#94a3b8;font-family:monospace">←(1.1)</span>
          <span style="color:#94a3b8">/ BE 없음</span>
          <br style="width:100%" />
          <span style="background:#dbeafe;border:1px solid #93c5fd;border-radius:4px;padding:3px 8px;color:#7c3aed">② 결제하기</span>
          <span style="color:#94a3b8;font-family:monospace">(2)→</span>
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">BE pre-save</span>
          <span style="color:#94a3b8;font-family:monospace">←(2.1)</span>
          <span style="color:#94a3b8;font-family:monospace">(3)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 결제창</span>
          <span style="color:#94a3b8;font-family:monospace">←(3.1)</span>
          <span style="color:#94a3b8">GET redirect bo.html 복귀</span>
          <br style="width:100%" />
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#0f766e">③ 배너→승인 요청</span>
          <span style="color:#94a3b8;font-family:monospace">(4)→</span>
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">BE confirm</span>
          <span style="color:#94a3b8;font-family:monospace">(5)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 API</span>
          <span style="color:#94a3b8;font-family:monospace">←(5.1)</span>
          <span style="color:#94a3b8;font-family:monospace">←(6)</span>
          <span style="color:#94a3b8">FE 결과 표시</span>
          <br style="width:100%" />
          <span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:3px 8px;color:#dc2626">④ 결제 취소 (선택)</span>
          <span style="color:#94a3b8;font-family:monospace">(7)→</span>
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">BE cancel</span>
          <span style="color:#94a3b8;font-family:monospace">(8)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 API</span>
          <span style="color:#94a3b8;font-family:monospace">←(8.1)</span>
          <span style="color:#94a3b8;font-family:monospace">←(9)</span>
          <span style="color:#94a3b8">FE 결과 표시</span>
          <br style="width:100%" />
          <span style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:4px;padding:3px 8px;color:#0369a1">⑤ 배송비 추가결제</span>
          <span style="color:#94a3b8;font-family:monospace">(A1)→</span>
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">BE pre-save (새 orderId)</span>
          <span style="color:#94a3b8;font-family:monospace">(A2)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 결제창</span>
          <span style="color:#94a3b8;font-family:monospace">←(A2.1)</span>
          <span style="color:#94a3b8;font-family:monospace">(A3)→</span>
          <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">BE confirm</span>
          <span style="color:#94a3b8;font-family:monospace">(A3.1)→</span>
          <span style="background:#fef9c3;border:1px solid #fde047;border-radius:4px;padding:3px 8px;color:#92400e">토스 API</span>
          <span style="color:#94a3b8;font-family:monospace">←(A3.2)←(A4)</span>
          <span style="color:#94a3b8">od_pay 2행째 생성</span>
        </div>
      </div>

      <!-- Q&A -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          <span style="background:#7c3aed;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px">Q&amp;A</span>
          자주 발생하는 상황별 원인 &amp; 대처법
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;font-size:12px">

          <!-- Q1 -->
          <div style="border:1px solid #e0e7ff;border-radius:6px;overflow:hidden">
            <div style="background:#e0e7ff;padding:7px 12px;font-weight:700;color:#3730a3;display:flex;align-items:center;gap:6px">
              <span style="color:#7c3aed">Q1</span> 결제 완료 후 bo.html로 복귀가 안 됩니다 (성공 콜백 수신 없음)
            </div>
            <div style="padding:10px 12px;background:#fafafe;display:flex;flex-direction:column;gap:6px">
              <div style="color:#374151;font-weight:600">▶ 원인 체크</div>
              <div style="display:flex;flex-direction:column;gap:4px;color:#64748b;line-height:1.7">
                <span>① <code style="background:#f1f5f9;padding:1px 4px;border-radius:3px">successUrl</code> 이 현재 브라우저 origin 과 다름 — local 에서 <code>:5501</code> 이 아닌 <code>:8080</code> 으로 설정된 경우 백엔드가 bo.html 을 서빙하지 않아 404</span>
                <span>② 팝업 차단 또는 redirects 차단 브라우저 정책 (모바일 WebView 등)</span>
                <span>③ 결제창에서 [취소] 클릭 → failUrl 로 복귀 (성공 아님)</span>
                <span>④ 네트워크 오류로 토스 서버 응답 미수신 → 결제창 타임아웃</span>
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 확인 방법</div>
              <div style="color:#64748b;line-height:1.7">
                브라우저 개발자도구 → Network 탭 → 결제하기 클릭 후 마지막 request URL 확인.
                <br>환경정보 카드에서 <code>successUrl</code> 값이 <code>http://127.0.0.1:5501/bo.html?...</code> 인지 확인.
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 조치</div>
              <div style="color:#64748b;line-height:1.7">
                successUrl 이 잘못되어 있으면 → Live Server 재시작 후 새로고침 (ENV 재감지).
                <br>복귀는 됐지만 배너가 안 뜨면 → URL에 <code>callback_pay_toss_succ=1</code> 파라미터 있는지 확인.
                <br>콜백 수신 불가 상황이면 → [수동 승인] 버튼으로 paymentKey 직접 입력해 confirm 진행.
              </div>
            </div>
          </div>

          <!-- Q2 -->
          <div style="border:1px solid #d1fae5;border-radius:6px;overflow:hidden">
            <div style="background:#d1fae5;padding:7px 12px;font-weight:700;color:#065f46;display:flex;align-items:center;gap:6px">
              <span style="color:#059669">Q2</span> 성공 복귀했는데 배너([승인 요청])가 보이지 않습니다
            </div>
            <div style="padding:10px 12px;background:#fafffe;display:flex;flex-direction:column;gap:6px">
              <div style="color:#374151;font-weight:600">▶ 원인</div>
              <div style="color:#64748b;line-height:1.7">
                <span>① 페이지 새로고침으로 <code>result.callbackParams</code> 초기화 (reactive 초기화)</span><br>
                <span>② URL 파라미터 중 <code>paymentKey</code> / <code>orderId</code> / <code>amount</code> 중 하나라도 누락</span><br>
                <span>③ fnCheckCallbackParams 실행 전 DOM 준비 안 됨 (onMounted 이전)</span>
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 조치</div>
              <div style="color:#64748b;line-height:1.7">
                브라우저 주소창에서 URL 파라미터 3개 모두 있는지 확인.
                <br>파라미터가 있는데도 안 뜨면 → [수동 승인] 버튼 → paymentKey 직접 입력.
                <br>파라미터 없으면 → 토스 대시보드에서 paymentKey 조회 후 수동 승인.
              </div>
            </div>
          </div>

          <!-- Q3 -->
          <div style="border:1px solid #fef3c7;border-radius:6px;overflow:hidden">
            <div style="background:#fef3c7;padding:7px 12px;font-weight:700;color:#92400e;display:flex;align-items:center;gap:6px">
              <span style="color:#d97706">Q3</span> PENDING 상태 주문을 재결제하고 싶습니다 (이전 시도 실패 후 재진행)
            </div>
            <div style="padding:10px 12px;background:#fffdf0;display:flex;flex-direction:column;gap:6px">
              <div style="color:#374151;font-weight:600">▶ 상황</div>
              <div style="color:#64748b;line-height:1.7">
                결제하기 클릭 → STEP1 pre-save 완료(PENDING) → 결제창에서 취소 또는 브라우저 닫음
                <br>→ od_order/od_pay 는 PENDING 으로 DB에 남아있음
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 재결제 진행 방법</div>
              <div style="color:#64748b;line-height:1.7">
                <span style="color:#d97706;font-weight:600">방법 A (새 orderId)</span>: [orderId 새로고침] 버튼 → 새 orderId 생성 → [결제하기] 클릭
                <br>→ STEP1 에서 새 od_order(새 orderId) 생성 → 정상 진행
                <br><span style="color:#94a3b8;font-size:11px">이전 PENDING 주문은 배치로 자동 만료 처리 예정</span>
              </div>
              <div style="color:#64748b;line-height:1.7;margin-top:4px">
                <span style="color:#d97706;font-weight:600">방법 B (동일 orderId 재시도)</span>: 동일 orderId 로 [결제하기] 재클릭
                <br>→ STEP1 pre-save API 에서 기존 PENDING 주문 UPDATE (幂等 처리 필요 — 백엔드 구현 시 orderId 존재하면 UPDATE)
                <br>→ 이후 결제창 → paymentKey 신규 발급 → confirm 정상 진행
                <br><span style="color:#dc2626;font-size:11px">⚠ 현재 테스트 pre-save API 미구현 시 시뮬 모드로 계속 진행됨</span>
              </div>
            </div>
          </div>

          <!-- Q4 -->
          <div style="border:1px solid #fef3c7;border-radius:6px;overflow:hidden">
            <div style="background:#fef3c7;padding:7px 12px;font-weight:700;color:#92400e;display:flex;align-items:center;gap:6px">
              <span style="color:#d97706">Q4</span> [결제하기]를 다시 클릭하면 orderId 가 중복됩니다. 어떻게 되나요?
            </div>
            <div style="padding:10px 12px;background:#fffdf0;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                토스는 동일 <code>orderId</code> 로 <b>결제창을 2번 열 수 있습니다.</b> 단 <b>confirm 은 1회만</b> 허용.
                <br>→ 동일 orderId 로 결제창 재진입 → 토스가 새 <code>paymentKey</code> 발급 → 두 번째 confirm 시 첫 paymentKey 는 만료
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 권장 처리</div>
              <div style="color:#64748b;line-height:1.7">
                재결제 클릭 시 항상 <b>[orderId 새로고침]</b> 버튼으로 새 orderId 생성 후 진행.
                <br>운영 시스템에서는 결제하기 클릭 시 서버에서 신규 orderId 자동 생성 권장.
              </div>
            </div>
          </div>

          <!-- Q5 -->
          <div style="border:1px solid #fee2e2;border-radius:6px;overflow:hidden">
            <div style="background:#fee2e2;padding:7px 12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:6px">
              <span style="color:#dc2626">Q5</span> confirm(승인) 후 실제 DB(od_order/od_pay) 에 반영되지 않습니다
            </div>
            <div style="padding:10px 12px;background:#fff8f8;display:flex;flex-direction:column;gap:6px">
              <div style="color:#374151;font-weight:600">▶ 원인</div>
              <div style="color:#64748b;line-height:1.7">
                현재 <code>/co/cm/toss/confirm</code> 는 토스 서버 confirm 만 수행 (결제 승인 API 호출 + 응답 반환).
                <br>→ <code>od_pay.payment_key</code> 업데이트 / <code>od_order.status = PAID</code> 전환은 <b>별도 도메인 후처리</b> 필요
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 운영 구현 시 추가 필요</div>
              <div style="color:#64748b;line-height:1.7">
                confirm 성공 응답 → <code>OdOrderService.completePayment(orderId, paymentKey)</code> 호출
                <br>→ od_pay.payment_key = paymentKey, pay_status_cd = DONE
                <br>→ od_order.order_status_cd = PAID
                <br>→ 재고 차감, 포인트 적립 등 후처리 트랜잭션 묶음
              </div>
            </div>
          </div>

          <!-- Q6 -->
          <div style="border:1px solid #fee2e2;border-radius:6px;overflow:hidden">
            <div style="background:#fee2e2;padding:7px 12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:6px">
              <span style="color:#dc2626">Q6</span> confirm 후 금액 위변조 의심 — amount 가 다릅니다
            </div>
            <div style="padding:10px 12px;background:#fff8f8;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                토스 confirm API 는 내부적으로 <b>서버측 amount 와 콜백 amount 를 비교</b>합니다.
                <br>불일치 시 토스가 승인 거부 → confirm 응답이 4xx 에러.
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 운영 시 추가 검증</div>
              <div style="color:#64748b;line-height:1.7">
                confirm 요청 전: <code>od_pay.pay_amt</code>(STEP1 저장값) vs 콜백 <code>amount</code> 비교
                <br>→ 불일치 시 confirm 호출 차단 + 경보 발송
                <br>현재 테스트 화면은 callbackParams.amount 를 그대로 confirm 에 전달 (개발용)
              </div>
            </div>
          </div>

          <!-- Q7 -->
          <div style="border:1px solid #e0e7ff;border-radius:6px;overflow:hidden">
            <div style="background:#e0e7ff;padding:7px 12px;font-weight:700;color:#3730a3;display:flex;align-items:center;gap:6px">
              <span style="color:#7c3aed">Q7</span> 결제 후 뒤로가기를 눌렀더니 또 bo.html 이 나옵니다. 이상한가요?
            </div>
            <div style="padding:10px 12px;background:#fafafe;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                정상 동작입니다. <b>뒤로가기 완충 로직</b> 의도적 설계입니다.
                <br><code>history.replaceState</code> (파라미터 제거) + <code>history.pushState</code> (동일 URL 추가) → 히스토리 스택에 bo.html 2개
                <br>뒤로가기 1회 → 이전 bo.html (결제 전 상태)
                <br>뒤로가기 2회 → 토스 결제창 (이미 처리된 상태이므로 실제론 토스가 완료 페이지 표시)
              </div>
            </div>
          </div>

          <!-- Q8 -->
          <div style="border:1px solid #d1fae5;border-radius:6px;overflow:hidden">
            <div style="background:#d1fae5;padding:7px 12px;font-weight:700;color:#065f46;display:flex;align-items:center;gap:6px">
              <span style="color:#059669">Q8</span> 결제 취소 후 환불 처리가 필요합니다. 이 화면에서 가능한가요?
            </div>
            <div style="padding:10px 12px;background:#fafffe;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                이 화면의 [결제 취소]는 토스 API <code>/v1/payments/{paymentKey}/cancel</code> 호출만 수행합니다.
                <br>→ 토스 서버에서 결제 취소(CANCELED) 전환은 되지만
                <br>→ <code>od_refund</code> / <code>od_refund_method</code> 테이블 반영, 재고 복구, 적립금 회수 등 도메인 후처리는 <b>미연동</b>
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 운영 환불 흐름</div>
              <div style="color:#64748b;line-height:1.7">
                BO 주문관리 → 클레임(반품/취소) 등록 → OdClaimService → 토스 cancel API 호출 → OdRefund 저장 → 환불 완료 처리
              </div>
            </div>
          </div>

          <!-- Q9 -->
          <div style="border:1px solid #fef3c7;border-radius:6px;overflow:hidden">
            <div style="background:#fef3c7;padding:7px 12px;font-weight:700;color:#92400e;display:flex;align-items:center;gap:6px">
              <span style="color:#d97706">Q9</span> pre-save API(STEP1) 가 404 / 미구현인데 결제가 진행됩니다. 운영에선 괜찮나요?
            </div>
            <div style="padding:10px 12px;background:#fffdf0;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                이 테스트 화면은 pre-save 404/405 시 <b>시뮬레이션 모드</b>로 계속 진행합니다. (개발 편의)
                <br>→ PENDING 주문이 실제 DB에 없는 상태로 결제창 진입 → confirm 성공해도 매칭 주문 없음
              </div>
              <div style="color:#dc2626;font-weight:600;margin-top:4px">▶ 운영 필수 구현</div>
              <div style="color:#64748b;line-height:1.7">
                운영 시스템에서는 pre-save API 실패 시 <b>결제창 진입 차단</b> 필요.
                <br><code>ZdPayTestController.preSave()</code> → <code>OdOrderService.createPendingOrder()</code> 연동 구현 후 테스트 모드 제거.
              </div>
            </div>
          </div>

          <!-- Q10 -->
          <div style="border:1px solid #f3e8ff;border-radius:6px;overflow:hidden">
            <div style="background:#f3e8ff;padding:7px 12px;font-weight:700;color:#581c87;display:flex;align-items:center;gap:6px">
              <span style="color:#7c3aed">Q10</span> 테스트 키(test_gck_)로는 실제 카드가 결제되나요?
            </div>
            <div style="padding:10px 12px;background:#fdfaff;display:flex;flex-direction:column;gap:6px">
              <div style="color:#64748b;line-height:1.7">
                <b>아닙니다.</b> 테스트 키(<code>test_gck_</code> / <code>test_sk_</code>)는 토스 테스트 환경 전용입니다.
                <br>→ 실제 카드 청구 없음 / 실제 환불 없음 / 토스 테스트 대시보드에서만 조회 가능
                <br>→ confirm 결과의 <code>status: DONE</code> 도 테스트 가상 승인
              </div>
              <div style="color:#374151;font-weight:600;margin-top:4px">▶ 운영 전환 시</div>
              <div style="color:#64748b;line-height:1.7">
                sy_prop <code>app.toss.client-key</code> / <code>app.toss.secret-key</code> 를 <code>live_gck_</code> / <code>live_sk_</code> 로 교체.
                <br>이 화면의 clientKey 입력란도 live 키로 변경하거나 sy_prop 에서 자동 로드.
              </div>
            </div>
          </div>

          <!-- Q11 -->
          <div style="border:1px solid #fee2e2;border-radius:6px;overflow:hidden">
            <div style="background:#fee2e2;padding:7px 12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:6px">
              <span style="color:#dc2626">Q11</span> 부분취소는 어떻게 하나요? 전액취소와 무엇이 다른가요?
            </div>

            <div style="padding:10px 12px;background:#fff8f8;display:flex;flex-direction:column;gap:8px">
              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 전액취소 vs 부분취소 차이</div>
                <table style="width:100%;font-size:11px;border-collapse:collapse">
                  <thead>
                    <tr style="background:#f8fafc">
                      <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#374151">구분</th>
                      <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#374151">전액취소</th>
                      <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;color:#374151">부분취소</th>
                    </tr>
                  </thead>
                  <tbody style="color:#64748b">
                    <tr>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">cancelAmount</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0"><code>null</code> (생략)</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0"><code>500</code> (취소할 금액 명시)</td>
                    </tr>
                    <tr style="background:#fafafa">
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">결제 후 상태</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">CANCELED (전체 취소)</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">DONE (잔여 금액 유지)</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">재취소 가능</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">불가 (이미 CANCELED)</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">잔여 금액 범위 내 추가 취소 가능</td>
                    </tr>
                    <tr style="background:#fafafa">
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">토스 응답</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">cancels[0].cancelAmount = 전액</td>
                      <td style="padding:5px 8px;border:1px solid #e2e8f0">cancels[] 배열에 취소 건별 누적</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 이 화면에서 부분취소 하는 법</div>
                <div style="color:#64748b;line-height:1.8">
                  현재 [결제 취소] 버튼은 <code>cancelAmount</code> 를 <b>null(전액취소)</b>로 고정 전송합니다.
                  <br>부분취소를 테스트하려면 아래 방법 중 하나를 사용하세요.
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:8px 10px;font-size:11px">
                    <div style="font-weight:600;color:#374151;margin-bottom:3px">방법 A — 콘솔 직접 호출 (즉시 테스트)</div>
                    <div style="color:#64748b">브라우저 개발자도구 콘솔에서:</div>
                    <pre style="margin:4px 0 0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;overflow-x:auto">boApi.post('/api/co/cm/toss/cancel',
  { paymentKey: 'tgen_...', cancelReason: '부분취소 테스트', cancelAmount: 500 },
  coUtil.cofApiHdr('부분취소', '테스트')
).then(r => console.log(r.data))</pre>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:8px 10px;font-size:11px">
                    <div style="font-weight:600;color:#374151;margin-bottom:3px">방법 B — 결제 취소 카드 내 cancelAmount 입력란 추가 (미구현)</div>
                    <div style="color:#64748b;line-height:1.7">
                      아래 결제 취소 카드에 <code>cancelAmount</code> 입력 필드를 추가하면 부분취소 직접 테스트 가능.
                      <br>비워두면 전액, 숫자 입력 시 해당 금액만 취소.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 부분취소 응답 구조</div>
                <pre style="margin:0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;overflow-x:auto">{
  "status": "DONE",          // 잔여 금액 있으면 DONE 유지
  "totalAmount": 1000,
  "balanceAmount": 500,      // 잔여(환불 가능) 금액
  "cancels": [
    {
      "cancelAmount": 500,
      "cancelReason": "부분취소 테스트",
      "canceledAt": "2026-06-28T12:00:00+09:00",
      "transactionKey": "..."
    }
  ]
}</pre>
                <div style="color:#64748b;font-size:11px;margin-top:6px;line-height:1.7">
                  <b>balanceAmount</b>: 남은 취소 가능 금액 (500원 → 추가로 최대 500원 더 취소 가능)
                  <br><b>cancels[]</b>: 취소 이력 누적 배열 (2회 부분취소 시 2건)
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 운영 부분취소 시 주의사항</div>
                <div style="color:#64748b;line-height:1.8">
                  ① <b>취소 금액 ≤ balanceAmount</b> 검증 필수 — 초과 시 토스 400 에러
                  <br>② 부분취소 마다 <code>od_refund</code> 레코드 1건 INSERT + <code>od_refund_method.refund_amt</code> 업데이트
                  <br>③ 쿠폰/적립금 병용 결제 시 취소 우선순위: <span style="color:#d97706;font-weight:600">현금성(카드) 먼저 → 쿠폰/포인트 나중</span> (토스 정책)
                  <br>④ <code>cancelAmount</code> 누락(null) 시 토스가 자동으로 <b>전액취소</b> 처리 — 의도치 않은 전액취소 주의
                  <br>⑤ 배송 시작 후 부분취소: 일부 PG 는 취소 불가 → 토스 응답 <code>400 ALREADY_PROCESSED_PAYMENT</code>
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 부분취소 가능 상태표</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:11px">
                  <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">DONE → 부분취소 ✅</span>
                  <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">DONE → 추가 부분취소 ✅ (balanceAmount 범위 내)</span>
                  <span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:3px 8px;color:#b91c1c">CANCELED → 추가취소 ❌</span>
                  <span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:3px 8px;color:#b91c1c">PENDING → 취소 ❌ (confirm 전)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Q12 -->
          <div style="border:1px solid #fee2e2;border-radius:6px;overflow:hidden">
            <div style="background:#fee2e2;padding:7px 12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:6px">
              <span style="color:#dc2626">Q12</span> 부분취소 2회로 완전취소 — 시뮬레이션
            </div>
            <div style="padding:10px 12px;background:#fff8f8;display:flex;flex-direction:column;gap:8px">
              <div style="color:#374151;font-weight:600;margin-bottom:2px">▶ 시나리오: 30,000원 결제 → 10,000원 부분취소 → 나머지 20,000원 취소</div>
              <div style="display:flex;flex-direction:column;gap:6px">

                <!-- 원 결제 -->
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:5px;padding:8px 10px;font-size:11px">
                  <div style="font-weight:600;color:#166534;margin-bottom:4px">원 결제 (DONE)</div>
                  <div style="display:grid;grid-template-columns:130px 1fr;gap:2px 8px;color:#374151;font-family:monospace">
                    <span style="color:#6b7280">od_order.order_id</span><span>ORD-2026-001</span>
                    <span style="color:#6b7280">od_pay.payment_key</span><span style="color:#1e40af">tgen_ABC</span>
                    <span style="color:#6b7280">od_pay.pay_amt</span><span>30,000원</span>
                    <span style="color:#6b7280">od_pay.pay_status_cd</span><span style="color:#15803d;font-weight:700">DONE</span>
                  </div>
                </div>

                <!-- 1차 부분취소 -->
                <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:5px;padding:8px 10px;font-size:11px">
                  <div style="font-weight:600;color:#c2410c;margin-bottom:4px">1차 부분취소 — cancelAmount: 10,000</div>
                  <pre style="margin:0 0 4px;font-size:10px;background:#1e293b;color:#e2e8f0;padding:7px;border-radius:4px;overflow-x:auto">boApi.post('/api/co/cm/toss/cancel', {
  paymentKey: 'tgen_ABC',
  cancelReason: '상품 A 반품',
  cancelAmount: 10000   // ← 부분취소 금액 명시
}, coUtil.cofApiHdr('부분취소 1차', '테스트'))</pre>
                  <div style="margin-top:4px;display:grid;grid-template-columns:130px 1fr;gap:2px 8px;color:#374151;font-family:monospace">
                    <span style="color:#6b7280">응답 status</span><span style="color:#15803d;font-weight:700">DONE</span>
                    <span style="color:#6b7280">balanceAmount</span><span>20,000원 (잔여)</span>
                    <span style="color:#6b7280">cancels[0].cancelAmount</span><span>10,000원</span>
                    <span style="color:#6b7280">cancels[0].transactionKey</span><span style="color:#7c3aed">tx_ABC_002 ← 새 발급</span>
                    <span style="color:#6b7280">od_pay.pay_status_cd</span><span style="color:#f59e0b;font-weight:700">PARTIAL_CANCELED</span>
                  </div>
                </div>

                <!-- 2차 부분취소 -->
                <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:5px;padding:8px 10px;font-size:11px">
                  <div style="font-weight:600;color:#c2410c;margin-bottom:4px">2차 부분취소 — cancelAmount: 20,000 (잔여 전부)</div>
                  <pre style="margin:0 0 4px;font-size:10px;background:#1e293b;color:#e2e8f0;padding:7px;border-radius:4px;overflow-x:auto">boApi.post('/api/co/cm/toss/cancel', {
  paymentKey: 'tgen_ABC',   // ← 동일 paymentKey 재사용
  cancelReason: '나머지 전체 취소',
  cancelAmount: 20000       // ← refundableAmount 전액
}, coUtil.cofApiHdr('부분취소 2차', '테스트'))</pre>
                  <div style="margin-top:4px;display:grid;grid-template-columns:130px 1fr;gap:2px 8px;color:#374151;font-family:monospace">
                    <span style="color:#6b7280">응답 status</span><span style="color:#b91c1c;font-weight:700">CANCELED ← 전액 취소 완료</span>
                    <span style="color:#6b7280">balanceAmount</span><span>0원</span>
                    <span style="color:#6b7280">cancels[0].transactionKey</span><span style="color:#7c3aed">tx_ABC_002 (1차)</span>
                    <span style="color:#6b7280">cancels[1].transactionKey</span><span style="color:#7c3aed">tx_ABC_003 ← 새 발급</span>
                    <span style="color:#6b7280">od_pay.pay_status_cd</span><span style="color:#b91c1c;font-weight:700">CANCELED</span>
                  </div>
                </div>

              </div>
              <div style="font-size:11px;color:#64748b;background:#fafafa;border-radius:4px;padding:7px 10px;line-height:1.8">
                <b>포인트:</b> paymentKey(tgen_ABC)는 1·2차 모두 동일 — 취소 회차마다 <code>transactionKey</code> 만 새로 발급<br>
                <b>운영 주의:</b> 2차 cancelAmount = balanceAmount 정확히 일치해야 함 — 초과 시 토스 400 에러(<code>EXCEED_CANCEL_AMOUNT</code>)
              </div>
            </div>
          </div>

          <!-- Q13 -->
          <div style="border:1px solid #ddd6fe;border-radius:6px;overflow:hidden">
            <div style="background:#ede9fe;padding:7px 12px;font-weight:700;color:#4c1d95;display:flex;align-items:center;gap:6px">
              <span style="color:#7c3aed">Q13</span> 추가결제는 어떻게 하나요? 같은 orderId 로 하면 되나요?
            </div>
            <div style="padding:10px 12px;background:#fdfaff;display:flex;flex-direction:column;gap:8px;font-size:12px">

              <div>
                <div style="color:#dc2626;font-weight:600;margin-bottom:4px">❌ 같은 orderId 사용 불가</div>
                <div style="color:#64748b;line-height:1.8">
                  토스페이먼츠에서 <code>orderId</code>는 결제 건당 유일합니다.<br>
                  동일 orderId로 결제창을 열면 토스가 <b>"이미 사용된 orderId"</b>로 거부합니다.
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:6px">✅ 올바른 추가결제 설계</div>
                <div style="display:flex;gap:8px">
                  <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:5px;padding:8px 10px;font-size:11px">
                    <div style="font-weight:600;color:#166534;margin-bottom:4px">원 주문</div>
                    <div style="font-family:monospace;display:flex;flex-direction:column;gap:2px;color:#374151">
                      <span>order_id = <b>ORD-001</b></span>
                      <span>order_type_cd = NORMAL</span>
                      <span>order_amt = 30,000원</span>
                      <span>paymentKey = <span style="color:#1e40af">tgen_ABC</span></span>
                      <span>pay_status_cd = DONE</span>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;font-size:18px;color:#94a3b8;padding:0 4px">+</div>
                  <div style="flex:1;background:#ede9fe;border:1px solid #c4b5fd;border-radius:5px;padding:8px 10px;font-size:11px">
                    <div style="font-weight:600;color:#5b21b6;margin-bottom:4px">추가결제 (새 od_pay 행)</div>
                    <div style="font-family:monospace;display:flex;flex-direction:column;gap:2px;color:#374151">
                      <span>pay_id = <b>PAY-002</b> ← 토스 orderId</span>
                      <span>order_id = ORD-001 ← 원 주문 FK</span>
                      <span>pay_occur_type_cd = CLAIM_EXTRA</span>
                      <span>pay_amt = 5,000원</span>
                      <span>paymentKey = <span style="color:#1e40af">tgen_XYZ ← 새 발급</span></span>
                      <span>pay_status_cd = DONE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:4px">▶ 이 테스트 화면에서 추가결제 진행하는 법</div>
                <div style="display:flex;flex-direction:column;gap:4px;color:#64748b;line-height:1.8;font-size:11px">
                  <span>① [orderId 새로고침] → 새 <code>PAY-{timestamp}</code> 가 자동 생성됨 (수동 입력 불필요)</span>
                  <span>② amount 를 추가결제 금액(5,000)으로 변경</span>
                  <span>③ [위젯 렌더링] → [결제하기] → 토스 결제창 → [승인 요청]</span>
                  <span>④ 원 결제(PAY-001)와 추가결제(PAY-002)는 각각 독립된 paymentKey 로 관리</span>
                </div>
              </div>

              <div>
                <div style="color:#374151;font-weight:600;margin-bottom:6px">▶ 추가결제 취소는?</div>
                <div style="font-size:11px;display:flex;gap:6px;flex-wrap:wrap">
                  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:4px;padding:6px 8px;flex:1">
                    <div style="font-weight:600;color:#166534;margin-bottom:2px">원 주문 취소</div>
                    <div style="font-family:monospace;font-size:10px;color:#374151">paymentKey: tgen_ABC<br>cancelAmount: 30,000</div>
                  </div>
                  <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:4px;padding:6px 8px;flex:1">
                    <div style="font-weight:600;color:#5b21b6;margin-bottom:2px">추가결제 독립 취소</div>
                    <div style="font-family:monospace;font-size:10px;color:#374151">paymentKey: tgen_XYZ<br>cancelAmount: 5,000</div>
                  </div>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px">각각 독립 취소 · od_claim에 parent_order_id 기준으로 묶어서 화면 표시</div>
              </div>

              <div style="background:#fefce8;border:1px solid #fde047;border-radius:5px;padding:8px 10px;font-size:11px;color:#64748b;line-height:1.8">
                <b style="color:#92400e">요약:</b>
                추가결제 = 새 od_pay 행 INSERT → 새 pay_id 자동 발급 → 이 pay_id 를 토스 orderId 로 사용<br>
                같은 주문의 추가결제임은 od_pay.order_id (FK) 로 원 주문 ORD-001 에 연결
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">API 키 설정</span>
      <span style="font-size:11px;color:#888;margin-left:8px">결제위젯 전용 키 (test_gck_ / live_gck_ 접두어)</span>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div class="form-actions" style="justify-content:flex-start;margin-top:8px">
        <button class="btn btn_save" @click="handleBtnAction('keys-save')">sy_prop 저장</button>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;line-height:2;margin-top:8px">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px">{{ result.sdkUrl }}</span></div>
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
        <template #successUrlSlot>
          <input class="form-control" :value="TOSS_SUCCESS_URL" readonly
            style="font-family:monospace;font-size:11px;background:#f8fafc;color:#374151" />
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.6">
            토스 결제 완료 → 이 화면(bo.html)으로 복귀 → 아래 배너에서 [승인 요청] 클릭 → 백엔드 POST confirm
            <span v-if="ENV.name==='local'" style="color:#f59e0b"> · local 환경: 승인은 :8080 백엔드로 전송</span>
          </div>
        </template>
        <template #failUrlSlot>
          <input class="form-control" :value="TOSS_FAIL_URL" readonly
            style="font-family:monospace;font-size:11px;background:#f8fafc;color:#374151" />
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">
            결제 실패/취소 → 이 화면으로 복귀 → 에러 토스트 표시 (failUrl은 항상 프론트 URL)
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

      <!-- 전송 파라미터 미리보기 -->
      <div style="margin-top:14px;padding:10px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px">📋 requestPayment() 전송 파라미터 미리보기</div>
        <bo-grid :columns="previewGridColumns" :rows="cfPayParams" :show-row-num="false" style="font-size:11px" />
      </div>
    </div>
  </div>

  <!-- 결제 성공 콜백 수신 배너 -->
  <div v-if="result.callbackParams" style="margin-bottom:12px;padding:14px 16px;background:#eff6ff;border:2px solid #3b82f6;border-radius:8px">
    <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:8px">
      🔔 토스 결제 성공 콜백 수신 — 승인 요청이 필요합니다
    </div>
    <div style="display:grid;grid-template-columns:90px 1fr;gap:4px 12px;font-size:12px;margin-bottom:12px">
      <span style="color:#64748b">paymentKey</span>
      <span style="font-family:monospace;color:#1e40af;word-break:break-all">{{ result.callbackParams.paymentKey }}</span>
      <span style="color:#64748b">orderId</span>
      <span style="font-family:monospace">{{ result.callbackParams.orderId }}</span>
      <span style="color:#64748b">amount</span>
      <span style="font-family:monospace">{{ result.callbackParams.amount.toLocaleString() }} 원</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn_confirm" :disabled="uiState.loading" @click="handleBtnAction('confirm-auto')">
        {{ uiState.loading ? '⏳ 승인 중…' : '✅ 승인 요청' }}
      </button>
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
        <button class="btn btn_apply" :disabled="uiState.loading" @click="handleBtnAction('confirm-manual')" title="paymentKey 직접 입력으로 승인 (예외 대응)">수동 승인</button>
        <button class="btn btn_delete" :disabled="!result.confirmResult" @click="handleBtnAction('cancel-test')">결제 취소</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-bottom:8px">{{ result.error }}</div>
      <div :id="widgetContainerId" style="min-height:200px;border:1px dashed #ddd;border-radius:6px;padding:8px;margin-bottom:8px">
        <div v-if="!uiState.widgetMounted" style="display:flex;align-items:center;justify-content:center;height:160px;color:#aaa;font-size:13px">
          위젯 렌더링 버튼을 클릭하면 여기에 결제 UI가 표시됩니다
        </div>
      </div>
      <!-- 결제 전 임시저장 결과 (PENDING) -->
      <div v-if="result.preResult" style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#1d4ed8;font-size:12px">
          📋 STEP 1 — 결제 전 임시저장
          <span class="badge badge-blue" style="margin-left:6px;font-size:10px">PENDING</span>
          <span v-if="result.preResult.note" style="font-size:10px;color:#94a3b8;margin-left:6px">{{ result.preResult.note }}</span>
        </div>
        <div style="display:grid;grid-template-columns:90px 1fr;gap:3px 8px;font-size:12px">
          <span style="color:#64748b">orderId</span>
          <span style="font-family:monospace;color:#1e40af">{{ result.preResult.orderId || form.orderId }}</span>
          <span style="color:#64748b">status</span>
          <span style="font-family:monospace">{{ result.preResult.status || 'PENDING' }}</span>
          <span style="color:#64748b">paymentKey</span>
          <span style="color:#94a3b8;font-size:11px">null — 토스 confirm 후 채워짐</span>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:6px;padding-top:6px;border-top:1px solid #dbeafe">
          orderId 기준으로 미완 주문 복구 가능 · 콜백 미수신 시 배치로 PENDING 주문 정리 가능
        </div>
      </div>

      <!-- 결제 승인 최종결과 (DONE) -->
      <div v-if="result.confirmResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d;font-size:12px">
          ✅ STEP 3 — 결제 승인 + 최종저장
          <span class="badge badge-green" style="margin-left:6px;font-size:10px">DONE</span>
        </div>
        <bo-grid :columns="confirmGridColumns" :rows="[result.confirmResult]" :show-row-num="false"
          @cell-click="e => handleBtnAction('receipt-open', e.colKey==='receiptUrl' ? result.confirmResult.receiptUrl : null)" />
        <!-- 승인 응답 핵심 3필드 설명 -->
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;font-size:11px;padding:8px 10px;background:#ecfdf5;border-radius:5px;border:1px solid #a7f3d0">
          <div style="display:flex;gap:8px;align-items:baseline">
            <code style="background:#d1fae5;padding:1px 5px;border-radius:3px;color:#065f46;white-space:nowrap">approvedAt</code>
            <span style="color:#374151">카드사 실제 승인 일시 (ISO8601, 타임존 포함) — od_pay.approved_at(TIMESTAMP)에 저장</span>
          </div>
          <div style="display:flex;gap:8px;align-items:baseline">
            <code style="background:#ede9fe;padding:1px 5px;border-radius:3px;color:#5b21b6;white-space:nowrap">transactionKey</code>
            <span style="color:#374151">이 결제 건의 거래 식별자 — 부분취소 2회차 등 취소 이력별로 새 값 발급 (cancels[].transactionKey)</span>
          </div>
          <div style="display:flex;gap:8px;align-items:baseline">
            <code style="background:#dbeafe;padding:1px 5px;border-radius:3px;color:#1e40af;white-space:nowrap">receiptUrl</code>
            <span style="color:#374151">토스 발행 공식 전자영수증 URL — 클릭하면 새 탭으로 오픈 · od_pay.receipt_url 에 저장 권장</span>
          </div>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:6px;padding-top:6px;border-top:1px solid #bbf7d0">
          paymentKey 로 od_pay 업데이트 · orderId 로 od_order.status → PAID
        </div>
      </div>

      <!-- 결제 취소 결과 -->
      <div v-if="result.cancelResult" style="background:#fff7ed;border:1px solid #fdba74;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:8px;color:#c2410c;font-size:12px">
          ⊘ 결제 취소 결과
          <span class="badge badge-red" style="margin-left:6px;font-size:10px">{{ result.cancelResult.status }}</span>
        </div>

        <!-- 좌우 2단: 왼쪽=요약그리드+이력, 오른쪽=필드 코멘트 -->
        <div style="display:grid;grid-template-columns:1fr 280px;gap:10px;align-items:start">
          <!-- 왼쪽: 상태 요약 + 취소 이력 -->
          <div>
            <!-- 상태 요약 -->
            <div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:4px">📊 결제 상태 요약</div>
            <bo-grid :columns="cancelSummaryGridColumns" :rows="[result.cancelResult]" :show-row-num="false" />

            <!-- cancels[] 이력 -->
            <div style="font-size:11px;font-weight:600;color:#92400e;margin-top:10px;margin-bottom:4px">
              📋 취소 이력 (cancels[])
              <span style="font-family:monospace;font-weight:400;color:#b45309;margin-left:4px">{{ (result.cancelResult.cancels || []).length }}건</span>
            </div>
            <div v-if="!(result.cancelResult.cancels || []).length" style="font-size:11px;color:#aaa;padding:6px">이력 없음</div>
            <bo-grid v-else :columns="cancelHistGridColumns" :rows="result.cancelResult.cancels || []" :show-row-num="true" />

            <!-- paymentKey 안내 -->
            <div style="font-size:11px;color:#78716c;margin-top:6px;padding-top:6px;border-top:1px solid #fde68a">
              paymentKey 동일 — 전체 취소가 될 때까지 같은 키로 반복 취소 가능
            </div>
          </div>

          <!-- 오른쪽: 필드별 코멘트 -->
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:5px;padding:10px;font-size:11px;display:flex;flex-direction:column;gap:6px">
            <div style="font-weight:700;color:#92400e;margin-bottom:2px">📌 응답 필드 설명</div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">status</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                부분취소 → <code style="background:#fff7ed;color:#c2410c">DONE</code><br>
                전액취소 → <code style="background:#fff1f2;color:#be123c">CANCELED</code>
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">totalAmount</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                원 결제금액. 취소해도 변하지 않음
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">balanceAmount</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                지금 추가로 취소 가능한 잔여 금액<br>
                <span style="color:#dc2626">0이면 더 이상 취소 불가</span>
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">isPartialCancelable</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                부분취소 가능 여부<br>
                가상계좌 미입금 상태 등은 false
              </div>
            </div>

            <div>
              <code style="background:#ede9fe;padding:1px 5px;border-radius:3px;color:#5b21b6">cancels[].transactionKey</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                취소 1건당 새로 발급되는 거래 식별자<br>
                부분취소 2회 = transactionKey 2개 누적
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">cancels[].cancelAmount</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                이번 취소에서 차감된 금액<br>
                cancelAmount 없이 요청 = 전액
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">cancels[].refundableAmount</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                이 취소 건에서 환급 가능한 금액<br>
                (면세·부가세 분리 적용 후 순액)
              </div>
            </div>

            <div>
              <code style="background:#fef3c7;padding:1px 5px;border-radius:3px;color:#78350f">cancels[].canceledAt</code>
              <div style="color:#44403c;margin-top:2px;line-height:1.5">
                취소 처리 완료 일시 (ISO8601)<br>
                od_pay.canceled_at 에 저장
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 환경 정보 + 연동 흐름 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">환경 정보 &amp; 연동 흐름</span></div>
    <div style="padding:12px">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:12px;font-size:12px">
        <div style="font-weight:600;color:#475569;margin-bottom:6px">🖥 현재 실행 환경</div>
        <div style="display:grid;grid-template-columns:110px 1fr;gap:3px 8px;color:#374151">
          <span style="color:#64748b">환경</span>
          <span>
            <span class="badge" :class="ENV.name==='prod'?'badge-green':ENV.name==='dev'?'badge-blue':'badge-orange'">{{ ENV.name }}</span>
          </span>
          <span style="color:#64748b">현재 Origin</span>
          <span style="font-family:monospace">{{ ENV.currentOrigin }}</span>
          <span style="color:#64748b">백엔드 Origin</span>
          <span style="font-family:monospace">{{ ENV.backendOrigin }}
            <span v-if="ENV.name==='local'" style="color:#f59e0b;font-family:sans-serif"> ← Live Server 감지 → :8080 자동 전환</span>
          </span>
          <span style="color:#64748b">successUrl</span>
          <span style="font-family:monospace;font-size:11px;color:#1e40af">{{ TOSS_SUCCESS_URL }}</span>
          <span style="color:#64748b">failUrl</span>
          <span style="font-family:monospace;font-size:11px;color:#6b7280">{{ TOSS_FAIL_URL }}</span>
        </div>
      </div>
      <!-- 3단계 저장 흐름 -->
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px">💾 결제 데이터 저장 3단계</div>
        <div style="display:flex;align-items:stretch;gap:0;font-size:11px">
          <div style="flex:1;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px 0 0 6px;padding:10px 12px">
            <div style="font-weight:700;color:#1d4ed8;margin-bottom:6px">STEP 1 · 결제하기 클릭</div>
            <div style="color:#374151;line-height:1.8">
              <div>📌 <b>orderId 발급</b> (우리 시스템)</div>
              <div>📌 주문정보 백엔드 임시저장</div>
              <div style="font-family:monospace;font-size:10px;color:#6b7280;margin-top:4px">od_order.status = PENDING<br>od_pay.payment_key = null</div>
              <div style="margin-top:6px;color:#94a3b8;font-size:10px">→ 결제창 이탈 후 세션 유실 시에도<br>&nbsp;&nbsp;orderId 로 미완 주문 복구 가능</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;padding:0 6px;background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
            <div style="font-size:18px;color:#fbbf24">→</div>
          </div>
          <div style="flex:1;background:#fef9c3;border:1px solid #fde047;border:1px solid #fde047;padding:10px 12px">
            <div style="font-weight:700;color:#92400e;margin-bottom:6px">STEP 2 · 토스 결제창</div>
            <div style="color:#374151;line-height:1.8">
              <div>💳 카드/간편결제 인증</div>
              <div>🔑 <b>paymentKey 발급</b> (토스 서버)</div>
              <div style="font-family:monospace;font-size:10px;color:#6b7280;margin-top:4px">GET redirect →<br>bo.html?callback_pay_toss_succ=1<br>&amp;paymentKey=tgen_…<br>&amp;orderId=TEST-…<br>&amp;amount=1000</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;padding:0 6px;background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
            <div style="font-size:18px;color:#fbbf24">→</div>
          </div>
          <div style="flex:1;background:#f0fdf4;border:1px solid #86efac;border-radius:0 6px 6px 0;padding:10px 12px">
            <div style="font-weight:700;color:#166534;margin-bottom:6px">STEP 3 · 승인 요청</div>
            <div style="color:#374151;line-height:1.8">
              <div>✅ <b>paymentKey</b> 로 토스 confirm</div>
              <div>✅ 금액 위변조 검증</div>
              <div style="font-family:monospace;font-size:10px;color:#6b7280;margin-top:4px">od_pay.payment_key = tgen_…<br>od_pay.status = DONE<br>od_order.status = PAID</div>
              <div style="margin-top:6px;color:#94a3b8;font-size:10px">→ orderId ↔ paymentKey 연결 완성<br>&nbsp;&nbsp;이후 취소 시 paymentKey 로 요청</div>
            </div>
          </div>
        </div>
        <!-- 핵심 키 설명 -->
        <div style="margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;font-size:11px;line-height:2">
          <b>핵심 식별 키:</b>
          &nbsp;
          <code style="background:#dbeafe;padding:2px 6px;border-radius:3px;color:#1e40af">orderId</code>
          <span style="color:#64748b"> 우리 시스템 발급 · 결제 전부터 존재 · od_order PK</span>
          &nbsp;&nbsp;
          <code style="background:#dcfce7;padding:2px 6px;border-radius:3px;color:#166534">paymentKey</code>
          <span style="color:#64748b"> 토스 발급 · 결제 인증 후 수신 · od_pay FK · 취소/조회 시 사용</span>
        </div>
      </div>

      <div style="font-size:12px;line-height:2;color:#444">
        <b>콜백 URL 파라미터:</b><br>
        &nbsp;&nbsp;성공: <code>bo.html?callback_pay_toss_succ=1&amp;paymentKey=tgen_…&amp;orderId=TEST-…&amp;amount=1000</code><br>
        &nbsp;&nbsp;실패: <code>bo.html?callback_pay_toss_fail=1</code> → 에러 토스트 표시<br><br>
        <b>뒤로가기 완충:</b> 복귀 시 replaceState(URL 정리) + pushState(동일 URL 1회 추가) → 뒤로가기 1회는 bo.html 유지<br><br>
        <b>테스트 순서:</b><br>
        &nbsp;&nbsp;① 키 설정 (test_gck_ / test_gsk_) → sy_prop 저장<br>
        &nbsp;&nbsp;② [위젯 렌더링] → 결제 UI 확인<br>
        &nbsp;&nbsp;③ [결제하기] → STEP 1 임시저장(PENDING) → 토스 결제창 → 카드 입력 → bo.html 복귀<br>
        &nbsp;&nbsp;④ 파란 배너 [승인 요청] → STEP 3 최종저장(DONE) 확인<br>
        &nbsp;&nbsp;⑤ (선택) [결제 취소] → 전액취소 (paymentKey 기준, status → CANCELED)<br>
        &nbsp;&nbsp;⑤-A (부분취소) → 콘솔에서 cancelAmount 지정 직접 호출 (아래 참조)<br><br>
        <b>API 엔드포인트:</b><br>
        &nbsp;&nbsp;임시저장: <code>POST {{ ENV.backendOrigin }}/api/bo/zd/pay-test/pre-save</code> (미구현 시 시뮬)<br>
        &nbsp;&nbsp;승인: <code>POST {{ ENV.backendOrigin }}/api/co/cm/toss/confirm</code><br>
        &nbsp;&nbsp;전액취소: <code>POST {{ ENV.backendOrigin }}/api/co/cm/toss/cancel</code> <span style="color:#94a3b8">— cancelAmount 생략</span><br>
        &nbsp;&nbsp;부분취소: <code>POST {{ ENV.backendOrigin }}/api/co/cm/toss/cancel</code> <span style="color:#d97706">— cancelAmount: 500 명시</span>
      </div>

      <!-- 부분취소 상세 가이드 -->
      <div style="margin-top:14px;border:1px solid #fca5a5;border-radius:8px;overflow:hidden">
        <div style="background:#fee2e2;padding:8px 14px;font-size:12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:6px">
          <span style="background:#dc2626;color:#fff;border-radius:3px;padding:1px 7px;font-size:10px">부분취소</span>
          부분취소 (Partial Cancel) 가이드
        </div>
        <div style="padding:12px 14px;font-size:12px;display:flex;flex-direction:column;gap:10px">

          <!-- 전액 vs 부분 비교 -->
          <div>
            <div style="font-weight:600;color:#374151;margin-bottom:6px">전액취소 vs 부분취소 API 차이</div>
            <div style="display:flex;gap:8px">
              <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:8px 10px">
                <div style="font-weight:600;color:#374151;font-size:11px;margin-bottom:4px">전액취소 — cancelAmount 생략</div>
                <pre style="margin:0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:7px;border-radius:4px;overflow-x:auto">{
  "paymentKey": "tgen_...",
  "cancelReason": "전액취소"
  // cancelAmount 없으면 → 자동 전액
}</pre>
                <div style="font-size:11px;color:#64748b;margin-top:4px">결과: status → <b>CANCELED</b></div>
              </div>
              <div style="flex:1;background:#fff8f8;border:1px solid #fca5a5;border-radius:5px;padding:8px 10px">
                <div style="font-weight:600;color:#dc2626;font-size:11px;margin-bottom:4px">부분취소 — cancelAmount 명시</div>
                <pre style="margin:0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:7px;border-radius:4px;overflow-x:auto">{
  "paymentKey": "tgen_...",
  "cancelReason": "부분취소",
  "cancelAmount": 500   // ← 취소할 금액
}</pre>
                <div style="font-size:11px;color:#64748b;margin-top:4px">결과: status → <b>DONE</b> (잔여분 유지)</div>
              </div>
            </div>
          </div>

          <!-- 부분취소 콘솔 테스트 -->
          <div>
            <div style="font-weight:600;color:#374151;margin-bottom:4px">부분취소 콘솔 직접 테스트</div>
            <div style="color:#64748b;font-size:11px;margin-bottom:4px">승인 완료 후 confirmResult 에서 paymentKey 복사 → 아래 콘솔 실행</div>
            <pre style="margin:0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;overflow-x:auto">// 500원만 취소 (1,000원 결제 기준)
boApi.post('/api/co/cm/toss/cancel',
  {
    paymentKey: 'tgen_20260628_...',  // confirmResult 에서 복사
    cancelReason: '부분취소 테스트',
    cancelAmount: 500
  },
  coUtil.cofApiHdr('부분취소 테스트', '부분취소')
).then(r => console.log(JSON.stringify(r.data, null, 2)))</pre>
          </div>

          <!-- 응답 구조 -->
          <div>
            <div style="font-weight:600;color:#374151;margin-bottom:4px">부분취소 응답 핵심 필드</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <pre style="margin:0;font-size:10px;background:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;overflow-x:auto">{
  "status": "DONE",
  "totalAmount": 1000,
  "balanceAmount": 500,
  "cancels": [{
    "cancelAmount": 500,
    "canceledAt": "...",
    "transactionKey": "..."
  }]
}</pre>
              <div style="font-size:11px;color:#64748b;line-height:2;align-self:center">
                <b>status</b>: DONE (잔여 있으면 유지)<br>
                <b>totalAmount</b>: 원래 결제금액<br>
                <b>balanceAmount</b>: 추가 취소 가능 잔여액<br>
                <b>cancels[]</b>: 취소 이력 누적 배열<br>
                <b>2차 부분취소</b>: balanceAmount 범위 내 재호출
              </div>
            </div>
          </div>

          <!-- 상태 흐름 -->
          <div>
            <div style="font-weight:600;color:#374151;margin-bottom:6px">부분취소 상태 흐름 예시 (1,000원 결제)</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;font-size:11px">
              <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">DONE<br>1,000원</span>
              <span style="color:#94a3b8;font-size:16px">→</span>
              <span style="background:#fff7ed;border:1px solid #fdba74;border-radius:4px;padding:3px 8px;color:#c2410c">1차 부분취소<br>300원</span>
              <span style="color:#94a3b8;font-size:16px">→</span>
              <span style="background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:3px 8px;color:#166534">DONE<br>잔여 700원</span>
              <span style="color:#94a3b8;font-size:16px">→</span>
              <span style="background:#fff7ed;border:1px solid #fdba74;border-radius:4px;padding:3px 8px;color:#c2410c">2차 부분취소<br>700원</span>
              <span style="color:#94a3b8;font-size:16px">→</span>
              <span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:3px 8px;color:#b91c1c">CANCELED<br>잔여 0원</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px">* 잔여 금액을 모두 취소하면 자동으로 CANCELED 전환</div>
          </div>

          <!-- 주의사항 -->
          <div style="background:#fff8f8;border:1px solid #fca5a5;border-radius:5px;padding:8px 10px;font-size:11px;color:#64748b;line-height:1.9">
            <span style="color:#dc2626;font-weight:600">⚠ 운영 주의사항</span><br>
            • <code>cancelAmount</code> 생략 = <b>전액취소</b> — 부분취소 시 반드시 금액 명시<br>
            • 취소 금액 &gt; balanceAmount 시 토스 400 에러 (<code>EXCEED_CANCEL_AMOUNT</code>)<br>
            • 쿠폰/포인트 병용 결제 시 취소 우선순위: 현금(카드) 먼저 → 무상지급 나중 (토스 정책)<br>
            • 부분취소마다 <code>od_refund</code> 1건 INSERT + <code>od_refund_method.refund_amt</code> 갱신 필요 (운영 구현 시)<br>
            • 이 테스트 화면은 <b>토스 API 호출만</b> 수행 — DB 도메인 후처리 미연동
          </div>

        </div>
      </div>
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.pay.toss." default-prop-key-filter="app.pay.toss" />
  <bo-zd-yml-grid endpoint="/bo/sy/app-config/toss" default-key-filter="app.pay.toss" />
</div>`,
};

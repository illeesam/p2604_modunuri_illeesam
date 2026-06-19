/**
 * 개발도구 — 토스페이먼츠 결제 테스트
 */
window.ZdTestPaymentToss = {
  name: 'ZdTestPaymentToss',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      clientKey: '',
      secretKey: '',
    });

    const form = reactive({
      amount:      1000,
      orderId:     'TEST-' + Date.now(),
      orderName:   '테스트 상품',
      customerName: '홍길동',
      customerEmail: 'test@shopjoy.kr',
      successUrl:  window.location.origin + '/api/co/cm/toss/confirm',
      failUrl:     window.location.origin + '/?toss_fail=1',
    });

    const result = reactive({
      sdkStatus:       '',
      confirmResult:   null,
      cancelResult:    null,
      error:           '',
      phase:           'idle', // idle | paying | confirming | done
    });

    const uiState = reactive({ sdkLoaded: false, loading: false });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'payment.toss.client_key,payment.toss.secret_key' });
        (res?.data?.data || []).forEach(p => {
          if (p.propKey === 'payment.toss.client_key') cfg.clientKey = p.propValue || '';
          if (p.propKey === 'payment.toss.secret_key') cfg.secretKey = p.propValue || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.TossPayments);
      uiState.sdkLoaded = ok;
      result.sdkStatus  = ok ? '✅ TossPayments SDK 로드됨' : '❌ TossPayments SDK 없음 (toss.payments.js 미로드)';
    };

    const refreshOrderId = () => { form.orderId = 'TEST-' + Date.now(); };

    const testPay = async () => {
      if (!cfg.clientKey) { showToast('Client Key 를 입력하세요.', 'error'); return; }
      if (!uiState.sdkLoaded) { showToast('TossPayments SDK 가 로드되지 않았습니다.', 'error', 0); return; }
      uiState.loading = true;
      result.phase    = 'paying';
      result.error    = '';
      try {
        const toss = TossPayments(cfg.clientKey);
        await toss.requestPayment('카드', {
          amount:        form.amount,
          orderId:       form.orderId,
          orderName:     form.orderName,
          customerName:  form.customerName,
          customerEmail: form.customerEmail,
          successUrl:    form.successUrl,
          failUrl:       form.failUrl,
        });
        // 리다이렉트가 발생하므로 이 이후 코드는 실행 안 됨
      } catch (e) {
        result.error  = e.message || String(e);
        result.phase  = 'idle';
        uiState.loading = false;
        showToast('결제창 오류: ' + (e.message || e), 'error', 0);
      }
    };

    const testConfirmManual = async () => {
      if (!cfg.secretKey) { showToast('Secret Key 를 입력하세요.', 'error'); return; }
      const paymentKey = prompt('paymentKey 를 입력하세요 (토스 리다이렉트 URL 파라미터):');
      if (!paymentKey) return;
      const amount  = parseInt(prompt('amount:') || form.amount);
      const orderId = prompt('orderId:') || form.orderId;
      uiState.loading = true;
      result.phase    = 'confirming';
      try {
        const res = await boApi.post('/co/cm/toss/confirm', { paymentKey, amount, orderId }, coUtil.apiHdr('토스 결제 테스트', '승인'));
        result.confirmResult = res.data?.data || res.data;
        result.phase         = 'done';
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
          paymentKey:    result.confirmResult.paymentKey,
          cancelReason:  '개발자 테스트 취소',
        }, coUtil.apiHdr('토스 결제 테스트', '취소'));
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
        if (cfg.clientKey) rows.push({ propKey: 'payment.toss.client_key', propValue: cfg.clientKey });
        if (cfg.secretKey) rows.push({ propKey: 'payment.toss.secret_key', propValue: cfg.secretKey });
        if (!rows.length) { showToast('저장할 키가 없습니다.', 'error'); return; }
        await boApi.put('/bo/sy/prop/bulk', rows, coUtil.apiHdr('토스 결제 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'pay-test')      return testPay();
      if (cmd === 'confirm-manual') return testConfirmManual();
      if (cmd === 'cancel-test')   return testCancel();
      if (cmd === 'keys-save')     return saveKeys();
      if (cmd === 'orderid-refresh') return refreshOrderId();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">토스페이먼츠 결제 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Client Key (클라이언트)</label>
          <input class="form-control" v-model="cfg.clientKey" placeholder="test_ck_… or live_ck_…" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Secret Key (서버)</label>
          <input class="form-control" type="password" v-model="cfg.secretKey" placeholder="test_sk_… or live_sk_…" />
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:1px">
          <button class="btn btn_save" @click="handleBtnAction('keys-save')">sy_prop 저장</button>
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px">
        SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong>
      </div>
    </div>
  </div>

  <!-- 결제 파라미터 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">결제 파라미터</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group">
          <label class="form-label">금액</label>
          <input class="form-control" type="number" v-model="form.amount" style="width:120px" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">주문 ID</label>
          <div style="display:flex;gap:4px">
            <input class="form-control" v-model="form.orderId" style="flex:1;font-family:monospace;font-size:12px" />
            <button class="btn btn_reset" @click="handleBtnAction('orderid-refresh')" style="white-space:nowrap">새로고침</button>
          </div>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">상품명</label>
          <input class="form-control" v-model="form.orderName" />
        </div>
      </div>
      <div class="form-row" style="gap:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">구매자명</label>
          <input class="form-control" v-model="form.customerName" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">구매자 이메일</label>
          <input class="form-control" v-model="form.customerEmail" />
        </div>
      </div>
    </div>
  </div>

  <!-- 테스트 액션 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">테스트 실행</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_confirm" :disabled="uiState.loading" @click="handleBtnAction('pay-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '결제창 열기' }}
        </button>
        <button class="btn btn_apply" :disabled="uiState.loading" @click="handleBtnAction('confirm-manual')">수동 승인 (paymentKey 입력)</button>
        <button class="btn btn_delete" :disabled="!result.confirmResult" @click="handleBtnAction('cancel-test')">결제 취소</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-bottom:8px">{{ result.error }}</div>
      <!-- 승인 결과 -->
      <div v-if="result.confirmResult" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 결제 승인 결과</div>
        <table style="font-size:12px;border-collapse:collapse;width:100%">
          <tr><td style="padding:2px 8px;color:#555;width:130px">paymentKey</td><td style="font-family:monospace;font-size:11px;word-break:break-all">{{ result.confirmResult.paymentKey }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">orderId</td><td>{{ result.confirmResult.orderId }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">orderName</td><td>{{ result.confirmResult.orderName }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">totalAmount</td><td>{{ (result.confirmResult.totalAmount || 0).toLocaleString() }} 원</td></tr>
          <tr><td style="padding:2px 8px;color:#555">status</td><td><span class="badge badge-green">{{ result.confirmResult.status }}</span></td></tr>
          <tr><td style="padding:2px 8px;color:#555">method</td><td>{{ result.confirmResult.method }}</td></tr>
        </table>
      </div>
      <!-- 취소 결과 -->
      <div v-if="result.cancelResult" style="background:#fff7ed;border:1px solid #fdba74;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:6px;color:#c2410c">⊘ 결제 취소 결과</div>
        <pre style="font-size:11px;overflow:auto;max-height:120px">{{ JSON.stringify(result.cancelResult, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- 흐름 안내 -->
  <div class="card">
    <div class="toolbar"><span class="list-title">연동 흐름</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> 토스페이먼츠 개발자센터 → 앱 생성 → 테스트 키 발급 (test_ck_/test_sk_)<br>
      <b>2.</b> sy_prop <code>payment.toss.client_key</code> / <code>payment.toss.secret_key</code> 등록<br>
      <b>3.</b> 결제창 열기 → 카드/계좌 선택 → successUrl 로 리다이렉트 (paymentKey + orderId + amount 포함)<br>
      <b>4.</b> 백엔드 <code>POST /api/co/cm/toss/confirm</code> 으로 승인 요청<br>
      <b>5.</b> 취소: <code>POST /api/co/cm/toss/cancel</code> (cancelAmount 없으면 전체 취소)
    </div>
  </div>
</div>`,
};

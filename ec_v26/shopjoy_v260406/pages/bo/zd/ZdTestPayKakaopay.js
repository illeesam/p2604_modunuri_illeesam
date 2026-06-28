/**
 * 개발도구 — 카카오페이 결제 테스트
 *
 * 흐름:
 *   1. [결제 준비] POST /api/co/cm/kakaopay/ready → next_redirect_pc_url
 *   2. [리다이렉트] 카카오페이 결제창으로 이동 (팝업 또는 새 탭)
 *   3. 결제 완료 후 approval_url 으로 pg_token 포함 콜백
 *   4. [결제 승인] POST /api/co/cm/kakaopay/approve → 최종 결제 완료
 *   5. [결제 취소] POST /api/co/cm/kakaopay/cancel
 *
 * 테스트 CID: TC0ONETIME (카카오페이 고정 테스트 가맹점 코드)
 * sy_prop: app.pay.kakaopay.cid / app.pay.kakaopay.secret-key
 */
window.ZdTestPayKakaopay = {
  name: 'ZdTestPayKakaopay',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      cid:       '',
      secretKey: '',
    });

    const form = reactive({
      amount:         1000,
      taxFreeAmount:  0,
      orderId:        'KAKAO-' + Date.now(),
      orderName:      '카카오페이 테스트 상품',
      userId:         'test-user-001',
      // 결제 완료/취소/실패 후 리다이렉트 URL (이 테스트에서는 현재 페이지 origin 사용)
      approvalUrl:    window.location.origin + '/?kakao_approve=1',
      cancelUrl:      window.location.origin + '/?kakao_cancel=1',
      failUrl:        window.location.origin + '/?kakao_fail=1',
    });

    const result = reactive({
      readyResult:   null,   // POST /ready 응답
      approveResult: null,   // POST /approve 응답
      cancelResult:  null,   // POST /cancel 응답
      error:         '',
      phase:         'idle', // idle | ready | approving | done
    });

    const uiState = reactive({ loading: false });

    // 수동 승인용 pg_token 입력값 (리다이렉트 URL의 파라미터)
    const manualApprove = reactive({ tid: '', pgToken: '' });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.pay.kakaopay.cid,app.pay.kakaopay.secret-key'
        }, '카카오페이 결제 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.cid       = pickVal('app.pay.kakaopay.cid');
        cfg.secretKey = pickVal('app.pay.kakaopay.secret-key');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const refreshOrderId = () => { form.orderId = 'KAKAO-' + Date.now(); };

    const testReady = async () => {
      if (!cfg.cid)       { showToast('CID 를 입력하세요.', 'error'); return; }
      if (!cfg.secretKey) { showToast('Secret Key 를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.phase    = 'ready';
      result.error    = '';
      result.readyResult = null;
      try {
        const res = await boApi.post('/co/cm/kakaopay/ready', {
          partnerOrderId: form.orderId,
          partnerUserId:  form.userId,
          itemName:       form.orderName,
          totalAmount:    Number(form.amount),
          taxFreeAmount:  Number(form.taxFreeAmount),
          approvalUrl:    form.approvalUrl,
          cancelUrl:      form.cancelUrl,
          failUrl:        form.failUrl,
        }, coUtil.cofApiHdr('카카오페이 결제 테스트', '결제준비'));
        result.readyResult = res.data?.data || res.data;
        // tid를 수동 승인 입력에도 자동 세팅
        if (result.readyResult?.tid) {
          manualApprove.tid = result.readyResult.tid;
        }
        showToast('결제 준비 완료. 카카오페이 결제창을 열어주세요.', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message;
        result.phase = 'idle';
        showToast('결제 준비 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const openKakaoPayWindow = () => {
      if (!result.readyResult?.next_redirect_pc_url) {
        showToast('먼저 결제 준비를 실행하세요.', 'error'); return;
      }
      window.open(result.readyResult.next_redirect_pc_url, 'kakaopay', 'width=480,height=700');
    };

    const testApprove = async () => {
      const tid     = manualApprove.tid;
      const pgToken = manualApprove.pgToken;
      if (!tid)     { showToast('tid 를 입력하세요 (결제 준비 응답 또는 approvalUrl 파라미터).', 'error'); return; }
      if (!pgToken) { showToast('pg_token 을 입력하세요 (approvalUrl 리다이렉트 파라미터).', 'error'); return; }
      uiState.loading = true;
      result.phase    = 'approving';
      result.error    = '';
      try {
        const res = await boApi.post('/co/cm/kakaopay/approve', {
          tid,
          partnerOrderId: form.orderId,
          partnerUserId:  form.userId,
          pgToken,
        }, coUtil.cofApiHdr('카카오페이 결제 테스트', '결제승인'));
        result.approveResult = res.data?.data || res.data;
        result.phase = 'done';
        showToast('결제 승인 완료', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message;
        result.phase = 'ready';
        showToast('결제 승인 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const testCancel = async () => {
      if (!result.approveResult?.tid) { showToast('먼저 결제 승인이 필요합니다.', 'error'); return; }
      const ok = await (window.boApp?.showConfirm || (() => Promise.resolve(true)))('결제 취소', '결제를 취소하시겠습니까?');
      if (!ok) return;
      uiState.loading = true;
      try {
        const res = await boApi.post('/co/cm/kakaopay/cancel', {
          tid:                 result.approveResult.tid,
          cancelAmount:        Number(result.approveResult.amount?.total || form.amount),
          cancelTaxFreeAmount: 0,
          cancelReason:        '개발자 테스트 취소',
        }, coUtil.cofApiHdr('카카오페이 결제 테스트', '결제취소'));
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
        if (cfg.cid)       rows.push({ propKey: 'app.pay.kakaopay.cid',        propValue: cfg.cid });
        if (cfg.secretKey) rows.push({ propKey: 'app.pay.kakaopay.secret-key', propValue: cfg.secretKey });
        if (!rows.length) { showToast('저장할 키가 없습니다.', 'error'); return; }
        await boApi.put('/bo/sy/prop/bulk', rows, coUtil.cofApiHdr('카카오페이 결제 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'ready-test')       return testReady();
      if (cmd === 'open-window')      return openKakaoPayWindow();
      if (cmd === 'approve-test')     return testApprove();
      if (cmd === 'cancel-test')      return testCancel();
      if (cmd === 'keys-save')        return saveKeys();
      if (cmd === 'orderid-refresh')  return refreshOrderId();
    };

    /* ##### [05] 폼/그리드 컬럼 정의 #################################################### */

    // API 키 설정 폼 (cfg)
    const cfgFormColumns = [
      { key: 'cid',       label: 'CID (가맹점코드)', type: 'text', hint: 'cid', mono: true, placeholder: 'TC0ONETIME (테스트)' },
      { key: 'secretKey', label: 'Secret Key',       type: 'text', hint: 'secretKey', colSpan: 2, placeholder: '카카오페이 파트너센터 → Secret Key' },
    ];

    // 결제 파라미터 폼 (form)
    const payFormColumns = [
      { key: 'amount',        label: '금액',              type: 'number', hint: 'amount' },
      { key: 'taxFreeAmount', label: '비과세 금액',        type: 'number', hint: 'taxFreeAmount' },
      { key: 'orderName',     label: '상품명',             type: 'text',   hint: 'orderName' },
      { key: 'orderId',       label: '주문 ID',            type: 'slot',   name: 'orderIdSlot', hint: 'orderId', mono: true },
      { key: 'userId',        label: '파트너 사용자 ID',   type: 'text',   hint: 'userId', mono: true },
      { key: 'approvalUrl',   label: '승인 콜백 URL',      type: 'text',   hint: 'approvalUrl', mono: true, colSpan: 2 },
    ];

    // 수동 승인 폼 (manualApprove)
    const approveFormColumns = [
      { key: 'tid',      label: 'TID',      type: 'text', hint: 'tid',      mono: true, placeholder: 'ready 응답의 tid' },
      { key: 'pgToken',  label: 'pg_token', type: 'text', hint: 'pgToken',  mono: true, placeholder: 'approvalUrl 파라미터의 pg_token', colSpan: 2 },
    ];

    // 결제 준비 결과 그리드
    const readyGridColumns = [
      { key: 'tid',                    label: 'tid',                    mono: true, cellStyle: 'font-size:11px' },
      { key: 'next_redirect_pc_url',   label: 'next_redirect_pc_url',   cellStyle: 'font-size:11px;word-break:break-all', colSpan: 2 },
      { key: 'created_at',             label: 'created_at' },
    ];

    // 결제 승인 결과 그리드
    const approveGridColumns = [
      { key: 'tid',                  label: 'tid',                  mono: true, cellStyle: 'font-size:11px' },
      { key: 'partner_order_id',     label: 'partner_order_id' },
      { key: 'amount_total',         label: 'amount.total',         fmt: (v, row) => (row.amount?.total?.toLocaleString() || '') + ' 원' },
      { key: 'payment_method_type',  label: 'payment_method_type',  badge: () => 'badge-blue' },
      { key: 'item_name',            label: 'item_name' },
      { key: 'approved_at',          label: 'approved_at' },
    ];

    return {
      cfg, form, result, uiState, manualApprove, handleBtnAction,
      cfgFormColumns, payFormColumns, approveFormColumns,
      readyGridColumns, approveGridColumns,
    };
  },

  template: `
<div>
  <div class="page-title">카카오페이 결제 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <button class="btn btn_save" @click="handleBtnAction('keys-save')">sy_prop 저장</button>
      </div>
      <div style="font-size:11px;color:#666;background:#fff8e1;padding:6px 10px;border-radius:4px;line-height:1.8;border:1px solid #ffe082">
        테스트 CID <code>TC0ONETIME</code> 은 카카오페이 공식 테스트용 고정 가맹점코드입니다.
        실제 Secret Key 없이도 ready API 를 호출해 볼 수 있습니다.
      </div>
    </div>
  </div>

  <!-- 결제 파라미터 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">결제 파라미터</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="payFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #orderIdSlot>
          <div style="display:flex;gap:4px">
            <input class="form-control" v-model="form.orderId" style="flex:1;font-family:monospace;font-size:12px" />
            <button class="btn btn_reset" @click="handleBtnAction('orderid-refresh')" style="white-space:nowrap">새로고침</button>
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
        <button class="btn btn_confirm" :disabled="uiState.loading" @click="handleBtnAction('ready-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '결제 준비 (ready)' }}
        </button>
        <button class="btn btn_preview" :disabled="!result.readyResult" @click="handleBtnAction('open-window')">카카오페이 창 열기</button>
        <button class="btn btn_delete" :disabled="!result.approveResult" @click="handleBtnAction('cancel-test')">결제 취소</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-bottom:8px">{{ result.error }}</div>

      <!-- ready 결과 -->
      <div v-if="result.readyResult" style="background:#fffde7;border:1px solid #f9a825;border-radius:6px;padding:10px;margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:6px;color:#f57f17">📋 결제 준비 결과 (TID 복사 후 카카오페이 창 열기)</div>
        <bo-grid :columns="readyGridColumns" :rows="result.readyResult ? [result.readyResult] : []" :show-row-num="false" />
      </div>

      <!-- 수동 승인 영역 -->
      <div style="background:#f0f4ff;border:1px solid #93c5fd;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:600;margin-bottom:8px;color:#1d4ed8">🔑 수동 승인 (카카오페이 결제 완료 후)</div>
        <div style="font-size:11px;color:#555;margin-bottom:6px">
          카카오페이 결제창 완료 후 approval_url 로 리다이렉트 시 <code>pg_token</code> 파라미터가 붙습니다. 복사 후 아래 입력:
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
      <b>1.</b> [결제 준비] <code>POST /api/co/cm/kakaopay/ready</code> → tid + next_redirect_pc_url 반환<br>
      <b>2.</b> [창 열기] next_redirect_pc_url 로 팝업 오픈 → 카카오페이 결제 UI 표시<br>
      <b>3.</b> [결제 완료] approval_url 로 리다이렉트 (URL 파라미터: <code>pg_token</code>)<br>
      <b>4.</b> [결제 승인] <code>POST /api/co/cm/kakaopay/approve</code> (tid + pg_token) → 최종 승인<br>
      <b>5.</b> [결제 취소] <code>POST /api/co/cm/kakaopay/cancel</code> (tid + cancelAmount)<br>
      <br>
      sy_prop: <code>app.pay.kakaopay.cid</code> / <code>app.pay.kakaopay.secret-key</code><br>
      테스트 CID: <code>TC0ONETIME</code> — 카카오페이 공식 테스트 가맹점코드 (운영 시 별도 발급)
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.pay.kakaopay." default-prop-key-filter="app.pay.kakaopay." />
</div>`,
};

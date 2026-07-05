/* ZdSimulClaimMng — 클레임 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  const CLAIM_TYPES = [
    { cd: 'CANCEL',   label: '취소',  badge: 'badge-orange' },
    { cd: 'RETURN',   label: '반품',  badge: 'badge-purple' },
    { cd: 'EXCHANGE', label: '교환',  badge: 'badge-blue'   },
  ];
  const STATUS_FLOW = {
    CANCEL:   ['CLAIM_RECV', 'CANCEL_REQ', 'CANCEL_DONE'],
    RETURN:   ['CLAIM_RECV', 'RETURN_REQ', 'RETURN_COLL', 'RETURN_DONE'],
    EXCHANGE: ['CLAIM_RECV', 'EXCH_REQ',   'EXCH_SHIP',   'EXCH_DONE'],
  };
  const STATUS_LABELS = {
    CLAIM_RECV: '접수', CANCEL_REQ: '취소요청', CANCEL_DONE: '취소완료',
    RETURN_REQ: '반품요청', RETURN_COLL: '수거중', RETURN_DONE: '반품완료',
    EXCH_REQ: '교환요청', EXCH_SHIP: '교환발송', EXCH_DONE: '교환완료',
  };
  const CANCEL_REASONS  = ['단순 변심', '주문 실수', '배송 지연', '가격 불만족', '다른 상품으로 대체'];
  const RETURN_REASONS  = ['상품 불량/파손', '상품 설명과 다름', '오배송', '크기/색상 불일치', '사용 후 불만족'];
  const EXCH_REASONS    = ['사이즈 교환', '색상 교환', '기능 불량', '디자인 불일치', '초기 불량'];
  const UPDATE_ACTIONS  = [
    { value: 'advance', label: '상태 진행' },
    { value: 'memo',    label: '처리 메모 추가' },
  ];

  window.ZdSimulClaimMng = {
    name: 'ZdSimulClaimMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        typeWeights: { CANCEL: 40, RETURN: 35, EXCHANGE: 25 },
        refundRateMin: 80,
        refundRateMax: 100,
        advanceSteps: 1,
        createStatus: 'CLAIM_RECV',
        randomReason: true,
        fromStatus: 'CLAIM_RECV',
        updateAction: 'advance',
        targetType: 'CANCEL',
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        const w = domCfg.typeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of CLAIM_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return CLAIM_TYPES[0];
      };
      const _pickReason = (type) => {
        const pool = type === 'CANCEL' ? CANCEL_REASONS : type === 'RETURN' ? RETURN_REASONS : EXCH_REASONS;
        return pool[Math.floor(Math.random() * pool.length)];
      };

      const simul = useSimulSetup({
        domain: '클레임',
        label: '시뮬클레임',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 2, intervalVal: 20, intervalUnit: 'sec', durationMin: 3 },
        runFn: async ({ mode, randInt, pick }) => {
          if (mode === 'create') {
            const orders = (await boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 50, orderStatusCd: 'COMPLT' })).data?.data?.pageList || [];
            if (!orders.length) return { ok: false, reason: '완료된 주문 없음 (COMPLT 주문 필요)' };
            const order    = pick(orders);
            const type     = _pickType();
            const reason   = domCfg.randomReason ? _pickReason(type.cd) : '테스트 클레임';
            const refRate  = randInt(domCfg.refundRateMin, domCfg.refundRateMax);
            const claimAmt = Math.round((order.totalPayAmt || 10000) * refRate / 100);
            const body     = {
              orderId: order.orderId, claimTypeCd: type.cd,
              claimReason: reason, claimStatusCd: domCfg.createStatus,
              claimAmt, refundAmt: claimAmt,
            };
            const res = await boApi.post('/bo/ec/od/claim/save/base', body, coUtil.apiHdr('클레임시뮬', '생성'));
            const id  = res?.data?.data?.claimId || res?.data?.data?.id || '-';
            return {
              ok: true,
              desc: '[' + type.label + '] ' + order.orderId + ' | ' + reason + ' | ' + claimAmt.toLocaleString() + '원',
              meta: { id, type: type.label, reason },
            };
          } else {
            const q = { pageNo: 1, pageSize: 50 };
            if (domCfg.fromStatus) q.claimStatusCd = domCfg.fromStatus;
            if (domCfg.targetType) q.claimTypeCd   = domCfg.targetType;
            const list = (await boApiSvc.odClaim.getPage(q)).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 클레임 없음' };
            const target = pick(list);
            const flow   = STATUS_FLOW[target.claimTypeCd] || STATUS_FLOW.CANCEL;
            let body = {}, desc = '';
            if (domCfg.updateAction === 'advance') {
              const idx = flow.indexOf(target.claimStatusCd);
              const nst = flow[Math.min(idx + (domCfg.advanceSteps || 1), flow.length - 1)];
              body.claimStatusCd = nst;
              desc = (STATUS_LABELS[target.claimStatusCd] || target.claimStatusCd) + ' → ' + (STATUS_LABELS[nst] || nst);
            } else {
              body.claimMemo = '[시뮬처리] ' + new Date().toLocaleTimeString('ko-KR'); desc = '처리 메모 추가';
            }
            await boApi.put('/bo/ec/od/claim/save/' + target.claimId, body, coUtil.apiHdr('클레임시뮬', '수정'));
            return { ok: true, desc: target.claimId + ' ' + desc, meta: { id: target.claimId } };
          }
        },
      });
      const { cfg, state, logs, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.typeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfCurrentFlow = computed(() => STATUS_FLOW[domCfg.targetType] || STATUS_FLOW.CANCEL);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'createStatus', label: '초기 상태', type: 'select',
          options: [{ value: 'CLAIM_RECV', label: '접수' }] },
        { key: 'refundRateMin', label: '환불률 최소', type: 'number', hint: '%' },
        { key: 'refundRateMax', label: '환불률 최대', type: 'number', hint: '%' },
        { key: 'randomReason',  label: '사유 랜덤 생성', type: 'checkbox' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'targetType',   label: '대상 유형', type: 'select',
          options: CLAIM_TYPES.map(t => ({ value: t.cd, label: t.label })) },
        { key: 'advanceSteps', label: '진행 단계', type: 'select',
          options: [{ value: 1, label: '1단계' }, { value: 2, label: '2단계' }],
          visible: (f) => f.updateAction === 'advance' },
      ];

      return {
        cfg, domCfg, state, logs, cfIsRunning, cfSuccessRate,
        cfTypeTotal, cfCurrentFlow, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog,
        CLAIM_TYPES, STATUS_FLOW, STATUS_LABELS,
      };
    },

    template: `
<div>
  <div class="page-title">🔄 클레임 시뮬레이터</div>
  <div style="display:grid;grid-template-columns:380px 1fr;gap:12px;align-items:start;">

    <div style="display:flex;flex-direction:column;gap:12px;">
      <!-- 실행 제어 (공통 컴포넌트) -->
      <zd-simul-control-panel
        :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
        :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
        accent-color="linear-gradient(90deg,#ea580c,#fb923c)"
        accent-active="background:#fff7ed;border:1.5px solid #ea580c;color:#9a3412;"
        @start="onStart" @stop="onStop" @run-once="onRunOnce" />

      <!-- 생성 옵션 -->
      <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;">
        <div class="list-title">🔄 클레임 생성 옵션</div>
        <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="2" style="margin-top:10px;" />
        <div style="border-top:1px solid #f1f5f9;margin-top:12px;padding-top:12px;">
          <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">클레임 유형 가중치</div>
          <div v-for="t in CLAIM_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span :class="'badge '+t.badge" style="min-width:40px;text-align:center;">{{ t.label }}</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.typeWeights[t.cd]" style="flex:1;accent-color:#ea580c;" />
            <input type="number" min="0" max="100" v-model.number="domCfg.typeWeights[t.cd]" style="width:44px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;padding:2px;" />
            <span style="font-size:10px;color:#94a3b8;min-width:32px;">{{ Math.round(domCfg.typeWeights[t.cd]/cfTypeTotal*100) }}%</span>
          </div>
          <div style="height:10px;border-radius:5px;overflow:hidden;display:flex;margin-top:4px;">
            <div v-for="t in CLAIM_TYPES" :key="t.cd" :style="'flex:'+domCfg.typeWeights[t.cd]+';transition:flex .2s;'+({'CANCEL':'background:#f97316','RETURN':'background:#a855f7','EXCHANGE':'background:#3b82f6'}[t.cd])"></div>
          </div>
        </div>
      </div>

      <!-- 수정 옵션 -->
      <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;">
        <div class="list-title">✏ 클레임 수정 옵션</div>
        <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="1" style="margin-top:10px;" />
        <div style="border-top:1px solid #f1f5f9;margin-top:12px;padding-top:12px;">
          <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;">{{ domCfg.targetType }} 상태 흐름</div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <template v-for="(s,i) in cfCurrentFlow" :key="s">
              <span style="font-size:10px;padding:3px 7px;border-radius:4px;background:#f1f5f9;color:#64748b;">{{ STATUS_LABELS[s] || s }}</span>
              <span v-if="i < cfCurrentFlow.length-1" style="color:#94a3b8;font-size:10px;"> → </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측: 로그 (공통 컴포넌트) -->
    <zd-simul-log-panel :logs="logs" :log-cols="logCols" @clear="onClearLog" />
  </div>
</div>`,
  };
})();

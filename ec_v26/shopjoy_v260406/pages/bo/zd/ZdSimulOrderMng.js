/* ZdSimulOrderMng — 주문 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  const STATUS_FLOW    = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'COMPLT'];
  const STATUS_LABELS  = { PENDING: '결제대기', PAID: '결제완료', PREPARING: '준비중', SHIPPED: '배송중', COMPLT: '완료' };
  const PAY_METHODS    = [
    { value: 'CARD',       label: '신용카드' },
    { value: 'TOSS_PAY',   label: '토스페이' },
    { value: 'KAKAO_PAY',  label: '카카오페이' },
    { value: 'NAVER_PAY',  label: '네이버페이' },
    { value: 'BANK',       label: '무통장입금' },
    { value: 'VBANK',      label: '가상계좌' },
  ];
  const ADDR_LIST      = [
    { zipCode: '06236', addr: '서울 강남구 테헤란로 152', addrDtl: 'GS타워 15층' },
    { zipCode: '03721', addr: '서울 서대문구 연세로 50', addrDtl: '연세대학교 정문' },
    { zipCode: '14068', addr: '경기 안양시 만안구 안양로 123', addrDtl: '안양역 인근' },
    { zipCode: '21565', addr: '인천 남동구 정각로 29', addrDtl: '인천시청 앞' },
    { zipCode: '61452', addr: '광주 북구 용봉로 77', addrDtl: '전남대학교 정문' },
  ];
  const RECEIVER_NAMES = ['홍길동', '이민지', '박서연', '김주혁', '최윤아', '정다은', '강민준', '조현우'];
  const UPDATE_ACTIONS = [
    { value: 'advance', label: '상태 진행' },
    { value: 'cancel',  label: '강제 취소' },
    { value: 'memo',    label: '메모 추가' },
  ];

  window.ZdSimulOrderMng = {
    name: 'ZdSimulOrderMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        itemCountMin: 1,
        itemCountMax: 4,
        amtMin: 10000,
        amtMax: 300000,
        payMethods: ['CARD', 'TOSS_PAY'],
        createStatus: 'PENDING',
        advanceSteps: 1,
        randomAddr: true,
        addDlivFee: true,
        dlivFeeAmt: 3000,
        updateAction: 'advance',
        fromStatus: 'PENDING',
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const simul = useSimulSetup({
        domain: '주문',
        label: '시뮬주문',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 2, intervalVal: 15, intervalUnit: 'sec', durationMin: 3 },
        runFn: async ({ mode, randInt, pick }) => {
          if (mode === 'create') {
            const prods   = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 50, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
            const members = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
            if (!prods.length) return { ok: false, reason: '판매중 상품 없음' };
            if (!members.length) return { ok: false, reason: 'ACTIVE 회원 없음' };
            const member  = pick(members);
            const cnt     = randInt(domCfg.itemCountMin, domCfg.itemCountMax);
            const items   = [];
            let   totalAmt = 0;
            for (let i = 0; i < cnt; i++) {
              const p   = pick(prods);
              const qty = randInt(1, 3);
              const price = Math.min(Math.max(domCfg.amtMin / cnt, p.salePrice || randInt(domCfg.amtMin, domCfg.amtMax)), domCfg.amtMax / cnt);
              items.push({ prodId: p.prodId, qty, unitPrice: Math.round(price), rowAmt: Math.round(price) * qty });
              totalAmt += Math.round(price) * qty;
            }
            const dlivFee = domCfg.addDlivFee && totalAmt < 50000 ? domCfg.dlivFeeAmt : 0;
            const payMethod = domCfg.payMethods.length ? pick(domCfg.payMethods) : 'CARD';
            const addr = domCfg.randomAddr ? pick(ADDR_LIST) : ADDR_LIST[0];
            const body = {
              memberId: member.memberId, memberNm: member.memberNm,
              orderStatusCd: domCfg.createStatus,
              payMethodCd: payMethod,
              orderAmt: totalAmt, dlivFee,
              totalPayAmt: totalAmt + dlivFee,
              receiverNm: pick(RECEIVER_NAMES),
              receiverPhone: '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999)),
              zipCode: addr.zipCode, dlivAddr: addr.addr, dlivAddrDtl: addr.addrDtl,
              orderItems: items,
            };
            const res = await boApi.post('/bo/ec/od/order/save/base', body, coUtil.apiHdr('주문시뮬', '생성'));
            const id  = res?.data?.data?.orderId || res?.data?.data?.id || '-';
            return {
              ok: true,
              desc: member.memberNm + ' | ' + cnt + '개 상품 | ' + (totalAmt + dlivFee).toLocaleString('ko-KR') + '원',
              meta: { id, payMethod, totalAmt, dlivFee },
            };
          } else {
            const action = domCfg.updateAction;
            const excl   = action === 'cancel' ? [] : ['COMPLT'];
            const q      = { pageNo: 1, pageSize: 50 };
            if (domCfg.fromStatus) q.orderStatusCd = domCfg.fromStatus;
            const list = (await boApiSvc.odOrder.getPage(q)).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 주문 없음' };
            const target = pick(list.filter(o => !excl.includes(o.orderStatusCd)));
            if (!target) return { ok: false, reason: '조건에 맞는 주문 없음' };
            let body = {}, desc = '';
            if (action === 'advance') {
              const idx = STATUS_FLOW.indexOf(target.orderStatusCd);
              const nst = STATUS_FLOW[Math.min(idx + (domCfg.advanceSteps || 1), STATUS_FLOW.length - 1)];
              body.orderStatusCd = nst; desc = STATUS_LABELS[target.orderStatusCd] + ' → ' + STATUS_LABELS[nst];
            } else if (action === 'cancel') {
              body.orderStatusCd = 'CANCEL'; desc = '강제 취소';
            } else {
              body.orderMemo = '[시뮬] ' + new Date().toLocaleTimeString('ko-KR'); desc = '메모 추가';
            }
            await boApi.put('/bo/ec/od/order/save/' + target.orderId, body, coUtil.apiHdr('주문시뮬', '수정'));
            return { ok: true, desc: target.orderId + ' ' + desc, meta: { id: target.orderId } };
          }
        },
      });
      const { cfg, state, logs, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'itemCountMin',  label: '아이템 최소',    type: 'number', hint: '개' },
        { key: 'itemCountMax',  label: '아이템 최대',    type: 'number', hint: '개' },
        { key: 'amtMin',        label: '주문 금액 최소', type: 'number', hint: '원' },
        { key: 'amtMax',        label: '주문 금액 최대', type: 'number', hint: '원' },
        { key: 'createStatus',  label: '초기 상태', type: 'select',
          options: STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] })) },
        { key: 'addDlivFee',    label: '배송비 적용',    type: 'checkbox' },
        { key: 'dlivFeeAmt',    label: '배송비',         type: 'number', hint: '원', visible: (f) => !!f.addDlivFee },
        { key: 'randomAddr',    label: '주소 랜덤',      type: 'checkbox' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'fromStatus',   label: '대상 상태', type: 'select',
          options: STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] })),
          visible: (f) => f.updateAction === 'advance' },
        { key: 'advanceSteps', label: '진행 단계', type: 'select',
          options: [{ value: 1, label: '1단계' }, { value: 2, label: '2단계' }, { value: 3, label: '3단계' }],
          visible: (f) => f.updateAction === 'advance' },
      ];

      return {
        cfg, domCfg, state, logs, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog,
        STATUS_FLOW, STATUS_LABELS, PAY_METHODS,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🛒 주문 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#2563eb,#60a5fa)"
    accent-active="background:#eff6ff;border:1.5px solid #2563eb;color:#1d4ed8;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🛒 주문 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 결제수단/상태흐름 (1/3 폭, 아래 줄) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">💳 결제수단 / 상태흐름</div>
      <div style="margin-top:10px;">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">결제수단 선택</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">
          <label v-for="p in PAY_METHODS" :key="p.value"
            :style="'cursor:pointer;padding:3px 8px;border-radius:4px;font-size:11px;' + (domCfg.payMethods.includes(p.value) ? 'background:#eff6ff;border:1px solid #2563eb;color:#1d4ed8;' : 'background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;')">
            <input type="checkbox" :value="p.value" v-model="domCfg.payMethods" style="display:none;">{{ p.label }}
          </label>
        </div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">주문 상태 흐름</div>
        <div style="display:flex;flex-direction:column;gap:3px;">
          <template v-for="(s,i) in STATUS_FLOW" :key="s">
            <span :style="'font-size:11px;padding:4px 8px;border-radius:4px;' + (s===domCfg.createStatus ? 'background:#2563eb;color:#fff;font-weight:600;' : 'background:#f1f5f9;color:#64748b;')">{{ STATUS_LABELS[s] }}</span>
            <span v-if="i < STATUS_FLOW.length-1" style="color:#94a3b8;font-size:10px;padding-left:8px;">↓</span>
          </template>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 주문 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" max-height="320px" style="margin-top:12px;" @clear="onClearLog" />
</div>`,
  };
})();

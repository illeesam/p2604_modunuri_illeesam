/* ZdSimulClaimMng — 클레임 시뮬레이터 */
(function () {
  const { reactive, computed, onMounted } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const CLAIM_TYPES = [
    { cd: 'CANCEL',   label: '취소',  badge: 'badge-orange', color: '#f97316' },
    { cd: 'RETURN',   label: '반품',  badge: 'badge-purple', color: '#a855f7' },
    { cd: 'EXCHANGE', label: '교환',  badge: 'badge-blue',   color: '#3b82f6' },
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
  const ORDER_STATUS_POOL = ['PAID', 'PREPARING', 'SHIPPED', 'COMPLT'];

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
        fixedClaimType:  '__weighted__',
        typeWeights:     { CANCEL: 40, RETURN: 35, EXCHANGE: 25 },
        refundRateMin:   80,
        refundRateMax:   100,
        partialClaim:    true,
        randomReason:    true,
        fromOrderStatus: 'COMPLT',
        createStatus:    'CLAIM_RECV',
        updateAction:    'advance',
        advanceSteps:    1,
        targetType:      'CANCEL',
        fromStatus:      'CLAIM_RECV',
        /* 고정 지정 */
        fixedOrderId:    '',
        fixedMemberId:   '',
        fixedMemberNm:   '',
      });

      /* ── picker 모달 상태 ──────────────────────────── */
      const memberPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const orderPicker  = reactive({ show: false, searchValue: '', rows: [], loading: false });
      /* 선택된 주문 아이템 목록 (체크 + 클레임 수량) */
      const orderItems   = reactive({ list: [], loading: false, orderId: '' });

      const _loadMemberPicker = async () => {
        memberPicker.loading = true;
        try {
          const res = await boApiSvc.mbMember.getPage({
            pageNo: 1, pageSize: 30, memberStatusCd: 'ACTIVE',
            ...(memberPicker.searchValue ? { searchValue: memberPicker.searchValue, searchType: 'memberId,memberNm,loginId' } : {}),
          });
          memberPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { memberPicker.rows = []; }
        memberPicker.loading = false;
      };
      const _loadOrderPicker = async () => {
        orderPicker.loading = true;
        try {
          const res = await boApiSvc.odOrder.getPage({
            pageNo: 1, pageSize: 30,
            ...(domCfg.fixedMemberId ? { memberId: domCfg.fixedMemberId } : {}),
            ...(orderPicker.searchValue ? { searchValue: orderPicker.searchValue, searchType: 'orderId' } : {}),
          });
          orderPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { orderPicker.rows = []; }
        orderPicker.loading = false;
      };
      const onOpenMemberPicker = async () => {
        memberPicker.show = true;
        memberPicker.searchValue = '';
        await _loadMemberPicker();
      };
      const onOpenOrderPicker = async () => {
        orderPicker.show = true;
        orderPicker.searchValue = '';
        await _loadOrderPicker();
      };
      const onSelectMember = (row) => {
        domCfg.fixedMemberId = row.memberId;
        const nm = row.memberNm || row.loginId || row.memberId;
        domCfg.fixedMemberNm = window.ZdSimulBase?._sanitize ? window.ZdSimulBase._sanitize(nm) : nm;
        memberPicker.show = false;
        /* 회원 바꾸면 주문/아이템 초기화 */
        domCfg.fixedOrderId = '';
        orderItems.list = [];
        orderItems.orderId = '';
      };
      const _loadOrderItems = async (orderId) => {
        if (!orderId) { orderItems.list = []; orderItems.orderId = ''; return; }
        orderItems.loading = true;
        orderItems.orderId = orderId;
        try {
          const res = await boApiSvc.odOrder.getById(orderId);
          const items = res.data?.data?.orderItems || [];
          /* 각 아이템에 체크/클레임수량 필드 추가 */
          orderItems.list = items.map(it => ({
            ...it,
            _checked: true,
            _claimQty: it.orderQty || 1,
          }));
        } catch (_) { orderItems.list = []; }
        orderItems.loading = false;
      };
      const onSelectOrder = async (row) => {
        domCfg.fixedOrderId = row.orderId;
        orderPicker.show = false;
        await _loadOrderItems(row.orderId);
      };
      /* 랜덤 1건 즉시 pick */
      const onPickRandomMember = async () => {
        try {
          const rows = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
          if (!rows.length) return props.showToast('조회된 회원 없음', 'error');
          onSelectMember(rows[Math.floor(Math.random() * rows.length)]);
        } catch (_) { props.showToast('회원 랜덤 조회 실패', 'error'); }
      };
      const onPickRandomOrder = async () => {
        try {
          const q = { pageNo: 1, pageSize: 50 };
          if (domCfg.fromOrderStatus) q.orderStatusCd = domCfg.fromOrderStatus;
          if (domCfg.fixedMemberId)   q.memberId = domCfg.fixedMemberId;
          const rows = (await boApiSvc.odOrder.getPage(q)).data?.data?.pageList || [];
          if (!rows.length) return props.showToast('조회된 주문 없음', 'error');
          await onSelectOrder(rows[Math.floor(Math.random() * rows.length)]);
        } catch (_) { props.showToast('주문 랜덤 조회 실패', 'error'); }
      };

      const onRandomCheckItems = () => {
        orderItems.list.forEach(it => {
          it._checked = Math.random() > 0.35;
          if (it._checked && it.orderQty > 1) {
            it._claimQty = Math.floor(Math.random() * it.orderQty) + 1;
          }
        });
        /* 최소 1개는 체크 */
        if (!orderItems.list.some(it => it._checked) && orderItems.list.length) {
          orderItems.list[0]._checked = true;
        }
      };
      const onCheckAllItems = () => {
        const allChecked = orderItems.list.every(it => it._checked);
        orderItems.list.forEach(it => { it._checked = !allChecked; });
        if (!orderItems.list.some(it => it._checked) && orderItems.list.length) {
          orderItems.list[0]._checked = true;
        }
      };

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        if (domCfg.fixedClaimType && domCfg.fixedClaimType !== '__weighted__') {
          return CLAIM_TYPES.find(t => t.cd === domCfg.fixedClaimType) || CLAIM_TYPES[0];
        }
        const w = domCfg.typeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of CLAIM_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return CLAIM_TYPES[0];
      };
      const _pickReason = (typeCd) => {
        const pool = typeCd === 'CANCEL' ? CANCEL_REASONS : typeCd === 'RETURN' ? RETURN_REASONS : EXCH_REASONS;
        return pool[Math.floor(Math.random() * pool.length)];
      };

      const simul = useSimulSetup({
        domain: '클레임',
        uiNm: '클레임 시뮬레이터',
        label: '시뮬클레임',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, simulYn, randInt, pick }) => {
          if (mode === 'create') {
            /* 1) 대상 주문: 고정 지정 or 랜덤 */
            let order;
            if (domCfg.fixedOrderId) {
              order = { orderId: domCfg.fixedOrderId };
            } else {
              const q = { pageNo: 1, pageSize: 50, simulYn: 'Y' };
              if (domCfg.fromOrderStatus) q.orderStatusCd = domCfg.fromOrderStatus;
              if (domCfg.fixedMemberId)   q.memberId = domCfg.fixedMemberId;
              const orders = (await boApiSvc.odOrder.getPage(q)).data?.data?.pageList || [];
              if (!orders.length) return { ok: false, reason: '대상 주문 없음 (상태: ' + (domCfg.fromOrderStatus || '전체') + ')' };
              order = pick(orders);
            }

            /* 2) 클레임 유형 & 사유 */
            const type   = _pickType();
            const reason = domCfg.randomReason ? _pickReason(type.cd) : '시뮬레이터 테스트';
            const refRate = randInt(domCfg.refundRateMin, domCfg.refundRateMax);

            /* 3) 시뮬 전용 API — 서버사이드에서 orderItems 조회 후 클레임 자동 생성 */
            /* 주문 고정 지정이고 아이템이 로드된 경우 선택된 항목만 전달 */
            const selectedItems = (domCfg.fixedOrderId && orderItems.list.length)
              ? orderItems.list
                  .filter(it => it._checked)
                  .map(it => ({ orderItemId: it.orderItemId, claimQty: it._claimQty }))
              : null;
            const body = {
              orderId:       order.orderId,
              claimTypeCd:   type.cd,
              reasonCd:      reason.replace(/\s/g, '_').toUpperCase().slice(0, 20),
              claimStatusCd: domCfg.createStatus,
              partialClaim:  domCfg.partialClaim,
              refundRate:    refRate,
              simulYn:       simulYn || 'Y',
              ...(selectedItems ? { selectedItems } : {}),
            };
            const res = await boApi.post('/bo/zd/simul/claim/from-order', body, coUtil.cofApiHdr('클레임시뮬', '생성'));
            const d = res?.data?.data || {};
            const id = d.claimId || '-';
            const itemDesc = d.itemCount ? d.itemCount + '개 상품' : '금액기반';
            const refundAmt = d.refundAmt || 0;
            return {
              ok: true,
              desc: '[' + type.label + '] ' + order.orderId + ' | ' + itemDesc + ' | ' + refundAmt.toLocaleString() + '원 | ' + reason,
              meta: { id, type: type.label, reason, params: { orderId: order.orderId, claimTypeCd: type.cd, claimStatusCd: domCfg.createStatus, partialClaim: domCfg.partialClaim, refundRate: refRate } },
            };

          } else {
            /* 수정 모드 */
            const q = { pageNo: 1, pageSize: 50 };
            if (domCfg.fromStatus) q.claimStatusCd = domCfg.fromStatus;
            if (domCfg.targetType) q.claimTypeCd   = domCfg.targetType;
            const list = (await boApiSvc.odClaim.getPage(q)).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 클레임 없음 (유형: ' + domCfg.targetType + ', 상태: ' + domCfg.fromStatus + ')' };

            const target = pick(list);
            const flow   = STATUS_FLOW[target.claimTypeCd] || STATUS_FLOW.CANCEL;
            let body = {}, desc = '';

            if (domCfg.updateAction === 'advance') {
              const idx = flow.indexOf(target.claimStatusCd);
              const nst = flow[Math.min(idx + (domCfg.advanceSteps || 1), flow.length - 1)];
              body.claimStatusCd = nst;
              desc = (STATUS_LABELS[target.claimStatusCd] || target.claimStatusCd) + ' → ' + (STATUS_LABELS[nst] || nst);
            } else {
              body.claimMemo = '[시뮬처리] ' + new Date().toLocaleTimeString('ko-KR');
              desc = '메모 추가';
            }

            const updateBody = { claimId: target.claimId, ...body };
            await boApi.post('/bo/zd/simul/claim/update', updateBody, coUtil.cofApiHdr('클레임시뮬', '수정'));
            return { ok: true, desc: target.claimId + ' ' + desc, meta: { id: target.claimId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.typeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfAutoFlow  = computed(() => STATUS_FLOW[domCfg.targetType] || STATUS_FLOW.CANCEL);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'fromOrderStatus', label: '대상 주문 상태', type: 'select',
          options: [{ value: '', label: '전체' }, ...ORDER_STATUS_POOL.map(s => ({ value: s, label: s }))] },
        { key: 'createStatus',   label: '클레임 초기 상태', type: 'select',
          options: [{ value: 'CLAIM_RECV', label: '접수' }] },
        { key: 'partialClaim',   label: '부분 클레임 (랜덤 수량)', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        makeRangeCol('refundRateMin', 'refundRateMax', '환불률 범위', 0, 100, '%',
          { visible: (f) => !f.partialClaim }),
        { key: 'randomReason',   label: '사유 랜덤 생성', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'targetType',   label: '대상 유형', type: 'select',
          options: CLAIM_TYPES.map(t => ({ value: t.cd, label: t.label })) },
        { key: 'fromStatus',   label: '현재 상태', type: 'select',
          options: [{ value: '', label: '전체' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))] },
        { key: 'advanceSteps', label: '진행 단계', type: 'select',
          options: [{ value: 1, label: '1단계' }, { value: 2, label: '2단계' }],
          visible: (f) => f.updateAction === 'advance' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'refundRateMin', maxKey: 'refundRateMax' },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        cfTypeTotal, cfAutoFlow,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        CLAIM_TYPES, STATUS_FLOW, STATUS_LABELS,
        /* picker */
        memberPicker, orderPicker, orderItems,
        onOpenMemberPicker, onOpenOrderPicker,
        onSelectMember, onSelectOrder,
        onPickRandomMember, onPickRandomOrder,
        onRandomCheckItems, onCheckAllItems,
        _loadMemberPicker, _loadOrderPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🔄 클레임 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#ea580c,#fb923c)"
    accent-active="background:#fff7ed;border:1.5px solid #ea580c;color:#9a3412;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 시뮬 대상 지정 + 주문 아이템 선택 (3열 그리드) -->
  <div class="card" style="padding:12px 16px;margin-top:12px;">
    <div class="list-title">🎯 시뮬 대상 지정</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:10px;align-items:start;">
      <!-- 회원 지정 (1/3) -->
      <div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">👤 주문 회원 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedMemberNm || domCfg.fixedMemberId || ''" readonly
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;" />
          <button v-if="domCfg.fixedMemberId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedMemberId='';domCfg.fixedMemberNm='';domCfg.fixedOrderId='';orderItems.list=[];orderItems.orderId=''">✕</button>
          <button class="btn" style="height:28px;padding:0 8px;font-size:11px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;"
            @click="onPickRandomMember">랜덤</button>
          <button class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenMemberPicker">선택</button>
        </div>
        <div v-if="domCfg.fixedMemberId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedMemberId }}</div>
        <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 시뮬 주문의 회원 랜덤</div>
      </div>
      <!-- 주문 지정 (1/4) -->
      <div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">🛒 대상 주문 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedOrderId || ''" readonly
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;font-family:monospace;" />
          <button v-if="domCfg.fixedOrderId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedOrderId='';orderItems.list=[];orderItems.orderId=''">✕</button>
          <button class="btn" style="height:28px;padding:0 8px;font-size:11px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;"
            @click="onPickRandomOrder">랜덤</button>
          <button class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenOrderPicker">선택</button>
        </div>
        <div v-if="domCfg.fixedOrderId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedOrderId }}</div>
        <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 조건에 맞는 시뮬 주문 랜덤</div>
      </div>
      <!-- 주문 아이템 선택 (1/3) -->
      <div v-if="cfg.mode==='create' && domCfg.fixedOrderId">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <div style="font-size:11px;font-weight:600;color:#475569;">📦 주문 아이템 선택</div>
          <div style="margin-left:auto;display:flex;gap:4px;">
            <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;"
              @click="onRandomCheckItems">🎲 랜덤</button>
            <button class="btn" style="height:22px;padding:0 7px;font-size:10px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;"
              @click="onCheckAllItems">{{ orderItems.list.every(it => it._checked) ? '전체해제' : '전체선택' }}</button>
          </div>
        </div>
        <div v-if="orderItems.loading" style="text-align:center;padding:12px;color:#94a3b8;font-size:11px;">로드 중...</div>
        <div v-else-if="!orderItems.list.length" style="text-align:center;padding:12px;color:#94a3b8;font-size:11px;">아이템 없음</div>
        <table v-else style="font-size:11px;width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;">
            <th style="width:28px;text-align:center;border:1px solid #e2e8f0;padding:4px;">
              <input type="checkbox" :checked="orderItems.list.every(it => it._checked)"
                :indeterminate.prop="orderItems.list.some(it => it._checked) &amp;&amp; !orderItems.list.every(it => it._checked)"
                @change="onCheckAllItems" style="cursor:pointer;" />
            </th>
            <th style="border:1px solid #e2e8f0;padding:4px 8px;">상품명</th>
            <th style="width:40px;text-align:center;border:1px solid #e2e8f0;padding:4px;">주문</th>
            <th style="width:90px;text-align:center;border:1px solid #e2e8f0;padding:4px;">클레임수량</th>
            <th style="width:70px;text-align:right;border:1px solid #e2e8f0;padding:4px 8px;">소계</th>
          </tr></thead>
          <tbody>
            <tr v-for="it in orderItems.list" :key="it.orderItemId"
              :style="it._checked ? '' : 'opacity:0.4;'">
              <td style="text-align:center;border:1px solid #e2e8f0;padding:4px;">
                <input type="checkbox" v-model="it._checked" style="cursor:pointer;" />
              </td>
              <td style="border:1px solid #e2e8f0;padding:4px 8px;max-width:0;">
                <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="it.prodNm || it.prodId">{{ it.prodNm || it.prodId }}</div>
                <div v-if="it.optNm" style="font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ it.optNm }}</div>
              </td>
              <td style="text-align:center;font-family:monospace;border:1px solid #e2e8f0;padding:4px;">{{ it.orderQty }}</td>
              <td style="text-align:center;border:1px solid #e2e8f0;padding:4px;">
                <div style="display:flex;align-items:center;gap:3px;justify-content:center;">
                  <input type="range" min="1" :max="it.orderQty || 1" v-model.number="it._claimQty"
                    :disabled="!it._checked" style="width:44px;accent-color:#ea580c;" />
                  <span style="font-family:monospace;min-width:14px;font-weight:600;color:#ea580c;font-size:11px;">{{ it._claimQty }}</span>
                </div>
              </td>
              <td style="text-align:right;font-family:monospace;font-weight:600;border:1px solid #e2e8f0;padding:4px 8px;">
                {{ (it._checked ? (it.unitPrice||0)*it._claimQty : 0).toLocaleString() }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background:#fff7ed;">
              <td colspan="4" style="text-align:right;font-size:11px;font-weight:600;color:#ea580c;border:1px solid #e2e8f0;padding:4px 8px;">예상 환불액</td>
              <td style="text-align:right;font-family:monospace;font-weight:700;color:#ea580c;border:1px solid #e2e8f0;padding:4px 8px;">
                {{ orderItems.list.filter(it => it._checked).reduce((s,it) => s+(it.unitPrice||0)*it._claimQty,0).toLocaleString() }}원
              </td>
            </tr>
          </tfoot>
        </table>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px;">※ 체크 아이템만 클레임 대상</div>
      </div>
      <!-- 주문 미지정 시 우측 빈 영역 -->
      <div v-else style="border-left:1px solid #f1f5f9;padding-left:12px;display:flex;align-items:center;justify-content:center;">
        <div style="font-size:11px;color:#cbd5e1;text-align:center;">주문 선택 시<br>아이템 목록 표시</div>
      </div>
    </div>
  </div>

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🔄 클레임 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('refundRateMin','refundRateMax',0,100,'%')}
    </bo-form-area>
  </div>

  <!-- 클레임 유형 가중치 (1/3 폭) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 클레임 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">유형 지정</label>
        <select v-model="domCfg.fixedClaimType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in CLAIM_TYPES" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedClaimType === '__weighted__'">
        <div v-for="t in CLAIM_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span :class="'badge '+t.badge" style="min-width:40px;text-align:center;font-size:11px;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.typeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.typeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.typeWeights[t.cd]/cfTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:4px;">
          <div v-for="t in CLAIM_TYPES" :key="t.cd" :style="'flex:'+domCfg.typeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 클레임 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="border-top:1px solid #f1f5f9;margin-top:10px;padding-top:10px;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">{{ domCfg.targetType }} 상태 흐름</div>
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
        <template v-for="(s,i) in cfAutoFlow" :key="s">
          <span style="font-size:10px;padding:3px 7px;border-radius:4px;background:#f1f5f9;color:#64748b;">{{ STATUS_LABELS[s] || s }}</span>
          <span v-if="i < cfAutoFlow.length-1" style="color:#94a3b8;font-size:10px;"> → </span>
        </template>
      </div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 회원 picker 모달 -->
  <bo-modal :show="memberPicker.show" title="시뮬 회원 선택" width="640px" @close="memberPicker.show=false">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="memberPicker.searchValue" placeholder="회원ID / 이름 / 로그인ID 검색"
          class="form-control" style="flex:1;height:30px;font-size:12px;"
          @keyup.enter="onOpenMemberPicker" />
        <button class="btn btn_search" style="height:30px;font-size:12px;" @click="onOpenMemberPicker">조회</button>
      </div>
      <table class="admin-table" style="font-size:11px;">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>회원ID</th>
          <th>이름</th>
          <th>로그인ID</th>
          <th style="width:70px;text-align:center;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="memberPicker.loading"><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">조회 중...</td></tr>
          <tr v-else-if="!memberPicker.rows.length"><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-else v-for="(r,i) in memberPicker.rows" :key="r.memberId">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:10px;">{{ r.memberId }}</td>
            <td>{{ r.memberNm }}</td>
            <td>{{ r.loginId }}</td>
            <td style="text-align:center;">
              <button class="btn btn_select" style="font-size:11px;height:24px;padding:0 8px;" @click="onSelectMember(r)">선택</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 주문 picker 모달 -->
  <bo-modal :show="orderPicker.show" title="시뮬 주문 선택" width="760px" @close="orderPicker.show=false">
    <div style="padding:12px 0 8px;">
      <div v-if="domCfg.fixedMemberId" style="font-size:11px;color:#6366f1;margin-bottom:8px;padding:6px 10px;background:#f0f0ff;border-radius:6px;">
        👤 회원 필터: {{ domCfg.fixedMemberNm || domCfg.fixedMemberId }} ({{ domCfg.fixedMemberId }})
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="orderPicker.searchValue" placeholder="주문ID 검색"
          class="form-control" style="flex:1;height:30px;font-size:12px;font-family:monospace;"
          @keyup.enter="onOpenOrderPicker" />
        <button class="btn btn_search" style="height:30px;font-size:12px;" @click="onOpenOrderPicker">조회</button>
      </div>
      <table class="admin-table" style="font-size:11px;">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>주문ID</th>
          <th>회원</th>
          <th>주문상태</th>
          <th style="text-align:right;">결제금액</th>
          <th style="width:70px;text-align:center;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="orderPicker.loading"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 중...</td></tr>
          <tr v-else-if="!orderPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-else v-for="(r,i) in orderPicker.rows" :key="r.orderId">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:10px;">{{ r.orderId }}</td>
            <td>{{ r.memberNm || r.memberId }}</td>
            <td><span class="badge badge-blue" style="font-size:10px;">{{ r.orderStatusCd }}</span></td>
            <td style="text-align:right;font-family:monospace;">{{ (r.totalPayAmt||0).toLocaleString() }}원</td>
            <td style="text-align:center;">
              <button class="btn btn_select" style="font-size:11px;height:24px;padding:0 8px;" @click="onSelectOrder(r)">선택</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();

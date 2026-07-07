/* ZdSimulOrderMng — 주문 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, ref, computed, onMounted } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

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
        /* 고정 지정 */
        fixedMemberId: '',
        fixedMemberNm: '',
        fixedProdId: '',
        fixedProdNm: '',
        fixedOrderId: '',
      });

      /* ── picker 모달 상태 ──────────────────────────── */
      const memberPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const prodPicker   = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const orderPicker  = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const onOpenMemberPicker = async () => {
        memberPicker.show = true;
        memberPicker.searchValue = '';
        await _loadMemberPicker();
      };
      const onOpenProdPicker = async () => {
        prodPicker.show = true;
        prodPicker.searchValue = '';
        await _loadProdPicker();
      };
      const onOpenOrderPicker = async () => {
        orderPicker.show = true;
        orderPicker.searchValue = '';
        await _loadOrderPicker();
      };

      const _loadMemberPicker = async () => {
        memberPicker.loading = true;
        try {
          const res = await boApiSvc.mbMember.getPage({
            pageNo: 1, pageSize: 30, simulYn: 'Y',
            ...(memberPicker.searchValue ? { searchValue: memberPicker.searchValue, searchType: 'memberId,memberNm,loginId' } : {}),
          });
          memberPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { memberPicker.rows = []; }
        memberPicker.loading = false;
      };
      const _loadProdPicker = async () => {
        prodPicker.loading = true;
        try {
          const res = await boApiSvc.pdProd.getPage({
            pageNo: 1, pageSize: 30, simulYn: 'Y',
            ...(prodPicker.searchValue ? { searchValue: prodPicker.searchValue, searchType: 'prodId,prodNm' } : {}),
          });
          prodPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { prodPicker.rows = []; }
        prodPicker.loading = false;
      };
      const _loadOrderPicker = async () => {
        orderPicker.loading = true;
        try {
          const res = await boApiSvc.odOrder.getPage({
            pageNo: 1, pageSize: 30, simulYn: 'Y',
            ...(orderPicker.searchValue ? { searchValue: orderPicker.searchValue, searchType: 'orderId' } : {}),
          });
          orderPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { orderPicker.rows = []; }
        orderPicker.loading = false;
      };

      const onSelectMember = (row) => {
        domCfg.fixedMemberId = row.memberId;
        const nm = row.memberNm || row.loginId || row.memberId;
        domCfg.fixedMemberNm = window.ZdSimulBase?._sanitize ? window.ZdSimulBase._sanitize(nm) : nm;
        memberPicker.show = false;
      };
      const onSelectProd = (row) => {
        domCfg.fixedProdId = row.prodId;
        domCfg.fixedProdNm = row.prodNm || row.prodId;
        prodPicker.show = false;
      };
      const onSelectOrder = (row) => {
        domCfg.fixedOrderId = row.orderId;
        orderPicker.show = false;
      };

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const simul = useSimulSetup({
        domain: '주문',
        uiNm: '주문 시뮬레이터',
        label: '시뮬주문',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, simulYn, randInt, pick }) => {
          if (mode === 'create') {
            /* 상품: 고정 지정 or 랜덤 */
            let prods = [];
            if (domCfg.fixedProdId) {
              prods = [{ prodId: domCfg.fixedProdId, prodNm: domCfg.fixedProdNm, salePrice: domCfg.amtMin }];
            } else {
              const cnt = randInt(domCfg.itemCountMin, domCfg.itemCountMax);
              const randRes = await boApi.post('/bo/zd/simul/order/rand-prod',
                { count: Math.max(cnt, 5), prodStatusCd: 'SELLING' }, coUtil.cofApiHdr('주문시뮬', '상품조회'));
              prods = randRes?.data?.data?.prods || [];
            }

            /* 회원: 고정 지정 or 랜덤 */
            let member;
            if (domCfg.fixedMemberId) {
              member = { memberId: domCfg.fixedMemberId, memberNm: domCfg.fixedMemberNm };
            } else {
              const members = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
              if (!members.length) return { ok: false, reason: 'ACTIVE 회원 없음' };
              member = pick(members);
            }

            if (!prods.length) return { ok: false, reason: '판매중 상품 없음' };

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
              simulYn: simulYn || 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/order/create', body, coUtil.cofApiHdr('주문시뮬', '생성'));
            const id  = res?.data?.data?.orderId || '-';
            return {
              ok: true,
              desc: member.memberNm + ' | ' + cnt + '개 상품 | ' + (totalAmt + dlivFee).toLocaleString('ko-KR') + '원',
              meta: { id, payMethod, totalAmt, dlivFee, memberId: member.memberId, params: body },
            };
          } else {
            /* 수정: 고정 주문 or 랜덤 */
            let target;
            if (domCfg.fixedOrderId) {
              target = { orderId: domCfg.fixedOrderId, orderStatusCd: domCfg.fromStatus || 'PENDING' };
            } else {
              const action = domCfg.updateAction;
              const excl   = action === 'cancel' ? [] : ['COMPLT'];
              const q      = { pageNo: 1, pageSize: 50 };
              if (domCfg.fromStatus) q.orderStatusCd = domCfg.fromStatus;
              const list = (await boApiSvc.odOrder.getPage(q)).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 주문 없음' };
              target = pick(list.filter(o => !excl.includes(o.orderStatusCd)));
              if (!target) return { ok: false, reason: '조건에 맞는 주문 없음' };
            }
            const action = domCfg.updateAction;
            let body = {}, desc = '';
            if (action === 'advance') {
              const idx = STATUS_FLOW.indexOf(target.orderStatusCd);
              const nst = STATUS_FLOW[Math.min(idx + (domCfg.advanceSteps || 1), STATUS_FLOW.length - 1)];
              body.orderStatusCd = nst; desc = (STATUS_LABELS[target.orderStatusCd] || target.orderStatusCd) + ' → ' + STATUS_LABELS[nst];
            } else if (action === 'cancel') {
              body.orderStatusCd = 'CANCEL'; desc = '강제 취소';
            } else {
              body.orderMemo = '[시뮬] ' + new Date().toLocaleTimeString('ko-KR'); desc = '메모 추가';
            }
            const updateBody = { orderId: target.orderId, ...body };
            await boApi.post('/bo/zd/simul/order/update', updateBody, coUtil.cofApiHdr('주문시뮬', '수정'));
            return { ok: true, desc: target.orderId + ' ' + desc, meta: { id: target.orderId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        makeRangeCol('itemCountMin', 'itemCountMax', '아이템 수 범위', 1, 20, '개'),
        makeRangeCol('amtMin', 'amtMax', '주문 금액 범위', 10000, 300000, '원'),
        { key: 'createStatus',  label: '초기 상태', type: 'select',
          options: STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] })) },
        { key: 'addDlivFee',    label: '배송비 적용',    type: 'checkbox', checkedValue: true, uncheckedValue: false },
        { key: 'dlivFeeAmt',    label: '배송비',         type: 'number', hint: '원', visible: (f) => !!f.addDlivFee },
        { key: 'randomAddr',    label: '주소 랜덤',      type: 'checkbox', checkedValue: true, uncheckedValue: false },
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

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'itemCountMin', maxKey: 'itemCountMax' },
        { minKey: 'amtMin',       maxKey: 'amtMax'       },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        STATUS_FLOW, STATUS_LABELS, PAY_METHODS,
        /* picker */
        memberPicker, prodPicker, orderPicker,
        onOpenMemberPicker, onOpenProdPicker, onOpenOrderPicker,
        onSelectMember, onSelectProd, onSelectOrder,
        _loadMemberPicker, _loadProdPicker, _loadOrderPicker,
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

  <!-- 시뮬 대상 고정 지정 -->
  <div class="card" style="padding:12px 16px;margin-top:12px;">
    <div class="list-title">🎯 시뮬 대상 지정</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px;">
      <!-- 회원 지정 -->
      <div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">👤 주문 회원 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedMemberNm || domCfg.fixedMemberId || ''" readonly
            placeholder="랜덤 선택"
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
            @click="onOpenMemberPicker" />
          <button v-if="domCfg.fixedMemberId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedMemberId='';domCfg.fixedMemberNm=''">✕</button>
          <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenMemberPicker">선택</button>
        </div>
        <div v-if="domCfg.fixedMemberId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedMemberId }}</div>
        <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 ACTIVE 회원 랜덤</div>
      </div>
      <!-- 상품 지정 -->
      <div>
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">📦 주문 상품 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedProdNm || domCfg.fixedProdId || ''" readonly
            placeholder="랜덤 선택"
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
            @click="onOpenProdPicker" />
          <button v-if="domCfg.fixedProdId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedProdId='';domCfg.fixedProdNm=''">✕</button>
          <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenProdPicker">선택</button>
        </div>
        <div v-if="domCfg.fixedProdId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedProdId }}</div>
        <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 판매중 상품 랜덤</div>
      </div>
      <!-- 수정 대상 주문 지정 (수정 모드) -->
      <div v-if="cfg.mode==='update'">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">🛒 수정 대상 주문 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedOrderId || ''" readonly
            placeholder="랜덤 선택"
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;font-family:monospace;"
            @click="onOpenOrderPicker" />
          <button v-if="domCfg.fixedOrderId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedOrderId=''">✕</button>
          <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenOrderPicker">선택</button>
        </div>
        <div v-if="!domCfg.fixedOrderId" style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 조건에 맞는 주문 랜덤</div>
      </div>
      <div v-else style="font-size:10px;color:#94a3b8;padding-top:24px;">※ 수정 모드 전환 시 주문도 지정 가능</div>
    </div>
  </div>

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🛒 주문 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('itemCountMin','itemCountMax',1,20,'개')}
      ${rangeSlotTemplate('amtMin','amtMax',10000,300000,'원')}
    </bo-form-area>
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
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 회원 picker 모달 -->
  <bo-modal :show="memberPicker.show" title="회원 선택" @close="memberPicker.show=false" box-width="600px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="memberPicker.searchValue" placeholder="이름 / 이메일 / ID 검색" @keyup.enter="_loadMemberPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadMemberPicker">조회</button>
      </div>
      <div v-if="memberPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>ID</th>
          <th>이름</th>
          <th>이메일</th>
          <th>상태</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!memberPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in memberPicker.rows" :key="r.memberId" style="cursor:pointer;" @click="onSelectMember(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.memberId }}</td>
            <td>{{ r.memberNm }}</td>
            <td style="font-size:11px;color:#64748b;">{{ r.loginId }}</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.memberStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 상품 picker 모달 -->
  <bo-modal :show="prodPicker.show" title="상품 선택" @close="prodPicker.show=false" box-width="640px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="prodPicker.searchValue" placeholder="상품명 / 상품ID 검색" @keyup.enter="_loadProdPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadProdPicker">조회</button>
      </div>
      <div v-if="prodPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>상품ID</th>
          <th>상품명</th>
          <th style="text-align:right;">판매가</th>
          <th>상태</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!prodPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in prodPicker.rows" :key="r.prodId" style="cursor:pointer;" @click="onSelectProd(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.prodId }}</td>
            <td>{{ r.prodNm }}</td>
            <td style="text-align:right;">{{ (r.salePrice||0).toLocaleString() }}원</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.prodStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 주문 picker 모달 -->
  <bo-modal :show="orderPicker.show" title="주문 선택" @close="orderPicker.show=false" box-width="620px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="orderPicker.searchValue" placeholder="주문ID 검색" @keyup.enter="_loadOrderPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;font-family:monospace;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadOrderPicker">조회</button>
      </div>
      <div v-if="orderPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>주문ID</th>
          <th>주문자</th>
          <th>상태</th>
          <th style="text-align:right;">결제금액</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!orderPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in orderPicker.rows" :key="r.orderId" style="cursor:pointer;" @click="onSelectOrder(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.orderId }}</td>
            <td>{{ r.memberNm || '-' }}</td>
            <td style="text-align:center;"><span class="badge badge-blue" style="font-size:10px;">{{ r.orderStatusCd }}</span></td>
            <td style="text-align:right;">{{ (r.totalPayAmt||0).toLocaleString() }}원</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

</div>`,
  };
})();

/* ZdSimulCouponMng — 프로모션 쿠폰 시뮬레이터 */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  /* 쿠폰 할인방식 (COUPON_DISC_TYPE: RATE/AMOUNT) */
  const DISC_TYPE_ITEMS = [
    { cd: 'RATE',   label: '정률 할인 (%)', color: '#3b82f6' },
    { cd: 'AMOUNT', label: '정액 할인 (원)', color: '#f59e0b' },
  ];

  /* 쿠폰 유형 (코드: COUPON_TYPE — coupon_type_cd) */
  const COUPON_TYPE_ITEMS = [
    { cd: 'PROD_DISCNT',  label: '상품할인쿠폰',         color: '#3b82f6' },
    { cd: 'ORDER_DISCNT', label: '주문할인쿠폰',         color: '#a855f7' },
    { cd: 'SHIP_DISCNT',  label: '배송비할인쿠폰',       color: '#22c55e' },
    { cd: 'SHIP_FREE',    label: '무료배송쿠폰',         color: '#06b6d4' },
    { cd: 'JOIN_GIFT',    label: '회원가입축하쿠폰',     color: '#f59e0b' },
    { cd: 'VIP',          label: 'VIP쿠폰',              color: '#f97316' },
    { cd: 'CLAIM_COMP',   label: '클레임관리자지급쿠폰', color: '#ef4444' },
  ];

  const COUPON_SCOPES = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  const COUPON_NAMES = [
    '첫구매 감사 쿠폰', '재방문 할인 쿠폰', '생일 특별 쿠폰', '주말 특가 쿠폰',
    '신상품 런칭 쿠폰', '회원등급 업그레이드 쿠폰', 'VIP 전용 혜택 쿠폰', '오늘만 특가 쿠폰',
    '멤버십 가입 기념 쿠폰', '한정 특가 쿠폰',
  ];

  window.ZdSimulCouponMng = {
    name: 'ZdSimulCouponMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ─────────────────────────────── */
      const domCfg = reactive({
        fixedCouponId:        '',
        /* 쿠폰 용도 타입 가중치 */
        fixedCouponType:      '__weighted__',
        couponTypeWeights:    { PROD_DISCNT: 35, ORDER_DISCNT: 22, SHIP_DISCNT: 13, SHIP_FREE: 10, JOIN_GIFT: 10, VIP: 7, CLAIM_COMP: 3 },
        /* 할인방식 가중치 */
        fixedCouponDiscType:  '__weighted__',
        couponDiscTypeWeights: { RATE: 70, AMOUNT: 30 },
        couponDiscRateMin:    5,
        couponDiscRateMax:    30,
        couponDiscAmtMin:     1000,
        couponDiscAmtMax:     30000,
        couponIssueCountMin:  10,
        couponIssueCountMax:  500,
        couponDurationDays:   30,
        couponScope:          'PRODUCT',
        couponProdIds:        '',
        couponMinOrderAmt:    0,
        couponMaxDiscAmt:     50000,
      });

      /* ── 가중치 픽 ───────────────────────────────────── */
      const _pickWeighted = (items, weights) => {
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of items) { r -= Number(weights[t.cd] || 0); if (r <= 0) return t; }
        return items[0];
      };
      const _pickCouponType = () => {
        const fixed = domCfg.fixedCouponType;
        if (fixed && fixed !== '__weighted__') return COUPON_TYPE_ITEMS.find(t => t.cd === fixed) || COUPON_TYPE_ITEMS[0];
        return _pickWeighted(COUPON_TYPE_ITEMS, domCfg.couponTypeWeights);
      };
      const _pickDiscType = () => {
        const fixed = domCfg.fixedCouponDiscType;
        if (fixed && fixed !== '__weighted__') return DISC_TYPE_ITEMS.find(t => t.cd === fixed) || DISC_TYPE_ITEMS[0];
        return _pickWeighted(DISC_TYPE_ITEMS, domCfg.couponDiscTypeWeights);
      };
      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };
      const _shortId = () => String(Date.now()).slice(-6);

      /* ── [02] 공통 엔진 ───────────────────────────────── */
      const simul = useSimulSetup({
        domain: '쿠폰',
        uiNm: '프로모션 쿠폰 시뮬레이터',
        label: '시뮬쿠폰',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const couponType = _pickCouponType();
            const discType   = _pickDiscType();
            const isRate     = discType.cd === 'RATE';
            const discVal    = isRate
              ? randInt(domCfg.couponDiscRateMin, domCfg.couponDiscRateMax)
              : randInt(domCfg.couponDiscAmtMin, domCfg.couponDiscAmtMax);
            const nm = (namePrefix || '') + pick(COUPON_NAMES);
            const prodIds = domCfg.couponScope === 'PRODUCT' && domCfg.couponProdIds
              ? domCfg.couponProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
              : [];
            const body = {
              couponNm: nm,
              couponCd: 'SIM_C_' + _shortId(),
              couponTypeCd: couponType.cd,
              couponDiscTypeCd: discType.cd,
              discVal,
              issueCount: randInt(domCfg.couponIssueCountMin, domCfg.couponIssueCountMax),
              startDate: _makeDate(0), endDate: _makeDate(domCfg.couponDurationDays),
              scopeCd: domCfg.couponScope,
              ...(prodIds.length ? { prodIds } : {}),
              minOrderAmt: domCfg.couponMinOrderAmt,
              maxDiscAmt: domCfg.couponMaxDiscAmt,
              simulYn: 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/promo/coupon-create', body, coUtil.cofApiHdr('쿠폰시뮬', '쿠폰생성'));
            const id  = res?.data?.data?.couponId || '-';
            const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
            return { ok: true, desc: '[' + couponType.label + '] ' + nm + ' ' + discStr, meta: { id, params: body } };
          } else {
            let couponId = domCfg.fixedCouponId;
            if (!couponId) {
              const list = (await boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 쿠폰 없음' };
              couponId = pick(list).couponId;
            }
            const body = { couponId, endDate: _makeDate(randInt(7, 30)) };
            await boApi.post('/bo/zd/simul/promo/coupon-update', body, coUtil.cofApiHdr('쿠폰시뮬', '쿠폰수정'));
            return { ok: true, desc: couponId + ' 기간 연장', meta: { id: couponId, params: body } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ──────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const couponCfgColumns = [
        makeRangeCol('couponDiscRateMin', 'couponDiscRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.fixedCouponDiscType !== 'AMOUNT' }),
        { key: 'couponDiscAmtMin', label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'AMOUNT' },
        { key: 'couponDiscAmtMax', label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'AMOUNT' },
        makeRangeCol('couponIssueCountMin', 'couponIssueCountMax', '발행수 범위', 1, 1000, '매'),
        { key: 'couponDurationDays', label: '유효기간',    type: 'number', hint: '일' },
        { key: 'couponScope',        label: '적용범위',    type: 'select', options: COUPON_SCOPES },
        { key: 'couponProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분', hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.couponScope === 'PRODUCT' },
        { key: 'couponMinOrderAmt',  label: '최소 주문액', type: 'number', hint: '원' },
        { key: 'couponMaxDiscAmt',   label: '최대 할인액', type: 'number', hint: '원' },
      ];

      const cfCouponTypeTotal = computed(() => Object.values(domCfg.couponTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDiscTotal       = computed(() => Object.values(domCfg.couponDiscTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'couponDiscRateMin',   maxKey: 'couponDiscRateMax'   },
        { minKey: 'couponIssueCountMin', maxKey: 'couponIssueCountMax' },
      ]);

      /* ── picker ──────────────────────────────────────── */
      const couponPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const _loadCouponPicker = async () => {
        couponPicker.loading = true;
        try {
          const res = await boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 20,
            ...(couponPicker.searchValue ? { searchValue: couponPicker.searchValue } : {}) });
          couponPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { couponPicker.rows = []; }
        couponPicker.loading = false;
      };
      const onOpenCouponPicker = async () => { couponPicker.show = true; couponPicker.searchValue = ''; await _loadCouponPicker(); };
      const onSelectCoupon = (row) => { domCfg.fixedCouponId = row.couponId; couponPicker.show = false; };

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, couponCfgColumns,
        cfCouponTypeTotal, cfDiscTotal,
        COUPON_TYPE_ITEMS, DISC_TYPE_ITEMS,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        ...rangeHandlers,
        couponPicker, onOpenCouponPicker, onSelectCoupon, _loadCouponPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🎟 프로모션 쿠폰 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#7c3aed,#c084fc)"
    accent-active="background:#faf5ff;border:1.5px solid #7c3aed;color:#6d28d9;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 쿠폰 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🎟 쿠폰 설정</div>
    <bo-form-area :columns="couponCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('couponDiscRateMin','couponDiscRateMax',0,100,'%')}
      ${rangeSlotTemplate('couponIssueCountMin','couponIssueCountMax',1,1000,'매')}
    </bo-form-area>
  </div>

  <!-- 가중치 패널 (쿠폰 타입 1/3 + 할인방식 1/3 + 빈칸 1/3) -->
  <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 쿠폰 유형 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🏷 쿠폰 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedCouponType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in COUPON_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedCouponType==='__weighted__'">
        <div v-for="t in COUPON_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:108px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.couponTypeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.couponTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.couponTypeWeights[t.cd]/cfCouponTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in COUPON_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.couponTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
        </div>
      </div>
    </div>
    <!-- 할인 방식 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">💡 할인 방식 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedCouponDiscType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedCouponDiscType==='__weighted__'">
        <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:80px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.couponDiscTypeWeights[t.cd]/cfDiscTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.couponDiscTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 수정 대상 지정 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🎯 수정 대상 쿠폰 지정</div>
    <div style="display:flex;gap:6px;align-items:center;max-width:400px;margin-top:10px;">
      <input type="text" :value="domCfg.fixedCouponId || ''" readonly placeholder="랜덤 선택"
        style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;font-family:monospace;"
        @click="onOpenCouponPicker" />
      <button v-if="domCfg.fixedCouponId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
        @click="domCfg.fixedCouponId=''">✕</button>
      <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenCouponPicker">선택</button>
    </div>
    <div v-if="!domCfg.fixedCouponId" style="font-size:10px;color:#94a3b8;margin-top:4px;">미지정 시 랜덤 쿠폰 선택</div>
  </div>

  <!-- 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- picker 모달 -->
  <bo-modal :show="couponPicker.show" title="쿠폰 선택" @close="couponPicker.show=false" box-width="600px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="couponPicker.searchValue" placeholder="쿠폰명 / 쿠폰ID 검색" @keyup.enter="_loadCouponPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadCouponPicker">조회</button>
      </div>
      <div v-if="couponPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th><th>쿠폰ID</th><th>쿠폰명</th><th>타입</th><th>할인</th><th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!couponPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in couponPicker.rows" :key="r.couponId" style="cursor:pointer;" @click="onSelectCoupon(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.couponId }}</td>
            <td>{{ r.couponNm }}</td>
            <td style="font-size:11px;color:#7c3aed;">{{ r.couponTypeCd || '-' }}</td>
            <td style="font-size:11px;color:#7c3aed;">{{ r.couponDiscTypeCd==='RATE' ? r.discVal+'%' : (r.discVal||0).toLocaleString()+'원' }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();

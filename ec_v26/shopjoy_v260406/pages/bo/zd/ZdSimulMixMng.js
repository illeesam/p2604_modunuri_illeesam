/* ZdSimulMixMng — 프로모션 혼합(쿠폰+할인) 시뮬레이터 */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  /* 쿠폰 할인방식 */
  const COUPON_DISC_ITEMS = [
    { cd: 'RATE',  label: '정률 할인 (%)' },
    { cd: 'FIXED', label: '정액 할인 (원)' },
  ];
  /* 쿠폰 용도 타입 */
  const COUPON_TYPE_ITEMS = [
    { cd: '상품할인쿠폰',         label: '상품할인쿠폰' },
    { cd: '주문할인쿠폰',         label: '주문할인쿠폰' },
    { cd: '배송비할인쿠폰',       label: '배송비할인쿠폰' },
    { cd: '무료배송쿠폰',         label: '무료배송쿠폰' },
    { cd: '회원가입축하쿠폰',     label: '회원가입축하쿠폰' },
    { cd: 'VIP쿠폰',              label: 'VIP쿠폰' },
    { cd: '클레임관리자지급쿠폰', label: '클레임관리자지급쿠폰' },
  ];
  /* 할인정책 타입 (DISCNT_TYPE) */
  const DISCNT_TYPE_ITEMS = [
    { cd: 'RATE',     label: '정률 할인' },
    { cd: 'FIXED',    label: '정액 할인' },
    { cd: 'FREE_SHIP', label: '무료배송' },
  ];
  /* 할인 값 방식 */
  const DISCNT_VAL_ITEMS = [
    { cd: 'RATE',   label: '% 할인' },
    { cd: 'AMOUNT', label: '원 할인' },
  ];

  const SCOPES = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  const COUPON_NAMES = [
    '첫구매 감사 쿠폰', '재방문 할인 쿠폰', '생일 특별 쿠폰', '주말 특가 쿠폰',
    '신상품 런칭 쿠폰', 'VIP 전용 혜택 쿠폰', '오늘만 특가 쿠폰', '한정 특가 쿠폰',
  ];
  const DISCNT_NAMES = [
    '봄 시즌 할인', '여름 세일', '추석 특별 할인', '겨울 페스타',
    '주말 특가 이벤트', '신규 고객 할인', '플래시 세일',
  ];

  window.ZdSimulMixMng = {
    name: 'ZdSimulMixMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ─────────────────────────────── */
      const domCfg = reactive({
        /* 쿠폰 — 타입 */
        fixedCouponType:       '__weighted__',
        couponTypeWeights:     { '상품할인쿠폰': 35, '주문할인쿠폰': 22, '배송비할인쿠폰': 13, '무료배송쿠폰': 10, '회원가입축하쿠폰': 10, 'VIP쿠폰': 7, '클레임관리자지급쿠폰': 3 },
        /* 쿠폰 — 할인방식 */
        fixedCouponDiscType:   '__weighted__',
        couponDiscTypeWeights: { RATE: 70, FIXED: 30 },
        couponDiscRateMin:     5, couponDiscRateMax: 30,
        couponDiscAmtMin:      1000, couponDiscAmtMax: 30000,
        couponIssueCountMin:   10, couponIssueCountMax: 500,
        couponDurationDays:    30,
        couponScope:           'PRODUCT',
        couponProdIds:         '',
        couponMinOrderAmt:     0,
        couponMaxDiscAmt:      50000,
        /* 할인 — 정책 타입 */
        fixedDiscntTypeCd:     '__weighted__',
        discntTypeCdWeights:   { RATE: 50, FIXED: 35, FREE_SHIP: 15 },
        /* 할인 — 값 방식 */
        fixedDiscntValType:    '__weighted__',
        discntValTypeWeights:  { RATE: 60, AMOUNT: 40 },
        discntRateMin:         3, discntRateMax: 20,
        discntAmtMin:          500, discntAmtMax: 10000,
        discntDurationDays:    14,
        discntScope:           'PRODUCT',
        discntProdIds:         '',
        discntMinOrderAmt:     0,
        discntMaxDiscAmt:      50000,
      });

      /* ── 가중치 픽 ───────────────────────────────────── */
      const _pickWeighted = (items, weights) => {
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of items) { r -= Number(weights[t.cd] || 0); if (r <= 0) return t; }
        return items[0];
      };
      const _pickCouponType    = () => {
        const f = domCfg.fixedCouponType;
        if (f && f !== '__weighted__') return COUPON_TYPE_ITEMS.find(t => t.cd === f) || COUPON_TYPE_ITEMS[0];
        return _pickWeighted(COUPON_TYPE_ITEMS, domCfg.couponTypeWeights);
      };
      const _pickCouponDisc    = () => {
        const f = domCfg.fixedCouponDiscType;
        if (f && f !== '__weighted__') return COUPON_DISC_ITEMS.find(t => t.cd === f) || COUPON_DISC_ITEMS[0];
        return _pickWeighted(COUPON_DISC_ITEMS, domCfg.couponDiscTypeWeights);
      };
      const _pickDiscntTypeCd  = () => {
        const f = domCfg.fixedDiscntTypeCd;
        if (f && f !== '__weighted__') return DISCNT_TYPE_ITEMS.find(t => t.cd === f) || DISCNT_TYPE_ITEMS[0];
        return _pickWeighted(DISCNT_TYPE_ITEMS, domCfg.discntTypeCdWeights);
      };
      const _pickDiscntValType = () => {
        const f = domCfg.fixedDiscntValType;
        if (f && f !== '__weighted__') return DISCNT_VAL_ITEMS.find(t => t.cd === f) || DISCNT_VAL_ITEMS[0];
        return _pickWeighted(DISCNT_VAL_ITEMS, domCfg.discntValTypeWeights);
      };
      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };
      const _shortId = () => String(Date.now()).slice(-6);

      /* ── [02] 공통 엔진 ───────────────────────────────── */
      const simul = useSimulSetup({
        domain: '혼합프로모',
        uiNm: '프로모션 혼합 시뮬레이터',
        label: '시뮬혼합',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 2, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const isCoupon = Math.random() < 0.5;
            const now = _makeDate(0);

            if (isCoupon) {
              const couponType = _pickCouponType();
              const discType   = _pickCouponDisc();
              const isRate     = discType.cd === 'RATE';
              const discVal    = isRate
                ? randInt(domCfg.couponDiscRateMin, domCfg.couponDiscRateMax)
                : randInt(domCfg.couponDiscAmtMin, domCfg.couponDiscAmtMax);
              const nm = (namePrefix || '') + pick(COUPON_NAMES);
              const prodIds = domCfg.couponScope === 'PRODUCT' && domCfg.couponProdIds
                ? domCfg.couponProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];
              const body = {
                couponNm: nm, couponCd: 'SIM_C_' + _shortId(),
                couponTypeCd: couponType.cd,
                couponDiscTypeCd: discType.cd, discVal,
                issueCount: randInt(domCfg.couponIssueCountMin, domCfg.couponIssueCountMax),
                startDate: now, endDate: _makeDate(domCfg.couponDurationDays),
                scopeCd: domCfg.couponScope,
                ...(prodIds.length ? { prodIds } : {}),
                minOrderAmt: domCfg.couponMinOrderAmt,
                maxDiscAmt: domCfg.couponMaxDiscAmt,
                simulYn: 'Y',
              };
              const res = await boApi.post('/bo/zd/simul/promo/coupon-create', body, coUtil.cofApiHdr('혼합시뮬', '쿠폰생성'));
              const id  = res?.data?.data?.couponId || '-';
              const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
              return { ok: true, desc: '[쿠폰|' + couponType.label + '] ' + nm + ' ' + discStr, meta: { id, type: '쿠폰', params: body } };
            } else {
              const discntTypeCd = _pickDiscntTypeCd();
              const valType      = _pickDiscntValType();
              const isRate       = valType.cd === 'RATE';
              const discVal      = isRate
                ? randInt(domCfg.discntRateMin, domCfg.discntRateMax)
                : randInt(domCfg.discntAmtMin, domCfg.discntAmtMax);
              const nm = (namePrefix || '') + pick(DISCNT_NAMES);
              const prodIds = domCfg.discntScope === 'PRODUCT' && domCfg.discntProdIds
                ? domCfg.discntProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];
              const body = {
                discntNm: nm,
                discntTypeCd: discntTypeCd.cd,
                discntValTypeCd: valType.cd,
                discVal,
                startDate: now, endDate: _makeDate(domCfg.discntDurationDays),
                scopeCd: domCfg.discntScope,
                ...(prodIds.length ? { prodIds } : {}),
                minOrderAmt: domCfg.discntMinOrderAmt,
                maxDiscAmt: domCfg.discntMaxDiscAmt,
                simulYn: 'Y',
              };
              const res = await boApi.post('/bo/zd/simul/promo/discnt-create', body, coUtil.cofApiHdr('혼합시뮬', '할인생성'));
              const id  = res?.data?.data?.discntId || '-';
              const discStr = discntTypeCd.cd === 'FREE_SHIP' ? '무료배송' : (isRate ? discVal + '%' : discVal.toLocaleString() + '원');
              return { ok: true, desc: '[할인|' + discntTypeCd.label + '] ' + nm + ' ' + discStr, meta: { id, type: '할인', params: body } };
            }
          } else {
            return { ok: false, reason: '혼합시뮬 수정은 미지원 (생성 모드 사용)' };
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
          { visible: (f) => f.fixedCouponDiscType !== 'FIXED' }),
        { key: 'couponDiscAmtMin', label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'FIXED' },
        { key: 'couponDiscAmtMax', label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'FIXED' },
        makeRangeCol('couponIssueCountMin', 'couponIssueCountMax', '발행수 범위', 1, 1000, '매'),
        { key: 'couponDurationDays', label: '유효기간', type: 'number', hint: '일' },
        { key: 'couponScope',        label: '적용범위', type: 'select', options: SCOPES },
        { key: 'couponProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분', visible: (f) => f.couponScope === 'PRODUCT' },
        { key: 'couponMinOrderAmt',  label: '최소 주문액', type: 'number', hint: '원' },
        { key: 'couponMaxDiscAmt',   label: '최대 할인액', type: 'number', hint: '원' },
      ];
      const discntCfgColumns = [
        makeRangeCol('discntRateMin', 'discntRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.fixedDiscntValType !== 'AMOUNT' }),
        { key: 'discntAmtMin', label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedDiscntValType === 'AMOUNT' },
        { key: 'discntAmtMax', label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedDiscntValType === 'AMOUNT' },
        { key: 'discntDurationDays', label: '기간',     type: 'number', hint: '일' },
        { key: 'discntMinOrderAmt',  label: '최소주문', type: 'number', hint: '원' },
        { key: 'discntMaxDiscAmt',   label: '최대할인', type: 'number', hint: '원' },
        { key: 'discntScope',        label: '적용범위', type: 'select', options: SCOPES },
        { key: 'discntProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분', visible: (f) => f.discntScope === 'PRODUCT' },
      ];

      const cfCouponTypeTotal   = computed(() => Object.values(domCfg.couponTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfCouponDiscTotal   = computed(() => Object.values(domCfg.couponDiscTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDiscntTypeCdTotal = computed(() => Object.values(domCfg.discntTypeCdWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDiscntValTotal    = computed(() => Object.values(domCfg.discntValTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'couponDiscRateMin',   maxKey: 'couponDiscRateMax'   },
        { minKey: 'couponIssueCountMin', maxKey: 'couponIssueCountMax' },
        { minKey: 'discntRateMin',       maxKey: 'discntRateMax'       },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, couponCfgColumns, discntCfgColumns,
        cfCouponTypeTotal, cfCouponDiscTotal, cfDiscntTypeCdTotal, cfDiscntValTotal,
        COUPON_TYPE_ITEMS, COUPON_DISC_ITEMS, DISCNT_TYPE_ITEMS, DISCNT_VAL_ITEMS,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        ...rangeHandlers,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🎁 프로모션 혼합 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#ea580c,#fb923c)"
    accent-active="background:#fff7ed;border:1.5px solid #ea580c;color:#c2410c;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <div style="margin-top:10px;padding:8px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:11px;color:#92400e;">
    💡 실행 1회마다 <b>쿠폰 또는 할인정책</b>을 50% 확률로 선택 생성합니다. 두 설정을 동시 적용하여 혼합 데이터를 만들 수 있습니다.
  </div>

  <!-- 쿠폰 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🎟 쿠폰 설정 (50% 확률)</div>
    <bo-form-area :columns="couponCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('couponDiscRateMin','couponDiscRateMax',0,100,'%')}
      ${rangeSlotTemplate('couponIssueCountMin','couponIssueCountMax',1,1000,'매')}
    </bo-form-area>

    <!-- 쿠폰 용도 타입 가중치 -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">🏷 쿠폰 용도 타입 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedCouponType" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in COUPON_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedCouponType==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in COUPON_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:104px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.couponTypeWeights[t.cd]" style="flex:1;accent-color:#ea580c;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.couponTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.couponTypeWeights[t.cd]/cfCouponTypeTotal*100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 쿠폰 할인방식 가중치 -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">💡 쿠폰 할인방식 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedCouponDiscType" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in COUPON_DISC_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedCouponDiscType==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in COUPON_DISC_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:80px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" style="flex:1;accent-color:#ea580c;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.couponDiscTypeWeights[t.cd]/cfCouponDiscTotal*100) }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 할인정책 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">💰 할인정책 설정 (50% 확률)</div>
    <bo-form-area :columns="discntCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('discntRateMin','discntRateMax',0,100,'%')}
    </bo-form-area>

    <!-- 할인 정책 타입 가중치 -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">🏷 할인 정책 타입 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedDiscntTypeCd" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in DISCNT_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedDiscntTypeCd==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in DISCNT_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:64px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.discntTypeCdWeights[t.cd]" style="flex:1;accent-color:#ea580c;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.discntTypeCdWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.discntTypeCdWeights[t.cd]/cfDiscntTypeCdTotal*100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 할인 값 방식 가중치 -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">💡 할인 값 방식 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedDiscntValType" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in DISCNT_VAL_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedDiscntValType==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in DISCNT_VAL_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:52px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.discntValTypeWeights[t.cd]" style="flex:1;accent-color:#ea580c;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.discntValTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.discntValTypeWeights[t.cd]/cfDiscntValTotal*100) }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />
</div>`,
  };
})();

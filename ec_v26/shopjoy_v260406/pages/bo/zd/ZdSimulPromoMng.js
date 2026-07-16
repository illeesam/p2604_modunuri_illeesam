/* ZdSimulPromoMng — 프로모션 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, ref, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const PROMO_TYPES = [
    { value: 'coupon', label: '쿠폰',          badge: 'badge-purple' },
    { value: 'discnt', label: '할인정책',       badge: 'badge-blue'   },
    { value: 'save',   label: '적립금정책',     badge: 'badge-green'  },
    { value: 'both',   label: '쿠폰+할인 혼합', badge: 'badge-orange' },
  ];
  const DISC_TYPES  = [{ value: 'RATE', label: '% 할인' }, { value: 'AMOUNT', label: '정액 할인' }];
  const COUPON_SCOPES = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  /* 쿠폰/할인 할인방식 가중치 항목 (RATE/AMOUNT) */
  const DISC_TYPE_ITEMS  = [{ cd: 'RATE', label: '% 할인', color: '#3b82f6' }, { cd: 'AMOUNT', label: '정액 할인', color: '#f59e0b' }];
  /* 적립 방식 가중치 항목 (RATE/AMOUNT) */
  const SAVE_VAL_ITEMS   = [{ cd: 'RATE', label: '적립률 %', color: '#22c55e' }, { cd: 'AMOUNT', label: '정액 적립', color: '#f97316' }];
  const COUPON_NAMES = [
    '첫구매 감사 쿠폰', '재방문 할인 쿠폰', '생일 특별 쿠폰', '주말 특가 쿠폰',
    '신상품 런칭 쿠폰', '회원등급 업그레이드 쿠폰', 'VIP 전용 혜택 쿠폰', '오늘만 특가 쿠폰',
    '멤버십 가입 기념 쿠폰', '한정 특가 쿠폰',
  ];
  const DISCNT_NAMES = [
    '봄 시즌 할인', '여름 세일', '추석 특별 할인', '겨울 페스타',
    '주말 특가 이벤트', '신규 고객 할인', '대량 구매 할인', '플래시 세일',
  ];
  const SAVE_NAMES = [
    '기본 구매 적립', 'VIP 추가 적립', '리뷰 작성 적립', '생일 보너스 적립',
    '신규 가입 적립', '이벤트 참여 적립',
  ];

  window.ZdSimulPromoMng = {
    name: 'ZdSimulPromoMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        promoType: 'coupon',
        /* 수정 시 고정 대상 */
        fixedCouponId: '',
        fixedDiscntId: '',
        /* 쿠폰 설정 */
        fixedCouponDiscType: '__weighted__',
        couponDiscTypeWeights: { RATE: 70, AMOUNT: 30 },
        couponDiscRateMin: 5,
        couponDiscRateMax: 30,
        couponDiscAmtMin: 1000,
        couponDiscAmtMax: 30000,
        couponIssueCountMin: 10,
        couponIssueCountMax: 500,
        couponDurationDays: 30,
        couponScope: 'PRODUCT',
        couponProdIds: '',
        couponMinOrderAmt: 0,
        couponMaxDiscAmt: 50000,
        /* 할인정책 설정 */
        fixedDiscntType: '__weighted__',
        discntTypeWeights: { RATE: 60, AMOUNT: 40 },
        discntRateMin: 3,
        discntRateMax: 20,
        discntAmtMin: 500,
        discntAmtMax: 10000,
        discntDurationDays: 14,
        discntMinOrderAmt: 0,
        discntMaxDiscAmt: 50000,
        discntScope: 'PRODUCT',
        discntProdIds: '',
        /* 적립금 설정 */
        fixedSaveType: '__weighted__',
        saveTypeWeights: { RATE: 65, AMOUNT: 35 },
        saveRateMin: 1,
        saveRateMax: 10,
        saveAmtMin: 100,
        saveAmtMax: 5000,
        saveDurationDays: 365,
        saveScope: 'PRODUCT',
        saveProdIds: '',
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickWeighted = (items, weights, fixedKey) => {
        const fixed = domCfg[fixedKey];
        if (fixed && fixed !== '__weighted__') return items.find(t => t.cd === fixed) || items[0];
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of items) { r -= Number(weights[t.cd] || 0); if (r <= 0) return t; }
        return items[0];
      };
      const _pickCouponDiscType = () => _pickWeighted(DISC_TYPE_ITEMS,  domCfg.couponDiscTypeWeights, 'fixedCouponDiscType');
      const _pickDiscntType     = () => _pickWeighted(DISC_TYPE_ITEMS,  domCfg.discntTypeWeights,     'fixedDiscntType');
      const _pickSaveType       = () => _pickWeighted(SAVE_VAL_ITEMS,   domCfg.saveTypeWeights,       'fixedSaveType');

      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };
      const _shortId = () => String(Date.now()).slice(-6);

      const simul = useSimulSetup({
        domain: '프로모션',
        uiNm: '프로모션 시뮬레이터',
        label: '시뮬프로모',
        showToast: props.showToast,
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, simulYn, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            let type = domCfg.promoType;
            if (type === 'both') type = Math.random() < 0.5 ? 'coupon' : 'discnt';
            const now = _makeDate(0);

            if (type === 'coupon') {
              const discType = _pickCouponDiscType();
              const isRate   = discType.cd === 'RATE';
              const discVal  = isRate
                ? randInt(domCfg.couponDiscRateMin, domCfg.couponDiscRateMax)
                : randInt(domCfg.couponDiscAmtMin, domCfg.couponDiscAmtMax);
              const nm  = (namePrefix || '') + pick(COUPON_NAMES);
              /* 적용범위 PRODUCT 시 시뮬 상품 ID 목록 파싱 */
              const prodIds = domCfg.couponScope === 'PRODUCT' && domCfg.couponProdIds
                ? domCfg.couponProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
                : [];
              const body = {
                couponNm: nm, couponCd: 'SIM_C_' + _shortId(),
                couponDiscTypeCd: discType.cd, discVal,
                issueCount: randInt(domCfg.couponIssueCountMin, domCfg.couponIssueCountMax),
                startDate: now, endDate: _makeDate(domCfg.couponDurationDays),
                scopeCd: domCfg.couponScope,
                prodIds,
                minOrderAmt: domCfg.couponMinOrderAmt,
                maxDiscAmt: domCfg.couponMaxDiscAmt,
                simulYn: simulYn || 'Y',
              };
              const res = await boApi.post('/bo/zd/simul/promo/coupon-create', body, coUtil.cofApiHdr('프로모시뮬', '쿠폰생성'));
              const id  = res?.data?.data?.couponId || '-';
              const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
              return { ok: true, desc: '[쿠폰] ' + nm + ' ' + discStr + ' 할인 [' + discType.label + ']', meta: { id, type: '쿠폰', params: body } };
            } else if (type === 'discnt') {
              const discType = _pickDiscntType();
              const isRate   = discType.cd === 'RATE';
              const discVal  = isRate
                ? randInt(domCfg.discntRateMin, domCfg.discntRateMax)
                : randInt(domCfg.discntAmtMin, domCfg.discntAmtMax);
              const nm   = (namePrefix || '') + pick(DISCNT_NAMES);
              const discntProdIds = domCfg.discntScope === 'PRODUCT' && domCfg.discntProdIds
                ? domCfg.discntProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
                : [];
              const body = {
                discntNm: nm, discntValTypeCd: discType.cd, discVal,
                startDate: now, endDate: _makeDate(domCfg.discntDurationDays),
                scopeCd: domCfg.discntScope,
                prodIds: discntProdIds,
                minOrderAmt: domCfg.discntMinOrderAmt,
                maxDiscAmt: domCfg.discntMaxDiscAmt,
                simulYn: simulYn || 'Y',
              };
              const res = await boApi.post('/bo/zd/simul/promo/discnt-create', body, coUtil.cofApiHdr('프로모시뮬', '할인생성'));
              const id  = res?.data?.data?.discntId || '-';
              const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
              return { ok: true, desc: '[할인] ' + nm + ' ' + discStr + ' [' + discType.label + ']', meta: { id, type: '할인', params: body } };
            } else {
              const saveType = _pickSaveType();
              const isRate   = saveType.cd === 'RATE';
              const saveRate = isRate ? randInt(domCfg.saveRateMin, domCfg.saveRateMax) : 0;
              const saveAmt  = isRate ? 0 : randInt(domCfg.saveAmtMin, domCfg.saveAmtMax);
              const nm   = (namePrefix || '') + pick(SAVE_NAMES);
              const saveProdIds = domCfg.saveScope === 'PRODUCT' && domCfg.saveProdIds
                ? domCfg.saveProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
                : [];
              const body = {
                saveNm: nm,
                saveRatePct: isRate ? saveRate : null,
                saveAmt: isRate ? null : saveAmt,
                startDate: now, endDate: _makeDate(domCfg.saveDurationDays),
                scopeCd: domCfg.saveScope,
                prodIds: saveProdIds,
                simulYn: simulYn || 'Y',
              };
              const res = await boApi.post('/bo/zd/simul/promo/save-create', body, coUtil.cofApiHdr('프로모시뮬', '적립생성'));
              const id  = res?.data?.data?.saveId || '-';
              const saveStr = isRate ? saveRate + '% 적립률' : saveAmt.toLocaleString() + '원 정액';
              return { ok: true, desc: '[적립] ' + nm + ' ' + saveStr + ' [' + saveType.label + ']', meta: { id, type: '적립', params: body } };
            }
          } else {
            const type = domCfg.promoType === 'both' ? 'coupon' : domCfg.promoType;
            const body = { endDate: _makeDate(randInt(7, 30)) };
            if (type === 'coupon') {
              let couponId = domCfg.fixedCouponId;
              if (!couponId) {
                const list = (await boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
                if (!list.length) return { ok: false, reason: '수정할 쿠폰 없음' };
                couponId = pick(list).couponId;
              }
              const couponBody = { couponId, ...body };
              await boApi.post('/bo/zd/simul/promo/coupon-update', couponBody, coUtil.cofApiHdr('프로모시뮬', '쿠폰수정'));
              return { ok: true, desc: '[쿠폰] ' + couponId + ' 기간 연장', meta: { id: couponId, params: couponBody } };
            } else {
              let discntId = domCfg.fixedDiscntId;
              if (!discntId) {
                const list = (await boApiSvc.pmDiscnt.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
                if (!list.length) return { ok: false, reason: '수정할 할인정책 없음' };
                discntId = pick(list).discntId;
              }
              const discntBody = { discntId, ...body };
              await boApi.post('/bo/zd/simul/promo/discnt-update', discntBody, coUtil.cofApiHdr('프로모시뮬', '할인수정'));
              return { ok: true, desc: '[할인] ' + discntId + ' 기간 연장', meta: { id: discntId, params: discntBody } };
            }
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── picker 모달 ─────────────────────────────── */
      const couponPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const discntPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const _loadCouponPicker = async () => {
        couponPicker.loading = true;
        try {
          const res = await boApiSvc.pmCoupon.getPage({
            pageNo: 1, pageSize: 20,
            ...(couponPicker.searchValue ? { searchValue: couponPicker.searchValue, searchType: 'couponId,couponNm' } : {}),
          });
          couponPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { couponPicker.rows = []; }
        couponPicker.loading = false;
      };
      const _loadDiscntPicker = async () => {
        discntPicker.loading = true;
        try {
          const res = await boApiSvc.pmDiscnt.getPage({
            pageNo: 1, pageSize: 20,
            ...(discntPicker.searchValue ? { searchValue: discntPicker.searchValue, searchType: 'discntId,discntNm' } : {}),
          });
          discntPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { discntPicker.rows = []; }
        discntPicker.loading = false;
      };
      const onOpenCouponPicker = async () => {
        couponPicker.show = true;
        couponPicker.searchValue = '';
        await _loadCouponPicker();
      };
      const onOpenDiscntPicker = async () => {
        discntPicker.show = true;
        discntPicker.searchValue = '';
        await _loadDiscntPicker();
      };
      const onSelectCoupon = (row) => { domCfg.fixedCouponId = row.couponId; couponPicker.show = false; };
      const onSelectDiscnt = (row) => { domCfg.fixedDiscntId = row.discntId; discntPicker.show = false; };

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const couponCfgColumns = [
        makeRangeCol('couponDiscRateMin', 'couponDiscRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.fixedCouponDiscType !== 'AMOUNT' }),
        { key: 'couponDiscAmtMin',   label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'AMOUNT' },
        { key: 'couponDiscAmtMax',   label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedCouponDiscType === 'AMOUNT' },
        makeRangeCol('couponIssueCountMin', 'couponIssueCountMax', '발행수 범위', 1, 1000, '매'),
        { key: 'couponDurationDays', label: '유효기간',    type: 'number', hint: '일' },
        { key: 'couponScope',        label: '적용범위',    type: 'select', options: COUPON_SCOPES },
        { key: 'couponProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분 (기본 5개 자동)',
          hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.couponScope === 'PRODUCT' },
        { key: 'couponMinOrderAmt',  label: '최소 주문액', type: 'number', hint: '원' },
        { key: 'couponMaxDiscAmt',   label: '최대 할인액', type: 'number', hint: '원' },
      ];
      const discntCfgColumns = [
        makeRangeCol('discntRateMin', 'discntRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.fixedDiscntType !== 'AMOUNT' }),
        { key: 'discntAmtMin',   label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedDiscntType === 'AMOUNT' },
        { key: 'discntAmtMax',   label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedDiscntType === 'AMOUNT' },
        { key: 'discntDurationDays', label: '기간',    type: 'number', hint: '일' },
        { key: 'discntMinOrderAmt',  label: '최소주문', type: 'number', hint: '원' },
        { key: 'discntMaxDiscAmt',   label: '최대할인', type: 'number', hint: '원' },
        { key: 'discntScope',        label: '적용범위', type: 'select', options: COUPON_SCOPES },
        { key: 'discntProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분 (기본 5개 자동)',
          hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.discntScope === 'PRODUCT' },
      ];
      const saveCfgColumns = [
        makeRangeCol('saveRateMin', 'saveRateMax', '적립률 범위', 0, 50, '%',
          { visible: (f) => f.fixedSaveType !== 'AMOUNT' }),
        { key: 'saveAmtMin',       label: '정액 적립 최소', type: 'number', hint: '원', visible: (f) => f.fixedSaveType === 'AMOUNT' },
        { key: 'saveAmtMax',       label: '정액 적립 최대', type: 'number', hint: '원', visible: (f) => f.fixedSaveType === 'AMOUNT' },
        { key: 'saveDurationDays', label: '유효기간',       type: 'number', hint: '일' },
        { key: 'saveScope',        label: '적용범위', type: 'select', options: COUPON_SCOPES },
        { key: 'saveProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분 (기본 5개 자동)',
          hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.saveScope === 'PRODUCT' },
      ];

      const cfCouponDiscTotal = computed(() => Object.values(domCfg.couponDiscTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDiscntTotal     = computed(() => Object.values(domCfg.discntTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfSaveTotal       = computed(() => Object.values(domCfg.saveTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'couponDiscRateMin',  maxKey: 'couponDiscRateMax'  },
        { minKey: 'couponIssueCountMin', maxKey: 'couponIssueCountMax' },
        { minKey: 'discntRateMin',      maxKey: 'discntRateMax'      },
        { minKey: 'saveRateMin',        maxKey: 'saveRateMax'        },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, couponCfgColumns, discntCfgColumns, saveCfgColumns,
        cfCouponDiscTotal, cfDiscntTotal, cfSaveTotal,
        DISC_TYPE_ITEMS, SAVE_VAL_ITEMS,
        onStart, onStop, onRunOnce, onPreview, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        PROMO_TYPES,
        /* picker */
        couponPicker, discntPicker,
        onOpenCouponPicker, onOpenDiscntPicker,
        onSelectCoupon, onSelectDiscnt,
        _loadCouponPicker, _loadDiscntPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🎁 프로모션 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#9333ea,#c084fc)"
    accent-active="background:#faf5ff;border:1.5px solid #9333ea;color:#7e22ce;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" />

  <!-- 프로모션 유형 탭 (별도 카드) -->
  <div class="card" style="margin-top:12px;">
    <div class="tab-bar-row" style="padding:0 4px;">
      <div class="tab-nav">
        <button v-for="t in PROMO_TYPES" :key="t.value"
          :class="'tab-btn' + (domCfg.promoType===t.value ? ' active' : '')"
          @click="domCfg.promoType=t.value">{{ t.label }}</button>
      </div>
    </div>

    <!-- 쿠폰 설정 -->
    <div v-if="domCfg.promoType==='coupon' || domCfg.promoType==='both'" style="padding:14px 16px;">
      <div class="list-title">🎟 쿠폰 설정</div>
      <bo-form-area :columns="couponCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
        ${rangeSlotTemplate('couponDiscRateMin','couponDiscRateMax',0,100,'%')}
        ${rangeSlotTemplate('couponIssueCountMin','couponIssueCountMax',1,1000,'매')}
      </bo-form-area>
    </div>

    <!-- 할인정책 설정 -->
    <div v-if="domCfg.promoType==='discnt' || domCfg.promoType==='both'" style="padding:14px 16px;">
      <div class="list-title">💰 할인정책 설정</div>
      <bo-form-area :columns="discntCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
        ${rangeSlotTemplate('discntRateMin','discntRateMax',0,100,'%')}
      </bo-form-area>
    </div>

    <!-- 적립금 설정 -->
    <div v-if="domCfg.promoType==='save'" style="padding:14px 16px;">
      <div class="list-title">💎 적립금 설정</div>
      <bo-form-area :columns="saveCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
        ${rangeSlotTemplate('saveRateMin','saveRateMax',0,50,'%')}
      </bo-form-area>
    </div>
  </div>

  <!-- 가중치 카드 행 -->
  <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;">
    <!-- 쿠폰 할인 방식 가중치 -->
    <div v-if="domCfg.promoType==='coupon' || domCfg.promoType==='both'" class="card" style="padding:14px 16px;width:340px;">
      <div class="list-title">🎟 쿠폰 할인 방식 가중치</div>
      <div style="margin-top:8px;">
        <select v-model="domCfg.fixedCouponDiscType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;margin-bottom:6px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
        <div v-show="domCfg.fixedCouponDiscType === '__weighted__'">
          <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" style="display:grid;grid-template-columns:10px 55px 1fr 40px 36px;align-items:center;gap:6px;margin-bottom:2px;">
            <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';display:inline-block;'"></span>
            <span style="font-size:11px;font-weight:600;color:#475569;">{{ t.label }}</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" :style="'accent-color:'+t.color+';width:100%;'" />
            <input type="number" min="0" max="100" v-model.number="domCfg.couponDiscTypeWeights[t.cd]" style="width:40px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:1px 4px;text-align:center;" />
            <span style="font-size:10px;color:#94a3b8;text-align:right;">{{ Math.round(domCfg.couponDiscTypeWeights[t.cd]/cfCouponDiscTotal*100) }}%</span>
          </div>
          <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
            <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.couponDiscTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- 할인 방식 가중치 -->
    <div v-if="domCfg.promoType==='discnt' || domCfg.promoType==='both'" class="card" style="padding:14px 16px;width:340px;">
      <div class="list-title">💰 할인 방식 가중치</div>
      <div style="margin-top:8px;">
        <select v-model="domCfg.fixedDiscntType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;margin-bottom:6px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
        <div v-show="domCfg.fixedDiscntType === '__weighted__'">
          <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" style="display:grid;grid-template-columns:10px 55px 1fr 40px 36px;align-items:center;gap:6px;margin-bottom:2px;">
            <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';display:inline-block;'"></span>
            <span style="font-size:11px;font-weight:600;color:#475569;">{{ t.label }}</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.discntTypeWeights[t.cd]" :style="'accent-color:'+t.color+';width:100%;'" />
            <input type="number" min="0" max="100" v-model.number="domCfg.discntTypeWeights[t.cd]" style="width:40px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:1px 4px;text-align:center;" />
            <span style="font-size:10px;color:#94a3b8;text-align:right;">{{ Math.round(domCfg.discntTypeWeights[t.cd]/cfDiscntTotal*100) }}%</span>
          </div>
          <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
            <div v-for="t in DISC_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.discntTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- 적립 방식 가중치 -->
    <div v-if="domCfg.promoType==='save'" class="card" style="padding:14px 16px;width:340px;">
      <div class="list-title">🪙 적립 방식 가중치</div>
      <div style="margin-top:8px;">
        <select v-model="domCfg.fixedSaveType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;margin-bottom:6px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in SAVE_VAL_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
        <div v-show="domCfg.fixedSaveType === '__weighted__'">
          <div v-for="t in SAVE_VAL_ITEMS" :key="t.cd" style="display:grid;grid-template-columns:10px 60px 1fr 40px 36px;align-items:center;gap:6px;margin-bottom:2px;">
            <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';display:inline-block;'"></span>
            <span style="font-size:11px;font-weight:600;color:#475569;">{{ t.label }}</span>
            <input type="range" min="0" max="100" v-model.number="domCfg.saveTypeWeights[t.cd]" :style="'accent-color:'+t.color+';width:100%;'" />
            <input type="number" min="0" max="100" v-model.number="domCfg.saveTypeWeights[t.cd]" style="width:40px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:1px 4px;text-align:center;" />
            <span style="font-size:10px;color:#94a3b8;text-align:right;">{{ Math.round(domCfg.saveTypeWeights[t.cd]/cfSaveTotal*100) }}%</span>
          </div>
          <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
            <div v-for="t in SAVE_VAL_ITEMS" :key="t.cd" :style="'flex:'+domCfg.saveTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 수정 모드 대상 지정 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:12px 16px;margin-top:12px;">
    <div class="list-title">🎯 수정 대상 지정</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
      <!-- 쿠폰 지정 -->
      <div v-if="domCfg.promoType==='coupon' || domCfg.promoType==='both'">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">🎟 수정할 쿠폰 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedCouponId || ''" readonly
            placeholder="랜덤 선택"
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;font-family:monospace;"
            @click="onOpenCouponPicker" />
          <button v-if="domCfg.fixedCouponId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedCouponId=''">✕</button>
          <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenCouponPicker">선택</button>
        </div>
        <div v-if="!domCfg.fixedCouponId" style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 랜덤 쿠폰 선택</div>
      </div>
      <!-- 할인정책 지정 -->
      <div v-if="domCfg.promoType==='discnt' || domCfg.promoType==='both'">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:5px;">💰 수정할 할인정책 지정</div>
        <div style="display:flex;gap:5px;align-items:center;">
          <input type="text" :value="domCfg.fixedDiscntId || ''" readonly
            placeholder="랜덤 선택"
            style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;font-family:monospace;"
            @click="onOpenDiscntPicker" />
          <button v-if="domCfg.fixedDiscntId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
            @click="domCfg.fixedDiscntId=''">✕</button>
          <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenDiscntPicker">선택</button>
        </div>
        <div v-if="!domCfg.fixedDiscntId" style="font-size:10px;color:#94a3b8;margin-top:3px;">미지정 시 랜덤 할인정책 선택</div>
      </div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 쿠폰 picker 모달 -->
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
          <th style="width:36px;">번호</th>
          <th>쿠폰ID</th>
          <th>쿠폰명</th>
          <th>할인</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!couponPicker.rows.length"><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in couponPicker.rows" :key="r.couponId" style="cursor:pointer;" @click="onSelectCoupon(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.couponId }}</td>
            <td>{{ r.couponNm }}</td>
            <td style="font-size:11px;color:#6366f1;">{{ r.couponDiscTypeCd==='RATE' ? r.discVal+'%' : (r.discVal||0).toLocaleString()+'원' }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

  <!-- 할인정책 picker 모달 -->
  <bo-modal :show="discntPicker.show" title="할인정책 선택" @close="discntPicker.show=false" box-width="600px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="discntPicker.searchValue" placeholder="할인정책명 / ID 검색" @keyup.enter="_loadDiscntPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadDiscntPicker">조회</button>
      </div>
      <div v-if="discntPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>할인ID</th>
          <th>할인명</th>
          <th>할인</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!discntPicker.rows.length"><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in discntPicker.rows" :key="r.discntId" style="cursor:pointer;" @click="onSelectDiscnt(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.discntId }}</td>
            <td>{{ r.discntNm }}</td>
            <td style="font-size:11px;color:#6366f1;">{{ r.discntTypeCd==='RATE' ? r.discVal+'%' : (r.discVal||0).toLocaleString()+'원' }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

</div>`,
  };
})();

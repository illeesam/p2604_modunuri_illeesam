/* ZdSimulPromoMng — 프로모션 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed } = Vue;
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
        /* 쿠폰 설정 */
        couponDiscType: 'RATE',
        couponDiscRateMin: 5,
        couponDiscRateMax: 30,
        couponDiscAmtMin: 1000,
        couponDiscAmtMax: 30000,
        couponIssueCountMin: 10,
        couponIssueCountMax: 500,
        couponDurationDays: 30,
        couponScope: 'ALL',
        couponMinOrderAmt: 0,
        couponMaxDiscAmt: 50000,
        /* 할인정책 설정 */
        discntType: 'RATE',
        discntRateMin: 3,
        discntRateMax: 20,
        discntAmtMin: 500,
        discntAmtMax: 10000,
        discntDurationDays: 14,
        discntMinOrderAmt: 0,
        discntMaxDiscAmt: 50000,
        /* 적립금 설정 */
        saveRateMin: 1,
        saveRateMax: 10,
        saveAmtMin: 100,
        saveAmtMax: 5000,
        saveDurationDays: 365,
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };
      const _shortId = () => String(Date.now()).slice(-6);

      const simul = useSimulSetup({
        domain: '프로모션',
        label: '시뮬프로모',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            let type = domCfg.promoType;
            if (type === 'both') type = Math.random() < 0.5 ? 'coupon' : 'discnt';
            const now = _makeDate(0);

            if (type === 'coupon') {
              const isRate  = domCfg.couponDiscType === 'RATE';
              const discVal = isRate
                ? randInt(domCfg.couponDiscRateMin, domCfg.couponDiscRateMax)
                : randInt(domCfg.couponDiscAmtMin, domCfg.couponDiscAmtMax);
              const nm  = (namePrefix || '') + pick(COUPON_NAMES);
              const body = {
                couponNm: nm, couponCd: 'SIM_C_' + _shortId(),
                couponDiscTypeCd: domCfg.couponDiscType, discVal,
                issueCount: randInt(domCfg.couponIssueCountMin, domCfg.couponIssueCountMax),
                startDate: now, endDate: _makeDate(domCfg.couponDurationDays),
                scopeCd: domCfg.couponScope,
                minOrderAmt: domCfg.couponMinOrderAmt,
                maxDiscAmt: domCfg.couponMaxDiscAmt,
              };
              const res = await boApi.post('/bo/zd/simul/promo/coupon-create', body, coUtil.cofApiHdr('프로모시뮬', '쿠폰생성'));
              const id  = res?.data?.data?.couponId || '-';
              const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
              return { ok: true, desc: '[쿠폰] ' + nm + ' ' + discStr + ' 할인', meta: { id, type: '쿠폰' } };
            } else if (type === 'discnt') {
              const isRate  = domCfg.discntType === 'RATE';
              const discVal = isRate
                ? randInt(domCfg.discntRateMin, domCfg.discntRateMax)
                : randInt(domCfg.discntAmtMin, domCfg.discntAmtMax);
              const nm   = (namePrefix || '') + pick(DISCNT_NAMES);
              const body = {
                discntNm: nm, discntTypeCd: domCfg.discntType, discVal,
                startDate: now, endDate: _makeDate(domCfg.discntDurationDays),
                minOrderAmt: domCfg.discntMinOrderAmt,
                maxDiscAmt: domCfg.discntMaxDiscAmt,
              };
              const res = await boApi.post('/bo/zd/simul/promo/discnt-create', body, coUtil.cofApiHdr('프로모시뮬', '할인생성'));
              const id  = res?.data?.data?.discntId || '-';
              const discStr = isRate ? discVal + '%' : discVal.toLocaleString() + '원';
              return { ok: true, desc: '[할인] ' + nm + ' ' + discStr, meta: { id, type: '할인' } };
            } else {
              const saveRate = randInt(domCfg.saveRateMin, domCfg.saveRateMax);
              const nm   = (namePrefix || '') + pick(SAVE_NAMES);
              const body = {
                saveNm: nm, saveRatePct: saveRate, saveAmt: randInt(domCfg.saveAmtMin, domCfg.saveAmtMax),
                startDate: now, endDate: _makeDate(domCfg.saveDurationDays),
              };
              const res = await boApi.post('/bo/zd/simul/promo/save-create', body, coUtil.cofApiHdr('프로모시뮬', '적립생성'));
              const id  = res?.data?.data?.saveId || '-';
              return { ok: true, desc: '[적립] ' + nm + ' ' + saveRate + '% 적립', meta: { id, type: '적립' } };
            }
          } else {
            const type = domCfg.promoType === 'both' ? 'coupon' : domCfg.promoType;
            let list = [];
            if (type === 'coupon') list = (await boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
            else list = (await boApiSvc.pmDiscnt.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 ' + type + ' 없음' };
            const target = pick(list);
            const body = { endDate: _makeDate(randInt(7, 30)) };
            if (type === 'coupon') {
              await boApi.post('/bo/zd/simul/promo/coupon-update', { couponId: target.couponId, ...body }, coUtil.cofApiHdr('프로모시뮬', '쿠폰수정'));
            } else {
              await boApi.post('/bo/zd/simul/promo/discnt-update', { discntId: target.discntId, ...body }, coUtil.cofApiHdr('프로모시뮬', '할인수정'));
            }
            const id = target.couponId || target.discntId;
            return { ok: true, desc: '[' + type + '] ' + id + ' 기간 연장', meta: { id } };
          }
        },
      });
      const { cfg, state, logs, logPager, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog, onSetLogPage } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const couponCfgColumns = [
        { key: 'couponDiscType',     label: '할인 방식',   type: 'select', options: DISC_TYPES },
        makeRangeCol('couponDiscRateMin', 'couponDiscRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.couponDiscType === 'RATE' }),
        { key: 'couponDiscAmtMin',   label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.couponDiscType === 'AMOUNT' },
        { key: 'couponDiscAmtMax',   label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.couponDiscType === 'AMOUNT' },
        makeRangeCol('couponIssueCountMin', 'couponIssueCountMax', '발행수 범위', 1, 1000, '매'),
        { key: 'couponDurationDays', label: '유효기간',    type: 'number', hint: '일' },
        { key: 'couponScope',        label: '적용범위',    type: 'select', options: COUPON_SCOPES },
        { key: 'couponMinOrderAmt',  label: '최소 주문액', type: 'number', hint: '원' },
        { key: 'couponMaxDiscAmt',   label: '최대 할인액', type: 'number', hint: '원' },
      ];
      const discntCfgColumns = [
        { key: 'discntType',     label: '할인 방식',   type: 'select', options: DISC_TYPES },
        makeRangeCol('discntRateMin', 'discntRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.discntType === 'RATE' }),
        { key: 'discntAmtMin',   label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.discntType === 'AMOUNT' },
        { key: 'discntAmtMax',   label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.discntType === 'AMOUNT' },
        { key: 'discntDurationDays', label: '기간',    type: 'number', hint: '일' },
        { key: 'discntMinOrderAmt',  label: '최소주문', type: 'number', hint: '원' },
        { key: 'discntMaxDiscAmt',   label: '최대할인', type: 'number', hint: '원' },
      ];
      const saveCfgColumns = [
        makeRangeCol('saveRateMin', 'saveRateMax', '적립률 범위', 0, 50, '%'),
        { key: 'saveAmtMin',       label: '적립액 최소',  type: 'number', hint: '원' },
        { key: 'saveAmtMax',       label: '적립액 최대',  type: 'number', hint: '원' },
        { key: 'saveDurationDays', label: '유효기간',     type: 'number', hint: '일' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'couponDiscRateMin',  maxKey: 'couponDiscRateMax'  },
        { minKey: 'couponIssueCountMin', maxKey: 'couponIssueCountMax' },
        { minKey: 'discntRateMin',      maxKey: 'discntRateMax'      },
        { minKey: 'saveRateMin',        maxKey: 'saveRateMax'        },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, couponCfgColumns, discntCfgColumns, saveCfgColumns,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage,
        ...rangeHandlers,
        PROMO_TYPES,
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
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

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
    <div v-if="domCfg.promoType==='discnt'" style="padding:14px 16px;">
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

    <!-- 쿠폰+할인 혼합 -->
    <div v-if="domCfg.promoType==='both'" style="padding:0 16px 14px;">
      <div class="list-title">💰 할인정책 설정</div>
      <bo-form-area :columns="discntCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
        ${rangeSlotTemplate('discntRateMin','discntRateMax',0,100,'%')}
      </bo-form-area>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />
</div>`,
  };
})();

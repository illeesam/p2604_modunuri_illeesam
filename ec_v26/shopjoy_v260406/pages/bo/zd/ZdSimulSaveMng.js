/* ZdSimulSaveMng — 프로모션 적립금 시뮬레이터 */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  /* 적립 방식 (정률/정액) */
  const SAVE_VAL_ITEMS = [
    { cd: 'RATE',   label: '적립률 (%)',  color: '#3b82f6' },
    { cd: 'AMOUNT', label: '정액 적립금', color: '#f59e0b' },
  ];

  /* 적립 용도 유형 (DB SAVE_PURPOSE: PURCHASE/REVIEW/JOIN/BIRTHDAY/VIP/EVENT/ADMIN — save_purpose_cd) */
  const SAVE_TYPE_ITEMS = [
    { cd: 'PURCHASE', label: '구매적립',       color: '#22c55e' },
    { cd: 'REVIEW',   label: '리뷰적립',       color: '#3b82f6' },
    { cd: 'JOIN',     label: '가입적립',       color: '#f59e0b' },
    { cd: 'BIRTHDAY', label: '생일적립',       color: '#f97316' },
    { cd: 'VIP',      label: 'VIP추가적립',    color: '#a855f7' },
    { cd: 'EVENT',    label: '이벤트참여적립', color: '#06b6d4' },
    { cd: 'ADMIN',    label: '관리자지급적립', color: '#ef4444' },
  ];

  const SAVE_SCOPES = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  const SAVE_NAMES = [
    '기본 구매 적립금', 'VIP 추가 적립금', '리뷰 작성 적립금', '생일 보너스 적립금',
    '신규 가입 적립금', '이벤트 참여 적립금',
  ];

  window.ZdSimulSaveMng = {
    name: 'ZdSimulSaveMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ─────────────────────────────── */
      const domCfg = reactive({
        /* 적립금 정책 용도 유형 가중치 */
        fixedSaveTypeCd:    '__weighted__',
        saveTypeCdWeights:  { PURCHASE: 35, REVIEW: 20, JOIN: 15, BIRTHDAY: 10, VIP: 10, EVENT: 7, ADMIN: 3 },
        /* 적립 방식 가중치 */
        fixedSaveValType:   '__weighted__',
        saveValTypeWeights: { RATE: 65, AMOUNT: 35 },
        saveRateMin:        1,
        saveRateMax:        10,
        saveAmtMin:         100,
        saveAmtMax:         5000,
        saveDurationDays:   365,
        saveScope:          'PRODUCT',
        saveProdIds:        '',
      });

      /* ── 가중치 픽 ───────────────────────────────────── */
      const _pickWeighted = (items, weights) => {
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of items) { r -= Number(weights[t.cd] || 0); if (r <= 0) return t; }
        return items[0];
      };
      const _pickSaveTypeCd = () => {
        const fixed = domCfg.fixedSaveTypeCd;
        if (fixed && fixed !== '__weighted__') return SAVE_TYPE_ITEMS.find(t => t.cd === fixed) || SAVE_TYPE_ITEMS[0];
        return _pickWeighted(SAVE_TYPE_ITEMS, domCfg.saveTypeCdWeights);
      };
      const _pickSaveValType = () => {
        const fixed = domCfg.fixedSaveValType;
        if (fixed && fixed !== '__weighted__') return SAVE_VAL_ITEMS.find(t => t.cd === fixed) || SAVE_VAL_ITEMS[0];
        return _pickWeighted(SAVE_VAL_ITEMS, domCfg.saveValTypeWeights);
      };
      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };

      /* ── [02] 공통 엔진 ───────────────────────────────── */
      const simul = useSimulSetup({
        domain: '적립금',
        uiNm: '프로모션 적립금 시뮬레이터',
        label: '시뮬적립금',
        showToast: props.showToast,
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const saveTypeCd = _pickSaveTypeCd();
            const valType    = _pickSaveValType();
            const isRate     = valType.cd === 'RATE';
            const saveRate   = isRate ? randInt(domCfg.saveRateMin, domCfg.saveRateMax) : 0;
            const saveAmt    = isRate ? 0 : randInt(domCfg.saveAmtMin, domCfg.saveAmtMax);
            const nm = (namePrefix || '') + '[' + saveTypeCd.label + '] ' + pick(SAVE_NAMES);
            const prodIds = domCfg.saveScope === 'PRODUCT' && domCfg.saveProdIds
              ? domCfg.saveProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
              : [];
            const body = {
              saveNm: nm,
              savePurposeCd: saveTypeCd.cd,
              saveRatePct: isRate ? saveRate : null,
              saveAmt: isRate ? null : saveAmt,
              startDate: _makeDate(0), endDate: _makeDate(domCfg.saveDurationDays),
              scopeCd: domCfg.saveScope,
              prodIds,
              simulYn: 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/promo/save-create', body, coUtil.cofApiHdr('적립금시뮬', '적립금생성'));
            const id  = res?.data?.data?.saveId || '-';
            const saveStr = isRate ? saveRate + '% 적립률' : saveAmt.toLocaleString() + '원 정액';
            return { ok: true, desc: nm + ' ' + saveStr, meta: { id, params: body } };
          } else {
            return { ok: false, reason: '적립금정책 수정은 미지원 (생성 모드 사용)' };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ──────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const saveCfgColumns = [
        makeRangeCol('saveRateMin', 'saveRateMax', '적립률 범위', 0, 50, '%',
          { visible: (f) => f.fixedSaveValType !== 'AMOUNT' }),
        { key: 'saveAmtMin',       label: '정액 적립금 최소', type: 'number', hint: '원', visible: (f) => f.fixedSaveValType === 'AMOUNT' },
        { key: 'saveAmtMax',       label: '정액 적립금 최대', type: 'number', hint: '원', visible: (f) => f.fixedSaveValType === 'AMOUNT' },
        { key: 'saveDurationDays', label: '유효기간',           type: 'number', hint: '일' },
        { key: 'saveScope',        label: '적용범위',           type: 'select', options: SAVE_SCOPES },
        { key: 'saveProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분 (기본 5개 자동)', hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.saveScope === 'PRODUCT' },
      ];

      const cfSaveTypeCdTotal  = computed(() => Object.values(domCfg.saveTypeCdWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfSaveValTypeTotal = computed(() => Object.values(domCfg.saveValTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'saveRateMin', maxKey: 'saveRateMax' },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, saveCfgColumns,
        cfSaveTypeCdTotal, cfSaveValTypeTotal,
        SAVE_TYPE_ITEMS, SAVE_VAL_ITEMS,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog,
        ...rangeHandlers,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🪙 프로모션 적립금 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#059669,#34d399)"
    accent-active="background:#ecfdf5;border:1.5px solid #059669;color:#065f46;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 적립금 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🪙 적립금정책 설정</div>
    <bo-form-area :columns="saveCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('saveRateMin','saveRateMax',0,50,'%')}
    </bo-form-area>
  </div>

  <!-- 가중치 패널 -->
  <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 적립금 용도 유형 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🎯 적립금 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedSaveTypeCd" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in SAVE_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSaveTypeCd==='__weighted__'">
        <div v-for="t in SAVE_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:100px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saveTypeCdWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saveTypeCdWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.saveTypeCdWeights[t.cd]/cfSaveTypeCdTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in SAVE_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.saveTypeCdWeights[t.cd]+';transition:flex .2s;background:'+t.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 적립 방식 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">💡 적립 방식 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedSaveValType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in SAVE_VAL_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSaveValType==='__weighted__'">
        <div v-for="t in SAVE_VAL_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:94px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saveValTypeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saveValTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.saveValTypeWeights[t.cd]/cfSaveValTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in SAVE_VAL_ITEMS" :key="t.cd" :style="'flex:'+domCfg.saveValTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color+';'"></div>
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

/* ZdSimulSaveMng — 프로모션 마일리지 시뮬레이터 */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  /* 마일리지 값 방식 (정률/정액) */
  const SAVE_VAL_ITEMS = [
    { cd: 'RATE',   label: '마일리지율 (%)' },
    { cd: 'AMOUNT', label: '정액 마일리지 (원)' },
  ];

  /* 마일리지 지급 유형 (DB SAVE_TYPE: EARN/USE/EXPIRE/CANCEL/ADMIN) */
  const SAVE_TYPE_ITEMS = [
    { cd: 'EARN',   label: '적립' },
    { cd: 'USE',    label: '사용' },
    { cd: 'EXPIRE', label: '소멸' },
    { cd: 'CANCEL', label: '적립취소' },
    { cd: 'ADMIN',  label: '관리자조정' },
  ];

  const SAVE_SCOPES = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  const SAVE_NAMES = [
    '기본 구매 마일리지', 'VIP 추가 마일리지', '리뷰 작성 마일리지', '생일 보너스 마일리지',
    '신규 가입 마일리지', '이벤트 참여 마일리지',
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
        /* 마일리지 지급 유형 가중치 */
        fixedSaveTypeCd:    '__weighted__',
        saveTypeCdWeights:  { EARN: 60, USE: 20, EXPIRE: 8, CANCEL: 7, ADMIN: 5 },
        /* 마일리지 값 방식 가중치 */
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
        domain: '마일리지',
        uiNm: '프로모션 마일리지 시뮬레이터',
        label: '시뮬마일리지',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const saveTypeCd = _pickSaveTypeCd();
            const valType    = _pickSaveValType();
            const isRate     = valType.cd === 'RATE';
            const saveRate   = isRate ? randInt(domCfg.saveRateMin, domCfg.saveRateMax) : 0;
            const saveAmt    = isRate ? 0 : randInt(domCfg.saveAmtMin, domCfg.saveAmtMax);
            const nm = (namePrefix || '') + pick(SAVE_NAMES);
            const prodIds = domCfg.saveScope === 'PRODUCT' && domCfg.saveProdIds
              ? domCfg.saveProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
              : [];
            const body = {
              saveNm: nm,
              saveTypeCd: saveTypeCd.cd,
              ...(isRate ? { saveRatePct: saveRate } : { saveAmt }),
              startDate: _makeDate(0), endDate: _makeDate(domCfg.saveDurationDays),
              scopeCd: domCfg.saveScope,
              ...(prodIds.length ? { prodIds } : {}),
              simulYn: 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/promo/save-create', body, coUtil.cofApiHdr('마일리지시뮬', '마일리지생성'));
            const id  = res?.data?.data?.saveId || '-';
            const saveStr = isRate ? saveRate + '% 마일리지율' : saveAmt.toLocaleString() + '원 정액';
            return { ok: true, desc: '[' + saveTypeCd.label + '] ' + nm + ' ' + saveStr, meta: { id, params: body } };
          } else {
            return { ok: false, reason: '마일리지정책 수정은 미지원 (생성 모드 사용)' };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ──────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const saveCfgColumns = [
        makeRangeCol('saveRateMin', 'saveRateMax', '마일리지율 범위', 0, 50, '%',
          { visible: (f) => f.fixedSaveValType !== 'AMOUNT' }),
        { key: 'saveAmtMin',       label: '정액 마일리지 최소', type: 'number', hint: '원', visible: (f) => f.fixedSaveValType === 'AMOUNT' },
        { key: 'saveAmtMax',       label: '정액 마일리지 최대', type: 'number', hint: '원', visible: (f) => f.fixedSaveValType === 'AMOUNT' },
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
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        ...rangeHandlers,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🪙 프로모션 마일리지 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#059669,#34d399)"
    accent-active="background:#ecfdf5;border:1.5px solid #059669;color:#065f46;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 마일리지 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🪙 마일리지정책 설정</div>
    <bo-form-area :columns="saveCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('saveRateMin','saveRateMax',0,50,'%')}
    </bo-form-area>

    <!-- 마일리지 지급 유형 가중치 (SAVE_TYPE) -->
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">🏷 마일리지 지급유형 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedSaveTypeCd" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in SAVE_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSaveTypeCd==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in SAVE_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:60px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saveTypeCdWeights[t.cd]" style="flex:1;accent-color:#059669;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saveTypeCdWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.saveTypeCdWeights[t.cd]/cfSaveTypeCdTotal*100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 마일리지 값 방식 가중치 (정률/정액) -->
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">💡 마일리지 값 방식 가중치</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <select v-model="domCfg.fixedSaveValType" style="border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:12px;">
          <option value="__weighted__">가중치 적용</option>
          <option v-for="t in SAVE_VAL_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }} 고정</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSaveValType==='__weighted__'" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in SAVE_VAL_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:100px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saveValTypeWeights[t.cd]" style="flex:1;accent-color:#059669;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saveValTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.saveValTypeWeights[t.cd]/cfSaveValTypeTotal*100) }}%</span>
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

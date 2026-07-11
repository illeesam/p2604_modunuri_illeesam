/* ZdSimulDiscntMng — 프로모션 할인정책 시뮬레이터 */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  /* 할인 유형 (DB DISCNT_TYPE: PROD/ORDER/SHIP/SHIP_FREE) */
  const DISCNT_TYPE_ITEMS = [
    { cd: 'PROD',      label: '상품할인',   color: '#3b82f6' },
    { cd: 'ORDER',     label: '주문할인',   color: '#a855f7' },
    { cd: 'SHIP',      label: '배송비할인', color: '#22c55e' },
    { cd: 'SHIP_FREE', label: '무료배송',   color: '#06b6d4' },
  ];

  /* 할인 방식 (DB DISCNT_VAL_TYPE: RATE/AMOUNT — SHIP_FREE 유형은 해당없음) */
  const DISCNT_VAL_TYPE_ITEMS = [
    { cd: 'RATE',   label: '정률 (%)', color: '#f59e0b' },
    { cd: 'AMOUNT', label: '정액 (원)', color: '#f97316' },
  ];

  const DISCNT_SCOPES   = [
    { value: 'ALL',      label: '전체 상품' },
    { value: 'CATEGORY', label: '카테고리' },
    { value: 'PRODUCT',  label: '특정 상품' },
  ];
  const DISCNT_NAMES = [
    '봄 시즌 할인', '여름 세일', '추석 특별 할인', '겨울 페스타',
    '주말 특가 이벤트', '신규 고객 할인', '대량 구매 할인', '플래시 세일',
  ];

  window.ZdSimulDiscntMng = {
    name: 'ZdSimulDiscntMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ─────────────────────────────── */
      const domCfg = reactive({
        fixedDiscntId:       '',
        /* 할인 유형 가중치 (PROD/ORDER/SHIP/SHIP_FREE) */
        fixedDiscntTypeCd:    '__weighted__',
        discntTypeCdWeights:  { PROD: 40, ORDER: 30, SHIP: 15, SHIP_FREE: 15 },
        /* 할인 방식 가중치 (RATE/AMOUNT) */
        fixedDiscntValTypeCd: '__weighted__',
        discntValTypeWeights: { RATE: 60, AMOUNT: 40 },
        discntRateMin:       3,
        discntRateMax:       20,
        discntAmtMin:        500,
        discntAmtMax:        10000,
        discntDurationDays:  14,
        discntMinOrderAmt:   0,
        discntMaxDiscAmt:    50000,
        discntScope:         'PRODUCT',
        discntProdIds:       '',
      });

      /* ── 가중치 픽 ───────────────────────────────────── */
      const _pickWeighted = (items, weights) => {
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of items) { r -= Number(weights[t.cd] || 0); if (r <= 0) return t; }
        return items[0];
      };
      const _pickDiscntTypeCd = () => {
        const fixed = domCfg.fixedDiscntTypeCd;
        if (fixed && fixed !== '__weighted__') return DISCNT_TYPE_ITEMS.find(t => t.cd === fixed) || DISCNT_TYPE_ITEMS[0];
        return _pickWeighted(DISCNT_TYPE_ITEMS, domCfg.discntTypeCdWeights);
      };
      const _pickDiscntValType = () => {
        const fixed = domCfg.fixedDiscntValTypeCd;
        if (fixed && fixed !== '__weighted__') return DISCNT_VAL_TYPE_ITEMS.find(t => t.cd === fixed) || DISCNT_VAL_TYPE_ITEMS[0];
        return _pickWeighted(DISCNT_VAL_TYPE_ITEMS, domCfg.discntValTypeWeights);
      };
      const _makeDate = (daysLater) => {
        const d = new Date(); d.setDate(d.getDate() + daysLater);
        return d.toISOString().replace('T', ' ').substring(0, 19);
      };

      /* ── [02] 공통 엔진 ───────────────────────────────── */
      const simul = useSimulSetup({
        domain: '할인',
        uiNm: '프로모션 할인 시뮬레이터',
        label: '시뮬할인',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const discntType   = _pickDiscntTypeCd();
            const isFreeShip   = discntType.cd === 'SHIP_FREE';
            const valType      = isFreeShip ? null : _pickDiscntValType();
            const isRate       = valType?.cd === 'RATE';
            const discVal      = isFreeShip ? 0
              : isRate ? randInt(domCfg.discntRateMin, domCfg.discntRateMax)
              : randInt(domCfg.discntAmtMin, domCfg.discntAmtMax);
            const nm = (namePrefix || '') + '[' + discntType.label + '] ' + pick(DISCNT_NAMES);
            const prodIds = domCfg.discntScope === 'PRODUCT' && domCfg.discntProdIds
              ? domCfg.discntProdIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
              : [];
            const body = {
              discntNm: nm,
              discntTypeCd: discntType.cd,
              ...(valType ? { discntValTypeCd: valType.cd } : {}),
              discVal,
              startDate: _makeDate(0), endDate: _makeDate(domCfg.discntDurationDays),
              scopeCd: domCfg.discntScope,
              ...(prodIds.length ? { prodIds } : {}),
              minOrderAmt: domCfg.discntMinOrderAmt,
              maxDiscAmt: domCfg.discntMaxDiscAmt,
              simulYn: 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/promo/discnt-create', body, coUtil.cofApiHdr('할인시뮬', '할인생성'));
            const id  = res?.data?.data?.discntId || '-';
            const discStr = isFreeShip ? '무료배송' : isRate ? discVal + '%' : discVal.toLocaleString() + '원';
            return { ok: true, desc: '[' + discntType.label + (valType ? '/' + valType.label : '') + '] ' + nm + ' ' + discStr, meta: { id, params: body } };
          } else {
            let discntId = domCfg.fixedDiscntId;
            if (!discntId) {
              const list = (await boApiSvc.pmDiscnt.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 할인정책 없음' };
              discntId = pick(list).discntId;
            }
            const body = { discntId, endDate: _makeDate(randInt(7, 30)) };
            await boApi.post('/bo/zd/simul/promo/discnt-update', body, coUtil.cofApiHdr('할인시뮬', '할인수정'));
            return { ok: true, desc: discntId + ' 기간 연장', meta: { id: discntId, params: body } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ──────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const discntCfgColumns = [
        makeRangeCol('discntRateMin', 'discntRateMax', '할인율 범위', 0, 100, '%',
          { visible: (f) => f.fixedDiscntValTypeCd !== 'AMOUNT' }),
        { key: 'discntAmtMin', label: '할인액 최소', type: 'number', hint: '원', visible: (f) => f.fixedDiscntValTypeCd === 'AMOUNT' },
        { key: 'discntAmtMax', label: '할인액 최대', type: 'number', hint: '원', visible: (f) => f.fixedDiscntValTypeCd === 'AMOUNT' },
        { key: 'discntDurationDays', label: '기간',    type: 'number', hint: '일' },
        { key: 'discntMinOrderAmt',  label: '최소주문', type: 'number', hint: '원' },
        { key: 'discntMaxDiscAmt',   label: '최대할인', type: 'number', hint: '원' },
        { key: 'discntScope',        label: '적용범위', type: 'select', options: DISCNT_SCOPES },
        { key: 'discntProdIds',      label: '시뮬 상품 ID', type: 'text',
          placeholder: 'ID 콤마 구분 (기본 5개 자동)', hint: '비우면 simulYn=Y 상품 자동조회',
          visible: (f) => f.discntScope === 'PRODUCT' },
      ];

      const cfDiscntTypeCdTotal  = computed(() => Object.values(domCfg.discntTypeCdWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDiscntValTypeTotal = computed(() => Object.values(domCfg.discntValTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'discntRateMin', maxKey: 'discntRateMax' },
      ]);

      /* ── picker ──────────────────────────────────────── */
      const discntPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const _loadDiscntPicker = async () => {
        discntPicker.loading = true;
        try {
          const res = await boApiSvc.pmDiscnt.getPage({ pageNo: 1, pageSize: 20,
            ...(discntPicker.searchValue ? { searchValue: discntPicker.searchValue } : {}) });
          discntPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { discntPicker.rows = []; }
        discntPicker.loading = false;
      };
      const onOpenDiscntPicker = async () => { discntPicker.show = true; discntPicker.searchValue = ''; await _loadDiscntPicker(); };
      const onSelectDiscnt = (row) => { domCfg.fixedDiscntId = row.discntId; discntPicker.show = false; };

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, discntCfgColumns,
        cfDiscntTypeCdTotal, cfDiscntValTypeTotal,
        DISCNT_TYPE_ITEMS, DISCNT_VAL_TYPE_ITEMS,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        ...rangeHandlers,
        discntPicker, onOpenDiscntPicker, onSelectDiscnt, _loadDiscntPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">💰 프로모션 할인 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#2563eb,#60a5fa)"
    accent-active="background:#eff6ff;border:1.5px solid #2563eb;color:#1d4ed8;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 할인정책 설정 -->
  <div class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">💰 할인정책 설정</div>
    <bo-form-area :columns="discntCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('discntRateMin','discntRateMax',0,100,'%')}
    </bo-form-area>
  </div>

  <!-- 가중치 패널 -->
  <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <!-- 할인 유형 가중치 (PROD/ORDER/SHIP/SHIP_FREE) -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🎯 할인 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedDiscntTypeCd" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in DISCNT_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedDiscntTypeCd==='__weighted__'">
        <div v-for="t in DISCNT_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:72px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.discntTypeCdWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.discntTypeCdWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.discntTypeCdWeights[t.cd]/cfDiscntTypeCdTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in DISCNT_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.discntTypeCdWeights[t.cd]+';transition:flex .2s;background:'+t.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 할인 방식 가중치 (RATE 정률 / AMOUNT 정액) -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">💡 할인 방식 가중치</div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:8px;">SHIP_FREE 유형 선택 시 적용 안 됨</div>
      <div style="margin-bottom:10px;">
        <select v-model="domCfg.fixedDiscntValTypeCd" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in DISCNT_VAL_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedDiscntValTypeCd==='__weighted__'">
        <div v-for="t in DISCNT_VAL_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:72px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.discntValTypeWeights[t.cd]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.discntValTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.discntValTypeWeights[t.cd]/cfDiscntValTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in DISCNT_VAL_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.discntValTypeWeights[t.cd]+';transition:flex .2s;background:'+t.color+';'"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 수정 대상 지정 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🎯 수정 대상 할인정책 지정</div>
    <div style="display:flex;gap:6px;align-items:center;max-width:400px;margin-top:10px;">
      <input type="text" :value="domCfg.fixedDiscntId || ''" readonly placeholder="랜덤 선택"
        style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;font-family:monospace;"
        @click="onOpenDiscntPicker" />
      <button v-if="domCfg.fixedDiscntId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
        @click="domCfg.fixedDiscntId=''">✕</button>
      <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenDiscntPicker">선택</button>
    </div>
    <div v-if="!domCfg.fixedDiscntId" style="font-size:10px;color:#94a3b8;margin-top:4px;">미지정 시 랜덤 할인정책 선택</div>
  </div>

  <!-- 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- picker 모달 -->
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
          <th style="width:36px;">번호</th><th>할인ID</th><th>할인명</th><th>타입</th><th>할인</th><th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!discntPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in discntPicker.rows" :key="r.discntId" style="cursor:pointer;" @click="onSelectDiscnt(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.discntId }}</td>
            <td>{{ r.discntNm }}</td>
            <td style="font-size:11px;color:#64748b;">{{ r.discntTypeCd || '-' }}</td>
            <td style="font-size:11px;color:#2563eb;">{{ r.discntTypeCd==='SHIP_FREE' ? '무료배송' : (r.discntValTypeCd==='RATE' ? r.discVal+'%' : (r.discVal||0).toLocaleString()+'원') }}</td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();

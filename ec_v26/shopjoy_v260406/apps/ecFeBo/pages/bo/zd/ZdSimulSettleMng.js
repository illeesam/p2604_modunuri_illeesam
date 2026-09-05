/* ZdSimulSettleMng — 정산 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { ref, reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const SETTLE_STATUSES = [
    { value: 'PENDING',   label: '정산대기'   },
    { value: 'CONFIRMED', label: '정산확정'   },
    { value: 'PAID',      label: '지급완료'   },
    { value: 'DISPUTED',  label: '이의신청중' },
    { value: 'HOLD',      label: '보류'       },
  ];
  const SETTLE_PERIODS = [
    { value: 'WEEKLY',   label: '주간' },
    { value: 'MONTHLY',  label: '월간' },
    { value: 'BIWEEKLY', label: '격주' },
  ];
  const UPDATE_ACTIONS = [
    { value: 'status',  label: '상태 변경' },
    { value: 'adjust',  label: '금액 조정' },
    { value: 'memo',    label: '정산 메모' },
  ];

  window.ZdSimulSettleMng = {
    name: 'ZdSimulSettleMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        saleAmtMin: 100000,
        saleAmtMax: 5000000,
        feeRateMin: 3,
        feeRateMax: 15,
        pgFeeRateMin: 1,
        pgFeeRateMax: 3,
        refundAmtRatio: 10,
        settlePeriod: 'MONTHLY',
        createStatus: 'PENDING',
        vendorFromDB: true,
        updateAction: 'status',
        updateStatus: 'CONFIRMED',
        adjustAmtMin: -100000,
        adjustAmtMax: 100000,
      });
      const vendors = ref([]);

      /* ── [02] 실시간 계산 미리보기 ───────────────────── */
      const cfPreview = computed(() => {
        const saleAmt   = Math.round((domCfg.saleAmtMin + domCfg.saleAmtMax) / 2);
        const feeRate   = (domCfg.feeRateMin + domCfg.feeRateMax) / 2;
        const pgRate    = (domCfg.pgFeeRateMin + domCfg.pgFeeRateMax) / 2;
        const refundAmt = Math.round(saleAmt * domCfg.refundAmtRatio / 100);
        const feeAmt    = Math.round(saleAmt * feeRate / 100);
        const pgAmt     = Math.round(saleAmt * pgRate / 100);
        const settleAmt = saleAmt - refundAmt - feeAmt - pgAmt;
        return { saleAmt, refundAmt, feeAmt, pgAmt, settleAmt };
      });

      /* ── [03] 공통 엔진 ──────────────────────────────── */
      const _fmtDate = (d) => d.toISOString().substring(0, 7);
      const _makeDate = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
      const _wonFmt  = (n) => Number(n).toLocaleString('ko-KR') + '원';

      const simul = useSimulSetup({
        domain: '정산',
        uiNm: '정산 시뮬레이터',
        label: '시뮬정산',
        showToast: props.showToast,
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, simulYn, randInt, pick }) => {
          if (mode === 'create') {
            /* 업체 목록 캐시 */
            if (domCfg.vendorFromDB && !vendors.value.length) {
              const r = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 50, vendorStatusCd: 'ACTIVE' });
              vendors.value = r.data?.data?.pageList || [];
            }
            const vendorId   = vendors.value.length ? pick(vendors.value).vendorId : 'VENDOR_SIM';
            const vendorNm   = vendors.value.find(v => v.vendorId === vendorId)?.vendorNm || '시뮬업체';
            const saleAmt    = randInt(domCfg.saleAmtMin, domCfg.saleAmtMax);
            const feeRate    = randInt(domCfg.feeRateMin, domCfg.feeRateMax) / 100;
            const pgRate     = randInt(domCfg.pgFeeRateMin, domCfg.pgFeeRateMax) / 100;
            const refundAmt  = Math.round(saleAmt * domCfg.refundAmtRatio / 100);
            const feeAmt     = Math.round(saleAmt * feeRate);
            const pgAmt      = Math.round(saleAmt * pgRate);
            const settleAmt  = saleAmt - refundAmt - feeAmt - pgAmt;
            const baseDate   = _makeDate(0);
            const body       = {
              vendorId, settlePeriod: domCfg.settlePeriod,
              settleYm: _fmtDate(baseDate),
              settleStatusCd: domCfg.createStatus,
              saleAmt, refundAmt, feeAmt, pgAmt, settleAmt,
              feeRate: Math.round(feeRate * 10000) / 100,
              simulYn: simulYn || 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/settle/create', body, coUtil.cofApiHdr('정산시뮬', '생성'));
            const id  = res?.data?.data?.settleId || '-';
            return {
              ok: true,
              desc: vendorNm + ' | 매출:' + _wonFmt(saleAmt) + ' → 정산:' + _wonFmt(settleAmt),
              meta: { id, vendorNm, saleAmt, settleAmt, params: body },
            };
          } else {
            const list = (await boApiSvc.stSettle.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 정산 없음' };
            const target = pick(list);
            let body = {}, desc = '';
            if (domCfg.updateAction === 'status') {
              body.settleStatusCd = domCfg.updateStatus; desc = '상태→' + domCfg.updateStatus;
            } else if (domCfg.updateAction === 'adjust') {
              const adj = randInt(domCfg.adjustAmtMin, domCfg.adjustAmtMax);
              body.adjustAmt = adj; desc = '조정금액 ' + (adj >= 0 ? '+' : '') + _wonFmt(adj);
            } else {
              body.settleMemo = '[시뮬메모] ' + new Date().toLocaleTimeString('ko-KR'); desc = '메모 추가';
            }
            const updateBody = { settleId: target.settleId, ...body };
            await boApi.post('/bo/zd/simul/settle/update', updateBody, coUtil.cofApiHdr('정산시뮬', '수정'));
            return { ok: true, desc: target.settleId + ' ' + desc, meta: { id: target.settleId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        makeRangeCol('saleAmtMin', 'saleAmtMax', '매출 범위', 100000, 5000000, '원'),
        makeRangeCol('feeRateMin', 'feeRateMax', '수수료율 범위', 0, 30, '%'),
        makeRangeCol('pgFeeRateMin', 'pgFeeRateMax', 'PG수수료 범위', 0, 10, '%'),
        { key: 'refundAmtRatio',  label: '환불비율',      type: 'number', hint: '%' },
        { key: 'settlePeriod',    label: '정산 주기',     type: 'select', options: SETTLE_PERIODS },
        { key: 'createStatus',    label: '초기 상태',     type: 'select', options: SETTLE_STATUSES },
        { key: 'vendorFromDB',    label: 'DB 업체 자동 배정', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus', label: '변경 상태', type: 'select', options: SETTLE_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'adjustAmtMin', label: '조정 최소', type: 'number', hint: '원',
          visible: (f) => f.updateAction === 'adjust' },
        { key: 'adjustAmtMax', label: '조정 최대', type: 'number', hint: '원',
          visible: (f) => f.updateAction === 'adjust' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'saleAmtMin',   maxKey: 'saleAmtMax'   },
        { minKey: 'feeRateMin',   maxKey: 'feeRateMax'   },
        { minKey: 'pgFeeRateMin', maxKey: 'pgFeeRateMax' },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        cfPreview, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        SETTLE_STATUSES, vendors,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">💳 정산 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#16a34a,#4ade80)"
    accent-active="background:#f0fdf4;border:1.5px solid #16a34a;color:#14532d;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">💳 정산 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('saleAmtMin','saleAmtMax',100000,5000000,'원')}
      ${rangeSlotTemplate('feeRateMin','feeRateMax',0,30,'%')}
      ${rangeSlotTemplate('pgFeeRateMin','pgFeeRateMax',0,10,'%')}
    </bo-form-area>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 정산 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 정산 미리보기 (1/3 폭, 아래 줄) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 평균값 기준 미리보기</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:5px;font-size:11px;">
        <div style="display:flex;justify-content:space-between;padding:5px 8px;background:#f8fafc;border-radius:4px;">
          <span style="color:#64748b;">매출액</span><span style="font-weight:600;">{{ cfPreview.saleAmt.toLocaleString('ko-KR') }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 8px;background:#fef2f2;border-radius:4px;">
          <span style="color:#64748b;">환불액</span><span style="font-weight:600;color:#dc2626;">-{{ cfPreview.refundAmt.toLocaleString('ko-KR') }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 8px;background:#fef2f2;border-radius:4px;">
          <span style="color:#64748b;">수수료</span><span style="font-weight:600;color:#dc2626;">-{{ cfPreview.feeAmt.toLocaleString('ko-KR') }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 8px;background:#fef2f2;border-radius:4px;">
          <span style="color:#64748b;">PG수수료</span><span style="font-weight:600;color:#dc2626;">-{{ cfPreview.pgAmt.toLocaleString('ko-KR') }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:7px 8px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0;margin-top:2px;">
          <span style="color:#166534;font-weight:600;">최종 정산액</span><span style="font-weight:700;color:#16a34a;font-size:13px;">{{ cfPreview.settleAmt.toLocaleString('ko-KR') }}원</span>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />
</div>`,
  };
})();

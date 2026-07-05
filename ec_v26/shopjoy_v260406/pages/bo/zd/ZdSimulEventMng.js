/* ZdSimulEventMng — 이벤트 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  const EVENT_TYPES = [
    { cd: 'ATTEND',   label: '출석체크',  badge: 'badge-blue'   },
    { cd: 'QUIZ',     label: '퀴즈이벤트', badge: 'badge-purple' },
    { cd: 'REVIEW',   label: '리뷰이벤트', badge: 'badge-green'  },
    { cd: 'SHARE',    label: '공유이벤트', badge: 'badge-orange' },
    { cd: 'PURCHASE', label: '구매이벤트', badge: 'badge-blue'   },
    { cd: 'LOTTERY',  label: '복권이벤트', badge: 'badge-purple' },
    { cd: 'PHOTO',    label: '포토이벤트', badge: 'badge-orange' },
    { cd: 'SURVEY',   label: '설문이벤트', badge: 'badge-green'  },
  ];
  const EVENT_STATUSES = [
    { value: 'READY',   label: '준비중' },
    { value: 'ONGOING', label: '진행중' },
    { value: 'ENDED',   label: '종료'   },
    { value: 'PAUSE',   label: '일시정지' },
  ];
  const BENEFIT_TYPES = [
    { value: 'COUPON',  label: '쿠폰 지급' },
    { value: 'SAVE',    label: '적립금 지급' },
    { value: 'PRODUCT', label: '상품 증정' },
    { value: 'POINT',   label: '포인트 지급' },
  ];
  const EVENT_TITLES = [
    '여름 특별 이벤트', '가을 감사 이벤트', '신년 이벤트', '창립기념 이벤트',
    '할로윈 이벤트', '크리스마스 이벤트', '블랙프라이데이 이벤트', '추석 특별 이벤트',
    '봄맞이 이벤트', '신상품 출시 이벤트', '회원 감사 이벤트', '주년 기념 이벤트',
  ];
  const UPDATE_ACTIONS = [
    { value: 'status',  label: '상태 변경' },
    { value: 'period',  label: '기간 연장' },
    { value: 'winner',  label: '당첨자 설정' },
  ];

  window.ZdSimulEventMng = {
    name: 'ZdSimulEventMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        eventTypeWeights: { ATTEND: 20, QUIZ: 20, REVIEW: 15, SHARE: 15, PURCHASE: 15, LOTTERY: 10, PHOTO: 3, SURVEY: 2 },
        durationDaysMin: 5,
        durationDaysMax: 30,
        startOffsetMin: 0,
        startOffsetMax: 7,
        createStatus: 'READY',
        benefitType: 'COUPON',
        benefitAmtMin: 1000,
        benefitAmtMax: 50000,
        winnerCountMin: 1,
        winnerCountMax: 100,
        useRandomTitle: true,
        updateAction: 'status',
        updateStatus: 'ONGOING',
        periodExtendDays: 7,
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        const w = domCfg.eventTypeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of EVENT_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return EVENT_TYPES[0];
      };
      const _fmtDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19);
      const _makeDate = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return _fmtDate(d); };

      const simul = useSimulSetup({
        domain: '이벤트',
        label: '시뮬이벤트',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 15, intervalUnit: 'sec', durationMin: 3 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const type    = _pickType();
            const offset  = randInt(domCfg.startOffsetMin, domCfg.startOffsetMax);
            const dur     = randInt(domCfg.durationDaysMin, domCfg.durationDaysMax);
            const title   = domCfg.useRandomTitle
              ? (namePrefix || '') + pick(EVENT_TITLES) + ' [' + type.label + ']'
              : (namePrefix || '') + type.label + '_' + String(Date.now()).slice(-4);
            const body = {
              eventNm: title, eventTypeCd: type.cd,
              eventStatusCd: domCfg.createStatus,
              startDate: _makeDate(offset), endDate: _makeDate(offset + dur),
              benefitTypeCd: domCfg.benefitType,
              benefitAmt: randInt(domCfg.benefitAmtMin, domCfg.benefitAmtMax),
              winnerCount: randInt(domCfg.winnerCountMin, domCfg.winnerCountMax),
            };
            const res = await boApi.post('/bo/ec/pm/event/save/base', body, coUtil.apiHdr('이벤트시뮬', '생성'));
            const id  = res?.data?.data?.eventId || res?.data?.data?.id || '-';
            return {
              ok: true,
              desc: '[' + type.label + '] ' + title + ' | 당첨자 최대 ' + body.winnerCount + '명',
              meta: { id, type: type.label },
            };
          } else {
            const list = (await boApiSvc.pmEvent.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 이벤트 없음' };
            const target = pick(list);
            let body = {}, desc = '';
            if (domCfg.updateAction === 'status') {
              body.eventStatusCd = domCfg.updateStatus; desc = '상태→' + domCfg.updateStatus;
            } else if (domCfg.updateAction === 'period') {
              const curEnd = target.endDate ? new Date(target.endDate) : new Date();
              curEnd.setDate(curEnd.getDate() + domCfg.periodExtendDays);
              body.endDate = _fmtDate(curEnd); desc = '기간 +' + domCfg.periodExtendDays + '일';
            } else {
              body.winnerCount = randInt(1, 50); desc = '당첨자 수 변경';
            }
            await boApi.put('/bo/ec/pm/event/save/' + target.eventId, body, coUtil.apiHdr('이벤트시뮬', '수정'));
            return { ok: true, desc: target.eventNm + ' — ' + desc, meta: { id: target.eventId } };
          }
        },
      });
      const { cfg, state, logs, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.eventTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'createStatus',   label: '초기 상태',   type: 'select', options: EVENT_STATUSES },
        { key: 'benefitType',    label: '혜택 유형',   type: 'select', options: BENEFIT_TYPES },
        { key: 'benefitAmtMin',  label: '혜택 최소액', type: 'number', hint: '원' },
        { key: 'benefitAmtMax',  label: '혜택 최대액', type: 'number', hint: '원' },
        { key: 'winnerCountMin', label: '당첨자 최소', type: 'number', hint: '명' },
        { key: 'winnerCountMax', label: '당첨자 최대', type: 'number', hint: '명' },
        { key: 'startOffsetMin', label: '시작 오프셋 최소', type: 'number', hint: '일' },
        { key: 'startOffsetMax', label: '시작 오프셋 최대', type: 'number', hint: '일' },
        { key: 'durationDaysMin', label: '기간 최소',  type: 'number', hint: '일' },
        { key: 'durationDaysMax', label: '기간 최대',  type: 'number', hint: '일' },
        { key: 'useRandomTitle', label: '제목 자동 생성', type: 'checkbox' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus', label: '변경 상태', type: 'select', options: EVENT_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'periodExtendDays', label: '연장 일수', type: 'number', hint: '일',
          visible: (f) => f.updateAction === 'period' },
      ];

      return {
        cfg, domCfg, state, logs, cfIsRunning, cfSuccessRate,
        cfTypeTotal, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog,
        EVENT_TYPES,
      };
    },

    template: `
<div>
  <div class="page-title">🎉 이벤트 시뮬레이터</div>
  <div style="display:grid;grid-template-columns:400px 1fr;gap:12px;align-items:start;">

    <div style="display:flex;flex-direction:column;gap:12px;">
      <!-- 실행 제어 (공통 컴포넌트) -->
      <zd-simul-control-panel
        :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
        :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
        accent-color="linear-gradient(90deg,#a21caf,#e879f9)"
        accent-active="background:#fdf4ff;border:1.5px solid #a21caf;color:#86198f;"
        @start="onStart" @stop="onStop" @run-once="onRunOnce" />

      <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;">
        <div class="list-title">🎉 이벤트 생성 옵션</div>
        <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="2" style="margin-top:10px;" />
        <div style="border-top:1px solid #f1f5f9;margin-top:12px;padding-top:12px;">
          <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">이벤트 유형 가중치</div>
          <div v-for="t in EVENT_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span :class="'badge '+t.badge" style="min-width:64px;text-align:center;font-size:10px;">{{ t.label }}</span>
            <input type="range" min="0" max="50" v-model.number="domCfg.eventTypeWeights[t.cd]" style="flex:1;accent-color:#a21caf;" />
            <input type="number" min="0" max="50" v-model.number="domCfg.eventTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
            <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.eventTypeWeights[t.cd]/cfTypeTotal*100) }}%</span>
          </div>
        </div>
      </div>

      <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;">
        <div class="list-title">✏ 이벤트 수정 옵션</div>
        <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="1" style="margin-top:10px;" />
      </div>
    </div>

    <!-- 우측: 로그 (공통 컴포넌트) -->
    <zd-simul-log-panel :logs="logs" :log-cols="logCols" @clear="onClearLog" />
  </div>
</div>`,
  };
})();

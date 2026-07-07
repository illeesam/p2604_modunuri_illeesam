/* ZdSimulEventMng — 이벤트 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed, ref } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

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
        /* 수정 모드 고정 대상 */
        fixedEventId: '',
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
        uiNm: '이벤트 시뮬레이터',
        label: '시뮬이벤트',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
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
            const res = await boApi.post('/bo/zd/simul/event/create', body, coUtil.cofApiHdr('이벤트시뮬', '생성'));
            const id  = res?.data?.data?.eventId || '-';
            return {
              ok: true,
              desc: '[' + type.label + '] ' + title + ' | 당첨자 최대 ' + body.winnerCount + '명',
              meta: { id, type: type.label, params: body },
            };
          } else {
            let target;
            if (domCfg.fixedEventId) {
              target = { eventId: domCfg.fixedEventId, eventNm: domCfg.fixedEventId, endDate: null };
            } else {
              const list = (await boApiSvc.pmEvent.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 이벤트 없음' };
              target = pick(list);
            }
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
            const updateBody = { eventId: target.eventId, ...body };
            await boApi.post('/bo/zd/simul/event/update', updateBody, coUtil.cofApiHdr('이벤트시뮬', '수정'));
            return { ok: true, desc: target.eventNm + ' — ' + desc, meta: { id: target.eventId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.eventTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'createStatus',   label: '초기 상태',   type: 'select', options: EVENT_STATUSES },
        { key: 'benefitType',    label: '혜택 유형',   type: 'select', options: BENEFIT_TYPES },
        makeRangeCol('benefitAmtMin', 'benefitAmtMax', '혜택 금액 범위', 1000, 50000, '원'),
        makeRangeCol('winnerCountMin', 'winnerCountMax', '당첨자 수 범위', 1, 200, '명'),
        makeRangeCol('startOffsetMin', 'startOffsetMax', '시작 오프셋 범위', 0, 30, '일'),
        makeRangeCol('durationDaysMin', 'durationDaysMax', '이벤트 기간 범위', 1, 60, '일'),
        { key: 'useRandomTitle', label: '제목 자동 생성', type: 'checkbox', checkedValue: true, uncheckedValue: false },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus', label: '변경 상태', type: 'select', options: EVENT_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'periodExtendDays', label: '연장 일수', type: 'number', hint: '일',
          visible: (f) => f.updateAction === 'period' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'benefitAmtMin',   maxKey: 'benefitAmtMax'   },
        { minKey: 'winnerCountMin',  maxKey: 'winnerCountMax'  },
        { minKey: 'startOffsetMin',  maxKey: 'startOffsetMax'  },
        { minKey: 'durationDaysMin', maxKey: 'durationDaysMax' },
      ]);

      /* ── [05] 이벤트 picker ──────────────────────────── */
      const eventPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const _loadEventPicker = async () => {
        eventPicker.loading = true;
        try {
          const res = await boApiSvc.pmEvent.getPage({
            pageNo: 1, pageSize: 20,
            ...(eventPicker.searchValue ? { searchValue: eventPicker.searchValue, searchType: 'eventId,eventNm' } : {}),
          });
          eventPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { eventPicker.rows = []; }
        eventPicker.loading = false;
      };
      const onOpenEventPicker = async () => {
        eventPicker.show = true;
        eventPicker.searchValue = '';
        await _loadEventPicker();
      };
      const onSelectEvent = (row) => {
        domCfg.fixedEventId = row.eventId;
        eventPicker.show = false;
      };

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        cfTypeTotal, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        EVENT_TYPES,
        eventPicker, onOpenEventPicker, onSelectEvent, _loadEventPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🎉 이벤트 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#a21caf,#e879f9)"
    accent-active="background:#fdf4ff;border:1.5px solid #a21caf;color:#86198f;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🎉 이벤트 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('benefitAmtMin','benefitAmtMax',1000,50000,'원')}
      ${rangeSlotTemplate('winnerCountMin','winnerCountMax',1,200,'명')}
      ${rangeSlotTemplate('startOffsetMin','startOffsetMax',0,30,'일')}
      ${rangeSlotTemplate('durationDaysMin','durationDaysMax',1,60,'일')}
    </bo-form-area>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 이벤트 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">🎯 수정 대상 지정 (미지정 시 랜덤)</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#64748b;min-width:64px;">이벤트</span>
        <input type="text" :value="domCfg.fixedEventId" readonly placeholder="미지정 (랜덤)"
          style="flex:1;padding:4px 8px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;background:#f8fafc;cursor:default;" />
        <button class="btn btn-sm" style="background:#a21caf;color:#fff;" @click="onOpenEventPicker">선택</button>
        <button v-if="domCfg.fixedEventId" class="btn btn-sm btn-secondary" @click="domCfg.fixedEventId=''">해제</button>
      </div>
    </div>
  </div>

  <!-- 이벤트 유형 가중치 (1/3 폭, 아래 줄) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 이벤트 유형 가중치</div>
      <div style="margin-top:10px;">
        <div v-for="t in EVENT_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span :class="'badge '+t.badge" style="min-width:64px;text-align:center;font-size:10px;">{{ t.label }}</span>
          <input type="range" min="0" max="50" v-model.number="domCfg.eventTypeWeights[t.cd]" style="flex:1;accent-color:#a21caf;" />
          <input type="number" min="0" max="50" v-model.number="domCfg.eventTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.eventTypeWeights[t.cd]/cfTypeTotal*100) }}%</span>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 이벤트 picker 모달 -->
  <bo-modal :show="eventPicker.show" title="이벤트 선택" width="700px" @close="eventPicker.show=false">
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <input type="text" v-model="eventPicker.searchValue" placeholder="이벤트ID/이벤트명 검색" class="form-control"
        style="flex:1;" @keyup.enter="_loadEventPicker" />
      <button class="btn btn-sm btn_search" @click="_loadEventPicker">조회</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>이벤트ID</th>
        <th>이벤트명</th>
        <th>유형</th>
        <th>상태</th>
        <th style="width:60px;"></th>
      </tr></thead>
      <tbody>
        <tr v-if="eventPicker.loading"><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8;">조회 중...</td></tr>
        <tr v-else-if="!eventPicker.rows.length"><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8;">조회 결과 없음</td></tr>
        <tr v-for="(row,idx) in eventPicker.rows" :key="row.eventId">
          <td style="text-align:center;">{{ idx+1 }}</td>
          <td style="font-family:monospace;font-size:11px;">{{ row.eventId }}</td>
          <td>{{ row.eventNm }}</td>
          <td>{{ row.eventTypeCd }}</td>
          <td>{{ row.eventStatusCd }}</td>
          <td><button class="btn btn-xs btn_select" @click="onSelectEvent(row)">선택</button></td>
        </tr>
      </tbody>
    </table>
  </bo-modal>
</div>`,
  };
})();

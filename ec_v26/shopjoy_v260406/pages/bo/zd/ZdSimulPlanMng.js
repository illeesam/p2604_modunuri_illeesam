/* ZdSimulPlanMng — 기획전 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const PLAN_STATUSES = [
    { value: 'READY',  label: '준비중' },
    { value: 'ACTIVE', label: '진행중' },
    { value: 'ENDED',  label: '종료'   },
    { value: 'PAUSE',  label: '일시정지' },
  ];
  const PLAN_THEMES   = [
    '봄 신상품 기획전', '여름 쿨링 기획전', '추석 선물 기획전', '겨울 방한 기획전',
    '블랙프라이데이 특가', '명품 브랜드 위크', '아웃도어 시즌 기획전', '홈인테리어 특집',
    '건강식품 모음전', '디지털 기기 행사', '패션 트렌드 기획전', '뷰티 페스타',
    '키즈 특별 기획전', '여행용품 모음전', '반려동물 용품전',
  ];
  const UPDATE_ACTIONS = [
    { value: 'status', label: '상태 변경' },
    { value: 'title',  label: '제목 변경' },
    { value: 'period', label: '기간 연장' },
    { value: 'prods',  label: '상품 추가' },
  ];

  window.ZdSimulPlanMng = {
    name: 'ZdSimulPlanMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        durationDaysMin: 3,
        durationDaysMax: 30,
        startOffsetDaysMin: 0,
        startOffsetDaysMax: 14,
        createStatus: 'READY',
        updateAction: 'status',
        updateStatus: 'ACTIVE',
        prodCountMin: 3,
        prodCountMax: 20,
        useTheme: true,
        addBanner: false,
        periodExtendDays: 7,
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _fmtDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19);
      const _makeDate = (offsetDays) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return _fmtDate(d); };

      const simul = useSimulSetup({
        domain: '기획전',
        label: '시뮬기획전',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const prods = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 100, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
            if (prods.length < 3) return { ok: false, reason: '판매중 상품 부족 (최소 3개 필요)' };
            const cnt    = randInt(domCfg.prodCountMin, Math.min(domCfg.prodCountMax, prods.length));
            const theme  = domCfg.useTheme ? pick(PLAN_THEMES) : '';
            const planNm = (namePrefix || '') + (theme || '기획전_' + String(Date.now()).slice(-4));
            const offset = randInt(domCfg.startOffsetDaysMin, domCfg.startOffsetDaysMax);
            const dur    = randInt(domCfg.durationDaysMin, domCfg.durationDaysMax);
            /* 랜덤 상품 선택 (중복 없이) */
            const shuffled = [...prods].sort(() => Math.random() - 0.5);
            const items    = shuffled.slice(0, cnt).map((p, i) => ({ prodId: p.prodId, sortOrd: i + 1 }));
            const body     = {
              planNm, planStatusCd: domCfg.createStatus,
              startDate: _makeDate(offset), endDate: _makeDate(offset + dur),
              items,
            };
            const res = await boApi.post('/bo/zd/simul/plan/create', body, coUtil.cofApiHdr('기획전시뮬', '생성'));
            const id  = res?.data?.data?.planId || '-';
            return {
              ok: true,
              desc: planNm + ' | ' + cnt + '개 상품 | ' + offset + '일 후 시작 ' + dur + '일',
              meta: { id, theme, cnt },
            };
          } else {
            const list = (await boApiSvc.pmPlan.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 기획전 없음' };
            const target  = pick(list);
            const action  = domCfg.updateAction;
            let body = {}, desc = '';
            if (action === 'status') {
              body.planStatusCd = domCfg.updateStatus; desc = '상태→' + domCfg.updateStatus;
            } else if (action === 'title') {
              body.planNm = target.planNm + ' [리뉴얼]'; desc = '제목 변경';
            } else if (action === 'period') {
              const curEnd = target.endDate ? new Date(target.endDate) : new Date();
              curEnd.setDate(curEnd.getDate() + domCfg.periodExtendDays);
              body.endDate = _fmtDate(curEnd);
              desc = '종료일 ' + domCfg.periodExtendDays + '일 연장';
            } else {
              const prods = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 50, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
              if (prods.length) { body.addProdIds = [pick(prods).prodId]; desc = '상품 1개 추가'; }
              else return { ok: false, reason: '추가할 상품 없음' };
            }
            await boApi.post('/bo/zd/simul/plan/update', { planId: target.planId, ...body }, coUtil.cofApiHdr('기획전시뮬', '수정'));
            return { ok: true, desc: target.planNm + ' — ' + desc, meta: { id: target.planId } };
          }
        },
      });
      const { cfg, state, logs, logPager, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog, onSetLogPage } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'createStatus',       label: '초기 상태',      type: 'select', options: PLAN_STATUSES },
        { key: 'useTheme',           label: '테마명 자동',    type: 'checkbox', checkedValue: true, uncheckedValue: false },
        makeRangeCol('prodCountMin', 'prodCountMax', '상품 수 범위', 1, 50, '개'),
        makeRangeCol('startOffsetDaysMin', 'startOffsetDaysMax', '시작 오프셋 범위', 0, 30, '일'),
        makeRangeCol('durationDaysMin', 'durationDaysMax', '기간 범위', 1, 60, '일'),
        { key: 'addBanner',          label: '배너 이미지 URL 자동 생성', type: 'checkbox', checkedValue: true, uncheckedValue: false },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus', label: '변경 상태', type: 'select', options: PLAN_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'periodExtendDays', label: '연장 일수', type: 'number', hint: '일',
          visible: (f) => f.updateAction === 'period' },
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'prodCountMin',       maxKey: 'prodCountMax'       },
        { minKey: 'startOffsetDaysMin', maxKey: 'startOffsetDaysMax' },
        { minKey: 'durationDaysMin',    maxKey: 'durationDaysMax'    },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage,
        ...rangeHandlers,
        PLAN_STATUSES,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🗂 기획전 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#d97706,#fbbf24)"
    accent-active="background:#fff7ed;border:1.5px solid #d97706;color:#92400e;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🗂 기획전 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('prodCountMin','prodCountMax',1,50,'개')}
      ${rangeSlotTemplate('startOffsetDaysMin','startOffsetDaysMax',0,30,'일')}
      ${rangeSlotTemplate('durationDaysMin','durationDaysMax',1,60,'일')}
    </bo-form-area>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 기획전 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />
</div>`,
  };
})();

/* ZdSimulPlanMng — 기획전 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, ref, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

  const PLAN_STATUSES = [
    { value: 'READY',  label: '준비중' },
    { value: 'ACTIVE', label: '진행중' },
    { value: 'ENDED',  label: '종료'   },
    { value: 'PAUSE',  label: '일시정지' },
  ];
  /* 기획전 유형 (코드: PLAN_TYPE — plan_type_cd) */
  const PLAN_TYPE_ITEMS = [
    { cd: 'SPRING_NEW',   label: '봄 신상품 기획전',    w: 10 },
    { cd: 'SUMMER_COOL',  label: '여름 쿨링 기획전',    w: 10 },
    { cd: 'CHUSEOK',      label: '추석 선물 기획전',    w: 10 },
    { cd: 'WINTER_WARM',  label: '겨울 방한 기획전',    w: 10 },
    { cd: 'BLACK_FRI',    label: '블랙프라이데이 특가', w: 8  },
    { cd: 'LUXURY_BRAND', label: '명품 브랜드 위크',    w: 5  },
    { cd: 'OUTDOOR',      label: '아웃도어 시즌 기획전',w: 7  },
    { cd: 'HOME_DECOR',   label: '홈인테리어 특집',     w: 7  },
    { cd: 'HEALTH_FOOD',  label: '건강식품 모음전',     w: 8  },
    { cd: 'DIGITAL',      label: '디지털 기기 행사',    w: 5  },
    { cd: 'FASHION',      label: '패션 트렌드 기획전',  w: 8  },
    { cd: 'BEAUTY',       label: '뷰티 페스타',         w: 7  },
    { cd: 'KIDS',         label: '키즈 특별 기획전',    w: 5  },
    { cd: 'TRAVEL',       label: '여행용품 모음전',     w: 5  },
    { cd: 'PET',          label: '반려동물 용품전',     w: 5  },
    { cd: 'CHILDREN_DAY', label: '어린이날 기획전',     w: 5  },
    { cd: 'CHRISTMAS',    label: '성탄절 특별전',       w: 7  },
    { cd: 'NEW_YEAR',     label: '새해맞이 기획전',     w: 7  },
    { cd: 'ZOMBIE_DAY',   label: '좀비의날 특가전',     w: 3  },
    { cd: 'DISABILITY',   label: '장애인의날 기획전',   w: 3  },
    { cd: 'HALLOWEEN',    label: '할로윈 기획전',       w: 5  },
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
        usePlanType: true,
        addBanner: false,
        periodExtendDays: 7,
        fixedPlanType: '__weighted__',
        planTypeWeights: Object.fromEntries(PLAN_TYPE_ITEMS.map(t => [t.cd, t.w])),
        /* 수정 모드 고정 대상 */
        fixedPlanId: '',
        fixedPlanNm: '',
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickPlanType = () => {
        if (domCfg.fixedPlanType && domCfg.fixedPlanType !== '__weighted__') {
          return PLAN_TYPE_ITEMS.find(t => t.cd === domCfg.fixedPlanType) || PLAN_TYPE_ITEMS[0];
        }
        const w = domCfg.planTypeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of PLAN_TYPE_ITEMS) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return PLAN_TYPE_ITEMS[0];
      };
      const _fmtDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19);
      const _makeDate = (offsetDays) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return _fmtDate(d); };

      const simul = useSimulSetup({
        domain: '기획전',
        uiNm: '기획전 시뮬레이터',
        label: '시뮬기획전',
        showToast: props.showToast,
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, simulYn, randInt, pick }) => {
          if (mode === 'create') {
            const prods = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 100, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
            if (prods.length < 3) return { ok: false, reason: '판매중 상품 부족 (최소 3개 필요)' };
            const cnt    = randInt(domCfg.prodCountMin, Math.min(domCfg.prodCountMax, prods.length));
            const theme  = domCfg.usePlanType ? _pickPlanType() : null;
            const planNm = (namePrefix || '') + (theme ? theme.label : '기획전_' + String(Date.now()).slice(-4));
            const offset = randInt(domCfg.startOffsetDaysMin, domCfg.startOffsetDaysMax);
            const dur    = randInt(domCfg.durationDaysMin, domCfg.durationDaysMax);
            /* 랜덤 상품 선택 (중복 없이) */
            const shuffled = [...prods].sort(() => Math.random() - 0.5);
            const items    = shuffled.slice(0, cnt).map((p, i) => ({ prodId: p.prodId, sortOrd: i + 1 }));
            const body     = {
              planNm, planStatusCd: domCfg.createStatus,
              planThemeCd: theme ? theme.cd : null,
              startDate: _makeDate(offset), endDate: _makeDate(offset + dur),
              items,
              simulYn: simulYn || 'Y',
            };
            body['_preview_[items](' + items.length + '개)'] = items.map(it => ({
              prodId: it.prodId, sortOrd: it.sortOrd,
            }));
            const res = await boApi.post('/bo/zd/simul/plan/create', body, coUtil.cofApiHdr('기획전시뮬', '생성'));
            const id  = res?.data?.data?.planId || '-';
            return {
              ok: true,
              desc: planNm + ' | ' + cnt + '개 상품 | ' + offset + '일 후 시작 ' + dur + '일',
              meta: { id, theme: theme ? theme.cd : null, cnt, params: body },
            };
          } else {
            let target;
            if (domCfg.fixedPlanId) {
              target = { planId: domCfg.fixedPlanId, planNm: domCfg.fixedPlanNm || domCfg.fixedPlanId, endDate: null };
            } else {
              const list = (await boApiSvc.pmPlan.getPage({ pageNo: 1, pageSize: 30 })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 기획전 없음' };
              target = pick(list);
            }
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
            const updateBody = { planId: target.planId, ...body };
            await boApi.post('/bo/zd/simul/plan/update', updateBody, coUtil.cofApiHdr('기획전시뮬', '수정'));
            return { ok: true, desc: target.planNm + ' — ' + desc, meta: { id: target.planId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'createStatus',       label: '초기 상태',      type: 'select', options: PLAN_STATUSES },
        { key: 'usePlanType',        label: '유형명 자동',    type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        makeRangeCol('prodCountMin', 'prodCountMax', '상품 수 범위', 1, 50, '개'),
        makeRangeCol('startOffsetDaysMin', 'startOffsetDaysMax', '시작 오프셋 범위', 0, 30, '일'),
        makeRangeCol('durationDaysMin', 'durationDaysMax', '기간 범위', 1, 60, '일'),
        { key: 'addBanner',          label: '배너 이미지 URL 자동 생성', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
      ];
      const updateCfgColumns = [
        { key: 'updateAction', label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus', label: '변경 상태', type: 'select', options: PLAN_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'periodExtendDays', label: '연장 일수', type: 'number', hint: '일',
          visible: (f) => f.updateAction === 'period' },
      ];

      const cfPlanTypeTotal = computed(() => Object.values(domCfg.planTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'prodCountMin',       maxKey: 'prodCountMax'       },
        { minKey: 'startOffsetDaysMin', maxKey: 'startOffsetDaysMax' },
        { minKey: 'durationDaysMin',    maxKey: 'durationDaysMax'    },
      ]);

      /* ── [05] 기획전 picker ──────────────────────────── */
      const planPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const _loadPlanPicker = async () => {
        planPicker.loading = true;
        try {
          const res = await boApiSvc.pmPlan.getPage({
            pageNo: 1, pageSize: 20,
            ...(planPicker.searchValue ? { searchValue: planPicker.searchValue, searchType: 'planId,planNm' } : {}),
          });
          planPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { planPicker.rows = []; }
        planPicker.loading = false;
      };
      const onOpenPlanPicker = async () => {
        planPicker.show = true;
        planPicker.searchValue = '';
        await _loadPlanPicker();
      };
      const onSelectPlan = (row) => {
        domCfg.fixedPlanId = row.planId;
        domCfg.fixedPlanNm = row.planNm || '';
        planPicker.show = false;
      };

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog, logSearch,
        ...rangeHandlers,
        PLAN_STATUSES, PLAN_TYPE_ITEMS, cfPlanTypeTotal,
        planPicker, onOpenPlanPicker, onSelectPlan, _loadPlanPicker,
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
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🗂 기획전 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('prodCountMin','prodCountMax',1,50,'개')}
      ${rangeSlotTemplate('startOffsetDaysMin','startOffsetDaysMax',0,30,'일')}
      ${rangeSlotTemplate('durationDaysMin','durationDaysMax',1,60,'일')}
    </bo-form-area>
  </div>

  <!-- 기획전 유형 가중치 (1/3 폭, 아래 줄) -->
  <div v-if="cfg.mode==='create' && domCfg.usePlanType" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 기획전 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">유형 지정</label>
        <select v-model="domCfg.fixedPlanType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in PLAN_TYPE_ITEMS" :key="t.cd" :value="t.cd">{{ t.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedPlanType === '__weighted__'">
        <div v-for="(t, ti) in PLAN_TYPE_ITEMS" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:hsl('+(ti*17)+',65%,52%);flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:10px;color:#475569;min-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" :title="t.label">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.planTypeWeights[t.cd]" :style="'flex:1;accent-color:hsl('+(ti*17)+',65%,52%);'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.planTypeWeights[t.cd]" style="width:36px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.planTypeWeights[t.cd]/cfPlanTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="(t, ti) in PLAN_TYPE_ITEMS" :key="t.cd" :style="'flex:'+domCfg.planTypeWeights[t.cd]+';transition:flex .2s;background:hsl('+(ti*17)+',65%,52%)'"></div>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 기획전 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">🎯 수정 대상 지정 (미지정 시 랜덤)</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:#64748b;min-width:64px;">기획전</span>
        <input type="text" :value="domCfg.fixedPlanNm || domCfg.fixedPlanId" readonly placeholder="미지정 (랜덤)"
          style="flex:1;padding:4px 8px;border:1px solid #e2e8f0;border-radius:4px;font-size:12px;background:#f8fafc;cursor:default;" />
        <button class="btn btn-sm" style="background:#d97706;color:#fff;" @click="onOpenPlanPicker">선택</button>
        <button v-if="domCfg.fixedPlanId" class="btn btn-sm btn-secondary" @click="domCfg.fixedPlanId='';domCfg.fixedPlanNm=''">해제</button>
      </div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 기획전 picker 모달 -->
  <bo-modal :show="planPicker.show" title="기획전 선택" width="700px" @close="planPicker.show=false">
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <input type="text" v-model="planPicker.searchValue" placeholder="기획전ID/기획전명 검색" class="form-control"
        style="flex:1;" @keyup.enter="_loadPlanPicker" />
      <button class="btn btn-sm btn_search" @click="_loadPlanPicker">조회</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th>기획전ID</th>
        <th>기획전명</th>
        <th>상태</th>
        <th>시작일</th>
        <th>종료일</th>
        <th style="width:60px;"></th>
      </tr></thead>
      <tbody>
        <tr v-if="planPicker.loading"><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">조회 중...</td></tr>
        <tr v-else-if="!planPicker.rows.length"><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">조회 결과 없음</td></tr>
        <tr v-for="(row,idx) in planPicker.rows" :key="row.planId">
          <td style="text-align:center;">{{ idx+1 }}</td>
          <td style="font-family:monospace;font-size:11px;">{{ row.planId }}</td>
          <td>{{ row.planNm }}</td>
          <td>{{ row.planStatusCd }}</td>
          <td>{{ row.startDate }}</td>
          <td>{{ row.endDate }}</td>
          <td><button class="btn btn-xs btn_select" @click="onSelectPlan(row)">선택</button></td>
        </tr>
      </tbody>
    </table>
  </bo-modal>
</div>`,
  };
})();

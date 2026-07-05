/* ZdSimulComps — 시뮬레이터 공통 컴포넌트 (실행 제어 패널 + 로그 패널) */
(function () {
  const { computed } = Vue;

  /* ─────────────────────────────────────────────────────────────────────
     ZdSimulControlPanel
     실행 제어 카드 공통 컴포넌트.
     - 작업 유형 토글 (생성 / 수정)
     - bo-form-area 기본 설정 (countMin/Max, interval, duration)
     - ▶ 시작 / ⏹ 정지 / ⚡ 1회 버튼
     - 진행 바 (실행 중일 때)
     - 통계 미니 카드 (총실행 / 성공 / 실패)
     - 성공률 바
     - default slot : 수정 옵션 등 도메인별 추가 영역 (버튼 바로 아래, 통계 위)
     Props:
       cfg          (Object)  — useSimulSetup 반환 cfg reactive
       state        (Object)  — useSimulSetup 반환 state reactive
       baseCfgColumns (Array) — makeBaseCfgColumns() 결과
       cfIsRunning  (Boolean)
       cfSuccessRate (Number) — 0~100
       accentColor  (String)  — 진행바 gradient 색 (기본 #3b82f6,#60a5fa)
       accentActive (String)  — 선택 토글 border/bg 인라인 스타일 일부 (기본 파랑)
     Emits: start, stop, run-once
  ─────────────────────────────────────────────────────────────────────── */
  window.ZdSimulControlPanel = {
    name: 'ZdSimulControlPanel',
    emits: ['start', 'stop', 'run-once'],
    props: {
      cfg:            { type: Object,  required: true },
      state:          { type: Object,  required: true },
      baseCfgColumns: { type: Array,   required: true },
      cfIsRunning:    { type: Boolean, default: false },
      cfSuccessRate:  { type: Number,  default: 0 },
      accentColor:    { type: String,  default: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
      accentActive:   { type: String,  default: 'background:#eff6ff;border:1.5px solid #2563eb;color:#1d4ed8;' },
    },
    setup(props, { emit }) {
      const cfHasStats = computed(() => props.state.totalRun > 0 || props.cfIsRunning);
      const onStart   = () => emit('start');
      const onStop    = () => emit('stop');
      const onRunOnce = () => emit('run-once');

      /* 프리셋 목록 — label / intervalVal / intervalUnit / countMin / countMax / durationMin */
      const PRESETS = [
        { label: '-- 프리셋 선택 --',   intervalVal: null },
        { label: '빠른 테스트  (5초·1건·1분)',   intervalVal: 5,   intervalUnit: 'sec', countMin: 1, countMax: 1,  durationMin: 1  },
        { label: '기본 (20초·1~2건·3분)',        intervalVal: 20,  intervalUnit: 'sec', countMin: 1, countMax: 2,  durationMin: 3  },
        { label: '소량 지속 (30초·1건·10분)',    intervalVal: 30,  intervalUnit: 'sec', countMin: 1, countMax: 1,  durationMin: 10 },
        { label: '중량 (30초·3~5건·10분)',       intervalVal: 30,  intervalUnit: 'sec', countMin: 3, countMax: 5,  durationMin: 10 },
        { label: '대량 단시간 (10초·5~10건·3분)',intervalVal: 10,  intervalUnit: 'sec', countMin: 5, countMax: 10, durationMin: 3  },
        { label: '분단위 소량 (1분·1~3건·30분)', intervalVal: 1,   intervalUnit: 'min', countMin: 1, countMax: 3,  durationMin: 30 },
        { label: '분단위 중량 (1분·5~10건·30분)',intervalVal: 1,   intervalUnit: 'min', countMin: 5, countMax: 10, durationMin: 30 },
        { label: '장기 소량 (2분·1건·60분)',     intervalVal: 2,   intervalUnit: 'min', countMin: 1, countMax: 1,  durationMin: 60 },
        { label: '스트레스 (5초·10~20건·5분)',   intervalVal: 5,   intervalUnit: 'sec', countMin: 10,countMax: 20, durationMin: 5  },
        { label: '무제한 (30초·1~3건)',          intervalVal: 30,  intervalUnit: 'sec', countMin: 1, countMax: 3,  durationMin: 0  },
      ];

      const onPreset = (e) => {
        const idx = Number(e.target.value);
        if (!idx) return;
        const p = PRESETS[idx];
        if (!p || p.intervalVal === null) return;
        const c = props.cfg;
        c.intervalVal  = p.intervalVal;
        c.intervalUnit = p.intervalUnit;
        c.countMin     = p.countMin;
        c.countMax     = p.countMax;
        c.durationMin  = p.durationMin;
        e.target.value = '0'; // 선택 후 초기화 (항상 placeholder로)
      };

      return { cfHasStats, onStart, onStop, onRunOnce, PRESETS, onPreset };
    },
    template: `
<div class="card" style="padding:10px 14px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <!-- 프리셋 select (맨 왼쪽) -->
    <select :disabled="cfIsRunning" @change="onPreset"
      style="font-size:11px;padding:3px 8px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#475569;height:26px;cursor:pointer;max-width:220px;">
      <option value="0">⚡ 프리셋</option>
      <option v-for="(p,i) in PRESETS.slice(1)" :key="i" :value="i+1">{{ p.label }}</option>
    </select>

    <div class="list-title" style="margin:0;">⚙ 실행 제어</div>

    <!-- 작업 유형 토글 (인라인) -->
    <div style="display:flex;gap:6px;">
      <label v-for="opt in [{value:'create',label:'+ 생성'},{value:'update',label:'— 수정'}]" :key="opt.value"
        :style="'cursor:pointer;padding:3px 10px;border-radius:5px;font-size:12px;font-weight:500;transition:all .15s;' + (cfg.mode===opt.value ? accentActive : 'background:#f8fafc;border:1.5px solid #e2e8f0;color:#64748b;')">
        <input type="radio" :value="opt.value" v-model="cfg.mode" style="display:none;">{{ opt.label }}
      </label>
    </div>

    <!-- 실행 주기 인라인 select (시작 버튼 왼쪽) -->
    <div style="margin-left:auto;display:flex;align-items:center;gap:5px;">
      <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">🕐</span>
      <select v-model.number="cfg.intervalVal" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option v-for="v in [5,10,15,20,30,60,120,300]" :key="v" :value="v">{{ v }}</option>
      </select>
      <select v-model="cfg.intervalUnit" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option value="sec">초</option>
        <option value="min">분</option>
      </select>
      <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">마다</span>
      <select v-model.number="cfg.countMin" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option v-for="v in [1,2,3,5,10,20]" :key="v" :value="v">{{ v }}</option>
      </select>
      <span style="font-size:11px;color:#94a3b8;">~</span>
      <select v-model.number="cfg.countMax" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option v-for="v in [1,2,3,5,10,20]" :key="v" :value="v">{{ v }}</option>
      </select>
      <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">건 ·</span>
      <select v-model.number="cfg.durationMin" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 5px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option :value="0">무제한</option>
        <option v-for="v in [1,3,5,10,30,60]" :key="v" :value="v">{{ v }}분</option>
      </select>
      <!-- 실행 버튼 -->
      <button v-if="!cfIsRunning" class="btn btn_search" style="padding:3px 14px;font-size:12px;margin-left:4px;" @click="onStart">▶ 시작</button>
      <button v-else class="btn btn_delete" style="padding:3px 14px;font-size:12px;margin-left:4px;" @click="onStop">⏹ 정지</button>
      <button class="btn btn_preview" style="padding:3px 9px;font-size:12px;" @click="onRunOnce">⚡ 1회</button>
    </div>
  </div>

  <!-- 공통 설정 폼 — Prefix / addSuffix 만 (주기·건수·시간은 헤더 select로 이동) -->
  <div class="bo-form-compact">
    <bo-form-area :columns="baseCfgColumns.filter(c => ['namePrefix','addSuffix'].includes(c.key))"
      :form="cfg" :show-actions="false" :cols="3" />
  </div>

  <!-- 도메인별 추가 영역 (슬롯) -->
  <slot />

  <!-- 통계 섹션 (실행 이력이 있을 때만) -->
  <div v-if="cfHasStats" style="border-top:1px solid #f1f5f9;padding-top:8px;margin-top:8px;display:flex;align-items:center;gap:10px;">
    <!-- 진행 바 -->
    <div v-if="cfIsRunning" style="flex:1;">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:3px;">
        <span>{{ state.progress }}% 진행</span><span>{{ state.remainSec }}초 남음</span>
      </div>
      <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
        <div :style="'height:100%;border-radius:3px;transition:width .3s;width:'+state.progress+'%;background:'+accentColor"></div>
      </div>
    </div>

    <!-- 통계 미니 (가로 한 줄) -->
    <div style="display:flex;gap:6px;align-items:center;">
      <div style="display:flex;align-items:center;gap:4px;background:#f8fafc;border-radius:6px;padding:4px 10px;">
        <span style="font-size:15px;font-weight:700;color:#334155;">{{ state.totalRun }}</span>
        <span style="font-size:10px;color:#94a3b8;">실행</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;background:#f0fdf4;border-radius:6px;padding:4px 10px;">
        <span style="font-size:15px;font-weight:700;color:#16a34a;">{{ state.totalOk }}</span>
        <span style="font-size:10px;color:#86efac;">성공</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;background:#fef2f2;border-radius:6px;padding:4px 10px;">
        <span style="font-size:15px;font-weight:700;color:#dc2626;">{{ state.totalFail }}</span>
        <span style="font-size:10px;color:#fca5a5;">실패</span>
      </div>
      <div v-if="state.totalRun > 0" style="width:80px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:2px;">
          <span>성공률</span><span>{{ cfSuccessRate }}%</span>
        </div>
        <div style="height:4px;background:#fee2e2;border-radius:2px;overflow:hidden;">
          <div :style="'height:100%;background:#22c55e;border-radius:2px;width:'+cfSuccessRate+'%'"></div>
        </div>
      </div>
    </div>

    <!-- 마지막 생성 정보 -->
    <div v-if="state.lastCreated && !cfIsRunning" style="font-size:10px;color:#94a3b8;white-space:nowrap;">
      최근: {{ state.lastCreated }}
    </div>
  </div>
</div>`,
  };


  /* ─────────────────────────────────────────────────────────────────────
     ZdSimulLogPanel
     로그 패널 공통 컴포넌트.
     - 헤더: "📋 실행 로그" + 건수 배지 + 지우기 버튼
     - 빈 상태 일러스트
     - bo-grid (logCols 기반)
     Props:
       logs       (Array)   — useSimulSetup 반환 logs ref
       logCols    (Array)   — makeLogCols() 결과
       maxHeight  (String)  — bo-grid tableMaxHeight (기본 'calc(100vh - 260px)')
     Emits: clear
  ─────────────────────────────────────────────────────────────────────── */
  window.ZdSimulLogPanel = {
    name: 'ZdSimulLogPanel',
    emits: ['clear'],
    props: {
      logs:      { type: Array,  required: true },
      logCols:   { type: Array,  required: true },
      maxHeight: { type: String, default: 'calc(100vh - 260px)' },
    },
    setup(props, { emit }) {
      const onClear = () => emit('clear');
      return { onClear };
    },
    template: `
<div class="card" style="padding:14px 16px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <div class="list-title">📋 실행 로그
      <span v-if="logs.length" class="list-count">{{ logs.length }}건</span>
    </div>
    <button v-if="logs.length" class="btn btn_reset" @click="onClear">지우기</button>
  </div>

  <div v-if="logs.length === 0" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#cbd5e1;border:1px solid #f1f5f9;border-radius:6px;">
    <div style="font-size:40px;margin-bottom:10px;">🔇</div>
    <div style="font-size:13px;margin-bottom:4px;">아직 실행 이력이 없습니다.</div>
    <div style="font-size:11px;color:#94a3b8;">▶ 시작 또는 ⚡ 1회 실행을 눌러주세요.</div>
  </div>

  <bo-grid v-else :rows="logs" :columns="logCols" :table-max-height="maxHeight" style="font-size:11px;" />
</div>`,
  };

})();

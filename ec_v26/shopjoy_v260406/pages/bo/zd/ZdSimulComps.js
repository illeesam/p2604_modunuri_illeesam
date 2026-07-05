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
      return { cfHasStats, onStart, onStop, onRunOnce };
    },
    template: `
<div class="card" style="padding:14px 16px;">
  <div class="list-title">⚙ 실행 제어</div>
  <div style="margin-top:10px;">
    <!-- 작업 유형 토글 -->
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <label v-for="opt in [{value:'create',label:'➕ 생성'},{value:'update',label:'✏ 수정'}]" :key="opt.value"
        :style="'display:flex;align-items:center;gap:5px;cursor:pointer;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;transition:all .15s;' + (cfg.mode===opt.value ? accentActive : 'background:#f8fafc;border:1.5px solid #e2e8f0;color:#64748b;')">
        <input type="radio" :value="opt.value" v-model="cfg.mode" style="display:none;">{{ opt.label }}
      </label>
    </div>

    <!-- 공통 설정 폼 -->
    <bo-form-area :columns="baseCfgColumns" :form="cfg" :show-actions="false" :cols="2" />

    <!-- 실행 버튼 -->
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button v-if="!cfIsRunning" class="btn btn_search" style="flex:1;" @click="onStart">▶ 시작</button>
      <button v-else class="btn btn_delete" style="flex:1;" @click="onStop">⏹ 정지</button>
      <button class="btn btn_preview" @click="onRunOnce">⚡ 1회</button>
    </div>

    <!-- 도메인별 추가 영역 (슬롯) -->
    <slot />
  </div>

  <!-- 통계 섹션 (실행 이력이 있을 때만) -->
  <div v-if="cfHasStats" style="border-top:1px solid #f1f5f9;padding-top:12px;margin-top:12px;">
    <!-- 진행 바 -->
    <div v-if="cfIsRunning" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px;">
        <span>{{ state.progress }}% 진행</span><span>{{ state.remainSec }}초 남음</span>
      </div>
      <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
        <div :style="'height:100%;border-radius:4px;transition:width .3s;width:'+state.progress+'%;background:'+accentColor"></div>
      </div>
    </div>

    <!-- 통계 미니 카드 -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;">
      <div style="background:#f8fafc;border-radius:8px;padding:8px 4px;">
        <div style="font-size:20px;font-weight:700;color:#334155;">{{ state.totalRun }}</div>
        <div style="font-size:10px;color:#94a3b8;">총 실행</div>
      </div>
      <div style="background:#f0fdf4;border-radius:8px;padding:8px 4px;">
        <div style="font-size:20px;font-weight:700;color:#16a34a;">{{ state.totalOk }}</div>
        <div style="font-size:10px;color:#86efac;">성공</div>
      </div>
      <div style="background:#fef2f2;border-radius:8px;padding:8px 4px;">
        <div style="font-size:20px;font-weight:700;color:#dc2626;">{{ state.totalFail }}</div>
        <div style="font-size:10px;color:#fca5a5;">실패</div>
      </div>
    </div>

    <!-- 성공률 바 -->
    <div v-if="state.totalRun > 0" style="margin-top:8px;">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:3px;">
        <span>성공률</span><span>{{ cfSuccessRate }}%</span>
      </div>
      <div style="height:4px;background:#fee2e2;border-radius:2px;overflow:hidden;">
        <div :style="'height:100%;background:#22c55e;border-radius:2px;width:'+cfSuccessRate+'%'"></div>
      </div>
    </div>

    <!-- 마지막 생성 정보 -->
    <div v-if="state.lastCreated" style="margin-top:8px;font-size:10px;color:#94a3b8;text-align:right;">
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

/* ZdSimulBase — 시뮬레이션 공통 엔진 v3 (window.ZdSimulBase)
 * bo-form-area / bo-grid 최대 활용 버전
 */
(function () {
  const { ref, reactive, computed, onBeforeUnmount } = Vue;

  /* ── 공통 유틸 ──────────────────────────────────────────── */
  const _nowSuffix = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return String(d.getFullYear()).slice(2) + p(d.getMonth()+1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  };
  const _randInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const _randF    = (min, max, dec) => parseFloat((Math.random() * (max - min) + min).toFixed(dec || 0));
  const _pick     = (arr) => arr[_randInt(0, arr.length - 1)];
  const _wonFmt   = (n) => Number(n).toLocaleString('ko-KR') + '원';
  const _ts       = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
  };
  const _shortTs  = () => new Date().toLocaleTimeString('ko-KR');

  /* ── 세션 공유 로그 저장소 ────────────────────────────────── */
  if (!window._zdSimulLogs)   window._zdSimulLogs   = [];
  if (!window._zdSimulStats)  window._zdSimulStats   = {};

  const _addLog = (domain, mode, status, desc, reason, meta) => {
    const entry = { ts: _ts(), domain, mode, status, desc, reason: reason || '', meta: meta || {} };
    window._zdSimulLogs.unshift(entry);
    if (window._zdSimulLogs.length > 1000) window._zdSimulLogs.splice(800);
    if (!window._zdSimulStats[domain]) window._zdSimulStats[domain] = { ok: 0, fail: 0, total: 0 };
    window._zdSimulStats[domain].total++;
    if (status === '성공') window._zdSimulStats[domain].ok++;
    else window._zdSimulStats[domain].fail++;
  };

  /* ── 공통 setup 팩토리 ───────────────────────────────────── */
  const useSimulSetup = (opts) => {
    const { domain, label, runFn, defaultCfg } = opts;

    /* [01] 기본 + 도메인 확장 설정 */
    const cfg = reactive(Object.assign({
      mode: 'create',
      countMin: 1,
      countMax: 3,
      namePrefix: 'simul',
      addSuffix: true,
      intervalUnit: 'sec',
      intervalVal: 10,
      durationMin: 5,
    }, defaultCfg || {}));

    /* [02] 실행 상태 */
    const state = reactive({
      running: false,
      totalRun: 0,
      totalOk: 0,
      totalFail: 0,
      progress: 0,
      startedAt: null,
      remainSec: 0,
      lastCreated: [],
    });

    const logs = ref([]);

    /* [03] computed */
    const cfIntervalMs   = computed(() => {
      const v = Number(cfg.intervalVal) || 10;
      if (cfg.intervalUnit === 'min') return v * 60000;
      if (cfg.intervalUnit === 'hr')  return v * 3600000;
      return v * 1000;
    });
    const cfDurationMs   = computed(() => (Number(cfg.durationMin) || 5) * 60000);
    const cfIsRunning    = computed(() => state.running);
    const cfSuccessRate  = computed(() => state.totalRun ? Math.round(state.totalOk / state.totalRun * 100) : 0);

    /* [04] 타이머 */
    let _tickTimer = null, _stopTimer = null, _countdownTimer = null;
    const _clearTimers = () => {
      clearTimeout(_tickTimer); clearTimeout(_stopTimer); clearInterval(_countdownTimer);
      _tickTimer = _stopTimer = _countdownTimer = null;
    };

    /* [05] 단일 틱 */
    const _doOneTick = async () => {
      if (!state.running && state.startedAt) return;
      const count = _randInt(Math.max(1, Number(cfg.countMin) || 1), Math.max(1, Number(cfg.countMax) || 1));
      const created = [];
      for (let i = 0; i < count; i++) {
        const suffix = cfg.addSuffix ? '_' + _nowSuffix() : '';
        try {
          const res    = await runFn({ ...cfg, suffix, randInt: _randInt, randF: _randF, pick: _pick, wonFmt: _wonFmt, index: i });
          const ok     = res?.ok !== false;
          const desc   = res?.desc || (ok ? '성공' : '실패');
          const reason = res?.reason || '';
          const meta   = res?.meta   || {};
          state.totalRun++;
          if (ok) state.totalOk++; else state.totalFail++;
          const entry = { ts: _shortTs(), mode: cfg.mode === 'create' ? '생성' : '수정', status: ok ? 'ok' : 'fail', desc, reason, meta };
          logs.value.unshift(entry);
          if (logs.value.length > 300) logs.value.splice(250);
          _addLog(domain, entry.mode, ok ? '성공' : '실패', desc, reason, meta);
          if (ok && meta.id) created.push(meta);
        } catch (e) {
          state.totalRun++; state.totalFail++;
          const reason = e?.response?.data?.message || e?.message || String(e);
          const entry  = { ts: _shortTs(), mode: cfg.mode === 'create' ? '생성' : '수정', status: 'fail', desc: '오류 발생', reason, meta: {} };
          logs.value.unshift(entry);
          _addLog(domain, entry.mode, '실패', '오류 발생', reason, {});
        }
      }
      state.lastCreated = created;
      if (state.running) _tickTimer = setTimeout(_doOneTick, cfIntervalMs.value);
    };

    /* [06] 제어 */
    const onStart = () => {
      if (state.running) return;
      state.running = true;
      state.startedAt = Date.now();
      state.totalRun = state.totalOk = state.totalFail = 0;
      state.progress = 0;
      state.remainSec = Math.floor(cfDurationMs.value / 1000);
      state.lastCreated = [];
      logs.value = [];
      _doOneTick();
      _stopTimer = setTimeout(() => { state.running = false; state.progress = 100; _clearTimers(); }, cfDurationMs.value);
      _countdownTimer = setInterval(() => {
        if (!state.running) return;
        const elapsed   = Date.now() - state.startedAt;
        state.progress  = Math.min(100, Math.round(elapsed / cfDurationMs.value * 100));
        state.remainSec = Math.max(0, Math.floor((cfDurationMs.value - elapsed) / 1000));
      }, 300);
    };
    const onStop     = () => { state.running = false; _clearTimers(); };
    const onRunOnce  = async () => {
      const wasStopped = !state.running;
      if (wasStopped) { state.startedAt = Date.now(); state.running = true; }
      await _doOneTick();
      if (wasStopped) state.running = false;
    };
    const onClearLog    = () => { logs.value = []; state.lastCreated = []; };
    const onResetStats  = () => { state.totalRun = state.totalOk = state.totalFail = 0; };

    onBeforeUnmount(() => { state.running = false; _clearTimers(); });

    return { cfg, state, logs, cfIsRunning, cfIntervalMs, cfDurationMs, cfSuccessRate,
             onStart, onStop, onRunOnce, onClearLog, onResetStats,
             _randInt, _randF, _pick, _wonFmt, _nowSuffix };
  };

  /* ── BoFormArea 컬럼 헬퍼 ───────────────────────────────── */
  /* 공통 설정 컬럼 (bo-form-area용) */
  const baseCfgColumns = (opts) => {
    const UNIT_OPTS = [
      { value: 'sec', label: '초' },
      { value: 'min', label: '분' },
      { value: 'hr',  label: '시간' },
    ];
    const cols = [
      { key: 'mode', label: '작업 유형', type: 'slot', name: 'modeRadio', colSpan: 3 },
      { key: '_sep1', label: '1회 개수 (최소)', type: 'number' },
      { key: '_sep2', label: '1회 개수 (최대)', type: 'number' },
      ...(opts && opts.noPrefix ? [] : [{ key: 'namePrefix', label: 'Prefix', type: 'text', placeholder: '테스트_' }]),
    ];
    if (opts && opts.extra) cols.push(...opts.extra);
    cols.push(
      { key: 'intervalVal', label: '실행 주기 (값)', type: 'number' },
      { key: 'intervalUnit', label: '실행 주기 (단위)', type: 'select', options: UNIT_OPTS },
      { key: 'durationMin', label: '실행 시간 (분)', type: 'number', hint: '자동 정지' },
    );
    return cols;
  };

  /* ── BoGrid 로그 컬럼 정의 ──────────────────────────────── */
  const logGridColumns = () => [
    { key: '_no',    label: '번호', width: '36px',  align: 'center', fmt: (v, row, i) => i + 1 },
    { key: 'ts',     label: '시각', width: '86px',  cellStyle: 'color:#94a3b8;font-family:monospace;' },
    { key: 'mode',   label: '유형', width: '44px',  align: 'center',
      badge: (row) => row.mode === '생성' ? 'badge-blue' : 'badge-orange' },
    { key: 'status', label: '결과', width: '36px',  align: 'center',
      fmt: (v) => v === 'ok' ? '✓' : '✗',
      cellStyle: (v) => 'font-weight:700;font-size:12px;color:' + (v === 'ok' ? '#16a34a' : '#dc2626') },
    { key: 'desc',   label: '내용',
      cellStyle: (v, row) => row.status === 'fail' ? 'background:#fff5f5;' : '' },
    { key: 'reason', label: '실패 사유', width: '160px', cellStyle: 'color:#ef4444;font-size:11px;' },
  ];

  /* ── 통계 카드 HTML (공통) ───────────────────────────────── */
  const statCardHtml = (gradientCss) => `
<div v-if="state.totalRun > 0 || cfIsRunning" style="border-top:1px solid #f1f5f9;padding-top:12px;margin-top:4px;">
  <div v-if="cfIsRunning" style="margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:4px;">
      <span>{{ state.progress }}% 진행</span><span>{{ state.remainSec }}초 남음</span>
    </div>
    <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
      <div :style="'height:100%;border-radius:4px;width:'+state.progress+'%;transition:width 0.3s;background:${gradientCss || 'linear-gradient(90deg,#6366f1,#8b5cf6)'}'"></div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;">
    <div style="background:#f8fafc;border-radius:8px;padding:8px 4px;"><div style="font-size:20px;font-weight:700;color:#334155;">{{ state.totalRun }}</div><div style="font-size:10px;color:#94a3b8;">총 실행</div></div>
    <div style="background:#f0fdf4;border-radius:8px;padding:8px 4px;"><div style="font-size:20px;font-weight:700;color:#16a34a;">{{ state.totalOk }}</div><div style="font-size:10px;color:#86efac;">성공</div></div>
    <div style="background:#fef2f2;border-radius:8px;padding:8px 4px;"><div style="font-size:20px;font-weight:700;color:#dc2626;">{{ state.totalFail }}</div><div style="font-size:10px;color:#fca5a5;">실패</div></div>
  </div>
  <div v-if="state.totalRun > 0" style="margin-top:8px;">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:3px;"><span>성공률</span><span>{{ cfSuccessRate }}%</span></div>
    <div style="height:4px;background:#fee2e2;border-radius:2px;overflow:hidden;">
      <div :style="'height:100%;background:#22c55e;border-radius:2px;width:'+cfSuccessRate+'%'"></div>
    </div>
  </div>
</div>`;

  /* ── 로그 패널 컴포넌트 템플릿 (bo-grid 활용) ─────────────── */
  /* 각 도메인 파일의 template 에 삽입되는 로그 영역 HTML 문자열 */
  const logPanelHtml = () => `
<div class="card" style="padding:14px 16px;height:100%;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <div class="list-title">📋 실행 로그</div>
    <div style="display:flex;gap:6px;align-items:center;">
      <span v-if="logs.length" style="font-size:11px;color:#94a3b8;">{{ logs.length }}건</span>
      <button class="btn btn_reset" @click="onClearLog">지우기</button>
    </div>
  </div>
  <div v-if="logs.length === 0" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#cbd5e1;border:1px solid #f1f5f9;border-radius:6px;">
    <div style="font-size:36px;margin-bottom:8px;">🔇</div>
    <div style="font-size:13px;">아직 실행 이력이 없습니다.</div>
    <div style="font-size:11px;margin-top:4px;">▶ 시작 또는 ⚡ 1회 실행을 눌러주세요.</div>
  </div>
  <bo-grid v-else
    :rows="logs"
    :columns="logCols"
    row-key-field="_idx"
    :table-max-height="'calc(100vh - 280px)'"
    style="font-size:11px;">
  </bo-grid>
</div>`;

  /* ── logCols 생성 함수 (각 컴포넌트 setup에서 호출) ─────── */
  const makeLogCols = () => [
    { key: '_idx',   label: '번호', width: '36px',  align: 'center',
      fmt: (v, row, i) => i + 1 },
    { key: 'ts',     label: '시각', width: '88px',
      cellStyle: 'color:#94a3b8;font-family:monospace;font-size:10px;' },
    { key: 'mode',   label: '유형', width: '44px',  align: 'center',
      badge: (row) => row.mode === '생성' ? 'badge-blue' : 'badge-orange' },
    { key: 'status', label: '결과', width: '36px',  align: 'center',
      fmt: (v) => v === 'ok' ? '✓' : '✗',
      cellStyle: (v) => 'font-weight:700;font-size:13px;color:' + (v === 'ok' ? '#16a34a' : '#dc2626') },
    { key: 'desc',   label: '내용',
      cellStyle: (v, row) => row.status === 'fail' ? 'background:#fff5f5;' : '' },
    { key: 'reason', label: '실패 사유', width: '180px',
      cellStyle: 'color:#ef4444;font-size:11px;' },
  ];

  /* ── bo-form-area 기반 공통 설정 컬럼 생성 ─────────────── */
  const makeBaseCfgColumns = () => [
    { key: 'countMin',    label: '1회 개수 최소', type: 'number', hint: '건' },
    { key: 'countMax',    label: '1회 개수 최대', type: 'number', hint: '건' },
    { key: 'namePrefix',  label: 'Prefix',        type: 'text',   placeholder: '테스트_' },
    { key: 'addSuffix',   label: 'YYMMDD_hhmm 추가', type: 'checkbox' },
    { key: 'intervalVal', label: '실행 주기 값',  type: 'number' },
    { key: 'intervalUnit', label: '단위', type: 'select',
      options: [{ value: 'sec', label: '초' }, { value: 'min', label: '분' }, { value: 'hr', label: '시간' }] },
    { key: 'durationMin', label: '총 실행 시간',  type: 'number', hint: '분', colSpan: 1 },
  ];

  window.ZdSimulBase = {
    useSimulSetup,
    /* 템플릿 헬퍼 (legacy) */
    logPanelHtml,
    statCardHtml,
    /* 컬럼 헬퍼 (신규) */
    makeLogCols,
    makeBaseCfgColumns,
    baseCfgColumns,
    logGridColumns,
    /* 공통 유틸 */
    _randInt, _randF, _pick, _wonFmt,
  };
})();

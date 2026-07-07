/* ZdSimulBase — 시뮬레이션 공통 엔진 v3 (window.ZdSimulBase)
 * bo-form-area / bo-grid 최대 활용 버전
 */
(function () {
  /* ── 듀얼 range 슬라이더 스타일 주입 (1회) ─────────────── */
  if (!document.getElementById('zd-simul-range-style')) {
    const s = document.createElement('style');
    s.id = 'zd-simul-range-style';
    s.textContent = [
      '.zd-simul input[type=range]{height:4px;background:transparent;outline:none;}',
      '.zd-simul input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(124,58,237,.5);cursor:pointer;margin-top:-6px;}',
      '.zd-simul input[type=range]::-webkit-slider-runnable-track{height:4px;background:transparent;}',
      '.zd-simul input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(124,58,237,.5);cursor:pointer;}',
      '.zd-simul input[type=range]::-moz-range-track{height:4px;background:transparent;}',
    ].join('');
    document.head.appendChild(s);
  }
  const { ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

  /* ── 공통 유틸 ──────────────────────────────────────────── */
  /* UTF-8 replacement char(U+FFFD, ?) 포함 여부 탐지 */
  const _hasBrokenKorean = (s) => s != null && s.includes('�');
  /* 깨진 문자 제거 (? 로 치환) */
  const _sanitize = (s) => (s == null ? s : s.replace(/�/g, '?'));

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

  /* ── 공유 통계 ────────────────────────────────────────────── */
  if (!window._zdSimulStats)  window._zdSimulStats   = {};

  /* DB 저장 — 비동기 fire-and-forget */
  const _addLog = (domain, mode, status, desc, reason, meta, userNm, uiNm) => {
    if (!window._zdSimulStats[domain]) window._zdSimulStats[domain] = { ok: 0, fail: 0, total: 0 };
    window._zdSimulStats[domain].total++;
    if (status === '성공') window._zdSimulStats[domain].ok++;
    else window._zdSimulStats[domain].fail++;
    const body = {
      domain,
      mode,
      status: status === '성공' ? 'SUCCESS' : 'FAIL',
      desc: _sanitize(desc || ''),
      reason: _sanitize(reason || ''),
      targetId: (meta && meta.id) ? String(meta.id) : null,
      userNm: _sanitize(userNm || '-'),
      uiNm: uiNm || domain,
    };
    if (window.boApiSvc && window.boApiSvc.zdSimulLog) {
      window.boApiSvc.zdSimulLog.save(body).catch(() => {});
    }
  };

  /* ── 공통 setup 팩토리 ───────────────────────────────────── */
  const useSimulSetup = (opts) => {
    const { domain, label, uiNm, runFn, defaultCfg } = opts;

    /* [01] 기본 + 도메인 확장 설정 */
    const cfg = reactive(Object.assign({
      mode: 'create',
      countMin: 1,
      countMax: 1,
      namePrefix: 'simul',
      addSuffix: true,
      simulYn: 'Y',
      intervalUnit: 'sec',
      intervalVal: 30,
      durationMin: 10,
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
    const logPager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1 });
    const logSearch = reactive({ uiNm: uiNm || label || '', userNm: '', desc: '', status: '' });

    /* DB 조회 */
    const _fetchLogs = async (pageNo) => {
      if (!window.boApiSvc || !window.boApiSvc.zdSimulLog) return;
      try {
        const curPage = pageNo || logPager.pageNo;
        const params = {
          domain,
          pageNo: curPage,
          pageSize: logPager.pageSize,
          uiNm:    logSearch.uiNm    || undefined,
          userNm:  logSearch.userNm  || undefined,
          desc:    logSearch.desc    || undefined,
          status:  logSearch.status  || undefined,
        };
        const res = await window.boApiSvc.zdSimulLog.getPage(params);
        const d = res.data?.data || {};
        const offset = (curPage - 1) * logPager.pageSize;
        const rows = (d.pageList || []).map((e, i) => ({
          _rowNo:   offset + i + 1,
          ts:       e.regDate ? e.regDate.replace('T', ' ').slice(0, 19) : (e.reg_date || ''),
          userNm:   e.userNm || '-',
          uiNm:     e.uiNm   || '-',
          mode:     e.simulMode || '-',
          status:   e.simulStatus === 'SUCCESS' ? 'ok' : 'fail',
          desc:     e.descTxt   || '',
          reason:   e.reasonTxt || '',
          domain:   e.domain   || '',
          targetId: e.targetId || '',
          meta:   {},
        }));
        logs.value = rows;
        logPager.pageTotalCount = d.pageTotalCount || 0;
        logPager.pageTotalPage  = d.pageTotalPage  || 1;
        logPager.pageNo = pageNo || logPager.pageNo;
      } catch (_) {}
    };

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
          const _au = window.boAuthStore?.svAuthUser || (window.boAuthStore && window.boAuthStore.sgCurrentUser?.()) || {};
          const userNm = _au.name || _au.authNm || _au.userNm || '-';
          const mode = cfg.mode === 'create' ? '생성' : '수정';
          /* 로컬 로그 즉시 프리펜드 (params 포함) */
          const localEntry = {
            _rowNo: 0, ts: _ts(), userNm, uiNm: uiNm || label, domain,
            mode, status: ok ? 'ok' : 'fail', desc, reason,
            targetId: meta.id ? String(meta.id) : '',
            meta,
            params: meta.params || null, /* runFn이 meta.params 반환 시 저장 */
          };
          logs.value = [localEntry, ...logs.value].slice(0, logPager.pageSize * 2);
          _addLog(domain, mode, ok ? '성공' : '실패', desc, reason, meta, userNm, uiNm || label);
          if (ok && meta.id) created.push(meta);
        } catch (e) {
          state.totalRun++; state.totalFail++;
          const reason = e?.response?.data?.message || e?.message || String(e);
          const _au = window.boAuthStore?.svAuthUser || (window.boAuthStore && window.boAuthStore.sgCurrentUser?.()) || {};
          const userNm = _au.name || _au.authNm || _au.userNm || '-';
          const mode = cfg.mode === 'create' ? '생성' : '수정';
          const errEntry = {
            _rowNo: 0, ts: _ts(), userNm, uiNm: uiNm || label, domain,
            mode, status: 'fail', desc: '오류 발생', reason,
            targetId: '', meta: {}, params: null,
          };
          logs.value = [errEntry, ...logs.value].slice(0, logPager.pageSize * 2);
          _addLog(domain, mode, '실패', '오류 발생', reason, {}, userNm, uiNm || label);
        }
      }
      state.lastCreated = created;
      if (state.running) _tickTimer = setTimeout(_doOneTick, cfIntervalMs.value);
    /* 틱 완료 후 1페이지 재조회 */
    setTimeout(() => _fetchLogs(1), 300);
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
    const onClearLog    = () => { state.lastCreated = []; _fetchLogs(1); };
    const onResetStats  = () => { state.totalRun = state.totalOk = state.totalFail = 0; };
    const onSetLogPage  = (n) => { logPager.pageNo = n; _fetchLogs(n); };
    const onSearchLog   = () => { logPager.pageNo = 1; _fetchLogs(1); };

    onMounted(() => { _fetchLogs(1); });
    onBeforeUnmount(() => { state.running = false; _clearTimers(); });

    return { cfg, state, logs, logPager, logSearch, cfIsRunning, cfIntervalMs, cfDurationMs, cfSuccessRate,
             onStart, onStop, onRunOnce, onClearLog, onResetStats, onSetLogPage, onSearchLog,
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

  /* ── 도메인 → 페이지 URL 매핑 ──────────────────────────── */
  /* bo: BO 페이지 ID (bo.html 기준)
   * fo: FO 페이지 ID + 파라미터 생성 fn (index.html 기준) — null 이면 FO 버튼 미표시 */
  const _DOMAIN_PAGE_MAP = {
    '주문': {
      bo: { page: 'odOrderMng',       idParam: 'dtlId' },
      fo: null,
      kanban: 'odOrderKanban',
      foLogin:   true,
      foProfile: true,
      idLabel: '주문ID',
    },
    '클레임': {
      bo: { page: 'odClaimMng',       idParam: 'dtlId' },
      fo: null,
      kanban: 'odOrderKanban',
      calc: true,
      foLogin:   true,
      foProfile: true,
      idLabel: '클레임ID',
    },
    '상품': {
      bo: { page: 'pdProdMng',        idParam: 'dtlId' },
      fo: (id) => 'page=prodView&prodid=' + encodeURIComponent(id),
      idLabel: '상품ID',
    },
    '회원': {
      bo: { page: 'mbMemberMng',      idParam: 'dtlId' },
      fo: null,
      foLogin:   true,
      foProfile: true,
      idLabel: '회원ID',
    },
    '이벤트': {
      bo: { page: 'pmEventMng',       idParam: 'dtlId' },
      fo: (id) => 'page=event&eventId=' + encodeURIComponent(id),
      idLabel: '이벤트ID',
    },
    '기획전': {
      bo: { page: 'pmPlanMng',        idParam: 'dtlId' },
      fo: null,
      idLabel: '기획전ID',
    },
    '프로모션': {
      bo: { page: 'pmCouponMng',      idParam: 'dtlId' },
      fo: null,
      idLabel: '프로모션ID',
    },
    '정산': {
      bo: { page: 'stSettleCloseMng', idParam: 'dtlId' },
      fo: null,
      foLogin:   true,
      idLabel: '정산ID',
    },
  };

  /* BO 상세 window.open — searchValue 파라미터로 Mng 자동 조회 */
  const _openBoPage = (row) => {
    const meta = _DOMAIN_PAGE_MAP[row.domain];
    if (!meta || !meta.bo || !row.targetId) return;
    const url = 'bo.html#page=' + meta.bo.page + '&searchValue=' + encodeURIComponent(row.targetId);
    window.open(url, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
  };

  /* FO 상세 window.open */
  const _openFoPage = (row) => {
    const meta = _DOMAIN_PAGE_MAP[row.domain];
    if (!meta || !meta.fo || !row.targetId) return;
    const hash = meta.fo(row.targetId);
    window.open('index.html#' + hash, '_blank', 'width=1280,height=900,scrollbars=yes,resizable=yes');
  };

  /* 주문 칸반 window.open (주문/클레임 공용) */
  const _openKanban = (row) => {
    const meta = _DOMAIN_PAGE_MAP[row.domain];
    if (!meta || !meta.kanban || !row.targetId) return;
    let url = 'bo.html#page=' + meta.kanban + '&dtlId=' + encodeURIComponent(row.targetId);
    if (row.domain === '클레임') url += '&claimId=' + encodeURIComponent(row.targetId);
    window.open(url, '_blank', 'width=1600,height=960,scrollbars=yes,resizable=yes');
  };

  /* 회원 FO 로그인 window.open — 브릿지 HTML(zd-fo-login.html) 경유
   * in-session 로그(params 있음): loginId/pwd 자동 채워 로그인 API 호출 → FO 홈 redirect
   * DB 로드 로그(params 없음): 브릿지 열되 loginId 없음 안내 */
  const _openFoLogin = (row) => {
    /* params 있으면 우선, 없으면 desc/meta에서 이메일 파싱 fallback */
    let loginId  = row.params?.loginId || '';
    let loginPwd = row.params?.loginPwd || '1111';
    if (!loginId) {
      /* desc: "[실버] simul김윤서 / sim_86782@outlook.com" 형태에서 loginId 추출
       * 이메일 앞부분(@ 앞)이 곧 loginId (sim_XXXXX 패턴) */
      const src = (row.desc || row.uiNm || '');
      const m = src.match(/([a-zA-Z0-9._%+\-]+)@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      if (m) loginId = m[1];
    }
    if (!loginId && row.meta) {
      /* 주문/클레임 등: meta.memberId가 곧 loginId 패턴(sim_XXXXX) */
      loginId = row.meta.loginId || row.meta.memberId || '';
    }
    const hash = loginId
      ? '#autoLoginId=' + encodeURIComponent(loginId) + '&autoLoginPwd=' + encodeURIComponent(loginPwd)
      : '';
    window.open('pages/bo/zd/zd-fo-login.html' + hash, '_blank', 'width=440,height=480,scrollbars=no,resizable=yes');
  };

  /* 회원 FO 마이페이지 window.open */
  const _openFoProfile = (row) => {
    window.open('index.html#page=myOrder', '_blank', 'width=1280,height=900,scrollbars=yes,resizable=yes');
  };

  /* 클레임 환불계산 window.open */
  const _openClaimCalc = (row) => {
    if (!row.targetId) return;
    const url = 'bo.html#page=odClaimMng&dtlId=' + encodeURIComponent(row.targetId) + '&tab=calc';
    window.open(url, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
  };

  /* ── logCols 생성 함수 (각 컴포넌트 setup에서 호출) ─────── */
  const makeLogCols = () => [
    { key: '_rowNo', label: '번호', width: '36px',  align: 'center' },
    { key: 'ts',     label: '등록일시', width: '140px',
      cellStyle: 'color:#64748b;font-family:monospace;font-size:10px;' },
    { key: 'uiNm',   label: '화면명', width: '110px',
      cellStyle: 'color:#6366f1;font-size:11px;' },
    { key: 'userNm', label: '등록자', width: '72px', align: 'center',
      cellStyle: 'color:#475569;font-size:11px;' },
    { key: 'mode',   label: '유형', width: '44px',  align: 'center',
      badge: (row) => row.mode === '생성' ? 'badge-blue' : 'badge-orange' },
    { key: 'status', label: '결과', width: '36px',  align: 'center',
      fmt: (v) => v === 'ok' ? '✓' : '✗',
      cellStyle: (v) => 'font-weight:700;font-size:13px;color:' + (v === 'ok' ? '#16a34a' : '#dc2626') },
    { key: 'desc',   label: '내용',
      cellStyle: (v, row) => row.status === 'fail' ? 'background:#fff5f5;' : '' },
    { key: 'reason', label: '실패 사유', width: '180px',
      cellStyle: 'color:#ef4444;font-size:11px;' },
    { key: '_actions', label: '기능', width: '170px', align: 'center' },
  ];

  /* ── bo-form-area 기반 공통 설정 컬럼 생성 ─────────────── */
  const makeBaseCfgColumns = () => [
    { key: 'simulYn', label: '시뮬여부', type: 'select',
      options: [{ value: 'Y', label: '예' }, { value: 'N', label: '아니오' }] },
    { key: 'countMin',    label: '1회 개수 최소', type: 'number', hint: '건' },
    { key: 'countMax',    label: '1회 개수 최대', type: 'number', hint: '건' },
    { key: 'namePrefix',  label: 'Prefix',        type: 'text',   placeholder: '테스트_' },
    { key: 'addSuffix',   label: 'YYMMDD_hhmm 추가', type: 'checkbox', checkedValue: true, uncheckedValue: false },
    { key: 'intervalVal', label: '실행 주기 값',  type: 'number' },
    { key: 'intervalUnit', label: '단위', type: 'select',
      options: [{ value: 'sec', label: '초' }, { value: 'min', label: '분' }, { value: 'hr', label: '시간' }] },
    { key: 'durationMin', label: '총 실행 시간',  type: 'number', hint: '분', colSpan: 1 },
  ];

  /* ── 듀얼 range 슬라이더 헬퍼 ──────────────────────────────
   * makeRangeCol(minKey, maxKey, label, absMin, absMax, unit, opts)
   *   → BoFormArea columns 배열에 삽입할 slot 컬럼 1개 반환
   *   opts: { colSpan, visible }
   *
   * makeRangeHandlers(domCfg, pairs)
   *   pairs: [{ minKey, maxKey }, ...]
   *   → { on{MinKey}Change, on{MaxKey}Change, ... } 핸들러 객체 반환
   *
   * rangeSlotTemplate(minKey, maxKey, absMin, absMax, unit)
   *   → #slotName 에 들어갈 Vue template 문자열 반환
   *
   * 사용법 (각 시뮬레이터):
   *   columns 에 makeRangeCol(...) 삽입
   *   setup return 에 makeRangeHandlers(domCfg, [...]) 스프레드
   *   template bo-form-area 안에 rangeSlotTemplate(...) 삽입
   * ─────────────────────────────────────────────────────────── */
  const _capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const makeRangeCol = (minKey, maxKey, label, absMin, absMax, unit, opts) => {
    const slotName = minKey.replace(/Min$/, '') + 'Range';
    return {
      key: '_' + slotName, label,
      type: 'slot', name: slotName,
      colSpan: opts && opts.colSpan != null ? opts.colSpan : 1,
      ...(opts && opts.visible ? { visible: opts.visible } : {}),
    };
  };

  const makeRangeHandlers = (domCfg, pairs) => {
    const handlers = {};
    pairs.forEach(({ minKey, maxKey }) => {
      handlers['on' + _capFirst(minKey) + 'Change'] = () => {
        if (domCfg[minKey] >= domCfg[maxKey]) domCfg[minKey] = domCfg[maxKey] - 1;
      };
      handlers['on' + _capFirst(maxKey) + 'Change'] = () => {
        if (domCfg[maxKey] <= domCfg[minKey]) domCfg[maxKey] = domCfg[minKey] + 1;
      };
    });
    return handlers;
  };

  /* slotName을 minKey에서 자동 도출: priceMin → priceRange */
  const _slotName = (minKey) => minKey.replace(/Min$/, '') + 'Range';

  /* fill bar left/right % 계산 */
  const _fillStyle = (minKey, maxKey, absMin, absMax) => {
    const span = absMax - absMin;
    /* absMin < 0 이면 '-(-50)' → '--50' (decrement 오파싱) 방지: 괄호로 감쌈 */
    const offset = absMin === 0 ? '' : `-(${absMin})`;
    const minPct = absMin === 0
      ? `domCfg.${minKey}/${span}*100`
      : `(domCfg.${minKey}${offset})/${span}*100`;
    const maxPct = absMin === 0
      ? `domCfg.${maxKey}/${span}*100`
      : `(domCfg.${maxKey}${offset})/${span}*100`;
    return `'position:absolute;left:'+(${minPct})+'%;right:'+(100-(${maxPct}))+'%;height:4px;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:2px;pointer-events:none;'`;
  };

  const rangeSlotTemplate = (minKey, maxKey, absMin, absMax, unit) => {
    const sn = _slotName(minKey);
    const minHandler = 'on' + _capFirst(minKey) + 'Change';
    const maxHandler = 'on' + _capFirst(maxKey) + 'Change';
    const fillStyle  = _fillStyle(minKey, maxKey, absMin, absMax);
    const minFmt = unit === '원' ? `{{ domCfg.${minKey}.toLocaleString() }}${unit}` : `{{ domCfg.${minKey} }}${unit}`;
    const maxFmt = unit === '원' ? `{{ domCfg.${maxKey}.toLocaleString() }}${unit}` : `{{ domCfg.${maxKey} }}${unit}`;
    return `<template #${sn}>
        <div style="padding:0;">
          <div style="position:relative;height:20px;display:flex;align-items:center;">
            <div style="position:absolute;left:0;right:0;height:4px;background:#e2e8f0;border-radius:2px;pointer-events:none;"></div>
            <div :style="${fillStyle}"></div>
            <input type="range" min="${absMin}" max="${absMax}" v-model.number="domCfg.${minKey}" @change="${minHandler}"
              style="position:absolute;left:0;right:0;width:100%;margin:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer;pointer-events:auto;" />
            <input type="range" min="${absMin}" max="${absMax}" v-model.number="domCfg.${maxKey}" @change="${maxHandler}"
              style="position:absolute;left:0;right:0;width:100%;margin:0;appearance:none;-webkit-appearance:none;background:transparent;cursor:pointer;pointer-events:auto;" />
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
            <span style="font-size:10px;color:#cbd5e1;">${absMin}${unit}</span>
            <span style="font-size:11px;color:#6d28d9;font-weight:700;">${minFmt}</span>
            <span style="font-size:10px;color:#94a3b8;">~</span>
            <span style="font-size:11px;color:#7c3aed;font-weight:700;">${maxFmt}</span>
            <span style="font-size:10px;color:#cbd5e1;">${absMax}${unit}</span>
          </div>
        </div>
      </template>`;
  };

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
    /* range 슬라이더 헬퍼 */
    makeRangeCol,
    makeRangeHandlers,
    rangeSlotTemplate,
    /* 로그 기능 버튼 헬퍼 */
    _DOMAIN_PAGE_MAP,
    _openBoPage,
    _openFoPage,
    _openFoLogin,
    _openFoProfile,
    _openKanban,
    _openClaimCalc,
    /* 공통 유틸 */
    _randInt, _randF, _pick, _wonFmt,
    /* 인코딩 유틸 */
    _hasBrokenKorean, _sanitize,
  };
})();

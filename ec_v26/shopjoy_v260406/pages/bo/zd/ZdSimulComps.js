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
    emits: ['start', 'stop', 'run-once', 'preview', 'preview-create'],
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
      const { ref: _ref } = Vue;
      const cfHasStats = computed(() => props.state.totalRun > 0 || props.cfIsRunning);
      const onStart   = () => emit('start');
      const onStop    = () => emit('stop');
      const runOnceCount = _ref(1);
      const onRunOnce = () => emit('run-once', runOnceCount.value);
      const onPreview = () => emit('preview');
      const lastExpanded = _ref(false);
      const previewJson  = _ref(null);
      const onToggleLast = () => { lastExpanded.value = !lastExpanded.value; if (!lastExpanded.value) previewJson.value = null; };
      /* zd-preview 이벤트 수신 → parsed object로 저장 */
      const _onZdPreviewCtrl = (e) => {
        try { previewJson.value = JSON.parse(e.detail?.json || 'null'); }
        catch (_) { previewJson.value = e.detail?.json || null; }
      };
      Vue.onMounted(() => window.addEventListener('zd-preview', _onZdPreviewCtrl));
      Vue.onBeforeUnmount(() => window.removeEventListener('zd-preview', _onZdPreviewCtrl));

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

      return { cfHasStats, onStart, onStop, onRunOnce, onPreview, runOnceCount, PRESETS, onPreset, lastExpanded, previewJson, onToggleLast };
    },
    template: `
<div class="card" style="padding:10px 14px;background:#dde3ed;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <!-- 프리셋 select (맨 왼쪽) -->
    <select :disabled="cfIsRunning" @change="onPreset"
      style="font-size:11px;padding:3px 8px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#475569;height:26px;cursor:pointer;max-width:220px;">
      <option value="0">⚡ 프리셋</option>
      <option v-for="(p,i) in PRESETS.slice(1)" :key="i" :value="i+1">{{ p.label }}</option>
    </select>

    <div class="list-title" style="margin:0;">⚙ 실행 제어</div>

    <!-- 시뮬여부 -->
    <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;white-space:nowrap;">
      <span>시뮬여부</span>
      <select v-model="cfg.simulYn" :disabled="cfIsRunning"
        style="font-size:11px;padding:3px 6px;border:1px solid #e2e8f0;border-radius:5px;background:#f8fafc;color:#334155;height:26px;cursor:pointer;">
        <option value="Y">예</option>
        <option value="N">아니오</option>
      </select>
    </div>

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
      <span style="width:1px;height:20px;background:#cbd5e1;display:inline-block;margin:0 2px;flex-shrink:0;"></span>
      <input type="number" v-model.number="runOnceCount" min="1" max="100"
        style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:5px;font-size:12px;padding:3px 4px;height:26px;" />
      <button class="btn btn_preview" style="padding:3px 9px;font-size:12px;" @click="onRunOnce">회실행</button>
      <span style="width:1px;height:20px;background:#cbd5e1;display:inline-block;margin:0 2px;flex-shrink:0;"></span>
      <button class="btn" style="padding:3px 9px;font-size:12px;background:#fdf4ff;border:1px solid #e9d5ff;color:#7c3aed;" @click="onPreview">🔍 미리보기</button>
    </div>
  </div>

  <!-- 공통 설정 폼 — Prefix / addSuffix 만 (주기·건수·시간은 헤더 select로 이동) -->
  <div class="bo-form-compact">
    <bo-form-area :columns="['namePrefix','addSuffix'].map(k => baseCfgColumns.find(c => c.key === k)).filter(Boolean)"
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

    <!-- 최근 결과 토글 -->
    <div v-if="state.lastCreated &amp;&amp; state.lastCreated.length" @click="onToggleLast"
      style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:#6366f1;user-select:none;padding:2px 6px;border-radius:4px;border:1px solid #c7d2fe;background:#eef2ff;">
      <span>{{ lastExpanded ? '▲' : '▼' }}</span>
      <span>최근 결과 {{ state.lastCreated.length }}건</span>
    </div>
  </div>

  <!-- 최근 결과 JSON 뷰 (토글) -->
  <div v-if="lastExpanded &amp;&amp; !previewJson"
    style="margin-top:6px;background:#1e1e2e;border-radius:6px;border:1px solid #374151;padding:8px 10px;max-height:260px;overflow-y:auto;font-family:monospace;font-size:11px;line-height:1.6;color:#a5f3fc;white-space:pre;word-break:break-all;">{{ JSON.stringify(state.lastCreated, null, 2) }}</div>

  <!-- 미리보기 테이블 패널 -->
  <div v-if="previewJson"
    style="margin-top:6px;background:#f8f7ff;border:1.5px solid #c4b5fd;border-radius:8px;padding:10px 12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:#7c3aed;font-weight:600;">📋 전송 데이터 미리보기</span>
        <!-- method + url 표시 (단건 캡처 시) -->
        <template v-if="previewJson &amp;&amp; previewJson.method">
          <span :style="'font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;color:#fff;background:'+(previewJson.method==='POST'?'#7c3aed':previewJson.method==='PUT'?'#2563eb':'#d97706')">{{ previewJson.method }}</span>
          <span style="font-size:10px;font-family:monospace;color:#475569;">{{ previewJson.url }}</span>
        </template>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button @click="$emit('preview-create')" style="font-size:11px;padding:2px 10px;background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;border-radius:4px;cursor:pointer;font-weight:600;">⚡ 미리보기 생성</button>
        <button @click="previewJson=null" style="font-size:13px;color:#94a3b8;background:none;border:none;cursor:pointer;padding:0 4px;line-height:1;">✕</button>
      </div>
    </div>
    <!-- 단건: body를 메인으로, 다건: 전체 표시 -->
    <zd-preview-table :data="previewJson ? (previewJson.body !== undefined ? previewJson.body : previewJson) : null" />
  </div>
</div>`,
  };


  /* ─────────────────────────────────────────────────────────────────────
     ZdSimulLogPanel
     로그 패널 공통 컴포넌트 — DB 서버사이드 페이징 버전
     Props:
       logs      (Array)  — 현재 페이지 rows (useSimulSetup.logs)
       logCols   (Array)  — makeLogCols() 결과
       pager     (Object) — { pageNo, pageTotalCount, pageTotalPage }
     Emits: clear, set-page(n)
  ─────────────────────────────────────────────────────────────────────── */
  const { computed: _computed, ref: _ref, reactive: _reactive } = Vue;

  window.ZdSimulLogPanel = {
    name: 'ZdSimulLogPanel',
    emits: ['clear', 'set-page', 'search-log'],
    props: {
      logs:      { type: Array,    required: true },
      logCols:   { type: Array,    required: true },
      pager:     { type: Object,   default: () => ({ pageNo: 1, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSize: 10, pageSizes: [10, 20, 50] }) },
      logSearch: { type: Object,   default: () => ({ uiNm: '', userNm: '', desc: '', status: '', dateFrom: '', dateTo: '' }) },
    },
    setup(props, { emit }) {
      const onClear   = () => emit('clear');
      const onSetPage = (n) => emit('set-page', n);
      const onSearch  = () => emit('search-log');

      /* 펼침 행 (한 행만 유지) */
      const expandedId = _ref(null);
      const onToggleExpand = (row) => {
        const key = row.ts + '_' + row.targetId;
        expandedId.value = expandedId.value === key ? null : key;
      };
      const isExpanded = (row) => expandedId.value === (row.ts + '_' + row.targetId);

      /* desc_txt 를 항목별로 파싱 — "[태그] 내용 | key:val | ..." 형식 */
      const parseDesc = (desc) => {
        if (!desc) return [];
        /* "| " 구분자로 분리 후 각 항목을 label:value 로 분리 */
        return desc.split(/\s*\|\s*/).map((seg, i) => {
          const colonIdx = seg.indexOf(':');
          if (colonIdx > 0 && colonIdx < 30) {
            return { label: seg.slice(0, colonIdx).trim(), value: seg.slice(colonIdx + 1).trim() };
          }
          return { label: i === 0 ? '내용' : '항목' + i, value: seg.trim() };
        }).filter(x => x.value);
      };

      /* 로그 기능 버튼 핸들러 */
      const _base = () => window.ZdSimulBase;
      const cfDomainMeta = (row) => (_base() && row.domain) ? _base()._DOMAIN_PAGE_MAP[row.domain] : null;
      const onOpenBo        = (row) => _base() && _base()._openBoPage(row);
      const onOpenFo        = (row) => _base() && _base()._openFoPage(row);
      const onOpenFoLogin   = (row) => _base() && _base()._openFoLogin(row);
      const onOpenFoProfile = (row) => _base() && _base()._openFoProfile(row);
      const onOpenKanban    = (row) => _base() && _base()._openKanban(row);

      /* 클레임 계산 — 인라인 모달 */
      const calcModal = _reactive({ show: false, claimId: '' });
      const onOpenCalc = (row) => {
        if (!row.targetId) return;
        calcModal.claimId = row.targetId;
        calcModal.show = true;
      };

      return {
        onClear, onSetPage, onSearch,
        expandedId, onToggleExpand, isExpanded, parseDesc,
        cfDomainMeta, onOpenBo, onOpenFo, onOpenFoLogin, onOpenFoProfile, onOpenKanban,
        onOpenCalc, calcModal,
      };
    },
    template: `
<div class="card" style="padding:14px 16px;background:#dde3ed;">
  <!-- 카드 헤더 -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div class="list-title" style="margin:0;">📋 실행 로그</div>
    <button class="btn btn_reset" @click="onClear">새로고침</button>
  </div>

  <!-- 검색 바 -->
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-size:11px;color:#94a3b8;font-weight:600;">● 목록 총 {{ pager.pageTotalCount }}건</span>
    <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
      <input v-model="logSearch.dateFrom" type="date" @keyup.enter="onSearch"
        style="height:26px;padding:0 6px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <span style="font-size:11px;color:#94a3b8;">~</span>
      <input v-model="logSearch.dateTo" type="date" @keyup.enter="onSearch"
        style="height:26px;padding:0 6px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <input v-model="logSearch.uiNm" type="text" placeholder="화면명" @keyup.enter="onSearch"
        style="width:100px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <input v-model="logSearch.userNm" type="text" placeholder="등록자" @keyup.enter="onSearch"
        style="width:70px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <input v-model="logSearch.desc" type="text" placeholder="내용" @keyup.enter="onSearch"
        style="width:110px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <select v-model="logSearch.status"
        style="height:26px;padding:0 6px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;color:#334155;">
        <option value="">성공/실패 전체</option>
        <option value="SUCCESS">✓ 성공</option>
        <option value="FAIL">✗ 실패</option>
      </select>
      <button class="btn btn_search" style="height:26px;padding:0 10px;font-size:11px;" @click="onSearch">조회</button>
    </div>
  </div>

  <!-- 로그 테이블 (expand 행 지원) -->
  <div style="overflow-x:auto;">
    <table class="admin-table bo-table" style="font-size:11px;width:100%;">
      <thead><tr>
        <th style="width:28px;text-align:center;"></th>
        <th style="width:36px;text-align:center;">번호</th>
        <th style="width:140px;">등록일시</th>
        <th style="width:110px;">화면명</th>
        <th style="width:72px;text-align:center;">등록자</th>
        <th style="width:44px;text-align:center;">유형</th>
        <th style="width:36px;text-align:center;">결과</th>
        <th>내용</th>
        <th style="width:180px;">실패 사유</th>
        <th style="width:140px;text-align:center;">데이터ID</th>
        <th style="width:200px;text-align:center;">기능</th>
      </tr></thead>
      <tbody v-if="!logs.length">
        <tr><td colspan="11" style="text-align:center;padding:24px;color:#94a3b8;">
          아직 실행 이력이 없습니다. ▶ 시작 또는 ⚡ 1회 실행을 눌러주세요.
        </td></tr>
      </tbody>
      <template v-for="(row, idx) in logs" :key="row.ts+'_'+row.targetId+'_'+idx">
        <!-- 메인 행 -->
        <tbody>
          <tr :style="row.status==='fail' ? 'background:#fff5f5;' : (isExpanded(row) ? 'background:#f8faff;' : '')">
            <!-- 펼치기 버튼 -->
            <td style="text-align:center;padding:4px 2px;cursor:pointer;" @click="onToggleExpand(row)">
              <span style="font-size:13px;color:#94a3b8;user-select:none;transition:transform .15s;display:inline-block;"
                :style="isExpanded(row) ? 'transform:rotate(90deg);color:#6366f1;' : ''">▶</span>
            </td>
            <td style="text-align:center;color:#94a3b8;">{{ pager.pageTotalCount - (pager.pageNo-1)*(pager.pageSize||10) - idx }}</td>
            <td style="color:#64748b;font-family:monospace;font-size:10px;">{{ row.ts }}</td>
            <td style="color:#6366f1;font-size:11px;">{{ row.uiNm }}</td>
            <td style="text-align:center;color:#475569;">{{ row.userNm }}</td>
            <td style="text-align:center;">
              <span :class="'badge '+(row.mode==='생성' ? 'badge-blue' : 'badge-orange')" style="font-size:10px;">{{ row.mode }}</span>
            </td>
            <td style="text-align:center;font-weight:700;font-size:13px;"
              :style="row.status==='ok' ? 'color:#16a34a' : 'color:#dc2626'">
              {{ row.status==='ok' ? '✓' : '✗' }}
            </td>
            <td :style="row.status==='fail' ? 'background:#fff5f5;' : ''">{{ row.desc }}</td>
            <td style="color:#ef4444;font-size:11px;">{{ row.reason }}</td>
            <!-- 데이터ID 컬럼 -->
            <td style="text-align:center;padding:4px 6px;white-space:nowrap;">
              <template v-if="row.targetId">
                <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">
                  {{ cfDomainMeta(row) ? cfDomainMeta(row).idLabel : '데이터ID' }}
                </div>
                <div style="font-size:11px;color:#334155;font-family:monospace;font-weight:600;">{{ row.targetId }}</div>
                <!-- meta에서 회원명/부가정보 표시 -->
                <div v-if="row.meta &amp;&amp; (row.meta.memberId || row.meta.memberNm)" style="font-size:10px;color:#6366f1;margin-top:1px;">
                  {{ row.meta.memberNm || row.meta.memberId || '' }}
                </div>
                <div v-else-if="row.domain === '회원' &amp;&amp; row.desc" style="font-size:10px;color:#6366f1;margin-top:1px;">
                  {{ row.desc.replace(/^\[[^\]]+\]\s*/, '').split(' / ')[0] }}
                </div>
              </template>
              <span v-else style="font-size:10px;color:#cbd5e1;">-</span>
            </td>
            <!-- 기능 버튼 컬럼 -->
            <td style="text-align:center;padding:4px 6px;white-space:nowrap;">
              <template v-if="row.targetId">
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).bo"
                  class="btn btn_detail" style="padding:1px 7px;font-size:10px;height:20px;margin:1px;"
                  @click.stop="onOpenBo(row)" title="관리자 상세 열기">BO상세</button>
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).fo"
                  class="btn btn_preview" style="padding:1px 7px;font-size:10px;height:20px;margin:1px;"
                  @click.stop="onOpenFo(row)" title="사용자 화면 열기">FO상세</button>
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).foLogin"
                  style="padding:1px 7px;font-size:10px;height:20px;margin:1px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:4px;cursor:pointer;"
                  @click.stop="onOpenFoLogin(row)" title="FO 로그인">FO로그인</button>
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).foProfile"
                  style="padding:1px 7px;font-size:10px;height:20px;margin:1px;background:#ede9fe;color:#6d28d9;border:1px solid #ddd6fe;border-radius:4px;cursor:pointer;"
                  @click.stop="onOpenFoProfile(row)" title="FO 마이페이지 열기">FO프로필</button>
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).kanban"
                  style="padding:1px 7px;font-size:10px;height:20px;margin:1px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:4px;cursor:pointer;"
                  @click.stop="onOpenKanban(row)" title="칸반보드 열기">칸반</button>
                <button v-if="cfDomainMeta(row) &amp;&amp; cfDomainMeta(row).calc"
                  style="padding:1px 7px;font-size:10px;height:20px;margin:1px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:4px;cursor:pointer;"
                  @click.stop="onOpenCalc(row)" title="환불 계산 탭 열기">계산</button>
              </template>
              <span v-else style="font-size:10px;color:#cbd5e1;">-</span>
            </td>
          </tr>
          <!-- 펼침 행 -->
          <tr v-if="isExpanded(row)" style="background:#f0f4ff;">
            <td colspan="11" style="padding:0;">
              <div style="padding:12px 16px 14px 44px;border-top:1px solid #e0e7ff;border-bottom:2px solid #c7d2fe;">
                <!-- 항목 그리드 -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px 16px;margin-bottom:10px;">
                  <!-- 고정 항목 -->
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-size:10px;color:#6366f1;font-weight:600;letter-spacing:.3px;">로그 ID / 도메인</span>
                    <span style="font-size:11px;color:#334155;font-family:monospace;">
                      {{ row.targetId || '-' }} / {{ row.domain || '-' }}
                    </span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-size:10px;color:#6366f1;font-weight:600;letter-spacing:.3px;">화면명 / 등록자</span>
                    <span style="font-size:11px;color:#334155;">{{ row.uiNm || '-' }} / {{ row.userNm || '-' }}</span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-size:10px;color:#6366f1;font-weight:600;letter-spacing:.3px;">유형 / 결과 / 등록일시</span>
                    <span style="font-size:11px;color:#334155;">
                      {{ row.mode }} /
                      <span :style="row.status==='ok' ? 'color:#16a34a;font-weight:700;' : 'color:#dc2626;font-weight:700;'">
                        {{ row.status==='ok' ? '성공' : '실패' }}
                      </span>
                      / {{ row.ts }}
                    </span>
                  </div>
                </div>
                <!-- 실행 내용 상세 (JSON) -->
                <div>
                  <div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:4px;letter-spacing:.3px;">📋 실행 내용 상세</div>
                  <div style="background:#1e1e2e;border-radius:6px;border:1px solid #374151;padding:8px 10px;max-height:300px;overflow-y:auto;font-family:monospace;font-size:11px;line-height:1.6;color:#a5f3fc;white-space:pre;word-break:break-all;">{{ JSON.stringify(row.params ? [{ id: row.targetId, desc: row.desc, params: row.params }] : { desc: row.desc }, null, 2) }}</div>
                </div>
                <!-- 실패 사유 -->
                <div v-if="row.reason" style="margin-top:8px;background:#fff5f5;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;">
                  <span style="font-size:10px;color:#dc2626;font-weight:700;">✗ 실패 사유: </span>
                  <span style="font-size:11px;color:#b91c1c;">{{ row.reason }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </table>
  </div>

  <!-- 페이지네이션 -->
  <bo-pager :pager="pager" :on-set-page="onSetPage" />

  <!-- 클레임 계산 모달 -->
  <od-claim-calc-modal :show="calcModal.show" :claim-id="calcModal.claimId" @close="calcModal.show=false" />

</div>`,
  };

  /* ─────────────────────────────────────────────────────────────────────
     ZdPreviewTable
     전송 데이터를 object→name/value 표, list→자식 그리드로 재귀 렌더
  ─────────────────────────────────────────────────────────────────────── */
  /* 필드 한글 레이블 매핑 */
  const _FIELD_LABELS = {
    /* pd_prod Entity 컬럼명 기준 */
    prodNm: '상품명', salePrice: '판매가', purchasePrice: '매입가(원가)',
    prodStock: '재고수량', prodTypeCd: '상품유형', prodStatusCd: '판매상태',
    advrtStmt: '홍보문구', categoryId: '카테고리ID', siteId: '사이트ID',
    dlivTmpltId: '배송템플릿ID', simulYn: '시뮬여부', prodId: '상품ID',
    optTypeCd: '옵션카테고리코드',
    /* prodOpts[].optTypes — pd_prod_opt_type Entity 컬럼명 기준 */
    prodOptTypeId: '옵션유형ID', prodOptTypeNm: '옵션유형명', prodOptTypeLevel: '옵션단계',
    prodOptInputTypeCd: '입력유형', sortOrd: '정렬순서',
    /* prodOpts[].prodOpts — pd_prod_opt Entity 컬럼명 기준 (구 pd_prod_opt_item) */
    prodOptId: '옵션값ID', prodOptNm: '옵션항목명', prodOptVal: '옵션값',
    optValCodeId: '코드참조ID', parentProdOptId: '상위옵션값ID', optStyle: '항목스타일',
    useYn: '사용여부',
    /* SKU (백엔드 자동생성 참고용) — pd_prod_sku */
    prodSkuId: 'SKU ID', skuNm: 'SKU명',
    prodOptId1: '옵션1 값ID', prodOptId2: '옵션2 값ID',
    addPrice: '추가금액', prodOptStock: '재고수량',
    /* prodImages — pd_prod_img */
    prodImgId: '이미지ID', cdnImgUrl: '이미지URL', prodOptNm: '옵션항목명',
    isThumb: '대표이미지', isMain: '대표이미지',
    skuStatusCd: 'SKU상태',
    /* 공통 */
    method: '메서드', url: 'URL', body: '요청본문',
    tmpPlanId: '기획전임시ID',
    prodId: '상품ID', userId: '사용자ID', orderId: '주문ID', planId: '플랜ID',
    memberId: '회원ID', couponId: '쿠폰ID', discntId: '할인ID', eventId: '이벤트ID',
    saveId: '적립ID', voucherId: '바우처ID', claimId: '클레임ID', dlivId: '배송ID',
    vendorId: '업체ID', planType: '플랜유형', planName: '플랜명',
    memberNm: '회원명', email: '이메일', phone: '전화번호',
    loginId: '로그인ID', memberStatusCd: '회원상태', memberGradeCd: '회원등급',
    orderStatusCd: '주문상태', payMethodCd: '결제수단',
    totalAmt: '합계금액', discntAmt: '할인금액', payAmt: '결제금액',
    couponNm: '쿠폰명', discntNm: '할인명', saveNm: '적립금정책명',
    issueYn: '발급여부', useYn2: '사용여부', expireDate: '만료일',
    /* 쿠폰/할인/적립금 공통 */
    couponCd: '쿠폰코드', couponTypeCd: '쿠폰유형', couponDiscTypeCd: '할인유형',
    discntTypeCd: '할인정책유형', discntValTypeCd: '할인값유형',
    savePurposeCd: '적립목적', saveRatePct: '적립률(%)', saveAmt: '정액적립금',
    discVal: '할인값', issueCount: '발급수량',
    startDate: '시작일', endDate: '종료일',
    scopeCd: '적용범위', minOrderAmt: '최소주문금액', maxDiscAmt: '최대할인금액',
    /* 이벤트 */
    eventNm: '이벤트명', eventTypeCd: '이벤트유형', eventStatusCd: '이벤트상태',
    benefitTypeCd: '혜택유형', benefitAmt: '혜택금액', winnerCount: '당첨자수',
    /* 기획전 */
    planNm: '기획전명', planStatusCd: '기획전상태', planThemeCd: '테마코드',
    /* 주문 */
    orderAmt: '주문금액', dlivFee: '배송비', totalPayAmt: '총결제금액',
    receiverNm: '수령자명', zipCode: '우편번호', dlivAddr: '배송주소',
    orderItems: '주문항목(전송)',
    qty: '수량', unitPrice: '단가', rowAmt: '행금액',
    /* 클레임 */
    claimTypeCd: '클레임유형', reasonCd: '사유코드', claimStatusCd: '클레임상태',
    partialClaim: '부분클레임', refundRate: '환불비율(%)',
    /* 회원 */
    memberNm: '회원명', gradeCd: '등급코드', memberGender: '성별',
    empTypeCd: '재직유형', snsProvider: 'SNS제공자',
    emailVerifiedYn: '이메일인증여부', snsLinkYn: 'SNS연동여부',
    /* 사용자 */
    userNm: '사용자명', userEmail: '이메일', userPhone: '전화번호', userStatusCd: '사용자상태',
    /* 업체 */
    vendorNm: '업체명', ceoNm: '대표자명', vendorType: '업체유형',
    vendorPhone: '업체전화', vendorEmail: '업체이메일', corpNo: '사업자번호',
    vendorStatusCd: '업체상태', openDate: '개업일', contractDate: '계약일',
    /* 바우처 */
    erpVoucherTypeCd: '전표유형', erpVoucherStatusCd: '전표상태', erpVoucherDesc: '전표설명',
    voucherDate: '전표일자', totalDebitAmt: '총차변금액', totalCreditAmt: '총대변금액', settleYm: '정산년월',
  };

  /* 코드값 → 한글 코드명 매핑 */
  const _CODE_LABELS = {
    /* 판매유형 */
    NORMAL: '단품', OPTION: '옵션형', SET: '세트', BUNDLE: '묶음',
    /* 상품상태 */
    SELLING: '판매중', SOLDOUT: '품절', PAUSE: '판매중지', READY: '판매준비', DISCONTINUED: '단종',
    /* SKU상태 */
    SKU_SELLING: '판매중', SKU_SOLDOUT: '품절', SKU_STOP: '중지',
    /* 주문상태 */
    ORDER_PENDING: '결제대기', ORDER_PAID: '결제완료', ORDER_PREPARING: '상품준비중',
    ORDER_SHIPPED: '배송중', ORDER_DELIVERED: '배송완료', ORDER_COMPLETE: '구매확정', ORDER_CANCEL: '주문취소',
    PENDING: '결제대기', PAID: '결제완료', PREPARING: '상품준비중',
    SHIPPED: '배송중', DELIVERED: '배송완료', COMPLETE: '구매확정', CANCEL: '취소',
    /* 클레임유형 */
    CANCEL_REQ: '취소요청', RETURN_REQ: '반품요청', EXCHANGE_REQ: '교환요청',
    CANCEL_DONE: '취소완료', RETURN_DONE: '반품완료', EXCHANGE_DONE: '교환완료',
    /* 배송상태 */
    DLIV_READY: '출고준비', DLIV_ING: '배송중', DLIV_DONE: '배송완료',
    OUTBOUND: '출고', INBOUND: '입고(반품)',
    /* 결제수단 */
    CARD: '신용카드', VIRTUAL_ACCOUNT: '가상계좌', TRANSFER: '무통장입금',
    TOSS: '토스페이', KAKAO: '카카오페이', NAVER: '네이버페이', PHONE: '핸드폰결제',
    /* 회원상태 */
    ACTIVE: '정상', DORMANT: '휴면', SUSPENDED: '정지', WITHDRAWN: '탈퇴',
    /* 회원등급 */
    GRADE_BASIC: '일반', GRADE_SILVER: '실버', GRADE_GOLD: '골드', GRADE_VIP: 'VIP',
    BASIC: '일반', SILVER: '실버', GOLD: '골드', VIP: 'VIP',
    /* 공통 Y/N */
    Y: '예', N: '아니오',
    /* 입력유형 */
    SELECT: '선택형', TEXT: '텍스트', RADIO: '라디오',
    /* 플랜유형 */
    MONTHLY: '월간', YEARLY: '연간', ONETIME: '일회성',
    /* 쿠폰/할인유형 */
    RATE: '정률(%)', AMOUNT: '정액(원)', FREE_SHIP: '무료배송',
    /* 이벤트상태 */
    EVENT_ACTIVE: '진행중', EVENT_READY: '예정', EVENT_END: '종료',
    /* 적립금유형 */
    SAVE_PURCHASE: '구매적립', SAVE_REVIEW: '리뷰적립', SAVE_JOIN: '가입적립', SAVE_MANUAL: '수동지급',
    /* 바우처상태 */
    VOUCHER_UNUSED: '미사용', VOUCHER_USED: '사용완료', VOUCHER_EXPIRE: '만료',
  };

  /* 미리보기 테이블 키 고정 표시 순서 — 배열에 없는 키는 맨 뒤에 삽입 순서대로 */
  const _DISPLAY_KEY_ORDER = [
    /* 상품 */
    'prodNm', 'salePrice', 'purchasePrice', 'prodStock',
    'prodTypeCd', 'prodStatusCd', 'advrtStmt',
    'categoryId', 'siteId', 'dlivTmpltId', 'simulYn',
    'optTypeCd', 'prodOpts', '_preview_[prodOpts]', 'prodSkus', 'prodImages',
    'prodId',
    /* 회원 */
    'memberNm', 'loginId', 'memberEmail', 'memberPhone',
    'gradeCd', 'memberGender', 'empTypeCd', 'memberStatusCd',
    'snsProvider', 'emailVerifiedYn', 'snsLinkYn',
    'memberGradeId',
    /* 사용자 */
    'userNm', 'loginId', 'userEmail', 'userPhone', 'userStatusCd',
    'deptId', 'roleIds',
    /* 업체 */
    'vendorNm', 'ceoNm', 'vendorType',
    'vendorPhone', 'vendorEmail', 'corpNo',
    'vendorStatusCd', 'openDate', 'contractDate',
    /* 주문 */
    'memberId', 'orderStatusCd', 'payMethodCd',
    'orderAmt', 'dlivFee', 'totalPayAmt',
    'receiverNm', 'zipCode', 'addr1', 'addr2',
    '_preview_[orderItems]',
    /* 클레임 */
    'orderId', 'claimTypeCd', 'reasonCd', 'claimStatusCd',
    'partialClaim', 'refundRate',
    /* 기획전 */
    'planNm', 'planStatusCd', 'planThemeCd', 'startDate', 'endDate',
    '_preview_[items]',
    /* 이벤트 */
    'eventNm', 'eventTypeCd', 'eventStatusCd', 'benefitTypeCd', 'benefitAmt', 'winnerCount',
    /* 쿠폰 */
    'couponNm', 'couponCd', 'couponTypeCd', 'couponDiscTypeCd', 'discVal',
    'issueCount', 'scopeCd', 'prodIds', 'minOrderAmt', 'maxDiscAmt',
    /* 할인 */
    'discntNm', 'discntTypeCd', 'discntValTypeCd',
    /* 적립금 */
    'saveNm', 'savePurposeCd', 'saveRatePct', 'saveAmt',
    'saveDurationDays',
    /* 바우처 */
    'erpVoucherTypeCd', 'erpVoucherStatusCd', 'erpVoucherDesc',
    'voucherDate', 'totalDebitAmt', 'totalCreditAmt', 'settleYm', 'vendorId',
  ];
  const _KEY_ORDER_MAP = new Map(_DISPLAY_KEY_ORDER.map((k, i) => [k, i]));

  /* 코드값 → 코드명 조회 (필드키 + 값 조합으로 우선, 없으면 값만으로) */
  const _getCodeLabel = (fieldKey, val) => {
    if (val === null || val === undefined || typeof val === 'boolean') return '';
    const s = String(val);
    /* Y/N은 모든 *Yn 필드에만 적용 */
    if ((s === 'Y' || s === 'N') && fieldKey && !fieldKey.endsWith('Yn') && !fieldKey.endsWith('YN')) return '';
    return _CODE_LABELS[s] || '';
  };

  /* _preview_[actualKey]suffix 형식 파싱
   * _REAL_BODY_KEYS 에 있으면 "전송key" 배지 + bold, 없으면 "참고" 표시
   * e.g. "_preview_[couponBody]"          → isRealKey:true  (body 전체가 실제 전송)
   *      "_preview_[orderItems](3개)"      → isRealKey:true  (배열 key 실제 전송)
   *      "_preview_[items](5개)"           → isRealKey:true  (planBody items 배열)
   *      "_preview_[prodOpts]"             → isRealKey:true  (상품 prodOpts)
   *      "_preview_[optCategory]"          → isRealKey:false (참고용 프리셋 정보)
   *      "_preview_[prodSkus](3건)"        → isRealKey:false (백엔드 자동생성 참고)
   */
  /* 실제 body에 전송되는 최상위 key (또는 body 자체를 나타내는 xxxBody 패턴) */
  const _REAL_BODY_KEYS = new Set([
    /* 상품 시뮬 */
    'prodOpts', 'prodImages',
    /* 도메인 body 전체 전송 (VoUtil.mapCopy(body, entity)) */
    'couponBody', 'discntBody', 'saveBody', 'eventBody', 'planBody',
    'memberBody', 'orderBody', 'claimBody', 'userBody', 'vendorBody', 'voucherBody',
    /* 배열 필드 */
    'orderItems', 'addProdIds', 'items',
    /* 혼합 */
    'claimItems', 'dlivItems', 'payMethods', 'members', 'prods',
  ]);
  /* prodOpts[].prodOpts 의 실제 전송 필드명 — pd_prod_opt Entity 기준 (구 pd_prod_opt_item) */
  const _REAL_OPT_ITEM_FIELDS = new Set(['prodOptId', 'prodOptNm', 'prodOptVal', 'optValCodeId', 'parentProdOptId', 'optStyle', 'sortOrd', 'useYn']);
  /* prodOpts[] 의 실제 전송 필드명 — pd_prod_opt_type Entity 기준 (구 pd_prod_opt) */
  const _REAL_OPT_GRP_FIELDS  = new Set(['prodOptTypeNm', 'prodOptTypeLevel', 'prodOptInputTypeCd', 'sortOrd', 'prodOpts']);
  const _parsePreviewKey = (k) => {
    if (!k.startsWith('_preview_')) return null;
    const rest = k.slice('_preview_'.length); // e.g. "[prodOpts](6건)" or "optCategory"
    const m = rest.match(/^\[([^\]]+)\](.*)/);
    if (m) {
      const inner = m[1];
      const suffix = m[2] || '';
      const isRealKey = _REAL_BODY_KEYS.has(inner);
      return { displayKey: inner + suffix, innerKey: inner, suffix, isRealKey };
    }
    /* 구형 키 ([] 없음) — 참고용으로 처리 */
    return { displayKey: rest, innerKey: null, suffix: '', isRealKey: false };
  };

  window.ZdPreviewTable = {
    name: 'ZdPreviewTable',
    props: { data: { default: null } },
    computed: {
      isArray()  { return Array.isArray(this.data); },
      isObject() { return this.data !== null && typeof this.data === 'object' && !Array.isArray(this.data); },
      isPrim()   { return !this.isArray && !this.isObject; },
      objEntries() {
        if (!this.isObject) return [];
        const MAX_ORDER = _DISPLAY_KEY_ORDER.length;
        /* _preview_[xxx]... 키의 정렬 기준: 내부 xxx 키의 순서를 따름 */
        const _sortKey = (k) => {
          if (k.startsWith('_preview_')) {
            const m = k.match(/^\[([^\]]+)\]/);
            const inner = m ? m[1] : k;
            const idx = _KEY_ORDER_MAP.get(inner);
            return idx !== undefined ? idx + 0.5 : MAX_ORDER + 0.5;
          }
          const idx = _KEY_ORDER_MAP.get(k);
          return idx !== undefined ? idx : MAX_ORDER;
        };
        return Object.entries(this.data)
          .filter(([k]) => !k.startsWith('_hide_'))
          .sort(([a], [b]) => _sortKey(a) - _sortKey(b))
          .map(([k, v]) => {
            const isPreview = k.startsWith('_preview_');
            const parsed = isPreview ? _parsePreviewKey(k) : null;
            return {
              key: k,
              isPreview,
              parsed,  /* { displayKey, innerKey, suffix, isRealKey } or null */
              label: _FIELD_LABELS[k] || '',
              codeLabel: (v === null || typeof v === 'object') ? '' : _getCodeLabel(k, v),
              isArr: Array.isArray(v),
              isObj: v !== null && typeof v === 'object' && !Array.isArray(v),
              isPrim: v === null || typeof v !== 'object',
              val: v,
            };
          });
      },
    },
    methods: {
      colLabel(k) { return _FIELD_LABELS[k] || ''; },
      cellCodeLabel(k, v) { return _getCodeLabel(k, v); },
      cellDisplay(k, v) {
        if (v === null) return 'null';
        const s = String(v);
        const cd = _getCodeLabel(k, v);
        return cd ? s + '  (' + cd + ')' : s;
      },
    },
    template: `
<div>
  <!-- primitive (최상위가 원시값인 경우) -->
  <span v-if="isPrim" style="font-family:monospace;font-size:10px;color:#334155;">{{ data === null ? 'null' : String(data) }}</span>

  <!-- object → 3열 표: 키 | 값 | 한글명 -->
  <table v-else-if="isObject" style="width:100%;border-collapse:collapse;font-size:10px;table-layout:fixed;">
    <colgroup>
      <col style="width:150px;" />
      <col />
      <col style="width:70px;" />
    </colgroup>
    <tbody>
      <tr v-for="e in objEntries" :key="e.key">
        <!-- 열1: 키
             - 실제 전송 key (_preview_[xxx] where xxx is real): 오렌지 bold + 실선 밑줄
             - 참고용 preview (_preview_[xxx] where xxx is ref): 오렌지 normal
             - 실제 body key (non-preview): 보라 bold -->
        <td style="padding:2px 6px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #ede9fe;line-height:1.4;">
          <template v-if="e.isPreview &amp;&amp; e.parsed">
            <span v-if="e.parsed.isRealKey" style="font-weight:700;color:#b45309;text-decoration:underline;text-underline-offset:2px;">{{ e.parsed.displayKey }}</span>
            <span v-else style="font-weight:400;color:#d97706;">{{ e.parsed.displayKey }}</span>
            <span v-if="e.parsed.isRealKey" style="font-size:8px;color:#92400e;margin-left:3px;font-weight:600;background:#fef3c7;border:1px solid #fbbf24;border-radius:2px;padding:0 3px;">전송key</span>
            <span v-else style="font-size:8px;color:#b45309;margin-left:3px;font-weight:400;">참고</span>
          </template>
          <template v-else>
            <span style="font-weight:700;color:#6d28d9;">{{ e.key }}</span>
          </template>
        </td>
        <!-- 열2: 값 (배열/중첩객체는 colspan=2로 한글명 열 흡수) -->
        <td v-if="e.isArr" colspan="2" style="padding:2px 6px;border-bottom:1px solid #ede9fe;line-height:1.4;">
          <span v-if="!e.val.length" style="color:#94a3b8;font-style:italic;">[]</span>
          <div v-else style="overflow-x:auto;margin-top:1px;">
            <table style="border-collapse:collapse;font-size:10px;width:100%;">
              <thead>
                <tr style="background:#ede9fe;">
                  <th v-for="k in Object.keys(e.val[0]||{})" :key="k"
                    :style="'padding:2px 6px;text-align:left;white-space:nowrap;border:1px solid #c4b5fd;line-height:1.4;' + (e.parsed &amp;&amp; e.parsed.isRealKey ? 'font-weight:700;color:#1e1b4b;' : 'font-weight:400;color:#6d28d9;')">
                    {{ k }}<span v-if="colLabel(k)" style="color:#a78bfa;font-weight:400;font-size:9px;margin-left:3px;">({{ colLabel(k) }})</span>
                  </th>
                  <th v-if="typeof e.val[0] !== 'object' || e.val[0]===null"
                    style="padding:2px 6px;text-align:left;font-weight:600;color:#5b21b6;border:1px solid #c4b5fd;">값</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row,ri) in e.val" :key="ri" :style="ri%2===1?'background:#f5f3ff;':''">
                  <template v-if="row !== null && typeof row === 'object' && !Array.isArray(row)">
                    <td v-for="k in Object.keys(row)" :key="k"
                      :style="(row[k] !== null && typeof row[k] === 'object') ? 'padding:2px 4px;border:1px solid #ddd6fe;vertical-align:top;' : 'padding:2px 6px;border:1px solid #ddd6fe;font-family:monospace;color:#1e1b4b;line-height:1.4;white-space:nowrap;'">
                      <!-- prodOpts 배열: 인라인 그리드로 펼침 (pd_prod_opt, 구 pd_prod_opt_item) -->
                      <template v-if="k === 'prodOpts' && Array.isArray(row[k]) && row[k].length">
                        <table style="border-collapse:collapse;font-size:10px;min-width:320px;">
                          <thead>
                            <tr style="background:#d1fae5;">
                              <th v-for="ik in Object.keys(row[k][0]||{})" :key="ik"
                                :style="'padding:2px 6px;text-align:left;white-space:nowrap;border:1px solid #6ee7b7;line-height:1.4;' + (e.parsed &amp;&amp; e.parsed.isRealKey ? 'font-weight:700;color:#064e3b;' : 'font-weight:400;color:#065f46;')">
                                {{ ik }}<span v-if="colLabel(ik)" style="color:#10b981;font-weight:400;font-size:9px;margin-left:3px;">({{ colLabel(ik) }})</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(irow,iri) in row[k]" :key="iri" :style="iri%2===1?'background:#ecfdf5;':''">
                              <td v-for="ik in Object.keys(irow)" :key="ik"
                                style="padding:2px 6px;border:1px solid #6ee7b7;font-family:monospace;color:#064e3b;line-height:1.4;white-space:nowrap;">
                                {{ irow[ik] === null ? 'null' : String(irow[ik]) }}<span v-if="cellCodeLabel(ik, irow[ik])" style="color:#059669;font-size:9px;font-weight:600;margin-left:4px;font-family:sans-serif;">({{ cellCodeLabel(ik, irow[ik]) }})</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </template>
                      <template v-else-if="row[k] !== null && typeof row[k] === 'object'">
                        <zd-preview-table :data="row[k]" />
                      </template>
                      <template v-else>{{ row[k] === null ? 'null' : String(row[k]) }}<span v-if="cellCodeLabel(k, row[k])" style="color:#7c3aed;font-size:9px;font-weight:600;margin-left:4px;font-family:sans-serif;">({{ cellCodeLabel(k, row[k]) }})</span></template>
                    </td>
                  </template>
                  <td v-else style="padding:2px 6px;border:1px solid #ddd6fe;font-family:monospace;color:#1e1b4b;line-height:1.4;">{{ row === null ? 'null' : String(row) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </td>
        <td v-else-if="e.isObj" colspan="2" style="padding:2px 6px;border-bottom:1px solid #ede9fe;line-height:1.4;">
          <zd-preview-table :data="e.val" />
        </td>
        <!-- primitive: 열2=값, 열3=필드명·코드명 -->
        <template v-else>
          <td style="padding:2px 6px;border-bottom:1px solid #ede9fe;color:#1e293b;font-family:monospace;line-height:1.4;">{{ e.val === null ? 'null' : String(e.val) }}</td>
          <td style="padding:2px 6px;border-bottom:1px solid #ede9fe;white-space:nowrap;line-height:1.4;">
            <span v-if="e.label" style="color:#9ca3af;font-size:9px;">{{ e.label }}</span>
            <span v-if="e.codeLabel" :style="e.label ? 'color:#7c3aed;font-size:9px;margin-left:3px;font-weight:600;' : 'color:#7c3aed;font-size:9px;font-weight:600;'">{{ e.label ? '· ' : '' }}{{ e.codeLabel }}</span>
          </td>
        </template>
      </tr>
    </tbody>
  </table>

  <!-- 최상위가 배열인 경우 -->
  <div v-else-if="isArray" style="overflow-x:auto;">
    <div v-for="(item,i) in data" :key="i" style="margin-bottom:6px;">
      <div style="font-size:9px;color:#7c3aed;font-weight:600;margin-bottom:2px;">[{{ i }}]</div>
      <zd-preview-table :data="item" />
    </div>
  </div>
</div>`,
  };

  /* ─────────────────────────────────────────────────────────────────────
     ZdSimulPreviewModal
     전송 데이터 JSON 미리보기 모달
  ─────────────────────────────────────────────────────────────────────── */
  window.ZdSimulPreviewModal = {
    name: 'ZdSimulPreviewModal',
    emits: ['close'],
    props: {
      show: { type: Boolean, default: false },
      json: { type: String, default: '' },
    },
    template: `
<bo-modal :show="show" title="전송 데이터 미리보기" @close="$emit('close')" box-style="max-width:760px;width:90vw;">
  <div style="background:#1e1e2e;border-radius:6px;padding:12px 14px;max-height:60vh;overflow-y:auto;
    font-family:monospace;font-size:12px;line-height:1.7;color:#a5f3fc;white-space:pre;word-break:break-all;">{{ json }}</div>
  <div style="margin-top:12px;font-size:11px;color:#94a3b8;">
    ※ API 호출 없이 생성될 파라미터만 미리 확인합니다. <code>previewOnly: true</code> 플래그로 실행됩니다.
  </div>
</bo-modal>`,
  };

})();

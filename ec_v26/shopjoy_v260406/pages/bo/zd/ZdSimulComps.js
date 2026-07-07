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
      const { ref: _ref } = Vue;
      const cfHasStats = computed(() => props.state.totalRun > 0 || props.cfIsRunning);
      const onStart   = () => emit('start');
      const onStop    = () => emit('stop');
      const onRunOnce = () => emit('run-once');
      const lastExpanded = _ref(false);
      const onToggleLast = () => { lastExpanded.value = !lastExpanded.value; };

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

      return { cfHasStats, onStart, onStop, onRunOnce, PRESETS, onPreset, lastExpanded, onToggleLast };
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
      <button class="btn btn_preview" style="padding:3px 9px;font-size:12px;" @click="onRunOnce">⚡ 1회</button>
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

    <!-- 마지막 생성 정보 (펼치기/접기 JSON 뷰) -->
    <div v-if="state.lastCreated &amp;&amp; state.lastCreated.length" style="flex:1;min-width:0;">
      <div @click="onToggleLast"
        style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:#6366f1;user-select:none;padding:2px 6px;border-radius:4px;border:1px solid #c7d2fe;background:#eef2ff;">
        <span>{{ lastExpanded ? '▲' : '▼' }}</span>
        <span>최근 결과 {{ state.lastCreated.length }}건</span>
      </div>
      <div v-if="lastExpanded"
        style="margin-top:4px;background:#1e1e2e;border-radius:6px;border:1px solid #374151;padding:8px 10px;max-height:260px;overflow-y:auto;font-family:monospace;font-size:11px;line-height:1.6;color:#a5f3fc;white-space:pre;word-break:break-all;">{{ JSON.stringify(state.lastCreated, null, 2) }}</div>
    </div>
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
      pager:     { type: Object,   default: () => ({ pageNo: 1, pageTotalCount: 0, pageTotalPage: 1 }) },
      logSearch: { type: Object,   default: () => ({ uiNm: '', userNm: '', desc: '', status: '' }) },
    },
    setup(props, { emit }) {
      const cfPageNums = _computed(() => {
        const total = props.pager.pageTotalPage || 1, cur = props.pager.pageNo || 1;
        const start = Math.max(1, cur - 2), end = Math.min(total, start + 4);
        const nums = [];
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
      });
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
        cfPageNums, onClear, onSetPage, onSearch,
        expandedId, onToggleExpand, isExpanded, parseDesc,
        cfDomainMeta, onOpenBo, onOpenFo, onOpenFoLogin, onOpenFoProfile, onOpenKanban,
        onOpenCalc, calcModal,
      };
    },
    template: `
<div class="card" style="padding:14px 16px;">
  <!-- 카드 헤더 -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div class="list-title" style="margin:0;">📋 실행 로그</div>
    <button class="btn btn_reset" @click="onClear">새로고침</button>
  </div>

  <!-- 검색 바 -->
  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-size:11px;color:#94a3b8;font-weight:600;">● 목록 총 {{ pager.pageTotalCount }}건</span>
    <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;">
      <input v-model="logSearch.uiNm" type="text" placeholder="화면명" @keyup.enter="onSearch"
        style="width:110px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <input v-model="logSearch.userNm" type="text" placeholder="등록자" @keyup.enter="onSearch"
        style="width:80px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
      <input v-model="logSearch.desc" type="text" placeholder="내용" @keyup.enter="onSearch"
        style="width:120px;height:26px;padding:0 7px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;outline:none;color:#334155;" />
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
    <table class="admin-table" style="font-size:11px;width:100%;">
      <thead><tr>
        <th style="width:28px;"></th>
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
            <td style="text-align:center;color:#94a3b8;">{{ (pager.pageNo-1)*10 + idx + 1 }}</td>
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
  <div v-if="pager.pageTotalPage > 1" class="pagination" style="margin-top:10px;display:flex;justify-content:center;align-items:center;gap:4px;">
    <button class="pager" @click="onSetPage(1)" :disabled="pager.pageNo===1">&laquo;</button>
    <button class="pager" @click="onSetPage(pager.pageNo-1)" :disabled="pager.pageNo===1">&lsaquo;</button>
    <button v-for="n in cfPageNums" :key="n" class="pager"
      :class="n===pager.pageNo ? 'active' : ''"
      @click="onSetPage(n)">{{ n }}</button>
    <button class="pager" @click="onSetPage(pager.pageNo+1)" :disabled="pager.pageNo===pager.pageTotalPage">&rsaquo;</button>
    <button class="pager" @click="onSetPage(pager.pageTotalPage)" :disabled="pager.pageNo===pager.pageTotalPage">&raquo;</button>
    <span style="font-size:11px;color:#94a3b8;margin-left:6px;">{{ pager.pageNo }}/{{ pager.pageTotalPage }} 페이지</span>
  </div>

  <!-- 클레임 계산 모달 -->
  <od-claim-calc-modal :show="calcModal.show" :claim-id="calcModal.claimId" @close="calcModal.show=false" />
</div>`,
  };

})();

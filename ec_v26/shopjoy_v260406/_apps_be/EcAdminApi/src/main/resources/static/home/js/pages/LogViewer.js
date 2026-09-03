/* LogViewer.js — 로그뷰어 화면. shell(index.html)의 main 프레임에 <log-viewer> 로 임베드된다.
 * EcCdnApi 의 js/pages/CfLogViewer.js 를 그대로 참고해 포팅했다(요청사항: "EcCdnApi 프로그램
 * 참고해줘"). 인증없이 누구나 조회 가능(요청사항) — /api/co/** 전체가 permitAll.
 * 일반 로그(ecadminapi.log) / 에러 로그(ecadminapi-error.log) 탭 전환 + 줄수 선택 + 자동새로고침 +
 * 클라이언트측 레벨/키워드 필터.
 */
window.LogViewer = {
  setup() {
    const { reactive, ref, onMounted, onBeforeUnmount, nextTick } = Vue;

    // 1) ref/reactive
    const uiState = reactive({
      fileKey: 'app', lines: 200, autoRefresh: false, autoScroll: true,
      levelFilter: 'ALL', keyword: '', loading: false,
    });
    const fileInfoList = reactive({ list: [] });
    const logState = reactive({ fileName: '', exists: true, returnedLines: 0, raw: [] });
    const logBoxEl = ref(null);
    let timer = null;

    // 2) fn* 순수 유틸
    const LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    const fnLevelOf = (line) => {
      for (const lv of LEVELS) { if (lv !== 'ALL' && line.includes(' ' + lv + ' ')) return lv; }
      return '';
    };
    const fnLevelClass = (lv) => (lv === 'ERROR' ? 'log-line-error' : lv === 'WARN' ? 'log-line-warn' : '');
    const cfFilteredLines = () => {
      let arr = logState.raw;
      if (uiState.levelFilter !== 'ALL') arr = arr.filter((l) => fnLevelOf(l) === uiState.levelFilter);
      if (uiState.keyword.trim()) {
        const kw = uiState.keyword.trim().toLowerCase();
        arr = arr.filter((l) => l.toLowerCase().includes(kw));
      }
      return arr;
    };

    // 3) 조회
    const fnLoadFileInfo = async () => {
      try {
        fileInfoList.list = await logAuth.logApi('/api/co/log/files');
      } catch (e) { logAuth.showToast(e.message, true); }
    };
    const fnLoadTail = async () => {
      uiState.loading = true;
      try {
        const qs = new URLSearchParams({ file: uiState.fileKey, lines: uiState.lines });
        const data = await logAuth.logApi('/api/co/log/tail?' + qs.toString());
        logState.fileName = data.fileName;
        logState.exists = data.exists;
        logState.returnedLines = data.returnedLines;
        logState.raw = data.lines || [];
        if (uiState.autoScroll) {
          await nextTick();
          if (logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
        }
      } catch (e) {
        logAuth.showToast(e.message, true);
      } finally {
        uiState.loading = false;
      }
    };
    const fnRefreshAll = () => Promise.all([fnLoadFileInfo(), fnLoadTail()]);

    // 4) 이벤트 핸들러(on*)
    const onSelectFile = (key) => { uiState.fileKey = key; fnLoadTail(); };
    const onLinesChange = () => fnLoadTail();
    const onRefresh = () => fnRefreshAll();
    const onSelectLevel = (lv) => { uiState.levelFilter = lv; };
    const onToggleAutoRefresh = () => {
      if (uiState.autoRefresh) fnStartAuto(); else fnStopAuto();
    };
    function fnStartAuto() {
      fnStopAuto();
      timer = setInterval(fnLoadTail, 5000);
    }
    function fnStopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // 5) onMounted / onBeforeUnmount
    const initPage = async () => {
      await fnRefreshAll();
    };
    onMounted(initPage);
    onBeforeUnmount(fnStopAuto);

    return {
      uiState, fileInfoList, logState, logBoxEl, LEVELS,
      fnLevelOf, fnLevelClass, cfFilteredLines,
      onSelectFile, onLinesChange, onRefresh, onSelectLevel, onToggleAutoRefresh,
    };
  },
  template: `
    <div>
      <div class="page-title">🪵 로그뷰어 <span style="font-size:12px;color:#999;font-weight:400;">— ecadminapi.log / ecadminapi-error.log (인증 불필요)</span></div>

      <!-- ① 파일 선택 + 정보 -->
      <div class="card">
        <div class="search-bar">
          <button class="btn" :class="uiState.fileKey === 'app' ? 'btn_search' : 'btn_reset'" @click="onSelectFile('app')">일반 로그</button>
          <button class="btn" :class="uiState.fileKey === 'error' ? 'btn_search' : 'btn_reset'" @click="onSelectFile('error')">에러 로그</button>
          <span style="flex:1"></span>
          <select class="form-control" style="width:auto;" v-model.number="uiState.lines" @change="onLinesChange">
            <option :value="100">100줄</option>
            <option :value="200">200줄</option>
            <option :value="500">500줄</option>
            <option :value="1000">1000줄</option>
            <option :value="2000">2000줄</option>
          </select>
          <button class="btn btn_search" :disabled="uiState.loading" @click="onRefresh">{{ uiState.loading ? '조회 중...' : '새로고침' }}</button>
        </div>
        <div style="font-size:12px;color:#999;margin-top:6px;">
          <span v-for="f in fileInfoList.list" :key="f.key" style="margin-right:16px;">
            {{ f.label }}({{ f.fileName }}): {{ f.exists ? (f.sizeLabel + ' · ' + (f.lastModified || '-')) : '파일 없음' }}
          </span>
        </div>
      </div>

      <!-- ② 필터 -->
      <div class="card">
        <div class="search-bar">
          <button v-for="lv in LEVELS" :key="lv" class="btn btn-sm"
            :class="uiState.levelFilter === lv ? 'btn_search' : 'btn_reset'"
            @click="onSelectLevel(lv)">{{ lv }}</button>
          <input type="text" class="form-control" style="max-width:260px;" v-model="uiState.keyword" placeholder="키워드 필터(화면 표시만, 클라이언트측)" />
          <span style="flex:1"></span>
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="checkbox" v-model="uiState.autoScroll" /> 자동 스크롤
          </label>
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="checkbox" v-model="uiState.autoRefresh" @change="onToggleAutoRefresh" /> 자동 새로고침(5초)
          </label>
        </div>
      </div>

      <!-- ③ 로그 본문 -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-count">{{ logState.fileName }} — 조회 {{ logState.returnedLines }}줄 중 표시 {{ cfFilteredLines().length }}줄</span>
        </div>
        <div v-if="!logState.exists" class="empty-hint">로그 파일이 아직 없습니다.</div>
        <pre v-else ref="logBoxEl" class="log-box"><span v-for="(line, idx) in cfFilteredLines()" :key="idx" :class="fnLevelClass(fnLevelOf(line))">{{ line }}
</span></pre>
      </div>
    </div>
  `,
};

/* LogViewer.js — 로그뷰어 화면. shell(index.html)의 main 프레임에 <log-viewer> 로 임베드된다.
 * EcCdnApi 의 js/pages/CfLogViewer.js 를 그대로 참고해 포팅했다(요청사항: "EcCdnApi 프로그램
 * 참고해줘"). 인증없이 누구나 조회 가능(요청사항) — /api/co/** 전체가 permitAll.
 * 일반 로그(ecbebo.log) / 에러 로그(ecbebo-error.log) 탭 전환 + 줄수 선택 + 자동새로고침 +
 * 클라이언트측 레벨/키워드 필터.
 *
 * 2026-09-06: <bo-page>(제목) + <bo-container>(카드 영역) + <bo-grid>(파일 정보 목록) 로
 * 재구성(요청사항: "<bo-grid <bo-form <bo-page 이런거 최대한 활용해줘").
 *
 * 2026-09-06 (2차): CfLogViewer.js 와 동일하게 아래 요청사항 반영 —
 *   1) "좌측에 파일목록 tree 형식으로" — 파일선택 bo-grid(표) 를 좌측 사이드 tree(.folder-item)
 *      로 교체. 2단 그리드(.log-viewer-2col).
 *   2) "스크롤 내리면 다음, 다음" + "하단에 더보기 버튼" — 로그 본문을 CHUNK(300줄)씩 점진
 *      렌더. "자동 스크롤" 이 켜져 있을 때만 예외적으로 전체를 렌더한다.
 *   3) "검색기능" — 일치 부분을 <mark> 로 강조 표시(fnHighlightHtml, XSS 방지 escape 포함).
 *   4) "검색어 템플릿" — 자주 찾는 키워드를 칩 버튼으로 제공(SEARCH_TEMPLATES).
 *
 * 2026-09-06 (3차): 아래 요청사항 추가 반영 —
 *   5) "파일선택 란 tree 형식으로" + "logs 경로부터 트리로" — 좌측을 진짜 트리(펼침/접힘 가능한
 *      루트 폴더 노드 + 그 아래 파일 2개)로. 루트 라벨은 /api/co/log/files 응답의 fullPath 에서
 *      파일명을 뗀 실제 디스크 경로(fnDirPath).
 *   6) "로그파일 full 경로 표시해줘" — 로그 본문 카드 맨 위에 현재 파일의 절대경로 한 줄 표시.
 *   7) "더보기 버튼도 추가해줘" + "스크롤되면 다음정보 자동조회해줘" — 더보기 버튼을 항상
 *      노출(더 없으면 비활성화 텍스트로 안내)하고, 로컬에 이미 받은 게 남아있으면 그것부터
 *      펼치고 없으면 lines 단계를 올려(200→500→1000→2000) 서버에 재조회한다. 로그박스 스크롤이
 *      바닥에 닿으면 같은 로직이 자동 실행된다(onLogScroll → onLoadMore).
 */
window.LogViewer = {
  setup() {
    const { reactive, ref, onMounted, onBeforeUnmount, nextTick } = Vue;

    const CHUNK = 300; // 한 번에 그리는/추가하는 줄 수(요청사항: 스크롤·더보기로 점진 로딩)
    const LINE_TIERS = [100, 200, 500, 1000, 2000]; // 줄수 선택 옵션과 동일 — 서버측 "더보기" 단계
    // 검색어 템플릿(요청사항) — EcAdminApi 로그에 자주 등장하는 패턴 위주.
    const SEARCH_TEMPLATES = [
      { label: 'ERROR 전체', kw: 'ERROR' },
      { label: 'WARN 전체', kw: 'WARN' },
      { label: 'Exception', kw: 'Exception' },
      { label: '인증 실패', kw: '토큰이 유효하지 않습니다' },
      { label: 'Redis 연결', kw: 'Redis' },
      { label: 'Connection refused', kw: 'Connection refused' },
      { label: '기동 로그', kw: 'Started EcBeBoApplication' },
      { label: 'SQL', kw: 'SQLException' },
    ];

    // 1) ref/reactive
    const uiState = reactive({
      fileKey: 'app', lines: 200, autoRefresh: false, autoScroll: true,
      levelFilter: 'ALL', keyword: '', loading: false, treeOpen: true,
    });
    const fileInfoList = reactive({ list: [] });
    const logState = reactive({ fileName: '', fullPath: '', exists: true, returnedLines: 0, raw: [], displayCount: CHUNK });
    const logBoxEl = ref(null);
    let timer = null;

    // 2) fn* 순수 유틸
    const LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    const fnLevelOf = (line) => {
      for (const lv of LEVELS) { if (lv !== 'ALL' && line.includes(' ' + lv + ' ')) return lv; }
      return '';
    };
    const fnLevelClass = (lv) => (lv === 'ERROR' ? 'log-line-error' : lv === 'WARN' ? 'log-line-warn' : '');
    // 클라이언트측 필터(레벨+키워드) — 실 요청 파라미터가 아니라 화면 표시만 걸러낸다.
    const cfFilteredLines = () => {
      let arr = logState.raw;
      if (uiState.levelFilter !== 'ALL') arr = arr.filter((l) => fnLevelOf(l) === uiState.levelFilter);
      if (uiState.keyword.trim()) {
        const kw = uiState.keyword.trim().toLowerCase();
        arr = arr.filter((l) => l.toLowerCase().includes(kw));
      }
      return arr;
    };
    // 점진 렌더용 — 필터링된 결과 중 현재까지 "펼친" 만큼만 반환.
    const fnVisibleLines = () => cfFilteredLines().slice(0, logState.displayCount);
    // 이미 받아온(클라이언트) 배열 안에서 더 펼칠 게 남았는지.
    const fnHasMoreLocal = () => logState.displayCount < cfFilteredLines().length;
    // 서버에 더 요청해볼 여지가 있는지 — "돌려받은 줄 수 >= 요청한 줄 수"면 파일에 그보다
    // 더 있을 수 있다는 뜻(꽉 채워서 돌아옴). 이미 파일 전체보다 적게 왔으면(=파일 끝에 도달)
    // lines 를 올려봐야 결과가 똑같으므로 더 요청하지 않는다.
    const fnNextTier = () => LINE_TIERS.find((t) => t > uiState.lines);
    const fnHasMoreServer = () => logState.returnedLines >= uiState.lines && !!fnNextTier();
    // 요청사항: "더보기 버튼도 추가해줘" + "스크롤되면 다음정보 자동조회해줘" — 로컬에 더 있으면
    // 그것부터 펼치고, 로컬을 다 펼쳤는데도 서버에 더 있을 수 있으면 lines 단계를 올려 재조회.
    const fnHasMore = () => fnHasMoreLocal() || fnHasMoreServer();
    // full=true 면 전부 펼침(자동스크롤 모드), false 면 첫 CHUNK 줄만(점진 로딩 시작점).
    const fnResetDisplay = (full) => {
      logState.displayCount = full ? cfFilteredLines().length : Math.min(CHUNK, cfFilteredLines().length);
    };
    // 검색 강조(mark) — 로그 원문에 사용자 입력이 그대로 남는 경우가 있어 v-html 삽입 전 반드시
    // HTML escape 후 강조 태그를 씌운다(XSS 방지).
    const fnEscapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    // 줄 끝에 실제 개행문자를 붙여서 반환한다(v-html 로 삽입되므로, 템플릿 쪽 attribute 문자열
    // 안에서 '\n' 을 또 이스케이프하는 혼란을 피하려고 여기 JS 함수 안에서 미리 붙여둔다).
    const fnHighlightHtml = (line) => {
      const esc = fnEscapeHtml(line);
      const kw = uiState.keyword.trim();
      if (!kw) return esc + '\n';
      const escKw = fnEscapeHtml(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return esc.replace(new RegExp(escKw, 'gi'), (m) => `<mark>${m}</mark>`) + '\n';
    };
    // 좌측 tree 항목에 표시할 "70.5KB · 2026-09-05 03:52" 같은 부가정보.
    const fnFileMeta = (key) => {
      const row = fileInfoList.list.find((r) => r.key === key);
      if (!row) return '조회 중...';
      if (!row.exists) return '파일 없음';
      return `${row.sizeLabel} · ${row.lastModified || '-'}`;
    };
    // tree 루트 라벨(요청사항: "logs 경로부터 트리로") — 파일 목록 응답의 fullPath 에서 파일명을
    // 뗀 디렉터리 부분. local(logDir="logs" 상대경로)이든 NAS(절대경로)든 실제 디스크 위치 그대로.
    const fnDirPath = () => {
      const row = fileInfoList.list.find((r) => r.fullPath);
      if (!row) return '로그 폴더';
      const idx = Math.max(row.fullPath.lastIndexOf('/'), row.fullPath.lastIndexOf('\\'));
      return idx > -1 ? row.fullPath.slice(0, idx) : row.fullPath;
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
        logState.fullPath = data.fullPath || '';
        logState.exists = data.exists;
        logState.returnedLines = data.returnedLines;
        logState.raw = data.lines || [];
        fnResetDisplay(uiState.autoScroll);
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
    const onSelectLevel = (lv) => { uiState.levelFilter = lv; fnResetDisplay(uiState.autoScroll); };
    const onKeywordInput = () => fnResetDisplay(uiState.autoScroll);
    const onClearKeyword = () => { uiState.keyword = ''; fnResetDisplay(uiState.autoScroll); };
    const onApplyTemplate = (tpl) => { uiState.keyword = tpl.kw; fnResetDisplay(uiState.autoScroll); };
    const onToggleAutoRefresh = () => {
      if (uiState.autoRefresh) fnStartAuto(); else fnStopAuto();
    };
    const onToggleAutoScroll = async () => {
      fnResetDisplay(uiState.autoScroll);
      if (uiState.autoScroll) {
        await nextTick();
        if (logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
      }
    };
    // 더보기(버튼) + 스크롤이 바닥에 닿으면 자동조회(요청사항: "더보기 버튼도 추가해줘" /
    // "내용 마지막에 스크롤되면 다음정보 자동조회해줘") — 로컬에 이미 받아온 게 더 있으면 그것부터
    // 펼치고(빠름, 재조회 없음), 그것도 다 펼쳤는데 서버에 더 있을 수 있으면 lines 단계를 올려
    // 재조회한다(예: 200줄 → 500줄 → 1000줄 → 2000줄, 최대치).
    const onLoadMore = async () => {
      if (fnHasMoreLocal()) {
        logState.displayCount = Math.min(logState.displayCount + CHUNK, cfFilteredLines().length);
        return;
      }
      const next = fnNextTier();
      if (fnHasMoreServer() && next) {
        uiState.lines = next;
        await fnLoadTail();
      }
    };
    const onLogScroll = (e) => {
      const el = e.target;
      if (fnHasMore() && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) onLoadMore();
    };
    const onToggleTree = () => { uiState.treeOpen = !uiState.treeOpen; };
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
      uiState, fileInfoList, logState, logBoxEl, LEVELS, SEARCH_TEMPLATES,
      fnLevelOf, fnLevelClass, cfFilteredLines, fnVisibleLines, fnHasMore, fnHasMoreLocal, fnNextTier,
      fnHighlightHtml, fnFileMeta, fnDirPath,
      onSelectFile, onLinesChange, onRefresh, onSelectLevel, onKeywordInput, onClearKeyword,
      onApplyTemplate, onToggleAutoRefresh, onToggleAutoScroll, onLoadMore, onLogScroll, onToggleTree,
    };
  },
  template: `
    <div>
      <bo-page title="🪵 로그뷰어" desc-summary="ecbebo.log / ecbebo-error.log (인증 불필요)" />

      <div class="log-viewer-2col">
        <!-- ① 좌측 파일 tree(요청사항: "logs 경로부터 트리로") -->
        <bo-container title="파일 선택" class="log-file-tree">
          <div class="folder-item folder-year" style="cursor:pointer;" @click="onToggleTree" :title="fnDirPath()">
            {{ uiState.treeOpen ? '📂' : '📁' }} {{ fnDirPath() }}
          </div>
          <div v-show="uiState.treeOpen" style="padding-left:12px;">
            <div class="folder-item" :class="uiState.fileKey === 'app' ? 'active' : ''" @click="onSelectFile('app')">
              📄 일반 로그
              <span class="meta">{{ fnFileMeta('app') }}</span>
            </div>
            <div class="folder-item" :class="uiState.fileKey === 'error' ? 'active' : ''" @click="onSelectFile('error')">
              📄 에러 로그
              <span class="meta">{{ fnFileMeta('error') }}</span>
            </div>
          </div>
        </bo-container>

        <!-- ② 우측: 검색/필터 + 로그 본문 -->
        <div>
          <bo-container title="검색 · 필터">
            <template #toolbar-actions>
              <select class="form-control" style="width:auto;" v-model.number="uiState.lines" @change="onLinesChange">
                <option :value="100">100줄</option>
                <option :value="200">200줄</option>
                <option :value="500">500줄</option>
                <option :value="1000">1000줄</option>
                <option :value="2000">2000줄</option>
              </select>
              <button class="btn btn_search" :disabled="uiState.loading" @click="onRefresh">{{ uiState.loading ? '조회 중...' : '새로고침' }}</button>
            </template>
            <div class="search-bar">
              <button v-for="lv in LEVELS" :key="lv" class="btn btn-sm"
                :class="uiState.levelFilter === lv ? 'btn_search' : 'btn_reset'"
                @click="onSelectLevel(lv)">{{ lv }}</button>
              <input type="text" class="form-control" style="max-width:280px;" v-model="uiState.keyword"
                @input="onKeywordInput" placeholder="검색어 입력(일치 부분은 노란색으로 강조 표시)" />
              <button v-if="uiState.keyword" class="btn btn-sm btn_reset" @click="onClearKeyword">✕ 지우기</button>
              <span style="flex:1"></span>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
                <input type="checkbox" v-model="uiState.autoScroll" @change="onToggleAutoScroll" /> 자동 스크롤(전체 보기)
              </label>
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
                <input type="checkbox" v-model="uiState.autoRefresh" @change="onToggleAutoRefresh" /> 자동 새로고침(5초)
              </label>
            </div>
            <div class="search-templates">
              <span style="font-size:11px;color:#999;align-self:center;">검색어 템플릿:</span>
              <button v-for="tpl in SEARCH_TEMPLATES" :key="tpl.kw" class="chip"
                :class="uiState.keyword === tpl.kw ? 'active' : ''"
                @click="onApplyTemplate(tpl)">{{ tpl.label }}</button>
            </div>
          </bo-container>

          <!-- ③ 로그 본문(요청사항: "로그파일 full 경로 표시해줘") -->
          <bo-container title="로그 본문" :count-text="'조회 ' + logState.returnedLines + '줄 중 검색결과 ' + cfFilteredLines().length + '줄 · 표시 ' + fnVisibleLines().length + '줄'">
            <div v-if="logState.fullPath" style="font-size:11px;color:#999;margin-bottom:6px;font-family:Consolas,Monaco,monospace;">📂 {{ logState.fullPath }}</div>
            <div v-if="!logState.exists" class="empty-hint">로그 파일이 아직 없습니다.</div>
            <template v-else>
              <pre ref="logBoxEl" class="log-box" @scroll="onLogScroll"><span v-for="(line, idx) in fnVisibleLines()" :key="idx" :class="fnLevelClass(fnLevelOf(line))" v-html="fnHighlightHtml(line)"></span></pre>
              <div class="log-load-more">
                <button class="btn btn-sm btn_reset" :disabled="!fnHasMore()" @click="onLoadMore">
                  {{ fnHasMore() ? ('🔽 더보기' + (fnHasMoreLocal() ? ' (' + (cfFilteredLines().length - logState.displayCount) + '줄 남음)' : ' — 최대 ' + fnNextTier() + '줄까지 서버 재조회')) : '더 이상 없음(파일 끝)' }}
                </button>
              </div>
            </template>
          </bo-container>
        </div>
      </div>
    </div>
  `,
};

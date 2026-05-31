/* ShopJoy Admin - 캐쉬관리 목록 + 하단 CacheDtl 임베드 */
window.PmCacheMng = {
  name: 'PmCacheMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const caches = reactive([]);                   // 캐시 목록
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ cache_statuses: [], cache_trans_types: [], date_range_opts: [] });
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmCacheMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 캐시 신규 등록 (인라인 패널)
      } else if (cmd === 'caches-add') {
        return openNew();
      // 캐시 목록 엑셀 내보내기
      } else if (cmd === 'caches-excel') {
        return exportExcel();
      // 캐시 목록 재조회
      } else if (cmd === 'caches-reload') {
        return handleSearchList('RELOAD');
      // 탭 모드 변경 (리스트/카드)
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmCacheMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'caches-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'caches-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'caches-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세 편집 패널 열기
      } else if (cmd === 'caches-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 삭제
      } else if (cmd === 'caches-rowDelete') {
        return handleDelete(param);
      // 참조 모달 열기 (회원 등)
      } else if (cmd === 'caches-ref') {
        return showRefModal(param.type, param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.cache_statuses = codeStore.sgGetGrpCodes('CACHE_STATUS');
        codes.cache_trans_types = codeStore.sgGetGrpCodes('CACHE_TRANS_TYPE');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,memberId,cacheDesc';
        }
        const res = await boApiSvc.pmCache.getPage(params, '캐시관리', '목록조회');
        const data = res.data?.data;
        caches.splice(0, caches.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* loadView — 뷰 로드 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { detailPanel.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCacheMng') { detailPanel.selectedId = null; if (opts.reload) { handleSearchList('RELOAD'); } return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnTypeBadge — sy_code CACHE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _CACHE_TYPE_FB = { '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('CACHE_TYPE_KR', t, _CACHE_TYPE_FB[t] || 'badge-gray');

    /* setPage — 페이지 번호 변경 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.cacheDesc}] 내역을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = caches.findIndex(x => x.cacheId === c.cacheId);
      if (idx !== -1) { caches.splice(idx, 1); }
      if (detailPanel.selectedId === c.cacheId) { detailPanel.selectedId = null; }
      try {
        const res = await boApiSvc.pmCache.remove(c.cacheId, '캐시관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(caches, [{label:'ID',key:'cacheId'},{label:'회원명',key:'memberNm'},{label:'유형',key:'cacheTypeCd'},{label:'금액',key:'cacheAmt'},{label:'잔액',key:'balanceAmt'},{label:'설명',key:'cacheDesc'},{label:'등록일',key:'regDate'}], '캐시목록.csv');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'memberNm', label: '회원명' },
          { value: 'memberId', label: '회원ID' },
          { value: 'cacheDesc',   label: '내용' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.cache_trans_types, nullLabel: '유형 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'memberNm',    label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'cacheDate',   label: '일시', sortKey: 'reg' },
      { key: 'cacheTypeCd', label: '유형', badge: (row) => fnTypeBadge(row.cacheTypeCd) },
      { key: 'cacheAmt',    label: '금액',
        fmt: (v) => ((v || 0) > 0 ? '+' : '') + (v || 0).toLocaleString() + '원',
        cellStyle: (v) => (v || 0) > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600' },
      { key: 'balanceAmt',  label: '잔액', fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'cacheDesc',   label: '내용', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'siteNm',      label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      caches, uiState, codes, searchParam, pager, detailPanel,                       // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                            // 컬럼 정의
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      fnTypeBadge, sortIcon,                                                         // 헬퍼
      inlineNavigate,                                                                // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    캐쉬관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 영역 ================================================== -->
  <div class="card">
    <!-- ===== ■.■. 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 ============================ -->
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        캐시목록
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="uiState.tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="uiState.tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('caches-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('caches-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <bo-grid v-if="uiState.tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="caches" row-key="cacheId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(c) => detailPanel.selectedId===c.cacheId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('caches-sort', key)"
      @ref-click="({type,id}) => handleSelectAction('caches-ref', {type, id})"
      @row-click="c => handleSelectAction('caches-rowEdit', c.cacheId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: c }">
        <div class="actions">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('caches-rowEdit', c.cacheId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('caches-rowDelete', c)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="uiState.tabMode==='list' && pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleSelectAction('caches-pager-setPage', n)" :on-size-change="() => handleSelectAction('caches-pager-sizeChange')" />
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="caches.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="c in caches" :key="c?.cacheId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="detailPanel.selectedId===c.cacheId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('caches-rowEdit', c.cacheId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">캐시 #{{ c.cacheId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('caches-rowEdit', c.cacheId)" :style="detailPanel.selectedId===c.cacheId?{color:'#e8587a'}:{}">
            {{ c.cacheDesc }}
            <span v-if="detailPanel.selectedId===c.cacheId" style="font-size:10px;margin-left:4px;">▼</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(c.cacheTypeCd)" style="font-size:11px;">{{ c.cacheTypeCd }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>💰 {{ (c.cacheAmt||0) > 0 ? '+' : '' }}{{ (c.cacheAmt||0).toLocaleString() }}원</div>
            <div>📅 {{ c.cacheDate }}</div>
            <div style="color:#999;margin-top:4px;">잔액 {{ (c.balanceAmt||0).toLocaleString() }}원</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('caches-rowEdit', c.cacheId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('caches-rowDelete', c)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ c.cacheId }}</span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('caches-pager-setPage', n)" :on-size-change="() => handleSelectAction('caches-pager-sizeChange')" />
  </div>
  <!-- ===== □. 목록 영역 ================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="detailPanel.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-cache-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger" />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

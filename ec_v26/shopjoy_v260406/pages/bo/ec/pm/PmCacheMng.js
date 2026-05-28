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
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list' });
    const codes = reactive({ cache_statuses: [], cache_trans_types: [], date_range_opts: [] });
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* baseGrid — pager + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* 상세 인라인 패널 */
    const baseDetail = coUtil.cofDetail();

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'searchParam-list')      { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset')     { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); return handleSearchList(); }
      if (cmd === 'searchParam-dateRange') return handleDateRangeChange();
      if (cmd === 'caches-add')            return baseDetail.openNew();
      if (cmd === 'caches-excel')          return exportExcel();
      if (cmd === 'caches-reload')         return handleSearchList();
      if (cmd === 'tab-mode')              { uiState.tabMode = param; return; }
      if (cmd === 'baseDetail-close')      return baseDetail.close();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'caches-sort')             return baseGrid.onSort(param);
      if (cmd === 'caches-pager-setPage')    return baseGrid.setPage(param);
      if (cmd === 'caches-pager-sizeChange') return baseGrid.onSizeChange();
      if (cmd === 'caches-rowEdit')          return baseDetail.openEdit(param);
      if (cmd === 'caches-rowDelete')        return handleDelete(param);
      if (cmd === 'caches-ref')              return showRefModal(param.type, param.id);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

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

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) params.searchType = 'memberNm,memberId,cacheDesc';
        const d = (await boApiSvc.pmCache.getPage(params, '캐시관리', '목록조회')).data?.data;
        const list = baseGrid.applyPage(d);
        caches.splice(0, caches.length, ...list);
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd   = r ? r.to   : '';
      }
      baseGrid.pager.pageNo = 1;
    };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCacheMng')       { baseDetail.close(); if (opts.reload) handleSearchList(); return; }
      if (pg === '__switchToEdit__') return baseDetail.switchToEdit();
      props.navigate(pg, opts);
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      if (!(await showConfirm('삭제', `[${c.cacheDesc}] 내역을 삭제하시겠습니까?`))) return;
      try {
        const res = await boApiSvc.pmCache.remove(c.cacheId, '캐시관리', '삭제');
        setApiRes({ ok: true, status: res.status, data: res.data });
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === c.cacheId) baseDetail.close();
        await handleSearchList();
      } catch (err) {
        setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    /* fnTypeBadge — sy_code CACHE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _CACHE_TYPE_FB = { '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('CACHE_TYPE_KR', t, _CACHE_TYPE_FB[t] || 'badge-gray');

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(caches,
      [{label:'ID',key:'cacheId'},{label:'회원명',key:'memberNm'},{label:'유형',key:'cacheTypeCd'},
       {label:'금액',key:'cacheAmt'},{label:'잔액',key:'balanceAmt'},{label:'설명',key:'cacheDesc'},{label:'등록일',key:'regDate'}],
      '캐시목록.csv');

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
        cellInnerStyle: (v) => baseDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'siteNm',      label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      caches, uiState, codes, searchParam, baseGrid, baseDetail,
      baseSearchColumns, baseGridColumns,
      handleBtnAction, handleSelectAction,
      cfSiteNm,
      fnTypeBadge,
      inlineNavigate,
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
        <span class="list-count">{{ baseGrid.pager.pageTotalCount }}건</span>
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
      :columns="baseGridColumns" :rows="caches" :pager="baseGrid.pager" row-key="cacheId"
      :row-actions="true"
      :sort-state="baseGrid"
      :row-style="(c) => baseDetail.selectedId===c.cacheId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('caches-sort', key)"
      @ref-click="({type,id}) => handleSelectAction('caches-ref', {type, id})"
      @row-click="c => handleSelectAction('caches-rowEdit', c.cacheId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: c }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('caches-rowEdit', c.cacheId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('caches-rowDelete', c)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="uiState.tabMode==='list' && baseGrid.pager.pageTotalCount > 0" :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('caches-pager-setPage', n)" :on-size-change="() => handleSelectAction('caches-pager-sizeChange')" />
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="caches.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="c in caches" :key="c?.cacheId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="baseDetail.selectedId===c.cacheId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('caches-rowEdit', c.cacheId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">캐시 #{{ c.cacheId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('caches-rowEdit', c.cacheId)" :style="baseDetail.selectedId===c.cacheId?{color:'#e8587a'}:{}">
            {{ c.cacheDesc }}
            <span v-if="baseDetail.selectedId===c.cacheId" style="font-size:10px;margin-left:4px;">▼</span>
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
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('caches-pager-setPage', n)" :on-size-change="() => handleSelectAction('caches-pager-sizeChange')" />
  </div>
  <!-- ===== □. 목록 영역 ================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-cache-dtl
      :key="baseDetail.panelKey"
      :navigate="inlineNavigate"
      :dtl-id="baseDetail.editId"
      :dtl-mode="baseDetail.dtlMode"
      :reload-trigger="baseDetail.reloadTrigger" />
  </div>
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

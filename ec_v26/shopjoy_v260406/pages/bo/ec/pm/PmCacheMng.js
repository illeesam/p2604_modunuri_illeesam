/* ShopJoy Admin - 캐쉬관리 목록 + 하단 CacheDtl 임베드 */
window.PmCacheMng = {
  name: 'PmCacheMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const caches = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      cache_statuses: [],
      cache_trans_types: [],
      date_range_opts: [],
    });


    // ===== 공통코드 로딩 ===================================================
    /* 캐시(충전금) fnLoadCodes */
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


    // ===== 사이트명 / 페이저 / 하단 상세 상태 ==============================
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
/* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    // ===== 검색 파라미터 ===================================================
    /* 캐시(충전금) _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '' };
    };
    const searchParam = reactive(_initSearchParam());

    // ===== 날짜 범위 변경 핸들러 ===========================================
    /* 캐시(충전금) handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    // ===== 정렬 처리 =======================================================
    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 캐시(충전금) getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 캐시(충전금) onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 캐시(충전금) sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // ===== 목록 조회 API ===================================================
    /* 캐시(충전금) 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
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

    // ===== 라이프사이클 ====================================================
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* 캐시(충전금) loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 캐시(충전금) 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 캐시(충전금) openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 캐시(충전금) closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 캐시(충전금) inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmCacheMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    // ===== 페이저 번호 빌더 ================================================
    /* 캐시(충전금) fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // ===== 배지(badge) 헬퍼 ================================================
    /* 캐시(충전금) fnTypeBadge — sy_code CACHE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _CACHE_TYPE_FB = { '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' };
    const fnTypeBadge = t => coUtil.cofCodeBadge('CACHE_TYPE_KR', t, _CACHE_TYPE_FB[t] || 'badge-gray');

    // ===== 검색 / 리셋 / 페이지 변경 =======================================
    /* 캐시(충전금) 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 캐시(충전금) onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* 캐시(충전금) setPage */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 캐시(충전금) onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* 캐시(충전금) 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.cacheDesc}] 내역을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = caches.findIndex(x => x.cacheId === c.cacheId);
      if (idx !== -1) caches.splice(idx, 1);
      if (uiStateDetail.selectedId === c.cacheId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmCache.remove(c.cacheId, '캐시관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 캐시(충전금) exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(caches, [{label:'ID',key:'cacheId'},{label:'회원명',key:'memberNm'},{label:'유형',key:'cacheTypeCd'},{label:'금액',key:'cacheAmt'},{label:'잔액',key:'balanceAmt'},{label:'설명',key:'cacheDesc'},{label:'등록일',key:'regDate'}], '캐시목록.csv');

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
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
        onRangeChange: () => onDateRangeChange() },
    ];

    // ===== 그리드 컬럼 정의 (BoGrid :columns) ==============================
    const baseGridColumns = [
      { key: 'memberNm',    label: '회원', refLink: 'member', refKey: 'memberId' },
      { key: 'cacheDate',   label: '일시', sortKey: 'reg' },
      { key: 'cacheTypeCd', label: '유형', badge: (row) => fnTypeBadge(row.cacheTypeCd) },
      { key: 'cacheAmt',    label: '금액',
        fmt: (v) => ((v || 0) > 0 ? '+' : '') + (v || 0).toLocaleString() + '원',
        cellStyle: (v) => (v || 0) > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600' },
      { key: 'balanceAmt',  label: '잔액', fmt: (v) => (v || 0).toLocaleString() + '원' },
      { key: 'cacheDesc',   label: '내용', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'siteNm',      label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    // ===== setup() return =================================================
    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), caches, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, fnTypeBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon, showRefModal,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; },
      get selectedId() { return uiStateDetail.selectedId; } };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div>
  <!-- 페이지 타이틀 -->
  <div class="page-title">캐쉬관리</div>
  <!-- 검색영역 -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- 목록영역 (리스트/카드 토글) -->
  <div class="card">
    <!-- 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 -->
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>캐시목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="tabMode='list'" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">☰ 리스트</button>
          <button @click="tabMode='card'" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">⊞ 카드</button>
        </div>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <!-- 리스트 뷰 (BoGrid) -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="caches" :pager="pager" row-key="cacheId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(c) => selectedId===c.cacheId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @ref-click="({type,id}) => showRefModal(type, id)" @row-click="c => handleLoadDetail(c.cacheId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: c }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.cacheId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(c)">삭제</button>
        </div>
      </template>
    </bo-grid>

    <!-- 카드 뷰 -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="caches.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="c in caches" :key="c?.cacheId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===c.cacheId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(c.cacheId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">캐시 #{{ c.cacheId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(c.cacheId)" :style="selectedId===c.cacheId?{color:'#e8587a'}:{}">{{ c.cacheDesc }}<span v-if="selectedId===c.cacheId" style="font-size:10px;margin-left:4px;">▼</span></div>
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
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(c.cacheId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(c)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ c.cacheId }}</span>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- 하단 상세영역: PmCacheDtl 인라인 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-cache-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
  />
  </div>
</div>
`
};

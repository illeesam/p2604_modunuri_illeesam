/* ShopJoy Admin - 판촉마일리지 관리 목록 + 하단 PmSaveDtl 임베드 */
window.PmSaveMng = {
  name: 'PmSaveMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const saves = reactive([]);
        const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, saveList: [], tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      save_statuses: [],
      save_issue_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });

    // ===== 공통코드 로딩 ===================================================
    /* 적립금 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.save_statuses = codeStore.sgGetGrpCodes('SAVE_STATUS');
        codes.save_issue_types = codeStore.sgGetGrpCodes('SAVE_ISSUE_TYPE');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ===== 정렬 처리 =======================================================
    // onMounted에서 API 로드
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 적립금 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 적립금 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 적립금 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // ===== 목록 조회 API ===================================================
    /* 적립금 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'saveNm,saveId';
        }
        const res = await boApiSvc.pmSave.getPage(params, '적립금관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        saves.splice(0, saves.length, ...list);
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ===== 검색 파라미터 + 라이프사이클 ====================================
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    // ===== 날짜 범위 변경 / 사이트명 / 페이저 / 하단 상세 상태 ===============
    /* 적립금 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
  const searchParam = reactive(_initSearchParam());

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* 적립금 loadView */
    const loadView   = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 적립금 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 적립금 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 적립금 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 적립금 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmSaveMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    // ===== 페이저 번호 빌더 ================================================
    /* 적립금 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // ===== 배지(badge) 헬퍼 ================================================
    /* 적립금 fnTypeBadge — sy_code SAVE_TYPE_KR code_opt1 우선, 없으면 FB */
    const _SAVE_TYPE_FB = { '구매적립': 'badge-green', '회원가입': 'badge-blue', '리뷰적립': 'badge-orange', '출석체크': 'badge-purple' };
    const fnTypeBadge   = t => coUtil.cofCodeBadge('SAVE_TYPE_KR', t, _SAVE_TYPE_FB[t] || 'badge-gray');

    /* 적립금 fnStatusBadge */
    const _SAVE_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _SAVE_STATUS_FB[s] || 'badge-gray');

    // ===== 검색 / 리셋 / 페이지 변경 =======================================
    /* 적립금 목록조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 적립금 onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      onSearch();
    };

    /* 적립금 setPage */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 적립금 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* 적립금 삭제 */
    const handleDelete = async (s) => {
      const ok = await showConfirm('삭제', `[${s.saveNm}] 마일리지를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (saves || []).findIndex(x => x.saveId === s.saveId);
      if (idx !== -1) saves.splice(idx, 1);
      if (uiStateDetail.selectedId === s.saveId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmSave.remove(s.saveId, '적립금관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 적립금 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(saves,
      [{label:'ID',key:'saveId'},{label:'마일리지명',key:'saveNm'},{label:'유형',key:'saveType'},{label:'적립값',key:'saveVal'},{label:'단위',key:'saveUnit'},{label:'상태',key:'saveStatus'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '마일리지목록.csv');

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'saveNm', label: '마일리지명' },
          { value: 'saveId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.save_issue_types, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.promo_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];

    // ===== 그리드 컬럼 정의 (BoGrid :columns) ==============================
    const baseGridColumns = [
      { key: 'saveNm',     label: '마일리지명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'saveType',   label: '유형', badge: (row) => fnTypeBadge(row.saveType) },
      { key: 'saveVal',    label: '적립값', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'saveUnit',   label: '단위', cellStyle: 'color:#555', fmt: (v) => v || '원' },
      { key: 'expireDay',  label: '유효기간', cellStyle: 'color:#555',
        fmt: (v) => (v || 365) + '일' },
      { key: 'startDate',  label: '시작일', sortKey: 'reg' },
      { key: 'endDate',    label: '종료일' },
      { key: 'saveStatus', label: '상태', badge: (row) => fnStatusBadge(row.saveStatus) },
      { key: 'siteNm',     label: '사이트', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    // ===== setup() return =================================================
    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), saves, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div>
  <!-- 페이지 타이틀 -->
  <div class="page-title">마일리지관리</div>
  <!-- 검색영역 -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- 목록영역 (리스트/카드 토글) -->
  <div class="card">
    <!-- 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 -->
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>마일리지목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
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
      :columns="baseGridColumns" :rows="saves" :pager="pager" row-key="saveId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(s) => selectedId===s.saveId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @row-click="s => handleLoadDetail(s.saveId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: s }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.saveId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(s)">삭제</button>
        </div>
      </template>
    </bo-grid>

    <!-- 카드 뷰 -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="saves.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="s in saves" :key="s?.saveId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===s.saveId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(s.saveId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">마일리지 #{{ s.saveId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(s.saveId)" :style="selectedId===s.saveId?{color:'#e8587a'}:{}">{{ s.saveNm }}<span v-if="selectedId===s.saveId" style="font-size:10px;margin-left:4px;">▼</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(s.saveType)" style="font-size:11px;">{{ s.saveType }}</span>
            <span class="badge" :class="fnStatusBadge(s.saveStatus)" style="font-size:11px;">{{ s.saveStatus }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ (s.saveVal||0).toLocaleString() }}{{ s.saveUnit || '원' }}</div>
            <div>📅 {{ s.startDate }} ~ {{ s.endDate }}</div>
            <div style="color:#999;margin-top:4px;">유효기간 {{ s.expireDay || 365 }}일</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(s.saveId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(s)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ s.saveId }}</span>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- 하단 상세영역: PmSaveDtl 인라인 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-save-dtl
      :key="cfDetailKey"
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

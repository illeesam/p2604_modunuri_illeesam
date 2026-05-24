/* ShopJoy Admin - 기획전관리 목록 + 하단 PlanDtl 임베드 */
window.PmPlanMng = {
  name: 'PmPlanMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const plans = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      subscription_periods: [],
      plan_statuses: [],
      date_range_opts: [],
    });

    /* 프로모션 플랜 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.subscription_periods = codeStore.sgGetGrpCodes('SUBSCRIPTION_PERIOD');
        codes.plan_statuses = codeStore.sgGetGrpCodes('PLAN_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'planNm asc', desc: 'planNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 프로모션 플랜 onSort */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmPlan.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...(searchType === 'PAGE_CLICK' ? pager.pageCond : searchParam) }, '요금제관리', '목록조회');
        const data = res.data?.data;
        plans.splice(0, plans.length, ...(data?.pageList || []));
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
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { category: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
     // 'list' | 'card'
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const CATEGORIES = [
      { value: '', label: '전체' },
      { value: '패션', label: '패션' },
      { value: '스포츠', label: '스포츠' },
      { value: '스타일링', label: '스타일링' },
      { value: '직원전용', label: '직원전용' },
      { value: '명품', label: '명품' },
    ];

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
  const searchParam = reactive(_initSearchParam());

    /* loadView — 뷰 로드 */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmPlanMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 프로모션 플랜 fnStatusBadge */
    const _PLAN_STATUS_FB = { '활성': 'badge-green', '예정': 'badge-blue', '비활성': 'badge-gray', '종료': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PLAN_STATUS_KR', s, _PLAN_STATUS_FB[s] || 'badge-gray');

    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      Object.assign(pager.pageCond, searchParam);
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      onSearch();
    };

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (p) => {
      const ok = await showConfirm('삭제', `[${p.planNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = plans.findIndex(x => x.planId === p.planId);
      if (idx !== -1) plans.splice(idx, 1);
      if (uiStateDetail.selectedId === p.planId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmPlan.remove(p.planId, '기획전관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(plans, [{label:'ID',key:'planId'},{label:'기획전명',key:'planNm'},{label:'제목',key:'planTitle'},{label:'유형',key:'planTypeCd'},{label:'상태',key:'planStatusCd'},{label:'정렬',key:'sortOrd'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'},{label:'등록일',key:'regDate'}], '기획전목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');


    // --- [컬럼 정의] ---
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    const baseSearchColumns = [
      { key: 'searchValue', type: 'text', label: '기획전명', placeholder: '기획전명 검색' },
      { key: 'category', type: 'select', label: '카테고리', options: () => CATEGORIES.slice(1), nullLabel: '카테고리 전체' },
      { key: 'status',   type: 'select', label: '상태', options: () => codes.plan_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
    ];

    const baseGridColumns = [
      { key: 'planNm',       label: '기획전명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'category',     label: '카테고리',
        cellInnerStyle: 'font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:2px 8px;' },
      { key: 'theme',        label: '테마' },
      { key: 'productIds',   label: '상품수',
        fmt: (v) => (v || []).length + '개' },
      { key: 'planStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.planStatusCd) },
      { key: 'viewCount',    label: '조회수', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'period',       label: '기간', cellStyle: 'font-size:11px;color:#666',
        fmt: (v, row) => row.startDate + ' ~ ' + row.endDate },
      { key: 'regDate',      label: '등록일', sortKey: 'reg' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];
    // ===== return (템플릿 노출) ===============================================


    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), plans, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, CATEGORIES, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  template: /* html */`
<div>
  <!-- ===== 페이지 타이틀 ==================================================== -->
  <div class="page-title">기획전관리</div>
  <div class="card">
    <!-- ===== 검색 영역 ====================================================== -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="onSearch" @reset="onReset" />
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        기획전목록
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="tabMode='list'" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="tabMode='card'" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <!-- ===== 리스트 뷰 ====================================================== -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="plans" :pager="pager" row-key="planId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(p) => selectedId===p.planId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @row-click="p => handleLoadDetail(p.planId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: p }">
        <div class="actions" style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.planId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(p)">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ p.planId }}</span>
        </div>
      </template>
    </bo-grid>
    <!-- ===== 카드 뷰 ======================================================= -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="plans.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="p in plans" :key="p?.planId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===p.planId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(p.planId)">
        <!-- ===== 배너 이미지 ===================================================== -->
        <div v-if="p.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="p.bannerImage"></div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">기획전 #{{ p.planId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(p.planId)" :style="selectedId===p.planId?{color:'#e8587a'}:{}">
            {{ p.planNm }}
            <span v-if="selectedId===p.planId" style="font-size:10px;margin-left:4px;">▼</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(p.planStatusCd)" style="font-size:11px;">{{ p.planStatusCd }}</span>
            <span class="badge badge-blue" style="font-size:11px;">{{ p.category }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ p.theme }} {{ (p.productIds||[]).length }}개 상품</div>
            <div>📅 {{ p.startDate }} ~ {{ p.endDate }}</div>
            <div style="color:#999;margin-top:4px;">👁 {{ (p.viewCount||0).toLocaleString() }} 조회</div>
            <div style="color:#999;">📅 등록 {{ p.regDate }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.planId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(p)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ p.planId }}</span>
        </div>
      </div>
    </div>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
  <!-- ===== 하단 상세: PlanDtl 임베드 ========================================= -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-plan-dtl
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

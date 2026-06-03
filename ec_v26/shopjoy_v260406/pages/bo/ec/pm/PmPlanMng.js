/* ShopJoy Admin - 기획전관리 목록 + 하단 PlanDtl 임베드 */
window.PmPlanMng = {
  name: 'PmPlanMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
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
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const CATEGORIES = [
      { value: '', label: '전체' },
      { value: '패션', label: '패션' },
      { value: '스포츠', label: '스포츠' },
      { value: '스타일링', label: '스타일링' },
      { value: '직원전용', label: '직원전용' },
      { value: '명품', label: '명품' },
    ];

    /* 하단 상세 (진입 시 빈 신규 폼, 항상 표시) */
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false });

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmPlanMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        Object.assign(pager.pageCond, searchParam);
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 기획전 신규 등록
      } else if (cmd === 'plans-add') {
        return openNew();
      // 기획전 엑셀 내보내기
      } else if (cmd === 'plans-excel') {
        return exportExcel();
      // 탭 모드 변경
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
      console.log(' ■■ PmPlanMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬
      if (cmd === 'plans-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'plans-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'plans-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 상세 편집
      } else if (cmd === 'plans-rowEdit') {
        return handleLoadDetail(param);
      // 행 삭제
      } else if (cmd === 'plans-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchValue: '', category: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    /* 프로모션 플랜 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
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
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 프로모션 플랜 onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
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
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      pager.pageNo = 1;
    };

    /* loadView — 뷰 로드 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmPlanMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 프로모션 플랜 fnStatusBadge */
    const _PLAN_STATUS_FB = { '활성': 'badge-green', '예정': 'badge-blue', '비활성': 'badge-gray', '종료': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PLAN_STATUS_KR', s, _PLAN_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (p) => {
      const ok = await showConfirm('삭제', `[${p.planNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = plans.findIndex(x => x.planId === p.planId);
      if (idx !== -1) { plans.splice(idx, 1); }
      if (detailPanel.selectedId === p.planId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmPlan.remove(p.planId, '기획전관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(plans, [{label:'ID',key:'planId'},{label:'기획전명',key:'planNm'},{label:'제목',key:'planTitle'},{label:'유형',key:'planTypeCd'},{label:'상태',key:'planStatusCd'},{label:'정렬',key:'sortOrd'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'},{label:'등록일',key:'regDate'}], '기획전목록.csv');

    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '기획전명', placeholder: '기획전명 검색' },
      { key: 'category', type: 'select', label: '카테고리', options: () => CATEGORIES.slice(1), nullLabel: '카테고리 전체' },
      { key: 'status',   type: 'select', label: '상태', options: () => codes.plan_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'planNm',       label: '기획전명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'category',     label: '카테고리',
        cellInnerStyle: 'font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:2px 8px;' },
      { key: 'theme',        label: '테마' },
      { key: 'productIds',   label: '상품수',
        fmt: (v) => (v || []).length + '개' },
      { key: 'planStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.planStatusCd) },
      { key: 'viewCount',    label: '조회수', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'period',       label: '기간', cellStyle: 'font-size:11px;color:#666',
        fmt: (v, row) => row.startDate + ' ~ ' + row.endDate },
      { key: 'regDate',      label: '등록일', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      plans, uiState, codes, searchParam, pager, detailPanel, CATEGORIES,            // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                           // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      tabMode,                                                                       // toRef
      fnStatusBadge, sortIcon,                                                       // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,               // 콜백 / 전역
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    기획전관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        기획전목록
        <span class="list-count">
          {{ pager.pageTotalCount }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;cursor:pointer;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('plans-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('plans-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 리스트 뷰 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="plans" row-key="planId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(p) => detailPanel.selectedId===p.planId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('plans-sort', key)" @row-click="p => handleSelectAction('plans-rowEdit', p.planId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: p }">
        <div class="actions" style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-blue btn-xs" @click="handleSelectAction('plans-rowEdit', p.planId)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click="handleSelectAction('plans-rowDelete', p)">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ p.planId }}
          </span>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' && pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleSelectAction('plans-pager-setPage', n)" :on-size-change="() => handleSelectAction('plans-pager-sizeChange')" />
    <!-- ===== □.□. 리스트 뷰 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="plans.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(p, idx) in plans" :key="p?.planId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="detailPanel.selectedId===p.planId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('plans-rowEdit', p.planId)">
        <!-- ===== ■.■.■.■. 배너 이미지 ============================================ -->
        <div v-if="p.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="p.bannerImage">
        </div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            기획전 #{{ p.planId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('plans-rowEdit', p.planId)" :style="detailPanel.selectedId===p.planId?{color:'#e8587a'}:{}">
            {{ p.planNm }}
            <span v-if="detailPanel.selectedId===p.planId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(p.planStatusCd)" style="font-size:11px;">
              {{ p.planStatusCd }}
            </span>
            <span class="badge badge-blue" style="font-size:11px;">
              {{ p.category }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ p.theme }} {{ (p.productIds||[]).length }}개 상품
            </div>
            <div>
              📅 {{ p.startDate }} ~ {{ p.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              👁 {{ (p.viewCount||0).toLocaleString() }} 조회
            </div>
            <div style="color:#999;">
              📅 등록 {{ p.regDate }}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('plans-rowEdit', p.planId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('plans-rowDelete', p)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ p.planId }}
          </span>
        </div>
      </div>
    </div>
    <bo-pager v-if="tabMode!=='list' && pager.pageTotalCount > 0" :pager="pager" :on-set-page="n => handleSelectAction('plans-pager-setPage', n)" :on-size-change="() => handleSelectAction('plans-pager-sizeChange')" />
  </div>
  <!-- ===== □.□. 카드 뷰 ================================================== -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: PlanDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ============= -->
  <div style="margin-top:16px;">
    <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-plan-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      :on-list-reload="handleBtnAction"
      />
  </div>
</div>
<!-- ===== □. 하단 상세: PlanDtl 임베드 ====================================== -->
`
};

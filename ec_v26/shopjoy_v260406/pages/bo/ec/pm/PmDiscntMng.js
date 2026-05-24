/* ShopJoy Admin - 판촉할인 관리 목록 + 하단 PmDiscntDtl 임베드 */
window.PmDiscntMng = {
  name: 'PmDiscntMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const discounts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      discount_types: [],
      discount_statuses: [],
      discnt_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });

    // ===== 공통코드 로딩 ===================================================
    /* 할인 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.discount_types = codeStore.sgGetGrpCodes('DISCOUNT_TYPE');
        codes.discount_statuses = codeStore.sgGetGrpCodes('DISCOUNT_STATUS');
        codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE_KR');
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
    const SORT_MAP = { nm: { asc: 'discntNm asc', desc: 'discntNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 할인 onSort */
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

    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'discntNm,discntId';
        }
        const res = await boApiSvc.pmDiscnt.getPage(params, '할인관리', '목록조회');
        const data = res.data?.data;
        discounts.splice(0, discounts.length, ...(data?.pageList || []));
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

    // ===== 검색 파라미터 + 라이프사이클 ====================================
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');    });

    // ===== 날짜 범위 변경 / 사이트명 / 페이저 / 하단 상세 상태 ===============
    /* handleDateRangeChange — 기간 변경 */
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
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmDiscntMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    // ===== 페이저 번호 빌더 ================================================
    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // ===== 배지(badge) 헬퍼 ================================================
    /* 할인 fnTypeBadge — sy_code DISCNT_TYPE_KR code_opt1 우선, 없으면 FB */
    const _DISCNT_TYPE_FB = { '정률': 'badge-blue', '정액': 'badge-green', '장바구니': 'badge-orange' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge   = t => coUtil.cofCodeBadge('DISCNT_TYPE_KR', t, _DISCNT_TYPE_FB[t] || 'badge-gray');

    /* 할인 fnStatusBadge */
    const _DISCNT_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _DISCNT_STATUS_FB[s] || 'badge-gray');

    // ===== 검색 / 리셋 / 페이지 변경 =======================================
    /* onSearch — 조회 */
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage      = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* handleDelete — 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.discntNm}] 할인을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = (discounts || []).findIndex(x => x.discntId === d.discntId);
      if (idx !== -1) discounts.splice(idx, 1);
      if (uiStateDetail.selectedId === d.discntId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pmDiscnt.remove(d.discntId, '할인관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(discounts,
      [{label:'ID',key:'discntId'},{label:'할인명',key:'discntNm'},{label:'유형',key:'discntTypeCd'},{label:'할인값',key:'discntValue'},{label:'상태',key:'discntStatusCd'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '할인목록.csv');

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'discntNm', label: '할인명' },
          { value: 'discntId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.discnt_types, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.promo_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    const baseGridColumns = [
      { key: 'discntNm',       label: '할인명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'discntTypeCd',   label: '유형', badge: (row) => fnTypeBadge(row.discntTypeCd) },
      { key: 'discntValue',    label: '할인값',
        fmt: (v, row) => row.discntTypeCd === '정률' ? (row.discntValue + '%')
          : (row.discntValue || 0).toLocaleString() + '원' },
      { key: 'discntTargetCd', label: '적용대상', cellStyle: 'color:#555',
        fmt: (v) => v || '전체상품' },
      { key: 'startDate',      label: '시작일', sortKey: 'reg' },
      { key: 'endDate',        label: '종료일' },
      { key: 'discntStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.discntStatusCd) },
      { key: 'siteNm',         label: '사이트', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), discounts, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, onDateRangeChange: handleDateRangeChange, cfSiteNm, pager, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, onSort, sortIcon,
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">할인관리</div>
  <!-- ===== ■. 검색영역 ==================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 ============================ -->
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        할인목록
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
    <!-- ===== □.□. 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 ============================ -->
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="discounts" :pager="pager" row-key="discntId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(d) => selectedId===d.discntId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @row-click="d => handleLoadDetail(d.discntId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: d }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.discntId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(d)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <!-- ===== □.□. 목록 영역 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="discounts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">데이터가 없습니다.</div>
      <div v-for="d in discounts" :key="d?.discntId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="selectedId===d.discntId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleLoadDetail(d.discntId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">할인 #{{ d.discntId }}</div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleLoadDetail(d.discntId)" :style="selectedId===d.discntId?{color:'#e8587a'}:{}">
            {{ d.discntNm }}
            <span v-if="selectedId===d.discntId" style="font-size:10px;margin-left:4px;">▼</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(d.discntTypeCd)" style="font-size:11px;">{{ d.discntTypeCd }}</span>
            <span class="badge" :class="fnStatusBadge(d.discntStatusCd)" style="font-size:11px;">{{ d.discntStatusCd }}</span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>🎯 {{ d.discntTypeCd === '정률' ? (d.discntValue + '%') : (d.discntValue||0).toLocaleString() + '원' }}</div>
            <div>📅 {{ d.startDate }} ~ {{ d.endDate }}</div>
            <div style="color:#999;margin-top:4px;">{{ d.discntTargetCd || '전체상품' }}</div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.discntId)" style="font-size:11px;padding:4px 12px;">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(d)" style="font-size:11px;padding:4px 12px;">삭제</button>
          <span style="font-size:11px;color:#999;margin-left:auto;">#{{ d.discntId }}</span>
        </div>
      </div>
    </div>
    <!-- ===== □.□. 카드 뷰 ================================================== -->
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세영역: PmDiscntDtl 인라인 임베드 ============================ -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pm-discnt-dtl
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

  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->`
};

/* ShopJoy Admin - 판촉사은품 관리 목록 + 하단 PmGiftDtl 임베드 */
window.PmGiftMng = {
  name: 'PmGiftMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* ##### [01] 초기 변수 정의 #################################################### */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmGiftMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 사은품 신규 등록
      } else if (cmd === 'gifts-add') {
        return openNew();
      // 사은품 엑셀 내보내기
      } else if (cmd === 'gifts-excel') {
        return exportExcel();
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬
      } else if (cmd === 'gifts-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'gifts-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmGiftMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'gifts-pager-sizeChange') {
        return onSizeChange();
      // 셀/카드 본문 클릭 → 상세 보기모드로 열기
      } else if (cmd === 'gifts-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmGiftMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'gifts-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.giftId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.giftId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const gifts = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, giftList: [], tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      gift_statuses: [],
      gift_cond_types: [],
      date_range_opts: [],
    });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false }); // 상세영역 항상 표시 (진입 시 빈 신규 폼, active=false → 버튼 숨김)

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    // ===== 공통코드 로딩 ===================================================
    /* 사은품 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.gift_statuses = codeStore.sgGetGrpCodes('GIFT_STATUS');
        codes.gift_cond_types = codeStore.sgGetGrpCodes('GIFT_COND_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ===== 정렬 처리 =======================================================
    const SORT_MAP = { nm: { asc: 'giftNm asc', desc: 'giftNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 사은품 onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'giftNm,giftId';
        }
        const res = await boApiSvc.pmGift.getPage(params, '선물관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gifts.splice(0, gifts.length, ...list);
        baseGridPager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, res.data?.data?.pageCond || baseGridPager.pageCond);
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
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== 날짜 범위 변경 / 사이트명 / 페이저 / 하단 상세 상태 ===============
    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → active=true) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmGiftMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode   = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    // ===== 페이저 번호 빌더 ================================================

    // ===== 배지(badge) 헬퍼 ================================================
    /* 사은품 fnTypeBadge — sy_code GIFT_COND_TYPE_KR code_opt1 우선, 없으면 FB */
    const _GIFT_COND_TYPE_FB = { '구매조건': 'badge-blue', '금액조건': 'badge-green', '수량조건': 'badge-orange', '무조건': 'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge   = t => coUtil.cofCodeBadge('GIFT_COND_TYPE_KR', t, _GIFT_COND_TYPE_FB[t] || 'badge-gray');

    /* 사은품 fnStatusBadge */
    const _GIFT_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red', '품절': 'badge-orange' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _GIFT_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* handleDelete — 삭제 */
    const handleDelete = async (g) => {
      const ok = await showConfirm('삭제', `[${g.giftNm}] 사은품을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = (gifts || []).findIndex(x => x.giftId === g.giftId);
      if (idx !== -1) { gifts.splice(idx, 1); }
      if (detailPanel.selectedId === g.giftId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmGift.remove(g.giftId, '사은품관리', '삭제');
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
    const exportExcel = () => coUtil.cofExportCsv(gifts,
      [{label:'ID',key:'giftId'},{label:'사은품명',key:'giftNm'},{label:'유형',key:'giftTypeCd'},{label:'최소주문금액',key:'minOrderAmt'},{label:'최소주문수량',key:'minOrderQty'},{label:'재고',key:'giftStock'},{label:'상태',key:'giftStatusCd'},{label:'시작일',key:'startDate'},{label:'종료일',key:'endDate'}],
      '사은품목록.csv');

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'giftNm', label: '사은품명' },
          { value: 'giftId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.gift_cond_types, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.gift_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'giftNm',       label: '사은품명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'giftTypeCd',   label: '조건유형', badge: (row) => fnTypeBadge(row.giftTypeCd) },
      { key: 'condVal',      label: '조건값',
        fmt: (v, row) => row.giftTypeCd === '금액조건' ? (row.minOrderAmt || 0).toLocaleString() + '원↑'
          : row.giftTypeCd === '수량조건' ? (row.minOrderQty || 0) + '개↑' : '-' },
      { key: 'giftStock',    label: '재고', fmt: (v) => (v || 0).toLocaleString() + '개' },
      { key: 'startDate',    label: '시작일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'endDate',      label: '종료일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'giftStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.giftStatusCd) },
      { key: 'siteNm',       label: '사이트', cellStyle: 'color:#2563eb', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      gifts, uiState, codes, searchParam, baseGridPager, detailPanel,                        // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                           // computed
      tabMode,                                                                       // toRef
      fnTypeBadge, fnStatusBadge, sortIcon,                                          // 헬퍼
      inlineNavigate, showToast, showConfirm, showRefModal, setApiRes,               // 콜백 / 전역
    };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<bo-page title="사은품관리">
  <!-- ===== ■. 검색영역 ==================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <bo-container title="사은품목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <!-- ===== ■.■. 목록 툴바: 탭모드 토글 + 엑셀/신규 ============================ -->
    <template #toolbar-actions>
      <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;transition:all .15s;"
          :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
          ☰ 리스트
        </button>
        <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;transition:all .15s;"
          :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
          ⊞ 카드
        </button>
      </div>
      <button class="btn btn-green btn-sm" @click="handleBtnAction('gifts-excel')">
        📥 엑셀
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('gifts-add')">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="gifts" row-key="giftId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(g) => detailPanel.selectedId===g.giftId ? 'background:#fff8f9;' : ''" @sort="key => handleBtnAction('gifts-sort', key)" grid-id="gifts-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: g, gridId }">
        <div class="actions">
          <button class="btn btn-blue btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_edit', g)">
            수정
          </button>
          <button class="btn btn-danger btn-xs" @click.stop="handleGridCellAction(gridId, 'btn_delete', g)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' && baseGridPager.pageTotalCount > 0" :pager="baseGridPager" :on-set-page="n => handleBtnAction('gifts-pager-setPage', n)" :on-size-change="() => handleSelectAction('gifts-pager-sizeChange')" />
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="gifts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(g, idx) in gifts" :key="g?.giftId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="detailPanel.selectedId===g.giftId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('gifts-rowView', g.giftId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (baseGridPager.pageNo-1)*baseGridPager.pageSize + idx + 1 }}</span> 사은품 #{{ g.giftId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('gifts-rowView', g.giftId)" :style="detailPanel.selectedId===g.giftId?{color:'#e8587a'}:{}">
            {{ g.giftNm }}
            <span v-if="detailPanel.selectedId===g.giftId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(g.giftTypeCd)" style="font-size:11px;">
              {{ g.giftTypeCd }}
            </span>
            <span class="badge" :class="fnStatusBadge(g.giftStatusCd)" style="font-size:11px;">
              {{ g.giftStatusCd }}
            </span>
          </div>
          <!-- ===== ■.■.■.■.■. 영역 ============================================== -->
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ g.giftTypeCd === '금액조건' ? (g.minOrderAmt||0).toLocaleString() + '원↑' : g.giftTypeCd === '수량조건' ? (g.minOrderQty||0) + '개↑' : '-' }}
            </div>
            <div>
              📅 {{ g.startDate }} ~ {{ g.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              재고 {{ (g.giftStock||0).toLocaleString() }}개
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn-blue btn-sm" @click.stop="handleGridCellAction('gifts-cellClick', 'btn_edit', g)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click.stop="handleGridCellAction('gifts-cellClick', 'btn_delete', g)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ g.giftId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager v-if="tabMode!=='list' && baseGridPager.pageTotalCount > 0" :pager="baseGridPager" :on-set-page="n => handleBtnAction('gifts-pager-setPage', n)" :on-size-change="() => handleSelectAction('gifts-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세영역: PmGiftDtl 인라인 임베드 ============================== -->
  <bo-container bare>
    <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-gift-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      />
  </bo-container>
</bo-page>
`
};

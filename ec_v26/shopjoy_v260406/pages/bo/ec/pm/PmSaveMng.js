/* ShopJoy Admin - 판촉마일리지 관리 목록 + 하단 PmSaveDtl 임베드 */
window.PmSaveMng = {
  name: 'PmSaveMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* ##### [01] 초기 변수 정의 #################################################### */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 적립금 신규 등록
      } else if (cmd === 'saves-add') {
        return openNew();
      // 적립금 엑셀 내보내기
      } else if (cmd === 'saves-excel') {
        return exportExcel();
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmSaveMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬
      if (cmd === 'saves-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'saves-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'saves-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 행 클릭 → 상세 편집
      } else if (cmd === 'saves-rowEdit') {
        return handleLoadDetail(param);
      // 행 삭제
      } else if (cmd === 'saves-rowDelete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // ===== 상태(reactive) 선언 =============================================
    const saves = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, saveList: [], tabMode: 'list' });
    const codes = reactive({
      save_statuses: [],
      save_issue_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });
    const baseDetail = coUtil.cofDetail();

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {
      const today = new Date(); const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, type: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());
    // ===== 공통코드 로딩 ===================================================
    /* 적립금 fnLoadCodes */
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */
    /* fnLoadCodes — 공통코드 로드 */
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
    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };
    /* 적립금 onSort */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'saveNm,saveId';
        }
        const res = await boApiSvc.pmSave.getPage(params, '적립금관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        saves.splice(0, saves.length, ...list);
        baseGrid.pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, res.data?.data?.pageCond || baseGrid.pager.pageCond);
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
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
      baseGrid.pager.pageNo = 1;
    };

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'view'; baseDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 */
    const handleLoadDetail = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* openNew — 신규 열기 */
    const openNew = () => { baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { baseDetail.selectedId = null; };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmSaveMng') { baseDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { baseDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => baseDetail.selectedId === '__new__' ? null : baseDetail.selectedId);
    const cfIsViewMode   = computed(() => baseDetail.openMode === 'view' && baseDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${baseDetail.selectedId}_${baseDetail.openMode}`);

    // ===== 페이저 번호 빌더 ================================================
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    마일리지관리
  </div>
  <!-- ===== ■. 검색영역 ==================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 ============================ -->
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        마일리지목록
        <span class="list-count">
          {{ baseGrid.pager.pageTotalCount }}건
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
        <button class="btn btn-green btn-sm" @click="handleBtnAction('saves-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('saves-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== □.□. 목록 툴바: 제목 + 탭모드 토글 + 엑셀/신규 ============================ -->
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="baseGridColumns" :rows="saves" :pager="baseGrid.pager" row-key="saveId"
      :row-actions="true"
      :sort-state="{ sortKey: baseGrid.sortKey, sortDir: baseGrid.sortDir }"
      :row-style="(s) => baseDetail.selectedId===s.saveId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('saves-sort', key)" @row-click="s => handleSelectAction('saves-rowEdit', s.saveId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: s }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('saves-rowEdit', s.saveId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('saves-rowDelete', s)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' && baseGrid.pager.pageTotalCount > 0" :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('saves-pager-setPage', n)" :on-size-change="() => handleSelectAction('saves-pager-sizeChange')" />
    <!-- ===== □.□. 목록 영역 ================================================= -->
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="saves.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="s in saves" :key="s?.saveId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;cursor:pointer;"
        :style="baseDetail.selectedId===s.saveId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('saves-rowEdit', s.saveId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            마일리지 #{{ s.saveId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;cursor:pointer;" @click="handleSelectAction('saves-rowEdit', s.saveId)" :style="baseDetail.selectedId===s.saveId?{color:'#e8587a'}:{}">
            {{ s.saveNm }}
            <span v-if="baseDetail.selectedId===s.saveId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(s.saveType)" style="font-size:11px;">
              {{ s.saveType }}
            </span>
            <span class="badge" :class="fnStatusBadge(s.saveStatus)" style="font-size:11px;">
              {{ s.saveStatus }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ (s.saveVal||0).toLocaleString() }}{{ s.saveUnit || '원' }}
            </div>
            <div>
              📅 {{ s.startDate }} ~ {{ s.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              유효기간 {{ s.expireDay || 365 }}일
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:flex-end;align-items:center;">
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('saves-rowEdit', s.saveId)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('saves-rowDelete', s)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ s.saveId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== □.□. 카드 뷰 ================================================== -->
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleSelectAction('saves-pager-setPage', n)" :on-size-change="() => handleSelectAction('saves-pager-sizeChange')" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세영역: PmSaveDtl 인라인 임베드 ============================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <pm-save-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"

      :reload-trigger="baseDetail.reloadTrigger"
      :on-list-reload="handleBtnAction"
      />
  </div>
</div>
<!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
`
};

/* ShopJoy Admin - 게시판관리 */
window.SyBbmMng = {
  name: 'SyBbmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const bbms = reactive([]);                     // 게시판 목록 (메인 그리드 데이터)
    const bbmCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false, selectedPath: null,
    });
    const codes = reactive({ bbm_type: [], bbm_status: [], use_yn: [] });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbmMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회 (표시경로 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 게시판 신규 등록 (인라인 패널)
      } else if (cmd === 'bbms-add') {
        return openNew();
      // 게시판 목록 엑셀 내보내기
      } else if (cmd === 'bbms-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 페이지 번호 클릭
      } else if (cmd === 'bbms-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBbmMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'bbms-pager-sizeChange') {
        return onSizeChange();
      // 좌측 경로 트리 노드 선택 → 우측 목록/상세 초기화 후 경로 기준 재조회
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        baseGridPager.pageNo = 1;
        resetDetailToNew();                  // 게시판 상세 패널 초기화(빈 신규 폼 + 선택 해제)
        return handleSearchList();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch. cmd='{영역}-cellClick', e={row,col,colKey,colIndex,rowIndex}.
       e.colKey(클릭 컬럼명) 기준으로 셀별 동작 분기, e.row 행 객체 활용 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyBbmMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'bbms-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_edit')   { return handleLoadDetail(row.bbmId); }
        if (colKey === 'btn_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.bbmId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({   // 인라인 Dtl 패널 상태 (modal_reload_trigger 표준)
      show: true,                    // 상세영역 항상 표시 (진입 시 빈 신규 폼)
      dtlId: '__new__',              // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      dtlMode: 'edit',               // 'view' | 'edit'
      reloadTrigger: 0,              // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syBbm.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(bbmCounts).forEach(k => { delete bbmCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) bbmCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'bbmNm,bbmCode';
        }
        const res = await boApiSvc.syBbm.getPage(params, '게시판모드관리', '목록조회');
        const data = res.data?.data;
        bbms.splice(0, bbms.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || bbms.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 (토글) */
    const loadView = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'view') {
        resetDetailToNew(); return;
      }
      detailModal.dtlId = id;
      detailModal.dtlMode = 'view';
      detailModal.show = true;
      detailModal.active = true;
      detailModal.reloadTrigger++;
    };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = false;    // 버튼 숨김
      detailModal.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 그리드 행 클릭 시 해당 ID 상세 로드 (재클릭 시 신규 폼으로 초기화) */
    const handleLoadDetail = (id) => {
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.active = true;     // 행 선택 → 저장/취소 노출
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailModal.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syBbmMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (b) => {
      const ok = await showConfirm('삭제', `[${b.bbmNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = bbms.findIndex(x => x.bbmId === b.bbmId);
      if (idx !== -1) { bbms.splice(idx, 1); }
      if (detailModal.dtlId === b.bbmId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.syBbm.remove(b.bbmId, '게시판모드관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(bbms, [
      { label: 'ID', key: 'bbmId' }, { label: '게시판명', key: 'bbmNm' },
      { label: '유형', key: 'bbmTypeCd' }, { label: '사용여부', key: 'useYn' },
      { label: '등록일', key: 'regDate' },
    ], '게시판목록.csv');


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.bbm_type = codeStore.sgGetGrpCodes('BBM_TYPE');
      codes.bbm_status = codeStore.sgGetGrpCodes('BBM_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* 게시판 마스터 fnTypeBadge */
    const _BBM_TYPE_FB = { '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('BBM_TYPE', t, _BBM_TYPE_FB[t] || 'badge-gray');

    /* fnYnBadge — Y/N 배지 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnCommentBadge — 댓글허용 배지 */
    const fnCommentBadge = v => ({ '불가': 'badge-gray', '댓글허용': 'badge-blue', '대댓글허용': 'badge-green' }[v] || 'badge-gray');

    /* fnAttachBadge — 첨부허용 배지 */
    const fnAttachBadge  = v => ({ '불가': 'badge-gray', '1개': 'badge-orange', '2개': 'badge-orange', '3개': 'badge-orange', '목록': 'badge-blue' }[v] || 'badge-gray');

    /* fnContentBadge — 내용입력 배지 */
    const fnContentBadge = v => ({ '불가': 'badge-gray', 'textarea': 'badge-blue', 'htmleditor': 'badge-green' }[v] || 'badge-gray');

    /* fnScopeBadge — 공개범위 배지 */
    const fnScopeBadge   = v => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[v] || 'badge-gray');

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (b) => detailModal.dtlId === b.bbmId ? 'background:#fff8f9;' : '';

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);
    const cfIsViewMode = computed(() => detailModal.dtlMode === 'view' && detailModal.dtlId !== '__new__');
    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'bbmNm',   label: '게시판명' },
          { value: 'bbmCode', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.bbm_type, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',        label: '표시경로', style: 'width:170px;max-width:170px;', pathPick: 'sy_bbm' },
      { key: 'bbmCode',       label: '게시판코드',
        cellInnerStyle: 'font-size:11px;color:#555;font-family:monospace;' },
      { key: 'bbmNm',         label: '게시판명', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'bbmTypeCd',     label: '유형', badge: (row) => fnTypeBadge(row.bbmTypeCd) },
      { key: 'allowComment',  label: '댓글허용', badge: (row) => fnCommentBadge(row.allowComment), fmt: (v) => v || '불가' },
      { key: 'allowAttach',   label: '첨부허용', badge: (row) => fnAttachBadge(row.allowAttach), fmt: (v) => v || '불가' },
      { key: 'contentTypeCd', label: '내용입력', badge: (row) => fnContentBadge(row.contentTypeCd), fmt: (v) => v || '-' },
      { key: 'scopeTypeCd',   label: '공개범위', badge: (row) => fnScopeBadge(row.scopeTypeCd), fmt: (v) => v || '-' },
      { key: 'allowLike',     label: '좋아요', badge: (row) => fnYnBadge(row.allowLike), fmt: (v) => v === 'Y' ? '허용' : '불가' },
      { key: 'bbsCount',      label: '게시글수', align: 'center', fmt: (v) => v || 0 },
      { key: 'sortOrd',       label: '정렬순서', align: 'center' },
      { key: 'useYn',         label: '사용여부', badge: (row) => fnYnBadge(row.useYn), fmt: (v) => v === 'Y' ? '사용' : '미사용' },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',       label: '등록일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      bbms, uiState, bbmCounts, codes, searchParam, baseGridPager, detailModal,                       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                    // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                          // computed
      fnRowStyle,                                                                   // 헬퍼
      inlineNavigate, showToast, showConfirm, handleSearchList,          // Dtl props (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="게시판관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 본문 영역 (트리 + 목록) ===================================== -->
  <div class="bo-2col">
    <!-- ===== ■.■. 좌: 표시경로 트리 ============================================ -->
    <bo-container bare>
      <bo-path-tree-card biz-cd="sy_bbm" title="표시경로" :show-biz-cd="false" :counts="bbmCounts"
        :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■. 우: 목록 ================================================== -->
    <bo-container title="게시판목록" :count-text="baseGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <button class="btn btn_excel" @click="handleBtnAction('bbms-excel')">
          📥 엑셀
        </button>
        <button class="btn btn_new" @click="handleBtnAction('bbms-add')">
          + 신규
        </button>
      </template>
      <bo-grid bare
        :columns="columns.baseGrid" :rows="bbms" row-key="bbmId" :selected-key="detailModal.dtlId"
        :row-style="fnRowStyle"
        grid-id="bbms-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row, gridId }">
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_edit', row)">
                수정
              </button>
              <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
      <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('bbms-pager-setPage', n)" :on-size-change="() => handleSelectAction('bbms-pager-sizeChange')" />
    </bo-container>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 상세 인라인 패널 (전체 폭, 항상 표시) ============================ -->
  <sy-bbm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :dtl-id="cfDetailEditId" :tab-mode="cfIsViewMode"
    :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailModal.active"
    :reload-trigger="detailModal.reloadTrigger"
  />
  <!-- ===== □. 상세 인라인 패널 ============================================= -->
</bo-page>
`,
};

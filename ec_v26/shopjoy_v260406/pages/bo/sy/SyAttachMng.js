/* ShopJoy Admin - 첨부파일 통합조회
 * (2026-08-15 전면개편) sy_attach_grp 폐지 → ref_table_nm/ref_id 로 통일됨에 따라
 * "첨부그룹관리"(그룹 CRUD) 화면을 폐기하고, 전체 sy_attach 를 관련테이블명/관련ID 조건으로
 * 검색·조회하고 문제 있는(고아) 파일을 삭제할 수 있는 조회/감사 화면으로 재구성했다.
 * 파일 등록/수정(수기 입력)은 실제 업로드가 아니므로 함께 제거 — 업로드는 각 도메인 화면의
 * <base-attach-grp> 를 통해서만 이뤄진다. */
window.SyAttachMng = {
  name: 'SyAttachMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const attaches = reactive([]);
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ date_range_opts: [] });

    const fileGridPager = reactive({
      pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageNums: [], pageSizes: [10, 20, 30, 50, 100, 200, 500],
    });

    const searchParam = reactive({ refTableNm: '', refId: '', searchType: '', searchValue: '', dateRange: '', dateRangeStart: '', dateRangeEnd: '' });
    /* searchParamInit — [초기화] 기준값 (initPage 끝에서 스냅샷) */
    const searchParamInit = {};

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyAttachMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 페이지 번호 클릭
      } else if (cmd === 'attaches-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyAttachMng.js : handleSelectAction -> ', cmd, param);
      // 첨부파일 삭제 버튼
      if (cmd === 'attaches-rowDelete') {
        return handleDeleteFile(param);
      // 페이지 크기 변경
      } else if (cmd === 'attaches-pager-sizeChange') {
        return onSizeChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnBuildPageNums — 유틸 */
    const fnBuildPageNums = () => {
      const c = fileGridPager.pageNo, l = fileGridPager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      fileGridPager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
    };

    // 파일 목록 조회 (서버사이드 페이징)
    /* handleSearchData — 처리 */
    const handleSearchData = async () => {
      uiState.loading = true;
      try {
        const p = {
          pageNo: fileGridPager.pageNo,
          pageSize: fileGridPager.pageSize,
          ...coUtil.cofOmitEmpty(searchParam),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (p.searchValue && !p.searchType) {
          p.searchType = 'fileNm,attachMemo';
        }
        const attachRes = await boApiSvc.syAttach.getPage(p, '첨부파일관리', '조회');
        const data = attachRes.data?.data;
        const list = data?.pageList || data?.list || [];
        attaches.splice(0, attaches.length, ...list);
        fileGridPager.pageTotalCount = data?.pageTotalCount ?? data?.totalCount ?? data?.total ?? list.length ?? 0;
        fileGridPager.pageTotalPage  = data?.pageTotalPage  || coUtil.cofTotalPage(fileGridPager);
        fnBuildPageNums();
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['DATE_RANGE_OPT'], {compNm: 'SyAttachMng'});
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchData();
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* onSearch — 조회 */
    const onSearch = async () => { fileGridPager.pageNo = 1; await handleSearchData(); };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, searchParamInit);   // 검색어/검색대상까지 함께 초기화
      fileGridPager.pageNo = 1;
      handleSearchData();
    };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= fileGridPager.pageTotalPage) { fileGridPager.pageNo = n; handleSearchData(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { fileGridPager.pageNo = 1; handleSearchData(); };

    /* handleDeleteFile — 삭제 */
    const handleDeleteFile = async (a) => {
      const ok = await showConfirm('파일 삭제', `[${a.fileNm}] 파일을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApi.delete(`/bo/sy/attach/${a.attachId}`, coUtil.cofApiHdr('첨부파일관리', '파일삭제'));
        showToast('삭제되었습니다.', 'success');
        await handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnFmtSize — 유틸 */
    const fnFmtSize = bytes => {
      if (!bytes) { return '0 B'; }
      if (bytes < 1024) { return bytes + ' B'; }
      if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' KB'; }
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* REF_TABLE_OPTS — 검색 select 및 그리드 라벨 표시에 공용으로 쓰는 관련테이블명 사전 */
    const REF_TABLE_OPTS = [
      { value: 'sy_notice',           label: '공지사항' },
      { value: 'sy_bbs',              label: '게시글' },
      { value: 'sy_contact_content',  label: '문의 내용' },
      { value: 'sy_contact_answer',   label: '문의 답변' },
      { value: 'cm_faq',              label: 'FAQ 답변' },
      { value: 'cm_chatt_msg',        label: '채팅 메시지' },
      { value: 'sy_vendor_content',   label: '업체 콘텐츠' },
      { value: 'sy_attach_grp_legacy', label: '레거시 첨부그룹' },
    ];
    /* fnRefTableNm — 관련테이블명 코드값 → 한글 라벨 */
    const fnRefTableNm = (v) => REF_TABLE_OPTS.find(o => o.value === v)?.label || v || '-';

    // 파일 그리드
    const columns = {};
    columns.fileGrid = [
      { key: 'refTableNm', label: '연계 대상', cellStyle: 'color:#666;',
        fmt: (v, row) => v ? `${fnRefTableNm(v)} #${row.refId}` : '(미연계)' },
      { key: 'fileNm', label: '파일명', style: 'word-break:break-all;' },
      { key: 'fileSize', label: '크기', style: 'width:70px;', fmt: v => fnFmtSize(v) },
      { key: 'fileExt', label: '확장자', style: 'width:55px;',
        cellInnerStyle: 'background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;' },
      { key: 'attachMemo', label: '메모', cellStyle: 'color:#888;' },
      { key: 'regDate', label: '등록일', style: 'width:145px;', fmt: v => coUtil.cofYmdHms(v || '') },
      { key: 'siteNm', label: '사이트명', style: 'width:70px;',
        cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* fileSearchColumns — 첨부파일 검색 영역 컬럼 */
    columns.fileSearch = [
      { key: 'refTableNm', type: 'select', options: REF_TABLE_OPTS, nullLabel: '연계 대상 전체', width: '150px' },
      { key: 'refId', type: 'text', placeholder: '관련 ID', width: '130px' },
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'fileNm', label: '파일명' },
          { value: 'attachMemo', label: '메모' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력', width: '150px' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      attaches, uiState, searchParam, fileGridPager,       // 상태 / 데이터
      handleBtnAction, handleSelectAction,                 // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, fnFmtSize, fnRefTableNm,                    // computed / 헬퍼
    };
  },
  template: /* html */`
<bo-page title="첨부파일 통합조회">
  <!-- ===== ■. 조회 영역 ===================================================== -->
  <bo-container>
    <bo-search-area :columns="columns.fileSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-container title="첨부파일목록" :count-text="fileGridPager.pageTotalCount + '건'">
    <!-- ===== ■.■. 파일 그리드 (기본 20개 페이지 + 화면 높이에 따라 반응형으로 확장, 초과 시 내부 스크롤) ===== -->
    <div style="max-height:calc(100vh - 280px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <bo-grid
        bare
        :columns="columns.fileGrid"
        :rows="attaches"
        row-key="attachId"
        :loading="uiState.loading"
        :empty-text="uiState.loading ? '조회 중...' : '데이터가 없습니다.'"
        row-actions>
        <template #row-actions="{ row }">
          <div class="actions">
            <button class="btn btn_row_delete" @click="handleSelectAction('attaches-rowDelete', row)">
              삭제
            </button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 페이저 ===================================================== -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="fileGridPager" :on-set-page="n => handleBtnAction('attaches-pager-setPage', n)" :on-size-change="() => handleSelectAction('attaches-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </bo-container>
</bo-page>
`
};

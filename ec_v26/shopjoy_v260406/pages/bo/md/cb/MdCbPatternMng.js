/* ShopJoy Admin - 코바늘 도안관리 (전체 회원 도안 조회/삭제, 실제 격자 편집은 fo-md-cb-cobanul.html) */
window.MdCbPatternMng = {
  name: 'MdCbPatternMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState = reactive({ loading: false, error: null });
    const codes   = reactive({ pattern_status: [] });
    const patterns = reactive([]);

    const searchParam = reactive({ searchValue: '', patternStatusCd: '' });
    const searchParamInit = {};

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [20, 50, 100], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbPatternMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'patternList-pager-setPage') {
        baseGridPager.pageNo = param;
        return handleSearchList();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbPatternMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'patternList-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'pattern-open') {
        return window.open('fo-md-cb-cobanul.html?patternId=' + encodeURIComponent(param), '_blank');
      } else if (cmd === 'pattern-delete') {
        return handleDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 ############################################### */

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue) params.searchType = 'patternNm,patternDesc,memberNm';
        const res = await mdCbApiSvc.pattern.getPage(params, '코바늘도안관리', '목록조회');
        const data = res.data?.data || {};
        patterns.splice(0, patterns.length, ...(data.pageList || []));
        baseGridPager.pageTotalCount = data.pageTotalCount || 0;
        baseGridPager.pageTotalPage  = data.pageTotalPage || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const handleDelete = async (row) => {
      const ok = await showConfirm('삭제', `[${row.patternNm}] 도안을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await mdCbApiSvc.pattern.remove(row.patternId, '코바늘도안관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['CB_PATTERN_STATUS_CD'], { compNm: 'MdCbPatternMng' });
      codes.pattern_status = codeStore.sgGetGrpCodes('CB_PATTERN_STATUS_CD');
    };

    const fnStatusBadge = (cd) => cd === 'PUBLISHED' ? 'badge-green' : (cd === 'PRIVATE' ? 'badge-gray' : 'badge-blue');

    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);
    };
    onMounted(initPage);

    /* ##### [05] 컬럼정의 #################### */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '도안명/설명/작성회원 검색' },
      { key: 'patternStatusCd', type: 'select', label: '상태', options: () => codes.pattern_status, nullLabel: '상태 전체' },
    ];

    columns.baseGrid = [
      { key: 'patternNm',       label: '도안명' },
      { key: 'memberNm',        label: '작성회원', fmt: (v, r) => v || r.memberId || '(관리자)' },
      { key: 'rowCount',        label: '단수', align: 'center', fmt: v => v != null ? v + '단' : '-' },
      { key: 'maxStitchCount',  label: '코수', align: 'center', fmt: v => v != null ? v + '코' : '-' },
      { key: 'patternStatusCd', label: '상태', align: 'center', badge: (r) => fnStatusBadge(r.patternStatusCd), fmt: (v, r) => r.patternStatusCdNm || v || '-' },
      { key: 'regDate',         label: '등록일', align: 'center', fmt: v => coUtil.cofYmd(v) || '-' },
      { type: 'actions', actions: [
        { label: '열기', cls: 'btn btn_row_open', onClick: (row) => handleSelectAction('pattern-open', row.patternId) },
        { label: '삭제', cls: 'btn btn_row_delete',    onClick: (row) => handleSelectAction('pattern-delete', row) },
      ] },
    ];

    return {
      columns, uiState, searchParam, patterns, baseGridPager,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="코바늘 도안관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <bo-container bare :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid :columns="columns.baseGrid" :rows="patterns" row-key="patternId" :loading="uiState.loading"
      max-height="calc(100vh - 320px)" list-title="도안목록" empty-text="등록된 도안이 없습니다." />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('patternList-pager-setPage', n)" :on-size-change="() => handleSelectAction('patternList-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};

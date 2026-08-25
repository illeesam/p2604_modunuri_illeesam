/* ShopJoy Admin - 소스젠 다운로드이력관리 (FO [⬇ ZIP 다운로드] 클릭 로그 조회 — 파일 재보관 없음, 조회 전용) */
window.MdSgDownloadHistMng = {
  name: 'MdSgDownloadHistMng',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState  = reactive({ loading: false, error: null });
    const downloadHists = reactive([]);

    const searchParam = reactive({ searchValue: '' });
    const searchParamInit = {};

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [20, 50, 100], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgDownloadHistMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'histList-pager-setPage') {
        baseGridPager.pageNo = param;
        return handleSearchList();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgDownloadHistMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'histList-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'hist-project-open') {
        if (!param) return;
        return window.open('fo-md-sg-sourcegen.html?view=editor&projectId=' + encodeURIComponent(param), '_blank');
      } else if (cmd === 'hist-delete') {
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
        if (params.searchValue) params.searchType = 'projectNm,zipFileNm,basePackage,memberNm';
        const res = await mdSgApiSvc.downloadHist.getPage(params, '소스젠다운로드이력관리', '목록조회');
        const data = res.data?.data || {};
        downloadHists.splice(0, downloadHists.length, ...(data.pageList || []));
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
      const ok = await showConfirm('이력 삭제', `[${row.zipFileNm || '(파일명 없음)'}] 다운로드이력을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await mdSgApiSvc.downloadHist.remove(row.downloadHistId, '소스젠다운로드이력관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    const initPage = async () => {
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);
    };
    onMounted(initPage);

    /* ##### [05] 컬럼정의 #################### */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '프로젝트명/파일명/패키지/회원 검색' },
    ];

    columns.baseGrid = [
      { key: 'regDate',      label: '다운로드일시', align: 'center', fmt: v => coUtil.cofYmdHm(v) || '-' },
      { key: 'projectNm',    label: '프로젝트명', fmt: v => v || '(저장 전 다운로드)' },
      { key: 'zipFileNm',    label: '파일명', fmt: v => v || '-' },
      { key: 'basePackage',  label: 'Base Package', fmt: v => v || '-' },
      { key: 'ddlCount',     label: '테이블', align: 'center', fmt: v => (v || 0) + '개' },
      { key: 'fileCount',    label: '파일수', align: 'center', fmt: v => (v || 0) + '개' },
      { key: 'memberNm',     label: '다운로드 회원', fmt: v => v || '-' },
      /* type:'actions' — 재다운로드 버튼 없음(파일 자체를 재보관하지 않는 로그 전용 화면) */
      { type: 'actions', actions: [
        { label: '프로젝트',  cls: 'btn btn_detail btn-xs', visible: (row) => !!row.projectId, onClick: (row) => handleSelectAction('hist-project-open', row.projectId) },
        { label: '삭제',      cls: 'btn btn_row_delete',    onClick: (row) => handleSelectAction('hist-delete', row) },
      ] },
    ];

    return {
      columns, uiState, searchParam, downloadHists, baseGridPager,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="소스젠 다운로드이력관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <bo-container bare :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid :columns="columns.baseGrid" :rows="downloadHists" row-key="downloadHistId" :loading="uiState.loading"
      max-height="calc(100vh - 320px)" list-title="다운로드이력" empty-text="다운로드 기록이 없습니다." />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('histList-pager-setPage', n)" :on-size-change="() => handleSelectAction('histList-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};

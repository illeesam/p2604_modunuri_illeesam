/* ShopJoy Admin - 소스젠 프로젝트관리 (전체 회원 프로젝트 조회/삭제, 실제 DDL 편집은 mdSgSourcegen.html) */
window.MdSgProjectMng = {
  name: 'MdSgProjectMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState  = reactive({ loading: false, error: null });
    const codes    = reactive({ project_status: [], db_type: [] });
    const projects = reactive([]);

    const searchParam = reactive({ searchValue: '', projectStatusCd: '', dbTypeCd: '', useYn: '' });
    const searchParamInit = {};

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [20, 50, 100], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgProjectMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'projectList-pager-setPage') {
        baseGridPager.pageNo = param;
        return handleSearchList();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgProjectMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'projectList-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'project-open') {
        /* 실제 편집은 독립 모듈 화면에서 한다 — BO 는 조회·정리만 담당 */
        return window.open('mdSgSourcegen.html?view=editor&projectId=' + encodeURIComponent(param), '_blank');
      } else if (cmd === 'project-hist') {
        return props.navigate('mdSgGenHistMng', { projectId: param });
      } else if (cmd === 'project-delete') {
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
        if (params.searchValue) params.searchType = 'projectNm,projectDesc,basePackage,memberNm';
        const res = await mdSgApiSvc.project.getPage(params, '소스젠프로젝트관리', '목록조회');
        const data = res.data?.data || {};
        projects.splice(0, projects.length, ...(data.pageList || []));
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
      const ok = await showConfirm('삭제',
        `[${row.projectNm}] 프로젝트를 삭제하시겠습니까?\nDDL 탭과 생성이력이 함께 삭제됩니다.`);
      if (!ok) return;
      try {
        await mdSgApiSvc.project.remove(row.projectId, '소스젠프로젝트관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['SG_PROJECT_STATUS_CD', 'SG_DB_TYPE_CD'], { compNm: 'MdSgProjectMng' });
      codes.project_status = codeStore.sgGetGrpCodes('SG_PROJECT_STATUS_CD');
      codes.db_type        = codeStore.sgGetGrpCodes('SG_DB_TYPE_CD');
    };

    /* SG_PROJECT_STATUS_CD 실제 값은 DRAFT(작성중)/DONE(생성완료) — ACTIVE/ARCHIVED 는 없다(DB 확인, 2026-08-25 수정) */
    const fnStatusBadge = (cd) => cd === 'DONE' ? 'badge-green' : (cd === 'DRAFT' ? 'badge-blue' : 'badge-gray');

    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);
    };
    onMounted(initPage);

    /* ##### [05] 컬럼정의 #################### */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '프로젝트명/설명/패키지/작성회원 검색' },
      { key: 'projectStatusCd', type: 'select', label: '상태', options: () => codes.project_status, nullLabel: '상태 전체' },
      { key: 'dbTypeCd', type: 'select', label: 'DB', options: () => codes.db_type, nullLabel: 'DB 전체' },
    ];

    columns.baseGrid = [
      { key: 'projectNm',        label: '프로젝트명' },
      { key: 'memberNm',         label: '작성회원', fmt: (v, r) => v || r.regUserNm || r.memberId || '(관리자)' },
      { key: 'basePackage',      label: 'Base Package', fmt: v => v || '-' },
      { key: 'dbTypeCd',         label: 'DB', align: 'center', fmt: (v, r) => r.dbTypeCdNm || v || '-' },
      { key: 'ddlCount',         label: 'DDL', align: 'center', fmt: v => (v || 0) + '개' },
      { key: 'genHistCount',     label: '생성이력', align: 'center', fmt: v => (v || 0) + '건' },
      { key: 'lastGenDate',      label: '최근생성', align: 'center', fmt: v => coUtil.cofYmd(v) || '-' },
      { key: 'projectStatusCd',  label: '상태', align: 'center',
        badge: (r) => fnStatusBadge(r.projectStatusCd), fmt: (v, r) => r.projectStatusCdNm || v || '-' },
      { key: 'regDate',          label: '등록일', align: 'center', fmt: v => coUtil.cofYmd(v) || '-' },
      /* type:'actions' — 관리 버튼모음도 별도 배열로 분리하지 않고 baseGrid 항목 하나로 선언(#row-actions 슬롯 대체, 2026-08-25) */
      { type: 'actions', actions: [
        { label: '열기', cls: 'btn btn_detail btn-xs', onClick: (row) => handleSelectAction('project-open', row.projectId) },
        { label: '이력', cls: 'btn btn_detail btn-xs', onClick: (row) => handleSelectAction('project-hist', row.projectId) },
        { label: '삭제', cls: 'btn btn_row_delete',    onClick: (row) => handleSelectAction('project-delete', row) },
      ] },
    ];

    return {
      columns, uiState, searchParam, projects, baseGridPager,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="소스젠 프로젝트관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <bo-container bare :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid :columns="columns.baseGrid" :rows="projects" row-key="projectId" :loading="uiState.loading"
      list-title="프로젝트목록" empty-text="등록된 프로젝트가 없습니다." />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('projectList-pager-setPage', n)" :on-size-change="() => handleSelectAction('projectList-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};

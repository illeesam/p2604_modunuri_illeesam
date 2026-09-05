/* ShopJoy Admin - 소스젠 생성이력관리 (전체 프로젝트의 생성 ZIP 보관내역 조회/다운로드/삭제)
   프로젝트관리에서 [이력] 로 진입하면 navigate param 의 projectId 로 필터링된 상태로 열린다. */
window.MdSgGenHistMng = {
  name: 'MdSgGenHistMng',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    projectId: { type: String,   default: null },  // 특정 프로젝트 이력만 볼 때
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState  = reactive({ loading: false, error: null });
    const genHists = reactive([]);

    const searchParam = reactive({ searchValue: '', projectId: '' });
    const searchParamInit = {};

    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [20, 50, 100], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgGenHistMng.js : handleBtnAction -> ', cmd, param);
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
      } else if (cmd === 'projectFilter-clear') {
        searchParam.projectId = '';
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgGenHistMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'histList-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'hist-project-open') {
        if (!param) return;
        return window.open('fo-md-sg-sourcegen.html?view=editor&projectId=' + encodeURIComponent(param), '_blank');
      } else if (cmd === 'hist-download') {
        if (!param) { return showToast('보관된 ZIP 이 없습니다.', 'error'); }
        return window.open(param, '_blank');
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
        if (params.searchValue) params.searchType = 'projectNm,zipFileNm,genMemo,basePackage,memberNm';
        const res = await mdSgApiSvc.genHist.getPage(params, '소스젠이력관리', '목록조회');
        const data = res.data?.data || {};
        genHists.splice(0, genHists.length, ...(data.pageList || []));
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
      const ok = await showConfirm('이력 삭제', `[${row.zipFileNm}] 생성이력을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await mdSgApiSvc.genHist.remove(row.sourcegenHistId, '소스젠이력관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    const initPage = async () => {
      /* 프로젝트관리 [이력] 버튼으로 넘어온 경우 그 프로젝트로 좁혀서 연다 */
      if (props.projectId) { searchParam.projectId = props.projectId; }
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);
    };
    onMounted(initPage);

    /* ##### [05] 컬럼정의 #################### */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '프로젝트명/파일명/메모/패키지/작성회원 검색' },
    ];

    columns.baseGrid = [
      { key: 'genDate',      label: '생성일시', align: 'center', fmt: v => coUtil.cofYmdHm(v) || '-' },
      { key: 'projectNm',    label: '프로젝트명', fmt: v => v || '(삭제된 프로젝트)' },
      { key: 'zipFileNm',    label: '파일명' },
      { key: 'basePackage',  label: 'Base Package', fmt: v => v || '-' },
      { key: 'ddlCount',     label: '테이블', align: 'center', fmt: v => (v || 0) + '개' },
      { key: 'fileCount',    label: '파일수', align: 'center', fmt: v => (v || 0) + '개' },
      { key: 'zipFileSize',  label: '크기', align: 'right', fmt: v => coUtil.cofFileSize(v) },
      { key: 'genMemo',      label: '메모', fmt: v => v || '-' },
      { key: 'memberNm',     label: '작성회원', fmt: (v, r) => v || r.regUserNm || '-' },
      /* type:'actions' — 관리 버튼모음도 별도 배열로 분리하지 않고 baseGrid 항목 하나로 선언(#row-actions 슬롯 대체, 2026-08-25) */
      { type: 'actions', actions: [
        { label: '프로젝트',  cls: 'btn btn_detail btn-xs', onClick: (row) => handleSelectAction('hist-project-open', row.projectId) },
        { label: '다운로드',  cls: 'btn btn_detail btn-xs', onClick: (row) => handleSelectAction('hist-download', row.zipUrl) },
        { label: '삭제',      cls: 'btn btn_row_delete',    onClick: (row) => handleSelectAction('hist-delete', row) },
      ] },
    ];

    return {
      columns, uiState, searchParam, genHists, baseGridPager,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="소스젠 생성이력관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
    <div v-if="searchParam.projectId" style="display:flex;align-items:center;gap:8px;margin-top:8px;">
      <span class="badge badge-purple" style="font-size:11px;">프로젝트 #{{ searchParam.projectId }} 이력만</span>
      <button class="btn btn_reset btn-xs" @click="handleBtnAction('projectFilter-clear')">전체 보기</button>
    </div>
  </bo-container>
  <bo-container bare :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid :columns="columns.baseGrid" :rows="genHists" row-key="sourcegenHistId" :loading="uiState.loading"
      max-height="calc(100vh - 320px)" list-title="생성이력" empty-text="보관된 생성이력이 없습니다." />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('histList-pager-setPage', n)" :on-size-change="() => handleSelectAction('histList-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};

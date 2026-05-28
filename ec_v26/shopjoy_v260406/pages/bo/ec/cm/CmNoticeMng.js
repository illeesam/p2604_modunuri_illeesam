/* ShopJoy Admin - 공지사항관리
 * ★ BO Mng 표준 참조 모델 (2026-05-28) — 신규 Mng 작성 시 이 파일 구조를 따른다.
 *   - coUtil.cofGrid(baseGrid) / coUtil.cofDetail(baseDetail) 캡슐 사용
 *   - setup() 6섹션 [01]~[06] 마커 (dispatch=[02] / init=[03] / 핸들러=[04] / 헬퍼·컬럼=[05])
 *   - cmd 라우팅: '{영역명}-{기능명}' (baseDetail-close, baseGrid-sort, notices-rowEdit)
 *   - 검색: <bo-search-area :columns="baseSearchColumns">
 *   - 목록: <bo-grid :columns="baseGridColumns" :pager="baseGrid.pager" :sort-state="baseGrid">
 *   - 인라인 Dtl: baseDetail.panelKey / editId / dtlMode 바인딩
 *   - 정책: _doc/정책서/sy/sy.51.프로그램설계정책.md §4.8, sy.54.네이밍규칙.md §coUtil 표준 캡슐 변수 명명
 */
window.CmNoticeMng = {
  name: 'CmNoticeMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const { showToast, showConfirm, setApiRes } = window.boApp;
    const notices = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ noticeTypes: [], noticeStatuses: [], date_range_opts: [] });

    const _initSearchParam = () => {
      const y = new Date().getFullYear();
      return { searchValue: '', type: '', status: '', dateRange: '', dateStart: `${y - 3}-01-01`, dateEnd: `${y}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — pager + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), {
      pageSize: 5,
      sortMap: { nm: { asc: 'noticeTitle asc', desc: 'noticeTitle desc' },
                 reg: { asc: 'regDate asc',    desc: 'regDate desc' } },
    });

    /* baseDetail — 인라인 Dtl 패널 (coUtil.cofDetail) */
    const baseDetail = coUtil.cofDetail();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd) => {
      if (cmd === 'searchParam-list')  { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); return handleSearchList(); }
      if (cmd === 'searchParam-dateRange') {
        if (searchParam.dateRange) {
          const r = boUtil.bofGetDateRange(searchParam.dateRange);
          searchParam.dateStart = r ? r.from : '';
          searchParam.dateEnd   = r ? r.to   : '';
        }
        baseGrid.pager.pageNo = 1;
        return;
      }
      if (cmd === 'notices-add')       return baseDetail.openNew();
      if (cmd === 'notices-excel')     return coUtil.cofExportCsv(notices,
        [{ label: 'ID', key: 'noticeId' }, { label: '제목', key: 'noticeTitle' }, { label: '유형', key: 'noticeTypeCd' },
         { label: '상태', key: 'noticeStatusCd' }, { label: '조회수', key: 'viewCount' }, { label: '등록일', key: 'regDate' }],
        '공지목록.csv');
      if (cmd === 'baseDetail-close') return baseDetail.close();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 그리드 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param) => {
      if (cmd === 'notices-sort')             return baseGrid.onSort(param);
      if (cmd === 'notices-pager-setPage')    return baseGrid.setPage(param);
      if (cmd === 'notices-pager-sizeChange') return baseGrid.onSizeChange();
      if (cmd === 'notices-rowEdit')          return baseDetail.openEdit(param);
      if (cmd === 'notices-rowDelete')        return handleDelete(param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.noticeTypes     = s.sgGetGrpCodes('NOTICE_TYPE');
      codes.noticeStatuses  = s.sgGetGrpCodes('NOTICE_STATUS');
      codes.date_range_opts = s.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(),
                         ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
        const d = (await boApiSvc.cmNotice.getPage(params, '공지사항관리', '조회')).data?.data;
        const list = baseGrid.applyPage(d);
        notices.splice(0, notices.length, ...list);
        uiState.error = null;
      } catch (err) {
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async (n) => {
      if (!(await showConfirm('삭제', `[${n.noticeTitle}]을 삭제하시겠습니까?`))) return;
      try {
        const res = await boApiSvc.cmNotice.remove(n.noticeId, '공지사항관리', '삭제');
        setApiRes({ ok: true, status: res.status, data: res.data });
        showToast('삭제되었습니다.', 'success');
        if (baseDetail.selectedId === n.noticeId) baseDetail.close();
        await handleSearchList();
      } catch (err) {
        setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'cmNoticeMng')      { baseDetail.close(); if (opts.reload) handleSearchList(); return; }
      if (pg === '__switchToEdit__') return baseDetail.switchToEdit();
      props.navigate(pg, opts);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const _STATUS_FB = { '게시': 'badge-green', '예약': 'badge-blue', '종료': 'badge-gray', '임시': 'badge-orange' };
    const _TYPE_FB   = { '일반': 'badge-gray', '긴급': 'badge-red', '이벤트': 'badge-blue', '시스템': 'badge-orange' };

    const baseSearchColumns = [
      { key: 'searchValue', label: '제목', type: 'text', placeholder: '제목 검색' },
      { key: 'type',        label: '유형', type: 'select', options: () => codes.noticeTypes,    nullLabel: '유형 전체' },
      { key: 'status',      label: '상태', type: 'select', options: () => codes.noticeStatuses, nullLabel: '상태 전체' },
      { type: 'label', label: '등록일' },
      { key: 'dateRange', type: 'dateRange', startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    const baseGridColumns = [
      { key: 'noticeTypeCd',   label: '유형',     style: 'width:80px;',
        badge: (row) => coUtil.cofCodeBadge('NOTICE_TYPE', row.noticeTypeCd, _TYPE_FB[row.noticeTypeCd] || 'badge-gray') },
      { key: 'noticeTitle',    label: '제목',     sortKey: 'nm', link: true,
        fmt: (v, row) => row.isFixed === 'Y' ? `📌 ${row.noticeTitle || ''}` : (row.noticeTitle || ''),
        cellInnerStyle: (v, row) => baseDetail.selectedId === row.noticeId ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'isFixed',        label: '고정',     style: 'width:70px;',
        badge: (row) => row.isFixed === 'Y' ? 'badge-red' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '고정' : '-' },
      { key: 'startDate',      label: '시작일',   style: 'width:120px;', fmt: (v) => v || '-' },
      { key: 'endDate',        label: '종료일',   style: 'width:120px;', fmt: (v) => v || '-' },
      { key: 'noticeStatusCd', label: '상태',     style: 'width:80px;',
        badge: (row) => coUtil.cofCodeBadge('NOTICE_STATUS', row.noticeStatusCd, _STATUS_FB[row.noticeStatusCd] || 'badge-gray') },
      { key: 'siteNm',         label: '사이트명', style: 'width:110px;', cellStyle: 'color:#2563eb;', fmt: () => boUtil.bofGetSiteNm() },
      { key: 'regDate',        label: '등록일',   style: 'width:140px;', sortKey: 'reg' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      notices, uiState, codes, searchParam, baseGrid, baseDetail,
      baseSearchColumns, baseGridColumns,
      handleBtnAction, handleSelectAction,
      inlineNavigate,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    공지사항관리
  </div>
  <!-- ===== ■. 검색 영역 =================================================== -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== ■. 목록 영역 ===================================================== -->
  <bo-grid :columns="baseGridColumns" :rows="notices" :pager="baseGrid.pager" row-key="noticeId"
    :sort-state="baseGrid" list-title="공지사항목록"
    :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'"
    :row-class="row => baseDetail.selectedId === row.noticeId ? 'active' : ''" empty-text="데이터가 없습니다."
    @sort="key => handleSelectAction('notices-sort', key)"
    @set-page="n => handleSelectAction('notices-pager-setPage', n)"
    @size-change="handleSelectAction('notices-pager-sizeChange')"
    @row-click="row => handleSelectAction('notices-rowEdit', row.noticeId)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-green btn-sm" @click="handleBtnAction('notices-excel')">📥 엑셀</button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('notices-add')">+ 신규</button>
    </template>
    <template #row-actions="{ row }">
      <div class="actions">
        <button class="btn btn-blue btn-sm" @click="handleSelectAction('notices-rowEdit', row.noticeId)">수정</button>
        <button class="btn btn-danger btn-sm" @click="handleSelectAction('notices-rowDelete', row)">삭제</button>
      </div>
    </template>
  </bo-grid>
  <!-- ===== ■. 상세 패널 (인라인 임베드) ===================================== -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">✕ 닫기</button>
    </div>
    <cm-notice-dtl :key="baseDetail.panelKey" :navigate="inlineNavigate"
      :dtl-id="baseDetail.editId" :dtl-mode="baseDetail.dtlMode"
      :reload-trigger="baseDetail.reloadTrigger" />
  </div>
</div>
`,
};

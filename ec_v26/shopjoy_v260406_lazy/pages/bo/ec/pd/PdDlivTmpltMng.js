/* ShopJoy Admin - 배송템플릿관리 */
window.PdDlivTmpltMng = {
  name: 'PdDlivTmpltMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const dlivTmplts = reactive([]);              // 배송템플릿 목록 (메인 그리드)
    const uiState = reactive({ loading: false, error: null, selectedId: null, sortKey: '', sortDir: 'asc', isNew: false, dtlMode: 'view' }); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => uiState.dtlMode === 'view');
    const codes = reactive({
      USE_YN: [],
      DLIV_METHOD: [], DLIV_PAY_TYPE: [], COURIER: [],
    });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)
    const form = reactive({});                    // 상세 폼 데이터
    const errors = reactive({});                  // 저장 검증 오류 (항목 아래 빨간 라벨)
    const SORT_MAP = { nm: { asc: 'dlivTmpltNm asc', desc: 'dlivTmpltNm desc' } };



    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        return handleSearchList();
      // 신규 등록 패널 열기
      } else if (cmd === 'dlivTmplts-add') {
        return openNew();
      // 상세 폼 저장
      } else if (cmd === 'form-save') {
        return handleSave();
      // 상세 폼 삭제
      } else if (cmd === 'form-delete') {
        return handleDelete();
      // 상세 폼 닫기
      } else if (cmd === 'form-close') {
        return resetDetailToNew();
      // 상세 폼 보기모드 → 수정모드 전환
      } else if (cmd === 'form-edit') {
        return switchToEdit();
      // 상세 폼 수정 취소 (보기모드 복귀 또는 닫기)
      } else if (cmd === 'form-cancel') {
        return handleCancelEdit();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'dlivTmplts-sort') {
        return onSort(param);
      // 페이지 번호 변경
      } else if (cmd === 'dlivTmplts-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/정렬/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'dlivTmplts-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (e.colKey 기준 분기 가능) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PdDlivTmpltMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'dlivTmplts-cellClick') {
        // 행 수정 버튼 → 상세/수정 패널 열기
        if (colKey === 'btn_row_edit') {
          return openDetail(row);
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          // 이미 보기모드로 열려 있는 동일 행 재클릭 시 패널 닫기 (토글, 기존 동작 유지)
          if (uiState.selectedId === row.dlivTmpltId && uiState.dtlMode === 'view') { return resetDetailToNew(); }
          return loadView(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ dlivMethodCd: '', useYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.pdDlivTmplt.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) }, '배송템플릿관리', '목록조회');
        const data = res.data?.data;
        dlivTmplts.splice(0, dlivTmplts.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    /* _loadDetailForm — 인라인 패널에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (row, mode) => {
      Object.assign(form, { ...row });
      uiState.selectedId = row.dlivTmpltId;
      uiState.isNew = false;
      uiState.dtlMode = mode;
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* loadView — 보기모드로 인라인 패널 열기 (행 클릭 / 제목 링크) */
    const loadView = (row) => _loadDetailForm(row, 'view');

    /* openDetail — 수정모드로 인라인 패널 열기 ([수정] 버튼) */
    const openDetail = (row) => _loadDetailForm(row, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 하단 [수정] 버튼) */
    const switchToEdit = () => { uiState.dtlMode = 'edit'; };

    /* resetDetailToNew — 상세 패널 닫기(=미선택 상태로 복귀) */
    const resetDetailToNew = () => { uiState.selectedId = null; uiState.isNew = false; uiState.dtlMode = 'view'; };

    /* handleCancelEdit — 수정 취소: 신규 등록 중이면 패널 닫기, 기존 행 수정 중이면 원본 재적재 후 보기모드 복귀 */
    const handleCancelEdit = () => {
      if (uiState.isNew) { return resetDetailToNew(); }
      const row = cfSelectedRow.value;
      return row ? loadView(row) : resetDetailToNew();
    };

    /* openNew — 신규 등록 폼 열기 (항상 수정모드로 시작) */
    const openNew = () => {
      Object.assign(form, { dlivTmpltId: null, siteId: null, vendorId: null, dlivTmpltNm: '', dlivMethodCd: 'COURIER', dlivPayTypeCd: 'PREPAY', dlivCourierCd: 'CJ', dlivCost: 3000, freeDlivMinAmt: 50000, islandExtraCost: 5000, returnCost: 3000, exchangeCost: 6000, returnCourierCd: 'CJ', returnAddrZip: '', returnAddr: '', returnAddrDetail: '', returnTelNo: '', baseDlivYn: 'N', useYn: 'Y' });
      uiState.selectedId = '__new__';
      uiState.isNew = true;
      uiState.dtlMode = 'edit';
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.dlivTmpltNm) { errors.dlivTmpltNm = '템플릿명을 입력해주세요.'; }
      if (!coUtil.cofIsValidPhone(form.returnTelNo)) { errors.returnTelNo = '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)'; }
      if (Object.keys(errors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      const isNewTmplt = uiState.isNew;
      const src = dlivTmplts;
      if (isNewTmplt) { form.dlivTmpltId = 'DT' + String(Date.now()).slice(-6); src.push({ ...form }); uiState.selectedId = form.dlivTmpltId; uiState.isNew = false; }
      else { const si = src.findIndex(t => t.dlivTmpltId === form.dlivTmpltId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await boApiSvc.pdDlivTmplt.save(form.dlivTmpltId || null, { ...form }, '배송템플릿관리', isNewTmplt ? '등록' : '저장');
        uiState.dtlMode = 'view';
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) { return; }
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.dlivTmpltNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = dlivTmplts.findIndex(t => t.dlivTmpltId === cfSelectedRow.value.dlivTmpltId); if (si !== -1) dlivTmplts.splice(si, 1); resetDetailToNew();
      try {
        const res = await boApiSvc.pdDlivTmplt.remove(cfSelectedRow.value.dlivTmpltId, '배송템플릿관리', '삭제');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };


    /* fnYnBadge — 사용여부 배지 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnMethodBadge — 배송방법 배지 (sy_code DLIV_METHOD code_opt1 우선) */
    const _DLIV_METHOD_FB = { COURIER:'badge-blue', DIRECT:'badge-orange', PICKUP:'badge-green' };
    const fnMethodBadge = v => coUtil.cofCodeBadge('DLIV_METHOD_CD', v, _DLIV_METHOD_FB[v] || 'badge-gray');

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['USE_YN', 'DLIV_METHOD_CD', 'DLIV_PAY_TYPE_CD', 'COURIER'], {compNm: 'PdDlivTmpltMng'});
      try {
        codes.USE_YN = codeStore.sgGetGrpCodes('USE_YN');
        codes.DLIV_METHOD  = codeStore.sgGetGrpCodes('DLIV_METHOD_CD');
        codes.DLIV_PAY_TYPE = codeStore.sgGetGrpCodes('DLIV_PAY_TYPE_CD');
        codes.COURIER      = codeStore.sgGetGrpCodes('COURIER');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    const cfSelectedRow = computed(() => dlivTmplts.find(t => t.dlivTmpltId === uiState.selectedId) || null);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '템플릿명', type: 'text', placeholder: '템플릿명 검색' },
      { key: 'dlivMethodCd', label: '배송방법', type: 'select', options: () => codes.DLIV_METHOD, nullLabel: '전체' },
      { key: 'useYn', label: '사용여부', type: 'select', options: () => codes.USE_YN, nullLabel: '전체' },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'dlivTmpltNm',   label: '템플릿명', sortKey: 'nm', link: true },
      { key: 'dlivMethodCd',  label: '배송방법',   style: 'width:90px;', badge: (row) => fnMethodBadge(row.dlivMethodCd) },
      { key: 'dlivPayTypeCd', label: '결제유형',   style: 'width:80px;', badge: () => 'badge-gray' },
      { key: 'dlivCost',      label: '기본배송비', style: 'width:100px;text-align:right;', align: 'right',
        fmt: (v) => (coUtil.cofWon(v)) },
      { key: 'freeDlivMinAmt',label: '무료배송조건',style: 'width:120px;text-align:right;', align: 'right',
        fmt: (v) => (v ? v.toLocaleString() + '원 이상' : '무조건 유료') },
      { key: 'returnCost',    label: '반품배송비', style: 'width:100px;text-align:right;', align: 'right',
        fmt: (v) => (coUtil.cofWon(v)) },
      { key: 'baseDlivYn',    label: '기본',       style: 'width:70px;text-align:center;', align: 'center',
        badge: (row) => (row.baseDlivYn === 'Y' ? 'badge-orange' : 'badge-gray') },
      { key: 'useYn',         label: '사용',       style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => fnYnBadge(row.useYn) },
          { key: 'siteNm', label: '사이트' },
      { type: 'actions', actions: [
        { label: '수정', cls: 'btn btn_row_edit btn-sm', onClick: (row) => handleGridCellAction('dlivTmplts-cellClick', 'btn_row_edit', row) },
      ] },
    ];

    // 기본 폼 — cols=3 기준 자연 배치
    columns.baseForm = [
      { type: 'group', label: '기본 · 배송비 설정' },
      /* 1행: 템플릿명(2) + 배송방법(1) */
      { key: 'dlivTmpltNm',      label: '템플릿명', type: 'text', required: true, colSpan: 2 },
      { key: 'dlivMethodCd',     label: '배송방법', type: 'select', nullable: false,
        options: () => codes.DLIV_METHOD },
      /* 2행: 결제유형 + 택배사 + 기본배송비 */
      { key: 'dlivPayTypeCd',    label: '배송비 결제유형', type: 'select', nullable: false,
        options: () => codes.DLIV_PAY_TYPE },
      { key: 'dlivCourierCd',    label: '배송 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.COURIER },
      { key: 'dlivCost',         label: '기본 배송비 (원)', type: 'number' },
      /* 3행: 무료배송 최소 + 도서산간 + 반품배송비 편도 */
      { key: 'freeDlivMinAmt',   label: '무료배송 최소금액 (원)', type: 'number' },
      { key: 'islandExtraCost',  label: '도서산간 추가배송비 (원)', type: 'number' },
      { key: 'returnCost',       label: '반품배송비 편도 (원)', type: 'number' },
      { type: 'group', label: '반품정보' },
      /* 4행: 교환배송 왕복 + 반품 택배사 + 반품지 우편번호 */
      { key: 'exchangeCost',     label: '교환배송비 왕복 (원)', type: 'number' },
      { key: 'returnCourierCd',  label: '반품 택배사', type: 'select', nullLabel: '없음',
        options: () => codes.COURIER },
      { key: 'returnAddrZip',    label: '반품지 우편번호', type: 'text' },
      /* 5행: 반품지 전화번호 + 기본배송지 + 사용여부 */
      { key: 'returnTelNo',      label: '반품지 전화번호', type: 'text',
        validate: (v) => !coUtil.cofIsValidPhone(v) ? '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)' : null },
      { key: 'baseDlivYn',       label: '기본 배송지', type: 'select', options: () => codes.USE_YN },
      { key: 'useYn',            label: '사용여부', type: 'select', options: () => codes.USE_YN },
      /* 6~7행: 반품지 주소/상세주소 (전체 폭) */
      { key: 'returnAddr',       label: '반품지 주소', type: 'text', colSpan: 3 },
      { key: 'returnAddrDetail', label: '반품지 상세주소', type: 'text', colSpan: 3 },
    ];

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => ({ ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, cfDtlMode, searchParam, baseGridPager, dlivTmplts, form, errors,       // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction, // dispatch
    };
  },
  template: `
<bo-page title="배송템플릿관리" :share-query="searchParam"
  desc-summary="배송템플릿은 상품에 공통 적용할 배송비 조건을 미리 정의해두는 설정입니다."
  :desc-detail="['✔ 무료·고정·조건부(금액/수량) 배송비 방식을 선택하고 상품 등록 시 템플릿을 연결해 재사용합니다.','✔ 도서·산간 지역 추가 배송비, 반품지 주소를 함께 관리합니다.','✔ 업체(벤더)별로 독립 설정이 가능하며, 여러 상품이 동일 템플릿을 공유할 수 있습니다.','예) 3만원 이상 무료배송, 제주·도서 추가 3,000원'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <bo-container title="배송템플릿 목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <button class="btn btn_new" @click="handleBtnAction('dlivTmplts-add')">+ 신규</button>
    </template>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid bare
      :columns="columns.baseGrid" :rows="dlivTmplts" row-key="dlivTmpltId" :selected-key="uiState.selectedId"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-class="(row) => uiState.selectedId===row.dlivTmpltId ? 'active' : ''"
      @sort="key => handleBtnAction('dlivTmplts-sort', key)" grid-id="dlivTmplts-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
    <!-- 페이저는 그리드 밖, 컨테이너 안에 배치 -->
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('dlivTmplts-pager-setPage', n)" :on-size-change="() => handleSelectAction('dlivTmplts-pager-sizeChange')" />
    <bo-excel-down-modal :show="excelModal.show" domain="pdDlivTmplt" area-nm="배송템플릿"
      :columns="columns.baseGrid" ui-nm="배송템플릿관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>
  <!-- ===== □. 목록 그리드 =================================================== -->
  <!-- ===== ■. 상세 패널 (항상 표시 — 미선택 시 안내, 선택/신규 시 폼) ============== -->
  <bo-container>
    <!-- ===== ■.■. 상세 툴바: 제목만 (저장/삭제/닫기는 하단 form-actions) ======== -->
    <div class="toolbar">
      <span class="list-title">
        {{ !uiState.selectedId ? '배송템플릿 상세' : (uiState.isNew ? '배송템플릿 신규' : (cfDtlMode ? '배송템플릿 상세' : '배송템플릿 수정')) }}
        <span v-if="uiState.selectedId ? (!uiState.isNew ? (form.dlivTmpltId) : false) : false" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
          #{{ form.dlivTmpltId }}
        </span>
      </span>
    </div>
    <!-- ===== □.□. 상세 툴바 ================================================ -->
    <!-- ===== ■.■. 미선택 안내 (행 미선택 시) ==================================== -->
    <div v-if="!uiState.selectedId" style="text-align:center;color:#bbb;font-size:13px;padding:32px 16px;">목록에서 행을 선택하거나 [+신규]를 누르세요.</div>
    <!-- ===== ■.■. 상세 입력폼 (BoFormArea 자동 렌더) ======================== -->
    <div v-else style="padding:12px">
      <!-- ===== ■.■.■. 폼 영역 ================================================ -->
      <bo-form-area :columns="columns.baseForm" :form="form" :errors="errors"
        :cols="3" compact :show-actions="false" :readonly="cfDtlMode" plain-readonly />
      <!-- ===== ■.■.■. 하단 액션 — 보기모드=[수정][닫기] / 수정모드=[저장][삭제][취소] (.form-actions 중앙 정렬) ===== -->
      <bo-form-actions :readonly="cfDtlMode" :show-delete="!uiState.isNew" :edit-click="() => handleBtnAction('form-edit')"
 :save-click="() => handleBtnAction('form-save')"
 :delete-click="() => handleBtnAction('form-delete')"
 :cancel-click="() => handleBtnAction('form-cancel')"
 :close-click="() => handleBtnAction('form-close')" />
    </div>
  </bo-container>
  <!-- ===== □. 상세 패널 =================================================== -->
</bo-page>
`
};

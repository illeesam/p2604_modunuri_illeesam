/* ShopJoy Admin - 첨부관리 (좌30% 그룹 + 우70% 파일) */
window.SyAttachMng = {
  name: 'SyAttachMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const attaches = reactive([]);
    const attachGrps = reactive([]);
    const uiState = reactive({ fileEditMode: false, grpEditMode: false, loading: false, error: null, isPageCodeLoad: false, selectedGrpId: null, grpEditId: null, fileEditId: null });
    const codes = reactive({ attach_type: [], active_statuses: [], use_yns: [], storage_types: [], date_range_opts: [] });
    const grpSearchParam = reactive({ searchType: '', searchValue: '' });

    const fileGridPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageNums: [], pageSizes: [5, 10, 20, 30, 50, 100, 200, 500],
    });
    /* 첨부그룹 페이저 (좌측 영역 페이징) */
    const grpPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageNums: [], pageSizes: [5, 10, 20, 50],
    });

    const searchParam = reactive({ searchType: '', searchValue: '', attachGrpId: '', dateRange: '', dateStart: '', dateEnd: '' });

    /* -- 첨부그룹 -- */
    const grpForm = reactive({ attachGrpNm: '', attachGrpCode: '', attachGrpRemark: '', maxFileCount: 10, maxFileSize: 5, fileExtAllow: 'jpg,png', useYn: 'Y' });

    /* -- 첨부파일 -- */
    const fileForm = reactive({
      attachGrpId: null, fileNm: '', fileSize: 0, fileExt: '', mimeTypeCd: '',
      storedNm: '', storageType: '', storagePath: '', attachUrl: '', cdnHost: '', cdnImgUrl: '',
      thumbFileNm: '', thumbStoredNm: '', thumbUrl: '', thumbCdnUrl: '', thumbGeneratedYn: 'N',
      sortOrd: 0, attachMemo: '', refId: '',
    });

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyAttachMng.js : handleBtnAction -> ', cmd, param);
      // 첨부파일 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 첨부파일 검색조건 초기화
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 첨부그룹 검색조건으로 그룹 조회
      } else if (cmd === 'attachGrps-search') {
        return onGrpSearch();
      // 첨부그룹 신규 등록 폼 열기
      } else if (cmd === 'attachGrps-add') {
        return openGrpNew();
      // 첨부그룹 폼 저장
      } else if (cmd === 'attachGrps-save') {
        return handleSaveGrp();
      // 첨부그룹 폼 닫기
      } else if (cmd === 'attachGrps-formClose') {
        uiState.grpEditMode = false;
        return;
      // 첨부파일 신규 등록 폼 열기
      } else if (cmd === 'attaches-add') {
        return openFileNew();
      // 첨부파일 폼 저장
      } else if (cmd === 'attaches-save') {
        return handleSaveFile();
      // 첨부파일 폼 닫기
      } else if (cmd === 'attaches-formClose') {
        uiState.fileEditMode = false;
        return;
      // 첨부그룹 페이지 번호 클릭
      } else if (cmd === 'attachGrps-pager-setPage') {
        return setGrpPage(param);
      // 첨부파일 페이지 번호 클릭
      } else if (cmd === 'attaches-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyAttachMng.js : handleSelectAction -> ', cmd, param);
      // 첨부그룹 카드 선택 (좌측 패널)
      if (cmd === 'attachGrps-rowSelect') {
        return selectGrp(param);
      // 첨부그룹 수정 버튼
      } else if (cmd === 'attachGrps-rowEdit') {
        return openGrpEdit(param);
      // 첨부그룹 삭제 버튼
      } else if (cmd === 'attachGrps-rowDelete') {
        return handleDeleteGrp(param);
      // 첨부그룹 페이지 크기 변경
      } else if (cmd === 'attachGrps-pager-sizeChange') {
        return onGrpSizeChange();
      // 첨부파일 수정 버튼
      } else if (cmd === 'attaches-rowEdit') {
        return openFileEdit(param);
      // 첨부파일 삭제 버튼
      } else if (cmd === 'attaches-rowDelete') {
        return handleDeleteFile(param);
      // 첨부파일 페이지 크기 변경
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
    /* fnBuildGrpPageNums — 유틸 */
    const fnBuildGrpPageNums = () => {
      const c = grpPager.pageNo, l = grpPager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      grpPager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
    };

    // 그룹 목록 로드 (서버사이드 페이징 — grpPager 사용)
    /* handleLoadGrps — 처리 */
    const handleLoadGrps = async () => {
      try {
        const p = { pageNo: grpPager.pageNo, pageSize: grpPager.pageSize };
        const sv = (grpSearchParam.searchValue || '').trim();
        if (sv) {
          p.searchValue = sv;
          p.searchType = grpSearchParam.searchType || 'attachGrpNm,attachGrpCode';
        }
        const grpRes = await boApiSvc.syAttachGrp.getPage(p, '첨부파일관리', '그룹조회');
        const data = grpRes.data?.data;
        const list = data?.pageList || data?.list || [];
        attachGrps.splice(0, attachGrps.length, ...list);
        grpPager.pageTotalCount = data?.pageTotalCount ?? data?.totalCount ?? data?.total ?? list.length ?? 0;
        grpPager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(grpPager.pageTotalCount / grpPager.pageSize) || 1;
        fnBuildGrpPageNums();
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    /* onGrpSearch — 이벤트 */
    const onGrpSearch = async () => { grpPager.pageNo = 1; await handleLoadGrps(); };

    /* setGrpPage — 설정 */
    const setGrpPage      = n => { if (n >= 1 && n <= grpPager.pageTotalPage) { grpPager.pageNo = n; handleLoadGrps(); } };
    /* onGrpSizeChange — 이벤트 */
    const onGrpSizeChange = () => { grpPager.pageNo = 1; handleLoadGrps(); };

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
        // 좌측 그룹 클릭 선택이 우선, 없으면 검색 조건 attachGrpId 사용
        if (uiState.selectedGrpId) { p.attachGrpId = uiState.selectedGrpId; }
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (p.searchValue && !p.searchType) {
          p.searchType = 'fileNm,refId';
        }
        const attachRes = await boApiSvc.syAttach.getPage(p, '첨부파일관리', '조회');
        const data = attachRes.data?.data;
        const list = data?.pageList || data?.list || [];
        attaches.splice(0, attaches.length, ...list);
        fileGridPager.pageTotalCount = data?.pageTotalCount ?? data?.totalCount ?? data?.total ?? list.length ?? 0;
        fileGridPager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(fileGridPager.pageTotalCount / fileGridPager.pageSize) || 1;
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
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.attach_type = codeStore.sgGetGrpCodes('ATTACH_TYPE');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      codes.use_yns = codeStore.sgGetGrpCodes('USE_YN');
      codes.storage_types = codeStore.sgGetGrpCodes('STORAGE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(async () => {
      if (isAppReady.value) { fnLoadCodes(); }
      await handleLoadGrps();
      handleSearchData();
    });

    /* onSearch — 조회 */
    const onSearch = async () => { fileGridPager.pageNo = 1; await handleSearchData(); };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, { attachGrpId: '', dateStart: '', dateEnd: '', dateRange: '' });
      uiState.selectedGrpId = null;
      fileGridPager.pageNo = 1;
      handleSearchData();
    };

    /* setPage — 설정 */
    const setPage      = n => { if (n >= 1 && n <= fileGridPager.pageTotalPage) { fileGridPager.pageNo = n; handleSearchData(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { fileGridPager.pageNo = 1; handleSearchData(); };

    /* selectGrp — 선택 (그룹 전환 시 우측 첨부파일 수정폼/선택행 초기화) */
    const selectGrp = (id) => {
      uiState.selectedGrpId = uiState.selectedGrpId === id ? null : id;
      searchParam.attachGrpId = '';
      uiState.grpEditMode = false;
      uiState.fileEditMode = false;   // 첨부파일 수정 폼 닫기 (수정정보 초기화)
      uiState.fileEditId = null;      // 첨부파일 선택행(파란 테두리) 해제 (선택정보 초기화)
      fileGridPager.pageNo = 1;
      fileGridPager.pageTotalCount = 0; fileGridPager.pageTotalPage = 1;
      handleSearchData();
    };

    /* openGrpNew — 열기 */
    const openGrpNew = () => {
      uiState.grpEditId = null; uiState.grpEditMode = true;
      Object.assign(grpForm, { attachGrpNm: '', attachGrpCode: '', attachGrpRemark: '', maxFileCount: 10, maxFileSize: 5, fileExtAllow: 'jpg,png', useYn: 'Y' });
    };

    /* openGrpEdit — 열기 */
    const openGrpEdit = (g) => {
      uiState.grpEditId = g.attachGrpId; uiState.grpEditMode = true;
      Object.assign(grpForm, { ...g });
    };

    /* handleSaveGrp — 그룹 저장 */
    const handleSaveGrp = async () => {
      if (!grpForm.attachGrpNm || !grpForm.attachGrpCode) { showToast('그룹명과 코드는 필수입니다.', 'error'); return; }
      try {
        if (uiState.grpEditId === null) {
          await boApi.post('/bo/sy/attach-grp', { ...grpForm }, coUtil.cofApiHdr('첨부파일관리', '그룹등록'));
          showToast('그룹이 등록되었습니다.', 'success');
        } else {
          await boApi.put(`/bo/sy/attach-grp/${uiState.grpEditId}`, { ...grpForm }, coUtil.cofApiHdr('첨부파일관리', '그룹수정'));
          showToast('저장되었습니다.', 'success');
        }
        uiState.grpEditMode = false;
        await handleLoadGrps();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* handleDeleteGrp — 그룹 삭제 */
    const handleDeleteGrp = async (g) => {
      const ok = await showConfirm('그룹 삭제', `[${g.attachGrpNm}] 그룹을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        await boApi.delete(`/bo/sy/attach-grp/${g.attachGrpId}`, coUtil.cofApiHdr('첨부파일관리', '그룹삭제'));
        if (uiState.selectedGrpId === g.attachGrpId) { uiState.selectedGrpId = null; attaches.splice(0, attaches.length); fileGridPager.totalCount = 0; }
        showToast('삭제되었습니다.', 'success');
        await handleLoadGrps();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* openFileNew — 열기 */
    const openFileNew = () => {
      uiState.fileEditId = null; uiState.fileEditMode = true;
      Object.assign(fileForm, {
        attachGrpId: uiState.selectedGrpId, fileNm: '', fileSize: 0, fileExt: '', mimeTypeCd: '',
        storedNm: '', storageType: 'LOCAL', storagePath: '', attachUrl: '', cdnHost: '', cdnImgUrl: '',
        thumbFileNm: '', thumbStoredNm: '', thumbUrl: '', thumbCdnUrl: '', thumbGeneratedYn: 'N',
        sortOrd: 0, attachMemo: '', refId: '',
      });
    };

    /* openFileEdit — 열기 */
    const openFileEdit = (a) => {
      uiState.fileEditId = a.attachId; uiState.fileEditMode = true;
      Object.assign(fileForm, { ...a });
    };

    /* handleSaveFile — 저장 */
    const handleSaveFile = async () => {
      if (!fileForm.fileNm || !fileForm.attachGrpId) { showToast('그룹과 파일명은 필수입니다.', 'error'); return; }
      try {
        if (uiState.fileEditId === null) {
          await boApi.post('/bo/sy/attach', { ...fileForm }, coUtil.cofApiHdr('첨부파일관리', '파일등록'));
          showToast('파일이 등록되었습니다.', 'success');
        } else {
          await boApi.put(`/bo/sy/attach/${uiState.fileEditId}`, { ...fileForm }, coUtil.cofApiHdr('첨부파일관리', '파일수정'));
          showToast('저장되었습니다.', 'success');
        }
        uiState.fileEditMode = false;
        fileGridPager.pageNo = 1;
        await handleSearchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

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

    /* 첨부파일 fnStatusBadge */
    const _USE_YN_FB = { '활성': 'badge-green', '비활성': 'badge-gray', 'ACTIVE': 'badge-green', 'INACTIVE': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('USE_YN', s, _USE_YN_FB[s] || 'badge-gray');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 파일 그리드
    const columns = {};
    columns.fileGrid = [
      { key: 'attachGrpId', label: '그룹', cellStyle: 'color:#666;',
        fmt: (v, row) => {
          const nm = row.attachGrpNm || attachGrps.find(g => g.attachGrpId === v)?.attachGrpNm || '';
          return `${nm} #${v}`;
        } },
      { key: 'fileNm', label: '파일명', style: 'word-break:break-all;' },
      { key: 'fileSize', label: '크기', style: 'width:70px;', fmt: v => fnFmtSize(v) },
      { key: 'fileExt', label: '확장자', style: 'width:55px;',
        cellInnerStyle: 'background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:11px;' },
      { key: 'refId', label: '참조ID', style: 'width:100px;', cellStyle: 'color:#666;' },
      { key: 'memo', label: '메모', cellStyle: 'color:#888;' },
      { key: 'regDate', label: '등록일', style: 'width:145px;', fmt: v => coUtil.cofYmdHms(v || '') },
      { key: 'siteNm', label: '사이트명', style: 'width:70px;',
        cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    // 그룹 폼
    columns.grpForm = [
      { key: 'attachGrpNm',   label: '그룹명',   type: 'text', required: true, placeholder: '그룹명', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'attachGrpCode', label: '그룹코드', type: 'text', required: true, placeholder: 'PRODUCT_IMG', mono: true, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'fileExtAllow',  label: '허용확장자', type: 'text', placeholder: 'jpg,png,pdf', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'maxFileCount',  label: '최대개수', type: 'number', min: 1 },
      { key: 'maxFileSize',   label: '최대크기(MB)', type: 'number', min: 1 },
      { type: 'rowBreak' },
      { key: 'useYn',         label: '상태', type: 'select', options: () => codes.use_yns, colSpan: 2 },
    ];
    // 파일 폼
    columns.fileForm = [
      { key: 'attachGrpId',      label: '첨부그룹ID', type: 'text', required: true, placeholder: 'ATG...' },
      { key: 'fileNm',           label: '파일명', type: 'text', required: true, placeholder: '파일명.jpg' },
      { key: 'mimeTypeCd',       label: 'MIME타입', type: 'text', placeholder: 'image/jpeg' },
      { key: 'fileExt',          label: '확장자', type: 'text', placeholder: 'jpg' },
      { key: 'fileSize',         label: '파일크기(byte)', type: 'number', placeholder: '0' },
      { key: 'refId',            label: '참조ID', type: 'text', placeholder: 'PROD-001' },
      { key: 'sortOrd',          label: '정렬순서', type: 'number' },
      { key: 'storageType',      label: '스토리지타입', type: 'select', options: () => codes.storage_types },
      { key: 'storagePath',      label: '저장경로', type: 'text', placeholder: '/cdn/{업무명}/YYYY/MM/DD/' },
      { key: 'storedNm',         label: '저장파일명', type: 'text', placeholder: 'YYYYMMDD_hhmmss_seq_random' },
      { key: 'attachUrl',        label: '첨부URL', type: 'text', placeholder: '/uploads/...' },
      { key: 'cdnHost',          label: 'CDN Host', type: 'text', placeholder: 'https://cdn.shopjoy.com' },
      { key: 'cdnImgUrl',        label: 'CDN 이미지URL', type: 'text' },
      { key: 'thumbGeneratedYn', label: '썸네일생성', type: 'select', options: () => codes.use_yns },
      { key: 'thumbFileNm',      label: '썸네일파일명', type: 'text' },
      { key: 'thumbStoredNm',    label: '썸네일저장명', type: 'text' },
      { key: 'thumbUrl',         label: '썸네일URL', type: 'text' },
      { key: 'thumbCdnUrl',      label: '썸네일CDN URL', type: 'text' },
      { key: 'attachMemo',       label: '메모', type: 'text' },
    ];

    /* grpSearchColumns — 첨부그룹 검색 영역 컬럼 */
    columns.grpSearch = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'attachGrpNm',   label: '그룹명' },
          { value: 'attachGrpCode', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '100%' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
    ];

    /* fileSearchColumns — 첨부파일 검색 영역 컬럼 */
    columns.fileSearch = [
      { key: 'attachGrpId', type: 'text', placeholder: '첨부그룹ID', width: '130px' },
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'fileNm', label: '파일명' },
          { value: 'refId',  label: 'RefID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력', width: '150px' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      attaches, attachGrps, uiState, codes, searchParam, fileGridPager, grpPager, grpSearchParam, grpForm, fileForm, // 상태 / 데이터
      handleBtnAction, handleSelectAction,                                                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm,                                                                                                             // computed
      fnFmtSize, fnStatusBadge,                                                                                             // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="첨부관리">
  <!-- ===== ■. 본문 영역 (트리없는 2열: 좌 그룹 30% + 우 파일 70%) ============== -->
  <div class="bo-2col" style="grid-template-columns:minmax(260px,30%) 1fr;">
    <!-- ===== ■.■. 좌: 첨부그룹관리 (30%) ======================================= -->
    <bo-container title="첨부그룹관리" :count-text="grpPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('attachGrps-add')">
          + 신규
        </button>
      </template>
      <div style="padding:0 0 10px 0;">
        <bo-search-area :columns="columns.grpSearch" :param="grpSearchParam" :show-reset="false"
          @search="handleBtnAction('attachGrps-search')" />
      </div>
      <!-- ===== ■.■.■. 그룹 폼 (BoFormArea 자동 렌더) =========================== -->
      <div v-if="uiState.grpEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">
          {{ uiState.grpEditId===null ? '그룹 등록' : '그룹 수정' }}
          <span v-if="uiState.grpEditId" style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">
            #{{ uiState.grpEditId }}
          </span>
        </div>
        <!-- ===== ■.■.■.■. 폼 영역 ============================================ -->
        <bo-form-area :columns="columns.grpForm" :form="grpForm" :errors="{}"
          :cols="2" compact :show-actions="false" />
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn btn-primary btn-sm" style="flex:1;" @click="handleBtnAction('attachGrps-save')">
            저장
          </button>
          <button class="btn btn-secondary btn-sm" style="flex:1;" @click="handleBtnAction('attachGrps-formClose')">
            취소
          </button>
        </div>
      </div>
      <!-- ===== ■.■.■. 그룹 목록 (서버 페이징 — grpPager.pageSize 만큼 1페이지에 표시) ===== -->
      <div style="border:1px solid #eef0f3;border-radius:6px;background:#fff;">
        <div v-for="g in attachGrps" :key="g.attachGrpId"
          style="padding:10px 12px;border-bottom:1px solid #f0f0f0;transition:background .15s;"
          :style="uiState.selectedGrpId===g.attachGrpId ? 'background:#eff6ff;outline:2px solid #2563eb;outline-offset:-2px;position:relative;z-index:1;' : ''"
          @click="handleSelectAction('attachGrps-rowSelect', g.attachGrpId)">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;font-weight:600;color:#333;">
                {{ g.attachGrpNm }}
              </div>
              <div style="font-size:11px;color:#888;margin-top:2px;">
                {{ g.attachGrpCode }} | 최대 {{ g.maxFileCount }}개 / {{ g.maxFileSize }}MB
              </div>
              <div style="font-size:10px;color:#bbb;margin-top:1px;">
                #{{ g.attachGrpId }}
              </div>
            </div>
            <div style="display:flex;gap:4px;" @click.stop>
              <button class="btn btn-blue btn-sm" style="font-size:11px;padding:2px 6px;" @click="handleSelectAction('attachGrps-rowEdit', g)">
                수정
              </button>
              <button class="btn btn-danger btn-sm" style="font-size:11px;padding:2px 6px;" @click="handleSelectAction('attachGrps-rowDelete', g)">
                삭제
              </button>
            </div>
          </div>
          <div style="margin-top:4px;">
            <span class="badge" :class="g.useYn==='Y' ? 'badge-green' : 'badge-gray'" style="font-size:10px;">
              {{ g.useYn==='Y' ? '사용' : '미사용' }}
            </span>
            <span style="font-size:11px;color:#aaa;margin-left:6px;">
              {{ g.fileExtAllow }}
            </span>
            <span style="font-size:11px;color:#2563eb;margin-left:8px;font-weight:500;">
              {{ cfSiteNm }}
            </span>
          </div>
        </div>
        <div v-if="!attachGrps.length" style="text-align:center;color:#999;padding:20px;font-size:13px;">
          {{ grpSearchParam.searchValue ? '검색 결과가 없습니다.' : '그룹이 없습니다.' }}
        </div>
      </div>
      <!-- ===== ■.■.■. /그룹 목록 박스 ========================================= -->
      <!-- ===== ■.■.■. 그룹 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ====================== -->
      <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
        <bo-pager :pager="grpPager" :on-set-page="n => handleBtnAction('attachGrps-pager-setPage', n)" :on-size-change="() => handleSelectAction('attachGrps-pager-sizeChange')"
          style="margin-top:0;min-height:34px;" />
      </div>
    </bo-container>
    <!-- ===== □.□. 좌: 첨부그룹관리 (30%) ======================================= -->
    <!-- ===== ■.■. 우: 첨부파일관리 (70%) ======================================= -->
    <div>
      <!-- ===== ■.■.■. 조회 영역 (별도 컨테이너) ================================= -->
      <bo-container>
        <bo-search-area :columns="columns.fileSearch" :param="searchParam"
          @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
      </bo-container>
      <!-- ===== ■.■.■. 목록 영역 (별도 컨테이너) ================================= -->
      <bo-container title="첨부파일목록" :count-text="fileGridPager.pageTotalCount + '건'">
        <template #toolbar-actions>
          <button class="btn btn-primary btn-sm" @click="handleBtnAction('attaches-add')">
            + 신규
          </button>
        </template>
        <!-- ===== ■.■.■.■. 파일 폼 ============================================== -->
        <div v-if="uiState.fileEditMode" style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:10px 14px 12px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#444;">
            {{ uiState.fileEditId===null ? '파일 등록' : '파일 수정' }}
            <span v-if="uiState.fileEditId" style="font-size:11px;color:#999;font-weight:400;margin-left:6px;">
              #{{ uiState.fileEditId }}
            </span>
          </div>
          <!-- ===== ■.■.■.■.■. 파일 폼 (BoFormArea 자동 렌더, 4컬럼) ==================== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.fileForm" :form="fileForm" :errors="{}"
            :cols="3" compact :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 저장/취소 가운데 정렬 ==================================== -->
          <div style="display:flex;gap:8px;justify-content:center;">
            <button class="btn btn-primary btn-sm" style="min-width:60px;" @click="handleBtnAction('attaches-save')">
              저장
            </button>
            <button class="btn btn-secondary btn-sm" style="min-width:60px;" @click="handleBtnAction('attaches-formClose')">
              취소
            </button>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 파일 그리드 (기본 10개 페이지 + 화면 높이에 따라 반응형으로 확장, 초과 시 내부 스크롤) ===== -->
        <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
          <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
          <bo-grid
            bare
            :columns="columns.fileGrid"
            :rows="attaches"
            row-key="attachId"
            :selected-key="uiState.fileEditId"
            :loading="uiState.loading"
            :empty-text="uiState.loading ? '조회 중...' : '데이터가 없습니다.'"
 row-actions>
            <template #row-actions="{ row }">
              <div class="actions">
                <button class="btn btn-blue btn-xs" @click="handleSelectAction('attaches-rowEdit', row)">
                  수정
                </button>
                <button class="btn btn-danger btn-xs" @click="handleSelectAction('attaches-rowDelete', row)">
                  삭제
                </button>
              </div>
            </template>
          </bo-grid>
        </div>
        <!-- ===== ■.■.■.■. /파일 그리드 스크롤 컨테이너 ================================== -->
        <!-- ===== ■.■.■.■. 페이저: 한 줄 표시 + 좌측 카드처럼 깔끔 마감 (margin-top 좁힘 + nowrap 보장) ===== -->
        <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
          <bo-pager :pager="fileGridPager" :on-set-page="n => handleBtnAction('attaches-pager-setPage', n)" :on-size-change="() => handleSelectAction('attaches-pager-sizeChange')"
            style="margin-top:0;min-height:34px;" />
        </div>
      </bo-container>
    </div>
  </div>
  <!-- ===== □.□. 우: 첨부파일관리 (70%) ======================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->
</bo-page>
`
};

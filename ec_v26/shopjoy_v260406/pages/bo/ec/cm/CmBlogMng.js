/* ShopJoy Admin - 게시판(블로그)관리 */
window.CmBlogMng = {
  name: 'CmBlogMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const blogs = reactive([]);                    // 블로그 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedId: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({                       // 공통코드 / 정적 옵션
      blog_display_statuses: [],
      open_yn_opts:   [{ codeValue: 'Y', codeLabel: '공개' }, { codeValue: 'N', codeLabel: '비공개' }],
      notice_yn_opts: [{ codeValue: 'Y', codeLabel: '공지' }, { codeValue: 'N', codeLabel: '일반' }],
      blog_type_opts: [{ codeValue: 'NEWS', codeLabel: '뉴스' }, { codeValue: 'BLOG', codeLabel: '블로그' }],
    });
    const SORT_MAP = { nm: { asc: 'blogTitle asc', desc: 'blogTitle desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CmBlogMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 블로그 신규 등록 (인라인 패널)
      } else if (cmd === 'blogs-add') {
        return openNew();
      // 상세 인라인 패널 저장
      } else if (cmd === 'detailPanel-save') {
        return handleSave();
      // 상세 인라인 패널 삭제
      } else if (cmd === 'detailPanel-delete') {
        return handleDelete();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'blogs-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'blogs-pager-setPage') {
        return setPage(param);
      // 첨부 그리드 행 추가
      } else if (cmd === 'attach-add') {
        return attachAddRow();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 + <select> 변경 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmBlogMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경 (<select>)
      if (cmd === 'blogs-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 공개/비공개 토글
      } else if (cmd === 'blogs-rowToggleUse') {
        return toggleUse(param);
      // 그리드 행 삭제
      } else if (cmd === 'blogs-rowDelete') {
        return handleDeleteRow(param);
      // 첨부 그리드 선택행 삭제
      } else if (cmd === 'attach-deleteChecked') {
        return attachDeleteChecked();
      // 첨부 그리드 선택행 취소
      } else if (cmd === 'attach-cancelChecked') {
        return attachCancelChecked();
      // 첨부 그리드 드래그 정렬
      } else if (cmd === 'attach-reorder') {
        return attachReorder(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터. colKey 기준 분기 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ CmBlogMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'blogs-cellClick') {
        // 행 수정 버튼 → 상세/수정 패널 열기
        if (colKey === 'btn_row_edit') {
          return openDetail(row);
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return openDetail(row);
        }
      } else if (cmd === 'attach-cellChange') {
        return attachCellChange(row, colKey);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', useYn: '', isNotice: '', blogTypeCd: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    /* _initBlogForm — 빈(신규) 블로그 폼 기본값 */
    const _initBlogForm = () => ({ blogId: null, siteId: 1, blogCateId: null, blogTypeCd: 'BLOG', blogTitle: '', blogSummary: '', blogContent: '', blogAuthor: '', viewCount: 0, useYn: 'Y', isNotice: 'N' });
    const detailPanel = reactive({ show: true, active: false, isNew: false, dtlId: null, form: _initBlogForm() }); // 인라인 Dtl 패널 상태 (항상 표시, active=false 면 버튼 숨김)

    /* ===== 첨부 이미지(cm_blog_file) 관리 그리드 상태 ===== */
    const attachRows = reactive([]);                 // 첨부 그리드 행 (_row_status N/I/U/D)
    const attachUi = reactive({ focusedIdx: null, checkAll: false });
    let _attachTempId = -1;                           // 신규 행 임시 키

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
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...getSortParam(),
          ...coUtil.cofOmitEmpty(searchParam)
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'blogTitle,blogAuthor';
        }
        const res = await boApiSvc.cmBlog.getPage(params, '블로그관리', '목록조회');
        const data = res.data?.data;
        blogs.splice(0, blogs.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };


    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/삭제/닫기 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      Object.assign(detailPanel.form, _initBlogForm());
      detailPanel.dtlId = null; detailPanel.isNew = false; detailPanel.show = true; detailPanel.active = false;
      attachRows.splice(0, attachRows.length);
      attachUi.focusedIdx = null; attachUi.checkAll = false;
    };

    /* _loadAttachRows — row.files[] → 첨부 그리드 행(_row_status='N') 으로 적재 */
    const _loadAttachRows = (files) => {
      const list = (Array.isArray(files) ? files : []).map(f => ({
        blogImgId: f.blogImgId, blogId: f.blogId, imgUrl: f.imgUrl || '', thumbUrl: f.thumbUrl || '',
        imgAltText: f.imgAltText || '', sortOrd: f.sortOrd ?? 0,
        _row_status: 'N', _row_check: false, _row_org: null,
      }));
      list.forEach(r => { r._row_org = { ...r }; });
      attachRows.splice(0, attachRows.length, ...list);
      attachUi.focusedIdx = null; attachUi.checkAll = false;
    };

    /* openDetail — 인라인 패널 열기 (토글)
     *   본문 이미지 경로 '/cdn/...' → 'assets/cdn/...' 보정 후 에디터에 표시 (저장 시 역변환) */
    const openDetail = (row) => {
      Object.assign(detailPanel.form, _initBlogForm(), { ...row });
      detailPanel.form.blogContent = coUtil.cofHtmlCdnToAsset(detailPanel.form.blogContent);
      detailPanel.dtlId = row.blogId; detailPanel.isNew = false; detailPanel.show = true; detailPanel.active = true;
      _loadAttachRows(row.files);
    };

    /* openNew — 신규 등록 */
    const openNew = () => {
      Object.assign(detailPanel.form, _initBlogForm());
      detailPanel.dtlId = '__new__'; detailPanel.isNew = true; detailPanel.show = true; detailPanel.active = true;
      _loadAttachRows([]);
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* handleSave — 저장 (블로그 본문 + 첨부 이미지 일괄) */
    const handleSave = async () => {
      if (!detailPanel.form.blogTitle) { showToast('제목은 필수입니다.', 'error'); return; }
      const isNewPost = detailPanel.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      try {
        /* 저장 페이로드: 본문 이미지 경로 'assets/cdn/...' → '/cdn/...' 역변환 (서버는 /cdn 절대경로 저장) */
        const payload = { ...detailPanel.form, blogContent: coUtil.cofHtmlAssetToCdn(detailPanel.form.blogContent) };
        const res = await (isNewPost
          ? boApiSvc.cmBlog.create(payload, '블로그관리', '등록')
          : boApiSvc.cmBlog.update(detailPanel.form.blogId, payload, '블로그관리', '저장'));
        /* 서버가 채번한 실제 blogId (신규) / 기존 blogId (수정) */
        const savedBlogId = res?.data?.data?.blogId || detailPanel.form.blogId;
        const savedSiteId = res?.data?.data?.siteId || detailPanel.form.siteId;
        /* 첨부 이미지 변경분 저장 (blogId 채번 후) */
        await _saveAttachRows(savedBlogId, savedSiteId);
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        /* 저장 완료: 상세영역 초기화 + 목록 재조회(서버 채번 ID·썸네일 반영) */
        resetDetailToNew();
        await handleSearchList();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 상세 패널 [삭제] (현재 선택 행 기준) */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) { return; }
      return handleDeleteRow(cfSelectedRow.value);
    };

    /* handleDeleteRow — 특정 행 삭제 (그리드 행 [삭제] + 상세 패널 [삭제] 공용) */
    const handleDeleteRow = async (row) => {
      if (!row || !row.blogId) { return; }
      const ok = await showConfirm('삭제', `[${row.blogTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = blogs.findIndex(p => p.blogId === row.blogId);
      if (si !== -1) { blogs.splice(si, 1); }
      // 삭제 행이 현재 상세 패널과 동일하면 패널 초기화
      if (detailPanel.dtlId === row.blogId) { closeDetail(); }
      try {
        const res = await boApiSvc.cmBlog.remove(row.blogId, '블로그관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* toggleUse — 공개/비공개 토글 */
    const toggleUse = async (row) => {
      const newYn = row.useYn === 'Y' ? 'N' : 'Y';
      const ok = await showConfirm('공개설정', `[${row.blogTitle}]을 ${newYn === 'Y' ? '공개' : '비공개'} 처리하시겠습니까?`);
      if (!ok) { return; }
      row.useYn = newYn;
      if (detailPanel.form.blogId === row.blogId) { detailPanel.form.useYn = newYn; }
      try {
        const res = await boApiSvc.cmBlog.setUse(row.blogId, { useYn: newYn }, '블로그관리', '상태변경');
        if (showToast) { showToast('처리되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ===== 첨부 이미지 그리드 행 조작 (BoGridCrud) ===== */
    /* attachAddRow — 행 추가 */
    const attachAddRow = () => {
      const newRow = {
        blogImgId: _attachTempId--, blogId: detailPanel.form.blogId || null, imgUrl: '', thumbUrl: '',
        imgAltText: '', sortOrd: attachRows.length + 1,
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const at = attachUi.focusedIdx !== null ? attachUi.focusedIdx + 1 : attachRows.length;
      attachRows.splice(at, 0, newRow);
      attachUi.focusedIdx = at;
    };

    /* attachDeleteChecked — 선택 행 삭제 (I=즉시 제거 / 그 외=D 마킹) */
    const attachDeleteChecked = () => {
      for (let i = attachRows.length - 1; i >= 0; i--) {
        if (!attachRows[i]._row_check) { continue; }
        if (attachRows[i]._row_status === 'I') { attachRows.splice(i, 1); }
        else { attachRows[i]._row_status = 'D'; }
      }
      attachUi.checkAll = false;
    };

    /* attachCancelChecked — 선택 행 취소 (I=제거 / U·D=원복) */
    const attachCancelChecked = () => {
      for (let i = attachRows.length - 1; i >= 0; i--) {
        const row = attachRows[i];
        if (!row._row_check) { continue; }
        if (row._row_status === 'I') { attachRows.splice(i, 1); }
        else if (row._row_org) { Object.assign(row, row._row_org); row._row_status = 'N'; row._row_check = false; }
      }
      attachUi.checkAll = false;
    };

    /* attachReorder — 드래그 정렬 후 호출 (BoGridCrud 가 attachRows 를 이미 in-place 재배열함).
     *   현재 순서대로 sortOrd 재부여 + 순서 바뀐 기존(N) 행을 U 마킹 (페이로드 = reorder 이벤트, 인자 없음) */
    const attachReorder = () => {
      attachRows.forEach((r, i) => {
        const newOrd = i + 1;
        if (r.sortOrd !== newOrd) {
          r.sortOrd = newOrd;
          if (r._row_status === 'N') { r._row_status = 'U'; }
        }
      });
    };

    /* attachCellChange — 셀 편집 시 N→U 전환 (BoGridCrud 가 1차 처리하나 안전망) */
    const attachCellChange = () => { /* BoGridCrud 내부에서 _row_status 갱신 처리됨 */ };

    /* _saveAttachRows — 블로그 저장 직후 호출. 변경분만 saveList. blogId/siteId 채움 */
    const _saveAttachRows = async (blogId, siteId) => {
      const changed = attachRows.filter(r => r._row_status === 'I' || r._row_status === 'U' || r._row_status === 'D');
      if (!changed.length) { return; }
      const rows = changed.map(r => {
        const isNew = r._row_status === 'I';
        return {
          blogImgId: isNew ? null : r.blogImgId,
          blogId, siteId,
          imgUrl: r.imgUrl, thumbUrl: r.thumbUrl || r.imgUrl, imgAltText: r.imgAltText, sortOrd: r.sortOrd,
          rowStatus: r._row_status,
        };
      });
      await boApiSvc.cmBlogFile.saveList('base', rows, '블로그관리', '첨부저장');
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.blog_display_statuses = codeStore.sgGetGrpCodes('BLOG_DISPLAY_STATUS');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const cfSelectedRow = computed(() => blogs.find(p => p.blogId === detailPanel.dtlId) || null);

    /* fnYnBadge — Y/N 배지 클래스 */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* fnBlogTypeLabel — NEWS/BLOG → 한글 라벨 */
    const fnBlogTypeLabel = v => (codes.blog_type_opts.find(o => o.codeValue === v) || {}).codeLabel || v || '-';
    /* fnBlogTypeBadge — 구분 배지 클래스 (뉴스=blue, 블로그=purple) */
    const fnBlogTypeBadge = v => v === 'NEWS' ? 'badge-blue' : 'badge-purple';

    /* fnRowThumb — 행의 대표 썸네일 URL (cm_blog_file 첫 첨부 thumbUrl/imgUrl, '/cdn/'→'assets/cdn/' 보정) */
    const fnRowThumb = (row) => {
      const f = Array.isArray(row.files) && row.files.length ? row.files[0] : null;
      const raw = (f && (f.thumbUrl || f.imgUrl)) || '';
      return raw ? coUtil.cofImgSrc(raw) : '';
    };

    /* fnAttachPreview — 첨부 그리드 행의 미리보기 URL (thumbUrl 우선, '/cdn/'→'assets/cdn/' 보정) */
    const fnAttachPreview = (row) => {
      const raw = (row && (row.thumbUrl || row.imgUrl)) || '';
      return raw ? coUtil.cofImgSrc(raw) : '';
    };

    /* fnGridRowClass — 그리드 행 클래스 (선택 행 강조) */
    const fnGridRowClass = (row) => (detailPanel.dtlId === row.blogId ? 'active' : '');

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'blogTitle',  label: '제목' },
          { value: 'blogAuthor', label: '작성자' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'blogTypeCd', type: 'select', label: '구분', options: () => codes.blog_type_opts, nullLabel: '전체' },
      { key: 'useYn', type: 'select', label: '공개여부', options: () => codes.open_yn_opts, nullLabel: '전체' },
      { key: 'isNotice', type: 'select', label: '공지여부', options: () => codes.notice_yn_opts, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: '_thumb',     label: '이미지',   style: 'width:64px;', align: 'center' },
      { key: 'blogTypeCd', label: '구분',     style: 'width:70px;', align: 'center',
        badge: row => fnBlogTypeBadge(row.blogTypeCd), fmt: v => fnBlogTypeLabel(v) },
      { key: 'blogTitle',  label: '제목',     sortKey: 'nm', link: true, cellInnerClass: 'title-link',
        fmt: (v, row) => {
          const prefix = row.isNotice === 'Y' ? '[공지] ' : '';
          const summary = row.blogSummary ? ` / ${row.blogSummary}` : '';
          return `${prefix}${row.blogTitle || ''}${summary}`;
        } },
      { key: 'blogAuthor', label: '작성자',   style: 'width:80px;' },
      { key: 'viewCount',  label: '조회수',   style: 'width:80px;', align: 'right',  fmt: v => (v||0).toLocaleString() },
      { key: 'isNotice',   label: '공지',     style: 'width:70px;', align: 'center', badge: row => row.isNotice==='Y' ? 'badge-orange' : 'badge-gray' },
      { key: 'useYn',      label: '공개',     style: 'width:70px;', align: 'center', badge: row => fnYnBadge(row.useYn), fmt: v => v==='Y' ? '공개' : '비공개' },
      { key: 'regDate',    label: '등록일',   style: 'width:140px;', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    // 블로그 폼
    columns.blogForm = [
      { key: 'blogTypeCd',  label: '구분', type: 'select', required: true,
        options: () => (codes.blog_type_opts || []).map(o => ({ value: o.codeValue, label: o.codeLabel })) },
      { key: 'blogTitle',   label: '제목', type: 'text', required: true, colSpan: 2 },
      { key: 'blogAuthor',  label: '작성자', type: 'text' },
      { key: 'isNotice',    label: '공지여부', type: 'select',
        options: () => (codes.notice_yn_opts || []).map(o => ({ value: o.codeValue, label: o.codeValue + ' (' + o.codeLabel + ')' })) },
      { key: 'useYn',       label: '공개여부', type: 'select',
        options: () => (codes.open_yn_opts || []).map(o => ({ value: o.codeValue, label: o.codeValue + ' (' + o.codeLabel + ')' })) },
      { type: 'rowBreak' },
      { key: 'blogSummary', label: '요약', type: 'text', placeholder: '목록에 표시될 요약 내용', colSpan: 3 },
      { type: 'rowBreak' },
      { key: 'blogContent', label: '본문', type: 'slot', name: 'blogContent', colSpan: 3 },
    ];

    // 첨부 이미지 그리드 (BoGridCrud) — 미리보기 + URL/썸네일/대체텍스트/정렬 편집
    columns.attachGrid = [
      { key: '_preview',   label: '미리보기', style: 'width:64px;', align: 'center' },
      { key: 'imgUrl',     label: '이미지 URL', edit: 'text', placeholder: '/cdn/prod/img/blog/blog-1.jpg' },
      { key: 'thumbUrl',   label: '썸네일 URL', edit: 'text', placeholder: '비우면 이미지 URL 사용' },
      { key: 'imgAltText', label: '대체텍스트', edit: 'text' },
      { key: 'sortOrd',    label: '정렬', edit: 'number', style: 'width:70px;', align: 'right' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      blogs, uiState, searchParam, baseGridPager, detailPanel,       // 상태 / 데이터
      attachRows, attachUi,                                          // 첨부 그리드 상태
      handleBtnAction, handleSelectAction, handleGridCellAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      fnGridRowClass, fnRowThumb, fnAttachPreview,         // 헬퍼
    };
  },
  template: `
<bo-page title="게시판(블로그)관리">
  <!-- ===== ■. 검색 ======================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="게시글 목록" :count-text="'총 ' + baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('blogs-add')">
        + 신규
      </button>
    </template>
    <bo-grid bare :columns="columns.baseGrid" :rows="blogs" row-key="blogId" :selected-key="detailPanel.dtlId"
      :sort-state="uiState"
      :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
      @sort="key => handleBtnAction('blogs-sort', key)"
      grid-id="blogs-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" row-actions>
      <template #cell-_thumb="{ row }">
        <img v-if="fnRowThumb(row)" :src="fnRowThumb(row)" :alt="row.blogTitle"
          style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />
        <span v-else style="color:#ccc;font-size:11px;">없음</span>
      </template>
      <template #row-actions="{ row }">
        <button class="btn btn_row_edit" @click.stop="handleGridCellAction('blogs-cellClick', 'btn_row_edit', row)">
          수정
        </button>
        <button class="btn btn_row_delete" @click.stop="handleSelectAction('blogs-rowDelete', row)">
          삭제
        </button>
        <button :class="['btn','btn-xs',row.useYn==='Y'?'btn-secondary':'btn-green']" @click.stop="handleSelectAction('blogs-rowToggleUse', row)">
          {{ row.useYn==='Y'?'비공개':'공개' }}
        </button>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('blogs-pager-setPage', n)" :on-size-change="() => handleSelectAction('blogs-pager-sizeChange')" />
  </bo-container>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (항상 표시, active=false 면 안내문구) ===================== -->
  <bo-container bare>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">
          {{ !detailPanel.active ? '상세 / 등록' : (detailPanel.isNew ? '신규 등록' : '상세 / 수정') }}
          <span v-if="detailPanel.active ? (!detailPanel.isNew ? (detailPanel.form.blogId) : false) : false" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
            #{{ detailPanel.form.blogId }}
          </span>
        </span>
      </div>
      <!-- ===== ■.■. 행 미선택 안내 (active=false) ============================== -->
      <div v-if="!detailPanel.active" style="padding:40px 12px;text-align:center;color:#999;">
        목록에서 행을 선택하거나 [+신규]를 누르세요
      </div>
      <!-- ===== ■.■. 블로그 detail 폼 (BoFormArea 자동 렌더) ======================= -->
      <div v-else style="padding:12px">
        <!-- ===== ■.■.■. 폼 영역 ================================================ -->
        <bo-form-area :columns="columns.blogForm" :form="detailPanel.form" :errors="{}"
          :cols="3" compact :show-actions="false">
          <template #blogContent>
            <base-html-editor v-model="detailPanel.form.blogContent" height="320px" />
          </template>
        </bo-form-area>
        <!-- ===== ■.■.■. 첨부 이미지 관리 (목록 썸네일·상세 이미지 소스) ============= -->
        <div style="margin-top:16px;">
          <bo-grid-crud
            list-title="첨부 이미지"
            :columns="columns.attachGrid" :rows="attachRows" row-key="blogImgId"
            grid-id="attach-cellChange"
            v-model:focused-idx="attachUi.focusedIdx" v-model:check-all="attachUi.checkAll"
            :show-row-id="false" max-height="280px"
            @add="handleBtnAction('attach-add')"
            @delete-checked="handleSelectAction('attach-deleteChecked')"
            @cancel-checked="handleSelectAction('attach-cancelChecked')"
            @reorder="e => handleSelectAction('attach-reorder', e)"
            :show-save="false"
            @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
            <template #cell-_preview="{ row }">
              <img v-if="fnAttachPreview(row)" :src="fnAttachPreview(row)" :alt="row.imgAltText"
                style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />
              <span v-else style="color:#ccc;font-size:11px;">-</span>
            </template>
          </bo-grid-crud>
          <div style="font-size:11px;color:#999;margin-top:4px;">
            * 첫 번째 행(정렬 가장 위)의 이미지가 목록 썸네일로 표시됩니다. 저장은 하단 [저장] 버튼으로 본문과 함께 반영됩니다.
          </div>
        </div>
        <!-- ===== ■.■.■. 하단 액션 (저장/삭제/닫기) — .form-actions 가 중앙 정렬 ===== -->
        <div class="form-actions">
          <button class="btn btn_save" @click="handleBtnAction('detailPanel-save')">
            저장
          </button>
          <button v-if="!detailPanel.isNew" class="btn btn_delete" @click="handleBtnAction('detailPanel-delete')">
            삭제
          </button>
          <button class="btn btn_close" @click="handleBtnAction('detailPanel-close')">
            닫기
          </button>
        </div>
      </div>
      <!-- ===== □.■. 블로그 detail 폼 ========================================== -->
    </div>
  </bo-container>
  <!-- ===== □. 상세 패널 =================================================== -->
</bo-page>
`,
};

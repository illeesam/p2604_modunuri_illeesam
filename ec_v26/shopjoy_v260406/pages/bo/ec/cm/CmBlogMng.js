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
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const blogs = reactive([]);                    // 블로그 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedId: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({                       // 공통코드 / 정적 옵션
      blog_display_statuses: [],
      open_yn_opts:   [{ codeValue: 'Y', codeLabel: '공개' }, { codeValue: 'N', codeLabel: '비공개' }],
      notice_yn_opts: [{ codeValue: 'Y', codeLabel: '공지' }, { codeValue: 'N', codeLabel: '일반' }],
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
        pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CmBlogMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'blogs-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'blogs-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'blogs-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세 보기 토글
      } else if (cmd === 'blogs-rowView') {
        return openDetail(param);
      // 그리드 행 공개/비공개 토글
      } else if (cmd === 'blogs-rowToggleUse') {
        return toggleUse(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', use: '', notice: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    /* _initBlogForm — 빈(신규) 블로그 폼 기본값 */
    const _initBlogForm = () => ({ blogId: null, siteId: 1, blogCateId: null, blogTitle: '', blogSummary: '', blogContent: '', blogAuthor: '', viewCount: 0, useYn: 'Y', isNotice: 'N' });
    const detailPanel = reactive({ show: true, active: false, isNew: false, dtlId: null, form: _initBlogForm() }); // 인라인 Dtl 패널 상태 (항상 표시, active=false 면 버튼 숨김)
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
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...getSortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'blogTitle,blogAuthor';
        }
        const res = await boApiSvc.cmBlog.getPage(params, '블로그관리', '목록조회');
        const data = res.data?.data;
        blogs.splice(0, blogs.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/삭제/닫기 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      Object.assign(detailPanel.form, _initBlogForm());
      detailPanel.dtlId = null; detailPanel.isNew = false; detailPanel.show = true; detailPanel.active = false;
    };

    /* openDetail — 인라인 패널 열기 (토글) */
    const openDetail = (row) => {
      if (detailPanel.dtlId === row.blogId && detailPanel.active) { resetDetailToNew(); return; }
      Object.assign(detailPanel.form, _initBlogForm(), { ...row });
      detailPanel.dtlId = row.blogId; detailPanel.isNew = false; detailPanel.show = true; detailPanel.active = true;
    };

    /* openNew — 신규 등록 */
    const openNew = () => {
      Object.assign(detailPanel.form, _initBlogForm());
      detailPanel.dtlId = '__new__'; detailPanel.isNew = true; detailPanel.show = true; detailPanel.active = true;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!detailPanel.form.blogTitle) { showToast('제목은 필수입니다.', 'error'); return; }
      const isNewPost = detailPanel.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      if (isNewPost) {
        detailPanel.form.blogId = 'BL' + String(Date.now()).slice(-6);
        detailPanel.form.regDate = new Date().toLocaleString('sv').replace('T', ' ');
        blogs.unshift({ ...detailPanel.form });
        detailPanel.dtlId = detailPanel.form.blogId; detailPanel.isNew = false;
      } else {
        const si = blogs.findIndex(p => p.blogId === detailPanel.form.blogId);
        if (si !== -1) { Object.assign(blogs[si], detailPanel.form); }
      }
      try {
        const res = await (isNewPost
          ? boApiSvc.cmBlog.create({ ...detailPanel.form }, '블로그관리', '등록')
          : boApiSvc.cmBlog.update(detailPanel.form.blogId, { ...detailPanel.form }, '블로그관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        /* 저장 완료: 상세영역은 유지하고 빈 신규 폼(비활성)으로 초기화 */
        resetDetailToNew();
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) { return; }
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.blogTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = blogs.findIndex(p => p.blogId === cfSelectedRow.value.blogId);
      if (si !== -1) { blogs.splice(si, 1); }
      closeDetail();
      try {
        const res = await boApiSvc.cmBlog.remove(cfSelectedRow.value.blogId, '블로그관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('처리되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
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

    /* fnGridRowClass — 그리드 행 클래스 (선택 행 강조) */
    const fnGridRowClass = (row) => (detailPanel.dtlId === row.blogId ? 'active' : '');

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'blogTitle',  label: '제목' },
          { value: 'blogAuthor', label: '작성자' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'use', type: 'select', label: '공개여부', options: () => codes.open_yn_opts, nullLabel: '전체' },
      { key: 'notice', type: 'select', label: '공지여부', options: () => codes.notice_yn_opts, nullLabel: '전체' },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'blogTitle',  label: '제목',     sortKey: 'nm', cellInnerClass: 'title-link',
        fmt: (v, row) => {
          const prefix = row.isNotice === 'Y' ? '[공지] ' : '';
          const summary = row.blogSummary ? ` / ${row.blogSummary}` : '';
          return `${prefix}${row.blogTitle || ''}${summary}`;
        } },
      { key: 'blogAuthor', label: '작성자',   style: 'width:80px;' },
      { key: 'viewCount',  label: '조회수',   style: 'width:80px;', align: 'right',  fmt: v => (v||0).toLocaleString() },
      { key: 'isNotice',   label: '공지',     style: 'width:70px;', align: 'center', badge: row => row.isNotice==='Y' ? 'badge-orange' : 'badge-gray' },
      { key: 'useYn',      label: '공개',     style: 'width:70px;', align: 'center', badge: row => fnYnBadge(row.useYn), fmt: v => v==='Y' ? '공개' : '비공개' },
      { key: 'regDate',    label: '등록일',   style: 'width:140px;', sortKey: 'reg',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
    ];

    // 블로그 폼
    const blogFormColumns = [
      { key: 'blogTitle',   label: '제목', type: 'text', required: true, colSpan: 2 },
      { key: 'blogAuthor',  label: '작성자', type: 'text' },
      { key: 'isNotice',    label: '공지여부', type: 'select',
        options: () => (codes.notice_yn_opts || []).map(o => ({ value: o.codeValue, label: o.codeValue + ' (' + o.codeLabel + ')' })) },
      { key: 'useYn',       label: '공개여부', type: 'select',
        options: () => (codes.open_yn_opts || []).map(o => ({ value: o.codeValue, label: o.codeValue + ' (' + o.codeLabel + ')' })) },
      { type: 'rowBreak' },
      { key: 'blogSummary', label: '요약', type: 'text', placeholder: '목록에 표시될 요약 내용', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'blogContent', label: '본문', type: 'slot', name: 'blogContent', colSpan: 2 },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      blogs, uiState, codes, searchParam, pager, detailPanel,                          // 상태 / 데이터
      baseSearchColumns, baseGridColumns, blogFormColumns,                             // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedRow,                                                                   // computed
      sortIcon, fnYnBadge, fnGridRowClass,                                             // 헬퍼
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    게시판(블로그)관리
  </div>
  <!-- ===== ■. 검색 ======================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="baseGridColumns" :rows="blogs" row-key="blogId"
    :sort-state="uiState" list-title="게시글 목록"
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다." row-clickable
    @sort="key => handleSelectAction('blogs-sort', key)"
    @set-page="n => handleSelectAction('blogs-pager-setPage', n)"
    @size-change="handleSelectAction('blogs-pager-sizeChange')"
    @row-click="row => handleSelectAction('blogs-rowView', row)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('blogs-add')">
        + 신규
      </button>
    </template>
    <template #row-actions="{ row }">
      <button :class="['btn','btn-xs',row.useYn==='Y'?'btn-secondary':'btn-green']" @click.stop="handleSelectAction('blogs-rowToggleUse', row)">
        {{ row.useYn==='Y'?'비공개':'공개' }}
      </button>
    </template>
  </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('blogs-pager-setPage', n)" :on-size-change="() => handleSelectAction('blogs-pager-sizeChange')" />
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (항상 표시, active=false 면 안내문구) ===================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        {{ !detailPanel.active ? '상세 / 등록' : (detailPanel.isNew ? '신규 등록' : '상세 / 수정') }}
        <span v-if="detailPanel.active && !detailPanel.isNew && detailPanel.form.blogId" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">
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
      <bo-form-area :columns="blogFormColumns" :form="detailPanel.form" :errors="{}"
        :cols="3" compact :show-actions="false">
        <template #blogContent>
          <base-html-editor v-model="detailPanel.form.blogContent" height="320px" />
        </template>
      </bo-form-area>
      <!-- ===== ■.■.■. 하단 액션 (저장/삭제/닫기) — .form-actions 가 중앙 정렬 ===== -->
      <div class="form-actions">
        <button class="btn btn-blue" @click="handleBtnAction('detailPanel-save')">
          저장
        </button>
        <button v-if="!detailPanel.isNew" class="btn btn-danger" @click="handleBtnAction('detailPanel-delete')">
          삭제
        </button>
        <button class="btn btn-secondary" @click="handleBtnAction('detailPanel-close')">
          닫기
        </button>
      </div>
    </div>
    <!-- ===== □.■. 블로그 detail 폼 ========================================== -->
  </div>
  <!-- ===== □. 상세 패널 =================================================== -->
</div>
`,
};

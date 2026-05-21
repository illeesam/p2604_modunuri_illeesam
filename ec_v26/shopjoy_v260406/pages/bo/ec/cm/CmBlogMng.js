/* ShopJoy Admin - 게시판(블로그)관리 */
window.CmBlogMng = {
  name: 'CmBlogMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const blogs = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null, sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      blog_display_statuses: [],
      open_yn_opts: [{ codeValue: 'Y', codeLabel: '공개' }, { codeValue: 'N', codeLabel: '비공개' }],
      notice_yn_opts: [{ codeValue: 'Y', codeLabel: '공지' }, { codeValue: 'N', codeLabel: '일반' }],
    });

const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId = ref(null);

    /* 게시물 _initSearchParam */
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', use: '', notice: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 게시물 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.blog_display_statuses = codeStore.sgGetGrpCodes('BLOG_DISPLAY_STATUS');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const SORT_MAP = { nm: { asc: 'blogTitle asc', desc: 'blogTitle desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 게시물 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 게시물 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 게시물 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 게시물 목록조회 */
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

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 게시물 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const detailModal = reactive({ show: false, isNew: false, dtlId: null, form: {} });

    const cfSelectedRow = computed(() => blogs.find(p => p.blogId === detailModal.dtlId) || null);

    /* 게시물 openDetail */
    const openDetail = (row) => {
      if (detailModal.dtlId === row.blogId) { detailModal.show = false; detailModal.dtlId = null; return; }
      Object.assign(detailModal.form, { ...row });
      detailModal.dtlId = row.blogId; detailModal.isNew = false; detailModal.show = true;
    };

    /* 게시물 openNew */
    const openNew = () => {
      Object.assign(detailModal.form, { blogId: null, siteId: 1, blogCateId: null, blogTitle: '', blogSummary: '', blogContent: '', blogAuthor: '', viewCount: 0, useYn: 'Y', isNotice: 'N' });
      detailModal.dtlId = '__new__'; detailModal.isNew = true; detailModal.show = true;
    };

    /* 게시물 closeDetail */
    const closeDetail = () => { detailModal.show = false; detailModal.dtlId = null; };

    /* 게시물 저장 */
    const handleSave = async () => {
      if (!detailModal.form.blogTitle) { showToast('제목은 필수입니다.', 'error'); return; }
      const isNewPost = detailModal.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      if (isNewPost) {
        detailModal.form.blogId = 'BL' + String(Date.now()).slice(-6);
        detailModal.form.regDate = new Date().toLocaleString('sv').replace('T', ' ');
        blogs.unshift({ ...detailModal.form });
        detailModal.dtlId = detailModal.form.blogId; detailModal.isNew = false;
      } else {
        const si = blogs.findIndex(p => p.blogId === detailModal.form.blogId);
        if (si !== -1) Object.assign(blogs[si], detailModal.form);
      }
      try {
        const res = await (isNewPost
          ? boApiSvc.cmBlog.create({ ...detailModal.form }, '블로그관리', '등록')
          : boApiSvc.cmBlog.update(detailModal.form.blogId, { ...detailModal.form }, '블로그관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 게시물 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) return;
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.blogTitle}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = blogs.findIndex(p => p.blogId === cfSelectedRow.value.blogId);
      if (si !== -1) blogs.splice(si, 1);
      closeDetail();
      try {
        const res = await boApiSvc.cmBlog.remove(cfSelectedRow.value.blogId, '블로그관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 게시물 toggleUse */
    const toggleUse = async (row) => {
      const newYn = row.useYn === 'Y' ? 'N' : 'Y';
      const ok = await showConfirm('공개설정', `[${row.blogTitle}]을 ${newYn === 'Y' ? '공개' : '비공개'} 처리하시겠습니까?`);
      if (!ok) return;
      row.useYn = newYn;
      if (detailModal.form.blogId === row.blogId) detailModal.form.useYn = newYn;
      try {
        const res = await boApiSvc.cmBlog.setUse(row.blogId, { useYn: newYn }, '블로그관리', '상태변경');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('처리되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 게시물 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 게시물 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* 게시물 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 게시물 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 게시물 fnYnBadge */
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm'/'reg' 와 sortKey 일치) */
        const baseSearchColumns = [
      { type: 'label', label: '제목/작성자' },
      { key: 'searchType', type: 'multiCheck',
        options: [
            { value: 'blogTitle',  label: '제목' },
            { value: 'blogAuthor', label: '작성자' },
          ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
      { type: 'label', label: '공개여부' },
      { key: 'use', type: 'select', options: () => codes.open_yn_opts, nullLabel: '전체' },
      { type: 'label', label: '공지여부' },
      { key: 'notice', type: 'select', options: () => codes.notice_yn_opts, nullLabel: '전체' },
      { key: 'use', type: 'select', options: () => codes.open_yn_opts, nullLabel: '전체' },
      { key: 'notice', type: 'select', options: () => codes.notice_yn_opts, nullLabel: '전체' },
    ];

    const listGridColumns = [
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
      { key: 'regDate',    label: '등록일',   style: 'width:140px;', sortKey: 'reg' },
    ];
    const fnGridRowClass = (row) => (detailModal.dtlId === row.blogId ? 'active' : '');

    // -- return ---------------------------------------------------------------

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 블로그 detail 모달 폼 ==========
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

    return {
      selectedId: computed(() => detailModal.dtlId), blogs, uiState, codes,
      searchParam, pager, setPage,
      onSearch, onReset, cfSelectedRow, detailModal, openDetail, openNew, closeDetail,
      handleSave, handleDelete, toggleUse, fnYnBadge, onSizeChange, onSort, sortIcon,
      baseSearchColumns, listGridColumns, fnGridRowClass, blogFormColumns,
    };
  },
  template: `
<div>
  <div class="page-title">게시판(블로그)관리</div>
    <div class="card">
      <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
    </div>
    <bo-grid :columns="listGridColumns" :rows="blogs" :pager="pager" row-key="blogId"
      :sort-state="uiState" list-title="게시글 목록"
      :count-text="'총 ' + pager.pageTotalCount + '건'"
      :row-class="fnGridRowClass" empty-text="데이터가 없습니다." row-clickable
      @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="openDetail" row-actions>
      <template #toolbar-actions>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </template>
      <template #row-actions="{ row }">
        <button :class="['btn','btn-xs',row.useYn==='Y'?'btn-secondary':'btn-green']" @click.stop="toggleUse(row)">{{ row.useYn==='Y'?'비공개':'공개' }}</button>
      </template>
    </bo-grid>
    <div class="card" v-if="detailModal.show">
      <div class="toolbar">
        <span class="list-title">{{ detailModal.isNew ? '신규 등록' : '상세 / 수정' }}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
          <button v-if="!detailModal.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
          <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
        </div>
      </div>
      <!-- 블로그 detail 폼 (BoFormArea 자동 렌더) -->
      <div style="padding:12px">
        <bo-form-area :columns="blogFormColumns" :form="detailModal.form" :errors="{}"
          :cols="2" :show-actions="false">
          <template #blogContent>
            <base-html-editor v-model="detailModal.form.blogContent" height="320px" />
          </template>
        </bo-form-area>
      </div>
    </div>
</div>`
};

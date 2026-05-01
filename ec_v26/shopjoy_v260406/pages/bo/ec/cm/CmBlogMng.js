/* ShopJoy Admin - 게시판(블로그)관리 */
window.CmBlogMng = {
  name: 'CmBlogMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const blogs = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedId: null});
    const codes = reactive({
      blog_display_statuses: [],
      open_yn_opts: [{ codeValue: 'Y', codeLabel: '공개' }, { codeValue: 'N', codeLabel: '비공개' }],
      notice_yn_opts: [{ codeValue: 'Y', codeLabel: '공지' }, { codeValue: 'N', codeLabel: '일반' }],
    });

const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const selectedId = ref(null);

    const searchParam = reactive({ kw: '', use: '', notice: '' });
    const searchParamOrg = reactive({ kw: '', use: '', notice: '' });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.blog_display_statuses = await codeStore.snGetGrpCodes('BLOG_DISPLAY_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/ec/cm/blog/page', {
          params: {
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          },
          ...coUtil.apiHdr('블로그관리', '목록조회')
        });
        const data = res.data?.data;
        blogs.splice(0, blogs.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
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
      Object.assign(searchParamOrg, searchParam);
    });

    const cfPageNums = computed(() => {
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });

    const detailModal = reactive({ show: false, isNew: false, editId: null, form: {} });

    const cfSelectedRow = computed(() => blogs.find(p => p.blogId === detailModal.editId) || null);

    const openDetail = (row) => {
      if (detailModal.editId === row.blogId) { detailModal.show = false; detailModal.editId = null; return; }
      Object.assign(detailModal.form, { ...row });
      detailModal.editId = row.blogId; detailModal.isNew = false; detailModal.show = true;
    };
    const openNew = () => {
      Object.assign(detailModal.form, { blogId: null, siteId: 1, blogCateId: null, blogTitle: '', blogSummary: '', blogContent: '', blogAuthor: '', viewCount: 0, useYn: 'Y', isNotice: 'N' });
      detailModal.editId = '__new__'; detailModal.isNew = true; detailModal.show = true;
    };
    const closeDetail = () => { detailModal.show = false; detailModal.editId = null; };

    const handleSave = async () => {
      if (!detailModal.form.blogTitle) { props.showToast('제목은 필수입니다.', 'error'); return; }
      const isNewPost = detailModal.isNew;
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      if (isNewPost) {
        detailModal.form.blogId = 'BL' + String(Date.now()).slice(-6);
        detailModal.form.regDate = new Date().toLocaleString('sv').replace('T', ' ');
        blogs.unshift({ ...detailModal.form });
        detailModal.editId = detailModal.form.blogId; detailModal.isNew = false;
      } else {
        const si = blogs.findIndex(p => p.blogId === detailModal.form.blogId);
        if (si !== -1) Object.assign(blogs[si], detailModal.form);
      }
      try {
        const res = await (isNewPost
          ? boApi.post(`/bo/ec/cm/blog/${detailModal.form.blogId}`, { ...detailModal.form }, coUtil.apiHdr('블로그관리', '등록'))
          : boApi.put(`/bo/ec/cm/blog/${detailModal.form.blogId}`, { ...detailModal.form }, coUtil.apiHdr('블로그관리', '저장')));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const handleDelete = async () => {
      if (!cfSelectedRow.value) return;
      const ok = await props.showConfirm('삭제', `[${cfSelectedRow.value.blogTitle}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = blogs.findIndex(p => p.blogId === cfSelectedRow.value.blogId);
      if (si !== -1) blogs.splice(si, 1);
      closeDetail();
      try {
        const res = await boApi.delete(`/bo/ec/cm/blog/${cfSelectedRow.value.blogId}`, coUtil.apiHdr('블로그관리', '삭제'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const toggleUse = async (row) => {
      const newYn = row.useYn === 'Y' ? 'N' : 'Y';
      const ok = await props.showConfirm('공개설정', `[${row.blogTitle}]을 ${newYn === 'Y' ? '공개' : '비공개'} 처리하시겠습니까?`);
      if (!ok) return;
      row.useYn = newYn;
      if (detailModal.form.blogId === row.blogId) detailModal.form.useYn = newYn;
      try {
        const res = await boApi.put(`/bo/ec/cm/blog/${row.blogId}/use`, { useYn: newYn }, coUtil.apiHdr('블로그관리', '상태변경'));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('처리되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const fnYnBadge = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ── return ───────────────────────────────────────────────────────────────

    return {
      selectedId: computed(() => detailModal.editId), blogs, uiState, codes,
      searchParam, searchParamOrg, pager, cfPageNums, setPage,
      onSearch, onReset, cfSelectedRow, detailModal, openDetail, openNew, closeDetail,
      handleSave, handleDelete, toggleUse, fnYnBadge, onSizeChange,
    };
  },
  template: `
<div>
  <div class="page-title">게시판(블로그)관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">제목/작성자</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="제목 또는 작성자 검색">
        <label class="search-label">공개여부</label>
        <select class="form-control" v-model="searchParam.use">
          <option value="">전체</option>
          <option v-for="o in codes.open_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
        <label class="search-label">공지여부</label>
        <select class="form-control" v-model="searchParam.notice">
          <option value="">전체</option>
          <option v-for="o in codes.notice_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">게시글 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th><th>제목</th><th style="width:80px">작성자</th>
          <th style="width:80px;text-align:right">조회수</th>
          <th style="width:70px;text-align:center">공지</th>
          <th style="width:70px;text-align:center">공개</th>
          <th style="width:140px">등록일</th>
          <th style="width:80px;text-align:center">공개전환</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row, idx) in blogs" :key="row?.blogId" :class="{active:selectedId===row.blogId}" @click="openDetail(row)" style="cursor:pointer">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td>
              <span v-if="row.isNotice==='Y'" class="badge badge-orange" style="margin-right:4px;font-size:10px">공지</span>
              <span class="title-link">{{ row.blogTitle }}</span>
              <span style="font-size:11px;color:#aaa;margin-left:6px">{{ row.blogSummary }}</span>
            </td>
            <td style="font-size:12px">{{ row.blogAuthor }}</td>
            <td style="text-align:right;font-size:12px">{{ (row.viewCount||0).toLocaleString() }}</td>
            <td style="text-align:center"><span :class="['badge',row.isNotice==='Y'?'badge-orange':'badge-gray']">{{ row.isNotice }}</span></td>
            <td style="text-align:center"><span :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn==='Y'?'공개':'비공개' }}</span></td>
            <td style="font-size:12px">{{ row.regDate }}</td>
            <td style="text-align:center" @click.stop>
              <button :class="['btn','btn-xs',row.useYn==='Y'?'btn-secondary':'btn-green']" @click="toggleUse(row)">{{ row.useYn==='Y'?'비공개':'공개' }}</button>
            </td>
          </tr>
          <tr v-if="!blogs.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
    <div class="card" v-if="detailModal.show">
      <div class="toolbar">
        <span class="list-title">{{ detailModal.isNew ? '신규 등록' : '상세 / 수정' }}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="handleSave">저장</button>
          <button v-if="!detailModal.isNew" class="btn btn-danger btn-sm" @click="handleDelete">삭제</button>
          <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">제목 <span style="color:red">*</span></label><input class="form-control" v-model="detailModal.form.blogTitle"></div>
        <div class="form-group"><label class="form-label">작성자</label><input class="form-control" v-model="detailModal.form.blogAuthor"></div>
        <div class="form-group"><label class="form-label">공지여부</label>
          <select class="form-control" v-model="detailModal.form.isNotice">
            <option v-for="o in codes.notice_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeValue }} ({{ o.codeLabel }})</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">공개여부</label>
          <select class="form-control" v-model="detailModal.form.useYn">
            <option v-for="o in codes.open_yn_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeValue }} ({{ o.codeLabel }})</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">요약</label><input class="form-control" v-model="detailModal.form.blogSummary" placeholder="목록에 표시될 요약 내용"></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">본문</label><textarea class="form-control" rows="8" v-model="detailModal.form.blogContent"></textarea></div>
      </div>
    </div>
</div>`
};

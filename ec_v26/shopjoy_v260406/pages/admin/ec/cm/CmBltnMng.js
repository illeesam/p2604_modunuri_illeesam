/* ShopJoy Admin - 게시판(블로그)관리 */
window.CmBltnMng = {
  name: 'CmBltnMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw     = ref('');
    const searchUse    = ref('');
    const searchNotice = ref('');
    const applied      = reactive({ kw: '', use: '', notice: '' });
    const pager        = reactive({ page: 1, size: 20 });
    const selectedId   = ref(null);

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.bltnPosts || []).filter(p => {
        if (kw && !p.blogTitle.toLowerCase().includes(kw) && !(p.blogAuthor||'').toLowerCase().includes(kw)) return false;
        if (applied.use && p.useYn !== applied.use) return false;
        if (applied.notice && p.isNotice !== applied.notice) return false;
        return true;
      }).sort((a, b) => b.regDate > a.regDate ? 1 : -1);
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const selectedRow = computed(() => (props.adminData.bltnPosts||[]).find(p => p.blogId === selectedId.value) || null);
    const form = reactive({});
    const isNew = ref(false);

    const openDetail = (row) => {
      if (selectedId.value === row.blogId) { selectedId.value = null; return; }
      Object.assign(form, { ...row });
      selectedId.value = row.blogId; isNew.value = false;
    };
    const openNew = () => {
      Object.assign(form, { blogId: null, siteId: 1, blogCateId: null, blogTitle: '', blogSummary: '', blogContent: '', blogAuthor: '', viewCount: 0, useYn: 'Y', isNotice: 'N' });
      selectedId.value = '__new__'; isNew.value = true;
    };
    const closeDetail = () => { selectedId.value = null; };
    const doSave = async () => {
      if (!form.blogTitle) { props.showToast('제목은 필수입니다.', 'error'); return; }
      const isNewPost = isNew.value;
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const src = props.adminData.bltnPosts;
      if (isNewPost) { form.blogId = 'BL' + String(Date.now()).slice(-6); form.regDate = new Date().toLocaleString('sv').replace('T',' '); src.unshift({ ...form }); selectedId.value = form.blogId; isNew.value = false; }
      else { const si = src.findIndex(p => p.blogId === form.blogId); if (si !== -1) Object.assign(src[si], form); }
      try {
        const res = await (isNewPost ? window.adminApi.post(`cm/bltn/${form.blogId}`, { ...form }) : window.adminApi.put(`cm/bltn/${form.blogId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const doDelete = async () => {
      if (!selectedRow.value) return;
      const ok = await props.showConfirm('삭제', `[${selectedRow.value.blogTitle}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = props.adminData.bltnPosts.findIndex(p => p.blogId === selectedRow.value.blogId);
      if (si !== -1) props.adminData.bltnPosts.splice(si, 1);
      closeDetail();
      try {
        const res = await window.adminApi.delete(`cm/bltn/${selectedRow.value.blogId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const toggleUse = async (row) => {
      const newYn = row.useYn === 'Y' ? 'N' : 'Y';
      const ok = await props.showConfirm('공개설정', `[${row.blogTitle}]을 ${newYn==='Y'?'공개':'비공개'} 처리하시겠습니까?`);
      if (!ok) return;
      row.useYn = newYn;
      if (form.blogId === row.blogId) form.useYn = newYn;
      try {
        const res = await window.adminApi.put(`cm/bltn/${row.blogId}/use`, { useYn: newYn });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('처리되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, use: searchUse.value, notice: searchNotice.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchUse.value = ''; searchNotice.value = ''; Object.assign(applied, { kw: '', use: '', notice: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchKw, searchUse, searchNotice, pager, pageNums, totalPages, setPage, total, pageList, onSearch, onReset,
             selectedId, selectedRow, form, isNew, openDetail, openNew, closeDetail, doSave, doDelete, toggleUse, ynBadge , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">게시판(블로그)관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">제목/작성자</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="제목 또는 작성자 검색">
        <label class="search-label">공개여부</label>
        <select class="form-control" v-model="searchUse"><option value="">전체</option><option value="Y">공개</option><option value="N">비공개</option></select>
        <label class="search-label">공지여부</label>
        <select class="form-control" v-model="searchNotice"><option value="">전체</option><option value="Y">공지</option><option value="N">일반</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">게시글 목록</span>
        <span class="list-count">총 {{ total }}건</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>제목</th><th style="width:80px">작성자</th>
          <th style="width:80px;text-align:right">조회수</th>
          <th style="width:70px;text-align:center">공지</th>
          <th style="width:70px;text-align:center">공개</th>
          <th style="width:140px">등록일</th>
          <th style="width:80px;text-align:center">공개전환</th>
        </tr></thead>
        <tbody>
          <tr v-for="row in pageList" :key="row.blogId" :class="{active:selectedId===row.blogId}" @click="openDetail(row)" style="cursor:pointer">
            <td>
              <span v-if="row.isNotice==='Y'" class="badge badge-orange" style="margin-right:4px;font-size:10px">공지</span>
              <span class="title-link">{{ row.blogTitle }}</span>
              <span style="font-size:11px;color:#aaa;margin-left:6px">{{ row.blogSummary }}</span>
            </td>
            <td style="font-size:12px">{{ row.blogAuthor }}</td>
            <td style="text-align:right;font-size:12px">{{ (row.viewCount||0).toLocaleString() }}</td>
            <td style="text-align:center"><span :class="['badge',row.isNotice==='Y'?'badge-orange':'badge-gray']">{{ row.isNotice }}</span></td>
            <td style="text-align:center"><span :class="['badge',ynBadge(row.useYn)]">{{ row.useYn==='Y'?'공개':'비공개' }}</span></td>
            <td style="font-size:12px">{{ row.regDate }}</td>
            <td style="text-align:center" @click.stop>
              <button :class="['btn','btn-xs',row.useYn==='Y'?'btn-secondary':'btn-green']" @click="toggleUse(row)">{{ row.useYn==='Y'?'비공개':'공개' }}</button>
            </td>
          </tr>
          <tr v-if="!pageList.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
    <div class="card" v-if="selectedId">
      <div class="toolbar">
        <span class="list-title">{{ isNew ? '신규 등록' : '상세 / 수정' }}</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="doSave">저장</button>
          <button v-if="!isNew" class="btn btn-danger btn-sm" @click="doDelete">삭제</button>
          <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">제목 <span style="color:red">*</span></label><input class="form-control" v-model="form.blogTitle"></div>
        <div class="form-group"><label class="form-label">작성자</label><input class="form-control" v-model="form.blogAuthor"></div>
        <div class="form-group"><label class="form-label">공지여부</label>
          <select class="form-control" v-model="form.isNotice"><option value="Y">Y (공지)</option><option value="N">N (일반)</option></select>
        </div>
        <div class="form-group"><label class="form-label">공개여부</label>
          <select class="form-control" v-model="form.useYn"><option value="Y">Y (공개)</option><option value="N">N (비공개)</option></select>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">요약</label><input class="form-control" v-model="form.blogSummary" placeholder="목록에 표시될 요약 내용"></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">본문</label><textarea class="form-control" rows="8" v-model="form.blogContent"></textarea></div>
      </div>
    </div>
</div>`
};

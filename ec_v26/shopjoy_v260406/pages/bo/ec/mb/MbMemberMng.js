/* ShopJoy Admin - 회원관리 */
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // 1️⃣ ref/reactive 선언
    const members = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ member_statuses: [], member_grades: [] });
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const _initSearchParam = () => ({ kw: '', grade: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    const detailModal = reactive({
      show: false,
      isNew: false,
      editId: null,
      form: { memberId: null, email: '', memberNm: '', phone: '', gradeCd: '일반', statusCd: '활성', joinDate: '', memo: '' }
    });

    // 2️⃣ computed 선언
    const cfSelectedRow = computed(() => members.find(m => m.memberId === detailModal.editId) || null);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // 3️⃣ 함수 정의
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      uiState.isPageCodeLoad = true;
    };

    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.mbMember.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...getSortParam(),
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '회원관리', '목록조회');
        const data = res.data?.data;
        members.splice(0, members.length, ...(data?.pageList || []));
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

    const fnFmtDate = v => v ? String(v).slice(0, 10) : '';

    const fnApplyForm = (d) => {
      Object.assign(detailModal.form, {
        memberId: d.memberId, email: d.email || '', memberNm: d.memberNm || '',
        phone: d.phone || '', gradeCd: d.gradeCd || '', statusCd: d.statusCd || '',
        joinDate: fnFmtDate(d.joinDate), memo: d.memo || ''
      });
    };

    const openDetail = async (row) => {
      detailModal.editId = row.memberId;
      detailModal.isNew = false;
      detailModal.show = true;
      fnApplyForm(row); // 목록 row 데이터로 먼저 표시
      try {
        const res = await boApiSvc.mbMember.getById(row.memberId, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) fnApplyForm(d);
      } catch (err) {
        console.error('[openDetail]', err);
      }
    };

    const openNew = () => {
      Object.assign(detailModal.form, { memberId: null, email: '', memberNm: '', phone: '', gradeCd: '일반', statusCd: '활성', joinDate: new Date().toISOString().split('T')[0], memo: '' });
      detailModal.editId = '__new__';
      detailModal.isNew = true;
      detailModal.show = true;
    };

    const closeDetail = () => {
      detailModal.show = false;
      detailModal.editId = null;
    };

    const handleSave = async () => {
      if (!detailModal.form.email) { props.showToast('이메일은 필수입니다.', 'error'); return; }
      if (!detailModal.form.memberNm) { props.showToast('이름은 필수입니다.', 'error'); return; }
      const isNewMember = detailModal.isNew;
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      if (isNewMember) {
        detailModal.form.memberId = 'MB' + String(Date.now()).slice(-6);
        detailModal.form.orderCount = 0;
        detailModal.form.totalPurchase = 0;
        members.unshift({ ...detailModal.form });
        detailModal.editId = detailModal.form.memberId;
        detailModal.isNew = false;
      } else {
        const si = members.findIndex(m => m.memberId === detailModal.form.memberId);
        if (si !== -1) Object.assign(members[si], detailModal.form);
      }
      try {
        const res = await (isNewMember
          ? boApiSvc.mbMember.create({ ...detailModal.form }, '회원관리', '등록')
          : boApiSvc.mbMember.update(detailModal.form.memberId, { ...detailModal.form }, '회원관리', '저장'));
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
      const ok = await props.showConfirm('삭제', `[${cfSelectedRow.value.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      const memberId = cfSelectedRow.value.memberId;
      const si = members.findIndex(m => m.memberId === memberId);
      if (si !== -1) members.splice(si, 1);
      closeDetail();
      try {
        const res = await boApiSvc.mbMember.remove(memberId, '회원관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const fnGradeBadge = g => ({ 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' }[g] || 'badge-gray');
    const fnStatusBadge = s => ({ '활성': 'badge-green', '정지': 'badge-red' }[s] || 'badge-gray');
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // 4️⃣ watch 선언
    // 5️⃣ onMounted
    onMounted(() => {
      handleSearchList('DEFAULT');
    });

    // -- return ---------------------------------------------------------------
    return {
      selectedId: computed(() => detailModal.editId), members, uiState, codes,
      searchParam, pager, setPage,
      onSearch, onReset, cfSelectedRow, detailModal, openDetail, openNew, closeDetail,
      handleSave, handleDelete, fnGradeBadge, fnStatusBadge, fnFmtDate, onSizeChange,
      onSort, sortIcon, uiState
    };
  },
  template: /* html */`
<div>
  <div class="page-title">회원관리</div>
  <div class="card">
    <div class="search-bar">
      <label class="search-label">이름/이메일/ID</label>
      <input v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="이름 또는 이메일 검색" />
      <label class="search-label">등급</label>
      <select v-model="searchParam.grade">
        <option value="">전체</option>
        <option v-for="c in codes.member_grades" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <label class="search-label">상태</label>
      <select v-model="searchParam.status">
        <option value="">전체</option>
        <option v-for="c in codes.member_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">회원목록</span>
      <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" @click="openNew">+ 신규</button>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th>
        <th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">이름 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th>
        <th>이메일</th><th>연락처</th><th>등급</th><th>상태</th>
        <th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">가입일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
        <th style="width:80px;text-align:right">주문수</th><th style="width:100px;text-align:right">총구매액</th><th style="text-align:center;width:80px">관리</th>
      </tr></thead>
      <tbody>
        <tr v-for="(row, idx) in members" :key="row?.memberId" :class="{active:selectedId===row.memberId}" style="cursor:pointer">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="openDetail(row)">{{ row.memberNm }}</span></td>
          <td style="font-size:12px">{{ row.email }}</td>
          <td style="font-size:12px">{{ row.phone }}</td>
          <td><span class="badge" :class="fnGradeBadge(row.gradeCd)">{{ row.gradeCd }}</span></td>
          <td><span class="badge" :class="fnStatusBadge(row.statusCd)">{{ row.statusCd }}</span></td>
          <td style="font-size:12px">{{ fnFmtDate(row.joinDate) }}</td>
          <td style="text-align:right;font-size:12px">{{ (row.orderCount||0) }}건</td>
          <td style="text-align:right;font-size:12px">{{ (row.totalPurchase||0).toLocaleString() }}원</td>
          <td style="text-align:center"><button class="btn btn-blue btn-sm" @click.stop="openDetail(row)">수정</button></td>
        </tr>
        <tr v-if="!members.length"><td colspan="10" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
  <mb-member-dtl :detail-modal="detailModal" :handle-save="handleSave" :handle-delete="handleDelete" :close-detail="closeDetail" />
</div>
`
};

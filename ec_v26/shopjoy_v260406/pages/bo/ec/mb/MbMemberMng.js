/* ShopJoy Admin - 회원관리 */
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // 1️⃣ ref/reactive 선언
    const members = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ member_statuses: [], member_grades: [] });
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', grade: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    const detailModal = reactive({
      show: false,
      isNew: false,
      dtlId: null,
      reloadTrigger: 0, // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
      form: { memberId: null, loginId: '', memberNm: '', memberPhone: '', gradeCd: '일반', memberStatusCd: '활성', joinDate: '', memberMemo: '' }
    });

    // 2️⃣ computed 선언
    const cfSelectedRow = computed(() => members.find(m => m.memberId === detailModal.dtlId) || null);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    // 3️⃣ 함수 정의
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      uiState.isPageCodeLoad = true;
    };

    const SORT_MAP = { nm: { asc: 'memberNm asc', desc: 'memberNm desc' }, reg: { asc: 'joinDate asc', desc: 'joinDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 회원 onSort */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
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
          params.searchType = 'memberNm,loginId';
        }
        const res = await boApiSvc.mbMember.getPage(params, '회원관리', '목록조회');
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

    /* fnFmtDate — 유틸 */
    const fnFmtDate = v => v ? String(v).slice(0, 10) : '';

    /* fnApplyForm — 유틸 */
    const fnApplyForm = (d) => {
      Object.assign(detailModal.form, {
        memberId: d.memberId, loginId: d.loginId || '', memberNm: d.memberNm || '',
        memberPhone: d.memberPhone || '', gradeCd: d.gradeCd || '', memberStatusCd: d.memberStatusCd || '',
        joinDate: fnFmtDate(d.joinDate), memberMemo: d.memberMemo || ''
      });
    };

    /* openDetail — 열기 */
    const openDetail = async (row) => {
      detailModal.dtlId = row.memberId;
      detailModal.isNew = false;
      detailModal.show = true;
      detailModal.reloadTrigger++;
      fnApplyForm(row); // 목록 row 데이터로 먼저 표시
      try {
        const res = await boApiSvc.mbMember.getById(row.memberId, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) fnApplyForm(d);
      } catch (err) {
        console.error('[openDetail]', err);
      }
    };

    /* openNew — 신규 열기 */
    const openNew = () => {
      Object.assign(detailModal.form, { memberId: null, loginId: '', memberNm: '', memberPhone: '', gradeCd: '일반', memberStatusCd: '활성', joinDate: new Date().toISOString().split('T')[0], memberMemo: '' });
      detailModal.dtlId = '__new__';
      detailModal.isNew = true;
      detailModal.show = true;
      detailModal.reloadTrigger++;
    };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => {
      detailModal.show = false;
      detailModal.dtlId = null;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!detailModal.form.loginId) { showToast('이메일은 필수입니다.', 'error'); return; }
      if (!detailModal.form.memberNm) { showToast('이름은 필수입니다.', 'error'); return; }
      const isNewMember = detailModal.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      if (isNewMember) {
        detailModal.form.memberId = 'MB' + String(Date.now()).slice(-6);
        detailModal.form.orderCount = 0;
        detailModal.form.totalPurchaseAmt = 0;
        members.unshift({ ...detailModal.form });
        detailModal.dtlId = detailModal.form.memberId;
        detailModal.isNew = false;
      } else {
        const si = members.findIndex(m => m.memberId === detailModal.form.memberId);
        if (si !== -1) Object.assign(members[si], detailModal.form);
      }
      try {
        /* DB join_date 컬럼은 TIMESTAMP — LocalDateTime 매핑이라 'YYYY-MM-DDTHH:mm:ss' 형식 필요 */
        const fnToDateTime = (s) => {
          if (!s) return s;
          return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
        };
        const payload = {
          ...detailModal.form,
          joinDate: fnToDateTime(detailModal.form.joinDate),
          /* loginId 는 form.loginId(이메일=로그인ID) 그대로 전송. login_pwd_hash 는 신규 시 임시 해시 자동 생성 */
        };
        if (isNewMember && !payload.loginPwdHash) {
          /* 신규 등록 시 임시 비밀번호 = 'init1234' 의 sha256 (회원에게 별도 안내 후 변경 유도) */
          payload.loginPwdHash = await coUtil.cofSha256('init1234');
        }
        const res = await (isNewMember
          ? boApiSvc.mbMember.create(payload, '회원관리', '등록')
          : boApiSvc.mbMember.update(detailModal.form.memberId, payload, '회원관리', '저장'));
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('저장되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* handleDelete — 삭제 */
    const handleDelete = async () => {
      if (!cfSelectedRow.value) return;
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      const memberId = cfSelectedRow.value.memberId;
      const si = members.findIndex(m => m.memberId === memberId);
      if (si !== -1) members.splice(si, 1);
      closeDetail();
      try {
        const res = await boApiSvc.mbMember.remove(memberId, '회원관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 회원 fnGradeBadge */
    const _MEMBER_GRADE_FB = { 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' };
    /* fnGradeBadge — 유틸 */
    const fnGradeBadge = g => coUtil.cofCodeBadge('MEMBER_GRADE', g, _MEMBER_GRADE_FB[g] || 'badge-gray');

    /* 회원 fnStatusBadge */
    const _MEMBER_STATUS_FB = { '활성': 'badge-green', '정지': 'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('MEMBER_STATUS', s, _MEMBER_STATUS_FB[s] || 'badge-gray');

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); uiState.sortKey = ''; uiState.sortDir = 'asc'; onSearch(); };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* BoGrid 컬럼 정의 (정렬은 SORT_MAP 키 'nm'/'reg' 와 sortKey 일치) */
        // --- [컬럼 정의] ---
        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'memberNm', label: '이름' },
          { value: 'loginId',  label: '이메일' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'grade', type: 'select', label: '등급', options: () => codes.member_grades, nullLabel: '전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.member_statuses, nullLabel: '전체' },
    ];
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


    const listGridColumns = [
      { key: 'memberNm',         label: '이름',     sortKey: 'nm',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'loginId',          label: '이메일' },
      { key: 'memberPhone',      label: '연락처' },
      { key: 'gradeCd',          label: '등급',     align: 'center', badge: (row) => fnGradeBadge(row.gradeCd) },
      { key: 'memberStatusCd',   label: '상태',     align: 'center', badge: (row) => fnStatusBadge(row.memberStatusCd) },
      { key: 'joinDate',         label: '가입일',   sortKey: 'reg', fmt: (v) => fnFmtDate(v) },
      { key: 'orderCount',       label: '주문수',   style: 'width:80px;text-align:right', align: 'right', fmt: (v) => (v || 0) + '건' },
      { key: 'totalPurchaseAmt', label: '총구매액', style: 'width:100px;text-align:right', align: 'right', fmt: (v) => (v || 0).toLocaleString() + '원' },
    ];
    /* fnGridRowClass — 유틸 */
    const fnGridRowClass = (row) => (detailModal.dtlId === row.memberId ? 'active' : '');

    // 4️⃣ watch 선언
    // 5️⃣ onMounted
    onMounted(() => {
      handleSearchList('DEFAULT');
    });

    // ===== return (템플릿 노출) ===============================================


    return {
      selectedId: computed(() => detailModal.dtlId), members, uiState, codes,
      searchParam, pager, setPage,
      onSearch, onReset, cfSelectedRow, detailModal, openDetail, openNew, closeDetail,
      handleSave, handleDelete, fnGradeBadge, fnStatusBadge, fnFmtDate, onSizeChange,
      onSort, sortIcon, uiState,
      baseSearchColumns, listGridColumns, fnGridRowClass,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">회원관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <bo-grid :columns="listGridColumns" :rows="members" :pager="pager" row-key="memberId"
    :sort-state="uiState" list-title="회원목록" row-clickable
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="openDetail" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </template>
    <template #row-actions="{ row }">
      <button class="btn btn-blue btn-sm" @click="openDetail(row)">수정</button>
    </template>
  </bo-grid>
  <mb-member-dtl :detail-modal="detailModal" :handle-save="handleSave" :handle-delete="handleDelete" :close-detail="closeDetail"
    :reload-trigger="detailModal.reloadTrigger"
    :on-list-reload="handleSearchList"
    />
</div>
`
};

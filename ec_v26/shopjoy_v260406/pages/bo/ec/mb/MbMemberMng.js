/* ShopJoy Admin - 회원관리 */
window.MbMemberMng = {
  name: 'MbMemberMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const members = reactive([]);                  // 회원 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ member_statuses: [], member_grades: [] }); // 공통코드
    const SORT_MAP = { nm: { asc: 'memberNm asc', desc: 'memberNm desc' }, reg: { asc: 'joinDate asc', desc: 'joinDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemberMng.js : handleBtnAction -> ', cmd, param);
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
      // 회원 신규 등록 (인라인 패널)
      } else if (cmd === 'members-add') {
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
      console.log(' ■■ MbMemberMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'members-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'members-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'members-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 클릭 → 상세 편집 패널 열기
      } else if (cmd === 'members-rowEdit') {
        return openDetail(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ searchType: '', searchValue: '', grade: '', status: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 상세 인라인 패널 ===== */
    /* _emptyForm — 빈(신규) 폼 기본값 */
    const _emptyForm = () => ({ memberId: null, loginId: '', memberNm: '', memberPhone: '', gradeCd: '일반', memberStatusCd: '활성', joinDate: '', memberMemo: '' });
    const detailPanel = reactive({                 // 인라인 Dtl 패널 상태
      show: true,                                  // 상세영역 항상 표시 (진입 시 빈 신규 폼)
      isNew: false, dtlId: null, reloadTrigger: 0,
      active: false,                               // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
      form: _emptyForm()
    });
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

    /* fnApplyForm — 폼 데이터 적용 */
    const fnApplyForm = (d) => {
      Object.assign(detailPanel.form, {
        memberId: d.memberId, loginId: d.loginId || '', memberNm: d.memberNm || '',
        memberPhone: d.memberPhone || '', gradeCd: d.gradeCd || '', memberStatusCd: d.memberStatusCd || '',
        joinDate: fnFmtDate(d.joinDate), memberMemo: d.memberMemo || ''
      });
    };

    /* openDetail — 인라인 패널 편집 모드로 열기 (행 선택 → 저장/취소 노출) */
    const openDetail = async (row) => {
      detailPanel.dtlId = row.memberId;
      detailPanel.isNew = false;
      detailPanel.show = true;
      detailPanel.active = true;     // 행 선택 → 저장/취소 노출
      detailPanel.reloadTrigger++;
      fnApplyForm(row); // 목록 row 데이터로 먼저 표시
      try {
        const res = await boApiSvc.mbMember.getById(row.memberId, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) { fnApplyForm(d); }
      } catch (err) {
        console.error('[openDetail]', err);
      }
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      Object.assign(detailPanel.form, _emptyForm(), { joinDate: new Date().toISOString().split('T')[0] });
      detailPanel.dtlId = '__new__';
      detailPanel.isNew = true;
      detailPanel.show = true;
      detailPanel.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailPanel.reloadTrigger++;
    };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      Object.assign(detailPanel.form, _emptyForm());
      detailPanel.show = true;
      detailPanel.dtlId = null;
      detailPanel.isNew = false;
      detailPanel.active = false;    // 버튼 숨김
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!detailPanel.form.loginId) { showToast('이메일은 필수입니다.', 'error'); return; }
      if (!detailPanel.form.memberNm) { showToast('이름은 필수입니다.', 'error'); return; }
      const isNewMember = detailPanel.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      if (isNewMember) {
        detailPanel.form.memberId = 'MB' + String(Date.now()).slice(-6);
        detailPanel.form.orderCount = 0;
        detailPanel.form.totalPurchaseAmt = 0;
        members.unshift({ ...detailPanel.form });
        detailPanel.dtlId = detailPanel.form.memberId;
        detailPanel.isNew = false;
      } else {
        const si = members.findIndex(m => m.memberId === detailPanel.form.memberId);
        if (si !== -1) { Object.assign(members[si], detailPanel.form); }
      }
      try {
        /* DB join_date 컬럼은 TIMESTAMP — LocalDateTime 매핑이라 'YYYY-MM-DDTHH:mm:ss' 형식 필요 */
        const fnToDateTime = (s) => {
          if (!s) { return s; }
          return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
        };
        const payload = {
          ...detailPanel.form,
          joinDate: fnToDateTime(detailPanel.form.joinDate),
        };
        if (isNewMember && !payload.loginPwdHash) {
          /* 신규 등록 시 임시 비밀번호 = 'init1234' 의 sha256 (회원에게 별도 안내 후 변경 유도) */
          payload.loginPwdHash = await coUtil.cofSha256('init1234');
        }
        const res = await (isNewMember
          ? boApiSvc.mbMember.create(payload, '회원관리', '등록')
          : boApiSvc.mbMember.update(detailPanel.form.memberId, payload, '회원관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        /* 저장 완료: 목록 재조회 + 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
        handleSearchList('RELOAD');
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
      const ok = await showConfirm('삭제', `[${cfSelectedRow.value.memberNm}] 회원을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const memberId = cfSelectedRow.value.memberId;
      const si = members.findIndex(m => m.memberId === memberId);
      if (si !== -1) { members.splice(si, 1); }
      closeDetail();
      try {
        const res = await boApiSvc.mbMember.remove(memberId, '회원관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_statuses = codeStore.sgGetGrpCodes('MEMBER_STATUS');
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      uiState.isPageCodeLoad = true;
    };

    // ★ onMounted — 진입 시 목록 초기 조회
    onMounted(() => {
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfSelectedRow = computed(() => members.find(m => m.memberId === detailPanel.dtlId) || null);

    /* fnFmtDate — 날짜 포맷 */
    const fnFmtDate = v => v ? String(v).slice(0, 10) : '';

    /* fnGradeBadge — 등급 배지 */
    const _MEMBER_GRADE_FB = { 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' };
    const fnGradeBadge = g => coUtil.cofCodeBadge('MEMBER_GRADE', g, _MEMBER_GRADE_FB[g] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const _MEMBER_STATUS_FB = { '활성': 'badge-green', '정지': 'badge-red' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('MEMBER_STATUS', s, _MEMBER_STATUS_FB[s] || 'badge-gray');

    /* fnGridRowClass — 그리드 행 클래스 */
    const fnGridRowClass = (row) => (detailPanel.dtlId === row.memberId ? 'active' : '');

    // 기본 검색
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

    // 기본 그리드
    const baseGridColumns = [
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

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      members, uiState, codes, searchParam, pager, detailPanel,                        // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                              // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfSelectedRow,                                                                   // computed
      sortIcon, fnGradeBadge, fnStatusBadge, fnFmtDate, fnGridRowClass,                // 헬퍼
      handleSave, handleDelete, closeDetail, handleSearchList,                         // Dtl 콜백 (자식 컴포넌트로 전달)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    회원관리
  </div>
  <!-- ===== ■. 검색 ======================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-grid :columns="baseGridColumns" :rows="members" row-key="memberId"
    :sort-state="uiState" list-title="회원목록" row-clickable
    :count-text="'총 ' + pager.pageTotalCount + '건'"
    :row-class="fnGridRowClass" empty-text="데이터가 없습니다."
    @sort="key => handleSelectAction('members-sort', key)"
    @set-page="n => handleSelectAction('members-pager-setPage', n)"
    @size-change="handleSelectAction('members-pager-sizeChange')"
    @row-click="row => handleSelectAction('members-rowEdit', row)" row-actions>
    <template #toolbar-actions>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('members-add')">
        + 신규
      </button>
    </template>
    <template #row-actions="{ row }">
      <button class="btn btn-blue btn-xs" @click="handleSelectAction('members-rowEdit', row)">
        수정
      </button>
    </template>
  </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('members-pager-setPage', n)" :on-size-change="() => handleSelectAction('members-pager-sizeChange')" />
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드, 항상 표시) ================================== -->
  <mb-member-dtl :detail-modal="detailPanel" :active="detailPanel.active"
    :handle-save="handleSave" :handle-delete="handleDelete" :close-detail="closeDetail"
    :reload-trigger="detailPanel.reloadTrigger"
    :on-list-reload="handleSearchList"
    />
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

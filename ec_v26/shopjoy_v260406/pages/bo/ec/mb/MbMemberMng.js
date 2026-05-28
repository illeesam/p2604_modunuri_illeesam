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
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList('SEARCH');
      // 회원 신규 등록 (인라인 패널)
      } else if (cmd === 'members-add') {
        return openNew();
      // 상세 인라인 패널 저장
      } else if (cmd === 'baseDetail-save') {
        return handleSave();
      // 상세 인라인 패널 삭제
      } else if (cmd === 'baseDetail-delete') {
        return handleDelete();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
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
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'members-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'members-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 클릭 → 상세 편집 패널 열기
      } else if (cmd === 'members-rowEdit') {
        return openDetail(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ searchType: '', searchValue: '', grade: '', status: '' });
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — pager + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* ===== 상세 인라인 패널 ===== */
    const baseDetail = reactive({                 // 인라인 Dtl 패널 상태
      show: false, isNew: false, dtlId: null, reloadTrigger: 0,
      form: { memberId: null, loginId: '', memberNm: '', memberPhone: '', gradeCd: '일반', memberStatusCd: '활성', joinDate: '', memberMemo: '' }
    });
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

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

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize,
          ...baseGrid.sortParam(),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,loginId';
        }
        const res = await boApiSvc.mbMember.getPage(params, '회원관리', '목록조회');
        const data = res.data?.data;
        members.splice(0, members.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
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
      Object.assign(baseDetail.form, {
        memberId: d.memberId, loginId: d.loginId || '', memberNm: d.memberNm || '',
        memberPhone: d.memberPhone || '', gradeCd: d.gradeCd || '', memberStatusCd: d.memberStatusCd || '',
        joinDate: fnFmtDate(d.joinDate), memberMemo: d.memberMemo || ''
      });
    };

    /* openDetail — 인라인 패널 편집 모드로 열기 */
    const openDetail = async (row) => {
      baseDetail.dtlId = row.memberId;
      baseDetail.isNew = false;
      baseDetail.show = true;
      baseDetail.reloadTrigger++;
      fnApplyForm(row); // 목록 row 데이터로 먼저 표시
      try {
        const res = await boApiSvc.mbMember.getById(row.memberId, '회원관리', '상세조회');
        const d = res.data?.data || res.data;
        if (d) { fnApplyForm(d); }
      } catch (err) {
        console.error('[openDetail]', err);
      }
    };

    /* openNew — 신규 등록 */
    const openNew = () => {
      Object.assign(baseDetail.form, { memberId: null, loginId: '', memberNm: '', memberPhone: '', gradeCd: '일반', memberStatusCd: '활성', joinDate: new Date().toISOString().split('T')[0], memberMemo: '' });
      baseDetail.dtlId = '__new__';
      baseDetail.isNew = true;
      baseDetail.show = true;
      baseDetail.reloadTrigger++;
    };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => {
      baseDetail.show = false;
      baseDetail.dtlId = null;
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      if (!baseDetail.form.loginId) { showToast('이메일은 필수입니다.', 'error'); return; }
      if (!baseDetail.form.memberNm) { showToast('이름은 필수입니다.', 'error'); return; }
      const isNewMember = baseDetail.isNew;
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      if (isNewMember) {
        baseDetail.form.memberId = 'MB' + String(Date.now()).slice(-6);
        baseDetail.form.orderCount = 0;
        baseDetail.form.totalPurchaseAmt = 0;
        members.unshift({ ...baseDetail.form });
        baseDetail.dtlId = baseDetail.form.memberId;
        baseDetail.isNew = false;
      } else {
        const si = members.findIndex(m => m.memberId === baseDetail.form.memberId);
        if (si !== -1) { Object.assign(members[si], baseDetail.form); }
      }
      try {
        /* DB join_date 컬럼은 TIMESTAMP — LocalDateTime 매핑이라 'YYYY-MM-DDTHH:mm:ss' 형식 필요 */
        const fnToDateTime = (s) => {
          if (!s) { return s; }
          return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s;
        };
        const payload = {
          ...baseDetail.form,
          joinDate: fnToDateTime(baseDetail.form.joinDate),
        };
        if (isNewMember && !payload.loginPwdHash) {
          /* 신규 등록 시 임시 비밀번호 = 'init1234' 의 sha256 (회원에게 별도 안내 후 변경 유도) */
          payload.loginPwdHash = await coUtil.cofSha256('init1234');
        }
        const res = await (isNewMember
          ? boApiSvc.mbMember.create(payload, '회원관리', '등록')
          : boApiSvc.mbMember.update(baseDetail.form.memberId, payload, '회원관리', '저장'));
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('저장되었습니다.', 'success'); }
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
  <bo-grid :columns="baseGridColumns" :rows="members" :pager="baseGrid.pager" row-key="memberId"
    :sort-state="baseGrid" list-title="회원목록" row-clickable
    :count-text="'총 ' + baseGrid.pager.pageTotalCount + '건'"
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
      <button class="btn btn-blue btn-sm" @click="handleSelectAction('members-rowEdit', row)">
        수정
      </button>
    </template>
  </bo-grid>
  <!-- ===== □. 목록 영역 =================================================== -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <mb-member-dtl :detail-modal="baseDetail" :handle-save="handleSave" :handle-delete="handleDelete" :close-detail="closeDetail"
    :reload-trigger="baseDetail.reloadTrigger"
    :on-list-reload="handleSearchList"
    />
  <!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
</div>
`,
};

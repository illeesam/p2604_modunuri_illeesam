/* ShopJoy Admin - 업체사용자 (sy_vendor_user + sy_vendor_user_role) */
window.SyVendorUserMng = {
  name: 'SyVendorUserMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const vendorUsers = reactive([]);
    const uiState = reactive({ loading: false, roleLoading: false, roleModalOpen: false, vendorPickOpen: false, error: null, selectedPath: null, searchVendorId: null, bizSearchType: '', bizSearchValue: '', bizVendorFlt: '', bizStatusFlt: '', treeRoleCat: '', formMode: '', dtlMode: 'view', roleModalTemp: null, userSearchType: '', userSearchValue: '', userStatusFlt: ''}); // dtlMode: 'view'|'edit' — 기본은 항상 view
    const cfDtlMode = computed(() => uiState.dtlMode === 'view');
    const codes = reactive({
      USER_STATUS: [],
      BOOL_YN: [],
      vendor_types: [['SALES','판매업체'],['DELIVERY','배송업체'],['CS','콜센터업체'],['SITE','사이트운영업체'],['PROG','유지보수업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']],
      biz_status: [['ACTIVE','운영중'],['SUSPENDED','중지'],['TERMINATED','종료']],
      user_employ_status: [['ACTIVE','재직'],['LEFT','퇴직'],['SUSPENDED','중지']],
    });

    /* -- 역할 트리 (좌측 패널) -- */
    const expanded = reactive(new Set([null]));
    const roles = reactive([]);
    const menus = reactive([]);
    const roleMenus = reactive([]);
    const vendors = reactive([]);
    const vendorGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const userGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* -- 인라인 폼 (사용자 등록/수정) -- */
    const formData = reactive({});
    const errors   = reactive({}); // 업체담당자 저장 검증 오류 (항목 아래 빨간 라벨)
    const userRoles = reactive([]);
    const roleTreeExpanded = reactive(new Set());

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorUserMng.js : handleBtnAction -> ', cmd, param);
      // 업체 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 사용자 검색조건으로 목록 조회
      } else if (cmd === 'userSearchParam-list') {
        return onUserSearch();
      // 사용자 검색조건 초기화
      } else if (cmd === 'userSearchParam-reset') {
        return onUserReset();
      // 사용자 인라인 폼: 신규 등록
      } else if (cmd === 'vendorUsers-add') {
        return openNew();
      // 사용자 인라인 폼: 저장
      } else if (cmd === 'vendorUsers-save') {
        return handleSaveForm();
      // 사용자 인라인 폼: 닫기/취소
      } else if (cmd === 'vendorUsers-close') {
        return closeForm();
      // 사용자 인라인 폼: 보기모드 → 수정모드 전환
      } else if (cmd === 'vendorUsers-edit') {
        return switchToEdit();
      // 사용자 인라인 폼: 수정 취소 (보기모드 복귀 또는 닫기)
      } else if (cmd === 'vendorUsers-cancel') {
        return handleCancelEdit();
      // 회원가입 메일 전송
      } else if (cmd === 'vendorUsers-sendJoinMail') {
        if (!formData.vendorUserEmail) { showToast('이메일을 입력해주세요.', 'warning'); return; }
        return showToast(formData.vendorUserEmail + ' 로 회원가입 메일을 보냈습니다.', 'success');
      // 비밀번호 초기화 메일 전송
      } else if (cmd === 'vendorUsers-sendPwresetMail') {
        if (!formData.vendorUserEmail) { showToast('이메일을 입력해주세요.', 'warning'); return; }
        return showToast(formData.vendorUserEmail + ' 로 비밀번호 초기화 메일을 보냈습니다.', 'success');
      // 역할 추가 모달 열기
      } else if (cmd === 'roleModal-open') {
        return openRoleModal();
      // 역할 추가 모달 닫기
      } else if (cmd === 'roleModal-close') {
        return closeRoleModal();
      // 역할 모달: 확인 (선택된 역할 부여)
      } else if (cmd === 'roleModal-confirm') {
        return confirmRoleModal();
      // 업체 그리드 페이지 번호 클릭
      } else if (cmd === 'vendors-pager-setPage') {
        return setBizPage(param);
      // 사용자 그리드 페이지 번호 클릭
      } else if (cmd === 'vendorUsers-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyVendorUserMng.js : handleSelectAction -> ', cmd, param);
      // 업체 그리드 [선택] 버튼 클릭 → 선택 업체 변경
      if (cmd === 'vendors-rowSelect') {
        return pickVendorRow(param);
      // 업체 그리드 페이지 크기 변경
      } else if (cmd === 'vendors-pager-sizeChange') {
        vendorGridPager.pageNo = 1; return handleLoadDetail();
      // 사용자 그리드 행 삭제
      } else if (cmd === 'vendorUsers-rowDelete') {
        return handleDeleteRow(param);
      // 사용자 그리드 페이지 크기 변경
      } else if (cmd === 'vendorUsers-pager-sizeChange') {
        return onSizeChange();
      // 부여된 역할 그리드 행 삭제
      } else if (cmd === 'userRoles-rowDelete') {
        return handleDeleteRole(param);
      // 역할 모달: 트리 노드 토글
      } else if (cmd === 'roleModal-treeToggle') {
        return toggleRoleNode(param);
      // 역할 모달: 트리 노드 선택
      } else if (cmd === 'roleModal-treePick') {
        return pickRoleInModal(param);
      // 업체 picker 모달 (외부) 결과 선택
      } else if (cmd === 'vendorPick-select') {
        return onVendorPicked(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터. colKey 기준 분기 (업체 picker / 사용자 수정) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyVendorUserMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'vendors-cellClick') {
        // 업체 picker — 행 아무 셀이나 클릭 시 선택
        return pickVendorRow(row);
      } else if (cmd === 'vendorUsers-cellClick') {
        // 행 수정 버튼 → 상세/수정 패널 열기
        if (colKey === 'btn_row_edit') {
          return openEdit(row);
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ SyVendorUserMng : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'role-select') {
        if (result == null) {
            return closeRoleModal();
        }
        return confirmRoleModal();
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleLoadData — 처리 */
    const handleLoadData = async () => {
      try {
        const [roleRes, menuRes, roleMenuRes] = await Promise.all([
          boApiSvc.syRole.getPage({ pageNo: 1, pageSize: 10000 }, '사업자사용자관리', '조회'),
          boApiSvc.syMenu.getPage({ pageNo: 1, pageSize: 10000 }, '사업자사용자관리', '조회'),
          boApiSvc.syRoleMenu.getPage({ pageNo: 1, pageSize: 10000 }, '사업자사용자관리', '조회'),
        ]);
        roles.splice(0, roles.length, ...(roleRes.data?.data?.pageList || roleRes.data?.data?.list || []));
        menus.splice(0, menus.length, ...(menuRes.data?.data?.pageList || menuRes.data?.data?.list || []));
        roleMenus.splice(0, roleMenus.length, ...(roleMenuRes.data?.data?.pageList || roleMenuRes.data?.data?.list || []));
      } catch (err) {
        console.error('[catch-info]', err);
        console.warn('[SyVendorUserMng] role/menu load failed', err);
      }
    };


    /* expandAll — 펼치기 전체 */
    const expandAll = () => { expanded.add(null); roles.forEach(r => expanded.add(r.roleCode)); };


    /* handleLoadDetail — 업체 목록 조회 (서버사이드 페이징) */
    const handleLoadDetail = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: vendorGridPager.pageNo, pageSize: vendorGridPager.pageSize,
          ...coUtil.cofOmitEmpty({
            searchValue: (uiState.bizSearchValue || '').trim(),
            searchType:  uiState.bizSearchType,
            vendorTypeCd:  uiState.bizVendorFlt,
          }),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'vendorNm,corpNo,vendorId';
        }
        const res = await boApiSvc.syVendor.getPage(params, '업체사용자관리', '조회');
        const d = res.data?.data || {};
        vendors.splice(0, vendors.length, ...(d.pageList || d.list || []));
        vendorGridPager.pageTotalCount = d.pageTotalCount || 0;
        vendorGridPager.pageTotalPage  = d.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(vendorGridPager);
      } catch(e) {
        console.error('[SyVendorUserMng] vendor load failed', e);
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['USER_STATUS_CD', 'BOOL_YN'], {compNm: 'SyVendorUserMng'});
      codes.USER_STATUS = codeStore.sgGetGrpCodes('USER_STATUS_CD');
      codes.BOOL_YN   = codeStore.sgGetGrpCodes('BOOL_YN');
    };


    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회 + 상세영역 빈 신규 폼(비활성)
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleLoadData();
      expandAll();
      await handleLoadDetail();
      Object.assign(formData, blank());   // 상세영역 항상 표시: 진입 시 빈 폼 (formMode='' → 버튼 숨김)
    };
    onMounted(initPage);

    const cfVendorMap = computed(() => Object.fromEntries(vendors.map(v => [v.vendorId, v])));


    /* fnVendorTypeCd — 유틸 */
    const fnVendorTypeCd = (id) => (cfVendorMap.value[id] || {}).vendorTypeCd || '';

    /* fnVendorSummary — 유틸 */
    const fnVendorSummary = (id) => {
      const v = cfVendorMap.value[id];
      if (!v) { return ''; }
      const vt = (codes.vendor_types.find(x=>x[0]===v.vendorTypeCd)||[,'?'])[1];
      return '['+vt+'] '+v.vendorNm;
    };

    /* setBizPage — 설정 */
    const setBizPage = n => { if (n >= 1 && n <= vendorGridPager.pageTotalPage) { vendorGridPager.pageNo = n; handleLoadDetail(); } };



    /* fnVendorTypeBadge — 유틸 */
    const fnVendorTypeBadge   = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');

    /* fnVendorTypeLabel — 유틸 */
    const fnVendorTypeLabel   = (cd) => (codes.vendor_types.find(v=>v[0]===cd)||[,'?'])[1];

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = (s) => ({ ACTIVE:'badge-green', LEFT:'badge-gray', SUSPENDED:'badge-orange' }[s]||'badge-gray');

    /* fnStatusLabel — 유틸 */
    const fnStatusLabel = (s) => ({ ACTIVE:'재직', LEFT:'퇴직', SUSPENDED:'중지' }[s]||s);

    /* pickVendorRow — 선택 업체 행 (업체 변경 시 상세영역은 빈 신규 폼으로 초기화) */
    const pickVendorRow = (v) => {
      uiState.searchVendorId = v.vendorId;
      uiState.treeRoleCat = ({ SALES:'SALES', DELIVERY:'DELIVERY', CS:'CS', SITE:'SITE', PROG:'PROG',
                              PARTNER:'SITE', INTERNAL:'SITE' })[v.vendorTypeCd] || '';
      loadVendorUsers(v.vendorId);
      userGridPager.pageNo = 1;
      resetFormToNew();    // 업체 전환 → 이전 선택 사용자 폼 초기화 (빈 폼 + 버튼 숨김)
    };

    /* onSearch — 조회 */
    const onSearch = () => { vendorGridPager.pageNo = 1; handleLoadDetail(); };

    /* onReset — 초기화 */
    const onReset = () => {
      uiState.bizSearchType = '';
      uiState.bizSearchValue = '';
      uiState.bizVendorFlt = '';
      uiState.bizStatusFlt = '';
      uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
      vendorGridPager.pageNo = 1;
      handleLoadDetail();
    };

    /* onUserSearch — 사용자 검색 (선택된 업체 내에서) */
    const onUserSearch = () => {
      if (!uiState.searchVendorId) { showToast('업체를 먼저 선택해주세요.', 'warning'); return; }
      userGridPager.pageNo = 1;
      loadVendorUsers(uiState.searchVendorId);
    };

    /* onUserReset — 사용자 검색 초기화 */
    const onUserReset = () => {
      uiState.userSearchType = '';
      uiState.userSearchValue = '';
      uiState.userStatusFlt = '';
      userGridPager.pageNo = 1;
      if (uiState.searchVendorId) { loadVendorUsers(uiState.searchVendorId); }
    };

    /* onVendorPicked — 이벤트 */
    const onVendorPicked = (v) => { uiState.vendorPickOpen=false; pickVendorRow(v); };

    /* loadVendorUsers — 로드 (사용자 검색조건 적용, 서버사이드 페이징) */
    const loadVendorUsers = async (vendorId) => {
      if (!vendorId) { return; }
      uiState.loading = true;
      try {
        const params = {
          vendorId, pageNo: userGridPager.pageNo, pageSize: userGridPager.pageSize,
          ...coUtil.cofOmitEmpty({
            searchValue: (uiState.userSearchValue || '').trim(),
            searchType:  uiState.userSearchType,
            status:      uiState.userStatusFlt,
          }),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,vendorUserEmail,vendorUserMobile';
        }
        const res = await boApiSvc.syVendorUser.getPage(params, '사업자사용자관리', '조회');
        const d = res.data?.data || {};
        vendorUsers.splice(0, vendorUsers.length, ...(d.pageList || d.list || []));
        userGridPager.pageTotalCount = d.pageTotalCount || 0;
        userGridPager.pageTotalPage  = d.pageTotalPage  || 1;
        coUtil.cofBuildPagerNums(userGridPager);
      } catch(e) {
        console.error('[SyVendorUserMng] user load failed', e);
      } finally {
        uiState.loading = false;
      }
    };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= userGridPager.pageTotalPage) { userGridPager.pageNo = n; loadVendorUsers(uiState.searchVendorId); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { userGridPager.pageNo = 1; loadVendorUsers(uiState.searchVendorId); };

    /* blank — 빈 폼 데이터 생성 */
    const blank = () => ({
      vendorUserId: null, vendorId: null, userId: null,
      memberNm: '', positionCd: '', vendorUserDeptNm: '', vendorUserPhone: '',
      vendorUserMobile: '', vendorUserEmail: '', birthDate: '',
      isMain: 'N', authYn: 'N', joinDate: '', leaveDate: '',
      vendorUserStatusCd: 'ACTIVE', vendorUserRemark: '',
    });

    /* resetFormToNew — 폼을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   formMode='' → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetFormToNew = () => {
      Object.assign(formData, blank());
      if (uiState.searchVendorId) { formData.vendorId = uiState.searchVendorId; }
      userRoles.splice(0);
      uiState.formMode = '';     // 버튼 숨김 (비활성)
      uiState.dtlMode = 'view';
    };

    /* openNew — 신규 열기 (빈 폼 + 활성, 항상 수정모드로 시작 → 저장/취소 노출) */
    const openNew = () => {
      const vid = uiState.searchVendorId;
      if (!vid) { showToast('업체를 먼저 선택해주세요.', 'warning'); return; }
      Object.assign(formData, blank());
      formData.vendorId = vid;
      formData.joinDate = coUtil.cofToYmd(new Date());
      userRoles.splice(0);
      uiState.formMode = 'new';  // 신규 입력 가능 → 저장/취소 노출
      uiState.dtlMode = 'edit';
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* _loadDetailForm — 인라인 폼에 행 데이터 적재 (view/edit 공용) */
    const _loadDetailForm = (u, mode) => {
      Object.assign(formData, u);
      uiState.formMode = 'edit';
      uiState.dtlMode = mode;
      loadUserRoles(u.vendorUserId);
      Object.keys(errors).forEach(k => delete errors[k]);
    };

    /* loadView — 보기모드로 인라인 폼 열기 (행 클릭) */
    const loadView = (u) => _loadDetailForm(u, 'view');

    /* openEdit — 수정모드로 인라인 폼 열기 ([수정] 버튼) */
    const openEdit = (u) => _loadDetailForm(u, 'edit');

    /* switchToEdit — 보기모드 → 수정모드 전환 (상세 패널 상단 [수정] 버튼) */
    const switchToEdit = () => { uiState.dtlMode = 'edit'; };

    /* closeForm — 닫기/취소 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeForm = () => { resetFormToNew(); };

    /* handleCancelEdit — 수정 취소: 신규 등록 중이면 패널 닫기, 기존 행 수정 중이면 원본 재적재 후 보기모드 복귀 */
    const handleCancelEdit = () => {
      if (uiState.formMode === 'new') { return closeForm(); }
      const row = vendorUsers.find(u => u.vendorUserId === formData.vendorUserId);
      return row ? loadView(row) : closeForm();
    };

    /* handleSaveForm — 저장 */
    const handleSaveForm = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!formData.memberNm) { errors.memberNm = '이름을 입력해주세요.'; }
      if (!formData.vendorUserMobile) { errors.vendorUserMobile = '휴대전화를 입력해주세요.'; }
      else if (!coUtil.cofIsValidMobile(formData.vendorUserMobile)) { errors.vendorUserMobile = '올바른 휴대전화 형식이 아닙니다. (예: 010-1234-5678)'; }
      if (!formData.vendorUserEmail) { errors.vendorUserEmail = '이메일을 입력해주세요.'; }
      else if (!coUtil.cofIsValidEmail(formData.vendorUserEmail)) { errors.vendorUserEmail = '올바른 이메일 형식이 아닙니다.'; }
      if (!coUtil.cofIsValidPhone(formData.vendorUserPhone)) { errors.vendorUserPhone = '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)'; }
      if (Object.keys(errors).length) { showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const isNewUser = uiState.formMode === 'new';
      const ok = await showConfirm(isNewUser?'등록':'저장', isNewUser?'등록하시겠습니까?':'저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = isNewUser
          ? await boApiSvc.syVendorUser.create({ ...formData }, '사업자사용자관리', '등록')
          : await boApiSvc.syVendorUser.update(formData.vendorUserId, { ...formData }, '사업자사용자관리', '저장');
        showToast(isNewUser?'등록되었습니다.':'저장되었습니다.', 'success');
        await loadVendorUsers(formData.vendorId);
        if (isNewUser) {
          closeForm();
        } else {
          const saved = res.data?.data;
          if (saved) { Object.assign(formData, saved); }
          uiState.formMode = 'edit';
          uiState.dtlMode = 'view';
        }
      } catch(err) {
        const msg = coUtil.cofErrMsg(err);
        showToast(msg, 'error', 0);
      }
    };

    /* handleDeleteRow — 삭제 */
    const handleDeleteRow = async (u) => {
      const ok = await showConfirm('삭제', `[${u.memberNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        const res = await boApiSvc.syVendorUser.remove(u.vendorUserId, '사업자사용자관리', '삭제');
        showToast('삭제되었습니다.', 'success');
        await loadVendorUsers(u.vendorId);
        if (uiState.formMode === 'edit' && formData.vendorUserId === u.vendorUserId) { closeForm(); }
      } catch(err) {
        const msg = coUtil.cofErrMsg(err);
        showToast(msg, 'error', 0);
      }
    };

    /* loadUserRoles — 로드 */
    const loadUserRoles = async (vendorUserId) => {
      if (!vendorUserId) { return; }
      uiState.roleLoading = true;
      try {
        const res = await boApiSvc.syVendorUser.getRoles({ userId: vendorUserId }, '사업자사용자관리', '조회');
        userRoles.splice(0, userRoles.length, ...(res.data?.data || []));
      } catch(e) {
      } finally {
        uiState.roleLoading = false;
      }
    };

    /* 업체유형 → 역할트리 루트코드. PARTNER/INTERNAL 은 대응 역할트리가 없어 매핑 없음(null) */
    const VENDOR_TYPE_ROOT_MAP = { SALES:'SITE_MGR_ROOT', DELIVERY:'DLIV_ROOT', CS:'CS_ROOT', SITE:'SITE_OP_ROOT', PROG:'PROG_ROOT' };
    const cfFormAllowedRootCode = computed(() => {
      const vt = fnVendorTypeCd(formData.vendorId);
      return VENDOR_TYPE_ROOT_MAP[vt] || null;
    });
    const cfFormRoleTree = computed(() => {
      const allowedRootCode = cfFormAllowedRootCode.value;

      /* buildBranch — 빌드 */
      const buildBranch = (pid, allowed) => roles
        .filter(r => r.parentRoleId === pid)
        .sort((a,b) => (a.sortOrd||0)-(b.sortOrd||0))
        .map(r => {
          const isAllowedRoot = r.parentRoleId===null && r.roleCode===allowedRootCode;
          const branchAllowed = allowed || isAllowedRoot;

          return { roleId:r.roleId, roleCode:r.roleCode, roleNm:r.roleNm,
                   isRoot:r.parentRoleId===null, allowed: branchAllowed && r.parentRoleId!==null,
                   children: buildBranch(r.roleId, branchAllowed) };
        });
      return buildBranch(null, false);
    });

    /* openRoleModal — 열기 */
    const openRoleModal = async () => {
      uiState.roleModalTemp = null;
      roleTreeExpanded.clear();
      await handleLoadData();
      const root = roles.find(r=>r.roleCode===cfFormAllowedRootCode.value);
      if (root) { roleTreeExpanded.add(root.roleId); }
      uiState.roleModalOpen = true;
    };

    /* closeRoleModal — 닫기 */
    const closeRoleModal = () => { uiState.roleModalOpen = false; };

    /* toggleRoleNode — 토글 */
    const toggleRoleNode = (id) => { if(roleTreeExpanded.has(id)) roleTreeExpanded.delete(id); else roleTreeExpanded.add(id); };

    /* pickRoleInModal — 선택 권한 에서 모달 */
    const pickRoleInModal = (n) => { if (!n.allowed) return; uiState.roleModalTemp = n.roleCode; };

    /* roleNmByCode — 권한 Nm 으로 코드 */
    const roleNmByCode = (code) => {
      const m = Object.fromEntries(roles.map(x=>[x.roleId,x]));
      let cur = roles.find(x=>x.roleCode===code);
      if (!cur) { return code; }
      const seg = [];
      while (cur) { seg.unshift(cur.roleNm); cur = cur.parentRoleId ? m[cur.parentRoleId] : null; }
      return seg.join(' > ');
    };

    /* roleIdByCode — 권한 Id 으로 코드 */
    const roleIdByCode = (code) => roles.find(r=>r.roleCode===code)?.roleId || null;

    /* confirmRoleModal — 확인 권한 모달 */
    const confirmRoleModal = async () => {
      if (!uiState.roleModalTemp) { return; }
      const rid = roleIdByCode(uiState.roleModalTemp);
      if (!rid) { showToast('역할을 찾을 수 없습니다.', 'error'); return; }
      if (userRoles.some(r=>r.roleId===rid)) {
        showToast('이미 부여된 역할입니다.', 'warning');
        closeRoleModal(); return;
      }
      try {
        const res = await boApiSvc.syVendorUser.addRole({
          vendorId: formData.vendorId,
          userId: formData.vendorUserId,
          roleId: rid,
        }, '사업자사용자관리', '등록');
        showToast('역할이 부여되었습니다.', 'success');
        await loadUserRoles(formData.vendorUserId);
      } catch(err) {
        const msg = coUtil.cofErrMsg(err);
        showToast(msg, 'error', 0);
      }
      closeRoleModal();
    };

    /* handleDeleteRole — 삭제 */
    const handleDeleteRole = async (r) => {
      const ok = await showConfirm('역할 삭제', `[${r.roleNm}] 역할을 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        const res = await boApiSvc.syVendorUser.removeRole(r.vendorUserRoleId, '사업자사용자관리', '삭제');
        showToast('역할이 삭제되었습니다.', 'success');
        await loadUserRoles(formData.vendorUserId);
      } catch(err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* 메뉴 권한 미리보기 */
    const ROLE_DEFAULT_PERM = {
      REP:'관리', MGT:'관리', SITE_ADMIN:'쓰기', SITE_OPER:'쓰기', STAFF:'읽기',
      DLIV_REP:'관리', DLIV_MGT:'관리', DLIV_SITE_ADMIN:'쓰기', DLIV_STAFF:'읽기',
    };
    const cfSelectedModalRole = computed(() => {
      if (!uiState.roleModalTemp) { return null; }
      return roles.find(r=>r.roleCode===uiState.roleModalTemp) || null;
    });
    const cfMenuPermColumns = [
      { key: 'menuNm', label: '메뉴',
        cellStyle: (v, row) => `padding:6px 12px 6px ${12 + row._depth * 16}px;font-weight:${row.menuType === '폴더' ? 700 : 400};border-bottom:1px solid #f3f4f6;` },
      { key: '_perm', label: '권한', style: 'width:80px;', align: 'center',
        fmt: (v) => v !== '없음' ? v : '—',
        cellStyle: (v) => v !== '없음'
          ? `text-align:center;padding:6px 12px;border-bottom:1px solid #f3f4f6;`
          : `text-align:center;padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#d1d5db;font-size:11px;` },
    ];
    const cfModalMenuList = computed(() => {
      const role = cfSelectedModalRole.value;
      const rm = role ? roleMenus.filter(x=>x.roleId===role.roleId) : [];
      const permBy = Object.fromEntries(rm.map(x=>[x.menuId, x.permLevel]));
      const fallback = role ? (ROLE_DEFAULT_PERM[role.roleCode]||'없음') : '없음';

      /* buildMenu — 빌드 */
      const buildMenu = (pid, depth) => menus
        .filter(m=>(m.parentRoleId||null)===(pid||null))
        .sort((a,b)=>(a.sortOrd||0)-(b.sortOrd||0))
        .flatMap(m=>[{...m,_depth:depth,_perm:permBy[m.menuId]||fallback},...buildMenu(m.menuId,depth+1)]);
      return buildMenu(null, 0);
    });

    /* fnPermBadgeColor — 유틸 */
    const fnPermBadgeColor = (p) => ({관리:'#f59e0b',쓰기:'#16a34a',읽기:'#2563eb',차단:'#e8587a'}[p]||'#9ca3af');

    /* onRoleRootHover — 이벤트 */
    const onRoleRootHover = (root, evt) => {
      if (root.roleCode === cfFormAllowedRootCode.value && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#eff6ff';
      }
    };

    /* onRoleChildHover — 이벤트 */
    const onRoleChildHover = (ch, evt) => {
      if (ch.allowed && uiState.roleModalTemp !== ch.roleCode && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#eff6ff';
      }
    };

    /* onRoleChildLeave — 이벤트 */
    const onRoleChildLeave = (ch, evt) => {
      if (uiState.roleModalTemp !== ch.roleCode && evt && evt.currentTarget) {
        evt.currentTarget.style.background = 'transparent';
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 업체 검색 (좌측 업체목록 상단)
    const columns = {};
    columns.vendorSearch = [
      { key: 'bizSearchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'vendorNm', label: '업체명' },
          { value: 'corpNo',   label: '사업자번호' },
          { value: 'vendorId', label: '업체ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'bizSearchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'bizVendorFlt', type: 'select', label: '업체유형',
        options: () => codes.vendor_types.map(v => ({ value: v[0], label: v[1] })),
        nullLabel: '업체유형 전체' },
    ];

    // 사용자 검색 (우측 사용자목록 상단)
    columns.userSearch = [
      { key: 'userSearchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'memberNm',          label: '이름' },
          { value: 'vendorUserEmail',   label: '이메일' },
          { value: 'vendorUserMobile',  label: '휴대전화' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'userSearchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'userStatusFlt', type: 'select', label: '상태',
        options: () => (codes.user_employ_status || []).map(s => ({ value: s[0], label: s[1] })),
        nullLabel: '상태 전체' },
    ];

    // 판매업체 그리드
    columns.vendorGrid = [
      { key: 'vendorTypeCd', label: '업체유형', align: 'center', badge: (row) => fnVendorTypeBadge(row.vendorTypeCd), fmt: (v) => fnVendorTypeLabel(v) },
      { key: 'vendorNm',     label: '업체명', cellStyle: 'font-weight:600' },
      { key: 'bizNo',        label: '사업자번호',
        cellInnerStyle: 'font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-family:monospace;' },
      { key: 'ceo',          label: '대표자' },
      { key: 'phone',        label: '전화', cellStyle: 'font-size:11.5px' },
      { type: 'actions', actions: [
        { label: (row) => (uiState.searchVendorId === row.vendorId ? '선택됨' : '선택'), cls: 'btn btn-primary btn-xs',
          onClick: (row) => handleSelectAction('vendors-rowSelect', row) },
      ] },
    ];
    // 사용자 그리드
    columns.userGrid = [
      { key: 'memberNm',           label: '이름', cellStyle: 'font-weight:600' },
      { key: 'positionCd',         label: '직위', cellStyle: 'color:#666' },
      { key: 'vendorUserDeptNm',   label: '부서', cellStyle: 'color:#666' },
      { key: 'vendorUserMobile',   label: '휴대전화' },
      { key: 'vendorUserEmail',    label: '이메일' },
      { key: 'vendorUserStatusCd', label: '상태', style: 'width:80px;text-align:center;', align: 'center', badge: (row) => fnStatusBadge(row.vendorUserStatusCd), fmt: (v) => fnStatusLabel(v) },
      { type: 'actions', actions: [
        { label: '수정', cls: 'btn btn_row_edit btn-sm', onClick: (row) => handleGridCellAction('vendorUsers-cellClick', 'btn_row_edit', row) },
        { label: '삭제', cls: 'btn btn_row_delete',       onClick: (row) => handleSelectAction('vendorUsers-rowDelete', row) },
      ] },
    ];
    /* BoGrid(bare) 컬럼 정의 — 부여된 역할 목록 */
    columns.userRoleGrid = [
      { key: 'roleNm',    label: '역할명', cellStyle: 'font-weight:600', fmt: (v, row) => row.roleNm || roleNmByCode(row.roleId) },
      { key: 'grantDate', label: '부여일시', cellStyle: 'color:#6b7280', fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'validTerm', label: '유효기간', cellStyle: 'color:#6b7280;',
        fmt: (v, row) => (row.validFrom || row.validTo) ? `${row.validFrom||'∞'} ~ ${row.validTo||'∞'}` : '제한없음',
        cellInnerStyle: (v, row) => (row.validFrom || row.validTo) ? '' : 'color:#d1d5db;' },
      { type: 'actions', actions: [
        { label: '삭제', cls: 'btn btn_row_delete', onClick: (row) => handleSelectAction('userRoles-rowDelete', row) },
      ] },
    ];
    /* fnVendorRowStyle — 유틸 (선택 강조는 selected-key 의 파란 테두리로 처리) */
    const fnVendorRowStyle = (v) => '';
    /* fnUserRowStyle — 유틸 (선택 강조는 selected-key 의 파란 테두리로 처리) */
    const fnUserRowStyle   = (u) => '';

    // 판매업체 사용자 폼
    columns.baseVendorUserForm = [
      { type: 'group', label: '기본 · 연락처' },
      { key: 'vendorId',          label: '업체', type: 'readonly',
        fmt: (v) => fnVendorSummary(v) },
      { key: 'memberNm',          label: '이름', type: 'text', required: true },
      { key: 'positionCd',        label: '직위', type: 'text' },
      { key: 'vendorUserDeptNm',  label: '부서', type: 'text' },
      { key: 'vendorUserPhone',   label: '사무실 전화', type: 'text',
        validate: (v) => !coUtil.cofIsValidPhone(v) ? '올바른 전화번호 형식이 아닙니다. (예: 02-1234-5678)' : null },
      { key: 'vendorUserMobile',  label: '휴대전화', type: 'text', required: true,
        validate: (v) => v && !coUtil.cofIsValidMobile(v) ? '올바른 휴대전화 형식이 아닙니다. (예: 010-1234-5678)' : null },
      { key: 'vendorUserEmail',   label: '이메일', type: 'text', required: true,
        validate: (v) => v && !coUtil.cofIsValidEmail(v) ? '올바른 이메일 형식이 아닙니다.' : null },
      { key: 'birthDate',         label: '생년월일', type: 'date' },
      { type: 'group', label: '권한 · 재직정보' },
      { key: 'isMain',            label: '대표 담당자', type: 'select', options: () => codes.BOOL_YN },
      { key: 'authYn',            label: '관리권한', type: 'select', options: () => codes.BOOL_YN },
      { key: 'vendorUserStatusCd', label: '상태', type: 'select',
        options: () => (codes.user_employ_status || []).map(s => ({ value: s[0], label: s[1] })) },
      { key: 'joinDate',          label: '등록일', type: 'date' },
      { key: 'leaveDate',         label: '퇴직일', type: 'date' },
      { key: 'vendorUserRemark',  label: '비고', type: 'text', colSpan: 3 },
    ];

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => {
      const p = {
        vendorId: uiState.searchVendorId,
        ...coUtil.cofOmitEmpty({
          searchValue: (uiState.userSearchValue || '').trim(),
          searchType:  uiState.userSearchType,
          status:      uiState.userStatusFlt,
        }),
      };
      if (p.searchValue && !p.searchType) { p.searchType = 'memberNm,vendorUserEmail,vendorUserMobile'; }
      return p;
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, cfDtlMode, vendorUsers, vendors, vendorGridPager, userGridPager, formData, errors, userRoles, roleTreeExpanded,    // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                              // dispatch (모든 이벤트 / 액션 라우팅)
      cfFormRoleTree, cfFormAllowedRootCode, cfSelectedModalRole, cfModalMenuList, cfMenuPermColumns,           // computed
      fnVendorRowStyle, fnUserRowStyle, fnPermBadgeColor, roleNmByCode, fnVendorTypeCd, fnVendorTypeLabel,      // 헬퍼
      onRoleRootHover, onRoleChildHover, onRoleChildLeave,                                                     // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="업체사용자">
  <!-- ===== ■. 업체 목록 (좌) + 사용자 목록 (우) — 2단 그리드 (좌우 균형, 트리 17:83 아님) ==================== -->
  <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:0 12px;align-items:flex-start;margin-bottom:16px;">
    <!-- ===== ■.■. 좌: 업체 검색 + 목록 ===================================== -->
    <div>
      <!-- ===== ■.■.■. 업체 검색 영역 ========================================= -->
      <bo-container>
        <bo-search-area :columns="columns.vendorSearch" :param="uiState" :loading="uiState.loading"
          @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
      </bo-container>
      <!-- ===== ■.■.■. 업체 목록 ============================================= -->
      <bo-container title="업체목록" :count-text="vendors.length + '건'">
        <bo-grid bare
          :columns="columns.vendorGrid" :rows="vendors" :pager="vendorGridPager" row-key="vendorId" :selected-key="uiState.searchVendorId"
          :row-style="fnVendorRowStyle"
          grid-id="vendors-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
        <bo-pager :pager="vendorGridPager" :on-set-page="n => handleBtnAction('vendors-pager-setPage', n)" :on-size-change="() => handleSelectAction('vendors-pager-sizeChange')" />
      </bo-container>
    </div>
    <!-- ===== □.□. 좌: 업체 검색 + 목록 ===================================== -->
    <!-- ===== ■.■. 우: 사용자 검색 + 목록 =================================== -->
    <div>
      <!-- ===== ■.■.■. 사용자 검색 영역 ======================================= -->
      <bo-container>
        <bo-search-area :columns="columns.userSearch" :param="uiState" :loading="uiState.loading"
          @search="handleBtnAction('userSearchParam-list')" @reset="handleBtnAction('userSearchParam-reset')" />
      </bo-container>
      <!-- ===== ■.■.■. 사용자 목록 (항상 표시 — 업체 미선택 시 안내 empty-text) ======== -->
      <bo-container title="사용자목록" :count-text="vendorUsers.length + '건'">
        <template #toolbar-actions>
          <button class="btn btn_excel" :disabled="uiState.searchVendorId == null" @click="excelModal.show = true">엑셀</button>
          <button class="btn btn_new" :disabled="uiState.searchVendorId == null" @click="handleBtnAction('vendorUsers-add')">
            + 신규등록
          </button>
        </template>
        <bo-grid bare
          :columns="columns.userGrid" :rows="vendorUsers" :pager="userGridPager" row-key="vendorUserId" :selected-key="formData.vendorUserId"
          :row-style="fnUserRowStyle" :loading="uiState.loading"
          :empty-text="uiState.searchVendorId != null ? '사용자가 없습니다.' : '좌측 업체목록에서 업체를 선택하면 사용자 목록이 표시됩니다.'"
          grid-id="vendorUsers-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
        <bo-pager v-if="uiState.searchVendorId != null" :pager="userGridPager" :on-set-page="n => handleBtnAction('vendorUsers-pager-setPage', n)" :on-size-change="() => handleSelectAction('vendorUsers-pager-sizeChange')" />
        <bo-excel-down-modal :show="excelModal.show" domain="syVendorUser" area-nm="업체 사용자"
          :columns="columns.userGrid" ui-nm="업체 사용자관리" :params="buildExcelParams()"
          @close="excelModal.show = false" />
      </bo-container>
    </div>
    <!-- ===== □.□. 우: 사용자 검색 + 목록 =================================== -->
  </div>
  <!-- ===== □. 업체 목록 (좌) + 사용자 목록 (우) =================================== -->
  <!-- ===== ■. 인라인 폼 (항상 표시 — 미선택 시 빈 폼 + 버튼 숨김 + 안내) ============ -->
  <bo-container bare>
    <div class="card" style="margin-top:12px;">
      <div class="toolbar">
        <span class="list-title">
          {{ uiState.formMode==='new' ? '업체담당자 신규' : (uiState.formMode==='edit' ? (cfDtlMode ? '업체담당자 상세' : '업체담당자 수정') : '업체담당자 상세') }}
          <span v-if="uiState.formMode==='edit'" style="margin-left:8px;font-size:11px;color:#888;font-weight:400;">
            #{{ formData.vendorUserId }}
          </span>
        </span>
        <div v-if="uiState.formMode" style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('vendorUsers-sendJoinMail')">✉ 회원가입메일</button>
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('vendorUsers-sendPwresetMail')">🔑 비밀번호초기화</button>
          <template v-if="cfDtlMode">
            <button class="btn btn_edit" @click="handleBtnAction('vendorUsers-edit')">수정</button>
            <button class="btn btn_close" @click="handleBtnAction('vendorUsers-close')">닫기</button>
          </template>
          <template v-else>
            <button class="btn btn_cancel" @click="handleBtnAction('vendorUsers-cancel')">취소</button>
            <button class="btn btn_save" @click="handleBtnAction('vendorUsers-save')">저장</button>
          </template>
        </div>
      </div>
      <!-- ===== ■.■. 업체사용자 상세 폼 (항상 표시 — 미선택 시 빈 폼 구조 노출) =============== -->
      <div style="padding:16px;">
        <!-- ===== ■.■.■. 폼 영역 ================================================ -->
        <bo-form-area :columns="columns.baseVendorUserForm" :form="formData" :errors="errors"
          :cols="3" compact :show-actions="false" :readonly="cfDtlMode" plain-readonly />
      </div>
      <!-- ===== □.□. 업체사용자 상세 폼 (BoFormArea 자동 렌더) ========================= -->
      <!-- ===== ■.■. 역할 목록 (수정 모드에서만) ====================================== -->
      <div v-if="uiState.formMode==='edit'" style="padding:0 16px 16px;">
        <div class="toolbar" style="margin-bottom:8px;">
          <span class="list-title" style="font-size:13px;">🎭 부여된 역할 <span class="list-count"> {{ userRoles.length }}개 </span></span>
          <button class="btn btn-blue btn-sm" @click="handleBtnAction('roleModal-open')">+ 역할 추가</button>
        </div>
        <div v-if="uiState.roleLoading" style="text-align:center;padding:12px;color:#9ca3af;font-size:12px;">로딩 중...</div>
        <!-- ===== ■.■.■. 목록 영역 =============================================== -->
        <bo-grid v-else bare :columns="columns.userRoleGrid" :rows="userRoles" row-key="vendorUserRoleId"
          empty-text="부여된 역할이 없습니다." />
      </div>
    </div>
  </bo-container>
  <!-- ===== □.□. 역할 목록 (수정 모드에서만) ====================================== -->
  <!-- ===== □. 인라인 폼 =================================================== -->
  <!-- ===== ■. 역할 선택 모달 (BoRoleSelectModal) ============================ -->
  <bo-role-select-modal :show="uiState.roleModalOpen" title="🎭 역할 선택"
    :confirm-disabled="!uiState.roleModalTemp"
    @close="handleBtnAction('roleModal-close')" @confirm="handleBtnAction('roleModal-confirm')">
    <!-- ===== □. 역할 선택 모달 (BoRoleSelectModal) ============================ -->
    <!-- ===== ■. 영역 ====================================================== -->
    <template #header-extra>
      <span v-if="cfFormAllowedRootCode"
        :style="{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'10px',background:'#fff',border:'1px solid #93c5fd',fontWeight:700,fontSize:'11px',color:cfFormAllowedRootCode==='SITE_MGR_ROOT'?'#16a34a':'#d97706'}">
        {{ fnVendorTypeLabel(fnVendorTypeCd(formData.vendorId)) }}역할
      </span>
    </template>
    <!-- ===== □. 영역 ====================================================== -->
    <!-- ===== ■. 영역 ====================================================== -->
    <template #tree>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">📂 역할 트리</div>
      <div v-if="!cfFormAllowedRootCode" style="padding:10px;font-size:11px;color:#dc2626;background:#fef2f2;border-radius:6px;">
        선택한 업체의 업체유형이 없어 역할을 선택할 수 없습니다.
      </div>
      <template v-for="root in cfFormRoleTree" :key="root.roleId">
        <div :style="{padding:'7px 8px',fontWeight:700,fontSize:'12.5px',display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',borderRadius:'6px',marginBottom:'2px',
          color:root.roleCode===cfFormAllowedRootCode?'#1e40af':'#cbd5e1'}"
          @click="handleSelectAction('roleModal-treeToggle', root.roleId)"
          @mouseover="onRoleRootHover(root, $event)"
          @mouseout="$event.currentTarget.style.background='transparent'">
          <span style="width:12px;font-size:10px;color:#9ca3af;">{{ roleTreeExpanded.has(root.roleId)?'▾':'▸' }}</span>
          <span>📁 {{ root.roleNm }}</span>
        </div>
        <div v-if="roleTreeExpanded.has(root.roleId)" style="padding-left:14px;margin-bottom:6px;">
          <div v-for="ch in root.children" :key="ch.roleId"
            @click="handleSelectAction('roleModal-treePick', ch)"
            :style="{padding:'7px 10px',fontSize:'12.5px',cursor:ch.allowed?'pointer':'not-allowed',
            color:ch.allowed?(uiState.roleModalTemp===ch.roleCode?'#fff':'#374151'):'#d1d5db',
            background:uiState.roleModalTemp===ch.roleCode?'linear-gradient(135deg,#3b82f6,#2563eb)':'transparent',
            borderRadius:'6px',fontWeight:uiState.roleModalTemp===ch.roleCode?700:500,marginBottom:'2px',
            display:'flex',alignItems:'center',gap:'6px',transition:'all .1s'}"
            @mouseover="onRoleChildHover(ch, $event)"
            @mouseout="onRoleChildLeave(ch, $event)">
            <span style="font-size:9px;">●</span>
            <span>{{ ch.roleNm }}</span>
          </div>
        </div>
      </template>
    </template>
    <!-- ===== □. 영역 ====================================================== -->
    <!-- ===== ■. 영역 ====================================================== -->
    <template #perm>
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px;">
        🔐 메뉴 접근권한
        <span v-if="cfSelectedModalRole" style="color:#2563eb;margin-left:8px;">— {{ cfSelectedModalRole.roleNm }}</span>
      </div>
      <div v-if="!cfSelectedModalRole" style="padding:60px 20px;text-align:center;font-size:13px;color:#9ca3af;">
        <div style="font-size:28px;margin-bottom:8px;">👈</div>
        좌측에서 역할을 선택하세요
      </div>
      <!-- ===== ■.■. 그리드 =================================================== -->
      <bo-grid v-else bare :columns="cfMenuPermColumns" :rows="cfModalMenuList" row-key="menuId"
        :row-style="(row, i) => ({background: i%2===0 ? '#fff' : '#fafbfc'})"
        style="font-size:12px;">
        <template #cell-menuNm="{ row }">
          <span v-if="row.menuType==='폴더'" style="color:#f59e0b;margin-right:4px;">📁</span>
          <span v-else style="color:#9ca3af;margin-right:4px;font-size:10px;">·</span>
          {{ row.menuNm }}
        </template>
        <template #cell-_perm="{ row }">
          <span v-if="row._perm!=='없음'" :style="{background:fnPermBadgeColor(row._perm),color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'9px',fontWeight:700}">
            {{ row._perm }}
          </span>
          <span v-else style="color:#d1d5db;font-size:11px;">—</span>
        </template>
      </bo-grid>
    </template>
    <!-- ===== □.□. 테이블 =================================================== -->
    <!-- ===== □. 영역 ====================================================== -->
    <!-- ===== ■. 영역 ====================================================== -->
    <template #footer-extra>
      <span style="font-size:11px;color:#6b7280;">
        <span v-if="uiState.roleModalTemp">선택: <b style="color:#2563eb;"> {{ roleNmByCode(uiState.roleModalTemp) }} </b></span>
        <span v-else style="color:#9ca3af;">역할을 선택해주세요</span>
      </span>
    </template>
  </bo-role-select-modal>
  <!-- ===== □. 영역 ====================================================== -->
</bo-page>
`,
};

/* ShopJoy Admin - 역할관리 (Tree CRUD 그리드 + 하단 메뉴/사용자 배분) */
window.SyRoleMng = {
  name: 'SyRoleMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const roles = reactive([]);     // 역할 목록 (메인 그리드 데이터)
    const menus = reactive([]);     // 전체 메뉴 정의 (sy_menu)
    const roleMenus = reactive([]); // 역할-메뉴 권한 매핑 (sy_role_menu)
    const roleUsers = reactive([]); // 역할-사용자 매핑 (sy_role_user)
    const boUsers = reactive([]);   // BO 사용자 풀 (사용자 선택 모달용)

    /* ===== UI State ===== */
    const uiState = reactive({
      checkAll: false,
      error: null,
      userSelectOpen: false,
      isPageCodeLoad: false, loading: false, selectedPath: null, focusedIdx: null, selectedRoleId: null, menuSearchValue: ''});
    const codes = reactive({ role_status: [], use_yn: [], perm_levels: ['없음','읽기','쓰기','관리','차단'], role_cats: [['ADMIN','관리자역할'],['SITE','사이트역할'],['SALES','판매업체역할'],['DLIV','배송업체역할']] });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyRoleMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        return handleSearchList();
      // 역할 그리드 저장
      } else if (cmd === 'roles-save') {
        return handleSave();
      // 역할 그리드 행 추가
      } else if (cmd === 'roles-add') {
        return addRow();
      // 체크된 역할 일괄 삭제
      } else if (cmd === 'roles-delete-checked') {
        return deleteRows();
      // 체크된 역할 일괄 취소
      } else if (cmd === 'roles-cancel-checked') {
        return cancelChecked();
      // 역할 목록 엑셀 내보내기
      } else if (cmd === 'roles-excel') {
        return exportExcel();
      // 역할 목록 재조회
      } else if (cmd === 'roles-reload') {
        return handleSearchList('RELOAD');
      // 역할 설정 (메뉴/사용자 권한) 저장
      } else if (cmd === 'config-save') {
        return handleSaveRoleConfig();
      // 좌측 경로 트리 전체 펼치기
      } else if (cmd === 'pathTree-expand-all') {
        const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); };
        walk(cfTree.value);
        return;
      // 좌측 경로 트리 전체 접기
      } else if (cmd === 'pathTree-collapse-all') {
        expanded.clear();
        expanded.add('');
        return;
      // 좌측 경로 트리 카테고리 필터 변경
      } else if (cmd === 'pathTree-cat-change') {
        return handleSearchList();
      // 좌측 경로 트리 노드 펼치기/접기 토글
      } else if (cmd === 'pathTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 메뉴 권한 전체 토글 (checked → 읽기, unchecked → 없음)
      } else if (cmd === 'roleMenus-toggle-all') {
        return setAllMenuPerm(param ? '읽기' : '없음');
      // 메뉴 권한 일괄 설정 (특정 권한 레벨로 모두 변경)
      } else if (cmd === 'roleMenus-set-all') {
        return setAllMenuPerm(param);
      // 사용자 선택 모달 열기
      } else if (cmd === 'roleUsers-open-select') {
        uiState.userSelectOpen = true;
        return;
      // 사용자 선택 모달 닫기
      } else if (cmd === 'roleUsers-close-select') {
        uiState.userSelectOpen = false;
        return;
      // 상위역할 선택 모달 닫기
      } else if (cmd === 'parentModal-close') {
        roleTreeModal.show = false;
        return;
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        pathPickModal.show = false;
        pathPickModal.row = null;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyRoleMng.js : handleSelectAction -> ', cmd, param);
      // 역할 그리드 행 편집 (상세 로드)
      if (cmd === 'roles-row-edit') {
        return handleLoadRoleDetail(param);
      // 역할 그리드 행 삭제 마킹
      } else if (cmd === 'roles-row-delete') {
        return deleteRow(param);
      // 역할 그리드 행 변경 취소
      } else if (cmd === 'roles-row-cancel') {
        return cancelRow(param);
      // 역할 그리드 셀 값 변경 감지
      } else if (cmd === 'roles-row-cell-change') {
        return onCellChange(param);
      // 역할 그리드 전체 체크/해제 토글
      } else if (cmd === 'roles-row-check-all') {
        gridRows.forEach(r => { r._row_check = uiState.checkAll; });
        return;
      // 역할 그리드 행에서 설정 패널 열기 (선택된 역할 변경)
      } else if (cmd === 'roles-row-open-setting') {
        return onOpenSetting(param);
      // 상위역할 선택 모달 열기 (parentPick 컬럼)
      } else if (cmd === 'parentModal-open') {
        return openParentModal(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        return handleSearchList();
      // 메뉴 권한 단일 설정 (특정 메뉴 + 특정 권한)
      } else if (cmd === 'roleMenus-set') {
        return setMenuPerm(param.menuId, param.perm);
      // 역할-사용자 매핑 제거
      } else if (cmd === 'roleUsers-remove') {
        if (!uiState.selectedRoleId) { return; }
        const idx = roleUsers.findIndex(x => x.roleId === uiState.selectedRoleId && x.boUserId === param);
        if (idx !== -1) { roleUsers.splice(idx, 1); }
        return;
      // 역할-사용자 매핑 추가 (사용자 선택 모달에서 선택)
      } else if (cmd === 'roleUsers-select') {
        return onUserSelect(param);
      // 상위역할 모달에서 상위 선택 → 행 parentRoleId 갱신
      } else if (cmd === 'parentModal-select') {
        if (roleTreeModal.targetRow) {
          roleTreeModal.targetRow.parentRoleId = param.roleId;
          roleTreeModal.targetRow._depth = 0;
          onCellChange(roleTreeModal.targetRow);
        }
        roleTreeModal.show = false;
        return;
      // 표시경로 모달에서 경로 선택 → 대상 행 pathId 갱신
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', type: '', useYn: 'Y', cat: '', treeCatFilter: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== CRUD 그리드 ===== */
    const gridRows   = reactive([]);  // 트리 평면화 + 편집 상태 포함 행
    let   _tempId    = -1;            // 신규 행 임시 ID (음수)
    const EDIT_FIELDS = ['roleCode', 'roleNm', 'parentRoleId', 'roleTypeCd', 'sortOrd', 'useYn', 'restrictPerm', 'roleCat', 'roleRemark'];

    /* ===== 권한 색상 / 깊이 표시 상수 ===== */
    const PERM_COLORS   = { '없음': '#9ca3af', '읽기': '#2563eb', '쓰기': '#16a34a', '관리': '#f59e0b', '차단': '#e8587a' };
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* fnPermColor — 권한 레벨 색상 */
    const fnPermColor = (p) => PERM_COLORS[p] || '#9ca3af';

    /* depthBullet — 깊이별 글머리 */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* depthColor — 깊이별 색상 */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    // onMounted에서 API 로드
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syRole.getPage({ pageNo: 1, pageSize: 10000 }, '역할관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        roles.splice(0, roles.length, ...list);
        gridRows.splice(0);
        buildTreeRows(list).forEach(r => gridRows.push(makeRow(r)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null });

    /* openPathPick — 경로 선택 열기 */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* closePathPick — 경로 선택 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* onPathPicked — 이벤트 */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') { row._row_status = 'U'; }
      }
    };

    /* pathLabel — 경로 라벨 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* -- 좌측 표시경로 트리 -- */
        const expanded = reactive(new Set(['']));

    /* toggleNode — 노드 토글 */
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };

    /* selectNode — 노드 선택 */
    const selectNode = (path) => { uiState.selectedPath = path; handleSearchList(); };
    const cfTree = computed(() => {
      const t = boUtil.bofBuildRoleTree();
      const rolesById = Object.fromEntries((roles || []).map(r => [r.roleId, r]));
      const ROOT_MAP = { SUPER_ADMIN:['관리자','#7c3aed'], SITE_GROUP:['사이트','#2563eb'],
                          SITE_MGR_ROOT:['판매업체','#16a34a'], DLIV_ROOT:['배송업체','#f59e0b'] };
      const ROOT_BY_CAT = { ADMIN:'SUPER_ADMIN', SITE:'SITE_GROUP', SALES:'SITE_MGR_ROOT', DLIV:'DLIV_ROOT' };

      /* enrich — enrich */
      const enrich = (n) => {
        if (n._raw && n._raw.roleId != null) {
          let cur = n._raw;
          while (cur && cur.parentRoleId) { cur = rolesById[cur.parentRoleId]; }
          n._badge = cur ? ROOT_MAP[cur.roleCode] : null;
        }
        (n.children || []).forEach(enrich);
      };
      enrich(t);
      if (searchParam.treeCatFilter) {
        const wantRootCode = ROOT_BY_CAT[searchParam.treeCatFilter];
        t.children = (t.children || []).filter(ch => ch._raw && ch._raw.roleCode === wantRootCode);
        const recount = (n) => { n.count = (n.children || []).reduce((s, c) => s + recount(c) + 1, 0); return n.count; };
        recount(t);
      }
      return t;
    });
    /* 선택 권한 + 자손 roleId Set */
    const cfAllowedRoleIds = computed(() => {
      if (uiState.selectedPath == null) { return null; }
      return coUtil.cofCollectDescendantIds(roles, 'roleId', 'parentRoleId', uiState.selectedPath);
    });

    /* expandAll — 펼치기 전체 */
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };

    /* collapseAll — 접기 전체 */
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */

    /* fnLoadCodes — 공통코드 로드 */

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.role_status = codeStore.sgGetGrpCodes('ROLE_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      fnLoadMenusAndUsers();
      const initSet = coUtil.cofCollectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      handleSearchList('DEFAULT');
    });

    const cfSiteNm  = computed(() => boUtil.bofGetSiteNm());
    const ROLE_TYPES  = ['시스템', '업무', '기타'];
    const ROLE_CAT_COLOR = { ADMIN:'#7c3aed', SITE:'#2563eb', SALES:'#16a34a', DLIV:'#f59e0b' };
    /* 루트 역할코드 → 자동 카테고리 매핑 */
    const ROOT_CAT_MAP = { SUPER_ADMIN:'ADMIN', SITE_GROUP:'SITE', SITE_MGR_ROOT:'SALES', DLIV_ROOT:'DLIV' };

    /* deriveRoleCat — derive 권한 카테고리 */
    const deriveRoleCat = (role) => {
      const rolesData = roles || [];
      const m = Object.fromEntries(roles.map(x => [x.roleId, x]));
      let cur = role;
      while (cur && cur.parentRoleId) { cur = m[cur.parentRoleId]; }
      const code = cur && ROOT_CAT_MAP[cur.roleCode];
      return code ? [code] : [];
    };

    /* effectiveRoleCat — effective 권한 카테고리 */
    const effectiveRoleCat = (row) => (row.roleCat && row.roleCat.length) ? row.roleCat : deriveRoleCat(row);

    /* toggleRoleCat — 토글 */
    const toggleRoleCat = (row, code) => {
      const cur = effectiveRoleCat(row);
      row.roleCat = (cur.length === 1 && cur[0] === code) ? [] : [code];
      onCellChange(row);
    };
    boUtil.__roleCatOf = (roleId) => {
      const rolesData = roles || [];
      const r = roles.find(x => x.roleId === roleId);
      if (!r) { return []; }
      if (r.roleCat && r.roleCat.length) { return r.roleCat; }
      const m = Object.fromEntries(roles.map(x => [x.roleId, x]));
      let cur = r; while (cur && cur.parentRoleId) cur = m[cur.parentRoleId];
      const code = cur && ROOT_CAT_MAP[cur.roleCode];
      return code ? [code] : [];
    };
    boUtil.__roleCatLabel = (code) => (codes.role_cats.find(x=>x[0]===code) || [,code])[1];
    boUtil.__roleCatColor = (code) => ROLE_CAT_COLOR[code] || '#9ca3af';

    /* buildTreeRows — 빌드 */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(r => { map[r.roleId] = { ...r, _children: [] }; });
      const roots = [];
      items.forEach(r => {
        if (r.parentRoleId && map[r.parentRoleId]) { map[r.parentRoleId]._children.push(map[r.roleId]); }
        else { roots.push(map[r.roleId]); }
      });
      const result = [];

      /* traverse — traverse */
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    /* makeRow — 행 생성 */
    const makeRow = (r) => {
      const cat = Array.isArray(r.roleCat) ? [...r.roleCat] : [];

      return { ...r, _depth: r._depth || 0, _row_status: 'N', _row_check: false,
        restrictPerm: r.restrictPerm || '없음',
        roleCat: cat,
        _row_org: { roleCode: r.roleCode, roleNm: r.roleNm, parentRoleId: r.parentRoleId,
                 roleTypeCd: r.roleTypeCd, sortOrd: r.sortOrd, useYn: r.useYn,
                 restrictPerm: r.restrictPerm || '없음',
                 roleCat: JSON.stringify(cat), roleRemark: r.roleRemark },
      };
    };

    /* onSearch — 조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    /* fnLoadMenusAndUsers — 유틸 */
    const fnLoadMenusAndUsers = async () => {
      try {
        const [mRes, uRes] = await Promise.all([
          boApiSvc.syMenu.getPage({ pageNo: 1, pageSize: 10000 }, '역할관리', '메뉴목록'),
          boApiSvc.syUser.getPage({ pageNo: 1, pageSize: 10000 }, '역할관리', '사용자목록'),
        ]);
        const mList = mRes.data?.data?.pageList || mRes.data?.data?.list || [];
        const uList = uRes.data?.data?.pageList || uRes.data?.data?.list || [];
        menus.splice(0, menus.length, ...mList);
        boUsers.splice(0, boUsers.length, ...uList);
      } catch (err) {
        console.error('[fnLoadMenusAndUsers]', err);
      }
    };

    /* handleLoadRoleDetail — 처리 */
    const handleLoadRoleDetail = async (roleId) => {
      if (!roleId || roleId <= 0) { roleMenus.splice(0); roleUsers.splice(0); return; }
      uiState.detailLoading = true;
      try {
        const [rmRes, ruRes] = await Promise.all([
          boApiSvc.syRole.getMenus(roleId, '역할관리', '메뉴권한조회'),
          boApiSvc.syRole.getUsers(roleId, '역할관리', '대상사용자조회'),
        ]);
        const rmList = rmRes.data?.data?.list || rmRes.data?.data || [];
        const ruList = ruRes.data?.data?.list || ruRes.data?.data || [];
        roleMenus.splice(0, roleMenus.length, ...rmList);
        roleUsers.splice(0, roleUsers.length, ...ruList.map(u => ({ roleId, boUserId: u.userId || u.boUserId || u.userId })));
        // boUsers에 없는 사용자 보완
        ruList.forEach(u => {
          const uid = u.userId || u.boUserId;
          if (!boUsers.find(x => x.boUserId === uid || x.userId === uid)) { boUsers.push({ ...u, boUserId: uid }); }
        });
      } catch (err) {
        console.error('[handleLoadRoleDetail]', err);
      } finally {
        uiState.detailLoading = false;
      }
    };

    /* handleSaveRoleConfig — 저장 */
    const handleSaveRoleConfig = async () => {
      if (!uiState.selectedRoleId) { return; }
      const ok = await showConfirm('설정 저장', '메뉴 접근권한과 대상사용자를 저장하시겠습니까?');
      if (!ok) { return; }
      try {
        const menuPayload = roleMenus
          .filter(x => x.roleId === uiState.selectedRoleId)
          .map(x => ({ menuId: x.menuId, permLevel: x.permLevel || '읽기' }));
        const userPayload = roleUsers
          .filter(x => x.roleId === uiState.selectedRoleId)
          .map(x => ({ boUserId: x.boUserId }));
        await Promise.all([
          boApiSvc.syRole.saveMenus(uiState.selectedRoleId, { menus: menuPayload }, '역할관리', '메뉴권한저장'),
          boApiSvc.syRole.saveUsers(uiState.selectedRoleId, { users: userPayload }, '역할관리', '대상사용자저장'),
        ]);
        showToast('설정이 저장되었습니다.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* setFocused — 포커스 설정 */
    const setFocused = (realIdx) => {
      uiState.focusedIdx = realIdx;
      const row = gridRows[realIdx];
      const newRoleId = row && row.roleId > 0 ? row.roleId : null;
      if (newRoleId !== uiState.selectedRoleId) {
        uiState.selectedRoleId = newRoleId;
        handleLoadRoleDetail(newRoleId);
      }
    };

    /* cfShowRoleSetting — 파생값 */
    const cfShowRoleSetting = (row) => row.roleId > 0 && row._row_status !== 'D';

    /* onOpenSetting — 이벤트 */
    const onOpenSetting = (idx) => {
      setFocused(idx);
      Vue.nextTick(() => {
        const el = document.getElementById('role-config-panel');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => {
        if (f === 'roleCat') { return JSON.stringify(row.roleCat || []) !== (row._row_org.roleCat || '[]'); }
        return String(row[f]) !== String(row._row_org[f]);
      });
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        roleId: _tempId--, roleCode: '', roleNm: '', parentRoleId: ref ? ref.parentRoleId : null,
        roleTypeCd: ref ? ref.roleTypeCd : '업무',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', restrictPerm: '없음', roleCat: [], roleRemark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
      uiState.selectedRoleId = null;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0)); }
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.roleId));
      if (!checkedIds.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.roleId)) { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_status !== 'N') {
          if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
          row._row_status = 'N';
        }
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) { continue; }
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.roleCode || !r.roleNm) { showToast('역할코드와 역할명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syRole.saveList(saveRows, '역할관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* parentNm — 상위 Nm */
    const parentNm = (parentRoleId) => {
      if (!parentRoleId) { return ''; }
      const p = roles.find(r => r.roleId === parentRoleId);
      return p ? p.roleNm : `ID:${parentRoleId}`;
    };

    const roleTreeModal = reactive({ show: false, targetRow: null });

    /* openParentModal — 열기 */
    const openParentModal = async (row) => { roleTreeModal.targetRow = row; await handleSearchList('DEFAULT'); roleTreeModal.show = true; };

    /* onParentSelect — 이벤트 */
    const onParentSelect  = (role) => {
      if (roleTreeModal.targetRow) { roleTreeModal.targetRow.parentRoleId = role.roleId; roleTreeModal.targetRow._depth = 0; onCellChange(roleTreeModal.targetRow); }
      roleTreeModal.show = false;
    };

    /* -- 하단: 메뉴 배분 -- */
        const buildMenuTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentMenuId || null) === (parentId || null) && m.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: buildMenuTree(items, m.menuId, depth + 1) }));
    };

    /* flatMenuTree — 평탄 메뉴 트리 */
    const flatMenuTree = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatMenuTree(n._kids, result); });
      return result;
    };
    const cfMenuTree = computed(() => {
      const searchVal = (uiState.menuSearchValue || '').trim().toLowerCase();
      const all = menus || [];
      const list = searchVal ? all.filter(m => m.menuNm.toLowerCase().includes(searchVal) || m.menuCode.toLowerCase().includes(searchVal)) : all;
      return flatMenuTree(buildMenuTree(list, null, 0));
    });

    const cfRoleMenuIds = computed(() => {
      if (!uiState.selectedRoleId) { return new Set(); }
      return new Set(roleMenus.filter(x => x.roleId === uiState.selectedRoleId).map(x => x.menuId));
    });

    /* getMenuPerm — 조회 */
    const getMenuPerm = (menuId) => {
      if (!uiState.selectedRoleId) { return '없음'; }
      const entry = roleMenus.find(x => x.roleId === uiState.selectedRoleId && x.menuId === menuId);
      return entry ? (entry.permLevel || '읽기') : '없음';
    };

    /* setMenuPerm — 설정 */
    const setMenuPerm = (menuId, level) => {
      if (!uiState.selectedRoleId) { return; }
      const idx = roleMenus.findIndex(x => x.roleId === uiState.selectedRoleId && x.menuId === menuId);
      if (level === '없음') {
        if (idx !== -1) { roleMenus.splice(idx, 1); }
      } else {
        if (idx !== -1) { roleMenus[idx].permLevel = level; }
        else { roleMenus.push({ roleId: uiState.selectedRoleId, menuId, permLevel: level }); }
      }
    };

    /* setAllMenuPerm — 설정 */
    const setAllMenuPerm = (level) => {
      if (!uiState.selectedRoleId) { return; }
      if (level === '없음') {
        const idxs = roleMenus.map((x,i)=>x.roleId===uiState.selectedRoleId?i:-1).filter(i=>i>=0).reverse(); idxs.forEach(i=>roleMenus.splice(i,1));
      } else {
        cfMenuTree.value.forEach(m => {
          const idx = roleMenus.findIndex(x => x.roleId === uiState.selectedRoleId && x.menuId === m.menuId);
          if (idx !== -1) { roleMenus[idx].permLevel = level; }
          else { roleMenus.push({ roleId: uiState.selectedRoleId, menuId: m.menuId, permLevel: level }); }
        });
      }
    };

    /* isMenuChecked — 여부 확인 */
    const isMenuChecked = (menuId) => getMenuPerm(menuId) !== '없음';

    /* toggleAllMenus — 전체 토글 */
    const toggleAllMenus = (check) => { setAllMenuPerm(check ? '읽기' : '없음'); };
    const cfMenuAllChecked = computed(() => {
      if (!uiState.selectedRoleId || !cfMenuTree.value.length) { return false; }
      return cfMenuTree.value.every(m => getMenuPerm(m.menuId) !== '없음');
    });

    /* -- 하단: 대상사용자 (모달 선택) -- */
    const cfRoleUsersList = computed(() => {
      if (!uiState.selectedRoleId) { return []; }
      return roleUsers
        .filter(x => x.roleId === uiState.selectedRoleId)
        .map(x => boUsers.find(u => u.boUserId === x.boUserId))
        .filter(Boolean);
    });

    /* onUserSelect — 이벤트 */
    const onUserSelect = (users) => {
      if (!uiState.selectedRoleId) { return; }
      users.forEach(u => {
        const already = roleUsers.some(x => x.roleId === uiState.selectedRoleId && x.boUserId === u.boUserId);
        if (!already) { roleUsers.push({ roleId: uiState.selectedRoleId, boUserId: u.boUserId }); }
      });
      uiState.userSelectOpen = false;
    };

    /* removeUser — 제거 */
    const removeUser = (boUserId) => {
      if (!uiState.selectedRoleId) { return; }
      const idx = roleUsers.findIndex(x => x.roleId === uiState.selectedRoleId && x.boUserId === boUserId);
      if (idx !== -1) { roleUsers.splice(idx, 1); }
    };

    const cfSelectedRoleNm = computed(() => {
      if (!uiState.selectedRoleId) { return ''; }
      const r = roles.find(x => x.roleId === uiState.selectedRoleId);
      return r ? r.roleNm : '';
    });

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'roleId'},{label:'역할코드',key:'roleCode'},{label:'역할명',key:'roleNm'},{label:'상위ID',key:'parentRoleId'},{label:'유형',key:'roleTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'제한',key:'restrictPerm'},{label:'비고',key:'roleRemark'}],
      '역할목록.csv'
    );

    /* onTreeCatChange — 이벤트 */
    const onTreeCatChange = () => { handleSearchList(); };

    /* BoGridCrud 컬럼 정의 (특수셀은 cell/head 슬롯으로 override) */

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'roleCode', label: '역할코드' },
          { value: 'roleNm',   label: '역할명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'cat', type: 'select', label: '역할구분', options: () => codes.role_cats, nullLabel: '역할구분 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    // 기본 그리드
    const baseGridColumns = [
      { key: 'roleCode',     label: '역할코드', style: 'width:120px;',    edit: 'text', mono: true },
      { key: 'roleNm',       label: '역할명',   style: 'min-width:150px;', edit: 'text',
        treeDepth: true, treeBullet: depthBullet, treeColor: depthColor },
      { key: 'parentRoleId', label: '상위역할', style: 'min-width:120px;',
        parentPick: { label: parentNm, open: (row) => handleSelectAction('parentModal-open', row), title: '상위역할 선택' } },
      { key: 'sortOrd',      label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',        label: '사용여부', cls: 'col-use',  edit: 'select', options: codes.use_yn },
      { key: 'roleCat',      label: '역할구분', style: 'width:100px;',
        cellStyle: (v, row) => {
          const cat = effectiveRoleCat(row)[0];
          return `color:${ROLE_CAT_COLOR[cat] || '#9ca3af'};font-weight:${effectiveRoleCat(row).length ? 700 : 400};`;
        },
        selectIntercept: {
          value: (row) => effectiveRoleCat(row)[0] || '',
          options: () => codes.role_cats.map(c => ({ value: c[0], label: c[1] })),
          nullable: true, nullLabel: '-',
          disabled: (row) => row._row_status === 'D',
          onChange: (row, newVal) => {
            row.roleCat = newVal ? [newVal] : [];
            onCellChange(row);
          },
        } },
      { key: 'roleRemark',   label: '비고',     edit: 'text' },
      { key: 'siteNm',       label: '사이트명', style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, searchParam, gridRows, expanded,                                                       // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                                                    // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                   // dispatch (모든 이벤트 / 액션 라우팅)
      cfTree, cfShowRoleSetting, cfSelectedRoleNm, cfMenuTree, cfMenuAllChecked, cfRoleUsersList,            // computed
      fnPermColor, getMenuPerm, isMenuChecked,                                                               // 헬퍼
      pathPickModal, roleTreeModal,                                                                          // 모달 상태
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    역할관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div style="display:grid;grid-template-columns:minmax(220px,20fr) minmax(0,80fr);gap:16px;align-items:flex-start;">
    <bo-local-tree-card title="역할"
      :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath"
      :on-toggle="path => handleBtnAction('pathTree-toggle', path)"
      @select="path => handleSelectAction('pathTree-select', path)" @expand-all="handleBtnAction('pathTree-expand-all')" @collapse-all="handleBtnAction('pathTree-collapse-all')">
      <template #filter>
        <select v-model="searchParam.treeCatFilter" @change="handleBtnAction('pathTree-cat-change')" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid #d1d5db;border-radius:5px;margin-bottom:8px;">
          <option value="">
            역할구분 전체
          </option>
          <option v-for="c in codes.role_cats" :key="c[0]" :value="c[0]">
            {{ c[1] }}
          </option>
        </select>
      </template>
    </bo-local-tree-card>
    <div>
      <!-- ===== ■.■.■. CRUD 그리드 ============================================ -->
      <bo-grid-crud
        :columns="baseGridColumns" :rows="gridRows" row-key="roleId"
        list-title="역할목록" :show-export="true" :draggable="false"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="handleBtnAction('roles-add')" @save="handleBtnAction('roles-save')"
        @delete-checked="handleBtnAction('roles-delete-checked')" @cancel-checked="handleBtnAction('roles-cancel-checked')"
        @cell-change="row => handleSelectAction('roles-row-cell-change', row)" @export="handleBtnAction('roles-excel')">
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('roles-row-cancel', idx)" @delete="handleSelectAction('roles-row-delete', idx)">
          </bo-row-cancel-delete>
          <button v-if="cfShowRoleSetting(row)"
            class="btn btn-blue btn-xs"
            :style="{ fontWeight: uiState.selectedRoleId === row.roleId ? '700' : '400',
            outline: uiState.selectedRoleId === row.roleId ? '2px solid #2563eb' : 'none' }"
            @click.stop="handleSelectAction('roles-row-open-setting', idx)"
            title="하단 메뉴접근권한 / 대상사용자 설정">
            설정
          </button>
        </template>
      </bo-grid-crud>
      <!-- ===== ■.■.■. 하단: 메뉴 배분 + 사용자 배분 ================================== -->
      <div id="role-config-panel" style="display:flex;gap:16px;align-items:flex-start;">
        <!-- ===== ■.■.■.■. 좌: 메뉴목록 =========================================== -->
        <div style="flex:1;">
          <div class="card" style="margin-bottom:0;">
            <div class="toolbar" style="flex-wrap:wrap;gap:6px;">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <b style="font-size:13px;">
                  메뉴 접근권한
                </b>
                <span v-if="cfSelectedRoleNm" style="font-size:12px;color:#e8587a;">
                  — {{ cfSelectedRoleNm }}
                </span>
                <span v-else style="font-size:12px;color:#bbb;">
                  위 목록에서 역할의 [설정] 버튼을 클릭하세요
                </span>
              </div>
              <div v-if="uiState.selectedRoleId" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                <label style="font-size:12px;color:#555;cursor:pointer;display:flex;align-items:center;gap:4px;margin-right:4px;white-space:nowrap;">
                  <input type="checkbox" :checked="cfMenuAllChecked" @change="e => handleBtnAction('roleMenus-toggle-all', e.target.checked)" />
                  전체선택
                </label>
                <button v-for="p in codes.perm_levels" :key="p"
                  class="btn btn-xs"
                  :style="{ background: fnPermColor(p), borderColor: fnPermColor(p), color:'#fff', fontWeight:'600', fontSize:'11px', padding:'2px 8px' }"
                  @click="handleBtnAction('roleMenus-set-all', p)">
                  {{ p }}
                </button>
                <button class="btn btn-primary btn-sm" style="margin-left:8px;" @click="handleBtnAction('config-save')">
                  💾 설정 저장
                </button>
              </div>
            </div>
            <!-- ===== ■.■.■.■.■.■. 메뉴 검색 ========================================= -->
            <div v-if="uiState.selectedRoleId" style="padding:8px 0 6px;">
              <input class="form-control" v-model="uiState.menuSearchValue" placeholder="메뉴명 또는 메뉴코드 검색"
                style="font-size:12px;padding:5px 10px;" />
            </div>
            <!-- ===== ■.■.■.■.■.■. 메뉴 트리 목록 ====================================== -->
            <div v-if="uiState.selectedRoleId" style="max-height:340px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px;">
              <div v-if="!cfMenuTree.length" style="text-align:center;color:#bbb;padding:20px;font-size:13px;">
                메뉴가 없습니다.
              </div>
              <div v-for="m in cfMenuTree" :key="m.menuId"
                style="display:flex;align-items:center;padding:6px 10px;border-bottom:1px solid #f8f8f8;transition:background .1s;"
                :style="{ background: isMenuChecked(m.menuId) ? '#fff8f9' : '' }">
                <!-- ===== ■.■.■.■.■.■.■.■. 블릿 트리 들여쓰기 ================================ -->
                <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'5px', fontWeight:'700',
                  fontSize: m._depth===0?'7px':'11px', flexShrink:0,
                  color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
                  {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
                </span>
                <span style="font-size:13px;color:#333;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  {{ m.menuNm }}
                </span>
                <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin:0 8px;flex-shrink:0;">
                  {{ m.menuCode }}
                </code>
                  <!-- ===== ■.■.■.■.■.■.■.■. 권한 레벨 토글 버튼 =============================== -->
                  <div style="display:flex;gap:2px;flex-shrink:0;">
                    <button v-for="p in codes.perm_levels" :key="p"
                    style="font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;transition:all .1s;"
                    :style="getMenuPerm(m.menuId)===p
                    ? { background: fnPermColor(p), borderColor: fnPermColor(p), color:'#fff' }
                    : { background:'#f5f5f5', borderColor:'#e0e0e0', color:'#999' }"
                    @click="handleSelectAction('roleMenus-set', { menuId: m.menuId, perm: p })">
                      {{ p }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
                위 목록에서 역할의 [설정] 버튼을 클릭하세요.
              </div>
            </div>
          </div>
          <!-- ===== ■.■.■.■. 우: 대상사용자 ========================================== -->
          <div style="flex:1;">
            <div class="card" style="margin-bottom:0;">
              <div class="toolbar">
                <div>
                  <b style="font-size:13px;">
                    대상사용자
                  </b>
                  <span v-if="cfSelectedRoleNm" style="font-size:12px;color:#e8587a;margin-left:8px;">
                    — {{ cfSelectedRoleNm }}
                  </span>
                  <span v-else style="font-size:12px;color:#bbb;margin-left:8px;">
                    위 목록에서 역할의 [설정] 버튼을 클릭하세요
                  </span>
                </div>
                <button v-if="uiState.selectedRoleId" class="btn btn-primary btn-sm"
                @click="handleBtnAction('roleUsers-open-select')">
                  + 사용자 추가
                </button>
              </div>
              <!-- ===== ■.■.■.■.■.■. 선택된 사용자 목록 ==================================== -->
              <div v-if="uiState.selectedRoleId">
                <div v-if="!cfRoleUsersList.length"
                style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;border:1px dashed #e0e0e0;border-radius:6px;">
                  추가된 사용자가 없습니다.
                  <br>
                  <span style="font-size:12px;">
                    [사용자 추가] 버튼으로 추가하세요.
                  </span>
                </div>
                <div v-else style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">
                  <div v-for="u in cfRoleUsersList" :key="u.boUserId"
                  style="display:flex;align-items:center;padding:9px 14px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;"
                  @mouseenter="$event.currentTarget.style.background='#fff0f4'"
                  @mouseleave="$event.currentTarget.style.background='#fafafa'">
                    <div style="width:32px;height:32px;border-radius:50%;background:#e8587a22;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px;">
                      <span style="font-size:13px;font-weight:700;color:#e8587a;">
                        {{ u.name.charAt(0) }}
                      </span>
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;font-weight:600;color:#222;">
                        {{ u.name }}
                      </div>
                      <div style="font-size:11px;color:#888;margin-top:1px;">
                        {{ u.loginId }} · {{ u.dept || '-' }} · {{ u.role }}
                      </div>
                    </div>
                    <span class="badge" :class="u.status==='활성'?'badge-green':'badge-gray'" style="font-size:10px;margin-right:8px;">
                      {{ u.status }}
                    </span>
                    <button class="btn btn-danger btn-xs" @click="handleSelectAction('roleUsers-remove', u.boUserId)" title="제거">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
                위 목록에서 역할을 선택하세요.
              </div>
            </div>
          </div>
        </div>
        <!-- ===== ■.■.■. 사용자 선택 모달 =========================================== -->
        <bo-user-select-modal v-if="uiState.userSelectOpen" @select="users => handleSelectAction('roleUsers-select', users)"
        @close="handleBtnAction('roleUsers-close-select')" />
        <!-- ===== ■.■.■. 상위역할 선택 모달 ========================================== -->
        <role-tree-modal v-if="roleTreeModal && roleTreeModal.show" :exclude-id="roleTreeModal.targetRow && roleTreeModal.targetRow.roleId > 0 ? roleTreeModal.targetRow.roleId : null" @select="role => handleSelectAction('parentModal-select', role)" @close="handleBtnAction('parentModal-close')" />
      </div>
    </div>
    <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
    <!-- ===== ■. 조건부 영역 ================================================== -->
    <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_role" :value="pathPickModal.row ? pathPickModal.row.pathId : null" @select="pathId => handleSelectAction('pathModal-pick', pathId)" @close="handleBtnAction('pathModal-close')" />
  </div>
  <!-- ===== □. 조건부 영역 ================================================== -->
`,
};

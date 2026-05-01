/* ShopJoy Admin - 역할관리 (Tree CRUD 그리드 + 하단 메뉴/사용자 배분) */
window.SyRoleMng = {
  name: 'SyRoleMng',
  props: ['navigate', 'showToast', 'showConfirm'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const roles = reactive([]);
    const menus = reactive([]);
    const roleMenus = reactive([]);
    const roleUsers = reactive([]);
    const boUsers = reactive([]);

    /* ===== UI State ===== */
    const uiState = reactive({
      checkAll: false,
      error: null,
      userSelectOpen: false,
      isPageCodeLoad: false, loading: false, selectedPath: null, focusedIdx: null, selectedRoleId: null, menuSearchKw: ''});
    const codes = reactive({ role_status: [], use_yn: [], perm_levels: ['없음','읽기','쓰기','관리','차단'], role_cats: [['ADMIN','관리자역할'],['SITE','사이트역할'],['SALES','판매업체역할'],['DLIV','배송업체역할']] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApi.get('/bo/sy/role/page', {
          params: { pageNo: 1, pageSize: 10000 },
          ...coUtil.apiHdr('역할관리', '목록조회')
        });
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
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));


    /* ── 좌측 표시경로 트리 ── */
        const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { uiState.selectedPath = path; };
    const cfTree = computed(() => {
      const t = boUtil.buildRoleTree();
      const rolesById = Object.fromEntries((roles || []).map(r => [r.roleId, r]));
      const ROOT_MAP = { SUPER_ADMIN:['관리자','#7c3aed'], SITE_GROUP:['사이트','#2563eb'],
                          SITE_MGR_ROOT:['판매업체','#16a34a'], DLIV_ROOT:['배송업체','#f59e0b'] };
      const ROOT_BY_CAT = { ADMIN:'SUPER_ADMIN', SITE:'SITE_GROUP', SALES:'SITE_MGR_ROOT', DLIV:'DLIV_ROOT' };
      const enrich = (n) => {
        if (n._raw && n._raw.roleId != null) {
          let cur = n._raw;
          while (cur && cur.parentId) cur = rolesById[cur.parentId];
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
      if (uiState.selectedPath == null) return null;
      return boUtil.collectDescendantIds(roles, 'roleId', 'parentId', uiState.selectedPath);
    });
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      fnLoadMenusAndUsers();
      const initSet = boUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
      Object.assign(searchParamOrg, searchParam);
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.role_status = codeStore.snGetGrpCodes('ROLE_STATUS') || [];
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    const cfSiteNm  = computed(() => boUtil.getSiteNm());
    const ROLE_TYPES  = ['시스템', '업무', '기타'];
    const ROLE_CAT_COLOR = { ADMIN:'#7c3aed', SITE:'#2563eb', SALES:'#16a34a', DLIV:'#f59e0b' };
    /* 루트 역할코드 → 자동 카테고리 매핑 */
    const ROOT_CAT_MAP = { SUPER_ADMIN:'ADMIN', SITE_GROUP:'SITE', SITE_MGR_ROOT:'SALES', DLIV_ROOT:'DLIV' };
    const deriveRoleCat = (role) => {
      const rolesData = roles || [];
      const m = Object.fromEntries(roles.map(x => [x.roleId, x]));
      let cur = role;
      while (cur && cur.parentId) cur = m[cur.parentId];
      const code = cur && ROOT_CAT_MAP[cur.roleCode];
      return code ? [code] : [];
    };
    const effectiveRoleCat = (row) => (row.roleCat && row.roleCat.length) ? row.roleCat : deriveRoleCat(row);
    const toggleRoleCat = (row, code) => {
      const cur = effectiveRoleCat(row);
      row.roleCat = (cur.length === 1 && cur[0] === code) ? [] : [code];
      onCellChange(row);
    };
    boUtil.__roleCatOf = (roleId) => {
      const rolesData = roles || [];
      const r = roles.find(x => x.roleId === roleId);
      if (!r) return [];
      if (r.roleCat && r.roleCat.length) return r.roleCat;
      const m = Object.fromEntries(roles.map(x => [x.roleId, x]));
      let cur = r; while (cur && cur.parentId) cur = m[cur.parentId];
      const code = cur && ROOT_CAT_MAP[cur.roleCode];
      return code ? [code] : [];
    };
    boUtil.__roleCatLabel = (code) => (codes.role_cats.find(x=>x[0]===code) || [,code])[1];
    boUtil.__roleCatColor = (code) => ROLE_CAT_COLOR[code] || '#9ca3af';
    const PERM_COLORS = { '없음': '#9ca3af', '읽기': '#2563eb', '쓰기': '#16a34a', '관리': '#f59e0b', '차단': '#e8587a' };
    const fnPermColor   = (p) => PERM_COLORS[p] || '#9ca3af';
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* ── 검색 ── */
    const searchParam = reactive({
      kw: '',
      type: '',
      useYn: '',
      cat: '',
      treeCatFilter: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      type: '',
      useYn: '',
      cat: '',
      treeCatFilter: ''
    });

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
        

    const EDIT_FIELDS = ['roleCode', 'roleNm', 'parentId', 'roleType', 'sortOrd', 'useYn', 'restrictPerm', 'roleCat', 'remark'];

    /* ── 트리 정렬 ── */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(r => { map[r.roleId] = { ...r, _children: [] }; });
      const roots = [];
      items.forEach(r => {
        if (r.parentId && map[r.parentId]) map[r.parentId]._children.push(map[r.roleId]);
        else roots.push(map[r.roleId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = (r) => {
      const cat = Array.isArray(r.roleCat) ? [...r.roleCat] : [];

    // ── return ───────────────────────────────────────────────────────────────

      return { ...r, _depth: r._depth || 0, _row_status: 'N', _row_check: false,
        restrictPerm: r.restrictPerm || '없음',
        roleCat: cat,
        _orig: { roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId,
                 roleType: r.roleType, sortOrd: r.sortOrd, useYn: r.useYn,
                 restrictPerm: r.restrictPerm || '없음',
                 roleCat: JSON.stringify(cat), remark: r.remark },
      };
    };


    const cfTotal = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      handleSearchList();
    };

    /* ── 메뉴·사용자 초기 로드 ── */
    const fnLoadMenusAndUsers = async () => {
      try {
        const [mRes, uRes] = await Promise.all([
          boApi.get('/bo/sy/menu/page', { params: { pageNo: 1, pageSize: 10000 }, ...coUtil.apiHdr('역할관리', '메뉴목록') }),
          boApi.get('/bo/sy/user/page',  { params: { pageNo: 1, pageSize: 10000 }, ...coUtil.apiHdr('역할관리', '사용자목록') }),
        ]);
        const mList = mRes.data?.data?.pageList || mRes.data?.data?.list || [];
        const uList = uRes.data?.data?.pageList || uRes.data?.data?.list || [];
        menus.splice(0, menus.length, ...mList);
        boUsers.splice(0, boUsers.length, ...uList);
      } catch (err) {
        console.error('[fnLoadMenusAndUsers]', err);
      }
    };

    /* ── 역할 선택 시 메뉴권한·사용자 조회 ── */
    const handleLoadRoleDetail = async (roleId) => {
      if (!roleId || roleId <= 0) { roleMenus.splice(0); roleUsers.splice(0); return; }
      uiState.detailLoading = true;
      try {
        const [rmRes, ruRes] = await Promise.all([
          boApi.get(`/bo/sy/role/${roleId}/menus`,  coUtil.apiHdr('역할관리', '메뉴권한조회')),
          boApi.get(`/bo/sy/role/${roleId}/users`,  coUtil.apiHdr('역할관리', '대상사용자조회')),
        ]);
        const rmList = rmRes.data?.data?.list || rmRes.data?.data || [];
        const ruList = ruRes.data?.data?.list || ruRes.data?.data || [];
        roleMenus.splice(0, roleMenus.length, ...rmList);
        roleUsers.splice(0, roleUsers.length, ...ruList.map(u => ({ roleId, boUserId: u.userId || u.boUserId || u.userId })));
        // boUsers에 없는 사용자 보완
        ruList.forEach(u => {
          const uid = u.userId || u.boUserId;
          if (!boUsers.find(x => x.boUserId === uid || x.userId === uid)) boUsers.push({ ...u, boUserId: uid });
        });
      } catch (err) {
        console.error('[handleLoadRoleDetail]', err);
      } finally {
        uiState.detailLoading = false;
      }
    };

    /* ── 메뉴권한·대상사용자 설정 저장 ── */
    const handleSaveRoleConfig = async () => {
      if (!uiState.selectedRoleId) return;
      const ok = await props.showConfirm('설정 저장', '메뉴 접근권한과 대상사용자를 저장하시겠습니까?');
      if (!ok) return;
      try {
        const menuPayload = roleMenus
          .filter(x => x.roleId === uiState.selectedRoleId)
          .map(x => ({ menuId: x.menuId, permLevel: x.permLevel || '읽기' }));
        const userPayload = roleUsers
          .filter(x => x.roleId === uiState.selectedRoleId)
          .map(x => ({ boUserId: x.boUserId }));
        await Promise.all([
          boApi.post(`/bo/sy/role/${uiState.selectedRoleId}/menus`, { menus: menuPayload }, coUtil.apiHdr('역할관리', '메뉴권한저장')),
          boApi.post(`/bo/sy/role/${uiState.selectedRoleId}/users`, { users: userPayload }, coUtil.apiHdr('역할관리', '대상사용자저장')),
        ]);
        props.showToast('설정이 저장되었습니다.', 'success');
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    const setFocused = (realIdx) => {
      uiState.focusedIdx = realIdx;
      const row = gridRows[realIdx];
      const newRoleId = row && row.roleId > 0 ? row.roleId : null;
      if (newRoleId !== uiState.selectedRoleId) {
        uiState.selectedRoleId = newRoleId;
        handleLoadRoleDetail(newRoleId);
      }
    };

    const onOpenSetting = (idx) => {
      setFocused(idx);
      Vue.nextTick(() => {
        const el = document.getElementById('role-config-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => {
        if (f === 'roleCat') return JSON.stringify(row.roleCat || []) !== (row._orig.roleCat || '[]');
        return String(row[f]) !== String(row._orig[f]);
      });
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        roleId: _tempId--, roleCode: '', roleNm: '', parentId: ref ? ref.parentId : null,
        roleType: ref ? ref.roleType : '업무',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', restrictPerm: '없음', roleCat: [], remark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
      uiState.selectedRoleId = null;
    };

    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else {
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.roleId));
      if (!checkedIds.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.roleId)) continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_status !== 'N') {
          if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
          row._row_status = 'N';
        }
      }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.roleCode || !r.roleNm) { props.showToast('역할코드와 역할명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      dRows.forEach(r => {
        const i = roles.findIndex(x => x.roleId === r.roleId);
        if (i !== -1) roles.splice(i, 1);
        const rmIdxs = roleMenus.map((x,i)=>x.roleId===r.roleId?i:-1).filter(i=>i>=0).reverse(); rmIdxs.forEach(i=>roleMenus.splice(i,1));
        const ruIdxs = roleUsers.map((x,i)=>x.roleId===r.roleId?i:-1).filter(i=>i>=0).reverse(); ruIdxs.forEach(i=>roleUsers.splice(i,1));
      });
      uRows.forEach(r => { const i = roles.findIndex(x => x.roleId === r.roleId); if (i !== -1) Object.assign(roles[i], { roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId || null, roleType: r.roleType, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, restrictPerm: r.restrictPerm || '없음', roleCat: [...(r.roleCat || [])], remark: r.remark }); });
      let nextId = Math.max(...roles.map(r => r.roleId), 0);
      iRows.forEach(r => { roles.push({ roleId: ++nextId, roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId || null, roleType: r.roleType, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, restrictPerm: r.restrictPerm || '없음', roleCat: [...(r.roleCat || [])], remark: r.remark, regDate: new Date().toISOString().slice(0, 10) }); });
      const parts = [];
      if (iRows.length) parts.push(`등록 ${iRows.length}건`);
      if (uRows.length) parts.push(`수정 ${uRows.length}건`);
      if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${parts.join(', ')} 저장되었습니다.`);
      handleSearchList();
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = roles.find(r => r.roleId === parentId);
      return p ? p.roleNm : `ID:${parentId}`;
    };

    const roleTreeModal = reactive({ show: false, targetRow: null });
    const openParentModal = async (row) => { roleTreeModal.targetRow = row; await handleSearchList('DEFAULT'); roleTreeModal.show = true; };
    const onParentSelect  = (role) => {
      if (roleTreeModal.targetRow) { roleTreeModal.targetRow.parentId = role.roleId; roleTreeModal.targetRow._depth = 0; onCellChange(roleTreeModal.targetRow); }
      roleTreeModal.show = false;
    };

    /* ── 하단: 메뉴 배분 ── */
        const buildMenuTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentId || null) === (parentId || null) && m.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: buildMenuTree(items, m.menuId, depth + 1) }));
    };
    const flatMenuTree = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatMenuTree(n._kids, result); });
      return result;
    };
    const cfMenuTree = computed(() => {
      const kw = (uiState.menuSearchKw || '').trim().toLowerCase();
      const all = menus || [];
      const list = kw ? all.filter(m => m.menuNm.toLowerCase().includes(kw) || m.menuCode.toLowerCase().includes(kw)) : all;
      return flatMenuTree(buildMenuTree(list, null, 0));
    });

    const cfRoleMenuIds = computed(() => {
      if (!uiState.selectedRoleId) return new Set();
      return new Set(roleMenus.filter(x => x.roleId === uiState.selectedRoleId).map(x => x.menuId));
    });

    const getMenuPerm = (menuId) => {
      if (!uiState.selectedRoleId) return '없음';
      const entry = roleMenus.find(x => x.roleId === uiState.selectedRoleId && x.menuId === menuId);
      return entry ? (entry.permLevel || '읽기') : '없음';
    };
    const setMenuPerm = (menuId, level) => {
      if (!uiState.selectedRoleId) return;
      const idx = roleMenus.findIndex(x => x.roleId === uiState.selectedRoleId && x.menuId === menuId);
      if (level === '없음') {
        if (idx !== -1) roleMenus.splice(idx, 1);
      } else {
        if (idx !== -1) roleMenus[idx].permLevel = level;
        else roleMenus.push({ roleId: uiState.selectedRoleId, menuId, permLevel: level });
      }
    };
    const setAllMenuPerm = (level) => {
      if (!uiState.selectedRoleId) return;
      if (level === '없음') {
        const idxs = roleMenus.map((x,i)=>x.roleId===uiState.selectedRoleId?i:-1).filter(i=>i>=0).reverse(); idxs.forEach(i=>roleMenus.splice(i,1));
      } else {
        cfMenuTree.value.forEach(m => {
          const idx = roleMenus.findIndex(x => x.roleId === uiState.selectedRoleId && x.menuId === m.menuId);
          if (idx !== -1) roleMenus[idx].permLevel = level;
          else roleMenus.push({ roleId: uiState.selectedRoleId, menuId: m.menuId, permLevel: level });
        });
      }
    };
    const isMenuChecked = (menuId) => getMenuPerm(menuId) !== '없음';
    const toggleAllMenus = (check) => { setAllMenuPerm(check ? '읽기' : '없음'); };
    const cfMenuAllChecked = computed(() => {
      if (!uiState.selectedRoleId || !cfMenuTree.value.length) return false;
      return cfMenuTree.value.every(m => getMenuPerm(m.menuId) !== '없음');
    });

    /* ── 하단: 대상사용자 (모달 선택) ── */
    const cfRoleUsersList = computed(() => {
      if (!uiState.selectedRoleId) return [];
      return roleUsers
        .filter(x => x.roleId === uiState.selectedRoleId)
        .map(x => boUsers.find(u => u.boUserId === x.boUserId))
        .filter(Boolean);
    });

    const onUserSelect = (users) => {
      if (!uiState.selectedRoleId) return;
      users.forEach(u => {
        const already = roleUsers.some(x => x.roleId === uiState.selectedRoleId && x.boUserId === u.boUserId);
        if (!already) roleUsers.push({ roleId: uiState.selectedRoleId, boUserId: u.boUserId });
      });
      uiState.userSelectOpen = false;
    };

    const removeUser = (boUserId) => {
      if (!uiState.selectedRoleId) return;
      const idx = roleUsers.findIndex(x => x.roleId === uiState.selectedRoleId && x.boUserId === boUserId);
      if (idx !== -1) roleUsers.splice(idx, 1);
    };

    const cfSelectedRoleNm = computed(() => {
      if (!uiState.selectedRoleId) return '';
      const r = roles.find(x => x.roleId === uiState.selectedRoleId);
      return r ? r.roleNm : '';
    });

    const exportExcel = () => boUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'roleId'},{label:'역할코드',key:'roleCode'},{label:'역할명',key:'roleNm'},{label:'상위ID',key:'parentId'},{label:'유형',key:'roleType'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'제한',key:'restrictPerm'},{label:'비고',key:'remark'}],
      '역할목록.csv'
    );
    /* 트리 path 변경 시 자동 fetch */

    watch(() => uiState.selectedPath, () => { handleSearchList(); });

    watch(() => searchParam.treeCatFilter, () => { handleSearchList(); });


    // ── return ───────────────────────────────────────────────────────────────

    return {
      uiState, codes,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      cfSiteNm, ROLE_TYPES, ROLE_CAT_COLOR, effectiveRoleCat, toggleRoleCat, fnPermColor, depthBullet, depthColor, fnStatusClass,
      searchParam, searchParamOrg, onSearch, onReset,
      gridRows, cfTotal,
      setFocused, onOpenSetting, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      toggleCheckAll, parentNm,
      roleTreeModal, openParentModal, onParentSelect,
      cfSelectedRoleNm,
      cfMenuTree, getMenuPerm, setMenuPerm, setAllMenuPerm, isMenuChecked, toggleAllMenus, cfMenuAllChecked,
      cfRoleUsersList, onUserSelect, removeUser,
      handleSaveRoleConfig,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">역할관리</div>  <!-- ── 검색 ───────────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="역할코드 / 역할명 검색" />
      <select v-model="searchParam.cat">
        <option value="">역할구분 전체</option>
        <option v-for="c in codes.role_cats" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  




  <!-- ── 좌 트리 + 우 영역 ──────────────────────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:20fr 80fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 역할</span></div>
      <select v-model="searchParam.treeCatFilter" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid #d1d5db;border-radius:5px;margin-bottom:8px;">
        <option value="">역할구분 전체</option>
        <option v-for="c in codes.role_cats" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
      </select>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
<!-- ── CRUD 그리드 ───────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>역할목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
      </div>
    </div>

    <div style="max-height:480px;overflow-y:auto;">
    <table class="bo-table crud-grid">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
          <th style="width:120px;">역할코드</th>
          <th style="min-width:150px;">역할명</th>
          <th style="min-width:120px;">상위역할</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th style="width:100px;">역할구분</th>
          <th>비고</th>
          <th style="width:80px;">사이트명</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-setting" style="width:48px;"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="15" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in gridRows" :key="row.roleId"
          class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===idx ? 'focused' : '']"
          @click="setFocused(idx)">
          <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td class="col-id-val">{{ row.roleId > 0 ? row.roleId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input grid-mono" v-model="row.roleCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>

          <!-- ── 역할명 (블릿 트리) ──────────────────────────────────────────── -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0?'7px':'12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.roleNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- ── 상위역할 ─────────────────────────────────────────────────── -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentId)">{{ parentNm(row.parentId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위역할 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
            </select>
          </td>
          <td style="padding:3px 6px;">
            <select class="grid-select" :value="(effectiveRoleCat(row)[0] || '')" :disabled="row._row_status==='D'"
              @change="$event.target.value ? (row.roleCat=[$event.target.value], onCellChange(row)) : (row.roleCat=[], onCellChange(row))"
              :style="{color: ROLE_CAT_COLOR[effectiveRoleCat(row)[0]] || '#9ca3af', fontWeight: effectiveRoleCat(row).length ? 700 : 400}">
              <option value="">-</option>
              <option v-for="c in codes.role_cats" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
          </td>
          <td style="text-align:center;">
            <button v-if="row.roleId > 0 && row._row_status !== 'D'"
              class="btn btn-blue btn-xs"
              :style="{ fontWeight: uiState.selectedRoleId === row.roleId ? '700' : '400',
                        outline: uiState.selectedRoleId === row.roleId ? '2px solid #2563eb' : 'none' }"
              @click.stop="onOpenSetting(idx)"
              title="하단 메뉴접근권한 / 대상사용자 설정">설정</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="['N','U'].includes(row._row_status)"
              class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>

  <!-- ── 하단: 메뉴 배분 + 사용자 배분 ───────────────────────────────────────────── -->
  <div id="role-config-panel" style="display:flex;gap:16px;align-items:flex-start;">

    <!-- ── 좌: 메뉴목록 ────────────────────────────────────────────────────── -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar" style="flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <b style="font-size:13px;">메뉴 접근권한</b>
            <span v-if="cfSelectedRoleNm" style="font-size:12px;color:#e8587a;">— {{ cfSelectedRoleNm }}</span>
            <span v-else style="font-size:12px;color:#bbb;">위 목록에서 역할의 [설정] 버튼을 클릭하세요</span>
          </div>
          <div v-if="uiState.selectedRoleId" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
            <label style="font-size:12px;color:#555;cursor:pointer;display:flex;align-items:center;gap:4px;margin-right:4px;white-space:nowrap;">
              <input type="checkbox" :checked="cfMenuAllChecked" @change="e => toggleAllMenus(e.target.checked)" />
              전체선택
            </label>
            <button v-for="p in codes.perm_levels" :key="p"
              class="btn btn-xs"
              :style="{ background: fnPermColor(p), borderColor: fnPermColor(p), color:'#fff', fontWeight:'600', fontSize:'11px', padding:'2px 8px' }"
              @click="setAllMenuPerm(p)">{{ p }}</button>
            <button class="btn btn-primary btn-sm" style="margin-left:8px;" @click="handleSaveRoleConfig">💾 설정 저장</button>
          </div>
        </div>

        <!-- ── 메뉴 검색 ──────────────────────────────────────────────────── -->
        <div v-if="uiState.selectedRoleId" style="padding:8px 0 6px;">
          <input class="form-control" v-model="uiState.menuSearchKw" placeholder="메뉴명 또는 메뉴코드 검색"
            style="font-size:12px;padding:5px 10px;" />
        </div>

        <!-- ── 메뉴 트리 목록 ───────────────────────────────────────────────── -->
        <div v-if="uiState.selectedRoleId" style="max-height:340px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px;">
          <div v-if="!cfMenuTree.length" style="text-align:center;color:#bbb;padding:20px;font-size:13px;">메뉴가 없습니다.</div>
          <div v-for="m in cfMenuTree" :key="m.menuId"
            style="display:flex;align-items:center;padding:6px 10px;border-bottom:1px solid #f8f8f8;transition:background .1s;"
            :style="{ background: isMenuChecked(m.menuId) ? '#fff8f9' : '' }">
            <!-- ── 블릿 트리 들여쓰기 ─────────────────────────────────────────── -->
            <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'5px', fontWeight:'700',
                            fontSize: m._depth===0?'7px':'11px', flexShrink:0,
                            color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
              {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
            </span>
            <span style="font-size:13px;color:#333;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.menuNm }}</span>
            <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin:0 8px;flex-shrink:0;">{{ m.menuCode }}</code>
            <!-- ── 권한 레벨 토글 버튼 ────────────────────────────────────────── -->
            <div style="display:flex;gap:2px;flex-shrink:0;">
              <button v-for="p in codes.perm_levels" :key="p"
                style="font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;transition:all .1s;"
                :style="getMenuPerm(m.menuId)===p
                  ? { background: fnPermColor(p), borderColor: fnPermColor(p), color:'#fff' }
                  : { background:'#f5f5f5', borderColor:'#e0e0e0', color:'#999' }"
                @click="setMenuPerm(m.menuId, p)">{{ p }}</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          위 목록에서 역할의 [설정] 버튼을 클릭하세요.
        </div>
      </div>
    </div>

    <!-- ── 우: 대상사용자 ───────────────────────────────────────────────────── -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <div>
            <b style="font-size:13px;">대상사용자</b>
            <span v-if="cfSelectedRoleNm" style="font-size:12px;color:#e8587a;margin-left:8px;">— {{ cfSelectedRoleNm }}</span>
            <span v-else style="font-size:12px;color:#bbb;margin-left:8px;">위 목록에서 역할의 [설정] 버튼을 클릭하세요</span>
          </div>
          <button v-if="uiState.selectedRoleId" class="btn btn-primary btn-sm"
            @click="uiState.userSelectOpen=true">+ 사용자 추가</button>
        </div>

        <!-- ── 선택된 사용자 목록 ─────────────────────────────────────────────── -->
        <div v-if="uiState.selectedRoleId">
          <div v-if="!cfRoleUsersList.length"
            style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;border:1px dashed #e0e0e0;border-radius:6px;">
            추가된 사용자가 없습니다.<br>
            <span style="font-size:12px;">[사용자 추가] 버튼으로 추가하세요.</span>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">
            <div v-for="u in cfRoleUsersList" :key="u.boUserId"
              style="display:flex;align-items:center;padding:9px 14px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;transition:background .1s;"
              @mouseenter="$event.currentTarget.style.background='#fff0f4'"
              @mouseleave="$event.currentTarget.style.background='#fafafa'">
              <div style="width:32px;height:32px;border-radius:50%;background:#e8587a22;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px;">
                <span style="font-size:13px;font-weight:700;color:#e8587a;">{{ u.name.charAt(0) }}</span>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#222;">{{ u.name }}</div>
                <div style="font-size:11px;color:#888;margin-top:1px;">{{ u.loginId }} · {{ u.dept || '-' }} · {{ u.role }}</div>
              </div>
              <span class="badge" :class="u.status==='활성'?'badge-green':'badge-gray'" style="font-size:10px;margin-right:8px;">{{ u.status }}</span>
              <button class="btn btn-danger btn-xs" @click="removeUser(u.boUserId)" title="제거">✕</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          위 목록에서 역할을 선택하세요.
        </div>
      </div>
    </div>
  </div>

  <!-- ── 사용자 선택 모달 ────────────────────────────────────────────────────── -->
  <bo-user-select-modal v-if="uiState.userSelectOpen" @select="onUserSelect"
    @close="uiState.userSelectOpen=false" />

  <!-- ── 상위역할 선택 모달 ───────────────────────────────────────────────────── -->
  <role-tree-modal
    v-if="roleTreeModal && roleTreeModal.show" :exclude-id="roleTreeModal.targetRow && roleTreeModal.targetRow.roleId > 0 ? roleTreeModal.targetRow.roleId : null"
    @select="onParentSelect"
    @close="roleTreeModal.show=false" />
</div></div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_role"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};

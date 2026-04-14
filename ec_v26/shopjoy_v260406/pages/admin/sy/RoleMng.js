/* ShopJoy Admin - 권한관리 (Tree CRUD 그리드 + 하단 메뉴/사용자 배분) */
window.SyRoleMng = {
  name: 'SyRoleMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, watch } = Vue;

    const siteNm  = computed(() => window.adminUtil.getSiteNm());
    const ROLE_TYPES  = ['시스템', '업무', '기타'];
    const PERM_LEVELS = ['없음', '읽기', '쓰기', '관리', '차단'];
    const PERM_COLORS = { '없음': '#9ca3af', '읽기': '#2563eb', '쓰기': '#16a34a', '관리': '#f59e0b', '차단': '#e8587a' };
    const permColor   = (p) => PERM_COLORS[p] || '#9ca3af';
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* ── 검색 ── */
    const searchKw    = ref('');
    const searchType  = ref('');
    const searchUseYn = ref('');
    const applied = Vue.reactive({ kw: '', type: '', useYn: '' });

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);
    const selectedRoleId = ref(null);

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [10, 20, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['roleCode', 'roleNm', 'parentId', 'roleType', 'sortOrd', 'useYn', 'restrictPerm', 'remark'];

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

    const makeRow = (r) => ({
      ...r, _depth: r._depth || 0, _row_status: 'N', _row_check: false,
      restrictPerm: r.restrictPerm || '없음',
      _orig: { roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId,
               roleType: r.roleType, sortOrd: r.sortOrd, useYn: r.useYn,
               restrictPerm: r.restrictPerm || '없음', remark: r.remark },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      const filtered = props.adminData.roles.filter(r => {
        const kw = applied.kw.trim().toLowerCase();
        if (kw && !r.roleCode.toLowerCase().includes(kw) && !r.roleNm.toLowerCase().includes(kw)) return false;
        if (applied.type  && r.roleType !== applied.type)  return false;
        if (applied.useYn && r.useYn    !== applied.useYn) return false;
        return true;
      });
      buildTreeRows(filtered).forEach(r => gridRows.push(makeRow(r)));
    };

    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, type: searchType.value, useYn: searchUseYn.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchType.value = ''; searchUseYn.value = '';
      Object.assign(applied, { kw: '', type: '', useYn: '' });
      loadGrid();
    };

    const setFocused = (realIdx) => {
      focusedIdx.value = realIdx;
      const row = gridRows[realIdx];
      selectedRoleId.value = row && row.roleId > 0 ? row.roleId : null;
    };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const ref = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        roleId: _tempId--, roleCode: '', roleNm: '', parentId: ref ? ref.parentId : null,
        roleType: ref ? ref.roleType : '업무',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', restrictPerm: '없음', remark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      selectedRoleId.value = null;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= realIdx ? 1 : 0));
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

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.roleCode || !r.roleNm) { props.showToast('권한코드와 권한명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      dRows.forEach(r => {
        const i = props.adminData.roles.findIndex(x => x.roleId === r.roleId);
        if (i !== -1) props.adminData.roles.splice(i, 1);
        props.adminData.roleMenus = props.adminData.roleMenus.filter(x => x.roleId !== r.roleId);
        props.adminData.roleUsers = props.adminData.roleUsers.filter(x => x.roleId !== r.roleId);
      });
      uRows.forEach(r => { const i = props.adminData.roles.findIndex(x => x.roleId === r.roleId); if (i !== -1) Object.assign(props.adminData.roles[i], { roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId || null, roleType: r.roleType, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, restrictPerm: r.restrictPerm || '없음', remark: r.remark }); });
      let nextId = Math.max(...props.adminData.roles.map(r => r.roleId), 0);
      iRows.forEach(r => { props.adminData.roles.push({ roleId: ++nextId, roleCode: r.roleCode, roleNm: r.roleNm, parentId: r.parentId || null, roleType: r.roleType, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, restrictPerm: r.restrictPerm || '없음', remark: r.remark, regDate: new Date().toISOString().slice(0, 10) }); });
      const parts = [];
      if (iRows.length) parts.push(`등록 ${iRows.length}건`);
      if (uRows.length) parts.push(`수정 ${uRows.length}건`);
      if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${parts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };
    const statusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = props.adminData.roles.find(r => r.roleId === parentId);
      return p ? p.roleNm : `ID:${parentId}`;
    };

    const roleTreeModal = Vue.reactive({ show: false, targetRow: null });
    const openParentModal = (row) => { roleTreeModal.targetRow = row; roleTreeModal.show = true; };
    const onParentSelect  = (role) => {
      if (roleTreeModal.targetRow) { roleTreeModal.targetRow.parentId = role.roleId; roleTreeModal.targetRow._depth = 0; onCellChange(roleTreeModal.targetRow); }
      roleTreeModal.show = false;
    };

    /* ── 하단: 메뉴 배분 ── */
    const menuSearchKw = ref('');
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
    const menuTree = computed(() => {
      const kw = menuSearchKw.value.trim().toLowerCase();
      const all = props.adminData.menus;
      const list = kw ? all.filter(m => m.menuNm.toLowerCase().includes(kw) || m.menuCode.toLowerCase().includes(kw)) : all;
      return flatMenuTree(buildMenuTree(list, null, 0));
    });

    const roleMenuIds = computed(() => {
      if (!selectedRoleId.value) return new Set();
      return new Set(props.adminData.roleMenus.filter(x => x.roleId === selectedRoleId.value).map(x => x.menuId));
    });

    const getMenuPerm = (menuId) => {
      if (!selectedRoleId.value) return '없음';
      const entry = props.adminData.roleMenus.find(x => x.roleId === selectedRoleId.value && x.menuId === menuId);
      return entry ? (entry.permLevel || '읽기') : '없음';
    };
    const setMenuPerm = (menuId, level) => {
      if (!selectedRoleId.value) return;
      const idx = props.adminData.roleMenus.findIndex(x => x.roleId === selectedRoleId.value && x.menuId === menuId);
      if (level === '없음') {
        if (idx !== -1) props.adminData.roleMenus.splice(idx, 1);
      } else {
        if (idx !== -1) props.adminData.roleMenus[idx].permLevel = level;
        else props.adminData.roleMenus.push({ roleId: selectedRoleId.value, menuId, permLevel: level });
      }
    };
    const setAllMenuPerm = (level) => {
      if (!selectedRoleId.value) return;
      if (level === '없음') {
        props.adminData.roleMenus = props.adminData.roleMenus.filter(x => x.roleId !== selectedRoleId.value);
      } else {
        menuTree.value.forEach(m => {
          const idx = props.adminData.roleMenus.findIndex(x => x.roleId === selectedRoleId.value && x.menuId === m.menuId);
          if (idx !== -1) props.adminData.roleMenus[idx].permLevel = level;
          else props.adminData.roleMenus.push({ roleId: selectedRoleId.value, menuId: m.menuId, permLevel: level });
        });
      }
    };
    const isMenuChecked = (menuId) => getMenuPerm(menuId) !== '없음';
    const toggleAllMenus = (check) => { setAllMenuPerm(check ? '읽기' : '없음'); };
    const menuAllChecked = computed(() => {
      if (!selectedRoleId.value || !menuTree.value.length) return false;
      return menuTree.value.every(m => getMenuPerm(m.menuId) !== '없음');
    });

    /* ── 하단: 대상사용자 (모달 선택) ── */
    const userSelectOpen = ref(false);

    const roleUsersList = computed(() => {
      if (!selectedRoleId.value) return [];
      return props.adminData.roleUsers
        .filter(x => x.roleId === selectedRoleId.value)
        .map(x => props.adminData.adminUsers.find(u => u.adminUserId === x.adminUserId))
        .filter(Boolean);
    });

    const onUserSelect = (users) => {
      if (!selectedRoleId.value) return;
      users.forEach(u => {
        const already = props.adminData.roleUsers.some(x => x.roleId === selectedRoleId.value && x.adminUserId === u.adminUserId);
        if (!already) props.adminData.roleUsers.push({ roleId: selectedRoleId.value, adminUserId: u.adminUserId });
      });
      userSelectOpen.value = false;
    };

    const removeUser = (adminUserId) => {
      if (!selectedRoleId.value) return;
      const idx = props.adminData.roleUsers.findIndex(x => x.roleId === selectedRoleId.value && x.adminUserId === adminUserId);
      if (idx !== -1) props.adminData.roleUsers.splice(idx, 1);
    };

    const selectedRoleNm = computed(() => {
      if (!selectedRoleId.value) return '';
      const r = props.adminData.roles.find(x => x.roleId === selectedRoleId.value);
      return r ? r.roleNm : '';
    });

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'roleId'},{label:'권한코드',key:'roleCode'},{label:'권한명',key:'roleNm'},{label:'상위ID',key:'parentId'},{label:'유형',key:'roleType'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'제한',key:'restrictPerm'},{label:'비고',key:'remark'}],
      '권한목록.csv'
    );

    return {
      siteNm, ROLE_TYPES, PERM_LEVELS, permColor, depthBullet, depthColor, statusClass,
      searchKw, searchType, searchUseYn, applied, onSearch, onReset,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      checkAll, toggleCheckAll, parentNm,
      roleTreeModal, openParentModal, onParentSelect,
      selectedRoleId, selectedRoleNm,
      menuSearchKw, menuTree, getMenuPerm, setMenuPerm, setAllMenuPerm, isMenuChecked, toggleAllMenus, menuAllChecked,
      userSelectOpen, roleUsersList, onUserSelect, removeUser,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">권한관리</div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="권한코드 / 권한명 검색" />
      <select v-model="searchType">
        <option value="">유형 전체</option>
        <option v-for="t in ROLE_TYPES" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- CRUD 그리드 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>권한목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
      </div>
    </div>

    <table class="admin-table crud-grid">
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th style="width:120px;">권한코드</th>
          <th style="min-width:150px;">권한명</th>
          <th style="min-width:120px;">상위권한</th>
          <th style="width:75px;">유형</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th style="width:80px;">제한권한</th>
          <th>비고</th>
          <th style="width:80px;">사이트명</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="14" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.roleId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          @click="setFocused(getRealIdx(idx))">

          <td class="col-id-val">{{ row.roleId > 0 ? row.roleId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input grid-mono" v-model="row.roleCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>

          <!-- 권한명 (블릿 트리) -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0?'7px':'12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.roleNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- 상위권한 -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentId)">{{ parentNm(row.parentId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위권한 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td>
            <select class="grid-select" v-model="row.roleType" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="t in ROLE_TYPES" :key="t">{{ t }}</option>
            </select>
          </td>
          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="Y">사용</option><option value="N">미사용</option>
            </select>
          </td>
          <td style="padding:3px 6px;">
            <select class="grid-select" v-model="row.restrictPerm" :disabled="row._row_status==='D'" @change="onCellChange(row)"
              :style="{ color: permColor(row.restrictPerm), fontWeight: row.restrictPerm!=='없음'?'700':'400' }">
              <option v-for="p in PERM_LEVELS" :key="p">{{ p }}</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="['N','U'].includes(row._row_status)"
              class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
          </td>
        </tr>
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

  <!-- 하단: 메뉴 배분 + 사용자 배분 -->
  <div style="display:flex;gap:16px;align-items:flex-start;">

    <!-- 좌: 메뉴목록 -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar" style="flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <b style="font-size:13px;">메뉴 접근권한</b>
            <span v-if="selectedRoleNm" style="font-size:12px;color:#e8587a;">— {{ selectedRoleNm }}</span>
            <span v-else style="font-size:12px;color:#bbb;">권한을 선택하면 메뉴를 배분할 수 있습니다</span>
          </div>
          <div v-if="selectedRoleId" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
            <label style="font-size:12px;color:#555;cursor:pointer;display:flex;align-items:center;gap:4px;margin-right:4px;white-space:nowrap;">
              <input type="checkbox" :checked="menuAllChecked" @change="e => toggleAllMenus(e.target.checked)" />
              전체선택
            </label>
            <button v-for="p in PERM_LEVELS" :key="p"
              class="btn btn-xs"
              :style="{ background: permColor(p), borderColor: permColor(p), color:'#fff', fontWeight:'600', fontSize:'11px', padding:'2px 8px' }"
              @click="setAllMenuPerm(p)">{{ p }}</button>
          </div>
        </div>

        <!-- 메뉴 검색 -->
        <div v-if="selectedRoleId" style="padding:8px 0 6px;">
          <input class="form-control" v-model="menuSearchKw" placeholder="메뉴명 또는 메뉴코드 검색"
            style="font-size:12px;padding:5px 10px;" />
        </div>

        <!-- 메뉴 트리 목록 -->
        <div v-if="selectedRoleId" style="max-height:340px;overflow-y:auto;border:1px solid #f0f0f0;border-radius:6px;">
          <div v-if="!menuTree.length" style="text-align:center;color:#bbb;padding:20px;font-size:13px;">메뉴가 없습니다.</div>
          <div v-for="m in menuTree" :key="m.menuId"
            style="display:flex;align-items:center;padding:6px 10px;border-bottom:1px solid #f8f8f8;transition:background .1s;"
            :style="{ background: isMenuChecked(m.menuId) ? '#fff8f9' : '' }">
            <!-- 블릿 트리 들여쓰기 -->
            <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'5px', fontWeight:'700',
                            fontSize: m._depth===0?'7px':'11px', flexShrink:0,
                            color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
              {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
            </span>
            <span style="font-size:13px;color:#333;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.menuNm }}</span>
            <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin:0 8px;flex-shrink:0;">{{ m.menuCode }}</code>
            <!-- 권한 레벨 토글 버튼 -->
            <div style="display:flex;gap:2px;flex-shrink:0;">
              <button v-for="p in PERM_LEVELS" :key="p"
                style="font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;transition:all .1s;"
                :style="getMenuPerm(m.menuId)===p
                  ? { background: permColor(p), borderColor: permColor(p), color:'#fff' }
                  : { background:'#f5f5f5', borderColor:'#e0e0e0', color:'#999' }"
                @click="setMenuPerm(m.menuId, p)">{{ p }}</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          위 목록에서 권한을 선택하세요.
        </div>
      </div>
    </div>

    <!-- 우: 대상사용자 -->
    <div style="flex:1;">
      <div class="card" style="margin-bottom:0;">
        <div class="toolbar">
          <div>
            <b style="font-size:13px;">대상사용자</b>
            <span v-if="selectedRoleNm" style="font-size:12px;color:#e8587a;margin-left:8px;">— {{ selectedRoleNm }}</span>
            <span v-else style="font-size:12px;color:#bbb;margin-left:8px;">권한을 선택하면 사용자를 추가할 수 있습니다</span>
          </div>
          <button v-if="selectedRoleId" class="btn btn-primary btn-sm"
            @click="userSelectOpen=true">+ 사용자 추가</button>
        </div>

        <!-- 선택된 사용자 목록 -->
        <div v-if="selectedRoleId">
          <div v-if="!roleUsersList.length"
            style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;border:1px dashed #e0e0e0;border-radius:6px;">
            추가된 사용자가 없습니다.<br>
            <span style="font-size:12px;">[사용자 추가] 버튼으로 추가하세요.</span>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:6px;padding-top:4px;">
            <div v-for="u in roleUsersList" :key="u.adminUserId"
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
              <button class="btn btn-danger btn-xs" @click="removeUser(u.adminUserId)" title="제거">✕</button>
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          위 목록에서 권한을 선택하세요.
        </div>
      </div>
    </div>
  </div>

  <!-- 사용자 선택 모달 -->
  <admin-user-select-modal v-if="userSelectOpen"
    :disp-dataset="adminData"
    @select="onUserSelect"
    @close="userSelectOpen=false" />

  <!-- 상위권한 선택 모달 -->
  <role-tree-modal
    v-if="roleTreeModal.show"
    :disp-dataset="adminData"
    :exclude-id="roleTreeModal.targetRow && roleTreeModal.targetRow.roleId > 0 ? roleTreeModal.targetRow.roleId : null"
    @select="onParentSelect"
    @close="roleTreeModal.show=false" />
</div>
`,
};

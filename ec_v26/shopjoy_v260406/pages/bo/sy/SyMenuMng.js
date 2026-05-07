/* ShopJoy Admin - 메뉴관리 (Tree CRUD 그리드) */
window.SyMenuMng = {
  name: 'SyMenuMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const menus = reactive([]);
    const uiState = reactive({ checkAll: false, loading: false, error: null, isPageCodeLoad: false, selectedTreeId: null, focusedIdx: null});
    const codes = reactive({ menu_type: [], menu_status: [], use_yn: [], menu_types: ['페이지','폴더','외부링크','구분선'] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syMenu.getPage({ pageNo: 1, pageSize: 10000 }, '메뉴관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        menus.splice(0, menus.length, ...list);
        gridRows.splice(0);
        buildTreeRows(list).forEach(m => gridRows.push(makeRow(m)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* -- 검색 -- */
    const _initSearchParam = () => {
      return { kw: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 좌측 메뉴 트리 */
    const selectNode = (id) => { uiState.selectedTreeId = id; handleSearchList(); };


    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.menu_type = codeStore.sgGetGrpCodes('MENU_TYPE');
      codes.menu_status = codeStore.sgGetGrpCodes('MENU_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const cfAllowedTreeIds = computed(() => {
      if (uiState.selectedTreeId == null) return null;
      return coUtil.collectDescendantIds(menus, 'menuId', 'parentId', uiState.selectedTreeId);
    });




    /* -- CRUD 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    

    const EDIT_FIELDS = ['menuCode', 'menuNm', 'parentId', 'menuUrl', 'menuType', 'sortOrd', 'useYn', 'remark'];

    /* -- 트리 정렬 -- */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(m => { map[m.menuId] = { ...m, _children: [] }; });
      const roots = [];
      items.forEach(m => {
        if (m.parentId && map[m.parentId]) map[m.parentId]._children.push(map[m.menuId]);
        else roots.push(map[m.menuId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = (m) => ({
      ...m, _depth: m._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { menuCode: m.menuCode, menuNm: m.menuNm, parentId: m.parentId,
               menuUrl: m.menuUrl, menuType: m.menuType, sortOrd: m.sortOrd, useYn: m.useYn, remark: m.remark },
    });


    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    const setFocused = (realIdx) => { uiState.focusedIdx = realIdx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        menuId: _tempId--, menuCode: '', menuNm: '', parentId: ref ? ref.parentId : null,
        menuUrl: '', menuType: ref ? ref.menuType : '페이지',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', remark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
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
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.menuId));
      if (!checkedIds.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.menuId)) continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_status !== 'N') {
          if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
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
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.menuCode || !r.menuNm) { showToast('메뉴코드와 메뉴명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syMenu.saveList(saveRows, '메뉴관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = menus.find(m => m.menuId === parentId);
      return p ? p.menuNm : `ID:${parentId}`;
    };

    const menuTreeModal = reactive({ show: false, targetRow: null });
    const openParentModal = async (row) => { menuTreeModal.targetRow = row; await handleSearchList('DEFAULT'); menuTreeModal.show = true; };
    const onParentSelect  = (menu) => {
      if (menuTreeModal.targetRow) { menuTreeModal.targetRow.parentId = menu.menuId; menuTreeModal.targetRow._depth = 0; onCellChange(menuTreeModal.targetRow); }
      menuTreeModal.show = false;
    };

    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor  = (d) => DEPTH_COLORS[d % 5];
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const fnTypeClass   = t => ({ '페이지': 'badge-blue', '폴더': 'badge-gray', '외부링크': 'badge-green', '구분선': 'badge-orange' }[t] || 'badge-gray');

    const exportExcel = () => coUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'menuId'},{label:'메뉴코드',key:'menuCode'},{label:'메뉴명',key:'menuNm'},{label:'상위ID',key:'parentId'},{label:'URL',key:'menuUrl'},{label:'유형',key:'menuType'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'remark'}],
      '메뉴목록.csv'
    );

    // -- return ---------------------------------------------------------------

    return { menus, uiState, codes, selectNode,
      searchParam,
      cfSiteNm,
      gridRows,
      setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      toggleCheckAll, parentNm,
      menuTreeModal, openParentModal, onParentSelect,
      depthBullet, depthColor, fnStatusClass, fnTypeClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">메뉴관리</div>


  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="메뉴코드 / 메뉴명 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in codes.menu_types" :key="t">{{ t }}</option>
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

  
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 메뉴 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_menu</span></span>
        <span v-if="uiState.selectedTreeId != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="sy_menu" :selected="uiState.selectedTreeId" @select="selectNode" />
      </div>
    </div>
    <div>
<div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>메뉴목록 <span class="list-count">{{ gridRows.filter(r => r._row_status !== 'D').length }}건</span><span v-if="uiState.selectedTreeId != null" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.selectedTreeId }}</span></span>
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
          <th style="width:110px;">메뉴코드</th>
          <th style="min-width:180px;">메뉴명</th>
          <th style="min-width:140px;">상위메뉴</th>
          <th style="min-width:160px;">메뉴URL</th>
          <th style="width:80px;">유형</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th>비고</th>
          <th style="width:80px;">사이트명</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="15" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-else v-for="(row, idx) in gridRows" :key="row.menuId"
          class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===idx ? 'focused' : '']"
          @click="setFocused(idx)">

          <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td class="col-id-val">{{ row.menuId > 0 ? row.menuId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input grid-mono" v-model="row.menuCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>

          <!-- -- 메뉴명 (블릿 트리) -------------------------------------------- -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0 ? '7px' : '12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.menuNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- -- 상위메뉴 --------------------------------------------------- -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentId)">{{ parentNm(row.parentId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위메뉴 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td><input class="grid-input" v-model="row.menuUrl" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="/path" /></td>
          <td>
            <select class="grid-select" v-model="row.menuType" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="t in codes.menu_types" :key="t">{{ t }}</option>
            </select>
          </td>
          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
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

  <menu-tree-modal
    v-if="menuTreeModal && menuTreeModal.show" :exclude-id="menuTreeModal.targetRow && menuTreeModal.targetRow.menuId > 0 ? menuTreeModal.targetRow.menuId : null"
    @select="onParentSelect"
    @close="menuTreeModal.show=false" />
</div>
`,
};

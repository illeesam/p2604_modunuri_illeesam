/* ShopJoy Admin - 메뉴관리 (Tree CRUD 그리드) */
window.SyMenuMng = {
  name: 'SyMenuMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
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
      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 좌측 메뉴 트리 */
    const selectNode = (id) => { uiState.selectedTreeId = id; handleSearchList(); };


    /* 메뉴 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.menu_type = codeStore.sgGetGrpCodes('MENU_TYPE');
      codes.menu_status = codeStore.sgGetGrpCodes('MENU_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const cfAllowedTreeIds = computed(() => {
      if (uiState.selectedTreeId == null) return null;
      return coUtil.cofCollectDescendantIds(menus, 'menuId', 'parentMenuId', uiState.selectedTreeId);
    });




    /* -- CRUD 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    

    const EDIT_FIELDS = ['menuCode', 'menuNm', 'parentMenuId', 'menuUrl', 'menuTypeCd', 'sortOrd', 'useYn', 'menuRemark'];

    /* -- 트리 정렬 -- */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(m => { map[m.menuId] = { ...m, _children: [] }; });
      const roots = [];
      items.forEach(m => {
        if (m.parentMenuId && map[m.parentMenuId]) map[m.parentMenuId]._children.push(map[m.menuId]);
        else roots.push(map[m.menuId]);
      });
      const result = [];

      /* 메뉴 traverse */
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    /* 메뉴 makeRow */
    const makeRow = (m) => ({
      ...m, _depth: m._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { menuCode: m.menuCode, menuNm: m.menuNm, parentMenuId: m.parentMenuId,
               menuUrl: m.menuUrl, menuTypeCd: m.menuTypeCd, sortOrd: m.sortOrd, useYn: m.useYn, menuRemark: m.menuRemark },
    });


    /* 메뉴 목록조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* 메뉴 onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    /* 메뉴 setFocused */
    const setFocused = (realIdx) => { uiState.focusedIdx = realIdx; };

    /* 메뉴 onCellChange */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* 메뉴 addRow */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        menuId: _tempId--, menuCode: '', menuNm: '', parentMenuId: ref ? ref.parentMenuId : null,
        menuUrl: '', menuTypeCd: ref ? ref.menuTypeCd : '페이지',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', menuRemark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* 메뉴 deleteRow */
    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    /* 메뉴 cancelRow */
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

    /* 메뉴 cancelChecked */
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

    /* 메뉴 deleteRows */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* 메뉴 저장 */
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

    /* 메뉴 toggleCheckAll */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* 메뉴 parentNm */
    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = menus.find(m => m.menuId === parentId);
      return p ? p.menuNm : `ID:${parentId}`;
    };

    const menuTreeModal = reactive({ show: false, targetRow: null });

    /* 메뉴 openParentModal */
    const openParentModal = async (row) => { menuTreeModal.targetRow = row; await handleSearchList('DEFAULT'); menuTreeModal.show = true; };

    /* 메뉴 onParentSelect */
    const onParentSelect  = (menu) => {
      if (menuTreeModal.targetRow) { menuTreeModal.targetRow.parentMenuId = menu.menuId; menuTreeModal.targetRow._depth = 0; onCellChange(menuTreeModal.targetRow); }
      menuTreeModal.show = false;
    };

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* 메뉴 depthBullet */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* 메뉴 depthColor */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* 메뉴 fnStatusClass */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* 메뉴 fnTypeClass */
    const fnTypeClass   = t => ({ '페이지': 'badge-blue', '폴더': 'badge-gray', '외부링크': 'badge-green', '구분선': 'badge-orange' }[t] || 'badge-gray');

    /* 메뉴 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'menuId'},{label:'메뉴코드',key:'menuCode'},{label:'메뉴명',key:'menuNm'},{label:'상위ID',key:'parentMenuId'},{label:'URL',key:'menuUrl'},{label:'유형',key:'menuTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'menuRemark'}],
      '메뉴목록.csv'
    );

    /* BoGridCrud 컬럼 정의 (특수셀은 cell/head 슬롯으로 override) */
    const gridColumns = [
      { key: 'menuCode',   label: '메뉴코드', style: 'width:110px;',    edit: 'text', mono: true },
      { key: 'menuNm',     label: '메뉴명',   style: 'min-width:180px;' },
      { key: 'parentMenuId', label: '상위메뉴', style: 'min-width:140px;' },
      { key: 'menuUrl',    label: '메뉴URL',  style: 'min-width:160px;', edit: 'text', placeholder: '/path' },
      { key: 'menuTypeCd', label: '유형',     style: 'width:80px;',     edit: 'select', options: codes.menu_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',      label: '사용여부', cls: 'col-use',  edit: 'select', options: codes.use_yn },
      { key: 'menuRemark', label: '비고',     edit: 'text' },
      { key: 'siteNm',     label: '사이트명', style: 'width:80px;' },
    ];

    // -- return ---------------------------------------------------------------

    return { menus, uiState, codes, selectNode,
      searchParam,
      cfSiteNm, gridColumns,
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
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'menuCode', label: '메뉴코드' },
          { value: 'menuNm',   label: '메뉴명' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in codes.menu_types" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
    </bo-search-area>
  </div>

  
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_menu" title="메뉴" :show-biz-cd="true"
      :selected="uiState.selectedTreeId" @select="selectNode" />
    <div>
<bo-grid-crud
    :columns="gridColumns" :rows="gridRows" row-key="menuId"
    list-title="메뉴목록" :show-export="true" :draggable="false"
    v-model:focusedIdx="uiState.focusedIdx"
    v-model:checkAll="uiState.checkAll"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @cell-change="onCellChange" @export="exportExcel">


    <template #cell-menuNm="{ row }">
      <td style="padding:3px 6px;">
        <div style="display:flex;align-items:center;">
          <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                          fontSize: row._depth===0 ? '7px' : '12px', flexShrink:0,
                          color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
          <input class="grid-input" v-model="row.menuNm" :disabled="row._row_status==='D'"
            @input="onCellChange(row)" style="flex:1;" />
        </div>
      </td>
    </template>

    <template #cell-parentMenuId="{ row }">
      <td style="padding:3px 8px;">
        <div style="display:flex;align-items:center;gap:5px;">
          <span v-if="row.parentMenuId"
            style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
            :title="parentNm(row.parentMenuId)">{{ parentNm(row.parentMenuId) }}</span>
          <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
          <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
            style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위메뉴 선택"
            @click.stop="openParentModal(row)">🔍</button>
        </div>
      </td>
    </template>

    <template #cell-siteNm>
      <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
    </template>

    <template #row-actions="{ row, idx }">
      <button v-if="['U','I','D'].includes(row._row_status)"
        class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
      <button v-if="['N','U'].includes(row._row_status)"
        class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
    </template>
  </bo-grid-crud>

  <menu-tree-modal
    v-if="menuTreeModal && menuTreeModal.show" :exclude-id="menuTreeModal.targetRow && menuTreeModal.targetRow.menuId > 0 ? menuTreeModal.targetRow.menuId : null"
    @select="onParentSelect"
    @close="menuTreeModal.show=false" />
</div>
`,
};

/* ShopJoy Admin - 상품 옵션 코드 관리 (팝업 전용)
 * PROD_OPT_CATEGORY 공통코드를 3단 계층으로 관리
 * 좌측 트리: root → 1레벨(카테고리) → 2레벨(유형)  (SyCodeMng 좌측 트리 스타일)
 * 우측 그리드: 선택된 노드의 직계 자식만 (bo-grid-crud)
 *   root 선택  → 1레벨 목록
 *   1레벨 선택 → 2레벨 목록
 *   2레벨 선택 → 3레벨 목록
 */
window.PdOptCodeMng = {
  name: 'PdOptCodeMng',
  setup() {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, nextTick } = Vue;

    const CODE_GRP = 'PROD_OPT_CATEGORY';
    const SITE_ID  = window.sfGetBoAppStore?.()?.svBoSiteId || '2604010000000001';

    // 선택된 트리 노드: null = root
    const sel = reactive({ node: null });

    // 트리 펼침 상태 (1레벨 codeValue Set)
    const treeExpanded = reactive(new Set());

    const uiState = reactive({
      loading: false,
      checkAll: false,
      focusedIdx: null,
    });

    // 전체 코드 목록 (DB + 신규 포함)
    const allRows = reactive([]);
    let _tempId = -1;

    const EDIT_FIELDS = ['codeLabel', 'codeValue', 'sortOrd', 'useYn', 'codeOpt1', 'codeRemark', 'parentCodeValue'];

    /* ── 파생 계산 ─────────────────────────────────────────────────── */

    // 좌측 1레벨 노드
    const level1Nodes = computed(() =>
      allRows.filter(r => r.codeLevel === 1 ? r._row_status !== 'D' : false)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    // 특정 1레벨의 2레벨 자식
    const level2Of = (parentVal) =>
      allRows.filter(r => r.codeLevel === 2 ? (r.parentCodeValue === parentVal ? r._row_status !== 'D' : false) : false)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

    // 특정 2레벨의 3레벨 자식 (카운트용)
    const level3Of = (parentVal) =>
      allRows.filter(r => r.codeLevel === 3 ? (r.parentCodeValue === parentVal ? r._row_status !== 'D' : false) : false);

    // 선택 노드 기준 자식 레벨 번호
    const childLevel = computed(() => sel.node ? sel.node.codeLevel + 1 : 1);

    // 현재 그리드에 표시할 행 (선택 노드의 직계 자식)
    const gridRows = computed(() => {
      const parentVal = sel.node ? sel.node.codeValue : null;
      const lvl = childLevel.value;
      return allRows
        .filter(r => r.codeLevel === lvl ? (r.parentCodeValue || null) === parentVal : false)
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
    });

    // 2레벨 선택 시 3레벨 그리드 — 상위코드 select 옵션으로 사용
    const parentOpts = computed(() => {
      if (childLevel.value !== 3) return [];
      return allRows
        .filter(r => r.codeLevel === 2 ? r._row_status !== 'D' : false)
        .map(r => ({ value: r.codeValue, label: r.codeLabel + ' (' + r.codeValue + ')' }));
    });

    // 그리드 레벨 라벨 (툴바 타이틀)
    const levelLabel = computed(() => ['1단(카테고리)', '2단(유형)', '3단(값)'][childLevel.value - 1] || '');

    // 브레드크럼 (label: 표시명, code: 코드값)
    const breadcrumb = computed(() => {
      if (!sel.node) return null;
      if (sel.node.codeLevel === 1) return [
        { label: 'Root', code: null },
        { label: sel.node.codeLabel, code: sel.node.codeValue },
      ];
      if (sel.node.codeLevel === 2) {
        const p = allRows.find(r => r.codeValue === sel.node.parentCodeValue ? r.codeLevel === 1 : false);
        return [
          { label: 'Root', code: null },
          { label: p?.codeLabel || sel.node.parentCodeValue, code: p?.codeValue || sel.node.parentCodeValue },
          { label: sel.node.codeLabel, code: sel.node.codeValue },
        ];
      }
      return null;
    });

    // 그리드 컬럼
    const gridColumns = computed(() => {
      const cols = [
        { key: 'codeValue',  label: '코드값',        edit: 'text', mono: true, style: 'min-width:160px;' },
        { key: 'codeLabel',  label: '코드명',         edit: 'text', style: 'min-width:140px;' },
        { key: 'sortOrd',    label: '순서',           edit: 'number', style: 'width:60px;', align: 'center' },
        { key: 'useYn',      label: '사용',           edit: 'select', style: 'width:60px;', align: 'center',
          options: [{ value: 'Y', label: 'Y' }, { value: 'N', label: 'N' }] },
        { key: 'codeOpt1',   label: '스타일(opt1)',   edit: 'text', mono: true, style: 'width:140px;', placeholder: '#hex or class' },
        { key: 'codeRemark', label: '비고',           edit: 'text' },
      ];
      if (childLevel.value === 3) {
        cols.splice(2, 0, { key: 'parentCodeValue', label: '상위(2단)', edit: 'select',
          style: 'width:160px;', nullable: true, nullLabel: '-- 없음 --',
          options: () => parentOpts.value });
      }
      return cols;
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################ */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'tree-root')            { sel.node = null; uiState.focusedIdx = null; return; }
      if (cmd === 'tree-expand-all') {
        level1Nodes.value.forEach(n1 => treeExpanded.add(n1.codeValue));
        return;
      }
      if (cmd === 'tree-collapse-all') {
        treeExpanded.clear();
        return;
      }
      if (cmd === 'tree-toggle') {
        treeExpanded.has(param) ? treeExpanded.delete(param) : treeExpanded.add(param);
        return;
      }
      if (cmd === 'grid-add')             return addRow();
      if (cmd === 'grid-save')            return handleSave();
      if (cmd === 'grid-deleteChecked')   return deleteChecked();
      if (cmd === 'grid-cancelChecked')   return cancelChecked();
      if (cmd === 'grid-excel')           return exportExcel();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'tree-select')   return selectNode(param);
      if (cmd === 'grid-reorder')  return onReorder();
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'grid-cellChange') return onCellChange(row);
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 로드 ############################################################ */

    const makeRow = (c) => ({
      ...c,
      codeLevel:       c.codeLevel      || 1,
      parentCodeValue: c.parentCodeValue || null,
      sortOrd:         Number(c.sortOrd) || 0,
      useYn:           c.useYn           || 'Y',
      codeOpt1:        c.codeOpt1        || '',
      codeRemark:      c.codeRemark      || '',
      _row_status:     'N',
      _row_check:      false,
      _row_org: {
        codeLabel: c.codeLabel, codeValue: c.codeValue,
        parentCodeValue: c.parentCodeValue || null,
        sortOrd: Number(c.sortOrd) || 0, useYn: c.useYn || 'Y',
        codeOpt1: c.codeOpt1 || '', codeRemark: c.codeRemark || '',
      },
    });

    const handleLoad = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syCode.getAll(
          { codeGrp: CODE_GRP, siteId: SITE_ID, pageSize: 10000 },
          '상품옵션코드', '목록조회'
        );
        const list = res.data?.data || [];
        allRows.splice(0, allRows.length, ...list.map(makeRow));
        // 선택 노드 유효성 확인
        if (sel.node) {
          const still = allRows.find(r => r.codeValue === sel.node.codeValue ? r.codeLevel === sel.node.codeLevel : false);
          if (!still) { sel.node = null; }
          // 선택된 2레벨의 부모 펼침 복원
          else if (sel.node.codeLevel === 2 && sel.node.parentCodeValue) {
            treeExpanded.add(sel.node.parentCodeValue);
          }
        }
      } catch (e) {
        console.error('[handleLoad]', e);
        _toast('로드 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    onMounted(handleLoad);

    /* ##### [04] 내장 사용 함수 ################################################## */

    const _toast = (msg, type = 'success', dur = 3500) => {
      const el = document.getElementById('popup-toast');
      if (!el) return;
      el.textContent = msg;
      el.className   = 'popup-toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
      el.style.display = 'block';
      clearTimeout(el._tid);
      if (dur > 0) el._tid = setTimeout(() => { el.style.display = 'none'; }, dur);
    };
    const _confirm = (t, m) => new Promise(r => r(window.confirm(t + '\n\n' + m)));

    const selectNode = (node) => {
      const isSame = sel.node ? sel.node.codeValue === node.codeValue ? sel.node.codeLevel === node.codeLevel : false : false;
      sel.node = isSame ? null : node;
      // 1레벨 선택 시 해당 노드 자동 펼침
      if (!isSame && node.codeLevel === 1) treeExpanded.add(node.codeValue);
      // 2레벨 선택 시 부모 1레벨 펼침 유지
      if (!isSame && node.codeLevel === 2 && node.parentCodeValue) treeExpanded.add(node.parentCodeValue);
      uiState.focusedIdx = null;
    };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f] || '') !== String((row._row_org || {})[f] || '')) ? 'U' : 'N';
    };

    const addRow = () => {
      const parentVal = sel.node ? sel.node.codeValue : null;
      const lvl = childLevel.value;
      const maxSort = allRows
        .filter(r => r.codeLevel === lvl ? (r.parentCodeValue || null) === parentVal : false)
        .reduce((m, r) => Math.max(m, Number(r.sortOrd) || 0), 0);
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.value.length;
      const newRow = {
        _tmpId: _tempId--, codeId: null, siteId: SITE_ID, codeGrp: CODE_GRP,
        codeValue: '', codeLabel: '', codeLevel: lvl, parentCodeValue: parentVal,
        sortOrd: maxSort + 1, useYn: 'Y', codeOpt1: '', codeRemark: '',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      // allRows에 삽입 (gridRows는 computed라 직접 못 쓰므로 allRows 조작)
      // insertAt 위치를 allRows에서 찾아 삽입
      const currentGrid = gridRows.value;
      if (insertAt >= currentGrid.length) {
        allRows.push(newRow);
      } else {
        const refRow = currentGrid[insertAt];
        const ai = allRows.indexOf(refRow);
        if (ai > -1) allRows.splice(ai, 0, newRow);
        else allRows.push(newRow);
      }
      uiState.focusedIdx = insertAt;
    };

    const deleteRow = (row) => {
      if (row._row_status === 'I') {
        const ai = allRows.indexOf(row); if (ai > -1) allRows.splice(ai, 1);
      } else {
        row._row_status = 'D';
      }
    };

    const cancelRow = (row) => {
      if (row._row_status === 'I') {
        const ai = allRows.indexOf(row); if (ai > -1) allRows.splice(ai, 1);
      } else if (row._row_org) {
        EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      [...gridRows.value].filter(r => r._row_check).forEach(cancelRow);
    };

    const deleteChecked = async () => {
      const checked = gridRows.value.filter(r => r._row_check);
      if (!checked.length) { _toast('선택된 항목이 없습니다.', 'error'); return; }
      const ok = await _confirm('일괄삭제', checked.length + '개 항목을 삭제하시겠습니까?');
      if (!ok) return;
      checked.forEach(deleteRow);
    };

    const handleSave = async () => {
      const iRows = allRows.filter(r => r._row_status === 'I');
      const uRows = allRows.filter(r => r._row_status === 'U');
      const dRows = allRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { _toast('변경된 내용이 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.codeValue?.trim() || !r.codeLabel?.trim()) { _toast('코드값과 코드명은 필수입니다.', 'error'); return; }
      }
      const ok = await _confirm('저장', (iRows.length ? '등록 ' + iRows.length + '건  ' : '') + (uRows.length ? '수정 ' + uRows.length + '건  ' : '') + (dRows.length ? '삭제 ' + dRows.length + '건' : '') + '\n저장하시겠습니까?');
      if (!ok) return;
      const rows = [...iRows, ...uRows, ...dRows].map(r => ({
        codeId:          r.codeId || null,
        siteId:          SITE_ID,
        codeGrp:         CODE_GRP,
        codeValue:       r.codeValue,
        codeLabel:       r.codeLabel,
        codeLevel:       r.codeLevel || 1,
        parentCodeValue: r.parentCodeValue || null,
        sortOrd:         Number(r.sortOrd) || 0,
        useYn:           r.useYn || 'Y',
        codeOpt1:        r.codeOpt1 || '',
        codeRemark:      r.codeRemark || '',
        rowStatus:       r._row_status === 'N' ? 'I' : r._row_status,
      }));
      uiState.loading = true;
      try {
        await boApiSvc.syCode.saveList('base', rows, '상품옵션코드관리', '저장');
        _toast('저장되었습니다.');
        await handleLoad();
      } catch (e) {
        _toast(e.response?.data?.message || '저장 실패', 'error', 0);
      } finally { uiState.loading = false; }
    };

    const onReorder = async () => {
      const rows = gridRows.value;
      const sortChanged = [];
      rows.forEach((r, i) => {
        if ((r.sortOrd || 0) !== i + 1) {
          r.sortOrd = i + 1;
          if (r._row_status !== 'I' && r.codeId) {
            sortChanged.push({ codeId: r.codeId, sortOrd: i + 1, rowStatus: 'U' });
            if (r._row_status === 'N') r._row_status = 'U';
          }
        }
      });
      if (sortChanged.length) {
        try {
          await boApiSvc.syCode.saveList('order', sortChanged, '상품옵션코드관리', '순서변경');
          _toast('순서가 저장되었습니다.');
          await handleLoad();
        } catch (e) {
          _toast(e.response?.data?.message || '순서 저장 실패', 'error', 0);
        }
      }
    };

    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.value.filter(r => r._row_status !== 'D'),
      [
        { label: '코드값', key: 'codeValue' }, { label: '코드명', key: 'codeLabel' },
        { label: '레벨', key: 'codeLevel' }, { label: '상위코드', key: 'parentCodeValue' },
        { label: '순서', key: 'sortOrd' }, { label: '사용', key: 'useYn' },
        { label: '스타일', key: 'codeOpt1' }, { label: '비고', key: 'codeRemark' },
      ],
      '상품옵션코드.csv'
    );

    // 트리 노드 색상 헬퍼
    const fnLvColor = (l) => ({ 1: '#e8587a', 2: '#1677ff', 3: '#3ba87a' }[l] || '#999');

    /* ##### [06] return (템플릿 노출) ############################################ */

    return {
      sel, uiState, treeExpanded, allRows, gridRows, gridColumns,
      level1Nodes, level2Of, level3Of, levelLabel, breadcrumb, childLevel,
      handleBtnAction, handleSelectAction, handleGridCellAction,
      deleteRow, cancelRow, fnLvColor,
    };
  },
  template: /* html */`
<div style="display:flex;flex-direction:column;height:100vh;background:#f5f6fa;">

  <!-- ▼ 토스트 -->
  <div id="popup-toast" style="display:none;position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.18);"></div>

  <!-- ▼ 페이지 헤더 -->
  <div style="padding:11px 20px 9px;background:#fff;border-bottom:1px solid #eee;flex-shrink:0;display:flex;align-items:baseline;gap:10px;">
    <span class="list-title" style="font-size:16px;">상품 옵션 코드 관리</span>
    <span style="font-size:12px;color:#bbb;">PROD_OPT_CATEGORY 공통코드 계층 관리</span>
  </div>

  <!-- ▼ 본문: 트리 + 그리드 -->
  <div class="bo-2col" style="flex:1;overflow:hidden;margin:12px;gap:12px;align-items:flex-start;">

    <!-- ■ 좌측 트리 패널 -->
    <div class="card" style="min-width:210px;max-width:230px;overflow:hidden;display:flex;flex-direction:column;height:calc(100vh - 94px);">

      <!-- 트리 헤더 -->
      <div class="toolbar" style="padding:6px 10px;border-bottom:1px solid #f0f0f0;flex-shrink:0;display:flex;align-items:center;gap:4px;">
        <span class="list-title" style="font-size:12px;flex:1;">코드 트리</span>
        <button class="btn btn-xs btn-secondary" style="padding:2px 5px;font-size:13px;line-height:1;"
          @click="handleBtnAction('tree-expand-all')" title="전체펼치기">⊞</button>
        <button class="btn btn-xs btn-secondary" style="padding:2px 5px;font-size:13px;line-height:1;"
          @click="handleBtnAction('tree-collapse-all')" title="전체접기">⊟</button>
      </div>

      <!-- 트리 본문 -->
      <div style="flex:1;overflow-y:auto;padding:4px 0;user-select:none;">

        <!-- Root 노드 -->
        <div class="tree-node"
          :class="{ 'tree-node-selected': !sel.node }"
          style="padding:7px 10px;display:flex;align-items:center;gap:5px;cursor:pointer;"
          @click="handleBtnAction('tree-root')">
          <span style="font-size:14px;line-height:1;color:#f59e0b;">🗂</span>
          <span style="font-weight:700;font-size:13px;flex:1;">Root</span>
          <span class="badge badge-gray" style="font-size:10px;">{{ level1Nodes.length }}</span>
        </div>

        <!-- 1레벨 노드 (펼치기/접기) -->
        <template v-for="n1 in level1Nodes" :key="n1.codeValue">
          <!-- 1레벨 행 -->
          <div class="tree-node"
            :class="{ 'tree-node-selected': sel.node ? (sel.node.codeValue === n1.codeValue ? sel.node.codeLevel === 1 : false) : false }"
            style="padding:5px 8px 5px 8px;display:flex;align-items:center;gap:4px;cursor:pointer;">
            <!-- 토글 아이콘 (폴더 펼침/접힘) -->
            <span style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;color:#999;"
              @click.stop="handleBtnAction('tree-toggle', n1.codeValue)">
              {{ treeExpanded.has(n1.codeValue) ? '▼' : '▶' }}
            </span>
            <!-- 폴더 아이콘 + 라벨 (클릭 시 선택) -->
            <span style="font-size:13px;line-height:1;flex-shrink:0;"
              @click="handleSelectAction('tree-select', n1)">
              {{ treeExpanded.has(n1.codeValue) ? '📂' : '📁' }}
            </span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;"
              @click="handleSelectAction('tree-select', n1)">{{ n1.codeLabel }}</span>
            <span class="badge badge-gray" style="font-size:10px;flex-shrink:0;"
              @click="handleSelectAction('tree-select', n1)">{{ level2Of(n1.codeValue).length }}</span>
          </div>

          <!-- 2레벨 — treeExpanded에 있을 때 펼침 -->
          <template v-if="treeExpanded.has(n1.codeValue)">
            <div v-for="n2 in level2Of(n1.codeValue)" :key="n2.codeValue"
              class="tree-node"
              :class="{ 'tree-node-selected tree-node-lv2': sel.node ? (sel.node.codeValue === n2.codeValue ? sel.node.codeLevel === 2 : false) : false,
                        'tree-node-lv2-plain':               sel.node ? (sel.node.codeValue === n2.codeValue ? sel.node.codeLevel !== 2 : true) : true }"
              style="padding:4px 8px 4px 30px;display:flex;align-items:center;gap:4px;cursor:pointer;"
              @click="handleSelectAction('tree-select', n2)">
              <span style="font-size:12px;line-height:1;flex-shrink:0;color:#aaa;">📄</span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;">{{ n2.codeLabel }}</span>
              <span v-if="level3Of(n2.codeValue).length > 0" class="badge badge-gray" style="font-size:10px;flex-shrink:0;">{{ level3Of(n2.codeValue).length }}</span>
            </div>
            <div v-if="!level2Of(n1.codeValue).length"
              style="padding:3px 8px 3px 30px;font-size:11px;color:#ccc;font-style:italic;">
              하위 없음
            </div>
          </template>
        </template>

        <div v-if="!level1Nodes.length" style="padding:20px;color:#bbb;font-size:12px;text-align:center;">
          코드 없음
        </div>
      </div>
    </div>

    <!-- ■ 우측 그리드 영역 -->
    <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;gap:8px;min-width:0;">

      <!-- 브레드크럼 바 -->
      <div class="card" style="padding:7px 14px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <!-- 좌: 경로 라벨 -->
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
          <span style="font-weight:700;color:#e8587a;font-size:13px;">Root</span>
          <template v-if="breadcrumb">
            <template v-for="(crumb, i) in breadcrumb" :key="i">
              <span v-if="crumb.code !== null" style="color:#ccc;font-size:12px;">›</span>
              <span v-if="crumb.code !== null"
                :style="i === breadcrumb.length - 1 ? 'font-weight:700;color:#e8587a;font-size:13px;' : 'color:#555;font-size:12px;'">
                {{ crumb.label }}
              </span>
            </template>
          </template>
          <span style="color:#999;font-size:11px;margin-left:4px;">
            ▶ <b>{{ levelLabel }}</b> 관리
            <span style="margin-left:4px;">({{ gridRows.filter(r => r._row_status !== 'D').length }}건)</span>
          </span>
        </div>
        <!-- 우: 코드 경로 (code1 > code2) -->
        <div v-if="breadcrumb" style="display:flex;align-items:center;gap:3px;font-family:monospace;font-size:11px;color:#aaa;flex-shrink:0;">
          <template v-for="(crumb, i) in breadcrumb" :key="'c' + i">
            <span v-if="crumb.code !== null">
              <span v-if="i > 0" style="margin:0 3px;color:#ddd;">&gt;</span>
              <span style="background:#f3f4f6;padding:1px 6px;border-radius:4px;color:#666;">{{ crumb.code }}</span>
            </span>
          </template>
        </div>
      </div>

      <!-- CRUD 그리드 -->
      <bo-grid-crud
        :columns="gridColumns"
        :rows="gridRows"
        row-key="codeId"
        :list-title="levelLabel + ' 목록'"
        :draggable="true"
        :show-export="true"
        :show-row-id="false"
        :show-row-status="false"
        :max-height="'calc(100vh - 190px)'"
        :empty-text="'[+ 행추가] 버튼으로 추가하세요.'"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="handleBtnAction('grid-add')"
        @save="handleBtnAction('grid-save')"
        @delete-checked="handleBtnAction('grid-deleteChecked')"
        @cancel-checked="handleBtnAction('grid-cancelChecked')"
        @export="handleBtnAction('grid-excel')"
        @reorder="handleSelectAction('grid-reorder')"
        grid-id="grid-cellChange"
        @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <!-- codeOpt1 색상 미리보기 -->
        <template #cell-codeOpt1="{ row }">
          <td>
            <div style="display:flex;align-items:center;gap:4px;">
              <span v-if="row.codeOpt1 ? row.codeOpt1.startsWith('#') : false"
                :style="'display:inline-block;width:13px;height:13px;border-radius:3px;border:1px solid #ddd;background:' + row.codeOpt1 + ';flex-shrink:0;'">
              </span>
              <input class="grid-input" v-model="row.codeOpt1" placeholder="#hex or class"
                :disabled="row._row_status === 'D'"
                @input="handleGridCellAction('grid-cellChange', 'codeOpt1', row)"
                style="flex:1;font-family:monospace;font-size:12px;" />
            </div>
          </td>
        </template>
        <!-- 관리 버튼 -->
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row"
            @cancel="cancelRow(row)"
            @delete="deleteRow(row)" />
        </template>
      </bo-grid-crud>
    </div>

  </div>
</div>`,
};

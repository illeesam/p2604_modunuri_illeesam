/* ShopJoy Admin - 공통 선택/조회 팝업 (BoPickModal)
 *
 * BO 전 화면의 선택 팝업을 이 컴포넌트 하나로 대체한다.
 * 화면 구성(조회항목·목록컬럼·트리 여부·다중선택)은 서버의 cm_popup / cm_popup_item
 * 메타에서 내려오므로, 새 팝업이 필요하면 테이블에 행만 추가하면 된다.
 *
 * ■ 화면패턴 (cm_popup.popup_pattern) — "어떤 영역이 있는가"만 결정한다
 *   1) 조회영역 + 목록
 *   2) 조회영역 + (좌)트리 + (우)목록      … 트리는 목록을 좁히는 필터
 *   3) 조회영역 + 트리                     … 트리 전용. 노드 자체를 고른다(부서·메뉴·카테고리 등)
 *
 * ■ 다중선택 — 패턴과 무관한 별개의 스위치
 *   같은 "사용자 선택" 팝업이라도 화면에 따라 1건만 고르기도 하고 여러 건을 고르기도 한다.
 *   즉 다중 여부는 팝업의 성질이 아니라 호출부의 옵션이므로 :multi prop 이 최우선이고,
 *   cm_popup.multi_yn 은 호출부가 지정하지 않았을 때 쓰는 기본값일 뿐이다.
 *   다중선택이면 하단에 선택목록(칩) 영역이 자동으로 붙는다 — 패턴에 넣지 않는다.
 *
 * 사용:
 *   <bo-pick-modal popup-code="user" @select="onPickUser" @close="modal.user = false" />
 *   <bo-pick-modal popup-code="user" :multi="true" :exclude-ids="usedIds"
 *     @select="onPickUsers" @close="modal.user = false" />
 *
 * emit('select', row)   — 단일선택 : 행 1건 (id/nm + 엔티티 원본 필드명 그대로)
 * emit('select', rows)  — 다중선택 : 행 배열
 */
window.BoPickModal = {
  name: 'BoPickModal',
  props: {
    popupCode:  { type: String,  required: true },                // cm_popup.popup_code
    show:       { type: Boolean, default: true },                 // 표시 여부
    title:      { type: String,  default: '' },                   // 제목 override (미지정 시 메타의 popup_nm)
    multi:      { type: Boolean, default: null },                 // 다중선택 override (미지정 시 메타의 multi_yn)
    excludeIds: { type: Array,   default: () => ([]) },           // 이미 선택된 ID (목록에서 제외)
    initParam:  { type: Object,  default: () => ({}) },           // 고정 추가 검색조건
    clearable:  { type: Boolean, default: false },                // 트리 전용에서 "선택 안함" 노출
    /* 토글 모드 — 배열을 주면 각 행에 체크 상태가 표시되고, 클릭 시 모달을 닫지 않고
       toggle 을 emit 한다. 부모가 목록을 갱신해 다시 내려주면 체크 상태가 따라 바뀐다.
       (체크박스로 여러 건을 켰다 껐다 하는 기존 상품/카테고리 선택 UX) */
    selectedIds: { type: Array,  default: null },
    /* 팝업관리 미리보기용 — 켜면 조회할 때마다 api-log 를 올린다(모달에는 표시 안 함) */
    debug:       { type: Boolean, default: false },
    /* 호출 식별자. response 응답정보에 그대로 실려 돌아온다 (여러 팝업을 한 화면에서 쓸 때 분기용) */
    popupCmd:    { type: String,  default: '' },
  },
  emits: ['select', 'toggle', 'close', 'api-log', 'response'],
  setup(props, { emit }) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, watch } = Vue;

    const cfg = reactive({
      popupNm: '', popupPattern: 1, multiYn: 'N', pagingYn: 'Y', pageSize: 10, modalWidth: '900px',
      idField: '', nmField: '', hasTree: false, searchCols: [], listCols: [],
    });
    const uiState = reactive({ loading: false, ready: false, initing: false, errorMsg: '' });

    /* 어떤 파라미터로 무엇을 조회했는지 부모에게만 알린다(팝업관리 미리보기 패널).
       모달 자체에는 표시하지 않는다 — 실제 사용 화면에서 보일 이유가 없다. */
    /* 마지막으로 조회에 사용한 파라미터 — 응답정보에 그대로 돌려준다 */
    const lastParams = reactive({ page: null, tree: null });

    /**
     * 응답정보 — 호출부가 "무엇을 어떤 조건으로 골랐는지" 한 번에 받도록 감싼 결과.
     * select/toggle 은 기존 계약(행 그대로)이라 건드리지 않고, 이 이벤트를 추가로 올린다.
     */
    const fnEmitResponse = (action, result) => {
      emit('response', {
        cmd: props.popupCmd || props.popupCode,   /* 호출 식별자 (미지정 시 팝업코드) */
        popupCode: props.popupCode,
        action,                                   /* select | toggle | clear */
        multi: cfIsMulti.value,
        params: {                                 /* 넘겨줬던 조회 파라미터 */
          page: lastParams.page,
          tree: lastParams.tree,
        },
        result,
        at: new Date().toLocaleTimeString(),
      });
    };

    const fnLog = (kind, params, count, ms) => {
      if (!props.debug) return;
      emit('api-log', {
        kind, params: JSON.parse(JSON.stringify(params || {})),
        count, ms, at: new Date().toLocaleTimeString(),
      });
    };

    const codeMap = reactive({});       /* codeGrp → [{codeValue, codeLabel}] (CODE 유형 항목용) */
    const rows = reactive([]);          /* 목록 */
    const treeRows = reactive([]);      /* 트리 원본(평면) */
    const picked = reactive([]);        /* 패턴3 / 다중선택 누적 */
    const expanded = reactive({});      /* 트리 펼침 상태 */

    const searchParam = reactive({ searchValue: '' });
    const gridPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100],
    });
    const treeState = reactive({ selectedId: null });

    const cfSiteId = computed(() => window.boCommonFilter?.siteId || '');
    /* 다중 여부는 호출부(:multi)가 최우선, 미지정 시 메타의 기본값 */
    const cfIsMulti = computed(() => props.multi !== null ? props.multi : cfg.multiYn === 'Y');
    const cfTitle = computed(() => props.title || cfg.popupNm || '선택');
    /* 패턴 2·3 = 트리 있음 / 패턴 3 = 트리 전용(목록 없음) */
    const cfHasTree = computed(() => cfg.popupPattern >= 2 && cfg.hasTree);
    const cfTreeOnly = computed(() => cfg.popupPattern === 3);
    const cfHasList = computed(() => !cfTreeOnly.value);
    /* 페이징을 끈 팝업은 페이저를 숨기고 한 번에 보여준다 (건수 적은 코드·사이트 등) */
    const cfHasPager = computed(() => cfg.pagingYn !== 'N');
    /* 토글 모드 — selectedIds 를 준 경우. 선택목록/다중 확정 대신 행 체크로 동작 */
    const cfIsToggle = computed(() => Array.isArray(props.selectedIds));
    const cfSelectedSet = computed(() => new Set((props.selectedIds || []).map(String)));
    /* 선택목록은 다중선택일 때만 — 패턴과 무관. 토글 모드는 자체 체크 UI 를 쓴다 */
    const cfHasPickList = computed(() => cfIsMulti.value && !cfIsToggle.value);

    /* 제외 ID — 부모가 넘긴 것만. 이번에 담은 항목은 목록에 그대로 두어
       선택 상태를 보여주고 다시 누르면 해제되게 한다. */
    const cfExcludeIds = computed(() => [...new Set((props.excludeIds || []).map(String))]);

    /* 이번에 담은 항목 (행 강조·체크 표시·토글 판정용) */
    const cfPickedSet = computed(() => new Set(picked.map(p => String(p.id))));
    /** 선택된 행인가 — 다중은 담은 목록, 토글 모드는 부모가 준 selectedIds 기준 */
    const fnIsPicked = (row) => {
      if (!row || row.id == null) return false;
      const key = String(row.id);
      return cfIsToggle.value ? cfSelectedSet.value.has(key) : cfPickedSet.value.has(key);
    };
    /** 선택된 행 배경 강조 */
    const fnRowStyle = (row) => fnIsPicked(row)
      ? 'background:#eff6ff;box-shadow:inset 3px 0 0 #2563eb;' : '';

    /* 트리: 평면 목록 → 들여쓰기 목록 (가시 노드만) */
    const cfTreeVisible = computed(() => {
      /* 필터로 부모가 결과에서 빠지면 자식이 통째로 사라지므로,
         부모를 못 찾은 노드는 루트로 끌어올려 반드시 보이게 한다. */
      const ids = new Set(treeRows.map(n => String(n.id)));
      const byParent = {};
      treeRows.forEach(n => {
        const raw = n.parentId == null || n.parentId === '' ? null : String(n.parentId);
        const pid = (raw && ids.has(raw)) ? raw : '__root__';
        (byParent[pid] = byParent[pid] || []).push(n);
      });
      const out = [];
      const walk = (pid, depth) => {
        (byParent[pid] || []).forEach(n => {
          const id = String(n.id);
          const kids = byParent[id] || [];
          out.push({ ...n, _depth: depth, _hasKids: kids.length > 0 });
          if (kids.length && expanded[id]) walk(id, depth + 1);
        });
      };
      walk('__root__', 0);
      return out;
    });

    /* 목록 컬럼 = 메타 listCols → BoGrid columns.
       type='CODE' 인 항목은 codeGrp 로 조회한 공통코드 라벨로 치환해 보여준다. */
    const cfGridColumns = computed(() => {
      const cols = (cfg.listCols || []).map(c => ({
        key: c.field,
        label: c.label,
        link: !!c.link,
        align: c.align || undefined,
        style: c.width ? `width:${c.width};` : undefined,
        fmt: fnCellFmt(c),
      }));
      /* link 지정이 하나도 없으면 표시명 필드를 선택 트리거로 */
      if (cols.length && !cols.some(c => c.link)) {
        const nmCol = cols.find(c => c.key === cfg.nmField) || cols[0];
        nmCol.link = true;
      }
      /* 토글 모드·다중선택은 맨 앞에 체크 상태 컬럼을 붙인다 */
      if (cfIsToggle.value || cfHasPickList.value) {
        cols.unshift({
          key: '_checked', label: '선택', align: 'center', style: 'width:56px;',
          fmt: (v, row) => fnIsPicked(row) ? '☑' : '☐',
        });
      }
      return cols;
    });

    /* 조회영역 컬럼 = 통합검색(LIKE 항목 OR) + EQ 항목은 개별 조건.
       EQ 항목이 CODE 유형이면 공통코드 드롭다운으로 렌더한다. */
    const cfSearchColumns = computed(() => {
      const out = [{ key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력' }];
      (cfg.searchCols || []).forEach(c => {
        if (c.searchType !== 'EQ') return;
        if (c.type === 'CODE') {
          out.push({
            key: c.field, label: c.label, type: 'select',
            nullLabel: c.label + ' 전체',
            options: () => (codeMap[c.codeGrp] || []).map(o => ({ value: o.codeValue, label: o.codeLabel })),
          });
        } else {
          out.push({ key: c.field, label: c.label, type: 'text', placeholder: c.label });
        }
      });
      return out;
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')  { gridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset') { fnResetSearch(); gridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'grid-setPage')      { gridPager.pageNo = param; return handleSearchList(); }
      if (cmd === 'grid-sizeChange')   { gridPager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'picked-clear')      { picked.splice(0, picked.length); return; }
      if (cmd === 'picked-remove')     { fnUnpick(param); return; }
      if (cmd === 'modal-confirm')     return handleConfirm();
      if (cmd === 'modal-close')       return emit('close');
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleSelectAction = (cmd, param) => {
      if (cmd === 'tree-select') {
        /* 트리 전용(패턴3)은 노드 클릭이 곧 선택. 그 외에는 목록을 좁히는 필터 */
        if (cfTreeOnly.value) return handlePickRow(fnTreeRow(param));
        treeState.selectedId = param;
        gridPager.pageNo = 1;
        return handleSearchList();
      }
      if (cmd === 'tree-all')        { treeState.selectedId = null; gridPager.pageNo = 1; return handleSearchList(); }
      /* 트리 전용 선택 해제 — 호출부가 원본 필드명(deptId/deptNm 등)을 읽으므로 빈 값으로 채워 넘긴다 */
      if (cmd === 'tree-clear') {
        const empty = { id: null, nm: '' };
        if (cfg.idField) empty[cfg.idField] = null;
        if (cfg.nmField) empty[cfg.nmField] = '';
        emit('select', empty);
        fnEmitResponse('clear', empty);
        return emit('close');
      }
      if (cmd === 'tree-toggle')     { expanded[param] = !expanded[param]; return; }
      if (cmd === 'tree-expandAll')  { cfTreeVisible.value; treeRows.forEach(n => { expanded[String(n.id)] = true; }); return; }
      if (cmd === 'tree-collapseAll'){ Object.keys(expanded).forEach(k => { expanded[k] = false; }); return; }
      if (cmd === 'row-pick')        return handlePickRow(param);
      /* 토글 모드 — 닫지 않고 알린다. 체크 상태는 부모가 selectedIds 로 다시 내려준다 */
      if (cmd === 'row-toggle')      { emit('toggle', param); return fnEmitResponse('toggle', param); }
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'pickGrid-cellClick') {
        /* 토글 모드는 어느 셀을 눌러도 체크/해제 (체크박스 목록처럼 동작) */
        if (cfIsToggle.value) return handleSelectAction('row-toggle', row);
        /* 다중선택도 마찬가지 — 담기/빼기를 같은 클릭으로 */
        if (cfHasPickList.value) return handleSelectAction('row-pick', row);
        if (colKey === 'btn_row_select' || (e.col ? e.col.link : false) || colKey === '__no__') {
          return handleSelectAction('row-pick', row);
        }
        return;
      }
      console.warn('[handleGridCellAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 ######################################################### */

    /* 부모가 :show 로 제어하는 경우 컴포넌트는 화면 진입과 함께 마운트되므로,
       열릴 때까지 조회를 미룬다 (닫힌 팝업이 매번 API 를 때리지 않도록). */
    const fnInit = async () => {
      if (uiState.ready || uiState.initing) return;
      uiState.initing = true;
      try {
        const cfgParam = { siteId: cfSiteId.value };
        const t0 = Date.now();
        const res = await boApiSvc.cmPick.getConfig(props.popupCode, cfgParam, '선택팝업', '구성조회');
        const d = res.data?.data || {};
        fnLog('config', cfgParam, (d.listCols || []).length, Date.now() - t0);
        Object.assign(cfg, {
          popupNm: d.popupNm || '', popupPattern: d.popupPattern || 1,
          multiYn: d.multiYn || 'N', pagingYn: d.pagingYn || 'Y', pageSize: d.pageSize || 10,
          modalWidth: d.modalWidth || '900px', idField: d.idField || 'id',
          nmField: d.nmField || 'nm', hasTree: !!d.hasTree,
          searchCols: d.searchCols || [], listCols: d.listCols || [],
        });
        gridPager.pageSize = cfg.pageSize;
        await handleSearchCodes();
        uiState.ready = true;
        if (cfHasTree.value) await handleSearchTree();
        if (cfHasList.value) await handleSearchList();
      } catch (err) {
        uiState.errorMsg = err.response?.data?.message || err.message || '팝업 구성을 불러오지 못했습니다.';
      } finally {
        uiState.initing = false;
      }
    };

    onMounted(() => { if (props.show) fnInit(); });
    watch(() => props.show, (v) => { if (v) fnInit(); });

    /* ##### [04] 내장 사용 함수 #################################################### */

    const fnResetSearch = () => {
      Object.keys(searchParam).forEach(k => { searchParam[k] = ''; });
      searchParam.searchValue = '';
      treeState.selectedId = null;
    };

    /** 트리 노드 ID → 원본 행 (트리 전용 패턴에서 선택 payload 로 사용) */
    const fnTreeRow = (id) => treeRows.find(n => String(n.id) === String(id)) || null;

    /** 트리 노드 ID → 자신 + 모든 하위 노드 ID */
    const fnSubtreeIds = (rootId) => {
      const byParent = {};
      treeRows.forEach(n => {
        const pid = n.parentId == null || n.parentId === '' ? '__root__' : String(n.parentId);
        (byParent[pid] = byParent[pid] || []).push(String(n.id));
      });
      const out = [];
      const walk = (id) => { out.push(id); (byParent[id] || []).forEach(walk); };
      walk(String(rootId));
      return out;
    };

    const fnBuildParam = () => {
      const p = { siteId: cfSiteId.value, ...(props.initParam || {}) };
      Object.keys(searchParam).forEach(k => { if (searchParam[k]) p[k] = searchParam[k]; });
      /* 트리 노드 선택 → 노드 자신 + 하위 전체를 목록에 표시 (리프 클릭 시 빈 목록 방지) */
      if (treeState.selectedId) p.idIn = fnSubtreeIds(treeState.selectedId).join('^');
      const ex = cfExcludeIds.value;
      if (ex.length) p.excludeIds = ex.join('^');
      p.pageNo = gridPager.pageNo;
      p.pageSize = gridPager.pageSize;
      return p;
    };

    /** CODE 유형 항목의 codeGrp 공통코드를 한 번에 적재 (라벨 표시 + 검색 드롭다운용) */
    const handleSearchCodes = async () => {
      const grps = [...new Set([...(cfg.listCols || []), ...(cfg.searchCols || [])]
        .filter(c => c.type === 'CODE' && c.codeGrp)
        .map(c => c.codeGrp))];
      if (!grps.length) return;
      await Promise.all(grps.map(async (g) => {
        try {
          const res = await coApiSvc.syCode.getGrpCodes(g, '선택팝업', '코드조회');
          codeMap[g] = res.data?.data || [];
        } catch (err) {
          codeMap[g] = [];   /* 코드 조회 실패는 팝업 자체를 막지 않는다 — 원본 코드값으로 표시 */
        }
      }));
    };

    /** 필드유형별 셀 표시 포맷 — CODE=코드라벨 / NUMBER=천단위 / DATE=yyyy-MM-dd HH:mm */
    const fnCellFmt = (c) => {
      if (c.type === 'CODE')   return (v) => fnCodeLabel(c.codeGrp, v);
      if (c.type === 'NUMBER') return (v) => (v == null || v === '') ? '' : Number(v).toLocaleString();
      /* cofDatetimeNorm 은 input[datetime-local] 용이라 T 를 남긴다 — 표시용은 공백으로 */
      if (c.type === 'DATE')   return (v) => String(v || '').replace('T', ' ').slice(0, 16);
      return undefined;
    };

    /** 코드값 → 라벨 (미등록이면 원본 코드값 그대로) */
    const fnCodeLabel = (grp, v) => {
      if (v == null || v === '') return '';
      const hit = (codeMap[grp] || []).find(o => String(o.codeValue) === String(v));
      return hit ? (hit.codeLabel || hit.codeNm || v) : v;
    };

    const handleSearchList = async () => {
      if (!uiState.ready) return;
      uiState.loading = true;
      try {
        const listParam = fnBuildParam();
        const t0 = Date.now();
        const res = await boApiSvc.cmPick.getPage(props.popupCode, listParam, '선택팝업', '조회');
        const d = res.data?.data || {};
        lastParams.page = JSON.parse(JSON.stringify(listParam));
        fnLog('page', listParam, d.pageTotalCount || 0, Date.now() - t0);
        rows.splice(0, rows.length, ...(d.pageList || []));
        gridPager.pageTotalCount = d.pageTotalCount || 0;
        gridPager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        window.boApp?.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const handleSearchTree = async () => {
      try {
        /* 고정 필터(initParam)는 트리에도 걸어야 목록과 범위가 어긋나지 않는다
           (예: 표시경로 팝업의 bizCd — 해당 업무의 경로만 보여야 한다) */
        const treeParam = { siteId: cfSiteId.value, ...(props.initParam || {}) };
        const t0 = Date.now();
        const res = await boApiSvc.cmPick.getTree(props.popupCode, treeParam, '선택팝업', '트리조회');
        const list = res.data?.data || [];
        lastParams.tree = JSON.parse(JSON.stringify(treeParam));
        fnLog('tree', treeParam, list.length, Date.now() - t0);
        treeRows.splice(0, treeRows.length, ...list);
        /* 최상위는 기본 펼침 */
        treeRows.filter(n => n.parentId == null || n.parentId === '')
          .forEach(n => { expanded[String(n.id)] = true; });
      } catch (err) {
        window.boApp?.showToast(err.response?.data?.message || err.message || '트리 조회 오류', 'error', 0);
      }
    };

    /* 행 선택 — 단일이면 즉시 확정, 다중이면 선택목록에 누적 */
    const handlePickRow = (row) => {
      if (!row) return;
      if (!cfIsMulti.value) {
        emit('select', row);
        fnEmitResponse('select', row);
        emit('close');
        return;
      }
      /* 이미 담긴 항목을 다시 누르면 해제 */
      const i = picked.findIndex(p => String(p.id) === String(row.id));
      if (i >= 0) picked.splice(i, 1);
      else picked.push(row);
    };

    const fnUnpick = (row) => {
      const i = picked.findIndex(p => String(p.id) === String(row.id));
      if (i >= 0) picked.splice(i, 1);
    };

    const handleConfirm = () => {
      if (cfHasPickList.value) {
        if (!picked.length) return window.boApp?.showToast('선택된 항목이 없습니다.', 'error');
        const rows = picked.slice();
        emit('select', rows);
        fnEmitResponse('select', rows);
      }
      emit('close');
    };

    /* ##### [05] 사용자 함수 ####################################################### */

    /** 펼침 화살표 — 자식 없으면 공백 */
    const fnTreeArrow = (n) => {
      if (!n._hasKids) return '';
      return expanded[String(n.id)] ? '▼' : '▶';
    };

    /** 노드 아이콘 — 하위가 있으면 폴더(펼침 상태 반영), 없으면 문서 */
    const fnTreeNodeIcon = (n) => {
      if (!n._hasKids) return '📄';
      return expanded[String(n.id)] ? '📂' : '📁';
    };

    /* 트리 전용이면 트리가 전체 폭, 트리+목록이면 좌 240px 2열 */
    const cfTreeLayoutStyle = computed(() =>
      (cfHasTree.value && cfHasList.value) ? 'display:grid;grid-template-columns:240px 1fr;gap:0 12px;' : '');
    const cfTreeCardStyle = computed(() =>
      cfTreeOnly.value ? 'padding:10px;max-height:56vh;overflow:auto;' : 'padding:10px;max-height:46vh;overflow:auto;');

    const fnTreeNodeStyle = (n) => {
      const base = 'display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:12px;'
        + `padding-left:${6 + n._depth * 14}px;`;
      /* 다중선택은 "담긴 노드"를, 단일/필터는 "현재 노드"를 강조한다 */
      if (fnIsPicked(n)) return base + 'background:#dbeafe;color:#1d4ed8;font-weight:700;';
      if (String(treeState.selectedId) === String(n.id)) return base + 'outline:2px solid #2563eb;background:#eff6ff;font-weight:700;';
      return base;
    };

    /* ##### [06] return ############################################################ */

    return {
      cfg, uiState, rows, picked, searchParam, gridPager, treeState,
      cfIsMulti, cfTitle, cfHasTree, cfTreeOnly, cfHasList, cfHasPickList, cfHasPager, cfIsToggle, cfSelectedSet,
      cfGridColumns, cfSearchColumns, cfTreeVisible, cfTreeLayoutStyle, cfTreeCardStyle,
      cfPickedSet, fnIsPicked, fnRowStyle,
      fnTreeArrow, fnTreeNodeIcon, fnTreeNodeStyle, handleBtnAction, handleSelectAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-modal :show="show" :title="cfTitle" :width="cfg.modalWidth" max-width="96vw"
  @close="handleBtnAction('modal-close')">
  <div v-if="uiState.errorMsg" style="padding:24px;text-align:center;color:#dc2626;">
    {{ uiState.errorMsg }}
  </div>
  <template v-else>
    <!-- 1단 조회영역 -->
    <bo-search-area :loading="uiState.loading" :columns="cfSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />

    <!-- 2단 트리 / 목록 (패턴3=트리 전용이면 목록 없이 트리만 전체 폭) -->
    <div :style="cfTreeLayoutStyle">
      <div v-if="cfHasTree" class="card" :style="cfTreeCardStyle">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:600;color:#555;">📂 {{ cfTreeOnly ? cfTitle : '분류' }}</span>
          <div style="display:flex;gap:4px;">
            <button class="btn btn_expand_all btn-xs" @click="handleSelectAction('tree-expandAll')">펼침</button>
            <button class="btn btn_collapse_all btn-xs" @click="handleSelectAction('tree-collapseAll')">접기</button>
          </div>
        </div>
        <div v-if="!cfTreeOnly"
          :style="treeState.selectedId ? 'font-size:12px;padding:4px 6px;cursor:pointer;color:#1677ff;' : 'font-size:12px;padding:4px 6px;cursor:pointer;outline:2px solid #2563eb;border-radius:4px;font-weight:700;'"
          @click="handleSelectAction('tree-all')">📁 전체</div>
        <!-- 트리 전용에서 선택 해제 (상위 없음 / 미지정) -->
        <div v-if="cfTreeOnly ? clearable : false"
          style="font-size:12px;padding:4px 6px;cursor:pointer;color:#1677ff;border-bottom:1px solid #eee;margin-bottom:4px;"
          @click="handleSelectAction('tree-clear')">📁 선택 안함 (최상위)</div>
        <div v-for="n in cfTreeVisible" :key="n.id" :style="fnTreeNodeStyle(n)"
          @click="handleSelectAction('tree-select', n.id)">
          <span style="width:12px;flex-shrink:0;color:#94a3b8;font-size:10px;"
            @click.stop="handleSelectAction('tree-toggle', String(n.id))">
            {{ fnTreeArrow(n) }}
          </span>
          <span style="width:16px;flex-shrink:0;">{{ fnTreeNodeIcon(n) }}</span>
          <span>{{ n.nm }}</span>
          <span v-if="fnIsPicked(n)" style="margin-left:auto;color:#2563eb;font-weight:700;">✓</span>
        </div>
        <div v-if="!cfTreeVisible.length" style="padding:12px;text-align:center;color:#aaa;font-size:12px;">
          표시할 항목이 없습니다.
        </div>
      </div>

      <div v-if="cfHasList">
        <bo-grid :columns="cfGridColumns" :rows="rows" row-key="id" :loading="uiState.loading"
          :pager="gridPager" empty-text="조회 결과가 없습니다." :row-style="fnRowStyle"
          grid-id="pickGrid-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" />
        <bo-pager v-if="cfHasPager" :pager="gridPager"
          :on-set-page="n => handleBtnAction('grid-setPage', n)"
          :on-size-change="() => handleBtnAction('grid-sizeChange')" />
      </div>
    </div>

    <!-- 3단 선택목록 -->
    <div v-if="cfHasPickList" class="card" style="padding:10px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="list-title" style="font-size:12px;">선택 목록 <span style="color:#e8587a;">{{ picked.length }}</span>건</span>
        <button v-if="picked.length" class="btn btn_uncheck_all btn-xs"
          @click="handleBtnAction('picked-clear')">전체 해제</button>
      </div>
      <div v-if="!picked.length" style="padding:10px;text-align:center;color:#aaa;font-size:12px;">
        목록에서 클릭해 선택하세요.
      </div>
      <div v-else style="display:flex;flex-wrap:wrap;gap:6px;">
        <span v-for="p in picked" :key="p.id"
          style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid #ddd;border-radius:14px;font-size:12px;background:#f8fafc;">
          {{ p.nm }}
          <span style="cursor:pointer;color:#dc2626;font-weight:700;"
            @click="handleBtnAction('picked-remove', p)">✕</span>
        </span>
      </div>
    </div>
  </template>

  <template #footer>
    <button v-if="cfHasPickList" class="btn btn_select" @click="handleBtnAction('modal-confirm')">
      선택 ({{ picked.length }})
    </button>
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">닫기</button>
  </template>
</bo-modal>
`,
};

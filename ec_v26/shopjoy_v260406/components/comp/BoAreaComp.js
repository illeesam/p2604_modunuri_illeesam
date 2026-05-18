/**
 * BoAreaComp.js — 관리자 공통 "영역(Area)" 컴포넌트 (검색영역 + 그리드 패턴)
 *
 * ※ 모두 'Bo' prefix / 'bo-' 태그 사용. BoComp.js(개별 위젯)와 짝을 이루는 "영역" 단위 컴포넌트.
 *
 * 설계 방침: 하이브리드(config 배열 자동 렌더 + named slot override)
 *   - columns 배열만 넘기면 thead/tbody 자동 렌더 (badge / link / 정렬 / 인라인 input·select 내장)
 *   - 특수 셀은 #cell-{key} / #head 슬롯으로 덮어쓰기
 *   - 검색·페이징·정렬·CRUD 행상태(_row_status)는 부모 reactive 를 그대로 받아 in-place 갱신 → 기존 화면 호환
 *
 * ─ 제공 컴포넌트 ─────────────────────────────────────────────────────────
 *
 * BoSearchArea   — search-bar 검색영역 래퍼
 *                  슬롯에 검색필드를 그대로 넣고, [조회][초기화] 버튼·Enter 처리는 컴포넌트가 제공
 *                  emit: search, reset   (검색조건 변경 즉시조회 금지 정책 준수)
 *                  사용:
 *                    <bo-search-area @search="onSearch" @reset="onReset">
 *                      <label class="search-label">이름</label>
 *                      <input v-model="searchParam.searchValue" @keyup.enter="onSearch" />
 *                    </bo-search-area>
 *
 * BoGrid         — 서버 페이징 그리드 통합 컴포넌트 (구 BoGridReadonly + BoGridEdit)
 *                  유형①(조회전용) + 유형②(일부 에디트)를 옵션으로 통합.
 *                  · sortState 전달 → 헤더 클릭 정렬 활성 (구 Readonly)
 *                  · col.edit('text'|'number'|'date'|'select') → 인라인 입력 (구 Edit)
 *                  · draggable → 행 드래그 정렬 + reorder emit
 *                  · showSave → 툴바 [저장] 버튼 + save emit
 *                  · rowActions → 우측 행액션 컬럼(#row-actions 슬롯) 노출
 *                  props: columns, rows, pager, sortState, listTitle, rowClass,
 *                         rowStyle, draggable, showSave, rowActions, isExpanded …
 *                  emit:  set-page(n), size-change, sort(key), row-click(row),
 *                         save, row-remove(row), reorder
 *                  슬롯: #toolbar-actions, #head, #head-actions, #cell-{key},
 *                        #row-actions, #row-expand
 *                  ※ window.BoGridReadonly / window.BoGridEdit 는 BoGrid 의 별칭
 *                    (기존 화면 <bo-grid-readonly> / <bo-grid-edit> 무수정 호환)
 *
 * BoGridCrud     — CRUD 그리드 (전체 로드 / 페이징 없음 / 스크롤 480px / 행상태 N·I·U·D)
 *                  유형③: SyRole·SyBrand·SyBatch·SyDept·SyMenu·SyProp 류
 *                  rows 는 _row_status·_row_check·_row_org 를 가진 gridRows
 *                  행추가/삭제/취소/저장/드래그정렬/체크올 내장
 *                  고정컬럼 토글: draggable / showRowNo / showRowId / showRowStatus
 *                               / showRowCheck (체크OFF 시 행삭제·취소 버튼도 숨김)
 *                               / showAdd / showSave  ← 모두 기본 true
 *                  emit:  add, save, cancel-checked, delete-checked, reorder
 *                  슬롯: #toolbar-actions, #head, #cell-{key},
 *                        #row-actions(우측 행액션 1컬럼 — 취소·삭제·설정 등 한 셀에)
 *                        ※ 구 #row-cancel / #row-delete 는 #row-actions 없을 때
 *                          폴백 지원(기존 화면 무수정 호환)
 *
 * BoPathTreeCard — 좌측 트리 카드 래퍼 (card + 📂제목 + #bizCd + 전체보기 + 스크롤 + BoPathTree)
 *                  ~10개 sy 화면의 반복 트리 카드를 1줄로 대체. BoPathTree(API 자급자족)를 내장
 *                  props: bizCd, title, selected, showBizCd, allLabel, maxHeight
 *                  emit:  select(pathId)  ※ 전체보기 클릭 시 select(null)
 *                  사용: <bo-path-tree-card biz-cd="sy_brand" title="표시경로" :show-biz-cd="true"
 *                          :selected="uiState.selectedPath" @select="onPathSelect" />
 *
 * BoLocalTreeCard— 로컬 데이터 트리 카드 (card + 제목 + 전체보기 + 펼침/닫기 + 스크롤 + BoPathTreeNode)
 *                  cfTree(computed) 등 부모가 빌드한 트리를 받는다 (API 미사용)
 *                  props: node, expanded, selected, title, bizCd, expandable …
 *                  emit:  select(id), toggle(id), expand-all, collapse-all
 *                  슬롯: #filter (제목 아래 추가 필터 영역 — SyRole 역할구분 select 등)
 *
 * ─ columns 배열 스펙 (세 그리드 공통) ────────────────────────────────────
 *   { key, label,
 *     width,            // th style width (예: '80px')
 *     align,            // 'left' | 'center' | 'right' (기본 left)
 *     badge,            // true → coUtil.fnCodeBadge 류 자동, 또는 fn(row)=>'badge-green'
 *     link,             // true → title-link (클릭 시 row-click emit)
 *     sortKey,          // 정렬키 (지정 시 헤더 클릭 정렬, BoGridReadonly)
 *     edit,             // 'text'|'number'|'date'|'select' → 인라인 입력 (BoGridEdit/Crud)
 *     options,          // edit:'select' 일 때 [{codeValue,codeLabel}] 또는 [{value,label}]
 *     fmt,              // fn(value,row)=>표시문자열
 *     placeholder,      // edit input placeholder
 *     mono,             // true → 고정폭 폰트
 *   }
 *   특수 셀은 columns 에 두되 템플릿에서 <template #cell-{key}="{ row, idx, no }"> 로 override.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── BoSearchArea ───────────────────────────────────────────────────────── */
window.BoSearchArea = {
  name: 'BoSearchArea',
  props: {
    showActions: { type: Boolean, default: true },  // [조회][초기화] 버튼 노출
    searchLabel: { type: String,  default: '조회' },
    resetLabel:  { type: String,  default: '초기화' },
    loading:     { type: Boolean, default: false },
  },
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const onSearch = () => { if (!props.loading) emit('search'); };
    const onReset  = () => emit('reset');
    return { onSearch, onReset };
  },
  template: /* html */`
<div class="search-bar" @keyup.enter="onSearch">
  <slot></slot>
  <div v-if="showActions" class="search-actions">
    <slot name="actions-before"></slot>
    <button class="btn btn-primary" :disabled="loading" @click="onSearch">{{ searchLabel }}</button>
    <button class="btn btn-secondary btn-sm" @click="onReset">{{ resetLabel }}</button>
    <slot name="actions-after"></slot>
  </div>
</div>`,
};

/* ── 공통 헬퍼 (세 그리드 공유) ──────────────────────────────────────────── */
window._boAreaCompUtil = {
  /* 정렬·옵션 정규화 */
  normOptions(opts) {
    return (opts || []).map(o => ({
      value: o.value != null ? o.value : o.codeValue,
      label: o.label != null ? o.label : o.codeLabel,
    }));
  },
  /* 셀 표시값 */
  cellText(col, row) {
    const v = row ? row[col.key] : undefined;
    if (typeof col.fmt === 'function') return col.fmt(v, row);
    if (v == null) return '';
    return v;
  },
  /* badge class 산출 */
  badgeClass(col, row) {
    if (typeof col.badge === 'function') return col.badge(row);
    // coUtil.fnCodeBadge 가 있으면 위임 (공통코드 배지 표준)
    if (window.coUtil && typeof coUtil.fnCodeBadge === 'function' && col.codeGrp) {
      return coUtil.fnCodeBadge(col.codeGrp, row[col.key]);
    }
    return 'badge-gray';
  },
  /* th style 문자열 */
  thStyle(col) {
    if (col.style) return col.style;            // 원본 인라인 스타일 직접 지정 시 우선
    let s = '';
    if (col.width) s += 'width:' + col.width + ';';
    if (col.align) s += 'text-align:' + col.align + ';';
    return s;
  },
  tdStyle(col) {
    let s = 'font-size:12px;';
    if (col.align) s += 'text-align:' + col.align + ';';
    if (col.mono)  s += 'font-family:monospace;';
    return s;
  },
};

/* ── BoGrid — 서버 페이징 그리드 통합(구 BoGridReadonly + BoGridEdit) ──────────
 * 옵션 조합으로 두 유형을 모두 커버:
 *   · sortState 전달  → 헤더 클릭 정렬 (구 Readonly)
 *   · col.edit 지정   → 인라인 input/select (구 Edit)
 *   · draggable=true  → 행 드래그 정렬 + reorder emit
 *   · showSave=true   → 툴바 [저장] 버튼 + save emit
 *   · rowActions=true → 우측 행액션 컬럼(#row-actions 슬롯, 기본 ✕ 삭제) 노출
 * 기본값은 구 BoGridReadonly 동작과 동일(정렬 off·입력 off·드래그 off·저장 off·
 * 행액션 off) → <bo-grid-readonly> 사용 화면 무수정 호환.
 * ──────────────────────────────────────────────────────────────────────── */
window.BoGrid = {
  name: 'BoGrid',
  props: {
    columns:    { type: Array,  required: true },               // 컬럼 정의
    rows:       { type: Array,  default: () => [] },             // 목록(서버 페이징 결과)
    pager:      { type: Object, default: null },                 // BoPager 호환 reactive
    sortState:  { type: Object, default: null },                 // { sortKey, sortDir } reactive (지정 시 정렬 활성)
    listTitle:  { type: String, default: '목록' },               // toolbar 좌측 제목
    rowKey:     { type: String, default: null },                 // :key 필드 (없으면 idx)
    rowStyle:   { type: Function, default: null },               // (row,idx)=>style (행 강조 등 고유 UX 보존)
    rowClass:   { type: Function, default: null },               // (row,idx)=>class (행 상태 강조)
    countText:  { type: String,  default: null },                // 건수 커스텀 ('총 N건' 대신). null=기본
    isExpanded: { type: Function, default: null },               // (row,idx)=>bool. 행펼침 여부
    draggable:  { type: Boolean, default: false },               // 행 드래그 정렬
    showSave:   { type: Boolean, default: false },               // 툴바 [저장] 버튼
    saveLabel:  { type: String,  default: '저장' },              // 저장 버튼 라벨
    rowActions: { type: Boolean, default: false },               // 우측 행액션 컬럼 노출
    loading:    { type: Boolean, default: false },
    emptyText:  { type: String, default: '데이터가 없습니다.' },
  },
  emits: ['set-page', 'size-change', 'sort', 'row-click', 'save', 'row-remove', 'reorder'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;
    const cfTotal = Vue.computed(() => props.pager ? (props.pager.pageTotalCount || 0) : props.rows.length);

    const rowNo = (idx) => props.pager
      ? (props.pager.pageNo - 1) * props.pager.pageSize + idx + 1
      : idx + 1;

    const onSort = (col) => { if (col.sortKey) emit('sort', col.sortKey); };
    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

    /* 드래그 정렬 — rows 를 in-place splice 후 reorder emit */
    const dragSrc = Vue.ref(null);
    const onDragStart = (idx) => { if (props.draggable) dragSrc.value = idx; };
    const onDragOver  = (e, idx) => {
      if (!props.draggable || dragSrc.value === null || dragSrc.value === idx) return;
      e.preventDefault();
      const moved = props.rows.splice(dragSrc.value, 1)[0];
      props.rows.splice(idx, 0, moved);
      dragSrc.value = idx;
    };
    const onDragEnd = () => { if (dragSrc.value !== null) { dragSrc.value = null; emit('reorder'); } };

    const onRowClick = (row) => emit('row-click', row);
    const onSave     = () => emit('save');
    const onRemove   = (row) => emit('row-remove', row);
    const onSetPage  = (n) => emit('set-page', n);
    const onSizeChg  = () => emit('size-change');
    const fnRowStyle = (row, idx) => (typeof props.rowStyle === 'function' ? props.rowStyle(row, idx) : 'cursor:pointer');
    const fnRowClass = (row, idx) => (typeof props.rowClass === 'function' ? props.rowClass(row, idx) : (row._isNew ? 'status-I' : ''));
    const fnIsExpanded = (row, idx) => (typeof props.isExpanded === 'function' ? !!props.isExpanded(row, idx) : false);
    const cfColspan = Vue.computed(() => props.columns.length + 1);

    return { U, cfTotal, rowNo, onSort, sortIcon, sortActive, onDragStart, onDragOver, onDragEnd,
             onRowClick, onSave, onRemove, onSetPage, onSizeChg,
             fnRowStyle, fnRowClass, fnIsExpanded, cfColspan };
  },
  template: /* html */`
<div class="card">
  <div class="toolbar">
    <span class="list-title">{{ listTitle }} <span class="list-count">{{ countText != null ? countText : ('총 ' + cfTotal + '건') }}</span></span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <slot name="toolbar-actions"></slot>
      <button v-if="showSave" class="btn btn-primary btn-sm" @click="onSave">{{ saveLabel }}</button>
    </div>
  </div>

  <table class="bo-table" :class="{ 'crud-grid': draggable || showSave }">
    <thead>
      <tr>
        <th v-if="draggable" style="width:28px"></th>
        <th style="width:36px;text-align:center;">번호</th>
        <slot name="head">
          <th v-for="col in columns" :key="col.key"
              :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;white-space:nowrap;' : '')"
              @click="onSort(col)">
            {{ col.label }}
            <span v-if="col.sortKey"
                  :style="sortActive(col) ? 'color:#e8587a;font-weight:bold;' : 'color:#bbb;'">{{ sortIcon(col) }}</span>
          </th>
        </slot>
        <th v-if="rowActions" style="width:40px;text-align:center;"><slot name="head-actions">관리</slot></th>
        <slot v-else name="head-actions"></slot>
      </tr>
    </thead>
    <tbody>
      <template v-for="(row, idx) in rows" :key="rowKey ? row[rowKey] : idx">
        <tr :style="fnRowStyle(row, idx)" :class="fnRowClass(row, idx)"
            :draggable="draggable"
            @dragstart="onDragStart(idx)" @dragover="onDragOver($event, idx)" @dragend="onDragEnd">
          <td v-if="draggable" style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
          <td style="text-align:center;font-size:11px;color:#999;">{{ rowNo(idx) }}</td>
          <template v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="row" :idx="idx" :no="rowNo(idx)">
              <td :style="U.tdStyle(col)">
                <!-- 인라인 편집 셀 -->
                <input v-if="col.edit==='text'" class="form-control" v-model="row[col.key]"
                       :placeholder="col.placeholder" style="padding:2px 6px;font-size:12px;" />
                <input v-else-if="col.edit==='number'" type="number" class="form-control" v-model.number="row[col.key]"
                       style="padding:2px 6px;font-size:12px;width:80px;text-align:right;" />
                <input v-else-if="col.edit==='date'" type="date" class="form-control" v-model="row[col.key]"
                       style="padding:2px 4px;font-size:11px;width:130px;text-align:center;" />
                <select v-else-if="col.edit==='select'" class="form-control" v-model="row[col.key]"
                        style="padding:2px 4px;font-size:12px;">
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <!-- 표시 셀 -->
                <span v-else-if="col.link" class="title-link" @click="onRowClick(row)">{{ U.cellText(col, row) }}</span>
                <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, row)">{{ U.cellText(col, row) }}</span>
                <template v-else>{{ U.cellText(col, row) }}</template>
              </td>
            </slot>
          </template>
          <td v-if="rowActions" style="text-align:center">
            <slot name="row-actions" :row="row" :idx="idx">
              <button class="btn btn-danger btn-xs" @click="onRemove(row)">✕</button>
            </slot>
          </td>
          <slot v-else name="row-actions" :row="row" :idx="idx"></slot>
        </tr>
        <tr v-if="fnIsExpanded(row, idx)" class="bo-grid-expand-row">
          <slot name="row-expand" :row="row" :idx="idx" :colspan="cfColspan">
            <td :colspan="cfColspan"></td>
          </slot>
        </tr>
      </template>
      <tr v-if="!rows.length">
        <td :colspan="columns.length + (draggable ? 1 : 0) + (rowActions ? 1 : 0) + 2"
            style="text-align:center;padding:30px;color:#aaa">{{ emptyText }}</td>
      </tr>
    </tbody>
  </table>

  <bo-pager v-if="pager" :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChg" />
</div>`,
};

/* ── 하위호환 별칭 — 기존 화면 <bo-grid-readonly> / <bo-grid-edit> 무수정 ───── */
window.BoGridReadonly = window.BoGrid;
window.BoGridEdit = Object.assign({}, window.BoGrid, {
  name: 'BoGridEdit',
  /* 구 BoGridEdit 기본 동작 보존: 저장 버튼·행삭제 컬럼 기본 노출 */
  props: Object.assign({}, window.BoGrid.props, {
    showSave:   { type: Boolean, default: true },
    rowActions: { type: Boolean, default: true },
  }),
});

/* ── BoGridCrud — 유형③ CRUD 그리드(전체 로드 / 행상태 N·I·U·D) ──────────── */
window.BoGridCrud = {
  name: 'BoGridCrud',
  props: {
    columns:    { type: Array,  required: true },              // edit 셀 정의 포함
    rows:       { type: Array,  required: true },              // gridRows (_row_status/_row_check/_row_org)
    rowKey:     { type: String, required: true },              // PK 필드명 (예: 'brandId')
    listTitle:  { type: String, default: '목록' },
    maxHeight:  { type: String, default: '480px' },            // 스크롤 컨테이너 높이
    draggable:  { type: Boolean, default: true },              // 행 드래그 정렬 컬럼(⠿) 표시 + 드래그 동작
    checkAll:   { type: Boolean, default: false },             // 헤더 체크올 v-model 미러
    focusedIdx: { type: Number,  default: null },              // 행 포커스 인덱스 (v-model:focusedIdx, addRow 삽입 기준)
    showExport: { type: Boolean, default: false },             // 📥 엑셀 버튼 노출
    showRowNo:     { type: Boolean, default: true },           // 번호 컬럼 표시
    showRowId:     { type: Boolean, default: true },           // ID 컬럼 표시
    showRowStatus: { type: Boolean, default: true },           // 상태(N/I/U/D 뱃지) 컬럼 표시
    showRowCheck:  { type: Boolean, default: true },           // 체크박스 컬럼 + [행삭제][취소] 일괄버튼 표시
    showAdd:       { type: Boolean, default: true },           // [+ 행추가] 버튼 표시
    showSave:      { type: Boolean, default: true },           // [저장] 버튼 표시
    cellTitle:  { type: Function, default: null },             // (col)=>title 문자열 (local 모드 컬럼 hint)
    emptyText:  { type: String, default: '데이터가 없습니다.' },
    /* ── 트리 모드 ─ flatRows + rowAccessor 둘 다 주면 트리 분기 ─────────────
     *  flatRows    : 화면이 평탄화한 래퍼 배열 (예: [{node,depth},...])
     *  rowAccessor : (flatItem)=>실제 행객체(_row_status/_row_check 보유)
     *  treeRowKey  : (flatItem,idx)=>:key (없으면 idx)
     *  트리 모드는 번호/ID/드래그 컬럼 자동 비활성(개념 없음),
     *  셀은 전부 #cell-{key} 슬롯 위임. slot props: { node, row, idx } */
    flatRows:    { type: Array,    default: null },
    rowAccessor: { type: Function, default: null },
    treeRowKey:  { type: Function, default: null },
  },
  emits: ['add', 'save', 'cancel-checked', 'delete-checked', 'reorder', 'cell-change',
          'update:checkAll', 'update:focusedIdx', 'export'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;

    /* 트리 모드 = flatRows + rowAccessor 둘 다 제공된 경우만 */
    const cfTreeMode = Vue.computed(() =>
      Array.isArray(props.flatRows) && typeof props.rowAccessor === 'function');
    /* 화면이 순회할 표시 행 목록 (트리: flatRows / 일반: rows) */
    const cfDispRows = Vue.computed(() => cfTreeMode.value ? props.flatRows : props.rows);
    /* flatItem → 실제 행객체 (_row_status/_row_check 보유). 일반 모드는 자기 자신 */
    const fnRow = (item) => (cfTreeMode.value ? props.rowAccessor(item) : item);
    const fnRowKey = (item, idx) => {
      if (cfTreeMode.value) return typeof props.treeRowKey === 'function' ? props.treeRowKey(item, idx) : idx;
      return item[props.rowKey];
    };
    /* 트리 모드에서 자동 비활성화되는 고정컬럼 */
    const cfShowDrag = Vue.computed(() => props.draggable  && !cfTreeMode.value);
    const cfShowNo   = Vue.computed(() => props.showRowNo  && !cfTreeMode.value);
    const cfShowId   = Vue.computed(() => props.showRowId  && !cfTreeMode.value);

    const cfVisibleCount = Vue.computed(() =>
      props.rows.filter(r => r._row_status !== 'D').length);

    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* 일반: 순회 idx 그대로. 트리: rows(원본 gridRows) 기준 인덱스로 변환 emit
     * (부모 addRow 등이 focusedIdx 를 원본 배열 삽입기준으로 쓰는 계약 보존) */
    const onSetFocused = (idx) => {
      const out = cfTreeMode.value
        ? props.rows.indexOf(props.rowAccessor(props.flatRows[idx]))
        : idx;
      if (props.focusedIdx !== out) emit('update:focusedIdx', out);
    };
    const fnColTitle = (col) => (typeof props.cellTitle === 'function' ? props.cellTitle(col) : '');

    /* 빈 행 colspan = 데이터컬럼 + 표시중인 고정컬럼(drag/번호/ID/상태/체크) + 액션 1(row-actions) */
    const cfEmptyColspan = Vue.computed(() => {
      let n = props.columns.length + 1;            // 데이터 + 액션
      if (cfShowDrag.value)    n += 1;
      if (cfShowNo.value)      n += 1;
      if (cfShowId.value)      n += 1;
      if (props.showRowStatus) n += 1;
      if (props.showRowCheck)  n += 1;
      return n;
    });

    const allChecked = Vue.ref(props.checkAll);
    Vue.watch(() => props.checkAll, v => { allChecked.value = v; });
    const onToggleCheckAll = () => {
      const v = !allChecked.value;
      allChecked.value = v;
      /* 트리 모드: 화면에 펼쳐진 행(flatRows→accessor)만 토글 */
      if (cfTreeMode.value) props.flatRows.forEach(it => { props.rowAccessor(it)._row_check = v; });
      else props.rows.forEach(r => { r._row_check = v; });
      emit('update:checkAll', v);
    };

    /* 셀 변경 → _row_status 갱신(N↔U), 부모에 cell-change emit */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { emit('cell-change', row); return; }
      if (row._row_org) {
        const changed = Object.keys(row._row_org).some(f => String(row[f]) !== String(row._row_org[f]));
        row._row_status = changed ? 'U' : 'N';
      }
      emit('cell-change', row);
    };

    /* 드래그 정렬 */
    const dragSrc = Vue.ref(null);
    const dragMoved = Vue.ref(false);
    const onDragStart = (idx) => { if (props.draggable) { dragSrc.value = idx; dragMoved.value = false; } };
    const onDragOver  = (e, idx) => {
      if (!props.draggable || dragSrc.value === null || dragSrc.value === idx) return;
      e.preventDefault();
      const moved = props.rows.splice(dragSrc.value, 1)[0];
      props.rows.splice(idx, 0, moved);
      dragSrc.value = idx;
      dragMoved.value = true;
    };
    const onDragEnd = () => {
      if (dragMoved.value) emit('reorder');
      dragSrc.value = null; dragMoved.value = false;
    };

    const onAdd           = () => emit('add');
    const onSave          = () => emit('save');
    const onCancelChecked = () => emit('cancel-checked');
    const onDeleteChecked = () => emit('delete-checked');
    const onExport        = () => emit('export');

    return { U, cfVisibleCount, fnStatusClass, allChecked, onToggleCheckAll, onCellChange,
             onDragStart, onDragOver, onDragEnd, onAdd, onSave, onCancelChecked, onDeleteChecked,
             onExport, onSetFocused, fnColTitle, cfEmptyColspan,
             cfTreeMode, cfDispRows, fnRow, fnRowKey, cfShowDrag, cfShowNo, cfShowId };
  },
  template: /* html */`
<div class="card">
  <div class="toolbar">
    <span class="list-title">
      {{ listTitle }}
      <span class="list-count">{{ cfVisibleCount }}건</span>
    </span>
    <div style="display:flex;gap:6px;margin-left:auto;">
      <slot name="toolbar-actions"></slot>
      <button v-if="showExport" class="btn btn-green btn-sm" @click="onExport">📥 엑셀</button>
      <button v-if="showAdd" class="btn btn-green btn-sm" @click="onAdd">+ 행추가</button>
      <button v-if="showRowCheck" class="btn btn-danger btn-sm" @click="onDeleteChecked">행삭제</button>
      <button v-if="showRowCheck" class="btn btn-secondary btn-sm" @click="onCancelChecked">취소</button>
      <button v-if="showSave" class="btn btn-primary btn-sm" @click="onSave">저장</button>
    </div>
  </div>

  <div :style="'max-height:' + maxHeight + ';overflow-y:auto;'">
    <table class="bo-table crud-grid">
      <thead>
        <tr>
          <th v-if="cfShowDrag" class="col-drag"></th>
          <th v-if="cfShowNo" style="width:36px;text-align:center;">번호</th>
          <th v-if="cfShowId" class="col-id">ID</th>
          <th v-if="showRowStatus" class="col-status">상태</th>
          <th v-if="showRowCheck" class="col-check">
            <input type="checkbox" :checked="allChecked" @change="onToggleCheckAll" />
          </th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :style="U.thStyle(col)" :title="fnColTitle(col)">{{ col.label }}</th>
          </slot>
          <th class="col-act"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!cfDispRows.length">
          <td :colspan="cfEmptyColspan" style="text-align:center;color:#999;padding:30px;">{{ emptyText }}</td>
        </tr>
        <tr v-else v-for="(item, idx) in cfDispRows" :key="fnRowKey(item, idx)"
            class="crud-row" :class="[ 'status-' + fnRow(item)._row_status, (!cfTreeMode && focusedIdx===idx) ? 'focused' : '' ]"
            :draggable="cfShowDrag"
            @click="onSetFocused(idx)"
            @dragstart="onDragStart(idx)" @dragover="onDragOver($event, idx)" @dragend="onDragEnd">
          <td v-if="cfShowDrag" class="drag-handle" title="드래그로 순서 변경">⠿</td>
          <td v-if="cfShowNo" style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td v-if="cfShowId" class="col-id-val">{{ fnRow(item)[rowKey] > 0 ? fnRow(item)[rowKey] : 'NEW' }}</td>
          <td v-if="showRowStatus" class="col-status-val">
            <span class="badge badge-xs" :class="fnStatusClass(fnRow(item)._row_status)">{{ fnRow(item)._row_status }}</span>
          </td>
          <td v-if="showRowCheck" class="col-check-val">
            <input type="checkbox" v-model="fnRow(item)._row_check" />
          </td>
          <template v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="fnRow(item)" :idx="idx" :node="item">
              <td :style="U.tdStyle(col)">
                <input v-if="col.edit==='text'" class="grid-input" :class="{ 'grid-mono': col.mono }"
                       v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                       :placeholder="col.placeholder" @input="onCellChange(fnRow(item))" />
                <input v-else-if="col.edit==='number'" type="number" class="grid-input grid-num"
                       v-model.number="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                       @input="onCellChange(fnRow(item))" />
                <input v-else-if="col.edit==='date'" type="date" class="grid-input"
                       v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                       @input="onCellChange(fnRow(item))" />
                <select v-else-if="col.edit==='select'" class="grid-select"
                        v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                        @change="onCellChange(fnRow(item))">
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, fnRow(item))">{{ U.cellText(col, fnRow(item)) }}</span>
                <template v-else>{{ U.cellText(col, fnRow(item)) }}</template>
              </td>
            </slot>
          </template>
          <td class="col-act-val">
            <div class="col-act-box">
              <slot name="row-actions" :row="fnRow(item)" :idx="idx" :node="item">
                <slot name="row-cancel" :row="fnRow(item)" :idx="idx" :node="item"></slot>
                <slot name="row-delete" :row="fnRow(item)" :idx="idx" :node="item"></slot>
              </slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
};

/* ── BoPathTreeCard — 좌측 트리 카드 래퍼 (BoPathTree 내장) ──────────────────
 * sy 화면 ~10개에서 반복되던 트리 카드(card + 제목 + #bizCd + 전체보기 + 스크롤
 * + bo-path-tree)를 한 줄로 대체. BoPathTree 가 API 조회·캐시·펼침/닫기를 담당.
 *
 * props:
 *   bizCd     — string 필수. BoPathTree 로 전달할 업무코드
 *   title     — string 카드 제목 텍스트 (📂 자동 prefix). 기본 '표시경로'
 *   selected  — 현재 선택 pathId (null = 전체)
 *   showBizCd — boolean 제목 옆 #bizCd 뱃지 + 노드 #bizCd 표시 (기본 false)
 *   allLabel  — string 전체보기 링크 텍스트 (기본 '전체보기')
 *   maxHeight — string 스크롤 영역 높이 (기본 '65vh')
 *   pad       — string 카드 padding (기본 '12px')
 * emit:
 *   select(pathId)  — 노드 클릭 / 전체보기(null) 통합
 * ──────────────────────────────────────────────────────────────────────── */
window.BoPathTreeCard = {
  name: 'BoPathTreeCard',
  props: {
    bizCd:     { type: String,  required: true },
    title:     { type: String,  default: '표시경로' },
    selected:  { default: null },
    showBizCd: { type: Boolean, default: false },
    allLabel:  { type: String,  default: '전체보기' },
    maxHeight: { type: String,  default: '65vh' },
    pad:       { type: String,  default: '12px' },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const onSelect = (id) => emit('select', id);
    const cfHasSel = Vue.computed(() => props.selected != null && props.selected !== '');
    return { onSelect, cfHasSel };
  },
  template: /* html */`
<div class="card" :style="'padding:' + pad + ';'">
  <div class="toolbar" style="margin-bottom:6px;">
    <span class="list-title" style="font-size:13px;">📂 {{ title }}
      <span v-if="showBizCd" style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#{{ bizCd }}</span>
    </span>
    <span v-if="cfHasSel" @click="onSelect(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">{{ allLabel }}</span>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;'">
    <bo-path-tree :biz-cd="bizCd" :show-biz-cd="showBizCd" :selected="selected" @select="onSelect" />
  </div>
</div>`,
};

/* ── BoLocalTreeCard — 로컬 데이터 트리 카드 (BoPathTreeNode 사용) ────────────
 * 부모가 빌드한 cfTree(computed) 등 로컬 트리를 받는 카드. API 미사용.
 * SyPathMng(sy_path 자기참조), SyRoleMng(역할 트리) 등 자체 트리 화면용.
 *
 * props:
 *   node       — object 필수. 루트 노드 ({ pathId/value, children, ... })
 *   expanded   — Set    필수. 펼침 상태 Set (부모 reactive)
 *   selected   — 현재 선택 id
 *   onToggle   — fn 필수. 노드 토글 핸들러 (BoPathTreeNode 규약)
 *   title      — string 카드 제목 (기본 '경로 트리')
 *   bizCd      — string 제목 옆 #bizCd 뱃지 (없으면 미표시)
 *   allLabel   — string 전체보기 텍스트 (기본 '전체보기')
 *   expandable — boolean 펼침/닫기 버튼 노출 (기본 true)
 *   maxHeight  — string 스크롤 높이 (기본 '65vh')
 *   sticky     — boolean position:sticky;top:0 적용 (기본 false)
 * emit:
 *   select(id)     — 노드 선택 / 전체보기(null)
 *   expand-all     — 전체펼치기 버튼
 *   collapse-all   — 전체닫기 버튼
 * 슬롯:
 *   #filter — 제목 아래, 펼침버튼 위에 들어갈 추가 필터 (SyRole 역할구분 select 등)
 * ──────────────────────────────────────────────────────────────────────── */
window.BoLocalTreeCard = {
  name: 'BoLocalTreeCard',
  props: {
    node:       { type: Object,   required: true },
    expanded:   { type: Object,   required: true },
    selected:   { default: null },
    onToggle:   { type: Function, required: true },
    title:      { type: String,   default: '경로 트리' },
    bizCd:      { type: String,   default: '' },
    allLabel:   { type: String,   default: '전체보기' },
    expandable: { type: Boolean,  default: true },
    maxHeight:  { type: String,   default: '65vh' },
    sticky:     { type: Boolean,  default: false },
  },
  emits: ['select', 'expand-all', 'collapse-all'],
  setup(props, { emit }) {
    const onSelect = (id) => emit('select', id);
    const cfHasSel = Vue.computed(() => props.selected != null && props.selected !== '');
    const cfCardStyle = Vue.computed(() =>
      'padding:12px;' + (props.sticky ? 'position:sticky;top:0;' : ''));
    return {
      onSelect, cfHasSel, cfCardStyle,
      onExpandAll:   () => emit('expand-all'),
      onCollapseAll: () => emit('collapse-all'),
    };
  },
  template: /* html */`
<div class="card" :style="cfCardStyle">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <span style="font-size:13px;font-weight:600;color:#555">📂 {{ title }}
      <span v-if="bizCd" style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#{{ bizCd }}</span>
    </span>
    <div v-if="cfHasSel" style="font-size:11px;color:#1677ff;cursor:pointer" @click="onSelect(null)">{{ allLabel }}</div>
  </div>
  <slot name="filter"></slot>
  <div v-if="expandable" style="display:flex;gap:4px;margin-bottom:8px">
    <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="onExpandAll">▼ 전체펼치기</button>
    <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="onCollapseAll">▶ 전체닫기</button>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;'">
    <bo-path-tree-node :node="node" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="0" />
  </div>
</div>`,
};

/* ── BoModal — 공통 모달 껍데기 래퍼 ────────────────────────────────────────
 * BaseModal.js 가 전역 주입하는 .modal-overlay / .modal-box / .modal-header /
 * .modal-close CSS 를 그대로 재사용한다. position:fixed 인라인 모달을 1줄로 대체.
 *
 * props:
 *   show       — boolean. 표시 여부 (v-if 대용, 컴포넌트는 v-if 와 함께 써도 무방)
 *   title      — string. 헤더 제목 (이모지 포함 가능). 빈값이면 헤더 숨김
 *   width      — string. 박스 width (기본 '600px')
 *   maxWidth   — string. 박스 max-width (기본 '95vw')
 *   height     — string. 박스 height (기본 'auto')
 *   maxHeight  — string. 박스 max-height (기본 '90vh')
 *   zIndex     — number. 오버레이 z-index (기본 9000)
 *   bodyPad    — string. 본문 padding (기본 '20px')
 *   closeOnBackdrop — boolean. 배경 클릭 시 close emit (기본 true)
 *   teleport   — boolean. body 로 teleport (기본 true)
 * emit:
 *   close      — 닫기 버튼 / 배경 클릭
 * 슬롯:
 *   default / #body  — 본문
 *   #footer          — 푸터 (있을 때만 렌더)
 *   #header-extra    — 제목 우측 추가 영역 (badge 등)
 * ──────────────────────────────────────────────────────────────────────── */
window.BoModal = {
  name: 'BoModal',
  props: {
    show:            { type: Boolean, default: true },
    title:           { type: String,  default: '' },
    width:           { type: String,  default: '600px' },
    maxWidth:        { type: String,  default: '95vw' },
    height:          { type: String,  default: 'auto' },
    maxHeight:       { type: String,  default: '90vh' },
    zIndex:          { type: Number,  default: 9000 },
    bodyPad:         { type: String,  default: '20px' },
    closeOnBackdrop: { type: Boolean, default: true },
    teleport:        { type: Boolean, default: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const onClose    = () => emit('close');
    const onBackdrop = () => { if (props.closeOnBackdrop) emit('close'); };
    const cfOverlayStyle = Vue.computed(() =>
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
      + 'background:rgba(18,24,40,0.55);z-index:' + props.zIndex + ';');
    const cfBoxStyle = Vue.computed(() =>
      'background:#fff;width:' + props.width + ';max-width:' + props.maxWidth + ';'
      + 'height:' + props.height + ';max-height:' + props.maxHeight + ';'
      + 'display:flex;flex-direction:column;padding:20px;overflow:hidden;');
    return { onClose, onBackdrop, cfOverlayStyle, cfBoxStyle };
  },
  template: /* html */`
<teleport to="body" :disabled="!teleport">
  <div v-if="show" class="modal-overlay" :style="cfOverlayStyle" @click.self="onBackdrop">
    <div class="modal-box" :style="cfBoxStyle">
      <div v-if="title" class="modal-header" style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <span style="font-weight:800;font-size:15px;color:#9f2946;letter-spacing:-0.2px;">{{ title }}</span>
        <span style="display:flex;align-items:center;gap:8px;">
          <slot name="header-extra"></slot>
          <button type="button" class="modal-close" @click="onClose">✕</button>
        </span>
      </div>
      <div :style="'flex:1;overflow-y:auto;padding:' + bodyPad + ';margin:0 -20px;'">
        <div style="padding:0 20px;">
          <slot name="body"><slot></slot></slot>
        </div>
      </div>
      <div v-if="$slots.footer" class="modal-footer" style="flex-shrink:0;display:flex;justify-content:flex-end;gap:8px;padding:12px 0 0;border-top:1px solid #f0f0f0;margin-top:14px;">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</teleport>`,
};

/* ── BoCronModal — Cron 표현식 편집 모달 (BoModal 기반) ──────────────────────
 * SyBatchMng 의 인라인 Cron 모달을 컴포넌트화. 프리셋/수동입력/한국어설명 내장.
 *
 * props:
 *   show   — boolean. 표시 여부
 *   value  — string.  현재 cron 식 'm h d M w' (기본 '0 0 * * *')
 * emit:
 *   apply(cronExpr)  — [적용] 클릭
 *   close            — 닫기 / 취소
 * ──────────────────────────────────────────────────────────────────────── */
window.BoCronModal = {
  name: 'BoCronModal',
  props: {
    show:  { type: Boolean, default: false },
    value: { type: String,  default: '0 0 * * *' },
  },
  emits: ['apply', 'close'],
  setup(props, { emit }) {
    const { reactive, computed, watch } = Vue;
    const PRESETS = [
      { label: '매일 자정',       value: '0 0 * * *'   },
      { label: '매일 01:00',     value: '0 1 * * *'   },
      { label: '매일 02:00',     value: '0 2 * * *'   },
      { label: '매시간',          value: '0 * * * *'   },
      { label: '2시간마다',       value: '0 */2 * * *' },
      { label: '매주 일요일 자정', value: '0 0 * * 0'   },
      { label: '매월 1일 08:00', value: '0 8 1 * *'   },
    ];
    const FIELDS = [
      { key: 'minute',  label: '분',   placeholder: '0', hint: '0-59, */n' },
      { key: 'hour',    label: '시',   placeholder: '0', hint: '0-23, */n' },
      { key: 'day',     label: '일',   placeholder: '*', hint: '1-31, *'   },
      { key: 'month',   label: '월',   placeholder: '*', hint: '1-12, *'   },
      { key: 'weekday', label: '요일', placeholder: '*', hint: '0-6 (일=0)' },
    ];
    const st = reactive({ minute: '0', hour: '0', day: '*', month: '*', weekday: '*', preview: '0 0 * * *' });

    const _load = (expr) => {
      const pts = String(expr || '0 0 * * *').trim().split(/\s+/);
      st.minute  = pts[0] || '*';
      st.hour    = pts[1] || '*';
      st.day     = pts[2] || '*';
      st.month   = pts[3] || '*';
      st.weekday = pts[4] || '*';
      st.preview = (expr || '0 0 * * *');
    };
    watch(() => props.show, v => { if (v) _load(props.value); });
    watch(() => props.value, v => { if (props.show) _load(v); });

    const updatePreview = () => { st.preview = st.minute + ' ' + st.hour + ' ' + st.day + ' ' + st.month + ' ' + st.weekday; };
    const applyPreset = (val) => {
      const pts = val.split(' ');
      st.minute = pts[0]; st.hour = pts[1]; st.day = pts[2]; st.month = pts[3]; st.weekday = pts[4];
      st.preview = val;
    };

    /* cron → 한국어 설명 */
    const cronToKorean = (expr) => {
      if (!expr) return '';
      const pts = expr.trim().split(/\s+/);
      if (pts.length !== 5) return '';
      const [min, hour, day, month, weekday] = pts;
      const WD = ['일', '월', '화', '수', '목', '금', '토'];
      const t = (h, m) => {
        if (h === '*') return '';
        const hh = String(h).padStart(2, '0');
        const mm = (m === '*' ? '00' : String(m).padStart(2, '0'));
        return ' ' + hh + ':' + mm;
      };
      if (min === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') return '매분 실행';
      const minN = min.match(/^\*\/(\d+)$/);
      if (minN && hour === '*' && day === '*' && month === '*' && weekday === '*') return minN[1] + '분마다 실행';
      if (hour === '*' && day === '*' && month === '*' && weekday === '*')
        return min === '0' ? '매시간 실행' : ('매시간 ' + min + '분에 실행');
      const hourN = hour.match(/^\*\/(\d+)$/);
      if (hourN && day === '*' && month === '*' && weekday === '*')
        return hourN[1] + '시간마다 실행' + (min !== '0' && min !== '*' ? (' (' + min + '분)') : '');
      if (month !== '*' && day !== '*' && weekday === '*') {
        const mo = month.match(/^\*\/(\d+)$/) ? (month.match(/^\*\/(\d+)$/)[1] + '개월마다') : (month + '월');
        return '매년 ' + mo + ' ' + day + '일' + t(hour, min) + ' 실행';
      }
      if (day === '*' && month === '*' && weekday !== '*') {
        const wds = weekday.split(',').map(w => {
          const n = parseInt(w);
          return isNaN(n) ? w : (WD[n % 7] + '요일');
        }).join(', ');
        return '매주 ' + wds + t(hour, min) + ' 실행';
      }
      if (month === '*' && weekday === '*' && day !== '*') {
        const ds = day.match(/^\*\/(\d+)$/) ? (day.match(/^\*\/(\d+)$/)[1] + '일마다') : (day + '일');
        return '매월 ' + ds + t(hour, min) + ' 실행';
      }
      if (day === '*' && month === '*' && weekday === '*') return '매일' + t(hour, min) + ' 실행';
      return '';
    };
    const cfDesc = computed(() => cronToKorean(st.preview));

    const onApply = () => { emit('apply', st.preview); emit('close'); };
    const onClose = () => emit('close');
    return { PRESETS, FIELDS, st, updatePreview, applyPreset, cfDesc, onApply, onClose };
  },
  template: /* html */`
<bo-modal :show="show" title="🕐 Cron 표현식 설정" width="500px" @close="onClose">
  <div style="margin-bottom:18px;">
    <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">⚡ 프리셋</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      <button v-for="p in PRESETS" :key="p.value"
        class="btn btn-sm"
        :style="st.preview === p.value
          ? 'border:1.5px solid #e8587a;color:#e8587a;background:#fff5f7;font-weight:600;'
          : 'border:1px solid #d9d9d9;color:#555;background:#fff;'"
        style="font-size:11px;padding:5px 10px;text-align:left;line-height:1.5;"
        @click="applyPreset(p.value)">
        <div>{{ p.label }}</div>
        <code style="font-size:10px;opacity:.65;letter-spacing:.5px;">{{ p.value }}</code>
      </button>
    </div>
  </div>
  <div style="margin-bottom:18px;">
    <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">🔧 수동 설정</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
      <div v-for="f in FIELDS" :key="f.key" style="text-align:center;">
        <div style="font-size:10px;color:#888;margin-bottom:4px;font-weight:600;">{{ f.label }}</div>
        <input class="form-control"
          style="text-align:center;font-family:monospace;font-size:13px;padding:5px 4px;"
          :placeholder="f.placeholder" :title="f.hint"
          v-model="st[f.key]" @input="updatePreview" />
        <div style="font-size:9px;color:#bbb;margin-top:3px;">{{ f.hint }}</div>
      </div>
    </div>
  </div>
  <div style="background:#f0f8ff;border:1px solid #dbeafe;border-radius:6px;padding:10px 16px;display:flex;align-items:center;gap:12px;">
    <span style="font-size:11px;color:#888;flex-shrink:0;">결과</span>
    <code style="font-size:16px;color:#2563eb;font-weight:700;letter-spacing:2px;">{{ st.preview }}</code>
    <span v-if="cfDesc" style="font-size:11px;color:#e8587a;margin-left:auto;font-weight:600;">{{ cfDesc }}</span>
  </div>
  <template #footer>
    <button class="btn btn-secondary" @click="onClose">취소</button>
    <button class="btn btn-primary" @click="onApply">적용</button>
  </template>
</bo-modal>`,
};

/* ── BoTreeSelectorModal — 트리 노드 선택 모달 (BoModal 기반) ────────────────
 * 부모가 빌드한 트리(cfParentTree 등)에서 노드를 선택하는 모달.
 * SyPathMng 부모경로 선택 등. bo-path-parent-selector 재귀 노드 사용.
 *
 * props:
 *   show     — boolean
 *   node     — object.  루트 노드 ({ pathId, pathLabel, children })
 *   expanded — Set.     펼침 상태 (부모 reactive)
 *   onToggle — fn.      노드 토글 핸들러
 *   title    — string.  제목 (기본 '항목 선택')
 *   rootLabel— string.  최상위 옵션 라벨 (기본 '(루트 — 상위없음)'). null 이면 숨김
 * emit:
 *   select(id)  — 노드/루트 선택 (루트 선택 시 null)
 *   close
 * ──────────────────────────────────────────────────────────────────────── */
window.BoTreeSelectorModal = {
  name: 'BoTreeSelectorModal',
  props: {
    show:      { type: Boolean, default: false },
    node:      { type: Object,  default: () => ({ children: [] }) },
    expanded:  { type: Object,  required: true },
    onToggle:  { type: Function, required: true },
    title:     { type: String,  default: '항목 선택' },
    rootLabel: { type: String,  default: '(루트 — 상위없음)' },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const onSelect = (id) => emit('select', id);
    const onClose  = () => emit('close');
    return { onSelect, onClose };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" width="420px" max-height="70vh" body-pad="0" @close="onClose">
  <div style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
    <div v-if="rootLabel" style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff;"
         @click="onSelect(null)">{{ rootLabel }}</div>
    <bo-path-parent-selector :node="node" :expanded="expanded"
      :on-toggle="onToggle" :on-select="onSelect" :depth="0" />
  </div>
</bo-modal>`,
};

/* ── BoRoleSelectModal — 역할 트리 + 메뉴권한 선택 모달 (BoModal 기반) ───────
 * SyVendorUserMng 역할 배분 모달. 좌측 역할트리 + 우측 메뉴권한 표시.
 * 트리/권한 데이터·핸들러는 부모가 slot 으로 주입 (화면 고유 로직 보존).
 *
 * props:
 *   show  — boolean
 *   title — string (기본 '🎭 역할 선택')
 * emit:
 *   close / confirm
 * 슬롯:
 *   #tree  — 좌측 역할 트리 영역
 *   #perm  — 우측 메뉴 권한 영역
 *   #header-extra — 헤더 제목 우측 (업체유형 뱃지 등)
 *   #footer-extra — 푸터 좌측 추가 (선택된 역할명 표시 등)
 * props:
 *   confirmDisabled — boolean. [역할 부여] 비활성 (미선택 시)
 *   confirmLabel    — string.  부여 버튼 라벨 (기본 '역할 부여')
 * ──────────────────────────────────────────────────────────────────────── */
window.BoRoleSelectModal = {
  name: 'BoRoleSelectModal',
  props: {
    show:            { type: Boolean, default: false },
    title:           { type: String,  default: '🎭 역할 선택' },
    confirmDisabled: { type: Boolean, default: false },
    confirmLabel:    { type: String,  default: '역할 부여' },
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    return { onClose: () => emit('close'), onConfirm: () => emit('confirm') };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" width="1000px" height="720px" body-pad="0" @close="onClose">
  <template #header-extra><slot name="header-extra"></slot></template>
  <div style="display:grid;grid-template-columns:300px 1fr;flex:1;overflow:hidden;height:100%;">
    <div style="border-right:1px solid #eee;overflow-y:auto;padding:12px;">
      <slot name="tree"></slot>
    </div>
    <div style="overflow-y:auto;padding:12px;">
      <slot name="perm"></slot>
    </div>
  </div>
  <template #footer>
    <span style="margin-right:auto;"><slot name="footer-extra"></slot></span>
    <button class="btn btn-secondary" @click="onClose">취소</button>
    <button class="btn btn-primary" :disabled="confirmDisabled" @click="onConfirm">✔ {{ confirmLabel }}</button>
  </template>
</bo-modal>`,
};

/**
 * FoAreaComp.js — 사용자(Front Office) 공통 "영역(Area)" 컴포넌트 (검색영역 + 그리드 + 모달)
 *
 * ※ 모두 'Fo' prefix / 'fo-' 태그 사용. FoComp.js(개별 위젯)와 짝을 이루는 "영역" 단위 컴포넌트.
 *   BoAreaComp.js 를 FO 컨텍스트로 이식 — 차이점:
 *     · 스타일: .bo-table 미존재 → 본 파일 상단에서 .fo-grid-table CSS 를 1회 주입
 *       (BaseModal.js 가 모달 CSS 를 주입하는 방식과 동일). 색상은 FO CSS 변수
 *       (--text-primary / --blue / --border / --bg-card …)로 라이트/다크 자동 대응.
 *     · 모달: FO 의 .modal-overlay / .modal-box CSS 재사용. BO 핑크 헤더 대신
 *       FO 톤(악센트 컬러)·둥근 테두리.
 *     · 페이저: FO 는 클라이언트 로컬 데이터가 대부분 → pager 가 BO식
 *       (pageNo/pageSize/pageTotalCount) 또는 FO식(page/size) 둘 다 호환.
 *
 * ─ 제공 컴포넌트 ─────────────────────────────────────────────────────────
 *
 * FoSearchArea   — 검색영역 래퍼. 슬롯에 검색필드, [조회][초기화]·Enter 는 컴포넌트 제공.
 *                  emit: search, reset  (검색조건 변경 즉시조회 금지 정책 준수)
 *
 * FoGrid         — 그리드 통합 컴포넌트(조회전용 + 일부 인라인 에디트 + 드래그 + 선택체크)
 *                  · columns 배열만 넘기면 thead/tbody 자동 렌더
 *                  · sortState 전달 → 헤더 클릭 정렬
 *                  · col.edit('text'|'number'|'date'|'select') → 인라인 입력
 *                  · draggable → 행 드래그 정렬 + reorder emit
 *                  · selectable → 좌측 체크박스 + 헤더 전체선택
 *                  · bare=true → card/toolbar/pager 없이 <table> 만 (FO 기본값 true 권장)
 *                  props: columns, rows, pager, sortState, listTitle, rowKey,
 *                         rowStyle, rowClass, countText, isExpanded, draggable,
 *                         showSave, rowActions, bare, selectable, checkedKey,
 *                         isChecked, allChecked, minWidth, emptyText …
 *                  emit:  set-page(n), size-change, sort(key), row-click(row),
 *                         save, row-remove(row), reorder, toggle-check,
 *                         toggle-check-all
 *                  슬롯: #toolbar-actions, #head, #head-actions, #cell-{key},
 *                        #row-actions, #row-expand, #tfoot({rows,colspan})
 *
 * FoGridCrud     — CRUD 그리드 (전체 로드 / 행상태 N·I·U·D / 스크롤 컨테이너)
 *                  xs/Sample 데모류(드래그·체크올·상태뱃지·행추가/삭제) 이식용.
 *                  rows 는 _row_status·_row_check·_row_org 보유 gridRows
 *                  emit:  add, save, cancel-checked, delete-checked, reorder,
 *                         cell-change, update:checkAll, update:focusedIdx, sort
 *
 * FoModal        — 공통 모달 껍데기 (FO .modal-overlay / .modal-box 재사용)
 *                  props: show, title, width, maxWidth, height, maxHeight,
 *                         zIndex, bodyPad, closeOnBackdrop, teleport
 *                  emit:  close
 *                  슬롯: default/#body, #footer, #header-extra
 *
 * ─ columns 배열 스펙 (FoGrid / FoGridCrud 공통) ──────────────────────────
 *   { key, label, width, align('left'|'center'|'right'),
 *     badge(true | fn(row)=>className), link(true → row-click),
 *     sortKey, edit('text'|'number'|'date'|'select'), options, fmt(v,row),
 *     placeholder, mono, cls, style, noHead }
 *   특수 셀은 columns 에 두고 <template #cell-{key}="{ row, idx, no }"> override.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── FO 그리드 CSS 1회 주입 (BaseModal 패턴) ─────────────────────────────── */
(function injectFoAreaStyle() {
  if (document.getElementById('fo-area-comp-style')) return;
  const css = `
.fo-grid-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
.fo-grid-table thead tr { background:var(--blue-dim); }
.fo-grid-table thead th {
  padding:9px 12px; text-align:left; font-weight:700; color:var(--blue);
  border-bottom:1.5px solid var(--border); white-space:nowrap;
}
.fo-grid-table tbody td {
  padding:8px 12px; color:var(--text-secondary);
  border-bottom:1px solid var(--border); vertical-align:middle;
}
.fo-grid-table tbody tr:nth-child(even) { background:var(--bg-base); }
.fo-grid-table tbody tr.fo-grid-clickable { cursor:pointer; }
.fo-grid-table tbody tr.fo-grid-clickable:hover { background:var(--accent-dim); }
.fo-grid-table tfoot td { padding:9px 12px; border-top:1.5px solid var(--border); font-weight:700; color:var(--text-primary); }
.fo-grid-link { color:var(--blue); cursor:pointer; font-weight:600; text-decoration:underline; text-underline-offset:2px; }
.fo-grid-badge { display:inline-block; padding:1px 8px; border-radius:9px; font-size:0.7rem; font-weight:700; background:var(--accent-dim); color:var(--accent); }
.fo-grid-badge.b-green  { background:var(--green-dim);  color:var(--green); }
.fo-grid-badge.b-blue   { background:var(--blue-dim);   color:var(--blue); }
.fo-grid-badge.b-red    { background:rgba(229,62,62,.12); color:#e53e3e; }
.fo-grid-badge.b-gray   { background:var(--border);     color:var(--text-muted); }
.fo-grid-badge.b-orange { background:rgba(221,107,32,.12); color:#dd6b20; }
.fo-grid-input, .fo-grid-select {
  width:100%; padding:4px 8px; font-size:0.8rem; box-sizing:border-box;
  border:1px solid var(--border); border-radius:6px;
  background:var(--bg-card); color:var(--text-primary); outline:none;
}
.fo-grid-input:focus, .fo-grid-select:focus { border-color:var(--accent); }
.fo-grid-num { text-align:right; }
.fo-grid-empty { text-align:center; padding:30px; color:var(--text-muted); }
.fo-grid-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:18px; box-shadow:var(--shadow); }
.fo-grid-toolbar { display:flex; align-items:center; margin-bottom:12px; }
.fo-grid-title { font-size:0.92rem; font-weight:800; color:var(--text-primary); }
.fo-grid-count { font-size:0.78rem; color:var(--text-muted); font-weight:600; margin-left:6px; }
.fo-grid-drag { color:var(--text-muted); cursor:grab; font-size:1.05rem; user-select:none; text-align:center; }
.fo-grid-status { display:inline-block; padding:1px 7px; border-radius:8px; font-size:0.66rem; font-weight:700; }
.fo-grid-status.s-N { background:var(--border); color:var(--text-muted); }
.fo-grid-status.s-I { background:var(--blue-dim); color:var(--blue); }
.fo-grid-status.s-U { background:rgba(221,107,32,.12); color:#dd6b20; }
.fo-grid-status.s-D { background:rgba(229,62,62,.12); color:#e53e3e; }
.fo-grid-pager { display:flex; gap:6px; justify-content:center; margin-top:18px; flex-wrap:wrap; }
.fo-grid-pager button {
  padding:6px 12px; border:1px solid var(--border); border-radius:6px;
  background:var(--bg-card); color:var(--text-secondary); cursor:pointer;
  font-size:0.82rem; min-width:34px;
}
.fo-grid-pager button.on { background:var(--blue); color:#fff; border-color:var(--blue); font-weight:700; }
.fo-grid-pager button:disabled { opacity:.4; cursor:not-allowed; }
.fo-grid-scroll { overflow:auto; }
.fo-modal-box { display:flex; flex-direction:column; text-align:left; }
.fo-modal-header { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; margin-bottom:18px; }
.fo-modal-title { font-weight:800; font-size:1rem; color:var(--text-primary); letter-spacing:-0.2px; }
.fo-modal-close { background:none; border:none; font-size:1.25rem; cursor:pointer; color:var(--text-muted); line-height:1; }
.fo-modal-footer { flex-shrink:0; display:flex; justify-content:flex-end; gap:8px; padding-top:14px; border-top:1px solid var(--border); margin-top:16px; }
`;
  const el = document.createElement('style');
  el.id = 'fo-area-comp-style';
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ── FoSearchArea ───────────────────────────────────────────────────────── */
window.FoSearchArea = {
  name: 'FoSearchArea',
  props: {
    showActions: { type: Boolean, default: true },  // [조회][초기화] 버튼 노출
    searchLabel: { type: String,  default: '조회' },
    resetLabel:  { type: String,  default: '초기화' },
    loading:     { type: Boolean, default: false },
    barStyle:    { type: String,  default: '' },     // 검색바 인라인 style 보존용
  },
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const onSearch = () => { if (!props.loading) emit('search'); };
    const onReset  = () => emit('reset');
    return { onSearch, onReset };
  },
  template: /* html */`
<div :style="'display:flex;flex-wrap:wrap;gap:10px;align-items:center;'+barStyle" @keyup.enter="onSearch">
  <slot></slot>
  <div v-if="showActions" style="display:flex;gap:6px;margin-left:auto;">
    <slot name="actions-before"></slot>
    <button class="btn-blue" :disabled="loading" @click="onSearch">{{ searchLabel }}</button>
    <button class="btn-outline btn-sm" @click="onReset">{{ resetLabel }}</button>
    <slot name="actions-after"></slot>
  </div>
</div>`,
};

/* ── 공통 헬퍼 (그리드 공유) ────────────────────────────────────────────── */
window._foAreaCompUtil = {
  normOptions(opts) {
    return (opts || []).map(o => ({
      value: o.value != null ? o.value : o.codeValue,
      label: o.label != null ? o.label : o.codeLabel,
    }));
  },
  cellText(col, row) {
    const v = row ? row[col.key] : undefined;
    if (typeof col.fmt === 'function') return col.fmt(v, row);
    if (v == null) return '';
    return v;
  },
  badgeClass(col, row) {
    if (typeof col.badge === 'function') return col.badge(row);
    if (window.coUtil && typeof coUtil.fnCodeBadge === 'function' && col.codeGrp) {
      return coUtil.fnCodeBadge(col.codeGrp, row[col.key]);
    }
    return 'b-gray';
  },
  thStyle(col) {
    if (col.style) return col.style;            // 원본 인라인 스타일 우선
    let s = '';
    if (col.width) s += 'width:' + col.width + ';';
    if (col.align) s += 'text-align:' + col.align + ';';
    return s;
  },
  tdStyle(col) {
    let s = '';
    if (col.align) s += 'text-align:' + col.align + ';';
    if (col.mono)  s += 'font-family:monospace;';
    return s;
  },
  /* 페이저 호환 — BO식(pageNo/pageSize/pageTotalCount) / FO식(page/size) 모두 수용 */
  pgNo(p)    { return p ? (p.pageNo != null ? p.pageNo : (p.page != null ? p.page : 1)) : 1; },
  pgSize(p)  { return p ? (p.pageSize != null ? p.pageSize : (p.size != null ? p.size : 20)) : 20; },
  pgTotal(p, rowsLen) {
    if (!p) return rowsLen;
    if (p.pageTotalCount != null) return p.pageTotalCount;
    if (p.total != null) return p.total;
    return rowsLen;
  },
  pgSetNo(p, n) { if (!p) return; if (p.pageNo != null) p.pageNo = n; else p.page = n; },
};

/* ── FoGrid — 그리드 통합 ──────────────────────────────────────────────── */
window.FoGrid = {
  name: 'FoGrid',
  props: {
    columns:    { type: Array,  required: true },
    rows:       { type: Array,  default: () => [] },
    pager:      { type: Object, default: null },
    sortState:  { type: Object, default: null },
    listTitle:  { type: String, default: '목록' },
    rowKey:     { type: String, default: null },
    rowStyle:   { type: Function, default: null },
    rowClass:   { type: Function, default: null },
    countText:  { type: String,  default: null },
    isExpanded: { type: Function, default: null },
    draggable:  { type: Boolean, default: false },
    showSave:   { type: Boolean, default: false },
    saveLabel:  { type: String,  default: '저장' },
    rowActions: { type: Boolean, default: false },
    loading:    { type: Boolean, default: false },
    emptyText:  { type: String, default: '데이터가 없습니다.' },
    bare:       { type: Boolean, default: false },   // true=card/toolbar/pager 없이 <table>만
    minWidth:   { type: String,  default: '' },      // 가로 스크롤용 table min-width
    showRowNo:  { type: Boolean, default: true },    // 번호 컬럼 (FO 정적 테이블은 끌 수 있음)
    rowClick:   { type: Function, default: null },   // 전체 행 클릭 핸들러(picker 등). 지정 시 tr 클릭→호출
    selectable: { type: Boolean, default: false },
    checkedKey: { type: String,  default: null },
    isChecked:  { type: Function, default: null },
    allChecked: { type: Boolean, default: false },
  },
  emits: ['set-page', 'size-change', 'sort', 'row-click', 'save', 'row-remove', 'reorder',
          'toggle-check', 'toggle-check-all'],
  setup(props, { emit, slots }) {
    const U = window._foAreaCompUtil;
    const cfTotal = Vue.computed(() => U.pgTotal(props.pager, props.rows.length));
    const cfShowTfoot = Vue.computed(() => !!slots.tfoot && props.rows.length > 0);
    const cfPageNos = Vue.computed(() => {
      if (!props.pager) return [];
      const sz = U.pgSize(props.pager);
      const t = Math.max(1, Math.ceil(cfTotal.value / sz));
      return Array.from({ length: t }, (_, i) => i + 1);
    });

    const rowNo = (idx) => props.pager
      ? (U.pgNo(props.pager) - 1) * U.pgSize(props.pager) + idx + 1
      : idx + 1;

    const onSort = (col) => { if (col.sortKey) emit('sort', col.sortKey); };
    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

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

    const onRowClick = (row) => { if (typeof props.rowClick === 'function') props.rowClick(row); emit('row-click', row); };
    const onTrClick  = (row) => { if (typeof props.rowClick === 'function') props.rowClick(row); };
    const onSave     = () => emit('save');
    const onRemove   = (row) => emit('row-remove', row);
    const onSetPage  = (n) => { U.pgSetNo(props.pager, n); emit('set-page', n); };
    const onSizeChg  = () => emit('size-change');
    const fnRowStyle = (row, idx) => (typeof props.rowStyle === 'function' ? props.rowStyle(row, idx) : '');
    const fnRowClass = (row, idx) => {
      const base = typeof props.rowClass === 'function' ? (props.rowClass(row, idx) || '') : '';
      return base + (props.rowClick ? ' fo-grid-clickable' : '');
    };
    const fnIsExpanded = (row, idx) => (typeof props.isExpanded === 'function' ? !!props.isExpanded(row, idx) : false);

    const fnRowChkVal = (row) => row[props.checkedKey || props.rowKey];
    const fnRowChecked = (row) => (typeof props.isChecked === 'function' ? !!props.isChecked(fnRowChkVal(row)) : false);
    const onToggleCheck = (row) => emit('toggle-check', fnRowChkVal(row));
    const onToggleCheckAll = () => emit('toggle-check-all');

    const cfColspan = Vue.computed(() => props.columns.length
      + (props.showRowNo ? 1 : 0)
      + (props.selectable ? 1 : 0) + (props.draggable ? 1 : 0) + (props.rowActions ? 1 : 0));
    const cfTableStyle = Vue.computed(() => props.minWidth ? ('min-width:' + props.minWidth + ';') : '');
    const cfHasPager = Vue.computed(() => !!props.pager && !props.bare && cfPageNos.value.length > 1);

    return { U, cfTotal, cfShowTfoot, cfPageNos, rowNo, onSort, sortIcon, sortActive,
             onDragStart, onDragOver, onDragEnd, onRowClick, onTrClick, onSave, onRemove,
             onSetPage, onSizeChg, fnRowStyle, fnRowClass, fnIsExpanded, cfColspan,
             cfTableStyle, cfHasPager, fnRowChecked, onToggleCheck, onToggleCheckAll };
  },
  template: /* html */`
<div :class="bare ? '' : 'fo-grid-card'">
  <div v-if="!bare" class="fo-grid-toolbar">
    <span class="fo-grid-title">{{ listTitle }}
      <span class="fo-grid-count">{{ countText != null ? countText : ('총 ' + cfTotal + '건') }}</span>
    </span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <slot name="toolbar-actions"></slot>
      <button v-if="showSave" class="btn-blue btn-sm" @click="onSave">{{ saveLabel }}</button>
    </div>
  </div>

  <div class="fo-grid-scroll">
    <table class="fo-grid-table" :style="cfTableStyle">
      <thead>
        <tr>
          <th v-if="selectable" style="width:34px;text-align:center;">
            <input type="checkbox" :checked="allChecked" @change="onToggleCheckAll" />
          </th>
          <th v-if="draggable" style="width:26px;"></th>
          <th v-if="showRowNo" style="width:40px;text-align:center;">번호</th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :class="col.cls"
                :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;' : '')"
                @click="onSort(col)">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.sortKey"
                    :style="sortActive(col) ? 'color:var(--accent);font-weight:bold;' : 'color:var(--text-muted);'">{{ sortIcon(col) }}</span>
            </th>
          </slot>
          <th v-if="rowActions" style="width:44px;text-align:center;"><slot name="head-actions">관리</slot></th>
          <slot v-else name="head-actions"></slot>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, idx) in rows" :key="rowKey ? row[rowKey] : idx">
          <tr :style="fnRowStyle(row, idx)" :class="fnRowClass(row, idx)"
              :draggable="draggable" @click="onTrClick(row)"
              @dragstart="onDragStart(idx)" @dragover="onDragOver($event, idx)" @dragend="onDragEnd">
            <td v-if="selectable" style="text-align:center;" @click.stop>
              <input type="checkbox" :checked="fnRowChecked(row)" @change="onToggleCheck(row)" />
            </td>
            <td v-if="draggable" class="fo-grid-drag">≡</td>
            <td v-if="showRowNo" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">{{ rowNo(idx) }}</td>
            <template v-for="col in columns" :key="col.key">
              <slot :name="'cell-' + col.key" :row="row" :idx="idx" :no="rowNo(idx)">
                <td :style="U.tdStyle(col)">
                  <input v-if="col.edit==='text'" class="fo-grid-input" v-model="row[col.key]"
                         :placeholder="col.placeholder" />
                  <input v-else-if="col.edit==='number'" type="number" class="fo-grid-input fo-grid-num"
                         v-model.number="row[col.key]" />
                  <input v-else-if="col.edit==='date'" type="date" class="fo-grid-input"
                         v-model="row[col.key]" />
                  <select v-else-if="col.edit==='select'" class="fo-grid-select" v-model="row[col.key]">
                    <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <span v-else-if="col.link" class="fo-grid-link" @click="onRowClick(row)">{{ U.cellText(col, row) }}</span>
                  <span v-else-if="col.badge" class="fo-grid-badge" :class="U.badgeClass(col, row)">{{ U.cellText(col, row) }}</span>
                  <template v-else>{{ U.cellText(col, row) }}</template>
                </td>
              </slot>
            </template>
            <td v-if="rowActions" style="text-align:center;">
              <slot name="row-actions" :row="row" :idx="idx">
                <button class="btn-outline btn-sm" @click="onRemove(row)">✕</button>
              </slot>
            </td>
            <slot v-else name="row-actions" :row="row" :idx="idx"></slot>
          </tr>
          <tr v-if="fnIsExpanded(row, idx)" class="fo-grid-expand-row">
            <slot name="row-expand" :row="row" :idx="idx" :colspan="cfColspan">
              <td :colspan="cfColspan"></td>
            </slot>
          </tr>
        </template>
        <tr v-if="!rows.length">
          <td :colspan="cfColspan" class="fo-grid-empty">{{ emptyText }}</td>
        </tr>
      </tbody>
      <tfoot v-if="cfShowTfoot">
        <slot name="tfoot" :rows="rows" :colspan="cfColspan"></slot>
      </tfoot>
    </table>
  </div>

  <div v-if="cfHasPager" class="fo-grid-pager">
    <button :disabled="U.pgNo(pager)===1" @click="onSetPage(Math.max(1, U.pgNo(pager)-1))">‹</button>
    <button v-for="p in cfPageNos" :key="p" :class="{ on: U.pgNo(pager)===p }" @click="onSetPage(p)">{{ p }}</button>
    <button :disabled="U.pgNo(pager)===cfPageNos.length" @click="onSetPage(Math.min(cfPageNos.length, U.pgNo(pager)+1))">›</button>
  </div>
</div>`,
};

/* ── 하위호환 별칭 ───────────────────────────────────────────────────────── */
window.FoGridReadonly = window.FoGrid;
window.FoGridEdit = Object.assign({}, window.FoGrid, {
  name: 'FoGridEdit',
  props: Object.assign({}, window.FoGrid.props, {
    showSave:   { type: Boolean, default: true },
    rowActions: { type: Boolean, default: true },
  }),
});

/* ── FoGridCrud — CRUD 그리드(전체 로드 / 행상태 N·I·U·D) ────────────────── */
window.FoGridCrud = {
  name: 'FoGridCrud',
  props: {
    columns:    { type: Array,  required: true },
    rows:       { type: Array,  required: true },
    rowKey:     { type: String, required: true },
    listTitle:  { type: String, default: '목록' },
    maxHeight:  { type: String, default: '480px' },
    minWidth:   { type: String, default: '' },
    draggable:  { type: Boolean, default: true },
    checkAll:   { type: Boolean, default: false },
    focusedIdx: { type: Number,  default: null },
    showRowNo:     { type: Boolean, default: true },
    showRowId:     { type: Boolean, default: true },
    showRowStatus: { type: Boolean, default: true },
    showRowCheck:  { type: Boolean, default: true },
    showAdd:       { type: Boolean, default: true },
    showSave:      { type: Boolean, default: true },
    cellTitle:  { type: Function, default: null },
    sortState:  { type: Object, default: null },
    emptyText:  { type: String, default: '데이터가 없습니다.' },
  },
  emits: ['add', 'save', 'cancel-checked', 'delete-checked', 'reorder', 'cell-change',
          'update:checkAll', 'update:focusedIdx', 'sort'],
  setup(props, { emit }) {
    const U = window._foAreaCompUtil;

    const cfVisibleCount = Vue.computed(() =>
      props.rows.filter(r => r._row_status !== 'D').length);

    const fnStatusClass = s => 's-' + (s || 'N');

    const onSetFocused = (idx) => { if (props.focusedIdx !== idx) emit('update:focusedIdx', idx); };
    const fnColTitle = (col) => (typeof props.cellTitle === 'function' ? props.cellTitle(col) : '');

    const cfEmptyColspan = Vue.computed(() => {
      let n = props.columns.length + 1;            // 데이터 + 액션
      if (props.draggable)     n += 1;
      if (props.showRowNo)     n += 1;
      if (props.showRowId)     n += 1;
      if (props.showRowStatus) n += 1;
      if (props.showRowCheck)  n += 1;
      return n;
    });

    const allChecked = Vue.ref(props.checkAll);
    Vue.watch(() => props.checkAll, v => { allChecked.value = v; });
    const onToggleCheckAll = () => {
      const v = !allChecked.value;
      allChecked.value = v;
      props.rows.forEach(r => { r._row_check = v; });
      emit('update:checkAll', v);
    };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { emit('cell-change', row); return; }
      if (row._row_org) {
        const changed = Object.keys(row._row_org).some(f => String(row[f]) !== String(row._row_org[f]));
        row._row_status = changed ? 'U' : 'N';
      }
      emit('cell-change', row);
    };

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

    const onSort = (col) => { if (col.sortKey) emit('sort', col.sortKey); };
    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;
    const cfTableStyle = Vue.computed(() => props.minWidth ? ('min-width:' + props.minWidth + ';') : '');

    return { U, cfVisibleCount, fnStatusClass, allChecked, onToggleCheckAll, onCellChange,
             onDragStart, onDragOver, onDragEnd, onAdd, onSave, onCancelChecked, onDeleteChecked,
             onSetFocused, fnColTitle, cfEmptyColspan, onSort, sortIcon, sortActive, cfTableStyle };
  },
  template: /* html */`
<div class="fo-grid-card">
  <div class="fo-grid-toolbar">
    <span class="fo-grid-title">{{ listTitle }}
      <span class="fo-grid-count">{{ cfVisibleCount }}건</span>
    </span>
    <div style="display:flex;gap:6px;margin-left:auto;">
      <slot name="toolbar-actions"></slot>
      <button v-if="showAdd" class="btn-outline btn-sm" @click="onAdd">+ 행추가</button>
      <button v-if="showRowCheck" class="btn-outline btn-sm" @click="onDeleteChecked">행삭제</button>
      <button v-if="showRowCheck" class="btn-outline btn-sm" @click="onCancelChecked">취소</button>
      <button v-if="showSave" class="btn-blue btn-sm" @click="onSave">저장</button>
    </div>
  </div>

  <div class="fo-grid-scroll" :style="'max-height:' + maxHeight + ';'">
    <table class="fo-grid-table" :style="cfTableStyle">
      <thead>
        <tr>
          <th v-if="draggable" style="width:26px;"></th>
          <th v-if="showRowNo" style="width:40px;text-align:center;">번호</th>
          <th v-if="showRowId" style="width:54px;text-align:center;">ID</th>
          <th v-if="showRowStatus" style="width:40px;text-align:center;">상태</th>
          <th v-if="showRowCheck" style="width:28px;text-align:center;">
            <input type="checkbox" :checked="allChecked" @change="onToggleCheckAll" />
          </th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :class="col.cls"
                :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;' : '')"
                :title="fnColTitle(col)" @click="onSort(col)">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.sortKey"
                    :style="sortActive(col) ? 'color:var(--accent);font-weight:bold;' : 'color:var(--text-muted);'">{{ sortIcon(col) }}</span>
            </th>
          </slot>
          <th style="width:44px;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td :colspan="cfEmptyColspan" class="fo-grid-empty">{{ emptyText }}</td>
        </tr>
        <tr v-else v-for="(row, idx) in rows" :key="row[rowKey]"
            class="fo-grid-clickable" :class="[ 's-row-' + row._row_status, focusedIdx===idx ? 'fo-grid-focused' : '' ]"
            :draggable="draggable"
            :style="focusedIdx===idx ? 'outline:2px solid var(--accent) inset;' : ''"
            @click="onSetFocused(idx)"
            @dragstart="onDragStart(idx)" @dragover="onDragOver($event, idx)" @dragend="onDragEnd">
          <td v-if="draggable" class="fo-grid-drag" title="드래그로 순서 변경">⠿</td>
          <td v-if="showRowNo" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">{{ idx + 1 }}</td>
          <td v-if="showRowId" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">{{ row[rowKey] > 0 ? row[rowKey] : 'NEW' }}</td>
          <td v-if="showRowStatus" style="text-align:center;">
            <span class="fo-grid-status" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span>
          </td>
          <td v-if="showRowCheck" style="text-align:center;" @click.stop>
            <input type="checkbox" v-model="row._row_check" />
          </td>
          <template v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="row" :idx="idx">
              <td :style="U.tdStyle(col)">
                <input v-if="col.edit==='text'" class="fo-grid-input" :class="{ 'fo-grid-mono': col.mono }"
                       v-model="row[col.key]" :disabled="row._row_status==='D'"
                       :placeholder="col.placeholder" @input="onCellChange(row)" />
                <input v-else-if="col.edit==='number'" type="number" class="fo-grid-input fo-grid-num"
                       v-model.number="row[col.key]" :disabled="row._row_status==='D'"
                       @input="onCellChange(row)" />
                <input v-else-if="col.edit==='date'" type="date" class="fo-grid-input"
                       v-model="row[col.key]" :disabled="row._row_status==='D'"
                       @input="onCellChange(row)" />
                <select v-else-if="col.edit==='select'" class="fo-grid-select"
                        v-model="row[col.key]" :disabled="row._row_status==='D'"
                        @change="onCellChange(row)">
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <span v-else-if="col.badge" class="fo-grid-badge" :class="U.badgeClass(col, row)">{{ U.cellText(col, row) }}</span>
                <template v-else>{{ U.cellText(col, row) }}</template>
              </td>
            </slot>
          </template>
          <td style="text-align:center;">
            <slot name="row-actions" :row="row" :idx="idx">
              <slot name="row-cancel" :row="row" :idx="idx"></slot>
              <slot name="row-delete" :row="row" :idx="idx"></slot>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
};

/* ── FoModal — 공통 모달 껍데기 (FO .modal-overlay / .modal-box 재사용) ───── */
window.FoModal = {
  name: 'FoModal',
  props: {
    show:            { type: Boolean, default: true },
    title:           { type: String,  default: '' },
    width:           { type: String,  default: '600px' },
    maxWidth:        { type: String,  default: '95vw' },
    height:          { type: String,  default: 'auto' },
    maxHeight:       { type: String,  default: '90vh' },
    zIndex:          { type: Number,  default: 1500 },
    bodyPad:         { type: String,  default: '0' },
    closeOnBackdrop: { type: Boolean, default: true },
    teleport:        { type: Boolean, default: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const onClose    = () => emit('close');
    const onBackdrop = () => { if (props.closeOnBackdrop) emit('close'); };
    const cfOverlayStyle = Vue.computed(() => 'z-index:' + props.zIndex + ';');
    const cfBoxStyle = Vue.computed(() =>
      'width:' + props.width + ';max-width:' + props.maxWidth + ';'
      + 'height:' + props.height + ';max-height:' + props.maxHeight + ';'
      + 'text-align:left;padding:24px;');
    const cfBodyStyle = Vue.computed(() =>
      'flex:1;overflow-y:auto;' + (props.bodyPad !== '0' ? ('padding:' + props.bodyPad + ';') : ''));
    return { onClose, onBackdrop, cfOverlayStyle, cfBoxStyle, cfBodyStyle };
  },
  template: /* html */`
<teleport to="body" :disabled="!teleport">
  <div v-if="show" class="modal-overlay" :style="cfOverlayStyle" @click.self="onBackdrop">
    <div class="modal-box fo-modal-box" :style="cfBoxStyle">
      <div v-if="title" class="fo-modal-header">
        <span class="fo-modal-title">{{ title }}</span>
        <span style="display:flex;align-items:center;gap:8px;">
          <slot name="header-extra"></slot>
          <button type="button" class="fo-modal-close" @click="onClose">✕</button>
        </span>
      </div>
      <div :style="cfBodyStyle">
        <slot name="body"><slot></slot></slot>
      </div>
      <div v-if="$slots.footer" class="fo-modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</teleport>`,
};

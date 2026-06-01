/**
 * FoAreaComp.js — 사용자(Front Office) 공통 "영역(Area)" 컴포넌트 (검색영역 + 그리드 + 모달)
 *
 * ※ 모두 'Fo' prefix / 'fo-' 태그 사용. FoComp.js(개별 위젯)와 짝을 이루는 "영역" 단위 컴포넌트.
 *   BoAreaComp.js 를 FO 컨텍스트로 이식 — 차이점:
 *     · 스타일: .bo-table 미존재 → 본 파일 상단에서 .fo-grid-table CSS 를 1회 주입
 *       (BaseModals.js 가 모달 CSS 를 주입하는 방식과 동일). 색상은 FO CSS 변수
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
 *                         zIndex, bodyPad, closeOnBackdrop, teleport,
 *                         onCloseCb(fn), onConfirmCb(fn)  ← 콜백 함수 직접 전달
 *                  emit:  close, confirm
 *                  슬롯: default/#body, #header-extra,
 *                        #footer (슬롯 prop { confirm, close } 제공)
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

/* ── FoSearchArea ─────────────────────────────────────────────────────────
 *  검색 영역 표준 컴포넌트(FO). 슬롯 방식 + `:columns` 자동 렌더 모두 지원 (BoSearchArea 와 동등).
 *
 *  :columns 자동 렌더 사용 시 — `baseSearchColumns` 배열 정의 후 `:param="searchParam"` 전달:
 *    [
 *      { key: 'searchType', type: 'multiCheck',
 *        options: [{value,label},...], placeholder: '검색대상 전체',
 *        allLabel: '전체 선택', minWidth: '160px' },
 *      { key: 'searchValue', type: 'text', placeholder: '검색어 입력', width: '180px' },
 *      { key: 'cat',    type: 'select', options: () => codes.cats,   nullLabel: '카테고리 전체' },
 *      { key: 'status', type: 'select', options: () => codes.status, nullLabel: '상태 전체' },
 *      { key: 'dateRange', type: 'dateRange',
 *        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
 *        typeOptions: () => codes.date_types, rangeOptions: () => codes.date_range_opts,
 *        onRangeChange: fn },
 *      { label: '추가:', type: 'label' },                // 라벨 텍스트
 *      { type: 'slot', name: 'extra' },                  // 슬롯 탈출구
 *    ]
 *  옵션 함수형(`options: () => codes.x`) 지원 — 코드 지연 로드 대응.
 *
 *  columns 없으면 기본 default 슬롯 사용 (기존 화면 호환). */
window.FoSearchArea = {
  name: 'FoSearchArea',
  props: {
    columns:     { type: Array,   default: null },   // 자동 렌더용 필드 정의
    param:       { type: Object,  default: null },   // searchParam reactive (columns 사용 시)
    showActions: { type: Boolean, default: true },  // [조회][초기화] 버튼 노출
    searchLabel: { type: String,  default: '조회' },
    resetLabel:  { type: String,  default: '초기화' },
    loading:     { type: Boolean, default: false },
    barStyle:    { type: String,  default: '' },     // 검색바 인라인 style 보존용
  },
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const U = window._foAreaCompUtil;

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* ── ▼ search 영역 (검색바 전체) ─────────────────────────────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoSearchArea : handleBtnAction -> ', cmd, param);
      if (cmd === 'search-emit') {
        if (!props.loading) return emit('search');
      } else if (cmd === 'search-reset') {
        return emit('reset');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoSearchArea : handleSelectAction -> ', cmd, param);
      if (cmd === 'field-select-change') {
        return param.col && param.col.onChange ? param.col.onChange(param.event) : null;
      } else if (cmd === 'field-range-change') {
        return param.col && param.col.onRangeChange ? param.col.onRangeChange(param.event) : null;
      } else if (cmd === 'field-pick-open') {
        return param.col.onOpen(param.target);
      } else if (cmd === 'field-pick-clear') {
        return param.col.onClear(param.target);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const normOpts = (opts) => U.normOptions(opts);
    /* col.paramObj 가 있으면 그 객체를, 없으면 props.param 사용 — 컬럼별 다른 reactive 매핑 지원 */
    const po = (col) => col.paramObj || props.param;
    /* 속성값 && 금지 정책상 v-if 가드는 computed/fn 로 분리 */
    const cfAutoMode  = Vue.computed(() => !!(props.columns && props.param));
    const fnHasRange1 = (col) => !!(col.rangeFirst && col.rangeOptions);
    const fnHasRange2 = (col) => !!(!col.rangeFirst && col.rangeOptions);
    return { U, normOpts, po, cfAutoMode, fnHasRange1, fnHasRange2,
             handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div :style="'display:flex;flex-wrap:wrap;gap:10px;align-items:center;'+barStyle" @keyup.enter="handleBtnAction('search-emit')">
  <!-- ▼ search 영역 -->
  <template v-if="cfAutoMode">
    <template v-for="(col, ci) in columns" :key="col.key || ('_' + ci)">
      <!-- 필드 좌측 라벨 (label/slot 타입 제외, col.label 지정 시) -->
      <label v-if="col.label && col.type!=='label' && col.type!=='slot'" style="font-size:13px;color:var(--text-muted);white-space:nowrap;">
      {{ col.label }}
    </label>
    <!-- 라벨 텍스트 -->
    <label v-if="col.type==='label'" style="font-size:13px;color:var(--text-muted);white-space:nowrap;">
      {{ col.label }}
    </label>
    <!-- 슬롯 탈출구 -->
    <slot v-else-if="col.type==='slot'" :name="col.name || 'extra'">
    </slot>
    <!-- picker 박스 (input readonly + 버튼) -->
    <template v-else-if="col.type==='pick'">
      <input :value="col.display ? col.display(po(col)) : (po(col)[col.nameKey] || po(col)[col.key])"
          readonly :placeholder="col.placeholder || '선택'"
          :style="(col.width ? ('width:' + col.width) : 'width:140px;') + ';background:#f9f9f9;cursor:pointer;'"
          @click="handleSelectAction('field-pick-open', { col, target: po(col) })" />
      <button class="btn-outline btn-sm" @click="handleSelectAction('field-pick-open', { col, target: po(col) })">
        {{ col.openLabel || '검색' }}
      </button>
      <button v-if="po(col)[col.key]" class="btn-outline btn-sm" @click="handleSelectAction('field-pick-clear', { col, target: po(col) })">
        ✕
      </button>
    </template>
    <!-- 다중선택 -->
    <bo-multi-check-select v-else-if="col.type==='multiCheck'"
        v-model="po(col)[col.key]" :options="col.options"
        :placeholder="col.placeholder || '전체'" :all-label="col.allLabel || '전체 선택'"
        :min-width="col.minWidth || '160px'" />
    <!-- 텍스트 입력 -->
    <input v-else-if="col.type==='text'" v-model="po(col)[col.key]"
        :placeholder="col.placeholder" :style="col.width ? ('width:' + col.width) : ''"
        @keyup.enter="handleBtnAction('search-emit')" />
    <!-- select -->
    <select v-else-if="col.type==='select'" v-model="po(col)[col.key]"
        @change="handleSelectAction('field-select-change', { col, event: $event })">
      <option v-if="col.nullable !== false" value="">
        {{ col.nullLabel || '전체' }}
      </option>
      <option v-for="o in normOpts(col.options)" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <!-- 단일 날짜 -->
    <input v-else-if="col.type==='date'" type="date" v-model="po(col)[col.key]" />
    <!-- 날짜 범위 + (옵션) 기간유형 + (옵션) 옵션선택 select -->
    <template v-else-if="col.type==='dateRange'">
      <select v-if="col.typeKey" v-model="po(col)[col.typeKey]">
        <option v-for="c in normOpts(col.typeOptions)" :key="c.value" :value="c.value">
          {{ c.label }}
        </option>
      </select>
      <select v-if="fnHasRange1(col)" v-model="po(col)[col.key]"
          @change="handleSelectAction('field-range-change', { col, event: $event })"
          :style="col.rangeWidth ? ('min-width:' + col.rangeWidth) : ''">
        <option value="">
          {{ col.rangeFirstLabel || '기간 선택' }}
        </option>
        <option v-for="o in normOpts(col.rangeOptions)" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
      <input type="date" v-model="po(col)[col.startKey || 'dateStart']"
          :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
      <span :style="col.sepStyle || ''">
        ~
      </span>
      <input type="date" v-model="po(col)[col.endKey || 'dateEnd']"
          :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
      <select v-if="fnHasRange2(col)" v-model="po(col)[col.key]"
          @change="handleSelectAction('field-range-change', { col, event: $event })">
        <option value="">
          옵션선택
        </option>
        <option v-for="o in normOpts(col.rangeOptions)" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>
    </template>
  </template>
</template>
<slot>
</slot>
<div v-if="showActions" style="display:flex;gap:6px;margin-left:auto;">
  <slot name="actions-before">
  </slot>
  <button class="btn-blue" :disabled="loading" @click="handleBtnAction('search-emit')">
    {{ searchLabel }}
  </button>
  <button class="btn-outline btn-sm" @click="handleBtnAction('search-reset')">
    {{ resetLabel }}
  </button>
  <slot name="actions-after">
  </slot>
</div>
</div>
`,
};

/* ── 공통 헬퍼 (그리드 공유) ────────────────────────────────────────────── */
window._foAreaCompUtil = {
  normOptions(opts) {
    // 함수형 options 지원 (codes 지연 로드 대응)
    const arr = (typeof opts === 'function') ? opts() : opts;
    return (arr || []).map(o => ({
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
  tdStyle(col, row) {
    let s = '';
    if (col.align) s += 'text-align:' + col.align + ';';
    if (col.mono)  s += 'font-family:monospace;';
    // 모든 셀 기본 한 줄 말줄임(...). 편집/슬롯 셀은 col.noEllipsis 로 끌 수 있음.
    if (!col.noEllipsis && !col.edit) {
      s += 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    }
    // AG-Grid 식 cellStyle: 문자열 또는 (value,row)=>string. 미지정 시 기존 동작 동일
    if (col.cellStyle != null) {
      const ext = (typeof col.cellStyle === 'function')
        ? col.cellStyle(row ? row[col.key] : undefined, row)
        : col.cellStyle;
      if (ext) s += (s && !s.endsWith(';') ? ';' : '') + ext;
    }
    return s;
  },
  /* AG-Grid 식 cellClass: 문자열 또는 (value,row)=>string. 미지정 시 '' */
  cellClass(col, row) {
    if (col.cellClass == null) return '';
    return (typeof col.cellClass === 'function')
      ? (col.cellClass(row ? row[col.key] : undefined, row) || '')
      : col.cellClass;
  },
  /* AG-Grid 식 tooltipValueGetter 대응: cellTitle — true(=cellText) | string | (v,row)=>string */
  cellTitle(col, row) {
    // 기본: 셀 텍스트를 title 로 노출 (말줄임된 내용 hover 시 전체 표시).
    if (col.cellTitle === false) return null;
    if (col.cellTitle == null || col.cellTitle === true) {
      const t = this.cellText(col, row);
      return (t == null || t === '') ? null : String(t);
    }
    if (typeof col.cellTitle === 'function') {
      const v = col.cellTitle(row ? row[col.key] : undefined, row);
      return v == null ? null : String(v);
    }
    return String(col.cellTitle);
  },
  /* inner span 래퍼용 — 박스형 인라인 배지 (BoGrid와 동등) */
  cellInnerStyle(col, row) {
    if (col.cellInnerStyle == null) return null;
    const v = (typeof col.cellInnerStyle === 'function')
      ? col.cellInnerStyle(row ? row[col.key] : undefined, row)
      : col.cellInnerStyle;
    return v == null ? null : String(v);
  },
  cellInnerClass(col, row) {
    if (col.cellInnerClass == null) return null;
    const v = (typeof col.cellInnerClass === 'function')
      ? col.cellInnerClass(row ? row[col.key] : undefined, row)
      : col.cellInnerClass;
    return v == null ? null : String(v);
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

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfTotal = Vue.computed(() => U.pgTotal(props.pager, props.rows.length));
    const cfShowTfoot = Vue.computed(() => !!slots.tfoot && props.rows.length > 0);
    const cfPageNos = Vue.computed(() => {
      if (!props.pager) return [];
      const sz = U.pgSize(props.pager);
      const t = Math.max(1, Math.ceil(cfTotal.value / sz));
      return Array.from({ length: t }, (_, i) => i + 1);
    });
    const dragSrc = Vue.ref(null);
    const cfColspan = Vue.computed(() => props.columns.length
      + (props.showRowNo ? 1 : 0)
      + (props.selectable ? 1 : 0) + (props.draggable ? 1 : 0) + (props.rowActions ? 1 : 0));
    const cfTableStyle = Vue.computed(() => props.minWidth ? ('min-width:' + props.minWidth + ';') : '');
    const cfHasPager = Vue.computed(() => !!props.pager && !props.bare && cfPageNos.value.length > 1);

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoGrid : handleBtnAction -> ', cmd, param);
      if (cmd === 'toolbar-save') {
        return emit('save');
      } else if (cmd === 'pager-set') {
        U.pgSetNo(props.pager, param.n);
        return emit('set-page', param.n);
      } else if (cmd === 'pager-size-change') {
        return emit('size-change');
      } else if (cmd === 'grid-toggle-check-all') {
        return emit('toggle-check-all');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoGrid : handleSelectAction -> ', cmd, param);
      if (cmd === 'sort-toggle') {
        if (param.col.sortKey) return emit('sort', param.col.sortKey);
      } else if (cmd === 'grid-row-click') {
        if (typeof props.rowClick === 'function') props.rowClick(param.row);
        return emit('row-click', param.row);
      } else if (cmd === 'grid-row-tr-click') {
        if (typeof props.rowClick === 'function') return props.rowClick(param.row);
      } else if (cmd === 'grid-row-remove') {
        return emit('row-remove', param.row);
      } else if (cmd === 'grid-row-toggle-check') {
        const val = param.row[props.checkedKey || props.rowKey];
        return emit('toggle-check', val);
      } else if (cmd === 'grid-row-drag-start') {
        if (props.draggable) dragSrc.value = param.idx;
      } else if (cmd === 'grid-row-drag-over') {
        if (!props.draggable || dragSrc.value === null || dragSrc.value === param.idx) return;
        param.event.preventDefault();
        const moved = props.rows.splice(dragSrc.value, 1)[0];
        props.rows.splice(param.idx, 0, moved);
        dragSrc.value = param.idx;
      } else if (cmd === 'grid-row-drag-end') {
        if (dragSrc.value !== null) { dragSrc.value = null; emit('reorder'); }
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ── ▼ 내장 유틸 함수 ─────────────────────────────────────────────────── */
    const rowNo = (idx) => props.pager
      ? (U.pgNo(props.pager) - 1) * U.pgSize(props.pager) + idx + 1
      : idx + 1;

    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

    const fnRowStyle = (row, idx) => (typeof props.rowStyle === 'function' ? props.rowStyle(row, idx) : '');
    const fnRowClass = (row, idx) => {
      const base = typeof props.rowClass === 'function' ? (props.rowClass(row, idx) || '') : '';
      return base + (props.rowClick ? ' fo-grid-clickable' : '');
    };
    const fnIsExpanded = (row, idx) => (typeof props.isExpanded === 'function' ? !!props.isExpanded(row, idx) : false);

    const fnRowChkVal = (row) => row[props.checkedKey || props.rowKey];
    const fnRowChecked = (row) => (typeof props.isChecked === 'function' ? !!props.isChecked(fnRowChkVal(row)) : false);

    return { U, cfTotal, cfShowTfoot, cfPageNos, rowNo, sortIcon, sortActive,
             fnRowStyle, fnRowClass, fnIsExpanded, cfColspan,
             cfTableStyle, cfHasPager, fnRowChecked,
             handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div :class="bare ? '' : 'fo-grid-card'">
  <div v-if="!bare" class="fo-grid-toolbar">
    <span class="fo-grid-title">
      {{ listTitle }}
      <span class="fo-grid-count">
        {{ countText != null ? countText : ('총 ' + cfTotal + '건') }}
      </span>
    </span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <slot name="toolbar-actions">
      </slot>
      <button v-if="showSave" class="btn-blue btn-sm" @click="handleBtnAction('toolbar-save')">
        {{ saveLabel }}
      </button>
    </div>
  </div>
  <div class="fo-grid-scroll">
    <table class="fo-grid-table" :style="cfTableStyle">
      <thead>
        <tr>
          <th v-if="selectable" style="width:34px;text-align:center;">
            <input type="checkbox" :checked="allChecked" @change="handleBtnAction('grid-toggle-check-all')" />
          </th>
          <th v-if="draggable" style="width:26px;">
          </th>
          <th v-if="showRowNo" style="width:40px;text-align:center;">
            번호
          </th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :class="col.cls"
              :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;' : '')"
              @click="handleSelectAction('sort-toggle', { col })">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.sortKey"
                :style="sortActive(col) ? 'color:var(--accent);font-weight:bold;' : 'color:var(--text-muted);'">
                {{ sortIcon(col) }}
              </span>
            </th>
          </slot>
          <th v-if="rowActions" style="width:44px;text-align:center;">
            <slot name="head-actions">
              관리
            </slot>
          </th>
          <slot v-else name="head-actions">
          </slot>
        </tr>
      </thead>
      <tbody>
        <!-- ▼ grid-row 영역 -->
        <template v-for="(row, idx) in rows" :key="rowKey ? row[rowKey] : idx">
          <tr :style="fnRowStyle(row, idx)" :class="fnRowClass(row, idx)"
            :draggable="draggable" @click="handleSelectAction('grid-row-tr-click', { row })"
            @dragstart="handleSelectAction('grid-row-drag-start', { idx })"
            @dragover="handleSelectAction('grid-row-drag-over', { idx, event: $event })"
            @dragend="handleSelectAction('grid-row-drag-end')">
            <td v-if="selectable" style="text-align:center;" @click.stop>
              <input type="checkbox" :checked="fnRowChecked(row)" @change="handleSelectAction('grid-row-toggle-check', { row })" />
            </td>
            <td v-if="draggable" class="fo-grid-drag">
              ≡
            </td>
            <td v-if="showRowNo" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">
              {{ rowNo(idx) }}
            </td>
            <template v-for="col in columns" :key="col.key">
              <slot :name="'cell-' + col.key" :row="row" :idx="idx" :no="rowNo(idx)">
                <td :style="U.tdStyle(col, row)" :class="U.cellClass(col, row)" :title="U.cellTitle(col, row)">
                  <input v-if="col.edit==='text'" class="fo-grid-input" v-model="row[col.key]"
                    :placeholder="col.placeholder" />
                  <input v-else-if="col.edit==='number'" type="number" class="fo-grid-input fo-grid-num"
                    v-model.number="row[col.key]" />
                  <input v-else-if="col.edit==='date'" type="date" class="fo-grid-input"
                    v-model="row[col.key]" />
                  <select v-else-if="col.edit==='select'" class="fo-grid-select" v-model="row[col.key]">
                    <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">
                      {{ o.label }}
                    </option>
                  </select>
                  <span v-else-if="col.link" class="fo-grid-link" @click="handleSelectAction('grid-row-click', { row })">
                    {{ U.cellText(col, row) }}
                  </span>
                  <span v-else-if="col.badge" class="fo-grid-badge" :class="U.badgeClass(col, row)">
                    {{ U.cellText(col, row) }}
                  </span>
                  <span v-else-if="col.cellInnerStyle != null || col.cellInnerClass != null"
                    :style="U.cellInnerStyle(col, row)" :class="U.cellInnerClass(col, row)">
                    {{ U.cellText(col, row) }}
                  </span>
                  <template v-else>
                    {{ U.cellText(col, row) }}
                  </template>
                </td>
              </slot>
            </template>
            <td v-if="rowActions" style="text-align:center;">
              <slot name="row-actions" :row="row" :idx="idx">
                <button class="btn-outline btn-sm" @click="handleSelectAction('grid-row-remove', { row })">
                  ✕
                </button>
              </slot>
            </td>
            <slot v-else name="row-actions" :row="row" :idx="idx">
            </slot>
          </tr>
          <tr v-if="fnIsExpanded(row, idx)" class="fo-grid-expand-row">
            <slot name="row-expand" :row="row" :idx="idx" :colspan="cfColspan">
              <td :colspan="cfColspan">
              </td>
            </slot>
          </tr>
        </template>
        <tr v-if="!rows.length">
          <td :colspan="cfColspan" class="fo-grid-empty">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
      <tfoot v-if="cfShowTfoot">
        <slot name="tfoot" :rows="rows" :colspan="cfColspan">
        </slot>
      </tfoot>
    </table>
  </div>
  <!-- ▼ pager 영역 -->
  <div v-if="cfHasPager" class="fo-grid-pager">
    <button :disabled="U.pgNo(pager)===1" @click="handleBtnAction('pager-set', { n: Math.max(1, U.pgNo(pager)-1) })">
      ‹
    </button>
    <button v-for="p in cfPageNos" :key="p" :class="{ on: U.pgNo(pager)===p }" @click="handleBtnAction('pager-set', { n: p })">
      {{ p }}
    </button>
    <button :disabled="U.pgNo(pager)===cfPageNos.length" @click="handleBtnAction('pager-set', { n: Math.min(cfPageNos.length, U.pgNo(pager)+1) })">
      ›
    </button>
  </div>
</div>
`,
};

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

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfVisibleCount = Vue.computed(() =>
      props.rows.filter(r => r._row_status !== 'D').length);
    const allChecked = Vue.ref(props.checkAll);
    Vue.watch(() => props.checkAll, v => { allChecked.value = v; });
    const dragSrc = Vue.ref(null);
    const dragMoved = Vue.ref(false);
    const cfEmptyColspan = Vue.computed(() => {
      let n = props.columns.length + 1;            // 데이터 + 액션
      if (props.draggable)     n += 1;
      if (props.showRowNo)     n += 1;
      if (props.showRowId)     n += 1;
      if (props.showRowStatus) n += 1;
      if (props.showRowCheck)  n += 1;
      return n;
    });
    const cfTableStyle = Vue.computed(() => props.minWidth ? ('min-width:' + props.minWidth + ';') : '');

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoGridCrud : handleBtnAction -> ', cmd, param);
      if (cmd === 'toolbar-add') {
        return emit('add');
      } else if (cmd === 'toolbar-save') {
        return emit('save');
      } else if (cmd === 'toolbar-cancel-checked') {
        return emit('cancel-checked');
      } else if (cmd === 'toolbar-delete-checked') {
        return emit('delete-checked');
      } else if (cmd === 'grid-toggle-check-all') {
        const v = !allChecked.value;
        allChecked.value = v;
        props.rows.forEach(r => { r._row_check = v; });
        return emit('update:checkAll', v);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoGridCrud : handleSelectAction -> ', cmd, param);
      if (cmd === 'sort-toggle') {
        if (param.col.sortKey) return emit('sort', param.col.sortKey);
      } else if (cmd === 'grid-row-focus') {
        if (props.focusedIdx !== param.idx) return emit('update:focusedIdx', param.idx);
      } else if (cmd === 'grid-row-cell-change') {
        const row = param.row;
        if (row._row_status === 'I' || row._row_status === 'D') return emit('cell-change', row);
        if (row._row_org) {
          const changed = Object.keys(row._row_org).some(f => String(row[f]) !== String(row._row_org[f]));
          row._row_status = changed ? 'U' : 'N';
        }
        return emit('cell-change', row);
      } else if (cmd === 'grid-row-drag-start') {
        if (props.draggable) { dragSrc.value = param.idx; dragMoved.value = false; }
      } else if (cmd === 'grid-row-drag-over') {
        if (!props.draggable || dragSrc.value === null || dragSrc.value === param.idx) return;
        param.event.preventDefault();
        const moved = props.rows.splice(dragSrc.value, 1)[0];
        props.rows.splice(param.idx, 0, moved);
        dragSrc.value = param.idx;
        dragMoved.value = true;
      } else if (cmd === 'grid-row-drag-end') {
        if (dragMoved.value) emit('reorder');
        dragSrc.value = null; dragMoved.value = false;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ── ▼ 내장 유틸 함수 ─────────────────────────────────────────────────── */
    const fnStatusClass = s => 's-' + (s || 'N');
    const fnColTitle = (col) => (typeof props.cellTitle === 'function' ? props.cellTitle(col) : '');

    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

    return { U, cfVisibleCount, fnStatusClass, allChecked,
             fnColTitle, cfEmptyColspan, sortIcon, sortActive, cfTableStyle,
             handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="fo-grid-card">
  <div class="fo-grid-toolbar">
    <span class="fo-grid-title">
      {{ listTitle }}
      <span class="fo-grid-count">
        {{ cfVisibleCount }}건
      </span>
    </span>
    <div style="display:flex;gap:6px;margin-left:auto;">
      <slot name="toolbar-actions">
      </slot>
      <button v-if="showAdd" class="btn-outline btn-sm" @click="handleBtnAction('toolbar-add')">
        + 행추가
      </button>
      <button v-if="showRowCheck" class="btn-outline btn-sm" @click="handleBtnAction('toolbar-delete-checked')">
        행삭제
      </button>
      <button v-if="showRowCheck" class="btn-outline btn-sm" @click="handleBtnAction('toolbar-cancel-checked')">
        취소
      </button>
      <button v-if="showSave" class="btn-blue btn-sm" @click="handleBtnAction('toolbar-save')">
        저장
      </button>
    </div>
  </div>
  <div class="fo-grid-scroll" :style="'max-height:' + maxHeight + ';'">
    <table class="fo-grid-table" :style="cfTableStyle">
      <thead>
        <tr>
          <th v-if="draggable" style="width:26px;">
          </th>
          <th v-if="showRowNo" style="width:40px;text-align:center;">
            번호
          </th>
          <th v-if="showRowId" style="width:54px;text-align:center;">
            ID
          </th>
          <th v-if="showRowStatus" style="width:40px;text-align:center;">
            상태
          </th>
          <th v-if="showRowCheck" style="width:28px;text-align:center;">
            <input type="checkbox" :checked="allChecked" @change="handleBtnAction('grid-toggle-check-all')" />
          </th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :class="col.cls"
              :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;' : '')"
              :title="fnColTitle(col)" @click="handleSelectAction('sort-toggle', { col })">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.sortKey"
                :style="sortActive(col) ? 'color:var(--accent);font-weight:bold;' : 'color:var(--text-muted);'">
                {{ sortIcon(col) }}
              </span>
            </th>
          </slot>
          <th style="width:44px;">
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- ▼ grid-row 영역 -->
        <tr v-if="!rows.length">
          <td :colspan="cfEmptyColspan" class="fo-grid-empty">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-else v-for="(row, idx) in rows" :key="row[rowKey]"
          class="fo-grid-clickable" :class="[ 's-row-' + row._row_status, focusedIdx===idx ? 'fo-grid-focused' : '' ]"
          :draggable="draggable"
          :style="focusedIdx===idx ? 'outline:2px solid var(--accent) inset;' : ''"
          @click="handleSelectAction('grid-row-focus', { idx })"
          @dragstart="handleSelectAction('grid-row-drag-start', { idx })"
          @dragover="handleSelectAction('grid-row-drag-over', { idx, event: $event })"
          @dragend="handleSelectAction('grid-row-drag-end')">
          <td v-if="draggable" class="fo-grid-drag" title="드래그로 순서 변경">
            ⠿
          </td>
          <td v-if="showRowNo" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">
            {{ idx + 1 }}
          </td>
          <td v-if="showRowId" style="text-align:center;color:var(--text-muted);font-size:0.74rem;">
            {{ row[rowKey] > 0 ? row[rowKey] : 'NEW' }}
          </td>
          <td v-if="showRowStatus" style="text-align:center;">
            <span class="fo-grid-status" :class="fnStatusClass(row._row_status)">
              {{ row._row_status }}
            </span>
          </td>
          <td v-if="showRowCheck" style="text-align:center;" @click.stop>
            <input type="checkbox" v-model="row._row_check" />
          </td>
          <template v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="row" :idx="idx">
              <td :style="U.tdStyle(col, row)" :class="U.cellClass(col, row)" :title="U.cellTitle(col, row)">
                <input v-if="col.edit==='text'" class="fo-grid-input" :class="{ 'fo-grid-mono': col.mono }"
                  v-model="row[col.key]" :disabled="row._row_status==='D'"
                  :placeholder="col.placeholder" @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                <input v-else-if="col.edit==='number'" type="number" class="fo-grid-input fo-grid-num"
                  v-model.number="row[col.key]" :disabled="row._row_status==='D'"
                  @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                <input v-else-if="col.edit==='date'" type="date" class="fo-grid-input"
                  v-model="row[col.key]" :disabled="row._row_status==='D'"
                  @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                <select v-else-if="col.edit==='select'" class="fo-grid-select"
                  v-model="row[col.key]" :disabled="row._row_status==='D'"
                  @change="handleSelectAction('grid-row-cell-change', { row, col })">
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
                <span v-else-if="col.badge" class="fo-grid-badge" :class="U.badgeClass(col, row)">
                  {{ U.cellText(col, row) }}
                </span>
                <template v-else>
                  {{ U.cellText(col, row) }}
                </template>
              </td>
            </slot>
          </template>
          <td style="text-align:center;">
            <slot name="row-actions" :row="row" :idx="idx">
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`,
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
    boxPad:          { type: String,  default: '24px' },  // .modal-box 자체 padding (인라인 디자인 모달은 '0')
    bodyPad:         { type: String,  default: '0' },
    closeOnBackdrop: { type: Boolean, default: true },
    teleport:        { type: Boolean, default: true },
    onCloseCb:       { type: Function, default: null },  // 닫기 시 호출되는 콜백 (emit('close')와 병행)
    onConfirmCb:     { type: Function, default: null },  // 확인 시 호출되는 콜백 (#footer 슬롯 prop 'confirm' + emit('confirm'))
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfOverlayStyle = Vue.computed(() => 'z-index:' + props.zIndex + ';');
    const cfBoxStyle = Vue.computed(() =>
      'width:' + props.width + ';max-width:' + props.maxWidth + ';'
      + 'height:' + props.height + ';max-height:' + props.maxHeight + ';'
      + 'text-align:left;padding:' + props.boxPad + ';');
    const cfBodyStyle = Vue.computed(() =>
      'flex:1;overflow-y:auto;' + (props.bodyPad !== '0' ? ('padding:' + props.bodyPad + ';') : ''));

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (typeof props.onCloseCb === 'function') props.onCloseCb();
      } else if (cmd === 'modal-confirm') {
        emit('confirm');
        if (typeof props.onConfirmCb === 'function') props.onConfirmCb();
      } else if (cmd === 'modal-backdrop') {
        if (props.closeOnBackdrop) handleBtnAction('modal-close');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* footer slot prop 호환용 — 외부 슬롯이 confirm()/close() 호출하면 dispatch 경유 */
    const onClose = () => handleBtnAction('modal-close');
    const onConfirm = () => handleBtnAction('modal-confirm');

    return { onClose, onConfirm, cfOverlayStyle, cfBoxStyle, cfBodyStyle,
             handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<teleport to="body" :disabled="!teleport">
  <div v-if="show" class="modal-overlay" :style="cfOverlayStyle" @click.self="handleBtnAction('modal-backdrop')">
    <div class="modal-box fo-modal-box" :style="cfBoxStyle">
      <div v-if="title" class="fo-modal-header">
        <span class="fo-modal-title">
          {{ title }}
        </span>
        <span style="display:flex;align-items:center;gap:8px;">
          <slot name="header-extra">
          </slot>
          <button type="button" class="fo-modal-close" @click="handleBtnAction('modal-close')">
            ✕
          </button>
        </span>
      </div>
      <div :style="cfBodyStyle">
        <slot name="body">
          <slot>
          </slot>
        </slot>
      </div>
      <div v-if="$slots.footer" class="fo-modal-footer">
        <slot name="footer" :confirm="onConfirm" :close="onClose">
        </slot>
      </div>
    </div>
  </div>
</teleport>
`,
};

/* ── FoRowCancelDelete — FoGridCrud #row-actions 표준 취소/삭제 버튼 묶음 ─────
 * FO xs/Sample 6개에서 반복되던 #row-cancel / #row-delete 슬롯 패턴을 통일.
 *
 *   <template #row-actions="{ row }">
 *     <fo-row-cancel-delete :row="row" @cancel="onRowCancel(row)" @delete="onRowDelete(row)" />
 *   </template>
 *
 * 버튼 표시 조건 (BoRowCancelDelete 와 동일):
 *   취소: row._row_status ∈ ['U','I','D']
 *   삭제: row._row_status ∈ ['N','U']
 *
 * 스타일은 FO 톤(인라인 작은 버튼). BO 컴포넌트는 .btn 클래스 기반 ─ 디자인 분기. */
window.FoRowCancelDelete = {
  name: 'FoRowCancelDelete',
  props: {
    row:             { type: Object,  required: true },
    allowDeleteNull: { type: Boolean, default: false },
    cancelLabel:     { type: String,  default: '취소' },
    deleteLabel:     { type: String,  default: '삭제' },
  },
  emits: ['cancel', 'delete'],
  setup(props, { emit }) {
    /* ── ▼ row 영역 (CRUD 행 취소/삭제 버튼) ──────────────────────────────── */
    const cfShowCancel = Vue.computed(() => ['U', 'I', 'D'].includes(props.row._row_status));
    const cfShowDelete = Vue.computed(() => {
      const s = props.row._row_status;
      if (props.allowDeleteNull && s == null) return true;
      return ['N', 'U'].includes(s);
    });

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoRowCancelDelete : handleBtnAction -> ', cmd, param);
      if (cmd === 'row-cancel') {
        return emit('cancel');
      } else if (cmd === 'row-delete') {
        return emit('delete');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoRowCancelDelete : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return { cfShowCancel, cfShowDelete, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<span>
  <button v-if="cfShowCancel" @click.stop="handleBtnAction('row-cancel')"
    style="font-size:10px;padding:2px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">
    {{ cancelLabel }}
  </button>
  <button v-if="cfShowDelete" @click.stop="handleBtnAction('row-delete')"
    style="font-size:10px;padding:2px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;">
    {{ deleteLabel }}
  </button>
</span>
`,
};

/* ── FoFormArea ────────────────────────────────────────────────────────────
 * FO 폼을 columns 정의로 자동 렌더 (BoFormArea 의 FO 버전).
 * BO 와 다른 점: form-input/form-label/form-required/form-error 클래스 사용 +
 * CSS grid 레이아웃 (BO 는 flex form-row). FO 톤(라운드·간격) 보존.
 *
 *   <fo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
 *     :cols="2" :gap="14"
 *     @submit="handleSubmit" />
 *
 * column 타입:
 *   - 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'password'
 *   - 'select'   : options (배열|함수, sy_code|{value,label}|{codeValue,codeLabel} 호환)
 *   - 'readonly' : 표시 전용 (fmt 로 값 가공 가능)
 *   - 'slot'     : 슬롯 탈출구 (name 으로 슬롯 이름 지정)
 *   - 'rowBreak' : 강제 줄바꿈
 *
 * 공통 속성: required, placeholder, colSpan(1~N), width, rows, mono, hint,
 *           visible:(form)=>bool, onChange:(v,form,e)=>void, fmt:(v,form)=>string,
 *           clearErrOnInput:true (기본) — 입력 시 errors[key] 자동 제거 */
window.FoFormArea = {
  name: 'FoFormArea',
  props: {
    columns:     { type: Array,   required: true },  // 필드 정의
    form:        { type: Object,  required: true },  // form reactive
    errors:      { type: Object,  default: () => ({}) },
    cols:        { type: Number,  default: 2 },      // 한 줄 필드 수
    minColWidth: { type: String,  default: '240px' },// grid auto-fit 최소 너비
    gap:         { type: Number,  default: 14 },     // 필드 간격(px)
    showActions: { type: Boolean, default: false },  // FO 는 별도 제출 버튼이 많아 기본 off
    submitLabel: { type: String,  default: '확인' },
  },
  emits: ['submit'],
  setup(props, { emit }) {
    const U = window._foAreaCompUtil;

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfRows = Vue.computed(() => {
      const rows = []; let cur = []; let used = 0;
      for (const col of props.columns) {
        if (col.visible && !col.visible(props.form)) continue;
        if (col.type === 'rowBreak') { if (cur.length) { rows.push(cur); cur = []; used = 0; } continue; }
        const span = Math.min(col.colSpan || 1, props.cols);
        if (used + span > props.cols && cur.length) { rows.push(cur); cur = []; used = 0; }
        cur.push(col); used += span;
      }
      if (cur.length) rows.push(cur);
      return rows;
    });

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ FoFormArea : handleBtnAction -> ', cmd, param);
      if (cmd === 'form-submit') {
        return emit('submit');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ FoFormArea : handleSelectAction -> ', cmd, param);
      if (cmd === 'field-change') {
        /* errors 자동 제거 + col.onChange 콜백 */
        const col = param.col;
        if (col.clearErrOnInput !== false && props.errors[col.key] !== undefined) {
          delete props.errors[col.key];
        }
        if (col.onChange) return col.onChange(props.form[col.key], props.form, param.event);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const normOpts = (opts) => U.normOptions(opts);
    const dispVal = (col) => {
      const v = props.form[col.key];
      if (col.fmt) return col.fmt(v, props.form);
      return (v == null || v === '') ? '-' : v;
    };

    return { cfRows, normOpts, dispVal, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="fo-form-area">
  <div v-for="(row, ri) in cfRows" :key="ri"
    :style="{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax('+minColWidth+',1fr))',gap:gap+'px',marginBottom:gap+'px'}">
    <div v-for="col in row" :key="col.key" :style="(col.colSpan && col.colSpan>1 ? ('grid-column: span ' + Math.min(col.colSpan, cols) + ';') : '')">
    <!-- 라벨 -->
    <label v-if="col.type !== 'slot' && !col.hideLabel" class="form-label">
    {{ col.label }}
    <span v-if="col.required" class="form-required">
      *
    </span>
  </label>
  <!-- readonly 표시 -->
  <div v-if="col.type === 'readonly'"
        style="padding:10px 12px;background:#f9fafb;border-radius:6px;color:#374151;font-size:0.9rem;min-height:38px;display:flex;align-items:center;">
    {{ dispVal(col) }}
  </div>
  <!-- text/email/tel/password -->
  <input v-else-if="col.type === 'text' || col.type === 'email' || col.type === 'tel' || col.type === 'password'"
        class="form-input" :type="col.type === 'password' ? 'password' : (col.type === 'email' ? 'email' : (col.type === 'tel' ? 'tel' : 'text'))"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="col.readonly"
        :style="(col.mono ? 'font-family:monospace;' : '') + (col.width ? ('width:' + col.width + ';') : '') + (col.readonly ? 'background:#f5f5f5;' : '')"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })" />
  <!-- number -->
  <input v-else-if="col.type === 'number'" class="form-input" type="number"
        v-model.number="form[col.key]" :placeholder="col.placeholder"
        :readonly="col.readonly" :min="col.min" :max="col.max"
        :style="col.readonly ? 'background:#f5f5f5;' : ''"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })" />
  <!-- date -->
  <input v-else-if="col.type === 'date'" class="form-input" type="date"
        v-model="form[col.key]" :readonly="col.readonly"
        :class="errors[col.key] ? 'is-invalid' : ''" @change="handleSelectAction('field-change', { col, event: $event })" />
  <!-- textarea -->
  <textarea v-else-if="col.type === 'textarea'" class="form-input"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="col.readonly" :rows="col.rows || 5"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })"></textarea>
    <!-- select -->
    <select v-else-if="col.type === 'select'" class="form-input"
        v-model="form[col.key]" :disabled="col.readonly"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @change="handleSelectAction('field-change', { col, event: $event })">
      <option v-if="col.nullable !== false" value="">
        {{ col.nullLabel || '선택해주세요' }}
      </option>
      <option v-for="o in normOpts(col.options)" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <!-- slot 탈출구 -->
    <slot v-else-if="col.type === 'slot'" :name="col.name || col.key" :form="form" :col="col">
    </slot>
    <!-- 에러 메시지 / 힌트 -->
    <div v-if="errors[col.key]" class="form-error">
      {{ errors[col.key] }}
    </div>
    <div v-else-if="col.hint" style="font-size:11px;color:#888;margin-top:4px;">
      {{ col.hint }}
    </div>
  </div>
</div>
<!-- ▼ form-actions 영역 -->
<div v-if="showActions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
  <slot name="actions-before">
  </slot>
  <button class="btn-blue" @click="handleBtnAction('form-submit')" style="padding:13px 24px;">
    {{ submitLabel }}
  </button>
  <slot name="actions-after">
  </slot>
</div>
</div>
`,
};

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
 * BoGrid         — 서버 페이징 그리드 통합 컴포넌트
 *                  유형①(조회전용) + 유형②(일부 에디트)를 옵션으로 통합.
 *                  · sortState 전달 → 헤더 클릭 정렬 활성
 *                  · col.edit('text'|'number'|'date'|'select') → 인라인 입력 (구 Edit)
 *                  · draggable → 행 드래그 정렬 + reorder emit
 *                  · showSave → 툴바 [저장] 버튼 + save emit
 *                  · rowActions → 우측 행액션 컬럼(#row-actions 슬롯) 노출
 *                  columns[] 컬럼 객체 속성 (AG-Grid colDef 대응 — 단순 셀은
 *                    #cell- 슬롯 대신 아래 속성으로 선언, 슬롯 보일러플레이트 축소):
 *                    · key, label, style(th 인라인), cls(th class), width, align
 *                    · noHead       — 헤더 라벨 숨김(th 유지)
 *                    · sortKey      — 헤더 클릭 정렬(+ :sort-state + @sort)
 *                    · fmt(v,row)   — 셀 표시값 변환 (AG-Grid valueFormatter)
 *                                     조건부 포맷도 가능: (v)=> v>0?fmtW(v):'-'
 *                    · badge        — true|codeGrp|(row)=>badgeClass → 배지 렌더
 *                    · link         — true → title-link + @row-click emit
 *                    · refLink      — 'member'|'order'|'claim'|'prod' 등 type 문자열.
 *                                     ref-link 스타일 a 태그 + @ref-click emit({row,col,type})
 *                                     부모에서 `@ref-click="({type,row}) => showRefModal(type, row.xxx)"` 처리
 *                    · cellTitle    — true(=cellText) | string | (v,row)=>string. td :title 동적 바인딩(ellipsis 셀)
 *                    · mono         — monospace 폰트
 *                    · cellStyle    — 문자열 | (v,row)=>string. td 인라인 스타일
 *                                     합성(조건부 색상·ellipsis 등). 미지정 시 무영향
 *                    · cellClass    — 문자열 | (v,row)=>string. td class. 미지정 시 무영향
 *                    · cellInnerStyle/cellInnerClass — td 안 <span> 래퍼 style/class.
 *                                     박스형 인라인 배지(border-radius/padding/font-size 통째 인라인 스타일)
 *                                     를 columns 속성으로 옮길 때 사용. cellStyle 은 td 전체에,
 *                                     cellInnerStyle 은 inner span 에만 적용되어 외관 동일 유지.
 *                    · edit('text'|'number'|'date'|'select') + options → 인라인 입력
 *                  특수 셀(버튼 여러개·중첩 컴포넌트·이미지+텍스트·행토글/확장 등)만
 *                    #cell-{key} 슬롯 사용. 단순출력/배지/조건부색상은 위 속성으로.
 *                  props: columns, rows, pager, sortState, listTitle, rowClass,
 *                         rowStyle, draggable, showSave, rowActions, isExpanded,
 *                         rowClickable — true=<tr> 전체 클릭 시 row-click emit (행클릭 통일 패턴)
 *                                        button/input/select/title-link 등은 자동 @click.stop 보호
 *                                        셀 슬롯 내부 인터랙티브 요소는 부모가 @click.stop 책임
 *                  emit:  set-page(n), size-change, sort(key), row-click(row),
 *                         save, row-remove(row), reorder
 *                  슬롯: #toolbar-actions, #head, #head-actions, #cell-{key},
 *                        #row-actions, #row-expand,
 *                        #tfoot({rows,colspan}) — 합계행 등. 슬롯 없거나 rows 비면 미렌더
 *                          (Od*Dtl 항목 합계행처럼 그리드 하단 고정행 통합용)
 *
 * BoGridCrud     — CRUD 그리드 (전체 로드 / 페이징 없음 / 스크롤 480px / 행상태 N·I·U·D)
 *                  유형③: SyRole·SyBrand·SyBatch·SyDept·SyMenu·SyProp 류
 *                  rows 는 _row_status·_row_check·_row_org 를 가진 gridRows
 *                  행추가/삭제/취소/저장/드래그정렬/체크올 내장
 *                  고정컬럼 토글: draggable / showRowNo / showRowId / showRowStatus
 *                               / showRowCheck (체크OFF 시 행삭제·취소 버튼도 숨김)
 *                               / showAdd / showSave  ← 모두 기본 true
 *                  emit:  add, save, cancel-checked, delete-checked, reorder
 *                  헤더: #head 슬롯 없으면 columns 로 자동 생성.
 *                        col.label(표시명) / col.style(인라인) / col.cls(클래스
 *                        예 col-id·col-ord·col-use) / col.noHead(라벨 숨김, th 유지)
 *                        셀: BoGrid 와 동일 columns 속성 지원
 *                        (fmt/badge/cellStyle/cellClass/mono/align/edit)
 *                        정렬클릭·조건부 컬럼 등 동적 헤더만 #head 슬롯 사용
 *                  슬롯: #toolbar-actions, #head, #cell-{key},
 *                        #row-actions(우측 행액션 1컬럼 — 취소·삭제·설정 등 한 셀에)
 *                        표준 취소/삭제 버튼은 <bo-row-cancel-delete> 사용
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
 *     sortKey,          // 정렬키 (지정 시 헤더 클릭 정렬)
 *     edit,             // 'text'|'number'|'date'|'select' → 인라인 입력 (BoGrid/Crud)
 *     options,          // edit:'select' 일 때 [{codeValue,codeLabel}] 또는 [{value,label}]
 *     fmt,              // fn(value,row)=>표시문자열
 *     placeholder,      // edit input placeholder
 *     mono,             // true → 고정폭 폰트
 *     cellStyle,        // 문자열|(v,row)=>string — td 인라인 스타일
 *     cellClass,        // 문자열|(v,row)=>string — td class
 *     cellTitle,        // true|문자열|(v,row)=>string — td :title (ellipsis 셀)
 *     cellInnerStyle,   // 문자열|(v,row)=>string — td 안 <span> 래퍼 style (박스형 배지)
 *     cellInnerClass,   // 문자열|(v,row)=>string — td 안 <span> 래퍼 class
 *     refLink,          // 'member'|'order'|... type 문자열 → ref-link a 태그
 *     refKey,           // refLink 시 id 추출용 키(미지정 시 col.key)
 *   }
 *   특수 셀은 columns 에 두되 템플릿에서 <template #cell-{key}="{ row, idx, no }"> 로 override.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── BoSearchArea ─────────────────────────────────────────────────────────
 *  검색 영역 표준 컴포넌트. 슬롯 방식 + `:columns` 자동 렌더 방식 모두 지원.
 *
 *  :columns 자동 렌더 사용 시 — `baseSearchColumns` 배열 정의 후 `:param="searchParam"` 전달:
 *    [
 *      { key: 'searchType', type: 'multiCheck',
 *        options: [{value,label},...], placeholder: '검색대상 전체',
 *        allLabel: '전체 선택', minWidth: '160px' },
 *      { key: 'searchValue', type: 'text', placeholder: '검색어 입력', width: '180px' },
 *      { key: 'role', type: 'select', options: () => codes.user_roles, nullable: true, nullLabel: '권한 전체' },
 *      { key: 'status', type: 'select', options: () => codes.user_status, nullable: true, nullLabel: '상태 전체' },
 *      { key: 'dateRange', type: 'dateRange',
 *        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
 *        typeOptions: () => codes.user_date_types, rangeOptions: () => codes.date_range_opts,
 *        onRangeChange: fn },
 *      { label: '추가:', type: 'label' },                // 라벨 텍스트
 *      { type: 'slot', name: 'extra' },                  // 슬롯 탈출구
 *    ]
 *  옵션 함수형(`options: () => codes.x`) 지원 — 코드 지연 로드 대응.
 *
 *  columns 없으면 기본 default 슬롯 사용 (기존 화면 호환). */
window.BoSearchArea = {
  name: 'BoSearchArea',
  props: {
    columns:     { type: Array,   default: null },   // 자동 렌더용 필드 정의
    param:       { type: Object,  default: null },   // searchParam reactive (columns 사용 시)
    showActions: { type: Boolean, default: true },  // [조회][초기화] 버튼 노출
    searchLabel: { type: String,  default: '조회' },
    resetLabel:  { type: String,  default: '초기화' },
    loading:     { type: Boolean, default: false },
    barStyle:    { type: String,  default: '' },     // search-bar 인라인 style 보존용
  },
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;
    const onSearch = () => { if (!props.loading) emit('search'); };
    const onReset  = () => emit('reset');
    const normOpts = (opts) => U.normOptions(opts);
    // col.paramObj 가 있으면 그 객체를, 없으면 props.param 사용 — 컬럼별 다른 reactive 매핑 지원
    const po = (col) => col.paramObj || props.param;
    return { U, onSearch, onReset, normOpts, po };
  },
  template: /* html */`
<div class="search-bar" :style="barStyle" @keyup.enter="onSearch">
  <template v-if="columns && param">
    <template v-for="(col, ci) in columns" :key="col.key || ('_' + ci)">
      <!-- 필드 좌측 라벨 (label/slot 타입 제외, col.label 지정 시) -->
      <label v-if="col.label && col.type!=='label' && col.type!=='slot'" class="search-label">
        {{ col.label }}
      </label>
      <!-- 라벨 텍스트 -->
      <label v-if="col.type==='label'" class="search-label">{{ col.label }}</label>
      <!-- 슬롯 탈출구 -->
      <slot v-else-if="col.type==='slot'" :name="col.name || 'extra'"></slot>
      <!-- 회원/항목 picker 박스 (input readonly + 검색 버튼 + 클리어) — col.type==='pick' -->
      <template v-else-if="col.type==='pick'">
        <input :value="col.display ? col.display(po(col)) : (po(col)[col.nameKey] || po(col)[col.key])"
          readonly :placeholder="col.placeholder || '선택'"
          class="form-control" :style="(col.width ? ('width:' + col.width) : 'width:140px;') + ';background:#f9f9f9;cursor:pointer;'"
          @click="col.onOpen(po(col))" />
        <button class="btn btn-secondary btn-sm" @click="col.onOpen(po(col))">{{ col.openLabel || '검색' }}</button>
        <button v-if="po(col)[col.key]" class="btn btn-sm"
          style="padding:2px 6px;font-size:11px;color:#999;background:none;border:1px solid #ddd;"
          @click="col.onClear(po(col))">
          ✕
        </button>
      </template>
      <!-- 다중선택 (검색대상) -->
      <bo-multi-check-select v-else-if="col.type==='multiCheck'"
        v-model="po(col)[col.key]" :options="col.options"
        :placeholder="col.placeholder || '전체'" :all-label="col.allLabel || '전체 선택'"
        :min-width="col.minWidth || '160px'" />
      <!-- 텍스트 입력 -->
      <input v-else-if="col.type==='text'" v-model="po(col)[col.key]"
        :placeholder="col.placeholder" :style="col.width ? ('width:' + col.width) : ''"
        @keyup.enter="onSearch" />
      <!-- select (col.onChange: fn 지원) -->
      <select v-else-if="col.type==='select'" v-model="po(col)[col.key]"
        @change="col.onChange ? col.onChange($event) : null">
        <option v-if="col.nullable !== false" value="">{{ col.nullLabel || '전체' }}</option>
        <option v-for="o in normOpts(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <!-- 단일 날짜 -->
      <input v-else-if="col.type==='date'" type="date" v-model="po(col)[col.key]" class="date-range-input" />
      <!-- 날짜 범위 + (옵션) 기간유형 + (옵션) 옵션선택 select -->
      <template v-else-if="col.type==='dateRange'">
        <select v-if="col.typeKey" v-model="po(col)[col.typeKey]">
          <option v-for="c in normOpts(col.typeOptions)" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <!-- rangeFirst: true → rangeOptions select 를 date 앞에 표시 (옵션선택 placeholder는 col.rangeFirstLabel) -->
        <select v-if="col.rangeFirst && col.rangeOptions" v-model="po(col)[col.key]"
          @change="col.onRangeChange ? col.onRangeChange($event) : null"
          :style="col.rangeWidth ? ('min-width:' + col.rangeWidth) : ''">
          <option value="">{{ col.rangeFirstLabel || '기간 선택' }}</option>
          <option v-for="o in normOpts(col.rangeOptions)" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <input type="date" v-model="po(col)[col.startKey || 'dateStart']"
          :class="col.dateClass || 'date-range-input'" :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
        <span :class="col.sepClass || 'date-range-sep'" :style="col.sepStyle || ''">~</span>
        <input type="date" v-model="po(col)[col.endKey || 'dateEnd']"
          :class="col.dateClass || 'date-range-input'" :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
        <select v-if="!col.rangeFirst && col.rangeOptions" v-model="po(col)[col.key]"
          @change="col.onRangeChange ? col.onRangeChange($event) : null">
          <option value="">옵션선택</option>
          <option v-for="o in normOpts(col.rangeOptions)" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </template>
    </template>
  </template>
  <slot></slot>
  <div v-if="showActions" class="search-actions">
    <slot name="actions-before"></slot>
    <button class="btn btn-primary" :disabled="loading" @click="onSearch">{{ searchLabel }}</button>
    <button class="btn btn-secondary btn-sm" @click="onReset">{{ resetLabel }}</button>
    <slot name="actions-after"></slot>
  </div>
</div>
`,
};

/* ── 공통 헬퍼 (세 그리드 공유) ──────────────────────────────────────────── */
window._boAreaCompUtil = {
  /* 정렬·옵션 정규화 */
  normOptions(opts) {
    // 함수형 options 지원 (codes 지연 로드 대응) — 호출해 배열 획득
    const arr = (typeof opts === 'function') ? opts() : opts;
    return (arr || []).map(o => {
      // 문자열 배열도 지원 — ['A','B'] → [{value:'A',label:'A'}, ...]
      if (typeof o === 'string' || typeof o === 'number') return { value: o, label: String(o) };
      return {
        value: o.value != null ? o.value : o.codeValue,
        label: o.label != null ? o.label : o.codeLabel,
      };
    });
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
  tdStyle(col, row) {
    let s = 'font-size:12px;';
    if (col.align) s += 'text-align:' + col.align + ';';
    if (col.mono)  s += 'font-family:monospace;';
    // AG-Grid 식 cellStyle: 문자열 또는 (value,row)=>string. 마지막에 합성(미지정 시 기존 동작 동일)
    if (col.cellStyle != null) {
      const ext = (typeof col.cellStyle === 'function')
        ? col.cellStyle(row ? row[col.key] : undefined, row)
        : col.cellStyle;
      if (ext) s += (s.endsWith(';') ? '' : ';') + ext;
    }
    return s;
  },
  /* AG-Grid 식 cellClass: 문자열 또는 (value,row)=>string. 미지정 시 '' (class 영향 없음) */
  cellClass(col, row) {
    if (col.cellClass == null) return '';
    return (typeof col.cellClass === 'function')
      ? (col.cellClass(row ? row[col.key] : undefined, row) || '')
      : col.cellClass;
  },
  /* AG-Grid 식 tooltipValueGetter 대응: cellTitle — true(=cellText) | string | (v,row)=>string. ellipsis 셀의 :title 슬롯 제거용 */
  cellTitle(col, row) {
    if (col.cellTitle == null) return null;
    if (col.cellTitle === true) return String(this.cellText(col, row) || '');
    if (typeof col.cellTitle === 'function') {
      const v = col.cellTitle(row ? row[col.key] : undefined, row);
      return v == null ? null : String(v);
    }
    return String(col.cellTitle);
  },
  /* inner <span> 래퍼용 — 박스형 인라인 배지(border-radius/padding/font-size 등) 통째를 td 안 span 에 적용 */
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
};

/* ── BoGrid — 서버 페이징 그리드 통합 ──────────────────────────────────────
 * 옵션 조합으로 readonly/edit 두 유형을 모두 커버:
 *   · sortState 전달  → 헤더 클릭 정렬
 *   · col.edit 지정   → 인라인 input/select
 *   · draggable=true  → 행 드래그 정렬 + reorder emit
 *   · showSave=true   → 툴바 [저장] 버튼 + save emit
 *   · rowActions=true → 우측 행액션 컬럼(#row-actions 슬롯, 기본 ✕ 삭제) 노출
 * 기본값은 정렬 off·입력 off·드래그 off·저장 off·행액션 off (조회 전용 그리드).
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
    bare:       { type: Boolean, default: false },               // true=card/toolbar/pager 없이 <table>만 (뷰토글·공용페이저·인라인Dtl 화면용)
    selectable: { type: Boolean, default: false },               // true=좌측 체크박스 컬럼 + 헤더 전체선택 (일괄작업 목록용). 기본 off → 기존 화면 무영향
    checkedKey: { type: String,  default: null },                // 체크 식별 필드 (없으면 rowKey 사용). isChecked/toggleCheck 가 받는 값
    isChecked:  { type: Function, default: null },                // (key)=>bool. 행 체크 여부 (부모 Set 기반)
    allChecked: { type: Boolean, default: false },               // 헤더 전체선택 체크 상태 (부모 computed 미러)
    rowClickable: { type: Boolean, default: false },             // true=<tr> 전체 클릭 시 row-click emit (행클릭 통일로 #cell- 슬롯 제거 가능)
                                                                   // 셀 내부 button/select/input/checkbox 등은 @click.stop 자동 보호 — 행이벤트 미전파
  },
  emits: ['set-page', 'size-change', 'sort', 'row-click', 'save', 'row-remove', 'reorder', 'cell-change',
          'toggle-check', 'toggle-check-all', 'ref-click'],
  setup(props, { emit, slots }) {
    const U = window._boAreaCompUtil;
    const cfTotal = Vue.computed(() => props.pager ? (props.pager.pageTotalCount || 0) : props.rows.length);
    /* tfoot 슬롯 가드 — 템플릿 속성값 && 금지 정책상 computed 로 분리 */
    const cfShowTfoot = Vue.computed(() => !!slots.tfoot && props.rows.length > 0);

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
    /* refLink: 'member'|... type 문자열. col.refKey 가 있으면 row[refKey] 를 id 로 자동 추출(없으면 row[col.key]).
     * payload: { row, col, type, id } — 부모는 보통 id 만 받아 showRefModal(type, id) 호출 */
    const onRefClick = (row, col) => {
      const id = col.refKey ? row[col.refKey] : row[col.key];
      emit('ref-click', { row, col, type: col.refLink, id });
    };
    const onSave     = () => emit('save');
    const onRemove   = (row) => emit('row-remove', row);
    const onSetPage  = (n) => emit('set-page', n);
    const onSizeChg  = () => emit('size-change');
    const fnRowStyle = (row, idx) => (typeof props.rowStyle === 'function' ? props.rowStyle(row, idx) : 'cursor:pointer');
    const fnRowClass = (row, idx) => (typeof props.rowClass === 'function' ? props.rowClass(row, idx) : (row._isNew ? 'status-I' : ''));
    const fnIsExpanded = (row, idx) => (typeof props.isExpanded === 'function' ? !!props.isExpanded(row, idx) : false);

    /* 체크박스 — 부모 Set 기반. checkedKey(없으면 rowKey) 필드값을 식별자로 emit */
    const fnRowChkVal = (row) => row[props.checkedKey || props.rowKey];
    const fnRowChecked = (row) => (typeof props.isChecked === 'function' ? !!props.isChecked(fnRowChkVal(row)) : false);
    const onToggleCheck = (row) => emit('toggle-check', fnRowChkVal(row));
    const onToggleCheckAll = () => emit('toggle-check-all');

    /* 빈행 colspan = 데이터컬럼 + 번호 + (체크/드래그/행액션) */
    const cfColspan = Vue.computed(() => props.columns.length + 1
      + (props.selectable ? 1 : 0) + (props.draggable ? 1 : 0) + (props.rowActions ? 1 : 0));

    return { U, cfTotal, cfShowTfoot, rowNo, onSort, sortIcon, sortActive, onDragStart, onDragOver, onDragEnd,
             onRowClick, onRefClick, onSave, onRemove, onSetPage, onSizeChg,
             fnRowStyle, fnRowClass, fnIsExpanded, cfColspan,
             fnRowChecked, onToggleCheck, onToggleCheckAll };
  },
  template: /* html */`
<div :class="bare ? '' : 'card'">
  <div v-if="!bare" class="toolbar">
    <span class="list-title">
      {{ listTitle }}
      <span class="list-count">{{ countText != null ? countText : ('총 ' + cfTotal + '건') }}</span>
    </span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <slot name="toolbar-actions"></slot>
      <button v-if="showSave" class="btn btn-primary btn-sm" @click="onSave">{{ saveLabel }}</button>
    </div>
  </div>
  <table class="bo-table" :class="{ 'crud-grid': draggable || showSave }">
    <thead>
      <tr>
        <th v-if="selectable" style="width:36px;text-align:center;">
          <input type="checkbox" :checked="allChecked" @change="onToggleCheckAll" />
        </th>
        <th v-if="draggable" style="width:28px"></th>
        <th style="width:36px;text-align:center;">번호</th>
        <slot name="head">
          <th v-for="col in columns" :key="col.key" :class="col.cls"
            :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;white-space:nowrap;' : '')"
            @click="onSort(col)">
            {{ col.noHead ? '' : col.label }}
            <span v-if="col.sortKey"
              :style="sortActive(col) ? 'color:#e8587a;font-weight:bold;' : 'color:#bbb;'">
              {{ sortIcon(col) }}
            </span>
          </th>
        </slot>
        <th v-if="rowActions" style="width:40px;text-align:center;">
          <slot name="head-actions">관리</slot>
        </th>
        <slot v-else name="head-actions"></slot>
      </tr>
    </thead>
    <tbody>
      <template v-for="(row, idx) in rows" :key="rowKey ? row[rowKey] : idx">
        <tr :style="fnRowStyle(row, idx)" :class="fnRowClass(row, idx)"
          :draggable="draggable"
          @dragstart="onDragStart(idx)" @dragover="onDragOver($event, idx)" @dragend="onDragEnd"
          @click="rowClickable ? onRowClick(row) : null">
          <td v-if="selectable" style="text-align:center;" @click.stop>
            <input type="checkbox" :checked="fnRowChecked(row)" @change="onToggleCheck(row)" />
          </td>
          <td v-if="draggable" style="text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none">≡</td>
          <td style="text-align:center;font-size:11px;color:#999;">{{ rowNo(idx) }}</td>
          <template v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :row="row" :idx="idx" :no="rowNo(idx)">
              <td :style="U.tdStyle(col, row)" :class="U.cellClass(col, row)" :title="U.cellTitle(col, row)">
                <!-- 인라인 편집 셀 (행클릭 통일 시 @click.stop 으로 보호) -->
                <input v-if="col.edit==='text'" class="form-control" v-model="row[col.key]"
                  :placeholder="col.placeholder" style="padding:2px 6px;font-size:12px;"
                  @click.stop @input="$emit('cell-change', row, col)" />
                <input v-else-if="col.edit==='number'" type="number" class="form-control" v-model.number="row[col.key]"
                  style="padding:2px 6px;font-size:12px;width:80px;text-align:right;"
                  @click.stop @input="$emit('cell-change', row, col)" />
                <input v-else-if="col.edit==='date'" type="date" class="form-control" v-model="row[col.key]"
                  style="padding:2px 4px;font-size:11px;width:130px;text-align:center;"
                  @click.stop @input="$emit('cell-change', row, col)" />
                <select v-else-if="col.edit==='select'" class="form-control" v-model="row[col.key]"
                  style="padding:2px 4px;font-size:12px;"
                  @click.stop @change="$emit('cell-change', row, col)">
                  <option v-if="col.nullable" :value="null">{{ col.nullLabel || '-- 선택 --' }}</option>
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <!-- 표시경로 picker (bo-path-pick-field 자동 임베드) -->
                <bo-path-pick-field v-else-if="col.pathPick" :biz-cd="col.pathPick" :row="row" :disabled="row._row_status==='D'" @change="$emit('cell-change', row, col)" />
                <!-- 모달 인터셉트 select (col.selectIntercept: { valueKey | value:fn(row), options, onChange:fn(row,newVal,$event), nullable, nullLabel, disabled:fn(row) }) — v-model 미사용 -->
                <select v-else-if="col.selectIntercept" class="form-control grid-select" style="font-size:11px;padding:2px 4px;"
                  :value="typeof col.selectIntercept.value==='function' ? col.selectIntercept.value(row) : row[col.selectIntercept.valueKey]"
                  :disabled="typeof col.selectIntercept.disabled==='function' ? col.selectIntercept.disabled(row) : false"
                  @click.stop @change="col.selectIntercept.onChange(row, $event.target.value, $event)">
                  <option v-if="col.selectIntercept.nullable" value="">{{ col.selectIntercept.nullLabel || '-' }}</option>
                  <option v-for="o in U.normOptions(col.selectIntercept.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <!-- 외부 setter 인터셉트 input (col.editIntercept: { type:'text'|'number'|'date', placeholder, onInput:fn(row,newVal,idx,$event) }) — v-model 미사용 -->
                <input v-else-if="col.editIntercept" class="form-control" :type="col.editIntercept.type || 'text'"
                  :value="row[col.key]" :placeholder="col.editIntercept.placeholder" style="margin:0;padding:2px 6px;font-size:12px;"
                  @click.stop @input="col.editIntercept.onInput(row, $event.target.value, idx, $event)" />
                <!-- 풀폭 버튼 picker (col.linkButton: { label:fn(row)=>string, onClick:fn(row), suffix:string, btnClass:string }) -->
                <button v-else-if="col.linkButton" type="button"
                  :class="col.linkButton.btnClass || 'btn btn-secondary btn-xs'"
                  style="font-size:11px;width:100%;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                  @click.stop="col.linkButton.onClick(row)">
                  {{ col.linkButton.label(row) }}{{ col.linkButton.suffix != null ? ' ' + col.linkButton.suffix : ' ▼' }}
                </button>
                <!-- 셀별 토글 링크 (col.linkToggle: { active:fn(row)=>bool, activeStyle, baseStyle, title, onClick:fn(row) }) -->
                <span v-else-if="col.linkToggle" class="title-link" @click.stop="col.linkToggle.onClick(row)"
                  :title="col.linkToggle.title || null"
                  :style="col.linkToggle.active(row) ? (col.linkToggle.activeStyle || 'color:#e8587a;font-weight:700;') : (col.linkToggle.baseStyle || 'color:#1e88e5;font-weight:500;')">
                  {{ U.cellText(col, row) }}
                </span>
                <!-- 택배 추적 박스 그룹 (col.trackBoxes: { items:fn(row)=>[{label,courier,trackingNo,colorVariant}], onTrack:fn(courier,trackingNo) }) -->
                <template v-else-if="col.trackBoxes">
                  <div v-if="col.trackBoxes.items(row).length" style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;">
                    <span v-for="(it, ix) in col.trackBoxes.items(row)" :key="ix" @click.stop="col.trackBoxes.onTrack(it.courier, it.trackingNo)"
                      :style="'cursor:pointer;padding:1px 6px;border-radius:4px;font-weight:700;'
                      +(it.colorVariant==='orange'?'border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;':'border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;')">
                      {{ it.label ? it.label + ' ' : '' }}{{ it.courier }} · {{ it.trackingNo || '-' }} 🔍
                    </span>
                  </div>
                  <span v-else style="color:#ccc;">-</span>
                </template>
                <!-- 일시 picker (bo-date-time-picker 자동 임베드) — col.dateTimePick: { dateKey, timeKey, dateWidth, timeWidth, onChange? } -->
                <bo-date-time-picker v-else-if="col.dateTimePick"
                  :date="row[col.dateTimePick.dateKey]" :time="row[col.dateTimePick.timeKey]"
                  @update:date="v => { row[col.dateTimePick.dateKey] = v; $emit('cell-change', row, col); }"
                  @update:time="v => { row[col.dateTimePick.timeKey] = v; $emit('cell-change', row, col); }"
                  :show-now="col.dateTimePick.showNow !== false" :show-clear="col.dateTimePick.showClear !== false"
                  :date-width="col.dateTimePick.dateWidth || '104px'" :time-width="col.dateTimePick.timeWidth || '64px'" />
                <!-- 인라인 path-button (라벨 + 🔍 버튼 + onOpen 콜백) -->
                <div v-else-if="col.pathLabelOpen" :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:row[col.key]!=null?'#374151':'#9ca3af',fontWeight:row[col.key]!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}">
                  <span style="flex:1;">
                    {{ (typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(row[col.key]) : '') || (col.pathLabelOpen.placeholder || '경로 선택...') }}
                  </span>
                  <button type="button" @click.stop="col.pathLabelOpen.open(row)" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#6b7280;flex-shrink:0;padding:0;">
                    🔍
                  </button>
                </div>
                <!-- 표시 셀 (link는 cellInnerStyle/Class 합성 가능) -->
                <span v-else-if="col.link" class="title-link" @click.stop="onRowClick(row)"
                  :style="U.cellInnerStyle(col, row)" :class="U.cellInnerClass(col, row)">
                  {{ U.cellText(col, row) }}
                </span>
                <a v-else-if="col.refLink" href="#" class="ref-link" @click.stop.prevent="onRefClick(row, col)">
                  {{ U.cellText(col, row) }}
                </a>
                <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, row)">{{ U.cellText(col, row) }}</span>
                <span v-else-if="col.cellInnerStyle != null || col.cellInnerClass != null"
                  :style="U.cellInnerStyle(col, row)" :class="U.cellInnerClass(col, row)">
                  {{ U.cellText(col, row) }}
                </span>
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
        <td :colspan="cfColspan"
          style="text-align:center;padding:30px;color:#aaa">
          {{ emptyText }}
        </td>
      </tr>
    </tbody>
    <tfoot v-if="cfShowTfoot">
      <slot name="tfoot" :rows="rows" :colspan="cfColspan"></slot>
    </tfoot>
  </table>
  <!-- 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 (margin-top 좁힘, nowrap 보장) -->
  <div v-if="pager && !bare" style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
    <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChg"
      style="margin-top:0;min-height:34px;" />
  </div>
</div>
`,
};

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
    sortState:  { type: Object, default: null },               // { sortKey, sortDir } reactive — 지정 시 col.sortKey 헤더 클릭 정렬
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
          'update:checkAll', 'update:focusedIdx', 'export', 'sort', 'row-dblclick'],
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

    /* 헤더 클릭 정렬 — col.sortKey 가 있고 sortState 전달 시 활성 */
    const onSort = (col) => { if (col.sortKey) emit('sort', col.sortKey); };
    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

    return { U, cfVisibleCount, fnStatusClass, allChecked, onToggleCheckAll, onCellChange,
             onDragStart, onDragOver, onDragEnd, onAdd, onSave, onCancelChecked, onDeleteChecked,
             onExport, onSetFocused, fnColTitle, cfEmptyColspan, onSort, sortIcon, sortActive,
             cfTreeMode, cfDispRows, fnRow, fnRowKey, cfShowDrag, cfShowNo, cfShowId };
  },
  template: /* html */`
<div class="card">
  <div class="toolbar">
    <span class="list-title">{{ listTitle }} <span class="list-count">{{ cfVisibleCount }}건</span></span>
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
            <th v-for="col in columns" :key="col.key" :class="col.cls"
              :style="U.thStyle(col) + (col.sortKey ? 'cursor:pointer;user-select:none;white-space:nowrap;' : '')"
              :title="fnColTitle(col)" @click="onSort(col)">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.sortKey"
                :style="sortActive(col) ? 'color:#e8587a;font-weight:bold;' : 'color:#bbb;'">
                {{ sortIcon(col) }}
              </span>
            </th>
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
          @dblclick="$emit('row-dblclick', fnRow(item), idx)"
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
              <td :style="U.tdStyle(col, fnRow(item))" :class="U.cellClass(col, fnRow(item))" :title="U.cellTitle(col, fnRow(item))">
                <div v-if="col.edit==='text' && col.treeDepth" style="display:flex;align-items:center;">
                  <span :style="{ marginLeft:(fnRow(item)._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                    fontSize: fnRow(item)._depth===0 ? '7px' : '12px', flexShrink:0,
                    color: (typeof col.treeColor==='function' ? col.treeColor(fnRow(item)._depth) : '#888') }">
                    {{ typeof col.treeBullet==='function' ? col.treeBullet(fnRow(item)._depth) : '●' }}
                  </span>
                  <input class="grid-input" :class="{ 'grid-mono': col.mono }"
                    v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                    :placeholder="col.placeholder" @input="onCellChange(fnRow(item))" style="flex:1;" />
                </div>
                <input v-else-if="col.edit==='text'" class="grid-input" :class="{ 'grid-mono': col.mono }"
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
                  <option v-if="col.nullable" :value="null">{{ col.nullLabel || '-- 선택 --' }}</option>
                  <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <bo-path-pick-field v-else-if="col.pathPick" :biz-cd="col.pathPick" :row="fnRow(item)" :disabled="fnRow(item)._row_status==='D'" @change="onCellChange(fnRow(item))" />
                <div v-else-if="col.pathLabelOpen" :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color:fnRow(item)[col.key]!=null?'#374151':'#9ca3af',fontWeight:fnRow(item)[col.key]!=null?600:400,display:'flex',alignItems:'center',gap:'6px'}">
                  <span style="flex:1;">
                    {{ (typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(fnRow(item)[col.key]) : '') || (col.pathLabelOpen.placeholder || '경로 선택...') }}
                  </span>
                  <button type="button" @click.stop="col.pathLabelOpen.open(fnRow(item))" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#6b7280;flex-shrink:0;padding:0;">
                    🔍
                  </button>
                </div>
                <div v-else-if="col.parentPick" style="display:flex;align-items:center;gap:5px;">
                  <span v-if="fnRow(item)[col.key]"
                    style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                    :title="col.parentPick.label(fnRow(item)[col.key])">
                    {{ col.parentPick.label(fnRow(item)[col.key]) }}
                  </span>
                  <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">{{ col.parentPick.placeholder || '최상위' }}</span>
                  <button v-if="fnRow(item)._row_status!=='D'" class="btn btn-secondary btn-xs"
                    style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" :title="col.parentPick.title || '상위 선택'"
                    @click.stop="col.parentPick.open(fnRow(item))">
                    🔍
                  </button>
                </div>
                <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, fnRow(item))">{{ U.cellText(col, fnRow(item)) }}</span>
                <span v-else-if="col.cellInnerStyle != null || col.cellInnerClass != null"
                  :style="U.cellInnerStyle(col, fnRow(item))" :class="U.cellInnerClass(col, fnRow(item))">
                  {{ U.cellText(col, fnRow(item)) }}
                </span>
                <template v-else>{{ U.cellText(col, fnRow(item)) }}</template>
              </td>
            </slot>
          </template>
          <td class="col-act-val">
            <div class="col-act-box">
              <slot name="row-actions" :row="fnRow(item)" :idx="idx" :node="item"></slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`,
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
    <span class="list-title" style="font-size:13px;">
      📂 {{ title }}
      <span v-if="showBizCd" style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#{{ bizCd }}</span>
    </span>
    <span v-if="cfHasSel" @click="onSelect(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">{{ allLabel }}</span>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;'">
    <bo-path-tree :biz-cd="bizCd" :show-biz-cd="showBizCd" :selected="selected" @select="onSelect" />
  </div>
</div>
`,
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
    <span style="font-size:13px;font-weight:600;color:#555">
      📂 {{ title }}
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
</div>
`,
};

/* ── BoModal — 공통 모달 껍데기 래퍼 ────────────────────────────────────────
 * BaseModals.js 가 전역 주입하는 .modal-overlay / .modal-box / .modal-header /
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
 *   closeOnBackdrop — boolean. 배경 클릭 시 close (기본 true)
 *   teleport   — boolean. body 로 teleport (기본 true)
 *   onCloseCb   — Function|null. 닫기 시 호출되는 콜백 (emit('close')와 병행)
 *   onConfirmCb — Function|null. 확인 시 호출되는 콜백 (emit('confirm')와 병행)
 * emit:
 *   close      — 닫기 버튼 / 배경 클릭 / onClose
 *   confirm    — onConfirm 호출 시 (footer 슬롯의 confirm() 등)
 * 슬롯:
 *   default / #body  — 본문
 *   #footer          — 푸터 (있을 때만 렌더). 슬롯 prop { confirm, close } 제공
 *                      예: <template #footer="{ confirm, close }">
 *                            <button @click="close">취소</button>
 *                            <button @click="confirm">확인</button>
 *                          </template>
 *   #header-extra    — 제목 우측 추가 영역 (badge 등)
 *
 * callback 사용 예 (함수 prop 직접 전달):
 *   <bo-modal :show="m.show" :on-close-cb="() => m.show=false"
 *             :on-confirm-cb="handleSave">
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
    boxPad:          { type: String,  default: '20px' },  // .modal-box 자체 padding (인라인 디자인 모달은 '0')
    bodyPad:         { type: String,  default: '20px' },  // body 내부 padding
    closeOnBackdrop: { type: Boolean, default: true },
    teleport:        { type: Boolean, default: true },
    onCloseCb:       { type: Function, default: null },  // 닫기 시 호출되는 콜백 (emit('close')와 병행)
    onConfirmCb:     { type: Function, default: null },  // 확인 시 호출되는 콜백 (#footer 슬롯 prop 'confirm' + emit('confirm'))
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const onClose    = () => { emit('close'); if (typeof props.onCloseCb === 'function') props.onCloseCb(); };
    const onConfirm  = () => { emit('confirm'); if (typeof props.onConfirmCb === 'function') props.onConfirmCb(); };
    const onBackdrop = () => { if (props.closeOnBackdrop) onClose(); };
    const cfOverlayStyle = Vue.computed(() =>
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
      + 'background:rgba(18,24,40,0.55);z-index:' + props.zIndex + ';');
    const cfBoxStyle = Vue.computed(() =>
      'background:#fff;width:' + props.width + ';max-width:' + props.maxWidth + ';'
      + 'height:' + props.height + ';max-height:' + props.maxHeight + ';'
      + 'display:flex;flex-direction:column;padding:' + props.boxPad + ';overflow:hidden;');
    /* boxPad 가 0 이면 body wrapper 음수 마진/안쪽 padding 도 0 (인라인 디자인 모달) */
    const cfBodyOuterStyle = Vue.computed(() => {
      if (props.boxPad === '0' || props.boxPad === '0px') {
        return 'flex:1;overflow-y:auto;padding:' + props.bodyPad + ';';
      }
      return 'flex:1;overflow-y:auto;padding:' + props.bodyPad + ';margin:0 -' + props.boxPad + ';';
    });
    const cfBodyInnerStyle = Vue.computed(() => {
      if (props.boxPad === '0' || props.boxPad === '0px') return '';
      return 'padding:0 ' + props.boxPad + ';';
    });
    return { onClose, onConfirm, onBackdrop, cfOverlayStyle, cfBoxStyle, cfBodyOuterStyle, cfBodyInnerStyle };
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
      <div :style="cfBodyOuterStyle">
        <div :style="cfBodyInnerStyle">
          <slot name="body">
            <slot></slot>
          </slot>
        </div>
      </div>
      <div v-if="$slots.footer" class="modal-footer" style="flex-shrink:0;display:flex;justify-content:flex-end;gap:8px;padding:12px 0 0;border-top:1px solid #f0f0f0;margin-top:14px;">
        <slot name="footer" :confirm="onConfirm" :close="onClose"></slot>
      </div>
    </div>
  </div>
</teleport>
`,
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
</bo-modal>
`,
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
      @click="onSelect(null)">
      {{ rootLabel }}
    </div>
    <bo-path-parent-selector :node="node" :expanded="expanded"
      :on-toggle="onToggle" :on-select="onSelect" :depth="0" />
  </div>
</bo-modal>
`,
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
  <template #header-extra>
    <slot name="header-extra"></slot>
  </template>
  <div style="display:grid;grid-template-columns:300px 1fr;flex:1;overflow:hidden;height:100%;">
    <div style="border-right:1px solid #eee;overflow-y:auto;padding:12px;">
      <slot name="tree"></slot>
    </div>
    <div style="overflow-y:auto;padding:12px;">
      <slot name="perm"></slot>
    </div>
  </div>
  <template #footer>
    <span style="margin-right:auto;">
      <slot name="footer-extra"></slot>
    </span>
    <button class="btn btn-secondary" @click="onClose">취소</button>
    <button class="btn btn-primary" :disabled="confirmDisabled" @click="onConfirm">✔ {{ confirmLabel }}</button>
  </template>
</bo-modal>
`,
};

/* ── BoRowCancelDelete — CRUD 그리드 #row-actions 표준 취소/삭제 버튼 묶음 ─────
 * sy/ec 관리화면 ~9개에서 반복되던 _row_status 기반 [취소][삭제] 버튼 세트를 1줄로 대체.
 *
 *   <template #row-actions="{ row, idx }">
 *     <bo-row-cancel-delete :row="row" @cancel="cancelRow(idx)" @delete="deleteRow(idx)" />
 *   </template>
 *
 * 버튼 표시 조건 (기본):
 *   취소: row._row_status ∈ ['U','I','D']  (수정/신규/삭제 상태에서 되돌리기)
 *   삭제: row._row_status ∈ ['N','U']      (정상/수정 상태에서 삭제 마킹)
 *
 * 변형:
 *   allowDeleteNull=true → 삭제: row._row_status == null 또는 ['N','U'] (SyDeptMng 패턴)
 *
 * 추가 버튼이 필요한 화면(즉시실행/설정/코드관리 등)은 같은 #row-actions 슬롯 안에
 * 본 컴포넌트와 함께 일반 button 을 병기. 컴포넌트가 마지막에 표준 cancel/delete 만 렌더 */
window.BoRowCancelDelete = {
  name: 'BoRowCancelDelete',
  props: {
    row:             { type: Object,  required: true },
    allowDeleteNull: { type: Boolean, default: false },  // true=row._row_status null 도 삭제 가능 (SyDept 패턴)
    cancelLabel:     { type: String,  default: '취소' },
    deleteLabel:     { type: String,  default: '삭제' },
  },
  emits: ['cancel', 'delete'],
  setup(props, { emit }) {
    const cfShowCancel = Vue.computed(() => ['U', 'I', 'D'].includes(props.row._row_status));
    const cfShowDelete = Vue.computed(() => {
      const s = props.row._row_status;
      if (props.allowDeleteNull && s == null) return true;
      return ['N', 'U'].includes(s);
    });
    const onCancel = () => emit('cancel');
    const onDelete = () => emit('delete');
    return { cfShowCancel, cfShowDelete, onCancel, onDelete };
  },
  template: /* html */`
<span>
  <button v-if="cfShowCancel" class="btn btn-secondary btn-xs" @click.stop="onCancel">{{ cancelLabel }}</button>
  <button v-if="cfShowDelete" class="btn btn-danger btn-xs" @click.stop="onDelete">{{ deleteLabel }}</button>
</span>
`,
};

/* ── BoFormArea ────────────────────────────────────────────────────────────
 * 상세/등록 폼을 columns 정의로 자동 렌더 (BoSearchArea / BoGrid 의 폼 버전).
 *
 *   <bo-form-area :columns="baseFormColumns" :form="form" :errors="errors"
 *     :readonly="cfDtlMode" :cols="3"
 *     @save="handleSave" @cancel="navigate('xxx')" />
 *
 * column 타입:
 *   - 'text' | 'number' | 'date' | 'textarea' | 'password'
 *   - 'select'   : options (배열|함수, sy_code|{value,label}|{codeValue,codeLabel} 호환)
 *   - 'readonly' : 표시 전용 (fmt 로 값 가공 가능)
 *   - 'pathPick' : 표시경로 picker (bizCd 필요, form[col.key] 에 pathId 저장)
 *   - 'slot'     : 슬롯 탈출구 (name 으로 슬롯 이름 지정)
 *   - 'rowBreak' : 강제 줄바꿈 (다음 필드를 새 form-row 로)
 *
 * 공통 속성: required, placeholder, colSpan(1~N), width, min/max, mono, hint,
 *           visible:(form)=>bool, onChange:(v,form)=>void
 * cols prop: 한 줄 필드 수 (기본 3). colSpan 누적이 cols 초과 시 자동 줄바꿈. */
window.BoFormArea = {
  name: 'BoFormArea',
  props: {
    columns:     { type: Array,   required: true },  // 필드 정의
    form:        { type: Object,  required: true },  // form reactive
    errors:      { type: Object,  default: () => ({}) },
    readonly:    { type: Boolean, default: false },  // cfDtlMode (조회 모드)
    cols:        { type: Number,  default: 3 },      // 한 줄 필드 수
    showActions: { type: Boolean, default: true },
    saveLabel:   { type: String,  default: '저장' },
    cancelLabel: { type: String,  default: '취소' },
    editLabel:   { type: String,  default: '수정' },
    closeLabel:  { type: String,  default: '닫기' },
  },
  emits: ['save', 'cancel', 'edit', 'close'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;
    /* columns → 행별 그룹화 (rowBreak 또는 colSpan 누적이 cols 초과 시 줄바꿈) */
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
    const normOpts = (opts) => U.normOptions(opts);
    /* readonly 표시값 — fmt 가 있으면 사용, 없으면 form 값 그대로 */
    const dispVal = (col) => {
      const v = props.form[col.key];
      if (col.fmt) return col.fmt(v, props.form);
      return (v == null || v === '') ? '-' : v;
    };
    const onChange = (col, e) => { if (col.onChange) col.onChange(props.form[col.key], props.form, e); };
    const onSave = () => emit('save');
    const onCancel = () => emit('cancel');
    const onEdit = () => emit('edit');
    const onClose = () => emit('close');
    return { cfRows, normOpts, dispVal, onChange, onSave, onCancel, onEdit, onClose };
  },
  template: /* html */`
<div class="bo-form-area">
  <div v-for="(row, ri) in cfRows" :key="ri" class="form-row">
    <div v-for="col in row" :key="col.key"
      class="form-group"
      :style="(col.colSpan && col.colSpan>1 ? ('flex:' + col.colSpan) : '')">
      <!-- 라벨 (hideLabel:true 면 라벨 영역만 빈 칸으로 자리 유지) -->
      <label v-if="col.type !== 'slot' && !col.hideLabel" class="form-label">
        {{ col.label }}
        <span v-if="col.required && !readonly" class="req">
          *
        </span>
      </label>
      <label v-else-if="col.type !== 'slot' && col.hideLabel" class="form-label" style="visibility:hidden;">
        ·
      </label>
      <!-- readonly 표시 -->
      <div v-if="col.type === 'readonly'" class="readonly-field">{{ dispVal(col) }}</div>
      <!-- text / password -->
      <input v-else-if="col.type === 'text' || col.type === 'password'"
        class="form-control" :type="col.type === 'password' ? 'password' : 'text'"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly || col.readonly"
        :style="(col.mono ? 'font-family:monospace;' : '') + (col.width ? ('width:' + col.width + ';') : '') + (col.readonly ? 'background:#f5f5f5;' : '')"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="onChange(col, $event)" />
      <!-- number -->
      <input v-else-if="col.type === 'number'" class="form-control" type="number"
        v-model.number="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly || col.readonly" :min="col.min" :max="col.max"
        :style="col.readonly ? 'background:#f5f5f5;' : ''"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="onChange(col, $event)" />
      <!-- date -->
      <input v-else-if="col.type === 'date'" class="form-control" type="date"
        v-model="form[col.key]" :readonly="readonly"
        :class="errors[col.key] ? 'is-invalid' : ''" @change="onChange(col, $event)" />
      <!-- checkbox (Y/N 토글) -->
      <label v-else-if="col.type === 'checkbox'" style="display:flex;align-items:center;gap:6px;cursor:pointer;min-height:34px;">
        <input type="checkbox"
          :checked="form[col.key] === (col.checkedValue || 'Y')"
          :disabled="readonly"
          @change="form[col.key] = $event.target.checked ? (col.checkedValue || 'Y') : (col.uncheckedValue || 'N')" />
        <span>{{ col.checkboxLabel || col.label }}</span>
      </label>
      <!-- textarea -->
      <textarea v-else-if="col.type === 'textarea'" class="form-control"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly" :rows="col.rows || 3"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="onChange(col, $event)"></textarea>
      <!-- select -->
      <select v-else-if="col.type === 'select'" class="form-control"
        v-model="form[col.key]" :disabled="readonly"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @change="onChange(col, $event)">
        <option v-if="col.nullable !== false && col.nullLabel" value="">
          {{ col.nullLabel }}
        </option>
        <option v-for="o in normOpts(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <!-- pathPick (표시경로 선택 박스) -->
      <div v-else-if="col.type === 'pathPick'" style="display:flex;align-items:center;gap:8px;">
        <div :style="{flex:1,padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'13px',background:readonly?'#f9fafb':'#fff',color:form[col.key]!=null?'#374151':'#9ca3af',minHeight:'34px',display:'flex',alignItems:'center'}">
          {{ col.pathLabel ? col.pathLabel(form[col.key]) : (form[col.key] != null ? '#' + form[col.key] : '경로 선택...') }}
        </div>
        <button v-if="!readonly" type="button" class="btn btn-secondary btn-sm" @click="col.onOpen && col.onOpen(form)">
          🔍 선택
        </button>
        <button v-if="!readonly && form[col.key] != null" type="button" class="btn btn-sm" @click="form[col.key]=null" style="color:#999;">
          ✕
        </button>
      </div>
      <!-- slot 탈출구 -->
      <slot v-else-if="col.type === 'slot'" :name="col.name || col.key" :form="form" :col="col" :readonly="readonly"></slot>
      <!-- 에러 메시지 / 힌트 -->
      <span v-if="errors[col.key]" class="field-error">{{ errors[col.key] }}</span>
      <span v-else-if="col.hint" class="form-hint" style="font-size:11px;color:#888;">{{ col.hint }}</span>
    </div>
  </div>
  <!-- 폼 액션 버튼 -->
  <div v-if="showActions" class="form-actions">
    <slot name="actions-before"></slot>
    <template v-if="readonly">
      <button class="btn btn-primary" @click="onEdit">{{ editLabel }}</button>
      <button class="btn btn-secondary" @click="onClose">{{ closeLabel }}</button>
    </template>
    <template v-else>
      <button class="btn btn-primary" @click="onSave">{{ saveLabel }}</button>
      <button class="btn btn-secondary" @click="onCancel">{{ cancelLabel }}</button>
    </template>
    <slot name="actions-after"></slot>
  </div>
</div>
`,
};

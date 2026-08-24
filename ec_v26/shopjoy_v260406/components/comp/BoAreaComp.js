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
 *                    · link         — true → title-link + @cell-click emit({row,col,colKey,colIndex,rowIndex}) (제목 클릭 판별)
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
 *                  emit:  sort(key), row-click(row), cell-click({row,col,colKey,colIndex,rowIndex}),
 *                         save, row-remove(row), reorder
 *                  ※ 페이징은 그리드 외부 <bo-pager> 로만 구현 (내부 페이저 제거됨, set-page/size-change emit 없음)
 *                  ※ row-click=행 전체(rowClickable) 클릭 / cell-click=col.link 셀(제목) 클릭 — 분리됨
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
 *        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
 *        typeOptions: () => codes.user_date_types, rangeOptions: () => codes.date_range_opts,
 *        onRangeChange: fn },
 *      { label: '추가:', type: 'label' },                // 라벨 텍스트
 *      { type: 'slot', name: 'extra' },                  // 슬롯 탈출구
 *    ]
 *  옵션 함수형(`options: () => codes.x`) 지원 — 코드 지연 로드 대응.
 *
 *  columns 없으면 기본 default 슬롯 사용 (기존 화면 호환). */
/* ============================================================================
 * BoContainer — 업무화면 영역 표준 래퍼 (검색/목록/상세/이력 등 각 영역 1개)
 *   · .card 패딩·margin(§6.6) + 제목(list-title ● 자동) + 우측 액션 슬롯 표준화
 *   · 자체 카드 가진 자식(bo-grid/bo-path-tree-card)은 bare 로 두고 이 컨테이너가 카드 담당(이중카드 방지)
 *   props: title(영역 제목, 없으면 헤더 미표시), countText(제목 우측 건수), bare(카드 없이 슬롯만),
 *          bodyStyle(본문 인라인 style), cardStyle(.card 인라인 style)
 *   slots: default(영역 내용), toolbar-actions(제목 우측 버튼: 엑셀/신규 등), title(제목 커스텀)
 * ========================================================================== */
window.BoContainer = {
  name: 'BoContainer',
  props: {
    title:      { type: String, default: '' },   // 영역 제목(list-title). 비우면 헤더 영역 미표시
    titleId:    { type: [String, Number], default: '' }, // 제목 우측 회색 #ID 배지(Dtl 상세 ID). 비우면 미표시
    titleHint:  { type: String, default: '' },   // 제목 우측 옅은 회색 안내문구(행 미선택 안내 등). 비우면 미표시
    countText:  { type: String, default: '' },   // 제목 우측 건수 텍스트(예: '20건')
    bare:       { type: Boolean, default: false },// true=카드 없이 슬롯만(다른 래퍼가 카드 담당)
    bodyStyle:  { type: String, default: '' },    // 본문 인라인 style
    cardStyle:  { type: String, default: '' },    // .card 인라인 style(grid-column 등)
  },
  template: `
<div :class="bare ? '' : 'card'" :style="cardStyle">
  <slot name="top"></slot>
  <div v-if="title || titleId || titleHint || $slots['toolbar-actions'] || $slots.title" class="toolbar">
    <span class="list-title">
      <slot name="title">{{ title }}</slot>
      <span v-if="titleId" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">#{{ titleId }}</span>
      <span v-if="titleHint" style="font-size:12px;color:#bbb;margin-left:8px;font-weight:400;">{{ titleHint }}</span>
    </span>
    <div v-if="$slots['toolbar-actions']" style="display:flex;gap:6px;align-items:center;">
      <slot name="toolbar-actions"></slot>
    </div>
  </div>
  <div :style="bodyStyle">
    <slot></slot>
  </div>
</div>`,
};

/* ============================================================================
 * BoPage — 화면 최상단 타이틀(+선택 설명바) 표준 헤더
 *   · <div class="page-title">화면명</div> 반복(83화면) 통일
 *   · descSummary/descDetail 주면 page-desc-bar(요약 + ▼더보기 + 펼침 상세) 자동 렌더
 *     → 화면의 descOpen 상태 + 토글 핸들러 보일러플레이트 제거(내부 상태로 처리)
 *   props: title(화면명, page-title ● 자동), descSummary(설명 요약), descDetail(펼침 상세, 줄바꿈 \n 지원)
 *   slots: title(제목 커스텀), actions(제목 우측 버튼)
 * ========================================================================== */
window.BoPage = {
  name: 'BoPage',
  props: {
    title:       { type: String, default: '' },   // 화면 제목(page-title). ● 아이콘 CSS 자동
    descSummary: { type: String, default: '' },   // 설명 요약(한 줄). 있으면 page-desc-bar 렌더
    descDetail:  { type: String, default: '' },   // 펼침 상세(▼더보기 시 노출). \n 줄바꿈 지원
    showPdf:     { type: Boolean, default: true }, // 제목 우측 [📄 PDF 다운로드] 버튼 — 공통기능, 화면별로 끄고 싶으면 false
    showShare:   { type: Boolean, default: true }, // 제목 우측 [카카오톡 공유] 버튼 — 공통기능, 화면별로 끄고 싶으면 false
    showLink:    { type: Boolean, default: true }, // 제목 우측 [🔗 링크 공유(URL만)] 버튼 — 공통기능, 화면별로 끄고 싶으면 false
    shareQuery:  { type: Object, default: null },  // 공유 URL에 함께 실을 검색조건(searchParam 등) — 없으면 현재 URL 그대로
  },
  setup(props) {
    const descOpen = Vue.ref(false);
    /* fnBuildShareUrl — 현재 URL + shareQuery(검색조건)를 쿼리스트링으로 합쳐 공유 링크 생성.
       화면이 검색조건을 URL 이 아닌 로컬 state(searchParam)로만 들고 있어도, 공유 시점의
       조건을 받는 사람이 그대로 재현할 수 있게 한다(2026-08-23). */
    const fnBuildShareUrl = () => {
      const qs = new URLSearchParams(window.location.search);
      if (props.shareQuery) {
        Object.keys(props.shareQuery).forEach((k) => {
          const v = props.shareQuery[k];
          if (v !== null && v !== undefined && v !== '') qs.set(k, v);
          else qs.delete(k);
        });
      }
      const qsStr = qs.toString();
      return `${window.location.origin}${window.location.pathname}${qsStr ? '?' + qsStr : ''}`;
    };
    /* pdfAreaRef — 화면 전체(제목+설명+본문 슬롯 전부) PDF 캡처 대상. BoPage 를 쓰는 모든
       화면이 이 컴포넌트 하나로 PDF 다운로드를 자동으로 갖게 하기 위한 공통 구현(2026-08-22) —
       화면마다 따로 ref/버튼을 심지 않는다. */
    const pdfAreaRef = Vue.ref(null);
    const pdfExporting = Vue.ref(false);
    const handleExportPdf = async () => {
      pdfExporting.value = true;
      try {
        const filename = coUtil.cofBuildExportFilename((props.title || '화면') + '.pdf');
        await window.boUtil.bofExportPdf(pdfAreaRef.value, filename, window.boApp?.showToast);
      } finally {
        pdfExporting.value = false;
      }
    };
    /* handleShareKakao — 현재 BO 화면 URL을 카카오톡으로 공유(피드 템플릿).
       ⚠ BO 는 로그인 필요 화면이라 받는 사람도 계정이 있어야 실제로 열린다 — 이건 카카오
       공유 자체의 한계가 아니라 BO 접근제어 특성상 당연한 제약이라 화면에서 별도 처리하지 않는다. */
    const handleShareKakao = () => {
      try {
        window.coExtSdk.shareKakao({
          title: (props.title || 'ShopJoy 관리자') + ' - ShopJoy BO',
          description: props.descSummary || '',
          imageUrl: window.location.origin + '/assets/img/shopjoy-share-og.png',
          url: fnBuildShareUrl(),
        });
      } catch (e) {
        window.boApp?.showToast?.(e.message || '카카오톡 공유를 열 수 없습니다.', 'error', 0);
      }
    };
    /* handleCopyLink — 현재 BO 화면 URL을 클립보드에 복사(순수 URL만, 카카오톡 카드 없음) */
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(fnBuildShareUrl());
        window.boApp?.showToast?.('링크가 복사되었습니다.', 'success');
      } catch (e) {
        window.boApp?.showToast?.(e.message || '링크 복사에 실패했습니다.', 'error', 0);
      }
    };
    return { descOpen, pdfAreaRef, pdfExporting, handleExportPdf, handleShareKakao, handleCopyLink };
  },
  template: `
<div ref="pdfAreaRef">
  <div class="page-title" :style="($slots.actions || showPdf || showShare || showLink) ? 'display:flex;align-items:center;justify-content:space-between;' : ''">
    <span><slot name="title">{{ title }}</slot></span>
    <span v-if="$slots.actions || showPdf || showShare || showLink" style="display:flex;gap:6px;align-items:center;font-size:13px;font-weight:400;">
      <slot name="actions"></slot>
      <button v-if="showLink" class="btn btn_link" title="링크 공유(URL만)" @click="handleCopyLink">
        🔗
      </button>
      <button v-if="showShare" class="btn btn_kakao" title="카카오톡 공유" @click="handleShareKakao">
        💬
      </button>
      <button v-if="showPdf" class="btn btn_pdf" title="PDF 다운로드" :disabled="pdfExporting" @click="handleExportPdf">
        <span v-if="pdfExporting">⏳</span>
      <svg v-else width="18" height="20" viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2 H20 L28 10 V34 H4 Z" fill="#fff" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M20 2 V10 H28 Z" fill="#f3d4c0"/>
        <rect x="2" y="20" width="28" height="12" rx="2" fill="#e2372c"/>
        <text x="16" y="29" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">PDF</text>
      </svg>
      </button>
    </span>
  </div>
  <div v-if="descSummary" class="page-desc-bar">
    <span class="page-desc-summary">{{ descSummary }}</span>
    <button v-if="descDetail" class="page-desc-toggle" @click="descOpen = !descOpen">
      {{ descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="descOpen ? (descDetail) : false" class="page-desc-detail">{{ descDetail }}</div>
  </div>
  <!-- 화면 본문 (검색/목록/상세 등 모든 영역) -->
  <slot></slot>
</div>`,
};

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
    maxRows:     { type: Number,  default: 0 },       // 0=제한 없음(기존 동작). N>0 이면 기본 N줄만 노출 + 펼치기/접기
  },
  emits: ['search', 'reset'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;

    /* dateRange 옵션 popover — 열려있는 컬럼의 key. 한 번에 하나만 열림 */
    const rangePopoverKey = Vue.ref(null);
    const closeRangePopover = () => { rangePopoverKey.value = null; };
    Vue.onMounted(() => document.addEventListener('click', closeRangePopover));
    Vue.onUnmounted(() => document.removeEventListener('click', closeRangePopover));

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* ── ▼ search 영역 (검색바 전체) ─────────────────────────────────────── */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoSearchArea : handleBtnAction -> ', cmd, param);
      if (cmd === 'search-emit') {
        if (!props.loading) return emit('search');
      } else if (cmd === 'search-reset') {
        return emit('reset');
      } else if (cmd === 'range-popover-toggle') {
        // param: { col } — 같은 컬럼을 다시 누르면 닫힘, 다른 컬럼이면 그쪽으로 전환
        rangePopoverKey.value = rangePopoverKey.value === param.col.key ? null : param.col.key;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 필드 변경/콜백 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoSearchArea : handleSelectAction -> ', cmd, param);
      if (cmd === 'field-select-change') {
        // param: { col, event }
        return param.col && param.col.onChange ? param.col.onChange(param.event) : null;
      } else if (cmd === 'field-range-pick') {
        // param: { col, value } — 기간 옵션 popover 에서 클릭. 값은 반영만 하고 표시는 하지 않는다
        po(param.col)[param.col.key] = param.value;
        rangePopoverKey.value = null;
        return param.col.onRangeChange ? param.col.onRangeChange() : null;
      } else if (cmd === 'field-pick-open') {
        return param.col.onOpen(param.target);
      } else if (cmd === 'field-pick-clear') {
        return param.col.onClear(param.target);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const normOpts = (opts) => U.normOptions(opts);
    // col.paramObj 가 있으면 그 객체를, 없으면 props.param 사용 — 컬럼별 다른 reactive 매핑 지원
    const po = (col) => col.paramObj || props.param;
    /* col.disabled — 값 고정 필드(메뉴 자체가 조건을 확정하는 경우) 용.
       숨기지 않고 '보이되 못 바꾸게' 한다 — 어떤 조건으로 조회 중인지 사용자가 알 수 있어야 한다.
       boolean 또는 () => boolean 둘 다 허용. */
    const cfDisabled = (col) => (typeof col.disabled === 'function' ? !!col.disabled() : !!col.disabled);

    /* maxRows 펼치기/접기 — 컨테이너를 overflow:hidden 으로 자르지 않는다(자르면 그 안에 있는
       요소는 뭐든 함께 잘려 사라진다 — search-actions 를 안에 두었다가 버튼이 사라진 사고 있었음).
       대신 실제 DOM 에서 각 필드가 몇 번째 줄에 렌더됐는지 offsetTop 으로 측정해서, maxRows 를
       넘는 줄에 속한 필드'만' v-show 로 숨긴다. search-actions 는 항상 별도로 렌더되며 결코
       숨겨지지 않고, 남은 여유폭에 따라 자연스럽게 마지막 노출 줄 끝에 붙거나 다음 줄로 흐른다. */
    const expanded = Vue.ref(false);
    const measuredCutoff = Vue.ref(Infinity);   // 접힘 상태에서 이 컬럼 인덱스부터 숨김
    const fieldEls = {};                         // ci -> DOM 엘리먼트
    const setFieldRef = (ci, el) => { if (el) fieldEls[ci] = el; else delete fieldEls[ci]; };
    const cfFieldVisible = (ci) => expanded.value || ci < measuredCutoff.value;

    const searchActionsEl = Vue.ref(null);

    const measureRows = async () => {
      if (!props.maxRows || props.maxRows <= 0) { measuredCutoff.value = Infinity; return; }
      const wasExpanded = expanded.value;
      const cols = props.columns || [];

      /* onlyVisible=true 이면 현재 v-show 로 숨겨지지 않은 필드만 집계(display:none 요소는
         offsetTop 이 0으로 나와 줄 계산이 깨지므로 반드시 걸러야 함) */
      const computeRowTops = (onlyVisible) => {
        const tops = [];
        for (let ci = 0; ci < cols.length; ci++) {
          const el = fieldEls[ci];
          if (!el) continue;
          if (onlyVisible && !cfFieldVisible(ci)) continue;
          tops.push({ ci, top: el.offsetTop });
        }
        const rowTops = [];
        for (const t of tops) {
          if (!rowTops.length || t.top - rowTops[rowTops.length - 1] > 4) rowTops.push(t.top);
        }
        return { tops, rowTops };
      };

      expanded.value = true;           // 측정 동안은 전부 보이게(숨겨진 요소는 offsetTop 을 믿을 수 없음)
      await Vue.nextTick();
      let { tops, rowTops } = computeRowTops(false);

      let cutoffIdx = Infinity;
      if (rowTops.length > props.maxRows) {
        const cutoffTop = rowTops[props.maxRows];
        const firstHidden = tops.find(t => t.top >= cutoffTop - 2);
        if (firstHidden) cutoffIdx = firstHidden.ci;
      }
      measuredCutoff.value = cutoffIdx;
      expanded.value = false;
      await Vue.nextTick();

      /* search-actions(초기화/조회/펼치기)가 maxRows 를 넘는 줄로 밀려나면, 노출된 필드를 뒤에서부터
         하나씩 더 숨겨 그 줄에 여유를 만들어 actions 가 다시 maxRows 줄 안으로 올라오게 한다.
         버튼 자체는 절대 숨기지 않는다 — 더 숨길 필드가 없으면 그대로 포기하고 자연스럽게 흐르게 둔다. */
      for (let guard = 0; guard < cols.length + 1; guard++) {
        ({ tops, rowTops } = computeRowTops(true));
        if (!tops.length) break;
        const actionsTop = searchActionsEl.value ? searchActionsEl.value.offsetTop : 0;
        // actions 가 위치한 줄 번호(0-base) — 기존 필드 줄과 겹치면 그 줄, 아니면(필드 마지막 줄보다
        // 아래) 새로 생긴 다음 줄로 간주. maxRows 안(0 ~ maxRows-1)이면 통과.
        let actionsRowIdx = rowTops.findIndex(t => Math.abs(actionsTop - t) <= 4);
        if (actionsRowIdx < 0) actionsRowIdx = rowTops.length;
        if (actionsRowIdx <= props.maxRows - 1) break;
        measuredCutoff.value = tops[tops.length - 1].ci;
        await Vue.nextTick();
      }

      expanded.value = wasExpanded;    // 측정 위해 잠깐 켰던 펼침 상태 원복
    };

    const searchBarEl = Vue.ref(null);
    let ro = null;
    Vue.onMounted(() => {
      Vue.nextTick(measureRows);
      if (window.ResizeObserver && searchBarEl.value) {
        ro = new ResizeObserver(() => measureRows());
        ro.observe(searchBarEl.value);
      } else {
        window.addEventListener('resize', measureRows);
      }
    });
    Vue.onUnmounted(() => {
      if (ro) ro.disconnect(); else window.removeEventListener('resize', measureRows);
    });
    Vue.watch(() => props.columns, () => Vue.nextTick(measureRows));

    /* dateRange 컬럼의 typeKey 값이 비어있고 typeOptions(코드 지연 로드) 가 채워지면
       첫 번째 옵션으로 자동 채움 — 화면마다 초기값을 손으로 하드코딩할 필요 없게.
       비워두면 dateRangeType 이 빈 값이라 QdslUtil.dateBetween 이 조건 자체를 건너뛰어
       버튼상 날짜를 입력했는데도 조용히 필터가 안 걸리는 문제로 이어진다. */
    Vue.watchEffect(() => {
      for (const col of (props.columns || [])) {
        if (col.type !== 'dateRange' || !col.typeKey || !col.typeOptions) continue;
        const target = po(col);
        if (target[col.typeKey]) continue;
        const opts = normOpts(col.typeOptions);
        if (opts.length) target[col.typeKey] = opts[0].value;
      }
    });

    return { U, normOpts, po, cfDisabled, handleBtnAction, handleSelectAction, rangePopoverKey, expanded, cfFieldVisible, setFieldRef, searchBarEl, searchActionsEl };
  },
  template: /* html */`
<div class="search-bar" :style="barStyle" ref="searchBarEl" @keyup.enter="handleBtnAction('search-emit')">
  <!-- ▼ search 영역 -->
  <template v-if="columns ? (param) : false">
  <!-- 라벨 텍스트(type:'label') / 슬롯(type:'slot') 은 묶음(search-field) 밖에 단독 배치 -->
  <template v-for="(col, ci) in columns" :key="col.key || ('_' + ci)">
  <label v-if="col.type==='label'" class="search-label" v-show="cfFieldVisible(ci)" :ref="el => setFieldRef(ci, el)">
    {{ col.label }}
  </label>
  <slot v-else-if="col.type==='slot'" :name="col.name || 'extra'">
  </slot>
  <!-- 그 외 컨트롤은 라벨+컨트롤을 한 묶음(search-field)으로 감싸 함께 줄바꿈되게 함 -->
  <div v-else class="search-field" v-show="cfFieldVisible(ci)" :ref="el => setFieldRef(ci, el)">
    <!-- 필드 좌측 라벨 (col.label 지정 시)
         ⚠ dateRange 에 typeKey(기간유형 select)가 있으면 라벨을 렌더하지 않는다.
            select 자체가 '등록일자/수정일자' 처럼 필드명을 이미 보여주므로
            좌측 라벨("등록일")과 겹쳐 같은 말이 두 번 나온다.
            typeKey 가 없는 dateRange(예: CmNoticeMng)는 라벨이 유일한 설명이므로 그대로 유지. -->
    <label v-if="col.label &amp;&amp; !(col.type==='dateRange' &amp;&amp; col.typeKey)" class="search-label">
    {{ col.label }}
  </label>
  <!-- 회원/항목 picker 박스 (이름+ID 둘 다 직접 입력 + 팝업 + 클리어) — col.type==='pick'
       이름:ID = 기본 70px:20px. 한쪽에 직접 입력하면 반대쪽은 초기화(둘 다 채워지는 건 팝업 선택 시만) -->
  <template v-if="col.type==='pick'">
    <input :value="po(col)[col.nameKey || col.key] || ''"
          @input="e => { po(col)[col.nameKey || col.key] = e.target.value; if (col.nameKey && col.nameKey !== col.key) po(col)[col.key] = ''; }"
          :placeholder="col.placeholder || '이름입력'"
          class="form-control" :style="'width:' + (col.width || '70px') + ';'" />
    <input v-if="col.nameKey && col.nameKey !== col.key"
          :value="po(col)[col.key] || ''"
          @input="e => { po(col)[col.key] = e.target.value; po(col)[col.nameKey] = ''; }"
          :placeholder="col.idPlaceholder || 'ID입력'"
          class="form-control" :style="'width:' + (col.idWidth || '20px') + ';'" />
    <span style="display:inline-flex;align-items:center;">
      <button type="button" class="btn btn-secondary btn-sm" style="padding:0;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;" @click="handleSelectAction('field-pick-open', { col, target: po(col) })" :title="col.openLabel || '검색'">🔍</button>
      <button v-if="po(col)[col.key] || po(col)[col.nameKey]" type="button" style="background:none;border:none;padding:0 4px;color:#bbb;cursor:pointer;font-size:11px;line-height:1;" @click="handleSelectAction('field-pick-clear', { col, target: po(col) })" title="초기화">x</button>
    </span>
  </template>
  <!-- 다중선택 (검색대상) -->
  <bo-multi-check-select v-else-if="col.type==='multiCheck'"
        v-model="po(col)[col.key]" :options="typeof col.options==='function'?col.options():(col.options||[])"
        :placeholder="col.placeholder || '전체'" :all-label="col.allLabel || '전체 선택'"
        :min-width="col.minWidth || '160px'" />
  <!-- 텍스트 입력 -->
  <input v-else-if="col.type==='text'" v-model="po(col)[col.key]"
        :placeholder="col.placeholder" :style="col.width ? ('width:' + col.width) : ''"
        @keyup.enter="handleBtnAction('search-emit')" />
  <!-- select (col.onChange: fn 지원) -->
  <select v-else-if="col.type==='select'" v-model="po(col)[col.key]"
        :disabled="cfDisabled(col)"
        :style="cfDisabled(col) ? 'background:#f1f3f5;color:#495057;cursor:not-allowed;' : ''"
        :title="cfDisabled(col) ? '이 화면은 해당 값으로 고정되어 있습니다' : ''"
        @change="handleSelectAction('field-select-change', { col, event: $event })">
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
    <!-- rangeFirst: true → 옵션 아이콘(popover)을 date 앞에 표시 -->
    <span v-if="col.rangeFirst ? col.rangeOptions : false" style="position:relative;display:inline-flex;align-items:center;">
      <button type="button" class="btn btn-secondary btn-sm range-popover-trigger" style="padding:4px 6px;line-height:1;"
        :title="col.rangeFirstLabel || '기간 옵션'"
        @click.stop="handleBtnAction('range-popover-toggle', { col })">📅</button>
      <div v-if="rangePopoverKey === col.key" class="range-popover-menu"
        style="position:absolute;top:100%;left:0;z-index:50;background:#fff;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.14);padding:4px;margin-top:4px;min-width:76px;">
        <div v-for="o in normOpts(col.rangeOptions)" :key="o.value" class="range-popover-item"
          style="padding:6px 10px;font-size:12px;color:#333;cursor:pointer;border-radius:4px;white-space:nowrap;"
          @click.stop="handleSelectAction('field-range-pick', { col, value: o.value })">{{ o.label }}</div>
      </div>
    </span>
  <input type="date" v-model="po(col)[col.startKey || 'dateRangeStart']"
          :class="col.dateClass || 'date-range-input'" :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
  <span :class="col.sepClass || 'date-range-sep'" :style="col.sepStyle || ''">
    ~
  </span>
  <input type="date" v-model="po(col)[col.endKey || 'dateRangeEnd']"
          :class="col.dateClass || 'date-range-input'" :style="col.dateWidth ? ('width:' + col.dateWidth) : ''" />
  <!-- rangeFirst 아니면(기본) 옵션 아이콘(popover)을 date 뒤에 표시 -->
  <span v-if="!col.rangeFirst ? col.rangeOptions : false" style="position:relative;display:inline-flex;align-items:center;">
    <button type="button" class="btn btn-secondary btn-sm range-popover-trigger" style="padding:4px 6px;line-height:1;"
      :title="col.rangeFirstLabel || '기간 옵션'"
      @click.stop="handleBtnAction('range-popover-toggle', { col })">📅</button>
    <div v-if="rangePopoverKey === col.key" class="range-popover-menu"
      style="position:absolute;top:100%;right:0;z-index:50;background:#fff;border:1px solid #e0e0e0;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.14);padding:4px;margin-top:4px;min-width:76px;">
      <div v-for="o in normOpts(col.rangeOptions)" :key="o.value" class="range-popover-item"
        style="padding:6px 10px;font-size:12px;color:#333;cursor:pointer;border-radius:4px;white-space:nowrap;"
        @click.stop="handleSelectAction('field-range-pick', { col, value: o.value })">{{ o.label }}</div>
    </div>
  </span>
</template>
  </div>
</template>
</template>
<slot>
</slot>
<!-- search-actions 는 항상 노출(v-show 로 숨기지 않음) — 접힘 상태에서 남은 필드들과 같은
     wrap 흐름을 공유한다. measureRows 가 이 버튼 줄이 maxRows 를 넘으면 필드를 하나씩 더 숨겨
     maxRows 줄 안으로 끌어올린다(그래도 안 맞으면 자연스럽게 흐르게 포기).
     순서: 초기화 → 조회 → 펼치기/접기(아이콘). maxRows 미사용 화면은 펼치기 버튼 자체가 없다 -->
<div v-if="showActions" class="search-actions" ref="searchActionsEl">
  <slot name="actions-before">
  </slot>
  <button type="button" class="btn btn_reset" style="padding:0;width:26px;height:26px;font-size:13px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;" :title="resetLabel" @click="handleBtnAction('search-reset')">🔄</button>
  <button class="btn btn_search" :disabled="loading" @click="handleBtnAction('search-emit')">
    {{ searchLabel }}
  </button>
  <button v-if="maxRows > 0" type="button" class="btn btn-secondary btn-sm" style="padding:0;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;"
    :title="expanded ? '접기' : '펼치기'" @click="expanded = !expanded">
    <span :style="'display:inline-block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;' + (expanded ? 'border-bottom:5px solid currentColor;' : 'border-top:5px solid currentColor;')"></span>
  </button>
  <slot name="actions-after">
  </slot>
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
    return (arr || []).filter(o => o != null).map(o => {
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
  /* autoAlign — align 미지정 컬럼 자동 정렬(전체공통): 돈=우측, 코드성=가운데, 그 외 좌측('')
     명시 col.align 우선. 편집/슬롯 셀은 적용 제외(편집 UI 정렬 깨짐 방지). */
  autoAlign(col) {
    if (col.align) return col.align;
    if (col.edit || col.type === 'slot') return '';
    const k = String(col.key || '').toLowerCase();
    const l = String(col.label || '');
    // 조회수/히트수 등 '집계 카운트'는 코드성보다 먼저 가운데로(돈 cnt 오탐 회피). 조회수=가운데 정책.
    if (/viewcnt|hitcnt|viewcount|readcnt/.test(k) || /조회수|방문수|클릭수/.test(l)) {
      return 'center';
    }
    // 돈/수량/율 → 우측.
    //  ⚠️ 토큰을 단어경계(접미/세그먼트)로 매칭 — 부분일치 오탐 방지.
    //     예) 'discnt'(할인) 의 'cnt' 가 count 로 오탐 → 할인명/유형/상태가 우측정렬되던 버그(2026-06-06 수정).
    //     key 는 camelCase→lowercase 라 경계 소실 → 접미(`...token$`) 또는 세그먼트(`_token`) 기준으로 제한.
    const MONEY = ['amt', 'price', 'balance', 'fee', 'qty', 'cnt', 'count', 'rate', 'cost', 'stock', 'point', 'sum', 'total', 'value'];
    const moneyKey = MONEY.some(t => new RegExp('(^|_)' + t + '(_|$)|' + t + '$').test(k));
    if (moneyKey
      || /금액|가격|잔액|배송비|할인값|할인가|수량|개수|건수|단가|합계|총액|포인트|적립금|충전금|재고|\(원\)|원\)$|율$/.test(l)) {
      return 'right';
    }
    // 코드성(상태/유형/구분/여부/코드/등급/대상/방식) → 가운데
    if (/(^|_)(cd|code|status|type|yn|flag|state|target)$/.test(k) || /cd$|status$|yn$|type$|typecd|statuscd|targetcd|target$/.test(k)
      || /date$|regdate|moddate|period/.test(k)
      || /^상태$|^유형$|^구분$|여부|^코드$|^등급$|^타입$|^단계$|일$|일시$|기간|등록일|수정일|작성일|시작일|종료일|^대상$|적용대상|대상$|^방식$|^방법$|^분류$|^레벨$|유형$/.test(l)) {
      return 'center';
    }
    // 이름/제목성(명/제목/title/name) → 좌측 (가독성). default 도 '' 이지만 의도 명시.
    if (/(nm|name|title|label)$/.test(k) || /명$|제목|이름|타이틀/.test(l)) {
      return '';
    }
    return '';
  },
  /* th style 문자열 — 헤더는 전체공통 가운데 정렬(셀 정렬과 무관). 구분선은 CSS(.bo-table th) */
  thStyle(col) {
    if (col.style) return col.style;            // 원본 인라인 스타일 직접 지정 시 우선
    let s = 'text-align:center;';
    if (col.width) s += 'width:' + col.width + ';';
    return s;
  },
  tdStyle(col, row) {
    let s = 'font-size:12px;';
    const al = this.autoAlign(col);
    if (al) s += 'text-align:' + al + ';';
    if (col.mono)  s += 'font-family:monospace;';
    // 링크 셀(col.link)만 손가락 커서 — 행 전체 cursor:pointer 폐지(링크 있는 셀만 클릭 가능 표시)
    if (col.link) s += 'cursor:pointer;';
    // 모든 셀 기본 한 줄 말줄임(...). 편집/슬롯 셀은 col.noEllipsis 로 끌 수 있음.
    // col.style/cellStyle 의 width(또는 max-width) 가 있으면 그 폭에서 잘리고,
    // 폭 미지정이면 한 줄 유지(nowrap)만 — 줄바꿈으로 인한 행 높이 증가 방지.
    if (!col.noEllipsis && !col.edit) {
      s += 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    }
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
    // 기본: 셀 텍스트를 title 로 노출 (말줄임된 내용 hover 시 전체 표시).
    //  - col.cellTitle 미지정 → cellText 자동
    //  - col.cellTitle === true → cellText
    //  - 문자열/함수 → 해당 값
    //  - col.cellTitle === false → title 없음
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
    listTitle:  { type: String, default: '목록' },               // toolbar 좌측 제목 (좌측 ● 아이콘은 .list-title::before CSS 전역 처리)
    rowKey:     { type: String, default: null },                 // :key 필드 (없으면 idx)
    rowStyle:   { type: Function, default: null },               // (row,idx)=>style (행 강조 등 고유 UX 보존)
    rowClass:   { type: Function, default: null },               // (row,idx)=>class (행 상태 강조)
    countText:  { type: String,  default: null },                // 건수 커스텀 ('총 N건' 대신). null=기본
    loadedCount:{ type: Number,  default: null },                // 적재 건수(무한스크롤). 주면 '총 N건 · 조회 M건'
    scrollEndOffset: { type: Number, default: 500 },             // 바닥에서 N px 앞에서 scroll-end 발화 (≈15행)
    fitBottom:  { type: [Boolean, Number], default: false },      // 그리드를 화면 하단까지 채움. 숫자=하단 예약 px
    isExpanded: { type: Function, default: null },               // (row,idx)=>bool. 행펼침 여부
    draggable:  { type: Boolean, default: false },               // 행 드래그 정렬
    showSave:   { type: Boolean, default: false },               // 툴바 [저장] 버튼
    saveLabel:  { type: String,  default: '저장' },              // 저장 버튼 라벨
    rowActions: { type: Boolean, default: false },               // 우측 행액션 컬럼 노출
    loading:        { type: Boolean, default: false },            // 조회 중: 툴바 '⏳ 조회 중…' + 기존 행 위 오버레이 + 빈 목록 문구 전환
    emptyText:      { type: String, default: '데이터가 없습니다.' },
    tableMaxHeight: { type: String, default: null },             // 테이블 영역 최대 높이 (예: '320px'). null=기본(calc(100vh-380px))
    fixedHeight:    { type: Boolean, default: false },           // true=tableMaxHeight 를 고정 height 로 적용(행이 적어도 빈 공간 유지, 페이징 시 하단 요소 안 흔들림). false(기본)=max-height(내용만큼 줄어듦)
    bare:           { type: Boolean, default: false },           // true=card/toolbar/pager 없이 <table>만 (뷰토글·공용페이저·인라인Dtl 화면용)
    narrow:         { type: Boolean, default: false },           // true=.bo-table 기본 min-width(720px) 해제. .bo-2col 좌측처럼 좁은 선택 목록용
    selectable: { type: Boolean, default: false },               // true=좌측 체크박스 컬럼 + 헤더 전체선택 (일괄작업 목록용). 기본 off → 기존 화면 무영향
    checkedKey: { type: String,  default: null },                // 체크 식별 필드 (없으면 rowKey 사용). isChecked/toggleCheck 가 받는 값
    isChecked:  { type: Function, default: null },                // (key)=>bool. 행 체크 여부 (부모 Set 기반)
    allChecked: { type: Boolean, default: false },               // 헤더 전체선택 체크 상태 (부모 computed 미러)
    rowClickable: { type: Boolean, default: false },             // true=<tr> 전체 클릭 시 row-click emit (행클릭 통일로 #cell- 슬롯 제거 가능)
                                                                   // 셀 내부 button/select/input/checkbox 등은 @click.stop 자동 보호 — 행이벤트 미전파
    gridId:       { type: String,  default: '' },                // 그리드 식별자(=셀 클릭 라우터 cmd, 예: 'members-cellClick'). @cell-click emit 의 e.cmd + #row-actions 슬롯 gridId 로 전달 → cmd 한 곳 정의
    selectedKey: { type: [String, Number], default: null },      // 선택된 행의 rowKey 값. 일치하는 행에 .bo-row-selected (파란 테두리) 자동 부여
    showRowNo:  { type: Boolean, default: true },                 // 번호 컬럼 표시. false=columns 배열에 직접 정의한 커스텀 번호 컬럼(예: 역순 카운트) 사용 시 끔 — 중복 방지
  },
  emits: ['scroll-end', 'sort', 'row-click', 'row-dblclick', 'cell-click', 'save', 'row-remove', 'reorder', 'cell-change',
          'toggle-check', 'toggle-check-all', 'ref-click'],
  setup(props, { emit, slots }) {
    const U = window._boAreaCompUtil;

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfTotal = Vue.computed(() => props.pager ? (props.pager.pageTotalCount || 0) : props.rows.length);
    /* tfoot 슬롯 가드 — 템플릿 속성값 && 금지 정책상 computed 로 분리 */
    const cfShowTfoot = Vue.computed(() => !!slots.tfoot && props.rows.length > 0);
    /* 드래그 정렬 — rows 를 in-place splice 후 reorder emit */
    const dragSrc = Vue.ref(null);
    /* 빈행 colspan = 데이터컬럼 + 번호 + (체크/드래그/행액션) */
    const cfColspan = Vue.computed(() => props.columns.length + (props.showRowNo ? 1 : 0)
      + (props.selectable ? 1 : 0) + (props.draggable ? 1 : 0) + (props.rowActions ? 1 : 0));

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    /* handleBtnAction — 버튼/페이지 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoGrid : handleBtnAction -> ', cmd, param);
      if (cmd === 'toolbar-save') {
        return emit('save');
      } else if (cmd === 'grid-toggle-check-all') {
        return emit('toggle-check-all');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/셀/정렬 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoGrid : handleSelectAction -> ', cmd, param);
      if (cmd === 'sort-toggle') {
        /* 헤더 자체가 액션인 컬럼(전체선택 토글 등) — 정렬보다 우선한다 */
        if (typeof param.col.headClick === 'function') return param.col.headClick(param.col);
        if (param.col.sortKey) return emit('sort', param.col.sortKey);
      } else if (cmd === 'grid-row-click') {
        return emit('row-click', param.row);
      } else if (cmd === 'grid-row-dblclick') {
        return emit('row-dblclick', param.row);
      } else if (cmd === 'grid-cell-click') {
        return emit('cell-click', { cmd: props.gridId, row: param.row, col: param.col, colKey: param.col?.key, colIndex: param.ci, rowIndex: param.idx,
          ctrlKey: !!param.event?.ctrlKey, metaKey: !!param.event?.metaKey, button: param.event?.button });
      } else if (cmd === 'grid-row-ref-click') {
        const id = param.col.refKey ? param.row[param.col.refKey] : param.row[param.col.key];
        return emit('ref-click', { row: param.row, col: param.col, type: param.col.refLink, id });
      } else if (cmd === 'grid-row-remove') {
        return emit('row-remove', param.row);
      } else if (cmd === 'grid-row-toggle-check') {
        const val = param.row[props.checkedKey || props.rowKey];
        return emit('toggle-check', val);
      } else if (cmd === 'grid-row-cell-change') {
        return emit('cell-change', { cmd: props.gridId, row: param.row, col: param.col, colKey: param.col?.key });
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
      ? (props.pager.pageNo - 1) * props.pager.pageSize + idx + 1
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
      const base = (typeof props.rowClass === 'function' ? props.rowClass(row, idx) : (row._isNew ? 'status-I' : '')) || '';
      // 선택 행(selectedKey 일치) 에 파란 테두리 클래스 자동 부여 (rowKey 필수)
      const sel = (props.selectedKey != null && props.rowKey && row[props.rowKey] === props.selectedKey) ? ' bo-row-selected' : '';
      return (base + sel).trim();
    };
    const fnIsExpanded = (row, idx) => (typeof props.isExpanded === 'function' ? !!props.isExpanded(row, idx) : false);

    /* 좌/우 고정(pin) 셀 배경 — hover/줄무늬/선택 은 기존 CSS 가 td 에 직접 칠해 문제없지만(자식 배경이 있음),
       :row-style 로 화면이 직접 주는 커스텀 tr 배경(선택행 강조색 등, 35개 화면에서 사용)은 tr 에만 있어
       고정 td 는 물려받지 못한다. 기존 CSS 우선순위(hover+선택 > hover > 선택 > 줄무늬 > 커스텀rowStyle > 기본흰색)를
       그대로 인라인 재현해 고정 셀에만 붙인다. */
    const hoveredKey = Vue.ref(null);
    const onRowMouseEnter = (row) => { if (props.rowKey) hoveredKey.value = row[props.rowKey]; };
    const onRowMouseLeave = () => { hoveredKey.value = null; };
    const fnPinBg = (row, idx) => {
      const isHovered  = props.rowKey && hoveredKey.value != null && row[props.rowKey] === hoveredKey.value;
      const isSelected = props.selectedKey != null && props.rowKey && row[props.rowKey] === props.selectedKey;
      if (isHovered && isSelected) return '#e0ecff';
      if (isHovered)  return '#e8effe';
      if (isSelected) return '#eff6ff';
      /* 화면이 준 커스텀 행 배경(:row-style)이 줄무늬보다 우선한다.
         줄무늬를 먼저 반환하면 홀수 행의 고정셀(번호 등)만 커스텀색이 안 먹어
         선택행 번호칸 색이 한 줄 걸러 달라 보인다. */
      const rs = fnRowStyle(row, idx) || '';
      const m = rs.match(/background:\s*([^;]+)/);
      if (m) return m[1].trim();
      if (idx % 2 === 1) return '#f7f8fc';
      return '#fff';
    };

    /* 체크박스 — 부모 Set 기반. checkedKey(없으면 rowKey) 필드값을 식별자로 */
    const fnRowChkVal = (row) => row[props.checkedKey || props.rowKey];
    const fnRowChecked = (row) => (typeof props.isChecked === 'function' ? !!props.isChecked(fnRowChkVal(row)) : false);

    /* ── ▼ 컬럼 리사이즈 ─────────────────────────────────────────────────── */
    const colWidths = Vue.reactive({});
    let _resizeTh = null, _resizeStartX = 0, _resizeStartW = 0;
    const onResizeStart = (e, col) => {
      e.preventDefault();
      e.stopPropagation();
      _resizeTh = e.target.closest('th');
      _resizeStartX = e.clientX;
      _resizeStartW = _resizeTh.offsetWidth;
      document.body.classList.add('col-resizing');
      const onMove = (ev) => {
        const w = Math.max(40, _resizeStartW + ev.clientX - _resizeStartX);
        colWidths[col.key] = w + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.classList.remove('col-resizing');
        _resizeTh = null;
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    const thResizeStyle = (col) => {
      const base = U.thStyle(col);
      if (colWidths[col.key]) return base.replace(/width:[^;]+;/, '') + 'width:' + colWidths[col.key] + ';';
      return base;
    };

    /* ── ▼ 좌/우 고정(pin) 컬럼 — 번호(+체크/드래그) 항상 좌측 고정, pin:'left' 로 opt-in 한 데이터 컬럼들
       좌측 고정(여러 개 가능 — 앞에서부터 순서대로 width 누적), 관리(rowActions) 항상 우측 고정.
       가로스크롤 없는 그리드는 시각적 변화 없음(안전).
       ⚠ pin:'left' 컬럼은 반드시 width 를 명시할 것 — tdStyle 이 기본으로 overflow:hidden 말줄임을
       적용해 그 폭에서 잘리므로 실제 렌더 폭이 width 와 어긋나지 않는다(폭 미지정 시 다음 고정 컬럼과
       겹칠 수 있음 — 폭 예측 불가한 컬럼을 고정하지 말라던 예전 단일고정 제약을 width 강제로 해소). */
    const cfPinNoLeft    = Vue.computed(() => (props.selectable ? 36 : 0) + (props.draggable ? 28 : 0));
    const cfPinFirstLeft = Vue.computed(() => cfPinNoLeft.value + (props.showRowNo ? 36 : 0));
    /* 좌측고정 컬럼별 누적 left offset(px). width 미지정 시 100px 로 폴백(단일고정 기존 동작과 동일). */
    const cfPinLeftOffset = Vue.computed(() => {
      const map = {};
      let acc = cfPinFirstLeft.value;
      for (const col of props.columns) {
        if (col.pin !== 'left') continue;
        map[col.key] = acc;
        acc += (parseInt(col.width, 10) || 100);
      }
      return map;
    });
    /* 좌측고정 마지막 컬럼 key — 그 컬럼에만 경계 그림자(edge shadow) 표시 */
    const cfPinLeftLastKey = Vue.computed(() => {
      let last = null;
      for (const col of props.columns) if (col.pin === 'left') last = col.key;
      return last;
    });
    /* 선택행(.bo-row-selected) 은 tr 에 outline 을 그리는데, sticky(고정) 셀은 그 위에 자기 배경을 덧칠해
       outline 이 지나가는 상/하단(과 고정영역 좌우 끝) 구간을 가려버린다. selected=true 인 고정 셀에는
       inset box-shadow 로 같은 파란 테두리를 직접 그려 넣어 끊김 없이 이어지게 한다. */
    const fnRowSelected = (row) => props.selectedKey != null && props.rowKey && row[props.rowKey] === props.selectedKey;
    const pinLeftStyle  = (px, z, edge, selected) => {
      let st = 'position:sticky;left:' + px + 'px;z-index:' + z + ';';
      const sh = [];
      if (selected) { if (px === 0) sh.push('inset 2px 0 0 #2563eb'); sh.push('inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb'); }
      if (edge) sh.push('2px 0 4px rgba(0,0,0,.08)');
      if (sh.length) st += 'box-shadow:' + sh.join(',') + ';';
      return st;
    };
    const pinRightStyle = (z, edge, selected) => {
      let st = 'position:sticky;right:0;z-index:' + z + ';';
      const sh = [];
      if (selected) sh.push('inset -2px 0 0 #2563eb', 'inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb');
      if (edge) sh.push('-2px 0 4px rgba(0,0,0,.08)');
      if (sh.length) st += 'box-shadow:' + sh.join(',') + ';';
      return st;
    };

    /* ── fitBottom — 그리드를 화면 하단까지 채운다 ──
       고정 오프셋(calc(100vh - 390px))은 화면 폭·검색영역 줄수에 따라 헤더 높이가 달라져
       어느 해상도에서는 반드시 어긋난다(실제로 모든 뷰포트에서 56px 넘쳤다).
       그래서 자기 위치(getBoundingClientRect().top)에서 실측해 높이를 정한다.
       reserve: 하단 건수행 + 카드 패딩 + 여백. fitBottom 에 숫자를 주면 그 값을 쓴다. */
    const bodyRef = Vue.ref(null);
    const fitHeight = () => {
      if (!props.fitBottom || !bodyRef.value) { return; }
      const reserve = typeof props.fitBottom === 'number' ? props.fitBottom : 64;
      const top = bodyRef.value.getBoundingClientRect().top;
      const h = Math.max(160, window.innerHeight - top - reserve);
      /* min/max 를 함께 줘야 행이 적을 때도 영역이 하단까지 내려온다
         (maxHeight 만 주면 2행짜리 목록에서 카드가 위쪽에만 붙어 아래가 텅 빈다) */
      bodyRef.value.style.maxHeight = h + 'px';
      bodyRef.value.style.minHeight = h + 'px';
      bodyRef.value.style.overflow = 'auto';
    };
    let _fitRO = null;
    Vue.onMounted(() => {
      if (!props.fitBottom) { return; }
      Vue.nextTick(fitHeight);
      window.addEventListener('resize', fitHeight);
      /* 검색영역 접기/펼치기로 위쪽 높이가 바뀌면 다시 계산.
         document.body 를 관찰하면 .bo-main 이 자체 스크롤이라 크기가 안 변해 발화하지 않는다.
         그리드 카드의 부모(카드들을 담은 래퍼)를 봐야 위 카드가 커질 때 감지된다. */
      if (window.ResizeObserver) {
        _fitRO = new ResizeObserver(() => fitHeight());
        const wrap = bodyRef.value && bodyRef.value.closest('.card')
          ? bodyRef.value.closest('.card').parentElement : document.body;
        try { _fitRO.observe(wrap || document.body); } catch (_) {}
      }
    });
    Vue.onBeforeUnmount(() => {
      window.removeEventListener('resize', fitHeight);
      if (_fitRO) { try { _fitRO.disconnect(); } catch (_) {} }
    });

    /* onScroll — 바닥에서 scrollEndOffset(px) 이내면 scroll-end 발화 (무한 스크롤).
       tableMaxHeight 를 준 그리드만 자체 스크롤 컨테이너를 갖는다. 안 주면 이벤트가 안 온다.
       같은 scrollHeight 에서 재발화 금지 — 응답 도착 전 중복 요청을 막는다. */
    let _lastScrollEmitAt = -1;
    const onScroll = (e) => {
      const el = e.target;
      const rest = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (rest > props.scrollEndOffset) { _lastScrollEmitAt = -1; return; }
      if (_lastScrollEmitAt === el.scrollHeight) { return; }
      _lastScrollEmitAt = el.scrollHeight;
      emit('scroll-end');
    };

    /* cfScrollMaxHeight — 하단 건수행(.grid-foot) 높이만큼 스크롤 영역을 줄인다.
       그러지 않으면 건수행이 카드 아래로 밀려 화면 밖에서 잘린다. */
    const GRID_FOOT_H = 30;
    const cfScrollMaxHeight = Vue.computed(() => {
      if (!props.tableMaxHeight) { return props.tableMaxHeight; }
      /* bare 는 하단 건수행이 없으므로 높이를 빼지 않는다 */
      return props.bare ? props.tableMaxHeight
        : 'calc(' + props.tableMaxHeight + ' - ' + GRID_FOOT_H + 'px)';
    });

    /* cfBodyStyle — 본문 컨테이너 style.
       tableMaxHeight 를 주면(bare 포함) 자체 스크롤 컨테이너가 되어 무한 스크롤이 동작한다. */
    const cfBodyStyle = Vue.computed(() => (
      props.tableMaxHeight
        ? (props.fixedHeight ? 'height:' : 'max-height:') + cfScrollMaxHeight.value + ';overflow:auto;position:relative;'
        : 'overflow-x:auto;position:relative;'
    ));

    /* cfCountText — 하단 좌측 건수 문구. countText 를 주면 그대로 쓴다. */
    const cfCountText = Vue.computed(() => (
      props.countText != null ? props.countText
        : coUtil.cofCountText(cfTotal.value, props.loadedCount)
    ));

    /* cfEffectiveCols — 명/제목/이름 끝 컬럼을 link:true 로 자동 표시 (링크스타일 + cell-click emit).
       badge/edit/refLink/명시적 link 있으면 스킵. link:false 명시 시도 스킵. */
    const cfEffectiveCols = Vue.computed(() => props.columns.map(col => {
      if (col.link != null || col.badge || col.edit || col.refLink) return col;
      const k = (col.key || '').toLowerCase();
      const l = col.label || '';
      if (/(nm|name|title)$/.test(k) || /명$|제목$|이름$/.test(l)) {
        return Object.assign({}, col, { link: true });
      }
      return col;
    }));

    /* fnColLabel / fnColNm — 개발용 DB 컬럼명 병기 (coUtil.SHOW_COL_NM 로 일괄 on/off) */
    const fnColLabel = (col) => coUtil.cofColLabel(col);
    const fnColNm    = (col) => coUtil.cofColNm(col);

    return { fnColLabel, fnColNm, U, cfTotal, cfCountText, cfScrollMaxHeight, cfBodyStyle, bodyRef, onScroll, cfShowTfoot, rowNo, sortIcon, sortActive,
             fnRowStyle, fnRowClass, fnIsExpanded, cfColspan, fnRowChecked,
             handleBtnAction, handleSelectAction,
             colWidths, onResizeStart, thResizeStyle,
             cfPinNoLeft, cfPinFirstLeft, cfPinLeftOffset, cfPinLeftLastKey, pinLeftStyle, pinRightStyle, fnPinBg, fnRowSelected, onRowMouseEnter, onRowMouseLeave,
             columns: cfEffectiveCols };
  },
  template: /* html */`
<div :class="bare ? '' : 'card'">
  <div v-if="!bare" class="toolbar">
    <span class="list-title">
      {{ listTitle }}
      <span v-if="loading" style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:400;">⏳ 조회 중…</span>
    </span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <slot name="toolbar-actions">
      </slot>
      <button v-if="showSave" class="btn btn-primary btn-sm" @click="handleBtnAction('toolbar-save')">
        {{ saveLabel }}
      </button>
    </div>
  </div>
  <!-- 그리드 본문.
       tableMaxHeight 명시 시: 해당 높이로 내부 스크롤 (thead sticky = 이 div 기준).
       tableMaxHeight 미지정: overflow 없음 — bo-main 스크롤 컨테이너 기준으로 thead sticky top:0 동작.
       bare: 가로 스크롤만. -->
  <div ref="bodyRef" :style="cfBodyStyle" @scroll="onScroll">
    <!-- 조회 중 오버레이 (기존 행 위에 표시 — 재조회/페이지 이동 피드백). 행이 없을 땐 빈행 문구로 안내 -->
    <div v-if="loading ? (rows.length) : false" style="position:absolute;inset:0;z-index:5;background:rgba(255,255,255,.55);display:flex;align-items:flex-start;justify-content:center;padding-top:40px;pointer-events:none;">
      <span style="font-size:13px;color:#e8587a;background:#fff;border:1px solid #f3c6d4;border-radius:14px;padding:4px 14px;box-shadow:0 2px 8px rgba(0,0,0,.08);">⏳ 조회 중…</span>
    </div>
    <table class="bo-table" :class="{ 'crud-grid': draggable || showSave, 'bo-table-narrow': narrow }">
      <thead>
        <tr>
          <th v-if="selectable" :style="'width:36px;text-align:center;background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinLeftStyle(0, 6)">
            <input type="checkbox" :checked="allChecked" @change="handleBtnAction('grid-toggle-check-all')" />
          </th>
          <th v-if="draggable" :style="'width:28px;background:linear-gradient(180deg,#d0e6f9,#9fc6ef);border-bottom:2px solid #4a8ac2;' + pinLeftStyle(selectable ? 36 : 0, 6)">
          </th>
          <th v-if="showRowNo" :style="'width:36px;text-align:center;background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinLeftStyle(cfPinNoLeft, 6)">
            번호
          </th>
          <slot name="head">
            <!-- ⚠ 아래 :style 에 position:relative 를 넣지 말 것 — CSS 의 thead th{position:sticky} 를
                 덮어 그리드 내부 스크롤 시 헤더가 사라진다.
                 sticky 자체가 절대배치 컨테이닝블록이라 리사이즈 핸들 위치는 그대로 잡힌다.
                 col.pin==='left' 인 컬럼(주로 짧은 id)만 번호와 함께 좌측 고정 — 폭 예측 불가한
                 컬럼(이름+ID 합성 텍스트 등)을 임의로 고정하면 auto 테이블 레이아웃에서 sticky 폭
                 계산이 어긋나 텍스트가 겹쳐 보이는 문제가 있어 자동고정 대신 명시적 opt-in만 허용. -->
            <th v-for="(col, ci) in columns" :key="col.key" :class="col.cls"
            :style="thResizeStyle(col) + ((col.sortKey || col.headClick) ? 'cursor:pointer;user-select:none;white-space:nowrap;' : '') + 'overflow:visible;' + (col.pin === 'left' ? pinLeftStyle(cfPinLeftOffset[col.key], 6, col.key === cfPinLeftLastKey) + 'background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' : '')"
            @click="handleSelectAction('sort-toggle', { col })">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.noHead ? false : !!fnColNm(col)" style="display:block;font-size:9px;font-weight:400;color:#9aa4b2;line-height:1.2;">{{ fnColNm(col) }}</span>
              <span v-if="col.sortKey"
              :style="sortActive(col) ? 'color:#e8587a;font-weight:bold;' : 'color:#bbb;'">
                {{ sortIcon(col) }}
              </span>
              <div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;"
                @mousedown.stop="onResizeStart($event, col)"></div>
            </th>
          </slot>
          <th v-if="rowActions || $slots['head-actions']" :style="'min-width:40px;text-align:center;white-space:nowrap;background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinRightStyle(6, true)">
            <slot name="head-actions">
              관리
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- ▼ grid-row 영역 -->
        <template v-for="(row, idx) in rows" :key="rowKey ? row[rowKey] : idx">
          <tr :style="fnRowStyle(row, idx)" :class="fnRowClass(row, idx)"
          :draggable="draggable"
          @mouseenter="onRowMouseEnter(row)" @mouseleave="onRowMouseLeave()"
          @dblclick="handleSelectAction('grid-row-dblclick', { row })"
          @dragstart="handleSelectAction('grid-row-drag-start', { idx })"
          @dragover="handleSelectAction('grid-row-drag-over', { idx, event: $event })"
          @dragend="handleSelectAction('grid-row-drag-end')">
            <td v-if="selectable" :style="'text-align:center;' + pinLeftStyle(0, 4, false, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';'" @click.stop>
              <input type="checkbox" :checked="fnRowChecked(row)" @change="handleSelectAction('grid-row-toggle-check', { row })" />
            </td>
            <td v-if="draggable" :style="'text-align:center;cursor:grab;color:#bbb;font-size:17px;user-select:none;' + pinLeftStyle(selectable ? 36 : 0, 4, false, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';'">
              ≡
            </td>
            <td v-if="showRowNo" :style="'text-align:center;font-size:11px;color:#999;cursor:pointer;' + pinLeftStyle(cfPinNoLeft, 4, false, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';'" title="보기"
            @click="handleSelectAction('grid-cell-click', { row, col: { key: '__no__', link: true }, ci: -1, idx, event: $event })"
            @auxclick="$event.button===1 ? handleSelectAction('grid-cell-click', { row, col: { key: '__no__', link: true }, ci: -1, idx, event: $event }) : null">
              {{ rowNo(idx) }}
            </td>
            <template v-for="(col, ci) in columns" :key="col.key">
              <slot :name="'cell-' + col.key" :row="row" :idx="idx" :no="rowNo(idx)">
                <td :style="U.tdStyle(col, row) + (col.pin === 'left' ? pinLeftStyle(cfPinLeftOffset[col.key], 4, col.key === cfPinLeftLastKey, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';' : '')" :class="U.cellClass(col, row)" :title="U.cellTitle(col, row)"
                @click="rowClickable ? handleSelectAction('grid-cell-click', { row, col, ci, idx, event: $event }) : null"
                @auxclick="coUtil.cofAnd(rowClickable, $event.button===1) ? handleSelectAction('grid-cell-click', { row, col, ci, idx, event: $event }) : null">
                  <!-- 인라인 편집 셀 (행클릭 통일 시 @click.stop 으로 보호) -->
                  <input v-if="col.edit==='text'" class="form-control" v-model="row[col.key]"
                  :placeholder="col.placeholder" style="padding:2px 6px;font-size:12px;"
                  @click.stop @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                  <input v-else-if="col.edit==='number'" type="number" class="form-control" v-model.number="row[col.key]"
                  style="padding:2px 6px;font-size:12px;width:100%;text-align:right;"
                  @click.stop @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                  <input v-else-if="col.edit==='date'" type="date" class="form-control" v-model="row[col.key]"
                  style="padding:2px 4px;font-size:11px;width:130px;text-align:center;"
                  @click.stop @input="handleSelectAction('grid-row-cell-change', { row, col })" />
                  <select v-else-if="col.edit==='select'" class="form-control" v-model="row[col.key]"
                  style="padding:2px 4px;font-size:12px;"
                  @click.stop @change="handleSelectAction('grid-row-cell-change', { row, col })">
                    <option v-if="col.nullable" :value="null">{{ col.nullLabel || '-- 선택 --' }}</option>
                    <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <!-- 표시경로 picker (bo-path-pick-field 자동 임베드) — bare: 셀 td 안에 div 로(중첩 td 방지, 폭 통일) -->
                  <bo-path-pick-field v-else-if="col.pathPick" bare :biz-cd="col.pathPick" :row="row" :disabled="row._row_status==='D'" @change="handleSelectAction('grid-row-cell-change', { row, col })" />
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
                    <span v-else style="color:#ccc;">
                      -
                    </span>
                  </template>
                  <!-- 일시 picker (bo-date-time-picker 자동 임베드) — col.dateTimePick: { dateKey, timeKey, dateWidth, timeWidth, onChange? } -->
                  <bo-date-time-picker v-else-if="col.dateTimePick"
                  :date="row[col.dateTimePick.dateKey]" :time="row[col.dateTimePick.timeKey]"
                  @update:date="v => { row[col.dateTimePick.dateKey] = v; handleSelectAction('grid-row-cell-change', { row, col }); }"
                  @update:time="v => { row[col.dateTimePick.timeKey] = v; handleSelectAction('grid-row-cell-change', { row, col }); }"
                  :show-now="col.dateTimePick.showNow !== false" :show-clear="col.dateTimePick.showClear !== false"
                  :date-width="col.dateTimePick.dateWidth || '104px'" :time-width="col.dateTimePick.timeWidth || '64px'"
                  input-class="" />
                  <!-- 인라인 path-button (라벨 + ✕ 비우기 + 🔍 버튼 + onOpen 콜백) -->
                  <div v-else-if="col.pathLabelOpen" :style="{padding:'1px 4px 1px 8px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'22px',background:'#f5f5f7',color:row[col.key]!=null?'#374151':'#9ca3af',fontWeight:row[col.key]!=null?600:400,display:'flex',alignItems:'center',gap:'4px'}">
                    <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                      :title="(typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(row[col.key]) : '') || ''">
                      {{ (typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(row[col.key]) : '') || (col.pathLabelOpen.placeholder || '경로 선택...') }}
                    </span>
                    <span v-if="row[col.key] != null" title="비우기"
                      style="cursor:pointer;color:#9ca3af;font-size:9px;flex-shrink:0;line-height:1;padding:0;margin-right:-1px;align-self:flex-end;margin-bottom:2px;"
                      @click.stop="col.pathLabelOpen.clear ? col.pathLabelOpen.clear(row) : (row[col.key] = null)">
                      ✕
                    </span>
                    <button type="button" @click.stop="col.pathLabelOpen.open(row)" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#2563eb;flex-shrink:0;padding:0;">
                      🔍
                    </button>
                  </div>
                  <!-- 표시 셀 (link는 cellInnerStyle/Class 합성 가능) — 제목 클릭은 cell-click 으로 분리 -->
                  <span v-else-if="col.link" class="title-link" @click.stop="handleSelectAction('grid-cell-click', { row, col, ci, idx, event: $event })"
                  @auxclick.stop="$event.button===1 ? handleSelectAction('grid-cell-click', { row, col, ci, idx, event: $event }) : null"
                  :style="U.cellInnerStyle(col, row)" :class="U.cellInnerClass(col, row)">
                    {{ U.cellText(col, row) }}
                  </span>
                  <a v-else-if="col.refLink" href="#" class="ref-link" @click.stop.prevent="handleSelectAction('grid-row-ref-click', { row, col })">
                    {{ U.cellText(col, row) }}
                  </a>
                  <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, row)">
                    {{ U.cellText(col, row) }}
                  </span>
                  <span v-else-if="col.cellInnerStyle != null || col.cellInnerClass != null"
                  :style="U.cellInnerStyle(col, row)" :class="U.cellInnerClass(col, row)">
                    {{ U.cellText(col, row) }}
                  </span>
                  <span v-else-if="col.html" v-html="U.cellText(col, row)"></span>
                  <template v-else>
                    {{ U.cellText(col, row) }}
                  </template>
                </td>
              </slot>
            </template>
            <td v-if="rowActions" :style="'text-align:center;white-space:nowrap;' + pinRightStyle(4, true, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';'">
              <slot name="row-actions" :row="row" :idx="idx" :grid-id="gridId">
                <button class="btn btn_row_delete" @click="handleSelectAction('grid-row-remove', { row })">
                  ✕
                </button>
              </slot>
            </td>
            <slot v-else name="row-actions" :row="row" :idx="idx" :grid-id="gridId"
              :pin-style="pinRightStyle(4, true, fnRowSelected(row)) + 'background:' + fnPinBg(row, idx) + ';'">
            </slot>
          </tr>
          <tr v-if="fnIsExpanded(row, idx)" class="bo-grid-expand-row">
            <slot name="row-expand" :row="row" :idx="idx" :colspan="cfColspan">
              <td :colspan="cfColspan">
              </td>
            </slot>
          </tr>
        </template>
        <tr v-if="!rows.length">
          <td :colspan="cfColspan"
          style="text-align:center;padding:30px;color:#aaa">
            <span v-if="loading">⏳ 조회 중…</span>
            <span v-else>{{ emptyText }}</span>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="cfShowTfoot">
        <slot name="tfoot" :rows="rows" :colspan="cfColspan">
        </slot>
      </tfoot>
    </table>
  </div>
  <!-- /그리드 본문 스크롤 컨테이너 -->
  <!-- ▼ 하단 바 — 좌측 건수 + #footer 슬롯(<bo-pager> 등). bare 모드는 미노출.
       건수는 예전에 제목 우측(.list-count)에 있었으나 하단 좌측으로 이동(2026-08-01).
       페이저가 .pagination 의 1fr auto 1fr 로 자체 중앙정렬하므로 건수는 그 왼쪽 칸을 쓴다. -->
  <div v-if="!bare" class="grid-foot">
    <span class="grid-foot-count">{{ cfCountText }}</span>
    <div class="grid-foot-slot">
      <slot name="footer"></slot>
    </div>
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
    actionHeader:{ type: String, default: '관리' },            // 우측 행액션(col-act) 컬럼 헤더명. #head-actions 슬롯으로 오버라이드 가능
    gridId:     { type: String, default: '' },                // 그리드 식별자(=셀 라우터 cmd). #row-actions 슬롯 gridId 로 전달
    listTitle:  { type: String, default: '목록' },
    maxHeight:  { type: String, default: '480px' },            // 스크롤 컨테이너 높이
    totalCount: { type: Number, default: null },               // 서버 총건수(무한스크롤). 주면 '총 N건 · 조회 M건'
    scrollEndOffset: { type: Number, default: 500 },           // 바닥에서 N px 앞에서 scroll-end 발화 (≈15행)
    draggable:  { type: Boolean, default: true },              // 행 드래그 정렬 컬럼(⠿) 표시 + 드래그 동작
    checkAll:   { type: Boolean, default: false },             // 헤더 체크올 v-model 미러
    focusedIdx: { type: Number,  default: null },              // 행 포커스 인덱스 (v-model:focusedIdx, addRow 삽입 기준)
    showExport: { type: Boolean, default: false },             // 📥 엑셀 버튼 노출
    showExcelUpload: { type: Boolean, default: false },        // 📤 엑셀업로드 버튼 노출
    showRowNo:     { type: Boolean, default: true },           // 번호 컬럼 표시
    showRowId:     { type: Boolean, default: true },           // ID 컬럼 표시
    showRowStatus: { type: Boolean, default: true },           // 상태(N/I/U/D 뱃지) 컬럼 표시
    showRowCheck:  { type: Boolean, default: true },           // 체크박스 컬럼 + [행삭제][취소] 일괄버튼 표시
    showAdd:       { type: Boolean, default: true },           // [+ 행추가] 버튼 표시
    showSave:      { type: Boolean, default: true },           // [저장] 버튼 표시
    cellTitle:  { type: Function, default: null },             // (col)=>title 문자열 (local 모드 컬럼 hint)
    sortState:  { type: Object, default: null },               // { sortKey, sortDir } reactive — 지정 시 col.sortKey 헤더 클릭 정렬
    emptyText:  { type: String, default: '데이터가 없습니다.' },
    selectedKey: { type: [String, Number], default: null },    // 선택된 행의 rowKey 값. 일치 행에 .bo-row-selected (파란 테두리) 자동 부여
    /* ── 트리 모드 ─ flatRows + rowAccessor 둘 다 주면 트리 분기 ─────────────
     *  flatRows    : 화면이 평탄화한 래퍼 배열 (예: [{node,depth},...])
     *  rowAccessor : (flatItem)=>실제 행객체(_row_status/_row_check 보유)
     *  treeRowKey  : (flatItem,idx)=>:key (없으면 idx)
     *  트리 모드는 ID/드래그 컬럼은 자동 비활성(개념 없음).
     *  번호 컬럼은 treeRowDepth 를 주면 계층형 번호(1 / 1.1 / 1.1.1)로 자동 표시,
     *  안 주면(기존 화면 호환) 계속 비활성.
     *  셀은 전부 #cell-{key} 슬롯 위임. slot props: { node, row, idx } */
    flatRows:     { type: Array,    default: null },
    rowAccessor:  { type: Function, default: null },
    treeRowKey:   { type: Function, default: null },
    treeRowDepth: { type: Function, default: null },   // (flatItem)=>depth(0-base). 주면 번호 컬럼에 계층형 번호 표시
  },
  emits: ['scroll-end', 'add', 'save', 'cancel-checked', 'delete-checked', 'reorder', 'cell-change',
          'update:checkAll', 'update:focusedIdx', 'export', 'excel-upload', 'sort', 'row-dblclick', 'cell-click', 'row-click'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    /* 트리 모드 = flatRows + rowAccessor 둘 다 제공된 경우만 */
    const cfTreeMode = Vue.computed(() =>
      Array.isArray(props.flatRows) && typeof props.rowAccessor === 'function');
    /* 화면이 순회할 표시 행 목록 (트리: flatRows / 일반: rows) */
    const cfDispRows = Vue.computed(() => cfTreeMode.value ? props.flatRows : props.rows);
    /* 트리 모드에서 자동 비활성화되는 고정컬럼 */
    const cfShowDrag = Vue.computed(() => props.draggable  && !cfTreeMode.value);
    const cfShowNo   = Vue.computed(() => props.showRowNo  && (!cfTreeMode.value || typeof props.treeRowDepth === 'function'));
    /* cfTreeNoList — 트리 모드 계층형 번호(1 / 1.1 / 1.1.1 ...). flatRows 는 이미 부모→자식
       순서로 평탄화돼 있으므로, 깊이별 카운터를 두고 훑으면서 번호를 매긴다(깊이 0=1레벨). */
    const cfTreeNoList = Vue.computed(() => {
      if (!cfTreeMode.value || typeof props.treeRowDepth !== 'function') return [];
      const counters = [];
      return props.flatRows.map((item) => {
        const depth = props.treeRowDepth(item) || 0;
        counters[depth] = (counters[depth] || 0) + 1;
        counters.length = depth + 1;
        return counters.join('.');
      });
    });
    const cfShowId   = Vue.computed(() => props.showRowId  && !cfTreeMode.value);
    const cfVisibleCount = Vue.computed(() =>
      props.rows.filter(r => r._row_status !== 'D').length);
    const allChecked = Vue.ref(props.checkAll);
    Vue.watch(() => props.checkAll, v => { allChecked.value = v; });
    /* 드래그 정렬 */
    const dragSrc = Vue.ref(null);
    const dragMoved = Vue.ref(false);
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

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    /* handleBtnAction — 툴바 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoGridCrud : handleBtnAction -> ', cmd, param);
      if (cmd === 'toolbar-add') {
        return emit('add');
      } else if (cmd === 'toolbar-save') {
        return emit('save');
      } else if (cmd === 'toolbar-cancel-checked') {
        return emit('cancel-checked');
      } else if (cmd === 'toolbar-delete-checked') {
        return emit('delete-checked');
      } else if (cmd === 'toolbar-export') {
        return emit('export');
      } else if (cmd === 'toolbar-excel-upload') {
        return emit('excel-upload');
      } else if (cmd === 'grid-toggle-check-all') {
        const v = !allChecked.value;
        allChecked.value = v;
        if (cfTreeMode.value) props.flatRows.forEach(it => { props.rowAccessor(it)._row_check = v; });
        else props.rows.forEach(r => { r._row_check = v; });
        return emit('update:checkAll', v);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/셀/정렬 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoGridCrud : handleSelectAction -> ', cmd, param);
      if (cmd === 'sort-toggle') {
        /* 헤더 자체가 액션인 컬럼(전체선택 토글 등) — 정렬보다 우선한다 */
        if (typeof param.col.headClick === 'function') return param.col.headClick(param.col);
        if (param.col.sortKey) return emit('sort', param.col.sortKey);
      } else if (cmd === 'grid-row-focus') {
        const out = cfTreeMode.value
          ? props.rows.indexOf(props.rowAccessor(props.flatRows[param.idx]))
          : param.idx;
        if (props.focusedIdx !== out) emit('update:focusedIdx', out);
        /* 한번 클릭 = 즉시 행 선택(파란선) 동기화. 부모가 selectedKey 를 바로 갱신하도록 row 전달.
         *   (focusedIdx 와 selectedKey 가 따로 놀아 예전 선택행 파란선이 남는 '지연' 현상 제거) */
        return emit('row-click', param.row, out);
      } else if (cmd === 'grid-row-dblclick') {
        return emit('row-dblclick', param.row, param.idx);
      } else if (cmd === 'grid-cell-click') {
        return emit('cell-click', { cmd: props.gridId, row: param.row, col: param.col, colKey: param.col?.key, colIndex: param.ci, rowIndex: param.idx,
          ctrlKey: !!param.event?.ctrlKey, metaKey: !!param.event?.metaKey, button: param.event?.button });
      } else if (cmd === 'grid-row-cell-change') {
        const row = param.row;
        if (row._row_status === 'I' || row._row_status === 'D') return emit('cell-change', { cmd: props.gridId, row, col: param.col, colKey: param.col?.key });
        if (row._row_org) {
          const changed = Object.keys(row._row_org).some(f => String(row[f]) !== String(row._row_org[f]));
          row._row_status = changed ? 'U' : 'N';
        }
        return emit('cell-change', { cmd: props.gridId, row, col: param.col, colKey: param.col?.key });
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
    /* flatItem → 실제 행객체 (_row_status/_row_check 보유). 일반 모드는 자기 자신 */
    const fnRow = (item) => (cfTreeMode.value ? props.rowAccessor(item) : item);
    const fnRowKey = (item, idx) => {
      if (cfTreeMode.value) return typeof props.treeRowKey === 'function' ? props.treeRowKey(item, idx) : idx;
      return item[props.rowKey];
    };
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const fnColTitle = (col) => (typeof props.cellTitle === 'function' ? props.cellTitle(col) : '');

    /* fnRowCls — <tr> 행 클래스 배열 (template 의 && 금지 정책 회피용 JS 헬퍼)
     *   행상태색(status-) + focusedIdx(.focused) + selectedKey 일치(.bo-row-selected).
     *   ※ 화면마다 focused/selected 의미가 달라(삽입기준 vs 이력필터 vs 트리선택) 둘 다 유지.
     *     단일 행만 파란선이 되도록 하려면 화면에서 selectedKey 를 focus 와 동기화할 것(예: SyCode addRow/rowSelect). */
    const fnRowCls = (item, idx) => {
      const row = fnRow(item);
      const cls = ['status-' + row._row_status];
      if (!cfTreeMode.value && props.focusedIdx === idx) cls.push('focused');
      if (props.selectedKey != null && row[props.rowKey] === props.selectedKey) cls.push('bo-row-selected');
      return cls;
    };

    /* 좌/우 고정(pin) 셀 배경 — crud-row 는 상태색/포커스/선택을 tr 배경(!important 포함)으로 칠하므로
       그 자식인 고정 td 는 배경을 물려받지 못한다(자식 자신의 배경이 없으면 가로스크롤 시 뒤 컬럼이 비쳐 보임).
       기존 CSS 규칙과 동일한 우선순위(focused/selected > 상태색 > 기본흰색)로 그대로 인라인 재현. */
    const fnPinBg = (item, idx) => {
      const row = fnRow(item);
      const isFocused  = !cfTreeMode.value && props.focusedIdx === idx;
      const isSelected = props.selectedKey != null && row[props.rowKey] === props.selectedKey;
      if (isFocused || isSelected) return '#eff6ff';
      if (row._row_status === 'I') return '#d9f7be';
      if (row._row_status === 'U') return '#fff1b8';
      if (row._row_status === 'D') return '#ffccc7';
      return '#fff';
    };

    const sortIcon = (col) => {
      const st = props.sortState;
      if (!col.sortKey || !st) return '';
      if (st.sortKey !== col.sortKey) return '⇅';
      return st.sortDir === 'asc' ? '↑' : '↓';
    };
    const sortActive = (col) => props.sortState && props.sortState.sortKey === col.sortKey;

    /* cfCountText — 하단 좌측 건수 문구.
       ⚠ 템플릿에서 coUtil 을 직접 부르면 setup return 누락 시 컴포넌트가 통째로 사라진다.
          반드시 setup 에서 계산해 내보낸다. */
    const cfCountText = Vue.computed(() => (
      props.totalCount != null
        ? coUtil.cofCountText(props.totalCount, cfVisibleCount.value)
        : coUtil.cofCountText(cfVisibleCount.value)
    ));

    /* onScroll — 스크롤이 바닥에서 SCROLL_END_PX 이내로 오면 scroll-end 를 올린다.
       연속 발화 방지: 같은 스크롤 높이에서 두 번 쏘지 않도록 마지막 발화 지점을 기억한다. */
    /* cfScrollMaxHeight — 하단 건수행(.grid-foot)이 카드 밖으로 밀려 잘리지 않도록
       스크롤 영역 높이에서 건수행 높이를 미리 뺀다.
       화면들이 max-height="calc(100vh - 320px)" 처럼 뷰포트 기준 값을 주기 때문에,
       건수행을 추가한 만큼 여기서 되돌려주지 않으면 딱 그 높이만큼 화면 아래로 넘친다. */
    const GRID_FOOT_H = 30;
    const cfScrollMaxHeight = Vue.computed(() => (
      props.maxHeight ? 'calc(' + props.maxHeight + ' - ' + GRID_FOOT_H + 'px)' : props.maxHeight
    ));

    /* onScroll — 바닥에서 scrollEndOffset(px) 이내로 오면 scroll-end 를 올린다.
       거리 기준을 쓰는 이유: '남은 20%' 같은 비율은 목록이 커질수록 리드 거리가 같이 늘어
       (1000건이면 190행 앞) 사실상 전부 미리 당겨오게 된다. 거리로 잡으면 항상 일정하다.
       기본 500px ≈ 15행 — 다음 100건이 도착할 시간을 벌어 끊김 없이 이어진다.
       연속 발화 방지: 같은 scrollHeight 에서 두 번 쏘지 않는다(응답 도착 전 중복 요청 차단). */
    let _lastEmitAt = -1;
    const onScroll = (e) => {
      const el = e.target;
      const rest = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (rest > props.scrollEndOffset) { _lastEmitAt = -1; return; }
      if (_lastEmitAt === el.scrollHeight) { return; }
      _lastEmitAt = el.scrollHeight;
      emit('scroll-end');
    };

    /* ── ▼ 좌/우 고정(pin) — 드래그+번호+ID 좌측 고정(있는 것만 연속 누적), 관리(col-act) 우측 고정.
       가로스크롤 없는 그리드는 시각적 변화 없음(안전). CSS 고정폭(.col-drag 28px/번호 36px)을 그대로 사용. */
    const cfPinIdLeft = Vue.computed(() => (cfShowDrag.value ? 28 : 0) + (cfShowNo.value ? 36 : 0));
    /* 선택행 outline 이 고정(pin) 셀 아래로 가려지는 문제 방지 — BoGrid 와 동일한 inset box-shadow 보강 */
    const fnRowSelected = (row) => props.selectedKey != null && row[props.rowKey] === props.selectedKey;
    const pinLeftStyle  = (px, z, edge, selected) => {
      let st = 'position:sticky;left:' + px + 'px;z-index:' + z + ';';
      const sh = [];
      if (selected) { if (px === 0) sh.push('inset 2px 0 0 #2563eb'); sh.push('inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb'); }
      if (edge) sh.push('2px 0 4px rgba(0,0,0,.08)');
      if (sh.length) st += 'box-shadow:' + sh.join(',') + ';';
      return st;
    };
    const pinRightStyle = (z, edge, selected) => {
      let st = 'position:sticky;right:0;z-index:' + z + ';';
      const sh = [];
      if (selected) sh.push('inset -2px 0 0 #2563eb', 'inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb');
      if (edge) sh.push('-2px 0 4px rgba(0,0,0,.08)');
      if (sh.length) st += 'box-shadow:' + sh.join(',') + ';';
      return st;
    };

    /* fnColLabel / fnColNm — 개발용 DB 컬럼명 병기 (coUtil.SHOW_COL_NM 로 일괄 on/off) */
    const fnColLabel = (col) => coUtil.cofColLabel(col);
    const fnColNm    = (col) => coUtil.cofColNm(col);

    return { fnColLabel, fnColNm, U, cfVisibleCount, cfCountText, cfScrollMaxHeight, onScroll, fnStatusClass, allChecked, fnColTitle, cfEmptyColspan,
             sortIcon, sortActive, cfTreeMode, cfDispRows, fnRow, fnRowKey, fnRowCls, fnPinBg,
             cfShowDrag, cfShowNo, cfShowId, cfPinIdLeft, cfTreeNoList, pinLeftStyle, pinRightStyle, fnRowSelected, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="card">
  <div class="toolbar">
    <span class="list-title">
      {{ listTitle }}
    </span>
    <div style="display:flex;gap:6px;margin-left:auto;">
      <slot name="toolbar-actions">
      </slot>
      <button v-if="showExport" class="btn btn_excel" @click="handleBtnAction('toolbar-export')">
        📥 엑셀
      </button>
      <button v-if="showExcelUpload" class="btn btn_excel_upload" @click="handleBtnAction('toolbar-excel-upload')">
        📤 엑셀업로드
      </button>
      <button v-if="showAdd" class="btn btn-green btn-sm" @click="handleBtnAction('toolbar-add')">
        + 행추가
      </button>
      <button v-if="showRowCheck" class="btn btn-danger btn-sm" @click="handleBtnAction('toolbar-delete-checked')">
        행삭제
      </button>
      <button v-if="showRowCheck" class="btn btn-secondary btn-sm" @click="handleBtnAction('toolbar-cancel-checked')">
        취소
      </button>
      <button v-if="showSave" class="btn btn_save" @click="handleBtnAction('toolbar-save')">
        저장
      </button>
    </div>
  </div>
  <!-- 하단 근접 시 scroll-end emit — 무한 스크롤(추가 조회)용. 화면이 안 받으면 아무 일도 없다 -->
  <div :style="'max-height:' + cfScrollMaxHeight + ';overflow:auto;'" @scroll="onScroll">
    <table class="bo-table crud-grid">
      <thead>
        <tr>
          <th v-if="cfShowDrag" class="col-drag" :style="'background:linear-gradient(180deg,#d0e6f9,#9fc6ef);border-bottom:2px solid #4a8ac2;' + pinLeftStyle(0, 6)">
          </th>
          <th v-if="cfShowNo" :style="'width:36px;text-align:' + (cfTreeMode ? 'left' : 'center') + ';background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinLeftStyle(cfShowDrag ? 28 : 0, 6)">
            번호
          </th>
          <th v-if="cfShowId" class="col-id" :style="'background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinLeftStyle(cfPinIdLeft, 6, true)">
            ID
          </th>
          <th v-if="showRowStatus" class="col-status">
            상태
          </th>
          <th v-if="showRowCheck" class="col-check">
            <input type="checkbox" :checked="allChecked" @change="handleBtnAction('grid-toggle-check-all')" />
          </th>
          <slot name="head">
            <th v-for="col in columns" :key="col.key" :class="col.cls"
              :style="U.thStyle(col) + ((col.sortKey || col.headClick) ? 'cursor:pointer;user-select:none;white-space:nowrap;' : '')"
              :title="fnColTitle(col)" @click="handleSelectAction('sort-toggle', { col })">
              {{ col.noHead ? '' : col.label }}
              <span v-if="col.noHead ? false : !!fnColNm(col)" style="display:block;font-size:9px;font-weight:400;color:#9aa4b2;line-height:1.2;">{{ fnColNm(col) }}</span>
              <span v-if="col.sortKey"
                :style="sortActive(col) ? 'color:#e8587a;font-weight:bold;' : 'color:#bbb;'">
                {{ sortIcon(col) }}
              </span>
            </th>
          </slot>
          <th class="col-act" :style="'text-align:center;background:linear-gradient(180deg,#d0e6f9,#9fc6ef);color:#1a4f7d;border-bottom:2px solid #4a8ac2;' + pinRightStyle(6, true)">
            <slot name="head-actions">{{ actionHeader }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- ▼ grid-row 영역 -->
        <tr v-if="!cfDispRows.length">
          <td :colspan="cfEmptyColspan" style="text-align:center;color:#999;padding:30px;">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-else v-for="(item, idx) in cfDispRows" :key="fnRowKey(item, idx)" class="crud-row" :class="fnRowCls(item, idx)" :draggable="cfShowDrag" @click="handleSelectAction('grid-row-focus', { idx, row: fnRow(item) })" @dblclick="handleSelectAction('grid-row-dblclick', { row: fnRow(item), idx })" @dragstart="handleSelectAction('grid-row-drag-start', { idx })" @dragover="handleSelectAction('grid-row-drag-over', { idx, event: $event })" @dragend="handleSelectAction('grid-row-drag-end')">
        <td v-if="cfShowDrag" class="drag-handle" title="드래그로 순서 변경" :style="pinLeftStyle(0, 4, false, fnRowSelected(fnRow(item))) + 'background:' + fnPinBg(item, idx) + ';'">
          ⠿
        </td>
        <td v-if="cfShowNo" :style="'text-align:' + (cfTreeMode ? 'left' : 'center') + ';font-size:11px;color:#999;cursor:pointer;white-space:nowrap;' + pinLeftStyle(cfShowDrag ? 28 : 0, 4, false, fnRowSelected(fnRow(item))) + 'background:' + fnPinBg(item, idx) + ';'" title="보기"
          @click.stop="handleSelectAction('grid-cell-click', { row: fnRow(item), col: { key: '__no__', link: true }, ci: -1, idx, event: $event })"
          @auxclick.stop="$event.button===1 ? handleSelectAction('grid-cell-click', { row: fnRow(item), col: { key: '__no__', link: true }, ci: -1, idx, event: $event }) : null">
          {{ cfTreeMode ? cfTreeNoList[idx] : (idx + 1) }}
        </td>
        <td v-if="cfShowId" class="col-id-val" :style="pinLeftStyle(cfPinIdLeft, 4, true, fnRowSelected(fnRow(item))) + 'background:' + fnPinBg(item, idx) + ';'">
          {{ fnRow(item)[rowKey] > 0 ? fnRow(item)[rowKey] : 'NEW' }}
        </td>
        <td v-if="showRowStatus" class="col-status-val">
          <span class="badge badge-xs" :class="fnStatusClass(fnRow(item)._row_status)">
            {{ fnRow(item)._row_status }}
          </span>
        </td>
        <td v-if="showRowCheck" class="col-check-val">
          <input type="checkbox" v-model="fnRow(item)._row_check" />
        </td>
        <template v-for="(col, ci) in columns" :key="col.key">
          <slot :name="'cell-' + col.key" :row="fnRow(item)" :idx="idx" :node="item">
            <td :style="U.tdStyle(col, fnRow(item))" :class="U.cellClass(col, fnRow(item))" :title="U.cellTitle(col, fnRow(item))">
              <div v-if="col.edit==='text' ? (col.treeDepth) : false" style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(fnRow(item)._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                    fontSize: fnRow(item)._depth===0 ? '7px' : '12px', flexShrink:0,
                    color: (typeof col.treeColor==='function' ? col.treeColor(fnRow(item)._depth) : '#888') }">
                {{ typeof col.treeBullet==='function' ? col.treeBullet(fnRow(item)._depth) : '●' }}
              </span>
              <input class="grid-input" :class="{ 'grid-mono': col.mono }"
                    v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                    :placeholder="col.placeholder" @input="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })" style="flex:1;" />
            </div>
            <input v-else-if="col.edit==='text'" class="grid-input" :class="{ 'grid-mono': col.mono }"
                  v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                  :placeholder="col.placeholder" @input="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })" />
            <input v-else-if="col.edit==='number'" type="number" class="grid-input grid-num"
                  v-model.number="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                  @input="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })" />
            <input v-else-if="col.edit==='date'" type="date" class="grid-input"
                  v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                  @input="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })" />
            <select v-else-if="col.edit==='select'" class="grid-select"
                  v-model="fnRow(item)[col.key]" :disabled="fnRow(item)._row_status==='D'"
                  @change="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })">
              <option v-if="col.nullable" :value="null">{{ col.nullLabel || '-- 선택 --' }}</option>
              <option v-for="o in U.normOptions(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <bo-path-pick-field v-else-if="col.pathPick" bare :biz-cd="col.pathPick" :row="fnRow(item)" :disabled="fnRow(item)._row_status==='D'" @change="handleSelectAction('grid-row-cell-change', { row: fnRow(item), col })" />
            <div v-else-if="col.pathLabelOpen" :style="{padding:'1px 4px 1px 8px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'22px',background:'#f5f5f7',color:fnRow(item)[col.key]!=null?'#374151':'#9ca3af',fontWeight:fnRow(item)[col.key]!=null?600:400,display:'flex',alignItems:'center',gap:'4px'}">
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="(typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(fnRow(item)[col.key]) : '') || ''">
                {{ (typeof col.pathLabelOpen.label==='function' ? col.pathLabelOpen.label(fnRow(item)[col.key]) : '') || (col.pathLabelOpen.placeholder || '경로 선택...') }}
              </span>
              <span style="display:inline-flex;align-items:center;flex-shrink:0;">
                <button type="button" @click.stop="col.pathLabelOpen.open(fnRow(item))" title="표시경로 선택" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#2563eb;flex-shrink:0;padding:0;">🔍</button>
                <span v-if="fnRow(item)[col.key] != null" title="비우기"
                  style="cursor:pointer;color:#bbb;font-size:10px;flex-shrink:0;line-height:1;padding:0 3px;"
                  @click.stop="col.pathLabelOpen.clear ? col.pathLabelOpen.clear(fnRow(item)) : (fnRow(item)[col.key] = null)">x</span>
              </span>
            </div>
            <div v-else-if="col.parentPick" style="display:flex;align-items:flex-end;gap:4px;">
              <span v-if="fnRow(item)[col.key]"
                    style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                    :title="col.parentPick.label(fnRow(item)[col.key])">
                {{ col.parentPick.label(fnRow(item)[col.key]) }}
              </span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">
                {{ col.parentPick.placeholder || '최상위' }}
              </span>
              <span style="display:inline-flex;align-items:center;flex-shrink:0;">
                <button v-if="fnRow(item)._row_status!=='D'" class="btn btn-secondary btn-xs"
                      style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" :title="col.parentPick.title || '상위 선택'"
                      @click.stop="col.parentPick.open(fnRow(item))">🔍</button>
                <span v-if="fnRow(item)[col.key] != null" title="비우기"
                      style="cursor:pointer;color:#bbb;font-size:10px;flex-shrink:0;line-height:1;padding:0 3px;"
                      @click.stop="col.parentPick.clear ? col.parentPick.clear(fnRow(item)) : (fnRow(item)[col.key] = null)">x</span>
              </span>
            </div>
            <span v-else-if="col.link" class="title-link" @click.stop="handleSelectAction('grid-cell-click', { row: fnRow(item), col, ci, idx, event: $event })"
                  @auxclick.stop="$event.button===1 ? handleSelectAction('grid-cell-click', { row: fnRow(item), col, ci, idx, event: $event }) : null"
                  :style="U.cellInnerStyle(col, fnRow(item))" :class="U.cellInnerClass(col, fnRow(item))">
              {{ U.cellText(col, fnRow(item)) }}
            </span>
            <span v-else-if="col.badge" class="badge" :class="U.badgeClass(col, fnRow(item))">
              {{ U.cellText(col, fnRow(item)) }}
            </span>
            <span v-else-if="col.cellInnerStyle != null || col.cellInnerClass != null"
                  :style="U.cellInnerStyle(col, fnRow(item))" :class="U.cellInnerClass(col, fnRow(item))">
              {{ U.cellText(col, fnRow(item)) }}
            </span>
            <template v-else>
              {{ U.cellText(col, fnRow(item)) }}
            </template>
          </td>
        </slot>
      </template>
      <td class="col-act-val" :style="pinRightStyle(4, true, fnRowSelected(fnRow(item))) + 'background:' + fnPinBg(item, idx) + ';'">
        <div class="col-act-box">
          <slot name="row-actions" :row="fnRow(item)" :idx="idx" :node="item" :grid-id="gridId">
          </slot>
        </div>
      </td>
    </tr>
  </tbody>
</table>
</div>
<!-- 하단 좌측 건수 (2026-08-01 제목 우측에서 이동). CRUD 그리드는 페이저가 없어 단독 행 -->
<div class="grid-foot">
  <span class="grid-foot-count">{{ cfCountText }}</span>
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
    counts:    { type: Object,  default: null },   // { pathId: number } — 외부 데이터 카운트 (예: 사이트 수) — 노드 우측 뱃지로 표시
  },
  emits: ['select'],
  setup(props, { emit }) {
    /* ── ▼ tree 영역 (좌측 트리 카드) ─────────────────────────────────────── */
    const cfHasSel = Vue.computed(() => props.selected != null && props.selected !== '');

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTreeCard : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-all') {
        return emit('select', null);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTreeCard : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return emit('select', param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { cfHasSel, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="card" :style="'padding:' + pad + ';'">
  <div class="toolbar" style="margin-bottom:6px;">
    <span class="list-title" style="font-size:13px;">
      📂 {{ title }}
      <!-- 헤더의 bizCd 뱃지는 항상 표시 (트리 종류 식별용). 노드별 표시는 showBizCd 로 제어 -->
      <span v-if="bizCd" style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
        #{{ bizCd }}
      </span>
    </span>
    <span v-if="cfHasSel" @click="handleBtnAction('tree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
      {{ allLabel }}
    </span>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;border-bottom:1px solid #ececec;'">
    <bo-path-tree :biz-cd="bizCd" :show-biz-cd="showBizCd" :selected="selected" :counts="counts" @select="id => handleSelectAction('node-select', { id })" />
  </div>
</div>
`,
};

/* ── BoMenuTreeCard — 좌측 메뉴 트리 카드 (sy_menu 자기참조 트리) ────────────
 * BoPathTreeCard 의 메뉴 버전. sy_menu 의 parent_menu_id 자기참조 트리를 그린다.
 * SyMenuMng 등 메뉴 화면 전용.
 *
 * props:
 *   title     — string 카드 제목 (기본 '메뉴')
 *   selected  — 현재 선택 menuId (null = 전체)
 *   allLabel  — string 전체보기 링크 텍스트 (기본 '전체보기')
 *   maxHeight — string 스크롤 영역 높이 (기본 '65vh')
 *   pad       — string 카드 padding (기본 '12px')
 *   counts    — Object { menuId: number } — 외부 카운트 (백엔드 selectMenuTreeCnts 결과)
 * emit:
 *   select(menuId) — 노드 클릭 / 전체보기(null) 통합
 * ──────────────────────────────────────────────────────────────────────── */
window.BoMenuTreeCard = {
  name: 'BoMenuTreeCard',
  props: {
    title:     { type: String,  default: '메뉴' },
    selected:  { default: null },
    allLabel:  { type: String,  default: '전체보기' },
    maxHeight: { type: String,  default: '65vh' },
    pad:       { type: String,  default: '12px' },
    counts:    { type: Object,  default: null },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const cfHasSel = Vue.computed(() => props.selected != null && props.selected !== '');

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoMenuTreeCard : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-all') {
        return emit('select', null);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoMenuTreeCard : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return emit('select', param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { cfHasSel, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="card" :style="'padding:' + pad + ';'">
  <div class="toolbar" style="margin-bottom:6px;">
    <span class="list-title" style="font-size:13px;">
      📂 {{ title }}
      <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_menu</span>
    </span>
    <span v-if="cfHasSel" @click="handleBtnAction('tree-all')" style="font-size:11px;color:#1677ff;cursor:pointer;">
      {{ allLabel }}
    </span>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;'">
    <bo-menu-tree :selected="selected" :counts="counts" @select="id => handleSelectAction('node-select', { id })" />
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
    /* ── ▼ tree 영역 (로컬 트리 카드) ─────────────────────────────────────── */
    const cfHasSel = Vue.computed(() => props.selected != null && props.selected !== '');
    const cfCardStyle = Vue.computed(() =>
      'padding:12px;' + (props.sticky ? 'position:sticky;top:0;' : ''));

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoLocalTreeCard : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-all') {
        return emit('select', null);
      } else if (cmd === 'tree-expand-all') {
        return emit('expand-all');
      } else if (cmd === 'tree-collapse-all') {
        return emit('collapse-all');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoLocalTreeCard : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return emit('select', param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* BoPathTreeNode 가 콜백 prop 으로 받는 onSelect — dispatch 경유 */
    const fnOnSelect = (id) => handleSelectAction('node-select', { id });

    return { cfHasSel, cfCardStyle, fnOnSelect, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="card" :style="cfCardStyle">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <span style="font-size:13px;font-weight:600;color:#555">
      📂 {{ title }}
      <span v-if="bizCd" style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">
        #{{ bizCd }}
      </span>
    </span>
    <div v-if="cfHasSel" style="font-size:11px;color:#1677ff;cursor:pointer" @click="handleBtnAction('tree-all')">
      {{ allLabel }}
    </div>
  </div>
  <slot name="filter">
  </slot>
  <div v-if="expandable" style="display:flex;gap:4px;margin-bottom:8px">
    <button class="btn btn_expand_all" style="flex:1;font-size:11px" @click="handleBtnAction('tree-expand-all')">
      ▼ 전체펼치기
    </button>
    <button class="btn btn_collapse_all" style="flex:1;font-size:11px" @click="handleBtnAction('tree-collapse-all')">
      ▶ 전체닫기
    </button>
  </div>
  <div :style="'max-height:' + maxHeight + ';overflow:auto;'">
    <bo-path-tree-node :node="node" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="fnOnSelect" :depth="0" />
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
    /* default: false ⭐ — Vue 는 :show="expr" 의 expr 이 undefined 로 평가되면 "prop 미전달"로
       간주해 default 값을 대신 쓴다. 초기화 안 된 reactive 필드를 바인딩하면 값이 undefined 인
       동안 default:true 로 떨어져 모달이 묻지도 않았는데 열려버린다
       (FoModal 동일 이슈 실사고 2026-08-18 → false 로 정정). 이 컴포넌트를 <bo-modal v-if="..."> 로
       감싸 항상-표시 용도로 쓰는 곳(BoExcelUploadModal, PdProdMng 옵션코드관리 모달)은
       반드시 :show="true" 를 명시할 것 — default 에 기대면 안 됨. */
    show:            { type: Boolean, default: false },
    title:           { type: String,  default: '' },
    width:           { type: String,  default: '600px' },
    maxWidth:        { type: String,  default: '95vw' },
    height:          { type: String,  default: 'auto' },
    minHeight:       { type: String,  default: '' },    // 목록형 팝업의 높이 출렁임 방지 (건수에 따라 커졌다 작아지는 것)
    maxHeight:       { type: String,  default: '90vh' },
    zIndex:          { type: Number,  default: 9000 },
    boxPad:          { type: String,  default: '20px' },  // .modal-box 자체 padding (인라인 디자인 모달은 '0')
    bodyPad:         { type: String,  default: '20px' },  // body 내부 padding
    closeOnBackdrop: { type: Boolean, default: true },
    overlayBg:       { type: String,  default: 'rgba(18,24,40,0.55)' },  // 오버레이 배경 (전용 화면 모드는 불투명 지정)
    teleport:        { type: Boolean, default: true },
    onCloseCb:       { type: Function, default: null },  // 닫기 시 호출되는 콜백 (emit('close')와 병행)
    onConfirmCb:     { type: Function, default: null },  // 확인 시 호출되는 콜백 (#footer 슬롯 prop 'confirm' + emit('confirm'))
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    const cfOverlayStyle = Vue.computed(() =>
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;'
      + 'background:' + props.overlayBg + ';z-index:' + props.zIndex + ';');
    const cfBoxStyle = Vue.computed(() =>
      'background:#fff;width:' + props.width + ';max-width:' + props.maxWidth + ';'
      + 'height:' + props.height + ';max-height:' + props.maxHeight + ';'
      + (props.minHeight ? ('min-height:' + props.minHeight + ';') : '')
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

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoModal : handleBtnAction -> ', cmd, param);
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
      console.log(' ■■ BoModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* footer slot prop 호환용 — 외부 슬롯이 confirm()/close() 호출하면 dispatch 경유 */
    const onClose = () => handleBtnAction('modal-close');
    const onConfirm = () => handleBtnAction('modal-confirm');

    return { onClose, onConfirm, cfOverlayStyle, cfBoxStyle, cfBodyOuterStyle, cfBodyInnerStyle,
             handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<teleport to="body" :disabled="!teleport">
  <div v-if="show" class="modal-overlay" :style="cfOverlayStyle" @click.self="handleBtnAction('modal-backdrop')">
    <div class="modal-box" :style="cfBoxStyle">
      <div v-if="title" class="modal-header" style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <span style="font-weight:800;font-size:15px;color:#9f2946;letter-spacing:-0.2px;">
          <slot name="title">{{ title }}</slot>
        </span>
        <span style="display:flex;align-items:center;gap:8px;">
          <slot name="header-extra">
          </slot>
          <button type="button" class="modal-close" @click="handleBtnAction('modal-close')">
            ✕
          </button>
        </span>
      </div>
      <div :style="cfBodyOuterStyle">
        <div :style="cfBodyInnerStyle">
          <slot name="body">
            <slot>
            </slot>
          </slot>
        </div>
      </div>
      <div v-if="$slots.footer" class="modal-footer" style="flex-shrink:0;display:flex;justify-content:flex-end;gap:8px;padding:12px 0 0;border-top:1px solid #f0f0f0;margin-top:14px;">
        <slot name="footer" :confirm="onConfirm" :close="onClose">
        </slot>
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

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoCronModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'cron-apply') {
        emit('apply', st.preview);
        return emit('close');
      } else if (cmd === 'cron-close') {
        return emit('close');
      } else if (cmd === 'cron-update-preview') {
        st.preview = st.minute + ' ' + st.hour + ' ' + st.day + ' ' + st.month + ' ' + st.weekday;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoCronModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'preset-apply') {
        const pts = param.value.split(' ');
        st.minute = pts[0]; st.hour = pts[1]; st.day = pts[2]; st.month = pts[3]; st.weekday = pts[4];
        st.preview = param.value;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { PRESETS, FIELDS, st, cfDesc, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<bo-modal :show="show" title="🕐 Cron 표현식 설정" width="500px" @close="handleBtnAction('cron-close')">
  <!-- ▼ preset 영역 -->
  <div style="margin-bottom:18px;">
    <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">
      ⚡ 프리셋
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      <button v-for="p in PRESETS" :key="p.value"
        class="btn btn-sm"
        :style="st.preview === p.value
        ? 'border:1.5px solid #e8587a;color:#e8587a;background:#fff5f7;font-weight:600;'
        : 'border:1px solid #d9d9d9;color:#555;background:#fff;'"
        style="font-size:11px;padding:5px 10px;text-align:left;line-height:1.5;"
        @click="handleSelectAction('preset-apply', { value: p.value })">
        <div>
          {{ p.label }}
        </div>
        <code style="font-size:10px;opacity:.65;letter-spacing:.5px;">{{ p.value }}</code>
        </button>
      </div>
    </div>
    <!-- ▼ fields 영역 -->
    <div style="margin-bottom:18px;">
      <div style="font-size:12px;font-weight:700;color:#444;margin-bottom:8px;">
        🔧 수동 설정
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
        <div v-for="f in FIELDS" :key="f.key" style="text-align:center;">
          <div style="font-size:10px;color:#888;margin-bottom:4px;font-weight:600;">
            {{ f.label }}
          </div>
          <input class="form-control"
          style="text-align:center;font-family:monospace;font-size:13px;padding:5px 4px;"
          :placeholder="f.placeholder" :title="f.hint"
          v-model="st[f.key]" @input="handleBtnAction('cron-update-preview')" />
          <div style="font-size:9px;color:#bbb;margin-top:3px;">
            {{ f.hint }}
          </div>
        </div>
      </div>
    </div>
    <div style="background:#f0f8ff;border:1px solid #dbeafe;border-radius:6px;padding:10px 16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:11px;color:#888;flex-shrink:0;">
        결과
      </span>
      <code style="font-size:16px;color:#2563eb;font-weight:700;letter-spacing:2px;">{{ st.preview }}</code>
        <span v-if="cfDesc" style="font-size:11px;color:#e8587a;margin-left:auto;font-weight:600;">
          {{ cfDesc }}
        </span>
      </div>
      <template #footer>
        <button class="btn btn_cancel" @click="handleBtnAction('cron-close')">
          취소
        </button>
        <button class="btn btn_apply" @click="handleBtnAction('cron-apply')">
          적용
        </button>
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
    /* ── ▼ treeModal 영역 ────────────────────────────────────────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoTreeSelectorModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'treeModal-close') {
        return emit('close');
      } else if (cmd === 'treeModal-root-select') {
        return emit('select', null);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoTreeSelectorModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return emit('select', param.id);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* BoPathParentSelector 콜백 prop 호환 — dispatch 경유 */
    const fnOnSelect = (id) => handleSelectAction('node-select', { id });

    return { fnOnSelect, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" width="420px" max-height="70vh" body-pad="0" @close="handleBtnAction('treeModal-close')">
  <div style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
    <div v-if="rootLabel" style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff;"
      @click="handleBtnAction('treeModal-root-select')">
      {{ rootLabel }}
    </div>
    <bo-path-parent-selector :node="node" :expanded="expanded"
      :on-toggle="onToggle" :on-select="fnOnSelect" :depth="0" />
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
    /* ── ▼ roleModal 영역 ────────────────────────────────────────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoRoleSelectModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'roleModal-close') {
        return emit('close');
      } else if (cmd === 'roleModal-confirm') {
        return emit('confirm');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoRoleSelectModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return { handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<bo-modal :show="show" :title="title" width="1000px" height="720px" body-pad="0" @close="handleBtnAction('roleModal-close')">
  <template #header-extra>
    <slot name="header-extra">
    </slot>
  </template>
  <div style="display:grid;grid-template-columns:300px 1fr;flex:1;overflow:hidden;height:100%;">
    <div style="border-right:1px solid #eee;overflow-y:auto;padding:12px;">
      <slot name="tree">
      </slot>
    </div>
    <div style="overflow-y:auto;padding:12px;">
      <slot name="perm">
      </slot>
    </div>
  </div>
  <template #footer>
    <span style="margin-right:auto;">
      <slot name="footer-extra">
      </slot>
    </span>
    <button class="btn btn_cancel" @click="handleBtnAction('roleModal-close')">
      취소
    </button>
    <button class="btn btn-primary" :disabled="confirmDisabled" @click="handleBtnAction('roleModal-confirm')">
      ✔ {{ confirmLabel }}
    </button>
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
    /* ── ▼ row 영역 (CRUD 행 취소/삭제 버튼) ──────────────────────────────── */
    const cfShowCancel = Vue.computed(() => ['U', 'I', 'D'].includes(props.row._row_status));
    const cfShowDelete = Vue.computed(() => {
      const s = props.row._row_status;
      if (props.allowDeleteNull && s == null) return true;
      return ['N', 'U'].includes(s);
    });

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoRowCancelDelete : handleBtnAction -> ', cmd, param);
      if (cmd === 'row-cancel') {
        return emit('cancel');
      } else if (cmd === 'row-delete') {
        return emit('delete');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoRowCancelDelete : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return { cfShowCancel, cfShowDelete, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<span>
  <button v-if="cfShowCancel" class="btn btn-secondary btn-xs" @click.stop="handleBtnAction('row-cancel')">
    {{ cancelLabel }}
  </button>
  <button v-if="cfShowDelete" class="btn btn_row_delete" @click.stop="handleBtnAction('row-delete')">
    {{ deleteLabel }}
  </button>
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
 * 공통 속성: required, placeholder, colSpan(미지정=1, 1~N), rowSpan(미지정=1, 1~N),
 *           width, min/max, mono, hint, visible:(form)=>bool, onChange:(v,form)=>void
 * cols prop: 한 줄 필드 수 (기본 3). colSpan 누적이 cols 초과 시 자동 줄바꿈.
 *
 * colSpan/rowSpan 정책 (2026-05-27 명시):
 *  - 미지정 시 모두 1 로 처리
 *  - "특별한 경우" (긴 입력, 주소, 설명, textarea, 슬롯 큰 영역 등) 만 명시
 *  - rowSpan>1 인 필드는 세로로 그 행 수만큼 차지 (CSS grid-row span) */
window.BoFormArea = {
  name: 'BoFormArea',
  props: {
    columns:     { type: Array,   required: true },  // 필드 정의
    /* 기본값 필수 — undefined 가 들어오면 템플릿의 form[col.key] 에서
       'Cannot read properties of undefined' 로 화면 전체가 렌더 실패한다.
       (MbMemberDtl 이 detailModal.form 을 가드 없이 넘겨 실제로 발생, 2026-07-30) */
    form:        { type: Object,  default: () => ({}) },  // form reactive
    errors:      { type: Object,  default: () => ({}) },
    readonly:    { type: Boolean, default: false },  // cfDtlMode (조회 모드)
    cols:        { type: Number,  default: 3 },      // 한 줄 필드 수
    labelLeft:   { type: Boolean, default: false },  // true=라벨 좌측 / 값 우측 분리, false=라벨 위 / 값 아래
    labelWidth:  { type: String,  default: '90px' }, // labelLeft 모드에서 라벨 컬럼 폭
    compact:     { type: Boolean, default: false },  // true=필드 높이/간격 축소 (행 펼침·인라인 패널용)
    plainReadonly: { type: Boolean, default: false },  // true=readonly 필드를 박스(배경/테두리) 없이 순수 라벨처럼 표시
    showActions: { type: Boolean, default: true },
    saveLabel:   { type: String,  default: '저장' },
    cancelLabel: { type: String,  default: '취소' },
    editLabel:   { type: String,  default: '수정' },
    closeLabel:  { type: String,  default: '닫기' },
    deleteLabel: { type: String,  default: '삭제' },
    showDelete:  { type: Boolean, default: true }, // 보기모드에 [삭제] 노출 여부 — 신규 등록 등 삭제 대상 없을 때 false
    showCancel:  { type: Boolean, default: true }, // 편집모드에 [취소] 노출 여부 — 신규 등록(되돌아갈 보기화면이 없음)일 때 false
  },
  emits: ['save', 'cancel', 'edit', 'close', 'delete'],
  setup(props, { emit }) {
    const U = window._boAreaCompUtil;

    /* ── ▼ 초기 reactive / 파생 변수 ─────────────────────────────────────── */
    /* fnEffSpan — 유효 colSpan 산출.
     *   내용/긴 입력 영역(textarea·htmlEditor)은 colSpan 미지정 시 항상 한 줄 전체 폭(cols).
     *   다른 필드가 같은 줄에 끼지 않게 한다. (정책: §4.7 / CLAUDE.md "큰 영역은 한 줄 전체 폭")
     *   colSpan 이 명시돼 있으면 그 값을 우선 존중한다. → 화면에서 textarea 는 colSpan:3(=cols) 명시 권장. */
    const FULL_WIDTH_TYPES = ['textarea', 'htmlEditor', 'group'];
    const fnEffSpan = (col) => {
      if (col.colSpan != null) return Math.min(col.colSpan, props.cols);
      if (FULL_WIDTH_TYPES.includes(col.type)) return props.cols;
      return 1;
    };

    /* columns → 행별 그룹화 (rowBreak 또는 colSpan 누적이 cols 초과 시 줄바꿈)
     *           rowSpan>1 인 필드는 다음 행들에도 col 자리를 점유한다.
     *           type:'group' — 25~30개 필드처럼 항목이 많을 때 중간 제목(섹션 헤더)을 끼워넣는 용도.
     *           앞뒤로 강제 줄바꿈 + 항상 한 줄 전체 폭(cols) 단독 행. { type:'group', label:'기본정보' } 형태로 사용. */
    const cfRows = Vue.computed(() => {
      const rows = []; let cur = []; let used = 0;
      for (const col of props.columns) {
        if (col.visible && !col.visible(props.form)) continue;
        if (col.type === 'rowBreak') { if (cur.length) { rows.push(cur); cur = []; used = 0; } continue; }
        if (col.type === 'group') { if (cur.length) { rows.push(cur); cur = []; used = 0; } rows.push([col]); continue; }
        const span = fnEffSpan(col);
        if (used + span > props.cols && cur.length) { rows.push(cur); cur = []; used = 0; }
        cur.push(col); used += span;
        if (used >= props.cols) { rows.push(cur); cur = []; used = 0; }
      }
      if (cur.length) rows.push(cur);
      return rows;
    });

    /* cfFieldStyle — 공통 style 헬퍼 (template 가독성용) */
    const cfFieldStyle = (col) => {
      const cs = fnEffSpan(col);
      const rs = col.rowSpan || 1;
      let s = '';
      if (cs > 1) s += `grid-column:span ${Math.min(cs, props.cols)};flex:${cs};`;
      if (rs > 1) s += `grid-row:span ${rs};`;
      /* group 타입은 라벨/입력 2칸 구조가 아니므로 labelLeft 의 90px 라벨열 그리드를 적용하지 않는다
         (적용 시 섹션 제목이 90px 라벨칸에 눌려 잘림) */
      if (props.labelLeft && col.type !== 'group') s += `display:grid;grid-template-columns:${props.labelWidth} 1fr;align-items:center;gap:8px;margin-bottom:${props.compact ? '2px' : '6px'};`;
      return s;
    };

    /* ── ▼ dispatch — handleBtnAction / handleSelectAction ───────────────── */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoFormArea : handleBtnAction -> ', cmd, param);
      if (cmd === 'form-save') {
        return emit('save');
      } else if (cmd === 'form-cancel') {
        return emit('cancel');
      } else if (cmd === 'form-edit') {
        return emit('edit');
      } else if (cmd === 'form-close') {
        return emit('close');
      } else if (cmd === 'form-delete') {
        return emit('delete');
      } else if (cmd === 'form-pathPick-clear') {
        props.form[param.col.key] = null;
      } else if (cmd === 'form-pick-clear') {
        props.form[param.col.key] = '';
        if (param.col.nameKey) props.form[param.col.nameKey] = '';
        if (param.col.onClear) param.col.onClear(props.form);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoFormArea : handleSelectAction -> ', cmd, param);
      if (cmd === 'field-change') {
        /* 입력할 때마다 오류 라벨을 즉시 갱신한다.
           col.validate(value, form) 가 있으면 그 결과로(형식검증 등 실시간 재판정),
           없으면 값이 채워지기만 해도 지운다(단순 필수입력) — 다음 저장 전까지 남아있지 않도록. */
        if (props.errors) {
          const col = param.col, v = props.form[col.key];
          if (col.validate) {
            const msg = col.validate(v, props.form);
            if (msg) { props.errors[col.key] = msg; } else if (props.errors[col.key]) { delete props.errors[col.key]; }
          } else if (props.errors[col.key] && v) {
            delete props.errors[col.key];
          }
        }
        if (param.col.onChange) return param.col.onChange(props.form[param.col.key], props.form, param.event);
      } else if (cmd === 'field-checkbox-change') {
        const col = param.col, e = param.event;
        props.form[col.key] = e.target.checked
          ? (col.checkedValue != null ? col.checkedValue : 'Y')
          : (col.uncheckedValue != null ? col.uncheckedValue : 'N');
        if (props.errors && props.errors[col.key] && props.form[col.key]) { delete props.errors[col.key]; }
      } else if (cmd === 'field-pathPick-open') {
        if (param.col.onOpen) return param.col.onOpen(props.form);
      } else if (cmd === 'field-pick-open') {
        if (param.col.onOpen) return param.col.onOpen(props.form);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const normOpts = (opts) => U.normOptions(opts);
    /* readonly 표시값 — fmt 가 있으면 최우선 사용.
       select/checkbox/multiCheck 는 fmt 없으면 저장된 코드값 대신 라벨을 찾아 보여준다
       (plainReadonly 로 select 등이 자동 변환될 때 코드값이 그대로 노출되는 것 방지). */
    const dispVal = (col) => {
      const v = props.form[col.key];
      if (col.fmt) return col.fmt(v, props.form);
      if (col.type === 'select') {
        const found = normOpts(col.options).find(o => String(o.value) === String(v));
        if (found) return found.label;
      } else if (col.type === 'checkbox') {
        const checkedVal = col.checkedValue != null ? col.checkedValue : 'Y';
        return v === checkedVal ? (col.checkboxLabel || col.label) : '-';
      } else if (col.type === 'multiCheck') {
        const sep = col.separator || '^';
        const vals = String(v || '').split(sep).filter(Boolean);
        if (!vals.length) return '-';
        const opts = normOpts(col.options);
        return vals.map(vv => (opts.find(o => String(o.value) === vv) || {}).label || vv).join(', ');
      }
      return (v == null || v === '') ? '-' : v;
    };

    /* plainReadonly 자동 변환 대상 — 폼 전체가 readonly 일 때 text/select/date 등 입력형 컬럼도
       readonly-field-plain 라벨로 표시한다. pathPick/pick/slot 은 자체 readonly 처리를 이미 갖고 있어 제외,
       type:'readonly' 는 별도 분기에서 처리하므로 제외. */
    const fnAutoPlain = (col) => props.readonly && props.plainReadonly
      && !['slot', 'pathPick', 'pick', 'readonly', 'group', 'rowBreak'].includes(col.type);

    /* fnColLabel / fnColNm — 개발용 DB 컬럼명 병기 (coUtil.SHOW_COL_NM 로 일괄 on/off) */
    const fnColLabel = (col) => coUtil.cofColLabel(col);
    const fnColNm    = (col) => coUtil.cofColNm(col);

    return { fnColLabel, fnColNm, cfRows, cfFieldStyle, normOpts, dispVal, fnAutoPlain, handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div class="bo-form-area" :class="compact?'bo-form-compact':''">
  <div v-for="(row, ri) in cfRows" :key="ri" class="form-row" :class="cols===3?'col3':''" :style="(cols!==2 ? cols!==3 : false) ? ('grid-template-columns:repeat('+cols+',1fr)') : ''">
    <div v-for="col in row" :key="col.key || col.label" class="form-group" :class="plainReadonly && (col.type==='readonly' || fnAutoPlain(col)) ? 'form-group-plain' : ''" :style="cfFieldStyle(col)">
    <!-- 중간그룹 제목 (라벨/입력 없이 섹션 헤더만) -->
    <div v-if="col.type === 'group'" class="section-title" :style="ri===0?'margin-top:0;':''">
    {{ fnColLabel(col) }}
    <span v-if="col.desc" :title="col.desc"
      style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:10px;font-style:normal;font-weight:700;margin-left:5px;cursor:help;vertical-align:middle;">
      i
    </span>
  </div>
    <!-- 라벨 (hideLabel:true 면 라벨 영역만 빈 칸으로 자리 유지)
         slot 타입도 col.label 이 있으면 위쪽 라벨 모드에서 자동 렌더 (라벨 누락 방지).
         단, labelLeft 모드 + slot 의 경우 grid 첫 칸 채우기 위해 별도 렌더 분기. -->
    <label v-else-if="col.type !== 'slot' ? (!col.hideLabel) : false" class="form-label" :style="labelLeft?'margin-bottom:0;white-space:nowrap;':''">
    {{ fnColLabel(col) }}
    <span v-if="col.required ? (!readonly) : false" class="req">
    *
  </span>
    <span v-if="col.helpText" :title="col.helpText"
      style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:9px;font-style:normal;font-weight:700;margin-left:5px;cursor:help;vertical-align:middle;">
    i
  </span>
    <span v-if="col.hint" class="form-hint" style="font-size:11px;color:#888;font-weight:400;margin-left:6px;">
    {{ col.hint }}
  </span>
</label>
<label v-else-if="col.type !== 'slot' ? (col.hideLabel) : false" class="form-label" :style="'visibility:hidden;'+(labelLeft?'margin-bottom:0;':'')">
·
</label>
<label v-else-if="col.type === 'slot' ? (labelLeft ? (col.label ? (!col.hideLabel) : false) : false) : false" class="form-label" style="margin-bottom:0;white-space:nowrap;">
{{ fnColLabel(col) }}
<span v-if="col.required ? (!readonly) : false" class="req">
*
</span>
<span v-if="col.helpText" :title="col.helpText"
  style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:9px;font-style:normal;font-weight:700;margin-left:5px;cursor:help;vertical-align:middle;">
i
</span>
</label>
<label v-else-if="col.type === 'slot' ? (!labelLeft ? (col.label ? (!col.hideLabel) : false) : false) : false" class="form-label">
{{ fnColLabel(col) }}
<span v-if="col.required ? (!readonly) : false" class="req">
*
</span>
<span v-if="col.helpText" :title="col.helpText"
  style="display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:9px;font-style:normal;font-weight:700;margin-left:5px;cursor:help;vertical-align:middle;">
i
</span>
<span v-if="col.hint" class="form-hint" style="font-size:11px;color:#888;font-weight:400;margin-left:6px;">
{{ col.hint }}
</span>
</label>
<!-- readonly 표시 -->
<div v-if="col.type === 'readonly' ? (col.html) : false" :class="plainReadonly ? 'readonly-field-plain' : 'readonly-field'" v-html="dispVal(col)">
</div>
<div v-else-if="col.type === 'readonly'" :class="plainReadonly ? 'readonly-field-plain' : 'readonly-field'">
  {{ dispVal(col) }}
</div>
<!-- plainReadonly 자동 변환 — 폼이 readonly 일 때 입력형 컬럼(text/select/date 등)도 라벨처럼 표시 -->
<div v-else-if="fnAutoPlain(col)" class="readonly-field-plain">
  {{ dispVal(col) }}
</div>
<!-- text / password -->
<input v-else-if="col.type === 'text' || col.type === 'password'"
        class="form-control" :type="col.type === 'password' ? 'password' : 'text'"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly || col.readonly"
        :style="(col.mono ? 'font-family:monospace;' : '') + (col.width ? ('width:' + col.width + ';') : '') + (col.readonly ? 'background:#f5f5f5;' : '')"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })" />
<!-- number -->
<input v-else-if="col.type === 'number'" class="form-control" type="number"
        v-model.number="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly || col.readonly" :min="col.min" :max="col.max"
        :style="col.readonly ? 'background:#f5f5f5;' : ''"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })" />
<!-- date -->
<input v-else-if="col.type === 'date'" class="form-control" type="date"
        v-model="form[col.key]" :readonly="readonly"
        :class="errors[col.key] ? 'is-invalid' : ''" @change="handleSelectAction('field-change', { col, event: $event })" />
<!-- multiCheck (^A^B^ 멀티값) — BoSearchArea 와 같은 컴포넌트를 폼에서도 쓴다 -->
<bo-multi-check-select v-else-if="col.type === 'multiCheck'"
      :model-value="form[col.key]"
      :options="typeof col.options === 'function' ? col.options() : (col.options || [])"
      :placeholder="col.placeholder || '선택'" :all-label="col.allLabel || '전체'"
      :separator="col.separator || '^'" :empty-value="col.emptyValue"
      :min-width="col.width || '180px'" :disabled="readonly"
      @update:modelValue="v => { form[col.key] = v; handleSelectAction('field-change', { col }); }" />
<!-- checkbox (Y/N 토글) -->
<label v-else-if="col.type === 'checkbox'" style="display:flex;align-items:center;gap:6px;cursor:pointer;min-height:34px;position:relative;z-index:1;pointer-events:auto;">
  <input type="checkbox"
          :checked="form[col.key] === (col.checkedValue != null ? col.checkedValue : 'Y')"
          :disabled="readonly"
          style="pointer-events:auto;cursor:pointer;width:14px;height:14px;flex-shrink:0;"
          @change="handleSelectAction('field-checkbox-change', { col, event: $event })" />
  <span>
    {{ col.checkboxLabel || col.label }}
  </span>
</label>
<!-- textarea -->
<textarea v-else-if="col.type === 'textarea'" class="form-control"
        v-model="form[col.key]" :placeholder="col.placeholder"
        :readonly="readonly" :rows="col.rows || 3"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @input="handleSelectAction('field-change', { col, event: $event })"></textarea>
  <!-- select -->
  <select v-else-if="col.type === 'select'" class="form-control"
        v-model="form[col.key]" :disabled="readonly"
        :class="errors[col.key] ? 'is-invalid' : ''"
        @change="handleSelectAction('field-change', { col, event: $event })">
    <option v-if="col.nullable !== false ? (col.nullLabel) : false" value="">{{ col.nullLabel }}</option>
  <option v-for="o in normOpts(col.options)" :key="o.value" :value="o.value">{{ o.label }}</option>
</select>
<!-- pathPick (표시경로 선택 박스) — readonly+plainReadonly 면 다른 필드와 동일하게 순수 라벨(readonly-field-plain)로 표시 -->
<div v-if="col.type === 'pathPick' ? (readonly && plainReadonly) : false" class="readonly-field-plain">
  {{ col.pathLabel ? (col.pathLabel(form[col.key]) || '-') : (form[col.key] != null ? '#' + form[col.key] : '-') }}
</div>
<div v-else-if="col.type === 'pathPick'" style="display:flex;align-items:center;gap:8px;">
  <div :style="{flex:1,padding:compact?'4px 10px':'6px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'13px',background:readonly?'#f9fafb':'#fff',color:form[col.key]!=null?'#374151':'#9ca3af',minHeight:compact?'28px':'34px',display:'flex',alignItems:'center'}">
    {{ col.pathLabel ? col.pathLabel(form[col.key]) : (form[col.key] != null ? '#' + form[col.key] : '경로 선택...') }}
  </div>
  <span v-if="!readonly" style="display:inline-flex;align-items:center;flex-shrink:0;align-self:stretch;">
    <button type="button" class="btn btn-secondary btn-sm" title="표시경로 선택" @click="handleSelectAction('field-pathPick-open', { col })" :style="{padding:'0',width:compact?'28px':'34px',height:compact?'28px':'34px',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}">🔍</button>
    <button v-if="form[col.key] != null" type="button" title="선택 해제" @click="handleBtnAction('form-pathPick-clear', { col })" style="background:none;border:none;padding:0 4px;color:#bbb;cursor:pointer;font-size:11px;line-height:1;">x</button>
  </span>
</div>
<!-- pick (팝업 선택 박스) — col.onOpen(form) 으로 팝업 열기, col.nameKey 로 표시명 키 지정 -->
<!-- readonly+plainReadonly 면 다른 필드와 동일하게 순수 라벨(readonly-field-plain)로 표시 -->
<div v-if="col.type === 'pick' ? (readonly && plainReadonly) : false" class="readonly-field-plain">
  {{ (col.display ? col.display(form) : (col.nameKey ? form[col.nameKey] : form[col.key])) || '-' }}
</div>
<div v-else-if="col.type === 'pick'" style="display:flex;align-items:center;gap:6px;">
  <input :value="col.display ? col.display(form) : (col.nameKey ? (form[col.nameKey] || '') : (form[col.key] || ''))"
    readonly :placeholder="col.placeholder || '선택'"
    class="form-control" :style="'background:#f9f9f9;' + (col.width ? ('width:' + col.width) : '')" />
  <span style="display:inline-flex;align-items:center;flex-shrink:0;">
    <button v-if="!readonly" type="button" class="btn btn-secondary btn-sm" title="선택"
      style="padding:0;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"
      @click="handleSelectAction('field-pick-open', { col })">🔍</button>
    <button v-if="!readonly ? form[col.key] : false" type="button" title="선택 해제"
      style="background:none;border:none;padding:0 4px;color:#bbb;cursor:pointer;font-size:11px;line-height:1;"
      @click="handleBtnAction('form-pick-clear', { col })">x</button>
  </span>
</div>
<!-- slot 탈출구 -->
<slot v-else-if="col.type === 'slot'" :name="col.name || col.key" :form="form" :col="col" :readonly="readonly">
</slot>
<!-- 에러 메시지 (힌트는 라벨 우측에 표시) — slot 은 자체 슬롯 내부에서 직접 렌더(중복 방지) -->
<span v-if="col.type !== 'slot' && errors[col.key]" class="field-error">
  {{ errors[col.key] }}
</span>
</div>
</div>
<!-- ▼ form-actions 영역 -->
<div v-if="showActions" class="form-actions">
  <slot name="actions-before">
  </slot>
  <template v-if="readonly">
    <button class="btn btn_edit" :class="compact?'btn-sm':''" @click="handleBtnAction('form-edit')">
      {{ editLabel }}
    </button>
    <!-- 보기모드에서도 [삭제] 바로 노출(2026-08-22 정책: 보기모드 표준 버튼 = [수정][삭제][닫기]) -->
    <button v-if="showDelete" class="btn btn_delete" :class="compact?'btn-sm':''" @click="handleBtnAction('form-delete')">
      {{ deleteLabel }}
    </button>
    <button class="btn btn_close" :class="compact?'btn-sm':''" @click="handleBtnAction('form-close')">
      {{ closeLabel }}
    </button>
  </template>
  <template v-else>
    <button class="btn btn_save" :class="compact?'btn-sm':''" @click="handleBtnAction('form-save')">
      {{ saveLabel }}
    </button>
    <!-- 편집모드에서도 [삭제] 노출(2026-08-22 정책: 편집모드 표준 버튼 = [저장][삭제(기존만)][취소][닫기]) -->
    <button v-if="showDelete" class="btn btn_delete" :class="compact?'btn-sm':''" @click="handleBtnAction('form-delete')">
      {{ deleteLabel }}
    </button>
    <!-- 신규 등록(되돌아갈 보기화면 자체가 없음)은 [취소] 숨김 — 2026-08-22 사용자 피드백 -->
    <button v-if="showCancel" class="btn btn_cancel" :class="compact?'btn-sm':''" @click="handleBtnAction('form-cancel')">
      {{ cancelLabel }}
    </button>
    <!-- 편집 중에도 [닫기]는 별도로 노출 — [취소]는 보기모드로 되돌리고, [닫기]는 모드 무관 무조건
         닫는다(2026-08-22 사용자 피드백: 새창에서 편집 중 닫기가 사라지는 문제). -->
    <button class="btn btn_close" :class="compact?'btn-sm':''" @click="handleBtnAction('form-close')">
      {{ closeLabel }}
    </button>
  </template>
  <slot name="actions-after">
  </slot>
</div>
</div>
`,
};

/* ============================================================
 * BoGroupTable — N행 그룹 헤더 테이블 컴포넌트
 *
 * 컬럼 정의 (모두 평탄한 1차원 배열):
 *   Fixed (colGroup 없음):
 *     { key, label, width, align, thStyle,
 *       fmt(row,idx), tdStyle(row), titleFmt(row),
 *       iconBadge(row), check(row), checkColor,
 *       badge(row), badgeLabel(row), cellStyle(row), slot }
 *   Group 소속 (colGroup 있음):
 *     위 동일 필드 + colGroup(string), thBg, thColor
 *     + 그룹 스타일(첫 컬럼에만): colGroupBg, colGroupColor, colGroupBorderColor
 *       ^ 구분자로 레벨별 다른 스타일: colGroupBg: '#e3f2fd^#bbdefb'
 *         → 1행 그룹헤더:#e3f2fd, 2행 그룹헤더:#bbdefb
 *   colGroup ^ 구분자로 계층 표현:
 *     "그룹A"          → 2행 헤더 (그룹A / 컬럼라벨)
 *     "그룹A^소그룹B"  → 3행 헤더 (그룹A / 소그룹B / 컬럼라벨)
 * ============================================================ */
window.BoGroupTable = {
  name: 'BoGroupTable',
  props: {
    columns:      { type: Array,            default: () => [] },
    rows:         { type: Array,            default: () => [] },
    rowKey:       { type: String,           default: 'id' },
    selectedKey:  { type: [String, Number], default: null },
    tableStyle:   { type: String,           default: '' },
    loading:      { type: Boolean,          default: false },
    emptyText:    { type: String,           default: '조회 결과 없음' },
    summaryRow:        { type: Object,  default: null },
    summaryPos:        { type: String,  default: 'bottom' },      // 'top' | 'bottom'
    summaryLabel:      { type: String,  default: '합계' },
    summaryBg:         { type: String,  default: '#1e2f4a' },     // 합계행 배경색
    summaryBorderColor:{ type: String,  default: '#2563eb' },     // 합계행 테두리색
    summaryTextColor:  { type: String,  default: '#e8f4ff' },     // 합계행 텍스트색
    striped:           { type: Boolean, default: true },           // 홀짝 줄무늬
    hoverBg:           { type: String,  default: '#dbeafe' },     // hover 배경색
    stripeBg:          { type: String,  default: '#f7f8fc' },     // 홀수행 배경색 — 표준 그리드(.bo-table 짝수행) 색과 동일
    colBorder:         { type: String,  default: '' },             // 열 구분선 (예: '1px solid #e2e8f0')
    maxHeight:         { type: String,  default: '' },             // 지정 시 이 높이로 내부 스크롤 컨테이너 생성(세로+가로 한 컨테이너) — thead sticky 도 이 기준. 미지정 시 기존처럼 overflow-x만(세로는 bo-main 기준)
  },
  emits: ['cell-click'],
  setup(props, { emit }) {
    const { computed, ref } = Vue;
    const hoveredKey = ref(null);

    /* cfWrapStyle — maxHeight 지정 시 세로+가로 한 컨테이너(단일 스크롤박스)로 통일.
       미지정 시 기존 overflow-x:auto 유지 — 별도 래퍼 div로 감싸면 가로 스크롤바가 그 래퍼의
       overflow-x:auto div(테이블 실제 높이 기준) 맨 아래로 밀려나 안 보이는 이중 스크롤 문제가 생긴다
       (2026-08-18 실제 발생 — OdOrderItemMng). maxHeight 로 한 컨테이너에서 처리해야 스크롤바가
       항상 화면에 보이는 위치(뷰포트 하단)에 고정된다.
       ⚠ position:relative 를 여기 넣지 말 것 — thead th/td[pin=left] 의 position:sticky 가
       가장 가까운 스크롤 조상을 기준으로 계산되는데, 이 wrap div 에 relative 를 얹으면 그 계산이
       깨져 좌측 고정 컬럼이 가로 스크롤을 따라 같이 움직여버린다(2026-08-18 실제 발생). */
    const cfWrapStyle = computed(() =>
      props.maxHeight ? `max-height:${props.maxHeight};overflow:auto;` : 'overflow-x:auto;');

    /* 모든 컬럼이 leaf — colGroup 쉼표 계층으로 그룹 구분 */
    const cfLeafCols = computed(() => props.columns);

    /* 각 컬럼의 colGroup 경로 배열: "a^b"→["a","b"], 없음→[] */
    const cfPaths = computed(() => props.columns.map(col =>
      col.colGroup ? col.colGroup.split('^').map(s => s.trim()).filter(Boolean) : []
    ));

    /* 최대 그룹 깊이 (0=fixed만, 1=2행헤더, 2=3행헤더) */
    const cfMaxDepth = computed(() => {
      let max = 0;
      for (const p of cfPaths.value) if (p.length > max) max = p.length;
      return max;
    });

    /* colGroup 문자열 → 해당 그룹의 첫 번째 컬럼 (그룹 스타일 정의) */
    const cfGroupFirstMap = computed(() => {
      const m = {};
      for (const col of props.columns) {
        if (col.colGroup && !m[col.colGroup]) m[col.colGroup] = col;
      }
      return m;
    });

    /* 좌측 고정 컬럼 개수 — 그룹헤더 행(row._groupHeader)을 좌측고정/스크롤 두 구간으로 쪼갤 때 colspan 기준 */
    const cfPinLeftCount = computed(() => props.columns.filter(c => c.pin === 'left').length);

    /* 좌측 고정(col.pin==='left') 컬럼의 누적 left offset(px) — 앞에서부터 누적 */
    const cfPinLeftOffset = computed(() => {
      const map = {};
      let acc = 0;
      for (const col of props.columns) {
        if (col.pin === 'left') {
          map[col.key] = acc;
          acc += (col.width || 60);
        }
      }
      return map;
    });

    /* 우측 고정(col.pin==='right') 컬럼의 누적 right offset(px) — 뒤에서부터 누적 */
    const cfPinRightOffset = computed(() => {
      const map = {};
      let acc = 0;
      for (let i = props.columns.length - 1; i >= 0; i--) {
        const col = props.columns[i];
        if (col.pin === 'right') {
          map[col.key] = acc;
          acc += (col.width || 60);
        }
      }
      return map;
    });

    /* 좌측고정 마지막 컬럼 / 우측고정 첫 컬럼 키 — 경계 그림자 자동 판단(수동 플래그 불필요) */
    const cfPinLeftLastKey = computed(() => {
      let last = null;
      for (const col of props.columns) if (col.pin === 'left') last = col.key;
      return last;
    });
    const cfPinRightFirstKey = computed(() => {
      for (const col of props.columns) if (col.pin === 'right') return col.key;
      return null;
    });

    /* pin 컬럼 sticky 포지션 스타일. z: 헤더=5 / 합계행=3 / 본문행=1 (thead sticky top:0 z:2 보다 헤더는 위, 본문은 아래)
       row 를 주면 선택행 여부를 판단해, tr 의 outline(2563eb) 이 고정 셀 아래로 가려지는 구간을
       inset box-shadow 로 보강한다(BoGrid/BoGridCrud 와 동일 처리). */
    const fnPinStyle = (col, z, row) => {
      if (!col.pin) return '';
      const selected = row != null && props.selectedKey != null && row[props.rowKey] === props.selectedKey;
      let st = 'position:sticky;z-index:' + z + ';';
      const sh = [];
      if (col.pin === 'left') {
        const off = cfPinLeftOffset.value[col.key] || 0;
        st += 'left:' + off + 'px;';
        if (selected) { if (off === 0) sh.push('inset 2px 0 0 #2563eb'); sh.push('inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb'); }
        /* 구분선은 border-right 대신 inset box-shadow — border는 position:sticky 셀에서 세로 스크롤 시
           리페인트 과정에 사라지는 렌더링 버그가 있다. inset 은 셀 자기 자신의 페인트 레이어에 포함되어
           스크롤 리페인트에 안전하고, 박스 바깥으로 번지지 않아 인접 셀에 덮여 안 보이는 문제도 없다. */
        if (col.key === cfPinLeftLastKey.value) { sh.push('inset -2px 0 0 #94a3b8', '3px 0 4px rgba(0,0,0,.08)'); }
      } else {
        st += 'right:' + (cfPinRightOffset.value[col.key] || 0) + 'px;';
        if (selected) sh.push('inset -2px 0 0 #2563eb', 'inset 0 2px 0 #2563eb', 'inset 0 -2px 0 #2563eb');
        if (col.key === cfPinRightFirstKey.value) { sh.push('inset 2px 0 0 #94a3b8', '-3px 0 4px rgba(0,0,0,.08)'); }
      }
      if (sh.length) st += 'box-shadow:' + sh.join(',') + ';';
      return st;
    };

    /* ^ 구분 문자열에서 depth 인덱스 값 추출: "a^b"[0]="a", "a^b"[1]="b", "a"[1]="a" */
    const fnLv = (val, depth) => {
      if (!val) return '';
      const parts = String(val).split('^');
      return parts[Math.min(depth, parts.length - 1)];
    };

    /* 헤더 행 배열: [ [{key,label,rowspan,colspan,thStyle},...], [...] ] */
    const cfHeaderRows = computed(() => {
      const cols = props.columns;
      const paths = cfPaths.value;
      const maxDepth = cfMaxDepth.value;
      const totalRows = maxDepth + 1;
      const result = [];

      for (let depth = 0; depth < totalRows; depth++) {
        const row = [];
        let i = 0;
        while (i < cols.length) {
          const col = cols[i];
          const path = paths[i];

          if (path.length === 0) {
            /* Fixed — depth=0에서만 rowspan=totalRows로 한 번 추가 */
            if (depth === 0) {
              row.push({
                key: col.key, label: col.label, rowspan: totalRows, colspan: 1, title: col.headerTip || '',
                thStyle: 'text-align:center;vertical-align:middle;'
                  + (col.width ? 'width:' + col.width + 'px;' : '')
                  + (col.pin ? 'background:' + (col.thBg || 'linear-gradient(180deg,#d0e6f9,#9fc6ef)') + ';color:#1a4f7d;border-bottom:2px solid #4a8ac2;' : '')
                  + fnPinStyle(col, 5)
                  + (col.thStyle || ''),
              });
            }
            i++;
          } else if (depth < path.length) {
            /* 그룹 헤더: 같은 경로 prefix를 공유하는 연속 컬럼 colspan 병합 */
            let count = 0;
            while (i + count < cols.length) {
              const np = paths[i + count];
              if (!np || np.length === 0) break;
              let same = np.length > depth;
              if (same) {
                for (let d = 0; d <= depth; d++) {
                  if ((np[d] || '') !== (path[d] || '')) { same = false; break; }
                }
              }
              if (!same) break;
              count++;
            }
            const fc = cols[i];
            const bg = fnLv(fc.colGroupBg, depth);
            const cl = fnLv(fc.colGroupColor, depth);
            const bc = fnLv(fc.colGroupBorderColor, depth) ? '#94a3b8' : '';
            /* colGroup 안에 pin:'left' 컬럼이 섞여 있으면(예: 그룹 첫 열들만 좌측 고정) 그룹 헤더도 함께 sticky —
               런의 첫 컬럼(fc)이 pin 이면 좌측 오프셋은 fc 기준, 우측 경계선은 런의 마지막 컬럼이 pin 마지막 열일 때만 */
            const lastInRun = cols[i + count - 1];
            const pinSt = fc.pin ? fnPinStyle(fc, 5) + (lastInRun && lastInRun.key === cfPinLeftLastKey.value ? 'border-right:2px solid #94a3b8;' : '') : '';
            const s = [
              'text-align:center;vertical-align:middle;padding:4px;',
              depth > 0 ? 'font-size:10px;' : '',
              bg ? 'background:' + bg + ';' : '',
              cl ? 'color:'       + cl + ';' : '',
              bc ? 'border-left:2px solid ' + bc + ';border-right:2px solid ' + bc + ';' : '',
              pinSt,
            ].join('');
            row.push({ key: '__g' + depth + '_' + i, label: path[depth], rowspan: 1, colspan: count, thStyle: s });
            i += count;
          } else if (depth === path.length) {
            /* 컬럼 라벨: 남은 행 수만큼 rowspan */
            const fc = cfGroupFirstMap.value[col.colGroup] || col;
            const bc = fnLv(fc.colGroupBorderColor, depth - 1) ? '#94a3b8' : '';
            const isFirst = i === 0 || (paths[i - 1] || []).join('^') !== path.join('^');
            const isLast  = i >= cols.length - 1 || (paths[i + 1] || []).join('^') !== path.join('^');
            const fallbackBg = fnLv(fc.colGroupBg, depth - 1);
            row.push({
              key: col.key, label: col.label, rowspan: totalRows - depth, colspan: 1, title: col.headerTip || '',
              thStyle: [
                'text-align:center;vertical-align:middle;',
                col.thBg    ? 'background:' + col.thBg + ';' : (fallbackBg ? 'background:' + fallbackBg + ';' : ''),
                col.thColor ? 'color:' + col.thColor + ';font-weight:700;' : '',
                isFirst && bc ? 'border-left:2px solid '  + bc + ';' : '',
                isLast  && bc ? 'border-right:2px solid ' + bc + ';' : '',
                col.width   ? 'min-width:' + col.width + 'px;' : '',
                fnPinStyle(col, 5),
              ].join(''),
            });
            i++;
          } else {
            /* depth > path.length: 이미 위 행에서 rowspan 처리됨 — 스킵 */
            i++;
          }
        }
        result.push(row);
      }
      return result;
    });

    /* 행 배경색 결정 (hover > selected > 줄무늬 > 기본흰색) — tr/td 양쪽에 동일하게 씀.
       td 에도 반드시 명시해야 한다 — 전역 CSS(.bo-table tbody tr:nth-child(even) td)가 td 를 직접
       타겟팅해서 그 배경이 tr 배경 위에 그대로 덮여 그려지므로, tr 에만 주면 무시된다.
       nth-child 기준 색은 summaryPos='top' 일 때 합계행이 tbody 첫 자식이 되어 홀짝이 한 칸 밀리므로
       그 규칙에 기대지 않고 idx 기준으로 직접 확정한다(합계행 유무와 무관하게 항상 동일 패턴). */
    const fnRowBg = (row, idx) => {
      const isSelected = props.selectedKey != null && row[props.rowKey] === props.selectedKey;
      const isHovered  = hoveredKey.value === row[props.rowKey];
      if (isHovered)                           return props.hoverBg;
      if (isSelected)                          return '#f0f5ff';
      if (props.striped && idx % 2 !== 0)      return props.stripeBg;
      return '#fff';
    };

    /* 리프 컬럼별 그룹 경계 정보 — 헤더의 isFirst/isLast 판단 로직을 재사용해 본문 td 에도
       그룹이 바뀌는 경계마다 구분선을 넣는다. 헤더처럼 그룹별 색을 입히면 산만해지므로
       색상 구분 없이 중립 회색(#94a3b8) 한 가지로 통일한다. */
    const cfLeafBorder = computed(() => {
      const paths = cfPaths.value;
      const bc = '#94a3b8';
      return props.columns.map((col, i) => {
        if (!col.colGroup) return null;
        const isFirst = i === 0 || (paths[i - 1] || []).join('^') !== paths[i].join('^');
        const isLast  = i >= props.columns.length - 1 || (paths[i + 1] || []).join('^') !== paths[i].join('^');
        return { isFirst, isLast, bc };
      });
    });

    /* td 스타일: tdStyle(row) 우선, 없으면 align 기본 + colBorder + 그룹경계선 + 행 배경 */
    const fnTdStyle = (col, row, idx, ci) => {
      const base = col.tdStyle ? col.tdStyle(row) : ('text-align:' + (col.align || 'center') + ';');
      const bordered = props.colBorder ? base + 'border-right:' + props.colBorder + ';' : base;
      const gb = cfLeafBorder.value[ci];
      const groupBorder = gb ? (gb.isFirst ? 'border-left:2px solid ' + gb.bc + ';' : '') + (gb.isLast ? 'border-right:2px solid ' + gb.bc + ';' : '') : '';
      return bordered + groupBorder + 'background:' + fnRowBg(row, idx) + ';' + fnPinStyle(col, 1, row);
    };

    /* 선택 행 outline + hover 커서 (배경은 fnRowBg 로 tr/td 공통 결정) */
    const fnRowStyle = (row, idx) => {
      const isSelected = props.selectedKey != null && row[props.rowKey] === props.selectedKey;
      let st = 'cursor:pointer;font-size:12px;background:' + fnRowBg(row, idx) + ';';
      if (isSelected) st += 'outline:2px solid #2563eb;outline-offset:-1px;';
      return st;
    };

    const onCellClick      = (row, idx) => emit('cell-click', { row, idx });
    /* handleBadgeClick — iconBadge 셀 전용 클릭(col.onBadgeClick 이 있을 때만). 행 선택(onCellClick)과
       분리된 별도 동작이므로 버블링 차단 — 행 클릭(cell-click)까지 같이 발동하지 않도록 함 */
    const handleBadgeClick = (e, col, row) => { e.stopPropagation(); col.onBadgeClick(row, col, e); };
    const onRowMouseEnter  = (row)       => { hoveredKey.value = row[props.rowKey]; };
    const onRowMouseLeave  = ()          => { hoveredKey.value = null; };

    /* 첫 번째 fixed 컬럼 key (합계 레이블을 여기에 표시) */
    const cfSumFirstFixedKey = computed(() => {
      const paths = cfPaths.value;
      for (let i = 0; i < props.columns.length; i++) {
        if (paths[i].length === 0) return props.columns[i].key;
      }
      return null;
    });

    /* 합계행 TD 목록: type='label'|'blank'|'fmt'|'text' + 스타일/값 사전 계산 */
    const cfSummaryTdList = computed(() => {
      if (!props.summaryRow) return [];
      const paths    = cfPaths.value;
      const firstKey = cfSumFirstFixedKey.value;
      return props.columns.map((col, i) => {
        const pinSt = fnPinStyle(col, 3) + (col.pin ? 'background:' + props.summaryBg + ';' : '');
        const tdSt = (col.tdStyle ? col.tdStyle(props.summaryRow) : ('text-align:' + (col.align || 'center') + ';')) + pinSt;
        if (col.key === firstKey) return { tdSt, type: 'label' };
        if (paths[i].length === 0) return { tdSt: 'text-align:center;' + pinSt, type: 'blank' };
        if (col.fmt) {
          const cs = col.cellStyle ? col.cellStyle(props.summaryRow) : '';
          return { tdSt, type: 'fmt', val: col.fmt(props.summaryRow, -1), cs };
        }
        const v = props.summaryRow[col.key];
        return { tdSt, type: 'text', val: v != null ? v : '' };
      });
    });

    return { cfLeafCols, cfHeaderRows, cfPinLeftCount, fnTdStyle, fnRowStyle, onCellClick, handleBadgeClick, cfSummaryTdList, hoveredKey, onRowMouseEnter, onRowMouseLeave, cfWrapStyle };
  },
  template: `
<div :style="cfWrapStyle">
  <table class="bo-table" :style="tableStyle || 'table-layout:fixed;width:100%;'">
    <colgroup>
      <col v-for="col in cfLeafCols" :key="col.key"
        :style="col.width ? 'width:' + col.width + 'px;min-width:' + col.width + 'px;' : ''">
    </colgroup>
    <thead>
      <tr v-for="(hRow, rIdx) in cfHeaderRows" :key="rIdx"
        :style="rIdx === 0 ? 'background:#f0f4f8;font-size:11px;color:#555;' : 'background:#f8faff;font-size:10px;color:#444;'">
        <th v-for="th in hRow" :key="th.key"
          :rowspan="th.rowspan" :colspan="th.colspan" :title="th.title || ''"
          :style="th.thStyle + (th.title ? 'cursor:help;' : '')">{{ th.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="loading">
        <td :colspan="cfLeafCols.length"
          style="text-align:center;padding:40px;color:#bbb;font-size:13px;">조회 중...</td>
      </tr>
      <tr v-else-if="!rows.length">
        <td :colspan="cfLeafCols.length"
          style="text-align:center;padding:40px;color:#bbb;font-size:13px;">{{ emptyText }}</td>
      </tr>
      <template v-else>
        <!-- 합계행: top 위치. border 대신 box-shadow 사용 — border-collapse 참여 시 두꺼운 border가
             바로 아래 1번 데이터행 상단 hit영역을 침범해 hover 안 먹는 문제 방지 -->
        <tr v-if="summaryRow ? summaryPos === 'top' : false" class="bo-summary-row"
          :style="'background:' + summaryBg + ';box-shadow:inset 0 -2.5px 0 0 ' + summaryBorderColor + ';'">
          <td v-for="(sc, si) in cfSummaryTdList" :key="'st' + si"
            :style="sc.tdSt + 'font-size:11px;font-weight:700;color:' + summaryTextColor + ';'">
            <span v-if="sc.type === 'label'" :style="'font-weight:900;letter-spacing:1px;color:' + summaryTextColor + ';'">{{ summaryLabel }}</span>
            <span v-else-if="sc.type === 'fmt'" :style="sc.cs ? sc.cs + ';color:' + summaryTextColor + ';' : 'color:' + summaryTextColor + ';'">{{ sc.val }}</span>
            <span v-else-if="sc.type === 'text'">{{ sc.val }}</span>
          </td>
        </tr>
        <!-- 데이터 행 — row._groupHeader:true 면 전체 폭 병합 행(#group-header 슬롯), 그 외는 일반 컬럼별 행 -->
        <template v-for="(row, idx) in rows" :key="row[rowKey]">
          <tr v-if="row._groupHeader" class="bo-group-header-row">
            <!-- 좌측고정 컬럼이 일부 있으면 그 폭만큼 sticky 셀로 분리(가로 스크롤해도 그룹헤더 내용이 안 가려짐) -->
            <template v-if="cfPinLeftCount > 0 ? (cfPinLeftCount < cfLeafCols.length) : false">
              <td :colspan="cfPinLeftCount" style="padding:0;position:sticky;left:0;z-index:4;background:#dbe5f7;box-shadow:inset -2px 0 0 #94a3b8;">
                <slot name="group-header" :row="row" :idx="idx" />
              </td>
              <td :colspan="cfLeafCols.length - cfPinLeftCount" style="padding:0;background:#dbe5f7;"></td>
            </template>
            <td v-else :colspan="cfLeafCols.length" style="padding:0;">
              <slot name="group-header" :row="row" :idx="idx" />
            </td>
          </tr>
          <tr v-else
            :style="fnRowStyle(row, idx)"
            @mouseenter="onRowMouseEnter(row)"
            @mouseleave="onRowMouseLeave()"
            @click="onCellClick(row, idx)">
            <td v-for="(col, ci) in cfLeafCols" :key="col.key"
              :title="col.titleFmt ? col.titleFmt(row) : ''"
              :style="fnTdStyle(col, row, idx, ci)">
              <slot v-if="col.slot" :name="'cell-' + col.key" :row="row" :idx="idx" />
              <template v-else-if="col.iconBadge">
                <span v-if="col.iconBadge(row)"
                  :style="'display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:10px;padding:0 4px;font-size:11px;font-weight:700;background:' + col.iconBadge(row).bg + ';color:' + col.iconBadge(row).color + ';' + (col.onBadgeClick ? 'cursor:pointer;' : '')"
                  @click="col.onBadgeClick ? handleBadgeClick($event, col, row) : null">
                  {{ col.iconBadge(row).value }}
                </span>
                <span v-else style="color:#d8d8d8;">-</span>
              </template>
              <template v-else-if="col.check">
                <span :style="col.check(row) ? 'color:' + (col.checkColor || '#16a34a') + ';font-weight:700;font-size:15px;' : 'color:#e8e8e8;font-size:15px;'">
                  {{ col.check(row) ? '✓' : '·' }}
                </span>
              </template>
              <template v-else-if="col.badge">
                <span :class="'badge ' + col.badge(row)" style="font-size:10px;">
                  {{ col.badgeLabel ? col.badgeLabel(row) : (col.fmt ? col.fmt(row, idx) : (row[col.key] || '-')) }}
                </span>
              </template>
              <template v-else>
                <span :style="col.cellStyle ? col.cellStyle(row) : ''">
                  {{ col.fmt ? col.fmt(row, idx) : (row[col.key] != null ? row[col.key] : '-') }}
                </span>
              </template>
            </td>
          </tr>
        </template>
        <!-- 합계행: bottom 위치 (default). border 대신 box-shadow — 위 top 위치와 동일 사유 -->
        <tr v-if="summaryRow ? summaryPos !== 'top' : false" class="bo-summary-row"
          :style="'background:' + summaryBg + ';box-shadow:inset 0 2.5px 0 0 ' + summaryBorderColor + ';'">
          <td v-for="(sc, si) in cfSummaryTdList" :key="'sb' + si"
            :style="sc.tdSt + 'font-size:11px;font-weight:700;color:' + summaryTextColor + ';'">
            <span v-if="sc.type === 'label'" :style="'font-weight:900;letter-spacing:1px;color:' + summaryTextColor + ';'">{{ summaryLabel }}</span>
            <span v-else-if="sc.type === 'fmt'" :style="sc.cs ? sc.cs + ';color:' + summaryTextColor + ';' : 'color:' + summaryTextColor + ';'">{{ sc.val }}</span>
            <span v-else-if="sc.type === 'text'">{{ sc.val }}</span>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</div>
  `,
};

/* ============================================================
 * BoStatRow — 수평 집계 카드 줄 컴포넌트
 *
 * Props:
 *   title       — 좌측 세로 제목 (예: '수량', '진행상태')
 *   titleBg     — 제목 배경색
 *   titleColor  — 제목 텍스트 색
 *   borderColor — 전체 테두리/구분선 색
 *   items       — 카드 배열:
 *                 { label, value, bg, color, sub, subColor, detail }
 * ============================================================ */
window.BoStatRow = {
  name: 'BoStatRow',
  props: {
    title:       { type: String, default: '' },
    titleBg:     { type: String, default: '#f5f5f5' },
    titleColor:  { type: String, default: '#555' },
    borderColor: { type: String, default: '#e0e0e0' },
    items:       { type: Array,  default: () => [] },
  },
  template: `
<div :style="'display:grid;grid-template-columns:auto repeat(' + items.length + ',1fr);gap:0;border:1px solid ' + borderColor + ';border-radius:8px;overflow:hidden;margin-bottom:5px;'">
  <div :style="'display:flex;align-items:center;justify-content:center;padding:4px 10px;background:' + titleBg + ';border-right:1px solid ' + borderColor + ';writing-mode:vertical-rl;font-size:10px;font-weight:700;color:' + titleColor + ';letter-spacing:2px;'">{{ title }}</div>
  <div v-for="(it, i) in items" :key="i"
    :style="'padding:5px ' + (items.length > 4 ? '8' : '10') + 'px;text-align:center;background:' + (it.bg || '#fff') + ';' + (i < items.length - 1 ? 'border-right:1px solid ' + borderColor + ';' : '')">
    <div :style="'font-size:10px;color:' + (it.color || '#555') + ';font-weight:600;margin-bottom:1px;'">{{ it.label }}</div>
    <div :style="'font-size:' + (items.length > 4 ? '15' : '17') + 'px;font-weight:700;color:' + (it.color || '#555') + ';'">
      {{ it.value }}<span style="font-size:10px;font-weight:400;">건</span>
    </div>
    <div v-if="it.sub" :style="'font-size:10px;color:' + (it.subColor || it.color || '#999') + ';opacity:0.8;'">{{ it.sub }}</div>
    <div v-if="it.detail" style="font-size:10px;color:#b0b0b0;">{{ it.detail }}</div>
  </div>
</div>
  `,
};

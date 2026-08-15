/* ShopJoy Front - 공통 선택/조회 팝업 (FoCmPopupModal)
 *
 * FO(사용자) 화면의 선택 팝업. BoCmPopupModal 의 FO 판으로, 같은 cm_popup 메타를 쓰되
 * /api/fo/cm/cmPopupPick/** 를 호출한다. 서버가 sys_scope 에 ^FO^ 가 있는 팝업만 허용하므로
 * 사용자·권한·메뉴 같은 관리자 전용 팝업은 여기서 열리지 않는다.
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
 *   <fo-cm-popup-modal popup-cmd="cmPopup-user-pick" popup-code="user"
 *     :on-callback="fnCallbackModal" @close="pickModal.show = false" />
 *
 *   <fo-cm-popup-modal popup-cmd="cmPopup-user-pick" popup-code="user" :multi="true"
 *     :exclude-ids="usedIds" :on-callback="fnCallbackModal" @close="pickModal.show = false" />
 *
 *   popup-cmd 가 호출 식별자 — onCallback 1번째 인자와 response.cmd 로 그대로 돌아온다.
 *   (구 modal-name 도 식별자로 계속 받는다)
 *
 * ■ 결과 받는 법 — 셋 중 편한 것을 쓰면 되고 값은 모두 같다
 *   1) @select / @toggle          — 고른 값만 (단일=행 1건, 다중=행 배열)
 *   2) :on-callback               — onCallback(popCmd, param, result)
 *                                   param 은 넘긴 호출 파라미터 { popupCode, multi? },
 *                                   result 는 위와 동일. 전문이 필요하면 3) 을 쓴다.
 *   3) @response                  — 응답정보(감싼 형태)
 *
 *      { cmd, params: { popupCode, multi? },
 *        resultType: 'object' | 'list',
 *        resultObj:  {…} | {},      // 단건일 때만 값, 아니면 빈 객체
 *        resultList: [ … ] | [] }   // 다건일 때만 값, 아니면 빈 배열
 *
 *   비는 쪽이 null 이 아니라 빈 값이라 resultList.forEach / resultObj.userId 를
 *   null 검사 없이 바로 쓸 수 있다.
 */
/* ── 선택행 표시 스타일 1회 주입 ────────────────────────────────────────
   전역 CSS 가 `.bo-table tbody tr:nth-child(even) td { background }` 로 **td** 를 칠하기 때문에
   tr 인라인 배경(:row-style)은 짝수행에서 통째로 가려진다 — 선택색이 행마다 다르게 보이던 원인.
   같은 명시도(0,2,3)로 td 를 직접 지정하고, 런타임에 늦게 주입돼 순서상 이긴다. */
if (!document.getElementById('cm-pick-sel-style')) {
  (function () {
    var st = document.createElement('style');
    st.id = 'cm-pick-sel-style';
    st.textContent = [
      '.bo-table tbody tr.cm-pick-sel td{background:#dbe8fb;color:#17356e;}',
      '.bo-table tbody tr.cm-pick-sel:hover td{background:#cbdefa;}',
      '.fo-grid-table tbody tr.cm-pick-sel td{background:#dbe8fb;color:#17356e;}',
      '.fo-grid-table tbody tr.cm-pick-sel:hover td{background:#cbdefa;}',
      /* 팝업 바탕은 옅은 회색 — 검색/목록/선택목록 흰 카드가 떠 보이게 (영역 구분).
         모달 박스 전체를 회색으로 깔아야 카드 바깥 여백까지 흰색이 남지 않는다. */
      /* BoModal/FoModal 이 .modal-box 에 background:#fff 를 **인라인**으로 박아서
         !important 없이는 절대 못 이긴다 (회색이 안 먹던 원인) */
      '.modal-box:has(.cm-pick-body){background:#eef0f4 !important;}',
      '.modal-box:has(.cm-pick-body) .modal-footer{border-top-color:#dfe3e9;}',
      '.cm-pick-body{background:transparent;}',
      '.cm-pick-body > .search-bar,.cm-pick-body .cm-pick-card{background:#fff;border:1px solid #e3e6ec;border-radius:8px;}',
      '.cm-pick-body > .search-bar{padding:8px 10px;margin-bottom:10px;}'
    ].join(' ');
    document.head.appendChild(st);
  })();
}

/* 공통팝업 등록기간 옵션 — 기본값 1년 */
const CM_PICK_RANGE_OPTS = [
  { value: '1week',  label: '1주일' },
  { value: '1month', label: '1달' },
  { value: '3months', label: '3달' },
  { value: '6months', label: '6달' },
  { value: '1year',  label: '1년' },
  { value: 'thisyear', label: '이번년' },
  { value: 'lastyear', label: '작년' },
];

window.FoCmPopupModal = {
  name: 'FoCmPopupModal',
  props: {
    popupCode:  { type: String,  required: true },                // cm_popup.popup_code
    show:       { type: Boolean, default: true },                 // 표시 여부
    title:      { type: String,  default: '' },                   // 제목 override (미지정 시 메타의 popup_nm)
    multi:      { type: Boolean, default: null },                 // 다중선택 override (미지정 시 메타의 multi_yn)
    /* 목록에서 아예 빼버릴 ID — 자기 자신을 상위로 못 고르게 하는 등 '진짜 제외' 전용.
       ⛔ '이미 선택된 항목' 을 여기 넘기지 말 것 → init-selected-ids 를 쓴다 (정책: cm.01 §4.3) */
    excludeIds: { type: Array,   default: () => ([]) },           // 하드 제외 ID (목록에 아예 안 나옴)

    excludeId:  { type: [String, Number], default: null },        // 제외할 ID 1건 (자기 자신을 상위로 못 고르게 등)
    initParam:  { type: Object,  default: () => ({}) },           // 고정 추가 검색조건
    clearable:  { type: Boolean, default: false },                // 트리 전용에서 "선택 안함" 노출
    /* 토글 모드 — 배열을 주면 각 행에 체크 상태가 표시되고, 클릭 시 모달을 닫지 않고
       toggle 을 emit 한다. 부모가 목록을 갱신해 다시 내려주면 체크 상태가 따라 바뀐다.
       (체크박스로 여러 건을 켰다 껐다 하는 기존 상품/카테고리 선택 UX) */
    selectedIds: { type: Array,  default: null },
    /** 다중 확정 모드에서 미리 체크해 둘 ID 들. selectedIds(즉시 토글) 와 달리 [선택] 로 확정한다 */
    initSelectedIds: { type: Array,  default: null },
    /* 팝업관리 미리보기용 — 켜면 조회할 때마다 api-log 를 올린다(모달에는 표시 안 함) */
    debug:       { type: Boolean, default: false },
    /* 호출 식별자. response 응답정보에 그대로 실려 돌아온다 (여러 팝업을 한 화면에서 쓸 때 분기용) */
    popupCmd:    { type: String,  default: '' },
    /* ── 화면 통합 규약 ──────────────────────────────────────────────
       modalName + onCallback(modalName, null, payload) 은 BO 전 화면이 쓰는 모달 호출 규약이다.
       팝업마다 래퍼 컴포넌트를 두지 않고 이 컴포넌트 하나로 받기 위해 여기서 직접 지원한다. */
    modalName:   { type: String,   default: '' },   // 모달 식별자
    onCallback:  { type: Function, default: null }, // 통합 콜백
    /* 호출부가 기대하는 결과 형태. 화면마다 달라서 옵션으로 맞춘다.
         row     : 행 객체 (기본)          — 대부분의 선택 모달
         id      : 행의 ID 문자열           — 표시경로처럼 ID 만 폼에 넣는 화면
         array   : 행 1건을 배열로 감싼 것  — 원래 다건 UI 였던 화면
         idArray : ID 배열                  — 카테고리 다중선택처럼 ID 목록을 받는 화면 */
    resultType:  { type: String,   default: 'row' },
  },
  emits: ['select', 'toggle', 'close', 'api-log', 'response'],
  setup(props, { emit }) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, watch } = Vue;

    const cfg = reactive({
      popupNm: '', popupPattern: 1, multiYn: 'N', pagingYn: 'Y', pageSize: 10, modalWidth: '900px',
      idField: '', nmField: '', dateField: '', hasTree: false, searchCols: [], listCols: [],
    });
    const uiState = reactive({ loading: false, ready: false, initing: false, errorMsg: '', needCond: false });

    /* 어떤 파라미터로 무엇을 조회했는지 부모에게만 알린다(팝업관리 미리보기 패널).
       모달 자체에는 표시하지 않는다 — 실제 사용 화면에서 보일 이유가 없다. */
    /** 호출부가 기대하는 형태로 결과를 변환 (resultType) */
    /* fnAddSelAlias — 팝업 종류 무관 공통 필드명 부여 (BoCmPopupModal 과 동일 원칙) */
    const fnAddSelAlias = (r) => (r == null ? r : { ...r, selId: r.id, selName: r.nm });

    const fnToPayload = (rowOrRows) => {
      const t = props.resultType;
      const one = (r) => (r == null ? null : (t === 'id' ? r.id : fnAddSelAlias(r)));
      if (Array.isArray(rowOrRows)) {
        return (t === 'id' || t === 'idArray') ? rowOrRows.map(r => r.id) : rowOrRows.map(fnAddSelAlias);
      }
      if (t === 'array')   return rowOrRows == null ? [] : [fnAddSelAlias(rowOrRows)];
      if (t === 'idArray') return rowOrRows == null ? [] : [rowOrRows.id];
      return one(rowOrRows);
    };

    /** 호출 식별자 — onCallback 1번째 인자와 response.cmd 가 같은 값이어야 한다.
        popupCmd > modalName > popupCode 순으로 쓴다.
        (modalName 만 준 화면에서 cmd 가 popupCode 로 갈려 두 값이 어긋나던 문제) */
    const fnCmd = () => props.popupCmd || props.modalName || props.popupCode;

    /** 호출 옵션 — 화면이 이 팝업을 부를 때 준 값.
        호출 정보와 응답정보가 똑같은 값을 쓰도록 한 곳에서 만든다.
        multi 가 곧 "목록으로 받는다"는 뜻이라 결과 형태를 따로 싣지 않는다. */
    const fnCallParams = () => ({
      popupCode: props.popupCode,
      /* 기본값(단일)이면 싣지 않는다 — 다중일 때만 의미 있는 값 */
      ...(cfIsMulti.value ? { multi: true } : {}),
    });

    /**
     * 응답정보 — 호출 정보(cmd·params) 위에 결과를 얹은 것.
     * params 는 호출 정보와 글자 그대로 같다(같은 이름이 다른 뜻이 되지 않도록).
     *
     * resultObj 와 resultList 는 동시에 채우지 않는다. 단건이면 resultObj 만,
     * 다건이면 resultList 만 값을 갖고, resultType 이 object | list 로 그걸 알려준다.
     * 비는 쪽은 null 이 아니라 빈 값이라 받는 쪽이 null 검사 없이 바로 쓸 수 있다.
     */
    const fnBuildResponse = (payload) => {
      const isList = Array.isArray(payload);
      return {
        cmd: fnCmd(),
        params: fnCallParams(),
        resultType: isList ? 'list' : 'object',   /* 값이 resultObj 에 있나 resultList 에 있나 */
        resultObj:  isList ? {} : (payload == null ? {} : payload),
        resultList: isList ? payload : [],
      };
    };

    /**
     * 결과 발행 — emit / onCallback / response 를 한 곳에서 처리한다.
     * 세 경로가 모두 같은 값을 보도록 여기서만 만든다.
     *
     * onCallback 규약: (popCmd, param, result)
     *   - popCmd : 호출 식별자 (popup-cmd)
     *   - param  : 호출할 때 넘긴 파라미터 { popupCode, multi? }  ← 결과가 아니라 요청값
     *   - result : 고른 값 (단건=행 / 다중=행 배열 / resultType 에 따라 ID)
     *   전문(cmd·params·resultType·resultObj·resultList)이 필요하면 @response 로 받는다.
     *
     * @param evName 화면에 올릴 이벤트명 (select | toggle)
     */
    const fnEmitResult = (evName, rowOrRows) => {
      const payload = fnToPayload(rowOrRows);
      const response = fnBuildResponse(payload);
      emit(evName, payload);
      if (props.onCallback) props.onCallback(fnCmd(), fnCallParams(), payload);
      emit('response', response);
      return payload;
    };

    /* 호출 로그 — 위 호출 옵션만 올린다.
       URL·쿼리 파라미터는 popupCode 로 정해지는 값이라 싣지 않는다. */
    const fnLog = () => {
      if (!props.debug) return;
      emit('api-log', { cmd: fnCmd(), params: fnCallParams() });
    };

    const codeMap = reactive({});       /* codeGrp → [{codeValue, codeLabel}] (CODE 유형 항목용) */
    const rows = reactive([]);          /* 목록 */
    const treeRows = reactive([]);      /* 트리 원본(평면) */
    const picked = reactive([]);        /* 패턴3 / 다중선택 누적 */
    const expanded = reactive({});      /* 트리 펼침 상태 */

    /* 검색대상(searchFields)·등록기간은 모든 공통팝업에 항상 노출한다.
       기본값: 검색대상 = ID + 표시명 / 등록기간 = 최근 1년 (fnApplySearchDefaults 에서 채움) */
    const searchParam = reactive({ searchValue: '', searchFields: '', dateRange: '1year', dateStart: '', dateEnd: '' });
    const gridPager = reactive({
      pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000],
    });
    const treeState = reactive({ selectedId: null });

    /* cfSiteId — coUtil 이 사이트 ID 해석의 단일 기준 (localStorage 'modu-fo-sy-siteId' → FO_SITE_NO 매핑).
       예전엔 window.FO_SITE_ID || window.foCommonFilter?.siteId 를 봤는데 둘 다 어디에도
       정의되지 않은 이름이라 항상 '' 였다. 그 빈 값이 팝업 설정·목록·트리 3개 API 로 나갔다. */
    const cfSiteId = computed(() => coUtil.cofApiInfo.getCurrentSiteId() || '');
    /* 다중 여부는 호출부(:multi)가 최우선, 미지정 시 메타의 기본값 */
    /* 다중 여부는 호출부(:multi)가 최우선, 미지정 시 메타의 기본값 */
    const cfIsMulti = computed(() => props.multi !== null ? props.multi : cfg.multiYn === 'Y');
    const cfTitle = computed(() => props.title || cfg.popupNm || '선택');
    /* 모달 헤더용 — 공통팝업임을 알리는 아이콘을 붙인다.
       cfTitle 은 트리 카드 라벨(📂 …)에도 쓰이므로 섞지 않고 따로 만든다. */
    const cfHeadTitle = computed(() => '🧩 ' + cfTitle.value);
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
    /* 체크형(토글·다중) — 행에 체크 표시가 붙고 어느 셀을 눌러도 담기/빼기가 된다 */
    const cfIsCheckMode = computed(() => cfIsToggle.value || cfHasPickList.value);

    /* 제외 ID — 부모가 넘긴 것만. 이번에 담은 항목은 목록에 그대로 두어
       선택 상태를 보여주고 다시 누르면 해제되게 한다. */
    const cfExcludeIds = computed(() => {
      const ids = (props.excludeIds || []).map(String);
      if (props.excludeId != null && props.excludeId !== '') ids.push(String(props.excludeId));
      return [...new Set(ids)];
    });

    /* 이번에 담은 항목 (행 강조·체크 표시·토글 판정용) */
    const cfPickedSet = computed(() => new Set(picked.map(p => String(p.id))));
    /** 선택된 행인가 — 다중은 담은 목록, 토글 모드는 부모가 준 selectedIds 기준 */
    const fnIsPicked = (row) => {
      if (!row || row.id == null) return false;
      const key = String(row.id);
      return cfIsToggle.value ? cfSelectedSet.value.has(key) : cfPickedSet.value.has(key);
    };
    /** 행 전체 클릭 (체크형에서만 연결) — FoGrid 의 row-click prop */
    const fnRowClick = (row) => handleGridCellAction('pickGrid-cellClick', '_row', row, {});

    /** 선택된 행 배경 강조 */
    /** fnAllPickedOnPage — 현재 페이지 행이 전부 담겼는가 (헤더 토글 아이콘 표시용) */
    const fnAllPickedOnPage = () => {
      const list = rows.filter(r => r ? (r.id != null) : false);
      return list.length > 0 ? list.every(r => fnIsPicked(r)) : false;
    };

    /** handleToggleAllOnPage — 헤더 아이콘 클릭: 현재 페이지 전체 담기 / 전체 빼기.
        전부 담긴 상태면 빼고, 하나라도 빠져 있으면 모두 담는다. */
    const handleToggleAllOnPage = () => {
      const list = rows.filter(r => r ? (r.id != null) : false);
      if (!list.length) return;
      const allOn = fnAllPickedOnPage();
      list.forEach((r) => {
        const on = fnIsPicked(r);
        if (allOn ? !on : on) return;             /* 이미 목표 상태면 건너뛴다 */
        /* 토글 모드는 부모가 체크 상태를 소유하므로 행 단위로 알린다 */
        if (cfIsToggle.value) fnEmitResult('toggle', r);
        else handlePickRow(r);
      });
    };

    /** 선택행 표시 — 색은 한 가지로만. 신규/기존을 색으로 나누면 목록이 얼룩덜룩해진다.
        · class : 일반 td 를 칠한다 (전역 줄무늬가 td 를 칠하므로 tr 인라인으로는 안 먹는다)
        · style : 좌측 고정(번호) 셀은 BoGrid 의 fnPinBg 가 이 문자열에서 background 를 읽어
                  인라인으로 칠한다 → 둘 다 줘야 고정셀까지 같은 색이 된다 */
    const fnRowClass = (row) => (fnIsPicked(row) ? 'cm-pick-sel' : '');
    const fnRowStyle = (row) => (fnIsPicked(row) ? 'background:#dbe8fb;' : '');

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
          /* 헤더는 '선택' 라벨 대신 전체선택 토글 아이콘 — 현재 페이지 행을 한 번에 담고/뺀다 */
          key: '_checked', label: fnAllPickedOnPage() ? '☑' : '☐', align: 'center', style: 'width:56px;',
          headClick: () => handleToggleAllOnPage(),
          fmt: (v, row) => fnIsPicked(row) ? '☑' : '☐',
        });
      }
      return cols;
    });

    /* 조회영역 컬럼 = 통합검색(LIKE 항목 OR) + EQ 항목은 개별 조건.
       EQ 항목이 CODE 유형이면 공통코드 드롭다운으로 렌더한다. */
    /* cfSearchFieldOpts — 검색대상 옵션. ID·표시명은 cm_popup_item 에 없어도 항상 넣는다
       (백엔드도 id_field/nm_field 는 화이트리스트에 포함해 허용한다). */
    const cfSearchFieldOpts = computed(() => {
      const out = [];
      const seen = new Set();
      const add = (v, l) => { if (v ? !seen.has(v) : false) { seen.add(v); out.push({ value: v, label: l || v }); } };
      add(cfg.idField, 'ID');
      add(cfg.nmField, '이름');
      (cfg.searchCols || []).forEach(c => { if (c.searchType !== 'EQ') add(c.field, c.label); });
      return out;
    });

    const cfSearchColumns = computed(() => {
      const out = [
        { key: 'searchFields', type: 'multiCheck', label: '검색대상',
          options: () => cfSearchFieldOpts.value, placeholder: '검색대상 전체', allLabel: '전체 선택' },
        { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력' },
      ];
      /* 등록기간 — cm_popup.date_field 가 있는 팝업만 (없으면 서버가 무시하므로 UI 도 숨긴다) */
      if (cfg.dateField) {
        out.push({ key: 'dateRange', type: 'dateRange', label: '등록기간',
          typeKey: '_dateType', startKey: 'dateStart', endKey: 'dateEnd',
          rangeOptions: () => CM_PICK_RANGE_OPTS,
          onRangeChange: () => fnApplyRange() });
      }
      (cfg.searchCols || []).forEach(c => {
        if (c.searchType !== 'EQ') return;
        if (c.type === 'CODE') {
          out.push({
            key: c.field, label: c.label + (c.required ? ' *' : ''), type: 'select',
            nullLabel: c.label + ' 전체',
            options: () => (codeMap[c.codeGrp] || []).map(o => ({ value: o.codeValue, label: o.codeLabel })),
          });
        } else {
          out.push({ key: c.field, label: c.label + (c.required ? ' *' : ''), type: 'text', placeholder: c.label });
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
      if (cmd === 'modal-close')       return handleClose();
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
        fnEmitResult('select', empty);
        return handleClose();
      }
      if (cmd === 'tree-toggle')     { expanded[param] = !expanded[param]; return; }
      if (cmd === 'tree-expandAll')  { cfTreeVisible.value; treeRows.forEach(n => { expanded[String(n.id)] = true; }); return; }
      if (cmd === 'tree-collapseAll'){ Object.keys(expanded).forEach(k => { expanded[k] = false; }); return; }
      if (cmd === 'row-pick')        return handlePickRow(param);
      /* 토글 모드 — 닫지 않고 알린다. 체크 상태는 부모가 selectedIds 로 다시 내려준다 */
      if (cmd === 'row-toggle')      return fnEmitResult('toggle', param);
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
    /** 프리체크 — initSelectedIds 를 선택 목록에 채운다. 트리/목록에 없는 ID 는 ID 를 그대로 표시명으로 쓴다 */
    const fnSeedPicked = () => {
      if (!cfHasPickList.value) return;
      const seedIds = Array.isArray(props.initSelectedIds) ? props.initSelectedIds : null;
      if (!seedIds) return;
      picked.splice(0, picked.length);
      const pool = [...treeRows, ...rows];
      seedIds.forEach((id) => {
        const hit = pool.find(r => String(r.id) === String(id));
        picked.push(hit || { id, nm: String(id) });
      });
    };

    const fnInit = async () => {
      if (uiState.ready || uiState.initing) return;
      uiState.initing = true;
      try {
        const cfgParam = { siteId: cfSiteId.value };
        const res = await foApiSvc.cmPopupPick.getConfig(props.popupCode, cfgParam, '선택팝업', '구성조회');
        const d = res.data?.data || {};
        fnLog();
        Object.assign(cfg, {
          popupNm: d.popupNm || '', popupPattern: d.popupPattern || 1,
          multiYn: d.multiYn || 'N', pagingYn: d.pagingYn || 'Y', pageSize: d.pageSize || 10,
          modalWidth: d.modalWidth || '900px', idField: d.idField || 'id',
          nmField: d.nmField || 'nm', dateField: d.dateField || '', hasTree: !!d.hasTree,
          searchCols: d.searchCols || [], listCols: d.listCols || [],
        });
        gridPager.pageSize = cfg.pageSize;
        await handleSearchCodes();
        fnApplySearchDefaults();   /* 검색대상 = ID+이름 체크, 등록기간 = 1년 */
        uiState.ready = true;
        if (cfHasTree.value) await handleSearchTree();
        /* 필수 조회조건이 비어 있으면 자동 조회하지 않는다 — 조건 입력 후 [조회] */
        if (cfHasList.value) { if (fnMissingRequired().length) { uiState.needCond = true; } else { await handleSearchList(); } }
      } catch (err) {
        uiState.errorMsg = err.response?.data?.message || err.message || '팝업 구성을 불러오지 못했습니다.';
      } finally {
        uiState.initing = false;
      }
    };

    onMounted(async () => { if (props.show) { await fnInit(); fnSeedPicked(); } });
    watch(() => props.show, async (v) => { if (v) { await fnInit(); fnSeedPicked(); } });

    /* ##### [04] 내장 사용 함수 #################################################### */

    /* fnApplyRange — 기간 옵션 → dateStart/dateEnd 계산 */
    const fnApplyRange = () => {
      const u = window.boUtil || window.foUtil;
      if (u ? u.bofApplyDateRange : false) {
        u.bofApplyDateRange(searchParam, searchParam.dateRange, 'dateStart', 'dateEnd');
      }
    };

    /* fnApplySearchDefaults — 팝업 구성을 받은 뒤 기본 검색조건을 채운다.
       검색대상 = ID + 표시명 체크 / 등록기간 = 최근 1년 */
    const fnApplySearchDefaults = () => {
      const ids = [cfg.idField, cfg.nmField].filter(Boolean);
      searchParam.searchFields = ids.join('^');
      searchParam.dateRange = '1year';
      fnApplyRange();
    };

    const fnResetSearch = () => {
      Object.keys(searchParam).forEach(k => { searchParam[k] = ''; });
      searchParam.searchValue = '';
      fnApplySearchDefaults();
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

    /** 값이 비어 있는 필수 조회항목 라벨 목록 (세션 자동값은 서버가 채우므로 제외) */
    const fnMissingRequired = () => (cfg.searchCols || [])
      .filter(c => c.required)
      .filter(c => !searchParam[c.field])
      .map(c => c.label);

    const handleSearchList = async () => {
      if (!uiState.ready) return;
      const miss = fnMissingRequired();
      if (miss.length) {
        uiState.needCond = true;
        return window.foApp?.showToast(miss.join(", ") + " 을(를) 입력해주세요.", "error");
      }
      uiState.needCond = false;
      uiState.loading = true;
      try {
        const listParam = fnBuildParam();
        const res = await foApiSvc.cmPopupPick.getPage(props.popupCode, listParam, '선택팝업', '조회');
        const d = res.data?.data || {};
        fnLog();
        rows.splice(0, rows.length, ...(d.pageList || []));
        gridPager.pageTotalCount = d.pageTotalCount || 0;
        gridPager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        window.foApp?.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    const handleSearchTree = async () => {
      try {
        /* 고정 필터(initParam)는 트리에도 걸어야 목록과 범위가 어긋나지 않는다
           (예: 표시경로 팝업의 bizCd — 해당 업무의 경로만 보여야 한다) */
        const treeParam = { siteId: cfSiteId.value, ...(props.initParam || {}) };
        const res = await foApiSvc.cmPopupPick.getTree(props.popupCode, treeParam, '선택팝업', '트리조회');
        const list = res.data?.data || [];
        fnLog();
        treeRows.splice(0, treeRows.length, ...list);
        /* 최상위는 기본 펼침 */
        treeRows.filter(n => n.parentId == null || n.parentId === '')
          .forEach(n => { expanded[String(n.id)] = true; });
      } catch (err) {
        window.foApp?.showToast(err.response?.data?.message || err.message || '트리 조회 오류', 'error', 0);
      }
    };

    /* 행 선택 — 단일이면 즉시 확정, 다중이면 선택목록에 누적 */
    const handlePickRow = (row) => {
      if (!row) return;
      if (!cfIsMulti.value) {
        fnEmitResult('select', row);
        handleClose();
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

    /** 닫기 — 기존 규약대로 onCallback(modalName, null, null) 도 함께 알린다 */
    const handleClose = () => {
      emit('close');
      if (props.onCallback) props.onCallback(fnCmd(), null, null);
    };

    const handleConfirm = () => {
      if (cfHasPickList.value) {
        /* 프리체크 모드(init-selected-ids)는 "기존 선택을 편집" 하는 것이라
           전부 해제한 뒤 확정 = 전부 비우기 로 봐야 한다. 그 외(빈 상태에서 담기)만 막는다. */
        if (!picked.length && !Array.isArray(props.initSelectedIds)) {
          return window.foApp?.showToast('선택된 항목이 없습니다.', 'error');
        }
        const rows = picked.slice();
        fnEmitResult('select', rows);
      }
      handleClose();
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
      cfg, uiState, rows, picked, searchParam, gridPager, treeState, fnMissingRequired,
      cfIsMulti, cfTitle, cfHeadTitle, cfHasTree, cfTreeOnly, cfHasList, cfHasPickList, cfHasPager, cfIsToggle, cfSelectedSet,
      cfGridColumns, cfSearchColumns, cfTreeVisible, cfTreeLayoutStyle, cfTreeCardStyle,
      cfPickedSet, cfIsCheckMode, fnIsPicked, fnRowStyle, fnRowClass, fnAllPickedOnPage, handleToggleAllOnPage, fnRowClick,
      fnTreeArrow, fnTreeNodeIcon, fnTreeNodeStyle, handleBtnAction, handleSelectAction, handleGridCellAction,
    };
  },
  template: /* html */`
<fo-modal :show="show" :title="cfHeadTitle" :width="cfg.modalWidth" max-width="96vw"
  min-height="560px"
  @close="handleBtnAction('modal-close')">
  <div v-if="uiState.errorMsg" style="padding:24px;text-align:center;color:#dc2626;">
    {{ uiState.errorMsg }}
  </div>
  <template v-else>
  <div class="cm-pick-body">
    <!-- 1단 조회영역 -->
    <fo-search-area :loading="uiState.loading" :columns="cfSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />

    <!-- 2단 트리 / 목록 (패턴3=트리 전용이면 목록 없이 트리만 전체 폭) -->
    <div :style="cfTreeLayoutStyle">
      <div v-if="cfHasTree" class="card cm-pick-card" :style="cfTreeCardStyle">
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
        <div v-for="n in cfTreeVisible" :key="n.id" :style="fnTreeNodeStyle(n)">
          <span style="width:12px;flex-shrink:0;color:#94a3b8;font-size:10px;cursor:pointer;"
            @click="handleSelectAction('tree-toggle', String(n.id))">
            {{ fnTreeArrow(n) }}
          </span>
          <span :style="n._hasKids ? 'width:16px;flex-shrink:0;cursor:pointer;' : 'width:16px;flex-shrink:0;'"
            @click="n._hasKids ? handleSelectAction('tree-toggle', String(n.id)) : null">
            {{ fnTreeNodeIcon(n) }}
          </span>
          <span style="flex:1;cursor:pointer;" @click="handleSelectAction('tree-select', n.id)">{{ n.nm }}</span>
          <span v-if="fnIsPicked(n)" style="margin-left:auto;color:#2563eb;font-weight:700;">✓</span>
        </div>
        <div v-if="!cfTreeVisible.length" style="padding:12px;text-align:center;color:#aaa;font-size:12px;">
          표시할 항목이 없습니다.
        </div>
      </div>

      <div v-if="cfHasList" class="cm-pick-card" style="padding:8px;">
        <!-- 체크형(토글·다중)은 어느 셀을 눌러도 담기/빼기가 되어야 하므로 row-clickable 필요
             (BoGrid 는 이 옵션이 없으면 번호·링크 셀에서만 cell-click 을 올린다) -->
        <!-- FoGrid 는 grid-id/row-clickable 이 없고 row-click 을 prop 으로 받는다.
             체크형(토글·다중)일 때만 행 전체 클릭을 열어 준다. -->
        <fo-grid :columns="cfGridColumns" :rows="rows" row-key="id" :loading="uiState.loading"
          :pager="gridPager" :empty-text="uiState.needCond ? '필수 조회조건을 입력하고 [조회] 를 누르세요.' : '조회 결과가 없습니다.'" :row-style="fnRowStyle" :row-class="fnRowClass"
          table-max-height="46vh"
          :row-click="cfIsCheckMode ? fnRowClick : null"
          @cell-click="e => handleGridCellAction('pickGrid-cellClick', e.colKey, e.row, e)" />
        <fo-pager v-if="cfHasPager" :pager="gridPager"
          :on-set-page="n => handleBtnAction('grid-setPage', n)"
          :on-size-change="() => handleBtnAction('grid-sizeChange')" />
      </div>
    </div>

    <!-- 3단 선택목록 -->
    <div v-if="cfHasPickList" class="card cm-pick-card" style="padding:10px;margin-top:10px;">
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
  </div><!-- /cm-pick-body -->
  </template>

  <template #footer>
    <button v-if="cfHasPickList" class="btn btn_select" @click="handleBtnAction('modal-confirm')">
      선택 ({{ picked.length }})
    </button>
    <button class="btn btn_close" @click="handleBtnAction('modal-close')">닫기</button>
  </template>
</fo-modal>
`,
};

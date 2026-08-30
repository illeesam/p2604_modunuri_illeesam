# codes Reactive 패턴 (uiState와 함께 통합 상태관리)

## select / multiCheck 옵션 소스 정책 ⭐⭐ (2026-08-18 확정)

**원칙: 화면의 모든 `<select>` / `type: 'multiCheck'` 옵션은 공통코드(`sy_code`)에 등록하고
`codeStore.saLoadCodes([...])` → `codes.xxx = codeStore.sgGetGrpCodes('XXX_CD')` 로 불러와 쓴다.**
값 목록을 화면 JS 안에 배열로 손으로 적어두지 않는다 — 값이 늘거나 라벨이 바뀔 때 공통코드관리
화면 한 곳만 고치면 전 화면에 반영되게 하기 위함이다.

```js
// ❌ 금지 — 업무 상태/유형 값을 화면에 하드코딩
options: [{ value: 'CANCEL', label: '취소' }, { value: 'RETURN', label: '반품' }]
const STS_CLM_TYPE = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };  // 뱃지 라벨용이라도 금지

// ✅ 올바름 — 공통코드에서 로드
await codeStore.saLoadCodes(['CLAIM_TYPE_CD'], { compNm: 'OdOrderItemMng' });
codes.claim_types = codeStore.sgGetGrpCodes('CLAIM_TYPE_CD');
// ...
options: () => codes.claim_types
```

### 유일한 예외 — `검색대상`(searchType) 필드명 선택자

검색영역의 `검색대상`(예: `{ key: 'searchType', type: 'multiCheck', options: [{ value: 'prodNm', label: '상품명' }, ...] }`)
은 **업무 코드값이 아니라 "어느 DB/엔티티 필드를 LIKE 검색할지" 고르는 화면 구조 선택지**라 공통코드
등록 대상이 아니다 — 화면마다 검색 가능한 필드 조합이 다르고, 그 값 자체가 코드가 아니라 필드명이기
때문이다. 이 필드만 하드코딩 배열이 허용된다. 그 외 업무 상태/유형/구분 코드값은 예외 없이 공통코드.

### 점검 방법

```bash
grep -n "options:\s*\[" pages/bo/**/*.js pages/fo/**/*.js
```
결과 중 `key: 'searchType'` 가 아닌 항목은 전부 공통코드 전환 대상.

### 검색영역 select/multiCheck 첫 항목(전체/미지정) 라벨은 짧게 ⭐ (2026-08-18, 전 화면 공통)

검색영역 select 의 `nullLabel` / multiCheck 의 `placeholder` — 즉 "아무 것도 고르지 않았을 때" 보여줄
텍스트는 **`전체` / `선택` / `없음` 중 하나만 쓴다.** 필드명을 다시 붙인 부연문구(`"주문항목상태 전체"`,
`"배송사 전체"`, `"검색대상 전체"`)는 금지 — 바로 왼쪽에 이미 필드 라벨이 붙어 있어 중복이다.

```js
// ❌ 금지
{ key: 'dlivCourierCd', type: 'select', label: '배송사', nullLabel: '배송사 전체' }
{ key: 'orderItemStatusCds', type: 'multiCheck', label: '주문항목상태', placeholder: '주문항목상태 전체' }

// ✅ 올바름 — 라벨이 이미 왼쪽에 있으니 값 쪽은 짧게
{ key: 'dlivCourierCd', type: 'select', label: '배송사', nullLabel: '전체' }
{ key: 'orderItemStatusCds', type: 'multiCheck', label: '주문항목상태', placeholder: '전체' }
```

multiCheck 팝오버 안의 "전체 선택" 토글 행(`allLabel`)은 이 규칙 대상이 아니다(선택/해제 동작을 설명하는
문구라 별개). 전 화면 소급 적용은 별도 작업으로 진행 — 우선 새로 작성/수정하는 화면부터 적용한다.

### Dtl(상세등록/수정) 화면 필수입력 최소 1개 ⭐ (2026-08-18, 전 화면 공통)

모든 상세 등록/수정 화면(`baseFormColumns` 등)은 **`required: true` 필드가 최소 1개 있어야 한다** —
대표적으로 제목/명칭류. 저장 시 실제로 막아야 하므로 시각적 `*` 표시(컬럼 정의의 `required: true`)와
**저장 검증(Yup 스키마 또는 `handleSave` 초입의 명시적 가드) 둘 다** 갖춰야 한다 — 표시만 하고
막지 않으면 정책 위반.

- 필수 필드는 **가급적 폼 앞단**(첫 그룹, 상단 몇 줄 안)에 배치한다 — 사용자가 뭘 먼저 채워야 하는지
  바로 보이게 하기 위함.
- **예외**: 편집 가능한 필드 자체가 화면 후반부에만 있는 구조(예: 상단이 전부 `type:'readonly'` 스냅샷
  정보이고 편집 가능한 필드가 하단 한둘뿐인 화면)는 앞단 배치를 물리적으로 만족할 수 없다 — 이 경우는
  예외로 두고 위치보다 "필수 검증 자체가 있는지"를 우선한다.
- **예외**: 모든 필드가 `readonly`인 순수 이력/로그 조회 화면(저장 기능 없음)은 대상이 아니다.
- **예외**: 화면의 존재 목적이 "기존 값을 선택적으로 비워도 되는 메타데이터 정정"인 경우(예: 고아
  데이터 연결 해제) 억지로 필수를 걸지 않는다 — 정책 목적과 충돌하면 필수화하지 않는다.

---

## 코드 지연 로딩 아키텍처 ⭐⭐ (2026-07-30 전환)

**요약: 코드는 앱 부팅 때 전량 적재하지 않는다. 화면이 로드될 때 그 화면이 쓰는 코드그룹만 받아 스토어에 누적한다.**

### 왜 바꿨나

이전에는 로그인 직후 `getInitData(names=ALL)` 응답에 `syCodes` 로 133종 전량(1,000행 이상)이 실려 왔고,
각 화면은 "스토어에 이미 코드가 있다" 는 전제로 `sgGetGrpCodes()` 만 읽었다. 문제:

- 첫 화면 진입 전에 쓰지도 않을 코드까지 전부 받는다 (부팅 페이로드 비대)
- `window.open` 독립 팝업 화면은 부팅 시퀀스를 타지 않아 스토어가 빈 상태로 시작한다
- 코드를 부팅에만 실으면, 세션 중 공통코드를 수정해도 반영 경로가 없다

### 구성 요소

| 계층 | 구현 | 역할 |
|---|---|---|
| 배치 API | `GET /api/co/sy/code/groups?codeGrps=A,B,C` (`CoSyCodeController`) | 요청한 코드그룹만 한 번에 반환 |
| 서비스 | `coApiSvc.syCode.getGrpsCodes(codeGrps, uiNm, cmdNm)` | 배열/단건 모두 허용, `,` 조립 |
| 스토어 | `codeStore.saLoadCodes(grps)` | **그룹 단위 캐시 + 동시요청 dedupe + 실패 캐싱** |
| 스토어 | `codeStore.saInvalidateGrps(grps)` | 특정 창의 코드그룹 캐시 폐기 (저수준) |
| 유틸 | `coUtil.cofInvalidateCodeGrps(grps)` | **창 경계를 넘는 무효화** — 화면에서는 이것만 쓴다 |
| 화면 | `fnLoadCodes()` → `await saLoadCodes([...])` | 화면이 쓰는 그룹만 명시 |
| 화면 | `initPage()` | **코드 응답 도착 후 초기 조회 시작** |

`saLoadCodes` 는 세 가지를 함께 처리한다 — 이미 캐시에 있는 그룹은 요청에서 빠지고(캐시 히트),
같은 그룹을 동시에 요구하는 화면들은 한 번의 요청을 공유하고(`_svInflight` dedupe),
실패한 그룹도 재요청 폭주를 막기 위해 기록된다.

### 화면 표준 형태

```javascript
/* fnLoadCodes — 이 화면이 쓰는 코드그룹만 지연 로딩 */
const fnLoadCodes = async () => {
  const codeStore = window.sfGetBoCodeStore();
  /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
  await codeStore.saLoadCodes(['PRODUCT_STATUS', 'USE_YN', 'DATE_RANGE_OPT']);
  codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
  codes.use_yn           = codeStore.sgGetGrpCodes('USE_YN');
  codes.date_range_opts  = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
};

/* initPage — 화면 로드 시퀀스.
   코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
   빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
const initPage = async () => {
  await fnLoadCodes();
  await handleSearchList('DEFAULT');
};
onMounted(initPage);
```

**진입점은 `onMounted(initPage)` 한 형태로 통일한다.** `onMounted(async () => { ... })` 인라인 본문은
쓰지 않는다 — 로드 순서를 한 함수 안에서 읽을 수 있게 하고, 진입점이 파일마다 다른 모양이 되는 것을 막는다.
(예외: `components/**` 의 공용 위젯·모달은 마운트 훅이 렌더러·옵저버 등록이라 '화면 로드 시퀀스' 가 아니므로 그대로 둔다.)

### 폐기된 장치 (2026-07-30)

| 폐기 | 이유 |
|---|---|
| `coUtil.cofUseAppCodeReady(uiState, fnLoadCodes)` | `initPage` 가 마운트 시 무조건 `await fnLoadCodes()` 를 실행하므로 게이트가 중복. 오히려 `if (isAppReady.value)` 조건 때문에 앱 초기화가 늦으면 코드를 건너뛰고 조회가 먼저 나갔다 |
| `uiState.isPageCodeLoad` | 위 게이트의 재진입 방지 플래그였다. 게이트가 사라져 소비처가 없다 (템플릿 사용 0건 확인 후 제거) |

`coUtil` 에서 함수 자체를 삭제했다. 되살리지 말 것 — 코드 적재 책임은 `fnLoadCodes` 안의
`saLoadCodes` 가, 호출 시점은 `initPage` 가 진다.

### 스토어 적재 시점 필드명 정규화 (필수)

스토어 getter·헬퍼(28곳)는 `codeVal` / `codeNm` / `codeSortOrd` 를 읽는다. 반면 배치 API
`/co/sy/code/groups` 는 표준 DTO 형태인 `codeValue` / `codeLabel` / `sortOrd` 로 응답한다.
그래서 스토어는 **적재 시점에** `_fnNormCodeRows()` 로 두 이름을 모두 갖도록 정규화한다
(`_saFetchGrps` 와 `saSetCodes` 양쪽. 원본 키는 보존한다).

정규화를 빼면 `sgGetGrpCodes` 가 `[{}, {}, {}]` 를 반환해 **모든 코드 select 의 라벨이 빈칸**이
된다. 옵션 *개수*는 정상이라 눈에 잘 띄지 않는다 — 실측에서 렌더된 옵션 50개 중 40개가 공백이었다.

> ⚠️ **검증 방법 주의**: `select.options.length > 1` 로 "채워졌다" 고 판정하면 **빈 라벨
> 옵션도 통과한다.** 반드시 `[...s.options].filter(o => !o.text.trim()).length === 0` 으로 검증할 것.

### 금지 사항

- ❌ `fnLoadCodes()` 를 `await` 없이 호출 — 코드 없는 상태로 첫 조회가 나간다
- ❌ `cofUseAppCodeReady` / `isPageCodeLoad` 부활 — 2026-07-30 폐기. `initPage` 가 그 역할을 대신한다
- ❌ 화면 자체의 `watch(() => codeStore.svCodes.length, ...)` 로 로드 시점 감시 — 지연 로딩에서는
      시작값이 0 이라 조건이 참이 되지 않아 코드를 영원히 못 받는다
- ❌ `onMounted(async () => { ... })` 인라인 본문 — `initPage` 로 빼고 `onMounted(initPage)` 로 바인딩
- ❌ 코드를 localStorage 에 적재 — 같은 브라우저의 탭·창이 공유하므로 서로 간섭한다 (메모리 전용 유지)
- ❌ `getInitData` 의 `ALL` 에 `syCodes` 재추가 — `names=syCodes` 로 명시 요청하는 경로만 남긴다

### 코드 변경 후 무효화

공통코드를 바꾸는 화면은 저장 직후 해당 그룹 캐시를 비운다. 비우지 않으면 같은 세션의 다른 화면이 옛 값을 계속 쓴다.

```javascript
await boApi.post('/bo/sy/code/save-list', saveRows, coUtil.cofApiHdr('공통코드관리', '저장'));
coUtil.cofInvalidateCodeGrps([...new Set(saveRows.map(r => r.codeGrp).filter(Boolean))]);
```

적용 지점: `SyCodeMng`(코드 저장 / 순서변경 / 그룹 저장), `PdOptCodeMng`(저장 / 순서변경 — 같은 `sy_code` 테이블).

**⚠️ `store.saInvalidateGrps()` 를 화면에서 직접 부르지 말 것.** 그것은 *호출한 창의* 스토어만 비운다.
상품옵션코드관리는 `bo.html` 안의 **iframe** 으로 열리고 그 문서에도 `boCodeStore.js` 가 로드돼
있어 자기만의 스토어 인스턴스를 갖는다 — 직접 호출하면 정작 목록·상세를 그리는 부모 창의
캐시는 그대로 남아 옛 값이 계속 보인다. `coUtil.cofInvalidateCodeGrps` 는
현재 창 + `parent` + `top` + `opener` 를 모두 시도한다(동일 출처만, 교차 출처는 조용히 건너뜀).

---

## 개요

> ⚠️ **아래 §개요 ~ §예제 는 이력용 스냅샷이다 (2026-07-30 이전).**
> 여기 나오는 `isAppReady` / `cofUseAppCodeReady` / `uiState.isPageCodeLoad` 는 **모두 폐기·삭제됐다.**
> 그대로 복사하면 동작하지 않는다. 현재 표준은 위 §코드 지연 로딩 아키텍처 (`fnLoadCodes` + `initPage`) 를 따른다.
> 명명 규칙·getter·Store 안전성 항목은 그대로 유효하다.

**모든 화면**의 코드 마스터 데이터를 다음 패턴으로 통합 관리:

```javascript
// uiState와 codes를 함께 관리
const uiState = reactive({
  loading: false,
  error: null,
  isPageCodeLoad: false,  // 이 페이지에서 코드 로드 완료 여부
  // UI 토글 상태 (showModal, expanded 등)
});

const codes = reactive({
  // 코드 그룹별 배열 (watch에서 주입)
  disp_ui_types: [],      // DISP_UI_TYPE
  disp_widget_types: [],  // DISP_WIDGET_TYPE
  disp_areas: [],         // DISP_AREA
  layout_types: [],       // LAYOUT_TYPE
  // ... 필요한 다른 코드들
});

// App 초기화 준비 상태 (Store 로딩 + 페이지 코드 로드 여부)
const isAppReady = computed(() => {
  const initStore = window.useBoAppInitStore?.();
  const codeStore = window.getBoCodeStore?.();
  return !initStore?.svIsLoading          // App 초기화 완료
      && codeStore?.svCodes?.length > 0   // Code Store 데이터 있음
      && !uiState.isPageCodeLoad;         // 이 페이지는 아직 로드 안 함
});

// 코드 주입 함수
const fnLoadCodes = () => {
  const codeStore = window.getBoCodeStore();
  codes.disp_ui_types = codeStore.snGetGrpCodes('DISP_UI_TYPE');
  codes.disp_areas = codeStore.snGetGrpCodes('DISP_AREA');
  codes.layout_types = codeStore.snGetGrpCodes('LAYOUT_TYPE');
  // ... 필요한 다른 코드들
  uiState.isPageCodeLoad = true;  // 로드 완료 표시
};

// App 초기화 완료 감시
watch(isAppReady, (ready) => {
  if (ready) {
    fnLoadCodes();
  }
});

onMounted(() => {
  // isAppReady가 이미 true면 즉시 로드
  if (isAppReady.value) {
    fnLoadCodes();
  }
  // false면 watch에서 처리됨
});
```

## 명명 규칙

### codes 속성명 (카멜케이스)
| code_grp (DB) | codes 속성 | snGetGrpCodes 인자 | 예시 값 | 용도 |
|---|---|---|---|---|
| DISP_UI_TYPE | disp_ui_types | 'DISP_UI_TYPE' | FO, BO, MOBILE, KIOSK | 전시 UI 타입 |
| DISP_WIDGET_TYPE | disp_widget_types | 'DISP_WIDGET_TYPE' | image_banner, product_slider | 위젯 타입 |
| DISP_AREA | disp_areas | 'DISP_AREA' | HOME_BANNER, PRODUCT_TOP | 영역 타입 |
| DISCOUNT_TYPE | discount_types | 'DISCOUNT_TYPE' | amount, percent | 할인 유형 |
| LAYOUT_TYPE | layout_types | 'LAYOUT_TYPE' | grid, dashboard | 레이아웃 유형 |
| ORDER_STATUS | order_statuses | 'ORDER_STATUS' | PENDING, PAID, SHIPPED | 주문 상태 |
| CLAIM_STATUS | claim_statuses | 'CLAIM_STATUS' | REQUESTED, APPROVED | 클레임 상태 |
| MEMBER_GRADE | member_grades | 'MEMBER_GRADE' | BASIC, SILVER, GOLD, VIP | 회원 등급 |

**규칙**: code_grp의 언더스코어(_)를 제거하고 카멜케이스로, 항상 복수형 사용 (types, statuses, grades 등)

### codeValue / codeLabel 구조
```javascript
{ codeValue: 'FO', codeLabel: '프론트(FO)' }
{ codeValue: 'PENDING', codeLabel: '주문접수' }
{ codeValue: 'amount', codeLabel: '정액' }
```

**규칙**:
- `codeValue`: DB sy_code.code_value 그대로 (영문, 대문자 권장)
- `codeLabel`: DB sy_code.code_label 그대로 (한글 표시명)

## 실제 적용 예제

### 예제 1: DpDispUiMng.js (전시 UI 관리)

```javascript
window.DpDispUiMng = {
  name: 'DpDispUiMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    
    // UI 상태
    const uiState = reactive({
      loading: false,
      error: null,
      isPageCodeLoad: false,
    });
    
    // 코드 데이터
    const codes = reactive({
      disp_ui_types: [],
    });
    
    const displays = reactive([]);
    const searchParam = reactive({
      searchValue: '',
      uiType: '',
      useYn: '',
      dateStart: '',
      dateEnd: '',
      dateRange: ''
    });
    const searchParamOrg = reactive({ ...searchParam });

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading 
          && codeStore?.svCodes?.length > 0 
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      codes.disp_ui_types = codeStore.snGetGrpCodes('DISP_UI_TYPE');
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시
    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // API 데이터 로드
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/dp/ui/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        displays.splice(0, displays.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('DpDispUi 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // 라벨 함수
    const fnUiTypeLabel = (v) => codes.disp_ui_types.find(o => o.codeValue === v)?.codeLabel || '-';

    onMounted(() => {
      // isAppReady가 이미 true면 즉시 로드
      if (isAppReady.value) {
        fnLoadCodes();
      }
      // false면 watch에서 처리됨
      
      handleSearchList();
      Object.assign(searchParamOrg, searchParam);
    });

    return {
      uiState,
      codes,
      displays,
      searchParam,
      searchParamOrg,
      fnUiTypeLabel,
      handleSearchList,
      // ... 다른 반환값
    };
  },
  template: `
<div>
  <div class="page-title">전시UI관리</div>
  <div class="card">
    <div class="search-bar">
      <select v-model="searchParam.uiType">
        <option value="">UI유형 전체</option>
        <option v-for="o in codes.disp_ui_types" :key="o?.codeValue" :value="o.codeValue">
          {{ o.codeLabel }}
        </option>
      </select>
      <!-- ... 다른 검색 필드 -->
    </div>
  </div>
  <!-- ... 나머지 템플릿 -->
</div>
  `
};
```

### 예제 2: DpDispPanelMng.js (전시 패널 관리)

```javascript
window.DpDispPanelMng = {
  name: 'DpDispPanelMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    
    // UI 상태
    const uiState = reactive({
      loading: false,
      error: null,
      isPageCodeLoad: false,
    });
    
    // 코드 데이터
    const codes = reactive({
      layout_types: [],
    });
    
    const panels = reactive([]);
    const displays = reactive([]);

    // App 초기화 준비 상태
    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading 
          && codeStore?.svCodes?.length > 0 
          && !uiState.isPageCodeLoad;
    });

    // 코드 주입
    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      codes.layout_types = codeStore.snGetGrpCodes('LAYOUT_TYPE');
      uiState.isPageCodeLoad = true;
    };

    // App 초기화 감시
    watch(isAppReady, (ready) => {
      if (ready) {
        fnLoadCodes();
      }
    });

    // API 데이터 로드
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const [panelsRes, displaysRes] = await Promise.all([
          window.boApi.get('/bo/ec/dp/panel/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/ec/dp/ui/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        panels.splice(0, panels.length, ...(panelsRes.data?.data?.list || []));
        displays.splice(0, displays.length, ...(displaysRes.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('DpDispPanel 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    onMounted(() => {
      // isAppReady가 이미 true면 즉시 로드
      if (isAppReady.value) {
        fnLoadCodes();
      }
      // false면 watch에서 처리됨
      
      handleSearchList();
    });

    return {
      uiState,
      codes,
      panels,
      displays,
      // ... 다른 반환값
    };
  },
  template: `
<div>
  <div class="page-title">전시패널관리</div>
  <div class="card">
    <div class="search-bar">
      <select v-model="searchParam.layoutType">
        <option value="">레이아웃 전체</option>
        <option v-for="o in codes.layout_types" :key="o?.codeValue" :value="o.codeValue">
          {{ o.codeLabel }}
        </option>
      </select>
      <!-- ... 다른 검색 필드 -->
    </div>
  </div>
  <!-- ... 나머지 템플릿 -->
</div>
  `
};
```

## Store Getter 함수

### snGetGrpCodes(grpVal)
특정 코드 그룹을 `{ codeValue, codeLabel }` 형식으로 변환

```javascript
// 사용법
const disp_ui_types = window.getBoCodeStore().snGetGrpCodes('DISP_UI_TYPE');
// 반환: [
//   { codeValue: 'FO', codeLabel: '프론트(FO)' },
//   { codeValue: 'BO', codeLabel: '관리자(BO)' },
//   { codeValue: 'MOBILE', codeLabel: '모바일' },
//   { codeValue: 'KIOSK', codeLabel: '키오스크' }
// ]
```

**특징:**
- `use_yn === 'Y'`인 항목만 필터링
- `sort_ord` 순서대로 정렬
- 새 배열 생성 (Store와 독립)

### snGetGrpCodesFirstOpt(grpVal, initVal, initLabel)
코드 그룹 앞에 초기 항목 추가 (예: "선택" 옵션)

```javascript
// 사용법
const layout_types = window.getBoCodeStore()
  .snGetGrpCodesFirstOpt('LAYOUT_TYPE', '', '레이아웃 선택');
// 반환: [
//   { codeValue: '', codeLabel: '레이아웃 선택' },
//   { codeValue: 'grid', codeLabel: '그리드' },
//   { codeValue: 'dashboard', codeLabel: '대시보드' }
// ]
```

## 핵심 패턴 요약

| 항목 | 값 |
|---|---|
| **uiState 필수 항목** | `loading`, `error` (`isPageCodeLoad` 는 2026-07-30 폐기) |
| **codes 항목** | 필요한 code_grp별로 카멜케이스 속성 |
| **게이트** | 없음 — `cofUseAppCodeReady` 폐기(2026-07-30). `initPage` 가 순서를 정한다 |
| **fnLoadCodes 함수** | `async` + `await codeStore.saLoadCodes([...])` → `sgGetGrpCodes()` 로 `codes` 주입 |
| **onMounted 역할** | `onMounted(initPage)` — `initPage` 안에서 `await fnLoadCodes()` 후 초기 조회 |

## Store 안전성

### ✅ 안전한 패턴
```javascript
// snGetGrpCodes는 항상 새 배열 생성
codes.disp_ui_types = codeStore.snGetGrpCodes('DISP_UI_TYPE');

// 이후 mutations은 codes만 영향, Store는 무관
codes.disp_ui_types.push({ codeValue: 'NEW', codeLabel: '새항목' });  // ✅ OK
codes.disp_ui_types[0].codeLabel = 'changed';                          // ✅ OK
```

### ❌ 위험한 패턴
```javascript
// 직접 참조 절대 금지
codes.disp_ui_types = codeStore.svCodes;  // ❌ Store 오염 가능

// 초기화 지연
// (onMounted 빈 상태에서 API 호출하면 codes 미로드)
```

## 페이지 다중 적용 체크리스트

새 화면에 codes 패턴을 적용할 때:

- [ ] `codes` reactive 정의 (필요한 항목들)
- [ ] `fnLoadCodes()` 를 **async** 로 구현 + 첫 줄에 `await codeStore.saLoadCodes([...쓰는 그룹...])`
- [ ] `initPage()` 작성 — `await fnLoadCodes()` → 초기 조회, `onMounted(initPage)` (게이트 만들지 않기)
- [ ] Template에서 `codes.속성` 사용
- [ ] return에 `codes`, `uiState` 포함
- [ ] (코드를 수정하는 화면이면) 저장 직후 `saInvalidateGrps([...])` 연결

## 전체 적용 현황 (2026-04-26 완료)

### ✅ Tier 1: 전시 Display 파일 (17개) — 완료
- DpDispUiMng.js, DpDispPanelMng.js (정책서 모델)
- DpDispAreaMng.js, DpDispAreaDtl.js, DpDispAreaPreview.js
- DpDispPanelDtl.js, DpDispPanelPreview.js
- DpDispUiDtl.js, DpDispUiPreview.js, DpDispUiSimul.js
- DpDispWidgetMng.js, DpDispWidgetDtl.js, DpDispWidgetPreview.js
- DpDispWidgetLibMng.js, DpDispWidgetLibDtl.js, DpDispWidgetLibPreview.js
- DpDispRelationMng.js

**추가 작업:** sy_code_grp.sql, sy_code.sql 정책서 코드 그룹 4개 정의

### ✅ Tier 2: BO 관리 화면 (Mng) — 완료 (69개)

**EC 도메인 (48개):**
- Member (3): MbMemGradeMng, MbMemGroupMng, MbMemberMng
- Customer Info (1): MbCustInfoMng
- Community (3): CmBlogMng, CmChattMng, CmNoticeMng
- Order (3): OdOrderMng, OdClaimMng, OdDlivMng
- Product (9): PdBundleMng, PdCategoryMng, PdCategoryProdMng, PdDlivTmpltMng, PdProdMng, PdQnaMng, PdRestockNotiMng, PdReviewMng, PdSetMng, PdTagMng
- Promotion (8): PmCacheMng, PmCouponMng, PmDiscntMng, PmEventMng, PmGiftMng, PmPlanMng, PmSaveMng, PmVoucherMng
- Settlement (9): StConfigMng, StErpGenMng, StErpReconMng, StErpViewMng, StRawMng, StReconClaimMng, StReconOrderMng, StReconPayMng, StReconVendorMng, StSettleAdjMng, StSettleCloseMng, StSettleEtcAdjMng, StSettlePayMng, StStatusMng

**SY 도메인 (21개):**
- SyAlarmMng, SyAttachMng, SyBatchMng, SyBbmMng, SyBbsMng, SyBrandMng, SyCodeMng, SyContactMng, SyDashboardMng, SyDeptMng, SyI18nMng, SyMenuMng, SyPathMng, SyPropMng, SyRoleMng, SySiteMng, SyTemplateMng, SyUserMng, SyVendorMng, SyVendorUserMng

### ✅ Tier 3: BO 상세/편집 화면 (Dtl) — 완료 (31개)

**완료된 Dtl:**
- OdOrderDtl, OdClaimDtl, OdDlivDtl
- MbMemberDtl
- CmChattDtl, CmNoticeDtl
- PdCategoryDtl, PdProdDtl
- PmCacheDtl, PmCouponDtl, PmDiscntDtl, PmEventDtl, PmGiftDtl, PmPlanDtl, PmSaveDtl, PmVoucherDtl
- SyAlarmDtl, SyBatchDtl, SyBbmDtl, SyBbsDtl, SyCodeDtl, SyContactDtl, SySiteDtl, SyTemplateDtl, SyUserDtl, SyVendorDtl
- DpDispAreaDtl, DpDispPanelDtl, DpDispUiDtl, DpDispWidgetDtl, DpDispWidgetLibDtl

### ✅ Tier 4: FO 사용자 페이지 — 완료 (54개)

**일반 페이지 (23개):**
- About, Blog, BlogEdit, BlogView, Cart, Contact, Event, EventView, Faq
- Home01, Home02, Home03
- Like, Location, Login, Order
- Prod01List, Prod01View, Prod02List, Prod02View, Prod03List, Prod03View

**마이페이지 (6개):**
- MyCache, MyChatt, MyClaim, MyContact, MyCoupon, MyOrder

**전시 UI (7개):**
- DispUi01~06, DispUiPage

**샘플 & 유틸 (18개):**
- Sample01~23 (샘플 페이지 23개)
- XsLocalStorage, XsStore

### ✅ Tier 5: Utils, Layout, Components — 완료 (8개)

**Modal & Components (5개):**
- components/modals/BaseModals.js
- components/disp/DispX01Ui.js, DispX02Area.js, DispX03Panel.js, DispX04Widget.js

**Layout (3개):**
- layout/foAppHeader.js, foAppFooter.js, foAppSidebar.js

---

## 통합 요약

| Tier | 분류 | 개수 | 상태 |
|---|---|---|---|
| 1 | 전시 Display | 17 | ✅ 완료 |
| 2 | BO Mng | 69 | ✅ 완료 |
| 3 | BO Dtl | 31 | ✅ 완료 |
| 4 | FO 페이지 | 54 | ✅ 완료 |
| 5 | Utils/Layout/Components | 8 | ✅ 완료 |
| **총계** | | **179** | **✅ 완료** |

**추가 작업:**
- ✅ sy_code_grp.sql — 4개 새 코드 그룹 정의
- ✅ sy_code.sql — DISP_UI_TYPE(4) + DISP_WIDGET_TYPE(23) + LAYOUT_TYPE(2) + DISCOUNT_TYPE(3) = 32개 코드 항목


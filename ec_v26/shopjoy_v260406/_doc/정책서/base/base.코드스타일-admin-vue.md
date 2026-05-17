# Admin Vue 컴포넌트 코드 스타일 정책

> 기준 파일: `pages/bo/ec/cm/CmNoticeMng.js`  
> 적용 대상: `pages/bo/**/*Mng.js`, `pages/bo/**/*Dtl.js` 등 모든 관리자 Vue 컴포넌트

---

## ⛔ 0-A. 템플릿 속성값에 `&` 문자 사용 금지 ⭐ (최우선 · 빌드 크래시 유발)

### 증상

브라우저 콘솔에 다음 에러가 발생하며 **해당 컴포넌트 전체가 렌더되지 않는다**:

```
SyntaxError: Unexpected token ')'
  at new Function (<anonymous>)
  at vue.global.prod.js ...
(또는) Cannot read properties of undefined (reading '0' / 'length')
```

### 원인

이 프로젝트는 빌드 없이 `vue.global.prod.js`(브라우저 런타임 템플릿 컴파일)를 사용한다.
이 빌드의 HTML 파서는 **속성값(attribute value) 안에서 `&` 를 만나면 HTML 엔티티로 간주해
`decodeEntities` 를 호출**하는데, 런타임 빌드에는 엔티티 디코더가 주입되지 않아 **컴파일러가
즉시 크래시**한다. `&&`(논리 AND), 단일 `&`(URL 쿼리스트링), `&amp;` 등 **`&` 가 들어간
모든 속성값**이 대상이다.

> 검증 완료: `<div :class="a && b">` / `<a href="x?p=1&q=2">` / `v-if="a && b"` /
> `:key="(g && g.id)"` — **전부 크래시**. `{{ a && b }}`(텍스트 노드 mustache)는 정상.
> `<`, `>`, `||`, 삼항 `?:` 는 속성값 안에서도 안전.

### 금지 / 대체

| 구분 | ❌ 금지 (속성값 내) | ✅ 대체 |
|------|--------------------|---------|
| 논리 AND | `:class="a && b ? 'x' : 'y'"` | `:class="coUtil.cofAnd(a, b) ? 'x' : 'y'"` |
| 다중 AND | `v-if="a && b && c"` | `v-if="coUtil.cofAnd(a, b, c)"` |
| `:key` | `:key="(g && g.id)"` | `:key="coUtil.cofAnd(g, g.id)"` |
| URL 내 `&` | `:href="'u?a=1&b=2'"` | `:href="'u?a=1&b=2'"` (문자열 내 `&`→`&`) |
| 텍스트 노드 | `{{ a && b }}` | **그대로 허용** (mustache 는 안전) |

`coUtil.cofAnd(...args)` — `&&` 단축평가와 의미 100% 동일(첫 falsy 반환, 모두 truthy 면
마지막 인자). `utils/coUtil.js` 정의, FO·BO 전 진입점에서 컴포넌트보다 먼저 로드됨.

> ⚠️ **연산자 우선순위 주의**: `&&` 는 삼항 `?:` 보다 우선순위가 높다.
> `a && b ? c : d` ≡ `(a && b) ? c : d` 이므로 `coUtil.cofAnd(a, b) ? c : d` 로 치환한다.
> `coUtil.cofAnd(a, b ? c : d)` 처럼 삼항을 인자 안으로 넣으면 **의미가 바뀐다**.

### 점검 명령

```bash
# 속성값(태그 내부)에 & 가 남아 있는지 — 결과가 있으면 위반
grep -nE '(:[a-zA-Z-]+|v-[a-z]+|@[a-z.]+)="[^"]*&' pages/bo/**/*.js components/**/*.js
```

신규/수정 컴포넌트는 작성 후 위 grep 으로 0건임을 확인한다.

---

## 0. watch / computed 최소화 원칙 ⭐

**핵심 방침**: `watch`와 `computed`는 꼭 필요한 경우에만 사용하고, 가능하면 직접 함수 호출 방식으로 대체한다.

### watch() 허용 케이스

| 케이스 | 이유 | 예시 |
|---|---|---|
| `isAppReady` 감시 | 앱 스토어가 비동기로 준비되는 시점을 알 수 없어 watch가 불가피 | `watch(isAppReady, v => { if (v) fnLoadCodes(); })` |
| 외부 `props.*` 변경 감시 | 부모가 언제 prop을 바꿀지 제어 불가 | `watch(() => props.dtlId, handleLoadDetail)` |
| UI 탭/뷰모드 영속화 | 상태 변경 시점에 즉시 window에 동기화 필요 | `watch(() => uiState.tab, v => { window._xxState.tab = v; })` |
| 에디터 초기화 등 복잡 사이드 이펙트 | DOM 상태나 라이브러리 인스턴스 제어가 필요한 경우 | Quill 에디터 on/off 전환 |

### watch() 금지 케이스 → 직접 호출로 대체

```js
// ❌ 금지 — 검색 파라미터 변경 시 watch로 조회 트리거
watch(() => searchParam.searchValue, () => handleSearchList());
watch(() => uiState.selectedPath, () => handleSearchList());

// ✅ 대체 — 이벤트 함수에서 직접 호출
const onSearch = async () => { pager.pageNo = 1; await handleSearchList(); };

// 경로 선택 시 직접 호출
const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList(); };
```

### computed() 허용 케이스

| 케이스 | 이유 | 예시 |
|---|---|---|
| 여러 reactive 값에서 파생되고 템플릿에서 반복 사용 | 의존 추적 + 캐싱이 필요한 경우 | `cfIsNew`, `cfDetailEditId`, `cfTree` (트리 빌드) |
| 복잡한 목록 필터·변환 결과 (클라이언트 전체 로드) | 매 렌더마다 재계산하면 비용이 큰 경우 | `cfFiltered`, `cfPageList`, `cfPageNums` |
| 앱 초기화 상태 복합 조건 | 여러 스토어를 합산한 준비 여부 | `isAppReady` |

### computed() 금지 케이스 → 일반 함수나 reactive로 대체

```js
// ❌ 금지 — 단순 getter를 computed로 래핑
const cfSiteNm = computed(() => boUtil.getSiteNm());

// ✅ 대체 — 일반 함수로 선언 (또는 템플릿에서 직접 호출)
const fnSiteNm = () => boUtil.getSiteNm();
// template: {{ fnSiteNm() }}
// 또는 template: {{ $root.boUtil?.getSiteNm() }}  ← boUtil이 전역이면 직접 호출 가능

// ❌ 금지 — reactive 값을 단순히 다시 접근하는 computed
const cfIsNew = computed(() => !props.dtlId);

// ✅ 대체 — template에서 직접 표현식 사용
// template: <span v-if="!dtlId">신규</span>
// 또는 단순 함수
const cfIsNew = () => !props.dtlId;
// template: <span v-if="cfIsNew()">신규</span>

// ❌ 금지 — 호출 빈도 낮은 변환을 computed로 선언
const cfStatusLabel = computed(() => ({ A:'활성', I:'비활성' }[status.value] || status.value));

// ✅ 대체 — 순수 fn 함수
const fnStatusLabel = (s) => ({ A:'활성', I:'비활성' }[s] || s);
```

### 판단 기준 요약

```
reactive 값이 변할 때 자동으로 반응해야 하는가?
  └─ NO  → 일반 함수(fn*) 또는 직접 표현식 사용
  └─ YES → computed 또는 watch 고려
            └─ 값을 파생시키면? → computed
            └─ 사이드 이펙트가 필요하면? → watch (허용 케이스인지 먼저 확인)
```

---

## 1. setup() 내부 구역 순서

`setup()` 함수 안은 아래 순서로 구역을 구분한다.  
각 구역은 `// ── 구역명 ───…` 형식의 구분선으로 시작하고, 구분선 **아래 한 줄**을 비운다.

```
// ── 선언부 ────────────────────────────────────────────────────────────────
// ── computed (필요한 경우에만) ────────────────────────────────────────────
// ── watch (허용 케이스에만) ───────────────────────────────────────────────
// ── 초기화부 ──────────────────────────────────────────────────────────────
// ── 이벤트 함수 모음 ──────────────────────────────────────────────────────
// ── 일반 함수 모음 ────────────────────────────────────────────────────────
// ── return ────────────────────────────────────────────────────────────────
```

### 구역별 포함 항목

| 구역 | 포함 항목 |
|---|---|
| **선언부** | `reactive()`, `ref()`, 외부 상수 참조 (`DATE_RANGE_OPTIONS` 등) |
| **computed** | `computed(() => …)` 전체 (`cf*`, `isAppReady` 등) — 허용 케이스에만 작성 |
| **watch** | `watch(…)` 전체 — 허용 케이스(isAppReady·props·영속화)에만 작성 |
| **초기화부** | `fn*` 유틸 함수, `onMounted` |
| **이벤트 함수 모음** | `on*` 접두어 함수 — 버튼·입력 이벤트 직결 핸들러 |
| **일반 함수 모음** | `handle*`, `load*`, `open*`, `close*`, `fn*` 배지/포맷 함수, `exportExcel` 등 |
| **return** | template에 노출할 상태·함수 목록 |

---

## 2. 구분선 형식

```js
// ── 구역명 ────────────────────────────────────────────────────────────────
```

- `──` + 공백 + 구역명 + 공백 + `─` 반복으로 80자 근처까지 채운다.
- 구분선 **아래** 한 줄 공백 필수, 구분선 **위**는 이미 이전 블록 끝에 공백이 있으면 추가하지 않아도 된다.

---

## 3. 강조 주석 (`★`)

진입점이 되는 라이프사이클 / 노출 목록처럼 **반드시 눈에 띄어야 하는 위치**는 `★` 접두어를 사용한다.

```js
// ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
onMounted(() => { … });

// ── return ────────────────────────────────────────────────────────────────
```

---

## 4. 함수 주석

모든 함수 **바로 위 한 줄**에 역할 주석을 작성한다.  
형식: `// 한 줄 설명 — 부연 설명(필요 시)`

```js
// 조회 버튼 클릭 — 1페이지부터 재조회
const onSearch = async () => { … };

// 공지사항 삭제 — 확인 후 낙관적 UI 제거 → API 호출 → 목록 갱신
const handleDelete = async (n) => { … };
```

- `→` 기호로 처리 흐름을 표현한다.
- 한 줄로 표현하기 어렵더라도 **두 줄 이상의 주석 블록은 사용하지 않는다**.

---

## 5. 변수 인라인 주석

`reactive()` / `ref()` 선언 변수는 **우측 인라인 주석**으로 역할을 설명한다.  
여러 줄에 걸친 객체는 닫는 `}` / `]` 오른쪽에 작성한다.

```js
const notices       = reactive([]);                     // 공지사항 목록
const uiState       = reactive({ … });                  // 로딩·에러·코드로드 상태
const uiStateDetail = reactive({ … });                  // 하단 상세 패널 상태 (선택ID, view|edit)
const pager         = reactive({
  …
});                                                     // 페이징 상태
```

- 변수명은 `=` 기준으로 **세로 정렬**한다 (가독성 향상).

---

## 6. computed 인라인 주석

한 줄 `computed`는 우측 인라인, 여러 줄 `computed`는 여는 `computed(() => {` 오른쪽에 작성한다.

```js
const cfSiteNm   = computed(() => …);                  // 현재 사이트명
const cfPageNums = computed(() => {                    // 현재 페이지 기준 ±2 페이지 번호 배열
  …
});
```

---

## 7. 함수 네이밍 접두어

| 접두어 | 적용 대상 |
|---|---|
| `on*` | `@click` / `@change` 등 이벤트 직결 함수 |
| `handle*` | 이벤트 처리 로직 함수 (API 호출 포함) |
| `fn*` | 순수 유틸 함수 (포맷·변환 등) |
| `cf*` | `computed(() => …)` 속성 |
| `load*` | 특정 데이터 로드·패널 열기 |
| `open*` / `close*` | UI 패널·모달 열기·닫기 |

---

## 8. template 구역 주석

template 안의 주요 구역은 HTML 주석으로 구분한다.  
형식은 JS 구분선과 동일하게 통일한다.

```html
<!-- ── 검색 영역 ─────────────────────────────────────────────────────── -->
<!-- ── 목록 영역 ─────────────────────────────────────────────────────── -->
<!-- ── 툴바 ─────────────────────────────────────────────────────────── -->
<!-- ── 테이블 ────────────────────────────────────────────────────────── -->
<!-- ── 페이징 ────────────────────────────────────────────────────────── -->
<!-- ── 상세 패널 (인라인 임베드) ─────────────────────────────────────── -->
```

- 카드 내부의 소구역(툴바·테이블·페이징)은 들여쓰기를 유지하고 같은 형식을 사용한다.
- 구역 주석 **아래 한 줄** 공백은 선택이지만 일관되게 적용한다.

---

## 9. BO API 변경성 호출 필수 헤더 (`X-UI-Nm`, `X-Cmd-Nm`)

`boApi.post / put / delete / patch` 등 **변경성 API 호출 시** `coUtil.apiHdr(uiNm, cmdNm)`을 반드시 전달해야 한다.  
누락 시 `boApiAxios.js` 인터셉터가 요청을 차단하고 `[BO API] 필수 헤더 누락: X-UI-Nm, X-Cmd-Nm` 에러 토스트를 출력한다.

### 메서드별 인자 위치

| 메서드 | 시그니처 | 헤더 위치 |
|---|---|---|
| `get` | `boApi.get(url, config)` | `config` 자리에 `coUtil.apiHdr(...)` |
| `post` | `boApi.post(url, data, config)` | 세 번째 인자에 `coUtil.apiHdr(...)` |
| `put` | `boApi.put(url, data, config)` | 세 번째 인자에 `coUtil.apiHdr(...)` |
| `patch` | `boApi.patch(url, data, config)` | 세 번째 인자에 `coUtil.apiHdr(...)` |
| `delete` | `boApi.delete(url, config)` | 두 번째 인자에 `coUtil.apiHdr(...)` |

### 올바른 예시

```js
// GET (조회) — services/boApiSvc.js 에 등록하면 내부에서 coUtil.apiHdr 사용
const res = await boApiSvc.syCode.getPage({ codeGrp: 'USE_YN' }, '공통코드관리', '목록조회');

// POST (등록)
await boApi.post('/bo/sy/code', row, coUtil.apiHdr('공통코드관리', '등록'));

// PUT (수정)
await boApi.put(`/bo/sy/code/${id}`, row, coUtil.apiHdr('공통코드관리', '수정'));

// DELETE (삭제)
await boApi.delete(`/bo/sy/code/${id}`, coUtil.apiHdr('공통코드관리', '삭제'));
```

### 잘못된 예시

```js
// ❌ 헤더 없이 호출 — 인터셉터에서 차단됨
await boApi.post('/bo/sy/code', row);
await boApi.put(`/bo/sy/code/${id}`, row);
await boApi.delete(`/bo/sy/code/${id}`);
```

---

## 10. 저장 완료 후 재조회 정책

CRUD 저장 함수(`handleSave`, `handleSaveGrp` 등)는 **저장 성공 후 반드시 서버에서 재조회**해야 한다.  
로컬 상태만 업데이트하면 서버가 부여한 ID·타임스탬프·변환값이 반영되지 않는다.

### 패턴

```js
const handleSave = async () => {
  // ... 확인 다이얼로그 ...
  try {
    await boApi.post('/bo/sy/xxx', row, coUtil.apiHdr('XXX관리', '등록'));
    props.showToast('저장되었습니다.');
    await handleSearchList();   // ← 반드시 서버 재조회
  } catch (err) {
    props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
  }
};
```

### 규칙

- **코드목록 저장** → `handleSearchList()` 로 해당 그룹 코드 재조회
- **그룹 저장** → `handleLoadAllGroups()` 로 전체 그룹 재조회 (서버 집계값 반영)
- 로컬 배열 직접 조작(`splice`, `push`, `forEach r._row_status = 'N'`)으로 저장 완료를 표현하지 않는다

---

## 11. 전체 구조 예시

```js
/* ShopJoy Admin - 화면명 */
window.XxxMng = {
  name: 'XxxMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // ── 선언부 ────────────────────────────────────────────────────────────────

    const items   = reactive([]);          // 목록 데이터
    const uiState = reactive({ … });       // 로딩·에러 상태
    …

    // ── computed ──────────────────────────────────────────────────────────────

    const cfXxx      = computed(() => …); // 설명
    const isAppReady = computed(() => {   // 앱 초기화 완료 여부
      …
    });

    // ── watch ─────────────────────────────────────────────────────────────────

    // 앱 준비 완료 시 코드 로드 트리거
    watch(isAppReady, (v) => { if (v) fnLoadCodes(); });

    // ── 초기화부 ──────────────────────────────────────────────────────────────

    // 공통코드 로드
    const fnLoadCodes = async () => { … };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { … });

    // ── 이벤트 함수 모음 ──────────────────────────────────────────────────────

    // 조회 버튼 클릭
    const onSearch = async () => { … };

    // ── 일반 함수 모음 ────────────────────────────────────────────────────────

    // 목록 페이징 조회
    const handleSearchList = async () => { … };

    // ── return ────────────────────────────────────────────────────────────────

    return { … };
  },
  template: /* html */`
<div>
  <div class="page-title">화면명</div>

  <!-- ── 검색 영역 ─────────────────────────────────────────────────────── -->
  <div class="card"> … </div>

  <!-- ── 목록 영역 ─────────────────────────────────────────────────────── -->
  <div class="card">
    <!-- ── 툴바 ─────────────────────────────────────────────────────────── -->
    <!-- ── 테이블 ────────────────────────────────────────────────────────── -->
    <!-- ── 페이징 ────────────────────────────────────────────────────────── -->
  </div>

  <!-- ── 상세 패널 (인라인 임베드) ─────────────────────────────────────── -->
  <div v-if="selectedId"> … </div>

</div>
`
};
```

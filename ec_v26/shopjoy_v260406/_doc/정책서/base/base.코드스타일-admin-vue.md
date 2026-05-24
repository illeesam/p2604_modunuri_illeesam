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

## 1. setup() 내부 구역 순서 ⭐ (2026-05-24 갱신)

`setup()` 함수 안은 **4개 메인 섹션 + return 마커** 형식으로 구역을 구분한다. 기준 파일: [`pages/bo/sy/SyCodeMng.js`](../../../pages/bo/sy/SyCodeMng.js).

### 메인 5섹션 (필수)

```js
setup(props) {
  // ===== 초기 변수 정의 =====================================================
  // (Vue 구조분해, window 함수 참조, reactive/ref, 상수, 임시 ID 시퀀스, 매핑 테이블)

  // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================
  // (fnLoadCodes, checkAndLoadCodes, watch, isAppReady, onMounted)

  // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================
  // (onSearch/onReset/onCell*/onDrag*, handleLoadXxx/handleSearchList/handleSave,
  //  addRow/deleteRow/cancelRow 등 행 조작, openDtl/closeDtl 등)

  // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================
  // (syncDirty, codeTotal, fnXxxTitle, cfXxxSortParam, statusBadgeCls,
  //  exportCsv, baseSearchColumns, xxxGridColumns 등)

  // ===== return (템플릿 노출) ===============================================
  return { ... };
}
```

### 섹션별 포함 항목

| 섹션 | 포함 항목 |
|---|---|
| **초기 변수 정의** | `const { reactive, watch, ... } = Vue`, `window.boApp.showToast` 등 전역 참조, `reactive()`/`ref()` 상태, `searchParam`, 상수 배열(`EDIT_FIELDS`, `GRP_FIELDS`), 매핑 테이블(`GRP_SORT_MAP`), 캐시 상수(`siteNm`), 임시 ID 시퀀스(`_tempId`, `_grpLoadSeq`) |
| **초기 함수** | `fnLoadCodes`, `checkAndLoadCodes`, `watch(...)`, `isAppReady`, `onMounted(() => {...})` |
| **내장 사용 함수** | `on*` 이벤트 핸들러 (버튼·입력 직결), `handle*` 비즈니스 핸들러, 행 조작 (`addRow`/`deleteRow`/`cancelRow`/`cancelChecked`/`deleteRows`/`handleSave`), 그룹 조작 (`addGrp`/`handleSaveGrp`), 데이터 로드 (`handleLoadAllGroups`/`handleSearchList`), 상세 패널 (`handleLoadDetail`/`closeDetail`) |
| **사용자 함수** | 카운트 헬퍼 (`codeTotal`/`grpCount`), 타이틀 헬퍼 (`fnCodeListTitle`), 동기화 (`syncGrpDirty`), 정렬 헬퍼 (`cfGrpSortParam`/`grpSortIcon`), 트리 재구축 (`rebuildTree`), 표시 (`statusBadgeCls`), 내보내기 (`exportCsv`), 컬럼 정의 (`baseSearchColumns`/`xxxGridColumns`/`xxxFormColumns`) |
| **return** | template에 노출할 상태·함수 — 그룹별 한 줄 인라인 주석 + 같은 그룹 변수는 한 줄로 묶기 |

### 하위 세분 주석 (선택, `// --- [구분] 설명 ---` 형식)

각 메인 섹션 내부를 더 세분화할 때 사용한다. 파일 내용에 맞게 자유롭게 추가하되, SyCodeMng.js의 예시 패턴을 따른다.

- **초기 변수 정의 하위:**
  - `// --- Vue API / boApp 전역 함수 참조 ---`
  - `// --- 화면 상태 / 그리드 데이터 (reactive) ---`
  - `// --- 검색조건 초기값 함수 + searchParam reactive ---`
  - `// --- 트리 상태 ---` · `// --- 캐시 상수 ---`
  - `// --- 임시 ID 시퀀스 ---` · `// --- 변경 추적 필드 / 정렬 매핑 ---`

- **내장 사용 함수 하위:**
  - `// --- [이벤트] 검색 / 초기화 / 기간 ---`
  - `// --- [이벤트] 그리드 셀 변경 ---`
  - `// --- [이벤트] 드래그 정렬 / 전체 체크 ---`
  - `// --- [이벤트] 그룹그리드 정렬 ---`
  - `// --- [데이터 로드] ---`
  - `// --- [행 CRUD - 코드] ---` · `// --- [행 CRUD - 그룹] ---`
  - `// --- [이벤트] 그룹/경로 선택 → 코드목록 진입 ---`
  - `// --- [이벤트] 트리 노드 펼침/접힘 ---`
  - `// --- [이벤트] 상세 패널 열기 / 닫기 ---`

- **사용자 함수 하위:**
  - `// --- [카운트 / 타이틀 헬퍼] ---`
  - `// --- [정렬 파라미터 / 아이콘] ---`
  - `// --- [트리 재구축] ---`
  - `// --- [표시 / 내보내기] ---`
  - `// --- [컬럼 정의 - 검색 / 그리드 / 트리 / 그룹] ---`

### return 블록 정리

```js
return {
  // 상태 / 데이터
  uiState, pageCodes, searchParam, ...

  // 컬럼 정의
  baseSearchColumns, fnCodeGridColumns, ...

  // 검색 / 조회 이벤트
  onSearch, onReset, handleDateRangeChange,

  // 그리드 셀 변경 이벤트
  onCellChange, onGrpChange, onPathChange, ...

  // 행 CRUD - 코드
  addRow, deleteRow, cancelRow, handleSave,

  // 행 CRUD - 그룹
  addGrp, handleDeleteGrp, handleSaveGrp,

  // 상세 패널
  handleLoadDetail, closeDetail,
  ...
};
```

### 중요 규칙

1. **함수 정의 위치를 옮기지 마라.** `const` 화살표 함수는 호이스팅이 안 된다. 그룹 주석만 적절한 위치에 삽입한다.
2. **template 백틱은 절대 건드리지 마라.** setup() 내부 JS만 정리. ([[boapp_template_no_format]] 참조)
3. **각 파일 정리 후 `node --check <파일>` 필수.** 실패 시 변경을 되돌린다.
4. **이미 그룹 주석이 있는 파일은 다시 건드리지 마라.**
5. 파일이 매우 단순한 경우 4섹션 중 적용 가능한 것만 표시. 빈 섹션은 생략.

### 2026-05-24 일괄 적용 현황

본 정책의 파일명은 `base.코드스타일-admin-vue.md` 지만 적용 범위는 **BO + FO + 공통 컴포넌트(single-setup)** 전체.

#### 적용 완료 (총 178 파일)

- **BO 121개** (`pages/bo/**/*.js`): `node --check` 121/121 통과, 마커 검증 121/121
  - 도메인별: sy(35) · ec/dp(17) · ec/pm(16) · ec/st(14) · ec/pd(13) · ec/od(10) · ec/mb(6) · ec/cm(5) + zd(2) + bo루트(3)
- **FO 54개** (`pages/fo/**/*.js`): `node --check` 54/54 통과
  - 4섹션 완전 적용 40개, 단순 컴포넌트(handler 면제) 14개
- **공통 컴포넌트 single-setup 8개** (`components/disp/DispX01~04Ui.js`, `components/modals/HelpBoModal.js`, `layout/foApp{Header,Footer,Sidebar}.js`)
  - 4섹션 완전 적용 6개, 단순 컴포넌트(handler 면제) 2개 (`DispX02Area`, `HelpBoModal`)

#### 의도 제외 (총 6 파일 — multi-setup 모음 파일)

한 파일에 여러 작은 컴포넌트 setup()을 묶어둔 모음 파일. setup마다 마커를 일괄 삽입하면 패턴이 어색해지므로 **표준 적용 제외**. 향후 분리 리팩토링 시 재고:

- `components/modals/BoModals.js` (31개 setup)
- `components/comp/BoAreaComp.js` (11)
- `components/comp/FoAreaComp.js` (6)
- `components/comp/BoComp.js` (5)
- `components/comp/BaseComp.js` (3)
- `components/comp/CoWidgetComp.js` (2)
- `components/modals/FoModals.js` (2)
- `layout/foMyLayout.js` (3)

#### 의도 제외 (template 포매팅 위험)

- `base/boApp.js`, `base/foApp.js` — Vue 컴파일 깨짐 위험으로 일반 포매팅도 금지된 파일 ([[boapp_template_no_format]])

#### 추가 작업 (장기)

- 하위 세분 주석 + return 그룹 재정렬은 SyCodeMng.js 1개만 수적 수준 완료. 나머지 177개는 메인 마커만 있음 — 추후 파일 손볼 때 점진적으로 세분 적용.
- 신규 BO/FO 컴포넌트 작성 시 처음부터 위 표준 적용 필수.
- **2026-05-24 추가** — 모든 setup() 함수에 `/* 함수명 — 한글 설명 */` 주석 자동 부여 완료 (183 파일). 자동 매핑 실패한 함수명은 함수명 그대로 보존 → 추후 수작업으로 의미 있는 한글로 다듬을 것. (§4 참조)

#### 단순 컴포넌트 면제 정책

핸들러 함수(`on*`, `handle*`, `do*`, `nav*`, `go*`, `open*`, `close*`, `toggle*`, `select*`, `save*`, `add*`, `delete*`, `cancel*` 등)가 **하나도 없는** 정적 표시 컴포넌트는 "내장 사용 함수" 마커 생략 가능. 정책 §1 "적용 가능한 것만 표시" 조항.

### (구식) 구분선 형식 — 사용 금지

```js
// ── 선언부 ────────────────────────────────────────────────────────────────  ← 폐기
```

위 `// ── 구역명 ─` 형식은 2026-05-24 이전 표준이다. 신규 작성·기존 파일 수정 시 **모두 `// ===== ... =====` 형식으로 통일**한다.

---

## 3. 강조 주석 (`★`)

진입점이 되는 라이프사이클 / 노출 목록처럼 **반드시 눈에 띄어야 하는 위치**는 `★` 접두어를 사용한다.

```js
// ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
onMounted(() => { … });

// ===== return (템플릿 노출) ===============================================
```

---

## 4. 함수 주석 ⭐ (2026-05-24 갱신)

모든 setup() 내부 함수 **바로 위 한 줄**에 `/* 함수명 — 한글 설명 */` 형식 블럭 주석을 작성한다.

### 표준 형식

```js
/* fnLoadCodes — 공통코드 로드 */
const fnLoadCodes = () => { ... };

/* onSearch — 조회 */
const onSearch = async () => { ... };

/* handleSaveGrp — 그룹 저장 */
const handleSaveGrp = async () => { ... };
```

### 규칙

- 함수 정의(`const xxx = () => ...` / `const xxx = async (...) => ...`) **모두**에 주석 부여.
- 함수가 아닌 `reactive`/`ref`/`computed`/`watch` 등 **반응형 변수에는 주석 불요** (정책 §5 변수 인라인 주석 따름).
- 형식: `/* 함수명 — 한글 설명 */` — em-dash `—` 로 구분.
- 한글 설명은 함수명에서 자연스럽게 유추 (`on*` → 이벤트, `handle*` → 처리, `fn*` → 유틸/표시 헬퍼, `cf*` → 파생값).
- 한 줄 블럭 주석만 사용 — 두 줄 이상의 주석 블록은 사용하지 않는다.
- 함수 주석과 함수 정의 사이에는 **빈 줄을 두지 않는다** (마커가 끼어드는 손상 패턴 방지).

### 한글 의무 (영어 주석 금지) ⭐

함수 주석은 **반드시 한글을 포함**해야 한다. 영어/기호만 있는 주석은 폐기.

```js
// ❌ 금지
/* flattenTree — flattenTree */
/* providerLabel — providerLabel */

// ✅ 권장
/* flattenTree — 트리 평탄화 */
/* providerLabel — SNS 공급자 라벨 */
```

### 자동화

`c:/tmp/add_fn_comments.js` 스크립트가 함수명을 한글 라벨로 자동 매핑한다.

**1단계: 접두어 매핑** (긴 접두어 우선) — `on*`/`handle*`/`fn*`/`cf*` 등 약 100개 사전.
**2단계: 단어 분할 fallback** — 매핑 실패 시 함수명을 PascalCase/camelCase 단어로 쪼개고 단어 사전(약 200개)으로 변환.

핵심 매핑 사전:

| 접두어/함수명 | 한글 라벨 |
|---|---|
| `onSearch` | 조회 |
| `onReset` | 초기화 |
| `onCellChange` | 셀 변경 |
| `onDrag*` | 드래그 시작/오버/종료 |
| `onSort` | 정렬 |
| `handleSearchList` | 목록 조회 |
| `handleLoadDetail` | 상세 조회 |
| `handleSave` / `handleSaveGrp` | 저장 / 그룹 저장 |
| `handleDelete` / `handleDeleteGrp` | 삭제 / 그룹 삭제 |
| `handle*` (기타) | 처리 |
| `addRow` / `deleteRow` / `cancelRow` | 행 추가/삭제/취소 |
| `addGrp` / `cancelGrp` / `handleDeleteGrp` | 그룹 추가/취소/삭제 |
| `toggleCheckAll` / `togglePanel` | 전체 체크 토글 / 패널 토글 |
| `openDetail` / `closeDetail` | 상세 열기/닫기 |
| `selectNode` / `selectProduct` | 노드 선택 / 상품 선택 |
| `loadView` / `load*` | 뷰 로드 / 로드 |
| `exportExcel` / `exportCsv` | 엑셀/CSV 내보내기 |
| `fnLoadCodes` | 공통코드 로드 |
| `fnStatusBadge` / `fn*Badge` | 상태 배지 / *배지 |
| `fnRowStyle` / `fnFormatDate` | 행 스타일 / 날짜 포맷 |
| `cfFiltered` / `cf*` | 파생값 |
| `setFocused` / `set*` | 포커스 설정 / 설정 |
| `makeRow` / `make*` | 행 생성 / 생성 |
| `syncGrpDirty` / `sync*` | 그룹 변경 동기화 / 동기화 |
| `code*` (트리/접기/펼치기) | 코드 트리 ... |
| `grp*` | 그룹 ... |

매핑 실패한 함수명은 함수명 그대로 보존 (`/* xxx — xxx */`). 추후 수작업으로 의미 있는 한글로 다듬는다.

### 적용 현황 (2026-05-24 6차 라운드)

- 영어 주석 검출: 346건 → 80건 (2차) → 2건 (3차) → **0건 (최종)**
- 주석 없는 함수: 0건 (5차 라운드에서 이미 모두 부여)
- 최종 검증: BO+FO+공통컴포넌트 184/184 파일 모든 setup() 함수에 한글 블럭주석 부여 완료.

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

## 8. template 구역 주석 ⭐ (2026-05-24 갱신)

template 안의 주요 구역은 HTML 블럭 주석으로 구분한다. 형식은 JS 메인 마커(§1)와 동일한 **`===== 라벨 =====`** 형식으로 통일한다.

### 표준 형식

```html
<!-- ===== ■. 페이지 타이틀 =============================================== -->
<!-- ===== ■. 검색 영역 =================================================== -->
  <!-- ===== ■.■. 검색 영역 내부 그룹 ====================================== -->
<!-- ===== ■. 목록 영역 =================================================== -->
  <!-- ===== ■.■. 툴바 ==================================================== -->
  <!-- ===== ■.■. 테이블 ================================================== -->
    <!-- ===== ■.■.■. 페이징 =============================================== -->
<!-- ===== ■. 상세 패널 (인라인 임베드) ==================================== -->
```

### 작성 규칙

- **블럭 주석 길이 통일**: 들여쓰기 제외 마커 총 길이 **약 75자**로 맞춤. 라벨이 짧을수록 꼬리 `=` 가 길어진다.
- **레벨 기호 (`■.`)** ⭐ — 들여쓰기 깊이에 따라 라벨 앞에 `■.` 접두를 반복.
  - 들여쓰기 0~2 → 레벨 1 → `■.`
  - 들여쓰기 4 → 레벨 2 → `■.■.`
  - 들여쓰기 6 → 레벨 3 → `■.■.■.`
  - 들여쓰기 8 → 레벨 4 → `■.■.■.■.` (이하 반복)
  - **들여쓰기 ÷ 2 = 레벨 수** (단 0~2칸은 모두 레벨 1)
  - **종료 마커**(`/제목`, `/내용` 등 `/` 시작)는 ■ 안 붙임.
- **카드 내부 소구역** (툴바·테이블·페이징·탭 내부)도 들여쓰기 유지 + 같은 형식 + 레벨에 맞는 ■.
- 구역 주석 **위·아래 한 줄** 공백은 선택이지만 일관되게.

### 주요 컴포넌트별 권장 라벨

| 컴포넌트 / 영역 | 권장 라벨 |
|---|---|
| `<div class="page-title">` | `페이지 타이틀` |
| `<bo-search-area>` / `<fo-search-area>` | `검색 영역` |
| `<bo-grid-crud>` | `CRUD 그리드` |
| `<bo-grid>` / `<fo-grid>` | `목록 영역` |
| `<bo-form-area>` / `<fo-form-area>` | `폼 영역` |
| `<bo-path-tree-card>` | `경로 트리` |
| `<bo-modal>` / `<fo-modal>` | `모달` |
| `<*-dtl>` 인라인 임베드 | `상세 패널 (인라인 임베드)` |
| `<table>` | `테이블` |
| 탭 내부 영역 | `XX 탭` (예: `채팅 내용 탭`) |
| `class="card"` 단순 | `카드 영역` |
| `class="card" + v-if="selectedXxx"` | `상세 패널` |
| `class="tab-nav"` / `class="tab-bar-row"` | `탭 영역` |
| `:class="..."` (동적) | `동적 영역` / `탭 컨텐츠` (dtl-tab-grid 포함 시) |

### 루트 1레벨 마커 의무 ⭐

**모든 template 안 최상위 자식(들여쓰기 2)에는 1레벨 마커가 있어야 한다.**
- 단순 wrapper 라도 라벨을 부여하여 화면 구역을 명확히 한다.
- 형제 자식이 여러 개면 각각 라벨링.
- 자동 추론: class/v-if/dynamic class 패턴으로 의미 있는 라벨 부여 (예: `class="card"` → `카드 영역`, `:class="...tab-grid..."` → `탭 컨텐츠`).

### 자동화

- `c:/tmp/convert_template_markers.js` — 구식 `<!-- -- 라벨 ---- -->` / `<!-- ── 라벨 ── -->` 를 신식 `<!-- ===== 라벨 ===== -->` 로 일괄 변환.
- `c:/tmp/add_template_section_comments.js` — 공통 컴포넌트(`<bo-*>` / `<fo-*>` / `<div class="page-title">`) 직전에 표준 라벨 자동 삽입. 이미 신식 주석이 있으면 skip.
- `c:/tmp/pad_template_markers.js` — `<!-- ===== 라벨 ===== -->` 를 `<!-- ===== 라벨 ====...=== -->` (75자 패딩) 로 정렬.
- `c:/tmp/add_level_prefix.js` ⭐ — 들여쓰기 레벨에 따라 라벨 앞에 `■.` 접두 자동 부여 (1레벨=■., 2레벨=■.■., 3레벨=■.■.■., ...) + 75자 패딩 재적용. 종료 마커(`/xxx`)는 제외.
- `c:/tmp/add_root_template_marker.js` ⭐ — template 안에 루트(1레벨) 마커가 전혀 없을 때 첫 번째 자식 직후에 파일명 기반 라벨 자동 삽입 (예: `OdClaimHist.js` → `■. 이력 화면`).
- `c:/tmp/fill_root_markers.js` ⭐ — template 안 들여쓰기 2(루트 자식) 위치에 마커가 없으면 class/v-if/dynamic class를 분석해 의미 있는 1레벨 라벨 자동 채움.

### (구식) 형식 — 사용 금지

```html
<!-- ── 검색 영역 ── -->  ← 폐기
<!-- -- 목록 영역 ---- -->  ← 폐기
```

위 2종 형식은 2026-05-24 이전 표준. 신규 작성·기존 파일 수정 시 모두 `<!-- ===== ... ===== -->` 형식으로 통일.

### 2026-05-24 일괄 적용 현황

- BO+FO+공통컴포넌트 184개 파일 — template 구식 주석 1666건 → 신식 일괄 변환 완료.
- 자동 추가 403건 (공통 컴포넌트 직전 표준 라벨) + `<table>` 위 마커 추가.
- 길이 패딩 + 레벨 기호(`■.`) 168개 파일 적용 완료.
- **루트 1레벨 마커 자동 채움** — template 안 들여쓰기 2(루트 자식) 위치에 마커 없는 곳 142개 파일에 자동 채움.
- 잔존 구식 0건. SYNTAX FAIL 0.
- 최종 신식 마커 수: **2449건** (1666 변환 + 783 자동 추가).

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
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const items   = reactive([]);          // 목록 데이터
    const uiState = reactive({ … });       // 로딩·에러 상태

    // (선택) computed — 허용 케이스에만
    const cfXxx      = computed(() => …);  // 설명
    const isAppReady = computed(() => …);  // 앱 초기화 완료 여부

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    // 앱 준비 완료 시 코드 로드 트리거
    watch(isAppReady, (v) => { if (v) fnLoadCodes(); });

    // 공통코드 로드
    const fnLoadCodes = async () => { … };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { … });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    // --- [이벤트] 검색 / 초기화 ---

    // 조회 버튼 클릭
    const onSearch = async () => { … };

    // --- [데이터 로드] ---

    // 목록 페이징 조회
    const handleSearchList = async () => { … };

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    // --- [컬럼 정의] ---

    const baseSearchColumns = [ … ];
    const baseGridColumns   = [ … ];

    // ===== return (템플릿 노출) ===============================================

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

---

## 12. 소스 코드 포매팅 정책 ⭐ (2026-05-24)

### 12.1 적용 범위

`pages/**/*.js`, `components/**/*.js` 의 모든 Vue 컴포넌트 소스에 다음 포매팅 표준이 적용된다.
포매팅은 의미를 바꾸지 않는 **공백/줄바꿈 정리** 한정이며, 자동화 도구로 일괄 적용한다.

| 영역 | 정책 |
|------|------|
| **`template:` 백틱 내부 HTML** | 부모-자식 깊이별 **2칸 들여쓰기** + 단순 인라인 텍스트 보존(140자 이내 한 줄) + 멀티라인 속성 재들여쓰기 |
| **JavaScript 코드 영역** | **2줄 이상 연속 빈줄 → 1줄로 압축**, 줄 끝 trailing whitespace 제거 |
| **`<style>`/`<script>`/`<pre>`/`<textarea>` 내부** | 원본 그대로 보존(RAW 콘텐츠) |
| **`&` 가 포함된 속성** | 원본 그대로 보존 (§0-A 정책: `&` 절대 분리 금지) |

### 12.2 제외 파일

- `base/boApp.js`, `base/foApp.js` — 앱 부트스트랩. template 백틱이 Vue 컴파일러에 의해 특수하게
  파싱되므로 **자동 포매팅 금지**. 직접 수정 시에도 줄바꿈/들여쓰기를 임의로 바꾸지 말 것.
- `assets/cdn/**` — 외부 라이브러리(Vue, Pinia, axios, Yup 등). 절대 수정하지 않는다.

### 12.3 검증 게이트 (포매팅 도구가 자동 수행)

포매팅 적용 후 다음 검증이 **모두 통과**할 때만 변경을 보존한다 (실패 시 자동 롤백).

1. **`node --check <file>`** — 구문 오류 없음
2. **렌더 동등성** (template 내부):
   - 포매팅 전/후의 토큰 시퀀스(태그 순서·텍스트 내용·속성)가 동일
   - `<style>`/`<script>` 콘텐츠는 공백 정규화 후 동일
3. **JS 토큰 동등성**:
   - 주석·공백을 제외한 토큰 스트림이 포매팅 전/후 동일

### 12.4 표준 도구

| 도구 | 위치 | 역할 |
|------|------|------|
| `template_format2.js` | (외부 보관) | template 백틱 내부 HTML 정렬 + 렌더 동등성 검증 |
| `js_format.js` | (외부 보관) | JS 코드 영역의 빈줄 압축 / trailing-ws 제거 + 토큰 동등성 검증 |

운영 원칙:
- 신규/수정 컴포넌트는 커밋 전에 두 도구를 통과해야 한다.
- 일반 IDE 포매터(Prettier 등)는 **금지** — 속성값 `&&` 분리, 단순 인라인 텍스트 강제 줄바꿈 등으로
  Vue 런타임 컴파일러를 크래시시키거나 렌더 결과가 달라질 수 있다. 본 정책 도구만 사용한다.

### 12.5 금지 / 권장 패턴 요약

```js
// ✅ 권장 — 함수 간 1줄 빈줄
const fnA = () => { ... };

const fnB = () => { ... };

// ❌ 금지 — 2줄 이상 빈줄 (자동으로 1줄로 압축됨)
const fnA = () => { ... };



const fnB = () => { ... };
```

```html
<!-- ✅ 권장 — 단순 인라인 텍스트는 한 줄 -->
<div class="page-title">관리자</div>

<!-- ❌ 비권장 — 단순 텍스트의 강제 줄바꿈 (포매터가 인라인으로 복원) -->
<div class="page-title">
  관리자
</div>
```

```html
<!-- ✅ 권장 — 멀티라인 속성은 부모 깊이 + 1칸 들여쓰기 -->
<div>
  <bo-grid-crud
    :columns="baseGridColumns"
    :rows="gridRows"
    row-key="id">
  </bo-grid-crud>
</div>

<!-- ❌ 비권장 — 들여쓰기 어긋남 (포매터가 자동 정렬) -->
<div>
<bo-grid-crud
:columns="baseGridColumns"
    :rows="gridRows"
   row-key="id">
</bo-grid-crud>
</div>
```

### 12.6 적용 이력

- **2026-05-24 일괄 적용** — `pages/**/*.js`, `components/**/*.js` 총 **193개 template 정렬 + 194개 JS 정렬** 완료.
  - template 포매팅: 192 변경 / 1 변경 불필요 / 0 실패
  - JS 포매팅: 179 변경 / 15 변경 불필요 / 0 실패
  - 모두 `node --check` 통과 + 토큰 동등성 검증 통과
  - `boApp.js` 예외 적용 (자동 포매팅 제외)


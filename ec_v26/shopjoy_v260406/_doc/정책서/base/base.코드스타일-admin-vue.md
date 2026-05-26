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

## ⛔ 0-B. 템플릿 속성값 인라인 객체에 따옴표 이스케이프(`\"` / `\'`) 금지 ⭐ (런타임 컴파일 크래시)

### 증상

특정 컴포넌트(`BaseHtmlEditor` 등)를 자식으로 마운트하려는 순간 **Vue 컴파일 단계에서**
다음 에러로 화면 자체가 깨진다.

```
SyntaxError: Unexpected token ')'
  at new Function (<anonymous>)
  at Uu (vue.global.prod.js:11:65058)
  ...
```

콘솔에 다른 에러는 안 보이고, 부모(Mng) 화면은 정상인데 **자식 Dtl/컴포넌트가 mount 시도하는
순간**에만 발생. 부모 메뉴를 다른 곳으로 옮겨도 `<keep-alive>` 같은 잔류 효과로 화면이
박혀 보일 수 있다.

### 원인

Vue 의 template 파서는 `:style="{ ... }"` 같은 **속성값 안에 들어간 객체 리터럴**을
**JavaScript 표현식**으로 컴파일해 `new Function('with(this){...}')` 로 평가한다.
이때 속성값 자체가 **백틱 template literal**(`` template: /* html */`...` ``) 안에 정의되어
있으면, **JS 이스케이프(`\"`, `\'`) + HTML 속성 이스케이프 + Vue 표현식 파서**가 3중으로 충돌해
컴파일된 코드의 따옴표 매칭이 깨지고 `Unexpected token ')'` 가 발생한다.

> 검증 완료(BaseHtmlEditor textarea):
> `:style="{ ..., fontFamily:\"'Consolas','D2Coding',monospace\", ... }"` — **크래시**
> → `cfTextareaStyle` computed 로 분리 후 정상.

### 금지 / 대체

| 구분 | ❌ 금지 (속성값 내) | ✅ 대체 |
|---|---|---|
| 인라인 객체에 `\"` | `:style="{ fontFamily:\"'A','B'\" }"` | setup 에 `cfXxxStyle = computed(() => ({ fontFamily: \"'A','B'\" }))` 후 `:style="cfXxxStyle"` |
| 인라인 객체에 `\'` | `:title="\\'X\\'"` 등 백슬래시가 섞인 패턴 | 일반 텍스트면 `:title="form.x"` / 가공 필요하면 computed 분리 |
| 인라인 객체에 중첩 따옴표 | `:class="{ 'a-b': cond }"` (외부 `"` + 내부 `'` 정상) | **이건 OK** — 백슬래시 없이 단순 중첩만 허용 |

### 안전 규칙

1. **단순 문자열 스타일**: `style="font-size:12px;color:#333;"` (정적 문자열) 은 그대로 OK
2. **단순 동적 바인딩**: `:style="form.style"` / `:class="cfClass"` 처럼 식별자만 가리키면 OK
3. **인라인 객체에 백슬래시 이스케이프가 필요한 순간** → setup 에서 객체/computed 로 분리

> 일반 규칙: **`\"` 또는 `\'` 가 속성값 안에 등장한다면 무조건 분리**.
> 백틱 template literal 안에서 JS 이스케이프와 Vue 표현식 파서가 충돌할 위험이 항상 있다.

### 점검 명령

```bash
# 속성값 안에 백슬래시 이스케이프된 따옴표가 들어있는지
grep -nE '(:[a-zA-Z-]+|v-[a-z]+|@[a-z.]+)="[^"]*\\\\["\x27]' pages/bo/**/*.js components/**/*.js
```

결과가 있으면 위반. 신규/수정 컴포넌트는 작성 후 위 grep 으로 0건임을 확인한다.

### 재발 사례(2026-05-26)

- **현상**: 공지사항관리(수정/신규) 클릭 시 `SyntaxError: Unexpected token ')'` 로 화면이 깨지고
  다른 시스템 메뉴로 이동해도 화면이 박힘.
- **원인 추적**: CmNoticeDtl 의 template 를 단계적으로 줄여서 좁힌 결과,
  `<base-html-editor>` 자체가 mount 시 깨짐 → BaseHtmlEditor textarea 의
  `:style="{ ..., fontFamily:\"'Consolas','D2Coding',monospace\", ... }"` 가 원인.
- **수정**: `components/comp/BaseComp.js` 의 BaseHtmlEditor 에 `cfTextareaStyle` computed 추가,
  template 는 `:style="cfTextareaStyle"` 로 변경.

---

## ⛔ 0-C. 파일 업로드·삭제·HMR 의심 증상 → 우선 VS Code Live Server 끄고 테스트 ⭐

### 증상

- 파일 첨부 추가/삭제 직후 **브라우저 화면 전체가 자동 새로고침**
- 폼 입력 중 작성하던 값이 갑자기 사라지고 화면이 처음 상태로 돌아감
- 콘솔에 **에러 메시지가 전혀 없음** — 그냥 조용히 페이지가 리로드
- Vue 코드 상에는 `location.reload()` / `<form>` / `<a href>` / 페이지 이동 호출이 전혀 없는데도 발생

### 원인

VS Code **Live Server** 확장의 chokidar watcher 가 워크스페이스 안의 파일 변경을 감지하면
브라우저를 자동 리로드한다. **백엔드(EcAdminApi)가 업로드된 파일을 워크스페이스 내부 디렉토리**에
저장하면 이 변경이 감지되어 화면이 통째로 새로고침된다.

검증 완료(2026-05-26):
- 실제 저장 경로: `_apps_be/EcAdminApi/bin/main/static/cdn/attach/{businessCode}/{yyyy}/...`
- `liveServer.settings.ignoreFiles` 에 `**/bin/**` / `**/static/cdn/**` / `**/cdn/**` /
  이미지 확장자 등을 추가해도 **여전히 리프레시 발생** — Live Server 의 ignore 규칙이
  부모 디렉토리 watch 와 충돌하여 효과 없음.
- Live Server 자체를 끄면 → **추가·삭제 모두 리프레시 없음**.

### 진단 절차 (Live Server 의심 시)

1. **VS Code 하단 "Port: 5501" 클릭해서 Live Server 끄기**
2. 브라우저 주소창에 직접 워크스페이스의 `bo.html` 을 `file://` 또는 다른 정적 서버로 열기
3. 같은 시나리오 재현 시 리프레시가 **없으면 → Live Server 가 원인**
4. 리프레시가 **여전히 발생하면** → 다른 원인(`<form>` submit, `api-error` 핸들러, location 조작 등)

### 운영 가이드

- **메인 개발은 Live Server OFF** 권장. 파일 변경 후 브라우저 수동 새로고침(`Ctrl+R`).
- 코드 수정 후 즉시 반영이 필요할 때만 Live Server ON.
- 업로드·삭제 기능을 테스트할 때는 **반드시 Live Server OFF**.

### 재발 사례(2026-05-26)

- **현상**: 공지사항/사용자관리 첨부파일 추가·삭제 시, 사진 변경 시 화면 전체 리프레시.
  콘솔 에러 없음. Network 탭에 `bo.html` GET 이 다시 발생.
- **원인 추적**: `find ... -path "*NOTICE_ATTACH*"` 로 실제 업로드 파일 위치를 찾아
  `_apps_be/EcAdminApi/bin/main/static/cdn/...` 임을 확인. ignore 패턴 추가해도 해결 안 됨.
  Live Server OFF 후 정상 동작.
- **장기 해결안**(아직 미적용): `application-local.yml` 의 `app.file.local.physical-root` 를
  워크스페이스 외부 경로(예: `C:/_shopjoy_uploads/cdn`)로 변경하면 Live Server ON 상태에서도
  안전. 현재는 운영 가이드(필요할 때만 Live Server)로 운영.

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

## 1. setup() 내부 구역 순서 ⭐ (2026-05-25 갱신 — 6섹션 [01]~[06])

`setup()` 함수 안은 **6개 메인 섹션** 형식으로 구역을 구분한다. 각 마커에 **번호 [01]~[06]** 부여. 기준 파일: [`pages/bo/sy/SyRoleMng.js`](../../../pages/bo/sy/SyRoleMng.js), [`pages/fo/xs/Sample05.js`](../../../pages/fo/xs/Sample05.js).

### 6섹션 표준 (필수)

```js
setup(props) {
  // ===== [01] 초기 변수 정의 ====================================================
  // (Vue 분해, window.boApp.* 참조, reactive/ref/const, 상수, 임시 ID, 매핑)
  // 데이터 변환 헬퍼 (toRow/toPayload/makeRow) 도 이 영역
  // 페이지네이션 reactive 도 이 영역
  // 토스트 reactive + showToast 헬퍼도 이 영역 (변수 + 1:1 setter)

  // ===== [02] 액션 모음 (dispatch) ==============================================
  // handleBtnAction / handleSelectAction
  // 다른 모든 함수보다 앞 (closure 로 비즈니스 함수 참조)

  // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================
  // fnLoadCodes / isAppReady / watch / onMounted

  // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================
  // handleSearchList / handleSave / onCellChange / addRow / deleteRow / cancelRow
  // 드래그 (onDragStart/Over/End) / toggleCheckAll / onRowCancel / onRowDelete
  // openDtl / closeDtl / inlineNavigate 등

  // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================
  // fnStatusBadge / rowBg / cf* (computed) / 정렬 헬퍼 / 트리 빌드
  // baseSearchColumns / baseGridColumns / baseFormColumns

  // ===== [06] return (템플릿 노출) ==============================================
  return {
    uiState, codes, searchParam, ...,           // 상태 / 데이터
    baseSearchColumns, baseGridColumns,         // 컬럼 정의
    handleBtnAction, handleSelectAction,        // dispatch
    cfXxx, cfYyy,                                // computed
    fnXxx, fnYyy,                                // 헬퍼
  };
}
```

### [01]~[06] 번호 부여 규칙 ⭐ (2026-05-25)

- 각 섹션 마커는 **`// ===== [NN] 라벨 ====...`** 형식 (NN = 2자리 영숫자)
- 빠진 섹션이 있더라도 번호는 그대로 유지 (예: dispatch 가 없는 단순 컴포넌트는 [02] 생략, 다른 섹션 번호는 [03]/[04]/[05]/[06] 유지)
- **191개 파일 일괄 적용 완료** (2026-05-25, 자동 도구 `c:/tmp/migrate_section_numbers.js`)
- 마커는 자동으로 padding 처리 (78~79자 길이)

### ⛔ 변수 선언 위치 엄격화 ⭐ (2026-05-25)

**모든 `reactive` / `ref` / `const` 변수 선언은 "초기 변수 정의" 섹션 안에만 둔다.**

```js
// ❌ 금지 — 변수가 다른 섹션에 흩어짐
setup() {
  // ===== 초기 변수 정의 =====
  const uiState = reactive({ ... });

  // ===== 초기 함수 =====
  const CD_GRP = 'S05_BOARD';            // ❌ 변수가 초기 함수 영역에
  const searchParam = reactive({ ... }); // ❌
  const gridRows = reactive([]);         // ❌
  const fnLoadCodes = () => { ... };
}

// ✅ 권장 — 모든 변수가 "초기 변수 정의" 안에
setup() {
  // ===== 초기 변수 정의 =====
  const uiState = reactive({ ... });
  const CD_GRP = 'S05_BOARD';
  const searchParam = reactive({ ... });
  const gridRows = reactive([]);
  const toast = reactive({ show: false });

  /* showToast — 토스트 setter (변수와 짝) */
  const showToast = (msg, type) => { ... };

  /* handleBtnAction */
  const handleBtnAction = (cmd, param = {}) => { ... };

  // ===== 초기 함수 =====
  const fnLoadCodes = () => { ... };
  onMounted(() => { ... });
}
```

**예외**: 변수와 1:1로 짝을 이루는 setter/util (예: `toast` reactive + `showToast`) 는 변수 바로 아래 같은 영역에 둔다.

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

### 표준 형식 ⭐ (2026-05-24 기호 변경)

```html
<!-- ===== ■. 페이지 타이틀 =============================================== -->
<!-- ===== ■. 검색 영역 =================================================== -->
  <!-- ===== ■.■. 검색 영역 내부 그룹 ====================================== -->
<!-- ===== □. 검색 영역 =================================================== -->
<!-- ===== ■. 목록 영역 =================================================== -->
  <!-- ===== ■.■. 툴바 ==================================================== -->
  <!-- ===== ■.■. 테이블 ================================================== -->
    <!-- ===== ■.■.■. 페이징 =============================================== -->
  <!-- ===== □.□. 테이블 ================================================== -->
<!-- ===== □. 목록 영역 =================================================== -->
<!-- ===== ■. 상세 패널 (인라인 임베드) ==================================== -->
<!-- ===== □. 상세 패널 (인라인 임베드) ==================================== -->
```

### 작성 규칙

- **블럭 주석 길이 통일**: 들여쓰기 제외 마커 총 길이 **약 75자**로 맞춤. 라벨이 짧을수록 꼬리 `=` 가 길어진다.
- **레벨 기호** ⭐ (2026-05-24 갱신) — 들여쓰기 깊이에 따라 `■.`(시작) 또는 `□.`(종료) 단위를 레벨 수만큼 반복.
  - **시작 마커** (`■.` 단위 반복, 점은 매 기호 사이):
    - 들여쓰기 0~2 → 레벨 1 → `■.`
    - 들여쓰기 4 → 레벨 2 → `■.■.`
    - 들여쓰기 6 → 레벨 3 → `■.■.■.`
    - 들여쓰기 8 → 레벨 4 → `■.■.■.■.` (이하 반복)
  - **종료 마커** (`□.` 단위 반복, 1·2레벨만 — 3레벨 이상은 종료 마커 안 붙임):
    - 레벨 1 → `□.`
    - 레벨 2 → `□.□.`
    - **종료 마커의 레벨은 매칭되는 시작 마커의 레벨을 따름** (들여쓰기와 무관). 예: 들여쓰기가 6이라도 매칭 시작이 1레벨이면 종료는 `□.` 1개.
  - **들여쓰기 ÷ 2 = 레벨 수** (단 0~2칸은 모두 레벨 1)
  - **단일 자식 영역 종료 생략** — 시작 마커와 종료 위치가 3줄 이내(단일 컴포넌트 + 자식 없음)이면 종료 마커 생략 (예: `<div class="page-title">제목</div>` 한 줄).
  - **부정합 정리** — 같은 라벨의 시작 마커가 부모(레벨 N) - 자식(레벨 N+1) 형태로 5줄 이내 연속 나오면 자식 제거 (중복 무의미).
  - 구식 `▶./▶▶.` / `◤./◤◤.` 등 형식은 **폐기** (2026-05-24 ■./□. 점 매 기호 사이 형식으로 최종 통일).
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

### 큰 블록 쪼개기 ⭐

**마커 간 50줄 이상의 큰 블록은 중간 단위 마커로 쪼갠다.**
- `<table>` 안 `<thead>` / `<tbody>` 위에 추가 마커.
- 같은 들여쓰기 또는 +6까지의 형제 요소를 찾아 자동 라벨 부여.
- 추가 마커 간 최소 거리는 약 30줄 (너무 잦은 마커 방지).
- 자동화 도구: `c:/tmp/split_large_blocks.js` — 50줄+ 갭 검출 + 형제 요소에 마커 자동 삽입.

### 종료 주석 의무 ⭐ (2026-05-24)

**1·2레벨 시작 마커는 종료 주석 의무.** 3레벨 이상은 선택.

```html
<!-- ===== ■. 검색 영역 ===== -->
  ... (구역 내용) ...
<!-- ===== □. 검색 영역 ===== -->
```

- 종료 마커 위치: **다음 동일 또는 더 얕은 레벨의 시작 마커 직전** (또는 template 끝).
- 라벨은 시작과 정확히 동일.
- 들여쓰기는 시작 마커와 동일.
- 자동화 도구: `c:/tmp/add_close_markers.js`

### 일반 HTML 주석 변환 ⭐

**기존의 일반 HTML 주석(`<!-- 라벨 -->`)도 신식 마커로 변환한다.**
```html
<!-- 처리 정보 (BoFormArea 자동 렌더) -->     ← 변환 대상
↓
<!-- ===== ■.■. 처리 정보 (BoFormArea 자동 렌더) ===== -->
```
- 한 줄 단독 주석만 변환 (인라인/멀티라인 주석은 보존).
- 60자 이내 + 한글 포함 라벨만 대상 (eslint-disable, 조건부 주석, TODO 등은 보존).
- 자동화 도구: `c:/tmp/convert_plain_html_comments.js`

### 자동화

- `c:/tmp/convert_template_markers.js` — 구식 `<!-- -- 라벨 ---- -->` / `<!-- ── 라벨 ── -->` 를 신식 `<!-- ===== 라벨 ===== -->` 로 일괄 변환.
- `c:/tmp/add_template_section_comments.js` — 공통 컴포넌트(`<bo-*>` / `<fo-*>` / `<div class="page-title">`) 직전에 표준 라벨 자동 삽입. 이미 신식 주석이 있으면 skip.
- `c:/tmp/pad_template_markers.js` — `<!-- ===== 라벨 ===== -->` 를 `<!-- ===== 라벨 ====...=== -->` (75자 패딩) 로 정렬.
- `c:/tmp/add_level_prefix.js` ⭐ — 들여쓰기 레벨에 따라 라벨 앞에 `■.` 접두 자동 부여 (1레벨=■., 2레벨=■.■., 3레벨=■.■.■., ...) + 75자 패딩 재적용. 종료 마커(`/xxx`)는 제외.
- `c:/tmp/add_root_template_marker.js` ⭐ — template 안에 루트(1레벨) 마커가 전혀 없을 때 첫 번째 자식 직후에 파일명 기반 라벨 자동 삽입 (예: `OdClaimHist.js` → `■. 이력 화면`).
- `c:/tmp/fill_root_markers.js` ⭐ — template 안 들여쓰기 2(루트 자식) 위치에 마커가 없으면 class/v-if/dynamic class를 분석해 의미 있는 1레벨 라벨 자동 채움.
- `c:/tmp/split_large_blocks.js` ⭐ — 마커 간 50줄+ 큰 블록을 형제 요소에서 자동으로 쪼개 추가 마커 삽입 (3차 반복 적용 → +160 markers).
- `c:/tmp/convert_plain_html_comments.js` ⭐ — 기존 일반 HTML 주석 `<!-- 라벨 -->` 한 줄 단독 주석을 신식 마커 `<!-- ===== ■.... 라벨 ===== -->` 로 변환 (416건 변환).
- `c:/tmp/dedupe_template_markers.js` ⭐ — 같은 라벨이 3줄 안에 반복되면 첫 마커 제거 (뒤 마커 유지 — 실제 코드 직전 위치가 더 정확). 자동 마커 삽입 도구 여러 개를 반복 적용한 부작용 정리용.
- `c:/tmp/add_close_markers.js` ⭐ — 1·2레벨 시작 마커 뒤에 종료 마커(`□`) 자동 삽입. 종료 위치는 다음 동일 또는 더 얕은 레벨의 시작 마커 직전.
- `c:/tmp/migrate_marker_symbols.js` ⭐ — 마커 기호 일괄 변환. 구식 `■.`/`□.□.` → 중간식 `◤`/`◢` → 신식 `■■■.`/`□□□.` 형식. 점은 마지막에 1개.
- `c:/tmp/rebuild_markers.js` ⭐⭐ — template 마커 전면 재구성. (1) 기존 종료 마커 모두 제거 (2) 시작 마커 기호 ■로 통일 (3) 1·2레벨 시작에만 종료 □ 재삽입 (종료 레벨은 매칭 시작 레벨 따라감). 가장 권장.

### (구식) 형식 — 사용 금지

```html
<!-- ── 검색 영역 ── -->  ← 폐기
<!-- -- 목록 영역 ---- -->  ← 폐기
```

위 2종 형식은 2026-05-24 이전 표준. 신규 작성·기존 파일 수정 시 모두 `<!-- ===== ... ===== -->` 형식으로 통일.

### 2026-05-24 일괄 적용 현황

- BO+FO+공통컴포넌트 184개 파일 — template 구식 주석 1666건 → 신식 일괄 변환 완료.
- 자동 추가 403건 (공통 컴포넌트 직전 표준 라벨) + `<table>` 위 마커 추가.
- 길이 패딩 + 레벨 기호(`■.`) 적용 완료.
- 루트 1레벨 마커 자동 채움 — 142개 파일.
- **큰 블록 쪼개기** — 50줄+ 갭 60+개 검출 → 38개 파일에 +160 markers 자동 추가 (잔존 11건).
- **일반 HTML 주석 변환** — 69개 파일에서 416건 변환 (`<!-- 라벨 -->` → `<!-- ===== ■.... 라벨 ===== -->`).
- **연속 중복 마커 제거** — 18개 파일에서 36건 중복 제거 (자동 도구 반복 적용 부작용).
- **종료 주석 자동 삽입** — 1·2레벨만, 종료 레벨은 매칭 시작 레벨 따라감.
- **기호 규칙 통일** — 시작 `■.`/`■.■.`/`■.■.■.` · 종료 `□.`/`□.□.` (점 매 기호 사이). 178개 파일 일괄 변환.
- **부정합 정리** — 부모-자식 중복 라벨 제거 + 단일 자식 영역 종료 생략.
- 잔존 구식 0건. SYNTAX FAIL 0. 잔존 중복 0건.
- **최종 마커 수: 4092건** (시작 ■ 2869 + 종료 □ 1223).

---

## 9. BO/FO API 호출 표준 ⭐ (2026-05-25 갱신)

### 9.0 API 클라이언트 선택 — 절대 규칙

**모든 API 호출은 `boApiSvc` / `foApiSvc` (services 등록된 GET) 또는 `boApi` / `foApi` (axios 래퍼) 만 사용한다.**

| 환경 | services 객체 | axios 래퍼 |
|---|---|---|
| BO (`bo.html`) | `boApiSvc.{도메인}.{메서드}` | `boApi.get/post/put/delete/patch` |
| FO (`index.html`) | `foApiSvc.{도메인}.{메서드}` / `coApiSvc.{도메인}.{메서드}` | `foApi.get/post/put/delete/patch` |

#### ⛔ 금지 패턴 ⭐ (2026-05-25)

**`window.adminApi` / `window.axiosApi` / `window.frontApi` 는 폐기됨**. 절대 사용 금지.

```js
// ❌ 폐기 (전부 제거됨) — 모두 BO=boApi / FO=foApi 로 대체
const api = window.adminApi;                        // 폐기
const api = window.axiosApi;                        // 폐기
const api = window.frontApi;                        // 폐기
const api = window.axiosApi || window.adminApi;     // 폐기 (fallback)

// ❌ 폐기 — URL 을 변수로 정의 (추적성 저하)
const API = 'api/base/sy/zz-sample1';
await foApi.get(API, { cdGrp });
await foApi.post(`${API}/${id}`, body);

// ❌ 폐기 — adminApiCall 헬퍼
await window.adminApiCall({ method: 'post', path: 'resource/x', data, ... });
```

`adminApi` / `axiosApi` / `frontApi` 식별자는 소스코드 / 정책서에서 전부 제거됨 (2026-05-25). 검색 시 0건이어야 함.

#### ✅ 권장 패턴

```js
// ✅ services/ 에 등록된 경우 (GET 위주) — uiNm/cmdNm 자동 헤더
const res = await boApiSvc.syCode.getPage({ codeGrp: 'USE_YN' }, '공통코드관리', '목록조회');

// ✅ services/ 에 등록 안 된 경우 (POST/PUT/DELETE 등 변경성) — URL 직접
await boApi.post('/bo/sy/code', body, coUtil.apiHdr('공통코드관리', '등록'));
await boApi.put(`/bo/sy/code/${id}`, body, coUtil.apiHdr('공통코드관리', '수정'));
await boApi.delete(`/bo/sy/code/${id}`, coUtil.apiHdr('공통코드관리', '삭제'));

// ✅ FO 도 동일
const res = await foApi.get('api/base/sy/zz-sample1', { params: { cdGrp: 'S05_BOARD' } });
await foApi.post('api/base/sy/zz-sample1', body);
```

#### 이유

- **`api/`/`API` 변수 정의 금지** — URL 이 변수에 묻혀 grep 시 추적 불가능. 코드 리뷰 시 어떤 엔드포인트 호출인지 즉시 확인 가능해야 함
- **`boApiSvc` 우선** — services 에 등록하면 X-UI-Nm/X-Cmd-Nm 헤더 + 도메인 그룹핑 자동
- **`window.axiosApi || window.adminApi` fallback 금지** — BO/FO 경계 흐림, 환경별 의도 명확화 필요

#### services 등록 권장 vs 페이지 직접 호출 허용

| 케이스 | 위치 |
|---|---|
| GET 조회 | **services/ 에 등록** (`boApiSvc.xxx.getXxx`) |
| POST/PUT/DELETE/PATCH (변경성) | **페이지 파일에서 직접** (`boApi.post(url, body, coUtil.apiHdr(...))`) |
| FO 의 `/api/base/xxx` (샘플/디버깅용) | 페이지에서 `foApi.get(url, { params })` 직접 |

---

## 9.1 BO API 변경성 호출 필수 헤더 (`X-UI-Nm`, `X-Cmd-Nm`)

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
- **2026-05-24 SyRoleMng.js 재정렬** — dispatch 패턴(§14) 도입 후속 포매팅 재적용.
  - `template_format.js`: template HTML 정렬 OK (1/1 변경)
  - `js_format_simple.js`: JS 영역 NO CHANGE (이미 빈줄 압축/trailing ws 정리 완료 상태)
  - `node --check` PASS

### 12.7 표준 도구 부재 시 대체 (참고)

외부 보관 도구(`template_format2.js`, `js_format.js`)에 접근할 수 없는 환경에서는
다음 동등한 보수적 스크립트로 대체할 수 있다 (정책 §12.1/§12.3 동일 보존):

- `c:/tmp/template_format.js` — template 백틱 내부 HTML 정렬 (깊이별 2칸 들여쓰기 + 단순 인라인 텍스트 보존). 렌더 동등성은 `node --check` 로 최소 검증.
- `c:/tmp/js_format_simple.js` — JS 영역의 3+ 연속 빈줄 → 1 빈줄 압축 + trailing whitespace 제거. `template:` 백틱 영역은 마스킹 후 보존.

> ⚠️ 어디까지나 임시 대체. 정식 검증 게이트(토큰 동등성 + 렌더 동등성)는 외부 표준 도구를 사용한다.
> 일반 IDE 포매터(Prettier 등)는 §12.4 에 따라 여전히 **금지**.

---

## 13. 조건문/반복문 블록 `{ }` 강제 ⭐ (2026-05-24)

**모든 조건문/반복문은 본문이 한 줄이라도 블록 `{ }` 로 감싼다.**

### 예시

```js
// ✅ 권장 — 한 줄 본문도 블록
if (cond) { doX(); }
if (cond) { return value; }
for (const x of list) { use(x); }
while (cond) { tick(); }
if (cond) { doX(); } else { doY(); }

// ❌ 비권장 — 블록 없는 단일 statement
if (cond) doX();
if (cond) return value;
for (const x of list) use(x);
```

### 이유

- **버그 예방** — 본문이 한 줄일 때 누군가 두 번째 statement 를 추가하면 들여쓰기는 그대로지만 의미는 바뀌는 dangling-else 류 버그.
- **diff 가독성** — 본문이 늘어날 때 블록 추가 노이즈가 없음.
- **자동 변환 도구 안전** — regex 기반 자동 변환이 한 줄 if 의 본문을 잘못 매치하는 사고 방지.
- **린터/포매터 일관성** — eslint `curly: 'all'`, prettier 등 표준 도구의 기본값.

### 자동화

- `c:/tmp/force_block_statements.js` ⭐ — `if/else if/for/while` 단일 라인 본문에 `{ }` 자동 적용. paren balancing + 문자열 리터럴 회피 + 한 줄 if-else / 멀티 statement 라인 안전 skip.
- 2026-05-24 일괄 적용: BO+FO+공통컴포넌트 197개 파일 (+약 2861 blocks). `node --check` 184/184 통과.

### 예외 (수작업으로 유지)

- **한 줄 if-else** 동일 라인: `if (cond) a; else b;` — 자동 변환 위험으로 skip. 의도적으로 두는 케이스만 허용. 가능하면 두 줄로 분리 후 블록화 권장.
- template 백틱 안의 HTML/Vue 표현식은 변환 대상 X.

---

## 14. cmd dispatch 패턴 (`handleBtnAction` / `handleSelectAction`) ⭐ (2026-05-24)

화면 안의 모든 버튼/이벤트/행 액션을 **단일 dispatch 함수로 라우팅**하는 패턴. 기준 파일: [`pages/bo/sy/SyRoleMng.js`](../../../pages/bo/sy/SyRoleMng.js)

### 명명 근거

- **함수명**: `handle*` prefix — §7 "이벤트 처리 로직 함수" 정의에 부합.
- **cmd 값**: `{영역명}-기능명` (영역명 camelCase, 기능명 kebab-case)
  - **`base*` prefix 사용 안 함** ⭐ (2026-05-24 갱신) — `baseGrid` / `baseTree` 같은 추상 prefix 대신 **데이터/도메인 명사 기반** 영역명
  - 영역명은 가능하면 setup() 안 reactive 변수명과 일치 (예: `roles`, `roleMenus`, `roleUsers`) → 코드 추적 용이
- **분리 이유**: cmd 가 `'roles-save'` 면 어떤 데이터를 다루는지 즉시 인지, dispatch 로직과 reactive 데이터가 시각적으로 연결.

### 설계 (SyRoleMng 최종 형태)

각 `if` 위에 **무엇을 하는지 한글 주석** 한 줄을 붙여 가독성/디버깅 추적성을 높인다.

```js
/* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
const handleBtnAction = (cmd, param = {}) => {
  console.log(' ■■ SyRoleMng.js : handleBtnAction -> ', cmd, param);
  // 검색조건으로 목록 조회
  if (cmd === 'searchParam-list') {
    return handleSearchList('DEFAULT');
  // 검색조건 초기화 + 재조회
  } else if (cmd === 'searchParam-reset') {
    Object.assign(searchParam, _initSearchParam());
    return handleSearchList();
  // 역할 그리드 저장
  } else if (cmd === 'roles-save') {
    return handleSave();
  } else if (cmd === 'roles-add') {
    return addRow();
  } else if (cmd === 'roles-delete-checked') {
    return deleteRows();
  } else if (cmd === 'roles-cancel-checked') {
    return cancelChecked();
  } else if (cmd === 'roles-excel') {
    return exportExcel();
  } else if (cmd === 'roles-reload') {
    return handleSearchList('RELOAD');
  } else if (cmd === 'config-save') {
    return handleSaveRoleConfig();
  } else if (cmd === 'pathTree-expand-all') {
    const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); };
    walk(cfTree.value);
    return;
  } else if (cmd === 'pathTree-collapse-all') {
    expanded.clear();
    expanded.add('');
    return;
  } else if (cmd === 'pathTree-cat-change') {
    return handleSearchList();
  } else if (cmd === 'pathTree-toggle') {
    if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
    return;
  } else if (cmd === 'roleMenus-toggle-all') {
    return setAllMenuPerm(param ? '읽기' : '없음');
  } else if (cmd === 'roleMenus-set-all') {
    return setAllMenuPerm(param);
  } else if (cmd === 'roleUsers-open-select') {
    uiState.userSelectOpen = true;
    return;
  } else if (cmd === 'roleUsers-close-select') {
    uiState.userSelectOpen = false;
    return;
  } else if (cmd === 'parentModal-close') {
    roleTreeModal.show = false;
    return;
  } else if (cmd === 'pathModal-close') {
    pathPickModal.show = false;
    pathPickModal.row = null;
    return;
  } else {
    console.warn('[handleBtnAction] unknown cmd:', cmd);
  }
};

/* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '영역명-기능명'). 5줄 이하 짧은 로직은 인라인 */
const handleSelectAction = (cmd, param = {}) => {
  console.log(' ■■ SyRoleMng.js : handleSelectAction -> ', cmd, param);
  if (cmd === 'roles-row-edit') {
    return handleLoadRoleDetail(param);
  } else if (cmd === 'roles-row-delete') {
    return deleteRow(param);
  } else if (cmd === 'roles-row-cancel') {
    return cancelRow(param);
  } else if (cmd === 'roles-row-cell-change') {
    return onCellChange(param);
  } else if (cmd === 'roles-row-check-all') {
    gridRows.forEach(r => { r._row_check = uiState.checkAll; });
    return;
  } else if (cmd === 'roles-row-open-setting') {
    return onOpenSetting(param);
  } else if (cmd === 'parentModal-open') {
    return openParentModal(param);
  } else if (cmd === 'pathTree-select') {
    uiState.selectedPath = param;
    return handleSearchList();
  } else if (cmd === 'roleMenus-set') {
    return setMenuPerm(param.menuId, param.perm);
  } else if (cmd === 'roleUsers-remove') {
    if (!uiState.selectedRoleId) { return; }
    const idx = roleUsers.findIndex(x => x.roleId === uiState.selectedRoleId && x.boUserId === param);
    if (idx !== -1) { roleUsers.splice(idx, 1); }
    return;
  } else if (cmd === 'roleUsers-select') {
    return onUserSelect(param);
  } else if (cmd === 'parentModal-select') {
    if (roleTreeModal.targetRow) {
      roleTreeModal.targetRow.parentRoleId = param.roleId;
      roleTreeModal.targetRow._depth = 0;
      onCellChange(roleTreeModal.targetRow);
    }
    roleTreeModal.show = false;
    return;
  } else if (cmd === 'pathModal-pick') {
    return onPathPicked(param);
  } else {
    console.warn('[handleSelectAction] unknown cmd:', cmd);
  }
};
```

### template 사용 예시

```html
<!-- 검색바 -->
<bo-search-area @search="handleBtnAction('search-list')" @reset="handleBtnAction('search-reset')" ... />

<!-- 그리드 + 행 액션 -->
<bo-grid-crud
  @add="handleBtnAction('roles-add')" @save="handleBtnAction('roles-save')"
  @delete-checked="handleBtnAction('roles-delete-checked')" @cancel-checked="handleBtnAction('roles-cancel-checked')"
  @cell-change="row => handleSelectAction('roles-row-cell-change', row)" @export="handleBtnAction('roles-excel')">
  <template #row-actions="{ row, idx }">
    <bo-row-cancel-delete @cancel="handleSelectAction('roles-row-cancel', idx)" @delete="handleSelectAction('roles-row-delete', idx)" />
    <button @click.stop="handleSelectAction('roles-row-open-setting', idx)">설정</button>
  </template>
</bo-grid-crud>

<!-- 트리 (좌측 카드) -->
<bo-local-tree-card
  :on-toggle="path => handleBtnAction('pathTree-toggle', path)"
  @select="path => handleSelectAction('pathTree-select', path)"
  @expand-all="handleBtnAction('pathTree-expand-all')"
  @collapse-all="handleBtnAction('pathTree-collapse-all')">
  <select @change="handleBtnAction('pathTree-cat-change')">...</select>
</bo-local-tree-card>

<!-- 설정 영역 -->
<button @click="handleBtnAction('config-save')">설정 저장</button>

<!-- 메뉴 권한 -->
<input type="checkbox" @change="e => handleBtnAction('roleMenus-toggle-all', e.target.checked)" />
<button @click="handleBtnAction('roleMenus-set-all', p)">{{ p }}</button>
<button @click="handleSelectAction('roleMenus-set', { menuId: m.menuId, perm: p })">{{ p }}</button>

<!-- 사용자 -->
<button @click="handleBtnAction('roleUsers-open-select')">+ 사용자</button>
<button @click="handleSelectAction('roleUsers-remove', u.boUserId)">✕</button>
<bo-user-select-modal v-if="..." @select="users => handleSelectAction('roleUsers-select', users)" @close="handleBtnAction('roleUsers-close-select')" />

<!-- 모달 -->
<role-tree-modal @select="role => handleSelectAction('parentModal-select', role)" @close="handleBtnAction('parentModal-close')" />
<path-pick-modal @select="pid => handleSelectAction('pathModal-pick', pid)" @close="handleBtnAction('pathModal-close')" />
```

### 컬럼 정의 안 콜백도 dispatch 경유

```js
// ✅ 컬럼 정의 안 콜백도 dispatch 래퍼
{ key: 'parentRoleId', label: '상위역할',
  parentPick: { label: parentNm, open: (row) => handleSelectAction('parentModal-open', row), title: '상위역할 선택' } },
```

### cmd 네이밍 규칙 ⭐ (2026-05-24 최종)

- 형식: **`{영역명}-기능명`** (영역명 camelCase, 기능명 kebab-case)
- **`base*` 같은 추상 prefix 사용 안 함** — 도메인 명사를 그대로 영역명으로 사용
- 가능하면 **setup() 안 reactive 변수명과 일치** (`roles`, `roleMenus`, `roleUsers` 등)
- 행 단위 액션은 `{영역명}-row-기능명` hierarchy (예: `roles-row-edit`)

#### SyRoleMng 영역 매핑 (실제 적용 사례)

| 영역명 | 의미 | reactive 변수 | 사용 cmd |
|---|---|---|---|
| `searchParam` | 검색바 | `searchParam` | `searchParam-list`, `searchParam-reset` |
| `roles` | 역할 목록 (메인 그리드) | `roles`, `gridRows` | `roles-save`, `roles-add`, `roles-delete-checked`, `roles-cancel-checked`, `roles-excel`, `roles-reload` |
| `roles-row` | 역할 목록 행 단위 | (행 객체) | `roles-row-edit`, `roles-row-delete`, `roles-row-cancel`, `roles-row-cell-change`, `roles-row-check-all`, `roles-row-open-setting` |
| `pathTree` | 좌측 경로 트리 | `expanded`, `cfTree` | `pathTree-select`, `pathTree-toggle`, `pathTree-expand-all`, `pathTree-collapse-all`, `pathTree-cat-change` |
| `config` | 역할 설정 패널 | `uiState.selectedRoleId` | `config-save` |
| `roleMenus` | 메뉴 권한 목록 | `roleMenus`, `menus` | `roleMenus-set`, `roleMenus-set-all`, `roleMenus-toggle-all` |
| `roleUsers` | 역할 사용자 목록 | `roleUsers`, `boUsers` | `roleUsers-open-select`, `roleUsers-close-select`, `roleUsers-select`, `roleUsers-remove` |
| `parentModal` | 상위역할 선택 모달 | `roleTreeModal` | `parentModal-open`, `parentModal-select`, `parentModal-close` |
| `pathModal` | 표시경로 선택 모달 | `pathPickModal` | `pathModal-pick`, `pathModal-close` |

#### 영역명 선정 가이드

1. **데이터 영역**: reactive 변수명 그대로 — `roles`, `members`, `orders`, `products`, `claims`, `coupons` 등
2. **행 단위 액션**: `{영역명}-row-*` hierarchy — `roles-row-edit`
3. **트리 영역**: `xxxTree` 접미사 — `pathTree`, `categoryTree`, `menuTree`
4. **모달**: `xxxModal` 접미사 — `parentModal`, `pathModal`, `userPickModal`
5. **패널 영역**: `xxx` 또는 `xxxArea` (행위가 명확하면 단순화) — `config` (`configArea` 보다 짧음)
6. **검색바**: `searchParam` (reactive 변수명과 동일)

#### 기능명 표준

`list` (조회), `reset` (초기화), `save`, `add`, `delete`, `cancel`, `edit`, `excel`, `reload`, `open`, `close`, `select`, `remove`, `set`, `set-all`, `toggle`, `toggle-all`, `cell-change`, `check-all`, `open-setting`, `expand-all`, `collapse-all`, `cat-change`, `pick`

#### 예시

```
search-list           ← 메인 검색바 조회
roles-save             ← 메인 그리드 저장
roles-row-edit         ← 메인 그리드 행 편집
pathTree-select           ← 메인 트리 노드 선택
config-save           ← 보조 설정 패널 저장
roleMenus-set              ← 메뉴 권한 목록 설정
roleUsers-remove           ← 사용자 목록 행 제거
parentModal-open          ← 상위역할 선택 모달 열기
pathModal-pick            ← 경로 선택 모달 선택
```

### 명명 원칙 요약

1. **도메인 명사 기반** ⭐ — 추상 prefix(`base*`) 사용 안 함. reactive 변수명 / 데이터 도메인 이름 그대로 (`roles`, `members`, `orders`).
2. **행 단위 액션** → `{영역명}-row-*` hierarchy (`roles-row-edit`).
3. **트리** → `xxxTree-*` (`pathTree`, `categoryTree`).
4. **모달** → `xxxModal-*` (`parentModal`, `pathModal`).
5. **검색바** → `searchParam` (reactive 변수명과 동일).
6. **설정/구성 패널** → `config` 또는 `xxxConfig` (행위 명확하면 단순화).

### 작성 규칙

1. **위치**: setup() 본문 **상단** — "초기 변수 정의" 직후, "초기 함수" / "내장 사용 함수" 직전.
2. **주석**: 한 줄 블럭 주석 `/* handleBtnAction — 버튼 액션 dispatch (cmd: '영역명-기능명') */` 형식. 멀티라인 JSDoc 안 씀 (간결성 우선).
3. **첫 줄에 console.log**: `console.log(' ■■ 파일명 : 함수명 -> ', cmd, param);` (디버그 콘솔에서 시각적 식별을 위해 `■■` prefix)
4. **param 기본값**: `(cmd, param = {}) => ...` — 인자 없이 호출도 안전.
5. **switch 사용 금지** — `if (cmd === '...') { return ...; }` 형식 (블록 강제 §13 따름).
6. **각 케이스 `if / else if / else` 체인** ⭐: `if (cmd === 'xxx') {` 줄 → `return xxx();` 줄 → `} else if (cmd === 'yyy') {` 줄 식으로 연결. 마지막은 `} else { console.warn(...) }` 로 unknown cmd 처리. §13 블록 강제 규칙 일관성 + 단일 디스패치 의미 강조.
   - **각 if 위에 한글 주석 한 줄** ⭐ — 어떤 동작인지 명시. 코드 가독성 + 콘솔 디버깅 시 추적 용이. (return 아래 "완료" 주석은 노이즈라 사용 안 함.)
     ```js
     // 검색조건으로 목록 조회
     if (cmd === 'searchParam-list') {
       return handleSearchList('DEFAULT');
     // 검색조건 초기화 + 재조회
     } else if (cmd === 'searchParam-reset') {
       Object.assign(searchParam, _initSearchParam());
       return handleSearchList();
     }
     ```
7. **5줄 이하 짧은 로직은 dispatch 안에서 직접 구현** ⭐: 단순 wrapper 함수(예: `const onSearch = () => handleSearchList('DEFAULT');`)는 dispatch 안에 인라인. 보일러플레이트 함수 제거 + cmd 흐름 가독성 향상.
   ```js
   // ✅ 인라인 권장 (5줄 이하)
   } else if (cmd === 'search-list') {
     return handleSearchList('DEFAULT');
   } else if (cmd === 'search-reset') {
     Object.assign(searchParam, _initSearchParam());
     return handleSearchList();
   }

   // ⚠️ 비추천 — wrapper 함수 별도 정의 후 호출만
   const onSearch = async () => { await handleSearchList('DEFAULT'); };
   const onReset = () => { Object.assign(...); handleSearchList(); };
   // dispatch:
   } else if (cmd === 'search-list') { return onSearch(); }
   } else if (cmd === 'search-reset') { return onReset(); }
   ```
   - 단 5줄 초과 / 비즈니스 로직 / 에러 처리(`try-catch`) / 비동기 API / 여러 함수에서 공유되는 로직은 **별도 함수로 분리 + 호출**.
7. **알 수 없는 cmd**: `console.warn` 으로 표시 (silent fail 방지).
8. **return 객체에 노출**: `return { handleBtnAction, handleSelectAction, ... }`. dispatch 도입 후 **return 객체는 대폭 단순화** — template 에서 직접 참조되는 식별자만 노출. **그룹별 한 줄 + 우측 인라인 주석** 형식:
   ```js
   return {
     uiState, codes, searchParam, gridRows, expanded,                                  // 상태 / 데이터
     baseSearchColumns, baseGridColumns,                                                // 컬럼 정의
     handleBtnAction, handleSelectAction,                                               // dispatch (모든 이벤트 / 액션 라우팅)
     cfTree, cfShowRoleSetting, cfSelectedRoleNm, cfMenuTree, cfMenuAllChecked,         // computed
     fnPermColor, getMenuPerm, isMenuChecked,                                           // 헬퍼
     pathPickModal, roleTreeModal,                                                      // 모달 상태
   };
   ```
   - dispatch 안에서만 호출되고 template/외부에서 직접 참조 안 되는 함수(`onSearch`, `handleSave`, `addRow`, `deleteRow` 등)는 **return 에서 제거**.
   - 컬럼 정의 안 콜백(`fmt`, `cellStyle`, `parentPick.open`)에서 참조되는 함수도 setup() 안에 정의는 유지하되 return 노출은 불필요 (closure 로 참조).
   - 효과: dispatch 도입 화면은 보통 50+ 식별자 → **15-20 개** 로 70% 감소.
9. **기존 핸들러는 유지**: dispatch 도입 후에도 onSearch/handleSave 등 기존 함수는 그대로 사용 가능 (점진적 마이그레이션).
10. **TS 전환 대비**: 위 한 줄 주석은 추후 TS 전환 시 `BtnCmd`/`SelectCmd` literal union type 으로 승격 가능 (현 단계에선 간결성 우선).

### 장단점

| 항목 | dispatch 도입 시 |
|---|---|
| template 일관성 | ⬆ (모든 버튼이 `@click="handleBtnAction('xx')"` 한 형태) |
| 공통 처리 (권한/로깅/감사) | ⬆ dispatch 한 곳에서 일괄 |
| 디버깅 (Cmd+Click 정의 이동) | ⬇ cmd 문자열 우회로 grep 필요 |
| 자동완성 (IDE) | △ JSDoc `@typedef BtnCmd` 입히면 ⬆ |
| TS 전환 | ⬆ literal union type 으로 type safety 강화 |
| 학습 비용 | ⬇ 신규 진입 시 cmd 표 익혀야 함 |

### 적용 범위

- **권장**: 새 화면 작성 시 dispatch 패턴 채택.
- **기준 PoC**: [SyRoleMng.js:32-132](../../../pages/bo/sy/SyRoleMng.js#L32) — handleBtnAction 19 cmd + handleSelectAction 13 cmd, **9개 도메인 영역** (`searchParam`, `roles`, `roles-row`, `pathTree`, `config`, `roleMenus`, `roleUsers`, `parentModal`, `pathModal`). 모든 영역명이 setup() 안 reactive 변수명과 일치. template + 컬럼 콜백 안 모든 이벤트가 dispatch 경유. 각 if 위 + return 아래 한글 주석 부여.
- **return 객체 단순화 효과**: SyRoleMng 기준 55개 → 17개 (-69%). [SyRoleMng.js:711-720](../../../pages/bo/sy/SyRoleMng.js#L711) 참조.

### BO + FO + 공통 컴포넌트 전체 일괄 적용 이력 (2026-05-24 ~ 2026-05-25) ⭐

**BO 121개 + FO 54개 + 공통 16개 = 총 191개 파일 100% dispatch 패턴 적용 완료** (placeholder 1개 + 의도적 제외 2개).
- BO: 121/121 (sy 34, ec 95, zd 2, Dashboard 3 + 기타 1)
- FO: 54/54 (메인 22, my 6, xs 19, xd 7)
- **공통 컴포넌트** (single-setup + multi-setup): **16/17** (FoComp.js placeholder 1개 제외)
  - components/ + layout/ 폴더
  - 가장 큰 파일 BoModals.js 는 한 파일 안에 **33개 모달 컴포넌트 setup()** 존재 — 각각에 dispatch 적용

#### dispatch 함수 위치 표준 ⭐ (2026-05-25)

`handleBtnAction` / `handleSelectAction` 은 setup() **상단** — "초기 변수 정의" 섹션 직후, 다른 모든 함수보다 앞에 배치한다.

```js
setup(props) {
  // ===== 초기 변수 정의 =====================================================
  const { ref, reactive, computed } = Vue;
  const showToast = window.boApp.showToast;
  const users = reactive([]);
  const searchParam = reactive({ ... });

  /* handleBtnAction — 버튼 액션 dispatch */
  const handleBtnAction = (cmd, param = {}) => { ... };

  /* handleSelectAction — 행/선택 액션 dispatch */
  const handleSelectAction = (cmd, param = {}) => { ... };

  // ===== 초기 함수 / 내장 사용 함수 / 사용자 함수 ============================
  ...

  // ===== return (템플릿 노출) ===============================================
  return { ... };
}
```

**이유**:
- 화면 진입 시 가장 먼저 보이는 위치 — 어떤 액션이 있는지 즉시 파악
- template 의 이벤트가 모두 dispatch 경유 → "이 화면이 받는 액션 목록" 으로 자연스러운 정의 영역
- closure 로 비즈니스 함수 참조 가능 (function declaration 호이스팅 + arrow function 의 lexical binding)

**일괄 적용 결과 (2026-05-25)**:
- 192개 파일 중 96개 이동 + 87개 이미 상단 + 5개 multi-setup 일부 (BoAreaComp/FoAreaComp/BoModals) 는 자동 처리 어려움 → 수동/추후 처리
- 자동 도구: `c:/tmp/move_dispatch_to_top.js` (마커 기반), `c:/tmp/move_dispatch_multi.js` (multi-setup 용)
- syntax 0 fail

#### 의도적 제외 파일 (dispatch 미적용) ⭐

- **base/boApp.js** (2943 lines, 10 handler) — BO 앱 부트스트랩
- **base/foApp.js** (1197 lines, 4 handler) — FO 앱 부트스트랩

> 이유: §12 (포매팅 정책) 와 동일 — Vue 런타임 컴파일러가 이 두 파일의 template 백틱 문자열을 특수하게 파싱하므로, 자동/수동 변경 시 컴파일러 크래시 위험 존재. dispatch 도입 시 setup() 영역 대규모 재배치가 필요한데 이는 같은 위험을 안고 있음. 메모리 [[boapp_template_no_format]] 참조.
> 새 화면은 BO 의 경우 `pages/bo/**` 안에서 작업 — boApp.js 자체는 라우팅/공통 setup 이라 도메인 로직이 아님.

#### 공통 컴포넌트 적용 상세

**single-setup 8개** (1 파일 1 setup):
- components/disp/DispX01Ui.js / DispX02Area.js / DispX03Panel.js / DispX04Widget.js
- components/modals/HelpBoModal.js
- layout/foAppHeader.js / foAppFooter.js / foAppSidebar.js

**multi-setup 8개** (1 파일 N setup, 총 ~75 setup):
- components/modals/BoModals.js (33 setup) — 모달 모음 (Site/Vendor/User/Member/Order/Bbm/Tree/Path/Code/Auth 등)
- components/modals/FoModals.js (2 setup)
- components/comp/BoAreaComp.js (11 setup) — BoSearchArea, BoGrid, BoGridCrud, BoFormArea, BoModal, BoCronModal 등
- components/comp/FoAreaComp.js (6 setup) — FoSearchArea, FoGrid, FoGridCrud, FoModal 등
- components/comp/BoComp.js (8 setup) — BoPropTreeNode, BoDeptTreeNode, BoPathTree, BoCategoryTree, BoMultiCheckSelect, BoDateTimePicker, BoPathPickField, BoPathTreeNode
- components/comp/CoWidgetComp.js (2 setup) — CoBarcodeWidget, CoCountdownWidget
- components/comp/BaseComp.js (3 setup) — BaseAttachGrp, BaseAttachOne, BaseHtmlEditor
- layout/foMyLayout.js (3 setup) — MyDateFilter, Pagination, foMyLayout

#### multi-setup 컴포넌트 dispatch 특수 처리

**모달/Area/위젯 컴포넌트는 props/emit 중심**이라 dispatch 의 라우팅 목적이 약하지만, 일관성 + 디버깅 추적성 + 향후 확장성을 위해 적용:

- emit 호출도 dispatch 경유: `if (cmd === 'modal-close') { return emit('close'); }`
- 단순 렌더 컴포넌트(stub)는 dispatch 빈 함수 + unknown warn 만 추가
- 재귀 컴포넌트 (BoPropTreeNode, BoDeptTreeNode, PathPickTreeNode, BoCodeGrpTreeNode) 는 `components: { 'bo-xxx-tree-node': null }` + `created()` self-register 패턴 유지

**BO 121개 파일 100% dispatch 패턴 적용** — sy + ec/{cm,mb,od,pd,pm,dp,st} + zd + Dashboard 전 도메인.

#### FO 적용 이력 (2026-05-25)

FO 54개 파일 — Home/Prod (메인 상품) + my/My* (마이페이지) + xs/Sample (샘플 페이지) + xd/DispUi (전시 UI 샘플) 등 전 도메인 적용.

**FO 영역명 표준**:
- 데이터: `cart`, `orders`, `claims`, `coupons`, `caches`, `contacts`, `chatts`, `events`, `blogs`, `faqs`, `likes`, `stores`, `members`, `posts`, `prods`, `prod`(단건)
- 페이지 이동: `page-go-{대상}` (예: `page-go-home`, `page-go-prod-list`, `page-go-cart`)
- 폼: `form` (Login/Order/BlogEdit/Contact)
- 모달: `xxxModal` (`memberPickModal`, `sizeGuideModal`, `zoomModal`, `quickBuy`, `photoModal` 등)
- 탭/뷰모드: `tab`, `sort`, `filter`, `category`
- 옵션: `options` (Prod View 의 색상/사이즈 선택)
- 슬라이드/갤러리: `hero`, `gallery`, `photoGrid`, `photoDetail`
- 요약: `summary` (Cart/Order)
- 검색바: `searchParam`

**FO 특수 사이트별 분기**:
- `Home01/02/03`, `Prod01List/02/03`, `Prod01View/02/03` 등 사이트별 변형 화면들은 **cmd 명명을 동일하게 유지** (테마/CSS 만 차이)
- 예: Prod01View / Prod02View / Prod03View 모두 `handleBtnAction 27 cmd + handleSelectAction 8 cmd` 동일

**§15 단순 컴포넌트 면제 정책 폐지 ⭐ (2026-05-25)**:
- 기존: 핸들러가 하나도 없는 정적 표시 컴포넌트는 dispatch 생략 가능
- **신규**: 모든 파일에 dispatch 함수 2개 (`handleBtnAction` + `handleSelectAction`) 추가 — 핸들러가 0개여도 최소한 unknown warn 만 있는 빈 함수 추가
- 이유: 일관성 + 향후 액션 추가 시 즉시 사용 가능 + 디버깅 추적성
- 적용 대상: xs/Sample10/11/12/13/14/03/21/22/23, xd/DispUi01~06, DispUiPage 등 16개 파일

### BO 전체 일괄 적용 이력 (2026-05-24)

**BO 121개 파일 100% dispatch 패턴 적용 완료** — sy + ec/{cm,mb,od,pd,pm,dp,st} + zd + Dashboard 전 도메인.

| 도메인 | 파일 수 | 비고 |
|---|---|---|
| sy | 34 | SyRoleMng(PoC) + 33개 (User/Site/Role/Dept/Menu/Code/Path/Brand/Prop/I18n/Template/Alarm/Batch/Bbs/Bbm/Attach/ApiLog/Contact/Vendor/VendorUser/Dashboard/Postman/Hist) |
| ec/cm | 5 | Blog/Chatt/Notice |
| ec/mb | 6 | Member(Mng/Dtl/Hist) + MemGrade/Group + CustInfo |
| ec/od | 10 | Order/Claim/Dliv (각 Mng/Dtl/Hist) + Cart |
| ec/pd | 13 | Prod(Mng/Dtl/Hist) + Category(Mng/Dtl) + CategoryProd + Bundle/Set/DlivTmplt/Qna/Review/RestockNoti/Tag |
| ec/pm | 16 | Cache/Coupon/Discnt/Event/Gift/Plan/Save/Voucher (각 Mng/Dtl) |
| ec/dp | 17 | UI/Area/Panel/Widget/WidgetLib (각 Mng/Dtl/Preview) + UiSimul + RelationMng |
| ec/st | 14 | Config/ErpGen/ErpRecon/ErpView/Raw/ReconClaim/ReconOrder/ReconPay/ReconVendor/SettleAdj/SettleClose/SettleEtcAdj/SettlePay/StatusMng |
| zd | 2 | ZdStore/ZdLocalStorage |
| (root) | 3 | DashboardBoEc01/02/03 |
| **합계** | **120** + SyRoleMng(PoC) = **121** | |

**검증 결과**: 121/121 `node --check` PASS + template_format.js / js_format_simple.js 통과.

**작업 방식**:
- 작은 도메인은 main 직접 처리 (sy/ec/cm/ec/mb/ec/od)
- 큰 도메인은 general-purpose Agent 병렬 처리 (ec/pd, ec/pm, ec/dp, ec/st, 기타)
- 각 Agent 에 기준 파일 (SyRoleMng/SySiteMng/SySiteDtl/PmCacheMng 등) + 영역명 가이드 + 도메인 특수 사항 명시
- Agent 완료 후 main 에서 `node --check` + 포맷팅 일괄 검증

**큰 파일 처리 (1000+ lines)**:
- PdProdDtl (2453 lines), DpDispUiSimul (1989), DpDispPanelDtl (1845), DpDispWidgetPreview (1276) 등
- **dispatch 는 상위 레벨 이벤트만** (탭/저장/취소/미리보기) 적용
- SKU 동적 행, 카테고리 다중 매핑, Quill 에디터, 드래그 앤 드롭, 위젯 유형별 분기 등 복잡 영역은 **기존 함수 그대로 유지** + closure 작동

**영역명 표준 (도메인별)**:
- 데이터: reactive 변수명 그대로 (`members`, `orders`, `claims`, `prods`, `coupons`, `widgets` 등)
- 검색바: `searchParam`
- 트리: `xxxTree` (`pathTree`, `categoryTree`, `menuTree`, `deptTree`)
- 모달: `xxxModal` (`pathModal`, `parentModal`, `prodPickModal`, `memberPickModal`, `vendorModal`)
- 인라인 Dtl: `detailPanel`
- 일괄작업 모달: `actionsModal`
- 폼: `form`
- 탭/뷰모드: `tab`, `tabMode`, `viewMode`
- 행 단위: `{영역명}-row-기능명`

### 인자 전달 규약

dispatch 의 `param` 은 자유 형식이지만 일관성을 위해:

- **단일 값** (id/idx/row): `handleSelectAction('roles-row-delete', idx)` — 그대로 전달
- **여러 값** (필드 + 값): 객체로 묶어서 전달 → `handleSelectAction('baseMenu-set', { menuId, perm })`
- **이벤트 객체**: 화살표 함수로 래핑하여 필요한 값만 추출 → `@change="e => handleBtnAction('baseMenu-toggle-all', e.target.checked)"`

dispatch 내부에서 받을 때:
```js
if (cmd === 'roleMenus-set') {
  return setMenuPerm(param.menuId, param.perm);
}
```

---

## 15. 보조 컴포넌트는 components/comp/ 로 분리 ⭐ (2026-05-24)

**페이지 컴포넌트(`Mng/Dtl/Hist` 등)와 별개로 정의되는 보조 컴포넌트**(트리 노드, 카드, 위젯 등)는 화면 파일 안에 인라인 정의하지 말고 `components/comp/BoComp.js` 또는 `FoComp.js` 로 분리한다.

### 기준

- 화면 컴포넌트 = `window.{화면명}Mng/Dtl/Hist` 한 개. 파일명과 일치.
- 그 외 `window.XxxNode`, `window.XxxCard`, `window.XxxItem` 같은 정의는 **공통 컴포넌트** 로 분류.
- 한 파일에서만 쓰는 보조 컴포넌트라도 BoComp.js 로 보낸다 (재사용성 X 이라도 위치 일관성 유지).

### 예외

- **FO 페이지 컴포넌트 명명 차이**: `pages/fo/Event.js` 의 `window.EventPage` 처럼 파일명(`Event`)과 export 명(`EventPage`)이 다른 경우는 그대로 둠 (페이지 자체 컴포넌트).
- **Sample 페이지** (`pages/fo/xs/Sample01.js` 의 `window.XsSample01`) 도 페이지 자체 컴포넌트 → 그대로 둠.

### 등록

- BoComp.js / FoComp.js 의 컴포넌트는 `base/boApp.js` 또는 `base/foApp.js` 에서 `app.component('Name', window.Name)` 로 등록한다.
- 보조 컴포넌트 이동 후에도 등록 코드는 그대로 유지 (등록은 boApp.js 가 담당).

### 명명 규칙 — `Bo` 프리픽스 통일 ⭐

BoComp.js 로 이동한 컴포넌트는 **`Bo` 프리픽스 + PascalCase** 로 통일.
- `PropTreeNode` → `BoPropTreeNode` (태그: `<bo-prop-tree-node>`)
- `DeptTreeNode` → `BoDeptTreeNode` (태그: `<bo-dept-tree-node>`)
- 재귀 컴포넌트 (자기 자식 참조)는 `components: { 'bo-xxx-tree-node': null }` + `created()` 훅에서 자기 자신 등록.

### 2026-05-24 적용 이력

- `BoPropTreeNode` (구 PropTreeNode, SyPropMng → BoComp.js L872)
- `BoDeptTreeNode` (구 DeptTreeNode, SyDeptMng → BoComp.js L917)
- 영향 파일 7개 일괄 갱신: BoComp.js (정의 + 재귀 태그), boApp.js (등록 2건), BoModals.js (사용), SyDeptMng.js (사용 + 안내 주석), SyUserMng.js (사용), SyPropMng.js (안내 주석)
- node --check 6/6 PASS.


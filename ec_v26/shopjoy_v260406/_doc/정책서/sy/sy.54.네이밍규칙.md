---
정책명: 프론트엔드 함수·변수 네이밍 규칙
정책번호: sy-54
관리자: 개발팀
최종수정: 2026-04-25
---

# sy.54. 프론트엔드 함수·변수 네이밍 규칙

## 목적

Vue 3 Composition API(CDN) 기반 코드에서 함수와 변수의 역할을 이름만으로 즉시 파악할 수 있도록 접두어 규칙을 통일한다.

## 적용 범위

- `pages/bo/**/*.js` — 관리자(Back Office) 컴포넌트
- `pages/fo/**/*.js` — 사용자(Front Office) 컴포넌트
- `components/**/*.js` — 공통 컴포넌트
- `base/stores/**/*.js` — Pinia 스토어

---

## 접두어 규칙표

| 접두어 | 적용 대상 | 설명 | 예시 |
|---|---|---|---|
| `on` | 이벤트 바인딩 함수 | 템플릿 `@click`, `@change` 등에 직접 연결되는 함수 | `onSearch`, `onReset`, `onSave`, `onDelete`, `onSizeChange`, `onDateRangeChange` |
| `handle` | 이벤트 처리 로직 함수 | 이벤트를 받아 복잡한 비즈니스 로직을 처리하는 함수. `on*` 에서 호출됨 | `handleSave`, `handleDelete`, `handleStatusChange` |
| `fn` | 독립 유틸 함수 | 순수 계산·변환·포맷 등 재사용 가능한 독립 함수 | `fnStatusBadge`, `fnFormatDate`, `fnPayBadge`, `fnCalcTotal` |
| `cf` | computed 속성 | `computed(() => ...)` 로 선언된 반응형 파생 값 | `cfFiltered`, `cfTotal`, `cfTotalPages`, `cfPageList`, `cfPageNums`, `cfSiteNm`, `cfIsNew`, `cfDetailKey` |
| `sf` | store 함수 (Pinia action) | Pinia 스토어의 `actions` 내 함수 | `sfSetAuth`, `sfSetCodes`, `sfLogin`, `sfLogout`, `sfFetchInit` |
| `sv` | store 변수 (Pinia state/getter) | Pinia 스토어의 `state` 및 `getters` | `svAuthUser`, `svCodes`, `svIsLoggedIn`, `svAccessToken` |

> **`p` (props) 접두어는 적용하지 않는다.** Vue CDN 구조에서 props는 구조분해 없이 `props.xxx` 로 접근하므로 별도 접두어가 불필요하다.

---

## 상세 규칙

### 1. `on*` — 이벤트 바인딩 함수

템플릿의 이벤트 디렉티브(`@click`, `@change`, `@keyup.enter` 등)에 **직접 연결**되는 함수.

```js
// ✅ 올바른 패턴
const onSearch = () => { /* 검색 조건 적용 */ };
const onReset = () => { /* 검색 조건 초기화 */ };
const onSave = async () => { /* 저장 */ };
const onDelete = async (item) => { /* 삭제 */ };
const onSizeChange = () => { pager.page = 1; };
const onDateRangeChange = () => { /* 기간 선택 변경 */ };
const onTabChange = (tab) => { /* 탭 전환 */ };
```

```html
<!-- 템플릿 -->
<button @click="onSearch">조회</button>
<button @click="onReset">초기화</button>
<select @change="onSizeChange" v-model="pager.size">
```

### 2. `handle*` — 이벤트 처리 로직 함수

복잡한 저장/삭제/상태변경 등 **비즈니스 로직**을 담당. `on*` 함수에서 호출하거나 단독으로 사용.

```js
// ✅ 올바른 패턴
const handleSave = async () => {
  const ok = await props.showConfirm('저장', '저장하시겠습니까?');
  if (!ok) return;
  try {
    await window.boApi.post('/bo/...', { ...form });
    props.showToast('저장되었습니다.', 'success');
  } catch (err) {
    props.showToast(err.message, 'error', 0);
  }
};

const handleDelete = async (item) => {
  const ok = await props.showConfirm('삭제', '삭제하시겠습니까?');
  if (!ok) return;
  await window.boApi.delete(`/bo/.../${item.id}`);
};
```

> `save`, `doSave`, `doDelete`, `del` 등의 이름은 사용하지 않는다.

### 3. `fn*` — 독립 유틸 함수

**순수 함수** (입력 → 출력, 부수 효과 없음). 배지 색상, 포맷 변환 등.

```js
// ✅ 올바른 패턴
const fnStatusBadge = (status) => ({
  '활성': 'badge-green', '비활성': 'badge-gray', '삭제': 'badge-red',
}[status] || 'badge-gray');

const fnFormatDate = (d) => d ? String(d).slice(0, 10) : '-';
const fnPayBadge = (s) => ({ '결제완료': 'badge-green', '미결제': 'badge-gray' }[s] || 'badge-gray');
```

```html
<!-- 템플릿 -->
<span class="badge" :class="fnStatusBadge(row.status)">{{ row.status }}</span>
```

### 4. `cf*` — computed 속성

`computed(() => ...)` 로 선언된 **반응형 파생 값** 전체.

```js
// ✅ 올바른 패턴
const cfSiteNm    = computed(() => window.boCmUtil.getSiteNm());
const cfIsNew     = computed(() => !props.editId);
const cfFiltered  = computed(() => orders.filter(o => /* 필터 조건 */));
const cfTotal     = computed(() => cfFiltered.value.length);
const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
const cfPageList  = computed(() => cfFiltered.value.slice(/* 페이징 */));
const cfPageNums  = computed(() => { /* 페이지 번호 배열 */ });
const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);
```

```html
<!-- 템플릿 — .value 없이 사용 -->
<span>{{ cfSiteNm }}</span>
<div v-for="row in cfPageList" :key="row.id">
<span>총 {{ cfTotal }}건</span>
```

### 5. `sf*` — store 함수 (Pinia actions)

Pinia 스토어 `actions` 블록 내 함수. 스토어 외부에서 호출 시 `store.sfXxx()` 형태.

```js
// ✅ 올바른 패턴 (스토어 정의 내부)
actions: {
  sfSetAuth(data) { /* ... */ },
  sfClearAuth() { /* ... */ },
  async sfLogin(loginId, loginPwd) { /* ... */ },
  async sfFetchInit() { /* ... */ },
}
```

### 6. `sv*` — store 변수 (Pinia state/getters)

Pinia 스토어 `state` 및 `getters`. 스토어 외부에서 읽을 때 `store.svXxx` 형태.

```js
// ✅ 올바른 패턴 (스토어 정의 내부)
state: () => ({
  svAuthUser: null,
  svAccessToken: '',
  svCodes: [],
  svIsLoading: false,
}),
getters: {
  svIsLoggedIn: (state) => !!state.svAuthUser?.authId,
  svCurrentUser: (state) => state.svAuthUser,
},
```

---

## 변환 대조표 (Before → After)

### 이벤트/처리 함수

| Before | After | 접두어 |
|---|---|---|
| `fetchData()` | `onSearch()` | `on` |
| `reset()`, `resetForm()` | `onReset()` | `on` |
| `save()`, `doSave()` | `handleSave()` | `handle` |
| `del()`, `doDelete()`, `deleteItem()` | `handleDelete()` | `handle` |
| `submit()` | `handleSubmit()` | `handle` |
| `statusChange()` | `handleStatusChange()` | `handle` |

### 유틸 함수

| Before | After | 접두어 |
|---|---|---|
| `statusBadge(s)` | `fnStatusBadge(s)` | `fn` |
| `payStatusBadge(s)` | `fnPayBadge(s)` | `fn` |
| `formatDate(d)` | `fnFormatDate(d)` | `fn` |
| `calcTotal()` | `fnCalcTotal()` | `fn` |
| `typeBadge(t)` | `fnTypeBadge(t)` | `fn` |

### computed

| Before | After | 접두어 |
|---|---|---|
| `filtered` | `cfFiltered` | `cf` |
| `total` | `cfTotal` | `cf` |
| `totalPages` | `cfTotalPages` | `cf` |
| `pageList` | `cfPageList` | `cf` |
| `pageNums` | `cfPageNums` | `cf` |
| `siteNm` | `cfSiteNm` | `cf` |
| `isNew` | `cfIsNew` | `cf` |
| `detailEditId` | `cfDetailEditId` | `cf` |
| `isViewMode` | `cfIsViewMode` | `cf` |
| `detailKey` | `cfDetailKey` | `cf` |

### Pinia store

| Before | After | 구분 |
|---|---|---|
| `state: { authUser }` | `state: { svAuthUser }` | `sv` |
| `state: { codes }` | `state: { svCodes }` | `sv` |
| `state: { isLoading }` | `state: { svIsLoading }` | `sv` |
| `getters: { isLoggedIn }` | `getters: { svIsLoggedIn }` | `sv` |
| `actions: { setAuth }` | `actions: { sfSetAuth }` | `sf` |
| `actions: { login }` | `actions: { sfLogin }` | `sf` |
| `actions: { fetchBoAppInitData }` | `actions: { sfFetchInit }` | `sf` |

---

## 예외 사항

- **`onMounted`, `onUnmounted`** 등 Vue 라이프사이클 훅은 변경하지 않는다.
- **`fetchData`, `loadData`, `loadDetail`** 등 onMounted에서 호출되는 데이터 로드 함수는 **`handle*`** 접두어를 사용한다. (`handleFetchData`, `handleLoadData`, `handleLoadDetail`)
- **상수** (`PAGE_SIZES`, `DATE_RANGE_OPTIONS` 등) 는 ALL_CAPS 유지.
- **로컬 루프 변수** (`o`, `m`, `i` 등) 는 짧은 이름 유지.
- **이미 `on*` 로 명명된 함수** (`onSearch`, `onReset` 등) 는 변경 불필요.

---

## 검색·필터 구조 규칙

### 1. 검색 파라미터 관리

**하나의 `searchParam` 객체로 관리**하여 일일히 ref를 선언하지 않는다.

```js
// ✅ 올바른 패턴
const searchParam = reactive({
  kw: '', grp: '', useYn: '', dateRange: '', dateStart: '', dateEnd: ''
});

// ❌ 피할 패턴
const searchKw = ref('');
const searchGrp = ref('');
const searchUseYn = ref('');
// ... 반복
```

**초기값 저장** — `onMounted` 마지막에 초기값 고정:

```js
const searchParamOrg = reactive({
  kw: '', grp: '', useYn: '', dateRange: '', dateStart: '', dateEnd: ''
});

onMounted(() => {
  handleFetchData();
  Object.assign(searchParamOrg, searchParam);
});
```

**초기화** — 저장된 초기값으로 복원:

```js
const onReset = () => {
  Object.assign(searchParam, searchParamOrg);
  onSearch(); // API 재조회
};
```

### 2. 파라미터 전달 — 일괄 할당 방식

**쿼리 파라미터 구성 시** 일일히 `if` 로 추가하지 않고 한 번에 병합:

```js
// ✅ 올바른 패턴
const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(
  Object.entries(searchParam).filter(([, v]) => v)
)};

// ❌ 피할 패턴
const params = { pageNo: 1, pageSize: 100000 };
if (searchParam.kw) params.kw = searchParam.kw;
if (searchParam.grp) params.grp = searchParam.grp;
// ... 반복
```

### 3. 조회·필터 방식 — API 조회 방식 권장

**항상 API로 조회**하고, 클라이언트 필터링은 하지 않는다.

```js
// ✅ 올바른 패턴 — onSearch에서 API 호출
const onSearch = async () => {
  try {
    loading.value = true;
    const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(
      Object.entries(searchParam).filter(([, v]) => v)
    )};
    const res = await window.boApi.get('/bo/sy/code/page', { params });
    const list = res.data?.data?.list || [];
    codes.splice(0, codes.length, ...list);
    handleLoadGrid();
  } catch (err) {
    console.error('[catch-info]', err);
    props.showToast('조회 중 오류가 발생했습니다.', 'error');
  } finally {
    loading.value = false;
  }
};

// handleLoadGrid는 순수 로드만 — 필터링 없음
const handleLoadGrid = () => {
  gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
  codes.forEach(c => gridRows.push(makeRow(c)));
};
```

---

## 관련 정책

- `sy.51.프로그램설계정책.md` — 초기값·데이터 정렬·상세화면 ID 표시
- `base.기술-admin.md` — 관리자 기술 스택 및 컴포넌트 구조
- `base.기술-front.md` — 사용자 기술 스택 및 컴포넌트 구조

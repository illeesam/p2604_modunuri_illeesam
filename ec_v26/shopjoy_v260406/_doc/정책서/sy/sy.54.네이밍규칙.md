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
- **데이터 로드 함수**는 목적에 따라 구분한다.
  - 목록 단일 API 조회: `handleSearchList`
  - 복수 API 동시 조회 (`Promise.all` 등): `handleSearchData`
  - 단건 상세 조회 (Dtl/editId): `handleSearchDetail`
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
  handleSearchList();
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

## ref vs reactive 사용 원칙

### 핵심 규칙

**`ref` 최소화, `reactive` 우선** — 관련된 상태들을 하나의 객체로 묶어 관리한다.

### 1. 검색·필터 영역 (reactive 필수)

**여러 검색 필드는 반드시 하나의 `reactive` 객체로 관리**

```js
// ✅ 올바른 패턴
const searchParam = reactive({
  kw: '',
  type: '',
  useYn: '',
  dateStart: '',
  dateEnd: ''
});

// ❌ 피할 패턴
const searchKw = ref('');
const searchType = ref('');
const searchUseYn = ref('');
// ... 일일이 ref 선언
```

### 2. 페이저 영역 (reactive)

```js
// ✅ 올바른 패턴
const pager = reactive({
  page: 1,
  size: 20,
  loading: false
});

// 사용
const onSizeChange = () => { pager.page = 1; };
const onSetPage = (n) => { if (n >= 1 && n <= cfTotalPages) pager.page = n; };

// ❌ 피할 패턴
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
```

### 3. 모달 상태 (reactive 객체로 캡슐화)

**모달의 모든 상태를 하나의 `reactive` 객체로 묶음**

```js
// ✅ 올바른 패턴
const modalsState = reactive({
  // 사이트 선택 모달
  siteModal: { kw: '', list: [], loading: false },
  // 사용자 선택 모달
  userModal: { 
    selectedDeptId: null, deptKw: '', selectedIds: new Set(), 
    userKw: '', loading: false 
  },
  // 템플릿 발송 모달
  templateSend: { 
    targetType: 'member', kw: '', selected: [], loading: false 
  }
});

// 사용: v-model="modalsState.siteModal.kw"
// return { ...modalsState, ... }

// ❌ 피할 패턴
const siteModalKw = ref('');
const siteModalList = ref([]);
const siteModalLoading = ref(false);
const userModalSelectedDeptId = ref(null);
const userModalDeptKw = ref('');
// ... 명명이 길어지고 관리 복잡
```

### 4. 폼·입력 영역 (reactive)

```js
// ✅ 올바른 패턴
const form = reactive({
  name: '',
  email: '',
  phone: '',
  useYn: 'Y'
});

const formErrors = reactive({
  name: '',
  email: '',
  phone: ''
});

// ❌ 피할 패턴
const formName = ref('');
const formEmail = ref('');
const formPhone = ref('');
const formUseYn = ref('Y');
const errorName = ref('');
const errorEmail = ref('');
const errorPhone = ref('');
```

### 5. ref 사용 가능한 경우

**단일 상태, 로딩/에러 플래그는 `ref` 가능**

```js
// ✅ ref 사용 가능
const loading = ref(false);
const error = ref(null);
const selectedId = ref(null);
const isOpen = ref(false);

// 단, 관련된 상태들은 reactive로 묶기
const modal = reactive({
  isOpen: false,
  selectedId: null,
  data: null,
  loading: false
});
```

### 6. computed 프로퍼티 (항상 cf 접두어)

```js
// ✅ 올바른 패턴
const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
const cfPageList = computed(() => 
  cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size)
);
const cfTotalPages = computed(() => 
  Math.max(1, Math.ceil(cfFiltered.value.length / pager.size))
);
```

### 요약

| 상황 | 패턴 | 예시 |
|---|---|---|
| 검색 조건 모음 | `reactive` | `searchParam`, `filterOptions` |
| 페이저 상태 | `reactive` | `pager: { page, size, loading }` |
| 모달 상태 | `reactive` | `modalsState: { modal1, modal2, ... }` |
| 폼 데이터 | `reactive` | `form: { name, email, phone, ... }` |
| 단일 값 | `ref` 가능 | `loading`, `error`, `selectedId` |
| 파생 값 | `computed` | `cfFiltered`, `cfTotal`, `cfPageList` |

---

## 개별 항목 컨트롤 패턴 (Object.assign)

### 리셋·초기화 (검색 필터, 폼)

**`Object.assign`으로 일괄 복원**하여 개별 할당 제거

```js
// ✅ 올바른 패턴
const searchParam = reactive({ kw: '', type: '', useYn: '' });
const searchParamOrg = reactive({ kw: '', type: '', useYn: '' });

onMounted(() => {
  handleSearchList();
  Object.assign(searchParamOrg, searchParam);  // 초기값 저장
});

const onReset = () => {
  Object.assign(searchParam, searchParamOrg);  // 초기값으로 복원
  onSearch();
};

// ❌ 피할 패턴
const onReset = () => {
  searchParam.kw = searchParamOrg.kw;
  searchParam.type = searchParamOrg.type;
  searchParam.useYn = searchParamOrg.useYn;
  onSearch();
};
```

### 선택 목록 관리 (Set, 배열)

```js
// ✅ 올바른 패턴 — Set을 reactive 객체 속성으로
const modalState = reactive({
  selectedIds: new Set(),
  selectedItems: [],
  loading: false
});

const handleToggleSelect = (item) => {
  const id = item.id;
  if (modalState.selectedIds.has(id)) {
    modalState.selectedIds.delete(id);
    modalState.selectedItems = modalState.selectedItems.filter(x => x.id !== id);
  } else {
    modalState.selectedIds.add(id);
    modalState.selectedItems.push(item);
  }
};

const handleToggleAll = () => {
  if (cfAllChecked.value) {
    modalState.selectedIds.clear();
    modalState.selectedItems = [];
  } else {
    cfFiltered.value.forEach(item => {
      modalState.selectedIds.add(item.id);
      modalState.selectedItems.push(item);
    });
  }
};

// ❌ 피할 패턴
const selectedIds = ref(new Set());   // ref 안에 Set 감싸기
const selectedId1 = ref(null);
const selectedId2 = ref(null);
const selectedId3 = ref(null);
// ... 일일이 ref 선언
```

### 폼 데이터 리셋

```js
// ✅ 올바른 패턴
const form = reactive({ name: '', email: '', phone: '' });
const formOrg = reactive({ name: '', email: '', phone: '' });

const handleSave = async () => {
  try {
    await api.post('/resource', form);
    Object.assign(formOrg, form);  // 저장 후 초기값 업데이트
  } catch (err) {
    Object.assign(form, formOrg);  // 실패 시 복원
  }
};

const handleCancel = () => {
  Object.assign(form, formOrg);  // 취소 시 복원
};
```

### 중첩 객체 부분 업데이트

```js
// ✅ 올바른 패턴
const userModals = reactive({
  siteModal: { kw: '', list: [], loading: false },
  userModal: { selectedDeptId: null, userKw: '', loading: false }
});

// 단일 모달만 초기화
const resetSiteModal = () => {
  Object.assign(userModals.siteModal, { kw: '', list: [], loading: false });
};

// 전체 모달 초기화
const resetAllModals = () => {
  Object.assign(userModals, {
    siteModal: { kw: '', list: [], loading: false },
    userModal: { selectedDeptId: null, userKw: '', loading: false }
  });
};
```

---

## ref → reactive 리팩토링 가이드

### 1단계: 검색 필터 영역 (우선순위: ⭐⭐⭐ 최우선)

**패턴 식별**: `searchKw`, `searchType`, `searchStatus`, `searchCat` 등 search* 관련 변수들

```js
// ❌ 리팩토링 전
const searchKw = ref('');
const searchType = ref('');
const searchStatus = ref('');
const searchCat = ref('');

// ✅ 리팩토링 후
const searchParam = reactive({
  kw: '',
  type: '',
  status: '',
  cat: ''
});
```

**영향 파일** (100개 파일):
- `SyRoleMng.js`, `SyCodeMng.js`, `SyMenuMng.js`, `SyUserMng.js`
- `PdCategoryMng.js`, `PdProdMng.js`, `PdTagMng.js`
- `OdOrderMng.js`, `OdClaimMng.js`, `OdDlivMng.js`
- 모든 Mng.js 파일

### 2단계: 페이저·페이지네이션 (우선순위: ⭐⭐⭐)

**패턴 식별**: `page`, `pageSize`, `size` 관련 변수들

```js
// ❌ 리팩토링 전
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// ✅ 리팩토링 후
const pager = reactive({
  page: 1,
  size: 20,
  loading: false
});
```

### 3단계: 폼·입력 데이터 (우선순위: ⭐⭐⭐)

**패턴 식별**: `form*`, `edit*` 관련 변수들 (Dtl 파일들)

```js
// ❌ 리팩토링 전
const formName = ref('');
const formEmail = ref('');
const formPhone = ref('');
const formUseYn = ref('Y');

// ✅ 리팩토링 후
const form = reactive({
  name: '',
  email: '',
  phone: '',
  useYn: 'Y'
});
const formErrors = reactive({
  name: '',
  email: '',
  phone: ''
});
```

**영향 파일** (Dtl.js 파일들):
- `SyUserDtl.js`, `SySiteDtl.js`, `SyCodeDtl.js`
- `PdProdDtl.js`, `PdCategoryDtl.js`
- `OdOrderDtl.js`, `OdClaimDtl.js`
- 모든 Dtl.js 파일

### 4단계: 선택·체크 상태 (우선순위: ⭐⭐)

**패턴 식별**: `selected*`, `checked*`, `focused*` 관련 변수들

```js
// ❌ 리팩토링 전
const selectedId = ref(null);
const selectedIds = ref([]);
const focusedIdx = ref(null);
const checkAll = ref(false);

// ✅ 리팩토링 후
const selection = reactive({
  id: null,
  ids: [],
  focusedIdx: null,
  checkAll: false
});
```

### 5단계: 모달·드롭다운 (우선순위: ⭐⭐)

**패턴 식별**: 모달 제어 변수들 (show, isOpen, expand 등)

```js
// ❌ 리팩토링 전
const modalShow = ref(false);
const expandedNodes = ref(new Set());
const hoverId = ref(null);

// ✅ 리팩토링 후
const modal = reactive({
  show: false,
  expandedNodes: new Set(),
  hoverId: null
});
```

### 리팩토링 체크리스트

각 파일별로 다음을 확인하세요:

```
[ ] 검색 필터 → searchParam으로 통합
[ ] 페이저 → pager로 통합  
[ ] 폼 데이터 → form으로 통합
[ ] 폼 에러 → formErrors로 통합
[ ] 선택 상태 → selection으로 통합
[ ] 모달 상태 → modal로 통합
[ ] 불가피한 단일 ref만 유지 (loading, error, isOpen 등)
[ ] 템플릿의 v-model 바인딩 업데이트
[ ] watch/computed 함수형으로 변경
[ ] onMounted에서 Object.assign으로 초기값 저장
[ ] onReset에서 Object.assign으로 복원
```

### 우선순위별 실행 계획

#### Phase 1 (완료 ✅)
- [x] `SyRoleMng.js` — 검색 필터 reactive 통합
- [x] `BaseModal.js` 주요 모달들 — reactive 패턴 적용
- [x] 정책서 업데이트 — ref vs reactive 원칙 + 리팩토링 가이드

#### Phase 2 (다음 우선순위)

**검색 필터 영역** (100개 파일 중 미적용 파일들):
- `SyCodeMng.js` — 이미 searchParam 적용됨 ✅
- `SyMenuMng.js` — search* 분리 필요
- `SyUserMng.js` — search* 분리 필요
- `PdCategoryMng.js` — search* 분리 필요
- `PdProdMng.js` — search* 분리 필요
- `OdOrderMng.js` — search* 분리 필요
- 기타 Mng.js 파일들 (40개+)

**폼·입력 영역** (모든 Dtl.js 파일):
- `SyCodeDtl.js`, `SyUserDtl.js`, `SySiteDtl.js`
- `PdProdDtl.js`, `PdCategoryDtl.js`
- `OdOrderDtl.js`, `OdClaimDtl.js`
- 기타 Dtl.js 파일들 (30개+)

#### Phase 3 (모달, 선택 상태)
- `components/modals/BaseModal.js` — 이미 reactive 모달 패턴 적용됨 ✅
- 개별 모달 상태 (expandedNodes, hoverId 등)
- 트리 선택 상태 (selectedPath, selectedId 등)

---

### 자동 리팩토링 스크립트 (향후)

대량 리팩토링을 위한 bash 스크립트 템플릿:

```bash
# 1. search* ref 패턴 찾기
grep -r "const search\w* = ref(" pages/bo/**/*.js

# 2. form* ref 패턴 찾기
grep -r "const form\w* = ref(" pages/bo/**/*Dtl.js

# 3. 선택 상태 ref 패턴 찾기
grep -r "const selected\w* = ref(" pages/bo/**/*.js
```

---

---

## 관련 정책

- `sy.51.프로그램설계정책.md` — 초기값·데이터 정렬·상세화면 ID 표시
- `base.기술-admin.md` — 관리자 기술 스택 및 컴포넌트 구조
- `base.기술-front.md` — 사용자 기술 스택 및 컴포넌트 구조

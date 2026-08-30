---
정책명: 프론트엔드 데이터 흐름 및 상태 관리 정책
정책번호: base-데이터흐름-상태관리
관리자: 개발팀
최종수정: 2026-04-26
---

# 프론트엔드 데이터 흐름 및 상태 관리 정책

## 1. 핵심 원칙

> **영역 간 데이터 공유는 API 재조회로 한다. 클라이언트 filter로 대체하지 않는다.**

- 부모 → 자식 props 전달로 필터링 **금지**
- 공유 배열을 여러 컴포넌트에서 참조하여 클라이언트 filter **금지**
- 각 영역(목록/상세/자식목록)은 **독립 reactive 상태**와 **독립 API 조회**를 가진다

---

## 2. 상태 선언 규칙

### 2-1. 반드시 `reactive` 사용, `ref` 금지

```js
// ✅ 올바른 패턴
const items   = reactive([]);   // 배열
const form    = reactive({});   // 폼 객체
const uiState = reactive({ loading: false, error: null });

// ❌ 금지
const items = ref([]);
const form  = ref({});
```

### 2-2. `.value` 접근 금지

`reactive([])` / `reactive({})` 는 `.value` 없이 직접 접근한다.

```js
// ✅
items.push(newItem);
items.splice(idx, 1);
const idx = items.findIndex(x => x.id === id);

// ❌
items.value.push(newItem);
items.value.splice(idx, 1);
```

---

## 3. API 조회 트리거 패턴

### 3-1. 검색 [조회] 버튼

```js
const searchParam = reactive({ searchValue: '', status: '', dateStart: '', dateEnd: '' });

const onSearch = async () => {
  pager.page = 1;
  await handleSearchList();   // searchParam을 API params로 전달
};

const handleSearchList = async () => {
  uiState.loading = true;
  try {
    const res = await window.boApi.get('/bo/.../page', {
      params: { pageNo: pager.page, pageSize: pager.size, ...searchParam }
    });
    items.splice(0, items.length, ...(res.data?.data?.list || []));
  } finally {
    uiState.loading = false;
  }
};
```

> `cfFiltered` computed로 클라이언트 필터링 **하지 않는다**.  
> searchParam은 항상 API params로 서버에 전달한다.

### 3-2. 좌측 트리 아이템 클릭 → 우측 목록 조회

```js
const selectedId = reactive({ value: null });

const onSelectNode = async (id) => {
  selectedId.value = id;
  await handleSearchList();   // selectedId를 API params로 전달하여 재조회
};
```

> 클라이언트 filter로 우측 목록을 구성하지 않는다.

### 3-3. 목록 행 클릭 → 자식 목록 조회

```js
// 부모 목록과 자식 목록은 완전히 독립된 reactive 상태
const parentItems = reactive([]);
const childItems  = reactive([]);   // 독립 선언

const onSelectRow = async (parentId) => {
  uiStateDetail.selectedId = parentId;
  await handleSearchData(parentId);  // 자식 독립 API 조회
};

const handleSearchData = async (parentId) => {
  const res = await window.boApi.get(`/bo/.../child`, { params: { parentId } });
  childItems.splice(0, childItems.length, ...(res.data?.data?.list || []));
};
```

### 3-4. 목록 → [신규] / [수정] / [상세] 클릭

```js
// Dtl 컴포넌트는 독립 API 조회 — 부모 목록 배열 참조 금지
const form = reactive({ id: null, title: '', ... });

onMounted(async () => {
  if (!cfIsNew.value) {
    await handleSearchDetail();   // dtlId로 단건 API 조회
  }
});

const handleSearchDetail = async () => {
  const res = await window.boApi.get(`/bo/.../${props.dtlId}`);
  Object.assign(form, res.data?.data || {});
};
```

> 부모 Mng 컴포넌트의 `items` 배열에서 `find()`로 꺼내 쓰지 않는다.

---

## 4. 페이지네이션

서버 페이지네이션을 사용한다. 클라이언트에서 `slice()`로 페이지를 구성하지 않는다.

```js
const pager = reactive({ page: 1, size: 10, total: 0, totalPages: 0 });

const handleSearchList = async () => {
  const res = await window.boApi.get('/bo/.../page', {
    params: { pageNo: pager.page, pageSize: pager.size, ...searchParam }
  });
  const data = res.data?.data;
  items.splice(0, items.length, ...(data?.list || []));
  pager.total      = data?.total || 0;
  pager.totalPages = data?.totalPages || Math.ceil(pager.total / pager.size);
};

// cfFiltered, cfTotal, cfTotalPages, cfPageList computed 제거
// cfPageNums만 computed로 유지 (페이지 번호 배열 계산)
const cfPageNums = computed(() => {
  const cur = pager.page, last = pager.totalPages;
  const s = Math.max(1, cur - 2), e = Math.min(last, s + 4);
  return Array.from({ length: e - s + 1 }, (_, i) => s + i);
});
```

---

## 5. 금지 패턴 요약

| 금지 패턴 | 대체 방법 |
|---|---|
| `ref([])` / `ref({})` | `reactive([])` / `reactive({})` |
| `items.value.push()` | `items.push()` |
| `cfFiltered = computed(() => items.filter(...))` | searchParam을 API params로 전달하여 서버 필터링 |
| 부모 배열을 props로 받아 자식에서 filter | 자식이 직접 API 조회 |
| `items.find(x => x.id === dtlId)` 로 Dtl 폼 초기화 | Dtl에서 단건 API GET |
| 트리 클릭 후 클라이언트 filter로 우측 목록 구성 | 트리 클릭 시 API 재조회 |
| `pageSize: 10000` 전체 로드 후 클라이언트 slice | 서버 페이지네이션 |

---

## 6. 허용 예외

| 예외 | 조건 |
|---|---|
| 코드 스토어(`boCodeStore`) 조회 결과 computed 매핑 | 전역 코드는 초기화 시 1회 로드 후 공유 |
| 트리 노드 펼침/닫기 상태(`expanded Set`) | UI 상태이므로 로컬 관리 허용 |
| 폼 내 소계/합계 `computed` | 서버 재조회 없이 계산 가능한 파생값 |
| `cfPageNums` computed | 페이지 번호 배열은 계산값 |
| `cfIsNew`, `cfDetailKey` 등 단순 UI 상태 computed | 서버 데이터 비의존 |
| **[FO] 상품목록 카테고리·필터 클라이언트 computed** | Prod*List.js — 무한스크롤/더보기 UX 패턴, 전체 로드 후 즉각 반응이 UX 요건 |
| **[FO] Blog/Event 카테고리 탭 필터 computed** | 탭 클릭 시 API 재조회 시 깜빡임 발생, UX상 클라이언트 필터 허용 |
| **[FO] Pinia store `storeToRefs` computed** | My페이지(MyClaim 등) — 스토어 레이어에서 관리, 컴포넌트 내 재정의 불필요 |
| **[BO] 이력(Hist) 페이지 클라이언트 필터** | 로그 뷰어 패턴, 대량 이력은 탭/날짜 클라이언트 필터 허용 |
| **[BO] CRUD 그리드 전체 로드** | SyCodeMng, SyAttachMng 등 — 항목 수 소량이고 인라인 편집이 필요한 경우 |

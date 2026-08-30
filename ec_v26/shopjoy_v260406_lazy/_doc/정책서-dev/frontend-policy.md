# 프론트엔드 개발 정책

## 데이터 조회 원칙

### 필터링 금지 — 항상 API 재조회

클라이언트 사이드 필터링(`Array.filter`)으로 목록을 가공하지 않는다.  
조건이 바뀌면 **항상 API를 다시 호출**해서 서버에서 데이터를 받아온다.

**이유**: 클라이언트 필터는 초기 로드 데이터만 기준으로 동작해 신규/수정 데이터가 누락될 수 있고, 페이징·정렬·권한 등 서버 조건과 불일치가 발생한다.

**적용 범위**: 모든 관리자(BO) 및 사용자(FO) 목록 컴포넌트

```js
// ❌ 금지 — 클라이언트 필터
const filtered = categories.filter(c => c.parentCategoryId === selId);

// ✅ 올바른 방식 — API 파라미터로 조건 전달
const res = await window.boApi.get('/bo/ec/pd/category/page', {
  params: { parentCategoryId: selId, pageNo: 1, pageSize: 1000 }
});
```

### 트리 + 그리드 분리 조회 패턴

좌측 트리와 우측 그리드가 함께 있는 화면(카테고리관리, 표시경로 등)은 **두 개의 독립 API 호출**로 구성한다.

| 함수 | 역할 | 호출 시점 |
|---|---|---|
| `handleSearchTree()` | 좌측 트리 전용 — 전체 목록 조회 (트리 빌드용) | 최초 진입, biz 변경, 저장 후 |
| `handleGridSearch()` | 우측 그리드 — 선택 조건 기반 API 재조회 | 최초 진입, 트리 노드 클릭, 검색/초기화, 저장 후 |

트리 노드 클릭 시 `watch(selectedId)` → `handleGridSearch()` 호출.  
`handleGridSearch`는 선택된 노드 ID를 `parentXxxId` 파라미터로 API에 전달한다.

**트리가 클라이언트 빌드인 이유**: 트리는 전체 계층 구조가 필요하므로 전체 로드 후 `parent_id` 기반으로 재귀 빌드. 단, 그리드는 절대 클라이언트 필터를 사용하지 않는다.

### 클라이언트 필터 금지 체크리스트

- `computed` 안에서 `rows.filter(...)` 로 목록 가공 — ❌ 금지
- `watch` 조건 변경 시 `Array.filter` 재계산 — ❌ 금지
- `cfGridRows = computed(() => rows.filter(...))` 패턴 — ❌ 금지
- 조건 변경 시 API `params`에 조건 추가해 재호출 — ✅ 올바름

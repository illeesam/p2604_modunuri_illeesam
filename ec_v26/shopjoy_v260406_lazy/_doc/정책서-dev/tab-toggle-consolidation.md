# Vue 3 Composition API: Tab/Toggle Button 그룹 consolidation 정책

## 개요
개별 tab ref (`activeTab`, `bulkTab`, `botTab`, `topTab`, `mainTab`, `previewTab` 등) 및 toggle ref (`isExpanded`, `isOpen`, `showDetail`, `collapsed` 등)를 consolidated reactive 객체로 통합.

## 패턴

### 1. 탭 버튼 모음 (Tab Navigation)
**패턴**: `uiState`, `pageUI` 등 통합 UI state 객체 내에 탭 상태 포함

```javascript
// ❌ Before: 개별 ref
const activeTab = ref('info');
const bulkTab = ref('status');
const botTab = ref('products');
const previewTab = ref('barcode');

// ✅ After: consolidated reactive
const uiState = reactive({
  activeTab: 'info',        // Dtl 메인 탭
  bulkTab: 'status',        // Mng 일괄작업 탭
  botTab: 'products',       // Hist/하단 탭
  previewTab: 'barcode',    // Preview 탭
});

// 뷰 상태 영속화
watch(uiState, (newVal) => {
  if (window._ecOrderDtlState) {
    window._ecOrderDtlState.activeTab = newVal.activeTab;
    window._ecOrderDtlState.tabMode = newVal.tabMode;
  }
}, { deep: true });
```

**대표 탭 이름**:
- `activeTab`: Dtl 컴포넌트 주탭 (기본)
- `bulkTab`: Mng 일괄작업 선택 모달의 탭
- `botTab`: Hist/상세화면 하단 탭
- `topTab`: 상단 탭 (여러 개일 경우)
- `mainTab`: 주요 탭
- `previewTab`: 미리보기 탭
- `contentTab`: 컨텐츠 영역 탭

---

### 2. 토글/아코디언 버튼 모음 (Toggle/Accordion)
**패턴**: `expanded` 또는 `collapsed` Set/Map으로 상태 관리

```javascript
// ❌ Before: 개별 ref (또는 Boolean으로 관리)
const isExpanded = ref(false);
const showDetail = ref(false);
const section1Expanded = ref(true);
const section2Expanded = ref(false);

// ✅ After: Set으로 관리 (다중 섹션 동시 확장)
const expanded = reactive(new Set(['section1']));

// 또는 객체로 관리 (섹션별 상태)
const toggleState = reactive({
  section1: true,
  section2: false,
  detail: false,
});

// Helper 함수
const toggleExpanded = (sectionId) => {
  if (expanded.has(sectionId)) {
    expanded.delete(sectionId);
  } else {
    expanded.add(sectionId);
  }
};

const isExpanded = (sectionId) => expanded.has(sectionId);
```

**사용 시나리오**:
- 계층 트리 노드 (경로선택, 메뉴선택): `expanded = new Set()`
- 아코디언 섹션: `toggleState = reactive({ section1: true, ... })`
- 상세 스니펫/폴더: `expanded = new Set()`

---

### 3. 여러 탭/토글 혼합 (복합 UI)

```javascript
// ✅ After: 모든 UI 상태를 하나의 객체로 관리
const pageUI = reactive({
  // 탭
  activeTab: 'info',
  bulkTab: 'status',
  botTab: 'products',
  
  // 토글
  searchExpanded: true,
  advancedExpanded: false,
  detailExpanded: false,
  
  // 선택
  selectedRowId: null,
  expandedNodes: new Set(),
});

// 템플릿에서
// <div v-if="pageUI.searchExpanded" class="search-section">...</div>
// <tab-button :active="pageUI.activeTab === 'info'" @click="pageUI.activeTab = 'info'">정보</tab-button>
```

---

## 적용 규칙

### 탭 이름 선택 기준

| 컨텍스트 | 이름 | 예시 |
|---------|------|------|
| Dtl 주탭 | `activeTab` | OdOrderDtl, PdProdDtl |
| Mng 일괄작업 탭 | `bulkTab` | OdOrderMng bulk modal |
| Hist/하단 탭 | `botTab` | OdOrderHist, OdClaimHist |
| 메인탭 (여러개) | `mainTab`, `topTab` | DpDispUiSimul |
| Preview 탭 | `previewTab` | PmCouponDtl, PmVoucherDtl |
| 특정 섹션 탭 | `{section}Tab` | `contentTab`, `previewTab` |

### 토글 타입별 구현

**Type 1: 단일 Boolean 토글**
```javascript
// 간단한 show/hide (폴더, 섹션)
const showDetail = ref(true);
// ⟹ 유지해도 좋지만, 여러 개일 경우 객체 권장
```

**Type 2: 다중 섹션 토글 (Set)**
```javascript
const expanded = reactive(new Set(['section1', 'section2']));
const toggleSection = (id) => {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id);
};
```

**Type 3: 이름이 지정된 토글 (객체)**
```javascript
const toggleState = reactive({
  searchExpanded: true,
  filterExpanded: false,
  advancedExpanded: false,
});
// 또는
const ui = reactive({
  showSearch: true,
  showFilter: false,
  showAdvanced: false,
});
```

---

## 템플릿 바인딩

```html
<!-- 탭 -->
<button 
  v-for="tab in ['info', 'items', 'payment']" 
  :key="tab"
  :class="{ active: pageUI.activeTab === tab }"
  @click="pageUI.activeTab = tab">
  {{ tab }}
</button>

<!-- 탭 컨텐츠 -->
<div v-if="pageUI.activeTab === 'info'" class="tab-content">...</div>

<!-- 토글 (객체) -->
<button @click="pageUI.searchExpanded = !pageUI.searchExpanded">
  {{ pageUI.searchExpanded ? '▼' : '▶' }} 검색
</button>
<div v-if="pageUI.searchExpanded" class="search-box">...</div>

<!-- 토글 (Set) -->
<button @click="toggleExpanded('section1')" class="tree-toggle">
  {{ expanded.has('section1') ? '▼' : '▶' }}
</button>
```

---

## 탭/토글 영속화

Dtl 컴포넌트의 탭 상태를 행 전환 시에도 유지:

```javascript
const uiState = reactive({
  activeTab: window._ecOrderDtlState?.activeTab || 'info',
  tabMode: window._ecOrderDtlState?.tabMode || 'tab',
});

watch(uiState, (newVal) => {
  if (!window._ecOrderDtlState) window._ecOrderDtlState = {};
  window._ecOrderDtlState.activeTab = newVal.activeTab;
  window._ecOrderDtlState.tabMode = newVal.tabMode;
}, { deep: true });
```

---

## 마이그레이션 체크리스트

### 각 파일별 수행 항목
- [ ] 개별 `activeTab = ref` → `uiState.activeTab` (또는 `pageUI.activeTab`)
- [ ] 개별 `bulkTab = ref` → `uiState.bulkTab`
- [ ] 개별 `botTab = ref` → `uiState.botTab`
- [ ] 개별 `previewTab = ref` → `uiState.previewTab`
- [ ] 개별 토글 ref → `uiState` 객체 또는 `expanded` Set으로 통합
- [ ] watch 의존성 업데이트 (전체 객체 감시)
- [ ] 템플릿 바인딩 업데이트
- [ ] return 문 업데이트 (`uiState` 또는 개별 속성 export)
- [ ] 탭 영속화 로직 확인 (window._ec*DtlState)

---

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| ref 항목 수 (Dtl) | 10-15개 | 1개 (uiState) |
| 상태 관리 응집도 | 분산 | 그룹화 |
| 코드 간결성 | 낮음 | 높음 |
| 템플릿 바인딩 복잡도 | 높음 | 낮음 |

---

## 적용 예시

### Before
```javascript
const activeTab = ref('info');
const bulkTab = ref('status');
const botTab = ref('products');
const previewTab = ref('barcode');
const isExpanded = ref(false);
const showDetail = ref(false);

watch(activeTab, v => { window._ecOrderDtlState.activeTab = v; });
watch(bulkTab, v => { ... });

return { activeTab, bulkTab, botTab, previewTab, isExpanded, showDetail, ... };
```

### After
```javascript
const uiState = reactive({
  activeTab: window._ecOrderDtlState?.activeTab || 'info',
  bulkTab: 'status',
  botTab: 'products',
  previewTab: 'barcode',
  isExpanded: false,
  showDetail: false,
});

watch(uiState, (newVal) => {
  window._ecOrderDtlState.activeTab = newVal.activeTab;
}, { deep: true });

return { uiState, ... };
```

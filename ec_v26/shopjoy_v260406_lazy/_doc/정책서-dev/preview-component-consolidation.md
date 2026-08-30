# Preview 컴포넌트: 조회 조건 통합 정책

## 개요
Preview 컴포넌트들의 산재된 조회 조건 refs (previewDate, previewTime, filterType, filterStatus, filterVisibility, filterDispEnv, searchKw, searchStatus, searchVisibility 등)를 consolidated reactive 객체로 통합.

## 패턴

### Before (개별 ref)
```javascript
// UI 상태
const mainTab      = ref('preview');
const tabMode     = ref('card');
const showDesc     = ref(true);
const showAreaDrop = ref(false);

// 조회 조건
const previewDate     = ref(today);
const previewTime     = ref(nowTime);
const filterType      = ref('');
const filterStatus    = ref('활성');
const filterVisibility = ref('');
const filterDispEnv   = ref('PROD');
const searchKw        = ref('');
const searchStatus    = ref('활성');
const searchVisibility = ref('');
```

### After (consolidated reactive)
```javascript
// UI 상태
const uiState = reactive({
  mainTab: 'preview',        // 'preview' | 'struct' | 'source'
  tabMode: 'card',          // 'list' | 'card' | 'expand'
  showDesc: true,
  showAreaDrop: false,
});

// 조회 조건
const searchParam = reactive({
  previewDate: today,
  previewTime: nowTime,
  filterType: '',
  filterStatus: '활성',
  filterVisibility: '',
  filterDispEnv: 'PROD',
  searchValue: '',
  status: '활성',
  visibility: '',
});

const searchParamOrg = reactive({
  previewDate: today,
  previewTime: nowTime,
  filterType: '',
  filterStatus: '활성',
  filterVisibility: '',
  filterDispEnv: 'PROD',
  searchValue: '',
  status: '활성',
  visibility: '',
});

// 리셋 함수
const onReset = () => {
  Object.assign(searchParam, searchParamOrg);
};
```

## 적용 대상

Preview 컴포넌트 6개:
- **DpDispUiPreview.js** ✅ 완료
- **DpDispAreaPreview.js**
- **DpDispPanelPreview.js**
- **DpDispWidgetPreview.js**
- **DpDispWidgetLibPreview.js**

UI 시뮬레이션 컴포넌트:
- **DpDispUiSimul.js** ✅ 완료

## 마이그레이션 체크리스트

### 각 파일별 수행 항목
- [ ] 개별 UI state ref → `uiState` reactive 통합
  - `mainTab`, `tabMode`, `showDesc`, `showAreaDrop` 등
- [ ] 개별 조회/필터 ref → `searchParam`, `searchParamOrg` 통합
  - `previewDate`, `previewTime`, `filterType`, `filterStatus`, `filterVisibility`, `filterDispEnv`
  - `searchKw`, `searchStatus`, `searchVisibility`
- [ ] 함수 업데이트: `switchTab()`, `resetDate()`, `panelFilter()` 등
- [ ] 템플릿 v-model 바인딩 업데이트
- [ ] return 문 업데이트
- [ ] 모든 `.value` 제거

## 템플릿 바인딩 예시

```html
<!-- Before -->
<input type="date" v-model="previewDate" />
<select v-model="searchStatus"></select>
<button @click="mainTab='preview'">Preview</button>

<!-- After -->
<input type="date" v-model="searchParam.previewDate" />
<select v-model="searchParam.status"></select>
<button @click="uiState.mainTab='preview'">Preview</button>
```

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| ref 개수 (Preview) | 12-15개 | 2개 (uiState, searchParam) |
| 코드 응집도 | 분산 | 그룹화 |
| 상태 초기화 복잡도 | 높음 | 낮음 (Object.assign) |

## DpDispUiSimul.js 적용 결과

**변경 사항**:
- `mainTab = ref()` → `uiState.mainTab`
- `tabMode = ref()` → `uiState.tabMode`
- `showDesc = ref()` → `uiState.showDesc`
- `showAreaDrop = ref()` → `uiState.showAreaDrop`
- `previewDate = ref()` → `searchParam.previewDate`
- `previewTime = ref()` → `searchParam.previewTime`
- `searchStatus = ref()` → `searchParam.status`
- `searchVisibility = ref()` → `searchParam.visibility`

**함수 업데이트**:
- `switchTab(tab)`: `mainTab.value = tab` → `uiState.mainTab = tab`
- `resetDate()`: 새로운 `onReset()` 함수로 통합
- `isDateInRange()`, `panelFilter()`: searchParam 속성으로 참조

**템플릿 업데이트**:
- v-model 바인딩 모두 업데이트
- 조건부 렌더링 (`:style`, `v-if` 등) 모두 업데이트
- 이벤트 핸들러 (`@click`) 모두 업데이트

# codes Reactive 패턴 (uiState와 함께 통합 상태관리)

## 개요

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
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
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
      kw: '',
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
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
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
| **uiState 필수 항목** | `loading`, `error`, `isPageCodeLoad` |
| **codes 항목** | 필요한 code_grp별로 카멜케이스 속성 |
| **isAppReady computed** | `!initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad` |
| **fnLoadCodes 함수** | codes 항목들을 snGetGrpCodes()로 주입 + `uiState.isPageCodeLoad = true` |
| **watch 위치** | setup 루트 레벨 (onMounted 외부) |
| **onMounted 역할** | isAppReady 즉시 체크 + 데이터 로드 |

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

- [ ] `uiState.isPageCodeLoad: false` 추가
- [ ] `codes` reactive 정의 (필요한 항목들)
- [ ] `isAppReady` computed 작성
- [ ] `fnLoadCodes()` 함수 구현
- [ ] `watch(isAppReady, ...)` 추가
- [ ] `onMounted`에서 `if (isAppReady.value) fnLoadCodes()` 추가
- [ ] Template에서 `codes.속성` 사용
- [ ] return에 `codes`, `uiState` 포함


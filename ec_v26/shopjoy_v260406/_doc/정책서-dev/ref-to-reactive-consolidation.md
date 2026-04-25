# Vue 3 Composition API: ref → reactive 통합 정책

## 개요
개별 ref() 선언을 consolidated reactive() 객체로 통합하여 상태 관리 단순화 및 코드 응집도 향상.

## 카테고리별 통합 패턴

### 1. 검색란 (Search Form)
**패턴**: `searchParam`, `searchParamOrg`

```javascript
// ❌ Before: 개별 ref
const searchKw = ref('');
const searchType = ref('');
const searchStatus = ref('');
const searchDateStart = ref('');
const searchDateEnd = ref('');
const previewDate = ref(today);
const previewTime = ref(nowTime);
const filterType = ref('');
const filterStatus = ref('활성');
const filterVisibility = ref('');
const filterDispEnv = ref('PROD');
const searchVisibility = ref('');

// ✅ After: consolidated reactive
const searchParam = reactive({
  kw: '',
  type: '',
  status: '',
  dateStart: '',
  dateEnd: '',
  dateRange: '',
  // 추가 필터
  previewDate: today,
  previewTime: nowTime,
  filterType: '',
  filterStatus: '활성',
  filterVisibility: '',
  filterDispEnv: 'PROD',
  visibility: '',
});
const searchParamOrg = reactive({
  kw: '',
  type: '',
  status: '',
  dateStart: '',
  dateEnd: '',
  dateRange: '',
  previewDate: today,
  previewTime: nowTime,
  filterType: '',
  filterStatus: '활성',
  filterVisibility: '',
  filterDispEnv: 'PROD',
  visibility: '',
});

// 초기화 & 리셋
onMounted(() => {
  Object.assign(searchParamOrg, searchParam);
});

const onReset = () => {
  Object.assign(searchParam, searchParamOrg);
};
```

**필드 포함**:
- 키워드 검색: kw
- 타입/카테고리: type, cate, category
- 상태: status, useYn, statusCd
- 날짜: dateStart, dateEnd, dateRange
- 미리보기: previewDate, previewTime
- 필터: filterType, filterStatus, filterVisibility, filterDispEnv, visibility
- 기타: grade, rating 등

---

### 2. 작성란 (Form / Edit Form)
**패턴**: `form`, `formErrors`, `formOrg`

```javascript
// ❌ Before: 개별 ref
const title = ref('');
const content = ref('');
const status = ref('ACTIVE');
const useYn = ref('Y');

// ✅ After: consolidated reactive
const form = reactive({
  title: '',
  content: '',
  status: 'ACTIVE',
  useYn: 'Y',
  // ... other fields
});

const formErrors = reactive({
  title: '',
  content: '',
  // ... error fields
});

const formOrg = reactive({
  title: '',
  content: '',
  status: 'ACTIVE',
  useYn: 'Y',
});

// 로드 & 수정 감지
const handleLoadDetail = (id) => {
  const data = items.find(x => x.id === id);
  if (data) {
    Object.assign(form, data);
    Object.assign(formOrg, data);
  }
};

const onSave = async () => {
  // Validation
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  const isNewRow = !form.id || form.id.startsWith('__new');
  const ok = await props.showConfirm('저장', '저장하시겠습니까?');
  if (!ok) return;
  // API call...
};

const onReset = () => {
  Object.assign(form, formOrg);
};
```

**필드 포함**:
- 기본 정보: 이름(name, nm), 제목(title), 내용(content, description, desc)
- 상태: status, useYn, statusCd
- 날짜: regDate, modDate, startDate, endDate
- 옵션: type, category, priority 등
- `formErrors`: Yup validation 오류 저장소

---

### 3. 모달모음 (Modal States)
**패턴**: `{componentName}Modal`, `detailModal`, `pickerModal` 등

```javascript
// ❌ Before: 분산된 ref
const productModal = ref(false);
const selectedProductId = ref(null);
const customerModal = ref(false);
const selectedCustomerId = ref(null);

// ✅ After: consolidated reactive modal group
const productModal = reactive({
  show: false,
  product: null,
  mode: 'view' // 'view' | 'edit'
});

const customerModal = reactive({
  show: false,
  customer: null,
  order: null
});

const detailModal = reactive({
  show: false,
  editId: null,
  viewMode: 'tab' // 'tab' | '1col' | '2col' | '3col' | '4col'
});

// 사용
const openProductModal = (product) => {
  productModal.product = product;
  productModal.show = true;
};

const closeProductModal = () => {
  productModal.show = false;
  productModal.product = null;
};
```

**구조**:
- `show`: 모달 표시 여부
- `{dataName}`: 모달에 표시할 데이터 (product, customer, order 등)
- `mode`: 'view' | 'edit' | 기타 뷰 모드
- `viewMode`: 탭/열 레이아웃 모드 (Dtl 컴포넌트용)

---

## 적용 범위

### Mng.js (관리 목록 컴포넌트)
- **검색란**: 필수
- **작성란**: 상세 편집 기능 있을 경우 필수
- **모달모음**: 참조 모달, 상세 모달이 있을 경우 필수

### Dtl.js (상세 편집 컴포넌트)
- **작성란**: 필수 (form, formErrors, formOrg)
- **모달모음**: 부분편집/피커 모달 있을 경우

### 기타 컴포넌트 (Header, Sidebar, Footer 등)
- **모달모음**: 전역 모달 state (예: AppFooter의 layerModal)

### Pinia Store (foMyStore, boCodeStore 등)
- **모달모음**: 공유 모달 상태
- **상태 객체**: 페이지별 UI state (pager, filter, selectedId 등)

---

## 템플릿 바인딩

```html
<!-- 검색란 -->
<input v-model="searchParam.kw" placeholder="검색">
<select v-model="searchParam.type">
  <option value="">전체</option>
  <option value="A">타입A</option>
</select>

<!-- 작성란 -->
<input v-model="form.title" :class="{ 'is-invalid': formErrors.title }">
<span class="field-error" v-if="formErrors.title">{{ formErrors.title }}</span>

<!-- 모달 -->
<div v-if="productModal.show" class="modal-overlay">
  <div class="modal-box">
    <h3>{{ productModal.mode === 'edit' ? '편집' : '상세' }}</h3>
    <product-item :product="productModal.product" :mode="productModal.mode" />
    <button @click="closeProductModal">닫기</button>
  </div>
</div>
```

---

## 마이그레이션 체크리스트

### 각 파일별 수행 항목
- [ ] 개별 search* ref → searchParam 통합
- [ ] searchDateRange 처리 (searchParam.dateRange로 변경)
- [ ] cfFiltered / computed 필터 업데이트 (applied 제거)
- [ ] 개별 form* ref → form, formErrors, formOrg 통합
- [ ] 개별 modal* ref → {name}Modal reactive 통합
- [ ] template v-model 바인딩 업데이트
- [ ] return 문 업데이트
- [ ] onMounted 초기화 로직 확인

---

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| ref 항목 수 (대형 Mng.js) | 20-30개 | 5-8개 |
| 상태 관리 응집도 | 산재 | 그룹화 |
| Object.assign 활용 | 거의 없음 | 광범위 |
| 코드 가독성 | 낮음 | 높음 |
| 상태 초기화 코드 | 반복 | 재사용 |

---

## 주의사항

1. **watch 의존성**: `watch([searchParam], ...)` 형태로 reactive 객체 전체 감시
   - 개별 필드 감시 필요 시: `watch(() => searchParam.kw, ...)`

2. **Yup validation**: formErrors는 동적 키(validation 결과) 저장용
   ```javascript
   try {
     await schema.validate(form, { abortEarly: false });
   } catch (err) {
     err.inner.forEach(e => { formErrors[e.path] = e.message; });
   }
   ```

3. **모달 영속화**: Dtl 뷰모드는 window._ec{X}DtlState에 저장
   ```javascript
   if (!window._ecOrderDtlState) window._ecOrderDtlState = { tab: 'info', viewMode: 'tab' };
   watch(viewMode, v => { window._ecOrderDtlState.viewMode = v; });
   ```

4. **템플릿 무한루프 방지**: form.field 수정 시 formOrg와 비교
   ```javascript
   const onCellChange = (row) => {
     const changed = FIELDS.some(f => row[f] !== row._orig[f]);
     row._row_status = changed ? 'U' : 'N';
   };
   ```

---

## 적용 순서

1. **Phase 1**: Mng.js 검색란 (searchParam) ✅ 완료
2. **Phase 2**: Mng.js 모달/상세 (form, modal) ← 현재
3. **Phase 3**: Dtl.js 작성란 (form, formErrors, formOrg)
4. **Phase 4**: 기타 컴포넌트 (Header, Footer, Store)


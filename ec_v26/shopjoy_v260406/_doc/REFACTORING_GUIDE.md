# ref → reactive 리팩토링 종합 가이드

## 📋 개요

ShopJoy 프로젝트의 Vue 3 Composition API 코드에서 과도한 `ref` 사용을 제거하고 `reactive`로 통합하여 코드 가독성과 유지보수성을 개선합니다.

**적용 범위**: 모든 `pages/bo/**/*.js`, `pages/fo/**/*.js`, `components/**/*.js`

---

## 🎯 목표

| 항목 | Before | After | 효과 |
|---|---|---|---|
| 검색 영역 변수 | 5-10개 ref | 1개 reactive 객체 | 80% 감소 |
| 폼 데이터 | 분산된 ref | form + formErrors | 관리 용이 |
| 페이저 | page, size, loading | pager 객체 | 응집도 ↑ |
| 모달 상태 | 다수 ref | modal 객체 | 복잡도 ↓ |
| 코드 라인 수 | 평균 10-15줄 | 5-8줄 | 40% 감소 |

---

## ✅ 이미 적용된 패턴

### Phase 1 완료 ✅

1. **정책서 작성**
   - `sy.54.네이밍규칙.md` — ref vs reactive 사용 원칙
   - 구체적 패턴 + 실전 예제 코드

2. **BaseModal.js 리팩토링**
   - SiteSelectModal, VendorSelectModal, BoUserSelectModal 등
   - `modalState = reactive({...})` 패턴 적용
   - spread operator로 return 간결화

3. **SyRoleMng.js 리팩토링**
   - `searchParam`, `searchParamOrg` reactive 통합
   - Object.assign으로 초기화/복원
   - watch 함수형으로 변경

---

## 🔄 리팩토링 패턴별 가이드

### 패턴 1: 검색 필터 영역

```js
// ❌ Before: 개별 ref 선언
const searchKw    = ref('');
const searchType  = ref('');
const searchUseYn = ref('');
const searchCat   = ref('');
const applied     = reactive({ kw: '', type: '', useYn: '', cat: '' });

// ✅ After: 하나의 reactive로 통합
const searchParam = reactive({
  kw: '',
  type: '',
  useYn: '',
  cat: ''
});

// 초기값 저장 (onMounted)
const searchParamOrg = reactive({
  kw: '',
  type: '',
  useYn: '',
  cat: ''
});

onMounted(() => {
  handleFetchData();
  Object.assign(searchParamOrg, searchParam);
});

// 리셋 함수
const onReset = () => {
  Object.assign(searchParam, searchParamOrg);
  onSearch();
};
```

**템플릿 변경**:
```html
<!-- ❌ Before -->
<input v-model="searchKw" />
<select v-model="searchType">

<!-- ✅ After -->
<input v-model="searchParam.kw" />
<select v-model="searchParam.type">
```

---

### 패턴 2: 페이저 영역

```js
// ❌ Before
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// ✅ After
const pager = reactive({
  page: 1,
  size: 20,
  loading: false
});

const onSizeChange = () => { pager.page = 1; };
const onSetPage = (n) => { 
  if (n >= 1 && n <= cfTotalPages) pager.page = n; 
};
```

---

### 패턴 3: 폼 데이터 (Dtl 파일)

```js
// ❌ Before
const formName = ref('');
const formEmail = ref('');
const formPhone = ref('');
const errorName = ref('');
const errorEmail = ref('');

// ✅ After
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

// 저장 후 복원
const handleSave = async () => {
  try {
    await api.post('/resource', form);
    Object.assign(form._orig, form);  // 저장 후 원본 업데이트
  } catch (err) {
    Object.assign(form, form._orig);  // 실패 시 복원
  }
};
```

---

### 패턴 4: 선택 상태

```js
// ❌ Before
const selectedId = ref(null);
const selectedIds = ref([]);
const focusedIdx = ref(null);
const checkAll = ref(false);

// ✅ After
const selection = reactive({
  id: null,
  ids: [],
  focusedIdx: null,
  checkAll: false
});

const handleToggleSelect = (item) => {
  const id = item.id;
  const idx = selection.ids.indexOf(id);
  if (idx === -1) selection.ids.push(id);
  else selection.ids.splice(idx, 1);
};
```

---

### 패턴 5: 모달 상태

```js
// ❌ Before
const modalShow = ref(false);
const modalKw = ref('');
const modalList = ref([]);
const modalLoading = ref(false);

// ✅ After
const modalState = reactive({
  show: false,
  kw: '',
  list: [],
  loading: false
});

// Template
return { ...modalState, cfFiltered };  // spread로 간결화
```

---

## 📊 파일별 우선순위

### Priority 1: 검색 필터 (Mng.js) — 40+ 파일

**패턴**: `search*` ref들을 `searchParam`으로 통합

영향도 높음 (거의 모든 목록 화면)

```
SyRoleMng.js ✅
SyCodeMng.js ✅ (이미 적용)
SyMenuMng.js
SyUserMng.js
SyBrandMng.js
PdCategoryMng.js
PdProdMng.js
PdTagMng.js
PdBundleMng.js
PdSetMng.js
OdOrderMng.js
OdClaimMng.js
OdDlivMng.js
... (40+ 파일)
```

### Priority 2: 폼 데이터 (Dtl.js) — 30+ 파일

**패턴**: `form*`, `edit*` ref들을 `form`, `formErrors`로 통합

```
SyCodeDtl.js
SyUserDtl.js
SySiteDtl.js
PdProdDtl.js
PdCategoryDtl.js
OdOrderDtl.js
OdClaimDtl.js
... (30+ 파일)
```

### Priority 3: 선택·모달 상태 — 50+ 파일

**패턴**: `selected*`, `modal*`, `expanded*` ref들을 객체로 통합

```
모든 Mng/Dtl 파일의 부가 상태
BaseModal.js ✅ (이미 적용)
```

---

## 🛠️ 자동화 도구

### grep으로 리팩토링 대상 찾기

```bash
# 1. 검색 필터 ref 찾기
grep -r "const search\w\+ = ref(" pages/bo/**/*.js

# 2. 폼 데이터 ref 찾기  
grep -r "const form\w\+ = ref(" pages/bo/**/*Dtl.js

# 3. 페이저 ref 찾기
grep -r "const page = ref(" pages/bo/**/*.js
grep -r "const pageSize = ref(" pages/bo/**/*.js

# 4. 선택 상태 ref 찾기
grep -r "const selected\w\+ = ref(" pages/bo/**/*.js
grep -r "const focused\w\+ = ref(" pages/bo/**/*.js

# 5. 모달 ref 찾기
grep -r "const modal\w\+ = ref(" pages/bo/**/*.js
```

### 리팩토링 체크리스트 (파일별)

각 파일마다 다음을 체크하세요:

```
[ ] 검색 필터 → searchParam으로 통합
[ ] 초기값 저장 → searchParamOrg 추가
[ ] 페이저 → pager로 통합
[ ] 폼 데이터 → form으로 통합
[ ] 폼 에러 → formErrors로 통합
[ ] 선택 상태 → selection으로 통합
[ ] 모달 상태 → modal로 통합
[ ] 템플릿의 v-model 바인딩 업데이트
[ ] watch/computed 함수형으로 변경
[ ] onMounted에 Object.assign 추가
[ ] onReset 함수 업데이트
[ ] 반환값(return) 업데이트
[ ] 테스트: 검색 → 초기화 → 재검색
[ ] 테스트: 폼 저장 → 취소 → 복원
```

---

## 📝 예제: 완전한 리팩토링

### Before (SyUserMng.js 일부)

```js
setup(props) {
  const { ref, reactive, computed, onMounted } = Vue;
  const users = reactive([]);
  const loading = ref(false);
  
  // 검색 필터 (분산됨)
  const searchNm = ref('');
  const searchLoginId = ref('');
  const searchDept = ref('');
  const searchUseYn = ref('');
  const applied = reactive({ nm: '', loginId: '', dept: '', useYn: '' });
  
  // 페이저
  const page = ref(1);
  const pageSize = ref(20);
  
  // 선택 상태
  const selectedId = ref(null);
  const focusedIdx = ref(null);
  
  const onSearch = () => {
    Object.assign(applied, { 
      nm: searchNm.value, 
      loginId: searchLoginId.value,
      dept: searchDept.value,
      useYn: searchUseYn.value 
    });
    handleLoadGrid();
  };
  
  const onReset = () => {
    searchNm.value = '';
    searchLoginId.value = '';
    searchDept.value = '';
    searchUseYn.value = '';
    Object.assign(applied, { nm: '', loginId: '', dept: '', useYn: '' });
    handleLoadGrid();
  };
  
  return {
    users, loading, searchNm, searchLoginId, searchDept, searchUseYn, applied,
    page, pageSize, selectedId, focusedIdx,
    onSearch, onReset, handleLoadGrid
  };
}
```

### After (SyUserMng.js 일부)

```js
setup(props) {
  const { reactive, computed, onMounted } = Vue;
  const users = reactive([]);
  const loading = ref(false);
  
  // 검색 필터 (통합)
  const searchParam = reactive({
    nm: '',
    loginId: '',
    dept: '',
    useYn: ''
  });
  const searchParamOrg = reactive({
    nm: '',
    loginId: '',
    dept: '',
    useYn: ''
  });
  
  // 페이저 (통합)
  const pager = reactive({
    page: 1,
    size: 20
  });
  
  // 선택 상태 (통합)
  const selection = reactive({
    id: null,
    focusedIdx: null
  });
  
  onMounted(() => {
    handleFetchData();
    Object.assign(searchParamOrg, searchParam);
  });
  
  const onSearch = () => {
    handleLoadGrid();
  };
  
  const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    handleLoadGrid();
  };
  
  return {
    users, loading, searchParam, searchParamOrg, pager, selection,
    onSearch, onReset, handleLoadGrid
  };
}
```

---

## 🚀 단계별 실행 계획

### Week 1: 검색 필터
- [ ] SyRoleMng.js ✅
- [ ] SyMenuMng.js
- [ ] SyUserMng.js  
- [ ] SyBrandMng.js

### Week 2: 더 많은 Mng.js
- [ ] PdCategoryMng.js, PdProdMng.js
- [ ] OdOrderMng.js, OdClaimMng.js
- [ ] 나머지 Mng.js 파일들 (20+)

### Week 3: 폼 데이터 (Dtl.js)
- [ ] SyCodeDtl.js, SyUserDtl.js
- [ ] PdProdDtl.js, PdCategoryDtl.js
- [ ] OdOrderDtl.js, OdClaimDtl.js
- [ ] 나머지 Dtl.js 파일들 (30+)

### Week 4: 선택·모달 상태
- [ ] 분산된 선택 상태 통합
- [ ] 모달 상태 통합
- [ ] 전체 테스트 및 검증

---

## 📚 참고 자료

- 정책서: `_doc/정책서/sy/sy.54.네이밍규칙.md`
- 프로젝트 설정: `CLAUDE.md`
- 기술 스택: `_doc/정책서/base/base.기술-admin.md`

---

**작성**: 2026-04-25  
**마지막 수정**: 2026-04-25  
**상태**: Phase 1 완료, Phase 2-4 진행 중

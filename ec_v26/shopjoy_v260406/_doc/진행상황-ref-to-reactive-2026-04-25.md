# Vue 3 ref → reactive 통합 리팩토링 진행상황
**최종 업데이트**: 2026-04-25

## 📊 Phase 2 완료 현황

### ✅ Phase 2-1: Mng.js 검색란 (searchParam) - 완료
**28개 파일**
- SyMenuMng, SyUserMng, SyBrandMng
- SyCodeMng, SyDeptMng, SyRoleMng
- SyTemplateMng, SyVendorMng, SySiteMng
- MbMemGradeMng, MbMemGroupMng
- CmNoticeMng, CmBlogMng, CmChattMng
- PdCategoryMng, PdProdMng, PdTagMng, PdBundleMng, PdSetMng
- PdQnaMng, PdReviewMng, PdCategoryProdMng
- OdOrderMng, OdClaimMng, OdDlivMng
- PmCouponMng, PmEventMng, PmCacheMng
- DpDispUiMng, DpDispAreaMng, DpDispPanelMng

**적용 패턴**:
```javascript
const searchParam = reactive({
  searchValue: '', type: '', status: '', dateStart: '', dateEnd: '', dateRange: ''
});
const searchParamOrg = reactive({...});
Object.assign(searchParamOrg, searchParam); // onMounted
Object.assign(searchParam, searchParamOrg); // onReset
```

### 🔄 Phase 2-2: Mng.js 모달/상세 (detailModal) - 시작
**1개 파일 샘플 완료**
- CmBlogMng.js

**적용 패턴**:
```javascript
const detailModal = reactive({
  show: false,
  isNew: false,
  dtlId: null,
  form: {}
});

// Before: selectedId (ref), isNew (ref), form (reactive)
// After: detailModal.show, detailModal.isNew, detailModal.dtlId, detailModal.form
```

---

## 📈 통계

| 항목 | 개수 | 진행도 |
|------|------|--------|
| 전체 Mng.js 파일 | 69 | - |
| Phase 2-1 완료 | 28 | 40.6% |
| Phase 2-2 시작 | 1 | 1.4% |
| 남은 Phase 2 | 40 | 58% |

---

## 🎯 다음 단계

### Phase 2-2: Mng.js 모달/상세 (계속)
남은 27개 파일에 detailModal 패턴 적용:
1. 상세 모달이 있는 파일 식별
2. `selectedId` (ref) → `detailModal.dtlId`
3. `isNew` (ref) → `detailModal.isNew`
4. `form` → `detailModal.form`
5. `openDetail()`, `openNew()`, `closeDetail()` 함수 업데이트
6. return 문 업데이트
7. template 바인딩 업데이트

### Phase 2-3: Mng.js 참조 모달 (pickerModal, treeModal 등)
예: 경로 선택, 트리 선택, 제품 선택 모달

### Phase 3: Dtl.js 작성란 (form, formErrors, formOrg)
약 30개 파일

### Phase 4: 기타 컴포넌트
- Pinia Store (foMyStore, boCodeStore)
- Header, Sidebar, Footer
- 기타 utility 컴포넌트

---

## 📋 정책 문서
생성됨: `_doc/정책서-dev/ref-to-reactive-consolidation.md`

내용:
- 검색란 (searchParam, searchParamOrg) 패턴
- 작성란 (form, formErrors, formOrg) 패턴
- 모달모음 (detailModal, pickerModal 등) 패턴
- 템플릿 바인딩 예시
- watch/validation 주의사항
- 마이그레이션 체크리스트

---

## 💡 핵심 변화

### Before (개별 ref)
```javascript
const searchKw = ref('');
const searchType = ref('');
const selectedId = ref(null);
const isNew = ref(false);
const form = reactive({});
const productModal = ref(false);
const customerModal = ref(false);
```
→ **12개 개별 상태 변수**

### After (consolidated reactive)
```javascript
const searchParam = reactive({ searchValue: '', type: '' });
const detailModal = reactive({ dtlId: null, isNew: false, form: {} });
const productModal = reactive({ show: false, product: null });
const customerModal = reactive({ show: false, customer: null });
```
→ **4개 그룹 상태 객체**

---

## 🔧 CmBlogMng.js 샘플 변경 사항

### 선언부
```javascript
// Before
const selectedId = ref(null);
const form = reactive({});
const isNew = ref(false);

// After
const detailModal = reactive({
  show: false,
  isNew: false,
  dtlId: null,
  form: {}
});
```

### 함수부
```javascript
// Before
const openDetail = (row) => {
  if (selectedId.value === row.blogId) { selectedId.value = null; return; }
  Object.assign(form, { ...row });
  selectedId.value = row.blogId; isNew.value = false;
};

// After
const openDetail = (row) => {
  if (detailModal.dtlId === row.blogId) { detailModal.show = false; detailModal.dtlId = null; return; }
  Object.assign(detailModal.form, { ...row });
  detailModal.dtlId = row.blogId; detailModal.isNew = false; detailModal.show = true;
};
```

---

## 🚀 예상 효과 (Phase 2 전체 완료 시)

- **개별 ref 감소**: ~500+ → ~200 (60% 감소)
- **코드 응집도**: 분산 → 그룹화
- **상태 관리**: 복잡 → 단순
- **가독성**: 낮음 → 높음
- **유지보수성**: 어려움 → 용이

---

## 📝 배우 사항

1. **Object.assign** 활용의 중요성
   - 상태 초기화: `Object.assign(form, data)`
   - 상태 리셋: `Object.assign(form, formOrg)`
   - 상태 동기: `Object.assign(src[i], form)`

2. **Reactive 객체 구조화**
   - 기능별 그룹화 (search, form, modal)
   - 명확한 프로퍼티 이름 (show, dtlId, isNew 등)
   - 관련 데이터 함께 포함 (form 안에 모든 필드)

3. **Watch 의존성**
   - `watch([searchParam], ...)` 전체 감시
   - `watch(() => searchParam.searchValue, ...)` 개별 감시

---

## 📌 참고

- CLAUDE.md 네이밍 규칙 준수: cf*, fn*, on*, handle* 등
- Pinia store vs local component state 구분
- Yup validation 패턴 (formErrors 동적 키)
- 모달 뷰모드 영속화 (window._ec{X}DtlState)

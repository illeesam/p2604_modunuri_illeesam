# Vue 3 ref → reactive 통합 리팩토링 진행상황 (업데이트)
**최종 업데이트**: 2026-04-25 (세션 2)

## 🔄 Phase 2-2 진행 현황

### ✅ 완료 (5개 파일)

#### detailModal 통합 완료
1. **SyAlarmMng.js** - selectedId/openMode → detailModal, applied 제거
2. **SyBbmMng.js** - selectedId/openMode → detailModal, applied 제거  
3. **SyBbsMng.js** - 검색 ref + 선택 ref → searchParam + detailModal 통합
4. **SyContactMng.js** - 검색 ref + 선택 ref → searchParam + detailModal 통합
5. **SySiteMng.js** - 선택 ref → detailModal (검색은 이미 complete)

**변경 패턴**:
```javascript
// Before
const selectedId = ref(null);
const openMode = ref('view');

// After
const detailModal = reactive({
  show: false,
  editId: null,
  viewMode: 'view'
});
```

### ⏳ 진행 중 (3개 파일)

남은 SyMng.js 파일들:
- SyTemplateMng.js - selectedId/openMode + applied 제거 필요
- SyUserMng.js - selectedId/openMode 제거 필요
- SyVendorMng.js - selectedId/openMode + applied 제거 필요

---

## 📋 새로운 작업: 탭/토글 버튼 통합

사용자 요청: **탭 버튼 모음이나 토글 버튼 모음도 ref를 reactive로 해줘**

### 정책 문서 생성
- **파일**: `_doc/정책서-dev/tab-toggle-consolidation.md`
- **내용**: 탭/토글 ref 통합 패턴 정의

### 통합 패턴

#### 1️⃣ 탭 버튼 모음 → uiState/pageUI

**Before (개별 ref)**
```javascript
const activeTab = ref('info');
const bulkTab = ref('status');
const botTab = ref('products');
const previewTab = ref('barcode');
```

**After (consolidated reactive)**
```javascript
const uiState = reactive({
  activeTab: 'info',
  bulkTab: 'status',
  botTab: 'products',
  previewTab: 'barcode',
});

watch(uiState, (newVal) => {
  window._ecOrderDtlState.activeTab = newVal.activeTab;
}, { deep: true });
```

#### 2️⃣ 토글 버튼 모음 → expanded Set 또는 toggleState 객체

**Before (개별 ref)**
```javascript
const isExpanded = ref(false);
const showDetail = ref(false);
const section1Expanded = ref(true);
```

**After (Set 또는 객체)**
```javascript
// 다중 섹션 (트리, 아코디언)
const expanded = reactive(new Set(['section1']));
const toggleExpanded = (id) => {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id);
};

// 또는 단순 토글 객체
const toggleState = reactive({
  showDetail: false,
  showFilter: true,
});
```

### 적용 대상 파일 (초기 발견)

**Dtl 컴포넌트** (activeTab, bulkTab, botTab, previewTab 등):
- OdClaimDtl.js
- OdOrderDtl.js
- PdProdDtl.js
- PmCouponDtl.js
- PmEventDtl.js
- DpDispUiDtl.js

**Hist 컴포넌트** (botTab):
- OdClaimHist.js
- OdOrderHist.js
- PdProdHist.js

**Mng 컴포넌트** (bulkTab):
- OdOrderMng.js
- OdClaimMng.js
- OdDlivMng.js

**트리/펼침** (expanded Set):
- SyAlarmMng.js (이미 expanded Set 사용)
- SyBbmMng.js (이미 expanded Set 사용)

---

## 📊 통계

| 항목 | Before Phase 2-2 | After Phase 2-2 | 목표 |
|------|---------|---------|------|
| Mng.js 총 파일 | 69 | 69 | - |
| Phase 2-1 완료 (searchParam) | 28 | 28 | 28 ✅ |
| Phase 2-2 진행 (detailModal) | 1 | 5 | 8 |
| 남은 Phase 2 | 40 | 36 | 0 |

---

## 🎯 다음 단계

### Immediate (Phase 2-2 완료)
1. 남은 3개 SyMng.js 파일 (Template, User, Vendor) detailModal 적용
2. SySiteMng.js 템플릿 바인딩 업데이트

### Short-term (Phase 2-3/Tab-Toggle)
1. **탭 버튼 통합**: 주요 Dtl/Hist 컴포넌트에 uiState 적용
   - OdOrderDtl.js 샘플 시작 (activeTab → uiState.activeTab)
   - PdProdDtl.js, OdClaimDtl.js 등 다음

2. **토글 버튼 통합**: 기존 expanded Set 확대 적용

### 예상 영향도

| 단계 | 대상 파일 | ref 개수 감소 |
|------|---------|------------|
| Phase 2-2 (선택) | 69 Mng.js | ~70개 ref 제거 |
| Phase 2-3 (탭/토글) | 15-20 Dtl/Hist/Mng | ~40-50개 ref 제거 |
| 총 예상 | ~100여 개 ref → 20여 개로 통합 | ~80-100 ref 제거 |

---

## 💡 핵심 변화 요약

### ref → reactive 통합 영역
1. **검색란**: searchParam + searchParamOrg (✅ 28개 파일 완료)
2. **선택/모달**: detailModal, pickerModal (🔄 5개 파일 진행 중)
3. **탭/토글**: uiState, expanded, toggleState (📋 정책 수립 완료)
4. **폼데이터**: form, formErrors, formOrg (⏳ Phase 3 예정)

### 목표 상태 (완료 시)
- **개별 ref**: 500+ → ~150-200 (70% 감소)
- **consolidated reactive**: 분산 → 명확한 목적별 그룹화
- **코드 가독성**: 향상
- **유지보수성**: 향상

---

## 📌 참고

- Phase 2-1: 검색란 (searchParam) 통합 - **28개 파일 완료**
- Phase 2-2: 선택/모달 (detailModal) 통합 - **진행 중 (5/8)**
- Phase 2-3: 탭/토글 (uiState/expanded) 통합 - **정책 수립 완료**
- Phase 3: 폼데이터 (form/formErrors) 통합 - **예정**

---
정책명: 관리자(Back Office) 기술 정책
정책번호: base-기술-admin
관리자: 개발팀
최종수정: 2026-04-19
---

# 관리자(Back Office) 기술 정책

## 1. 기술 스택

| 기술 | 버전 | 로컬 경로 |
|---|---|---|
| Vue 3 | 3.4.21 | `assets/cdn/pkg/vue/3.4.21/vue.global.prod.js` |
| Yup (shim) | 1.0.0 | `assets/cdn/pkg/yup/1.0.0.shim/yup.js` |
| Quill | 2.0.2 | `assets/cdn/pkg/quill/2.0.2/` |
| axios | 1.7.9 | `assets/cdn/pkg/axios/1.7.9/axios.min.js` |

빌드 시스템 없음 — 모든 JS 파일은 브라우저에서 직접 실행.  
`const { ref, reactive, computed } = Vue;` 방식으로 Composition API 사용.

---

## 2. 진입점: bo.html

```
bo.html
├─ head: Vue, Yup, Quill, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js        (window.adminData - 모든 목업)
├─ utils/boApiAxios.js             (window.boApi — BO axios 래퍼)
├─ utils/boUtil.js                 (window.boUtil)
├─ utils/coUtil.js                 (window.coUtil — cofAnd / cofExportCsv / apiHdr)
├─ services/coApiSvc.js            (window.coApiSvc — BO·FO 공통 API)
├─ services/boApiSvc.js            (window.boApiSvc — BO 전용 API)
├─ components/modals/BaseModals.js
├─ components/comp/BaseComp.js
├─ pages/admin/ec/*.js             (EC 도메인 컴포넌트)
├─ pages/admin/sy/*.js             (SY 도메인 컴포넌트)
└─ pages/admin/AdminApp.js         (마지막. Vue 앱 생성·마운트)
```

---

## 3. 새 관리자 페이지 추가 — 필수 4단계

> **3단계만 해도 에러 없이 보이지만 페이지가 렌더링되지 않음 (404 페이지 표시)**  
> AdminApp.js 의 v-else-if 체인이 누락되기 때문.

### Step 1. bo.html — script 태그 추가

```html
<!-- 관련 파일 다음에 순서 맞춰 추가 -->
<script src="pages/admin/ec/mb/MbMemGradeMng.js"></script>
```

### Step 2. AdminApp.js — PAGE_COMP_MAP 등록

```js
const PAGE_COMP_MAP = {
  // ...
  mbMemGradeMng: 'mb-mem-grade-mng',  // pageId → kebab-case 컴포넌트명
};
```

### Step 3. AdminApp.js — app.component() 등록

```js
app.component('MbMemGradeMng', window.MbMemGradeMng);
```

### Step 4. AdminApp.js — template v-else-if 체인에 추가 (핵심!)

```html
<mb-mem-grade-mng
  v-else-if="page==='mbMemGradeMng'"
  :navigate="navigate"
  :admin-data="adminData"
  :show-toast="showToast"
  :show-confirm="showConfirm"
  :set-api-res="setApiRes"
/>
```

---

## 4. 컴포넌트 파일 구조

### 4.1 파일 위치 규칙

```
pages/admin/ec/mb/   ← 회원(Member) 도메인
pages/admin/ec/pd/   ← 상품(Product) 도메인
pages/admin/ec/od/   ← 주문(Order) 도메인
pages/admin/ec/pm/   ← 프로모션(Promotion) 도메인
pages/admin/ec/dp/   ← 전시(Display) 도메인
pages/admin/ec/st/   ← 정산(Settle) 도메인
pages/admin/ec/cm/   ← 공통/커뮤니티 도메인
pages/admin/sy/      ← 시스템(System) 도메인
```

### 4.2 파일 네이밍

| 유형 | 패턴 | 예시 |
|---|---|---|
| 목록·관리 | `{Domain}{Entity}Mng.js` | `MbMemberMng.js` |
| 상세·편집 | `{Domain}{Entity}Dtl.js` | `MbMemberDtl.js` |
| 이력 | `{Domain}{Entity}Hist.js` | `MbMemberHist.js` |

### 4.3 컴포넌트 태그 네이밍

`app.component('MbMemGradeMng', ...)` → 템플릿에서 `<mb-mem-grade-mng>`  
**도메인 프리픽스 필수** (`mb-*`, `pd-*`, `od-*`, `pm-*`, `dp-*`, `sy-*`, `cm-*`)  
프리픽스 누락 시 렌더 실패.

---

## 5. Props 표준

### Mng 컴포넌트

```js
props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes']
```

`showRefModal` 은 참조 모달 없는 단순 Mng 에서는 생략 가능.

### Dtl 컴포넌트 (별도 페이지)

```js
props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'dtlId', 'tabMode']
```

### Hist 컴포넌트

```js
props: ['navigate', 'adminData', 'showRefModal', 'showToast', '{entityId}']
// 예: props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'orderId']
```

---

## 6. 저장·삭제 표준 패턴 (boApi + coUtil.apiHdr)

⭐ `adminApiCall` 헬퍼는 **폐기됨** (2026-05-25). `boApi` 직접 호출 + `services/boApiSvc.js` 우선 + `coUtil.apiHdr(uiNm, cmdNm)` 필수.

### 6.1 GET 조회 — services 등록 우선

```js
// ✅ services/boApiSvc.js 에 등록된 GET — uiNm/cmdNm 인자 + 헤더 자동
const res = await boApiSvc.syCode.getPage({ codeGrp: 'USE_YN' }, '공통코드관리', '목록조회');
const list = res.data?.data?.pageList || [];
```

### 6.2 POST/PUT/DELETE 변경성 — boApi 직접 + coUtil.apiHdr

```js
const onSave = async () => {
  const ok = await props.showConfirm('저장', '저장하시겠습니까?');
  if (!ok) { return; }
  try {
    const res = isNew.value
      ? await boApi.post('/bo/sy/code', { ...form }, coUtil.apiHdr('공통코드관리', '등록'))
      : await boApi.put(`/bo/sy/code/${form.codeId}`, { ...form }, coUtil.apiHdr('공통코드관리', '저장'));
    props.setApiRes?.({ ok: true, status: res.status, data: res.data });
    props.showToast('저장되었습니다.', 'success');
    props.navigate('syCodeMng', { reload: true });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
    props.setApiRes?.({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
    props.showToast(errMsg, 'error', 0);
  }
};

const onDelete = async (row) => {
  const ok = await props.showConfirm('삭제', `[${row.codeNm}] 항목을 삭제하시겠습니까?`);
  if (!ok) { return; }
  try {
    await boApi.delete(`/bo/sy/code/${row.codeId}`, coUtil.apiHdr('공통코드관리', '삭제'));
    props.showToast('삭제되었습니다.', 'success');
    handleSearchList('RELOAD');
  } catch (err) {
    props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
  }
};
```

### 6.3 금지 패턴

```js
// ❌ 폐기 — adminApiCall 헬퍼
await window.adminApiCall({ method: 'post', path: ..., ... });

// ❌ 폐기 — adminApi/axiosApi
const api = window.axiosApi || window.adminApi;
await api.post('...', body);

// ❌ 폐기 — URL 변수 정의
const API = 'api/base/sy/zz-sample1';
await boApi.get(API);

// ❌ 폐기 — coUtil.apiHdr 없는 변경성 호출
await boApi.post('/bo/sy/code', body);  // 인터셉터 차단 → 에러 토스트
```

상세 → `_doc/정책서/base/base.코드스타일-admin-vue.md` §9.0 (API 클라이언트 선택) + §9.1 (X-UI-Nm/X-Cmd-Nm).

---

## 7. Yup 유효성 검사 패턴

```js
const errors = reactive({});
const schema = yup.object({
  field: yup.string().required('필드는 필수입니다.'),
  amt:   yup.number().min(0, '0 이상이어야 합니다.'),
});

const doSave = async () => {
  // 오류 초기화
  Object.keys(errors).forEach(k => delete errors[k]);
  try {
    await schema.validate(form, { abortEarly: false });
  } catch (err) {
    err.inner.forEach(e => { errors[e.path] = e.message; });
    props.showToast('입력 내용을 확인해주세요.', 'error');
    return;
  }
  // ... boApi.post / boApi.put 호출 (§6 참조)
};
```

폼 필드 오류 표시:
```html
<input class="form-control" :class="{'is-invalid': errors.field}" v-model="form.field">
<div v-if="errors.field" class="field-error">{{ errors.field }}</div>
```

주의: Yup shim 은 `.matches()` 미지원.

---

## 8. adminData (목업 데이터 소스)

`pages/admin/AdminData.js` → `window.adminData`

모든 컴포넌트가 이 객체를 직접 참조·수정.  
API가 연결되면 이 데이터를 실제 API 응답으로 교체.

### 주요 데이터 키

| 키 | 설명 |
|---|---|
| `members` | 회원 목록 |
| `memGrades` | 회원 등급 |
| `memGroups` | 회원 그룹 |
| `products` | 상품 목록 |
| `dlivTmplts` | 배송템플릿 |
| `bundles` | 묶음상품 구성 |
| `setItems` | 세트상품 구성 |
| `reviews` | 상품 리뷰 |
| `prodQnas` | 상품 Q&A |
| `restockNotis` | 재입고 알림 신청 |
| `tags` | 태그 |
| `i18nKeys` | 다국어 키 |
| `i18nMsgs` | 다국어 번역 메시지 |
| `bltnPosts` | 게시판(블로그) 글 |
| `orders` | 주문 |
| `claims` | 클레임 |
| `deliveries` | 배송 |
| `coupons` | 쿠폰 |
| `displays` | 전시 구성 |
| `codes` | 공통코드 |
| `sites` | 사이트 |

---

## 9. 전역 유틸리티

| 객체 | 역할 |
|---|---|
| `window.boApi` | BO axios 래퍼 (get/post/put/patch/delete). 변경성 호출 시 `coUtil.apiHdr` 필수 |
| `window.boApiSvc` | BO 전용 services (`mbMember/pdProd/odOrder/...` 등 도메인별 GET 등록) |
| `window.coApiSvc` | BO·FO 공통 services (`syCode/syPath/sySite/cmBoAppStore` 등) |
| `window.coUtil.cofAnd(...args)` | `&&` 대체 함수 (속성값 내 `&&` 금지 우회) |
| `window.coUtil.cofExportCsv(rows, cols, filename)` | CSV 다운로드 |
| `window.coUtil.cofUseAppCodeReady(uiState, fnLoadCodes)` | 앱 코드 준비 대기 |
| `window.coUtil.apiHdr(uiNm, cmdNm)` | API 요청에 X-UI-Nm/X-Cmd-Nm 헤더 자동 부여 |
| `window.boUtil.bofGetSiteNm(siteId?)` | 사이트명 반환 |
| `window.boUtil.bofGetDateRange(opt)` | 옵션 → `{from, to}` 날짜 계산 |
| `window.boUtil.bofGetPathLabel(pathId)` | 경로(sy_path) 라벨 |
| `window.boUtil.bofBuildRoleTree()` | 역할 트리 빌드 |
| `window.visibilityUtil` | 공개대상 인코딩 (`^PUBLIC^MEMBER^VIP^`) |
| `window.adminCommonFilter` | 사이트/업체/회원/주문 공통 필터 |

---

## 10. CSS 클래스 표준

### 레이아웃

| 클래스 | 용도 |
|---|---|
| `admin-wrap` | AdminApp.js 가 이미 적용 — **컴포넌트 루트에 재사용 금지** |
| `card` | 카드 컨테이너 |
| `search-bar` | 검색 영역 flex row |
| `search-label` | 검색 필드 레이블 |
| `search-actions` | 검색/초기화 버튼 묶음 |
| `toolbar` | 목록 상단 툴바 |
| `list-title` | 목록 제목 |
| `list-count` | 목록 건수 |
| `admin-table` | 목록 테이블 |
| `pagination`, `pager` | 페이지네이션 |

### 폼

| 클래스 | 용도 |
|---|---|
| `form-group` | 필드 묶음 |
| `form-label` | 필드 라벨 |
| `form-control` | input/select/textarea |
| `is-invalid` | 유효성 오류 상태 |
| `field-error` | 오류 메시지 텍스트 |
| `form-actions` | 저장/취소 버튼 영역 |

### 버튼

| 클래스 | 색상 |
|---|---|
| `btn btn-primary` | 핑크 (주요 액션) |
| `btn btn-blue` | 파란 (저장) |
| `btn btn-secondary` | 회색 (닫기/취소) |
| `btn btn-danger` | 빨간 (삭제) |
| `btn btn-green` | 초록 (공개/엑셀) |
| `btn-sm` | 소형 버튼 |
| `btn-xs` | 최소형 버튼 (행 내 버튼) |

### 배지

`badge badge-green / badge-gray / badge-blue / badge-orange / badge-red / badge-purple`

---

## 11. Dtl 탭 뷰모드 영속화

```js
// 파일 상단 전역 상태 선언
window._ecOrderDtlState = window._ecOrderDtlState || { tab: 'info', tabMode: 'tab' };

// setup() 내 참조
const dtlState = window._ecOrderDtlState;
const tab      = Vue.ref(dtlState.tab);
const tabMode = Vue.ref(dtlState.tabMode);

// 변경 시 영속화
const setTab      = (t) => { tab.value = t;      dtlState.tab = t; };
const setViewMode = (m) => { tabMode.value = m;  dtlState.tabMode = m; };
```

뷰모드별 grid 클래스: `dtl-tab-grid cols-1 / cols-2 / cols-3 / cols-4`

---

## 12. ID 생성 규칙

실제 API 연동 전 목업 ID:  
`'PREFIX' + String(Date.now()).slice(-6)`  
예: `'MB' + String(Date.now()).slice(-6)` → `'MB241936'`

실 운영: `YYMMDDhhmmss + rand(4자리)` 형식 서버 생성

---

## 13. 함수·변수 네이밍 규칙

| 접두어 | 적용 대상 | 예시 |
|---|---|---|
| `on` | 이벤트 바인딩 함수 (`@click` 직결) | `onSearch`, `onReset`, `onSave`, `onDelete` |
| `handle` | 이벤트 처리 로직 함수 | `handleSave`, `handleDelete`, `handleStatusChange` |
| `fn` | 독립 유틸 함수 (순수 함수) | `fnStatusBadge`, `fnFormatDate`, `fnPayBadge` |
| `cf` | `computed(() => ...)` 속성 | `cfFiltered`, `cfTotal`, `cfPageList`, `cfSiteNm`, `cfIsNew` |
| `sf` | Pinia store actions | `sfSetAuth`, `sfLogin`, `sfFetchInit` |
| `sv` | Pinia store state/getters | `svAuthUser`, `svCodes`, `svIsLoggedIn` |

상세 규칙: `_doc/정책서-sy/sy.54.네이밍규칙.md`

---

## 관련 정책
- `base.UX-admin.md` — 관리자 UX 레이아웃·패턴
- `sy.51.프로그램설계정책.md` — 초기값·데이터 정렬·상세화면 ID 표시
- `sy.52.ddl단어사전규칙.md` — DDL 컬럼명 표준
- `sy.54.네이밍규칙.md` — 함수·변수 접두어 네이밍 규칙

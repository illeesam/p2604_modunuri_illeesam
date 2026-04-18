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
| Tailwind CSS | 3.4.x | `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` (빌드 결과물) |

빌드 시스템 없음 — 모든 JS 파일은 브라우저에서 직접 실행.  
`const { ref, reactive, computed } = Vue;` 방식으로 Composition API 사용.

---

## 2. 진입점: admin.html

```
admin.html
├─ head: Vue, Yup, Quill, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js        (window.adminData - 모든 목업)
├─ utils/adminAxios.js             (window.adminApi)
├─ utils/adminUtil.js              (window.adminUtil / window.adminApiCall)
├─ components/modals/BaseModal.js
├─ components/comp/BaseComp.js
├─ pages/admin/ec/*.js             (EC 도메인 컴포넌트)
├─ pages/admin/sy/*.js             (SY 도메인 컴포넌트)
└─ pages/admin/AdminApp.js         (마지막. Vue 앱 생성·마운트)
```

---

## 3. 새 관리자 페이지 추가 — 필수 4단계

> **3단계만 해도 에러 없이 보이지만 페이지가 렌더링되지 않음 (404 페이지 표시)**  
> AdminApp.js 의 v-else-if 체인이 누락되기 때문.

### Step 1. admin.html — script 태그 추가

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
props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode']
```

### Hist 컴포넌트

```js
props: ['navigate', 'adminData', 'showRefModal', 'showToast', '{entityId}']
// 예: props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'orderId']
```

---

## 6. 저장·삭제 표준 패턴 (adminApiCall)

```js
await window.adminApiCall({
  method: 'post' | 'put' | 'delete',
  path: `resource/${form.id}`,     // delete 시 data 생략
  data: { ...form },
  confirmTitle: '저장',
  confirmMsg: '저장하시겠습니까?',
  showConfirm: props.showConfirm,
  showToast: props.showToast,
  setApiRes: props.setApiRes,
  successMsg: '저장되었습니다.',   // 생략 시 기본 메시지
  onLocal: () => {
    // 낙관적 업데이트 (API 성공 후 adminData 동기화)
    const src = props.adminData.items;
    if (isNew.value) {
      form.id = 'PREFIX' + String(Date.now()).slice(-6);
      form.regDate = new Date().toLocaleString('sv').replace('T', ' ');
      src.unshift({ ...form });
      selectedId.value = form.id;
      isNew.value = false;
    } else {
      const si = src.findIndex(r => r.id === form.id);
      if (si !== -1) Object.assign(src[si], form);
    }
  },
  navigate: props.navigate,         // 저장 후 이동 시
  navigateTo: 'pageId',             // 저장 후 이동 시 (삭제에는 사용 금지)
});
```

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
  // ... adminApiCall
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
| `window.adminApiCall` | 확인→낙관적업데이트→API→토스트 표준 플로우 |
| `window.adminUtil.DATE_RANGE_OPTIONS` | 기간 선택 옵션 (1주/1달/3달/6달/1년) |
| `window.adminUtil.getDateRange(opt)` | 옵션 → `{from, to}` 날짜 계산 |
| `window.adminUtil.isInRange(date, from, to)` | 날짜 범위 체크 |
| `window.adminUtil.exportCsv(rows, cols, filename)` | CSV 다운로드 |
| `window.adminUtil.getSiteNm(siteId?)` | 사이트명 반환 |
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
window._ecOrderDtlState = window._ecOrderDtlState || { tab: 'info', viewMode: 'tab' };

// setup() 내 참조
const dtlState = window._ecOrderDtlState;
const tab      = Vue.ref(dtlState.tab);
const viewMode = Vue.ref(dtlState.viewMode);

// 변경 시 영속화
const setTab      = (t) => { tab.value = t;      dtlState.tab = t; };
const setViewMode = (m) => { viewMode.value = m;  dtlState.viewMode = m; };
```

뷰모드별 grid 클래스: `dtl-tab-grid cols-1 / cols-2 / cols-3 / cols-4`

---

## 12. ID 생성 규칙

실제 API 연동 전 목업 ID:  
`'PREFIX' + String(Date.now()).slice(-6)`  
예: `'MB' + String(Date.now()).slice(-6)` → `'MB241936'`

실 운영: `YYMMDDhhmmss + rand(4자리)` 형식 서버 생성

---

## 관련 정책
- `base.UX-admin.md` — 관리자 UX 레이아웃·패턴
- `sy.51.프로그램설계정책.md` — 초기값·데이터 정렬·상세화면 ID 표시
- `sy.52.ddl단어사전규칙.md` — DDL 컬럼명 표준

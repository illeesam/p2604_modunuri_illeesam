---
정책명: 사용자(Front Office) 기술 정책
정책번호: base-기술-front
관리자: 개발팀
최종수정: 2026-04-26
---

# 사용자(Front Office) 기술 정책

## 1. 기술 스택

| 기술 | 버전 | 로컬 경로 |
|---|---|---|
| Vue 3 | 3.4.21 | `assets/cdn/pkg/vue/3.4.21/vue.global.prod.js` |
| vue-demi | 0.14.10 | `assets/cdn/pkg/vue-demi/0.14.10/vue-demi.iife.js` |
| Pinia | 2.1.7 | `assets/cdn/pkg/pinia/2.1.7/pinia.iife.js` |
| axios | 1.7.9 | `assets/cdn/pkg/axios/1.7.9/axios.min.js` |
| Yup (shim) | 1.0.0 | `assets/cdn/pkg/yup/1.0.0.shim/yup.js` |
| Quill | 2.0.2 | `assets/cdn/pkg/quill/2.0.2/` |
| Kakao 우편번호 | v2 | `assets/cdn/pkg/postcode/2/postcode.v2.js` |
| marked | 11.1.1 | `assets/cdn/pkg/marked/11.1.1/marked.min.js` |

---

## 2. 진입점: index.html

```
index.html
├─ head: FRONT_SITE_NO 결정 → CSS/JS 동적 로드
├─ base/config.js                (window.SITE_CONFIG, window.FRONT_SITE_NO)
├─ base/stores/frontAuthStore.js + frontMyStore.js    (Pinia)
├─ layout/frontAppHeader.js + frontAppSidebar.js + frontAppFooter.js + frontMyLayout.js
├─ pages/Home{NO}.js  Prod{NO}List.js  Prod{NO}View.js   (FRONT_SITE_NO별 동적 로드)
├─ pages/{Cart,Order,Contact,Faq,Login,Event,Blog,Like,Location,About,...}.js
├─ pages/my/My*.js
├─ components/modals/BaseModal.js + components/comp/BaseComp.js
└─ base/frontApp.js              (마지막. Vue 앱 생성·마운트)
```

---

## 3. FRONT_SITE_NO 시스템

하나의 값으로 6곳 자동 동기화:

| 대상 | 동작 |
|---|---|
| CSS | `frontGlobalStyle{NO}.css` 자동 로드 |
| 스크립트 | `Home{NO}.js`, `Prod{NO}List.js`, `Prod{NO}View.js` document.write 동적 삽입 |
| 컴포넌트 등록 | `app.component('Home'+NO, window['Home'+NO])` |
| 런타임 렌더 | `<component :is="frontHomeComp">` (window['Home'+NO] 참조) |
| URL 오버라이드 | `?FRONT_SITE_NO=02` → localStorage 저장 후 쿼리 자동 제거 |
| 헤더 배지 | AppHeader 로고 옆 `01/02/03` 배지 (hover 툴팁) |

### 사이트별 CSS 변수 (테마)

```css
/* frontGlobalStyle01.css — 베이지/카키 */
--accent: #c9a96e;

/* frontGlobalStyle02.css — 민트/세이지 */
--accent: #4a9b7e;

/* frontGlobalStyle03.css — 로얄 퍼플 */
--accent: #7c3aed;
```

공통 변수: `--text-primary`, `--bg-base`, `--bg-card`, `--border`, `--shadow`

---

## 4. 해시 기반 라우팅

```js
// base/frontApp.js
const navigate = (pageId, params = {}) => {
  const query = new URLSearchParams({ page: pageId, ...params });
  location.hash = query.toString();
};

// 해시 변경 감지
window.addEventListener('hashchange', () => {
  const params = new URLSearchParams(location.hash.slice(1));
  page.value = params.get('page') || 'home';
  pid.value  = params.get('pid')  || null;
});
```

URL 단축: `/index.html` → `/` (history.replaceState, 해시/쿼리 유지)

---

## 5. Pinia 스토어

### frontAuthStore

```js
// base/stores/frontAuthStore.js
const frontAuthStore = Pinia.defineStore('frontAuth', {
  state: () => ({ isLoggedIn: false, user: null, token: null }),
  actions: {
    async login(email, password) { /* API 호출 */ },
    logout() { /* 토큰 제거 */ },
    async restore() { /* localStorage 토큰 복원 */ },
  },
});
```

### frontMyStore

```js
// base/stores/frontMyStore.js
const frontMyStore = Pinia.defineStore('frontMy', {
  state: () => ({ orders: [], claims: [], coupons: [], cache: 0 }),
  actions: {
    async fetchOrders() { /* axiosApi 호출 */ },
  },
});
```

---

## 6. API 호출 (frontApi / axiosApi)

```js
// utils/frontAxios.js — window.frontApi / window.axiosApi
const axiosApi = axios.create({ baseURL: '' });  // api/ 상대경로 자동 변환

// 사용 예
const res = await window.axiosApi.get('api/my/orders.json');
const data = res.data;
```

목업 응답 위치: `api/my/*.json`, `api/base/*.json`, `api/xs/*.json`

---

## 7. 컴포넌트 설계 패턴

### 7.1 페이지 컴포넌트 구조

```js
window.ProdList = {
  name: 'ProdList',
  props: ['navigate', 'siteConfig', 'showToast'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    // ...
    return { /* 템플릿 바인딩 */ };
  },
  template: `<div>...</div>`,
};
```

### 7.2 FRONT_SITE_NO 별 분기 컴포넌트

```js
// Home01.js — 사이트 01 전용 홈
window.Home01 = { name: 'Home01', ... };

// Home02.js — 사이트 02 전용 홈 (민트 테마 특화)
window.Home02 = { name: 'Home02', ... };
```

공통 로직은 별도 유틸로 분리하고 각 사이트별 파일에서 import-like 참조.

---

## 8. 인증 (frontAuth)

```js
// base/frontAuth.js — window.frontAuth
window.frontAuth = {
  state: Vue.reactive({ isLoggedIn: false, user: null }),
  async init() { /* localStorage 토큰 확인 → 자동 로그인 */ },
  async logout() { /* 토큰 제거 + state 초기화 */ },
};
```

로그인 필요 페이지 접근 시 처리:

```js
// base/frontApp.js 라우터
if (AUTH_REQUIRED_PAGES.includes(page.value) && !window.frontAuth.state.isLoggedIn) {
  navigate('error401');
  return;
}
```

---

## 9. 목업 API 구조 (api/)

```
api/
├─ base/
│   ├─ site-config.json     ← window.SITE_CONFIG 초기 데이터
│   └─ users.json           ← 로그인 계정 목업
├─ my/
│   ├─ orders.json
│   ├─ claims.json
│   ├─ chats.json
│   ├─ cash.json
│   ├─ coupons.json
│   ├─ inquiries.json
│   └─ after-sales.json
├─ products/                ← 상품 이미지 등 정적 자원
├─ admin/                   ← 관리자 API 응답
└─ xs/                      ← 전시 샘플 페이지용 JSON
```

---

## 10. window.SITE_CONFIG

`base/config.js` 에서 정의. frontApi 로 `api/base/site-config.json` 을 불러와 병합.

주요 항목:

```js
window.SITE_CONFIG = {
  siteId: 1,
  siteName: 'ShopJoy',
  categories: [...],      // 카테고리 트리
  menus: [...],           // GNB 메뉴
  banners: [...],         // 메인 배너
  faqs: [...],            // FAQ 목록
  events: [...],          // 이벤트 목록
  notices: [...],         // 공지 목록
};
```

---

## 11. Quill 에디터 (블로그 작성)

```js
// blogEdit.js 내
let quill = null;
Vue.onMounted(() => {
  quill = new Quill('#editor', {
    theme: 'snow',
    modules: { toolbar: [['bold','italic'], ['link','image'], [{ list: 'ordered' }]] },
  });
});

// 저장 시
const content = quill.root.innerHTML;
```

---

## 12. Kakao 우편번호

```js
new daum.Postcode({
  oncomplete(data) {
    form.zipCode = data.zonecode;
    form.address = data.roadAddress || data.jibunAddress;
    addressModal.value = false;
  },
}).open();
```

CDN 원본 유지 권장: `assets/cdn/pkg/postcode/2/postcode.v2.js` 또는 외부 CDN

---

## 13. marked (Markdown 렌더링)

DispX04Widget의 markdown 위젯 전용.

```js
import { marked } from 'marked'; // CDN 글로벌
const html = marked.parse(markdownText);
```

---

## 14. 전시 UI 미리보기 (disp-fo-ui.html)

관리자가 제작한 전시 구성을 실사용자 관점으로 독립 화면에서 검증.

```
disp-fo-ui.html
├─ Vue, axios, yup, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js + utils/adminUtil.js
├─ components/comp/BaseComp.js
├─ components/disp/DispX01Ui.js ~ DispX04Widget.js
├─ pages/xd/DispUi01.js ~ DispUi06.js + DispUiPage.js
└─ 인라인 스크립트 → Vue 앱 생성
```

위젯 타입: `image_banner`, `product_slider`, `product`, `cond_product`,  
`chart_bar/line/pie`, `text_banner`, `info_card`, `popup`, `file`, `file_list`,  
`coupon`, `html_editor`, `event_banner`, `cache_banner`, `widget_embed`,  
`barcode`, `countdown`, `markdown`

---

## 함수·변수 네이밍 규칙

| 접두어 | 적용 대상 | 예시 |
|---|---|---|
| `on` | 이벤트 바인딩 함수 (`@click` 직결) | `onSearch`, `onReset`, `onSave`, `onDelete` |
| `handle` | 이벤트 처리 로직 함수 | `handleSave`, `handleDelete`, `handleSubmit` |
| `fn` | 독립 유틸 함수 (순수 함수) | `fnStatusBadge`, `fnFormatDate`, `fnCalcTotal` |
| `cf` | `computed(() => ...)` 속성 | `cfFiltered`, `cfTotal`, `cfPageList`, `cfIsLoggedIn` |
| `sf` | Pinia store actions | `sfSetAuth`, `sfLogin`, `sfFetchInit` |
| `sv` | Pinia store state/getters | `svAuthUser`, `svCodes`, `svIsLoggedIn` |

상세 규칙: `_doc/정책서-sy/sy.54.네이밍규칙.md`

---

## 15. FO 페이지 데이터 로딩 패턴

모든 FO 페이지 컴포넌트는 동일한 3단계 체인으로 데이터를 로딩한다.

### 15.1 표준 체인 구조

```js
// ① isAppReady: 스토어 초기화 완료 여부
const isAppReady = computed(() => {
  const initStore = window.useFoAppInitStore?.();
  const codeStore = window.useFoCodeStore?.();
  return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
});

// ② fnLoadCodes: 코드/마스터 로드 진입점 (재진입 방지 플래그 포함)
const fnLoadCodes = async () => {
  try {
    uiState.isPageCodeLoad = true;   // 재진입 방지 → isAppReady false 처리
    handleSearchList();               // 실제 데이터 조회 호출
  } catch (err) {
    console.error('[fnLoadCodes]', err);
  }
};

// ③ handleSearchList: foApi 호출 → 실패 시 목업 fallback
const handleSearchList = async () => {
  try {
    const res = await window.foApi.get('/fo/xxx/list', { params: { ... } });
    items.splice(0, items.length, ...res.data);
  } catch (e) {
    items.splice(0, items.length, ...[ /* 목업 데이터 */ ]);
  }
};

// ④ watch: 스토어가 나중에 준비될 때 트리거
watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

// ⑤ onMounted: 스토어가 이미 준비된 경우 즉시 실행
onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
```

### 15.2 핵심 규칙

| 규칙 | 내용 |
|---|---|
| `isPageCodeLoad` 플래그 | `fnLoadCodes` 진입 시 `true` 설정 → `isAppReady` computed가 `false`로 전환되어 중복 실행 방지 |
| `onMounted` 가드 필수 | `if (isAppReady.value) fnLoadCodes()` — 스토어가 이미 ready인 경우 처리 |
| `watch` 병행 필수 | 스토어 초기화가 mount보다 늦게 완료되는 경우 처리 |
| foApi fallback | `try` → `window.foApi.get(...)` 성공 시 서버 데이터 사용, `catch` → 목업 데이터 주입 |
| 데이터 주입 방식 | `reactive([])` + `splice(0, length, ...data)` — 반드시 splice로 교체 (직접 대입 금지) |

### 15.3 금지 패턴

```js
// ❌ fnLoadCodes에서 handleSearchList 미호출
const fnLoadCodes = async () => {
  uiState.isPageCodeLoad = true;
  // handleSearchList 호출 없음 → 데이터 로딩 안 됨
};

// ❌ onMounted에서 handleSearchList 직접 호출 (isAppReady 무시)
onMounted(() => { handleSearchList(); });

// ❌ 목업 데이터를 reactive 배열 초기값으로 직접 주입
const items = reactive([ ...8개 하드코딩 목업... ]); // handleSearchList를 통해야 함
```

### 15.4 foApi 엔드포인트 연결 현황

| 파일 | 엔드포인트 |
|---|---|
| `Blog.js` | `GET /fo/blog/list` |
| `BlogView.js` | `GET /fo/blog/view?blogId=` |
| `BlogEdit.js` | `GET /fo/blog/view?blogId=` (수정 모드) |
| `Event.js` | `GET /fo/event/list` |
| `EventView.js` | `GET /fo/event/view?eventId=` |
| `Contact.js` | `POST /fo/contact` |
| `Prod01/02/03List.js` | `GET /fo/product/list` |
| `Order.js` | `POST /fo/order` |
| `xs/XsStore.js` | `GET /fo/store/list` |

---

## 16. foApp.js 상품 데이터 로딩 정책

`base/foApp.js`는 FO 전체 앱의 루트 컴포넌트로, 상품 데이터를 하위 페이지에 props로 전달한다.

### 16.1 상품 로딩 구조

```js
// products: reactive 빈 배열로 선언 (초기값 없음)
const products = reactive([]);
const selectedProduct = ref(null);

// handleFetchProducts: foApi 호출 → 실패 시 SITE_CONFIG fallback
const handleFetchProducts = async () => {
  try {
    const res = await window.foApi.get('/fo/product/list');
    const list = Array.isArray(res.data)
      ? res.data
      : (res.data?.list || res.data?.products || []);
    list.forEach(_assignImg);
    products.splice(0, products.length, ...list);
  } catch (e) {
    const fallback = window.SITE_CONFIG?.products || [];
    fallback.forEach(_assignImg);
    products.splice(0, products.length, ...fallback);
  }
  _restoreAfterProducts(); // 장바구니·URL pid 복원
};

onMounted(() => { handleFetchProducts(); });
```

### 16.2 products 로드 후 복원 처리

상품 데이터는 비동기 로드이므로, 장바구니 복원과 URL `pid` 파라미터 복원은 반드시 로드 완료 후 실행한다.

```js
const _restoreAfterProducts = () => {
  // localStorage 장바구니 → products에서 상품 객체 매핑 후 cart에 추가
  // URL hash pid → products.find()로 selectedProduct 설정
  // selectedProduct가 없으면 products[0] 기본 설정
};
```

### 16.3 _assignImg 이미지 자동 할당

```js
const _assignImg = (p) => {
  // colors → opt1s, sizes → opt2s 호환 변환
  // p.image 없으면 productId 기준 로컬 이미지 경로 자동 할당
  // p.priceNum 없으면 p.price 문자열에서 숫자 추출
};
```

상품 데이터 로드 시 반드시 `forEach(_assignImg)` 적용 후 `products.splice`로 주입한다.

### 16.4 핵심 규칙

| 규칙 | 내용 |
|---|---|
| `products` 초기값 | `reactive([])` — 빈 배열, 절대 SITE_CONFIG 직접 대입 금지 |
| foApi 우선 | 서버 API 성공 시 서버 데이터 사용, 실패 시만 SITE_CONFIG fallback |
| 복원 순서 | products 로드 완료 → `_restoreAfterProducts()` → 장바구니/selectedProduct 복원 |
| onMounted 위치 | `handleFetchProducts` 정의 직후에 `onMounted` 배치 (선언 순서 준수) |

---

## 관련 정책
- `base.UX-front.md` — 사용자 UX 레이아웃·흐름
- `ec.mb.*` — 회원·인증 정책
- `ec.od.*` — 주문·결제 정책
- `sy.54.네이밍규칙.md` — 함수·변수 접두어 네이밍 규칙
- `ec.dp.*` — 전시 위젯·패널 정책

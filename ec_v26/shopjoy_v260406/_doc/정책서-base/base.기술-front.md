---
정책명: 사용자(Front Office) 기술 정책
정책번호: base-기술-front
관리자: 개발팀
최종수정: 2026-04-19
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
| Tailwind CSS | 3.4.x | `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` |

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

## 14. 전시 UI 미리보기 (disp-front-ui.html)

관리자가 제작한 전시 구성을 실사용자 관점으로 독립 화면에서 검증.

```
disp-front-ui.html
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

## 관련 정책
- `base.UX-front.md` — 사용자 UX 레이아웃·흐름
- `ec.mb.*` — 회원·인증 정책
- `ec.od.*` — 주문·결제 정책
- `ec.dp.*` — 전시 위젯·패널 정책

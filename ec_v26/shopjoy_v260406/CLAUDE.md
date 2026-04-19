# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 실행 방법

**Vue 3 CDN 유지 + Tailwind CLI 로컬 빌드** 하이브리드 구조.
VS Code **Live Server**로 실행 (기본 포트 `127.0.0.1:5501`).

- **Vue/Pinia/axios/Yup/Quill** 등 런타임 라이브러리: 로컬 복사본(`assets/cdn/pkg/<pkg>/<ver>/`)에서 로드 — CDN 미사용
- **Tailwind CSS**: 로컬 Node CLI로 빌드 → `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` 생성
- **그 외 앱 코드**: 빌드 없이 원본 JS 그대로 브라우저 실행 (`<script src="pages/*.js">`)

### 최초 1회 세팅

```bash
# 1) Node.js LTS 설치 (https://nodejs.org/)
# 2) 프로젝트 루트에서:
npm install

# 3) CDN 파일 다운로드 (assets/cdn/pkg/README.md 참조)
#    - Vue, Pinia, Quill, 우편번호 등 로컬 복사본 준비
```

### 일상 개발

```bash
# 개발 중: Tailwind watch (파일 변경 시 CSS 자동 재빌드)
npm run dev

# 동시에: VS Code Live Server로 index.html 열기
#   → http://127.0.0.1:5501/
```

### 배포 전 1회

```bash
# Tailwind CSS 최종 빌드 (압축)
npm run build
# 결과물: assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css
```

### npx로 직접 실행 (package.json 스크립트 없이)

```bash
# watch 모드
npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --watch

# 1회 빌드
npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --minify
```

세 개의 독립 진입점:

| 진입점 | 용도 | 주 CSS | 주 데이터 소스 |
|---|---|---|---|
| `index.html` | **사용자 페이스** (front office) | `assets/css/frontGlobalStyle0N.css` | `base/config.js` + `api/*` JSON |
| `admin.html` | **관리자 페이스** (back office) | `assets/css/adminGlobalStyle0N.css` | `pages/admin/AdminData.js` (목업) |
| `disp-front-ui.html` / `disp-admin-ui.html` | **전시 UI 미리보기** (독립 렌더) | `assets/css/adminGlobalStyle0N.css` | `adminData` + `api/xs/*` |

테스트 프레임워크 없음. 브라우저 콘솔에서 직접 검증.

## 기술 스택 (로컬 로드 중심)

| 기술 | 버전 | 로컬 경로 | 용도 |
|---|---|---|---|
| **Vue 3** | 3.4.21 | `assets/cdn/pkg/vue/3.4.21/vue.global.prod.js` | 런타임 템플릿 컴파일. `const { ref, reactive, computed } = Vue` |
| **vue-demi** | 0.14.10 | `assets/cdn/pkg/vue-demi/0.14.10/vue-demi.iife.js` | Vue3/Composition API 호환 레이어 |
| **Pinia** | 2.1.7 | `assets/cdn/pkg/pinia/2.1.7/pinia.iife.js` | `index.html` 전용 스토어 (`base/stores/*`). admin/disp-ui는 미사용 |
| **axios** | 1.7.9 (공식) | `assets/cdn/pkg/axios/1.7.9/axios.min.js` | 공식 UMD. `window.axiosApi` 래퍼(`api/` 상대경로 자동 변환) |
| **Yup** | 1.0.0 (local shim) | `assets/cdn/pkg/yup/1.0.0.shim/yup.js` | Yup v1.x 공식 UMD 미제공 → 로컬 shim 유지. `.matches()` 미지원 |
| **Quill** | 2.0.2 | `assets/cdn/pkg/quill/2.0.2/quill.{js,snow.css}` | 관리자·일부 사용자 리치텍스트 에디터 |
| **Kakao 우편번호** | v2 | `assets/cdn/pkg/postcode/2/postcode.v2.js` 또는 원본 CDN | 주소 검색 (원본 CDN 유지 권장) |
| **Tailwind CSS** | 3.4.x | `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` (빌드 결과물) | 유틸리티 클래스. `npm run build`로 생성 |
| **marked** | 11.1.1 | `assets/cdn/pkg/marked/11.1.1/marked.min.js` | Markdown → HTML 파싱. DispX04Widget markdown 위젯에서 사용 |
| **Noto Sans KR 폰트** | - | Google Fonts CDN | 자동 서브셋 제공 이점으로 CDN 유지 |

> CDN 의존을 제거한 이유: 외부 장애/버전 드리프트/방화벽 차단 대응. 상세 내역 → `assets/cdn/pkg/README.md`.

**모든 컴포넌트는 `window.*`에 객체로 등록 → Vue `app.component('Name', window.Name)` 방식으로 소비.**

## 진입점별 구조

### 1) `index.html` — 사용자 페이스

구조:
```
index.html
├─ head: FRONT_SITE_NO 결정 + 해당 CSS/JS 동적 로드
├─ base/config.js        (window.SITE_CONFIG, window.FRONT_SITE_NO)
├─ base/stores/frontAuthStore.js + frontMyStore.js    (Pinia)
├─ layout/frontAppHeader.js + frontAppSidebar.js + frontAppFooter.js + frontMyLayout.js
├─ pages/Home{NO}.js   pages/Prod{NO}List.js   pages/Prod{NO}View.js
├─ pages/{Cart,Order,Contact,Faq,Login,Event,Blog,Like,Location,About,...}.js
├─ pages/my/My*.js       (Pinia 의존)
├─ components/modals/BaseModal.js + components/comp/BaseComp.js
└─ base/frontApp.js      (마지막. Vue 앱 생성/마운트) + base/frontAuth.js + base/frontConfig.js
```

**라우팅**: 해시 기반 (`#page=xxx&pid=N`). `base/app.js`의 `navigate(pageId)`.

**유효 페이지 ID** (`validPages` in `base/app.js`): `home, prodList, prodView, cart, order, contact, faq, event, eventView, blog, blogView, blogEdit, like, location, about, myOrder, myClaim, myCoupon, myCache, myContact, myChatt, dispUi01~06, sample01~23, error401/404/500`.

**URL → 컴포넌트 매핑** (FRONT_SITE_NO 기준 동적):
- `#page=home` → `<component :is="frontHomeComp">` = `window['Home' + FRONT_SITE_NO]`
- `#page=prodList` → `window['Prod' + FRONT_SITE_NO + 'List']`
- `#page=prodView` → `window['Prod' + FRONT_SITE_NO + 'View']`

### 2) `admin.html` — 관리자 페이스

구조:
```
admin.html
├─ head: Vue, Yup, Quill, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js   (window.adminData - 모든 목업)
├─ utils/adminAxios.js (window.adminApi) + utils/adminUtil.js (window.adminUtil)
├─ components/modals/BaseModal.js + comp/BaseComp.js
├─ pages/admin/ec/*.js        (EC 도메인: Member/Prod/Order/Claim/Dliv/Coupon/Cache/Category/Event/Notice/Chatt/CustInfo/Disp*)
├─ pages/admin/sy/*.js        (시스템: User/Dept/Menu/Role/Site/Code/Brand/Template/Vendor/Attach/Batch/Alarm/Bbm/Bbs/Contact)
└─ pages/admin/AdminApp.js    (마지막. 멀티탭 시스템 마운트)
```

**라우팅**: AdminApp.js의 탭 시스템. `openTabs` reactive 배열. `navigate(pageId, { editId })` 패턴.

**좌측 메뉴 그룹** (AdminApp.js `MENU_BY_ROOT`):
- 회원관리, 상품관리, 주문관리, 프로모션, 전시관리, 고객센터, **시스템** (기준정보/공통업무/시스템/조직/메뉴/이력조회)

**Dtl 탭 뷰모드** (Order/Claim/Dliv/Prod/Event/Cache/Coupon/Chatt + 상응하는 Hist): 📑 탭 / 1열 / 2열 / 3열 / 4열. 각 상태는 `window._ec{X}DtlState`에 영속화. 3/4열 모드는 `.admin-wrap { max-width:none }` 자동 적용.

**새 컴포넌트 추가 시 필수 4단계**:
1. `admin.html`에 `<script>` 태그 추가
2. `AdminApp.js`의 `PAGE_COMP_MAP`에 `pageId → kebab-case` 추가
3. `app.component('ClassName', window.ClassName)` 등록
4. AdminApp.js 템플릿 `v-else-if` 체인에 렌더 항목 추가 (`PAGE_COMP_MAP`만으로는 렌더 안 됨)

**관리자 페이지 템플릿 루트 구조 표준**:
- AdminApp.js가 이미 `<div class="admin-wrap">` 로 콘텐츠를 감싸므로, 각 Mng 컴포넌트의 **template 루트는 반드시 `<div>` (class 없음)**으로 작성
- `<div class="admin-wrap">` 를 컴포넌트 루트로 사용하면 이중 래핑되어 **화면 폭이 좁아지고 padding이 중첩**됨
- `<div class="page-title">화면명</div>` 은 루트 `<div>` 바로 아래 첫 자식으로 배치

```js
// ✅ 올바른 패턴
template: `
<div>
  <div class="page-title">회원등급관리</div>
  <div class="card">...</div>
</div>`

// ❌ 잘못된 패턴 (이중 admin-wrap → 폭 좁아짐)
template: `
  <div class="admin-wrap">
    <div class="page-title">회원등급관리</div>
    ...
  </div>`
```

### 3) `disp-front-ui.html` / `disp-admin-ui.html` — 전시 UI 미리보기

구조:
```
disp-admin-ui.html (관리자 컨텍스트)  |  disp-front-ui.html (사용자 컨텍스트)
├─ head: Vue, axios, yup, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js + utils/adminUtil.js
├─ components/comp/BaseComp.js + pages/base/(admin|front)Error404.js
├─ components/disp/DispX01Ui.js ~ DispX04Widget.js  (계층별 렌더러)
├─ pages/xd/DispUi01.js ~ DispUi06.js + DispUiPage.js
└─ 자체 인라인 스크립트로 Vue 앱 생성
```

**용도**: 관리자에서 제작한 전시 UI를 실사용자처럼 독립 화면에서 검증.

## 글로벌 네임스페이스 (`window.*`)

| 객체 | 정의 파일 | 역할 |
|---|---|---|
| `window.SITE_CONFIG` | `base/config.js` | 상품·메뉴·FAQ 등 사용자 페이스 전체 설정 |
| `window.FRONT_SITE_NO` | `index.html` head 인라인 스크립트 | `'01' \| '02' \| ...` 사이트 번호. `?FRONT_SITE_NO=02` 쿼리로 오버라이드 후 localStorage 저장 |
| `window.adminData` | `pages/admin/AdminData.js` | 관리자 전 도메인 목업 데이터 (sites, members, products, orders, claims, deliveries, displays, codes, roles, depts, menus 등) |
| `window.adminCommonFilter` | `utils/adminUtil.js` | 관리자 공통 필터 reactive (사이트/업체/회원/주문) |
| `window.frontApi` / `window.adminApi` | `utils/frontAxios.js` · `utils/adminAxios.js` | axios 래퍼. `api/` 기준 경로 자동 변환 |
| `window.adminApi` | `utils/adminAxios.js` | axios 래퍼. get/post/put/patch/delete/raw |
| `window.adminUtil` | `utils/adminUtil.js` | `DATE_RANGE_OPTIONS`, `getDateRange`, `isInRange`, `exportCsv`, `getSiteNm` |
| `window.yup` | `assets/cdn/yup.js` | Yup shim |
| `window.frontAuth` | `base/frontAuth.js` | 인증 init/logout/state |
| `window.visibilityUtil` | `utils/adminUtil.js` | 공개/회원등급/권한 등 노출 대상 인코딩 (`^PUBLIC^MEMBER^VIP^`) |
| `window._ec{X}DtlState` | 각 Dtl/Hist 파일 상단 | `{ tab, viewMode }` - 행 전환에도 탭/뷰모드 유지 |
| `window._ecCustInfoState` | `CustInfoMng.js` | 고객종합정보 탭/뷰모드 영속화 |

## 데이터 소스

### `_doc/ddl_pgsql/` — **PostgreSQL DDL 정의**

실 운영 DB 스키마. **파일당 테이블 1개** 원칙. 도메인별 하위 폴더로 구분.

```
_doc/ddl_pgsql/
├─ ec/    (46 파일) — 전자상거래: 회원/상품/옵션/주문/클레임/배송/쿠폰/캐쉬/
│                    전시(panel/widget/area)/이벤트/블로그/리뷰/채팅/공지/로그
├─ sy/    (26 파일) — 시스템: 사이트/코드/브랜드/업체/사용자/부서/권한/메뉴/
│                    첨부/템플릿/배치/알람/게시판/문의/로그
├─ 단어사전.sql     — 용어 표준
└─ zz.*.txt         — 설계 메모(카테고리/쿠폰/이벤트/전시 등 이슈 정리)
```

### `_doc/sample_insert_pgsql/` — **샘플 INSERT 데이터**

DDL과 1:1 대응하는 INSERT 문. 초기 데이터 로딩용 / 실 DB 연결 시 참조.

### `api/` — **목업 JSON API 응답**

`axiosApi`가 `api/` 기준 상대경로로 읽는 정적 JSON.

- `api/base/site-config.json` - 사용자 사이트 기본 설정
- `api/base/users.json` - 로그인 계정 목업
- `api/my/*.json` - 마이페이지용 (orders, claims, chats, cash, coupons, inquiries, after-sales 등)
- `api/products/` - 상품 이미지 등 정적 자원
- `api/admin/` - 관리자 API 응답(현재는 `adminData` 직접 사용이 주류)
- `api/xs/` - 전시 샘플 페이지용 JSON

## 관리자 컴포넌트 규칙

### Props 표준

- **Mng**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes']`
- **Dtl**: Mng + `'editId'`, `'viewMode'`
- **Hist**: `['navigate', 'adminData', 'showRefModal', 'showToast', '<entityId>']`
- Mng 내 Dtl 인라인 임베드 시: `:show-confirm` + `:set-api-res` 반드시 전달

### 저장/삭제 표준 패턴

```js
// 저장 (POST/PUT)
const ok = await props.showConfirm('저장', '저장하시겠습니까?');
if (!ok) return;
try {
  const res = await window.adminApi.post(`resource/${form.id}`, { ...form });
  if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
  props.showToast('저장되었습니다.', 'success');
  props.navigate('pageId');
} catch (err) {
  const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
  if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
  props.showToast(errMsg, 'error', 0);
}

// 삭제 (DELETE)
const ok = await props.showConfirm('삭제', '삭제하시겠습니까?');
if (!ok) return;
try {
  await window.adminApi.delete(`resource/${id}`);
  props.showToast('삭제되었습니다.', 'success');
} catch (err) {
  props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
}
```

### Yup 유효성 검사 패턴

```js
const errors = reactive({});
const schema = yup.object({ field: yup.string().required('메시지') });
// save() 시작:
Object.keys(errors).forEach(k => delete errors[k]);
try {
  await schema.validate(form, { abortEarly: false });
} catch (err) {
  err.inner.forEach(e => { errors[e.path] = e.message; });
  props.showToast('입력 내용을 확인해주세요.', 'error');
  return;
}
```

### 컴포넌트 태그 네이밍

Vue `app.component('EcOrderMng', window.EcOrderMng)` → 템플릿에서 `<ec-order-mng>`. 항상 **kebab-case + 도메인 프리픽스**(`ec-*`, `sy-*`) 사용. 프리픽스 누락 시 렌더 실패.

### Mng → Dtl 임베드 패턴

목록 행의 "수정" 클릭 → Mng 하단에 Dtl 인라인 임베드. `loadDetail(id)` / `closeDetail()` / `inlineNavigate`로 분리 제어. 탭/뷰모드는 `window._ec{X}DtlState`로 행 전환에도 유지.

### Dtl 탭 뷰모드 (최근 도입)

Order/Claim/Dliv/Prod/Event/Cache/Coupon/Chatt Dtl + Prod/Member/Order/Claim/Dliv Hist에 5개 뷰모드 버튼 노출:
- 📑 탭 / 1▭ 1열 / 2▭ 2열 / 3▭ 3열 / 4▭ 4열
- 3/4열 모드 활성화 시 `.admin-wrap:has(.dtl-tab-grid.cols-3/.cols-4)` CSS로 폭 제한 해제
- Hist 컴포넌트가 Dtl의 "hist" 탭 안에 임베드되는 경우(OrderHist/ClaimHist/DlivHist)는 뷰모드 아이콘 제거, 항상 `tab` 모드

## 전시관리 (Display) 구조

**계층**: `UI > Area > Panel > Widget` (각각 `DispX01Ui`, `DispX02Area`, `DispX03Panel`, `DispX04Widget` 컴포넌트)

- `adminData.displays[]` 각 항목: 패널 기본정보 + `rows[]`(위젯 목록)
- 위젯 타입: `image_banner`, `product_slider`, `product`, `cond_product`, `chart_bar/line/pie`, `text_banner`, `info_card`, `popup`, `file`, `file_list`, `coupon`, `html_editor`, `event_banner`, `cache_banner`, `widget_embed`, `barcode`, `countdown`
- 영역코드(`DISP_AREA`): `adminData.codes`에서 `codeGrp === 'DISP_AREA'`
- 관리 컴포넌트: `DispUiMng/Dtl`, `DispAreaMng/Dtl/Preview`, `DispPanelMng/Dtl/Preview`, `DispWidgetMng/Dtl/Preview`, `DispWidgetLibMng/Dtl/Preview`
- 시뮬레이션: `DispUiSimul.js` - 디바이스 프레임별 실사용자 관점 미리보기

## CSS 규칙

### 관리자 (`assets/css/adminGlobalStyle0N.css`)

| 클래스 | 용도 |
|---|---|
| `admin-wrap` | 메인 콘텐츠 래퍼. max-width 1400px (3/4열 모드 시 자동 해제) |
| `card` | 카드 컨테이너 (배경/패딩/라운드/그림자) |
| `admin-table` | 목록 테이블 표준 |
| `search-bar`, `search-label`, `search-actions` | 검색 영역 |
| `toolbar`, `list-title`, `list-count` | 목록 툴바 |
| `pagination`, `pager`, `pager-right` | 페이지네이션 |
| `form-row`, `form-group`, `form-label`, `form-control` | 폼 |
| `is-invalid`, `field-error` | 입력 오류 표시 |
| `form-actions` | 저장/취소 버튼 영역 |
| `badge`, `badge-green/gray/blue/orange/red/purple` | 상태 뱃지 |
| `btn`, `btn-primary/secondary/blue/danger/green/sm/xs` | 버튼 |
| `title-link` | 클릭 가능한 목록 행 제목 |
| `actions` | 행 액션 버튼 묶음 |
| `ref-link` | 참조 모달 열기 링크 |
| `tab-nav`, `tab-btn`, `tab-count` | 탭 (흰 라운드 카드 + 핑크 그라데이션 active) |
| `tab-view-modes`, `tab-view-mode-btn` | 뷰모드 아이콘 그룹 |
| `tab-bar-row` | 탭바 + 뷰모드 아이콘 한 줄 묶음 |
| `dtl-tab-grid.cols-1/2/3/4` | Dtl 탭 컨텐츠 그리드 |
| `dtl-tab-card-title` | 1/2/3/4열 모드에서만 보이는 카드 헤더 |

### 사용자 (`assets/css/frontGlobalStyle{01|02|03}.css`)

CSS 변수 기반 테마 전환:
- `--accent`, `--text-primary`, `--bg-base`, `--bg-card`, `--border`, `--shadow` 등
- `01`: 베이지/카키 톤 (`#c9a96e`)
- `02`: 민트/세이지 그린 톤 (`#4a9b7e`)
- `.front-site-badge` — 헤더 SITE NO 배지 + hover CSS 툴팁

## FRONT_SITE_NO 시스템

하나의 값으로 **6곳 자동 동기화**:

| 대상 | 동작 |
|---|---|
| CSS | `frontGlobalStyle{NO}.css` 자동 로드 |
| 스크립트 | `pages/Home{NO}.js`, `Prod{NO}List.js`, `Prod{NO}View.js` document.write로 동적 삽입 |
| 컴포넌트 등록 | `app.component('Home'+NO, window['Home'+NO])` |
| 런타임 렌더 | `<component :is="frontHomeComp">` (window['Home'+NO] 참조) |
| URL 오버라이드 | `?FRONT_SITE_NO=01\|02\|03` → localStorage 저장 후 쿼리 자동 제거 |
| 헤더 배지 | AppHeader 로고 옆 `01/02/03` 작은 뱃지 (hover 시 툴팁) |

**사이트 테마 프리셋**:
- **01** — 기본 모듈 (베이지/카키, `frontGlobalStyle01.css`)
- **02** — Mint Edition (민트/세이지 그린, `frontGlobalStyle02.css`, 상단에 🌿 리본)
- **03** — Luxe Edition (로얄 퍼플, `frontGlobalStyle03.css`, 상단에 👑 리본)

**URL 단축**: `/index.html` → `/` (history.replaceState로 자동), 해시/쿼리 유지.

**URL 페이지 ID는 Generic** (`home`, `prodList`, `prodView`). FRONT_SITE_NO가 바뀌어도 URL은 동일.

## 모달 디자인 시스템

`components/modals/BaseModal.js` 상단에서 전역 `<style>` 주입 → 모든 모달에 자동 적용:
- 오버레이: 반투명 다크네이비 + 블러
- 모달 박스: 16px 라운드 + 2중 그림자
- 헤더: **핑크 그라데이션** (`#fff0f4 → #ffe4ec → #ffd5e1`)
- Close 버튼: 원형 hover 시 핑크 채움 + 90° 회전
- 선택 버튼: 핑크 그라데이션, hover lift
- Tree 모달(부서/카테고리/메뉴/권한): `.tree-modal-header` 클래스로 동일 디자인 통일
- `modal-box` 내부 `.form-control:focus`, `.btn-primary/.btn-secondary` 표준화

## 푸터 메뉴 바로가기

`AppFooter.js`에 3열 레이어 모달:
- **frontOffice** (블루) - 홈/상품/장바구니/주문/찜/이벤트/블로그/FAQ/고객센터/위치/회사/마이페이지
- **backOffice** (퍼플) - 대시보드/회원/상품/주문/전시UI·영역·패널·위젯/시뮬레이션
- **나머지 세로 2단**:
  - 🌈 Front 사이트번호 (그린, 현재 선택 표시) - FRONT_SITE_NO=01/02
  - 🖥 dispUi 샘플 (오렌지) - 통합 페이지 + UI 샘플 01~06

## 관리자 주요 일괄 작업 (Mng)

Order/Claim/Dliv Mng의 "변경작업 선택" 모달:
- 좌측 체크박스 일괄 선택 + 상단 `📝 변경작업 선택` 버튼
- 탭: 상태변경 / 결제수단(주문) / 클레임유형(클레임) / 택배정보(배송) / **결재처리** / **추가결재요청**
- "추가결재요청" 탭은 adminData.members에서 회원 picker + 전화/이메일 자동 + 요청대상(주문/상품/배송/추가결재) + 요청대상명(수정가능) + 요청금액 + 전송 템플릿(`{target}{targetNm}{amount}{reason}` 치환)
- 하단 `📋 작업내용` textarea 자동 생성: `[도메인] 작업명 변경: 이전값 → 새값` 라인별 표시

## 주요 고객(CustInfo) 종합정보

9개 영역을 탭 구성 + 5개 뷰모드:
주문/클레임/배송/캐쉬/문의/채팅/로그인/쿠폰/발송 각 탭 카드.
기본 진입 시 **3열** 뷰로 시작 (`window._ecCustInfoState.viewMode = '3col'`).

## Tailwind CSS 빌드 시스템

### 왜 빌드가 필요한가?

Tailwind는 사용된 유틸리티 클래스만 추려 CSS로 출력하는 **JIT(Just-In-Time)** 방식입니다.

**빌드 CLI**: `tailwind.config.js` 의 `content` 경로를 스캔하여 프로젝트에서 **실제 사용된 클래스만** 추출 → 최소 크기 CSS 파일 생성 (수십 KB).
**빌드 없이 Play CDN 사용 시**: 브라우저가 3MB+ JS를 받아 런타임에 CSS를 생성 → 첫 렌더 수백 ms 지연, 매 요청마다 반복. **프로덕션 사용 금지**.

### 언제 다시 빌드해야 하는가?

| 상황 | 재빌드 |
|---|---|
| HTML/JS/Vue 템플릿에 **새 Tailwind 클래스** 사용 (`class="mt-8 grid-cols-5"` 등) | ✅ 필요 |
| `tailwind.config.js` 수정 (색상/content 경로 변경) | ✅ 필요 |
| `src/tailwind.css` 수정 (`@layer`/`@apply` 커스텀) | ✅ 필요 |
| 기존 클래스 재사용 (이미 tailwind.min.css 에 존재) | ❌ 불필요 |
| JS 로직 변경, API 호출, 컴포넌트 이름 변경 | ❌ 불필요 |
| `(front|admin)GlobalStyle*.css` 수정 | ❌ 불필요 (별도 CSS) |

**운영 규칙**: 개발 중엔 `npm run dev` (watch) 켜놓기 → 자동. **배포 직전 `npm run build` 1회 필수**.

### 안 하면 어떻게 되는가?

- **새 클래스 무시됨**: `class="bg-sky-500"` 사용해도 CSS 규칙이 없어 스타일 미적용
- **서버에 오래된 빌드 배포**: 개발 PC에서만 watch로 동작하고 `tailwind.min.css` 가 구 버전이면 **배포 사이트에서 스타일 깨짐**
- **CI 빌드 생략**: 배포 파이프라인에 `npm run build` 없으면 로컬 빌드와 배포본이 어긋남

### 자동화 방법

**① 개발 중 watch (가장 실용적)**
```bash
npm run dev   # 저장 시마다 tailwind.min.css 즉시 갱신
```

**② VS Code 워크스페이스 자동 시작** — `.vscode/tasks.json`
```json
{
  "version": "2.0.0",
  "tasks": [{
    "label": "tailwind:watch",
    "type": "npm", "script": "dev",
    "runOptions": { "runOn": "folderOpen" },
    "isBackground": true,
    "presentation": { "reveal": "silent" }
  }]
}
```
→ VS Code 폴더 열면 background로 watch 자동 실행.

**③ Git pre-commit hook** — `.husky/pre-commit`
```bash
#!/bin/sh
npm run build && git add assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css
```

**④ GitHub Actions CI** — `.github/workflows/tailwind.yml` 발췌
```yaml
- run: npm ci
- run: npm run build
- run: |
    git config user.email "ci@bot" && git config user.name "CI"
    git add assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css
    git diff --cached --quiet || (git commit -m "chore: rebuild tailwind" && git push)
```

### 빌드 구성 파일

| 파일 | 역할 | 읽는 주체 |
|---|---|---|
| `package.json` | `npm install`할 devDependencies + `npm run dev/build` 스크립트 정의 | npm |
| `tailwind.config.js` | 스캔 대상(`content`), 브랜드 색상(`theme.extend.colors`) 등 설정 | Tailwind CLI (Node) |
| `postcss.config.js` | PostCSS 플러그인 구성(Tailwind + autoprefixer) | Tailwind CLI (Node) |
| `src/tailwind.css` | 빌드 **입력** 파일. `@tailwind base/components/utilities` 3개 지시어 | Tailwind CLI |
| `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` | 빌드 **출력** 파일. `<link>`로 브라우저 로드 | 브라우저 |

**중요**: `package.json` / `tailwind.config.js` / `postcss.config.js` / `src/tailwind.css`는 모두 **개발 PC의 Node.js 빌드 도구가 읽는 파일**입니다. 브라우저는 존재조차 모릅니다. 배포 시 서버에 올릴 필요 없음.

### 빌드 파이프라인

```
[개발 PC · Node.js]
  ┌─────────────────────────────────────┐
  │  npx tailwindcss -i src/tailwind.css │
  │       -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css │
  │       --minify                       │
  └─────────────────────────────────────┘
       │ 1. tailwind.config.js 로드 (content 경로 확인)
       │ 2. 해당 파일들 스캔 → 사용된 class 수집
       │ 3. postcss.config.js 로드 → plugins 적용
       │ 4. autoprefixer가 벤더 프리픽스 추가
       │ 5. minify 후 tailwind.min.css 출력
       ▼
[브라우저]
  ┌────────────────────────────────────┐
  │ <link rel="stylesheet"             │
  │       href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css"> │
  └────────────────────────────────────┘
       오직 이 한 줄만 읽음. 설정 파일들은 요청조차 안 함.
```

### 빌드 명령 요약

```bash
# 최초 1회 — Node.js 의존성 설치
npm install

# 개발 중 — watch 모드 (파일 변경 감지 → 자동 재빌드)
npm run dev
# 또는: npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --watch

# 배포 전 — 압축 빌드
npm run build
# 또는: npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --minify
```

### HTML에 Tailwind 연결

각 진입점(index.html / admin.html / disp-ui.html) `<head>`에 다음 한 줄 추가:

```html
<link rel="stylesheet" href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
```

기존 `adminGlobalStyle0N.css` / `frontGlobalStyle0N.css`와 **공존 가능**. 점진적으로 유틸리티 클래스로 이관.

### 브랜드 색상 사용

`tailwind.config.js`에 정의된 팔레트:

```html
<!-- 사용자 페이스 핑크 브랜드 -->
<button class="bg-brand-pink hover:bg-brand-pink-dark text-white">저장</button>

<!-- 사이트 02(민트/세이지) 톤 -->
<div class="bg-brand-mint-light text-brand-mint-dark">...</div>
```

### 배포 체크리스트

배포 전 **반드시**:
1. `npm run build` 실행 → `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` 최신화
2. 빌드 결과물 커밋 여부 결정 (배포 파이프라인에서 빌드 시에만 `.gitignore`)
3. 서버에 `node_modules/`, `src/`, `*.config.js`, `package*.json` 업로드 **제외**

### 배포 제외 대상

```
node_modules/           ← npm install로 재생성 가능
src/                    ← Tailwind input 파일 (output만 배포)
tailwind.config.js      ← 빌드 도구용
postcss.config.js       ← 빌드 도구용
package.json            ← npm 관리용
package-lock.json       ← npm 관리용
.gitignore              ← 형상관리용
```

### 자주 만나는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 클래스가 적용 안 됨 | `content` 경로 누락 | `tailwind.config.js`의 content 배열 확인 |
| 빌드 후에도 변경 안 됨 | watch 모드 미실행 | `npm run dev` 실행 중인지 확인 |
| `@tailwind` 지시어 오류 | src/tailwind.css 손상 | 파일 복구 또는 재생성 |
| 배포 후 Tailwind 안 보임 | `--minify` 빌드 누락 | `npm run build` 후 CSS 업로드 |

---

## 로컬 설정 (`settings.json`)

```json
{
  "model": "sonnet",
  "MAX_THINIING_TOKENS": 10000,
  "CLAUDE_CODE_SUBAGETNT_MODEL": "haiku"
}
```

## 데이터베이스 연결 설정

| 항목 | 값 |
|---|---|
| **DB 타입** | PostgreSQL |
| **Host** | illeesam.synology.me |
| **Port** | 17632 |
| **Database** | postgres |
| **Username** | postgres |
| **Password** | (별도 전달) |
| **Default Schema** | shopjoy_2604 |

> 데이터베이스 접속 비밀번호는 이후 별도로 전달 예정

## 작업 지침

1. **새 관리자 페이지 추가 3단계 누락 금지**: `admin.html` script 태그 + `AdminApp.js` PAGE_COMP_MAP + `app.component()`
2. **컴포넌트 태그는 `ec-*` / `sy-*` 프리픽스 필수** — 프리픽스 빼먹으면 렌더 안 됨
3. **`window.*` 전역 의존이 많음** — 모듈화 이전에 건드릴 때 주입 순서 주의
4. **`adminData` 직접 수정이 소스 오브 트루스** — 목업 변경하면 전 화면 즉시 반영
5. **Dtl 탭 구조 변경 시** 5개 뷰모드 + 영속화 + dtl-tab-card-title 헤더 패턴 유지

## DDL 컬럼명 표준화

### 규칙

- **단일 단어 컬럼은 테이블명 프리픽스 필수** (예: `name` → `member_nm`, `email` → `user_email`)
- **복합어 컬럼명 변경** (예: `*_name` → `*_nm`, `*_remark` → `*_remark`)
- **상태 코드는 `*_status_cd` 또는 `*_*_status_cd` 형식**
- **예외: `*_log` 테이블은 단일 단어 컬럼 허용** (log, token, ip, device, msg 등)
- **예외: `*_hist` 테이블은 원본 테이블 컬럼명 + 단일 단어 추가 허용**

### 진행 상태 (2026-04-16)

#### 완료 파일
- `sy_site.sql`: domain→site_domain, email→site_email, phone→site_phone, zip_code→site_zip_code, address→site_address, business_no→site_business_no, ceo→site_ceo
- `sy_batch.sql`: last_run→batch_last_run, next_run→batch_next_run, run_count→batch_run_count, run_status→batch_run_status, timeout_sec→batch_timeout_sec, memo→batch_memo
- `sy_attach.sql`: url→attach_url, memo→attach_memo
- `sy_attach_grp.sql`: remarks→attach_grp_remark
- `sy_alarm.sql`: title→alarm_title, message→alarm_msg, send_date→alarm_send_date, send_count→alarm_send_count, fail_count→alarm_fail_count
- `sy_code.sql`: remark→code_remark
- `sy_brand.sql`: remark→brand_remark
- `sy_dept.sql`: remark→dept_remark
- `sy_bbm.sql`: remark→bbm_remark
- `sy_menu.sql`: remark→menu_remark
- `sy_path.sql`: remark→path_remark
- `sy_prop.sql`: remark→prop_remark
- `sy_role.sql`: remark→role_remark
- `ec_path.sql`: remark→path_remark

#### Log 테이블 (예외 - 단일 단어 유지)
- `sy_user_token_log.sql`, `sy_user_login_log.sql`, `ec_member_login_log.sql`, `ec_member_token_log.sql`, `sy_api_log.sql`, `ec_prod_view_log.sql`

#### 미완료 파일
- 전체 감사 필요 (sy_*, ec_* 도메인 DDL 파일)

## 정책서 문서화 (2026-04-16)

### 개요

`_doc/ddl_pgsql/정책/` 폴더에 현재 DDL 기준의 비즈니스 정책서 23개 파일 생성 완료.

**목적**: 각 기능/프로세스의 설계 의도, 상태 코드, 제약사항, 관련 테이블을 마크다운으로 문서화하여 운영 팀, 개발자, QA 간 공통 이해 기반 제공.

### 생성된 정책서 파일 목록

#### 1xx: 기본 정책
- **111.플랫폼.md** — 멀티사이트 플랫폼 운영 정책, site_id 기반 데이터 격리

#### 2xx: 사용자 관리
- **221.회원.md** — 고객 회원 관리, 상태(ACTIVE/DORMANT/SUSPENDED/WITHDRAWN)
- **222.판매자.md** — 판매자 등록, 상태 관리, 정산 계좌, 수수료 정책

#### 3xx: 상품·주문·배송·클레임
- **311.카테고리.md** — 3단계 계층(대/중/소) 카테고리 관리 정책
- **312.상품.md** — 상품 정보, 가격, 재고, 옵션(1/2단) 관리 정책
- **313.주문.md** — 주문 상태(PENDING/PAID/PREPARING/SHIPPED/COMPLT), 부분배송 정책
- **314.결제.md** — 6가지 결제수단(무통장/가상계좌/토스/카카오/네이버/핸드폰) 통합 관리
- **315.배송.md** — 출고(OUTBOUND)/입고(INBOUND) 배송, 택배사, 송장 관리
- **316.클레임취소.md** — 주문 취소 및 환불 정책, 취소 가능 상태
- **317.클레임반품.md** — 반품 수거, 입고, 환불 처리 및 배송료 정책
- **318.클레임교환.md** — 교환 배송, 왕복배송료, 품질 이상 교환 정책

#### 5xx: 프로모션 (Promotion)
- **511.프로포션쿠폰.md** — 쿠폰 발행, 사용 처리, 할인 적용 규칙
- **512.프로포션캐시.md** — 충전금 충전, 사용, 환불, 유효기간 정책
- **513.프로포션적립금.md** — 구매 적립금 지급, 사용, 자동 소멸 정책

#### 6xx: 전시 관리 (Display)
- **611.전시.md** — UI/Area/Panel/Widget 계층 구조, 위젯 타입 및 공개/숨김 관리

#### 7xx: 정산 (Settlement)
- **711.정산마감.md** — 월별 판매자 정산액 계산, 수수료 차감, 마감 상태
- **712.정산처리.md** — 정산액 지급 요청, 확인, 이의신청 처리 정책

#### 9xx: 시스템 공통
- **911.시스템공통.md** — ID 생성 규칙(YYMMDDhhmmss+rand4), 코드 관리, 보안 기본 정책
- **912.사용자.md** — 관리자 계정, 비밀번호 정책, 로그인 이력 관리
- **913.메뉴.md** — 관리자 시스템 메뉴 계층 구조 및 표시 조건
- **914.권한.md** — RBAC(Role-Based Access Control) 역할 정의, 권한 할당
- **915.공통코드.md** — 시스템 공통 코드 표준화(ORDER_STATUS, CLAIM_STATUS, DLIV_STATUS 등)
- **916.업체.md** — 업체(Vendor) 기본정보, 계약 상태, 은행 계좌 관리

### 각 정책서 구성 요소

1. **정책명 & 목적** — 기능의 비즈니스 목적
2. **범위** — 관련 역할(회원/판매자/관리자), 대상 시스템
3. **주요 정책** — 규칙 및 제약 조건 (숫자, 금액, 기간 등)
4. **상태 코드 / 필드** — 사용되는 `*_status_cd` 및 관련 컬럼 (예: `order_status_cd`, `dliv_status_cd_before`)
5. **관련 테이블** — 해당 정책에 참여하는 DDL 테이블명 목록
6. **제약사항** — 상태 전환 금지, 일괄 작업 제약 등

### 참조

- DDL 기준: `_doc/ddl_pgsql/ec/` + `sy/` (2026-04-16 기준)
- 상태 추적: 모든 `*_status_cd` 컬럼에 대응 `*_status_cd_before` 컬럼 추가 완료
- 구현 참조: `pages/admin/` 관리자 컴포넌트 (Mng/Dtl/Hist)

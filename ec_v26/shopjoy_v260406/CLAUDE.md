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
| `index.html` | **사용자 페이스** (front office) | `assets/css/frontOfficeStyle0N.css` | `base/config.js` + `api/*` JSON |
| `admin.html` | **관리자 페이스** (back office) | `assets/css/backOfficeStyle.css` | `pages/admin/AdminData.js` (목업) |
| `disp-ui.html` | **전시 UI 미리보기** (독립 렌더) | `assets/css/backOfficeStyle.css` | `adminData` + `api/xs/*` |

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
├─ base/stores/*.js      (Pinia: authStore, myStore)
├─ layout/AppHeader.js + AppSidebar.js + AppFooter.js + MyLayout.js
├─ pages/Home{NO}.js   pages/Prod{NO}List.js   pages/Prod{NO}View.js
├─ pages/{Cart,Order,Contact,Faq,Login,Event,Blog,Like,Location,About,...}.js
├─ pages/my/My*.js       (Pinia 의존)
├─ components/modals/BaseModal.js + components/comp/BaseComp.js
└─ base/app.js           (마지막. Vue 앱 생성/마운트)
```

**라우팅**: 해시 기반 (`#page=xxx&pid=N`). `base/app.js`의 `navigate(pageId)`.

**유효 페이지 ID** (`validPages` in `base/app.js`): `home, prodList, prodView, cart, order, contact, faq, event, eventView, blog, blogView, blogEdit, like, location, about, myOrder, myClaim, myCoupon, myCache, myContact, myChatt, dispUi01~06, sample01~23`.

**URL → 컴포넌트 매핑** (FRONT_SITE_NO 기준 동적):
- `#page=home` → `<component :is="frontHomeComp">` = `window['Home' + FRONT_SITE_NO]`
- `#page=prodList` → `window['Prod' + FRONT_SITE_NO + 'List']`
- `#page=prodView` → `window['Prod' + FRONT_SITE_NO + 'View']`

### 2) `admin.html` — 관리자 페이스

구조:
```
admin.html
├─ head: Vue, Yup, Quill, backOfficeStyle.css
├─ pages/admin/AdminData.js   (window.adminData - 모든 목업)
├─ utils/adminUtil.js         (window.adminCommonFilter/adminApiCall/adminUtil)
├─ components/modals/BaseModal.js + comp/BaseComp.js
├─ pages/admin/ec/*.js        (EC 도메인: Member/Prod/Order/Claim/Dliv/Coupon/Cache/Category/Event/Notice/Chatt/CustInfo/Disp*)
├─ pages/admin/sy/*.js        (시스템: User/Dept/Menu/Role/Site/Code/Brand/Template/Vendor/Attach/Batch/Alarm/Bbm/Bbs/Contact)
└─ pages/admin/AdminApp.js    (마지막. 멀티탭 시스템 마운트)
```

**라우팅**: AdminApp.js의 탭 시스템. `openTabs` reactive 배열. `navigate(pageId, { editId })` 패턴.

**좌측 메뉴 그룹** (AdminApp.js `MENU_BY_ROOT`):
- 회원관리, 상품관리, 주문관리, 프로모션, 전시관리, 고객센터, **시스템** (기준정보/공통업무/시스템/조직/메뉴/이력조회)

**Dtl 탭 뷰모드** (Order/Claim/Dliv/Prod/Event/Cache/Coupon/Chatt + 상응하는 Hist): 📑 탭 / 1열 / 2열 / 3열 / 4열. 각 상태는 `window._ec{X}DtlState`에 영속화. 3/4열 모드는 `.admin-wrap { max-width:none }` 자동 적용.

**새 컴포넌트 추가 시 필수 3단계**:
1. `admin.html`에 `<script>` 태그 추가
2. `AdminApp.js`의 `PAGE_COMP_MAP`에 `pageId → kebab-case` 추가
3. `app.component('ClassName', window.ClassName)` 등록

### 3) `disp-ui.html` — 전시 UI 미리보기

구조:
```
disp-ui.html
├─ head: Vue, axios, yup, backOfficeStyle.css
├─ pages/admin/AdminData.js + utils/adminUtil.js
├─ components/comp/BaseComp.js + pages/base/NotFound.js
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
| `window.axiosApi` | `utils/axiosUtil.js` | axios 래퍼. `api/` 기준 경로 자동 변환 |
| `window.adminApiCall` | `utils/adminUtil.js` | 확인 → 낙관적 업데이트 → API → 토스트 표준 패턴 |
| `window.adminUtil` | `utils/adminUtil.js` | `DATE_RANGE_OPTIONS`, `getDateRange`, `isInRange`, `exportCsv`, `getSiteNm` |
| `window.yup` | `assets/cdn/yup.js` | Yup shim |
| `window.shopjoyAuth` | `base/shopjoyAuth.js` | 인증 init/logout/state |
| `window.visibilityUtil` | `utils/adminUtil.js` | 공개/회원등급/권한 등 노출 대상 인코딩 (`^PUBLIC^MEMBER^VIP^`) |
| `window._ec{X}DtlState` | 각 Dtl/Hist 파일 상단 | `{ tab, viewMode }` - 행 전환에도 탭/뷰모드 유지 |
| `window._ecCustInfoState` | `CustInfoMng.js` | 고객종합정보 탭/뷰모드 영속화 |

## 데이터 소스

### `_doc/ddl_pgsql/` — **PostgreSQL DDL 정의**

실 운영 DB 스키마. 테이블 생성/인덱스/제약조건 정의.

**EC 도메인** (전자상거래):
- `ec_member.sql`, `ec_member_addr.sql`, `ec_member_login_log.sql`, `ec_member_token_log.sql`
- `ec_prod.sql`, `ec_prod_tag.sql`, `ec_category.sql`, `ec_review.sql`, `ec_like.sql`
- `ec_order.sql`, `ec_cart.sql`, `ec_claim.sql`, `ec_dliv.sql`
- `ec_coupon.sql`, `ec_cache.sql`, `ec_event.sql`, `ec_notice.sql`, `ec_blog.sql`, `ec_chatt.sql`
- `ec_disp_panel.sql`, `ec_disp_widget_lib.sql`
- `ec_page_view_log.sql`, `ec_push_log.sql`

**SY 도메인** (시스템):
- `sy_site.sql`, `sy_code.sql`, `sy_brand.sql`, `sy_vendor.sql`
- `sy_user.sql`, `sy_user_login_log.sql`, `sy_user_token_log.sql`, `sy_dept.sql`, `sy_role.sql`, `sy_menu.sql`
- `sy_attach.sql`, `sy_template.sql`, `sy_batch.sql`, `sy_alarm.sql`
- `sy_bbm.sql`, `sy_bbs.sql`, `sy_contact.sql`
- `sy_send_email_log.sql`, `sy_send_msg_log.sql`, `sy_api_log.sql`

**보조 문서**:
- `단어사전.sql` - 용어 표준
- `zz.*.txt` - 설계 메모(카테고리/쿠폰/이벤트/전시/사용자/사이트/업체/첨부 이슈 정리)

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
await window.adminApiCall({
  method: 'post' | 'put' | 'delete',
  path: `resource/${form.id}`,
  data: { ...form },                 // delete 시 생략
  confirmTitle: '저장',
  confirmMsg: '저장하시겠습니까?',
  showConfirm: props.showConfirm,
  showToast: props.showToast,
  setApiRes: props.setApiRes,
  successMsg: '저장되었습니다.',
  onLocal: () => { /* 낙관적 업데이트 */ },
  navigate: props.navigate,
  navigateTo: 'pageId',              // 저장 후 이동 (삭제 시 생략)
});
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

### 관리자 (`assets/css/backOfficeStyle.css`)

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

### 사용자 (`assets/css/frontOfficeStyle{01\|02}.css`)

CSS 변수 기반 테마 전환:
- `--accent`, `--text-primary`, `--bg-base`, `--bg-card`, `--border`, `--shadow` 등
- `01`: 베이지/카키 톤 (`#c9a96e`)
- `02`: 민트/세이지 그린 톤 (`#4a9b7e`)
- `.front-site-badge` — 헤더 SITE NO 배지 + hover CSS 툴팁

## FRONT_SITE_NO 시스템

하나의 값으로 **6곳 자동 동기화**:

| 대상 | 동작 |
|---|---|
| CSS | `frontOfficeStyle{NO}.css` 자동 로드 |
| 스크립트 | `pages/Home{NO}.js`, `Prod{NO}List.js`, `Prod{NO}View.js` document.write로 동적 삽입 |
| 컴포넌트 등록 | `app.component('Home'+NO, window['Home'+NO])` |
| 런타임 렌더 | `<component :is="frontHomeComp">` (window['Home'+NO] 참조) |
| URL 오버라이드 | `?FRONT_SITE_NO=01\|02\|03` → localStorage 저장 후 쿼리 자동 제거 |
| 헤더 배지 | AppHeader 로고 옆 `01/02/03` 작은 뱃지 (hover 시 툴팁) |

**사이트 테마 프리셋**:
- **01** — 기본 모듈 (베이지/카키, `frontOfficeStyle01.css`)
- **02** — Mint Edition (민트/세이지 그린, `frontOfficeStyle02.css`, 상단에 🌿 리본)
- **03** — Luxe Edition (로얄 퍼플, `frontOfficeStyle03.css`, 상단에 👑 리본)

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

Tailwind는 사용된 유틸리티 클래스만 추려 CSS로 출력하는 **JIT(Just-In-Time)** 방식입니다. 빌드 없이 Play CDN을 사용하면 런타임에 3MB의 JS가 브라우저에서 CSS를 생성해 **치명적인 성능 저하**를 유발합니다. 따라서 **CLI로 빌드하여 최종 CSS 파일만 브라우저에 서빙**합니다.

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

기존 `backOfficeStyle.css` / `frontOfficeStyle0N.css`와 **공존 가능**. 점진적으로 유틸리티 클래스로 이관.

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

## 작업 지침

1. **새 관리자 페이지 추가 3단계 누락 금지**: `admin.html` script 태그 + `AdminApp.js` PAGE_COMP_MAP + `app.component()`
2. **컴포넌트 태그는 `ec-*` / `sy-*` 프리픽스 필수** — 프리픽스 빼먹으면 렌더 안 됨
3. **`window.*` 전역 의존이 많음** — 모듈화 이전에 건드릴 때 주입 순서 주의
4. **`adminData` 직접 수정이 소스 오브 트루스** — 목업 변경하면 전 화면 즉시 반영
5. **Dtl 탭 구조 변경 시** 5개 뷰모드 + 영속화 + dtl-tab-card-title 헤더 패턴 유지

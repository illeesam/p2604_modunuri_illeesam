# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 목차

**🚀 시작하기**
- [실행 방법](#실행-방법) — 로컬 개발 환경 구성
- [기술 스택](#기술-스택-로컬-로드-중심) — 라이브러리 및 버전
- [진입점별 구조](#진입점별-구조) — index.html / bo.html / disp-ui.html

**🎨 프론트엔드 (Vue 3)**
- [글로벌 네임스페이스](#글로벌-네임스페이스-window) — window 객체 정의 및 역할
- [공통 API 서비스 (services/)](#공통-api-서비스-services) — coApiSvc / foApiSvc / boApiSvc ⭐
- [관리자 컴포넌트 규칙](#관리자-컴포넌트-규칙) — Mng/Dtl/Hist 패턴
- [CSS 규칙](#css-규칙) — 클래스명 표준
- [FRONT_SITE_NO 시스템](#front_site_no-시스템) — 멀티사이트 관리
- [모달 디자인 시스템](#모달-디자인-시스템) — BaseModal
- [Vue 3 초기화 순서](#vue-3-초기화-순서-composition-api) — ref/computed/watch 선언 순서 ⭐
- [함수·변수 네이밍 규칙](#함수변수-네이밍-규칙) — on/handle/fn/cf/sf/sv 접두어
- [UI/UX 정책](#uiux-정책) — showToast/showConfirm 표준, 목록 번호/ID 컬럼 규칙

**⚙️ 백엔드 (Spring Boot)**
- [EcAdminApi Controller/Service](#ecadminapi-controller--service-파라미터-패턴) — Map<String, Object> p 패턴
- [MyBatis SQL 테이블 별칭](#mybatis-sql-테이블-별칭-정책-postgresql) — 모든 컬럼 명시 ⭐
- [MyBatis Mapper XML 수정 이력](#mybatis-mapper-xml-수정-이력-2026-04-16--2026-04-29) — 문제 해결 과정
- [Spring Boot 빌드 & 배포](#spring-boot-빌드--배포) — ./gradlew clean build ⭐
- [데이터베이스 연결 설정](#데이터베이스-연결-설정) — PostgreSQL 접속 정보

**📋 데이터 & 정책**
- [데이터 소스](#데이터-소스) — DDL / 샘플 데이터 / 목업 JSON
- [JPA Entity → DB 기준](#jpa-entity-파일--db-테이블컬럼명-기준-최우선-참조-) — Entity가 테이블/컬럼명 단일 기준 ⭐
- [DDL 컬럼명 표준화](#ddl-컬럼명-표준화) — 네이밍 규칙 및 진행 상태
- [정책서 문서화](#정책서-문서화-2026-04-16) — 비즈니스 정책 문서

**📌 작업 지침**
- [작업 지침](#작업-지침) — Vue 3 & Spring Boot 체크리스트

---

## 실행 방법

**Vue 3 CDN 로컬 로드** 구조. VS Code **Live Server**로 실행 (기본 포트 `127.0.0.1:5501`).

- **Vue/Pinia/axios/Yup/Quill** 등 런타임 라이브러리: 로컬 복사본(`assets/cdn/pkg/<pkg>/<ver>/`)에서 로드 — CDN 미사용
- **앱 코드**: 빌드 없이 원본 JS 그대로 브라우저 실행 (`<script src="pages/*.js">`)

### CDN 파일 준비 (최초 1회)

`assets/cdn/pkg/README.md` 참조 — Vue, Pinia, Quill, 우편번호 등 로컬 복사본 준비.

### 일상 개발

VS Code Live Server로 index.html 열기 → `http://127.0.0.1:5501/`

세 개의 독립 진입점:

| 진입점 | 용도 | 주 CSS | 주 데이터 소스 |
|---|---|---|---|
| `index.html` | **사용자 페이스** (front office) | `assets/css/frontGlobalStyle0N.css` | `base/config.js` + `api/*` JSON |
| `bo.html` | **관리자 페이스** (back office) | `assets/css/adminGlobalStyle0N.css` | `pages/admin/AdminData.js` (목업) |
| `disp-fo-ui.html` / `disp-bo-ui.html` | **전시 UI 미리보기** (독립 렌더) | `assets/css/adminGlobalStyle0N.css` | `adminData` + `api/xs/*` |

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

### 2) `bo.html` — 관리자 페이스

구조:
```
bo.html
├─ head: Vue, Yup, Quill, adminGlobalStyle0N.css
├─ pages/admin/AdminData.js   (window.adminData - 모든 목업)
├─ utils/adminAxios.js (window.adminApi) + utils/adminUtil.js (window.adminUtil)
├─ components/modals/BaseModal.js + comp/BaseComp.js
├─ pages/admin/ec/*.js        (EC 도메인: Member/Prod/Order/Claim/Dliv/Coupon/Cache/Category/Event/Notice/Chatt/CustInfo/Disp*)
├─ pages/admin/sy/*.js        (시스템: User/Dept/Menu/Role/Site/Code/Brand/Template/Vendor/Attach/Batch/Alarm/Bbm/Bbs/Contact)
└─ pages/admin/AdminApp.js    (마지막. 멀티탭 시스템 마운트)
```

**라우팅**: AdminApp.js의 탭 시스템. `openTabs` reactive 배열. `navigate(pageId, { dtlId })` 패턴.

**좌측 메뉴 그룹** (AdminApp.js `MENU_BY_ROOT`):
- 회원관리, 상품관리, 주문관리, 프로모션, 전시관리, 고객센터, **시스템** (기준정보/공통업무/시스템/조직/메뉴/이력조회)

**Dtl 탭 뷰모드** (Order/Claim/Dliv/Prod/Event/Cache/Coupon/Chatt + 상응하는 Hist): 📑 탭 / 1열 / 2열 / 3열 / 4열. 각 상태는 `window._ec{X}DtlState`에 영속화. 3/4열 모드는 `.admin-wrap { max-width:none }` 자동 적용.

**새 컴포넌트 추가 시 필수 4단계**:
1. `bo.html`에 `<script>` 태그 추가
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

### 3) `disp-fo-ui.html` / `disp-bo-ui.html` — 전시 UI 미리보기

구조:
```
disp-bo-ui.html (관리자 컨텍스트)  |  disp-fo-ui.html (사용자 컨텍스트)
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
| `window._ec{X}DtlState` | 각 Dtl/Hist 파일 상단 | `{ tab, tabMode }` - 행 전환에도 탭/뷰모드 유지 |
| `window._ecCustInfoState` | `CustInfoMng.js` | 고객종합정보 탭/뷰모드 영속화 |
| `window.coApiSvc` | `services/coApiSvc.js` | FO·BO 공통 API (cmBoAppStore / cmFoAppStore / syCode / syPath / sySite) |
| `window.foApiSvc` | `services/foApiSvc.js` | FO 전용 공통 API (cmBltn / myCash / myChat / myClaim / myCoupon / myInquiry / myOrder / pdProd / pmEvent) |
| `window.boApiSvc` | `services/boApiSvc.js` | BO 전용 공통 API (cmBlog / cmChatt / cmNotice / dpArea / dpPanel / dpUi / dpWidgetLib / mbCustInfo / mbMemGrade / mbMemGroup / mbMember / odClaim / odDliv / odOrder / pdBundle / pdCategory / pdDlivTmplt / pdProd / pdQna / pdRestockNoti / pdReview / pdTag / pmCache / pmCoupon / pmDiscnt / pmEvent / pmGift / pmPlan / pmSave / pmVoucher / syAlarm / syAttach / syAttachGrp / syBatch / syBbs / syBbm / syBrand / syCode / syContact / syMenu / syRole / sySite / syTemplate / syUser / syVendor) |

## 공통 API 서비스 (`services/`)

**목적**: 페이지 파일 전체에서 사용하는 모든 API 엔드포인트를 `services/` 파일에 등록하여 한 곳에서 관리.  
단일 화면 전용이라도 `services/`에 등록하는 것을 원칙으로 한다.  
단, POST/PUT/DELETE 등 변경성 호출은 각 페이지 파일 안에 직접 선언해도 무방하다 (GET 위주로 등록).

### 파일 구성

| 파일 | 전역 객체 | 로드 대상 | 설명 |
|---|---|---|---|
| `services/coApiSvc.js` | `window.coApiSvc` | FO (`index.html`) + BO (`bo.html`) | FO·BO 양쪽에서 사용하는 공통 엔드포인트 |
| `services/foApiSvc.js` | `window.foApiSvc` | FO (`index.html`) | FO 전용 공통 엔드포인트 |
| `services/boApiSvc.js` | `window.boApiSvc` | BO (`bo.html`) | BO 전용 공통 엔드포인트 |

> **네이밍 주의**: `foApi` / `boApi` 는 이미 axios 래퍼(`foApiAxios.js`, `boApiAxios.js`)가 사용 중.  
> 서비스 객체는 `foApiSvc` / `boApiSvc` / `coApiSvc` 로 구분.

### 컨트롤러 URL 프리픽스 규칙

| 서비스 파일 | URL 프리픽스 | 설명 |
|---|---|---|
| `coApiSvc.js` | `/co/...` | FO·BO 공통 컨트롤러 (예: `/co/sy/code/list`) |
| `foApiSvc.js` | `/fo/...` | FO 전용 컨트롤러 (예: `/fo/ec/pd/prod/page`) |
| `boApiSvc.js` | `/bo/...` | BO 전용 컨트롤러 (예: `/bo/ec/mb/member/page`) |

### 로드 순서 (선행 의존)

```
bo.html:    boApiAxios.js → coUtil.js → boUtil.js → services/coApiSvc.js → services/boApiSvc.js
index.html: foApiAxios.js → coUtil.js → foUtil.js → services/coApiSvc.js → services/foApiSvc.js
```

### 네임스페이스 명명 규칙

URL 경로의 서브도메인 세그먼트를 prefix로 사용한다.

| URL 경로 예시 | prefix | 예시 네임스페이스 |
|---|---|---|
| `/bo/ec/mb/member/...` | `mb` | `mbMember` |
| `/bo/ec/pd/prod/...` | `pd` | `pdProd`, `pdCategory` |
| `/bo/ec/od/order/...` | `od` | `odOrder`, `odClaim`, `odDliv` |
| `/bo/ec/pm/coupon/...` | `pm` | `pmCoupon`, `pmCache`, `pmEvent` |
| `/bo/ec/dp/ui/...` | `dp` | `dpUi`, `dpArea`, `dpPanel`, `dpWidgetLib` |
| `/bo/sy/user/...` | `sy` | `syUser`, `syVendor`, `syBrand` |
| `/co/cm/bo-app-store/...` | `cm` | `cmBoAppStore`, `cmFoAppStore` |
| `/fo/my/coupon/...` | `my` | `myCoupon`, `myCash` |

> ❌ 금지: `/bo/ec/mb/member` → `ecMember` (최상위 도메인 `ec` prefix 사용)  
> ✅ 허용: `/bo/ec/mb/member` → `mbMember` (서브도메인 `mb` prefix 사용)

### 네임스페이스 정렬 규칙

각 `services/` 파일 내 네임스페이스 블록은 **가나다(알파벳) 오름차순**으로 정렬한다.

```
// boApiSvc.js 정렬 예시
dpArea → dpPanel → dpUi → dpWidgetLib
→ mbMember
→ odClaim → odDliv → odOrder
→ pdCategory → pdProd
→ pmCache → pmCoupon → pmEvent
→ syAlarm → syBatch → syBbm → syBrand → syMenu → syRole → sySite → syUser → syVendor
```

### 등록 기준

```js
// ✅ services/ 등록 — GET 엔드포인트는 단독 사용이라도 모두 등록
const res = await boApiSvc.mbMember.getPage({ kw: '홍길동' });
const res = await boApiSvc.syBbs.getPage({ bbmId: '1' });
const res = await coApiSvc.syCode.getGrpCodes('ORDER_STATUS');

// ✅ 페이지 직접 선언 허용 — 변경성(POST/PUT/DELETE/PATCH) 단건 호출
await boApi.put('/bo/sy/i18n/${id}/msgs', body, coUtil.apiHdr('다국어', '저장'));
await boApi.post('/bo/sy/batch/run', {}, coUtil.apiHdr('배치', '즉시실행'));
```

### 새 API 추가 방법

1. 해당 `services/` 파일에 도메인 네임스페이스로 추가
2. 네임스페이스 prefix는 URL 서브도메인 세그먼트 사용 (예: `/bo/ec/pd/...` → `pd`)
3. 파일 내 가나다순 위치에 삽입
4. 동일 패턴: `return global.boApi.get(path, { params, ...hdr(uiNm, cmdNm) })`
5. `coApiSvc`는 `client()` 헬퍼 사용 (FO·BO 환경 자동 선택)

```js
// services/boApiSvc.js 추가 예시 (pmEvent 다음 위치에 삽입)
boApiSvc.pmPoint = {
  getPage(params, uiNm, cmdNm) {
    return global.boApi.get('/bo/ec/pm/point/page', { params, ...hdr(uiNm, cmdNm) });
  },
};
```

## 정책서 참조

**`_doc/정책서/CLAUDE.md`** — 마스터 인덱스 (85개 정책 문서)

### 핵심 정책서 (자주 참조)

| 상황 | 참조 문서 |
|------|---------|
| 신규 화면/기능 개발 | `_doc/정책서/base/CLAUDE.md` → 해당 도메인 `CLAUDE.md` |
| 상태 코드 확인 | `_doc/정책서/{도메인}/*.01.상태표.md` |
| 기술 표준 (Vue) | `_doc/정책서/sy/sy.54.네이밍규칙.md` |
| 기술 표준 (SQL) | `_doc/정책서/sy/sy.55.mybatis쿼리테이블별칭정책.md` ⭐ |
| API 설계 패턴 | `_doc/정책서/base/base.기술-api.md` |
| 권한 및 접근 | `_doc/정책서/base/base.권한-*.md` |
| DDL 컬럼명 규칙 | `_doc/정책서/sy/sy.52.ddl단어사전규칙.md` |
| 인증/로그인 | `_doc/정책서/base/base.인증-*.md` |

---

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

### JPA Entity 파일 — **DB 테이블/컬럼명 기준 (최우선 참조)** ⭐

**`_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/*/entity/*.java`** 가 DB 테이블 및 컬럼명의 단일 소스(Single Source of Truth).

- DDL 파일(`_doc/ddl_pgsql/`)이나 Mapper XML보다 **Entity 파일이 우선**한다
- 컬럼명 참조 시 반드시 해당 Entity의 `@Column(name="...")` 어노테이션을 확인
- Java 필드명(camelCase) → DB 컬럼명(snake_case) 자동 대응

#### 도메인별 Entity → 테이블 매핑

| 도메인 패키지 | Entity 클래스 | DB 테이블 |
|---|---|---|
| **ec/cm** | CmBlog | cm_blog |
| | CmBlogCate | cm_blog_cate |
| | CmBlogFile | cm_blog_file |
| | CmBlogGood | cm_blog_good |
| | CmBlogReply | cm_blog_reply |
| | CmBlogTag | cm_blog_tag |
| | CmChattMsg | cm_chatt_msg |
| | CmChattRoom | cm_chatt_room |
| | CmhPushLog | cmh_push_log |
| | CmPath | cm_path |
| **ec/dp** | DpArea | dp_area |
| | DpAreaPanel | dp_area_panel |
| | DpPanel | dp_panel |
| | DpPanelItem | dp_panel_item |
| | DpUi | dp_ui |
| | DpUiArea | dp_ui_area |
| | DpWidget | dp_widget |
| | DpWidgetLib | dp_widget_lib |
| **ec/mb** | MbMember | mb_member |
| | MbMemberAddr | mb_member_addr |
| | MbMemberGrade | mb_member_grade |
| | MbMemberGroup | mb_member_group |
| | MbMemberSns | mb_member_sns |
| | MbDeviceToken | mb_device_token |
| | MbLike | mb_like |
| | MbMemberRole | mb_member_role |
| | MbhMemberLoginLog | mbh_member_login_log |
| | MbhMemberTokenLog | mbh_member_token_log |
| **ec/od** | OdCart | od_cart |
| | OdOrder | od_order |
| | OdOrderItem | od_order_item |
| | OdOrderDiscnt | od_order_discnt |
| | OdOrderItemDiscnt | od_order_item_discnt |
| | OdPay | od_pay |
| | OdPayMethod | od_pay_method |
| | OdDliv | od_dliv |
| | OdDlivItem | od_dliv_item |
| | OdClaim | od_claim |
| | OdClaimItem | od_claim_item |
| | OdRefund | od_refund |
| | OdRefundMethod | od_refund_method |
| | OdhClaimChgHist | odh_claim_chg_hist |
| | OdhClaimItemChgHist | odh_claim_item_chg_hist |
| | OdhClaimItemStatusHist | odh_claim_item_status_hist |
| | OdhClaimStatusHist | odh_claim_status_hist |
| | OdhDlivChgHist | odh_dliv_chg_hist |
| | OdhDlivItemChgHist | odh_dliv_item_chg_hist |
| | OdhDlivStatusHist | odh_dliv_status_hist |
| | OdhOrderChgHist | odh_order_chg_hist |
| | OdhOrderItemChgHist | odh_order_item_chg_hist |
| | OdhOrderItemStatusHist | odh_order_item_status_hist |
| | OdhOrderStatusHist | odh_order_status_hist |
| | OdhPayChgHist | odh_pay_chg_hist |
| | OdhPayStatusHist | odh_pay_status_hist |
| **ec/pd** | PdCategory | pd_category |
| | PdCategoryProd | pd_category_prod |
| | PdProd | pd_prod |
| | PdProdContent | pd_prod_content |
| | PdProdImg | pd_prod_img |
| | PdProdSku | pd_prod_sku |
| | PdProdOpt | pd_prod_opt |
| | PdProdOptItem | pd_prod_opt_item |
| | PdProdTag | pd_prod_tag |
| | PdTag | pd_tag |
| | PdProdQna | pd_prod_qna |
| | PdReview | pd_review |
| | PdReviewComment | pd_review_comment |
| | PdReviewAttach | pd_review_attach |
| | PdDlivTmplt | pd_dliv_tmplt |
| | PdRestockNoti | pd_restock_noti |
| | PdProdRel | pd_prod_rel |
| | PdProdBundleItem | pd_prod_bundle_item |
| | PdProdSetItem | pd_prod_set_item |
| | PdhProdChgHist | pdh_prod_chg_hist |
| | PdhProdStatusHist | pdh_prod_status_hist |
| | PdhProdSkuChgHist | pdh_prod_sku_chg_hist |
| | PdhProdSkuPriceHist | pdh_prod_sku_price_hist |
| | PdhProdSkuStockHist | pdh_prod_sku_stock_hist |
| | PdhProdContentChgHist | pdh_prod_content_chg_hist |
| | PdhProdViewLog | pdh_prod_view_log |
| **ec/pm** | PmPlan | pm_plan |
| | PmPlanItem | pm_plan_item |
| | PmCoupon | pm_coupon |
| | PmCouponItem | pm_coupon_item |
| | PmCouponIssue | pm_coupon_issue |
| | PmCouponUsage | pm_coupon_usage |
| | PmDiscnt | pm_discnt |
| | PmDiscntItem | pm_discnt_item |
| | PmDiscntUsage | pm_discnt_usage |
| | PmVoucher | pm_voucher |
| | PmVoucherIssue | pm_voucher_issue |
| | PmGift | pm_gift |
| | PmGiftCond | pm_gift_cond |
| | PmGiftIssue | pm_gift_issue |
| | PmSave | pm_save |
| | PmSaveItem | pm_save_item |
| | PmSaveIssue | pm_save_issue |
| | PmSaveUsage | pm_save_usage |
| | PmEvent | pm_event |
| | PmEventItem | pm_event_item |
| | PmEventBenefit | pm_event_benefit |
| | PmCache | pm_cache |

#### sy 도메인 Entity → 테이블 매핑

sy 도메인 Entity는 `_apps/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/` 아래에 위치.  
`SyUser`, `SySite`, `SyCode`, `SyMenu`, `SyRole`, `SyBrand`, `SyVendor`, `SyDept`, `SyBatch`, `SyAlarm`, `SyAttach`, `SyAttachGrp`, `SyBbs`, `SyBbm`, `SyTemplate`, `SyProp` 등 포함.

## 관리자 컴포넌트 규칙

### Props 표준

props는 **배열 형식 금지**, 반드시 **객체 형식**으로 type·required·default를 명시한다.  
각 항목 끝에 `// 한 줄 주석` 으로 역할을 표시한다.

#### BO props 항목별 타입 및 default 규칙

| prop 이름 | type | required | default | 주석 |
|---|---|---|---|---|
| `navigate` | Function | true | — | `// 페이지 이동` |
| `showToast` | Function | false | `() => {}` | `// 토스트 알림` |
| `showConfirm` | Function | false | `() => Promise.resolve(true)` | `// 확인 모달` |
| `showRefModal` | Function | false | `() => {}` | `// 참조 모달 열기` |
| `setApiRes` | Function | false | `() => {}` | `// API 결과 전달` |
| `dtlId` | String | false | `null` | `// 수정 대상 ID` |
| `tabMode` | String | false | `'tab'` | `// 뷰모드 (tab/1col/2col/3col/4col)` |
| `adminData` / `boData` | Object | false | `() => ({})` | `// 목업/BO 공통 데이터` |
| `reloadTrigger` | Number | false | `0` | `// 재조회 트리거` |
| `*Id` / `*Code` 형식 | String | false | `null` | `// 대상 ID/코드` |

#### BO 컴포넌트 유형별 표준 props 선언

```js
// Mng
props: {
  navigate:     { type: Function, required: true },                       // 페이지 이동
  showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
  showToast:    { type: Function, default: () => {} },                    // 토스트 알림
  showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  setApiRes:    { type: Function, default: () => {} },                    // API 결과 전달
},

// Dtl
props: {
  navigate:     { type: Function, required: true },                       // 페이지 이동
  showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
  showToast:    { type: Function, default: () => {} },                    // 토스트 알림
  showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  setApiRes:    { type: Function, default: () => {} },                    // API 결과 전달
  dtlId:       { type: String,   default: null },                        // 수정 대상 ID
  tabMode:     { type: String,   default: 'tab' },                       // 뷰모드 (tab/1col/2col/3col/4col)
},

// Hist (xxxId 자리에 실제 ID명 사용, 예: batchId, orderId 등)
props: {
  navigate:     { type: Function, required: true },                       // 페이지 이동
  showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
  showToast:    { type: Function, default: () => {} },                    // 토스트 알림
  xxxId:        { type: String,   default: null },                        // 대상 ID
},
```

- Mng 내 Dtl 인라인 임베드 시: `:show-confirm` + `:set-api-res` 반드시 전달

#### FO props 항목별 타입 및 default 규칙

| prop 이름 | type | required | default | 주석 |
|---|---|---|---|---|
| `navigate` | Function | true | — | `// 페이지 이동` |
| `config` | Object | false | `() => ({})` | `// 사이트 설정` |
| `showToast` | Function | false | `() => {}` | `// 토스트 알림` |
| `showAlert` | Function | false | `() => {}` | `// 알림 모달` |
| `showConfirm` | Function | false | `() => Promise.resolve(true)` | `// 확인 모달` |
| `dtlId` | String | false | `null` | `// 대상 ID` |
| `products` | Array | false | `() => ([])` | `// 상품 목록` |
| `product` | Object | false | `() => ({})` | `// 상품 정보` |
| `cart` | Array | false | `() => ([])` | `// 장바구니 목록` |
| `cartCount` | Number | false | `0` | `// 장바구니 수량` |
| `selectProduct` | Function | false | `() => {}` | `// 상품 선택` |
| `toggleLike` | Function | false | `() => {}` | `// 찜 토글` |
| `isLiked` | Function | false | `() => false` | `// 찜 여부 확인` |
| `addToCart` | Function | false | `() => {}` | `// 장바구니 추가` |
| `removeFromCart` | Function | false | `() => {}` | `// 장바구니 삭제` |
| `updateCartQty` | Function | false | `() => {}` | `// 장바구니 수량 변경` |
| `clearCart` | Function | false | `() => {}` | `// 장바구니 비우기` |

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
| `tab-modes`, `tab-mode-btn` | 뷰모드 아이콘 그룹 |
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
기본 진입 시 **3열** 뷰로 시작 (`window._ecCustInfoState.tabMode = '3col'`).

## Claude Code 설정 (`settings.json`)

```json
{
  "model": "sonnet",
  "MAX_THINKING_TOKENS": 10000,
  "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
}
```

**설명**:
- `model`: Claude Code 기본 모델 (sonnet 권장)
- `MAX_THINKING_TOKENS`: 내부 추론 토큰 제한 (기본값 10000)
- `CLAUDE_CODE_SUBAGENT_MODEL`: 병렬 서브에이전트 모델 (haiku 권장 - 가볍고 빠름)

## 데이터베이스 연결 설정

| 항목 | 값 |
|---|---|
| **DB 타입** | PostgreSQL |
| **Host** | illeesam.synology.me |
| **Port** | 17632 |
| **Database** | postgres |
| **Username** | postgres |
| **Password** | postgresilleesam |
| **Default Schema** | shopjoy_2604 |

**Spring Boot 실행 파라미터**:
```
-Dspring.profiles.active=dev -DDB_HOST=illeesam.synology.me -DDB_PORT=17632 -DDB_NAME=postgres -DDB_SCHEMA=shopjoy_2604 -DDB_USERNAME=postgres -DDB_PASSWORD=postgresilleesam
```

> 상세 설정 → `_doc/정책서-dev/db-connection.md`

## EcAdminApi Controller / Service 파라미터 패턴

**핵심 원칙**: 개별 String/int 파라미터 대신 `Map<String, Object>`, DTO, VO로 받는다.  
이유: 항목 추가·삭제 시 Controller/Service 서명을 변경하지 않고 Mapper XML만 수정.

### Controller 규칙

```java
// ✅ GET 목록/페이징 — Map으로 모든 쿼리 파라미터 수신
@GetMapping
public ResponseEntity<ApiResponse<List<XxxDto>>> list(
        @RequestParam Map<String, Object> p) {
    List<XxxDto> result = service.getList(p);
    return ResponseEntity.ok(ApiResponse.ok(result));
}

@GetMapping("/page")
public ResponseEntity<ApiResponse<PageResult<XxxDto>>> page(
        @RequestParam Map<String, Object> p) {
    PageResult<XxxDto> result = service.getPageData(p);
    return ResponseEntity.ok(ApiResponse.ok(result));
}

// ✅ POST/PUT — Entity 또는 DTO/VO @RequestBody
@PostMapping
public ResponseEntity<ApiResponse<XxxEntity>> create(@RequestBody XxxEntity entity) { ... }

// 불가피한 예외: @PathVariable (경로 변수), @RequestBody Map (단순 단건 데이터)
```

### Service 규칙

```java
// getList: pageSize 포함 시 자동 페이징 지원
@Transactional(readOnly = true)
public List<XxxDto> getList(Map<String, Object> p) {
    if (p.containsKey("pageSize")) PageHelper.addPaging(p);
    return mapper.selectList(p);
}

// getPageData: PageHelper로 페이징
@Transactional(readOnly = true)
public PageResult<XxxDto> getPageData(Map<String, Object> p) {
    PageHelper.addPaging(p);
    return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
        PageHelper.getPageNo(), PageHelper.getPageSize(), p);
}

// FO 서비스: memberId는 SecurityUtil로 주입 후 mapper 전달
public List<XxxDto> getMyXxx(Map<String, Object> p) {
    p.put("memberId", SecurityUtil.currentUserId());
    return mapper.selectList(p);
}
```

### buildParam 금지

`buildParam()` 헬퍼 메서드 금지. Spring이 `@RequestParam Map<String, Object> p`로 모든 쿼리 파라미터를 자동 수집한다.

### Mapper XML 유연성

```xml
<!-- p에 없는 키는 WHERE 조건에서 자동 제외 -->
<where>
  <if test="siteId != null">AND site_id = #{siteId}</if>
  <if test="kw != null">AND (title LIKE '%'||#{kw}||'%')</if>
  <if test="dateStart != null">AND reg_date >= #{dateStart}</if>
</where>
```

### MyBatis SQL 테이블 별칭 정책 (PostgreSQL)

**문제**: PostgreSQL은 같은 컬럼명을 가진 여러 테이블 JOIN 시 "ambiguous column reference" 에러 발생.

**해결책**: 모든 SQL 컬럼 참조에 명시적 테이블 별칭 적용.

#### 테이블 별칭 규칙

| 테이블 | 별칭 | 예시 |
|--------|------|------|
| `sy_site` | `s` | `s.site_id`, `s.site_nm` |
| `sy_user` | `u` | `u.user_id`, `u.user_nm` |
| `ec_product` | `p` | `p.prod_id`, `p.prod_nm` |
| `ec_order` | `o` | `o.order_id`, `o.order_date` |
| `ec_member` | `m` | `m.member_id`, `m.member_nm` |

#### SQL 작성 표준

```xml
<!-- ✅ 올바른 패턴: 모든 컬럼에 별칭 명시 -->
<select id="selectById">
  SELECT /* domain :: Class :: selectById */
      p.prod_id, p.prod_nm, p.price, c.category_nm, s.site_nm
  FROM ec_product p
    LEFT JOIN ec_category c ON c.category_id = p.category_id
    LEFT JOIN sy_site s ON s.site_id = p.site_id
  WHERE p.prod_id = #{id}
</select>

<!-- ✅ SELECT * 사용 시 FROM 테이블 별칭 유지 -->
<select id="selectList">
  SELECT /* domain :: Class :: selectList */ p.*
  FROM ec_product p
  WHERE p.site_id = #{siteId}
</select>

<!-- ✅ COUNT(*) 대신 COUNT(테이블.*)로 명시 -->
<select id="selectPageCount" resultType="long">
  SELECT COUNT(p.*) /* domain :: Class :: selectPageCount */
  FROM ec_product p
</select>

<!-- ❌ 잘못된 패턴: 별칭 없음 / COUNT(a.*)로 잘못된 별칭 사용 -->
<!-- SELECT * FROM ec_product WHERE prod_id = ... -->
<!-- SELECT COUNT(a.*) FROM ec_product p -->
```

#### 주의사항

1. **주석 형식**: `/* domain.submodule :: ClassName :: methodName */` (PostgreSQL 파서 호환)
   - 잘못된 형식: `/**/, /**/` (제어 문자 포함 가능)

2. **SELECT \* 제한**: 가능하면 구체적 컬럼명 명시, 꼭 필요할 때만 `SELECT p.*` 사용

3. **JOIN ON 조건**: `ON 컬럼 = 값` 금지, 반드시 `ON 테이블.컬럼 = 테이블.컬럼` 형식

4. **동적 SQL 조각** (`<sql id="xxx">`): 포함된 쿼리도 별칭 필수 적용

5. **참조**: `_doc/정책서/sy/sy.55.mybatis쿼리테이블별칭정책.md`

---

## Vue 3 watch / computed 최소화 원칙 ⭐

**방침**: `watch`와 `computed`는 꼭 필요한 경우에만 사용한다. 가능하면 직접 함수 호출로 대체한다.

### watch() 허용 케이스만 사용

| 허용 | 예시 |
|---|---|
| `isAppReady` 감시 (앱 스토어 비동기 준비) | `watch(isAppReady, v => { if (v) fnLoadCodes(); })` |
| 외부 `props.*` 변경 감시 | `watch(() => props.dtlId, handleLoadDetail)` |
| UI 탭/뷰모드 window 영속화 | `watch(() => uiState.tab, v => { window._xxState.tab = v; })` |
| 에디터 초기화 등 복잡 사이드 이펙트 | Quill on/off 전환 |

```js
// ❌ 금지 — watch로 조회 트리거
watch(() => uiState.selectedPath, () => handleSearchList());

// ✅ 대체 — 이벤트 함수에서 직접 호출
const selectNode = (id) => { uiState.selectedPath = id; pager.pageNo = 1; handleSearchList(); };
```

### computed() 허용 케이스만 사용

| 허용 | 예시 |
|---|---|
| 여러 reactive 값에서 파생, 템플릿 반복 사용 | `cfIsNew`, `cfDetailEditId`, `cfTree` (트리 빌드) |
| 클라이언트 전체 로드 목록의 필터·페이징 | `cfFiltered`, `cfPageList`, `cfPageNums` |
| 앱 초기화 복합 조건 | `isAppReady` |

```js
// ❌ 불필요 — 단순 getter를 computed로 래핑
const cfSiteNm = computed(() => boUtil.getSiteNm());
const cfIsNew  = computed(() => !props.dtlId);

// ✅ 대체 — 일반 fn 함수 또는 템플릿 직접 표현식
const fnSiteNm = () => boUtil.getSiteNm();          // template: {{ fnSiteNm() }}
// template: <span v-if="!dtlId">신규</span>
```

---

## Vue 3 초기화 순서 (Composition API)

**핵심 원칙**: `ref()`, `reactive()`, `computed()` 선언은 반드시 `watch()`, `watchEffect()`보다 **먼저** 정의.

### 초기화 순서 표준

```js
// ✅ 올바른 순서
export default {
  props: ['...'],
  setup(props) {
    // 1️⃣ ref/reactive 선언 (가장 먼저)
    const cfSelectedCatId = ref(null);
    const form = reactive({ ... });
    
    // 2️⃣ computed 선언
    const cfFiltered = computed(() => {
      return items.value.filter(x => x.cat === cfSelectedCatId.value);
    });
    
    // 3️⃣ watch 선언 (ref/computed 이후)
    watch(() => cfSelectedCatId.value, async (newVal) => {
      // cfSelectedCatId는 이미 선언됨
    });
    
    // 4️⃣ onMounted 등 라이프사이클
    onMounted(() => {
      // 초기화
    });
    
    return { cfSelectedCatId, form, cfFiltered, ... };
  }
}

// ❌ 잘못된 순서: watch가 ref보다 먼저
watch(() => cfSelectedCatId.value, ...);  // ReferenceError!
const cfSelectedCatId = ref(null);        // 선언 위치가 뒤
```

### 일반적인 에러

```js
// ❌ ReferenceError: Cannot access 'cfSelectedCatId' before initialization
watch(() => cfSelectedCatId.value, async (newVal) => { ... }); // 라인 40
const cfSelectedCatId = ref(null);                              // 라인 154 (너무 늦음)

// ✅ 수정: ref 선언을 위로 이동
const cfSelectedCatId = ref(null);                              // 라인 31 (먼저)
watch(() => cfSelectedCatId.value, async (newVal) => { ... }); // 라인 40 (이후)
```

### 타입 힌트 (optional)

```js
// TypeScript 사용 시 타입 선언 권장
const cfSelectedCatId = ref<string | null>(null);
const cfPageList = computed<XxxDto[]>(() => [...]);
```

---

## 함수·변수 네이밍 규칙

Vue 3 Composition API 코드에서 역할을 이름만으로 즉시 파악할 수 있도록 **접두어 규칙**을 적용한다.

| 접두어 | 적용 대상 | 예시 |
|---|---|---|
| `on` | 이벤트 바인딩 함수 (`@click` 직결) | `onSearch`, `onReset`, `onSave`, `onDelete`, `onSizeChange` |
| `handle` | 이벤트 처리 로직 함수 | `handleSave`, `handleDelete`, `handleStatusChange` |
| `fn` | 독립 유틸 함수 (순수 함수) | `fnStatusBadge`, `fnFormatDate`, `fnPayBadge` |
| `cf` | `computed(() => ...)` 속성 | `cfFiltered`, `cfTotal`, `cfPageList`, `cfSiteNm`, `cfIsNew` |
| `sv` | Pinia store **state** | `svAuthUser`, `svCodes`, `svIsLoading` |
| `sg` | Pinia store **getters** | `sgIsLoggedIn`, `sgCurrentUser`, `sgGetCodesByGroup` |
| `sa` | Pinia store **actions** | `saSetAuth`, `saLogin`, `saFetchBoAppInitData` |
| `sf` | window 제공 함수 (store 외부 노출) | `sfGetBoSiteNm`, `sfGetUserNm` |

**금지 패턴**: `save()`, `doSave()`, `del()`, `doDelete()` → 반드시 `handleSave()`, `handleDelete()` 사용  
**예외**: Vue 라이프사이클(`onMounted` 등), 상수(`PAGE_SIZES`), 이미 `on*` 으로 명명된 함수  
**상세 규칙**: `_doc/정책서-sy/sy.54.네이밍규칙.md` 참조

---

## 작업 지침

### Vue 3 (프론트엔드)

1. **새 관리자 페이지 추가 3단계 누락 금지**: `bo.html` script 태그 + `AdminApp.js` PAGE_COMP_MAP + `app.component()`
2. **컴포넌트 태그는 `ec-*` / `sy-*` 프리픽스 필수** — 프리픽스 빼먹으면 렌더 안 됨
3. **`window.*` 전역 의존이 많음** — 모듈화 이전에 건드릴 때 주입 순서 주의
4. **`adminData` 직접 수정이 소스 오브 트루스** — 목업 변경하면 전 화면 즉시 반영
5. **Dtl 탭 구조 변경 시** 5개 뷰모드 + 영속화 + dtl-tab-card-title 헤더 패턴 유지
6. **Vue 3 Composition API 초기화 순서** — `ref()` → `computed()` → `watch()` → `onMounted()` 순서 엄격 준수
7. **Mng 목록 테이블 컬럼 표준** — 첫 번째 컬럼 반드시 `번호`, `<th>ID</th>` 단순 표시 컬럼 금지. ID는 Dtl 제목 우측에만 `#{{ form.xxxId }}` 표시
8. **CRUD 그리드 페이징 없음** — SyRole/SyBrand/SyBatch/SyDept/SyMenu/SyProp 등 전체 로드 방식은 하단 페이지네이션 UI 제거, `max-height:480px;overflow-y:auto` 스크롤 컨테이너 사용

### Spring Boot (백엔드)

7. **신규 Controller/Service** — 개별 String/int 파라미터 금지, `@RequestParam Map<String, Object> p` 패턴 사용
8. **MyBatis Mapper XML** — 모든 컬럼 참조에 테이블 별칭 명시 (PostgreSQL 모호성 제거)
9. **`./gradlew clean build` 필수** — 소스 Mapper XML 수정 후 반드시 clean 빌드 실행
   - 이유: Gradle 빌드 캐시가 `build/resources/main/mapper/` 디렉토리의 컴파일된 XML을 유지하므로, clean 없이 rebuild 시 구 버전 사용
   - 증상: 소스 파일은 수정되었으나 런타임 에러에 수정 전 쿼리가 표시됨
10. **SQL 주석 형식** — `/* domain.submodule :: ClassName :: methodName */` 권장, 이진 제어 문자 `0x01` 등 포함 금지

## UI/UX 정책

### 검색 방식 정책 ⭐ (2026-05-01 확정)

**검색 조건 변경은 클라이언트 filter를 실행하지 않는다.**  
반드시 **[조회] 버튼 클릭** 또는 **Enter 키** 입력 시에만 API를 호출한다.

```js
// ❌ 금지 — 입력 즉시 computed filter 반응
const cfFilteredRows = computed(() => rows.filter(r => r.name.includes(searchParam.kw)));

// ❌ 금지 — watch로 searchParam 변경 시 자동 조회
watch(() => searchParam.kw, () => handleSearchList());

// ✅ 올바른 패턴
const onSearch = async () => { pager.pageNo = 1; await handleSearchList(); };
// 입력 필드: @keyup.enter="onSearch"
// select 드롭다운: @change 없음 — 조회 버튼으로만
```

**예외 (클라이언트 filter 허용)**:
- CRUD 그리드 내 상위/하위 연동 필터 (예: 코드그룹 선택 → 코드목록)
- 모달 내 picker 검색 (즉시 좁히기 용도)
- FO 마이페이지 등 API 없는 로컬 데이터 화면

### 관리자 목록(Mng) 테이블 컬럼 표준

**번호 컬럼 규칙**:
- 목록 테이블의 **첫 번째 컬럼**은 반드시 `번호` (행 번호)
- 서버사이드 페이징 목록: `{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}`
- CRUD 그리드 (전체 로드): `{{ idx + 1 }}`
- `<th style="width:36px;text-align:center;">번호</th>` 고정 스타일

**ID 컬럼 노출 규칙**:
- 목록 테이블에서 `xxxId` 값을 단순 표시하는 `<th>ID</th>` / `<td>{{ x.xxxId }}</td>` 컬럼은 **제거**
- ID는 **상세(Dtl) 화면 제목 우측**에만 표시: `<span style="font-size:12px;color:#999;margin-left:8px;">#{{ form.xxxId }}</span>`
- 예외: 주문ID/클레임ID/배송ID 등 해당 ID 자체가 title-link(클릭으로 상세 진입)인 경우는 유지

```html
<!-- ✅ Mng 목록 thead 표준 -->
<thead><tr>
  <th style="width:36px;text-align:center;">번호</th>  <!-- 항상 첫 번째 -->
  <!-- ID 컬럼 없음 -->
  <th>이름/제목</th>
  ...
</tr></thead>

<!-- ✅ Dtl 상세 제목 표준 -->
<div class="page-title">
  {{ cfIsNew ? '등록' : '수정' }}
  <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.xxxId }}</span>
</div>
```

**CRUD 그리드 (SyRole/SyBrand/SyBatch/SyDept/SyMenu/SyProp 등)**:
- 하단 페이지네이션 UI 없음 — 전체 행을 스크롤 영역에 표시
- 테이블을 `<div style="max-height:480px;overflow-y:auto;">` 로 감쌈
- 빈 행의 colspan은 실제 컬럼 수와 일치 유지

### 알림 & 사용자 피드백

**원칙**: 시스템 alert/confirm 금지 → 디자인된 UI 모달 사용

| 유형 | 사용 함수 | 특징 |
|---|---|---|
| **정보성 메시지** | `showToast(msg, 'success')` | 우측 하단, 자동 닫힘 (3.5초) |
| **경고/오류** | `showToast(msg, 'error')` | 우측 하단, 수동 닫힘, 빨간 배경 |
| **사용자 확인 필요** | `showConfirm(title, msg)` → Promise | 모달, 확인/취소 버튼 |
| **로그인 필요** | `showToast('로그인이 필요합니다.', 'error')` | 접근 차단 시 사용 |

**금지 사항**:
- ❌ `window.alert()` — 시스템 alert 사용 금지
- ❌ `window.confirm()` — 시스템 confirm 사용 금지
- ❌ `console.log()` 대신 showToast 사용

**예시**:
```javascript
// ❌ 금지
if (!user) alert('로그인하세요');

// ✅ 올바른 방식
if (!user) {
  showToast('로그인이 필요합니다.', 'error');
  return;
}
```

## Spring Boot 빌드 & 배포

### Gradle 빌드 명령

```bash
# 전체 캐시 제거 + 새로 빌드 (필수 - Mapper XML 수정 후)
./gradlew clean build

# (권장 안 함) 캐시된 빌드 그대로 리빌드
./gradlew build
```

### 빌드 결과

- **소스 Mapper XML**: `src/main/resources/mapper/{domain}/{ClassName}Mapper.xml`
- **컴파일된 Mapper**: `build/resources/main/mapper/{domain}/{ClassName}Mapper.xml`
- **실행 JAR**: `build/libs/EcAdminApi-{version}.jar` (컴파일된 리소스 포함)

### 일반적인 함정

| 상황 | 증상 | 원인 | 해결 |
|------|------|------|------|
| Mapper XML 수정 | 런타임에 여전히 구 쿼리 실행 | `build/` 캐시 미정리 | `./gradlew clean build` |
| 주석 또는 제어문자 추가 | SAXParseException, XML 파싱 에러 | 이진 `0x01` 등 제어 문자 | 텍스트 편집기로 검증 후 제거 |
| SELECT * / COUNT(*) 명시화 | PostgreSQL "ambiguous column" | 테이블 별칭 누락 | 모든 컬럼에 `별칭.컬럼명` 적용 |

---

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

## MyBatis Mapper XML 수정 이력 (2026-04-16 ~ 2026-04-29)

### 문제 진단 및 해결

#### Phase 1-3: 별칭 정책 정립
- PostgreSQL "ambiguous column reference" 에러 분석
- 155개 EcAdminApi Mapper 파일 중 COUNT(a.*) 잘못된 별칭 사용 43개 파일 식별
- 각 파일의 FROM 절 테이블 별칭을 정확히 파악하여 COUNT(정확한_별칭.*) 수정

#### Phase 4: XML 파싱 에러 제거
- 3개 파일에서 이진 제어 문자 `0x01` 검출 및 제거
  - OdPayMapper.xml (byte 1406)
  - PdCategoryProdMapper.xml (byte 984)
  - StSettlePayMapper.xml (byte 1159)
- 2개 파일의 손상된 `/**/` 주석 패턴 정정
  - DpAreaPanelMapper.xml, DpPanelMapper.xml

#### Phase 5: SELECT * 명시화
- ZzSample0Mapper.xml, ZzSample1Mapper.xml, ZzSample2Mapper.xml
  - SELECT * → SELECT s.* (FROM 테이블별칭 s에 맞춰)
  - COUNT(*) → COUNT(s.*)

#### 최종 검증
- 155개 파일 모두 스캔 완료: 0개 COUNT(a.*) 잔존
- 0개 제어 문자 잔존
- 소스 파일 기준 완전 정정 완료

### 주의: 빌드 캐시

소스 Mapper XML 수정 완료 후 **반드시** `./gradlew clean build` 실행:
- 소스: `/src/main/resources/mapper/` (✅ 수정됨)
- 컴파일: `build/resources/main/mapper/` (⚠️ 캐시된 구 버전 존재)
- 실행: compiled JAR 사용 (캐시 미정리 시 구 쿼리 실행)

---

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

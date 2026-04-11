# ShopJoy v2.6.0406 - Project Guide

## 📋 프로젝트 개요
Vue.js 기반 풀스택 이커머스 플랫폼으로, 사용자 페이스(Front Office)와 관리자 페이스(Back Office)로 구성되어 있습니다.

### 프로젝트 구조
```
shopjoy_v260406/
├── base/                          # 핵심 앱 구성
│   ├── app.js                    # Vue 메인 앱 인스턴스 (테마, 라우팅, 장바구니, 인증)
│   ├── config.js                 # 전역 설정 (사이트정보, 메뉴, 카테고리, 상품, FAQ)
│   ├── shopjoyAuth.js            # 인증 로직
│   └── stores/                   # 상태 관리 (Pinia)
│       ├── authStore.js          # 인증 상태 (token, user, isLoggedIn)
│       └── myStore.js            # 사용자 정보 상태
├── pages/                         # Vue 페이지 컴포넌트
│   ├── Home.js                   # 홈페이지
│   ├── Products.js               # 상품 목록
│   ├── Detail.js                 # 상품 상세
│   ├── Cart.js                   # 장바구니
│   ├── Order.js                  # 주문
│   ├── Login.js                  # 로그인
│   ├── Contact.js                # 연락처
│   ├── Faq.js                    # FAQ
│   ├── Location.js               # 위치
│   ├── About.js                  # 소개
│   ├── my/                       # 마이페이지
│   │   ├── MyOrder.js            # 주문 관리
│   │   ├── MyClaim.js            # 클레임 관리
│   │   ├── MyChatt.js            # 채팅
│   │   ├── MyCoupon.js           # 쿠폰
│   │   ├── MyContact.js          # 문의
│   │   └── MyCache.js            # 캐시
│   └── admin/                    # 관리자 페이지
│       ├── AdminApp.js           # 관리자 메인 앱 (showToast, showConfirm, setApiRes, apiResPanel)
│       ├── AdminData.js          # 모의 데이터 및 헬퍼 메서드
│       ├── AdminModals.js        # 모달 관리
│       ├── ec/                   # 이커머스 관리 화면 (34 files)
│       │   ├── MemberMng/Dtl/Hist.js     # 회원
│       │   ├── ProdMng/Dtl/Hist.js       # 상품
│       │   ├── CategoryMng/Dtl.js        # 카테고리
│       │   ├── OrderMng/Dtl/Hist.js      # 주문
│       │   ├── DlivMng/Dtl/Hist.js       # 배송
│       │   ├── ClaimMng/Dtl/Hist.js      # 클레임
│       │   ├── CouponMng/Dtl.js          # 쿠폰
│       │   ├── EventMng/Dtl.js           # 이벤트
│       │   ├── CacheMng/Dtl.js           # 캐시
│       │   ├── ChattMng/Dtl.js           # 채팅
│       │   ├── NoticeMng/Dtl.js          # 공지
│       │   ├── CustInfoMng.js            # 고객종합정보
│       │   ├── DispPanelMng/Dtl.js       # 디스플레이 패널
│       │   ├── DispWidgetLibMng/Dtl.js   # 디스플레이 위젯 라이브러리
│       │   └── DispAreaPreview.js        # 디스플레이 영역 미리보기
│       └── sy/                   # 시스템 관리 화면 (27 files)
│           ├── DashboardMng.js           # 대시보드
│           ├── UserMng/Dtl.js            # 사용자(관리자 계정)
│           ├── RoleMng.js                # 권한
│           ├── MenuMng.js                # 메뉴
│           ├── SiteMng/Dtl.js            # 사이트
│           ├── VendorMng/Dtl.js          # 업체
│           ├── BrandMng.js               # 브랜드
│           ├── DeptMng.js                # 부서
│           ├── CodeMng/Dtl.js            # 코드
│           ├── ContactMng/Dtl.js         # 고객문의
│           ├── BbsMng/Dtl.js             # 게시판 글
│           ├── BbmMng/Dtl.js             # 게시판 관리
│           ├── AlarmMng/Dtl.js           # 알림
│           ├── TemplateMng/Dtl.js        # 템플릿
│           ├── BatchMng/Dtl/Hist.js      # 배치
│           └── AttachMng.js              # 첨부파일
├── layout/                        # 레이아웃 컴포넌트
│   ├── AppHeader.js              # 헤더
│   ├── AppFooter.js              # 푸터
│   ├── AppSidebar.js             # 사이드바
│   └── MyLayout.js               # 마이페이지 레이아웃
├── components/                    # 재사용 가능한 UI 컴포넌트
│   ├── modals/
│   │   └── BaseModal.js          # 기본 모달
│   ├── comn/
│   │   └── ComnComp.js           # 공통 컴포넌트 유틸
│   └── disp/
│       ├── DispArea.js           # 디스플레이 영역
│       ├── DispPanel.js          # 디스플레이 패널
│       └── DispWidget.js         # 디스플레이 위젯
├── api/                           # 모의 API 데이터 (JSON)
│   ├── base/
│   │   ├── users.json            # 사용자 데이터
│   │   └── site-config.json      # 사이트 설정
│   ├── products/
│   │   └── list.json             # 상품 목록
│   └── my/
│       ├── orders.json           # 주문 목록
│       ├── chats.json            # 채팅 데이터
│       ├── claims.json           # 클레임 데이터
│       ├── coupons.json          # 쿠폰 데이터
│       ├── cash.json             # 현금 데이터
│       ├── inquiries.json        # 문의 데이터
│       └── after-sales.json      # 애프터세일 데이터
├── utils/                         # 유틸리티 함수
│   ├── axiosUtil.js              # Axios 설정 (window.axiosApi)
│   ├── adminUtil.js              # 관리자 공통 유틸 (window.adminCommonFilter, window.adminApiCall)
│   └── cmUtil.js                 # 공통 유틸리티
├── assets/                        # 정적 자산
│   ├── css/
│   │   ├── fronOfficeStyle.css   # 사용자 페이스 스타일
│   │   ├── backOfficeStyle.css   # 관리자 페이스 스타일
│   │   └── vue-loading.css       # 로딩 스타일
│   └── cdn/
│       ├── axios.js              # Axios 라이브러리
│       └── yup.js                # Yup 유효성 검사 shim (로컬, CDN 불필요)
├── js/                            # JS 유틸 (js/index.js 등)
├── image/                         # 이미지 자산
├── _doc/                          # 문서 및 SQL
│   ├── ddl_pgsql/                # PostgreSQL DDL 스키마
│   └── sample_insert_pgsql/      # 테스트 데이터 INSERT 쿼리
├── index.html                     # 사용자 페이스 HTML
├── admin.html                     # 관리자 페이스 HTML
└── settings.json                  # 로컬 설정
```

## 🔐 핵심 기능

### 인증 (Authentication)
- **파일**: `base/shopjoyAuth.js`, `base/stores/authStore.js`
- 사용자 로그인/로그아웃
- 토큰 기반 인증 (localStorage: `shopjoy_token`, `shopjoy_user`)
- 권한 관리 (일반 사용자, 관리자)
- 마이페이지 접근 제어 (로그인 필요)

### 상태 관리 (State Management)
- `authStore.js` - 인증 정보 (Pinia)
- `myStore.js` - 사용자 정보, 주문, 장바구니 등 (Pinia)

### API 통신
- **파일**: `utils/axiosUtil.js`
- `window.axiosApi` - `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`
- 경로 자동 prefix: `api/`

### 관리자 기능 (ec/)
- 회원 관리 (MemberMng, MemberDtl, MemberHist)
- 상품 관리 (ProdMng, ProdDtl, ProdHist)
- 카테고리 관리 (CategoryMng, CategoryDtl)
- 주문 관리 (OrderMng, OrderDtl, OrderHist)
- 배송 관리 (DlivMng, DlivDtl, DlivHist)
- 클레임 관리 (ClaimMng, ClaimDtl, ClaimHist)
- 쿠폰 관리 (CouponMng, CouponDtl)
- 이벤트 관리 (EventMng, EventDtl)
- 캐시 관리 (CacheMng, CacheDtl)
- 채팅 관리 (ChattMng, ChattDtl)
- 공지 관리 (NoticeMng, NoticeDtl)
- 고객종합정보 (CustInfoMng)
- 디스플레이 관리 (DispPanelMng/Dtl, DispWidgetLibMng/Dtl, DispAreaPreview)

### 관리자 기능 (sy/)
- 대시보드 (DashboardMng)
- 사용자/권한/메뉴 (UserMng/Dtl, RoleMng, MenuMng)
- 사이트/업체/브랜드/부서 (SiteMng/Dtl, VendorMng/Dtl, BrandMng, DeptMng)
- 코드 관리 (CodeMng, CodeDtl)
- 고객문의 (ContactMng, ContactDtl)
- 게시판 (BbsMng/Dtl, BbmMng/Dtl)
- 알림/템플릿 (AlarmMng/Dtl, TemplateMng/Dtl)
- 배치 (BatchMng, BatchDtl, BatchHist)
- 첨부파일 (AttachMng)

## ⚙️ 개발 설정

### 로컬 설정 (settings.json)
```json
{
  "model": "sonnet",
  "MAX_THINIING_TOKENS": 10000,
  "CLAUDE_CODE_SUBAGETNT_MODEL": "haiku"
}
```

### 엔트리 포인트
- **사용자 페이스**: `index.html` + `base/app.js`
  - Daum 주소 API (카카오), js/index.js 포함
- **관리자 페이스**: `admin.html` + `pages/admin/AdminApp.js`
  - Quill 에디터(v1.3.7), yup.js 포함

## 📝 코딩 컨벤션

### 파일 및 폴더 네이밍
- 컴포넌트: PascalCase (예: `MemberDtl.js`)
- 유틸/스토어: camelCase (예: `axiosUtil.js`)
- 폴더: lowercase (예: `pages`, `components`, `utils`)

### Vue 컴포넌트 구조
- 각 페이지/컴포넌트는 독립적인 JavaScript 파일
- Pinia 사용한 상태 관리 (프론트)
- 관리자는 Vue reactive 직접 사용
- 컴포넌트 간 통신은 props, emit, 또는 store 활용

## 🚀 개발 가이드

### 새로운 페이지 추가
1. `pages/` 디렉토리에 새 컴포넌트 파일 생성
2. `base/config.js`에 라우트 등록
3. 필요시 `stores/`에 상태 추가

### 관리자 기능 추가
1. `pages/admin/ec/` 또는 `pages/admin/sy/`에 `*Mng.js`, `*Dtl.js` 생성
2. 필요시 `*Hist.js` 이력 컴포넌트 생성 (Dtl 하단에 별도 card로 임베드)
3. `AdminApp.js`에 컴포넌트 등록 및 라우트 추가 (v-else-if 목록)
4. `admin.html`에 script 태그 추가
5. `AdminData.js`에 데이터 로직 추가

### 관리자 컴포넌트 Props 규칙
- **Mng**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes']`
- **Dtl**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode']`
- **Hist**: `['navigate', 'adminData', 'showRefModal', 'showToast', '<entityId>']`
- Mng 파일 내에서 Dtl을 인라인 임베드할 때 `:show-confirm="showConfirm" :set-api-res="setApiRes"` 반드시 전달

### 관리자 저장/삭제 패턴
모든 [저장]/[삭제]는 `window.adminApiCall()` 사용:
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
  onLocal: () => { /* 로컬 데이터 즉시 반영 */ },
  navigate: props.navigate,          // 저장 후 이동 (삭제 시 생략)
  navigateTo: 'pageId',
});
```
- 성공: 자동 dismiss toast
- 오류: 시간제한 없는 persistent error toast + 우하단 API 응답 패널 자동 표시

### adminUtil.js 주요 기능
- `window.adminCommonFilter` - 공통 필터 상태 (site, vendor, adminUser, member, order)
- `window.adminApiCall()` - 확인→로컬반영→API→토스트 패턴
- 날짜 범위 프리셋 11종 (1day ~ all)
- `exportCsv()` - CSV 다운로드

### Yup 유효성 검사 패턴
```js
const errors = reactive({});
const schema = yup.object({
  fieldName: yup.string().required('메시지'),
});
// save() 시작부에:
Object.keys(errors).forEach(k => delete errors[k]);
try {
  await schema.validate(form, { abortEarly: false });
} catch (err) {
  err.inner.forEach(e => { errors[e.path] = e.message; });
  props.showToast('입력 내용을 확인해주세요.', 'error');
  return;
}
```

### API 연동
1. `window.axiosApi` (axiosUtil.js) - `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`
2. `window.adminApiCall` (adminUtil.js) - 확인→로컬반영→API→토스트 패턴
3. `window.yup` (assets/cdn/yup.js) - 로컬 shim, CDN 불필요

## 📦 주요 라이브러리
- **Vue.js 3** - UI 프레임워크 (CDN global build, `const { ref, reactive, computed } = Vue`)
- **Pinia** - 상태 관리 (프론트 전용, CDN)
- **Axios** - HTTP 클라이언트 (`assets/cdn/axios.js`, `window.axiosApi` 래퍼)
- **Yup** - 유효성 검사 (`assets/cdn/yup.js` 로컬 shim, `window.yup`)
- **Quill** - 리치 텍스트 에디터 (CDN v1.3.7, 관리자 전용)
- **Daum 주소 API** - 카카오 주소 검색 (프론트 전용)

## 🔗 중요한 파일
| 파일 | 역할 |
|------|------|
| `base/app.js` | Vue 앱 초기화 (테마, 라우팅, 장바구니, 인증) |
| `base/config.js` | 전역 설정 및 라우트 |
| `base/shopjoyAuth.js` | 인증 로직 |
| `utils/axiosUtil.js` | API 통신 (`window.axiosApi`) |
| `utils/adminUtil.js` | 관리자 유틸 (`window.adminCommonFilter`, `window.adminApiCall`) |
| `assets/cdn/yup.js` | Yup 로컬 shim (`window.yup`) |
| `base/stores/authStore.js` | 인증 상태 관리 (Pinia) |
| `base/stores/myStore.js` | 사용자 상태 관리 (Pinia) |
| `pages/admin/AdminApp.js` | 관리자 메인 진입점 (showToast/showConfirm/setApiRes/apiResPanel) |
| `pages/admin/AdminData.js` | 관리자 모의 데이터 및 헬퍼 메서드 |
| `assets/css/backOfficeStyle.css` | 관리자 스타일 (is-invalid, field-error, form-actions 등) |

## 🌳 Git 및 배포

### Git 관리
- **Repository**: GitHub (`main` branch)
- **주요 branches**:
  - `main` - 프로덕션 버전

### 배포 프로세스
Live Server로 `index.html`, `admin.html` 실행 (빌드 단계 없음, CDN 기반 SPA)

### 배포 관련 폴더
- `_doc/ddl_pgsql/` - PostgreSQL 데이터베이스 스키마 (테이블별 DDL)
- `_doc/sample_insert_pgsql/` - 테스트 데이터 INSERT 쿼리

---

**마지막 업데이트**: 2026-04-11 (프로젝트 구조 현행화: ec/sy 모듈 전체 목록, components/disp 구조, adminCommonFilter, viewMode prop, ddl_pgsql 경로 등)

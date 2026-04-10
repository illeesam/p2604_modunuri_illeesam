# ShopJoy v2.6.0406 - Project Guide

## 📋 프로젝트 개요
Vue.js 기반 풀스택 이커머스 플랫폼으로, 사용자 페이스(Front Office)와 관리자 페이스(Back Office)로 구성되어 있습니다.

### 프로젝트 구조
```
shopjoy_v260406/
├── base/                          # 핵심 앱 구성
│   ├── app.js                    # Vue 메인 앱 인스턴스
│   ├── config.js                 # 전역 설정
│   ├── shopjoyAuth.js            # 인증 로직
│   └── stores/                   # 상태 관리 (Pinia/Vuex)
│       ├── authStore.js          # 인증 상태
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
│       ├── AdminData.js          # 데이터 관리
│       ├── AdminModals.js        # 모달 관리
│       ├── ec/                   # 이커머스 관리 화면
│       │   ├── *Mng.js           # 목록 (MemberMng, ProdMng, OrderMng 등)
│       │   ├── *Dtl.js           # 상세/등록 (MemberDtl, ProdDtl 등)
│       │   └── *Hist.js          # 이력 컴포넌트 (MemberHist, OrderHist 등)
│       └── sy/                   # 시스템 관리 화면
│           ├── *Mng.js           # 목록
│           └── *Dtl.js           # 상세/등록
├── layout/                        # 레이아웃 컴포넌트
│   ├── AppHeader.js              # 헤더
│   ├── AppFooter.js              # 푸터
│   ├── AppSidebar.js             # 사이드바
│   └── MyLayout.js               # 마이페이지 레이아웃
├── components/                    # 재사용 가능한 UI 컴포넌트
│   ├── modals/
│   │   └── BaseModal.js          # 기본 모달
│   ├── panels/
│   │   └── DispPanel.js          # 디스플레이 패널
│   └── widgets/
│       └── DispWidget.js         # 디스플레이 위젯
├── api/                           # 모의 API 데이터
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
│   ├── axiosUtil.js              # Axios 설정 및 요청/응답 인터셉터 (window.axiosApi)
│   ├── adminUtil.js              # 관리자 공통 유틸 (window.adminUtil, window.adminApiCall)
│   └── cmUtil.js                 # 공통 유틸리티
├── assets/                        # 정적 자산
│   ├── css/
│   │   ├── fronOfficeStyle.css   # 사용자 페이스 스타일
│   │   ├── backOfficeStyle.css   # 관리자 페이스 스타일
│   │   └── vue-loading.css       # 로딩 스타일
│   └── cdn/
│       ├── axios.js              # Axios 라이브러리
│       └── yup.js                # Yup 유효성 검사 shim (로컬, CDN 불필요)
├── index.html                     # 사용자 페이스 HTML
├── admin.html                     # 관리자 페이스 HTML
└── settings.json                  # 로컬 설정
```

## 🔐 핵심 기능

### 인증 (Authentication)
- **파일**: `base/shopjoyAuth.js`, `base/stores/authStore.js`
- 사용자 로그인/로그아웃
- 토큰 기반 인증
- 권한 관리 (일반 사용자, 관리자)

### 상태 관리 (State Management)
- `authStore.js` - 인증 정보
- `myStore.js` - 사용자 정보, 주문, 장바구니 등

### API 통신
- **파일**: `utils/axiosUtil.js`
- REST API 요청 처리
- 요청/응답 인터셉터
- 에러 처리

### 관리자 기능
- 회원 관리 (MemberMng, MemberDtl, MemberHist)
- 상품 관리 (ProdMng, ProdDtl, ProdHist)
- 주문 관리 (OrderMng, OrderDtl, OrderHist)
- 배송 관리 (DlivMng, DlivDtl, DlivHist)
- 클레임 관리 (ClaimMng, ClaimDtl, ClaimHist)
- 쿠폰 관리 (CouponMng, CouponDtl)
- 이벤트 관리 (EventMng, EventDtl)
- 채팅/고객지원 (ChattMng, ChattDtl, ContactMng, ContactDtl)
- 캐시 관리 (CacheMng, CacheDtl)
- 디스플레이 관리 (DispMng, DispDtl)
- 카테고리/공지/알림/게시판/배치/사용자 등 sy/ 모듈

## ⚙️ 개발 설정

### 로컬 설정 (settings.json)
```json
{
  "model": "sonnet",                    // Claude 모델 설정
  "MAX_THINIING_TOKENS": 10000,         // 최대 thinking 토큰
  "CLAUDE_CODE_SUBAGETNT_MODEL": "haiku" // 서브에이전트 모델
}
```

### 엔트리 포인트
- **사용자 페이스**: `index.html` + `base/app.js`
- **관리자 페이스**: `admin.html` + `pages/admin/AdminApp.js`

## 📝 코딩 컨벤션

### 파일 및 폴더 네이밍
- 컴포넌트: PascalCase (예: `ProductDetail.js`)
- 유틸/스토어: camelCase (예: `axiosUtil.js`)
- 폴더: lowercase (예: `pages`, `components`, `utils`)

### Vue 컴포넌트 구조
- 각 페이지/컴포넌트는 독립적인 JavaScript 파일
- Pinia 또는 Vuex를 사용한 상태 관리
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
- **Dtl**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId']`
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
- **Axios** - HTTP 클라이언트 (`assets/cdn/axios.js`, `window.axiosApi` 래퍼)
- **Yup** - 유효성 검사 (`assets/cdn/yup.js` 로컬 shim, `window.yup`)
- **Quill** - 리치 텍스트 에디터 (CDN)

## 🔗 중요한 파일
| 파일 | 역할 |
|------|------|
| `base/app.js` | Vue 앱 초기화 |
| `base/config.js` | 전역 설정 및 라우트 |
| `base/shopjoyAuth.js` | 인증 로직 |
| `utils/axiosUtil.js` | API 통신 (`window.axiosApi`) |
| `utils/adminUtil.js` | 관리자 유틸 (`window.adminUtil`, `window.adminApiCall`) |
| `assets/cdn/yup.js` | Yup 로컬 shim (`window.yup`) |
| `base/stores/authStore.js` | 인증 상태 관리 |
| `base/stores/myStore.js` | 사용자 상태 관리 |
| `pages/admin/AdminApp.js` | 관리자 메인 진입점 (showToast/showConfirm/setApiRes/apiResPanel) |
| `pages/admin/AdminData.js` | 관리자 모의 데이터 및 헬퍼 메서드 |
| `assets/css/backOfficeStyle.css` | 관리자 스타일 (is-invalid, field-error, form-actions 등) |

## 🌳 Git 및 배포

### Git 관리
- **Repository**: GitHub (`master` branch에 자동 푸시)
- **주요 branches**:
  - `master` - 프로덕션 버전
  - `develop` - 개발 버전
  - `feature/*` - 기능 개발 브랜치

### 배포 프로세스

#### 1️⃣ 개발 환경 배포
```bash
# 로컬 개발 서버 실행
npm run dev

# 또는 Live Server로 index.html, admin.html 실행
```

#### 2️⃣ 스테이징 배포
```bash
# develop 브랜치에서 빌드
npm run build:staging

# 번들된 파일:
# - dist/frontend/ (사용자 페이스)
# - dist/admin/ (관리자 페이스)
```

#### 3️⃣ 프로덕션 배포
```bash
# master 브랜치에서 빌드
npm run build:production

# 수동 배포:
# 1. dist/ 폴더의 파일을 프로덕션 서버로 전송
# 2. 웹 서버 설정 확인 (SPA 라우팅)
# 3. 헬스 체크: https://shopjoy.example.com (또는 현재 도메인)
```

#### 4️⃣ 자동 배포 (CI/CD)
- **GitHub Actions 워크플로우**:
  1. `master` 브랜치에 푸시
  2. 테스트 실행
  3. 빌드 생성
  4. 프로덕션 서버로 자동 배포

### 배포 체크리스트
- [ ] 모든 기능 테스트 완료
- [ ] 성능 최적화 확인 (번들 사이즈, 로딩 시간)
- [ ] 브라우저 호환성 검증 (Chrome, Firefox, Safari, Edge)
- [ ] 모바일 반응형 테스트
- [ ] 보안 검사 (XSS, CSRF, 민감 정보 노출)
- [ ] 데이터베이스 마이그레이션 준비
- [ ] API 엔드포인트 동작 확인
- [ ] 에러 로깅 및 모니터링 설정
- [ ] 롤백 계획 수립

### 환경 변수 설정
각 배포 환경별로 `.env` 파일 설정:
```env
# 개발 환경
VITE_API_BASE=http://localhost:3000/api
VITE_ENV=development

# 스테이징
VITE_API_BASE=https://staging-api.shopjoy.example.com
VITE_ENV=staging

# 프로덕션
VITE_API_BASE=https://api.shopjoy.example.com
VITE_ENV=production
```

### 배포 관련 폴더
- `_doc/deployment/` - 배포 가이드 및 스크립트
- `_doc/ddl/` - 데이터베이스 스키마 (테이블별 DDL)
- `_doc/sample_insert/` - 테스트 데이터 INSERT 쿼리

---

**마지막 업데이트**: 2026-04-10 (API 통합, Hist 분리, Yup shim, adminApiCall 패턴 추가)

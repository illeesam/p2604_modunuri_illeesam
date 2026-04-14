# assets/cdn/pkg — 로컬 라이브러리 관리

<!--
  ═════════════════════════════════════════════════════════════════════════
  외부 CDN 의존을 제거하고 **버전 고정된 로컬 복사본**을 관리합니다.

  구조:
    <pkg>/<version>/<file>              공식 라이브러리 배포본
    <pkg>/<version>.shim/<file>         프로젝트 로컬 구현 (shim)
                                         ※ 예: yup/1.0.0.shim/
    <pkg>/<version>.build/<file>        프로젝트 빌드 결과물
                                         ※ 예: tailwind/3.4.19.build/

  왜 CDN이 아니라 로컬인가?
    ✓ 외부 CDN 장애에도 서비스 정상 작동
    ✓ 버전 드리프트 방지 (`@3` 같은 범위 지정은 예고 없이 변함)
    ✓ 기업/기관 방화벽 차단 환경에서도 접근 가능
    ✓ 오프라인/폐쇄망 배포 가능
    ✓ CORS 이슈 차단
  ═════════════════════════════════════════════════════════════════════════
-->

## 📁 폴더 구조 (정리 완료 · 중복 제거)

```
assets/cdn/pkg/
│
├── README.md                         ← 이 문서
│
├── vue/3.4.21/
│   └── vue.global.prod.js            ● 147KB  Vue 3 프로덕션 런타임
│
├── vue-demi/0.14.10/
│   └── vue-demi.iife.js              ●   4KB  Pinia가 참조하는 Vue 호환 레이어
│
├── pinia/2.1.7/
│   └── pinia.iife.js                 ●  83KB  상태관리 (사용자 페이스만)
│
├── axios/1.7.9/
│   └── axios.min.js                  ●  54KB  공식 axios UMD
│
├── yup/1.0.0.shim/
│   └── yup.js                        ●  수 KB  로컬 shim (Yup v1.x는 UMD 미제공)
│
├── quill/1.3.7/
│   ├── quill.min.js                  ● 216KB  리치텍스트 에디터 (admin)
│   └── quill.snow.css                ●  25KB
│
├── postcode/2/
│   └── postcode.v2.js                ●  35KB  Kakao 우편번호
│
├── marked/11.1.1/
│   └── marked.min.js                 ●  35KB  Markdown → HTML 파서
│
├── jsbarcode/3.11.6/
│   └── JsBarcode.all.min.js          ●  61KB  바코드 생성 (admin)
│
├── qrcodejs/1.0.0/
│   └── qrcode.min.js                 ●  20KB  QR 코드 생성 (admin)
│
└── tailwind/3.4.19.build/
    └── tailwind.min.css              ●  빌드 결과물 (`.build` 접미사로 생성물 표시)
```

<!--
  ────────────────────────────────────────────────────────────────────
  중복/미사용 제거 이력
  ────────────────────────────────────────────────────────────────────
  - quill/2.0.2/     : admin은 1.3.7만 사용 → 2.0.2 제거
  - marked/marked.min.js : 버전 폴더 없는 파일 잔재 → 제거
  - mermaid/         : 3.3MB 이고 미사용 → 제거
  ────────────────────────────────────────────────────────────────────
-->

---

## 📦 라이브러리별 상세 정보

### Vue 3 · `vue/3.4.21/vue.global.prod.js`

<!-- 전체 프로젝트의 핵심 UI 프레임워크. 런타임 템플릿 컴파일러 포함 프로덕션 빌드. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js` |
| 로드 위치 | `index.html`, `admin.html`, `disp-ui.html` |
| 사용 코드 | `const { ref, reactive, computed } = Vue;` |

### vue-demi · `vue-demi/0.14.10/vue-demi.iife.js`

<!-- Pinia가 내부적으로 참조하는 Vue 호환 shim. Pinia 로드 전 필수. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://unpkg.com/vue-demi@0.14.10/lib/index.iife.js` |
| 로드 위치 | `index.html`만 (Pinia 의존성) |

### Pinia · `pinia/2.1.7/pinia.iife.js`

<!-- Vue 3 공식 상태관리. 사용자 페이스에서 인증/마이페이지 스토어. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://unpkg.com/pinia@2.1.7/dist/pinia.iife.js` |
| 로드 위치 | `index.html`만 |
| 사용 파일 | `base/stores/authStore.js`, `base/stores/myStore.js` |

### axios · `axios/1.7.9/axios.min.js` (공식)

<!-- 공식 axios UMD. 인터셉터·취소·진행률 등 표준 기능 모두 사용 가능. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/axios.min.js` |
| 로드 위치 | `index.html`, `disp-ui.html` |
| 사용 파일 | `utils/axiosUtil.js` → `window.axiosApi` 제공 |
| 사용 예시 | `window.axiosApi.get('my/orders.json')` |

### Yup shim · `yup/1.0.0.shim/yup.js` ⚠️

<!-- Yup v1.x는 ESM 전용이라 브라우저 UMD 미제공 → 로컬 shim으로 대체.
     번들러(Vite) 도입 시 공식 yup@1.x로 전환. -->

| 항목 | 내용 |
|---|---|
| 원본 | 없음 (로컬 구현) |
| 로드 위치 | `admin.html`, `disp-ui.html` |
| 지원 | `.required()`, `.min/max()`, `.oneOf()`, `.test()`, `.email()`, `.when()`, `.object({})`, `.array()` |
| ⚠️ 미지원 | `.matches(regex)` — 별도 regex 검증으로 대체 |
| 사용 위치 | `pages/admin/**/*Dtl.js` 저장 로직 (폼 유효성 검사) |

### Quill · `quill/1.3.7/`

<!-- 관리자 WYSIWYG 리치텍스트 에디터. 1.3.7은 검증된 안정 버전.
     admin 상세 화면의 메모/본문 입력에 사용. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://cdn.quilljs.com/1.3.7/{quill.min.js, quill.snow.css}` |
| 로드 위치 | `admin.html`만 |
| 사용 파일 | CouponDtl, DispPanelDtl, DispWidgetDtl, DispWidgetLibDtl, DlivDtl, EventDtl, MemberDtl, NoticeDtl, OrderDtl, ClaimDtl 등 |

### Kakao 우편번호 · `postcode/2/postcode.v2.js`

<!-- Kakao 내부 API를 자주 변경하므로 분기 1회 재다운로드 권장.
     폐쇄망 아니면 원본 CDN 유지도 고려. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js` |
| 로드 위치 | `index.html` |
| 사용 파일 | `components/modals/BaseModal.js`, `pages/Order.js`, `layout/AppHeader.js`, `pages/admin/sy/UserDtl.js` |
| ⚠️ 주의 | Kakao 내부 API 변경 잦음 — **분기 1회 재다운로드** |

### marked · `marked/11.1.1/marked.min.js`

<!-- Markdown → HTML 파싱. DispX04Widget의 markdown 위젯에서 사용. -->

| 항목 | 내용 |
|---|---|
| 원본 | `https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.umd.min.js` |
| 로드 위치 | `index.html`, `admin.html`, `disp-ui.html` |
| 사용 파일 | `components/disp/DispX04Widget.js:61` |

### JsBarcode · `jsbarcode/3.11.6/JsBarcode.all.min.js`

| 항목 | 내용 |
|---|---|
| 원본 | `https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js` |
| 로드 위치 | `admin.html` |
| 사용 파일 | `components/disp/barcode/BarcodeWidget.js` |

### qrcode.js · `qrcodejs/1.0.0/qrcode.min.js`

| 항목 | 내용 |
|---|---|
| 원본 | `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js` |
| 로드 위치 | `admin.html` |

---

## 🎨 Tailwind CSS — 빌드 시스템

<!--
  ─────────────────────────────────────────────────────────────────────────
  Tailwind는 "사용된 유틸리티 클래스만 추려 CSS를 생성"하는 JIT 방식.
  따라서 반드시 **빌드 단계**가 필요하며, 빌드 결과물만 브라우저에 서빙.
  ─────────────────────────────────────────────────────────────────────────
-->

### 파일 구성과 역할

| 파일 | 위치 | 읽는 주체 | 배포? | 목적 |
|---|---|:-:|:-:|---|
| `tailwind.config.js` | 프로젝트 루트 | Node.js (빌드 도구) | ❌ | 스캔 경로·색상 팔레트 설정 |
| `postcss.config.js` | 프로젝트 루트 | PostCSS (빌드 도구) | ❌ | Tailwind + autoprefixer 연결 |
| `package.json` | 프로젝트 루트 | npm | ❌ | devDependencies + 빌드 스크립트 |
| `package-lock.json` | 프로젝트 루트 | npm | ❌ (선택적 커밋) | 의존성 정확한 버전 고정 |
| `src/tailwind.css` | `src/` | Tailwind CLI | ❌ | 빌드 입력 (`@tailwind base/components/utilities`) |
| `node_modules/` | 프로젝트 루트 | Node.js | ❌ **절대 배포 금지** | 의존 패키지 저장소 |
| **`assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css`** | `assets/css/` | **브라우저** | ✅ | **빌드 결과물. 유일한 배포 대상** |

**요점**: `*.config.js`, `package*.json`, `src/`, `node_modules/`는 **모두 개발 PC에서만 사용**. 서버에는 `tailwind.min.css`만 올라갑니다.

### 빌드 명령

```bash
# 최초 1회 — 의존성 설치 (Node.js 필요)
npm install

# 개발 중 — watch 모드 (HTML/JS 변경 감지 → 자동 CSS 재빌드)
npm run dev

# 배포 전 — 최종 minify 빌드
npm run build

# npx로 직접 실행 (package.json 스크립트 없이도 가능)
npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --minify
```

### 빌드 주기

| 시점 | 명령 | 설명 |
|---|---|---|
| **최초 세팅** | `npm install` | Node 의존성 설치. `node_modules/` 생성 (300+ MB 가능) |
| **개발 작업 시작** | `npm run dev` | watch 모드 켜고 작업. 파일 저장 시마다 ~1초 내 재빌드 |
| **HTML/JS 변경 후** | (watch 모드가 자동 처리) | 수동 빌드 불필요 |
| **Git 커밋 직전** | `npm run build` | 압축된 최종 CSS 반영 |
| **배포 전** | `npm run build` | 반드시 minify 적용 |

### 빌드 파이프라인

```
[개발 PC — Node.js]
  npm run build (= npx tailwindcss -i ... -o ... --minify)
        │
        ▼
  tailwind.config.js 읽음 → content 배열의 파일들 스캔
        │
        ▼
  사용된 Tailwind 클래스 수집 (예: px-4, bg-brand-pink 등)
        │
        ▼
  postcss.config.js 적용 → autoprefixer로 벤더 프리픽스 추가
        │
        ▼
  --minify 옵션 적용 → 압축
        │
        ▼
  assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css 출력 (약 20~30KB)
        │
        │ (배포 · git push · 서버 업로드)
        ▼
[브라우저]
  <link rel="stylesheet" href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
  ※ tailwind.config.js 등 빌드 도구 파일은 전혀 읽지 않음
```

### 각 설정 파일의 목적 (상세)

#### `package.json` — 의존성·스크립트 정의

<!-- npm이 읽는 매니페스트. 빌드 시에만 필요하고 브라우저는 무관. -->

- `devDependencies`: 개발 중에만 필요한 패키지 (tailwindcss, autoprefixer, postcss)
- `scripts`: `npm run <name>`으로 실행할 명령 정의 (dev, build 등)
- **배포 시 제외**: 서버에 올릴 필요 없음

#### `package-lock.json` — 의존성 버전 잠금

<!-- npm install 시 자동 생성. 팀원/CI 간 동일 버전 보장. -->

- `npm install` 실행 시 자동 생성
- 각 패키지의 **정확한 버전 + 해시** 기록 → 재현성 보장
- 권장: **Git에 커밋** (팀/배포 환경 동일 버전 확보)
- 배포 시에는 서버에 올릴 필요 없음

#### `tailwind.config.js` — Tailwind 동작 설정

<!-- Tailwind가 "어디를 스캔할지" + "브랜드 색상/폰트" 등 확장 설정. -->

- `content`: 스캔 대상 파일 경로 배열 (사용된 유틸리티 추출)
- `theme.extend`: 기본 Tailwind에 추가할 색상·폰트·간격 등
  - 예: `brand.pink`, `brand.mint` 같은 프로젝트 전용 색상
- **배포 시 제외**: 빌드 도구 전용

#### `postcss.config.js` — PostCSS 플러그인 체인

<!-- Tailwind가 내부적으로 호출하는 PostCSS에 플러그인을 추가 연결. -->

- `tailwindcss`: Tailwind 유틸리티 생성
- `autoprefixer`: 구형 브라우저 호환 벤더 프리픽스 자동 추가
- **배포 시 제외**: 빌드 도구 전용

#### `src/tailwind.css` — 빌드 입력 소스

<!-- Tailwind CLI가 이 파일을 읽어 base/components/utilities 3계층 CSS 생성. -->

- 최소 내용: `@tailwind base; @tailwind components; @tailwind utilities;`
- 추가로 `@layer components { ... }`로 공통 컴포넌트 `@apply` 정의 가능
- **배포 시 제외**: 빌드 결과물만 배포

---

## 📥 다운로드 스크립트 (최초 세팅)

### Windows (PowerShell)

```powershell
cd assets\cdn\pkg

New-Item -ItemType Directory -Force vue\3.4.21, vue-demi\0.14.10, pinia\2.1.7, `
  axios\1.7.9, quill\1.3.7, postcode\2, marked\11.1.1, jsbarcode\3.11.6, qrcodejs\1.0.0

Invoke-WebRequest "https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js"            -OutFile "vue\3.4.21\vue.global.prod.js"
Invoke-WebRequest "https://unpkg.com/vue-demi@0.14.10/lib/index.iife.js"            -OutFile "vue-demi\0.14.10\vue-demi.iife.js"
Invoke-WebRequest "https://unpkg.com/pinia@2.1.7/dist/pinia.iife.js"                -OutFile "pinia\2.1.7\pinia.iife.js"
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/axios.min.js"      -OutFile "axios\1.7.9\axios.min.js"
Invoke-WebRequest "https://cdn.quilljs.com/1.3.7/quill.min.js"                      -OutFile "quill\1.3.7\quill.min.js"
Invoke-WebRequest "https://cdn.quilljs.com/1.3.7/quill.snow.css"                    -OutFile "quill\1.3.7\quill.snow.css"
Invoke-WebRequest "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" -OutFile "postcode\2\postcode.v2.js"
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.umd.min.js" -OutFile "marked\11.1.1\marked.min.js"
Invoke-WebRequest "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" -OutFile "jsbarcode\3.11.6\JsBarcode.all.min.js"
Invoke-WebRequest "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" -OutFile "qrcodejs\1.0.0\qrcode.min.js"
```

### macOS / Linux (bash)

```bash
cd assets/cdn/pkg

mkdir -p vue/3.4.21 vue-demi/0.14.10 pinia/2.1.7 axios/1.7.9 \
         quill/1.3.7 postcode/2 marked/11.1.1 jsbarcode/3.11.6 qrcodejs/1.0.0

curl -Lo vue/3.4.21/vue.global.prod.js             https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js
curl -Lo vue-demi/0.14.10/vue-demi.iife.js         https://unpkg.com/vue-demi@0.14.10/lib/index.iife.js
curl -Lo pinia/2.1.7/pinia.iife.js                 https://unpkg.com/pinia@2.1.7/dist/pinia.iife.js
curl -Lo axios/1.7.9/axios.min.js                  https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/axios.min.js
curl -Lo quill/1.3.7/quill.min.js                  https://cdn.quilljs.com/1.3.7/quill.min.js
curl -Lo quill/1.3.7/quill.snow.css                https://cdn.quilljs.com/1.3.7/quill.snow.css
curl -Lo postcode/2/postcode.v2.js                 https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js
curl -Lo marked/11.1.1/marked.min.js               https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.umd.min.js
curl -Lo jsbarcode/3.11.6/JsBarcode.all.min.js     https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js
curl -Lo qrcodejs/1.0.0/qrcode.min.js              https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
```

---

## 🌐 진입점별 로드 목록

### `index.html` (사용자 페이스)

```html
<!-- head -->
<link rel="stylesheet" href="assets/css/frontOfficeStyle0N.css">
<link rel="stylesheet" href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
<script src="assets/cdn/pkg/vue/3.4.21/vue.global.prod.js"></script>
<script src="assets/cdn/pkg/vue-demi/0.14.10/vue-demi.iife.js"></script>
<script src="assets/cdn/pkg/pinia/2.1.7/pinia.iife.js"></script>
<script src="assets/cdn/pkg/postcode/2/postcode.v2.js"></script>

<!-- body -->
<script src="assets/cdn/pkg/marked/11.1.1/marked.min.js"></script>
<script src="assets/cdn/pkg/axios/1.7.9/axios.min.js"></script>
```

### `admin.html` (관리자)

```html
<!-- head -->
<script src="assets/cdn/pkg/vue/3.4.21/vue.global.prod.js"></script>
<script src="assets/cdn/pkg/yup/1.0.0.shim/yup.js"></script>
<link rel="stylesheet" href="assets/cdn/pkg/quill/1.3.7/quill.snow.css">
<script src="assets/cdn/pkg/quill/1.3.7/quill.min.js"></script>
<script src="assets/cdn/pkg/marked/11.1.1/marked.min.js"></script>
<script src="assets/cdn/pkg/jsbarcode/3.11.6/JsBarcode.all.min.js"></script>
<script src="assets/cdn/pkg/qrcodejs/1.0.0/qrcode.min.js"></script>
<link rel="stylesheet" href="assets/css/backOfficeStyle.css">
<link rel="stylesheet" href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
```

### `disp-ui.html` (전시 UI 미리보기)

```html
<!-- head -->
<script src="assets/cdn/pkg/vue/3.4.21/vue.global.prod.js"></script>
<script src="assets/cdn/pkg/marked/11.1.1/marked.min.js"></script>
<script src="assets/cdn/pkg/axios/1.7.9/axios.min.js"></script>
<script src="assets/cdn/pkg/yup/1.0.0.shim/yup.js"></script>
<link rel="stylesheet" href="assets/css/backOfficeStyle.css">
<link rel="stylesheet" href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
```

---

## 🔄 업데이트 주기 권장

| 라이브러리 | 주기 | 이유 |
|---|---|---|
| **Vue / Pinia** | 메이저 릴리스 시 | 안정성 우선. 파괴적 변경 주의 |
| **Kakao 우편번호** | **분기 1회** | 내부 API 변경 잦음. 장애 시 원본 CDN으로 즉시 교체 가능 |
| **Quill** | 보안 패치 시 | CVE 알림 확인. 1.x → 2.x는 API 변경 큼 |
| **axios** | 마이너 이상 | 보안 패치 빠르게 적용 |
| **yup shim** | 필요 시 | 지원 메서드 확장 시 버전 올려 수정 |
| **marked / jsbarcode / qrcodejs** | 메이저 시 | 신기능 필요 시만 |
| **Tailwind** | 메이저 시 | 3.x → 4.x 마이그레이션 주의 |

---

## ⚠️ 주의사항

1. **경로 대소문자**: Windows는 관대하지만 Linux 서버는 엄격. 소문자 사용 통일.
2. **폴더 커밋**: 이 `pkg/` 폴더는 **Git 커밋 대상**. `node_modules/`와 달리 소스의 일부.
3. **`node_modules/` 절대 커밋 금지**: `.gitignore`에 포함됨.
4. **배포 시 제외 대상**:
   - `node_modules/`, `src/tailwind.css`
   - `tailwind.config.js`, `postcss.config.js`
   - `package.json`, `package-lock.json`, `.gitignore`

---

## 🔗 관련 문서

- 프로젝트 전체: `/CLAUDE.md`
- 빌드 스크립트: `/package.json`
- Tailwind 설정: `/tailwind.config.js`
- PostCSS 설정: `/postcss.config.js`
- Tailwind 입력: `/src/tailwind.css`

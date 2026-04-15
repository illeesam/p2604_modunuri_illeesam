# Tailwind CSS 가이드

ShopJoy 프로젝트의 Tailwind CSS 구성, 빌드, 운영, 확장 전반을 설명합니다.

---

## 1. 왜 Tailwind를 쓰는가

**유틸리티-퍼스트 CSS 프레임워크.** 미리 정의된 `bg-red-500`, `p-4`, `flex`, `rounded-lg` 같은 짧은 클래스를 HTML에 직접 조합해 디자인을 구현합니다.

**도입 이유:**
- **전역 CSS 파일 축소**: `adminGlobalStyle0N.css`, `frontGlobalStyle0N.css` 같은 테마 CSS를 줄여 유지보수 부담 감소
- **클래스 이름 고민 제거**: `.card`, `.btn-primary` 등 이름 짓기·중복·충돌 문제 해소
- **미사용 CSS 자동 제거**: JIT(Just-In-Time) 모드가 프로젝트에서 **실제 사용된 클래스만** 빌드에 포함 → 최종 CSS 수십 KB
- **일관성**: 팔레트/간격/폰트 사이즈를 설정에서 정의 → 임의의 픽셀 값 남발 방지

**이 프로젝트에서의 역할:**
- **공존 기반**: 기존 `(admin|front)GlobalStyle*.css`, 인라인 `style=""`와 함께 사용 가능
- **점진 이관**: 신규 컴포넌트·부분 리팩토링 때부터 Tailwind 도입, 기존은 유지

---

## 2. 파일 구조

| 파일 | 역할 | 읽는 주체 |
|---|---|---|
| `package.json` | devDependencies + `npm run dev/build` 스크립트 정의 | npm |
| `tailwind.config.js` | 스캔 대상(`content`) · 테마 색상/폰트 확장 · 플러그인 | Tailwind CLI (Node.js) |
| `postcss.config.js` | PostCSS 플러그인 (Tailwind + autoprefixer) | Tailwind CLI (Node.js) |
| `src/tailwind.css` | **빌드 입력**. `@tailwind base/components/utilities` 3개 지시어 | Tailwind CLI |
| `assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css` | **빌드 출력**. `<link>`로 브라우저 로드 | 브라우저 |
| `node_modules/` | npm 의존성 설치 결과물 | Tailwind CLI |

**중요:**
- `package.json` / `tailwind.config.js` / `postcss.config.js` / `src/tailwind.css`는 **개발 PC의 Node.js 빌드 도구가 읽는 파일**. 브라우저는 존재조차 모릅니다.
- 배포 시 **`node_modules/`, `src/`, 설정 파일들은 서버에 올리지 않음**. `tailwind.min.css` 한 파일만 브라우저로 서빙.

```
프로젝트 루트/
├─ package.json              ← Tailwind CLI 의존성 + 스크립트
├─ tailwind.config.js        ← 테마·content 경로 설정
├─ postcss.config.js         ← PostCSS 플러그인
├─ src/
│  └─ tailwind.css           ← 빌드 입력 (3줄 + @layer 확장)
├─ assets/cdn/pkg/tailwind/3.4.19.build/
│  └─ tailwind.min.css       ← 빌드 출력 (브라우저 로드)
├─ node_modules/             ← .gitignore (배포 제외)
└─ index.html · admin.html · ... · pages/*.js · layout/*.js (유틸 클래스 사용처)
```

---

## 3. 빌드 시스템

### 3.1 최초 1회 세팅

```bash
npm install                    # package.json 의 devDependencies 설치
```

### 3.2 개발 중 (watch 모드)

```bash
npm run dev
# 내부적으로:
# npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --watch
```
- 파일 저장 시 **자동 재빌드** (수 ms ~ 수백 ms)
- VS Code에서 Live Server와 함께 실행 → 브라우저 즉시 반영

### 3.3 배포 전 최종 빌드

```bash
npm run build
# 내부적으로:
# npx tailwindcss -i src/tailwind.css -o assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css --minify
```
- `--minify` 플래그로 압축 출력
- 결과 파일을 서버에 배포

### 3.4 빌드 파이프라인

```
[개발 PC · Node.js]
  ┌─────────────────────────────────────┐
  │ npx tailwindcss -i src/tailwind.css │
  │   -o ...tailwind.min.css --minify   │
  └─────────────────────────────────────┘
       │ 1. tailwind.config.js 로드 → content 경로 확인
       │ 2. content 파일 스캔 → 사용된 class 수집
       │ 3. postcss.config.js 로드 → plugins 적용
       │ 4. autoprefixer가 벤더 프리픽스 추가
       │ 5. minify 후 tailwind.min.css 출력
       ▼
[브라우저]
  <link rel="stylesheet"
        href="assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css">
  ← 오직 이 한 줄만 요청. 설정 파일들은 요청조차 안 함.
```

---

## 4. 언제 다시 빌드해야 하는가

| 상황 | 재빌드 |
|---|---|
| HTML/JS/Vue 템플릿에 **새 Tailwind 클래스** 사용 (`class="mt-8 grid-cols-5"` 등) | ✅ 필요 |
| `tailwind.config.js` 수정 (색상 추가, content 경로 변경 등) | ✅ 필요 |
| `src/tailwind.css` 수정 (`@layer components`, `@apply` 커스텀) | ✅ 필요 |
| 플러그인 설치/변경 (`@tailwindcss/forms` 등) | ✅ 필요 |
| 기존 클래스 재사용 (이미 `tailwind.min.css`에 포함됨) | ❌ 불필요 |
| JS 로직 변경, API 호출, 컴포넌트 이름 변경 | ❌ 불필요 |
| 기존 `frontGlobalStyle*.css` / `adminGlobalStyle*.css`만 수정 | ❌ 불필요 (별도 CSS) |

**운영 규칙:**
- **개발 중**: `npm run dev` watch 항상 켜두면 자동
- **배포 직전**: `npm run build` 1회 필수 → 결과물 커밋 → 배포

---

## 5. 안 하면 어떻게 되는가

### 5.1 빌드 누락 시 증상

- **새 클래스 무시됨**: `class="bg-sky-500"` 추가해도 CSS 규칙이 없어 스타일 미적용 → 기본 색상으로 보임
- **서버에 구 버전 배포**: 개발 PC에선 watch로 동작하는데 `tailwind.min.css` 가 구 버전이면 **배포 사이트에서 스타일 깨짐**
- **CI 빌드 생략**: 파이프라인에 `npm run build` 없으면 로컬 빌드와 배포본이 어긋남

### 5.2 Play CDN을 쓰면 안 되는 이유

Tailwind 공식 "Play CDN" (`<script src="https://cdn.tailwindcss.com">`)은 **개발용**입니다.
- 브라우저에서 **3MB+ JS**를 받아 런타임에 CSS 생성
- 매 요청마다 반복 → 첫 렌더 수백 ms 지연
- **프로덕션 사용 금지**. CLI 빌드만 사용.

---

## 6. 자동화 방법

### 6.1 로컬 개발: watch 모드 (가장 실용적)

```bash
npm run dev
```
터미널 한 개를 이 명령에 항상 할당. 저장 시마다 자동 재빌드.

### 6.2 VS Code: 폴더 오픈 시 자동 실행

`.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [{
    "label": "tailwind:watch",
    "type": "npm",
    "script": "dev",
    "runOptions": { "runOn": "folderOpen" },
    "isBackground": true,
    "presentation": { "reveal": "silent" }
  }]
}
```
VS Code로 프로젝트 폴더 열면 background에서 watch 자동 실행.

### 6.3 Git pre-commit hook (husky)

`.husky/pre-commit`:
```bash
#!/bin/sh
npm run build && git add assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css
```
커밋 직전 빌드 + 결과물 자동 스테이징.

```bash
# 최초 설정
npx husky-init && npm install
# 위 내용을 .husky/pre-commit 에 추가
```

### 6.4 GitHub Actions CI

`.github/workflows/tailwind.yml`:
```yaml
name: Build Tailwind
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: |
          git config user.email "ci@bot"
          git config user.name "CI"
          git add assets/cdn/pkg/tailwind/3.4.19.build/tailwind.min.css
          git diff --cached --quiet || git commit -m "chore: rebuild tailwind"
          git push
```

### 6.5 netlify/vercel 빌드 명령

```
build command : npm run build
publish dir   : .
```

---

## 7. tailwind.config.js 커스텀

### 7.1 content (스캔 경로)

```js
content: [
  './index.html',
  './admin.html',
  './disp-front-ui.html',
  './disp-admin-ui.html',
  './base/**/*.js',
  './layout/**/*.js',
  './pages/**/*.js',
  './components/**/*.js',
  './utils/**/*.js',
],
```
- 이 경로 밖 파일에서 Tailwind 클래스를 쓰면 **빌드에 포함되지 않음**
- 동적으로 클래스를 조립하는 경우(`class="bg-${color}-500"`)도 추출 실패 → **전체 클래스 문자열**로 쓸 것

### 7.2 theme.extend.colors (브랜드 색상)

현재 등록된 커스텀 색상:
```js
brand: {
  pink:        '#e8587a',
  'pink-dark': '#d64669',
  'pink-light':'#fff0f4',
  mint:        '#4a9b7e',
  'mint-dark': '#2e7d6b',
  'mint-light':'#e0f2ec',
},
```
**사용 예:**
```html
<button class="bg-brand-pink hover:bg-brand-pink-dark text-white px-4 py-2 rounded">저장</button>
<div class="bg-brand-mint-light text-brand-mint-dark">민트 배경</div>
```

### 7.3 확장 팁

**폰트 추가:**
```js
fontFamily: {
  sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

**섀도우:**
```js
boxShadow: {
  'brand-pink': '0 2px 6px rgba(232,88,122,.22)',
  card:         '0 1px 4px rgba(0,0,0,.08)',
}
```

**애니메이션:**
```js
keyframes: { wiggle: { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } } },
animation: { wiggle: 'wiggle 1s ease-in-out infinite' },
```

---

## 8. src/tailwind.css 확장

### 8.1 현재 구조

```css
@tailwind base;        /* CSS 리셋 + normalize */
@tailwind components;  /* 컴포넌트 레이어 */
@tailwind utilities;   /* bg-red-500 같은 유틸 클래스들 */
```
이 3줄만 있으면 동작.

### 8.2 공통 컴포넌트 정의 (`@layer components` + `@apply`)

여러 곳에서 반복되는 Tailwind 조합을 **CSS 클래스로 묶어** 재사용:

```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-md bg-brand-pink text-white font-semibold
           shadow hover:bg-brand-pink-dark transition-colors;
  }
  .card-soft {
    @apply bg-white border border-gray-200 rounded-xl shadow-sm p-5;
  }
}
```

그럼 템플릿에서:
```html
<button class="btn-primary">저장</button>
<div class="card-soft">...</div>
```

### 8.3 base 확장 (전역 리셋/변수)

```css
@layer base {
  :root {
    --accent: #e8587a;
  }
  body {
    @apply font-sans text-gray-800 bg-gray-50;
  }
}
```

### 8.4 순수 CSS도 혼용 가능

`src/tailwind.css`는 PostCSS로 빌드되므로 일반 CSS 규칙도 작성 가능:
```css
.custom-gradient {
  background: linear-gradient(135deg, #e8587a, #d14165);
}
```

---

## 9. 자주 쓰는 Tailwind 유틸리티 Cheat Sheet

### 9.1 레이아웃
| Tailwind | CSS |
|---|---|
| `flex items-center gap-2` | `display:flex; align-items:center; gap:0.5rem` |
| `grid grid-cols-4 gap-3` | `display:grid; grid-template-columns:repeat(4,1fr); gap:0.75rem` |
| `hidden md:block` | 모바일 숨김, md(768px) 이상 block |
| `fixed inset-0 z-50` | `position:fixed; top/right/bottom/left:0; z-index:50` |

### 9.2 여백/크기
| Tailwind | CSS |
|---|---|
| `p-4` / `px-3 py-2` | `padding: 1rem` / `padding: 0.5rem 0.75rem` |
| `m-2` / `mt-4 mb-1` | `margin: 0.5rem` / `margin-top: 1rem; margin-bottom: 0.25rem` |
| `w-full h-screen` | `width:100%; height:100vh` |
| `max-w-lg` | `max-width: 32rem` (미리 정의된 스케일) |

### 9.3 텍스트/색상
| Tailwind | 설명 |
|---|---|
| `text-sm font-semibold` | `font-size:0.875rem; font-weight:600` |
| `text-brand-pink` | 커스텀 브랜드 색상 |
| `bg-gray-100 text-gray-700` | 회색 배경 + 짙은 회색 텍스트 |
| `text-center truncate` | 가운데 정렬 + 말줄임표 |

### 9.4 테두리/그림자/라운드
| Tailwind | CSS |
|---|---|
| `border border-gray-200` | `border:1px solid #e5e7eb` |
| `rounded-lg` | `border-radius: 0.5rem` |
| `shadow-md hover:shadow-lg` | 중간 그림자, hover 시 크게 |

### 9.5 상호작용
| Tailwind | 설명 |
|---|---|
| `hover:bg-gray-50` | hover 시 배경 변경 |
| `focus:ring-2 focus:ring-brand-pink` | focus 시 외곽선 |
| `disabled:opacity-50 disabled:cursor-not-allowed` | disabled 상태 |
| `transition-colors duration-200` | 색상 전환 애니메이션 |

---

## 10. 배포 체크리스트

배포 전 **반드시**:

1. ✅ `npm run build` 실행 → `tailwind.min.css` 최신화
2. ✅ 결과물 `git add` + commit
3. ✅ 서버에 **`node_modules/`, `src/`, `*.config.js`, `package*.json` 업로드 제외**
4. ✅ HTML에 `<link rel="stylesheet" href="...tailwind.min.css">` 정상 포함 확인
5. ✅ 브라우저 개발자도구 Network 탭에서 200 OK 확인

### 배포 제외 대상 (`.gitignore` 또는 배포 스크립트)

```
node_modules/             ← npm install로 재생성
src/                      ← 빌드 입력, 출력만 배포
tailwind.config.js        ← 빌드 도구용
postcss.config.js         ← 빌드 도구용
package.json              ← npm 관리용
package-lock.json         ← npm 관리용
```

단, **프로젝트 저장소 자체에는** 설정 파일들을 commit해둠 (Git에는 포함, 서버 배포만 제외).

---

## 11. 자주 만나는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 클래스가 적용 안 됨 | `content` 경로 누락 | `tailwind.config.js`의 content 배열 확인 + 재빌드 |
| 빌드 후에도 변경 안 됨 | watch 모드 미실행 | `npm run dev` 실행 중인지 확인 |
| 동적 클래스 무시됨 | `class="bg-${color}-500"` 같은 템플릿 리터럴 | **전체 클래스 문자열**로 작성 or `safelist` 추가 |
| `@tailwind` 지시어 오류 | src/tailwind.css 손상 | 파일 복구 또는 재생성 |
| 배포 후 Tailwind 안 보임 | `--minify` 빌드 누락 / 경로 오타 | `npm run build` 후 서버 CSS 경로 점검 |
| 빌드 파일이 너무 큼 | content 경로에 외부 라이브러리 포함 | `assets/cdn/pkg/**` 등은 content에서 제외 |
| 커스텀 색상 인식 실패 | `tailwind.config.js` 수정 후 빌드 안 함 | 설정 변경 시 **무조건 재빌드** |

### 11.1 safelist 예시

템플릿에서 동적 클래스 조립이 필요한 경우:
```js
// tailwind.config.js
module.exports = {
  safelist: [
    'bg-red-500', 'bg-blue-500', 'bg-green-500',
    { pattern: /^text-(red|blue|green)-(400|500|600)$/ },
  ],
  content: [ ... ],
}
```

---

## 12. 점진 이관 전략 (기존 CSS → Tailwind)

### 12.1 단계별 접근

**Phase 1: 공존 (현재 단계)**
- 기존 `adminGlobalStyle*.css`, `frontGlobalStyle*.css` 유지
- 신규 컴포넌트부터 Tailwind 유틸 클래스 사용
- 두 방식 혼용 허용

**Phase 2: 공통 primitive 이관**
- `.btn*`, `.badge*`, `.card`, `.form-control` 같은 공통 클래스를
  `src/tailwind.css` 내 `@layer components`로 재작성 (`@apply` 사용)
- 기존 CSS에서 해당 규칙 삭제
- HTML/JS 템플릿은 **변경 불필요** (같은 class 이름 유지)

**Phase 3: 인라인 style 축소**
- 수천 줄의 `style="..."` 를 Tailwind 유틸로 치환
- 예: `style="padding:14px;margin-bottom:12px;"` → `class="p-3.5 mb-3"`
- 정규식으로 일부 자동 치환 가능

**Phase 4: 테마 시스템 정리**
- 사이트별 CSS 변수 (`--accent` 등)를 Tailwind plugin으로 대체
- `data-site="01|02|03"` 속성 기반 조건부 테마 (`[data-site="02"]:bg-brand-mint`)

### 12.2 검증 방법

각 단계 종료 시:
1. 브라우저 3개 사이트(01/02/03) 모두 시각 비교
2. 관리자 + 사용자 + disp 3개 진입점 확인
3. 모바일/데스크톱 반응형 확인
4. Network 탭에서 CSS 파일 크기 비교 (감소 추이 기록)

---

## 13. 참고 링크

- Tailwind 공식 문서: https://tailwindcss.com/docs
- 유틸리티 검색: https://tailwindcss.com/docs/utility-first
- 플레이그라운드: https://play.tailwindcss.com
- 설정 리퍼런스: https://tailwindcss.com/docs/configuration

---

## 14. 핵심 요약

> **"한 번 세팅하고, 저장할 때마다 watch가 빌드, 배포 전엔 `npm run build` 1번"**

- 빌드 입력 = `src/tailwind.css` (3줄 + @layer)
- 빌드 출력 = `tailwind.min.css` (브라우저 로드)
- 테마 확장 = `tailwind.config.js`
- 자동화 = `npm run dev` watch + VS Code tasks + husky pre-commit

변경사항 있을 때마다 **재빌드 필요 여부**만 판단하면 됩니다.

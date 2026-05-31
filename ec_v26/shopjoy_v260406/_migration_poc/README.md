# Migration POC — CmNoticeMng 변환 비교

원본 `pages/bo/ec/cm/CmNoticeMng.js` (BO Mng 표준 참조 모델)을
**Vue 3 + Vite SFC** / **React** 로 각각 변환한 체험판.

> 기존 코드는 일절 수정하지 않음. 이 폴더는 독립적인 POC.

---

## 파일 구조

```
_migration_poc/
├── README.md                      ← 이 파일
├── vue3-sfc/
│   └── CmNoticeMng.vue            ← Vue 3 SFC (<script setup>)
└── react/
    └── CmNoticeMng.jsx            ← React (hooks + JSX)
```

---

## 1. 매핑 테이블 — 원본 vs Vue SFC vs React

| 현재 (CDN + window.*) | Vue 3 + Vite SFC | React |
|---|---|---|
| `const { reactive } = Vue` | `import { reactive } from 'vue'` | `useState()` / `useReducer()` |
| `const { computed } = Vue` | `import { computed } from 'vue'` | `useMemo()` |
| `const { onMounted } = Vue` | `import { onMounted } from 'vue'` | `useEffect(() => {}, [])` |
| `const { watch } = Vue` | `import { watch } from 'vue'` | `useEffect(() => {}, [dep])` |
| `window.CmNoticeMng = { template: \`...\` }` | `<template>` + `<script setup>` SFC | `export default function CmNoticeMng()` + JSX |
| `window.boApiSvc.cmNotice` | `import { cmNotice } from '@/services/boApiSvc'` | `import { cmNotice } from '@/services/boApiSvc'` |
| `window.boApp.showToast()` | `import { useBoApp } from '@/composables/useBoApp'` | `import { useBoApp } from '@/hooks/useBoApp'` |
| `coUtil.cofGrid()` | `import { useGrid } from '@/composables/useGrid'` | `function useGrid()` custom hook |
| `coUtil.cofDetail()` | `import { useDetail } from '@/composables/useDetail'` | `function useDetail()` custom hook |
| `coUtil.cofExportCsv()` | `import { exportCsv } from '@/utils/coUtil'` | `import { exportCsv } from '@/utils/coUtil'` |
| `window.sfGetBoCodeStore()` | `import { useBoCodeStore } from '@/stores/boCodeStore'` | `import { useBoCodeStore } from '@/stores/boCodeStore'` |
| `app.component('CmNoticeMng', ...)` | 자동 (Vite auto-import 또는 수동 import) | 자동 (import) |
| `bo.html <script>` 로드 순서 | Vite 번들러가 의존성 자동 해결 | 번들러가 의존성 자동 해결 |
| `v-if="cond"` | `v-if="cond"` (동일) | `{cond && <Comp />}` |
| `v-for="x in list"` | `v-for="x in list"` (동일) | `{list.map(x => <Comp key={x.id} />)}` |
| `@click="fn"` | `@click="fn"` (동일) | `onClick={fn}` |
| `:prop="val"` | `:prop="val"` (동일) | `prop={val}` |
| `<slot name="x">` | `<slot name="x">` (동일) | children / render props |
| `props: { navigate: { type: Function } }` | `defineProps({ navigate: Function })` | `function Comp({ navigate })` |
| `<style>` in adminGlobalStyle.css | `<style scoped>` SFC 블록 | CSS Modules / Tailwind / styled |

---

## 2. 아키텍처 비교

### 현재 (CDN Runtime)

```
bo.html
  ├── <script src="utils/coUtil.js">          → window.coUtil
  ├── <script src="services/boApiSvc.js">     → window.boApiSvc
  ├── <script src="pages/bo/.../CmNoticeMng.js"> → window.CmNoticeMng
  └── base/boApp.js: app.component('CmNoticeMng', window.CmNoticeMng)
```

- 장점: 빌드 없음, 브라우저에서 바로 실행, Live Server로 즉시 확인
- 단점: window.* 전역 오염, 로드 순서 수동 관리, HMR 없음, 트리쉐이킹 불가

### Vue 3 + Vite SFC

```
src/
  ├── components/    BoGrid.vue, BoSearchArea.vue, BoFormArea.vue ...
  ├── composables/   useGrid.ts, useDetail.ts, useBoApp.ts ...
  ├── services/      boApiSvc.ts
  ├── stores/        boCodeStore.ts (Pinia)
  └── pages/bo/ec/cm/
       ├── CmNoticeMng.vue   ← SFC
       └── CmNoticeDtl.vue   ← SFC
```

- 장점: HMR, TypeScript, Scoped CSS, 트리쉐이킹, 빌드 최적화
- 단점: 빌드 스텝 필요, 기존 190+ 파일 마이그레이션 작업량
- **마이그레이션 난이도**: ★★☆ (낮음) — Composition API 구조가 거의 동일

### React

```
src/
  ├── components/    BoGrid.tsx, BoSearchArea.tsx, BoFormArea.tsx ...
  ├── hooks/         useGrid.ts, useDetail.ts, useBoApp.ts ...
  ├── services/      boApiSvc.ts
  ├── stores/        boCodeStore.ts (Zustand/Jotai)
  └── pages/bo/ec/cm/
       ├── CmNoticeMng.jsx
       └── CmNoticeDtl.jsx
```

- 장점: 생태계 크기, TypeScript 완벽 지원, 다양한 상태관리 선택지
- 단점: reactive → useState 변환 비용, template → JSX 전면 재작성
- **마이그레이션 난이도**: ★★★★ (높음) — 템플릿 전면 JSX 변환 + 상태 관리 패턴 전면 변경

---

## 3. 핵심 변환 패턴 상세

### 3-A. 상태 관리

```js
// ── 현재 (Vue CDN) ──
const notices = reactive([]);
notices.splice(0, notices.length, ...list);

// ── Vue SFC ── (동일)
const notices = reactive([]);
notices.splice(0, notices.length, ...list);

// ── React ── (불변 패턴 필수)
const [notices, setNotices] = useState([]);
setNotices(list);  // 새 배열 참조
```

> React는 **불변 업데이트**가 원칙. Vue의 `reactive()` 뮤터블 패턴과 근본적으로 다름.
> 이 차이가 190개 파일 전체에 파급 — 단순 치환이 아닌 로직 리팩터링 필요.

### 3-B. 컴포넌트 등록

```js
// ── 현재 ──
// bo.html: <script src="CmNoticeMng.js">
// boApp.js: app.component('CmNoticeMng', window.CmNoticeMng)
// template: <cm-notice-mng :navigate="navigate" />

// ── Vue SFC ──
import CmNoticeMng from './CmNoticeMng.vue'  // 자동 등록

// ── React ──
import CmNoticeMng from './CmNoticeMng'      // 그냥 import
```

### 3-C. cofGrid / cofDetail → Custom Hook

```js
// ── 현재 ──
const baseGrid = coUtil.cofGrid(() => handleSearchList(), { pageSize: 5 });

// ── Vue SFC ── (composable)
const baseGrid = useGrid(() => handleSearchList(), { pageSize: 5 });

// ── React ── (custom hook — 내부는 완전히 다름)
const grid = useGrid(() => handleSearchList(), { pageSize: 5 });
// grid.pager는 useState → setPager로 업데이트
// handleSearchList 안에서 grid.pager.pageNo 읽을 때 클로저 주의
```

### 3-D. 템플릿 vs JSX

```html
<!-- 현재 + Vue SFC -->
<bo-grid :columns="baseGridColumns" :rows="notices" :pager="baseGrid.pager"
  @sort="key => handleSelectAction('notices-sort', key)">
  <template #toolbar-actions>
    <button @click="handleBtnAction('notices-add')">+ 신규</button>
  </template>
</bo-grid>
```

```jsx
// React — 슬롯 → render props 또는 children
<BoGrid
  columns={baseGridColumns}
  rows={notices}
  pager={grid.pager}
  onSort={(key) => handleSelectAction('notices-sort', key)}
  toolbarActions={
    <button onClick={() => handleBtnAction('notices-add')}>+ 신규</button>
  }
/>
```

---

## 4. 마이그레이션 공수 추정 (190+ 파일 기준)

| 항목 | Vue SFC | React |
|---|---|---|
| **빌드 환경 세팅** | Vite + vue-router + Pinia (1일) | Vite/Next + react-router + Zustand (1일) |
| **공통 컴포넌트** (BoGrid/BoSearchArea/BoFormArea/BoModal 등 12개) | 그대로 SFC 변환 (3일) | JSX 재작성 (7일) |
| **유틸/서비스** (coUtil/boUtil/foUtil/apiSvc 6개) | import 변환만 (0.5일) | 동일 (0.5일) |
| **페이지 파일** (Mng/Dtl/Hist 190개) | 기계적 변환 가능 (5일) | 템플릿 + 상태 전면 재작성 (15일) |
| **Pinia 스토어** (4개) | 거의 동일 (0.5일) | Zustand/Jotai 재작성 (1일) |
| **CSS** | scoped 이관 (1일) | CSS Modules 또는 Tailwind (2일) |
| **테스트 + 검증** | 3일 | 5일 |
| **합계** | **~14일** | **~31일** |

### 결론

- **Vue SFC 전환**이 압도적으로 유리 — Composition API 로직이 거의 100% 재사용
- React는 **template → JSX**, **reactive → useState 불변**, **slot → render props** 3중 변환 필요
- 현재 구조의 `coUtil.cofGrid()` / `cofDetail()` 캡슐화가 잘 되어 있어 composable/hook 변환은 양쪽 모두 깨끗

---

## 5. 실행 방법

이 POC는 **코드 구조 비교용**이며 단독 실행은 불가합니다.
실제 실행하려면:

### Vue SFC
```bash
npm create vite@latest shopjoy-admin -- --template vue
# src/ 아래에 CmNoticeMng.vue 배치
# BoGrid/BoSearchArea 등 공통 컴포넌트 구현 필요
npm run dev
```

### React
```bash
npm create vite@latest shopjoy-admin -- --template react
# src/ 아래에 CmNoticeMng.jsx 배치
# BoGrid/SearchArea 등 공통 컴포넌트 구현 필요
npm run dev
```

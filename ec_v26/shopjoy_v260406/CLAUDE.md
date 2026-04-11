# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 실행 방법

빌드 도구나 npm이 없는 **순수 HTML/JS 프로젝트**입니다. VS Code Live Server로 실행합니다.

- **사용자 페이스**: `index.html` → `http://127.0.0.1:5502/ec_v26/shopjoy_v260406/index.html`
- **관리자 페이스**: `admin.html` → `http://127.0.0.1:5502/ec_v26/shopjoy_v260406/admin.html`

테스트 프레임워크 없음. 브라우저 콘솔에서 직접 확인.

## 아키텍처 핵심

### 기술 스택

- **Vue 3** CDN global build (`vue.global.prod.js`) — `const { ref, reactive, computed } = Vue`
- **Pinia** CDN — 사용자 페이스 전용 (관리자 페이스는 Pinia 미사용)
- **axios** — `assets/cdn/axios.js` → `window.axiosApi` 래퍼 (경로는 `api/` 기준 상대경로)
- **Yup** — `assets/cdn/yup.js` 로컬 shim (`window.yup`), CDN 불필요
- **Quill** — 관리자 리치텍스트 에디터 (CDN, admin.html에만 로드)

### 글로벌 네임스페이스 (`window.*`)

모든 컴포넌트는 `window.*`로 등록되고 소비됩니다.

| 객체 | 파일 | 역할 |
|------|------|------|
| `window.SITE_CONFIG` | `base/config.js` | 상품 데이터, 메뉴, FAQ 등 사용자 페이스 전체 설정 |
| `window.adminData` | `pages/admin/AdminData.js` | 관리자 목업 데이터 전체 (displays, members, products 등) |
| `window.adminCommonFilter` | `utils/adminUtil.js` | 관리자 공통 필터 reactive 상태 (사이트/업체/회원/주문) |
| `window.axiosApi` | `utils/axiosUtil.js` | axios 래퍼. 경로는 `api/` 기준 상대경로로 변환 |
| `window.adminApiCall` | `utils/adminUtil.js` | 확인→낙관적업데이트→API→토스트 표준 패턴 |
| `window.adminUtil` | `utils/adminUtil.js` | `DATE_RANGE_OPTIONS`, `getDateRange`, `isInRange`, `exportCsv` |
| `window.yup` | `assets/cdn/yup.js` | 유효성 검사 shim |
| `window.shopjoyAuth` | `base/shopjoyAuth.js` | 인증 init/logout/state |

### 스크립트 로딩 순서 (중요)

**`admin.html`** 로드 순서가 의존성을 결정합니다:
1. Vue CDN, Yup, Quill
2. `AdminData.js` — `window.adminData` 초기화
3. `adminUtil.js` — `window.adminCommonFilter`가 AdminData를 참조하므로 반드시 이후
4. 컴포넌트들 (`*Mng.js`, `*Dtl.js`, `*Hist.js` 등)
5. `AdminApp.js` — 마지막으로 Vue 앱 마운트

**새 컴포넌트 추가 시 반드시**: `admin.html`에 `<script>` 태그 추가 + `AdminApp.js`의 `PAGE_COMP_MAP`과 `.component()` 등록.

### 라우팅

**사용자 페이스**: 해시 기반 (`#page=products&pid=2`). `base/app.js`의 `navigate(pageId)` 함수로 이동.  
**관리자 페이스**: `AdminApp.js`의 탭 시스템. `openTabs` reactive 배열로 멀티탭 관리. `navigate(pageId, { editId })` 패턴. `PAGE_COMP_MAP`으로 pageId → kebab-case 컴포넌트명 매핑.

### 관리자 데이터 흐름

```
AdminData.js (window.adminData)
  └─ AdminApp.js → :admin-data="adminData" prop으로 모든 자식에 전달
       └─ *Mng.js / *Dtl.js — props.adminData.displays / .members / .products 등 직접 접근
```

`AdminData.js`의 목업 데이터를 직접 수정하면 모든 관리자 화면에 즉시 반영됩니다.

## 관리자 컴포넌트 규칙

### Props

- **Mng**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes']`
- **Dtl**: `['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes', 'editId']`
- **Hist**: `['navigate', 'adminData', 'showRefModal', 'showToast', '<entityId>']`
- Mng 내 Dtl 인라인 임베드 시: `:show-confirm="showConfirm" :set-api-res="setApiRes"` 반드시 전달

### 저장/삭제 패턴

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

## 전시관리 (Display) 구조

- `displays` 배열 항목: 패널 기본정보 + `rows[]` (위젯 목록)
- 위젯 타입: `image_banner`, `product_slider`, `product`, `cond_product`, `chart_bar`, `chart_line`, `chart_pie`, `text_banner`, `info_card`, `popup`, `file`, `file_list`, `coupon`, `html_editor`, `event_banner`, `cache_banner`, `widget_embed`
- 영역코드(`DISP_AREA`)는 `adminData.codes`에서 `codeGrp === 'DISP_AREA'`로 조회
- `DispAreaPreview.js` — 영역별 패널 미리보기. `DispPanelMng.js` — 패널 목록+인라인 상세. `DispPanelDtl.js` — 패널 등록/수정 (위젯 rows 편집 포함)

## CSS 클래스 (관리자)

`assets/css/backOfficeStyle.css`의 주요 클래스:

| 클래스 | 용도 |
|--------|------|
| `is-invalid` | 입력 필드 오류 상태 |
| `field-error` | 오류 메시지 텍스트 |
| `form-actions` | 저장/취소 버튼 영역 |
| `badge`, `badge-green/gray/blue/orange/red/purple` | 상태 배지 |
| `btn`, `btn-primary/secondary/blue/danger/green/sm` | 버튼 |
| `admin-table` | 목록 테이블 |
| `search-bar`, `search-label`, `search-actions` | 검색 영역 |
| `toolbar`, `list-title`, `list-count` | 목록 툴바 |
| `pagination`, `pager`, `pager-right` | 페이지네이션 |
| `title-link` | 클릭 가능한 목록 행 제목 |
| `actions` | 행 액션 버튼 묶음 |

## 로컬 설정 (`settings.json`)

```json
{
  "model": "sonnet",
  "MAX_THINIING_TOKENS": 10000,
  "CLAUDE_CODE_SUBAGETNT_MODEL": "haiku"
}
```

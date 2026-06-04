---
정책명: 관리자(Back Office) UX 정책
정책번호: base-UX-admin
관리자: 개발팀
최종수정: 2026-05-05
---

# 관리자(Back Office) UX 정책

---

## 1. 화면 프레임 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  [상단바 GNB]  로고 | 탑메뉴 | 공통필터 | 권한전환 | 로그인정보  │
├─────────────────────────────────────────────────────────────────┤
│  [탭 바]  ★대시보드 × | 회원관리 × | 주문관리 × | ...          │
├──────────────┬──────────────────────────────────────────────────┤
│  [좌측       │  [콘텐츠 영역]                         [우측     │
│   사이드바]  │    page-title                           패널]    │
│              │    검색 카드                                      │
│  섹션 타이틀 │    목록 카드                            API       │
│  그룹 헤더   │    상세/편집 카드 (인라인 임베드)        응답     │
│  메뉴 항목   │                                         표시     │
│  즐겨찾기 ★  │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 2. 상단바 (GNB)

### 2.1 구성 요소

```
[≡ ShopJoy] [03 01]  [회원관리] [상품관리] [주문관리] [프로모션] [전시관리] [고객센터] [정산] [시스템]
                                                             [공통필터 드롭다운] [역할전환] [홍길동 (관리자)]
```

| 영역 | 내용 |
|---|---|
| 로고 `ShopJoy` | 클릭 시 대시보드 이동 |
| 사이트 배지 `03 01` | 현재 사이트 번호 표시 (앞: 어드민 스타일, 뒤: 프론트 사이트 번호) |
| 탑 메뉴 | 회원관리 / 상품관리 / 주문관리 / 프로모션 / 전시관리 / 고객센터 / 정산 / 시스템 |
| 공통 필터 | 사이트·업체·회원·주문 범위 전역 필터 (§4 공통필터 참조) |
| 권한 전환 | 현재 사용자의 역할(Role) 선택 드롭다운 → 전환 즉시 메뉴 재구성 |
| 로그인 정보 | 사용자명 + 역할명 (우측 상단) |

### 2.2 로그인 방식

- **ID / Password** 입력 후 로그인
- 세션 토큰: localStorage 저장 → 페이지 새로고침 시 자동 복원
- 비밀번호 5회 실패 시 계정 잠금 (관리자 해제 필요)
- 세션 유효시간: 기본 8시간 (설정 가능)

### 2.3 로그인 후 표시 정보

```
상단 우측: [판매업체: 악셔리브랜드 Inc. ×]  [판매업체 역할 > 사이트운영자]   홍길동
```

| 항목 | 설명 |
|---|---|
| 업체 태그 (있을 경우) | `[판매업체: 업체명 ×]` — 현재 업체 범위 필터, × 클릭으로 해제 |
| 역할 경로 | `역할명 > 세부역할` 형식으로 현재 적용 권한 표시 |
| 사용자명 | 로그인한 관리자명 |

### 2.4 권한(역할) 목록 표시 및 전환

- 상단 우측 역할 표시 클릭 → **역할 선택 드롭다운** 펼침
- 보유 역할 목록 표시 (다중 역할 가능):
  ```
  ● 최고관리자              ← 현재 적용 중 (●)
    판매업체관리자
    사이트운영자
    고객상담원
  ```
- 역할 선택 시 즉시 적용:
  - 좌측 메뉴 항목 재구성 (권한 없는 메뉴 숨김)
  - 열린 탭 중 권한 없는 탭 자동 닫힘
  - `window.adminCommonFilter` 의 업체 필터 자동 적용
- 역할 전환 이력은 `sy_user_login_log` 에 기록

---

## 3. 탭 바

```
[★ 대시보드 ×]  [회원관리 ×]  [★ 주문관리 ×]  [회원등급관리 ×]  [+]
```

- ★ 표시: **핀 고정 탭** — 닫아도 탭 유지 (새로고침 후 복원)
- 탭 클릭 → 해당 페이지 활성화
- × 클릭 → 탭 닫기 (핀 탭은 닫기 비활성)
- 마우스 우클릭 → 컨텍스트 메뉴: 이 탭 새로고침 / 다른 탭 모두 닫기
- 탭 최대 수: 기본 10개 (초과 시 가장 오래된 비핀 탭 자동 닫힘)

---

## 4. 좌측 사이드바

### 4.1 구조

```
회원관리                  ← 섹션 타이틀 (현재 탑메뉴)
─────────
회원                      ← 그룹 헤더 { group: '회원' }
  • 회원관리         ★   ← 메뉴 항목 + 즐겨찾기 토글
등급·그룹                 ← 그룹 헤더
  • 회원등급관리     ★
  • 회원그룹관리     ★
```

### 4.2 섹션 타이틀

현재 활성 탑 메뉴 이름을 사이드바 최상단에 표시.  
`TOP_MENUS.find(t => t.id === activeTop)?.label`

### 4.3 그룹 헤더

`{ group: '그룹명' }` 항목 → 회색 소문자 구분선 표시.  
3개 이상 메뉴이거나 성격이 다른 그룹을 시각 구분할 때 사용.

### 4.4 즐겨찾기 ★

- 항목 우측 ★ 클릭 → localStorage `_adminFavorites` 에 저장
- 즐겨찾기된 항목은 그룹에 무관하게 사이드바 맨 위에 고정 표시
- 현재 활성 페이지의 행: 핑크 강조 + 좌측 인디케이터 바

### 4.5 권한에 따른 메뉴 제어

현재 역할이 접근 불가한 페이지는 사이드바에서 **숨김** (미노출).  
`sy_role_menu` 기준으로 adminApp 초기화 시 필터링.

---

## 5. 우측 패널 (API 응답 결과)

- `setApiRes` prop 을 통해 API 호출 결과를 우측 패널에 JSON 형태로 표시
- 개발·디버깅 전용: 프로덕션에서는 숨김 처리 가능
- 표시 형식: HTTP 메서드 + 경로 + 응답 status + 응답 body (collapsed JSON)

---

## 6. 업무화면 표준

### 6.1 기본 화면폭

```css
.admin-wrap {
  padding: 20px;
  max-width: 1550px;
  margin: 0 auto;
}
```

- 콘텐츠 영역 최대 폭: **1550px**, 중앙 정렬
- AdminApp.js 가 이미 `.admin-wrap` 을 적용하므로 **컴포넌트 루트에 재사용 금지**
- 컴포넌트 루트는 반드시 `<div>` (class 없음)

### 6.2 콘텐츠 영역 루트 구조

```html
<!-- ✅ 올바른 패턴 -->
<div>
  <div class="page-title">화면명</div>
  <div class="card"><!-- 검색 --></div>
  <div class="card"><!-- 목록 --></div>
  <div class="card" v-if="selectedId"><!-- 상세/편집 --></div>
</div>

<!-- ❌ 잘못된 패턴 — admin-wrap 이중 래핑 → 폭 좁아짐 + padding 중첩 -->
<div class="admin-wrap">...</div>
```

### 6.3 page-title

- 루트 `<div>` 의 **첫 번째 자식**으로 배치
- CSS: `font-size: 20px; font-weight: 700; margin-bottom: 18px; color: #1a1a2e;`

### 6.4 상세화면 #ID 표시

상세(Dtl) 화면 및 인라인 편집 카드에서 현재 편집 중인 항목의 ID를 page-title 바로 우측에 표시.  
신규 등록 시(`isNew === true`) 미표시.

```html
<div class="page-title">
  쿠폰관리
  <span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.couponId }}</span>
</div>
```

| 속성 | 값 |
|---|---|
| font-size | 12px (보조정보) |
| color | #999 (회색, 메인 제목과 시각 구분) |
| margin-left | 8px |

### 6.5 3열·4열 뷰모드 — 화면폭 자동 확장

Dtl 탭 뷰모드 중 **3열(`cols-3`) 또는 4열(`cols-4`)** 선택 시 max-width 제한 해제:

```css
/* adminGlobalStyle0N.css */
.admin-wrap:has(.dtl-tab-grid.cols-3),
.admin-wrap:has(.dtl-tab-grid.cols-4) { max-width: none; }
```

뷰모드 버튼 (탭바 우측):

```html
<div class="tab-bar-row">
  <div class="tab-nav">
    <button class="tab-btn" :class="{active: tab==='info'}" @click="setTab('info')">기본정보</button>
    ...
  </div>
  <div class="tab-modes">
    <button class="tab-mode-btn" :class="{active: tabMode==='tab'}"  @click="setViewMode('tab')">📑</button>
    <button class="tab-mode-btn" :class="{active: tabMode==='1col'}" @click="setViewMode('1col')">1▭</button>
    <button class="tab-mode-btn" :class="{active: tabMode==='2col'}" @click="setViewMode('2col')">2▭</button>
    <button class="tab-mode-btn" :class="{active: tabMode==='3col'}" @click="setViewMode('3col')">3▭</button>
    <button class="tab-mode-btn" :class="{active: tabMode==='4col'}" @click="setViewMode('4col')">4▭</button>
  </div>
</div>

<!-- 콘텐츠 영역 -->
<div class="dtl-tab-grid" :class="tabModeClass">
  <div class="dtl-tab-card-title">기본정보</div>  <!-- 2/3/4열에서만 보임 -->
  ...
</div>
```

뷰모드별 grid class:

| 버튼 | tabMode | grid class |
|---|---|---|
| 📑 탭 | `tab` | 탭 패널 표시 (단일 컬럼) |
| 1▭ | `1col` | `dtl-tab-grid cols-1` |
| 2▭ | `2col` | `dtl-tab-grid cols-2` |
| 3▭ | `3col` | `dtl-tab-grid cols-3` + max-width 해제 |
| 4▭ | `4col` | `dtl-tab-grid cols-4` + max-width 해제 |

뷰모드 상태 영속화: `window._ec{X}DtlState.tabMode` (행 전환에도 유지)

### 6.6 카드 공백 & 영역 간격 표준 ⭐ (2026-06-04)

**카드 내부 공백(`.card` padding) = 12px / 카드 간 간격 = 12px** 으로 통일한다.
넉넉한 `20px` 패딩은 폐기 — 표시경로(트리) 카드 수준(`12px`)으로 슬림하게 맞춘다.

```css
/* boGlobalStyle01/02/03.css — 3개 파일 동일 (전역 공통) */
.card { ... padding: 12px; margin-bottom: 12px; }   /* 이전 padding:20px / margin-bottom:16px */
```

- **전역 공통**: `.card` 한 곳만 바꾸면 검색란·목록·상세 등 전 BO 카드가 일괄 슬림화·일관 적용.
- 인라인 `style="padding:..."` / `margin-bottom:0` 가 명시된 카드는 그대로 우선(영향 없음).

**4영역(검색란/표시경로/목록/상세) 간격 = 모두 12px 로 통일** ⭐:
트리+목록+상세 3영역을 하나의 grid 로 묶는 화면(SySiteMng 표준)에서 영역 간 간격을 12px 로 맞춘다.

```html
<div class="page-title">화면명</div>
<div class="card"><!-- 검색란 --></div>   <!-- 아래 간격 = .card margin-bottom 12px -->

<!-- 트리 + (목록 | 상세) grid: row-gap 0, column-gap 12px -->
<div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:0 12px;align-items:flex-start;">
  <bo-path-tree-card ... />                <!-- 표시경로 (좌) -->
  <div>                                    <!-- 목록 (우) -->
    <bo-grid ...>
      <template #footer><bo-pager ... /></template>   <!-- 페이저는 카드 내부 (§11.2) -->
    </bo-grid>
  </div>
  <!-- 상세: 전체 폭. margin-top 금지 — 위 목록 카드 margin-bottom(12px)만으로 간격 12px -->
  <div style="grid-column:1/-1;">
    <xxx-dtl ... />                        <!-- 제목은 카드 내부 list-title (§12.1) -->
  </div>
</div>
```

| 영역 간 | 간격 출처 | 값 |
|---|---|---|
| 검색란 ↔ 표시경로 | 검색 `.card` margin-bottom | 12px |
| 표시경로 ↔ 목록 (가로) | grid `column-gap` (`gap:0 12px`) | 12px |
| 목록 ↔ 상세 (세로) | 목록 `.card` margin-bottom (row-gap 0, 상세 margin-top 없음) | 12px |

- ❌ 금지: grid `gap:16px`(가로·세로 동일) + 상세 wrapper `margin-top:4px` → 세로 간격이 ~32px 로 과대.
- ✅ `gap:0 12px`(세로 0/가로 12) + 상세 `margin-top` 제거 → 카드 기본 여백(12px)만으로 4영역 균일.

**상세 패널이 grid 밖 형제일 때도 `margin-top` 두지 말 것** ⭐ (2026-06-04): 상세를 grid 안
(`grid-column:1/-1`)에 두지 않고 **grid 컨테이너 다음 형제 `<div>`** 로 두는 화면이 있다. 이때도
그 wrapper 에 `margin-top:16px` 같은 값을 주면 (목록 카드 `margin-bottom:12px` 과 합쳐져) 간격이
**28px+** 로 과대해진다. → **`<div style="margin-top:16px;">` → `<div>`** (margin-top 제거).
목록 카드의 `margin-bottom:12px` 만으로 12px 간격이 된다(grid item 이 자식 카드 mb 를 포함).
- 2단/3단 화면처럼 **두 번째 `.card`** 가 이어지는 경우(업체선택→탭영역 등)는 그 카드의
  `style="margin-top:16px"` → `margin-top:12px` 로 (카드 자체는 margin-bottom 이 위에서 안 옴).
- ✅ 예외(건드리지 말 것): `.form-actions`(버튼행)·Dtl **내부** 섹션 간격의 `margin-top:16px` 는
  영역 간 간격이 아니라 컴포넌트 내부 간격이므로 유지.

> 코드: [pages/bo/sy/SySiteMng.js](../../../pages/bo/sy/SySiteMng.js) (트리+목록+상세, 상세=grid 자식),
> [pages/bo/sy/SyUserMng.js](../../../pages/bo/sy/SyUserMng.js) (상세=grid 밖 형제 → margin-top 제거),
> CSS: [assets/css/boGlobalStyle01/02/03.css](../../../assets/css/) `.card`.
> 연관: §10.12(트리 선택 시 목록·상세 초기화), §11.2(페이저 카드 내부), §12.1(임베드 Dtl 제목 list-title).

### 6.7 제목 ● 아이콘 / 슬림화 / 트리 루트 강조 표준 ⭐ (2026-06-04)

**모든 제목 좌측 ● 아이콘 (전역 CSS, 수동 ● span 금지)**:
```css
.page-title::before { content: "●"; color:#e8587a; font-size:11px; margin-right:8px; vertical-align:middle; }
.page-title[style*="flex"]::before { content: none; }   /* inline flex 제목(DP 미리보기 등) 레이아웃 보호 — 제외 */
.list-title::before { content: "●"; color:#e8587a; font-size:8px; margin-right:5px; vertical-align:middle; }
```
- 화면 제목=`page-title`, 영역 제목=`list-title` 만 쓰면 ● 자동. **개별 화면에서 수동 `<span>●</span>` 추가 금지**(이중 아이콘). 기존 수동 ● 13개 제거 완료.
- 영역 제목이 `<b>`/커스텀 div 면 → `class="list-title"` 로 바꿔 폰트·아이콘 통일(역할관리 메뉴접근권한/대상사용자, DP Dtl 헤더 등).
- ⚠️ CSS `content` 에 ● 넣을 때 **유니코드 escape(`\25CF`) 쓰지 말고 리터럴 ●** — 도구가 octal 로 오인해 제어문자(0x15) 주입 사고 발생함. 반드시 raw 바이트(0x25cf) 확인.

**슬림화 (전역)**: `.pagination` padding `3px 10px`+`margin-top 2px`(목록에 붙임), `.pager button` `24px`, `.left-nav-item`(좌측메뉴) padding `7px 16px`, `.bo-tab-bar` 탭버튼 padding `5px 12px`+뷰모드버튼 `3px 6px`(우측 최소공간), HTML 에디터(`.toastui-editor-defaultUI-toolbar`) `flex-wrap:nowrap`(툴바 한 줄).

**트리 루트('전체') 최상위 레벨 강조**: BoPathTreeNode/BoDeptTreeNode 의 `depth===0` 노드는 `fontWeight:700`+`fontSize:13px`+하단 `border-bottom:1px #f0f0f0` 로 자식(12px/400)과 구분.

> 코드: CSS 3테마, [components/comp/BoComp.js](../../../components/comp/BoComp.js)(트리/탭바), [BaseComp.js](../../../components/comp/BaseComp.js)(에디터 툴바).

### 6.8 탭 바 표준화 / Hist 탭-라벨 한 카드 / 위젯 Dtl 열수 ⭐ (2026-06-04)

**커스텀 탭 버튼 금지 → `<bo-tab-bar>` 통일**:
- 화면 안의 탭 전환 UI(예: 전시UI시뮬레이션 `영역미리보기/구조/소스`, Hist `로그인로그/토큰`)는 **수기 `<button>` + 핑크 인라인 스타일**(`color:#e8587a;border-bottom:3px solid #e8587a`) 작성 금지.
- 반드시 `reactive([{id,label,icon?,count?}])` + `<bo-tab-bar :tabs :tab :show-modes="false" @tab-select="id => ...">` 로 통일 → 모든 탭 버튼 스타일·간격 일관.
- 탭 정의는 `computed` 금지, `reactive([...])`. 동적 카운트는 `get count(){ return ... }` getter.

**Hist 탭은 "라벨 → 탭바 → 목록"을 한 카드에**:
- 이력 화면(로그인/토큰처럼 탭으로 데이터셋 전환)은 **떠 있는 `class="tab-nav"` 금지**. `<div class="card">` 안에 `① <div class="list-title">…이력</div>` → `② <bo-tab-bar :show-modes="false">` → `③ <bo-grid bare>`(활성 탭) → `④ <bo-pager>` 순서로 한 카드에 묶는다.
- 그리드는 `bare`(자체 카드/타이틀 제거) — 탭명이 곧 목록 제목이라 `list-title` 중복 금지.
- 적용: [SyUserLoginHist](../../../pages/bo/sy/SyUserLoginHist.js), [SyMemberLoginHist](../../../pages/bo/sy/SyMemberLoginHist.js). (Od/Pd/Mb Hist 는 이미 `bo-tab-bar` 사용 — 점검 완료.)

**임베드 위젯/관계 트리 행 슬림**: 다단 관계 트리(전시관계도 UI→영역→패널)의 각 행 세로 padding 을 `5px/4px/3px`(상→하위) 로 축소, 인터-루트 `margin-bottom:8px`. 가로 들여쓰기(40px/68px)는 유지.

**Dtl 폼 열수는 화면 의도 우선**: 표준은 cols=3 이나, 필드가 적고 입력폭이 필요한 위젯류 Dtl(DpDispWidgetDtl/DpDispWidgetLibDtl)은 `:cols="2"` + 각 필드 `colSpan` 미지정(1열씩) 으로 "2열·각 1칸" 레이아웃 허용.

> 코드: [DpDispUiSimul.js](../../../pages/bo/ec/dp/DpDispUiSimul.js)(mainTabs), [DpDispRelationMng.js](../../../pages/bo/ec/dp/DpDispRelationMng.js)(행 슬림), [BoComp.js](../../../components/comp/BoComp.js) `BoTabBar`.

### 6.9 행 클릭=보기 / [수정]=수정 / 보기모드 수정버튼 항상 ⭐ (2026-06-04, 전체공통)

인라인 상세 패널(`dtlMode: 'view' | 'edit'`)을 쓰는 Mng/Dtl 의 **상호작용 표준**:

| 동작 | 결과 | 구현 |
|---|---|---|
| 그리드 **행번호/제목(셀) 클릭** | 상세 **보기모드** | `@cell-click → '{area}-rowView' → loadView(id)` (`dtlMode='view'`) |
| 행 액션 **[수정]** 버튼 | 상세 **수정모드** | `'{area}-rowEdit' → handleLoadDetail(id)` (`dtlMode='edit'`) |
| 보기모드 하단 **[수정]** 버튼(항상 표시) | 보기→수정 전환 | Dtl `'form-edit' → navigate('__switchToEdit__')`, Mng `inlineNavigate` 가 `dtlMode='edit'` |

- ❌ 금지: 행 클릭이 바로 수정모드로 진입(`@cell-click → rowEdit`). 보기 먼저, 수정은 의도적 액션.
- Dtl 하단 액션: **보기모드 = [수정][닫기]**, **수정모드 = [저장][취소]**. `bo-form-area` 의 `:show-actions="active" @edit @save` 자동 렌더 또는 수동 `form-actions v-if` 2분기(`cfDtlMode`).
- 제목도 모드 반영: `cfDtlMode ? '…상세' : '…수정'`.
- `cfDetailKey` 에 `dtlMode` 포함 → 모드 전환 시 `:key` 변경으로 폼 재마운트(보기 데이터 → 편집 가능).
- 적용(2026-06-04): SyBbsMng/Dtl(기준 모델), SyAlarm·SyBbm·SyContact·SySite Mng/Dtl. 동일 상태머신(`loadView`+`handleLoadDetail`+`dtlMode`) 보유 화면에 점진 확대.

> 코드 기준 모델: [SyBbsMng.js](../../../pages/bo/sy/SyBbsMng.js) · [SyBbsDtl.js](../../../pages/bo/sy/SyBbsDtl.js).

---

## 7. 그리드 헤더 열 설정 아이콘 (⚙)

### 7.1 위치 및 역할

테이블 우측 상단(toolbar 끝)에 ⚙ 아이콘 추가.  
클릭 시 열 표시/숨기기·순서 변경 패널 토글.

```html
<div class="toolbar">
  <span class="list-title">주문 목록</span>
  <span class="list-count">총 {{ total }}건</span>
  <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
    <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
    <button class="btn btn-xs btn-secondary" @click="showColSetting=!showColSetting" title="열 설정">⚙</button>
  </div>
</div>

<!-- 열 설정 패널 -->
<div v-if="showColSetting" style="background:#f5f5f5;border-radius:6px;padding:12px;margin-bottom:8px;">
  <div v-for="(col, idx) in allColumns" :key="col.key"
       style="display:flex;align-items:center;gap:8px;padding:4px 0;">
    <span style="display:flex;gap:2px;">
      <button v-if="idx>0" class="btn btn-xs btn-secondary" @click="moveUp(idx)">▲</button>
      <button v-if="idx<allColumns.length-1" class="btn btn-xs btn-secondary" @click="moveDown(idx)">▼</button>
    </span>
    <input type="checkbox" :checked="col.visible" @change="toggleCol(col.key)">
    <label>{{ col.label }}</label>
  </div>
  <button class="btn btn-xs btn-secondary" style="margin-top:8px" @click="resetCols">초기값 복원</button>
</div>
```

### 7.2 구현 패턴

```js
const allColumns = Vue.reactive([
  { key: 'orderId',     label: '주문번호',  visible: true,  order: 1 },
  { key: 'memberNm',    label: '회원명',    visible: true,  order: 2 },
  { key: 'totalAmt',    label: '결제금액',  visible: true,  order: 3 },
  { key: 'statusCd',    label: '상태',      visible: true,  order: 4 },
  { key: 'regDate',     label: '주문일',    visible: true,  order: 5 },
  { key: 'memo',        label: '메모',      visible: false, order: 6 },  // 기본 숨김
]);

const visibleColumns = Vue.computed(() =>
  allColumns.filter(c => c.visible).sort((a,b) => a.order - b.order)
);
const toggleCol  = (key) => { const c = allColumns.find(c=>c.key===key); if(c) c.visible=!c.visible; saveColSettings(); };
const moveUp     = (idx) => { if(idx>0) { [allColumns[idx-1].order, allColumns[idx].order] = [allColumns[idx].order, allColumns[idx-1].order]; } };
const moveDown   = (idx) => { if(idx<allColumns.length-1) { [allColumns[idx].order, allColumns[idx+1].order] = [allColumns[idx+1].order, allColumns[idx].order]; } };
const resetCols  = () => { DEFAULT_COLUMNS.forEach((d,i) => { allColumns[i].visible = d.visible; allColumns[i].order = d.order; }); saveColSettings(); };

// localStorage 영속화
const COL_KEY = 'adminCol_odOrderMng';
const saveColSettings = () => localStorage.setItem(COL_KEY, JSON.stringify(allColumns.map(c=>({key:c.key,visible:c.visible,order:c.order}))));
const loadColSettings = () => {
  const saved = localStorage.getItem(COL_KEY);
  if (!saved) return;
  JSON.parse(saved).forEach(s => { const c = allColumns.find(c=>c.key===s.key); if(c) { c.visible=s.visible; c.order=s.order; } });
};
Vue.onMounted(loadColSettings);
```

### 7.3 적용 대상

복잡한 목록 화면(주문·클레임·배송·회원·상품 Mng)에 우선 적용.  
단순 코드성 마스터(등급·태그 등)는 생략 가능.

### 7.4 BoGrid 컬럼 속성화 (AG-Grid colDef 식)

`<bo-grid>` 의 셀은 `#cell-{key}` 슬롯 대신 **`gridColumns` 객체의 속성**(`fmt`/`badge`/
`cellStyle`/`cellClass`/`align`/`edit`)으로 선언하여 보일러플레이트 축소.

- 신규 화면은 처음부터 columns 속성으로 작성, 슬롯은 KEEP 패턴(행클릭/ref-link/박스
  배지/`:title` 동적/v-if 복합/버튼)에만 사용
- `#head` 슬롯 전면 금지 — 헤더는 columns 의 `label`/`style`/`cls`/`sortKey` 로만
- 상세 표준·변환규칙·KEEP 패턴: [`sy.51.프로그램설계정책.md`](../sy/sy.51.프로그램설계정책.md) §4.6 참조
- BO 전 도메인 84파일 전수 적용 완료(2026-05-20, ~790→393 슬롯, 50% 속성화)

---

## 8. 공통 필터 (adminCommonFilter)

### 8.1 개요

`window.adminCommonFilter` 는 **전역 reactive 객체**로, 사이트·업체·회원·주문 범위를 전 화면에서 공유.

```js
// utils/adminUtil.js
window.adminCommonFilter = Vue.reactive({
  siteId:   null,   // 사이트 ID (null = 전체)
  vendorId: null,   // 업체 ID
  memberId: null,   // 회원 ID
  orderId:  null,   // 주문 ID
});
```

### 8.2 상단바 공통 필터 드롭다운

```
[사이트: 전체 ▼]  [업체: 전체 ▼]
```

- **사이트 선택**: `adminData.sites` 기준 선택 → `adminCommonFilter.siteId` 갱신
- **업체 선택**: `adminData.vendors` 기준 선택 → `adminCommonFilter.vendorId` 갱신
- 선택 값은 URL query로도 동기화 (탭 공유 시 유지)
- 관리자 역할이 특정 업체에 묶인 경우 업체 선택 고정·변경 불가

### 8.3 화면 오픈 시 자동 적용 정책

> **공통 필터 값이 설정되어 있고, 화면의 검색 필드 중 동일한 항목이 있으면
> 화면 오픈 시 해당 검색 필드에 자동으로 값을 적용하고 즉시 검색한다.**

```js
// setup() 내 onMounted 또는 즉시 실행
Vue.onMounted(() => {
  const cf = window.adminCommonFilter;

  // 공통 필터 → 화면 검색필드 자동 매핑
  if (cf.siteId   && 'siteId'   in applied) applied.siteId   = cf.siteId;
  if (cf.vendorId && 'vendorId' in applied) applied.vendorId = cf.vendorId;
  if (cf.memberId && 'memberId' in applied) applied.memberId = cf.memberId;
  if (cf.orderId  && 'orderId'  in applied) applied.orderId  = cf.orderId;

  // 하나라도 적용됐으면 즉시 검색 (pager.page 는 이미 1)
  onSearch();
});
```

자동 적용 대상 검색 필드 예시:

| 화면 | 자동 적용 가능 필드 |
|---|---|
| 주문관리 | siteId, vendorId, memberId |
| 클레임관리 | siteId, memberId |
| 회원관리 | siteId |
| 상품관리 | siteId, vendorId |
| 배송관리 | siteId, vendorId |
| 정산관리 | siteId, vendorId |

### 8.4 공통 필터 해제

- 상단바 드롭다운에서 "전체" 선택 → `null` 로 초기화
- 업체 태그 `×` 클릭 → `vendorId = null`
- 각 Mng 화면의 "초기화" 버튼은 화면 내 검색 필드만 초기화 (공통 필터는 유지)

---

## 9. 검색 카드 (search-bar)

### 9.1 단일 행 레이아웃 (기본)

`search-bar` = flex row, 항목 간 8px gap. 버튼은 `search-actions` div 로 우측 정렬.

```html
<div class="card">
  <div class="search-bar">
    <label class="search-label">항목명</label>
    <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="...">
    <label class="search-label">상태</label>
    <select class="form-control" v-model="searchStatus">...</select>
    <div class="search-actions">
      <button class="btn btn-primary" @click="onSearch">조회</button>
      <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
    </div>
  </div>
</div>
```

**적용 사례**: 공지사항관리 (필드 4개)

### 9.2 다중 행 레이아웃 (2열 그리드) ⭐ 표준

검색 필드가 4개 이상일 때 2열 그리드로 배치. 라벨은 입력 필드 위에 위치.

```html
<div class="card">
  <div class="search-bar">
    <label class="search-label">이름/이메일</label>
    <input v-model="searchParam.searchValue" @keyup.enter="() => onSearch?.()" placeholder="이름 또는 이메일 검색" />
    
    <label class="search-label">등급</label>
    <select v-model="searchParam.grade">
      <option value="">전체</option><option>일반</option><option>우수</option><option>VIP</option>
    </select>
    
    <label class="search-label">상태</label>
    <select v-model="searchParam.status">
      <option value="">전체</option><option>활성</option><option>정지</option>
    </select>
    
    <div class="search-actions">
      <button class="btn btn-primary" @click="onSearch">조회</button>
      <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
    </div>
  </div>
</div>
```

**특징**:
- 라벨과 입력필드가 함께 수직 배치됨 (가로 공간 효율적)
- `search-bar` 클래스의 기본 flex row + wrap 으로 자동 2열 구성
- `search-label` 너비로 필드별 라벨 정렬
- 검색/초기화 버튼은 `search-actions` 로 자동 우측 배치

**적용 사례**: 회원관리 (필드 3개)

### 9.3 적용 정책

- Enter 키 → 검색 실행 (`@keyup.enter="onSearch"`)
- "초기화" → 화면 검색 필드만 초기화 (공통 필터 값 유지)
- 검색 실행 시 `pager.page = 1` 리셋 필수
- 화면 오픈 시 공통 필터 자동 적용 후 즉시 검색 (§8.3)
- 버튼: "조회" (btn-primary) + "초기화" (btn-secondary btn-sm)

### 9.4 검색 방식 정책 ⭐ (2026-05-01 확정)

**검색 조건 변경은 절대 클라이언트 filter를 실행하지 않는다.**  
반드시 **[조회] 버튼 클릭** 또는 **Enter 키** 입력 시에만 API를 호출한다.

```
❌ 금지 — v-model 입력 즉시 computed filter 반응
const cfFilteredRows = computed(() => rows.filter(r => r.name.includes(searchParam.searchValue)));

❌ 금지 — watch로 searchParam 변경 시 자동 조회
watch(() => searchParam.searchValue, () => handleSearchList());

✅ 올바른 패턴 — 조회 버튼 / Enter 에서만 API 호출
const onSearch = async () => { pager.pageNo = 1; await handleSearchList(); };
// 입력 필드: @keyup.enter="onSearch"
// select: @change 연결 없음 — 조회 버튼으로만 실행
```

**예외 (클라이언트 filter 허용)**:
- CRUD 그리드 내 **상위/하위 연동 필터** (예: 코드그룹 선택 → 코드목록 변경)
- 모달 내 **picker 검색** (목록 즉시 좁히기 용도)
- FO 마이페이지 등 **API 없는 로컬 데이터** 화면

---

## 10. 목록 카드 (toolbar + admin-table)

### 10.1 toolbar 구조

```html
<div class="toolbar">
  <span class="list-title">목록명</span>
  <span class="list-count">총 {{ total }}건</span>
  <div style="margin-left:auto;display:flex;gap:6px;">
    <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
    <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    <button class="btn btn-xs btn-secondary" @click="showColSetting=!showColSetting">⚙</button>
  </div>
</div>
```

### 10.2 테이블 정렬 기준

| 데이터 타입 | 정렬 | CSS |
|---|---|---|
| 텍스트·이름·설명 | 좌측 | 기본값 |
| 코드값·상태·날짜 | 가운데 | `text-align:center` |
| 금액·수량·점수 | 우측 | `text-align:right` |

### 10.3 숫자 표시

- 금액/수량: 1,000단위 쉼표 `(val||0).toLocaleString()`
- 비율: 소수점 1자리 `val.toFixed(1) + '%'`

### 10.4 상태 배지 (badge)

| 클래스 | 의미 |
|---|---|
| `badge-green` | 정상·공개·활성·발송완료 |
| `badge-gray` | 비활성·비공개·미발송 |
| `badge-orange` | 주의·공지·보류 |
| `badge-red` | 오류·삭제·거절 |
| `badge-blue` | 정보·일반 분류 |
| `badge-purple` | 특수·VIP |

### 10.5 행 클릭 → 인라인 상세

- 같은 행 재클릭 시 닫기 (toggle)
- 활성 행: `:class="{active: selectedId === row.id}"`
- 클릭 가능 행: `style="cursor:pointer"`
- 행 내 독립 버튼: `@click.stop` 으로 버블 차단

### 10.6 "데이터 없음"

```html
<tr v-if="!pageList.length">
  <td :colspan="N" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td>
</tr>
```

### 10.7 표준 행 높이 (셀 패딩) ⭐ (2026-06-01)

모든 BO 그리드(`<bo-grid>` = `.bo-table`)의 행 높이는 **셀 세로 패딩**으로 통일한다.
표시경로 picker(`bo-path-pick-field`)·인라인 select/input 등 위젯 셀이 포함된 그리드도
일반 텍스트 그리드와 같은 행 높이를 유지해야 한다.

**통일 기준값 = `padding 4px 10px` / `font-size 13px`** — 검색란·그리드·상세(compact) 세 영역이
모두 동일한 필드 크기를 갖는다. (검색란이 기준)

| 대상 | 세로 패딩 | 가로 패딩 | font |
|---|---|---|---|
| `.search-bar input/select/.form-control` (검색 필드) ⭐기준 | `4px` | `10px` | `13px` |
| `.bo-table td` (그리드 본문) | `4px` | `10px` | `13px` |
| `.bo-table th` (그리드 헤더) | `6px` | `10px` | `12px` |
| `.bo-form-compact .form-control/.readonly-field` (상세 compact 필드) | `4px` | `10px` | `13px` |
| `.crud-grid td` (CRUD/드래그 그리드) | `4px` | `6px` (촘촘 셀 — 유지) | `13px` |
| `.date-range-input` (검색 날짜) | `4px` | `8px` | `13px` |
| `multi-check-select` 트리거 (검색 다중선택) | `4px` | `10px`/`28px`(우측 ▼) | `13px` |

세 영역(검색/그리드/상세)의 **필드 높이·폰트가 동일**해야 한다. 라벨은 `12px`(`.search-label`
= `.bo-form-compact .form-label`), 그리드 헤더만 세로 `6px`(헤더는 관례상 약간 높음).
- **상세란**은 일반 Dtl 의 `.form-control`(`8px 11px`/13px)이 아니라, `compact` 일 때
  검색란과 같은 `4px 10px`/13px 가 된다. compact 미사용(전체 폭) Dtl 은 기본 크기 유지.

**검색 버튼(조회/초기화)은 `btn-sm`** — 그리드 툴바의 `+행추가`/`엑셀`(`btn-sm`, padding `4px 10px`)
및 슬림 검색 필드(`4px`)와 동일한 크기로 통일한다.
- `<bo-search-area>` 의 기본 조회/초기화 버튼은 둘 다 `btn-sm` 으로 렌더된다(컴포넌트 내장).
- 검색 영역을 직접 작성하거나 `#actions-*` 슬롯에 버튼을 추가할 때도 **조회=`btn btn-primary btn-sm`,
  초기화=`btn btn-secondary btn-sm`** 를 쓴다. `height:36px` 등 인라인 고정 높이 금지.

```css
/* assets/css/boGlobalStyle0{1,2,3}.css — 3개 파일 동일 */
.bo-table th { padding: 6px 12px; ... }
.bo-table td { padding: 4px 12px; ... }
.search-bar input, .search-bar select, .search-bar .form-control { padding: 4px 10px; ... }
```

**원칙**:
- 행 높이·필드 높이·버튼 크기는 **공통 컴포넌트(`bo-search-area`/`bo-grid`/`bo-form-area`)와
  전역 CSS(`.bo-table`/`.search-bar`/`.btn-sm`)로만 제어**한다. 한 곳만 바꾸면 전 BO 화면에
  일관 적용된다 — 개별 화면에서 `dense` prop·인라인 `padding`/`height` 오버라이드 금지.
- 검색 영역은 가능한 한 `<bo-search-area :columns>` 로 작성한다. 직접 마크업이 불가피하면
  위 표준 클래스(`.search-bar` + `btn-sm`)를 그대로 따른다.
- 위젯 셀이 행을 키우면 셀 위젯 자체(`minHeight`)를 슬림하게 맞추되, 행 높이의 기준은
  여전히 `.bo-table td` 패딩이다.
- `font-size`(td 13px / th 12px)는 변경하지 않는다 — 높이 조정은 패딩으로만.

> 2026-06-01 표준화: 그리드 `td` `10px→4px`, 검색 필드 `7~8px→4px`, 검색 버튼 `btn-sm`.
> 적용: `boGlobalStyle01/02/03.css` 3개 + `BoSearchArea`/`BoGrid`/`BoFormArea` 공통 컴포넌트.
> 비표준 직접작성 2건(DpDispWidgetMng·DpDispWidgetLibMng 조회 버튼) 표준 클래스로 일괄 수정.

### 10.8 우측 행 액션 버튼은 한 줄 ⭐ (2026-06-01)

`#row-actions` 슬롯에 버튼이 **2개 이상**(예: 즉시실행 ▶ + 취소/삭제)일 때는 한 줄로 표시한다.
CRUD 그리드의 액션 셀(`.col-act-box`)은 `flex-wrap: wrap`(버튼 3개 이상 화면 대비)이므로,
버튼이 세로로 쌓여 행이 커지는 화면은 **버튼들을 nowrap 인라인 컨테이너로 묶는다**.

```html
<!-- ✅ ▶ + 취소/삭제 를 한 줄로 (SyBatchMng 패턴) -->
<template #row-actions="{ row, idx }">
  <span style="display:inline-flex;flex-wrap:nowrap;align-items:center;gap:3px;white-space:nowrap;">
    <button v-if="cfShowRunNow(row)" class="btn btn-secondary btn-xs" @click.stop="...">▶</button>
    <bo-row-cancel-delete :row="row" @cancel="..." @delete="..." />
  </span>
</template>
```

### 10.9 행 펼침·인라인 패널 폼은 compact ⭐ (2026-06-01)

`<bo-grid>` 의 `#row-expand` 펼침 영역이나 **Mng 하단 인라인 Dtl 패널**에 `<bo-form-area>` 를
쓸 때는 **`compact` 속성**을 부여해 필드 높이/간격/버튼을 그리드·검색란과 같은 톤으로 줄인다.

```html
<!-- ✅ 실행이력 펼침 (SyBatchHist 패턴, readonly + show-actions=false) -->
<bo-form-area :columns="histExpandColumns" :form="row" :cols="5" readonly label-left compact :show-actions="false" />

<!-- ✅ Mng 인라인 Dtl 패널 (SySiteDtl 패턴, 편집 가능 + 저장/취소 버튼) -->
<bo-form-area :columns="baseFormColumns" :form="form" :errors="errors" :readonly="cfDtlMode" :cols="3" compact ... />
```

`compact` 적용 시 (`.bo-form-compact`, 3개 CSS 동일) — **검색란/그리드와 동일 톤(§10.7)**:
- `.readonly-field` / `.form-control` 패딩 `4px 10px`, font `13px`, `.form-control min-height:28px`
- `.form-label` 12px + `margin-bottom 2px`(라벨↔필드 간격 유지)
- `.form-group` `margin-bottom 6px`(줄 간격 유지 — 0 으로 죽이지 말 것)
- labelLeft 행 간격 `margin-bottom 6px → 2px`
- `pathPick` 박스: 검색란과 동일 `padding 4px 10px` / `font 13px` / `minHeight 28px`
- **액션 버튼(저장/취소/수정/닫기)도 `btn-sm`** 으로 자동 렌더, `.form-actions` margin-top `20px → 12px`

> ⚠️ 과압축 금지: 라벨↔필드(`form-label margin`)·줄 간격(`form-group margin`)을 0 으로 만들면
> 폼만 유독 빽빽해 보인다. 필드 **높이**만 그리드/검색란 톤(4px·13px)으로 줄이고 **간격은 유지**한다.

> 적용 현황(2026-06-01): **BO 인라인 상세 패널 34개 전체**의 메인 `bo-form-area` 에 `compact` 적용
> (§12.3 의 always-show 패널과 동일 대상). 멀티섹션 폼(PdProdDtl 4개: info/detail/price/stock 등)·
> 펼침 sub-form(OdOrder/OdClaim itemExpand)도 포함. PdReviewMng 은 상세가 커스텀 HTML 이라 `bo-form-area`
> 미사용 → 해당 없음. 검색란/그리드/상세 세 영역이 모두 `4px 10px / 13px` 로 통일됨.
> (인라인 상세 패널이 BO 표준이 되면서, 이전의 "전체 폭 Dtl 은 기본 높이" 예외는 사실상 인라인 패널로 흡수됨.)

### 10.10 표시경로(pathPick) 선택/해제 버튼 ⭐ (2026-06-01)

상세 폼의 표시경로(`type: 'pathPick'`) 필드 우측 버튼 표준:
- **🔍 선택 버튼**: 아이콘만(텍스트 "선택" 제거), **정사각형** — `width/height` 가 필드 높이와 동일
  (compact `28px` / 일반 `34px`), `padding:0`, flex 중앙정렬. `title="표시경로 선택"` 툴팁.
- **해제 버튼**: 버튼 박스 없이 **소문자 `x` 글자만** (`background:none;border:none`), 🔍 버튼
  **바로 옆에 `gap:2px`** 로 밀착, **아래정렬**(부모 `align-items:flex-end`). `title="선택 해제"`.

```html
<span style="display:inline-flex;align-items:flex-end;gap:2px;align-self:stretch;">
  <button class="btn btn-secondary btn-sm" :style="{padding:0,width:'28px',height:'28px',display:'inline-flex',alignItems:'center',justifyContent:'center'}">🔍</button>
  <button v-if="hasValue" style="background:none;border:none;padding:0 2px 2px;color:#999;font-size:13px;">x</button>
</span>
```

> 코드: [components/comp/BoAreaComp.js](../../../components/comp/BoAreaComp.js) `col.type === 'pathPick'`.
> 그리드 셀 picker(`bo-path-pick-field`)는 별도(이미 아이콘만).

### 10.11 선택 행·트리 노드 강조 = 파란 테두리 ⭐ (2026-06-04)

목록 그리드의 **선택 행**, 좌측 트리의 **선택 노드** 강조는 **파란 외곽선(outline)** 으로 통일한다.
핑크 배경(`#fff0f4`/`#fce4ec`/`#ffeef2` 등)·좌측 핑크 막대(`border-left:3px #e8587a`) 패턴은 **폐기**.

**표준 스펙** (선택 상태):
```
background:#eff6ff;            /* 연한 파란 배경 */
color:#1d4ed8;                 /* 텍스트 강조가 필요한 경우만 */
outline:2px solid #2563eb;     /* 파란 외곽선 (테두리) */
outline-offset:-2px;           /* 행 내부 가장자리에 깔끔히 */
position:relative; z-index:1;  /* 인접 행/노드 경계선 위로 외곽선 표시 */
```

**그리드** (`<bo-grid>` / `<bo-grid-crud>`):
- 선택 강조는 **`row-key="<PK>"` + `:selected-key="<선택상태값>"`** 두 prop으로 자동 처리(CSS `.bo-row-selected`).
  단순 클릭 포커스는 `.crud-row.focused`(focusedIdx). 둘 다 위 outline 표준을 공유.
- ❌ 금지: `:row-style` 가 선택 행에 `background:#fff0f4` 등 핑크 반환 → 파란 강조와 충돌. `cursor:pointer` 만 남긴다.
- ❌ 누락 주의: `@row-click`/`@row-dblclick`/`row-clickable` 인데 `:selected-key` 가 없으면 **선택 강조가 안 보인다**. 영속 선택(상세/편집 패널을 여는) 그리드는 반드시 `:selected-key` 를 바인딩한다.
- ✅ 예외: **expand-only 아코디언**(로그/이력 — `expandedSet` 토글만, 영속 "선택 행" 개념 없음. SyBatchHist/SyApiLogMng/StRawMng/Sy\*LoginHist 등)은 `:selected-key` 불필요.

**트리** (좌측 표시경로/부서/카테고리 트리 노드, picker 모달 트리 포함):
- 노드 컴포넌트의 `selected === id` 분기 style 에 위 outline 표준 적용. 공통 컴포넌트 한 곳만 고치면 전 화면 일관 적용.
- 적용: `BoPathTreeNode`(표시경로·메뉴 공용)·`BoPropTreeNode`·`BoDeptTreeNode`·`BoCategoryTree`(패널+picker)·`PathPickTreeNode`(모달). `BoCodeGrpTreeNode` 의 `border-left` 는 codeLevel 깊이표시(선택 아님)라 제외.

> CSS: [assets/css/boGlobalStyle01/02/03.css](../../../assets/css/) — `.bo-table tr.bo-row-selected` / `.crud-row.focused`
> 는 td별 inset box-shadow → **tr 단일 outline** 으로 변경(셀 경계 이중겹침 제거).
> 코드: [components/comp/BoComp.js](../../../components/comp/BoComp.js) 트리 노드, [BoAreaComp.js](../../../components/comp/BoAreaComp.js) BoGrid/BoGridCrud.

### 10.12 좌측 트리(표시경로) 선택 시 — 목록 재조회 + 상세·선택정보 초기화 ⭐ (2026-06-04)

좌측 트리(표시경로/부서 등) 노드를 선택하면 **선택 경로 기준으로 목록을 재조회**하고,
같은 화면의 **하단/연관 상세 패널과 선택정보(선택 행 강조)를 모두 초기화**한다.
(이전에 선택했던 행/상세가 새 경로 목록에는 없을 수 있으므로 잔존 표시 금지.)

**규칙** — 트리 노드 선택 핸들러(`pathTree-select` 등)에서:
1. `uiState.selectedPath = param` 으로 경로 갱신
2. `pager.pageNo = 1` 로 첫 페이지 복귀
3. **상세 패널 초기화** — 빈 신규/비활성 상태로 (`resetDetailToNew()` 또는 reloadTrigger 초기화)
4. **선택정보 해제** — `selected-key` 바인딩값(`detailModal.dtlId`/`focusedIdx`/`selectedXxxId`)을 비워 선택 행 강조 제거
5. **경로 기준 재조회** — `handleSearchList()` (params 에 `pathId: selectedPath`)

```js
// ✅ 표준 (SySiteMng 패턴)
} else if (cmd === 'pathTree-select') {
  uiState.selectedPath = param;
  pager.pageNo = 1;
  resetDetailToNew();          // 상세 패널 초기화(빈 폼 + active=false) → selected-key 값도 '__new__'/null 로 → 선택행 강조 해제
  return handleSearchList();   // params 에 pathId 포함 → 경로 기준 목록 재조회
}
```

- **초기화 버튼**(`searchParam-reset`)도 동일 — 검색조건+경로 전체복귀와 함께 상세/선택정보를 초기화한다.
- 좌·우 2분할 화면(예: 업체 선택 → 사용자 목록, SyVendorUserMng)에서 **좌측 선택 변경** 시에도 우측 상세/편집 폼·선택행을 초기화한다.
- 다영역 연동 화면(예: SyBatchMng — 트리 선택 시 배치목록 선택해제 + 배치 실행이력 전체로 리셋)도 같은 원칙: 트리 선택 = 하위 종속 영역 전부 초기화 후 재구성.

> 코드: [pages/bo/sy/SySiteMng.js](../../../pages/bo/sy/SySiteMng.js) `pathTree-select`,
> [pages/bo/sy/SyBatchMng.js](../../../pages/bo/sy/SyBatchMng.js) `resetSelectionAndHist`.

---

## 11. 페이지네이션

### 11.1 PageResult 응답 필드 매핑 ⭐

백엔드 `PageResult<T>` 의 실제 JSON 필드명 — 매번 틀리지 말 것.

| 백엔드 필드 | 설명 | ❌ 잘못된 이름 (혼동 주의) |
|---|---|---|
| `pageList` | 현재 페이지 데이터 배열 | `list`, `content`, `data` |
| `pageNo` | 현재 페이지 번호 (1부터) | `page`, `currentPage` |
| `pageSize` | 페이지당 건수 | `size`, `limit` |
| `pageTotalCount` | 전체 건수 | `total`, `totalCount`, `totalElements` |
| `pageTotalPage` | 전체 페이지 수 | `totalPages`, `totalPage` |
| `pageCond` | 이번 조회에 사용된 검색 조건 | - |

```js
// ✅ 올바른 프론트 매핑 패턴
const res = await boApiSvc.xxx.getPage(params);
const d = res.data?.data;
rows.value        = d?.pageList       || [];
pager.total       = d?.pageTotalCount ?? 0;
pager.totalPage   = d?.pageTotalPage  ?? 1;
```

```js
// ❌ 자주 틀리는 잘못된 패턴
rows.value  = d?.list || d?.content || [];      // ❌ list, content 없음
pager.total = d?.totalCount ?? d?.total ?? 0;   // ❌ totalCount, total 없음
```

### 11.2 페이지네이션 컴포넌트 (`<bo-pager>`) ⭐

페이지네이션은 **`<bo-pager>` 공통 컴포넌트**로 둔다. 직접 마크업 금지.

**위치 = 목록 카드 내부 하단** ⭐ (2026-06-04): 페이저는 **그리드 카드(`.card`) 안**에 보여야 한다
(목록과 분리된 별도 회색 띠로 떠 보이면 안 됨). `<bo-grid>` 의 **`#footer` 슬롯**에 넣는다.

```html
<!-- ✅ 표준 — 페이저를 그리드 카드 내부(#footer)에 -->
<bo-grid ... >
  ...
  <template #footer>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </template>
</bo-grid>

<!-- ⚠️ 구식 — 그리드 밖에 두면 카드와 분리된 띠로 보임 (점진 전환 대상) -->
<bo-grid ... ></bo-grid>
<bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
```

- `#footer` 슬롯은 BoGrid 카드의 본문 스크롤 컨테이너 **아래, 카드 닫힘 전**에 렌더된다(`bare` 모드 제외).
- 페이저 컴포넌트 소유권은 여전히 화면(부모)에 있고(외부 컴포넌트), **렌더 위치만 카드 안**이다.
  → [[grid_pager_externalized]] 의 "내부 페이저 컴포넌트 금지" 원칙과 충돌하지 않음(BoPager 그대로 사용).
- `<bo-grid-crud>` 는 자체 카드 안에 페이징이 없으므로(전체 로드) 해당 없음.

**표준** (2026-06-01):
- **표시 칸 수 10개**: 보이는 페이지 번호 윈도우는 **BoPager 내부 `cfPageNums` computed** 가
  `pager.pageNo`/`pager.pageTotalPage` 로 **최대 10칸**(현재 페이지 중앙) 자동 계산한다.
  - 각 화면의 `fnBuildPagerNums`(5칸 `s+4`)는 더 이상 표시 칸 수를 결정하지 않는다 — BoPager 가 일괄 처리.
  - 칸 수를 바꾸려면 `:page-window="N"` prop (기본 10).
- **슬림 + 영역 박스 + 그리드에 붙임** (`.pagination`, 3개 CSS 동일):
  - 버튼 `30px→26px` / font `13→12px`
  - `.pagination` 에 배경(`#fafafa`)+테두리(`1px #eee`)+`border-radius:6px`+`padding:6px 10px` → **영역으로 보임**
  - `margin-top 14px→8px` → 그리드 바로 아래 붙음

> 코드: [components/comp/BoComp.js](../../../components/comp/BoComp.js) `BoPager` (`cfPageNums` 10칸 윈도우).
> CSS: `boGlobalStyle0{1,2,3}.css` `.pagination` / `.pager button`.

---

## 12. 상세/편집 카드 (인라인 임베드)

### 12.1 Mng 하단 인라인 패턴

```html
<div class="card" v-if="selectedId">
  <div class="toolbar">
    <span class="list-title">
      {{ isNew ? '신규 등록' : '상세 / 수정' }}
      <span v-if="!isNew" style="font-size:12px;color:#999;margin-left:8px;">#{{ form.entityId }}</span>
    </span>
    <div style="margin-left:auto;display:flex;gap:6px;">
      <button class="btn btn-blue btn-sm" @click="doSave">저장</button>
      <button v-if="!isNew" class="btn btn-danger btn-sm" @click="doDelete">삭제</button>
      <button class="btn btn-secondary btn-sm" @click="closeDetail">닫기</button>
    </div>
  </div>
  <!-- 폼 필드 -->
</div>
```

**제목·라벨·폼은 모두 카드 안에** ⭐ (2026-06-04): Mng 하단에 임베드되는 Dtl 컴포넌트의 제목은
**카드 내부 `list-title`(toolbar 헤더)** 로 그린다. **`page-title`(페이지 대제목) 사용 금지** —
임베드 Dtl 은 독립 페이지가 아니므로 page-title 을 쓰면 폰트가 과하게 크고 카드 밖에 떠 보인다.

```html
<!-- ✅ 임베드 Dtl: 제목을 카드 안 list-title 로 (폰트 적정, 카드 안에 보임) -->
<div class="card">
  <div class="toolbar">
    <span class="list-title">
      {{ cfIsNew ? '사이트 등록' : '사이트 상세' }}
      <span v-if="!cfIsNew" style="font-size:12px;color:#999;margin-left:8px;font-weight:400;">#{{ form.siteId }}</span>
    </span>
  </div>
  <bo-form-area :columns="columns.baseForm" :form="form" :cols="3" compact ... />
</div>

<!-- ❌ 금지: 임베드 Dtl 인데 page-title 을 카드 밖에 둠 (폰트 큼 + 분리돼 보임) -->
<div class="page-title">사이트 상세</div>
<div class="card"> ...폼... </div>
```

- 임베드 Dtl 폼은 **`compact`** 로 검색란/그리드와 동일한 슬림 필드 크기(§10.7)를 갖는다.
- 독립 전체 페이지로 열리는 Dtl(라우팅 진입)은 기존대로 `page-title` 사용 OK — **임베드일 때만** list-title.

> 코드: [pages/bo/sy/SySiteDtl.js](../../../pages/bo/sy/SySiteDtl.js) — 제목을 카드 안 toolbar `list-title` 로,
> 폼은 `compact`. 페이저는 §11.2 처럼 목록 그리드 `#footer` 슬롯에.

**탭형 Dtl(제목+탭바+탭컨텐츠)도 한 카드로 묶기** ⭐ (2026-06-04): `<bo-tab-bar>` 를 쓰는
Dtl/Hist 도 **제목·탭바·탭컨텐츠가 따로 떠 보이면 안 된다** → **바깥 `<div class="card">` 하나**로 감싼다.
- 제목은 카드 첫 줄 `toolbar`/`list-title` (page-title 금지).
- 탭별 컨텐츠 블록의 `class="card"` → **`class="dtl-pane"`** 로 바꿔 **카드 안 카드(이중 테두리) 제거**.
  탭 모드: borderless 로 바깥 카드에 녹임. 멀티열 모드(`dtl-tab-grid`): grid 셀에 테두리 부여.
  ```css
  .dtl-pane { background:transparent; border:none; box-shadow:none; padding:4px 0 0; margin:0; }
  .dtl-tab-grid > .dtl-pane { background:#fff; border:1px solid #eee; border-radius:8px; padding:12px; margin-bottom:0; }
  ```
- 코드: [pages/bo/ec/pd/PdProdDtl.js](../../../pages/bo/ec/pd/PdProdDtl.js)(상품 수정), [PdProdHist.js](../../../pages/bo/ec/pd/PdProdHist.js)(이력정보).
  Dtl↔Hist 같은 인접 영역 간격은 §6.6 대로 `margin-top:12px`.

**BoTabBar 탭 버튼 표준** ⭐ (2026-06-04): 공통 컴포넌트 [BoTabBar](../../../components/comp/BoComp.js).
- 탭 버튼 세로 패딩 **`7px→5px`** (세로 ~30% 슬림). 컨테이너 padding `5px→4px`, 탭바 `margin-bottom 14px→10px`.
- **가로 탭**: 탭명+카운트를 버튼 가운데 정렬(`justify-content:center` + 카운트 뱃지 `marginLeft:0`).
  세로 탭(`orientation="vertical"`)만 카운트를 우측 끝(`marginLeft:auto`)으로.
- **우측 뷰모드 버튼군(📑/1▭~4▭)은 최소 공간**: 버튼 `padding:3px 6px`/`font 11px`/icon `12px`,
  컨테이너 `gap:2px`+`flex-shrink:0` → 탭 영역이 가로폭을 최대한 차지하고 뷰모드는 작게.
- 탭바 위에 툴바(버튼)가 있으면 그 사이 간격 확보(예: toolbar `margin-bottom:10px`).
- 임베드 Dtl/Hist 카드 헤더에는 **`#{{ id }}`** 를 list-title 옆에 표시(상품 수정/이력정보 동일).

### 12.2 Dtl 탭 + 뷰모드

Order / Claim / Dliv / Prod / Event / Cache / Coupon / Chatt Dtl — 5개 뷰모드 지원 (§6.5).  
Hist 컴포넌트가 Dtl 의 "hist" 탭 안에 임베드되는 경우 뷰모드 버튼 제거, 항상 tab 모드.

### 12.3 인라인 Dtl 상세영역 — 항상 표시 + 선택 시에만 편집 ⭐ (2026-06-01)

Mng 하단 인라인 Dtl 패널의 동작 표준. (※ 이전의 "진입 시 첫 행 자동 오픈"은 폐기 — 진입 시
**데이터를 자동 로드하지 않는다**. 대신 빈 상세영역을 항상 띄운다.)

| 상태 | 상세영역 | 하단 버튼(저장/취소) |
|---|---|---|
| 진입 직후 / 취소 후 / 저장 후 | **항상 표시**, 빈 신규 폼 + "행을 선택하세요" 안내 | **모두 숨김** |
| 그리드 행 클릭 | 해당 행 데이터 로드 | 표시 |
| `+신규` 클릭 | 빈 폼(입력 가능) | 표시 |

**규칙**:
1. **상세영역은 항상 렌더** — 패널을 `v-if` 로 숨기지 않는다. 빈 상태에서도 영역이 사라지면 안 된다.
2. **진입 시 자동 로드 금지** — 첫 행을 자동 선택하지 않는다(빈 신규 폼으로 시작).
3. **빈 상태에서는 저장/취소 등 모든 버튼 숨김** — `:show-actions` 를 `active` 플래그로 제어.
   취소를 눌렀을 때 저장 버튼이 남으면 안 된다.
4. **취소/닫기 = 영역 유지 + 빈 폼으로 초기화**(`active=false`). 영역을 닫지 않는다.
5. **검색 초기화(`searchParam-reset`)는 표시경로/부서 트리도 전체로**(`selectedPath=null`).

**참조 모델 패턴** (SySiteMng/SySiteDtl):
```js
// Mng — 패널 상태: 항상 show, 초기 빈 신규 폼, active 로 버튼 토글
const detailModal = reactive({ show:true, dtlId:'__new__', dtlMode:'edit',
  reloadTrigger:0, resetSeq:0, active:false });
const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);
const resetDetailToNew = () => { detailModal.show=true; detailModal.dtlId='__new__';
  detailModal.dtlMode='edit'; detailModal.active=false; detailModal.resetSeq++; };  // 버튼 숨김
const handleLoadDetail = (id) => { /* 행 클릭 */ detailModal.dtlId=id; detailModal.dtlMode='edit';
  detailModal.active=true; detailModal.reloadTrigger++; };                          // 버튼 표시
const openNew = () => { detailModal.dtlId='__new__'; detailModal.active=true; detailModal.resetSeq++; };
// inlineNavigate: '__cancelEdit__' => resetDetailToNew(); 저장성공 'xxxMng'{reload} => 재조회 + resetDetailToNew()
// searchParam-reset: ... uiState.selectedPath = null; (트리 전체)
```
```html
<!-- 패널 항상 렌더 (v-if 제거) -->
<xxx-dtl :key="cfDetailKey" :dtl-id="cfDetailEditId" :active="detailModal.active" ... />
```
```js
// Dtl — active prop 으로 버튼 노출, cancel/close 는 '__cancelEdit__' 로
props: { ..., active: { type: Boolean, default: true } }
// <bo-form-area ... :show-actions="active" ...>   // 빈 상태(active=false) 면 버튼 영역 자체 미렌더
// form-cancel / form-close => props.navigate('__cancelEdit__')
```

> 참조 모델: [`pages/bo/sy/SySiteMng.js`](../../../pages/bo/sy/SySiteMng.js) + [`SySiteDtl.js`](../../../pages/bo/sy/SySiteDtl.js).
> 적용 현황(2026-06-01): BO 인라인 상세 화면 **34개 전체** 적용 완료(63파일 node --check 통과, autoOpenedOnce 잔존 0).
> - 별도 Dtl 컴포넌트형(29): SySite·SyVendor·SyUser·SyTemplate·SyContact·SyCode·SyBbs·SyBbm·SyAlarm,
>   Cm Notice·Chatt, Mb Member, Pd Prod, Od Order·Dliv·Claim,
>   Pm Voucher·Save·Plan·Gift·Event·Discnt·Coupon·Cache, Dp Widget·WidgetLib·Ui·Panel·Area
> - **인라인 폼형(5)**: SyVendorUser(2단계)·CmBlog·PdBundle·PdSet·PdReview(2단계) — 별도 Dtl 없이 Mng 안
>   `bo-form-area` 직접. 이 경우 `active` 게이트는 기존 상태 변수(`formMode`/`dtlMode`/`detailPanel.show`/
>   `cfSelectedRow`)를 재활용하고, 폼 초기화는 빈 폼 팩토리 재호출로 처리.
> - 패널 변수는 화면마다 상이: `detailPanel`/`detailModal`/`uiStateDetail`/`baseDetail`/`uiState.selectedCodeId`/
>   `formMode`/`dtlMode`/`cfSelectedRow` — 각 화면 실제 변수에 맞춰 적용.
> - 2단계 종속 화면(SyVendorUser/PdReview)은 상위 미선택 시 안내문구를, 하위 미선택 시 빈 폼+버튼숨김.

---

## 13. 인라인 그리드 편집

코드성 마스터 (등급·태그·코드 등) 에 적용.

```js
const addRow       = () => gridRows.unshift({ id: _tempId--, useYn: 'Y', _row_status: 'N' });
const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
```

행 스타일: `{'table-row-new': _row_status==='N', 'table-row-mod': _row_status==='U'}`

---

## 14. 일괄 작업 (Bulk Action)

Order / Claim / Dliv Mng 다건 처리.

- 좌측 체크박스 + 전체선택
- `📝 변경작업 선택` 버튼 (선택 > 0 시 활성)
- 모달 탭: 상태변경 / 결제수단 / 클레임유형 / 택배정보 / 결재처리 / 추가결재요청
- 하단 `📋 작업내용` textarea 자동 생성

---

## 15. 공개/비공개 전환 버튼

```html
<td style="text-align:center" @click.stop>
  <button :class="['btn','btn-xs', row.useYn==='Y'?'btn-secondary':'btn-green']"
          @click="toggleUse(row)">
    {{ row.useYn==='Y' ? '비공개' : '공개' }}
  </button>
</td>
```

---

## 16. 참조 모달 (showRefModal)

다른 엔티티(회원·상품·주문 등) 검색·선택 팝업.

```js
props.showRefModal({ type: 'member', onSelect: (m) => { form.memberId = m.userId; } });
```

---

## 관련 정책
- `sy.51.프로그램설계정책.md` — 초기값·데이터 정렬·ID 표시
- `base.기술-admin.md` — 컴포넌트 등록 4단계·Props 표준·boApi 저장/삭제 패턴

---

## 17. 팝업/모달 오픈 시 API 재조회 정책

**원칙**: 모든 선택 팝업(목록·트리·피커)은 오픈 시점에 최신 데이터를 API에서 재조회한다.

### 17.1 일반 선택 모달 (`open*Modal`)

```js
// ✅ 올바른 패턴 — async + 재조회 후 show = true
const openCatModal = async () => {
  await handleSearchList('DEFAULT'); // 최신 데이터 로드
  catModal.show = true;
};

// ❌ 잘못된 패턴 — 캐시된 데이터로 팝업 표시
const openCatModal = () => {
  catModal.show = true;
};
```

### 17.2 표시경로 선택 팝업 (`PathPickModal`)

`PathPickModal` 컴포넌트 자체가 `onMounted`에서 `/bo/sy/path/page` API를 호출하여  
`window._boCmPaths`를 갱신한다. 각 화면의 `openPathPick`에서 별도 재조회 불필요.

```js
// PathPickModal 내부 (BaseModals.js) — 마운트 시 자동 재조회
Vue.onMounted(async () => {
  const res = await boApi.get('/bo/sy/path/page', { params: { pageNo: 1, pageSize: 10000 }, ...coUtil.apiHdr('표시경로', '목록조회') });
  const list = res.data?.data?.pageList || [];
  if (list.length > 0) window._boCmPaths = list;
  expandLevels(2);
});
```

### 17.3 적용 범위

| 유형 | 재조회 방법 | 적용 파일 |
|------|------------|---------|
| 상위카테고리 선택 | `await handleSearchList()` | `PdCategoryMng` |
| 카테고리 선택 | `await handleSearchList()` | `PdProdMng` |
| 부서 선택 | `await handleSearchList()` | `SyDeptMng`, `SyUserDtl` |
| 메뉴 선택 | `await handleSearchList()` | `SyMenuMng` |
| 역할 선택 | `await handleSearchList()` | `SyRoleMng`, `SyVendorUserMng` |
| 경로 선택 | `PathPickModal` 내부 자동 처리 | 전체 (18개 파일) |
| 회원 선택 | `await handleSearchData()` | `MbCustInfoMng` |

---

## 18. 상세화면 탭별 저장 후 재조회 정책 ⭐

상세(Dtl) 화면이 여러 탭으로 구성된 경우, 각 탭의 [저장] 버튼은 **해당 탭만 부분 저장**하는 패턴이다.
저장 후 화면 정합성을 보장하려면 **저장된 영역을 다시 서버에서 가져와 상태를 동기화**해야 한다.

### 18.1 핵심 규칙

1. **저장한 탭의 데이터를 즉시 재조회한다**
   - 저장 응답으로 받은 값에 의존하지 않는다 (백엔드 보정 필드·sortOrd 재계산 등 누락 위험)
   - 항상 GET API 를 다시 호출해 화면 reactive 를 새로 채운다

2. **첫 번째 탭(기본정보)의 저장은 상위 목록(Mng) 도 재조회한다**
   - 첫 탭은 보통 Mng 그리드 컬럼에 노출되는 핵심 필드(상품명·상태·가격 등)를 다룸
   - Mng 행 정보가 즉시 갱신되어야 사용자에게 일관된 결과로 보임

3. **재조회는 `await` 으로 순차 실행 — 화면 깜빡임 방지**
   - 저장 → 재조회 사이에 다른 사용자 액션이 끼면 안 됨
   - 저장 성공 toast 와 재조회 완료가 동시에 노출되어야 자연스러움

### 18.2 표준 패턴

```js
const handleSave = async () => {
  const tabId = uiState.activeTab;
  // ...payload 구성...
  try {
    const res = (tabId === 'content')
      ? await boApiSvc.pdProd.saveContents(prodId, payload, '상품관리', '상품설명저장')
      : await boApiSvc.pdProd.update(prodId, payload, '상품관리', `${TAB_LABEL[tabId]}저장`);

    /* ① 저장한 탭 데이터를 다시 가져와 화면 동기화 */
    await reloadTabData(tabId);

    /* ② 첫 번째 탭(기본정보)이면 상위 목록도 재조회 */
    if (tabId === 'base' && props.onListReload) {
      await props.onListReload();   // 또는 emit('list-reload')
    }

    showToast('저장되었습니다.', 'success');
  } catch (err) { /* ... */ }
};

/* 탭별 재조회 — Mng/Dtl 양쪽에서 재사용 가능하게 분리 */
const reloadTabData = async (tabId) => {
  switch (tabId) {
    case 'base':    return handleLoadBase();      // GET /{id}
    case 'content': return handleLoadContents();  // GET /{id}/contents
    case 'option':  return handleLoadOpts();      // GET /{id}/opts
    case 'price':   return handleLoadSkus();      // GET /{id}/skus
    case 'image':   return handleLoadImages();    // GET /{id}/images
    case 'related': return handleLoadRels();      // GET /{id}/rels
  }
};
```

### 18.3 적용 대상 (예시)

| 화면 | 저장 단위 | 첫 탭 | 첫 탭 저장 후 Mng 재조회 |
|---|---|---|---|
| `PdProdDtl` 상품관리 | 기본정보/상품설명/옵션설정/옵션(가격재고)/이미지/연관상품 | 기본정보 | ✅ 상품 목록 |
| `OdOrderDtl` 주문관리 | 기본/배송/결제/이력 | 기본 | ✅ 주문 목록 |
| `OdClaimDtl` 클레임 | 기본/처리/이력 | 기본 | ✅ 클레임 목록 |
| `OdDlivDtl` 배송 | 기본/이력 | 기본 | ✅ 배송 목록 |
| `PmCouponDtl` 쿠폰 | 기본/사용내역 | 기본 | ✅ 쿠폰 목록 |
| `PmEventDtl` 이벤트 | 기본/대상/이력 | 기본 | ✅ 이벤트 목록 |
| `MbCustInfoMng` 고객종합정보 | 9개 영역 탭 | 기본 | ✅ (회원 그리드와 연동 시) |
| `DpDispUiDtl`, `DpDispAreaDtl` 등 전시 | 기본/하위 항목 | 기본 | ✅ 상위 Mng |

### 18.4 안티패턴 (금지)

```js
// ❌ 저장 응답으로 화면 직접 갱신 — 백엔드 보정 필드 누락 위험
const res = await boApiSvc.pdProd.saveContents(prodId, payload);
contentBlocks.splice(0, contentBlocks.length, ...res.data.data);   // 응답 신뢰 금지

// ❌ 첫 탭 저장 후 Mng 미갱신 — 사용자가 목록에서 옛 데이터를 봄
await boApiSvc.pdProd.update(prodId, baseForm);
showToast('저장되었습니다.');
// ← Mng 그리드에 옛 상품명·상태가 그대로 남아있음

// ❌ 재조회 미사용 — sortOrd, regDate 등 서버 계산 필드 비동기화
await boApiSvc.pdProd.saveContents(prodId, { contentBlocks });
// ← 화면의 contentBlocks 는 sortOrd 가 없거나 임시 ID 만 가진 상태
```

### 18.5 부모-자식 컴포넌트 간 재조회 신호 전파

Mng 안에 Dtl 이 인라인 임베드된 경우(§12.1), Dtl 의 첫 탭 저장 시 부모 Mng 의 목록을 재조회하려면:

```js
// Dtl props
props: {
  navigate:     { type: Function, required: true },
  onListReload: { type: Function, default: () => {} },   // 부모가 전달한 재조회 함수
}

// Mng — Dtl 임베드 시 onListReload 전달
<pd-prod-dtl :dtl-id="cfDetailEditId" :on-list-reload="handleSearchList" ... />
```

또는 **`reloadTrigger` props 패턴**(자식이 emit, 부모가 watch)도 가능. MEMORY 의 「Modal reloadTrigger 표준」과 동일한 사상.

---

## 19. 그리드 행간 드래그앤드롭 순서 변경 정책 ⭐ (2026-05-30 갱신)

### 19.1 즉시 저장 vs 묶음 저장 — 구분 기준

**기본 원칙**: 그리드 행간 드래그앤드롭으로 순서를 변경할 때 `sort_ord` 즉시 저장이 가능한 화면과 그렇지 않은 화면을 구분한다.

| 분류 | 즉시 저장 적용 | 비고 |
|---|---|---|
| **격리된 첨부·이미지 정렬 영역** | ✅ **즉시 저장** | BaseAttachGrp 등 — 다른 편집과 독립. 드롭 즉시 `PATCH .../sort` 호출 |
| **CRUD 그리드** (`_row_status` 사용) | ✅ **즉시 저장 + 재조회** | SyCodeMng / PdCategoryMng 등 — 기존 행(`_row_status` C/I/D 아닌 행)에 한해 `{ keyId, sortOrd, rowStatus:'U' }` 만 추출하여 `POST /bo/*/*/save-list/order` 호출. 응답 성공 시 `handleSearchList()` 로 목록 재조회 |
| **Dtl 내부 자식 리스트** | ❌ **묶음 저장 유지** | PdProdDtl 옵션·이미지·SKU / PdBundleMng·PdSetMng 자식 카테고리·아이템 — 부모 Dtl [저장]에 종속 |
| **DELETE+INSERT 전체 교체 API** | ❌ **묶음 저장 유지** | `updateProds` 처럼 전체 삭제 후 재삽입 패턴은 부분 sort 전송 불가능 → [저장] 버튼 유지 |
| **미리보기/시뮬레이션** | — | DpDispAreaPreview 등 — DB 저장 없음, 시각적 reorder 만 |

### 19.2 격리된 첨부 정렬 즉시 저장 표준 패턴 (BaseAttachGrp)

```js
const onDrop = async (toIdx) => {
  const from = dragState.fromIdx;
  dragState.fromIdx = null;
  if (from === null || from === toIdx) return;
  const moved = files.splice(from, 1)[0];
  files.splice(toIdx, 0, moved);
  /* sort_ord 즉시 저장 (드롭 시 서버 반영) */
  files.forEach((f, i) => { f.sortOrd = i + 1; });
  try {
    await Promise.all(files.map((f, i) =>
      window.boApi.patch(`co/cm/upload/attach/${f.attachId}/sort`,
        { sortOrd: i + 1 }, window.coUtil.cofApiHdr('첨부파일', '순서변경'))
    ));
    props.showToast('순서가 저장되었습니다.', 'success');
  } catch(e) {
    console.error('[xxx] sort update failed', e);
    props.showToast(e.response?.data?.message || '순서 저장 실패', 'error', 0);
  }
};
```

### 19.3 CRUD 그리드 정렬 즉시 저장 + 재조회 표준 패턴 ⭐

**전제조건**:
1. Entity·VO 필드에 default 값 없음 (selective update 안전성 보장 — [[entity_vo_no_defaults]])
2. Service.saveList 가 `CmUtil.requireRowIds` 로 키 검증 ([[service_id_validation_required]])
3. Service.saveList 에 `cmd='order'` 분기 — `sortOrd` 만 update (다른 필드 보호)
4. Controller 에 `@PostMapping("/save-list/{cmd}")` 노출
5. `boApiSvc.xxx.saveList(cmd, rows, uiNm, cmdNm)` 시그니처 ([[save_savelist_cmd_first_arg]])

**프론트 드롭 핸들러 표준**:
```js
const onDragEnd = async () => {
  /* 1) BoGridCrud reorder emit 시점에 행 순서는 이미 in-place 변경된 상태 */
  const sortChangedRows = [];
  gridRows.forEach((r, i) => {
    const newOrd = i + 1;
    if (r.sortOrd !== newOrd) {
      r.sortOrd = newOrd;
      /* 신규('I')/삭제('D')는 제외 — 기존 행만 즉시 정렬 저장 */
      if (r._row_status !== 'I' && r._row_status !== 'D' && r.xxxId != null) {
        sortChangedRows.push({ xxxId: r.xxxId, sortOrd: newOrd, rowStatus: 'U' });
        if (r._row_status === 'N') r._row_status = 'U';
      }
    }
  });
  if (sortChangedRows.length > 0) {
    try {
      /* 2) cmd='order' 로 호출 → URL: /bo/*/*/save-list/order */
      await boApiSvc.xxx.saveList('order', sortChangedRows, '화면명', '순서변경');
      showToast?.('순서가 저장되었습니다.', 'success');
      /* 3) 재조회 — 서버 보정값(sortOrd 재계산, updDate 등)을 화면에 반영 */
      await handleSearchList();
    } catch (err) {
      console.error('[XxxMng] sort save failed', err);
      showToast?.(err.response?.data?.message || '순서 저장 실패', 'error', 0);
    }
  }
};
```

**서버 Service saveList `'order'` 분기 표준** (참조: [`SyCodeService.saveList`](../../_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyCodeService.java)):
```java
@Transactional
public void saveList(String cmd, List<Xxx> rows) {
  if ("base".equals(cmd)) { /* 기본 I/U/D/M 일괄 처리 */ ... return; }
  if ("order".equals(cmd)) {
    /* sortOrd 전용 selective update — 다른 필드 절대 덮어쓰지 않음 */
    CmUtil.requireRowIds(rows, Xxx::getXxxId, "U", "xxxId", this);
    String authId = SecurityUtil.getAuthUser().authId();
    for (Xxx row : rows) {
      if (row.getSortOrd() == null) continue;
      Xxx patch = new Xxx();
      patch.setXxxId(row.getXxxId());
      patch.setSortOrd(row.getSortOrd());
      patch.setUpdBy(authId);
      int affected = xxxRepository.updateSelective(patch);
      if (affected == 0) throw new CmBizException("정렬 저장 대상 행이 존재하지 않습니다: " + row.getXxxId());
    }
    em.flush(); em.clear();
    return;
  }
  throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
}
```

**핵심 규칙**:
1. **신규/삭제 행 제외** — `_row_status` 가 `I`/`D` 이거나 키가 `null` 인 행은 sort 전송 대상에서 제외 (다른 편집은 [저장] 버튼에 위임)
2. **selective update** — `sortOrd` + `updBy` 만 set 한 patch entity 로 `updateSelective` 호출 → 다른 필드 보존
3. **재조회 필수** — 저장 성공 후 `handleSearchList()` 로 깨끗한 상태 복귀 (수동 `_row_status` 정리 코드 제거)
4. **에러 핸들링** — 실패 시 토스트 + console.error
5. **변형 cmd 라우팅** — `'order'` 외에 도메인별로 `'priority'`, `'visibility'` 등 추가 가능 (URL `/save-list/{cmd}` 로 자동 라우팅)

### 19.4 적용 현황 (2026-05-30)

- ✅ **BaseAttachGrp** — 첨부 파일 정렬 드롭 즉시 저장
- ✅ **SyCodeMng** — `boApiSvc.syCode.saveList('order', ...)` + `handleSearchList()` 재조회
- ✅ **PdCategoryMng** — `boApiSvc.pdCategory.saveList('order', ...)` + `handleSearchList()` 재조회 (이전의 수동 `_row_status` 정리 로직 제거)
- ❌ **PdCategoryProdMng** — 전체 교체 API(`updateProds`) 패턴, 묶음 저장 유지
- ❌ **PdProdDtl / PdBundleMng / PdSetMng / DpDispWidgetDtl / DpDispPanelMng** — Dtl 자식 리스트, 부모 [저장]에 종속

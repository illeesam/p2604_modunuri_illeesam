---
정책명: 관리자(Back Office) UX 정책
정책번호: base-UX-admin
관리자: 개발팀
최종수정: 2026-04-19
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
  <div class="tab-view-modes">
    <button class="tab-view-mode-btn" :class="{active: viewMode==='tab'}"  @click="setViewMode('tab')">📑</button>
    <button class="tab-view-mode-btn" :class="{active: viewMode==='1col'}" @click="setViewMode('1col')">1▭</button>
    <button class="tab-view-mode-btn" :class="{active: viewMode==='2col'}" @click="setViewMode('2col')">2▭</button>
    <button class="tab-view-mode-btn" :class="{active: viewMode==='3col'}" @click="setViewMode('3col')">3▭</button>
    <button class="tab-view-mode-btn" :class="{active: viewMode==='4col'}" @click="setViewMode('4col')">4▭</button>
  </div>
</div>

<!-- 콘텐츠 영역 -->
<div class="dtl-tab-grid" :class="viewModeClass">
  <div class="dtl-tab-card-title">기본정보</div>  <!-- 2/3/4열에서만 보임 -->
  ...
</div>
```

뷰모드별 grid class:

| 버튼 | viewMode | grid class |
|---|---|---|
| 📑 탭 | `tab` | 탭 패널 표시 (단일 컬럼) |
| 1▭ | `1col` | `dtl-tab-grid cols-1` |
| 2▭ | `2col` | `dtl-tab-grid cols-2` |
| 3▭ | `3col` | `dtl-tab-grid cols-3` + max-width 해제 |
| 4▭ | `4col` | `dtl-tab-grid cols-4` + max-width 해제 |

뷰모드 상태 영속화: `window._ec{X}DtlState.viewMode` (행 전환에도 유지)

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

### 9.1 레이아웃

`search-bar` = flex row, 항목 간 8px gap. 버튼은 `search-actions` div 로 우측 정렬.

```html
<div class="card">
  <div class="search-bar">
    <label class="search-label">항목명</label>
    <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="...">
    <label class="search-label">상태</label>
    <select class="form-control" v-model="searchStatus">...</select>
    <div class="search-actions">
      <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
      <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
    </div>
  </div>
</div>
```

### 9.2 적용 정책

- Enter 키 → 검색 실행 (`@keyup.enter="onSearch"`)
- "초기화" → 화면 검색 필드만 초기화 (공통 필터 값 유지)
- 검색 실행 시 `pager.page = 1` 리셋 필수
- `applied` reactive 객체를 통해 filter computed 참조 (`searchKw` 직접 참조 금지)
- 화면 오픈 시 공통 필터 자동 적용 후 즉시 검색 (§8.3)

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

---

## 11. 페이지네이션

```html
<div class="pagination" v-if="totalPages > 1">
  <button class="pager" @click="setPage(pager.page-1)" :disabled="pager.page===1">◀</button>
  <button v-for="n in pageNums" :key="n" class="pager" :class="{active:n===pager.page}" @click="setPage(n)">{{ n }}</button>
  <button class="pager" @click="setPage(pager.page+1)" :disabled="pager.page===totalPages">▶</button>
</div>
```

pageNums (현재 ±2, 최대 5개):
```js
const pageNums = computed(() => {
  const c=pager.page, l=totalPages.value, s=Math.max(1,c-2), e=Math.min(l,s+4);
  return Array.from({length:e-s+1},(_,i)=>s+i);
});
```

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

### 12.2 Dtl 탭 + 뷰모드

Order / Claim / Dliv / Prod / Event / Cache / Coupon / Chatt Dtl — 5개 뷰모드 지원 (§6.5).  
Hist 컴포넌트가 Dtl 의 "hist" 탭 안에 임베드되는 경우 뷰모드 버튼 제거, 항상 tab 모드.

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
- `base.기술-admin.md` — 컴포넌트 등록 4단계·Props 표준·adminApiCall 패턴

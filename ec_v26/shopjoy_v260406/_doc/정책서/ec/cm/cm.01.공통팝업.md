<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# cm.01. 공통 선택 팝업 (cmPopup)

전 화면의 "무엇을 고르는" 팝업을 **메타 테이블 1쌍 + 컴포넌트 1개 + 컨트롤러 1개**로 처리하는 구조.
타입별 모달 컴포넌트·타입별 DTO·타입별 컨트롤러를 만들지 않는다.

---

## 1. 구성

| 층 | 산출물 | 비고 |
|---|---|---|
| 메타 | `cm_popup` / `cm_popup_item` | 팝업 정의 · 조회항목/목록컬럼 정의 |
| 백엔드 | `CmPopupPickService` | 동적 JPQL. 식별자는 화이트리스트 정규식 검증 |
| 백엔드 | `BoCmPopupPickController` (`/api/bo/cm/cmPopupPick`) | 관리자. 정의 CRUD 도 여기 |
| 백엔드 | `FoCmPopupPickController` (`/api/fo/cm/cmPopupPick`) | 사용자. 조회 전용 (정의 CRUD 없음) |
| 프론트 | `components/modals/BoCmPopupModal.js` → `<bo-cm-popup-modal>` | BO 전 화면 |
| 프론트 | `components/modals/FoCmPopupModal.js` → `<fo-cm-popup-modal>` | FO 전 화면 |
| 관리화면 | `CmPopupMng` / `CmPopupItemMng` | 좌측메뉴 `화면관리` |

`popupCode` 하나로 조회항목·목록컬럼·트리·페이징·다중선택·모달폭이 전부 결정된다.
새 선택 팝업이 필요하면 **코드를 쓰지 않고 팝업관리 화면에서 등록**한다.

---

## 2. 화면패턴

| 값 | 이름 | 구성 |
|---|---|---|
| 1 | 조회 + 목록 | 검색영역 + 그리드 (+ 페이저) |
| 2 | 조회 + 트리 + 목록 | 좌측 트리로 목록을 좁힌다 |
| 3 | 트리 전용 | 트리에서 바로 선택. 목록 없음 |

트리는 **같은 엔티티의 자기참조**(`parent_field`)와 **다른 엔티티**(`tree_entity_nm` + `tree_link_field`) 둘 다 지원한다.
트리 노드를 고르면 그 **하위 전체**(`idIn`)로 목록을 좁힌다 — 직계 자식만 나오지 않는다.

---

## 3. 사용 시스템 범위 (`sys_scope`)

`^` 로 감싼 멀티값. `^BO^` / `^BO^FO^`. BO·FO 컨트롤러가 각각 자기 값이 있는 팝업만 허용한다
(`CmPopupPickService.assertSysScope`). 관리자 전용 대상(사용자·권한·메뉴·부서·사이트 등)이
사용자 화면으로 노출되는 것을 서버에서 막는다.

```
FO 공개  (^BO^FO^) : prod prodByCategory category brand bbm     ← 공개 카탈로그
FO 본인만 (^FO^)   : myMemberOrder myMemberClaim myMemberCoupon        ← session_cond_field
                     myMemberAddr myMemberReview myMemberQna
BO 전용  (^BO^)    : member order coupon user userByDept dept role menu site vendor
                     code codeGrp path widgetLib event plan voucher gift save discnt
```

팝업관리 화면의 `사용 시스템` 멀티체크로 바꾼다. FO 에서 BO 전용 팝업을 열면
`"FO 에서 사용할 수 없는 팝업입니다: {popupCode}"` 로 거절된다.

### 3.1 ⛔ FO 노출 조건은 둘 중 하나

`SecurityConfig` 에서 `/api/fo/**` 는 기본 `permitAll` 이라 **FO 경로는 비로그인으로도 열린다**.
따라서 FO 로 내보낼 수 있는 것은 다음 둘뿐이고, 그 외는 `sys_scope` 가 켜져 있어도 서버가 거절한다.

| 조건 | 판정 | 예 |
|---|---|---|
| **공개 카탈로그 엔티티** | `CmPopupPickService.FO_ALLOWED_ENTITIES` 에 있어야 함 — `PdProd` `PdCategory` `SyBrand` `SyBbm` `PdTag` | `prod` `category` `brand` `bbm` |
| **소유자 한정** | `cm_popup_item.session_cond_field` 지정 — 로그인 본인 것만 나온다 | `myMemberOrder` (`memberId`) |

`sys_scope` 는 관리자가 팝업관리 화면에서 바꿀 수 있으므로 **그 값만 믿지 않는다.**

```
FO 에 공개할 수 없는 대상입니다: member(MbMember) — 공개 카탈로그가 아니면 항목에 session_cond_field 로 소유자를 한정해야 합니다
```

### 3.2 `session_cond_field` — 본인 것만 고르게 하기

`cm_popup_item.session_cond_field` 에 **로그인 정보의 속성명**을 넣으면, 그 항목의 `field_nm` 에
서버가 조건을 강제한다.

```
AND a.{field_nm} = <세션의 {session_cond_field}>
```

- **클라이언트가 같은 이름으로 파라미터를 보내도 무시된다** (덮어쓰기 불가)
- `search_yn` 과 무관하게 항상 적용되며, **조회영역에 렌더되지 않는다** (사용자 입력란이 아님)
- `session_cond_field` 가 있으면 `required_yn='Y'` 가 강제된다 (항목 저장 시 서버가 설정)
- 조건이 여러 개면 **항목 행을 여러 개** 둔다 (콤마 나열 아님)

허용 속성 — `CmPopupPickService.SESSION_ATTRS`:
```
memberId  userId  vendorId  deptId  siteId  roleId  memberGrade
```

> `authId` 는 일부러 제외했다. BO 는 관리자ID, FO 는 회원ID 로 값이 갈려 같은 팝업을 양쪽에서
> 쓰면 조용히 다른 대상을 필터한다. `userId`/`memberId` 로 명시하게 해서 저장 시점에 막는다.

거절 메시지는 두 상황을 구분한다.
```
로그인이 필요한 팝업입니다: myMemberOrder (회원)                       ← 미로그인
로그인 정보에 부서 값이 없어 조회할 수 없습니다: myDeptUser (deptId)   ← 로그인했으나 부서 미배정
```

### 3.3 팝업코드 규칙 — `my{신원}{대상}`

세션 한정 팝업은 이름에 **세션 한정 여부(`my`)와 신원**을 함께 담는다. 전체 조회용과 본인 한정용은
**분리 등록**한다 — 하나를 겸용하면 `sys_scope` 하나 잘못 켰을 때 전체 데이터가 새어나가고,
BO 에서는 `authId` 가 회원ID 가 아니라 0 건이 된다.

| 팝업코드 | 엔티티 | session_cond_field | sys_scope |
|---|---|---|---|
| `order` | OdOrder | (없음) | `^BO^` |
| `myMemberOrder` | OdOrder | `memberId` | `^FO^` |
| `myMemberClaim` | OdClaim | `memberId` | `^FO^` |
| `myMemberCoupon` | PmCouponIssue | `memberId` | `^FO^` |
| `myMemberAddr` | MbMemberAddr | `memberId` | `^FO^` |
| `myMemberReview` | PdReview | `memberId` | `^FO^` |
| `myMemberQna` | PdProdQna | `memberId` | `^FO^` |
| `myVendorProd` | PdProd | `vendorId` | `^BO^` |
| `myDeptUser` | SyUser | `deptId` | `^BO^` |

신원이 2개여도 이름에 다 붙이지 않고 **좁은 쪽으로만** 부른다 (`myDeptOrder` 가 이미 요청자의
부서를 함의하므로 `userId` 조건이 함께 걸려도 이름은 그대로).

> 이력: 2026-07-26 최초 `sys_scope` 투입 시 `member`/`order`/`coupon` 을 `^BO^FO^` 로 열어
> 인증 없이 회원·주문·쿠폰이 조회되는 상태였다. `migration_20260726_cm_popup_fo_scope_fix.sql`
> 로 회수하고 화이트리스트를 2차 방어로 추가했다. 이어 `cm_popup.owner_field` 를 잠시 도입했으나
> 항목 단위가 더 일반적이라 `migration_20260726_cm_popup_item_session.sql` 로
> `cm_popup_item.session_cond_field` + `required_yn` 으로 옮기고 `owner_field` 는 DROP 했다.
> 전용 모달(`OrderPickModal`, 249줄)은 이때 삭제됐다.

### 3.4 `required_yn` — 필수 조회조건

`'Y'` 면 값이 없을 때 조회를 거절한다. 대용량 목록을 조건 없이 전체 스캔하는 것을 막는 용도다.

- 프론트는 라벨에 `*` 를 붙이고, 미입력 상태로 `[조회]` 를 누르면 토스트로 막는다
- **팝업을 열 때 자동 조회하지 않는다** — 그리드에 "필수 조회조건을 입력하고 [조회] 를 누르세요" 표시
- 세션 자동값 항목은 서버가 값을 채우므로 이 검사에서 제외된다

```
조회 조건이 필요합니다: 주문일시
```

### 3.5 조인 출력 — 다른 테이블의 라벨을 목록에 표시

`SyUser` 는 `deptId` 만 갖고 부서명이 없다. 이런 **FK 라벨**은 조인으로 가져온다.

| 설정 | 위치 | 값 예시 |
|---|---|---|
| 조인절 | `cm_popup.join_clause` | `LEFT JOIN SyDept b ON b.deptId = a.deptId` |
| 출력식 | `cm_popup_item.select_expr` | `b.deptNm` (항목의 `field_nm` 은 `deptNm`) |

생성 JPQL:
```sql
SELECT a, b.deptNm FROM SyUser a LEFT JOIN SyDept b ON b.deptId = a.deptId WHERE ... ORDER BY a.userNm ASC
```

드라이빙 엔티티는 **`SELECT a` 로 통째로 가져오고**(호출부가 임의 필드를 꺼내 쓰므로) 조인 컬럼만
뒤에 덧붙인다. 결과 맵에는 `field_nm` 키로 담기므로 목록컬럼 정의(`field: 'deptNm'`)가 그대로 동작한다.

**제약 — 의도적으로 좁혔다.**

| 항목 | 허용 |
|---|---|
| 조인 종류 | `LEFT JOIN` + 단일 등가조건만. `LEFT JOIN <Entity> <별칭> ON <별칭>.<필드> = a.<필드>` 반복 |
| 별칭 | 드라이빙은 **항상 `a`**, 조인은 `b`~`z` |
| 출력식 | `<별칭>.<필드>` 하나만. 함수·연산 금지 |
| 카디널리티 | **to-one 만** — to-many 를 걸면 드라이빙 행이 불어나 `COUNT`/페이징이 어긋난다 |

검증은 `SAFE_JOIN` / `SELECT_EXPR` 정규식이 한다. 형태를 벗어나면 거절한다.

> **유형이 CODE 인 항목은 조인이 필요 없다.** `code_grp` 을 주면 프론트가 `sy_code` 라벨로
> 표시한다(`codeMap`). 즉 `saveTypeCd` 의 라벨은 `field_type_cd='CODE'` + `code_grp` 으로 끝나고,
> 조인은 **다른 테이블에 이름이 있는 경우**(부서명·브랜드명·업체명)에만 쓴다.

적용 예: `user`(부서명) / `myVendorProd`(브랜드명 + 업체명, 조인 2개).

### 3.6 드라이빙 별칭은 항상 `a`

생성 JPQL 의 주 엔티티 별칭은 `a` 로 고정한다(`CmPopupPickService.A`). 따라서 DB 에 저장하는
`order_by` / `base_where` / `select_expr` 도 모두 `a.` 를 쓴다.

```
order_by   : a.userNm ASC
base_where : a.useYn = 'Y'
select_expr: b.deptNm      ← 조인 별칭
```

> 이력: 원래 `e` 였고 2026-07-26 `a` 로 통일했다. `order_by`/`base_where` 는 DB 에 별칭이 박힌
> 문자열이라 `migration_20260726_cm_popup_join_select.sql` 에서 33건을 함께 치환했다.
> 새 팝업을 등록할 때 `e.` 를 쓰면 `Could not interpret path expression 'e.xxx'` 로 실패한다.

### 3.7 공통팝업으로 대체할 수 없는 것

공통팝업은 **"목록/트리에서 골라 값을 돌려주는"** 용도다. 다음은 성격이 달라 대체 대상이 아니다.

| 유형 | 예 | 이유 |
|---|---|---|
| 상세 보기 모달 | `OrderDetailModal` `ProductModal` `CustomerModal` | 한 건의 전체 정보를 보여줌 — 고르는 화면이 아니다 |
| 입력 폼 모달 | 리뷰 작성, 교환·반품 신청, 도움말 | 폼/안내이며 선택 결과가 없다 |
| 판단 지원 모달 | `BoRoleSelectModal` (SyVendorUserMng) | 좌측 역할 트리 + **우측 메뉴권한 매트릭스**(SyMenu × SyRoleMenu 조인)를 함께 보여주고, 업체유형에 따라 선택 가능 역할이 갈린다. 단일 엔티티 조회로는 표현 불가 |

---

## 4. 호출 규약

```html
<!-- 단일 선택 -->
<bo-cm-popup-modal popup-cmd="cmPopup-vendor-pick" popup-code="vendor"
  :show="uiState.showVendor" :on-callback="fnCallbackModal" />

<!-- 다중 선택 + 이미 고른 것 미리 체크 → [선택] 로 확정 -->
<fo-cm-popup-modal popup-cmd="cmPopup-category-pick" popup-code="category"
  :multi="true" result-type="array"
  :show="uiState.showCatModal" :init-selected-ids="[...selectedCatIds]"
  :on-callback="fnCallbackModal" />

<!-- 즉시 토글 (체크박스 목록처럼. 닫히지 않고 건건이 알린다) -->
<bo-cm-popup-modal popup-cmd="cmPopup-prod-pick" popup-code="prod" result-type="id"
  :show="showProdPopup" :selected-ids="form.productIds" @toggle="onProdToggle" />
```

### 4.1 주요 속성

| 속성 | 뜻 |
|---|---|
| `popup-code` | **필수**. `cm_popup.popup_code` |
| `popup-cmd` | 콜백 1번째 인자로 되돌아오는 식별자. `cmPopup-` 접두어 |
| `multi` | 다중선택. 미지정이면 `cm_popup.multi_yn` 을 따른다 |
| `result-type` | `row`(기본) / `id` / `array` / `idArray` |
| `init-selected-ids` | **확정 모드** 프리체크. `[선택]` 을 눌러야 확정 |
| `selected-ids` | **토글 모드** 프리체크. 클릭 즉시 `@toggle`, 모달 유지 |
| `exclude-ids` / `exclude-id` | 목록에서 제외 (Array / String) |
| `init-param` | 고정 필터 (예: `{ bizCd: 'X' }`). 트리에도 적용된다 |
| `clearable` | "상위 없음 / 전체" 선택 허용 |

`init-selected-ids` 와 `selected-ids` 는 **서로 다른 모드**다. 헷갈리면 안 된다 —
`selected-ids` 를 주면 확정 버튼이 사라지고 즉시 토글로 동작한다.

### 4.3 ⭐ 다중선택 표준 — "프리체크 + 전체 교체"

여러 건을 담는 자리(공유대상·태그·담당자 등)는 **다음 형태를 표준으로 한다.**

```html
<bo-cm-popup-modal popup-code="user" :multi="true" result-type="array"
  :init-selected-ids="cfPickedUserIds"   <!-- 이미 담은 것이 체크된 채로 열린다 -->
  @select="onPickUser" @close="pickModal.user = false" />
```

| 규칙 | 이유 |
|---|---|
| `init-selected-ids` 로 **기존 선택을 프리체크** | 팝업만 열면 지금 뭐가 담겼는지 보인다. `exclude-ids` 로 숨기면 확인이 안 된다 |
| 결과는 **최종 전체 집합** → 해당 유형을 **통째 교체** | 팝업에서 해제한 것이 빠져야 한다. 추가만 되면 제거를 화면에서 또 해야 한다 |
| **0건 확정 = 전부 비우기** 허용 | 편집 모드이므로 "전부 해제" 가 표현돼야 한다. `init-selected-ids` 가 있을 때만 허용 |
| `exclude-ids` 는 **고를 수 없는 대상**에만 | 예: 공유대상에서 소유자 자신 |

```js
/* 해당 유형만 교체 — 다른 유형은 유지 */
const fnReplaceTargets = (type, rows) => {
  const keep = shareForm.targets.filter(t => t.type !== type);
  shareForm.targets = keep.concat(fnToRows(rows).map(/* … */));
};
```

**배치**: 버튼과 선택칩은 **한 줄**에 둔다 — 라벨 · [추가 버튼] · 건수배지 · 칩들(우측). 칩이 넘치면
줄바꿈하지 말고 앞의 N개만 두고 **`＋N`** 으로 접는다(`＋N` 클릭 = 팝업 열기 → 전체 확인·정리).
칩 하나가 길면 `max-width` + `text-overflow: ellipsis`.

```
공유대상(사용자)  [👤 사용자 추가] [7건]  👤 홍길동 ✕  👤 김철수 ✕  …  ＋2
```

적용: `CmDashboardMyMng` 공유대상(사용자/부서). 두 란은 `cfShareGroups` 메타 하나로 같은 마크업을 돌려 쓴다.

### 4.2 콜백

```js
const fnCallbackModal = (popCmd, param, result) => {
  if (popCmd === 'cmPopup-category-pick') {
    if (result == null) { uiState.showCatModal = false; return; }   // 닫기
    return onCatApply(result);
  }
};
```

| 인자 | 내용 |
|---|---|
| `popCmd` | `popup-cmd` (없으면 `popup-code`) |
| `param` | **호출 시 넘긴 파라미터** — `{ popupCode, multi? }` |
| `result` | `result-type` 에 따른 선택 결과. 닫기는 `null` |

`@response` 이벤트로는 전문을 받는다 — `{ popCmd, params, resultType('object'|'list'), resultObj, resultList }`.
빈 값 기본은 `resultObj: {}` / `resultList: []`.

---

## 5. 관리 화면

- **팝업관리** — 정의(패턴·엔티티·ID/표시명 필드·트리·페이징·다중·모달폭·사용 시스템·적용 UI)
- **팝업항목관리** — 좌측 팝업 목록 + 우측 조회항목/목록컬럼(세션조건·필수 포함)

`apply_ui_memo` 컬럼에 **이 팝업을 쓰는 화면 파일명**을 나열한다 (예: `PdProdDtl.js, OdOrderDtl.js`).
팝업 정의를 고치면 여기 적힌 화면 전부에 즉시 반영되므로, **수정 전 영향 범위를 이 값으로 확인**한다.
갱신은 소스에서 `popup-code="..."` 사용처를 추출해 채웠다.

두 화면 모두 행 `관리` 란의 `👁 미리보기` / `👁 멀티` 로 **실제 팝업을 그 자리에서 열어**
`호출 정보`(JSON) · `사용 예제`(마크업) · `콜백 인자`(popCmd / param / result)를 확인할 수 있다.

---

## 6. 주의

- 팝업 정의를 바꾸면 그 팝업을 쓰는 **모든 화면에 즉시 반영**된다. 공용임을 전제로 수정한다.
- `base_where` / `order_by` 는 JPQL 조각이 그대로 들어간다. 화이트리스트 정규식을 통과하는
  식별자만 허용되지만, 값은 관리자 입력이므로 팝업관리 권한을 아무에게나 주지 않는다.
- `paging_yn='N'` 이면 페이저 없이 최대 500건까지만 표시한다(`NO_PAGING_MAX`).
- 목록 행은 `id` / `nm` 과 **원래 필드명**(`prodId`/`prodNm` 등)을 함께 담아 내려준다 —
  호출부가 원래 필드명을 그대로 쓸 수 있다.

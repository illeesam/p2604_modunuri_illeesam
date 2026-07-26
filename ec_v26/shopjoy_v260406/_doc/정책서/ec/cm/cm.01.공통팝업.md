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
FO 본인만 (^FO^)   : myOrder                                    ← owner_field=memberId
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
| **소유자 한정** | `cm_popup.owner_field` 지정 — 로그인 본인 것만 나온다 | `myOrder` (`owner_field=memberId`) |

`sys_scope` 는 관리자가 팝업관리 화면에서 바꿀 수 있으므로 **그 값만 믿지 않는다.**

```
FO 에 공개할 수 없는 대상입니다: member(MbMember) — 공개 카탈로그가 아니면 owner_field 로 소유자를 한정해야 합니다
```

### 3.2 `owner_field` — 본인 것만 고르게 하기

지정하면 `buildWhere` 가 무조건 다음을 붙인다. **클라이언트 파라미터로 끌 수 없고**, 미로그인이면 거절한다.

```
AND e.{owner_field} = :__ownerId      -- SecurityUtil.getAuthUser().authId()
```

```
로그인이 필요한 팝업입니다: myOrder
```

전체 조회용 팝업과 본인 한정 팝업은 **분리해서 등록**한다 — 하나를 겸용하면 `sys_scope` 하나
잘못 켰을 때 전체 데이터가 새어나간다.

| 팝업코드 | 엔티티 | owner_field | sys_scope | 용도 |
|---|---|---|---|---|
| `order` | OdOrder | (없음) | `^BO^` | 관리자 — 전체 주문 |
| `myOrder` | OdOrder | `memberId` | `^FO^` | 회원 — 본인 주문 (문의하기 주문번호 선택) |

> 이력: 2026-07-26 최초 `sys_scope` 투입 시 `member`/`order`/`coupon` 을 `^BO^FO^` 로 열어
> 인증 없이 회원·주문·쿠폰이 조회되는 상태였다. `migration_20260726_cm_popup_fo_scope_fix.sql`
> 로 회수하고 화이트리스트를 2차 방어로 추가했으며,
> `migration_20260726_cm_popup_owner_field.sql` 로 `owner_field` + `myOrder` 를 도입해
> 전용 모달(`OrderPickModal`, 249줄)을 삭제했다.

### 3.3 공통팝업으로 대체할 수 없는 것

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

- **팝업관리** — 정의(패턴·엔티티·ID/표시명 필드·트리·페이징·다중·모달폭·사용 시스템)
- **팝업항목관리** — 좌측 팝업 목록 + 우측 조회항목/목록컬럼

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

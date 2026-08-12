# pd.11. 상품유형별 구성요건 정책

> 2026-08-13 신규. 상품유형(`pd_prod.prod_type_cd`)마다 **반드시 있어야 하는 하위 데이터**를 규정한다.
> 이 요건을 어긴 상품은 화면에서 조용히 깨지므로(에러 없이 담기 실패) 생성 단계에서 차단한다.

---

## 1. 상품유형 코드 (기준: `sy_code` 그룹 `PROD_TYPE`)

| 코드 | 라벨 | 필수 구성요건 | 근거 테이블 |
|---|---|---|---|
| `SINGLE` | 단품 | **없음** (옵션 없는 것이 정상) | — |
| `OPTION` | 옵션상품 | **옵션 1건 이상** | `pd_prod_opt` |
| `GROUP` | 묶음상품 | **구성상품 1건 이상** | `pd_prod_bundle_item` |
| `SET` | 세트상품 | **구성상품 1건 이상** | `pd_prod_set_item` |
| `GIFT` | 사은품 | 없음 | — |

> ⚠️ **코드값 주의**: 묶음상품은 `GROUP` 이다. `BUNDLE` 이 아니다.
> 테이블·컬럼명은 `bundle`(`pd_prod_bundle_item.bundle_prod_id`)을 쓰지만 **코드값만 `GROUP`** 이다.
> 기준은 Entity 코멘트(`PdProd.prodTypeCd` → `코드: PROD_TYPE — SINGLE/GROUP/SET`).
> 과거 정책서 `pd.05.묶음상품.md` 가 `BUNDLE` 로 잘못 표기했던 것을 2026-08-13 정정했다.

---

## 2. 왜 필요한가 — 위반 시 증상

요건을 어겨도 **에러가 나지 않는다.** 대신 아래처럼 조용히 실패한다.

| 위반 | 사용자에게 보이는 증상 |
|---|---|
| 옵션상품인데 옵션 0건 | 상품상세에서 색상 선택지가 없는데 "색상을 선택해주세요" 로 막혀 **영원히 장바구니에 담을 수 없음** |
| 세트/묶음인데 구성상품 0건 | 무엇으로 구성됐는지 표시할 게 없어 빈 상품처럼 보임. 주문 시 구성품 분해 불가 |

FO 는 이런 상품을 만나면 사용자가 원인을 알 수 없는 상태로 멈춘다. 신고가 들어오기 전까지 발견되지 않으므로 **데이터 생성 시점에 막는 것이 유일하게 확실한 방어**다.

---

## 3. 강제 지점 (3단계)

### 3-1. 시뮬레이터 생성 — 프론트 가드
[`pages/bo/zd/ZdSimulProdMng.js`](../../../../pages/bo/zd/ZdSimulProdMng.js) `fnCheckProdTypeRule(body, typeCd)`

- 생성 POST 직전에 검사. 위반 시 `throw` → 배치 중단
- **미리보기(dry-run)에서도 동작한다** — 미리보기 JSON 패널에 `{"error": "..."}` 로 표시되므로 실제 생성 전에 확인 가능
- 미리보기 모드에서는 `prodOpts` 가 `_hide_prodOpts` 로 옮겨지므로 **두 키를 모두** 검사한다

### 3-2. 시뮬레이터 생성 — 백엔드 가드
[`ZdSimulController.prodCreate()`](../../../../_apps_be/EcAdminApi/src/main/java/com/shopjoy/ecadminapi/bo/zd/ZdSimulController.java)

- `SET`/`GROUP` 이면 `prodCompItems` 가 비었는지 확인 → 비었으면 `IllegalArgumentException`
- 프론트를 우회한 직접 API 호출도 막는다

### 3-3. FO 담기 — 화면 가드
`pages/fo/Prod0{1,2,3}View.js` `validate()`

```js
if (!uiState.selectedColor) {
  if ((svProduct.opt1s || []).length > 0) {
    uiState.colorError = '색상을 선택해주세요.'; ok = false;
  } else if (svProduct.prodTypeCd === 'OPTION') {
    /* 옵션상품인데 옵션 없음 = 잘못된 데이터 → 조용히 FREE 로 담지 않는다 */
    uiState.colorError = '옵션 정보가 없는 상품입니다. 관리자에게 문의해 주세요.'; ok = false;
  } else {
    /* 단품 등: 옵션이 없는 게 정상 → 기본값 자동 선택 */
    uiState.selectedColor = { name: 'FREE', hex: '#e5e7eb', priceDelta: 0 };
  }
}
```

**핵심**: 옵션 없는 상품을 무조건 `FREE` 로 담으면 잘못된 데이터가 주문까지 흘러간다.
유형을 보고 **단품이면 통과, 옵션상품이면 차단**해야 한다.

---

## 4. 세트/묶음 구성상품 생성 (시뮬레이터)

구성상품은 **기존 상품 중에서 2~3건을 무작위로** 골라 담는다.

- 조회: `POST /bo/zd/simul/order/rand-prod` (`{ count, prodStatusCd: 'ACTIVE' }` → `{ prods: [...] }`)
- 미리보기 중에도 실제 목록이 필요하므로 `window._zdRealBoApi` 를 쓴다 (dry-run 프록시 우회)
- 자기 자신(`tmp-prod-01`)은 구성상품에서 제외한다 — 재생성 시 같은 ID 가 이미 존재할 수 있음
- 전송 키: `body.prodCompItems = [{ itemProdId, itemNm, itemQty, sortOrd }]`
- `pd_prod_bundle_item.price_rate` 는 NOT NULL → 백엔드가 구성상품 수로 **균등 배분(합계 100)** 하여 채운다

> 저장은 반드시 `PdProdSetItemService.create()` / `PdProdBundleItemService.create()` 를 쓴다.
> Repository.save() 를 직접 쓰면 **PK(`prod_set_item_id`) 가 생성되지 않아 NOT NULL 위반**이 난다
> (ID 는 Service 가 `CmUtil.generateId()` 로 만들고, `reg_site_id` 만 `EntitySaveListener` 가 채운다).

---

## 5. 데이터 점검 SQL

```sql
-- 위반 상품 조회 (모두 0 이어야 정상)
SELECT p.prod_type_cd,
       COUNT(*) AS n,
       COUNT(*) FILTER (WHERE p.prod_type_cd = 'OPTION'
         AND NOT EXISTS (SELECT 1 FROM pd_prod_opt o WHERE o.prod_id = p.prod_id))          AS bad_opt,
       COUNT(*) FILTER (WHERE p.prod_type_cd = 'SET'
         AND NOT EXISTS (SELECT 1 FROM pd_prod_set_item i WHERE i.set_prod_id = p.prod_id)) AS bad_set,
       COUNT(*) FILTER (WHERE p.prod_type_cd = 'GROUP'
         AND NOT EXISTS (SELECT 1 FROM pd_prod_bundle_item b WHERE b.bundle_prod_id = p.prod_id)) AS bad_grp
  FROM pd_prod p
 GROUP BY 1 ORDER BY 1;

-- 부모 상품이 사라진 고아 구성상품 행
SELECT 'set_item' AS t, i.* FROM pd_prod_set_item i
 WHERE NOT EXISTS (SELECT 1 FROM pd_prod p WHERE p.prod_id = i.set_prod_id);
SELECT 'bundle_item' AS t, b.* FROM pd_prod_bundle_item b
 WHERE NOT EXISTS (SELECT 1 FROM pd_prod p WHERE p.prod_id = b.bundle_prod_id);
```

---

## 6. 정리 이력

**2026-08-13 정리 결과**

| 대상 | 조치 |
|---|---|
| `tmp-prod-01` (SET, 구성상품 0건, 시뮬 생성) | **삭제** — 연관 `pd_prod_sku` 9 / `pd_prod_opt` 46 / `pd_prod_img` 25 건 함께 삭제 |
| 고아 구성상품 행 (부모 `PD000204`/`PD000205` 미존재) | **삭제** — `pd_prod_set_item` 2건 / `pd_prod_bundle_item` 2건 |
| 시뮬레이터 유형코드 `NORMAL`/`BUNDLE` | `SINGLE`/`GROUP` 으로 정정 — DB 코드그룹과 불일치했음 |
| `pd.05.묶음상품.md` 의 `BUNDLE` 표기 | `GROUP` 으로 정정 |

정리 후 검증: 옵션 없는 옵션상품 0 / 구성 없는 세트 0 / 구성 없는 묶음 0 (OPTION 594, SINGLE 37).

> 참고: 옵션 없는 `SINGLE` 37건은 **정상**이다. 단품은 옵션이 없는 것이 맞다.

---

## 7. 코드그룹명 정합 (2026-08-13)

`prod_type_cd` 가 참조하는 코드그룹은 **`PROD_TYPE`** 이다. `PRODUCT_TYPE` 은 존재하지 않는다.

QueryDSL 이 없는 코드그룹으로 조인하면 **에러 없이 라벨만 NULL** 이 된다(화면에 유형이 빈칸으로 보임).
전 `Q*RepositoryImpl` 의 조인 코드그룹 92종을 `sy_code_grp` 와 대조해 **7종 불일치**를 찾아 정리했다.

### 오타 — 이름만 정정 (4종)

| 잘못된 그룹 | 올바른 그룹 | 대상 컬럼 | 조치 후 |
|---|---|---|---|
| `PRODUCT_TYPE` | **`PROD_TYPE`** | `pd_prod.prod_type_cd` | 옵션상품 594 / 단품 37 라벨 정상 |
| `PAY_METHOD_CD` | **`PAY_METHOD`** | `st_settle_pay`·`st_settle_raw.pay_method_cd` | 무통장입금 7건 라벨 정상 |
| `VENDOR_MEMBER_STATUS` | **`VENDOR_USER_STATUS`** | `sy_vendor_user.vendor_user_status_cd` | 재직 36 / 정지 4 라벨 정상 |
| `CLAIM_FAULT` | **`FAULT_TYPE`** | `od_refund.fault_type_cd` | 고객귀책 4 / 판매자귀책 2 라벨 정상 |

### 정본 그룹으로 교체 (1종)

| 잘못된 그룹 | 올바른 그룹 | 대상 컬럼 | 조치 후 |
|---|---|---|---|
| `SAVE_ITEM_TARGET` | **`PROMO_TARGET_TYPE`** | `pm_save_item.target_type_cd` | 상품 291 / 카테고리 281 라벨 정상 |

> ⚠️ **판단 주의**: 처음에는 도메인별 개별 명명 관례(`LIKE_TARGET_TYPE`·`COUPON_TARGET`·`ALARM_TARGET_TYPE`)를
> 근거로 `SAVE_ITEM_TARGET` 그룹을 신규 생성했으나, **오판이었다.**
> [`components/modals/HelpBoModal.js`](../../../../components/modals/HelpBoModal.js) `STATUS_GRP_FIX` 에
> `COUPON/DISCNT/EVENT_ITEM_TARGET → PROMO_TARGET_TYPE (프로모션 타깃 정본)` 이 이미 결정돼 있었다.
> 프로모션 도메인의 타깃은 **개별 그룹을 만들지 말고 `PROMO_TARGET_TYPE` 하나로 모은다.**
> 잘못 만든 그룹은 삭제하고 정본으로 교체했다.
>
> `PROMO_TARGET_TYPE` 구성: `ALL`(전체) / `PRODUCT`(상품) / `CATEGORY`(카테고리) / `VENDOR`(업체) / `BRAND`(브랜드) / `MEMBER_GRADE`(회원등급)

**남은 정비 대상**: `QPmCouponRepositoryImpl` 은 아직 `COUPON_TARGET` 으로 조인한다.
이 그룹은 DB 에 실재해 **라벨은 정상 표시되므로 버그는 아니다.** 다만 위 정본 방침에 따르면
`PROMO_TARGET_TYPE` 으로 통합 대상이다. 값 구성이 달라 깨질 수 있으므로 별도 검증 후 진행할 것.

### 미해결 — 판단 보류 (2종)

| 그룹 | 대상 컬럼 | 사유 |
|---|---|---|
| `SKU_CHG_TYPE` | `pdh_prod_sku_chg_hist.chg_type_cd` | 테이블 데이터 0건 + 유사 그룹 없음 → 어떤 코드값이 필요한지 업무 판단 필요 |
| `SKU_STOCK_CHG` | `pdh_prod_sku_stock_hist.chg_reason_cd` | 동일 (데이터 0건) |

추측으로 코드를 만들면 잘못된 선택지가 노출되므로 **값이 정해질 때 등록**한다.
등록 전까지 이 두 이력화면의 유형·사유 라벨은 빈칸으로 표시된다.

### 재현 방법

```bash
# 1) QueryDSL 조인 코드그룹 추출
grep -rhoE 'codeGrp\.eq\("[A-Z_]+"\)' _apps_be/EcAdminApi/src/main/java --include="*.java" \
  | sed 's/codeGrp.eq("//;s/")//' | sort -u
# 2) sy_code_grp.code_grp 와 대조 → 차집합이 곧 "라벨 항상 NULL" 목록
```

---

## 관련 문서

- [`pd.03.상품.md`](pd.03.상품.md) — 상품 기본 정책
- [`pd.05.묶음상품.md`](pd.05.묶음상품.md) — 묶음(GROUP) 상세
- [`pd.06.세트상품.md`](pd.06.세트상품.md) — 세트(SET) 상세
- [`pd.08.상품옵션.md`](pd.08.상품옵션.md) — 옵션(OPTION) 상세

# pd.08. 상품 옵션 정책

## 정의
상품의 선택 가능한 속성(색상·사이즈·소재 등)을 계층 구조로 관리하고,
옵션 조합별로 **SKU(재고 관리 단위)**를 생성하여 재고·가격을 독립 관리한다.

---

## 테이블 구조 (2026-07-13 기준)

```
pd_prod (상품)
└─ pd_prod_opt_type (옵션 유형 — 예: "색상", "사이즈")
     └─ pd_prod_opt (옵션 값 — 예: 블랙, M)
          └─ pd_prod_sku (SKU — 옵션 조합별 재고/가격 단위)
```

---

## 옵션 단계

| 단계 | pd_prod_opt_type 행 수 | 예시 | SKU 생성 방식 |
|---|---|---|---|
| 옵션 없음 | 0 | 단일 상품 | SKU 1개 (prod_opt_id_1=NULL) |
| 1단 옵션 | 1 | 용량만 | prod_opt_type_level=1 값 수만큼 SKU |
| 2단 옵션 | 2 | 색상 + 사이즈 | prod_opt_type_level=1 × prod_opt_type_level=2 조합만큼 SKU |

> 현재 DDL 기준 최대 2단 (pd_prod_sku.prod_opt_id_1, prod_opt_id_2)

---

## 주요 필드

### pd_prod — 상품 (옵션 관련)
| 필드 | 설명 |
|---|---|
| `prod_opt_type_level1_cd` | 옵션 1단 분류 코드 (OPT_TYPE Level 1 — CLOTHING/SHOES/BAG/CUSTOM_GRP) |

### pd_prod_opt_type — 옵션 유형(차원)
| 필드 | 설명 |
|---|---|
| `prod_opt_type_id` | 옵션 유형ID (PK) |
| `prod_id` | 상품ID |
| `prod_opt_type_nm` | 유형명 (예: 색상, 사이즈) |
| `prod_opt_type_level` | 유형 순서 (1=첫 번째, 2=두 번째) |
| `prod_opt_type_level1_cd` | 이 차원의 1단 분류 코드 (OPT_TYPE Level 1) |
| `prod_opt_type_level2_cd` | 이 차원의 2단 분류 코드 (OPT_TYPE Level 2, NULL 가능) |
| `sort_ord` | 정렬순서 |

### pd_prod_opt — 옵션 값
| 필드 | 설명 |
|---|---|
| `prod_opt_id` | 옵션값ID (PK) |
| `prod_opt_type_id` | 소속 옵션 유형 ID (FK: pd_prod_opt_type.prod_opt_type_id) |
| `prod_id` | 상품ID |
| `prod_opt_nm` | 옵션값 표시명 (예: 블랙, M) |
| `prod_opt_val` | 실제 저장값 (직접 입력 또는 프리셋 codeValue) |
| `prod_opt_type_level1_cd` | 비정규화 — pd_prod_opt_type.prod_opt_type_level1_cd 복사 |
| `prod_opt_type_level2_cd` | 비정규화 — pd_prod_opt_type.prod_opt_type_level2_cd 복사 (NULL 가능) |
| `parent_prod_opt_id` | 상위 옵션값ID — 2단 항목에서 연결할 1단 항목 지정 (NULL=전체 공통) |
| `prod_opt_style` | 옵션 표시 스타일 — 색상코드(#FF0000) 또는 빈 문자열 |
| `sort_ord` | 정렬순서 |
| `use_yn` | 사용여부 Y/N |

#### parent_prod_opt_id — 2단 옵션 연동 규칙
2단 옵션 항목에서 `parent_prod_opt_id`를 지정하면, 구매자가 해당 1단 값을 선택했을 때만 이 2단 값이 노출된다.

| parent_prod_opt_id | 의미 |
|---|---|
| NULL | 모든 1단 값과 조합 가능 (전체 공통) |
| 특정 prod_opt_id | 해당 1단 값 선택 시에만 이 2단 값 노출 |

예시: 블랙(OPT001) 색상에서는 S/M/L 전부, 화이트(OPT002)에서는 S/M만 제공하고 싶을 때:
```
OPT004 (S, parent=NULL)       → 블랙·화이트 모두 선택 가능
OPT005 (M, parent=NULL)       → 블랙·화이트 모두 선택 가능
OPT006 (L, parent=OPT001)    → 블랙 선택 시에만 노출
```

### pd_prod_sku — SKU
| 필드 | 설명 |
|---|---|
| `prod_sku_id` | SKU ID (PK) |
| `prod_id` | 상품ID |
| `prod_opt_id_1` | 옵션1 값ID (pd_prod_opt.prod_opt_id, NULL=옵션없음) |
| `prod_opt_id_2` | 옵션2 값ID (pd_prod_opt.prod_opt_id, NULL=1단 옵션) |
| `prod_sku_code` | 자체 SKU 코드 (바코드·ERP 연동용) |
| `add_price` | 옵션 추가금액 (기본 0원) |
| `prod_opt_stock` | 해당 조합 재고수량 |
| `use_yn` | 사용여부 Y/N |

---

## 옵션 구조 예시

### 1단 옵션 (용량)
```
pd_prod_opt_type
  prod_opt_type_id='OPTT001', prod_opt_type_level=1, prod_opt_type_nm='용량'
  prod_opt_type_level1_cd='CUSTOM_GRP', prod_opt_type_level2_cd=NULL

pd_prod_opt (prod_opt_type_id='OPTT001')
  prod_opt_id='OPT001'  prod_opt_nm='100ml'  prod_opt_val='V_100ML'
  prod_opt_id='OPT002'  prod_opt_nm='200ml'  prod_opt_val='V_200ML'
  prod_opt_id='OPT003'  prod_opt_nm='500ml'  prod_opt_val='V_500ML'

pd_prod_sku (SKU 3개)
  SKU001  prod_opt_id_1='OPT001'  add_price=0      stock=20
  SKU002  prod_opt_id_1='OPT002'  add_price=3,000  stock=15
  SKU003  prod_opt_id_1='OPT003'  add_price=8,000  stock=10
```

### 2단 옵션 (색상 + 사이즈)
```
pd_prod (상품)
  prod_opt_type_level1_cd='CLOTHING'

pd_prod_opt_type
  prod_opt_type_id='OPTT001', prod_opt_type_level=1, prod_opt_type_nm='색상'
    prod_opt_type_level1_cd='CLOTHING', prod_opt_type_level2_cd='COLOR'
  prod_opt_type_id='OPTT002', prod_opt_type_level=2, prod_opt_type_nm='사이즈'
    prod_opt_type_level1_cd='CLOTHING', prod_opt_type_level2_cd='SIZE'

pd_prod_opt (prod_opt_type_id='OPTT001' — 색상)
  prod_opt_id='OPT001'  prod_opt_nm='블랙'     prod_opt_val='BLACK'  prod_opt_style='#000000'
  prod_opt_id='OPT002'  prod_opt_nm='화이트'   prod_opt_val='WHITE'  prod_opt_style='#FFFFFF'
  prod_opt_id='OPT003'  prod_opt_nm='딥네이비' prod_opt_val='NAVY'   prod_opt_style='#1B2A4A'

pd_prod_opt (prod_opt_type_id='OPTT002' — 사이즈)
  prod_opt_id='OPT004'  prod_opt_nm='S'  prod_opt_val='S'
  prod_opt_id='OPT005'  prod_opt_nm='M'  prod_opt_val='M'
  prod_opt_id='OPT006'  prod_opt_nm='L'  prod_opt_val='L'

pd_prod_sku (SKU 9개 = 3색상 × 3사이즈)
  SKU001  prod_opt_id_1='OPT001'(블랙)     prod_opt_id_2='OPT004'(S)  stock=20  add_price=0
  SKU002  prod_opt_id_1='OPT001'(블랙)     prod_opt_id_2='OPT005'(M)  stock=30  add_price=0
  SKU003  prod_opt_id_1='OPT001'(블랙)     prod_opt_id_2='OPT006'(L)  stock=15  add_price=0
  ...
  SKU007  prod_opt_id_1='OPT003'(딥네이비) prod_opt_id_2='OPT004'(S)  stock=5   add_price=2,000
  SKU008  prod_opt_id_1='OPT003'(딥네이비) prod_opt_id_2='OPT005'(M)  stock=12  add_price=2,000
  SKU009  prod_opt_id_1='OPT003'(딥네이비) prod_opt_id_2='OPT006'(L)  stock=0   add_price=2,000  ← 품절
```

---

## 주문 시 옵션 처리

### 구매자 선택 → SKU 조회
```
1. 구매자: 색상="블랙", 사이즈="M" 선택
2. 조회: prod_opt_id_1='OPT001' AND prod_opt_id_2='OPT005' → SKU002 조회
3. 재고 확인: prod_opt_stock = 30 → 구매 가능
4. 판매가 계산: pd_prod.sale_price + SKU002.add_price
```

### od_order_item 생성 시 스냅샷
```
od_order_item
  prod_sku_id     : SKU002           ← SKU 참조
  prod_opt_id_1   : OPT001          ← 옵션1 값 ID 스냅샷
  prod_opt_id_2   : OPT005          ← 옵션2 값 ID 스냅샷
  unit_price      : 25,000원         ← sale_price + add_price 스냅샷
  qty             : 1
```

---

## 옵션 이미지 연동

`pd_prod_img.prod_opt_id_1` / `prod_opt_id_2`로 옵션에 따른 이미지 자동 전환:

| prod_opt_id_1 | prod_opt_id_2 | 이미지 적용 범위 |
|---|---|---|
| NULL | NULL | 상품 공통 대표이미지 |
| 색상값 | NULL | 해당 색상의 모든 사이즈 공통 |
| 색상값 | 사이즈값 | 특정 색상+사이즈 전용 이미지 |

> 구매자가 색상을 선택하면 해당 prod_opt_id_1에 연결된 이미지로 자동 교체

---

## 옵션 상태 관리

| 상태 | 처리 |
|---|---|
| `use_yn = 'N'` (pd_prod_opt) | 옵션 값 비활성화 → 선택 불가 |
| `prod_opt_stock = 0` (SKU) | 해당 조합 품절 → UI에 "품절" 표시, 선택 불가 |
| `use_yn = 'N'` (pd_prod_sku) | SKU 비활성화 (옵션 폐기) |

### 상품 전체 품절 처리
```
구성 SKU 전체의 prod_opt_stock = 0
  → pd_prod.sold_out_yn = 'Y' 자동 업데이트 (배치 또는 이벤트)
  → 상품 목록에 "품절" 배지 표시
```

---

## 옵션 변경 시 제약

| 상황 | 정책 |
|---|---|
| 옵션값 추가 | 신규 SKU 생성. 기존 주문에 영향 없음 |
| 옵션값 삭제 | 주문이 있는 prod_opt_id는 `use_yn='N'` 처리 (물리 삭제 불가) |
| SKU 가격 변경 | `pdh_prod_sku_price_hist`에 변경 전/후 add_price 기록 |
| SKU 재고 변경 | `pdh_prod_sku_stock_hist`에 기록 (chg_reason_cd: SKU_STOCK_CHG) |
| SKU 상태 변경 | `pdh_prod_sku_chg_hist`에 use_yn 변경 기록 |

---

## 이력 관리

### pdh_prod_sku_price_hist — SKU 가격 변경 이력
| 필드 | 설명 |
|---|---|
| `hist_id` | 이력ID |
| `prod_sku_id` | 대상 SKU |
| `prod_id` | 상품ID (조회 편의) |
| `add_price_before` | 변경 전 추가금액 |
| `add_price_after` | 변경 후 추가금액 |
| `chg_reason` | 변경사유 |
| `chg_by` | 처리자 |
| `chg_date` | 변경일시 |

### pdh_prod_sku_stock_hist — SKU 재고 변경 이력
| 필드 | 설명 |
|---|---|
| `hist_id` | 이력ID |
| `prod_sku_id` | 대상 SKU |
| `stock_before` | 변경 전 재고 |
| `stock_after` | 변경 후 재고 |
| `chg_qty` | 변경수량 (양수=입고, 음수=출고) |
| `chg_reason_cd` | 변경사유코드 — SKU_STOCK_CHG { SALE:판매, PURCHASE:매입입고, RETURN:반품입고, EXCHANGE:교환, ADJUST:재고조정, CLAIM:클레임, ADMIN:관리자수동 } |
| `order_item_id` | 주문상품ID (주문/클레임 연동 시) |

### pdh_prod_sku_chg_hist — SKU 상태 변경 이력
SKU의 `use_yn` 활성/비활성 변경만 기록.

---

## 공통코드 OPT_TYPE 트리 구조

`OPT_TYPE`은 **2레벨 트리** 구조로 구성된다.
- **Level 1 (옵션 카테고리)**: 상품 종류별 카테고리 — 관리자가 먼저 선택 → `pd_prod.prod_opt_type_level1_cd` 에 저장
- **Level 2 (옵션 유형)**: 해당 카테고리에서 사용 가능한 유형 — Level 1 선택 후 표시 → `pd_prod_opt_type.prod_opt_type_level2_cd` 에 저장

`OPT_VAL` 코드그룹은 OPT_TYPE Level 2의 `codeValue`를 `parentCodeValue`로 참조하는 **크로스-그룹 트리**로 연결된다.

```
codeGrp: OPT_TYPE  (Level 1 — 옵션 카테고리, parentCodeValue=NULL)
│
├─ CLOTHING  │의류 (색상+사이즈)│
│     ├─ OPT_TYPE Level 2 (parentCodeValue='CLOTHING')
│     │     ├─ COLOR    │색상│
│     │     │     └─ OPT_VAL (parentCodeValue='COLOR') ← 프리셋 13개
│     │     │           BLACK(검정) WHITE(흰색) RED(빨강) BLUE(파랑) GREEN(초록)
│     │     │           YELLOW(노랑) PINK(핑크) PURPLE(보라) GRAY(회색) BROWN(갈색)
│     │     │           BEIGE(베이지) ORANGE(주황) NAVY(네이비)
│     │     └─ SIZE     │사이즈│
│     │           └─ OPT_VAL (parentCodeValue='SIZE') ← 프리셋 7개
│     │                 XS · S · M · L · XL · XXL · FREE(프리사이즈)
│
├─ SHOES     │신발 (색상+사이즈)│
│     └─ OPT_TYPE Level 2 (parentCodeValue='SHOES')
│           ├─ COLOR  │색상│  → OPT_VAL 13개 동일
│           └─ SIZE   │사이즈│ → OPT_VAL 7개 동일
│
├─ BAG       │가방 (색상+소재)│
│     └─ OPT_TYPE Level 2 (parentCodeValue='BAG')
│           ├─ COLOR    │색상│    → OPT_VAL 13개 동일
│           └─ MATERIAL │소재│
│                 └─ OPT_VAL (parentCodeValue='MATERIAL') ← 프리셋 5개
│                       COTTON(면) POLYESTER(폴리에스터) LEATHER(가죽)
│                       WOOL(울) LINEN(린넨)
│
└─ CUSTOM_GRP │커스텀│
      └─ OPT_TYPE Level 2 (parentCodeValue='CUSTOM_GRP')
            └─ CUSTOM │직접입력│
                  └─ OPT_VAL 프리셋 없음 — prod_opt_type_nm · prod_opt_val 직접 입력
```

### 컬럼 매핑

| 컬럼 | 입력 방식 | 설명 |
|---|---|---|
| `pd_prod.prod_opt_type_level1_cd` | OPT_TYPE Level 1 `<select>` | 의류/신발/가방/커스텀 — 1레벨 먼저 선택 |
| `pd_prod_opt_type.prod_opt_type_level2_cd` | OPT_TYPE Level 2 `<select>` | 해당 카테고리의 세부 유형(색상/사이즈/소재 등) |
| `pd_prod_opt.prod_opt_val` | `<input>` (프리셋 선택 또는 직접입력) | 실제 저장값 |
| `pd_prod_opt.prod_opt_style` | `<input>` | 색상 코드(#FF0000) 등 표시 스타일 |

### 관리자 UI 선택 흐름

```
[Step 1] 옵션 카테고리 선택 (OPT_TYPE Level 1)
  ☑ 옵션 사용   옵션 카테고리: [의류 (색상+사이즈) ▼]
                                      ↓ 선택 시 차원 자동 추가

[Step 2] 1단·2단 유형 선택 (OPT_TYPE Level 2)
  1단 유형: [색상 ▼]   2단 유형: [사이즈 ▼]

[Step 3] 옵션 값 입력 (pd_prod_opt)
  1단 색상 유형:
    # | 표시명(prod_opt_nm) | 저장값(prod_opt_val) | 스타일(prod_opt_style)
    1 | 블랙                | BLACK                | #000000
    2 | 화이트              | WHITE                | #FFFFFF
    3 | 딥네이비            | NAVY                 | #1B2A4A

  2단 사이즈 유형:
    # | 상위옵션값(parent_prod_opt_id) | 표시명 | 저장값
    1 | [-- 전체 공통 --]              | S      | S
    2 | [-- 전체 공통 --]              | M      | M
    3 | [블랙]                         | L      | L  (블랙만)
```

---

## 시뮬레이터 연동 body key 규칙 (2026-07-13 기준)

### 전송 body 구조

```
body (pd_prod)
├─ prodNm, salePrice, purchasePrice, prodStock
├─ prodTypeCd, prodStatusCd, advrtStmt
├─ prodOptTypeLevel1Cd    ← pd_prod.prod_opt_type_level1_cd
├─ prodOpts[]            ← pd_prod_opt_type (옵션 유형 배열)
│   ├─ prodOptTypeNm     ← pd_prod_opt_type.prod_opt_type_nm
│   ├─ prodOptTypeLevel  ← pd_prod_opt_type.prod_opt_type_level
│   ├─ level1Cd          ← pd_prod_opt_type.prod_opt_type_level1_cd
│   ├─ level2Cd          ← pd_prod_opt_type.prod_opt_type_level2_cd
│   ├─ sortOrd
│   └─ prodOpts[]        ← pd_prod_opt (옵션 값 배열, 같은 키 이름 재사용)
│       ├─ prodOptId, prodOptNm, prodOptVal
│       ├─ prodOptStyle, parentProdOptId
│       └─ sortOrd, useYn
└─ prodImages[]          ← pd_prod_img (항상 포함, 미전송 시 빈 배열)
```

※ `prodSkus`는 백엔드가 `prodOpts` 조합에서 자동 생성 (별도 전송 불필요)
※ `prodOpts`, `prodImages` 는 **값 없어도 항상 포함** (빈 값=null/[])

### 임시 ID 사전 할당

```
body.prodId = 'tmp-prod-01'              ← 상품 임시 ID (프론트 생성)

prodOpts[0] (유형: 색상)
  prodOpts[0].prodOptId = 'tmp-opt1-01' ← 1유형 1번째 옵션값
  prodOpts[1].prodOptId = 'tmp-opt1-02' ← 1유형 2번째 옵션값

prodOpts[1] (유형: 사이즈)
  prodOpts[0].prodOptId = 'tmp-opt2-01' ← 2유형 1번째 옵션값
  prodOpts[1].prodOptId = 'tmp-opt2-02' ← 2유형 2번째 옵션값
  ↓ 참조
_preview_[prodSkus][*].prodOptId1 = 'tmp-opt1-01'
_preview_[prodSkus][*].prodOptId2 = 'tmp-opt2-01'
prodImages[0].prodOptId1 = 'tmp-opt1-01'
```

---

## 관련 코드
- `OPT_TYPE` Level 1: CLOTHING / SHOES / BAG / CUSTOM_GRP (옵션 카테고리 — 관리자 화면 1단계 선택)
- `OPT_TYPE` Level 2: COLOR / SIZE / MATERIAL / CUSTOM (옵션 유형 분류)
- `OPT_VAL`: OPT_TYPE Level 2 하위 프리셋값 (parentCodeValue = OPT_TYPE Level 2 codeValue)
- `SKU_STOCK_CHG`: SALE / PURCHASE / RETURN / EXCHANGE / ADJUST / CLAIM / ADMIN (재고 변경 사유)

## 관련 테이블
- `pd_prod` — `prod_opt_type_level1_cd` (옵션 1단 분류)
- `pd_prod_opt_type` — 옵션 유형 (prod_opt_type_id PK, prod_opt_type_level, prod_opt_type_level1_cd, prod_opt_type_level2_cd)
- `pd_prod_opt` — 옵션 값 (prod_opt_id PK, prod_opt_type_id FK, prod_opt_val, prod_opt_style, prod_opt_type_level1_cd, prod_opt_type_level2_cd, parent_prod_opt_id)
- `pd_prod_sku` — SKU (prod_sku_id PK, prod_opt_id_1/2 참조)
- `pd_prod_img` — 상품 이미지 (prod_opt_id_1/2 연동)
- `pdh_prod_sku_price_hist` — SKU 가격 변경 이력
- `pdh_prod_sku_stock_hist` — SKU 재고 변경 이력
- `pdh_prod_sku_chg_hist` — SKU 상태 변경 이력
- `od_order_item` — 주문 시 prod_sku_id + prod_opt_id_1/2 스냅샷

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (옵션/SKU 탭) |

## 관련 정책서
- `pd.03.상품.md` — 상품 기본 정보
- `pd.09.상품가격-재고.md` — 가격·재고 상세 정책

## 변경이력
- 2026-07-13: 옵션 컬럼 체계 개편
  - `pd_prod.opt_grp_cd` → `pd_prod.prod_opt_type_level1_cd` (rename)
  - `pd_prod_opt_type.prod_opt_input_type_cd` 제거 (OPT_INPUT_TYPE 코드그룹 폐기)
  - `pd_prod_opt_type.prod_opt_type_level1_cd` / `prod_opt_type_level2_cd` 신규 추가
  - `pd_prod_opt.prod_opt_val_code_id` 제거 → `prod_opt_type_level2_cd` 로 대체
  - `pd_prod_opt.opt_style` → `pd_prod_opt.prod_opt_style` (rename)
  - `pd_prod_opt.prod_opt_type_level1_cd` / `prod_opt_type_level2_cd` 신규 추가 (비정규화)
- 2026-07-12: DDL 테이블 리네임 반영
  - `pd_prod_opt` (옵션 유형) → `pd_prod_opt_type` / PK `prod_opt_type_id`
  - `pd_prod_opt_item` (옵션 값) → `pd_prod_opt` / PK `prod_opt_id`
- 2026-04-19: 스키마 변경 전면 반영

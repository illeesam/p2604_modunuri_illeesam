# pd.08. 상품 옵션 정책

## 정의
상품의 선택 가능한 속성(색상·사이즈·소재 등)을 계층 구조로 관리하고,
옵션 조합별로 **SKU(재고 관리 단위)**를 생성하여 재고·가격을 독립 관리한다.

---

## 테이블 구조

```
pd_prod (상품)
└─ pd_prod_opt (옵션 차원 — 예: "색상", "사이즈")
     └─ pd_prod_opt_item (옵션 값 — 예: 블랙, M)
          └─ pd_prod_sku (SKU — 옵션 조합별 재고/가격 단위)
```

---

## 옵션 단계

| 단계 | pd_prod_opt 행 수 | 예시 | SKU 생성 방식 |
|---|---|---|---|
| 옵션 없음 | 0 | 단일 상품 | SKU 1개 (opt_item_id_1=NULL) |
| 1단 옵션 | 1 | 용량만 | opt_level=1 값 수만큼 SKU |
| 2단 옵션 | 2 | 색상 + 사이즈 | opt_level=1 × opt_level=2 조합만큼 SKU |

> 현재 DDL 기준 최대 2단 (pd_prod_sku.opt_item_id_1, opt_item_id_2)

---

## 주요 필드

### pd_prod_opt — 옵션 차원(그룹)
| 필드 | 설명 |
|---|---|
| `opt_id` | 옵션 차원ID (PK) |
| `prod_id` | 상품ID |
| `opt_grp_nm` | 차원명 (예: 색상, 사이즈) |
| `opt_level` | 차원 순서 (1=첫 번째, 2=두 번째) |
| `opt_type_cd` | 옵션 의미 분류 — OPT_TYPE { NONE:없음, COLOR:색상, SIZE:사이즈, MATERIAL:소재, CUSTOM:직접입력 } |
| `opt_input_type_cd` | UI 입력 방식 — OPT_INPUT_TYPE { SELECT:선택, SELECT_INPUT:선택+직접입력, MULTI_SELECT:복수선택 } |
| `sort_ord` | 정렬순서 |

### pd_prod_opt_item — 옵션 값
| 필드 | 설명 |
|---|---|
| `opt_item_id` | 옵션값ID (PK) |
| `opt_id` | 소속 옵션 차원 ID (FK: pd_prod_opt.opt_id) |
| `opt_type_cd` | 옵션 의미 분류 (부모 pd_prod_opt과 동일) |
| `opt_nm` | 옵션값 표시명 (예: 블랙, M) |
| `opt_val` | OPT_VAL 공통코드 참조 (NULL=직접입력) |
| `opt_cd` | 실제 저장 코드 (NULL이면 opt_val을 코드로 사용) |
| `sort_ord` | 정렬순서 |
| `use_yn` | 사용여부 Y/N |

#### 유효코드 결정 규칙
```
유효코드 = opt_cd ?? opt_val   (opt_cd 우선, 없으면 opt_val 사용)
opt_val=NULL, opt_cd=NULL 는 앱에서 허용하지 않음
```

### pd_prod_sku — SKU
| 필드 | 설명 |
|---|---|
| `sku_id` | SKU ID |
| `prod_id` | 상품ID |
| `opt_item_id_1` | 옵션1 값ID (pd_prod_opt_item.opt_item_id, NULL=옵션없음) |
| `opt_item_id_2` | 옵션2 값ID (pd_prod_opt_item.opt_item_id, NULL=1단 옵션) |
| `sku_code` | 자체 SKU 코드 (바코드·ERP 연동용) |
| `add_price` | 옵션 추가금액 (기본 0원) |
| `prod_opt_stock` | 해당 조합 재고수량 |
| `use_yn` | 사용여부 Y/N |

---

## 옵션 구조 예시

### 1단 옵션 (용량)
```
pd_prod_opt
  opt_id='OPT001', opt_level=1, opt_type_cd='CUSTOM', opt_grp_nm='용량'

pd_prod_opt_item (opt_id='OPT001')
  opt_item_id='ITEM001'  opt_nm='100ml'  opt_val='V_100ML'
  opt_item_id='ITEM002'  opt_nm='200ml'  opt_val='V_200ML'
  opt_item_id='ITEM003'  opt_nm='500ml'  opt_val='V_500ML'

pd_prod_sku (SKU 3개)
  SKU001  opt_item_id_1='ITEM001'  add_price=0      stock=20
  SKU002  opt_item_id_1='ITEM002'  add_price=3,000  stock=15
  SKU003  opt_item_id_1='ITEM003'  add_price=8,000  stock=10
```

### 2단 옵션 (색상 + 사이즈)
```
pd_prod_opt
  opt_id='OPT001', opt_level=1, opt_type_cd='COLOR', opt_grp_nm='색상'
  opt_id='OPT002', opt_level=2, opt_type_cd='SIZE',  opt_grp_nm='사이즈'

pd_prod_opt_item (opt_id='OPT001' — 색상)
  opt_item_id='ITEM001'  opt_nm='블랙'     opt_val='BLACK'  opt_cd=NULL       → 유효코드: BLACK
  opt_item_id='ITEM002'  opt_nm='화이트'   opt_val='WHITE'  opt_cd=NULL       → 유효코드: WHITE
  opt_item_id='ITEM003'  opt_nm='딥네이비' opt_val='NAVY'   opt_cd='DEEP_NAVY' → 유효코드: DEEP_NAVY

pd_prod_opt_item (opt_id='OPT002' — 사이즈)
  opt_item_id='ITEM004'  opt_nm='S'  opt_val='S'
  opt_item_id='ITEM005'  opt_nm='M'  opt_val='M'
  opt_item_id='ITEM006'  opt_nm='L'  opt_val='L'

pd_prod_sku (SKU 9개 = 3색상 × 3사이즈)
  SKU001  opt_item_id_1='ITEM001'(블랙)     opt_item_id_2='ITEM004'(S)  stock=20  add_price=0
  SKU002  opt_item_id_1='ITEM001'(블랙)     opt_item_id_2='ITEM005'(M)  stock=30  add_price=0
  SKU003  opt_item_id_1='ITEM001'(블랙)     opt_item_id_2='ITEM006'(L)  stock=15  add_price=0
  ...
  SKU007  opt_item_id_1='ITEM003'(딥네이비) opt_item_id_2='ITEM004'(S)  stock=5   add_price=2,000
  SKU008  opt_item_id_1='ITEM003'(딥네이비) opt_item_id_2='ITEM005'(M)  stock=12  add_price=2,000
  SKU009  opt_item_id_1='ITEM003'(딥네이비) opt_item_id_2='ITEM006'(L)  stock=0   add_price=2,000  ← 품절
```

---

## 주문 시 옵션 처리

### 구매자 선택 → SKU 조회
```
1. 구매자: 색상="블랙", 사이즈="M" 선택
2. 조회: opt_item_id_1='ITEM001' AND opt_item_id_2='ITEM005' → SKU002 조회
3. 재고 확인: prod_opt_stock = 30 → 구매 가능
4. 판매가 계산: pd_prod.sale_price + SKU002.add_price
```

### od_order_item 생성 시 스냅샷
```
od_order_item
  sku_id          : SKU002           ← SKU 참조
  opt_item_id_1   : ITEM001          ← 옵션1 값 ID 스냅샷
  opt_item_id_2   : ITEM005          ← 옵션2 값 ID 스냅샷
  unit_price      : 25,000원         ← sale_price + add_price 스냅샷
  qty             : 1
```

---

## 옵션 이미지 연동

`pd_prod_img.opt_item_id_1` / `opt_item_id_2`로 옵션에 따른 이미지 자동 전환:

| opt_item_id_1 | opt_item_id_2 | 이미지 적용 범위 |
|---|---|---|
| NULL | NULL | 상품 공통 대표이미지 |
| 색상값 | NULL | 해당 색상의 모든 사이즈 공통 |
| 색상값 | 사이즈값 | 특정 색상+사이즈 전용 이미지 |

> 구매자가 색상을 선택하면 해당 opt_item_id_1에 연결된 이미지로 자동 교체

---

## 옵션 상태 관리

| 상태 | 처리 |
|---|---|
| `use_yn = 'N'` (pd_prod_opt_item) | 옵션 값 비활성화 → 선택 불가 |
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
| 옵션값 삭제 | 주문이 있는 opt_item_id는 `use_yn='N'` 처리 (물리 삭제 불가) |
| SKU 가격 변경 | `pdh_prod_sku_price_hist`에 변경 전/후 add_price 기록 |
| SKU 재고 변경 | `pdh_prod_sku_stock_hist`에 기록 (chg_reason_cd: SKU_STOCK_CHG) |
| SKU 상태 변경 | `pdh_prod_sku_chg_hist`에 use_yn 변경 기록 |

---

## 이력 관리

### pdh_prod_sku_price_hist — SKU 가격 변경 이력
| 필드 | 설명 |
|---|---|
| `hist_id` | 이력ID |
| `sku_id` | 대상 SKU |
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
| `sku_id` | 대상 SKU |
| `stock_before` | 변경 전 재고 |
| `stock_after` | 변경 후 재고 |
| `chg_qty` | 변경수량 (양수=입고, 음수=출고) |
| `chg_reason_cd` | 변경사유코드 — SKU_STOCK_CHG { SALE:판매, PURCHASE:매입입고, RETURN:반품입고, EXCHANGE:교환, ADJUST:재고조정, CLAIM:클레임, ADMIN:관리자수동 } |
| `order_item_id` | 주문상품ID (주문/클레임 연동 시) |

### pdh_prod_sku_chg_hist — SKU 상태 변경 이력
SKU의 `use_yn` 활성/비활성 변경만 기록.

---

## 관련 코드
- `OPT_TYPE`: NONE / COLOR / SIZE / MATERIAL / CUSTOM (옵션 의미 분류)
- `OPT_INPUT_TYPE`: SELECT / SELECT_INPUT / MULTI_SELECT (UI 입력 방식)
- `SKU_STOCK_CHG`: SALE / PURCHASE / RETURN / EXCHANGE / ADJUST / CLAIM / ADMIN (재고 변경 사유)

## 관련 테이블
- `pd_prod_opt` — 옵션 차원 (opt_id PK, opt_level, opt_type_cd)
- `pd_prod_opt_item` — 옵션 값 (opt_item_id PK, opt_id FK)
- `pd_prod_sku` — SKU (opt_item_id_1/2 참조)
- `pd_prod_img` — 상품 이미지 (opt_item_id_1/2 연동)
- `pdh_prod_sku_price_hist` — SKU 가격 변경 이력
- `pdh_prod_sku_stock_hist` — SKU 재고 변경 이력
- `pdh_prod_sku_chg_hist` — SKU 상태 변경 이력
- `od_order_item` — 주문 시 sku_id + opt_item_id_1/2 스냅샷

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (옵션/SKU 탭) |

## 관련 정책서
- `pd.03.상품.md` — 상품 기본 정보
- `pd.09.상품가격-재고.md` — 가격·재고 상세 정책

## 변경이력
- 2026-04-19: 스키마 변경 전면 반영 (opt_grp_id→opt_id, opt_id→opt_item_id, opt_item_id_1/2, opt_level, opt_type_cd, opt_input_type_cd, opt_val/opt_cd, 이력테이블 분리)

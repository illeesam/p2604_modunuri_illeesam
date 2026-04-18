# pd.08. 상품 옵션 정책

## 정의
상품의 선택 가능한 속성(색상·사이즈·용량 등)을 계층 구조로 관리하고,
옵션 조합별로 **SKU(재고 관리 단위)**를 생성하여 재고·가격을 독립 관리한다.

---

## 테이블 구조

```
pd_prod (상품)
└─ pd_prod_opt_grp (옵션 그룹 - 예: "색상+사이즈 조합")
     └─ pd_prod_opt (옵션 값 - 예: 색상:빨강, 사이즈:M)
          └─ pd_prod_opt_sku (SKU - 옵션 조합별 재고/가격 단위)
```

---

## 옵션 단계

| 단계 | 옵션 수 | 예시 | SKU 생성 방식 |
|---|---|---|---|
| 옵션 없음 | 0 | 단일 상품 | SKU 1개 (opt_id_1=NULL) |
| 1단 옵션 | 1 | 용량만 | opt_seq=1 값 수만큼 SKU |
| 2단 옵션 | 2 | 색상 + 사이즈 | opt_seq1 × opt_seq2 조합만큼 SKU |

> 현재 DDL 기준 최대 2단(opt_id_1, opt_id_2)

---

## 주요 필드

### pd_prod_opt_grp — 옵션 그룹
| 필드 | 설명 |
|---|---|
| `opt_grp_id` | 옵션그룹ID |
| `prod_id` | 상품ID |
| `opt_grp_nm` | 그룹명 (예: "색상+사이즈 조합") |
| `sort_ord` | 정렬순서 |

### pd_prod_opt — 옵션 값
| 필드 | 설명 |
|---|---|
| `opt_id` | 옵션값ID |
| `opt_grp_id` | 소속 그룹 |
| `opt_seq` | 옵션 순서 (1=첫 번째 속성, 2=두 번째 속성) |
| `opt_type_nm` | 옵션 종류명 (예: 색상, 사이즈, 용량) |
| `opt_level` | 같은 opt_seq 내 값의 순번 (빨강=1, 파랑=2, ...) |
| `opt_nm` | 옵션값명 (예: 빨강, M) |
| `opt_code` | 옵션값코드 (예: RED, SIZE_M) |
| `use_yn` | 사용여부 (N=선택 불가, 품절이면 SKU에서 관리) |

### pd_prod_opt_sku — SKU
| 필드 | 설명 |
|---|---|
| `sku_id` | SKU ID |
| `prod_id` | 상품ID |
| `opt_id_1` | 옵션1 값ID (NULL=옵션 없음) |
| `opt_id_2` | 옵션2 값ID (NULL=1단 옵션) |
| `sku_code` | 자체 SKU 코드 (바코드·ERP 연동용) |
| `add_price` | 옵션 추가금액 (기본 0원) |
| `prod_opt_stock` | 해당 조합 재고수량 |
| `use_yn` | 사용여부 Y/N |

---

## 옵션 구조 예시

### 1단 옵션 (용량)
```
pd_prod_opt_grp
  opt_grp_id = GRP-001
  opt_grp_nm = "용량"

pd_prod_opt (opt_seq=1, opt_type_nm="용량")
  opt_id=OPT-001  opt_nm="100ml"  opt_level=1
  opt_id=OPT-002  opt_nm="200ml"  opt_level=2
  opt_id=OPT-003  opt_nm="500ml"  opt_level=3

pd_prod_opt_sku (SKU 3개)
  SKU-001  opt_id_1=OPT-001  add_price=    0  stock=20
  SKU-002  opt_id_1=OPT-002  add_price=3,000  stock=15
  SKU-003  opt_id_1=OPT-003  add_price=8,000  stock=10
```

### 2단 옵션 (색상 + 사이즈)
```
pd_prod_opt_grp
  opt_grp_id = GRP-002
  opt_grp_nm = "색상+사이즈 조합"

pd_prod_opt (opt_seq=1, opt_type_nm="색상")
  opt_id=OPT-010  opt_nm="블랙"  opt_code=BLACK
  opt_id=OPT-011  opt_nm="화이트" opt_code=WHITE

pd_prod_opt (opt_seq=2, opt_type_nm="사이즈")
  opt_id=OPT-020  opt_nm="S"  opt_code=SIZE_S
  opt_id=OPT-021  opt_nm="M"  opt_code=SIZE_M
  opt_id=OPT-022  opt_nm="L"  opt_code=SIZE_L

pd_prod_opt_sku (SKU 6개 = 2색상 × 3사이즈)
  SKU-010  opt_id_1=OPT-010(블랙)  opt_id_2=OPT-020(S)  stock=5   add_price=0
  SKU-011  opt_id_1=OPT-010(블랙)  opt_id_2=OPT-021(M)  stock=10  add_price=0
  SKU-012  opt_id_1=OPT-010(블랙)  opt_id_2=OPT-022(L)  stock=8   add_price=0
  SKU-013  opt_id_1=OPT-011(화이트) opt_id_2=OPT-020(S) stock=3   add_price=0
  SKU-014  opt_id_1=OPT-011(화이트) opt_id_2=OPT-021(M) stock=7   add_price=0
  SKU-015  opt_id_1=OPT-011(화이트) opt_id_2=OPT-022(L) stock=0   add_price=0  ← 품절
```

---

## 주문 시 옵션 처리

### 구매자 선택 → SKU 조회
```
1. 구매자: 색상="블랙", 사이즈="M" 선택
2. 조회: opt_id_1=OPT-010 AND opt_id_2=OPT-021 → SKU-011 조회
3. 재고 확인: prod_opt_stock = 10 → 구매 가능
4. 판매가 계산: pd_prod.sale_price + SKU-011.add_price
```

### od_order_item 생성 시 스냅샷
```
od_order_item
  sku_id     : SKU-011          ← SKU 참조
  opt_nm     : 블랙 / M          ← 선택 옵션명 스냅샷
  unit_price : 25,000원          ← sale_price + add_price 스냅샷
  qty        : 1
```

---

## 옵션 이미지 연동

`pd_prod_img.opt_id_1` / `opt_id_2`로 옵션에 따른 이미지 자동 전환:

| opt_id_1 | opt_id_2 | 이미지 적용 범위 |
|---|---|---|
| NULL | NULL | 상품 공통 대표이미지 |
| 색상값 | NULL | 해당 색상의 모든 사이즈 공통 |
| 색상값 | 사이즈값 | 특정 색상+사이즈 전용 이미지 |

> 구매자가 색상을 선택하면 해당 opt_id_1에 연결된 이미지로 자동 교체

---

## 옵션 상태 관리

| 상태 | 처리 |
|---|---|
| `use_yn = 'N'` (pd_prod_opt) | 옵션 값 비활성화 → 선택 불가 |
| `prod_opt_stock = 0` (SKU) | 해당 조합 품절 → UI에 "품절" 표시, 선택 불가 |
| `use_yn = 'N'` (SKU) | SKU 비활성화 (옵션 폐기) |

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
| 옵션값 삭제 | 주문이 있는 opt_id는 `use_yn='N'` 처리 (물리 삭제 불가) |
| SKU 가격 변경 | `pd_prod_opt_sku_chg_hist`에 변경 전/후 값 기록 |
| SKU 재고 변경 | `pd_prod_opt_sku_chg_hist`에 기록 |

---

## 이력 관리

`pd_prod_opt_sku_chg_hist` — SKU별 가격·재고·상태 변경 이력:

| chg_type_cd | 설명 | 예시 |
|---|---|---|
| PRICE | 가격 변경 | before=1000, after=1500 |
| STOCK | 재고 변경 | before=50, after=30 |
| STATUS | 상태 변경 | before=Y, after=N |

---

## 관련 코드
- `PROD_OPT_TYPE`: COLOR / SIZE / VOLUME / WEIGHT / ETC (옵션 종류)
- `PROD_OPT_STATUS`: ACTIVE / SOLD_OUT / INACTIVE

## 관련 테이블
- `pd_prod_opt_grp` — 옵션 그룹
- `pd_prod_opt` — 옵션 값
- `pd_prod_opt_sku` — SKU (재고/가격 단위)
- `pd_prod_img` — 상품 이미지 (opt_id_1, opt_id_2 연동)
- `pd_prod_opt_sku_chg_hist` — SKU 변경 이력
- `od_order_item` — 주문 시 sku_id + opt_nm 스냅샷

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (옵션/SKU 탭) |

## 관련 정책서
- `pd.03.상품.md` — 상품 기본 정보
- `pd.09.상품가격-재고.md` — 가격·재고 상세 정책

## 변경이력
- 2026-04-19: 초기 작성

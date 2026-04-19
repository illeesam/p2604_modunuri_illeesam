# pd.09. 상품 가격·재고 정책

## 정의
상품 가격은 정가·판매가·매입가·옵션 추가금액으로 구성되며,
재고는 옵션 없는 상품은 상품 단위, 옵션 있는 상품은 SKU 단위로 관리한다.

---

## 가격 구조

### 가격 필드 체계
```
pd_prod
  list_price       정가 (소비자 기준 원래 가격)
  sale_price       판매가 (실제 결제 기준가)
  purchase_price   매입가 (원가 — 내부 관리용, 화면 미노출)
  margin_rate      마진율 % (내부 관리용)

pd_prod_sku
  add_price        옵션 추가금액 (기본 0원)

최종 판매가 = sale_price + add_price
할인율 (%) = (list_price - sale_price) / list_price × 100
```

### 필드 규칙
| 필드 | 타입 | 규칙 |
|---|---|---|
| `list_price` | BIGINT | 0 이상 필수. `sale_price` 이상이어야 함 |
| `sale_price` | BIGINT | 0 이상 필수. `list_price` 이하 |
| `purchase_price` | BIGINT | NULL 허용 (선택 입력) |
| `margin_rate` | DECIMAL(5,2) | NULL 허용. `purchase_price` 입력 시 자동 계산 가능 |
| `add_price` | BIGINT | 0 이상. SKU별 독립. 마이너스 불가 |

### 마진율 계산
```
margin_rate = (sale_price - purchase_price) / sale_price × 100
예) sale_price=25,000 / purchase_price=10,000
    margin_rate = (25,000 - 10,000) / 25,000 × 100 = 60.00%
```

---

## 가격 변경 정책

| 항목 | 정책 |
|---|---|
| 변경 횟수 제한 | 상품당 일 최대 3회 (이상 변경 시 관리자 승인 필요) |
| 이력 기록 | `pdh_prod_chg_hist` — 변경 전/후 값, 변경사유, 처리자 |
| SKU 추가금액 이력 | `pdh_prod_sku_price_hist` — add_price_before/after BIGINT |
| 주문에 소급 적용 | 불가 — 주문 시 `od_order_item.unit_price` 스냅샷 유지 |
| 0원 판매가 | 허용 (쿠폰 전액 적용 상품 등) |

---

## 재고 구조

### 옵션 없는 상품
```
pd_prod.prod_stock    ← 재고 단위
주문 시: prod_stock 차감
반품 시: prod_stock 복원
```

### 옵션 있는 상품
```
pd_prod_sku.prod_opt_stock  ← SKU별 재고 단위
주문 시: 해당 SKU.prod_opt_stock 차감
반품 시: 해당 SKU.prod_opt_stock 복원
pd_prod.prod_stock = SKU 재고 합산 자동 반영 (배치 또는 실시간)
```

---

## 재고 관리 정책

| 항목 | 정책 |
|---|---|
| 안전재고 | 5개 이하 시 관리자 알림 (sy_alarm) |
| 품절 자동 처리 | `prod_opt_stock = 0` → 해당 SKU 선택 불가 + "품절" 표시 |
| 상품 전체 품절 | 전체 SKU 품절 → `pd_prod.sold_out_yn = 'Y'` |
| 강제 품절 설정 | `sold_out_yn = 'Y'` 수동 설정 시 재고 있어도 품절 표시 |
| 예약 주문 | 재고 부족 시 예약 주문 처리 가능 (운영 정책 설정) |
| 재고 실시간 반영 | 주문 결제 완료 → 즉시 차감 / 취소·반품 완료 → 즉시 복원 |

### 재고 변경 이력 (pdh_prod_sku_stock_hist)
```
sku_id        : SKU002
stock_before  : 30
stock_after   : 28
chg_qty       : -2   (음수=출고)
chg_reason_cd : SALE
order_item_id : OI-20260419-001
```

재고 변경 사유 코드 — SKU_STOCK_CHG:
| 코드 | 설명 |
|---|---|
| SALE | 판매 |
| PURCHASE | 매입입고 |
| RETURN | 반품입고 |
| EXCHANGE | 교환 |
| ADJUST | 재고조정 |
| CLAIM | 클레임 |
| ADMIN | 관리자수동 |

---

## 가격·재고 데이터 시뮬레이션

### 시나리오 전제
```
[상품]
prod_id      : A-PROD-001
prod_nm      : 프리미엄 핸드크림 세트
list_price   : 35,000원
sale_price   : 25,000원
purchase_price: 10,000원
margin_rate  : 60.00%

[SKU - 2단 옵션: 향 × 용량]
SKU001  opt_item_id_1=ITEM001(라벤더)  opt_item_id_2=ITEM004(50ml)   add_price=0      stock=20
SKU002  opt_item_id_1=ITEM001(라벤더)  opt_item_id_2=ITEM005(100ml)  add_price=5,000  stock=15
SKU003  opt_item_id_1=ITEM002(로즈)    opt_item_id_2=ITEM004(50ml)   add_price=1,000  stock=8
SKU004  opt_item_id_1=ITEM002(로즈)    opt_item_id_2=ITEM005(100ml)  add_price=6,000  stock=0  ← 품절
```

---

### 구매자 선택 → 판매가 계산
```
선택: 라벤더 / 100ml
조회: SKU002 (add_price=5,000, stock=15)

최종 판매가 = 25,000 + 5,000 = 30,000원
할인율 = (35,000 - 30,000) / 35,000 × 100 ≈ 14.3%
```

---

### 주문 생성 → 재고 차감
```
주문: 라벤더 / 100ml × 2개

SKU002.prod_opt_stock: 15 → 13 (2개 차감)
pd_prod.prod_stock: 합산 갱신

od_order_item
  sku_id          : SKU002
  opt_item_id_1   : ITEM001  (스냅샷)
  opt_item_id_2   : ITEM005  (스냅샷)
  unit_price      : 30,000원 (스냅샷: sale_price + add_price)
  qty             : 2

pdh_prod_sku_stock_hist
  sku_id=SKU002  stock_before=15  stock_after=13  chg_qty=-2  chg_reason_cd=SALE
```

---

### 가격 변경 시나리오
```
관리자: SKU002 add_price 5,000 → 7,000 변경

pdh_prod_sku_price_hist 기록:
  sku_id          : SKU002
  prod_id         : A-PROD-001
  add_price_before: 5000
  add_price_after : 7000
  chg_reason      : 원가 인상
  chg_by          : admin-001
  chg_date        : 2026-04-19 14:30:00

기존 주문 od_order_item.unit_price: 변경 없음 (30,000원 유지)
신규 주문부터: 25,000 + 7,000 = 32,000원 적용
```

---

### 재고 부족 → 안전재고 알림
```
SKU001 (라벤더/50ml)
  현재 재고: 20개
  주문 15개 → 잔여 5개 → 안전재고 도달

sy_alarm 생성:
  alarm_title : "[상품] 안전재고 도달"
  alarm_msg   : "A-PROD-001 라벤더/50ml SKU 재고 5개"
  수신: 담당 관리자
```

---

## 관련 코드
- `SKU_STOCK_CHG`: SALE / PURCHASE / RETURN / EXCHANGE / ADJUST / CLAIM / ADMIN (재고 변경 사유)

## 관련 테이블
- `pd_prod` — 상품 기본 가격·재고 (`sale_price`, `prod_stock`, `sold_out_yn`)
- `pd_prod_sku` — SKU별 추가금액·재고 (`add_price`, `prod_opt_stock`)
- `pdh_prod_chg_hist` — 상품 변경 이력 (가격 변경 포함)
- `pdh_prod_sku_price_hist` — SKU 추가금액 변경 이력 (add_price_before/after)
- `pdh_prod_sku_stock_hist` — SKU 재고 변경 이력 (stock_before/after, chg_qty, chg_reason_cd)
- `pdh_prod_sku_chg_hist` — SKU 상태 변경 이력 (use_yn)
- `od_order_item` — 주문 시 unit_price·opt_item_id_1/2 스냅샷

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (가격·재고 탭) |

## 관련 정책서
- `pd.03.상품.md` — 상품 기본 정보
- `pd.08.상품옵션.md` — 옵션 구조 상세
- `pd.04.배송템플릿.md` — 배송비 계산 (환불 차감 기준)

## 변경이력
- 2026-04-19: 이력 테이블 분리 반영 (pdh_prod_sku_price_hist / pdh_prod_sku_stock_hist), SKU_STOCK_CHG 코드 적용, opt_item_id_1/2 스냅샷 반영
- 2026-04-19: 초기 작성

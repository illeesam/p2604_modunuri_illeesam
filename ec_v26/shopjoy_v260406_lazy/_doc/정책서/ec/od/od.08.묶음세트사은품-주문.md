# od.08. 묶음상품·세트상품·사은품 주문 정책

## 목적
묶음상품·세트상품·사은품이 포함된 주문의 `od_order_item` 생성 방식,
재고 차감, 배송 분리, 금액 계산 기준을 정의한다.

---

## 1. 묶음상품 주문

### order_item 생성 방식

```
od_order (주문 1건)
├─ od_order_item (구성품A, bundle_group_id=BG001, bundle_price_rate=40%)
├─ od_order_item (구성품B, bundle_group_id=BG001, bundle_price_rate=60%)
└─ od_order_item (일반상품C, bundle_group_id=NULL)
```

- 구성품 각각 `od_order_item` **N개** 생성
- `bundle_group_id`: 동일 묶음 구성품임을 표시 (UUID 또는 order_id+seq)
- `bundle_price_rate`: 구성품의 가격 안분율 (%) — `pd_prod_bundle.price_rate` 스냅샷

### 금액 계산

```
묶음가 25,000원, A:40%, B:60%
→ od_order_item(A).unit_price = 25,000 × 0.4 = 10,000
→ od_order_item(B).unit_price = 25,000 × 0.6 = 15,000
→ item_order_amt 합계 = 25,000 ✓
```

### 재고 차감
- 각 구성품의 `pd_prod_sku.stock` 차감
- 결제 완료 시점에 차감

### 배송 분리
- 구성품 업체 동일 → `od_dliv` 1개 (합배송)
- 구성품 업체 다름 → 업체별 `od_dliv` N개 (배송비 각각)

---

## 2. 세트상품 주문

### order_item 생성 방식

```
od_order (주문 1건)
└─ od_order_item (세트상품, bundle_group_id=NULL)
     prod_nm = "선물세트A" (스냅샷)
     unit_price = 35,000 (세트 단일가)
```

- 세트 자체 `od_order_item` **1개** 생성
- 구성품 개별 행 없음
- `unit_price` = 세트 판매가

### 재고 차감
- `pd_prod.prod_stock` 차감 (세트 단위)

### 배송
- 세트 자체 `dliv_tmplt_id` → `od_dliv` **1개**

---

## 3. 사은품 주문

### order_item 생성 방식

```
od_order (주문 1건)
├─ od_order_item (일반상품, unit_price=30,000)
└─ od_order_item (사은품, unit_price=0, gift_id=GIFT001)
```

- 사은품도 `od_order_item` **별도 행** 추가
- `unit_price = 0`, `gift_id` 연결
- `pm_gift_issue` 동시 생성 (gift_id + order_id + member_id)

### 조건 충족 시점
- 결제 완료 후 `pm_gift` 조건 검사
- `gift_stock > 0` 이고 `min_order_amt` 충족 시 발급
- 품절 시 사은품 제외하고 주문 진행

### 재고 차감
- `pm_gift.gift_stock` 차감
- `PRODUCT` 유형은 연결된 `pd_prod.prod_stock`도 함께 차감 여부 운영 설정

---

## 4. 복합 주문 예시

일반상품 + 묶음상품 + 세트상품 + 사은품 한 번에 주문 시:

```
od_order
├─ od_order_item: 일반상품 (3,000원)
├─ od_order_item: 묶음구성품A (10,000원, bundle_group_id=BG001, rate=40%)
├─ od_order_item: 묶음구성품B (15,000원, bundle_group_id=BG001, rate=60%)
├─ od_order_item: 세트상품 (35,000원)
└─ od_order_item: 사은품 (0원, gift_id=GIFT001)

od_order.total_amt = 63,000 (사은품 0원 포함)
od_order.pay_amt = 63,000 (할인·적립금 차감 전)

od_dliv: 업체별 분리 생성
```

---

## DDL 추가 필요
- `od_order_item.bundle_group_id VARCHAR(36)` — 묶음 그룹 식별자
- `od_order_item.bundle_price_rate DECIMAL(5,2)` — 묶음 가격 안분율
- `pd_prod.prod_type_cd VARCHAR(20)` — SINGLE/GROUP/SET

## 관련 테이블
- `od_order`, `od_order_item`, `od_dliv`
- `pd_prod_bundle`, `pm_gift`, `pm_gift_issue`

## 관련 정책서
- `pd.05.묶음상품.md`
- `pd.06.세트상품.md`
- `pd.07.사은품.md`
- `od.16.묶음세트사은품-클레임.md`

## 변경이력
- 2026-04-18: 초기 작성

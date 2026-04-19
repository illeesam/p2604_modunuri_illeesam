# pd.05. 묶음상품 정책

## 정의
독립적으로 판매 가능한 상품 N개를 하나의 패키지로 묶어 **할인 가격**으로 판매하는 상품 유형.
구성품은 개별 판매도 가능하며, 묶음 구성원으로도 판매 가능.

> `pd_prod.prod_type_cd = 'GROUP'`

---

## 구성 구조

```
pd_prod (묶음상품, prod_type_cd=GROUP)
└─ pd_prod_bundle (구성 매핑)
     ├─ component_prod_id → pd_prod (구성품 A)
     ├─ component_prod_id → pd_prod (구성품 B)
     └─ component_prod_id → pd_prod (구성품 C)
```

### pd_prod_bundle 주요 필드
| 필드 | 설명 |
|---|---|
| `bundle_id` | 묶음상품 ID (pd_prod.prod_id) |
| `component_prod_id` | 구성품 상품ID |
| `component_qty` | 구성 수량 (기본 1) |
| `price_rate` | 가격 안분율 (%) — 클레임 환불 기준 |
| `sort_ord` | 노출 순서 |

---

## 가격 정책

- **묶음가**: 구성품 개별 판매가 합산보다 저렴하게 설정
- **안분율 필수**: 구성품별 `price_rate` 합계 = 100%. 부분 클레임 환불 계산 기준
- **할인·쿠폰**: 묶음 상품 단위로 적용 (구성품 각각에 적용 불가)

```
예시) 묶음가 25,000원
  구성품A: 개별가 10,000원 → price_rate = 40% → 환불 기준가 10,000원 (25,000 × 0.40)
  구성품B: 개별가 20,000원 → price_rate = 60% → 환불 기준가 15,000원 (25,000 × 0.60)
```

---

## 재고 정책

- **재고 차감 단위**: 구성품 각각의 재고 차감 (pd_prod_sku 기준)
- **품절 처리**: 구성품 중 1개라도 품절 시 묶음상품 전체 `sold_out_yn = 'Y'`
- 구성품 개별 재고 부족 시 묶음상품 구매 불가

---

## 배송 정책

- 구성품 업체가 동일한 경우: `od_dliv` 1개로 합배송
- 구성품 업체가 다른 경우: 업체별 `od_dliv` 분리 → 배송비 각각 부과
- 배송비 계산: 각 구성품의 `dliv_tmplt` 적용 (묶음상품 자체의 dliv_tmplt 없음)

---

## 혜택 제한
| 혜택 | 적용 |
|---|---|
| 쿠폰 | 묶음상품 단위 적용 가능 (coupon_use_yn) |
| 적립금 사용 | 묶음상품 단위 (save_use_yn) |
| 즉시할인 | 묶음상품 단위 (discnt_use_yn) |
| 추가 사은품 | 묶음 전체 주문금액 기준 |

---

## 주문 후 주문에서 보이는 관점

묶음상품 1건 주문 = `od_order_item` **구성품 수만큼 행 생성**.
`bundle_group_id`로 같은 묶음에서 온 항목임을 표시한다.

### od_order_item 행 구성
```
od_order_item
  bundle_group_id : BG-001       ← 같은 묶음임을 표시
  prod_id         : B-PROD-001   ← 묶음상품 마스터 ID (참조용)
  component_prod_id : A-PROD-001 ← 실제 구성품 ID
  prod_nm         : [묶음] 홈케어세트 - 핸드워시 (스냅샷)
  unit_price      : 10,000원     ← 묶음가 × price_rate (안분 기준가)
  qty             : 1

od_order_item
  bundle_group_id : BG-001       ← 동일 bundle_group_id
  prod_id         : B-PROD-001
  component_prod_id : A-PROD-002
  prod_nm         : [묶음] 홈케어세트 - 바디워시 (스냅샷)
  unit_price      : 15,000원
  qty             : 1
```

### 주문 화면 표시
- 구성품을 `bundle_group_id`로 묶어 **하나의 묶음 블록**으로 표시
- 묶음명·묶음가 표시 + 하위에 구성품 목록 펼쳐보기
- 구성품별 개별 상태(배송추적 등) 표시 가능

---

## 클레임 신청 관점

묶음상품은 **구성품 단위 부분 클레임**이 가능하다.

### 클레임 가능 단위
| 클레임 유형 | 단위 | 비고 |
|---|---|---|
| 취소 | 묶음 전체 또는 구성품 1개 이상 | 배송 전만 가능 |
| 반품 | 구성품 단위 | 구성품별 개별 반품 가능 |
| 교환 | 구성품 단위 | 동일 구성품 내 옵션 변경 |

### 클레임 접수 흐름
```
구성품A 반품 신청
  → od_claim 생성 (claim_type = RETURN)
  → od_claim_item: component_prod_id = A-PROD-001 연결
  → 반품지: 구성품A의 dliv_tmplt.return_addr 기준
  → 반품배송비: 구성품A의 dliv_tmplt.return_cost 기준
```

### 구성품 업체가 다른 경우
- 구성품A (업체X) 반품 + 구성품B (업체Y) 유지
- 클레임은 업체 단위로 분리 생성 (`od_claim.vendor_id` 구분)
- 배송비도 각 업체 템플릿 기준 별도 적용

---

## 환불 처리 시 계산 관점

묶음상품 환불은 **`price_rate`(안분율) 기반**으로 구성품별 환불 기준가를 산출한다.

### 환불 계산식
```
구성품 환불 기준가 = 묶음 결제금액 × (해당 구성품 price_rate / 100)
환불액 = 구성품 환불 기준가 × 반품 수량
       − 반품배송비 (고객귀책 시)
       − add_shipping_fee (무료배송 조건 파괴 시)
```

---

## 데이터 시뮬레이션

### 시나리오 전제
```
[묶음상품 설정]
prod_id      : B-PROD-001
prod_nm      : 홈케어 3종 세트
sale_price   : 30,000원 (묶음 할인가)

[구성품]
A-PROD-001  핸드워시     price_rate = 30%  개별가 12,000원
A-PROD-002  바디워시     price_rate = 40%  개별가 18,000원
A-PROD-003  샴푸         price_rate = 30%  개별가 15,000원

[배송템플릿 - 동일 업체]
dliv_cost         : 3,000원
free_dliv_min_amt : 30,000원
return_cost       : 3,000원
```

---

### 주문 생성 결과
```
[주문]
ord_id      : ORD-2604-001
prod_amt    : 30,000원
dliv_cost   :      0원   ← 30,000 ≥ 30,000 → 무료배송
pay_amt     : 30,000원

[od_order_item]
행1  bundle_group_id=BG-001  핸드워시  unit_price=9,000원   (30,000×0.30)
행2  bundle_group_id=BG-001  바디워시  unit_price=12,000원  (30,000×0.40)
행3  bundle_group_id=BG-001  샴푸      unit_price=9,000원   (30,000×0.30)
```

---

### 시나리오A: 구성품 1개 반품 (고객귀책)
```
반품 대상: 바디워시 (price_rate=40%)

환불 기준가  = 30,000 × 40% = 12,000원
반품 후 잔여 = 18,000원  (< 30,000원 → 무료배송 조건 파괴)

환불액 계산:
  구성품 기준가   12,000원
− add_shipping_fee  3,000원  (무료배송 조건 파괴)
− return_cost       3,000원  (고객귀책)
= 환불액            6,000원
```

---

### 시나리오B: 구성품 2개 반품 (판매자귀책 - 불량)
```
반품 대상: 핸드워시(30%) + 바디워시(40%)

환불 기준가  = 30,000 × 30% + 30,000 × 40% = 9,000 + 12,000 = 21,000원
반품 후 잔여 = 9,000원  (< 30,000원 → 무료배송 조건 파괴)
귀책         : 판매자 (불량품)

환불액 계산:
  구성품 기준가   21,000원
− add_shipping_fee      0원  (판매자 귀책 → 배송비 청구 불가)
− return_cost           0원  (판매자 귀책 → 면제)
= 환불액           21,000원
```

---

### 시나리오C: 묶음 전체 취소 (배송 전)
```
취소 대상: 전체 (3개 구성품)
취소 시점: 배송 전

환불액 = 결제금액 전액 = 30,000원
배송비 환불 여부: 취소이므로 배송 미발생 → 배송비 없음 (0원 부과됐으므로 환급 없음)
```

---

## DDL 추가 필요
- `pd_prod_bundle` — 묶음 구성품 테이블 (신규)
- `pd_prod.prod_type_cd` — SINGLE/GROUP/SET 컬럼 추가
- `od_order_item.bundle_group_id` — 묶음 주문 그룹키 (신규)
- `od_order_item.component_prod_id` — 묶음 구성품 상품ID (신규)

## 관련 테이블
- `pd_prod` (prod_type_cd=GROUP)
- `pd_prod_bundle` (구성 매핑)
- `od_order_item` (bundle_group_id, component_prod_id)
- `od_claim` / `od_claim_item` (구성품 단위 클레임)

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (묶음 탭) |

## 관련 정책서
- `pd.06.세트상품.md` — 세트상품과 차이점
- `od.08.묶음세트사은품-주문.md` — 주문 처리
- `od.16.묶음세트사은품-클레임.md` — 클레임 처리

## 변경이력
- 2026-04-19: 주문 관점·클레임 관점·환불 계산 관점 및 데이터 시뮬레이션 추가
- 2026-04-18: 초기 작성

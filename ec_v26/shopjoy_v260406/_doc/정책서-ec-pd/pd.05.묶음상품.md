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
  구성품A: 10,000원 → price_rate = 40% → 환불 기준가 10,000원
  구성품B: 20,000원 → price_rate = 60% → 환불 기준가 15,000원  (단, 25,000 * 0.6)
```

---

## 재고 정책

- **재고 차감 단위**: 구성품 각각의 재고 차감 (pd_prod_opt_sku 기준)
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

## DDL 추가 필요
- `pd_prod_bundle` — 묶음 구성품 테이블 (신규)
- `pd_prod.prod_type_cd` — SINGLE/GROUP/SET 컬럼 추가
- `od_order_item.bundle_group_id` — 묶음 주문 그룹키 (신규)

## 관련 테이블
- `pd_prod` (prod_type_cd=GROUP)
- `pd_prod_bundle` (구성 매핑)
- `od_order_item` (bundle_group_id로 묶음)

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdProdMng` | 상품관리 > 상품관리 (묶음 탭) |

## 관련 정책서
- `pd.06.세트상품.md` — 세트상품과 차이점
- `od.08.묶음세트사은품-주문.md` — 주문 처리
- `od.16.묶음세트사은품-클레임.md` — 클레임 처리

## 변경이력
- 2026-04-18: 초기 작성

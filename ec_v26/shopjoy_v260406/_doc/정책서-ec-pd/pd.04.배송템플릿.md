# pd.04. 배송템플릿 정책

## 목적
업체(Vendor)별로 배송비 조건·반품지 정보를 템플릿으로 등록하고,
상품 등록 시 템플릿을 선택하여 배송비를 일괄 관리한다.

## 왜 템플릿인가

업체 단위 단일 배송비로는 처리 불가능한 경우:

| 상품 유형 | 배송비 | 무료 조건 |
|---|---|---|
| 일반 상품 | 3,000원 | 30,000원 이상 무료 |
| 대형·중량 상품 | 10,000원 | 무료 없음 |
| 도서·음반 | 2,500원 | 무료 없음 |
| 무료배송 상품 | 0원 | 항상 무료 |

→ **업체 1개에 템플릿 N개**. 상품 등록 시 적합한 템플릿을 선택.

**일괄 변경 이점**: 배송비 인상, 반품지 주소 변경 시 템플릿 1개 수정 → 참조 상품 전체 즉시 반영.

---

## 테이블 구조

```
sy_vendor (업체)
└─ pd_dliv_tmplt (배송템플릿, vendor_id FK)
     └─ pd_prod.dliv_tmplt_id → 참조
```

---

## 주요 필드

| 필드 | 설명 |
|---|---|
| `dliv_tmplt_id` | 배송템플릿ID (PK) |
| `vendor_id` | 소유 업체 (sy_vendor.vendor_id) |
| `dliv_tmplt_nm` | 템플릿명 (예: "일반배송", "대형상품") |
| `dliv_method_cd` | 배송방법 (코드: DLIV_METHOD) |
| `dliv_pay_type_cd` | 배송비 결제방식 (PREPAY/COD) |
| `dliv_courier_cd` | 발송 택배사 |
| `dliv_cost` | 기본 배송비 |
| `free_dliv_min_amt` | 무료배송 최소 주문금액 (0=무조건 유료) |
| `island_extra_cost` | 도서산간 추가배송비 |
| `return_cost` | 반품배송비 (편도) |
| `exchange_cost` | 교환배송비 (왕복 = 반품 + 재발송) |
| `return_courier_cd` | 반품 택배사 |
| `return_addr_zip` | 반품지 우편번호 |
| `return_addr` | 반품지 주소 |
| `return_addr_detail` | 반품지 상세주소 |
| `return_tel_no` | 반품지 전화번호 |
| `base_dliv_yn` | 기본 배송템플릿 여부 |

---

## 배송비 계산 규칙

### 정상 주문 시
1. `dliv_cost` = 기본 배송비
2. 주문금액 ≥ `free_dliv_min_amt` → 배송비 0원
3. 도서산간 주소 → `island_extra_cost` 추가

### 반품 시
- 고객귀책: 구매자 부담 → `return_cost` (편도)
- 판매자귀책: 판매자 부담 → `return_cost` 면제

### 교환 시
- 고객귀책: 구매자 부담 → `exchange_cost` (왕복)
- 판매자귀책: 판매자 부담 → `exchange_cost` 면제
- `exchange_cost` = 수거 편도 + 재발송 편도 합산 기준

### 무료배송 조건 파괴 시
- 일부 취소·반품으로 주문금액이 `free_dliv_min_amt` 미만이 되면
  원 배송비(`dliv_cost`) 추가 청구 가능 → `od_claim.add_shipping_fee`

---

## 운영 정책

| 항목 | 정책 |
|---|---|
| 기본 템플릿 | `base_dliv_yn = 'Y'` 업체당 1개. 상품 등록 시 기본 선택 |
| 삭제 제한 | 상품이 참조 중인 템플릿은 `use_yn = 'N'` 처리만 가능 (물리 삭제 불가) |
| 권한 | 업체 담당자는 자사 템플릿만 조회·수정 가능 |
| 반품지 | 템플릿에 반품지 주소 필수 등록. 클레임 수거지 기본값으로 사용 |

---

## 상품 등록 연계

- `pd_prod.dliv_tmplt_id` → 배송템플릿 참조
- 주문 생성 시 `od_order_item.dliv_tmplt_id` 스냅샷 저장 (주문 시점 조건 보존)
- 템플릿 변경이 기존 주문에 소급 적용되지 않도록 스냅샷 필수

---

## 관련 코드
- `DLIV_METHOD`: COURIER / DIRECT / PICKUP / SAME_DAY
- `DLIV_PAY_TYPE`: PREPAY / COD
- `DLIV_COST_TYPE`: FREE / FIXED / COND_FREE / ISLAND_EXTRA
- `COURIER`: CJ / LOGEN / POST / HANJIN / LOTTE / KYOUNGDONG / DIRECT

## 관련 테이블
- `pd_dliv_tmplt` — 배송템플릿 마스터
- `pd_prod` — 상품 (`dliv_tmplt_id` FK)
- `od_order_item` — 주문상품 (`dliv_tmplt_id` 스냅샷)
- `od_claim` — 클레임 (반품·교환 시 `return_addr` 참조)

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdDlivTmpltMng` | 상품관리 > 배송템플릿관리 |

## 변경이력
- 2026-04-18: 초기 작성

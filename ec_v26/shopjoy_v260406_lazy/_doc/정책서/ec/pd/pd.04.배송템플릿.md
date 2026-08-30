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
          └─ od_order_item.dliv_tmplt_snapshot (주문 시 스냅샷)
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
| `exchange_cost` | 교환배송비 (왕복 = 수거 편도 + 재발송 편도) |
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

## 주문 후 주문에서 보이는 관점

주문 생성 시점에 `od_order_item`에 템플릿 정보를 **스냅샷**으로 저장한다.
이후 템플릿이 변경되어도 기존 주문에는 영향 없음.

### 주문 상세 화면 노출 항목
| 정보 | 출처 | 비고 |
|---|---|---|
| 배송방법 | `dliv_method_cd` 스냅샷 | 택배/직배송/방문수령 |
| 배송비 | 주문 시 계산 결과 → `od_order.dliv_cost` | 무료조건 반영 후 확정값 |
| 무료배송 여부 | `free_dliv_min_amt` 충족 여부 | "무료배송" 배지 표시 |
| 도서산간 추가비 | `island_extra_cost` | 해당 시 별도 행 표시 |
| 반품지 주소 | `return_addr_*` 스냅샷 | 클레임 시 자동 안내 |
| 반품 택배사 | `return_courier_cd` 스냅샷 | 반품 신청 시 안내 |

---

## 클레임 신청 관점

반품·교환 클레임 신청 시 `od_order_item.dliv_tmplt_id` 스냅샷 기준으로 반품지·배송비를 자동 결정한다.

### 클레임 접수 시 자동 적용
```
반품 신청 → od_order_item.dliv_tmplt_id 조회
  ├─ 반품지 주소 (return_addr_*) → 수거 요청지 자동 입력
  ├─ return_courier_cd → 수거 택배사 안내
  └─ 귀책 사유 결정 → return_cost 부담 주체 확정
```

### 귀책 판단 → 배송비 부담
| 귀책 | 반품 | 교환 |
|---|---|---|
| 고객귀책 | `return_cost` 고객 부담 | `exchange_cost` 고객 부담 |
| 판매자귀책 | 면제 (판매자가 부담) | 면제 (판매자가 부담) |
| 하자·오배송 | 면제 (판매자 귀책) | 면제 |

### 무료배송 조건 파괴 시
- 일부 취소·반품으로 잔여 주문금액 < `free_dliv_min_amt`
- `od_claim.add_shipping_fee` = 원 배송비 추가 청구
- 고객 동의 후 환불 금액에서 차감

---

## 환불 처리 시 계산 관점

환불액 = 상품금액 − 배송비 추가청구 − 반품배송비(고객귀책)

### 반품 환불 계산식
```
환불액 = 반품 상품 결제금액
       − add_shipping_fee      (무료배송 조건 파괴 시)
       − return_cost            (고객귀책 시)
```

### 교환 환불 처리
- 동일 상품·옵션 교환: 교환 배송비만 정산 (환불 없음)
- 가격 차이 발생 시: 차액 추가 결제 또는 환불
- 교환 불가 → 반품으로 전환 시 반품 계산식 적용

---

## 데이터 시뮬레이션

### 시나리오: 일반 주문 → 반품 신청

```
[배송템플릿]
dliv_tmplt_id : T001
dliv_cost     : 3,000원
free_dliv_min_amt : 30,000원
return_cost   : 3,000원
exchange_cost : 6,000원

[주문]
od_order.ord_id         : ORD-001
od_order.prod_amt       : 45,000원    ← 상품금액 합계
od_order.dliv_cost      : 0원         ← 45,000 ≥ 30,000 → 무료배송
od_order.pay_amt        : 45,000원
```

```
[시나리오A] 일부 반품 → 무료배송 조건 파괴
반품 상품 금액    : 20,000원
반품 후 잔여 금액 : 25,000원  (< 30,000원 → 조건 파괴)
귀책              : 고객

환불액 계산:
  반품 상품금액    20,000원
− add_shipping_fee  3,000원  (무료배송 조건 파괴 → 원 배송비 청구)
− return_cost       3,000원  (고객귀책 반품배송비)
= 환불액           14,000원
```

```
[시나리오B] 전체 반품 → 무료배송 조건 파괴 없음
반품 상품 금액    : 45,000원
귀책              : 판매자 (오배송)

환불액 계산:
  반품 상품금액    45,000원
− add_shipping_fee      0원  (전체 반품 → 배송비 조건 해당 없음)
− return_cost           0원  (판매자 귀책 → 면제)
= 환불액           45,000원
```

```
[시나리오C] 교환 신청 (고객귀책)
교환 대상 금액    : 15,000원
귀책              : 고객 (단순 변심)

정산:
  추가 결제        6,000원  (exchange_cost, 왕복배송비)
  환불             없음
```

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
- `od_claim` — 클레임 (`return_addr` 참조, `add_shipping_fee` 저장)

## 관련 화면
| pageId | 라벨 |
|---|---|
| `pdDlivTmpltMng` | 상품관리 > 배송템플릿관리 |

## 변경이력
- 2026-04-19: 주문 관점·클레임 관점·환불 계산 관점 및 데이터 시뮬레이션 추가
- 2026-04-18: 초기 작성

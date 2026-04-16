# 배송(DLIV) 시스템 설계 개선 (2026-04-16)

## 📋 개요

기존 배송 시스템의 구조적 문제를 해결하고, 입고/출고 구분 및 배송비 추적 기능을 추가한 종합 개선안입니다.

---

## 🔴 기존 문제점

| 항목 | 문제 | 영향 |
|---|---|---|
| **입고/출고 미분류** | ec_dliv가 출고만 다룸 | 반품 배송 프로세스 불명확 |
| **단일 택배사** | courier_cd 1개만 존재 | 반품/교환 시 수거/반입/발송 택배사 구분 불가 |
| **배송비 미관리** | 배송비 관련 필드 없음 | 반품/교환 배송비 정산 불가 |
| **주문/클레임 배송정보 부재** | od_order, ec_claim에 배송 정보 없음 | 조회 시 od_dliv join 필수 |
| **클레임-배송 미연결** | claim_id 링크 없음 | 반품/교환 배송을 어느 클레임과 연결할지 불명확 |
| **다중배송 추적 불가** | parent_dliv_id 없음 | 교환 시 반품배송+신상품배송 관계 추적 불가 |

---

## ✅ 개선 설계

### 1) **od_dliv 개선** (핵심)

#### 추가 컬럼

```sql
dliv_div_cd              -- 입출고 구분 (OUTBOUND/INBOUND)
dliv_type_cd             -- 배송 유형 (NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)
claim_id                 -- 클레임 링크
outbound_courier_cd      -- 출고(발송) 택배사 (기존 courier_cd 대체)
outbound_tracking_no     -- 출고(발송) 송장
inbound_courier_cd       -- 반입 택배사 (반품일 때만)
inbound_tracking_no      -- 반입 송장
shipping_fee             -- 배송료
shipping_fee_type_cd     -- 배송료 구분 (OUTBOUND/RETURN/INBOUND/EXCHANGE)
parent_dliv_id           -- 부모 배송 ID (교환 시 원본 배송 참조)
```

#### 프로세스별 예시

**정상 배송 (OUTBOUND)**
```
dliv_div_cd    = 'OUTBOUND'
dliv_type_cd   = 'NORMAL'
outbound_courier_cd = '택배사코드'
outbound_tracking_no = '송장번호'
shipping_fee_type_cd = 'OUTBOUND'
parent_dliv_id = NULL
```

**반품 (INBOUND)**
```
dliv_div_cd    = 'INBOUND'
dliv_type_cd   = 'RETURN'
outbound_courier_cd = '수거택배사'
outbound_tracking_no = '수거송장'
inbound_courier_cd = '반입택배사'
inbound_tracking_no = '반입송장'
claim_id = 'claim_id' (연결)
shipping_fee_type_cd = 'RETURN' 또는 'INBOUND'
parent_dliv_id = NULL
```

**교환 (2건 배송)**
```
# 배송 1 - 반품 반입
dliv_div_cd    = 'INBOUND'
dliv_type_cd   = 'EXCHANGE'
outbound_courier_cd = '수거택배사'
outbound_tracking_no = '수거송장'
claim_id = 'claim_id'
shipping_fee_type_cd = 'RETURN'
parent_dliv_id = NULL

# 배송 2 - 교환상품 발송
dliv_div_cd    = 'OUTBOUND'
dliv_type_cd   = 'EXCHANGE_OUT'
outbound_courier_cd = '발송택배사'
outbound_tracking_no = '발송송장'
claim_id = 'claim_id'
shipping_fee_type_cd = 'EXCHANGE'
parent_dliv_id = '배송1_ID' (반품 배송 참조)
```

---

### 2) **od_order 개선**

#### 추가 컬럼

```sql
outbound_shipping_fee    -- 출고배송료 (스냅샷)
dliv_courier_cd          -- 최근 배송 택배사 (조회 편의)
dliv_tracking_no         -- 최근 배송 송장 (조회 편의)
dliv_status_cd           -- 배송상태 (조회 편의)
dliv_ship_date           -- 최근 출고일시 (조회 편의)
```

#### 용도
- 주문 조회 시 배송 정보 바로 표시
- od_dliv join 없이도 최신 배송 상태 조회 가능

---

### 3) **od_order_item 개선**

#### 추가 컬럼

```sql
outbound_shipping_fee    -- 해당 항목의 배송료
dliv_courier_cd          -- 해당 항목의 배송 택배사
dliv_tracking_no         -- 해당 항목의 배송 송장
dliv_ship_date           -- 해당 항목의 출고일시
```

#### 용도
- 부분배송 시 항목별 배송 추적
- 예: 1개는 A택배로, 1개는 B택배로 배송되는 경우

---

### 4) **od_claim 개선** (가장 중요)

#### 반품 관련 컬럼

```sql
-- 수거
return_shipping_fee      -- 수거배송료
return_courier_cd        -- 수거 택배사
return_tracking_no       -- 수거 송장
return_status_cd         -- 수거 상태

-- 반입
inbound_shipping_fee     -- 반입배송료
inbound_courier_cd       -- 반입 택배사
inbound_tracking_no      -- 반입 송장
inbound_dliv_id          -- 반입 배송 ID (od_dliv 참조)
```

#### 교환 관련 컬럼

```sql
-- 교환상품 발송
exchange_shipping_fee    -- 교환상품 발송배송료
exchange_courier_cd      -- 교환상품 발송 택배사
exchange_tracking_no     -- 교환상품 발송 송장
outbound_dliv_id         -- 교환상품 발송 배송 ID (od_dliv 참조)
```

#### 정산 관련 컬럼

```sql
total_shipping_fee       -- 총 배송료
shipping_fee_paid_yn     -- 정산 완료 여부
shipping_fee_paid_date   -- 정산일시
shipping_fee_memo        -- 배송료 비고
```

---

### 5) **od_claim_item 개선**

#### 추가 컬럼

```sql
return_shipping_fee      -- 해당 항목의 수거배송료
inbound_shipping_fee     -- 해당 항목의 반입배송료
exchange_shipping_fee    -- 해당 항목의 교환 발송배송료
```

#### 용도
- 클레임 항목별 배송비 추적
- 예: 2개 반품 중 1개만 다시 배송하는 경우

---

## 📊 신규 코드 테이블

### DLIV_DIV (입출고 구분)
```
OUTBOUND     = 출고
INBOUND      = 입고 (반품 반입)
```

### DLIV_TYPE (배송 유형)
```
NORMAL       = 정상배송
RETURN       = 반품 (수거/반입)
EXCHANGE     = 교환 (반품)
EXCHANGE_OUT = 교환 (신상품 발송)
```

### SHIPPING_FEE_TYPE (배송료 구분)
```
OUTBOUND     = 출고배송료
RETURN       = 수거배송료
INBOUND      = 반입배송료
EXCHANGE     = 교환발송배송료
```

---

## 💰 비용 계산 예시

### 정상 주문 (결제 시점)
```
pay_price = 상품가 + outbound_shipping_fee
```

### 반품 클레임 (처리 시점)
```
refund_amt = 상품가 + outbound_shipping_fee (원배송료 환불)
           - return_shipping_fee (수거비 차감)
           - inbound_shipping_fee (반입비 차감)

결재 요청: appr_amt = total_shipping_fee
```

### 교환 클레임 (처리 시점)
```
환불가 = 상품가 + outbound_shipping_fee (원배송료 환불)
      - return_shipping_fee (수거비 차감)

신상품가 + exchange_shipping_fee (교환배송료)로 재결제

결재 요청: appr_amt = return_shipping_fee + exchange_shipping_fee
```

---

## 🔄 데이터 일관성 규칙

| 조건 | 규칙 |
|---|---|
| **dliv_div_cd = 'OUTBOUND'** | outbound_courier_cd 필수, inbound_courier_cd 불필요 |
| **dliv_div_cd = 'INBOUND'** | outbound_courier_cd (수거), inbound_courier_cd (반입) 필요 |
| **dliv_type_cd = 'NORMAL'** | claim_id 불필요, parent_dliv_id 불필요 |
| **dliv_type_cd = 'RETURN'** | claim_id 필수, parent_dliv_id 불필요 |
| **dliv_type_cd = 'EXCHANGE'** | claim_id 필수, parent_dliv_id 불필요, inbound_courier_cd 필수 |
| **dliv_type_cd = 'EXCHANGE_OUT'** | claim_id 필수, parent_dliv_id 필수 (반품배송 참조) |
| **shipping_fee_type_cd = 'OUTBOUND'** | dliv_div_cd = 'OUTBOUND', dliv_type_cd = 'NORMAL' |
| **shipping_fee_type_cd = 'RETURN'** | dliv_div_cd = 'INBOUND', dliv_type_cd = 'RETURN' 또는 'EXCHANGE' |
| **shipping_fee_type_cd = 'EXCHANGE'** | dliv_div_cd = 'OUTBOUND', dliv_type_cd = 'EXCHANGE_OUT' |

---

## 📝 수정된 파일 목록

| 파일 | 변경 사항 |
|---|---|
| **od_dliv.sql** | dliv_div_cd, dliv_type_cd, claim_id, 택배사분리, 배송료 추가 |
| **od_order.sql** | 배송정보 스냅샷 (택배사/송장/상태/일시) 추가 |
| **od_order_item.sql** | 부분배송 배송정보 추가 |
| **od_claim.sql** | 반품/교환 배송정보, 배송료, 정산 필드 추가 |
| **od_claim_item.sql** | 항목별 배송료 추가 |
| **sy_code.sql** | DLIV_DIV, DLIV_TYPE, SHIPPING_FEE_TYPE 코드 정의 |

---

## 🚀 다음 단계

1. **미존재 컬럼 검증**: ec_dliv_item의 dliv_type_cd가 이미 있는지 확인
2. **마이그레이션 가이드**: 기존 데이터 → 신규 스키마 변환 쿼리
3. **관련 테이블 검토**:
   - od_dliv_item: 추가 필드 필요 여부
   - od_dliv_status_hist: 배송 상태 변경 이력
4. **API/BO 로직**: 배송 조회, 반품/교환 프로세스 구현
5. **보고서 쿼리**: 배송료별 정산 리포트

---

## ✨ 개선 효과

- ✅ 반품/교환 배송 프로세스 **명확화**
- ✅ 배송료 **투명한 추적** 및 정산
- ✅ 주문/클레임 조회 시 **배송정보 바로 확인**
- ✅ 항목별 **배송 추적 가능**
- ✅ 택배사 **유연한 관리** (수거/반입/발송 분리)

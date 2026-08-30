# pm.06. 프로모션 사은품 정책

## 목적
주문 조건 충족 시 사은품을 자동 발급하고, 재고 관리·취소 처리를 포함한 사은품 운영 정책 정의

## 범위
- 관련 역할: 관리자(사은품 등록·발급 관리), 회원(사은품 수령)
- 관련 시스템: 프로모션 관리, 주문 처리, 클레임 처리

## 주요 정책

### 1. 사은품 등록 및 활성화
- 관리자가 사은품 기본정보(유형·상품·재고·기간) 등록 → `gift_status_cd: INACTIVE`
- 활성화 처리 시 `ACTIVE`로 전환, 주문 조건 충족 시 자동 발급 대상이 됨
- `end_date` 경과 또는 `gift_stock = 0` 시 자동 `INACTIVE` 전환 (재고 소진 종료)

### 2. 사은품 유형 (gift_type_cd)
- **PRODUCT (상품)**: 일반 판매 상품을 사은품으로 지급, `prod_id` FK로 재고 연동
- **SAMPLE (샘플)**: 샘플·증정용 전용 상품, 별도 재고 관리
- **ETC (기타)**: 상품 외 사은품 (손편지, 포장지 등), 재고 수동 관리

### 3. 지급 조건 설정
기본 조건 (pm_gift 마스터):
- `min_order_amt`: 최소 주문금액 이상 시 발급 (0=제한없음)
- `min_order_qty`: 최소 주문수량 이상 시 발급 (NULL=제한없음)
- `mem_grade_cd`: 특정 회원등급에만 발급 (NULL=전체)

상세 조건 (pm_gift_cond):
- 하나의 사은품에 복수 조건 설정 가능 (AND 조건으로 모두 충족 시 발급)
- **ORDER_AMT**: 최소 주문금액(`min_order_amt`) 이상인 경우
- **PRODUCT**: 특정 상품(`target_id` = prod_id)이 주문 포함된 경우
- **MEMBER_GRADE**: 특정 회원등급(`target_id` = 등급코드) 회원 주문인 경우

### 4. 자사/판매자 부담금 분담
사은품 원가의 비용 부담 주체를 설정:
- `self_cdiv_rate`: 자사(사이트) 분담율 (%) — 기본 100%
- `seller_cdiv_rate`: 판매자(업체) 분담율 (%) — 기본 0%
- **규칙**: `self_cdiv_rate + seller_cdiv_rate = 100`%
- 판매자 부담 사은품의 경우 정산 시 해당 비율만큼 판매자 정산액에서 차감

### 5. 자동 발급 흐름
```
주문 생성 → 조건 충족 여부 확인 → gift_stock > 0 확인
  → gift_stock 차감 (원자적 처리)
  → pm_gift_issue 레코드 생성 (gift_issue_status_cd: ISSUED)
  → 주문 완료 후 배송 시 DELIVERED 전환
```

### 6. 재고 소진 처리
- 발급 시 `gift_stock` 원자적 차감 (동시 다수 주문 시 음수 방지)
- `gift_stock = 0` 도달 즉시 해당 사은품 발급 중단
- 재고 소진 시 `gift_status_cd: INACTIVE` 자동 전환, 이후 주문에 미적용

### 7. 취소·환불 시 사은품 처리
- 주문 취소 승인 시 연결된 `pm_gift_issue` 레코드를 `CANCELLED` 처리
- `CANCELLED` 처리 시 `gift_stock` 복원 (+1)
- 부분 취소의 경우, 조건이 여전히 충족되는지 재확인 후 유지 또는 취소

### 8. 기간 종료 처리
- `end_date` < 현재 날짜이면 해당 사은품 `INACTIVE` 전환
- 이미 발급된 `pm_gift_issue` 레코드는 상태 유지 (소급 취소 없음)

## 상태 코드

### GIFT_STATUS (사은품 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| GIFT_STATUS | ACTIVE | 활성 | 조건 충족 시 발급 대상 |
| GIFT_STATUS | INACTIVE | 비활성 | 미발급 (기간 종료 또는 재고 소진 포함) |

### GIFT_TYPE (사은품 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| GIFT_TYPE | PRODUCT | 상품 | 일반 판매 상품, prod_id 연동 |
| GIFT_TYPE | SAMPLE | 샘플 | 샘플·증정 전용 |
| GIFT_TYPE | ETC | 기타 | 비상품 증정물 |

### GIFT_ISSUE_STATUS (발급 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| GIFT_ISSUE_STATUS | ISSUED | 발급됨 | 사은품 발급 완료, 배송 전 |
| GIFT_ISSUE_STATUS | DELIVERED | 배송완료 | 사은품 함께 배송 완료 |
| GIFT_ISSUE_STATUS | CANCELLED | 취소 | 주문 취소로 발급 취소됨 |

### GIFT_COND_TYPE (지급 조건 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| GIFT_COND_TYPE | ORDER_AMT | 주문금액 | min_order_amt 이상 |
| GIFT_COND_TYPE | PRODUCT | 상품포함 | 특정 상품 포함 주문 |
| GIFT_COND_TYPE | MEMBER_GRADE | 회원등급 | 특정 등급 회원 |

## 주요 필드
| 필드 | 설명 |
|------|------|
| gift_id | 사은품ID (YYMMDDhhmmss+rand4) |
| gift_nm | 사은품명 |
| gift_type_cd | 유형 (PRODUCT/SAMPLE/ETC) |
| prod_id | 연결 상품ID |
| gift_stock | 재고 수량 |
| mem_grade_cd | 적용등급 (NULL=전체) |
| min_order_amt | 최소주문금액 조건 |
| min_order_qty | 최소주문수량 조건 (NULL=제한없음) |
| self_cdiv_rate | 자사분담율 (%) 기본 100% |
| seller_cdiv_rate | 판매자분담율 (%) 기본 0% |
| start_date / end_date | 사은품 기간 |

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| pm_gift | 사은품 마스터 (유형·재고·기간 기본정보) |
| pm_gift_cond | 사은품 지급 조건 (주문금액/상품/회원등급) |
| pm_gift_issue | 사은품 발급 이력 (회원·주문별 발급 상태 추적) |

## 제약사항
- `gift_stock` 차감은 원자적 처리 필수 (동시성 보장)
- `gift_stock = 0` 이면 즉시 발급 중단, 초과 발급 불가
- 주문 취소 시 `pm_gift_issue` CANCELLED 처리 및 재고 복원 필수
- `INACTIVE` 사은품은 기간 내라도 신규 발급 불가
- `gift_type_cd = PRODUCT` 인 경우 `prod_id` FK 필수
- `self_cdiv_rate + seller_cdiv_rate = 100`% 유지 (애플리케이션 레이어 검증)

## 변경이력
- 2026-04-18: 자사/판매자 분담율, 회원등급 제한, 최소주문수량 추가
- 2026-04-18: 초기 작성

# pm.05. 프로모션 할인 정책

## 목적
상품·카테고리·회원등급 대상 정률/정액/무료배송 할인정책을 생성·관리하고 주문 시 자동 적용하는 정책 정의

## 범위
- 관련 역할: 관리자(할인정책 등록/관리), 회원(할인 혜택 수령)
- 관련 시스템: 프로모션 관리, 주문 처리, 상품 전시

## 주요 정책

### 1. 할인정책 생성 및 활성화 흐름
- 관리자가 할인 유형·대상·기간·금액 설정 후 저장 → `discnt_status_cd: INACTIVE`
- 활성화 처리 시 `ACTIVE` 전환, 주문 시 자동 적용 대상이 됨
- 종료일(`end_date`) 경과 시 배치 또는 실시간으로 `EXPIRED` 자동 전환
- `EXPIRED` 상태의 할인정책은 신규 주문에 적용 불가

### 2. 할인 유형 (discnt_type_cd)
- **RATE (정률할인)**: 주문금액의 일정 비율(%) 할인
  - `discnt_value`: 할인율 (예: 10 → 10%)
  - `max_discnt_amt`: 정률 할인 상한 금액. 계산액이 상한 초과 시 상한액으로 적용
- **FIXED (정액할인)**: 고정 금액 차감
  - `discnt_value`: 차감 금액 (예: 5000 → 5,000원 할인)
  - `max_discnt_amt`: 미사용 (정액이므로 상한 불필요)
- **FREE_SHIP (무료배송)**: 배송비 전액 면제
  - `discnt_value`: 미사용
  - `min_order_amt` 이상 주문 시에만 적용

### 3. 적용 대상 범위 (discnt_target_cd)
- **ALL**: 전체 주문에 적용 (별도 pm_discnt_item 불필요)
- **CATEGORY**: 특정 카테고리 상품 포함 주문에만 적용
  - `pm_discnt_item.target_type_cd = CATEGORY`, `target_id` = category_id
- **PRODUCT**: 특정 상품 포함 주문에만 적용
  - `pm_discnt_item.target_type_cd = PRODUCT`, `target_id` = prod_id
- **MEMBER_GRADE**: 특정 회원등급 대상 할인
  - `pm_discnt_item.target_type_cd = MEMBER_GRADE`, `target_id` = 등급코드

### 4. 자사/판매자 부담금 분담
할인액의 비용 부담 주체를 설정:
- `self_cdiv_rate`: 자사(사이트) 분담율 (%) — 기본 100%
- `seller_cdiv_rate`: 판매자(업체) 분담율 (%) — 기본 0%
- **규칙**: `self_cdiv_rate + seller_cdiv_rate = 100`%
- 예시: 자사 50% + 판매자 50% → 할인액 5,000원 중 각 2,500원씩 부담
- 정산 시 `seller_cdiv_rate` 비율만큼 판매자 정산액에서 차감

### 5. 채널별 적용 설정
- `dvc_pc_yn`: PC 브라우저 채널 (Y=적용)
- `dvc_mweb_yn`: 모바일 웹 채널 (Y=적용)
- `dvc_mapp_yn`: 모바일 앱 채널 (Y=적용)

### 6. 회원등급 제한
- `mem_grade_cd`: 특정 등급에만 할인 적용 (NULL=전체 등급)
- `discnt_target_cd = MEMBER_GRADE`와 중복 사용 가능

### 7. 최소 주문 조건
- `min_order_amt`: 최소주문금액 — 미만 주문 시 할인 미적용 (0=제한없음)
- `min_order_qty`: 최소주문수량 — NULL이면 수량 제한 없음

### 8. 정률할인 상한 처리 예시
```
할인율: 20%, max_discnt_amt: 10,000원, 주문금액: 100,000원
계산 할인액: 100,000 × 20% = 20,000원
상한 초과 → 실 할인액: 10,000원 (상한 적용)
```

### 9. 중복 할인 정책
- 동일 주문에 복수 할인정책이 적용 가능한 경우, 우선순위 기준 1개만 적용
- 쿠폰과 별도 적용 여부는 쿠폰 정책 참조

### 10. 기간 만료 처리
- `end_date` < 현재 날짜이면 해당 정책은 `EXPIRED` 처리
- `EXPIRED` 정책은 목록에서 필터 가능, 재활성화 불가 (복사 후 신규 생성 권장)

## 상태 코드

### DISCNT_STATUS (할인정책 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| DISCNT_STATUS | ACTIVE | 활성 | 주문 시 자동 적용 |
| DISCNT_STATUS | INACTIVE | 비활성 | 저장됐으나 미적용 |
| DISCNT_STATUS | EXPIRED | 만료 | 기간 종료, 적용 불가 |

### DISCNT_TYPE (할인 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| DISCNT_TYPE | RATE | 정률할인 | 비율(%) 할인, max_discnt_amt 상한 적용 |
| DISCNT_TYPE | FIXED | 정액할인 | 고정 금액 차감 |
| DISCNT_TYPE | FREE_SHIP | 무료배송 | 배송비 전액 면제 |

### DISCNT_TARGET (적용 대상)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| DISCNT_TARGET | ALL | 전체 | 모든 주문에 적용 |
| DISCNT_TARGET | CATEGORY | 카테고리 | 특정 카테고리 상품 포함 시 |
| DISCNT_TARGET | PRODUCT | 상품 | 특정 상품 포함 시 |
| DISCNT_TARGET | MEMBER_GRADE | 회원등급 | 특정 등급 회원에게만 |

## 주요 필드
| 필드 | 설명 |
|------|------|
| discnt_id | 할인ID (YYMMDDhhmmss+rand4) |
| discnt_nm | 할인명 |
| discnt_type_cd | 할인유형 (RATE/FIXED/FREE_SHIP) |
| discnt_target_cd | 적용대상 (ALL/CATEGORY/PRODUCT/MEMBER_GRADE) |
| discnt_value | 할인값 (정률=%, 정액=원) |
| min_order_amt | 최소주문금액 |
| min_order_qty | 최소주문수량 (NULL=제한없음) |
| max_discnt_amt | 최대할인한도 (정률용) |
| start_date / end_date | 할인 기간 |
| mem_grade_cd | 적용등급 (NULL=전체) |
| self_cdiv_rate | 자사분담율 (%) 기본 100% |
| seller_cdiv_rate | 판매자분담율 (%) 기본 0% |
| dvc_pc_yn / dvc_mweb_yn / dvc_mapp_yn | 채널별 적용여부 |

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| `pm_discnt` | 할인정책 마스터 (유형·대상·기간·금액 기본 정보) |
| `pm_discnt_item` | 할인 대상 항목 (카테고리/상품/회원등급 매핑) |
| `pm_discnt_usage` | 할인 적용 이력 (주문 시 실제 적용된 건별 기록, order_id + order_item_id + prod_id) |

## 제약사항
- `EXPIRED` 상태 정책은 재활성화 불가, 복사 후 신규 생성
- `discnt_target_cd = ALL` 인 경우 `pm_discnt_item` 데이터 불필요
- `RATE` 유형은 `max_discnt_amt` 설정 권장 (무제한 할인 방지)
- `start_date > end_date` 인 경우 저장 불가
- `self_cdiv_rate + seller_cdiv_rate = 100`% 유지 (애플리케이션 레이어 검증)
- 동일 기간 동일 대상 중복 할인정책 생성 시 관리자 경고 표시
- 상품에 `discnt_use_yn = N` 설정 시 해당 상품에 할인정책 적용 불가

## 변경이력
- 2026-04-18: 자사/판매자 분담율, 채널별 설정, 회원등급 제한, 최소주문수량 추가
- 2026-04-18: 초기 작성

# pm.01. 프로모션 상태 코드 표

> 프로모션 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
> 상세 정책은 pm.02~pm.09를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. `pm_coupon.coupon_status_cd` — 쿠폰 마스터 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성 | 발급·사용 가능 상태 |
| INACTIVE | 비활성 | 발급 중단. 기발급 쿠폰은 유효기간 내 사용 가능 |
| EXPIRED  | 만료 | 유효기간 종료. 신규 발급·사용 모두 불가 |

### 1-B. `pm_coupon.coupon_type_cd` — 쿠폰 할인 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| RATE  | 정률 | 주문금액 대비 비율(%) 할인 |
| FIXED | 정액 | 고정 금액 차감 |

### 1-C. `pm_coupon.coupon_target_cd` — 쿠폰 발급 대상

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL    | 전체     | 모든 회원 발급 |
| MEMBER | 회원     | 특정 회원 지정 발급 |
| GRADE  | 등급     | 특정 회원등급 자동 발급 |

---

### 1-D. `pm_discnt.discnt_status_cd` — 할인 마스터 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성 | 주문 시 자동 적용 |
| INACTIVE | 비활성 | 저장됐으나 미적용 |
| EXPIRED  | 만료 | 기간 종료, 적용 불가 |

### 1-E. `pm_discnt.discnt_type_cd` — 할인 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| RATE      | 정률할인   | 비율(%) 할인 |
| FIXED     | 정액할인   | 고정 금액 차감 |
| FREE_SHIP | 무료배송   | 배송비 전액 면제 |

### 1-F. `pm_discnt.discnt_target_cd` — 할인 적용 대상

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL          | 전체     | 모든 주문에 적용 |
| CATEGORY     | 카테고리 | 특정 카테고리 상품 포함 시 |
| PRODUCT      | 상품     | 특정 상품 포함 시 |
| MEMBER_GRADE | 회원등급 | 특정 등급 회원에게만 |

---

### 1-G. `pm_gift.gift_status_cd` — 사은품 마스터 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성 | 조건 충족 시 발급 대상 |
| INACTIVE | 비활성 | 미발급 (기간 종료 또는 재고 소진 포함) |

### 1-H. `pm_gift_issue.gift_issue_status_cd` — 사은품 발급 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ISSUED    | 발급됨   | 사은품 발급 완료 |
| DELIVERED | 배송완료 | 사은품 함께 배송 완료 |
| CANCELLED | 취소     | 주문 취소로 발급 취소됨 |

---

### 1-I. `pm_voucher.voucher_status_cd` — 상품권 마스터 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성 | 발급 가능, 신규 코드 생성 허용 |
| INACTIVE | 비활성 | 발급 중단, 기발급 코드는 사용 가능 |
| EXPIRED  | 만료 | 마스터 기간 종료 |

### 1-J. `pm_voucher.voucher_type_cd` — 상품권 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| AMOUNT | 금액권 | 권면금액 고정 차감 |
| RATE   | 정률권 | 비율(%) 할인 |

### 1-K. `pm_voucher_issue.voucher_issue_status_cd` — 상품권 코드 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ISSUED    | 발급됨   | 미사용, 유효기간 내 사용 가능 |
| USED      | 사용완료 | 1회 사용 후 재사용 불가 |
| EXPIRED   | 만료     | 유효기간 초과, 사용 불가 |
| CANCELLED | 취소     | 관리자 수동 취소 |

---

### 1-L. `pm_plan.plan_status_cd` — 기획전 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT  | 초안   | 저장됨, 사용자에게 미노출 |
| ACTIVE | 공개   | 사용자 노출, 탐색 가능 |
| ENDED  | 종료   | 기간 종료 또는 수동 종료 |

### 1-M. `pm_plan.plan_type_cd` — 기획전 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| SEASON | 시즌   | 계절 테마 기획전 |
| BRAND  | 브랜드 | 특정 브랜드 집중 기획전 |
| THEME  | 테마   | 라이프스타일 주제 기획전 |
| COLLAB | 협업   | 콜라보레이션 기획전 |

---

### 1-N. `pm_event.event_status_cd` — 이벤트 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT  | 초안     | 저장됨, 미노출 |
| ACTIVE | 진행중   | 사용자 노출, 참여 가능 |
| PAUSED | 일시정지 | 노출 중단, ACTIVE 재전환 가능 |
| ENDED  | 종료     | end_date 경과 자동 종료 |
| CLOSED | 마감     | 관리자 수동 마감, 읽기 전용 |

### 1-O. `pm_event.event_type_cd` — 이벤트 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PROMOTION | 프로모션   | 일반 할인·특가 이벤트 |
| FLASH     | 플래시세일 | 제한 시간 특가 |
| CAMPAIGN  | 캠페인     | 참여형·공유형 이벤트 |
| COUPON    | 쿠폰이벤트 | 쿠폰 발급 중심 이벤트 |

### 1-P. `pm_event.event_target_type_cd` — 이벤트 참여 대상

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL    | 전체     | 로그인 여부 무관 |
| MEMBER | 회원     | 로그인 회원만 |
| GRADE  | 특정등급 | 지정 회원등급 이상 |
| GUEST  | 비회원   | 비로그인 게스트 전용 |

### 1-Q. `pm_event.event_benefit_type_cd` — 이벤트 혜택 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| COUPON   | 쿠폰   | 쿠폰 자동 발급 |
| POINT    | 적립금 | 적립금 직접 지급 |
| DISCOUNT | 할인   | 할인율·금액 적용 |
| GIFT     | 사은품 | 사은품 발급 |

---

## 2. 상관관계표

### 2-A. 프로모션 유형별 상태 코드 적용 범위

| 프로모션 | 마스터 상태코드 | 개별 발급 상태코드 | 할인유형 |
|:---|:---|:---|:---|
| 쿠폰      | `coupon_status_cd` | - (쿠폰 사용 여부는 `pm_coupon_issue`) | RATE / FIXED |
| 할인      | `discnt_status_cd` | - (주문 시 자동 적용)                  | RATE / FIXED / FREE_SHIP |
| 사은품    | `gift_status_cd`   | `gift_issue_status_cd`                | - (현물 지급) |
| 상품권    | `voucher_status_cd`| `voucher_issue_status_cd`             | AMOUNT / RATE |
| 기획전    | `plan_status_cd`   | -                                     | 상품 묶음 노출 |
| 이벤트    | `event_status_cd`  | -                                     | `event_benefit_type_cd` |

---

### 2-B. 쿠폰·상품권·사은품 — 발급 상태 진행 흐름

| 구분 | 발급 | 사용가능 | 사용완료 | 만료 | 취소 |
|:---|:---:|:---:|:---:|:---:|:---:|
| 쿠폰 (`coupon_issue`)    | ISSUED | ISSUED | USED | EXPIRED | CANCELLED |
| 상품권 (`voucher_issue`) | ISSUED | ISSUED | USED | EXPIRED | CANCELLED |
| 사은품 (`gift_issue`)    | ISSUED | -      | DELIVERED | -  | CANCELLED |

---

## 변경이력

- 2026-04-18: 초기 작성

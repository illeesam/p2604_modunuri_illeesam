<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# pm.01. 프로모션 상태 코드 표

프로모션 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
상세 정책은 pm.02~pm.09를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. 쿠폰 마스터 상태 — `pm_coupon.coupon_status_cd`
쿠폰 발급·사용 가능 여부를 제어하는 마스터 상태. INACTIVE 시에도 기발급 쿠폰은 유효기간 내 사용 가능.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성   | 발급·사용 가능 상태 |
| INACTIVE | 비활성 | 발급 중단. 기발급 쿠폰은 유효기간 내 사용 가능 |
| EXPIRED  | 만료   | 유효기간 종료. 신규 발급·사용 모두 불가 |

---

### 1-B. 쿠폰 할인 유형 — `pm_coupon.coupon_type_cd`
할인 방식을 지정. RATE는 주문금액 비율, FIXED는 고정 금액 차감.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| RATE  | 정률 | 주문금액 대비 비율(%) 할인 |
| FIXED | 정액 | 고정 금액 차감 |

---

### 1-C. 쿠폰 발급 대상 — `pm_coupon.target_type_cd`
쿠폰 발급 범위를 지정. GRADE 선택 시 해당 등급 회원에게 자동 발급.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL    | 전체   | 모든 회원 발급 |
| MEMBER | 회원   | 특정 회원 지정 발급 |
| GRADE  | 등급   | 특정 회원등급 자동 발급 |

---

### 1-D. 할인 마스터 상태 — `pm_discnt.discnt_status_cd`
주문 시 자동 적용되는 할인의 활성 여부. EXPIRED는 기간 종료로 자동 전환.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성   | 주문 시 자동 적용 |
| INACTIVE | 비활성 | 저장됐으나 미적용 |
| EXPIRED  | 만료   | 기간 종료, 적용 불가 |

---

### 1-E. 할인 유형 — `pm_discnt.discnt_type_cd`
할인 적용 방식을 지정. FREE_SHIP은 배송비 전액 면제 전용.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| RATE      | 정률할인 | 비율(%) 할인 |
| FIXED     | 정액할인 | 고정 금액 차감 |
| FREE_SHIP | 무료배송 | 배송비 전액 면제 |

---

### 1-F. 할인 적용 대상 — `pm_discnt.discnt_target_cd`
할인이 발동되는 조건 범위를 지정. MEMBER_GRADE는 특정 등급 이상 회원에게만 적용.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL          | 전체     | 모든 주문에 적용 |
| CATEGORY     | 카테고리 | 특정 카테고리 상품 포함 시 |
| PRODUCT      | 상품     | 특정 상품 포함 시 |
| MEMBER_GRADE | 회원등급 | 특정 등급 회원에게만 |

---

### 1-G. 사은품 마스터 상태 — `pm_gift.gift_status_cd`
사은품 발급 조건 활성 여부. INACTIVE에는 기간 종료·재고 소진 모두 포함.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성   | 조건 충족 시 발급 대상 |
| INACTIVE | 비활성 | 미발급 (기간 종료 또는 재고 소진 포함) |

---

### 1-H. 사은품 발급 상태 — `pm_gift_issue.gift_issue_status_cd`
주문별로 생성되는 사은품 발급 건의 진행 상태. 주문 취소 시 CANCELLED로 전환.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ISSUED    | 발급됨   | 사은품 발급 완료 |
| DELIVERED | 배송완료 | 사은품 함께 배송 완료 |
| CANCELLED | 취소     | 주문 취소로 발급 취소됨 |

---

### 1-I. 상품권 마스터 상태 — `pm_voucher.voucher_status_cd`
상품권 코드 신규 생성·발급 가능 여부. INACTIVE 시에도 기발급 코드는 사용 가능.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ACTIVE   | 활성   | 발급 가능, 신규 코드 생성 허용 |
| INACTIVE | 비활성 | 발급 중단, 기발급 코드는 사용 가능 |
| EXPIRED  | 만료   | 마스터 기간 종료 |

---

### 1-J. 상품권 유형 — `pm_voucher.voucher_type_cd`
할인 방식을 지정. AMOUNT는 권면금액 고정 차감, RATE는 비율 할인.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| AMOUNT | 금액권 | 권면금액 고정 차감 |
| RATE   | 정률권 | 비율(%) 할인 |

---

### 1-K. 상품권 코드 상태 — `pm_voucher_issue.voucher_issue_status_cd`
개별 상품권 코드의 사용 가능 여부. USED 이후 재사용 불가. 관리자 수동 취소 가능.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ISSUED    | 발급됨   | 미사용, 유효기간 내 사용 가능 |
| USED      | 사용완료 | 1회 사용 후 재사용 불가 |
| EXPIRED   | 만료     | 유효기간 초과, 사용 불가 |
| CANCELLED | 취소     | 관리자 수동 취소 |

---

### 1-L. 기획전 상태 — `pm_plan.plan_status_cd`
기획전의 사용자 노출 여부. ENDED 이후 재개 불가.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT  | 초안 | 저장됨, 사용자에게 미노출 |
| ACTIVE | 공개 | 사용자 노출, 탐색 가능 |
| ENDED  | 종료 | 기간 종료 또는 수동 종료 |

---

### 1-M. 기획전 유형 — `pm_plan.plan_type_cd`
기획전의 성격·테마를 분류. 운영팀 기획 의도에 따라 선택.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| SEASON | 시즌   | 계절 테마 기획전 |
| BRAND  | 브랜드 | 특정 브랜드 집중 기획전 |
| THEME  | 테마   | 라이프스타일 주제 기획전 |
| COLLAB | 협업   | 콜라보레이션 기획전 |

---

### 1-N. 이벤트 상태 — `pm_event.event_status_cd`
이벤트의 사용자 노출·참여 가능 여부. PAUSED는 일시 중단이며 ACTIVE 재전환 가능.
ENDED는 자동 종료(end_date 경과), CLOSED는 관리자 수동 마감으로 읽기 전용 처리.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT  | 초안     | 저장됨, 미노출 |
| ACTIVE | 진행중   | 사용자 노출, 참여 가능 |
| PAUSED | 일시정지 | 노출 중단, ACTIVE 재전환 가능 |
| ENDED  | 종료     | end_date 경과 자동 종료 |
| CLOSED | 마감     | 관리자 수동 마감, 읽기 전용 |

---

### 1-O. 이벤트 유형 — `pm_event.event_type_cd`
이벤트의 성격을 분류. 유형에 따라 UI 템플릿과 혜택 지급 방식이 달라진다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PROMOTION | 프로모션   | 일반 할인·특가 이벤트 |
| FLASH     | 플래시세일 | 제한 시간 특가 |
| CAMPAIGN  | 캠페인     | 참여형·공유형 이벤트 |
| COUPON    | 쿠폰이벤트 | 쿠폰 발급 중심 이벤트 |

---

### 1-P. 이벤트 참여 대상 — `pm_event.target_type_cd`
이벤트에 참여할 수 있는 회원 조건. GUEST는 비로그인 게스트 전용.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ALL    | 전체     | 로그인 여부 무관 |
| MEMBER | 회원     | 로그인 회원만 |
| GRADE  | 특정등급 | 지정 회원등급 이상 |
| GUEST  | 비회원   | 비로그인 게스트 전용 |

---

### 1-Q. 이벤트 혜택 유형 — `pm_event_benefit.benefit_type_cd`
이벤트 참여 시 지급되는 혜택의 종류를 지정.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| COUPON   | 쿠폰   | 쿠폰 자동 발급 |
| POINT    | 적립금 | 적립금 직접 지급 |
| DISCOUNT | 할인   | 할인율·금액 적용 |
| GIFT     | 사은품 | 사은품 발급 |

---

## 2. 상관관계표

### 2-A. 프로모션 유형별 상태 코드 구조 — 프로모션 종류(기준) × 상태·유형 코드
각 프로모션 유형이 사용하는 마스터 상태코드와 개별 발급 상태코드를 정리.
쿠폰·상품권은 개별 발급 코드가 별도 존재하며, 할인·기획전은 마스터 상태만 있음.

| 프로모션 | 마스터 상태코드 | 개별 발급 상태코드 | 할인유형 |
|:---|:---|:---|:---|
| 쿠폰   | `coupon_status_cd`  | `pm_coupon_issue` (ISSUED/USED/EXPIRED/CANCELLED) | RATE / FIXED |
| 할인   | `discnt_status_cd`  | - (주문 시 자동 적용)                              | RATE / FIXED / FREE_SHIP |
| 사은품 | `gift_status_cd`    | `gift_issue_status_cd` (ISSUED/DELIVERED/CANCELLED)| - (현물 지급) |
| 상품권 | `voucher_status_cd` | `voucher_issue_status_cd` (ISSUED/USED/EXPIRED/CANCELLED) | AMOUNT / RATE |
| 기획전 | `plan_status_cd`    | -                                                  | 상품 묶음 노출 |
| 이벤트 | `event_status_cd`   | -                                                  | `benefit_type_cd` |

---

### 2-B. 발급 상태 흐름 — 쿠폰·상품권·사은품 `*_issue_status_cd`(기준) × 단계
발급 이후 상태 진행 흐름 비교. 쿠폰·상품권은 USED/EXPIRED, 사은품은 DELIVERED로 종료.

| 구분 | 발급 | 사용가능 | 사용완료 | 만료 | 취소 |
|:---|:---:|:---:|:---:|:---:|:---:|
| 쿠폰 (`coupon_issue`)    | ISSUED | ISSUED    | USED      | EXPIRED | CANCELLED |
| 상품권 (`voucher_issue`) | ISSUED | ISSUED    | USED      | EXPIRED | CANCELLED |
| 사은품 (`gift_issue`)    | ISSUED | -         | DELIVERED | -       | CANCELLED |

---

## 변경이력

- 2026-04-18: 초기 작성
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 추가

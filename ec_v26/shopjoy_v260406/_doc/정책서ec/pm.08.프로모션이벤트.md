# 518. 프로모션 이벤트 정책

## 목적
프로모션·플래시세일·캠페인·쿠폰 이벤트를 생성하고, 예고 기간·노출 대상·혜택 연계를 포함한 이벤트 운영 정책 정의

## 범위
- 관련 역할: 관리자(이벤트 등록·혜택 설정·상태 관리), 회원/비회원(이벤트 참여 및 혜택 수령)
- 관련 시스템: 프로모션 관리, 쿠폰, 캐쉬, 할인, 사은품, 사용자 페이스 전시

## 주요 정책

### 1. 이벤트 상태 흐름
```
DRAFT(초안) → ACTIVE(공개 진행) → PAUSED(일시정지) → ENDED(자동 종료) / CLOSED(수동 마감)
```
- `DRAFT`: 저장됨, 사용자 미노출. 상품·혜택 사전 설정 가능
- `ACTIVE`: 사용자에게 노출, 참여 및 혜택 수령 가능
- `PAUSED`: 일시 중단. 관리자 수동 전환. 노출 중단, ACTIVE 재전환 가능
- `ENDED`: `end_date` 경과 시 자동 전환. 참여 불가, 기발급 혜택 유효
- `CLOSED`: 관리자 수동 마감. ENDED와 동일하게 읽기 전용

### 2. 이벤트 유형 (event_type_cd)
- **PROMOTION**: 일반 할인·특가 프로모션 이벤트
- **FLASH**: 제한 시간 내 특가 (플래시세일). `start_date`~`end_date` 짧은 구간 운영
- **CAMPAIGN**: 공유·리뷰·참여형 캠페인 이벤트
- **COUPON**: 쿠폰 발급 중심 이벤트 (참여 시 쿠폰 자동 발급)

### 3. 예고 기간 (notice 기간)
- `notice_start` ~ `notice_end`: 이벤트 본 시작 전 예고 노출 기간
- 예고 기간 중에는 이벤트 상세 페이지 접근 가능하나 혜택 수령 불가
- 예고 기간이 없으면 NULL로 설정 (선택 항목)
- 예고 기간과 본 이벤트 기간 (`start_date`~`end_date`) 은 독립적으로 관리

### 4. 노출 대상 (target_type_cd)
- **ALL**: 전체 사용자 (로그인 여부 무관)
- **MEMBER**: 로그인 회원만 노출 및 참여 가능
- **GRADE**: 특정 회원등급 이상만 참여 가능 (등급 조건은 이벤트 상세로 별도 관리)
- **GUEST**: 비로그인(게스트) 사용자 대상 이벤트

### 5. 이벤트 혜택 (pm_event_benefit)
- 하나의 이벤트에 복수 혜택 설정 가능
- **COUPON**: 참여 시 지정 쿠폰(`coupon_id` FK) 자동 발급
- **POINT**: 포인트(적립금) 직접 지급, `benefit_value` = 지급 포인트
- **DISCOUNT**: 특정 할인율/금액 적용, `benefit_value` = 할인율 또는 금액
- **GIFT**: 사은품 발급, `benefit_value` = gift_id 참조
- `condition_desc`: 혜택 수령 조건 설명 (예: "3만원 이상 구매 시", "최초 1회")

### 6. 조회수 집계 (view_cnt)
- 이벤트 상세 페이지 접근 시 `view_cnt` 증가
- 동일 세션 중복 집계 방지 (세션 기준 1회 카운트)
- 예고 기간 조회도 집계에 포함

### 7. 이벤트 본문 (event_content)
- `event_content TEXT`: HTML 또는 마크다운 형식 이벤트 상세 내용
- 이미지 삽입, 텍스트 서식, 링크 포함 가능
- Quill 에디터로 관리자 입력

## 상태 코드

### EVENT_STATUS (이벤트 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| EVENT_STATUS | DRAFT | 초안 | 저장됨, 미노출 |
| EVENT_STATUS | ACTIVE | 진행중 | 사용자 노출, 참여 가능 |
| EVENT_STATUS | PAUSED | 일시정지 | 노출 중단, ACTIVE 재전환 가능 |
| EVENT_STATUS | ENDED | 종료 | end_date 경과 자동 종료 |
| EVENT_STATUS | CLOSED | 마감 | 관리자 수동 마감, 읽기 전용 |

### EVENT_TYPE (이벤트 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| EVENT_TYPE | PROMOTION | 프로모션 | 일반 할인·특가 이벤트 |
| EVENT_TYPE | FLASH | 플래시세일 | 제한 시간 특가 |
| EVENT_TYPE | CAMPAIGN | 캠페인 | 참여형·공유형 이벤트 |
| EVENT_TYPE | COUPON | 쿠폰이벤트 | 쿠폰 발급 중심 이벤트 |

### EVENT_TARGET_TYPE (노출 대상)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| EVENT_TARGET_TYPE | ALL | 전체 | 로그인 여부 무관 전체 노출 |
| EVENT_TARGET_TYPE | MEMBER | 회원 | 로그인 회원만 |
| EVENT_TARGET_TYPE | GRADE | 특정등급 | 지정 회원등급 이상 |
| EVENT_TARGET_TYPE | GUEST | 비회원 | 비로그인 게스트 전용 |

### EVENT_BENEFIT_TYPE (혜택 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| EVENT_BENEFIT_TYPE | COUPON | 쿠폰 | 쿠폰 자동 발급 (coupon_id 연계) |
| EVENT_BENEFIT_TYPE | POINT | 포인트 | 적립금 직접 지급 |
| EVENT_BENEFIT_TYPE | DISCOUNT | 할인 | 할인율·금액 적용 |
| EVENT_BENEFIT_TYPE | GIFT | 사은품 | 사은품 발급 |

## 이벤트 적용 대상 항목 (pm_event_item)
- `target_type_cd`: PRODUCT / CATEGORY / VENDOR / BRAND
- `sort_no`: 이벤트 내 노출 순서 (정렬 가능)
- 항목이 등록되지 않으면 전체 상품 대상 (pm_event.target_type_cd 기준)
- 플래시세일·기획 이벤트에서 특정 상품/카테고리/판매자/브랜드를 지정할 때 사용

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| `pm_event` | 이벤트 마스터 (유형·제목·본문·기간·노출대상·상태·조회수) |
| `pm_event_item` | 이벤트 적용 대상 (상품/카테고리/판매자/브랜드, sort_no 순서) |
| `pm_event_benefit` | 이벤트 혜택 (쿠폰/포인트/할인/사은품 연계) |

## 제약사항
- `ENDED` / `CLOSED` 상태에서 `ACTIVE`·`PAUSED`·`DRAFT` 역전환 불가
- `notice_start` < `notice_end` < `start_date` < `end_date` 순서 준수
- `benefit_type_cd = COUPON` 인 경우 `coupon_id` FK 필수
- `target_type_cd = GRADE` 인 경우 대상 등급 조건을 `condition_desc`에 명시 권장
- `PAUSED` 상태에서는 혜택 신규 수령 불가, 기발급 혜택은 유효 유지

## 변경이력
- 2026-04-18: 초기 작성

# 915. 공통코드 관리 정책

> **공통코드 단일 소스**: 이 문서가 시스템 공통코드의 유일한 정의 출처입니다. sy.52(DDL 단어사전규칙)의 코드 목록은 이 문서를 참조하세요.

## 목적
시스템 전체의 공통코드 표준화 및 관리 정책 정의

## 범위
- 코드 생성 및 관리
- 코드 사용 규칙
- 코드 변경 및 폐기
- 코드 버전 관리

## 코드 구조
```
코드그룹 (CodeGroup)
└─ 코드항목 (Code)
   └─ 코드값 (CodeValue)
   └─ 코드설명 (CodeDesc)
```

## 주요 정책

### 1. 코드그룹 정의
- **필수항목**:
  - 그룹코드 (20자, UNIQUE)
  - 그룹명 (50자)
  - 설명 (200자)
- **그룹유형**: 
  - SYSTEM: 시스템 기본코드 (변경 불가)
  - BUSINESS: 업무 코드 (변경 가능)
  - CUSTOM: 커스텀 코드 (사용자정의)

### 2. 코드항목 정의
- **필수항목**:
  - 코드값 (30자, UNIQUE within 그룹)
  - 코드명 (50자)
  - 정렬순서 (0~999)
- **선택항목**:
  - 설명 (200자)
  - 활성화 여부

### 3. 코드 명명 규칙
- **포맷**: 대문자 + 언더스코어
  - 예: PAY_STATUS, MEMBER_GRADE
- **길이**: 최대 30자
- **변수명**: 코드사용시 변수명도 동일
  - 예: pay_status_cd

### 4. 코드 사용 범위
- **필드명**: *_cd 접미사 사용
  - 예: member_status_cd, order_status_cd
- **DB컬럼**: VARCHAR(20~30)
- **검색**: IN 연산자로 다중값 검색

### 5. 코드 변경 정책
- **SYSTEM코드**: 
  - 신규 추가 불가 (개발팀 요청)
  - 기존 수정 불가능
  - 폐기 시 논리삭제만
- **BUSINESS코드**: 
  - 추가/수정 가능
  - 사용중 코드는 폐기만 가능
  - 폐기 후 1개월 후 삭제 가능
- **CUSTOM코드**: 
  - 자유롭게 추가/수정/삭제 가능

### 6. 코드 버전관리
- **활성**: 현재 사용중 (use_yn = Y)
- **비활성**: 더이상 신규 사용 불가 (use_yn = N)
- **폐지**: 과거 데이터만 조회 (is_deprecated = Y)

### 7. 코드 이력관리
- **생성**: 생성자, 생성일 기록
- **변경**: 변경자, 변경일 기록
- **폐지**: 폐지일 기록
- **사용내역**: 사용중인 레코드 수 통계

### 8. 공통코드 목록

#### 결제 및 주문
| 코드그룹 | 코드값 | 설명 |
|---------|--------|------|
| PAY_METHOD | BANK_TRANSFER, VBANK, TOSS, KAKAO, NAVER, MOBILE | 결제수단 |
| PAY_STATUS | PENDING, COMPLT, FAILED, CANCELLED, REFUNDED | 결제상태 |
| ORDER_STATUS | PENDING, PAID, PREPARING, SHIPPED, COMPLT, CANCELLED, RETURNED | 주문상태 |
| ORDER_ITEM_STATUS | NORMAL, PARTIAL_CANCELLED, PARTIALLY_SHIPPED, SHIPPED, COMPLT, CANCELLED, RETURNED | 주문항목상태 |

#### 배송 및 클레임
| 코드그룹 | 코드값 | 설명 |
|---------|--------|------|
| DLIV_STATUS | READY, PICKED, IN_TRANSIT, DELIVERED | 배송상태 |
| CLAIM_STATUS | REQUESTED, APPROVED, IN_PICKUP, COMPLT, CANCELLED | 클레임상태 |
| CLAIM_ITEM_STATUS | REQUESTED, APPROVED, PARTIAL_APPROVED, IN_RETURN, RETURNED, IN_REFUND, REFUNDED, EXCHANGE_IN_RETURN, EXCHANGE_IN_DELIVERY, EXCHANGE_COMPLT, CANCELLED | 클레임항목상태 |

#### 회원 및 상품
| 코드그룹 | 코드값 | 설명 |
|---------|--------|------|
| MEMBER_STATUS | ACTIVE, DORMANT, SUSPENDED, WITHDRAWN | 회원상태 |
| MEMBER_GRADE | BASIC, SILVER, GOLD, VIP | 회원등급 |
| PRODUCT_STATUS | ACTIVE, DRAFT, STOPPED, DISCONTINUED | 상품상태 |

#### 프로모션, 환불 및 배송
| 코드그룹 | 코드값 | 설명 |
|---------|--------|------|
| COUPON_STATUS | ACTIVE, INACTIVE, EXPIRED | 쿠폰상태 |
| EVENT_STATUS | DRAFT, ACTIVE, PAUSED, ENDED, CLOSED | 이벤트상태 |
| REFUND_METHOD_CD | CARD, ACCOUNT, MOBILE | 환불수단 |
| COURIER | CJ, LOGEN, POST, HANJIN, LOTTE | 택배사 |

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| code_grp | 코드그룹 | 20자, UNIQUE |
| code_cd | 코드값 | 30자, UNIQUE within 그룹 |
| code_nm | 코드명 | 50자 |
| code_remark | 설명 | 200자 |
| sort_ord | 정렬순서 | INTEGER |
| use_yn | 사용여부 | Y/N |
| is_deprecated | 폐지여부 | 논리삭제 |

## 관련 테이블
- sy_code: 공통코드

## 제약사항
- SYSTEM코드는 수정 불가능
- 사용중 코드는 즉시 폐기 불가
- 코드변경은 사전 영향도 분석 필수

## 변경이력
- 2026-04-16: 초기 작성

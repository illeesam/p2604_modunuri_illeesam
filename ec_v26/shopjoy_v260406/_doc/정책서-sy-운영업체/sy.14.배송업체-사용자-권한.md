# sy.14. 배송업체 · 사용자 · 권한 정책

## 목적
플랫폼과 계약하여 배송·물류를 담당하는 배송업체(택배사·물류사),
소속 담당자·실무자 계정, 역할 기반 접근 제어(RBAC) 정책을 통합 정의.

## 관련 테이블
| 테이블명 | 설명 |
|---------|------|
| sy_vendor | 업체 공통 마스터 (vendor_class_cd = DLIV 계열) |
| sy_vendor_content | 업체 소개 내용 |
| sy_vendor_user | 배송업체 담당자/실무자 |
| sy_role | 역할 마스터 |
| sy_role_menu | 역할-메뉴 권한 매핑 |
| od_dliv | 배송 마스터 (courier_cd 기준 연결) |
| st_settle | 배송업체별 월 정산 집계 |

---

## 1. 배송업체 (sy_vendor)

### 상태 코드

#### VENDOR_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PENDING | 대기 | 등록 후 승인 대기 |
| APPROVED | 승인 | 승인 완료, 배송 업무 수행 가능 |
| SUSPENDED | 정지 | 계약 이슈·서비스 불량으로 일시 정지 |
| CLOSED | 종료 | 계약 종료, 신규 배송 배정 중단 |

#### VENDOR_CLASS (업체 구분)
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| DLIV_COURIER | 택배사 | 일반 택배 배송 |
| DLIV_FREIGHT | 화물사 | 대형 화물 배송 |
| DLIV_PICKUP | 픽업서비스 | 당일 픽업/배송 |
| DLIV_RETURN | 반품수거전문 | 반품·교환 수거 전문 |

### 주요 정책

#### 1-1. 등록
- **필수항목**: 사업자등록번호(`vendor_no`, UNIQUE), 상호(`vendor_nm`), 대표자명(`ceo_nm`), 대표 이메일, 대표 전화
- **필수서류**: 사업자등록증, 통장 사본, 운송사업자등록증 → `vendor_reg_url`
- **계약항목**: 배송 단가표, 권역별 배송비, 추가배송비(도서산간 등), 반품수거 단가
- **초기 상태**: 등록 직후 `ACTIVE` (계약 승인 기준)

#### 1-2. od_dliv 연결
- 배송 건(`od_dliv`) 생성 시 `courier_cd` 필드로 배송업체 구분
- 하나의 배송업체가 OUTBOUND·INBOUND·RETURN 등 다양한 배송 유형 수행 가능

#### 1-3. 정산 연계 (배송비)
- `st_settle_raw.vendor_type_cd = DLIV`로 수집
- 월별 처리 완료 배송 건 기준 배송비 집계

#### 1-4. 상태별 처리
- **APPROVED**: 신규 배송 배정 가능, 정산 대상 포함
- **SUSPENDED**: 신규 배정 중단, 진행 중 배송은 완료까지 처리, 정산 보류
- **CLOSED**: 전면 중단, 미정산 배송비 최종 정산 후 계정 비활성화

#### 1-5. 정산계좌 관리
- 변경: 월 1회 신청 후 관리자 확인
- 검증: 소액 송금 검증 또는 계좌주 동의 확인 필수
- `vendor_bank_account` 암호화 저장

#### 1-6. 계약 해지
```
배송업체 요청 or 서비스 불량 기준 초과 or 폐업
  → 진행 중 배송 완료 확인
  → 미정산 배송비 최종 정산
  → vendor_status_cd = CLOSED
  → 신규 배송 배정 차단
```

### 주요 필드 (sy_vendor)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_id | 배송업체ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_no | 사업자등록번호 | UNIQUE, NOT NULL |
| vendor_nm | 상호/회사명 | 100자, NOT NULL |
| ceo_nm | 대표자명 | 필수 |
| vendor_class_cd | 업체구분 | DLIV_COURIER / DLIV_FREIGHT / DLIV_PICKUP / DLIV_RETURN |
| vendor_bank_nm | 은행명 | 정산계좌 |
| vendor_bank_account | 계좌번호 | 암호화 저장 |
| vendor_bank_holder | 예금주 | |
| vendor_reg_url | 등록증 첨부 URL | |
| open_date | 개업일자 | DATE |
| contract_date | 계약일자 | DATE |
| vendor_status_cd | 상태 | VENDOR_STATUS |
| vendor_remark | 비고 | 500자 |

---

## 2. 배송업체사용자 (sy_vendor_user)

### 상태 코드

#### VENDOR_MEMBER_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| ACTIVE | 재직중 | 정상 활동 |
| LEFT | 퇴직 | 퇴직/탈퇴 처리 완료 |
| SUSPENDED | 정지 | 계정 일시 정지 |

#### POSITION (직위/직책)
| 코드값 | 라벨 |
|--------|------|
| CEO | 대표 |
| DIRECTOR | 이사 |
| MANAGER | 팀장/과장 |
| STAFF | 사원/담당 |
| ETC | 기타 |

### 주요 정책

#### 2-1. 등록
- **필수항목**: 이름(`member_nm`), 휴대전화(`vendor_user_mobile`), 이메일(`vendor_user_email`)
- **로그인 연결** (`user_id`): 연결 시 sy_user 1:1 매핑 → 배송업체 포털 접근 / NULL 시 비로그인 현장 담당자
- **UNIQUE 제약**: `(vendor_id, user_id)` — 동일 업체에 동일 user_id 중복 불가

#### 2-2. 대표 담당자 (`is_main`)
- 업체당 1명 권장 (시스템 강제 아님)
- `is_main = Y`: 배송 계약·정산 관련 공식 연락 대상

#### 2-3. 역할·권한
- `role_id`: **DLIV_ 접두어 역할**만 할당 (SALE_/CS_/SITE_ 할당 불가)
- `auth_yn = Y`: sy_vendor 기본정보 수정 가능, 관리자가 부여·회수

#### 2-4. 재직 기간 관리
- `join_date`: 합류 일자 / `leave_date`: 퇴직 일자
- 퇴직 흐름: `leave_date 기록 → LEFT → user_id 연결 해제(선택)`

#### 2-5. 상태 전환 규칙
```
ACTIVE → SUSPENDED  (관리자 일시 정지)
ACTIVE → LEFT       (퇴직 처리)
SUSPENDED → ACTIVE  (정지 해제)
```
- `LEFT` 전환 후 재활성화 불가 (재등록 처리)

#### 2-6. 다중 업체 소속
- 한 `sy_user`가 여러 배송업체의 `sy_vendor_user`에 연결 가능
- 역할은 업체별로 별도 지정

### 주요 필드 (sy_vendor_user)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_user_id | 배송업체사용자ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_id | 배송업체ID | FK sy_vendor (DLIV 계열), NOT NULL |
| user_id | 사용자ID | FK sy_user, NULL = 비로그인 |
| role_id | 역할ID | FK sy_role (DLIV_ 역할 트리) |
| member_nm | 이름 | 50자, NOT NULL |
| position_cd | 직위/직책 | POSITION 코드 |
| vendor_user_dept_nm | 부서/팀명 | 100자 |
| vendor_user_phone | 사무실 전화 | |
| vendor_user_mobile | 휴대전화 | NOT NULL |
| vendor_user_email | 이메일 | NOT NULL |
| is_main | 대표 담당자 여부 | Y/N, 업체당 1명 권장 |
| auth_yn | 업체 관리권한 여부 | Y=배송업체 정보 수정 가능 |
| join_date | 합류 일자 | DATE |
| leave_date | 퇴직/탈퇴 일자 | DATE |
| vendor_user_status_cd | 상태 | VENDOR_MEMBER_STATUS |
| vendor_user_remark | 비고 | 500자 |

---

## 3. 권한 (DLIV_ 역할 트리)

### 역할 구조
| 역할 코드 | 역할명 | 접근 범위 |
|----------|--------|----------|
| DLIV_ADMIN | 배송업체 관리자 | 배송·운송장·픽업 전체 조회+수정, 업체정보 수정(`auth_yn=Y` 필요) |
| DLIV_TRACKING | 배송업체 운송담당 | 배송 상태 변경, 운송장 등록·수정 |
| DLIV_PICKUP | 배송업체 픽업담당 | 픽업·수거 배송 조회+상태 변경 |
| DLIV_SETTLE | 배송업체 정산담당 | 배송비 정산 조회 전용 |
| DLIV_READ | 배송업체 조회전용 | 자사 배송 데이터 전체 조회만 가능 |

### 기능별 접근 제어

| 기능 | DLIV_ADMIN | DLIV_TRACKING | DLIV_PICKUP | DLIV_SETTLE | DLIV_READ |
|------|:---:|:---:|:---:|:---:|:---:|
| 배송 현황 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 배송 상태 변경 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 운송장 등록·수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 픽업·수거 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 픽업 상태 변경 | ✅ | ❌ | ✅ | ❌ | ❌ |
| 배송비 정산 조회 | ✅ | ❌ | ❌ | ✅ | ✅ |
| 업체정보 수정 | `auth_yn=Y` | ❌ | ❌ | ❌ | ❌ |
| 담당자 관리 | ✅ | ❌ | ❌ | ❌ | ❌ |

### 주요 정책

#### 3-1. 배송업체 데이터 격리 원칙
- 자신의 `vendor_id`에 배정된 배송 데이터만 조회·수정 (`courier_cd` 또는 `vendor_id` 필터링)
- API·쿼리 레이어 양쪽 적용
- 플랫폼 전체 데이터는 일반 관리자(`sy_user + sy_role`)만 접근

#### 3-2. 역할 할당 규칙
- DLIV_ 접두어 역할만 할당 가능
- 일반 관리자(ADMIN/OPERATOR 등) 및 SALE_/CS_/SITE_* 역할 할당 불가
- 역할 없이 등록 가능 (비로그인 현장 담당자, 시스템 접근 불가)

#### 3-3. `auth_yn` vs `role_id`
| 구분 | 제어 대상 | 관리 주체 |
|------|----------|----------|
| `role_id` (역할) | 메뉴 접근, 기능 실행 권한 | 시스템 관리자가 역할-메뉴 매핑 설정 |
| `auth_yn = Y` | 배송업체 기본정보(sy_vendor) 수정 가능 여부 | 관리자 개별 부여 |

#### 3-4. 권한 부여 절차
```
1. 관리자(ADMIN)가 sy_vendor_user 등록 또는 수정
2. role_id 지정 (DLIV_ 역할 트리에서 선택)
3. 필요 시 auth_yn = Y 부여
4. user_id 연결 (로그인 활성화)
```

#### 3-5. 권한 회수 및 변경
- **역할 변경**: `role_id` 수정 → 즉시 반영 (캐시 초기화)
- **권한 회수**: `role_id = NULL` → 메뉴 접근 차단
- **로그인 차단**: `vendor_user_status_cd = SUSPENDED` 또는 `user_id` 연결 해제

#### 3-6. 감사 및 로그
- 주요 작업(배송 상태 변경, 운송장 수정)은 변경 이력 테이블에 기록
- 권한 변경(`role_id`, `auth_yn` 수정)은 `sy_vendor_user` 변경 이력으로 추적

---

## 관련 관리자 화면
| pageId | 라벨 |
|--------|------|
| `syBizMng` | 시스템 > 업체 |
| `syBizUserMng` | 시스템 > 업체사용자 |
| `syRoleMng` | 시스템 > 역할관리 |
| `syMenuMng` | 시스템 > 메뉴관리 |
| `odDlivMng` | 주문관리 > 배송관리 |
| `stConfigMng` | 정산 > 정산기준관리 |

## 제약사항
- `vendor_no` UNIQUE — 중복 등록 불가
- `CLOSED` 전환 전 진행 중 배송 완료 및 미정산 배송비 처리 확인 필수
- `SUSPENDED` 중에도 이미 배정된 진행 중 배송은 계속 처리
- `vendor_id` 데이터 격리는 API·쿼리 레이어 양쪽 강제
- `auth_yn = Y` 부여는 플랫폼 관리자만 가능
- 동일 업체에 동일 `user_id` 중복 불가
- `LEFT` 전환 후 재활성화 불가 (재등록 원칙)
- DLIV_ 외 역할(SALE_*/CS_*/SITE_*) 할당 불가

## 변경이력
- 2026-04-18: sy.41(업체)+sy.42(사용자)+sy.43(권한) 3개 파일 통합

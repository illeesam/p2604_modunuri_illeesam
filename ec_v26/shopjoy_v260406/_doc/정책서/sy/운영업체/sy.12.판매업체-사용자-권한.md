# sy.12. 판매업체 · 사용자 · 권한 정책

## 목적
멀티벤더 플랫폼에서 상품을 판매하는 판매업체,
소속 담당자·실무자 계정, 역할 기반 접근 제어(RBAC) 정책을 통합 정의.

## 관련 테이블
| 테이블명 | 설명 |
|---------|------|
| sy_vendor | 업체 공통 마스터 (vendor_class_cd = SALE 계열) |
| sy_vendor_content | 업체 소개 내용 |
| sy_vendor_brand | 업체-브랜드 연결 |
| sy_vendor_user | 판매업체 담당자/실무자 |
| sy_role | 역할 마스터 |
| sy_role_menu | 역할-메뉴 권한 매핑 |
| st_settle | 판매업체별 월 정산 집계 |

---

## 1. 판매업체 (sy_vendor)

### 상태 코드

#### VENDOR_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PENDING | 대기 | 등록 후 승인 대기 |
| APPROVED | 승인 | 승인 완료, 상품 판매 가능 |
| SUSPENDED | 정지 | 정책 위반·계약 이슈로 일시 정지 |
| CLOSED | 종료 | 계약 종료, 상품 판매 중지 |

#### VENDOR_CLASS (업체 구분)
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| SALE_CORP | 법인 판매업체 | 사업자등록 법인 |
| SALE_INDIV | 개인 판매업체 | 개인사업자 |
| SALE_TAX_FREE | 면세 판매업체 | 면세사업자 |
| SALE_SIMPLE | 간이과세 판매업체 | 간이과세사업자 |

### 주요 정책

#### 1-1. 등록
- **필수항목**: 사업자등록번호(`vendor_no`, UNIQUE), 상호(`vendor_nm`), 대표자명(`ceo_nm`), 대표 이메일, 대표 전화
- **필수서류**: 사업자등록증, 통장 사본, 대표자 신분증, 계약서 → `vendor_reg_url`
- **심사기간**: 3~5 영업일
- **초기 상태**: 등록 직후 `ACTIVE` (심사 통과 기준)

#### 1-2. 수수료 정책
- **기본 수수료율**: 5% (카테고리·업체별 차등 적용 가능)
- **수수료 변경**: 분기별 1회 신청 → `st_settle_config` 기준 업데이트
- **정산 기준**: `st_settle_raw.settle_target_amt × 수수료율` → `st_settle` 집계

#### 1-3. 상태별 처리
- **APPROVED**: 상품 등록·판매 가능, 정산 대상 포함
- **SUSPENDED**: 상품 판매 중단, 기존 주문·배송은 계속 처리, 정산 보류
- **CLOSED**: 상품 판매 전면 중단, 미정산액 최종 정산 후 계정 비활성화

#### 1-4. 정산계좌 관리
- 변경: 월 1회 신청 후 관리자 확인
- 검증: 소액 송금 검증 또는 계좌주 동의 확인 필수
- `vendor_bank_account` 암호화 저장

#### 1-5. 브랜드 연결
- 판매업체는 1개 이상의 브랜드와 연결 가능 (`sy_vendor_brand`)

#### 1-6. 계약 해지
```
판매업체 요청 or 계약 위반 or 폐업
  → 미정산액 최종 정산 완료 확인
  → vendor_status_cd = CLOSED
  → 상품 판매 중단 + 계정 비활성화
```

### 주요 필드 (sy_vendor)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_id | 판매업체ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_no | 사업자등록번호 | UNIQUE, NOT NULL |
| corp_no | 법인등록번호 | 선택 |
| vendor_nm | 상호/회사명 | 100자, NOT NULL |
| vendor_nm_en | 영문 상호 | 선택 |
| ceo_nm | 대표자명 | 필수 |
| vendor_type | 업태 | 예: 도소매 |
| vendor_item | 종목 | 예: 의류, 잡화 |
| vendor_class_cd | 업체구분 | SALE_CORP / SALE_INDIV 등 |
| vendor_bank_nm | 은행명 | 정산계좌 |
| vendor_bank_account | 계좌번호 | 암호화 저장 |
| vendor_bank_holder | 예금주 | |
| vendor_reg_url | 등록증 첨부 URL | |
| open_date | 개업일자 | DATE |
| contract_date | 계약일자 | DATE |
| vendor_status_cd | 상태 | VENDOR_STATUS |
| vendor_remark | 비고 | 500자 |

---

## 2. 판매업체사용자 (sy_vendor_user)

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
- **로그인 연결** (`user_id`): 연결 시 sy_user 1:1 매핑 → 시스템 로그인 가능 / NULL 시 비로그인 단순 담당자
- **UNIQUE 제약**: `(vendor_id, user_id)` — 동일 업체에 동일 user_id 중복 불가

#### 2-2. 대표 담당자 (`is_main`)
- 업체당 1명 권장 (시스템 강제 아님)
- `is_main = Y`: 정산·계약 관련 공식 연락 대상

#### 2-3. 역할·권한
- `role_id`: **SALE_ 접두어 역할**만 할당 (DLIV_/CS_/SITE_ 할당 불가)
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
- 한 `sy_user`가 여러 업체의 `sy_vendor_user`에 연결 가능
- 역할은 업체별로 별도 지정

### 주요 필드 (sy_vendor_user)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_user_id | 업체사용자ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_id | 판매업체ID | FK sy_vendor (SALE 계열), NOT NULL |
| user_id | 사용자ID | FK sy_user, NULL = 비로그인 |
| role_id | 역할ID | FK sy_role (SALE_ 역할 트리) |
| member_nm | 이름 | 50자, NOT NULL |
| position_cd | 직위/직책 | POSITION 코드 |
| vendor_user_dept_nm | 부서/팀명 | 100자 |
| vendor_user_phone | 사무실 전화 | |
| vendor_user_mobile | 휴대전화 | NOT NULL |
| vendor_user_email | 이메일 | NOT NULL |
| birth_date | 생년월일 | DATE |
| is_main | 대표 담당자 여부 | Y/N, 업체당 1명 권장 |
| auth_yn | 업체 관리권한 여부 | Y=업체 정보 수정 가능 |
| join_date | 합류 일자 | DATE |
| leave_date | 퇴직/탈퇴 일자 | DATE |
| vendor_user_status_cd | 상태 | VENDOR_MEMBER_STATUS |
| vendor_user_remark | 비고 | 500자 |

---

## 3. 권한 (SALE_ 역할 트리)

### 역할 구조
| 역할 코드 | 역할명 | 접근 범위 |
|----------|--------|----------|
| SALE_ADMIN | 판매업체 관리자 | 상품·주문·정산 조회+수정, 업체정보 수정(`auth_yn=Y` 필요) |
| SALE_ORDER | 판매업체 주문담당 | 주문·배송 조회+상태 변경 |
| SALE_PRODUCT | 판매업체 상품담당 | 상품·재고 조회+수정 |
| SALE_SETTLE | 판매업체 정산담당 | 정산 조회 전용 |
| SALE_READ | 판매업체 조회전용 | 자사 데이터 전체 조회만 가능 |

### 기능별 접근 제어

| 기능 | SALE_ADMIN | SALE_ORDER | SALE_PRODUCT | SALE_SETTLE | SALE_READ |
|------|:---:|:---:|:---:|:---:|:---:|
| 상품 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 상품 수정 | ✅ | ❌ | ✅ | ❌ | ❌ |
| 주문·배송 조회 | ✅ | ✅ | ❌ | ✅ | ✅ |
| 주문 상태 변경 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 정산 조회 | ✅ | ❌ | ❌ | ✅ | ✅ |
| 업체정보 수정 | `auth_yn=Y` | ❌ | ❌ | ❌ | ❌ |
| 담당자 관리 | ✅ | ❌ | ❌ | ❌ | ❌ |

### 주요 정책

#### 3-1. 업체 데이터 격리 원칙
- 자신의 `vendor_id`에 속한 데이터만 조회·수정 — API·쿼리 레이어 양쪽 적용
- 플랫폼 전체 데이터는 일반 관리자(`sy_user + sy_role`)만 접근 가능

#### 3-2. 역할 할당 규칙
- SALE_ 접두어 역할만 할당 가능
- 일반 관리자(ADMIN/OPERATOR 등) 및 DLIV_/CS_/SITE_ 역할 할당 불가
- 역할 없이 등록 가능 (비로그인 단순 담당자, 시스템 접근 불가)

#### 3-3. `auth_yn` vs `role_id`
| 구분 | 제어 대상 | 관리 주체 |
|------|----------|----------|
| `role_id` (역할) | 메뉴 접근, 기능 실행 권한 | 시스템 관리자가 역할-메뉴 매핑 설정 |
| `auth_yn = Y` | sy_vendor 기본정보 수정 가능 여부 | 관리자 개별 부여 |

#### 3-4. 권한 부여 절차
```
1. 관리자(ADMIN)가 sy_vendor_user 등록 또는 수정
2. role_id 지정 (SALE_ 역할 트리에서 선택)
3. 필요 시 auth_yn = Y 부여
4. user_id 연결 (로그인 활성화)
```

#### 3-5. 권한 회수 및 변경
- **역할 변경**: `role_id` 수정 → 즉시 반영 (캐시 초기화)
- **권한 회수**: `role_id = NULL` → 메뉴 접근 차단
- **로그인 차단**: `vendor_user_status_cd = SUSPENDED` 또는 `user_id` 연결 해제

#### 3-6. 감사 및 로그
- 주요 작업(상품 수정, 주문 상태 변경)은 변경 이력 테이블에 기록
- 권한 변경(`role_id`, `auth_yn` 수정)은 `sy_vendor_user` 변경 이력으로 추적

---

## 관련 관리자 화면
| pageId | 라벨 |
|--------|------|
| `syBizMng` | 시스템 > 업체 |
| `syBizUserMng` | 시스템 > 업체사용자 |
| `syRoleMng` | 시스템 > 역할관리 |
| `syMenuMng` | 시스템 > 메뉴관리 |
| `stConfigMng` | 정산 > 정산기준관리 |

## 제약사항
- `vendor_no` UNIQUE — 중복 등록 불가
- `CLOSED` 전환 전 미정산액 처리 완료 확인 필수
- `SUSPENDED` 중에도 기존 주문·배송 처리는 계속 진행
- `vendor_id` 데이터 격리는 API·쿼리 레이어 양쪽 강제
- `auth_yn = Y` 부여는 플랫폼 관리자만 가능
- 동일 업체에 동일 `user_id` 중복 불가
- `LEFT` 전환 후 재활성화 불가 (재등록 원칙)
- SALE_ 외 역할(DLIV_*/CS_*/SITE_*) 할당 불가

## 변경이력
- 2026-04-18: sy.21(업체)+sy.22(사용자)+sy.23(권한) 3개 파일 통합

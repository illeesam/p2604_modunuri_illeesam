# sy.13. 고객상담업체 · 사용자 · 권한 정책

## 목적
플랫폼과 계약하여 고객 상담·CS 업무를 담당하는 외부 업체(콜센터·CS 대행사),
소속 상담사·담당자 계정, 역할 기반 접근 제어(RBAC) 정책을 통합 정의.

## 관련 테이블
| 테이블명 | 설명 |
|---------|------|
| sy_vendor | 업체 공통 마스터 (vendor_class_cd = CS 계열) |
| sy_vendor_content | 업체 소개 내용 |
| sy_vendor_user | 고객상담업체 상담사/담당자 |
| sy_role | 역할 마스터 |
| sy_role_menu | 역할-메뉴 권한 매핑 |
| sy_contact | 1:1 문의 (상담사 처리 대상) |
| od_claim | 클레임 (상담사 조회 대상) |

---

## 1. 고객상담업체 (sy_vendor)

### 상태 코드

#### VENDOR_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PENDING | 대기 | 등록 후 승인 대기 |
| APPROVED | 승인 | 승인 완료, CS 업무 수행 가능 |
| SUSPENDED | 정지 | 계약 이슈·서비스 불량으로 일시 정지 |
| CLOSED | 종료 | 계약 종료, 신규 업무 배정 중단 |

#### VENDOR_CLASS (업체 구분)
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| CS_CALL | 콜센터 | 전화 상담 전문 업체 |
| CS_CHAT | 채팅상담 | 채팅·메시지 상담 전문 업체 |
| CS_TOTAL | 종합CS | 전화·채팅·이메일 통합 대응 |
| CS_CLAIM | CS클레임전문 | 클레임·환불 처리 전문 업체 |

### 주요 정책

#### 1-1. 등록
- **필수항목**: 사업자등록번호(`vendor_no`, UNIQUE), 상호(`vendor_nm`), 대표자명(`ceo_nm`), 대표 이메일, 대표 전화
- **필수서류**: 사업자등록증, 통장 사본, CS 서비스 계약서 → `vendor_reg_url`
- **계약항목**: 상담 채널(전화/채팅/이메일), 운영 시간(24h/주간), 상담사 투입 인원, 월 처리 목표 건수
- **초기 상태**: 등록 직후 `ACTIVE` (계약 승인 기준)

#### 1-2. CS 업무 범위
- **처리 가능**: 1:1 문의 답변(`sy_contact`), 클레임 1차 접수(`od_claim` REQUESTED 상태 처리)
- **처리 불가**: 환불 확정, 정산, 상품 수정, 회원 정보 직접 수정
- **에스컬레이션**: 처리 권한 외 건은 플랫폼 내부 운영자에게 이관

#### 1-3. 고객 데이터 접근 원칙
- **최소 권한 원칙**: 상담 처리에 필요한 데이터만 접근 허용
- **개인정보 보호**: 고객 연락처·결제정보는 마스킹 표시 (상담사 직접 열람 차단)
- **로그 기록**: 모든 고객 데이터 조회·처리 내역 감사 로그 보관

#### 1-4. 상태별 처리
- **APPROVED**: CS 업무 수행 가능, 상담사 계정 활성화 상태 유지
- **SUSPENDED**: 신규 업무 배정 중단, 진행 중 상담은 완료까지 처리 또는 이관
- **CLOSED**: 전면 중단, 모든 상담사 계정 접근 차단, 미처리 문의 이관

#### 1-5. 계약 해지
```
업체 요청 or 서비스 수준 미달 or 계약 만료
  → 진행 중 문의·클레임 이관 완료 확인
  → 모든 상담사 user_id 연결 해제
  → vendor_status_cd = CLOSED
```

### 주요 필드 (sy_vendor)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_id | 고객상담업체ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_no | 사업자등록번호 | UNIQUE, NOT NULL |
| vendor_nm | 상호/회사명 | 100자, NOT NULL |
| ceo_nm | 대표자명 | 필수 |
| vendor_class_cd | 업체구분 | CS_CALL / CS_CHAT / CS_TOTAL / CS_CLAIM |
| vendor_bank_nm | 은행명 | CS 서비스 대금 정산 계좌 |
| vendor_bank_account | 계좌번호 | 암호화 저장 |
| vendor_bank_holder | 예금주 | |
| vendor_reg_url | 등록증 첨부 URL | |
| contract_date | 계약일자 | DATE |
| vendor_status_cd | 상태 | VENDOR_STATUS |
| vendor_remark | 비고 | 500자 |

---

## 2. 고객상담사용자 (sy_vendor_user)

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
- **로그인 연결** (`user_id`): 연결 시 sy_user 1:1 매핑 → CS 포털 접근 / NULL 시 비로그인 단순 연락처 담당자
- **UNIQUE 제약**: `(vendor_id, user_id)` — 동일 업체에 동일 user_id 중복 불가

#### 2-2. 대표 담당자 / 팀장 (`is_main`)
- 업체당 1명 권장 (시스템 강제 아님)
- `is_main = Y`: CS팀장 또는 계약 담당자로 지정 — 운영 이슈 공식 연락 대상

#### 2-3. 역할·권한
- `role_id`: **CS_ 접두어 역할**만 할당 (SALE_/DLIV_/SITE_ 할당 불가)
- `auth_yn = Y`: sy_vendor 기본정보 수정 가능 (일반 상담사는 기본 N), 관리자가 부여·회수

#### 2-4. 재직 기간 관리
- `join_date`: 투입(합류) 일자 / `leave_date`: 퇴직/투입 종료 일자
- 퇴직 흐름: `leave_date 기록 → LEFT → user_id 연결 해제` (고객 데이터 접근 차단 위해 즉시 해제 권장)

#### 2-5. 상태 전환 규칙
```
ACTIVE → SUSPENDED  (관리자 일시 정지)
ACTIVE → LEFT       (퇴직/투입 종료)
SUSPENDED → ACTIVE  (정지 해제)
```
- `LEFT` 전환 후 재활성화 불가 (재등록 처리)
- `SUSPENDED` 처리 즉시 고객 데이터 접근 차단

#### 2-6. 다중 업체 소속
- 한 `sy_user`가 여러 CS업체의 `sy_vendor_user`에 연결 가능
- 역할은 업체별로 별도 지정

### 주요 필드 (sy_vendor_user)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_user_id | 고객상담사용자ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site |
| vendor_id | 고객상담업체ID | FK sy_vendor (CS 계열), NOT NULL |
| user_id | 사용자ID | FK sy_user, NULL = 비로그인 |
| role_id | 역할ID | FK sy_role (CS_ 역할 트리) |
| member_nm | 이름 | 50자, NOT NULL |
| position_cd | 직위/직책 | POSITION 코드 |
| vendor_user_dept_nm | 팀명 | 100자 |
| vendor_user_phone | 사무실 전화 | |
| vendor_user_mobile | 휴대전화 | NOT NULL |
| vendor_user_email | 이메일 | NOT NULL |
| is_main | 대표 담당자(팀장) 여부 | Y/N, 업체당 1명 권장 |
| auth_yn | 업체 관리권한 여부 | Y=CS업체 정보 수정 가능 |
| join_date | 투입(합류) 일자 | DATE |
| leave_date | 퇴직/투입 종료 일자 | DATE |
| vendor_user_status_cd | 상태 | VENDOR_MEMBER_STATUS |
| vendor_user_remark | 비고 | 500자 |

---

## 3. 권한 (CS_ 역할 트리)

### 역할 구조
| 역할 코드 | 역할명 | 접근 범위 |
|----------|--------|----------|
| CS_ADMIN | CS 관리자 | 문의·클레임 전체 조회+처리, 상담사 배정, 업체정보 수정(`auth_yn=Y` 필요) |
| CS_SENIOR | CS 선임상담사 | 문의·클레임 조회+처리, 에스컬레이션 처리, 환불 신청 접수 |
| CS_AGENT | CS 일반상담사 | 문의 조회+답변, 클레임 1차 접수 처리 |
| CS_READ | CS 조회전용 | 문의·주문·클레임 조회만 가능 |

### 기능별 접근 제어

| 기능 | CS_ADMIN | CS_SENIOR | CS_AGENT | CS_READ |
|------|:---:|:---:|:---:|:---:|
| 문의 조회 | ✅ | ✅ | ✅ | ✅ |
| 문의 답변 처리 | ✅ | ✅ | ✅ | ❌ |
| 클레임 조회 | ✅ | ✅ | ✅ | ✅ |
| 클레임 1차 접수 | ✅ | ✅ | ✅ | ❌ |
| 클레임 에스컬레이션 처리 | ✅ | ✅ | ❌ | ❌ |
| 환불 신청 접수 (이관용) | ✅ | ✅ | ❌ | ❌ |
| 주문·배송 조회 | ✅ | ✅ | ✅ | ✅ |
| 고객 기본정보 조회 (마스킹) | ✅ | ✅ | ✅ | ✅ |
| 상담사 배정 관리 | ✅ | ❌ | ❌ | ❌ |
| 업체정보 수정 | `auth_yn=Y` | ❌ | ❌ | ❌ |

### 주요 정책

#### 3-1. 고객 데이터 격리 및 최소 권한 원칙
- **접근 허용**: 고객이 문의·클레임을 제기한 건의 주문·배송·클레임 정보 조회
- **접근 차단**: 문의와 무관한 타 고객 데이터, 정산 데이터, 상품 원가 정보
- **개인정보 마스킹** (역할 무관 강제):
  - 고객 연락처: `010-****-5678` 형식
  - 결제 카드번호: `****-****-****-5678` 형식
  - 계좌번호: 전체 마스킹

#### 3-2. 역할 할당 규칙
- CS_ 접두어 역할만 할당 가능
- 일반 관리자(ADMIN/OPERATOR 등), SALE_*/DLIV_*/SITE_* 역할 할당 불가
- 역할 없이 등록 가능 (비로그인 단순 연락처 담당자, 시스템 접근 불가)

#### 3-3. `auth_yn` vs `role_id`
| 구분 | 제어 대상 | 관리 주체 |
|------|----------|----------|
| `role_id` (역할) | 메뉴 접근, 기능 실행 권한 | 시스템 관리자가 역할-메뉴 매핑 설정 |
| `auth_yn = Y` | CS업체 기본정보(sy_vendor) 수정 가능 여부 | 관리자 개별 부여 |

#### 3-4. CS 업무 처리 불가 항목
- 환불 확정 (od_pay 상태 직접 변경)
- 정산 데이터 조회·수정
- 상품 정보 수정
- 회원 개인정보 직접 수정
- 관리자 계정 생성·수정

#### 3-5. 에스컬레이션 처리
```
CS_AGENT 처리 한계 초과 or 환불 확정 필요
  → CS_SENIOR 또는 CS_ADMIN으로 이관
  → CS_ADMIN이 플랫폼 운영자에게 에스컬레이션
  → 플랫폼 운영자가 환불 확정·정산 처리
```

#### 3-6. 권한 부여 절차
```
1. 관리자(ADMIN)가 sy_vendor_user 등록 또는 수정
2. role_id 지정 (CS_ 역할 트리에서 선택)
3. 필요 시 auth_yn = Y 부여 (CS_ADMIN급 팀장만)
4. user_id 연결 (로그인 활성화)
```

#### 3-7. 권한 회수 및 변경
- **역할 변경**: `role_id` 수정 → 즉시 반영 (캐시 초기화)
- **권한 회수**: `role_id = NULL` → 메뉴 접근 차단
- **로그인 즉시 차단**: `SUSPENDED` 또는 `user_id` 연결 해제 (퇴직·정지 즉시 연결 해제 권장)

#### 3-8. 감사 및 로그
- CS사용자의 고객 데이터 조회·처리 내역은 모두 감사 로그에 기록
- 개인정보 조회 이력은 개인정보처리방침 기준으로 보관

---

## 관련 관리자 화면
| pageId | 라벨 |
|--------|------|
| `syBizMng` | 시스템 > 업체 |
| `syBizUserMng` | 시스템 > 업체사용자 |
| `syRoleMng` | 시스템 > 역할관리 |
| `syMenuMng` | 시스템 > 메뉴관리 |
| `syContactMng` | 고객센터 > 문의관리 |
| `odClaimMng` | 주문관리 > 클레임관리 |

## 제약사항
- `vendor_no` UNIQUE — 중복 등록 불가
- `CLOSED` 전환 전 미처리 문의·클레임 이관 완료 필수
- 고객 연락처·카드번호·계좌번호는 역할 무관하게 항상 마스킹 강제
- 환불 확정·정산·상품 수정은 CS 처리 권한 외
- `LEFT`·`SUSPENDED` 전환 즉시 user_id 연결 해제 권장 (고객 데이터 접근 차단)
- `vendor_id` 데이터 격리는 API·쿼리 레이어 양쪽 강제
- CS_ 외 역할(SALE_*/DLIV_*/SITE_*) 할당 불가

## 변경이력
- 2026-04-18: sy.31(업체)+sy.32(사용자)+sy.33(권한) 3개 파일 통합

# sy.15. 프로그램관리업체 · 사용자 · 권한 정책

## 목적
플랫폼 시스템의 개발·유지보수·기술지원을 담당하는 외부 업체(SI업체·유지보수 업체),
소속 개발자·기술지원 담당자 계정, 역할 기반 접근 제어(RBAC) 정책을 통합 정의.
플랫폼 전체 시스템에 대한 기술적 접근 권한을 가지는 고위험 계정군으로 엄격히 관리한다.

## 관련 테이블
| 테이블명 | 설명 |
|---------|------|
| sy_vendor | 업체 공통 마스터 (vendor_class_cd = PROG 계열) |
| sy_vendor_user | 프로그램관리업체 담당자/개발자 |
| sy_role | 역할 마스터 |
| sy_role_menu | 역할-메뉴 권한 매핑 |
| sy_api_log | API 호출 로그 (기술지원 접근 추적) |

---

## 1. 프로그램관리업체 (sy_vendor)

### 상태 코드

#### VENDOR_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PENDING | 대기 | 등록 후 보안 검토 대기 |
| APPROVED | 승인 | 계약 유효, 시스템 접근 가능 |
| SUSPENDED | 정지 | 계약 이슈로 일시 접근 차단 |
| CLOSED | 종료 | 계약 종료, 전 시스템 접근 차단 |

#### VENDOR_CLASS (업체 구분)
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PROG_SI | SI업체 | 시스템 구축·개발 전문 |
| PROG_MAINT | 유지보수업체 | 운영·유지보수 전담 |
| PROG_SUPPORT | 기술지원업체 | 장애 대응·기술지원 전담 |
| PROG_AUDIT | 보안감리업체 | 보안 감리·취약점 점검 |

### 주요 정책

#### 1-1. 등록
- **필수항목**: 사업자등록번호(`vendor_no`, UNIQUE), 상호(`vendor_nm`), 대표자명(`ceo_nm`), 대표 이메일, 대표 전화
- **필수서류**: 사업자등록증, 보안서약서, 기술지원 계약서, 담당 개발자 명단 → `vendor_reg_url`
- **계약항목**: 접근 가능 시스템 범위, 접근 방식(VPN/직접), SLA(장애 대응 기준), 보안 준수 사항
- **초기 상태**: 보안 검토 완료 후 `ACTIVE`
- **승인 주체**: SUPER_ADMIN만 등록·승인 가능

#### 1-2. 시스템 접근 원칙
- **최소 권한 원칙**: 계약 범위 내 시스템만 접근 허용
- **접근 방식**: VPN 또는 플랫폼 지정 채널을 통한 접근 (직접 서버 접근 차단 원칙)
- **접근 시간 제한**: 업무 시간(09:00~18:00) 또는 사전 승인된 시간대만 허용
- **모든 접근 로그**: `sy_api_log` + 별도 접근 로그 기록

#### 1-3. 보안 계약 요건
- **보안서약서**: 개발자별 별도 서명 필수
- **비밀유지협약(NDA)**: 플랫폼 데이터·소스코드 비밀 유지
- **개인정보 접근 제한**: 고객 개인정보 접근 시 별도 승인 필요

#### 1-4. 상태별 처리
- **APPROVED**: 계약 범위 내 시스템 접근 및 작업 가능
- **SUSPENDED**: 전 시스템 접근 즉시 차단, VPN 계정 비활성화
- **CLOSED**: 전면 차단, 모든 담당자 user_id 연결 해제, 발급된 인증서·토큰 폐기

#### 1-5. 계약 해지
```
계약 만료 or 업체 요청 or 보안 사고 발생
  → 진행 중 작업 인수인계 완료
  → 모든 담당자 user_id 연결 해제 + VPN 계정 폐기
  → 발급된 API 키·인증서 즉시 폐기
  → vendor_status_cd = CLOSED
```

### 주요 필드 (sy_vendor)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_id | 프로그램관리업체ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site (NULL = 전체 플랫폼) |
| vendor_no | 사업자등록번호 | UNIQUE, NOT NULL |
| vendor_nm | 상호/회사명 | 100자, NOT NULL |
| ceo_nm | 대표자명 | 필수 |
| vendor_class_cd | 업체구분 | PROG_SI / PROG_MAINT / PROG_SUPPORT / PROG_AUDIT |
| vendor_bank_nm | 은행명 | 기술지원 용역비 정산 계좌 |
| vendor_bank_account | 계좌번호 | 암호화 저장 |
| vendor_bank_holder | 예금주 | |
| vendor_reg_url | 등록증 첨부 URL | |
| contract_date | 계약일자 | DATE |
| vendor_status_cd | 상태 | VENDOR_STATUS |
| vendor_remark | 비고 | 500자 |

---

## 2. 프로그램관리업체사용자 (sy_vendor_user)

### 상태 코드

#### VENDOR_MEMBER_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| ACTIVE | 재직중 | 정상 활동, 시스템 접근 가능 |
| LEFT | 퇴직 | 퇴직/계약 종료, 즉시 접근 차단 |
| SUSPENDED | 정지 | 계정 일시 정지, 즉시 접근 차단 |

#### POSITION (직위/직책)
| 코드값 | 라벨 |
|--------|------|
| CEO | 대표 |
| DIRECTOR | 이사/PM |
| MANAGER | 팀장/PL |
| STAFF | 개발자/기술지원 |
| ETC | 기타 |

### 주요 정책

#### 2-1. 등록
- **필수항목**: 이름(`member_nm`), 휴대전화(`vendor_user_mobile`), 이메일(`vendor_user_email`)
- **필수 추가**: 보안서약서 서명 확인 후 등록 진행
- **로그인 연결** (`user_id`): 반드시 연결 필수 (비로그인 단순 담당자 등록 원칙적 금지)
- **UNIQUE 제약**: `(vendor_id, user_id)` — 동일 업체에 동일 user_id 중복 불가
- **승인 주체**: SUPER_ADMIN만 등록·활성화 가능

#### 2-2. 대표 담당자 / PM (`is_main`)
- 업체당 1명 권장 (PM 또는 기술 총괄)
- `is_main = Y`: 기술 이슈 공식 연락 대상, 보안 사고 발생 시 1차 연락처

#### 2-3. 역할·권한
- `role_id`: **PROG_ 접두어 역할**만 할당, **SUPER_ADMIN만** 할당 변경 가능
- 일반 관리자(ADMIN) 이하는 PROG_ 역할 할당 불가
- `auth_yn = Y`: sy_vendor 기본정보 수정 가능 (PM급만)

#### 2-4. 재직·계약 기간 관리
- `join_date`: 투입 시작일 / `leave_date`: 투입 종료일
- 퇴직·계약 종료 흐름:
  ```
  leave_date 기록 → LEFT
    → user_id 연결 즉시 해제 (필수)
    → VPN 계정 비활성화
    → 발급된 API키·인증서 폐기
  ```

#### 2-5. 상태 전환 규칙
```
ACTIVE → SUSPENDED  (보안 이슈·계약 위반·일시 정지)
ACTIVE → LEFT       (퇴직·계약 종료)
SUSPENDED → ACTIVE  (이슈 해소 후 재활성화)
```
- `LEFT` 전환 후 재활성화 불가 (재등록 처리)
- `SUSPENDED`·`LEFT` 전환 즉시 시스템 접근 차단 자동화 권장

#### 2-6. 접근 기록 의무
- 모든 시스템 접근은 `sy_api_log`에 자동 기록
- 고객 개인정보 접근 시 별도 접근 사유 기록 필수
- 주요 작업(DB 수정·배포·설정 변경) 완료 후 작업 보고서 제출

### 주요 필드 (sy_vendor_user)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_user_id | 프로그램관리사용자ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 사이트ID | FK sy_site (NULL = 전체 플랫폼) |
| vendor_id | 프로그램관리업체ID | FK sy_vendor (PROG 계열), NOT NULL |
| user_id | 사용자ID | FK sy_user, 반드시 연결 필수 |
| role_id | 역할ID | FK sy_role (PROG_ 역할 트리) |
| member_nm | 이름 | 50자, NOT NULL |
| position_cd | 직위/직책 | POSITION 코드 |
| vendor_user_dept_nm | 소속팀명 | 100자 |
| vendor_user_mobile | 휴대전화 | NOT NULL |
| vendor_user_email | 이메일 | NOT NULL |
| is_main | 대표 담당자(PM) 여부 | Y/N, 업체당 1명 권장 |
| auth_yn | 업체 관리권한 여부 | Y=업체 정보 수정 가능 (PM급) |
| join_date | 투입 시작일 | DATE |
| leave_date | 투입 종료일 | DATE |
| vendor_user_status_cd | 상태 | VENDOR_MEMBER_STATUS |
| vendor_user_remark | 비고 | 500자 |

---

## 3. 권한 (PROG_ 역할 트리)

### 역할 구조

프로그램관리업체 사용자용 역할은 모든 타 역할 트리와 **별도**로 구성하며,
SUPER_ADMIN만 역할 할당 가능하다.

| 역할 코드 | 역할명 | 접근 범위 |
|----------|--------|----------|
| PROG_ADMIN | 프로그램 총괄 관리자 | 플랫폼 전체 시스템 조회+수정, 배포 권한, 설정 변경, 담당자 관리 |
| PROG_DEV | 개발·유지보수 담당 | 기능 개발·수정, 로그 조회, 테스트 데이터 관리 |
| PROG_SUPPORT | 기술지원 담당 | 장애 조회·분석, 로그 조회, 설정 조회 (수정 불가) |
| PROG_AUDIT | 보안감리 담당 | 전체 시스템 조회 전용, 로그·이력·설정 감사 목적 접근 |

### 기능별 접근 제어

| 기능 | PROG_ADMIN | PROG_DEV | PROG_SUPPORT | PROG_AUDIT |
|------|:---:|:---:|:---:|:---:|
| 전체 메뉴 조회 | ✅ | ✅ | ✅ | ✅ |
| 기능 수정·배포 | ✅ | ✅ | ❌ | ❌ |
| 시스템 설정 변경 | ✅ | ❌ | ❌ | ❌ |
| API 로그 조회 | ✅ | ✅ | ✅ | ✅ |
| 에러 로그 조회 | ✅ | ✅ | ✅ | ✅ |
| 배치 스케줄 관리 | ✅ | ✅ | ❌ | ❌ |
| 공통코드 수정 | ✅ | ✅ | ❌ | ❌ |
| 사용자·권한 조회 | ✅ | ✅ | ✅ | ✅ |
| 사용자·권한 수정 | ✅ | ❌ | ❌ | ❌ |
| 고객 개인정보 조회 | 별도 승인 | 별도 승인 | ❌ | 별도 승인 |
| 업체정보 수정 | `auth_yn=Y` | ❌ | ❌ | ❌ |

### 주요 정책

#### 3-1. 최소 권한 원칙
- **업무 범위 내 최소 역할 할당**: 기술지원이면 PROG_SUPPORT, 개발 작업이면 PROG_DEV
- **PROG_ADMIN 제한적 부여**: PM 또는 기술 총괄에게만 부여, 일반 개발자에게 부여 금지
- **한시적 상위 권한**: 특정 작업(배포·장애 대응) 시 임시 권한 부여 → 작업 완료 즉시 회수

#### 3-2. 역할 할당 규칙
- PROG_ 역할 할당·변경은 **SUPER_ADMIN만** 가능
- 일반 관리자(ADMIN) 이하는 PROG_ 역할 할당 불가
- 타 업체 역할(SALE_*/DLIV_*/CS_*/SITE_*) 동시 보유 불가

#### 3-3. 고객 개인정보 접근 특례
- 어떤 PROG_ 역할이든 고객 개인정보(연락처·결제정보·주소) 접근은 **SUPER_ADMIN 사전 승인 필수**
- 승인 후에도 마스킹 해제는 최소 범위·최소 시간으로 제한
- 접근 사유·접근 시간·접근 데이터 범위를 별도 기록

#### 3-4. 한시적 고위험 권한 부여
```
고위험 작업 요청 (배포·DB 직접 수정·설정 변경 등)
  → SUPER_ADMIN에게 작업 계획서 제출
  → 승인 후 임시 권한 부여 (time-boxed)
  → 작업 완료 즉시 권한 회수
  → 작업 보고서 제출 (변경 내역 명시)
```

#### 3-5. `auth_yn` vs `role_id`
| 구분 | 제어 대상 | 관리 주체 |
|------|----------|----------|
| `role_id` (역할) | 메뉴 접근, 기능 실행 권한 | SUPER_ADMIN만 역할-메뉴 매핑 설정 |
| `auth_yn = Y` | sy_vendor 기본정보 수정 가능 여부 | SUPER_ADMIN 개별 부여 |

#### 3-6. 권한 부여 절차
```
1. SUPER_ADMIN이 sy_vendor_user 등록 (보안서약 확인 후)
2. role_id 지정 (PROG_ 역할 트리, 최소 권한 원칙)
3. 필요 시 auth_yn = Y 부여 (PM급만)
4. user_id 연결 (로그인 활성화)
5. VPN 계정 발급 + 접근 안내
```

#### 3-7. 권한 회수 및 변경
- **역할 변경**: SUPER_ADMIN이 `role_id` 수정 → 즉시 반영 (캐시 초기화)
- **즉시 차단**: `SUSPENDED` 또는 `LEFT` → user_id 연결 해제 + VPN 비활성화
- **계약 종료**: 업체 `CLOSED` 전환 시 전 담당자 user_id + VPN + API키 일괄 폐기

#### 3-8. 감사 및 로그 (강화)
- **모든 API 호출**: `sy_api_log` 자동 기록 (요청자·시각·IP·요청 내용·응답)
- **고위험 작업**: 별도 작업 이력 테이블 기록 (변경 전·후 스냅샷)
- **로그 보관**: 최소 3년 이상 (법적 요건 준수)
- **로그 무결성**: 로그 삭제·변조 불가 정책 적용

---

## 관련 관리자 화면
| pageId | 라벨 |
|--------|------|
| `syBizMng` | 시스템 > 업체 (SUPER_ADMIN 접근) |
| `syBizUserMng` | 시스템 > 업체사용자 (SUPER_ADMIN 전용) |
| `syRoleMng` | 시스템 > 역할관리 (PROG_ 역할 트리 관리) |
| `syBatchMng` | 시스템 > 배치스케줄관리 |

## 제약사항
- 등록·승인은 SUPER_ADMIN만 가능
- `vendor_no` UNIQUE — 중복 등록 불가
- `user_id` 연결 필수 (비로그인 담당자 등록 금지)
- PROG_ 역할 할당·변경은 SUPER_ADMIN만 가능
- 고객 개인정보 접근은 역할 무관, SUPER_ADMIN 사전 승인 필수
- `SUSPENDED`·`LEFT` 전환 즉시 user_id + VPN 비활성화 (자동화 처리 권장)
- 한시적 고위험 권한은 작업 완료 즉시 회수 (유예 시간 없음)
- `CLOSED` 전환 즉시 VPN·API키·인증서 폐기 필수
- 로그 보관 최소 3년, 삭제·변조 불가
- 타 업체 역할(SALE_*/DLIV_*/CS_*/SITE_*) 동시 보유 불가
- 보안서약서 서명 미확인 시 등록 불가

## 변경이력
- 2026-04-18: sy.91(업체)+sy.92(사용자)+sy.93(권한) 3개 파일 통합

# sy.11. 사이트운영업체 · 사용자 · 권한 정책

## 목적
플랫폼과 계약하여 특정 사이트(`sy_site`)를 위탁 운영하는 사이트운영업체,
소속 담당자·실무자 계정, 역할 기반 접근 제어(RBAC) 정책을 통합 정의.

## 관련 테이블
| 테이블명 | 설명 |
|---------|------|
| sy_vendor | 업체 공통 마스터 (vendor_class_cd = SITE 계열) |
| sy_site | 위탁 운영 대상 사이트 (site_id 연결) |
| sy_vendor_content | 업체 소개 내용 |
| sy_vendor_user | 사이트운영업체 담당자/실무자 |
| sy_role | 역할 마스터 |
| sy_role_menu | 역할-메뉴 권한 매핑 |

---

## 1. 사이트운영업체 (sy_vendor)

### 상태 코드

#### VENDOR_STATUS
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| PENDING | 대기 | 등록 후 승인 대기 |
| APPROVED | 승인 | 승인 완료, 사이트 운영 가능 |
| SUSPENDED | 정지 | 계약 이슈로 일시 정지 |
| CLOSED | 종료 | 계약 종료, 운영 권한 회수 |

#### VENDOR_CLASS (업체 구분)
| 코드값 | 라벨 | 설명 |
|--------|------|------|
| SITE_FULL | 종합운영 | 상품·전시·주문·CS 전체 운영 |
| SITE_CONTENT | 콘텐츠운영 | 전시·이벤트·콘텐츠 운영 전문 |
| SITE_SALE | 판매운영 | 상품·주문·정산 운영 전문 |

### 주요 정책

#### 1-1. 등록
- **필수항목**: 사업자등록번호(`vendor_no`, UNIQUE), 상호(`vendor_nm`), 대표자명(`ceo_nm`), 대표 이메일, 대표 전화
- **필수서류**: 사업자등록증, 통장 사본, 사이트 위탁운영 계약서 → `vendor_reg_url`
- **계약항목**: 운영 대상 사이트(`site_id`), 운영 범위(상품/전시/주문/CS), 운영 수수료, 계약 기간
- **초기 상태**: 계약 승인 후 `ACTIVE`

#### 1-2. 사이트 연결 원칙
- **1:1 원칙**: 운영업체 1개 ↔ 사이트 1개 (기본)
- 동일 법인이 다수 사이트 운영 시 업체별 별도 등록

#### 1-3. 운영 범위
- **허용**: 해당 사이트의 상품 등록·전시 구성·주문 관리·CS 처리
- **불가**: 플랫폼 전체 설정, 타 사이트 데이터 접근, 정산 기준 직접 수정

#### 1-4. 상태별 처리
- **APPROVED**: 사이트 운영 가능, 담당자 계정 활성화 상태 유지
- **SUSPENDED**: 사이트 운영 일시 중단, 플랫폼 관리자가 임시 운영 대행
- **CLOSED**: 운영 권한 전면 회수, 전 담당자 계정 접근 차단

#### 1-5. 운영 수수료 정산
- 사이트 매출 기준 별도 협의, 월 1회 정산 (`st_settle` 연계)
- 정산계좌 변경: 월 1회 신청 후 관리자 확인

#### 1-6. 계약 해지
```
운영업체 요청 or 운영 기준 미달 or 계약 만료
  → 미처리 주문·클레임 플랫폼 이관
  → 모든 담당자 user_id 연결 해제
  → vendor_status_cd = CLOSED
  → site_id 운영 주체를 플랫폼으로 전환
```

### 주요 필드 (sy_vendor)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_id | 사이트운영업체ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 운영 대상 사이트ID | FK sy_site |
| vendor_no | 사업자등록번호 | UNIQUE, NOT NULL |
| vendor_nm | 상호/회사명 | 100자, NOT NULL |
| ceo_nm | 대표자명 | 필수 |
| vendor_class_cd | 업체구분 | SITE_FULL / SITE_CONTENT / SITE_SALE |
| vendor_bank_nm | 은행명 | 운영 수수료 정산 계좌 |
| vendor_bank_account | 계좌번호 | 암호화 저장 |
| vendor_bank_holder | 예금주 | |
| vendor_reg_url | 등록증 첨부 URL | |
| contract_date | 계약일자 | DATE |
| vendor_status_cd | 상태 | VENDOR_STATUS |
| vendor_remark | 비고 | 500자 |

---

## 2. 사이트운영업체사용자 (sy_vendor_user)

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
- **로그인 연결** (`user_id`): 연결 시 sy_user 1:1 매핑 → 운영 어드민 접근 / NULL 시 비로그인 단순 연락처 담당자
- **UNIQUE 제약**: `(vendor_id, user_id)` — 동일 업체에 동일 user_id 중복 불가

#### 2-2. 대표 담당자 (`is_main`)
- 업체당 1명 권장 (시스템 강제 아님)
- `is_main = Y`: 사이트 운영 총괄, 계약 관련 공식 연락 대상

#### 2-3. 역할·권한
- `role_id`: **SITE_ 접두어 역할**만 할당 (SALE_/DLIV_/CS_ 할당 불가)
- `auth_yn = Y`: sy_vendor 기본정보 수정 가능 (총괄급만), 관리자가 부여·회수

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

#### 2-6. 다중 사이트 운영 인력
- 한 `sy_user`가 여러 사이트운영업체의 `sy_vendor_user`에 연결 가능
- 역할은 업체별로 별도 지정

### 주요 필드 (sy_vendor_user)
| 필드 | 설명 | 규칙 |
|------|------|------|
| vendor_user_id | 사이트운영사용자ID (PK) | YYMMDDhhmmss+rand4 |
| site_id | 운영 대상 사이트ID | FK sy_site |
| vendor_id | 사이트운영업체ID | FK sy_vendor (SITE 계열), NOT NULL |
| user_id | 사용자ID | FK sy_user, NULL = 비로그인 |
| role_id | 역할ID | FK sy_role (SITE_ 역할 트리) |
| member_nm | 이름 | 50자, NOT NULL |
| position_cd | 직위/직책 | POSITION 코드 |
| vendor_user_dept_nm | 부서/팀명 | 100자 |
| vendor_user_phone | 사무실 전화 | |
| vendor_user_mobile | 휴대전화 | NOT NULL |
| vendor_user_email | 이메일 | NOT NULL |
| is_main | 대표 담당자(총괄) 여부 | Y/N, 업체당 1명 권장 |
| auth_yn | 업체 관리권한 여부 | Y=운영업체 정보 수정 가능 |
| join_date | 합류 일자 | DATE |
| leave_date | 퇴직/탈퇴 일자 | DATE |
| vendor_user_status_cd | 상태 | VENDOR_MEMBER_STATUS |
| vendor_user_remark | 비고 | 500자 |

---

## 3. 권한 (SITE_ 역할 트리)

### 역할 구조
| 역할 코드 | 역할명 | 접근 범위 |
|----------|--------|----------|
| SITE_ADMIN | 사이트 총괄 관리자 | 담당 사이트 전체 운영, 업체정보 수정(`auth_yn=Y` 필요) |
| SITE_OPER | 사이트 운영 담당 | 상품·주문·배송·클레임 조회+처리 |
| SITE_CONTENT | 사이트 콘텐츠 담당 | 전시·이벤트·공지 조회+수정 |
| SITE_READ | 사이트 조회전용 | 담당 사이트 전체 데이터 조회만 가능 |

### 기능별 접근 제어

| 기능 | SITE_ADMIN | SITE_OPER | SITE_CONTENT | SITE_READ |
|------|:---:|:---:|:---:|:---:|
| 상품 조회 | ✅ | ✅ | ✅ | ✅ |
| 상품 등록·수정 | ✅ | ✅ | ❌ | ❌ |
| 전시·이벤트 조회 | ✅ | ✅ | ✅ | ✅ |
| 전시·이벤트 수정 | ✅ | ❌ | ✅ | ❌ |
| 주문·배송 조회 | ✅ | ✅ | ❌ | ✅ |
| 주문 상태 변경 | ✅ | ✅ | ❌ | ❌ |
| 클레임 조회·처리 | ✅ | ✅ | ❌ | ✅ |
| 고객문의 답변 | ✅ | ✅ | ❌ | ❌ |
| 정산 조회 | ✅ | ❌ | ❌ | ✅ |
| 공지사항 관리 | ✅ | ❌ | ✅ | ❌ |
| 담당자 관리 | ✅ | ❌ | ❌ | ❌ |
| 업체정보 수정 | `auth_yn=Y` | ❌ | ❌ | ❌ |

### 주요 정책

#### 3-1. 사이트 데이터 격리 원칙
- 계약된 `site_id` 데이터만 조회·처리 가능 — API·쿼리 레이어 양쪽 강제 적용
- 타 사이트 데이터 접근 차단

#### 3-2. 역할 할당 규칙
- SITE_ 접두어 역할만 할당 가능
- 일반 관리자(ADMIN/OPERATOR), 판매업체(SALE_*), 배송업체(DLIV_*), CS업체(CS_*) 역할 할당 불가
- 역할 없이 등록 가능 (비로그인 단순 연락처 담당자, 시스템 접근 불가)

#### 3-3. `auth_yn` vs `role_id`
| 구분 | 제어 대상 | 관리 주체 |
|------|----------|----------|
| `role_id` (역할) | 메뉴 접근, 기능 실행 권한 | 시스템 관리자가 역할-메뉴 매핑 설정 |
| `auth_yn = Y` | sy_vendor 기본정보 수정 가능 여부 | 관리자 개별 부여 |

- `auth_yn = Y`이더라도 역할이 없으면 메뉴 접근 불가
- `SITE_ADMIN` 역할이더라도 `auth_yn = N`이면 업체 기본정보 수정 불가

#### 3-4. 처리 불가 항목
- `sy_site` 직접 수정 (도메인·테마·사이트 기본 설정)
- 플랫폼 전체 수수료·정산 기준 변경
- 타 사이트 데이터 조회·수정
- 관리자 계정(sy_user) 생성·수정
- 플랫폼 공통코드(sy_code) 수정

#### 3-5. 권한 부여 절차
```
1. 관리자(ADMIN)가 sy_vendor_user 등록 또는 수정
2. role_id 지정 (SITE_ 역할 트리에서 선택)
3. 필요 시 auth_yn = Y 부여 (SITE_ADMIN급 총괄만)
4. user_id 연결 (로그인 활성화)
```

#### 3-6. 권한 회수 및 변경
- **역할 변경**: `role_id` 수정 → 즉시 반영 (캐시 초기화)
- **권한 회수**: `role_id = NULL` → 메뉴 접근 차단
- **로그인 차단**: `vendor_user_status_cd = SUSPENDED` 또는 `user_id` 연결 해제
- **계약 종료**: 업체 `CLOSED` 전환 시 전 담당자 user_id 연결 일괄 해제

#### 3-7. 감사 및 로그
- 주요 작업(상품 수정, 주문 상태 변경, 전시 수정)은 변경 이력 테이블에 기록
- 권한 변경(`role_id`, `auth_yn` 수정)은 `sy_vendor_user` 변경 이력으로 추적

---

## 관련 관리자 화면
| pageId | 라벨 |
|--------|------|
| `syBizMng` | 시스템 > 업체 |
| `syBizUserMng` | 시스템 > 업체사용자 |
| `sySiteMng` | 시스템 > 사이트관리 |
| `syRoleMng` | 시스템 > 역할관리 |
| `syMenuMng` | 시스템 > 메뉴관리 |

## 제약사항
- `vendor_no` UNIQUE — 중복 등록 불가
- `CLOSED` 전환 전 미처리 주문·클레임 플랫폼 이관 완료 필수
- `site_id` 데이터 격리는 API·쿼리 레이어 양쪽 강제
- `sy_site` 직접 수정·플랫폼 전체 설정은 처리 범위 외
- `auth_yn = Y` 부여는 플랫폼 관리자만 가능
- 동일 업체에 동일 `user_id` 중복 불가
- `LEFT` 전환 후 재활성화 불가 (재등록 원칙)
- SITE_ 외 역할(SALE_*/DLIV_*/CS_*) 할당 불가

## 변경이력
- 2026-04-18: sy.11(업체)+sy.12(사용자)+sy.13(권한) 3개 파일 통합

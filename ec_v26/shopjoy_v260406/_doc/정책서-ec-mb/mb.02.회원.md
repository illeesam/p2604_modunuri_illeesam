# 221. 회원 관리 정책

## 목적
고객 회원 가입, 관리, 상태 변경에 대한 정책 정의

## 범위
- 회원 등급 관리
- 회원 상태 관리
- 회원 로그인 이력 추적

## 회원 상태 (MEMBER_STATUS)
| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | ACTIVE | 정상 활동 중인 회원 |
| 휴면 | DORMANT | 일정기간 미접속 회원 |
| 정지 | SUSPENDED | 관리자 의해 정지된 회원 |
| 탈퇴 | WITHDRAWN | 탈퇴한 회원 |

## 회원 등급 (MEMBER_GRADE)
| 등급 | 코드 | 혜택 |
|------|------|------|
| 일반 | BASIC | 기본 회원 |
| 실버 | SILVER | 누적 구매액 100만원 이상 |
| 골드 | GOLD | 누적 구매액 500만원 이상 |
| VIP | VIP | 누적 구매액 1000만원 이상 |

## 주요 정책

### 1. 회원 가입
- **필수항목**: 이메일, 비밀번호, 이름, 연락처
- **이메일**: 중복 방지, 로그인 ID로 사용
- **초기상태**: ACTIVE
- **초기등급**: BASIC

### 2. 회원 상태 관리
- **ACTIVE → DORMANT**: 1년 미접속 자동 전환
- **SUSPENDED**: 관리자 수동 정지 (부정행위, 약관위반 등)
- **WITHDRAWN**: 탈퇴 신청 시 상태 변경
  - 탈퇴 후 30일 이내 데이터 유지
  - 30일 후 개인정보 삭제

### 3. 등급 관리
- **자동 계산**: 누적 구매액 기준 월 1회 자동 업데이트
- **수동 조정**: 관리자 수동 변경 가능
- **등급 다운**: 누적액이 기준 이하로 내려가면 자동 다운

### 4. 로그인 관리
- **로그인 이력 추적**: mb_member_login_log 기록
- **로그인 토큰**: ec_member_token_log로 세션 관리
- **중복 로그인**: 허용 (다중 디바이스)
- **토큰 만료**: 30일

### 5. 개인정보 보호
- **암호화**: 비밀번호는 bcrypt 암호화 저장
- **민감정보**: 연락처, 주소는 암호화 저장
- **접근제어**: 본인 정보만 열람 가능

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| member_id | 회원ID | YYMMDDhhmmss+rand4 |
| member_email | 이메일 | 영문소문자, @포함, UNIQUE |
| member_password | 비밀번호 | bcrypt 해시 |
| member_status_cd | 상태 | MEMBER_STATUS 코드 |
| member_status_cd_before | 변경전상태 | 상태변경 추적 |
| grade_cd | 등급 | MEMBER_GRADE 코드 |
| last_login | 최근로그인 | TIMESTAMP |
| order_count | 누적주문수 | 정수, 기본값 0 |
| total_purchase_amt | 누적구매액 | BIGINT, 기본값 0 |
| cache_balance_amt | 캐시잔액 | BIGINT, 기본값 0 |

### 6. SNS 연동 (mb_sns_member)
- 지원 채널: KAKAO / NAVER / GOOGLE / APPLE (코드: SNS_CHANNEL)
- 1 회원 = 동일 채널 1개만 연동 가능 (UNIQUE: member_id + sns_channel_cd)
- sns_user_id: SNS 플랫폼 제공 사용자 고유 ID

### 7. 앱 디바이스 토큰 (mb_dvc_token)
- 앱 푸시 알림을 위한 기기 토큰 저장
- PK: device_token + site_id (기기 변경 시 갱신)
- os_type: ANDROID / IOS
- benefit_noti_yn: 혜택 알림 수신 여부 (마케팅 동의 연동)

### 8. 회원 그룹 (mb_member_group / mb_member_group_map)
- 관리자가 임의로 만드는 그룹 (프로모션 타겟, VIP 클럽 등)
- 1 회원이 복수 그룹 소속 가능
- mb_member_group_map: 회원-그룹 다대다 매핑

## 관련 테이블
- mb_member: 회원 기본 정보
- mb_member_grade: 회원등급 정의 (grade_cd, save_rate, min_purchase_amt)
- mb_member_group: 회원그룹
- mb_member_group_map: 회원-그룹 매핑
- mb_sns_member: SNS 연동 정보
- mb_dvc_token: 앱 디바이스 토큰
- mb_member_login_log: 로그인 이력
- mb_member_token_log: 토큰/세션 관리

## 변경이력
- 2026-04-18: SNS연동, 디바이스토큰, 회원그룹, 회원등급 테이블 추가
- 2026-04-16: 초기 작성

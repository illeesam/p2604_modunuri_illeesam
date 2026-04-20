# ec-mb/ 회원 도메인 DDL

## SQL 파일 목록
- `mb_member.sql` — 회원 마스터 (PK: member_id)
- `mb_member_addr.sql` — 회원 배송지
- `mb_like.sql` — 찜 목록 (FK: member_id + prod_id)
- `mb_member_grade.sql` — 회원등급 (grade_cd, save_rate, min_purchase_amt)
- `mb_member_group.sql` — 회원그룹 + mb_member_group_map (회원-그룹 매핑)
- `mb_device_token.sql` — 앱 디바이스 토큰 (PK: device_token_id, UNIQUE: device_token+site_id)
- `mb_sns_member.sql` — SNS 연동 (sns_channel_cd: KAKAO/NAVER/GOOGLE/APPLE)
- `mbh_member_login_hist.sql` — 로그인 이력
- `mbh_member_login_log.sql` — 로그인 로그 *(log 예외)*
- `mbh_member_token_log.sql` — 토큰 로그 *(log 예외)*

## 상태 코드
- `member_status_cd`: ACTIVE / DORMANT / SUSPENDED / WITHDRAWN

## 컬럼명 주의
- 이메일: `member_email` (단일 단어 → 프리픽스 필수)
- 이름: `member_nm`
- 연락처: `member_phone`

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `mbMemberMng` | 회원관리 > 회원관리 | mb_member, mb_member_addr, mb_like |
| `mbCustInfoMng` | 고객센터 > 고객종합정보 | mb_member + 주문/클레임/캐시/쿠폰 등 통합 |
| `syMemberLoginHist` | 시스템 > 회원로그인이력 | mb_member_login_hist, mb_member_login_log |

## 관련 정책서
- `_doc/정책서ec/mb.01.회원.md`
- `_doc/정책서ec/mb.02.회원등급그룹.md`
